/**
 * KYCAR — GROUPSTAT, NTILE, paliers de puissance et indice de dépréciation (D8-07, dette D-17 levée)
 * =================================================================================================
 * `EX-DATA-83bis` (GROUPSTAT), `EX-DATA-83ter` (NTILE), `EX-DATA-83quater` (paliers de puissance) et
 * `EX-DATA-83quinquies` (indice de dépréciation) sont la **source unique** des graphes `G5`, `G6`,
 * `G9`, `G10`, `G12`, `G13`, `G14`, `G15` et de l'infobulle d'`EX-SCR-149`. La dette **D-17** les
 * laissait au thread principal (`src/screens/distribution/group-stat.ts`) ; **D8-07** les ramène
 * DANS LE WORKER et les publie par `RecalcResult` (types figés par l'étape 0,
 * `./stats-protocol.ts`).
 *
 * Trois points de lecture de l'annexe A, tranchés ici et énoncés une fois pour toutes :
 *
 * 1. **Clé `yearBucket` = millésime civil.** `EX-DATA-83bis` nomme comme clé « le bucket d'année
 *    produit par `BIN` (`EX-DATA-77`, ligne Année) ». Cette ligne pose `W = {1}` et `O = 0` : la
 *    largeur de bin vaut 1 an et l'indice de bin d'une année `y` vaut donc EXACTEMENT `y` sur tout
 *    bin fermé. Le moteur clé donc sur le millésime civil. C'est la seule lecture compatible avec
 *    `EX-DATA-83quinquies`, qui parle de `M(y)` et de `M(y+1)` — un bin de DÉBORDEMENT (`kLo−1` /
 *    `kHi+1`) agrège les queues à 1 % et n'est pas un millésime : y verser des annonces ferait
 *    porter à `depreciationIndex` une valeur d'année fausse.
 * 2. **Métrique publiée : `price`.** `GROUPSTAT(Σ, g, m)` est défini pour les trois métriques ; les
 *    neuf graphes qui en dépendent lisent tous la métrique PRIX. Le moteur publie donc un
 *    `GroupStatSet` de métrique `price` par clé admise, et non 27 ensembles dont 18 sans lecteur
 *    (le coût est du temps de recalcul sous budget `EX-NFR-5`).
 * 3. **`label`.** Le worker ne reçoit ni `ReferenceData` ni vocabulaires (`LOAD_DATASET` ne porte
 *    que le lot colonnaire et la taxonomie des modèles) : il ne peut pas décoder `fuelCategory = 3`
 *    en « Diesel ». Le moteur publie donc, pour les six clés ÉNUMÉRÉES, le code entier sous forme
 *    décimale, et le libellé complet pour les trois clés qu'il sait former seul (millésime, tranche
 *    de rang, palier de puissance). L'écran substitue le libellé FR du vocabulaire au rendu —
 *    l'ordre publié, lui, est déjà total (`listingCount` décroissant, puis libellé `EX-DATA-70bis`,
 *    puis code croissant), donc stable quelle que soit la substitution.
 *
 * `V_price` employé ici est celui d'`EX-DATA-60` PLUS la sentinelle relative de la cellule `C₃ = Σ`
 * (`EX-DATA-19(2)`), c'est-à-dire exactement l'échantillon de `src/engine/aggregate.ts` : sans quoi
 * la somme des `n` des groupes ne vaudrait pas `n_price(Σ)` et l'écran afficherait deux effectifs
 * différents pour la même sélection.
 *
 * Module PUR : importable par le worker comme par le thread principal.
 */

import type { ListingColumnBatch } from '../types/index';
import { ENUM_UNKNOWN_BYTE, NUMERIC_UNKNOWN } from '../types/index';
import { isMileageValid, isPriceValid, isYearValid, yearFromYearMonth } from './flags';
import { quantileFromSorted } from './quantiles';
import { compareListingId } from './uuid';
import type {
  DepreciationEntry,
  DepreciationIndexResult,
  GroupStatEntry,
  GroupStatKey,
  GroupStatSet,
  NtileResult,
  NtileSlice,
  PowerTierEntry,
  PowerTierResult,
} from './stats-protocol';

/* ================================================================================================
 * Constantes normatives
 * ============================================================================================== */

/** `k` de `NTILE(V_mileage(Σ), 5)` — les tranches de rang de `G10` (EX-DATA-83ter). */
export const MILEAGE_NTILE_K = 5;
/** Largeur fixe d'un palier de puissance, en kW (EX-DATA-83quater). */
export const POWER_TIER_WIDTH_KW = 20;
/** Seuil d'effectif sous lequel l'indice de dépréciation d'un millésime vaut `null` (EX-DATA-83quinquies). */
export const DEPRECIATION_MIN_N = 12;

/** Les neuf clés admises par `EX-DATA-83bis`, dans l'ordre de publication des ensembles. */
export const GROUP_STAT_KEYS: readonly GroupStatKey[] = [
  'fuelCategory',
  'priceEvaluationCategory',
  'sellerType',
  'countryCode',
  'bodyType',
  'transmission',
  'yearBucket',
  'mileageNtile',
  'powerTier',
];

/** Les six clés portées par une colonne énumérée d'un octet (INCONNU = `ENUM_UNKNOWN_BYTE`). */
const ENUM_KEY_COLUMN: Readonly<Record<string, keyof ListingColumnBatch>> = {
  fuelCategory: 'fuelCategory',
  priceEvaluationCategory: 'priceEvaluationCategory',
  sellerType: 'sellerType',
  countryCode: 'countryCode',
  bodyType: 'bodyType',
  transmission: 'transmission',
};

/**
 * `EX-DATA-70bis` — comparaison de libellés, règle unique : NFD, retrait des diacritiques combinants
 * `U+0300`–`U+036F`, `toUpperCase()` SANS argument de locale, NFC, puis comparaison point de code par
 * point de code. `Intl.Collator` est proscrit sur ce chemin.
 *
 * Le moteur porte sa PROPRE copie de la règle (l'autre est `src/screens/market/sort.ts`, côté
 * rendu) : un module du worker ne peut pas dépendre d'un module d'écran sans inverser la
 * dépendance de l'architecture §1.3. Les deux implémentations sont contrôlées identiques par test.
 */
export function compareGroupLabels(a: string, b: string): number {
  const normalize = (s: string): string =>
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toUpperCase()
      .normalize('NFC');
  const na = normalize(a);
  const nb = normalize(b);
  if (na < nb) return -1;
  if (na > nb) return 1;
  return 0;
}

/** Arrondi `round-half-away-from-zero` à `digits` décimales (EX-DATA-6). Jamais bancaire. */
export function roundHalfAway(value: number, digits: number): number {
  const f = Math.pow(10, digits);
  const scaled = value * f;
  return (scaled < 0 ? -Math.round(-scaled) : Math.round(scaled)) / f;
}

/** Libellé normatif d'un palier de puissance : `<20·k> – <20·(k+1) − 1> kW` (EX-DATA-83quater). */
export function powerTierLabel(tier: number): string {
  return `${tier * POWER_TIER_WIDTH_KW} – ${(tier + 1) * POWER_TIER_WIDTH_KW - 1} kW`;
}

/* ================================================================================================
 * Échantillon de travail : une seule lecture du lot colonnaire
 * ============================================================================================== */

/**
 * Vue par ligne de la sélection, construite en UN passage et partagée par les quatre calculs. Les
 * quatre tableaux sont indexés par POSITION dans `rows` (et non par numéro de ligne) : ils sont
 * denses, donc l'accès est direct et sans table de hachage sur le chemin chaud.
 */
interface SelectionView {
  readonly rows: Int32Array;
  /** Prix retenu dans `V_price(Σ)` (EX-DATA-60 + sentinelle relative), ou `null`. */
  readonly price: Float64Array;
  readonly priceValid: Uint8Array;
  /** Millésime civil, ou `NUMERIC_UNKNOWN`. */
  readonly year: Int32Array;
  /** Kilométrage valide (EX-DATA-60), ou `NUMERIC_UNKNOWN`. */
  readonly mileage: Int32Array;
  /** Puissance en kW si connue et strictement positive, sinon `NUMERIC_UNKNOWN`. */
  readonly powerKw: Int32Array;
}

function buildView(
  batch: ListingColumnBatch,
  rows: Int32Array,
  implausibleThreshold: number | null,
): SelectionView {
  const n = rows.length;
  const price = new Float64Array(n);
  const priceValid = new Uint8Array(n);
  const year = new Int32Array(n);
  const mileage = new Int32Array(n);
  const powerKw = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    const row = rows[i] as number;
    const ingest = batch.ingestFlags[row] as number;
    const p = batch.priceEur[row] as number;
    if (
      isPriceValid(p, batch.priceStatus[row] as number, ingest) &&
      !(implausibleThreshold !== null && p < implausibleThreshold)
    ) {
      price[i] = p;
      priceValid[i] = 1;
    }
    const ym = batch.firstRegistrationYearMonth[row] as number;
    year[i] = isYearValid(ym) ? yearFromYearMonth(ym) : NUMERIC_UNKNOWN;
    const km = batch.mileageKm[row] as number;
    mileage[i] = isMileageValid(km, ingest) ? km : NUMERIC_UNKNOWN;
    const kw = batch.powerKw[row] as number;
    // `powerKw = 0` est INCONNU au même titre que la sentinelle : une voiture de 0 kW n'existe pas,
    // et l'ingestion a déjà rendu `null` pour cette valeur (patho VAL-PUISSANCE-0).
    powerKw[i] = kw > 0 && kw !== NUMERIC_UNKNOWN ? kw : NUMERIC_UNKNOWN;
  }
  return { rows, price, priceValid, year, mileage, powerKw };
}

/* ================================================================================================
 * 1. NTILE — EX-DATA-83ter
 * ============================================================================================== */

/**
 * `NTILE(V, k)` sur les positions valides d'une métrique, tranches de RANG (jamais de quantile).
 * La tranche `t ∈ [1, k]` contient les rangs `i` tels que `⌈(t−1)·n/k⌉ < i ≤ ⌈t·n/k⌉` ; un ex æquo à
 * une frontière reste donc dans la tranche de rang le plus BAS. Le tri est fait par valeur
 * croissante puis par `listingId` croissant (`EX-DATA-82` : deux permutations du même multiensemble
 * produisent la même partition octet à octet). `n < k` ⇒ `n` tranches d'un élément, `status`
 * `DEGRADED`.
 *
 * @returns le découpage publié ET, par POSITION dans `rows`, le rang de tranche (`0` = hors
 *   échantillon), qui sert de clé de groupe `mileageNtile` à `GROUPSTAT`.
 */
function computeNtile(
  view: SelectionView,
  listingId: Uint8Array,
  values: Int32Array,
  metric: 'price' | 'year' | 'mileage',
  k: number,
): { readonly result: NtileResult; readonly rankByPosition: Int32Array } {
  const positions: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if ((values[i] as number) !== NUMERIC_UNKNOWN) positions.push(i);
  }
  positions.sort((a, b) => {
    const d = (values[a] as number) - (values[b] as number);
    if (d !== 0) return d;
    return compareListingId(listingId, view.rows[a] as number, view.rows[b] as number);
  });

  const n = positions.length;
  const rankByPosition = new Int32Array(values.length);
  const slices: NtileSlice[] = [];

  if (n === 0) {
    return { result: { metric, k, status: 'DEGRADED', slices: [] }, rankByPosition };
  }
  if (n < k) {
    // EX-DATA-83ter : « si n < k, NTILE produit n tranches d'un élément et publie status DEGRADED ».
    for (let t = 0; t < n; t++) {
      const pos = positions[t] as number;
      rankByPosition[pos] = t + 1;
      const v = values[pos] as number;
      slices.push({ rank: t + 1, loObserved: v, hiObserved: v, count: 1 });
    }
    return { result: { metric, k, status: 'DEGRADED', slices }, rankByPosition };
  }

  // Frontières EXACTES en arithmétique entière : ⌈a/b⌉ = ⌊(a + b − 1)/b⌋, sans flottant.
  const ceilDiv = (a: number, b: number): number => Math.floor((a + b - 1) / b);
  for (let t = 1; t <= k; t++) {
    const start = ceilDiv((t - 1) * n, k);
    const end = ceilDiv(t * n, k);
    for (let j = start; j < end; j++) rankByPosition[positions[j] as number] = t;
    slices.push({
      rank: t,
      loObserved: values[positions[start] as number] as number,
      hiObserved: values[positions[end - 1] as number] as number,
      count: end - start,
    });
  }
  return { result: { metric, k, status: 'OK', slices }, rankByPosition };
}

/* ================================================================================================
 * 2. GROUPSTAT — EX-DATA-83bis
 * ============================================================================================== */

/** Accumulateur d'un groupe : effectif total du groupe et prix retenus dans `V_price`. */
interface Bucket {
  listingCount: number;
  readonly prices: number[];
}

/** Bloc publié d'un groupe : `n`, couverture métrique, médiane, `P5`, `P95`, `IQR`. */
function entryOf(key: number, label: string, bucket: Bucket): GroupStatEntry {
  const n = bucket.prices.length;
  const listingCount = bucket.listingCount;
  if (n === 0) {
    return {
      key,
      label,
      listingCount,
      n: 0,
      coverage: listingCount > 0 ? 0 : null,
      median: null,
      p05: null,
      p95: null,
      iqr: null,
    };
  }
  const sorted = Float64Array.from(bucket.prices).sort();
  const p25 = quantileFromSorted(sorted, 0.25);
  const p75 = quantileFromSorted(sorted, 0.75);
  return {
    key,
    label,
    listingCount,
    n,
    // EX-DATA-61 : couverture MÉTRIQUE `n_m(G_v) / listingCount(G_v)` — ni `sampleCoverage`, ni
    // `priceQuotedShare` (EX-DATA-61bis interdit le mot « couverture » employé nu).
    coverage: listingCount > 0 ? n / listingCount : null,
    median: quantileFromSorted(sorted, 0.5),
    p05: quantileFromSorted(sorted, 0.05),
    p95: quantileFromSorted(sorted, 0.95),
    iqr: p75 - p25,
  };
}

/**
 * Ordre total d'`EX-DATA-83bis` (`ARB-25`) : `listingCount` DÉCROISSANT, puis libellé croissant
 * selon `EX-DATA-70bis`, puis code de clé croissant.
 */
function sortGroups(groups: GroupStatEntry[]): GroupStatEntry[] {
  return groups.sort((a, b) => {
    if (a.listingCount !== b.listingCount) return b.listingCount - a.listingCount;
    const byLabel = compareGroupLabels(a.label, b.label);
    if (byLabel !== 0) return byLabel;
    return a.key - b.key;
  });
}

/** Assemble un `GroupStatSet` à partir d'une clé par position et d'un fabricant de libellé. */
function groupSetOf(
  key: GroupStatKey,
  view: SelectionView,
  keyOfPosition: (i: number) => number,
  labelOf: (code: number) => string,
): GroupStatSet {
  const buckets = new Map<number, Bucket>();
  let unknownKeyCount = 0;
  for (let i = 0; i < view.rows.length; i++) {
    const code = keyOfPosition(i);
    // ARB-36 : `INCONNU` n'est JAMAIS une valeur de clé de groupe — ces annonces ne forment pas de
    // groupe et sont comptées à côté.
    if (code === NUMERIC_UNKNOWN) {
      unknownKeyCount++;
      continue;
    }
    let bucket = buckets.get(code);
    if (bucket === undefined) {
      bucket = { listingCount: 0, prices: [] };
      buckets.set(code, bucket);
    }
    bucket.listingCount++;
    if ((view.priceValid[i] as number) === 1) bucket.prices.push(view.price[i] as number);
  }
  const groups: GroupStatEntry[] = [];
  for (const [code, bucket] of buckets) groups.push(entryOf(code, labelOf(code), bucket));
  return { key, metric: 'price', groups: sortGroups(groups), unknownKeyCount };
}

/* ================================================================================================
 * 3. Paliers de puissance — EX-DATA-83quater
 * ============================================================================================== */

/**
 * Paliers `⌊powerKw / 20⌋`, largeur fixe 20 kW, borne haute EXCLUSIVE. Les paliers vides INTÉRIEURS
 * sont conservés (même principe qu'`EX-DATA-78`), aucun palier n'est émis au-delà de celui de la
 * valeur maximale observée — ni, symétriquement, en deçà du minimum observé, un palier vide
 * EXTÉRIEUR n'étant pas plus publiable qu'un bin de débordement vide (`EX-DATA-79`).
 */
function computePowerTiers(view: SelectionView): PowerTierResult {
  const buckets = new Map<number, Bucket>();
  let unknownKeyCount = 0;
  let minTier = Number.POSITIVE_INFINITY;
  let maxTier = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < view.rows.length; i++) {
    const kw = view.powerKw[i] as number;
    if (kw === NUMERIC_UNKNOWN) {
      unknownKeyCount++;
      continue;
    }
    const tier = Math.floor(kw / POWER_TIER_WIDTH_KW);
    if (tier < minTier) minTier = tier;
    if (tier > maxTier) maxTier = tier;
    let bucket = buckets.get(tier);
    if (bucket === undefined) {
      bucket = { listingCount: 0, prices: [] };
      buckets.set(tier, bucket);
    }
    bucket.listingCount++;
    if ((view.priceValid[i] as number) === 1) bucket.prices.push(view.price[i] as number);
  }
  const tiers: PowerTierEntry[] = [];
  if (buckets.size > 0) {
    for (let tier = minTier; tier <= maxTier; tier++) {
      const bucket = buckets.get(tier) ?? { listingCount: 0, prices: [] };
      const stat = entryOf(tier, powerTierLabel(tier), bucket);
      tiers.push({
        tier,
        lowerKw: tier * POWER_TIER_WIDTH_KW,
        upperKw: (tier + 1) * POWER_TIER_WIDTH_KW,
        label: stat.label,
        listingCount: stat.listingCount,
        n: stat.n,
        median: stat.median,
      });
    }
  }
  return { tiers, unknownKeyCount };
}

/* ================================================================================================
 * 4. Indice de dépréciation — EX-DATA-83quinquies
 * ============================================================================================== */

/**
 * `depreciationIndex(y) = 100 × M(y) / M(y_max)` sur les groupes d'année de
 * `GROUPSTAT(Σ, bucket d'année, price)` dont `n_price ≥ 12`, `y_max` étant le millésime le plus
 * RÉCENT au-dessus du seuil ; `annualLossPct(y) = 100 × (1 − M(y) / M(y+1))`. Les deux sont arrondis
 * à 1 décimale (`EX-DATA-6`, demi vers l'infini) et valent `null` sous le seuil, ou si `y+1` manque.
 * `baseYear` est PUBLIÉE avec l'indice. Aucune interpolation, aucune extrapolation, aucun lissage.
 *
 * Les millésimes SOUS le seuil restent publiés (avec leur `n` et leur médiane, index `null`) : les
 * retirer ferait disparaître une année du graphe sans que rien ne le dise.
 */
export function computeDepreciationIndex(yearGroups: GroupStatSet): DepreciationIndexResult {
  const byYear = new Map<number, GroupStatEntry>();
  for (const g of yearGroups.groups) byYear.set(g.key, g);
  const years = [...byYear.keys()].sort((a, b) => a - b);

  let baseYear: number | null = null;
  for (const y of years) {
    const g = byYear.get(y) as GroupStatEntry;
    if (g.n >= DEPRECIATION_MIN_N && g.median !== null) baseYear = y;
  }
  const baseMedian = baseYear === null ? null : ((byYear.get(baseYear) as GroupStatEntry).median as number);

  const medianAbove = (y: number): number | null => {
    const g = byYear.get(y);
    if (g === undefined || g.n < DEPRECIATION_MIN_N) return null;
    return g.median;
  };

  const entries: DepreciationEntry[] = years.map((y) => {
    const g = byYear.get(y) as GroupStatEntry;
    const m = medianAbove(y);
    const next = medianAbove(y + 1);
    return {
      year: y,
      n: g.n,
      medianPriceEur: g.median,
      index: m === null || baseMedian === null || baseMedian === 0 ? null : roundHalfAway((100 * m) / baseMedian, 1),
      annualLossPct: m === null || next === null || next === 0 ? null : roundHalfAway(100 * (1 - m / next), 1),
    };
  });

  return { baseYear, entries };
}

/* ================================================================================================
 * Point d'entrée
 * ============================================================================================== */

/** Sortie complète des quatre calculs d'agrégats par groupe (D8-07). */
export interface GroupStatsOutput {
  readonly groupStats: readonly GroupStatSet[];
  readonly ntiles: NtileResult;
  readonly powerTiers: PowerTierResult;
  readonly depreciationIndex: DepreciationIndexResult;
}

/**
 * Calcule `GROUPSTAT` sur les neuf clés admises, `NTILE(V_mileage(Σ), 5)`, les paliers de puissance
 * et l'indice de dépréciation, en une seule lecture du lot colonnaire.
 *
 * @param implausibleThreshold seuil relatif de la cellule `C₃ = Σ` (`EX-DATA-19(2)`), ou `null`. Le
 *   noyau le fournit — c'est le MÊME que celui d'`aggregate`, sans quoi `Σ_v n(G_v) ≠ n_price(Σ)`.
 */
export function computeGroupStats(
  batch: ListingColumnBatch,
  rows: Int32Array,
  implausibleThreshold: number | null,
): GroupStatsOutput {
  const view = buildView(batch, rows, implausibleThreshold);

  const { result: ntiles, rankByPosition } = computeNtile(
    view,
    batch.listingId,
    view.mileage,
    'mileage',
    MILEAGE_NTILE_K,
  );
  const powerTiers = computePowerTiers(view);

  const sets: GroupStatSet[] = [];
  for (const key of GROUP_STAT_KEYS) {
    if (key === 'yearBucket') {
      sets.push(groupSetOf(key, view, (i) => view.year[i] as number, (code) => String(code)));
    } else if (key === 'mileageNtile') {
      sets.push(
        groupSetOf(
          key,
          view,
          (i) => {
            const rank = rankByPosition[i] as number;
            return rank === 0 ? NUMERIC_UNKNOWN : rank;
          },
          (code) => `Tranche ${code}`,
        ),
      );
    } else if (key === 'powerTier') {
      sets.push(
        groupSetOf(
          key,
          view,
          (i) => {
            const kw = view.powerKw[i] as number;
            return kw === NUMERIC_UNKNOWN ? NUMERIC_UNKNOWN : Math.floor(kw / POWER_TIER_WIDTH_KW);
          },
          (code) => powerTierLabel(code),
        ),
      );
    } else {
      const column = batch[ENUM_KEY_COLUMN[key] as 'fuelCategory'] as Uint8Array;
      sets.push(
        groupSetOf(
          key,
          view,
          (i) => {
            const code = column[view.rows[i] as number] as number;
            return code === ENUM_UNKNOWN_BYTE ? NUMERIC_UNKNOWN : code;
          },
          (code) => String(code),
        ),
      );
    }
  }

  const yearSet = sets.find((s) => s.key === 'yearBucket') as GroupStatSet;
  return { groupStats: sets, ntiles, powerTiers, depreciationIndex: computeDepreciationIndex(yearSet) };
}
