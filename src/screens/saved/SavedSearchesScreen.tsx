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
// `EX-SCR-212` (D8-31) — la description des filtres et le périmètre sont produits par le
// GÉNÉRATEUR DE JETONS déjà en service dans le bandeau de filtres (`EX-SCR-75`), lu ici sans être
// modifié : deux libellés de filtre identiques ne doivent jamais diverger d'un écran à l'autre.
import { buildActiveFilterTokens } from '../../components/filters/labels';
import type { TokenTaxonomyReference } from '../../components/filters/labels';
import { loadQuery } from '../../state/corrections';
import { matchRoute } from '../../state/router';
import { modelKey } from '../../types/reference';
import './saved.css';

/** `EX-SCR-212` — identifiant du filtre taxonomique : ses jetons forment le PÉRIMÈTRE de la carte
 * (`<Marque> <Modèle>`), les autres forment la description des filtres actifs. */
const MMMV_FILTER_ID = 'makesModelsVariants';

/** `EX-SCR-212` — le nom est saisi borné à 60 caractères (`EX-CRUD-2`) ; l'affichage le reborne,
 * pour qu'une entrée écrite par une version antérieure (ou éditée hors application) ne casse pas
 * la carte. */
const NAME_DISPLAY_MAX = 60;

export interface SavedSearchesScreenProps {
  readonly saved: readonly LoadedRecord<SavedSearch>[];
  readonly recent: readonly LoadedRecord<RecentEntry>[];
  /** `EX-CRUD-6` (DR-102) : l'hôte reçoit aussi l'`id` de l'entrée ouverte pour mettre à jour
   * `dernier_accès_le` (`SavedSearchStore.touch`). Absent pour une entrée d'HISTORIQUE, qui n'a pas
   * d'identité persistée. */
  readonly onOpen: (url: string, id?: string) => void;
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
  /** `EX-SCR-213` (D8-31) — `snapshotId` COURANT. L'écart d'effectif n'est affiché que si
   * `snapshotInitial ≠ snapshotId courant` : sur le même snapshot, un écart n'aurait aucun sens.
   * Absent : aucun écart n'est affiché (jamais un `+ 0`). */
  readonly currentSnapshotId?: string;
  /** `EX-SCR-212` (D8-31) — index taxonomiques (`ReferenceData.makeById`/`modelByKey`) pour
   * résoudre le PÉRIMÈTRE `<Marque> <Modèle>` et les jetons `mmmv` de la description. Absent : le
   * générateur retombe sur `Marque nº <id>` (jamais un code nu). */
  readonly taxonomy?: TokenTaxonomyReference;
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

/** `EX-SCR-213` — date courte `JJ/MM` de l'écart (« + 34 offres depuis le 02/09 »). */
function fmtDayMonth(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** `EX-SCR-212` — périmètre et description d'une recherche, DÉRIVÉS de l'URL enregistrée (la seule
 * chose que `SavedSearch` persiste, `EX-CRUD-1` : aucune donnée d'annonce dupliquée). Le décodage
 * passe par le codec canonique de D5 (`loadQuery`, corrections `EX-NAV-21` comprises) puis par le
 * générateur de jetons du bandeau (`buildActiveFilterTokens`) : mêmes libellés qu'ailleurs. */
function describeSearch(
  url: string,
  taxonomy: TokenTaxonomyReference | undefined,
): { readonly perimeter: string; readonly description: string } {
  const cut = url.indexOf('?');
  const path = cut === -1 ? url : url.slice(0, cut);
  const query = cut === -1 ? '' : url.slice(cut + 1);
  const { selection } = loadQuery(query);
  const tokens = buildActiveFilterTokens(selection, taxonomy);
  const scope = tokens.filter((t) => t.filterIds[0] === MMMV_FILTER_ID).map((t) => t.text);
  const rest = tokens.filter((t) => t.filterIds[0] !== MMMV_FILTER_ID).map((t) => t.text);

  // Le périmètre d'une recherche de MODE 2 est porté par le CHEMIN canonique
  // (`/marche/:makeId-:makeSlug/:modelId-:modelSlug`, `EX-NAV-2`), pas par la requête : sans cette
  // lecture, une recherche de mode 2 s'afficherait « Toutes marques », ce qui serait faux.
  const route = matchRoute(path);
  if (route.name === 'modelDistribution' || route.name === 'modelListings') {
    const make = taxonomy?.makeById.get(route.makeId);
    const model = taxonomy?.modelByKey.get(modelKey(route.makeId, route.modelId));
    // Repli sur le SLUG de l'URL (jamais un identifiant nu) tant que la taxonomie n'est pas chargée.
    scope.unshift(`${make?.label ?? route.makeSlug} ${model?.label ?? route.modelSlug}`);
  }

  return {
    // `EX-SCR-212` : « `Toutes marques` ou `<Marque> <Modèle>` ».
    perimeter: scope.length > 0 ? scope.join(' ') : 'Toutes marques',
    // Aucun filtre hors périmètre : la ligne le DIT (EX-SCR-39, aucun état silencieux) plutôt que
    // de laisser une ligne vide dont on ne saurait pas si elle a échoué.
    description: rest.length > 0 ? rest.join(' · ') : 'aucun filtre actif',
  };
}

/** `EX-SCR-212` — nom affiché, borné à 60 caractères. */
function displayName(nom: string): string {
  return nom.length <= NAME_DISPLAY_MAX ? nom : `${nom.slice(0, NAME_DISPLAY_MAX - 1)}…`;
}

function SavedRow(props: {
  readonly record: LoadedRecord<SavedSearch>;
  /** `EX-CRUD-6` (DR-102) : l'hôte reçoit aussi l'`id` de l'entrée ouverte pour mettre à jour
   * `dernier_accès_le` (`SavedSearchStore.touch`). Absent pour une entrée d'HISTORIQUE, qui n'a pas
   * d'identité persistée. */
  readonly onOpen: (url: string, id?: string) => void;
  readonly onRename: (id: string, nom: string) => void;
  readonly onDelete: (id: string) => void;
  /** `EX-SCR-212`/`213` (DR-089). `undefined` = pas encore résolu, `null` = indisponible. */
  readonly currentCount?: number | null;
  /** `EX-SCR-213` (D8-31) — `snapshotId` courant, pour la condition d'affichage de l'écart. */
  readonly currentSnapshotId?: string;
  /** `EX-SCR-212` (D8-31) — index taxonomiques du périmètre et des jetons `mmmv`. */
  readonly taxonomy?: TokenTaxonomyReference;
}): JSX.Element {
  const { value, status } = props.record;
  const [confirming, setConfirming] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(value.nom);
  const badge = schemaBadge(status);
  // `EX-CRUD` : une entrée écrite par une version PLUS RÉCENTE n'est pas ouvrable (son URL peut
  // porter des paramètres que cette version ne sait pas lire). C'est la seule cause de désactivation
  // d'`Ouvrir` : un filtre devenu INVALIDE sur le snapshot courant (`EX-SCR-101`) laisse, lui, la
  // recherche parfaitement ouvrable (`EX-SCR-213`).
  const openable = status.kind !== 'from-newer';
  const { perimeter, description } = describeSearch(value.url, props.taxonomy);

  // `EX-SCR-213` — l'écart n'est affiché QUE si le snapshot a changé ET que l'effectif actuel est
  // calculable ET qu'il diffère de l'effectif initial : jamais `0`, jamais `+ 0`, jamais un
  // pourcentage. Positif en teinte froide, négatif en gris (feuille de style de l'écran).
  const current = props.currentCount;
  const snapshotChanged = props.currentSnapshotId !== undefined && props.currentSnapshotId !== value.snapshotInitial;
  const delta = typeof current === 'number' && snapshotChanged && current !== value.effectifInitial
    ? current - value.effectifInitial
    : null;

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
              <input value={draft} maxLength={NAME_DISPLAY_MAX} onInput={(e) => setDraft((e.target as HTMLInputElement).value)} />
            </label>
            <button type="submit">Valider</button>
            <button type="button" onClick={() => { setRenaming(false); setDraft(value.nom); }}>
              Annuler
            </button>
          </form>
        ) : (
          /* `EX-SCR-212` : le NOM est un texte, l'ouverture est un bouton NOMMÉ `Ouvrir` — un nom
             cliquable ne dit pas ce qu'il fait, et le nom d'une recherche n'est pas une action. */
          <p class="kycar-saved-name" title={value.nom}>
            {displayName(value.nom)}
          </p>
        )}
        {/* `EX-SCR-212` — périmètre puis description générée des filtres actifs (tronquée à 2 lignes
            par `saved.css`, `-webkit-line-clamp`). */}
        <p class="kycar-saved-scope">{perimeter}</p>
        <p class="kycar-saved-description" title={description}>
          {description}
        </p>
        <p class="kycar-saved-meta">
          Mode {value.mode} · {value.effectifInitial.toLocaleString('fr-BE')} offres à la création · créée le{' '}
          {fmtDate(value.creeeLe)}
        </p>
        {/* `EX-SCR-212`/`213` (DR-089) : effectif actuel et écart — la valeur ajoutée de l'écran. */}
        {current === undefined ? (
          <p class="kycar-saved-current kycar-market-skeleton-block" aria-hidden="true" />
        ) : current === null ? (
          <p class="kycar-saved-current">effectif actuel indisponible</p>
        ) : (
          <p class="kycar-saved-current">
            {current.toLocaleString('fr-BE')} offres actuellement
            {delta !== null ? (
              <>
                {' · '}
                <span class={delta > 0 ? 'kycar-saved-delta kycar-saved-delta--up' : 'kycar-saved-delta kycar-saved-delta--down'}>
                  {delta > 0 ? '+' : '−'} {Math.abs(delta).toLocaleString('fr-BE')} offres depuis le {fmtDayMonth(value.creeeLe)}
                </span>
              </>
            ) : null}
          </p>
        )}
        {badge !== null ? <p class="kycar-saved-badge" role="note">{badge}</p> : null}
      </div>
      <div class="kycar-saved-actions no-print">
        <button type="button" class="kycar-saved-open" disabled={!openable} onClick={() => props.onOpen(value.url, value.id)}>
          Ouvrir
        </button>
        <button type="button" onClick={() => setRenaming(true)} disabled={renaming}>
          Renommer
        </button>
        {confirming ? (
          /* `EX-SCR-214` : confirmation EN LIGNE dans la carte, jamais une fenêtre modale. */
          <>
            <span role="alert">Supprimer «&nbsp;{displayName(value.nom)}&nbsp;» ?</span>
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
                currentSnapshotId={props.currentSnapshotId}
                taxonomy={props.taxonomy}
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
