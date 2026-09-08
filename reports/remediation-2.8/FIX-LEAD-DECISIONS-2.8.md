# Décisions du fix-lead — phase 2.8 (remédiation post-vérification)

**Coordinateur de session (Fable, effort high), 2026-09-08.** Entrées : `reports/FINAL-VERIFICATION.md`
§3.2(d) et §7 (constats `FV-01…FV-24`, 100 exigences), les constats `E2E-xx` de
`reports/remediation/e2e-harness.md` (intégrés à leur arrivée), les dettes 2.6 levables en interne
(`REMEDIATION.md` §4). Règles d'autorité et de preuve inchangées (2.6 : R-A09, D-31, D-32, D-49).
Numérotation : `D8-xx`.

## A. Périmètre et arbitrages

| # | Sujet | Décision |
|---|---|---|
| D8-01 | FV-01 (BLOQUANT) — tampons détachés après transfert au Worker | **Ne plus transférer** les colonnes lues par le thread principal : `src/worker/client.ts` envoie le lot par **copie structurée** (pas de liste `transfer`) ; coût mesuré et documenté (copie unique par jeu de données, attendu < 100 ms à 100k). Le contrôleur ne dépend plus de l'identité de l'objet. Un test avec un **vrai** Worker est ajouté au harnais E2E (2.9) et, si possible, un test node avec `worker_threads` + `structuredClone` dans `src/worker/`. Porteur : **fix-app** (autorisé sur `src/worker/client.ts`, fix-engine informé). |
| D8-02 | FV-02 (BLOQUANT) — écran A sans zones-modèles, « 0 modèles » | Le marché charge les agrégats **modèle** des cartes rendues avec le marché (`fetchAggregates('MODEL')` groupé par lot de cartes visibles, ou un seul appel de portée marché si le provider le permet), rend 6 zones puis le repli ; `modelCount` vient de la donnée (`MakeAggregate.modelCount`, D8-10), jamais 0 par défaut (« — » tant que la donnée manque). Porteur : **fix-app** (contrôleur + coquille), **fix-screens** (repli 6, cardinal). |
| D8-03 | FV-03 — corrections d'URL silencieuses | La coquille consomme `corrections` : `replaceState` vers l'URL canonique + bandeau `ET-URL-CORRIGEE` au format normatif, durée de vie jusqu'au prochain changement de filtre. Porteur : fix-app. |
| D8-04 | FV-04 — `mmmv` (quatre écarts) | (a) clic sur l'en-tête de carte pose `mmmv = make` ; (b) `mmmv` complet → redirection vers B ; (c) retour B → A réinjecte `make\|\|\|` (D-09) ; (d) un jeton par niveau avec libellé taxonomique (« Volkswagen × », « Golf × »). Porteurs : fix-app (a, b, c), fix-state (d, `labels.ts`). |
| D8-05 | FV-05, FV-06, FV-23 — effectifs de l'écran G, facettes, compteurs | Le contrôleur expose les **facettes** du dernier recalcul (`FacetCount`, différées ≤ 100 ms, `…` pendant l'écart) et les **effectifs par marque/modèle** ; la coquille les passe à `FilterBand`/`ScreenG` (`counts`, `facetCounts`, `resultCount`, `resultCountLoading`) ; le double compteur « <n> offres \| <n> ici » utilise `selectionHashWithoutTaxonomy` via le moteur (`EX-DATA-110bis`). Porteurs : fix-app (exposition + câblage), fix-state (rendu `(n)`/`(0)` gris, compteur). |
| D8-06 | FV-07, FV-08, FV-09, FV-11, FV-15, FV-18 — écran B/C/D | Écran B : C3 + ligne de représentativité, empilement `EX-SCR-38` avec plafond et jeton `+k`, notes d'exclusion sous G1–G3 depuis `SelectionStats`, mode `modelId = 0` (bandeau non refermable, G5/G6/G8/G10/G14 hors DOM, `Comparer` désactivé), fourchettes `[min, max]` dès n = 1 avec jeton ambre `n = <n>` sous 12 (D-04/D-36 : « — » interdit), squelettes de chargement, G15 masqué si un seul pays, brossage horizontal / `Ctrl`+clic / double-clic des histogrammes, légendes discrètes et brossage désactivé sous 4 offres, empreinte par graphe, `ET-CHARGE-MAJ` atténué avec barre de progression. Écran A : dédoublonner le conteneur C3. Écran C : buckets d'année sans `NaN`, `FilterBand` rendu, colonne « + Ajouter un modèle », redirections 1 → B / 0 → A. Porteur : **fix-screens** (fix-app pour les redirections et le montage du bandeau sur C). |
| D8-07 | FV-10 + DR-034 (D-17 levée) — statistiques dans le worker | **La dette D-17 est levée** : `GROUPSTAT`, `NTILE`, paliers de puissance, indice de dépréciation, `R²` (SCR/SCT sur la passe 2 de M2, publié par cellule, avertissement `R² < 0,30`), statistiques de cellule enrichies et `SAMPLE` sont calculés **dans le worker** (nouveaux champs de `RecalcResult` ou nouveau `kind`), avec un test par exigence (`EX-DATA-83bis…quinquies`, `93bis`, `102bis`) ; D7 consomme ces sorties et **supprime** son recalcul sur le thread principal (source unique). Porteurs : **fix-engine** (moteur + protocole), **fix-screens** (consommation). La sonde `it.fails` de DR-034 n'existait pas ; les sondes D4/D7 concernées sont écrites d'abord (D-32). |
| D8-08 | DR-082 (D-38 levée) — colonne TVA | **Amendement d'interface** (à la manière de D-01/D-02) : `ListingColumnBatch.vatDeductible: Uint8Array` (0 = inconnu, 1 = non, 2 = oui) ; synthétique : génération plausible (part de pros déductibles) ; réel : mapping du champ BTW/TVA de 2dehands quand présent, sinon 0 ; écran D : colonne « TVA » triable ; CSV. La sonde `R-D7-16` repasse en `it`. Porteurs : fix-foundation (interface), fix-providers, fix-screens. |
| D8-09 | DR-114 (D-45 levée) — verdicts `INSUFFICIENT_*` | Le vocabulaire des verdicts passe de 6 à **8 codes** (`INSUFFICIENT_DATA` pour n < 12, `INSUFFICIENT_SPREAD` pour variance/MAD nulle) : annexe A amendée (fix-docs), `src/types` (fix-foundation), moteur (fix-engine : un verdict par annonce non évaluable, `EX-DATA-85/86/95`). Les 4 sondes vertes qui contredisaient l'extension sont amendées avec justification (D-31). `R-D4-05` repasse en `it`. |
| D8-10 | DR-122 (« élargie » par 2.7) — entités `MakeAggregate`/`MetricStats` | **Amendement d'interface** : `MakeAggregate.modelCount: number \| null` (obligatoire pour FV-02), `MetricStats.iqr`, `coverage` publiés ; `coverageWarning`, `samplingBias`, `adTierDistribution` **optionnels** (renseignés par le provider réel seulement). Porteurs : fix-foundation (types), fix-providers (calcul), fix-screens/fix-app (affichage). |
| D8-11 | DR-105 — garde R3 E15–E17 | `EX-DATA-49` étendue à E15–E17 (`vin`, `licencePlate`, `belgianCarpassMileageUrl`) : 3 entrées dans `R3_FORBIDDEN_FIELD_NAMES` (fix-foundation), annexe A amendée (fix-docs). `R-D2-02` repasse en `it`. |
| D8-12 | DR-132, DR-134, DR-143, DR-147 | Levées : libellés forgés marqués `[EXTRAPOLÉ]` (fix-state), suggestions par distance d'édition ≤ 2 sur zéro correspondance (fix-state), grille compacte 4 lignes (fix-screens, CSS), mention utilisateur des graphes en dette A-08 (fix-screens). Les sondes correspondantes repassent en `it`. |
| D8-13 | FV-12 — texte v1.1 non aligné (D-07, D-12, D-14, D-15) et décomptes 74 + 27 | fix-docs : `EX-NFR-8` (pan/zoom), `EX-SCR-59/82/83` (primaires, exposés, `zip`/`lat`/`lon` exclus, `page`/`size` hors T), REQUIREMENTS §0/§6/§11.3 (74 retenus + 27 exclus, chiffres de `filters-scope.json`), annexe A §C.5 (140). Journal §13 → **v1.2**. |
| D8-14 | FV-13, FV-14, FV-16, FV-17, FV-21, FV-22, FV-24 | Tous corrigés : résumé d'impression hors `.filter-bar` (fix-app/styles) ; formateur d'année sans séparateur de milliers (fix-state, fix-screens C) ; a11y : pastilles `aria-hidden` + texte contrasté ≥ 4,5:1, case Comparer hors du `role=button`, attributs ARIA des `li role=option` corrigés, premier `Tab` sur le lien d'évitement (fix-screens, fix-state, fix-app) ; amorce SANS-FILTRE avec drapeau de session, `mk` dans le codec, « Comparer (n) » masqué à 0, jeton `Snapshot <JJ/MM>` + infobulle, `href` de la marque avec `currentQuery` (fix-app, fix-state) ; panneau Diagnostic depuis `SnapshotDescriptor` + `Rafraîchir` + bandeau « Nouvelles données du … » (fix-app) ; `favicon` (fix-app, `index.html`/`public`) ; formulaire d'enregistrement prérempli depuis les jetons (fix-state + fix-app). |
| D8-15 | FV-19 — régimes compact/intermédiaire, hors ligne, assainissement, raccourci, notification | **Corrigés** : régime compact de l'écran D, état hors ligne (`navigator.onLine` + `offline`/`online`, bandeau normatif), raccourci `/` (focus recherche de filtre), notification « k filtres retirés / Annuler », feuille plein écran + application différée du bandeau en compact, menu/tiroir de l'en-tête en compact (fix-state, fix-screens, fix-app). **Dette produit ratifiée** : réglages « Assainissement KYCAR » (`EX-SCR-95` — panneau de préférences sans effet sur une valeur affichée, hors budget ; identifiant corrigé après vérification par fix-docs, les régimes `EX-SCR-96/97/98` sont bien à implémenter) → sonde/test E2E en `it.fails`/`test.fail` annoté `DETTE D8-15`. |
| D8-16 | FV-20 — dictionnaire (drapeaux et replis d'ingestion) | fix-providers : `UNIT_UNSUPPORTED` posé, repli carburant création → recherche + `HYBRID_CATEGORY_UNRESOLVED`, rejet d'une annonce sans `listingUrl` (compté dans `rejectedByReason`), `co2Source` renseigné quand la source le porte (sinon `UNKNOWN` justifié). `coverageWarning`/`samplingBias`/`adTierDistribution` : D8-10. |
| D8-17 | Constats `E2E-xx` du harnais 2.9a | Intégrés à leur arrivée : chaque constat est rattaché à un `FV-xx` existant ou devient une ligne propre attribuée au cluster de son répertoire ; le `test.fail()` correspondant doit repasser vert (même règle que les sondes : le test E2E qui a révélé l'écart est la preuve, non modifié sauf justification). |
| D8-18 | Dettes **externes** maintenues | DR-104 (AC-01 juridique — D-18, D-28), DR-112 (source Statbel/bpost — E5), O15 (`bodyTypes` absent du référentiel : `EX-DATA-115bis`, `EX-SCR-221`), `EX-SRCH-12` (`eq` non applicable localement, D-03/O7), `EX-SCR-9` (D-14). Ce sont les **seules** dettes admises à la porte G7 avec D8-15. |
| D8-19 | Sondes modifiées | D-31 inchangée : justification écrite obligatoire, contrôle par fix-verify. Une sonde `it.fails` dont la dette est levée est retournée en `it` **par le correcteur qui lève la dette**, dans le même commit que la correction. |
| D8-20 | Observation « filtre `body` posé en mode 1 cesse de s'appliquer en mode 2 sans mention » | Conséquence d'O15 (index carrosserie vide) : jusqu'à fourniture de la donnée, le mode 2 affiche un bandeau « Filtre Carrosserie non appliqué à ce modèle (donnée indisponible) » via `unsupportedFilterIds` (D-03). Porteurs : fix-providers (déclarer `body` non appliqué en mode 2), fix-app (bandeau). |

## B. Séquencement

```
Étape 0 (SÉQUENTIEL, arbre principal) — fix-foundation-2.8 (Opus/high)
  amendements d'interface : vatDeductible (D8-08), MakeAggregate.modelCount + MetricStats.iqr/coverage
  + optionnels (D8-10), vocabulaire des verdicts 6 → 8 (D8-09), garde R3 E15–E17 (D8-11), types du
  protocole worker pour les statistiques D8-07 (champs de RecalcResult, sans implémentation moteur) ;
  deux copies de DataProvider.ts identiques ; build/lint/npm test verts ; sondes it.fails levées
  seulement si la correction est complète à cette étape (R-D2-02).
        │  fusion, push
        v
Vague F1 (PARALLÈLE, worktrees, node_modules symlinké — rm du lien avant remove, D-50)
  fix-engine Opus/high (D8-07, D8-09 moteur) · fix-providers Opus/high (D8-08, D8-10, D8-16, D8-20)
  fix-state Sonnet/high (D8-04d, D8-05 rendu, D8-12, D8-14, D8-15 bandeau)
  fix-screens Sonnet/high (D8-02 repli, D8-06, D8-07 consommation, D8-08 colonne, D8-12, D8-14, D8-15 écran D — JAMAIS app.tsx)
  fix-docs Sonnet/high (D8-09, D8-11, D8-13 → REQUIREMENTS v1.2)
        │  fusions --no-ff : engine → providers → state → screens → docs ; gates après chaque fusion
        v
Vague F2 (SÉQUENTIEL, arbre principal) — fix-app Opus/high
  D8-01, D8-02, D8-03, D8-04a-c, D8-05 exposition/câblage, D8-06 redirections/C, D8-14, D8-15, D8-20,
  constats E2E de son périmètre ; relance de la suite E2E (npm run test:e2e) sur le build.
        │
        v
fix-verify Opus/high → reports/REMEDIATION-2.8.md (rejoue npm test + test:e2e + budgets)
        │
        v
Coordinateur : porte G7, journal, handoff, push → 2.9b acceptance (Fable/max) → G8.
```

## C. Amendements après l'étape 0

| # | Sujet | Décision |
|---|---|---|
| D8-21 | `npm run lint` rouge avant l'étape 0 (scripts de preuve 2.7 sous `reports/`) | Ratifié : `reports/**` ignoré par ESLint (artefacts de preuve, pas du code livré). |
| D8-22 | `R-D3-02` (temps mural d'`openSnapshot`, marge ~10 %) sensible à la charge machine | Conservée telle quelle ; fix-verify la rejoue **hors charge** (aucun autre agent actif). Si elle reste en défaut à vide, fix-providers relève la marge par une mesure médiane sur 5 exécutions (D-31 justifiée). |
| D8-23 | Résidu DR-122 : `MakeAggregate` sans `displayRange`/`rank`/`makeName` | `rank` et `displayRange` sont dérivés au rendu (tri, A-05) ; `makeName` vient de la taxonomie par `makeId`. Aucun ajout d'interface ; annexe A précisée par fix-docs (« dérivés, non portés par l'entité »). |

## D. Arbitrages après la vague F1

| # | Sujet | Décision |
|---|---|---|
| D8-24 | Sous-points FV-18 laissés par fix-screens (squelettes ET-CHARGE-INIT, interactions de brossage des histogrammes, légendes discrètes + brossage désactivé sous 4 offres, atténuation ET-CHARGE-MAJ) | **Pas de dette** : ET-CHARGE-INIT et ET-CHARGE-MAJ (atténuation + barre) sont câblés par **fix-app** (signal `recalculating` du contrôleur → prop `DistributionScreen.recalculating`) ; brossage horizontal / `Ctrl`+clic / double-clic (`EX-SCR-149`) et légendes discrètes + brossage désactivé sous 4 offres (`EX-SCR-159`) sont livrés par un agent de finition **fix-screens-finition** (Sonnet/high, worktree, fichiers `Histogram.tsx`, `brush-model.ts`, `ScatterCloud.tsx` légendes, sondes D7), en parallèle de fix-app. |
| D8-25 | Quatre sondes D7 rouges après la fusion engine + screens (`EX-SCR-144/191`, `EX-NFR-15`, `EX-SCR-176`, mode `modelId = 0`) : 13 figures au lieu de 14 | Cause : D8-06 « G15 masqué si un seul pays » s'applique désormais parce que le moteur fournit les données ; les fixtures des sondes n'ont qu'un pays. **Les sondes sont corrigées** (fixture à ≥ 2 pays pour les cas « 14 graphes » ; un cas dédié atteste le masquage à un pays), justification D8-06/D-31. Porteur : fix-screens-finition. |
| D8-26 | Retrait des annotations `test.fail()` E2E pour les constats corrigés par fix-state (E2E-12, E2E-14, E2E-21) | Porteur : fix-app (seul propriétaire de `tests/e2e/` en F2), après avoir rejoué chaque test vert. |

## E. Arbitrages après fix-verify rev 1 (G7 NON FRANCHIE) — vague F3

`reports/REMEDIATION-2.8.md` rev 1 (commit `d94d0a2`) : S1 et S4 non atteints. Huit exigences
`PARTIELLE` sans correction ni dette, une correction sans preuve, un renvoi de correcteur non ratifié.
Le fix-lead tranche ci-dessous et ouvre une **vague F3** ; fix-verify rejouera ensuite (rev 2).

| # | Sujet | Décision |
|---|---|---|
| D8-27 | Câblage `onClearFilter` (`EX-SCR-149`) posé par le coordinateur au commit `90a9eea` dans `DistributionScreen.tsx`, sans preuve (REMEDIATION-2.8 §7.4) | Preuve à écrire par **fix-screens-2** dans `tests/review/D7/ecran-b.test.ts` selon le test minimal du §7.4 ; elle doit être rouge sur `3435456` (avant câblage) et verte sur `HEAD` (D-32). |
| D8-28 | Deux corrections de fix-app hors périmètre nominal (`filter-band.css` régime intermédiaire, `FilterBand.tsx` `EX-NAV-11` sur application différée) — REMEDIATION-2.8 §7.3 | **Ratifiées** : causées par le mandat D8-15, bornées au régime concerné, prouvées par un E2E rouge → vert, attribuées en commentaire. Leçon de séquencement retenue : en F2, un correcteur reste ouvert sur chaque répertoire de `src/components/` jusqu'à la fin de la vague (appliqué en F3 : fix-state-2 reste vivant jusqu'à la fin de fix-app-2). |
| D8-29 | FV-06 en **mode 1** (`EX-SCR-65`, `89`, `90` : effectifs de facettes) — renvoi de fix-app à 2.9 sans décision | **Dette architecturale ratifiée** : les facettes exigent un jeu chargé, ce qu'`O17` (élagage avant chargement, mode 1 = agrégats servis sans lignes) interdit ; la contradiction `EX-SCR-89/90` × `O17` en mode 1 ne se tranche qu'avec le commanditaire (E3 : pas de question posée) — elle est donc **hors dépôt**, au même titre que `EX-SCR-9`. Condition de levée : décision produit, ou provider mode 1 exposant des facettes (`DataProvider.facets()` en v2 de l'interface). Aucune valeur inventée : `CheckboxList` ne rend aucune parenthèse sans facettes (vérifié par fix-verify). Marqueur : aucune sonde ne peut la faire échouer sans jeu chargé ; consignée dans REMEDIATION-2.8 §6.1 par fix-verify rev 2, et dans `draft-screens.md` par fix-docs-2. |
| D8-30 | Résidu DR-122 : `MetricStats.iqr` / `coverage` toujours `null` (`EX-DATA-61`, `EX-DATA-64`) — renvoyé entre fix-engine et fix-providers | Attribué à **fix-engine-2** (la correction est dans `src/engine/quantiles.ts`, la plus profonde) : `iqr = q3 − q1`, `coverage = n_m / N` (paramètre `selectionCount`), dans `metricStatsFromCounts` et `exactStatsBySort` ; `tests/review/D4/quantiles-bin.test.ts` amendée dans le même commit avec justification écrite (son `toEqual` fige `iqr: null`, ce qui figeait le défaut). Sonde d'échec d'abord. |
| D8-31 | `EX-SCR-174`, `EX-SRCH-14` (sondes « à écrire en 2.8 » jamais écrites) et les cinq mineurs isolés `EX-DATA-23`, `EX-SCR-17`, `EX-SCR-101`, `EX-SCR-153`, `EX-SCR-212` (attribués à personne) | Attribution F3 : `EX-DATA-23` → fix-engine-2 (`src/types/shared-rules.ts`, sonde D2) ; `EX-SCR-17` (bascule log de G7 seul), `EX-SCR-153` (G4a = bornes/buckets de G1), `EX-SCR-174` (en-tête « aucune offre » + bloc EX-SCR-26 sur B), `EX-SCR-212` (cartes de l'écran E) → fix-screens-2 ; `EX-SCR-101` (filtre invalide après changement de snapshot : conservé, ambre, infobulle, compteur « n filtre(s) sans effet ») et `EX-SRCH-14` (changement de marque en mode 2 → `/marche?mmmv=<make>\|\|\|`) → fix-state-2 pour la logique et les sondes D5, fix-app-2 pour le câblage coquille et les sondes D8. Chaque exigence finit **CORRIGÉE avec preuve** ou en dette **écrite** ici : aucun troisième état. |
| D8-32 | Arbitrages de correcteurs en attente (REMEDIATION-2.8 §7.2) | (1) Dénominateur de `coverageWarning` sur une source d'agrégats = effectif de l'échantillon : **ratifié**, `EX-DATA-17` amendée par fix-docs-2 (une phrase). (2) `co2Source` synthétique figé `UNKNOWN` et déclaré : **dette d'interface gelée** (colonne absente de `DataProvider`), levée en v2 de l'interface ; `EX-DATA-35` annotée par fix-docs-2. (3) `EX-SCR-159` en version bornée : **ratifiée** (seuil et désactivation du brossage conformes ; pastilles littérales à n ≤ 3 = détail de présentation de `draft-screens.md` §6.4, annoté par fix-docs-2). (4) `EX-DATA-64` : `count` porté par le conteneur : **ratifié** (structure, pas valeur ; le bloc publie 13/13 après D8-30). (5) `zipr` `RETENU` / « 77 retenus » : fix-docs-2 aligne `REF-filters.md` et `ARBITRAGES-req-lead.md` sur 74. |
| D8-33 | `reports/e2e/results.json` suivi par git et régénéré à chaque exécution | Conservé suivi : artefact de preuve **de référence**, commité uniquement avec le rapport qui l'a produit (e2e-harness, fix-verify, acceptance). Les exécutions intermédiaires des correcteurs ne le commitent pas (`git checkout -- reports/e2e/results.json` avant leur commit). |

### Séquencement F3

```
Vague F3 (PARALLÈLE, worktrees isolés, node_modules symlinké)
  fix-engine-2  Opus/high  (src/engine, src/worker, src/types, tests/review/D2, D4)  D8-30, EX-DATA-23
  fix-screens-2 Opus/high  (src/screens, tests/review/D6, D7 ; JAMAIS app.tsx)       D8-27, EX-SCR-17/153/174/212
  fix-state-2   Opus/high  (src/state, src/components/filters, tests/review/D5)      EX-SCR-101, EX-SRCH-14
  fix-docs-2    Sonnet/high (docs/, aucun code)                                      D8-29, D8-32 → REQUIREMENTS v1.3
        │  fusions --no-ff : engine-2 → state-2 → screens-2 → docs-2 ; gates après chaque fusion
        v
fix-app-2 Opus/high (SÉQUENTIEL, arbre principal) : câblage listé par screens-2 et state-2,
  sondes D8, E2E complet ; fix-state-2 reste joignable pour src/components/filters (D8-28)
        │
        v
fix-verify rev 2 → REMEDIATION-2.8.md rev 2, porte G7
```

## F. Arbitrages après fix-app-2 (vague F3, câblage)

| # | Sujet | Décision |
|---|---|---|
| D8-34 | `EX-SCR-216` en mode 2 : l'écran G ouvert depuis B affiche `—` par entrée (`screenGMakeCounts` dérivé de `marketPhase`, jamais chargé en mode 2) — fix-app-2 §7.3 | **Rouvert**, voie (a) : `DataController` expose un accesseur sur les agrégats de base **déjà en mémoire** après `start()` (aucun aller provider, aucun second balayage, `EX-NFR-9` intact) ; `app.tsx` s'en sert en repli quand `marketPhase` n'est pas chargé. Porteur : fix-app-2 (arbre principal). Preuve : sonde D8 rouge d'abord + assertion E2E sur un effectif non vide dans G depuis `/marche/<make>/<model>`. |
| D8-35 | Deux demandes de fix-app-2 à fix-state-2 : (7.1) `EX-SCR-103` le contrôle `Marque / Modèle` de B lit `selection` au lieu de `routePair` (« Toutes les marques », G non positionné) ; (7.2) `EX-SCR-97` la feuille compacte est enfermée dans le contexte d'empilement de `.kycar-filter-band` (z-index 2) et l'en-tête collant avale le clic — seul échec E2E inattendu (`EX-SRCH-14` mobile) | **Attribuées à fix-state-2** (D8-28 : il est resté vivant sur `src/components/filters/`), dans son worktree après y avoir fusionné la branche de session. (7.1) : dérivation depuis `routePair` via `serializeMmmvBlock`, sonde D5 rouge d'abord. (7.2) : `.kycar-filter-band--compact { z-index: 20 }` avec le commentaire proposé, prouvé par le test E2E `EX-SRCH-14` projet mobile (autorisé à lancer ce seul test) ; le test reste tel quel, sans `test.fail()`. |

## G. Arbitrages après fix-verify rev 2 (S1/S4 : deux écarts sans décision, trois réserves)

| # | Sujet | Décision |
|---|---|---|
| D8-36 | `EX-DATA-68` / `EX-DATA-61` sur les agrégats de marque et de modèle : bloc 3 × 13 valeurs inexistant, `MetricRange` (interface gelée) à 6 champs, cinq valeurs non dérivables (`mean`, `stdDev`, `p25`, `p75`, `iqr` ; `coverage` seule est dérivable par `n / listingCount`, famille `D8-23` — rédaction corrigée après fix-verify rev 3) (REMEDIATION-2.8 rev 2 §7.1-1) | **Dette d'interface gelée**, même famille que `D8-32(2)` (`co2Source`) : levée en v2 de `DataProvider`. Aucune valeur inventée. Annotation `[amendée 2.8 — D8-36]` sous `EX-DATA-68`, ligne de journal v1.3. Aucun code. |
| D8-37 | `EX-SCR-26` sur l'écran A : `topRestrictiveFilters: []` (`data-controller.ts`), classée `COUVERTE` à tort par la matrice 2.7 (rev 2 §7.1-2) | **Dette architecturale, extension de `D8-29`** : en mode 1 le leave-one-out exigerait un balayage que `O17` interdit ou un aller provider par filtre ; tenue en mode 2 depuis fix-app-2. Re-cotation : `EX-SCR-26` = `COUVERTE` en mode 2, `DETTE D8-37` en mode 1 — à porter par fix-verify rev 3 en §3 et par l'acceptance dans sa matrice. Annotation sous `EX-SCR-26`, journal v1.3. |
| D8-38 | `GroupStatEntry.coverage` non arrondie à 4 décimales alors que `MetricStats.coverage` l'est (rev 2 §7.2-1) | **Sans effet, pas de changement** : dans `EX-DATA-64`, « 4 décimales » figure dans la colonne **« Arrondi de présentation »** ; le producteur n'est pas tenu d'arrondir, l'écran l'est. L'arrondi posé par fix-engine-2 dans `MetricStats` est accepté (idempotent à la présentation). Harmoniser les producteurs est une tâche de v2, non une dette d'exigence. |
| D8-39 | Réserves rev 2 §7.2 : `EX-DATA-23` sans appelant vivant (aucun provider ne sert la date sous forme textuelle) ; sémantique « snapshot entier non filtré » des effectifs de l'écran G en mode 2 (`D8-34`) | (a) `EX-DATA-23` : règle en place et prouvée pour tout provider futur servant `firstRegistrationDate` textuelle ; **constat, pas dette**. (b) `EX-SCR-216` mode 2 : **précision ratifiée** (aucun balayage supplémentaire, `EX-NFR-9`), annotée sous `EX-SCR-216`, journal v1.3. |
| D8-40 | `reports/e2e/results.json` de la rev 2 | Commité avec le rapport rev 2 (`D8-33`) : première recette sans échec inattendu sur `c8c791a`. |
