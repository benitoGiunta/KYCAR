/**
 * KYCAR — Agrégation interne du provider synthétique (mode 1, EX-DATA-111)
 * =================================================================================================
 * Agrégation CORRECTE (quantiles exacts, effectifs entiers) mais volontairement simple : le moteur
 * optimisé (balayage colonnaire, worker) est le lot D4, développé en parallèle. Ici, l'objectif est
 * un provider AUTONOME et TESTABLE — les agrégats se calculent directement sur les colonnes en
 * mémoire, SANS matérialiser la zone de chaînes (DR-049 : la baseline est sur le chemin critique du
 * premier affichage, les annonces individuelles n'y sont pas).
 *
 * UNE SEULE DÉFINITION DANS LE PRODUIT (`DR3-20`, arbitrage `D3-37`, phase 3.5)
 * -------------------------------------------------------------------------------------------------
 * Ce module servait jusqu'ici des percentiles « au RANG LE PLUS PROCHE » `x_⌈p·n⌉`, un échantillon de
 * prix privé de la seule sentinelle ABSOLUE, et un axe année tiré de `modelYear`. Trois écarts avec
 * la définition normative, dont les six `baseline.json` commités portaient la trace (6 954/6 954
 * quantiles au rang le plus proche, 3 653 seulement conformes au type 7) :
 *
 *   1. `EX-DATA-62` — « définition unique et NON NÉGOCIABLE » : tout quantile de KYCAR est le
 *      **quantile de type 7** (interpolation linéaire entre statistiques d'ordre, convention R /
 *      NumPy), calculé en double précision et SANS arrondi intermédiaire (`EX-DATA-63`) — l'arrondi
 *      est de présentation, il appartient au rendu. `p05`/`p50`/`p95` ne sont donc plus des entiers.
 *   2. `EX-DATA-19(2)` — la sentinelle RELATIVE `PRICE_IMPLAUSIBLE_IN_CELL` (`prix <
 *      0,10 × médianeRéf(C)`, règle inapplicable sous 12 prix valides) exclut de `V_price` « au même
 *      titre » que la sentinelle absolue ; l'annonce reste COMPTÉE dans `listingCount` (ARB-15).
 *   3. `EX-DATA-25` — « l'axe année de TOUS les agrégats est `firstRegistrationYear`, jamais
 *      `modelYear` » : `modelYear` reste un attribut d'annonce et un filtre, il n'alimente aucun
 *      agrégat.
 *
 * Les trois points sont désormais servis par LE code du moteur (`src/engine/quantiles.ts`,
 * `src/engine/implausible.ts`, `src/engine/flags.ts`), importé et non recopié : deux implémentations
 * d'une définition « non négociable » sont exactement ce que `DR3-20` a coûté. La dépendance
 * `src/providers` → `src/engine` est ACYCLIQUE dans le graphe de production (ces trois modules du
 * moteur sont purs et ne dépendent que de `src/types` ; seul `src/engine/testkit.ts`, réservé aux
 * tests et absent de `src/engine/index.ts`, remonte vers `src/providers`).
 *
 * `MetricRange` (min/max/p05/p50/p95/n) est calculé sur l'ÉCHANTILLON VALIDE d'EX-DATA-60 (DR-001) :
 * valeur connue (hors sentinelle `-1`) ET aucun drapeau d'ingestion qui la disqualifie — statut
 * `QUOTED`, `PRICE_SENTINEL_ABSOLUTE` / `PRICE_OUT_OF_RANGE` écartés pour le prix (ARB-15 : l'annonce
 * reste COMPTÉE dans `listingCount`, elle sort seulement de `V_price`), `SUSPECT_ZERO_MILEAGE` /
 * `MILEAGE_OUT_OF_RANGE` pour le kilométrage.
 *
 * Les échantillons sont accumulés dans des `Int32Array` (deux passes : compter, puis remplir) puis
 * triés par le tri natif des tableaux typés : à 100 000 lignes, cela divise par deux le coût de la
 * baseline par rapport à des tableaux JS triés par comparateur. Le seuil relatif d'`EX-DATA-19(2)`
 * demande une passe PRÉALABLE sur les prix de la sélection (la médiane de référence de `C₃ = Σ`) —
 * la même que le noyau fait déjà (`selectionImplausibleThreshold`) ; la passe de comptage compte
 * alors un MAJORANT de `n_price` par groupe, et la passe de remplissage retient l'effectif exact.
 */

import type { MakeAggregate, MetricRange, ModelAggregate } from '../DataProvider';
import { MODEL_ID_UNRESOLVED } from '../../types/sentinels';
import {
  isMileageValid,
  isPriceValid,
  isYearValid,
  yearFromYearMonth,
} from '../../engine/flags';
import { implausibleInCellThreshold } from '../../engine/implausible';
import { quantileFromSorted } from '../../engine/quantiles';
import type { MetricColumns } from './generate';

/**
 * `MetricRange` d'un échantillon DÉJÀ TRIÉ croissant, de longueur exactement `n`.
 *
 * `p05`/`p50`/`p95` sont les quantiles de TYPE 7 (`EX-DATA-62`) du moteur — la MÊME fonction que
 * `exactMetricStats`, sur les mêmes statistiques d'ordre, donc les mêmes doubles au bit près. Non
 * arrondis (`EX-DATA-63`).
 */
function rangeOfSorted(sorted: Int32Array): MetricRange {
  const n = sorted.length;
  if (n === 0) return { min: null, max: null, p05: null, p50: null, p95: null, n: 0 };
  return {
    min: sorted[0] as number,
    max: sorted[n - 1] as number,
    p05: quantileFromSorted(sorted, 0.05),
    p50: quantileFromSorted(sorted, 0.5),
    p95: quantileFromSorted(sorted, 0.95),
    n,
  };
}

/** Construit un `MetricRange` à partir de valeurs connues (déjà extraites, sentinelles exclues). */
export function metricRange(values: number[]): MetricRange {
  const sorted = Int32Array.from(values);
  sorted.sort();
  return rangeOfSorted(sorted);
}

/**
 * Vrai si le PRIX de la ligne appartient à `V_price` au sens ABSOLU d'`EX-DATA-60` : statut
 * `QUOTED`, valeur connue, ni `PRICE_SENTINEL_ABSOLUTE` ni `PRICE_OUT_OF_RANGE`. Le seuil RELATIF
 * d'`EX-DATA-19(2)` s'applique APRÈS, sur cet ensemble-là (« privé des SEULES sentinelles absolues »).
 */
function priceValidAbsolute(batch: MetricColumns, i: number): boolean {
  return isPriceValid(
    batch.priceEur[i] as number,
    batch.priceStatus[i] as number,
    batch.ingestFlags[i] as number,
  );
}

/** Vrai si le KILOMÉTRAGE de la ligne appartient à l'échantillon valide (EX-DATA-60). */
function mileageValid(batch: MetricColumns, i: number): boolean {
  return isMileageValid(batch.mileageKm[i] as number, batch.ingestFlags[i] as number);
}

/** Année civile de PREMIÈRE IMMATRICULATION (EX-DATA-25), ou `null` si inconnue (EX-DATA-26). */
function yearOf(batch: MetricColumns, i: number): number | null {
  const ym = batch.firstRegistrationYearMonth[i] as number;
  return isYearValid(ym) ? yearFromYearMonth(ym) : null;
}

/**
 * Un groupe en cours d'accumulation : effectif total et trois échantillons métriques.
 *
 * `price` est alloué à la taille de l'échantillon ABSOLUMENT valide — un MAJORANT : la sentinelle
 * relative d'`EX-DATA-19(2)`, qui dépend d'une médiane de la sélection entière, n'est connue qu'après
 * la passe de comptage. `nPrice` porte l'effectif RÉELLEMENT retenu ; le `MetricRange` se lit donc
 * sur `price.subarray(0, nPrice)`, jamais sur le tableau entier.
 */
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
 * Seuil relatif `0,10 × médianeRéf(C₃ = Σ)` de la sélection (`EX-DATA-19(2)`), ou `null` quand la
 * règle ne s'applique pas (moins de 12 prix valides). `médianeRéf` est la médiane — de type 7, comme
 * tout quantile — de `V_price(Σ)` privé des SEULES sentinelles absolues ; la règle relative n'entre
 * jamais dans son propre calcul, et le passage est UNIQUE (aucune itération, aucun point fixe).
 *
 * Réplique EXACTE de `selectionImplausibleThreshold` du noyau, dont la signature exige un
 * `ListingColumnBatch` et un `Int32Array` de lignes que ce module n'a pas : le RATIO, le PLANCHER
 * d'effectif et la définition de la médiane viennent tous du moteur, seule la boucle est locale.
 *
 * La cellule est celle de la SÉLECTION (`C₃ = Σ`, `EX-DATA-86`), jamais celle d'un groupe : le même
 * seuil sert la sélection, les groupes marque et les groupes modèle — sans quoi l'invariant I3
 * (`Σ n(marque) = n(Σ)`) tomberait. `makeScope` d'`aggregateByModel` ne restreint que les groupes
 * ÉMIS, pas la sélection : il n'entre donc pas dans ce calcul.
 */
function selectionRelativeThreshold(
  batch: MetricColumns,
  rowIndices: Iterable<number> | null,
): number | null {
  const prices: number[] = [];
  forEachRow(batch.rowCount, rowIndices, (i) => {
    if (priceValidAbsolute(batch, i)) prices.push(batch.priceEur[i] as number);
  });
  if (prices.length === 0) return null;
  const sorted = Float64Array.from(prices).sort();
  return implausibleInCellThreshold(quantileFromSorted(sorted, 0.5), sorted.length);
}

/** Vrai si le prix de la ligne entre dans `V_price` : validité absolue ET au-dessus du seuil relatif. */
function priceInSample(batch: MetricColumns, i: number, threshold: number | null): boolean {
  if (!priceValidAbsolute(batch, i)) return false;
  return threshold === null || (batch.priceEur[i] as number) >= threshold;
}

/**
 * Accumule les groupes en DEUX passes : la première compte (effectif total, majorant de l'effectif de
 * prix, effectifs exacts de kilométrage et d'année), la seconde remplit les `Int32Array`.
 * @param keyOf clé de groupe d'une ligne, ou `-1` pour l'écarter.
 * @param threshold seuil relatif d'`EX-DATA-19(2)` de la sélection, ou `null`.
 */
function accumulate(
  batch: MetricColumns,
  rowIndices: Iterable<number> | null,
  keyOf: (i: number) => number,
  threshold: number | null,
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
    if (priceValidAbsolute(batch, i)) c[1] += 1;
    if (mileageValid(batch, i)) c[2] += 1;
    if (yearOf(batch, i) !== null) c[3] += 1;
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
    if (priceInSample(batch, i, threshold)) {
      g.price[g.nPrice] = batch.priceEur[i] as number;
      g.nPrice += 1;
    }
    if (mileageValid(batch, i)) {
      g.mileage[g.nMileage] = batch.mileageKm[i] as number;
      g.nMileage += 1;
    }
    const y = yearOf(batch, i);
    if (y !== null) {
      g.year[g.nYear] = y;
      g.nYear += 1;
    }
  });
  return groups;
}

/** Fige les trois échantillons d'un groupe en `MetricRange` (tri natif des tableaux typés). */
function rangesOf(g: Group): { price: MetricRange; mileage: MetricRange; year: MetricRange } {
  // `price` est un MAJORANT (voir `Group`) : on ne trie et ne lit que les `nPrice` premières cases.
  const price = g.price.subarray(0, g.nPrice);
  price.sort();
  g.mileage.sort();
  g.year.sort();
  return {
    price: rangeOfSorted(price),
    mileage: rangeOfSorted(g.mileage),
    year: rangeOfSorted(g.year),
  };
}

/**
 * Accumulation DENSE des groupes de marque sur tout le lot : les identifiants de marque sont des
 * entiers bornés, quatre `Int32Array` indexés par `makeId` remplacent donc deux recherches de `Map`
 * par ligne et par passe. Réservé au chemin de la BASELINE (`rowIndices === null`), le seul qui soit
 * sur le chemin critique du premier affichage (DR-049).
 */
function accumulateByMakeDense(batch: MetricColumns, threshold: number | null): Map<number, Group> {
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
    if (priceValidAbsolute(batch, i)) nPrice[m] = (nPrice[m] as number) + 1;
    if (mileageValid(batch, i)) nMileage[m] = (nMileage[m] as number) + 1;
    if (yearOf(batch, i) !== null) nYear[m] = (nYear[m] as number) + 1;
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
    if (priceInSample(batch, i, threshold)) {
      g.price[g.nPrice] = batch.priceEur[i] as number;
      g.nPrice += 1;
    }
    if (mileageValid(batch, i)) {
      g.mileage[g.nMileage] = batch.mileageKm[i] as number;
      g.nMileage += 1;
    }
    const y = yearOf(batch, i);
    if (y !== null) {
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
  const threshold = selectionRelativeThreshold(batch, rowIndices);
  const groups =
    rowIndices === null
      ? accumulateByMakeDense(batch, threshold)
      : accumulate(batch, rowIndices, (i) => makeCol[i] as number, threshold);
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
  const threshold = selectionRelativeThreshold(batch, rowIndices);
  const groups = accumulate(
    batch,
    rowIndices,
    (i) => {
      const makeId = makeCol[i] as number;
      if (makeScope !== undefined && makeId !== makeScope) return -1;
      return makeId * 1_000_000 + (modelCol[i] as number);
    },
    threshold,
  );
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
