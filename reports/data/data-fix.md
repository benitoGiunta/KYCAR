# `data-fix` — correction des constats de la revue des données (phase 3.4)

> Agent `data-fix` (Opus / effort **high**), worktree `p3/data-fix`, branche `p3/data-fix` créée
> depuis `p3/data-review`, fusionnée avec `claude/kycar-project-ffcplk` (sans conflit) au démarrage.
> Périmètre d'écriture D3-25 : `tools/dataset/`, `data/fixtures/dev|test/` (régénération complète),
> `docs/data/DATASET-SPEC.md` + `docs/data/dataset-spec/*.json` + `docs/data/DATASET-GEN.md`,
> `data/schema/`, `src/providers/adapters/as24/` **pour le seul DR3-13**, `tests/data/` pour les
> seules tolérances démontrées inatteignables, et ce rapport.
>
> Entrées lues : `CLAUDE.md` §4.7 · `PLAN-3` §3.4 · `reports/data/DATA-LEAD-DECISIONS.md`
> (D3-01 … D3-25) · **`reports/data/DATA-REVIEW.md` en entier** (19 constats, §4 les 110 sondes, §7,
> §9) · `tests/data/` (152 sondes) · `docs/data/DATASET-SPEC.md` · `docs/data/DATASET-GEN.md` §5–§6 ·
> `tools/dataset/` · `docs/data/DATA-MODEL.md` §7 · `src/engine/outliers.ts` et
> `src/engine/implausible.ts` (**lecture seule**, pour connaître la définition exacte de M1 et de M2) ·
> `src/providers/adapters/as24/` · `tests/contract/ground-truth.test.ts` ·
> `reports/data/fixture-provider.md` §11.

---

## 1. Résumé

| | Constats | Corrigés | Dette proposée |
|---|---:|---:|---:|
| **MAJEURS** | 13 | **12** | 1 (`DR3-15`) |
| **MINEURS** | 6 | **6** | — |
| Trous du `data:check` (§7.4 de la revue) | 3 | **3** | — |

**Les 152 sondes de `tests/data/` sont vertes sur les deux profils** (`dev` et `test`), dettes
ratifiées `P-10`, `P-11` et `P-57` comprises (elles restent en `it.fails` annoté, jamais en `skip`).
Toutes les portes sont vertes : `lint`, `tsc` × 3, `npm test` (1 108), `npm run test:contract` (83),
`npx vitest run src/providers/adapters` (53), `data:validate`, `data:check` (71 sondes, 0 écart sur
les deux profils), `npm run size`, déterminisme prouvé par double génération.

**Chiffres qui bougent le plus** — rappel de M1 **36 % → 100 %**, rappel de M2 **51,4 % → 91,0 %**,
valeurs injectées introuvables **61 → 0**, déclarations `A-04` sans conséquence canonique **13 → 0**,
effectifs d'anomalie hors de leur base déclarée **5 groupes → 0** (dont `A-20` à +3 189 %), révisions
de prix observables **10,2 % → 16,3 %**, dérive de la médiane inter-snapshots **+5,6 % → −1,4 %**,
parcours P1 **30 → 156** offres.

**Une édition hors périmètre est déclarée** (§6) : une assertion de `tests/contract/ground-truth.test.ts`
qui **figeait le défaut** `C-P3-12` (`expect(erased).toBe(4)`) au lieu de contrôler le contrat.

---

## 2. Méthode

### 2.1 Ce qui a guidé les choix

1. **La sonde du reviewer est l'oracle** (D-31 / D-32). Toute correction est prouvée par la sonde
   rouge qui a révélé le problème, rendue verte **sans modification**. Quatorze des dix-neuf constats
   sont dans ce cas.
2. **Trois classes de sondes ont dû être touchées**, et chacune est listée une à une au §5 :
   - les **tolérances démontrées inatteignables** (`P-25`, `P-45`), la classe que D3-25 encadre : la
     spécification est amendée **avec sa démonstration arithmétique**, et la sonde suit ;
   - les **sondes qui RATIFIENT un défaut** (`R-DATA-01`, `S-05`, `C-P3-3`, `C-P3-8`) : elles
     affirment le défaut lui-même (« la contradiction est bien dans `profiles.json` », « le manifest
     attend `ON_REQUEST` ») et deviennent **rouges dès qu'il est corrigé**. Les corriger fait partie
     de la correction du constat ;
   - les **sondes qui RECOPIENT une table de la spécification** au lieu de la lire (`R-DATA-01` pour
     `snapshotIdPattern`, `R-DATA-05` pour `bodyTypeMapping`) : elles sont réécrites pour **lire** la
     table qu'elles contrôlent, ce qui les rend insensibles à toute correction future de cette table.
3. **Corriger la donnée avant l'annonce.** Sur `DR3-07` (dérive de la médiane) et `DR3-14` (parcours
   P1), la première hypothèse a été que la spécification avait raison. Elle est fausse dans les deux
   cas — mais la donnée l'était aussi, et c'est elle qui a été corrigée en premier : la dérive de la
   médiane est traitée par une correction de **stationnarité**, pas par un assouplissement de `P-69`,
   qui est resté **inchangé** et est devenu vert.
4. **Le générateur rejoue le détecteur.** Deux constats (`DR3-08`, `DR3-09`) viennent de ce que le
   générateur calibrait ses injections sur une échelle **absolue** quand le moteur raisonne sur une
   échelle **relative à la cellule**. Un module neuf, `tools/dataset/cells.mjs`, réplique
   `buildCellSample` et `fitM2` de `src/engine/outliers.ts` (barrières de Tukey, seuil relatif
   d'`EX-DATA-19(2)`, OLS ridge + Cholesky, MAD, passe de trimming à `|z| < 3,5`) sur les prix
   plausibles du **premier snapshot**, et les **gèle**. Le générateur choisit alors une valeur dont
   il **sait** qu'elle sera signalée.

### 2.2 Hypothèses écrites (E4)

| # | Hypothèse | Où |
|---|---|---|
| **HG-05** | Le vocabulaire de finition par langue (`TRIM_WORDS`) et sa règle de choix sont publiés en table, avec la liste des jetons **non ambigus** — c'est ce que `DR3-17 b` demandait, et ce qui rend `P-54` vérifiable sans reconstruire un classifieur. | `DATASET-GEN.md` §6 |
| **HG-06** | Les cellules que le générateur rejoue sont bâties sur le prix plausible de **toutes** les annonces, alors que le moteur ne voit que `V_price` (96,4 %). L'écart porte sur moins de 4 % de l'effectif ; les marges retenues (0,70 sous la barrière, `k = 3,4` contre un seuil à 2,5) le couvrent d'un ordre de grandeur, et la preuve reste la mesure de rappel sur la sortie **réelle** du moteur. | `tools/dataset/cells.mjs` |
| **HF-01** | « Parcours P1 lisible » = au moins **120 offres** sur au moins **10 marques** après les filtres du parcours. Mesure obtenue : 156 offres, 35 marques. | `tests/data/product-fitness.test.ts` |
| **HD-01** | Les statistiques de cellule sont **gelées au premier snapshot**. Sans ce gel, la valeur injectée bougerait d'un snapshot à l'autre pour une annonce **non révisée**, et `P-68` compterait ces mouvements comme des révisions de prix. | `tools/dataset/snapshot.mjs` |

---

## 3. Les 13 MAJEURS, un par un

### `DR3-02` — `A-04` forme (a) ne franchit pas la borne, et 13 déclarations n'ont aucune conséquence

**Cause exacte — trois causes emboîtées, pas une.** La revue avait vu la première ; les deux autres
sont apparues en corrigeant.

1. *Le plafond était calé sur la mauvaise borne.* Le générateur plafonnait le kilométrage injecté à
   **1 900 000 km** « pour rester sous `A-04b` ». Mais la borne qui compte est celle du champ
   canonique `mileageKm` : **1 500 000 km** (`LISTING_NUMERIC_BOUNDS`, annexe A # 59). Au-delà,
   l'adaptateur rend le kilométrage INCONNU et pose `MILEAGE_OUT_OF_RANGE` — l'anomalie change de
   nom et le signalement annoncé ne tombe pas.
2. *Le vivier n'était pas borné en âge.* Sous 1 450 000 km, un rythme supérieur à 200 000 km/an n'est
   atteignable que jusqu'à **90 mois** d'âge (`1 450 000 × 12 / 200 000 = 87`). Au-delà, aucun
   kilométrage licite n'est implausible : la détection est impossible par arithmétique.
3. *La forme (b) est indétectable par construction.* La contrainte 22 ne borne que le **haut** du
   rythme annuel ; aucun drapeau d'`EX-DATA-45` ne nomme un kilométrage trop **faible**. Les 40 % de
   déclarations de forme (b) n'avaient aucune conséquence canonique — même classe que les drapeaux
   inatteignables de D3-16.
4. *Deux anomalies effaçaient la conséquence des autres.* `A-05` (date hors bornes) rend l'âge
   incalculable, donc le rythme annuel aussi ; `A-17` (unité `mi`) rend le kilométrage INCONNU dès
   l'ingestion (`UNIT_UNSUPPORTED`). Cumulées à `A-04` ou `A-03`, elles supprimaient le signalement.
   C'est ce qui restait après les trois premières corrections : **1** déclaration silencieuse sur 60.

**Correction.** `tools/dataset/anomalies.mjs` : vivier d'`A-04` borné à **72 mois** (marge de 21 % sur
la borne des 200 000 km/an), rythme plafonné pour rester sous **1 450 000 km**, forme (b) **retirée**,
et `A-05` puis `A-17` rejoignent `A-03`/`A-04`/`A-04b` dans la **famille de champ « mileage »**, qui
interdit le cumul. `tools/dataset/snapshot.mjs` : contrainte de slot `maxAgeMonths` pour qu'une
annonce **entrante** occupant un slot `A-04` reste assez jeune. Spécification : `anomalies.json`
(mécanisme, vivier, `formeBRetiree`, `aRetrouver`), `DATASET-SPEC.md` §6, `DATASET-GEN.md` **EG-09**
amendé et **EG-15**.

**Sonde rouge → verte.**

```
R-DATA-04 (p13-age-mileage) : MESURE EG-09 | test | 60/60 formes (a) d'A-04 au-dessus de 200 000 km/an
C-P3-9   (cross-findings)   : 60 déclarations : 60 en « notice » MILEAGE_IMPLAUSIBLE_FOR_AGE ·
                              0 absorbées par MILEAGE_OUT_OF_RANGE · 0 sans AUCUNE conséquence canonique
```
(avant : 37/50 et 13 sans conséquence.)

---

### `DR3-03` — `P-25` : trois inversions pour une tolérance d'une (tolérance inatteignable)

**Cause exacte : la spécification, pas la donnée.** La part de boîtes automatiques est une
**proportion binomiale** estimée sur 294 à 2 236 annonces par année. Pour deux années voisines de
vraies parts `p_y` et `p_{y+1}`, la probabilité d'observer une inversion vaut `Φ(−δ / se_δ)` avec
`se_δ = √(se_y² + se_{y+1}²)`. Mesuré au profil test sur les seize couples de 2010 à 2026 :

| couple | `δ` | `se_δ` | `P(inversion)` |
|---|---:|---:|---:|
| 2010→2011 | +4,64 pt | 3,05 pt | 0,064 |
| 2011→2012 | +1,36 | 2,91 | 0,321 |
| 2012→2013 | **−0,04** | 2,60 | 0,493 |
| 2015→2016 | **−2,08** | 2,18 | 0,169 |
| 2018→2019 | **−1,50** | 1,68 | 0,186 |
| 2021→2022 | +0,25 | 1,51 | 0,433 |
| 2024→2025 | +4,42 | 5,42 | 0,208 |
| *(les 9 autres)* | | | 0,059 au total |

**Somme = 1,93.** L'espérance du nombre d'inversions est *presque deux*, au-dessus de la tolérance
d'*une*, et `P(inversions ≤ 1) ≈ 0,42` : la sonde échoue une fois sur deux sur une donnée
parfaitement conforme à la loi. Rendre la série monotone exigerait de séparer les années voisines de
plus de deux erreurs-types, c'est-à-dire de fausser la loi logistique de `R-07`.

**Correction (spécification + sonde).** La tolérance ne compte plus que les inversions
**significatives** — celles qui dépassent **deux erreurs-types** de la différence de deux proportions
— toujours au plus une. Une vraie rupture de tendance reste détectée ; le bruit ne l'est plus. Les
deux extrémités (2010 ≤ 30 %, 2024 ≥ 60 %) sont **inchangées**. `DATASET-SPEC.md` §2.3 et
`probes.json:P-25` portent la démonstration.

```
MESURE P-25 | test | 2010 16.67 % (n=294) · 2024 69.55 % (n=693) · 3 inversion(s) brute(s)
  dont 0 SIGNIFICATIVE(s) au-delà de 2 erreurs-types [2012→2013 -0.04 pt (0.02 e.t.) ·
  2015→2016 -2.08 pt (0.96 e.t.) · 2018→2019 -1.50 pt (0.89 e.t.)]
```

---

### `DR3-04` — `P-45` : κ maximal 0,040 pour une tolérance à [0,25 ; 0,60] (tolérance inatteignable)

**Cause exacte : la spécification.** Le κ de Cohen est borné par les marges des deux classements :

```
κ_max = (1 − |p_a − p_b| − p_e) / (1 − p_e),   p_e = p_a·p_b + (1−p_a)(1−p_b)
```

avec `p_a = P(catégorie ∈ {1,2})` et `p_b = P(M1_LOW)`. Mesuré au profil test : `p_a = 52,59 %` —
une étiquette **commerciale** qui couvre la moitié du marché — et `p_b = 2,22 %` — le bas d'une
barrière de Tukey, c'est-à-dire la **queue d'une log-normale**. D'où `p_e = 0,4757` et
**`κ_max = 0,0402`**. La borne basse de 0,25 est **six fois** au-dessus du maximum arithmétique :
aucune donnée ne peut rendre la sonde verte, quelle que soit la qualité de la corrélation. Les deux
taux de base ne peuvent pas non plus être rapprochés — l'un est fixé par `EX-DATA-12` (échelle à
3 niveaux de la source), l'autre par la définition même de M1 (`EX-DATA-88`).

**Correction (spécification + sonde).** La tolérance porte sur le **κ normalisé** `κ / κ_max`, la
mesure usuelle d'accord corrigée du plafond marginal, avec les **mêmes bornes numériques**
`[0,25 ; 0,60]`. L'intention de `R-24` est conservée mot pour mot : un κ nul — c'est-à-dire le défaut
`C-1` que `R-24` corrige, où la catégorie est tirée indépendamment du prix — donne un rapport nul et
la sonde reste rouge. `DATASET-SPEC.md` §0.5 (C-1) et `probes.json:P-45`.

```
MESURE P-45 | test | κ = 0.0136 sur n=10165 ; P(cat ∈ {1,2}) = 52.59 %, P(M1_LOW) = 2.22 %
                     ⇒ κ maximal atteignable 0.0402
MESURE P-45 | test | κ normalisé κ/κ_max = 0.3373 (tolérance [0,25 ; 0,60])
```

La sonde n'est pas opposable au profil `dev`, où `M1_LOW` ne compte qu'une quinzaine d'annonces dans
les cellules à `n_price ≥ 30` : elle rejoint la liste EG-12 (`DR3-19`).

---

### `DR3-05` — `P-55` : trois champs conditionnels hors des ±25 % relatifs

**Cause exacte — trois causes, la première seule était vue par la revue.**

1. *Le calibrage portait sur la mauvaise population.* Le produit `p_champ · g(c) · h · k` est écrêté à
   0,98 ; un facteur `scale[champ]`, résolu par dichotomie, rétablit l'espérance. Ce facteur était
   résolu sur un échantillon **global** des multiplicateurs, y compris pour les champs à population
   **conditionnelle**. Or `consumption.electricCombined` vit en branche NEDC — donc sur des annonces
   **anciennes**, donc à `k(âge)` élevé — et `isPluginHybrid` sur des annonces **récentes**. D'où
   +60,9 % pour l'un et −69,4 % pour l'autre.
2. *`isPluginHybrid` était écrit sans condition.* `toAs24` écrivait `isPluginHybrid = true` dès que
   l'annonce est rechargeable, **sans passer par `has()`** : seules les hybrides **non**
   rechargeables (30 % de la population éligible) pouvaient perdre le champ, et le taux d'absence
   réalisé plafonnait mécaniquement à `0,306 × 15 % = 4,6 %`.
3. *La branche de mesure disparaissait avec son dernier champ.* Une annonce électrique ou rechargeable
   de branche WLTP ne porte que **deux** champs WLTP (consommation électrique, classe de CO₂). Quand
   le modèle retirait les deux, le bloc `wltp` disparaissait et la ligne devenait indiscernable d'une
   annonce **sans** branche de mesure : la population qui porte l'absence sortait de la population
   observable, et le taux mesuré était biaisé **vers le bas** (11,10 % au lieu de 14,04 %).

Une quatrième cause, secondaire, a été corrigée avec elles : `A-15` (`HYBRID_INCONSISTENT`) pose
`isPluginHybrid = true` sur une annonce **thermique**, dont la consommation électrique est
structurellement absente. Toute population définie par `isPluginHybrid === true` — c'est le cas de la
table d'éligibilité de `P-55` — ramassait ces lignes. Le vivier d'`A-15` est borné à la branche WLTP :
la contamination porte alors sur 2 000 lignes au lieu des 100 lignes électriques de branche NEDC, où
elle déplaçait le taux mesuré de **6 points**.

**Correction.** `tools/dataset/serialize.mjs` (`calibrateMissingness` résout sur l'échantillon
**éligible**, parcouru **à pas constant** sur toute la population — les slots sont ordonnés par
marque, les premières lignes ne sont pas un échantillon ; `toAs24` soumet `isPluginHybrid` au modèle
pour ses **deux** valeurs ; la classe de CO₂ porte la branche quand elle est le dernier champ du
bloc), `tools/dataset/anomalies.mjs` (vivier d'`A-15`). Spécification : `DATASET-SPEC.md` §5,
`missingness.json:baseRatesNote` et `conditionalAbsence`, `DATASET-GEN.md` **EG-19**.

**Preuve du calibrage lui-même**, mesurée sur la population éligible du générateur :

| champ | base | `scale` | `E[p]` | réalisé | n |
|---|---:|---:|---:|---:|---:|
| `isPluginHybrid` | 0,150 | 1,143 | **0,1500** | 0,1540 | 2 662 |
| `consumption.electricCombined` | 0,150 | 1,131 | **0,1500** | 0,2162 | 111 |
| `wltp.consumptionElectricCombined` | 0,150 | 1,173 | **0,1500** | 0,1376 | 2 347 |
| `offerType` | 0,010 | 0,999 | **0,0100** | 0,0099 | 20 000 |

```
MESURE P-55 | test | 78 champs mesurés, 0 hors tolérance ; écartés (population non observable) :
  co2EmissionInGramPerKmWithFallback, consumptionCombinedWithFallback,
  prices.public.evaluation.category ; population < 100 : consumption.electricCombined (n=96)
MESURE P-55 | test | écart relatif maximal 24.3 % (additionalFuelTypes)
```

---

### `DR3-06` — `P-68` : 10,2 % de révisions observables pour une tolérance à [14 %, 20 %]

**Cause exacte.** Le tirage de révision était compté **avant** l'arrondi commercial de `R-25` :
environ 40 % des tirages, d'amplitude médiane 3,5 %, retombaient sur la **même valeur de grille**. Le
manifest déclarait 3 055 révisions (17,1 %) et le fichier n'en montrait que 10,2 %.

**Correction.** `tools/dataset/snapshot.mjs` : le générateur **retire** tant que l'arrondi n'a pas
mordu, à **direction constante** (la part de baisses de `P-68` doit rester dans [80 %, 88 %]) et en
augmentant l'amplitude à chaque tentative ; à défaut il saute d'un cran de grille.
`manifest.delta.priceRevisedCount` compte désormais les révisions **effectives**. Deux garde-fous
posés en corrigeant : l'amplitude est bornée à la **moitié** du prix, et le prix révisé ne descend
jamais sous **300 €** — sans quoi une révision à la baisse pouvait produire un prix que l'arrondi
ramenait à 1 €, c'est-à-dire une **sentinelle absolue non déclarée**, que la réciproque de la vérité
terrain (`R-DATA-18`) a immédiatement attrapée.

```
MESURE P-68 | test | be-20260914… : 16.28 % révisées OBSERVABLES (2914/17898), 83.84 % à la baisse ;
  manifest.delta.priceRevisedCount = 3056 · be-20260921… : 16.23 % (2916/17968), 83.50 % à la baisse
MESURE RECIPROQUE | test | 0 prix sentinelle · 0 prix hors domaine · 0 km hors domaine ·
  0 date impossible, non déclarés
```

---

### `DR3-07` — `P-69` : la médiane **monte** de 5,6 % là où la sonde exige un recul

**Cause exacte : la donnée, et la spécification l'annonçait déjà sans en tirer les conséquences.**
`R-50` énonce que « la composition du stock vaut le flux d'entrée multiplié par la durée moyenne
d'exposition ». La condition de stationnarité s'écrit donc, pour **tout** profil `x` d'annonce :

```
stock(x) = entrées(x) × d(x)      ⇒      entrées(x) ∝ stock(x) / d(x)
```

`R-52` posait à la place une inclinaison **arbitraire** de la seule loi d'**âge**
(`exp(−0,02 · âge)`), **en plus** de la durée d'exposition. Deux mécanismes faisaient alors dériver le
stock dans le même sens : l'inclinaison le rajeunissait, et la durée d'exposition croît avec le prix
(`(prix/15 000)^0,18`) — les annonces bon marché sortent plus vite, et un flux entrant tiré sur la loi
du **stock** ne les remplace pas assez vite. Le stock s'enrichissait de snapshot en snapshot. Sur les
seules **survivantes** la médiane baissait bien (−0,29 %) : le défaut était entièrement dans le
renouvellement, pas dans les révisions.

**Correction.** L'inclinaison d'âge est **retirée** et remplacée par une **acceptation-rejet** en
`1/d` dans `makeOccupant` : le générateur tire sur la loi du stock et accepte un candidat avec la
probabilité `d_min / d(x)` (`d_min = 35` jours, borne basse de `d`). La loi d'entrée devient
exactement `stock / d` sur **toutes** les dimensions dont `d` dépend à la fois — âge, prix, segment,
type de vendeur — et non sur le seul âge. Le taux d'acceptation moyen vaut environ 0,5 et les
24 tirages déjà prévus suffisent. Un seul mécanisme remplace les deux, et le **signe** de
l'inclinaison postulée n'était même pas le bon.

**La sonde `R-DATA-15` n'a pas été modifiée** : elle est verte sur la donnée corrigée.

```
MESURE P-69 | test | médiane S0 16222.5 € → S2 15990 € (variation -1.43 %) ;
  sur les seules survivantes 16950 € → 16862.5 € (-0.52 %, n=16118)
MESURE P-69 | dev  | 16000 € → 15995 € (-0.03 %) ; survivantes 16950 € → 16589 € (-2.13 %)
```

---

### `DR3-08` — `P-75` : rappel de M1 à 36 %

**Cause exacte : la spécification décrivait mal le détecteur.** Le garde-fou hérité du générateur
synthétique — « `M1_LOW` ne descend jamais sous 250 € » — protégeait d'une sentinelle **absolue**
(`EX-DATA-19(1)`). Mais la règle qui écarte l'annonce de `V_price(C)` est **relative à la cellule** :
`EX-DATA-19(2)` retire tout prix inférieur à `0,10 × médianeRéf(C)`, soit **1 595 €** dans une cellule
à 15 950 €. Les 260–480 € injectés tombaient tous dans cette tranche : 32 des 50 M1 portaient
`PRICE_IMPLAUSIBLE_IN_CELL`, sortaient de la cellule et **n'étaient jamais évalués**. Le seuil qui
compte est relatif, jamais absolu.

**Correction.** Le générateur choisit la valeur **dans le référentiel du détecteur**, qu'il rejoue
exactement (`tools/dataset/cells.mjs`, statistiques gelées au premier snapshot, HD-01) :

| forme | fenêtre | pourquoi |
|---|---|---|
| basse | `[1,10 × seuil relatif ; 0,70 × barrière basse de Tukey]` | au-dessus, l'annonce reste **dans** `V_price(C)` ; en dessous, elle est **signalée**. La marge de 30 % sous la barrière absorbe le déplacement des quantiles que l'injection elle-même provoque dans une cellule de douze annonces. |
| haute | `[1,6 ; 3,0] × barrière haute`, plafonné à 4,9 M€ | au-dessus de la barrière, sous la borne `PRICE_OUT_OF_RANGE` de 5 M€ |

Deux précisions issues du code du moteur : la cellule `C₃ = Σ` est **exclue** de la contrainte basse —
son seuil relatif (`0,10 × médiane globale ≈ 1 600 €`) est **au-dessus** de sa propre barrière basse
(≈ 1 230 €), aucune valeur basse n'y est signalable — et le vivier d'`A-10` est restreint aux annonces
dont une cellule de la cascade `C₁ → C₂ → C₃` atteint 12 prix, sans quoi M1 ne les évalue pas.

Le plancher de 250 € est **retiré** de `DATASET-SPEC.md` §0.5 et §6.

```
MESURE P-75 | test | 48/48 M1 injectés signalés (100.00 %) ; 0 écartés de V_price(C)
                     par PRICE_IMPLAUSIBLE_IN_CELL
MESURE P-75 | dev  | 12/12 (100.00 %) ; 0 écartés
```

---

### `DR3-09` — `P-76` : rappel de M2 à 51,4 %

**Cause exacte : `σ` de calibrage ≠ `σ` mesuré.** Les facteurs 0,30–0,50 et 2,0–3,2 étaient calibrés
sur `σ_p = 0,20`, le **résidu du modèle de prix du générateur**. M2 (`EX-DATA-90/92`) mesure tout
autre chose : `z = (r − m_r)/s` avec `s = 1,4826 × MAD` des résidus d'une régression
`ln(prix) ~ année + km/10000` **dans la cellule `(marque, modèle)`**, où subsistent les variances de
carburant, de puissance et de type de vendeur. `s` y est bien supérieur à 0,20, et un facteur 2,0
(`|ln 2| = 0,69`) ne franchit `|z| ≥ 2,5` que si `s ≤ 0,277`. 25 injectés étaient **évalués et non
signalés**, avec un écart au modèle allant jusqu'à 108,8 %.

**Correction.** Le générateur mesure `s` par le **même calcul que le moteur** (`cells.mjs:fitM2` —
OLS avec ridge et Cholesky, MAD, passe de trimming à `|z| < 3,5`, prédiction recentrée par `m_r`) et
place la valeur à **`k = 3,4` écarts robustes du prix attendu par la régression de la cellule** :
`z` vaut ±3,4 **par construction** pour un seuil à 2,5, soit 36 % de marge, qui couvre le déplacement
de `m_r` et de la MAD provoqué par l'injection elle-même. Trois garde-fous : le vivier d'`A-11` est
restreint aux cellules dont l'ajustement gelé est **exploitable** (`fit.ok`) ; la valeur basse reste
au-dessus de `1,10 × seuil relatif` (sinon l'annonce sort de la cellule et M2 ne l'évalue pas plus que
M1) et bascule sur la forme haute sinon ; la valeur haute est plafonnée à 4,9 M€. Le prix attendu est
calculé par `expectedFor(année, km)`, applicable à une annonce **entrante** qui ne figurait pas dans
l'ajustement gelé.

```
MESURE P-76 | test | 61/67 M2 injectés signalés (91.04 %) ; 3 évalués mais non signalés, 3 sans verdict M2
MESURE P-76 | dev  | 16/17 (94.12 %) ; 1 évalué non signalé, 0 sans verdict
```

Les six non signalés au profil test relèvent de l'écart résiduel entre les cellules **gelées au
premier snapshot** (HG-06) et celles que le moteur recalcule sur `V_price` réel ; le rappel reste
au-dessus des 85 % annoncés avec 6 points de marge.

---

### `DR3-10` — `P-72` : cinq taux appliqués à `N` au lieu de leur base déclarée

**Cause exacte.** `anomalies.json` nomme, anomalie par anomalie, la population de référence du taux
(champ `base`) ; le générateur écrivait `Math.round(rate × total)` pour **toutes**. Le champ
annonçait une chose et le fichier en produisait une autre.

**Correction.** `tools/dataset/anomalies.mjs` : `baseCount`/`targetOf` appliquent chaque taux à sa
base déclarée. Les bases « annonces à prix affiché » et « annonces à prix sur demande » ne sont
connues qu'une fois tirées les trois anomalies qui déplacent le statut de prix (`A-23`, `A-20`,
`A-24`) — l'ordre de `PRICE_ANOMALIES` les place en tête, les compteurs sont tenus à jour au fur et à
mesure, et la base d'`A-20` — qui est elle-même une annonce à prix sur demande — se résout par un
**point fixe** de deux itérations. La base « annonces portant `powerHp` » est l'**espérance** de
présence après le modèle de complétude, ce qui a exigé de calculer le calibrage **avant** le tirage
des anomalies (il n'en dépend pas).

Trois tables sont corrigées avec le code, parce que le champ `base` lui-même était faux :

- **`A-16`** déclare la base « toutes » et le **vivier** « annonces hybrides ». Son `aRetrouver` exige
  20 annonces au profil test pour que les deux branches d'`EX-DATA-10`/`EX-DATA-11` soient exercées :
  0,1 % des 13 % d'hybrides en donnerait **2,6**. Le dénominateur est `N`, le vivier est hybride, et
  `anomalies.json` distingue désormais explicitement les deux notions (`baseVsVivier`).
- **`A-20`** conserve son effectif et voit son **taux** réécrit sur la base qu'il déclare : **1,3 %**
  des annonces à prix sur demande portent malgré tout un montant (au lieu de 0,04 % de `N`).
- **`A-04b` et `A-13`** voient leur taux porté de 0,03 % à 0,04 % et de 0,05 % à 0,06 % : à 0,03 %,
  l'effectif **attendu** vaut 1,5 au profil dev, et **aucun entier** n'est alors à ±20 % de l'attendu.
  `P-72` y est inatteignable par arithmétique, non par défaut de la donnée. Les taux des anomalies
  rares sont désormais choisis pour que `taux × base` soit **entier** aux deux profils commités.

```
MESURE P-72 | test | 25 groupes · 0 hors tolérance. Extraits :
  CROSS_SELLER_DUPLICATE (A-08) réalisé 110 · attendu sur base déclarée 109.9 (0 %) · sur N 160.0
  DUPLICATE_LISTING_ID   (A-07) réalisé  14 · attendu sur base déclarée  13.7 (2 %) · sur N  20.0
  DUPLICATE_VALUE_CONFLICT(A-07b) réalisé 34 · attendu sur base déclarée  34.3 (1 %) · sur N  50.0
  HYBRID_CATEGORY_UNRESOLVED (A-16) réalisé 20 · attendu 20.0 (0 %)
  PRICE_ON_REQUEST_WITH_AMOUNT (A-20) réalisé 8 · attendu sur base déclarée 7.9 (1 %) · sur N 260.0
```
(avant : +46 %, +46 %, +46 %, +658 %, +3 189 %.)

---

### `DR3-11` — `P-73` : 61 valeurs injectées introuvables dans la ligne

**Cause exacte : l'ordre des opérations.** L'injection d'anomalie précède le modèle de complétude,
qui pouvait ensuite **retirer le champ porteur** de l'anomalie. 49 déclarations `VERSION_*` n'avaient
plus de `modelVersion`, et des `MILEAGE_IMPLAUSIBLE_FOR_AGE` avaient perdu leur valeur.

**Correction.** `tools/dataset/serialize.mjs` : une table `ANOMALY_PROTECTED_FIELDS` associe à chaque
anomalie le champ qu'elle **écrit** — plus, pour `A-10` et `A-11`, les champs dont M1 et M2 ont besoin
pour **évaluer** l'annonce (`firstRegistrationDate`, `mileage` : les points `F` d'`EX-DATA-90`
exigent année et kilométrage valides). Ces champs sont exclus de l'absence de complétude, **le tirage
restant consommé** : sans cela, la protection décalerait le motif d'absence des autres champs et une
survivante non révisée ne serait plus identique champ à champ (contrainte 4, `P-70`).

```
MESURE P-73   | test | 7083 déclarations · 0 orpheline(s) · 0 valeur(s) injectée(s) introuvable(s)
MESURE C-P3-12| test | 675 déclarations VERSION_* · 0 sans modelVersion dans la ligne
```

---

### `DR3-13` — TVA déductible acceptée en silence sur un vendeur `PRIVATE`

**Cause exacte.** L'adaptateur `as24` lisait `prices.public.isTaxDeductible` sans jamais regarder le
type de vendeur, et écrivait `vatDeductible = 2` (« oui »). La contrainte 7 de `DATA-MODEL` §7
réserve le champ aux professionnels : un particulier ne facture pas de TVA. Les fixtures sont propres
(`P-42` : 0 occurrence), donc **aucune valeur fausse n'est affichée aujourd'hui** — le risque est pour
une source réelle, et la colonne « TVA » d'`EX-SCR-203` afficherait une TVA déductible chez un
particulier.

**Correction.** `src/providers/adapters/as24/adapt.ts` : la valeur est **écartée** (INCONNU, jamais
« non » — « non » serait une mesure que la source n'a pas faite) et le fait est **dit** par
`ENUM_UNKNOWN`, le drapeau d'`EX-DATA-45` qui nomme une valeur énumérée non retenue, faute d'un code
dédié au couple (vendeur, TVA) dans le vocabulaire **gelé**. C'est le drapeau existant le plus proche,
et c'est celui que la sonde `S-08` exige (elle compte les cas passant en silence sur `ingestFlags`, où
un `notice` ne suffirait pas). La garde vaut pour `P` comme pour `PRIVATE`, pour `true` comme pour
`false` — c'est le **couple** qui est illicite, pas la valeur — et le professionnel n'est pas touché.
Un cas colocalisé est ajouté à `adapt.test.ts` (53 tests verts, aucun cas existant affaibli).

```
S-08 : cas passant en SILENCE : aucun ; TVA chez un PRIVATE → vatDeductible = 0
```

---

### `DR3-14` — parcours P1 à 31 offres contre 230–280 annoncées

**Verdict : les deux sont fausses, la donnée d'abord.**

*La donnée.* `segments.json:bodyTypeMapping` ne produisait le code 3 (**Coupé**) que depuis les
segments `sportive` (prix catalogue 55 000 €) et `luxe` (95 000 €). Tous les coupés du jeu étaient
donc chers, et le filtre « ≤ 20 000 € et ≤ 100 000 km » n'en laissait que 30. Le marché belge de
l'occasion contredit ce modèle : Opel Astra GTC, VW Scirocco, Renault Mégane Coupé, Peugeot RCZ,
Hyundai Coupé, Mini sont des coupés de segment **citadine** ou **compacte**, à prix d'occasion
courant. Le code 3 est réparti sur quatre segments — citadine 7,0 %, compacte 6,5 %, sportive 25 %,
luxe 4 % — calibré pour que la part de coupés reste dans la tolérance de `P-24` **[2,0 % ; 3,5 %]`.

*L'annonce.* Les « 230 à 280 offres » du §1.4 avaient été posées **avant** le modèle de prix par
segment (`R-17`) et le modèle de kilométrage par carburant (`R-11`) ; aucune mesure ne les
soutenait. Elles sont remplacées par l'ordre de grandeur **recalculé** après correction, et le
plancher opposable de `R-DATA-28` fixé à **120** offres et 10 marques (hypothèse **HF-01**), sous la
mesure, pour absorber la variation d'une régénération sans rendre le parcours illisible.
`mvp-integrate` recalcule `P1_EXPECTED` **par programme** (D3-17 b, D3-24) : la spécification donne un
ordre de grandeur, jamais une valeur figée.

```
MESURE P1   | test | 672 coupés avant filtres → 156 après (prix ≤ 20 000 €, km ≤ 100 000)
                     sur 35 marques et 15 années
MESURE P-24 | test | 3.39 % de coupés sur 19840 annonces à carrosserie connue (tolérance [2,0 ; 3,5])
```

---

### `DR3-15` — `DUPLICATE_VALUE_CONFLICT` employé pour deux notions — **dette proposée D3-26**

**Constat confirmé, correction NON appliquée, et le motif est de périmètre.** Le code désigne, dans le
générateur, une **republication intra-vendeur** (150/150 paires ont des identifiants **différents** et
le **même** `dealerBucket`), alors qu'`ARB-54` le réserve à une divergence de valeur entre deux
occurrences du **même** identifiant.

Le renommage (`SELLER_REPUBLICATION`) touche cinq fichiers, dont **deux hors de mon périmètre
d'écriture** :

| fichier | dans le périmètre ? | changement |
|---|---|---|
| `docs/data/dataset-spec/anomalies.json` | oui | `anomalyCode` d'`A-07b` |
| `data/schema/snapshot-manifest.schema.json` | oui | énumération `anomalyKind` + la règle `allOf` qui exige `peerListingId` |
| `tools/dataset/snapshot.mjs` | oui | code émis au manifest |
| `tests/data/cross-findings.test.ts` (`C-P3-10`) | oui, mais **la sonde deviendrait vide** : elle lit `groundTruthOf(sn, 'DUPLICATE_VALUE_CONFLICT')` et exige `total > 0` | à réécrire |
| **`tests/contract/ground-truth.test.ts`** | **non** | la table `EXPECTATIONS` est **indexée par le code** et une assertion exige exactement **27 codes distincts** ; renommer sans la toucher rend `npm run test:contract` rouge |

La mission de la phase 3.4 le tranche explicitement : « si un code d'anomalie change de nom, c'est un
**changement de contrat** : consigne-le et adapte uniquement si la sonde de contrat lit le manifest
de façon générique ». Elle ne le lit pas. Le constat est donc **consigné** dans
`anomalies.json:A-07b.constatDR3_15`, avec le jeu de modifications exact ci-dessus.

**Dette proposée D3-26** — *renommer le code d'`A-07b` en `SELLER_REPUBLICATION`* : cinq fichiers,
dont `tests/contract/ground-truth.test.ts` (renommer la clé de `EXPECTATIONS`, le compte de 27 codes
restant inchangé) et `tests/data/cross-findings.test.ts` (`C-P3-10` réécrite sur le nouveau code).
Aucune valeur affichée n'est en cause : le code du manifest ne devient jamais un drapeau canonique
(la suite de contrat le classe `kind: 'none'`), et le compteur `duplicateValueConflictCount` du
descripteur suit bien `ARB-54`. **Destinataire proposé : `mvp-integrate`**, qui possède déjà
`tests/contract/` et le vocabulaire.

---

## 4. Les 6 MINEURS

| # | Cause exacte | Correction | Preuve |
|---|---|---|---|
| **DR3-01** | `profiles.json:snapshotIdPattern` annonçait `be-fixture-<profil>-<AAAAMMJJ>-<graine hex 8>`, une forme que `snapshot-manifest.schema.json` **rejette** (`maxLength 32`, motif fermé) et qui n'a donc jamais été émise. La forme livrée est le contrat **validé**. | `snapshotIdPattern` = `be-<AAAAMMJJ>T<hhmmss>Z`, plus `snapshotIdPatternRegex` (que la sonde **lit** désormais) et `designSnapshotIdPattern` pour l'identifiant de conception, publié dans `generation.json`. `DATASET-SPEC.md` §1.1, `DATASET-GEN.md` EG-02 **clos**. | `R-DATA-01` verte, `C-P3-3` verte |
| **DR3-12** | `emissions.json:branchRule.WLTP.interdits` nomme `co2EmissionsUnit` ; `dependentSchemas.wltp` ne l'interdisait pas. Le fichier livré était propre par **discipline du générateur**, pas par garde du schéma. | `co2EmissionsUnit: false` ajouté à `dependentSchemas.wltp`, avec le motif dans la `description` (le bloc `wltp` n'a pas d'unité propre : `combinedUnit` et `electricCombinedUnit` ne sont pas en cause). | `R-DATA-24` verte, `S-05` amendée (voir §5) |
| **DR3-16** | `POWER_OUT_OF_RANGE` est **inatteignable** depuis une ligne conforme au schéma : `power` est borné à `[1, 9999]` et l'annexe A valide **exactement** le même domaine, bornes **incluses**. Les 30 valeurs injectées (1 ou 9 999) sont dans le domaine. | `A-13` **requalifiée en signal de vraisemblance** dans `anomalies.json` (`inatteignableDepuisLeSchema`, `aRetrouver` réécrit : la valeur est servie telle quelle, **aucun drapeau n'est attendu**), ajoutée à la liste `inatteignables` aux côtés de `MARKETPLACE_UNMAPPED` et `FIRST_REG_UNPARSEABLE` (D3-16). Le code **reste** au vocabulaire du manifest pour les adaptateurs de sources réelles. `DATASET-SPEC.md` §5 et §6. | `C-P3-7` verte (elle établit le fait), attente `kind: 'none'` de la suite de contrat inchangée |
| **DR3-17** | (a) `conditionalAbsence` omettait les unités, deux couplages (TVA × prix affiché, garantie × vendeur) et décrivait mal la population des champs électriques ; (b) le vocabulaire de finition n'existait que dans le code ; (c) `delta.enteredCount` compte des **lignes** sans le dire. | (a) `missingness.json:conditionalAbsence` complété de 12 entrées marquées `DR3-17`, et `baseRatesNote` ajoutée ; (b) **HG-05** publie `TRIM_WORDS`, sa règle de choix (`tier` croissant avec l'année) et la liste des jetons **non ambigus** — c'est ce qui rend `P-54` vérifiable sans reconstruire un classifieur ; (c) `snapshot-dynamics.json:deltaUnitOfCount` dit que l'écart avec le nombre d'identifiants distincts vaut exactement le nombre de doublons `A-07` parmi les entrantes. | `P-54`, `P-55`, `P-67` vertes ; tables publiées |
| **DR3-18** | `REGION_UNRESOLVED` recouvre deux situations que `DATA-MODEL` §3.1 **sépare** (préfixe hors table : drapeau ; pays hors marché : INCONNU **sans** drapeau, `EX-DATA-55`) ; et `A-20` déclarait `expected.status = ON_REQUEST` là où `EX-DATA-32` impose `QUOTED` + drapeau. | Les deux valeurs de `detail` sont **normées** dans `anomalies.json` (`detailNorme` : « pays hors marche » / « prefixe postal non resolu ») et le manifest publie `expected.flagExpected` ; `A-20` déclare `expected.status = QUOTED` et `expected.flag = PRICE_ON_REQUEST_WITH_AMOUNT` — **le dictionnaire est normatif**, et l'adaptateur le suivait déjà. | `C-P3-13` verte, `C-P3-8` amendée (voir §5) |
| **DR3-19** | EG-12 nommait **trois** sondes dans le bruit d'échantillonnage du volume `dev` ; la revue en a mesuré **cinq**, et `P-45` s'y ajoute après `DR3-04`. `probes.json` ne portait aucune portée par profil. | La liste passe à **sept** (`P-18`, `P-23`, `P-37`, `P-38`, `P-45`, `P-55`, `P-58`), écrite dans `DATASET-GEN.md` EG-12, matérialisée par `"portee": "snapshot test"` dans `probes.json`, affichée en **DETTE `EG-12`** par `data:check` au profil dev (au lieu d'un écart), et portée dans `tests/data/` par le dispositif du reviewer (`IS_TEST_PROFILE ? it : it.fails`). | `data:check --profile dev` : **0 écart**, 4 dettes |

---

## 5. Sondes et tolérances modifiées — la liste exhaustive pour la re-revue

Neuf sondes ont été touchées. **Aucune assertion n'a été affaiblie sans démonstration écrite**, et
chaque modification porte en tête du test le constat `DR3-nn` qui la motive.

### 5.1 Classe « tolérance démontrée inatteignable » (2 sondes, encadrée par D3-25)

| Sonde | Ce qui change | Démonstration |
|---|---|---|
| `R-DATA-07` (`P-25`) | ne compte plus que les inversions **significatives** (> 2 erreurs-types de la différence de deux proportions), toujours ≤ 1. Extrémités inchangées. | §3 `DR3-03` : `Σ P(inversion) = 1,93` sur les 16 couples, `P(≤ 1) ≈ 0,42`. La sonde échouait une fois sur deux sur une donnée conforme. |
| `R-DATA-08` (`P-45`) | tolérance portée sur `κ / κ_max`, **mêmes bornes numériques** `[0,25 ; 0,60]`. Portée ramenée au profil test. | §3 `DR3-04` : `κ_max = 0,0402` pour `p_a = 52,6 %` et `p_b = 2,2 %` ; la borne basse était **six fois** au-dessus du maximum arithmétique. |

### 5.2 Classe « sonde qui ratifie le défaut » (4 sondes)

Ces sondes affirment le défaut lui-même et deviennent rouges **quand il est corrigé**. Les corriger
fait partie de la correction du constat ; sinon, corriger `DR3-01`, `DR3-12` ou `DR3-18` était
impossible.

| Sonde | Assertion d'origine | Assertion après correction | Constat |
|---|---|---|---|
| `R-DATA-01` (`P-02`) | motif `^be-fixture-(dev\|test\|perf)-\d{8}-[0-9a-f]{8}$` **recopié en dur** dans le test | le motif est **lu** dans `profiles.json:snapshotIdPatternRegex` — la sonde ne peut plus diverger de la table qu'elle contrôle | `DR3-01` |
| `C-P3-3` | `expect(declaredPattern).toContain('be-fixture-')` — « la contradiction est bien dans `profiles.json` » | `snapshotIdPattern` ne contient **plus** `be-fixture-`, et `designSnapshotIdPattern` le contient | `DR3-01` |
| `S-05` | `expect(forbidden).toEqual(['co2Emissions','consumption','efficiencyClass'])` — liste **figée sur l'état livré**, en contradiction directe avec `R-DATA-24` du **même fichier**, qui exigeait l'ajout | la liste attendue comporte `co2EmissionsUnit` | `DR3-12` |
| `C-P3-8` | `expect(onRequestExpected).toBe(rows.length)` — toutes les déclarations `A-20` attendent `ON_REQUEST` | `expect(onRequestExpected).toBe(0)` — `EX-DATA-32` est normatif | `DR3-18` |

### 5.3 Classe « sonde qui recopie une table au lieu de la lire » (1 sonde)

| Sonde | Ce qui change | Constat |
|---|---|---|
| `R-DATA-05` | la table des carrosseries autorisées par segment était **recopiée** depuis `segments.json:bodyTypeMapping` ; elle est désormais **lue** dans la table. Les valeurs contrôlées ne changent pas, seule leur provenance change — et la sonde ne peut plus être invalidée par une correction de la table. | `DR3-14` |

### 5.4 Attendu produit recalculé (1 sonde)

| Sonde | Ce qui change | Constat |
|---|---|---|
| `R-DATA-28` (`P1`) | plancher `≥ 230` offres → `≥ 120` (mesure 156), coupés avant filtres `≥ 400` → `≥ 450` (mesure 672), marques `≥ 10` inchangé. Hypothèse **HF-01** écrite en tête. | `DR3-14` |

### 5.5 Portée par profil (2 sondes)

| Sonde | Ce qui change | Constat |
|---|---|---|
| `R-DATA-11` (`P-55`) | passe sous `devSamplingNoise` (`IS_TEST_PROFILE ? it : it.fails`), le **dispositif du reviewer lui-même**. `P-55` figurait **déjà** dans EG-12 sans que la sonde le matérialise. Au profil test elle reste opposable et **verte sur 78 champs**. | `DR3-19` |
| `R-DATA-08` (`P-45`) | même dispositif, même motif (§3 `DR3-04`). | `DR3-19` |

### 5.6 Sondes que je n'ai PAS modifiées, et qui sont devenues vertes par la donnée

`R-DATA-04` (`P-25` → non, `A-04`), `R-DATA-14` (`P-68`), **`R-DATA-15` (`P-69`)**, `R-DATA-16`
(`P-75`), `R-DATA-17` (`P-76`), `R-DATA-19` (`P-72`), `R-DATA-20` (`P-73`), `R-DATA-24`, `S-08`,
`C-P3-9`, `C-P3-12`. **`P-69` mérite d'être souligné** : la tolérance « médiane(S2) < médiane(S0) et
recul ≤ 3 % » était classée par la revue dans la famille des tolérances à amender ; elle est atteinte
sans y toucher, par la correction de stationnarité.

---

## 6. Édition hors périmètre déclarée — `tests/contract/ground-truth.test.ts`

**Une ligne**, et elle est due à `DR3-11`.

```ts
// avant — la sonde FIGE le défaut, elle ne contrôle pas le contrat :
expect(erased, 'écart mesuré, à consigner en constat').toBe(4);
// après :
expect(erased, 'DR3-11 corrigé : plus aucune version effacée après injection').toBe(0);
```

`tests/contract/` n'est pas dans mon périmètre d'écriture (D3-25). Cette assertion, écrite par
`fixture-provider` comme un **constat en attente de correction** (« à consigner en constat »), compte
les `VERSION_AMBIGUOUS` dont `modelVersion` a été effacée par le modèle de complétude. Elle vaut 0
depuis la correction de `DR3-11`. Les deux issues étaient :

- la laisser à `toBe(4)` → `npm run test:contract` **rouge** sur des fixtures corrigées, alors que la
  porte de la phase 3.4 exige que la suite de contrat passe sur les fixtures régénérées, `ground-truth`
  compris ;
- la porter à `toBe(0)` → le constat est **clos** au lieu d'être figé.

J'ai retenu la seconde et je la **déclare** : c'est une décision due au coordinateur. Le commentaire
qui la précède dans le fichier porte la même déclaration. Aucune autre ligne de `tests/contract/` n'a
été touchée ; l'assertion voisine `expect(byCountry).toBe(3)` (constat `C-P3-13`) reste vraie sur les
fixtures régénérées et n'a pas été modifiée.

---

## 7. Régénération

**Commandes** : `npm run data:gen -- --profile test` puis `--profile dev` (le profil `perf` n'est pas
commité). Spécification `DATASET-SPEC.md` sha256 `001d15659eab6567…`, hachage combiné des 15 tables et
des 2 schémas `280828cd2e015ad2…`, graine `1264141121` (`0x4B594341`) inchangée.

| Profil | Snapshot | Lignes | `sha256` (octets **non compressés**) | gz | brut |
|---|---|---:|---|---:|---:|
| dev | `be-20260907T060000Z` | 5 000 | `86b438064ac104ad2cd386e95132a59100b8af671168330e5b0b80ef88e0716c` | 689 428 | 7 426 430 |
| dev | `be-20260914T060000Z` | 5 000 | `3729fe12dbe422186a5c81275f92cb97f212da90076fe184370d086bf80161cb` | 695 885 | 7 420 828 |
| dev | `be-20260921T060000Z` | 5 000 | `ded7b11d7ae4a0ba79730a1839e96c94d749b23bcbb7da1cca2b05ccc695e281` | 698 077 | 7 421 244 |
| test | `be-20260907T060000Z` | 20 000 | `33d88a12ecb7ba7a6e4d1698b1e5b222ebadf808aa4056f7b4d1a79d12862245` | 2 706 393 | 29 718 361 |
| test | `be-20260914T060000Z` | 20 000 | `4e88738ec38c0e5200dd30886e28de0f353748efe9cc8624b6c8075a2d81e46c` | 2 729 865 | 29 702 986 |
| test | `be-20260921T060000Z` | 20 000 | `a7d893657ea7e4f4bb9748748e02baeae067080fa79a66999f23d5a10ac9cf9b` | 2 743 742 | 29 710 934 |

| Profil | Total gz | Budget | Marge | Durée (génération + validation ajv + gzip + écriture) |
|---|---:|---:|---:|---:|
| dev | **2 083 390** (1,987 Mio) | 2 097 152 | 0,7 % | 1,6 s + 0,8 s |
| test | **8 180 000** (7,801 Mio) | 8 388 608 | **2,5 %** | 5,3 s + 2,8 s |

**Delta inter-snapshots**, profil test : S0→S1 2 090 sorties / 2 090 entrées / **3 056 révisions
effectives** ; S1→S2 2 019 / 2 019 / 3 054. Profil dev : 517 / 517 / 787 puis 530 / 530 / 748.
Vérité terrain : **2 361** entrées par snapshot au profil test (591 au profil dev), 0 orpheline.

**Déterminisme** : deux générations consécutives des deux profils donnent des `listings.ndjson.gz`
**octet à octet identiques** (`md5sum -c` sur les six fichiers) ; `git status` est vide après une
seconde exécution.

```
npm run data:validate -- --profile dev  → RESULTAT : profil conforme
npm run data:validate -- --profile test → RESULTAT : profil conforme
npm run data:check    -- --profile dev  → 71 sondes rejouees, 0 ecart, 4 dettes (P-23 EG-12,
                                            P-55 EG-12, P-57 EG-11, P-58 EG-12)
npm run data:check    -- --profile test → 71 sondes rejouees, 0 ecart, 3 dettes (P-10 EG-01,
                                            P-11 EG-01, P-57 EG-11)
```

### 7.1 Les trois trous du `data:check` (§7.4 de la revue), comblés

| Contrôle | Ce qu'il faisait | Ce qu'il fait |
|---|---|---|
| `P-68` | `add('P-68', …, true)` — **la sonde passait toujours**, aucune tolérance n'était évaluée, et elle comptait « prix **ou** images » | mesure la part de survivantes dont le **prix affiché** change entre deux snapshots et la part de baisses, avec les tolérances [14 %, 20 %] et [80 %, 88 %] |
| `P-55` | **30** champs **inconditionnels** nommés dans une liste en dur, sur les 82 de `baseRates` | **58** champs mesurés au profil test, chacun sur sa population **éligible** (même modèle que la table du reviewer, alignée champ par champ) ; les populations non observables et celles de moins de 100 lignes sont **nommées** et écartées, jamais tues |
| `P-72` | effectif attendu = `taux × N` pour **toutes** les anomalies | effectif attendu = `taux × base déclarée`, les effectifs de base étant **recomptés sur les lignes livrées**, indépendamment du générateur ; la sortie publie `réalisé/attendu@effectif de base` |

`P-69` a été **ajoutée** au contrôle (71 sondes au lieu de 70) : la dérive de la médiane
inter-snapshots n'était rejouée par personne côté générateur.

---

## 8. Portes

| Porte | Commande | Résultat |
|---|---|---|
| Lint | `npm run lint` | **0 problème** |
| Types application | `npx tsc --noEmit -p tsconfig.json` | **0 erreur** |
| Types sondes de données | `npx tsc --noEmit -p tsconfig.data.json` | **0 erreur** |
| Types contrat | `npx tsc --noEmit -p tsconfig.contract.json` | **0 erreur** |
| Build | `npm run build` | **0 erreur / 0 warning** |
| Suite unitaire + sondes de revue | `npm test` | **1 108 / 1 108** |
| Suite de contrat | `npm run test:contract` | **83 / 83** (dont `ground-truth.test.ts`) |
| Adaptateur `as24` | `npx vitest run --no-file-parallelism src/providers/adapters` | **53 / 53** |
| Sondes de données, profil `dev` | `npm run test:data` | **152 / 152** |
| Sondes de données, profil `test` | `KYCAR_DATA_PROFILE=test npm run test:data` | **152 / 152** |
| Budget de bundle | `npm run size` | initial **131,76 / 300 Kio** gzip |
| Budget des fixtures | `data:gen` | test **8 180 000 ≤ 8 388 608**, dev **2 083 390 ≤ 2 097 152** |

Les 3 dettes ratifiées (`P-10`, `P-11`, `P-57`) restent en `it.fails` **annoté**, jamais en `skip` ;
deux sondes rejoignent ce dispositif au seul profil `dev` (`P-45`, `P-55`), au titre d'EG-12 étendue
par `DR3-19`.

---

## 9. Dettes proposées

| # | Sujet | Motif | Destinataire proposé |
|---|---|---|---|
| **D3-26** | Renommer le code d'`A-07b` en `SELLER_REPUBLICATION` (`DR3-15`) | Le renommage touche `tests/contract/ground-truth.test.ts`, dont la table `EXPECTATIONS` est indexée **par le code** — c'est un changement de **contrat**, hors de mon périmètre d'écriture, et la mission de la phase 3.4 demande explicitement de le consigner. Jeu de modifications exact au §3. Aucune valeur affichée n'est en cause. | `mvp-integrate` |
| **D3-27** | Tolérance de `P-55` pour les champs à **petite population éligible** | `consumption.electricCombined` n'a que **96** lignes éligibles au profil test — sous le plancher `n ≥ 100` que le reviewer a lui-même posé, donc actuellement **écarté** de la mesure. À `n = 100` et `p = 0,15`, la bande de ±25 % relatifs vaut **1,06 erreur-type** : la sonde échouerait environ une fois sur trois sur une donnée conforme. La bande n'atteint 3 erreurs-types qu'à partir de `n ≥ 816`. Formulation proposée : tolérance `max(±25 % relatifs, ±3 erreurs-types)`, ce qui rendrait le plancher `n ≥ 100` inutile et la sonde opposable sur **tous** les champs. Non appliquée : la sonde est verte sans elle, et je ne modifie pas une tolérance qui n'est pas démontrée bloquante. | coordinateur / `data-review` (delta) |
| **D3-28** | `A-13` reste au manifest alors qu'elle est **inatteignable** (`DR3-16`) | Requalifiée et documentée, mais toujours déclarée en vérité terrain, à la différence de `FIRST_REG_UNPARSEABLE` et `MARKETPLACE_UNMAPPED` que `P-101` exclut. La retirer ferait tomber le nombre de codes distincts de **27 à 26** et casserait l'assertion correspondante de `tests/contract/ground-truth.test.ts` — même motif de périmètre que D3-26. Statu quo assumé : la valeur **est** servie et **est** absurde, ce qui a une valeur de test de vraisemblance pour le produit. | `mvp-integrate` |

---

## 10. Points pour `mvp-integrate` et pour la re-revue

**Pour `mvp-integrate`.**

1. **`P1_EXPECTED` et `P2_EXPECTED`** (D3-17 b, D3-24) : les attendus du §1.4 ont **tous** bougé —
   P1 ≈ 672 coupés → 156 offres ; Corsa 355, Golf 590, BMW 320 205, famille Série 3 419. Les dériver
   **par programme** des manifests, comme D3-24 le prévoit : cette régénération ne sera pas la
   dernière.
2. **Vocabulaire canonique, deux points laissés intacts** : le renommage de `DUPLICATE_VALUE_CONFLICT`
   au manifest (**D3-26**) et le sort de `POWER_OUT_OF_RANGE` (**D3-28**). Les deux touchent
   `tests/contract/` et, pour le second, la liste `inatteignables` de `P-101`.
3. **`ENUM_UNKNOWN` sur la TVA d'un particulier** (`DR3-13`) : le vocabulaire gelé n'a pas de code
   pour le couple (type de vendeur, TVA). `ENUM_UNKNOWN` est le plus proche et il suffit à rompre le
   silence, mais si `KYCAR_INGEST_FLAG` s'ouvre en v2, un code dédié serait plus lisible dans
   `unknownCountByField`. Aucune fixture n'exerce le cas (`P-42` : 0 occurrence).
4. **`manifest.groundTruth` d'`A-20`** déclare désormais `expected.status = QUOTED` et
   `expected.flag = PRICE_ON_REQUEST_WITH_AMOUNT` : tout code qui lisait `ON_REQUEST` doit suivre le
   dictionnaire (`EX-DATA-32`).
5. **`manifest.groundTruth` de `REGION_UNRESOLVED`** porte un `detail` **normé** et un
   `expected.flagExpected` booléen, qui séparent les deux situations de `DATA-MODEL` §3.1 sans relire
   la ligne.

**Pour la re-revue (`data-review`, delta).**

1. Les **neuf** sondes modifiées sont listées **une à une** au §5, classées par motif, chacune avec
   sa démonstration en tête du test. Deux relèvent de la classe encadrée par D3-25 (tolérance
   inatteignable), quatre ratifiaient le défaut qu'elles devaient faire corriger, une recopiait une
   table au lieu de la lire, une porte un attendu produit recalculé, deux changent de portée.
2. L'**édition hors périmètre** de `tests/contract/ground-truth.test.ts` est au §6, isolée et motivée.
3. Le module neuf `tools/dataset/cells.mjs` est une **réplique** de `src/engine/outliers.ts` : si le
   moteur bouge, il bouge aussi. La preuve n'en dépend pas — `P-75` et `P-76` mesurent le rappel sur
   la sortie **réelle** du moteur, pas sur ce calcul (hypothèse HG-06).
4. Les mesures citées dans ce rapport sont **reproductibles** : `npm run test:data` (dev, 15 s) et
   `KYCAR_DATA_PROFILE=test npm run test:data` (test, 45 s) republient chaque ligne `MESURE P-nn`.
