/**
 * KYCAR — Mise en forme fr-BE des valeurs des graphes (lot D7, EX-SCR-2..8)
 * =================================================================================================
 * Formats d'affichage : virgule décimale, espace fin comme séparateur de milliers, unités FR.
 * Module PUR : utilisable par les composants et testable.
 */

const NBSP = ' '; // espace fine insécable (séparateur de milliers fr-BE)

/** Entier avec séparateur de milliers fin. */
export function formatInt(value: number): string {
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

/** Prix en euros (EX-SCR-3). */
export function formatPrice(value: number): string {
  return `${formatInt(value)}${NBSP}€`;
}

/** Kilométrage (EX-SCR-5). */
export function formatKm(value: number): string {
  return `${formatInt(value)}${NBSP}km`;
}

/** Année civile. */
export function formatYear(value: number): string {
  return String(Math.round(value));
}

/** Caractère d'absence normatif (`EX-SCR-34`, `ET-CHAMP-MANQUANT`) — U+2014. */
export const MISSING_VALUE = '—';

/** Domaine plausible d'une année de première immatriculation (`EX-DATA-23` : `1900-01 ≤ v`). */
const FIRST_REG_YEAR_MIN = 1900;
const FIRST_REG_YEAR_MAX = 2100;

/**
 * `firstRegistrationYearMonth` (`12 · année + (mois − 1)`) → `MM/AAAA` (EX-SCR-203).
 *
 * `EX-DATA-23` (D8-31, signalé par fix-engine-2) : une date non parsable vaut `INCONNU`
 * (`NUMERIC_UNKNOWN = −1`) + `FIRST_REG_UNPARSEABLE` à l'ingestion, et une colonne peut porter une
 * valeur résiduelle hors domaine. Sans garde, ce formateur rendait `NaN/NaN` (valeur non finie),
 * `00/-1` (sentinelle) ou `01/0` (année 0) : autant de dates FORGÉES, ce que `EX-SCR-34` interdit —
 * une valeur non renseignée s'affiche `—`, jamais une date que la donnée ne porte pas.
 */
export function formatMonthYear(yearMonth: number): string {
  if (!Number.isInteger(yearMonth) || yearMonth < 0) return MISSING_VALUE;
  const year = Math.floor(yearMonth / 12);
  if (year < FIRST_REG_YEAR_MIN || year > FIRST_REG_YEAR_MAX) return MISSING_VALUE;
  const month = (yearMonth % 12) + 1;
  return `${String(month).padStart(2, '0')}/${year}`;
}

/** Puissance en kW (EX-SCR-7, forme simplifiée). */
export function formatPower(kw: number): string {
  return `${Math.round(kw)}${NBSP}kW`;
}

/** Pourcentage signé (écart au prix attendu). */
export function formatSignedPct(pct: number): string {
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1).replace('.', ',')}${NBSP}%`;
}

/** Consommation combinée, `EX-SCR-8` : 1 décimale, `l/100 km`. `x10` = valeur × 10 du batch
 * (`consumptionCombinedL100KmX10`). */
export function formatConsumption(x10: number): string {
  return `${(x10 / 10).toFixed(1).replace('.', ',')}${NBSP}l/100${NBSP}km`;
}

/** Émissions de CO₂, `EX-SCR-8` : entier, `g/km`. `x10` = valeur × 10 du batch
 * (`co2EmissionsGPerKmX10`). */
export function formatCo2(x10: number): string {
  return `${Math.round(x10 / 10)}${NBSP}g/km`;
}

/** Format d'une borne selon la métrique d'histogramme. */
export function formatMetric(value: number, metric: 'price' | 'year' | 'mileage'): string {
  if (!Number.isFinite(value)) return value > 0 ? '∞' : '−∞';
  if (metric === 'price') return formatPrice(value);
  if (metric === 'mileage') return formatKm(value);
  return formatYear(value);
}
