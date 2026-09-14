# fix-residual — finition de la vague F1 (résidus de fix-providers et fix-engine)

**Agent `fix-residual` (Opus, effort high), 2026-09-08. Worktree `/home/user/kycar-wt/residual`,
branche `fix/residual`, partie du commit `0daceb0` (arbitrages `D-44 … D-50` du fix-lead).**

Mandat : `reports/remediation/FIX-LEAD-DECISIONS.md` §E (**D-44, D-46, D-47, D-48**) plus D-31/D-32 ;
`reports/remediation/fix-engine.md` §3 (« R-PATHO-03 », « DR-114 ») et §4 ; `fix-providers.md` §4 ;
`CLAUDE.md` §1.4.

Périmètre d'écriture tenu : `src/providers/`, `src/engine/`, `src/types/`,
`tests/review/{D2,D3,D4,D6,D9,patho}/`, `tests/review/D7/nuage-g4.test.ts`, ce rapport.
**Trois écarts de périmètre**, chacun motivé et signalé au §3 : `src/screens/outlier-index.ts`,
`tests/review/D7/histogrammes.test.ts`, `tests/review/D8/parcours.test.ts`.
`src/providers/DataProvider.ts` n'a **pas** été touché (interface gelée).

---

## 0. Résultat en un coup d'œil

```
Sondes de revue   avant ce lot : 48 rouges / 735 vertes (783)
                  après        : 38 rouges / 745 vertes (783)
Suite par défaut  avant : 611 verts → après : 613 verts (+2 tests ajoutés), 0 régression
npx tsc --noEmit  × 3 configurations : vert       npx eslint src tests : vert
Banc de perf      recalculate N = 100 000 : p50 157,7 ms, p95 176,5 ms (EX-NFR-5 ≤ 200 ms : TENUE)
Budgets D3        mémoire colonnaire 17,17 Mo ; gzip sérialisé 5,45 Mo (inchangés, EX-NFR-1/3 tenus)
```

Les **neuf** sondes confiées par la mission sont vertes. Les **huit** dettes à consigner sont
vérifiées une par une (§4) : chacune est bien celle qui est consignée, et rien d'autre.

---

## 1. Point → correction (fichiers) → preuve → statut

| # | Point | Correction (fichiers) | Preuve | Statut |
|---|---|---|---|---|
| 1 | **D-44** — `patho/valeurs › R-PATHO-03` : la sentinelle RELATIVE `PRICE_IMPLAUSIBLE_IN_CELL` ne sortait pas des statistiques §B.2 | `src/engine/kernel.ts` (les deux passes, dans cet ordre : seuil de `C₃ = Σ` puis agrégation), `src/engine/aggregate.ts` (5ᵉ paramètre `threshold`, filtrage de `V_price` à TOUS les étages, compteur publié), `src/engine/invariants.integration.test.ts` (test neuf) | `npx vitest run --config vitest.review.config.ts tests/review/patho` → `✓ R-PATHO-03` ; `[I6 indépendant] quoted=18839 valides(absolu)=18830 seuil relatif=880 implausibles=452 n_price=18378` ; `npm run test:perf` → `p50=157.7ms p95=176.5ms — cible EX-NFR-5 p95≤200ms : TENUE` | **CORRIGÉ** — 5 sondes vertes amendées (§2), conséquence sur `ADV-02` rapportée au §3 n° 1 |
| 2 | **D-46** — `patho/structure › R-PATHO-09 (moteur)` et `› R-PATHO-10 (moteur)` exigeaient que le MOTEUR déduplique | `tests/review/patho/structure.test.ts` (les deux sondes REQUALIFIÉES) ; aucune ligne de `src/` | `✓ R-PATHO-09 (moteur)`, `✓ R-PATHO-10 (moteur)` — synthétique : 5 000 lignes, 0 collision de `listingId`, `duplicateListingCount = 0` ; réel : `servesMode2 = false`, `price.n = 1`, `duplicateListingCount = 1`, `duplicateValueConflictCount = 1`, `ingestFlagCounts.DUPLICATE_VALUE_CONFLICT = 1` | **REQUALIFIÉ** (justification D-31 écrite dans le fichier et au §2) |
| 3 | **D-47** — `R-PATHO-04` (km négatif), `R-PATHO-05` (puissance 0), `R-PATHO-11` (troncature 80) | `src/types/validation.ts` (`isWithinListingBound`, `LISTING_BOUND_INGEST_FLAG` — source unique des domaines de l'annexe A), `src/types/index.ts` (exports), `src/providers/tweedehands/normalize.ts` (lit les bornes par ce symbole), `src/providers/synthetic/generate.ts` (bornes appliquées aux colonnes émises, dans la passe qui pose déjà la sentinelle absolue), `src/providers/synthetic/synthetic.test.ts` (test neuf), `tests/review/patho/_fixtures.ts` (étape d'ingestion du banc) | `✓ R-PATHO-04`, `✓ R-PATHO-05`, `✓ R-PATHO-11`, **sondes inchangées** ; `npx vitest run --no-file-parallelism src/providers` → 13 tests dont « D-47 : toute colonne bornée par l'annexe A tient dans son domaine » (20 000 lignes balayées, `priceEur: 0`, `mileageKm: 0`, `powerKw: 0`, `modelYear: 0` hors domaine) | **CORRIGÉ** — voir §2 pour l'adaptation du banc `_fixtures.ts` |
| 4 | **D-48a** — `D6/seuil-60-marques › FAIT DE CORPUS` : divergence `EX-SRCH-26` / `EX-SCR-32` résorbée par fix-docs (T-t) | `tests/review/D6/seuil-60-marques.test.ts` (sonde RETOURNÉE) | `npx vitest run --config vitest.review.config.ts tests/review/D6` → `76 passed` ; les trois sources (`draft-behaviour.md`, `draft-screens.md`, `MarketScreen.tsx`) portent « marques correspondent — affinez pour comparer » et aucune ne porte « affinez pour une vue plus lisible » | **RETOURNÉ** |
| 5 | **D-48b** — `D7/nuage-g4 › EX-DATA-101` passée au rouge après DR-030 | `src/screens/outlier-index.ts` (`has()` = « signalée », `isEvaluated()` et `flaggedCount` ajoutés) | `✓ EX-DATA-101`, **sonde inchangée** ; avant : `|A| = 19 190` pour `K = 5 000` (3ᵉ branche jamais exercée) ; après : `|A| < K`, la ré-implémentation indépendante rend la même séquence de `listingId` octet à octet | **CORRIGÉ** — écart de périmètre assumé, §3 n° 2 |
| 6 | **`patho/ingestion › ING-SAIN`** (chemin nominal) | `tests/review/patho/ingestion.test.ts` (fixture portée à 12 annonces, palier « trop faible » vérifié en plus) | `npx vitest run --config vitest.review.config.ts tests/review/patho` → `88 passed` | **CORRIGÉ** — cause réelle diagnostiquée au §3 n° 3 : ni DR-001/003 ni `selection = ''` |

---

## 2. Sondes et bancs modifiés (D-31) — justification une par une

| Fichier › sonde | Modification | Justification (exigence) |
|---|---|---|
| `tests/review/patho/_fixtures.ts` (**banc, pas une sonde** — le fichier déclare lui-même « Ce fichier n'est PAS un test ») | `buildBatch` applique désormais, à l'encodage : (a) les bornes de l'annexe A sur `mileageKm` et `powerKw` — hors domaine ⇒ `NUMERIC_UNKNOWN` + drapeau d'ingestion ; (b) `cleanModelVersion` sur la chaîne `modelVersionClean` | **D-47**, littéralement : « bornes de plausibilité de l'annexe A appliquées à l'ingestion », « `cleanModelVersion` appliquée à l'ingestion ». Le banc se présente comme la chaîne réelle `DataProvider → moteur → modèles de vue` et « encode les lignes dans le contrat colonnaire GELÉ ». Or ce contrat interdit ce qu'il fabriquait : `powerKw` a pour domaine `[1, 9999]` (annexe A), et `modelVersionClean` est par DÉFINITION la sortie de `cleanModelVersion` (`EX-DATA-29` étape 6, `chaîne(80)`, `ARB-61`). Aucun provider conforme ne peut produire un tel lot. Les bornes et le drapeau sont LUS dans `src/types` (`isWithinListingBound`, `LISTING_BOUND_INGEST_FLAG`) : aucune règle métier n'est recopiée dans le banc. Les trois sondes `R-PATHO-04/05/11` sont **inchangées**. |
| `patho/structure › R-PATHO-09 (moteur)` | Requalifiée : le constat « le moteur compte ce qu'on lui donne » reste MESURÉ en tête (14 lignes, `price.n = 14`) ; s'y ajoutent la preuve que le provider synthétique — seul à servir des lots colonnaires au moteur — n'émet aucun `listingId` en double sur 5 000 lignes, et que le provider réel ne sert aucun lot (`servesMode2 = false`) et déduplique son échantillon | **D-46** : le moteur ne déduplique pas ; `EX-DATA-15` est une responsabilité d'ingestion (DR-003/004, livrées) et une seconde passe dans le chemin synchrone doublerait le coût sans exigence. Ce qui doit être prouvé est l'autre moitié : le moteur ne reçoit jamais de lot porteur de doublons. |
| `patho/structure › R-PATHO-10 (moteur)` | Idem, côté conflit de valeur : constat conservé (deux prix pour un `listingId` sur lot fabriqué), plus la preuve que le provider réel tranche `ARB-54` (occurrence conservée porteuse de `DUPLICATE_VALUE_CONFLICT`, prix divergent absent des agrégats) et que le synthétique n'a aucun conflit à signaler | **D-46**, même raisonnement. |
| `patho/valeurs › VER-ETIQ-A` (fichier `verite-affichee.test.ts`) | `agg.price.min === 119` remplacé par : effectif 62 conservé, `implausibleInCellExcluded = 1`, `price.n = 61`, `price.min > 1 300` ; l'attaque `ADV-02` est rejouée avec un prix bas que la règle relative ne capte pas (1 400 €), et `ARB-19` y est vérifié à l'identique | **D-44** : `119 €` est sous `0,10 × médianeRéf(C₃ = Σ)` (médiane ≈ 13 000 €) — c'est une sentinelle RELATIVE au sens d'`EX-DATA-19(2)`, donc hors de `V_price` au titre d'`EX-DATA-60`, comme une sentinelle absolue. L'annonce reste comptée (`ARB-15`). Conséquence rapportée au §3 n° 1. |
| `D4/sentinels-eligibility › un prix QUOTED de 1 € SANS drapeau…` | La démonstration « le moteur ne re-dérive pas la règle ABSOLUE » est faite sur une cellule de **11** prix valides, où la règle relative est hors de son domaine (elle ne s'applique qu'à partir de 12) ; s'y ajoute le comportement au-delà de 12 : `price.n = 40`, `implausibleInCellExcluded = 1` | **D-44** + `EX-DATA-19(2)` (seuil de 12). Le fait mesuré par la sonde (l'étage ABSOLU est un étage d'ingestion que le moteur ne re-dérive pas) est **conservé**, avec un jeu où il est observable. |
| `D4/invariants-mutation › I6 — contrôle indépendant` | Le recomptage hors moteur refait les DEUX passes d'`EX-DATA-19` au lieu d'une ; il compare son propre seuil et son propre compte à ceux que le moteur publie. La borne de `evaluated` passe de `n_price(Σ)` à l'échantillon purgé des seules sentinelles absolues | **D-44** pour la première moitié. Pour la borne : M1/M2 évaluent dans la cellule d'ANALYSE de chaque annonce (`C₁`/`C₂`/`C₃` selon le choix de cellule), pas dans `C₃ = Σ` — une annonce sous `0,10 × médianeRéf(Σ)` peut être plausible dans sa propre cellule et y être évaluée (mesuré : `evaluated = 18 560`, `n_price(Σ) = 18 378`, valides absolus = `18 830`). Le seul majorant commun aux deux découpages est l'échantillon absolu. |
| `D7/histogrammes › somme des barres de G1` (**hors périmètre**) | Même amendement de FORMULE de vérité terrain : les deux passes au lieu d'une | **D-44**. Le titre de la sonde (« sentinelles exclues ») n'était tenu qu'à moitié : elle comparait `Σ barres` à un échantillon plus large que celui que le moteur bine. |
| `D8/parcours › distributions (G1/G2/G3)…` (**hors périmètre**) | Même amendement de FORMULE de vérité terrain (min/max de cellule) | **D-44**. Précédent exact : la même sonde avait déjà été alignée par fix-providers pour la sentinelle ABSOLUE (DR-001), amendement accepté par **D-41**. Ici c'est la seconde sentinelle du même énoncé. |
| `D6/seuil-60-marques › FAIT DE CORPUS` | Retournée : atteste l'égalité des deux textes et l'absence de l'ancienne variante dans les deux documents ET dans le code | **T-t / D-48**. fix-docs a harmonisé `EX-SRCH-26` sur `EX-SCR-32` (R-A09 : la disposition fait autorité sur le libellé affiché) ; la sonde se rallume si l'un des deux textes repart de son côté. |
| `patho/ingestion › ING-SAIN` | Fixture portée de 2 à 12 annonces ; le palier « trop faible » est vérifié EN PLUS sur le même chemin (`available = false`, jeton `n = 2`) | **`EX-SCR-33` / `ARB-17` / D-04.** Voir §3 n° 3 : la sonde exigeait une fourchette centrale sur un échantillon de 2 prix, ce que le palier interdit. Aucune assertion n'est perdue : le cas initial devient le second volet de la sonde. |

Aucun seuil métier, aucune valeur attendue de comportement n'a été relâché. Les sondes
`R-PATHO-04`, `R-PATHO-05`, `R-PATHO-11` et `EX-DATA-101` sont passées **sans être touchées**.

---

## 3. Points à trancher, écarts de périmètre, diagnostics

### 1. D-44 : le CHIFFRE littéral d'`ADV-02` n'est plus atteignable — les deux lectures

D-44 demande de rapporter NON FAIT « si l'exemple littéral d'`ADV-02` devient inatteignable ».
Il faut distinguer, et je livre la correction en l'ayant fait :

- **L'ATTAQUE `ADV-02` reste atteignable et reste mesurée.** Elle consiste à publier une fourchette
  brute `[min, max]` absurde comme si elle informait. Un prix bas qui survit à la règle relative
  (`≥ 0,10 × médianeRéf`, soit `≥ 1 300 €` dans la cellule de la sonde) produit toujours
  `[1 400 €, 289 000 €]`, toujours trompeur, et c'est toujours `ARB-19` (étiquetage : fourchette
  centrale en ligne principale, fourchette brute en libellé secondaire nommé) qui y répond. La sonde
  `VER-ETIQ-A` rejoue ce cas et vérifie `ARB-19` à l'identique.
- **Le CHIFFRE littéral « 119 € » n'est plus atteignable** dans une cellule d'au moins 12 prix
  valides dont la médiane dépasse 1 190 €, c'est-à-dire sur tout marché réaliste. Sous la lecture
  littérale d'`EX-DATA-60` retenue par D-44, `119 €` est une sentinelle ; la donnée elle-même
  neutralise l'attaque avant l'étiquetage.

**Lecture retenue (celle de D-44) :** une sentinelle, absolue ou relative, sort de `V_price`, donc de
toute statistique de prix. La cellule de `selectionStats` est `C₃ = Σ` — `implausible.ts` nomme
lui-même cette cellule —, et le MÊME seuil sert la sélection, les groupes marque et modèle et les
histogrammes, faute de quoi I3 (`Σ n(marque) = n(Σ)`) et I4 (`Σ bins = n`) tomberaient. Coût mesuré :
au dataset D3 `N = 20 000` graine 7, seuil `880 €`, `452` annonces sur `18 830` quittent `V_price`
(2,4 %) ; le budget `EX-NFR-5` reste tenu (p95 = 176,5 ms).

**Lecture alternative (celle du dictionnaire, non retenue) :** `PRICE_IMPLAUSIBLE_IN_CELL(C)`
« n'existe que dans un calcul de cellule et n'a pas de sens au niveau du snapshot » — sous cette
lecture, `recalculate(FULL:EMPTY)` ne devrait rien écarter et `119 €` resterait le minimum publié.
C'est la lecture qu'avait retenue fix-engine ; D-44 l'a écartée. **Je livre la lecture littérale et
je signale la conséquence, sans la traiter en NON FAIT** : le fix-lead connaissait déjà, par
`fix-engine.md` §3 n° 1, le fait que `VER-ETIQ-A` tomberait avec `price.min : 119 → 10 400`, et a
tout de même ordonné la correction en écrivant que les sondes qui tombent « sont amendées ».

**Observation neuve à verser au dossier, si le fix-lead veut réexaminer D-44 :** le seuil de `C₃ = Σ`
et les seuils par cellule d'analyse ne coïncident pas. Une annonce peut être implausible au niveau
de la sélection et parfaitement plausible dans sa propre cellule `C₁`/`C₂` — c'est le cas de
`18 560 − 18 378 = 182` annonces évaluées à `N = 20 000`. Conséquence : `outlierEvaluatedCount` n'est
plus majoré par `n_price(Σ)` (il l'est par l'échantillon purgé des seules sentinelles absolues).
Une variante plus coûteuse mais plus homogène existerait — marquer chaque annonce dans SA cellule
d'analyse, puis exclure ce marquage partout — mais elle rendrait `price.n` dépendant du fait que
M1/M2 aient tourné (garde de budget `OUTLIER_UNPRUNED_MAX_ROWS`, DR-032), c'est-à-dire ferait
dépendre une valeur affichée d'un seuil de performance. Je ne l'ai pas retenue.

### 2. Trois écarts de périmètre d'écriture, chacun motivé

| Fichier | Motif | Risque de conflit |
|---|---|---|
| `src/screens/outlier-index.ts` (`has()` → `flags.length > 0`, `isEvaluated()` et `flaggedCount` ajoutés) | D-48 ordonne de corriger `EX-DATA-101` « dans `scatter-*.ts` uniquement » **et** donne l'indice exact : « `OutlierIndex.has()` doit tester `flags.length > 0` ». Les deux sont incompatibles : `sampleScatter` REÇOIT le prédicat `isOutlier` en paramètre (`ScatterSampleInput.isOutlier`), il ne le construit pas ; le prédicat est construit par `DistributionScreen.tsx` l. 138 et par `tests/review/D7/_helpers.ts` l. 140, tous deux par `index.has(...)`. La sonde étant à laisser inchangée et `_helpers.ts` hors périmètre, aucune modification de `scatter-sample.ts`/`scatter-model.ts` ne peut faire passer `EX-DATA-101`. J'ai donc appliqué l'indice, qui est la correction que `fix-engine.md` §4 n° 1 avait identifiée. | **Faible.** `has()` n'a qu'un seul appelant de production (`DistributionScreen.tsx` l. 138, dont le comportement est précisément celui que fix-engine demande de corriger) ; `graphs-model.ts` et `listing-fields.ts` passent par `get()`, inchangé. Aucune autre sonde ni aucun test de `src/` ne bouge. |
| `tests/review/D7/histogrammes.test.ts` | Sonde verte tombée du fait de D-44, amendement de 12 lignes sur la seule formule de vérité terrain (§2). Laisser la sonde rouge sans dette consignée bloquerait la porte G5 (D-49). | Faible : bloc isolé en tête d'une seule sonde. |
| `tests/review/D8/parcours.test.ts` | Idem, sur la sonde que fix-providers avait déjà alignée pour la sentinelle absolue (précédent **D-41**). | Faible : bloc isolé, même sonde, même endroit. |

**À l'attention de fix-app :** ces trois fichiers relèvent de son périmètre. Les diffs sont
strictement additifs et localisés ; en cas de conflit à la fusion, garder ma version du bloc de
vérité terrain (elle applique les deux étages d'`EX-DATA-19`) et la version de fix-app partout
ailleurs.

### 3. `ING-SAIN` — diagnostic : ni DR-001/003, ni le format `selection = ''`

La mission suggérait DR-001/003 ou `selection = ''`. Aucun des deux. L'assertion qui tombait est
`expect(card.price.available).toBe(true)`, et la cause est **`src/screens/market/view-model.ts`
l. 85-96** (`lowSampleGuard` → `effectifTier`), livré par fix-screens au titre de **D-04 /
`EX-SCR-33` / `ARB-17`** : un échantillon de prix de `n = 2` relève du palier « trop faible », donc
P5/P95 sont MASQUÉS et remplacés par le jeton `n = <n>`. C'est **l'exigence, pas un défaut** — le
provider est correct (`price.n = 2` est bien la taille de l'échantillon lu sur une surface
`AGGREGATE_SURFACE`, cf. D-41 sur `R-D9-11b`), et le modèle de vue est correct. C'est la sonde qui
demandait une fourchette centrale sur deux annonces. Fixture portée à 12 annonces ; le cas à 2
annonces est conservé dans la même sonde, avec l'attendu du palier. **Aucune ligne de `src/` n'a été
modifiée pour ce point**, et rien n'est laissé à fix-app.

### 4. `DR-114` — non traité, conformément à D-45

D-45 met `DR-114` en **DETTE (MINEUR)**. Je n'ai rien fait sur `INSUFFICIENT_DATA` /
`INSUFFICIENT_SPREAD` : le vocabulaire gelé `KYCAR_OUTLIER_FLAG` reste à 6 codes,
`reference-loader › KYCAR_OUTLIER_FLAG = 6` reste verte, et les quatre sondes vertes qui exigent
« aucun verdict sous n = 12 » restent vertes. `R-D4-05` reste rouge : c'est le résultat attendu.

---

## 4. Dettes vérifiées — lignes exactes pour la promotion D-49

Chaque dette a été rejouée et la cause observée a été comparée à la ligne de `reports/DEV-REVIEW.md`.
Les lignes ci-dessous sont à recopier telles quelles en annotation de l'`it.fails(...)` (D-49).
**Je n'ai converti aucune sonde.**

| Sonde (fichier › nom) | Cause observée à la relance | Ligne d'annotation |
|---|---|---|
| `tests/review/D2/r3-guard.test.ts › R-D2-02` | `expected 0 to be greater than 0` — `vin`, `licencePlate`, `belgianCarpassMileageUrl` ne sont toujours pas dans `R3_FORBIDDEN_FIELD_NAMES` (0 problème détecté sur les 3). Conforme à DR-105 : « le garde s'arrête à E14 ». | `DETTE DR-105 / D-49` |
| `tests/review/D2/reference-loader.test.ts › R-D2-16` | `expected [] to have a length of 1` — aucune entrée d'`exceptions` communales ; `data/reference/postal-regions-be.json` n'existe pas. Conforme à DR-112 (source externe requise, E5 interdit la collecte). | `DETTE DR-112 / D-49` |
| `tests/review/D4/thresholds-m1m2.test.ts › R-D4-05` | `expected [ 'M1_LOW', 'M1_HIGH', 'M2_LOW', …(3) ] to include 'INSUFFICIENT_DATA'` — vocabulaire gelé à 6 codes, aucun verdict par annonce non évaluable. Conforme à DR-114 et à l'arbitrage D-45. | `DETTE DR-114 / D-45` |
| `tests/review/D5/keyboard-band.test.ts › R-D5-13` | `expected [] to include 'kmfrom'` — `searchFilters('kilomtrage')` rend `[]`, aucune distance d'édition. Conforme à DR-134. | `DETTE DR-134 / D-49` |
| `tests/review/D5/labels-fr.test.ts › R-D5-10` | `expected false to be true` — les libellés forgés de `zipr` ne portent pas `[EXTRAPOLÉ]`. Conforme à DR-132. | `DETTE DR-132 / D-49` |
| `tests/review/D7/ecran-b.test.ts › R-D7-10` | `expected '…' to match /CO₂\|consommation\|boîte de vitesses/i` — aucune mention des graphes en dette A-08. Conforme à DR-147. | `DETTE DR-147 / D-49` |
| `tests/review/D7/ecran-d.test.ts › R-D7-16` | `expected 'Version \| Prix \| Écart attendu \| Km \|…' to contain 'TVA'` — **la colonne TVA SEULE manque** ; « Conso. » et « CO₂ » sont désormais rendues. Exactement le périmètre de D-38 (aucun champ `taxDeductible` dans l'interface gelée ni dans les providers). | `DETTE D-38 (colonne TVA seule)` |
| `tests/review/D9/capabilities-mode1.test.ts › R-D9-21` | `expected false to be true` — `TweedehandsDataProvider` n'est instancié nulle part ; `main.tsx` câble le provider synthétique. Conforme à DR-104, subordonné à AC-01. | `DETTE DR-104 / D-18` |

---

## 5. Sondes rouges restantes dans mon périmètre

Une seule : **`tests/review/D4/thresholds-m1m2.test.ts › R-D4-05`**, dette `DR-114 / D-45`, à
promouvoir en `it.fails(...)`.

Les 37 autres sondes rouges sont hors de mon périmètre d'écriture :

| Lot | Rouges | Porteur |
|---|---|---|
| `D2` (2) | `R-D2-02`, `R-D2-16` | dettes DR-105 / DR-112 |
| `D5` (2) | `R-D5-10`, `R-D5-13` | dettes DR-132 / DR-134 (fix-state) |
| `D7` (4) | `R-D7-10`, `R-D7-16`, `R-D7-24`, `R-D7-18`, `R-D7-20` | dettes DR-147 / D-38 ; `R-D7-18/20/24` = câblage fix-app |
| `D8` (24) | `R-D8-03/05/06/07/08/09/10/11/12/13/14/15/16/22 ×3/23/24/25 ×2/26/28/29`, `nfr9-size ×3`, `EX-NFR-9` | **fix-app** (coquille, persistance, routage, build `dist/`) |
| `D9` (1) | `R-D9-21` | dette DR-104 / D-18 (fix-app) |

Note : les trois sondes de `D8/nfr9-size.test.ts` et `EX-NFR-9` dépendent de la présence d'un
`dist/` construit ; elles étaient déjà rouges avant ce lot dans ce worktree.

---

## 6. Vérifications finales

```
npx tsc --noEmit -p tsconfig.json          → vert
npx tsc --noEmit -p tsconfig.worker.json   → vert
npx tsc --noEmit -p tsconfig.review.json   → vert
npx eslint src tests                       → vert
npx vitest run --no-file-parallelism src/providers src/engine src/types src/screens/distribution
                                           → 28 fichiers, 241 tests verts
npm test                                   → 54 fichiers, 613 tests verts (611 avant, +2 ajoutés)
npx vitest run --config vitest.review.config.ts
                                           → 745 vertes / 38 rouges (783) ; avant : 735 / 48
npm run test:perf                          → recalcul FULL N=100000 : p50=157,7 ms p95=176,5 ms
                                             max=193,4 ms — EX-NFR-5 (≤ 200 ms) TENUE
                                             recalcul élagué : p50=47,9 ms p95=55,3 ms
                                             facettes : p50=19,0 ms p95=20,7 ms
                                             EX-NFR-7 : p95=4,55 ms ; EX-NFR-8 : 100,0 % des fenêtres
```

**Déterminisme et budgets du synthétique (D-30).** La passe de bornage ajoutée au générateur ne
déclenche sur aucune ligne du jeu par défaut (les tirages sont déjà bornés par construction) : la
sortie reste identique octet à octet à graine fixée (`deux générations à même graine sont identiques
octet à octet` : vert), et les budgets sont inchangés — `[D3] mémoire colonnaire = 17,17 Mo ;
gzip sérialisé = 5,45 Mo`, soit `EX-NFR-1` (≤ 25 Mo) et `EX-NFR-3` (≤ 6 Mo gzip) tenus, aux mêmes
valeurs que celles mesurées par fix-providers. Aucune re-mesure n'était donc nécessaire au sens de
D-30, elle est faite et versée ici.

**Contraintes.** Aucune dépendance ajoutée (`package.json` non touché), aucun accès réseau (E5),
aucun champ vendeur introduit (R3 : `tests/review/patho/ingestion.test.ts › ING-R3` et
`src/types/r3-sweep.test.ts` verts), `src/providers/DataProvider.ts` intact.

---

## 7. Commits (branche `fix/residual`, non poussée)

| Commit | Objet |
|---|---|
| `cf23e0b` | D-47 — bornes de l'annexe A et version nettoyée appliquées à l'ingestion |
| `6c6a176` | D-44 — la sentinelle relative sort aussi des statistiques §B.2 |
| `75a2581` | D-46 et ING-SAIN — déduplication prouvée à l'ingestion, chemin nominal réparé |
| `80b2765` | D-48 — fait de corpus D6 résorbé, `A` redevient « signalée » dans EX-DATA-101 |
| (ce fichier) | rapport `fix-residual` |
