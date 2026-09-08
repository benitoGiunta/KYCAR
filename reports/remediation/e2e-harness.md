# Recette navigateur — rapport de l'agent `e2e-harness` (phase 2.9a)

**Périmètre** : `tests/e2e/**`, `playwright.config.ts`, scripts `test:e2e*`. `src/` en LECTURE SEULE.
**Cible** : le **build de production** (`npm run build` + `vite preview`, port 4180), câblage réel
(`SyntheticDataProvider` 100 000 annonces → `DataController` → **Web Worker** d'agrégation),
Chromium préinstallé (`/opt/pw-browsers/chromium-1194`), trois projets `desktop` 1280 / `tablet` 768
/ `mobile` 360 (`EX-NFR-18`).
**Protocole** : un écart constaté n'est jamais corrigé ici. Il devient un test `test.fail()` annoté
`CONSTAT E2E-<nn>` (jamais `test.skip`) et une ligne de la table du §3, à traiter en phase 2.8.

---

## 1. Ce que cette phase a trouvé et que rien d'autre ne pouvait trouver

Trois familles de défauts n'étaient **structurellement** pas atteignables par les 798 sondes de revue
ni par la suite unitaire, parce qu'elles n'existent qu'au rendu d'un vrai navigateur :

1. **Le lot colonnaire est DÉTACHÉ sur le thread principal.** `src/worker/client.ts::loadDataset`
   transfère les `ArrayBuffer` du `ListingColumnBatch` au Web Worker (liste de `Transferable`). Les
   vues typées restent référencées côté hôte mais leurs tampons sont détachés : toute lecture y rend
   `undefined`, et toute construction de vue y lève. Les sondes hors navigateur pilotent le moteur
   **in-process** (`engine-inprocess.ts`), sans `postMessage`, donc sans transfert, donc sans le
   moindre symptôme. En navigateur, cela met à terre **l'écran D entier**, **le nuage G4**, **huit
   graphes additionnels**, **l'export CSV des annonces** et **la part de particuliers de l'écran B** :
   `E2E-01`, `E2E-02`, `E2E-03`, `E2E-06`, `E2E-07`, `E2E-08`, `E2E-09`, `E2E-10`.
2. **Deux feuilles de style ne sont jamais livrées.** `src/screens/market/market.css` n'a **aucun
   import** dans tout le dépôt, et `src/components/filters/` ne contient **aucun fichier `.css`**. Le
   bundle ne porte, de toute la famille `.kycar-market-*`, que le seul `.kycar-market-toolbar` (défini
   dans `app.css`), et **aucune** règle `.kycar-filter-band`, `.kycar-control` ou `.kycar-screen-g` :
   l'écran A, le bandeau de filtres et l'écran G sont peints par les styles par défaut du navigateur.
   Un test de structure DOM ne peut pas voir cela ; `document.styleSheets` et `getComputedStyle`, si.
   `E2E-20`, `E2E-21` (et, par ricochet, la dette `DR-143` porte sur un fichier mort).
3. **Les corrections d'URL et la prise de focus sont muettes.** `src/app.tsx` lit
   `loadQuery(search).selection` et **jette `.corrections`** ; il appelle `focus()` sur un `h1` qui
   n'est pas focalisable. Aucun des deux n'a d'effet observable hors navigateur. `E2E-14`, `E2E-16`,
   `E2E-26`.

S'y ajoutent quatre constats que seul le rendu réel prononce : le contraste calculé des pastilles de
marque (`E2E-11`), la sémantique ARIA de la modale marque/modèle mesurée par axe (`E2E-12`), le
débordement horizontal du document à 360 px (`E2E-19`), et la **perte d'écriture inter-onglets**
reproduite 7 à 8 fois sur 8 (`E2E-25`).

---

## 2. Inventaire des tests par fichier × projet

Exécution de référence : `npm run test:e2e`, **8 septembre 2026**, les trois projets, un worker
(`fullyParallel: false`), aucune reprise (`retries: 0`). **234 tests · 226 passés · 8 sautés ·
0 échec inattendu · 14 min 50 s.**

| Fichier | desktop 1280 | tablet 768 | mobile 360 |
|---|---|---|---|
| `parcours-p1.spec.ts` | 7 verts + 2 `test.fail()` | 7 verts + 2 `test.fail()` | 7 verts + 1 `test.fail()` + 1 sauté |
| `parcours-p2.spec.ts` | 6 verts + 8 `test.fail()` | 6 verts + 8 `test.fail()` | 5 verts + 6 `test.fail()` + 3 sautés |
| `a11y.spec.ts` | 5 verts + 3 `test.fail()` | 5 verts + 3 `test.fail()` | 5 verts + 3 `test.fail()` |
| `clavier.spec.ts` | 6 verts + 3 `test.fail()` | 6 verts + 3 `test.fail()` | 6 verts + 3 `test.fail()` |
| `responsive.spec.ts` | 6 verts + 1 `test.fail()` + 2 sautés | 6 verts + 1 `test.fail()` + 2 sautés | 5 verts + 4 `test.fail()` |
| `impression.spec.ts` | 4 verts + 3 `test.fail()` | 4 verts + 3 `test.fail()` | 4 verts + 3 `test.fail()` |
| `perf.spec.ts` | 5 verts | 5 verts | 5 verts |
| `persistance.spec.ts` | 8 verts + 2 `test.fail()` | 8 verts + 2 `test.fail()` | 8 verts + 2 `test.fail()` |
| `partage-url.spec.ts` | 6 verts + 1 `test.fail()` | 6 verts + 1 `test.fail()` | 6 verts + 1 `test.fail()` |
| **Total (3 projets)** |   |   | **157 verts + 69 `test.fail()` + 8 sautés + 0 inattendu** |

Le décompte des `test.fail()` (69, pas 78) tient à trois écarts qui ne se manifestent que dans un
régime : `E2E-19` n'échoue qu'en compact (il est un vrai test vert de non-régression à 1280 et 768),
`E2E-17` et `E2E-18` ne sont sautés qu'ailleurs qu'en compact.

Chaque `test.fail()` est un CONSTAT : le test est **rouge par construction** et redeviendra vert
exactement quand l'écart sera corrigé en 2.8. Les `skip` sont **uniquement** des inadéquations de
plate-forme, jamais un masquage :

| Test sauté | Projet(s) | Motif normatif |
|---|---|---|
| `E2E-04` cardinal « modèles » | mobile | `EX-SCR-135` : le cardinal n'existe pas en régime compact |
| brossage du nuage, `E2E-03`, `E2E-06` | mobile | `EX-NFR-19` : sous 768 px le nuage est en projection 2D dégradée, brossage et bascule de projection désactivés PAR CONTRAT |
| `E2E-17`, `E2E-18` | desktop, tablet | ces deux écarts ne portent que sur le régime dégradé / compact |

---

## 3. Constats pour la phase 2.8

Sévérité : **BLOQUANT** = un parcours cible ne se termine pas, ou une statistique lue par
l'utilisateur pour décider est fausse. **MAJEUR** = exigence non tenue. **MINEUR** = le reste.

| Id | Sév. | Exigence | Observation | Preuve (test) | Correction attendue | Répertoire probable |
|---|---|---|---|---|---|---|
| **E2E-01** | BLOQUANT | `EX-SCR-201`..`210` | La route `/annonces` monte la barre d'outils puis lève `TypeError: Cannot perform Construct on a detached ArrayBuffer`. Aucun tableau, aucune pagination, aucun lien sortant : **le parcours cible 2 ne se termine pas**. | `parcours-p2.spec.ts` › `CONSTAT E2E-01` (capture + `pageerror` journalisé) | Ne plus transférer les tampons du lot, ou en garder une copie côté hôte : soit `postMessage` sans liste de `Transferable` (copie structurée), soit `structuredClone` du batch avant `loadDataset`, soit renvoi des tampons par le worker. Le choix engage la mémoire (100 000 annonces) et la perf : arbitrage `fix-lead`. | `src/worker/`, `src/engine/`, `src/orchestration/` |
| **E2E-02** | BLOQUANT | `EX-SCR-151`..`160`, `EX-DATA-99` | Le canvas G4 est **vierge** : 0 pixel encré sur 900×480, `aria-label` « Nuage de 0 points, 0 outliers » sur une cellule de 1 352 annonces. `computeEligibility` lit `priceStatus`/`firstRegistrationYearMonth`/`mileageKm` sur des vues détachées et rejette toutes les lignes. | `parcours-p2.spec.ts` › `CONSTAT E2E-02` (lecture de pixels par `getImageData`) | Même correction qu'`E2E-01`. | `src/worker/`, `src/screens/distribution/` |
| **E2E-03** | MAJEUR | `EX-SCR-152` | L'onglet « Prix × année » du nuage est rendu `disabled`, titre « Nécessite l'année de première immatriculation » : la bascule entre les deux projections est inatteignable. Conséquence directe d'`E2E-02`. | `parcours-p2.spec.ts` › `CONSTAT E2E-03` | Se résout avec `E2E-01`/`E2E-02`. | `src/screens/distribution/` |
| **E2E-04** | MAJEUR | `EX-SCR-106` | La barre de synthèse affiche « 112 marques · **0 modèles** · 2 656 offres » : le cardinal des modèles reste 0 tant qu'aucune carte n'est dépliée, alors que les trois cardinaux doivent être ceux de la **population filtrée**. | `parcours-p1.spec.ts` › `CONSTAT E2E-04` | Soit remonter un cardinal de modèles avec les agrégats de marque, soit afficher le repli « — » déjà prévu par `EX-SCR-132` tant que la valeur n'est pas résolue. Jamais `0`. | `src/screens/market/`, `src/orchestration/` |
| **E2E-05** | MAJEUR | `EX-SCR-107` ligne 1 | Idem sur chaque carte-marque : « 0 modèles · médiane 8 950 € » avant dépliage. | `parcours-p1.spec.ts` › `CONSTAT E2E-05` | Même correction qu'`E2E-04`. | `src/screens/market/` |
| **E2E-06** | BLOQUANT | `EX-SCR-158`, `EX-SCR-184` | Le brossage écrit bien ses bornes dans l'URL (`selx`/`sely`) mais **sélectionne 0 annonce** : « Convertir la sélection en filtre » et « Voir ces annonces » ne sont jamais montés. Le maillon *brosser → filtrer → lister* du parcours 2 est rompu. | `parcours-p2.spec.ts` › `CONSTAT E2E-06` (glisser-déposer réel à la souris) | Se résout avec `E2E-02`. | `src/screens/distribution/` |
| **E2E-07** | BLOQUANT | `EX-SCR-203`, `206`, `208`, `EX-DATA-15` | Aucun contrôle de l'écran D n'est atteignable : pagination de 50, tri mono-colonne, jeton `!` de `DUPLICATE_VALUE_CONFLICT`, bouton « Ouvrir ↗ » vers l'annonce d'origine. Conséquence d'`E2E-01`. | `parcours-p2.spec.ts` › `CONSTAT E2E-07` (interception de `context.on('page')`) | Se résout avec `E2E-01`. À rejouer intégralement en 2.9b. | `src/screens/listings/` |
| **E2E-08** | MAJEUR | `EX-SCR-144`, `EX-NFR-15` | Les tables de données équivalentes de **G5, G8, G9, G10, G12, G13, G14 et G15** ne portent que leur en-tête : zéro ligne. Ces graphes sont calculés sur le thread principal à partir du lot détaché. `EX-NFR-15` (compensation lecteur d'écran) n'est donc pas tenue sur huit graphes. | `parcours-p2.spec.ts` › `CONSTAT E2E-08` | Se résout avec `E2E-01`. | `src/screens/distribution/` |
| **E2E-09** | BLOQUANT | `EX-SCR-142` ligne 2 | L'en-tête de l'écran B annonce « **0 % particuliers** » sur 1 352 annonces : la colonne `sellerType` est lue sur le lot détaché, tous les codes ressortent inconnus. **Statistique affichée fausse**, pas « indisponible ». | `parcours-p2.spec.ts` › `CONSTAT E2E-09` | Se résout avec `E2E-01`. Ajouter un garde : `knownN` ne doit pas compter les lectures `undefined`. | `src/screens/distribution/` |
| **E2E-10** | MAJEUR | `EX-CRUD-16` | « Exporter → Annonces du périmètre (CSV) » sur l'écran B ne déclenche **aucun téléchargement** : `buildListingRow` lève sur le lot détaché, et l'échec n'est **pas dit** à l'utilisateur. | `parcours-p2.spec.ts` › `CONSTAT E2E-10` | Se résout avec `E2E-01` ; ajouter en outre un message d'échec d'export (aucun `try/catch` autour de `download`). | `src/screens/distribution/`, `src/screens/listings/` |
| **E2E-11** | MAJEUR | `EX-NFR-13`, `EX-NFR-16` | axe-core : `color-contrast` [serious] sur **16 nœuds** de l'écran A — les pastilles `.kycar-market-badge`, texte `#14171c` sur fonds de teinte générés par marque : **3,19:1 à 4,15:1** mesurés pour un seuil de 4,5:1. | `a11y.spec.ts` › `CONSTAT E2E-11` | Assombrir la rampe de teintes des pastilles, ou passer le texte en blanc avec un fond dont le contraste est calculé (les jetons de `tokens.css` documentent déjà des ratios calculés, pas estimés). | `src/screens/market/`, `src/styles/` |
| **E2E-12** | MAJEUR | `EX-NFR-16`, `EX-SCR-215` | axe-core sur la modale marque/modèle : `aria-allowed-attr` [critical] ×82 (`aria-setsize` porté par le `ul[role=listbox]`, `aria-selected` porté par les `button` de ligne) et `nested-interactive` [serious] ×80 (`button` focalisable dans un `li[role=option]`). L'« équivalent accessible du fenêtrage » viole la sémantique `listbox`/`option`. | `a11y.spec.ts` › `CONSTAT E2E-12` | Porter `aria-selected` sur le `li[role=option]` lui-même et supprimer le `button` interne (rendre l'option activable par le `li`), ou abandonner `role=listbox` pour une liste de boutons avec `aria-current`. `aria-setsize` va sur chaque option, jamais sur le conteneur. | `src/components/filters/` |
| **E2E-13** | MAJEUR | `EX-NFR-16` | La surface **D** ne peut pas être balayée : la route ne monte que la barre d'outils (`E2E-01`), un balayage axe y renverrait « 0 violation » sur une page vide. **Verdict d'accessibilité NON PRONONÇABLE sur D** tant qu'`E2E-01` n'est pas corrigé. | `a11y.spec.ts` › `CONSTAT E2E-13` | Se résout avec `E2E-01`, puis rejouer le balayage en 2.9b. | — (dépendance) |
| **E2E-14** | MAJEUR | `EX-SCR-216`, `EX-NFR-14` | À la fermeture de l'écran G (`Échap` ou « Annuler »), le focus retombe sur `<body>` au lieu de revenir au bouton appelant. `ScreenG.tsx` documente explicitement cette restitution comme « laissée à l'appelant, point d'intégration pour D8 » — et **aucun appelant ne l'implémente** (ni `MarketScreen`, ni `FilterBand`). | `clavier.spec.ts` › `CONSTAT E2E-14` | Mémoriser l'élément déclencheur à l'ouverture et le refocaliser à la fermeture, dans les deux appelants. | `src/screens/market/`, `src/components/filters/` |
| **E2E-15** | MINEUR | `EX-NFR-12` | L'écran A ne porte **aucun `h1`** dans `#kycar-main` (les six autres vues en portent un) : la prise de focus après navigation retombe sur la `div` conteneur, qui n'annonce rien. | `clavier.spec.ts` › `CONSTAT E2E-15` | Ajouter un `h1` à l'écran A (« Survol du marché », le titre que `VIEW_TITLES` connaît déjà). | `src/screens/market/` |
| **E2E-16** | MAJEUR | `EX-NFR-12`, `DR-101` | `src/app.tsx` appelle `focus()` sur le `h1` du contenu, qui **n'est pas focalisable** (aucun `tabindex`) : l'appel est sans effet. Au chargement direct de C/E/F/`/mentions` le focus reste sur `<body>` ; après une navigation interne il reste **sur le lien cliqué**. Seules les vues sans `h1` au moment de l'effet reçoivent le repli sur `#kycar-main`. | `clavier.spec.ts` › `CONSTAT E2E-16` | Poser `tabIndex={-1}` sur le `h1` visé avant de le focaliser, ou focaliser systématiquement `#kycar-main` (déjà `tabIndex={-1}`) et laisser le `h1` au lecteur d'écran. | `src/app*` |
| **E2E-17** | MAJEUR | `EX-NFR-19`, `EX-SCR-154` | Régime dégradé (< 768 px) : les axes sont bien prix × kilométrage, mais `scatter-render.ts` applique `RAMP_B_MILEAGE` — la couleur encode le **kilométrage, déjà porté par l'axe X** — au lieu de `RAMP_A_YEAR` qu'`EX-NFR-19` exige (« année encodée par couleur »). De plus `ScatterCloud` **retire toute la légende** quand `degraded` est vrai : l'encodage devient illisible. | `responsive.spec.ts` › `CONSTAT E2E-17` (projet `mobile`) | Choisir la rampe ANNÉE quand `degraded`, et conserver la légende de couleur (elle peut passer sous le nuage plutôt qu'à sa droite). | `src/screens/distribution/` |
| **E2E-18** | MINEUR | `EX-SCR-122`, `EX-SCR-135` | `MakeCard` code en dur « − Réduire à **6** modèles » (`Math.min(modelZones.length, 6)`) alors que `MODELS_VISIBLE_BEFORE_COLLAPSE` vaut **4** en compact. Le repli lui-même est correct (4 zones mesurées) : seul le libellé ment. | `responsive.spec.ts` › `CONSTAT E2E-18` (projet `mobile`) | Utiliser `MODELS_VISIBLE_BEFORE_COLLAPSE[regime]` dans le libellé. | `src/screens/market/` |
| **E2E-19** | MAJEUR | `EX-NFR-19`, `EX-SCR-183` | À 360 px, l'écran B **déborde le document de 50 px** (`scrollWidth` 410 pour `clientWidth` 360) : `.kycar-graph-grid` déclare `grid-template-columns: 1fr`, dont le minimum implicite est `min-content` (378 px, imposé par le `minWidthPx` de 320/360 px des graphes additionnels), au lieu de `minmax(0, 1fr)`. Le défilement horizontal remonte à la page au lieu de rester dans `.kycar-graph-body`. | `responsive.spec.ts` › `CONSTAT E2E-19` (projet `mobile`) | `grid-template-columns: minmax(0, 1fr)` dans le bloc compact de `distribution.css`. | `src/screens/distribution/` |
| **E2E-20** | MAJEUR | `EX-NFR-31` règle 1, `EX-SCR-105`/`106`/`107`/`135` | **`src/screens/market/market.css` n'est importé nulle part** : aucune de ses règles n'est dans le bundle (`document.styleSheets` ne connaît aucun sélecteur `.kycar-market-summary-bar`). L'écran A est rendu sans sa feuille : barre de synthèse non collante et sans hauteur de 44 px, grille de cartes, mise en page compacte des zones-modèles. La dette `DR-143` porte donc sur un fichier mort. | `impression.spec.ts` › `CONSTAT E2E-20` | Ajouter `import './market.css'` dans `MarketScreen.tsx` (comme `distribution.css` et `listings.css` le font déjà), puis **rejouer** `DR-143` et tout le §5 de `draft-screens.md`. | `src/screens/market/` |
| **E2E-21** | MAJEUR | `EX-SCR-89`..`98`, `EX-SCR-215` | **`src/components/filters/` ne contient aucun fichier `.css`** : aucune règle ne cible `.kycar-filter-band`, `.kycar-control` ni `.kycar-screen-g`. Le bandeau (hauteur repliée 132 px, 5 puis 4 lignes de contrôles en compact) et la modale marque/modèle sont peints par les seuls styles par défaut du navigateur — le §6 de `draft-screens.md` n'est vérifiable sur aucune largeur. | `responsive.spec.ts` › `CONSTAT E2E-21` | Écrire la feuille du bandeau et de l'écran G, ou consigner la dette explicitement (elle ne l'est nulle part aujourd'hui). | `src/components/filters/` |
| **E2E-22** | MAJEUR | `EX-NFR-31` règle 3 | Le paragraphe `.print-filter-summary` est un **enfant de `.filter-bar`**, que la même feuille met en `display:none` à l'impression : un ancêtre masqué masque sa descendance, la règle `.print-filter-summary { display: block }` ne peut pas la rattraper. À l'impression, le bandeau disparaît **sans être remplacé**. | `impression.spec.ts` › `CONSTAT E2E-22` (`emulateMedia({ media: 'print' })`) | Sortir le résumé du `.filter-bar` (frère, pas enfant), ou masquer le contenu du bandeau plutôt que le bandeau lui-même. | `src/app*`, `src/styles/print.css` |
| **E2E-23** | MINEUR | `EX-NFR-31` règle 3 | Le résumé imprimé vaut « Filtres actifs : `body=3 · kmto=100000 · priceto=20000` » : **une seule ligne**, en noms de **paramètres d'URL**, alors que la règle demande « un résumé textuel des filtres actifs, **un par ligne** » et que les jetons du bandeau savent déjà dire « Carrosserie : Coupé » (`EX-SCR-75`). | `impression.spec.ts` › `CONSTAT E2E-23` | Construire le résumé depuis le même modèle que les jetons (`band-model.ts`), un filtre par ligne. | `src/app*` |
| **E2E-24** | MAJEUR | `EX-CRUD-1`, `EX-CRUD-3` | `src/app.tsx` appelle `stores.saved.hasDuplicateName(nom)` **après** `stores.saved.create(...)` : l'entrée qui vient d'être créée compte comme son propre doublon. Le message « Recherche enregistrée (un nom identique existait déjà). » s'affiche donc à **chaque** enregistrement, même sur une collection vide. L'avertissement d'homonymie devient du bruit. | `persistance.spec.ts` › `CONSTAT E2E-24` | Évaluer `hasDuplicateName` **avant** `create`, sur l'état antérieur. | `src/app*` |
| **E2E-25** | MAJEUR | `EX-CRUD-19`, `ADV-13` | Deux onglets qui enregistrent **au même instant** perdent une entrée : les deux blobs sont écrits, mais l'**index ordonné n'en cite qu'un**. `CappedCollection.mutate` relit l'index (étape 3) puis le réécrit, et cette lecture-écriture n'est pas atomique entre deux processus de rendu ; le dernier écrivain efface l'identifiant du premier. L'entrée orpheline n'est **jamais réindexée** : la recherche disparaît définitivement de l'écran E, sans message. Mesuré **7 à 8 rondes perdantes sur 8**, sur les trois projets ; après huit rondes, 16 blobs pour 11 à 13 identifiants indexés. | `persistance.spec.ts` › `CONSTAT E2E-25` (deux pages du même contexte, huit rondes) | Rendre l'index auto-réparateur : à la lecture, réconcilier l'index avec les clés `kycar:<collection>/*` réellement présentes (aucune entrée existante ne peut alors être perdue par une course sur l'index). Le verrou `navigator.locks` reste écarté par `EX-CRUD-19` ; l'amendement de l'exigence, s'il est jugé nécessaire, est une décision de `fix-lead`. | `src/persistence/` |
| **E2E-26** | MAJEUR | `EX-NAV-21`, `EX-NAV-22`, `ET-URL-CORRIGEE` (`EX-SCR-38bis`) | `src/app.tsx` appelle `loadQuery(location.search)` mais n'en lit que `.selection` : la liste `.corrections` est **jetée**. Aucune des quatre classes de défaut ne produit le bandeau, et **l'URL n'est jamais réécrite par `replaceState`**. Mesuré : `pricefrom=20000&priceto=5000` → 48 786 offres calculées sur l'intervalle **permuté** alors que la barre d'adresse garde l'intervalle inversé ; `body=ZZZ`, `priceto=99999999` (écrêté à 100 000) et `zzzz=1` sont ignorés en silence. | `partage-url.spec.ts` › `CONSTAT E2E-26` (les quatre classes en une passe) | Remonter `corrections` de `loadQuery` jusqu'à la coquille, afficher le bandeau `ET-URL-CORRIGEE` au format normatif (`Paramètre « <nom> » corrigé : <nature>, valeur retenue <valeur>`) et réécrire la requête canonique par `replaceState`. | `src/app*`, `src/state/` |

**Récapitulatif** : 5 BLOQUANT, 18 MAJEUR, 3 MINEUR — **26 constats**, dont **8** partagent une seule
cause racine (`E2E-01`) et **2** une autre (`E2E-20`/`E2E-21`, feuilles non livrées).

**Arbitrage de sévérité signalé** : `E2E-04`/`E2E-05` affichent une valeur fausse (`0 modèles`), ce
que la règle de sévérité classerait BLOQUANT. Ils sont classés MAJEUR parce qu'il s'agit d'un
cardinal **non encore résolu** pour lequel l'application dispose déjà d'un repli documenté (`—`,
`EX-SCR-132`) qu'elle n'applique pas — exigence non tenue plutôt que statistique fausse. `fix-lead`
peut relever ce classement.

---

## 4. Mesures publiées

### 4.1 `EX-NFR-9` — premier affichage utile en 4G simulée (≤ 2 000 ms, p95)

CDP `Network.emulateNetworkConditions` au **profil normatif** (`≈ 4 Mb/s`, latence **150 ms**), cache
navigateur **vidé et désactivé**, cinq mesures par projet ; on publie la série, la médiane et le
maximum (le budget est un p95 ; sur une machine partagée — le serveur `vite preview` tourne sur le
même hôte — la médiane est l'estimateur stable).

| Projet | `/marche` nu | `/marche` déjà filtré (lien partagé) |
|---|---|---|
| desktop | 1495 / 1489 / 1493 / 1494 / 1493 ms — **médiane 1 493 ms**, max 1 495 | 1638 / 1589 / 1623 / 1569 / 1564 — **médiane 1 589 ms**, max 1 638 |
| tablet | 1512 / 1500 / 1488 / 1501 / 1491 — **médiane 1 500 ms**, max 1 512 | 1508 / 1558 / 1548 / 1577 / 1575 — **médiane 1 558 ms**, max 1 577 |
| mobile | 1522 / 1506 / 1492 / 1488 / 1490 — **médiane 1 492 ms**, max 1 522 | 1596 / 1622 / 1614 / 1559 / 1617 — **médiane 1 614 ms**, max 1 622 |

Transfert mesuré au premier affichage, cache vide : **195 Kio** (`dist` + `dist/reference/`).

**Verdict** : budget **tenu sur les trois projets**, dans les deux cas d'usage. **Réserve** : sur une
URL déjà filtrée (le lien partagé, qui impose au démarrage un balayage moteur des 100 000 annonces),
la marge tombe à ~390 ms. Pendant la mise au point du harnais, sur un hôte plus chargé, des mesures
isolées à **1 838 ms** et **2 136 ms** ont été relevées sur ce même cas : la marge est réelle mais
mince, à re-mesurer en 2.9b.

### 4.2 `EX-NFR-7` — rendu du nuage (≤ 500 ms, p95)

La mesure porte sur le **repeint** du nuage une fois les données prêtes (changement de facteur de
zoom, deux `requestAnimationFrame` pour garantir la trame peinte), pas sur l'entrée en mode 2.

| Projet | Repeint du nuage (5 mesures) | Entrée en mode 2 complète (repère) |
|---|---|---|
| desktop | 31 / 21 / 24 / 25 / 24 ms — **médiane 24 ms** | 1 680 ms |
| tablet | 23 / 19 / 24 / 24 / 33 ms — **médiane 24 ms** | 1 646 ms |
| mobile | 4 / 22 / 24 / 25 / 23 ms — **médiane 23 ms** | 2 188 ms |

**Verdict** : budget tenu, mais la mesure **n'est pas représentative** tant qu'`E2E-02` laisse le
nuage à **0 point tracé** : le coût réel de 1 352 (et jusqu'à 5 000) points n'est pas mesuré. À
reprendre en 2.9b après correction.

### 4.3 `EX-NFR-8` — interaction continue de 10 s (`ARB-38`)

Zoom programmé + balayage du pointeur sur le nuage pendant 10 s, horodatages `requestAnimationFrame`
collectés **dans la page**, fenêtres glissantes d'une seconde au pas de 100 ms.

| Projet | Trames | Fenêtres d'1 s | Fenêtres en défaut (< 30 img/s) | Débit minimal | Gestes |
|---|---|---|---|---|---|
| desktop | 604 | 91 | **0** | **58,0 img/s** | 46 |
| tablet | 609 | 92 | **0** | **59,0 img/s** | 46 |
| mobile | 601 | 90 | **0** | **59,0 img/s** | 46 |

**Verdict** : seuil tenu (0 fenêtre en défaut, plancher ≈ 57-60 img/s), **même réserve qu'en 4.2** :
un nuage vide ne coûte rien à repeindre.

### 4.4 `EX-NFR-6` — rendu d'un histogramme (≤ 300 ms, p95)

Repeint pur d'un histogramme (bascule d'échelle log de G1 sur la cellule Opel Corsa, 1 352 annonces),
cinq mesures par projet.

| Projet | Mesures | Médiane | Max |
|---|---|---|---|
| desktop | 82 / 55 / 78 / 59 / 71 ms | **71 ms** | 82 ms |
| tablet | 83 / 59 / 71 / 80 / 64 ms | **71 ms** | 83 ms |
| mobile | 95 / 61 / 49 / 64 / 41 ms | **61 ms** | 95 ms |

**Prémisse signalée** : `EX-NFR-6` parle d'« un histogramme **jusqu'à 100 000 annonces en entrée** ».
Cette situation **n'existe pas dans le produit** : `O17` élague au couple marque/modèle avant le
moteur, et la plus grosse cellule du snapshot de référence porte **1 352** annonces. Le budget est
donc mesuré sur ce maximum réel, et le chiffre de 100 000 de l'exigence est sans objet — à amender ou
à motiver en 2.8.

### 4.5 `EX-NFR-16` — axe-core par surface

Balayage de la page entière (en-tête, bandeau, contenu, pied), tags `wcag2a`, `wcag2aa`, `wcag21a`,
`wcag21aa`, identique sur les trois projets.

| Surface | Violations | Règles (impact × nœuds) |
|---|---|---|
| **A** `/marche` | **1** | `color-contrast` [serious] ×16 → `E2E-11` |
| **B** distribution | 0 | — |
| **D** annonces | *non prononçable* | l'écran ne rend pas → `E2E-13` |
| **C** `/comparer` | 0 | — |
| **E** `/recherches` | 0 | — |
| **F** `/suivis` | 0 | — |
| **G** modale marque/modèle | **2** | `aria-allowed-attr` [critical] ×82, `nested-interactive` [serious] ×80 → `E2E-12` |
| `/mentions` | 0 | — |

**Verdict `EX-NFR-16`** : **non tenue**. Deux surfaces sur huit portent des violations A/AA, une
huitième n'est pas prononçable. Aucune exception n'est demandée : les trois règles sont corrigeables.

### 4.6 Autres mesures relevées

| Mesure | Valeur |
|---|---|
| `EX-NFR-18` régime déclaré par l'application | `large` à 1280, `intermediate` à 768, `compact` à 360 — conforme |
| Transfert au premier affichage | **195 Kio** (`dist` + référentiels), cache vide |
| Effectifs du parcours 1 | 112 marques · 2 656 offres — **identiques à la vérité terrain D8** |
| Effectifs du parcours 2 | Opel Corsa 1 352 annonces ; 54 en 2017 — **identiques à la vérité terrain D8** |
| Export CSV écran A | `kycar_agregats-mode1_<snapshot>_<date>.csv`, 3 lignes d'en-tête + en-tête de 15 colonnes exact, **68 lignes**, aucun champ R3 |
| Clavier — ligne primaire du bandeau | **70 contrôles tabulables sur 70** atteints, dans l'ordre du DOM |
| `EX-CRUD-19` — rondes d'écriture simultanée perdantes | **7 à 8 sur 8** par projet → `E2E-25` |

---

## 5. Ce qui est VERT et fait désormais garde de non-régression

- **Parcours 1 de bout en bout** : pose des filtres par le bandeau réel, URL canonique
  `?body=3&kmto=100000&priceto=20000` (`EX-NAV-9`), effectifs conformes à la vérité terrain, jetons de
  filtres avec leur valeur (`EX-SCR-75`), fourchettes étiquetées « fourchette centrale (90 % des
  offres) », tri par champ et par sens, export CSV réel, recalcul d'un filtre R **sans rechargement**,
  retour arrière (`EX-NAV-12`/`13`).
- **`EX-SRCH-18bis`** : `cy` n'est jamais exposé comme filtre, jamais compté dans le badge, jamais
  sérialisé dans l'URL — le périmètre belge est celui du snapshot (`be-synthetic-…`).
- **`ARB-09`/`EX-SCR-149`** : un clic sur une barre d'histogramme pose l'intervalle **réel** et Σ se
  recalcule sur cette barre.
- **`EX-NFR-15`** : G1–G3 portent chacun leur table de données équivalente, dépliable au clavier, avec
  autant de lignes que de barres.
- **`EX-NAV-18`** : une URL produite par l'interface, rouverte dans un **contexte navigateur neuf**
  (profil vierge), rend le même écran — mêmes effectifs, mêmes jetons, même projection, mêmes bornes
  de brossage. Idem en mode 2.
- **`EX-NAV-11`** : au-delà de 2 000 caractères la modification est refusée avec son message exact, le
  contrôle revient à son état, l'URL n'est jamais tronquée.
- **`EX-SCR-140`/`DR-099`** : `/`, `/modele/:makeId/:modelId` et un slug erroné sont canonisés par
  `replaceState` (aucune entrée d'historique ajoutée), la requête est conservée mot pour mot.
- **`EX-NAV-19`/`20`** : écrans d'erreur nommés, avec retour au marché **filtres conservés**.
- **`EX-NFR-31`** règles 1, 2 et 4 : l'en-tête collant passe en `static`, les bandeaux d'état et le
  bandeau `C3` sont imprimés, **zéro** contrôle interactif n'atteint le papier.
- **`EX-NFR-18`/`19`** : régimes conformes aux trois points de rupture, cartes-marques et histogrammes
  fonctionnels à 360 px, repli des zones-modèles à 6 (4 en compact), nuage servi en projection
  dégradée plutôt que désactivé.
- **`EX-NFR-14`** : lien d'évitement premier arrêt tabulable, indicateur de focus jamais supprimé,
  100 % des contrôles de la ligne primaire atteints dans l'ordre visuel, piège de focus de l'écran G
  étanche sur douze tabulations, `Échap` ferme sans appliquer ni toucher l'URL.
- **`EX-CRUD`** : écriture par entrée + index, `dernier_accès_le` mis à jour à l'ouverture sans
  toucher aux valeurs figées d'`ARB-45`, les deux plafonds refusent avec leur message exact et sans
  dépassement, survie au rechargement, blob illisible préservé sous `kycar:saved-searches.corrupt`,
  réconciliation inter-onglets **sans rechargement** sur des écritures séquentielles.

---

## 6. Limites connues du harnais

1. **Un seul moteur.** `EX-NFR-17` vise les deux dernières versions majeures de Chrome, Firefox, Edge
   et Safari. L'environnement ne fournit **que Chromium** (`/opt/pw-browsers/chromium-1194`) et
   `playwright install` est interdit (E5). Firefox et WebKit ne sont donc **pas** couverts : tout
   constat de rendu (contraste, impression, grille CSS) est prononcé sur Chromium seul.
2. **`EX-NFR-7`/`8` non représentatifs.** Tant qu'`E2E-02` laisse le nuage à 0 point, ces deux budgets
   mesurent le coût d'un canvas vide. Les chiffres publiés sont des **planchers**, pas des verdicts.
3. **Machine partagée.** Le serveur `vite preview` et le navigateur tournent sur le même hôte que la
   suite ; les mesures `EX-NFR-9` portent donc une variance de ±300 ms. Les budgets sont évalués sur
   la **médiane de cinq mesures**, la série complète étant publiée pour que la marge reste lisible.
4. **`EX-CRUD-19` est une course.** La fenêtre est de quelques microsecondes ; `E2E-25` la sollicite
   huit fois pour rendre la détection quasi certaine (7-8 échecs sur 8 observés à chaque exécution),
   mais la sonde reste **probabiliste par nature** — elle ne peut pas être rendue déterministe sans
   instrumenter `src/`, ce que la phase interdit.
5. **`EX-NFR-13` n'est couvert que par `color-contrast`.** axe n'évalue pas le contraste du **texte
   peint dans un canvas** (le nuage G4) ni celui des marqueurs SVG contre leur fond : la clause
   « éléments graphiques porteurs d'information » d'`EX-NFR-13` reste **partiellement** vérifiée.
6. **Le snapshot est SYNTHÉTIQUE.** Tous les effectifs cités sont ceux du `SyntheticDataProvider`
   (100 000 annonces, graine fixe). Ils sont reproductibles et confrontés à la vérité terrain D8, mais
   ne disent rien du comportement sur une source réelle (`EX-DATA-107`, dette externe `DR-112`).
7. **Pas de mesure de mémoire.** Aucun budget mémoire n'étant opposable dans les exigences, le harnais
   n'en mesure aucune ; la correction d'`E2E-01` (ne plus transférer, donc copier les tampons) en
   créera peut-être le besoin.
8. **`test.fail()` sur une chaîne de causes.** Huit constats découlent d'`E2E-01` : ils redeviendront
   verts **ensemble**. Si l'un reste rouge après la correction du transfert, c'est un défaut propre à
   isoler, pas un résidu.

---

## 7. Comment rejouer

```bash
cd <worktree>
npm run build                 # dist/ + dist/reference/ (le webServer de Playwright le fait aussi)
npm run test:e2e              # les trois projets, 15 min
npx playwright test tests/e2e/<fichier> --project=desktop      # un fichier, un projet
npm run test:e2e:report       # rapport HTML du dernier run
```

Le serveur est démarré par `playwright.config.ts` (`webServer`, `reuseExistingServer: true`) sur le
port **4180** (`KYCAR_E2E_PORT` pour en changer). Le Chromium est détecté par `executablePath`
(`KYCAR_CHROMIUM` prioritaire) : **jamais** de `playwright install`. Les résultats JSON sont écrits
dans `reports/e2e/results.json`, les traces et captures d'échec dans `test-results/` (ignoré).
