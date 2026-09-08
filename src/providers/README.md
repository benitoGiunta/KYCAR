# src/providers

Owned by **lots D3 (`SyntheticDataProvider`), D9 (`TweedehandsDataProvider`)**, and a future lot
for `AutoScout24PaidDataProvider`. Every implementation satisfies the `DataProvider` interface
frozen in `docs/plans/DataProvider.ts` (phase 2.3).

`DataProvider.ts` here is a **verbatim copy** of `docs/plans/DataProvider.ts`, integrated by lot D2
(same bytes, unchanged semantics). Import the contract from `../types` (barrel) or directly from
`./DataProvider`; do not duplicate or edit it — sync it from `docs/plans/` if the frozen file ever
changes.

`mock-provider.test.ts` (lot D2) shows a `SERVED` and an `UNAVAILABLE` implementation and the
`servesMode2()` type guard — the template lots D3/D9 build on.

## Remédiation 2.6 (`fix-providers`) — ce que les deux adaptateurs garantissent désormais

Rapport : `reports/remediation/fix-providers.md`. Points de contrat que les couches consommatrices
(moteur, orchestration, écrans) peuvent tenir pour acquis.

### 1. Drapeaux d'ingestion et échantillons valides (EX-DATA-19, EX-DATA-45, EX-DATA-60)

Les deux providers posent leurs drapeaux **à l'ingestion**, par la table unique `INGEST_FLAG_BIT` de
`src/types` — jamais par un `1 << n` littéral. `PRICE_SENTINEL_ABSOLUTE` (prix < 250 €) est posé par
le générateur *et* par l'adaptateur réel ; l'annonce reste **comptée** dans `listingCount` (ARB-15)
mais sort de `V_price` dans toute fourchette publiée par le provider. Même règle pour
`SUSPECT_ZERO_MILEAGE` / `MILEAGE_OUT_OF_RANGE` sur `V_mileage`.

### 2. `unsupportedFilterIds` : un effectif n'est jamais publié comme filtré s'il ne l'est pas

`AggregateResult.unsupportedFilterIds` liste les identifiants de filtre que le provider **n'a pas
pu** appliquer. Deux règles, identiques dans les deux implémentations :

- un identifiant non pris en charge est **déclaré**, jamais ignoré en silence ;
- il compile en un prédicat constamment **faux** : aucune ligne ne peut être prouvée conforme, donc
  l'effectif publié est un plancher (0 pour un filtre inapplicable seul), **jamais** l'effectif non
  filtré. `fetchSelectionCount` passe par la même compilation que `fetchAggregates` (D-33).

**Ce que l'application doit en faire (D-03)** : ne jamais présenter un effectif comme filtré quand
cette liste est non vide — état dégradé `ET-FILTRE-NON-APPLIQUE`, `hasUserFilters` ne reflétant que
les filtres réellement appliqués.

### 3. Baseline précalculée et hors chemin critique (ARCHITECTURE §9.3)

- **Synthétique** : `openSnapshot` génère le noyau colonnaire et calcule les agrégats de base **une
  fois** ; `fetchBaselineAggregates` rend le **même objet**. Les colonnes de présentation et la zone
  de chaînes des annonces individuelles sont matérialisées **paresseusement**, au premier accès
  mode 2. Mesure : `openSnapshot` + baseline ≈ 160 ms à 100 000 annonces (1 127 ms avant).
- **Réel** : `openSnapshot` ne fait qu'**un** aller (la page racine). La répartition par marque est
  calculée à la demande et mémorisée dans un cache **injectable**
  (`TweedehandsDataProviderOptions.baselineCache`), que `closeSnapshot` ne détruit pas. Le cache par
  défaut est un cache mémoire de processus ; **la couche application y branche son cache IndexedDB**
  (`src/persistence`) sans que l'adaptateur connaisse le stockage.

### 4. Ce que l'adaptateur réel ne sait pas faire, et le dit

`coverageNote` du `SnapshotDescriptor` porte la vérité de couverture : comptes exhaustifs seulement
quand la sélection est entièrement poussée dans la facette marque/modèle, fourchettes calculées sur
l'échantillon de la page, **axe année à `n = 0`** (EX-DATA-25 impose la première immatriculation, que
la surface ne sert pas et qu'EX-DATA-27 interdit d'imputer), région NUTS-2 toujours `REGION_UNRESOLVED`.
