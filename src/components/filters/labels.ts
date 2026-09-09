/**
 * KYCAR — Résolution de libellés fr-BE et jetons de filtres actifs (lot D5, finition)
 * =================================================================================================
 * Aucune valeur affichée par ce module ne provient directement d'un code brut de vocabulaire :
 * chaque libellé transite par `FilterDef.options` (déjà résolu en français par
 * `filter-registry.ts`, lui-même sourcé sur la table de surcharge FR d'`EX-NFR-29`) ou par un
 * formatage numérique fr-BE (`Intl.NumberFormat('fr-BE')`). C'est la garantie mesurable
 * d'`EX-NFR-30` : 0 libellé non-français, 0 code brut affiché — vérifiée par
 * `labels.test.ts` sur l'ensemble du registre, pas seulement des exemples choisis.
 *
 * Format des jetons de la ligne « filtres actifs » (`EX-SCR-75`) : implémenté ici pour ce qui est
 * énuméré normativement (énumération 1/2/≥3 valeurs, intervalle deux/une borne, booléen) ; les
 * filtres texte/géographique/structuré reçoivent un format de repli raisonnable, non normatif au
 * même degré (dette signalée dans le rapport de lot).
 */

import type { FilterDef, FilterValue, SelectionState, SemanticsWarning } from '../../state/filter-types';
import { FILTER_BY_ID } from '../../state/filter-registry';
import { modelKey, type ReferenceData } from '../../types/reference';

/** Sous-ensemble de `ReferenceData` (D2) requis pour résoudre les libellés taxonomiques d'un jeton
 * `mmmv` (`D8-04d`) — ce module n'a besoin ni des vocabulaires ni des régions du référentiel
 * complet, seulement des deux index marque/modèle déjà construits par `buildReferenceData`. */
export type TokenTaxonomyReference = Pick<ReferenceData, 'makeById' | 'modelByKey'>;

const NUMBER_FORMAT = new Intl.NumberFormat('fr-BE');
/** Formateur d'année DÉDIÉ (`FV-14`, `EX-SCR-6`/`75` : « Première immatriculation : 2015 », jamais
 * « 2 015 ») : `useGrouping: false` retire l'espace fine insécable de séparation des milliers que
 * `NUMBER_FORMAT` applique par défaut en fr-BE dès 1000 — correct pour un prix ou un kilométrage,
 * faux pour une année. `formatNumberFr` route ici dès que `unit === 'année'`. */
const YEAR_FORMAT = new Intl.NumberFormat('fr-BE', { useGrouping: false });

/** Formate une année SANS séparateur de milliers (`FV-14`) — utilisé par `formatNumberFr` pour
 * tout filtre à `unit: 'année'` (`dateOfRegistrationFrom/To`, `dateOfModelYearFrom/To`), et
 * réexporté pour un formatage direct hors jeton (ex. `CompareScreen.tsx`, fix-screens). */
export function formatYear(n: number): string {
  return YEAR_FORMAT.format(n);
}

/** Suffixe d'unité affiché après un nombre formaté (`EX-SRCH-11bis`). Vide = aucun suffixe (ex. une
 * année ne porte pas d'unité). Jamais un code brut : ce sont des mots français fixes. */
const UNIT_SUFFIX: Readonly<Record<string, string>> = {
  EUR: ' €',
  'EUR/mois': ' €/mois',
  km: ' km',
  'km/an': ' km/an',
  mois: ' mois',
  cm3: ' cm³',
  année: '',
};

export function formatNumberFr(n: number, unit?: string): string {
  if (unit === 'année') return formatYear(n); // FV-14 : jamais de séparateur de milliers sur une année
  const suffix = unit !== undefined ? (UNIT_SUFFIX[unit] ?? ` ${unit}`) : '';
  return `${NUMBER_FORMAT.format(n)}${suffix}`;
}

/** Résout le libellé français d'UN code d'un filtre énuméré. Ne retourne JAMAIS le code brut : un
 * code absent du domaine du filtre (ne devrait jamais arriver, `corrections.ts` l'aurait déjà
 * retiré) fait échouer bruyamment plutôt que d'afficher un code non traduit — cohérent avec
 * `EX-NFR-30`, qui interdit le repli silencieux sur le code. */
export function resolveOptionLabel(def: FilterDef, code: string): string {
  const opt = def.options?.find((o) => o.code === code);
  if (opt === undefined) {
    throw new Error(
      `labels: code « ${code} » absent du domaine résolu du filtre « ${def.id} » (EX-NFR-30 : ` +
        `aucun repli sur le code brut n'est autorisé — corrections.ts aurait dû le retirer avant l'affichage)`,
    );
  }
  return opt.label;
}

const SEMANTICS_WARNING_TEXT: Readonly<Record<SemanticsWarning, string>> = {
  EQ_AND_PRESUMED: 'Sémantique présumée, non vérifiée à la source',
  AT_LEAST_PRESUMED: 'Sémantique présumée, non vérifiée à la source',
  AT_MOST_PRESUMED: 'Sémantique présumée, non vérifiée à la source',
};

/** Infobulle de l'icône `(?)` d'`EX-SCR-85`, ou `undefined` si le filtre n'en porte pas. */
export function semanticsWarningTooltip(def: FilterDef): string | undefined {
  if (def.semanticsWarning === undefined) return undefined;
  return SEMANTICS_WARNING_TEXT[def.semanticsWarning];
}

/* ================================================================================================
 * Jetons de la ligne des filtres actifs (EX-SCR-75)
 * ============================================================================================== */

/** Une cible de retrait UNITAIRE dans l'infobulle d'un jeton à cardinal (`EX-SCR-76` « en
 * substance », `D-10`, `DR-062`) : chaque valeur de l'énumération porte sa propre croix. */
export interface ActiveFilterRemovalTarget {
  readonly label: string;
  /** Codes que ce retrait unitaire précis enlève du filtre (toujours un sous-ensemble STRICT de
   * `removesCodes` du jeton parent — jamais la totalité, sinon c'est la croix du jeton lui-même). */
  readonly removesCodes: readonly string[];
}

export interface ActiveFilterToken {
  /** Identifiant stable du jeton (id du filtre, ou de la borne basse pour un intervalle). */
  readonly key: string;
  /** Filtre(s) que ce jeton représente (1, ou 2 pour un couple d'intervalle) — pour le retrait. */
  readonly filterIds: readonly string[];
  /** Texte affiché sur le jeton lui-même. */
  readonly text: string;
  /** Énumération complète, à afficher en infobulle uniquement au-delà de 2 valeurs. */
  readonly tooltip?: string;
  /** Codes qu'un clic sur la croix PRINCIPALE du jeton retire — présent pour un jeton d'énumération
   * (`D-10`, `DR-062`) ; absent pour un jeton d'un autre type (le retrait passe alors uniquement
   * par `filterIds`, ex. intervalle, booléen, texte). */
  readonly removesCodes?: readonly string[];
  /** Au-delà de 2 valeurs (`EX-SCR-75`), une cible de retrait par valeur pour l'infobulle du jeton
   * — le retrait unitaire d'`EX-SCR-76` est ainsi satisfait « en substance » sans multiplier les
   * jetons de premier niveau (`D-10`). Absent pour un jeton à 1 ou 2 valeurs (déjà retirables
   * séparément via `removesCodes`/`filterIds` sans infobulle). */
  readonly removalTargets?: readonly ActiveFilterRemovalTarget[];
  /** `D8-04d` (`EX-SCR-75`/`76`, taxonomie) : présent UNIQUEMENT sur le jeton de niveau « modèle »
   * de `mmmv` — un clic sur sa croix ne retire pas le filtre entier (la marque resterait alors
   * indisponible), il le RESTREINT à cette valeur plus étroite (`serializeMmmv(makeId, undefined)`,
   * `make\|\|\|` au sens de `D-09`). Absent partout ailleurs : le retrait standard
   * (`filterIds`/`removesCodes`) s'applique. Retirer le jeton de niveau « marque » (parent) reste
   * un retrait TOTAL — il emporte son descendant, conformément à `EX-SCR-76`. */
  readonly narrowsTo?: { readonly filterId: string; readonly value: FilterValue };
}

function toCodeArray(value: FilterValue): string[] {
  const raw = Array.isArray(value) ? value : [value];
  return raw.map((v) => String(v)).filter((v) => v.length > 0);
}

function formatEnumToken(def: FilterDef, value: FilterValue): ActiveFilterToken | null {
  const codes = toCodeArray(value);
  if (codes.length === 0) return null;
  const labels = codes.map((c) => resolveOptionLabel(def, c));
  // `ARB-12`/`DR-056` : le jeton porte TOUJOURS le libellé du filtre ET sa valeur — jamais la
  // valeur seule, contre-mesure unique du lien tronqué (« Prix : à partir de 50 € », pas « Prix »).
  if (labels.length <= 2) {
    return { key: def.id, filterIds: [def.id], text: `${def.label} : ${labels.join(', ')}`, removesCodes: codes };
  }
  return {
    key: def.id,
    filterIds: [def.id],
    text: `${def.label} : ${labels.length} valeurs`,
    tooltip: labels.join(', '),
    removesCodes: codes,
    // `D-10`/`DR-062` : un jeton UNIQUE portant le cardinal, l'infobulle liste chaque valeur avec
    // sa propre cible de retrait — jamais un jeton de premier niveau par valeur.
    removalTargets: codes.map((code, i) => ({ label: labels[i]!, removesCodes: [code] })),
  };
}

function formatBooleanToken(def: FilterDef, value: FilterValue): ActiveFilterToken | null {
  const code = Array.isArray(value) ? String(value[0] ?? '') : String(value);
  if (code.length === 0 || code !== (def.booleanTrueCode ?? '1')) return null;
  return { key: def.id, filterIds: [def.id], text: def.label };
}

/** Nom du CONCEPT porté par un couple d'intervalle, sans le suffixe directionnel du libellé de sa
 * borne (« Prix de » / « Prix à » → « Prix », « Nombre de portes (min)/(max) » → « Nombre de
 * portes ») — `ARB-12`/`DR-056` : le jeton d'un intervalle porte lui aussi son libellé, pas
 * seulement sa valeur. */
function intervalConceptLabel(fromDef: FilterDef): string {
  return fromDef.label
    .replace(/\s+(de|à)$/i, '')
    .replace(/\s*\((min|max)\)$/i, '');
}

function formatIntervalToken(
  fromDef: FilterDef,
  toDef: FilterDef,
  selection: SelectionState,
): ActiveFilterToken | null {
  const fromRaw = selection[fromDef.id];
  const toRaw = selection[toDef.id];
  const from = typeof fromRaw === 'number' ? fromRaw : undefined;
  const to = typeof toRaw === 'number' ? toRaw : undefined;
  if (from === undefined && to === undefined) return null;
  const unit = fromDef.unit ?? toDef.unit;
  const label = intervalConceptLabel(fromDef);
  if (from !== undefined && to !== undefined) {
    return {
      key: fromDef.id,
      filterIds: [fromDef.id, toDef.id],
      text: `${label} : ${formatNumberFr(from, unit)} – ${formatNumberFr(to, unit)}`,
    };
  }
  if (from !== undefined) {
    return { key: fromDef.id, filterIds: [fromDef.id], text: `${label} : ≥ ${formatNumberFr(from, unit)}` };
  }
  return { key: toDef.id, filterIds: [toDef.id], text: `${label} : ≤ ${formatNumberFr(to as number, unit)}` };
}

function formatTextToken(def: FilterDef, value: FilterValue): ActiveFilterToken | null {
  const text = Array.isArray(value) ? value.join(', ') : String(value);
  if (text.length === 0) return null;
  return { key: def.id, filterIds: [def.id], text: `${def.label} : ${text}` };
}

const MMMV_FILTER_ID = 'makesModelsVariants';

/**
 * `D8-04d` (`EX-SCR-75` « taxonomie → un jeton par niveau, `Opel ×` et `Corsa ×`,
 * indépendamment retirables ») : `mmmv` ne produit PAS un jeton unique portant le bloc brut
 * (`74|2084`, `EX-NFR-30` : jamais un code affiché), mais un jeton PAR NIVEAU, chacun résolu
 * contre le référentiel taxonomique (`ReferenceData`, D2) — jamais le code numérique lui-même.
 *
 * Un bloc unique `makeId` ou `makeId|modelId` (le seul format produit par l'écran G actuel,
 * `screen-g-model.ts#serializeMmmv`) donne 1 ou 2 jetons : la marque (retrait TOTAL, emporte le
 * modèle, `EX-SCR-76`) et, s'il est présent, le modèle (retrait qui NE fait que restreindre à la
 * marque seule — `narrowsTo`, pas une suppression). Une sélection multi-blocs (plusieurs paires
 * marque/modèle) n'est produite par aucun sélecteur actuel : repli sur un jeton unique au
 * cardinal, cohérent avec `mmmvSummary` (`FilterBand.tsx`) — le détail par niveau ne s'applique
 * qu'à UNE sélection active à la fois.
 *
 * `referenceData` absent (référentiel pas encore chargé) : repli sur un espace réservé numéroté
 * (`Marque nº <id>`), jamais le code nu — cohérent avec `EX-NFR-30`, en attendant le chargement.
 */
function formatMmmvTokens(value: FilterValue, referenceData: TokenTaxonomyReference | undefined): ActiveFilterToken[] {
  const blocks = toCodeArray(value);
  if (blocks.length === 0) return [];
  if (blocks.length > 1) {
    return [
      {
        key: MMMV_FILTER_ID,
        filterIds: [MMMV_FILTER_ID],
        text: `Marque / Modèle / Version : ${blocks.length} sélections`,
        removesCodes: blocks,
      },
    ];
  }
  const block = blocks[0]!;
  const [makeIdStr, modelIdStr] = block.split('|');
  const makeId = Number(makeIdStr);
  const make = referenceData?.makeById.get(makeId);
  const makeLabel = make !== undefined ? make.label : `Marque nº ${makeIdStr}`;
  const tokens: ActiveFilterToken[] = [
    { key: `${MMMV_FILTER_ID}:make`, filterIds: [MMMV_FILTER_ID], text: makeLabel },
  ];
  if (modelIdStr !== undefined && modelIdStr.length > 0) {
    const modelIdNum = Number(modelIdStr);
    const model = referenceData?.modelByKey.get(modelKey(makeId, modelIdNum));
    const modelLabel = model !== undefined ? model.label : `Modèle nº ${modelIdStr}`;
    tokens.push({
      key: `${MMMV_FILTER_ID}:model`,
      filterIds: [MMMV_FILTER_ID],
      text: modelLabel,
      narrowsTo: { filterId: MMMV_FILTER_ID, value: String(makeId) },
    });
  }
  return tokens;
}

/**
 * Construit les jetons de la ligne des filtres actifs (`EX-SCR-75`), un par filtre posé (ou par
 * couple d'intervalle). L'ordre suit l'ordre de déclaration du registre (`FILTER_DEFS`), stable.
 * Les valeurs par défaut « non-absence » (`defaultValue`) sont traitées comme non posées, cohérent
 * avec `EX-NAV-8`/`EX-SCR-91` : un filtre à son défaut n'est jamais un jeton actif.
 */
/**
 * `EX-SCR-1`..`4`, `ET-FILTRE-NON-APPLIQUE` (ACC-16) — LIBELLÉ HUMAIN d'un filtre, depuis son
 * identifiant technique. La recette 2.9b a relevé un bandeau qui nommait un filtre par son
 * identifiant de code : « le filtre **gearType** n'a pas pu être appliqué » — l'utilisateur ne
 * connaît que « Boîte de vitesses », le libellé que porte le jeton juste au-dessus.
 *
 * Le libellé vient du registre de filtres (`src/state/filter-registry.ts`, LU sans être modifié) ;
 * un identifiant inconnu du registre est rendu tel quel plutôt que masqué — mieux vaut un mot
 * technique qu'une phrase amputée.
 */
export function filterDisplayLabel(filterId: string): string {
  return FILTER_BY_ID.get(filterId)?.label ?? filterId;
}

/** Idem pour une liste d'identifiants : libellés humains, dans l'ordre reçu, séparés par `, `. */
export function filterDisplayLabels(filterIds: readonly string[]): string {
  return filterIds.map(filterDisplayLabel).join(', ');
}

export function buildActiveFilterTokens(
  selection: SelectionState,
  referenceData?: TokenTaxonomyReference,
): readonly ActiveFilterToken[] {
  const tokens: ActiveFilterToken[] = [];
  const consumed = new Set<string>();

  for (const [id, value] of Object.entries(selection)) {
    if (consumed.has(id)) continue;
    const def = FILTER_BY_ID.get(id);
    if (def === undefined || def.cls === 'D' || def.nonExposed) continue;
    if (def.defaultValue !== undefined && sameCanonical(value, def.defaultValue)) continue;

    if (id === MMMV_FILTER_ID) {
      consumed.add(id);
      tokens.push(...formatMmmvTokens(value, referenceData));
      continue;
    }

    if ((def.scopeType === 'range_min' || def.scopeType === 'range_max') && def.pairedWith !== undefined) {
      const pairDef = FILTER_BY_ID.get(def.pairedWith);
      if (pairDef !== undefined) {
        consumed.add(def.id);
        consumed.add(pairDef.id);
        const [fromDef, toDef] = def.scopeType === 'range_min' ? [def, pairDef] : [pairDef, def];
        const token = formatIntervalToken(fromDef, toDef, selection);
        if (token !== null) tokens.push(token);
        continue;
      }
    }

    consumed.add(def.id);
    let token: ActiveFilterToken | null = null;
    switch (def.scopeType) {
      case 'enum_single':
      case 'enum_multi':
        token = formatEnumToken(def, value);
        break;
      case 'boolean':
        token = formatBooleanToken(def, value);
        break;
      case 'range_min':
      case 'range_max':
      case 'number': {
        // Atteint seulement par une borne SANS jumeau (`leasingYearlyIncludedMileageFrom`, seul
        // `range_min` du registre sans `pairedWith`) : les couples passent tous par
        // `formatIntervalToken` ci-dessus.
        const n = typeof value === 'number' ? value : Array.isArray(value) ? Number(value[0]) : Number(value);
        if (Number.isFinite(n)) {
          const isMax = def.scopeType === 'range_max';
          token = {
            key: def.id,
            filterIds: [def.id],
            text: `${intervalConceptLabel(def)} : ${isMax ? '≤' : '≥'} ${formatNumberFr(n, def.unit)}`,
          };
        }
        break;
      }
      case 'text':
      case 'geo_text':
      case 'structured_multi':
        token = formatTextToken(def, value);
        break;
    }
    if (token !== null) tokens.push(token);
  }

  // Ordre stable = ordre du registre (FILTER_DEFS), pas l'ordre d'insertion de `selection`. Trié
  // par `filterIds[0]` (pas `key`) : les deux jetons de `mmmv` (`makesModelsVariants:make`/`:model`)
  // partagent le même filtre et doivent rester dans leur ordre de production (marque avant
  // modèle) — garanti par la stabilité du tri (ES2019+), puisqu'ils obtiennent alors la même clé.
  const order = new Map(Array.from(FILTER_BY_ID.keys()).map((id, i) => [id, i]));
  return tokens
    .slice()
    .sort((a, b) => (order.get(a.filterIds[0] ?? '') ?? 0) - (order.get(b.filterIds[0] ?? '') ?? 0));
}

/** Longueur maximale du nom prérempli d'`EX-SCR-94` (« limité à 60 caractères »). */
export const SAVE_SEARCH_NAME_MAX_LENGTH = 60;

/**
 * `D8-14`/`D8-19` (`EX-SCR-94`, résidu `DR-139`) : description générée depuis les jetons de
 * filtres actifs (`Opel Corsa · ≤ 20 000 € · Belgique`) — préremplit le champ de nom du formulaire
 * « Enregistrer la recherche », tronquée à `SAVE_SEARCH_NAME_MAX_LENGTH`. Aucune sélection active
 * ⇒ un nom neutre horodaté (même convention que l'ancien nom généré `src/app.tsx`), pour ne
 * jamais préremplir un champ vide.
 */
export function buildSearchDescription(tokens: readonly ActiveFilterToken[], now: Date = new Date()): string {
  if (tokens.length === 0) {
    return `Recherche du ${now.toLocaleDateString('fr-BE')}`;
  }
  const full = tokens.map((t) => t.text).join(' · ');
  return full.length > SAVE_SEARCH_NAME_MAX_LENGTH ? `${full.slice(0, SAVE_SEARCH_NAME_MAX_LENGTH - 1)}…` : full;
}

function sameCanonical(a: FilterValue, b: FilterValue): boolean {
  const ac = toCodeArray(a).slice().sort();
  const bc = toCodeArray(b).slice().sort();
  return ac.length === bc.length && ac.every((v, i) => v === bc[i]);
}
