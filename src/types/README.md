# src/types

Owned by **lot D2**. Le schéma exécutable de KYCAR : les entités d'`EX-DATA-105`, le modèle
colonnaire à sentinelles typées (`EX-DATA-119`/`120`), la validation + les 8 invariants
(`EX-DATA-104`), le codec `selectionHash`/`localDatasetKey` (`EX-DATA-108`) et le chargeur des
référentiels statiques.

Point d'entrée : `index.ts` (barrel). Il réexporte aussi l'interface `DataProvider` gelée depuis
`../providers/DataProvider.ts` (jamais dupliquée).

| Fichier | Contenu |
|---|---|
| `sentinels.ts` | sentinelles `-1` / `255`, `MODEL_ID_UNRESOLVED`, lecteurs/encodeurs typés |
| `vocabularies.ts` | les 27 vocabulaires nommés (`VocabularyName`) + domaines des vocabulaires CRÉÉS + table postale BE + table bit ↔ code des drapeaux d'ingestion (`INGEST_FLAG_BIT`, `hasIngestFlag`, `setIngestFlag`, `ingestFlagCodes`) |
| `columns.ts` | descripteur `LISTING_COLUMNS` aligné sur `ListingColumnBatch`, vue logique `Listing` |
| `entities.ts` | `Snapshot`, `Make`, `Model`, `Enumeration`, `EnumValue`, `Region`, `PostalRegionRange`, `DistributionBucket`, `SelectionStats`, `OutlierVerdict`, `DensityCell` (+ réexports d'agrégats) |
| `sha256.ts` | SHA-256 synchrone maison (aucune lib tierce) |
| `selection.ts` | codec canonique + scission T/R (`computeSelectionHash`, `localDatasetKey`, `serializeSelection`) |
| `validation.ts` | garde R3 (`scanForbiddenFields`, formes aplaties comprises) + `validateListingRecord` |
| `shared-rules.ts` | règles partagées (2.6 étape 0) : `PRICE_SENTINEL_ABSOLUTE_EUR`/`isPriceSentinelAbsolute`, `HP_TO_KW`/`hpToKw`, `listingKey`, `DUPLICATE_CONFLICT_FIELDS`, `MODEL_VERSION_CLEAN_MAX`/`cleanModelVersion` |
| `invariants.ts` | `checkI1`..`checkI8` (fonctions testables) |
| `reference.ts` | `buildReferenceData(raw)` — charge taxonomie/références/filtres déjà parsés, expose typé |

Le chargeur est PUR : il reçoit les JSON déjà parsés (l'app D8 fait le `fetch`, les tests
alimentent avec les vrais fichiers du dépôt) — la taxonomie n'est donc jamais inlinée dans le
bundle (garde `EX-NFR-10`).
