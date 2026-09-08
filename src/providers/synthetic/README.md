# src/providers/synthetic — lot D3 (`SyntheticDataProvider`)

Implémentation `DataProvider` de source **SYNTHETIC** (EX-DATA-107) servant le **mode 1 ET le
mode 2** (ARCHITECTURE §6.3) : `sourceKind = 'SYNTHETIC'`, `mode1.source = 'LISTINGS'`,
`mode2 = SERVED` (dataset complet, outliers injectés). N'édite aucun barrel partagé ; le câblage est
fait par le coordinateur. Ne modifie ni `src/types/`, ni l'interface gelée `../DataProvider.ts`.

## Fichiers

| Fichier | Rôle |
|---|---|
| `prng.ts` | PRNG déterministe `xoshiro128**` (graine 32 bits), gaussiennes, tirage pondéré. |
| `catalog.ts` | Pont vocabulaires réels (D2) → distributions pondérées ; convention d'encodage. |
| `generate.ts` | Génération du dataset colonnaire plausible + injection d'outliers + vérité terrain. |
| `columnar.ts` | Assemblage/sous-ensemble d'un `ListingColumnBatch`, mesure d'empreinte mémoire. |
| `aggregate.ts` | Agrégation mode 1 interne (percentiles exacts, effectifs entiers, EX-DATA-111). |
| `selection.ts` | Compilation d'une `SelectionQuery` canonique en prédicat de lignes. |
| `SyntheticDataProvider.ts` | Les 8 méthodes de `DataProvider` + `getGroundTruthOutliers`. |
| `index.ts` | Barrel public du sous-dossier. |
| `synthetic.test.ts` | Vérification des 6 critères de succès. |

## Contrats inter-lots

### Encodage des colonnes énumérées (pour D4/D5) — DÉCISION SIGNALÉE
Une colonne `Uint8Array` ne peut pas stocker un code canonique (chaîne `"B"`, `"12"`, `"BE10"`). La
convention retenue par D3 est **l'indice de la valeur dans le tableau `values` du vocabulaire chargé**
(`ReferenceData.vocabularies`), la sentinelle `255` valant « inconnu ». Le schéma D2 (`columns.ts`)
attache un vocabulaire à chaque colonne énumérée mais ne fige PAS explicitement « indice vs code » ;
l'octet impose l'indice. **D4 et D5 doivent décoder via le même `ReferenceData`** (ordre de `values`
stable, garanti par le chargeur pur `buildReferenceData`).

### Vérité terrain des outliers (pour D4)
`provider.getGroundTruthOutliers(): readonly InjectedOutlier[]` où :

```ts
interface InjectedOutlier {
  rowIndex: number;        // indice de ligne dans le lot complet (localDatasetKey === 'FULL')
  listingId: string;       // UUID canonique 8-4-4-4-12 (miroir de la colonne listingId)
  makeId: number;
  modelId: number;
  method: 'M1' | 'M2';     // M1 = anomalie absolue ; M2 = anomalie relative à la cellule année/km
  flag: 'M1_LOW' | 'M1_HIGH' | 'M2_LOW' | 'M2_HIGH'; // code KYCAR_OUTLIER_FLAG
  fairPriceEur: number;    // juste prix modélisé avant injection
  injectedPriceEur: number;// prix aberrant réellement stocké dans priceEur
}
```

Les **M1** (absolus, hors de toute fourchette de marché) sont confirmés par une simple fence de Tukey
globale sur `ln(prix)` ; les **M2** (relatifs) par une fence de Tukey par cellule
`(marque, modèle, tranche de 3 ans)` — voir `synthetic.test.ts`. Aucune dépendance à D4.

### Drapeaux d'ingestion (O13)
`ingestFlags` est un `Uint16Array` (16 bits). Le bit `i` correspond à `INGEST_FLAG_VALUES[i]`
(vocabulaire `KYCAR_INGEST_FLAG`). **Divergence de source portée depuis D2** : EX-DATA-45 énumère
**17** codes ; 16 bits n'en adressent que 16. Le 17ᵉ (`MARKETPLACE_UNMAPPED`, indice 16) n'est donc
pas représentable sur ce champ — non pertinent ici (marché unique connu). D3 ne pose que
`SUSPECT_ZERO_MILEAGE` (bit 8), sur les rares annonces à 0 km non neuves.

### R3 (aucun champ vendeur identifiant)
Garantie **structurelle** : `ListingColumnBatch` n'a aucune colonne pour E1..E14 ; `sellerType`
(particulier/pro) et `regionCode` (NUTS-2) sont les seuls attributs vendeur, explicitement autorisés.

## Périmètre de filtrage supporté (dette signalée)
`fetchAggregates`/`fetchSelectionCount`/`fetchListingColumns` compilent une `SelectionQuery`
canonique. Sont interprétés les filtres qui s'appliquent **1:1 aux colonnes stockées** :
`make`/`model` (identifiants entiers), les énumérés `bodyType`, `bodyColor`, `upholstery`,
`driveTrain`, `transmission`, `sellerType`, `offer`, `region`, `hadAccident`/`usageState`, et les
bornes `priceFrom/To`, `mileageFrom/To`, `modelYearFrom/To`, `powerFrom/To`. Les filtres D5
**structurés** (`mmmv`, `mcat`) et `fuelType` (vocabulaire `KYCAR_FUEL_TYPE` ≠ colonne
`fuelCategory`) ne sont PAS interprétés — un filtre non reconnu est ignoré et remonté dans
`unsupported`. Le câblage de la grammaire d'état complète relève de l'intégration D4/D5 ; l'agrégation
interne de D3 vise l'autonomie et la testabilité, pas le moteur optimisé (lot D4).

## Tailles mesurées (100 000 annonces, graine 7)
- Empreinte mémoire colonnaire : **≈ 15,8 Mo** (cible EX-NFR-1 ≤ 25 Mo).
- Sérialisé gzip : **≈ 5,7 Mo** (cible EX-NFR-3 ≤ 6 Mo).

## Construction
`new SyntheticDataProvider({ referenceData, seed?, listingCount?, marketplace?, outlierRate? })`.
`referenceData` provient de `buildReferenceData` (D2) — injecté par l'appelant (D8 au démarrage, les
tests via `import.meta.glob`) ; le provider ne lit jamais le disque et reste compatible navigateur.
