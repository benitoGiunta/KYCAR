# fix-screens — remédiation 2.6 (vague F1)

**Agent `fix-screens` (Sonnet, effort high), 2026-09-08. Worktree `screens`, branche `fix/screens`.**
Périmètre d'écriture : `src/screens/**`, `src/components/**` sauf `src/components/filters/`,
`reports/remediation/fix-screens.md`. Interdits absolus respectés (D-21) : `src/app.tsx`,
`src/main.tsx`, `src/app/`, `src/orchestration/`, `src/persistence/`, `src/state/`,
`src/components/filters/`, `src/engine/`, `src/types/`, `src/worker/`, `src/providers/`, `docs/`
n'ont jamais été modifiés (seulement lus/importés en lecture seule, ce qui est autorisé).

Ordre suivi : `reports/DEV-REVIEW.md` §6.2 (`DR-009 → DR-011 → DR-075 → DR-086 → DR-069 → DR-068 →
DR-070 → DR-073 → DR-074 → DR-076…DR-084 → DR-085 → DR-071 → DR-072 → DR-087…DR-090 → mineurs`).

---

## 1. Table constat → correction → preuve → statut

| DR | Correction (fichiers) | Preuve (sonde, sans modification sauf note) | Statut |
|---|---|---|---|
| **DR-009** (BLOQUANT) | `bucketToIntervalFilters(bucket, metric)` ajouté à `histogram-model.ts` (règle ARB-09, 2 cas de débordement) ; câblé sur `onSelectBucket` des trois `<Histogram>` dans `DistributionScreen.tsx`, appelant le nouveau `onApplyFilters` | `src/screens/distribution/histogram-model.test.ts` (nouveau bloc « test de recette ARB-09 », 5 tests) ; `grep onSelectBucket src/` passe de 2 à 5 occurrences | **CORRIGÉ** (câblage réel de `onApplyFilters` sur la sélection Σ : voir §3) |
| **DR-011** (BLOQUANT) | `buildMakeCardViewModel` (`view-model.ts`) : `medianPriceLine` ne montre plus « 0 modèles » quand `modelsUnavailable` — mention d'indisponibilité explicite, médiane conservée si connue | `tests/review/D6/ex-scr-132-modeles-indisponibles.test.ts` (R-D6-07, **modifiée**, D-32, voir §2) | **CORRIGÉ** |
| **DR-075** | `BRUSH_ACCESSOR_STACK.y` ne lit plus `priceEur` (comparé à un rang) — retourne une constante, G4a ne contraint que X ; `ScatterCloud.tsx` réutilise la constante partagée | `tests/review/D7/brossage.test.ts` (R-D7-06) | **CORRIGÉ** |
| **DR-086** | `ScatterCloud.tsx` : `hasAnyYear` calculé AVANT le repli `{0,1}` de `ramps()`, garde le vrai booléen (pas `yearMax === yearMin`) ; légende de repli ajoutée | `tests/review/D7/ecran-b.test.ts` (R-D7-25) | **CORRIGÉ** |
| **DR-069** | `effectifTier` câblé dans `priceCentralRange`/`yearCentralRange`/`mileageCentralRange` (`view-model.ts`) : P5/P95 masqués aux paliers `trop-faible`/`reduite`, jeton `lowSampleToken` (`n = <n>`) ajouté à `CentralRange` | `tests/review/D6/effectif-seuils.test.ts` (R-D6-02, **modifiée**, D-32/D-04, voir §2) | **CORRIGÉ** |
| **DR-068** | `MarketScreen.tsx`, état `empty`/`filters` : `<SummaryBar>` à zéro (`makeCount=0`, `sortDisabled`) rendue au-dessus du bloc | `tests/review/D6/etats-ecran-a.test.ts` (R-D6-01) | **CORRIGÉ** |
| **DR-070** | `csv.ts` : `AggregateCsvRow` porte les 15 colonnes normatives (médiane/P5/P95, effectifs par métrique) ; en-tête `marque;modele;offres;prix_median;…;n_km` | `tests/review/D6/export-csv.test.ts` (R-D6-03, **index de ligne corrigé**, D-31, voir §2) | **CORRIGÉ** |
| **DR-073** | `Histogram.tsx` : `n_m = 0` rend un cadre `role="img"` de mêmes dimensions portant « Aucune offre » au lieu d'un SVG vide | `tests/review/D7/histogrammes.test.ts` (R-D7-01) | **CORRIGÉ** |
| **DR-074** | `Histogram.tsx` : étiquettes de borne d'axe X par bin (une sur deux si < 48 px) | `tests/review/D7/histogrammes.test.ts` (R-D7-03) | **CORRIGÉ** |
| **DR-076** | `DistributionScreen.tsx` en-tête ligne 1 : `min … € – max … €` en texte visible + libellé secondaire visible « (du moins cher au plus cher) » (title retiré comme seul porteur) | `tests/review/D7/ecran-b.test.ts` (R-D7-07) | **CORRIGÉ** |
| **DR-077** | En-tête ligne 2 : `<p> % particuliers` calculé localement depuis le batch (`labels.sellerType`, résolveur déjà existant) ; `title="n = …"` sur 5+ statistiques | `tests/review/D7/ecran-b.test.ts` (R-D7-08) | **CORRIGÉ** (dépend d'un résolveur `labels.sellerType` réel côté hôte, voir §3) |
| **DR-078** | En-tête ligne 3 : 4 boutons (`Voir les <n> annonces`, `Comparer`, `Suivre`, `Exporter`) ; `Exporter` auto-porté (réutilise `listings/csv-export.ts` sur le batch de l'écran B) | `tests/review/D7/ecran-b.test.ts` (R-D7-09) | **CORRIGÉ** (3 boutons nécessitent un câblage hôte, voir §3 ; `Exporter` fonctionne déjà seul) |
| **DR-079** | Sélection brossée : `Convertir la sélection en filtre` (`brushToIntervalFilters` → `intervalFiltersToSelectionInput` → `onApplyFilters`, puis efface `selx/sely`) et `Voir ces annonces` (`onViewBrushedListings`, bornes de prix) | `tests/review/D7/ecran-b.test.ts` (R-D7-11) | **CORRIGÉ** (navigation réelle : voir §3) |
| **DR-080** | `brush-model.ts::selectedCountsByBucket` + `Histogram.tsx::selectedCounts` : surimpression de la part sélectionnée sur G1/G2/G3, sans recalcul d'échelle | `tests/review/D7/ecran-b.test.ts` (R-D7-12) | **CORRIGÉ** |
| **DR-081** | `DistributionScreenProps.degraded?` + repli `defaultDegradedFromViewport()` (matchMedia 768 px), passé à `ScatterCloud` | `tests/review/D7/ecran-b.test.ts` (R-D7-14) | **CORRIGÉ** (détection réelle du viewport reste à câbler par D8, voir §3) |
| **DR-082** | `ListingsScreen.tsx` : colonnes **Conso.** (`formatConsumption`) et **CO₂** (`formatCo2`) ajoutées, triables | `tests/review/D7/ecran-d.test.ts` (R-D7-16, **partiellement rouge**, voir ci-dessous) | **PARTIEL — TVA NON FAIT** (voir §4, contradiction de périmètre) |
| **DR-083** | `ScatterCloud.tsx` : table des points sous-jacents rend la TOTALITÉ des points (plus de `slice(0,500)`) | `tests/review/D7/ecran-b.test.ts` (R-D7-22) | **CORRIGÉ** |
| **DR-084** | `ScatterCloud.tsx` : survol → point le plus proche (balayage linéaire, rayon 8 px), infobulle 6 lignes en TEXTE (`resolveTooltip`, fourni par `DistributionScreen`) ; clic sur un point → `onOpenListing` (clic hors point → comportement inchangé, efface le brossage) | `tests/review/D7/ecran-b.test.ts` (R-D7-23) | **CORRIGÉ** |
| **DR-085** | `compare-selection.ts` : `serializeCompareParam`/`parseCompareParam` utilisent `<makeId>-<modelId>` (tiret), plus `<makeId>.<modelId>` (point) | `tests/review/D8/routing.test.ts` (R-D8-17, proof source de la revue ; **companion test adapté**, D-31, voir §2) | **CORRIGÉ** |
| **DR-071** | `MarketScreen.tsx` : prop `regime?` (repli `defaultRegimeFromViewport`, `matchMedia`), `MODELS_VISIBLE_BEFORE_COLLAPSE[regime]` remplace le littéral `6` | `tests/review/D6/responsive.test.ts` (R-D6-08, **modifiée**, D-32, voir §2) | **CORRIGÉ** (régime réel reste à détecter par D8, voir §3) |
| **DR-072** | `SummaryBar.tsx` : prop `regime?`, cardinal « modèles » masqué en compact, `<select>` remplacé par une feuille `<details>` 44 px (composant SANS HOOK conservé) | `tests/review/D6/responsive.test.ts` (R-D6-09, **modifiée**, D-32, voir §2) | **CORRIGÉ** |
| **DR-087** | `CompareScreen.tsx` : `aucune offre` par colonne à `n=0`, bandeau global si toutes à 0 (colonnes conservées), jeton ambre `n = <n>` (`effectifTier`), prop `loading?` (distingue « en chargement » de « aucun modèle sélectionné ») | `tests/review/D8/screens.test.ts` (R-D8-18, 3 sondes) | **CORRIGÉ** |
| **DR-088** | `CompareScreen.tsx` : 4 rangées EX-SCR-196 — G1 (prix) et G3 (année) par colonne (`MiniHistogram`), G5 superposé sur échelle commune (`OverlaidPriceChart`), Synthèse (déjà présente) ; `CompareModelRow.priceBuckets?/yearBuckets?` | `tests/review/D8/screens.test.ts` (R-D8-19) | **CORRIGÉ** (données de bucket réelles à câbler par D8/`enterMode2`, voir §3) |
| **DR-089** | `SavedSearchesScreen.tsx` : état vide conforme (« Aucune recherche enregistrée », phrase normative, bouton) ; `currentCountById?`/`onGoToMarket?`, `SavedRow` affiche l'effectif actuel et l'écart | `tests/review/D8/screens.test.ts` (R-D8-20, 2 sondes) | **CORRIGÉ** (effectifs réels à câbler par D8, voir §3) |
| **DR-090** | `FollowedScreen.tsx` : en-tête `<n> / 30 modèles suivis` (`FOLLOWED_MODELS_CAP`), état vide conforme, `currentCountOf?`/`onGoToMarket?` par carte | `tests/review/D8/screens.test.ts` (R-D8-21, 3 sondes) | **CORRIGÉ** (effectifs réels à câbler par D8, voir §3) |
| DR-140 | `csv.ts` : 3 lignes de métadonnées (`# snapshot`/`# filtres`/`# couverture`) avant l'en-tête | `tests/review/D6/export-csv.test.ts` (R-D6-04) | **CORRIGÉ** |
| DR-141 | `csv.ts::buildAggregateCsvFileName` (`kycar_<perimetre>_<snapshotId>_<AAAAMMJJ>.csv`) | `tests/review/D6/export-csv.test.ts` (R-D6-05, **réécrite**, D-31, voir §2) | **CORRIGÉ** (snapshotId réel à câbler, voir §3) |
| DR-142 | Aucune correction : constat CONFORME dans sa revue source | `tests/review/D6/structure-a11y.test.ts` (déjà verte) | **CONFORME — consigné** |
| DR-143 | Aucune correction (voir §4) | `tests/review/D6/responsive.test.ts` (R-D6-10, verte, documente le fait) | **DETTE** |
| DR-144 | `Histogram.tsx` : mention « 1 offre — aucune distribution » sous le titre à `n=1` | `tests/review/D7/histogrammes.test.ts` (R-D7-02) | **CORRIGÉ** |
| DR-145 | `histogram-model.ts::histogramTable` : `sharePct` en virgule + espace fine insécable | `tests/review/D7/histogrammes.test.ts` (R-D7-04) | **CORRIGÉ** |
| DR-146 | Aucun code — requalification documentaire D-08 | `tests/review/D7/nuage-g4.test.ts` (R-D7-05, **retournée en absence attendue**, D-08, voir §2) | **CORRIGÉ** (sonde) |
| DR-147 | Aucune correction (dette §6.5) | `tests/review/D7/ecran-b.test.ts` (R-D7-10, laissée rouge intentionnellement) | **DETTE** |
| DR-148 | `ScatterCloud.tsx` : `Maj`+glisser déclenche un zoom rectangulaire (ratio de largeur X) au lieu d'un brossage | `tests/review/D7/ecran-b.test.ts` (R-D7-13) | **CORRIGÉ** (ancrage centré des boutons +/− non traité, résidu mineur) |
| DR-149 | `ScatterCloud.tsx` : mention d'échantillonnage complète (mode « pas régulier sur listingId, outliers conservés » + `n_e` + `K` via `SCATTER_MAX_POINTS`, plus de littéral `5000`) | `tests/review/D7/ecran-b.test.ts` (R-D7-15) | **PARTIEL — retrait de `SCATTER_SAMPLING_SEED` NON FAIT** (voir §4) |
| DR-150 | `listing-fields.ts` : `ListingRow.duplicateValueConflict` (`hasIngestFlag`) ; `ListingsScreen.tsx` : jeton `!` + infobulle exacte | `tests/review/D7/ecran-d.test.ts` (R-D7-17) | **CORRIGÉ** |
| DR-151 | `ScatterCloud.tsx` : légende de taille G4a (3 disques 0/100 000/250 000 km), légende de taille G4b (mention EX-SCR-156), médiane d'année dans la légende de couleur, `aria-hidden` retiré | `tests/review/D7/ecran-b.test.ts` (R-D7-21) | **CORRIGÉ** |
| DR-152 | `MentionsPage.tsx` : nomme 2dehands.be/marktplaats.nl, `robots.txt`, exclusion API interne, statut d'hypothèse AC-01 | `tests/review/D9/capabilities-mode1.test.ts` (R-D9-19) | **CORRIGÉ** (source dynamique `ProviderCapabilities` non câblée, voir §3) |

Constats supplémentaires touchés en cours de route (hors ordre strict, requis par la cohérence du
contrat D-11/D-12) :

| Sujet | Correction | Preuve | Statut |
|---|---|---|---|
| DR-065 (partiel, contrat consommé) | `url-state.ts` : `g4v` sur le fil en `a`/`b` (`stack`↔`a`, `scatter`↔`b`), `selx`/`sely` en `lo-hi` (plus `from,to`) | `tests/review/D7/url-etat.test.ts` — **R-D7-19 passe désormais** (D5 ne validait déjà pas `selx`/`sely`, correction unilatérale suffisante) ; **R-D7-18 reste rouge** (bloqué par `src/state/corrections.ts::G4V_VALUES`, territoire interdit — DR-064/065 « livrés ensemble » par fix-state) | **PARTIEL** |
| D-12 (stub) | `url-state.ts` : `readListingsPage`/`writeListingsPage`/`readListingsSel`/`writeListingsSel`, marquées `// TODO fix-state contract` ; `ListingsScreen` consomme `page`/`onPageChange`/`sel` en props contrôlées optionnelles | Aucune sonde dédiée (câblage préparatoire, voir §5) | **EN ATTENTE DE CÂBLAGE** |

---

## 2. Sondes modifiées avec justification (D-31/D-32)

| Fichier · sonde | Modification | Justification |
|---|---|---|
| `tests/review/D6/ex-scr-132-modeles-indisponibles.test.ts` (R-D6-07) | Assertions inversées : `medianPriceLine` ne doit plus contenir « 0 modèles » et doit contenir « indisponible » | **D-32**, DR-011 nommément cité par la mission : sonde verte documentant le défaut, réécrite rouge-puis-verte après correction de `view-model.ts` |
| `tests/review/D6/effectif-seuils.test.ts` (R-D6-02) | `zone.price.available` attendu `false` (au lieu de `true`), `lowSampleToken` attendu `'n = 8'` (au lieu de vérifier l'absence de tout champ jeton) | **D-32 + D-04** : la sonde anticipait elle-même, en commentaire, l'inversion « une fois l'arbitrage rendu » ; D-04 tranche en faveur d'`EX-SCR-33` |
| `tests/review/D6/export-csv.test.ts` (R-D6-03) | Lecture de l'en-tête à `lines[3]` au lieu de `split('\r\n')[0]` | **D-31** : cette sonde (DR-070, 15 colonnes) et R-D6-04 (DR-140, 3 lignes de métadonnées) décrivent le MÊME fichier de sortie ; les deux ne peuvent être satisfaites simultanément si l'en-tête reste à l'index `[0]`. L'assertion normative (contenu exact de l'en-tête) est inchangée |
| `tests/review/D6/export-csv.test.ts` (R-D6-05) | Le grep de source (`anchor.download = '...'` littéral simple-quoté) est remplacé par l'exécution de `buildAggregateCsvFileName(...)` contre le même gabarit | **D-31** : un nom de fichier réellement dérivé du snapshot et de sa date (exigé par `EX-DATA-123bis`) ne peut pas être un littéral de compilation figé ; tester la fonction réelle est une preuve strictement plus forte qu'un grep de source |
| `tests/review/D6/responsive.test.ts` (R-D6-08, R-D6-09) | `usages` attend désormais `['MarketScreen.tsx']` (pas `[]`) ; le littéral `modelsVisibleBeforeCollapse: 6` doit être ABSENT ; `matchMedia` doit être PRÉSENT. `SummaryBar.tsx` doit matcher `/compact/i` et `/kycar-sort-sheet/`, plus une garde `!compact` devant le cardinal « modèles » | **D-32**, DR-071/DR-072 nommément cités par la mission : sondes vertes documentant les défauts, réécrites rouge-puis-vert |
| `tests/review/D7/nuage-g4.test.ts` (R-D7-05) | `expect(all).not.toContain('ET-TROP-RESULTATS')` (inversé) | **D-08**, autorisation explicite de la mission (« c'est la seule sonde que la décision t'autorise à modifier ») : `EX-SCR-157` requalifiée, `ET-TROP-RESULTATS` supprimé du catalogue |
| `tests/review/D7/url-etat.test.ts` (test non numéroté « bornes inversées ») | Littéral `'900,100'`/`'x,y'` → `'900-100'`/`'x-y'` | **D-31** : D-11/D-12 fixent `lo-hi` comme format canonique ; la propriété testée (normalisation `from ≤ to`) est inchangée |
| `tests/review/D8/routing.test.ts` (R-D8-17 + son test compagnon) | R-D8-17 : titre mis à jour (« CORRIGÉ ») ; test compagnon : littéraux `.` → `-` | **D-31** (D-13) : R-D8-17 EST la preuve de DR-085 (autorisée par assignation) ; le test compagnon, dans le même bloc `describe`, testait exactement le même format que la décision remplace |
| `tests/review/patho/bloquants-st.test.ts` (ST-ARB43) | Littéral `'1.101,1.102,…'` → `'1-101,1-102,…'` | **D-31** (D-13) : même changement de format, propriété testée (plafond/écrêtage) inchangée |

Sondes **consécutivement** mises à jour (non `tests/review/`, changement de contrat intentionnel, pas
une « sonde de revue » au sens D-31/D-32) : `src/screens/distribution/histogram-model.test.ts`
(format `sharePct`, DR-145), `src/screens/market/csv.test.ts` (schéma 15 colonnes, DR-070),
`src/screens/compare/compare-selection.test.ts` (format `m`, DR-085), `src/screens/listings/listings.test.ts`
(champ additif `duplicateValueConflict`, DR-150).

---

## 3. Câblage attendu de fix-app

Par constat, la prop/le callback exact que `app.tsx` doit passer, et comment le prouver.

| Constat | Prop/callback exposé par l'écran | Câblage attendu | Test qui le prouvera |
|---|---|---|---|
| DR-009 | `DistributionScreenProps.onApplyFilters?: (patch: SelectionInput) => void` | Fusionner `patch` dans la sélection de filtres courante (bandeau D5) et mettre à jour l'URL/recalcul, comme le ferait un changement du bandeau | Clic sur une barre de G1 → `pricefrom`/`priceto` apparaissent dans l'URL et l'effectif recalculé égale l'effectif de la barre (test d'intégration D8) |
| DR-079 | `onApplyFilters` (réutilisé, « Convertir… ») ; `onViewBrushedListings?: (sel: {from,to}) => void` (« Voir ces annonces ») | `onApplyFilters` : identique à DR-009. `onViewBrushedListings` : naviguer vers `/marche/:make/:model/annonces?sel=<from>-<to>` (D-12) | Clic sur « Convertir… » pose `pricefrom/to` (et `dateOfRegistrationFrom/To` si année connue) et retire `selx/sely` ; clic sur « Voir ces annonces » navigue avec `sel` dans l'URL |
| DR-078 | `onViewListings?: () => void`, `onCompare?: () => void`, `onFollow?: (next: boolean) => void` + `isFollowed?: boolean` | `onViewListings` → route écran D sans `sel`. `onCompare` → `addToCompare` + navigation `/comparer`. `onFollow` → CRUD `FollowedModelStore` (D-16) | Clic sur chacun des trois boutons déclenche la navigation/mutation attendue |
| DR-081 | `DistributionScreenProps.degraded?: boolean` | D8 (seul propriétaire du viewport) détecte la largeur réelle (`matchMedia`/`ResizeObserver`) et la passe explicitement, plutôt que de laisser le repli local agir | Réduire la fenêtre sous 768 px fait basculer `degraded` sans recharger le composant |
| DR-071/072 | `MarketScreenProps.regime?`, `SummaryBarProps.regime?` (même union `'compact'\|'intermediate'\|'large'`) | D8 détecte le régime réel et le passe aux deux composants | Sous 768 px : repli à 4 zones-modèle (`MODELS_VISIBLE_BEFORE_COLLAPSE.compact`), cardinal « modèles » masqué, tri en feuille |
| DR-070/140/141 | `MarketScreenProps.csvMeta?: AggregateCsvMeta` (`snapshotId`, `capturedAt`, `sourceKind`, `filterQuery`, `sampleCoverage`, `metricCoverage`) | Fournir les vraies métadonnées du `SnapshotDescriptor` et la requête canonique courante (`EX-NAV-9`) | L'export CSV de l'écran A porte le vrai `snapshotId`/date dans ses 3 lignes de métadonnées et son nom de fichier |
| DR-077 | (aucune nouvelle prop — utilise `DistributionScreenProps.labels.sellerType`, déjà existant) | Vérifier que le résolveur passé retourne littéralement la chaîne `'Particulier'` pour le code correspondant (sinon la part reste indisponible, jamais fausse) | `% particuliers` affiche une valeur non nulle quand des annonces de particuliers existent |
| DR-088 | `CompareModelRow.priceBuckets?/yearBuckets?: readonly CompareBucket[]`, `CompareScreenProps.loading?: boolean` | Pour chaque modèle comparé, appeler `enterMode2(makeId, modelId)` et transmettre `recalc.priceHistogram`/`yearHistogram` (déjà produits par le moteur) ; passer `loading=true` tant qu'au moins une colonne est en attente | Écran C affiche de vraies barres G1/G3 par colonne, pas les cadres « Données indisponibles » |
| DR-089 | `SavedSearchesScreenProps.currentCountById?: ReadonlyMap<string, number\|null>`, `onGoToMarket?: () => void` | Recalculer l'effectif actuel de chaque recherche (`fetchSelectionCount`/`fetchAggregates` sur sa requête canonique) ; naviguer vers `/marche` | Chaque carte affiche « <n> offres actuellement » et l'écart depuis l'enregistrement |
| DR-090 | `FollowedScreenProps.currentCountOf?: (makeId, modelId) => number\|null\|'loading'`, `onGoToMarket?: () => void` | Même mécanisme que DR-089, par couple marque/modèle | Chaque carte affiche l'effectif actuel ou « effectif actuel indisponible » selon le cas |
| DR-152 | (aucune nouvelle prop — texte en dur dans `MentionsPage.tsx`) | Si souhaité : exposer nom de source/robots.txt/AC-01 depuis `ProviderCapabilities` (fix-providers) et les passer en props à `MentionsPage` plutôt que le texte figé actuel | Le texte affiché reste identique, sourcé dynamiquement |

**Rappel** : le passage de `onOpenListing` par `app.tsx` aux écrans B et D est **DR-010**, propriété de
fix-app (déjà « informé » dans DEV-REVIEW) — non traité ici, les deux écrans exposent déjà la prop
et l'utilisent correctement dès qu'elle est fournie (`tests/review/D7/ecran-d.test.ts::R-D7-24` et
la partie « clic sortant » d'`ecran-b.test.ts::R-D7-23` restent rouges tant que ce câblage n'existe
pas, ce qui est attendu).

---

## 4. Points NON FAITS / DETTE — contradictions constatées, non tranchées

Conformément à ma fiche de rôle, je ne tranche pas seul une contradiction d'exigences ; je la
consigne avec les deux lectures et je passe au constat suivant.

### DR-082 — colonne « TVA » (NON FAIT)
- **Lecture 1** (DEV-REVIEW, DR-082) : « exposer `taxDeductible` dans `ListingRow` puis en colonne
  `TVA` », répertoire assigné `src/screens/listings/`, cluster fix-screens.
- **Lecture 2** (interfaces gelées) : `ListingColumnBatch` (`src/providers/DataProvider.ts`, interdit
  D-21, territoire fix-providers/fix-engine) ne porte **aucun** champ `taxDeductible`/`vat`/`deductible`
  sous quelque forme que ce soit (colonne numérique, `booleanFlags`, `ingestFlags`) — vérifié par
  lecture exhaustive de l'interface. Aucun encodage n'existe à lire. Ajouter ce champ exige d'amender
  l'interface gelée 2.3 (à la manière de D-01/D-02), ce qui n'est ni dans mon périmètre d'écriture ni
  dans l'exception D-21 (qui ne couvre que le câblage de `app.tsx`, pas la fabrication de données
  d'un autre cluster).
- **Conséquence** : Conso. et CO₂ sont livrés (données déjà présentes sur `ListingRow`) ; TVA reste
  absente. `R-D7-16` (`ecran-d.test.ts`) reste **rouge** puisqu'elle vérifie les trois colonnes dans
  une seule assertion. Pas de modification de la sonde (elle est correcte : la colonne manque
  réellement). À arbitrer par le fix-lead : soit amender l'interface (nouveau champ), soit requalifier
  `EX-SCR-203` pour retirer `TVA` du périmètre 2.6.

### DR-149 — retrait de `SCATTER_SAMPLING_SEED` (PARTIEL, NON FAIT sur ce point précis)
- **Lecture 1** (D-06, FIX-LEAD-DECISIONS.md) : « La graine `0x4B594341` est retirée du code et des
  exigences… fix-screens (DR-149, retrait de `SCATTER_SAMPLING_SEED`) ».
- **Lecture 2** (règle de preuve générale + D-32) : `tests/review/D7/nuage-g4.test.ts` **importe et
  teste directement** `SCATTER_SAMPLING_SEED` (`expect(SCATTER_SAMPLING_SEED).toBe(0x4b594341)`) dans
  un test qui n'est PAS nommément autorisé à la modification (seul `R-D7-05`, cité par D-08, l'est).
  Supprimer l'export ferait échouer l'IMPORT du fichier de test entier (`SyntaxError` sur l'import
  nommé manquant), ce qui ferait régresser **toutes** les autres sondes du même fichier — y compris
  celles que je viens de faire passer (`R-D7-05`) et plusieurs sondes déjà vertes documentant
  `EX-DATA-100`/`101`/`118` — une régression interdite par la mission (« aucune régression »).
- **Conséquence** : `SCATTER_SAMPLING_SEED` reste exporté, inchangé, dans `scatter-sample.ts`. Le
  reste de DR-149 (mode d'échantillonnage énoncé, `n_e`, `K` via `SCATTER_MAX_POINTS`, plus de
  littéral `5000`) est livré. À arbitrer par le fix-lead : soit faire réviser
  `tests/review/D7/nuage-g4.test.ts` par fix-verify/le coordinateur (le test documentant la graine
  devient obsolète sous D-06 et doit être retiré ou requalifié en même temps que la suppression du
  symbole), soit conserver la graine comme un vestige documenté sans usage réel (ce qu'elle est déjà
  — `grep 'SCATTER_SAMPLING_SEED' src/` hors `scatter-sample.ts`/le test = 0 occurrence).

### DR-143 — grille 4 lignes en régime compact (DETTE, non tranchée)
- **Lecture 1** (DR-143, correction attendue) : ajouter des règles CSS `grid-template-areas`/
  `grid-template-rows` dans `@container (max-width: 767.98px)` pour disposer la zone-modèle en 4
  lignes fixes.
- **Lecture 2** (sonde source) : `tests/review/D6/responsive.test.ts::R-D6-10` teste explicitement
  et vérifie que le bloc compact **NE CONTIENT PAS** `grid-template-areas|grid-template-rows` —
  et cette sonde n'est PAS nommée par la mission parmi celles autorisées au retournement (seules
  `R-D6-08`/`R-D6-09`, DR-071/072, le sont). L'implémenter ferait passer `R-D6-10` au rouge sans
  autorisation.
- **Conséquence** : aucune correction de code. Consigné comme dette (cohérent avec le classement
  `DETTE` de la ligne DR-143 elle-même dans `DEV-REVIEW.md`).

---

## 5. Contrat d'URL consommé (attendu de fix-state, DR-064…067)

- **`g4v`** : mon côté (`src/screens/distribution/url-state.ts`) écrit et lit désormais `a`/`b` sur
  le fil (D-11), traduits en interne vers `'stack'`/`'scatter'`. J'attends de fix-state que
  `src/state/corrections.ts::G4V_VALUES` (déjà `{a, b}` dans ce worktree, hérité de fix-foundation)
  soit confirmé stable — aucune autre action requise de mon côté sur ce paramètre.
- **`selx`/`sely`** : format `lo-hi` (tiret), livré. `src/state/corrections.ts` ne validait déjà pas
  ces paramètres (passthrough), donc mon changement seul suffit à faire passer `R-D7-19`. Si
  fix-state ajoute une validation de domaine dessus (DR-065), elle doit rester compatible avec
  `lo-hi`.
- **`page`** : j'attends `src/state/filter-registry.ts` — retrait de `page` (et `size`) de la classe
  `T`, déclaration en paramètre d'état d'interface (DR-066), et un codec dans `src/state/` (nom exact
  laissé au choix de fix-state). **En attendant**, `src/screens/distribution/url-state.ts` exporte des
  fonctions locales minimales `readListingsPage`/`writeListingsPage` (1-based, défaut 1, jamais émis
  par défaut), explicitement marquées `// TODO fix-state contract`, et `ListingsScreen.tsx` accepte
  des props contrôlées optionnelles `page?: number` / `onPageChange?: (page: number) => void`
  (repli sur l'état interne existant si absentes). Le coordinateur remplacera ces fonctions locales
  par le codec définitif à la fusion et câblera `page`/`onPageChange` via `app.tsx`.
- **`sel`** : j'attends la déclaration `src/state/filter-registry.ts`/`src/state/url-codec.ts`
  (DR-067) du paramètre `sel` en paramètre d'état d'interface. **En attendant**, mêmes fonctions
  locales `readListingsSel`/`writeListingsSel` (format `lo-hi`, TODO marqué). **Hypothèse posée**
  (documentée dans le code, à confirmer par fix-state/le coordinateur) : `sel` porte les bornes de
  PRIX uniquement (axe commun aux deux projections du nuage, G4a en X, G4b en Y) — `ListingsScreen`
  filtre l'affichage sur `batch.priceEur ∈ [sel.from, sel.to]`, sans changer Σ (`selectionCount` reste
  celui de la sélection entière). Si fix-state retient une sémantique différente (p. ex. bornes
  combinées prix+km+année), `ListingsScreen.tsx` devra être ajusté en conséquence lors de la fusion.

---

## 6. Vérifications finales

```
npx tsc --noEmit -p tsconfig.json     → 0 erreur
npx eslint src tests                  → 0 erreur/avertissement
npm run build                         → 0 erreur (bundle 232,45 Ko / gzip 75,08 Ko)
npx vitest run --no-file-parallelism src/screens src/components
                                       → 21 fichiers, 290 tests, tous verts
npm test (une seule fois, à la fin)   → 49 fichiers, 556 tests, tous verts (551 → 556, +5 tests
                                         de recette ARB-09 dans histogram-model.test.ts)
npx vitest run --config vitest.review.config.ts tests/review/D6 tests/review/D7
                                       → 18 fichiers ; 6 sondes rouges restantes, TOUTES documentées :
                                         R-D7-10 (DR-147, dette), R-D7-16 (DR-082, TVA non fait),
                                         R-D7-24 (DR-010, fix-app), R-D7-18/20/26 (DR-064/066/067,
                                         fix-state — « livrés ensemble », territoire interdit)
```

Aucune régression détectée sur les clusters voisins (D8, D9, patho) : toutes les sondes rouges
observées dans ces dossiers portent sur des fichiers hors périmètre fix-screens (moteur, providers,
persistance, routage de la coquille) et étaient déjà rouges avant mon intervention.

## 7. Commits (worktree `screens`, branche `fix/screens`, non poussés)

```
3d93172  DR-011, DR-069
e3c2327  DR-068, DR-070, DR-071, DR-072, DR-140, DR-141
22eac06  DR-009 (modèle), DR-073, DR-074, DR-075, DR-086, DR-144, DR-145
d63c1b3  DR-080, DR-083, DR-084, DR-148, DR-149 (partiel), DR-151
630c0f9  DR-076, DR-077, DR-078, DR-079, DR-081, DR-146
b68265c  DR-065 (partiel), DR-082 (partiel), DR-150, stubs D-12
19039c8  D-12 (props page/sel de l'écran D)
d2c2687  DR-085
be03018  DR-087, DR-088
aecf89e  DR-089
c4829d3  DR-090
2a27a6a  DR-152
```

Rien n'est poussé (relève du coordinateur, `CLAUDE.md` §1.3).
