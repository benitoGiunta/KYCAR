# KYCAR

Agrégateur analytique du marché de l'occasion AutoScout24. Là où AutoScout24 liste des annonces,
KYCAR montre la **structure statistique de l'offre** — et les anomalies qui s'en détachent.

## État du dépôt

Le code existe et s'exécute (`src/`, lots D1 à D9 de la phase 2.4). Les phases **2.4 (build),
2.5 (revue), 2.6 (remédiation) et 2.7 (vérification finale) sont closes** : `reports/DEV-REVIEW.md`
consolide la revue par lot, `reports/REMEDIATION.md` la remédiation 2.6, et
`reports/FINAL-VERIFICATION.md` la vérification finale 2.7 (matrice de couverture chiffrée sur les
485 exigences, deux constats bloquants FV-01/FV-02). Les phases **2.8 (remédiation post-vérification)
et 2.9 (harnais E2E / acceptance) sont en cours** : les décisions et rapports par agent sont suivis
dans `reports/remediation-2.8/`, la matrice de bout en bout dans `tests/e2e/`.

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

## Arborescence

```
docs/
  00-CONTEXT.md
  plans/           plans de chantier et architecture (dont ARCHITECTURE.md)
  requirements/    document d'exigences et données de référence
  research/        sorties du chantier 1
src/               code de l'application (D1-D9 : styles, worker, types, providers, engine,
                   state, screens, orchestration)
tests/             tests unitaires du dépôt, sondes de revue (tests/review/) et harnais de bout
                   en bout (tests/e2e/, `npm run test:e2e`)
reports/           rapports de revue, stress-test, remédiation, vérification
  review/          revues par lot de la phase 2.5
  remediation/     décisions et rapports de la remédiation 2.6, par agent
  remediation-2.8/ décisions et rapports de la remédiation post-vérification 2.8, par agent
```
