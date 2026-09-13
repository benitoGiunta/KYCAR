# fix-screens-4 — remédiation ciblée, constat C-R1-05 (plan 3, phase 3.5)

Worktree `/home/user/KYCAR-screens4`, branche `fix35/screens4`, depuis `claude/kycar-project-ffcplk` @
`2744ed9` (« Plan 3.5 : décision D3-39 ratifie data-fix-2, ouvre C-R1-05… »).

## 1. Constat (coordinateur, D3-39)

`.kycar-market-card-header` (en-tête de carte-marque, écran A) déclare `min-height: 72px`
(`src/screens/market/market.css` l. 123) mais rendait **32 px** sur desktop 1280 et **44 px** sur
mobile 360 (mesuré par `data-fix-2` sur le build de production, `reports/data/data-fix-2.md` §9 (1)).

## 2. Cause — même mécanisme que C-R1-04, sur une déclaration différente

`src/app/app.css` (~l. 536–545 avant correction) posait le plancher de cible tactile `EX-SCR-21`
sur un sélecteur groupé :

```css
.kycar-app button, .kycar-app select, .kycar-app summary, .kycar-app [role='button'],
.kycar-app input[type='search'], .kycar-app input[type='text'], .kycar-app input[type='number'],
.kycar-app label { min-height: 32px; }
```

Spécificité `0-0-2-0` (deux sélecteurs simples par ligne). `.kycar-market-card-header` porte
`role="button"` et n'est qu'**une classe** (`0-0-1-0`) : la règle globale gagnait TOUJOURS, quel que
soit l'ordre des feuilles, et rendait 32 px (large/intermédiaire) ou 44 px (compact, variante
`@media (max-width: 767px)` ~l. 607–618) au lieu de 72 px.

`data-fix-2` avait déjà traité le **même mécanisme** pour `display`/`gap`/`min-width` (constat
C-R1-04), en déplaçant ces propriétés dans `:where(.kycar-app [role='button'])` (spécificité NULLE) —
mais avait **délibérément laissé `min-height` à spécificité ordinaire**, avec ce raisonnement écrit
dans `app.css` :

> « Le PLANCHER DE CIBLE TACTILE ci-dessus (`min-height`) garde en revanche sa spécificité
> ordinaire : `EX-SCR-21` est une exigence d'accessibilité, pas un défaut de mise en page, et un
> composant n'a pas à pouvoir passer dessous. »

Ce raisonnement traite `min-height` comme un **plafond** qu'un composant chercherait à contourner,
alors que c'est un **plancher** : un composant qui déclare une valeur PLUS GRANDE (l'en-tête, 72 px)
ne « passe » jamais dessous, il le dépasse déjà. Le vrai problème est que CSS ne fait pas de `max()`
entre deux déclarations concurrentes de la même propriété — la règle qui gagne remplace entièrement
l'autre, y compris quand elle est plus PETITE que ce que le composant demandait.

## 3. Grep de vérification (justifie le choix de la forme (a))

```
$ grep -rn "role=[\"']button[\"']" src/ --include=*.tsx
src/screens/distribution/Histogram.tsx:234:  role="button"
src/screens/market/MakeCard.tsx:76:        role="button"
src/screens/market/ModelZone.tsx:66:        role="button"
```

Trois porteurs seulement, comme le relevait déjà `data-fix-2` pour C-R1-04 :
- `Histogram.tsx` : le `<rect>` d'une barre SVG — `min-height` n'a aucun effet sur cet élément
  (géométrie SVG, pas un élément de mise en page CSS classique).
- `MakeCard.tsx` : `.kycar-market-card-header`, le sujet du constat.
- `ModelZone.tsx` : `.kycar-market-zone-interactive` — **ne déclare aucun `min-height` propre**
  (vérifié dans `market.css`) ; sa hauteur vient du contenu et du plancher de son parent
  `.kycar-market-zone` (`min-height: 72px` en large, `96px` en compact via `@container`), largement
  au-dessus du seuil tactile. Retirer la spécificité ordinaire du plancher ne change donc rien pour
  cet élément : sans règle concurrente, le plancher `:where()` continue de s'appliquer par défaut.

## 4. Correction retenue — forme (a), `src/app/app.css`

`min-height` rejoint le bloc `:where(.kycar-app [role='button'])` déjà utilisé par C-R1-04 pour
`display`/`min-width`/`gap` (spécificité nulle), dans les deux régimes :

```css
/* bloc de base (large/intermédiaire) */
.kycar-app button, .kycar-app select, .kycar-app summary,
.kycar-app input[type='search'], .kycar-app input[type='text'], .kycar-app input[type='number'],
.kycar-app label { min-height: 32px; }   /* [role='button'] retiré */

:where(.kycar-app [role='button']) {
  min-height: 32px;   /* AJOUTÉ ici */
  min-width: 32px;
  display: inline-flex; align-items: center; justify-content: center;
  gap: var(--space-1, 0.25rem);
}
```

Et symétriquement dans `@media (max-width: 767px)` avec `44px`. Les AUTRES cibles du plancher
(`button`, `select`, `summary`, `input[type=…]`, `label`, `a`, `.kycar-skip-link`) restent à
spécificité ordinaire : le grep de §3 montre qu'aucune d'entre elles n'a de composant réclamant une
hauteur propre supérieure au plancher — rien ne justifiait de leur retirer la garantie.

Le commentaire existant sur `C-R1-04` (qui contenait le raisonnement erroné cité en §2) est corrigé
en place, avec justification écrite (jamais en silence, cf. règle de preuve du plan) : le paragraphe
original est conservé au-dessus (pour la partie encore valide : boîte flex des boutons/rôles) et un
paragraphe `C-R1-05` explique pourquoi le point sur `min-height` était faux et ce qui change.

### Alternative écartée : forme (b)

Cibler l'en-tête avec une spécificité supérieure dans `market.css`
(`.kycar-market-card .kycar-market-card-header[role='button']`, comme l'avait fait `fix-screens-3`
pour le `display: contents` de C-R1-04 avant que `data-fix-2` ne traite la cause à la racine).
Écartée : ce n'est qu'un contournement local, elle laisse `app.css` capable d'écraser silencieusement
tout futur composant `role='button'` qui déclarerait une hauteur propre (le même bug réapparaîtrait
ailleurs, comme C-R1-04 l'a déjà montré deux fois — une fois côté `display`, une fois côté
`min-height`). La forme (a) traite la cause à la source, comme `data-fix-2` l'avait fait pour
`display`/`gap`/`min-width`, et évite d'aggraver `market.css` avec un sélecteur à 3 composants de
plus.

## 5. Vérification des autres cibles tactiles (aucune régression)

`.kycar-market-zone-interactive` (zone-modèle) : pas de `min-height` propre, couverte par défaut par
`:where()` — comportement inchangé (déjà mesuré ≥ seuil car son contenu textuel dépasse largement
32/44 px). `Histogram.tsx` : SVG, `min-height` sans effet, comportement inchangé. Confirmé par
ACC-08 (§8, toujours 0 cible sous seuil sur les trois régimes) et ACC-08bis (0 chevauchement).

## 6. Effet sur la hauteur des cartes (+40 px) et la virtualisation

- **Carte-marque** : en-tête 72 px (au lieu de 32/44) → chaque carte gagne 40 px, conforme au calcul
  normatif `EX-SCR-122` (« à 72 px par zone, 6 zones + 116 px d'en-tête et de résumé + 40 px de pied
  = 588 px ») : 116 px suppose bien 72 px d'en-tête + 44 px de résumé.
- **`src/screens/market/thresholds.ts`** : `COLLAPSED_CARD_HEIGHT_PX = 588` était déjà la valeur
  attendue avec un en-tête à 72 px — **aucun changement nécessaire**, cette constante n'était pas
  fausse, c'est le RENDU qui ne l'atteignait pas. `MODEL_ZONE_HEIGHT_PX = 72` sert uniquement de pas
  de défilement pour la virtualisation interne des zones (`MakeCard.tsx`) et est indépendant de la
  hauteur de l'en-tête — non concerné.
- **`MarketScreen.tsx` (~l. 245–262)** : `gridMetricsRef` n'utilise `COLLAPSED_CARD_HEIGHT_PX` que
  comme valeur d'AMORÇAGE avant le premier rendu ; dès qu'une carte existe dans le DOM, la hauteur de
  rangée est RELUE sur `first.getBoundingClientRect().height` (mesure réelle, corrigée à chaque
  scroll/resize). Aucune constante ne fige 32 px ni l'ancienne hauteur : la virtualisation s'adapte
  d'elle-même à la vraie hauteur (72 px d'en-tête inclus) sans modification de code.
- **Impression** (`src/styles/print.css`, `tests/e2e/impression.spec.ts`) : aucune règle ne cible
  `.kycar-market-card-header` ni ne dépend de sa hauteur (grep négatif) — 21/21 tests toujours verts.
- **Régime compact (`EX-SCR-135`)** : muet sur la hauteur de l'en-tête de carte (relu intégralement,
  l. 1549–1554 : ne mentionne que la zone-modèle qui passe de 72 à 96 px, la barre de synthèse et le
  nombre de modèles visibles). **Hypothèse E4** : la valeur large de `EX-SCR-107` (72 px) s'applique
  donc par défaut à tous les régimes — c'est ce que `market.css` fait déjà (aucune media query ne
  redéfinit `.kycar-market-card-header`), et c'est la valeur attendue par la sonde neuve dans les
  trois régimes.

## 7. Sonde E2E neuve — rouge puis verte

Ajoutée dans `tests/e2e/finition-2.10.spec.ts`, juste après `ACC-08` (même fichier que la mission
demandait, même convention d'attente déterministe D-31 : `.kycar-market-card-header` visible puis
stable 300 ms avant mesure) :

```
test('C-R1-05 — en-tête de carte-marque à 72 px (EX-SCR-107)', …)
```

**État ROUGE**, rejoué contre le build produit avec `app.css` d'AVANT correction (`git stash` du
seul fichier CSS, `npm run build`, `KYCAR_E2E_PORT=4181 npx playwright test … -g "C-R1-05"`) :

```
[MESURE] C-R1-05 — en-tête de carte-marque (large) : 31 en-têtes visibles, hauteur min=32 px (attendu ≥ 72)
[MESURE] C-R1-05 — en-tête de carte-marque (intermediate) : 31 en-têtes visibles, hauteur min=32 px (attendu ≥ 72)
[MESURE] C-R1-05 — en-tête de carte-marque (compact) : 31 en-têtes visibles, hauteur min=44 px (attendu ≥ 72)
3 failed (desktop, tablet, mobile) — Expected: >= 72, Received: 32 / 32 / 44
```

**État VERT**, après restauration de la correction et rebuild :

```
[MESURE] C-R1-05 — en-tête de carte-marque (large) : 31 en-têtes visibles, hauteur min=72 px (attendu ≥ 72)
[MESURE] C-R1-05 — en-tête de carte-marque (intermediate) : 31 en-têtes visibles, hauteur min=72 px (attendu ≥ 72)
[MESURE] C-R1-05 — en-tête de carte-marque (compact) : 31 en-têtes visibles, hauteur min=72 px (attendu ≥ 72)
3 passed
```

## 8. Preuves

| Commande | Sortie (résumé) | Verdict |
|---|---|---|
| `npm run build` | `tsc` app + worker 0 erreur, `vite build` ✓ (dist généré, 384,80 kB JS / 40,39 kB CSS) | PASS |
| `npm run lint` | `eslint .` — aucune sortie, code 0 | PASS |
| `npx vitest run src/screens/market --no-file-parallelism` | 7 fichiers, 151 tests | PASS |
| `npx vitest run --config vitest.review.config.ts tests/review/D6 tests/review/D8 --no-file-parallelism` | 32 fichiers, 297 tests | PASS |
| `KYCAR_E2E_PORT=4181 npx playwright test tests/e2e/finition-2.10.spec.ts -g "C-R1-05"` (état avant correction) | 3 failed (32/32/44 px mesurés, attendu ≥72) | ROUGE attendu |
| `KYCAR_E2E_PORT=4181 npx playwright test tests/e2e/finition-2.10.spec.ts -g "C-R1-05\|ACC-08"` (3 projets) | 8 passed, 1 skipped (ACC-08bis large, attendu — cf. commentaire du test) ; `ACC-08` : 0 cible sous seuil sur les 3 régimes ; `C-R1-05` : min=72 px sur les 3 régimes | PASS |
| `KYCAR_E2E_PORT=4181 npx playwright test tests/e2e/a11y.spec.ts -g "surface A"` (3 projets) | 3 passed, `axe — A /marche : 0 violation` sur les 3 régimes | PASS |
| `KYCAR_E2E_PORT=4181 npx playwright test tests/e2e/impression.spec.ts` (3 projets) | 21 passed | PASS |
| `KYCAR_E2E_PORT=4181 npx playwright test tests/e2e/responsive.spec.ts` (3 projets) | 26 passed, 4 skipped, 3 `test.fail()` (dette D8-15, attendus) | PASS |
| `KYCAR_E2E_PORT=4181 npx playwright test tests/e2e/parcours-p1.spec.ts --project=desktop` | 12 passed | PASS |

Port 4180 vérifié libre (`ss -ltnp | grep 4180`) avant chaque lancement Playwright ; tous les
lancements sur le port dédié 4181. `reports/e2e/results.json` restauré (`git checkout --`) après
chaque run.

## 9. Captures

Dans `reports/remediation-2.8/fix-screens-4/` (build de production, carte Volkswagen, `/marche?body=3&kmto=100000&priceto=20000`) :

- `avant-desktop.png` / `apres-desktop.png` (1280 px) — en-tête compressé (32 px, pastille et texte
  serrés) vs. respiré (72 px, pastille centrée verticalement dans sa hauteur).
- `avant-mobile.png` / `apres-mobile.png` (360 px) — même écart, 44 px vs. 72 px ; la carte affiche
  un modèle de moins dans le même viewport après correction (les 40 px supplémentaires déplacent le
  bas de la troisième zone hors cadre), effet attendu et non testé ici (pas de contrat sur ce qui
  reste visible sans défiler).

## 10. Hypothèses E4

- **EX-SCR-135 muet sur la hauteur de l'en-tête de carte en régime compact** → la valeur large de
  `EX-SCR-107` (72 px) s'applique par défaut à tous les régimes. C'est déjà le comportement produit
  (aucune media query ne redéfinit `.kycar-market-card-header`) et c'est la valeur attendue par la
  sonde neuve dans les trois régimes.
- **`.kycar-market-zone-interactive` (zone-modèle) n'a pas besoin d'un `min-height` propre** : sa
  boîte est dimensionnée par son parent `.kycar-market-zone` (72/96 px) et son contenu textuel ; le
  plancher `:where()` à 32/44 px n'a jamais d'effet visible mesuré dessus (ACC-08 : 0 cible sous
  seuil, aucune régression après le changement).

## 11. Hors périmètre / pour le coordinateur

- **Le plancher `min-height` d'`app.css` reste à spécificité ORDINAIRE pour `button`, `select`,
  `summary`, `input[type=…]`, `label`, `a`, `.kycar-skip-link`** (non touché par cette mission, hors
  `[role='button']`). D'autres feuilles déclarent des `min-height` sur des sélecteurs `button`/
  `select`/`input` de MÊME spécificité (`0-0-2-0`, ex. `.kycar-compare-empty-col button { min-height:
  44px }` dans `src/screens/compare/compare.css`, `.kycar-listings-sort-sheet > button` dans
  `src/screens/listings/listings.css`, `.kycar-scatter-sheet__actions button` dans
  `src/screens/distribution/distribution.css`, `.kycar-filter-band button, …` et `.kycar-compact-sheet
  button, …` dans `src/components/filters/filter-band.css`) : à spécificité égale, c'est l'ORDRE des
  feuilles qui trancherait en cas de conflit. Mesuré : toutes ces valeurs sont déjà ≥ au plancher
  (44 px partout, ou 32 px dans `filter-band.css` — égal au plancher, jamais inférieur), donc AUCUNE
  régression actuelle ; mais le même mécanisme que C-R1-04/C-R1-05 pourrait resurgir si l'une de ces
  feuilles déclarait un jour une valeur PLUS PETITE que le plancher applicable à son régime, ou si
  l'ordre d'import changeait. Repéré, non corrigé : ces fichiers sont hors du périmètre de ce lot
  (`src/screens/compare/`, `src/screens/listings/`, `src/screens/distribution/`,
  `src/components/filters/`), et rien n'y est actuellement cassé.
- **`Histogram.tsx` (`src/screens/distribution/`)** : le `<rect role="button">` de la barre
  d'histogramme est hors écran A (écran B) et hors du périmètre `src/screens/market/` de cette
  mission ; `min-height` n'a de toute façon aucun effet sur un `<rect>` SVG, donc rien à signaler
  côté produit — mentionné ici uniquement parce que le grep du §3 l'a fait remonter comme troisième
  porteur de `role='button'`.
- **Mobile après correction** : la carte-marque affiche un modèle de moins dans le même viewport
  avant de défiler (les 40 px supplémentaires de l'en-tête poussent le bas de la 3ᵉ zone-modèle hors
  cadre initial, visible en comparant `apres-mobile.png` à `avant-mobile.png`). C'est l'effet ATTENDU
  et conforme au calcul normatif (`EX-SCR-122`) plutôt qu'une régression, mais aucune exigence ni
  sonde ne fixe le nombre de zones visibles sans défiler sur mobile avant repli — signalé pour
  information, pas corrigé (pas un défaut).

## 12. Statut

Constat C-R1-05 corrigé à la source dans `src/app/app.css` (forme (a)). Sonde
`tests/e2e/finition-2.10.spec.ts` non modifiée après son écriture initiale (rouge → vert par la seule
correction produit, comme l'exige la règle de preuve). Aucune régression détectée sur ACC-08,
ACC-08bis, l'a11y de la surface A, l'impression, le responsive (D8-15 intact) ou le parcours P1.
Worktree propre après commit, `node_modules` symlink non touché.
