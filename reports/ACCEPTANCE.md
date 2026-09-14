# ACCEPTANCE — recette finale navigateur du MVP à données fictives (PLAN-3 §3.5, porte G9) — **rev 3**

| | |
|---|---|
| **Date** | **2026-09-14, 00:07 → 01:05 UTC** (rev 3) ; rev 2 le 2026-09-08 sur `947dbc4` (porte G8) ; rev 1 le 2026-09-08 sur `1424dc3` |
| **Commit recetté** | **`df574ed`** (`df574ed189b7090ef517d90f99c85e6165710116`), branche `claude/kycar-project-ffcplk`, arbre propre au départ ; personne d'autre sur la machine (condition des mesures de budget) |
| **Agent** | `acceptance` rev 3 — modèle Fable, effort **max** ; indépendant des correcteurs (R5) : n'a écrit ni le harnais, ni le provider, ni les corrections |
| **Navigateur / outillage** | Chromium **141.0.7390.37** (build Playwright `chromium-1194`, `/opt/pw-browsers`, aucun `playwright install`) ; `@playwright/test` 1.63.0 ; `@axe-core/playwright` 4.13.0 (tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`) ; Node 22.22.2 ; 4 cœurs, 16 Gio |
| **Projets / viewports** | `desktop` 1280 × 800 · `tablet` 768 × 1024 · `mobile` 360 × 740 (`isMobile`, `hasTouch`) ; `fr-BE`, `Europe/Brussels` |
| **Serveurs** | suite : `npm run test:e2e` = build de production + `vite preview --port 4180 --strictPort`, `reuseExistingServer: false` (ports 4180–4182 vérifiés libres) ; mesures ad hoc : mon propre `vite preview --port 4173 --strictPort` sur le **même `dist/`** (scripts Playwright/CDP hors dépôt, scratchpad de session), jamais en parallèle d'une mesure de budget |
| **Source par défaut** | **`fixture:test`** (D3-01) : 3 snapshots × 20 000 annonces fictives à la forme AutoScout24 ; snapshot servi = le plus récent, `be-20260921T060000Z` (20 000 lignes, **19 986** servies, 14 doublons d'identifiant arbitrés, 0 rejet) ; `baseline.json` précalculée (D3-31) 121 Kio (≈ 15 Kio transférés) ; NDJSON 2 680 Kio gzip chargé en arrière-plan |
| **Build** | `npm run build` : `tsc` app + worker, `vite build` 162 modules — **0 erreur, 0 warning** ; `npm run size` : entrée **121,91 Kio** gzip + worker 13,90 Kio = **135,81 / 300 Kio** (`EX-NFR-10`), différé 0 / 400 Kio |
| **Portes rejouées** | `test:contract` **105/105** · `test:data` **153/153** (profil `test`) et **153/153** (profil `dev`) · `data:validate` **conforme** (`test` 8 180 881 / 8 388 608 octets gz ; `dev` 2 083 639 / 2 097 152) · `data:baseline --check` **artefacts conformes** (3 + 3 snapshots) · banc `recalc.perf.test.ts` **5/5** |
| **Écrits par cette recette** | ce rapport (rev 3 en partie I, rev 2 et rev 1 conservées en partie II) ; **22 captures `reports/acceptance/R3-*.png`** (2,2 Mo ; les 18 captures des rev 1/2 sont conservées) ; `reports/e2e/results.json` régénéré par la suite (D8-33). Aucun fichier de `src/`, `tests/`, `tools/`, `data/`, `docs/` touché |

Sources lues avant la recette : `reports/ACCEPTANCE.md` rev 2 ; `PLAN-3` §3.5 ; `CLAUDE.md` §4.6–4.7 ; `DATA-LEAD-DECISIONS.md` D3-01…D3-40 ; `mvp-integrate.md`, `fixture-perf.md`, `fix-screens-3.md`, `data-fix-2.md`, `fix-providers-3.md`, `fix-screens-4.md`, `DATA-REVIEW.md` §10 ; `00-CONTEXT.md` ; `draft-data-dictionary.md` (EX-DATA-15/19/25/60/62/63/64/68/107), `draft-screens.md` (EX-SCR-33/56/107/109/112/113/122/135/137/142/181), `draft-behaviour.md` (EX-NFR-5…9, 21…23) ; `tests/e2e/README.md`, `_helpers.ts`, `_expected.ts` (vérifié : **aucun attendu figé**, tout est dérivé des fixtures par le câblage de production ; seuls les budgets et formats normatifs sont des constantes) ; `src/providers/registry.ts` ; `DEV.md`.

---

## 0. Rev 3 — ce qui a changé depuis la rev 2

La rev 2 recettait le provider **synthétique** (100 000 annonces générées à la volée, porte G8). La rev 3 recette le **MVP à données fictives** : provider `FixtureDataProvider` par défaut, baseline précalculée, quantiles de type 7 sur tout le produit, axe année = première immatriculation, finition 2.10 fusionnée, lots C-R1-01…05, DR3-20…24.

| Où | Rev 2 (`947dbc4`, synthétique) | **Rev 3 (`df574ed`, `fixture:test`)** |
|---|---|---|
| Suite E2E (§2) | 264 tests : 251 verts, 3 attendus, 10 sautés | **351 tests (117 × 3) : 323 verts, 3 échecs attendus (D8-15, un par projet), 25 sautés (régimes hors projet, tous motivés), 0 inattendu, 0 instable, 27,1 min** |
| Source affichée (§4, §8) | « Données synthétiques de démonstration… » | « **Jeu de données fictif à la forme AutoScout24 (profil test, 3 snapshots) — aucune annonce réelle.** » sur A/B/D, pied de page sans attribution à AutoScout24, `/mentions`, Diagnostic `FIXTURE`, en-tête CSV `# snapshot;…;FIXTURE` ; bascule `?provider=fixture:dev` / `synthetic` sincère ; `?provider=inconnu` → `ET-SOURCE-REPLI` |
| Parcours P1 (§4.1) | 107 marques / 2 632 offres ; Golf 60 → 1 001 | **31 marques · 69 modèles · 146 offres** ; VW 21 · Renault 17 · Opel 14 ; zone Polo 15 → écran B Polo 149 offres avec bandeau « Filtre Carrosserie non appliqué » ; **égal au recalcul indépendant** (146 / 31 / 69, cartes et fourchettes à l'unité) |
| Parcours P2 (§4.2) | Corsa 1 352 → 508 (≤ 20 000 €) → 54 (2017) | **Corsa 355 → 331 → 26** ; en-tête 331 offres · médiane 6 950 € · P25 3 990 € · P75 10 705 € · min 850 – max 19 990 € ; nuage 310 points ; brossage 310 → écran D **310 lignes** (`sel` 2D, ACC-06 clos) ; **égal au recalcul** (P75 10 704,5 → 10 705) |
| Recalcul indépendant (§4.3) | confrontation aux constantes `P1_EXPECTED` | script Node hors dépôt sur `listings.ndjson.gz` : **262/262 marques, 4 716/4 716 valeurs (n, min, max, p05, p50, p95 × prix/km/année) identiques à `baseline.json`**, seuil relatif Σ = 1 599 € |
| Budgets (§6) | NFR-9 max 1 760 ms (ossature) | **NFR-9 sur le jalon « premier chiffre »** : suite 1 507 / 1 507 / 1 505 ms médians (max 1 540) ; ad hoc `fixture:test` 1 486 / 1 482 / 1 481, `fixture:dev` 1 479 / 1 482 / 1 483 (max 1 506) ; 251 Kio (245 en `dev`) avant le premier chiffre ; NDJSON transféré **1,00 ×** ; NFR-21 ouverture ≤ 1 349 ms ; NFR-22/23 exercés (404 sur `/fixtures/**`) ; NFR-5 mesuré au navigateur (p95 144 / 170 / 102 ms) et au banc (p95 186,8 ms) |
| Axe (§5) | 24 / 24 à 0 | **24 / 24 (suite) + 13 / 13 (ad hoc, zones-modèles déployées et cases « Comparer » présentes) à 0 violation** |
| Constats (§8) | ACC-01/05/15 corrigés, D8-43 en dette, ACC-16 ouvert | ACC-01…16 : **15 CLOS, 1 CLOS AVEC RÉSERVE** (ACC-11, couleur de focus ratifiée) ; C-3.5-01…05, C-R1-01…05, DR3-20…24, R1–R5 : **clos** (C-3.5-03 avec réserve) ; **8 constats nouveaux ACC-17…24 : 5 MAJEUR, 3 MINEUR** (§8.2) |
| Verdict (§9) | G8 franchie ; livraison « prêt avec réserves » | **G9 FRANCHIE SOUS RÉSERVES NOMMÉES** ; livraison **prêt avec réserves nommées** — deux corrections courtes recommandées avant le tag (ACC-19, ACC-20) et une décision de spécification (ACC-18) |

---

## 1. Critères de la porte G9 (PLAN-3 §3.5) et S1–S4 (PLAN-2 §2.9)

| Critère | Énoncé | Verdict | Preuve |
|---|---|---|---|
| **G9-1 / S1** | E2E verts sur les trois projets, sur le provider fixture | **ATTEINT** | 351 tests, **326 « passed »** au sens Playwright (323 verts + 3 échecs attendus `DETTE D8-15`), 25 sautés motivés, **0 inattendu, 0 instable**, `retries: 0` (§2) |
| **G9-2 / S2** | 0 violation axe A/AA | **ATTEINT** | 8 surfaces × 3 projets = 24 balayages à 0 (suite) ; 13 balayages complémentaires à 0 dont l'écran A avec 217 zones-modèles et 216 cases « Comparer » (C-R1-03) (§5) |
| **G9-3 / S3** | budgets tenus | **ATTEINT** | NFR-9 premier chiffre ≤ 1 540 ms sur 15 mesures de la suite et 30 mesures ad hoc (`test` + `dev`) ; NFR-5 p95 144 ms (mode 2, plus grosse cellule) / 186,8 ms (banc N = 100 000) ; NFR-6 ≤ 226 ms ; NFR-7 ≤ 32 ms ; NFR-8 0 fenêtre en défaut, min 58 img/s ; NFR-10 135,81 / 300 Kio ; NFR-21 ouverture 1,3 s < 5 s sans réessai (§6) |
| **G9-4** | bascule `?provider=synthetic` fonctionnelle | **ATTEINT avec réserve** | `?provider=synthetic` → « Données synthétiques de démonstration… », Diagnostic `SYNTHETIC`, 294 marques · 3 021 modèles · 100 000 offres (suite ×3 + ad hoc) ; **réserve ACC-20** : le paramètre est retiré de l'URL après chargement (un rechargement revient à `fixture:test`) et un bandeau `ET-URL-CORRIGEE` le dit « ignoré » |
| **G9-5** | `ACCEPTANCE.md` rev 3 livré | **ATTEINT** | ce document, 22 captures R3, `results.json` |
| **G9-6** | dettes nommées | **ATTEINT** | §7 (ce que l'utilisateur voit) et §8 (statut de chaque constat et dette) |
| **S4** | deux parcours cibles journalisés avec captures | **ATTEINT** | P1 et P2 sur desktop **et** mobile, valeurs confrontées au recalcul indépendant (§4) |

---

## 2. Décomptes E2E par projet

`npm run test:e2e` sur `df574ed`, `workers: 1`, `fullyParallel: false`, `retries: 0`, début 00:08:16 UTC, **1 628 s (27,1 min)** build et serveur compris. Source : `reports/e2e/results.json` (`stats: expected 326, skipped 25, unexpected 0, flaky 0`).

| Projet | Total | Verts | Échecs attendus (`test.fail()`) | Sautés | Inattendus | Instables | Durée cumulée |
|---|---:|---:|---:|---:|---:|---:|---:|
| `desktop` 1280 | 117 | **108** | 1 | 8 | **0** | 0 | 558,8 s |
| `tablet` 768 | 117 | **111** | 1 | 5 | **0** | 0 | 556,4 s |
| `mobile` 360 | 117 | **104** | 1 | 12 | **0** | 0 | 494,8 s |
| **Total** | **351** | **323** | **3** | **25** | **0** | **0** | 1 610 s |

**Les 3 échecs attendus** : l'unique `test.fail()` du dépôt (`responsive.spec.ts:220`, `DETTE D8-15 — les réglages « Assainissement KYCAR » ne sont offerts nulle part (EX-SCR-95)`), exécuté dans les trois projets, statut `failed` = attendu. Aucun autre `test.fail()` (`grep -rn 'test\.fail(' tests/e2e/` : 1 occurrence active).

**Les 25 sautés** — tous des inadéquations de régime déclarées par le test lui-même, jamais un masquage :

| Motif | Tests | Projets |
|---|---|---|
| `EX-SCR-181` ne décrit que le régime compact (hauteurs / 5 lignes / étiquettes / G8 / G7 ; appui long ; appui déplacé) | 3 | desktop, tablet → **6** |
| `EX-SCR-180` ne décrit que l'intermédiaire (ACC-04) | 1 | desktop, mobile → **2** |
| `EX-NFR-19` : brossage désactivé sous 768 px (ACC-06 ; brossage → URL ; E2E-06) et projection imposée (E2E-03) | 4 | mobile → **4** |
| `EX-SCR-97` : contrôles dans la feuille plein écran en compact (bandeau déplié ; ACC-11) | 2 | mobile → **2** |
| `EX-SCR-181` : G7 non tracé en compact (ACC-12 ; EX-SCR-17) | 2 | mobile → **2** |
| `EX-SCR-135` : cardinal « modèles » absent en compact (E2E-04 ; ACC-05) | 2 | mobile → **2** |
| `EX-SCR-209` : écran D en cartes sous 768 px (E2E-07) | 1 | mobile → **1** |
| `EX-SCR-199` ne décrit que l'intermédiaire et le compact (ACC-14) | 1 | desktop → **1** |
| ACC-08bis : la bande large (72 px) ne suit pas la grille compacte à 4 lignes | 1 | desktop → **1** |
| E2E-17 / E2E-18 : dégradation et libellé « Réduire à 4 » propres au compact | 2 | desktop, tablet → **4** |

Attendu par la mission : « ≈ 25 ignorés (régimes hors projet) » — exactement 25, tous de cette nature. Aucun test rejoué : il n'y a eu aucun échec inattendu à départager.

---

## 3. Matrice exigence → test → résultat → capture (mise à jour rev 3)

Cotes : **TENUE**, **PARTIELLE**, **NON TENUE**, **DETTE Dx-nn**. « suite » = `tests/e2e/` (mesures `MESURE` de `results.json`) ; « ad hoc » = mes scripts (§4–§6). Les lignes inchangées depuis la rev 2 ne sont reprises que si leur valeur a été renouvelée.

### 3.1 Exigences non fonctionnelles

| Exigence | Test / mesure (rev 3) | Résultat | Capture |
|---|---|---|---|
| `EX-NFR-2` recalcul sans rechargement | `parcours-p1` › changement de filtre R (témoin de session) ; ad hoc : 12 bascules « Berline » sur A sans rechargement | **TENUE** | R3-P1-2 |
| **`EX-NFR-5`** filtre ≤ 200 ms p95 | ad hoc navigateur (clic → en-tête mis à jour, `aria-busy` retombé) : mode 2 Golf 591 (plus grosse cellule fixture) **p50 117 / p95 144 / max 186 ms** (20) ; mode 2 Corsa synthétique 1 352 : p50 137,5 / **p95 170** / max 212 ms (20) ; mode 1 sélection dense (11 652 offres) : p50 78 / **p95 102** / max 106 ms (12) ; banc moteur `recalc.perf.test.ts` N = 100 000 FULL : **p50 168,1 / p95 186,8 / max 208,3 ms**, élagué m = 9 283 : p95 94,4 ms, facettes p95 20,6 ms | **TENUE** (§6.1) | — |
| `EX-NFR-6` histogramme ≤ 300 ms p95 | suite (bascule log G1, Corsa 355) : **176 / 147 / 133 ms** médians, max 226 / 165 / 161 | **TENUE** — charge plus faible qu'en rev 2 (C-3.5-04, prémisse publiée par la suite) | R3-P2-2 |
| `EX-NFR-7` nuage ≤ 500 ms p95 | suite (321 points tracés, Corsa) : **24 / 27 / 25 ms** médians, max 30 / 31 / 32 | **TENUE** — 5 000 points inatteignables sur le profil `test` (plus grosse cellule 591) ; banc hors navigateur inchangé | R3-P2-3 |
| `EX-NFR-8` ≥ 30 img/s sur ≥ 95 % des fenêtres | suite : 92 / 94 / 91 fenêtres, **0 en défaut**, min **58 / 58 / 60 img/s**, 603–621 trames | **TENUE** | R3-P2-4 |
| **`EX-NFR-9`** ≤ 2 000 ms en 4G, **premier chiffre** | suite (asserté depuis D3-31) : desktop 1517/1522/1503/1504/1507 → **médiane 1 507, max 1 522** ; tablet 1513/1517/1504/1507/1500 → **1 507 / 1 517** ; mobile 1510/1540/1505/1502/1499 → **1 505 / 1 540** ; ossature 1 496 / 1 496 / 1 493 ; URL filtrée 1 496 / 1 492 / 1 487 ; 251 Kio ; ad hoc `fixture:test` et **`fixture:dev`** : §6.5, max absolu **1 506 ms** | **TENUE** — C-3.5-01 clos | R3-P1-1 |
| `EX-NFR-10` / `11` bundle | 135,81 / 300 Kio ; différé 0 | **TENUE** | — |
| `EX-NFR-12`, `14` clavier, focus, titres | suite `clavier` : ligne primaire **70 / 70** (desktop, tablet), **33 / 33** (feuille compacte) ; lien d'évitement premier arrêt ; focus après navigation `h1#kycar-mentions-title` ; écran G : 6 arrêts, retour au bouton appelant | **TENUE** | — |
| `EX-NFR-13`, `16` contraste, axe | suite 24 / 24 à 0 ; ad hoc 13 / 13 à 0 (§5) | **TENUE** (limite reconduite : texte du canvas non évalué par axe) | R3-A-zones-comparer-tablet |
| `EX-NFR-17` navigateurs | Chromium seul (E5) | **PARTIELLE — hors périmètre** (inchangé) | — |
| `EX-NFR-18` / `19` régimes | suite : `large` / `intermediate` / `compact` ; projection 2D imposée (0 onglet), zoom offert, 0 débordement horizontal (D en cartes : `scrollWidth ≤ clientWidth`) | **TENUE** | R3-P2-3-mobile |
| **`EX-NFR-21`** échec provider : délai 5 000 ms, 3 réessais 1/2/4 s | ad hoc 4G : les trois documents d'ouverture (index, manifest allégé, `baseline.json`) terminés à **1 320–1 349 ms**, premier chiffre à 1 478–1 506 ms → `openSnapshot + fetchBaselineAggregates` tient sous 5 000 ms avec un facteur ≈ 3,5 ; **0 entrée `.ndjson.gz` au premier chiffre** (différé), **1 seule** ensuite (2 680 Kio) : aucun réessai, aucun double téléchargement (C-R1-02) ; 404 forcé sur `/fixtures/**` : l'erreur tombe à **7 466 / 7 414 ms** = 1 + 2 + 4 s de réessais après trois échecs immédiats | **TENUE** | — |
| **`EX-NFR-22`** repli cache daté, écran d'erreur avec « réessayer » | ad hoc : (a) contexte neuf + 404 → bandeau `ET-ERREUR-PROVIDER` « Données indisponibles — le fournisseur n'a pas répondu (code …), dernière tentative le 14/09/26 02:42. **Réessayer** », zone principale « Les données n'ont pas pu être chargées (…) Réessayer », 0 carte ; « Réessayer » avec réseau rétabli → marché complet en **2 733 ms** (desktop) / 600 ms (mobile) ; (b) cache IndexedDB d'une visite réussie + 404 → `ET-PARTIEL-CACHE` « **Mode dégradé — Données du 21/09/26 — dernière tentative de mise à jour échouée le 14/09/26 02:42** (code …). Les agrégats marqués d'un astérisque proviennent du cache ; l'export est désactivé. Réessayer » à 7 395 ms ; « 19 986 offres * », 20 cartes **aux mêmes valeurs** que la visite en ligne (`sameCounts: true`), 0 zone-modèle (le cache ne porte que la baseline), bouton Exporter `disabled`, filtre posé en dégradé → `ET-FILTRE-NON-APPLIQUE` « le filtre Prix à n'a pas pu être appliqué » (DR-103) | **TENUE** — libellé du « code » technique : ACC-23 (MINEUR) | R3-NFR23, R3-NFR22 |
| **`EX-NFR-23`** erreur ≠ résultat vide | ad hoc : en échec total la barre de synthèse est **absente** (aucun « 0 marques »), 0 carte, bandeau d'erreur + message principal explicites | **TENUE** | R3-NFR23 |
| `EX-NFR-31` impression | suite `impression` 21 / 21 (règle 2 : bandeau de provenance imprimé) | **TENUE** | — |

### 3.2 Données, provenance, provider (nouveau en rev 3)

| Exigence | Test / mesure | Résultat | Capture |
|---|---|---|---|
| **`EX-DATA-107`** nature de la source affichée | suite `source-fixture` 5 × 3 verts ; ad hoc : bandeau « Jeu de données fictif à la forme AutoScout24 (profil test, 3 snapshots) — aucune annonce réelle. » (A, B, D, desktop et mobile), pied « Jeu de données fictif … aucun lien avec AutoScout24. Données du 21/09/26. », `/mentions` « Données actuellement affichées : jeu de données fictif à la forme AutoScout24 (aucune annonce réelle) (source : kycar-fixture-test kycar-dataset-gen@1.0.0 · snapshot be-20260921T060000Z) — capture du 2026-09-21T06:00:00Z. », Diagnostic `Source FIXTURE`, `Snapshot be-20260921T060000Z`, `Annonces du snapshot 19986`, `Doublons détectés 14` ; CSV mode 1 et mode 2 `# snapshot;be-20260921T060000Z;2026-09-21T06:00:00Z;FIXTURE` | **TENUE** | R3-E-1, R3-E-2 |
| **DF-2** bascule par paramètre | ad hoc : `?provider=fixture:dev` → « (profil dev, 3 snapshots) », 135 marques · 820 modèles · 4 997 offres, Diagnostic `FIXTURE` ; `?provider=synthetic` → « Données synthétiques de démonstration… », 294 · 3 021 · 100 000, Diagnostic `SYNTHETIC be-synthetic-100000-4b594341`, pied « Jeu de données synthétique de démonstration… » ; `?provider=inconnu` → `ET-SOURCE-REPLI` « Source de données « inconnu » inconnue : l'application est revenue à la source par défaut (fixture:test). Sources reconnues : … », source servie `FIXTURE` 19 986 ; `?provider=tweedehands` → « non branchée : NON CÂBLÉ : D-18 / DR-104 … AC-01 » | **PARTIELLE — ACC-20** : après chargement l'URL ne porte plus `provider=` (rechargement → défaut) et un bandeau `ET-URL-CORRIGEE` « Paramètre « provider » corrigé : paramètre inconnu ignoré » accompagne chaque bascule pourtant appliquée | R3-E-3, R3-E-4 |
| **`EX-DATA-62`** quantile de type 7 (DR3-20) | recalcul indépendant (§4.3) : 4 716 / 4 716 valeurs de `baseline.json` reproduites ; suite de contrat `baseline-vs-engine` 12 cas verts (105/105) ; à l'écran : marque Aspid (n = 2) « médiane 17 665 € » = (9 990 + 25 339) / 2 = 17 664,5 → 17 665 ; Alfa Romeo 2000 (n = 2) écran B P25 1 679 € (1 679,25), P75 2 560 € (2 559,75) | **TENUE** | — |
| **`EX-DATA-64`** arrondi de présentation | prix : euro entier, demi vers l'infini (`10 704,5 → 10 705 €`, `17 664,5 → 17 665 €`) ✓ ; km : centaine plancher/plafond ✓ ; **année : `Math.round` au lieu de plancher (p05, médiane) / plafond (p95)** — 32 / 262 cartes-marques et 114 / 299 zones (n ≥ 12) sur l'écran A nu, 196 / 1 451 médianes d'année sur l'écran B ; **CSV mode 1 : `prix_median`/`prix_p5`/`prix_p95` écrits bruts** (503 / 1 254 lignes décimales, 204 avec bruit binaire) | **NON TENUE — ACC-17** | — |
| **`EX-DATA-25`** axe année = 1ʳᵉ immatriculation | recalcul sur `firstRegistrationDate` = baseline (786 bornes et 786 quantiles d'année identiques) ; écran A VW « 2008 – 2023 » = recalcul | **TENUE** (D3-38 a) | — |
| **`EX-DATA-19(2)`** sentinelle relative, cellule nommée | seuil Σ = snapshot **1 599 €** reproduit ; mais pour un **même modèle**, écran A (Σ = snapshot ou marque) et écran B (Σ = cellule) publient des statistiques de prix différentes sur **159 / 1 464 modèles** (64 / 289 à n ≥ 12) sans qu'aucune surface nomme sa cellule | **PARTIELLE — ACC-18** (§8.3 (v)) | — |
| `EX-DATA-68`, `EX-SCR-106/107` effectifs et cardinaux | « 262 marques · 1 464 modèles · 19 986 offres » = ingestion ; `modelCount` 54 (VW) = recalcul ; ACC-05/15 verts | **TENUE** | R3-P1-1 |
| `EX-DATA-15` doublons | 20 000 lignes → 19 986 ; 14 doublons d'identifiant, **0** divergent sur (prix, km, année, marque) → l'arbitrage D3-15 n'a aucun effet sur les statistiques | **TENUE** | — |
| `EX-DATA-123bis`, `EX-CRUD-14/15/16` exports | mode 1 : `kycar_agregats-mode1_be-20260921T060000Z_20260914.csv`, BOM, 3 lignes `#`, en-tête de 15 colonnes exact, 1 254 lignes (sélection dense) ; mode 2 depuis B : annonces **331** lignes × 19 colonnes (`type_vendeur` = PRO/PRIVATE, aucun champ identifiant), agrégats 70 lignes (G1/G2/G3) ; depuis D avec `sel` : **310** annonces = brossées (ACC-06), sans `sel` : 331 | **TENUE** (arrondi des quantiles du mode 1 : ACC-17) | — |
| **`EX-SCR-158`/`184`** actions du brossage | « Voir ces annonces » : 310 brossées → `sel=390-19990_r23919-24297_k15300-420000` → « 310 lignes affichées sur 331 » ✓ ; **« Convertir la sélection en filtre » : aucun filtre posé, aucun message** (URL revient à `?priceto=20000`, 331 offres, un seul jeton), sur les deux projections | **PARTIELLE — ACC-19** | R3-P2-4 |

### 3.3 Écrans (mise à jour)

| Exigence | Test / mesure | Résultat |
|---|---|---|
| `EX-SCR-221` / D8-20 filtre Carrosserie en mode 2 | suite ACC-01 ×3 : « 355 offres ; Filtre Carrosserie non appliqué à ce modèle (donnée indisponible) — … » ; P1-6 ad hoc : Polo 149 offres sous jeton « Carrosserie : Coupé » **avec** le bandeau, desktop et mobile | **TENUE** |
| `EX-SCR-26`, `65/89/90` mode 1 | inchangé : DETTE D8-37 / D8-29 en mode 1 ; suite `EX-SCR-26` mode 2 : « retirer « Première immatriculation : 1950 – 1960 » : 355 offres de plus » | **COUVERTE en mode 2 · DETTE en mode 1** |
| `EX-SCR-33` paliers d'effectif | zones : « 2 trop faible » / « 1 seule offre » / jeton `n = 2` ✓ ; écran B : 26 Corsa 2017 avec médiane (n ≥ 12) ✓ ; **résumé de carte : « 1 modèles · médiane 17 665 € » pour n = 2 (Aspid), « médiane 6 950 € » pour n = 1 (Morgan) — 171 / 262 marques ont 1 ≤ n_prix ≤ 4** | **PARTIELLE — ACC-21** |
| `EX-SCR-56` bandeau collant | suite ACC-02 : replié **90 / 115 / 65 px** (11,3 / 11,2 / 8,8 % du viewport), déplié 320 px, collé sous l'en-tête après 1 200 px de défilement (A et B) | **TENUE** (2.10) |
| `EX-SCR-95` | 3 `test.fail()` | **DETTE D8-15** |
| `EX-SCR-104` / `mmmv` | `?mmmv=54|1918` → redirige vers `/marche/54-opel/1918-corsa` ✓ ; `?mmmv=54|||` → « 1 marque · 40 modèles · 1 377 offres » ✓ ; `?mmmv=54%7C1918` (forme encodée) → non décodé : jeton « Marque nº 54%7C1918 », bandeau `ET-FILTRE-NON-APPLIQUE` (déclaré, D-03 respecté) | **PARTIELLE — ACC-23** |
| **`EX-SCR-107`** en-tête de carte 72 px (C-R1-05) | suite ×3 : 31 en-têtes, min 72 px ; ad hoc : **72 px** aux trois régimes (36 cartes chacun) | **TENUE** — décision (iv) §8.3 |
| **`EX-SCR-112`, `135`, `122`, `137`** géométrie des cartes | ad hoc (sélection dense) : bande de zone **81 px** à 1 280–1 680 px (normatif 72), **105 px** à 768 (grille compacte par `@container`, normatif 96), **115 px** à 360 (96) ; liste repliée 469 px visibles pour 6 × 81 = 486 → **6ᵉ zone rognée de 17 px** (large) et 1,5 zone à 768 ; grille **2 colonnes à 1 280 px de viewport** (conteneur 1 248 px < seuil `@container 1280`), 3 colonnes dès 1 366 | **PARTIELLE — ACC-22** |
| `EX-SCR-113/118` zones, case « Comparer » (C-R1-03/04) | suite ACC-08 : 0 cible sous seuil (264 / 193 / 120), ACC-08bis : 0 chevauchement (180 / 144 zones) ; ad hoc : cible 32 / 32 / **44 px**, 216 cases sur 217 zones (A dense), 4 lignes en compact | **TENUE** |
| `EX-SCR-124`, `127` virtualisation | suite ACC-09 (30 zones, 636 px, ombres) et ACC-10 (12 cartes montées, fenêtre suit le défilement) | **TENUE** (2.10) |
| `EX-SCR-142` en-tête B | « Opel Corsa · 331 offres · médiane 6 950 € · P25 3 990 € · P75 10 705 € · min 850 € – max 19 990 € (du moins cher au plus cher) · km médian 109 100 km · 1ʳᵉ immat. médiane 2018 · 38 % particuliers · Voir les 331 annonces · Comparer · Suivre · Exporter » ; compact : 5 lignes | **TENUE** (médiane d'année arrondie : ACC-17) |
| `EX-SCR-174`, `178` | suite : en-tête « aucune offre » ; ACC-07 : 338 + 7 + 6 + 4 = 355 | **TENUE** (2.10) |
| `EX-SCR-180`, `181` | suite ACC-04 (tablet) et ACC-03 (mobile : G1 200 · G4 320 · additionnels 240 px, en-tête 5 lignes, 7 étiquettes / 14 barres, G8 10, appui long) | **TENUE** (2.10) |
| `EX-SCR-186`, `87`, `199`, `25` | suite ACC-12 (G9 5 / 5 teintes, G12 4, G13 2, G8 divergent, G7 14 teintes), ACC-11 (survol ≠ repos, coché = accent + blanc), ACC-14, ACC-13 (« indicateur au repos : aucun ») | **TENUE** — couleur de focus ratifiée (2.10 §5.1) |
| `EX-SCR-201`–`210` écran D | D « 310 lignes affichées sur 331 de la sélection — écarts calculés sur les 331 · Tri : score d'opportunité décroissant », 50 lignes, page 1 / 7 ; compact : 50 cartes, 50 « Ouvrir l'annonce d'origine », page 1 / 7, aucun débordement | **TENUE** |

### 3.4 Les 15 exigences « mesures au rendu » (rev 1 §3.4) après 2.10

`EX-SCR-21` **TENUE** (ACC-08 : 24 / 20 / 16 px, rayon 4, 0 cible sous seuil ; cases natives ratifiées 2.10 §5.3) · `EX-SCR-25` **TENUE** (ACC-13, mode 1 câblé par `mvp-integrate` §4.2) · `EX-SCR-56` **TENUE** · `EX-SCR-87` **TENUE avec écart ratifié** (couleur de focus `#ffd54a`) · `EX-SCR-100` **TENUE** (rev 1) · `EX-SCR-124` **TENUE** · `EX-SCR-127` **TENUE** · `EX-SCR-171` **TENUE** (rev 1) · `EX-SCR-180` **TENUE** · `EX-SCR-181` **TENUE** · `EX-SCR-186` **TENUE** · `EX-SCR-190` **TENUE** (rev 1) · `EX-SCR-199` **TENUE** · `EX-NFR-6` **TENUE** · `EX-NFR-14` **TENUE**. Bilan : **15 / 15 tenues** (contre 5 en rev 1), un écart ratifié par écrit. La géométrie des zones (ACC-22) relève d'`EX-SCR-112/135/137`, qui n'étaient pas dans cette liste.

---

## 4. Parcours cibles journalisés sur données fictives, avec recalcul indépendant

Journaux : `parcours.json`, `quantiles.json`, `followup.json`, `recalc-test-be-20260921T060000Z.json` (scratchpad de session). Temps « localhost » sans bride, informatifs. Le recalcul indépendant (§4.3) est un script Node de 200 lignes écrit depuis le **texte** du dictionnaire (EX-DATA-15, 19, 25, 60, 62, 64), qui lit `listings.ndjson.gz`, dédoublonne par identifiant, applique les règles de validité (prix 1 ≤ p ≤ 5 000 000 arrondi à l'euro, sentinelle absolue < 250 €, sentinelle relative 0,10 × médiane(Σ) si n ≥ 12, km en `km` dans [0 ; 1 500 000] hors zéro suspect, année = `AAAA` de `firstRegistrationDate` dans [1900 ; 2027]) et calcule les quantiles de type 7 — **sans importer une ligne de `src/`**.

### 4.1 P1 — mode 1 : « budget 20 000 €, coupé, < 100 000 km », marché → marque → modèle

| Étape | Action | Desktop 1280 (valeurs relevées) | Mobile 360 | Confrontation | Capture |
|---|---|---|---|---|---|
| P1-1 | `GET /marche` (contexte neuf) | premier rendu utile **2 677 ms** ; « **262 marques · 1 464 modèles · 19 986 offres** — 20 marques affichées » dès la première image, 20 cartes ; bandeau de provenance FIXTURE | 2 736 ms ; « 262 marques · 19 986 offres — 20 marques affichées » | = ingestion (19 986 = 20 000 − 14) ; `modelCount` Σ = 1 464 ; recalcul : 262 marques, 1 505 couples dont 1 464 modèles résolus | R3-P1-1-desktop |
| P1-2 | Prix à = 20000 → Kilométrage à = 100000 → case « Coupé » (bandeau réel ; feuille + « Voir les … offres » en compact) | URL **`?body=3&kmto=100000&priceto=20000`** ; « **31 marques · 69 modèles · 146 offres** » ; `data-active-count="3"` ; jetons « Prix : ≤ 20 000 € », « Kilométrage : ≤ 100 000 km », « Carrosserie : Coupé » | même URL ; « 31 marques · 146 offres » ; barre compacte « Filtres (3) · 3 filtres actifs · … · 146 offres » | **= recalcul : 146 offres, 31 marques, 69 modèles** (body = 3 ∧ prix connu ≤ 20 000 ∧ km connu ≤ 100 000) ; = `derived().p1` de la suite (4 tests verts ×3) | R3-P1-2-desktop, -mobile |
| P1-3 | lecture des cartes | 31 cartes : **VOLKSWAGEN 21 · RENAULT 17 · OPEL 14 · PEUGEOT 11 · AUDI 9 · CITROËN 8** ; carte VW : « 4 modèles · médiane 15 066 € · 7 950 – 18 950 € (fourchette centrale (90 % des offres)) · du moins cher au plus cher : 6 854 – 19 500 € · 2017 – 2022 » ; zones : Polo 15 (9 615 – 18 285 € centrale · 2018 – 2022 · 30 900 – 92 100 km · méd. 15 641 €), Golf 2 (9 990 – 11 990 € observée · 2017 · « 2 trop faible » · `n = 2`), up! 2 ; en-tête de carte 72 px | idem, zones de 115 px | recalcul par marque : 74:21 · 60:17 · 54:14 · 55:11 · 9:9 · 21:8 ✓ ; VW : p50 **15 066**, p05 **7 950**, p95 **18 950**, min **6 854**, max **19 500** ✓ ; année p05 = 2016,8 / p95 = 2022,1 → EX-DATA-64 attend « **2016 – 2023** », affiché « 2017 – 2022 » (ACC-17) ; **3 marques sur 31** atteignent n ≥ 12 (VW 21, Renault 17, Opel 14) : 28 cartes en « fourchette observée » (C-3.5-03) | — |
| P1-4 | clic sur l'en-tête VOLKSWAGEN | URL `?body=3&kmto=100000&mmmv=74&priceto=20000` ; « **1 marque · 4 modèles · 21 offres** » ; carte identique | « 1 marque · 21 offres » ; 4 zones (Polo 15, Golf 2, up! 2, Jetta 1) | D8-04(a) ; accord singulier (ACC-15) ✓ | R3-P1-4-desktop |
| P1-6 | clic sur la zone « Polo, 15 offres » → écran B | URL `/marche/74-volkswagen/2090-polo?body=3&kmto=100000&priceto=20000` ; titre « KYCAR — Distribution d'un modèle · Volkswagen Polo » ; « **Volkswagen Polo 149 offres** · médiane 12 950 € · P25 9 990 € · P75 15 990 € · min 2 950 € – max 20 000 € · km médian 68 800 km · 1ʳᵉ immat. médiane 2020 · 41 % particuliers » ; bandeaux : provenance FIXTURE + **« Filtre Carrosserie non appliqué à ce modèle (donnée indisponible) — l'effectif affiché est complet, mais il ne tient pas compte de ce critère. »** | même route, en-tête compact 5 lignes, même bandeau | 15 coupés → 149 Polo ≤ 20 000 € et ≤ 100 000 km : O15/D8-20, **déclaré** (ACC-01 clos) | R3-P1-6-desktop, -mobile |

### 4.2 P2 — mode 2 : Opel Corsa, budget 20 000 €, histogrammes, nuage, brossage, écran D, exports

| Étape | Action | Desktop | Mobile | Confrontation | Capture |
|---|---|---|---|---|---|
| P2-1 | `GET /marche/54-opel/1918-corsa?priceto=20000` | entrée en B **2 755 ms** ; « Opel Corsa · **331 offres** · médiane **6 950 €** · P25 **3 990 €** · P75 **10 705 €** · min **850 €** – max **19 990 €** · km médian **109 100 km** · 1ʳᵉ immat. médiane **2018** · 38 % particuliers » | 3 275 ms, en-tête 5 lignes (`data-regime="compact"`), mêmes valeurs | **recalcul cellule Corsa ≤ 20 000 € : 331 ; n_prix 327 ; p25 3 990 ; p50 6 950 ; p75 10 704,5 → 10 705 ; min 850 ; max 19 990 ; km p50 109 100 ; année p50 2018** — tout à l'unité | R3-P2-1-desktop, -mobile |
| P2-1b | vérité terrain | cellule entière **355 offres** · médiane 6 970 € · P25 3 990 € · P75 10 990 € · min 850 – max 375 075 € ; 2017 : **26 offres** · médiane 6 000 € · min 990 – max 14 950 € | — | recalcul : 355 (n_prix 338, seuil de cellule 695 €), p50 6 970, p25 3 990, p75 10 990, min 850, max 375 075 ✓ ; 2017 = 26 ✓ ; = `derived().corsaTotal / corsa2017` de la suite | — |
| P2-2 | G1–G3 et tables | G1 « Offres par prix (327) » **20 barres = 20 lignes** ; G2 « (320) » 22 / 22 ; G3 « (321) » 28 / 28 ; suite ACC-07 sur la cellule entière : 338 + 7 (sur demande) + 6 (absent) + 4 (hors classes) = 355 | G1/G2/G3 à **200 px** (EX-SCR-181) | 327 = n_prix du recalcul ✓ ; tables = barres (`EX-NFR-15`) | R3-P2-2-desktop |
| P2-3 | nuage G4 | « **Nuage de 310 points, 21 outliers** », 33 031 px encrés sur 900 × 480 ; deux projections (« Nuée empilée », « Prix × année ») ; légende « Année 1993 – 2024 · médiane 2018 · Taille 0 – 250 000 km et plus » | canvas 278 × **320 px** (EX-SCR-181), 16 270 px encrés, projection imposée (0 onglet), légende dessous | non vide (E2E-02) ; 310 ≤ 327 (points aux trois axes connus) | R3-P2-3-desktop, -mobile |
| P2-4 | brossage réel (5 % → 95 % du cadre) | URL `…&selx=-205.9–23617.6&sely=-1.1–30.5` ; compteur « **310 annonces sélectionnées** » ; boutons « Convertir la sélection en filtre » et « Voir ces annonces » | brossage désactivé par contrat | `EX-SCR-158/184` ✓ | R3-P2-4-desktop |
| **P2-4b** | « **Convertir la sélection en filtre** » | URL → **`?priceto=20000`** (brossage retiré), **331 offres**, jeton unique « Prix : ≤ 20 000 € », **aucun bandeau** ; identique sur la projection « Prix × année » (303 sélectionnées → rien) | — | **ACC-19** : l'action n'a aucun effet et ne le dit pas | — |
| P2-5 | « Voir ces annonces » → écran D | URL `…/annonces?priceto=20000&sel=390-19990_r23919-24297_k15300-420000` ; « **310 lignes affichées sur 331** de la sélection — écarts calculés sur les 331 · Tri : score d'opportunité décroissant » ; 50 lignes, « page 1 / 7 » ; 0 erreur de page | « Voir les 331 annonces » → 50 cartes, 50 « Ouvrir l'annonce d'origine », page 1 / 7, aucun débordement | 310 brossées = 310 listées (**ACC-06 clos**) ; étiquetage A-07 présent | R3-P2-5-desktop, -mobile |
| P2-6 | exports depuis D | « CSV des annonces du périmètre » : `kycar_Opel-Corsa_be-20260921T060000Z_20260914.csv`, BOM, `# snapshot;…;FIXTURE`, `# filtres;priceto=20000`, `# couverture;"Jeu de données FIXTURE …"`, **310 lignes × 19 colonnes** ; sans `sel` : 331 ; « CSV des agrégats affichés » : 70 lignes, `graphe;index;borne_basse;borne_haute;ouvert;effectif;part`, G1 / G2 / G3 | — | téléchargements réels ; périmètre = `sel` (ACC-06) | — |
| P2-7 | exports depuis B | menu « Exporter » = exactement « Annonces du périmètre (CSV) », « Agrégats affichés (CSV) » ; annonces **331** lignes ; agrégats 70 lignes | — | `EX-CRUD-16` ✓ | — |
| P2-8 | graphes additionnels | 13 figures G1–G10, G12–G14 (G11, G15 hors DOM), **0 table vide**, 0 erreur | 13 figures | E2E-08 ✓ | — |

### 4.3 Recalcul indépendant — ce que l'écran dit contre ce que les octets disent

**Baseline (écran A sans filtre, `baseline.json`)** : `node recalc.mjs test` — 20 000 lignes, 14 doublons (0 divergent), **19 986** = `selectionCount` ; seuil relatif Σ = 0,10 × 15 990 = **1 599 €** ; **262 / 262 marques, 0 écart d'effectif, 0 écart de `modelCount`, 4 716 / 4 716 valeurs (n, min, max, p05, p50, p95 des trois métriques) égales à `baseline.json`** (tolérance 10⁻⁶ relative, résidus binaires compris : `311059.99999999953`). Le contrat `baseline-vs-engine` (105 / 105) confronte de son côté le même artefact au moteur : les trois définitions (moteur, provider, mon recalcul) coïncident.

**Cinq marques à l'écran (A nu ou `?mmmv=<id>`)** :

| Marque | n (écran / recalcul) | médiane (écran / recalcul brut) | fourchette prix (écran / recalcul) | année (écran / EX-DATA-64) | Verdict |
|---|---|---|---|---|---|
| Volkswagen (74) | 2 197 / 2 197 | 14 502 € / 14 502 | 3 000 – 48 900 € (p05–p95) / 3 000 – 48 900 | 2008 – 2023 / 2008 – 2023 | ✓ |
| BMW (13) | 1 680 / 1 680 | 20 990 € / 20 990 | 3 990 – 64 165 € / 3 990 – 64 164,8 | 2008 – 2023 / idem | ✓ |
| Mercedes-Benz (47) | 1 519 / 1 519 | 23 858 € / 23 858 | 4 805 – 64 952 € / 4 804,6 – 64 952 | 2008 – 2023 / idem | ✓ |
| **Aspid (16431), n pair = 2** | 2 / 2 | **17 665 €** / 17 664,5 | 9 990 – 25 339 € (min–max, `n = 2`) / 9 990 – 25 339 | 2018 / 2018 | ✓ type 7 (milieu des deux valeurs) ; médiane affichée au niveau carte malgré n = 2 → ACC-21 |
| Dangel (16434), n = 2 | 2 / 2 | 37 945 € / 37 945 | 19 900 – 55 990 € / idem | 2020 – 2021 / 2020 – 2021 | ✓ |
| ACM (16429), n = 2 | 2 / 2 | 2 450 € / 2 450 | 1 950 – 2 950 € / idem | 2003 – 2007 / idem ; km « 241 100 km » (les deux bornes coïncident) | ✓ |
| Morgan (51), n = 1 | 1 / 1 | 6 950 € / 6 950 | 6 950 € / idem | 2017 | ✓ (« 1 seule offre » en zone, « médiane » sur la carte → ACC-21) |

**Zones-modèles (A nu, Σ = snapshot)** : Golf « 591 offres · 1 990 – 25 000 € · 2006 – 2023 · 37 700 – 323 200 km · méd. 9 900 € » = recalcul (n_prix 552, p05 1 990, p95 25 000, p50 9 900) ; Passat 436 · méd. 20 925 € ✓ ; Polo 385 · méd. 10 990 € · p95 26 927,5 → 26 927 € ✓ ; Tiguan 198 · 8 675 – 67 618 € (67 617,5) ✓ ; T-Roc 83 · 10 905 – 46 819 € (10 904,5 ; 46 819,25) ✓ ; Touran 62 ✓ ; Corsa « 355 · 2 500 – 17 990 € · méd. 7 587 € » = recalcul Σ = snapshot (n_prix 311).

**Écran A et écran B pour le même modèle** (décision (v), §8.3) : même Σ ⇒ mêmes chiffres (baseline = moteur = recalcul) ; mais la sélection de l'écran A nu n'est pas la cellule de l'écran B — Golf : zone A « méd. 9 900 € » (n_prix 552, seuil 1 599 €), en-tête B « médiane 9 448 € » (n_prix 576, seuil 933 €) ; Corsa : 7 587 € (311) contre 6 970 € (338) ; `?mmmv=54` (Σ = Opel) : 7 304 € (321). **159 / 1 464 modèles** (64 / 289 à n ≥ 12) diffèrent entre A nu et B ; écart relatif maximal de médiane à n ≥ 12 : Opel Ascona **2 995 € (A) contre 2 096 € (B), +43 %** (ACC-18).

---

## 5. Accessibilité — axe-core WCAG 2.1 A/AA

Suite (`a11y.spec.ts`, page entière, G restreint à la modale) : **24 / 24 balayages à 0 violation** — A `/marche`, B, D (rendue), C, E, F, G, `/mentions` × desktop / tablet / mobile. Balayages complémentaires (ad hoc, `axe.mjs`, mêmes tags), post C-R1-03 :

| Surface | État | desktop | tablet | mobile |
|---|---|---:|---:|---:|
| A dense (`?priceto=20000`), **217 zones-modèles déployées, 216 cases « Comparer »**, une carte dépliée, une case cochée | | **0** | **0** | **0** (144 zones) |
| A parcours P1 (`?body=3&kmto=100000&priceto=20000`) | | **0** | **0** | **0** |
| B Corsa `?priceto=20000` (nuage rendu) | | **0** | **0** | **0** |
| D Corsa `?priceto=20000` | | **0** | **0** | **0** |
| Feuille « Filtres » compacte ouverte | | — | — | **0** |

**37 / 37 balayages sans violation, aucune règle désactivée, aucune exception.** 1 résultat `incomplete` par balayage (règle à vérification manuelle, non comptée comme violation). Limites reconduites : texte peint dans le canvas G4 non évalué ; Chromium seul.

---

## 6. Budgets navigateur — séries complètes (machine libre, aucune mesure en parallèle)

### 6.1 `EX-NFR-5` — application d'un filtre ≤ 200 ms p95
Ad hoc (`nfr5.mjs`, desktop 1280) : clic sur une case « Diesel » (mode 2) ou « Berline » (mode 1), horloge arrêtée quand le texte de l'en-tête (ou de la barre de synthèse) a changé **et** qu'aucun `aria-busy` ne subsiste ; 250 ms de repos entre deux bascules.

| Cas | n | Série (ms) | p50 | **p95** | max |
|---|---:|---|---:|---:|---:|
| mode 2, Golf 591 (plus grosse cellule `fixture:test`) | 20 | 186 142 123 135 105 116 110 95 108 136 110 112 110 142 123 125 118 129 106 109 | 117 | **144** | 186 |
| mode 2, Corsa **synthétique** 1 352 (charge maximale connue, `?provider=synthetic`) | 20 | 161 138 139 121 143 123 146 136 168 136 145 127 145 137 158 212 137 112 120 121 | 137,5 | **170** | 212 |
| mode 1, sélection dense 11 652 offres (aller provider) | 12 | 106 70 72 99 72 73 78 79 95 79 74 78 | 78 | **102** | 106 |

Banc moteur (`npx vitest run --config vitest.perf.config.ts src/engine/recalc.perf.test.ts`, 5 / 5) : FULL N = 100 000, 100 exécutions : **p50 168,1 · p95 186,8 · max 208,3 ms — TENUE** ; élagué m = 9 283 : p50 81,8 · p95 94,4 ms ; facettes 8 filtres : p95 20,6 ms.

### 6.2 `EX-NFR-6` — histogramme
Suite, bascule log de G1 (Corsa, 355) : desktop 186 / 226 / 176 / 153 / 169 → **médiane 176**, max 226 ; tablet 164 / 165 / 136 / 147 / 144 → **147** ; mobile 161 / 133 / 155 / 133 / 133 → **133**. Budget 300 ms.

### 6.3 `EX-NFR-7` — nuage
Suite, 5 zooms, 321 points : desktop 30 / 19 / 24 / 8 / 24 → **24** ms ; tablet 31 / 16 / 27 / 30 / 27 → **27** ; mobile 14 / 32 / 25 / 24 / 26 → **25**. Entrée complète en mode 2 : 3 323 / 3 298 / 3 387 ms (repère hors budget : NDJSON en arrière-plan + élagage + moteur).

### 6.4 `EX-NFR-8` — 10 s d'interaction continue
Suite : desktop 603 trames, **92 fenêtres, 0 en défaut, min 58,0 img/s**, 28 gestes ; tablet 621 trames, 94 / 0 / 58,0 ; mobile 605 trames, 91 / 0 / 60,0.

### 6.5 `EX-NFR-9` — premier chiffre en 4G simulée (CDP 4 Mb/s ↓, 1 Mb/s ↑, 150 ms, cache vidé puis désactivé)

| Cas | Projet | Ossature (5) | **Premier chiffre (5)** | Médiane | Max | Kio avant le 1ᵉʳ chiffre | `baseline.json` `responseEnd` |
|---|---|---|---|---:|---:|---:|---|
| suite, `fixture:test` | desktop | 1505 1511 1492 1493 1496 | 1517 1522 1503 1504 1507 | **1 507** | 1 522 | 251 | — |
| | tablet | 1502 1506 1492 1496 1490 | 1513 1517 1504 1507 1500 | **1 507** | 1 517 | 251 | — |
| | mobile | 1500 1509 1493 1492 1489 | 1510 1540 1505 1502 1499 | **1 505** | 1 540 | 251 | — |
| suite, URL filtrée P1 (ossature) | d / t / m | 1500 1496 1489 1501 1490 · 1488 1483 1492 1497 1493 · 1497 1494 1487 1487 1482 | — | 1 496 / 1 492 / 1 487 | 1 501 | — | — |
| ad hoc `nfr9.mjs`, `fixture:test` | desktop | 1486 1484 1482 1479 1479 | 1490 1488 1486 1484 1482 | **1 486** | 1 490 | 251 | 1 326–1 345 ms |
| | tablet | 1481 1503 1478 1478 1476 | 1484 1506 1482 1482 1479 | **1 482** | 1 506 | 251 | 1 320–1 349 |
| | mobile | 1475 1484 1474 1477 1476 | 1478 1487 1478 1481 1481 | **1 481** | 1 487 | 251 | 1 325–1 349 |
| ad hoc, **`fixture:dev`** | desktop | 1480 1475 1475 1480 1476 | 1483 1478 1478 1485 1479 | **1 479** | 1 485 | 245 | 1 307–1 335 |
| | tablet | 1479 1478 1479 1479 1480 | 1482 1481 1483 1482 1483 | **1 482** | 1 483 | 245 | 1 309–1 337 |
| | mobile | 1489 1480 1485 1475 1473 | 1493 1483 1487 1477 1476 | **1 483** | 1 493 | 245 | 1 316–1 346 |

**45 mesures du premier chiffre (15 suite + 30 ad hoc), maximum 1 540 ms, et 60 mesures d'ossature toutes ≤ 1 511 ms ; ossature et premier chiffre coïncident à 3–5 ms près** : l'écran ne peint plus de squelette à remplacer. C-R1-02 : suite « 2 680 Kio transférés pour un snapshot de 2 680 Kio (1,00 fois) » ×3 ; ad hoc : **0 entrée `.ndjson.gz` au premier chiffre, 1 entrée ensuite** (2 680 Kio `test`, 682 Kio `dev`), jamais deux.

### 6.6 `EX-NFR-10` — bundle
121,91 Kio (entrée `index-kOTVWI0W.js`) + 13,90 Kio (worker) = **135,81 / 300 Kio** gzip ; CSS 6,84 Kio ; +19,2 Kio depuis la rev 2 (finition 2.10, provider fixture, adaptateur, baseline).

### 6.7 `EX-NFR-21` / `22` / `23` — chemins d'échec (ad hoc `nfr22.mjs`, `provenance.mjs`)
- Ouverture nominale en 4G : `openSnapshot + fetchBaselineAggregates` servi par trois documents préchargés, terminés à ≤ 1 349 ms → aucun réessai possible (délai 5 000 ms) ; contrat : « baseline servie 9 ms (budget S4 2 000 ms), annonces ingérées 3 172 ms (budget 10 000 ms) ».
- Échec total (`/fixtures/**` → 404, contexte neuf) : erreur affichée à **7 466 ms** (desktop) / 7 414 ms (mobile) = trois tentatives immédiates + 1 + 2 + 4 s ; `ET-ERREUR-PROVIDER` + « Réessayer » ; aucune barre de synthèse, 0 carte (jamais « 0 marques ») ; « Réessayer » réseau rétabli → marché en 2 733 / 600 ms.
- Repli cache (IndexedDB `kycar/snapshot-cache/latest`, écrit 1,5 s après une visite réussie : 262 lignes, **93 avec quantiles non entiers**, ex. `64164.79999999997`) : `ET-PARTIEL-CACHE` daté à 7 395 / 7 379 ms ; « 19 986 offres * » ; cartes **identiques** à la visite en ligne (« médiane 14 502 € · 3 000 – 48 900 € ») ; export désactivé ; filtre posé → déclaré non appliqué.
- Profil non généré `?provider=fixture:perf` : contexte neuf → `ET-ERREUR-PROVIDER` à 7 824 ms ; avec cache → `ET-PARTIEL-CACHE` sur le cache du profil `test` (§8.2 ACC-23).

### 6.8 `EX-SCR-25` — indicateur de recalcul
Suite ACC-13 : « indicateur au repos : aucun » ×3 ; mode 1 câblé (`mvp-integrate` §4.2, `RECALC_INDICATOR_DELAY_MS` partagé). Les recalculs mesurés en 6.1 (p95 ≤ 170 ms) restent sous les 150 ms dans la majorité des cas ; au-delà, l'indicateur temporisé est légitime.

---

## 7. Dettes visibles en recette — ce que l'utilisateur voit ou ne voit pas

| Dette | Où | En une phrase |
|---|---|---|
| **D8-15** (`EX-SCR-95`) — 3 `test.fail()` | partout | Aucun panneau « Assainissement KYCAR » : seuils par défaut, sans réglage ; rappelé par trois échecs attendus à chaque exécution. |
| **D8-43 résiduel** (2.10) | bandeau, G7 compact, cases natives | Les 12 constats de présentation sont corrigés (§3.4). Restent **deux écarts ratifiés par écrit** : anneau de focus jaune `#ffd54a` au lieu de l'accent (`EX-SCR-87`, contraste 12,7:1 — 2.10 §5.1) et bascule log de G7 absente en compact parce que G7 n'y est pas tracé (`EX-SCR-181` prime sur `EX-SCR-17`). Visibles, assumés. |
| **D8-29 / D8-37 / D8-36** (mode 1) | écran A | Inchangées : pas d'effectifs `(n)` sur les cases en mode 1 ; pas de suggestions chiffrées à zéro résultat en mode 1 ; agrégats sans quartiles (les quartiles sont sur B). |
| **O15 / D8-20** (`EX-SCR-221`) | écran B | Le filtre Carrosserie posé en mode 1 cesse de s'appliquer en mode 2 et **l'écran le dit** (P1-6 : Polo 15 coupés → 149 Polo avec bandeau). |
| **D3-19 / D3-20** (EG-01, EG-08/09/11) | tailles des cellules | Golf 591 et Corsa 355 au lieu des 650 / 440 visés : la composition segment × année prime ; l'utilisateur voit des cellules plus petites qu'annoncé dans la spec de données, jamais un chiffre faux. |
| **D3-26** (`DUPLICATE_VALUE_CONFLICT` pour la notion A-07b) | écran D, jeton « ! » | Un code de drapeau sert deux notions ; invisible pour l'utilisateur (le jeton est le même). |
| **D3-27** (P-55) · **D3-28** (A-13) · **D3-39b** (`additionalFuelTypes` à 64,8 e.t.) | données | Tolérances et anomalies de spécification ; **aucun effet visible** (l'écart de `additionalFuelTypes` est un taux d'absence de champ secondaire, jamais affiché tel quel). |
| **D3-39c** (carrosserie ↔ portes/sièges tirés indépendamment) | écran D, ligne dépliée | Un coupé peut afficher 5 portes : plausibilité des fiches individuelles, pas des statistiques. Visible à qui déplie une annonce. |
| **D3-40b** (planchers `min-height` à spécificité ordinaire) | CSS | Fragilité de style, aucune valeur actuellement sous le plancher ; invisible. |
| **D3-34 (c)** `fixture:perf` sans `baseline.json` | `?provider=fixture:perf` | Profil non commité : aujourd'hui **erreur explicite** (contexte neuf) ou **mode dégradé sur le cache** (§8.2 ACC-23) ; une fois généré sans `data:baseline`, chemin lent déclaré seulement dans la `coverageNote` (§8.3 (i)). |
| **D3-34 (d)** `coverageNote` sans écran | CSV `# couverture` | Voir décision (i) : dette confirmée, pas de bandeau dû ; recommandation Diagnostic (ACC-24). |
| **D8-32 / D3-08** (`co2Source`) | Diagnostic, CSV | « distribution mesurée : WLTP 8177, NEDC 5604, indéterminée 6205 » dans la `coverageNote` ; colonne absente de l'interface v1. |
| **DR-104 / AC-01** | toute l'application | Aucune donnée réelle : bandeau FIXTURE sur chaque écran, `tweedehands` refusé avec son motif. |

---

## 8. Constats

Sévérité (protocole du harnais) : **BLOQUANT** = un parcours cible ne se termine pas ou une statistique lue pour décider est fausse ; **MAJEUR** = exigence non tenue ; **MINEUR** = le reste. Reproductions sur le build de production, Chromium 141.

### 8.1 Statut des constats antérieurs

| Id | Sév. d'origine | **Statut rev 3** | Preuve |
|---|---|---|---|
| ACC-01 | MAJEUR | **CLOS** | suite ACC-01 ×3 (« 355 offres ; Filtre Carrosserie non appliqué… ») ; P1-6 desktop et mobile |
| ACC-02 | MAJEUR | **CLOS** (2.10) | suite : replié 90 / 115 / 65 px (≤ 11,3 %), déplié 320 px, collé sous l'en-tête à `scrollY` 1 200 (A et B) |
| ACC-03 | MAJEUR | **CLOS** (2.10) | suite mobile : G1 200 · G4 320 · additionnels 240 px, 5 lignes, 7 étiquettes / 14 barres, G8 10, G7 non tracé, appui long → feuille basse |
| ACC-04 | MINEUR | **CLOS** (2.10) | suite tablet ACC-04 vert |
| ACC-05 | MINEUR | **CLOS** | suite : « 1 rendus, 0 à « 0 modèles » » ; ad hoc : cardinal complet dès la première image |
| ACC-06 | MINEUR | **CLOS** (2.10) | suite : 313 brossées → `sel=390-23990_r24001-24298_k15200-420000` → 313 lignes → CSV 313 ; ad hoc : 310 → 310 → 310 |
| ACC-07 | MINEUR | **CLOS** (2.10) | suite : 338 + 7 + 6 + 4 = 355 (« hors des classes affichées » nommé) |
| ACC-08 | MINEUR | **CLOS** (2.10 + C-R1-03) | suite : gouttières 24 / 20 / 16, rayon 4, 0 cible sous seuil ; ad hoc : cible « Comparer » 32 / 32 / 44 px |
| ACC-09 | MINEUR | **CLOS** (2.10) | suite : 30 zones montées, carte 636 px, ombres de débord |
| ACC-10 | MINEUR | **CLOS** (2.10) | suite : 12 cartes montées, fenêtre suit le défilement (« Cadillac » avant « Jaguar ») |
| ACC-11 | MINEUR | **CLOS AVEC RÉSERVE** | suite : survol `rgba(0,0,0,0)` → teinte 4 %, coché = fond accent + texte blanc ; **couleur de focus ratifiée** (2.10 §5.1), amendement d'`EX-SCR-87` au commanditaire |
| ACC-12 | MINEUR | **CLOS** (2.10) | suite : G9 5 / 5, G12 4, G13 2 teintes ; G8 divergent ; G7 14 teintes de rampe B |
| ACC-13 | MINEUR | **CLOS** (2.10 + `mvp-integrate` §4.2) | suite ×3 « indicateur au repos : aucun » ; mode 1 câblé |
| ACC-14 | MINEUR | **CLOS** (2.10) | suite tablet / mobile ACC-14 verts |
| ACC-15 | MINEUR | **CLOS** | suite « 1 marque · 54 modèles · 2 197 offres » ; P1-4 « 1 marque · 4 modèles · 21 offres » (le pluriel « 1 modèles » du **résumé de carte** est repris dans ACC-21) |
| ACC-16 | MINEUR | **CLOS** (`mvp-integrate` §4.1) | « le filtre **Prix à** n'a pas pu être appliqué » (mode dégradé), « le filtre **Marque / Modèle / Version** … » (mmmv encodé) |
| C-3.5-01 | BLOQUANT (NFR-9) | **CLOS** (`fixture-perf`, D3-34/35) | §6.5 : premier chiffre ≤ 1 540 ms sur 60 mesures, deux profils |
| C-3.5-02 | MINEUR | **CLOS** (`data-fix-2`) | `draft-data-dictionary.md` l. 616 « [amendée 3.5 — D3-07] … 9 valeurs » |
| C-3.5-03 | à confirmer | **CLOS AVEC RÉSERVE** | décision (iii) §8.3 : P1 = 146 offres / 31 marques / 69 modèles sur le snapshot servi, 3 marques à n ≥ 12 |
| C-3.5-04 | informatif | **CLOS** | NFR-6/7/8 mesurés sur 355 / 321 points ; NFR-5 rejoué sur la cellule synthétique de 1 352 (§6.1) |
| C-3.5-05 | MINEUR | **CLOS** (`data-fix-2`) | `src/types/entities.ts:58` `readonly sourceKind: SourceKind` |
| C-R1-01 | garde-fou | **CLOS** (D3-34 b) | contrat : baseline servie 9 ms / 2 000, ingestion 3 172 ms / 10 000 |
| C-R1-02 | MAJEUR | **CLOS** | 1,00 × sur les trois projets ; ad hoc : 1 entrée NDJSON, aucun réessai |
| C-R1-03 | MAJEUR | **CLOS** (`fix-screens-3`) | ACC-08 0 cible ; cible 44 / 32 px mesurée |
| C-R1-04 | MAJEUR | **CLOS** (`fix-screens-3`, cause racine `data-fix-2`) | ACC-08bis 0 chevauchement (144 / 180 zones) ; capture R3-iv : 4 lignes par zone |
| C-R1-05 | MAJEUR | **CLOS** (`fix-screens-4`) | 72 px × 3 (suite) ; 72 / 72 / 72 (ad hoc, 36 cartes) ; décision (iv) |
| DR3-20 / R1 | MAJEUR | **CLOS** (`fix-providers-3`, D3-38) | recalcul type 7 = baseline (4 716 / 4 716) ; contrat `baseline-vs-engine` vert ; Aspid 17 664,5 → 17 665 € à l'écran ; **la question voisine de la cellule (EX-DATA-19(2)) reste ouverte : ACC-18** |
| DR3-21 … DR3-24 / R2–R5 | MINEUR | **CLOS** (`data-fix-2`, D3-39) | `test:data` 153 / 153 aux deux profils (P-24bis, P-72 par code, P-55 79 champs) ; `data:validate` conforme |
| C-P3-11 (liste d'arrêt) | — | **CLOS** (`mvp-integrate` §3, D3-34 a) | sondes D8 ; contrat 105 / 105 |

### 8.2 Constats nouveaux de la rev 3

| Id | Sév. | Exigence(s) | Constat et reproduction | Cause probable (E4) · correction attendue · qui |
|---|---|---|---|---|
| **ACC-17** | **MAJEUR** | `EX-DATA-64` (annexe A, arrondi de présentation), `EX-DATA-63`, `EX-SCR-6` | Depuis que les quantiles sont de type 7 (D3-38 e), l'arrondi de présentation de l'**année** n'est pas celui du dictionnaire : `p05` et médiane doivent être au **plancher**, `p95` au **plafond** ; l'application arrondit au plus proche. Écran A nu : **32 / 262 cartes** et **114 / 299 zones** (n ≥ 12) affichent une autre fourchette que la normative (ex. Alfa Romeo p95 2023,1 → « 2023 » au lieu de « 2024 » ; P1 : VW « 2017 – 2022 » pour 2016,8 / 2022,1 → « 2016 – 2023 »). Écran B : « 1ʳᵉ immat. médiane » de **196 / 1 451 modèles** (Toyota Corolla 2018,5 → « 2019 », plancher 2018 ; idem Audi TT, VW Touareg ; Alfa Romeo 2000 2009,5 → « 2010 »). **CSV mode 1** : `prix_median`, `prix_p5`, `prix_p95` écrits **bruts** (« euro entier » attendu) : 503 / 1 254 lignes décimales (`Volkswagen;Passat;209;12846.5;2964;19932.5;…`), 204 avec bruit binaire (`64164.79999999997`). Les prix à l'écran et les km sont, eux, arrondis conformément. | `src/screens/market/format.ts::formatYearRange` et `src/screens/distribution/format.ts::formatYear` (`Math.round`) ; `src/screens/market/csv.ts` (valeur brute). Correction bornée : plancher/plafond selon la position du quantile, `roundHalfAwayFromZero` dans le CSV ; sondes D6 rouge d'abord. **fix-screens** (Sonnet/high). Non bloquant : écart ≤ 1 an, valeurs exactes en amont. |
| **ACC-18** | **MAJEUR** | `EX-DATA-19(2)` (« tout affichage qui s'en prévaut **nomme sa cellule** »), `EX-DATA-60`, `EX-DATA-86`, cohérence A ↔ B | Pour un même modèle, l'écran A (Σ = snapshot ou marque) et l'écran B (Σ = cellule) publient des **statistiques de prix différentes**, parce que la sentinelle relative est calculée sur Σ (D3-37, `fix-providers-3` §3.1) : Golf « méd. 9 900 € » (A) contre « médiane 9 448 € » (B), n 552 / 576 ; Corsa 7 587 € (A nu) / 7 304 € (A `?mmmv=54`) / 6 970 € (B) ; Opel Ascona 2 995 € / 2 096 € (+43 %). **159 / 1 464 modèles** (64 / 289 à n ≥ 12) diffèrent entre A nu et B ; **aucune des deux surfaces ne nomme la cellule ni le seuil** (aucune occurrence de « cellule », « seuil » ou « vraisemblance » dans `src/screens/market` ni `DistributionScreen.tsx`). Ce n'est pas une erreur de calcul (les trois définitions coïncident à Σ égal) : c'est une **définition choisie** dont l'effet visible n'est pas étiqueté. Reproduction : `/marche` → carte Volkswagen → zone Golf « méd. 9 900 € » → clic → écran B « médiane 9 448 € ». | Décision de spécification due (commanditaire / coordinateur) : (a) **nommer** la cellule et le nombre d'annonces écartées par le seuil relatif dans l'infobulle des zones et de l'en-tête B (« n annonces sous 10 % de la médiane de la sélection exclues ») — petit, `fix-screens` ; ou (b) calculer `V_price` des agrégats **modèle** avec la cellule du modèle (amendement d'EX-DATA-19/86, moteur + provider). Réserve principale de cette rev. |
| **ACC-19** | **MAJEUR** | `EX-SCR-184` / `EX-SCR-158` (« Convertir la sélection en filtre »), D-03 (« jamais ignoré en silence »), `00-CONTEXT` mode 2 (« filtres applicables à la volée ») | Après un brossage de 310 annonces, le bouton **« Convertir la sélection en filtre »** retire `selx`/`sely` de l'URL mais **ne pose aucun filtre** : URL `?priceto=20000`, 331 offres, un seul jeton, **aucun bandeau, aucune erreur console** — sur les deux projections (« Nuée empilée » : 310 → rien ; « Prix × année » : 303 → rien). L'autre action, « Voir ces annonces », fonctionne (310 → 310). Le test E2E-06 ne vérifie que la **présence** des deux boutons. Reproduction : P2-4 → clic. | `DistributionScreen.tsx` l. 344-348 : `onConvertBrushToFilter` appelle `props.onApplyFilters(patch)` **puis** `props.onUiChange({ …ui, brushX: null, brushY: null })` ; les deux déclenchent chacun un `navigate` (`app.tsx` `applyFilters` / `applyUiState`) et le second sérialise la **sélection périmée** (sans le correctif), écrasant le premier. Correction : une seule navigation (`applyFilters(patch, uiSansBrossage)` — `applyFilters` accepte déjà `extraUi`) + assertion E2E sur les jetons posés. **fix-app / fix-screens**. À corriger avant le tag (bouton mort sur l'interaction phare). |
| **ACC-20** | **MAJEUR** | DF-2 (« la bascule est un paramètre… le seul qui se partage dans un lien », `registry.ts`), `EX-NAV-21/22` (`ET-URL-CORRIGEE`), D-03 (message sincère) | Toute URL portant `?provider=` est **réécrite sans le paramètre** dès le chargement par le correcteur d'URL, avec le bandeau « Paramètre « provider » corrigé : **paramètre inconnu ignoré**, valeur retenue aucune » — alors que la source demandée **a été appliquée** (Diagnostic `SYNTHETIC`, 100 000 offres). Conséquences : un **rechargement** (F5) ou la copie de l'URL après chargement revient à `fixture:test` (mesuré : `/marche?provider=synthetic` → `/marche`, source `SYNTHETIC` ; reload → `FIXTURE`, 19 986) ; la pose d'un filtre garde l'URL sans `provider`. Le bandeau apparaît aussi sur `fixture:dev`, `inconnu`, `tweedehands`, `fixture:perf`. `source-fixture.spec.ts` ne lit pas l'URL après chargement. | `src/state/corrections.ts` ne connaît pas le paramètre **réservé** `provider` (lu par `main.tsx` avant le routeur) et le traite comme un filtre inconnu. Correction : liste de paramètres réservés conservés tels quels et exclus du bandeau ; test E2E « l'URL porte encore `provider=` après chargement et après un changement de filtre ». **fix-state** (Sonnet/high). À corriger avant le tag (la bascule doit survivre à un rechargement pour être partageable). |
| **ACC-21** | **MAJEUR** | `EX-SCR-33` (paliers « appliqués uniformément » : 1 ≤ n ≤ 4 → aucune médiane), `EX-SCR-109`, `EX-SCR-1..4` | Le **résumé de carte** affiche « `<n>` modèles · **médiane** `<prix>` € » quel que soit `n_prix` : Aspid (n = 2) « 1 modèles · médiane 17 665 € » à côté d'une zone qui dit « 2 trop faible » ; Morgan (n = 1) « 1 modèles · médiane 6 950 € » (zone : « 1 seule offre ») ; Dangel « 2 modèles · médiane 37 945 € ». **171 / 262 marques** du snapshot servi ont 1 ≤ n_prix ≤ 4 (22 entre 5 et 11, 55 à n ≥ 12) : en fin de grille, deux cartes sur trois portent une « médiane » que le palier interdit — la zone, elle, applique la règle (D8-06). Accessoirement « 1 modèles » n'est pas accordé (même famille qu'ACC-15). | `view-model.ts::buildMakeCardViewModel` (`medianPriceLine` : `agg.price.p50 !== null ? … médiane …`) sans passer par `modelZoneMedianDisplay(agg.price.n)`/`effectifTier`. Correction bornée (même règle que la zone : « n trop faible », « 1 seule offre ») + accord du pluriel ; sonde D6. **fix-screens**. |
| **ACC-22** | MINEUR | `EX-SCR-112` (bande 72 px en large), `EX-SCR-135` (96 px en compact), `EX-SCR-122` (6 zones visibles avant repli), `EX-SCR-137` (3 colonnes ≥ 1 280 px) | Bande de zone-modèle **81 px** de 1 280 à 1 680 px (`min-height: 72px` + contenu 36 px + `padding` 2 × 4 px + rangée 1 de 16 px…), **105 px** à 768 (grille compacte appliquée par `@container (max-width: 767.98px)` au conteneur de 736 px, normatif 96) et **115 px** à 360 ; conséquence : la liste repliée (480 px, `EX-SCR-124`) montre **5,8 zones** en large (6ᵉ rognée de 17 px, défilable) et 4,5 zones à 768 pour un pied « + Afficher les 39 autres modèles ». Grille **2 colonnes à 1 280 px de viewport** (conteneur 1 248 px sous le seuil `@container (min-width: 1280px)`), 3 colonnes dès 1 366 px ; `EX-NFR-18` déclare pourtant `large` à 1 280. Résumé de carte 52 / 63 px (44 normatif). | `market.css` : hauteurs de bande non contraintes en `height`, seuils `@container` copiés des `@media` sans tenir compte des marges (`EX-SCR-137` parle de « largeur de contenu » pour 1 680, `EX-NFR-18` de viewport pour 1 280). Présentation, aucune valeur cachée ; à instruire avec D3-40b. **fix-screens**, ou dette écrite. |
| **ACC-23** | MINEUR | `EX-NFR-22` (bandeau lisible), `EX-DATA-107` (étiquette sincère), `EX-NAV-9` (décodage) | (a) Le « code » des bandeaux d'échec est un message **technique** : « code Jeu de données indisponible (404) : /fixtures/test/index.json. Vérifiez que les fixtures sont bien servies sous /fixtures (plugin kycar-fixture-data). » ou, pour un profil absent servi par le repli SPA, « code Unexpected token '<', "<!doctype "... is not valid JSON ». (b) `?provider=fixture:perf` (profil non commité) avec cache : bandeau de provenance « **(profil perf)** » au-dessus de données qui sont le **cache du profil test** (`ET-PARTIEL-CACHE` correct par ailleurs). (c) `mmmv` **percent-encodé** (`?mmmv=54%7C1918`, forme qu'un navigateur peut produire) non décodé : jeton « Marque nº 54%7C1918 », filtre déclaré non appliqué (D-03 respecté) ; la forme brute `54|1918` redirige bien vers B. | (a) code d'erreur court + détail en Diagnostic (`app.tsx`) ; (b) l'étiquette de profil doit suivre le **descripteur servi** (cache) plutôt que la spécification demandée (`app.tsx`/`source-notice.ts`) ; (c) `decodeURIComponent` sur la valeur de `mmmv` (`corrections.ts`/`url-codec.ts`). **fix-app / fix-state**. |
| **ACC-24** | MINEUR | D3-34 (d), `EX-DATA-107`, D-03 | La `coverageNote` (régime de vérification du `sha256`, artefact précalculé refusé, conditions hors vocabulaire, provenance CO₂) n'est lisible que dans la ligne `# couverture` des CSV (1 500 caractères) ; le panneau **Diagnostic**, qui existe pour cela, ne l'affiche pas. Aucun chiffre n'en dépend (verrou 2 de `fixture-perf` : une baseline démentie n'est plus servie). | une ligne « Note de couverture » dans `diagnostics` (`app.tsx`). **fix-app**. Voir décision (i). |

Récapitulatif rev 3 : **5 MAJEUR** (ACC-17, 18, 19, 20, 21), **3 MINEUR** (ACC-22, 23, 24), **0 BLOQUANT** : les deux parcours cibles se terminent avec des valeurs exactes et reproductibles ; aucun chiffre affiché n'est faux au sens de sa définition ; les MAJEUR sont, dans l'ordre, une définition à étiqueter (18), deux actions muettes (19, 20) et deux règles de présentation non appliquées (17, 21). Correctifs courts pour 17, 19, 20, 21 ; décision pour 18.

### 8.3 Décisions demandées à cette recette

**(i) `coverageNote` invisible (D3-34 d) — bandeau dû avant livraison ou dette ?** **Dette confirmée, bandeau non dû.** Motif : les trois informations que la note porte seule — régime du `sha256` (« vérifié à l'arrivée des annonces »), refus éventuel de l'artefact précalculé (chemin lent, chiffres identiques par construction), conditions hors vocabulaire — ne changent aucune valeur affichée et ne décrivent aucun état que l'utilisateur doive traiter ; ce qui exige une action ou une lecture prudente est déjà en bandeau (repli de source `ET-SOURCE-REPLI`, cache `ET-PARTIEL-CACHE`, filtres non appliqués, provenance FIXTURE). La note reste exportée dans chaque CSV (`# couverture`). **Recommandation** (ACC-24, MINEUR) : l'afficher dans le panneau Diagnostic, seul endroit où un lecteur attentif ira la chercher.

**(ii) Quantiles non entiers dans tout le produit (D3-38 e)** — exercé sur les quatre chemins : **affichage** : prix arrondis à l'euro, demi vers l'infini (10 704,5 → 10 705 ; 17 664,5 → 17 665) ✓, km plancher/plafond de centaine ✓, **année non conforme** (ACC-17) ; **CSV** : mode 2 (annonces, agrégats) entiers ✓, **mode 1 brut** (ACC-17) ; **URL partagées** : les quantiles n'entrent jamais dans une URL — `selx`/`sely` sont des coordonnées de brossage (déjà décimales en rev 2), `sel` porte des bornes d'annonces entières (`390-19990_r23919-24297_k15300-420000`), la conversion brossage → filtre (`brushToIntervalFilters`) n'utilise que des prix, km et années d'annonces (entiers) — et elle est de toute façon inopérante (ACC-19) ; **IndexedDB** : 93 / 262 lignes du cache portent des quantiles non entiers, relus et affichés à l'identique en mode dégradé ✓. Verdict : un seul chemin en défaut, la présentation (ACC-17).

**(iii) Densité de P1 (C-3.5-03) — le parcours cible est-il démontrable sur le profil `test` tel qu'il est ?** **Oui, démontrable de bout en bout** (P1-1 → P1-6, desktop et mobile, valeurs exactes) ; **non, il ne montre pas la présentation nominale** : sur le snapshot servi (S2, `be-20260921`), 146 offres · 31 marques · 69 modèles, **3 marques sur 31** atteignent n_prix ≥ 12 (VW 21, Renault 17, Opel 14) et **aucune** les 30 de M2 ; 28 cartes sur 31 et toutes les zones sauf Polo (15) sont en « fourchette observée (min – max, effectif réduit) ». DATASET-SPEC §1.4 annonce 137 / 33 sur S0 — cohérent (S2 diffère de S0). La suite exerce donc les deux régimes d'affichage, ce qui a une valeur de recette, mais la maquette « budget 20 000 €, coupé » de `00-CONTEXT` reste, sur ce jeu, un écran de petits effectifs. **Décision au commanditaire**, à consigner : (a) accepter pour le MVP (parcours P1 = démonstration du régime réduit, P2 = régime nominal) — mon avis ; ou (b) augmenter la part de coupés à prix modéré / le volume du profil servi (le budget NFR-9 n'y fait plus obstacle : la baseline pèse 15 Kio quel que soit le volume ; le coût est le NDJSON en arrière-plan, 2,7 Mio à 20 000).

**(iv) `EX-SCR-135` — en-tête de carte à 72 px en compact (hypothèse E4 de `fix-screens-4`)** : **conforme, hypothèse ratifiée.** L'annexe B (autorité sur la disposition, R-A09) fixe l'en-tête à **72 px** dans la table de la maquette structurelle (`EX-SCR-107`) sans restriction de régime ; `EX-SCR-135` ne redéfinit, en compact, que la zone (72 → 96 px), la barre de synthèse et le nombre de modèles visibles (4). Mesuré : 72 px aux trois régimes (36 cartes chacun ; suite C-R1-05 ×3). L'effet « un modèle de moins visible avant défilement » sur mobile n'est contraint par aucune exigence. En revanche la **bande de zone** dépasse sa valeur normative (ACC-22).

**(v) L'écart d'échantillon `EX-DATA-19(2)` entre écran A et écran B est-il nul ?** **À sélection égale, oui ; sur le parcours réel, non.** À Σ identique, les trois calculs (baseline du provider, moteur de l'écran B, mon recalcul) donnent les mêmes valeurs au bit près (4 716 / 4 716 ; contrat `baseline-vs-engine`). Mais l'utilisateur ne compare pas deux calculs à Σ égal : il lit une zone sur l'écran A nu (Σ = snapshot, seuil 1 599 €) puis l'écran B du même modèle (Σ = la cellule, seuil 933 € pour Golf, 695 € pour Corsa). Là, **159 modèles sur 1 464** (dont Golf, Corsa, Astra) affichent une médiane différente, et rien ne l'explique à l'écran (ACC-18). Cette conséquence était nommée par `fix-providers-3` §3.1 (« conséquence à ne pas prendre pour un écart… `EX-DATA-19` impose de nommer la cellule à l'écran ») ; la seconde moitié de la phrase n'est pas faite. Statut : **la définition est cohérente, l'étiquetage exigé par EX-DATA-19 est absent** → décision de spécification (a) ou (b) dans ACC-18.

---

## 9. Porte G9 et avis de livraison

### Porte G9 — conditions (PLAN-3 §3.5)

| Condition | État | Preuve |
|---|---|---|
| E2E verts sur 3 projets, provider fixture | **oui** | 351 tests : 323 verts + 3 attendus (D8-15) + 25 sautés motivés, 0 inattendu, 0 instable, 27,1 min (§2) |
| 0 violation axe | **oui** | 37 / 37 balayages (§5) |
| Budgets tenus | **oui** | NFR-5 p95 144–170 ms (navigateur) et 186,8 ms (banc) ; NFR-6 ≤ 226 ; NFR-7 ≤ 32 ; NFR-8 0 fenêtre en défaut ; **NFR-9 premier chiffre ≤ 1 540 ms sur 60 mesures, `test` et `dev`** ; NFR-10 135,81 / 300 Kio ; NFR-21 ouverture 1,3 s (§6) |
| Bascule `?provider=synthetic` fonctionnelle | **oui, avec réserve** | source, étiquette, effectifs et Diagnostic basculent (suite ×3, ad hoc) ; **ACC-20** : le paramètre ne survit pas dans l'URL (rechargement → défaut) et le bandeau le dit « ignoré » |
| `ACCEPTANCE.md` rev 3 livré | **oui** | ce document, 22 captures, `results.json` |
| Dettes nommées | **oui** | §7, §8.1, §8.3 |

### **PORTE G9 : FRANCHIE SOUS RÉSERVES NOMMÉES**

Les six conditions sont remplies et prouvées sur `df574ed`. Les réserves sont les cinq MAJEUR du §8.2 : une décision de spécification à prendre (**ACC-18**, étiquetage de la cellule du seuil relatif), deux actions muettes à réparer (**ACC-19** conversion du brossage, **ACC-20** paramètre `provider` effacé), deux règles de présentation à appliquer (**ACC-17** arrondi des années et du CSV mode 1, **ACC-21** médiane de carte sous n = 5). Aucune n'invente un chiffre ; aucune n'empêche P1 ou P2 de se terminer.

### Avis de livraison (fusion `main` + tag `v0.1.0`) — **prêt avec réserves nommées**

La décision reste au commanditaire. Mon avis :

1. **Ce qui est solide** : le MVP sert des données fictives **honnêtement étiquetées** sur chaque surface (bandeau, pied, mentions, Diagnostic, CSV) ; les chiffres affichés sont ceux des octets — vérifié par un recalcul indépendant écrit depuis le texte des exigences (262 marques, 4 716 valeurs, P1 146 / 31 / 69, Corsa 355 / 331 / 26, cinq marques dont trois à effectif pair) et par la suite de contrat ; le premier chiffre arrive en **1,5 s en 4G** sur les deux profils, sans double téléchargement ; le mode dégradé et l'échec total sont explicites et datés ; l'accessibilité automatisée est à zéro sur 37 balayages ; la finition 2.10 a fermé les douze constats de présentation de la rev 1 et les cinq constats C-R1 sont clos au rendu.
2. **À faire avant le tag, à mon avis** (deux correctifs courts, un test chacun) : **ACC-19** — un bouton visible de l'interaction phare ne fait rien ; **ACC-20** — une bascule de source qui ne survit pas à F5 n'est pas « un paramètre qui se partage », et son bandeau ment. Les deux tiennent dans une ligne de câblage et une entrée de liste.
3. **À trancher avant le tag** : **ACC-18** — dire à l'écran que la fourchette d'une zone et l'en-tête de l'écran B ne partagent pas la même cellule de vraisemblance (option (a), quelques mots dans deux infobulles) suffit à respecter `EX-DATA-19` ; l'option (b) est un chantier de spécification pour la v0.2.
4. **Acceptables en dette pour v0.1.0, à corriger en v0.1.1** : ACC-17 (arrondi des années ≤ 1 an ; CSV mode 1 exact mais non arrondi), ACC-21 (médiane sur 1 ou 2 annonces en fin de grille), ACC-22/23/24 (présentation et libellés). C-3.5-03 (densité de P1) est une propriété du jeu à accepter ou à régler par la donnée, pas par le code.

**Notes de version proposées (v0.1.0, MVP à données fictives)** — Source par défaut : jeu de données fictif à la forme AutoScout24, profil `test`, 3 snapshots hebdomadaires de 20 000 annonces (19 986 servies), généré de façon déterministe ; aucune annonce réelle, aucun lien avec AutoScout24, ce qui est écrit sur chaque écran. Agrégats de l'écran A précalculés et vérifiés à l'arrivée des annonces : premier chiffre ≈ 1,5 s en 4G. Quantiles de type 7 (EX-DATA-62) sur tout le produit ; axe année = première immatriculation. Bascule de source par `?provider=fixture:dev|synthetic` (réserve : à reposer après un rechargement — ACC-20). Connu et assumé : pas de réglage « Assainissement » (D8-15) ; pas d'effectifs sur les cases ni de suggestions chiffrées en mode 1 (D8-29/37) ; le filtre Carrosserie ne s'applique pas au niveau modèle, l'écran le dit (O15) ; anneau de focus jaune pour le contraste (EX-SCR-87) ; « Convertir la sélection en filtre » inopérant (ACC-19, corrigé en v0.1.1 si non fait avant) ; la médiane d'un modèle peut différer entre l'écran A et l'écran B selon la sélection de référence du seuil de vraisemblance (ACC-18) ; années des fourchettes arrondies au plus proche et non plancher/plafond (ACC-17) ; le parcours « budget 20 000 €, coupé, < 100 000 km » ne retient que 146 offres sur ce jeu (C-3.5-03).

Hypothèses de cette recette (E4) : moteur Chromium unique ; machine à quatre cœurs sans autre charge, budgets évalués sur la médiane avec séries publiées ; jeu de fixtures à graine fixe (les effectifs sont ceux du snapshot `be-20260921T060000Z`, pas de S0) ; 5 000 points de nuage inatteignables sur ce profil ; les causes probables du §8.2 sont des lectures de code, non des correctifs éprouvés.

---

## Annexe — fichiers produits par la rev 3

| Fichier | Contenu |
|---|---|
| `reports/ACCEPTANCE.md` | ce rapport (partie I rev 3 ; partie II rev 2 et rev 1 conservées) |
| `reports/acceptance/R3-P1-1-ecran-A-nu-desktop.png` | écran A nu : 262 marques · 1 464 modèles · 19 986 offres, bandeau FIXTURE |
| `reports/acceptance/R3-P1-2-ecran-A-filtre-{desktop,mobile}.png` | écran A, trois filtres : 31 marques · 69 modèles · 146 offres ; VW 21 · Renault 17 |
| `reports/acceptance/R3-P1-4-ecran-A-marque-desktop.png` | écran A, `mmmv=74` : 1 marque · 4 modèles · 21 offres |
| `reports/acceptance/R3-P1-6-ecran-B-modele-{desktop,mobile}.png` | écran B Volkswagen Polo, 149 offres, bandeau « Filtre Carrosserie non appliqué » |
| `reports/acceptance/R3-P2-1-ecran-B-entete-{desktop,mobile}.png` | écran B Opel Corsa ≤ 20 000 € : 331 offres (en-tête 3 lignes / 5 lignes) |
| `reports/acceptance/R3-P2-2-ecran-B-histogrammes-desktop.png` | G1 (327) – G2 (320) – G3 (321) et tables |
| `reports/acceptance/R3-P2-3-ecran-B-nuage-G4-{desktop,mobile}.png` | nuage G4 310 points ; compact 320 px, projection imposée |
| `reports/acceptance/R3-P2-4-ecran-B-brossage-desktop.png` | brossage : 310 annonces sélectionnées, deux actions |
| `reports/acceptance/R3-P2-5-ecran-D-annonces-{desktop,mobile}.png` | écran D : 310 / 331 sous `sel` 2D (desktop) ; 331 / 331 en cartes (mobile) |
| `reports/acceptance/R3-E-1-bandeau-fixture-desktop.png`, `R3-E-2-mentions-desktop.png` | étiquette FIXTURE, `/mentions` |
| `reports/acceptance/R3-E-3-provider-inconnu-repli-desktop.png`, `R3-E-4-provider-synthetic-desktop.png` | `ET-SOURCE-REPLI` ; bascule synthétique (avec le bandeau `ET-URL-CORRIGEE` d'ACC-20 visible) |
| `reports/acceptance/R3-NFR23-echec-total-desktop.png`, `R3-NFR22-cache-degrade-desktop.png` | échec total avec « Réessayer » ; mode dégradé daté sur cache IndexedDB |
| `reports/acceptance/R3-A-zones-comparer-tablet.png` | écran A dense, zones déployées, cases « Comparer » (C-R1-03), balayage axe à 0 |
| `reports/acceptance/R3-iv-carte-compact-mobile.png` | carte compacte : en-tête 72 px, zones à 4 lignes (C-R1-04/05), bande de 115 px (ACC-22) |
| **Total** | **22 captures PNG** (viewport, DPR 1), 2,2 Mo ; + 18 captures des rev 1/2 conservées |
| `reports/e2e/results.json` | résultats Playwright de l'exécution rev 3 du 2026-09-14 00:08 UTC sur `df574ed` (D8-33) |

Commandes et scripts (hors dépôt, scratchpad de session) : `recalc.mjs` (recalcul indépendant), `nfr9.mjs`, `nfr5.mjs`, `nfr22.mjs`, `parcours.mjs` + `parcours-rest.mjs`, `provenance.mjs`, `axe.mjs`, `quantiles.mjs`, `followup.mjs`, `dbg-*.mjs` ; `npm run build`, `npm run size`, `npm run test:e2e`, `npm run test:contract`, `KYCAR_DATA_PROFILE=test npm run test:data`, `npm run test:data`, `npm run data:validate -- --profile test|dev`, `npm run data:baseline -- --profile test|dev --check`, `npx vitest run --config vitest.perf.config.ts src/engine/recalc.perf.test.ts`.

---
---

# Partie II — Historique conservé : rev 2 (`947dbc4`, porte G8) et rev 1 (`1424dc3`)

Texte de la rev 2 reproduit tel quel (il contient lui-même la rev 1) ; ses titres sont préfixés « R2 · » pour rester retrouvables sans se confondre avec la partie I.

## R2 · ACCEPTANCE — recette finale navigateur (phase 2.9b, PLAN-2 §2.9) — rev 2

| | |
|---|---|
| **Date** | 2026-09-08 — rev 1 : exécution 22:22 → 23:05 UTC sur `1424dc3` ; **rev 2 : 23:25 → 23:50 UTC sur `947dbc4`** (après le lot `fix-app-3`, D8-44) |
| **Commit recetté** | **`947dbc4`** (rev 2), branche `claude/kycar-project-ffcplk`, arbre propre avant la recette ; rev 1 sur `1424dc3` (`13e8a4cfc3b0324d0709b94102cbf12352af9187`) |
| **Agent** | `acceptance` — modèle Fable, effort **max** |
| **Navigateur** | Chromium **141.0.7390.37**, build Playwright `chromium-1194` préinstallé (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, détecté par `executablePath`) ; aucun `playwright install` |
| **Outillage** | `@playwright/test` 1.63.0, `@axe-core/playwright` 4.13 (tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`) ; Node 22.22.2 |
| **Projets / viewports** | `desktop` 1280 × 800 · `tablet` 768 × 1024 · `mobile` 360 × 740 (`isMobile`, `hasTouch`) ; `locale fr-BE`, `Europe/Brussels` |
| **Serveur testé** | build de production `vite preview --port 4180 --strictPort`, `reuseExistingServer: false` ; port 4180 vérifié **libre** avant lancement (`ss` indisponible dans l'environnement : `/proc/net/tcp`, 0 socket `LISTEN` sur `0x1054`) ; `KYCAR_E2E_PORT` non utilisé |
| **Réseau** | uniquement `localhost:4180` (E5) ; le seul lien sortant exercé par la suite (`Ouvrir l'annonce d'origine`) ouvre un onglet vers une URL synthétique interceptée, jamais chargée |
| **Build** | rev 2 : `npm run build` : `tsc` app + worker, `vite build` 149 modules — **0 erreur, 0 warning** ; `npm run size` : **103,12 Kio** gzip d'entrée + 13,46 Kio worker = **116,58 / 300 Kio** (`EX-NFR-10`, +0,24 Kio depuis la rev 1), différé 0,00 / 400 Kio |
| **Écrits par cette recette** | ce rapport ; `reports/acceptance/*.png` (**18** captures, 1,7 Mo : 17 de la rev 1 + `ACC-01-ecran-B-corsa-body-desktop.png`) ; `reports/e2e/results.json` régénéré par la rev 2 (D8-33) ; aucun fichier de `src/`, `tests/`, `docs/` touché |

---

## R2 · 0. Rev 2 — ce qui a changé (2026-09-08, 23:25 → 23:50 UTC, commit `947dbc4`)

Le coordinateur a fait corriger par le lot `fix-app-3` (Opus/high, commits `27c5a58`, `ffb3a75`, rapport `reports/remediation-2.8/fix-app-3.md`) les constats **ACC-01** (MAJEUR), **ACC-05** et **ACC-15** de la rev 1, et a consigné les autres en dette de présentation (`FIX-LEAD-DECISIONS-2.8.md` §H, D8-41 à D8-44). La rev 2 rejoue **toute** la recette sur `947dbc4` et les trois constats de manière ciblée. Ce qui change dans ce document :

| Où | Rev 1 (`1424dc3`) | **Rev 2 (`947dbc4`)** |
|---|---|---|
| Suite E2E (§2) | 255 tests : 243 verts, 3 attendus, 9 sautés | **264 tests : 251 verts, 3 attendus (D8-15), 10 sautés, 0 inattendu, 0 instable**, 10 min 22 s. Les +9 tests sont ceux de `fix-app-3` : `ACC-01` (×3), `ACC-05` (×2 + 1 sauté en compact, `EX-SCR-135`), `ACC-15` (×3). Le 10ᵉ saut est donc **attendu et légitime** : le cardinal « modèles » n'existe pas sous 768 px |
| ACC-01 (§8) | MAJEUR ouvert | **CORRIGÉ** — rejoué sur les trois projets : `?body=3` → 1 352 offres, jeton actif, bandeau `ET-FILTRE-NON-APPLIQUE-BODY` au mot près ; un second filtre `T` posé depuis le bandeau en mode 2 (`gear=M`) est déclaré par `ET-FILTRE-NON-APPLIQUE` ; même état après rechargement en contexte neuf (`EX-NAV-18`) ; aucun faux positif sans filtre |
| ACC-05 (§8) | MINEUR ouvert | **CORRIGÉ** — échantillonnage à chaque image posé avant tout script : **1 seul rendu** de la barre, « 294 marques · 3 021 modèles · 100 000 offres » dès la première image (443 ms), idem « 107 marques · 908 modèles · 2 632 offres » sur l'URL P1 (563 ms) ; 0 « 0 modèles », 0 « — modèles » (le cardinal vient désormais de `MakeAggregate.modelCount`, connu dès les agrégats de marque) |
| ACC-15 (§8) | MINEUR ouvert | **CORRIGÉ** — « **1 marque** · 120 modèles · 9 340 offres » (`?mmmv=74`) ; cas d'origine « **1 marque** · 69 modèles · 280 offres » ; compact « 1 marque · 9 340 offres » |
| ACC-02…04, 06…14 (§8) | ouverts | **DETTE D8-43** (présentation), inchangés au rendu — non rejoués, aucun fichier concerné modifié par `fix-app-3` |
| Nouveau (§8) | — | **ACC-16** MINEUR : le bandeau générique nomme le filtre par son identifiant technique (« le filtre **gearType** n'a pas pu être appliqué ») — comportement préexistant du mode 1, étendu au mode 2 par la correction ; relevé par `fix-app-3` §7.1 comme hypothèse, confirmé ici au rendu |
| Budgets (§6) | — | **aucune régression** : NFR-9 30 mesures, max 1 760 ms (médianes 1 495–1 523 nu, 1 542–1 627 filtré) ; NFR-6 médiane 128 / 144 / 140 ms ; NFR-7 médiane 25 / 21 / 26 ms ; NFR-8 0 fenêtre en défaut, min 52–55 img/s ; axe 24 / 24 à 0 ; bundle +0,24 Kio |
| §3 | réserves sur `EX-NAV-18`, `EX-SCR-106/107`, `EX-SCR-221` | **levées** — `EX-SCR-221` passe à TENUE |
| §9 | oui avec réserves, réserve principale = ACC-01 | **oui avec réserves** — la réserve principale est **levée** ; restent les dettes de présentation D8-43 |

Les sections suivantes conservent les mesures de la rev 1 là où rien n'a changé (indiqué « rev 1 » quand la distinction importe) et portent les valeurs de la rev 2 partout où la suite ou le rejeu les a renouvelées.

Sources lues avant la recette : `CLAUDE.md`, PLAN-2 §2.9 et table des portes, `REQUIREMENTS.md` v1.3 et annexes, `FINAL-VERIFICATION.md` (§3.2(b) : les 15 exigences « mesures au rendu »), `REMEDIATION-2.8.md` rev 3 (§3.5, §6.7, §7.5), `e2e-harness.md`, `FIX-LEAD-DECISIONS-2.8.md`, `tests/e2e/README.md`, `_helpers.ts`, `playwright.config.ts`, les neuf `*.spec.ts`.

Toutes les mesures « ad hoc » de ce rapport ont été prises par des scripts Playwright hors dépôt (scratchpad de session), sur le même Chromium et le même build, **après** la suite et **jamais en parallèle** d'une autre mesure. Aucun test du dépôt n'a été modifié.

---

## R2 · 1. Verdict des critères S1–S4 (PLAN-2 §2.9)

| Critère | Énoncé | Verdict | Preuve |
|---|---|---|---|
| **S1** | `npm run test:e2e` vert sur les trois projets | **ATTEINT** | rev 2 : 264 tests : **254 « passed »** au sens Playwright (251 verts + **3 échecs attendus**, un par projet, tous `DETTE D8-15 — EX-SCR-95`), **10 sautés** motivés (§2), **0 inattendu, 0 instable**, `retries: 0`, 10 min 22 s (rev 1 : 255 / 243 / 3 / 9 / 0) |
| **S2** | zéro violation axe-core A/AA sur les huit surfaces, toute exception nommée et motivée | **ATTEINT** | rev 2 : 8 surfaces × 3 projets = **24 balayages, 0 violation** (§5) ; surface D rendue et prononcée ; **aucune exception demandée** ; rev 1 : deux balayages complémentaires hors périmètre (feuille « Filtres » compacte, écran B brossé) : 0 violation |
| **S3** | `EX-NFR-9` ≤ 2 000 ms en 4G simulée ; `EX-NFR-7`/`8` tenus au rAF, mesurés et cités | **ATTEINT** | rev 2 : NFR-9 30 mesures, **max absolu 1 760 ms** (tablet, URL filtrée), médianes 1 495–1 523 ms nu et 1 542–1 627 ms filtré (§6.4) ; NFR-7 sur nuage **non vide** (1 232 points tracés) : médiane 21–26 ms, max 42 ms (rev 1 ad hoc avec brossage : max 54 ms) ; NFR-8 : 0 fenêtre < 30 img/s sur 93–95 fenêtres par projet, plancher 52–55 img/s (rev 1 avec brossage réel : 49–60) (§6.2–6.3) |
| **S4** | les deux parcours cibles journalisés avec captures | **ATTEINT** | P1 et P2 rejoués sur desktop **et** mobile (rev 1), 17 captures + 1 (rev 2), valeurs relevées confrontées à `P1_EXPECTED`/`P2_EXPECTED` et à la vérité terrain D8 (§4) ; les valeurs de P1 touchées par `fix-app-3` (barre de synthèse) ont été rejouées en rev 2 : identiques à l'unité, libellés corrigés |

Les quatre critères sont atteints en rev 1 comme en rev 2. La rev 1 avait révélé **15 constats nouveaux** (§8) — trois MAJEUR, douze MINEUR — presque tous sur les exigences « mesures au rendu » que 2.7 avait renvoyées à cette phase sans les juger. Aucun n'était BLOQUANT au sens du protocole. Le seul qui touchait la lecture d'une statistique — `ACC-01`, un effectif **non filtré sous un jeton de filtre actif** sans la mention que D8-20 promettait — est **corrigé et rejoué vert en rev 2**, avec `ACC-05` et `ACC-15` ; les douze autres sont consignés en dette de présentation (D8-43). Un constat MINEUR nouveau apparaît en rev 2 (`ACC-16`, libellé technique du bandeau générique).

---

## R2 · 2. Décomptes E2E par projet

**Rev 2** — `npm run test:e2e` sur `947dbc4`, `workers: 1`, `fullyParallel: false`, `retries: 0`, début 23:25:28 UTC, durée totale **622,0 s** (build + serveur + 3 projets). Source : `reports/e2e/results.json` (régénéré par cette exécution).

| Projet | Total | Verts | Échecs attendus (`test.fail()`) | Sautés | Inattendus | Instables | Durée cumulée des tests |
|---|---:|---:|---:|---:|---:|---:|---:|
| `desktop` 1280 | 88 | **85** | 1 | 2 | **0** | 0 | 211,7 s |
| `tablet` 768 | 88 | **85** | 1 | 2 | **0** | 0 | 215,1 s |
| `mobile` 360 | 88 | **81** | 1 | 6 | **0** | 0 | 180,2 s |
| **Total** | **264** | **251** | **3** | **10** | **0** | **0** | 607,0 s |

Rev 1 (`1424dc3`, 22:22 UTC, 601,9 s) pour mémoire : 85 / 85 / 85 tests, 82 / 82 / 79 verts, 1 / 1 / 1 attendu, 2 / 2 / 5 sautés, 0 inattendu. La rev 2 ajoute les **9 tests** écrits par `fix-app-3` (`partage-url` › ACC-01 ×3 ; `parcours-p1` › ACC-05 ×3 dont 1 sauté, ACC-15 ×3) : **tous verts** là où ils s'exécutent.

**Les 3 échecs attendus** — un seul appel `test.fail()` dans `tests/e2e/responsive.spec.ts:208`, `DETTE D8-15 — les réglages « Assainissement KYCAR » ne sont offerts nulle part (EX-SCR-95)`, exécuté dans les trois projets ; mesure publiée : `points d'entrée « Assainissement KYCAR » trouvés : 0`. Conforme à `REMEDIATION-2.8` §5.2 et à la décision D8-15. Aucun autre `test.fail()` (vérifié : `grep -rn 'test\.fail(' tests/e2e/` = 1 occurrence).

**Les 10 sautés** (9 en rev 1 + le nouveau test ACC-05 en compact), tous des inadéquations de plate-forme motivées dans le test lui-même (jamais un masquage) :

| # | Projet | Test | Motif cité par le test | Légitimité |
|---|---|---|---|---|
| 0 | mobile | `parcours-p1` › ACC-05 — la barre de synthèse n'affiche jamais « 0 modèles » (**nouveau, rev 2**) | `EX-SCR-135` : le cardinal « modèles » est absent par contrat en régime compact | Légitime : même contrat que le n° 1 ; en compact la barre affiche « 294 marques · 100 000 offres » (mon rejeu, 1 rendu) — il n'y a rien à échantillonner |
| 1 | mobile | `parcours-p1` › CONSTAT E2E-04 — cardinal « modèles » | `EX-SCR-135` : le cardinal « modèles » est absent par contrat en régime compact | Légitime : la barre compacte affiche `<n> marques · <n> offres` (vérifié : « 107 marques · 2 632 offres — 36 marques affichées ») |
| 2 | mobile | `parcours-p2` › brossage du nuage : bornes dans l'URL | `EX-NFR-19` : sous 768 px, projection 2D dégradée, brossage désactivé par contrat | Légitime : contrat de dégradation ; le zoom reste offert (test dédié vert) |
| 3 | mobile | `parcours-p2` › CONSTAT E2E-03 — seconde projection | `EX-NFR-19` : la bascule de projection n'existe pas en régime dégradé | Légitime : projection imposée (`tablist` absent, vérifié par `responsive.spec`) |
| 4 | mobile | `parcours-p2` › CONSTAT E2E-06 — brossage → sélection | `EX-NFR-19` : brossage désactivé par contrat en régime dégradé | Légitime, même contrat |
| 5 | mobile | `parcours-p2` › CONSTAT E2E-07 — pagination, tri, « Ouvrir ↗ » | `EX-SCR-209` : l'écran D est rendu en cartes sous 768 px, sans en-tête de tri | Légitime ; ma mesure compact (§4.3) : 50 cartes par page, 50 boutons « Ouvrir l'annonce d'origine », pagination `1 / 11` |
| 6 | desktop | `responsive` › CONSTAT E2E-17 — couleur = année en dégradé | la dégradation d'`EX-NFR-19` ne s'applique que sous 768 px | Légitime : hors compact la légende de G4 est « Kilométrage » + « Taille » (mesuré) |
| 7 | tablet | idem E2E-17 | idem | idem |
| 8 | desktop | `responsive` › CONSTAT E2E-18 — libellé « Réduire à 4 modèles » | le libellé n'est vérifiable que dans le régime qui replie à 4 | Légitime : à 1280/768 le repli est 6 (mesuré « − Réduire à 6 modèles ») |
| 9 | tablet | idem E2E-18 | idem | idem |

Aucun `test.skip` n'est lié à Firefox/WebKit : la suite ne déclare que des projets Chromium (voir `EX-NFR-17`, §3.1). **Aucun test rejoué** en rev 1 ni en rev 2 : il n'y a eu aucun échec inattendu à départager. **Aucune régression** entre les deux exécutions : les 255 tests de la rev 1 ont le même statut en rev 2.

---

## R2 · 3. Matrice exigence navigateur → test → résultat → capture

Cotes : **TENUE** (prouvée au rendu), **PARTIELLE** (une partie des clauses tenue, l'écart nommé), **NON TENUE**, **DETTE Dx-nn** (écart couvert par une décision écrite). Les tests cités sont ceux de `tests/e2e/` (fichier › titre abrégé) ; « ad hoc » renvoie à mes scripts (§6, §8).

### R2 · 3.1 Exigences non fonctionnelles navigateur (`EX-NFR-*`)

| Exigence | Test / mesure | Résultat (3 projets sauf mention) | Capture |
|---|---|---|---|
| `EX-NFR-2` recalcul sans rechargement | `parcours-p1` › changement de filtre R : témoin de session survit | **TENUE** | P1-2 |
| `EX-NFR-5` (rappel 2.8, hors navigateur) | `REMEDIATION-2.8` §2.2 : FULL p95 **181,1 ms**, élagué p95 92,4 ms | TENUE (rappel, non remesurée ici) | — |
| `EX-NFR-6` histogramme ≤ 300 ms p95 | `perf` › EX-NFR-6 (bascule log G1, 1 352 annonces) : **128 / 131 / 143 ms** médiane, max 170 ms ; ad hoc : dépliage table 22–23 ms, recalcul filtre + repeint 73–111 ms | **TENUE** — prémisse « 100 000 annonces » sans objet (O17, plus grosse cellule 1 352) | P2-2 |
| `EX-NFR-7` nuage ≤ 500 ms p95 | `perf` › EX-NFR-7 sur **1 232 points tracés** : 20 / 23 / 21 ms médiane ; ad hoc 7 zooms : 31 / 31 / 24 ms médiane, max 54 ms (§6.2) | **TENUE** — 5 000 points inatteignables sur le snapshot (hypothèse §6.2) | P2-3 |
| `EX-NFR-8` ≥ 30 img/s sur ≥ 95 % des fenêtres | `perf` › EX-NFR-8 : 94 / 94 / 93 fenêtres, **0 en défaut**, min 53 / 52 / 54 img/s ; ad hoc avec brossage réel : 90 / 92 / 92 fenêtres, 0 en défaut, min 59 / 49 / 60 (§6.3) | **TENUE** | P2-4 |
| `EX-NFR-9` ≤ 2 000 ms en 4G simulée | `perf` › EX-NFR-9 et 9bis : séries complètes §6.4 — rev 2 **max 1 760 ms** (rev 1 : 1 735 ms), médianes 1 495–1 627 ms | **TENUE** | P1-1 |
| `EX-NFR-10` bundle initial ≤ 300 Ko | `npm run size` : 116,34 Kio gzip (entrée + worker) | **TENUE** | — |
| `EX-NFR-11` bundle différé ≤ 400 Ko | 0,00 Kio (aucun chunk différé) | TENUE (sans objet) | — |
| `EX-NFR-12` lien d'évitement, focus, titres | `clavier` › lien d'évitement premier arrêt ; E2E-15 (h1 sur A) ; E2E-16 ×2 (focus dans `#kycar-main` au chargement et après navigation) ; `document.title` par route | **TENUE** | — |
| `EX-NFR-13` contraste | `a11y` : règle `color-contrast` sur les 8 surfaces = 0 nœud ; jetons `tokens.css` calculés | **TENUE** pour le texte DOM ; le texte peint dans le canvas G4 et les marqueurs SVG ne sont pas évalués par axe (limite reconduite du harnais §6.5) | — |
| `EX-NFR-14` clavier 100 % | `clavier` › ligne primaire : **70 / 70** atteints dans l'ordre du DOM ; ad hoc bandeau entier : **191 / 191** (desktop, tablet), **121 / 121** (mobile, feuille ouverte), ordre = DOM, anneau 2 px sur **tous** les arrêts (§6.6) ; écran G : 6 arrêts, retour du focus au bouton appelant (E2E-14 vert) | **TENUE** | — |
| `EX-NFR-15` tables équivalentes | `parcours-p2` › G1–G3 doublés de leur table (lignes = barres, Σ ≤ effectif) ; E2E-08 : G5, G8–G15 sans table vide | **TENUE** | P2-2 |
| `EX-NFR-16` axe-core A/AA | `a11y` : 8 surfaces × 3 projets, **0 violation** (§5) | **TENUE** | — |
| `EX-NFR-17` navigateurs (Chrome, Firefox, Edge, Safari ×2 versions) | aucun test : l'environnement ne fournit que Chromium 141 et `playwright install` est interdit (E5) | **PARTIELLE — hors périmètre de cette recette** : Chrome/Edge (Blink) couverts par transitivité raisonnable, Firefox et Safari **non exercés**. Dette d'environnement, pas de produit ; à lever hors session | — |
| `EX-NFR-18` points de rupture | `responsive` › régime déclaré : `large` / `intermediate` / `compact` | **TENUE** | P1-2 desktop vs mobile |
| `EX-NFR-19` dégradation < 768 px | `responsive` › projection 2D imposée, zoom offert, couleur = année (E2E-17), cartes et histogrammes fonctionnels, aucun débordement horizontal (E2E-19) | **TENUE** | P2-3 mobile |
| `EX-NFR-31` impression | `impression` › règles 1, 2, 4 ; E2E-20 (`market.css` livré, barre collante) ; E2E-22/23 (résumé imprimé, un filtre par ligne : « Prix : ≤ 20 000 € / Kilométrage : ≤ 100 000 km / Carrosserie : Coupé ») ; écran B sans contrôle | **TENUE** | — |

### R2 · 3.2 Navigation et persistance (`EX-NAV-*`, `EX-CRUD-*`)

| Exigence | Test | Résultat | Capture |
|---|---|---|---|
| `EX-NAV-9` URL canonique | `parcours-p1` › pose des quatre filtres : `?body=3&kmto=100000&priceto=20000`, `cy` jamais sérialisé | **TENUE** | P1-2 |
| `EX-NAV-11` plafond d'URL | `partage-url` › > 2 000 caractères refusé : « limite d'URL atteinte, retirez un filtre pour en ajouter un autre » | **TENUE** | — |
| `EX-NAV-12`/`13` historique | `parcours-p1` › retour arrière : une entrée par changement, état restauré (107 marques) | **TENUE** | — |
| `EX-NAV-17` conservation des filtres mode 2 → 1 | `parcours-p2` › EX-SRCH-14 : `/marche?mmmv=74&priceto=20000` | **TENUE** | — |
| **`EX-NAV-18`** partage d'URL | `partage-url` › mode 1 et mode 2 rouverts dans un **contexte neuf** : signatures identiques (`138\|4645\|2\|Prix : ≤ 20 000 € × Carrosserie : Coupé ×` // idem ; `54` // `54`) ; rev 2 : `…/1918-corsa?body=3&gear=M` rouverte en contexte neuf → 1 352 offres, deux jetons, deux bandeaux de non-application identiques à l'onglet d'origine | **TENUE** — réserve `ACC-01` de la rev 1 **levée** en rev 2 (le filtre ignoré est désormais déclaré, à l'identique dans les deux contextes) | — |
| `EX-NAV-19`/`20` erreurs de route | `partage-url` › marque inconnue, modèle hors marque : écrans nommés, filtres conservés ; `clavier` › `Page introuvable` | **TENUE** | — |
| `EX-NAV-21`/`22`, `ET-URL-CORRIGEE` | `partage-url` › E2E-26 : quatre classes de défaut signalées et réécrites, « corrections appliquées en silence : (aucune) » | **TENUE** | — |
| `EX-SCR-140`/`DR-099` canonisation | `partage-url` › `/`, `/modele/:m/:m`, slug erroné → `replaceState`, requête conservée | **TENUE** | — |
| `EX-CRUD-1`/`3` | `persistance` › entrée + index (`kycar:saved-searches/<id>`, `#index`) ; E2E-24 : « Recherche enregistrée. » sans faux doublon | **TENUE** | — |
| `EX-CRUD-5`, `EX-CRUD-10` plafonds | messages exacts « Limite de 50 recherches atteinte — … », « Limite de 30 modèles suivis atteinte — … », jamais appliqués en dépassement | **TENUE** | — |
| `EX-CRUD-6` (`ARB-45`) | `dernier_accès_le` mis à jour, valeurs figées intactes | **TENUE** | — |
| `EX-CRUD-9`/`10` suivi depuis B | écran F liste le modèle, onglet le compte | **TENUE** | — |
| `EX-CRUD-14`/`15`, `EX-DATA-123bis` export mode 1 | `parcours-p1` › `kycar_agregats-mode1_be-synthetic-100000-4b594341_20260909.csv`, BOM, 3 lignes `#`, en-tête de 15 colonnes exact, 70 lignes, aucun champ R3 | **TENUE** | — |
| `EX-CRUD-16` export mode 2 | `parcours-p2` › E2E-10 (téléchargement réel) ; ad hoc : menu `Exporter` = exactement `Annonces du périmètre (CSV)` + `Agrégats affichés (CSV)` ; annonces : 508 lignes, 19 colonnes (`listing_id;prix;annee_mois;km;carburant;puissance_kw;prix_attendu;ecart_pct;score_opportunite;drapeaux_outlier;cellule;cellule_n;url;modele_version;type_vendeur;pays;region;etat_usage;tva`), aucun identifiant de vendeur ; agrégats : 62 lignes, `graphe;index;borne_basse;borne_haute;ouvert;effectif;part`, trois graphes | **TENUE** — réserve `ACC-06` (dette D8-43) sur l'export depuis D sous `sel` | — |
| `EX-CRUD-18` blob illisible | préservé sous `kycar:saved-searches.corrupt` | **TENUE** | — |
| **`EX-CRUD-19`** concurrence inter-onglets | `persistance` › écritures séquentielles : 2 entrées `[Onglet A, Onglet B]` sans rechargement ; E2E-25 : **0 ronde perdante sur 8** dans les trois projets (contre 7–8 / 8 en 2.9a) | **TENUE** (sonde probabiliste par nature, 24 rondes sans perte) | — |

### R2 · 3.3 Écrans et états visibles (`EX-SCR-*` exercés par la suite)

| Exigence | Test | Résultat |
|---|---|---|
| `EX-SCR-17` bascule log de G7 seul | `parcours-p2` › ordonnée 322 → 97, `?g7log=1`, `EX-NAV-18` | **TENUE** |
| **`EX-SCR-26`** ET-VIDE-FILTRES | `parcours-p2` › sélection vide : « Aucune offre ne correspond · 2 filtres actifs… · retirer « Première immatriculation : 1950 – 1960 » : 1 352 offres de plus » → 1 352 obtenues ; « Réinitialiser tous les filtres » | **COUVERTE en mode 2 · DETTE D8-37 en mode 1** (re-cotation §3.5 de REMEDIATION-2.8, reprise ici) |
| `EX-SCR-65`, `89`, `90` facettes | — | **COUVERTE en mode 2 · DETTE D8-29 en mode 1** (reprise) |
| `EX-SCR-95` réglages Assainissement | `responsive` › `test.fail()` ×3 | **DETTE D8-15** |
| `EX-SCR-96`/`98`, `EX-SCR-215` feuilles du bandeau et de G | E2E-21 : règles CSS chargées `true / true / true` | **TENUE** |
| `EX-SCR-97` régime compact du bandeau | ad hoc compact (§6.7) : barre unique **56 px**, bouton `Filtres (3)` **44 px**, feuille `position: fixed` 360 × 740 à application différée, pied « Réinitialiser · Voir les 2 632 offres » | **TENUE** |
| `EX-SCR-101` filtre invalide conservé | `partage-url` › marque absente : jeton ambre, infobulle « Cette marque est absente du snapshot du 01/09/2026 », « 2 filtres actifs · 1 filtre sans effet » | **TENUE** |
| `EX-SCR-103` contrôle Marque/Modèle de B | `parcours-p2` › EX-SRCH-14 | **TENUE** |
| `EX-SCR-106`, `107`, `113`, `118`, `132` écran A | `parcours-p1` › synthèse, tri, fourchette « fourchette centrale (90 % des offres) », C3, amorce ; E2E-04/05 (cardinaux ≠ 0 après enrichissement) ; **rev 2** : `parcours-p1` › ACC-05 (« 1 rendus, 0 à « 0 modèles » » desktop et tablet) et ACC-15 (« 1 marque · 120 modèles · 9 340 offres ») verts ; rejeu ad hoc : premier rendu de la barre déjà complet (« 294 marques · 3 021 modèles · 100 000 offres » à 443 ms, « 107 marques · 908 modèles · 2 632 offres » à 563 ms), aucun « 0 », aucun « — » | **TENUE** — réserves `ACC-05` et `ACC-15` de la rev 1 **levées** |
| `EX-SCR-122`/`123`, `135` repli et compact | `responsive` : 6 zones (4 en compact, libellé « − Réduire à 4 modèles »), tri en feuille, cardinal « modèles » absent | **TENUE** |
| `EX-SCR-141`, `142`, `149` écran B | en-tête 3 lignes, clic de barre = filtre réel (Σ recalculée sur la barre) | **TENUE** |
| `EX-SCR-144` graphes additionnels | E2E-08 : aucune table vide (13 figures rendues, G15 masqué à un seul pays) | **TENUE** |
| `EX-SCR-151`–`160` nuage | E2E-02 : « Nuage de 1232 points, 54 outliers », 56 756 px encrés ; E2E-03 : deux projections actives ; E2E-06 : brossage → « Convertir la sélection en filtre » + « Voir ces annonces » | **TENUE** — réserve `ACC-06` sur ce que « Voir ces annonces » restreint |
| `EX-SCR-174` sélection vide | en-tête « aucune offre », 0 `figure` | **TENUE** |
| `EX-SCR-178` notes d'exclusion | notes présentes sous G2/G3 (« 9 annonces exclues (kilométrage non renseigné) ») | **PARTIELLE** — `ACC-07` : exclusions de G1 incomplètement nommées |
| `EX-SCR-201`–`210` écran D | E2E-01 (0 erreur de page, table rendue), E2E-07 (50 lignes, `page 1 / n`, tri `aria-sort`, popup hors `localhost:4180`) | **TENUE** |
| `EX-SCR-209` D en cartes (compact) | ad hoc : 50 cartes, 50 « Ouvrir l'annonce d'origine », aucun débordement | **TENUE** |
| `EX-SCR-212`/`213` cartes de E | « Budget 20k · Toutes marques · Prix : ≤ 20 000 € · Mode 1 · 76 437 offres à la création · … · Ouvrir · Renommer · Supprimer » | **TENUE** |
| `EX-SCR-216` écran G | `clavier` : focus initial `search-make`, piège étanche sur 12 tabulations, `Échap` sans effet sur l'URL ; effectifs non vides depuis B (« Volkswagen 9340 \| BMW 8243 … ») ; ad hoc : les 6 arrêts existent, `search-model` et `apply` sont `disabled` tant qu'aucune marque n'est choisie, puis tous atteints dans l'ordre `search-model, list-model, cancel, apply, search-make, list-make` | **TENUE** (sémantique mode 2 = snapshot entier, précision D8-39(b) reprise) |
| `EX-SCR-221` / D8-20 / D-03 filtre Carrosserie et filtres `T` en mode 2 | rev 1 (ad hoc, §8 `ACC-01`) : `/marche/54-opel/1918-corsa?body=3` → 1 352 offres, jeton actif, **aucun bandeau**. **Rev 2** : `partage-url` › ACC-01 vert ×3 ; rejeu ad hoc sur les trois projets : **1 352 offres**, jeton « Carrosserie : Coupé × », bandeau `ET-FILTRE-NON-APPLIQUE-BODY` = « Filtre Carrosserie non appliqué à ce modèle (donnée indisponible) — l'effectif affiché est complet, mais il ne tient pas compte de ce critère. » (au mot près, suivi du bouton de fermeture ×) ; case « Boîte manuelle » cochée depuis le bandeau en mode 2 → `?body=3&gear=M`, 1 352 offres inchangées, second jeton, bandeau `ET-FILTRE-NON-APPLIQUE` « Agrégats filtrés indisponibles — le filtre gearType n'a pas pu être appliqué : les chiffres affichés sont ceux de la sélection NON filtrée. » ; même URL en contexte neuf : état identique ; sans `body=` : aucun bandeau (pas de faux positif) ; capture `ACC-01-ecran-B-corsa-body-desktop.png` | **TENUE** (rev 2) — `ACC-01` CORRIGÉ ; libellé technique « gearType » → `ACC-16` (MINEUR) |
| `EX-SRCH-14`, `EX-SRCH-18bis` | changement de marque depuis B → `/marche?mmmv=74&priceto=20000` ; `cy` jamais exposé | **TENUE** |

### R2 · 3.4 Les 15 exigences « mesures au rendu » renvoyées par 2.7 (§3.2(b))

Méthode et séries détaillées au §6 et §8. Chaque ligne cite le test E2E qui la prouve ou ma mesure ad hoc.

| Exigence | Ce que l'exigence demande | Mesuré au rendu | Verdict |
|---|---|---|---|
| `EX-SCR-21` | gouttières 16/20/24 px ; rayon 8 px cartes, 4 px contrôles ; cibles ≥ 44 × 44 (compact), ≥ 32 × 32 ailleurs | `gap` de `.kycar-market-grid` = **16 px aux trois régimes** ; cartes 8 px ✓ ; contrôles de la ligne primaire **0 px** ; cibles sous le seuil : **157 / 202** en compact (boutons « × » de retrait de jeton 20 × 20, « Menu » 49 × 21, libellés de cases 70), 196 / 270 tablet, 206 / 470 desktop | **NON TENUE** (`ACC-08`) |
| `EX-SCR-25` | recalcul local d'un filtre R sans indicateur, ≤ 150 ms, au-delà bascule `ET-CHARGE-MAJ` | mode 1 (Berline on/off, 4 mesures, polling 5 ms) : desktop **86–107 ms**, tablet 77–105 ms, mobile **167–252 ms** (médiane 178,5) — aucun indicateur ; mode 2 (Essence) : 89–221 ms, l'indicateur `.kycar-screen-b--recalculating`/`aria-busy` apparaît **dès 105–179 ms** sur une mesure sur quatre, c'est-à-dire avant le seuil, pour un seul tick de 5 ms | **PARTIELLE** (`ACC-13`) — tenue sur desktop/tablet, budget dépassé sans bascule sur l'émulation mobile ; indicateur prématuré en mode 2 |
| `EX-SCR-56` | bandeau **collant** sous l'en-tête, 96 px replié, ≤ 320 px déplié, ≤ 40 % du viewport | `position: sticky; top: 0` **déclaré mais inerte** : parent `.filter-bar` de 919 px pour un bandeau de 902 px (aucune course de collage) ; après 1 200 px de défilement le bandeau est à y = **−1 029** (desktop, A et B) et **−991** (mobile) alors que `.app-header` (y = 0), `.summary-bar` et `.kycar-stat-header` collent ; hauteur repliée **902 px** desktop, **1 271 px** tablet (viewport 800 / 1 024 : **113 % / 124 %**) ; au chargement, la prise de focus sur le contenu fait défiler la page de 776 px (A) / 424 px (B) : le bandeau est **hors de vue** à l'arrivée sur une URL partagée | **NON TENUE** (`ACC-02`) |
| `EX-SCR-87` | survol : fond 4 % de l'accent ; focus : contour 2 px accent décalé 2 px ; actif : fond accent, texte inversé, jeton immédiat | survol : `rgb(239,239,239)` **avant et après** ; focus : **2 px solid, offset 2 px**, couleur `#ffd54a` (jeton `--color-focus-ring`, 12,72:1 sur le texte — choix documenté dans `tokens.css`, pas l'accent) ; actif : fond `transparent`, texte non inversé ; jeton dans la zone (4) après **121–156 ms** (délai de clic inclus) | **PARTIELLE** (`ACC-11`) — focus et jeton tenus, survol et actif non |
| `EX-SCR-100` | panneau déplié ≤ 100 ms (Moto G4) ; frappe dans « Rechercher un filtre » sans image perdue > 16 ms | ouverture d'un groupe (5 mesures, double rAF) : **médiane 23,6 / 24,2 / 24,8 ms** ; 11 frappes « kilométrage » : 17,6–30,2 ms au double rAF (donc < 1 trame de traitement), **écart maximal entre trames 16,8 ms** = aucune image perdue ; résultat « 3 filtres correspondent » | **TENUE** — sur cette machine, pas sur un Moto G4 (hypothèse E4 : la marge ×4 le couvre) |
| `EX-SCR-124` | > 12 modèles : champ de recherche + compteur ; liste défilante 480 px avec ombres, carte ≤ 636 px ; virtualisation > 30 zones | Mercedes-Benz, **355 modèles** : `max-height: 480px`, `overflow-y: auto` ✓ ; « Rechercher un modèle », « 356 modèles sur 356 » → « 98 modèles sur 356 » après « a » ✓ ; **356 nœuds de zone montés** (pas de virtualisation), `box-shadow: none`, carte **688–699 px** | **PARTIELLE** (`ACC-09`) — règle 2 tenue, règles 1 et 3 non |
| `EX-SCR-127` | > 40 cartes : au plus 12 montées, aucun plafond d'accès, 60 img/s sur 295 cartes | `/marche` nu : 36 cartes montées, pied « 36 marques sur 294 · Charger 12 marques de plus », 12 clics → **180 montées** (15 677 nœuds DOM), aucun plafond ; défilement de 4 s : 30–31 fenêtres, **0 sous 30 img/s, min 56–58 img/s** | **PARTIELLE** (`ACC-10`) — accès et fluidité tenus, « au plus 12 montées » non (chargement par lots, pas virtualisation) |
| `EX-SCR-171` | chaque élément tracé d'un graphe agrégé porte son `n` | G1–G3 : `<title>` « 2 500 € – 5 000 € · 83 offres · 6.7 % » sur 24/25, 21/22, 27/28 marques (le reste = rect de fond) ; G5 30/30 (« 1996 · n=1 · médiane 3 650 € »), G7 134/134, G10 5/5, G14 9/9 ; G9/G12/G13 : effectif **à l'écran** dans la ligne (« Essence 513 · 41 % · 24 500 € ») ; G8 = annonces individuelles (hors objet) | **TENUE** |
| `EX-SCR-180` | tablette : G1–G3 sur 2 colonnes, G3 seul en 2e rangée **pleine largeur** ; G4 pleine largeur, **400 px**, légendes **dessous** ; additionnels 2 colonnes sauf G8 pleine largeur | 2 colonnes ✓ (`.kycar-hist-row` 2 pistes) ; G3 seul en 2e rangée mais **344 / 704 px** ; G4 canvas 686 × **366 px**, légende superposée en haut à droite (`position: absolute`), pas dessous ; G8 **344 px** (demi-largeur) | **PARTIELLE** (`ACC-04`) |
| `EX-SCR-181` | compact : 1 colonne ; histogrammes 200 px, G4 320 px, additionnels 240 px ; en-tête 5 lignes, boutons défilables ; 1 étiquette d'axe sur 3 ; brossage → **appui long** ; G8 à 10 ; G7 masqué | 1 colonne ✓ ; légende G4 dessous ✓ ; brossage désactivé ✓ (suite) ; hauteurs **129 / 148 / 122 px** ; en-tête **3 lignes**, rangée de boutons `overflow-x: visible` ; **14 étiquettes** sur G1 comme à 1280 ; G8 **20** éléments ; G7 **présent** ; aucun gestionnaire d'appui long | **NON TENUE** (`ACC-03`) |
| `EX-SCR-186` | année → rampe A partout, km → rampe B, nominal → palette Q (8 teintes), signe d'écart → 2 teintes divergentes de G8 | G4 dégradé : rampe A viridis `#440154…#fde725` (« Année ») ✓ ; G4 nuée : rampe B `#00204d…#ffe945` (« Kilométrage ») ✓ ; G7 densité : `rgba(11,95,214,α)` (alpha de l'accent, **pas la rampe B**) ; G9/G12/G13 : **une seule teinte** (`--color-primary`), palette Q absente ; G8 : accent/surface, **aucune teinte divergente** ; aucune contradiction d'encodage relevée | **PARTIELLE** (`ACC-12`) |
| `EX-SCR-190` | aucun graphe ne se redessine au survol d'un autre | survol de 10 positions sur G1 : `outerHTML` de G2, G3, G5 et `toDataURL` de G4 **identiques** ; survol de G4 : G1, G2, G5 identiques | **TENUE** (aucune liaison au survol n'existe ; la liaison croisée est au brossage) |
| `EX-SCR-199` | C : intermédiaire 2 colonnes visibles, défilable, repères collants ; compact tableau unique défilable, sparklines 60 × 24 | tous régimes : **un tableau unique** `.kycar-compare-scroll` (`overflow-x: auto`), 5 colonnes × 7 statistiques ; compact : `scrollWidth` 541 > 328 (défilable) ✓, SVG de 112 × 34 ; tablette : 2 modèles + « Ajouter » visibles, `th` `position: static` (**aucun repère collant**), SVG 121 × 36 ; aucun débordement du document | **PARTIELLE** (`ACC-14`) |
| `EX-NFR-6` | voir §3.1 | 128–143 ms médiane (suite), 22–23 ms (ad hoc) | **TENUE** |
| `EX-NFR-14` | voir §3.1 | 191 / 191 et 121 / 121, ordre DOM, anneau partout | **TENUE** |

Bilan des 15 : **5 TENUES** (`EX-SCR-100`, `171`, `190`, `EX-NFR-6`, `EX-NFR-14`), **7 PARTIELLES** (`EX-SCR-25`, `87`, `124`, `127`, `180`, `186`, `199`), **3 NON TENUES** (`EX-SCR-21`, `56`, `181`). Aucune ne reste « non mesurée » ; chaque écart a son constat `ACC-nn` au §8.

### R2 · 3.5 Re-cotations portées depuis `REMEDIATION-2.8` §3.5 et §7.2

| Exigence | Cote 2.7 | **Cote d'acceptance** | Fondement |
|---|---|---|---|
| `EX-SCR-26` | COUVERTE | **COUVERTE en mode 2 · DETTE D8-37 en mode 1** | test `parcours-p2` › EX-SCR-174/26 vert (gain annoncé 1 352 = obtenu) ; mode 1 : `topRestrictiveFilters: []`, bloc rendu sans suggestion chiffrée, avec ses deux actions |
| `EX-DATA-68` | PARTIELLE (DR-122) | **PARTIELLE — DETTE D8-36** | `MetricRange` à six champs, bloc 3 × 13 non publié, aucune valeur inventée |
| `EX-DATA-61` | PARTIELLE (DR-122) | **COUVERTE sur la sélection · DETTE D8-36 sur les agrégats** | `iqr`/`coverage` publiés sur `MetricStats` (D8-30) |
| `EX-DATA-23` | — | **COUVERTE — règle prouvée, branchement sans objet** tant qu'aucune source ne sert `firstRegistrationDate` sous forme textuelle (constat D8-39(a), pas dette) | `FIX-LEAD-DECISIONS-2.8` §G |
| `EX-SCR-65`, `89`, `90` | — | **COUVERTE en mode 2 · DETTE D8-29 en mode 1** | inchangé depuis rev 2 |
| `EX-SCR-216` | — | **COUVERTE**, effectifs du snapshot entier en mode 2 (D8-39(b)) | mesuré : « Volkswagen 9340 · BMW 8243 · … » depuis B |

---

## R2 · 4. Parcours cibles journalisés

Journaux complets : `parcours-desktop.json` et `parcours-mobile.json` (scratchpad de session, valeurs reprises ci-dessous). Captures dans `reports/acceptance/`. Temps cités = `localhost`, génération du snapshot synthétique de 100 000 annonces comprise — hors périmètre d'`EX-NFR-9` (§6.4 pour la 4G).

### R2 · 4.1 P1 — mode 1 : « budget 20 000 €, coupé, Belgique, < 100 000 km », marché → marque → modèle

| Étape | Action | Valeurs relevées (desktop 1280) | Attendu / confrontation | Capture |
|---|---|---|---|---|
| P1-1 | `GET /marche` (contexte neuf) | rev 1 : premier rendu utile à **3 554 ms** ; barre de synthèse au premier rendu : « 294 marques · **0 modèles** · 100 000 offres — 20 marques affichées », puis « **3 021 modèles** » après 691 ms ; C3 « couverture » ; amorce à quatre raccourcis. **Rev 2** : « 294 marques · 3 021 modèles · 100 000 offres — 20 marques affichées » **dès la première image** (443 ms), un seul rendu | rev 1 : **`ACC-05`** sur le « 0 » transitoire — **corrigé en rev 2** | `P1-1-ecran-A-nu-desktop.png`, `-mobile.png` (rev 1 ; l'image ne montre pas la valeur transitoire) |
| P1-2 | Prix à = 20000 → Kilométrage à = 100000 → case « Coupé » (bandeau réel ; feuille + « Appliquer » en compact) | URL `?body=3&kmto=100000&priceto=20000` ; « **107 marques · 908 modèles · 2 632 offres** — 36 marques affichées » ; `data-active-count="3"` ; jetons « Prix : ≤ 20 000 € », « Kilométrage : ≤ 100 000 km », « Carrosserie : Coupé » ; mobile : « 107 marques · 2 632 offres », `Filtres (3)` | **= `P1_EXPECTED { makes: 107, offers: 2632 }`** (D8-26) ; `cy` absent de l'URL | `P1-2-ecran-A-filtre-desktop.png`, `-mobile.png` |
| P1-3 | lecture des cartes | 36 cartes montées, tri par offres décroissant : **VOLKSWAGEN 280 · MERCEDES-BENZ 212 · AUDI 191 · BMW 158 · TOYOTA 135** ; carte VW : « 69 modèles · médiane 10 750 € · 4 850 – 18 200 € (fourchette centrale (90 % des offres)) · du moins cher au plus cher : 400 – 19 950 € · 2018 – 2026 » | suite : `EX-SCR-107/118` ; Σ des cartes ≤ 2 632 | — |
| P1-4 | clic sur l'en-tête de la carte VOLKSWAGEN | URL `?body=3&kmto=100000&mmmv=74&priceto=20000` ; synthèse rev 1 « **1 marques** · 69 modèles · 280 offres » ; **rev 2 « 1 marque · 69 modèles · 280 offres »** (desktop, tablet ; compact « 1 marque · 280 offres ») ; jeton « Volkswagen » ajouté (`Filtres (4)` en compact) | D8-04(a) : `mmmv = make` posé ✓ ; **`ACC-15`** : accord « 1 marques » — **corrigé en rev 2**, valeurs identiques à l'unité | `P1-4-ecran-A-marque-desktop.png`, `-mobile.png` (rev 1) |
| P1-5 | zones-modèles de la carte | 6 zones visibles (4 en compact) : **Golf 60** · 6 200 – 16 150 € (fourchette centrale) · 2019 – 2025 · 0 – 89 100 km · méd. 11 200 € ; Polo 32 · 4 300 – 12 900 € · méd. 8 100 € ; Passat 21 · 4 700 – 12 950 € · méd. 8 550 € | repli 6 / 4 (`EX-SCR-122/123`) ✓ | — |
| P1-6 | clic sur la zone « Golf » → écran B | URL `/marche/74-volkswagen/2084-golf?body=3&kmto=100000&priceto=20000` ; titre « KYCAR — Distribution d'un modèle · Volkswagen Golf » ; en-tête « **1001 offres** · médiane 10 250 € · P25 7 950 € · P75 12 800 € · min 1 650 € – max 20 000 € · km médian 44 050 km · 1ʳᵉ immat. médiane 2023 · 37 % particuliers » ; jetons : les trois filtres, dont « Carrosserie : Coupé » ; rev 1 : bandeaux synthétique, couverture, représentativité — **aucun « Filtre Carrosserie non appliqué »** ; **rev 2** : le bandeau `ET-FILTRE-NON-APPLIQUE-BODY` s'affiche sur toute route mode 2 portant `body=` (rejoué sur Corsa `?body=3`, trois projets ; même mécanisme `enterMode2` pour Golf) | la zone annonçait **60** coupés ; l'écran B affiche **1 001** Golf (toutes carrosseries) sous un jeton « Coupé » actif — **`ACC-01`** en rev 1 ; en rev 2 l'écart est **nommé à l'écran** (dette O15 admise, mitigation D8-20 désormais effective) | `P1-6-ecran-B-modele-desktop.png`, `-mobile.png` (rev 1) ; `ACC-01-ecran-B-corsa-body-desktop.png` (rev 2) |

Mobile (360) : mêmes valeurs à chaque étape (107 / 2 632 ; VW 280 ; Golf 60 ; 1 001), parcours passé par la feuille « Filtres » à application différée et le tiroir de navigation.

### R2 · 4.2 P2 — mode 2 : Opel Corsa, budget 20 000 €, histogrammes, nuage, liste, exports

| Étape | Action | Valeurs relevées (desktop) | Confrontation | Capture |
|---|---|---|---|---|
| P2-1 | `GET /marche/54-opel/1918-corsa?priceto=20000` | entrée en B à **3 366 ms** ; « Opel Corsa · **508 offres** · médiane 10 675 € · P25 6 050 € · P75 15 838 € · min 1 450 € – max 19 950 € (du moins cher au plus cher) · km médian 158 000 km · 1ʳᵉ immat. médiane 2015 · **37 % particuliers** · Voir les 508 annonces · Comparer · Suivre · Exporter » | max ≤ 20 000 ✓ ; part de particuliers non nulle (E2E-09) ✓ | `P2-1-ecran-B-entete-desktop.png`, `-mobile.png` |
| P2-1b | vérité terrain | cellule entière **1 352** ; 2017 : **54** (« médiane 15 200 € · P25 12 238 € · P75 17 200 € · min 10 150 € – max 20 150 € · 33 % particuliers ») | **= `P2_EXPECTED`** et sonde D8 (1 352 → 54, 10 150 – 20 150 €) | — |
| P2-2 | G1–G3 + tables | G1 « Offres par prix (**506**) » 19 barres = 19 lignes, Σ 506, **aucune note** ; G2 « (499) » 19/19, « 9 annonces exclues (kilométrage non renseigné) » ; G3 « (501) » 24/24, « 7 annonces exclues (année non renseignée) » | 508 − 506 = **2 exclusions muettes** sur G1 → **`ACC-07`** ; tables = barres (`EX-NFR-15`) ✓ | `P2-2-ecran-B-histogrammes-desktop.png`, `-mobile.png` |
| P2-3 | nuage G4 | `aria-label` « **Nuage de 490 points, 26 outliers** », **58 171 px encrés** sur 900 × 480 ; mobile : canvas CSS 278 × **148 px**, 64 153 px encrés, légende « Année » dessous | non vide (E2E-02) ✓ ; hauteur compacte → `ACC-03` | `P2-3-ecran-B-nuage-G4-desktop.png`, `-mobile.png` |
| P2-4 | brossage réel (glisser souris 15 %→75 % du canvas) | URL `…&selx=24030.76–24234.50&sely=5414.37–16348.58` ; compteur « **262 annonces sélectionnées** » ; boutons « Convertir la sélection en filtre » et « Voir ces annonces » visibles ; points hors sélection atténués | `EX-SCR-158/184` ✓ | `P2-4-ecran-B-brossage-desktop.png` |
| P2-5 | « Voir ces annonces » → écran D | URL `/marche/54-opel/1918-corsa/annonces?priceto=20000&sel=5450-16300` ; en-tête « **280 lignes affichées sur 508 de la sélection — écarts calculés sur les 508** · Tri : score d'opportunité décroissant » ; 50 lignes, « page 1 / 6 » ; 0 erreur de page ; mobile (sans brossage) : 50 cartes, « page 1 / 11 » | `sel` = intervalle de **prix seul** : 262 brossées → 280 listées → **`ACC-06`** ; étiquetage A-07 présent ✓ | `P2-5-ecran-D-annonces-desktop.png`, `-mobile.png` |
| P2-6 | export D « CSV des annonces du périmètre » / « CSV des agrégats affichés » | `kycar_Opel-Corsa_be-synthetic-100000-4b594341_20260909.csv` : BOM, 3 lignes `#` (`snapshot`, `filtres;priceto=20000`, `couverture`), **280 lignes** de données, 19 colonnes ; agrégats : 62 lignes, `graphe;index;borne_basse;borne_haute;ouvert;effectif;part` | téléchargements réels ✓ ; 280 (D, sous `sel`) ≠ 508 (B) → `ACC-06` | — |
| P2-7 | export B « Annonces du périmètre (CSV) » / « Agrégats affichés (CSV) » | **508 lignes**, même en-tête ; agrégats 62 lignes, trois graphes `G1 Offres par prix`, `G2 …`, `G3 …` ; menu = exactement deux entrées | `EX-CRUD-16` ✓ | — |
| P2-8 | graphes additionnels | 13 figures : G1–G10, G12–G14 (G15 masqué : un seul pays) ; **0 table vide** | E2E-08 ✓ | — |

---

## R2 · 5. Accessibilité — axe-core WCAG 2.1 A/AA

Balayage de la **page entière** (en-tête, bandeau, contenu, pied), G restreint à la modale, publié par `a11y.spec.ts` dans les trois projets (annotations `MESURE` de `results.json`).

| Surface | Route | desktop | tablet | mobile |
|---|---|---:|---:|---:|
| A — survol du marché | `/marche` | **0** | **0** | **0** |
| B — distribution | `/marche/54-opel/1918-corsa?fregfrom=2017&fregto=2017` | **0** | **0** | **0** |
| D — annonces (**désormais rendue**, verdict prononçable, E2E-13) | `…/annonces?fregfrom=2017&fregto=2017` | **0** | **0** | **0** |
| C — comparer | `/comparer?m=54-1918,54-1916` | **0** | **0** | **0** |
| E — recherches | `/recherches` | **0** | **0** | **0** |
| F — suivis | `/suivis` | **0** | **0** | **0** |
| G — modale marque/modèle (`.kycar-screen-g`) | depuis A | **0** | **0** | **0** |
| `/mentions` | `/mentions` | **0** | **0** | **0** |

**24 / 24 balayages sans violation, aucune règle désactivée, aucune exception.** Compléments hors des huit surfaces (ad hoc) : feuille « Filtres » compacte ouverte (`.kycar-compact-sheet`, mobile) : **0** ; écran B avec brossage actif (`selx`/`sely`, desktop) : **0**.

Limites, reconduites du harnais : axe n'évalue ni le texte peint dans le canvas G4 ni le contraste des marqueurs SVG contre leur fond (`EX-NFR-13` « éléments graphiques porteurs d'information » reste vérifié par les jetons calculés de `tokens.css`, pas au pixel) ; moteur unique (Chromium). Observation de mesure, sans constat : en compact, le tout premier arrêt (lien d'évitement) focalisé **par script** ne déclenche pas `:focus-visible` (heuristique Chromium avec `hasTouch`) — chaque arrêt atteint **au clavier** ensuite porte l'anneau de 2 px (121 / 121).

---

## R2 · 6. Budgets navigateur — séries complètes

### R2 · 6.1 `EX-NFR-5` (rappel 2.8, moteur)
Non remesurée ici (hors navigateur) : `REMEDIATION-2.8` §2.2 — FULL non élagué N = 100 000 : p50 160,9 · **p95 181,1** · max 203,6 ms ; élagué m = 9 283 : p95 92,4 ms. Le budget porte sur le p95.

### R2 · 6.2 `EX-NFR-7` — rendu du nuage (≤ 500 ms p95)
Nuage **non vide** : cellule Opel Corsa, 1 352 annonces, **1 232 points tracés, 54 outliers** (« Nuage de 1232 points »), 56 756–69 246 px encrés selon le régime. Méthode : repeint complet provoqué par un changement de facteur de zoom, horloge lue après deux `requestAnimationFrame`.

| Projet | Suite rev 1 (`perf.spec`, 5 zooms) | **Suite rev 2** (`947dbc4`) | Ad hoc rev 1 (7 zooms alternés + / −) |
|---|---|---|---|
| desktop | 30 / 19 / 20 / 18 / 29 ms — médiane 20, max 30 | 23 / 42 / 19 / 25 / 26 — **médiane 25**, max 42 | 21,6 / 36,4 / 19,2 / 30,5 / 31,7 / 31,0 / 31,5 — médiane 31, max 36 |
| tablet | 28 / 22 / 20 / 23 / 23 — médiane 23, max 28 | 26 / 21 / 22 / 20 / 17 — **médiane 21**, max 26 | 23,5 / 20,8 / 36,9 / 25,9 / 31,5 / 31,5 / 31,3 — médiane 31, max 37 |
| mobile | 24 / 21 / 21 / 17 / 23 — médiane 21, max 24 | 28 / 18 / 22 / 27 / 26 — **médiane 26**, max 28 | 24,1 / 24,2 / 24,5 / 24,2 / 31,2 / 54,4 / 23,3 — médiane 24, max 54 |

Entrée complète en mode 2 (snapshot + élagage + moteur + rendu, repère hors budget) : rev 1 1 689 / 1 701 / 1 777 ms ; rev 2 2 140 / 1 795 / 1 694 ms (la valeur desktop de la rev 2 est la première navigation du projet, cache de compilation froid — repère, pas budget). **Hypothèse (E4)** : les 5 000 points de l'exigence sont inatteignables sur le snapshot de référence — la plus grosse cellule est Corsa (1 352, 1 232 éligibles) et la seule autre route mode 2 d'Opel, `modelId = 0` « Modèle non identifié », porte 26 annonces ; le budget est mesuré sur ce maximum réel, avec une marge de ×9 à ×16. Le banc hors navigateur à 5 000 points reste celui de la sonde D7 (p95 2,98 ms, REMEDIATION-2.8 §2.2). La mention « NON REPRÉSENTATIVE tant qu'E2E-02 laisse le nuage à 0 point » que la suite publie encore est **périmée** : le nuage est plein (elle n'est pas fausse, elle est conditionnelle — à retirer lors d'une prochaine passe sur `perf.spec.ts`).

### R2 · 6.3 `EX-NFR-8` — interaction continue de 10 s (ARB-38)
Horodatages `requestAnimationFrame` collectés dans la page ; fenêtres glissantes de 1 s au pas de 100 ms ; seuil 30 img/s ; **publiés : fenêtres, fenêtres en défaut, débit minimal**.

| Projet | Suite rev 1 (zoom + survol) | **Suite rev 2** | Ad hoc rev 1 (zoom + survol + **brossage réel** un geste sur trois) |
|---|---|---|---|
| desktop | 615 trames, 94 fenêtres, 0 en défaut, min 53,0 img/s, 28 gestes | 621 trames, **95 fenêtres, 0 en défaut, min 55,0 img/s**, 28 gestes | 598 trames, **90 fenêtres, 0 en défaut, min 59 img/s**, 35 gestes ; série 60–61 avec un plateau à 59 |
| tablet | 609 trames, 94 / 0 / 52,0, 27 gestes | 608 trames, **94 / 0 / 52,0**, 26 gestes | 578 trames, **92 / 0 / 49 img/s**, 33 gestes ; série 49–59, creux à 49 pendant 7 fenêtres consécutives (brossage) |
| mobile | 610 trames, 93 / 0 / 54,0, 27 gestes | 609 trames, **93 / 0 / 55,0**, 28 gestes | 610 trames, **92 / 0 / 60 img/s**, 47 gestes ; série 60–61 |

100 % des fenêtres ≥ 30 img/s dans les neuf séries (exigé ≥ 95 %). Le compteur « 3 annonces sélectionnées » (tablet, ad hoc) atteste que le brossage a bien produit une sélection pendant la mesure.

### R2 · 6.4 `EX-NFR-9` — premier affichage utile en 4G simulée (≤ 2 000 ms p95)
CDP `Network.emulateNetworkConditions` : 4 Mb/s descendants, 1 Mb/s montants, **latence 150 ms**, cache navigateur vidé puis désactivé ; mesure du `goto` (commit) jusqu'à la première carte-marque visible ; 5 mesures par cas.

**Rev 2** (`947dbc4`, **213 Kio transférés**, +1 Kio) :

| Projet | `/marche` nu | Médiane | Max | URL déjà filtrée (`/marche?body=3&kmto=100000&priceto=20000`) | Médiane | Max |
|---|---|---:|---:|---|---:|---:|
| desktop | 1517 / 1501 / 1487 / 1503 / 1508 | **1 503** | 1 517 | 1523 / 1646 / 1627 / 1499 / 1741 | **1 627** | 1 741 |
| tablet | 1559 / 1523 / 1500 / 1502 / 1523 | **1 523** | 1 559 | 1542 / 1541 / 1639 / 1534 / 1760 | **1 542** | **1 760** |
| mobile | 1506 / 1498 / 1484 / 1495 / 1480 | **1 495** | 1 506 | 1555 / 1621 / 1602 / 1592 / 1586 | **1 592** | 1 621 |

Rev 1 (`1424dc3`, 212 Kio) : desktop 1532 / 1514 / 1486 / 1511 / 1497 (médiane 1 511, max 1 532) et filtré 1527 / 1628 / 1617 / 1636 / 1615 (1 617, max 1 636) ; tablet 1509 / 1506 / 1488 / 1506 / 1498 (1 506, 1 509) et 1545 / 1628 / 1505 / 1515 / 1735 (1 545, 1 735) ; mobile 1539 / 1505 / 1497 / 1499 / 1486 (1 499, 1 539) et 1499 / 1611 / 1601 / 1593 / 1582 (1 593, 1 611).

**Rev 2 : 30 mesures, aucune ≥ 2 000 ms ; maximum absolu 1 760 ms (marge 240 ms)**, dispersion de 79 ms sur les quinze mesures nues ; médianes à ±20 ms de la rev 1 — **aucune régression imputable à `fix-app-3`** (+0,24 Kio de script, `modelCount` lu sur des agrégats déjà chargés). Le cas « lien partagé » coûte 50–125 ms de plus et reste sous le budget.

### R2 · 6.5 `EX-NFR-6` — histogramme (≤ 300 ms p95)
Suite rev 2 (bascule log de G1, 1 352 annonces) : desktop 166 / 128 / 122 / 121 / 132 — **médiane 128**, max 166 ; tablet 187 / 144 / 140 / 127 / 145 — **144**, max 187 ; mobile 166 / 140 / 144 / 130 / 125 — **140**, max 166. Rev 1 : 128 / 131 / 143 ms de médiane (max 166 / 170 / 153) — **aucune régression** (écarts de ±13 ms de médiane, dans la variance d'une machine partagée ; la correction ne touche pas l'écran B). Ad hoc rev 1 (7 dépliages de la table équivalente de G1, double rAF) : 23,1 / 23,1 / 22,1 ms médiane ; recalcul + repeint après pose d'un filtre par clic de barre (Σ 54 → barre) : 84–111 / 86–111 / 73–80 ms.

### R2 · 6.6 `EX-NFR-14` — ordre de focus relevé (desktop, `/marche?body=3&kmto=100000&priceto=20000`)
198 tabulations depuis le premier élément tabulable ; **191 / 191** contrôles du bandeau atteints, dans l'ordre du DOM, anneau `2px solid #ffd54a` à chaque arrêt. Début de séquence : `Aller au contenu principal` → `KYCAR` → `Marché` → `Comparer` → `Recherches` → `Suivis` → `Marque / Modèle / Version` → `Prix de` → `Prix à` → `500 €` → `1 000 €` → `1 500 €` → … (présélections, kilométrage, immatriculation, cases Carburant / Carrosserie / Boîte, Type de vendeur, mots-clés, `Rechercher un filtre`, groupes secondaires) … → `Retirer le filtre Prix : ≤ 20 000 €` → `Retirer le filtre Kilométrage : ≤ 100 000 km` → `Retirer le filtre Carrosserie : Coupé` → `Tout effacer` → `Enregistrer la recherche` → `Enregistrer cette recherche` (écran). Mobile : `Aller au contenu principal` → `KYCAR` → `Menu` → `Filtres (3)` → jetons → `Fermer sans appliquer` → ligne primaire… → `Réinitialiser` → `Voir les 2 632 offres`. Écran G : `search-make` (focus initial) → `list-make` → `list-model` → `cancel` (`search-model` et `apply` `disabled` sans marque), puis après choix d'une marque `search-model → list-model → cancel → apply → search-make → list-make` ; `Échap` rend le focus à `Choisir une marque et un modèle`.

### R2 · 6.7 Régime compact du bandeau (`EX-SCR-97`, mesuré pour cadrer `EX-SCR-56`)
Barre unique **56 px** (`.kycar-compact-bar`), bouton `Filtres (n)` **123 × 44 px**, feuille `position: fixed` **360 × 740** (plein écran), `overflow-y: auto`, pied « Réinitialiser · Voir les 2 632 offres » ; anneau de focus 2 px dans la feuille ; la barre elle-même **ne colle pas** (y = −691 après 900 px de défilement, en-tête à 0).

### R2 · 6.8 Taille du bundle
Rev 2 : `npm run size` : entrée `index-D_TMBd1X.js` **103,12 Kio** gzip, worker `aggregation.worker-BVhtBzDh.js` 13,46 Kio (inchangé), total initial **116,58 / 300 Kio** (61 % de marge), différé 0 / 400 Kio ; CSS 5,79 Kio gzip. Rev 1 : 102,88 + 13,46 = 116,34 Kio (**+0,24 Kio** pour `fix-app-3`).

---

## R2 · 7. Dettes visibles en recette — ce que l'utilisateur voit ou ne voit pas

| Dette | Où | En une phrase |
|---|---|---|
| **D8-15** (`EX-SCR-95`) — 3 `test.fail()` | partout | Il n'existe **aucun** panneau « Assainissement KYCAR » : les seuils d'assainissement s'appliquent avec leurs valeurs par défaut, sans réglage possible ; la recette le rappelle par trois échecs attendus à chaque exécution. |
| **D8-29** (`EX-SCR-65/89/90`, mode 1) | écran A, bandeau | En mode 1 les cases à cocher **ne portent aucun effectif entre parenthèses** (`(n)`) ; aucun `0` n'est inventé ; en mode 2 les facettes sont affichées. |
| **D8-37** (`EX-SCR-26`, mode 1) | écran A à zéro résultat | Le bloc « Aucune offre ne correspond » propose « Réinitialiser tous les filtres » et « Enregistrer cette recherche » mais **pas les trois suggestions chiffrées** « retirer « … » : n offres de plus » que l'écran B, lui, affiche (vérifié : 1 352 promises = 1 352 obtenues). |
| **D8-36** (`EX-DATA-68`, `EX-DATA-61` agrégats) | cartes et zones de A | Les fourchettes des cartes reposent sur `min · p05 · p50 · p95 · max · n` ; l'utilisateur ne voit ni écart-type ni quartiles sur les agrégats — il les voit sur l'écran B (P25/P75 dans l'en-tête). Rien de faux, des champs absents. |
| **O15 / D8-20** (`EX-DATA-115bis`, `EX-SCR-221`) | écran B/D | Le filtre Carrosserie posé en mode 1 (60 Golf coupés) **cesse de s'appliquer** en mode 2 (1 001 Golf) ; depuis `fix-app-3` (rev 2) l'écran B **le dit** : bandeau « Filtre Carrosserie non appliqué à ce modèle (donnée indisponible) — l'effectif affiché est complet, mais il ne tient pas compte de ce critère. » ; tout autre filtre `T` posé en mode 2 est déclaré par le bandeau générique (identifiant technique, `ACC-16`). Rev 1 : mention absente (`ACC-01`, corrigé). |
| **D8-32(2)** (`EX-DATA-35`, `co2Source`) | descripteur de snapshot / diagnostic | Sur le jeu synthétique la source du CO₂ est déclarée inconnue pour 100 % des annonces, avec la note qui l'explique ; le provider réel n'est pas concerné. |
| **DR-112** (`EX-DATA-53/54/126`) | région postale | Les régions belges dérivées du code postal sont marquées `[EXTRAPOLÉ]` tant que la table Statbel/bpost n'est pas fournie. |
| **DR-104 / AC-01** (`EX-DATA-107`) | toute l'application | Le bandeau « Données synthétiques de démonstration — chiffres générés, sans valeur de marché réelle. » est présent sur chaque écran : aucune donnée de marché réelle n'est servie tant qu'AC-01 n'est pas levée. |
| **EX-SRCH-12**, **EX-SCR-9** | — | Invisibles en recette (sémantique `eq` de la source ; `NNxx` hors périmètre R3). |

---

## R2 · 8. Constats nouveaux de la recette (`ACC-nn`)

Sévérité selon le protocole du harnais : **BLOQUANT** = un parcours cible ne se termine pas ou une statistique lue pour décider est fausse ; **MAJEUR** = exigence non tenue ; **MINEUR** = le reste. Toutes les reproductions se font sur le build de production, `http://localhost:4180`, Chromium 141.

**Statuts après la rev 2** (décisions D8-41 à D8-43, rejeu du 2026-09-08 23:40 UTC sur `947dbc4`) :

| Id | Sév. rev 1 | **Statut rev 2** | Preuve du statut |
|---|---|---|---|
| ACC-01 | MAJEUR | **CORRIGÉ** (D8-41, `27c5a58`) | `partage-url` › ACC-01 vert ×3 (mesure : « 1352 offres ; Filtre Carrosserie non appliqué à ce modèle (donnée indisponible) — l'effectif affiché est complet, mais il ne tient pas compte de ce critère. ») ; rejeu ad hoc trois projets : URL directe, second filtre `T` (`gear=M`) depuis le bandeau, contexte neuf, absence de faux positif — tous conformes (§3.3, `EX-SCR-221`) ; sonde `R-D8-2.9-01…06` rouge → verte |
| ACC-02 | MAJEUR | **DETTE D8-43** (présentation, phase 2.10 au commanditaire) | non rejoué ; `filter-band.css`/`app.tsx` (wrapper `.filter-bar`) non modifiés par `fix-app-3` |
| ACC-03 | MAJEUR | **DETTE D8-43** | idem, `distribution.css`/`ScatterCloud.tsx` non modifiés |
| ACC-04 | MINEUR | **DETTE D8-43** | idem |
| ACC-05 | MINEUR | **CORRIGÉ** (D8-42, `ffb3a75`) | `parcours-p1` › ACC-05 vert (desktop, tablet : « 1 rendus, 0 à « 0 modèles » ») ; rejeu ad hoc à chaque image : 1 rendu, 0 « 0 », 0 « — », dès 443 / 563 ms ; sondes `R-D6-2.9-01/03` rouge → verte |
| ACC-06 … ACC-14 | MINEUR | **DETTE D8-43** (ACC-06 signalé premier à reprendre) | non rejoués, fichiers concernés non modifiés |
| ACC-15 | MINEUR | **CORRIGÉ** (D8-42, `ffb3a75`) | `parcours-p1` › ACC-15 vert ×3 (« 1 marque · 120 modèles · 9 340 offres » ; compact « 1 marque · 9 340 offres ») ; rejeu du cas d'origine : « 1 marque · 69 modèles · 280 offres » ; sondes `R-D6-2.9-04/06` rouge → verte |
| **ACC-16** | **MINEUR** (nouveau, rev 2) | **OUVERT** — à ranger avec D8-43 ou à traiter (D5 `labels.ts`) | voir la ligne ACC-16 ci-dessous |

Le détail de la rev 1 est conservé ci-dessous tel qu'il a été constaté sur `1424dc3` ; pour ACC-01, ACC-05 et ACC-15 il décrit un état **révolu**.

| Id | Sév. | Exigence(s) | Constat et reproduction | Hypothèse de cause (E4) |
|---|---|---|---|---|
| **ACC-01** *(rev 1 — corrigé en rev 2)* | **MAJEUR** | `EX-SCR-221`, D-03 (« jamais ignoré en silence »), D8-20, `EX-NAV-18` | En mode 2 le filtre Carrosserie n'est **ni appliqué ni déclaré**. `GET /marche/54-opel/1918-corsa?body=3` → « **1 352 offres** » (= cellule entière), jeton « Carrosserie : Coupé × » actif, **aucun** bandeau « Filtre Carrosserie non appliqué à ce modèle (donnée indisponible) — … » dans le DOM (recherche de « non appliqué » sur `document.body.innerText` : néant), aucune entrée dans le Diagnostic. Même chose sur l'arrivée du parcours P1 (Golf : 60 coupés en mode 1 → 1 001 en mode 2). Classé MAJEUR et non BLOQUANT pour la même raison que E2E-04/05 en 2.9a : le nombre n'est pas faux (il y a bien 1 352 Corsa), c'est la **mention** qui manque — mais c'est exactement le cas que D-03 interdit et que D8-20 disait avoir traité. **À corriger avant le tag** (voir §9). | `DataController.enterMode2` n'envoie au provider que `tSelection = make;model` et ne calcule `unappliedFilterIds` que sur la composante **R** (`buildRefinePredicates(r)`) ; `bodyType` est de classe **T** en mode 2, donc il n'atteint jamais `compileSelection` — le seul endroit qui le déclare (`providers/synthetic/selection.ts`, `bodyUnresolvableAtModel`) — et n'est pas non plus reporté dans `unappliedFilterIds`. Les sondes R-D2-17/R-D3-20/R-D9-31 éprouvent `compileSelection` avec une requête épinglant un modèle, pas le chemin du contrôleur. Correction bornée à `src/orchestration/data-controller.ts` (reporter les identifiants T hors marque/modèle dans `unappliedFilterIds`) ; la coquille sait déjà rendre le bandeau (`app.tsx`, `bodyFilterUnapplied`). |
| **ACC-02** | **MAJEUR** | `EX-SCR-56` (collant, 96 / 320 px, ≤ 40 % du viewport ; exigence explicite du commanditaire sur B), `EX-SCR-22` par ricochet | (a) Le bandeau **ne colle pas** : `position: sticky; top: 0` sur `.kycar-filter-band` mais son parent `.filter-bar` fait exactement sa hauteur (919 px pour 902 px) — la boîte de collage n'offre aucune course ; après 1 200 px de défilement le bandeau est à y = −1 029 (desktop A et B), −991 (mobile), tandis que `.app-header`, `.summary-bar` et `.kycar-stat-header` collent. Les tests d'impression ne lisent que la valeur calculée `position`, pas le comportement. (b) Replié, le bandeau mesure **902 px** (desktop) et **1 271 px** (tablet), soit 113 % / 124 % du viewport, contre 96 px et ≤ 40 % exigés : la ligne primaire déploie toutes les présélections (`500 € … 100 000 €`), trois `fieldset` de cases et les groupes secondaires actifs. (c) Aggravant : à l'arrivée sur une URL, la prise de focus `EX-NFR-12` fait défiler la page (scrollY 776 sur A, 424 sur B) et le bandeau est **entièrement hors de vue**. Reproduction : `GET /marche?body=3&kmto=100000&priceto=20000`, lire `scrollY` et `getBoundingClientRect()` du bandeau ; faire défiler. | Wrapper `.filter-bar` (`app.tsx` l. 1233) sans hauteur propre et sans `align-self: start` dans un contexte de flux : la règle est posée sur le mauvais élément (ou le wrapper doit porter le `sticky`). La hauteur relève d'une décision de présentation (compacter la ligne primaire, présélections en menu) — c'est un chantier de design, pas une correction ponctuelle. |
| **ACC-03** | **MAJEUR** | `EX-SCR-181` | Régime compact de l'écran B : histogrammes **129 px** de haut (200), G4 **148 px** (320), additionnels **122 px** (240) ; en-tête statistique **3 lignes** (5) et rangée de boutons non défilable ; **14 étiquettes** d'axe sur G1 comme à 1280 (une sur trois) ; G8 **20** éléments (10) ; **G7 rendu** (masqué) ; **aucun appui long** sur un point de G4 (la seule interaction tactile prévue par l'exigence). Tenu : 1 colonne, légende de G4 dessous, brossage désactivé. Reproduction : projet `mobile`, `GET /marche/54-opel/1918-corsa`, `getBoundingClientRect()` des `svg.kycar-hist`, du canvas G4, comptage des `li` de G8. | `distribution.css` ne porte, sous 767 px, que la colonne unique et la légende statique ; aucune règle de hauteur, aucun `regime` transmis aux graphes additionnels ni à l'en-tête ; `ScatterCloud.tsx` n'a pas de gestionnaire `pointerdown` temporisé. |
| **ACC-04** | MINEUR | `EX-SCR-180` | Régime intermédiaire : G3 seul en 2e rangée mais **demi-largeur** (344 / 704 px) ; G4 canvas **366 px** (400) avec légendes **superposées** en haut à droite (`position: absolute`) au lieu de dessous ; G8 **demi-largeur** (344 px). Tenu : 2 colonnes sur les histogrammes et les additionnels. | même fichier : le bloc `@media (max-width: 1279px)` ne pose que les colonnes. |
| **ACC-05** *(rev 1 — corrigé en rev 2)* | MINEUR | `EX-SCR-106`, `EX-SCR-132`, D8-02 (« jamais 0 par défaut, « — » tant que la donnée manque ») | La barre de synthèse affiche **« 0 modèles »** pendant **691 ms** (`/marche` nu : de 436 à 1 127 ms après navigation) et **486 ms** (URL P1 : 466 → 952 ms) avant le cardinal réel (3 021 / 908), à chaque chargement, sur desktop et tablet (le compact n'affiche pas ce cardinal). Le test E2E-04 l'attend par `expect.poll` et ne voit donc pas la valeur transitoire. | `MarketScreen`/`SummaryBar` rend `modelCount` à 0 tant que `loadAllModels` n'a pas fusionné les agrégats modèle (D8-02) ; le repli `—` d'`EX-SCR-132` n'est pas appliqué à cet intervalle. |
| **ACC-06** | MINEUR | `EX-SCR-158` (« vers l'écran D **restreint à la sélection** »), `EX-SCR-202` (`sel=<lo>-<hi>`), `EX-CRUD-16` | Un brossage **2D** de « 262 annonces sélectionnées » conduit à un écran D qui annonce « **280 lignes affichées** sur 508 de la sélection » : `sel` ne porte que l'intervalle de **prix** (`sel=5450-16300`), l'axe X du brossage est perdu ; l'export « CSV des annonces du périmètre » de D produit **280** lignes là où le même bouton sur B en produit **508** (Σ) pour la même URL de filtres. Reproduction : P2-4 → P2-5. | La forme normative `sel=<lo>-<hi>` (un seul intervalle) ne peut pas encoder un rectangle ; conflit de rédaction entre `EX-SCR-158` et `EX-SCR-202` à trancher (encoder les deux axes, ou reformuler « restreint à l'intervalle de prix de la sélection ») ; l'export de D devrait suivre Σ ou dire qu'il suit `sel`. |
| **ACC-07** | MINEUR | `EX-SCR-178` (notes d'exclusion sous G1–G3) | Sous `?priceto=20000`, G1 annonce « Offres par prix (506) » pour Σ = 508 **sans aucune note** ; sur la cellule entière, G1 (1 246) nomme « 55 annonces exclues (prix sur demande) » + « 32 (prix absent) » = 87, pour 1 352 − 1 246 = **106** exclues (19 non nommées). G2/G3 sont cohérents (499 + 9 = 508 ; 501 + 7 = 508). | les annonces au prix **valide mais hors des bornes de classes** (ou au-dessus du plafond de binning : max Corsa 2 812 600 €) ne sont comptées dans aucun motif d'exclusion publié. |
| **ACC-08** | MINEUR | `EX-SCR-21` | Gouttière de grille **16 px aux trois régimes** (16 / 20 / 24 exigés) ; rayon **0 px** sur les contrôles de la ligne primaire (4 px) ; cibles tactiles : en compact **157 / 202** éléments interactifs visibles sous 44 × 44 px — boutons « × » de retrait de jeton **20 × 20 px**, « Menu » 49 × 21, « Fermer sans appliquer » 24 × 21, 70 libellés de cases à cocher ; à 1280/768, 196–206 éléments sous 32 × 32 (liens de navigation 19 px de haut, présélections 21–22 px). | aucune règle de taille minimale sur ces contrôles ; `gap: var(--space-3)` fixe. |
| **ACC-09** | MINEUR | `EX-SCR-124` règles 1 et 3 | Mercedes-Benz (355 modèles) dépliée : **356 nœuds de zone** dans le DOM (virtualisation à 30 absente malgré `needsVirtualizedModelList`), `box-shadow: none` (ombres de débord absentes), carte de **688–699 px** (> 636). Tenu : 480 px défilants, champ de recherche et compteur. | `MakeCard.tsx` rend `displayedZones` en entier ; le drapeau du view-model n'a pas de consommateur. |
| **ACC-10** | MINEUR | `EX-SCR-127` | Pas de virtualisation : 36 cartes montées puis **+12 par clic** jusqu'à 180 (15 677 nœuds DOM) ; le défilement reste à 56–61 img/s sur cette machine et l'accès aux 294 marques n'est pas plafonné. « Au plus 12 cartes montées » n'est pas tenu ; l'objectif de fluidité l'est ici, sans preuve sur « appareil de milieu de gamme ». | chargement par lots (`GRID_LOAD_BATCH_SIZE = 12`) substitué à la virtualisation ; `shouldVirtualizeGrid` sans effet de rendu. |
| **ACC-11** | MINEUR | `EX-SCR-87` | Aucun retour de **survol** (fond identique avant/après `hover`), aucun état **actif** inversé sur une case cochée (fond transparent) ; l'anneau de focus est conforme en épaisseur et décalage mais de couleur jaune `#ffd54a` (jeton de focus, motivé par le contraste 12,72:1) et non « couleur d'accent » ; le jeton apparaît en 121–156 ms. | absence de règles `:hover`/`:checked` dans `filter-band.css` ; la couleur du focus est un choix délibéré de `tokens.css` — à ratifier ou à amender dans l'exigence. |
| **ACC-12** | MINEUR | `EX-SCR-186` | Palette qualitative **Q absente** : G9, G12, G13 sont monochromes (`--color-primary`) ; G8 sans teintes **divergentes** (accent / surface) ; G7 encodé en alpha de l'accent et non en rampe B. Les rampes A (année) et B (kilométrage) sont bien celles de G4 ; aucune contradiction d'encodage constatée. | `AdditionalGraphs.tsx` n'utilise que `var(--color-primary)` et `rgba(11,95,214,α)`. |
| **ACC-13** | MINEUR | `EX-SCR-25` | Mode 1, filtre R (Berline) : **86–107 ms** desktop, 77–105 ms tablet, mais **167–252 ms** sur l'émulation mobile, sans bascule vers `ET-CHARGE-MAJ` au-delà de 150 ms ; mode 2 : l'indicateur `kycar-screen-b--recalculating` est posé **dès le début du recalcul** (vu à 105–179 ms, pour un tick), donc parfois sous le seuil. Le recalcul mode 1 est un aller provider d'agrégats (O17), pas un recalcul « sur 100 000 annonces en mémoire » : la prémisse de l'exigence ne décrit pas le mode 1. | `recalculating={mode2.status === 'loading'}` sans temporisation de 150 ms ; aucune temporisation en mode 1. |
| **ACC-14** | MINEUR | `EX-SCR-199` | Écran C : tableau unique défilable à tous les régimes (conforme en compact) mais en intermédiaire **aucun repère de colonne collant** (`th` `position: static`) ; les mini-graphes du tableau font 174 × 52 / 121 × 36 / 112 × 34 px selon le régime (60 × 24 spécifiés en compact — plus grands, pas plus petits). | pas de règle `position: sticky` sur `thead th`. |
| **ACC-15** *(rev 1 — corrigé en rev 2)* | MINEUR | `EX-SCR-1`..`4` (libellés), `EX-SCR-106` | « **1 marques** · 69 modèles · 280 offres » : le pluriel n'est pas accordé quand une seule marque est retenue (`mmmv=74`). | formateur de la barre de synthèse sans singulier. |
| **ACC-16** *(nouveau, rev 2)* | MINEUR | `EX-SCR-1`..`4` (libellés français), `ET-FILTRE-NON-APPLIQUE` (D-03) | Le bandeau générique de non-application nomme le filtre par son **identifiant technique** : « Agrégats filtrés indisponibles — le filtre **gearType** n'a pas pu être appliqué : les chiffres affichés sont ceux de la sélection NON filtrée. » (mode 2, `?body=3&gear=M`, trois projets). L'utilisateur ne connaît que « Boîte de vitesses », libellé que porte le jeton juste au-dessus. Le bandeau propre à la carrosserie, lui, est en français normatif. Reproduction : écran B, cocher « Boîte manuelle ». | `app.tsx` `unapplied.join(', ')` (comportement préexistant du mode 1, étendu au mode 2 par D8-41) ; le libellé humain existe dans `src/components/filters/labels.ts` (D5) — relevé par `fix-app-3` §7.1 comme hypothèse, hors de son périmètre. |

Récapitulatif rev 1 : **3 MAJEUR, 12 MINEUR, 0 BLOQUANT**. Onze des quinze portaient sur les exigences que 2.7 avait renvoyées « à mesurer » ; deux (`ACC-01`, `ACC-06`) touchaient des comportements que la suite E2E exerçait sans les asserter ; deux (`ACC-05`, `ACC-15`) étaient des détails d'affichage. **Après la rev 2 : 3 corrigés et rejoués verts (dont le seul MAJEUR touchant une statistique lue), 12 en dette D8-43 (2 MAJEUR de présentation, 10 MINEUR), 1 MINEUR nouveau (`ACC-16`).** Aucun ne modifie les décomptes S1–S4.

---

## R2 · 9. Porte G8 et avis de livraison

### R2 · Porte G8 — conditions (PLAN-2, table des portes)

| Condition | État | Preuve |
|---|---|---|
| E2E verts sur 3 projets | **oui** (rev 2) | 264 tests, 0 inattendu, 3 attendus (D8-15), 10 sautés motivés, 0 instable, aucune régression depuis la rev 1 (§2) |
| 0 violation axe A/AA | **oui** (rev 2) | 24 / 24 balayages à 0, aucune exception (§5) |
| Budgets navigateur tenus | **oui** (rev 2) | NFR-9 max 1 760 < 2 000 ms ; NFR-7 ≤ 42 ms sur nuage plein ; NFR-8 100 % des fenêtres ≥ 52 img/s ; NFR-6 ≤ 187 ms ; bundle 116,58 / 300 Kio (§6) |
| `ACCEPTANCE.md` livré | **oui** | ce document (rev 2) + 18 captures + `results.json` de la rev 2 |

### R2 · **PORTE G8 : FRANCHIE** (rev 1, confirmée en rev 2).

Les quatre conditions de la porte sont remplies et prouvées sur `947dbc4`. Je note, pour que le verdict ne soit pas lu plus large qu'il n'est, que la porte mesure la **suite**, l'**accessibilité automatisée** et les **budgets** : elle ne mesure pas les exigences de présentation que 2.7 avait laissées sans cote, et c'est là que la recette a trouvé ses constats — désormais consignés (D8-43).

### R2 · Avis de livraison (fusion `main` + tag `v0.1.0`) — **oui, avec réserves nommées** (rev 2 : la réserve principale est levée)

La décision reste au commanditaire. Mon avis :

1. **Réserve principale de la rev 1 — `ACC-01` — LEVÉE.** Le filtre Carrosserie (et tout filtre de classe `T`) posé en mode 2 est désormais **déclaré** à l'écran, au mot près de D8-20, dans les trois régimes, depuis une URL partagée comme depuis le bandeau ; l'effectif reste celui de la cellule, aucune valeur n'est inventée. La preuve tient dans la suite (`partage-url` › ACC-01, vert ×3) et dans la sonde `R-D8-2.9`, rouges avant, vertes après, sans modification. Plus rien, à ma connaissance, ne présente à l'utilisateur un chiffre sous un jeton de filtre qui ne s'applique pas sans le lui dire.
2. **Réserves de présentation consignées, pas bloquantes — `ACC-02` et `ACC-03`** (et les dix MINEUR `ACC-04`, `06`–`14`, plus `ACC-16`). Le bandeau non collant et surdimensionné (`EX-SCR-56`) et le régime compact de l'écran B (`EX-SCR-181`) sont des écarts d'exigence nets, visibles, qui n'empêchent aucun parcours ; D8-43 les consigne et renvoie leur traitement (phase 2.10) au commanditaire, avec le §8 comme cahier des charges. Je recommande d'y inscrire `ACC-06` en premier (le brossage 2D perd un axe en passant à l'écran D) et `ACC-16` en second (un mot à changer).
3. **Ce qui est solide** : les deux parcours cibles se terminent avec des valeurs exactes et reproductibles (107 / 2 632 ; 1 352 → 54 ; exports réels ; libellés désormais accordés et cardinal des modèles connu dès la première image), l'accessibilité automatisée est à zéro sur les huit surfaces et trois régimes, les budgets ont une marge lisible et n'ont pas bougé avec le correctif, et les dix dettes admises en 2.8 sont visibles ou muettes exactement comme leurs décisions le décrivent — `ACC-01` compris, désormais.

**Avis rev 2 : prêt pour la fusion dans `main` et le tag `v0.1.0`, avec la dette de présentation D8-43 (12 constats + `ACC-16`) nommée dans les notes de version.**

Hypothèses de cette recette (E4), toutes écrites comme telles : moteur Chromium unique (`EX-NFR-17` non exercé sur Firefox/Safari) ; machine partagée avec le serveur `vite preview` (les budgets sont évalués sur la médiane, la série complète est publiée) ; snapshot **synthétique** à graine fixe (les effectifs sont ceux du `SyntheticDataProvider`) ; 5 000 points de nuage inatteignables sur ce snapshot ; `EX-SCR-100` et `EX-SCR-127` mesurés sur cette machine et non sur un appareil de milieu de gamme.

---

## R2 · Annexe — fichiers produits

| Fichier | Contenu | Poids |
|---|---|---|
| `reports/ACCEPTANCE.md` | ce rapport | — |
| `reports/acceptance/P1-1-ecran-A-nu-{desktop,mobile}.png` | écran A au premier affichage | 87 + 51 Kio |
| `reports/acceptance/P1-2-ecran-A-filtre-{desktop,mobile}.png` | écran A, trois filtres posés (107 / 2 632) | 103 + 57 Kio |
| `reports/acceptance/P1-4-ecran-A-marque-{desktop,mobile}.png` | écran A, marque Volkswagen (`mmmv=74`) | 100 + 68 Kio |
| `reports/acceptance/P1-6-ecran-B-modele-{desktop,mobile}.png` | écran B Volkswagen Golf (1 001 offres, `ACC-01`) | 114 + 62 Kio |
| `reports/acceptance/P2-1-ecran-B-entete-{desktop,mobile}.png` | écran B Opel Corsa ≤ 20 000 € (508 offres) | 107 + 59 Kio |
| `reports/acceptance/P2-2-ecran-B-histogrammes-{desktop,mobile}.png` | G1–G3 | 139 + 47 Kio |
| `reports/acceptance/P2-3-ecran-B-nuage-G4-{desktop,mobile}.png` | nuage G4 (490 points) ; compact à 148 px (`ACC-03`) | 193 + 67 Kio |
| `reports/acceptance/P2-4-ecran-B-brossage-desktop.png` | brossage, 262 annonces sélectionnées | 181 Kio |
| `reports/acceptance/P2-5-ecran-D-annonces-{desktop,mobile}.png` | écran D (280 / 508 sous `sel` ; 508 / 508 en compact) | 119 + 61 Kio |
| `reports/acceptance/ACC-01-ecran-B-corsa-body-desktop.png` | **rev 2** — écran B Corsa `?body=3` : 1 352 offres, jeton « Carrosserie : Coupé », bandeau « Filtre Carrosserie non appliqué… » | rev 2 |
| **Total** | **18 captures PNG (viewport, DPR 1)** | **≈ 1,7 Mo** (< 5 Mo) |
| `reports/e2e/results.json` | résultats Playwright de l'exécution **rev 2** du 2026-09-08 23:25 UTC sur `947dbc4` (D8-33 : à commiter avec ce rapport) | régénéré |

