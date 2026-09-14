/**
 * KYCAR — Écran C, comparaison de modèles (lot D8, EX-CRUD-13bis / EX-NAV-2ter, draft-screens §C)
 * =================================================================================================
 * Comparaison côte à côte de 0 à 4 modèles (plafond `CompareSelection`, ARB-43). La sélection est une
 * entité de SESSION (jamais persistée) portée par la coquille ; cet écran est une fonction pure de
 * ses lignes déjà résolues (agrégats mode 1 par modèle) — il ne possède ni provider ni moteur, même
 * convention que les écrans A/B. Aucune donnée d'annonce individuelle, aucun champ vendeur (R3).
 */
import type { JSX } from 'preact';

import type { MetricRange } from '../../providers/DataProvider';
import { effectifTier } from '../market/thresholds';
import { formatYearRange } from '../market/format';
import './compare.css';

export const COMPARE_MAX_MODELS = 4;

/** `EX-SCR-198` (D8-06/FV-15) — cible de redirection quand la comparaison passe sous 2 modèles :
 * `'market'` (0 modèle restant, écran A) ou `'model'` (1 modèle restant, écran B de ce modèle). */
export type CompareRedirectTarget = { readonly kind: 'market' } | { readonly kind: 'model'; readonly makeId: number; readonly modelId: number };

/** Bin minimal (sous-ensemble de `DistributionBucket`) — assez pour un tracé G1/G3 miniature. */
export interface CompareBucket {
  readonly lowerBound: number;
  readonly upperBound: number;
  readonly count: number;
}

export interface CompareModelRow {
  readonly makeId: number;
  readonly modelId: number;
  readonly name: string;
  readonly listingCount: number;
  readonly price: MetricRange;
  readonly year: MetricRange;
  readonly mileage: MetricRange;
  /** `EX-SCR-196` (DR-088) — buckets G1 (prix) et G3 (année) de la colonne. Absents : la carte
   * rend un cadre vide plutôt qu'un graphe fabriqué (`enterMode2` par modèle, câblage fix-app). */
  readonly priceBuckets?: readonly CompareBucket[];
  readonly yearBuckets?: readonly CompareBucket[];
  /** État de chargement/erreur PAR COLONNE (`EX-SCR-200`, DR-087). `undefined` = chargé (défaut,
   * rétro-compatible avec les appelants qui ne le fournissent pas encore). */
  readonly status?: 'loading' | 'error' | 'ready';
}

export interface CompareScreenProps {
  readonly rows: readonly CompareModelRow[];
  /** Plafond atteint (4) — l'ajout est désactivé ailleurs ; ici on l'indique seulement. */
  readonly atCapacity: boolean;
  readonly onRemove: (makeId: number, modelId: number) => void;
  readonly onOpen: (makeId: number, modelId: number) => void;
  readonly onClearAll: () => void;
  /** `EX-SCR-200`/DR-087 : l'écran attend encore le résultat de `enterMode2` pour au moins un
   * modèle — distinct de « aucun modèle sélectionné » (rows vide sans chargement en cours). */
  readonly loading?: boolean;
  /** `EX-SCR-197` (D8-06/FV-15) — ouvre le sélecteur `G` depuis une colonne vide « + Ajouter un
   * modèle ». Absent : le contrôle reste rendu (désactivé s'il faut) mais inerte. */
  readonly onAddModel?: () => void;
  /** `EX-SCR-198` (D8-06/FV-15) — la comparaison vient de passer SOUS 2 modèles (0 ou 1 restant) :
   * fix-app navigue vers l'écran A (0 restant) ou B du modèle restant (1). `CompareScreen` reste SANS
   * hook (contrainte de `structure.test.ts`, appel direct hors cycle de rendu) : l'appel se fait
   * directement dans le corps de la fonction plutôt que dans un effet, idempotent côté hôte. */
  readonly onRedirect?: (target: CompareRedirectTarget) => void;
}

function fmtRange(r: MetricRange, unit: string): string {
  if (r.p05 === null || r.p95 === null) return '—';
  const f = (n: number): string => new Intl.NumberFormat('fr-BE').format(Math.round(n));
  return `${f(r.p05)} – ${f(r.p95)} ${unit}`.trim();
}

/** `EX-SCR-33` (DR-087) : jeton ambre `n = <n>` pour les paliers `'trop-faible'`/`'reduite'`. */
function nToken(n: number): string | null {
  const tier = effectifTier(n);
  return tier === 'trop-faible' || tier === 'reduite' ? `n = ${n}` : null;
}

/** `EX-SCR-6` (D8-06/FV-14) — année SANS séparateur de milliers : `fmtRange` (générique) en
 * posait un via `Intl.NumberFormat('fr-BE')`, d'où « 2 008 – 2 026 ». `formatYearRange` (déjà
 * partagé avec l'écran A) formate l'année correctement. */
function fmtYearRange(r: MetricRange): string {
  if (r.p05 === null || r.p95 === null) return '—';
  return formatYearRange(r.p05, r.p95);
}

const METRIC_ROWS: ReadonlyArray<{ readonly label: string; readonly render: (r: CompareModelRow) => string }> = [
  { label: 'Nombre d’offres', render: (r) => new Intl.NumberFormat('fr-BE').format(r.listingCount) },
  { label: 'Prix (P05–P95)', render: (r) => fmtRange(r.price, '€') },
  { label: 'Année (P05–P95)', render: (r) => fmtYearRange(r.year) },
  { label: 'Kilométrage (P05–P95)', render: (r) => fmtRange(r.mileage, 'km') },
];

/** Cadre SVG minimal (sans hook, sans `GraphFrame` — celui-ci porte un `useState`, incompatible
 * avec l'appel direct de `CompareScreen` hors cycle de rendu Preact, `structure.test.ts`). */
function MiniHistogram(props: { readonly title: string; readonly buckets: readonly CompareBucket[] | undefined; readonly listingCount: number }): JSX.Element {
  const W = 160;
  const H = 48;
  if (props.listingCount === 0) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${props.title} : aucune offre`}>
        <text x={W / 2} y={H / 2} text-anchor="middle" font-size="9">
          Aucune offre
        </text>
      </svg>
    );
  }
  if (!props.buckets || props.buckets.length === 0) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${props.title} : données indisponibles`}>
        <text x={W / 2} y={H / 2} text-anchor="middle" font-size="9">
          Données indisponibles
        </text>
      </svg>
    );
  }
  const max = Math.max(1, ...props.buckets.map((b) => b.count));
  const w = W / props.buckets.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={props.title}>
      {props.buckets.map((b, i) => {
        const h = (b.count / max) * H;
        return <rect key={i} x={i * w} y={H - h} width={Math.max(1, w - 1)} height={h} fill="var(--color-primary)" fill-opacity={0.7} />;
      })}
    </svg>
  );
}

/** `G5` (DR-088) : les distributions de prix des colonnes superposées sur une ÉCHELLE COMMUNE
 * (`EX-SCR-196` : « échelle commune » — aucune colonne ne peut sinon être comparée visuellement). */
function OverlaidPriceChart(props: { readonly rows: readonly CompareModelRow[] }): JSX.Element {
  const W = 320;
  const H = 64;
  // `EX-SCR-196`/`FV-15` (D8-06) : un bucket ouvert (premier/dernier) porte une borne infinie —
  // `Infinity − Infinity` produit `NaN` dans le calcul du centre si DEUX buckets ouverts de sens
  // opposés participent au même min/max. On ne retient les BORNES DE L'ÉCHELLE et le POINT CENTRAL
  // que parmi les valeurs FINIES ; un bucket ouvert reste tracé (son centre est déjà fini côté
  // opposé), seule l'échelle ignore l'infini.
  const withBuckets = props.rows.filter((r) => r.priceBuckets && r.priceBuckets.length > 0);
  const finiteBounds = withBuckets.flatMap((r) => r.priceBuckets!.flatMap((b) => [b.lowerBound, b.upperBound])).filter((v) => Number.isFinite(v));
  if (withBuckets.length === 0 || finiteBounds.length === 0) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Prix superposés, échelle commune : données indisponibles">
        <text x={W / 2} y={H / 2} text-anchor="middle" font-size="10">
          Données indisponibles
        </text>
      </svg>
    );
  }
  const lo = Math.min(...finiteBounds);
  const hi = Math.max(...finiteBounds);
  const maxCount = Math.max(1, ...withBuckets.flatMap((r) => r.priceBuckets!.map((b) => b.count)));
  const span = hi - lo || 1;
  const colors = ['var(--color-primary)', 'var(--color-secondary, #b3261e)', '#2e7d32', '#f9a825'];
  /** Centre du bucket, écrêté aux bornes finies de l'échelle si l'une des deux extrémités est
   * infinie (bucket ouvert) — jamais `NaN`, jamais hors de la zone de tracé. */
  const centerOf = (b: CompareBucket): number => {
    if (Number.isFinite(b.lowerBound) && Number.isFinite(b.upperBound)) return (b.lowerBound + b.upperBound) / 2;
    if (!Number.isFinite(b.lowerBound)) return lo; // premier bucket, ouvert vers le bas
    return hi; // dernier bucket, ouvert vers le haut
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Prix superposés sur une échelle commune">
      {withBuckets.map((r, ri) => (
        <polyline
          key={`${r.makeId}:${r.modelId}`}
          fill="none"
          stroke={colors[ri % colors.length]}
          stroke-width="1.5"
          points={r
            .priceBuckets!.map((b) => {
              const x = ((centerOf(b) - lo) / span) * W;
              const y = H - (b.count / maxCount) * H;
              return `${x},${y}`;
            })
            .join(' ')}
        />
      ))}
    </svg>
  );
}

export function CompareScreen(props: CompareScreenProps): JSX.Element {
  // `EX-SCR-198` (D8-06/FV-15) : sous 2 modèles, la coquille doit rediriger. `CompareScreen` reste
  // SANS hook (contrainte de test) : l'appel se fait ici, dans le corps de la fonction — l'hôte est
  // responsable de l'idempotence de sa propre navigation (naviguer deux fois vers la même URL est
  // un no-op courant côté routeur).
  if (props.rows.length === 0 && props.loading !== true) {
    props.onRedirect?.({ kind: 'market' });
  } else if (props.rows.length === 1) {
    const only = props.rows[0]!;
    props.onRedirect?.({ kind: 'model', makeId: only.makeId, modelId: only.modelId });
  }

  if (props.rows.length === 0) {
    return (
      <section class="kycar-compare" aria-labelledby="kycar-compare-title">
        <h1 id="kycar-compare-title">Comparer des modèles</h1>
        {props.loading ? (
          <p role="status">Chargement des modèles à comparer…</p>
        ) : (
          <p>
            Aucun modèle sélectionné. Depuis l’écran du marché ou l’écran d’un modèle, cochez la case
            « Comparer » d’un modèle pour l’ajouter ici (jusqu’à 4 modèles).
          </p>
        )}
      </section>
    );
  }

  const allEmpty = props.rows.every((r) => r.listingCount === 0);
  // `EX-SCR-197` (D8-06/FV-15) : les colonnes non pourvues (jusqu'à 4) portent chacune un bloc
  // « + Ajouter un modèle », désactivé au plafond.
  const emptySlots = Math.max(0, COMPARE_MAX_MODELS - props.rows.length);
  const addLabel = '+ Ajouter un modèle';
  const addTitle = props.atCapacity ? '4 modèles au maximum — retirez-en un pour en ajouter un autre' : undefined;

  return (
    <section class="kycar-compare" aria-labelledby="kycar-compare-title">
      <div class="kycar-compare-head">
        <h1 id="kycar-compare-title">Comparer des modèles</h1>
        <button type="button" class="no-print" onClick={props.onClearAll}>
          Tout retirer
        </button>
      </div>
      {props.atCapacity ? (
        <p role="note">4 modèles au maximum — retirez-en un pour en ajouter un autre.</p>
      ) : null}
      {/* `EX-SCR-200` (DR-087, ET-VIDE-FILTRES) : quand TOUTES les colonnes sont à 0, un message
          global remplace la lecture colonne par colonne, mais les colonnes restent affichées. */}
      {allEmpty ? (
        <p role="status">Aucun des modèles comparés n’a d’offre sous ces filtres — élargissez vos critères.</p>
      ) : null}
      <div class="kycar-compare-scroll">
        <table class="kycar-compare-table">
          <caption class="kycar-visually-hidden">
            Comparaison des agrégats de {props.rows.length} modèles
          </caption>
          <thead>
            <tr>
              <th scope="col">Critère</th>
              {props.rows.map((r) => (
                <th scope="col" key={`${r.makeId}:${r.modelId}`}>
                  <span class="kycar-compare-model-name">{r.name}</span>
                  <span class="kycar-compare-model-actions no-print">
                    <button type="button" onClick={() => props.onOpen(r.makeId, r.modelId)}>
                      Ouvrir
                    </button>
                    <button
                      type="button"
                      onClick={() => props.onRemove(r.makeId, r.modelId)}
                      aria-label={`Retirer ${r.name} de la comparaison`}
                    >
                      Retirer
                    </button>
                  </span>
                </th>
              ))}
              {/* `EX-SCR-197` (D8-06/FV-15) : colonne non pourvue, bloc « + Ajouter un modèle ». */}
              {Array.from({ length: emptySlots }, (_, i) => (
                <th scope="col" key={`empty-${i}`} class="kycar-compare-empty-col">
                  <button type="button" class="no-print" onClick={props.onAddModel} disabled={props.atCapacity} title={addTitle}>
                    {addLabel}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* G1 — distribution de prix par colonne. Appelées en fonctions PLUTÔT QU'EN JSX
                (`{MiniHistogram(...)}` et non `<MiniHistogram/>`) : ce module n'a aucun rendu réel
                (Preact) dans ce lot — `CompareScreen` lui-même est appelé comme une fonction pure
                par ses tests (`structure.test.ts`) ; un composant enfant en JSX resterait un VNode
                de type fonction jamais expansé, invisible à l'inspection de l'arbre. */}
            <tr>
              <th scope="row">Distribution des prix (G1)</th>
              {props.rows.map((r) => (
                <td key={`${r.makeId}:${r.modelId}`}>
                  {MiniHistogram({ title: `Prix — ${r.name}`, buckets: r.priceBuckets, listingCount: r.listingCount })}
                </td>
              ))}
              {Array.from({ length: emptySlots }, (_, i) => (
                <td key={`empty-${i}`} class="kycar-compare-empty-col" aria-hidden="true" />
              ))}
            </tr>
            {/* G3 — distribution d'année par colonne. */}
            <tr>
              <th scope="row">Distribution des années (G3)</th>
              {props.rows.map((r) => (
                <td key={`${r.makeId}:${r.modelId}`}>
                  {MiniHistogram({ title: `Année — ${r.name}`, buckets: r.yearBuckets, listingCount: r.listingCount })}
                </td>
              ))}
              {Array.from({ length: emptySlots }, (_, i) => (
                <td key={`empty-${i}`} class="kycar-compare-empty-col" aria-hidden="true" />
              ))}
            </tr>
            {/* G5 — prix superposés, échelle commune. */}
            <tr>
              <th scope="row">Prix superposés (G5, échelle commune)</th>
              <td colSpan={props.rows.length + emptySlots}>{OverlaidPriceChart({ rows: props.rows })}</td>
            </tr>
            {/* Synthèse — les agrégats bruts, une ligne par métrique. */}
            {METRIC_ROWS.map((mr) => (
              <tr key={mr.label}>
                <th scope="row">{mr.label}</th>
                {props.rows.map((r) => {
                  const metricRange = mr.label.startsWith('Prix') ? r.price : mr.label.startsWith('Année') ? r.year : mr.label.startsWith('Kilométrage') ? r.mileage : null;
                  const token = metricRange ? nToken(metricRange.n) : null;
                  const emptyCol = r.listingCount === 0;
                  return (
                    <td key={`${r.makeId}:${r.modelId}`}>
                      {emptyCol ? 'aucune offre' : mr.render(r)}
                      {token ? <span class="kycar-compare-amber"> ({token})</span> : null}
                    </td>
                  );
                })}
                {Array.from({ length: emptySlots }, (_, i) => (
                  <td key={`empty-${i}`} class="kycar-compare-empty-col" aria-hidden="true" />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
