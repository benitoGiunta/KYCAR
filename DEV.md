# KYCAR - guide de developpement (application)

Ce fichier documente l'application (`src/`), pas le cadrage (`docs/`). Il est ecrit et tenu a jour
par les lots de la phase 2.4 (D1-D9), voir `docs/plans/ARCHITECTURE.md` S:7.1 pour le decoupage
normatif.

## Arborescence de `src/`

| Dossier | Lot proprietaire | Contenu |
|---|---|---|
| `src/main.tsx`, `src/app.tsx` | D1 (souche), remplace par D8 | point de montage Preact |
| `src/styles/` | D1 | tokens de design, `@media print` minimale, breakpoints |
| `src/worker/` | D1 (canal PING/PONG) puis D4 (moteur) | Web Worker d'agregation, protocole type |
| `src/types/` | D2 | les 13 entites, colonnes typees, sentinelles, invariants |
| `src/providers/` | D3, D9 (+ futur) | implementations de `DataProvider` (`docs/plans/DataProvider.ts`, fige, non modifie) |
| `src/engine/` | D4 | glue cote thread principal vers le worker, cache LRU |
| `src/state/` | D5 | codec URL, scission T/R, routeur maison, debounce/historique |
| `src/screens/` | D6, D7, D8 | ecrans, chunk differe eventuel (`EX-NFR-11`) |

Chaque dossier vide porte son propre `README.md` qui repete cette table de proprietaire pour le
lot qui l'ouvre en premier.

## Scripts npm

| Script | Effet |
|---|---|
| `npm run dev` | serveur de developpement Vite |
| `npm run build` | `tsc --noEmit` (app, DOM lib) + `tsc --noEmit` (worker, WebWorker lib) + `vite build` -> 0 erreur/0 avertissement TypeScript exige |
| `npm run lint` | ESLint (config plate `eslint.config.js`, `@eslint/js` + `typescript-eslint` recommended) |
| `npm test` | Vitest, un run |
| `npm run size` | garde de budget bundle (`tools/check-bundle-size.mjs`), a lancer apres `npm run build` |

## Lancer l'application (lot D8)

`npm run dev` (ou le lanceur `kycar-dev` de `.claude/launch.json`, port 5173) sert l'app complete.
Le point d'entree `src/main.tsx` assemble le cablage de production : `loadReferenceData()`
(referentiels servis sous `/reference/*` par le plugin Vite `kycar-reference-data`) +
`SyntheticDataProvider` (source SYNTHETIC par defaut, sert mode 1 et mode 2) +
`createAggregationEngine()` (Web Worker) + `DataController`, puis monte la coquille `src/app.tsx`.

Le rendu est une fonction pure du chemin+requete (EX-NAV-18). Routes servies :
`/marche` (ecran A), `/marche/:makeId-:slug/:modelId-:slug` (ecran B, distributions),
`.../annonces` (ecran D), `/comparer` (ecran C), `/recherches` (ecran E), `/suivis` (ecran F),
`/mentions` (page statique). L'ecran G est une modale superposee, pas une route.
La persistance locale vit dans `src/persistence/` (collections CRUD en `localStorage`, cache de
snapshot en IndexedDB).

## Navigateurs cibles (`EX-NFR-17`)

Deux dernieres versions majeures de Chrome, Firefox, Edge et Safari. Aucune des quatre cibles n'a
besoin d'un polyfill pour les APIs utilisees en D1 (Worker modules, `structuredClone` implicite via
`postMessage`, `import.meta.url`).

**Cible de build effective (corrige 2.6, `DR-160`).** `tsconfig.json` fixe `target: "ES2022"`, mais
ce reglage ne gouverne que la **verification de types** par `tsc`, pas la syntaxe reellement emise
par le bundle : le `build.target` **effectif** de Vite/esbuild, non fixe explicitement dans
`vite.config.ts`, vaut par defaut `['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14']`
(mesure : `vite build --debug`). Le plancher de compatibilite reel du bundle est donc **au moins
ES2020**, pas ES2022 natif comme l'affirmait la version precedente de cette section. Aucun impact
fonctionnel constate (aucun plugin de transpilation legacy, aucun polyfill, syntaxe moderne
conservee dans le bundle produit) : c'est une correction de l'enonce, pas un defaut de
compatibilite.

## Points de rupture responsive (`EX-NFR-18`)

Definis une fois dans `src/styles/breakpoints.ts` (constantes + chaines `matchMedia` pretes a
l'emploi) :

- desktop : `>= 1280px`
- tablette : `768px - 1279px`
- mobile : `< 768px`

`EX-NFR-19` : en dessous de 768px, le nuage G4 (D7) degrade en projection 2D plutot que de se
desactiver ; les histogrammes et cartes-marques restent fonctionnels jusqu'a 320px.

## Accessibilite de base (`EX-NFR-12`/`13`/`14`)

- Cible **WCAG 2.1 AA**.
- Les paires de couleurs de `src/styles/tokens.css` sont verifiees par calcul (luminance relative
  WCAG), pas a l'oeil ; le ratio obtenu est note en commentaire a cote de chaque token. Toutes
  depassent 4.5:1 (texte normal) et 3:1 (texte large / element graphique porteur d'information).
- `:focus-visible` pose un indicateur de focus visible en permanence (2px, jamais supprime par un
  composant sans le remplacer par un traitement equivalent) - contrat pour D5-D8.
- Le contrat de classes pour `@media print` (`EX-NFR-31`) est documente en tete de
  `src/styles/print.css` : `.app-header`/`.filter-bar`/`.summary-bar` perdent leur position
  fixe/collante a l'impression, `.status-banner`/`.summary-bar-c3` sont imprimes,
  `.print-filter-summary` (rempli par D5) remplace le bandeau de filtres, tout controle interactif
  et tout element `.no-print` est masque.

## Dependances installees (lot D1)

Voir `package.json`. Volontairement minimal (decision d'architecture S:1.3/1.5 : aucune lib de
graphes tierce, aucune lib de state, aucun routeur tiers) - les lots D2-D9 n'ajoutent que du code
source, pas de nouvelles dependances, sauf necessite imprevue a justifier explicitement au meme
titre qu'un choix d'architecture (`docs/plans/ARCHITECTURE.md` S:8).
