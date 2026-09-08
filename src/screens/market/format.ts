/**
 * KYCAR — Formats numériques et textuels de l'écran A (lot D6)
 * =================================================================================================
 * Implémente les conventions transverses `EX-SCR-1`..`EX-SCR-13` (`docs/requirements/draft-screens.md`
 * §1.1) telles qu'utilisées par la carte-marque et la zone-modèle. Module PUR, sans dépendance à
 * `src/components/filters/labels.ts` (D5) : ce module-là est un formateur générique pour les jetons de
 * filtre (espace ordinaire avant `€`, pas de fourchette, pas d'arrondi centaine) — les besoins de
 * l'écran A sont plus stricts (NBSP normative, tiret demi-cadratin, arrondi plancher/plafond de
 * fourchette) et sont donc réimplémentés ici plutôt que partagés, pour ne pas faire porter à D5 une
 * règle qui ne le concerne pas.
 *
 * Caractères normatifs : U+202F (espace insécable ÉTROITE, séparateur de milliers, `EX-SCR-1`),
 * U+00A0 (espace insécable normale, devant `€`/`km`, `EX-SCR-3`), U+2013 (tiret demi-cadratin,
 * séparateur de fourchette, `EX-SCR-4`).
 */

const NNBSP = ' '; // espace insécable étroite — séparateur de milliers (EX-SCR-1)
const NBSP = ' '; // espace insécable normale — devant un symbole d'unité (EX-SCR-3/5)
const EN_DASH = '–'; // tiret demi-cadratin — séparateur de fourchette (EX-SCR-4)

const GROUP_FORMAT = new Intl.NumberFormat('fr-BE', { maximumFractionDigits: 0 });

/** Normalise n'importe quel séparateur de groupe retourné par l'ICU de l'environnement vers le
 * U+202F normatif (`EX-SCR-1`) : robuste à une ICU qui renverrait U+00A0 ou une espace ordinaire. */
function toNarrowNbspGroups(formatted: string): string {
  return formatted.replace(/[   ]/g, NNBSP);
}

/** `EX-SCR-1` — entier ≥ 1 000 groupé par 3 avec U+202F. Aucun signe pour un entier négatif n'est
 * spécifié par l'exigence (aucune grandeur de l'écran A n'est négative) ; le formatage reste correct
 * pour compatibilité (`Intl.NumberFormat` gère le signe). */
export function formatInteger(n: number): string {
  return toNarrowNbspGroups(GROUP_FORMAT.format(n));
}

/** Arrondi au plus proche, demi vers l'infini en valeur absolue (`EX-SCR-3` / `EX-DATA-6`).
 * `Math.floor` et toute troncature vers le bas sont interdits par l'exigence. */
export function roundHalfAwayFromZero(n: number): number {
  return n >= 0 ? Math.round(n) : -Math.round(-n);
}

/** `EX-SCR-3` — prix unitaire : `<entier> €`, arrondi `EX-DATA-6`, `€` précédé d'un NBSP. */
export function formatPrice(n: number): string {
  return `${formatInteger(roundHalfAwayFromZero(n))}${NBSP}€`;
}

/** Fourchette générique `<min> – <max> <unité>`, avec collapse sur valeur unique si les deux bornes
 * arrondies coïncident (`EX-SCR-4`/`EX-SCR-5`/`EX-SCR-6`) : le symbole/unité n'apparaît qu'une fois,
 * en fin de chaîne, séparateur U+2013 entouré de NBSP. */
function formatRangeGeneric(lowRounded: number, highRounded: number, unitSuffix: string): string {
  if (lowRounded === highRounded) return `${formatInteger(lowRounded)}${unitSuffix}`;
  return `${formatInteger(lowRounded)}${NBSP}${EN_DASH}${NBSP}${formatInteger(highRounded)}${unitSuffix}`;
}

/** `EX-SCR-4` — fourchette de prix. Les deux bornes suivent l'arrondi de présentation `EX-SCR-3`
 * (au plus proche), PAS le plancher/plafond réservé aux fourchettes de kilométrage. */
export function formatPriceRange(min: number, max: number): string {
  return formatRangeGeneric(roundHalfAwayFromZero(min), roundHalfAwayFromZero(max), `${NBSP}€`);
}

/** `EX-SCR-5` — kilométrage, valeur unitaire : arrondi à la centaine au-dessus de 10 000 km, à
 * l'unité en dessous (au-delà = strictement supérieur, l'exigence emploie « au-dessus de »). */
export function roundMileageUnit(n: number): number {
  if (n > 10000) return Math.round(n / 100) * 100;
  return Math.round(n);
}

export function formatMileage(n: number): string {
  return `${formatInteger(roundMileageUnit(n))}${NBSP}km`;
}

/** `EX-SCR-5` — bornes de fourchette de kilométrage : plancher de centaine (bas), plafond de centaine
 * (haut), TOUJOURS (indépendant du seuil de 10 000 km qui ne s'applique qu'à une valeur unitaire),
 * afin que la fourchette affichée contienne toujours toutes les valeurs observées. */
export function formatMileageRange(min: number, max: number): string {
  const low = Math.floor(min / 100) * 100;
  const high = Math.ceil(max / 100) * 100;
  return formatRangeGeneric(low, high, `${NBSP}km`);
}

/** Une année à 4 chiffres ne prend jamais de séparateur de milliers (`2014`, jamais `2 014`) — à la
 * différence de `formatInteger`, réservé aux grandeurs (prix, km, effectifs). */
function formatYearDigits(year: number): string {
  return String(Math.round(year));
}

/** `EX-SCR-6` — fourchette d'années de première immatriculation, forme `AAAA – AAAA`, collapse sur
 * année unique si les deux bornes coïncident. Aucune unité suffixée (une année ne porte pas d'unité,
 * cf. `labels.ts` de D5, `UNIT_SUFFIX['année'] === ''`). */
export function formatYearRange(minYear: number, maxYear: number): string {
  const low = Math.round(minYear);
  const high = Math.round(maxYear);
  if (low === high) return formatYearDigits(low);
  return `${formatYearDigits(low)}${NBSP}${EN_DASH}${NBSP}${formatYearDigits(high)}`;
}

/** `EX-SCR-6` — année-modèle, qualifiée `mod.` lorsqu'affichée à côté d'une première immatriculation. */
export function formatModelYear(year: number): string {
  return `mod.${NBSP}${formatYearDigits(year)}`;
}

/** `EX-SCR-6` — première immatriculation au format fiche/infobulle `MM/AAAA`. `isoDate` est une
 * chaîne ISO-8601 (`condition.firstRegistrationDate`) ; `null`/invalide suit `EX-SCR-36`/`ET-CHAMP-
 * MANQUANT` au niveau appelant, ce module ne décide pas de ce repli. */
export function formatFirstRegistrationMonthYear(isoDate: string): string {
  const d = new Date(isoDate);
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getUTCFullYear());
  return `${mm}/${yyyy}`;
}

/** `EX-SCR-10` — effectif d'offres : singulier/pluriel, `aucune offre` pour zéro, jamais `0 offre`. */
export function formatOfferCount(n: number): string {
  if (n === 0) return 'aucune offre';
  return `${formatInteger(n)} offre${n > 1 ? 's' : ''}`;
}

/** `EX-SCR-11` — pourcentage entier avec substitutions typographiques `< 1 %` / `> 99 %` sur les
 * bandes ouvertes `]0, 0.5[` et `]99.5, 100[`. N'implémente PAS la méthode du plus grand reste
 * (répartition d'une distribution en plusieurs classes) : l'écran A n'affiche qu'un pourcentage
 * isolé (couverture d'échantillon, `EX-SCR-31`), jamais une répartition à sommer à 100 %. */
export function formatPercent(value: number): string {
  if (value > 0 && value < 0.5) return `<${NBSP}1${NBSP}%`;
  if (value > 99.5 && value < 100) return `>${NBSP}99${NBSP}%`;
  return `${Math.round(value)}${NBSP}%`;
}

/** Budgets de troncature en groupes de graphèmes étendus (`EX-SCR-13`). */
export const TRUNCATION_BUDGET = {
  makeName: 22,
  modelName: 28,
  activeFilterLabel: 34,
  axisLabel: 20,
} as const;

function graphemes(text: string): readonly string[] {
  const SegmenterCtor = (Intl as unknown as { Segmenter?: new (locale: string, opts: { granularity: string }) => { segment(s: string): Iterable<{ segment: string }> } }).Segmenter;
  if (SegmenterCtor !== undefined) {
    const seg = new SegmenterCtor('fr', { granularity: 'grapheme' });
    return Array.from(seg.segment(text), (s) => s.segment);
  }
  // Repli sans Intl.Segmenter : itération par points de code (gère les paires de substituts,
  // pas les clusters combinants complexes — repli documenté, cas rare en fr-BE).
  return Array.from(text);
}

export interface Truncated {
  readonly display: string;
  readonly truncated: boolean;
  /** Texte intégral, à porter dans `title`/`aria-label` (`EX-SCR-13`). */
  readonly full: string;
}

/** `EX-SCR-13` — tronque `text` à `budget` graphèmes étendus, `…` en fin de chaîne, jamais au milieu
 * d'un graphème. Ne coupe jamais un mot par une exigence de ce module : c'est la seule règle publiée. */
export function truncateGraphemes(text: string, budget: number): Truncated {
  const units = graphemes(text);
  if (units.length <= budget) return { display: text, truncated: false, full: text };
  return { display: `${units.slice(0, budget).join('')}…`, truncated: true, full: text };
}
