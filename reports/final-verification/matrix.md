
### 2.1 Annexe A — `EX-DATA-*` (dictionnaire, agrégation, outliers, entités)

| Identifiant | Annexe | Statut | Preuve d'exécution | Écart nommé | Dette / décision |
|---|---|---|---|---|---|
| `EX-DATA-1` | A | **COUVERTE** | `grep -rn "\bfuel:" src/types` = 0 champ nommé `fuel` ; nommage camelCase tenu par `npm run lint` (vert) et `tsc` strict | — | — |
| `EX-DATA-2` | A | **COUVERTE** | sonde D2 `dictionary-fields › règle d'absence (EX-DATA-2)` verte | — | — |
| `EX-DATA-3` | A | **COUVERTE** | exigence de méthode (niveaux de preuve) ; les champs `SCHÉMA` restent `INCONNU` dans les deux providers (sondes D9 `normalization`, D3 `dataset-100k`) | — | — |
| `EX-DATA-4` | A | **COUVERTE** | unités canoniques : `predicates.test` (kW), sonde D3 `EX-DATA-111 / bornes du dictionnaire` (100 % des valeurs dans le domaine), sondes D9 `normalization` | — | — |
| `EX-DATA-5` | A | **NON COUVERTE** | `grep -rln UNIT_UNSUPPORTED src/providers` = aucun fichier : aucun provider ne pose le drapeau ni ne refuse une unité non gérée | drapeau jamais posé (sans effet sur les deux sources actuelles, toutes en km/kW/EUR) | écart non consigné (FV-20) |
| `EX-DATA-6` | A | **COUVERTE** | `format.test › roundHalfAwayFromZero — EX-SCR-3 / EX-DATA-6` ; sonde patho `AMB-01/07/35 → ARB-21` (12 499,5 → 12 500) | — | — |
| `EX-DATA-7` | A | **COUVERTE** | `grep normalize('NFC') src` = 2 occurrences (chargeur de référentiels + normalisation) ; sondes D9 `normalization`, D5 `screen-g` (recherche insensible aux diacritiques) | — | — |
| `EX-DATA-8` | A | **COUVERTE** | sondes D2 `reference-loader › assemble les 27 vocabulaires nommés (EX-DATA-8)`, `dictionary-fields › rattachement des vocabulaires (EX-DATA-8)` | — | — |
| `EX-DATA-9` | A | **COUVERTE** | sonde D2 `reference-loader › EX-DATA-9` + `reference.test › décode un code dans un vocabulaire nommé` | — | — |
| `EX-DATA-10` | A | **NON COUVERTE** | `grep -rn fuelTypePrimary src/providers src/types` = 0 : la table de repli création → recherche n'est pas implémentée | repli inexistant (champ `fuelTypePrimary` SCHÉMA, absent des sources actuelles) ; table toujours `[EXTRAPOLÉ]` | écart non consigné (FV-20) ; dette 2 d'EX-DATA-126 |
| `EX-DATA-11` | A | **NON COUVERTE** | `grep -rn HYBRID_CATEGORY_UNRESOLVED src` = 0 | drapeau jamais posé | écart non consigné (FV-20) |
| `EX-DATA-12` | A | **COUVERTE** | vocabulaire `KYCAR_PRICE_EVALUATION` à 6 codes chargé (sonde `reference-loader`) ; projection relevée dans les sondes D9 `vocabulary` | — | — |
| `EX-DATA-13` | A | **COUVERTE** | M3 = contrôle seul : sonde D4 `EX-DATA-97` (indicateurs publiés) ; `priceEvaluation` n'apparaît dans `src/engine/outliers.ts` que pour le contrôle croisé (3 occurrences, aucune dans un verdict) | — | — |
| `EX-DATA-14` | A | **PARTIELLE** | `src/providers/tweedehands/normalize.ts` l.389 : un deeplink vide est consigné dans `unknownFields` et l'annonce est conservée (pas de REJET) ; la coquille affiche « Cette annonce ne porte pas d'URL d'origine exploitable » | absence d'URL = conservation au lieu du rejet | écart non consigné (FV-20) |
| `EX-DATA-15` | A | **COUVERTE** | `shared-rules.test › clé primaire (EX-DATA-15, DR-003)`, `dedupe.test` (synthétique), sondes patho `R-PATHO-09/10` (lots dédupliqués côté providers) | — | — |
| `EX-DATA-16` | A | **COUVERTE** | sondes D4 `sentinels-eligibility › EX-DATA-16(a)…(f)`, patho `VAL-PRIX-ONREQ-MISSING` | — | — |
| `EX-DATA-17` | A | **PARTIELLE** | compteurs `priceQuotedCount/OnRequest/Missing` publiés (invariant I5, sondes D4/patho) ; `grep coverageWarning src` = 0 | `priceCoverage`/`coverageWarning.price` non publiés | dette DR-122 (§6.5) élargie (FV-20) |
| `EX-DATA-18` | A | **COUVERTE** | sonde D2 `sentinels-prices › ON_REQUEST / MISSING (EX-DATA-16 à 18)` ; `[rev-D3] PRICE_MISSING_UNDECLARED : 2 051` posé par le provider | — | — |
| `EX-DATA-19` | A | **COUVERTE** | sondes D4 `EX-DATA-19(2)/EX-DATA-60/87 — sentinelle RELATIVE`, D3 `R-D3-03`, D2 `R-D2-08`, `invariants.integration › D-44` | — | — |
| `EX-DATA-20` | A | **COUVERTE** | sonde D8 `R-D8-31` (0 carte hors taxonomie sur 294), D9 `taxonomy › ADV-14`, `normalize.test › modèle non résolu → modelId 0` | — | — |
| `EX-DATA-21` | A | **COUVERTE** | `grep -n modelVersion src/engine/*.ts` = 0 : aucune clé de regroupement moteur sur la version ; `shared-rules.test` (trois formes) | — | — |
| `EX-DATA-22` | A | **COUVERTE** | stockage `YYYY-MM` encodé `12·année+(mois−1)` (colonne `firstRegistrationYearMonth`, sonde D2 `dictionary-fields`) ; format écran `MM/AAAA` observé écran D (« 11/2017 ») | — | — |
| `EX-DATA-23` | A | **PARTIELLE** | les deux providers alimentent `firstRegistrationYearMonth` (sondes D9 `normalization`, DR-037) ; aucune sonde ne rejoue les deux regex ni le drapeau `FIRST_REG_UNPARSEABLE` | tolérance du parsing non prouvée par exécution | écart non consigné (mineur, à sonder en 2.8) |
| `EX-DATA-24` | A | **COUVERTE** | champs dérivés : `firstRegistrationYear` (axe année, `engine/flags.ts::yearFromYearMonth`), `mileagePerYear` non exposé ; écran D « 1ʳᵉ immat. 11/2017 » observé | — | — |
| `EX-DATA-25` | A | **COUVERTE** | axe année = `firstRegistrationYear` : histogramme G3 (`Offres par année`) et G5 construits sur `firstRegistrationYearMonth` ; DR-037 (D9) corrigé, sonde D9 `aggregate-invariants` | — | — |
| `EX-DATA-26` | A | **COUVERTE** | sonde patho `VAL-ANNEE-ABSENTE — exclusion métrique par métrique, jamais d'imputation` | — | — |
| `EX-DATA-27` | A | **COUVERTE** | même sonde (aucune imputation) ; `grep -rn modelYear src/engine` n'alimente jamais l'axe année | — | — |
| `EX-DATA-28` | A | **COUVERTE** | `shared-rules.test` (Raw/Clean/tokens) ; sonde patho `ADV-18` (contenu textuel, aucun `innerHTML`) ; écran D colonne Version observée en texte | — | — |
| `EX-DATA-29` | A | **COUVERTE** | `shared-rules.test › nettoyage de modelVersionClean (EX-DATA-29, ARB-61/ADV-17, ARB-24)` + `étapes 7 à 10` | — | — |
| `EX-DATA-30` | A | **COUVERTE** | `shared-rules.test › EX-DATA-30 — liste d'arrêt promotionnelle versionnée` ; `data/reference/version-stoplist.json` servi (HTTP 200) | — | — |
| `EX-DATA-31` | A | **COUVERTE** | `VERSION_FULLY_STRIPPED` posé par `tweedehands/normalize.ts` ; `versionStrippedRate` dans le descripteur (`DataProvider.ts` l.185) | — | — |
| `EX-DATA-32` | A | **COUVERTE** | `validation.test › EX-DATA-32 : priceStatus et priceEur ne peuvent pas se contredire` | — | — |
| `EX-DATA-33` | A | **COUVERTE** | Conso./CO₂ affichées (écran D, colonnes observées « 14,5 l/100 km », « 340 g/km ») et jamais proposées en filtre (registre : aucun paramètre) | — | — |
| `EX-DATA-34` | A | **HORS PÉRIMÈTRE** | aucun filtre local KYCAR (`sourceParity:false`) n'existe dans le registre ; les seuls réglages propres à KYCAR (EX-SCR-95) ne sont pas implémentés | sans objet tant qu'aucun filtre local n'existe | — |
| `EX-DATA-35` | A | **PARTIELLE** | vocabulaire `KYCAR_MEASUREMENT_STANDARD` présent ; aucune dérivation WLTP/NEDC dans les providers (`grep co2Source src/providers` = 0) | `co2Source`/`consumptionSource` figés au défaut `UNKNOWN` | écart non consigné (FV-20) |
| `EX-DATA-36` | A | **COUVERTE** | `predicates.test › la constante de conversion est celle d'EX-DATA-36 et ne s'arrondit pas` ; sonde patho `R-PATHO-15` (corrigée) | — | — |
| `EX-DATA-37` | A | **COUVERTE** | `fuelSourceLabelRaw` n'est qu'une colonne chaîne (`columns.ts`), jamais décodée (`grep` : aucune fonction de décodage) | — | — |
| `EX-DATA-38` | A | **COUVERTE** | sonde patho `VAL-KM-0-ET-1M` ; D-47 (`R-PATHO-04`) | — | — |
| `EX-DATA-39` | A | **HORS PÉRIMÈTRE** | `equipmentCodes` absent du lot colonnaire (`EX-DATA-119`) ; aucun taux d'équipement publié | sans objet | — |
| `EX-DATA-40` | A | **COUVERTE** | sonde D9 `R-D9-14 — pays (EX-DATA-40 / ADV-15)` verte | — | — |
| `EX-DATA-41` | A | **COUVERTE** | registre : `custtype` seul champ vendeur, `pricetype` exclu (`filters-scope.json`, sonde D5 `registry-scope`) | — | — |
| `EX-DATA-42` | A | **COUVERTE** | sonde D2 `r3-guard › n'interdit pas les attributs vendeur autorisés (EX-DATA-42)` | — | — |
| `EX-DATA-43` | A | **NON COUVERTE** | `grep -rn "samplingBias\\|adTierDistribution" src` = 0 | distribution d'`adTier` et `coverageWarning.samplingBias` jamais publiées | dette DR-122 (§6.5) élargie (FV-20) |
| `EX-DATA-44` | A | **COUVERTE** | `grep -rn "imageUrl\\|previewUrl\\|youtube" src` = 0 ; colonne `imageCount` seule (`columns.ts`) | — | — |
| `EX-DATA-45` | A | **COUVERTE** | sonde D2 `open-points › R-D2-18 (les 17 drapeaux tiennent)` ; table `INGEST_FLAG_BIT` (D-01) | — | — |
| `EX-DATA-46` | A | **COUVERTE** | descripteur `ingestFlagCounts` + `rejectedByReason` publiés par `SyntheticDataProvider.ts` l.237-253 et `DataProvider.ts` ; `[rev-D3] ingestFlags ≠ 0 sur 2 753 annonces {MODEL_UNRESOLVED:469, …}` | — | — |
| `EX-DATA-47` | A | **COUVERTE** | sondes D2 `r3-guard`, `dictionary-fields › garantie R3 structurelle (EX-DATA-122)`, `provider-contract › aucune propriété vendeur` | — | — |
| `EX-DATA-48` | A | **COUVERTE** | sonde patho `ING-R3` (code postal injecté, absent en sortie) ; `tweedehands/normalize.ts` ne conserve que NUTS-2 | — | — |
| `EX-DATA-49` | A | **COUVERTE** | sondes D2 `r3-repository-scan › EX-DATA-49 : aucun identifiant E1..E14`, `r3-sweep.test`, `validation.test` (valeur de paramètre) ; `zip`/`lat`/`lon` exclus (D-14) | — | dette DR-105 (E15–E17, hors texte littéral) |
| `EX-DATA-50` | A | **COUVERTE** | région calculée côté KYCAR (`reference-loader` NUTS-2), paramètre `region` en classe D (registre) | — | — |
| `EX-DATA-51` | A | **COUVERTE** | vocabulaire `KYCAR_REGION` NUTS-2 (sonde `reference-loader › 27 vocabulaires`) | — | — |
| `EX-DATA-52` | A | **COUVERTE** | sonde D2 `reference-loader › O14 : table NUTS-2 BE (EX-DATA-52/53)` + `hors des plages : REGION_UNRESOLVED` | — | — |
| `EX-DATA-53` | A | **PARTIELLE** | table `[EXTRAPOLÉ]` non confrontée au fichier officiel (sonde `R-D2-16` en `it.fails`) | obligation de confrontation avant le gel non tenue | dette motivée DR-112 (§6.5, E5) |
| `EX-DATA-54` | A | **PARTIELLE** | `postal-regions-be.json` servi (HTTP 200) mais `exceptions` non prioritaires : sonde `R-D2-16` en `it.fails` | les exceptions communales ne priment pas | dette motivée DR-112 |
| `EX-DATA-55` | A | **COUVERTE** | hors plage → `INCONNU` + `REGION_UNRESOLVED` (sonde `reference-loader`) ; agrégation par `countryCode` seule | — | — |
| `EX-DATA-56` | A | **HORS PÉRIMÈTRE** | aucun agrégat géographique infranational n'est exposé (EX-SCR-222) : la règle de suppression < 5 n'a pas d'objet | sans objet | — |
| `EX-DATA-57` | A | **COUVERTE** | rattachement des champs : critère S5 de la revue D2 (`ATTEINT`), colonnes de l'écran D et agrégats observés | — | — |
| `EX-DATA-58` | A | **COUVERTE** | champs de diagnostic hors écrans : colonnes de l'écran D observées (15) ne portent aucun champ de diagnostic ; export CSV `EX-DATA-123bis` (sondes D6/D7) | — | — |
| `EX-DATA-59` | A | **COUVERTE** | notations : invariants I1–I8 exécutables (sondes D4) | — | — |
| `EX-DATA-60` | A | **COUVERTE** | sondes D4 `sentinels-eligibility`, patho `VAL-PRIX-SENTINELLE-MOTEUR`, D3 `R-D3-04`, `invariants.integration › D-44` | — | — |
| `EX-DATA-61` | A | **PARTIELLE** | `MetricStats` porte `n` (`entities.ts` l.164-175) ; titres « Offres par prix (1246) » observés ; `coverage` absent du bloc | `coverage_m` non publiée | dette motivée DR-122 (§6.5) |
| `EX-DATA-61bis` | A | **COUVERTE** | `coverage.test › sampleCoverageOf` ; bandeau observé « Couverture d'échantillon non applicable sous filtre — 100 000 annonces observées » ; sonde patho `T-01/AMB-15` | — | — |
| `EX-DATA-62` | A | **COUVERTE** | sonde D4 `quantiles-bin › EX-DATA-62/111 — quantiles exacts type 7 contre valeurs connues` | — | — |
| `EX-DATA-63` | A | **COUVERTE** | même sonde (double précision, arrondi à la présentation) + `ARB-21` patho | — | — |
| `EX-DATA-64` | A | **PARTIELLE** | 10 des 13 valeurs publiées (`entities.ts::MetricStats`) ; `count`, `coverage`, `iqr` absents | 3 valeurs manquantes | dette motivée DR-122 (§6.5) |
| `EX-DATA-65` | A | **COUVERTE** | sonde D4 `n = 1 : … sd = null (EX-DATA-65)` + `quantiles.test` | — | — |
| `EX-DATA-66` | A | **COUVERTE** | `src/engine/quantiles.ts` l.10 (Welford, variante Chan) ; `WelfordAccumulator` exporté | — | — |
| `EX-DATA-67` | A | **COUVERTE** | `format.test › formatYearRange`, `formatMileageRange (plancher/plafond de centaine)` ; sonde D6 `fourchette-centrale › card.year` | — | — |
| `EX-DATA-68` | A | **PARTIELLE** | agrégats de marque servis (294 cartes, sommes = N, I1) ; `modelCount`, `displayRange`, `rank`, `coverageWarning`, `adTierDistribution` absents de `MakeAggregate` — d'où « 0 modèles » affiché (FV-02) | champs manquants dans l'entité gelée | dette motivée DR-122 ; FV-02 (effet visible) |
| `EX-DATA-69` | A | **COUVERTE** | sondes D6 `fourchette-centrale` (11/11) ; observé : « 4 850 – 18 850 € (fourchette centrale (90 % des offres)) · du moins cher au plus cher : 400 – 19 950 € » | — | — |
| `EX-DATA-70` | A | **COUVERTE** | `sort.test › compareMakeRows / sortMakeRows — EX-SCR-119/120, EX-DATA-70/70ter` | — | — |
| `EX-DATA-70bis` | A | **COUVERTE** | `sort.test › compareLabels — EX-DATA-70bis` ; sonde D6 `tri` | — | — |
| `EX-DATA-70ter` | A | **COUVERTE** | sonde D7 `ecran-d › tri (EX-SCR-206, EX-DATA-70ter)` ; `sort.test` (ordre total) | — | — |
| `EX-DATA-71` | A | **PARTIELLE** | `view-model.test › modelCount (EX-DATA-71)` vert ; en production la carte affiche « 0 modèles » tant que ses agrégats modèle ne sont pas chargés (journal P1b-2) | valeur affichée fausse avant clic | écart non consigné (FV-02) |
| `EX-DATA-72` | A | **COUVERTE** | sondes D6 `modele-non-identifie`, D9 `taxonomy › ADV-14`, `router.test` (clé 0), `sort.test` | — | — |
| `EX-DATA-73` | A | **COUVERTE** | invariant I2 (sondes D4) : somme des modèles = effectif marque, aucun seuil | — | — |
| `EX-DATA-74` | A | **COUVERTE** | sondes D4 `invariants-mutation › I1..I8`, D3 `EX-DATA-104 (I1)` | — | — |
| `EX-DATA-75` | A | **COUVERTE** | sonde D4 `quantiles-bin › EX-DATA-75/76/77/78/79/80/81/83 — BIN` | — | — |
| `EX-DATA-76` | A | **COUVERTE** | idem (semi-ouvert à droite) ; clic de barre « 10 500 € à 11 000 € : 6 offres » → `pricefrom=10500&priceto=10999` → 6 offres (journal P3-A) | — | — |
| `EX-DATA-77` | A | **COUVERTE** | sonde D4 `année, W = {1}` + BIN ; histogrammes observés (pas de 2 500 €, 20 000 km, 1 an) | — | — |
| `EX-DATA-78` | A | **COUVERTE** | sonde D4 `bins intérieurs vides conservés (EX-DATA-78)` | — | — |
| `EX-DATA-79` | A | **COUVERTE** | sondes D4 (débordements non émis si vides) et D7 `étiquettes fr-BE … bins de débordement en inégalité (EX-DATA-79)` ; observé « −∞ – 2001 · 9 offres » | — | — |
| `EX-DATA-80` | A | **COUVERTE** | sonde D4 `n = 1 : exactement un bin fermé … lowConfidence à n < 12` | — | — |
| `EX-DATA-81` | A | **COUVERTE** | sondes D4 `n = 0 : EMPTY`, patho `VOL-00` | — | — |
| `EX-DATA-82` | A | **COUVERTE** | sonde D4 `I8 (EX-DATA-82) : BIN(permutation(V)) = BIN(V) octet à octet` | — | — |
| `EX-DATA-83` | A | **COUVERTE** | sonde D4 `EX-DATA-83 : share = count / n arrondi à 4 décimales, Σ count = n` | — | — |
| `EX-DATA-83bis` | A | **PARTIELLE** | `graphs-model.test › GROUPSTAT / NTILE (EX-DATA-83bis/83ter)` vert ; G9/G12/G13/G15 observés (Professionnel 701 · 64 % · 26 750 €) — calcul sur le thread principal, pas dans le worker | source unique non tenue au sens strict (protocole worker) | dette motivée D-17 (DR-034) |
| `EX-DATA-83ter` | A | **PARTIELLE** | même test unitaire ; G10 observé (tranches) — hors worker | idem | dette motivée D-17 |
| `EX-DATA-83quater` | A | **PARTIELLE** | G14 « Prix médian par puissance » observé (paliers 20 kW, `graphs-model.ts`) — hors worker | idem | dette motivée D-17 |
| `EX-DATA-83quinquies` | A | **PARTIELLE** | `graphs-model.ts` l.53-68 (base 100 = année la plus récente, `annualLossPct`) ; G6 observé avec son message d'ineffectif exact — hors worker | idem | dette motivée D-17 |
| `EX-DATA-84` | A | **COUVERTE** | `outliers.groundtruth.test` (M1/M2 vs vérité terrain D3), sonde D4 `EX-DATA-84..97` | — | — |
| `EX-DATA-85` | A | **PARTIELLE** | 4 codes émis ; `INSUFFICIENT_DATA`/`INSUFFICIENT_SPREAD` jamais émis par annonce (sonde `R-D4-05` en `it.fails`) | vocabulaire à 6 codes non honoré | dette motivée D-45 (DR-114) |
| `EX-DATA-86` | A | **COUVERTE** | sondes D4 `thresholds-m1m2 › choix de cellule M2 (C₂/C₃)`, D6 `effectif-seuils › n = 12`, patho `R-PATHO-08` (corrigée) | — | — |
| `EX-DATA-87` | A | **COUVERTE** | `cellLevel`/`cellSize` publiés (DR-030 corrigé) ; observé infobulle G8 « écart calculé sur : Opel Corsa · n = 1089 · score : écart au prix attendu (M2) » | — | — |
| `EX-DATA-88` | A | **COUVERTE** | `outliers.groundtruth.test` (M1 : 282 M1 retrouvés, 0 hors gabarit) ; sonde D4 `thresholds-m1m2` | — | — |
| `EX-DATA-89` | A | **COUVERTE** | sonde patho `VAL-VARIANCE-0 — AUCUN faux positif (EX-DATA-89/92)` | — | — |
| `EX-DATA-90` | A | **COUVERTE** | `src/engine/outliers.ts` (ridge + Cholesky, deux passes) ; `outliers.groundtruth.test` (M2 100 % en cellules éligibles) ; sonde D4 `EX-DATA-86/90` | — | — |
| `EX-DATA-91` | A | **COUVERTE** | `outliers.ts` l.242-259 : régresseur retiré sur égalité exacte, `INSUFFICIENT_SPREAD` si les deux tombent ; sonde patho `VAL-VARIANCE-0` | — | — |
| `EX-DATA-92` | A | **COUVERTE** | sonde D4 `Couverture des verdicts (EX-DATA-92/94)` ; `outliers.ts` (MAD × 1,4826, seuil 2,5) | — | — |
| `EX-DATA-93` | A | **COUVERTE** | `outliers.ts` l.309-315 (passe 2 sur `\|z\| < 3,5`, recalcul sur F complet) ; `outliers.groundtruth.test` | — | — |
| `EX-DATA-93bis` | A | **NON COUVERTE** | `grep -rn "rSquared\\|R²" src/engine src/screens/distribution` = 0 | `R²` jamais calculé ni publié | écart non consigné (FV-10) |
| `EX-DATA-94` | A | **COUVERTE** | sonde patho `R-PATHO-16 — EX-DATA-94` (corrigée) ; G8 observé trié par écart décroissant (−79,1 %, −77,9 %, …) | — | — |
| `EX-DATA-95` | A | **COUVERTE** | invariant I6 (`outlierEvaluatedCount + outlierNotEvaluatedCount = priceQuotedCount`, sondes D4) | point d'instruction D-51 (seuil de Σ ≠ seuils par cellule) versé au dossier, pas un défaut | — |
| `EX-DATA-96` | A | **COUVERTE** | sonde D4 `EX-DATA-84..97 — … contrôle M3` (tableau 2×2 sur E) | — | — |
| `EX-DATA-97` | A | **COUVERTE** | sondes D4 `EX-DATA-97 — les quatre indicateurs M3 … ≥ 3 cellules d'effectif > 200` (revue + unitaire) | — | — |
| `EX-DATA-98` | A | **COUVERTE** | `scatter-model.test › buildScatterPoints (EX-DATA-98)` | — | — |
| `EX-DATA-99` | A | **COUVERTE** | sondes D4 `EX-DATA-99 — éligibilité …`, `R-D4-02` (ventilation, corrigée), D7 `nuage-g4 › ventilation … somment à N` | — | — |
| `EX-DATA-100` | A | **COUVERTE** | sonde D7 `EX-DATA-100 : K = 5 000 jamais dépassé sur 20 000 éligibles` | — | — |
| `EX-DATA-100bis` | A | **COUVERTE** | sonde D7 `trois permutations … même échantillon octet à octet` ; `D-06` (aucune graine) | — | — |
| `EX-DATA-101` | A | **COUVERTE** | sondes D7 `pas régulier sur listingId (ré-implémentation indépendante)`, `\|A\| ≥ K` | — | — |
| `EX-DATA-102` | A | **COUVERTE** | sondes D4 `EX-DATA-102 / I7 — grille de densité`, `invariants-mutation › I7` (D-25) | — | — |
| `EX-DATA-102bis` | A | **COUVERTE** | `graphs-model.test › G7 — densité prix × km (EX-DATA-102bis)` ; G7 observé (message d'ineffectif exact sous 40) | — | — |
| `EX-DATA-103` | A | **COUVERTE** | sonde D7 `R-D7-15` (corrigée : mention avec mode, sans graine) | — | — |
| `EX-DATA-104` | A | **COUVERTE** | sondes D4 `EX-DATA-104 — I1..I8`, `invariants.integration`, D3 `EX-DATA-104 (I1)` | — | — |
| `EX-DATA-105` | A | **COUVERTE** | sonde D2 `open-points › O16 : 14 entités typées` | — | — |
| `EX-DATA-106` | A | **COUVERTE** | `DataProvider.ts` l.164-185 : `announcedListingCount`, `duplicateValueConflictCount`, `unknownCountByField`, `versionStrippedRate`, `ingestFlagCounts` ; `SyntheticDataProvider.ts` l.237-253 les renseigne | — | — |
| `EX-DATA-107` | A | **COUVERTE** | bandeau « Données synthétiques de démonstration » observé sur A, B, D, /mentions et pied de page ; sondes D8 `fallback › EX-DATA-107`, `shell-static › R-D8-08`, D3 `contract-labeling` | — | dette D-18 (provider réel non câblé) sans effet sur l'exigence |
| `EX-DATA-108` | A | **COUVERTE** | sondes D2 `selection-codec › FULL:EMPTY`, `R-D2-05 (tri par identifiant)` ; `hash=1dcd2e7b7780b20b:35a0c206ac32bfef` (sonde D8 parcours) | — | — |
| `EX-DATA-109` | A | **COUVERTE** | baseline précalculée (`fetchBaselineAggregates = 0 ms`, sonde D8 `EX-NFR-9`), LRU 32 (sonde D4 `lru-cache`), agrégats filtrés à la volée (sonde D4 `EX-DATA-109`) | — | — |
| `EX-DATA-110` | A | **PARTIELLE** | budgets mesurés à N = 10⁵ (`npm run test:perf` : recalcul complet p95 165,5 ms, facettes p95 21,8 ms) ; N = 10⁶ non mesuré (hypothèse E4) | table de coûts à 10⁶ non mesurée (le budget opposable est EX-NFR-5, tenu) | — |
| `EX-DATA-110bis` | A | **COUVERTE** | sonde D4 `EX-DATA-110bis — facettes en UN balayage` (p95 21,8 ms) | — | — |
| `EX-DATA-111` | A | **COUVERTE** | sondes D4 `quantiles exacts type 7`, D3 `bornes du dictionnaire`, patho `VAL-KM-0-ET-1M` | — | — |
| `EX-DATA-112` | A | **COUVERTE** | sonde D4 `EX-DATA-112 / EX-DATA-115 / ARB-55 — mémoire mesurée à N = 100 000 … ≈ 225 Mo à 10⁶ (dont index ≈ 23 Mo)` sous l'enveloppe 274 Mo (extrapolation E4) | — | — |
| `EX-DATA-113` | A | **COUVERTE** | recalcul élagué modèle 0,10 ms, marque 54,1 ms p95 (`test:perf`) : la borne basse découle de la borne haute | — | — |
| `EX-DATA-114` | A | **COUVERTE** | clés `(snapshotId, selectionHash, …)` : sonde D4 `lru-cache › clé jamais partagée entre deux jeux` ; types `entities.ts` | — | — |
| `EX-DATA-115` | A | **PARTIELLE** | sonde D4 `EX-DATA-115/116 — IDX_MAKE / IDX_MODEL` verte ; sonde `les bitsets énumérés sont construits — DETTE : aucun chemin de calcul ne les consulte` | bitsets construits mais inutilisés | écart consigné dans la sonde D4 (dette de revue), non repris au §4 de REMEDIATION |
| `EX-DATA-115bis` | A | **PARTIELLE** | sonde D2 `R-D2-17` verte (index `modelsByBodyType` + `bodyTypeIndexAvailable`) ; `bodyTypes = []` sur 4 955 modèles (O15) | index disponible et vide, donnée à fournir | point ouvert O15 (externe) |
| `EX-DATA-116` | A | **COUVERTE** | sondes D4 `équivalence élagage / balayage complet (20 sélections)` (D-34 corrigée), `recalc.perf › élagage (facteur 12 500×)` | — | — |
| `EX-DATA-117` | A | **COUVERTE** | tris observés (cartes par effectif, zones par effectif, G8 par score) ; `sort.test`, sonde D7 `EX-DATA-118` | — | — |
| `EX-DATA-118` | A | **COUVERTE** | sondes D7 `l'échantillon est rendu trié par listingId croissant (ordre total)`, `scatter-sample.test` | — | — |
| `EX-DATA-119` | A | **COUVERTE** | sondes D2 `dictionary-fields › disposition physique (8 champs)`, `19 colonnes … 2 champs de bits` ; `Int32Array` `makeId`, `Uint32Array` `ingestFlags` (D-01/D-02) | — | — |
| `EX-DATA-120` | A | **COUVERTE** | sondes D2 `sentinelles typées`, D7 `EX-DATA-120 : une sentinelle du batch est décodée en —`, `validation.test` | — | — |
| `EX-DATA-121` | A | **COUVERTE** | sonde D2 `EX-DATA-121 : les 5 champs textuels sont hors du chemin chaud` | — | — |
| `EX-DATA-122` | A | **COUVERTE** | sondes D2 `garantie R3 structurelle du schéma colonnaire`, `provider-contract` | — | — |
| `EX-DATA-123` | A | **COUVERTE** | `grep -ciE "contact\|message\|transaction" src/types/entities.ts` = 0 | — | — |
| `EX-DATA-123bis` | A | **COUVERTE** | sondes D6 `EX-DATA-123bis — colonnes normatives de l'export Agrégats mode 1`, D7 `ecran-d › export CSV`, `csv.test` (3 lignes de métadonnées, nom de fichier) | — | — |
| `EX-DATA-124` | A | **COUVERTE** | exigence documentaire (décisions à contester en 2.2) : contestées et arbitrées (`REQ-STRESSTEST.md`, ARB-15/17/19) | — | — |
| `EX-DATA-125` | A | **COUVERTE** | documentaire ; les trois décisions sont implémentées (seuil 12 : `effectifTier` ; K = 5 000 ; axe `firstRegistrationYear`) | — | — |
| `EX-DATA-126` | A | **PARTIELLE** | les deux dettes annoncées « à solder avant le gel v1.0 » restent ouvertes : table postale `[EXTRAPOLÉ]` (DR-112), table carburant non relevée (EX-DATA-10) | obligation de solde non tenue | dette motivée DR-112 (E5) ; EX-DATA-10 non consignée (FV-20) |
| `EX-DATA-127` | A | **COUVERTE** | documentaire ; aucun des trois champs `[À CONFIRMER]` n'est clé d'agrégation (`grep offerType\\|vehicleType\\|publicationState src/engine` = 0 clé de groupe) | — | — |

### 2.2 Annexe B — `EX-SCR-*` (écrans, bandeau, graphes, états, responsive)

| Identifiant | Annexe | Statut | Preuve d'exécution | Écart nommé | Dette / décision |
|---|---|---|---|---|---|
| `EX-SCR-1` | B | **COUVERTE** | `format.test › formatInteger — EX-SCR-1 (U+202F)` ; sonde D6 `Format fr-BE des nombres (EX-SCR-1/3/4/5/6)` ; observé « 2 656 offres » | — | — |
| `EX-SCR-2` | B | **COUVERTE** | observé écran D « 14,5 l/100 km », G8 « -79,1 % » ; `R-D7-04` (virgule décimale) corrigée | — | — |
| `EX-SCR-3` | B | **COUVERTE** | `format.test › formatPrice — EX-SCR-3`, `roundHalfAwayFromZero` | — | — |
| `EX-SCR-4` | B | **COUVERTE** | `format.test › formatPriceRange — EX-SCR-4` ; observé « 4 850 – 18 850 € » | — | — |
| `EX-SCR-5` | B | **COUVERTE** | `format.test › roundMileageUnit`, `formatMileageRange (plancher/plafond de centaine)` ; observé « 0 – 90 800 km » | — | — |
| `EX-SCR-6` | B | **PARTIELLE** | `format.test › formatYearRange/formatModelYear/formatFirstRegistrationMonthYear` verts ; mais jeton du bandeau « Première immatriculation : 2 017 – 2 017 » et écran C « 2 008 – 2 026 » (journal P3-A, P3-C5) | années rendues avec séparateur de milliers hors écran A | écart non consigné (FV-14) |
| `EX-SCR-7` | B | **COUVERTE** | observé écran D « 385 kW » ; `format` puissance ; unité de l'axe suit `powertype` (non exposé, D-15) | — | — |
| `EX-SCR-8` | B | **COUVERTE** | observé écran D « 14,5 l/100 km », « 340 g/km » ; aucun filtre associé (registre) | — | — |
| `EX-SCR-9` | B | **PARTIELLE** | pays en libellé FR observé (« Belgique ») ; code postal tronqué `10xx` non affiché (aucune colonne postale dans le lot, D-14) | `NNxx` absent de l'écran D | décision D-14 (périmètre R3) — requalification du texte à faire |
| `EX-SCR-10` | B | **COUVERTE** | `format.test › formatOfferCount — EX-SCR-10` ; observé « 61 offres », « aucune offre » (state.test) | — | — |
| `EX-SCR-11` | B | **COUVERTE** | `format.test › formatPercent — EX-SCR-11` ; observé G13 « 64 % / 36 % » | — | — |
| `EX-SCR-12` | B | **COUVERTE** | sonde D7 `R-D7-08` (corrigée : effectif en infobulle) ; observé libellés « médiane », « P25 », « P75 », « min », « max » | — | — |
| `EX-SCR-13` | B | **COUVERTE** | `format.test › truncateGraphemes — EX-SCR-13` ; attribut `title` complet observé sur les zones (« title="T-Roc" ») | — | — |
| `EX-SCR-14` | B | **COUVERTE** | sondes D5 `EX-NFR-28 — libellés entièrement en français` ; libellés relevés repris (« SUV/4x4/Pick-Up » dans `BODY_TYPE_OPTS`) | — | — |
| `EX-SCR-15` | B | **COUVERTE** | `histogram-model.test › buildHistogram (axe à 0)` ; bascule log jamais active par défaut (`EX-SCR-16` test) | — | — |
| `EX-SCR-16` | B | **COUVERTE** | `histogram-model.test › bascule log conditionnelle (EX-SCR-16)` ; classe `kycar-log-toggle` ; `g<n>log` dans le codec (sonde D7 `url-etat`) | — | — |
| `EX-SCR-17` | B | **PARTIELLE** | axe des prix linéaire partout (observé) ; bascule log de G7 non retrouvée (`grep log src/screens/distribution/AdditionalGraphs.tsx` : G7 sans bascule) | bascule log de G7 absente | écart non consigné (mineur) |
| `EX-SCR-18` | B | **COUVERTE** | `scatter-model.test › bornes d'axe et projection (EX-SCR-18)` ; débordements en inégalité observés | — | — |
| `EX-SCR-19` | B | **COUVERTE** | sonde D7 `cas de bord de la géométrie (EX-SCR-19/150)` ; `histogram-model.test` | — | — |
| `EX-SCR-20` | B | **COUVERTE** | sonde D6 `responsive › EX-SCR-20/136/137 : 768/1280/1680` ; `breakpoints.test` ; régime détecté par la coquille (`detectRegime`) | — | — |
| `EX-SCR-21` | B | **PARTIELLE** | tokens de rythme dans `tokens.css` (sonde D1 `contrast-tokens`) ; cibles tactiles 44 px non mesurées | non mesuré au rendu | campagne 2.9 |
| `EX-SCR-22` | B | **NON COUVERTE** | journal P5-A à 1 440 × 900 : 15 cartes visibles, **0 zone-modèle** (aucune zone rendue avant clic sur l'en-tête) | ≥ 24 zones exigées, 0 observée | écart non consigné (FV-02) |
| `EX-SCR-23` | B | **COUVERTE** | sonde D6 `ET-CHARGE-INIT (EX-SCR-23/130)` ; `Exporter` désactivé au chargement (`partialCache`/`canSave`) | — | — |
| `EX-SCR-24` | B | **PARTIELLE** | `aria-busy="true"` sur l'écran A pendant le rechargement ; aucune atténuation à 45 % ni barre de progression 3 px (`grep` `MarketScreen.tsx`/`app.css`) | indicateurs normatifs absents | écart non consigné (FV-18) |
| `EX-SCR-25` | B | **PARTIELLE** | recalcul local mode 1 sans indicateur (agrégats provider, `loadMarket`) ; budget 150 ms non mesuré au rendu ; bascule vers `ET-CHARGE-MAJ` non observable | non mesuré | campagne 2.9 |
| `EX-SCR-26` | B | **COUVERTE** | sondes D6 `ET-VIDE-FILTRES (EX-SCR-26)`, `topRestrictiveFilters (leave-one-out)` | — | — |
| `EX-SCR-27` | B | **COUVERTE** | sonde D6 `ET-VIDE-SANS-FILTRE (EX-SCR-27)` | — | — |
| `EX-SCR-27bis` | B | **COUVERTE** | sonde D6 `SANS-FILTRE (EX-SCR-27bis/125/126)` ; `state.test` ; `cy` injecté n'entre pas dans l'état (journal P1-1 : « 3 filtres actifs » avec `cy=B` dans l'URL) | — | — |
| `EX-SCR-28` | B | **COUVERTE** | sonde D6 `ET-ERREUR-PROVIDER (EX-SCR-28)` ; bandeau dégradé daté + `Réessayer` + code d'erreur (`app.tsx::AppHeader`, `R-D8-07` corrigée) | — | — |
| `EX-SCR-29` | B | **COUVERTE** | sonde D8 `R-D8-07 — EX-NFR-22 / EX-SCR-29` (corrigée) ; `Exporter` désactivé en `partialCache` | — | — |
| `EX-SCR-30` | B | **COUVERTE** | `coverage.test`, C3 = `sampleCoverage` seule ; bandeau observé (100 % sans filtre, « non applicable sous filtre » avec filtres) | — | — |
| `EX-SCR-31` | B | **PARTIELLE** | `coverage.test › buildC3Banner — EX-SCR-31` vert ; C3 observé sur A ; **absent de l'écran B** (journal P2-1 : seul bandeau = source synthétique) ; lien « Pourquoi ? » non retrouvé | C3 non rendu sur B, panneau « Pourquoi ? » absent | écart non consigné (FV-07) |
| `EX-SCR-32` | B | **COUVERTE** | sonde D6 `seuil-60-marques › texte littéral` ; observé « 294 marques correspondent — affinez pour comparer » + bouton `Afficher les 294 marques` | — | — |
| `EX-SCR-33` | B | **COUVERTE** | `thresholds.test › effectifTier — paliers 0, 1, 3, 5, 9, 11, 12, 29, 30` ; G8 absent sous 30 (message exact observé), M2 démarre à 30 (sondes D4) | — | — |
| `EX-SCR-34` | B | **COUVERTE** | `—` avec `aria-label` sur valeur absente : sonde D7 `EX-DATA-120 : sentinelle décodée en —` ; observé colonnes de l'écran D | — | — |
| `EX-SCR-35` | B | **PARTIELLE** | blocs sans champ absents du DOM (G16/G16b/`Vue le` jamais rendus) ; la liste des blocs supprimés n'est pas dans le panneau Diagnostic (8 lignes d'orchestration seulement) | panneau Diagnostic incomplet | écart non consigné (FV-21) |
| `EX-SCR-36` | B | **COUVERTE** | sondes D4/D2/D3 sur `PRICE_SENTINEL_ABSOLUTE` (compte, exclu de `V_price`), `ON_REQUEST` (« Prix sur demande » : `format`), seuil unique 250 € (`R-D2-08`) | — | — |
| `EX-SCR-37` | B | **NON COUVERTE** | `grep -rn "onLine\\|Hors ligne\\|offline" src` = 0 : aucun état hors ligne, aucune désactivation des filtres T | état absent | écart non consigné (FV-19) |
| `EX-SCR-38` | B | **PARTIELLE** | ordre partiel respecté (dégradé > message) ; aucun plafond à deux ni jeton `+k avertissements` (`grep avertissements src` = 0) ; C3 rendu deux fois sur A (journal P1b-1 : deux nœuds portant le même texte) | empilement non gouverné, doublon C3 | écart non consigné (FV-07) |
| `EX-SCR-38bis` | B | **NON COUVERTE** | journal P3-D1 : URL `fuel=Z,B&pricefrom=abc&kmfrom=100000&kmto=1000&foo=1&priceto=99999999` chargée → filtres corrigés mais **aucun bandeau ET-URL-CORRIGEE** et URL non réécrite ; `app.tsx` ignore `loadQuery().corrections` | corrections silencieuses dans la coquille | écart non consigné (FV-03) |
| `EX-SCR-39` | B | **PARTIELLE** | mentions présentes : synthétique, C3, échantillonnage (D7), sentinelles ; mais notes d'exclusion des graphes absentes (EX-SCR-178) et corrections d'URL muettes (EX-SCR-38bis) | critère « cinq mentions » non atteint | écart non consigné (FV-03, FV-11) |
| `EX-SCR-40` | B | **COUVERTE** | écrans A et B obligatoires livrés ; C, D, E, F, G présents et retirables (routes indépendantes) | — | — |
| `EX-SCR-41` | B | **COUVERTE** | aucun écran de détail : `resolveView` (7 vues) ; deeplink `window.open(https://www.autoscout24.be/…, '_blank', 'noopener')` observé (journal P4-A) | — | — |
| `EX-SCR-42` | B | **PARTIELLE** | quatre onglets observés « Marché Comparer (0) Recherches Suivis (0) » + jeton de snapshot ; la marque `KYCAR` renvoie vers `/marche` **sans** les filtres actifs (`href="/marche"`) | filtres perdus par le lien de marque | écart non consigné (FV-17) |
| `EX-SCR-43` | B | **PARTIELLE** | jeton observé « Snapshot be-synthetic-100000-4b594341 du 1/09/26 (7 j) », classes d'âge 7/30 j (`app.tsx`) ; format normatif `Snapshot <JJ/MM>` + infobulle (effectifs, pays) non respecté ; action `Rafraîchir` absente | format et infobulle non conformes | écart non consigné (FV-17, FV-21) |
| `EX-SCR-44` | B | **PARTIELLE** | `aria-disabled` sous 2 modèles (sonde D8 `R-D8-22 — EX-SCR-44`, corrigée) ; compteur « (0) » affiché alors qu'il doit être absent à 0 (journal P3-C1) | compteur à 0 visible | écart non consigné (FV-17) |
| `EX-SCR-45` | B | **COUVERTE** | fil d'Ariane observé « Marché › Volkswagen Golf » et « Marché › Opel Corsa › Annonces » ; retour par `Marché` conserve les filtres (journal P1b-4) | — | — |
| `EX-SCR-46` | B | **NON COUVERTE** | aucun double compteur « <n> offres \| <n> ici » à droite du fil d'Ariane (`grep "ici" src/app.tsx` = 0 ; `selectionHashWithoutTaxonomy` jamais consommé) | compteur absent | écart non consigné (FV-23 élargi) |
| `EX-SCR-47` | B | **COUVERTE** | pied observé « Source : AutoScout24 — agrégat non affilié. Données du 1/09/26 … Mentions légales Diagnostic » ; `/mentions` statique observée | — | — |
| `EX-SCR-48` | B | **NON COUVERTE** | `grep -n "menu\\|drawer\\|767" src/app/app.css` = 0 : aucun bouton de menu ni tiroir en régime compact (journal P1b-6 : onglets inchangés à 360 px) | en-tête compact non implémenté | écart non consigné (FV-19) |
| `EX-SCR-49` | B | **COUVERTE** | journal P3-D2 : `/` → `/marche` (replaceState) | — | — |
| `EX-SCR-50` | B | **PARTIELLE** | filtres, `g4v`, `g<n>log`, `selx/sely`, `page`, `sel` encodés (sondes D7 `url-etat`, D5 `url-roundtrip`) ; état déplié des cartes (`mk`) et repliement des groupes (`grp`) non encodés (URL inchangée après dépliement, journal P1b-2) | `mk`/`grp` absents de l'URL | écart non consigné (FV-17) |
| `EX-SCR-51` | B | **PARTIELLE** | A → B : requête identique à un préfixe près (journal P1b-3 : `?body=3&kmto=100000&priceto=20000` conservée) ; B → A ajoute `mmmv=74\|2084` (couple complet) au lieu du seul segment marque | retour B → A non conforme (voir EX-NAV-16) | écart non consigné (FV-04) |
| `EX-SCR-52` | B | **COUVERTE** | point arbitré une fois par l'annexe C (`EX-NAV-13`, 800 ms) : `interaction.ts` l.51 `groupWindowMs = 800` ; sondes D5 `interaction-history` | — | — |
| `EX-SCR-53` | B | **PARTIELLE** | panneau `<details>` Diagnostic observé (8 lignes : statut, source, snapshot, effectif, code d'erreur, requête, régime) ; ni liste des champs attendus, ni blocs supprimés, ni journal des 10 erreurs, ni `duplicateValueConflictCount` | contenu normatif largement absent | écart non consigné (FV-21) |
| `EX-SCR-54` | B | **COUVERTE** | seule modale : écran G (`role=dialog`), fermée par `Échap` (journal P1-3) ; confirmations de suppression inline (`role=alert` « Supprimer ? ») | — | — |
| `EX-SCR-55` | B | **COUVERTE** | sondes D5 `keyboard-band` (ordre des 4 zones) ; zone (4) observée dès un filtre posé | — | — |
| `EX-SCR-56` | B | **PARTIELLE** | `position: sticky` sur l'en-tête (`app.css` l.48) et la barre de synthèse (`market.css`) ; hauteurs 96/320 px et plafond 40 % du viewport non mesurés | hauteurs non vérifiées | campagne 2.9 |
| `EX-SCR-57` | B | **COUVERTE** | sondes D5 `EX-SCR-57 — un filtre de classe D n'est jamais sérialisé`, `url-codec.test`, `labels.test` ; classes R/T/D dans le registre (`EX-SCR-82` sonde) | — | — |
| `EX-SCR-58` | B | **COUVERTE** | `filter-registry.test › classe T/R/D — jeton observable (EX-SCR-58)` | — | — |
| `EX-SCR-59` | B | **PARTIELLE** | implémentation conforme à D-15 : 8 contrôles + `kwd`, 12 paramètres (`band-model.test`, sonde D5 `EX-SCR-59 amendée`) ; le texte v1.1 dit encore 9 contrôles dont `Pays` (`cy`) sans marque d'amendement | texte v1.1 non amendé pour D-15 | écart non consigné (FV-12) |
| `EX-SCR-60` | B | **COUVERTE** | documentaire (critères de choix) ; 8 primaires retenus cohérents avec la table hors `cy` (D-15) | — | — |
| `EX-SCR-61` | B | **COUVERTE** | `gear` primaire en classe T (`filter-registry.ts` l.560) ; aucun graphe de boîte (EX-SCR-218) | — | — |
| `EX-SCR-62` | B | **COUVERTE** | documentaire ; `eq`, `pe_category`, `offer`, `emclass` en secondaire (registre) ; `zip`/`zipr` exclus (D-14) | — | — |
| `EX-SCR-63` | B | **COUVERTE** | contrôle `radio-group` du registre (`custtype`, `desc`) ; sonde D5 `registry-scope` | — | — |
| `EX-SCR-64` | B | **COUVERTE** | contrôle `select` avec `Indifférent` (`controls/`) ; `adage` exclu (`filters-scope.json`) | — | — |
| `EX-SCR-65` | B | **PARTIELLE** | `CheckboxList` avec en-tête « Au moins une de ces valeurs » observé (journal P2-2) ; effectifs `(412)` jamais affichés : `facetCounts` non alimenté par la coquille (`grep facetCounts src/app.tsx src/components/filters/FilterBand.tsx` = 0) | facettes absentes | écart non consigné (FV-06) |
| `EX-SCR-66` | B | **COUVERTE** | `eq` (136 valeurs) sur panneau à recherche interne (`PanelSearchMulti.tsx`) avec avertissement Z1 (sonde patho `ADV-11 : EQ_AND_PRESUMED affiché`) | — | dette de virtualisation signalée dans le composant (REMEDIATION §7.1 n° 6) |
| `EX-SCR-67` | B | **COUVERTE** | `RangeControl.tsx` (deux champs + paliers relevés observés « 500 € … 100 000 € », « 2 500 km … 200 000 km ») ; `lsyeinmifrom` à borne unique (registre) ; histogramme miniature non observé (mineur) | — | — |
| `EX-SCR-68` | B | **COUVERTE** | `RangeControl.tsx` l.63/69 : « La borne basse dépasse la borne haute », « Ramené à <valeur> » ; permutation réservée à l'URL (EX-NAV-22) | — | — |
| `EX-SCR-69` | B | **COUVERTE** | contrôle `boolean-toggle` (registre : `vatded`, `superdeal`, …) ; booléen faux non émis (`url-codec.test`) | — | — |
| `EX-SCR-70` | B | **HORS PÉRIMÈTRE** | `zip`/`zipr`/`lat`/`lon` exclus du périmètre (D-14, motif R3) ; `crossborder` seul reste (registre) | sans objet | décision D-14 |
| `EX-SCR-71` | B | **COUVERTE** | `kwd` en zone (2) (sonde D5 `R-D5-19 — kwd appartient à la zone (2)`, corrigée) ; `cid` exclu | — | — |
| `EX-SCR-72` | B | **COUVERTE** | bouton « Toutes les marques » ouvrant l'écran G (journal P1-3) ; sondes D5 `EX-SCR-72`, `screen-g-model.test › serializeMmmv` | — | — |
| `EX-SCR-72bis` | B | **COUVERTE** | `filter-registry.test › bilan EX-SCR-83 (un contrôle par filtre retenu)` ; sonde D5 `registry-scope › id, param et type repris sans dérive` | — | — |
| `EX-SCR-73` | B | **PARTIELLE** | dépendances désactivantes : sondes D5 `tr-split › EX-SCR-73`, `R-D5-08/17` corrigées ; notification « 3 filtres de leasing retirés » + `Annuler` absente (`grep retirés FilterBand.tsx` = 0) | notification absente | écart non consigné (FV-19) |
| `EX-SCR-74` | B | **COUVERTE** | 3 filtres D (`damaged_listing`, `region`, `dlv_max`) désactivés avec `disabledReason` (sonde D5 `EX-SCR-83 mis à jour — 3 filtres de classe D`) | — | — |
| `EX-SCR-75` | B | **PARTIELLE** | sondes D5 `EX-SCR-75 — format des jetons`, patho `ADV-01` ; observé « Prix : ≤ 20 000 € », « Carrosserie : Coupé » ; mais jeton taxonomie « Marque / Modèle / Version : 74\|2084 » (code brut, un seul jeton) et année « 2 017 » | jeton `mmmv` non conforme (un jeton par niveau, libellés) | écart non consigné (FV-04, FV-14) |
| `EX-SCR-76` | B | **COUVERTE** | sondes D5 `EX-SCR-76 — retirer un intervalle retire ses DEUX bornes`, `R-D5-22` (corrigée, D-10 : `removesCodes` dans l'infobulle) | — | — |
| `EX-SCR-77` | B | **COUVERTE** | sonde D5 `EX-SCR-77 / EX-SRCH-18` ; journal P2c-3 : « Tout effacer » sur B → URL sans paramètre, route conservée | — | — |
| `EX-SCR-78` | B | **PARTIELLE** | format implémenté (`R-D5-24`) ; `resultCount`/`resultCountLoading` jamais passés par `app.tsx` → compteur absent à l'exécution | compteur de la zone (4) non alimenté | REMEDIATION §7.1 n° 1 (écart non consigné, FV-23) |
| `EX-SCR-79` | B | **COUVERTE** | `filter-search.test › trois index` ; sonde D5 `R-D5-12` (corrigée) | — | — |
| `EX-SCR-80` | B | **PARTIELLE** | dépliage/surbrillance/compteur (`filter-search`) ; suggestions Levenshtein absentes (sonde `R-D5-13` en `it.fails`) | suggestions absentes | dette motivée DR-134 (§6.5) |
| `EX-SCR-81` | B | **NON COUVERTE** | `grep "key === '/'" src/components/filters` = 0 | raccourci `/` absent | écart non consigné (FV-19) |
| `EX-SCR-82` | B | **PARTIELLE** | sonde D5 `EX-SCR-82 — la classe T/R/D correspond à la table` (avec exceptions D-12 `page`/`size`) ; texte v1.1 : `cy` PRIMAIRE, `zip`/`lat`/`lon` RETENU, `page`/`size` T — non amendés (D-12/D-14/D-15) | table normative non alignée sur les décisions 2.6 | écart non consigné (FV-12) |
| `EX-SCR-83` | B | **PARTIELLE** | registre : 74 retenus, 68 exposés, 6 `NON_EXPOSE`, 3 D, 12 primaires (sonde D5 `EX-SCR-83 mis à jour`) ; texte v1.1 : 77 / 76 / 1 / 13 | bilan arithmétique du texte périmé | écart non consigné (FV-12) |
| `EX-SCR-84` | B | **COUVERTE** | `FUEL_OPTS` = vocabulaire de recherche (`2`, `3`, `B`, `D`, `E`… observés dans le bandeau) ; texte d'aide hybrides ; égalité stricte (`predicates`) ; sonde D2 `EX-DATA-9` | — | — |
| `EX-SCR-85` | B | **COUVERTE** | sonde D5 `EX-SCR-85 — les quatre sémantiques présumées portent leur infobulle` | — | — |
| `EX-SCR-86` | B | **COUVERTE** | `debounce-policy.test › EX-SRCH-4 : 500 ms` ; `Entrée` applique immédiatement (journal P2-2bis) — D-19 | — | — |
| `EX-SCR-87` | B | **PARTIELLE** | une seule règle `:focus-visible` dans les feuilles (`grep` = 1) ; jeton immédiat dans la zone (4) observé ; contours de 2 px non vérifiés au rendu | styles de focus non mesurés | campagne 2.9 |
| `EX-SCR-88` | B | **COUVERTE** | `band-model.test › isControlDisabled — EX-SCR-88 (a, b)` ; sonde D5 `EX-SCR-88(a)/(b)` | — | — |
| `EX-SCR-89` | B | **NON COUVERTE** | aucune option n'affiche `(0)` : `grep "(0)" src/components/filters/controls` = 0 ; les facettes ne sont pas rendues (FV-06) | options à zéro non distinguées | écart non consigné (FV-06) |
| `EX-SCR-90` | B | **NON COUVERTE** | moteur conforme (sonde D4 `EX-DATA-110bis`) ; `FacetCounts` prévu dans `FilterFieldRow`/`CheckboxList` mais jamais alimenté par `FilterBand`/`app.tsx` | facettes jamais affichées | écart non consigné (FV-06) |
| `EX-SCR-91` | B | **COUVERTE** | sondes D5 `EX-SCR-91` ; observé « 3 filtres actifs » (`cy` injecté non compté) | — | — |
| `EX-SCR-92` | B | **COUVERTE** | sondes D5 `EX-SCR-92 — seuls les groupes contenant un filtre actif sont dépliés` ; `grp` non encodé dans l'URL (voir EX-SCR-50) | — | — |
| `EX-SCR-93` | B | **COUVERTE** | sondes D5 `EX-SCR-93 — l'ordre des groupes est celui du texte normatif` | — | — |
| `EX-SCR-94` | B | **PARTIELLE** | bouton « Enregistrer la recherche » présent en zone (4) (`R-D5-24`, câblé `fa6e83a`) ; il enregistre immédiatement sous le nom généré « Recherche du 8/09/26 16:35 » sans champ de nom prérempli par la description des filtres | champ de nom prérempli absent | écart non consigné (FV-24) |
| `EX-SCR-95` | B | **NON COUVERTE** | `grep -rn Assainissement src` = 0 | les deux réglages KYCAR n'existent pas | écart non consigné (FV-19) |
| `EX-SCR-96` | B | **NON COUVERTE** | `grep -n "compact\\|sheet\\|feuille" src/components/filters/FilterBand.tsx band-model.ts` = 0 : aucun régime intermédiaire du bandeau | non implémenté | écart non consigné (FV-19) |
| `EX-SCR-97` | B | **NON COUVERTE** | idem ; journal P1b-6 à 360 px : bandeau complet rendu, pas de bouton « Filtres (n) » ni de feuille | non implémenté | écart non consigné (FV-19) |
| `EX-SCR-98` | B | **NON COUVERTE** | idem (aucune adaptation compact des contrôles d'intervalle) | non implémenté | écart non consigné (FV-19) |
| `EX-SCR-99` | B | **COUVERTE** | `<fieldset>/<legend>` (`SecondaryGroups.tsx`), région `aria-live="polite"` (`ActiveFilterTokens.tsx`) ; sondes D5 `EX-SCR-99` ; contraste : voir EX-NFR-13 | — | — |
| `EX-SCR-100` | B | **PARTIELLE** | index de recherche préconstruit (`filter-search.test`) ; budgets 100 ms / 16 ms non mesurés sur appareil de référence | non mesuré | campagne 2.9 |
| `EX-SCR-101` | B | **PARTIELLE** | aucun reset implicite observé (navigation, erreur) ; marquage « 1 filtre sans effet » après changement de snapshot non implémenté (`grep "sans effet" src` = 0) | filtre invalide non signalé | écart non consigné (mineur) |
| `EX-SCR-102` | B | **COUVERTE** | sondes D5 `EX-SCR-102 : 60 filtres posés, URL rechargeable`, `keyboard-band › 60 filtres actifs` | — | — |
| `EX-SCR-103` | B | **PARTIELLE** | même composant sur A, B, D (`app.tsx`) ; **absent sur C** (`/comparer` : `filterBar: false`, journal P3-C5) | bandeau absent de l'écran C | écart non consigné (FV-15) |
| `EX-SCR-104` | B | **PARTIELLE** | écran A rendu et restreint aux marques de `mmmv` ; **aucune redirection vers B** quand `mmmv` porte un couple complet (journal P1b-4 : `mmmv=74\|2084` → écran A à 1 carte ; `grep redirig src/app` = 0) | redirection absente | écart non consigné (FV-04) |
| `EX-SCR-105` | B | **COUVERTE** | trois blocs observés (barre de synthèse collante, grille, pied « 36 marques sur 112 · Charger 12 marques de plus ») ; `R-D6-01` corrigée | — | — |
| `EX-SCR-106` | B | **PARTIELLE** | barre observée « 112 marques · 0 modèles · 2 656 offres — 36 marques affichées », tri, inversion, case « Masquer… » ; le cardinal `modèles` vaut 0 puis « 67 » après un seul clic : il ne compte que les cartes chargées | cardinal `modèles` faux | écart non consigné (FV-02) |
| `EX-SCR-107` | B | **PARTIELLE** | quatre régions présentes ; la liste de zones-modèles est **vide** tant que l'en-tête n'est pas cliqué, puis affiche toutes les zones d'un coup (68 pour VW) sans repli à 6 (journal P1b-2) | chargement paresseux, « 6 visibles puis repli » jamais appliqué | écart non consigné (FV-02) |
| `EX-SCR-108` | B | **COUVERTE** | `view-model.test › badgeInitials / badgeColorForMake` ; observé « VO », « ME », « AU » ; aucun logo. Contraste des pastilles : voir EX-NFR-13 | — | — |
| `EX-SCR-109` | B | **PARTIELLE** | ligne 2 conforme (fourchette centrale + suffixe, rawRange, années ; km absent : sonde D6) ; ligne 1 « 0 modèles · médiane 10 850 € » avant clic | `<n> modèles` faux | écart non consigné (FV-02) |
| `EX-SCR-110` | B | **NON COUVERTE** | journal P1b-2 : le clic sur l'en-tête **déplie la carte** (`onSelectMake` = `onToggleExpand`) et ne pose pas `mmmv` ; URL inchangée | comportement du clic non conforme | écart non consigné (FV-04) |
| `EX-SCR-111` | B | **HORS PÉRIMÈTRE** | identifiant en pierre tombale (supprimée, ARB-43) ; aucune case de comparaison de marque (sonde D6 `EX-SCR-118`) | — | — |
| `EX-SCR-112` | B | **PARTIELLE** | zone à 3 lignes + barre de part observée (HTML journal P2c-5) ; hauteur 72 px non mesurée ; zones absentes avant clic | voir EX-SCR-107 | FV-02 |
| `EX-SCR-113` | B | **PARTIELLE** | les 9 éléments présents dans le HTML observé (nom, effectif, chevron, 3 fourchettes, médiane, disque, barre `aria-hidden`) ; infobulle `rawRange` de l'élément prix absente (`title="fourchette centrale…"` seulement) ; zones absentes avant clic | infobulle rawRange manquante ; FV-02 | écart non consigné (mineur) ; FV-02 |
| `EX-SCR-113bis` | B | **NON COUVERTE** | journal P4-B : `/marche/54-opel/0-modele-non-identifie` rend l'écran B **normal** : aucun bandeau « Ces annonces n'ont pas pu être rattachées… », les 14 graphes rendus (G5/G6/G8/G10/G14 compris), `Comparer` actif | mode restreint non implémenté | écart non consigné (FV-08) |
| `EX-SCR-114` | B | **PARTIELLE** | les trois lignes de fourchette et l'effectif sont présents (sonde D6 `structure-a11y`) ; mais pour `n ≤ 11` les trois fourchettes valent « — » (HTML observé T-Roc/Touran, `view-model.ts` l.88-89 : tiers `trop-faible` **et** `reduite` → `—`) au lieu de min–max + jeton `n = <n>` (D-36) | contenu « — » au lieu de min–max | écart non consigné (FV-09) |
| `EX-SCR-115` | B | **COUVERTE** | `coverage.test › coverageDiscLevel/shouldItalicizeRanges` ; observé disque remplacé par « — » avec `title="couverture d'échantillon indisponible"` (NON_APPLICABLE sous filtre) | — | — |
| `EX-SCR-116` | B | **COUVERTE** | `view-model.test › EX-SCR-116 (listingCount = 0)`, sonde patho `VOL-00` (jamais « 0 – 0 € ») | — | — |
| `EX-SCR-117` | B | **COUVERTE** | sonde D6 `ModelZone — bande entière cliquable` ; journal P1b-3 : clic sur la zone → écran B, filtres conservés | — | — |
| `EX-SCR-118` | B | **PARTIELLE** | case observée (`input[type=checkbox] aria-label="Comparer Golf"`), plafond 4 (`MAX_COMPARE`), clé 0 exclue (`compare-selection.test`) ; case imbriquée dans un `role="button"` → `nested-interactive` (axe, 120 nœuds) | structure a11y non conforme | écart non consigné (FV-16) |
| `EX-SCR-119` | B | **COUVERTE** | `sort.test › tri total et déterministe (EX-SCR-119)` ; ordre observé VW 267 > Mercedes 210 > Audi 196 | — | — |
| `EX-SCR-120` | B | **COUVERTE** | sonde D6 `tri › exactement quatre options` ; observé « Nombre d'offres / Prix médian / Alphabétique / Nombre de modèles ↓ » | — | — |
| `EX-SCR-121` | B | **COUVERTE** | `sort.test › compareModelRows`, sonde D6 `modele-non-identifie › clé 0 toujours en dernier` ; observé Golf 61 > Polo 29 > Passat 21 | — | — |
| `EX-SCR-122` | B | **PARTIELLE** | `view-model.test › EX-SCR-122 (6 puis repli ; 7 sans repli)` vert ; en production le seul chemin d'affichage déplie tout (68 zones), le repli à 6 n'est jamais rendu (journal P1b-2) | repli à 6 inopérant dans la coquille | écart non consigné (FV-02) |
| `EX-SCR-123` | B | **PARTIELLE** | bouton « − Réduire à 6 modèles » présent en état déplié (`MakeCard.tsx`) ; état déplié non encodé dans l'URL (`mk` absent, journal P1b-2) | `mk` non encodé | écart non consigné (FV-17) |
| `EX-SCR-124` | B | **PARTIELLE** | champ de recherche de modèle observé « 68 modèles sur 68 » (règle 2) ; virtualisation au-delà de 30 zones (règle 3) et hauteur 480 px non observées (`view-model.test` ne teste que le drapeau) | règles 1 et 3 non vérifiées au rendu | campagne 2.9 |
| `EX-SCR-124bis` | B | **COUVERTE** | sonde D6 `MAKE_COUNT_WARNING_THRESHOLD === 60`, patho `VOL-CARTE` ; 20 cartes sans filtre observées | — | — |
| `EX-SCR-125` | B | **COUVERTE** | journal P1-0 : 20 cartes, bandeau « 294 marques dans le snapshot — 20 affichées, triées par nombre d'offres » + `Afficher les 294 marques`, amorce et 4 raccourcis au libellé exact | — | — |
| `EX-SCR-126` | B | **NON COUVERTE** | journal P5-B : amorce absente après un raccourci, **réapparaît** après « Tout effacer » dans la même session (`primerAfterClear: true`) | amorce répétitive | écart non consigné (FV-17) |
| `EX-SCR-127` | B | **PARTIELLE** | `thresholds.test › shouldVirtualizeGrid (seuil 40)` ; virtualisation réelle et 60 img/s non observées (36 cartes chargées par lots) | non vérifié au rendu | campagne 2.9 |
| `EX-SCR-128` | B | **COUVERTE** | `view-model.test › EX-SCR-128`, `thresholds.test › isSparseModel` ; case observée, défaut inactif | — | — |
| `EX-SCR-129` | B | **COUVERTE** | observé « 36 marques sur 112 · Charger 12 marques de plus » ; sonde D6 `GridFooter — bouton explicite` | — | — |
| `EX-SCR-130` | B | **COUVERTE** | sonde D6 `ET-CHARGE-INIT (EX-SCR-23/130)` (6 cartes squelettes, barre « — marques · — modèles · — offres ») | — | — |
| `EX-SCR-131` | B | **COUVERTE** | sondes D6 `R-D6-01 — EX-SCR-131` (corrigée), `sortDisabled … infobulle normative` | — | — |
| `EX-SCR-132` | B | **COUVERTE** | sonde D6 `R-D6-07 — EX-SCR-132 (DR-011, CORRIGÉ)` ; `view-model.test` | — | — |
| `EX-SCR-133` | B | **COUVERTE** | sonde D6 `EX-SCR-133 — état partial`, `state.test` | — | — |
| `EX-SCR-134` | B | **PARTIELLE** | `thresholds.test › modelZoneMedianDisplay`, `view-model.test › médiane par palier` verts ; mais pour `5 ≤ n ≤ 11` min/max ne sont pas affichés (« — », journal P2c-5) et le jeton `n = 10` n'apparaît pas dans le DOM | contenu du palier `reduite` non conforme à D-04/D-36 | écart non consigné (FV-09) |
| `EX-SCR-135` | B | **PARTIELLE** | sondes D6 `responsive › repli à 4`, `SummaryBar compact (DR-072 corrigé)`, `zone 96 px` ; grille 4 lignes en compact = dette | grille 4 lignes absente | dette motivée D-40 (DR-143) |
| `EX-SCR-136` | B | **COUVERTE** | sonde D6 `responsive › 768 px (2 col.)` ; `market.css` | — | — |
| `EX-SCR-137` | B | **COUVERTE** | sonde D6 `responsive › 1280 px (3 col.), 1680 px (4 col.)` | — | — |
| `EX-SCR-138` | B | **PARTIELLE** | sonde D6 `structure-a11y › les trois fourchettes et l'effectif … ne se masquent jamais` (composant) ; en production les zones ne sont pas rendues avant clic (journal P5-A : 0 zone) | fourchettes invisibles par défaut | écart non consigné (FV-02) |
| `EX-SCR-139` | B | **COUVERTE** | observé `document.title` « KYCAR — Distribution d'un modèle · Opel Corsa », route `/marche/54-opel/1918-corsa` | — | — |
| `EX-SCR-140` | B | **COUVERTE** | journal P3-D4 : `/marche/54-opell/1918-corsaa` → `/marche/54-opel/1918-corsa` (identifiant fait foi, slug canonisé) ; sondes D5 `EX-SCR-140`, D8 `R-D8-16` corrigée | — | — |
| `EX-SCR-141` | B | **COUVERTE** | sonde D7 `EX-SCR-141 : quatre blocs` ; observé en-tête + 3 histogrammes + G4 pleine largeur + grille additionnelle | — | — |
| `EX-SCR-142` | B | **PARTIELLE** | trois lignes observées (« 1352 offres · médiane 25 100 € · P25 · P75 · min 2 500 € – max 2 812 600 € (du moins cher au plus cher) », « km médian · 1ʳᵉ immat. médiane · % particuliers », 4 boutons) ; à la **première entrée** la part de particuliers vaut « 0 % » (tampon détaché, FV-01), « 35 % » après recalcul | valeur fausse à la première entrée | écart non consigné (FV-01) |
| `EX-SCR-143` | B | **COUVERTE** | sonde D7 `G1–G3 — somme des barres et sentinelles (EX-SCR-143)` ; observé « Offres par prix (1246) / kilométrage (1332) / année (1337) » ≤ 1352 avec exclusions | — | — |
| `EX-SCR-144` | B | **COUVERTE** | sonde D7 `EX-SCR-144/191 : les 14 graphes rendus dans l'ordre normatif` ; ordre observé conforme | — | — |
| `EX-SCR-145` | B | **COUVERTE** | sondes D7 `histogrammes` (`R-D7-03` corrigée : étiquettes d'axe X) ; observé bins de débordement en inégalité | — | — |
| `EX-SCR-146` | B | **COUVERTE** | G2 sur `BIN(V_mileage)` : sonde D4 BIN + observé « 0 km – 20 000 km · 218 offres » | — | — |
| `EX-SCR-147` | B | **COUVERTE** | G3 sur `BIN(V_year, {1}, 24, 0)` : observé « −∞ – 2001 · 9 offres », « 2001 – 2002 · 5 offres » | — | — |
| `EX-SCR-148` | B | **COUVERTE** | sonde D7 `EX-SCR-148 : une barre d'effectif 1 face à 100 000 mesure au moins 1 px` | — | — |
| `EX-SCR-149` | B | **PARTIELLE** | clic sur une barre : journal P3-A (« 10 500 € à 11 000 € : 6 offres » → `pricefrom=10500&priceto=10999` → 6 offres) ; `histogram-model.test › bucketToIntervalFilters` ; infobulle avec médiane du bucket (GROUPSTAT) non observée ; brossage horizontal, `Ctrl`+clic, double-clic absents (`grep dblclick\\|ctrlKey Histogram.tsx` = 0) | interactions secondaires absentes | écart non consigné (FV-18) |
| `EX-SCR-150` | B | **COUVERTE** | sondes D7 `histogrammes › n = 1`, `R-D7-01`, `R-D7-02` (corrigées) | — | — |
| `EX-SCR-151` | B | **PARTIELLE** | deux projections commutables (sonde D7 `EX-SCR-151`, onglets observés « Nuée empilée / Prix × année ») ; nuage vide à la première entrée (FV-01) | FV-01 | écart non consigné (FV-01) |
| `EX-SCR-152` | B | **COUVERTE** | sonde D7 `EX-SCR-152 : la variante par défaut bascule à 400 annonces, l'URL prime` | — | — |
| `EX-SCR-153` | B | **PARTIELLE** | axes linéaires, aucune échelle log dans G4 ; alignement « mêmes bornes et buckets que G1 » pour G4a non retrouvé dans `ScatterCloud.tsx`/`scatter-model.ts` (`grep buckets` = 0) | alignement G4a/G1 non prouvé | écart non consigné (mineur) |
| `EX-SCR-154` | B | **COUVERTE** | `scatter-model.test › rampe couleur (EX-SCR-154)` ; sonde D7 `légendes` | — | — |
| `EX-SCR-155` | B | **COUVERTE** | `scatter-model.test › encodage taille` ; sonde D7 `R-D7-21` corrigée (trois disques témoins) | — | — |
| `EX-SCR-156` | B | **COUVERTE** | légende observée « Kilométrage 0 km – 199 900 km · Taille puissance (kW) — sinon taille fixe, taille non porteuse d'information » | — | — |
| `EX-SCR-157` | B | **COUVERTE** | sondes D7 `R-D7-05 — CORRIGÉ (D-08)`, `R-D7-15` ; rendu canvas observé | — | — |
| `EX-SCR-158` | B | **PARTIELLE** | boutons `+`/`−`/`Réinitialiser` observés ; `Maj`+glisser (`R-D7-13`), infobulle et clic sortant (`R-D7-23`), bouton + lien (`R-D7-11`, D-26) corrigés et sondés ; `window.open(…, 'noopener')` observé depuis G8 ; à la **première entrée** le nuage n'a aucun point donc aucune interaction (FV-01) | FV-01 | écart non consigné (FV-01) |
| `EX-SCR-158bis` | B | **COUVERTE** | infobulle observée « écart calculé sur : Opel Corsa · n = 1089 · score : écart au prix attendu (M2) » ; `cellLevel` publié (DR-030) | — | — |
| `EX-SCR-159` | B | **NON COUVERTE** | `grep "Sélection inutile\\|n < 8" src/screens/distribution` = 0 : aucune légende discrète ni désactivation du brossage sous 4 offres | petits effectifs de G4 non traités | écart non consigné (FV-18) |
| `EX-SCR-160` | B | **COUVERTE** | sonde D7 `R-D7-25 — EX-SCR-160` (corrigée) ; note « année non renseignée sur les n offres » | — | — |
| `EX-SCR-161` | B | **PARTIELLE** | G5 rendu (table « Classe / n / Prix médian », médiane/P25/P75 via GROUPSTAT) ; vide à la première entrée (FV-01) ; clic → `fregfrom = fregto` non observé | FV-01 | écart non consigné (FV-01) |
| `EX-SCR-162` | B | **COUVERTE** | G6 observé avec le message normatif exact « Dépréciation non calculable — il faut au moins 3 années comptant chacune 5 offres » ; `graphs-model.ts` (base 100 publiée) | — | — |
| `EX-SCR-163` | B | **COUVERTE** | G7 observé : « Densité non calculable en dessous de 40 offres — voir la nuée ci-dessus » ; `graphs-model.test › G7` | — | — |
| `EX-SCR-164` | B | **PARTIELLE** | G8 observé : 20 sucettes triées par écart décroissant, méthode « (M2) » et cellule en infobulle, clic sortant ; libellé normatif « Modèle : ln(prix) ~ … n = <\|F\|>, R² = <R²> » et avertissement `R² < 0,30` absents (`grep "ln(prix)" src/screens/distribution` = 0) ; vide à la première entrée (FV-01) | libellé et R² absents ; FV-01 | écart non consigné (FV-10, FV-01) |
| `EX-SCR-165` | B | **PARTIELLE** | G9 observé « Essence 467 · 43 % · 26 800 € … » (`graphs-model.test`) ; vide à la première entrée (FV-01) | FV-01 | écart non consigné (FV-01) |
| `EX-SCR-166` | B | **PARTIELLE** | G10 rendu (`AdditionalGraphs.tsx` l.305, tranches NTILE) ; boîtes et points cliquables non observés en détail ; vide à la première entrée (FV-01) | FV-01 | écart non consigné (FV-01) |
| `EX-SCR-167` | B | **PARTIELLE** | G12 avec la note obligatoire « Évaluation calculée par AutoScout24, méthode non publiée. » (`DistributionScreen.tsx` l.381) ; vide à la première entrée (FV-01) | FV-01 | écart non consigné (FV-01) |
| `EX-SCR-168` | B | **PARTIELLE** | G13 observé « Professionnel 701 · 64 % · 26 750 € / Particulier 388 · 36 % · 29 225 € » ; écart de médiane entre les deux non affiché ; vide à la première entrée | écart de médiane absent ; FV-01 | écart non consigné (FV-01) |
| `EX-SCR-169` | B | **COUVERTE** | G14 « Prix médian par puissance » rendu (paliers 20 kW, `EX-DATA-83quater`) | — | — |
| `EX-SCR-170` | B | **PARTIELLE** | G15 rendu **alors qu'un seul pays** est présent (doit être absent du DOM) ; vide à la première entrée | condition d'affichage non respectée | écart non consigné (FV-18) |
| `EX-SCR-171` | B | **PARTIELLE** | effectifs présents dans les tables équivalentes (G5 : colonne n ; G9/G13 : effectifs) ; infobulles de chaque élément tracé non vérifiées | non vérifié au rendu | campagne 2.9 |
| `EX-SCR-172` | B | **COUVERTE** | documentaire : aucun des graphes écartés n'est rendu (14 titres observés = liste normative) ; CO₂/consommation en colonnes de l'écran D | — | dette DR-147 (mention à l'utilisateur, §6.5) |
| `EX-SCR-173` | B | **NON COUVERTE** | entrée en mode 2 : texte « Chargement des distributions… » (`aria-busy`) au lieu des squelettes aux dimensions des blocs (`app.tsx::renderMode2`) | squelette absent | écart non consigné (FV-18) |
| `EX-SCR-174` | B | **PARTIELLE** | en-tête « aucune offre » et bloc `EX-SCR-26` sur B non observés (aucune sélection à zéro atteignable simplement : `pricefrom=4900000` rend encore 3 offres) ; aucun test ne le couvre | non vérifié | à sonder en 2.8 |
| `EX-SCR-175` | B | **NON COUVERTE** | aucune ligne « Représentativité de l'échantillon non prouvée — lire Pourquoi ? » sur B (journal P2-1 ; `grep Représentativité src` = 0) | avertissement obligatoire absent | écart non consigné (FV-07) |
| `EX-SCR-176` | B | **PARTIELLE** | les 14 graphes sont dérivés d'un seul `RecalcResult` (une transaction) ; aucune empreinte par graphe en attribut (`grep data-selection src/screens/distribution` = 0), cadre « Calcul impossible » non observé | empreinte non exposée | écart non consigné (FV-18) |
| `EX-SCR-177` | B | **PARTIELLE** | seuil 20 000 inatteignable sur le jeu (cellule max 2 008) ; G4 hors périmètre (D-08) vérifié par sonde D7 | non exerçable | — |
| `EX-SCR-178` | B | **NON COUVERTE** | `GraphFrame.tsx` l.67 sait rendre « <k> annonces exclues (<motif>) » mais aucune note n'apparaît sous G1–G3 (journal P2-1 : `notes: []` alors que 1352 − 1246 = 106 prix exclus) | notes d'exclusion non alimentées | écart non consigné (FV-11) |
| `EX-SCR-179` | B | **COUVERTE** | `distribution.css` l.34-39 (3 colonnes G1–G3, 2 colonnes additionnels) ; capture P2-1 à 1 280 px | — | — |
| `EX-SCR-180` | B | **PARTIELLE** | `distribution.css` l.181-184 (2 colonnes en intermédiaire) ; G4 400 px et légendes dessous non vérifiés | non vérifié au rendu | campagne 2.9 |
| `EX-SCR-181` | B | **PARTIELLE** | `distribution.css` l.192 (1 colonne) ; brossage désactivé en compact (`degraded={regime === 'compact'}`, sonde D7 `EX-NFR-19`) ; appui long, G8 à 10, G7 masqué non vérifiés | partiellement vérifié | campagne 2.9 |
| `EX-SCR-182` | B | **PARTIELLE** | G1–G4 et bandeau présents à tous les régimes (CSS) ; C3 et avertissement de représentativité absents de B (FV-07) | FV-07 | écart non consigné (FV-07) |
| `EX-SCR-183` | B | **COUVERTE** | `overflow-x: auto` (`app.css` l.222, `listings.css` l.49) ; journal P1b-6 : `scrollWidth` = `innerWidth` = 360 (aucun défilement horizontal du corps) | — | — |
| `EX-SCR-184` | B | **COUVERTE** | sondes D7 `EX-SCR-184 : le brossage ne modifie aucun agrégat`, `R-D7-12` (corrigée), `brush-model.test › brushToIntervalFilters` | — | — |
| `EX-SCR-185` | B | **COUVERTE** | sonde D7 `le compteur « <n> annonces sélectionnées » apparaît quand un brossage est actif` | — | — |
| `EX-SCR-186` | B | **PARTIELLE** | rampes A/B (`scatter-model`), palette qualitative (`CategoricalBars`) ; unicité des palettes non vérifiée par test | non vérifié | campagne 2.9 |
| `EX-SCR-187` | B | **COUVERTE** | `Exporter` en ligne 3 de l'en-tête B et dans la barre de synthèse A (observés) ; désactivé en `partialCache`/chargement (`MarketScreen.tsx`) | — | — |
| `EX-SCR-188` | B | **COUVERTE** | sonde D7 `EX-NFR-15 / EX-SCR-188 : chaque graphe porte un tableau équivalent` ; observé 12 tables pour 14 figures (G6/G7 en cadre « non calculable »), bouton « Voir les données » | — | — |
| `EX-SCR-189` | B | **COUVERTE** | sonde D7 `EX-SCR-189 : construction des modèles des 14 graphes ≤ 300 ms pour n = 20 000` | — | — |
| `EX-SCR-190` | B | **PARTIELLE** | surbrillance par classes/opacité (`brush-model`) ; absence de redessin au survol non mesurée | non mesuré | campagne 2.9 |
| `EX-SCR-191` | B | **COUVERTE** | 14 titres observés identiques au texte normatif, effectif entre parenthèses quand il diffère (« Offres par prix (1246) ») | — | — |
| `EX-SCR-192` | B | **COUVERTE** | documentaire : aucun G11 rendu (liste observée) | — | — |
| `EX-SCR-193` | B | **COUVERTE** | documentaire (justification de l'écran C) ; écran C livré | — | — |
| `EX-SCR-194` | B | **PARTIELLE** | route observée `/comparer?m=54-1918,74-2084` (D-13), écrêtage à 4 signalé (`app.tsx`) ; redirection 1 → B / 0 → A absente (`grep redirect src/screens/compare src/app.tsx` = 0) | redirections absentes | écart non consigné (FV-15) |
| `EX-SCR-195` | B | **COUVERTE** | `structure.test` (échelle commune) ; observé « Prix superposés (G5, échelle commune) » ; sonde D8 `R-D8-19` corrigée | — | — |
| `EX-SCR-196` | B | **PARTIELLE** | quatre rangées observées (G1, G3, G5 superposé, Synthèse) ; la polyline de G5 porte des coordonnées `NaN` (3 erreurs console, journal P4-D1) | G5 superposé défectueux | écart non consigné (FV-15) |
| `EX-SCR-197` | B | **NON COUVERTE** | aucun bloc « + Ajouter un modèle » (journal P3-C5 ; `grep "Ajouter un modèle" src` = 0) | colonne vide non implémentée | écart non consigné (FV-15) |
| `EX-SCR-198` | B | **PARTIELLE** | bouton `Retirer` par colonne observé ; redirection vers B sous 2 modèles absente | redirection absente | écart non consigné (FV-15) |
| `EX-SCR-199` | B | **PARTIELLE** | responsive de l'écran C non vérifié (aucune règle spécifique retrouvée) | non vérifié | campagne 2.9 |
| `EX-SCR-200` | B | **COUVERTE** | sonde D8 `R-D8-18 — ET-VIDE-FILTRES écran C` (corrigée) ; colonnes en erreur indépendantes (`app.tsx` : `status: 'error'` par colonne) | — | — |
| `EX-SCR-201` | B | **COUVERTE** | documentaire + `window.open('https://www.autoscout24.be/fr/annonce/opel-corsa/62147', '_blank', 'noopener')` observé (journal P4-A) | — | — |
| `EX-SCR-202` | B | **COUVERTE** | observé « 6 lignes affichées sur 6 de la sélection — écarts calculés sur les 6 » ; sonde D7 `R-D7-26` (corrigée) ; lien « Voir ces annonces » → `sel` (D-26) | — | — |
| `EX-SCR-203` | B | **PARTIELLE** | 15 colonnes observées dans l'ordre (Version, Prix, Écart attendu, Km, 1ʳᵉ immat., Année-mod., Puissance, Carburant, Conso., CO₂, Propr., Éval. AS24, Vendeur, Pays, Lien) ; `TVA` absente (dette D-38) ; « Pays / CP » sans `NNxx` (D-14) ; jeton `!` (`R-D7-17` corrigée) ; **écran D inaccessible en accès direct** (FV-01) | colonne TVA ; FV-01 | dette motivée D-38 (DR-082) ; FV-01 |
| `EX-SCR-204` | B | **COUVERTE** | sonde D7 `EX-SCR-204 : aucun des cinq noms de champ interdits dans le code de l'écran D` | — | — |
| `EX-SCR-205` | B | **COUVERTE** | documentaire ; aucune image (`grep imageUrl` = 0), bouton « Ouvrir ↗ » observé | — | — |
| `EX-SCR-206` | B | **COUVERTE** | sonde D7 `ecran-d › tri (EX-SCR-206)` ; observé « Tri : prix croissant (aucun score d'opportunité) » quand tous les scores sont nuls | — | — |
| `EX-SCR-207` | B | **COUVERTE** | `ListingsScreen.tsx` l.97-190 : P10 des écarts sur tout le périmètre, liseré + infobulle d'étiquetage | — | — |
| `EX-SCR-208` | B | **COUVERTE** | journal P5-E : 50 lignes/page, « page 2 / 26 », `page=2` dans l'URL en `replaceState` (retour arrière → écran B) ; sonde D7 `EX-SCR-208` | — | — |
| `EX-SCR-209` | B | **NON COUVERTE** | `grep -n "compact\\|regime" src/screens/listings/ListingsScreen.tsx` = 0 : aucun mode intermédiaire ni liste de cartes en compact | responsive de D absent | écart non consigné (FV-19) |
| `EX-SCR-210` | B | **PARTIELLE** | `ET-CHAMP-MANQUANT` par cellule observé ; `ET-VIDE-FILTRES`, squelette 12 lignes et libellé C3 « listables » non observés/implémentés (C3 absent des écrans B/D) | états incomplets | écart non consigné (FV-07) |
| `EX-SCR-211` | B | **COUVERTE** | documentaire ; écran E livré | — | — |
| `EX-SCR-212` | B | **PARTIELLE** | cartes observées (nom, « Mode 1 · 2 656 offres à la création · créée le … », effectif actuel, Renommer, Supprimer) et panneau « Recherches récentes » + « Vider l'historique » ; ouverture par le titre, pas de bouton `Ouvrir` nommé ; description des filtres et périmètre non affichés | éléments de carte manquants | écart non consigné (mineur) |
| `EX-SCR-213` | B | **COUVERTE** | journal P3-C3 : effectif actuel recalculé (« 2 656 offres actuellement »), écart masqué car même snapshot (jamais « + 0 ») ; sonde D8 `R-D8-20` corrigée | — | — |
| `EX-SCR-214` | B | **COUVERTE** | sonde D8 `écran E (EX-SCR-212…214)` ; confirmation inline « Supprimer ? » (`role=alert`) ; état vide avec bouton « Aller au survol du marché » | — | — |
| `EX-SCR-214bis` | B | **COUVERTE** | journal P3-C4 : « Modèles suivis (1 / 30 modèles suivis) · Opel Corsa suivi depuis le … · 1 352 offres actuellement · Ne plus suivre » ; sonde D8 `écran F` (R-D8-21 corrigée) | — | — |
| `EX-SCR-215` | B | **COUVERTE** | sonde D5 `EX-SCR-215/216 : écran G à l'échelle réelle (295 marques, 4 955 modèles)` ; modale ouverte observée (journal P1-3) | — | — |
| `EX-SCR-216` | B | **PARTIELLE** | structure, recherche insensible aux diacritiques, piège de focus, fenêtrage, états vides (sondes D5, R-D5-25/26) ; **effectifs « — » et tri alphabétique** en production : `counts` jamais fourni par `FilterBand`/`MarketScreen` (journal P1-3 « 9ff — Abarth — AC — ») | effectifs par entrée absents | écart non consigné (FV-05) |
| `EX-SCR-217` | B | **COUVERTE** | documentaire ; indicateur de couverture (EX-SCR-115) et « Fourchettes indisponibles » (EX-SCR-116) implémentés | — | — |
| `EX-SCR-218` | B | **PARTIELLE** | aucun G16, aucune dérivation par regex (`grep gearbox src/screens` = 0) ; alternative (b) non documentée dans le panneau Diagnostic | documentation Diagnostic absente | écart non consigné (FV-21) |
| `EX-SCR-219` | B | **COUVERTE** | `adage` exclu (`filters-scope.json`), aucune colonne « Vue le », tri `age` absent des options de l'écran D | — | — |
| `EX-SCR-220` | B | **COUVERTE** | Conso./CO₂ affichées (écran D) et jamais filtrables ; aucun graphe dédié (14 titres observés) | — | — |
| `EX-SCR-221` | B | **PARTIELLE** | `body` en classe `DYNAMIC_BODY` (R mode 1 / T mode 2, sonde D5 `EX-SCR-82 #44`) ; `bodyTypes` vide sur tous les modèles (O15) ; note « <k> modèles sans carrosserie renseignée » absente | O15 + note absente | point ouvert O15 (externe) ; note : écart non consigné |
| `EX-SCR-222` | B | **COUVERTE** | documentaire ; aucune vue infranationale rendue | — | — |
| `EX-SCR-223` | B | **COUVERTE** | sonde D5 `EX-SCR-85` (icône `(?)`) ; `prevownersid` n'alimente aucun graphe (14 titres) | — | — |
| `EX-SCR-224` | B | **NON COUVERTE** | panneau Diagnostic sans liste de blocs supprimés (`grep "champ absent\\|EX-SCR-218" src` = 0 hors CSV) | critère « ≥ 3 entrées » non atteint | écart non consigné (FV-21) ; dette DR-147 voisine |

### 2.3 Annexe C — `EX-NAV-*`, `EX-SRCH-*`, `EX-CRUD-*`, `EX-NFR-*`

| Identifiant | Annexe | Statut | Preuve d'exécution | Écart nommé | Dette / décision |
|---|---|---|---|---|---|
| `EX-NAV-1` | C | **COUVERTE** | sondes D5 `router › les cinq routes nommées`, D8 `routing › les 6 routes + /mentions` ; `/marche` observé | — | — |
| `EX-NAV-2` | C | **COUVERTE** | idem ; `/marche/54-opel/1918-corsa` observé ; slug cosmétique canonisé (journal P3-D4) | — | — |
| `EX-NAV-2bis` | C | **COUVERTE** | `/marche/54-opel/1918-corsa/annonces` observé (journal P3-B, P5-E) ; sonde D5 `router` | — | — |
| `EX-NAV-2ter` | C | **COUVERTE** | `/comparer?m=54-1918,74-2084` observé ; sonde D8 `routing` | — | — |
| `EX-NAV-3` | C | **COUVERTE** | `/recherches` observé (journal P3-C3) ; sonde D5 `router` | — | — |
| `EX-NAV-4` | C | **COUVERTE** | `/suivis` observé (journal P3-C4) ; DR-053 (sixième route) | — | — |
| `EX-NAV-5` | C | **COUVERTE** | sonde D5 `registre vs filters-scope.json (EX-NAV-5)` ; aucun paramètre `make` (`grep "param: 'make'" src/state` = 0) ; `mmmv` seul (D-09) | — | — |
| `EX-NAV-6` | C | **COUVERTE** | `url-codec.test › joint les valeurs multiples par une seule virgule, triées (EX-NAV-6)` ; observé `fuel=Z,B` | — | — |
| `EX-NAV-7` | C | **COUVERTE** | `url-codec.test › deux paramètres jumeaux, bornes non posées omises` ; bornes inclusives et année entière : clic de barre `priceto=10999` (journal P3-A), `fregfrom=2017&fregto=2017` → 54 offres = vérité terrain (sonde D8) | — | — |
| `EX-NAV-8` | C | **COUVERTE** | sondes D5 `EX-NAV-8 — une valeur par défaut n'est jamais émise`, `tr-split`, `url-codec.test`, D7 `url-etat` | — | — |
| `EX-NAV-9` | C | **COUVERTE** | sondes D5 `EX-NAV-9 — l'ordre canonique ne dépend pas de l'ordre de pose`, `url-codec.test` ; observé `?body=3&kmto=100000&mmmv=74\|2084&priceto=20000` | — | — |
| `EX-NAV-10` | C | **COUVERTE** | `url-codec.test › plafond de longueur (EX-NAV-10/11)` ; `filter-registry.test › equipment porte ses 136 valeurs` | — | — |
| `EX-NAV-10bis` | C | **COUVERTE** | sondes D5 `url-budget › EX-NAV-10bis`, D7 `url-etat`, `corrections.test` ; observé `page=2` en `replaceState`, `m=54-1918,74-2084` | — | — |
| `EX-NAV-11` | C | **COUVERTE** | sondes D5 `EX-NAV-11 — un état plus large que le plafond est refusé, avec son message`, patho `SOL-REFUS` ; bandeau `onUrlBudgetExceeded` câblé (`app.tsx`) | — | — |
| `EX-NAV-12` | C | **COUVERTE** | sondes D5 `interaction-history › EX-NAV-12/13/14`, `interaction.test` ; journal P1b-5 : retour arrière restaure l'écran B | — | — |
| `EX-NAV-13` | C | **COUVERTE** | sonde patho `SOL-RAFALE-HISTORIQUE — UNE entrée d'historique, pas vingt` ; `interaction.ts` l.51 (800 ms) | — | — |
| `EX-NAV-14` | C | **COUVERTE** | sondes D5 `EX-NAV-14 — forcePush`, `interaction.test` ; changement de route observé en `pushState` (journal P1b-5) | — | — |
| `EX-NAV-15` | C | **COUVERTE** | `router.test › carryFiltersAcrossMode (D-09, EX-NAV-15/16/17)` ; journal P1b-3 : A → B conserve `body/kmto/priceto`, `mmmv` absent de l'URL de B | — | — |
| `EX-NAV-16` | C | **PARTIELLE** | journal P1b-4 : le fil d'Ariane B → A réinjecte `mmmv=74\|2084` (couple complet) et l'écran A se restreint au seul Golf (« 1 marques · 61 offres ») ; le texte v1.1 exige `<makeId>\|\|\|` (marque seule) — `router.ts` l.327-328 sérialise `make\|model` quand `modelId` est fourni | bloc réinjecté = modèle au lieu de la marque | écart non consigné (FV-04) |
| `EX-NAV-17` | C | **COUVERTE** | `router.test › carryFiltersAcrossMode` (changement de couple, filtres conservés, `mmmv` absent) | — | — |
| `EX-NAV-18` | C | **COUVERTE** | sondes D5 `EX-NAV-18`, D8 `routing › fonction pure`, D7 `url-etat › aller-retour` ; journal P2-2 : URL `…?fregfrom=2017&fregto=2017` ouverte à froid → 54 offres, identique à la saisie par le bandeau (P2-2bis) | — | — |
| `EX-NAV-19` | C | **COUVERTE** | journal P3-D5 : « Marque inconnue — La marque « 999999 » ne figure pas dans le référentiel… Revenir au marché (vos filtres sont conservés) » ; sondes D5/D8 (R-D8-14 corrigée) | — | — |
| `EX-NAV-20` | C | **COUVERTE** | journal P3-D6 : « Ce modèle n'existe pas pour cette marque… », lien `/marche?priceto=20000` ; `modelId = 0` accepté (P4-B) — mode restreint : voir EX-SCR-113bis | — | — |
| `EX-NAV-21` | C | **PARTIELLE** | les cinq classes corrigent (sondes D5 `url-corrections`, patho `ST-ARB11`, observé : `kmfrom/kmto` permutés, `fuel=Z` retiré, `priceto` écrêté à 100 000) ; mais **aucun `replaceState` ni bandeau** dans la coquille (journal P3-D1 : URL fautive conservée telle quelle, aucun bandeau) | signalement et réécriture absents à l'exécution | écart non consigné (FV-03) |
| `EX-NAV-22` | C | **PARTIELLE** | permutation au chargement observée (« Kilométrage : 1 000 km – 100 000 km ») et sondes D5 ; bandeau ET-URL-CORRIGEE absent (FV-03) | signalement absent | écart non consigné (FV-03) |
| `EX-NAV-23` | C | **PARTIELLE** | un seul snapshot actif, aucune acquisition automatique (`DataController`, sonde D4 `lru-cache › loadDataset vide le cache (EX-NAV-23)`) ; action explicite `Rafraîchir` du jeton de snapshot absente (`grep Rafraîchir src` = 0) | action de remplacement absente | écart non consigné (FV-21) |
| `EX-NAV-24` | C | **COUVERTE** | sonde D8 `R-D8-26 — EX-NAV-24` (corrigée) ; `onReload` purge la sélection de comparaison et libère le moteur (`app.tsx`) | — | — |
| `EX-NAV-25` | C | **NON COUVERTE** | `grep -rn "Nouvelles données" src` = 0 | bandeau après remplacement absent | écart non consigné (FV-21) |
| `EX-SRCH-1` | C | **COUVERTE** | `debounce-policy.test › EX-SRCH-1 — 0 ms` ; sonde D5 `EX-SRCH-1…8 : les délais chiffrés` | — | — |
| `EX-SRCH-1bis` | C | **COUVERTE** | sonde D5 `EX-SRCH-1bis : regroupement des rafales (3 en 300 ms, 200 ms de traîne)`, `interaction.test › RClassBurstCoordinator`, patho `ADV-12` | — | — |
| `EX-SRCH-2` | C | **COUVERTE** | `debounce-policy.test › EX-SRCH-2 — eq : 250 ms` | — | — |
| `EX-SRCH-3` | C | **COUVERTE** | `debounce-policy.test › EX-SRCH-3 — 150 ms au relâchement` ; listes de paliers observées | — | — |
| `EX-SRCH-4` | C | **COUVERTE** | `debounce-policy.test › EX-SRCH-4 — 500 ms` ; `Entrée` immédiate observée (D-19) | — | — |
| `EX-SRCH-5` | C | **COUVERTE** | `debounce-policy.test › EX-SRCH-5 — kwd : 400 ms` | — | — |
| `EX-SRCH-6` | C | **HORS PÉRIMÈTRE** | `zip` exclu du périmètre (D-14/D-37) ; `FILTER_BY_PARAM.get('zip')` indéfini (sonde D5 `EX-SCR-82`) | sans objet | décision D-37 |
| `EX-SRCH-7` | C | **HORS PÉRIMÈTRE** | `zipr` dépend de `zip` exclu (D-37) | sans objet | décision D-37 ; dette DR-132 (libellés) devient sans objet |
| `EX-SRCH-8` | C | **COUVERTE** | `debounce-policy.test › EX-SRCH-8 — immédiat` ; écran G `Appliquer` → navigation immédiate (`handleChange` `selection-immediate`) | — | — |
| `EX-SRCH-9` | C | **COUVERTE** | « Tout effacer » immédiat (journal P2c-3 : URL nettoyée, recalcul à 1 352 offres) | — | — |
| `EX-SRCH-9bis` | C | **COUVERTE** | sonde D5 `EX-SRCH-9bis : la scission T/R suit le registre` | — | — |
| `EX-SRCH-9ter` | C | **COUVERTE** | sondes D5 `EX-SRCH-9ter — un changement R ne change ni la localDatasetKey…`, `composante T vide = FULL` ; cache 4 entrées (`DataController`) | — | — |
| `EX-SRCH-9quater` | C | **PARTIELLE** | tout chiffre calculé sur le jeu local (sonde D8 `parcours` : `localDatasetKey ≠ FULL` en mode 2, Σ = cellule) ; le message C3 « Jeu de données restreint par <k> filtre(s) rechargé(s) — <n> annonces » n'existe que dans un commentaire (`tr-split.ts` l.39) et C3 est absent de B | message de périmètre absent | écart non consigné (FV-07) |
| `EX-SRCH-9quinquies` | C | **COUVERTE** | sonde D2 `selection-codec` (`FULL:EMPTY`), sonde D8 `parcours` (`hash=1dcd2e7b7780b20b:35a0c206ac32bfef`), LRU clefé par le couple (sonde D4 `lru-cache`) | — | — |
| `EX-SRCH-10` | C | **COUVERTE** | journal P1-1 : `body=3 ∧ kmto ∧ priceto` → 2 656 offres = comptage conjonctif de la vérité terrain (sonde D8 `parcours`) | — | — |
| `EX-SRCH-11` | C | **COUVERTE** | `predicates.test` (appartenance à l'ensemble des codes cochés) ; sonde patho `AMB-27 → ARB-35` (égalité stricte de code) | — | — |
| `EX-SRCH-11bis` | C | **COUVERTE** | `predicates.test › EX-SRCH-11bis — conversion d'unité avant évaluation` ; sonde patho `R-PATHO-15` (corrigée) | — | — |
| `EX-SRCH-12` | C | **PARTIELLE** | `eq` est de classe T sans colonne locale : son inapplication est signalée par `ET-FILTRE-NON-APPLIQUE` (D-03, sonde D8) ; la sémantique ET par défaut n'est donc jamais évaluée localement | non exerçable sur les sources actuelles | décision D-03 (signalement) — point O7 toujours ouvert |
| `EX-SRCH-13` | C | **COUVERTE** | documentaire (réserve) ; `sealor` en classe T, `pe_category` en R (registre) | — | — |
| `EX-SRCH-14` | C | **PARTIELLE** | écran G positionné sur le couple courant en mode 2 (EX-SCR-103) ; le comportement « changer de marque vide le modèle et redirige vers `/marche?mmmv=<make>\|\|\|` » n'est ni testé ni observé | non vérifié | à sonder en 2.8 |
| `EX-SRCH-15` | C | **HORS PÉRIMÈTRE** | `zip`/`zipr` exclus (D-14) | sans objet | décision D-14 |
| `EX-SRCH-16` | C | **COUVERTE** | `filter-registry.test › dépendances entre filtres (EX-SRCH-14..17)` ; conversion par la constante unique (`predicates.test`) ; `powertype` non exposé (D-15) donc jamais changé par l'utilisateur | — | — |
| `EX-SRCH-17` | C | **HORS PÉRIMÈTRE** | `bot`/`erfrom`/`erto` hors périmètre v1 (texte) ; présents en classe T secondaire sans comportement dépendant | sans objet | — |
| `EX-SRCH-18` | C | **COUVERTE** | sonde D5 `EX-SCR-77 / EX-SRCH-18` ; journal P2c-3 : route conservée après « Tout effacer » sur B | — | — |
| `EX-SRCH-18bis` | C | **COUVERTE** | sondes D5 `R-D5-04 — EX-SRCH-18bis` et patho `R-PATHO-14` (corrigées) : `atype`, `ustate`, `powertype`, `cy` non exposés, non sérialisés, non comptés (« 3 filtres actifs » avec `cy=B` dans l'URL) | — | dette produit D-15 (aucun contrôle « accidentés ») |
| `EX-SRCH-19` | C | **COUVERTE** | sonde D5 `R-D5-21 — EX-SRCH-19` (corrigée : bouton de réinitialisation par groupe) | — | — |
| `EX-SRCH-20` | C | **COUVERTE** | journal P2c-3 : « Tout effacer » sur `/marche/54-opel/1918-corsa` laisse la route intacte | — | — |
| `EX-SRCH-21` | C | **PARTIELLE** | l'effectif affiché (en-tête B, barre de synthèse A) est celui du recalcul appliqué (journal P3-A : 6 offres après clic de barre) ; le compteur de la zone (4) du bandeau n'est pas alimenté (FV-23) | compteur du bandeau absent | REMEDIATION §7.1 n° 1 (FV-23) |
| `EX-SRCH-22` | C | **PARTIELLE** | état « en cours » du compteur du bandeau non alimenté ; `aria-busy` sur l'écran A pendant le rechargement ; aucune atténuation observée | état intermédiaire non rendu | écart non consigné (FV-23, FV-18) |
| `EX-SRCH-23` | C | **COUVERTE** | écran D : tri par colonne (`R-D7` sondes, journal P3-B), pagination client de 50 (journal P5-E : « page 2 / 26 », 50 lignes) | — | — |
| `EX-SRCH-24` | C | **COUVERTE** | documentaire ; tri des cartes = `EX-SCR-120` (couvert) | — | — |
| `EX-SRCH-25` | C | **COUVERTE** | journal P1-0 : `/marche` sans filtre sert 294 marques · 100 000 offres | — | — |
| `EX-SRCH-26` | C | **COUVERTE** | sondes D5/D6 `seuil 60` ; observé « 112 marques correspondent — affinez pour comparer » (texte harmonisé T-t) ; raccourci vers les filtres discriminants non observé (mineur) | — | — |
| `EX-SRCH-27` | C | **COUVERTE** | sonde patho `VOL-200K` (200 000 annonces, aucun plafond de calcul) ; `test:perf` à 100 000 non filtré | — | — |
| `EX-CRUD-1` | C | **COUVERTE** | `persistence.test › recherches sauvegardées (EX-CRUD-1..6)` ; clé observée `kycar:saved-searches/<uuid> = {"schemaVersion":1,"id":…,"nom":…}` ; carte E « 2 656 offres à la création » (`effectifInitial`, `snapshotInitial` figés, DR-102) | — | — |
| `EX-CRUD-2` | C | **COUVERTE** | journal P3-C1 : « Recherche enregistrée (un nom identique existait déjà). » (avertissement non bloquant) ; `nom` vide refusé (`MarketToolbar`) | — | — |
| `EX-CRUD-3` | C | **COUVERTE** | `localStorage` seul (clés `kycar:*` observées) ; aucun appel réseau (journal : `externalRequests: []`) | — | — |
| `EX-CRUD-4` | C | **COUVERTE** | création sur A et B (« Enregistrer cette recherche » observé sur les deux, sonde D8 `R-D8-25` corrigée), renommage (`stores.saved.rename`), suppression inline sans corbeille (« Supprimer ? ») | — | — |
| `EX-CRUD-5` | C | **COUVERTE** | sondes D8 `plafonds de l'annexe C (EX-CRUD-5 / 10 / 12)`, `persistence.test › bloque la création au-delà de 50` | — | — |
| `EX-CRUD-6` | C | **COUVERTE** | sonde D8 `R-D8-25 — EX-CRUD-6` (corrigée : `store.touch`) ; ouverture par le titre de la carte | — | — |
| `EX-CRUD-7` | C | **COUVERTE** | `persistence.test › modèles suivis (EX-CRUD-7..10)` ; clé observée `kycar:followed-models/54:1918 = {"schemaVersion":1,"makeId":54,"modelId":1918,"ajouteLe":…}` | — | — |
| `EX-CRUD-8` | C | **COUVERTE** | idem (localStorage) | — | — |
| `EX-CRUD-9` | C | **COUVERTE** | bascule « Suivre / Ne plus suivre » observée dans l'en-tête B (journal P3-C4, P5-C) ; suppression depuis `/suivis` | — | — |
| `EX-CRUD-10` | C | **COUVERTE** | sonde D8 `plafonds` (30) ; en-tête observé « 1 / 30 modèles suivis » | — | — |
| `EX-CRUD-11` | C | **COUVERTE** | journal P3-C3 : panneau « Recherches récentes » avec les URL visitées ; `filterSignature` (DR-159 : seuls les changements de filtres) | — | — |
| `EX-CRUD-12` | C | **COUVERTE** | sondes D8 `plafonds (12)`, `persistence.test › historique récent (EX-CRUD-11..13)` | — | — |
| `EX-CRUD-13` | C | **COUVERTE** | bouton « Vider l'historique » seul (journal P3-C3), aucune suppression unitaire | — | — |
| `EX-CRUD-13bis` | C | **COUVERTE** | `compare-selection.test` (plafond 4, clé 0 exclue, doublons) ; onglet « Comparer (2) » après deux cases (journal P3-C2) ; `EX-NAV-24` purge | — | — |
| `EX-CRUD-14` | C | **COUVERTE** | `csv.test › BOM UTF-8, séparateur ;` ; `listings.test` | — | — |
| `EX-CRUD-15` | C | **COUVERTE** | `csv.test › une ligne par couple marque/modèle affiché` ; sonde D6 `EX-DATA-123bis` | — | — |
| `EX-CRUD-16` | C | **COUVERTE** | sonde D7 `EX-CRUD-16 : exactement deux exports` ; observé « CSV des annonces du périmètre / CSV des agrégats affichés » | — | — |
| `EX-CRUD-17` | C | **COUVERTE** | aucune entrée PNG/SVG (menu à deux entrées observé) | — | — |
| `EX-CRUD-18` | C | **COUVERTE** | sondes D8 `EX-CRUD-18 — schemaVersion et migration`, `persistence.test › schema / migration` | — | — |
| `EX-CRUD-19` | C | **COUVERTE** | sondes D8 `ADV-13 / EX-CRUD-19 — concurrence inter-onglets`, `persistence.test › relecture-vérification-écriture` ; clés observées : une par entrée + `#index` (D-16) | — | — |
| `EX-NFR-1` | C | **COUVERTE** | sonde D3 `EX-NFR-1 — empreinte mémoire ≤ 25 Mo` (17,19 Mio) ; fonctionnel à 10⁵ (`test:perf`), 10⁶ extrapolé (E4) | — | — |
| `EX-NFR-2` | C | **COUVERTE** | sonde D2 `reference-loader` : 295 marques, 4 955 modèles chargés ; écran G à l'échelle réelle (sonde D5) | — | — |
| `EX-NFR-3` | C | **COUVERTE** | sonde D3 `EX-NFR-3 — lot colonnaire sérialisé ≤ 6 Mo gzip` (5,45 Mio, D-42) | — | — |
| `EX-NFR-4` | C | **COUVERTE** | sonde D8 `nfr9-size › EX-NFR-4 : taxonomy.json < 1 Mo gzip` ; référentiels 97 Kio gzip au total | — | — |
| `EX-NFR-4bis` | C | **COUVERTE** | `recalc.perf.test` : 100 exécutions, percentile de rang, `n`/médiane/p95 publiés (`p50=152.4ms p95=165.5ms max=192.9ms`) | — | — |
| `EX-NFR-5` | C | **COUVERTE** | `npm run test:perf` rejoué : recalcul complet non filtré **p95 165,5 ms** (N = 100 000, 100 exécutions), élagué 54,1 ms | — | — |
| `EX-NFR-6` | C | **PARTIELLE** | modèles des 14 graphes ≤ 300 ms pour n = 20 000 (sonde D7 `EX-SCR-189`) ; rendu réel au `requestAnimationFrame` non mesuré | mesure au rendu manquante | campagne 2.9 (S3) |
| `EX-NFR-7` | C | **COUVERTE** | `scatter.perf.test` rejoué : 5 000 points, p50 1,18 ms, **p95 3,92 ms** (contexte Canvas 2D réel, sonde D7 `nuage-g4`) | — | — |
| `EX-NFR-8` | C | **COUVERTE** | `scatter.perf.test` rejoué : 8 390 images, 91 fenêtres, 0 en défaut, **100 %**, minimum instantané 172 img/s (lecture pan/zoom, D-07) | — | — |
| `EX-NFR-9` | C | **COUVERTE** | navigateur, 4G simulée par CDP (500 Ko/s, 150 ms, cache désactivé) : premier affichage des cartes-marques à **1 497 ms** (P1-0bis), 1 562 ms au second essai ; réseau local 434 ms ; sonde D8 statique 831 ms (852 ms avec le chunk du worker) | — | — |
| `EX-NFR-10` | C | **COUVERTE** | `npm run size` rejoué : **99,13 / 300 Kio** gzip (worker compris) ; sondes D1/D8 | — | — |
| `EX-NFR-11` | C | **COUVERTE** | aucun chunk différé (0 / 400 Kio) ; garde posée et éprouvée (sondes D1) ; sans objet depuis D-07 (aucune vue 3D) | — | — |
| `EX-NFR-12` | C | **PARTIELLE** | axe-core WCAG 2.1 A/AA : 0 violation sur B, D, C, E, F, `/mentions` ; **1 règle sur A** (`color-contrast`, 30 nœuds), 2 règles carte dépliée (`nested-interactive` ×120), 3 règles écran G ouvert (`aria-allowed-attr` critique ×82) | niveau AA non atteint sur A et G | écart non consigné (FV-16) |
| `EX-NFR-13` | C | **PARTIELLE** | sonde D1 `contrast-tokens` (8/8 paires) ; au rendu, les pastilles de marque titrent 3,19 à 4,35 : 1 (axe, 30 nœuds, `aria-hidden`) | contraste des pastilles < 4,5 : 1 | écart non consigné (FV-16) |
| `EX-NFR-14` | C | **PARTIELLE** | sondes D5 `keyboard-band` (ordre = ordre visuel, corrigé R-D5-19), `keyboard-nav.test`, piège de focus écran G ; au rendu : `nested-interactive` sur les zones-modèles, premier arrêt de tabulation = bouton (focus déplacé sur `main`) ; parcours 100 % clavier non rejoué | non vérifié au rendu | campagne 2.9 |
| `EX-NFR-15` | C | **PARTIELLE** | tables équivalentes pour les 12 graphes tracés (sonde D7, observé « Voir les données »), table G4 complète (DR-083) ; **vides à la première entrée en mode 2** (FV-01) | FV-01 | écart non consigné (FV-01) |
| `EX-NFR-16` | C | **PARTIELLE** | axe-core exécuté sur les 8 surfaces (journaux P3/P4) : 6 surfaces à 0 violation, A et G en défaut | violations A/AA sur A et G | écart non consigné (FV-16) |
| `EX-NFR-17` | C | **COUVERTE** | sonde D1 `EX-NFR-17 — build.target` (es2020/edge88/firefox78/chrome87/safari14 ⊇ deux dernières versions) | — | — |
| `EX-NFR-18` | C | **COUVERTE** | sonde D1 `breakpoints` ; régime compact observé à 360 px (barre de synthèse sans `modèles`, 1 colonne) | — | — |
| `EX-NFR-19` | C | **COUVERTE** | sonde D7 `EX-NFR-19 : le modèle de vue dégradé … neutralise le brossage` ; `degraded={regime === 'compact'}` câblé (`app.tsx`) | — | — |
| `EX-NFR-20` | C | **COUVERTE** | aucune PWA (aucun `serviceWorker`, `grep -rn serviceWorker src` = 0) — rien n'est exigé | — | — |
| `EX-NFR-21` | C | **COUVERTE** | sondes D8 `EX-NFR-21 — 3 réessais, délai 5 000 ms`, `R-D8-29` (corrigée), `integration.test` | — | — |
| `EX-NFR-22` | C | **COUVERTE** | sondes D8 `repli sur cache, jamais un vide`, `R-D8-07` (bandeau daté + Réessayer, corrigée), `IndexedDB indisponible` | — | — |
| `EX-NFR-23` | C | **COUVERTE** | sondes D8 `EX-NFR-22 / 23`, D4 `worker-protocol › WORKER_ERROR jamais un résultat vide` | — | — |
| `EX-NFR-24` | C | **COUVERTE** | clés `localStorage` observées : `saved-searches`, `followed-models`, `recent-history` (+ préférences d'interface) — rien d'autre | — | — |
| `EX-NFR-25` | C | **COUVERTE** | aucune requête sortante dans les cinq journaux (`externalRequests: []`) ; seuls `fetch` : référentiels same-origin et fetcher D9 jamais instancié | — | — |
| `EX-NFR-26` | C | **COUVERTE** | sondes D9 `r3-output`, D3 `R3 (P-1, EX-NFR-26)`, patho `ING-R3`, `normalize.test`, `listings.test` (CSV sans R3) | — | — |
| `EX-NFR-27` | C | **COUVERTE** | sonde D8 `EX-NFR-27 : aucune expiration` | — | — |
| `EX-NFR-28` | C | **COUVERTE** | sondes D5 `EX-NFR-28`, D7 `R-D7-04` (corrigée) ; interface observée intégralement en français | — | — |
| `EX-NFR-29` | C | **PARTIELLE** | table FR propre (`labels.ts`, `EX-NFR-30` sondes) ; libellés forgés non marqués `[EXTRAPOLÉ]` (sonde `R-D5-10` en `it.fails`) | marqueur `[EXTRAPOLÉ]` absent | dette motivée DR-132 (§6.5) — sans objet si `zipr` est retiré |
| `EX-NFR-30` | C | **PARTIELLE** | sondes D5 `EX-NFR-30 : 0 code brut` (registre) vertes ; au rendu, jeton « Marque / Modèle / Version : 74\|2084 » affiche des identifiants bruts | code brut affiché dans le jeton `mmmv` | écart non consigné (FV-04) |
| `EX-NFR-31` | C | **PARTIELLE** | sondes D1 `print-contract`, D8 `R-D8-24` (corrigée) ; en `media: print` réel (journal P4-E) : en-tête et barre de synthèse `static`, C3 `block`, contrôles masqués ; mais le résumé textuel `.print-filter-summary` est placé **dans** `.filter-bar` (`display: none`) et n'est donc jamais imprimé | règle 3 (résumé des filtres) inopérante | écart non consigné (FV-13) |

### 2.4 REQUIREMENTS §10 — `P-1…P-6` (confidentialité et conformité, hors décompte des 485)

| Identifiant | Annexe | Statut | Preuve d'exécution | Écart nommé | Dette / décision |
|---|---|---|---|---|---|
| `P-1` | REQ §10 | **COUVERTE** | sondes D2 `r3-guard`, `r3-repository-scan`, `dictionary-fields (EX-DATA-122)` ; 21 champs exclus | — | — |
| `P-2` | REQ §10 | **COUVERTE** | `normalize.test › filtrage R3 à l'ingestion (P-1, P-2)` ; sonde patho `ING-R3` | — | — |
| `P-3` | REQ §10 | **COUVERTE** | aucun code postal dans le lot (`columns.ts`), NUTS-2 seul ; suppression < 5 sans objet (EX-DATA-56) | — | — |
| `P-4` | REQ §10 | **COUVERTE** | deeplink `window.open` observé, aucun contenu d'annonce dupliqué (15 colonnes, aucune image) | — | — |
| `P-5` | REQ §10 | **COUVERTE** | sondes D9 `no-network` (7 chemins), `assertAllowedUrl` ; aucune requête sortante observée en session | — | — |
| `P-6` | REQ §10 | **COUVERTE** | `/mentions` observée : « aucune API publique de lecture… source réelle visée 2dehands.be / marktplaats.nl » ; AC-01 non levée (D-18) | — | — |
