/**
 * KYCAR — Géométrie des histogrammes G1–G3 (lot D7, EX-SCR-19/16, ARCHITECTURE §4.1)
 * =================================================================================================
 * Transforme les `DistributionBucket[]` produits par le moteur (bins de `BIN`, EX-DATA-75) en une
 * géométrie prête pour un rendu SVG accessible, PLUS la matière de la table de données équivalente
 * (EX-NFR-15). Rappels normatifs :
 *   - AXE DES EFFECTIFS PARTANT DE 0, jamais tronqué (EX-SCR-19) : `heightFrac ∈ [0, 1]` avec 0 au
 *     comptage nul, l'origine visuelle est le zéro.
 *   - BASCULE LOG CONDITIONNELLE (EX-SCR-16) : la bascule n'est OFFERTE que si le ratio
 *     `maxCount / minNonZeroCount ≥ 50` ; sinon elle est masquée (`logAvailable = false`). Portée par
 *     un paramètre d'URL `g<n>log` (état d'interface, EX-NAV-10bis) géré par `url-state.ts`.
 *   - ≤ 26 bins (2 débordements + 24 fermés, EX-DATA-77) : la disposition catégorielle par créneau
 *     égal convient (bornes réelles portées par la table et l'infobulle).
 *
 * Module PUR : testable sans DOM.
 */

import type { DistributionBucket, FilterValue, SelectionInput } from '../../types/index';

/** Seuil de disponibilité de la bascule log (EX-SCR-16). */
export const LOG_TOGGLE_MIN_RATIO = 50;

/** Une barre d'histogramme, positionnée en fractions (indépendant des pixels du conteneur). */
export interface HistogramBar {
  readonly index: number;
  readonly lowerBound: number;
  readonly upperBound: number;
  /** Bin de débordement (borne ouverte) — marqueur de dépassement au rendu (EX-SCR-18). */
  readonly open: boolean;
  readonly count: number;
  readonly share: number;
  /** Position horizontale du créneau, fraction ∈ [0, 1[. */
  readonly xFrac: number;
  /** Largeur du créneau, fraction ∈ ]0, 1]. */
  readonly widthFrac: number;
  /** Hauteur de la barre, fraction ∈ [0, 1] (0 = axe des effectifs, EX-SCR-19). */
  readonly heightFrac: number;
}

/** Modèle complet d'un histogramme (une métrique). */
export interface HistogramModel {
  readonly metric: 'price' | 'year' | 'mileage';
  readonly bars: readonly HistogramBar[];
  /** Effectif du plus grand bin (référence de l'axe). */
  readonly maxCount: number;
  /** Effectif total (somme des bins émis). */
  readonly totalCount: number;
  /** Vrai si la bascule log est proposée (ratio ≥ 50, EX-SCR-16). */
  readonly logAvailable: boolean;
  /** Vrai si l'échelle log est effectivement appliquée à cette géométrie. */
  readonly logApplied: boolean;
  /** Ratio max/min-non-nul (diagnostic, décide `logAvailable`). */
  readonly dynamicRange: number;
}

export interface HistogramOptions {
  /** Demande l'échelle log (appliquée seulement si `logAvailable`). */
  readonly log?: boolean;
}

/**
 * Construit la géométrie d'un histogramme à partir des buckets du moteur.
 * Les buckets sont supposés dans l'ordre canonique (débordement bas, fermés, débordement haut).
 */
export function buildHistogram(
  metric: 'price' | 'year' | 'mileage',
  buckets: readonly DistributionBucket[],
  options: HistogramOptions = {},
): HistogramModel {
  const emitted = buckets.filter((b) => b.count > 0 || !b.open); // bins fermés vides conservés (EX-DATA-78)
  const slots = emitted.length;
  let maxCount = 0;
  let minNonZero = Infinity;
  let totalCount = 0;
  for (const b of buckets) {
    totalCount += b.count;
    if (b.count > maxCount) maxCount = b.count;
    if (b.count > 0 && b.count < minNonZero) minNonZero = b.count;
  }
  const dynamicRange = minNonZero === Infinity || minNonZero === 0 ? 0 : maxCount / minNonZero;
  const logAvailable = dynamicRange >= LOG_TOGGLE_MIN_RATIO;
  const logApplied = Boolean(options.log) && logAvailable;

  const denom = logApplied ? Math.log1p(maxCount) : maxCount;
  const bars: HistogramBar[] = emitted.map((b, i) => {
    let heightFrac = 0;
    if (maxCount > 0 && b.count > 0) {
      heightFrac = logApplied ? Math.log1p(b.count) / denom : b.count / denom;
    }
    return {
      index: b.index,
      lowerBound: b.lowerBound,
      upperBound: b.upperBound,
      open: b.open,
      count: b.count,
      share: b.share,
      xFrac: slots > 0 ? i / slots : 0,
      widthFrac: slots > 0 ? 1 / slots : 1,
      heightFrac,
    };
  });

  return { metric, bars, maxCount, totalCount, logAvailable, logApplied, dynamicRange };
}

/** Une ligne de la table de données équivalente (EX-NFR-15, WCAG 1.1.1). */
export interface HistogramTableRow {
  readonly rangeLabel: string;
  readonly count: number;
  readonly sharePct: string;
}

/**
 * Table de données équivalente d'un histogramme (EX-NFR-15) : borne basse/haute/effectif/part par
 * bin. `format` met en forme la borne selon la métrique (prix €, année, km).
 */
export function histogramTable(
  model: HistogramModel,
  format: (value: number, metric: 'price' | 'year' | 'mileage') => string,
): readonly HistogramTableRow[] {
  return model.bars.map((b) => {
    let rangeLabel: string;
    if (b.open && !Number.isFinite(b.lowerBound)) {
      rangeLabel = `< ${format(b.upperBound, model.metric)}`;
    } else if (b.open && !Number.isFinite(b.upperBound)) {
      rangeLabel = `≥ ${format(b.lowerBound, model.metric)}`;
    } else {
      rangeLabel = `${format(b.lowerBound, model.metric)} – ${format(b.upperBound, model.metric)}`;
    }
    return {
      rangeLabel,
      count: b.count,
      // fr-BE (EX-NFR-28/30, R-D7-04) : virgule décimale + espace fine insécable avant `%`, jamais
      // le point décimal ni une espace ordinaire.
      sharePct: `${(b.share * 100).toFixed(1).replace('.', ',')}${NNBSP}%`,
    };
  });
}

const NNBSP = ' '; // espace fine insécable (séparateur fr-BE, cf. `format.ts`)

/** Identifiants de filtre R d'intervalle par métrique (`src/state/filter-registry.ts`, D5) — repris
 * ici en constantes locales : ce module n'importe rien de `src/state` (hors périmètre fix-screens),
 * mais consomme les IDENTIFIANTS DE FILTRE, qui font partie du contrat public de `SelectionInput`
 * (D2, `src/types/selection.ts`), pas de l'implémentation du bandeau. */
const METRIC_FILTER_IDS: Readonly<Record<'price' | 'year' | 'mileage', { readonly from: string; readonly to: string }>> = {
  price: { from: 'priceFrom', to: 'priceTo' },
  mileage: { from: 'mileageFrom', to: 'mileageTo' },
  year: { from: 'dateOfRegistrationFrom', to: 'dateOfRegistrationTo' },
};

/** `ARB-09` (DR-009) : plus petite unité adressable de la métrique côté filtre — un `<x>to` posé à
 * `hi − u` retient exactement l'effectif de la barre (bins semi-ouverts à droite, `[lo, hi)`,
 * EX-DATA-76). Les trois métriques sont des entiers dans leur unité canonique (€, km, année) : `u` y
 * vaut toujours 1, quelle que soit la LARGEUR du bin (`binWidth`, sans rapport avec `u`). */
const METRIC_UNIT: Readonly<Record<'price' | 'year' | 'mileage', number>> = { price: 1, mileage: 1, year: 1 };

/**
 * `ARB-09` / `EX-SCR-149` (DR-009) — convertit le bucket cliqué en filtre d'intervalle à poser :
 * `<x>from = lo`, `<x>to = hi − u`. Gère les deux cas de débordement (`EX-DATA-76`, bin de
 * débordement ouvert) : le bin bas (`lowerBound = -Infinity`) ne pose PAS de borne basse (« jusqu'à
 * hi − u »), le bin haut (`upperBound = +Infinity`) ne pose PAS de borne haute (« à partir de lo »).
 * Fonction PURE : elle ne pose rien elle-même — le résultat est un `SelectionInput` partiel que
 * l'hôte (via `DistributionScreenProps.onApplyFilters`) applique à la sélection réelle Σ.
 */
export function bucketToIntervalFilters(
  bucket: Pick<DistributionBucket, 'lowerBound' | 'upperBound'>,
  metric: 'price' | 'year' | 'mileage',
): SelectionInput {
  const ids = METRIC_FILTER_IDS[metric];
  const u = METRIC_UNIT[metric];
  const out: Record<string, FilterValue> = {};
  if (Number.isFinite(bucket.lowerBound)) out[ids.from] = bucket.lowerBound;
  if (Number.isFinite(bucket.upperBound)) out[ids.to] = bucket.upperBound - u;
  return out;
}
