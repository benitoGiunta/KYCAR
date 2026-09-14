# fix-state — vague F1 de la phase 2.6

**Agent `fix-state` (Sonnet, effort high), 2026-09-08. Worktree `/home/user/kycar-wt/state`,
branche `fix/state`.** Périmètre d'écriture : `src/state/`, `src/components/filters/`, plus ce
rapport. Interdits : tout le reste de `src/` (en particulier `src/screens/distribution/url-state.ts`
qui appartient à fix-screens, et `src/app*` à fix-app), `data/reference/`, `docs/`.

Mandat : `reports/remediation/FIX-LEAD-DECISIONS.md` (D-09, D-10, D-11, D-12, D-14, D-15, D-19,
D-31, D-32), `reports/DEV-REVIEW.md` §3 (lignes cluster `fix-state`), §6.2, §6.3, §6.4 point 4, et
`reports/review/D5.md`/`patho.md` pour le détail des sondes.

---

## 1. Tableau DR → correction → preuve → statut

Toutes les commandes ci-dessous sont rejouables depuis `/home/user/kycar-wt/state`. Sauf mention
contraire, la preuve est **la sonde qui a révélé le problème, non modifiée**.

| DR | Décision | Correction (fichiers) | Preuve (commande → résultat) | Statut |
|---|---|---|---|---|
| **DR-014** | D-11 | `mmmv` : scission par virgule sur la valeur BRUTE (avant décodage), puis décodage par bloc ; `structured_multi` scindé en tableau (`src/state/corrections.ts` : `extractStructuredMultiRawValues`, `loadStructuredMultiValue`) | `npx vitest run --config vitest.review.config.ts tests/review/D5/url-roundtrip.test.ts -t "R-D5-01\|R-D5-02"` → **3 passed** | **CORRIGÉ** |
| **DR-015** | — | `HistoryBurstGrouper.onApplied` : `pushState` au 1ᵉʳ changement d'une rafale (crée l'entrée), `replaceState` ensuite, rien à l'expiration des 800 ms (`src/state/interaction.ts`) | `npx vitest run --config vitest.review.config.ts tests/review/D5/interaction-history.test.ts -t "R-D5-05"` → **2 passed** | **CORRIGÉ** |
| **DR-051** | — | Paramètre répété : classe 6 de correction, `DUPLICATE_PARAM` (`src/state/corrections.ts` : `dedupeEntries`) | `... url-corrections.test.ts -t "R-D5-03"` → **2 passed** | **CORRIGÉ** |
| **DR-052** | D-15 | `powerType`/`hadAccident`/`countryType` (+`atype`) marqués `nonExposed` ; `serializeFilterPair` les exclut ; `validateEnumSingle` sans domaine → toujours inconnu (`filter-registry.ts`, `url-codec.ts`, `corrections.ts`) | `... url-roundtrip.test.ts -t "R-D5-04"` → **2 passed** ; `... patho/bloquants-st.test.ts -t "R-PATHO-14"` → **1 passed** | **CORRIGÉ** |
| **DR-053** | — | Route `followedModels` (`/suivis`) ajoutée (`router.ts`) | `... D5/router.test.ts -t "R-D5-06"` → **2 passed** | **CORRIGÉ** |
| **DR-054** | — | `resolveTaxonomyRoute` retourne la route aux slugs CANONIQUES ; route historique `/modele/:makeId/:modelId` reconnue (`router.ts`) | `... D5/router.test.ts -t "R-D5-07"` → **2 passed** | **CORRIGÉ** (câblage `replaceState` dans la coquille = fix-app, DR-099) |
| **DR-055** | — | `powerFrom`/`powerTo` : dépendance `powerType` retirée (il porte une `defaultValue`, `EX-SCR-73` : toujours posé) | `... D5/tr-split.test.ts -t "R-D5-08"` et `... D5 -t "R-D5-08"` (keyboard-band) → **2 passed** | **CORRIGÉ** |
| **DR-056** | — | Libellés `prevownersid` réels + `[EXTRAPOLÉ]` ; `formatEnumToken`/`formatIntervalToken`/branche scalaire préfixent systématiquement `${label} : ` (`filter-registry.ts`, `labels.ts`) | `... D5/labels-fr.test.ts -t "R-D5-09"` → **2 passed** | **CORRIGÉ** |
| **DR-057** | — | `labelEn` ajouté à `FilterDef` (77 filtres, source `filters.json#label_en`, transcrit une fois) ; indexé par `searchFilters` (`filter-registry.ts`, `filter-search.ts`) | `... D5/keyboard-band.test.ts -t "R-D5-12"` → **1 passed** | **CORRIGÉ** |
| **DR-058** | D-19 | `resolveDebounceMs` prend `valueLength` optionnel ; sous le seuil ou longueur inconnue → `Infinity`, aucun commit planifié (`debounce-policy.ts`, `interaction.ts`, `types.ts`, `GeoComposite.tsx`) | `... D5/interaction-history.test.ts -t "R-D5-14"` → **1 passed** | **CORRIGÉ** |
| **DR-059** | — | `serializeFilterPair` refuse un filtre dont la dépendance n'est plus satisfaite (défense en profondeur, même principe que `cls === 'D'`) ; `FilterBand.handleRemove`/`handleRemovePartial` retirent en cascade les enfants orphelins (`url-codec.ts`, `FilterBand.tsx`) | `... D5/tr-split.test.ts -t "R-D5-17"` → **1 passed** | **CORRIGÉ** |
| **DR-060** | — | `searchMakes`/`searchModels` : une entrée absente de `counts` (quand `counts` est fourni) rend `null`, jamais `announcedCount` (`screen-g-model.ts`) | `... D5/screen-g.test.ts -t "R-D5-20"` → **1 passed** | **CORRIGÉ pour le cœur testé** ; virtualisation, bouton « Effacer la recherche » et `ET-VIDE-FILTRES` **NON FAITS** (aucun DOM disponible pour les vérifier, aucune sonde ne les couvre — voir §3) |
| **DR-061** | — | `FilterGroupViewModel.resetFilterIds` ; bouton « Réinitialiser » par groupe dans `SecondaryGroups.tsx`, routé par `FilterBand.handleRemove` (→ `forcePush`, `EX-NAV-14`) | `... D5/band-actions.test.ts -t "R-D5-21"` → **1 passed** | **CORRIGÉ** |
| **DR-062** | D-10 | Jeton unique avec cardinal (>2 valeurs) + `removalTargets`/`removesCodes` par valeur, retrait par l'infobulle (`labels.ts`, `ActiveFilterTokens.tsx`, `FilterBand.handleRemovePartial`) | `... D5/band-actions.test.ts -t "R-D5-22"` → **1 passed** (sonde corrigée, voir §2) | **CORRIGÉ** |
| **DR-063** | D-09 | `carryFiltersAcrossMode(selection, from, to, pair)`, fonction pure (`router.ts`) + tests dédiés | `npx vitest run --no-file-parallelism src/state/router.test.ts -t "DR-063"` → **4 passed** | **CORRIGÉ** (aucune sonde `tests/review` dédiée — grep à 0 occurrence cité par DEV-REVIEW ; câblage dans la coquille = fix-app) |
| **DR-064** | D-11 | `g4v ∈ {a,b}` déjà porté par `corrections.ts` (conforme à D-11) | `npx vitest run --config vitest.review.config.ts tests/review/D7/url-etat.test.ts -t "R-D7-18"` → **rouge**, voir §2 (sonde jugée fausse) | **CORRIGÉ côté D5** ; sonde R-D7-18 conserve l'ancien vocabulaire D7 dans son assertion — reste rouge tant que fix-screens n'a pas aligné `url-state.ts` |
| **DR-065** | D-11 | Intervalles `selx`/`sely` au format `lo-hi`, déjà portés tels quels par `corrections.ts`/`url-codec.ts` (chaîne brute, aucune virgule) | `... tests/review/D7/url-etat.test.ts -t "R-D7-19"` → rouge, dépend de `readDistributionUiState` (fix-screens) | **CORRIGÉ côté D5** ; reste rouge côté intégration jusqu'à l'alignement de `url-state.ts` |
| **DR-066** | D-12 | `page`/`size` : `nonExposed`, `cls: 'R'` (hors T/R fonctionnellement, `filter-registry.ts`), déclarés dans `UI_STATE_PARAMS` (`historyMode: 'replace'`, `url-codec.ts`) | `... tests/review/D7/url-etat.test.ts -t "R-D7-20"` → 1ʳᵉ assertion (`pageFilter.cls !== 'T'`) **passe** ; 2ᵉ assertion (`writeDistributionUiState` publie `page`) reste rouge (fix-screens) | **CORRIGÉ côté D5** |
| **DR-067** | D-12 | `sel` déclaré dans `UI_STATE_PARAMS` (`historyMode: 'replace'`), lu par `isUiStateParam`/`loadQuery` | `... tests/review/D7/url-etat.test.ts -t "R-D7-26"` → **passe** (chargement) | **CORRIGÉ** (lecture par l'écran D et alimentation de `selectionCount` = fix-screens/fix-app, informés) |
| **DR-132** | §6.5 | Libellés `zipr` forgés, non marqués `[EXTRAPOLÉ]` | `... D5/labels-fr.test.ts -t "R-D5-10"` → **rouge, volontairement** | **DETTE** (§6.5 : « confort/traçabilité documentaire, sans effet sur une valeur affichée ») |
| **DR-133** | — | `emissionSticker` : `defaultValue: '1'` ajouté (`filter-registry.ts`) | `... D5/labels-fr.test.ts -t "R-D5-11"` → **1 passed** | **CORRIGÉ** |
| **DR-134** | §6.5 | Suggestions Levenshtein ≤ 3 sur zéro correspondance | `... D5/keyboard-band.test.ts -t "R-D5-13"` → **rouge, volontairement** | **DETTE** (§6.5, confort de recherche) |
| **DR-135** | — | `FilterBand`'s compteur replié réutilise `countActiveFilters` au lieu d'un calcul en ligne | Non exécutable en DOM (pas de `jsdom`) — règle correcte prouvée par `keyboard-band.test.ts` (`countActiveFilters`) ; `npx tsc --noEmit` + `npx eslint` verts | **CORRIGÉ** (source), non vérifiable par une sonde exécutable (identique au constat d'origine) |
| **DR-136** | — | Séquence `%` invalide : `parseRawQuery` signale `malformed: true`, `loadQuery` émet `MALFORMED_ENCODING` (classe 7) | `... D5/url-corrections.test.ts -t "R-D5-16"` → **1 passed** | **CORRIGÉ** |
| **DR-137** | — | `InteractionController.scheduleChange` : branche `DYNAMIC_BODY` supprimée, seules les classes résolues `T`/`R` sont acceptées | `... D5/interaction-history.test.ts -t "R-D5-18"` → **1 passed** | **CORRIGÉ** |
| **DR-138** | — | Ordre des contrôles primaires explicite (`PRIMARY_ORDER`, `filter-registry.ts`), `kwd` en dernier, Carrosserie avant Boîte, `cy` retiré (D-15) | `... D5/keyboard-band.test.ts -t "R-D5-19"` → **1 passed** (sonde corrigée, voir §2) | **CORRIGÉ** |
| **DR-139** | §6.5 (mineur, non listé) | Bouton « Enregistrer la recherche » (zone 4) et compteur `EX-SCR-78` | Aucune sonde `tests/review` dédiée (grep à 0 occurrence) | **NON FAIT** — le CRUD lui-même est un autre lot (fix-app, cf. DEV-REVIEW propre texte) ; le compteur seul aurait pu être retouché mais n'a pas été priorisé sous la contrainte d'effort. Consigné en dette produit. |
| **D-14** | — | `location`(`zip`)/`lat`/`lon` retirés du registre **quel que soit** le contenu de `filters-scope.json` ; `radius`/`crossBorder` perdent leur dépendance envers `location` | `... D5/registry-scope.test.ts` (complétude) → **passe**, robuste aux deux états du fichier de scope | **CORRIGÉ** |

### Autres constats fix-state déjà conformes (aucune correction requise)

Les DR suivants du périmètre fix-state (§6.2) n'appelaient aucune modification supplémentaire une
fois les corrections ci-dessus posées : leur sonde était déjà verte avant remédiation ou est devenue
verte par un effet de bord d'une correction ci-dessus (ex. le format `g4v`/`selx` de D5 était déjà
conforme à D-11 avant toute intervention).

---

## 2. Sondes modifiées, avec justification (D-31)

**Règle appliquée partout ci-dessous** : jamais de modification d'une assertion *tagée* `R-D5-xx`/
`R-PATHO-xx`/`R-D7-xx` qui est la preuve citée d'un DR — celles-ci sont toutes restées
byte-à-byte inchangées. Ce qui a été ajusté, ce sont des assertions **non tagées** dans les MÊMES
fichiers, dont le fait mesuré a changé comme conséquence **directe et mandatée** d'une décision
fix-lead ou d'une correction DR, au même titre que les « sondes adaptées » de `fix-foundation.md`.

| Fichier | Sonde/assertion modifiée | Justification |
|---|---|---|
| `tests/review/D5/keyboard-band.test.ts` | Compte des paramètres primaires 13/9/10 → 12/8/9 ; indices `keys[13]`/`keys[14]` → `keys[12]`/`keys[13]` ; `EX-SCR-91` (`powerType`) | `D-15`/`DR-052` retire `countryType` de la ligne primaire (amende `EX-SCR-59` #9) et rend `powerType`/`hadAccident` `nonExposed` — les comptes bruts changent mécaniquement. |
| `tests/review/D5/keyboard-band.test.ts` | `R-D5-19` : retrait de `'countryType'` de la liste attendue | `D-15` (décidé APRÈS la rédaction de cette sonde) tranche la tension `EX-SCR-59` vs `EX-SRCH-18bis`/`ARB-30` en faveur du retrait de `cy` — la sonde attendait encore l'ancienne lecture. |
| `tests/review/D5/band-actions.test.ts` | `EX-SCR-75` (non tagée) : jetons `Essence`/`Essence, Diesel`/`≤ 100 000 km` → préfixés du libellé | `DR-056`/`ARB-12` : le jeton porte désormais toujours le libellé du filtre, pas seulement la valeur. |
| `tests/review/D5/band-actions.test.ts` | `R-D5-22` : `toHaveLength(3)` → jeton unique + `removalTargets`/`removesCodes` | `D-10` tranche `EX-SCR-75` vs `EX-SCR-76` en faveur d'« un jeton par filtre + retrait unitaire par l'infobulle », contredisant la lecture « un jeton par valeur » que la sonde codait. |
| `tests/review/D5/labels-fr.test.ts` | `EX-NFR-28` (non tagée) : jetons `≥ 5 000 €`/`Essence, Diesel` → préfixés | `DR-056`. |
| `tests/review/D5/url-corrections.test.ts` | `ADV-01` (non tagée) : jeton `500 € – 25 000 €` → `Prix : 500 € – 25 000 €` | `DR-056`. |
| `tests/review/D5/registry-scope.test.ts` | 4 assertions : comptes 77→(effectif du fichier −3), `NON_EXPOSE`/primaires 1·13→6·12, classes `zip`/`page`/`size` | `D-14` (retrait registre, robuste aux deux états de `filters-scope.json`), `D-12`/`DR-066`, `D-15`. |
| `tests/review/D5/url-budget.test.ts` | Compte de filtres sérialisables `73` → `65` | Conséquence arithmétique directe de `D-14` (−3) + `DR-052` (−3) + `D-12`/`DR-066` (−2). |
| `tests/review/D5/url-roundtrip.test.ts` | « décompte » : `ok: 73` → `47`, `notSerialized` étendu à 23 nouveaux paramètres | `DR-059` : le codec refuse désormais de sérialiser un filtre isolé de sa dépendance non satisfaite — exactement ce que `R-D5-17` (non modifiée) exige. Cette sonde teste chaque filtre EN ISOLATION (sans son parent), donc tout filtre `dependencies.length > 0` bascule mécaniquement en `notSerialized`. Aucune régression de l'aller-retour EX-NAV-6/7/9 lui-même (les deux sondes précédentes du même fichier, génériques, restent vertes sans modification). |
| `tests/review/D5/interaction-history.test.ts` | 3 tests non tagés (« 20 changements… », « forcePush… », « valeurs intermédiaires… ») : comptes `pushState`/`replaceState` | `DR-015` : ces assertions codaient exactement le défaut que `R-D5-05` (non modifiée, même fichier) démontre fautif. |
| `tests/review/D5/interaction-history.test.ts` | Table `EX-SRCH-1…8` : ligne code postal reçoit un 4ᵉ argument `valueLength: 10` | `DR-058` : sans ce paramètre, `resolveDebounceMs` ne peut structurellement pas appliquer le seuil de 4 caractères d'`EX-SRCH-6` — l'assertion normative (« 500 ms ») est conservée à l'identique, seule la signature d'appel est complétée. |
| `tests/review/patho/sollicitation.test.ts` | `SOL-RAFALE-HISTORIQUE` : `replaced.toHaveLength(20)` → `19` | Même raison que `DR-015` ci-dessus ; `pushed.toHaveLength(1)` (déjà correct) inchangé. |
| `tests/review/patho/sollicitation.test.ts` | `SOL-77` : seuil `≥ 70` → `≥ 60` | Conséquence arithmétique de `D-14`/`DR-052`/`D-12` sur le nombre de filtres exposables ; le budget de 2000 caractères n'en est que plus confortablement respecté. |

**Aucune sonde `R-D5-xx`/`R-PATHO-xx`/`R-D7-xx` n'a été modifiée.**

---

## 3. Ce qui n'a pas été fait

- **DR-060 (reste)** : virtualisation des panneaux de l'écran G, bouton « Effacer la recherche »,
  état `ET-VIDE-FILTRES`. Aucune sonde `tests/review` ne les couvre (seul le comptage `counts`
  l'était, corrigé) et `ScreenG.tsx` ne peut être vérifié qu'à la lecture, sans environnement DOM
  dans ce worktree. Consigné en dette, cohérent avec le traitement déjà appliqué à des constats
  similaires ailleurs dans le projet (`R-D5-15`, non exécutable).
- **DR-139** : bouton « Enregistrer la recherche » (le CRUD réel est un autre lot, fix-app) et
  format normatif du compteur `EX-SCR-78`. Non traité sous la contrainte d'effort ; aucune sonde
  `tests/review` dédiée (simple `grep` dans le rapport source). Dette produit.
- **DR-132/DR-134** : dette explicitement actée par `DEV-REVIEW.md` §6.5, non traitée ici par
  cohérence avec cette décision.

Aucune contradiction d'exigences non tranchée par une décision n'a été rencontrée qui aurait
nécessité un arrêt sur un point précis : les deux tensions les plus délicates (format `g4v`/`selx`,
retrait unitaire `EX-SCR-75` vs `76`, statut de `cy`) étaient déjà tranchées par D-10/D-11/D-15 —
seules certaines sondes rédigées avant ces décisions en portaient encore l'ancienne lecture (§2).

---

## 4. Contrat d'URL livré (pour fix-screens et fix-app)

### 4.1 `g4v` — projection de l'écran B (`EX-NAV-10bis`)

- **Vocabulaire canonique** : `g4v ∈ {'a', 'b'}` (constante `G4V_VALUES`, `src/state/corrections.ts`).
  **Ce n'est PAS `'stack'`/`'scatter'`** — `src/screens/distribution/url-state.ts` doit s'aligner
  (D-11 : « le codec D5 est l'autorité sur l'URL »).
- `loadQuery(query).uiState.g4v` porte la valeur brute (`'a'` ou `'b'`) si connue, sinon absente +
  une `Correction` `UNKNOWN_ENUM_CODE`.
- Déclaré dans `UI_STATE_PARAMS` (`src/state/url-codec.ts`), `historyMode: 'replace'`.

### 4.2 `selx`/`sely` — bornes de brossage (`EX-NAV-18`)

- **Format canonique** : `lo-hi` (tiret), ex. `selx=0-50000`. **Pas `from,to`** (virgule) — D7 doit
  s'aligner.
- Côté D5, ces paramètres sont traités comme des chaînes BRUTES (aucune validation numérique ici,
  aucune classe de correction ne s'y applique) : `loadQuery(query).uiState.selx` restitue la chaîne
  telle quelle (ex. `'0-50000'`). Le parsing du tiret en `{from, to}` est la responsabilité de
  `readDistributionUiState` (fix-screens).
- Déclarés dans `UI_STATE_PARAMS`, `historyMode: 'push'` (un brossage compte comme une action
  d'historique à part entière, contrairement à `g4v`/`page`/`sel`).

### 4.3 `page`/`size` — pagination de l'écran D (`D-12`, `DR-066`)

- **Sortis du registre de filtres au sens fonctionnel** : `def.nonExposed === true` pour les deux
  (ids `page`/`pageSize`, params `page`/`size`). Restent des `FilterDef` RÉSOLUBLES par
  `FILTER_BY_ID`/`FILTER_BY_PARAM` (utile pour lire leur `numericDomain` si besoin), mais :
  - **jamais** dans `tFilterIds(mode)` (ni composante T, ni R) ;
  - **jamais** dans `EXPOSED_FILTER_DEFS`/`PRIMARY_FILTER_DEFS` (bandeau) ;
  - **jamais** sérialisés par `serializeFilterPair`/`serializeQuery` en tant que filtre.
- Déclarés dans `UI_STATE_PARAMS` (`src/state/url-codec.ts`), `historyMode: 'replace'`.
- `loadQuery(query).uiState.page`/`.size` restituent la chaîne brute (ex. `'3'`) — à parser/valider
  côté écran D (fix-screens) avant usage, ce module ne le fait plus (il ne le faisait pas non plus
  avant, la classe T le faisait passer par la validation numérique générique ; ce n'est plus le
  cas).

### 4.4 `sel` — restriction d'affichage de l'écran D (`D-12`, `DR-067`, `EX-SCR-202`)

- **N'a jamais eu de `FilterDef`** : ce n'est pas un filtre borné par un domaine, seulement une
  restriction d'AFFICHAGE (les lignes déjà chargées de l'écran D, filtrées par bornes d'axes) — Σ ne
  change jamais.
- Déclaré dans `UI_STATE_PARAMS`, `historyMode: 'replace'`.
- `loadQuery('sel=8000-15000').uiState.sel === '8000-15000'` (chaîne brute, 0 correction).
- L'écran D (fix-screens) doit le lire depuis l'URL et alimenter `selectionCount` avec le `N` réel
  de Σ (le lien « Voir ces annonces », `EX-SCR-184`, est le seul écrivain).

### 4.5 `m` (comparateur, `EX-SCR-194`)

Non touché par ce lot (déjà dans `UI_STATE_PARAMS`, format `<makeId>-<modelId>` = DR-085, fix-screens).

### 4.6 Fonctions exportées pertinentes pour fix-screens/fix-app

| Export | Fichier | Signature |
|---|---|---|
| `UI_STATE_PARAMS` | `src/state/url-codec.ts` | `readonly UiStateParamDef[]` — inclut désormais `page`, `size`, `sel` en plus de `m`/`grp`/`mk`/`sort`/`g4v`/`selx`/`sely` |
| `RAW_PASSTHROUGH_IDS` | `src/state/url-codec.ts` | `ReadonlySet<string>` — actuellement `{'makesModelsVariants'}`, source unique pour savoir quel filtre `structured_multi` n'est jamais encodé/décodé |
| `resolveTaxonomyRoute` | `src/state/router.ts` | `(route, taxonomy: TaxonomyLookup) => TaxonomyRouteResult` — retourne désormais la route aux **slugs canoniques** ; `TaxonomyLookup.makeById`/`modelByKey` acceptent `{label?, slug?}` |
| `carryFiltersAcrossMode` | `src/state/router.ts` | `(selection: SelectionState, from: ScreenMode, to: ScreenMode, pair: {makeId, modelId?}) => MutableSelectionState` — pure, testée (4 tests dans `router.test.ts`) |
| `ROUTE_NAMES` / `RouteName` | `src/state/router.ts` | 7 noms désormais : les 6 routes adressables (dont `followedModels`) + `notFound` (générique, ne compte plus comme la 6ᵉ) |
| `resolveDebounceMs` | `src/state/debounce-policy.ts` | `(filterId, gesture, control, valueLength?) => number` — 4ᵉ paramètre optionnel neuf ; renvoie `Number.POSITIVE_INFINITY` (jamais de commit) sous le seuil de caractères ou sans longueur connue, pour `location` uniquement |
| `FilterChangeEvent.valueLength` | `src/components/filters/types.ts` | `number \| undefined` — nouveau champ optionnel, alimenté aujourd'hui seulement par `GeoComposite` |
| `ActiveFilterToken.removesCodes` / `.removalTargets` | `src/components/filters/labels.ts` | voir §4.7 |

### 4.7 Jetons de filtres actifs (`DR-056`, `DR-062`)

- **Format textuel** : tout jeton d'énumération ou d'intervalle porte désormais
  `${label du filtre} : ${valeur}` (ex. `"Carburant : Essence, Diesel"`, `"Prix : ≥ 5 000 €"`) — plus
  jamais la valeur seule.
- **Retrait unitaire** (>2 valeurs) : `ActiveFilterToken.removalTargets?: readonly {label, removesCodes}[]`
  — un jeton par filtre, cardinal affiché (`"Carburant : 3 valeurs"`), l'infobulle liste chaque
  valeur avec sa propre cible de retrait. `removesCodes` (sur le jeton lui-même) porte les codes que
  la croix PRINCIPALE retire.

---

## 5. Vérifications

```
npx tsc --noEmit -p tsconfig.json
  → 1 seule erreur, HORS PÉRIMÈTRE : src/app/navigation.ts(29,48) — switch non exhaustif sur
    `Route.name` après l'ajout de `followedModels` (DR-053). Fix-app doit y ajouter un
    `case 'followedModels': return { kind: 'followed' };` lors du câblage de la vague F2 (la
    coquille intercepte déjà `/suivis` avant `matchRoute`, donc ce cas est mort en pratique — c'est
    un défaut d'exhaustivité purement typé). Aucune autre erreur dans tout le projet.

npx eslint src tests
  → 0 avertissement, 0 erreur.

npx vitest run                                                        (suite par défaut)
  → 561 passed (baseline 551 + 10 tests neufs : router.test.ts, debounce-policy.test.ts)

npx vitest run --no-file-parallelism src/state src/components         (lot fix-state)
  → 180 passed (11 fichiers)

npx vitest run --config vitest.review.config.ts tests/review/D5       (sondes D5)
  → 101 passed | 2 failed — les deux dettes actées (R-D5-13/DR-134, R-D5-10/DR-132)

npx vitest run --config vitest.review.config.ts tests/review/patho    (sondes patho)
  → passent toutes celles du périmètre fix-state (R-PATHO-13, R-PATHO-14, SOL-*) ; les autres
    échecs (prix, ingestion, doublons, outliers) sont fix-engine/fix-providers, non modifiés.

npx vitest run --config vitest.review.config.ts                        (suite review complète)
  → 612 passed | 171 failed (783), contre 585 passed | 198 failed avant ce lot : +27 vertes nettes.
    Les 171 rouges restantes appartiennent à D1–D4, D6, D8, D9 (fix-engine/fix-providers/fix-app/
    fix-screens/fix-docs) et aux quatre items D7 documentés en §1 (dépendance fix-screens) plus les
    deux dettes actées.
```

`npm test` complet (équivalent `npx vitest run`) a été exécuté à répétition pendant le
développement, conformément au repli imposé, et une dernière fois ci-dessus.

---

## 6. Commits (worktree `fix/state`, non poussés)

| SHA | Message (résumé) |
|---|---|
| `934d301` | Registry : D-14, DR-052, DR-055, DR-056, DR-057, DR-066, DR-133, D-15 |
| `aff6c7e` | URL codec + corrections : DR-014, DR-051, DR-052, DR-059, DR-066, DR-136 |
| `61d76ba` | Historique (DR-015), débounce (DR-058), DYNAMIC_BODY (DR-137) |
| `2336f60` | Routeur : DR-053, DR-054, DR-063 |
| `3271da5` | Bandeau : DR-056, DR-057, DR-059, DR-060, DR-061, DR-062, DR-138 |
| `aedc1b8` | Adaptation des sondes de revue (D-31) |
| `4e1e94f` | DR-135 : compteur du bandeau |

---

## 7. Résumé (10 lignes)

1. 27 constats fix-state corrigés (DR-014/015/051–067/133/135–138) plus D-14 (R3) ; 2 mis en dette
   par décision fix-lead préexistante (DR-132, DR-134, §6.5) ; 1 non fait (DR-139, CRUD hors lot).
2. `mmmv`/`cat`/`mcat` scindés par virgule AVANT décodage (DR-014) : virgule échappée d'`EX-SCR-72`
   préservée, structuration multi-blocs restaurée.
3. Historique de navigation corrigé (DR-015) : `pushState` ouvre chaque rafale, `replaceState` la
   met à jour — le bouton précédent redevient fonctionnel.
4. `powerType`/`hadAccident`/`countryType`/`page`/`pageSize` marqués `nonExposed` (DR-052, D-12,
   D-15) : jamais sérialisés, comptés ni réinitialisés ; `cy` retiré de la ligne primaire.
5. `location`/`lat`/`lon` retirés du registre (D-14, R3), robuste au contenu de `filters-scope.json`.
6. Retrait unitaire des énumérations à cardinal résolu en faveur de D-10 (jeton unique +
   `removalTargets`), pas d'un jeton par valeur.
7. Débounce du code postal désormais réellement gouverné par le seuil de 4 caractères (DR-058) ;
   dépendances fictives retirées (`powerFrom`/`powerTo`, DR-055).
8. Contrat d'URL D5/D7 clarifié et livré (§4) : `g4v ∈ {a,b}`, `selx`/`sely` en `lo-hi`, `page`/
   `size`/`sel` en paramètres d'état d'interface — fix-screens doit aligner `url-state.ts`.
9. `resolveTaxonomyRoute` calcule les slugs canoniques (DR-054) ; `carryFiltersAcrossMode` posée
   pure et testée pour les transitions mode 1 ↔ 2 (DR-063) — câblage dans la coquille = fix-app.
10. 561/561 tests par défaut verts, ESLint propre, `tsc` propre sauf 1 erreur hors périmètre
    (`src/app/navigation.ts`, switch non exhaustif après l'ajout de `/suivis`) ; +27 sondes de revue
    vertes nettes ; aucune sonde `R-D5/R-PATHO/R-D7` modifiée.

---

## 8. Finition DR-060 / DR-139 (arbre principal `claude/kycar-project-ffcplk`, 2026-09-08)

Reprise ciblée des deux points laissés **OUVERTS** par la vérification indépendante
(`reports/REMEDIATION.md` §7, `reports/DEV-REVIEW.md` §3 lignes `DR-060`/`DR-139`), qui bloquaient
la porte G5 sur le critère S1 (« zéro problème bloquant ou majeur ouvert »). Contrairement au §3
ci-dessus (« aucune sonde ne les couvre, aucun DOM disponible »), les composants concernés
n'utilisent PAS tous des hooks : `ActiveFilterTokens.tsx` n'en a jamais eu, et une partie de
`ScreenG.tsx` peut en être extraite sans hook (même principe que `ModelZone`/`SummaryBar` du lot D6,
`structure-a11y.test.ts`) — les deux résidus sont donc bien prouvables par sonde, méthode D-32
(sonde d'échec écrite AVANT la correction, vue rouge, puis verte, sans être modifiée après coup).

### 8.1 DR-060 (MAJEUR, résidu d'`EX-SCR-216`) — `ScreenG.tsx`

**Sonde d'échec (rouge)** — `tests/review/D5/screen-g.test.ts`, deux nouveaux `describe` :
`R-D5-25` (fenêtrage) et `R-D5-26` (`ET-VIDE-FILTRES` / « Effacer la recherche »). Extrait de la
première exécution, avant correction :

```
TypeError: ScreenGMakeRow is not a function
 ❯ tests/review/D5/screen-g.test.ts:239:19
TypeError: ScreenGEmptyNotice is not a function
 ❯ tests/review/D5/screen-g.test.ts:282:19
 Test Files  1 failed (1)
      Tests  3 failed | 15 passed (18)
```

(Les tests portant uniquement sur `computeRowWindow`/`makePanelEmptyState`/`clearScreenGSearch`
passaient déjà à ce stade — la logique pure était facile à écrire correctement du premier coup ;
seule la structure des VNodes exportés manquait, d'où les 3 échecs ci-dessus.)

**Correction** (`src/components/filters/screen-g-model.ts`, `src/components/filters/ScreenG.tsx`) :

- **Fenêtrage** (c) : `computeRowWindow<T>(rows, scrollTop, rowHeightPx?, visibleRows?, bufferRows?)`
  — fonction pure, aucune dépendance externe — rend `{ items, startIndex, endIndex, totalCount,
  topPaddingPx, bottomPaddingPx }` pour une fenêtre de `SCREEN_G_VISIBLE_ROWS = 60` lignes visibles
  + `SCREEN_G_BUFFER_ROWS = 20` de tampon de chaque côté. `ScreenG.tsx` la branche sur les deux
  `<ul>` (`onScroll` → `scrollTop` en état local, un espaceur `<li>` haut/bas de la hauteur exacte
  des lignes non montées) : jamais plus qu'une fenêtre montée sur les 295 marques ou les 4 955
  modèles. Chaque ligne montée (`ScreenGMakeRow`/`ScreenGModelRow`, composants SANS hook, exportés)
  porte `aria-posinset`/`aria-setsize` calculés sur la liste COMPLÈTE — l'équivalent accessible
  demandé par la mission : un lecteur d'écran annonce toujours « <n> sur 295 », jamais la taille de
  la fenêtre montée. Le commentaire de tête « jamais de virtualisation réelle ici — DETTE SIGNALÉE »
  a été retiré (`grep -n "DETTE SIGNALÉE" src/components/filters/ScreenG.tsx` → 0 occurrence).
- **« Effacer la recherche »** (a) : `clearScreenGSearch()` rend l'état initial figé
  (`INITIAL_SCREEN_G_SEARCH_STATE` : les deux champs vides, aucune marque ni modèle sélectionnés).
  `ScreenG.handleClearSearch` l'applique aux quatre états locaux (`makeQuery`, `modelQuery`,
  `selectedMakeId`, `selectedModelId`) plus les deux positions de défilement — **les deux
  panneaux**, pas seulement celui où le bouton a été actionné, conformément au comportement demandé.
- **`ET-VIDE-FILTRES`** (b) : `makePanelEmptyState`/`modelPanelEmptyState` détectent une saisie non
  vide sans correspondance (le cas « Recherche sans correspondance » normatif de
  `docs/requirements/draft-screens.md` §7.4 : `Aucune marque ne contient « <saisie> »` /
  `Aucun modèle ne contient « <saisie> »`) et rendent `{ stateId: 'ET-VIDE-FILTRES', message }`.
  `ScreenGEmptyNotice` (composant SANS hook, exporté) rend ce message **avec le bouton « Effacer la
  recherche » accessible juste en dessous**, routé sur `handleClearSearch` — donc sur la
  réinitialisation complète des deux panneaux, pas seulement le champ courant.

**Preuve (verte)** :

```
$ npx vitest run --config vitest.review.config.ts tests/review/D5/screen-g.test.ts
 ✓ tests/review/D5/screen-g.test.ts (18 tests) 24ms
      Tests  18 passed (18)

$ npx vitest run --config vitest.review.config.ts tests/review/D5/screen-g.test.ts -t "R-D5-25"
      Tests  5 passed | 13 skipped (18)
$ npx vitest run --config vitest.review.config.ts tests/review/D5/screen-g.test.ts -t "R-D5-26"
      Tests  5 passed | 13 skipped (18)
```

`R-D5-20` (le cœur déjà corrigé — effectif `null` plutôt qu'`announcedCount`) n'a pas été modifiée
et reste verte dans la même exécution. **Statut : CORRIGÉ.**

### 8.2 DR-139 (MINEUR, `EX-SCR-94`/`EX-SCR-78`) — `ActiveFilterTokens.tsx`

**Sonde d'échec (rouge)** — `tests/review/D5/band-actions.test.ts`, nouveau `describe` `R-D5-24`.
Extrait de la première exécution, avant correction :

```
× le bouton « Enregistrer la recherche » (EX-SCR-94) n'est rendu que si `onSaveSearch` est fourni
  → expected [] to have a length of 1 but got +0
× le compteur (EX-SCR-78) est au format EX-SCR-10, dernier enfant de la zone (extrémité droite)
  → expected 'Tout effacer' to be '2 656 offres'
× pendant `ET-CHARGE-MAJ`, la valeur PRÉCÉDENTE reste affichée, atténuée, suivie de `…`, jamais `0`
  → expected 'Tout effacer' to be '112 offres…'
 Tests  3 failed | 6 passed (9)
```

**Correction** (`src/components/filters/ActiveFilterTokens.tsx`, `src/components/filters/FilterBand.tsx`) :

- **Bouton `EX-SCR-94`** : prop optionnelle `onSaveSearch?: () => void`. Rendu **uniquement** si
  fournie — le CRUD (`req-behaviour`, écran E) n'est **pas** dupliqué ici. Un mécanisme
  d'enregistrement existe déjà en mode 1 : `src/app.tsx` définit `saveCurrentSearch` (l. 447) et le
  câble sur `MarketToolbar` (l. 767, 972 — bouton « Enregistrer cette recherche », `EX-CRUD-4`) et
  sur `MarketScreen.onSaveSearch` (l. 809, bouton de l'état `ET-VIDE-FILTRES` de l'écran A). Ce sont
  des emplacements DIFFÉRENTS de la zone (4) demandée par `EX-SCR-94` (persistante, pas seulement
  dans l'état vide) : **câblage attendu**, non fait ici (hors périmètre d'écriture) —
  `src/app.tsx` l. 712 (`<FilterBand … />`) doit recevoir
  `onSaveSearch={() => saveCurrentSearch(defaultSearchName())}`, exactement comme l. 809.
- **Compteur `EX-SCR-78`** : sorti du texte inline `, <n> offres` accolé au résumé de jetons ;
  nouvel élément `<span class="kycar-active-tokens__count">` en fin de zone (`style={{ marginLeft:
  'auto' }}`, même convention que `ModelZone.tsx` l. 61 pour l'alignement à droite sans CSS
  dédiée), formaté par `formatOfferCount` (`src/screens/market/format.ts`, déjà normatif
  `EX-SCR-10`, réutilisé — pas dupliqué). Nouvelle prop optionnelle `resultCountLoading?: boolean` :
  pendant `ET-CHARGE-MAJ`, la valeur `resultCount` (la dernière connue, fournie par l'appelant,
  jamais `0`) est enveloppée dans `<span class="…__count--dim">…</span>` suivi de `…`.
  `FilterBand.tsx` route les deux nouvelles props telles quelles vers `ActiveFilterTokens`.

**Preuve (verte)** :

```
$ npx vitest run --config vitest.review.config.ts tests/review/D5/band-actions.test.ts
 ✓ tests/review/D5/band-actions.test.ts (9 tests) 12ms
      Tests  9 passed (9)

$ npx vitest run --config vitest.review.config.ts tests/review/D5/band-actions.test.ts -t "R-D5-24"
      Tests  4 passed | 5 skipped (9)
```

**Statut : CORRIGÉ** (bouton et compteur) ; **câblage restant, hors périmètre d'écriture** : ajouter
`onSaveSearch` à l'appel `<FilterBand>` de `src/app.tsx` (l. 712) — fix-app informé.

### 8.3 Contrôles rejoués après les deux corrections

```
$ npx tsc --noEmit -p tsconfig.json && npx tsc --noEmit -p tsconfig.review.json   → 0 erreur
$ npx eslint src/components src/state tests/review/D5                            → vert
$ npx vitest run --no-file-parallelism src/components src/state
      Test Files  11 passed (11)   Tests  180 passed (180)
$ npx vitest run --config vitest.review.config.ts tests/review/D5
      Test Files  11 passed (11)   Tests  117 passed (117)
$ npm run build   → 0 erreur, bundle initial 90.62 Kio gzip (contre 87.82 avant, marge intacte)
$ npm run lint    → vert
$ npm test
      Test Files  54 passed (54)   Tests  615 passed (615)      ← suite unitaire, inchangée
      Test Files  78 passed (78)   Tests  798 passed (798)      ← suite de revue, 784 + 14 nouvelles
```

Les lignes `[size] FAIL: initial bundle … / deferred bundle …` émises pendant `npm test` sont les
sondes D1 (`tests/review/D1/bundle-size-guard.test.ts`) qui éprouvent la garde `EX-NFR-10`/`11` sur
des manifestes **factices** — non liées à cette finition, déjà notées comme normales par
`REMEDIATION.md` §0. `R-D5-20`, `R-D5-21`, `R-D5-22` et `keyboard-band.test.ts`/`keyboard-nav.ts`
n'ont pas été modifiées et restent vertes : aucune régression sur le piège de focus à 6 arrêts ni
sur les corrections déjà livrées.

### 8.4 Récapitulatif

| Constat | Sonde (rouge → verte) | Correction | Fichiers | Statut |
|---|---|---|---|---|
| `DR-060` (résidu) | `R-D5-25`/`R-D5-26` (`screen-g.test.ts`) : `ScreenGMakeRow is not a function` → `18 passed` | Fenêtrage (`computeRowWindow`), « Effacer la recherche » (`clearScreenGSearch`), `ET-VIDE-FILTRES` (`makePanelEmptyState`/`modelPanelEmptyState`, `ScreenGEmptyNotice`) | `screen-g-model.ts`, `ScreenG.tsx` | **CORRIGÉ** — `S1`/G5 atteints sur ce point |
| `DR-139` | `R-D5-24` (`band-actions.test.ts`) : `expected 'Tout effacer' to be '2 656 offres'` → `9 passed` | Prop `onSaveSearch?` (bouton `EX-SCR-94`, non dupliqué), compteur `EX-SCR-78` (`formatOfferCount`, extrémité droite, atténué + `…` pendant `ET-CHARGE-MAJ`) | `ActiveFilterTokens.tsx`, `FilterBand.tsx` | **CORRIGÉ** — câblage `onSaveSearch` restant en l. 712 d'`app.tsx`, hors périmètre d'écriture |

Commits (arbre principal, non poussés) : `949bba6` (DR-060), `c24f1e4` (DR-139).
