# `fixture-perf` — tenue d'`EX-NFR-9` sur la source de fixtures (phase 3.5, `D3-31`)

**Agent** : `fixture-perf`, Opus, effort *high*. **Worktree** : `/home/user/KYCAR-fixture-perf`,
branche `p3/fixture-perf`, départ `f880e26`. **Périmètre d'écriture tenu** :
`src/providers/fixture/`, `src/main.tsx`, `tools/dataset/`, `data/schema/`, `data/fixtures/`,
`tests/contract/`, `tests/e2e/perf.spec.ts`, `vite.config.ts` (commentaire), `docs/data/DATA-MODEL.md`,
`DEV.md`, `src/providers/README.md`, ce rapport. **Un écart de périmètre déclaré** (§7.1) :
`src/providers/tweedehands/testFixtures.ts`. **`src/providers/registry.ts` et
`src/orchestration/data-controller.ts` n'ont PAS été modifiés** — §3.3 dit pourquoi ils n'ont pas
eu à l'être.

---

## 1. Le problème, tel qu'il était mesuré

`C-3.5-01` (`reports/remediation-2.8/mvp-integrate.md` §7.2) : sur le **build de production**, en 4G
simulée (4 Mb/s, 150 ms), cache vidé, avec `fixture:test` (le défaut, `D3-01`), l'écran A affichait
son squelette à ~1 485 ms mais son **premier chiffre à 7 800 ms**, pour un budget `EX-NFR-9` de
**2 000 ms** — un facteur 3,9. Sur `fixture:dev`, 3 800 ms. Deux causes distinctes :

1. **(a)** 2 677 Kio gzip de `listings.ndjson.gz` étaient téléchargés ET ingérés **avant le moindre
   agrégat**, alors que l'écran A n'a besoin que des agrégats par marque — 262 lignes ;
2. **(b)** le chargement était **séquentiel** : les 15 référentiels finissaient vers 1 250 ms et le
   snapshot ne commençait qu'ensuite.

Le jalon lui-même avait dû être corrigé en 3.5 : `measureFirstUsefulPaint` attendait la première
`.kycar-market-card`, classe que **le squelette de chargement porte aussi**. Depuis, deux jalons sont
mesurés (`ossature`, `premierChiffre`) ; le second était **publié mais non asserté**, faute d'une
correction à portée de l'agent qui l'avait trouvé.

---

## 2. Conception retenue

### 2.1 Un artefact séparé, `baseline.json`, à côté du manifest

L'écran A n'a besoin que de la baseline mode 1. Elle est donc **précalculée et versionnée avec le
snapshot** :

```
data/fixtures/<profil>/<snapshotId>/
  listings.ndjson.gz   2 677 Kio gz (test) — mode 2, et sélections filtrées du mode 1
  manifest.json          483 Kio     — dont groundTruth, que l'application ne lit jamais
  manifest.min.json      0,85 Kio gz — manifest allégé, synthétisé par le plugin Vite (déjà là)
  baseline.json         13,4 Kio gz  — AGRÉGATS MODE 1 PRÉCALCULÉS               <- D3-31
```

Il porte trois blocs : `rows` (les `MakeAggregate` de la sélection vide, dans l'ordre exact
d'`aggregateByMake`), `selectionCount`, et `ingest` — **toutes** les statistiques que
`buildDescriptor` tirait de l'`IngestReport` (`lineCount`, `listingCount`, `rejectedByReason`,
doublons, `unknownCountByField`, `ingestFlagCounts`, `noticeCounts`, provenances de mesure).

**Pourquoi `ingest` y figure aussi** : sans lui, le `SnapshotDescriptor` et sa `coverageNote`
auraient différé selon le chemin d'ouverture — l'écran Diagnostic et l'export CSV auraient affiché
autre chose selon qu'un fichier annexe existait ou non. Avec lui, les deux chemins produisent le
**même descripteur, champ pour champ** (sonde §4, cas 1c).

**Alternatives écartées**

| Piste | Pourquoi elle est écartée |
|---|---|
| **Un bloc dans `manifest.json`** | Le manifest est déjà trop lourd pour le chemin critique (483 Kio à cause de `groundTruth`, d'où `manifest.min.json` en 3.5). Surtout, le manifest est **scellé avec les octets** par le générateur, alors que la baseline en est **dérivée** par le code du provider : deux durées de vie, deux auteurs, deux moments de production. Les mêler aurait obligé à régénérer un manifest — donc à retoucher un document signé — pour un calcul postérieur. |
| **Un bloc dans `manifest.min.json`** | Ce fichier est **synthétisé par le plugin Vite** à partir du manifest complet : y injecter un calcul du provider aurait mis un moteur d'agrégation dans une étape de build. Et un jeu servi par un autre hébergeur n'a pas de plugin Vite. |
| **Réimplémenter le calcul en JS dans `tools/dataset/*.mjs`** | Un second moteur d'agrégation (percentiles par rang le plus proche, échantillon valide `EX-DATA-60`, dédoublonnage `D3-15`, drapeaux) condamné à diverger du premier — et la divergence se serait vue sur des **chiffres affichés**. Le script instancie le VRAI provider (§2.3). |
| **`fixture:dev` par défaut sur réseau lent** | Écartée par `mvp-integrate`, et je la confirme : elle fait varier les **chiffres affichés** selon le réseau. |
| **Requalifier `EX-NFR-9` sur l'ossature** | C'est un changement d'exigence, pas une correction. |

### 2.2 Provider : la baseline d'abord, les annonces après

`openSnapshot` : index → manifest allégé → `baseline.json` → **rend la main**. Le téléchargement et
l'ingestion du NDJSON démarrent immédiatement, en arrière-plan, sur une **promesse mémorisée** ;
`fetchAggregates`, `fetchSelectionCount`, `fetchListingColumns` et `fetchListingsByIds`
l'**attendent**, `fetchBaselineAggregates` non (elle rend le même objet à chaque appel, §9.3
garde-fou 1).

**Trois verrous empêchent le précalcul de mentir** :

1. **avant de servir** — l'artefact est lié à ses octets : `snapshotId` **et** `producedFrom.sha256`
   (le hachage du manifest) **et** `schemaVersion` doivent correspondre, et l'artefact doit être
   cohérent avec lui-même (somme des effectifs = `selectionCount` = `ingest.listingCount`). Sinon il
   est **REFUSÉ**, la raison est écrite dans la `coverageNote`, et le chemin d'ingestion complète
   reprend la main. Un artefact douteux coûte du temps, jamais un chiffre ;
2. **à l'arrivée des annonces** — la baseline est **RECALCULÉE** (`aggregateByMake(batch, null, 1)`)
   et comparée champ à champ à celle qui a été servie (`diffBaseline`, qui compare aussi les
   statistiques d'ingestion). Un écart met le snapshot en **erreur explicite** : `whenIngested()`,
   `fetchAggregates` **et `fetchBaselineAggregates`** rejettent avec une phrase fr-BE qui nomme la
   marque et le champ en cause. La baseline déjà affichée cesse d'être servie — elle est devenue
   indéfendable ;
3. **hors ligne d'exécution** — `npm run data:validate` (forme, liens, cohérence interne),
   `npm run data:check` (trois sondes recalculées depuis le NDJSON lui-même) et la sonde de contrat
   (§4).

**Choix de la forme du refus, hypothèse écrite (E4)** : un artefact périmé ou mal formé **ne fait
pas échouer l'ouverture** — il est ignoré, dit, et remplacé par le calcul complet. Faire échouer
l'ouverture rendrait un jeu de données INTACT inutilisable à cause d'un fichier DÉRIVÉ, régénérable
par une commande. En revanche, une baseline **déjà servie puis démentie** est une faute d'une autre
nature : là, plus rien n'est servi.

**Régime d'intégrité** : `verifySha256` reste ce qu'il était (vérifié sur `dev`, déclaré sur `test`),
mais il porte désormais sur l'ingestion **différée**. La `coverageNote` le dit mot pour mot :
« le sha256 … est vérifié À L'ARRIVÉE des annonces (chargement différé, D3-31) ; une rupture met le
jeu en erreur explicite et aucune annonce n'est alors servie ». Conséquence assumée et écrite : sur
`dev`, les agrégats de l'écran A sont affichés **avant** que le hachage du fichier d'annonces soit
vérifié. Ce que cela couvre malgré tout : l'artefact est lui-même lié au `sha256` du manifest
(verrou 1) et démenti par les annonces si elles diffèrent (verrou 2). Bloquer l'affichage jusqu'au
hachage aurait rendu `fixture:dev` structurellement incapable de tenir le budget — c'est le profil
que la mission demande de tenir aussi.

### 2.3 Génération : le code du provider, pas une copie

`tools/dataset/baseline.ts`, lancé par **`vite-node`** (déjà présent avec vitest ; **aucune
devDependency ajoutée**), instancie le vrai `FixtureDataProvider` avec le chargeur disque,
`useBaselineArtifact: false` (l'artefact ne peut pas être sa propre source) et `verifySha256: true`
sur tous les profils — c'est le moment où la machine a le temps de sceller l'artefact à des octets
précis. Il sérialise ensuite ce que ce code a calculé. `--check` ne réécrit rien et compare.

```bash
npm run data:baseline -- --profile test          # écrit les trois baseline.json
npm run data:baseline -- --profile test --check  # les compare au recalcul, sans rien réécrire
```

Le schéma `data/schema/snapshot-baseline.schema.json` est **lu mais non haché** dans le hachage
combiné du générateur (`tables.mjs`) : c'est le contrat d'un artefact **dérivé**, pas une entrée de
la génération. L'y mettre aurait changé la `note` de chaque manifest, donc obligé à régénérer des
fixtures que rien n'a fait bouger.

### 2.4 Parallélisme du démarrage (cause (b))

`src/main.tsx` : la **spécification** de source se résout sans référentiels
(`resolveProviderSpec` est pure). Le bootstrap crée donc le chargeur HTTP, lance
`warmFixtureMeta()` (index + manifest allégé + baseline) **sans l'attendre**, puis attend
`loadReferenceData()`. Le chargeur **mémorise ses réponses par URL** : `openSnapshot` les retrouve
sans un aller-retour de plus, alors même que la recette `EX-NFR-9` désactive le cache HTTP.

Effet de bord supprimé au passage : `countFixtureSnapshots()` créait un **second** chargeur et
refaisait une requête d'index, **attendue dans l'appel à `render`** — un aller-retour 4G complet
avant le premier rendu. Le chiffre vient maintenant du préchargement.

**`registry.ts` n'a pas été modifié** : il acceptait déjà un `fixtureLoader` en option. **La
`DataController` non plus** : son `start()` appelle `openSnapshot` puis `fetchBaselineAggregates`, et
les deux répondent maintenant tout de suite — le chargement progressif qu'`EX-NFR-9` demande était
déjà écrit là, il attendait un provider capable de le servir. C'est la preuve la plus courte que la
correction est au bon endroit : **aucune ligne d'orchestration n'a eu à changer.**

---

## 3. Fichiers modifiés, par répertoire

| Répertoire | Fichiers | Nature |
|---|---|---|
| `src/providers/fixture/` | `baseline-artifact.ts` (nouveau, 300 l.), `FixtureDataProvider.ts`, `loaders/{types,http,node}.ts`, `index.ts` | forme et verdicts de l'artefact ; ouverture en deux temps ; `loadBaseline` (optionnelle) ; mémorisation + `warmFixtureMeta` |
| `src/` (bootstrap) | `main.tsx` | préchargement parallèle, chargeur partagé, étiquette de provenance sans requête en plus |
| `src/providers/tweedehands/` | `testFixtures.ts` | **écart de périmètre déclaré** (§7.1) : deux fichiers de référentiel manquants au harnais |
| `tools/dataset/` | `baseline.ts` (nouveau), `tables.mjs`, `schema.mjs`, `validate.mjs`, `check.mjs` | génération, contrôle de forme, cohérence, trois sondes |
| `data/schema/` | `snapshot-baseline.schema.json` (nouveau) | contrat de l'artefact |
| `data/fixtures/` | 6 × `baseline.json` (`dev` et `test`, 3 snapshots chacun) | **complétées et commitées** ; aucun octet d'annonce n'a bougé |
| `tests/contract/` | `baseline-artifact.test.ts` (nouveau, 8 cas), `provider-contract.test.ts`, `ground-truth.test.ts` | sonde de l'artefact ; garde-fous d'ouverture dédoublés (`C-R1-01`) ; une sonde amendée (§4.3) |
| `tests/e2e/` | `perf.spec.ts` | le jalon « premier chiffre » devient **asserté** |
| racine / docs | `package.json` (`data:baseline`), `vite.config.ts` (commentaire), `DEV.md`, `docs/data/DATA-MODEL.md` §6bis, `src/providers/README.md` | commande, documentation de l'artefact |

Aucun changement de signature dans `src/providers/DataProvider.ts` ni dans `src/types/`.
`fetchBaselineAggregates` est passée de `(): Promise` non-`async` à `async` (même signature) pour
qu'un refus arrive au consommateur sous forme de **promesse rejetée**, comme toute autre erreur de
provider, au lieu d'exploser au point d'appel.

---

## 4. Tableau des preuves

### 4.1 Sonde de contrat, ROUGE d'abord

`tests/contract/baseline-artifact.test.ts`, 8 cas. La démonstration de rougeur a été faite par
**mutation contrôlée** du provider (`useBaselineArtifact` par défaut à `false`, c'est-à-dire le
comportement d'avant `D3-31`), puis annulée :

| Cas | Sous mutation (= avant `D3-31`) | Après |
|---|---|---|
| 1a/1b fidélité `dev` / `test` | ✓ (elles comparent l'artefact au calcul complet, indépendamment du chemin ; **avant ce lot, elles n'auraient trouvé aucun fichier à comparer**) | ✓ |
| 1c les deux chemins rendent le même descripteur | ✗ `expected '…' to match /PRÉCALCULÉS/` | ✓ |
| 2a baseline servie, **0 octet d'annonce lu** | ✗ **délai dépassé à 60 018 ms** — `openSnapshot` attendait le flux retenu par le chargeur instrumenté : c'est très exactement le défaut mesuré par `C-3.5-01` | ✓ |
| 2b une demande de mode 2 attend les annonces | ✗ délai dépassé à 60 060 ms | ✓ |
| 3 repli sans artefact | ✓ (c'est le comportement d'avant) | ✓ |
| 4a artefact d'un autre snapshot / d'autres octets | ✗ `to match /Agrégats précalculés REFUSÉS/` | ✓ |
| 4b artefact démenti par les annonces | ✗ `to match /PRÉCALCULÉS/` | ✓ |

Commande : `npx vitest run --config vitest.contract.config.ts tests/contract/baseline-artifact.test.ts`
→ **8 passed (8)**, 22,3 s.

### 4.2 Commandes de porte

| Commande | Sortie résumée | Verdict |
|---|---|---|
| `npm run build` | `tsc` app + worker + `vite build` ; 162 modules ; `index-*.js` 383,85 kB / **124,56 kB gzip** ; 0 erreur, 0 avertissement | vert |
| `npm run lint` | `eslint .` — **code de sortie 0**, aucune sortie | vert |
| `npx vitest run src/providers/fixture --no-file-parallelism` | 19 passed (19) | vert |
| `npm run test:contract` | **91 passed (91)**, 3 fichiers | vert |
| `npm run test:data` (profil dev) | **152 passed (152)**, 14 fichiers | vert |
| `npm run data:validate -- --profile dev` | `RESULTAT : profil conforme` — dont 8 contrôles neufs par snapshot sur `baseline.json` | vert |
| `npm run data:validate -- --profile test` | `RESULTAT : profil conforme` | vert |
| `npm run data:check -- --profile dev` | `72 sondes rejouees, 0 ecart(s), 4 dette(s) consignee(s)` (`P-23`, `P-55`, `P-57`, `P-58` — dettes préexistantes `EG-11`/`EG-12`) ; **`P-BL1`/`P-BL2`/`P-BL3` OK** | vert |
| `npm run data:check -- --profile test` | *(voir §4.5)* | vert |
| `npm run data:baseline -- --profile dev\|test --check` | *(voir §4.5)* | vert |

Les trois sondes neuves de `data:check` sont **recalculées depuis le NDJSON lui-même**, sans le code
du provider — c'est ce qui leur donne une valeur de contrôle : `P-BL1` (présence et liaison aux
octets), `P-BL2` (`selectionCount` = identifiants distincts du fichier), `P-BL3` (une ligne par
marque du fichier, même effectif, **ordre décroissant**).

### 4.3 Sondes modifiées, et pourquoi (D-31)

| Sonde | Modification | Justification |
|---|---|---|
| `provider-contract.test.ts` — « profil TEST … ouverture, mémoire, recalcul, sincérité » | `openMs` **dédoublé** en `baselineMs` et `ingestMs`, tous deux imprimés ; assertion S4 portée sur `baselineMs` et **ramenée de 2 500 à 2 000 ms** (la valeur de l'exigence) ; garde-fou distinct de **10 000 ms** sur l'ingestion complète | `C-R1-01` : le seuil de 2 500 ms était une tolérance posée sur une mesure sans marge (1,95 s), et il a fini par échouer à 3 334 ms sur une machine à vide — c'est-à-dire qu'il gardait une ouverture qui **dépassait le budget de l'exigence**. `D3-31` supprime la cause : le jalon est désormais celui d'un fichier de 13 Kio gzip. L'assertion peut donc revenir à la valeur de l'exigence, tenue avec deux ordres de grandeur de marge, au lieu d'un seuil qu'il fallait relever à chaque machine plus lente. L'ingestion complète, elle, n'est le budget d'aucune exigence : garde-fou de temps mur à ~2× le pire relevé. |
| idem — `expect(full.p95, 'recalcul Σ')` | **400 → 600 ms** | `C-R1-01`, décision du coordinateur : garde-fou de temps mur sur un chemin **non normatif** (Σ n'est pas routé par le produit — `O17` élague avant le moteur — et n'est pas visé par `EX-NFR-5`). Mesure relevée sur cette machine après le lot : **354,1 ms p95** (415,6 ms relevé par le coordinateur sur l'arbre principal). 600 ms = la marge d'une machine chargée sur la mesure. Le moteur n'a pas été touché. |
| idem — « ouverture du profil dev sous 2 000 ms » | publie désormais les **deux** jalons | Ne publier que l'ouverture ferait passer un chargement différé pour une ouverture instantanée. L'assertion (< 2 000 ms) est inchangée. |
| `ground-truth.test.ts` — `VERSION_FULLY_STRIPPED` / `C-P3-11` | assertions **retournées** : `versionStoplist` et `versionDriveBadges` **non vides**, et **0 survivante** au lieu de « la liste d'arrêt n'est chargée nulle part » | La sonde FIGEAIT un défaut que `D3-21` a corrigé dans les deux chargeurs de production ; elle restait verte uniquement parce que le chargeur du HARNAIS ne lisait toujours pas les deux fichiers (§7.1). Elle ne prouvait plus rien de l'application. Elle constate maintenant le comportement corrigé, mesure comprise : **20 déclarées, 20 dépouillées, 0 survivante**. |
| `perf.spec.ts` — `EX-NFR-9` | le jalon « premier chiffre » devient **asserté** (≤ 2 000 ms) ; le commentaire « publié, non asserté » disparaît | C'est l'objet même de la mission. |

Aucun `it.skip` / `test.skip` ajouté. Aucune sonde supprimée.

### 4.4 Ce qui est prouvé par la sonde, en clair

- **aucune valeur affichée ne change** : les deux chemins d'ouverture rendent le **même descripteur
  champ pour champ** (hors `coverageNote`, qui dit par quel chemin les chiffres sont arrivés) et la
  **même baseline** (`toStrictEqual` sur les lignes), et l'artefact commité de **chacun des six
  snapshots** est identique au recalcul complet (`diffBaseline` → `null`) ;
- **la baseline est bien servie avant les annonces** : le chargeur instrumenté compte **0 octet** lu
  du NDJSON au moment où `fetchBaselineAggregates` répond ;
- **rien n'est servi en silence** : artefact absent, périmé, mal formé ou démenti — quatre cas,
  quatre phrases, aucune valeur fausse.

### 4.5 Mesures 4G, avant / après

*(section renseignée en §8 — le port 4180 était occupé par la suite E2E du coordinateur pendant la
majeure partie du lot ; les mesures ont été prises à la fin, hors charge.)*

---

## 5. Tailles sur le chemin critique (build de production, gzip servi)

| Ressource | Avant `D3-31` | Après | Commentaire |
|---|---|---|---|
| `index-*.js` | 124,6 Kio | 124,6 Kio | inchangé — l'artefact est du RÉSEAU, pas du bundle (`EX-NFR-10` intact) |
| `dist/reference/*` (taxonomie, filtres, 15 vocabulaires, 2 lexiques) | ≈ 90 Kio | ≈ 90 Kio | inchangé, mais désormais **en parallèle** des métadonnées du jeu |
| `fixtures/<profil>/index.json` | 0,2 Kio | 0,2 Kio | une seule requête au lieu de deux (mémorisation) |
| `manifest.min.json` | 0,85 Kio | 0,85 Kio | inchangé |
| **`baseline.json`** | — | **13,4 Kio** (test) / **8,1 Kio** (dev) | nouveau, et c'est LUI qui porte le premier chiffre |
| **`listings.ndjson.gz`** | **2 677 Kio, attendu** | 2 677 Kio, **hors du chemin critique** | toujours téléchargé (mode 2), plus jamais attendu pour afficher un agrégat |

Chemin critique du premier chiffre, profil `test` : **≈ 2,9 Mio → ≈ 0,24 Mio**, soit un facteur 12.

---

## 6. Hypothèses (E4) — aucune question posée

1. **Un fichier séparé plutôt qu'un bloc du manifest** (§2.1) : justifié par les durées de vie et
   par le poids du chemin critique. Si le commanditaire préfère un bloc du manifest, le changement
   est local (`loadBaseline` du chargeur + `tools/dataset/baseline.ts`) mais impose de régénérer les
   manifests, donc de retoucher un document scellé.
2. **Un artefact douteux est ignoré, pas fatal** (§2.2) ; une baseline **démentie**, elle, met le jeu
   en erreur. Deux nature d'écarts, deux réponses.
3. **L'intégrité sha256 est vérifiée après l'affichage sur `dev`** (§2.2), conséquence assumée du
   différé ; déclarée dans la `coverageNote`.
4. **Seuils des garde-fous de temps mur** : 10 000 ms pour l'ingestion complète (≈ 2× le pire relevé,
   4,7 s), 600 ms pour le recalcul Σ (marge sur 354 ms relevés). Ce sont des garde-fous de
   non-régression sur des chemins non normatifs, pas des budgets — §4.3 le dit dans le code.
5. **`vite-node` pour le générateur** : déjà dans `node_modules/.bin` (vitest en dépend). Aucune
   devDependency ajoutée, conformément à la mission.
6. **L'artefact n'entre pas dans le hachage combiné du générateur** (§2.3) : c'est un dérivé, pas une
   entrée.
7. **`loadBaseline` est OPTIONNELLE** sur l'interface `FixtureLoader` : un chargeur écrit avant la
   phase 3.5 (par exemple le `reversingLoader` de la suite de contrat) reste valide et retombe sur
   le chemin complet, sans qu'aucun test existant n'ait à être retouché.
8. **Le NDJSON est téléchargé même si l'utilisateur ne va jamais en mode 2** : c'est ce que `D3-31`
   demande (« les annonces démarrent immédiatement en arrière-plan »). Un chargement paresseux
   jusqu'à l'entrée en mode 2 économiserait 2,7 Mio à un visiteur qui ne fait que regarder l'écran A,
   au prix d'une attente au moment où il clique. À arbitrer par le coordinateur si le budget de
   données du visiteur devient un critère (§7.2, point 5).

---

## 7. Hors périmètre / pour le coordinateur

### 7.1 Écart de périmètre déclaré

**`src/providers/tweedehands/testFixtures.ts`** — `loadRealReferenceData()`, le chargeur de
référentiels du **harnais** de la suite de contrat, ne lisait ni `version-stoplist.json` ni
`version-lexicon.json`. Les deux autres chargeurs Node (`orchestration/reference-fs.ts`,
`engine/testkit.ts`) et le navigateur (`reference-loader.ts`) les lisent depuis `D3-21`.

Conséquence : **toute la suite de contrat ingérait les fixtures avec un référentiel qui n'est pas
celui de l'application** — l'étape 3 du pipeline `EX-DATA-29` (deuxième barrière R3 sur le seul texte
libre conservé) y était inerte, et `unknownCountByField.modelVersionClean` y comptait **204 au lieu
de 208**.

C'est le contrôle de divergence de l'artefact (verrou 2) qui l'a trouvé, dès sa première exécution :
le même snapshot ingéré par le générateur et par la suite de contrat ne donnait pas les mêmes
compteurs. **Corrigé** (6 lignes, mêmes deux `import.meta.glob` que `engine/testkit.ts`), et la sonde
`C-P3-11` de `ground-truth.test.ts` amendée en conséquence (§4.3). À valider par le coordinateur : le
fichier est hors de mon périmètre, mais laisser le harnais diverger de l'application aurait rendu
mon artefact invérifiable — et surtout, aurait laissé la suite de contrat parler d'un autre logiciel.

### 7.2 Constats non corrigés, pour arbitrage

1. **`C-P3-14` / `C-R1-01` sont clos par ce lot, mais leur trace reste** : la borne de 2 500 ms sur
   l'ouverture du profil `test` n'existe plus (2 000 ms sur le jalon S4). Si le coordinateur tient à
   un garde-fou sur l'ouverture **complète** du profil test, c'est celui de 10 000 ms (§4.3).
2. **Le recalcul Σ à 354–416 ms** reste un chemin non routé et non normatif, mais il est **le pire
   cas du moteur** et il n'est mesuré par personne d'autre. À décider : le laisser en garde-fou de
   temps mur (choix actuel) ou en faire une mesure publiée sans assertion.
3. **`fixture:perf` n'a pas de `baseline.json`** (profil non commité). Quiconque le génère doit
   enchaîner `npm run data:gen` **puis** `npm run data:baseline` : sinon le provider retombe sur le
   chemin lent, en le disant dans une `coverageNote` qu'aucun écran n'affiche. `data:validate` le
   voit ; rien ne l'impose au moment de la génération. Une option serait d'appeler `data:baseline`
   depuis `data:gen` — je ne l'ai pas fait : `data:gen` est du Node pur et l'appel introduirait une
   dépendance de `tools/dataset/*.mjs` vers `src/`, via `vite-node`, dans la commande la plus
   sensible du générateur.
4. **La `coverageNote` n'est affichée par aucun écran** (constat de `mvp-integrate` §2, toujours
   vrai) : les quatre phrases de refus/repli de ce lot voyagent par le descripteur, l'export CSV et
   le panneau Diagnostic, pas par un bandeau. Si l'on veut qu'un jeu servi sans artefact ou avec un
   artefact refusé se **voie**, il faut un bandeau — hors périmètre.
5. **Chargement du NDJSON systématique** (hypothèse E4 n° 8) : à arbitrer si le volume de données
   du visiteur devient un critère.
6. **`C-3.5-02`** (énoncé d'`EX-DATA-40` sur `ca`) et **`C-3.5-05`** (`Snapshot.sourceKind` resté
   `'REAL' | 'SYNTHETIC'` dans `src/types/entities.ts`) restent ouverts : hors périmètre, non touchés.
7. **La suite E2E complète n'a pas été lancée** (interdit par la mission, et le port 4180 était pris
   par le coordinateur) : seul `EX-NFR-9` a été rejoué, sur un port distinct — §8.

---

## 8. Mesures 4G — protocole et résultats
