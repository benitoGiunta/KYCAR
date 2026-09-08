# KYCAR

Agrégateur analytique du marché de l'occasion AutoScout24. Là où AutoScout24 liste des annonces,
KYCAR montre la **structure statistique de l'offre** — et les anomalies qui s'en détachent.

## État du dépôt

Le code existe et s'exécute (`src/`, lots D1 à D9 de la phase 2.4). La phase 2.4 est **close** ;
les phases **2.5 (revue) et 2.6 (remédiation) sont en cours** : la revue par lot a produit
`reports/DEV-REVIEW.md`, et les corrections engagées contre ses constats sont suivies dans
`reports/remediation/`.

## Documentation

| Document | Objet |
|---|---|
| [00-CONTEXT.md](docs/00-CONTEXT.md) | Intention de l'application, hypothèses de travail, cadre juridique et RGPD |
| [PLAN-1-data-acquisition.md](docs/plans/PLAN-1-data-acquisition.md) | Chantier 1 — recherche exhaustive des voies d'acquisition des données |
| [PLAN-2-app-build.md](docs/plans/PLAN-2-app-build.md) | Chantier 2 — exigences, conception et construction de l'application |
| [ARCHITECTURE.md](docs/plans/ARCHITECTURE.md) | Architecture applicative, modèle de données, interface `DataProvider` |
| [DEV.md](DEV.md) | Guide de développement de l'application (`src/`) |
| [DEV-REVIEW.md](reports/DEV-REVIEW.md) | Revue de la phase 2.4 par lot, table des constats consolidés (phase 2.5) |

## Arborescence

```
docs/
  00-CONTEXT.md
  plans/           plans de chantier et architecture (dont ARCHITECTURE.md)
  requirements/    document d'exigences et données de référence
  research/        sorties du chantier 1
src/               code de l'application (D1-D9 : styles, worker, types, providers, engine,
                   state, screens, orchestration)
tests/             tests unitaires du dépôt et sondes de revue (tests/review/)
reports/           rapports de revue, stress-test, remédiation, vérification
  review/          revues par lot de la phase 2.5
  remediation/     décisions et rapports de la remédiation 2.6, par agent
```
