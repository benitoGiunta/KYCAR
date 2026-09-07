# Journal d'exécution

État d'avancement des deux chantiers. Ce fichier est la **source de vérité de l'avancement** :
il doit permettre de reprendre le travail sans aucun contexte conversationnel.

Dernière mise à jour : 2026-09-07 — **Chantier 1 CLOS (1.1→1.6 VALIDÉ), rapport de décision livré. Chantier 2 : 2.0→2.3 VALIDÉ, prêt pour 2.4 (dév D1–D9, non lancé — attend feu vert commanditaire)**

## Conventions

- `À FAIRE` — non démarré
- `EN COURS` — agent(s) en cours d'exécution
- `LIVRÉ` — livrable écrit, critères de succès non encore contrôlés
- `VALIDÉ` — livrable écrit et critères de succès contrôlés
- `BLOQUÉ` — nécessite une action externe, motif indiqué

## Contraintes d'exécution actives

| # | Contrainte | Origine |
|---|---|---|
| E1 | Aucune création de compte, aucune saisie de credential par les agents | règle de sécurité non contournable |
| E2 | Aucun modèle Fable, sur aucune tâche | consigne du commanditaire |
| E3 | Autonomie totale : aucune information supplémentaire ne sera fournie | consigne du commanditaire |
| E4 | Toute hypothèse non vérifiable est écrite comme hypothèse, jamais présentée comme un fait | R1 du plan 1, R6 du plan 2 |
| E5 | **Requêtes sur `www.autoscout24.be` limitées aux 17 préfixes que le robots.txt autorise explicitement à ClaudeBot** (`/fr/voiture/`, `/nl/auto/`, `/evaluationvoiture/`, `/prijsschatting/`, `/fr/informer/`…). Tout le reste — `/lst?`, `/fr/offres/`, endpoints internes — reste interdit | relevé et analysé le 2026-09-06, voir `docs/research/FINDING-allowed-surface.md` |

Conséquence de E1 sur le chantier 1 : les plans gratuits des providers tiers ne peuvent pas être
testés par les agents. Chaque option concernée est renvoyée dans la section
`ACTIONS-COMMANDITAIRE` du rapport final.

## Chantier 1 — Acquisition des données

| Phase | Agents | Modèle / effort | Livrable | État |
|---|---|---|---|---|
| 1.1 Balayage des candidats | `sweep-1` | Opus / high | `docs/research/candidates-v1.md` | VALIDÉ — 66 candidats C-01…C-66, 14/14 familles couvertes |
| 1.1b Constat sur la surface autorisée | (moi) | — | `docs/research/FINDING-allowed-surface.md` | VALIDÉ — C-14 prouvé : agrégats et échantillon d'annonces accessibles licitement |
| 1.2 Revue de complétude 1 | `gap-review-1` | Opus / high | `docs/research/candidates-v2.md` | VALIDÉ — 18 ajouts C-67…C-84, 3 familles nouvelles, registre à 84 candidats / 17 familles. C-67 vérifié et reclassé (voir `VERIF-C67-fdz.md`) |
| 1.3 Revue de complétude 2 | `gap-review-2` | Opus / high | `docs/research/candidates-final.md` | VALIDÉ — registre gelé, 92 candidats, 17 lots organisés en vagues, saturation argumentée |
| 1.4 vague 1 — `LOT-A` surface autorisée | `probe-A` | Opus / high | `docs/research/probe-LOT-A.md` | VALIDÉ — **échantillon 20 annonces biaisé, p<10⁻²⁰ ; mode 2 inutilisable en l'état, O9 fermé**. C-14 viable sous condition (agrégats oui, distributions non) |
| 1.4 vague 1 — `LOT-B` hôtes et binaires | `probe-B` | Opus / high | `docs/research/probe-LOT-B.md` + `DECISION-coordinateur-LOT-B.md` | VALIDÉ — pas d'hôte de recherche sans auth ; verrou GraphQL documenté mais accès = ligne rouge (accès non autorisé) |
| 1.4 vague 1 — `LOT-E` code tiers | `probe-E` | Opus / high | `docs/research/probe-LOT-E.md` | VALIDÉ — faisabilité technique prouvée en prod (808k annonces, sans proxy), mais A11 la condamne. A7 mesuré : NEXT_DATA 4/5, DOM 1/5 |
| 1.4 vague 1 — `LOT-F` fournisseurs | `probe-F` | Sonnet / med-high | `docs/research/probe-LOT-F.md` | VALIDÉ — delta AS24 confirmé (auto-api.com), médiane ~1,94 €/1000 annonces, coût non limitant |
| 1.4 vague 1 — `LOT-J` archives | `probe-J` | Opus / high | `docs/research/probe-LOT-J.md` | VALIDÉ — **série de prix reconstructible** (620k captures) ; directive anti-IA récente (post 2025-12) ; soumission d'archive = contournement TDM |
| 1.4 vague 2 — `LOT-CD` payloads front | `probe-CD` | Sonnet / high | `docs/research/probe-LOT-CD.md` | VALIDÉ — 0 requête AS24 ; mécanique de dichotomie chiffrée (N buckets = N requêtes) |
| 1.4 vague 2 — `LOT-I` datasets | `probe-I` | Sonnet / med-high | `docs/research/probe-LOT-I.md` | VALIDÉ — C-67 mesure le biais agrégé mais pas sa cause publicitaire ; provenance sévère |
| 1.4 Investigation vagues 2-3 | probe-{M,N,CD,GH,I,K,LO,PQ} | Opus/Sonnet | probe-LOT-*.md | VALIDE — 12 lots restants instruits, 17/17 au total |
| 1.5 Audit croisé | `audit-{decisif,juridique,economie}` | Sonnet / high | `docs/research/audit-cluster-*.md` | VALIDÉ — 3 clusters. Juridique : 3 limites tiennent (5/5). Économie : 2 corrections chiffrées (dénominateur 40, médiane ~1,31 €/1000). Décisif : mon jugement sur 2dehands était prématuré → `DECISION-coordinateur-source.md` corrigée (mode 2 NON acquis, même biais publicitaire) |
| 1.6 Compilation et stress-test | `compile-1` | Opus / max | `docs/research/DATA-ACQUISITION-REPORT.md` | VALIDÉ — rapport de décision final. Réponse commanditaire : inventaire AS24 gratuit+autonome+licite = NON (3 murs). Tableau maître 85 candidats / 14 axes, 0 cellule vide. 5 zones d'ombre stress-testées (aucune ne renverse la conclusion ; ZO-5 seule vigilance sur le primaire mode 1). Reco 3 niveaux par mode. Corrections d'audit intégrées (dénom. 40, médiane ~1,31 €/1000, mode 2 vide gratuit, juridique 5/5). S6 : mode 1 NON VIDE (2dehands/marktplaats), mode 2 VIDE → D9 sur synthétique jusqu'à financement. RGPD OK, ligne rouge Mashery en AC-12 |

## Chantier 2 — Application d'agrégation

| Phase | Agents | Modèle / effort | Livrable | État |
|---|---|---|---|---|
| 2.0 Données de référence | `ref-filters` | Opus / high | `docs/requirements/REF-filters.md`, `data/reference/filters.json` | VALIDÉ — 101 filtres / 100 paramètres d'URL, 36 énumérations, 0 extrapolé |
| 2.0 Réconciliation des vocabulaires | (moi) | — | `docs/requirements/REF-vocabulary-reconciliation.md` | VALIDÉ — 8 identiques, 5 partiels, 1 sans rapport, 1 collision de codes |
| 2.0 Données de référence | `ref-taxonomy` | Sonnet / medium-high | `docs/requirements/REF-taxonomy.md`, `data/reference/taxonomy.json` | VALIDÉ — 295 marques / 4 955 modèles voiture, ids réels, reproduit indépendamment |
| 2.1 Exigences | `req-lead` (coordinateur) + `req-data` / `req-screens` / `req-behaviour` | Opus max + Opus/Opus/Sonnet high | `docs/requirements/REQUIREMENTS.md` | VALIDÉ — assemblé en v0.9, puis gelé en v1.0 après stress-test |
| 2.2 Stress-test — complétude | `st-complete` | Opus / high | `reports/ST-complete.md` | VALIDÉ — 24 constats, dont 9 bloquants, tous aux frontières entre annexes |
| 2.2 Stress-test — adverse | `st-adversarial` | Sonnet / high | `reports/ST-adversarial.md` | VALIDÉ — 18 constats sur 38 attaques simulées, dont 4 bloquants |
| 2.2 Stress-test — ambiguïté | `st-ambiguity` | Opus / high | `reports/ST-ambiguity.md` | VALIDÉ — 37 constats (20 bloquants), 25 zones déclarées saines |
| 2.2 Arbitrage | `st-arbiter` | Opus / max | `reports/REQ-STRESSTEST.md` | VALIDÉ — 79 constats → 65 décisions, 1 rejet prouvé, zéro bloquant ouvert |
| 2.2 Application annexe A | `fix-annexe-A` | Opus / high | `reports/applied-annexe-A.md` | VALIDÉ — 39/39, 127 → 139 exigences |
| 2.2 Application annexe B | `fix-annexe-B` | Opus / high | `reports/applied-annexe-B.md` | VALIDÉ — 67/68, 224 → 231 exigences, 1 bloqué et signalé (`R-A10`) |
| 2.2 Application annexe C | `fix-annexe-C` | Sonnet / high | `reports/applied-annexe-C.md` | VALIDÉ — 24/24, 96 → 114 exigences |
| 2.2 Résidus | `fix-residus` | Sonnet / high | `reports/applied-residus.md` | LIVRÉ — 11/11 résidus soldés, 0 bloqué. Balayage `RES-9` : 65/65 décisions vérifiées, 3 prescriptions manquantes trouvées sur 2 emplacements (`EX-DATA-106` déjà réparé par le coordinateur avant ce passage ; `EX-SCR-26`/`ARB-39` appliqué ici). Annexe A : 139 → 140 exigences (+`EX-DATA-115bis`). Annexes B (231) et C (114) inchangées en compte |
| 2.2 Gel v1.0 | (moi) | — | REQUIREMENTS v1.0 | VALIDÉ — 485 exigences, zéro bloquant ou majeur ouvert, 8 dettes consignées |
| 2.3 Architecture | `arch-lead` | Opus / high | `docs/plans/ARCHITECTURE.md`, `docs/plans/DataProvider.ts` | VALIDÉ — pile 100 % client justifiée (274 Mo < 512, ×1,9) ; `DataProvider.ts` compile sous `tsc --strict` (0 erreur), mode 1 obligatoire / mode 2 optionnel + garde `servesMode2`, filtrage R3 par construction ; budget 200 ms tenu (170 ms synchrones, facettes différées, mode 2 élagué) ; graphe D1–D9 acyclique ; 3 tensions frontière annexe A/B signalées (§9 : « rotation » G4, plafond 5 000 vs 20 000, marge EX-NFR-9) → à traiter en 2.6 |
| 2.4 Développement D1–D9 | `dev-D*` | voir plan 2 | code (branche `phase-2.4-build`) | EN COURS — orchestration : D1→D2 en séquence directe (fondation) ; D3∥D4∥D5∥D9 en worktrees isolés ; D6∥D7 après D4+D5 ; D8 intégration. **D1 ✅ VALIDÉ** (build/lint/test/size verts, worker PING/PONG OK, outillage installé une fois pour toutes). **D2 ✅ VALIDÉ** (45 tests ; 13 entités, colonnaire+sentinelles, validation R3, 8 invariants, codec selectionHash, chargeur référentiels, DataProvider intégré ; SHA-256 maison synchrone ; 4 divergences remontées → O13–O16). Vague parallèle **D3∥D4∥D5∥D9** en worktrees. **D9 ✅ FUSIONNÉ** (TweedehandsDataProvider : mode 1 réel via `__NEXT_DATA__` autorisé, `servesMode2()=false`, R3 prouvé à l'ingestion, mapping vocab 2dehands→KYCAR, **zéro appel réseau** — 47 tests, 92 au total). D3/D4/D5 en cours. Périmètre du run : s'arrête à la fin de 2.4, pas de revue 2.5 |
| 2.5 Revue de développement | `rev-D*` | Opus / Sonnet high | `reports/DEV-REVIEW.md` | À FAIRE |
| 2.6 Remédiation | `fix-lead` + `fix-*` | Opus high + Sonnet high | `reports/REMEDIATION.md` | À FAIRE |
| 2.7 Vérification finale | `final-check` | Opus / max | `reports/FINAL-VERIFICATION.md` | À FAIRE |

## Décisions prises

| Date | Décision | Motif |
|---|---|---|
| 2026-09-06 | Les deux chantiers sont découplés par l'interface `DataProvider` | Le chantier 2 ne doit pas attendre la conclusion du chantier 1 ; le dataset synthétique suffit à construire et valider tout le métier |
| 2026-09-06 | Aucun champ identifiant un vendeur particulier dans le schéma | Mitigation RGPD structurelle, et le commanditaire n'en a pas l'usage |
| 2026-09-06 | Le référentiel vient de l'API officielle `listing-creation.api.autoscout24.com`, pas du site | Endpoints `/makes` et `/references` ouverts sans authentification ; source canonique, gratuite, sans contrat, et compatible avec l'interdiction de crawl du site public |
| 2026-09-06 | Spec OpenAPI et modèle de données vendorés dans le dépôt | Le dictionnaire de données de la phase 2.1 doit rester reproductible même si l'API évolue |
| 2026-09-06 | Les filtres et la taxonomie sont relevés sur le site, pas inventés | Le bandeau de filtres doit reproduire l'existant AutoScout24 ; une liste inventée invaliderait la comparaison |

## Points ouverts

| # | Point | Impact | Résolution attendue |
|---|---|---|---|
| O1 | ~~Texte des CGU non récupéré~~ | — | **RÉSOLU** : le § 3.3 des Händler-AGB DE/AT interdit verbatim l'interrogation automatisée de la base par logiciel. Portée = contrat B2B, opposable aux signataires ; pour un tiers non signataire, le fondement est le droit *sui generis* et le `robots.txt`. Texte belge encore à lire, licitement sous `/fr/entreprise/` |
| O2 | Voie gratuite et autonome : **partiellement tranchée**. Les agrégats et un échantillon de 20 annonces/modèle sont accessibles licitement (C-14 prouvé). L'inventaire exhaustif ne l'est pas | Le lot D9 est réalisable pour le mode 1 ; le mode 2 reste sur dataset synthétique tant que la représentativité de l'échantillon n'est pas établie | Chantier 1, phase 1.4, candidat C-14 prioritaire |
| O3 | ~~Identifiants techniques marque/modèle inconnus~~ | — | **RÉSOLU** : ids numériques réels relevés sur `/makes` |
| O4 | ~~Codes de paramètres d'URL du moteur de recherche non déductibles de l'API~~ | — | **RÉSOLU** : 100 paramètres relevés dans le bundle JS, et correspondance des vocabulaires établie |
| O6 | **Le catalogue de filtres a été obtenu par 15 requêtes sur le site public, faites avant l'établissement de E5.** La donnée est acquise et sur disque, mais un rafraîchissement futur ne peut pas emprunter la même voie | Le référentiel de filtres devient un actif figé, non rafraîchissable en l'état | À traiter au chantier 1 : une voie de rafraîchissement conforme fait partie des options à évaluer |
| O7 | Sémantique OU/ET du paramètre `eq` (équipements) non prouvée | Une exigence de filtrage multi-équipements serait ambiguë | 3 requêtes trancheraient, mais E5 l'interdit : à reporter en `ACTIONS-COMMANDITAIRE` |
| O8 | Plafond de pagination contradictoire : `numberOfPages` a rendu 200 (4 000 annonces/recherche), les sources tierces annoncent 20 (400) | Dimensionne la stratégie de partitionnement pour un snapshot national (H5) | Chantier 1, phase 1.4 |
| O5 | Slugs d'URL : **résolus pour les modèles** — `topModels[].slug` donne le slug réel, au format `<marque>-<modèle>` et non `<modèle>` | — | **RÉSOLU** par la surface autorisée |
| O12 | Le plafond de pagination est désormais étayé par 3 sources à **4 000 annonces par recherche**, avec contournement par bande d'années | Confirme la nécessité d'un partitionnement de l'espace de recherche pour un snapshot national | Remplace O8, à confirmer en 1.4 |
| O9 | **Représentativité de l'échantillon de 20 annonces non établie.** `adProduct.tier` suggère un tri influencé par le produit publicitaire | Un échantillon biaisé fausserait toute distribution du mode 2 — c'est la question dimensionnante du candidat C-14 | Chantier 1, phase 1.4 |
| O10 | Mobile.de **n'appartient pas** au même groupe qu'AutoScout24 (Adevinta contre Hellman & Friedman), contrairement à ce qui avait été avancé au cadrage | Change la valeur du candidat C-42 : son API de recherche publiquement documentée n'est pas un accès privilégié à l'inventaire AS24 | Corrigé, à répercuter en 1.4 |
| O11 | **Une SEARCH API GraphQL officielle existe** et est commercialisée via le portail concessionnaires (`searchapi@autoscout24.com`). L'affirmation initiale « aucun canal officiel de lecture » est fausse | Ouvre une voie contractuelle qui n'était pas au cadrage | Chantier 1, phase 1.4, candidat C-01 |
| O13 (2.4/D2) | **`KYCAR_INGEST_FLAG` : 14 vs 17 codes.** §A.1 annonce 14 et le champ #82 borne `0..14`, mais `EX-DATA-45` nomme 17 codes un à un. Or `ListingColumnBatch.ingestFlags` (interface gelée 2.3) est un `Uint16Array` = 16 bits/ligne : 17 drapeaux n'y tiennent pas | Divergence entre l'interface gelée et l'annexe A | **Décision bornée du coordinateur pour ne pas bloquer 2.4** : on conserve `Uint16Array` (≤ 16 drapeaux d'ingestion réellement posés, dont `PRICE_SENTINEL_ABSOLUTE` R-A06) ; le décompte exact 14/16/17 et la nature bitflag-ou-non des codes surnuméraires sont **arbitrés en 2.6**. D3/D4 traitent les `ingestFlags` sur 16 bits |
| O14 (2.4/D2) | **Fichiers région BE absents du dépôt** : `regions-be.json` / `postal-regions-be.json` cités par le dictionnaire n'existent pas. Table NUTS-2 BE encodée en code (`vocabularies.ts`), dette `[EXTRAPOLÉ]` `EX-DATA-53` | Le mapping code postal → NUTS-2 repose sur une table extrapolée | Solder en 2.6 contre le fichier officiel bpost/Statbel |
| O15 (2.4/D2) | **`Model.bodyTypes` vide** : `taxonomy.json` ne porte pas `bodyTypes` par modèle ; l'index taxonomique par carrosserie (`EX-DATA-115bis`), condition de la classe R du filtre Carrosserie, sera vide tant que la donnée n'est pas fournie | Filtre Carrosserie en classe R inopérant à l'écran A (D6) tant que la donnée manque | Signalé à D4/D6 (dégrader proprement) ; solder la donnée en 2.6 |
| O16 (2.4/D2) | **13 vs 14 entités** : `EX-DATA-105`/ARCHITECTURE §2.1 disent « 13 » mais en nomment 14. D2 a typé les 14 concepts nommés | Cosmétique, aucun impact fonctionnel | Aligner le décompte en 2.6 (sans action code) |

## Résidus à solder avant le gel v1.0

Relevés par les agents d'application, qui ont eu pour consigne de signaler plutôt que d'inventer.
Tous relèvent du même motif : une décision appliquée contredit de la prose préexistante qu'aucun
travail de la liste ne visait. C'est le pendant interne du diagnostic de `st-complete` — les défauts
sont aux frontières, y compris à celles entre une exigence corrigée et son contexte non corrigé.

| # | Annexe | Résidu | Action |
|---|---|---|---|
| RES-1 | A | Le complément sur l'index de taxonomie est en § C.2 sans identifiant propre | Lui donner `EX-DATA-115bis` ou le rattacher formellement à `EX-DATA-115` |
| RES-2 | A | Le repli « annonce conservée, aucun rejet » coexiste avec la colonne Validation du champ 74 `countryCode`, qui porte encore « sinon REJET » | Nommer l'exception dans le champ 74, ou restreindre le repli aux seuls codes marketplace |
| RES-3 | A | `EX-DATA-108` porte deux phrases redondantes sur la sélection vide (`EMPTY` et `FULL:EMPTY`) | Fusionner en une seule formulation |
| RES-4 | C | La table des candidats CRUD et le § C.8 classent encore la comparaison de modèles en « écartée », contredits par `EX-CRUD-13bis` et la route `/comparer` | Reclasser en retenue |
| RES-5 | C | `EX-SRCH-23`/`24` et une puce d'`EX-NAV-14` décrivent encore `sort`/`desc`/`page`/`size` comme conditionnels, en citant les numéros de lignes d'une table supprimée | Supprimer la condition : l'arbitrage `A-02` a tranché |
| RES-6 | C | `EX-CRUD-7`/`11` citent la route héritée `/modele/:makeId/:modelId` au lieu de la canonique | Corriger la route |
| RES-7 | C | `EX-NAV-5` renvoie à « voir tableau § A.2.2 », devenu de la prose | Corriger le renvoi |
| RES-8 | C | Une occurrence préexistante de « navigation rapide » dans la table des candidats CRUD | Chiffrer ou reformuler |
| RES-9 | toutes | **Vérification systématique due** : deux prescriptions d'édition figurant dans le corps d'une décision n'avaient aucun travail correspondant (`ARB-39`→`EX-SCR-26`, `ARB-64`→`EX-DATA-106`). Même mode de défaillance que le trou sur `Snapshot` : le défaut est dans la traduction décisions → travaux, pas dans les décisions | Balayer les 65 décisions et vérifier que chaque prescription d'édition a son travail |
| RES-10 | B | `ARB-12` était ciblée sur `EX-SCR-176` au lieu de `EX-SCR-75` ; la référence croisée d'`EX-NAV-18` porte la même erreur | Appliquer `R-A10` : re-cibler, et inscrire l'exception « au-delà de 2 valeurs, libellé + cardinal » |
| RES-11 | A, B, C | Les identifiants contenant le mot « couverture » sont exemptés de l'interdiction (`R-A12`) mais doivent porter, à leur définition, laquelle des trois grandeurs ils désignent | Ajouter la ligne de désambiguïsation à chaque définition concernée |
