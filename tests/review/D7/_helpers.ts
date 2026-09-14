/**
 * KYCAR — Outils partagés des sondes de revue du lot D7 (phase 2.5)
 * =================================================================================================
 * Deux services :
 *   1. MARCHE-ARBRE de VNodes Preact — les composants sans hook (`Histogram`) sont appelés comme des
 *      fonctions pures et leur arbre `{ type, props }` est inspecté. Même technique que
 *      `src/screens/compare/structure.test.ts` (environnement `node`, aucun DOM disponible, aucune
 *      dépendance tierce autorisée).
 *   2. FIXTURE de données réelles : dataset synthétique D3 + recalcul D4, pour éprouver les modèles
 *      de D7 sur des colonnes portant de vraies sentinelles (EX-DATA-120).
 *
 * Aucune écriture dans `src/`, aucun réseau.
 */

import { generateSyntheticDataset } from '../../../src/engine/synthetic';
import { AggregationDataset, type RecalcResult } from '../../../src/engine/index';
import { detectOutliers } from '../../../src/engine/outliers';
import { decodeListingId } from '../../../src/engine/uuid';
import { OutlierIndex } from '../../../src/screens/outlier-index';
import type { ListingColumnBatch } from '../../../src/types/index';

/* ---- Marche-arbre VNode ----------------------------------------------------------------------- */

export interface VNodeLike {
  readonly type: unknown;
  readonly props: Record<string, unknown> & { readonly children?: unknown };
}

export function isVNode(x: unknown): x is VNodeLike {
  return typeof x === 'object' && x !== null && 'type' in x && 'props' in x;
}

/** Visite tous les VNodes de l'arbre, en descendant aussi dans les props qui portent des VNodes. */
export function walk(node: unknown, visit: (n: VNodeLike) => void): void {
  if (Array.isArray(node)) {
    node.forEach((n) => walk(n, visit));
    return;
  }
  if (!isVNode(node)) return;
  visit(node);
  for (const value of Object.values(node.props)) {
    if (Array.isArray(value) || isVNode(value)) walk(value, visit);
  }
}

export function findAll(root: unknown, pred: (n: VNodeLike) => boolean): VNodeLike[] {
  const out: VNodeLike[] = [];
  walk(root, (n) => {
    if (pred(n)) out.push(n);
  });
  return out;
}

export const byType =
  (t: string) =>
  (n: VNodeLike): boolean =>
    n.type === t;

/** Concatène tout le texte (chaînes et nombres) de l'arbre, séparé par des espaces. */
export function textOf(root: unknown): string {
  const parts: string[] = [];
  const push = (v: unknown): void => {
    if (typeof v === 'string' || typeof v === 'number') parts.push(String(v));
    else if (Array.isArray(v)) v.forEach(push);
    else if (isVNode(v)) {
      for (const value of Object.values(v.props)) push(value);
    }
  };
  push(root);
  return parts.join(' ');
}

/** Toutes les valeurs de props portant ce nom dans l'arbre (ex. `title`, `aria-label`). */
export function propValues(root: unknown, name: string): unknown[] {
  const out: unknown[] = [];
  walk(root, (n) => {
    if (name in n.props) out.push(n.props[name]);
  });
  return out;
}


/** Texte VISIBLE : ne descend que dans `children` (ignore `title`, `aria-label`, etc.). */
export function visibleTextOf(root: unknown): string {
  const parts: string[] = [];
  const push = (v: unknown): void => {
    if (typeof v === 'string' || typeof v === 'number') parts.push(String(v));
    else if (Array.isArray(v)) v.forEach(push);
    else if (isVNode(v)) push(v.props.children);
  };
  push(root);
  return parts.join(' ');
}

/**
 * Rend l'arbre en profondeur : tout VNode dont le `type` est une fonction est APPELÉ avec ses props
 * et remplacé par son résultat. N'est valide que si les hooks sont neutralisés (`vi.mock`) — les
 * composants deviennent alors des fonctions pures de leurs props.
 */
export function deepRender(node: unknown, depth = 0): unknown {
  if (depth > 40) return node;
  if (Array.isArray(node)) return node.map((n) => deepRender(n, depth + 1));
  if (!isVNode(node)) return node;
  if (typeof node.type === 'function') {
    const fn = node.type as (props: Record<string, unknown>) => unknown;
    return deepRender(fn(node.props), depth + 1);
  }
  const props: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node.props)) {
    props[k] = Array.isArray(v) || isVNode(v) ? deepRender(v, depth + 1) : v;
  }
  return { type: node.type, props };
}

/* ---- Fixture données réelles ------------------------------------------------------------------- */

export interface D7Fixture {
  readonly batch: ListingColumnBatch;
  readonly rows: Int32Array;
  readonly recalc: RecalcResult;
  readonly index: OutlierIndex;
  readonly isOutlier: (row: number) => boolean;
  readonly opportunityScore: (row: number) => number | null;
}

/** Dataset synthétique + recalcul moteur (sentinelles, prix sur demande, outliers injectés). */
export function fixture(rowCount: number, seed = 0xd7): D7Fixture {
  const ds = generateSyntheticDataset({ rowCount, seed });
  const batch = ds.batch;
  const rows = Int32Array.from({ length: rowCount }, (_v, i) => i);
  const dataset = new AggregationDataset(batch);
  const recalc = dataset.recalculate({ selectionHash: 'rev-d7:0' });
  const out = detectOutliers(batch, rows, batch.snapshotId, 'rev-d7');
  const index = new OutlierIndex(out.verdicts);
  return {
    batch,
    rows,
    recalc,
    index,
    isOutlier: (row) => index.has(decodeListingId(batch.listingId, row)),
    opportunityScore: (row) => index.scoreOf(decodeListingId(batch.listingId, row)),
  };
}

/**
 * `EX-SCR-170`/D8-25 — clone d'un `D7Fixture` dont la colonne `countryCode` est redistribuée sur les
 * codes fournis (répartition cyclique), moteur et outliers recalculés en entier sur ce batch dérivé.
 * Nécessaire car `generateSyntheticDataset` (D3) fixe `countryCode = 0` (« be ») sur TOUTES les
 * lignes : sans cet outil, aucune fixture D7 ne peut jamais porter plus d'un `countryCode` distinct,
 * donc jamais exercer le rendu de G15 (`EX-SCR-170` : tracé seulement au-delà d'un seul pays) — c'est
 * la cause du constat D8-25 (quatre sondes rouges après fusion de fix-engine, qui fait maintenant
 * appliquer ce masquage réel). `codes` doit porter au moins deux valeurs distinctes pour que
 * `RecalcResult.groupStats` (clé `countryCode`) produise plus d'un groupe.
 */
export function withCountryCodes(base: D7Fixture, codes: readonly number[]): D7Fixture {
  const n = base.batch.countryCode.length;
  const countryCode = new Uint8Array(n);
  for (let i = 0; i < n; i++) countryCode[i] = codes[i % codes.length] as number;
  const batch: ListingColumnBatch = { ...base.batch, countryCode };
  const rows = base.rows;
  const dataset = new AggregationDataset(batch);
  const recalc = dataset.recalculate({ selectionHash: base.recalc.selectionHash });
  const out = detectOutliers(batch, rows, batch.snapshotId, 'rev-d7');
  const index = new OutlierIndex(out.verdicts);
  return {
    batch,
    rows,
    recalc,
    index,
    isOutlier: (row) => index.has(decodeListingId(batch.listingId, row)),
    opportunityScore: (row) => index.scoreOf(decodeListingId(batch.listingId, row)),
  };
}

/** Séquence des `listingId` (hexadécimal minuscule) d'une liste de lignes — comparaison octet à octet. */
export function listingIdSequence(batch: ListingColumnBatch, rows: Int32Array | readonly number[]): string {
  const out: string[] = [];
  for (let i = 0; i < rows.length; i++) out.push(decodeListingId(batch.listingId, rows[i] as number));
  return out.join('|');
}
