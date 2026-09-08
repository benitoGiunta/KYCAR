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

/** `firstRegistrationYearMonth` → `MM/AAAA` (EX-SCR-203). */
export function formatMonthYear(yearMonth: number): string {
  const year = Math.floor(yearMonth / 12);
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
