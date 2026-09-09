# PLAN 3 — Données fictives AutoScout24-conformes et MVP utilisable

**Décision du commanditaire (2026-09-09)** : l'accès aux données réelles AutoScout24 est **mis de
côté** (`docs/research/AUTOSCOUT24-PROVIDER-OPTIONS.md` : voies conformes = SEARCH API sur devis,
Parking Data, flux concessionnaires ; scraping tiers exposé juridiquement). Le projet continue sur des
**données fictives, cohérentes en structure avec AutoScout24**, jusqu'à ce que le fonctionnel et le
visuel conviennent ; l'intégration d'une source réelle viendra ensuite, par simple remplacement de
provider.

Trois exigences du commanditaire, qui sont les critères de fond du chantier :

- **DF-1 Volume et exploitabilité** : assez de données pour que les tests (unitaires, sondes, E2E,
  perf) soient significatifs — pas un échantillon de démonstration.
- **DF-2 Structure propre et débranchable** : une couche « source » à la forme AutoScout24, un
  adaptateur, une couche canonique KYCAR ; brancher une autre source = écrire un adaptateur, sans
  toucher au moteur ni aux écrans ; la bascule de provider est un paramètre, pas une recompilation.
- **DF-3 Justesse des données** : modèle correct (types, nullabilité, clés, référentiels, unités),
  données plausibles (distributions, corrélations, valeurs manquantes réalistes, anomalies
  contrôlées avec vérité terrain), aucune donnée vendeur identifiante (R3), tout **revu par un agent
  indépendant** et corrigé si besoin.

Ce qui existe déjà et sur quoi on construit : le dictionnaire de données (`draft-data-dictionary.md`)
est **dérivé du schéma OpenAPI officiel AutoScout24** (`as24-listing-creation-openapi.yml`, 63
renvois `OAS:`), la taxonomie marques/modèles vient des référentiels AutoScout24
(`data/reference/taxonomy*.json`), et `SyntheticDataProvider` (lot D3) génère déjà 100 000 annonces
**en mémoire, à la volée**. Ce qui manque : des **fichiers de données** figés et versionnés, à la
forme AutoScout24, servis par un provider de fixtures, avec un schéma publié, une revue indépendante
et une bascule de provider.

---

## Organisation (CLAUDE.md §2–§4)

Coordinateur = session (Fable/high). Un agent par tâche ; modèle et effort déclarés ci-dessous et
répétés dans la mission. Parallèle = worktrees isolés à périmètres disjoints ; séquentiel = arbre
principal. Revue de la structure et des données par un **agent indépendant** (`data-review`), suivi
d'un **correcteur** (`data-fix`) si la revue est rouge, puis re-revue par le même agent (delta).

Le chantier **2.10 finition visuelle** (dette D8-43, `reports/ACCEPTANCE.md` §8) court **en parallèle**
du plan 3 : périmètres disjoints (`src/screens`, `src/components`, CSS ↔ `data/`, `tools/`,
`src/providers`). Il est décrit en §2.10 ci-dessous et rejoint le flux à l'intégration (3.5).

Autocompaction : le coordinateur demande une compaction à ~70 % de contexte en gardant ce qui est
nécessaire pour terminer la phase en cours et lancer la suivante (identifiants d'agents vivants,
décisions D3-nn ouvertes, portes restantes) ; `docs/HANDOFF.md` et ce plan sont tenus à jour à chaque
fin de phase pour qu'une compaction ne perde rien.

---

## Phases

### 3.0 — Cadrage (SÉQUENTIEL, coordinateur, fait dans ce commit)

Livrables : ce plan ; décision consignée dans `EXECUTION-LOG.md` ; `CLAUDE.md` §4.7 ; journal des
décisions `reports/data/DATA-LEAD-DECISIONS.md` (D3-01…) ouvert par le coordinateur.

### 3.1 — Conception (PARALLÈLE, 3 agents, sorties disjointes)

| Agent | Modèle / effort | Périmètre d'écriture | Livrable |
|---|---|---|---|
| `data-model` | **Opus / high** (interface gelée à confronter à un schéma externe) | `docs/data/DATA-MODEL.md`, `data/schema/*.schema.json` | Modèle en trois couches : (1) **source** `As24Listing` — JSON à la forme AutoScout24 (OpenAPI Listing Creation + champs de lecture connus de la SEARCH API/annonces publiques : prix, TVA, `firstRegistrationDate`, kilométrage, énergie, boîte, puissance kW/ch, carrosserie, portes, sièges, couleur, équipements, CO₂/WLTP, consommation, garantie, `sellerType`, localisation code postal/ville/pays, dates de publication, tier, images en nombre seulement), avec **JSON Schema** ; (2) **adaptateur** `as24 → canonique` (mapping champ à champ, unités, vocabulaires, règles de validation du dictionnaire, drapeaux d'ingestion) ; (3) **canonique** = les 13 entités existantes de `src/types` (inchangées sauf écart démontré). Table des écarts dictionnaire ↔ schéma AS24 ; **règle R3** : aucun champ vendeur identifiant dans la couche source non plus (nom, téléphone, e-mail, URL, id vendeur exclus par construction ; seul `sellerType` PRO/PRIVATE et une **clé de regroupement pseudonyme** `dealerBucket` non réversible sont admis, décision D3-02). |
| `dataset-design` | **Opus / high** (statistiques opposables) | `docs/data/DATASET-SPEC.md` | Spécification des données : marché belge, **3 snapshots** hebdomadaires (deltas ≈ 8–12 % d'annonces sorties/entrées, prix révisés), volumes **dev 5 000 / test 20 000 / perf 100 000** annonces par snapshot ; distributions par segment × âge × kilométrage × énergie (prix log-normal par cellule, dépréciation, prime électrique/hybride, TVA déductible ≈ 35 % des pros), pro/particulier ≈ 70/30, provinces/codes postaux belges pondérés par population, langues des libellés (fr/nl), équipements corrélés au segment et à l'année, valeurs manquantes **réalistes par champ** (taux issus de l'observation 2dehands/dictionnaire, jamais uniformes), **anomalies contrôlées avec vérité terrain** (prix sur demande, sentinelles, km incohérents, doublons inter-vendeurs, versions ambiguës), saisonnalité légère. Chaque règle porte sa justification et sa **sonde de vérification** attendue (test statistique, tolérance). |
| `visual-2.10` | **Opus / high** (ACC-02/03/06 = mise en page et état d'URL), puis **Sonnet / high** (ACC-04, 07–15, corrections dont le constat dit quoi faire) | worktree `fix210/visual` : `src/screens`, `src/components`, CSS, `tests/review/D6`, `D7`, `tests/e2e` (ajouts) ; JAMAIS `app.tsx`, `src/state` (sauf `sel` 2D pour ACC-06, borné) | Dette D8-43 : ACC-02 bandeau collant réel et hauteur repliée ≤ 40 % viewport ; ACC-03 régime compact de l'écran B ; ACC-06 `sel` 2D conservé jusqu'à l'écran D ; ACC-04, 07, 08, 09, 10, 11, 12, 13, 14, 16. Sonde/E2E rouge d'abord pour chacun ; rapport `reports/remediation-2.10/visual.md`. |

**Critères de succès 3.1** : S1 `DATA-MODEL.md` couvre 100 % des champs du dictionnaire (table champ →
source AS24 → canonique, ou « sans équivalent, justifié ») ; S2 JSON Schema valide (ajv, devDep) sur
un exemple minimal et un exemple complet ; S3 `DATASET-SPEC.md` : chaque distribution a une formule,
des paramètres chiffrés, une justification et une sonde ; S4 zéro champ R3 dans la couche source ;
S5 2.10 : chaque constat traité a sa preuve rouge → verte, ou une dette écrite.

### 3.2 — Générateur et fixtures (SÉQUENTIEL, après 3.1 `data-model` + `dataset-design`)

| Agent | Modèle / effort | Périmètre | Livrable |
|---|---|---|---|
| `dataset-gen` | **Opus / high** (déterminisme, distributions, budget de taille) | `tools/dataset/` (générateur TypeScript, exécuté par `tsx`/`node`), `data/fixtures/`, `package.json` scripts, `.gitignore` | `npm run data:gen -- --profile dev|test|perf --seed <n>` : produit `data/fixtures/<profile>/<snapshotId>/listings.ndjson.gz` **à la forme AS24** + `manifest.json` (seed, version du schéma, compte, hachage, vérité terrain des anomalies) ; **commités** : dev (3 × 5 000) et test (3 × 20 000) ; perf (3 × 100 000) généré à la demande, ignoré par git. Déterminisme : même seed = mêmes octets (sonde). Validation de chaque ligne contre le JSON Schema à la génération. Réutilise `src/providers/synthetic/prng.ts`, `catalog.ts`, `popularity.ts` (lecture) ; la taxonomie et les vocabulaires de `data/reference/`. |

**Critères 3.2** : S1 déterminisme prouvé ; S2 100 % des lignes valides au schéma ; S3 volumes et
tailles (test ≤ 8 Mio gz commités au total) ; S4 manifest avec vérité terrain ; S5 génération perf
< 60 s.

### 3.3 — Revue indépendante ET provider (PARALLÈLE, après 3.2)

| Agent | Modèle / effort | Périmètre | Livrable |
|---|---|---|---|
| `data-review` (**reviewer indépendant**) | **Opus / high** (preuves statistiques, jugement de structure) | `tests/data/` (sondes exécutables, config `vitest.data.config.ts`), `reports/data/DATA-REVIEW.md` ; lecture seule ailleurs | Revue **de la structure** (schéma : types, nullabilité, unités, clés, unicité, référentiels, cohérence avec le dictionnaire et l'OpenAPI ; adaptateur : perte d'information, arrondis, vocabulaires ; R3) et **des données** (distributions vs spec avec tests statistiques, corrélations, cohérences croisées : première immatriculation ≤ publication ≤ snapshot, km/âge plausibles, prix/segment, TVA seulement chez les pros, codes postaux belges valides, doublons attendus et non attendus, deltas inter-snapshots, vérité terrain retrouvable). Chaque constat = sonde rouge, sévérité, exigence. Verdict S1–S4 de cette phase. |
| `fixture-provider` | **Opus / high** (implémentation d'une interface gelée + perf) | `src/providers/fixture/`, `src/providers/registry.ts`, `src/main.tsx` (sélection), `tests/contract/`, `vite.config.ts` (service des fixtures), docs `src/providers/README.md` | `FixtureDataProvider` : charge un profil (`fetch('/fixtures/…')`, décompression en flux, budget mémoire ARB-55), passe par **l'adaptateur as24 → canonique** de 3.1, sert **mode 1 et mode 2**, `SourceKind` étendu (`'FIXTURE'`, étiqueté dans l'UI et `/mentions`), `describe()` sincère. **Registre de providers** + bascule par paramètre (`?provider=fixture:test`, `VITE_KYCAR_PROVIDER`, défaut = fixture test) sans recompilation. **Suite de contrat** `tests/contract/provider-contract.test.ts` : mêmes cas exécutés sur synthetic, fixture et le mock tweedehands (capabilities sincères, invariants I1–I8, `unsupportedFilterIds`, R3 à l'ingestion, déterminisme d'`openSnapshot`, budgets EX-NFR-1/3/5). |

**Critères 3.3** : S1 revue rendue avec sondes exécutables, zéro BLOQUANT non consigné ; S2 provider
passe la suite de contrat ; S3 bascule prouvée (trois providers, un paramètre) ; S4 budgets tenus
sur le profil test (ouverture < 2 s, recalcul p95 < 200 ms) et mesurés sur perf.

### 3.4 — Correction et re-revue (SÉQUENTIEL, si 3.3 revue rouge)

| Agent | Modèle / effort | Périmètre |
|---|---|---|
| `data-fix` (**correcteur**) | **Opus / high** (le constat dit quoi, pas comment : distributions, schéma) — **Sonnet / high** si tous les constats restants sont des corrections locales entièrement spécifiées | `tools/dataset/`, `data/schema/`, `data/fixtures/` (régénération), `docs/data/` ; la sonde du reviewer passe **sans être modifiée** (D-31/D-32) |
| `data-review` (même agent, relancé par message) | Opus / high | delta seulement, verdict |

**Critères 3.4** : chaque constat BLOQUANT/MAJEUR corrigé (sonde verte) ou en dette écrite D3-nn ;
fixtures régénérées et re-commitées avec leur manifest.

### 3.5 — Intégration MVP et recette (SÉQUENTIEL)

| Agent | Modèle / effort | Périmètre |
|---|---|---|
| `mvp-integrate` | **Opus / high** | arbre principal : fusion de `fix210/visual`, provider fixture par défaut, `sourceKind` dans les mentions, E2E adaptés (`P1_EXPECTED` recalculé sur le profil test, justifié), `npm test` + `test:e2e` complets, docs (`README`, `DEV`, `HANDOFF`) |
| `acceptance` (rev 3) | **Fable / max** (verdict de livraison) | `reports/ACCEPTANCE.md` rev 3 sur le build fixture : E2E 3 projets, axe, budgets, P1/P2 sur données fictives, statut des ACC |

**Critères 3.5 / porte G9** : E2E verts 3 projets sur le provider fixture ; 0 violation axe ; budgets
tenus ; bascule `?provider=synthetic` fonctionnelle ; `ACCEPTANCE.md` rev 3 livré ; dettes nommées.

---

## Séquencement

```
3.0 cadrage (coordinateur) ── commit « décision données fictives, planification »
        │
        v  PARALLÈLE (3 worktrees/sorties disjointes)
  data-model Opus/high ── dataset-design Opus/high ── visual-2.10 Opus/high → Sonnet/high
        │                        │                            │ (continue jusqu'à 3.5)
        └──────────┬─────────────┘                            │
                   v  SÉQUENTIEL                              │
            dataset-gen Opus/high (fixtures dev+test commitées)│
                   │                                          │
                   v  PARALLÈLE                               │
     data-review Opus/high ── fixture-provider Opus/high      │
                   │                                          │
                   v  SÉQUENTIEL si rouge                     │
     data-fix Opus/high (ou Sonnet/high) → data-review (delta)│
                   │                                          │
                   v  SÉQUENTIEL  <───────────────────────────┘
     mvp-integrate Opus/high → acceptance rev 3 Fable/max → porte G9 → journal, handoff, push
```

Portes : **G9a** après 3.2 (fixtures valides, déterministes, commitées) · **G9b** après 3.4 (revue des
données verte ou dettes écrites) · **G9** après 3.5.

## Décisions ouvertes au démarrage (à consigner en D3-nn)

- D3-01 profil par défaut de l'application = `fixture:test` (20 000) ; `perf` sert aux bancs.
- D3-02 identité vendeur : jamais dans les fixtures ; `sellerType` + `dealerBucket` pseudonyme
  (nécessaire pour les doublons inter-vendeurs et le biais publicitaire), non réversible.
- D3-03 format : NDJSON gzip (lisible, diffable ligne à ligne avant compression, flux), un fichier
  par snapshot, manifest à côté ; Parquet écarté (dépendance lourde côté navigateur).
- D3-04 `SyntheticDataProvider` conservé (bancs de perf, génération à la volée) ; le générateur de
  fixtures en réutilise les briques mais écrit des fichiers à la forme AS24, pas le colonnaire.
