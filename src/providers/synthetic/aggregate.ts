/**
 * KYCAR — Agrégation interne du provider synthétique (mode 1, EX-DATA-111)
 * =================================================================================================
 * Agrégation CORRECTE (percentiles exacts, effectifs entiers) mais volontairement simple : le moteur
 * optimisé (balayage colonnaire, worker) est le lot D4, développé en parallèle. Ici, l'objectif est
 * un provider AUTONOME et TESTABLE — les agrégats se calculent directement sur les colonnes en
 * mémoire, SANS matérialiser la zone de chaînes (DR-049 : la baseline est sur le chemin critique du
 * premier affichage, les annonces individuelles n'y sont pas).
 *
 * `MetricRange` (min/max/p05/p50/p95/n) est calculé sur l'ÉCHANTILLON VALIDE d'EX-DATA-60 (DR-001) :
 * valeur connue (hors sentinelle `-1`) ET aucun drapeau d'ingestion qui la disqualifie —
 * `PRICE_SENTINEL_ABSOLUTE` / `PRICE_OUT_OF_RANGE` pour le prix (ARB-15 : l'annonce reste COMPTÉE
 * dans `listingCount`, elle sort seulement de `V_price`), `SUSPECT_ZERO_MILEAGE` /
 * `MILEAGE_OUT_OF_RANGE` pour le kilométrage. Les percentiles sont exacts par rang le plus proche
 * (EX-DATA-111 : métriques entières).
 *
 * Les échantillons sont accumulés dans des `Int32Array` de taille exacte (deux passes) puis triés
 * par le tri natif des tableaux typés : à 100 000 lignes, cela divise par deux le coût de la
 * baseline par rapport à des tableaux JS triés par comparateur.
 */

import type { MakeAggregate, MetricRange, ModelAggregate } from '../DataProvider';
import { MODEL_ID_UNRESOLVED, NUMERIC_UNKNOWN } from '../../types/sentinels';
import { INGEST_FLAG_BIT } from '../../types/vocabularies';
import type { MetricColumns } from './generate';

/** Masque des drapeaux qui excluent le PRIX de `V_price` (EX-DATA-60). */
const PRICE_INVALID_MASK =
  (1 << INGEST_FLAG_BIT.PRICE_SENTINEL_ABSOLUTE) | (1 << INGEST_FLAG_BIT.PRICE_OUT_OF_RANGE);
/** Masque des drapeaux qui excluent le KILOMÉTRAGE de `V_mileage` (EX-DATA-60). */
const MILEAGE_INVALID_MASK =
  (1 << INGEST_FLAG_BIT.SUSPECT_ZERO_MILEAGE) | (1 << INGEST_FLAG_BIT.MILEAGE_OUT_OF_RANGE);

/** Percentile par rang le plus proche sur un tableau trié croissant non vide (p dans [0, 1]). */
function nearestRank(sorted: Int32Array, n: number, p: number): number {
  const idx = Math.min(n - 1, Math.max(0, Math.ceil(p * n) - 1));
  return sorted[idx] as number;
}

/** Construit un `MetricRange` à partir d'un échantillon DÉJÀ trié de `n` valeurs valides. */
function rangeOfSorted(sorted: Int32Array, n: number): MetricRange {
  if (n === 0) return { min: null, max: null, p05: null, p50: null, p95: null, n: 0 };
  return {
    min: sorted[0] as number,
    max: sorted[n - 1] as number,
    p05: nearestRank(sorted, n, 0.05),
    p50: nearestRank(sorted, n, 0.5),
    p95: nearestRank(sorted, n, 0.95),
    n,
  };
}

/** Construit un `MetricRange` à partir de valeurs connues (déjà extraites, sentinelles exclues). */
export function metricRange(values: number[]): MetricRange {
  const n = values.length;
  if (n === 0) return { min: null, max: null, p05: null, p50: null, p95: null, n: 0 };
  const sorted = Int32Array.from(values);
  sorted.sort();
  return rangeOfSorted(sorted, n);
}

/** Vrai si le PRIX de la ligne appartient à l'échantillon valide (EX-DATA-60). */
function priceValid(batch: MetricColumns, i: number): boolean {
  return (
    (batch.priceEur[i] as number) !== NUMERIC_UNKNOWN &&
    ((batch.ingestFlags[i] as number) & PRICE_INVALID_MASK) === 0
  );
}

/** Vrai si le KILOMÉTRAGE de la ligne appartient à l'échantillon valide (EX-DATA-60). */
function mileageValid(batch: MetricColumns, i: number): boolean {
  return (
    (batch.mileageKm[i] as number) !== NUMERIC_UNKNOWN &&
    ((batch.ingestFlags[i] as number) & MILEAGE_INVALID_MASK) === 0
  );
}

/** Un groupe en cours d'accumulation : effectif total et trois échantillons métriques. */
interface Group {
  listingCount: number;
  nPrice: number;
  nMileage: number;
  nYear: number;
  price: Int32Array;
  mileage: Int32Array;
  year: Int32Array;
}

/** Itère les indices de lignes d'une sélection (`null` = toutes les lignes du lot). */
function forEachRow(rowCount: number, rowIndices: Iterable<number> | null, visit: (i: number) => void): void {
  if (rowIndices === null) {
    for (let i = 0; i < rowCount; i += 1) visit(i);
    return;
  }
  for (const i of rowIndices) visit(i);
}

/**
 * Accumule les groupes en DEUX passes : la première compte (effectif total et effectif de chaque
 * métrique valide), la seconde remplit des `Int32Array` de taille exacte.
 * @param keyOf clé de groupe d'une ligne, ou `-1` pour l'écarter.
 */
function accumulate(
  batch: MetricColumns,
  rowIndices: Iterable<number> | null,
  keyOf: (i: number) => number,
): Map<number, Group> {
  const groups = new Map<number, Group>();
  const counts = new Map<number, [number, number, number, number]>();
  forEachRow(batch.rowCount, rowIndices, (i) => {
    const key = keyOf(i);
    if (key < 0) return;
    let c = counts.get(key);
    if (c === undefined) {
      c = [0, 0, 0, 0];
      counts.set(key, c);
    }
    c[0] += 1;
    if (priceValid(batch, i)) c[1] += 1;
    if (mileageValid(batch, i)) c[2] += 1;
    if ((batch.modelYear[i] as number) !== NUMERIC_UNKNOWN) c[3] += 1;
  });
  for (const [key, c] of counts) {
    groups.set(key, {
      listingCount: c[0],
      nPrice: 0,
      nMileage: 0,
      nYear: 0,
      price: new Int32Array(c[1]),
      mileage: new Int32Array(c[2]),
      year: new Int32Array(c[3]),
    });
  }
  forEachRow(batch.rowCount, rowIndices, (i) => {
    const key = keyOf(i);
    if (key < 0) return;
    const g = groups.get(key) as Group;
    if (priceValid(batch, i)) {
      g.price[g.nPrice] = batch.priceEur[i] as number;
      g.nPrice += 1;
    }
    if (mileageValid(batch, i)) {
      g.mileage[g.nMileage] = batch.mileageKm[i] as number;
      g.nMileage += 1;
    }
    const y = batch.modelYear[i] as number;
    if (y !== NUMERIC_UNKNOWN) {
      g.year[g.nYear] = y;
      g.nYear += 1;
    }
  });
  return groups;
}

/** Fige les trois échantillons d'un groupe en `MetricRange` (tri natif des tableaux typés). */
function rangesOf(g: Group): { price: MetricRange; mileage: MetricRange; year: MetricRange } {
  g.price.sort();
  g.mileage.sort();
  g.year.sort();
  return {
    price: rangeOfSorted(g.price, g.nPrice),
    mileage: rangeOfSorted(g.mileage, g.nMileage),
    year: rangeOfSorted(g.year, g.nYear),
  };
}

/**
 * Accumulation DENSE des groupes de marque sur tout le lot : les identifiants de marque sont des
 * entiers bornés, quatre `Int32Array` indexés par `makeId` remplacent donc deux recherches de `Map`
 * par ligne et par passe. Réservé au chemin de la BASELINE (`rowIndices === null`), le seul qui soit
 * sur le chemin critique du premier affichage (DR-049).
 */
function accumulateByMakeDense(batch: MetricColumns): Map<number, Group> {
  const makeCol = batch.makeId;
  let maxMakeId = 0;
  for (let i = 0; i < batch.rowCount; i += 1) {
    const m = makeCol[i] as number;
    if (m > maxMakeId) maxMakeId = m;
  }
  const size = maxMakeId + 1;
  const total = new Int32Array(size);
  const nPrice = new Int32Array(size);
  const nMileage = new Int32Array(size);
  const nYear = new Int32Array(size);
  for (let i = 0; i < batch.rowCount; i += 1) {
    const m = makeCol[i] as number;
    total[m] = (total[m] as number) + 1;
    if (priceValid(batch, i)) nPrice[m] = (nPrice[m] as number) + 1;
    if (mileageValid(batch, i)) nMileage[m] = (nMileage[m] as number) + 1;
    if ((batch.modelYear[i] as number) !== NUMERIC_UNKNOWN) nYear[m] = (nYear[m] as number) + 1;
  }
  const groups = new Map<number, Group>();
  const byMake: (Group | undefined)[] = new Array(size);
  for (let m = 0; m < size; m += 1) {
    if ((total[m] as number) === 0) continue;
    const g: Group = {
      listingCount: total[m] as number,
      nPrice: 0,
      nMileage: 0,
      nYear: 0,
      price: new Int32Array(nPrice[m] as number),
      mileage: new Int32Array(nMileage[m] as number),
      year: new Int32Array(nYear[m] as number),
    };
    byMake[m] = g;
    groups.set(m, g);
  }
  for (let i = 0; i < batch.rowCount; i += 1) {
    const g = byMake[makeCol[i] as number] as Group;
    if (priceValid(batch, i)) {
      g.price[g.nPrice] = batch.priceEur[i] as number;
      g.nPrice += 1;
    }
    if (mileageValid(batch, i)) {
      g.mileage[g.nMileage] = batch.mileageKm[i] as number;
      g.nMileage += 1;
    }
    const y = batch.modelYear[i] as number;
    if (y !== NUMERIC_UNKNOWN) {
      g.year[g.nYear] = y;
      g.nYear += 1;
    }
  }
  return groups;
}

/**
 * `EX-DATA-68` / `EX-DATA-71` (D8-10, FV-02) — modèles DISTINCTS de chaque marque PRÉSENTS dans la
 * sélection, jamais les modèles du référentiel, la clé réservée `modelId = 0` (« Modèle non
 * identifié », `EX-DATA-72`) exclue par la formule elle-même (`modelId ≠ INCONNU`).
 *
 * Réalisation DENSE, parce que ce calcul est sur le chemin critique du premier affichage (DR-049,
 * budget d'`R-D3-02`) : un `Int32Array` indexé par `modelId` mémorise la marque de la PREMIÈRE
 * occurrence de chaque modèle, et la boucle chaude ne fait qu'une lecture et une écriture de
 * tableau typé par ligne — deux fois moins cher qu'un `Set` de clés composites (mesuré : ≈ 8 ms
 * contre ≈ 4 ms à 100 000 lignes) et sans allocation par couple distinct.
 *
 * Un `modelId` est unique dans TOUTE la taxonomie (`data/reference/taxonomy.json` : 4 955 modèles,
 * 4 955 identifiants distincts) — l'index dense est donc exact. Cette propriété n'est pas SUPPOSÉE :
 * si un même `modelId` apparaissait sous deux marques, le couple surnuméraire serait compté à part
 * dans `extraPairs`, et le résultat resterait la définition d'`EX-DATA-68`.
 */
function distinctModelCountByMake(
  batch: MetricColumns,
  rowIndices: Iterable<number> | null,
): Map<number, number> {
  const makeCol = batch.makeId;
  const modelCol = batch.modelId;
  let maxModelId = 0;
  forEachRow(batch.rowCount, rowIndices, (i) => {
    const modelId = modelCol[i] as number;
    if (modelId > maxModelId) maxModelId = modelId;
  });
  const firstMakeOf = new Int32Array(maxModelId + 1).fill(-1);
  const counts = new Map<number, number>();
  const extraPairs = new Set<number>();
  forEachRow(batch.rowCount, rowIndices, (i) => {
    const modelId = modelCol[i] as number;
    if (modelId === MODEL_ID_UNRESOLVED) return;
    const makeId = makeCol[i] as number;
    const known = firstMakeOf[modelId] as number;
    if (known === makeId) return;
    if (known === -1) {
      firstMakeOf[modelId] = makeId;
      counts.set(makeId, (counts.get(makeId) ?? 0) + 1);
      return;
    }
    // Cas hors taxonomie courante : le même modèle sous deux marques. Compté une fois par couple.
    const key = makeId * 1_000_000 + modelId;
    if (extraPairs.has(key)) return;
    extraPairs.add(key);
    counts.set(makeId, (counts.get(makeId) ?? 0) + 1);
  });
  return counts;
}

/** Agrégats par marque sur un ensemble de lignes (`null` = tout le lot). `coverage` = 1 si sélection vide. */
export function aggregateByMake(
  batch: MetricColumns,
  rowIndices: Iterable<number> | null,
  coverage: number | null,
): MakeAggregate[] {
  const makeCol = batch.makeId;
  const groups =
    rowIndices === null
      ? accumulateByMakeDense(batch)
      : accumulate(batch, rowIndices, (i) => makeCol[i] as number);
  const modelCounts = distinctModelCountByMake(batch, rowIndices);
  const rows: MakeAggregate[] = [];
  for (const [makeId, g] of groups) {
    rows.push({
      makeId,
      listingCount: g.listingCount,
      ...rangesOf(g),
      sampleCoverage: coverage,
      // D8-10 / FV-02 : une marque dont toutes les annonces sont à `modelId = 0` porte bien `0`
      // modèle distinct — c'est un fait mesuré, pas la valeur par défaut que FV-02 dénonçait.
      modelCount: modelCounts.get(makeId) ?? 0,
    });
  }
  rows.sort((a, b) => b.listingCount - a.listingCount || a.makeId - b.makeId);
  return rows;
}

/**
 * Agrégats par couple marque/modèle. Si `makeScope` est fourni, restreint aux modèles de cette marque
 * (zones-modèles d'une carte, EX-DATA §B.4).
 */
export function aggregateByModel(
  batch: MetricColumns,
  rowIndices: Iterable<number> | null,
  coverage: number | null,
  makeScope?: number,
): ModelAggregate[] {
  const makeCol = batch.makeId;
  const modelCol = batch.modelId;
  // Clé composite entière : `makeId × 1 000 000 + modelId` (identifiants < 10^6, taxonomie réelle).
  const groups = accumulate(batch, rowIndices, (i) => {
    const makeId = makeCol[i] as number;
    if (makeScope !== undefined && makeId !== makeScope) return -1;
    return makeId * 1_000_000 + (modelCol[i] as number);
  });
  const rows: ModelAggregate[] = [];
  for (const [key, g] of groups) {
    rows.push({
      makeId: Math.floor(key / 1_000_000),
      modelId: key % 1_000_000,
      listingCount: g.listingCount,
      ...rangesOf(g),
      sampleCoverage: coverage,
    });
  }
  rows.sort((a, b) => b.listingCount - a.listingCount || a.makeId - b.makeId || a.modelId - b.modelId);
  return rows;
}
