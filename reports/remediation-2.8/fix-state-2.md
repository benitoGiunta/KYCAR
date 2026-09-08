# fix-state-2 — vague F3 de la phase 2.8

**Agent `fix-state-2` (Opus, effort high), 2026-09-08.** Worktree `/home/user/kycar-wt/state2`,
branche `fix28/state2`. Périmètre d'écriture : `src/state/`, `src/components/filters/`,
`tests/review/D5/`, ce rapport. Aucun fichier de `src/app*`, `src/orchestration/`,
`src/persistence/`, `src/screens/`, `src/engine/` n'a été touché (`git show --stat` des deux
commits le confirme).

**Mandat** : `reports/remediation-2.8/FIX-LEAD-DECISIONS-2.8.md` **D8-31** (`EX-SCR-101` et
`EX-SRCH-14` → « logique et sondes D5 » pour moi, « câblage coquille et sondes D8 » pour
`fix-app-2`), **D8-28** (je reste joignable sur `src/components/filters/` jusqu'à la fin de
`fix-app-2`), **D8-33** (`reports/e2e/results.json` non commité — il n'a jamais été régénéré ici :
je n'ai lancé aucune suite E2E, le port 4180 est resté libre) ; plus le point 3 de ma mission
(réponse à `fix-screens-2` sur le paramètre d'URL de `logHistograms`).

**Règle de preuve appliquée** : `D-31`/`D-32` — sonde d'échec écrite et **commitée rouge d'abord**
(`a9a7bf2`), correction ensuite (`d710bd3`), la sonde passant **sans être modifiée** entre les deux.

**Commits** :

| Commit | Contenu |
|---|---|
| `a9a7bf2` | Les trois sondes D5, dont deux **rouges** (`R-D5-2.8-01/02`, `R-D5-2.8-03/04/05`) et une verte à l'arrivée (`R-D5-2.8-06`, constat de conformité) |
| `d710bd3` | `src/state/ineffective-filters.ts`, `src/state/navigation.ts`, `ActiveFilterTokens.tsx`, `FilterBand.tsx`, `filter-band.css` |

---

## 1. `EX-SCR-101` — filtre devenu sans effet après un changement de snapshot

### 1.1 Constat et décision

`draft-screens.md` l. 1173 : « **Le bandeau ne se réinitialise jamais tout seul.** Ni sur
navigation, ni sur erreur, ni sur changement de snapshot. Si un filtre devient invalide après un
changement de snapshot (par exemple un `modelId` disparu), il est conservé, marqué en ambre avec
l'infobulle `Ce modèle est absent du snapshot du <date>` et compté séparément :
`1 filtre sans effet`. »

`FINAL-VERIFICATION.md` §3.2(d) la classe **mineur isolé**, `REMEDIATION-2.8.md` §7.1 point 3 la
déclare **toujours ouverte** et sans porteur ; **D8-31** me l'attribue avec l'obligation de finir
« CORRIGÉE avec preuve ou en dette écrite : aucun troisième état ».

### 1.2 État réel établi (exécution, pas lecture), à `a9a7bf2~1`

| Contrôle exécuté | Résultat |
|---|---|
| `git grep -n "EX-SCR-101" a9a7bf2~1 -- src/` | **0 occurrence** |
| `git grep -n "sans effet" a9a7bf2~1 -- src/` | 5 occurrences, **aucune** n'est un marquage utilisateur (`keyboard-nav.ts` l.172 « sans effet ailleurs dans le piège de focus », `followed-models.ts` l.6/48 et `compare-selection.ts` l.25 « doublon sans effet ») |
| `src/state/corrections.ts` l. 20-25 | Note de lot : « la seule validation hors de portée de ce module est **référentielle** (un `makeId`/`modelId` de `mmmv` existe-t-il réellement dans la taxonomie ?) : elle exige `ReferenceData` et est du ressort du composant appelant (D6/D8), **documentée en dette ci-dessous plutôt que devinée** » |
| `src/state/router.ts` l. 7-13 | Même frontière, mot pour mot, pour `matchRoute` ; la validation référentielle vit dans `resolveTaxonomyRoute` (l. 263), qui prend la taxonomie en paramètre |
| `src/components/filters/ActiveFilterTokens.tsx` (avant) | Un seul compteur (`n filtres actifs`), aucune classe ni attribut de marquage, aucune infobulle de snapshot |

**Conclusion factuelle** : la validation référentielle de `mmmv` n'existait **nulle part** dans la
chaîne bandeau ; un `mmmv` désignant un `makeId`/`modelId` absent de la taxonomie servie restait
posé, silencieux, sans effet et **sans mention** — exactement le défaut d'`EX-SCR-101`. Ce n'est
pas un cas théorique : il est atteignable **aujourd'hui** par une URL partagée (`EX-NAV-21` ne
retire pas un identifiant taxonomique inconnu, par construction assumée).

### 1.3 Décision de conception (mission point 1a : « étendre `corrections.ts` plutôt que dupliquer »)

**J'ai créé un module séparé, `src/state/ineffective-filters.ts`, et non étendu `corrections.ts`.**
Deux motifs, tous deux vérifiables dans le code :

1. `corrections.ts` **déclare** en tête de fichier la raison pour laquelle il ne prend pas
   `ReferenceData` ; `router.ts` a tranché le même problème par **séparation** (`matchRoute` pure /
   `resolveTaxonomyRoute` référentielle). Étendre `corrections.ts` aurait cassé une frontière posée
   deux fois, délibérément.
2. Surtout, les deux mécaniques sont **contraires** : une correction `EX-NAV-21` **retire ou
   modifie** une valeur (et le signale) ; `EX-SCR-101` exige exactement l'inverse — le filtre est
   **conservé**, seulement marqué. Les loger dans la même table `Correction[]` aurait exposé la
   coquille à retirer un filtre qu'`EX-SCR-101` interdit de retirer.

Le nouveau module est bâti sur le patron de `resolveTaxonomyRoute` : pur, sans DOM, sans dépendance
hors `src/state`, taxonomie et date passées en paramètres.

### 1.4 Correction

**`src/state/ineffective-filters.ts` (neuf, 190 l.)** :

- `ineffectiveFilters(selection, { taxonomy?, snapshotDate? }) → { ids, reasons }` — constate, ne
  retire jamais. `ids` = identifiants **distincts** de filtres sans effet (le compteur
  d'`EX-SCR-101` compte des **filtres**, pas des jetons) ; `reasons[]` porte `filterId`, `tokenKey`
  (aligné sur `ActiveFilterToken.key` de `labels.ts`, pour que le rendu marque le **seul** niveau
  fautif), `kind` et le `message` normatif.
- Règles : `taxonomy` absente ⇒ **aucun** constat (jamais d'ambre par défaut — un marquage inventé
  serait une valeur affichée fausse, `A-04`) ; `modelId = 0` n'est **jamais** un modèle disparu
  (clé réservée « Modèle non identifié », `EX-DATA-72` — même exception qu'à `router.ts` l. 273) ;
  une **marque** absente emporte son modèle et ne produit qu'un motif ; un bloc mal formé n'est pas
  « sans effet » (il est mal formé, ce n'est pas le même constat).
- `formatSnapshotDateFrBE(value) → 'JJ/MM/AAAA' | null`. `dateStyle: 'short'` est **écarté** :
  mesuré en `fr-BE`, il produit `2/09/26` (jour non paddé, année sur deux chiffres), pas la forme
  demandée. `null` (date absente/illisible) ⇒ message replié sur « du snapshot **courant** »,
  jamais une date inventée.
- `ineffectiveFilterCountLabel(n)` : `null` à 0, `1 filtre sans effet`, `3 filtres sans effet`.

**`ActiveFilterTokens.tsx`** : deux props optionnelles (`snapshotDate`, `snapshotTaxonomy`) ; la
rangée fautive reçoit `data-ineffective="true"`, la classe `kycar-token--ineffective`, le message
**exact** en `title`, et une note masquée visuellement référencée par `aria-describedby` (la couleur
n'est jamais le seul signal — `EX-SCR-99`) ; le compteur `n filtre(s) sans effet` est rendu dans un
`<span class="kycar-active-tokens__ineffective">` **à côté** du compteur `n filtres actifs`, jamais
à sa place. **Aucun retrait automatique** : les deux jetons de `mmmv` restent rendus et retirables.

**`filter-band.css`** : `--color-ineffective: #8a5300` (sur `#ffffff` : **6,33:1**, au-delà du
plancher 4,5:1 d'`EX-SCR-99`, et suffisant comme bordure pour le plancher 3:1) et
`--color-ineffective-surface: #fff7e6`, définis **localement** sur `.kycar-active-tokens` parce que
`src/styles/tokens.css` est hors de mon périmètre ; `.kycar-token__ineffective-note` reprend la
règle de `.kycar-visually-hidden` d'`app.css` pour que le bandeau reste montable isolément.

**`FilterBand.tsx`** : `snapshotDate` et `snapshotTaxonomy` routés vers les **deux** instances
d'`ActiveFilterTokens` (régime large et régime compact).

**Non-régression garantie par construction** : tout le marquage est conditionné à
`snapshotDate !== undefined`. Tant que `fix-app-2` ne câble pas ce prop, le rendu est **identique**
à celui d'avant `d710bd3` — la sonde `R-D5-2.8-02` dernier cas l'atteste.

### 1.5 Sondes

`tests/review/D5/ineffective-filters.test.ts` — **14 cas**.

| Identifiant | Objet | Rouge à `a9a7bf2` | Vert à `d710bd3` |
|---|---|---|---|
| `R-D5-2.8-01` (8 cas) | fonction pure : `modelId` disparu, `makeId` disparu, tout valide, sélection vide, taxonomie absente, date absente, format de date, singulier/pluriel du compteur | oui (`Cannot find module '../../../src/state/ineffective-filters'`) | oui |
| `R-D5-2.8-02` (6 cas) | rendu : chip ambre `data-ineffective="true"`, infobulle **exacte** + `aria-describedby`, filtre conservé, compteur distinct, pluriel par **filtre** et non par jeton, rendu inchangé sans props | oui (module absent, puis 5 cas sur 6 encore rouges après la seule fonction pure — trace intermédiaire relevée : `expected '' to be '1 filtre sans effet'`) | oui |

Sortie rouge relevée sur le seul commit de sondes (`git stash` de `src/`, exécution, `git stash pop`) :
`Test Files 2 failed | 1 passed (3)` — les deux suites neuves ne se chargent même pas, faute des
modules qu'elles exigent.

Sortie verte (`d710bd3`) :
`tests/review/D5/ineffective-filters.test.ts (14 tests) 17ms — 14 passed`.

---

## 2. `EX-SRCH-14` — changer de marque en mode 2 vide le modèle

### 2.1 Constat et décision

`draft-behaviour.md` §B.3 l. 456 : « Changer de marque en mode 2 (via un sélecteur, hors clic sur
zone-modèle) **vide** le modèle : il n'existe aucune garantie qu'un `modelId` reste valide pour une
nouvelle marque. L'utilisateur revient à un état "marque choisie, modèle à choisir", concrètement
une redirection vers `/marche` avec `mmmv=<makeId>|||` posé à la nouvelle marque. »
(*Précision de lecture : l'exigence porte l'identifiant `EX-SRCH-14` dans `draft-behaviour.md`, pas
dans `REQUIREMENTS.md` — `git grep -n "EX-SRCH-14" docs/requirements/REQUIREMENTS.md` → 0 ; la
ligne ~456 citée dans ma mission est bien celle de `draft-behaviour.md`.*)

`REMEDIATION-2.8.md` §7.1 point 2 : « les deux sondes à écrire en 2.8 n'ont pas été écrites »,
preuve `grep -rn 'EX-SRCH-14' tests/` → **0** (revérifié : `git grep -c "EX-SRCH-14" a9a7bf2~1 --
tests/` sort en code 1, aucune ligne). **D8-31** m'attribue la logique et les sondes D5.

### 2.2 État réel établi

**Quel contrôle change la marque en mode 2 ?** Un seul, et il est **dans mon périmètre** :

- `EX-SCR-103` (`draft-screens.md`) : « Le bandeau est identique sur les écrans A, B, C et D […] à
  l'exception du contrôle `Marque / Modèle`, qui **sur l'écran B affiche le couple courant et, au
  clic, ouvre le sélecteur `G` positionné sur ce couple**. »
- `FilterBand.tsx` monte `ScreenG` et lui donne `onApply` ; à `a9a7bf2~1` (l. 429-431) :
  ```
  onApply={(mmmv) => {
    setScreenGOpen(false);
    handleChange({ filterId: 'makesModelsVariants', value: mmmv, gesture: 'selection-immediate' });
  }}
  ```
- `handleChange` → `applyToSelection` (l. 211-221) → `assembleUrl(props.originAndPath, query)`.
  `originAndPath` est le chemin de l'écran **B** : choisir une autre marque depuis `/marche/54-opel/1918-corsa`
  produisait **`/marche/54-opel/1918-corsa?mmmv=74`** — la route restait sur l'**ancien** couple, et
  un `mmmv` orphelin s'ajoutait. Ni redirection, ni modèle vidé, ni mention.
- Côté coquille, aucun sélecteur de marque d'en-tête n'existe (`fix-app.md` §1 lignes 4-6 : `D8-04a`
  pose `mmmv` depuis le **clic sur l'en-tête de carte**, écran A ; `D8-04b` redirige un `mmmv`
  complet **depuis l'écran A** — l'effet est gardé par `if (view.kind !== 'market') return;`,
  `app.tsx` l. 763). Aucun de ces chemins n'est le mode 2.

**Quelle fonction de `src/state` calculait la cible ?** Aucune. `router.ts#carryFiltersAcrossMode`
sait **transporter** les filtres d'un mode à l'autre, mais ne décide pas de la cible ; `matchRoute`
et `resolveTaxonomyRoute` ne connaissent pas la sélection. Il n'existait pas de `src/state/navigation.ts`.

### 2.3 Correction

**`src/state/navigation.ts` (neuf, 140 l.) — source de vérité unique** :

- `parseMmmvBlock(value) → { makeId, modelId? } | null` (accepte `74`, `74|||`, `74|2084` ; refuse
  vide, non numérique, multi-blocs — même règle que `app.tsx#completeMmmvPair`, généralisée).
- `serializeMmmvBlock(block)` — forme canonique, identique à `screen-g-model.ts#serializeMmmv`.
- `resolveMakeChange({ mode, selection, chosen, routePair? }) → MakeChangeOutcome`, quatre cas :

| Cas | Sortie | Exigence |
|---|---|---|
| mode 1 | `filter` — `mmmv` mis à jour, aucune redirection | `EX-SRCH-8` ; la redirection d'un couple complet reste le fait de la coquille (`D8-04b`) |
| mode 2, un **modèle** est choisi | `goToModel` + sélection dont le bloc `mmmv` est **absorbé** | `EX-NAV-15` — « hors clic sur zone-modèle » : ce n'est pas un changement de marque |
| mode 2, **même** marque, sans modèle | `unchanged` | `EX-SCR-216` (« sélection inchangée ») |
| mode 2, **nouvelle** marque, sans modèle | `redirectToMarket` vers `/marche`, `mmmv` = la seule nouvelle marque, **tous** les autres filtres conservés | **`EX-SRCH-14`** |

  La construction de l'état est **déléguée** à `router.ts#carryFiltersAcrossMode` (`EX-NAV-17`) :
  aucune règle de transport n'est réécrite ici.

**Sur `mmmv=<makeId>|||` (E4 — hypothèse écrite comme hypothèse).** La grammaire `mmmv` est
`make|model|modelLine|version` (`EX-SCR-72`) : `74|||` **est** `74` suivi de trois blocs de queue
**vides** — même valeur, deux écritures. La forme canonique du dépôt est la forme **courte** :
`screen-g-model.ts#serializeMmmv(make, undefined)` produit `"74"`, `carryFiltersAcrossMode` aussi,
et `D8-04c` (« retour B → A réinjecte `make|||` ») a été **livrée et acceptée** sous cette forme
(`fix-app.md` §1 ligne 6 : `marketUrlFrom({ makeId: view.makeId })`). Émettre `74|||` ici aurait
créé une **seconde** écriture du même état, donc deux URL pour une même sélection, contre
`EX-NAV-8`/`9`. **J'ai retenu la forme courte** et la sonde éprouve la **sémantique** (« la nouvelle
marque, aucun modèle ») via `parseMmmvBlock`, qui atteste explicitement que les deux écritures se
lisent à l'identique — plutôt qu'une écriture particulière. Si le fix-lead préfère la forme longue,
un seul retour de `serializeMmmvBlock` est à changer, et `R-D5-2.8-03` reste vraie.

**`FilterBand.tsx`** (câblage direct, mon périmètre, via un callback **existant**) :

- Nouveau `handleScreenGApply`, branché sur `ScreenG#onApply`. Il n'agit que si
  `props.mode === 'mode2'` **et** `props.routePair !== undefined` ; sinon il retombe **exactement**
  sur l'appel `handleChange` d'avant (non-régression stricte).
- `forcePushSelectionTo(next, path, uiState)` généralise `forcePushSelection` : c'est la seule
  situation où le bandeau change de **route**. L'état d'interface est alors volontairement **vidé**
  (brossage `selx`/`sely`, `page`, variante `g4v` du mode 2 n'ont aucun sens sur l'écran A).
  La poussée passe par `controller.forcePush` → `props.onHistoryPush` : `EX-NAV-14` (changement de
  route = toujours `pushState`) est respecté sans aucun code neuf dans la coquille.
- `EX-NAV-11` appliqué au chemin neuf comme partout ailleurs : `wouldExceedBudget` d'abord, refus
  avec `URL_BUDGET_EXCEEDED_MESSAGE`, jamais de troncature.

### 2.4 Sondes

`tests/review/D5/make-change-mode2.test.ts` — **12 cas**, rouges à `a9a7bf2`
(`Cannot find module '../../../src/state/navigation'`), verts à `d710bd3` (`12 passed`).

| Identifiant | Cas |
|---|---|
| `R-D5-2.8-03` | grammaire : `74`, `74\|\|\|` (identiques), `74\|2084`, valeurs refusées |
| `R-D5-2.8-04` | mode 2, nouvelle marque → `/marche` + `mmmv` à la seule nouvelle marque ; autres filtres tous conservés ; **URL canonique** (rechargée par `loadQuery`, elle ne déclenche **aucune** correction `EX-NAV-21` et rend la même sélection) ; même marque → inchangé ; couple complet → `goToModel` avec bloc absorbé |
| `R-D5-2.8-05` | mode 1 → simple mise à jour de `mmmv`, aucune redirection ; mode 1 couple complet ; mode 2 sans `routePair` |

---

## 3. Sondes existantes modifiées

**Aucune sonde existante, ni aucun test existant, n'a été modifié.** `git show --stat d710bd3` et
`a9a7bf2` ne touchent aucun fichier `*.test.ts` préexistant.

Une seule correction interne, faite **pendant l'écriture** de la sonde neuve `R-D5-2.8-02` et
**avant** qu'elle ne serve de preuve (elle était encore rouge) : le sélecteur d'un cas filtrait les
`<li>` par `n.props.key`, or Preact **sort** `key` du sac de props (il vit sur le VNode). Filtre
remplacé par la classe `kycar-token`, commentaire posé dans le fichier. L'assertion (« les deux
jetons restent rendus, aucun retrait automatique ») est inchangée. Ce n'est pas une sonde amendée au
sens de `D-31` — elle n'avait encore rien prouvé.

---

## 4. Portes exécutées dans ce worktree (séquentiellement, périmètre seul)

| Commande | Résultat |
|---|---|
| `npx tsc --noEmit -p tsconfig.json` | **0 erreur** |
| `npx tsc --noEmit -p tsconfig.review.json` | **0 erreur** |
| `npx eslint src/state src/components tests/review/D5` | **vert**, 0 avertissement |
| `npx vitest run --no-file-parallelism src/state src/components` | **183 passés / 183**, 11 fichiers |
| `npx vitest run --config vitest.review.config.ts --no-file-parallelism tests/review/D5` | **189 passés / 189**, 17 fichiers (dont les 33 cas neufs) |
| `npm run build` | **vert** — `index-DySoCB7L.js 316,01 kB │ gzip: 102,58 kB`, `index-BbKYhaX9.css 32,14 kB │ gzip: 5,63 kB` |

Ni la suite complète, ni la suite E2E n'ont été lancées (port 4180 laissé libre) ;
`reports/e2e/results.json` n'a **pas** été modifié (`git status` propre sur ce fichier, `D8-33`).

---

## 5. Câblage attendu de `fix-app-2`

Trois props à ajouter au montage de `FilterBand` (`src/app.tsx` l. 1206-1243, unique montage,
commun aux surfaces A/B/C/D). Tant qu'elles sont absentes, le comportement est **exactement** celui
d'avant `d710bd3` : rien ne casse, mais les deux exigences ne sont pas atteintes en navigateur.

### 5.1 `snapshotDate` — `EX-SCR-101`

| | |
|---|---|
| **Nom** | `snapshotDate` |
| **Type** | `string \| Date \| undefined` |
| **Source** | `descriptor?.capturedAt` — `const descriptor = controller.snapshotDescriptor;` déjà en portée à `app.tsx` **l. 1063**, et déjà consommé l. 1184 (`AppHeader`) et l. 1265 |
| **Comportement** | Vaut **déclaration** : « la taxonomie que je te donne est celle de ce snapshot ». Absente ⇒ aucun marquage, rendu inchangé. Présente ⇒ un `mmmv` dont la marque ou le modèle est absent de la taxonomie est marqué en ambre, conservé, et compté à part |

Code exact à poser (à la suite de `referenceData={referenceData}`) :

```tsx
snapshotDate={descriptor?.capturedAt}
```

*(Attention au type : ce prop n'accepte pas `null` — écrire `descriptor?.capturedAt`, pas
`descriptor?.capturedAt ?? null` comme pour `AppHeader`.)*

`snapshotTaxonomy` n'est **pas** à câbler aujourd'hui : `referenceData` est chargé une fois au
démarrage (`main.tsx` l. 35) et sert donc aussi de taxonomie du snapshot. Le prop existe pour le
jour où un provider réel servira sa propre taxonomie ; le laisser absent est correct.

### 5.2 `routePair` — `EX-SRCH-14`

| | |
|---|---|
| **Nom** | `routePair` |
| **Type** | `{ readonly makeId: number; readonly modelId?: number } \| undefined` (`ModeCarryPair` de `src/state/router.ts`) |
| **Source** | `view` (`app.tsx`, `view.kind === 'modelDistribution' \| 'modelListings'` porte `makeId`/`modelId`) |
| **Comportement** | Fournit au bandeau la marque **courante**, qui en mode 2 n'est portée que par la route (`carryFiltersAcrossMode` retire `mmmv` de la sélection à l'entrée). Sans lui, « même marque » n'est pas décidable et le bandeau garde le comportement d'avant |

```tsx
routePair={
  view.kind === 'modelDistribution' || view.kind === 'modelListings'
    ? { makeId: view.makeId, modelId: view.modelId }
    : undefined
}
```

### 5.3 `onSelectModel` — `EX-NAV-15` (corollaire du même geste)

| | |
|---|---|
| **Nom** | `onSelectModel` |
| **Type** | `(pair: { readonly makeId: number; readonly modelId: number }) => void` |
| **Source** | `goToModel` (`app.tsx` **l. 737**), déjà écrit et déjà utilisé par l'effet de `D8-04b` |
| **Comportement** | Appelé quand le sélecteur `G`, ouvert **depuis le mode 2**, désigne un couple complet : seule la coquille sait construire `/marche/:makeId-:slug/:modelId-:slug` (les slugs viennent de la taxonomie). Absent ⇒ repli sur le comportement d'avant (`mmmv` posé comme filtre) |

```tsx
onSelectModel={(pair) => goToModel(pair.makeId, pair.modelId)}
```

### 5.4 Gestionnaire d'`EX-SRCH-14` — rien d'autre à écrire

**Le geste lui-même est déjà câblé dans mon périmètre.** Le seul sélecteur de marque atteignable en
mode 2 est l'écran `G` ouvert par le contrôle `Marque / Modèle` du bandeau (`EX-SCR-103`), et
`FilterBand#handleScreenGApply` exécute désormais la cible calculée par `resolveMakeChange`, en
poussant l'URL par le callback **existant** `onHistoryPush` (déjà relié à `navigate(url, 'push')`,
`app.tsx` l. 1216). `fix-app-2` n'a donc **aucun** gestionnaire nouveau à écrire pour `EX-SRCH-14` :
seulement les props `routePair` et `onSelectModel` ci-dessus.

Si `fix-app-2` ajoutait un jour un sélecteur de marque **hors** du bandeau (en-tête, fil d'Ariane),
il doit passer par la **même** fonction, jamais par une règle réécrite :

```tsx
import { resolveMakeChange } from './state/navigation';
// …
const outcome = resolveMakeChange({ mode: currentMode, selection, chosen: { makeId }, routePair });
if (outcome.kind === 'redirectToMarket') {
  navigate(assembleUrl(outcome.path, serializeQuery(outcome.selection, {}, { filterDefaults: FILTER_DEFAULTS })).url, 'push');
}
```

### 5.5 Sondes D8 suggérées (périmètre de `fix-app-2`, `D8-31`)

1. **Statique** (`tests/review/D8/shell-static.test.ts`, où sont déjà les preuves de câblage de
   `fix-app`) : le montage de `FilterBand` porte bien `snapshotDate`, `routePair` et `onSelectModel`.
2. **E2E** : sur `/marche/54-opel/1918-corsa`, ouvrir le sélecteur `Marque / Modèle`, choisir une
   autre marque, `Appliquer` → l'URL est `/marche?…mmmv=<nouvelle marque>` (aucun segment de modèle
   dans le chemin), les autres filtres posés sont toujours dans la requête.
3. **E2E** : charger `/marche?mmmv=54|999999` (modèle inexistant) → le jeton est conservé, porte
   `data-ineffective="true"`, son `title` est `Ce modèle est absent du snapshot du <JJ/MM/AAAA>`, et
   la zone (4) affiche `1 filtre sans effet` **en plus** de `n filtres actifs`.

---

## 6. Réponse à `fix-screens-2` — paramètre d'URL de `logHistograms` (`EX-SCR-17`)

**Réponse courte : rien à élargir, l'indice `7` est déjà encodable. Aucun changement n'a été fait,
et c'est un constat d'exécution, pas de lecture.**

Faits établis :

1. Le paramètre n'est **pas** déclaré dans `src/state/filter-registry.ts` (ce n'est pas un filtre) ni
   dans la liste fermée `UI_STATE_PARAMS` de `src/state/url-codec.ts` (l. 50-61). Il est
   **génératif**, un par graphe numéroté, conformément à `EX-SCR-16` : « son état est mémorisé par
   graphe dans l'URL (paramètre `g<n>log=1`), pas globalement ».
2. Trois points le portent, **tous** avec un domaine ouvert `\d+` :
   `url-codec.ts#graphLogParam(n)` (l. 64-66) fabrique le nom ; `corrections.ts#GRAPH_LOG_RE`
   (`/^g\d+log$/`, l. 80, utilisé par `isUiStateParam` l. 86-88) le classe **état d'interface** et
   non « paramètre inconnu » (classe 5 d'`EX-NAV-21`) ; `src/screens/distribution/url-state.ts#LOG_PARAM_RE`
   (`/^g(\d+)log$/`, l. 64) le relit dans `logHistograms`.
3. **Le domaine n'exclut donc pas `7`** — il n'exclut aucun entier. Aucun élargissement n'était
   nécessaire, et je n'en ai fait aucun.

Je **n'ai pas** restreint le domaine à `{1,2,3,7}` (le « rejet de `4`/`8` » envisagé par ma mission) :
`EX-SCR-16` décrit une bascule **conditionnelle** offerte sur *un axe d'effectif* — le jeu des
graphes qui peuvent la porter est une propriété de l'écran B, pas du codec, et le figer dans
`src/state` casserait `EX-SCR-16` en silence le jour où un autre graphe la propose. La sonde
ci-dessous sert de garde-fou dans l'autre sens : un rétrécissement futur du domaine ferait échouer
`R-D5-2.8-06`.

Sonde `tests/review/D5/graph-log-param.test.ts` — **7 cas, verts à l'arrivée** (constat de
conformité au sens du protocole de revue §2) :

| Cas | Vérifié |
|---|---|
| `graphLogParam` | `[1,2,3,7] → ['g1log','g2log','g3log','g7log']` |
| aller | `serializeQuery` produit `g1log=1&g2log=1&g3log=1&g7log=1`, ordre alphabétique canonique (`EX-NAV-9`) |
| retour | `loadQuery` les rend en `uiState`, **0 correction**, `selection` vide |
| discrimination | `?g7log=1` → 0 correction ; `?glog7=1` → 1 correction `UNKNOWN_PARAM` |
| contrat D7 | `readDistributionUiStateFromQuery('?g1log=1&g7log=1')` → `logHistograms = {1, 7}` |
| aller-retour complet | `writeDistributionUiState({logHistograms:{7,3,1}})` → `g1log=1&g3log=1&g7log=1` → relu `{1,3,7}` |
| défaut | aucune bascule ⇒ aucun `g<n>log` émis (`EX-NAV-8`) |

`fix-screens-2` peut donc écrire `EX-SCR-17` (bascule log de l'axe des prix de `G7`) en réutilisant
tel quel `toggleLogHistogram(state, 7)` et `ui.logHistograms.has(7)` : **aucune dépendance sur moi**.

---

## 7. Hypothèses écrites comme hypothèses (E4)

1. **Portée réellement atteignable d'`EX-SCR-101`.** Seul `mmmv` porte un domaine dépendant du
   snapshot. Les domaines énumérés du bandeau sont **figés** dans `filter-registry.ts` (sourcés une
   fois sur `data/reference/filters.json`), et la note de lot de ce registre (l. 11-20) **refuse
   explicitement** de les indexer sur `ReferenceData.vocabularies`, avec deux collisions d'homonymie
   mesurées (`pe_category`/`KYCAR_PRICE_EVALUATION`, `ustate`/`KYCAR_USAGE_STATE`). Un code énuméré
   ne peut donc pas « disparaître avec le snapshot » : l'extension demandée par ma mission (« étends
   aux valeurs d'énumération absentes du vocabulaire **si le registre le permet** ») **n'est pas
   permise par le registre**, et l'implémenter aurait exigé d'inventer une table filtre →
   vocabulaire que le lot D5 a écartée par écrit. Le type `IneffectiveKind` réserve néanmoins le
   code `MISSING_ENUM_CODE` : aucune valeur de ce genre n'est produite en v1.
2. **Le message de la marque absente.** `EX-SCR-101` n'énonce littéralement que le cas du modèle
   (« `Ce modèle est absent du snapshot du <date>` »). Le cas de la marque en est la transposition
   grammaticale, même forme : `Cette marque est absente du snapshot du <date>`. Aucune autre forme
   n'est inventée.
3. **Un `mmmv` fautif compte pour UN filtre sans effet**, même si marque et modèle sont tous deux
   absents : `EX-SCR-101` écrit « **1 filtre** sans effet », et le compteur compte des filtres, pas
   des jetons. C'est la lecture retenue, sondée explicitement.
4. **Réalisabilité aujourd'hui.** `referenceData` est chargé une fois au démarrage (`main.tsx` l. 35)
   et n'est pas re-servi par le snapshot : le scénario littéral de l'exigence (« un `modelId` disparu
   **après un changement de snapshot** ») ne se produira qu'avec un provider réel servant sa propre
   taxonomie. Le mécanisme, lui, est atteignable **dès maintenant** par une URL partagée portant un
   identifiant taxonomique inconnu — c'est le cas que sondent `R-D5-2.8-01/02`, et c'est le même
   code qui servira le jour du provider réel.

---

## 8. Dettes motivées

**Aucune dette ouverte sur mon mandat.** Les deux exigences de `D8-31` qui m'étaient attribuées
(`EX-SCR-101`, `EX-SRCH-14`) sont **CORRIGÉES avec preuve** au sens de `D8-31` (« aucun troisième
état ») pour la part **logique + rendu + sondes D5** qui m'est confiée ; la part **coquille** est
listée au §5 et relève de `fix-app-2`, conformément au découpage de `D8-31` lui-même.

Deux **relevés** (ni dettes ni corrections, portés à la connaissance du fix-lead) :

1. `EX-SCR-212` (écran E, attribué à `fix-screens-2`) renvoie explicitement à `EX-SCR-101` :
   « Si le périmètre n'est plus calculable (modèle absent du snapshot), la carte affiche
   `Périmètre indisponible dans le snapshot du <date>` et le bouton `Ouvrir` **reste actif**
   (`EX-SCR-101`) ». `ineffectiveFilters` et `formatSnapshotDateFrBE` sont exportés depuis
   `src/state/ineffective-filters.ts` et directement réutilisables par `SavedSearchesScreen` : le
   « reste actif » y est le pendant exact du « jamais de retrait automatique » que j'ai implémenté
   dans la zone (4). Aucune coordination bloquante — nos worktrees sont disjoints, les fusions se
   font dans l'ordre `engine-2 → state-2 → screens-2`, donc mon module sera déjà en place.
2. `EX-SRCH-14` ne couvre pas le geste « depuis le mode 2, choisir une **autre marque ET un
   modèle** » : `resolveMakeChange` le classe `goToModel` (`EX-NAV-15`), ce qui est la lecture la
   plus fidèle (« hors clic sur zone-modèle » : ce n'est pas un changement de marque). Son exécution
   dépend du prop `onSelectModel` du §5.3 ; sans lui, le repli est le comportement d'avant, jamais
   une navigation fausse.

---

## 9. Disponibilité (`D8-28`)

Conformément à `D8-28` (« en F3, `fix-state-2` reste vivant jusqu'à la fin de `fix-app-2` »), ce
worktree reste ouvert sur `src/components/filters/` : toute retouche demandée par le coordinateur
pendant la phase de câblage y sera traitée avec la même règle de preuve (sonde d'abord, gates du §4
rejouées, commit dédié).
