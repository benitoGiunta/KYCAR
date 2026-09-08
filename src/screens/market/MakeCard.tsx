/**
 * KYCAR — Carte-marque de l'écran A (lot D6), `EX-SCR-107`..`111`, `122`..`129`, `132`
 * =================================================================================================
 * Composant fin, même convention que `ModelZone.tsx` : aucune règle n'est décidée ici, tout vient de
 * `view-model.ts`. Le champ de recherche de modèle (`EX-SCR-124` règle 2) filtre localement la liste
 * déjà construite — un filtrage de sous-chaîne insensible à la casse/diacritiques, volontairement
 * simple (pas de ré-appel du moteur), cohérent avec le fait que tous les modèles de la marque sont
 * déjà en mémoire (`card.modelZones`).
 */
import { useMemo, useState } from 'preact/hooks';
import type { JSX } from 'preact';

import { ModelZone } from './ModelZone';
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
        <span class="kycar-market-badge" style={{ background: card.badgeColor }} aria-hidden="true">
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
            </>
          ) : (
            '—'
          )}
          {card.year.available ? <span> · {card.year.label}</span> : null}
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
          <div class={`kycar-market-zone-list${props.isExpanded ? ' kycar-market-zone-list--expanded' : ''}`}>
            {displayedZones.map((zone) => (
              <ModelZone
                key={zone.modelId}
                zone={zone}
                onSelect={props.onSelectModel}
                onToggleCompare={props.onToggleCompare}
                isInCompareSelection={props.compareSelection.has(`${zone.makeId}:${zone.modelId}`)}
                compareAtCapacity={props.compareAtCapacity}
              />
            ))}
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
                {props.isExpanded ? `− Réduire à ${Math.min(card.modelZones.length, 6)} modèles` : `+ Afficher les ${card.remainingModelCount} autres modèles`}
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
