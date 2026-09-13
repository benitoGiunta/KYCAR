/**
 * KYCAR — Artefact de BASELINE d'un snapshot de fixtures (phase 3.5, décision `D3-31`)
 * =================================================================================================
 * `C-3.5-01` (`reports/remediation-2.8/mvp-integrate.md` §7.2) : sur le build de production, en 4G
 * simulée, l'écran A affichait son PREMIER CHIFFRE à 7 800 ms pour un budget `EX-NFR-9` de 2 000 ms,
 * parce que 2 677 Kio gzip d'annonces devaient être téléchargés ET ingérés avant le moindre agrégat.
 * Or l'écran A n'a besoin que des agrégats mode 1 par marque (262 lignes) : quelques dizaines de Kio.
 *
 * Ce module décrit le fichier `baseline.json` déposé **à côté de `manifest.json`**, qui porte
 * exactement ce dont l'ouverture a besoin avant la première annonce :
 *
 *   - `rows` — les `MakeAggregate` de la sélection VIDE, c'est-à-dire, au bit près,
 *     `aggregateByMake(batch, null, 1)` sur le lot ingéré ;
 *   - `selectionCount` — l'effectif de cette sélection vide (le `rowCount` du lot) ;
 *   - `ingest` — les statistiques d'ingestion que `buildDescriptor` tirait de l'`IngestReport`, pour
 *     que le `SnapshotDescriptor` et sa `coverageNote` soient IDENTIQUES sur les deux chemins.
 *
 * POURQUOI UN FICHIER SÉPARÉ, ET NON UN BLOC DU MANIFEST. Le manifest complet du profil `test` pèse
 * 483 Kio (sa vérité terrain), au point qu'un manifest ALLÉGÉ a déjà dû être synthétisé pour le
 * chemin critique (`manifest.min.json`). Y ajouter la baseline aurait mêlé deux documents de durées
 * de vie différentes : le manifest est écrit par le générateur et scellé avec les octets du NDJSON ;
 * la baseline est DÉRIVÉE de ces octets par le code du provider, et se régénère sans toucher au jeu.
 * Séparés, chacun se valide, se sert et se recalcule pour son compte — et le chemin critique ne
 * télécharge que ce qu'il lit.
 *
 * CE QUI LIE L'ARTEFACT À SES OCTETS. `snapshotId` ET `producedFrom.sha256` (le hachage des octets
 * NON compressés, celui du manifest) : une baseline calculée sur un autre fichier, ou sur une
 * version antérieure du même snapshot, est DÉTECTABLE avant la première ligne, donc REFUSÉE avant
 * d'avoir servi le moindre chiffre. Ce que ce lien ne couvre pas — un artefact réécrit à la main,
 * cohérent en apparence — est couvert à l'arrivée des annonces par `diffBaseline`, qui compare la
 * baseline précalculée à celle que le provider RECALCULE : un écart n'est jamais servi en silence.
 */

import type { MakeAggregate, MetricRange } from '../DataProvider';

/** Nom du fichier, déposé à côté de `manifest.json`. */
export const BASELINE_FILE = 'baseline.json';

/** Marqueur de nature : ce que le provider exige de lire avant d'accorder le moindre crédit au fichier. */
export const BASELINE_ARTIFACT = 'kycar-snapshot-baseline';

/**
 * Version du FORMAT de l'artefact (indépendante de `schemaVersion`, qui est celle du couple de
 * schémas de données). Un majeur inconnu fait ignorer l'artefact — jamais échouer l'ouverture : le
 * chemin d'ingestion complète reste toujours disponible.
 */
export const BASELINE_ARTIFACT_VERSION = '1.0.0';

/** Provenance de la mesure telle que l'adaptateur la dérive (`EX-DATA-35`, dette `D8-32`). */
export interface BaselineMeasurementCounts {
  readonly WLTP: number;
  readonly NEDC: number;
  readonly UNKNOWN: number;
}

/**
 * Ce que l'ingestion MESURE et que le descripteur publie. Toutes ces valeurs sont des propriétés
 * du couple (fichier d'annonces, code d'adaptation) : les précalculer, c'est éviter de relire
 * 20 000 lignes pour les retrouver, jamais les inventer.
 */
export interface BaselineIngestSummary {
  /** Lignes LUES dans le fichier (rejets et doublons compris). */
  readonly lineCount: number;
  /** Lignes RETENUES après rejets et dédoublonnage : l'effectif servi. */
  readonly listingCount: number;
  readonly rejectedCount: number;
  readonly rejectedByReason: Readonly<Record<string, number>>;
  readonly duplicateListingCount: number;
  readonly duplicateValueConflictCount: number;
  readonly unknownCountByField: Readonly<Record<string, number>>;
  readonly ingestFlagCounts: Readonly<Record<string, number>>;
  readonly noticeCounts: Readonly<Record<string, number>>;
  readonly measurementCounts: BaselineMeasurementCounts;
}

/** L'artefact tel qu'il est écrit sur disque et servi sous `/fixtures/<profil>/<snapshot>/baseline.json`. */
export interface SnapshotBaselineArtifact {
  /** Toujours `kycar-snapshot-baseline` : distingue l'artefact d'une page d'erreur ou d'un repli SPA. */
  readonly artifact: string;
  readonly artifactVersion: string;
  /** Version du couple de schémas de données, recopiée du manifest (`DATA-MODEL` §6). */
  readonly schemaVersion: string;
  readonly snapshotId: string;
  readonly profile: string;
  readonly producedBy: {
    readonly name: string;
    readonly version: string;
    /** Version du provider qui a calculé la baseline (`FIXTURE_PROVIDER_VERSION`). */
    readonly providerVersion: string;
  };
  /** Ce sur quoi la baseline a été calculée : le hachage des octets NON compressés et le compte annoncé. */
  readonly producedFrom: {
    readonly sha256: string;
    readonly listingCount: number;
  };
  /** Effectif de la sélection VIDE (`EX-DATA-108` : la sélection vide se sérialise en chaîne vide). */
  readonly selectionCount: number;
  readonly ingest: BaselineIngestSummary;
  readonly rows: readonly MakeAggregate[];
}

const COUNT_RECORD_KEYS = [
  'rejectedByReason',
  'unknownCountByField',
  'ingestFlagCounts',
  'noticeCounts',
] as const;

function isCountRecord(value: unknown): value is Record<string, number> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  for (const v of Object.values(value as Record<string, unknown>)) {
    if (typeof v !== 'number' || !Number.isFinite(v)) return false;
  }
  return true;
}

function isMetricRange(value: unknown): value is MetricRange {
  if (value === null || typeof value !== 'object') return false;
  const r = value as Record<string, unknown>;
  for (const key of ['min', 'max', 'p05', 'p50', 'p95']) {
    const v = r[key];
    if (v !== null && (typeof v !== 'number' || !Number.isFinite(v))) return false;
  }
  return typeof r['n'] === 'number' && Number.isFinite(r['n']);
}

function isMakeAggregate(value: unknown): value is MakeAggregate {
  if (value === null || typeof value !== 'object') return false;
  const r = value as Record<string, unknown>;
  if (typeof r['makeId'] !== 'number' || typeof r['listingCount'] !== 'number') return false;
  if (!isMetricRange(r['price']) || !isMetricRange(r['mileage']) || !isMetricRange(r['year'])) return false;
  if (r['sampleCoverage'] !== null && typeof r['sampleCoverage'] !== 'number') return false;
  return r['modelCount'] === null || typeof r['modelCount'] === 'number';
}

function isIngestSummary(value: unknown): value is BaselineIngestSummary {
  if (value === null || typeof value !== 'object') return false;
  const r = value as Record<string, unknown>;
  for (const key of [
    'lineCount',
    'listingCount',
    'rejectedCount',
    'duplicateListingCount',
    'duplicateValueConflictCount',
  ]) {
    if (typeof r[key] !== 'number' || !Number.isFinite(r[key] as number)) return false;
  }
  for (const key of COUNT_RECORD_KEYS) if (!isCountRecord(r[key])) return false;
  const m = r['measurementCounts'];
  if (m === null || typeof m !== 'object') return false;
  const mc = m as Record<string, unknown>;
  return ['WLTP', 'NEDC', 'UNKNOWN'].every((k) => typeof mc[k] === 'number');
}

/**
 * Contrôle de FORME. Rend `false` — sans lever — sur tout ce qui n'est pas un artefact de baseline :
 * un 404 rendu en HTML par un repli SPA, un fichier tronqué, un format d'une autre nature. Le
 * provider en fait alors un REPLI sur l'ingestion complète, jamais un échec d'ouverture.
 */
export function isBaselineArtifact(value: unknown): value is SnapshotBaselineArtifact {
  if (value === null || typeof value !== 'object') return false;
  const a = value as Record<string, unknown>;
  if (a['artifact'] !== BASELINE_ARTIFACT) return false;
  if (typeof a['artifactVersion'] !== 'string' || typeof a['schemaVersion'] !== 'string') return false;
  if (typeof a['snapshotId'] !== 'string' || typeof a['profile'] !== 'string') return false;
  if (typeof a['selectionCount'] !== 'number' || !Number.isFinite(a['selectionCount'])) return false;
  const from = a['producedFrom'];
  if (from === null || typeof from !== 'object') return false;
  const f = from as Record<string, unknown>;
  if (typeof f['sha256'] !== 'string' || typeof f['listingCount'] !== 'number') return false;
  const by = a['producedBy'];
  if (by === null || typeof by !== 'object') return false;
  const b = by as Record<string, unknown>;
  if (typeof b['name'] !== 'string' || typeof b['version'] !== 'string' || typeof b['providerVersion'] !== 'string') {
    return false;
  }
  if (!isIngestSummary(a['ingest'])) return false;
  const rows = a['rows'];
  return Array.isArray(rows) && rows.every(isMakeAggregate);
}

/** Majeur du format de l'artefact que ce code sait lire. */
function majorOf(version: string): string {
  return (version.split('.')[0] ?? '').trim();
}

/**
 * Verdict de RECEVABILITÉ d'un artefact lu à côté d'un manifest donné : `null` = recevable, sinon
 * la phrase fr-BE qui dit pourquoi il ne l'est pas. Le provider joint cette phrase à la
 * `coverageNote` et ingère le fichier complet : un artefact douteux coûte du temps, jamais un
 * chiffre faux.
 */
export function baselineRejectionReason(
  artifact: SnapshotBaselineArtifact,
  manifest: { readonly snapshotId: string; readonly sha256: string; readonly schemaVersion: string },
): string | null {
  if (majorOf(artifact.artifactVersion) !== majorOf(BASELINE_ARTIFACT_VERSION)) {
    return (
      `Agrégats précalculés au format ${artifact.artifactVersion}, incompatible avec le format ` +
      `${BASELINE_ARTIFACT_VERSION} que cette application sait lire : ils sont IGNORÉS et les ` +
      'agrégats sont recalculés sur les annonces.'
    );
  }
  if (artifact.snapshotId !== manifest.snapshotId) {
    return (
      `Agrégats précalculés REFUSÉS : ils déclarent le snapshot « ${artifact.snapshotId} » alors que ` +
      `le manifest lu est celui de « ${manifest.snapshotId} ». Les agrégats sont recalculés sur les annonces.`
    );
  }
  if (artifact.producedFrom.sha256 !== manifest.sha256) {
    return (
      'Agrégats précalculés REFUSÉS : ils ont été calculés sur d’autres octets que ceux de ce ' +
      `snapshot (hachage ${artifact.producedFrom.sha256.slice(0, 12)}… contre ` +
      `${manifest.sha256.slice(0, 12)}… au manifest). Les agrégats sont recalculés sur les annonces.`
    );
  }
  if (artifact.schemaVersion !== manifest.schemaVersion) {
    return (
      `Agrégats précalculés REFUSÉS : version de schéma ${artifact.schemaVersion} contre ` +
      `${manifest.schemaVersion} au manifest. Les agrégats sont recalculés sur les annonces.`
    );
  }
  const summed = artifact.rows.reduce((acc, r) => acc + r.listingCount, 0);
  if (summed !== artifact.selectionCount) {
    return (
      `Agrégats précalculés REFUSÉS : la somme des effectifs par marque (${summed}) ne fait pas ` +
      `l’effectif déclaré (${artifact.selectionCount}). Les agrégats sont recalculés sur les annonces.`
    );
  }
  if (artifact.ingest.listingCount !== artifact.selectionCount) {
    return (
      `Agrégats précalculés REFUSÉS : effectif d’ingestion (${artifact.ingest.listingCount}) et ` +
      `effectif de la sélection vide (${artifact.selectionCount}) divergent. Les agrégats sont ` +
      'recalculés sur les annonces.'
    );
  }
  return null;
}

/** Compare deux `MetricRange` champ à champ ; rend le nom du premier champ divergent, ou `null`. */
function diffMetric(a: MetricRange, b: MetricRange): string | null {
  for (const key of ['min', 'max', 'p05', 'p50', 'p95', 'n'] as const) {
    if (a[key] !== b[key]) return `${key} ${String(a[key])} ≠ ${String(b[key])}`;
  }
  return null;
}

/** Compare deux dictionnaires d'effectifs ; rend la première clé divergente, ou `null`. */
function diffCounts(
  a: Readonly<Record<string, number>>,
  b: Readonly<Record<string, number>>,
): string | null {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of [...keys].sort()) {
    const va = a[key] ?? 0;
    const vb = b[key] ?? 0;
    if (va !== vb) return `${key} ${va} ≠ ${vb}`;
  }
  return null;
}

/**
 * Compare la baseline PRÉCALCULÉE à la baseline RECALCULÉE sur les annonces effectivement ingérées.
 * Rend `null` si elles sont identiques, sinon la phrase fr-BE qui NOMME le premier écart trouvé.
 *
 * C'est le garde-fou qui rend le précalcul honnête : sans lui, un artefact réécrit servirait des
 * chiffres qu'aucune annonce ne soutient, et personne ne le saurait jamais.
 */
export function diffBaseline(
  artifact: SnapshotBaselineArtifact,
  computed: { readonly rows: readonly MakeAggregate[]; readonly selectionCount: number; readonly ingest: BaselineIngestSummary },
): string | null {
  if (artifact.selectionCount !== computed.selectionCount) {
    return `effectif de la sélection vide : ${artifact.selectionCount} précalculé, ${computed.selectionCount} recalculé`;
  }
  if (artifact.rows.length !== computed.rows.length) {
    return `nombre de marques : ${artifact.rows.length} précalculé, ${computed.rows.length} recalculé`;
  }
  for (let i = 0; i < artifact.rows.length; i += 1) {
    const a = artifact.rows[i] as MakeAggregate;
    const b = computed.rows[i] as MakeAggregate;
    if (a.makeId !== b.makeId) return `marque au rang ${i} : ${a.makeId} précalculée, ${b.makeId} recalculée`;
    if (a.listingCount !== b.listingCount) {
      return `marque ${a.makeId} : ${a.listingCount} annonces précalculées, ${b.listingCount} recalculées`;
    }
    if (a.sampleCoverage !== b.sampleCoverage) {
      return `marque ${a.makeId} : couverture d’échantillon ${String(a.sampleCoverage)} ≠ ${String(b.sampleCoverage)}`;
    }
    if (a.modelCount !== b.modelCount) {
      return `marque ${a.makeId} : ${String(a.modelCount)} modèles distincts ≠ ${String(b.modelCount)}`;
    }
    for (const metric of ['price', 'mileage', 'year'] as const) {
      const d = diffMetric(a[metric], b[metric]);
      if (d !== null) return `marque ${a.makeId}, ${metric} : ${d}`;
    }
  }
  const ia = artifact.ingest;
  const ib = computed.ingest;
  for (const key of [
    'lineCount',
    'listingCount',
    'rejectedCount',
    'duplicateListingCount',
    'duplicateValueConflictCount',
  ] as const) {
    if (ia[key] !== ib[key]) return `statistique d’ingestion ${key} : ${ia[key]} ≠ ${ib[key]}`;
  }
  for (const key of COUNT_RECORD_KEYS) {
    const d = diffCounts(ia[key], ib[key]);
    if (d !== null) return `statistique d’ingestion ${key} : ${d}`;
  }
  for (const key of ['WLTP', 'NEDC', 'UNKNOWN'] as const) {
    if (ia.measurementCounts[key] !== ib.measurementCounts[key]) {
      return `provenance de mesure ${key} : ${ia.measurementCounts[key]} ≠ ${ib.measurementCounts[key]}`;
    }
  }
  return null;
}
