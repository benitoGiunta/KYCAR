/**
 * KYCAR — Écran E, recherches sauvegardées + historique récent (lot D8, draft-screens §E, EX-CRUD-1..6/11..13)
 * =================================================================================================
 * Liste les recherches nommées (EX-CRUD-1) avec renommage (EX-CRUD-4), suppression inline confirmée
 * (pas de modale bloquante), et l'ouverture (EX-CRUD-6). Panneau latéral « Recherches récentes » :
 * les 10 entrées FIFO (EX-CRUD-11) avec la seule action « Vider l'historique » (EX-CRUD-13), aucune
 * suppression unitaire. Les badges de statut de schéma (EX-CRUD-18) sont rendus tels quels. Fonction
 * pure de ses props ; toute mutation passe par la coquille (qui possède les banques de persistance).
 */
import { useState } from 'preact/hooks';
import type { JSX } from 'preact';

import type { LoadedRecord } from '../../persistence/crud-store';
import type { SavedSearch } from '../../persistence/saved-searches';
import type { RecentEntry } from '../../persistence/recent-history';
import type { SchemaStatus } from '../../persistence/schema';

export interface SavedSearchesScreenProps {
  readonly saved: readonly LoadedRecord<SavedSearch>[];
  readonly recent: readonly LoadedRecord<RecentEntry>[];
  readonly onOpen: (url: string) => void;
  readonly onRename: (id: string, nom: string) => void;
  readonly onDelete: (id: string) => void;
  readonly onClearHistory: () => void;
  /** `EX-SCR-212`/`213` (DR-089) — effectif ACTUEL de chaque recherche (recalculé par l'hôte,
   * `fetchSelectionCount`/`compileSelection`), `null` = indisponible (`ET-ERREUR-PROVIDER`),
   * absent d'une entrée = pas encore résolu (`ET-CHARGE-INIT`, squelette). Distinct de
   * `effectifInitial` (figé à l'enregistrement). */
  readonly currentCountById?: ReadonlyMap<string, number | null>;
  /** `EX-SCR-27bis`-like (DR-089, ET-VIDE-FILTRES) : amorce vers l'écran A depuis l'état vide. */
  readonly onGoToMarket?: () => void;
}

function schemaBadge(status: SchemaStatus): string | null {
  switch (status.kind) {
    case 'current':
    case 'migrated':
      return null;
    case 'legacy-unmigratable':
      return 'à vérifier — enregistrée par une version antérieure de l’application';
    case 'from-newer':
      return 'enregistrée par une version plus récente';
  }
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : new Intl.DateTimeFormat('fr-BE', { dateStyle: 'medium' }).format(d);
}

function SavedRow(props: {
  readonly record: LoadedRecord<SavedSearch>;
  readonly onOpen: (url: string) => void;
  readonly onRename: (id: string, nom: string) => void;
  readonly onDelete: (id: string) => void;
  /** `EX-SCR-212`/`213` (DR-089). `undefined` = pas encore résolu, `null` = indisponible. */
  readonly currentCount?: number | null;
}): JSX.Element {
  const { value, status } = props.record;
  const [confirming, setConfirming] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(value.nom);
  const badge = schemaBadge(status);
  const openable = status.kind !== 'from-newer';

  return (
    <li class="kycar-saved-row">
      <div class="kycar-saved-main">
        {renaming ? (
          <form
            class="kycar-saved-rename no-print"
            onSubmit={(e: Event) => {
              e.preventDefault();
              const clean = draft.trim();
              if (clean.length > 0) props.onRename(value.id, clean);
              setRenaming(false);
            }}
          >
            <label>
              <span class="kycar-visually-hidden">Nouveau nom</span>
              <input value={draft} maxLength={60} onInput={(e) => setDraft((e.target as HTMLInputElement).value)} />
            </label>
            <button type="submit">Valider</button>
            <button type="button" onClick={() => { setRenaming(false); setDraft(value.nom); }}>
              Annuler
            </button>
          </form>
        ) : (
          <button
            type="button"
            class="kycar-saved-open"
            disabled={!openable}
            onClick={() => props.onOpen(value.url)}
          >
            {value.nom}
          </button>
        )}
        <p class="kycar-saved-meta">
          Mode {value.mode} · {value.effectifInitial.toLocaleString('fr-BE')} offres à la création · créée le{' '}
          {fmtDate(value.creeeLe)}
        </p>
        {/* `EX-SCR-212`/`213` (DR-089) : effectif actuel et écart — la valeur ajoutée de l'écran. */}
        {props.currentCount === undefined ? (
          <p class="kycar-saved-current kycar-market-skeleton-block" aria-hidden="true" />
        ) : props.currentCount === null ? (
          <p class="kycar-saved-current">effectif actuel indisponible</p>
        ) : (
          <p class="kycar-saved-current">
            {props.currentCount.toLocaleString('fr-BE')} offres actuellement
            {props.currentCount !== value.effectifInitial ? (
              <> · {props.currentCount > value.effectifInitial ? '+' : ''}{(props.currentCount - value.effectifInitial).toLocaleString('fr-BE')} offres depuis le {fmtDate(value.creeeLe)}</>
            ) : null}
          </p>
        )}
        {badge !== null ? <p class="kycar-saved-badge" role="note">{badge}</p> : null}
      </div>
      <div class="kycar-saved-actions no-print">
        <button type="button" onClick={() => setRenaming(true)} disabled={renaming}>
          Renommer
        </button>
        {confirming ? (
          <>
            <span role="alert">Supprimer&nbsp;?</span>
            <button type="button" onClick={() => props.onDelete(value.id)}>
              Confirmer
            </button>
            <button type="button" onClick={() => setConfirming(false)}>
              Annuler
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirming(true)}>
            Supprimer
          </button>
        )}
      </div>
    </li>
  );
}

export function SavedSearchesScreen(props: SavedSearchesScreenProps): JSX.Element {
  return (
    <section class="kycar-saved" aria-labelledby="kycar-saved-title">
      <div class="kycar-saved-list">
        <h1 id="kycar-saved-title">Recherches sauvegardées</h1>
        {props.saved.length === 0 ? (
          <div class="kycar-saved-empty">
            <p>Aucune recherche enregistrée.</p>
            <p>Enregistrez une recherche depuis le bandeau de filtres, sur l’écran du marché.</p>
            <button type="button" onClick={props.onGoToMarket}>
              Aller au survol du marché
            </button>
          </div>
        ) : (
          <ul class="kycar-saved-rows">
            {props.saved.map((record) => (
              <SavedRow
                key={record.value.id}
                record={record}
                onOpen={props.onOpen}
                onRename={props.onRename}
                onDelete={props.onDelete}
                currentCount={props.currentCountById?.get(record.value.id)}
              />
            ))}
          </ul>
        )}
      </div>

      <aside class="kycar-recent" aria-labelledby="kycar-recent-title">
        <div class="kycar-recent-head">
          <h2 id="kycar-recent-title">Recherches récentes</h2>
          {props.recent.length > 0 ? (
            <button type="button" class="no-print" onClick={props.onClearHistory}>
              Vider l’historique
            </button>
          ) : null}
        </div>
        {props.recent.length === 0 ? (
          <p>Aucune navigation récente.</p>
        ) : (
          <ol class="kycar-recent-rows">
            {props.recent.map((record) => (
              <li key={record.value.visiteLe}>
                <button type="button" onClick={() => props.onOpen(record.value.url)}>
                  {record.value.url}
                </button>
                <span class="kycar-recent-date">{fmtDate(record.value.visiteLe)}</span>
              </li>
            ))}
          </ol>
        )}
      </aside>
    </section>
  );
}
