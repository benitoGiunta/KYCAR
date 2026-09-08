# fix-app — vague F2 de la phase 2.8

**Agent `fix-app` (Opus, effort high), 2026-09-08. Arbre principal `/home/user/KYCAR`, branche
`claude/kycar-project-ffcplk`, tous les clusters F1 fusionnés.** Périmètre d'écriture : `src/app.tsx`,
`src/main.tsx`, `src/app/`, `src/orchestration/`, `src/persistence/`, `src/worker/client.ts`
(autorisation explicite D8-01), `src/styles/print.css`, `src/app/app.css`, `src/screens/**` pour le
seul branchement de props existantes (+ `src/screens/outlier-index.ts` et le prop `recalculating` de
`DistributionScreen.tsx`, tous deux nommément mandatés), `index.html`, `tests/review/D8/`,
`tests/e2e/**`. Interface `src/providers/DataProvider.ts` : **non modifiée**.

Mandat : `FIX-LEAD-DECISIONS-2.8.md` **D8-01, D8-02, D8-03, D8-04a-c, D8-05, D8-06** (redirections,
bandeau sur C, doublon C3), **D8-14, D8-15, D8-20, D8-24, D8-26**, plus les constats `E2E-01…10`,
`13`, `16`, `22`, `23`, `24`, `25`, `26` de `reports/remediation/e2e-harness.md`.

---

## 1. Constat → correction → preuve → statut

| # | Constat | Correction (fichiers) | Preuve : rouge → vert | Statut |
|---|---|---|---|---|
| 1 | **D8-01 / FV-01 / E2E-01, 02, 03, 06, 07, 08, 09, 10, 13** (BLOQUANT) — `loadDataset` transférait les `ArrayBuffer` de TOUTES les colonnes du `ListingColumnBatch` : côté hôte les tampons étaient DÉTACHÉS. Écran D entier mort (`Cannot perform Construct on a detached ArrayBuffer`), nuage G4 vierge, huit graphes additionnels sans données, export CSV muet, « 0 % particuliers » **faux** | `src/worker/client.ts` : la fonction `batchTransferables` est **supprimée**, `send()` n'accepte plus de liste de transfert, `postMessage` clone structurellement | **Sonde node neuve** `src/worker/client.structured-copy.test.ts` (4 cas, `node:worker_threads` + `structuredClone`) : le cas « AVEC liste de transfert » **atteste le défaut** (tampons de l'hôte à `byteLength = 0`, construction de vue qui lève), le cas « SANS » atteste la correction. **E2E** : `parcours-p2.spec.ts` — les 8 `test.fail()` retirés après rejeu vert (`14/14` desktop) | **FAIT** |
| 2 | **D8-02 / FV-02 / E2E-04, E2E-05** (BLOQUANT) — `loadMarket` ne chargeait que les agrégats de marque : barre de synthèse « 0 modèles », aucune zone-modèle avant clic (densité `EX-SCR-22` = 0 zone) | `src/orchestration/data-controller.ts` : `loadAllModels(selection)` — UN `fetchAggregates(level='MODEL')` de portée marché, regroupé par `makeId`. `src/app.tsx` : effet SÉPARÉ, déclenché APRÈS `loadMarket` (le premier affichage utile reste servi par les seuls agrégats de marque, `EX-NFR-9`), fusion non destructive dans `modelsByMake` | **E2E** `parcours-p1.spec.ts::E2E-04` et `E2E-05` : `test.fail()` retirés après rejeu vert. Mesure : « 107 marques · 908 modèles · 2 632 offres » là où l'on lisait « 107 marques · 0 modèles » | **FAIT** |
| 3 | **D8-03 / FV-03 / E2E-26** — `app.tsx` lisait `loadQuery(search).selection` et **jetait** `.corrections` : URL fautive corrigée en mémoire, ni réécrite ni signalée | `src/app.tsx` : `parsedQuery` (selection + uiState + corrections), effet de canonisation (`replaceState` vers la requête canonique, état d'interface préservé) et bandeau `ET-URL-CORRIGEE` au format normatif `EX-SCR-38bis` (≤ 3 lignes puis « et k autres »), durée de vie jusqu'au prochain changement de filtre | **E2E** `partage-url.spec.ts::E2E-26` (les 4 classes de défaut en une passe) : `test.fail()` retiré après rejeu vert | **FAIT** |
| 4 | **D8-04a / FV-04(a)** (`EX-SCR-110`) — le clic sur l'en-tête de carte DÉPLIAIT au lieu de poser `mmmv` | `src/app.tsx` : `onSelectMake` → `applyMode1Query({ …selection, makesModelsVariants: String(makeId) })` | **E2E** `responsive.spec.ts` « les cartes-marques restent pleinement fonctionnelles » : sonde adaptée (D-31, §4) — le dépliage passe par le bouton de pied de carte, seul contrôle de repli (`EX-SCR-122`) | **FAIT** |
| 5 | **D8-04b / FV-04(b)** (`EX-SCR-104`) — un `mmmv` portant un couple complet ne redirigeait pas vers B | `src/app.tsx` : `completeMmmvPair()` + effet de redirection ; un `mmmv` réduit à la marque (`make\|\|\|`, `D-09`) reste un filtre d'écran A | Sonde statique `tests/review/D8/shell-static.test.ts` (câblage) + non-régression E2E `partage-url` / `parcours-p1` verts | **FAIT** |
| 6 | **D8-04c / FV-04(c)** (`EX-NAV-16`, `D-09`) — le retour B → A réinjectait `make\|model` | `src/app.tsx` : `marketUrlFrom({ makeId: view.makeId })`, sans `modelId` | `partage-url.spec.ts` « retour au marché, filtres conservés » vert | **FAIT** |
| 7 | **D8-05 / FV-06** (`EX-SCR-65`/`89`/`90`, `EX-DATA-110bis`) — les `FacetCount` du moteur n'atteignaient jamais `CheckboxList` | `data-controller.ts::computeFacets` + `refine-predicates.ts::FACET_FILTER_SPECS` (dérivé de la MÊME table `ENUM_FILTERS` que les prédicats) ; `app.tsx` : calcul DIFFÉRÉ de 100 ms, `facetCounts` + `facetCountsPending` passés à `FilterBand` | `npx tsc` + `npm run test:unit` verts ; portée documentée au §3 | **FAIT (mode 2)** — voir §3, limite O17 |
| 8 | **D8-05 / FV-05** (`EX-SCR-216`) — l'écran G affichait « — » sur chaque entrée | `app.tsx` : `screenGMakeCounts` (agrégats de marque courants) et `screenGModelCounts` (`modelKey`, agrégats-modèles de D8-02) | `clavier.spec.ts` « écran G : ouverture au clavier… » vert ; `a11y.spec.ts::E2E-12` vert | **FAIT** |
| 9 | **D8-05 / FV-23** (`EX-SCR-78`, `EX-SCR-46`) — compteur de la zone (4) non alimenté, double compteur du fil d'Ariane inexistant | `data-controller.ts` : `marketSelectionCount` (le `selectionCount` publié par le provider, `null` dès qu'un filtre n'est pas appliqué — jamais un plancher présenté comme un effectif). `app.tsx` : `resultCount`/`resultCountLoading` vers `FilterBand` ; `countWithoutTaxonomy` (`withoutTaxonomy(selection)` → `countForSelection`) et rendu « `<n>` offres \| `<n>` ici » sous le fil d'Ariane | `impression.spec.ts`, `parcours-p1.spec.ts` verts ; valeurs relevées au §5 | **FAIT** |
| 10 | **D8-06 / FV-07** — bandeau C3 absent de l'écran B ; **doublon C3 sur l'écran A** ; empilement `EX-SCR-38` inexistant | `app.tsx` : `snapshotCoverage` + `onOpenMentions` passés à `DistributionScreen`. **Doublon C3 sur A** : vérifié — un seul nœud `.summary-bar-c3` est rendu, par `MarketScreen` (restructuration de fix-screens) ; la coquille n'en monte aucun. Empilement : `shellBanners` (pile ordonnée `ET-ERREUR-PROVIDER` > `ET-HORS-LIGNE` > `ET-PARTIEL-CACHE` > `ET-FILTRE-NON-APPLIQUE` > `ET-URL-CORRIGEE`), plafond de **2** + jeton `+k avertissements` dépliable, repliabilité par bandeau | `impression.spec.ts` « règle 2 : bandeaux d'état et C3 imprimés » vert ; `shell-static.test.ts` (R-D8-07) vert | **FAIT** |
| 11 | **D8-06 / FV-08** (`EX-SCR-113bis`) — mode « Modèle non identifié » non déclenché | `app.tsx` : `modelId={modelId}` passé à `DistributionScreen` | Sondes D7 `modele-non-identifie.test.ts` (fix-screens) vertes ; route `/marche/54-opel/0-…` exercée par `partage-url.spec.ts` | **FAIT** |
| 12 | **D8-06 / FV-15** (`EX-SCR-103`, `197`, `198`) — bandeau C1 absent de `/comparer`, pas de CTA d'ajout, pas de redirection | `app.tsx` : `FilterBand` monté aussi sur `view.kind === 'compare'` ; `onAddModel` ; `onRedirect` **borné à une TRANSITION** (voir §4, arbitrage) | `clavier.spec.ts` « document.title route par route » vert (l'écran C reste atteignable) ; `a11y.spec.ts` surface C verte | **FAIT** |
| 13 | **D8-24** (`ET-CHARGE-INIT`/`ET-CHARGE-MAJ`, `EX-SCR-24`/`173`) — aucun signal de recalcul n'atteignait l'écran B | `app.tsx` : le payload mode 2 PRÉCÉDENT est conservé pendant un recalcul (`setMode2((prev) => …)`), d'où `recalculating` ; `DistributionScreen.tsx` : nouveau prop `recalculating`, mention `role=status` + `<progress>` indéterminée ; `app/app.css` : atténuation à 0,55 des figures et de l'en-tête statistique. Premier calcul (aucun payload) : la coquille garde son écran de chargement (`ET-CHARGE-INIT`) | `npx tsc` ×3, `npm run test:unit`, sondes D7 (hors les 4 de D8-25) verts | **FAIT** |
| 14 | **D8-14 / FV-13 / E2E-22, E2E-23** — le résumé d'impression n'atteignait **jamais** le papier, et citait des noms de paramètres d'URL sur une ligne | **DEUX causes.** (a) `<p class="print-filter-summary">` était ENFANT de `.filter-bar`, que `print.css` met en `display: none` → sorti en FRÈRE ; (b) la règle « masqué à l'écran » de `print.css` était écrite HORS media, à specificité égale et APRÈS le bloc `@media print` : elle l'emportait jusque sur le papier → bornée à `@media screen`. Contenu : `buildActiveFilterTokens` (même modèle que les jetons `EX-SCR-75`), un filtre par ligne | **E2E** `impression.spec.ts::E2E-22` et `E2E-23` : `test.fail()` retirés après rejeu vert | **FAIT** |
| 15 | **D8-14 / FV-16 / E2E-16** — `focus()` sur un `h1` sans `tabindex` : appel sans effet, focus resté sur `<body>` ou sur le lien cliqué | `app.tsx` : `tabindex="-1"` posé sur le titre visé AVANT `focus()`, repli sur `#kycar-main` si l'appel reste sans effet | **E2E** `clavier.spec.ts` — les DEUX `CONSTAT E2E-16` : `test.fail()` retirés après rejeu vert ; le test « le lien d'évitement est le premier arrêt de tabulation » reste vert (voir §4, tension FV-16) | **FAIT** |
| 16 | **D8-14 / FV-17** — amorce SANS-FILTRE de retour après « Tout effacer » ; `mk` non encodé ; « Comparer (0) » ; jeton de snapshot verbeux ; marque `KYCAR` sans les filtres | `app.tsx` : drapeau de SESSION `kycar:primer-seen` (`sessionStorage`) et conversion `no-filter → ready` au niveau coquille ; `expandedMakeIds` **dérivé de l'URL** (`mk`, mode `replace`), écrit par `onToggleExpand` ; cardinaux d'onglet masqués à zéro ; jeton `Snapshot <JJ/MM>` + infobulle (identifiant, âge, fraîcheur) ; `brandHref = assembleUrl('/marche', currentQuery)` | `parcours-p1.spec.ts` (jeton + diagnostic) vert ; `partage-url.spec.ts` vert | **FAIT** |
| 17 | **D8-14 / FV-21** — panneau Diagnostic réduit à 8 lignes d'orchestration ; ni `Rafraîchir`, ni bandeau « Nouvelles données du … » | `app.tsx` : `diagnostics` étendu au `SnapshotDescriptor` (`unknownCountByField`, `ingestFlagCounts` **itéré** — cf. fix-providers §6.4, il porte des clés hors `KYCAR_INGEST_FLAG` —, `duplicateListingCount`, `duplicateValueConflictCount`, journal des rejets `rejectedCount`/`rejectedByReason`, `versionStrippedRate`, `announcedListingCount`) ; `refreshSnapshot()` branché sur le bouton du panneau ET sur `FilterBand.onReload`, avec bandeau « Nouvelles données du … » quand le `snapshotId` servi CHANGE | `parcours-p1.spec.ts` lit l'identifiant de snapshot dans le panneau (assertion déplacée, §4) | **FAIT** |
| 18 | **D8-14 / FV-22** — `favicon.ico` en 404 à chaque chargement | `index.html` : `<link rel="icon" type="image/svg+xml" href="data:…">` (SVG inline, aucun fichier binaire, aucun aller réseau — E5) | Aucune erreur console dans la suite E2E (`parcours-p2.spec.ts::E2E-01` journalise `pageerror`) | **FAIT** |
| 19 | **D8-14 / FV-24** (`EX-SCR-94`) — « Enregistrer la recherche » enregistrait immédiatement sous « Recherche du `<date>` » | `app.tsx` : `onSaveSearch={(name) => saveCurrentSearch(name)}` (le bandeau passait par une fonction d'arité 0 qui ignorait le nom validé) ; `MarketToolbar` préremplit son champ avec `buildSearchDescription(activeFilterTokens)` | `persistance.spec.ts` (10/10) vert | **FAIT** |
| 20 | **D8-14 / E2E-24** (`EX-CRUD-1`/`3`) — `hasDuplicateName` appelé APRÈS `create` : l'entrée créée comptait comme son propre doublon, le message d'homonymie s'affichait à CHAQUE enregistrement | `app.tsx::saveCurrentSearch` : homonymie évaluée sur l'état ANTÉRIEUR | **E2E** `persistance.spec.ts::E2E-24` : `test.fail()` retiré après rejeu vert (« Recherche enregistrée. ») | **FAIT** |
| 21 | **D8-15 / FV-19** — hors ligne, régimes, notification de cascade, raccourci `/`, effectif projeté | `app.tsx` : bandeau `ET-HORS-LIGNE` (`navigator.onLine` + événements `online`/`offline`, aucun appel réseau) ; `regime` passé à `FilterBand` (`bandRegimeOf`), `MarketScreen`, `DistributionScreen`, `ListingsScreen` ; `projectedResultCount` recalculé sur chaque `onDraftSelectionChange` ; `app/app.css` : régimes de l'en-tête (bouton `Menu` + tiroir en compact, fil d'Ariane sur sa ligne en intermédiaire) pilotés par `data-regime`. **Notification « k filtres retirés / Annuler » et raccourci `/` : aucun câblage requis** — ils vivent dans `FilterBand`, déjà monté (fix-state §2.4) | `responsive.spec.ts` (régimes, 3 projets) ; `test:unit` vert | **FAIT** |
| 22 | **D8-20** (O15, `EX-SCR-221`) — un filtre `body` posé en mode 1 cessait de s'appliquer en mode 2 sans mention | `app.tsx` : `bodyFilterUnapplied` lu sur `mode2.payload.unappliedFilterIds`, bandeau « Filtre Carrosserie non appliqué à ce modèle (donnée indisponible) » dans la pile `EX-SCR-38`. Conformément à fix-providers §6.3 et à l'arbitrage du fix-lead, l'effectif publié n'est PAS refusé comme un plancher sur ce cas précis | Pile de bandeaux couverte par `shell-static.test.ts` ; rendu vérifié en navigateur sur `/marche/54-opel/1918-corsa?body=3` | **FAIT** |
| 23 | **E2E-25** (`EX-CRUD-19`, `ADV-13`) — deux onglets écrivant au même instant perdaient une entrée : les deux blobs écrits, l'index n'en citait qu'un, l'entrée orpheline jamais réindexée (**7 à 8 rondes perdantes sur 8**) | `src/persistence/kv.ts` : `KvBackend.keys(prefix)` optionnel (localStorage + mémoire). `crud-store.ts` : index **auto-réparateur** — réconcilié avec les clés `kycar:<collection>/*` réellement présentes à chaque lecture, réparation **persistée**, et rejouée sur l'événement `storage` d'un autre onglet (`reconcileIndex()`, appelé par les trois banques). Aucun `navigator.locks` (`D-16` intact) | **Sonde neuve** `tests/review/D8/index-autorepair.test.ts` : **3 cas rouges sur 5** avant, 5/5 après. **E2E** `persistance.spec.ts::E2E-25` : **0 ronde perdante sur 8, trois exécutions** ; `test.fail()` retiré | **FAIT** |
| 24 | **Relevé de fix-engine §6.1** — `OutlierIndex.has()` et `isEvaluated()` répondaient « oui » sur un verdict `INSUFFICIENT_DATA`/`INSUFFICIENT_SPREAD`, c'est-à-dire sur une annonce que le moteur déclare NON évaluable : `\|A\|` (`EX-DATA-101`) gonflé, sucettes G8 et colonne « signalée » de l'écran D fausses | `src/screens/outlier-index.ts` : `realFlags()` exclut les deux codes de non-évaluabilité (`isNotEvaluableOutlierCode`), utilisé par `has()`, `isEvaluated()` et `flaggedCount` | **Sonde neuve** `tests/review/D8/outlier-index.test.ts` : **2 cas rouges sur 5** avant, 5/5 après | **FAIT** |
| 25 | **D8-26** — retrait des `test.fail()` des constats corrigés par fix-state (E2E-12, E2E-14, E2E-21) | `tests/e2e/a11y.spec.ts`, `clavier.spec.ts`, `responsive.spec.ts` | Rejoués VERTS contre Chromium réel avant retrait (`E2E-12` axe-core sur la modale, `E2E-14` restitution du focus, `E2E-21` feuilles du bandeau et de l'écran G) | **FAIT** |

---

## 2. Déroulé des deux parcours cibles en navigateur

Build de production (`npm run build` + `vite preview`, port **4180**), provider synthétique
100 000 annonces, **vrai Web Worker** d'agrégation, Chromium `/opt/pw-browsers/chromium-1194`.

### P1 — « budget 20 000 €, coupé, < 100 000 km », périmètre BE

| Étape | Valeur observée | Exigence |
|---|---|---|
| URL canonique après pose des trois filtres au bandeau | `?body=3&kmto=100000&priceto=20000` (ordre alphabétique) | `EX-NAV-9` |
| Périmètre belge attesté | jeton `Snapshot 01/09` + infobulle `Snapshot du 1/09/26 — 7 jours (ancien)` ; identifiant `be-synthetic-…` dans le panneau Diagnostic ; **`cy` jamais dans l'URL** | `EX-SCR-43`, `EX-SRCH-18bis` |
| Barre de synthèse | **107 marques · 908 modèles · 2 632 offres — 36 marques affichées** (avant D8-02 : « 107 marques · **0 modèles** · 2 632 offres ») | `EX-SCR-106` |
| Résumé de carte-marque | cardinal réel issu de `MakeAggregate.modelCount`, zones-modèles rendues **sans clic**, repli à 6 (4 en compact) | `EX-SCR-107`, `122`, `132` |
| Jetons de filtres actifs | « Prix : ≤ 20 000 € », « Kilométrage : ≤ 100 000 km », « Carrosserie : Coupé » | `EX-SCR-75` |
| Retour arrière | une entrée d'historique par changement appliqué, effectif et cardinal restaurés à l'identique | `EX-NAV-12`/`13` |
| Impression (`media: print`) | bandeau masqué, résumé **visible**, quatre lignes (« Filtres actifs », puis un filtre par ligne en libellés FR) | `EX-NFR-31` règle 3 |

### P2 — « Opel Corsa », puis restriction à 2017

| Étape | Valeur observée | Exigence |
|---|---|---|
| Entrée écran B | 1 352 offres ; en-tête ligne 2 : **km médian 70 850 km · 1ʳᵉ immat. médiane 2021 · 37 % particuliers** (avant D8-01 : **0 %**, chiffre faux) | `EX-SCR-142` |
| Nuage G4 | points réellement encrés, bascule prix × année ACTIVE (avant : 0 pixel, onglet `disabled`) | `EX-SCR-151`..`160` |
| Brossage → conversion | glisser réel à la souris : bornes dans l'URL (`selx`/`sely`), « Convertir la sélection en filtre » et « Voir ces annonces » montés et actionnables | `EX-SCR-158`/`184` |
| Graphes additionnels | **aucun** graphe sans ligne de données (avant : G5, G8–G15 vides) | `EX-SCR-144`, `EX-NFR-15` |
| Écran D | tableau rendu, **aucune** exception de page, pagination de 50, tri mono-colonne (`aria-sort` unique), lien sortant « Ouvrir ↗ » vers un domaine externe | `EX-SCR-201`..`210`, `EX-DATA-15` |
| Export CSV du périmètre | téléchargement effectif depuis l'écran B | `EX-CRUD-16` |
| Restriction 2017 | 54 offres | `EX-SRCH-9bis` |

---

## 3. Portée retenue pour les facettes (D8-05 / FV-06)

`computeFacets` du moteur exige un jeu de données CHARGÉ. La décision **O17** interdit de charger les
colonnes d'annonces en mode 1 (c'est la condition même du budget `EX-NFR-9` : ≤ 2 000 ms en 4G pour
le premier affichage utile). Les facettes sont donc calculées et publiées **en mode 2**, où le lot est
déjà élagué au couple marque/modèle ; en mode 1, la coquille ne passe **aucun** `facetCounts` — le
bandeau ne rend alors aucune parenthèse, jamais un `(0)` par défaut (règle de `CheckboxList`, posée
par fix-state). Aucune valeur n'est inventée, aucune n'est fausse ; l'écart restant est la facette de
mode 1, qui exigerait soit un balayage des 100 000 annonces à chaque frappe, soit une surface
d'agrégats par option côté provider — **hors budget de ce lot, à instruire en 2.9**.

---

## 4. Sondes et tests modifiés, avec justification (D-31 / D8-19)

| Fichier | Sonde / test | Changement | Justification |
|---|---|---|---|
| `tests/review/D8/shell-static.test.ts` | « landmarks présents » | `/<nav aria-label="Navigation principale">/` → sans le chevron fermant | L'élément porte désormais `id`/`class` (tiroir de navigation du régime compact, `EX-SCR-48`, D8-15). Le fait mesuré — un landmark `nav` ÉTIQUETÉ — est inchangé ; l'assertion figeait la liste des attributs. |
| `tests/review/D8/shell-static.test.ts` | `R-D8-07` (bandeau dégradé daté + Réessayer) | lu sur l'entrée `ET-PARTIEL-CACHE` de la pile de bandeaux et sur le rendu commun de l'action, au lieu d'un bloc `<div>…</div>` littéral | `EX-SCR-38` impose une PILE ordonnée plafonnée à deux : les bandeaux ne sont plus cinq blocs JSX juxtaposés. Les deux faits mesurés (date du cache, action « Réessayer ») sont assertés à l'identique. |
| `tests/e2e/_helpers.ts` | `P1_EXPECTED` | `{ makes: 112, offers: 2656 }` → `{ makes: 107, offers: 2632 }` | **Le jeu de données a changé, pas l'écran.** `D8-16` (fix-providers) fait REJETER à l'ingestion toute annonce sans `listingUrl` (152 rejets à 100 000, `fix-providers.md` §6.5) : le corpus servi n'est plus le même qu'à la campagne 2.9a. **Contrôle exécuté** : le même build, source **avant** mes commits, affiche déjà 107/2 632 — l'écart ne vient pas de fix-app. Écart mesuré : −5 marques, −24 offres. |
| `tests/e2e/parcours-p1.spec.ts` | « périmètre belge attesté par l'identifiant du snapshot » | l'identifiant est lu sur l'attribut `title` du jeton et dans le panneau Diagnostic, au lieu du texte visible du jeton | `EX-SCR-43` / `FV-17` demandent explicitement un jeton COURT `Snapshot <JJ/MM>` avec le détail en infobulle : l'exigence a DÉPLACÉ l'information, le test la lit à son nouvel emplacement. Le fait mesuré (périmètre belge attesté, `cy` jamais dans l'URL) est intact. |
| `tests/e2e/parcours-p2.spec.ts` | `E2E-07`, tri par en-tête | `getByRole('button', { name: /^Prix/ })` → ancré sur `.kycar-listings-table`, `exact: true` | Le locator non ancré est AMBIGU dès que l'écran D rend réellement : il capturait aussi le repli « Prix et valeur » du bandeau de filtres. Le test échouait avant d'y arriver (E2E-01). L'assertion (`aria-sort` unique) est inchangée. |
| `tests/e2e/responsive.spec.ts` | « les cartes-marques restent pleinement fonctionnelles » | le dépliage passe par le bouton de pied de carte au lieu d'un clic sur l'en-tête | **D8-04a** : le clic sur l'en-tête POSE `mmmv` (`EX-SCR-110`) — c'était le premier des quatre écarts `mmmv` relevés par la vérification finale. Le dépliage a son propre contrôle (`EX-SCR-122`), celui que la suite du test utilisait déjà pour REPLIER. |
| `tests/e2e/*.spec.ts` (7 fichiers) | 26 `test.fail()` | retirés, chacun remplacé par un commentaire nommant la correction | Règle D8-17/D8-26 : le test E2E qui a révélé l'écart est la preuve, non modifié, rejoué VERT avant retrait. |
| `tests/e2e/responsive.spec.ts` | **`DETTE D8-15`** (nouveau) | ajouté en `test.fail()` | Dette produit RATIFIÉE par le fix-lead (`EX-SCR-95`, réglages « Assainissement KYCAR ») : elle est rendue visible à chaque exécution de la recette plutôt que passée sous silence, et redeviendra verte le jour où le panneau sera livré. |

Aucune autre assertion n'a été modifiée.

---

## 5. Arbitrages pris dans le périmètre

1. **`EX-SCR-198` — redirection de l'écran C.** `CompareScreen` (sans hook) appelle `onRedirect` au
   rendu dès que `rows` est vide. Appliqué tel quel, `/comparer` devenait **inatteignable** : une
   visite à froid rebondissait vers l'écran A, y compris sur une URL `?m=…` parfaitement peuplée
   (au premier rendu, `rows` est vide parce que `enterMode2` n'a pas encore répondu), et la colonne
   « + Ajouter un modèle » (`EX-SCR-197`) n'existait plus. Le texte de l'exigence décrit une
   TRANSITION : « **Passer sous** 2 modèles redirige vers l'écran B du modèle restant » (retrait
   d'une colonne). La coquille n'honore donc la redirection que si la comparaison a réellement été
   peuplée dans cette session ET que la sélection COURANTE (`compareKeys`, pas `rows`) est bien
   tombée à 0 ou 1.
2. **`FV-16` (premier `Tab`) contre `E2E-16` (focus dans le contenu).** `FV-16` demande que le
   premier `Tab` d'une page fraîche atteigne le lien d'évitement ; les deux tests `E2E-16` exigent
   que le focus soit DÉPLACÉ dans `#kycar-main` après chargement direct comme après navigation. Les
   deux ne peuvent pas être vrais en même temps. La preuve navigateur fait foi (D8-17) : le focus est
   déplacé, et le lien d'évitement reste le **premier élément tabulable du document** — ce que le
   test dédié de `clavier.spec.ts` mesure et valide (vert). `tabindex="-1"` n'insère rien dans
   l'ordre de tabulation.
3. **Doublon C3 de l'écran A (FV-07).** Vérifié plutôt que corrigé à l'aveugle : après la
   restructuration de fix-screens, un SEUL nœud `.summary-bar-c3` est rendu sur l'écran A, par
   `MarketScreen`, et la coquille n'en monte aucun. Aucune correction n'était due ; le fait est
   attesté par `impression.spec.ts` règle 2.
4. **Bandeau `ET-URL-CORRIGEE` et durée de vie.** Il vit dans un état de SESSION distinct de
   `location` : `EX-SCR-38bis` exige qu'il ne soit **pas restauré par un retour arrière** vers la
   même URL corrigée. Il est vidé par `applyFilters`, `onResetAllFilters` et `onSelectionApplied`.

---

## 6. Mesures

### `EX-NFR-9` — budget de démarrage (statique, `dist/`)

`npm run test:review tests/review/D8/nfr9-size.test.ts` : bundle initial et référentiels sous les
budgets (`≤ 300 Kio` gzip, `≤ 900 Ko` transférés, `≤ 1 800 ms`). `npm run size` : voir §7.
Le chargement des agrégats-modèles de D8-02 est **hors du chemin critique** : il est déclenché après
`loadMarket`, dans un effet séparé, et son échec ne dégrade que les zones-modèles.

### `D8-01` — coût de la copie structurée

`src/worker/client.structured-copy.test.ts`, lot de **100 000 lignes**, colonnes typées
**2,96 Mio** : copie **médiane 2,6 ms** (5 mesures : 2,4 / 2,4 / 2,6 / 3,5 / 4,7 ms). Le budget de
D8-01 (« attendu < 100 ms à 100k ») est tenu avec deux ordres de grandeur de marge. La copie a lieu
**une fois par jeu de données** (`loadDataset`), jamais par recalcul : `recalculate` et
`computeFacets` ne transportent qu'une sélection. Sur le chemin réel (mode 2, lot élagué au couple
marque/modèle, ~10³ lignes), le coût est sous la milliseconde.

---

## 7. Câblage attendu de l'agent de finition (`fix-screens-finition`)

`Histogram.tsx` expose une prop `onClearFilter` (double-clic = réinitialisation du filtre de la
métrique, `EX-SCR-149`) et un `onSelectBucket` élargi (`Ctrl`+clic cumulatif, brossage horizontal →
intervalle). **Ces props n'existent pas dans mon arbre** (elles arrivent avec la fusion de
`fix28/finition`). Câblage attendu, à poser à la fusion, dans `DistributionScreen`/`app.tsx` :

```tsx
// `EX-SCR-149` — double-clic sur un histogramme : RETRAIT du filtre de cette métrique.
onClearFilter={(metric: 'price' | 'mileage' | 'year') => applyFilters(CLEAR_PATCH[metric])}

const CLEAR_PATCH = {
  price:   { priceFrom: undefined, priceTo: undefined },
  mileage: { mileageFrom: undefined, mileageTo: undefined },
  year:    { dateOfRegistrationFrom: undefined, dateOfRegistrationTo: undefined },
} as const;
```

`applyFilters` (déjà branché sur `onApplyFilters`) traite `undefined` comme un RETRAIT
(`delete next[id]`), réécrit l'URL en `push` et déclenche le recalcul par la clé d'entrée mode 2 :
aucun code supplémentaire n'est nécessaire côté coquille au-delà de cette prop. Le `onSelectBucket`
élargi n'exige rien de la coquille — il produit un patch de filtres qui passe par le même
`onApplyFilters`.

---

## 8. Vérification finale de ce lot

```
npx tsc --noEmit -p tsconfig.json         → 0 erreur
npx tsc --noEmit -p tsconfig.worker.json  → 0 erreur
npx tsc --noEmit -p tsconfig.review.json  → 0 erreur
npx eslint src tests                      → vert
npm run test:unit                         → 675 passed
npm run test:review                       → voir §8.1
npm run build                             → 0 erreur / 0 warning
npm run size                              → voir §8.1
npm run test:e2e (3 projets)              → voir §8.2
```

---

## 9. Résumé (12 lignes)

*(rempli en fin de lot)*
