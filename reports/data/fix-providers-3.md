# `fix-providers-3` — DR3-20 : une seule définition du quantile dans le produit

Phase 3.5 (PLAN-3), agent `fix-providers-3` (Opus, effort high), worktree `fix35/providers`,
branche `fix35/providers` créée depuis `claude/kycar-project-ffcplk` @ `ae2bdbf`.
Mandat : `reports/data/DATA-LEAD-DECISIONS.md` **D3-37**, réserve **R1** de
`reports/data/DATA-REVIEW.md` §10.7, constat **DR3-20** (MAJEUR) de §10.5.

---

## 1. Le constat, tel que je l'ai reproduit

`src/providers/synthetic/aggregate.ts` porte l'agrégation mode 1 des deux providers de listings —
`SyntheticDataProvider` **et** `FixtureDataProvider`, ce dernier étant la source par défaut depuis
3.5 (`D3-01`). J'y ai reproduit les trois écarts avec `aggregate()` du moteur (`src/engine/`), sur
les six snapshots commités, avant toute correction :

| Snapshot | `listingCount` | champs `price` divergents | champs `mileage` | champs `year` | écart relatif max sur le prix |
|---|---:|---:|---:|---:|---|
| `dev/be-20260907T060000Z` | 0 / 135 | 218 (dont 27 sur `n`) | 187 | 299 (dont 46 sur `n`) | 95,50 % — marque 14882 `p05`, `n = 3` : 700 € contre 15 554,5 € |
| `dev/be-20260914T060000Z` | 0 / 135 | 215 (26) | 178 | 300 (40) | 96,14 % |
| `dev/be-20260921T060000Z` | 0 / 135 | 217 (26) | 178 | 273 (42) | 96,14 % |
| `test/be-20260907T060000Z` | 0 / 262 | 408 (50) | 313 | 545 (78) | 92,24 % — marque 16336 `p05`, `n = 6` : 1 000 € contre 12 892,4 € |
| `test/be-20260914T060000Z` | 0 / 262 | 418 (53) | 311 | 533 (77) | 92,35 % |
| `test/be-20260921T060000Z` | 0 / 262 | 395 (50) | 312 | 532 (79) | 92,35 % |

Les effectifs (`listingCount`) n'ont **jamais** divergé : le désaccord porte uniquement sur ce qui
est publié à l'intérieur d'un agrégat. Trois causes, isolées ligne à ligne (profil `test`, S0) :

1. **Convention de quantile** (`DR3-20` tel qu'écrit) — `nearestRank` (`x_⌈p·n⌉`) contre le
   **type 7** d'`EX-DATA-62`.
2. **Échantillon de prix** (`EX-DATA-19(2)`) — le moteur écarte de `V_price` les prix sous
   `0,10 × médianeRéf(C₃ = Σ)`, le provider non : **274 lignes** au profil `test` (seuil
   1 629,80 €), **83** au profil `dev` (seuil 1 600 €). Le prédicat de validité ABSOLUE, lui, est
   déjà identique : `0` divergence mesurée entre `isPriceValid` du moteur (qui exige en outre
   `priceStatus = QUOTED`) et le prédicat local du provider, sur les 19 986 lignes du profil `test`.
3. **Axe année** (`EX-DATA-25`) — **écart NON nommé par DR3-20, découvert en écrivant la sonde** :
   le provider agrégeait `modelYear`, le moteur `firstRegistrationYear`. Profil `test` :
   18 791 `modelYear` connus contre 19 682 `firstRegistrationYear` connus, et **14 065 seulement
   coïncident**. Traité au §3.

---

## 2. Décision d'implémentation

### 2.1 Réutiliser le moteur plutôt que le recopier

`src/providers/synthetic/aggregate.ts` **importe** désormais trois modules du moteur au lieu de
paraphraser leurs définitions :

| Import | Ce qu'il apporte |
|---|---|
| `quantileFromSorted` (`src/engine/quantiles.ts`) | le quantile de type 7, sur un tableau typé déjà trié |
| `implausibleInCellThreshold` (`src/engine/implausible.ts`) | le ratio `0,10`, le plancher de 12 prix, la forme du seuil |
| `isPriceValid`, `isMileageValid`, `isYearValid`, `yearFromYearMonth` (`src/engine/flags.ts`) | les prédicats d'`EX-DATA-60` et le décodage de l'année |

**Pourquoi l'import est licite.** (a) Aucune règle ESLint ne le restreint : `eslint.config.js` ne
déclare pas de `no-restricted-imports`. (b) Aucun cycle dans le graphe de PRODUCTION : ces trois
modules du moteur sont purs et ne dépendent que de `src/types` ; le seul module du moteur qui
remonte vers `src/providers` est `src/engine/testkit.ts`, réservé aux tests et **non exporté** par
`src/engine/index.ts`. (c) `ARCHITECTURE.md` §7.2 ordonne les LOTS (`D3 ∥ D4`), il ne pose pas
d'interdiction d'import permanente ; nous sommes en phase 3.5, D4 est livré depuis 2.5. (d) Coût
mesuré sur le paquet initial : **+0,11 Kio gzip** (121,80 → 121,91 Kio ; budget 300 Kio,
total 135,81 Kio avec le worker).

L'alternative offerte par la mission — extraire dans `src/types/` ou dupliquer avec une sonde
d'égalité — a été écartée : elle laisse **deux** implémentations d'une définition que le
dictionnaire qualifie de « non négociable », c'est-à-dire exactement l'état qui a produit DR3-20.
Le moteur, lui, n'a pas été touché (interdit de mandat) : c'est le provider qui vient à lui.

### 2.2 Arrondis

`EX-DATA-62` définit `Q` par sa formule ; `EX-DATA-63` ajoute que « `Q` est calculé en **double
précision** sur l'échantillon valide, **sans arrondi intermédiaire**. L'arrondi n'a lieu qu'à la
présentation, selon EX-DATA-6 et la table B.2 ». La table d'`EX-DATA-64` range bien « prix : euro
entier · km : entier · année : plancher/plafond » dans une colonne intitulée **« Arrondi de
présentation »**. `src/engine/quantiles.ts` s'y conforme (« Valeurs NON arrondies (double précision,
EX-DATA-63) — l'arrondi de présentation est du ressort du rendu »), et `src/engine/group-stats.test.ts`
cite `EX-DATA-83ter` dans le même sens.

**Décision : le provider ne fait AUCUN arrondi.** `p05`/`p50`/`p95` sont des réels ; `min`/`max`
restent entiers (statistiques d'ordre sur des métriques entières, `EX-DATA-111`). Deux conséquences
assumées :

- `data/schema/snapshot-baseline.schema.json` typait `p05`/`p50`/`p95` en `["integer","null"]` — il
  **figeait la convention fautive**. Il les type désormais `["number","null"]`, description à
  l'appui. `min`/`max`/`n` restent `integer`.
- `baseline.json` grossit : profil `test`, **12 622 → 13 781 octets gzip** (+1,13 Kio, ≈ 2 ms en 4G
  à 4 Mb/s) ; profil `dev`, 7 816 → 8 534 octets. Le jalon `EX-NFR-9` est mesuré à **1 512 ms
  médians** pour le premier chiffre (budget 2 000 ms) — voir §6.

Un résidu de représentation binaire64 apparaît là où `f` n'est pas représentable : à `n = 4`,
`h = 3·0,95 + 1` vaut `3,8499999999999996`, d'où `p95 = 8 949,999999999996` et non `8 950`. C'est le
résultat exact de la formule du dictionnaire ; la sonde vérifie les DEUX (`toBeCloseTo` sur le
calcul à la main, `toBe` sur le double servi), et l'arrondi de présentation à l'euro l'absorbe.

---

## 3. Arbitrage `EX-DATA-19(2)` — et son voisin `EX-DATA-25`

### 3.1 La sentinelle relative s'applique à toute statistique de prix

Texte cité (`docs/requirements/draft-data-dictionary.md`, `EX-DATA-19`, l. 270-284) :

> **(2) `PRICE_IMPLAUSIBLE_IN_CELL`** — étage **analyse**, recalculé par cellule et par sélection,
> **jamais stocké dans `ingestFlags`** : `priceEur < 0,10 × médianeRéf(C)`, où
> `médianeRéf(C) = Q(V_price(C) privé des seules annonces portant PRICE_SENTINEL_ABSOLUTE, 0,50)`.
> […] La règle relative **ne s'applique pas** quand `n_price(C) < 12` après retrait des sentinelles
> absolues ; la cellule `C` est celle d'`EX-DATA-86`.
> **Effectifs et statistiques** : les deux drapeaux **comptent** dans tout effectif (une annonce à
> prix absurde reste une offre du marché) et sont **tous deux exclus** de `V_price`.

**Verdict : l'exclusion est définie pour toute statistique de prix, mode 1 compris.** Le texte ne
la réserve nulle part au mode 2 ni au bloc `MetricStats` : il la pose sur `V_price`, et `V_price`
est l'échantillon de toute statistique de prix (`EX-DATA-60`, `EX-DATA-64`). Le seul mot qui
pourrait la limiter est « analyse », qui qualifie l'ÉTAGE de calcul (recalculé, non stocké) et non
le mode d'affichage — la phrase suivante, « les deux drapeaux […] sont tous deux exclus de
`V_price` », ne distingue pas les deux étages. `EX-DATA-87` confirme en publiant
`implausibleInCellCount` « avec chaque verdict », c'est-à-dire comme une propriété de la cellule,
pas d'un écran. Le défaut de `D3-37` — « une seule définition dans le produit, celle du moteur » —
n'a donc pas eu à jouer : le texte suffit. **Le provider est aligné sur le moteur.**

**Quelle cellule.** `EX-DATA-86` fait de `C` un sous-ensemble de la **sélection** `Σ`, et le moteur
emploie `C₃ = Σ` pour la sélection, les groupes marque ET les groupes modèle (`src/engine/aggregate.ts`,
en-tête : « le MÊME seuil sert la sélection, les groupes marque et modèle et les histogrammes, faute
de quoi I3 […] tomberait »). Le provider fait exactement cela : un seul seuil par appel, calculé sur
`rowIndices` (la sélection), jamais sur un groupe ; `makeScope` d'`aggregateByModel` ne restreint que
les groupes ÉMIS et n'entre pas dans le calcul du seuil. Pour la baseline, `Σ` est la sélection VIDE,
donc le snapshot entier.

> **Conséquence à ne pas prendre pour un écart** : une même marque n'a pas le même seuil sur l'écran A
> sans filtre (`C₃` = snapshot) et sur l'écran B filtré sur cette marque (`C₃` = la marque). Exemple
> mesuré, profil `test` S0, marque 74 : écran A `price.min = 1 662 €`, `n = 2 092` ; écran B filtré
> `min = 1 450 €`, `n = 2 101`. C'est la définition d'`EX-DATA-86` (« les filtres de l'utilisateur
> définissent le marché auquel il compare ») et `EX-DATA-19` impose de nommer la cellule à l'écran.

### 3.2 `EX-DATA-25` — écart découvert, corrigé dans le même geste

> **EX-DATA-25.** L'axe « année » de tous les agrégats et de tous les histogrammes est
> **`firstRegistrationYear`**, jamais `modelYear`. […] `modelYear` reste dans le dictionnaire comme
> attribut d'annonce et comme filtre […], sans jamais alimenter l'axe année.

Le provider alimentait `MakeAggregate.year` / `ModelAggregate.year` avec `modelYear`. Ce n'est pas
nommé par DR3-20, mais c'est le même défaut, la même exigence explicite et le même écran : je l'ai
corrigé plutôt que de le consigner, pour trois raisons. (a) La sonde exigée par la mission compare
`year` champ à champ au moteur : sans cette correction elle ne peut pas être verte. (b) `D3-37`
tranche par défaut « une seule définition dans le produit, celle du moteur ». (c) La correction est
entièrement dans mon périmètre (`src/providers`) et sans coût : `firstRegistrationYearMonth` est
déjà rempli par la passe de génération du noyau, il manquait seulement à l'interface interne
`MetricColumns`. **Ceci reste une décision à ratifier par le coordinateur — voir §9.**

### 3.3 Ce que `MetricColumns` gagne

`MetricColumns` (`src/providers/synthetic/generate.ts`, interface INTERNE au provider, aucun type
gelé) porte deux colonnes de plus : `priceStatus` et `firstRegistrationYearMonth`.
`ListingColumnBatch` et `CoreColumns` les satisfaisaient déjà **structurellement**, et
`generateCore` les remplit déjà dans sa passe unique : le chemin critique du premier affichage
(DR-049) ne matérialise donc rien de plus — en particulier, la matérialisation PARESSEUSE des
colonnes de présentation n'est pas déclenchée.

Aucune signature de `src/providers/DataProvider.ts` n'a changé ; aucun type gelé n'a été touché ;
`src/engine/` n'a pas été modifié.

---

## 4. La sonde de contrat neuve — rouge, puis verte

`tests/contract/baseline-vs-engine.test.ts`, 12 cas, quatre sections :

- **§1 fidélité au moteur** — pour chaque snapshot commité de `dev` et `test` : `baseline.json.rows`
  contre `aggregate(batch, toutes les lignes, …).makeAggregates`, champ à champ (`listingCount`, et
  `min`/`max`/`p05`/`p50`/`p95`/`n` des trois métriques), **plus l'ordre des lignes** (`EX-DATA-70`).
  `sampleCoverage` et `modelCount` ne peuvent pas être comparés au moteur, qui publie `null` pour les
  deux (`D8-10`/`D8-23`, dette assumée et documentée) : la sonde ASSERTE ce `null` côté moteur, puis
  confronte les valeurs de l'artefact à leur définition — `sampleCoverage = 1` pour la sélection
  vide, et `modelCount` à un **recomptage indépendant** des `modelId` distincts fait dans la sonde
  elle-même (`EX-DATA-71`, clé réservée `0` exclue).
- **§1bis même accord sous filtre** — `aggregateByMake`/`aggregateByModel` sur une sélection
  déterministe (un index sur trois) contre le moteur sur les mêmes lignes. §1 n'exerce que la boucle
  DENSE de la baseline ; §1bis exerce `accumulate`, la boucle de l'écran A filtré, et le recalcul du
  seuil relatif sur cette sélection-là.
- **§2 type 7 calculé à la main** — lots construits à la main, `n = 2, 3, 4, 20`, avec les valeurs
  et les quantiles écrits en littéraux (`n = 2`, `{2 990, 20 995}` → `p50 = 11 992,5`), plus un cas
  qui vérifie que le provider n'arrondit pas.
- **§3 EX-DATA-19(2) et EX-DATA-25** — un lot de 20 annonces dont un prix à 300 € : `listingCount`
  reste 20 (`ARB-15`), `V_price` tombe à 19, `p50 = 19 000` ; un lot de 3 où la règle ne s'applique
  pas (`n < 12`) ; un lot où `modelYear` et `firstRegistrationYear` diffèrent délibérément ; un cas
  `EX-DATA-26` (première immatriculation inconnue).

**Aucune valeur de fixture n'est figée.** §1 et §1bis ne comparent que deux calculs faits dans le
même processus sur les mêmes octets ; §2 et §3 ne lisent aucun fichier. La sonde survit donc
telle quelle à la régénération des NDJSON par le lot `data-fix-2`.

### 4.1 Sortie ROUGE (code corrigé, `baseline.json` encore ceux d'`ae2bdbf`)

```
 × … > DR3-20 — la baseline commitée est le calcul du MOTEUR … > profil dev   954ms
 × … > DR3-20 — la baseline commitée est le calcul du MOTEUR … > profil test 3106ms
 ✓ … > EX-DATA-62 … > n = 2 — {2 990, 20 995}
 ✓ … (9 autres cas verts)
 Tests  2 failed | 9 passed (11)

AssertionError: dev/be-20260907T060000Z marque 74 : price.min: expected 1050 to be 1662
AssertionError: test/be-20260907T060000Z marque 74 : price.min: expected 600 to be 1662
```

(Le premier champ qui diffère est `price.min`, écarté par la sentinelle relative ; `expect` s'arrête
là. Le décompte complet des divergences est celui du tableau du §1 : 293/768 quantiles de prix par
marque au profil `test`, comme le reviewer l'avait établi, 1 037/2 358 en comptant les trois
métriques.)

### 4.2 Sortie VERTE (après régénération des six `baseline.json`)

```
 ✓ DR3-20 — la baseline commitée est le calcul du MOTEUR, champ à champ > profil dev   2494ms
 ✓ DR3-20 — la baseline commitée est le calcul du MOTEUR, champ à champ > profil test  9618ms
 ✓ DR3-20 — sous filtre aussi, le provider calcule ce que le moteur calcule             923ms
 ✓ EX-DATA-62 … n = 2 / n = 3 / n = 4 / n = 20 / pas d'arrondi
 ✓ EX-DATA-19(2) … annonce comptée mais hors V_price / règle inapplicable sous 12
 ✓ EX-DATA-25 … firstRegistrationYear / EX-DATA-26 année inconnue
 Test Files  1 passed (1)   Tests  12 passed (12)
```

---

## 5. Baselines régénérées, et ce qui change à l'écran

`npm run data:baseline` (profils `dev` et `test`), puis `--check` sur les deux : **CONFORME**.
`npm run data:validate` : `RESULTAT : profil conforme` sur les deux profils.

Ampleur du changement, artefact commité d'`ae2bdbf` contre artefact régénéré :

| Profil | quantiles modifiés | dont `price` | dont `mileage` | dont `year` | effectifs `n` modifiés | bornes `min`/`max` modifiées |
|---|---:|---:|---:|---:|---:|---:|
| `dev` (3 snapshots) | **1 722 / 3 645** | 565 / 1 215 | 543 / 1 215 | 614 / 1 215 | 207 / 1 215 | 343 |
| `test` (3 snapshots) | **3 092 / 7 074** | 1 039 / 2 358 | 936 / 2 358 | 1 117 / 2 358 | 387 / 2 358 | 675 |

Aucun `listingCount` ne bouge : l'effectif du marché affiché est inchangé, ce sont les fourchettes
qui le sont.

---

## 6. Écran A ↔ écran B — l'exemple chiffré demandé

Profil `test`, snapshot `be-20260907T060000Z`, **marque 16420, `listingCount = 2`** (le cas cité par
`DR3-20`). Prix de la marque : `{2 990 €, 39 000 €}`.

| | avant (`ae2bdbf`) | après | écran B (moteur, sélection « marque = 16420 ») |
|---|---|---|---|
| `price.p05` | 2 990 | **4 790,500000000002** | 4 790,500000000002 |
| `price.p50` | **2 990** | **20 995** | **20 995** |
| `price.p95` | 39 000 | **37 199,5** | 37 199,5 |
| `year.p50` | 2 011 | **2 017,5** | 2 017,5 |
| `mileage.p50` | 13 200 | **182 350** | 182 350 |

La médiane de prix affichée à l'écran A pour cette marque passe de **2 990 € à 20 995 €** — elle
valait le minimum de l'échantillon, elle vaut désormais le milieu, et c'est **exactement** ce que
l'écran B affiche pour la même sélection. Les deux écrans étaient en désaccord de 85,8 % en relatif ;
ils sont maintenant identiques au bit près.

(Rappel du §3.1 : sur une marque nombreuse, écran A sans filtre et écran B filtré n'ont pas la même
cellule `C₃`, donc pas le même seuil relatif ; ce n'est pas un désaccord mais `EX-DATA-86`. C'est
pourquoi la sonde compare la baseline à `aggregate()` sur la **sélection vide**, la sienne.)

---

## 7. Sondes existantes — aucune n'a dû être amendée

Rejoués intégralement après correction :

| Suite | Résultat |
|---|---|
| `npx vitest run src/providers --no-file-parallelism` | 156 / 156 |
| `npm test` (unitaire) | 757 / 757 |
| `npm run test:review` (D1…D9 + patho, dont D2, D3, D4, D6, D8) | 1 127 / 1 127 |
| `npm run test:data` (profil `dev`) | 152 / 152 |
| `KYCAR_DATA_PROFILE=test npm run test:data` | 152 / 152 |
| `npm run test:contract` | 105 / 105 (93 + 12 neuves) |

**Aucune sonde n'a été modifiée, aucun `it.fails` ajouté, aucun `skip`, aucune justification `D-31`
à écrire.** Le résultat est moins surprenant qu'il n'y paraît : aucune sonde de `tests/review/D3`,
`D2`, `D6` ou `D8` ne figeait de quantile PRODUIT PAR LE PROVIDER sur des données réelles — les
sondes d'écran travaillent sur des agrégats fabriqués à la main, et `tests/review/D4/quantiles-bin.test.ts`
teste déjà le type 7 côté moteur. `tests/contract/baseline-artifact.test.ts` reste vert parce qu'il
compare l'artefact à la fonction qui l'a produit : c'est précisément l'angle mort que la sonde neuve
comble, et je l'ai laissé tel quel — il prouve autre chose (fidélité aux octets, antériorité, repli,
refus).

**`tests/e2e/_helpers.ts` / `_expected.ts` : rien à aligner.** Vérifié : ces deux fichiers ne
dérivent aucun quantile (aucune occurrence de `p05`/`p50`/`p95`/`percentile`/`quantile`). Ils
dérivent des CARDINAUX (marques, offres, modèles) et des effectifs de cellule, tous inchangés.

---

## 8. Portes

| Porte | Commande | Résultat |
|---|---|---|
| Build | `npm run build` | 0 erreur, 0 avertissement |
| Lint | `npm run lint` | vert |
| Unitaire | `npm test` | 757 + 1 127 verts |
| Revue | `npm run test:review` | 1 127 / 1 127 (aucune dette `it.fails` nouvelle) |
| Contrat | `npm run test:contract` | 105 / 105 |
| Providers seuls | `npx vitest run src/providers --no-file-parallelism` | 156 / 156 |
| Données | `npm run test:data` (`dev` et `test`) | 152 / 152 × 2 |
| Baseline | `npm run data:baseline` (dev, test) puis `-- --check` | CONFORME × 6 |
| Schéma | `npm run data:validate` | `RESULTAT : profil conforme` (dev et test) |
| Paquet | `npm run size` | initial **121,91 Kio** gzip (avant : 121,80), total **135,81 / 300 Kio** |
| E2E ciblé | `KYCAR_E2E_PORT=4182 npx playwright test tests/e2e/parcours-p1.spec.ts --project=desktop` | 12 / 12 |
| E2E `EX-NFR-9` | `KYCAR_E2E_PORT=4182 npx playwright test -g "EX-NFR-9" --project=desktop` | 2 / 2 — ossature médiane **1 499 ms**, **premier chiffre médian 1 512 ms** (budget 2 000 ms), snapshot téléchargé **1,00 fois** |

`baseline.json` du profil `test` : **13 781 octets gzip** (12 622 avant), soit ≈ 13,5 Kio — le jalon
`EX-NFR-9` ne bouge pas. `reports/e2e/results.json` a été restauré (`git checkout --`) ; aucun
serveur `vite preview` résiduel, port 4182 libre.

---

## 9. Hors périmètre / pour le coordinateur

1. **`EX-DATA-25` : décision due (`D3-nn`).** J'ai corrigé l'axe année du provider
   (`modelYear` → `firstRegistrationYear`) alors que `DR3-20` ne le nomme pas. Motifs au §3.2. C'est
   le poste le plus visible du changement : **614 quantiles d'année au profil `dev`, 1 117 au profil
   `test`**, et l'écran A affiche désormais une fourchette d'immatriculation là où il affichait une
   fourchette d'année-modèle. Une ligne `D3-nn` est due avant la porte G9 (leçon 4.5bis de 2.8 :
   « un écart remonté au coordinateur est une décision due avant la porte »).
2. **`data/schema/snapshot-baseline.schema.json` a changé de type** (`integer` → `number` pour
   `p05`/`p50`/`p95`). Le `$id` reste `…/snapshot-baseline/1.0.0` et `BASELINE_ARTIFACT_VERSION`
   reste `1.0.0` : j'ai considéré qu'un élargissement de type qui accepte tous les documents
   antérieurs n'est pas une rupture de format. **HYPOTHÈSE E4** — si le coordinateur juge qu'un
   artefact de type 7 n'est pas le même document qu'un artefact au rang le plus proche, il faut
   passer `artifactVersion` en `2.0.0`, ce qui ferait ignorer (et non refuser) les artefacts
   antérieurs. Je ne l'ai pas fait : les trois verrous du §6bis de `DATA-MODEL.md` détectent déjà
   un artefact périmé par son `sha256`.
3. **`src/providers` importe maintenant `src/engine`.** Justifié au §2.1, sans cycle de production
   et à +0,11 Kio gzip. Si le coordinateur veut conserver l'indépendance de lot `D3 ∦ D4` de
   `ARCHITECTURE.md` §7.2, la seule autre issue propre est d'extraire `quantileType7`,
   `implausibleInCellThreshold` et les prédicats d'`EX-DATA-60` dans `src/types/` et de faire
   pointer le moteur ET les providers dessus — ce qui exige de toucher `src/engine/`, interdit à mon
   mandat. Aucune duplication n'a été introduite.
4. **`MakeAggregate.modelCount` reste `null` côté moteur** (`D8-10`, dette ouverte) : la sonde neuve
   ne peut donc pas le comparer au moteur et le recompte elle-même. Même chose pour
   `sampleCoverage`. Ce sont des dettes 2.8 connues, pas des constats nouveaux — mais elles limitent
   la portée de la phrase « égal champ à champ » du mandat, et je le dis plutôt que de la laisser
   croire totale.
5. **`MetricRange.p05/p50/p95` ne sont plus entiers dans TOUT le produit.** Les écrans arrondissent
   déjà à la présentation (`src/screens/market/format.ts` et ses 43 sondes sont vertes), et l'export
   CSV suit le même arrondi (`EX-DATA-64`). Rien de rouge, mais c'est un changement de nature des
   valeurs que traversent l'orchestration, la persistance IndexedDB et les URL partagées : à
   signaler à `acceptance` rev 3, qui exerce ces chemins de bout en bout.
6. **Régénération finale.** Comme prévu par `D3-37`, `data-fix-2` régénère les NDJSON : les six
   `baseline.json` que je commite seront périmés par le nouveau `sha256`. Le coordinateur rejoue
   `npm run data:baseline` sur les deux profils **en dernière écriture** après fusion des deux lots ;
   la sonde neuve et `data:validate` le vérifieront alors sans modification.

## 10. Hypothèses (E4)

- **E4-1** — L'élargissement `integer → number` du schéma de baseline n'est pas une rupture de
  format (`artifactVersion` inchangée). Voir §9.2.
- **E4-2** — La cellule `C` d'`EX-DATA-19(2)` pour un agrégat de marque publié par le provider est
  `C₃ = Σ` (la sélection), et non `C₂` (la marque). C'est la lecture qu'applique déjà le moteur, au
  nom de l'invariant I3, et `EX-DATA-86` réserve `C₁`/`C₂` à la détection d'outlier annonce par
  annonce. Le provider ne fait donc que reproduire le choix du moteur, il n'en tranche pas un neuf.
- **E4-3** — `makeScope` d'`aggregateByModel` restreint les groupes ÉMIS et non la sélection : le
  seuil relatif est calculé sur `rowIndices` entier. Aucun appelant ne dépend aujourd'hui du contraire
  (`SyntheticDataProvider.ts:174`, `FixtureDataProvider.ts:429` passent la sélection compilée).
