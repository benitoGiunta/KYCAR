# fix-app-3 — lot post-recette de la phase 2.9b

**Agent `fix-app-3` (Opus, effort high), 2026-09-08. Arbre principal `/home/user/KYCAR`, branche
`claude/kycar-project-ffcplk`, aucun autre agent actif, port 4180 libre.** Mandat :
`FIX-LEAD-DECISIONS-2.8.md` **D8-41** (`ACC-01`, MAJEUR) et **D8-42** (`ACC-05`, `ACC-15`), sur les
constats de `reports/ACCEPTANCE.md` §8.

Périmètre d'écriture annoncé : `src/orchestration/data-controller.ts`, `src/app.tsx` (câblage),
`src/screens/market/SummaryBar.tsx`, `src/screens/market/view-model.ts`, `tests/review/D8/`,
`tests/review/D6/`, `tests/e2e/`, ce rapport. **Un écart, borné et motivé, au §6.**
Interfaces gelées (`src/providers/DataProvider.ts`, `src/types/`) : **non modifiées** (E1).

| Commit | Contenu |
|---|---|
| `55eb261` | WIP — sonde D8 et attente E2E d'`ACC-01` (état ROUGE conservé sur disque) |
| `27c5a58` | `ACC-01` / `D8-41` — le mode 2 déclare les filtres `T` qu'il n'applique pas |
| `ffb3a75` | `ACC-05` + `ACC-15` / `D8-42` — cardinal des modèles et accord en nombre de la barre de synthèse |

---

## 1. ACC-01 / D8-41 (MAJEUR) — le filtre Carrosserie n'était ni appliqué ni déclaré en mode 2

### 1.1 Cause exacte (établie, pas supposée)

L'hypothèse de la recette est confirmée, et le chemin complet est le suivant :

1. `src/state/filter-registry.ts:569` — `bodyType` est de classe `DYNAMIC_BODY` ; `resolveFilterClass`
   (l. 703) en fait **`R` en mode 1 et `T` en mode 2** (`EX-SCR-82` #44, `EX-SCR-221`).
2. `src/orchestration/data-controller.ts:503` (`enterMode2`) — `partitionSelection(selection,
   'mode2')` scinde la sélection ; **seule la composante `r`** était lue. `bodyType` étant dans `t`,
   il n'atteignait pas `buildRefinePredicates`, donc ni prédicat ni `unsupported`.
3. `data-controller.ts` l. ~485 — `tSelection` est **figée** à `make=<id>;model=<id>` : c'est le seul
   argument que `fetchListingColumns` accepte (`TSelectionQuery`, interface gelée) et l'élagage O17
   l'exige. Le reste de la composante `T` n'était donc **ni poussé au provider ni déclaré**.
   `ListingColumnBatch` ne portant aucun champ `unsupportedFilterIds`, la déclaration ne pouvait pas
   davantage remonter du provider : `providers/synthetic/selection.ts:238`
   (`bodyUnresolvableAtModel`) ne voit jamais `body` sur ce chemin.
4. `src/app.tsx:1132-1133` — la coquille savait déjà rendre le bandeau (`bodyFilterUnapplied` →
   `ET-FILTRE-NON-APPLIQUE-BODY`, texte normatif de `D8-20`) ; elle attendait une liste qui restait
   **vide**. `unappliedFilterIds` était perdu à l'étape 2, pas plus loin.

Le défaut ne se limitait donc pas à `bodyType` : **tout** filtre de classe `T` posé en mode 2
(`gearType`, `bodyColor`, `equipment`, `keyword`… 46 identifiants) était sans effet **et** sans
mention — exactement ce que `D-03` interdit.

### 1.2 Correction

`src/orchestration/data-controller.ts` (l. 144-179, 503, 534-539) :

- `unappliedTFilterIds(t)` — liste les identifiants de classe `T` **réellement posés** (canonisation
  `serializeSelection(t, { defaults: FILTER_DEFAULTS })`, `EX-DATA-108`/`EX-NAV-8` : un filtre à sa
  valeur par défaut ou à valeur vide n'est pas posé), **moins** ceux absorbés par la route
  (`MODE2_ROUTE_ABSORBED_IDS`, même liste que `TAXONOMY_IDS` de `refine-predicates.ts`) ;
- `Mode2Payload.unappliedFilterIds = [...unsupported (R), ...unappliedTFilterIds(t)]`.

`src/app.tsx` (l. 1136-1146) : la liste nommée par le bandeau générique
`ET-FILTRE-NON-APPLIQUE` est celle du **mode courant** — en mode 2 celle d'`enterMode2` moins
`bodyType` (qui garde son bandeau propre), en mode 1 celle du provider. Sans cette lecture, les
identifiants nouvellement déclarés n'auraient produit aucune mention (le silence aurait persisté), et
la liste du mode 1, conservée en mémoire pendant la navigation vers B, n'y décrivait plus les
chiffres affichés.

**Aucune valeur n'est inventée ni amputée** : l'effectif publié reste celui de la cellule (1 352 pour
Opel Corsa), la mention dit pourquoi.

### 1.3 Les deux chemins d'entrée sont couverts

`src/app.tsx:459-478` — l'effet d'entrée en mode 2 a pour clé
`` `${view.makeId}:${view.modelId}:${currentQuery}:${mode2Attempt}` `` et appelle
`controller.enterMode2(makeId, modelId, selection)`. Le **rechargement direct d'URL** (`EX-NAV-18`)
et la **pose d'un filtre depuis le bandeau en mode 2** (qui change `currentQuery`, donc la clé)
empruntent le même appel : la correction couvre les deux par construction. Le test E2E ci-dessous
exerce le premier ; le second est exercé par la sonde `R-D8-2.9-04` (même appel, sélection
enrichie) et par les tests E2E existants du bandeau en mode 2, restés verts.

### 1.4 Preuves

Sonde neuve `tests/review/D8/mode2-filtres-t-2.9.test.ts` — `R-D8-2.9-01…06`.

ROUGE avant correction (`src/` remis à `cbf6b7c` par `git stash`, sonde inchangée) :

```
 ✓ R-D8-2.9-01 (prémisse : bodyType est en T en mode 2, bodyTypeIndexAvailable = false)
 × R-D8-2.9-02  AssertionError: expected [] to include 'bodyType'
 ✓ R-D8-2.9-03 (l'effectif est bien celui de la cellule entière)
 × R-D8-2.9-04  AssertionError: expected [] to deeply equal [ 'bodyType' ]
 ✓ R-D8-2.9-05 (le bandeau normatif D8-20 est bien câblé dans app.tsx)
 × R-D8-2.9-06  (la coquille ne lisait pas la déclaration du mode 2)
 Tests  3 failed | 3 passed (6)
```

VERTE après correction, sonde **non modifiée** : `Tests  6 passed (6)`.

Test E2E neuf `tests/e2e/partage-url.spec.ts` — « ACC-01 — en mode 2, un filtre Carrosserie d'URL est
déclaré non appliqué, sans changer l'effectif » (`GET /marche/54-opel/1918-corsa?body=3`) :

| | desktop | tablet | mobile |
|---|---|---|---|
| avant correction | **échec** (`toBeVisible` sur `[data-banner-id="ET-FILTRE-NON-APPLIQUE-BODY"]`) | **échec** | **échec** |
| après correction | ✓ 5,4 s | ✓ 4,3 s | ✓ 4,6 s |

Mesure relevée par le test (identique sur les trois projets) :
`1352 offres ; Filtre Carrosserie non appliqué à ce modèle (donnée indisponible) — l'effectif affiché
est complet, mais il ne tient pas compte de ce critère.` — les trois faits sont fixés ensemble :
jeton « Carrosserie » actif, effectif **inchangé** à 1 352, écart **nommé**. Le test vérifie aussi
l'absence de faux positif (sans `?body=3`, aucun bandeau).

---

## 2. ACC-05 / D8-42 — « 0 modèles » pendant le chargement

### 2.1 Cause exacte

`src/screens/market/MarketScreen.tsx:298-300` (avant correction) recomputait le cardinal comme la
taille d'un `Set` construit sur `data.modelAggregatesByMake`. Cette map est remplie par
`src/app.tsx:376-419` — un effet **séparé**, volontairement rendu à la boucle d'inactivité
(`requestIdleCallback` + plancher `MODEL_AGGREGATES_DELAY_MS`) pour ne pas disputer le thread à la
peinture des cartes (`EX-NFR-9`, budget 2 000 ms). Pendant les ~0,5 à 0,7 s qui séparent le marché
des agrégats MODÈLE, la map est vide et `new Set([]).size` vaut **`0`** : une donnée manquante
présentée comme un fait mesuré, ce que `D8-02` proscrit (« jamais 0 par défaut, `—` tant que la
donnée manque »). La source ne distinguait donc PAS « pas encore chargé » de « zéro réel ».

### 2.2 Correction

- `src/screens/market/view-model.ts:439` — `marketModelCardinal(makeAggregates,
  modelAggregatesByMake): number | null`, fonction pure : le cardinal vient d'abord de
  `MakeAggregate.modelCount` (publié avec les agrégats de **marque**, `D8-10`), donc **connu dès le
  premier affichage utile** ; repli sur les agrégats MODÈLE chargés ; `null` si ni l'un ni l'autre
  (aucune entrée, ou toutes `'unavailable'`, `EX-SCR-132`). Un `0` rendu est donc toujours un zéro
  **mesuré** (marque dont toutes les annonces sont à `modelId = 0`, `aggregate.ts:296-298`).
- `src/screens/market/SummaryBar.tsx` — `modelCount: number | null` ; `null` rend `— modèles`
  (`MISSING_VALUE`, U+2014), jamais `0`.

**Équivalence des deux sources vérifiée** (script hors dépôt, provider synthétique 100 000 annonces,
même référentiel) — la valeur affichée ne change pas, seul son instant d'apparition change :

| Sélection | Σ `MakeAggregate.modelCount` | `Set` des agrégats MODÈLE (ancienne source) |
|---|---:|---:|
| `/marche` (nu) | 3 021 | 3 021 |
| `?mmmv=74` | 120 | 120 |
| `?body=3&kmto=100000&priceto=20000` (P1) | 908 | 908 |

Les deux valeurs de la recette (3 021 et 908) sont retrouvées à l'unité.

### 2.3 Preuves

Sonde `tests/review/D6/summary-bar-cardinaux-2.9.test.ts` — `R-D6-2.9-01`, `R-D6-2.9-03`.

ROUGE avant : `R-D6-2.9-01` — `modelCount: null` rendait `« 0 modèles »` (`Intl.NumberFormat`
formate `null` en `0`), c'est-à-dire **exactement** le symptôme d'`ACC-05` reproduit hors navigateur ;
`R-D6-2.9-03` — `marketModelCardinal` n'existait pas. VERTES après, sondes non modifiées.

Test E2E neuf `tests/e2e/parcours-p1.spec.ts` — « ACC-05 — la barre de synthèse n'affiche jamais
« 0 modèles » avant le cardinal réel » : un échantillonnage à chaque image (`requestAnimationFrame`,
posé par `addInitScript` **avant** tout script de page) enregistre chaque texte successif de la barre
— là où `E2E-04` attend par `expect.poll` et ne voyait pas la valeur transitoire.

| | desktop | tablet | mobile |
|---|---|---|---|
| avant correction | **échec** — `2 rendus, 1 à « 0 modèles »` | **échec** — idem | *sauté* (`EX-SCR-135` : pas de cardinal en compact) |
| après correction | ✓ `1 rendu, 0 à « 0 modèles »` | ✓ idem | *sauté* |

---

## 3. ACC-15 / D8-42 — accord singulier/pluriel des cardinaux

**Cause** : `SummaryBar.tsx` concaténait les libellés au pluriel figé (`{formatInteger(makeCount)}
marques`, `{formatInteger(modelCount)} modèles`) ; seul le cardinal d'offres était accordé
(`formatOfferCount`, `format.ts:125`).

**Correction** : `cardinal(n, singulier, pluriel)` dans `SummaryBar.tsx` — en français le singulier
couvre 0 et 1, le pluriel commence à 2 : « 1 marque », « 0 modèle », « 2 marques ». Appliqué aux
marques, aux modèles et au suffixe « marque(s) affichée(s) ». La ligne à zéro d'`EX-SCR-131`
(`0 marque · 0 modèle · aucune offre`) est inchangée, littérale.

**Preuves** : `R-D6-2.9-04` et `R-D6-2.9-06` (rouges avant : `« 1 marques · 1 modèles · 1 offre »`,
`« 1 marques affichées »` ; vertes après), `R-D6-2.9-05` (non-régression du pluriel et de la ligne à
zéro). Test E2E neuf « ACC-15 — les cardinaux de la barre de synthèse s'accordent en nombre »
(`/marche?mmmv=74`) :

| | avant correction (rouge) | après correction (vert) |
|---|---|---|
| desktop / tablet | `1 marques · 0 modèles · 9 340 offres` | `1 marque · 120 modèles · 9 340 offres` |
| mobile (compact) | `1 marques · 9 340 offres` | `1 marque · 9 340 offres` |

La ligne « avant » cumule les deux constats : le pluriel fautif **et** le `0 modèles` d'`ACC-05`.

---

## 4. Portes (séquentielles, arbre principal, aucun autre agent actif)

| Porte | Résultat |
|---|---|
| `tsc --noEmit -p tsconfig.json` | **0 erreur** |
| `tsc --noEmit -p tsconfig.worker.json` | **0 erreur** |
| `tsc --noEmit -p tsconfig.review.json` | **0 erreur** |
| `npm run lint` | **vert** |
| `npm run build` | **0 erreur, 0 warning** — 149 modules |
| `npm run size` | **116,58 / 300 Kio** gzip initial (dont 13,46 Kio de worker) ; différé 0,00 / 400 Kio — `[size] OK: within budget` |
| `npm test` (unitaire) | **675 tests / 58 fichiers**, tous verts |
| `npm test` (sondes de revue) | **1 091 tests / 102 fichiers**, tous verts (1 079 avant ce lot, **+12**) |
| E2E touchés | `parcours-p1.spec.ts`, `partage-url.spec.ts`, `responsive.spec.ts` (3 projets) : **84 passés, 6 sautés, 0 échec inattendu** ; le seul `✘` est l'échec ATTENDU `DETTE D8-15 — EX-SCR-95` |

Les lignes `[size] FAIL …` visibles pendant `npm test` sont les **fixtures des sondes D1** (budgets
éprouvés sur des tailles fabriquées), pas une mesure du bundle : `npm run size` fait foi.

Budget : +0,24 Kio gzip par rapport à la recette (116,34 → 116,58 Kio), soit **38,9 %** du plafond.

---

## 5. Tests et sondes existants

**Aucun test, aucune sonde existante n'a été modifié** — ni assertion, ni `test.fail()`, ni `skip`.
Deux points de vigilance ont été traités par la conception plutôt que par une réécriture :

- `R-D6-09` (`tests/review/D6/responsive.test.ts`) lit la source de `SummaryBar.tsx` et exige
  `/!compact[\s\S]{0,120}modèles/` : le rendu conserve le littéral `modèles` immédiatement après la
  garde `!compact` (`{!compact ? <> · {modelCardinal ?? `— modèles`}</> : null}`) — sonde verte sans
  retouche.
- `structure-a11y.test.ts` (`0 marque · 0 modèle · aucune offre`) et `etats-ecran-a.test.ts`
  (`— marques · — modèles · — offres`) : les deux formulations littérales sont préservées.

---

## 6. Écart de périmètre (un seul, borné)

`src/screens/market/MarketScreen.tsx` — **deux lignes** : l'import de `marketModelCardinal` (l. 44)
et le calcul du cardinal au point d'appel de `<SummaryBar>` (l. 298-302, un `const` remplacé). Le
mandat prévoyait « si `app.tsx` passe `0` au lieu de `null` pendant le chargement, corrige le passage
dans `app.tsx` » : en fait, `app.tsx` ne passe pas ce cardinal — il fusionne `modelAggregatesByMake`
(l. 1323) et c'est `MarketScreen` qui le **recalcule** au rendu. Sans ces deux lignes, la correction
d'`ACC-05` n'atteint jamais l'écran. L'écart est ratifié par analogie avec **D8-28** (correction
causée par le mandat, bornée, prouvée rouge → vert, attribuée en commentaire dans le code). Aucune
autre ligne de `src/screens/` n'est touchée ; la logique vit dans `view-model.ts`, de mon périmètre.

---

## 7. Hypothèses (E4) et points laissés ouverts

1. **(Hypothèse)** Le libellé du bandeau générique `ET-FILTRE-NON-APPLIQUE` nomme les filtres par
   leur **identifiant KYCAR** (`unapplied.join(', ')`, `app.tsx:1189`), comportement préexistant du
   mode 1 que ma correction étend au mode 2. Un libellé humain viendrait de
   `src/components/filters/labels.ts` (D5), hors de mon périmètre : je n'y touche pas. Sans effet sur
   `ACC-01`, dont le bandeau (`bodyType`) a son texte normatif propre. À reprendre si une phase 2.10
   est ouverte.
2. **(Constat, pas dette)** Pousser la composante `T` complète à `fetchListingColumns` — ce que la
   classe `T` signifie (« rechargement par le provider ») — supposerait que le provider réel applique
   ces filtres à la source et que `localDatasetKey` en dépende. C'est une évolution de la **v2 de
   l'interface** `DataProvider` (famille `D8-32(2)`/`D8-36`), pas une correction de recette : elle
   changerait la clé de cache du mode 2 et le décompte « un appel provider par `localDatasetKey` »
   (`EX-SRCH-9ter`). Tant qu'elle n'est pas faite, la déclaration posée ici est la seule réponse
   honnête à `D-03`, et elle est complète.
3. **(Vérifié, pas une hypothèse)** L'écart entre les 69 modèles cités par `ACC-15` et les 120 que je
   mesure sur `?mmmv=74` ne vient pas de la correction : la ligne de la recette (« 1 marques · 69
   modèles · 280 offres ») portait une sélection à **280** offres, pas les 9 340 de `?mmmv=74` seul.
   Les deux sources du cardinal coïncident à l'unité sur les trois sélections du §2.2.
4. **Non traité (hors mandat)** : `ACC-02`, `ACC-03`, `ACC-04`, `ACC-06` à `ACC-14` restent la dette
   de présentation consignée par `D8-43`.
5. `reports/e2e/results.json` a été régénéré par chaque exécution E2E et **restauré** (`git checkout`)
   avant chaque commit, conformément à `D8-33`.
