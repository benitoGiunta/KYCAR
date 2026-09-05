# PLAN 1 — Acquisition des données AutoScout24
### Recherche exhaustive, investigation prouvée, rapport comparatif

**Objectif** : produire un rapport de décision qui identifie *toutes* les voies possibles pour
charger l'inventaire d'annonces AutoScout24 dans KYCAR, et qui classe chacune sur des critères
mesurés — pas devinés.

**Livrable final** : `docs/research/DATA-ACQUISITION-REPORT.md` contenant
(a) le registre exhaustif des options, (b) un tableau comparatif multi-critères,
(c) une recommandation primaire + fallback, (d) la liste explicite des zones d'ombre résiduelles.

---

## Règles transverses (opposables à tous les agents du plan)

| # | Règle |
|---|---|
| R1 | **Zéro guessing.** Toute affirmation factuelle porte soit une URL source, soit la sortie d'un test exécuté. Une affirmation sans preuve est marquée `[NON VÉRIFIÉ]` et n'entre pas dans la notation. |
| R2 | **Pas de création de compte, pas de saisie de credentials.** Les tests se limitent au non-authentifié. Tout ce qui exige un compte est consigné dans une section `ACTIONS-COMMANDITAIRE`. |
| R3 | **Pas de volumétrie.** Les tests de faisabilité sont des sondes unitaires (1 à 5 requêtes), jamais des extractions de masse. On prouve la mécanique, on ne collecte pas. |
| R4 | **Distinguer `prouvé` / `documenté` / `supposé`.** Ces trois niveaux de confiance sont portés colonne par colonne dans le tableau final. |
| R5 | **Prix toujours ramenés à une unité comparable** : € / 1 000 annonces récupérées, et € / mois pour un rafraîchissement quotidien d'un périmètre BE. |
| R6 | Aucun agent ne conclut sur une option qu'un autre agent a investiguée. La revue est croisée, pas auto-administrée. |

## Grille de notation commune (imposée dès la phase 1)

Chaque option candidate est notée sur ces axes, et **seuls ces axes** entrent dans le tableau final :

| Axe | Unité / échelle | Niveau de preuve exigé |
|---|---|---|
| A1 Coût d'amorçage | € pour prototyper (0 = gratuit) | documenté |
| A2 Coût récurrent | € / 1 000 annonces **et** € / mois pour BE quotidien | documenté |
| A3 Couverture champs | nb de champs utiles / 40 du dictionnaire cible | prouvé si possible |
| A4 Couverture géo | liste de pays effectivement adressables | documenté |
| A5 Latence | ms par requête (p50) et durée d'un snapshot BE complet | prouvé ou estimé chiffré |
| A6 Débit / quota | annonces/heure atteignables, plafonds durs | documenté |
| A7 Stabilité technique | 1–5 : sensibilité aux changements du site, historique de casse | argumenté |
| A8 Résistance anti-bot | qui absorbe Akamai : nous, le provider, ou non concerné | prouvé |
| A9 Effort d'intégration | jours-homme pour un adaptateur `DataProvider` fonctionnel | estimé |
| A10 Coût de maintenance | jours-homme / mois attendus | argumenté |
| A11 Exposition juridique | 1–5, avec le mécanisme juridique nommé | argumenté |
| A12 Autonomie | dépend-on d'un tiers pouvant nous couper ? oui/partiel/non | documenté |
| A13 Plafond de volumétrie | annonces max récupérables en pratique par recherche/jour | prouvé ou documenté |
| A14 Fraîcheur atteignable | délai entre publication réelle et disponibilité chez nous | argumenté |

---

## Phase 1.1 — Balayage des candidats (séquentiel, 1 agent)

- **Agent** : `sweep-1` — modèle **Opus**, effort **high**
- **Mission** : énumérer **toutes** les familles d'approches, sans filtrer sur la faisabilité.
  Le mandat est la largeur, pas la qualité. Doit couvrir au minimum, et aller au-delà :
  API officielles ; endpoints internes / JSON du front (`__NEXT_DATA__`, routes `/_next/data/`,
  API GraphQL ou REST internes, endpoints de l'app mobile) ; flux partenaires et syndication
  (feeds concessionnaires, XML dealer export, agrégateurs B2B) ; API tierces de scraping managé ;
  navigateurs pilotés (Playwright/Puppeteer + stealth, proxies résidentiels) ; services
  d'unblocking (proxy + résolution de challenge) ; datasets préexistants (Kaggle, HuggingFace,
  data brokers, marketplaces de datasets) ; sources alternatives substituables (Mobile.de — même
  groupe, 2dehands, Gocar, La Centrale, AutoTrader, Marktplaats, index Google Vehicle listings) ;
  partenariat ou licence directe avec AutoScout24 ; sitemaps et robots.txt ; caches tiers
  (Wayback Machine, Common Crawl) ; API d'applications mobiles.
- **Livrable** : `docs/research/candidates-v1.md` — une fiche par candidat : identifiant stable
  (`C-01`…), famille, description mécanique en 3 lignes, ce qu'il faudrait prouver.
- **Critères de succès objectifs** :
  - S1 — au moins 20 candidats distincts, chacun avec un identifiant stable.
  - S2 — les 14 familles listées ci-dessus sont toutes représentées ou explicitement écartées avec motif.
  - S3 — chaque fiche nomme au moins une question falsifiable à tester en phase 1.4.
  - S4 — aucune notation, aucun classement à ce stade : la phase est un inventaire.

## Phase 1.2 — Revue de complétude no 1 (séquentiel, 1 agent)

- **Agent** : `gap-review-1` — modèle **Opus**, effort **high**
- **Entrée** : `candidates-v1.md`. Ne voit pas le raisonnement de `sweep-1`, seulement sa sortie.
- **Mission** : chercher activement ce qui manque. Posture adverse — « quelle voie un ingénieur
  compétent aurait-il trouvée que ce document ignore ? » Recherche web indépendante obligatoire.
- **Livrable** : `docs/research/candidates-v2.md` = v1 + ajouts marqués `[AJOUT G1]` + un journal
  des angles explorés qui n'ont rien donné, afin d'éviter le doublon en phase 1.3.
- **Critères de succès** :
  - S1 — au moins 8 angles de recherche distincts documentés, avec les requêtes utilisées.
  - S2 — tout candidat ajouté respecte le format de fiche de la phase 1.1.
  - S3 — le journal des angles infructueux est présent et exploitable.
  - S4 — verdict explicite sur la complétude de v1 : suffisante ou lacunaire, avec justification.

## Phase 1.3 — Revue de complétude no 2 (séquentiel, 1 agent)

- **Agent** : `gap-review-2` — modèle **Opus**, effort **high**
- **Entrée** : `candidates-v2.md` + journal des angles infructueux.
- **Mission** : identique à 1.2 mais en changeant d'axe d'attaque — raisonner par *contournement*
  (quelles données équivalentes existent ailleurs ?), par *chaîne de valeur* (qui possède déjà
  ces données et les revend ?) et par *analogie* (comment les comparateurs existants procèdent-ils ?).
- **Livrable** : `docs/research/candidates-final.md` — registre gelé, chaque candidat porté à
  l'état `RETENU_POUR_INVESTIGATION` ou `ÉCARTÉ` avec motif d'écartement en une phrase.
  Plus un **regroupement en lots d'investigation** (`LOT-A`…`LOT-n`), un lot = un agent en 1.4.
- **Critères de succès** :
  - S1 — registre gelé, sans doublon, identifiants stables conservés depuis v1.
  - S2 — chaque candidat écarté porte un motif ; aucun écartement au motif que c'est « difficile ».
  - S3 — lots d'investigation constitués, 3 à 6 candidats par lot, cohérents par famille technique.
  - S4 — déclaration de saturation : argumenter que le champ est couvert, ou nommer ce qui reste ouvert.

## Phase 1.4 — Investigation de faisabilité (PARALLÈLE, 1 agent par lot)

- **Agents** : `probe-A`, `probe-B`, … — un par lot.
  - Lots impliquant du test technique réel (endpoints, anti-bot, structure) → **Opus**, effort **high**.
  - Lots purement documentaires (pricing, CGU, offres commerciales) → **Sonnet**, effort **medium-high**.
- **Mission par agent** : pour chacun de ses candidats, remplir les 14 axes A1–A14 **avec preuve**.
  Exécuter les sondes non authentifiées pertinentes — `curl` sur les pages de recherche et de détail,
  inspection de `__NEXT_DATA__` et des routes `/_next/data/`, lecture de `robots.txt` et des sitemaps,
  observation des réponses Akamai (codes, cookies `_abck` / `ak_bmsc`, challenges), test des endpoints
  publics sans clé, mesure de latence réelle, comptage des champs effectivement présents.
- **Livrable** : `docs/research/probe-<LOT>.md` — par candidat : tableau A1–A14, **journal de preuve**
  (commande exécutée et extrait de sortie), verdict `VIABLE` / `VIABLE SOUS CONDITION` / `NON VIABLE`,
  et la liste des inconnues restantes.
- **Critères de succès** :
  - S1 — les 14 axes renseignés pour chaque candidat ; aucune cellule vide (`[NON VÉRIFIÉ]` accepté et compté).
  - S2 — au moins un test exécuté et journalisé par candidat techniquement testable.
  - S3 — taux de cellules `[NON VÉRIFIÉ]` inférieur ou égal à 25 % par candidat, sinon justification explicite.
  - S4 — chaque affirmation chiffrée est traçable à une source ou à une sortie de commande.
  - S5 — aucune violation de R2 ni R3 : pas de compte créé, pas d'extraction de masse.

## Phase 1.5 — Revue croisée des investigations (PARALLÈLE, 1 agent par lot)

- **Agents** : `audit-A`, `audit-B`, … — modèle **Sonnet**, effort **high**.
  **Contrainte d'indépendance** : l'appariement est décalé — `audit-A` revoit le lot B,
  `audit-B` revoit le lot C, et ainsi de suite en cycle. Aucun agent n'audite son propre lot.
- **Mission** : traquer le guessing. Pour chaque affirmation — la preuve existe-t-elle, est-elle
  suffisante, l'inférence est-elle légitime ? Rejouer au moins 2 tests par lot pour vérifier la
  reproductibilité. Vérifier la cohérence des unités (R5) et la sévérité des notes A7 et A11.
- **Livrable** : `docs/research/audit-<LOT>.md` — liste de constats typés
  `FAUX` / `NON PROUVÉ` / `SOUS-ESTIMÉ` / `SUR-ESTIMÉ` / `OK`, avec correction proposée.
- **Critères de succès** :
  - S1 — chaque affirmation chiffrée du lot audité reçoit un verdict.
  - S2 — au moins 2 tests rejoués, résultat comparé à l'original, écart documenté.
  - S3 — les corrections sont directement intégrables : une valeur de remplacement est fournie.
  - S4 — un score de fiabilité par candidat est émis (0–100) avec sa méthode de calcul.

## Phase 1.6 — Compilation, stress-test des zones d'ombre, rapport (séquentiel, 1 agent)

- **Agent** : `compile-1` — modèle **Opus**, effort **max**
- **Entrée** : registre gelé, tous les `probe-*`, tous les `audit-*`.
- **Mission** :
  1. Intégrer les corrections d'audit ; en cas de conflit probe/audit, trancher et **journaliser l'arbitrage**.
  2. Construire le tableau comparatif maître — lignes = candidats retenus, colonnes = A1–A14 + fiabilité.
  3. **Stress-tester les zones d'ombre** : pour chaque inconnue résiduelle matérielle, poser
     le scénario défavorable, chiffrer son impact sur la décision, et dire si la recommandation
     tient sous ce scénario. On teste la robustesse du *choix*, pas seulement du candidat.
  4. Produire une recommandation **primaire + fallback + repli dégradé**, avec les conditions
     de bascule nommées et mesurables.
  5. Produire la section `ACTIONS-COMMANDITAIRE` : ce que seul le commanditaire peut faire —
     créer les comptes free-tier, signer un contrat partenaire, fournir le texte des CGU.
- **Livrable** : `docs/research/DATA-ACQUISITION-REPORT.md`
- **Critères de succès** :
  - S1 — tableau maître complet, une ligne par candidat retenu, aucune cellule vide.
  - S2 — chaque zone d'ombre matérielle a son scénario défavorable chiffré et son verdict de robustesse.
  - S3 — recommandation à 3 niveaux, avec critère de bascule mesurable pour chacun.
  - S4 — section `ACTIONS-COMMANDITAIRE` actionnable : qui, quoi, combien de temps, quel coût.
  - S5 — chaque arbitrage probe-contre-audit est journalisé avec son motif.
  - S6 — le rapport nomme le sous-ensemble d'options qui satisfont **gratuit + autonome**, ou déclare
    explicitement cet ensemble vide. C'est cette conclusion qui débloque ou non le branchement
    réel du chantier 2.

---

## Séquencement et parallélisme

```
1.1 sweep ──> 1.2 gap#1 ──> 1.3 gap#2 ──┬─> 1.4 probe-A ─┐
                                        ├─> 1.4 probe-B ─┤
                                        ├─> 1.4 probe-C ─┼─> 1.5 audit-* (parallèle, décalé) ──> 1.6 compile
                                        └─> 1.4 probe-n ─┘
```

Les phases 1.1 à 1.3 sont strictement séquentielles : chaque revue a besoin de la sortie complète
de la précédente pour ne pas refaire le même travail. Les phases 1.4 et 1.5 sont pipelinées — un lot
dont la sonde est terminée part en audit pendant que les autres sondes tournent encore.

## Points de contrôle bloquants

| Contrôle | Condition de passage |
|---|---|
| G1 après 1.3 | au moins 20 candidats, lots constitués, saturation déclarée |
| G2 après 1.5 | aucun candidat retenu sans verdict d'audit |
| G3 après 1.6 | les 6 critères S1–S6 satisfaits, sinon renvoi en 1.4 sur le candidat déficient |
