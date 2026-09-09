# KYCAR

Agrégateur analytique du marché de l'occasion AutoScout24. Là où AutoScout24 liste des annonces,
KYCAR montre la **structure statistique de l'offre** — et les anomalies qui s'en détachent.

## Source des données

**KYCAR est livré sur des données FICTIVES.** Il n'existe aucune API publique de lecture chez la
place de marché ciblée et l'accès à une source réelle est reporté (décision `D3-00`,
`docs/research/AUTOSCOUT24-PROVIDER-OPTIONS.md`). L'application sert donc, **par défaut**, un jeu
d'annonces **générées** à la forme AutoScout24 (`data/fixtures/test`, 3 snapshots hebdomadaires de
20 000 annonces, `D3-01`) : aucune annonce réelle, aucun lien avec AutoScout24, aucune valeur de
marché. La nature de la source est écrite sur **tous** les écrans, dans le pied de page, dans
`/mentions` et dans l'en-tête des exports CSV — jamais seulement dans les mentions.

La source est un **paramètre**, pas une recompilation (`DF-2`) :

| Bascule | Effet |
|---|---|
| `?provider=fixture:test` | défaut : 3 × 20 000 annonces fictives |
| `?provider=fixture:dev` | profil réduit : 3 × 5 000, ouverture rapide |
| `?provider=synthetic` | jeu synthétique généré à la volée (bancs de performance) |
| valeur inconnue ou source non câblée | repli sur le défaut **avec un avertissement affiché** |

Génération et contrôle des jeux : `npm run data:gen` (déterministe, à graine fixe),
`npm run data:validate` (schéma, empreintes, chaînage, garde R3, budgets de taille),
`npm run data:check` (sondes statistiques de `docs/data/DATASET-SPEC.md`).

## État du dépôt

Le code existe et s'exécute (`src/`, lots D1 à D9 de la phase 2.4). **Toutes les phases du plan 2
sont closes** : 2.4 (build), 2.5 (revue, `reports/DEV-REVIEW.md`), 2.6 (remédiation,
`reports/REMEDIATION.md`), 2.7 (vérification finale, `reports/FINAL-VERIFICATION.md`, 485 exigences
cotées), 2.8 (remédiation post-vérification, `reports/REMEDIATION-2.8.md` rev 3, porte G7, dix dettes
admises et écrites) et 2.9 (recette navigateur Playwright, `tests/e2e/` et `reports/ACCEPTANCE.md`
rev 2, porte G8 : 264 tests E2E sans échec inattendu, 0 violation axe-core, budgets tenus). Les
décisions et rapports par agent de 2.8/2.9 sont dans `reports/remediation-2.8/`. Restent une dette de
présentation consignée (`ACCEPTANCE.md` §8, décision D8-43) et la livraison (fusion `main`, tag), qui
relèvent du commanditaire.

## Documentation

| Document | Objet |
|---|---|
| [00-CONTEXT.md](docs/00-CONTEXT.md) | Intention de l'application, hypothèses de travail, cadre juridique et RGPD |
| [PLAN-1-data-acquisition.md](docs/plans/PLAN-1-data-acquisition.md) | Chantier 1 — recherche exhaustive des voies d'acquisition des données |
| [PLAN-2-app-build.md](docs/plans/PLAN-2-app-build.md) | Chantier 2 — exigences, conception et construction de l'application |
| [ARCHITECTURE.md](docs/plans/ARCHITECTURE.md) | Architecture applicative, modèle de données, interface `DataProvider` |
| [DEV.md](DEV.md) | Guide de développement de l'application (`src/`) |
| [DEV-REVIEW.md](reports/DEV-REVIEW.md) | Revue de la phase 2.4 par lot, table des constats consolidés (phase 2.5) |
| [FINAL-VERIFICATION.md](reports/FINAL-VERIFICATION.md) | Vérification finale (phase 2.7) : matrice de couverture, constats FV-01…FV-24 |
| [REMEDIATION-2.8.md](reports/REMEDIATION-2.8.md) | Remédiation post-vérification (phase 2.8, rev 3) : constat → correction → preuve, dix dettes admises, porte G7 |
| [ACCEPTANCE.md](reports/ACCEPTANCE.md) | Recette finale navigateur (phase 2.9b) : matrice exigence → test E2E → résultat → capture, porte G8 |
| [PLAN-3-fixture-data-mvp.md](docs/plans/PLAN-3-fixture-data-mvp.md) | Chantier 3 — données fictives à la forme AutoScout24 et MVP |
| [DATASET-SPEC.md](docs/data/DATASET-SPEC.md) | Spécification du jeu de données fictif (lois, corrélations, anomalies injectées) |

## Arborescence

```
data/            référentiels (`reference/`), schéma de la couche source (`schema/`) et
                 FIXTURES versionnées (`fixtures/dev|test`, NDJSON gzip + manifest par snapshot)
docs/
  00-CONTEXT.md
  data/            modèle de données et spécification du jeu fictif (DATASET-SPEC.md)
  plans/           plans de chantier et architecture (dont ARCHITECTURE.md)
  requirements/    document d'exigences et données de référence
  research/        sorties du chantier 1
src/               code de l'application (D1-D9 : styles, worker, types, providers, engine,
                   state, screens, orchestration)
tests/             tests unitaires du dépôt, sondes de revue (tests/review/), suite de contrat
                   des providers (tests/contract/, `npm run test:contract`) et harnais de bout
                   en bout (tests/e2e/, `npm run test:e2e`)
tools/dataset/     générateur, validateur et sondes statistiques des fixtures (`npm run data:*`)
reports/           rapports de revue, stress-test, remédiation, vérification
  review/          revues par lot de la phase 2.5
  remediation/     décisions et rapports de la remédiation 2.6, par agent
  remediation-2.8/ décisions et rapports de la remédiation post-vérification 2.8, par agent
```
