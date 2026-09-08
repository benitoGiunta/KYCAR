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
| `generate.ts` | Génération en DEUX phases (noyau colonnaire, puis présentation et chaînes) + injection d'anomalies de prix + vérité terrain. |
| `popularity.ts` | Popularité de marché (parts de marque, rang de modèle) : la CONCENTRATION du jeu de données. |
| `columnar.ts` | Allocation, assemblage de la zone de chaînes, sous-ensemble d'un `ListingColumnBatch`, empreinte mémoire. |
| `dedupe.ts` | Audit de doublons dans l'ordre total d'ingestion (EX-DATA-15, ARB-54). |
| `aggregate.ts` | Agrégation mode 1 interne (percentiles exacts, effectifs entiers, EX-DATA-111, EX-DATA-60). |
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

### Drapeaux d'ingestion (O13, tranché par D-01)
`ingestFlags` est un `Uint32Array` (32 bits) et la correspondance bit ↔ code est portée par la table
unique `INGEST_FLAG_BIT` de `src/types` : **aucun `1 << n` littéral** dans ce lot. Les 17 codes
d'EX-DATA-45 sont adressables, `MARKETPLACE_UNMAPPED` compris.

Le générateur pose : `PRICE_SENTINEL_ABSOLUTE` (prix < 250 €, EX-DATA-19(1) — y compris sur les prix
injectés), `PRICE_MISSING_UNDECLARED` (statut `MISSING`, EX-DATA-18), `SUSPECT_ZERO_MILEAGE`
(occasion à 0 km, annexe A champ 59), `MODEL_UNRESOLVED` (annonces à `modelId = 0`, ARB-59) et
`DUPLICATE_VALUE_CONFLICT` si l'audit de doublons en trouve un.

### Deux phases de génération (ARCHITECTURE §9.3, DR-049)
`openSnapshot` ne produit que le **noyau colonnaire** — marque, modèle, prix, kilométrage, années,
puissance, carburant, statut de prix, drapeaux — et calcule les **agrégats de base une fois**, servis
ensuite à l'identique. Les colonnes de PRÉSENTATION (carrosserie, boîte, couleurs, portes, places,
émissions, région, pays…) et la ZONE DE CHAÎNES sont matérialisées paresseusement, au premier accès
à `dataset.columns` ou `dataset.batch` (mode 2, export, forage). La passe de présentation possède son
PROPRE flot pseudo-aléatoire, dérivé de la même graine : la différer ne décale rien, et le lot reste
identique octet à octet à graine égale.

### Concentration du marché (`popularity.ts`, DR-038)
Le tirage marque/modèle était quasi plat : 4 954 cellules `(marque, modèle)` de médiane 17 et de
maximum 63, et une seule cellule `(marque, modèle, année)` à `n ≥ 12` — aucune cellule de rang 1 de
M1 formable, aucun `|F| ≥ 30` pour M2. Le tirage suit désormais une table de parts de marque pour la
trentaine de marques dominantes (queue de Zipf pour les autres, aucune marque à poids nul) et une loi
de Zipf sur le rang du modèle. Mesure : max ≈ 1 890 annonces par cellule, ≈ 650 cellules à `n ≥ 30`,
≈ 1 350 cellules `(marque, modèle, année)` à `n ≥ 12`, « Opel Corsa » ≈ 1 350 annonces.

### R3 (aucun champ vendeur identifiant)
Garantie **structurelle** : `ListingColumnBatch` n'a aucune colonne pour E1..E14 ; `sellerType`
(particulier/pro) et `regionCode` (NUTS-2) sont les seuls attributs vendeur, explicitement autorisés.

## Périmètre de filtrage (DR-005)
`fetchAggregates`/`fetchSelectionCount`/`fetchListingColumns` compilent une `SelectionQuery`
canonique — par IDENTIFIANT de filtre D5, jamais par paramètre d'URL. Sont interprétés **tous** les
identifiants du registre dont la colonne existe :

- taxonomie : `make`, `model`, et la valeur STRUCTURÉE `makesModelsVariants` (`mmmv`), décodée en
  portée `(marques, couples marque/modèle)` ;
- énumérés : `fuelType`/`fuelCategory`, `gearType`/`transmission`, `bodyType`, `bodyColor`,
  `upholstery`, `driveTrain`, `sellerType`, `offer`, `region`, `hadAccident`/`usageState`,
  `emissionClass`, `priceEvaluation`, et `countryType` (traduit du domaine `cy` vers
  `KYCAR_MARKETPLACE`) ;
- bornes : `priceFrom/To`, `mileageFrom/To`, `modelYearFrom/To`, `dateOfModelYearFrom/To`,
  `powerFrom/To` (converties depuis les chevaux quand `powerType = hp`, ARB-33), `doorFrom/To`,
  `numberOfSeatsFrom/To`, `electricRangeFrom/To`, `numberOfOwners` ;
- `dateOfRegistrationFrom/To` portent sur `firstRegistrationYearMonth` — le pivot d'EX-DATA-25,
  **jamais** l'année-modèle.

Un identifiant hors de cette liste est **déclaré** dans `unsupported` (repris par
`AggregateResult.unsupportedFilterIds`) **et** compile en un prédicat constamment faux : l'effectif
publié est un plancher, jamais l'effectif non filtré. `fetchSelectionCount` emprunte exactement la
même compilation que `fetchAggregates` (D-33).

## Mesures (100 000 annonces, graine par défaut)
- Empreinte mémoire colonnaire + zone texte : **17,2 Mio** (cible EX-NFR-1 ≤ 25 Mo).
- Sérialisé gzip : **5,45 Mio**, marge 9,2 % (cible EX-NFR-3 ≤ 6 Mo).
- `openSnapshot` + `fetchBaselineAggregates` : **≈ 160 ms** (1 127 ms avant remédiation ; cible
  ARCHITECTURE §9.3 ≤ 200 ms de calcul local).

## Construction
`new SyntheticDataProvider({ referenceData, seed?, listingCount?, marketplace?, outlierRate? })`.
`referenceData` provient de `buildReferenceData` (D2) — injecté par l'appelant (D8 au démarrage, les
tests via `import.meta.glob`) ; le provider ne lit jamais le disque et reste compatible navigateur.
