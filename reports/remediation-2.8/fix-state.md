# fix-state — vague F1 de la phase 2.8

**Agent `fix-state` (Sonnet, effort high), 2026-09-08. Worktree `/home/user/kycar-wt/state`,
branche `fix28/state`.** Périmètre d'écriture : `src/state/`, `src/components/filters/`,
`tests/review/D5/`, `reports/remediation-2.8/fix-state.md`. Mandat :
`reports/remediation-2.8/FIX-LEAD-DECISIONS-2.8.md` D8-04d, D8-05, D8-12, D8-14, D8-15, D8-19 ;
`reports/FINAL-VERIFICATION.md` §7 FV-04(d), FV-06, FV-14, FV-16, FV-17(`mk`), FV-19, FV-23, FV-24
et §3.2(d) ; `docs/requirements/draft-screens.md` (bandeau C1, écran G) et `draft-behaviour.md`
(EX-NFR-29/30, EX-SRCH-21/22) ; `reports/remediation/fix-state.md` (état après 2.6).

**Correction de numérotation reçue en cours de lot (coordinateur)** : `EX-SCR-95` est le bloc
« Assainissement KYCAR » (hors périmètre, dette produit ratifiée par D8-15, **non implémenté**) —
les régimes du bandeau sont `EX-SCR-96` (intermédiaire) / `EX-SCR-97` (compact) / `EX-SCR-98`
(paliers en liste déroulante) ; le raccourci `/` est `EX-SCR-81` et la notification de cascade est
`EX-SCR-73`. C'est la lecture implémentée ci-dessous et dans les sondes (les commentaires de code
et de test le documentent explicitement, `D-32`).

Méthode : sonde d'échec écrite avant chaque correction (`D-32`), dans `tests/review/D5/`, sauf
là où le point était déjà correctement implémenté (constaté au lieu d'être corrigé, documenté
comme tel ci-dessous).

---

## 1. Point → sonde → correction → preuve → statut

### 1.1 D8-04d — jetons `mmmv` par niveau, libellés taxonomiques (FV-04(d), `EX-SCR-75`)

**Constat avant correction** : `buildActiveFilterTokens` traitait `makesModelsVariants` comme un
filtre `structured_multi` générique (`formatTextToken`), affichant `Marque / Modèle / Version :
74|2084` — un seul jeton, code brut, un seul retrait possible.

**Sonde rouge** (nouvelle) : `tests/review/D5/mmmv-tokens.test.ts` (`R-D5-27`) — appelée sur le
code d'avant correction (`formatTextToken`), elle produit `[{ text: 'Marque / Modèle / Version :
74|2084', ... }]` et échoue sur `toHaveLength(2)`.

**Correction** — `src/components/filters/labels.ts` :
- `formatMmmvTokens(value, referenceData)` : un bloc `makeId` → 1 jeton (libellé de la marque) ;
  un bloc `makeId|modelId` → 2 jetons (marque puis modèle), résolus contre `ReferenceData.makeById`
  / `modelByKey` (jamais le code numérique affiché — repli `Marque nº <id>` si le référentiel est
  absent ou l'id introuvable, jamais une exception ni le code nu).
- `ActiveFilterToken.narrowsTo?: { filterId, value }` : le jeton MODÈLE (niveau enfant) porte ce
  champ — son retrait ne supprime PAS le filtre, il le RESTREINT à la marque seule
  (`serializeMmmv(makeId, undefined)`). Le jeton MARQUE (niveau parent) n'en porte pas : son
  retrait est total, il emporte le modèle (`EX-SCR-76`).
- `buildActiveFilterTokens(selection, referenceData?)` : nouveau second paramètre optionnel ;
  l'ordre de tri utilise désormais `filterIds[0]` (pas `key`) pour garder marque avant modèle,
  stabilité du tri garantie (ES2019+).
- `ActiveFilterTokens.tsx` : nouvelles props `referenceData`, `onNarrow` ; le bouton `×` appelle
  `onNarrow` si `narrowsTo` est présent, sinon `onRemove` comme avant.
- `FilterBand.tsx` : `handleNarrow` (remplace la valeur, rejoue `cascadeRemoveOrphans`, pousse) ;
  `referenceData` routé vers `ActiveFilterTokens`.

**Preuve verte** : `npx vitest run --config vitest.review.config.ts tests/review/D5/mmmv-tokens.test.ts`
→ 8/8. Aucune sonde existante modifiée.

**Statut : CORRIGÉ.**

### 1.2 D8-05 — facettes `(n)`/`(0)` gris, compteur zone (4), effectifs écran G (FV-06, FV-05, FV-23)

**Constat avant correction** : `CheckboxList` savait déjà lire `facetCounts?.get(opt.code)` mais
`facetCounts` s'arrêtait à `FilterFieldRow` — ni `PrimaryLine`, ni `SecondaryGroups`, ni
`FilterBand` ne l'acceptaient ou ne le routaient (`grep facetCounts src/app.tsx
src/components/filters/FilterBand.tsx` = 0, exact constat FV-06). Aucun rendu `(0)` en gris, aucun
état `…` pendant l'écart. `resultCount`/`resultCountLoading` de la zone (4) étaient déjà exposés
par un lot antérieur (`DR-139`, vérifié, non re-corrigé). Les effectifs de l'écran G (`FV-05`,
`EX-SCR-216`) n'atteignaient pas non plus `ScreenG` (`counts`/`modelCounts` absents de ses props,
alors que `screen-g-model.ts#searchMakes/searchModels` les acceptaient déjà).

**Sonde rouge** (nouvelle) : `tests/review/D5/facet-counts.test.ts` (`R-D5-29`) — sur le code
d'avant correction, `CheckboxList` n'avait pas de prop `facetCountsPending` (erreur de type) et ne
rendait aucun style d'atténuation pour `(0)`.

**Correction** :
- `src/components/filters/types.ts` : `FilterControlProps.facetCountsPending?: boolean`.
- `src/components/filters/controls/CheckboxList.tsx` : `(n)` normal, `(0)` avec
  `style={{ opacity: 0.55 }}` (checkbox jamais désactivée par l'effectif), `(…)` si
  `facetCountsPending`, aucune parenthèse si `facetCounts` absent (jamais `(0)` par défaut).
- `FilterFieldRow.tsx` / `PrimaryLine.tsx` / `SecondaryGroups.tsx` : nouvelle prop `facetCounts?:
  ReadonlyMap<string, FacetCounts>` (par filtre) et `facetCountsPending?: boolean`, routées jusqu'à
  `ControlRenderer`/`CheckboxList`. `FilterFieldRow`/`PrimaryLine`/`SecondaryGroups` gagnent aussi
  `compact?: boolean` pour `EX-SCR-98` (§1.5).
- `FilterBand.tsx` : props publiques `facetCounts?`, `facetCountsPending?`.
- `ScreenG.tsx` : nouvelles props `counts?: ReadonlyMap<number, number>`, `modelCounts?:
  ReadonlyMap<string, number>`, routées vers `searchMakes`/`searchModels` (déjà prêts à les
  recevoir). `FilterBand.tsx` : props publiques `screenGMakeCounts?`, `screenGModelCounts?`.
- Compteur zone (4) (`resultCount`/`resultCountLoading`) : **constaté déjà exposé**, non modifié.
- Double compteur fil d'Ariane « `<n>` offres | `<n>` ici » (`EX-SCR-46`, `EX-SRCH-21/22`) :
  **hors périmètre d'écriture** — le fil d'Ariane est rendu par `src/app.tsx` (breadcrumb),
  `selectionHashWithoutTaxonomy` n'existe dans aucun module du moteur à ce jour (`grep -rn
  selectionHashWithoutTaxonomy src` = 0 avant comme après ce lot) : rien à exposer côté
  `src/components/filters`/`src/state` qui ne le soit déjà (`resultCount` suffit à afficher le
  premier des deux nombres). **Câblage attendu de fix-app**, détaillé au §2.

**Preuve verte** : `npx vitest run --config vitest.review.config.ts tests/review/D5/facet-counts.test.ts`
→ 4/4. Aucune sonde existante modifiée.

**Statut : CORRIGÉ** (facettes + écran G) ; **doc uniquement** pour le double compteur du fil
d'Ariane (aucun code à écrire dans mon périmètre).

### 1.3 D8-12 — libellés `[EXTRAPOLÉ]` et suggestions par distance d'édition (DR-132, DR-134)

**R-D5-10 (`EX-NFR-29`, `zipr`)** : sonde déjà écrite en 2.6, promue `it.fails` (dette consignée).
Correction : `src/state/filter-registry.ts`, `RADIUS_OPTS` — labels `"<n> km [EXTRAPOLÉ]"` (même
convention que `NUMBER_OF_OWNERS_OPTS`). Sonde repassée `it.fails` → `it` dans le même commit
(`D8-19`) : `tests/review/D5/labels-fr.test.ts`. Preuve : `npx vitest run --config
vitest.review.config.ts tests/review/D5/labels-fr.test.ts` → 9/9.

**R-D5-13 (`EX-SCR-80`, suggestions)** : sonde déjà écrite en 2.6, promue `it.fails`. Décision
`D8-12` resserre le seuil normatif (« distance de Levenshtein ≤ 3 » du texte v1.1) à **≤ 2**.
Correction : `src/components/filters/filter-search.ts` — `levenshteinDistance` (DP classique, sans
dépendance externe), `bestWordDistance` (compare mot à mot le libellé, pas la chaîne complète avec
ses espaces — sinon aucun libellé à plusieurs mots ne serait jamais assez proche),
`suggestClosestFilters` (3 plus proches, index FR/EN/paramètre — les trois d'`EX-SCR-79`).
`FilterSearchResult.isFuzzy: boolean` distingue une correspondance exacte d'un repli.
`FilterSearch.tsx` : message « Aucun filtre ne correspond à « … » — suggestions : … » quand
`isFuzzy`. Sonde repassée `it.fails` → `it` dans le même commit (`D8-19`), enrichie de 2 cas
(correspondance exacte reste non-fuzzy ; aucun filtre proche → tableau vide) :
`tests/review/D5/keyboard-band.test.ts`. Preuve : 18/18.

**Statut : CORRIGÉ** (les deux dettes DR-132/DR-134).

### 1.4 D8-14 — formateur d'année, `aria-allowed-attr` écran G, formulaire d'enregistrement prérempli

**Formateur d'année (FV-14, `EX-SCR-6`/`75`)** : `src/components/filters/labels.ts` —
`formatYear(n)` (`Intl.NumberFormat('fr-BE', { useGrouping: false })`) ; `formatNumberFr(n, unit)`
route vers `formatYear` dès que `unit === 'année'`. `labels.test.ts` mis à jour (l'assertion
comparait `formatNumberFr(2015)` **sans** unité, qui reste groupé à dessein — seul l'appel AVEC
`unit: 'année'` change de comportement) + nouveau bloc `FV-14`. Sonde de revue :
`tests/review/D5/labels-fr.test.ts` inchangée (ne testait pas le formatage numérique) ; couverture
ajoutée dans `labels.test.ts` (unitaire, hors `tests/review/`) — **portée à `CompareScreen.tsx`
hors périmètre d'écriture** : `formatYear` est exporté pour que fix-screens l'y branche
(actuellement l'écran C affiche encore « 2 008 – 2 026 », `journal P3-C5`).

**`aria-allowed-attr` écran G (FV-16, axe-core critique ×82)** : `aria-selected` était posé sur le
`<button>` interne de `ScreenGMakeRow` — `button` (rôle implicite) ne supporte pas cet attribut.
Déplacé sur le `<li role="option">` (rôle qui le déclare), pour les deux lignes
(`ScreenGMakeRow`/`ScreenGModelRow`). Sonde rouge (nouvelle, `R-D5-28`) puis verte :
`tests/review/D5/screen-g.test.ts` → 20/20 (dont les 2 nouveaux tests).

**Formulaire « Enregistrer la recherche » préempli (FV-24, `EX-SCR-94`, résidu `DR-139`)** :
- `labels.ts` : `buildSearchDescription(tokens, now?)` — jointure des textes de jetons par ` · `
  (`Opel Corsa · ≤ 20 000 €`), tronquée à `SAVE_SEARCH_NAME_MAX_LENGTH = 60`, repli sur un nom
  horodaté si aucun filtre actif (jamais un champ vide).
- Nouveau `SaveSearchForm.tsx` (composant **sans hook**, même principe que
  `ScreenGEmptyNotice`/`CheckboxList` — testable directement) : champ prérempli et éditable,
  `Enregistrer` désactivé sur un nom vide/blanc, `Annuler`.
- `FilterBand.tsx` : état `saveSearchDraft` (préempli à l'ouverture par `buildSearchDescription`) ;
  `onSaveSearch` public change de signature `() => void` → `(name: string) => void` (appelé avec
  le nom VALIDÉ du formulaire, pas immédiatement au clic du bouton de la zone (4), qui ouvre
  maintenant le formulaire au lieu d'enregistrer directement).

**Preuve verte** : `npx vitest run --config vitest.review.config.ts
tests/review/D5/regime-and-shortcuts.test.ts` (bloc `R-D5-33`) → inclus dans les 18/18 du fichier ;
`labels.test.ts` (unitaire) 19/19.

**Statut : CORRIGÉ** (les trois points) ; **câblage attendu de fix-app** pour le formulaire,
détaillé au §2 — `src/app.tsx` l.738-742 ignore aujourd'hui le nom reçu (`() =>
saveCurrentSearch(defaultSearchName())`, arité 0).

### 1.5 D8-15 — régimes du bandeau, raccourci `/`, notification de cascade

**Régimes (`EX-SCR-96` intermédiaire, `EX-SCR-97` compact, `EX-SCR-98` paliers)** :
- `band-model.ts` : `type BandRegime = 'large' | 'intermediaire' | 'compact'`.
- `FilterBand.tsx` : prop publique `regime?: BandRegime` (défaut `'large'`, comportement
  **inchangé** pour tout appelant qui ne la fournit pas — `src/app.tsx` n'a rien à changer pour
  rester correct). Régime `compact` : rendu alternatif — barre 56 px (`Filtres (n)`, jetons actifs
  défilants, compteur), qui ouvre une **feuille plein écran** (`role="dialog"`) portant
  `PrimaryLine` + `FilterSearch` + `SecondaryGroups` sur une sélection **BROUILLON**
  (`draftSelection`, distincte de la sélection appliquée) — les changements n'atteignent
  l'historique/le moteur qu'au clic sur le bouton du pied, jamais avant (`EX-SCR-97`, « application
  différée »). Pied : `Réinitialiser` (vide le brouillon) et
  `deferredApplyLabel(props.projectedResultCount)` (« Voir les `<n>` offres », ou un libellé neutre
  tant que l'appelant n'a pas fourni l'effectif projeté). Nouvelles props publiques
  `projectedResultCount?`, `onDraftSelectionChange?` (l'appelant peut recalculer l'effectif projeté
  à chaque modification du brouillon). Les régimes `large`/`intermediaire` gardent la structure
  existante (`data-regime` posé pour la CSS de fix-app — la mise en page proprement dite,
  media queries et deux-lignes de la ligne primaire, est un point de style qui appartient à
  `src/app/app.css`, hors périmètre `src/components/filters`).
- **`EX-SCR-98`** (paliers → liste déroulante native en compact) : `RangeControl.tsx` — la partie
  « paliers » est extraite en composant **sans hook** `RangeSteps` (même contrainte que
  `ScreenGMakeRow`/`CheckboxList` : `RangeControl` porte `useState`, donc n'est pas appelable
  directement par une sonde ; `RangeSteps`, lui, l'est). `compact === true` → `<select>` natif
  avec une option de garde (« Palier suggéré… ») ; sinon les boutons existants, inchangés.
  **Constat** : aucun « histogramme miniature » n'existe dans `RangeControl` à ce jour (`grep -rn
  "histogramme miniature\|MiniHistogram" src/components/filters` = 0 résultat avant comme après ce
  lot) — rien à masquer de ce côté, seule la forme du contrôle de palier change.
- Le régime `compact` de l'**écran D** (`EX-SCR-209`) est hors périmètre (`src/screens/listings`,
  fix-screens).

**Raccourci `/` (`EX-SCR-81`)** : `band-model.ts` — `isTypingTarget(tagName, isContentEditable)`,
fonction pure (garde : bloque le raccourci si le focus est déjà dans un `INPUT`/`TEXTAREA`/
`SELECT`/élément `contenteditable`). `FilterBand.tsx` : `useEffect` posant un `keydown` global sur
`document`, focus de `FILTER_SEARCH_INPUT_ID` (exporté par `FilterSearch.tsx`) si la garde
l'autorise. **Non sondable par une sonde D5** faute d'environnement DOM
(`vitest.review.config.ts#environment: 'node'`) — même contrainte documentée pour `ScreenG`/
`keyboard-nav.ts` : seule la garde pure (`isTypingTarget`) est vérifiée par sonde, le branchement
`useEffect` est un point d'intégration réelle (E2E, 2.9).

**Notification de cascade (`EX-SCR-73`, « `<n>` filtres retirés / Annuler »)** : `band-model.ts` —
`cascadeRemovalMessage(removedFilterIds)`, pure : `null` si rien n'a été retiré PAR LA CASCADE
(pas le retrait direct de l'utilisateur), sinon « `<n>` filtre(s) de `<groupe>` retiré(s) » quand
tous les filtres retirés partagent un groupe (cas normatif des 9 filtres de leasing sous
`hasLeasing`), repli générique sinon. `cascadeRemoveOrphans` (dans `FilterBand.tsx`) retourne
désormais la liste des identifiants retirés (avant : `void`) ; `handleRemove`/`handleRemovePartial`/
`handleNarrow` arment la notification (état + minuteur 5 s, nettoyé au démontage) ; bouton
`Annuler` restitue la sélection D'AVANT le retrait direct ET sa cascade, en un seul geste.

**Sonde rouge/verte** (nouvelle) : `tests/review/D5/regime-and-shortcuts.test.ts` (`R-D5-30` à
`R-D5-34`) → 18/18. Aucune sonde existante modifiée.

**Statut : CORRIGÉ** (régimes, raccourci — garde pure —, notification, `EX-SCR-98`) ; **dette
produit ratifiée, non implémentée** : `EX-SCR-95` (« Assainissement KYCAR ») ; **câblage requis**
de fix-app pour rendre le raccourci et les régimes effectifs en production (détaillé au §2).

### 1.6 FV-17 — `mk` dans `UI_STATE_PARAMS` (constaté, pas corrigé)

**Constat** : `src/state/url-codec.ts`, `UI_STATE_PARAMS`, contient déjà `{ param: 'mk',
historyMode: 'replace' }` (ajouté par un commit fix-state antérieur à ce lot, `aff6c7e`), et
`url-codec.test.ts` le vérifie déjà (`expect(byParam.get('mk')).toBe('replace')`). Le constat
FV-17 de `FINAL-VERIFICATION.md` (« `mk` absent de l'URL ») porte sur le CÂBLAGE (l'état déplié
d'une carte, dans `src/app.tsx`/`MakeCard.tsx`, n'appelle jamais l'écriture de ce paramètre) — pas
sur le codec, déjà conforme. **Rien à corriger dans mon périmètre** ; vérifié en relançant
`npx vitest run --no-file-parallelism src/state/url-codec.test.ts` (21/21, y compris ce cas).
**Câblage attendu de fix-app**, détaillé au §2.

---

## 2. Câblage attendu de fix-app (props exactes)

### 2.1 `<FilterBand>` — props déjà publiques, non encore branchées par `src/app.tsx`

| Prop | Type | Attendu |
|---|---|---|
| `facetCounts` | `ReadonlyMap<string, FacetCounts>` (`FacetCounts = ReadonlyMap<string, number>`) | Un `Map` par `filterId`, recalculé après chaque changement appliqué (`onSelectionApplied`), depuis les `FacetCount` que le moteur produit déjà (sonde D4, jamais consommés à ce jour). |
| `facetCountsPending` | `boolean` | `true` pendant l'écart de recalcul (même fenêtre que `resultCountLoading`). |
| `screenGMakeCounts` | `ReadonlyMap<number, number>` | Effectifs par `makeId` sous le périmètre filtré courant (`EX-SCR-216`). |
| `screenGModelCounts` | `ReadonlyMap<string, number>` | Effectifs par `modelKey(makeId, modelId)` (`src/types/reference.ts`). |
| `regime` | `'large' \| 'intermediaire' \| 'compact'` | Calculé depuis la largeur de fenêtre (`matchMedia`, seuils `EX-SCR-96`/`97` : 768/1280 px). |
| `projectedResultCount` | `number \| undefined` | Recalculé à chaque `onDraftSelectionChange` (voir ci-dessous), pour le libellé « Voir les `<n>` offres » du régime compact. |
| `onDraftSelectionChange` | `(draft: SelectionState) => void` | Reçoit la sélection brouillon de la feuille compacte à chaque changement — permet de recalculer `projectedResultCount` sans toucher à la sélection réellement appliquée. |

### 2.2 `onSaveSearch` — signature CHANGÉE (résidu `DR-139`, `EX-SCR-94`)

`src/app.tsx` l.738-742 câble aujourd'hui `onSaveSearch={() => saveCurrentSearch(defaultSearchName())}`
— une fonction d'arité 0, toujours acceptée par TypeScript (compatible avec la nouvelle signature
`(name: string) => void` par contravariance des paramètres), **mais qui ignore le nom prérempli et
validé par `SaveSearchForm`**. Câblage attendu :

```tsx
onSaveSearch={
  marketPhase.phase === 'loaded' || view.kind !== 'market'
    ? (name: string) => saveCurrentSearch(name)
    : undefined
}
```

### 2.3 `mk` (état déplié des cartes, FV-17)

Le codec accepte déjà `mk` (`historyMode: 'replace'`) — reste à l'écrire depuis `src/app.tsx`/
`MakeCard.tsx` : à chaque bascule d'expansion d'une carte-marque, poser/retirer son `makeId` dans
l'état d'interface `mk` (liste de `makeId` dépliés, format libre côté app puisque le codec ne
connaît que `param → FilterValue`), via le même mécanisme que `grp`/`g4v`.

### 2.4 Raccourci `/` et régimes — condition d'exercice réelle

Le raccourci (`useEffect` de `FilterBand.tsx`) et le rendu compact/intermédiaire sont déjà dans le
composant monté par `src/app.tsx` (aucun câblage supplémentaire requis pour le raccourci) ; seule
la prop `regime` doit être fournie pour que les régimes intermédiaire/compact se déclenchent (par
défaut `'large'`, comportement actuel inchangé).

### 2.5 Double compteur du fil d'Ariane (`EX-SCR-46`, hors périmètre `src/components/filters`)

`selectionHashWithoutTaxonomy` n'existe dans aucun module du moteur — sa dérivation et son rendu
près du fil d'Ariane (`src/app.tsx`) sont un point de câblage ET de calcul moteur qui n'appartient
pas à `src/state`/`src/components/filters` (aucun fichier de ces deux périmètres ne rend le fil
d'Ariane). `resultCount` (déjà exposé) couvre le premier des deux nombres (« `<n>` offres »).

---

## 3. Vérifications rejouées

```
$ npx tsc --noEmit -p tsconfig.json && npx tsc --noEmit -p tsconfig.review.json
  → 0 erreur (les deux)
$ npx eslint src tests
  → vert
$ npx vitest run --no-file-parallelism src/state src/components
  Test Files  11 passed (11)   Tests  183 passed (183)
$ npx vitest run --config vitest.review.config.ts tests/review/D5
  Test Files  14 passed (14)   Tests  151 passed (151)
$ npx vitest run --config vitest.review.config.ts
  Test Files  81 passed (81)   Tests  834 passed (834)   (dist/ construit au préalable)
$ npm run build
  → 0 erreur, bundle initial 93.22 Kio gzip (JS) + 2.54 Kio (CSS) — marge intacte sous 300 Kio
$ npm run lint
  → vert
$ npm test
  Test Files  81 passed (81)   Tests  834 passed (834)
```

Une seule instabilité observée en cours de travail : `tests/review/D3/dataset-100k.test.ts ›
R-D3-02` (marge ~200 ms) a échoué une fois pendant une exécution `vitest run --config
vitest.review.config.ts` sans restriction de fichier (donc sous charge machine plus élevée),
et repasse vert de façon reproductible en isolation (`npx vitest run --config
vitest.review.config.ts tests/review/D3/dataset-100k.test.ts`, 27/27) — comportement déjà noté et
accepté par `D8-22` (« sensible à la charge machine »). Aucun fichier de `src/providers`/
`DataProvider` n'a été touché par ce lot ; non attribuable à `fix-state`.

## 4. Sondes `it.fails` → `it` (D8-19)

| Sonde | Fichier | Dette levée |
|---|---|---|
| `R-D5-10` | `tests/review/D5/labels-fr.test.ts` | DR-132 (libellés `zipr` marqués `[EXTRAPOLÉ]`) |
| `R-D5-13` | `tests/review/D5/keyboard-band.test.ts` | DR-134 (suggestions par distance d'édition ≤ 2) |

Aucune sonde verte n'a été modifiée pour la faire passer (D-31) : les deux changements ci-dessus
sont les seules sondes `it.fails` retournées par ce lot.

## 5. Nouvelles sondes de revue (D-32, sonde d'abord)

| Fichier | Points couverts |
|---|---|
| `tests/review/D5/mmmv-tokens.test.ts` (`R-D5-27`) | D8-04d — jetons `mmmv` par niveau |
| `tests/review/D5/facet-counts.test.ts` (`R-D5-29`) | D8-05 — `(n)`/`(0)` gris/`…` de `CheckboxList` |
| `tests/review/D5/screen-g.test.ts` (`R-D5-28`, ajoutée) | D8-14 — `aria-allowed-attr` écran G |
| `tests/review/D5/regime-and-shortcuts.test.ts` (`R-D5-30`…`R-D5-34`) | D8-15 — raccourci `/`, notification de cascade, libellé d'application différée, `EX-SCR-98` ; D8-14 (résidu) — description du formulaire d'enregistrement |

## 6. Fichiers modifiés/créés

`src/state/filter-registry.ts` (labels `[EXTRAPOLÉ]` de `zipr`) ; `src/components/filters/labels.ts` ;
`src/components/filters/ActiveFilterTokens.tsx` ; `src/components/filters/FilterBand.tsx` ;
`src/components/filters/FilterFieldRow.tsx` ; `src/components/filters/PrimaryLine.tsx` ;
`src/components/filters/SecondaryGroups.tsx` ; `src/components/filters/FilterSearch.tsx` ;
`src/components/filters/filter-search.ts` ; `src/components/filters/ScreenG.tsx` ;
`src/components/filters/screen-g-model.ts` ; `src/components/filters/band-model.ts` ;
`src/components/filters/types.ts` ; `src/components/filters/controls/CheckboxList.tsx` ;
`src/components/filters/controls/RangeControl.tsx` ; `src/components/filters/SaveSearchForm.tsx`
(nouveau) ; `src/components/filters/filter-band.css` (nouveau, §7.1) ;
`src/components/filters/screen-g.css` (nouveau, §7.1) ; `src/components/filters/labels.test.ts` ;
`tests/review/D5/labels-fr.test.ts` ; `tests/review/D5/keyboard-band.test.ts` ;
`tests/review/D5/screen-g.test.ts` ; `tests/review/D5/band-actions.test.ts` (prop `onNarrow`
ajoutée à `BASE_PROPS`) ; `tests/review/D5/mmmv-tokens.test.ts` (nouveau) ;
`tests/review/D5/facet-counts.test.ts` (nouveau) ; `tests/review/D5/regime-and-shortcuts.test.ts`
(nouveau).

Aucun fichier hors périmètre modifié ni commité (`src/app.tsx`, `docs/` intacts ; `tests/e2e/` —
voir §7 pour l'usage temporaire, non commité, des sondes qui y vivent).

---

## 7. Constats du harnais E2E traités (message du coordinateur en cours de lot)

`tests/e2e/` est **hors périmètre d'écriture** (interdit à `fix-state`) et les fichiers de sonde
concernés (`a11y.spec.ts`, `clavier.spec.ts`, `responsive.spec.ts`, `_helpers.ts`) n'existent PAS
dans ce worktree : `fix28/state` a divergé de `claude/kycar-project-ffcplk` **avant** la fusion du
harnais E2E (`git merge-base HEAD origin/claude/kycar-project-ffcplk` = `1226aeb`, antérieur à la
fusion `a85c037 "Merge fix/e2e"`). Pour vérifier chaque correction sans rien commiter hors
périmètre, les trois fichiers de sonde ont été récupérés temporairement
(`git show origin/claude/kycar-project-ffcplk:tests/e2e/<fichier> > tests/e2e/<fichier>`), testés,
puis **supprimés** avant la fin du lot (`git status --porcelain tests/e2e/` vide au commit — vérifié
ci-dessous). **La levée de l'annotation `test.fail()` sur ces trois tests (règle D8-17) reste à
faire par l'agent/le coordinateur qui possède `tests/e2e/`** — elle ne peut pas être commitée
depuis ce worktree sans violer l'interdit de périmètre.

### 7.1 E2E-21 (MAJEUR) — aucune feuille de style pour le bandeau/écran G

**Correction** : deux nouveaux fichiers, importés en effet de bord (même convention que
`market.css`/`MarketScreen.tsx`) :
- `src/components/filters/filter-band.css`, importé par `FilterBand.tsx` — les quatre zones
  d'`EX-SCR-55`, tous les `.kycar-control` et leurs variantes, `.kycar-active-tokens`/`.kycar-token`,
  `.kycar-cascade-notice`, `.kycar-save-search-form`, le régime intermédiaire
  (`[data-regime='intermediaire'] .kycar-primary-line`, deux lignes de contrôles) et le régime
  compact (`.kycar-filter-band--compact`, `.kycar-compact-bar`, `.kycar-compact-sheet`).
- `src/components/filters/screen-g.css`, importé par `ScreenG.tsx` — `.kycar-screen-g`, les deux
  panneaux à hauteur FIXE (nécessaire au calcul de fenêtrage, `SCREEN_G_ROW_HEIGHT_PX`/
  `SCREEN_G_VISIBLE_ROWS`), `.kycar-screen-g__option` (état `aria-selected` visible).

Les deux fichiers lisent `var(--color-*, --space-*, --radius-*)` de `src/styles/tokens.css`
(lecture seule) ; les seuils de régime reprennent ceux de `src/styles/breakpoints.ts` (768/1280 px,
recopiés en dur — une media query ne peut pas importer une constante JS).

**Preuve** (sonde `E2E-21`, `tests/e2e/responsive.spec.ts`, récupérée temporairement — voir
préambule) :
```
$ KYCAR_E2E_PORT=4182 npx playwright test tests/e2e/responsive.spec.ts --project=desktop -g "E2E-21"
[MESURE] EX-SCR-96 — règles CSS chargées (bandeau / contrôle / écran G) : true / true / true
  ✓ … CONSTAT E2E-21 …
  1) … Expected to fail, but passed.   ← l'assertion sous-jacente est VERTE ; seule l'annotation
                                          test.fail() reste à retirer (D8-17, hors périmètre)
```
Rejoué sur les trois projets (`desktop`/`tablet`/`mobile`) : même résultat (`true / true / true`).
`npm run build` + `npm run size` : 102,08/300 Kio gzip (CSS ajouté : 3,8 Kio gzip, marge intacte) ;
`tests/review/D8/nfr9-size.test.ts`/`parcours.test.ts` (budget `EX-NFR-9`, 900 Kio/1,8 s) : 192,2 Kio
transférés, toujours verts.

### 7.2 E2E-12 (MAJEUR) — écran G, `aria-allowed-attr` + `nested-interactive` (axe)

Le correctif D8-14 initial (déplacer `aria-selected` du `<button>` vers le `<li role="option">`,
§1.4) était **insuffisant** : un rôle `option` compte comme interactif pour axe, donc le `<button>`
(marque) / `<input type="checkbox">` (modèle) restés IMBRIQUÉS déclenchaient toujours
`nested-interactive`, et `aria-setsize` posé sur le `<ul role="listbox">` lui-même (en plus des
options) restait un `aria-allowed-attr` invalide (`listbox` n'est pas un membre d'ensemble).

**Correction** (`ScreenG.tsx`, `screen-g-model.ts`) :
- Plus AUCUN élément interactif natif (`button`/`input`/`a`) sous un `<li role="option">` — le clic
  est posé sur le `<li>` lui-même (`ScreenGMakeRow`/`ScreenGModelRow`, et l'option « Tous les
  modèles » du panneau modèle, auparavant une `<label><input type="checkbox">` nue).
- `aria-setsize` retiré des deux `<ul role="listbox">` (il ne reste que sur les options, où il
  était déjà correct depuis D8-14).
- Navigation clavier `ArrowUp`/`ArrowDown` au sein d'un panneau : motif APG « la sélection suit le
  focus », porté par `aria-activedescendant` sur le `<ul>` (pas de `tabindex` par option) —
  `computeScrollTopToReveal` (nouvelle fonction pure, `screen-g-model.ts`) fait défiler la fenêtre
  pour que l'option ciblée soit RENDUE avant que `aria-activedescendant` n'y pointe (sinon
  l'attribut désignerait un id absent du DOM, fenêtrage `DR-060`).
- **Écart assumé et documenté** vis-à-vis de la description du coordinateur (« option = l'élément
  focalisable lui-même ») : implémenté avec `aria-activedescendant` (le `<ul>` garde le focus DOM
  réel, l'option « active » est désignée par l'attribut) plutôt qu'avec un `tabindex` roulant par
  option — les DEUX motifs sont normatifs pour un listbox à sélection unique (WAI-ARIA APG), et
  celui retenu évite la complexité et les risques de timing d'un déplacement de focus DOM
  programmatique après un rendu fenêtré. Le piège de focus existant (six arrêts, `Tab` intercepté)
  n'exerce que les arrêts `list-make`/`list-model` eux-mêmes (les `<ul>`), pas d'option individuelle
  — cette lecture n'affecte donc aucune sonde/E2E existante (vérifié, §7.4).

**Preuve** (sonde `E2E-12`, `tests/e2e/a11y.spec.ts`) :
```
$ KYCAR_E2E_PORT=4182 npx playwright test tests/e2e/a11y.spec.ts --project=desktop -g "E2E-12"
[MESURE] axe — G (modale marque/modèle) : 0 violation
  ✓ … CONSTAT E2E-12 …
  1) … Expected to fail, but passed.
```
Rejoué sur `desktop`/`tablet`/`mobile` : `0 violation` dans les trois cas. Sonde de revue
`tests/review/D5/screen-g.test.ts` (`R-D5-28` réécrite, `R-D5-36` nouvelle pour
`computeScrollTopToReveal`) → 25/25.

### 7.3 E2E-14 (MAJEUR) — focus non restitué à la fermeture de l'écran G

**Correction** (`ScreenG.tsx`) : le `useEffect` de montage mémorise `document.activeElement` (le
bouton qui a ouvert la modale) avant de déplacer le focus vers le champ de recherche marque, et le
restitue dans la fonction de nettoyage du MÊME effet — exécutée à chaque démontage, quel que soit
le chemin de fermeture (`Échap`, `Annuler`, `Appliquer` déclenchent tous `setScreenGOpen(false)`
côté `FilterBand`). **Aucune prop `returnFocusTo` ajoutée** : l'appelant n'a rien à fournir, ce qui
évite tout câblage `fix-app` pour ce point précis (contrairement à ce que la mission envisageait
comme possible côté coquille).

**Preuve** (sonde `E2E-14`, `tests/e2e/clavier.spec.ts`) :
```
$ KYCAR_E2E_PORT=4182 npx playwright test tests/e2e/clavier.spec.ts --project=desktop -g "E2E-14"
[MESURE] clavier — focus après fermeture de l’écran G : button|Choisir une marque et un modèle
  ✓ … CONSTAT E2E-14 …
  1) … Expected to fail, but passed.
```
Rejoué sur `desktop`/`tablet`/`mobile` : même résultat (focus rendu au bouton `Choisir une marque
et un modèle`) dans les trois cas.

### 7.4 Non-régression vérifiée sur les sondes E2E voisines

Fichiers COMPLETS rejoués (pas seulement `-g`) pour vérifier l'absence de régression sur les tests
déjà verts avant ce lot :
- `clavier.spec.ts` (9 tests, `desktop`) : le piège de focus à six arrêts (4 arrêts distincts
  visités sur 12 tabulations) et les 70/70 contrôles de la ligne primaire restent verts ; seuls
  E2E-14 (ci-dessus), E2E-15/E2E-16 (hors périmètre, `app.tsx`/titres) diffèrent.
- `a11y.spec.ts` (8 tests, `desktop`) : B/C/E/F/`/mentions` restent à 0 violation ; E2E-11/E2E-13
  (hors périmètre) inchangés ; E2E-12 corrigé (ci-dessus).
- `responsive.spec.ts` (9 tests, `desktop`) : E2E-19 (aucun défilement horizontal) reste vert — les
  deux nouvelles feuilles de style n'introduisent aucun débordement ; E2E-17/E2E-18 (hors
  périmètre) inchangés ; E2E-21 corrigé (ci-dessus).

### 7.5 Câblage restant, hors périmètre `fix-state`

- **D8-17** : retirer l'annotation `test.fail()` des trois tests `CONSTAT E2E-21`/`E2E-12`/`E2E-14`
  dans `tests/e2e/responsive.spec.ts`/`a11y.spec.ts`/`clavier.spec.ts` (branche
  `claude/kycar-project-ffcplk`, hors de ce worktree) — preuve ci-dessus, corrections déjà en place
  dans `fix28/state`.
- Aucun autre câblage requis pour ces trois points (E2E-14 est auto-suffisant, E2E-21/E2E-12 sont
  des corrections internes à `src/components/filters`).
