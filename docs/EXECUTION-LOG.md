# Journal d'exécution

État d'avancement des deux chantiers. Ce fichier est la **source de vérité de l'avancement** :
il doit permettre de reprendre le travail sans aucun contexte conversationnel.

Dernière mise à jour : 2026-09-06 (référentiel officiel relevé)

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
| E5 | **Aucune requête sur `www.autoscout24.be` ni `www.autoscout24.com`** : leur robots.txt interdit nommément ClaudeBot sur tout le domaine (`Disallow: /`) | relevé le 2026-09-06, voir `docs/reference/AS24-REFERENCE-API.md` |

Conséquence de E1 sur le chantier 1 : les plans gratuits des providers tiers ne peuvent pas être
testés par les agents. Chaque option concernée est renvoyée dans la section
`ACTIONS-COMMANDITAIRE` du rapport final.

## Chantier 1 — Acquisition des données

| Phase | Agents | Modèle / effort | Livrable | État |
|---|---|---|---|---|
| 1.1 Balayage des candidats | `sweep-1` | Opus / high | `docs/research/candidates-v1.md` | EN COURS |
| 1.2 Revue de complétude 1 | `gap-review-1` | Opus / high | `docs/research/candidates-v2.md` | À FAIRE |
| 1.3 Revue de complétude 2 | `gap-review-2` | Opus / high | `docs/research/candidates-final.md` | À FAIRE |
| 1.4 Investigation prouvée | `probe-A…n` | Opus ou Sonnet / high | `docs/research/probe-*.md` | À FAIRE |
| 1.5 Audit croisé | `audit-A…n` | Sonnet / high | `docs/research/audit-*.md` | À FAIRE |
| 1.6 Compilation et stress-test | `compile-1` | Opus / max | `docs/research/DATA-ACQUISITION-REPORT.md` | À FAIRE |

## Chantier 2 — Application d'agrégation

| Phase | Agents | Modèle / effort | Livrable | État |
|---|---|---|---|---|
| 2.0 Données de référence | `ref-filters` | Opus / high | `docs/requirements/REF-filters.md`, `data/reference/filters.json` | EN COURS |
| 2.0 Données de référence | `ref-taxonomy` | Sonnet / medium-high | `docs/requirements/REF-taxonomy.md`, `data/reference/taxonomy.json` | VALIDÉ — 295 marques / 4 955 modèles voiture, ids réels, reproduit indépendamment |
| 2.1 Exigences | `req-lead` + `req-data` / `req-screens` / `req-behaviour` | Opus max + Opus/Opus/Sonnet high | `docs/requirements/REQUIREMENTS.md` | À FAIRE |
| 2.2 Stress-test des exigences | `st-complete` / `st-ambiguity` / `st-adversarial` + `st-arbiter` | Opus/Opus/Sonnet high + Opus max | `reports/REQ-STRESSTEST.md`, REQUIREMENTS v1.0 | À FAIRE |
| 2.3 Architecture | `arch-lead` | Opus / high | `docs/plans/ARCHITECTURE.md` | À FAIRE |
| 2.4 Développement D1–D9 | `dev-D*` | voir plan 2 | code | À FAIRE |
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
| O1 | Texte exact des CGU AutoScout24 non récupéré | Positionnement juridique reste une hypothèse | Chantier 1, phase 1.4 |
| O2 | Existence d'une voie gratuite ET autonome non tranchée | Détermine si le lot D9 est réalisable | Chantier 1, phase 1.6, critère S6 |
| O3 | ~~Identifiants techniques marque/modèle inconnus~~ | — | **RÉSOLU** : ids numériques réels relevés sur `/makes` |
| O4 | Les codes de paramètres d'URL du **moteur de recherche public** ne sont pas déductibles de l'API de référence (limite L7), et le site est interdit au crawl | `REF-filters.md` devra s'appuyer sur des sources tierces, donc avec un niveau de preuve inférieur | Phase 2.0, agent `ref-filters` en cours |
| O5 | Les slugs d'URL restent extrapolés (limite L3) | Bloque la construction d'URL AutoScout24 fiables (deeplinks vers l'annonce) | À trancher en phase 2.1 |
