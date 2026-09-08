/**
 * KYCAR — Construction des index et de l'élagage (lot D4, EX-DATA-115/115bis/116)
 * =================================================================================================
 * Index construits UNE FOIS à l'ingestion (dans le worker) :
 *   - `PK_LISTING` : `listingId` (UUID canonique) → indice de ligne (forage vers deeplink) ;
 *   - `IDX_MAKE`   : indices de ligne triés par `makeId`, plus offsets par `makeId` (élagage mode 1) ;
 *   - `IDX_MODEL`  : indices triés par `(makeId, modelId)`, offsets par clé composite (élagage mode 2) ;
 *   - `IDX_PRICE_SORTED` : indices triés par prix croissant (bornes de prix, top-N) ;
 *   - cinq bitsets énumérés (`fuel`, `body`, `region`, `country`, `transmission`) — intersection sans
 *     balayage (EX-DATA-115).
 * L'élagage (EX-DATA-116) fait passer une sélection contrainte par marque/modèle en `O(m)`.
 *
 * L'index taxonomique par carrosserie (EX-DATA-115bis) se DÉGRADE PROPREMENT (O15) : un modèle à
 * `bodyTypes` vide n'apparaît dans aucune entrée et ne satisfait aucun prédicat `body` — jamais de
 * plantage, jamais de sentinelle.
 *
 * Module PUR : importable par le worker comme par le thread principal.
 */

import type { ListingColumnBatch, Model } from '../types/index';
import { compareListingId, compareListingIdToBytes, parseListingId } from './uuid';
import type { EnumColumnName } from './predicates';
import { enumColumn } from './predicates';

/** Plage `[start, end)` dans un tableau d'indices trié. */
export interface IndexRange {
  readonly start: number;
  readonly end: number;
}

/** Clé composite d'un modèle dans `IDX_MODEL`. */
export function modelIndexKey(makeId: number, modelId: number): string {
  return `${makeId}:${modelId}`;
}

/** Les cinq colonnes énumérées dotées d'un bitset (EX-DATA-115). */
export const BITSET_COLUMNS: readonly EnumColumnName[] = [
  'fuelCategory',
  'bodyType',
  'regionCode',
  'countryCode',
  'transmission',
];

/**
 * `PK_LISTING` (EX-DATA-114/115) : clé primaire `listingId` → indice de ligne.
 *
 * L'index est matérialisé par un ORDRE DE LIGNES trié sur les 16 octets du `listingId`, pas par une
 * `Map` de 100 000 chaînes UUID : à N = 100 000, la Map de chaînes retenait 77 Mo (≈ 800 octets par
 * clé, cordes V8), contre 400 Ko pour l'`Int32Array` — l'écart faisait sortir l'enveloppe mémoire
 * d'EX-DATA-112 / ARB-55 (DR-033). La recherche est dichotomique, en `O(log N)` comparaisons octet à
 * octet, et rend exactement le même résultat qu'une table de hachage sur la chaîne canonique.
 */
export interface ListingPrimaryKey {
  /** Nombre d'entrées de la clé primaire (`= rowCount`). */
  readonly size: number;
  /** Indice de ligne d'un `listingId` canonique, ou `undefined` s'il n'appartient pas au lot. */
  get(listingId: string): number | undefined;
  has(listingId: string): boolean;
}

/** Ensemble des index d'un dataset. */
export interface DatasetIndexes {
  readonly rowCount: number;
  readonly pkListing: ListingPrimaryKey;
  readonly idxMakeRows: Int32Array;
  readonly makeOffsets: ReadonlyMap<number, IndexRange>;
  readonly idxModelRows: Int32Array;
  readonly modelOffsets: ReadonlyMap<string, IndexRange>;
  readonly idxPriceSorted: Int32Array;
  /** Par colonne, par code de valeur, un bitset (`Uint32Array`, 1 bit/ligne). */
  readonly bitsets: ReadonlyMap<EnumColumnName, ReadonlyMap<number, Uint32Array>>;
  /** EX-DATA-115bis : code de carrosserie → clés `makeId:modelId` qui la portent (dégradation O15). */
  readonly bodyTypeIndex: ReadonlyMap<string, ReadonlySet<string>>;
}

/** Trie les indices `[0, n)` par une clé entière, stable, via regroupement par seau (O(n)). */
function bucketSortRows(
  n: number,
  keyOf: (row: number) => number,
): { rows: Int32Array; offsets: Map<number, IndexRange> } {
  const byKey = new Map<number, number[]>();
  for (let row = 0; row < n; row++) {
    const key = keyOf(row);
    let bucket = byKey.get(key);
    if (bucket === undefined) {
      bucket = [];
      byKey.set(key, bucket);
    }
    bucket.push(row);
  }
  const keys = [...byKey.keys()].sort((a, b) => a - b);
  const rows = new Int32Array(n);
  const offsets = new Map<number, IndexRange>();
  let cursor = 0;
  for (const key of keys) {
    const bucket = byKey.get(key) as number[];
    const start = cursor;
    for (const row of bucket) rows[cursor++] = row;
    offsets.set(key, { start, end: cursor });
  }
  return { rows, offsets };
}

/** Implémentation dichotomique de `PK_LISTING` sur les 16 octets bruts de la colonne `listingId`. */
class SortedListingPrimaryKey implements ListingPrimaryKey {
  /** Tampon réutilisé par `get` : la recherche n'alloue pas. */
  private readonly key = new Uint8Array(16);

  constructor(
    private readonly bytes: Uint8Array,
    private readonly sortedRows: Int32Array,
  ) {}

  get size(): number {
    return this.sortedRows.length;
  }

  get(listingId: string): number | undefined {
    if (parseListingId(listingId, this.key) === null) return undefined;
    let lo = 0;
    let hi = this.sortedRows.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      const row = this.sortedRows[mid] as number;
      const cmp = compareListingIdToBytes(this.bytes, row, this.key);
      if (cmp === 0) return row;
      if (cmp < 0) lo = mid + 1;
      else hi = mid - 1;
    }
    return undefined;
  }

  has(listingId: string): boolean {
    return this.get(listingId) !== undefined;
  }
}

/** Construit tous les index d'un batch. `models` (facultatif) alimente l'index EX-DATA-115bis. */
export function buildIndexes(
  batch: ListingColumnBatch,
  models?: readonly Model[],
): DatasetIndexes {
  const n = batch.rowCount;

  // PK_LISTING : ordre de lignes trié sur les 16 octets du listingId (aucune chaîne matérialisée).
  const pkRows = Int32Array.from({ length: n }, (_v, i) => i);
  pkRows.sort((a, b) => compareListingId(batch.listingId, a, b));
  const pkListing = new SortedListingPrimaryKey(batch.listingId, pkRows);

  // IDX_MAKE
  const make = bucketSortRows(n, (row) => batch.makeId[row] as number);

  // IDX_MODEL : tri stable par makeId puis modelId. On encode la clé composite en un entier trié.
  // makeId ∈ Int16 (≤ 32767), modelId ∈ Int32 ; clé = makeId * 2^21 + modelId (modelId < 2^21 = 2M).
  const idxModel = bucketSortRows(n, (row) => {
    const mk = batch.makeId[row] as number;
    const md = batch.modelId[row] as number;
    return mk * 2097152 + md;
  });
  const modelOffsets = new Map<string, IndexRange>();
  // Reconstruit les offsets par clé lisible `makeId:modelId` à partir du tri.
  {
    let start = 0;
    while (start < n) {
      const r0 = idxModel.rows[start] as number;
      const mk = batch.makeId[r0] as number;
      const md = batch.modelId[r0] as number;
      let end = start + 1;
      while (end < n) {
        const r = idxModel.rows[end] as number;
        if ((batch.makeId[r] as number) !== mk || (batch.modelId[r] as number) !== md) break;
        end++;
      }
      modelOffsets.set(modelIndexKey(mk, md), { start, end });
      start = end;
    }
  }

  // IDX_PRICE_SORTED : indices triés par prix croissant (sentinelles -1 en tête).
  const idxPriceSorted = Int32Array.from({ length: n }, (_v, i) => i);
  idxPriceSorted.sort((a, b) => (batch.priceEur[a] as number) - (batch.priceEur[b] as number));

  // Bitsets énumérés.
  const bitsets = new Map<EnumColumnName, Map<number, Uint32Array>>();
  const words = (n + 31) >>> 5;
  for (const colName of BITSET_COLUMNS) {
    const col = enumColumn(batch, colName);
    const perValue = new Map<number, Uint32Array>();
    for (let row = 0; row < n; row++) {
      const v = col[row] as number;
      if (v === 255) continue; // inconnu : pas une valeur de vocabulaire
      let bs = perValue.get(v);
      if (bs === undefined) {
        bs = new Uint32Array(words);
        perValue.set(v, bs);
      }
      bs[row >>> 5] = (bs[row >>> 5] as number) | (1 << (row & 31));
    }
    bitsets.set(colName, perValue);
  }

  // EX-DATA-115bis : index taxonomique par carrosserie (dégradation propre O15).
  const bodyTypeIndex = new Map<string, Set<string>>();
  for (const m of models ?? []) {
    for (const code of m.bodyTypes) {
      let set = bodyTypeIndex.get(code);
      if (set === undefined) {
        set = new Set<string>();
        bodyTypeIndex.set(code, set);
      }
      set.add(modelIndexKey(m.makeId, m.modelId));
    }
  }

  return {
    rowCount: n,
    pkListing,
    idxMakeRows: make.rows,
    makeOffsets: make.offsets,
    idxModelRows: idxModel.rows,
    modelOffsets,
    idxPriceSorted,
    bitsets,
    bodyTypeIndex,
  };
}
