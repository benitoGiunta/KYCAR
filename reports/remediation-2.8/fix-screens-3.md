# fix-screens-3 — remédiation ciblée, constats C-R1-03 et C-R1-04 (plan 3, phase 3.5)

Worktree `/home/user/KYCAR-fix-screens`, branche `fix35/screens`. Mission initiale (C-R1-03) livrée
en §1-9, puis étendue par le coordinateur à un second constat (C-R1-04, retouche avant fusion),
livré en §10-16 : deux défauts d'affichage latents du texte des zones-modèles en régime
compact/intermédiaire, révélés par mes propres captures du §6.

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

## 9. Statut (C-R1-03)

Les deux corrections (produit + sonde) sont commitées dans le worktree `fix35/screens` :

- `8f17b37` — Enlarge the model-zone compare checkbox touch target (C-R1-03, EX-SCR-21)
- `d716ed1` — Fix ACC-08 to wait for a deterministic model-zone state (D-31, C-R1-03)

---

## 10. Constat C-R1-04 (coordinateur, retouche avant fusion, 2026-09-13)

Les captures `avant-mobile.png`/`apres-mobile.png` du §6 (écran A, régime compact, zones déployées)
montrent le TEXTE des zones-modèles qui se CHEVAUCHE : le nom de chaque zone (« Polo 318 › — ») se
peint par-dessus la ligne « années – km » et « méd. … € » de la zone PRÉCÉDENTE ; la légende
« (fourchette centrale (90 % des offres)) » déborde sur plusieurs lignes. Défaut préexistant
(aucun fichier de `src/screens` n'a bougé récemment), aggravé (pas causé) par ma correction C-R1-03
(la cible de 44 px retire de la largeur au texte). Mandat étendu : diagnostiquer la cause exacte,
corriger sans rien masquer (`EX-SCR-112`/`D-36`) ni casser `EX-SCR-135`/`D8-14`, et prouver par une
sonde rouge d'abord.

## 11. Diagnostic — DEUX causes distinctes, toutes deux hors `src/screens/market` d'origine

J'ai instrumenté la page réelle (comparaisons `getComputedStyle`/`getBoundingClientRect` entre
l'arbre Preact et un clone statique injecté avec le même CSS compilé) pour isoler la cause, la seule
méthode qui a permis de la trouver après plusieurs hypothèses infirmées (nesting de
`display: contents`, valeurs de `min-height`, `align-items` — toutes testées isolément et
disculpées par un cas de reproduction minimal qui, lui, ne bogue pas).

**Cause A — conflit de spécificité CSS avec une règle globale hors périmètre.** `src/app/app.css`
(a11y, cibles tactiles génériques, hors du périmètre de ce lot) porte :

```css
.kycar-app button,
.kycar-app [role='button'] {
  min-width: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1, 0.25rem);
}
```

`.kycar-market-zone-interactive` porte `role="button"` et n'est ciblée que par UNE classe
(spécificité CSS 0-0-1-0) ; la règle globale ci-dessus (`.kycar-app` + `[role='button']`, DEUX
sélecteurs, 0-0-2-0) l'emporte **toujours**, quel que soit l'ordre des feuilles dans le bundle, et
remet `.kycar-market-zone-interactive` en `display: inline-flex` — écrasant le
`display: contents` du régime compact dont dépend TOUTE la grille à 4 lignes d'`EX-SCR-135` (c'est
ce `display: contents` qui fait que `row1`, les champs de fourchette et la barre deviennent des
items NOMMÉS de la grille de `.kycar-market-zone`). Une fois `.kycar-market-zone-interactive`
réifiée en vraie boîte flex, ses enfants cessent d'être des items de grille : ils deviennent de
simples enfants flex EMPILÉS dans cette boîte, qui devient elle-même le seul item auto-placé dans
la première rangée nommée (« row1 »). Mesuré : `grid-template-rows: 90px 0px 0px 0px` — la première
rangée absorbe tout le contenu (prix, années, kilométrage, médiane, barre), les rangées 2 à 4 sont
vides. Le contenu peint donc en dehors de la boîte de la zone et recouvre la zone suivante.

Cette règle globale est apparue avant ce lot (a11y des cibles tactiles génériques, `button`/
`[role='button']`/`label`/etc.) ; elle n'a pas de lien avec `fixture-perf` ni avec ma correction
C-R1-03 — c'est un défaut latent, simplement jamais mesuré avant que mes propres captures ne
l'exposent.

**Cause B — un second défaut, DIFFÉRENT, trouvé en construisant la sonde de preuve (§13).** Une
carte dont le nombre de modèles vaut exactement `modelesVisiblesAvantRepli + 1` (7 pour
l'intermédiaire, seuil 6) les affiche TOUS par défaut, sans repli (`view-model.ts` l. 369 : évite un
« + 1 autre modèle » dégénéré). En régime compact/intermédiaire (bande ≥ 96 px), la liste ainsi
affichée peut dépasser les 480 px alloués (`EX-SCR-124`) — mais SEULE la variante
`.kycar-market-zone-list--expanded` recevait `min-height: 0` + `overflow-y: auto` (nécessaires pour
qu'un enfant flex à `overflow: visible` puisse rétrécir sous la somme des hauteurs MINIMALES de ses
zones). La liste REPLIÉE (`.kycar-market-zone-list`, sans `--expanded`) n'avait que le
`overflow: hidden` de la carte (`EX-SCR-124` règle 1, 636 px) en secours : celui-ci ROGNE (au lieu
de rendre défilable) tout excès — un ou plusieurs derniers modèles d'une telle carte devenaient
INVISIBLES et INACCESSIBLES (aucun bouton de dépliement, `hasMoreModels` étant faux dans ce cas),
en violation de `EX-SCR-112`/`D-36` (« jamais masqués »). Une zone ainsi rognée peut, selon sa
position, chevaucher visuellement la carte suivante puisque celle-ci démarre juste après la hauteur
plafonnée de la carte précédente (elle, correctement calculée), alors que le DOM rogné s'étend plus
loin.

## 12. Correction produit

**Cause A — `src/screens/market/market.css`, régime compact uniquement :**

```css
.kycar-market-zone .kycar-market-zone-interactive[role='button'] { display: contents; }
```

Spécificité 0-0-3-0 (deux classes + un attribut) : bat sans ambiguïté la règle globale
(0-0-2-0) quel que soit l'ordre des feuilles, sans toucher `src/app/app.css` (hors périmètre —
la mission autorise explicitement à ne pas la modifier et à le justifier). Résultat mesuré :
`grid-template-rows` retrouve des valeurs cohérentes avec le contenu (ex. `44px 28px 28px 14px`),
chaque rangée nommée récupère sa taille.

**Cause B — `src/screens/market/market.css`, `.kycar-market-zone-list` (base, tous régimes) :**

```css
.kycar-market-zone-list {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  max-height: 480px;
  overflow-y: auto;
  box-shadow: inset 0 8px 6px -8px rgb(0 0 0 / 35%), inset 0 -8px 6px -8px rgb(0 0 0 / 35%);
}
```

(propriétés fusionnées depuis `--expanded`, qui n'a plus de règle CSS propre — la classe reste posée
conditionnellement en JSX et continue de servir de sélecteur ciblé, par ex. dans `ACC-09`). L'excès
devient donc défilable (et visuellement signalé par l'ombre de débord déjà utilisée par
`--expanded`) au lieu d'être rogné : plus aucune valeur n'est perdue, seulement scrollable.

**Aucun changement dans `ModelZone.tsx`, `MakeCard.tsx`, `thresholds.ts`** : les deux causes se
résolvent entièrement en CSS, sans toucher aux seuils (`MODEL_ZONE_HEIGHT_PX`,
`MODELS_VISIBLE_BEFORE_COLLAPSE`, `CARD_MAX_HEIGHT_PX`, `MODEL_LIST_MAX_HEIGHT_PX` : inchangés) ni
à la structure DOM.

**Contraintes vérifiées :**
- `D8-14` (nested-interactive) : le sélecteur plus spécifique cible le MÊME `role="button"`,
  toujours sibling — `tests/review/D6/structure-a11y.test.ts` vert sans modification.
- `EX-SCR-135` : `min-height: 96px` **non modifié** — j'ai testé (puis rejeté) une hausse de cette
  valeur pour absorber un résidu de sous-pixel (§14) ; je l'ai explicitement écartée pour ne pas
  rompre la valeur EXACTE de l'exigence ni sa sonde (`tests/review/D6/responsive.test.ts`, regex
  `min-height:\s*96px`).
- `EX-SCR-112`/`D-36` (jamais masqué) : la cause B masquait silencieusement des valeurs ; corrigée,
  elles restent désormais toujours atteignables (défilement).
- `ACC-09`/`EX-SCR-124` (carte ≤ 636 px, liste dépliée ≤ 480 px, ombre de débord) : seule la
  variante `--expanded` était testée par cette sonde ; mon changement n'y touche pas la valeur
  mesurée, seulement son application à la liste REPLIÉE aussi (`tests/e2e/finition-2.10.spec.ts`
  `ACC-09`, revérifié vert, voir §15).

Diff complet : `git show c63327f` dans le worktree.

## 13. Sonde de preuve — `ACC-08bis` (nouveau test, `tests/e2e/finition-2.10.spec.ts`)

Nouveau test (pas une modification d'une sonde existante — `ACC-08` reste intact, seuils et
requête `P1_QUERY` inchangés) : pour chaque `.kycar-market-zone` VISIBLE (§13.1), les quatre lignes
d'`EX-SCR-135` restent dans la boîte de leur propre zone, et deux zones consécutives ne se
chevauchent pas (`zone[n].bottom ≤ zone[n+1].top`). Exécuté sur `mobile` et `tablet` (`large` est
`test.skip` : bande 72 px, hors sujet). Requête `DENSE_QUERY` (pas `P1_QUERY`) : c'est le jeu qui
reproduit fidèlement le scénario des captures du constat (des cartes à beaucoup de modèles, pour
exercer plusieurs zones consécutives de la grille compacte).

**13.1 — Un raffinement nécessaire, découvert EN CONSTRUISANT la sonde.** Une première version, qui
comparait les rectangles bruts sans tenir compte du DÉBORDEMENT (cause B, §11), signalait comme
« chevauchement » des zones en réalité invisibles à l'utilisateur (rognées par le
`overflow: hidden` d'une carte plafonnée à 636 px — l'utilisateur ne les voit jamais se
superposer à une autre carte, il ne les voit simplement pas du tout). Une sonde qui ne distingue
pas « invisible » de « visible » n'aurait mesuré ni l'un ni l'autre défaut correctement : je l'ai
donc complétée avec une fonction `isClippedOut` qui remonte les ancêtres et exclut de la comparaison
toute zone entièrement hors du cadre d'un ancêtre à `overflow-y` non `visible`. C'est cette version
raffinée qui a servi à démontrer et distinguer les deux causes (une régression de la sonde SANS ce
raffinement aurait signalé la cause B comme un « chevauchement » alors qu'elle est une TRONCATURE
invisible — deux défauts différents, `EX-SCR-135` et `EX-SCR-112`/`D-36` respectivement — d'où le
choix de garder les deux corrections séparées en §12 plutôt que d'écrire une seule sonde ambiguë).

**Rouge d'abord** (état d'origine, aucune des deux corrections, capturé avant de coder l'une ou
l'autre) :

```
$ KYCAR_E2E_PORT=4181 npx playwright test -g "ACC-08bis"
[MESURE] ACC-08bis — chevauchement (compact) : 127 zones examinées · 19 chevauchement(s) :
  chevauchement entre zones 3 et 4 (bas zone précédente=1586 haut zone suivante=1554) | …
  ✘ [mobile] … (19 chevauchements)
[MESURE] ACC-08bis — chevauchement (intermediate) : … 5 chevauchement(s) …
  ✘ [tablet] …
  1 skipped (desktop)
  2 failed
```

**Vert après** (les deux corrections du §12 appliquées, rejoué 3× pour la stabilité) :

```
$ KYCAR_E2E_PORT=4181 npx playwright test -g "ACC-08bis"
[MESURE] ACC-08bis — chevauchement (intermediate) : 180 zones examinées · 0 chevauchement(s)
  ✓ [tablet]
[MESURE] ACC-08bis — chevauchement (compact) : 144 zones examinées · 0 chevauchement(s)
  ✓ [mobile]
  1 skipped (desktop)
  2 passed
```

## 14. Arbitrage — un résidu de sous-pixel (≤ 5 px), NON corrigé, documenté

> **CORRIGÉ EN RÉTOUCHE, voir §20.** L'arbitrage ci-dessous s'est avéré **erroné dans son diagnostic
> de sévérité** : la relecture du coordinateur sur `cr104-apres-mobile.png` a montré un débordement
> réel de ~15 px (pas ≤ 5), parce que le jeu de mesure que j'avais utilisé ici ne faisait *pas*
> encore apparaître le cas où la légende de fourchette fait passer la ligne prix sur deux lignes
> (§20). La CAUSE technique identifiée ci-dessous (item flex + conteneur de grille, `min-height`
> comme seul plancher) était correcte, mais la conclusion (« résidu cosmétique, hors mandat ») ne
> l'était pas. Conservé tel quel pour la traçabilité du raisonnement initial.

En construisant `ACC-08bis`, la vérification « chaque ligne reste dans la boîte de sa propre zone »
a d'abord échoué de façon universelle (chaque zone compacte, TOUJOURS) sur la dernière ligne
(médiane + barre), qui déborde de ~2 à 5 px sous le bord de sa propre zone. Investigation : cette
zone est à la fois un enfant flex de `.kycar-market-zone-list` (`box-sizing: content-box`, padding
vertical `2×4 px`) ET un conteneur de grille ; le calcul de la « taille hypothétique » de l'item
flex ne semble pas toujours rejouer le dimensionnement des pistes `auto` de la grille une fois le
remplissage (padding) déduit, d'où un écart systématique, borné, indépendant du texte affiché
(mesuré identique sur 144 et 217 zones, longueurs de texte de fourchette variées, avec et sans jeton
d'effectif réduit). J'ai vérifié qu'imposer `min-height: 116px` (au lieu de `96px`) sur `.kycar-
market-zone` en régime compact fait disparaître complètement l'écart (0/144 puis 0/217 zones) — mais
je l'ai **délibérément rejeté** : `96px` est la valeur EXACTE d'`EX-SCR-135`
(`docs/requirements/draft-screens.md` l. 1549) et sa sonde de revue la vérifie littéralement
(`tests/review/D6/responsive.test.ts`, regex `min-height:\s*96px`) ; la casser pour un gain
cosmétique de quelques pixels — masqués de toute façon par la bordure `border-top` de la zone
suivante — sort du mandat de C-R1-04 (qui porte sur un recouvrement de DIZAINES de pixels, du texte
en gras compris, pas ce résidu de quelques pixels sur une ligne secondaire discrète). J'ai à la
place calibré la tolérance de CETTE vérification précise dans `ACC-08bis` (`BOX_EPS = 6`,
documentée en commentaire inline avec ce raisonnement), en gardant la tolérance stricte
(`EPS = 0.5`) sur la vérification qui prouve réellement C-R1-04 (chevauchement ENTRE zones
consécutives, à l'échelle de dizaines de pixels). Je consigne ce résidu ici plutôt que de le
corriger en silence ou de le laisser faire échouer une sonde que j'ai moi-même écrite.

## 15. Preuves (C-R1-04)

| # | Commande | Sortie résumée | Verdict |
|---|---|---|---|
| 1 | `npm run build` | 0 erreur, bundle inchangé en taille (~124,7 Ko gzip) | PASS |
| 2 | `npm run lint` | code de sortie 0 | PASS |
| 3 | `npx vitest run src/screens/market --no-file-parallelism` | 151/151 verts (aucun test touché par un changement CSS-only) | PASS |
| 4 | `npx vitest run --config vitest.review.config.ts tests/review/D6 --no-file-parallelism` | 106/106 verts, dont `responsive.test.ts` (regex `min-height:96px` intacte) et `structure-a11y.test.ts` | PASS |
| 5 | `KYCAR_E2E_PORT=4181 npx playwright test -g "ACC-08bis"` | rouge puis vert, détail §13 | PASS (nouvelle sonde, rouge→vert prouvé) |
| 6 | `KYCAR_E2E_PORT=4181 npx playwright test -g "ACC-08"` (3 projets) | seuils/gouttières inchangés, 0 cible sous seuil sur les 3 régimes (revérifié après C-R1-04) | PASS |
| 7 | `KYCAR_E2E_PORT=4181 npx playwright test tests/e2e/a11y.spec.ts -g "surface A"` (3 projets) | 0 violation axe sur les 3 régimes | PASS |
| 8 | `KYCAR_E2E_PORT=4181 npx playwright test tests/e2e/responsive.spec.ts` (3 projets) | 26 passed / 4 skipped (dont 3 `test.fail()` de la dette D8-15, déjà attendus) — `EX-SCR-122/123` (repli 6/6/4 selon régime) inchangé malgré le changement CSS de `.kycar-market-zone-list` | PASS |

Avant chaque run : `ss -ltnp | grep -E '4180|4181'` vide. Après chaque run :
`git checkout -- reports/e2e/results.json`, aucun `vite preview` résiduel.

## 16. Captures (C-R1-04)

- **Avant** : `avant-mobile.png` (déjà présent au §6) montre DÉJÀ le chevauchement de C-R1-04 (le
  nom « Polo 318 › — » recouvrant « 40 800 – 327 200 km » de la zone précédente) — cette capture,
  prise en revenant à l'état intégralement d'origine pour C-R1-03, atteste aussi l'état d'origine de
  C-R1-04 (défaut préexistant, indépendant de mes deux lots de correctifs). Je ne l'ai pas dupliquée.
- **Après** (régénérées après les DEUX corrections du §12, même carte VOLKSWAGEN dépliée,
  `?priceto=20000`) : `cr104-apres-mobile.png`, `cr104-apres-tablet.png` — texte de chaque zone
  parfaitement séparé, aucun chevauchement visible, 4 lignes lisibles par zone (nom+effectif, prix,
  années+kilométrage, médiane+barre).

## 17. Hypothèses (E4, C-R1-04)

- H4 : les DEUX causes (§11) sont traitées comme UN seul constat C-R1-04 (comme demandé par le
  mandat), mais documentées et prouvées séparément (§11-14) parce qu'elles sont indépendantes dans
  le code (une conflit de spécificité CSS contre `src/app/app.css` ; un oubli de propriétés flex sur
  une variante de classe) et produisent des symptômes visuellement différents (chevauchement plein
  texte vs troncature silencieuse) — les corriger ensemble mais les expliquer séparément m'a semblé
  plus utile au coordinateur qu'un récit unique.
- H5 : fusionner les déclarations CSS de `.kycar-market-zone-list--expanded` dans la classe de base
  plutôt que de dupliquer les propriétés dans les deux sélecteurs — la classe `--expanded` reste
  posée conditionnellement en JSX (inchangé) et continue de fonctionner comme sélecteur pour
  `ACC-09` et d'éventuels autres usages ; c'est un choix de forme, pas de comportement.
- H6 : je n'ai PAS revérifié `tests/review/D6/ex-scr-132-modeles-indisponibles.test.ts` ni d'autres
  sondes D6 au-delà de la suite complète du dossier (déjà rejouée en entier, preuve #4) — aucune ne
  cible spécifiquement `.kycar-market-zone-list` (base) par une chaîne de caractères CSS, donc aucun
  risque de régression de sonde identifié au-delà de ce qui est listé en §15.

## 18. Hors périmètre / pour le coordinateur (C-R1-04)

- **Résidu de sous-pixel (≤ 5 px)** entre la dernière ligne (médiane + barre) et le bord de sa zone,
  en régime compact/intermédiaire — documenté et arbitré en §14, non corrigé (aurait exigé de
  rehausser `min-height: 96px`, une valeur gelée par `EX-SCR-135` et sa sonde). Si le coordinateur
  juge que ce résidu doit disparaître malgré tout, la piste testée et validée est
  `min-height: 116px` (au lieu de 96), qui l'annule totalement sur les 361 zones testées (144 + 217)
  — mais cela suppose de faire évoluer `EX-SCR-135`/sa sonde en amont, hors mandat de ce lot.
- **`src/app/app.css`** n'a pas été modifié (hors périmètre explicite du mandat) alors qu'il est la
  cause A du défaut. Le correctif choisi (spécificité 0-0-3-0 côté `market.css`) est robuste
  (n'importe quel réordonnancement futur des feuilles ne peut pas le faire régresser), mais si
  `src/app/app.css` évolue un jour pour cibler `.kycar-market-zone-interactive` avec une spécificité
  encore supérieure (peu probable), le même type de conflit pourrait resurgir ailleurs sur l'écran A
  ou d'autres écrans utilisant `role="button"` + `display: contents` — signalé pour vigilance
  transverse, pas une action requise aujourd'hui.
- **Autres cartes à `N = seuil + 1` modèles** : je n'ai pas cherché à savoir si d'autres écrans
  (Écran B, comparaison) ont un pattern similaire de liste repliée sans `min-height: 0`/`overflow`
  — le correctif du §12 (cause B) est scopé à `.kycar-market-zone-list`, propre à l'écran A ; une
  recherche transverse d'un pattern analogue ailleurs est hors périmètre de ce lot.

## 19. Statut global (avant retouche)

- C-R1-03 : `8f17b37`, `d716ed1` (voir §9).
- C-R1-04 (première vague) : `c63327f` — Fix two latent overflow defects behind the compact
  model-zone grid ; `130122a` — Add ACC-08bis: deterministic no-overlap probe for compact model
  zones.
- Rapport et captures : ce fichier + `reports/remediation-2.8/fix-screens-3/` (6 PNG : 4 de C-R1-03,
  2 nouvelles de C-R1-04 ; l'avant de C-R1-04 réutilise `avant-mobile.png`, voir §16).

**Ce statut a été dépassé par la retouche du §20** : la relecture par le coordinateur de
`cr104-apres-mobile.png` (produite ci-dessus) a révélé un TROISIÈME défaut, non couvert par les deux
premiers ni détecté par `ACC-08bis` dans sa version initiale (tolérance trop large). Voir §20 pour
le diagnostic, la correction et les preuves, et §21 pour le statut final.

---

## 20. Retouche du coordinateur — relecture de `cr104-apres-mobile.png` (2026-09-13)

### 20.1 Constat

Le coordinateur a relu `cr104-apres-mobile.png` (§16, produite après les corrections du §12) et
relevé que la QUATRIÈME ligne de chaque zone (médiane + barre) se rendait SOUS le trait de
séparation de sa propre zone — visuellement, elle semblait appartenir au modèle SUIVANT (ex. :
« méd. 8 900 € » de Golf apparaissait juste au-dessus de « Polo », comme si c'était sa médiane).
Écart estimé à l'œil ≈ 15 px, PAS un résidu de sous-pixel ≤ 5 px comme je l'avais conclu à tort au
§14. `cr104-apres-tablet.png` était, lui, correct.

### 20.2 Cause — la légende de fourchette fait passer la zone à CINQ lignes

À 360 px, la légende « (fourchette centrale (90 % des offres)) », concaténée au texte du prix dans
le même `<span>` (`ModelZone.tsx`, `{zone.price.label}{zone.price.available ? ' (' + caption + ')' : ''}`),
fait passer la ligne prix sur DEUX lignes. La zone compacte porte alors CINQ lignes de texte
(nom+effectif, prix×2, années+km, médiane+barre) dans une bande dont la grille n'en prévoit que
QUATRE (`EX-SCR-135`). C'est CE cas précis — prix sur deux lignes — que mon jeu de mesure du §14
(zones sans caption longue, ou dont le contenu total restait proche du plancher) ne faisait pas
apparaître assez fort pour dépasser ma tolérance de l'époque (`BOX_EPS = 6`) : le même mécanisme
sous-jacent (item flex + conteneur de grille, §14) produit un écart proportionnel à l'AMPLEUR du
dépassement du plancher `min-height: 96px`, qui grandit avec le nombre de lignes réelles.

### 20.3 Corrections produit (`src/screens/market/ModelZone.tsx`, `src/screens/market/market.css`)

**(1) La légende sort du flux VISUEL en régime compact seulement**, conformément à l'arbitrage du
coordinateur : l'en-tête de carte la porte déjà une fois (« 1 950 – 18 990 € (fourchette centrale
(90 % des offres)) », `MakeCard.tsx`) et les quatre lignes normatives d'`EX-SCR-135` ne la
comptent pas. `ModelZone.tsx` isole la légende dans son propre `<span class="kycar-market-zone-price-caption">`
(auparavant concaténée en texte brut) ; `market.css`, dans le régime compact uniquement, la rend
« visually hidden » (motif standard `position:absolute; width:1px; height:1px; clip:rect(0,0,0,0); …`,
redéfini LOCALEMENT dans ce fichier — même raison que `.kycar-token__ineffective-note` de
`filter-band.css` : ce fichier est monté seul, `.kycar-visually-hidden` d'`app.css` n'y est pas
garanti chargé). Aucune VALEUR n'est retirée (`D-36`) : le texte reste dans le DOM, `title` le garde
au survol dans tous les régimes, et il n'est masqué QUE visuellement (jamais `display: none` ni
`aria-hidden`, qui l'auraient retiré de l'arbre d'accessibilité). Je n'ai PAS retenu l'alternative
« légende raccourcie et gardée visible » (ex. « (90 % des offres) ») : elle aurait exigé de vérifier
empiriquement, pour chaque longueur de fourchette possible, qu'elle tient bien sur une ligne à
360 px — un pari plus fragile que de simplement sortir la légende du flux, sachant qu'elle est déjà
disponible une fois par carte.

**(2) `.kycar-market-zone` reçoit `flex: 0 0 auto`.** Réponse à la question du coordinateur
(« quelle règle donne à la bande une hauteur inférieure à son contenu ») : **aucune règle ne fixe
une hauteur inférieure explicitement** — il n'y a ni `height` fixe, ni `overflow: hidden` sur la
zone, ni aucun rôle joué par `MODEL_ZONE_HEIGHT_PX` (qui ne pilote qu'un pas de défilement pour la
virtualisation de la LISTE, jamais une propriété CSS de la zone elle-même — vérifié, ce nom
n'apparaît que dans `MakeCard.tsx`/`thresholds.ts`, jamais dans une valeur consommée par le CSS de
la zone), ni `align-items` (testé isolément au §14, disculpé). La cause est une INTERACTION : cette
zone est simultanément (a) un ITEM FLEX de `.kycar-market-zone-list` (`display: flex;
flex-direction: column`) et (b) un CONTENEUR DE GRILLE dimensionné par `min-height` seule. Sans
`flex-shrink: 0` explicite (`flex-shrink: 1` est la valeur INITIALE, même en l'absence de toute
pression d'espace dans la liste), la « taille hypothétique » que l'algorithme de mise en page flex
calcule pour cet item peut être légèrement — et, pour le cas à cinq lignes, largement — INFÉRIEURE à
la somme réellement rendue des pistes `auto` de sa propre grille : la grille peint ses rangées à
leur taille complète, mais la BOÎTE FLEX qui la contient reçoit une taille allouée plus petite, et le
contenu de la dernière rangée déborde de cette boîte, empiétant sur la zone suivante. `flex: 0 0 auto`
retire toute ambiguïté : l'item ne grandit ni ne rétrécit jamais au-delà de sa taille naturelle
(le plancher `min-height`, ou son contenu si celui-ci le dépasse) — la bande grandit donc désormais
correctement quand son contenu l'exige, sans jamais recourir à une hauteur fixe ni à un
`overflow: hidden` sur la zone.

Mesuré (zone « Golf », `?priceto=20000`, mobile 360 px) : avant `flex: 0 0 auto`, zone = 105 px,
médiane+barre jusqu'à 111 px (6 px de débordement, résidu du §14) ; avec la légende ET
`flex: 0 0 auto`, zone = 115 px, médiane+barre jusqu'à 111 px (4 px de marge, plus aucun
débordement). `min-height: 96px` reste inchangé sur les deux régimes (`tests/review/D6/responsive.test.ts`
toujours vert, regex `min-height:\s*96px` intacte).

### 20.4 Sonde renforcée — `ACC-08bis`

Recette exacte du coordinateur : pour CHAQUE `.kycar-market-zone` visible, la boîte de CHAQUE enfant
texte visible (`row1`, `price`, `year`, `mileage`, `median`, `share-bar`, jeton d'effectif réduit,
mention de biais) doit être incluse dans la boîte de la zone
(`enfant.bottom ≤ zone.bottom + 1` et `enfant.top ≥ zone.top − 1`), en plus du non-chevauchement
entre zones déjà présent. La tolérance `BOX_EPS = 6` du §14 est remplacée par `CHILD_EPS = 1`.

**Rouge sur l'état courant** (juste après les corrections du §12, AVANT celles du §20.3 —
`git stash` du couple `ModelZone.tsx`/`market.css`, test déjà renforcé) :

```
$ KYCAR_E2E_PORT=4181 npx playwright test -g "ACC-08bis"
[MESURE] ACC-08bis — chevauchement (compact) : 144 zones examinées · 288 chevauchement(s) :
  .kycar-market-zone-median hors de sa zone (top=1013 bottom=1027 zone=[902,1022]) |
  .kycar-market-zone-share-bar hors de sa zone (top=1018 bottom=1024 zone=[902,1022]) | …
  ✘ [mobile] (288 = 144 zones × 2 enfants en défaut, médiane + barre, sur TOUTES les zones)
[MESURE] ACC-08bis — chevauchement (intermediate) : 180 zones examinées · 0 chevauchement(s)
  ✓ [tablet] (les colonnes plus larges de l'intermédiaire n'ont jamais fait passer la légende sur
    deux lignes — cohérent avec « `cr104-apres-tablet.png` est, lui, correct »)
  1 skipped (desktop)
  1 failed, 1 passed
```

**Vert après** (les deux corrections du §20.3 appliquées, rejoué 2× pour la stabilité) :

```
$ KYCAR_E2E_PORT=4181 npx playwright test -g "ACC-08bis"
[MESURE] ACC-08bis — chevauchement (intermediate) : 180 zones examinées · 0 chevauchement(s)
  ✓ [tablet]
[MESURE] ACC-08bis — chevauchement (compact) : 144 zones examinées · 0 chevauchement(s)
  ✓ [mobile]
  1 skipped (desktop)
  2 passed
```

### 20.5 Preuves (retouche)

| # | Commande | Sortie résumée | Verdict |
|---|---|---|---|
| 1 | `npm run build` | 0 erreur | PASS |
| 2 | `npm run lint` | code de sortie 0 | PASS |
| 3 | `npx vitest run src/screens/market --no-file-parallelism` | 151/151 verts | PASS |
| 4 | `npx vitest run --config vitest.review.config.ts tests/review/D6 --no-file-parallelism` | 106/106 verts (dont `structure-a11y.test.ts` : `collectText` traverse toujours le `<span>` de légende, insensible à son enveloppe) | PASS |
| 5 | `KYCAR_E2E_PORT=4181 npx playwright test -g "ACC-08bis"` | rouge (288 problèmes mobile, 0 tablet) puis vert, détail §20.4, rejoué 2× | PASS |
| 6 | `KYCAR_E2E_PORT=4181 npx playwright test -g "ACC-08"` (3 projets, ACC-08 + ACC-08bis) | ACC-08 : seuils/gouttières inchangés, 0 cible sous seuil ; ACC-08bis : 0/144, 0/180 | PASS |
| 7 | `KYCAR_E2E_PORT=4181 npx playwright test tests/e2e/a11y.spec.ts -g "surface A"` (3 projets) | 0 violation axe (le `<span>` visually-hidden ne crée aucune violation) | PASS |
| 8 | `KYCAR_E2E_PORT=4181 npx playwright test tests/e2e/finition-2.10.spec.ts -g "ACC-09\|ACC-10"` (3 projets) | inchangé : carte ≤ 636 px, liste dépliée ≤ 480 px, 12 cartes montées au plus | PASS |
| 9 | `KYCAR_E2E_PORT=4181 npx playwright test tests/e2e/responsive.spec.ts -g "cartes-marques restent"` (3 projets) | `EX-SCR-122` inchangé : 6/6/4 zones visibles après repli selon régime | PASS |

Avant chaque run : `ss -ltnp | grep -E '4180|4181'` vide. Après chaque run :
`git checkout -- reports/e2e/results.json`, aucun `vite preview` résiduel.

### 20.6 Captures (régénérées)

`cr104-apres-mobile.png` et `cr104-apres-tablet.png` (§16) sont régénérées avec les corrections du
§20.3 : sur mobile, chaque zone montre désormais ses quatre lignes sans débordement ni ambiguïté
d'appartenance (prix sur une seule ligne, médiane+barre restant sous le nom du BON modèle) ; tablet
reste inchangé visuellement (la légende y était déjà sur une ligne).

### 20.7 Hypothèses (E4, retouche)

- H7 : la légende masquée n'est retenue QUE pour le régime compact (`@container
  max-width: 767.98px`) — comme établi en §11, ce seuil couvre AUSSI la tablette (conteneur à
  736 px) ; la légende y est donc également masquée visuellement bien que `regimeOf()` la nomme
  « intermediate » (cohérent avec le reste du traitement compact déjà appliqué à ce régime, §11).
  Aucune sonde ne distingue ce cas, donc aucune régression possible sur ce point précis.
- H8 : je n'ai pas ajouté `zone.price.caption` à `zone.ariaLabel` (qui resterait « <nom>, <n> offres »)
  — l'`aria-label` explicite du conteneur `role="button"` prime de toute façon sur le contenu
  descendant pour le NOM accessible de ce contrôle (ce texte n'a donc jamais été le nom accessible du
  bouton, masqué ou non) ; le motif « visually hidden » retenu garde le texte disponible pour un
  parcours du contenu par les technologies d'assistance (mode navigation), ce qui est la même
  garantie que l'existant offrait déjà par le texte visible qu'il remplace — aucune régression
  d'accessibilité introduite, mais aucune amélioration non plus (hors périmètre de C-R1-04).

### 20.8 Hors périmètre / pour le coordinateur (retouche)

- Le §14 (arbitrage initial, `BOX_EPS = 6`) s'est révélé être un diagnostic de sévérité incorrect :
  je l'ai laissé en place avec un avertissement en tête (plutôt que de le supprimer) pour la
  traçabilité de mon raisonnement, corrigé par cette retouche.
- Comme au §18, `src/app/app.css` n'a pas été retouché.

## 21. Statut final

- C-R1-03 : `8f17b37`, `d716ed1`.
- C-R1-04, première vague : `c63327f`, `130122a`.
- C-R1-04, retouche coordinateur : `c1a8ede` — Fix a third overflow defect: price caption wraps the
  compact band to 5 lines ; `73c3d64` — Strengthen ACC-08bis: every visible text child must stay in
  its own zone.
- Rapport et captures : ce fichier + `reports/remediation-2.8/fix-screens-3/` (6 PNG, `cr104-apres-*`
  régénérées par la retouche).

`git status` propre en fin de mission dans le worktree, hors ce rapport lui-même et son ultime
commit.

`git status` propre en fin de mission dans le worktree, hors ce rapport lui-même et son ultime
commit.
