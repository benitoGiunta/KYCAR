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

---

## Phase 3.3 — brancher une nouvelle source : un adaptateur + une entrée de registre

`reports/data/fixture-provider.md` · `docs/data/DATA-MODEL.md` (table §3.1, la spécification de
l'adaptateur) · `docs/plans/PLAN-3-fixture-data-mvp.md` §3.3.

### 1. Ce que contient le dossier depuis la phase 3.3

```
src/providers/
├── DataProvider.ts        interface GELÉE (copie octet à octet de docs/plans/DataProvider.ts)
├── registry.ts            LE point de bascule : spec -> provider, sans recompilation
├── adapters/as24/         source AS24 -> canonique (pur, réutilisable par une source réelle)
├── fixture/               FixtureDataProvider : fichiers versionnés, NDJSON gzip en flux
├── synthetic/             SyntheticDataProvider : génération à la volée (bancs, repli mode 2)
└── tweedehands/           TweedehandsDataProvider : source réelle, NON câblée (D-18 / AC-01)
```

### 2. La recette, en deux fichiers

**(a) Un adaptateur** sous `src/providers/adapters/<source>/` : une fonction PURE
`adapt<Source>Listing(raw, ctx) → { accepté: ligne canonique } | { rejeté: motif }`, qui applique
dans l'ordre d'`EX-DATA-2` — **garde R3 d'abord** (`scanForbiddenFields` sur l'objet REÇU), puis
normalisation (unités d'`EX-DATA-4`, arrondi d'`EX-DATA-6`, `EX-DATA-7` sur les chaînes), puis
validation contre `LISTING_NUMERIC_BOUNDS` / `LISTING_BOUND_INGEST_FLAG` (`src/types/validation.ts`,
source UNIQUE des bornes — D-47 : aucune borne n'est recopiée dans un adaptateur).

Ce que l'adaptateur ne fait jamais : inventer un code de drapeau. `KYCAR_INGEST_FLAG` compte 17
codes et l'encodage est POSITIONNEL (D-01 / DR-013) ; une condition détectée hors de ce vocabulaire
se publie ailleurs (`notices` de l'adaptateur as24 → `coverageNote`), jamais dans le bit d'un autre.

**(b) Une entrée de registre** dans `registry.ts` : `spec`, libellé, `sourceKind`, service du mode 2,
et surtout `wired` — une source non branchable est REFUSÉE AVEC SON MOTIF, pas absente du registre.

Rien d'autre ne bouge : ni le moteur, ni l'état, ni les écrans. C'est l'exigence **DF-2** du PLAN-3.

### 3. La bascule de source est un paramètre

| Priorité | Origine | Exemple |
|---|---|---|
| 1 | paramètre d'URL (le seul qui se partage dans un lien) | `?provider=fixture:dev` |
| 2 | variable de build | `VITE_KYCAR_PROVIDER=synthetic` |
| 3 | défaut (D3-01) | `fixture:test` |

Une spécification **inconnue** ou **non câblée** retombe sur le défaut **et** écrit un avertissement
dans la `coverageNote` du `SnapshotDescriptor` — le chemin par lequel la coquille l'affiche déjà.
D-03 appliqué à la source : jamais appliqué en silence, jamais ignoré en silence.

### 4. Ce que le provider de fixtures garantit

- **`sourceKind = 'FIXTURE'`** propagé jusqu'à l'UI : un jeu fictif versionné n'est ni un marché
  réel, ni une distribution calculée à la volée dans l'onglet.
- **Contrôle de version de schéma AVANT la première ligne** (`DATA-MODEL` §6) : un majeur inconnu
  refuse l'ouverture, aucune ligne servie.
- **Lecture en flux** : `DecompressionStream('gzip')` branché après RENIFLAGE des octets magiques
  `1f 8b`, découpage ligne à ligne, jamais le texte entier en mémoire (budget ARB-55).
- **Dédoublonnage indépendant de l'ordre du fichier** (D3-15) : complétude, puis date de mise à
  jour, puis signature stable. Le tri du NDJSON sert la diffabilité, jamais l'arbitrage.
- **Baseline précalculée une fois** à l'ouverture (`ARCHITECTURE` §9.3 garde-fou 1) :
  `fetchBaselineAggregates` rend le même objet.
- **Colonne `booleanFlags` remplie** (D3-10) : les dix booléens du dictionnaire, dont six tri-états.
- **`unsupportedFilterIds`** vient de la MÊME compilation de sélection que `fetchSelectionCount`
  (D-33).

Le cinquième champ textuel du lot (`trimTokens`) est sérialisé en jetons séparés par une espace ;
le provider synthétique, lui, le laisse vide.

### 5. Suite de contrat

`tests/contract/provider-contract.test.ts` (`npm run test:contract`) exécute les MÊMES cas sur
**synthetic**, **fixture** et un **mock 2dehands** : sincérité de `describe()`, invariants I1–I8,
`unsupportedFilterIds` jamais tu, R3 (`scanForbiddenFields` sur ce qui sort du provider),
déterminisme d'`openSnapshot`, cohérence baseline ↔ `fetchAggregates` sans filtre,
`fetchSelectionCount` = somme des effectifs d'agrégat, budgets d'ouverture et de taille.
