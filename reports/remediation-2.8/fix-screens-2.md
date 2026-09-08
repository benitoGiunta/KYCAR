# fix-screens-2 — vague F3 de la phase 2.8

Agent `fix-screens-2` · modèle Opus · effort high · 2026-09-08 · worktree `/home/user/kycar-wt/screens2`
· branche `fix28/screens2` (depuis `feb90aa`) · identité git `Benito Giunta <benitognt@gmail.com>`.

**Périmètre d'écriture tenu** : `src/screens/`, `tests/review/D6/`, `tests/review/D7/`, ce rapport.
Aucune écriture dans `src/app.tsx`, `src/app/`, `src/main.tsx`, `src/state/`, `src/components/`,
`src/engine/`, `src/persistence/`, `tests/e2e/`. Aucun `npm ci`/`npm install`, aucun appel réseau
(E5), aucune question posée (E3), toute hypothèse écrite comme telle (E4), aucun compte créé (E1),
aucun champ vendeur identifiant introduit (R3 : les écrans touchés n'affichent ni `vin`, ni
`licencePlate`, ni `sellerId`, ni URL vendeur, et aucun export CSV n'a été modifié).
`reports/e2e/results.json` n'a pas été régénéré ni commité (D8-33 : je n'ai pas lancé `test:e2e`,
port 4180 réservé au coordinateur).

**Sources lues** : `CLAUDE.md` · `docs/plans/REVIEW-PROTOCOL.md` ·
`reports/remediation-2.8/FIX-LEAD-DECISIONS-2.8.md` (§E : `D8-27`, `D8-31`, `D8-33`) ·
`reports/REMEDIATION-2.8.md` §7.1 (points 2 et 3), §7.4, §8 · `reports/remediation-2.8/fix-screens.md`,
`fix-screens-finition.md`, `fix-app.md` §7 · `reports/FINAL-VERIFICATION.md` §3.2(b)(d) ·
`docs/requirements/draft-screens.md` (`EX-SCR-16/17/18`, `26`, `34`, `149`, `151..156`, `170`,
`173..176`, `211..214`) · `docs/requirements/draft-behaviour.md` (`EX-CRUD-2/5/6/11/12/13`) ·
`docs/requirements/draft-data-dictionary.md` (`EX-DATA-23`) · sondes existantes
`tests/review/D7/ecran-b.test.ts`, `histogrammes.test.ts`, `nuage-g4.test.ts`, `_helpers.ts`,
`tests/review/D6/*`.

---

## 1. Tableau de synthèse

| Exigence | Constat 2.7 / 2.8 | Décision | État | Sonde (rouge → verte) |
|---|---|---|---|---|
| `EX-SCR-149` | `REMEDIATION-2.8` §7.4 : câblage `onClearFilter` de `90a9eea` sans aucune preuve exécutée | `D8-27` | **COUVERTE** (aucune correction de code nécessaire : le câblage était juste) | `R-D7-2.8-01` — rouge sur `3435456`, verte sur `HEAD` |
| `EX-SCR-17` | « bascule d'échelle log de G7 absente » (`grep` → 0) | `D8-31` | **CORRIGÉE** | `R-D7-2.8-02/03/04` rouges → vertes ; `R-D7-2.8-05/06/07` vertes d'emblée (preuves de non-régression et d'URL) |
| `EX-SCR-153` | « alignement de G4a sur les bornes/buckets de G1 non prouvé » (`grep buckets` → 0) | `D8-31` | **CORRIGÉE** | `R-D7-2.8-08…13` — 6 rouges → 6 vertes |
| `EX-SCR-174` | sonde « à écrire en 2.8 » jamais écrite ; `ET-VIDE-FILTRES` de l'écran B absent | `D8-31` | **CORRIGÉE** | `R-D7-2.8-14…17` rouges → vertes ; `R-D7-2.8-18` (non-régression) verte |
| `EX-SCR-212` / `EX-SCR-213` | « carte de l'écran E sans bouton `Ouvrir` nommé, sans description de filtres ni périmètre » | `D8-31` | **CORRIGÉE** | `R-D6-2.8-05…11`, `R-D6-2.8-13` rouges → vertes ; `R-D6-2.8-12` verte d'emblée |
| `EX-DATA-23` (côté écrans) | signalement de `fix-engine-2` relayé par le coordinateur : `NaN/NaN` sur une date non parsable | complément de mission | **CORRIGÉE** | `R-D6-2.8-01/03/04` rouges → vertes ; `R-D6-2.8-02` (non-régression) verte |

Aucune dette nouvelle. Aucune exigence laissée dans un troisième état (`D8-31`).

---

## 2. `D8-27` — preuve du câblage `onClearFilter` (`EX-SCR-149`)

**Correction** : aucune ligne de `src/` modifiée — le câblage de `90a9eea` est conforme ; ce qui
manquait était la **preuve**. Sonde ajoutée dans `tests/review/D7/ecran-b.test.ts` (cas
`R-D7-2.8-01`), sur le modèle du test minimal de `REMEDIATION-2.8` §7.4, avec deux adaptations
techniques nécessaires et écrites dans le fichier :

1. l'arbre est rendu **sans `deepRender`** (nouvelle fabrique locale `screenVNode`) : `deepRender`
   *appelle* les composants enfants et les remplace par leur sortie, si bien qu'une prop de rappel
   (`onClearFilter`) n'existe plus dans l'arbre rendu. Les cas `EX-SCR-176` existants inspectent des
   `figure` produites, ce qui ne convient pas ici ;
2. l'égalité finale utilise `toStrictEqual` et non `toEqual` : seul `toStrictEqual` distingue une
   clé **présente à `undefined`** (un retrait) d'une clé **absente** — c'est exactement l'enjeu de
   `clearMetricFilters`. Les trois assertions supplémentaires (`Object.keys(p).length === 2`, toutes
   les valeurs `undefined`, ordre `price`/`mileage`/`year`) ferment le cas.

**Preuve d'exécution (D-32).** Version d'avant câblage recopiée par-dessus la version courante
(`git show 3435456:src/screens/distribution/DistributionScreen.tsx`, `grep -c onClearFilter` → **0**),
puis restaurée par `git checkout --` :

```
# sur 3435456 (avant câblage)
× R-D7-2.8-01 — EX-SCR-149 : `DistributionScreen` câble `onClearFilter` sur G1/G2/G3 …
  → G1 sans onClearFilter: expected 'undefined' to be 'function' // Object.is equality
  Tests  1 failed | 40 skipped (41)

# sur HEAD (après restauration)
✓ tests/review/D7/ecran-b.test.ts (41 tests) — Tests  41 passed (41)
```

Commit : `86ca1f2`.

---

## 3. `EX-SCR-17` — bascule logarithmique de l'axe des prix, sur le seul `G7`

**Constat.** `G7` (`DensityHeatmap`) n'avait **aucun axe quantitatif** : les cellules étaient des
carrés de 14 px placés au **rang** du bin de prix présent. Une bascule d'échelle n'a de sens que sur
un axe qui projette des valeurs ; il fallait donc d'abord donner à `G7` un vrai axe des prix.

**Correction** (commit `d690d63`) :

| Fichier | Changement |
|---|---|
| `src/screens/distribution/graphs-model.ts` | `PriceMileageDensity` publie `priceBins: readonly DensityAxisBin[]` — les bins **fermés** de la grille `BIN` (`EX-DATA-75`) avec leurs bornes ; les bins de débordement sont écartés (`EX-SCR-18`). |
| `src/screens/distribution/AdditionalGraphs.tsx` | `DensityHeatmap` prend `log?: boolean` et `onToggleLog?: () => void`. L'axe des prix est projeté (`y`/`height` par bornes de bin), en identité ou en `log10` (plancher à 1 € pour ne jamais évaluer `log10(0)` : l'origine de la grille `BIN` vaut 0). Cellules de débordement **écrêtées sur la bordure** (`EX-SCR-18`), jamais supprimées. Graduations de prix rendues en texte sous la carte. Bouton `Échelle log de l’axe des prix`, `aria-pressed`, infobulle rappelant que l'axe des km reste linéaire. Chaque cellule porte `data-price-lower`/`data-price-upper`, la figure `data-price-scale`. |
| `src/screens/distribution/DistributionScreen.tsx` | `log={ui.logHistograms.has(7)}` et `onToggleLog={() => onToggleLog(7)}` — mécanisme **existant** `toggleLogHistogram` (`EX-SCR-16`), indice **7**. |
| `src/screens/distribution/distribution.css` | `.kycar-heatmap-priceaxis` (graduations). |

**Paramètre d'URL touché : `g7log`.** Vérifié **encodable et décodable sans aucune modification hors
de mon périmètre** (`R-D7-2.8-06/07`, vertes dès la première exécution) :
`src/state/corrections.ts` reconnaît la famille `g<n>log` par `GRAPH_LOG_RE = /^g\d+log$/`
(`isUiStateParam`), donc `loadQuery('g7log=1')` le conserve **sans correction `UNKNOWN_PARAM`** ;
`readDistributionUiState`/`writeDistributionUiState` (mon périmètre) le lisent et le réécrivent par
la même famille ; `historyModeFor` le classe `replace` (aucun paramètre `push` ne change). **Rien
n'est donc attendu de fix-state-2** sur ce point (voir §8).

**Preuve.**

```
# avant (HEAD de la vague, code de 90a9eea)
× R-D7-2.8-02 … aucune bascule log sur G7: expected 0 to be 1
× R-D7-2.8-03 … expected undefined to be true
× R-D7-2.8-04 … aucune cellule de densité positionnée sur un axe de prix: expected 0 to be > 3
✓ R-D7-2.8-05 (G4 sans log)  ✓ R-D7-2.8-06 (g7log décodé)  ✓ R-D7-2.8-07 (g7log réencodé)
  Tests  3 failed | 3 passed (6)

# après
✓ tests/review/D7/echelle-log-prix-2.8.test.ts (6 tests) — Tests  6 passed (6)
```

`R-D7-2.8-04` vérifie que la bascule **déplace réellement** les cellules (les couples
`y/height` diffèrent entre linéaire et log) : un drapeau décoratif n'aurait pas passé.
`R-D7-2.8-05` verrouille l'exclusivité : `G1` ne devient pas log par l'indice 7, et `G4` n'offre
aucune bascule log quel que soit `ui.logHistograms`.

---

## 4. `EX-SCR-153` — `G4a` sur les bornes et les buckets de `G1`, `G4b` en graduations annuelles

**Constat, vérifié dans le code.** `ScatterCloud` calculait (a) les bornes X de `G4a` par
`q01q99(points.priceEur)` — les quantiles des **points échantillonnés** (`sampleScatter`, plafond
5 000), donc jamais les bornes de `G1` ; (b) les buckets d'empilement par un `bin()` **refait** sur
ces mêmes points, avec sa propre largeur. Deux graphes qui doivent « se lire l'un sur l'autre » ne
partageaient donc ni bornes ni buckets. Et **aucun axe n'était dessiné** : ni graduation de prix, ni
graduation annuelle — l'exigence n'était pas seulement non prouvée, elle n'était pas tenue.

**Correction** (commit `f5da9c2`) :

| Fichier | Changement |
|---|---|
| `src/screens/distribution/scatter-model.ts` | Ajout de `priceGridEdges` (bornes des buckets **fermés** de `G1`), `priceBoundsFromGrid`, `gridBucketIndex` (rang de bucket écrêté aux bords, `EX-SCR-18`), `januaryTicks` (1ᵉʳ janvier de chaque année : `12 · Y`, l'encodage `firstRegistrationYearMonth`), `linearTicks`, et les types `AxisTick`/`GridBucket`. Modules purs, testables sans DOM. |
| `src/screens/distribution/ScatterCloud.tsx` | Nouvelle prop `priceBuckets` ; en `G4a` les bornes X **sont** celles de `G1` et le rang d'empilement se calcule sur **ses** buckets ; calque SVG de graduations au-dessus du canvas (`aria-hidden`, `pointer-events: none`), portant `data-axis="x"|"y"`, `data-scale="linear"` et un `data-tick` par graduation. `G4b` : X aux 1ᵉʳ janvier, Y en prix ; régime dégradé : X en km, Y en prix. |
| `src/screens/distribution/DistributionScreen.tsx` | `priceBuckets={recalc.priceHistogram}`. |
| `src/screens/distribution/distribution.css` | `.kycar-scatter-axes`. |

Repli explicite : `priceBuckets` absente ⇒ comportement d'avant (`Q(0,01)`/`Q(0,99)`), jamais une
borne inventée — mais l'alignement n'est alors pas garanti. La coquille la fournit déjà (câblage
interne à l'écran B, rien à faire pour fix-app-2).

**Preuve.**

```
# avant : les six cas rouges, tous pour la même cause
× R-D7-2.8-08/09/10/12/13 → axe x (ou y) absent de G4: expected undefined to be defined
× R-D7-2.8-11             → expected +0 to be 2   (aucun `data-axis` dans la figure G4)
  Tests  6 failed (6)

# après
✓ tests/review/D7/g4-bornes-g1-2.8.test.ts (6 tests) — Tests  6 passed (6)
```

`R-D7-2.8-09` compare les graduations X de `G4a` **une à une** aux bornes des buckets fermés de
`recalc.priceHistogram` (`toEqual` sur le tableau complet), `R-D7-2.8-08` aux seules bornes
extrêmes, `R-D7-2.8-10` la linéarité depuis 0 de l'axe des effectifs, `R-D7-2.8-12` la congruence
`≡ 0 [12]` et la consécutivité des années de `G4b`, `R-D7-2.8-11` l'absence de toute échelle log
dans `G4` (les deux axes déclarent `linear`).

---

## 5. `EX-SCR-174` — `ET-VIDE-FILTRES` sur l'écran B

**Correction** (commit `1a3b0d2`, `src/screens/distribution/DistributionScreen.tsx` +
`distribution.css`) : à `selectionStats.selectionCount === 0`,

- les **quatre blocs de graphes** (G1–G3, G4, la grille G5–G15, la note A-08) sortent du DOM et sont
  remplacés par le bloc d'`EX-SCR-26` : titre `Aucune offre ne correspond`, phrase
  `<n> filtres actifs restreignent la recherche.`, les **trois suggestions de retrait** au format
  normatif `retirer « <libellé> » : <k> offres de plus` (et `retirer « <libellé> »`, **sans chiffre**,
  pour un filtre de classe `T`), puis `Réinitialiser tous les filtres` et `Enregistrer cette
  recherche` (qui reste actif : une recherche vide est une veille légitime) ;
- l'**en-tête statistique reste affiché** : `aucune offre` au lieu de `0 offres`, et `—` pour chaque
  statistique (nouveau `statOrDash`, qui force le tiret dès que la sélection est vide, sans attendre
  que l'appelant fournisse des `null` — jamais un chiffre hérité du périmètre précédent) ;
- le bouton `Voir les 0 annonces` est **désactivé**, infobulle `Aucune annonce à lister`.

Le bandeau `C3`, la ligne de représentativité et le bandeau « Modèle non identifié » restent rendus :
ils décrivent le **jeu de données**, pas la sélection.

*Hypothèse (E4)* : sur l'écran B, la sélection porte toujours au moins le filtre de modèle (route
canonique `EX-NAV-2`), donc un effectif nul y est nécessairement « zéro résultat, **filtres posés** »
— jamais `ET-VIDE-SANS-FILTRE` (`EX-SCR-27`), qui est un état de l'écran A. C'est écrit en commentaire
au point de décision.

**Preuve.**

```
# avant
× R-D7-2.8-14 → expected [ { type: 'figure', …(1) }, …(12) ] to have a length of +0 but got 13
× R-D7-2.8-15 → expected [ 'Voir les 0 annonces', …(21) ] to include 'retirer « Prix maximum » : 1 420 offr…'
× R-D7-2.8-16 → expected 'Volkswagen Golf 0 offres médiane — P2…' to contain 'aucune offre'
× R-D7-2.8-17 → expected undefined to be true      (bouton non désactivé)
✓ R-D7-2.8-18 (non-régression, effectif non nul)
  Tests  4 failed | 1 passed (5)

# après
✓ tests/review/D7/etat-vide-filtres-b-2.8.test.ts (5 tests) — Tests  5 passed (5)
```

---

## 6. `EX-SCR-212`/`EX-SCR-213` — cartes de l'écran E et panneau `Recherches récentes`

**Constat.** La carte n'avait ni bouton `Ouvrir` nommé (le **nom** était le bouton d'ouverture),
ni description des filtres, ni périmètre ; l'écart était affiché au format
`+34 offres depuis le 2 sept. 2026` **sans** la condition de snapshot d'`EX-SCR-213` ; aucune règle
de présentation ne portait les 96 px ni la troncature à 2 lignes. Le panneau latéral, lui, était
**déjà conforme** (`R-D6-2.8-12` verte d'emblée : 10 entrées FIFO, `Vider l’historique` unique,
aucune suppression unitaire).

**Correction** (commit `55a9fd8`, `src/screens/saved/SavedSearchesScreen.tsx` + nouveau
`src/screens/saved/saved.css`) :

- **trois boutons** `Ouvrir`, `Renommer`, `Supprimer` ; le nom redevient un texte
  (`.kycar-saved-name`, borné à 60 caractères à l'affichage, titre complet en `title`) ;
- **périmètre** (`.kycar-saved-scope`) : `<Marque> <Modèle>` résolu par la taxonomie depuis le
  **chemin canonique** de l'URL enregistrée (`/marche/:makeId-:makeSlug/:modelId-:modelSlug`) —
  c'est là que vit le périmètre d'une recherche de mode 2, pas dans la requête —, complété par les
  jetons `mmmv` de la requête pour une recherche de mode 1 ; sinon `Toutes marques` ; repli sur le
  **slug** de l'URL tant que la taxonomie n'est pas fournie (jamais un identifiant nu) ;
- **description générée des filtres actifs** (`.kycar-saved-description`, tronquée à 2 lignes) :
  produite par le générateur **existant** `buildActiveFilterTokens` (`src/components/filters/labels.ts`,
  **lu, jamais modifié**) après décodage de la requête par le codec canonique `loadQuery`
  (`src/state/corrections.ts`, lu). Deux libellés de filtre ne peuvent donc pas diverger entre le
  bandeau et l'écran E. Aucun filtre hors périmètre ⇒ `aucun filtre actif` (`EX-SCR-39` : jamais une
  ligne muette) — *hypothèse (E4)*, l'exigence ne fixe pas ce libellé ;
- **écart** `+ 34 offres depuis le 02/09` : signe puis espace, date `JJ/MM` de création, teinte
  froide au positif et gris au négatif ; affiché **seulement si** `snapshotInitial ≠ currentSnapshotId`
  **et** effectif actuel calculable **et** différent de l'effectif initial (`EX-SCR-213`) — jamais
  `0`, jamais `+ 0`, jamais un pourcentage ; `effectif actuel indisponible` quand la valeur est
  `null` (`ET-ERREUR-PROVIDER`), squelette quand elle n'est pas encore résolue ;
- confirmation de suppression **en ligne** au libellé d'`EX-SCR-214` (`Supprimer « <nom> » ?`) ;
- `saved.css` : `.kycar-saved-row { min-height: 96px }` (hauteur minimale plutôt que fixe : la carte
  doit pouvoir grandir pour la confirmation en ligne ou un badge de schéma sans tronquer une valeur)
  et `-webkit-line-clamp: 2` + `line-clamp: 2` sur la description. La mise en page générale de
  l'écran reste dans `src/app/app.css` (hors périmètre), que je n'ai pas touché : `saved.css` n'y
  redéfinit rien.

`Ouvrir` reste **actif** dans tous les cas sauf `from-newer` (entrée écrite par une version
postérieure, non ouvrable par construction). Un filtre devenu **invalide** sur le snapshot courant
(`EX-SCR-101`, porté par fix-state-2) ne désactive rien : c'est écrit en commentaire au point de
décision.

**Preuve.**

```
# avant (avec un saved.css encore vide)
× R-D6-2.8-05 → Ouvrir: expected [ 'Golf sous 20 000', …(13) ] to include 'Ouvrir'
× R-D6-2.8-06 → expected [] to deeply equal [ …(2) ]
× R-D6-2.8-07 → expected '… Golf sous 20 …' to contain 'Volkswagen Golf'
× R-D6-2.8-08 → … to contain 'Toutes marques'
× R-D6-2.8-09 → … to contain '+ 34 offres depuis le 02/09'
× R-D6-2.8-10 → … not to contain 'offres depuis le'   (écart affiché hors condition de snapshot)
× R-D6-2.8-11 → expected undefined to be defined      (aucun nom de carte)
✓ R-D6-2.8-12 (panneau latéral déjà conforme)
× R-D6-2.8-13 → … to match /\.kycar-saved-row\b[^}]*min-height:\s*96px/
  Tests  8 failed | 1 passed (9)

# après
✓ tests/review/D6/ecran-e-recherches-2.8.test.ts (9 tests) — Tests  9 passed (9)
```

---

## 7. `EX-DATA-23` côté écrans — aucune date de première immatriculation forgée

Complément de mission transmis par le coordinateur (signalement de `fix-engine-2`). Défaut
**confirmé par exécution**, et plus large que signalé (commit `4ce7d7c`) :

| Formateur | Entrée | Avant | Après |
|---|---|---|---|
| `src/screens/distribution/format.ts::formatMonthYear` | `NaN` | `NaN/NaN` | `—` |
| idem | `NUMERIC_UNKNOWN` (`−1`) | `00/-1` | `—` |
| idem | `0` (résidu hors domaine) | `01/0` | `—` |
| `src/screens/market/format.ts::formatFirstRegistrationMonthYear` | `''`, `'inconnu'`, `'13/2017'` | `NaN/NaN` | `—` |
| idem | `'2017'` (année nue) | `01/2017` (**mois inventé**) | `—` |

`formatMonthYear` exige désormais un entier ≥ 0 dont l'année tombe dans `[1900, 2100]`
(`EX-DATA-23` valide `1900-01 ≤ v`) ; `formatFirstRegistrationMonthYear` exige la forme
`AAAA-MM` d'`EX-DATA-23` avec un mois `01..12` explicite (« aucune tolérance ») **et** une date
parsable. Le repli est le caractère d'absence normatif `—` d'`EX-SCR-34`, exporté sous
`MISSING_VALUE` dans les deux modules. `R-D6-2.8-04` prouve la chaîne complète : sur une colonne
portant `−1` et `0`, l'expression littéralement rendue par l'écran D et par l'infobulle de l'écran B
donne `—`.

```
# avant
× R-D6-2.8-01 → entrée «  »: expected 'NaN/NaN' not to match /NaN/
× R-D6-2.8-03 → entrée -1: expected '00/-1' to be '—'
× R-D6-2.8-04 → ligne 1: expected '01/0' to be '—'
✓ R-D6-2.8-02 (non-régression ISO valide)
  Tests  3 failed | 1 passed (4)

# après
✓ tests/review/D6/format-immatriculation-2.8.test.ts (4 tests) — Tests  4 passed (4)
```

---

## 8. Câblage attendu de `fix-app-2`

Toutes les props ci-dessous sont **optionnelles** : sans elles, l'écran ne rend rien de faux (il rend
moins). Point de montage de l'écran B : `src/app.tsx`, bloc `<DistributionScreen …>` (~l. 1590–1626) ;
écran E : `case 'savedSearches'` (~l. 1391).

### 8.1 `DistributionScreen` (écran B) — `EX-SCR-174` / `EX-SCR-26`

| Prop | Type | Source de la donnée | Comportement attendu |
|---|---|---|---|
| `activeFilterCount` | `number` | `countActiveFilters(selection)` de `src/components/filters/band-model.ts`, sur la sélection courante de la coquille (même valeur que celle du bandeau) | À effectif nul, rend la phrase `<n> filtres actifs restreignent la recherche.`. **Absente ⇒ phrase non rendue** (jamais un compte inventé). |
| `topRestrictiveFilters` | `readonly RestrictiveFilterHint[]` (`src/screens/market/state.ts`, déjà utilisé par l'écran A) | Même calcul « leave-one-out » que l'écran A : `FacetCount` de `selectionHashWithoutFilter(filterId)` (`EX-DATA-110bis`), 3 entrées au plus, `gain: null` pour un filtre de **classe `T`** en mode 2 | Rend les boutons de retrait au format normatif. **Absente ou vide ⇒ aucune suggestion**, le reste du bloc est rendu. |
| `onRemoveFilter` | `(filterId: string) => void` | Coquille | Retire ce seul filtre de la sélection et pousse la nouvelle URL (même handler que l'écran A). |
| `onResetAllFilters` | `() => void` | Coquille | `Réinitialiser tous les filtres` — même handler que l'écran A. |
| `onSaveSearch` | `() => void` | Coquille | Ouvre le formulaire `Enregistrer cette recherche` (`EX-SCR-94`). Le bouton **reste actif** à zéro résultat. |

Rien d'autre n'est attendu pour l'écran B : `priceBuckets` (`EX-SCR-153`) est passé par l'écran
lui-même depuis `recalc.priceHistogram`, et la bascule `g7log` (`EX-SCR-17`) passe par le chemin
générique déjà en place (`applyUiState` → `writeDistributionUiState` → `historyModeFor`).

### 8.2 `SavedSearchesScreen` (écran E) — `EX-SCR-212` / `EX-SCR-213`

| Prop | Type | Source de la donnée | Comportement attendu |
|---|---|---|---|
| `currentSnapshotId` | `string` | `SnapshotDescriptor.snapshotId` du jeu de données courant (déjà lu par la coquille pour le panneau Diagnostic) | Condition d'`EX-SCR-213` : l'écart n'est affiché que si `snapshotInitial ≠ currentSnapshotId`. **Absente ⇒ aucun écart affiché** (jamais un `+ 0`). |
| `taxonomy` | `TokenTaxonomyReference` = `Pick<ReferenceData, 'makeById' \| 'modelByKey'>` | `referenceData` de la coquille (déjà passé à `FilterBand`/`ScreenG`) | Résout `<Marque> <Modèle>` du périmètre et les jetons `mmmv` de la description. **Absente ⇒ repli sur les slugs de l'URL**, jamais un identifiant nu. |
| `currentCountById` | *(existante, déjà câblée)* | inchangée | inchangé |

### 8.3 Adaptation E2E à faire par fix-app-2 (seul propriétaire de `tests/e2e/`, D8-26)

`tests/e2e/persistance.spec.ts` l. 83 (`EX-CRUD-6`) ouvre la recherche par
`page.getByRole('button', { name: 'À rouvrir' })` — c'est-à-dire par le **nom**, qui n'est plus un
bouton depuis `EX-SCR-212` (« trois boutons par carte : `Ouvrir`, `Renommer`, `Supprimer` »). Il faut
viser le bouton `Ouvrir` de la carte, par exemple :

```ts
await page.locator('.kycar-saved-row', { hasText: 'À rouvrir' }).getByRole('button', { name: 'Ouvrir' }).click();
```

C'est la **seule** adaptation E2E que mes corrections imposent, à ma connaissance : je n'ai pas pu
rejouer la recette (port 4180 réservé au coordinateur, cf. §10).

---

## 9. Attendu de `fix-state-2`

**Rien.** Le paramètre d'URL de la bascule log de `G7` est `g7log`, et il est déjà pris en charge
de bout en bout **sans modification** de `src/state/filter-registry.ts` ni de `src/state/url-codec.ts` :

- `src/state/url-codec.ts` ne liste pas `g<n>log` dans `UI_STATE_PARAMS` **par conception** (le
  commentaire de la table le dit : « `g<n>log` est une FAMILLE de paramètres … `uiStateParamName` la
  génère à la demande plutôt que de l'énumérer ici ») ;
- `src/state/corrections.ts` la reconnaît par `GRAPH_LOG_RE = /^g\d+log$/` dans `isUiStateParam`,
  donc `loadQuery('g7log=1')` conserve la valeur **sans émettre `UNKNOWN_PARAM`** ;
- `historyModeFor` le classe `replace`, cohérent avec `g4v`/`page`/`sel`.

Les trois points sont prouvés par `R-D7-2.8-06` et `R-D7-2.8-07`, **vertes dès la première
exécution** (avant toute correction). Si fix-state-2 devait un jour énumérer explicitement la
famille, la ligne serait `{ param: graphLogParam(7), historyMode: 'replace' }` — mais elle ferait
double emploi avec `GRAPH_LOG_RE` et je ne la demande pas.

---

## 10. Sondes existantes modifiées

| Fichier | Modification | Justification (D-31) |
|---|---|---|
| `tests/review/D7/ecran-b.test.ts` | **Ajout seul** : un import de type (`SelectionInput`), un import de `clearMetricFilters`, la fabrique `screenVNode` (rendu **non** profond) et le cas `R-D7-2.8-01`. | Aucune assertion existante n'a été touchée ni affaiblie : le fichier passe de 40 à 41 cas, les 40 d'origine restant identiques. `screenVNode` est une **nouvelle** fabrique à côté de `renderScreen`, nécessaire parce que `deepRender` détruit les props de rappel (§2). |

Aucune autre sonde, d'aucun lot, n'a été modifiée. Aucun `skip`, aucun `todo`, aucun `it.fails`
introduit ni retiré (D-49).

---

## 11. Portes exécutées dans le worktree

Toutes séquentielles, sur mon seul périmètre, sans autre agent actif dans ce worktree.

```
$ npx tsc --noEmit -p tsconfig.json                          → 0 erreur (exit 0)
$ npx tsc --noEmit -p tsconfig.review.json                    → 0 erreur (exit 0)
$ npx eslint src/screens tests/review/D6 tests/review/D7      → aucune sortie (exit 0)
$ npx vitest run --no-file-parallelism src/screens            → 16 fichiers, 241 tests, 241 verts
$ npx vitest run --config vitest.review.config.ts --no-file-parallelism tests/review/D6
                                                              → 14 fichiers,  94 tests,  94 verts
$ npx vitest run --config vitest.review.config.ts --no-file-parallelism tests/review/D7
                                                              →  9 fichiers, 128 tests, 128 verts
$ npx vitest run --config vitest.review.config.ts --no-file-parallelism tests/review/D8 tests/review/patho
                                                              → 18 fichiers, 230 tests, 230 verts  (contrôle de non-régression hors périmètre)
$ npm run build                                               → 146 modules, 0 erreur / 0 warning
$ npm run size                                                → initial 114,44 / 300 Kio gzip — OK
```

`npm run size` : **114,44 Kio** contre 112,49 avant la vague, soit **+1,95 Kio gzip** (+1,7 %) pour
les axes de `G4`, l'axe de prix et la bascule de `G7`, le bloc `ET-VIDE-FILTRES` et les cartes de
l'écran E. Marge restante : 185,6 Kio.

**Non exécutés, volontairement** : `npm test` complet et `npm run test:e2e` (port 4180 réservé au
coordinateur, `reports/e2e/results.json` laissé intact — D8-33), `npm run test:perf`.

## 12. Commits (branche `fix28/screens2`, non poussée)

| Commit | Objet |
|---|---|
| `86ca1f2` | `D8-27` / `EX-SCR-149` — sonde du câblage `onClearFilter` (aucun code de `src/` modifié) |
| `d690d63` | `EX-SCR-17` — bascule log de l'axe des prix de `G7` seul |
| `f5da9c2` | `EX-SCR-153` — `G4a` aligné sur la grille de `G1`, graduations des deux axes de `G4` |
| `1a3b0d2` | `EX-SCR-174` — `ET-VIDE-FILTRES` de l'écran B |
| `4ce7d7c` | `EX-DATA-23` — plus aucune date de première immatriculation forgée |
| `55a9fd8` | `EX-SCR-212`/`213` — cartes de l'écran E, `saved.css` |

## 13. Dettes et impossibilités

**Aucune dette nouvelle.** Deux réserves de forme, sans effet sur une valeur affichée :

1. **Recette navigateur non rejouée.** Les changements de rendu (axes de `G4`, axe de `G7`, bloc
   vide de l'écran B, cartes de l'écran E) n'ont été éprouvés qu'en sondes VNode et en tests
   unitaires : je n'ai pas lancé `npm run test:e2e` (port réservé). L'adaptation E2E connue est
   listée en §8.3 ; d'autres attentes E2E portant sur l'écran E ou sur `G4` pourraient demander une
   relecture par fix-app-2 lors de sa recette complète.
2. **Deux libellés non fixés par l'exigence** (hypothèses E4, écrites dans le code) : `aucun filtre
   actif` quand une recherche enregistrée ne porte aucun filtre hors périmètre, et le choix d'une
   **hauteur minimale** de 96 px pour la carte de l'écran E plutôt qu'une hauteur fixe.
