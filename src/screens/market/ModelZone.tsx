/**
 * KYCAR — Zone-modèle de l'écran A (lot D6), `EX-SCR-112`..`118`
 * =================================================================================================
 * Composant fin : toute la donnée vient déjà calculée de `view-model.ts` (D5 même convention —
 * aucune règle n'est décidée ici, ce fichier ne fait que la poser dans le DOM). Pas de test DOM
 * (dette signalée, voir `README.md` de ce dossier — même cause que `src/components/filters/` : ni
 * `jsdom` ni `@testing-library/*` dans ce worktree, hors périmètre de ce lot pour les ajouter).
 */
import type { JSX } from 'preact';

import type { ModelZoneViewModel } from './view-model';

export interface ModelZoneProps {
  readonly zone: ModelZoneViewModel;
  /** `EX-SCR-117` : clic sur la bande entière (pas seulement le chevron) -> écran B. */
  readonly onSelect: (makeId: number, modelId: number) => void;
  /** `EX-SCR-118` : case de comparaison, `undefined` si `modelId = 0` (jamais affichée pour la clé
   * réservée). */
  readonly onToggleCompare?: (makeId: number, modelId: number, next: boolean) => void;
  readonly isInCompareSelection: boolean;
  readonly compareAtCapacity: boolean;
}

function coverageDotLabel(zone: ModelZoneViewModel): string {
  return zone.coverageTooltip;
}

export function ModelZone(props: ModelZoneProps): JSX.Element {
  const { zone } = props;
  const canCompare = !zone.isUnresolved;

  return (
    <div
      class={`kycar-market-zone${zone.italicizeRanges ? ' kycar-market-zone--italic' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={zone.ariaLabel}
      onClick={() => props.onSelect(zone.makeId, zone.modelId)}
      onKeyDown={(e: JSX.TargetedKeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          props.onSelect(zone.makeId, zone.modelId);
        }
      }}
    >
      <div class="kycar-market-zone-row1">
        {canCompare && props.onToggleCompare !== undefined ? (
          <input
            type="checkbox"
            aria-label={`Comparer ${zone.label}`}
            checked={props.isInCompareSelection}
            disabled={!props.isInCompareSelection && props.compareAtCapacity}
            title={!props.isInCompareSelection && props.compareAtCapacity ? '4 modèles au maximum — retirez-en un pour en ajouter un autre' : undefined}
            onClick={(e: JSX.TargetedMouseEvent<HTMLInputElement>) => {
              e.stopPropagation();
              props.onToggleCompare?.(zone.makeId, zone.modelId, !props.isInCompareSelection);
            }}
          />
        ) : null}
        <span title={zone.labelTruncated.full}>{zone.labelTruncated.display}</span>
        <span style={{ marginLeft: 'auto' }}>{zone.offerCountBare}</span>
        <span class="kycar-market-zone-chevron" aria-hidden="true">
          ›
        </span>
        {zone.coverageLevel !== 'indisponible' ? (
          <span class={`kycar-market-coverage-dot kycar-market-coverage-dot--${zone.coverageLevel}`} title={coverageDotLabel(zone)} />
        ) : (
          <span class="kycar-market-coverage-dot kycar-market-coverage-dot--indisponible" title={coverageDotLabel(zone)}>
            —
          </span>
        )}
      </div>

      {zone.rangesAvailable ? (
        <div class="kycar-market-zone-ranges">
          <span title={zone.price.caption}>
            {zone.price.label}
            {zone.price.available ? ` (${zone.price.caption})` : ''}
          </span>
          <span title={zone.year.caption}>{zone.year.label}</span>
          <span title={zone.mileage.caption}>{zone.mileage.label}</span>
          <span>{zone.medianLabel}</span>
        </div>
      ) : (
        <div class="kycar-market-zone-ranges">Fourchettes indisponibles — aucune annonce échantillonnée</div>
      )}

      <div class="kycar-market-zone-share-bar" aria-hidden="true">
        <div class="kycar-market-zone-share-bar-fill" style={{ width: `${Math.round(zone.relativeShareRatio * 100)}%` }} />
      </div>
    </div>
  );
}
