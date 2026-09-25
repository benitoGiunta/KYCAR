/**
 * KYCAR — Cartes du panneau « Tous les filtres » (`D3-46` (b), `[amendée 3.6 — D3-46]` d'`EX-SCR-55`)
 * =================================================================================================
 * Remplace l'accordéon vertical des groupes secondaires (ancien `SecondaryGroups.tsx`) : une CARTE
 * par groupe — la carte « Essentiels » (primaires hors barre condensée) puis les 13 groupes
 * secondaires d'`EX-SCR-93` —, disposées en grille CSS `repeat(auto-fill, minmax(280px, 1fr))` sur
 * toute la largeur de l'écran, jamais de défilement horizontal (une colonne en régime compact).
 *
 * Ce qui ne change pas : chaque carte est un `<fieldset>` avec `<legend>` (`EX-SCR-99`), repliée par
 * défaut sauf si elle porte un filtre actif (`EX-SCR-92`), et `Tab` ne pénètre jamais une carte
 * repliée — son contenu n'est simplement pas rendu. Chaque en-tête porte le badge « <n> actifs » et
 * le bouton « Réinitialiser » de la carte (`EX-SRCH-19`, `DR-061`).
 *
 * Toutes les valeurs affichées sont celles du BROUILLON (`D3-46` (c)) : `onChange` et
 * `onResetCard` écrivent dans le brouillon, rien n'est appliqué avant « Appliquer ».
 */
import { buildFilterCards, isControlDisabled, ESSENTIALS_CARD_KEY, type BandRegime } from './band-model';
import { FilterFieldRow, isConsumedElsewhere } from './FilterFieldRow';
import { PrimaryLine } from './PrimaryLine';
import type { ScreenMode, SelectionState } from '../../state/filter-types';
import type { FacetCounts, OnFilterChange } from './types';

export interface FilterCardsProps {
  readonly mode: ScreenMode;
  readonly regime: BandRegime;
  /** Sélection BROUILLON (`D3-46` (c)). */
  readonly selection: SelectionState;
  /** Cartes dépliées (clés de groupe, plus `ESSENTIALS_CARD_KEY`). */
  readonly expandedCards: ReadonlySet<string>;
  readonly facetCounts?: ReadonlyMap<string, FacetCounts>;
  readonly facetCountsPending?: boolean;
  readonly onToggleCard: (key: string) => void;
  readonly onChange: OnFilterChange;
  readonly onResetCard: (filterIds: readonly string[]) => void;
  readonly onOpenScreenG: () => void;
  readonly screenGSummary: string;
}

export function FilterCards({
  mode,
  regime,
  selection,
  expandedCards,
  facetCounts,
  facetCountsPending,
  onToggleCard,
  onChange,
  onResetCard,
  onOpenScreenG,
  screenGSummary,
}: FilterCardsProps) {
  const compact = regime === 'compact';
  return (
    <div class="kycar-filter-cards kycar-secondary-groups">
      {buildFilterCards(selection, regime).map((card) => {
        const expanded = expandedCards.has(card.key);
        const bodyId = `kycar-filter-card-${card.key}`;
        return (
          <fieldset
            key={card.key}
            class="kycar-filter-card kycar-secondary-group"
            data-card={card.key}
            data-expanded={expanded ? 'true' : 'false'}
          >
            <legend>
              <button
                type="button"
                class="kycar-secondary-group__toggle"
                aria-expanded={expanded}
                aria-controls={bodyId}
                onClick={() => onToggleCard(card.key)}
              >
                {card.label}
                {card.activeCount > 0 ? (
                  <span class="kycar-filter-card__badge">{` ${card.activeCount} actif${card.activeCount > 1 ? 's' : ''}`}</span>
                ) : null}
              </button>
              {card.activeCount > 0 ? (
                <button
                  type="button"
                  class="kycar-secondary-group__reset"
                  aria-label={`Réinitialiser le groupe ${card.label}`}
                  onClick={() => onResetCard(card.resetFilterIds)}
                >
                  Réinitialiser
                </button>
              ) : null}
            </legend>
            {expanded ? (
              <div class="kycar-secondary-group__body" id={bodyId}>
                {card.key === ESSENTIALS_CARD_KEY && card.primaryControls !== undefined ? (
                  <PrimaryLine
                    mode={mode}
                    selection={selection}
                    controls={card.primaryControls}
                    label="Filtres essentiels"
                    facetCounts={facetCounts}
                    facetCountsPending={facetCountsPending}
                    compact={compact}
                    onChange={onChange}
                    onOpenScreenG={onOpenScreenG}
                    screenGSummary={screenGSummary}
                  />
                ) : (
                  (card.defs ?? [])
                    .filter((d) => !isConsumedElsewhere(d) && d.control !== 'none')
                    .map((def) => (
                      <FilterFieldRow
                        key={def.id}
                        def={def}
                        mode={mode}
                        selection={selection}
                        disabled={isControlDisabled(def, selection, mode)}
                        disabledReason={def.disabledReason}
                        facetCounts={facetCounts?.get(def.id)}
                        facetCountsPending={facetCountsPending}
                        compact={compact}
                        onChange={onChange}
                      />
                    ))
                )}
              </div>
            ) : null}
          </fieldset>
        );
      })}
    </div>
  );
}
