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
| D8-15 | FV-19 — régimes compact/intermédiaire, hors ligne, assainissement, raccourci, notification | **Corrigés** : régime compact de l'écran D, état hors ligne (`navigator.onLine` + `offline`/`online`, bandeau normatif), raccourci `/` (focus recherche de filtre), notification « k filtres retirés / Annuler », feuille plein écran + application différée du bandeau en compact, menu/tiroir de l'en-tête en compact (fix-state, fix-screens, fix-app). **Dette produit ratifiée** : réglages « Assainissement KYCAR » (`EX-SCR-97/98` — panneau de préférences sans effet sur une valeur affichée, hors budget) → sonde/test E2E en `it.fails`/`test.fail` annoté `DETTE D8-15`. |
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
