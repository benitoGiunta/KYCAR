# ACCEPTANCE — recette finale navigateur (phase 2.9b, PLAN-2 §2.9) — **rev 2**

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

## 0. Rev 2 — ce qui a changé (2026-09-08, 23:25 → 23:50 UTC, commit `947dbc4`)

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

## 1. Verdict des critères S1–S4 (PLAN-2 §2.9)

| Critère | Énoncé | Verdict | Preuve |
|---|---|---|---|
| **S1** | `npm run test:e2e` vert sur les trois projets | **ATTEINT** | rev 2 : 264 tests : **254 « passed »** au sens Playwright (251 verts + **3 échecs attendus**, un par projet, tous `DETTE D8-15 — EX-SCR-95`), **10 sautés** motivés (§2), **0 inattendu, 0 instable**, `retries: 0`, 10 min 22 s (rev 1 : 255 / 243 / 3 / 9 / 0) |
| **S2** | zéro violation axe-core A/AA sur les huit surfaces, toute exception nommée et motivée | **ATTEINT** | rev 2 : 8 surfaces × 3 projets = **24 balayages, 0 violation** (§5) ; surface D rendue et prononcée ; **aucune exception demandée** ; rev 1 : deux balayages complémentaires hors périmètre (feuille « Filtres » compacte, écran B brossé) : 0 violation |
| **S3** | `EX-NFR-9` ≤ 2 000 ms en 4G simulée ; `EX-NFR-7`/`8` tenus au rAF, mesurés et cités | **ATTEINT** | rev 2 : NFR-9 30 mesures, **max absolu 1 760 ms** (tablet, URL filtrée), médianes 1 495–1 523 ms nu et 1 542–1 627 ms filtré (§6.4) ; NFR-7 sur nuage **non vide** (1 232 points tracés) : médiane 21–26 ms, max 42 ms (rev 1 ad hoc avec brossage : max 54 ms) ; NFR-8 : 0 fenêtre < 30 img/s sur 93–95 fenêtres par projet, plancher 52–55 img/s (rev 1 avec brossage réel : 49–60) (§6.2–6.3) |
| **S4** | les deux parcours cibles journalisés avec captures | **ATTEINT** | P1 et P2 rejoués sur desktop **et** mobile (rev 1), 17 captures + 1 (rev 2), valeurs relevées confrontées à `P1_EXPECTED`/`P2_EXPECTED` et à la vérité terrain D8 (§4) ; les valeurs de P1 touchées par `fix-app-3` (barre de synthèse) ont été rejouées en rev 2 : identiques à l'unité, libellés corrigés |

Les quatre critères sont atteints en rev 1 comme en rev 2. La rev 1 avait révélé **15 constats nouveaux** (§8) — trois MAJEUR, douze MINEUR — presque tous sur les exigences « mesures au rendu » que 2.7 avait renvoyées à cette phase sans les juger. Aucun n'était BLOQUANT au sens du protocole. Le seul qui touchait la lecture d'une statistique — `ACC-01`, un effectif **non filtré sous un jeton de filtre actif** sans la mention que D8-20 promettait — est **corrigé et rejoué vert en rev 2**, avec `ACC-05` et `ACC-15` ; les douze autres sont consignés en dette de présentation (D8-43). Un constat MINEUR nouveau apparaît en rev 2 (`ACC-16`, libellé technique du bandeau générique).

---

## 2. Décomptes E2E par projet

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

## 3. Matrice exigence navigateur → test → résultat → capture

Cotes : **TENUE** (prouvée au rendu), **PARTIELLE** (une partie des clauses tenue, l'écart nommé), **NON TENUE**, **DETTE Dx-nn** (écart couvert par une décision écrite). Les tests cités sont ceux de `tests/e2e/` (fichier › titre abrégé) ; « ad hoc » renvoie à mes scripts (§6, §8).

### 3.1 Exigences non fonctionnelles navigateur (`EX-NFR-*`)

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

### 3.2 Navigation et persistance (`EX-NAV-*`, `EX-CRUD-*`)

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

### 3.3 Écrans et états visibles (`EX-SCR-*` exercés par la suite)

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

### 3.4 Les 15 exigences « mesures au rendu » renvoyées par 2.7 (§3.2(b))

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

### 3.5 Re-cotations portées depuis `REMEDIATION-2.8` §3.5 et §7.2

| Exigence | Cote 2.7 | **Cote d'acceptance** | Fondement |
|---|---|---|---|
| `EX-SCR-26` | COUVERTE | **COUVERTE en mode 2 · DETTE D8-37 en mode 1** | test `parcours-p2` › EX-SCR-174/26 vert (gain annoncé 1 352 = obtenu) ; mode 1 : `topRestrictiveFilters: []`, bloc rendu sans suggestion chiffrée, avec ses deux actions |
| `EX-DATA-68` | PARTIELLE (DR-122) | **PARTIELLE — DETTE D8-36** | `MetricRange` à six champs, bloc 3 × 13 non publié, aucune valeur inventée |
| `EX-DATA-61` | PARTIELLE (DR-122) | **COUVERTE sur la sélection · DETTE D8-36 sur les agrégats** | `iqr`/`coverage` publiés sur `MetricStats` (D8-30) |
| `EX-DATA-23` | — | **COUVERTE — règle prouvée, branchement sans objet** tant qu'aucune source ne sert `firstRegistrationDate` sous forme textuelle (constat D8-39(a), pas dette) | `FIX-LEAD-DECISIONS-2.8` §G |
| `EX-SCR-65`, `89`, `90` | — | **COUVERTE en mode 2 · DETTE D8-29 en mode 1** | inchangé depuis rev 2 |
| `EX-SCR-216` | — | **COUVERTE**, effectifs du snapshot entier en mode 2 (D8-39(b)) | mesuré : « Volkswagen 9340 · BMW 8243 · … » depuis B |

---

## 4. Parcours cibles journalisés

Journaux complets : `parcours-desktop.json` et `parcours-mobile.json` (scratchpad de session, valeurs reprises ci-dessous). Captures dans `reports/acceptance/`. Temps cités = `localhost`, génération du snapshot synthétique de 100 000 annonces comprise — hors périmètre d'`EX-NFR-9` (§6.4 pour la 4G).

### 4.1 P1 — mode 1 : « budget 20 000 €, coupé, Belgique, < 100 000 km », marché → marque → modèle

| Étape | Action | Valeurs relevées (desktop 1280) | Attendu / confrontation | Capture |
|---|---|---|---|---|
| P1-1 | `GET /marche` (contexte neuf) | rev 1 : premier rendu utile à **3 554 ms** ; barre de synthèse au premier rendu : « 294 marques · **0 modèles** · 100 000 offres — 20 marques affichées », puis « **3 021 modèles** » après 691 ms ; C3 « couverture » ; amorce à quatre raccourcis. **Rev 2** : « 294 marques · 3 021 modèles · 100 000 offres — 20 marques affichées » **dès la première image** (443 ms), un seul rendu | rev 1 : **`ACC-05`** sur le « 0 » transitoire — **corrigé en rev 2** | `P1-1-ecran-A-nu-desktop.png`, `-mobile.png` (rev 1 ; l'image ne montre pas la valeur transitoire) |
| P1-2 | Prix à = 20000 → Kilométrage à = 100000 → case « Coupé » (bandeau réel ; feuille + « Appliquer » en compact) | URL `?body=3&kmto=100000&priceto=20000` ; « **107 marques · 908 modèles · 2 632 offres** — 36 marques affichées » ; `data-active-count="3"` ; jetons « Prix : ≤ 20 000 € », « Kilométrage : ≤ 100 000 km », « Carrosserie : Coupé » ; mobile : « 107 marques · 2 632 offres », `Filtres (3)` | **= `P1_EXPECTED { makes: 107, offers: 2632 }`** (D8-26) ; `cy` absent de l'URL | `P1-2-ecran-A-filtre-desktop.png`, `-mobile.png` |
| P1-3 | lecture des cartes | 36 cartes montées, tri par offres décroissant : **VOLKSWAGEN 280 · MERCEDES-BENZ 212 · AUDI 191 · BMW 158 · TOYOTA 135** ; carte VW : « 69 modèles · médiane 10 750 € · 4 850 – 18 200 € (fourchette centrale (90 % des offres)) · du moins cher au plus cher : 400 – 19 950 € · 2018 – 2026 » | suite : `EX-SCR-107/118` ; Σ des cartes ≤ 2 632 | — |
| P1-4 | clic sur l'en-tête de la carte VOLKSWAGEN | URL `?body=3&kmto=100000&mmmv=74&priceto=20000` ; synthèse rev 1 « **1 marques** · 69 modèles · 280 offres » ; **rev 2 « 1 marque · 69 modèles · 280 offres »** (desktop, tablet ; compact « 1 marque · 280 offres ») ; jeton « Volkswagen » ajouté (`Filtres (4)` en compact) | D8-04(a) : `mmmv = make` posé ✓ ; **`ACC-15`** : accord « 1 marques » — **corrigé en rev 2**, valeurs identiques à l'unité | `P1-4-ecran-A-marque-desktop.png`, `-mobile.png` (rev 1) |
| P1-5 | zones-modèles de la carte | 6 zones visibles (4 en compact) : **Golf 60** · 6 200 – 16 150 € (fourchette centrale) · 2019 – 2025 · 0 – 89 100 km · méd. 11 200 € ; Polo 32 · 4 300 – 12 900 € · méd. 8 100 € ; Passat 21 · 4 700 – 12 950 € · méd. 8 550 € | repli 6 / 4 (`EX-SCR-122/123`) ✓ | — |
| P1-6 | clic sur la zone « Golf » → écran B | URL `/marche/74-volkswagen/2084-golf?body=3&kmto=100000&priceto=20000` ; titre « KYCAR — Distribution d'un modèle · Volkswagen Golf » ; en-tête « **1001 offres** · médiane 10 250 € · P25 7 950 € · P75 12 800 € · min 1 650 € – max 20 000 € · km médian 44 050 km · 1ʳᵉ immat. médiane 2023 · 37 % particuliers » ; jetons : les trois filtres, dont « Carrosserie : Coupé » ; rev 1 : bandeaux synthétique, couverture, représentativité — **aucun « Filtre Carrosserie non appliqué »** ; **rev 2** : le bandeau `ET-FILTRE-NON-APPLIQUE-BODY` s'affiche sur toute route mode 2 portant `body=` (rejoué sur Corsa `?body=3`, trois projets ; même mécanisme `enterMode2` pour Golf) | la zone annonçait **60** coupés ; l'écran B affiche **1 001** Golf (toutes carrosseries) sous un jeton « Coupé » actif — **`ACC-01`** en rev 1 ; en rev 2 l'écart est **nommé à l'écran** (dette O15 admise, mitigation D8-20 désormais effective) | `P1-6-ecran-B-modele-desktop.png`, `-mobile.png` (rev 1) ; `ACC-01-ecran-B-corsa-body-desktop.png` (rev 2) |

Mobile (360) : mêmes valeurs à chaque étape (107 / 2 632 ; VW 280 ; Golf 60 ; 1 001), parcours passé par la feuille « Filtres » à application différée et le tiroir de navigation.

### 4.2 P2 — mode 2 : Opel Corsa, budget 20 000 €, histogrammes, nuage, liste, exports

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

## 5. Accessibilité — axe-core WCAG 2.1 A/AA

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

## 6. Budgets navigateur — séries complètes

### 6.1 `EX-NFR-5` (rappel 2.8, moteur)
Non remesurée ici (hors navigateur) : `REMEDIATION-2.8` §2.2 — FULL non élagué N = 100 000 : p50 160,9 · **p95 181,1** · max 203,6 ms ; élagué m = 9 283 : p95 92,4 ms. Le budget porte sur le p95.

### 6.2 `EX-NFR-7` — rendu du nuage (≤ 500 ms p95)
Nuage **non vide** : cellule Opel Corsa, 1 352 annonces, **1 232 points tracés, 54 outliers** (« Nuage de 1232 points »), 56 756–69 246 px encrés selon le régime. Méthode : repeint complet provoqué par un changement de facteur de zoom, horloge lue après deux `requestAnimationFrame`.

| Projet | Suite rev 1 (`perf.spec`, 5 zooms) | **Suite rev 2** (`947dbc4`) | Ad hoc rev 1 (7 zooms alternés + / −) |
|---|---|---|---|
| desktop | 30 / 19 / 20 / 18 / 29 ms — médiane 20, max 30 | 23 / 42 / 19 / 25 / 26 — **médiane 25**, max 42 | 21,6 / 36,4 / 19,2 / 30,5 / 31,7 / 31,0 / 31,5 — médiane 31, max 36 |
| tablet | 28 / 22 / 20 / 23 / 23 — médiane 23, max 28 | 26 / 21 / 22 / 20 / 17 — **médiane 21**, max 26 | 23,5 / 20,8 / 36,9 / 25,9 / 31,5 / 31,5 / 31,3 — médiane 31, max 37 |
| mobile | 24 / 21 / 21 / 17 / 23 — médiane 21, max 24 | 28 / 18 / 22 / 27 / 26 — **médiane 26**, max 28 | 24,1 / 24,2 / 24,5 / 24,2 / 31,2 / 54,4 / 23,3 — médiane 24, max 54 |

Entrée complète en mode 2 (snapshot + élagage + moteur + rendu, repère hors budget) : rev 1 1 689 / 1 701 / 1 777 ms ; rev 2 2 140 / 1 795 / 1 694 ms (la valeur desktop de la rev 2 est la première navigation du projet, cache de compilation froid — repère, pas budget). **Hypothèse (E4)** : les 5 000 points de l'exigence sont inatteignables sur le snapshot de référence — la plus grosse cellule est Corsa (1 352, 1 232 éligibles) et la seule autre route mode 2 d'Opel, `modelId = 0` « Modèle non identifié », porte 26 annonces ; le budget est mesuré sur ce maximum réel, avec une marge de ×9 à ×16. Le banc hors navigateur à 5 000 points reste celui de la sonde D7 (p95 2,98 ms, REMEDIATION-2.8 §2.2). La mention « NON REPRÉSENTATIVE tant qu'E2E-02 laisse le nuage à 0 point » que la suite publie encore est **périmée** : le nuage est plein (elle n'est pas fausse, elle est conditionnelle — à retirer lors d'une prochaine passe sur `perf.spec.ts`).

### 6.3 `EX-NFR-8` — interaction continue de 10 s (ARB-38)
Horodatages `requestAnimationFrame` collectés dans la page ; fenêtres glissantes de 1 s au pas de 100 ms ; seuil 30 img/s ; **publiés : fenêtres, fenêtres en défaut, débit minimal**.

| Projet | Suite rev 1 (zoom + survol) | **Suite rev 2** | Ad hoc rev 1 (zoom + survol + **brossage réel** un geste sur trois) |
|---|---|---|---|
| desktop | 615 trames, 94 fenêtres, 0 en défaut, min 53,0 img/s, 28 gestes | 621 trames, **95 fenêtres, 0 en défaut, min 55,0 img/s**, 28 gestes | 598 trames, **90 fenêtres, 0 en défaut, min 59 img/s**, 35 gestes ; série 60–61 avec un plateau à 59 |
| tablet | 609 trames, 94 / 0 / 52,0, 27 gestes | 608 trames, **94 / 0 / 52,0**, 26 gestes | 578 trames, **92 / 0 / 49 img/s**, 33 gestes ; série 49–59, creux à 49 pendant 7 fenêtres consécutives (brossage) |
| mobile | 610 trames, 93 / 0 / 54,0, 27 gestes | 609 trames, **93 / 0 / 55,0**, 28 gestes | 610 trames, **92 / 0 / 60 img/s**, 47 gestes ; série 60–61 |

100 % des fenêtres ≥ 30 img/s dans les neuf séries (exigé ≥ 95 %). Le compteur « 3 annonces sélectionnées » (tablet, ad hoc) atteste que le brossage a bien produit une sélection pendant la mesure.

### 6.4 `EX-NFR-9` — premier affichage utile en 4G simulée (≤ 2 000 ms p95)
CDP `Network.emulateNetworkConditions` : 4 Mb/s descendants, 1 Mb/s montants, **latence 150 ms**, cache navigateur vidé puis désactivé ; mesure du `goto` (commit) jusqu'à la première carte-marque visible ; 5 mesures par cas.

**Rev 2** (`947dbc4`, **213 Kio transférés**, +1 Kio) :

| Projet | `/marche` nu | Médiane | Max | URL déjà filtrée (`/marche?body=3&kmto=100000&priceto=20000`) | Médiane | Max |
|---|---|---:|---:|---|---:|---:|
| desktop | 1517 / 1501 / 1487 / 1503 / 1508 | **1 503** | 1 517 | 1523 / 1646 / 1627 / 1499 / 1741 | **1 627** | 1 741 |
| tablet | 1559 / 1523 / 1500 / 1502 / 1523 | **1 523** | 1 559 | 1542 / 1541 / 1639 / 1534 / 1760 | **1 542** | **1 760** |
| mobile | 1506 / 1498 / 1484 / 1495 / 1480 | **1 495** | 1 506 | 1555 / 1621 / 1602 / 1592 / 1586 | **1 592** | 1 621 |

Rev 1 (`1424dc3`, 212 Kio) : desktop 1532 / 1514 / 1486 / 1511 / 1497 (médiane 1 511, max 1 532) et filtré 1527 / 1628 / 1617 / 1636 / 1615 (1 617, max 1 636) ; tablet 1509 / 1506 / 1488 / 1506 / 1498 (1 506, 1 509) et 1545 / 1628 / 1505 / 1515 / 1735 (1 545, 1 735) ; mobile 1539 / 1505 / 1497 / 1499 / 1486 (1 499, 1 539) et 1499 / 1611 / 1601 / 1593 / 1582 (1 593, 1 611).

**Rev 2 : 30 mesures, aucune ≥ 2 000 ms ; maximum absolu 1 760 ms (marge 240 ms)**, dispersion de 79 ms sur les quinze mesures nues ; médianes à ±20 ms de la rev 1 — **aucune régression imputable à `fix-app-3`** (+0,24 Kio de script, `modelCount` lu sur des agrégats déjà chargés). Le cas « lien partagé » coûte 50–125 ms de plus et reste sous le budget.

### 6.5 `EX-NFR-6` — histogramme (≤ 300 ms p95)
Suite rev 2 (bascule log de G1, 1 352 annonces) : desktop 166 / 128 / 122 / 121 / 132 — **médiane 128**, max 166 ; tablet 187 / 144 / 140 / 127 / 145 — **144**, max 187 ; mobile 166 / 140 / 144 / 130 / 125 — **140**, max 166. Rev 1 : 128 / 131 / 143 ms de médiane (max 166 / 170 / 153) — **aucune régression** (écarts de ±13 ms de médiane, dans la variance d'une machine partagée ; la correction ne touche pas l'écran B). Ad hoc rev 1 (7 dépliages de la table équivalente de G1, double rAF) : 23,1 / 23,1 / 22,1 ms médiane ; recalcul + repeint après pose d'un filtre par clic de barre (Σ 54 → barre) : 84–111 / 86–111 / 73–80 ms.

### 6.6 `EX-NFR-14` — ordre de focus relevé (desktop, `/marche?body=3&kmto=100000&priceto=20000`)
198 tabulations depuis le premier élément tabulable ; **191 / 191** contrôles du bandeau atteints, dans l'ordre du DOM, anneau `2px solid #ffd54a` à chaque arrêt. Début de séquence : `Aller au contenu principal` → `KYCAR` → `Marché` → `Comparer` → `Recherches` → `Suivis` → `Marque / Modèle / Version` → `Prix de` → `Prix à` → `500 €` → `1 000 €` → `1 500 €` → … (présélections, kilométrage, immatriculation, cases Carburant / Carrosserie / Boîte, Type de vendeur, mots-clés, `Rechercher un filtre`, groupes secondaires) … → `Retirer le filtre Prix : ≤ 20 000 €` → `Retirer le filtre Kilométrage : ≤ 100 000 km` → `Retirer le filtre Carrosserie : Coupé` → `Tout effacer` → `Enregistrer la recherche` → `Enregistrer cette recherche` (écran). Mobile : `Aller au contenu principal` → `KYCAR` → `Menu` → `Filtres (3)` → jetons → `Fermer sans appliquer` → ligne primaire… → `Réinitialiser` → `Voir les 2 632 offres`. Écran G : `search-make` (focus initial) → `list-make` → `list-model` → `cancel` (`search-model` et `apply` `disabled` sans marque), puis après choix d'une marque `search-model → list-model → cancel → apply → search-make → list-make` ; `Échap` rend le focus à `Choisir une marque et un modèle`.

### 6.7 Régime compact du bandeau (`EX-SCR-97`, mesuré pour cadrer `EX-SCR-56`)
Barre unique **56 px** (`.kycar-compact-bar`), bouton `Filtres (n)` **123 × 44 px**, feuille `position: fixed` **360 × 740** (plein écran), `overflow-y: auto`, pied « Réinitialiser · Voir les 2 632 offres » ; anneau de focus 2 px dans la feuille ; la barre elle-même **ne colle pas** (y = −691 après 900 px de défilement, en-tête à 0).

### 6.8 Taille du bundle
Rev 2 : `npm run size` : entrée `index-D_TMBd1X.js` **103,12 Kio** gzip, worker `aggregation.worker-BVhtBzDh.js` 13,46 Kio (inchangé), total initial **116,58 / 300 Kio** (61 % de marge), différé 0 / 400 Kio ; CSS 5,79 Kio gzip. Rev 1 : 102,88 + 13,46 = 116,34 Kio (**+0,24 Kio** pour `fix-app-3`).

---

## 7. Dettes visibles en recette — ce que l'utilisateur voit ou ne voit pas

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

## 8. Constats nouveaux de la recette (`ACC-nn`)

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

## 9. Porte G8 et avis de livraison

### Porte G8 — conditions (PLAN-2, table des portes)

| Condition | État | Preuve |
|---|---|---|
| E2E verts sur 3 projets | **oui** (rev 2) | 264 tests, 0 inattendu, 3 attendus (D8-15), 10 sautés motivés, 0 instable, aucune régression depuis la rev 1 (§2) |
| 0 violation axe A/AA | **oui** (rev 2) | 24 / 24 balayages à 0, aucune exception (§5) |
| Budgets navigateur tenus | **oui** (rev 2) | NFR-9 max 1 760 < 2 000 ms ; NFR-7 ≤ 42 ms sur nuage plein ; NFR-8 100 % des fenêtres ≥ 52 img/s ; NFR-6 ≤ 187 ms ; bundle 116,58 / 300 Kio (§6) |
| `ACCEPTANCE.md` livré | **oui** | ce document (rev 2) + 18 captures + `results.json` de la rev 2 |

### **PORTE G8 : FRANCHIE** (rev 1, confirmée en rev 2).

Les quatre conditions de la porte sont remplies et prouvées sur `947dbc4`. Je note, pour que le verdict ne soit pas lu plus large qu'il n'est, que la porte mesure la **suite**, l'**accessibilité automatisée** et les **budgets** : elle ne mesure pas les exigences de présentation que 2.7 avait laissées sans cote, et c'est là que la recette a trouvé ses constats — désormais consignés (D8-43).

### Avis de livraison (fusion `main` + tag `v0.1.0`) — **oui, avec réserves nommées** (rev 2 : la réserve principale est levée)

La décision reste au commanditaire. Mon avis :

1. **Réserve principale de la rev 1 — `ACC-01` — LEVÉE.** Le filtre Carrosserie (et tout filtre de classe `T`) posé en mode 2 est désormais **déclaré** à l'écran, au mot près de D8-20, dans les trois régimes, depuis une URL partagée comme depuis le bandeau ; l'effectif reste celui de la cellule, aucune valeur n'est inventée. La preuve tient dans la suite (`partage-url` › ACC-01, vert ×3) et dans la sonde `R-D8-2.9`, rouges avant, vertes après, sans modification. Plus rien, à ma connaissance, ne présente à l'utilisateur un chiffre sous un jeton de filtre qui ne s'applique pas sans le lui dire.
2. **Réserves de présentation consignées, pas bloquantes — `ACC-02` et `ACC-03`** (et les dix MINEUR `ACC-04`, `06`–`14`, plus `ACC-16`). Le bandeau non collant et surdimensionné (`EX-SCR-56`) et le régime compact de l'écran B (`EX-SCR-181`) sont des écarts d'exigence nets, visibles, qui n'empêchent aucun parcours ; D8-43 les consigne et renvoie leur traitement (phase 2.10) au commanditaire, avec le §8 comme cahier des charges. Je recommande d'y inscrire `ACC-06` en premier (le brossage 2D perd un axe en passant à l'écran D) et `ACC-16` en second (un mot à changer).
3. **Ce qui est solide** : les deux parcours cibles se terminent avec des valeurs exactes et reproductibles (107 / 2 632 ; 1 352 → 54 ; exports réels ; libellés désormais accordés et cardinal des modèles connu dès la première image), l'accessibilité automatisée est à zéro sur les huit surfaces et trois régimes, les budgets ont une marge lisible et n'ont pas bougé avec le correctif, et les dix dettes admises en 2.8 sont visibles ou muettes exactement comme leurs décisions le décrivent — `ACC-01` compris, désormais.

**Avis rev 2 : prêt pour la fusion dans `main` et le tag `v0.1.0`, avec la dette de présentation D8-43 (12 constats + `ACC-16`) nommée dans les notes de version.**

Hypothèses de cette recette (E4), toutes écrites comme telles : moteur Chromium unique (`EX-NFR-17` non exercé sur Firefox/Safari) ; machine partagée avec le serveur `vite preview` (les budgets sont évalués sur la médiane, la série complète est publiée) ; snapshot **synthétique** à graine fixe (les effectifs sont ceux du `SyntheticDataProvider`) ; 5 000 points de nuage inatteignables sur ce snapshot ; `EX-SCR-100` et `EX-SCR-127` mesurés sur cette machine et non sur un appareil de milieu de gamme.

---

## Annexe — fichiers produits

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
