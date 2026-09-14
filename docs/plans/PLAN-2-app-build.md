# PLAN 2 — Conception et construction de l'application d'agrégation
### Exigences, stress-test des exigences, développement phasé, revue, remédiation

**Objectif** : livrer une application web fonctionnelle qui présente l'offre AutoScout24 à
plusieurs niveaux d'agrégation, avec l'intégralité des filtres du site source, un écran de
survol marque/modèle et un écran d'analyse de distribution.

**Livrable final** : application exécutable + `docs/requirements/REQUIREMENTS.md` gelé +
`reports/` contenant les rapports de revue et de remédiation.

---

## Règles transverses

| # | Règle |
|---|---|
| R1 | La source de vérité fonctionnelle est `REQUIREMENTS.md`. Aucun développement ne commence sur une exigence non écrite ; toute décision prise en cours de dev remonte dans le document. |
| R2 | Le code ne connaît jamais le fournisseur de données. Tout passe par l'interface `DataProvider`. Le chantier 1 ne peut donc pas bloquer le chantier 2. |
| R3 | Aucun champ identifiant un vendeur particulier n'existe dans le schéma (nom, téléphone, email, adresse exacte, URL de contact). Contrainte structurelle, pas conventionnelle. |
| R4 | Chaque phase de dev est jugée sur des critères de succès **vérifiables par exécution** (test qui passe, commande qui produit une sortie attendue), jamais sur une appréciation. |
| R5 | Les revues sont adverses et faites par des agents qui n'ont pas écrit le code revu. |
| R6 | Le catalogue de filtres et la taxonomie marque/modèle sont **relevés sur AutoScout24**, pas inventés. Toute valeur non relevée est marquée comme extrapolée. |

---

## Phase 2.0 — Extraction des données de référence (PARALLÈLE, 2 agents)

Préalable factuel aux exigences : on ne peut pas spécifier « tous les filtres d'AutoScout24 »
sans les avoir relevés.

- **Agent `ref-filters`** — modèle **Opus**, effort **high**
  Relever le catalogue complet des filtres de recherche AutoScout24 : identifiant technique du
  paramètre d'URL, libellé, type (énumération / intervalle / booléen / texte / géo), domaine de
  valeurs, valeur par défaut, dépendances entre filtres (un filtre qui n'apparaît que si un autre
  est posé), et comportement multi-valeurs.
  **Livrable** : `docs/requirements/REF-filters.md`
- **Agent `ref-taxonomy`** — modèle **Sonnet**, effort **medium-high**
  Relever la taxonomie marque → modèle → (variante/version si disponible), avec les identifiants
  numériques utilisés par le site. Produire un fichier de données exploitable, pas seulement de la prose.
  **Livrables** : `docs/requirements/REF-taxonomy.md` + `data/reference/taxonomy.json`

- **Critères de succès de la phase** :
  - S1 — au moins 40 filtres distincts documentés avec leur paramètre d'URL réel.
  - S2 — chaque filtre porte son type et son domaine de valeurs ; les énumérations sont exhaustives ou marquées partielles.
  - S3 — `taxonomy.json` est un JSON valide, au moins 60 marques, chaque marque ayant sa liste de modèles.
  - S4 — provenance tracée : pour chaque bloc, l'URL ou la commande qui l'a produit.
  - S5 — les valeurs non relevées sont explicitement marquées `[EXTRAPOLÉ]`.

## Phase 2.1 — Document d'exigences (séquentiel, 1 agent coordinateur + 3 sous-agents parallèles)

- **Coordinateur `req-lead`** — modèle **Opus**, effort **max**
  Établit le plan du document, répartit les sections, impose le format, assemble et harmonise.
- **Sous-agents parallèles** :
  - `req-data` — **Opus**, effort **high** — dictionnaire de données : chaque champ d'annonce utile,
    son type, son unité, sa cardinalité, son caractère obligatoire, sa source, sa règle de
    normalisation, sa règle de validation, son traitement en cas d'absence. Plus le schéma des
    entités dérivées (agrégats marque, agrégats modèle, buckets de distribution).
  - `req-screens` — **Opus**, effort **high** — pour **chaque écran** : structure et disposition de
    tous les éléments (arborescence des blocs, position, hiérarchie visuelle, densité), contenu
    exact de chaque élément, états (vide, chargement, erreur, résultat partiel, trop de résultats),
    comportement responsive, et pour chaque élément interactif son action et sa cible.
  - `req-behaviour` — **Sonnet**, effort **high** — navigation (routes, paramètres d'URL,
    profondeur d'historique, partageabilité d'un état de recherche), recherche (débounce,
    application immédiate ou différée, réinitialisation, combinaison des filtres), CRUD
    (ce qui est créable/modifiable/supprimable par l'utilisateur : recherches sauvegardées,
    listes de suivi, annotations, exports), et exigences non fonctionnelles chiffrées.
- **Livrable** : `docs/requirements/REQUIREMENTS.md`

**Contenu minimum imposé au document** :
1. Objet de l'application et cas d'usage (repris et développé depuis `00-CONTEXT.md`).
2. Glossaire — un terme, une définition, aucune ambiguïté.
3. Dictionnaire de données complet, champ par champ.
4. Modèle d'agrégation : définition mathématique de chaque agrégat et de chaque bucket.
5. Inventaire des écrans, avec pour chacun sa maquette structurelle textuelle.
6. Spécification du bandeau de filtres, filtre par filtre, avec son mappage vers le modèle de données.
7. Spécification écran par écran des interactions, de la navigation et du CRUD.
8. Règles d'états dégradés et de gestion d'erreur.
9. Exigences non fonctionnelles chiffrées (volumétrie, temps de réponse, taille de bundle, accessibilité).
10. Exigences de confidentialité et de conformité, dérivées de `00-CONTEXT.md`.
11. Matrice de traçabilité exigence → critère de vérification.

- **Critères de succès** :
  - S1 — les 11 sections présentes et non vides.
  - S2 — chaque exigence porte un identifiant unique et stable (`EX-<domaine>-<n>`).
  - S3 — chaque exigence est vérifiable : la matrice de traçabilité donne pour chacune le moyen de contrôle.
  - S4 — tout filtre de `REF-filters.md` est soit spécifié, soit explicitement hors périmètre avec motif.
  - S5 — tout champ du dictionnaire est rattaché à au moins un écran ou à un agrégat ; aucun champ orphelin.
  - S6 — les deux écrans obligatoires sont spécifiés au niveau élément : vue marque/modèle et vue distribution.
  - S7 — zéro emploi de formulation non mesurable (« rapide », « intuitif », « moderne ») sans chiffre associé.

## Phase 2.2 — Stress-test des exigences (séquentiel, 3 agents parallèles + 1 arbitre)

- **Agents parallèles, chacun avec un angle d'attaque distinct** :
  - `st-complete` — **Opus**, effort **high** — chasse aux trous : quel comportement n'est pas décrit ?
    Parcourt chaque écran et chaque interaction en cherchant le cas non traité, l'état non défini,
    la transition manquante, le champ utilisé nulle part, l'agrégat non calculable avec les données décrites.
  - `st-ambiguity` — **Opus**, effort **high** — chasse à l'ambiguïté : quelle exigence admet
    deux implémentations correctes et divergentes ? Doit produire, pour chaque ambiguïté, les
    deux lectures concurrentes afin de prouver l'ambiguïté.
  - `st-adversarial` — **Sonnet**, effort **high** — chasse à la rupture : jeux de données
    pathologiques (0 résultat, 1 résultat, 1 million, prix nul, année manquante, modèle inconnu,
    valeurs aberrantes, doublons), et exigences non fonctionnelles mises à l'épreuve du chiffre.
- **Arbitre `st-arbiter`** — **Opus**, effort **max** — fusionne les trois rapports, déduplique,
  cote chaque constat en `BLOQUANT` / `MAJEUR` / `MINEUR`, puis **édite directement**
  `REQUIREMENTS.md` pour résoudre tous les `BLOQUANT` et `MAJEUR`. Gèle le document en v1.0.
- **Livrables** : `reports/REQ-STRESSTEST.md` + `REQUIREMENTS.md` en v1.0 gelé.
- **Critères de succès** :
  - S1 — au moins 30 constats émis au total, avant déduplication.
  - S2 — chaque ambiguïté relevée est accompagnée de ses deux lectures concurrentes.
  - S3 — zéro constat `BLOQUANT` ou `MAJEUR` non résolu à la sortie de la phase.
  - S4 — le document gelé porte un numéro de version et un journal des modifications apportées par l'arbitre.
  - S5 — les constats `MINEUR` non traités sont consignés comme dette explicite, pas silencieusement abandonnés.

## Phase 2.3 — Architecture et choix techniques (séquentiel, 1 agent)

- **Agent `arch-lead`** — **Opus**, effort **high**
- **Mission** : figer la pile, le découpage en modules, l'interface `DataProvider`, le schéma de
  persistance, la stratégie d'agrégation (client ou serveur, en mémoire ou indexée), la
  stratégie de rendu des graphes à forte cardinalité, la gestion d'état des filtres et sa
  synchronisation avec l'URL. Justifier chaque choix contre les exigences non fonctionnelles chiffrées.
- **Livrable** : `docs/plans/ARCHITECTURE.md` + découpage des lots de dev de la phase 2.4.
- **Critères de succès** :
  - S1 — chaque choix technique est justifié par une exigence identifiée (`EX-…`).
  - S2 — l'interface `DataProvider` est écrite en TypeScript, complète, et permet au moins deux implémentations.
  - S3 — la stratégie d'agrégation est chiffrée contre l'exigence de volumétrie de la phase 2.1.
  - S4 — les lots de dev sont définis avec leurs dépendances, et le graphe de dépendances est acyclique.

## Phase 2.4 — Développement (PHASÉ, parallélisé par lot)

Découpage prévisionnel, à confirmer par `arch-lead`. Modèle par défaut **Sonnet** effort **high**,
sauf lots à forte densité algorithmique en **Opus**.

| Lot | Contenu | Modèle | Dépend de |
|---|---|---|---|
| D1 | Échafaudage projet, build, lint, tests, tokens de design | Sonnet / medium | — |
| D2 | Schéma de données, types, validation, interface `DataProvider` | Opus / high | 2.3 |
| D3 | Générateur de dataset synthétique réaliste (distributions plausibles par marque/modèle/année, outliers injectés volontairement) | Opus / high | D2 |
| D4 | Moteur d'agrégation : agrégats marque/modèle, buckets de distribution, statistiques descriptives, détection d'outliers | Opus / high | D2 |
| D5 | Bandeau de filtres : tous les filtres relevés, état, synchronisation URL | Sonnet / high | D2 |
| D6 | Écran survol marque/modèle : cartes-marques, zones-modèles, compteurs et fourchettes | Sonnet / high | D4, D5 |
| D7 | Écran distribution : histogrammes prix / km / année, vue tri-dimensionnelle, graphes complémentaires | Opus / high | D4, D5 |
| D8 | Intégration, routage, états dégradés, performance, accessibilité | Sonnet / high | D1–D7 |
| D9 | Adaptateur `DataProvider` réel, conditionné à la conclusion du chantier 1 | Sonnet / high | chantier 1 |

Parallélisme : D1 seul, puis D2, puis **D3 / D4 / D5 en parallèle**, puis **D6 / D7 en parallèle**,
puis D8. D9 est branché dès que le chantier 1 conclut, et reste facultatif.

- **Critères de succès génériques par lot** :
  - S1 — le lot construit sans erreur ni avertissement de type.
  - S2 — les tests du lot passent, avec au moins un test par exigence couverte.
  - S3 — chaque exigence annoncée comme couverte est tracée dans le code par son identifiant `EX-…`.
  - S4 — aucun accès direct à une source de données en dehors de `DataProvider`.
  - S5 — aucun champ interdit par R3 présent dans le code ou les données.
- **Critères de succès spécifiques** : définis lot par lot dans `ARCHITECTURE.md`, tous exécutables.

## Phase 2.5 — Revue de développement (PARALLÈLE, 1 agent par lot)

- **Agents `rev-D1`…`rev-D9`** — **Opus** effort **high** pour D2/D3/D4/D7, **Sonnet** effort **high** ailleurs.
  Aucun agent ne revoit un lot qu'il a écrit.
- **Mission** : confronter chaque lot à ses critères de succès, **en exécutant** les vérifications
  et non en les lisant. Vérifier la conformité aux exigences tracées, chercher les écarts
  silencieux (exigence déclarée couverte mais partiellement implémentée), et éprouver les cas
  pathologiques du rapport de stress-test.
- **Livrable** : `reports/DEV-REVIEW.md` — un rapport de problèmes typés
  `ÉCART-EXIGENCE` / `BUG` / `CRITÈRE-NON-ATTEINT` / `RÉGRESSION` / `DETTE`, chacun avec
  le lot concerné, la preuve d'exécution, la sévérité, et la correction attendue.
- **Critères de succès** :
  - S1 — chaque critère de succès de chaque lot reçoit un verdict `ATTEINT` / `NON ATTEINT`, avec preuve d'exécution.
  - S2 — chaque exigence déclarée couverte est vérifiée fonctionnellement, pas seulement par présence de code.
  - S3 — les cas pathologiques de la phase 2.2 sont rejoués et leur comportement documenté.
  - S4 — chaque problème porte une correction attendue formulée de façon actionnable.

## Phase 2.6 — Remédiation (séquentiel par sévérité, parallèle par lot)

- **Coordinateur `fix-lead`** — **Opus**, effort **high** — ordonne le rapport de problèmes,
  attribue les corrections, arbitre les conflits entre corrections concurrentes.
- **Agents `fix-*`** — **Sonnet**, effort **high**, un par lot touché, en parallèle quand les
  lots ne se chevauchent pas.
- **Mission** : corriger, puis prouver la correction par le même test que celui qui a révélé le problème.
- **Livrable** : `reports/REMEDIATION.md` — un tableau problème → correction → preuve → statut.
- **Critères de succès** :
  - S1 — zéro problème de sévérité bloquante ou majeure encore ouvert.
  - S2 — chaque correction est prouvée par une exécution, pas par une affirmation.
  - S3 — aucune régression introduite : la suite complète passe après remédiation.
  - S4 — les problèmes laissés ouverts sont consignés comme dette avec leur motif.

## Phase 2.7 — Vérification finale (séquentiel, 1 agent)

- **Agent `final-check`** — **Fable** (E2 levée le 2026-09-08 ; Opus dans le plan initial), effort
  **max**, indépendant des phases précédentes.
- **Mission** : reprendre `REQUIREMENTS.md` **v1.1** (v1.0 gelée + amendements 2.6 tracés) exigence
  par exigence et statuer sur l'application livrée. Lancer l'application, exercer les deux parcours utilisateurs cibles de bout en bout.
- **Livrable** : `reports/FINAL-VERIFICATION.md` — matrice exigence → statut → preuve.
- **Critères de succès** :
  - S1 — 100 % des exigences reçoivent un statut `COUVERTE` / `PARTIELLE` / `NON COUVERTE` / `HORS PÉRIMÈTRE`.
  - S2 — les deux parcours cibles sont exercés et leur déroulé est journalisé.
  - S3 — le taux de couverture est chiffré et les écarts sont nommés un par un.

## Phase 2.8 — Remédiation post-vérification et levée des dettes (extension du 2026-09-08)

Ajoutée au plan à la demande du commanditaire (« les trois prochaines phases ») : la phase 2.7 juge,
elle ne corrige pas ; la 2.8 traite ce qu'elle a jugé et solde les dettes de 2.6 qui ne dépendent
d'aucune décision ni source externe.

- **Coordinateur `fix-lead`** (session, Fable/high) : trie la matrice `FINAL-VERIFICATION.md`
  (`PARTIELLE`, `NON COUVERTE`) et les constats de la recette 2.9a, forme des clusters par
  répertoires disjoints (mêmes rôles `fix-*` qu'en 2.6), arbitre.
- **Entrées** : (1) exigences `PARTIELLE`/`NON COUVERTE` de 2.7 hors `HORS PÉRIMÈTRE` ; (2) constats
  de la recette navigateur 2.9a ; (3) dettes de 2.6 **levables en interne** : `DR-034` (GROUPSTAT/NTILE/
  paliers/R² dans le worker, `EX-DATA-83bis`), `DR-082` (colonne TVA : champ `taxDeductible` ajouté à
  l'interface et à l'ingestion, à la manière de D-01/D-02), `DR-114` (verdicts `INSUFFICIENT_*`,
  annexe A amendée), `DR-105` (E15–E17 dans le garde R3, `EX-DATA-49` étendue), `DR-132`, `DR-134`,
  `DR-143`, `DR-147`, `resultCount` du bandeau. **Restent dettes externes** : `DR-104` (AC-01,
  juridique), `DR-112` (source Statbel/bpost, E5), O15 (`bodyTypes` absent du référentiel).
- **Règle de preuve** : identique à 2.6 (sonde d'échec d'abord, `it.fails` retourné en `it` quand la
  dette est levée, aucune sonde modifiée sans justification écrite).
- **Livrable** : `reports/REMEDIATION-2.8.md` (même format que `REMEDIATION.md`), vérifié par un
  `fix-verify` indépendant.
- **Critères de succès** :
  - S1 — zéro exigence `NON COUVERTE` et zéro `PARTIELLE` sans dette motivée par une décision.
  - S2 — chaque correction prouvée par exécution (sonde ou test E2E).
  - S3 — aucune régression : `npm test` (unitaire + sondes), `npm run test:e2e`, budgets.
  - S4 — les dettes restantes sont exclusivement externes (décision ou source hors dépôt), nommées.

## Phase 2.9 — Recette navigateur (extension du 2026-09-08)

Ce que 2.5–2.7 n'ont pas pu vérifier sans navigateur (contraste au rendu, ordre de focus, `EX-NFR-6`,
`EX-NFR-16` axe-core, impression, responsive réel, `EX-NFR-9` en 4G simulée) l'est ici, sur le
**build de production** servi par `vite preview`, avec Playwright et le Chromium préinstallé de
l'environnement (`playwright.config.ts`, `tests/e2e/`). `@playwright/test` et `@axe-core/playwright`
sont des dépendances **de test uniquement** (`ARCHITECTURE.md` §8 n° 15), absentes du bundle.

- **2.9a — harnais (PARALLÈLE à 2.7)** — agent `e2e-harness`, **Opus/high**, en worktree :
  configuration, fixtures, et une suite E2E qui couvre : les deux parcours cibles P1/P2 de bout en
  bout avec assertions sur les valeurs affichées ; axe-core WCAG 2.1 A/AA sur A, B, D, C, E, F, G,
  `/mentions` (`EX-NFR-16`) ; navigation 100 % clavier du bandeau et de l'écran G (`EX-NFR-14`) ;
  responsive 360/768/1280 (`EX-NFR-18`, dégradation G4 `EX-NFR-19`) ; impression (`emulateMedia
  print`, `EX-NFR-31`) ; `EX-NFR-9` sous limitation réseau 4G (CDP) ; `EX-NFR-7`/`8` mesurés par
  `requestAnimationFrame` réel ; concurrence inter-onglets (deux contextes, `EX-CRUD-19`/ADV-13) ;
  partage d'URL (`EX-NAV-18` : même URL, même rendu). Chaque écart = constat pour 2.8.
- **2.9b — recette finale (SÉQUENTIEL, après 2.8)** — agent `acceptance`, **Fable/max** : relance
  toute la suite E2E sur le build final, produit `reports/ACCEPTANCE.md` (matrice exigence
  navigateur → test → résultat → capture), et statue.
- **Critères de succès** :
  - S1 — `npm run test:e2e` vert sur les trois projets (desktop, tablet, mobile).
  - S2 — zéro violation axe-core A/AA sur les huit surfaces ; toute exception est nommée et motivée.
  - S3 — `EX-NFR-9` ≤ 2 000 ms en 4G simulée, `EX-NFR-7`/`8` tenus au rAF, mesurés et cités.
  - S4 — les deux parcours cibles journalisés avec captures.

**Livraison (hors plan, sur décision explicite du commanditaire)** : fusion de
`claude/kycar-project-ffcplk` dans `main`, tag `v0.1.0`. Aucune fusion vers `main` n'est faite
sans cet accord (`CLAUDE.md` §1.3).

---

## Séquencement global

```
2.0 ref-filters ─┐
2.0 ref-taxonomy ┴─> 2.1 requirements ──> 2.2 stress-test ──> 2.3 architecture
                                                                    │
                          ┌─────────────────────────────────────────┘
                          v
                    D1 ──> D2 ──┬─> D3 ─┐
                                ├─> D4 ─┼─> D6 ─┐
                                └─> D5 ─┘       ├─> D8 ──> 2.5 revue ──> 2.6 remédiation ──> 2.7 vérification
                                    D4,D5 ──> D7 ┘
                    (D9 branché dès que le chantier 1 conclut, facultatif)
```

## Points de contrôle bloquants

| Contrôle | Condition de passage |
|---|---|
| G1 après 2.0 | au moins 40 filtres relevés, `taxonomy.json` valide |
| G2 après 2.2 | zéro constat bloquant ou majeur ouvert, document gelé en v1.0 |
| G3 après 2.3 | graphe de dépendances des lots acyclique, `DataProvider` écrit |
| G4 après chaque lot de dev | build vert, tests verts, exigences tracées |
| G5 après 2.6 | zéro problème bloquant ou majeur ouvert |
| G6 après 2.7 | matrice de couverture complète et chiffrée |
| G7 après 2.8 | zéro `NON COUVERTE`, zéro `PARTIELLE` sans dette motivée ; dettes restantes exclusivement externes |
| G8 après 2.9 | E2E verts sur 3 projets, 0 violation axe A/AA, budgets navigateur tenus, `ACCEPTANCE.md` livré |
