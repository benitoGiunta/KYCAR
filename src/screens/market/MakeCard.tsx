/**
 * KYCAR — Carte-marque de l'écran A (lot D6), `EX-SCR-107`..`111`, `122`..`129`, `132`
 * =================================================================================================
 * Composant fin, même convention que `ModelZone.tsx` : aucune règle n'est décidée ici, tout vient de
 * `view-model.ts`. Le champ de recherche de modèle (`EX-SCR-124` règle 2) filtre localement la liste
 * déjà construite — un filtrage de sous-chaîne insensible à la casse/diacritiques, volontairement
 * simple (pas de ré-appel du moteur), cohérent avec le fait que tous les modèles de la marque sont
 * déjà en mémoire (`card.modelZones`).
 */
import { useMemo, useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';

import { ModelZone } from './ModelZone';
import { MODEL_LIST_VIRTUALIZATION_THRESHOLD, MODEL_ZONE_HEIGHT_PX } from './thresholds';
import type { MakeCardViewModel } from './view-model';

export interface MakeCardProps {
  readonly card: MakeCardViewModel;
  readonly isExpanded: boolean;
  readonly onSelectMake: (makeId: number) => void;
  readonly onSelectModel: (makeId: number, modelId: number) => void;
  readonly onToggleExpand: (makeId: number, next: boolean) => void;
  readonly onToggleCompare?: (makeId: number, modelId: number, next: boolean) => void;
  readonly compareSelection: ReadonlySet<string>;
  readonly compareAtCapacity: boolean;
  readonly onRetryModels?: (makeId: number) => void;
}

function normalizeForSearch(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function MakeCard(props: MakeCardProps): JSX.Element {
  const { card } = props;
  const [searchQuery, setSearchQuery] = useState('');

  const displayedZones = useMemo(() => {
    const base = props.isExpanded ? card.modelZones : card.visibleModelZones;
    if (!props.isExpanded || !card.needsModelSearchField || searchQuery.trim() === '') return base;
    const needle = normalizeForSearch(searchQuery);
    return card.modelZones.filter((z) => normalizeForSearch(z.label).includes(needle));
  }, [props.isExpanded, card, searchQuery]);

  /**
   * `EX-SCR-124` règle 3 (ACC-09) — VIRTUALISATION de la liste dépliée au-delà de 30 zones : « au
   * plus 30 nœuds de zone existent simultanément dans le DOM par carte ». Mesuré en recette :
   * Mercedes-Benz, 355 modèles, 356 nœuds montés — le drapeau `needsVirtualizedModelList` existait
   * sans consommateur.
   *
   * Fenêtre glissante sur le DÉFILEMENT INTERNE de la liste (`max-height: 480px`), avec deux cales
   * de hauteur proportionnelle au nombre de zones hors fenêtre : la barre de défilement garde donc
   * la course de la liste ENTIÈRE, et aucune zone n'est rendue inaccessible.
   */
  const listRef = useRef<HTMLDivElement | null>(null);
  const [windowStart, setWindowStart] = useState(0);
  const virtualized = props.isExpanded && card.needsVirtualizedModelList;
  const onListScroll = (e: JSX.TargetedEvent<HTMLDivElement>): void => {
    if (!virtualized) return;
    const first = Math.floor(e.currentTarget.scrollTop / MODEL_ZONE_HEIGHT_PX);
    const maxStart = Math.max(0, displayedZones.length - MODEL_LIST_VIRTUALIZATION_THRESHOLD);
    setWindowStart(Math.max(0, Math.min(maxStart, first)));
  };
  const mountedZones = virtualized
    ? displayedZones.slice(windowStart, windowStart + MODEL_LIST_VIRTUALIZATION_THRESHOLD)
    : displayedZones;
  const zonesAbove = virtualized ? windowStart : 0;
  const zonesBelow = virtualized ? Math.max(0, displayedZones.length - windowStart - mountedZones.length) : 0;

  return (
    <div class="kycar-market-card">
      <div
        class="kycar-market-card-header"
        role="button"
        tabIndex={0}
        onClick={() => props.onSelectMake(card.makeId)}
        onKeyDown={(e: JSX.TargetedKeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            props.onSelectMake(card.makeId);
          }
        }}
      >
        {/* `D8-14` (FV-16/E2E-11) — `color` posé en style INLINE (surclasse `market.css`) : le
            contraste ≥ 4,5:1 dépend de la teinte, calculée par carte, jamais d'une couleur fixe. */}
        <span class="kycar-market-badge" style={{ background: card.badgeColor, color: card.badgeTextColor }} aria-hidden="true">
          {card.badgeInitials}
        </span>
        <span class="kycar-market-card-title" title={card.labelTruncated.full}>
          {card.labelTruncated.display}
        </span>
        <span class="kycar-market-card-count">{card.listingCount}</span>
      </div>

      <div class="kycar-market-card-summary">
        <div>{card.medianPriceLine}</div>
        <div class="kycar-market-card-summary-secondary">
          {card.price.available ? (
            <>
              {card.price.label} ({card.price.caption})
              {card.priceRawTooltip !== undefined ? <span title={card.priceRawTooltip}> · {card.priceRawTooltip}</span> : null}
              {/* `EX-DATA-68` (D8-10) : couverture métrique sous le seuil, provider réel seulement. */}
              {card.price.coverageWarning ? <span class="kycar-market-coverage-warning" title="couverture de cette statistique sous le seuil"> ⚠</span> : null}
            </>
          ) : (
            '—'
          )}
          {card.year.available ? (
            <span>
              {' '}
              · {card.year.label}
              {card.year.coverageWarning ? <span class="kycar-market-coverage-warning" title="couverture de cette statistique sous le seuil"> ⚠</span> : null}
            </span>
          ) : null}
          {/* `EX-SCR-33` (D8-06/FV-09) : même jeton ambre qu'en zone-modèle, au niveau de la carte. */}
          {card.price.lowSampleToken ?? card.year.lowSampleToken ? (
            <span class="kycar-market-low-sample-token" title="effectif réduit — percentiles désactivés">
              {card.price.lowSampleToken ?? card.year.lowSampleToken}
            </span>
          ) : null}
          {/* `EX-DATA-68` (D8-10) : échantillon signalé biaisé par le provider réel. */}
          {card.samplingBias === true ? (
            <span class="kycar-market-sampling-bias" role="note">échantillon possiblement biaisé</span>
          ) : null}
        </div>
      </div>

      {card.modelsUnavailable ? (
        <div class="kycar-market-card-summary">
          Détail par modèle indisponible pour cette marque{' '}
          <button type="button" onClick={() => props.onRetryModels?.(card.makeId)}>
            Réessayer
          </button>
        </div>
      ) : (
        <>
          <div
            ref={listRef}
            class={`kycar-market-zone-list${props.isExpanded ? ' kycar-market-zone-list--expanded' : ''}`}
            onScroll={onListScroll}
          >
            {zonesAbove > 0 ? (
              <div style={{ height: `${zonesAbove * MODEL_ZONE_HEIGHT_PX}px`, flex: '0 0 auto' }} aria-hidden="true" />
            ) : null}
            {mountedZones.map((zone) => (
              <ModelZone
                key={zone.modelId}
                zone={zone}
                onSelect={props.onSelectModel}
                onToggleCompare={props.onToggleCompare}
                isInCompareSelection={props.compareSelection.has(`${zone.makeId}:${zone.modelId}`)}
                compareAtCapacity={props.compareAtCapacity}
              />
            ))}
            {zonesBelow > 0 ? (
              <div style={{ height: `${zonesBelow * MODEL_ZONE_HEIGHT_PX}px`, flex: '0 0 auto' }} aria-hidden="true" />
            ) : null}
          </div>

          {props.isExpanded && card.needsModelSearchField ? (
            <div class="kycar-market-card-footer" style={{ padding: '0 12px' }}>
              <input
                type="search"
                placeholder="Rechercher un modèle"
                aria-label={`Rechercher un modèle de ${card.labelTruncated.full}`}
                value={searchQuery}
                onInput={(e: JSX.TargetedEvent<HTMLInputElement>) => setSearchQuery(e.currentTarget.value)}
              />
              <span>
                {displayedZones.length} modèles sur {card.modelZones.length}
              </span>
            </div>
          ) : null}

          {card.hasMoreModels || props.isExpanded ? (
            <div class="kycar-market-card-footer">
              <button type="button" onClick={() => props.onToggleExpand(card.makeId, !props.isExpanded)}>
                {/* `EX-SCR-122`/`135` (E2E-18) : seuil RÉEL de cette carte, jamais un `6` en dur qui
                    mentirait en régime compact (4). */}
                {props.isExpanded
                  ? `− Réduire à ${Math.min(card.modelZones.length, card.modelsVisibleBeforeCollapse)} modèles`
                  : `+ Afficher les ${card.remainingModelCount} autres modèles`}
              </button>
            </div>
          ) : null}

          {card.hiddenSparseCount > 0 ? (
            <div class="kycar-market-card-summary-secondary" style={{ padding: '0 12px 8px' }}>
              {card.hiddenSparseCount} modèles masqués (moins de 3 offres)
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
