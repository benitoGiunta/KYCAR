# fix-screens-3 — remédiation ciblée, constat C-R1-03 (plan 3, phase 3.5)

Worktree `/home/user/KYCAR-fix-screens`, branche `fix35/screens`. Deux correctifs livrés, dans
l'ordre du mandat : (1) correction produit (`src/screens/market/`) ; (2) correction de sonde
(`tests/e2e/finition-2.10.spec.ts`, D-31).

## 1. Constat C-R1-03 (coordinateur, 2026-09-13)

`ACC-08 — gouttière de grille, rayon des contrôles et cibles tactiles (EX-SCR-21)` échouait sur
`tablet` (seuil 32 px) et `mobile` (seuil 44 px) depuis la fusion de `fixture-perf`, alors qu'aucun
fichier de `src/screens` n'avait changé. Mesures publiées avant correction :

- tablet : « 81 cibles sur 291 sous 32 px : input.kycar-market-zone-compare(13×13), … »
- mobile : « 77 cibles sur 211 sous 44 px : input.kycar-market-zone-compare(13×13), … »
- avant la fusion : « 0 cibles sur 127 » sur les trois régimes.

## 2. Cause

`open()`/`waitForMarket()` (`tests/e2e/_helpers.ts`) n'attendent que le premier rendu utile de
l'écran A (effectif + une carte-marque). Les zones-modèles (et leur case « Comparer ») arrivent
dans un second aller **différé à la boucle d'inactivité** (`loadAllModels`, `src/app.tsx` ~l. 413,
`EX-NFR-9`), pour ne jamais disputer le thread à la première peinture. Avant `fixture-perf`, ce
second aller se terminait presque instantanément (jeu réduit) : la mesure ACC-08, prise juste après
`open()`, tombait quasi toujours **après** son arrivée et ne voyait donc jamais les zones-modèles
(d'où « 0 cibles sur 127 » — la sonde ne les comptait pas du tout, elles n'existaient pas encore
dans le DOM mesuré ni avant ni après selon le tirage). Depuis `fixture-perf`, l'ingestion différée
retarde ce second aller de façon plus marquée et déterministe : la mesure tombe désormais avant son
arrivée sur les régimes où le rendu est plus lourd (tablet/mobile), et voit les zones-modèles
**une fois qu'elles apparaissent**, dans un DOM qui contenait déjà, depuis toujours, une case native
`input.kycar-market-zone-compare` de 13×13 px, **sans `<label>` associé** — un défaut produit latent
que la sonde n'avait simplement jamais eu l'occasion de mesurer.

Confirmation : aucun fichier de `src/screens/market/` n'a de diff dans l'historique de la fusion
`fixture-perf` (`git log --oneline -- src/screens/market` ne remonte à aucun commit du lot) ; le
défaut est antérieur, seul le *timing* de la sonde l'a révélé.

## 3. Correction produit — `src/screens/market/ModelZone.tsx`, `src/screens/market/market.css`

**Avant** : `<input type="checkbox" class="kycar-market-zone-compare" …/>` posé en sibling direct de
`.kycar-market-zone-interactive` (D8-14). La case elle-même portait toute la surface cliquable
(13×13 px, `margin-top: 3px`).

**Après** : la case est enveloppée dans `<label class="kycar-market-zone-compare-target" …>` — un
sibling au même titre (il ne descend pas dans `.kycar-market-zone-interactive`, D8-14 intact,
vérifié par `tests/review/D6/structure-a11y.test.ts`, vert). La boîte du **label** porte la cible :

```css
.kycar-market-zone-compare-target {
  flex-shrink: 0;
  align-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;   /* mobile-first : régime compact */
  min-height: 44px;
  cursor: pointer;
}
@media (min-width: 768px) {
  .kycar-market-zone-compare-target { min-width: 32px; min-height: 32px; }  /* intermédiaire ET large */
}
.kycar-market-zone-compare { margin: 0; }
```

La case native reste à l'intérieur, taille et apparence inchangées (aucun redessin, comme l'exclut
d'ailleurs explicitement le commentaire d'ACC-08 sur les cases/radios natifs). Association
implicite label→input (aucun `id`/`for` ajouté). `aria-label`, `checked`, `disabled`, `title`
(déplacé sur le label, tooltip visible sur toute la cible plutôt que sur les 13 px de la case) et
`onClick` avec `stopPropagation()` sont conservés à l'identique sur l'`<input>`.

Dans le régime compact (`@container (max-width: 767.98px)`), `grid-area: cmp` est repris par
`.kycar-market-zone-compare-target` (c'est elle, désormais, l'enfant direct de `.kycar-market-zone`
dans cette colonne) ; la colonne reste `auto` (largeur intrinsèque, 44 px).

**Contraintes vérifiées** :
- `D8-14` (nested-interactive) : le `<label>` est un sibling, jamais un descendant du
  `role="button"` — `tests/review/D6/structure-a11y.test.ts` (16 tests, structure DOM via
  render-to-string) reste vert sans modification.
- `EX-SCR-112` (bande 72 px en large) : en régime ≥ 768 px la cible passe à 32 px (< 72 px), la
  bande n'a pas besoin de grandir.
- `EX-SCR-135` (bande 96 px, 4 lignes, en compact) : le `min-height: 96px` du CSS n'est pas modifié
  (`tests/review/D6/responsive.test.ts` vérifie littéralement cette valeur dans la feuille, vert) ;
  en revanche, la cible de 44 px dans la première ligne de la grille compacte (« cmp row1 ») peut
  pousser le **rendu réel** de cette ligne au-delà de sa hauteur naturelle (~20 px de texte) — c'est
  un plancher (`min-height`), pas une hauteur fixe, et le texte se replie déjà (viewport 360 px)
  bien au-delà de 96 px avant même ce correctif ; voir §6 « hors périmètre » pour la mesure exacte
  non prise.
- `EX-SCR-117` (bande entière cliquable → écran B) : intact, le `role="button"` n'a pas bougé.

Diff complet : `git show 8f17b37` dans le worktree.

## 4. Correction de sonde (D-31) — `tests/e2e/finition-2.10.spec.ts`, test ACC-08 uniquement

**Justification** (voir aussi §2) : le test mesurait un état transitoire dépendant du timing relatif
entre `open()` (qui ne garantit que la première carte-marque) et l'arrivée différée des
zones-modèles (`loadAllModels`). Ni avant ni après `fixture-perf` ce timing n'était contractuel :
la sonde ne testait donc pas un état d'écran garanti, elle testait une course. La correction retenue
(commentaire d'en-tête ajouté dans le fichier, citant C-R1-03/D-31) : attendre qu'au moins une
`.kycar-market-zone-compare` existe, PUIS que ce nombre soit stable pendant 300 ms, avant de
mesurer — sans toucher à aucun seuil (44/32 px, gouttières 16/20/24, rayon 4).

```ts
await page.waitForFunction(
  () => document.querySelectorAll('.kycar-market-zone-compare').length > 0,
  null, { timeout: 60_000 },
);
await page.waitForFunction(
  () => {
    const w = window as unknown as { __acc08LastCount?: number; __acc08StableSince?: number };
    const n = document.querySelectorAll('.kycar-market-zone-compare').length;
    const now = Date.now();
    if (w.__acc08LastCount !== n) { w.__acc08LastCount = n; w.__acc08StableSince = now; return false; }
    return now - (w.__acc08StableSince ?? now) >= 300;
  },
  null, { timeout: 60_000 },
);
```

`tests/e2e/_helpers.ts` n'a pas été modifié (d'autres tests en dépendent, hors mandat). Aucun autre
test d'`ACC-08` ni d'un autre fichier n'a été touché.

## 5. Preuves

| # | Commande (depuis le worktree) | Sortie résumée | Verdict |
|---|---|---|---|
| 1 | `npm run build` | `tsc` app + worker 0 erreur, `vite build` OK (384 Ko / gzip 124 Ko) | PASS |
| 2 | `npm run lint` | `eslint .` — code de sortie 0, aucune sortie | PASS |
| 3 | `npx vitest run src/screens/market --no-file-parallelism` | 7 fichiers, 151 tests, tous verts | PASS |
| 4 | `npx vitest run --config vitest.review.config.ts tests/review/D6 --no-file-parallelism` | 16 fichiers, 106 tests, tous verts (dont `structure-a11y.test.ts` 16/16, `responsive.test.ts` 6/6) | PASS |
| 5 | `KYCAR_E2E_PORT=4181 npx playwright test -g "ACC-08"` | desktop : gouttière 24 px, rayon min 4 px, **0 cibles sur 291 sous 32 px** · tablet : gouttière 20 px, **0 cibles sur 291 sous 32 px** · mobile : gouttière 16 px, **0 cibles sur 211 sous 44 px**. 3 passed | PASS (sonde du constat, non modifiée dans ses seuils, D-31 seul changement) |
| 6 | `KYCAR_E2E_PORT=4181 npx playwright test tests/e2e/a11y.spec.ts -g "surface A"` | axe — A /marche : 0 violation, sur desktop/tablet/mobile | PASS |
| 7 | `KYCAR_E2E_PORT=4181 npx playwright test -g "ACC-06\|EX-SCR-118\|comparer\|Comparer" --project=mobile` | axe surface C 0 violation ; ACC-06 **skipped** (test.skip natif, régime compact hors périmètre du parcours brossage) ; 2 tests EX-SCR-118 (fourchette centrale) verts. Aucun test existant ne clique la case « Comparer » par sa classe — confirmé par `grep -rln "kycar-market-zone-compare\b" tests/e2e/*.ts` : seul `finition-2.10.spec.ts` la référence | PASS / RAS |

Avant chaque run Playwright : `ss -ltnp | grep -E '4180|4181'` vide (confirmé deux fois, avant et
après la vague de captures). Après chaque run : `git checkout -- reports/e2e/results.json`, aucun
`vite preview` résiduel (`ps aux | grep -i "vite preview"` vide en fin de mission).

## 6. Captures (`reports/remediation-2.8/fix-screens-3/`, 4 PNG)

Écran A, requête `?priceto=20000` (DENSE_QUERY, garantit > 6 zones/marque), carte VOLKSWAGEN
dépliée :

- `avant-tablet.png` / `apres-tablet.png` (768×1024) — même code de production hors le correctif ;
  visuellement identiques (aucun affordance visible n'a été ajouté, seule la boîte cliquable
  invisible autour de la case grandit — c'est le point : la mesure ACC-08, pas l'apparence, est ce
  qui change).
- `avant-mobile.png` / `apres-mobile.png` (360×740) — idem, régime compact (grille 4 lignes).

Ces captures ne montrent donc pas de différence visuelle perceptible (attendu : correctif de zone
cliquable invisible) ; la preuve de l'agrandissement de cible est la mesure ACC-08 (§5, ligne 5).

## 7. Hypothèses (E4)

- H1 : l'agrandissement de la cible n'a pas besoin d'affordance visuelle nouvelle (pas de fond, pas
  de bordure) — le mandat autorisait explicitement une boîte invisible faisant seulement grandir la
  zone cliquable ; retenu pour rester au plus près du rendu existant et ne rien changer côté design
  visuel non demandé.
- H2 : `align-self: center` sur `.kycar-market-zone-compare-target` (régime large/intermédiaire,
  layout flex) est un choix esthétique non prescrit par le mandat — l'ancien `margin-top: 3px`
  alignait grossièrement la case sur la première ligne de texte ; avec une cible de 32 px la
  centrer verticalement dans la bande de 72 px minimum est visuellement plus stable qu'un
  alignement au sommet. Aucune sonde ne porte sur ce détail.
- H3 : le déplacement du `title` (tooltip « 4 modèles au maximum… ») de l'`<input>` vers le
  `<label>` englobant est considéré comme une amélioration cohérente avec l'agrandissement de la
  cible (tooltip visible sur toute la zone, pas seulement 13 px) — aucune sonde ne teste sa
  position exacte.

## 8. Hors périmètre / pour le coordinateur

- **Croissance de bande en régime compact** : la première ligne de la grille compacte
  (« cmp row1 ») doit désormais accueillir une cible de 44 px alors que le texte seul y tenait en
  ~20 px ; le `min-height: 96px` (plancher, EX-SCR-135) n'est pas modifié et sa présence textuelle
  reste vérifiée par la sonde, mais le rendu réel de la bande peut dépasser 96 px de quelques
  dizaines de pixels sur cette carte. Je n'ai pas mesuré la hauteur rendue exacte (hors mandat,
  aucune sonde ne la contraint numériquement) ; à 360 px de large le texte des fourchettes se replie
  déjà sur plusieurs lignes et dépasse fréquemment 96 px avant même ce correctif — la variation
  ajoutée par la cible tactile est donc mineure au regard de cette variance préexistante, mais je le
  signale explicitement plutôt que de trancher moi-même que c'est négligeable.
- **Autres cibles sous seuil révélées par l'attente déterministe** : avec la correction de sonde
  D-31, ACC-08 mesure maintenant réellement les zones-modèles sur les trois régimes, et ne relève
  aucune cible sous seuil (voir preuve #5, `0 cibles sur 291/211`) — donc aucune AUTRE cible sous
  seuil n'a été découverte par ce changement de fenêtre de mesure, au-delà de la case Comparer déjà
  corrigée. Rien à signaler ici.
- **Aucun test e2e existant n'exerce le clic fonctionnel de la case « Comparer »** (bascule de
  sélection, capacité 4 modèles) — confirmé par grep, voir preuve #7. Si le coordinateur souhaite
  une couverture e2e du clic (comportement, pas seulement la géométrie), c'est un ajout hors du
  mandat de ce lot.
- **`ACC-06` reste `test.skip`** sur mobile (comportement du test lui-même, antérieur à ce lot,
  scope brossage 2D restreint à des régimes non compacts) — non touché, non lié à C-R1-03.

## 9. Statut

Les deux corrections (produit + sonde) sont commitées dans le worktree `fix35/screens` :

- `8f17b37` — Enlarge the model-zone compare checkbox touch target (C-R1-03, EX-SCR-21)
- `d716ed1` — Fix ACC-08 to wait for a deterministic model-zone state (D-31, C-R1-03)

`git status` propre en fin de mission (hors ce rapport et les captures, ajoutés au commit suivant
par le coordinateur ou par moi selon consigne — laissés en staged `A` dans ce worktree).
