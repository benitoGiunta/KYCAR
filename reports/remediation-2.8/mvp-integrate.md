# `mvp-integrate` — intégration MVP sur données fictives (phase 3.5, PLAN-3 §3.5)

**Agent** : `mvp-integrate`, Opus, effort *high*. **Arbre** : principal, branche
`claude/kycar-project-ffcplk`, départ `2a4610f`. **Démarrage anticipé** décidé en `D3-24` (la suite
E2E était rouge sur la branche : 58 échecs identiques sur trois projets, dus à des attendus figés sur
l'ancien corpus synthétique de 100 000 annonces).

Périmètre d'écriture tenu : `src/app.tsx`, `src/app/`, `src/main.tsx`, `src/orchestration/`,
`src/screens/market/MarketScreen.tsx` (prop `recalculating`), `tests/e2e/`, `tests/review/D8/`,
`README.md`, `DEV.md`, `src/providers/README.md`, ce rapport. **Deux écarts de périmètre déclarés**
(§7) : `src/screens/mentions/MentionsPage.tsx` et `src/app/app.css`.

---

## 1. Étiquette `FIXTURE` — la nature de la source est dite partout (mission §1)

**Constat d'entrée** (`fixture-provider` §9, point 1) : `SourceKind` a gagné la valeur `FIXTURE` en
3.3, mais la coquille, `/mentions` et le pied de page ne nommaient que `REAL` et `SYNTHETIC`. Avec
`fixture:test` comme source par DÉFAUT (`D3-01`), le cas **nominal** :

- n'affichait **aucun** bandeau de provenance (le bandeau ne réagissait qu'à `SYNTHETIC`) ;
- n'affichait **aucune** phrase de provenance dans `/mentions` (condition
  `sourceKind === 'REAL' || sourceKind === 'SYNTHETIC'`) ;
- affichait au pied de page **« Source : AutoScout24 — agrégat non affilié »**, c'est-à-dire une
  attribution de marché RÉEL sur un jeu inventé.

C'est le chemin exact où `FIXTURE` était traité comme `REAL`, et il était le chemin par défaut.

### Correction

Nouveau module **pur** `src/app/source-notice.ts` — seule source des phrases de provenance :

| Fonction | Rôle | `REAL` | `SYNTHETIC` | `FIXTURE` | inconnu |
|---|---|---|---|---|---|
| `sourceNotice()` | bandeau, tous écrans | `null` | « Données synthétiques… » | « Jeu de données fictif à la forme AutoScout24 (profil test, 3 snapshots) — aucune annonce réelle. » | phrase « nature non reconnue » |
| `footerSourceLine()` | ligne légale `EX-SCR-47` | « Source : AutoScout24 — agrégat non affilié… » | « jeu synthétique… » | « Jeu de données fictif… aucun lien avec AutoScout24 » | « nature non établie » |
| `mentionsProvenanceLabel()` | `/mentions` | « marché réel » | « jeu synthétique de démonstration » | « jeu de données fictif à la forme AutoScout24 (aucune annonce réelle) » | « nature non établie » |

Règle de conception écrite dans l'en-tête du module : **le défaut n'est jamais « réel »**. Une nature
non reconnue le DIT au lieu d'hériter du silence de `REAL` — se taire, sur cette question, c'est
laisser croire au marché réel.

Le profil (`test`, `dev`, …) est déduit de la spécification retenue par le registre
(`fixtureProfileOf`), jamais écrit en dur ; le nombre de snapshots est **relevé** de l'index du
profil par `main.tsx` (`countFixtureSnapshots`, même chargeur HTTP que le provider, réponse en cache).
Si l'un ou l'autre n'est pas su, la phrase dégrade (« (profil test) », puis sans parenthèse) plutôt
que d'annoncer un chiffre faux.

L'export CSV portait déjà la valeur brute de `sourceKind` dans sa première ligne d'en-tête
(`# snapshot;<id>;<capturedAt>;FIXTURE`) : rien à corriger, la valeur n'y est jamais interprétée.

### Preuves

- `tests/review/D8/shell-wiring-3.5.test.ts` — **écrite rouge d'abord** (8 sondes rouges sur 14),
  verte après correction. Six sondes de **comportement** sur le module pur (les quatre branches de
  chaque fonction), deux sondes de **câblage** (la coquille emploie le module ; les deux littéraux
  fautifs ont disparu de `src/app.tsx` et de `MentionsPage.tsx`).
- `tests/e2e/source-fixture.spec.ts` §`EX-DATA-107` — 5 tests sur le **build de production** :
  bandeau (texte exact relevé : « Jeu de données fictif à la forme AutoScout24 (profil test,
  3 snapshots) — aucune annonce réelle. »), pied de page (n'attribue rien à AutoScout24), `/mentions`,
  panneau Diagnostic (`describe()` relaie bien `FIXTURE`), traçabilité du snapshot servi.

**Effet de bord bénéfique mesuré** : `impression.spec.ts` « règle 2 : les bandeaux d'état et le
bandeau C3 sont imprimés » échouait parce qu'aucun `.status-banner` n'était monté — le seul qui
existait était celui de `SYNTHETIC`. Le bandeau de provenance `FIXTURE` le remet, et la sonde
d'impression redevient verte **sans être touchée**.

---

## 2. Bascule de source visible (mission §2)

**Constat d'entrée** : `registry.ts` écrit son avertissement de repli dans la `coverageNote` du
`SnapshotDescriptor`, « que la coquille affiche déjà ». Vérification faite : **aucun écran n'affiche
la `coverageNote`** (elle n'apparaît que dans les métadonnées CSV, sous la clé `sampleCoverage`). Un
`?provider=` inconnu retombait donc sur le défaut **en silence** pour l'utilisateur — contre `D-03`.

### Correction

- `src/main.tsx` transmet à `<App>` : `providerSpec` (spécification RETENUE), `providerWarning`
  (motif de repli) et `fixtureSnapshotCount`.
- `src/app.tsx` en fait un bandeau d'état **`ET-SOURCE-REPLI`**, inséré dans la pile normative
  (`EX-SCR-38`) juste après `ET-PARTIEL-CACHE` et avant les bandeaux de filtres : savoir QUELLE
  source répond prime sur savoir quel filtre elle n'a pas pu appliquer.
- La `coverageNote` continue de le porter (traçabilité, export) : rien n'est retiré.

### Preuves

`tests/e2e/source-fixture.spec.ts` §`DF-2` — 4 tests, tous verts, mesures relevées :

| Cas | Résultat mesuré |
|---|---|
| `?provider=fixture:dev` | étiquette « … (profil dev, 3 snapshots) … », effectif < profil test, **aucun** bandeau de repli |
| `?provider=synthetic` | étiquette « Données synthétiques de démonstration… », Diagnostic `SYNTHETIC`, aucun repli |
| `?provider=carrosserie-de-mon-oncle` | bandeau de repli : « Source de données « carrosserie-de-mon-oncle » inconnue : … revenue à la source par défaut (fixture:test). Sources reconnues : fixture:test, fixture:dev, fixture:perf, synthetic, tweedehands. » ; la source servie est bien le défaut |
| `?provider=tweedehands` (non câblé) | bandeau de repli portant le motif `AC-01` / `D-18` ; source servie = défaut |

Les trois specs demandées chargent bien de bout en bout (URL → registre → provider → étiquette).

---

## 3. `D3-21` — la liste d'arrêt d'`EX-DATA-30` est enfin chargée (mission §3)

**Constat d'entrée** (`C-P3-11`) : `data/reference/version-stoplist.json` et
`version-lexicon.json` sont versionnés et servis par le plugin `kycar-reference-data`, mais **lus par
aucun des deux chargeurs**. `RawReferenceInputs.versionStoplist` restait `undefined`, donc
`ReferenceData.versionStoplist` valait `[]`, donc **l'étape 3 du pipeline `EX-DATA-29` était inerte
dans toute l'application** — et avec elle la **deuxième barrière R3** sur le seul texte libre
conservé (entrées `kind = contact` : « tel », « @ », « www. »…).

### Correction

- `src/orchestration/reference-loader.ts` (navigateur) : les deux fichiers sont demandés dans la
  **même vague parallèle** que la taxonomie et les 15 fichiers de référence (< 3 Kio à eux deux,
  aucun effet mesurable sur `EX-NFR-9`). Deux constantes exportées, `VERSION_STOPLIST_FILE` et
  `VERSION_LEXICON_FILE`, pour que les deux chargeurs ne puissent pas diverger sur le nom.
- `src/orchestration/reference-fs.ts` (Node) : lit les deux mêmes fichiers.

Le plugin Vite servait déjà tout `data/reference/` (et le recopie dans `dist/reference/`) : aucune
modification de `vite.config.ts` n'était nécessaire — vérifié plutôt que supposé.

### Preuve

`tests/review/D8/reference-stoplist.test.ts`, **écrite rouge d'abord — 5 sondes sur 5 rouges**, 5/5
vertes après correction :

1. chargeur Node : `versionStoplist` / `versionLexicon` présents dans les entrées brutes ;
2. chargeur Node : `ReferenceData.versionStoplist` non vide, **et** toutes les entrées
   `kind = contact` présentes ;
3. chargeur **navigateur** : `fetch` simulé sur les fichiers du dépôt (aucun réseau, E5) — les URL
   `/reference/version-stoplist.json` et `/reference/version-lexicon.json` sont bien demandées et
   l'assemblage rend les bonnes tailles ;
4. étape 3 exercée de bout en bout : `« --- PROMO --- 1.4 Turbo »` → le marqueur est retiré, et la
   sonde montre le contre-exemple (sans liste, `PROMO` survit) ;
5. deuxième barrière R3 : `« 1.2 TSI tel 0470 12 34 56 »` → l'amorce `tel` est retirée.

Aucune fuite R3 ne s'était produite (les fixtures sont propres par construction) ; le risque portait
sur toute source réelle branchée ensuite. Les suites unitaire (756), de revue (1 127) et de contrat
(83) restent vertes après ce changement de comportement d'ingestion.

---

## 4. Câblage 2.10 (mission §4, `D3-23`)

### 4.1 `ACC-16` — le bandeau `ET-FILTRE-NON-APPLIQUE` nomme des libellés

`src/app.tsx` : `filterDisplayLabels(unapplied)` remplace `unapplied.join(', ')`. Le bandeau dit
désormais « le filtre **Boîte de vitesses** n'a pas pu être appliqué » là où il disait `gearType` —
exactement le mot que porte le jeton juste au-dessus. Sonde : `R-D8-3.5-04` (rouge d'abord).

### 4.2 `ACC-13` mode 1 — signaler un recalcul en cours sur l'écran A

Trois pièces, parce que la prop seule aurait été du code mort :

1. `MarketScreen` reçoit `recalculating?: boolean` et le consomme **comme l'écran B** : temporisation
   partagée `RECALC_INDICATOR_DELAY_MS` (importée de `DistributionScreen`, jamais recopiée : deux
   seuils qui dériveraient feraient de « 150 ms » une valeur d'écran au lieu d'une règle), classe
   `--recalculating`, `aria-busy`, `data-recalculating`, barre de progression indéterminée.
2. `src/app.tsx` mémorise le **dernier résultat affiché** (`lastMarketData`) : `reloadMarket` remet la
   phase à `loading`, ce qui vidait la grille et la repeuplait, alors qu'`EX-SCR-24` demande une mise
   à jour **atténuée**. Les chiffres du périmètre précédent restent donc à l'écran pendant le
   recalcul, et le squelette redevient ce qu'il doit être : le rendu du **premier** chargement.
3. `src/app/app.css` : l'atténuation à 0,55 déjà écrite pour l'écran B est étendue à la grille et à
   la barre de synthèse de l'écran A.

Sonde : `R-D8-3.5-05` (rouge d'abord). En recette, `ACC-13` (« aucun indicateur sous 150 ms ») reste
vert : `indicateur au repos : aucun`.

---

## 5. E2E réalignés sur le profil `test` (mission §5)

### 5.1 Méthode de dérivation

Nouveau module `tests/e2e/_expected.ts`. Il ne réimplémente **pas** la sélection : il **rejoue le
câblage de production**, en Node, sur les mêmes octets que ceux servis au navigateur.

1. `loadReferenceDataFromDisk()` — les référentiels du dépôt, ceux que le plugin Vite sert ;
2. `FixtureDataProvider` sur le profil `test` avec le chargeur **disque**, qui sert le même contrat
   `FixtureLoader` que le chargeur HTTP : même flux, même `DecompressionStream`, même adaptateur
   as24 → canonique, mêmes rejets d'ingestion, même dédoublonnage. Le snapshot retenu est celui que
   retient l'application : **le plus récent** du profil ;
3. `DataController` + moteur D4 **in-process** (`createInProcessEngineClient`, le code même du Web
   Worker) ;
4. `loadMarket(selection)` / `enterMode2(...)` avec la sélection **décodée par le codec d'URL de
   l'application** (`loadQuery`) à partir de la chaîne du parcours — jamais réécrite à la main.

Un attendu manquant fait échouer bruyamment ; aucune valeur de repli n'est inventée. Coût mesuré :
**≈ 3,3 s**, payés une fois par processus de travail Playwright (mémoïsation de la promesse).

**Ce qui reste figé** : ce qui ne vient pas des données — chaînes d'URL des parcours, chemins de
route, clés et plafonds de persistance, budgets de performance, formats d'affichage. Ces valeurs-là
viennent des exigences.

### 5.2 Valeurs dérivées au profil `test` (snapshot `be-20260921T060000Z`)

| Grandeur | Ancien (synthétique 100 000) | Profil `test` |
|---|---|---|
| annonces ingérées | 100 000 | **19 980** (20 000 annoncées, 20 doublons arbitrés, 0 rejet) |
| marques / modèles sans filtre | > 1 000 marques attendues | **262 marques**, 1 450 modèles |
| parcours 1 (`?body=3&kmto=100000&priceto=20000`) | 107 marques / 2 632 offres | **17 marques / 32 offres** |
| Opel Corsa, cellule entière | 1 352 | **352** |
| Opel Corsa 2017 | 54 | **19** |
| Volkswagen Golf (repère `E-06`) | — | **585** |

Les deux repères de densité de `DATASET-SPEC.md` §`E-06` (Corsa ≈ 357, Golf ≈ 590) sont retrouvés à
l'unité près sur le dernier snapshot, ce qui confirme que la chaîne de dérivation lit bien le jeu
attendu.

### 5.3 Tests réalignés (attendus dérivés)

`parcours-p1` (4 assertions), `parcours-p2` (7), `partage-url` (2), `perf` (1, prémisse) :
`P1_EXPECTED` / `P2_EXPECTED` supprimés de `_helpers.ts` et remplacés par `await derived()`.

### 5.4 Tests qui échouaient pour une AUTRE cause que les attendus

Cinq familles, diagnostiquées une par une. Aucun `test.fail()` ni `test.skip` n'a été ajouté.

| Test | Cause réelle | Traitement |
|---|---|---|
| `impression.spec.ts:42` (règle 2) | aucun `.status-banner` monté : le seul existant était celui de `SYNTHETIC`, et la source est `FIXTURE` | **corrigé par le produit** (§1), sonde non touchée |
| `finition-2.10.spec.ts` `ACC-10` (virtualisation) | prémisse fausse : le test suppose « P1 retient 107 marques », or P1 en retient 17 au profil `test` — sous le seuil de virtualisation de 40 | le test s'exerce sur une sélection **dense** (`?priceto=20000`, 204 marques) et **vérifie sa prémisse** sur les fixtures au lieu de la supposer. Mesuré : 12 cartes montées sur 1 212 nœuds |
| `responsive.spec.ts:93` (repli des zones) | même prémisse de densité : il faut une marque portant plus de 6 zones-modèles | même traitement (sélection dense) |
| `parcours-p1` (fourchette « centrale ») | **comportement correct du produit** : sous `n = 12`, `EX-SCR-33`/`114` impose « fourchette observée (min – max, effectif réduit) ». Les cartes du parcours 1 portent `n = 6` et `n = 2` | le test du parcours accepte les DEUX légendes (c'est la branche réduite qui est due à cet effectif) ; un **nouveau** test exerce la branche dense et exige le libellé exact « fourchette centrale (90 % des offres) ». Les deux branches sont désormais couvertes |
| `parcours-p2:118` (clic sur barre G1) | la barre non vide retenue est la **première classe de prix** ; sa borne basse vaut le minimum du domaine, et `EX-NAV-9` omet de l'URL tout filtre resté à sa valeur par défaut — l'URL ne portait que `priceto` | le test préfère une barre **intérieure** (preuve des deux bornes) et n'exige `pricefrom` que dans ce cas. Ce n'est pas un écart : c'est la canonicalisation |
| `parcours-p2:221` (`E2E-06`, brossage) | **faux négatif du harnais** : le rectangle 15 %–75 % de `brushScatter` avait été réglé sur la forme du nuage synthétique ; sur la cellule Corsa (317 points tracés) il tombait dans une zone vide | le rectangle couvre 5 %–95 % du cadre : le geste reste un vrai glisser-déposer, mais ne dépend plus de la répartition des points |

### 5.5 Sondes de revue mises à jour (conséquence assumée)

- `shell-static.test.ts` `R-D8-22` : la sonde exigeait le **littéral** « agrégat non affilié » dans
  `src/app.tsx`. Ce littéral était précisément le défaut corrigé ; la sonde exige maintenant l'emploi
  de `footerSourceLine`, dont les quatre branches sont éprouvées en comportement.
- `shell-wiring-2.8.test.ts` `EX-SCR-38` : la liste ordonnée des bandeaux gagne `ET-SOURCE-REPLI` à
  sa place normative.

---

## 6. Portes et budgets

| Porte | Résultat |
|---|---|
| `tsc -p tsconfig.json` | vert |
| `tsc -p tsconfig.worker.json` | vert (via `npm run build`) |
| `tsc -p tsconfig.review.json` | vert |
| `tsc -p tsconfig.contract.json` | vert |
| `npm run lint` | vert |
| `npm run build` | vert, 0 erreur / 0 avertissement |
| `npm run size` | **132,50 / 300 Kio gzip** (initial 118,60 + worker 13,90) — marge 56 % |
| `npm run test:unit` | **756 / 756** |
| `npm run test:review` | **1 127 / 1 127** (2 nouvelles sondes, 19 nouveaux cas) |
| `npm run test:contract` | **83 / 83** |
| `npm run test:e2e` | voir §6.1 |

<!-- E2E_RESULTS -->

---

## 7. Écarts de périmètre, constats pour le coordinateur, hypothèses E4

<!-- CONSTATS -->
