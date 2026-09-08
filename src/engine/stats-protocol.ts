/**
 * KYCAR — Types du protocole worker pour les statistiques D8-07 (étape 0 de la remédiation 2.8)
 * =================================================================================================
 * D8-07 lève la dette D-17 : `GROUPSTAT`, `NTILE`, les paliers de puissance, l'indice de
 * dépréciation, le `R²` de M2, les statistiques de cellule enrichies et l'échantillon du nuage
 * sont calculés DANS LE WORKER et publiés par `RecalcResult` — source unique, le recalcul de D7
 * sur le thread principal disparaît (`src/screens/distribution/group-stat.ts`,
 * `scatter-sample.ts`).
 *
 * CE FICHIER NE CONTIENT QUE DES TYPES. L'étape 0 fige la FORME des sorties pour que fix-engine
 * (calcul) et fix-screens (consommation) travaillent en parallèle sans se contredire ; aucun champ
 * n'est calculé ici, et TOUS les champs ajoutés à `RecalcResult` sont OPTIONNELS — un
 * `RecalcResult` d'avant D8-07 reste un `RecalcResult` valide, et rien ne casse tant que le moteur
 * ne les remplit pas.
 *
 * CONTRAINTE DE PROTOCOLE : ces objets traversent `postMessage`, donc l'ALGORITHME DE CLONAGE
 * STRUCTURÉ. Uniquement des données : primitives, chaînes, tableaux, `TypedArray`. Aucune fonction,
 * aucune classe, aucune `Map`/`Set` d'objets non clonables, aucun `undefined` porteur de sens
 * (l'absence se dit par `null`, EX-DATA-2).
 */

/* ================================================================================================
 * 1. GROUPSTAT — EX-DATA-83bis
 * ============================================================================================== */

/**
 * Clés de groupe ADMISES par EX-DATA-83bis, exhaustivement. « Aucune autre clé n'est admise sans
 * amendement de cette exigence » : l'union est donc fermée, et une clé nouvelle est un amendement
 * de l'annexe A avant d'être un ajout de code.
 */
export type GroupStatKey =
  | 'fuelCategory'
  | 'priceEvaluationCategory'
  | 'sellerType'
  | 'countryCode'
  | 'bodyType'
  | 'transmission'
  /** Bucket d'année produit par `BIN` (EX-DATA-77, ligne Année). */
  | 'yearBucket'
  /** Rang de `NTILE(V_mileage(Σ), 5)` (EX-DATA-83ter). */
  | 'mileageNtile'
  /** Palier de puissance d'EX-DATA-83quater. */
  | 'powerTier';

/**
 * Un groupe `G_v` de `GROUPSTAT(Σ, g, m)` (EX-DATA-83bis). Publie la valeur de clé, son libellé
 * d'affichage, l'effectif du groupe, et le bloc statistique sur `V_m(G_v)` avec `n_m` et sa
 * couverture au sens d'EX-DATA-61 — publier une statistique sans son effectif est interdit.
 */
export interface GroupStatEntry {
  /** Valeur de clé `v` sous sa forme entière (code énuméré, index de bucket, rang, palier). */
  readonly key: number;
  /** Libellé d'affichage de la clé (vocabulaire décodé, borne de bucket, libellé de palier). */
  readonly label: string;
  /** `listingCount(G_v)` — effectif du groupe, toutes annonces confondues. */
  readonly listingCount: number;
  /** `n_m(G_v)` — effectif sur lequel la métrique est calculable (EX-DATA-61). */
  readonly n: number;
  /** `n_m(G_v) / listingCount(G_v)` — couverture MÉTRIQUE (EX-DATA-61), jamais `sampleCoverage`. */
  readonly coverage: number | null;
  /** `Q(V_m(G_v), 0,50)`, ou `null` si `n = 0`. */
  readonly median: number | null;
  /** `Q(V_m(G_v), 0,05)` — libellé d'affichage `P5` (EX-SCR-12). */
  readonly p05: number | null;
  /** `Q(V_m(G_v), 0,95)` — libellé d'affichage `P95` (EX-SCR-12). */
  readonly p95: number | null;
  /** `q3 − q1` du bloc d'EX-DATA-64. */
  readonly iqr: number | null;
}

/**
 * Le résultat complet d'un `GROUPSTAT(Σ, g, m)` : la clé employée, la métrique, les groupes dans
 * l'ordre total d'EX-DATA-83bis (`listingCount` décroissant, puis libellé selon EX-DATA-70bis,
 * puis code de clé croissant), et le compteur d'annonces à clé INCONNUE — qui ne forment jamais un
 * groupe (ARB-36) mais doivent être comptées à côté.
 */
export interface GroupStatSet {
  readonly key: GroupStatKey;
  readonly metric: 'price' | 'year' | 'mileage';
  readonly groups: readonly GroupStatEntry[];
  /** Annonces dont `g(l)` est INCONNU (EX-DATA-83bis, `unknownKeyCount`). */
  readonly unknownKeyCount: number;
}

/* ================================================================================================
 * 2. NTILE — EX-DATA-83ter
 * ============================================================================================== */

/** Une tranche de rang de `NTILE(V, k)` (EX-DATA-83ter). */
export interface NtileSlice {
  /** Rang `t ∈ [1, k]`. */
  readonly rank: number;
  /** Valeur du rang le plus bas de la tranche, ou `null` si la tranche est vide. */
  readonly loObserved: number | null;
  /** Valeur du rang le plus haut de la tranche. */
  readonly hiObserved: number | null;
  readonly count: number;
}

/**
 * Le découpage complet. `status = 'DEGRADED'` quand `n < k` : `NTILE` produit alors `n` tranches
 * d'un élément et le DIT (EX-DATA-83ter), au lieu de rendre des tranches vides silencieuses.
 */
export interface NtileResult {
  /** Métrique de tri des rangs (`mileage` pour G10). */
  readonly metric: 'price' | 'year' | 'mileage';
  /** `k` demandé (5 pour les quintiles de rang de G10). */
  readonly k: number;
  readonly status: 'OK' | 'DEGRADED';
  readonly slices: readonly NtileSlice[];
}

/* ================================================================================================
 * 3. Paliers de puissance — EX-DATA-83quater
 * ============================================================================================== */

/**
 * Un palier de puissance : `⌊powerKw / 20⌋`, origine `0`, largeur fixe 20 kW, borne haute
 * exclusive, libellé `<20·k> – <20·(k+1) − 1> kW`. Les paliers vides INTÉRIEURS sont conservés ;
 * aucun palier n'est émis au-delà de celui de la valeur maximale observée.
 */
export interface PowerTierEntry {
  /** Indice du palier `k`. */
  readonly tier: number;
  /** Borne basse INCLUSIVE, `20 · k`. */
  readonly lowerKw: number;
  /** Borne haute EXCLUSIVE, `20 · (k + 1)`. */
  readonly upperKw: number;
  readonly label: string;
  readonly listingCount: number;
  /** Statistiques de prix du palier (même bloc que `GroupStatEntry`). */
  readonly n: number;
  readonly median: number | null;
}

/** Les paliers publiés, plus les annonces de puissance INCONNUE (qui n'entrent dans aucun palier). */
export interface PowerTierResult {
  readonly tiers: readonly PowerTierEntry[];
  readonly unknownKeyCount: number;
}

/* ================================================================================================
 * 4. Indice de dépréciation — EX-DATA-83quinquies
 * ============================================================================================== */

/** Un millésime de l'indice de dépréciation. */
export interface DepreciationEntry {
  /** Millésime `y` (bucket d'année de `GROUPSTAT`). */
  readonly year: number;
  /** `n_price(G_y)` — sous 12, l'indice vaut `null` (seuil normatif). */
  readonly n: number;
  /** `M(y)`, médiane de prix du groupe d'année, ou `null`. */
  readonly medianPriceEur: number | null;
  /** `100 × M(y) / M(y_max)`, arrondi à 1 décimale, ou `null` sous le seuil. */
  readonly index: number | null;
  /** `100 × (1 − M(y) / M(y+1))`, arrondi à 1 décimale, `null` si `y+1` manque ou est `null`. */
  readonly annualLossPct: number | null;
}

/**
 * L'indice complet. `baseYear` est `y_max` — le millésime le plus RÉCENT dont `n_price ≥ 12` — et
 * il est PUBLIÉ avec l'indice : « base 100 » sans base nommée admet autant de courbes que de
 * millésimes de référence. `null` si aucun groupe n'atteint le seuil. Aucune interpolation, aucune
 * extrapolation, aucun lissage.
 */
export interface DepreciationIndexResult {
  readonly baseYear: number | null;
  readonly entries: readonly DepreciationEntry[];
}

/* ================================================================================================
 * 5. Statistiques de cellule et R² — EX-DATA-86, EX-DATA-87, EX-DATA-93bis
 * ============================================================================================== */

/** Niveau de la cellule d'homogénéité retenue (EX-DATA-87). */
export type CellLevel = 'MODEL_YEAR' | 'MODEL' | 'SELECTION';

/**
 * Statistiques d'une cellule d'homogénéité (EX-DATA-86), publiées pour que l'écran nomme la base
 * de comparaison sans la recalculer. Le `R²` est celui de la PASSE 2 de M2 (EX-DATA-93bis),
 * calculé sur l'ensemble d'ajustement `F` COMPLET — jamais sur `F'` — en échelle `y = ln(p)` :
 * `R² = 1 − SCR/SCT`. Si `SCT = 0`, `rSquared` vaut `null` et le verdict de la cellule est
 * `INSUFFICIENT_SPREAD` (D8-09).
 */
export interface CellStat {
  readonly cellLevel: CellLevel;
  /** Clé entière de la cellule (encodage du moteur), pour joindre un verdict à sa cellule. */
  readonly cellKey: number;
  /** Libellé d'affichage de la cellule (EX-DATA-87). */
  readonly cellLabel: string;
  /** `n_price(C)`, HORS annonces `PRICE_IMPLAUSIBLE_IN_CELL` (EX-DATA-87). */
  readonly n: number;
  /** Médiane de prix de la cellule, ou `null`. */
  readonly median: number | null;
  /** Écart absolu médian (MAD, EX-DATA-89/92), ou `null` — jamais `0` par défaut. */
  readonly mad: number | null;
  /** `R²` de la passe 2, arrondi à 2 décimales, ou `null` (`SCT = 0`, ou M2 non applicable). */
  readonly rSquared: number | null;
  /** Vrai si `rSquared !== null && rSquared < 0,30` — l'avertissement affiché sous G8 (EX-SCR-164). */
  readonly rSquaredWarning: boolean;
  /** `|F|` de la régression M2, publié avec le libellé normatif de G8. */
  readonly fitCount: number;
  /** Annonces écartées de `V_price(C)` par `PRICE_IMPLAUSIBLE_IN_CELL` (EX-DATA-19(2)). */
  readonly implausibleInCellCount: number;
}

/* ================================================================================================
 * 6. Échantillon du nuage G4 — EX-DATA-99..103
 * ============================================================================================== */

/**
 * L'échantillon déterministe du nuage G4, calculé dans le worker et publié avec les compteurs
 * d'EX-DATA-103 — sans lesquels une nuée échantillonnée se lit comme l'effectif entier.
 * Miroir de `ScatterSampleResult` (`src/screens/distribution/scatter-sample.ts`), que D7 cesse de
 * calculer sur le thread principal une fois ce champ rempli (source unique, D8-07).
 */
export interface ScatterSampleSummary {
  /** Lignes tracées, triées par `listingId` croissant (ordre total EX-DATA-118). */
  readonly rows: Int32Array;
  /** Effectif éligible `n_e` (EX-DATA-99). */
  readonly eligibleCount: number;
  /** Points effectivement tracés. */
  readonly plottedCount: number;
  /** `|A|` — outliers éligibles. */
  readonly outlierCount: number;
  /** Outliers effectivement tracés. */
  readonly outlierPlottedCount: number;
  /** Vrai si un sous-tirage a été appliqué (`n_e > K`). */
  readonly sampled: boolean;
  /** Vrai si des outliers signalés n'ont PAS pu être tracés (`|A| ≥ K`, EX-DATA-103). */
  readonly outlierTruncated: boolean;
  /** Plafond `K` appliqué (EX-DATA-100). */
  readonly maxPoints: number;
}
