# fix-app-4 — remédiation pré-livraison du plan 3 (phase 3.5)

**Agent** : `fix-app-4` (Opus, effort high) · **Worktree** : `/home/user/KYCAR-app4`, branche
`fix35/app4` depuis `claude/kycar-project-ffcplk` @ `2ad48f0`.
**Entrées** : `reports/ACCEPTANCE.md` rev 3 §4 (P2-4/P2-4b) et §8 — constats **ACC-19**, **ACC-20**,
**ACC-24** ; `reports/data/DATA-LEAD-DECISIONS.md` D3-34 (d), D3-41, D3-42.
**Règle de preuve** (PLAN-2 §2.6 S2) : chaque correction est prouvée par une sonde écrite AVANT elle,
rouge sur le code d'origine, verte après, jamais retouchée pour la faire passer (les deux retouches
de HARNAIS sont déclarées et justifiées au §5).

---

## 1. Tableau de synthèse — constat → correction → preuve → statut

| Constat | Correction | Preuve (commande + sortie) | Statut |
|---|---|---|---|
| **ACC-19** (MAJEUR) « Convertir la sélection en filtre » retire `selx`/`sely` et ne pose aucun filtre, sans message | UNE seule navigation : `DistributionScreen.onConvertBrushToFilter` envoie le correctif ET l'état d'interface sans brossage dans le même appel ; `app.tsx` sérialise les deux dans une seule URL (`applyFilters(patch, extraUi)`) ; le cas « aucun filtre ajouté » publie un message (`D-03`) | `npx playwright test tests/e2e/parcours-p2.spec.ts -g "ACC-19"` — **rouge** : `URL après conversion : …?priceto=20000`, `310 brossées · 310 lignes · Σ 331`, `Expected: not null / Received: null` ×4 + `message=(aucun)` ×2 → **verte** : `…?fregfrom=1993&fregto=2024&kmfrom=15300&kmto=420000&pricefrom=500&priceto=19990`, `Σ après conversion : 308`, message « aucun filtre n'a été ajouté » au 3ᵉ passage. Suite complète du fichier : **55 passed** (3 projets) | **CLOS** |
| **ACC-20** (MAJEUR) toute URL portant `?provider=` est réécrite sans le paramètre, avec le bandeau « paramètre inconnu ignoré » | Paramètres **réservés** du codec (`RESERVED_PARAMS = ['provider']`) : reconnus par `corrections.ts` (aucune correction, aucune classe), rendus dans `LoadedQuery.reserved`, réémis par `serializeQuery({ reserved })` et **reconduits à chaque écriture d'URL** par le point de passage unique `navigate` (`carryReservedParams`) | `npx vitest run --config vitest.review.config.ts tests/review/D5/reserved-params.test.ts` — **rouge** 12/13 → **verte 13/13** ; `npx playwright test tests/e2e/source-fixture.spec.ts` — **rouge** : `URL après chargement : /marche` ×3 → **verte 39/39** : `/marche?provider=synthetic`, `/marche?priceto=20000&provider=synthetic`, Diagnostic `SYNTHETIC` après `reload()` | **CLOS** |
| **ACC-24** (MINEUR) la `coverageNote` n'est affichée par aucun écran | Ligne « Note de couverture » **en fin** du panneau Diagnostic (`app.tsx#diagnostics`, module pur `src/app/diagnostics.ts`), texte complet, plié dans un `<details>` au-delà de 300 caractères | `npx playwright test tests/e2e/source-fixture.spec.ts` — **rouge** : `toHaveCount(1)` reçu `0` ×3 → **verte** : `Jeu de données FIXTURE (PLAN-3) : annonces FICTIVES à la forme AutoScout24, profil test, snapshot be-20260921T060000Z du… (1814 caractères)` | **CLOS** |

---

## 2. ACC-19 — la conversion du brossage

### 2.1 Cause vérifiée

`DistributionScreen.tsx` (l. 344-348 de la révision recettée) :

```
props.onApplyFilters?.(intervalFiltersToSelectionInput(brushInterval));
props.onUiChange({ ...ui, brushX: null, brushY: null });
```

`app.tsx` branchait `onApplyFilters` sur `applyFilters` (qui `navigate(…, 'push')`) et `onUiChange`
sur `applyUiState` (qui `navigate(…)` aussi). **Deux navigations** : la seconde sérialise
`serializeQuery(selection, …)` où `selection` est la sélection dérivée de l'URL **d'avant** le
correctif — elle écrase donc l'URL que la première venait d'écrire. Résultat exactement conforme à la
recette : `?priceto=20000`, un jeton, Σ inchangé, brossage perdu, aucun message.

La cause est confirmée par la sortie ROUGE de la sonde E2E avant toute correction :

```
[MESURE] ACC-19 — Nuée empilée : brossées / listées / Σ avant : 310 brossées · 310 lignes · Σ 331
[MESURE] ACC-19 — Nuée empilée : URL après conversion : /marche/54-opel/1918-corsa?priceto=20000
[MESURE] ACC-19 — seconde conversion : filtres identiques=true · message=(aucun)
```

`applyFilters` acceptait **déjà** un second paramètre `extraUi` (sérialisé avec la requête) : rien
n'a eu à être inventé côté coquille, seul le CHEMIN de l'état d'interface manquait entre l'écran et
elle.

### 2.2 Correction

1. `DistributionScreenProps.onApplyFilters` devient
   `(patch: SelectionInput, nextUi?: DistributionUiState) => void`. Le gestionnaire passe
   `{ ...ui, brushX: null, brushY: null }` en second argument et n'appelle plus `onUiChange`
   (`src/screens/distribution/DistributionScreen.tsx`).
2. `app.tsx` traduit cet état par `writeDistributionUiState` et le donne à `applyFilters` : **une**
   `navigate(…, 'push')`, donc **une** entrée d'historique (`EX-NAV-2x`).
3. `mergeSelectionPatch` (fonction pure, `src/app/navigation.ts`) est extraite d'`applyFilters` pour
   que la coquille puisse PRÉVOIR la requête résultante : si elle est identique à la requête
   courante, la conversion n'ajoute aucun filtre et la coquille publie
   `BRUSH_NO_NEW_FILTER_MESSAGE` (« La sélection brossée tient déjà entièrement dans les filtres
   actifs : aucun filtre n'a été ajouté, seul le brossage a été retiré. ») — `D-03`, jamais un
   silence.

### 2.3 Preuves

- **E2E, deux projections, 3 projets** (`tests/e2e/parcours-p2.spec.ts`, `test.describe('ACC-19 …')`).
  Chaque test : brosse → relève ce que « Voir ces annonces » liste pour LE MÊME brossage → rouvre
  l'URL brossée (`EX-NAV-18`) → convertit. Assertions : `selx`/`sely` absents ; `pricefrom`,
  `priceto`, `kmfrom`, `kmto`, `fregfrom`, `fregto` présents et ordonnés ; `.kycar-token` > 1 ;
  Σ < Σ avant ; Σ ≥ lignes listées (ou bandeau de correction, §2.4) ; retour arrière = **exactement**
  l'URL brossée et Σ d'avant ; réouverture de l'URL produite dans un contexte neuf → même Σ (effectif
  DÉRIVÉ, jamais figé).

  ```
  [MESURE] ACC-19 — Nuée empilée : URL après conversion : /marche/54-opel/1918-corsa?fregfrom=1993&fregto=2024&kmfrom=15300&kmto=420000&pricefrom=500&priceto=19990
  [MESURE] ACC-19 — Nuée empilée : Σ après conversion : 308
  [MESURE] ACC-19 — Prix × année : URL après conversion : /marche/54-opel/1918-corsa?fregfrom=1998&fregto=2024&g4v=b&kmfrom=15300&kmto=420000&pricefrom=500&priceto=17990
  [MESURE] ACC-19 — Prix × année : Σ après conversion : 301
  ```

- **Cas « aucun filtre posé »** : brossage du CADRE ENTIER, répété ; au passage où la boîte
  englobante ne bouge plus, le message doit être là.

  ```
  [MESURE] ACC-19 — conversion sans effet, passage 3 : filtres inchangés=true · message=La sélection brossée tient déjà entièrement dans les filtres actifs : aucun filtre n’a été ajouté, seul le brossage a été retiré.
  ```

- **Sondes de revue D8** (`tests/review/D8/shell-wiring-acc-3.5.test.ts`) : le gestionnaire ne
  contient plus qu'UN seul `props.on…` ; `mergeSelectionPatch` ajoute, remplace et retire sans muter
  ; le message est explicite et publié par le montage.

### 2.4 Fait mesuré à connaître : Σ = 308 pour 310 brossées

La boîte englobante contient par construction toutes les annonces brossées ; l'effectif après
conversion devrait donc être ≥ 310. Il vaut **308**, et la raison est nommée par l'application
elle-même :

```
[MESURE] ACC-19 — Nuée empilée : bandeau de correction : Paramètre « pricefrom » corrigé : borne ramenée au domaine, valeur retenue 500
```

`PRICE_DOMAIN.min = 500` dans `src/state/filter-registry.ts` (domaine relevé sur AutoScout24) : la
borne basse brossée (390 €) sort du domaine, `EX-NAV-21` classe 2 la ramène à 500 € et **le dit**.
Les deux annonces à 390-499 € tombent donc hors filtre. Vérification indépendante (script jetable,
`enterMode2(54, 1918, …)` sur les fixtures `test`) :

| Sélection | Lignes |
|---|---|
| cellule `?priceto=20000` | 331 |
| converti, 6 bornes | **308** |
| converti sans `pricefrom` | **310** |

L'écart est donc entièrement imputable à la borne écrêtée, et il est déclaré. La sonde n'accepte cet
écart **que** si le bandeau `ET-URL-CORRIGEE` est présent et porte « ramenée au domaine » ; sans
bandeau, elle exige Σ ≥ lignes listées. Voir §6 (point pour le coordinateur).

---

## 3. ACC-20 — le paramètre de bascule de source

### 3.1 Cause vérifiée

`provider` est lu par `src/main.tsx` **avant** la coquille et le routeur (`resolveProviderSpec` puis
`resolveProvider`). Il n'est ni un filtre (`filter-registry.ts`) ni un état d'interface
(`UI_STATE_PARAMS`) : `corrections.ts` le classait donc en `UNKNOWN_PARAM` (`EX-NAV-21` classe 5),
l'effaçait de l'URL canonique et publiait « Paramètre « provider » corrigé : paramètre inconnu
ignoré » — sur une bascule pourtant APPLIQUÉE. Sortie ROUGE avant correction :

```
[MESURE] ACC-20 — URL après chargement : /marche
[MESURE] ACC-20 — URL après pose d’un filtre : /marche?priceto=20000
[MESURE] ACC-20 — URL après repli de source : /marche
```

### 3.2 Correction

- `src/state/url-codec.ts` — troisième catégorie de paramètre : `RESERVED_PARAMS` (`provider`),
  `isReservedParam`, `reservedParamsOf(query)`, `carryReservedParams(url, sourceQuery)` et l'option
  `serializeQuery(…, { reserved })`. La valeur est réencodée (`&`, `=` ne peuvent pas rendre l'URL
  ambiguë) mais le `:` est restitué : `fixture:dev` reste lisible et retapable.
- `src/state/corrections.ts` — un paramètre réservé est prélevé AVANT toute classe de correction (y
  compris `MALFORMED_ENCODING`) et rendu dans `LoadedQuery.reserved` ; **aucune** correction n'est
  émise, ni sur sa présence ni sur sa valeur.
- `src/app.tsx` — `navigate`, point de passage unique de toute écriture d'URL, reconduit les
  réservés de `window.location.search` dans l'URL cible, et la canonisation `EX-NAV-21` resérialise
  avec eux. Un seul endroit à tenir : filtres, état d'interface, changement d'écran, canonisation de
  route et liens de la coquille en héritent sans modification.

**Décision (valeur inconnue ou non câblée) : le paramètre est CONSERVÉ tel quel** — recommandation du
coordinateur, retenue. Motif : l'URL doit montrer ce qui a été **demandé** (elle est partageable et
reproductible : celui qui reçoit le lien voit la même chose que celui qui l'a envoyé), et ce qui est
**servi** est dit par le bandeau `ET-SOURCE-REPLI` (« Source de données « carrosserie-de-mon-oncle »
inconnue : l'application est revenue à la source par défaut (fixture:test)… »). Normaliser la valeur
aurait effacé la demande ET laissé le bandeau parler d'une valeur absente de l'URL — le défaut que
ce constat corrige.

### 3.3 Preuves

- **Codec (D5)** : `tests/review/D5/reserved-params.test.ts`, 13 cas — reconnaissance, absence de
  correction (y compris valeur inconnue), aller-retour `parse → serialize` sans perte
  (`priceto=20000&provider=synthetic`, `fregfrom=2017&provider=fixture:dev`, valeur `a&b=c`),
  non-régression (`zzzz=1` reste corrigé), reconduction (ordre `EX-NAV-9`, pas de doublon, URL rendue
  mot pour mot sans réservé). **13/13 verts**, 12/13 rouges avant.
- **Navigateur (3 projets)** : `tests/e2e/source-fixture.spec.ts` — **39/39 verts** (les 8 tests
  `EX-DATA-107`/`DF-2` préexistants compris) :
  ```
  [MESURE] ACC-20 — URL après chargement : /marche?provider=synthetic
  [MESURE] ACC-20 — URL après pose d’un filtre : /marche?priceto=20000&provider=synthetic
  [MESURE] ACC-20 — URL après repli de source : /marche?provider=carrosserie-de-mon-oncle
  ```
  plus : aucun bandeau « corrigé » ; navigation vers l'écran « Recherches » et retour : paramètre
  conservé ; `page.reload()` : Diagnostic `SYNTHETIC` et étiquette « Données synthétiques ».
- **Non-régression du partage et de la canonisation** : `tests/e2e/partage-url.spec.ts` **27/27**
  (dont « la requête est conservée mot pour mot par la canonisation de route » et `E2E-26`
  `ET-URL-CORRIGEE`), `-g "EX-NAV|clavier" --project=desktop` **22/22**,
  `tests/e2e/persistance.spec.ts --project=desktop` **11/11**.

---

## 4. ACC-24 — note de couverture

`D3-34 (d)` : dette confirmée, **pas de bandeau**, une ligne Diagnostic. Réalisée ainsi :
`src/app/diagnostics.ts` (module pur) rend la valeur — `—` sans descripteur, `aucune` si la source
n'en fournit pas, le texte **tel quel** sinon (jamais tronqué) ; `app.tsx` ajoute
`['Note de couverture', coverageNoteValue(d?.coverageNote)]` **en dernière position** (les sondes
existantes lisent `dd` par position : `nth(1)` = Source, `nth(2)` = Snapshot — vérifié par une sonde
dédiée) ; `AppFooter` plie toute valeur de plus de `DIAGNOSTIC_FOLD_THRESHOLD = 300` caractères dans
un `<details>` dont le résumé porte les 120 premiers caractères et la longueur totale.

Preuve : `tests/e2e/source-fixture.spec.ts` (3 projets) — rouge `toHaveCount(1)` reçu `0`, puis
`Jeu de données FIXTURE (PLAN-3) : annonces FICTIVES à la forme AutoScout24, profil test, snapshot
be-20260921T060000Z du… (1814 caractères)`. Sonde D8 : valeur sincère dans les trois cas, texte non
tronqué, ligne en fin de liste, pliage présent.

---

## 5. Sondes retouchées — justification (D-31)

Aucune sonde préexistante n'a été modifiée. Deux retouches portent sur des sondes **que j'ai écrites
moi-même dans ce lot**, et aucune n'affaiblit ce qui est exigé du produit :

1. `tests/review/D8/shell-wiring-acc-3.5.test.ts#bodyOf` — retire les COMMENTAIRES du fragment de
   source avant assertion. Le commentaire de la correction cite nommément l'appel supprimé
   (« appliquer puis `onUiChange` ») : sans nettoyage la sonde lisait la prose au lieu de
   l'instruction. L'assertion (« le gestionnaire n'appelle plus `onUiChange` ») est inchangée.
2. `tests/e2e/parcours-p2.spec.ts` — le brossage du cadre entier fait défiler le canvas hors de
   l'en-tête COLLANT avant d'appuyer, et rejoue le geste si le nuage était en cours de repeinte.
   Diagnostic à l'appui : `document.elementFromPoint` au coin du canvas rendait
   `SPAN.kycar-active-tokens__summary` — l'en-tête grandit de 190 à 248 px quand le bandeau de
   correction d'URL apparaît, et le `mousedown` tombait dessus. Fragilité du HARNAIS, pas un écart du
   produit ; le fait mesuré (ce que fait la conversion) est inchangé.
   Idem pour `source-fixture.spec.ts` : lecture par `textContent` (le panneau Diagnostic est un
   `<details>` REPLIÉ, `innerText` d'un contenu non rendu est vide) et libellé réel de l'onglet
   (« Recherches »).

---

## 6. Hypothèses (E4) et points « hors périmètre / pour le coordinateur »

### Hypothèses

- **E4-1** — La liste des paramètres réservés se limite aujourd'hui à `provider`. Relevé :
  `window.location.search` n'est lu, hors routeur, que par `src/main.tsx` (l. 48) et
  `src/providers/registry.ts` ; aucun autre paramètre n'échappe au couple filtres / état d'interface.
  Ajouter un paramètre hors routeur, c'est désormais ajouter une ligne à `RESERVED_PARAMS`.
- **E4-2** — `navigate` lit les réservés sur `window.location.search` **au moment de l'appel** plutôt
  que dans un état React : `pushState`/`replaceState` mettent l'URL à jour de façon synchrone, deux
  navigations successives restent donc cohérentes, et `navigate` garde une liste de dépendances vide
  (aucun effet de la coquille n'est relancé par un changement d'identité).
- **E4-3** — Le message du cas « aucun filtre ajouté » n'est publié que lorsque la conversion vient
  de l'écran B (`nextUi !== undefined`). Un correctif de filtres sans effet venu d'ailleurs (clic sur
  une barre d'histogramme déjà filtrée) reste muet : hors du périmètre du constat, non traité.

### Hors périmètre — à arbitrer

1. **Bornes brossées hors du domaine AutoScout24 (`src/screens/distribution/brush-model.ts`)** —
   `brushToIntervalFilters` rend les bornes RÉELLES des annonces brossées ; `pricefrom` ne commence
   qu'à 500 € dans le registre, donc une sélection contenant des annonces à moins de 500 € perd ces
   annonces à la conversion (310 → 308 ici), avec un bandeau de correction qui parle d'un paramètre
   que l'utilisateur n'a pas tapé. Trois options : (a) laisser tel quel — c'est déclaré, `D-03` est
   respectée ; (b) écrêter la borne au domaine AVANT de la poser et l'expliquer par un message de
   l'écran B plutôt que par `ET-URL-CORRIGEE` ; (c) omettre la borne basse quand elle tombe sous le
   plancher du domaine (le filtre reste vrai pour toutes les annonces brossées). Correction la plus
   profonde dans `brush-model.ts`, hors de mon périmètre d'écriture (et voisin de `fix-screens-5`).
2. **Recherches enregistrées et historique récent mémorisent l'URL complète** (`app.tsx`
   `stores.saved.create({ url: location.pathname + location.search })`, `stores.recent.visit(…)`) :
   depuis ce lot, une recherche enregistrée sous `?provider=synthetic` porte ce paramètre et rouvrira
   cette source. Je l'estime cohérent (l'`effectifInitial` figé a été mesuré sur CETTE source), mais
   c'est un changement observable de contenu persistant : à ratifier ou à normaliser par une décision
   `D3-nn`.
3. **`?provider=` et le budget d'URL (`EX-NAV-11`)** — la reconduction ajoute ~18 caractères à chaque
   URL. `wouldExceedBudget` est calculé par `FilterBand` SANS les réservés : une sélection à la limite
   des 2 000 caractères pourrait donc franchir le plafond d'un cheveu lorsqu'une bascule de source est
   active. Non corrigé (le refus `EX-NAV-11` reste calculé sur les filtres, ce qui est le comportement
   normatif), mais signalé.
4. **Aucune autre double navigation du même motif** dans `src/screens/` ni `src/components/filters/`
   (relevé : un seul appelant de `props.onApplyFilters` suivi d'un `props.onUiChange`, celui d'ACC-19).
   `FilterBand` écrit ses URL par `onHistoryPush`/`onHistoryReplace`, donc par `navigate` : la
   reconduction des réservés vaut aussi pour lui (vérifié par la sonde E2E « pose d'un filtre »).

---

## 7. Portes de sortie — commandes et résultats

| Commande | Résultat |
|---|---|
| `npm run build` | `✓ built in 1.52s`, 0 erreur / 0 warning (tsc app + worker + vite) |
| `npm run lint` | `eslint .` — code de sortie **0**, aucune sortie |
| `npx vitest run src/app src/state src/orchestration src/screens/distribution --no-file-parallelism` | **176 passed** (14 fichiers) |
| `npx vitest run --config vitest.review.config.ts tests/review/D5 tests/review/D8 --no-file-parallelism` | **421 passed** (36 fichiers) |
| `KYCAR_E2E_PORT=4181 npx playwright test tests/e2e/parcours-p2.spec.ts` | **55 passed** (3 projets) |
| `KYCAR_E2E_PORT=4181 npx playwright test tests/e2e/source-fixture.spec.ts` | **39 passed** (3 projets) |
| `KYCAR_E2E_PORT=4181 npx playwright test tests/e2e/partage-url.spec.ts` | **27 passed** (3 projets) |
| `KYCAR_E2E_PORT=4181 npx playwright test tests/e2e/persistance.spec.ts --project=desktop` | **11 passed** |
| `KYCAR_E2E_PORT=4181 npx playwright test -g "EX-NAV\|clavier" --project=desktop` | **22 passed** |

Port 4181 libéré après chaque exécution (`ss -ltnp | grep 4181` vide) ; `reports/e2e/results.json`
restauré (`git checkout --`) après chaque campagne ; aucune suite complète lancée, aucun appel réseau.

---

## 8. Fichiers touchés

| Fichier | Nature |
|---|---|
| `src/state/url-codec.ts` | paramètres réservés : table, prédicat, relevé, reconduction, option de sérialisation |
| `src/state/corrections.ts` | `LoadedQuery.reserved`, court-circuit des classes de correction |
| `src/app/navigation.ts` | `mergeSelectionPatch`, `BRUSH_NO_NEW_FILTER_MESSAGE` |
| `src/app/diagnostics.ts` | **neuf** — `DIAGNOSTIC_FOLD_THRESHOLD`, `coverageNoteValue` |
| `src/app.tsx` | `navigate` (reconduction), canonisation, `applyFilters`, câblage `onApplyFilters` de l'écran B, ligne Diagnostic, pliage du pied de page |
| `src/screens/distribution/DistributionScreen.tsx` | signature `onApplyFilters`, gestionnaire de conversion (une seule navigation) |
| `tests/review/D5/reserved-params.test.ts` | **neuf** — 13 sondes de codec |
| `tests/review/D8/shell-wiring-acc-3.5.test.ts` | **neuf** — 17 sondes de câblage |
| `tests/e2e/parcours-p2.spec.ts` | **neuf** — 3 tests `ACC-19` (2 projections + cas sans effet) |
| `tests/e2e/source-fixture.spec.ts` | **neuf** — 3 tests `ACC-20` + 1 test `ACC-24` |

Commits (branche `fix35/app4`) : `4cb50bc` (sondes rouges d'abord) · `53e3ca8` (codec + corrections)
· `1ca0778` (coquille et écran B) · `9f110ee` (durcissement du harnais).
