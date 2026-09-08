/**
 * KYCAR — Modèle de vue de l'écran A (lot D6)
 * =================================================================================================
 * Construit les cartes-marques et zones-modèles à partir des agrégats du moteur (`MakeAggregate`/
 * `ModelAggregate`, `src/providers/DataProvider.ts`) et de la taxonomie (`Make`/`Model`,
 * `src/types/entities.ts`). Module PUR : aucune I/O, aucun accès DOM. Les composants `.tsx`
 * n'ajoutent aucune règle qui ne soit pas ici — cohérent avec la convention D5 (`band-model.ts`).
 *
 * RÈGLE CENTRALE (`A-05`/`R-A05`, `EX-DATA-69`, glossaire `REQUIREMENTS.md` §2) : TOUTE fourchette
 * affichée sur l'écran A est `displayRange = [p05, p95]`, jamais `[min, max]`, et jamais sans le
 * libellé « fourchette centrale (90 % des offres) ». Seule la fourchette de PRIX porte, en plus, un
 * libellé secondaire/infobulle `rawRange` (`[min, max]`) — `EX-SCR-109`/`113` ne demandent ce second
 * libellé que pour le prix ; année et kilométrage n'affichent que `displayRange`.
 */

import type { MakeAggregate, MetricRange, ModelAggregate } from '../../providers/DataProvider';
import type { Make, Model } from '../../types/entities';
import { MODEL_ID_UNRESOLVED } from '../../types/sentinels';
import {
  type SampleCoverage,
  type CoverageDiscLevel,
  coverageDiscLevel,
  coverageDiscTooltip,
  sampleCoverageOf,
  shouldItalicizeRanges,
} from './coverage';
import {
  formatInteger,
  formatMileageRange,
  formatOfferCount,
  formatPrice,
  formatPriceRange,
  formatYearRange,
  TRUNCATION_BUDGET,
  truncateGraphemes,
  type Truncated,
} from './format';
import { effectifTier, isSparseModel, modelZoneMedianDisplay } from './thresholds';
import { sortModelRows } from './sort';

export const MODEL_NON_IDENTIFIE_LABEL = 'Modèle non identifié';
export const MODEL_NON_IDENTIFIE_SLUG = 'modele-non-identifie';

/** `EX-SCR-108` — fourchette de couleurs de pastille, choisie déterministiquement par `makeId`
 * (`makeId % palette.length`), stable entre deux chargements et testable. Valeurs de teinte HSL
 * arbitraires mais fixes : le choix esthétique n'est pas normatif, sa STABILITÉ l'est. */
const BADGE_PALETTE = [
  'hsl(4 72% 45%)', 'hsl(28 80% 45%)', 'hsl(48 85% 40%)', 'hsl(84 55% 38%)',
  'hsl(150 55% 35%)', 'hsl(180 55% 35%)', 'hsl(205 65% 45%)', 'hsl(225 60% 52%)',
  'hsl(260 55% 52%)', 'hsl(295 50% 45%)', 'hsl(325 60% 45%)', 'hsl(350 65% 48%)',
] as const;

export function badgeColorForMake(makeId: number): string {
  const idx = ((makeId % BADGE_PALETTE.length) + BADGE_PALETTE.length) % BADGE_PALETTE.length;
  // Non-null : idx est toujours dans [0, length) par construction ci-dessus.
  return BADGE_PALETTE[idx] as string;
}

export function badgeInitials(label: string): string {
  return Array.from(label.trim()).slice(0, 2).join('').toUpperCase();
}

/* ================================================================================================
 * Fourchettes composées (label + libellé normatif)
 * ============================================================================================== */

export interface CentralRange {
  /** `[p05, p95]` mis en forme, ou message de repli si non calculable. */
  readonly label: string;
  /** Toujours présent quand `label` porte une valeur : « fourchette centrale (90 % des offres) ». */
  readonly caption: string;
  readonly available: boolean;
  /** `EX-SCR-33` (D-04, ARB-17) : jeton ambre `n = <n>` quand le palier d'effectif de LA métrique
   * (pas `listingCount`) est `'trop-faible'` ou `'reduite'` (`n` compris entre 1 et 11) — paliers
   * uniques pour toute l'application, y compris l'écran A. `undefined` sinon (rien à signaler). */
  readonly lowSampleToken?: string;
}

const CENTRAL_RANGE_CAPTION = 'fourchette centrale (90 % des offres)';
const RAW_RANGE_CAPTION = 'du moins cher au plus cher';
/** `D8-06` (FV-09, D-04/D-36) : sous `n = 12`, la fourchette affichée n'est plus `[p05, p95]` (non
 * significatif à si faible effectif) mais `[min, max]` — ce libellé le dit, jamais la légende du
 * P5/P95 normal. */
const LOW_SAMPLE_CAPTION = 'fourchette observée (min – max, effectif réduit)';
const UNAVAILABLE_RANGE: CentralRange = { label: '—', caption: CENTRAL_RANGE_CAPTION, available: false };

/**
 * `EX-SCR-33`/`114`/`134` (D-04, D-36, D8-06/FV-09) : sous `n = 12` (paliers `'trop-faible'` ET
 * `'reduite'`, `thresholds.ts::effectifTier` — seuils uniques pour toute l'application), la
 * fourchette centrale `[p05, p95]` est remplacée par `[min, max]`, disponible DÈS `n = 1`, avec le
 * jeton ambre `n = <n>` (`lowSampleToken`) — jamais `« — »` : c'est exactement le défaut que FV-09 a
 * relevé (fourchette masquée alors que `min`/`max` sont connus). `min`/`max` eux-mêmes `null`
 * (métrique jamais renseignée) reste le seul cas où `« — »` est affiché. */
function lowSampleRange(n: number, min: number | null, max: number | null, format: (lo: number, hi: number) => string): CentralRange | undefined {
  const tier = effectifTier(n);
  if (tier !== 'trop-faible' && tier !== 'reduite') return undefined;
  if (min === null || max === null) {
    return { label: '—', caption: CENTRAL_RANGE_CAPTION, available: false, lowSampleToken: `n = ${n}` };
  }
  return { label: format(min, max), caption: LOW_SAMPLE_CAPTION, available: true, lowSampleToken: `n = ${n}` };
}

function priceCentralRange(price: MetricRange): CentralRange {
  const guard = lowSampleRange(price.n, price.min, price.max, formatPriceRange);
  if (guard) return guard;
  if (price.p05 === null || price.p95 === null) return UNAVAILABLE_RANGE;
  return { label: formatPriceRange(price.p05, price.p95), caption: CENTRAL_RANGE_CAPTION, available: true };
}

function priceRawRangeTooltip(price: MetricRange): string | undefined {
  if (price.min === null || price.max === null) return undefined;
  return `${RAW_RANGE_CAPTION} : ${formatPriceRange(price.min, price.max)}`;
}

function yearCentralRange(year: MetricRange): CentralRange {
  const guard = lowSampleRange(year.n, year.min, year.max, formatYearRange);
  if (guard) return guard;
  if (year.p05 === null || year.p95 === null) return UNAVAILABLE_RANGE;
  return { label: formatYearRange(year.p05, year.p95), caption: CENTRAL_RANGE_CAPTION, available: true };
}

function mileageCentralRange(mileage: MetricRange): CentralRange {
  const guard = lowSampleRange(mileage.n, mileage.min, mileage.max, formatMileageRange);
  if (guard) return guard;
  if (mileage.p05 === null || mileage.p95 === null) return UNAVAILABLE_RANGE;
  return { label: formatMileageRange(mileage.p05, mileage.p95), caption: CENTRAL_RANGE_CAPTION, available: true };
}

/* ================================================================================================
 * Zone-modèle — EX-SCR-112..118
 * ============================================================================================== */

export interface ModelZoneViewModel {
  readonly makeId: number;
  readonly modelId: number;
  readonly isUnresolved: boolean;
  readonly label: string;
  readonly labelTruncated: Truncated;
  readonly slug: string;
  readonly listingCount: number;
  /** `EX-SCR-113` #2 : effectif SANS le mot « offres » (répété 34 fois par carte sinon). */
  readonly offerCountBare: string;
  /** `EX-SCR-113` #2 : `aria-label` complet, `<nom>, <n> offres`. */
  readonly ariaLabel: string;
  /** `EX-SCR-116` : `false` si `listingCount = 0` — les trois fourchettes sont remplacées par un
   * message unique, jamais par `0 – 0 €`. */
  readonly rangesAvailable: boolean;
  readonly price: CentralRange;
  readonly priceRawTooltip: string | undefined;
  readonly year: CentralRange;
  readonly mileage: CentralRange;
  readonly medianLabel: string;
  readonly coverage: SampleCoverage;
  readonly coverageLevel: CoverageDiscLevel;
  readonly coverageTooltip: string;
  readonly italicizeRanges: boolean;
  /** `EX-SCR-113` #9 : jamais 0 pour un effectif > 0 (`EX-SCR-134`). */
  readonly relativeShareRatio: number;
  /** `EX-SCR-128` : effectif strictement inférieur à 3. */
  readonly isSparse: boolean;
  /** Les trois `MetricRange` BRUTES de l'agrégat, non reformatées : `EX-SCR-4`/`draft-data-
   * dictionary.md` (« les écrans B et D ET L'EXPORT CSV publient `rawRange`, sans écrêtage ») —
   * l'export (`csv.ts`) a besoin de `min`/`max` bruts, jamais de `displayRange`, contrairement au
   * rendu de cette même zone. Portées ici plutôt que refaites depuis les libellés déjà arrondis. */
  readonly rawMetrics: { readonly price: MetricRange; readonly year: MetricRange; readonly mileage: MetricRange };
}

export function buildModelZoneViewModel(
  agg: ModelAggregate,
  model: Model | undefined,
  maxListingCountInMake: number,
  hasUserFilters: boolean,
): ModelZoneViewModel {
  const isUnresolved = agg.modelId === MODEL_ID_UNRESOLVED;
  const label = isUnresolved ? MODEL_NON_IDENTIFIE_LABEL : (model?.label ?? `Modèle ${agg.modelId}`);
  const slug = isUnresolved ? MODEL_NON_IDENTIFIE_SLUG : (model?.slug ?? String(agg.modelId));
  const rangesAvailable = agg.listingCount > 0;

  const coverage = sampleCoverageOf(agg.listingCount, model?.announcedCount ?? null, hasUserFilters);

  // EX-SCR-134 (ET-EFFECTIF-FAIBLE appliqué à la zone-modèle) : n désigne ici n_m(Σ) de la
  // métrique prix (EX-DATA-59), pas l'effectif de sélection listingCount.
  const medianDisplay = modelZoneMedianDisplay(agg.price.n);
  let medianLabel: string;
  if (medianDisplay.kind === 'absent') medianLabel = '—';
  else if (medianDisplay.kind === 'single-offer') medianLabel = '1 seule offre';
  else if (medianDisplay.kind === 'too-few') medianLabel = `${medianDisplay.n} trop faible`;
  else medianLabel = agg.price.p50 !== null ? `méd. ${formatPrice(agg.price.p50)}` : '—';

  // EX-SCR-113 #9 / EX-SCR-134 : longueur RÉELLE, jamais forcée — le ratio est inhérentement > 0
  // dès que listingCount > 0, puisque maxListingCountInMake (le max de la marque, CE modèle inclus)
  // est alors lui aussi > 0. Aucun plancher artificiel n'est donc nécessaire ni souhaité.
  const relativeShareRatio = maxListingCountInMake > 0 ? agg.listingCount / maxListingCountInMake : 0;

  return {
    makeId: agg.makeId,
    modelId: agg.modelId,
    isUnresolved,
    label,
    labelTruncated: truncateGraphemes(label, TRUNCATION_BUDGET.modelName),
    slug,
    listingCount: agg.listingCount,
    offerCountBare: formatInteger(agg.listingCount),
    ariaLabel: `${label}, ${formatOfferCount(agg.listingCount)}`,
    rangesAvailable,
    price: rangesAvailable ? priceCentralRange(agg.price) : UNAVAILABLE_RANGE,
    priceRawTooltip: rangesAvailable ? priceRawRangeTooltip(agg.price) : undefined,
    year: rangesAvailable ? yearCentralRange(agg.year) : UNAVAILABLE_RANGE,
    mileage: rangesAvailable ? mileageCentralRange(agg.mileage) : UNAVAILABLE_RANGE,
    medianLabel,
    coverage,
    coverageLevel: coverageDiscLevel(coverage),
    coverageTooltip: coverageDiscTooltip(coverage, agg.listingCount, model?.announcedCount ?? null),
    italicizeRanges: shouldItalicizeRanges(coverage),
    relativeShareRatio,
    isSparse: isSparseModel(agg.listingCount),
    rawMetrics: { price: agg.price, year: agg.year, mileage: agg.mileage },
  };
}

/* ================================================================================================
 * Carte-marque — EX-SCR-107..111, 122..129
 * ============================================================================================== */

export interface MakeCardViewModel {
  readonly makeId: number;
  readonly label: string;
  readonly labelTruncated: Truncated;
  readonly slug: string;
  readonly listingCount: number;
  readonly badgeInitials: string;
  readonly badgeColor: string;
  /** `D8-02`/`D8-10` (FV-02) : cardinal publié par le PROVIDER (`MakeAggregate.modelCount`), jamais
   * recompté depuis `modelAggregates` — ce comptage local valait `0` tant que le détail par modèle
   * n'était pas encore chargé pour cette carte, d'où le « 0 modèles » de FV-02. `null` = non calculé
   * par le provider : l'écran affiche alors « — », jamais `0` par défaut (`EX-DATA-71`). */
  readonly modelCount: number | null;
  readonly medianPriceLine: string;
  readonly price: CentralRange;
  readonly priceRawTooltip: string | undefined;
  readonly year: CentralRange;
  readonly coverage: SampleCoverage;
  readonly coverageLevel: CoverageDiscLevel;
  /** Toutes les zones-modèles, triées (`EX-SCR-121`), sparse filtrées si demandé (`EX-SCR-128`). */
  readonly modelZones: readonly ModelZoneViewModel[];
  readonly hiddenSparseCount: number;
  /** Sous-ensemble visible avant/après dépliement (`EX-SCR-122`/`123`). */
  readonly visibleModelZones: readonly ModelZoneViewModel[];
  readonly isExpanded: boolean;
  readonly hasMoreModels: boolean;
  readonly remainingModelCount: number;
  /** `EX-SCR-124` règle 2 (> 12 modèles) et règle 3 (> 30 zones dans la liste dépliée). */
  readonly needsModelSearchField: boolean;
  readonly needsVirtualizedModelList: boolean;
  /** `EX-SCR-132` : agrégat de marque disponible, mais aucun modèle disponible pour elle. */
  readonly modelsUnavailable: boolean;
}

export interface BuildMakeCardOptions {
  readonly make: Make | undefined;
  readonly modelAggregates: readonly ModelAggregate[] | 'unavailable';
  readonly models: ReadonlyMap<number, Model>;
  readonly hasUserFilters: boolean;
  readonly hideSparseModels: boolean;
  readonly isExpanded: boolean;
  readonly modelsVisibleBeforeCollapse: number;
}

export function buildMakeCardViewModel(agg: MakeAggregate, opts: BuildMakeCardOptions): MakeCardViewModel {
  const label = opts.make?.label ?? `Marque ${agg.makeId}`;
  const modelsUnavailable = opts.modelAggregates === 'unavailable';
  const rawModelAggregates = modelsUnavailable ? [] : opts.modelAggregates;

  const maxListingCount = rawModelAggregates.reduce((m, a) => Math.max(m, a.listingCount), 0);
  const sortableModels = rawModelAggregates.map((a) => ({
    modelId: a.modelId,
    label: a.modelId === MODEL_ID_UNRESOLVED ? MODEL_NON_IDENTIFIE_LABEL : (opts.models.get(a.modelId)?.label ?? `Modèle ${a.modelId}`),
    listingCount: a.listingCount,
  }));
  const orderedIds = sortModelRows(sortableModels).map((r) => r.modelId);
  const byModelId = new Map(rawModelAggregates.map((a) => [a.modelId, a] as const));
  const orderedAggregates = orderedIds
    .map((id) => byModelId.get(id))
    .filter((a): a is ModelAggregate => a !== undefined);

  let allZones = orderedAggregates.map((a) => buildModelZoneViewModel(a, opts.models.get(a.modelId), maxListingCount, opts.hasUserFilters));

  const hiddenSparseCount = opts.hideSparseModels ? allZones.filter((z) => z.isSparse).length : 0;
  if (opts.hideSparseModels) allZones = allZones.filter((z) => !z.isSparse);

  // `D8-02`/`D8-10` (FV-02) : le cardinal affiché vient de `agg.modelCount` (publié par le provider
  // pour TOUTE la sélection Σ de la marque), jamais d'un comptage sur `rawModelAggregates` — ce
  // tableau ne porte que les modèles dont le détail a été chargé pour CETTE carte, ce qui vaut `0`
  // avant ce chargement et produisait le « 0 modèles » de FV-02. `null` (non calculé) → « — »,
  // jamais `0` par défaut.
  const modelCount = agg.modelCount;
  const modelCountLabel = modelCount === null ? '—' : formatInteger(modelCount);

  const visibleCount = opts.isExpanded ? allZones.length : Math.min(allZones.length, opts.modelsVisibleBeforeCollapse);
  // EX-SCR-122 : si la marque compte exactement un modèle de plus que le seuil, les deux sont
  // affichés (déplier pour un seul modèle est un clic inutile).
  const effectiveVisibleCount = !opts.isExpanded && allZones.length === opts.modelsVisibleBeforeCollapse + 1 ? allZones.length : visibleCount;
  const visibleModelZones = allZones.slice(0, effectiveVisibleCount);
  const remainingModelCount = allZones.length - visibleModelZones.length;

  return {
    makeId: agg.makeId,
    label,
    labelTruncated: truncateGraphemes(label, TRUNCATION_BUDGET.makeName),
    slug: opts.make?.slug ?? String(agg.makeId),
    listingCount: agg.listingCount,
    badgeInitials: badgeInitials(label),
    badgeColor: badgeColorForMake(agg.makeId),
    modelCount,
    // `EX-SCR-132` (DR-011) : quand le détail par modèle a échoué (`modelsUnavailable`), `modelCount`
    // vaut structurellement 0 alors que l'agrégat de MARQUE (donc `agg.price.p50`) peut, lui, avoir
    // réussi — afficher « 0 modèles · médiane <n> € » serait une valeur affichée CONTRADICTOIRE
    // (0 modèles connus à côté d'une médiane calculée sur des offres forcément réparties dans des
    // modèles). Le nombre de modèles est donc remplacé par une mention d'indisponibilité explicite,
    // jamais par un zéro trompeur ; la médiane, elle, reste publiée quand elle est réellement connue.
    medianPriceLine: modelsUnavailable
      ? (agg.price.p50 !== null
          ? `détail des modèles indisponible · médiane ${formatPrice(agg.price.p50)}`
          : `détail des modèles indisponible`)
      : (agg.price.p50 !== null
          ? `${modelCountLabel} modèles · médiane ${formatPrice(agg.price.p50)}`
          : `${modelCountLabel} modèles · médiane non calculable`),
    price: priceCentralRange(agg.price),
    priceRawTooltip: priceRawRangeTooltip(agg.price),
    year: yearCentralRange(agg.year),
    coverage: sampleCoverageOf(agg.listingCount, opts.make?.announcedCount ?? null, opts.hasUserFilters),
    coverageLevel: coverageDiscLevel(sampleCoverageOf(agg.listingCount, opts.make?.announcedCount ?? null, opts.hasUserFilters)),
    modelZones: allZones,
    hiddenSparseCount,
    visibleModelZones,
    isExpanded: opts.isExpanded,
    hasMoreModels: remainingModelCount > 0,
    remainingModelCount,
    needsModelSearchField: allZones.length > 12,
    needsVirtualizedModelList: allZones.length > 30,
    modelsUnavailable,
  };
}
