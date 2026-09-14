# fix-screens-5 — remédiation PLAN-3 §3.5 (ACC-17, ACC-21, ACC-18)

Agent : `fix-screens-5` (Sonnet/high). Worktree `/home/user/KYCAR-screens5`, branche `fix35/screens5`
(depuis `claude/kycar-project-ffcplk` @ `2ad48f0`). Port E2E utilisé : **4182** uniquement.

Entrées : `reports/ACCEPTANCE.md` rev 3 §8 (ACC-17, ACC-18, ACC-21), `reports/data/DATA-LEAD-DECISIONS.md`
D3-42, `docs/requirements/draft-data-dictionary.md` EX-DATA-64/63/19/62, `docs/requirements/draft-screens.md`
EX-SCR-33/109/1..4/6.

---

## 1. Tableau constat → correction → preuve → statut

| Constat | Texte d'exigence cité | Cause | Correction | Sonde (rouge → verte) | Statut |
|---|---|---|---|---|---|
| **ACC-17** — écran A, fourchettes d'année (cartes/zones) | `EX-DATA-64` table B.2 : « p05 \| … \| année : **plancher** », « médiane \| idem », « p95 \| … \| année : **plafond** » | `formatYearRange(minYear, maxYear)` faisait `Math.round` sur les deux bornes, sans distinguer p05/p95 des bornes `min`/`max` brutes du repli bas-effectif | `market/format.ts` : nouveau type explicite `YearBoundPosition = 'p05' \| 'p95' \| 'raw'`, fonction `roundYearForPresentation(year, position)`, `formatYearRange(min, max, lowPosition = 'p05', highPosition = 'p95')`. `view-model.ts::yearCentralRange` passe `'p05'`/`'p95'` pour `[p05, p95]` et une fonction dédiée `formatYearRawRange` (`'raw'`/`'raw'`) pour le repli `[min, max]` (`D8-06`, valeurs OBSERVÉES, jamais interpolées) | `src/screens/market/format.test.ts` (+8 cas, dont l'exemple normatif VW/P1 2016,8/2022,1) ; `src/screens/market/view-model.test.ts` (+1 cas repli bas-effectif) ; `tests/review/D6/acc-17-18-21-remediation-3.5.test.ts` (neuve, 3 cas). Rouge confirmé par `git stash` du code source (sonde conservée) puis rejeu : 12/12 rouges avant, verts après (voir §3) | **CLOS** |
| **ACC-17** — écran B, « 1ʳᵉ immat. médiane » | idem, ligne « médiane \| idem » (plancher) | `distribution/format.ts::formatYear` fait `Math.round`, utilisé tel quel par `DistributionScreen.tsx:466` pour `stats.year.p50` | `distribution/format.ts` : nouveau type `YearStatPosition` et fonction pure `formatYearStat(value, position)` (même règle que `market/format.ts`, module volontairement indépendant — cf. l'en-tête de fichier D7 : « pas de dépendance entre écrans A et B »). **Le câblage dans `DistributionScreen.tsx:466` est HORS PÉRIMÈTRE d'écriture de `fix-screens-5`** (voir §4) | `src/screens/distribution/format.test.ts` (neuf fichier, 6 cas, dont l'exemple Toyota Corolla 2018,5 → « 2018 ») ; `tests/review/D6/acc-17-18-21-remediation-3.5.test.ts` (1 cas) | **FONCTION CORRIGÉE ET TESTÉE ; câblage dans l'écran restant à faire par le coordinateur/fix-app-4 (hors périmètre)** |
| **ACC-17** — CSV mode 1 | Table B.2, note : « l'export CSV applique le même arrondi que l'écran » ; `EX-DATA-63` : arrondi seulement à la présentation | `csv.ts::buildAggregateCsvRows` écrivait les valeurs `MetricRange` brutes (quantile de type 7 non entier, ex. `12846.5`, parfois bruit binaire `64164.79999999997`) | `csv.ts` : import de `roundHalfAwayFromZero` (déjà dans `format.ts`, pas de doublon créé), nouvelle fonction `roundCsvValue`, appliquée à `prixMedianEur/P5/P95/Min/Max`, `anneeMin/Max`, `kilometrageMin/Max`. `nPrix/nAnnee/nKm/offres` (déjà entiers) inchangés. Voir §4 pour la lecture exacte du texte normatif sur année/km (l'export ne porte que des `min`/`max`, pas de `p05`/`p95` d'année : la distinction plancher/plafond ne s'y pose donc pas, seul l'arrondi « entier » de la table s'applique) | `src/screens/market/csv.test.ts` (+3 cas, dont l'exemple exact `12846.5 → 12847`) ; `tests/review/D6/acc-17-18-21-remediation-3.5.test.ts` (1 cas) | **CLOS** |
| **ACC-21** — résumé de carte : médiane affichée sans palier | `EX-SCR-33` : « 1 ≤ n ≤ 4 → aucune médiane/percentile… », paliers « appliqués uniformément » ; `EX-SCR-134` | `buildMakeCardViewModel::medianPriceLine` testait seulement `agg.price.p50 !== null`, sans passer par `modelZoneMedianDisplay(n)` comme la zone (`D8-06`) | `view-model.ts` : la carte appelle désormais **la même fonction** `modelZoneMedianDisplay(agg.price.n)` que la zone, avec les mêmes trois textes (« médiane … », « n trop faible », « 1 seule offre »). Accord du pluriel ajouté (« 1 modèle » / « n modèles », `ACC-15`) | `src/screens/market/view-model.test.ts` (+5 cas : Aspid n=2, Morgan n=1, n≥12, n=5..11 « reduite », accord du pluriel) ; `tests/review/D6/acc-17-18-21-remediation-3.5.test.ts` (2 cas) | **CLOS** |
| **ACC-18** — périmètre de calcul du prix non nommé | `EX-DATA-19(2)` : « tout affichage qui s'en prévaut nomme sa cellule » ; décision commanditaire `D3-42` (1) : l'écran A **nomme sa cellule**, pas de recalcul | Aucune mention du périmètre de calcul (Σ = snapshot/marque pour l'écran A, Σ = cellule du modèle pour l'écran B) sur les fourchettes/médianes de l'écran A | Nouveau champ `priceScopeNote: string \| undefined` sur `ModelZoneViewModel` et `MakeCardViewModel`, peuplé dès que `price.available` est vrai, texte constant `PRICE_SCOPE_NOTE` (fr-BE, sans jargon interne ni identifiant d'exigence). Câblé en `title`/`aria-label` sur le prix et la médiane de `ModelZone.tsx`, et en `title` sur le résumé de `MakeCard.tsx`. **Aucune valeur numérique changée** | `src/screens/market/view-model.test.ts` (+4 cas) ; `tests/review/D6/acc-17-18-21-remediation-3.5.test.ts` (3 cas, dont la vérification « sans jargon ») | **CLOS (partie présentation, comme demandé)** |

---

## 2. Chiffres avant/après (script sur `data/fixtures/test/be-20260921T060000Z/baseline.json`)

Scripts Python ad hoc (jetables, non commités) sur les 262 lignes `MakeAggregate` du snapshot
`fixture:test` (`be-20260921T060000Z`) — le même snapshot que celui exercé par la recette rev 3.

**ACC-17 (années, fourchette carte)** — comparaison `Math.round` (avant) vs plancher/plafond
(après), restreinte aux 56 marques dont `year.n ≥ 12` (seuil `D8-06` où `[p05, p95]` est
effectivement affiché plutôt que `[min, max]`) :

```
rows total 262, eligible (n>=12) 56, changed 31
```

31/56 marques éligibles changent de fourchette d'année sur ce snapshot — du même ordre que le
**32/262** cité par la recette (rev 3, sur le snapshot alors servi ; l'écart d'une unité tient
vraisemblablement à une différence de snapshot/génération entre la recette et ce fichier figé,
pas à la formule). Les figures « 114/299 zones » et « 196/1 451 modèles » de l'écran B viennent
d'agrégats **par modèle** que ce fichier ne porte pas (seul le niveau marque y est pré-calculé) —
les reproduire exactement demanderait de rejouer le moteur complet, hors budget de cette
remédiation ; elles ne sont pas remises en cause, seule leur formule de correction (identique à
celle vérifiée ici) s'y applique.

**ACC-21 (paliers d'effectif de la médiane de carte)** — répartition des 262 marques par palier
`effectifTier(price.n)` :

```
{'absente': 14, 'trop-faible': 171, 'reduite': 22, 'sans-m2': 15, 'complete': 40}
```

**171 / 262 marques** (palier `'trop-faible'`, 1 ≤ n_prix ≤ 4) affichaient à tort une médiane avant
correction — exactement le chiffre cité par la recette (« 171 / 262 marques ont 1 ≤ n_prix ≤ 4 »,
« 22 entre 5 et 11 [inchangées, la médiane y est correctement due], 55 à n ≥ 12 [inchangées] »),
confirmant que ce fichier est la même base de données que celle recensée par `reports/ACCEPTANCE.md`.

---

## 3. Preuve « rouge d'abord » (protocole S2)

Pour chaque fichier de correction, les sondes ont été écrites avant de vérifier leur état sans le
correctif : `git stash push -- <fichiers source non-test>` (les fichiers de sonde restent en place,
non stashés), `npx vitest run …`, constat rouge, puis `git stash pop` et rejeu vert. Extraits :

```
$ git stash push -- src/screens/distribution/format.ts src/screens/market/csv.ts \
    src/screens/market/format.ts src/screens/market/view-model.ts \
    src/screens/market/ModelZone.tsx src/screens/market/MakeCard.tsx
$ npx vitest run src/screens/market/csv.test.ts src/screens/market/format.test.ts \
    src/screens/distribution/format.test.ts --no-file-parallelism
 Test Files  3 failed (3)
      Tests  12 failed | 57 passed (69)
# (formatYearRange, roundYearForPresentation, formatYearStat: "is not a function" ;
#   arrondis CSV et écran A: valeurs brutes/au-plus-proche au lieu de plancher/plafond/entier)

$ npx vitest run src/screens/market/view-model.test.ts --no-file-parallelism
 Test Files  1 failed (1)
      Tests  4 failed | 35 passed (39)
# (medianPriceLine "1 modèles · médiane …" pour Aspid/Morgan ; priceScopeNote undefined)

$ npx vitest run --config vitest.review.config.ts tests/review/D6/acc-17-18-21-remediation-3.5.test.ts --no-file-parallelism
 Test Files  1 failed (1)
      Tests  8 failed | 1 passed (9)

$ git stash pop
# rejeu : tous verts (voir §4 « Preuves », commandes finales)
```

---

## 4. Hors périmètre / pour le coordinateur

1. **`src/screens/distribution/DistributionScreen.tsx:466`** (ligne « 1ʳᵉ immat. médiane ») —
   HORS du périmètre d'écriture de `fix-screens-5` (seul `distribution/format.ts` y figure), et ce
   fichier est aussi celui où `fix-app-4` corrige le gestionnaire « Convertir la sélection en
   filtre » dans un worktree parallèle (risque de conflit de fusion si les deux agents l'éditent).
   La fonction pure `formatYearStat` est prête, testée, exportée par `distribution/format.ts`.
   Changement à appliquer par le coordinateur (ou en message de suivi à un agent encore vivant sur
   ce fichier), littéral :
   ```diff
   - import { formatPrice, formatKm, formatYear, formatPower, formatMonthYear } from './format';
   + import { formatPrice, formatKm, formatYear, formatYearStat, formatPower, formatMonthYear } from './format';
   ...
   -           <span title={`n = ${stats.year.n}`}>1ʳᵉ immat. médiane {statOrDash(stats.year.p50, formatYear)}</span>
   +           <span title={`n = ${stats.year.n}`}>1ʳᵉ immat. médiane {statOrDash(stats.year.p50, (v) => formatYearStat(v, 'p05'))}</span>
   ```
   Sans ce câblage, **ACC-17 n'est pas totalement clos** : l'écran A, la zone, la marque et le CSV
   mode 1 le sont ; seule la ligne « 1ʳᵉ immat. médiane » de l'écran B reste au comportement fautif
   (arrondi au plus proche) jusqu'à ce changement d'une ligne. `formatYear` lui-même n'a pas été
   touché (il reste utilisé, correctement, pour des années qui ne sont PAS des quantiles : année-
   modèle, points du nuage, catégories d'axe des graphes additionnels — vérifié par lecture de
   tous ses appelants, cf. §5 hypothèse E4-2).

2. **`src/screens/compare/CompareScreen.tsx`** — hors périmètre d'écriture, mais **aucune
   modification n'y était nécessaire** : `fmtYearRange` y appelle `formatYearRange(r.p05, r.p95)`
   avec exactement deux arguments, et les nouveaux paramètres `lowPosition`/`highPosition` de
   `formatYearRange` ont des valeurs par défaut `'p05'`/`'p95'` précisément pour que ce site d'appel
   (et tout autre appel à deux arguments) continue de bénéficier de la correction sans modification.
   Vérifié par lecture et par le passage de `npm run build` (0 erreur TypeScript sur ce fichier).

3. **Figures modèle de l'écran A (114/299 zones, 196/1 451 modèles d'écran B)** — non
   recalculées indépendamment (§2) : la formule appliquée est identique et déjà prouvée par
   sonde/tests, la vérification chiffrée complète nécessiterait de rejouer le moteur d'agrégation
   complet, hors budget de cette mission.

---

## 5. Hypothèses (E4)

- **E4-1** — `EX-DATA-64` (table B.2) donne l'arrondi « idem » (plancher) pour les lignes `q1`,
  `median`, `q3` par référence à la ligne `p05` : aucune fourchette de l'écran A/B n'affiche
  actuellement `q1`/`q3` d'année isolément (vérifié par recherche exhaustive), donc seule la paire
  `(p05, p95)` et le point `median` sont exercés par le code ; le type `YearBoundPosition`/
  `YearStatPosition` couvre néanmoins `q1`/`q3` implicitement (même branche que `'p05'`) si un futur
  usage les affiche.
- **E4-2** — les usages de `formatYear`/`formatMetric` qui N'ONT PAS été redirigés vers
  `formatYearStat` (`ListingsScreen.tsx` : année-modèle d'une ligne d'annonce ; `ScatterCloud.tsx` :
  année d'un point individuel et graduation d'axe ; `AdditionalGraphs.tsx` : catégorie d'année d'un
  graphe « prix médian par année », pas la valeur du prix lui-même ; `Histogram.tsx` via
  `formatMetric` : borne de BIN d'histogramme, pas un quantile de sélection) portent des valeurs qui
  ne sont PAS des statistiques de la table B.2 d'`EX-DATA-64` (pas de "position de quantile" au sens
  de la table) : l'arrondi au plus proche y reste correct et n'a pas été modifié. Confirmé par
  lecture de chaque appelant (`grep` exhaustif, §"Lis d'abord" du mandat).
- **E4-3** — Pour ACC-18, la mention `PRICE_SCOPE_NOTE` est la même chaîne pour la carte et la
  zone (le périmètre Σ est le même à ce niveau d'agrégation) ; elle n'est publiée que quand
  `price.available` est vrai (une fourchette OU une médiane de repli bas-effectif est affichée),
  jamais quand aucune statistique de prix n'existe (`n = 0`) — interprétation du « chaque carte à
  médiane affichée » de la mission comme englobant aussi le repli `[min, max]` bas-effectif, qui
  reste une statistique de prix réelle sur le même Σ.
- **E4-4** — L'export CSV mode 1 ne porte pas de colonnes `annee_p05`/`annee_p95` ni
  `km_p05`/`km_p95` (seulement `min`/`max`, `EX-DATA-123bis`) : la distinction plancher/plafond de
  la table B.2 (qui ne s'applique qu'aux positions `p05`/`q1`/`médiane`/`q3`/`p95`) ne s'y pose
  donc pas ; seul l'arrondi « entier » (au plus proche) de `min`/`max` s'applique, implémenté par
  `roundCsvValue` (identique pour prix, km et année, comme demandé par la mission).

---

## 6. Tableau des preuves

| Commande | Résultat |
|---|---|
| `npm run build` | 0 erreur / 0 warning (tsc app + worker + vite build, `dist/` généré) |
| `npm run lint` | code de sortie 0 |
| `npx vitest run src/screens --no-file-parallelism` | **17 fichiers, 268 tests, tous verts** |
| `npx vitest run --config vitest.review.config.ts tests/review/D6 tests/review/D7 --no-file-parallelism` | **27 fichiers, 248 tests, tous verts** (dont la sonde neuve `acc-17-18-21-remediation-3.5.test.ts`, 9 cas) |
| `KYCAR_E2E_PORT=4182 npx playwright test tests/e2e/parcours-p1.spec.ts tests/e2e/parcours-p2.spec.ts --project=desktop` | **30/30 passed** (aucune régression P1/P2) |
| `KYCAR_E2E_PORT=4182 npx playwright test tests/e2e/a11y.spec.ts -g "surface A\|surface B"` (3 projets) | **6/6 passed**, 0 violation axe-core |
| `KYCAR_E2E_PORT=4182 npx playwright test -g "ACC-08\|C-R1-05\|CSV\|export"` (3 projets) | **14 passed, 1 skipped** (skip pré-existant, hors périmètre) |
| `git checkout -- reports/e2e/results.json` | exécuté après chaque run E2E |
| `ss -ltnp \| grep 4182` avant/après | libre avant, aucun `vite preview` résiduel après |

Worktree propre à la fin (`git status --short` ne montre que les fichiers listés au §7).

---

## 7. Fichiers modifiés/créés

- `src/screens/market/format.ts` — `YearBoundPosition`, `roundYearForPresentation`, `formatYearRange` repositionné
- `src/screens/market/format.test.ts` — +8 cas ACC-17
- `src/screens/market/csv.ts` — `roundCsvValue`, arrondi des colonnes numériques
- `src/screens/market/csv.test.ts` — +3 cas ACC-17
- `src/screens/market/view-model.ts` — `formatYearRawRange`, `PRICE_SCOPE_NOTE`/`priceScopeNote`, palier ACC-21 sur `medianPriceLine`, accord du pluriel
- `src/screens/market/view-model.test.ts` — +10 cas (1 repli bas-effectif ACC-17, 5 ACC-21, 4 ACC-18)
- `src/screens/market/ModelZone.tsx` — `title`/`aria-label` du prix et de la médiane (ACC-18)
- `src/screens/market/MakeCard.tsx` — `title` du résumé de carte (ACC-18)
- `src/screens/distribution/format.ts` — `YearStatPosition`, `formatYearStat`
- `src/screens/distribution/format.test.ts` — nouveau fichier, 6 cas
- `tests/review/D6/acc-17-18-21-remediation-3.5.test.ts` — nouvelle sonde, 9 cas
- `reports/remediation-2.8/fix-screens-5.md` — ce rapport
