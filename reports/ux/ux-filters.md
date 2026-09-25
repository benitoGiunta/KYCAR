# ux-filters — bandeau de filtres, décision D3-46 (v0.1.1)

Agent `ux-filters` (Opus, effort high), worktree `/home/user/KYCAR-filters`, branche `ux36/filters`
(depuis `claude/kycar-project-ffcplk` @ `c4151e3`). Décision de référence :
`reports/data/DATA-LEAD-DECISIONS.md` D3-46.

## 1. Retour du commanditaire (texte d'origine)

> « La barre de filtres est vraiment mal faite et ça entrave le testing. Plusieurs problèmes à régler :
> — le scroll horizontal très très long → proposer 2-3 filtres toujours visibles, et un moyen de déplier
> tous les filtres en cartes réparties en utilisant la largeur de l'écran sans scroller horizontalement ;
> — quand je mets une valeur sur un filtre (par ex. valeur à taper), j'ai à peine fini de la taper
> qu'elle s'enregistre et réinitialise l'endroit où j'étais en scroll horizontal → mieux d'avoir un
> bouton "validé" qui reste collant, toujours visible ;
> — actuellement il y a l'en-tête de la page, la navigation (par ex. marché > VW Passat > annonces), les
> filtres, qui sont fixes, et donc j'ai un tiers de la page qui est bouffé et qui m'empêche de voir
> pleinement la suite. Modifie tout ça. »

Ce que la mesure a confirmé sur v0.1.0 (build `c4151e3`, sondes rouges §5) : ligne primaire de
**6 234 à 7 653 px** de large défilant dans 585 à 1 097 px ; jetons défilants en compact (1 249 px
dans 181 px) ; **243 à 318 px collants** après 1 200 px de défilement (en-tête 174–252 px + bandeau
53–116 px, plus la barre de synthèse ou l'en-tête statistique collés dessous) ; et, découvert en
cours de route, deux causes de perte de position qui ne sont pas l'application automatique elle-même
(§3.4).

## 2. Ce que voit l'utilisateur maintenant

- **Une seule barre collante, 52 px** (56 px en compact), en haut de l'écran : `Marque / Modèle`
  (résumé, ouvre l'écran G), `Prix` (min / max), `Kilométrage` (min / max), `Tous les filtres (n)`,
  et à droite l'effectif — remplacé par **`Annuler` / `Appliquer — 1 234 offres`** dès qu'une
  modification est en attente. L'en-tête, le fil d'Ariane, la ligne des filtres actifs, la barre de
  synthèse (A) et l'en-tête statistique (B) **défilent avec la page**.
- **`Tous les filtres`** ouvre, en surimpression sous la barre, un panneau de **cartes toutes
  dépliées, en colonnes CSS** (4 colonnes à 1 280 px, 2 à 768 px, sans trous — retouche 3) : recherche de filtre en tête, carte `Essentiels` (année,
  carburant, carrosserie, boîte, vendeur, mot-clé), puis une carte par groupe avec son badge
  « n actifs » ; borné à 70 % de l'écran, défilement vertical interne, pied fixe `Fermer` /
  `Annuler` / `Appliquer`. En compact : feuille plein écran, une colonne, pied fixe.
- **Plus aucune application pendant la frappe** : tout va dans un brouillon ; `Appliquer` (ou
  `Entrée` dans un champ) applique en **une** navigation ; `Annuler` rétablit. Retirer un jeton et
  `Tout effacer` restent immédiats. Ni la page, ni le panneau, ni le focus ne bougent.

Captures (`reports/ux/ux-filters/`, 10 PNG) : `avant-1280-replie`, `avant-768-replie`,
`avant-360-replie` ; `apres-1280-replie`, `apres-1280-brouillon-defile` (page défilée de 900 px,
brouillon sale), `apres-1280-panneau`, `apres-768-brouillon`, `apres-768-panneau`,
`apres-360-replie`, `apres-360-feuille-brouillon`.

## 3. Choix de conception (et alternatives écartées)

### 3.1 Barre condensée (a) et hauteur collante (d)

- **Seule `.kycar-band-bar` colle** (`top: 0`). Pour qu'elle colle sur toute la page alors que le
  bandeau contient aussi les jetons (non collants), `.kycar-filter-band` et `.kycar-filter-bar` n'ont
  plus de boîte à l'écran (`display: contents`, borné à `@media screen` pour ne pas défaire le
  masquage d'impression de `print.css`). *Écarté* : garder un conteneur collant enveloppant barre +
  jetons — la ligne des jetons (36 à 99 px selon le nombre de filtres) aurait fait sauter le budget.
- **Ligne des jetons non collante** (choix demandé « incluse ou non ») : elle passe à la ligne au lieu
  de défiler, donc sa hauteur varie avec le nombre de filtres ; aucune hauteur fixe ne tient le
  budget. Le nombre de filtres actifs reste visible dans la barre (`Tous les filtres (n)` /
  `Filtres (n)`).
- **Hauteur de rangée fixe (52 px)** : sans elle, la barre grandissait de 10 px quand `Annuler` /
  `Appliquer` remplaçaient l'effectif (résumé marque passant sur deux lignes), et l'ancrage de
  défilement du navigateur déplaçait la page pendant la frappe (mesuré : 10 px à 768 px).
- **Condensation, jamais défilement** : champs rétrécissables (`min-width` 3,75 rem, sans flèches
  d'incrément), résumé marque sur deux lignes au plus ; en intermédiaire, libellés masqués
  *visuellement* (noms accessibles intacts, textes indicatifs `Prix min`…), `Filtres (n)` au lieu de
  `Tous les filtres (n)`, détail de `Appliquer` masqué visuellement (annoncé par la région
  `aria-live`). En compact, la barre ne porte que le résumé (D3-46 (d)).
- **Barres collantes des écrans** : `market.css:22` (barre de synthèse, 61–120 px mesurés) et
  `distribution.css:15` (en-tête statistique, 89–263 px) collaient à `top: 0` — cachées derrière
  l'ancien en-tête collant, elles auraient DÉPASSÉ sous la nouvelle barre de 52 px (ou, collées
  dessous, triplé le budget). **Décollées** (`position: relative`), exigences `EX-SCR-105` / `141`
  amendées. `listings.css:65` (`thead th`, 44 px) et `compare.css:28` (intermédiaire, dans un
  conteneur à défilement horizontal propre) sont laissées : entièrement recouvertes par la barre /
  sans course verticale, elles n'ajoutent rien à la hauteur mesurée (écran A et B mesurés à 53 px).

### 3.2 Panneau « Tous les filtres » (b)

- **Surimpression bornée à 70 % du viewport** (option « bornée avec défilement interne » de D3-46) :
  ouvrir le panneau ne décale jamais la page (aucun ancrage de défilement, aucun saut), le pied
  `Appliquer` est toujours visible sans défilement de page, et le résultat reste visible sous le
  panneau. *Écarté* : panneau dans le flux, non collant — l'ouvrir après défilement l'aurait placé
  hors de l'écran, et `Appliquer` n'aurait plus été « collant, toujours visible ».
- *(Remplacé par la retouche 2, §10 : le panneau se referme après `Appliquer`.)* **Le panneau restait ouvert après `Appliquer`** (hors compact) : son défilement et le focus sont
  conservés, l'utilisateur affine par petites touches (00-CONTEXT) ; `Fermer` / `Échap` le referment.
  En compact, `Appliquer` referme la feuille (plein écran : sinon on ne verrait jamais le résultat).
- **`Échap` / `Fermer` conservent le brouillon** (choix demandé) : rien n'est perdu par un geste de
  fermeture ; la barre continue d'afficher `Annuler` / `Appliquer`, l'abandon est donc visible et
  explicite. *Écarté* : abandon silencieux à la fermeture.
- **Chaque filtre une seule fois** : l'ancien accordéon répétait les primaires dans leur groupe (deux
  champs `Prix à` visibles en même temps). Les cartes de groupe n'affichent que les non-primaires
  (et la borne haute d'un couple primaire) ; `Kilométrage` et `Vendeur`, entièrement primaires,
  n'ont pas de carte propre → **13 cartes** : `Essentiels` + 12 des 14 groupes d'`EX-SCR-93`.
  La recherche de filtre déplie `Essentiels` pour un primaire.
- Cartes = `<fieldset>`/`<legend>` repliables, titre dans la carte (legend flottante), badge
  « n actifs », `Réinitialiser`. *(Retouche 3 : toutes dépliées par défaut, en colonnes CSS, chevron
  et nombre de filtres.)*

### 3.3 Brouillon + « Appliquer » (c)

- Logique pure dans `src/state/draft.ts` : sale/propre sur la forme canonique d'URL, décompte par
  contrôle, édition avec cascade (`DR-059`), **report** des modifications en attente quand la
  sélection appliquée change dessous (jeton retiré, amorce de l'écran A, retour arrière), plan
  d'application (classes `T`/`R`).
- `InteractionController.applyDraft(url, classes)` : **un** `pushState`, puis `T` ⇒ rechargement,
  sinon `R` ⇒ recalcul local (absorbeur `EX-SRCH-1bis`) — scission T/R au moment d'`Appliquer`.
  `scheduleChange` n'est plus appelé par le bandeau (le mécanisme reste, sondé).
- Plafond d'URL (`EX-NAV-11`) éprouvé à l'application : refus avec message, brouillon conservé,
  panneau ouvert. Paramètres réservés (`provider`, ACC-20), corrections d'URL, navigation complète sur
  changement de source (ACC-26) : inchangés, tout passe toujours par `navigate` de la coquille.
- **Effectif prévisionnel** : `Appliquer — 1 234 offres`, calculé par `countForSelection` (le
  compteur existant), rythmé par la table `EX-SRCH-1…8` (qui ne gouverne plus que ce calcul) ; la
  coquille ignore les réponses périmées (`projectedSeq`) et le bandeau n'affiche un effectif que pour
  le brouillon exact qui l'a demandé ; sinon `Appliquer (n modifications)`. En mode 2, le couple de la
  route est réinjecté pour le calcul.
- Restent **immédiats** : retrait de jeton (et retrait partiel, rétrécissement modèle → marque),
  `Tout effacer` (qui vide aussi le brouillon), `Annuler` de la notification de cascade, brossage
  converti en filtre (écran B, hors bandeau), et un choix de l'écran G qui **change de route** en
  mode 2 (`EX-SRCH-14`, changement d'écran validé par le bouton `Appliquer` de G lui-même).
- **La coquille ne remonte plus le bandeau à chaque requête** (`key={location.pathname}`) : le
  remontage par requête perdait panneau, défilement, focus et brouillon à chaque application — une
  des causes réelles du « ça réinitialise l'endroit où j'étais ». Callbacks lus sur les props
  courantes (`propsRef`).

### 3.4 Deux causes de perte de position trouvées en chemin

1. **`scroll-padding-top` du document** (réservant la hauteur des éléments collants) s'appliquait aux
   champs de la barre collante elle-même : cliquer dans `Prix à` faisait remonter la page de 400 à
   0 px, puis chaque frappe de ~31 px (le navigateur « montre » le curseur sous la bande réservée).
   Remplacé par `scroll-margin-top` sur le contenu (`.kycar-main`, `.kycar-footer`).
2. **Ramenage au domaine à chaque frappe** (`RangeControl`) : taper `20000` dans `Prix à` donnait
   `2` → `500` (minimum) → `5000` → `50000` → `100000` (maximum). Le contrôle garde désormais le texte
   saisi localement, ne propage au brouillon que des valeurs complètes et valides, et applique le
   ramenage / le refus `from > to` (`EX-SCR-67`/`68`) à la validation du champ (sortie, `Entrée`).

### 3.5 Accessibilité

Panneau = région nommée « Tous les filtres » pilotée par un bouton `aria-expanded`/`aria-controls` ;
`Échap` referme et rend le focus au bouton ; feuille compacte `role="dialog" aria-modal`, `Échap`
aussi. `Appliquer` : nom accessible complet (« Appliquer — 1 234 offres » / « Appliquer (2
modifications) »), `aria-disabled` plutôt que `disabled` (le focus n'est jamais perdu après usage) ;
quand `Annuler`/`Appliquer` de la barre disparaissent, le focus va au bouton `Tous les filtres`.
Région `aria-live="polite"` `.kycar-band-draft-status` : « 2 modifications en attente : 1 234 offres
après application ». Le raccourci `/` ouvre le panneau puis y place le focus. L'écran G rend le focus
à son déclencheur. `a11y.spec.ts` et `clavier.spec.ts` verts sur les 3 projets.

## 4. Fichiers modifiés

| Dossier | Fichiers |
|---|---|
| `src/state/` | `draft.ts` (neuf), `draft.test.ts` (neuf), `interaction.ts` (`applyDraft`), `interaction.test.ts`, `debounce-policy.ts` (doc : ne rythme plus que l'effectif prévisionnel), `README.md` |
| `src/components/filters/` | `FilterBand.tsx` (refonte), `FilterCards.tsx` (neuf, remplace `SecondaryGroups.tsx`, supprimé), `PrimaryLine.tsx`, `FilterFieldRow.tsx`, `FilterSearch.tsx`, `band-model.ts`, `band-model.test.ts`, `sticky-offset.ts` (`observeBandHeight`), `filter-band.css` (refonte), `screen-g.css` (z-index), `controls/RangeControl.tsx`, `controls/PanelSearchMulti.tsx`, `controls/ControlRenderer.tsx` (commentaire), `README.md` |
| `src/app*` | `app.tsx` (clé du bandeau, effectif prévisionnel séquencé), `app/app.css` (en-tête non collant, `.kycar-filter-bar` sans boîte, `scroll-margin-top`) |
| `src/screens/` (**hors périmètre nominal**, voir §10) | `market/market.css`, `distribution/distribution.css` : une règle `position` chacune |
| `tests/e2e/` | `filtres-d3-46.spec.ts` (neuf), `_helpers.ts`, `parcours-p1`, `partage-url`, `source-fixture`, `clavier`, `impression`, `finition-2.10` |
| `tests/review/D5/` | `draft-d3-46.test.ts` (neuf), `regime-and-shortcuts.test.ts`, `screen-g-mode2-position.test.ts` |
| `docs/requirements/` | `draft-screens.md`, `draft-behaviour.md` |
| `reports/ux/` | ce rapport, `ux-filters/*.png` |

## 5. Mesures avant / après

Build de production, fixtures `test`, `/marche?body=3&kmto=100000&priceto=20000` (A) et
`/marche/54-opel/1918-corsa` (B), après `scrollTo(0, 1200)`.

| Régime | Débordement interne max du bandeau, avant → après | Document | Hauteur collante A, avant → après | B, avant → après |
|---|---|---|---|---|
| 1 280 px | 7 595 px dans 1 097 (ligne primaire) → **0** | 1 280/1 280 → 1 280/1 280 | 265 → **53 px** (≤ 64) | 243 → **53 px** |
| 768 px | 6 234 px dans 585 → **0** | 768/768 → 768/768 | 309 → **53 px** (≤ 64) | 287 → **53 px** |
| 360 px | 1 249 px dans 181 (jetons, P1) → **0** | 360/360 → 360/360 | 290 → **56 px** (≤ 56) | 318 → **56 px** |

Avant : en-tête 174–252 px + bandeau 53–116 px, barre de synthèse / en-tête statistique collés à
`top: 0` (61–263 px). Après : `kycar-band-bar 0–53` (0–56 en compact) seul. En-tête et fil d'Ariane
à y ≤ −948 px. Brouillon sale : barre inchangée (hauteur fixe). Panneau à 1 280 px : 4 cartes par
rangée (4 × 306 px), 505 px de haut (≤ 560) ; 768 px : 2 × 364 px ; 360 px : 1 colonne.
Taille du bundle initial : 137,4 → **139,41 Kio** gzip (< 300).

## 6. Sondes neuves (rouge → vert)

**E2E `tests/e2e/filtres-d3-46.spec.ts`** (10 tests × 3 projets) — (a) aucun débordement horizontal
sur A, A filtré, B (document et chaque élément du bandeau, `scrollWidth ≤ clientWidth + 1`, et aucun
élément hors viewport) ; (a) exactement trois filtres visibles + `Tous les filtres` (compact : résumé
+ effectif) ; (b) panneau : 13 cartes, `Essentiels` en tête, aucun filtre en double, grille sur toute
la largeur, ≥ 3 cartes/rangée à 1 280 (≥ 2 à 768, 1 en compact), ≤ 70 % du viewport, `Échap` rend le
focus ; (c) prix saisi caractère par caractère avec 800 ms de pause : URL inchangée, défilement de
page inchangé, focus conservé, `Appliquer — <n> offres` avec `n` DÉRIVÉ des fixtures
(`derived().dense`), région `aria-live`, `Annuler` rétablit, `Entrée` applique en **un** appel
d'historique (`pushState`), URL canonique, effectif affiché = dérivé ; (c) dans le panneau : une
case cochée ne change ni le défilement interne ni la page, `Appliquer` du pied visible et non
recouvert après défilement jusqu'en bas, une navigation ; (d) hauteur collante ≤ 64 / 56 px après
1 200 px, en-tête et fil d'Ariane hors viewport, barre à y = 0 ; (d) brouillon sale : même budget,
`Appliquer` dans le viewport.

Rouge sur v0.1.0 (`c4151e3`, même spec, port 4181) : **28 échecs / 30** — les 2 verts sont les
tests (a) « aucun débordement » à 360 px sur A et B **sans filtre** (le compact de v0.1.0 ne
débordait que lorsque des jetons existaient : 1 249 px sur A filtré, rouge). Extraits :

```
[MESURE] D3-46 (a) écran A — débordement : document 1280/1280 · div.kycar-primary-line scrollWidth 7595 > clientWidth 1097 | div.kycar-control hors viewport (335..2119) …
[MESURE] D3-46 (a) écran A filtré (P1) — débordement : document 360/360 · div.kycar-active-tokens scrollWidth 1249 > clientWidth 181 …
[MESURE] D3-46 (d) écran A — hauteur collante (large) : 265 px (budget 64) · app-header 0–174 · kycar-market-summary-bar 0–61 · filter-bar 174–265
[MESURE] D3-46 (d) écran B — hauteur collante (compact) : 318 px (budget 56) · app-header 0–252 · kycar-stat-header 0–263 · filter-bar 252–318
Error: locator.click: Test timeout … waiting for locator('.kycar-band-bar').getByRole('button', { name: /^Tous les filtres/ })   (×10 : (b), (c))
28 failed / 2 passed (14.3m)
```

Après : **30 / 30 verts** (dernier passage : §8). Aucun `test.fail`, aucun `skip`.

**Revue `tests/review/D5/draft-d3-46.test.ts`** (11 tests) : pas d'`overflow-x: auto|scroll` dans la
feuille du bandeau, barre `nowrap` + champs rétrécissables, grille `auto-fill minmax(280px, 1fr)`,
`FilterBand` n'appelle plus `scheduleChange` et applique par `applyDraft`, coquille clé-ée sur le
chemin seul, `RangeControl` valide au `blur`, logique pure sale/propre/fusion/annulation, trois
filtres modifiés ⇒ un seul `pushState`, en-tête non collant, barre collante `top: 0`, hauteurs 52 /
56 px. **Unitaires** : `src/state/draft.test.ts` (15), 3 tests `applyDraft` dans `interaction.test.ts`,
6 tests D3-46 dans `band-model.test.ts`. Rouge sur `c4151e3` : `Cannot find module
'../../../src/state/draft'` / `'./draft'` (module inexistant) — la sonde de revue ne se charge pas.

## 7. Sondes amendées (D-31, justification en tête de chaque bloc, citant D3-46)

| Sonde | Ancien comportement figé | Équivalent D3-46 vérifié |
|---|---|---|
| `tests/review/D5/regime-and-shortcuts.test.ts` R-D5-32 (3 tests) | `deferredApplyLabel` : « Voir les <n> offres » (feuille compacte seule) | `draftApplyLabel` : « Appliquer — <n> offres », inconnu ⇒ « Appliquer (n modifications) », nul ⇒ « 0 offre » (jamais « aucune offre ») |
| `tests/review/D5/screen-g-mode2-position.test.ts` R-D5-2.8-09 (2 tests) | résumé / écran G dérivés de `selection` ; dérivation séparée pour la feuille | dérivés du BROUILLON par `withRouteTaxonomy(draftSelection, …)` ; un seul `screenGSummary` partout |
| `tests/e2e/_helpers.ts` | `applyFilterSheet` (n'agissait qu'en compact) | `openAllFilters` + `applyFilters` (tous régimes) ; `openFilterSheet` conservé |
| `parcours-p1.spec.ts` (pose des 3 filtres ; `checkBerline`) | attente de l'URL après chaque saisie (application automatique) ; Coupé/Berline dans la ligne primaire | URL **inchangée** avant `Appliquer`, puis une application ; carrosserie dans `Tous les filtres` |
| `partage-url.spec.ts` (EX-NAV-18 ; EX-NAV-11) | idem ; hors compact « la case revient décochée » après refus | une application ; refus au clic `Appliquer` dans tous les régimes, panneau ouvert, brouillon sale conservé (case cochée), aucun jeton |
| `source-fixture.spec.ts` (ACC-20) | `applyFilterSheet` | `applyFilters` |
| `clavier.spec.ts` (EX-NFR-14) | contrôles de `.kycar-primary-line` (> 10) | contrôles de la barre ET du panneau ouvert (feuille en compact), > 10, ordre du DOM |
| `impression.spec.ts` règle 1 | `.app-header` `sticky` à l'écran | en-tête non collant, `.kycar-band-bar` collante à l'écran ; à l'impression en-tête `static`, barre masquée |
| `impression.spec.ts` E2E-20 | `.summary-bar` `sticky` (preuve que `market.css` est chargé) | règle chargée + `position` non collante + `min-height: 44px` (même règle, autre propriété) |
| `finition-2.10.spec.ts` ACC-02 (3 tests) | bandeau collant sous l'en-tête ; replié ≤ 96/132/56 px ; déplié ≤ 320 px / 40 % | barre à y = 0, en-tête défilé ; barre ≤ 64/56 px et ≤ 40 % ; panneau ≤ 70 %, corps défilant |
| `finition-2.10.spec.ts` ACC-11 | cases dans la ligne primaire repliée | ouverture de `Tous les filtres` d'abord ; mêmes mesures |

Aucune vérification supprimée sans équivalent ; aucun `skip` ajouté (le `test.skip` compact d'ACC-02
« déplié » existait déjà, motif réécrit).

## 8. Portes

| Porte | Résultat |
|---|---|
| `npm run build` | 0 erreur, 0 avertissement |
| `npm run lint` | code de sortie 0 |
| `npm run size` | 139,41 / 300 Kio gzip — OK |
| `npx vitest run src/components/filters src/state src/app --no-file-parallelism` | 13 fichiers, **211 tests verts** |
| `npx vitest run --config vitest.review.config.ts tests/review/D5 D8 D6 D7 --no-file-parallelism` | 65 fichiers, **702 tests verts** |
| Playwright 4181, `filtres-d3-46` (3 projets) | **30/30** |
| Playwright 4181, `parcours-p1`, `partage-url`, `source-fixture`, `clavier`, `impression` | 159 verts, 2 `skip` de plate-forme préexistants, **1 échec non reproduit** : `source-fixture` ACC-26 « enregistrée sous synthetic… » (desktop), carte de l'écran E sans « source : synthétique » ; rejoué 2 × vert (`--repeat-each=2`), sans lien avec le bandeau (sauvegarde par la barre d'outils de l'écran A) — signalé §10 |
| Playwright 4181, `finition-2.10`, `parcours-p2`, `responsive`, `a11y` | **148 verts**, 26 `skip` de plate-forme préexistants (dont les 2 `test.fail` attendus DETTE D8-15 de `responsive`, comptés verts) |
| Rejeu après la retouche visuelle finale : `filtres-d3-46`, `a11y`, `clavier`, `finition-2.10` (3 projets) | **124 verts**, 14 `skip` de plate-forme préexistants, 0 échec |

Les specs ont été jouées contre `vite preview --port 4181` du build courant via une configuration
Playwright de travail (même `playwright.config.ts`, sans `webServer`, pour ne pas reconstruire à
chaque fichier) ; `reports/e2e/results.json` n'a pas été modifié. `tsc -p tsconfig.review.json`
signale une erreur **préexistante** (identique sur `c4151e3`) dans `tests/review/D6/structure-a11y.test.ts:52`
(`priceScopeNote`), hors périmètre — §10.

## 9. Hypothèses (E4) — statut après relecture du coordinateur

H1, H3, H4, H6 : **ratifiées** (décidées). H2 et H5 : **refusées**, remplacées par les retouches 1 et
2 (§10). Texte d'origine conservé ci-dessous.

- **H1** — Barre de 52 px et non 64 : marge pour un éventuel bandeau d'erreur transitoire (borne
  refusée, valeur ramenée), rendu en surimpression sous la barre, jamais dans sa hauteur.
- **H2** — Le choix de l'écran G en **mode 1** va dans le brouillon (lettre de D3-46 (c)) : il faut
  donc `Appliquer` de G, puis `Appliquer` de la barre. En mode 2, un choix qui change de route reste
  immédiat (changement d'écran, `EX-SRCH-14`) et emporte le brouillon ; le déclencheur G propre à
  l'écran A (`Choisir une marque et un modèle`, hors bandeau) reste immédiat.
- **H3** — `Réinitialiser` d'une carte agit sur le brouillon (tout ce qui se fait dans le panneau est
  brouillon) ; `Tout effacer` reste immédiat et vide aussi le brouillon.
- **H4** — `Kilométrage` et `Vendeur` n'ont pas de carte : 13 cartes et non « 13 groupes +
  Essentiels = 14 » comme l'écrit le brief ; la règle « chaque filtre une fois » a été préférée à une
  carte vide ou à des doublons. *(Depuis la retouche 3, toutes les cartes sont dépliées.)*
- **H5** — Le panneau reste ouvert après `Appliquer` hors compact (« ni le défilement du panneau ni le
  focus ») ; en compact la feuille se referme.
- **H6** — Après une application, `scrollY` peut AUGMENTER de la hauteur de la ligne des jetons qui
  apparaît au-dessus du contenu : c'est l'ancrage de défilement du navigateur qui garde le contenu
  regardé immobile ; la sonde (c) l'admet explicitement (jamais de remontée).

## 10. Retouches coordinateur (relecture de `56cf99a`)

| # | Demande | Fait | Preuve |
|---|---|---|---|
| 1 | **H2 refusée** : l'écran G, modale à validation explicite, applique IMMÉDIATEMENT en mode 1, en emportant le brouillon de la barre | `handleScreenGApply` → `handleApplyDraft(withDraftValue(brouillon, mmmv, choix))` : une navigation pour les deux, jamais deux « Appliquer ». Mode 2 inchangé (changement de route) | E2E neuve `filtres-d3-46` « l'écran G applique IMMÉDIATEMENT… » : brouillon `kmto=100000`, choix Opel → UN `pushState` `/marche?kmto=100000&mmmv=54`, bandeau propre, 3 projets |
| 2 | **H5 refusée** : « Appliquer » depuis le panneau le referme, focus au bouton « Tous les filtres », défilement de page inchangé | `handleApplyDraft` referme le panneau (comme la feuille compacte) et rend le focus au bouton | Sonde (c) « dans le panneau… » étendue : panneau masqué, focus sur « Tous les filtres » (« Filtres » en compact), `scrollY` ±2 px |
| 3 | **Cartes vides / trous** : toutes les cartes dépliées, colonnes CSS | Toutes les cartes dépliées par défaut ; `.kycar-filter-cards { column-width: 280px; column-gap }`, `.kycar-filter-card { break-inside: avoid }` (4 colonnes à 1 280 px, 2 à 768, 1 en compact) ; titre repliable avec chevron ▾/▸ et « n filtres » ; titre sur deux lignes FIXES (titre ; nombre + badge d'actifs) et « Réinitialiser » toujours rendu (masqué sans actif) — sans quoi cocher une case changeait la hauteur d'une carte, rééquilibrait les colonnes et déplaçait le panneau de 8 px | Sonde (b) : aucune carte repliée ni vide, ordre du DOM (= tabulation) = ordre des colonnes (haut → bas puis gauche → droite), 4/2/1 colonnes, aucun débordement ; revue `draft-d3-46` : `column-width: 280px` + `break-inside: avoid` ; captures `apres-1280-panneau.png`, `apres-768-panneau.png` refaites |
| 4 | `npm run test:review` rouge à l'étape `tsc` | `tests/review/D6/structure-a11y.test.ts` : `priceScopeNote: undefined` ajouté au fixture `baseZone`, justification D-31 en une ligne, aucune assertion changée | `npm run test:review` vert de bout en bout (§11) |
| 5 | Ratifiés | Lignes `market.css` / `distribution.css` (barres d'écran décollées) et H1, H3, H4, H6 : **décidées** (plus des hypothèses). H2 et H5 : remplacées par les retouches 1 et 2 | — |

Portes rejouées après retouches : voir §11.

## 11. Portes après retouches

| Porte | Résultat |
|---|---|
| `npm run build` | 0 erreur, 0 avertissement |
| `npm run lint` | code de sortie 0 |
| `npm run test:review` (complet, `tsc -p tsconfig.review.json` compris) | **vert** : 112 fichiers, 1 199 tests |
| `npx vitest run src/components/filters src/state src/app --no-file-parallelism` | 13 fichiers, 211 tests verts |
| Playwright 4181 : `filtres-d3-46`, `parcours-p1`, `parcours-p2`, `clavier`, `a11y` (3 projets) | **173 verts**, 10 `skip` de plate-forme préexistants, 0 échec (`filtres-d3-46` : 33/33) |

Deux ajustements pendant le rejeu : (i) les titres de carte passent à la ligne au lieu d'être
tronqués (la sonde (b) signalait `text-overflow` comme débordement) ; (ii) `clavier.spec.ts`
`markFocusables` ignore désormais les contrôles d'un `<fieldset disabled>` (hors de l'ordre de
tabulation en HTML ; jamais rendus tant que les groupes restaient repliés), justification D-31 en tête
de la ligne.

## 12. Hors périmètre / pour le coordinateur

1. ~~`market.css` / `distribution.css`~~ : **ratifié** par le coordinateur.
2. ~~Erreur de type `structure-a11y.test.ts:52`~~ : **corrigée** (retouche 4).
3. **ACC-26 `source-fixture` (desktop)** : un échec isolé non reproduit (carte de l'écran E sans la
   mention de source, sauvegarde faite juste après le premier rendu) — probable course dans la
   sauvegarde (écran E / persistance), à surveiller dans la suite complète.
4. **`keyboard-nav.ts#computeBandTabOrder`** modélise encore l'ordre d'avant D3-46 (primaires →
   recherche → groupes → jetons) ; aucun composant ne l'utilise, l'ordre réel est vérifié dans le
   navigateur (`clavier.spec.ts`). Consigné en dette dans le README du dossier ; le mettre à jour
   imposerait d'amender `keyboard-nav.test.ts` et `tests/review/D5/keyboard-band.test.ts`.
5. **`onRecomputeLocal` / `onReload` de la coquille** relancent `reloadMarket` avec la sélection
   d'AVANT l'application (fermeture), en concurrence avec l'effet sur `currentQuery` qui recharge la
   nouvelle : comportement **inchangé** depuis v0.1.0 (l'ordre de départ fait gagner la bonne), mais
   la course existe ; `reloadMarket` n'a pas de numéro de séquence (cf. `projectedSeq`). Recommandé :
   séquencer `reloadMarket` dans `src/app.tsx`.
6. Le « Remplace : … » de chaque exigence amendée cite l'ancien texte ; la maquette ASCII d'en-tête
   de `draft-screens.md` §3 (bandeau « replié 96 px / déplié 320 px ») n'a pas été redessinée.
7. Rien n'est poussé ; branche `ux36/filters` propre, à fusionner (`--no-ff`) puis suite complète.
