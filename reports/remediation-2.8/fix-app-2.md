# fix-app-2 — vague F3 de la phase 2.8

**Agent `fix-app-2` (Opus, effort high), 2026-09-08.** Arbre PRINCIPAL `/home/user/KYCAR`, branche
`claude/kycar-project-ffcplk`, base `2feb52f` (fusions `fix-engine-2` → `fix-state-2` →
`fix-screens-2` faites). Périmètre d'écriture tenu : `src/app.tsx`, `src/app/`,
`tests/review/D8/`, `tests/e2e/`, ce rapport, et `reports/e2e/results.json` (régénéré par la recette
finale, commité avec ce rapport — `D8-33`). **Aucune** écriture dans `src/screens/`, `src/state/`,
`src/components/`, `src/engine/`, `src/providers/`, `docs/` (`git show --stat` des quatre commits le
confirme). `src/main.tsx`, `src/orchestration/` et `src/persistence/` étaient dans mon périmètre : je
n'ai eu à en toucher aucun.

**Mandat** : `FIX-LEAD-DECISIONS-2.8.md` **D8-31** (« câblage coquille et sondes D8 » pour
`EX-SCR-101` et `EX-SRCH-14` ; câblage des props d'`EX-SCR-174` et `EX-SCR-212`), **D8-28**
(`fix-state-2` reste joignable pour `src/components/filters/`), **D8-33**, plus les deux listes de
câblage qui me sont adressées : `fix-state-2.md` §5 et `fix-screens-2.md` §8.

**Règle de preuve appliquée** (`D-31`/`D-32`) : sondes écrites et **commitées rouges d'abord**
(`0f73c6e`), câblage ensuite (`9ac896f`), les sondes passant sans être modifiées entre les deux ;
les tests E2E neufs ont été **rejoués contre le build d'avant câblage** avant d'être déclarés preuves
(trace au §5.3). Contraintes : **E1** aucun compte créé ; **E3** aucune question posée, toutes les
tensions tranchées ici ; **E4** hypothèses écrites comme telles (§8) ; **E5** aucun appel réseau hors
`localhost:4180` ; **R3** aucun champ vendeur identifiant introduit (le câblage n'ajoute aucune
donnée d'annonce à l'écran).

| Commit | Contenu |
|---|---|
| `0f73c6e` | `tests/review/D8/shell-wiring-f3.test.ts` — **19 cas, 8 rouges** (câblage) et 11 rouges par absence du module de calcul |
| `9ac896f` | `src/app.tsx` (10 props) + `src/app/restrictive-filters.ts` (module pur neuf) |
| `41c8c05` | `tests/e2e/` — 6 tests neufs, 4 désignations adaptées à `EX-SCR-212` |
| `b199fb1` | `tests/e2e/parcours-p2.spec.ts` — le test `EX-SRCH-14` rendu sensible au régime (`EX-SCR-97`) ; il reste **rouge sur `mobile`**, sur un défaut hors périmètre décrit au §7.2 |
| *(ce rapport)* | `reports/remediation-2.8/fix-app-2.md` + `reports/e2e/results.json` régénéré |

---

## 1. Les dix props, une par une

Point de montage unique de `FilterBand` (commun aux surfaces A/B/C/D), montage de
`SavedSearchesScreen` (`case 'savedSearches'`) et de `DistributionScreen` (mode 2, `which === 'distribution'`).

### 1.1 `FilterBand` — liste de `fix-state-2` §5

| Prop | Source de donnée | `src/app.tsx` | Exigence | Sonde |
|---|---|---|---|---|
| `snapshotDate={descriptor?.capturedAt}` | `controller.snapshotDescriptor` (l. 1063, déjà en portée) | l. **1233** | `EX-SCR-101` | `R-D8-2.8-01` cas 1 |
| `routePair={…}` — `{ makeId: view.makeId, modelId: view.modelId }` sur `modelDistribution`/`modelListings`, sinon `undefined` | la **route** (`view`), seule porteuse de la marque en mode 2 | l. **1238–1244** | `EX-SRCH-14` | `R-D8-2.8-01` cas 2 |
| `onSelectModel={(pair) => goToModel(pair.makeId, pair.modelId)}` | `goToModel` (l. 738) | l. **1246** | `EX-NAV-15` | `R-D8-2.8-01` cas 3 |

Le `?? null` est **volontairement absent** de `snapshotDate` : `FilterBandProps.snapshotDate` est
`string | Date | undefined` et n'admet pas `null` (fix-state-2 §5.1) — la sonde l'interdit
explicitement pour qu'un copier-coller depuis `AppHeader`/`AppFooter` (qui, eux, prennent `null`) ne
casse pas le type en silence. `snapshotTaxonomy` n'est **pas** câblé, conformément à fix-state-2
§5.1 : `ActiveFilterTokens` retombe sur `snapshotTaxonomy ?? referenceData` (l. 93 du composant), et
`referenceData` EST la taxonomie du snapshot servi tant qu'un provider réel n'en sert pas une autre.

**Aucun gestionnaire neuf n'était à écrire pour `EX-SRCH-14`** (fix-state-2 §5.4) : le geste vit dans
`FilterBand#handleScreenGApply`, qui exécute la cible calculée par `resolveMakeChange` et pousse par
le callback **existant** `onHistoryPush`. Les deux props ci-dessus suffisent, ce que la recette
navigateur atteste (§5.2, `EX-SRCH-14`).

### 1.2 `DistributionScreen` (écran B) — liste de `fix-screens-2` §8.1

| Prop | Source de donnée | `src/app.tsx` | Sonde |
|---|---|---|---|
| `activeFilterCount={countActiveFilters(selection)}` | `src/components/filters/band-model.ts`, **lu, jamais modifié** — donc rigoureusement la valeur du bandeau | l. **1660** | `R-D8-2.8-02` cas 1 |
| `topRestrictiveFilters={emptySelectionHints}` | `src/app/restrictive-filters.ts` (§2), mémo l. **1108–1113** | l. **1661** | `R-D8-2.8-02` cas 2 + `R-D8-2.8-04/05/07` |
| `onRemoveFilter={(filterId) => applyFilters(removalPatchFor(filterId))}` | même `applyFilters` que le retrait d'histogramme (`EX-SCR-149`) | l. **1662** | `R-D8-2.8-02` cas 3 + `R-D8-2.8-06` |
| `onResetAllFilters={…}` | `setUrlCorrections([])` + `navigate(location.pathname, 'push')` | l. **1663–1668** | `R-D8-2.8-02` cas 4 |
| `onSaveSearch={() => saveCurrentSearch(defaultSearchName())}` | même chemin CRUD que l'écran A (l. 1374) | l. **1669** | `R-D8-2.8-02` cas 4 |

**Arbitrage sur `onResetAllFilters` (mode 2).** Sur l'écran A, « Réinitialiser tous les filtres »
navigue vers `/marche` : la sélection EST toute l'URL. En mode 2 la même action ne peut pas quitter
le modèle — la route `/marche/:make/:model` **est** le périmètre (`EX-NAV-2`), pas un filtre posé, et
`carryFiltersAcrossMode` l'absorbe précisément pour cette raison. La coquille vide donc la
**requête** et conserve le **chemin**. Prouvé en navigateur (§5.2, second test `EX-SCR-26`).

**Non câblé, et c'est correct** : `priceBuckets` (`EX-SCR-153`) est passé par l'écran lui-même depuis
`recalc.priceHistogram`, et la bascule `g7log` (`EX-SCR-17`) emprunte le chemin générique
`applyUiState` → `writeDistributionUiState` → `historyModeFor` déjà en place (fix-screens-2 §8.1 et
fix-state-2 §6 concordent ; la recette le vérifie, §5.2).

### 1.3 `SavedSearchesScreen` (écran E) — liste de `fix-screens-2` §8.2

| Prop | Source de donnée | `src/app.tsx` | Sonde |
|---|---|---|---|
| `currentSnapshotId={descriptor?.snapshotId}` | `SnapshotDescriptor`, déjà lu par le panneau Diagnostic | l. **1435** | `R-D8-2.8-03` |
| `taxonomy={referenceData}` | `referenceData` de la coquille, déjà passé à `FilterBand`/`ScreenG` | l. **1438** | `R-D8-2.8-03` |

`currentCountById` était déjà câblé ; il ne change pas.

---

## 2. `src/app/restrictive-filters.ts` — le seul code neuf

`EX-SCR-26` affiche **un chiffre** (« retirer « … » : `<k>` offres de plus ») : c'est une valeur lue
par l'utilisateur, donc jamais une estimation. Le module la mesure exactement.

**Constat de départ, établi par exécution.** `data-controller.ts` l. 549 publie
`topRestrictiveFilters: []` avec le commentaire « calcul complet non câblé — dette signalée » : le
calcul « leave-one-out » n'existait **nulle part**. Aucun `src/state` ne le portait
(`grep -rn "restrictive" src/` → 6 occurrences, toutes des types ou des consommations, aucune
implémentation). Ma mission prévoyait ce cas (« sinon consigne l'hypothèse de calcul retenue »).

**Décision : le calculer dans la coquille, en mode 2 seulement, sur le lot déjà chargé.**
`DataController.enterMode2` dérive déjà `rows` en compilant `buildRefinePredicates` sur `batch`
(l. 428–441). Le module rejoue **exactement** cette mécanique — `partitionSelection` →
`buildRefinePredicates` → `compilePredicates` — sélection privée d'un filtre. Aucune règle de
filtrage n'est réécrite : une divergence entre le gain annoncé et l'effectif obtenu en suivant la
suggestion serait structurellement impossible.

- `countMatchingRows(batch, selection, ref)` — effectif d'une sélection sur le lot.
- `topRestrictiveFilters({ selection, batch, referenceData, baselineCount, limit })` — un **jeton du
  bandeau** = une suggestion (un intervalle est un seul filtre pour l'utilisateur, deux identifiants
  pour le code) ; libellé = `token.text` de `buildActiveFilterTokens`, donc jamais un nom de
  paramètre ; tri par gain décroissant, chiffrées d'abord, plafond 3.
- `removalPatchFor(filterId)` — retrait apparié (`pairedWith` du registre), même convention de patch
  que `histogram-model.ts::clearMetricFilters`.

**Trois règles de refus d'inventer**, chacune sondée :

1. un filtre de **classe `T`** n'est pas appliqué localement (absorbé par la route ou servi par la
   source) : son retrait rechargerait le jeu, le gain n'est pas calculable ici → `gain: null`, bouton
   **sans chiffre** (`EX-SCR-26`) ;
2. un retrait qui ne rend **aucune** offre de plus n'est pas suggéré — « 0 offres de plus » serait un
   conseil faux ;
3. le calcul n'a lieu que si `payload.rows.length === 0`, c'est-à-dire dans le seul état qui rend le
   bloc : hors de ce cas, **zéro balayage supplémentaire** (mémo l. 1108–1113).

**Coût.** Le lot est élagué au couple marque/modèle par `O17` : 288 lignes pour Opel Corsa à 20 000
annonces, 1 352 à 100 000. Un balayage par filtre actif, au plus une poignée, uniquement sur un écran
déjà vide. Aucun aller provider, aucun réseau (E5). Effet mesuré sur le bundle : **+0,69 Kio gzip**
(chunk principal 104,54 → 105,23 Kio, même build joué dans les deux états).

**Portée assumée : mode 2 seulement.** L'écran A garderait la dette (`ScreenALoadedData.topRestrictiveFilters = []`) :
le même calcul y exigerait un balayage des 100 000 annonces, ce qu'`O17` interdit exactement comme
pour les facettes de mode 1 (`D8-29`). Ce n'est pas une régression — c'est l'état d'avant, inchangé,
et `D8-31` ne m'attribue que l'écran B (`EX-SCR-174`). Écrit en tête du module.

---

## 3. Sondes D8 — `tests/review/D8/shell-wiring-f3.test.ts` (19 cas)

Fichier **neuf** ; aucune sonde préexistante d'aucun lot n'a été modifiée.

| Identifiant | Objet | Rouge | Verte |
|---|---|---|---|
| `R-D8-2.8-01` (3 cas) | `FilterBand` : `snapshotDate` **sans** `?? null`, `routePair` borné au mode 2, `onSelectModel` → `goToModel` | oui | oui |
| `R-D8-2.8-02` (4 cas) | `DistributionScreen` : les cinq props, `countActiveFilters` importé de `band-model`, `removalPatchFor` dans `onRemoveFilter` | oui | oui |
| `R-D8-2.8-03` (1 cas) | `SavedSearchesScreen` : `currentSnapshotId`, `taxonomy` | oui | oui |
| `R-D8-2.8-04` (2 cas) | `countMatchingRows` : sélection vide = tout le lot ; `priceTo` comparé à une **vérité terrain** lue directement sur la colonne (une sentinelle négative n'est jamais « ≤ 3 000 € ») ; sélection impossible = 0 | oui (module absent) | oui |
| `R-D8-2.8-05` (4 cas) | le gain annoncé **est** le gain remesuré filtre par filtre ; tri décroissant, chiffrées avant les `null`, plafond 3 ; libellé = jeton du bandeau ; classe `T` → `gain: null` | oui (module absent) | oui |
| `R-D8-2.8-06` (3 cas) | `removalPatchFor` : borne appariée emportée, filtre seul, identifiant inconnu — en `toStrictEqual` (seul lui distingue une clé présente à `undefined` d'une clé absente) | oui (module absent) | oui |
| `R-D8-2.8-07` (2 cas) | aucune suggestion inventée : sélection vide → `[]` ; un retrait sans gain n'est pas proposé | oui (module absent) | oui |

Les 8 cas de câblage tournent sur un vrai lot du provider synthétique (`SyntheticDataProvider`,
20 000 annonces, `fetchListingColumns('make=54;model=1918')`), les prédicats réels du moteur, et le
référentiel réel lu sur disque : ce ne sont pas des doublures.

**Traces d'exécution.**

```
# 1. commit des sondes seules (0f73c6e) — le module n'existe pas, le fichier ne se charge même pas
Error: Cannot find module '../../../src/app/restrictive-filters'
  Test Files  1 failed (1)      Tests  no tests

# 2. module posé, app.tsx encore à 0f73c6e (contrôle refait avec le fichier de sonde FINAL,
#    src/app.tsx restauré par `git checkout --` puis recopié)
   × R-D8-2.8-01 (3 cas)  × R-D8-2.8-02 (4 cas)  × R-D8-2.8-03 (1 cas)
  Tests  8 failed | 11 passed (19)

# 3. après le câblage (9ac896f)
  Tests  19 passed (19)
```

### 3.1 Deux retouches à mon propre fichier de sonde, avant qu'il ne prouve quoi que ce soit

Ce ne sont pas des amendements au sens de `D-31` (la sonde n'avait encore rien attesté), mais elles
sont consignées :

1. **`mountOf`** découpait le montage jusqu'à `\n        />` (huit espaces figés). L'indentation
   n'est pas la même d'un montage à l'autre — `FilterBand` est imbriqué dans `.filter-bar` —, si bien
   que la tranche débordait sur `AppFooter` et y trouvait le `snapshotDate={descriptor?.capturedAt ?? null}`
   qu'elle interdisait. Borne remplacée par « la première ligne réduite à `/>` ». **Aucune assertion
   n'a bougé** : la version corrigée est celle des trois traces ci-dessus, et elle est bien rouge sur
   `app.tsx` d'avant câblage.
2. **`removalPatchFor`** était asserté en `toEqual`, qui ignore les clés à `undefined` — donc aurait
   passé sur `{}`. Remplacé par `toStrictEqual`, strictement plus exigeant.

---

## 4. Sondes et tests EXISTANTS modifiés (`D-31`)

| Fichier | Modification | Justification |
|---|---|---|
| `tests/e2e/persistance.spec.ts` | Quatre désignations d'une recherche enregistrée passent de `getByRole('button', { name: '<nom>' })` à une aide `savedRow(page, '<nom>')`, et `EX-CRUD-6` ouvre par le bouton `Ouvrir` de la carte | **`EX-SCR-212` a déplacé le contrôle, pas le fait mesuré.** L'exigence impose « trois boutons par carte : `Ouvrir`, `Renommer`, `Supprimer` » et fait du nom un **texte** (fix-screens-2 §6) : un nom cliquable ne dit pas ce qu'il fait. Les tests désignaient l'entrée par un rôle qui n'existe plus. Les assertions (l'entrée est visible ; l'ouverture restitue l'URL et met à jour `dernier_accès_le` sans toucher aux valeurs figées d'`ARB-45`) sont **inchangées**. Adaptation explicitement demandée par fix-screens-2 §8.3, étendue aux trois autres points d'appel qu'elle n'avait pas relevés (`EX-CRUD-1`, `EX-CRUD-19`, « survivent à un rechargement ») |

Aucun autre test E2E, aucune sonde de revue, aucun `it.fails`, aucun `test.fail`, aucun `skip` n'a
été ajouté, retiré ni modifié.

---

## 5. Recette navigateur

### 5.1 Tests adaptés

Le tableau du §4 les couvre : quatre désignations dans `persistance.spec.ts`, aucune autre. Les
autres corrections de la vague F3 (`EX-SCR-17`, `EX-SCR-153`, `EX-SCR-174`, `EX-DATA-23`,
`EX-SCR-101`) n'ont invalidé aucun test existant — vérifié par la recette complète (§6).

### 5.2 Tests ajoutés (6)

| Test | Fichier | Ce qu'il exerce |
|---|---|---|
| `EX-SCR-174 / EX-SCR-26 — sélection vide` | `parcours-p2.spec.ts` | En-tête `aucune offre` et `médiane —` (aucun chiffre hérité du périmètre précédent) ; **zéro `figure`** dans `#kycar-main` (les graphes sortent du DOM) ; phrase `2 filtres actifs restreignent la recherche.` ; la suggestion annonce `1 352 offres de plus` et, **une fois suivie**, l'écran affiche exactement 1 352 offres ; le retrait emporte les **deux** bornes de l'intervalle et rien d'autre (`?fregfrom=1950&fregto=1960` → requête vide, chemin inchangé) |
| `EX-SCR-26 — Réinitialiser tous les filtres` | `parcours-p2.spec.ts` | La requête est vidée, la route mode 2 **survit** (`EX-NAV-2`), l'effectif revient à 1 352 |
| `EX-SCR-17 — bascule log de G7` | `parcours-p2.spec.ts` | Bouton `Échelle log de l’axe des prix` sur `G7` **et sur lui seul** (G4 n'en a aucun) ; `aria-pressed` faux → vrai ; `svg[data-price-scale]` `linear` → `log` ; l'ordonnée de la première cellule **change réellement** (322 → 97,06 : un drapeau décoratif ne passerait pas) ; URL `?g7log=1` ; rouverte, l'URL rend le même état |
| `EX-SRCH-14 — changement de marque en mode 2` | `parcours-p2.spec.ts` | Depuis `/marche/54-opel/1918-corsa?priceto=20000`, ouverture du contrôle `Marque / Modèle`, recherche `Volkswagen`, `Appliquer` → **`/marche?mmmv=74&priceto=20000`** : plus aucun segment de modèle dans le chemin, les autres filtres conservés |
| `EX-SCR-101 — marque absente du snapshot` | `partage-url.spec.ts` | `/marche?mmmv=999999&priceto=20000` : l'URL n'est **pas** réécrite (un identifiant taxonomique inconnu n'est pas une correction `EX-NAV-21`), le jeton est conservé et retirable, `data-ineffective="true"`, infobulle `Cette marque est absente du snapshot du 01/09/2026`, `aria-describedby` présent (la couleur n'est jamais le seul signal, `EX-SCR-99`), et la zone (4) porte `2 filtres actifs` **et** `1 filtre sans effet` |
| `EX-SCR-212 / EX-SCR-213 — carte de l'écran E` | `persistance.spec.ts` | Exactement `['Ouvrir', 'Renommer', 'Supprimer']` ; périmètre `Toutes marques` ; description générée `Prix : ≤ 20 000 €` (libellés du bandeau) ; `offres à la création` et `offres actuellement` ; **aucun** écart affiché tant que le snapshot n'a pas changé (jamais un `+ 0`) ; `Ouvrir` restitue `?priceto=20000` |

### 5.3 Preuve rouge → verte des tests neufs

Contrôle exécuté contre le **build de production reconstruit sur `src/app.tsx` d'avant câblage**
(`git show 0f73c6e:src/app.tsx`), les tests étant ceux du commit `41c8c05`, non modifiés :

```
# build d'avant câblage
✘ EX-SCR-174 / EX-SCR-26 — sélection vide            (la phrase et les suggestions sont absentes)
✘ EX-SCR-26 — Réinitialiser tous les filtres          (le bloc ET-VIDE-FILTRES ne se lève jamais)
✘ EX-SRCH-14 — changement de marque en mode 2         (l'écran A n'est jamais atteint)
✘ EX-SCR-101 — marque absente du snapshot             (aucun jeton `data-ineffective`)
✓ EX-SCR-17 — bascule log de G7                       (livrée par fix-screens-2, sans câblage)
✓ EX-SCR-212 / EX-SCR-213 — carte de l'écran E        (voir ci-dessous)
✓ EX-CRUD-6 — adaptation `Ouvrir`
  4 failed | 3 passed

# build câblé (HEAD)
  7 passed
```

**Deux constats de conformité, dits comme tels.** `EX-SCR-17` et `EX-SCR-212` sont **verts d'emblée** :
fix-screens-2 les a livrés sans dépendance à la coquille, et les props `currentSnapshotId`/`taxonomy`
que je câble sont **optionnelles** (sans elles, la carte se replie sur les slugs de l'URL et n'affiche
aucun écart). Mes tests les attestent au sens du protocole de revue §2 — ils ne prouvent pas mon
câblage, ils prouvent l'exigence, et ils tomberont si quelqu'un défait l'un ou l'autre. La preuve du
câblage `currentSnapshotId`/`taxonomy`, elle, est portée par `R-D8-2.8-03`.

### 5.4 Aucun `test.fail()` ajouté, un test laissé rouge

Conformément à ma mission. Les seuls `test.fail()` de la suite restent les **3** de `D8-15`
(`responsive.spec.ts::DETTE D8-15`, `EX-SCR-95`, un par projet) — dette produit ratifiée par le
fix-lead. Je n'en ai ajouté aucun, ni retiré aucun.

**Un test reste rouge, délibérément** : `EX-SRCH-14` au projet **`mobile`**. Il révèle un défaut
hors de mon périmètre (§7.2), et ma mission est explicite : « si tu découvres un défaut hors de ton
périmètre que tu ne peux pas corriger, ne pose **PAS** de `test.fail()` : consigne-le dans le rapport
pour le coordinateur, avec le test qui le révèle **laissé rouge** dans ta recette finale et son
décompte ». Sur `desktop` et `tablet`, le même test est **vert**.

---

## 6. Portes exécutées sur l'arbre principal

Séquentiellement, seul sur l'arbre.

| Commande | Résultat |
|---|---|
| `npx tsc --noEmit -p tsconfig.json` | **0 erreur** |
| `npx tsc --noEmit -p tsconfig.worker.json` | **0 erreur** |
| `npx tsc --noEmit -p tsconfig.review.json` | **0 erreur** |
| `npm run lint` | **vert**, aucune sortie |
| `npm run build` | **vert**, 0 erreur / 0 warning — 149 modules |
| `npm run size` | **116,22 / 300 Kio** gzip — OK (marge 183,8 Kio) |
| `npm run test:unit` | **675 passés / 675**, 58 fichiers |
| `npm run test:review` | **1 063 passés / 1 063**, 98 fichiers — **0 échec** |
| `npm run test:e2e` | voir §6.2 |

`npm test` (unitaire **puis** revue) : **675 + 1 063**, exit 0. Les 4 lignes `[size] FAIL` de la
sortie de revue sont les sondes `D1` sur manifestes factices, attendues.

**Dettes en `it.fails` : 2**, et non 8 — les vagues F1 et F3 en ont levé six (le compte de
`CLAUDE.md` §5 date de la fin de 2.6). Restent `R-D9-21` (`tests/review/D9/capabilities-mode1.test.ts`,
provider réel non câblé) et `R-D2-16` (`tests/review/D2/reference-loader.test.ts`, `EX-DATA-54`).
Aucune n'appartient à mon lot ; je n'en ai ajouté ni retiré aucune.

### 6.1 Budgets

- **Bundle initial** : 116,22 Kio gzip pour un plafond de 300 (`npm run size`, `EX-NFR-10`). Le
  câblage de F3 ajoute **+0,69 Kio** au chunk principal (104,54 → 105,23 Kio gzip), mesuré en
  reconstruisant le même arbre avec `src/app.tsx` d'avant et d'après.
- **`EX-NFR-9`** (premier affichage utile, 4G simulée, budget 2 000 ms) : §6.2.

### 6.2 Recette navigateur — `npm run test:e2e`, trois projets

```
255 tests · 245 attendus · 9 sautés · 1 ÉCHEC INATTENDU · 11 min 24 s · exit 1
(reports/e2e/results.json : expected 245, skipped 9, unexpected 1, flaky 0)
```

| Projet | Tests | Détail |
|---|---|---|
| `desktop` 1280 | 85 | 84 verts + 1 échec attendu (`DETTE D8-15`) |
| `tablet` 768 | 85 | 84 verts + 1 échec attendu (`DETTE D8-15`) |
| `mobile` 360 | 85 | 74 verts + 1 échec attendu (`DETTE D8-15`) + 9 sautés + **1 échec inattendu** (`EX-SRCH-14`, §7.2) |

- **`test.fail()` restants : 3**, exactement ceux de `D8-15` (`EX-SCR-95`, un par projet). Aucun
  ajouté, aucun retiré.
- **Échec inattendu : 1**, `EX-SRCH-14` au projet `mobile` — défaut hors périmètre, remède **vérifié**
  et décrit au §7.2, laissé rouge sur instruction de mission. `flaky: 0`.
- **9 sautés** : inadéquations de plate-forme, inchangées depuis `fix-app` (`E2E-04` cardinal
  « modèles » absent en compact, `E2E-03`/`E2E-06`/brossage sous 768 px, `E2E-07` écran D en cartes,
  `E2E-17`/`E2E-18` propres au régime dégradé).
- **`E2E-25`** (concurrence inter-onglets, `EX-CRUD-19`/`ADV-13`) : **0 ronde perdante sur 8**, vert
  aux trois projets — la correction de `fix-app` tient.
- **`EX-NFR-9`** (budget 2 000 ms) : médiane **1 499 ms**, max 1 516 ms (`desktop`, 5 mesures :
  1516/1498/1485/1515/1499), **212 Kio** transférés au premier affichage ; sur URL déjà filtrée,
  médiane 1 624 ms. Aucun projet au-dessus du budget. Le câblage F3 n'y change rien : la valeur est à
  6 ms de la mesure de `fix-app` (1 505 ms sur la campagne précédente de cette session).
- `EX-NFR-7` (repeint du nuage) médiane 20 ms ; `EX-NFR-6` (bascule log de G1) médiane 141 ms.

---

## 7. Demandes et signalements

### 7.1 Demande à `fix-state-2` — `EX-SCR-103`, le contrôle `Marque / Modèle` de l'écran B

**Constat, établi en navigateur** (capture d'arbre d'accessibilité sur `/marche/54-opel/1918-corsa`) :
le bouton du sélecteur porte le nom accessible **`Marque / Modèle / Version Toutes les marques`**, et
l'écran `G` s'ouvre **non positionné** (liste de marques au début de l'alphabet : `9ff`, `Abarth`,
`AC`…). `EX-SCR-103` demande l'inverse, mot pour mot : « à l'exception du contrôle `Marque / Modèle`,
qui **sur l'écran B affiche le couple courant et, au clic, ouvre le sélecteur `G` positionné sur ce
couple** ».

**Cause, lue dans le code** (hors de mon périmètre, `src/components/filters/FilterBand.tsx`) :

- l. **436** `const screenGSummary = mmmvSummary(selection, props.referenceData);`
- l. **497–505** `<ScreenG … currentSelection={selection} … />`

En mode 2, `selection` ne porte **jamais** `makesModelsVariants` : `carryFiltersAcrossMode` l'absorbe
dans la route à l'entrée (c'est précisément le motif pour lequel fix-state-2 a introduit `routePair`).
`mmmvSummary` retombe donc sur son défaut `'Toutes les marques'`, et `ScreenG` reçoit une sélection
sans couple.

**Changement demandé.** En mode 2, quand `props.routePair !== undefined`, dériver les deux valeurs du
**couple de la route** plutôt que de la sélection — la fonction existe déjà dans le périmètre de
fix-state-2 (`serializeMmmvBlock`, `src/state/navigation.ts`) :

```tsx
// FilterBand.tsx, l. 436
const routeMmmv =
  props.mode === 'mode2' && props.routePair !== undefined ? serializeMmmvBlock(props.routePair) : undefined;
const screenGSummary = mmmvSummary(
  routeMmmv === undefined ? selection : { ...selection, makesModelsVariants: routeMmmv },
  props.referenceData,
);
// et l. 501, même substitution pour `currentSelection={…}` de <ScreenG>
```

**Preuve attendue** — deux, l'une chez fix-state-2, l'autre chez moi si le fix-lead me la renvoie :

1. sonde `D5` : `FilterBand` rendu en `mode='mode2'` avec `routePair={{ makeId: 54, modelId: 1918 }}`
   et une sélection **sans** `mmmv` → le bouton `structured-picker` porte `Opel Corsa`, et le
   `currentSelection` passé à `ScreenG` porte `makesModelsVariants: '54|1918'` ;
2. E2E : sur `/marche/54-opel/1918-corsa`,
   `expect(page.locator('.kycar-filter-band .kycar-control--structured-picker button')).toContainText('Opel Corsa')`,
   et à l'ouverture de l'écran `G` la marque `Opel` est l'option sélectionnée.

**Je ne l'ai pas corrigé** : `src/components/filters/` n'est pas mon périmètre (`D8-28` maintient
fix-state-2 vivant dessus jusqu'à la fin de mon lot), et rien de ce que je câble n'en dépend —
`EX-SRCH-14` fonctionne de bout en bout sans (§5.2). **Aucun `test.fail()` posé.**

### 7.2 Demande à `fix-state-2` — la feuille compacte est piégée sous l'en-tête (`EX-SCR-97`)

**Défaut découvert par la recette, révélé par mon test `EX-SRCH-14` au projet `mobile`.** À 360 px,
la feuille de filtres plein écran (`EX-SCR-97`) est **recouverte, sur sa bande supérieure, par
l'en-tête collant de l'application** : le premier contrôle de la ligne primaire — précisément le
sélecteur `Marque / Modèle` — est visible mais **inclicquable**. Journal Playwright, mot pour mot :

```
- element is visible, enabled and stable
- <header data-regime="compact" class="app-header kycar-header">…</header> intercepts pointer events
```

**Cause, établie puis VÉRIFIÉE par expérience.** `.kycar-filter-band` est
`position: sticky; z-index: 2` (`src/components/filters/filter-band.css` l. 25–27) : elle crée donc
un **contexte d'empilement**. `.kycar-compact-sheet` (l. 472–480) y est enfermée, et son `z-index: 10`
est relatif à ce contexte — pas à la page. Elle est donc peinte au niveau **2** de la page, sous
`.kycar-header` (`src/app/app.css` l. 47–50, `position: sticky; z-index: 10`). Les autres tests
mobiles passent parce qu'ils agissent sur des contrôles situés **plus bas** que la hauteur de
l'en-tête.

**Changement demandé** — trois lignes dans `src/components/filters/filter-band.css`, à poser avant
`.kycar-compact-sheet` (l. 472) :

```css
/* `EX-SCR-97` : la feuille plein écran est enfermée dans le contexte d'empilement de
   `.kycar-filter-band` (sticky, z-index 2) ; sans cela, l'en-tête collant de l'application
   (`.kycar-header`, z-index 10) recouvre sa bande supérieure et avale le clic. */
.kycar-filter-band--compact {
  z-index: 20;
}
```

**Preuve exécutée.** J'ai appliqué ce correctif **localement, sans le commiter**, reconstruit, et
rejoué le test :

```
# sans le correctif
✘ [mobile] EX-SRCH-14 … (header intercepts pointer events, 90 s de timeout)
# avec les trois lignes ci-dessus
✓ [mobile] EX-SRCH-14 … (2,4 s)
```

Puis j'ai **restauré** `filter-band.css` à l'identique (`git status` propre sur `src/components/`) :
ce fichier n'est pas mon périmètre, et `D8-28` maintient `fix-state-2` vivant dessus jusqu'à la fin
de mon lot. Le test reste **rouge** au projet `mobile`, comme ma mission l'exige, et c'est le seul
échec inattendu de la recette.

*Note pour le fix-lead* : une correction depuis **mon** périmètre (abaisser le `z-index` de
`.kycar-header` dans `src/app/app.css`) casserait la superposition de l'en-tête sur le contenu
principal — ce n'est pas le bon endroit.

### 7.3 Défaut découvert hors périmètre — `EX-SCR-216` en mode 2 (pour le coordinateur)

Sur l'écran `G` **ouvert depuis l'écran B**, chaque entrée affiche `—` au lieu de son effectif
(relevé : `Volkswagen —`, `Abarth —`…). Cause : `screenGMakeCounts` (`app.tsx` l. 528–533) est dérivé
de `marketPhase.data.makeAggregates`, et `marketPhase` n'est **jamais** `loaded` en mode 2 —
l'écran A n'a pas été monté. `ScreenG` retombe alors sur `announcedCount`, absent, donc `—` : **aucune
valeur fausse n'est affichée**, mais l'effectif promis par `EX-SCR-216` manque sur cette surface.

C'est un défaut de **mon** périmètre au sens des fichiers (`app.tsx`, `src/orchestration/`), mais sa
correction n'est pas bornée : servir ces effectifs en mode 2 suppose soit d'exposer les agrégats de
base du contrôleur par un accesseur neuf (`requireBaseline()` est privé), soit un chargement marché
en arrière-plan sur chaque écran B — un second balayage sur le chemin d'un écran qui n'en a pas
besoin, exactement le risque `EX-NFR-9` que `D8-02` a dû désamorcer par un plancher de 400 ms. Ce
n'est pas dans mon mandat (`D8-31` ne cite ni `FV-05` ni `EX-SCR-216`) et je ne l'ai donc **pas**
entrepris. **Je le consigne pour arbitrage du fix-lead**, sans `test.fail()` et sans test rouge : la
recette est verte, l'écart n'est aujourd'hui prouvé que par ce relevé.

Deux voies possibles, si le fix-lead le rouvre : (a) `DataController` publie un getter
`baselineMakeCounts` sur les agrégats **déjà en mémoire** après `start()` (aucun aller provider, coût
nul) — c'est la voie que je recommande ; (b) dette écrite, au même titre que `D8-29`.

### 7.4 Rien à demander à `fix-screens-2` ni à `fix-engine-2`

Toutes leurs props étaient déclarées, typées et optionnelles ; leur repli sans câblage est celui
qu'ils annoncent. `fix-engine-2` §hors périmètre ne m'adressait aucune demande.

---

## 8. Hypothèses écrites comme hypothèses (E4)

1. **Le gain d'`EX-SCR-26` se mesure sur le lot local, pas auprès du provider.** L'exigence ne dit
   pas où. J'ai retenu le lot déjà chargé parce que c'est la **seule** source qui garantit
   l'égalité entre le chiffre annoncé et l'effectif obtenu en suivant la suggestion (même code de
   filtrage), et parce qu'un aller provider par filtre actif sur un écran vide serait hors budget.
   Conséquence assumée : la suggestion n'est offerte qu'en mode 2.
2. **Un filtre de classe `T` n'a pas de gain calculable en mode 2.** fix-screens-2 §8.1 le prescrit
   (« `gain: null` pour un filtre de classe `T` en mode 2 ») ; je l'ai implémenté en lisant `cls`
   dans le registre, et non en devinant une liste. Un filtre `DYNAMIC_BODY` (`bodyType`) tombe, lui,
   dans la règle « aucun gain ⇒ pas de suggestion » : `O15` fait qu'il n'est pas appliqué localement,
   son retrait ne rend donc rien, et le proposer serait faux.
3. **Un retrait à gain nul n'est pas une suggestion.** `EX-SCR-26` ne fixe pas de plancher ; j'ai
   retenu `gain > 0` parce que « retirer X : 0 offres de plus » est un conseil que l'utilisateur
   suivrait pour rien.
4. **`EX-SRCH-14` : la forme courte de `mmmv`.** Je n'ai pas rouvert l'arbitrage de fix-state-2
   §2.3 : la coquille reçoit `/marche?mmmv=74`, forme canonique du dépôt, et mon test E2E éprouve
   cette forme telle qu'elle est produite. Si le fix-lead préfère `74|||`, un seul retour de
   `serializeMmmvBlock` change et mon test suit d'une ligne.
5. **Sélection d'épreuve d'`EX-SCR-174`.** J'ai choisi `?fregfrom=1950&fregto=1960` sur Opel Corsa,
   à effectif nul dans le snapshot synthétique, parce que c'est un **intervalle** : un seul jeton du
   bandeau porté par deux identifiants de filtre, ce qui éprouve du même coup le retrait apparié.
   Si le générateur synthétique change au point d'y placer une offre, le test le dira franchement
   (il compare le gain annoncé à l'effectif observé, pas à une constante).

---

## 9. Ce qui reste ouvert à la sortie de ce lot

| Point | État |
|---|---|
| `EX-SCR-101`, `EX-SRCH-14`, `EX-SCR-174`/`EX-SCR-26`, `EX-SCR-212`/`EX-SCR-213` | **CORRIGÉES avec preuve** (sonde D8 rouge → verte, et E2E rouge → vert pour les trois premières) |
| `EX-SCR-17`, `EX-SCR-153` | **COUVERTES** par fix-screens-2, désormais attestées en navigateur |
| `EX-SCR-103` (couple courant sur le contrôle de l'écran B) | **Demande à fix-state-2**, §7.1 — ni corrigée ni mise en dette par moi |
| `EX-SCR-97` (feuille compacte sous l'en-tête, 360 px) | **Demande à fix-state-2**, §7.2 — remède vérifié, 3 lignes ; **1 test E2E laissé rouge** (`EX-SRCH-14` mobile) |
| `EX-SCR-216` en mode 2 (effectifs de l'écran G) | **Signalement au fix-lead**, §7.3 — `—` affiché, jamais un chiffre faux |
| `topRestrictiveFilters` de l'écran A (mode 1) | Dette **inchangée** de `data-controller.ts`, hors `D8-31`, même cause qu'`D8-29` (`O17`) |
| `D8-15` / `EX-SCR-95` | Dette produit ratifiée : 3 `test.fail()`, un par projet |
