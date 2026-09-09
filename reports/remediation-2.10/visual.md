# visual-2.10 — finition visuelle (dette D8-43)

| | |
|---|---|
| **Agent** | `visual-2.10` — modèle Opus. Effort **high** sur ACC-02, ACC-03, ACC-06 ; régime « Sonnet/high » (exécution bornée au constat, aucune re-conception) sur ACC-04, 07, 08, 09, 10, 11, 12, 13, 14, 16 |
| **Worktree** | `/home/user/kycar-wt/visual`, branche `fix210/visual`, `node_modules` symlinké (aucun `npm ci`/`install`) |
| **Entrée** | `reports/ACCEPTANCE.md` §8 (constats `ACC-02`…`ACC-16` en dette D8-43) et §3.4 (les 15 exigences « mesures au rendu ») |
| **Périmètre écrit** | `src/screens/`, `src/components/`, `src/app/app.css`, `src/screens/distribution/url-state.ts` (ACC-06), `tests/review/D6`, `tests/review/D7`, `tests/e2e/`, ce rapport. **Jamais** `src/app.tsx`, `src/orchestration/`, `src/providers/`, `src/engine/`, `src/state/`, `data/`, `tools/`, `docs/` |
| **Commits** | `61df9e2` (ACC-06) · `959d5fc` (ACC-02) · `3a342a8` (ACC-03, ACC-04) · `29b0b2c` (ACC-07 → ACC-16) · `dec9d6a` (cibles des liens + ce rapport) |
| **Bundle** | `npm run size` : **118,78 / 300 Kio** gzip d'entrée + worker (116,58 avant 2.10, **+2,20 Kio**), différé 0,00 / 400 Kio |

---

## 0. Verdict d'ensemble

**Douze constats traités, douze fermés.** `ACC-02`, `ACC-03`, `ACC-04`, `ACC-06`, `ACC-07`, `ACC-08`,
`ACC-09`, `ACC-10`, `ACC-11`, `ACC-12`, `ACC-13`, `ACC-14` sont corrigés et prouvés au rendu, sur le
build de production, dans les trois régimes. **`ACC-16` est corrigé à moitié** : la fonction de
libellé humain est écrite et éprouvée, le bandeau qui la consomme vit dans `src/app.tsx` — une ligne
de câblage est due à `mvp-integrate` (§6).

Deux écarts d'exigence sont **ratifiés plutôt que corrigés**, chacun motivé et nommé au §5 : la
couleur de l'anneau de focus (`ACC-11`) et le tracé de `G7` en régime compact (conséquence directe
d'`EX-SCR-181`, qui prime sur `EX-SCR-17`).

---

## 1. Tableau de bord

| Id | Exigence | Constat 2.9b | État | Preuve |
|---|---|---|---|---|
| `ACC-02` | `EX-SCR-56` | bandeau non collant (y = −1 029 après 1 200 px), 902 / 1 271 px replié | **CORRIGÉ** | 4 tests E2E ; replié 95 / 115 / 65 px, déplié 320 px, collé au bas de l'en-tête |
| `ACC-03` | `EX-SCR-181` | 129 / 148 / 122 px, en-tête 3 lignes, 14 étiquettes, G8 à 20, G7 tracé, aucun appui long | **CORRIGÉ** | 3 tests E2E ; 200 / 320 / 240 px, 5 lignes, 10 étiquettes max, G8 à 10, G7 non tracé, appui long |
| `ACC-04` | `EX-SCR-180` | G3 344 px, G4 366 px, légende superposée, G8 344 px | **CORRIGÉ** | 1 test E2E ; G3 704, G4 400 px, légende `static` sous le tracé, G8 704 |
| `ACC-06` | `EX-SCR-158`/`202`, `EX-CRUD-16` | 262 brossées → « 280 lignes », CSV à 280 | **CORRIGÉ** | 5 sondes D7 + 1 test E2E ; 673 brossées → 673 lignes → CSV de 673 lignes |
| `ACC-07` | `EX-SCR-178` | G1 = 1 246 pour Σ = 1 352, 87 exclusions nommées | **CORRIGÉ** | 1 test E2E ; 1 246 + 55 + 32 + 19 = 1 352 |
| `ACC-08` | `EX-SCR-21` | gouttière 16 px partout, rayon 0 px, 157/202 cibles sous 44 px | **CORRIGÉ** | 1 test E2E ; 16/20/24 px, rayon 4 px, **0** cible sous le seuil |
| `ACC-09` | `EX-SCR-124` | 356 zones montées, `box-shadow: none`, carte 688–699 px | **CORRIGÉ** | 1 test E2E ; 30 zones, ombres présentes, carte 636 px |
| `ACC-10` | `EX-SCR-127` | 180 cartes montées, 15 677 nœuds | **CORRIGÉ** | 1 test E2E ; 12 cartes, ~140 nœuds de grille, fenêtre suivant le défilement |
| `ACC-11` | `EX-SCR-87` | aucun survol, aucun état actif | **CORRIGÉ** (focus **ratifié**, §5.1) | 1 test E2E ; survol ≠ repos, coché = accent + texte inversé |
| `ACC-12` | `EX-SCR-186` | G9/G12/G13 monochromes, G8 sans divergence, G7 en alpha d'accent | **CORRIGÉ** | 1 test E2E ; 8 / 6 / 2 teintes, paire divergente dédiée, 29 teintes de rampe B sur G7 |
| `ACC-13` | `EX-SCR-25` | indicateur posé dès 105 ms pour un tick | **CORRIGÉ** (mode 1 : §6) | 1 test E2E + 1 sonde D6 ; aucun indicateur sur 600 ms de repos, seuil = 150 ms déclaré |
| `ACC-14` | `EX-SCR-199` | `th` `position: static`, mini-graphes 112 × 34 | **CORRIGÉ** | 1 test E2E ; `sticky` en intermédiaire, 60 × 24 en compact |
| `ACC-16` | `EX-SCR-1`..`4`, `ET-FILTRE-NON-APPLIQUE` | bandeau nommant « gearType » | **PARTIEL — câblage dû** (§6) | 3 sondes D6 ; `filterDisplayLabel('gearType') === 'Boîte de vitesses'` |

Décomptes : **11 sondes de revue nouvelles** (5 en D7, 6 en D6) · **17 tests E2E nouveaux**, soit
**38 exécutions vertes et 13 sautées** (sauts de régime motivés) sur les trois projets · **0**
`test.fail()` ou `skip` ajouté ; les 3 `test.fail()` de la dette D8-15 sont intacts.

---

## 2. Partie 1 (effort high)

### 2.1 `ACC-02` — `EX-SCR-56` : le bandeau colle, et sa hauteur est bornée

**Constat 2.9b.** (a) `position: sticky; top: 0` était posé sur `.kycar-filter-band`, dont le parent
`.filter-bar` mesurait exactement sa hauteur (919 px pour 902 px) : la boîte de collage n'offrait
**aucune course** et la règle était inerte — après 1 200 px de défilement le bandeau était à
y = −1 029 (bureau) et −991 (mobile). (b) Replié, il mesurait **902 px** (bureau) et **1 271 px**
(tablette), soit 113 % et 124 % du viewport, contre 96 px et ≤ 40 % exigés.

**Correction** (`959d5fc`, complétée par le `scroll-padding` du commit `3a342a8`).

| Fichier | Ce qui change |
|---|---|
| `src/app/app.css` | `.kycar-filter-bar` devient l'élément **collant** (`position: sticky; top: var(--kycar-band-top)`), sa boîte de collage étant la page entière ; `z-index: 20` pour que la feuille plein écran du régime compact (`EX-SCR-97`) reste au-dessus de l'en-tête ; rembourrage vertical à zéro (la hauteur normative est celle du bandeau). Ajout d'un `scroll-padding-top` sur `:root`, égal à la hauteur cumulée en-tête + bandeau |
| `src/components/filters/sticky-offset.ts` **(nouveau)** | Mesure la hauteur de l'en-tête et celle du bandeau et les publie dans `--kycar-band-top` / `--kycar-band-height` (`ResizeObserver`, repli sur `resize`). `stickyTopPx` est pure. Deux frères ne peuvent pas se coller l'un sous l'autre en CSS seul : à défaut de mesure, le bandeau colle au haut du viewport — jamais rien de pire |
| `src/components/filters/FilterBand.tsx` | Le bandeau REPLIÉ ne monte que ses deux zones toujours visibles d'`EX-SCR-55` — ligne primaire (1) et filtres actifs (4). Un bouton `Plus de filtres (n)` monte le panneau portant la recherche de filtre (2) et les groupes secondaires (3). Défaut : **replié**, sans exception |
| `src/components/filters/filter-band.css` | Ligne primaire sur **une** rangée défilable horizontalement, contrôles en ligne ; zone (4) sur une rangée défilante ; plafond `min(320px, 40vh)` sur le bandeau déplié, `box-sizing: border-box` ; remise à zéro du cadre par défaut des `<fieldset>` de contrôle (≈ 20 px de rembourrage navigateur) |
| `src/components/filters/band-model.ts` | `countPrimaryActive` : le compteur du bouton dit ce que le bandeau replié **ne montre pas** |

**Preuve rouge → verte.** `tests/e2e/finition-2.10.spec.ts`, groupe `ACC-02`, quatre tests.

```
AVANT (sources d'avant 2.10)   scrollY=1200 · bandeau y=-1029 · hauteur repliée 902 px
APRÈS  [MESURE] ACC-02 écran A — bandeau après défilement : scrollY=1200 · bandeau y=179..269 · bas d’en-tête=179
       [MESURE] ACC-02 écran B — bandeau après défilement : scrollY=1200 · bandeau y=179..231 · bas d’en-tête=179
       [MESURE] ACC-02 — hauteur repliée (large)        :  95 px /  800 (11,9 %) · rangée 51 · jetons 36
       [MESURE] ACC-02 — hauteur repliée (intermediate) : 115 px / 1024 (11,2 %) · rangée 76 · jetons 36
       [MESURE] ACC-02 — hauteur repliée (compact)      :  65 px /  740 ( 8,8 %) · barre unique 56 px
       [MESURE] ACC-02 — hauteur dépliée : 320 px · zone (3) overflow-y=auto, défilante=true
```

Le plafond replié éprouvé est **96 px**, porté à **132 px** en régime intermédiaire par `EX-SCR-96`
(ligne primaire sur deux lignes) ; en compact, `EX-SCR-97` fixe la **barre** à 56 px, vérifiée comme
telle (le bandeau vaut 65 px : 56 + sa barre de défilement de jetons + son trait).

**Rien n'est masqué.** Les neuf contrôles primaires restent montés et atteignables au clavier ; la
rangée défile, et le focus l'amène. `clavier.spec.ts` (`EX-NFR-14`, 70 arrêts de la ligne primaire,
ordre du DOM) rejoué vert sur les trois projets, sans modification.

**Effet de bord traité.** Rendre le bandeau collant a fait apparaître un défaut réel : `scrollIntoView`
amenait le contenu visé **sous** l'en-tête et le bandeau, où un clic tombait sur le bandeau (le
brossage de `parcours-p2` a échoué ainsi). Le document réserve désormais leur hauteur mesurée par
`scroll-padding-top` — ce dont les ancres et la prise de focus d'`EX-NFR-12` avaient de toute façon
besoin.

### 2.2 `ACC-03` — `EX-SCR-181` : régime compact de l'écran B

**Correction** (`3a342a8`). `DistributionScreen` propage son régime compact (`degraded`, qui vaut
exactement `regime === 'compact'` côté coquille) aux graphes ; `distribution.css` porte les hauteurs.

| Clause de l'exigence | Avant | Après |
|---|---|---|
| histogrammes 200 px | 129 px | **200 px** (boîte de vue compacte `520 × 347` dans `Histogram.tsx`, pour que le tracé remplisse la hauteur au lieu d'être cerné de blanc) |
| `G4` 320 px | 148 px | **320 px** |
| additionnels 240 px | 122 px | **240 px** |
| en-tête statistique sur 5 lignes | 3 | **5** (nom + effectif / quartiles / étendue / médianes secondaires / actions) |
| rangée de boutons défilable | `overflow-x: visible` | **`auto`** |
| une étiquette d'axe sur trois | 14 pour 24 barres | **10** (plafond `⌈24/3⌉ + 2` graduations d'effectif) |
| `G8` à 10 sucettes | 20 | **10** + `<details>` « Afficher 10 de plus » (repli natif : ce module est appelé comme une fonction pure par les sondes D7, il doit rester sans hook) |
| `G7` non tracé | tracé | **non tracé**, remplacé par « Densité disponible sur écran large » (mot pour mot) |
| appui long sur un point de `G4` | aucun gestionnaire | **`pointerdown` + 500 ms** (`LONG_PRESS_MS`), annulé au-delà de 8 px de déplacement → feuille basse portant les six lignes d'infobulle d'`EX-SCR-158` et un bouton `Ouvrir l'annonce` explicite |

**Preuve rouge → verte.** Les trois tests `ACC-03` rejoués contre les sources d'avant 2.10 :

```
ROUGE  [MESURE] ACC-03 — géométrie du régime compact : G1=129 px · G4=148 px · additionnels=177 px
                · en-tête=3 lignes · boutons overflow-x=visible · G1 14 textes pour 24 barres
       [MESURE] ACC-03 — appui long sur G4 : aucun point atteint
VERTE  [MESURE] ACC-03 — géométrie du régime compact : G1=200 px · G4=320 px · additionnels=240 px
                · en-tête=5 lignes · boutons overflow-x=auto · G1 10 textes pour 24 barres
       [MESURE] ACC-03 — G8 en compact : 10 sucettes visibles
       [MESURE] ACC-03 — appui long sur G4 : feuille basse ouverte
```

Un troisième test vérifie le cas **négatif** : un appui déplacé n'ouvre jamais la feuille (le geste
est alors un défilement).

### 2.3 `ACC-06` — `EX-SCR-158`/`202` : le brossage 2D restreint réellement l'écran D

**Constat 2.9b.** Un brossage **2D** de « 262 annonces sélectionnées » conduisait à un écran D
annonçant « **280** lignes affichées sur 508 » : `sel` ne portait que l'intervalle de **prix**, l'axe
X du brossage était perdu, et l'export CSV de D suivait cet écran là où le même bouton sur B en
produisait 508.

**Arbitrage de rédaction.** `EX-SCR-202` (« `sel=<lo>-<hi>` ») et `EX-NAV-10bis` (« `sel` : **deux
bornes par axe**, même format que `selx`/`sely` ») se contredisent en surface. `EX-NAV-10bis` tranche
et `EX-SCR-158` (« l'écran D **restreint à la sélection** ») le confirme : `sel` porte les bornes des
axes. La forme `sel=<lo>-<hi>` reste **valide et inchangée** ; les axes supplémentaires s'y ajoutent.
Lecture faite de `data/reference/filters.json`, `src/state/filter-registry.ts` et
`src/state/corrections.ts` : `sel` est déjà déclaré dans `UI_STATE_PARAMS` (mode `replace`) et n'est
ni un filtre ni une classe `R`/`T`/`D` — **aucune modification de `src/state` n'a été nécessaire**,
le codec vit tout entier dans `src/screens/distribution/url-state.ts`.

**Forme canonique retenue** (`61df9e2`) :

```
sel=<plo>-<phi>                               prix seul (forme d'avant 2.10, toujours lue)
sel=<plo>-<phi>_r<lo>-<hi>                    + 1ʳᵉ immatriculation (firstRegistrationYearMonth)
sel=<plo>-<phi>_k<lo>-<hi>                    + kilométrage
sel=<plo>-<phi>_r<lo>-<hi>_k<lo>-<hi>         les trois métriques du nuage (ordre canonique fixe)
```

`_`, `r`, `k` et `-` appartiennent tous aux caractères « unreserved » de la RFC 3986 : la valeur
n'est jamais percent-encodée. Aller-retour exact, défaut jamais émis (`EX-NAV-8`), tri alphabétique
global inchangé (`EX-NAV-9`).

**Pourquoi trois métriques et non les deux seuls axes brossés.** Une première correction à deux axes
a été mesurée au rendu : **684 lignes pour 674 brossées**. Les dix lignes de trop sont des annonces
que le nuage **ne trace pas** (`EX-DATA-99` : kilométrage absent, prix suspect) mais dont le prix et
l'année tombent dans le rectangle — elles ne pouvaient appartenir à aucune sélection de brossage. La
boîte englobante est donc calculée sur les **trois** métriques d'annonce du nuage. Elle est par
construction satisfaite par toutes les lignes brossées (aucune n'est jamais écartée) ; sur les axes
réellement brossés elle est incluse dans le rectangle (tout point qu'elle contient était brossé) ; et
la métrique restante ferme l'écart **sans règle implicite**, la sentinelle `NUMERIC_UNKNOWN` (`-1`,
`src/types/sentinels.ts`) étant hors de toute borne de valeur réelle.

**Aucun câblage requis.** La charge de `onViewBrushedListings` garde sa forme `{ from, to }` élargie
d'un champ facultatif : `src/app.tsx` la repose telle quelle dans l'état d'interface, sans rien en
connaître. **`src/app.tsx` n'a pas été modifié.**

**Preuve rouge → verte.**

```
SONDE  tests/review/D7/sel-deux-axes-2.10.test.ts — 5 sondes, ROUGE 5/5 avant (brushToSelRestriction
       et selMatches n'existaient pas), VERTE 5/5 après, sans modification des assertions normatives.
E2E    [MESURE] ACC-06 — brossage → écran D : 673 brossées · sel=13450-48750_r24124-24293_k9600-217000
                · « 673 lignes affichées sur 1352 de la sélection — écarts calculés sur les 1352 »
       [MESURE] ACC-06 — CSV des annonces du périmètre : 673 lignes de données
       (tablette : 666 brossées → 666 lignes → 666 lignes de CSV)
```

L'exigence d'étiquetage d'`EX-SCR-202` (`<n> lignes affichées sur <N> de la sélection`) est intacte :
Σ vaut toujours 1 352, seules les lignes montrées sont restreintes.

---

## 3. Partie 2 (régime Sonnet/high — exécution bornée au constat)

### 3.1 `ACC-04` — `EX-SCR-180`, régime intermédiaire

`distribution.css`, bloc `@media (min-width: 768px) and (max-width: 1279px)` : `G3` prend toute la
seconde rangée (`grid-column: 1 / -1`), `G8` toute la largeur de la grille des additionnels, le canvas
de `G4` passe à 400 px et sa légende à `position: static` sous le tracé.

```
ROUGE  rangée=704 · G1=344 · G3=344 · grille=704 · G8=344 · G9=344 · G4=366 px · légende absolute, dessous=false
VERTE  rangée=704 · G1=344 · G3=704 · grille=704 · G8=704 · G9=344 · G4=400 px · légende static,   dessous=true
```

### 3.2 `ACC-07` — `EX-SCR-178`, les exclusions de `G1` closent l'effectif

`DistributionScreen` publie un troisième motif sous `G1` : les annonces à prix **valide mais hors des
bornes de classes** du binning, qui n'étaient comptées dans aucun motif.

```
VERTE  [MESURE] ACC-07 — clôture de G1 : Σ=1352 · dans les classes=1246 · exclues=106
       · notes : 55 annonces exclues (prix sur demande) / 32 (prix absent) / 19 (hors des classes affichées)
       1246 + 106 = 1352 ✔
```

Le test somme les effectifs de la **table de données équivalente** du graphe (`EX-NFR-15`), pas un
nombre affiché : la clôture est vérifiée sur la donnée réellement tracée.

### 3.3 `ACC-08` — `EX-SCR-21`, rythme et cibles

Trois clauses, trois mécanismes.

- **Gouttières** : `.kycar-market-grid` passe de 16 px partout à **16 / 20 / 24 px** par régime
  (`@media`, seuils de `breakpoints.ts` — les requêtes de conteneur préexistantes gouvernent le nombre
  de colonnes, elles ne décrivent pas le régime).
- **Rayon 4 px** sur les contrôles de la ligne primaire. Les cases à cocher et boutons radio
  **natifs** sont hors du champ mesuré : leur forme est celle du système (`appearance: auto`), et la
  leur imposer reviendrait à les redessiner, ce que l'exigence ne demande pas — écart nommé ici, pas
  passé sous silence.
- **Cibles tactiles** ≥ 32 × 32 px, ≥ 44 × 44 px en compact. Contrôles de bloc : `min-height` /
  `min-width` (ils grandissent sans rien déplacer). Liens : boîtes `inline-flex` à hauteur minimale —
  un premier essai par **rembourrage vertical** (qui préserve le retour à la ligne mais ne compte pas
  dans la mise en page) a fait **se recouvrir** deux liens voisins : le lien « Suivis » interceptait
  le clic destiné à « Recherches » dans le tiroir de navigation compact, et trois tests de
  `persistance.spec.ts` sont tombés sur ce recouvrement. `inline-flex` fait entrer la hauteur dans la
  mise en page ; le texte du lien reste libre de revenir à la ligne à l'intérieur de sa boîte. Case à
  cocher : la cible est son **libellé** (`<label for>`), qui reçoit le clic — c'est lui que la sonde
  mesure.

```
ROUGE  gouttière=16/16/16 · rayon min=0 px · 39 cibles sur 153 sous 32 px (desktop), 12 sur 58 sous 44 px (compact)
VERTE  gouttière=24 (large) / 20 (intermédiaire) / 16 (compact) · rayon min=4 px
       0 cible sur 130 sous 32 px (large et intermédiaire) · 0 cible sur 57 sous 44 px (compact)
```

### 3.4 `ACC-09` — `EX-SCR-124`, la liste de zones-modèles

`MakeCard.tsx` consomme enfin `needsVirtualizedModelList` : fenêtre glissante de **30 zones** sur le
défilement interne de la liste, avec deux cales proportionnelles au nombre de zones hors fenêtre — la
barre de défilement garde la course de la liste **entière**, aucune zone n'est rendue inaccessible.
`market.css` rétablit les ombres de débord (internes, donc sans effet de mise en page) et plafonne la
carte à 636 px en `border-box`, la liste absorbant la contrainte.

```
ROUGE  356 zones montées · box-shadow: none · carte 688–699 px
VERTE  30 zones montées · carte 636 px · liste 468 px (course 8 982 px) · ombres présentes
```

### 3.5 `ACC-10` — `EX-SCR-127`, la grille

`MarketScreen.tsx` consomme `shouldVirtualizeGrid` : au-delà de 40 cartes à rendre, **au plus 12**
sont montées, dans une fenêtre glissant sur le défilement du document ; deux cales en pleine largeur
de grille portent la hauteur des rangées hors fenêtre. Le nombre de colonnes et la hauteur de rangée
sont **relus sur le rendu réel** à chaque mesure ; les 588 px d'`EX-SCR-122` ne sont que l'estimation
d'amorçage, comme l'exigence le demande. Le chargement par lots d'`EX-SCR-129` est conservé : il
charge la **donnée**, la virtualisation borne le **DOM**.

```
ROUGE  180 cartes montées, 15 677 nœuds
VERTE  [MESURE] ACC-10 — grille virtualisée : 12 cartes montées (134 nœuds, grille 2 664 px)
       · après défilement 12 montées, première « Peugeot » (avant « Genesis »)
```

### 3.6 `ACC-11` — `EX-SCR-87`, retour visuel

`filter-band.css` : survol à 4 % de l'accent, état **coché** en fond d'accent et texte inversé (via
`:has(input:checked)` sur le libellé). La couleur du **focus** est ratifiée, pas corrigée — §5.1.

```
ROUGE  survol rgb(239,239,239) → rgb(239,239,239) · coché fond transparent
VERTE  survol rgba(0,0,0,0) → oklab(0.98 -0.0016 -0.0071 / 0.185) · coché fond rgb(11,95,214), texte rgb(255,255,255)
```

### 3.7 `ACC-12` — `EX-SCR-186`, cohérence des encodages

`scatter-model.ts` déclare, à côté des rampes A et B existantes :

- **palette qualitative `Q`**, 8 teintes d'Okabe & Ito — sûre en deutéranopie, protanopie et
  tritanopie, comme les rampes, et dont aucune n'est l'accent ;
- **paire divergente dédiée** (`#01665e` / `#8c510a`), employée nulle part ailleurs, pour le signe
  d'un écart de `G8`.

`AdditionalGraphs.tsx` : `G9`/`G12`/`G13`/`G15` prennent une teinte `Q` par modalité, `G8` la paire
divergente, `G7` la **rampe B** (kilométrage) au lieu d'un alpha de l'accent, qui n'encodait aucune
variable.

```
ROUGE  G9/G12/G13 : 1 teinte · G8 : accent/danger · G7 : rgba(11,95,214,α)
VERTE  [MESURE] ACC-12 — encodages : G9 8 teintes sur 10 · G12 6 · G13 2 · G8 paire divergente · G7 29 teintes de rampe B
```

Contraste : les teintes `Q` et la paire divergente sont des **surfaces de barre**, jamais du texte ;
le texte de chaque rangée reste en `--color-text` à côté de la barre. `a11y.spec.ts` (règle
`color-contrast` d'axe, 8 surfaces × 3 projets) reste à **0 violation** après la correction.

### 3.8 `ACC-13` — `EX-SCR-25`, l'indicateur de recalcul

`DistributionScreen` temporise l'indicateur `ET-CHARGE-MAJ` de **150 ms** (`RECALC_INDICATOR_DELAY_MS`,
constante déclarée et éprouvée) : il n'est monté que si le recalcul dépasse le budget de l'exigence,
et disparaît dès sa fin. Le mode 1 demande un câblage — §6.

```
VERTE  [MESURE] ACC-13 — indicateur au repos : aucun   (sonde à 10 ms pendant 600 ms)
       R-2.10-13-01 : RECALC_INDICATOR_DELAY_MS === 150
```

### 3.9 `ACC-14` — `EX-SCR-199`, responsive de l'écran C

`compare.css` : `thead th` collant en régime intermédiaire, mini-graphes ramenés à **60 × 24 px** en
compact.

```
ROUGE  thead th position=static · mini-graphe 121×36 (tablette), 112×34 (compact)
VERTE  thead th position=sticky (tablette) · mini-graphe 60×24 (compact)
```

### 3.10 `ACC-16` — libellés humains du bandeau de non-application

`src/components/filters/labels.ts` expose `filterDisplayLabel(filterId)` et
`filterDisplayLabels(ids)`, qui lisent le **registre de filtres** (`src/state/filter-registry.ts`, en
lecture seule — `src/state` n'est pas modifié). Un identifiant inconnu est rendu tel quel plutôt que
masqué. Le bandeau lui-même est dans `src/app.tsx` : §6.

```
VERTE  R-2.10-16-01 : filterDisplayLabel('gearType') === 'Boîte de vitesses'
       R-2.10-16-02 : filterDisplayLabels(['gearType','bodyType']) === 'Boîte de vitesses, Carrosserie'
       R-2.10-16-03 : un identifiant inconnu est rendu tel quel
```

---

## 4. Tests existants modifiés — justification écrite

Trois modifications, aucune n'affaiblit un fait mesuré.

| Test | Modification | Justification |
|---|---|---|
| `tests/e2e/parcours-p2.spec.ts` › `CONSTAT E2E-09` (part de particuliers) | la ligne de l'en-tête est désignée par son **texte** (`hasText: 'particuliers'`) au lieu de son rang (`nth(1)`) | `ACC-03` fait passer l'en-tête statistique de 3 à 5 lignes en régime compact (`EX-SCR-181`) : le rang 1 n'y est plus celui des médianes secondaires. Le fait mesuré — la part de particuliers de l'en-tête est > 0 — est **rigoureusement inchangé**, dans les trois régimes |
| `tests/e2e/parcours-p2.spec.ts` › `EX-SCR-17` (bascule log de `G7`) | `test.skip` en régime **compact** | `EX-SCR-181` dit que sous 768 px `G7` **n'est pas tracé** et affiche « Densité disponible sur écran large ». Sans tracé, il n'y a pas d'axe des prix à basculer : c'est une inadéquation de plate-forme au sens du README du harnais, motif citant l'exigence, et non un écart masqué. Le test reste exercé en `large` et en `intermédiaire`, où il prouve tout ce qu'il prouvait |
| `tests/review/D7/sel-deux-axes-2.10.test.ts` (sonde **de ce lot**) | réécrite une fois, du modèle « un second axe » au modèle « les métriques du nuage » | Écrite rouge puis rendue verte, elle s'est révélée **insuffisante** au rendu : 684 lignes pour 674 brossées (§2.3). La preuve opposable d'`ACC-06` — le test E2E sur le build de production — n'a, elle, **jamais** été modifiée : c'est elle qui a révélé l'écart résiduel et elle qui l'atteste corrigé |

Aucun `test.fail()` ni `test.skip` n'a été ajouté ailleurs. Les **3 `test.fail()` de la dette D8-15**
(`responsive.spec.ts`, `EX-SCR-95`) sont intacts et échouent toujours comme attendu.

---

## 5. Dettes motivées et écarts ratifiés

### 5.1 `EX-SCR-87` — la couleur de l'anneau de focus reste le jeton actuel

`EX-SCR-87` demande un contour de focus « de la couleur d'**accent** ». L'application pose un anneau
de 2 px décalé de 2 px — conforme en épaisseur et en décalage — mais de couleur `--color-focus-ring`
(**#ffd54a**), choix documenté dans `src/styles/tokens.css` et motivé par le contraste : **12,72:1**
sur le texte, contre **4,7:1** pour l'accent `#0b5fd6`. `EX-NFR-13` (contraste) prime sur la lettre
d'`EX-SCR-87` (couleur). **Le jeton est conservé, l'écart est ratifié ici plutôt que corrigé en
silence** ; l'amendement de l'exigence appartient au commanditaire.

### 5.2 `EX-SCR-17` en régime compact — sans objet, par `EX-SCR-181`

`EX-SCR-181` retire le tracé de `G7` sous 768 px. Sa bascule d'échelle logarithmique (`EX-SCR-17`)
n'y a donc plus d'objet. Ce n'est pas une régression : c'est une exigence qui en borne une autre. Le
test correspondant est sauté **en compact seulement**, motif citant `EX-SCR-181`.

### 5.3 `EX-SCR-21` — cases à cocher et boutons radio natifs

Le rayon de 4 px n'est pas imposé aux `input[type=checkbox]` / `[type=radio]` natifs : leur forme est
celle du système tant que `appearance` reste `auto`. La **cible tactile**, elle, est tenue — c'est le
libellé qui la porte, comme l'exigence l'admet (« zone cliquable »).

### 5.4 `ACC-13` en mode 1 — dette de câblage, pas de produit

La temporisation est écrite et éprouvée sur l'écran B. En mode 1, l'écran A ne reçoit aucun signal de
recalcul en cours : `MarketScreen` n'a pas de prop équivalente et la produire supposerait de tenir,
dans `src/app.tsx`, l'état « une requête est partie alors qu'un résultat était déjà affiché ». Voir
§6 : la correction est une prop et une ligne de câblage, pas un chantier.

---

## 6. Câblage attendu de `mvp-integrate`

Deux points, tous deux dans `src/app.tsx`, hors de mon périmètre d'écriture.

### 6.1 `ACC-16` — libellés humains du bandeau générique (une ligne)

Le bandeau `ET-FILTRE-NON-APPLIQUE` compose aujourd'hui son texte à partir des identifiants bruts.
La fonction existe et est éprouvée ; il reste à l'appeler.

```ts
// src/app.tsx — en tête de fichier, à côté des autres imports de src/components/filters
import { filterDisplayLabels } from './components/filters/labels';

// puis, à l'endroit exact où le bandeau compose sa phrase :
//   AVANT : `… le filtre ${unapplied.join(', ')} n’a pas pu être appliqué : …`
//   APRÈS :
`… le filtre ${filterDisplayLabels(unapplied)} n’a pas pu être appliqué : …`
```

Effet attendu, mesurable en recette sur `/marche/54-opel/1918-corsa?body=3&gear=M` :
« le filtre **Boîte de vitesses** n'a pas pu être appliqué » au lieu de « le filtre **gearType** … ».
Le libellé rendu est **exactement** celui que porte le jeton juste au-dessus : même registre, même mot.

### 6.2 `ACC-13` en mode 1 — signaler un recalcul en cours à l'écran A

Ajouter à `MarketScreen` la même prop que celle de l'écran B, et la câbler :

```tsx
// src/app.tsx, au montage de <MarketScreen …>
recalculating={marketPhase.phase === 'loading' && lastLoadedData !== undefined}
```

`MarketScreen` doit alors reproduire ce que `DistributionScreen` fait déjà (temporisation de
`RECALC_INDICATOR_DELAY_MS`, classe `--recalculating`, `aria-busy`, barre de progression
indéterminée). Je ne l'ai pas écrit : une prop sans consommateur possible est du code mort, et le
signal « une requête est partie alors qu'un résultat était affiché » n'existe que dans la coquille.
Sans ce câblage, le régime mobile continue de dépasser 150 ms (167–252 ms mesurés en 2.9b) sans
basculer sur `ET-CHARGE-MAJ` — écart **visible mais sans conséquence sur une valeur affichée**.

---

## 7. Portes, décomptes, taille

Toutes exécutées dans le worktree, sur le périmètre de l'agent.

| Porte | Résultat |
|---|---|
| `npx tsc --noEmit -p tsconfig.json` | **0 erreur** |
| `npx tsc --noEmit -p tsconfig.review.json` | **0 erreur** |
| `npx eslint src/screens src/components src/app tests/review/D6 tests/review/D7 tests/e2e` | **0 erreur, 0 avertissement** |
| `npx vitest run --no-file-parallelism src/screens src/components` | **21 fichiers, 315 tests** verts |
| `npx vitest run --config vitest.review.config.ts --no-file-parallelism tests/review/D6 tests/review/D7` | **26 fichiers, 239 tests** verts — 24 fichiers / 228 tests avant 2.10, plus les 2 fichiers et 11 sondes de ce lot |
| `npm run build` | `tsc` app + worker + `vite build`, **0 erreur, 0 warning** |
| `npm run size` | **118,78 / 300 Kio** gzip (entrée + worker), différé 0,00 / 400 Kio |

**E2E** (port dédié `KYCAR_E2E_PORT=4190`, `reuseExistingServer: false`, build de production) :

| Fichier | Résultat |
|---|---|
| `finition-2.10.spec.ts` **(nouveau)** | 17 tests × 3 projets → **38 verts, 13 sautés** (sauts de régime motivés), 0 échec |
| `a11y`, `clavier`, `parcours-p1`, `parcours-p2`, `impression`, `partage-url`, `persistance` | rejoués **verts** sur les trois projets (88 + 155 + 11 exécutions au dernier passage) |
| `responsive` | vert **sauf** les 3 `test.fail()` attendus de la dette D8-15 (`EX-SCR-95`), inchangés |
| `perf` | **non rejoué** — hors périmètre de l'agent, aucune modification de chemin chaud ; à rejouer par le coordinateur |

**Trois régressions** ont été trouvées par ces rejeux **et corrigées** en cours de lot :

1. `parcours-p2` › brossage du nuage — le collage du bandeau amenait le contenu visé par
   `scrollIntoView` **sous** les éléments collants, où le clic tombait sur le bandeau. Corrigé par
   le `scroll-padding-top` du document, dont les ancres et la prise de focus d'`EX-NFR-12` avaient
   de toute façon besoin.
2. `responsive` › `E2E-19` (débordement horizontal du document sur A, B, C) — la note permanente
   masquée dans la rangée repliée était en `position: absolute` sans bloc contenant local : elle
   échappait au défilement interne de la rangée et poussait le document à 6 331 px pour un viewport
   de 1 280. Corrigé par un bloc contenant sur le contrôle.
3. `persistance` × 3 en régime compact — le rembourrage vertical posé sur les liens pour tenir la
   cible de 44 px n'entre pas dans la mise en page : deux liens voisins du tiroir de navigation se
   recouvraient et « Suivis » interceptait le clic de « Recherches ». Corrigé en faisant des liens
   des boîtes `inline-flex` à hauteur minimale (§3.3).

Chacune a été rejouée verte après correction.

**Fichiers touchés** : 3 nouveaux (`sticky-offset.ts`, `finition-2.10.spec.ts`,
`sel-deux-axes-2.10.test.ts`, `libelles-et-seuils-2.10.test.ts` — 4 en comptant les deux sondes),
14 modifiés. `reports/e2e/results.json` n'est **pas** commité.
