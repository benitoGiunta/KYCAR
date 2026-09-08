/**
 * KYCAR — Table de corrections au chargement d'une URL (lot D5)
 * =================================================================================================
 * `EX-NAV-21` : cinq classes de correction, appliquées au chargement d'une URL reçue (deep-link,
 * favori, lien collé). Chaque correction est signalée — « le mot silencieusement est supprimé »
 * (§A.6) — jamais appliquée sans trace : `loadQuery` retourne la liste des corrections effectuées,
 * à charge de l'appelant de les afficher dans le bandeau non bloquant `ET-URL-CORRIGEE` et de
 * réécrire l'URL par `replaceState` (jamais `pushState` — cette fonction ne touche pas l'historique
 * elle-même, voir `history.ts`).
 *
 * Les classes de correction (table `EX-NAV-21`, plus deux ajoutées par la remédiation 2.6) :
 *   1. code énuméré absent du vocabulaire → valeur retirée, les autres valeurs du filtre conservées
 *   2. borne numérique hors domaine → écrêtée à la borne
 *   3. borne numérique non numérique ou vide → paramètre retiré
 *   4. intervalle inversé (reçu dans une URL) → bornes permutées (`EX-NAV-22`)
 *   5. paramètre inconnu de `filters-scope.json` → ignoré et retiré
 *   6. paramètre RÉPÉTÉ dans la requête (`DR-051`) → dernière occurrence retenue, signalée
 *   7. séquence `%` invalide (`DR-136`) → valeur conservée non décodée, signalée
 *
 * Note de conception — pourquoi ce module ne prend PAS `ReferenceData` (D2) en paramètre : tous
 * les domaines nécessaires (codes énumérés, bornes numériques) sont déjà embarqués dans
 * `filter-registry.ts` (voir sa note de lot). La seule validation hors de portée de ce module est
 * référentielle (un `makeId`/`modelId` de `mmmv` existe-t-il réellement dans la taxonomie ?) : elle
 * exige `ReferenceData` et est du ressort du composant appelant (D6/D8), documentée en dette
 * ci-dessous plutôt que devinée.
 */

import { FILTER_BY_ID, FILTER_BY_PARAM, FILTER_DEFS } from './filter-registry';
import type { FilterDef, MutableSelectionState } from './filter-types';
import {
  RAW_PASSTHROUGH_IDS,
  UI_STATE_PARAMS,
  filterDefForParam,
  parseRawQuery,
  splitMultiValue,
  type RawQueryEntry,
} from './url-codec';

export type CorrectionKind =
  | 'UNKNOWN_ENUM_CODE'
  | 'NUMERIC_OUT_OF_DOMAIN'
  | 'NON_NUMERIC_OR_EMPTY'
  | 'INVERTED_INTERVAL'
  | 'UNKNOWN_PARAM'
  | 'DUPLICATE_PARAM'
  | 'MALFORMED_ENCODING';

export interface Correction {
  readonly kind: CorrectionKind;
  readonly param: string;
  /** Message normatif complet, prêt pour le bandeau `ET-URL-CORRIGEE` (`EX-SCR-38bis`). */
  readonly message: string;
}

function pushCorrection(out: Correction[], kind: CorrectionKind, param: string, message: string): void {
  out.push({ kind, param, message });
}

const fmtUnknownCode = (param: string, kept: string): string =>
  `Paramètre « ${param} » corrigé : valeur inconnue retirée, valeur retenue ${kept}`;
const fmtClamped = (param: string, kept: string): string =>
  `Paramètre « ${param} » corrigé : borne ramenée au domaine, valeur retenue ${kept}`;
const fmtNonNumeric = (param: string): string =>
  `Paramètre « ${param} » corrigé : valeur non numérique retirée, valeur retenue aucune`;
const fmtInverted = (param: string, a: string, b: string): string =>
  `Paramètre « ${param} » corrigé : bornes interverties, intervalle retenu ${a} – ${b}`;
const fmtUnknownParam = (param: string): string =>
  `Paramètre « ${param} » corrigé : paramètre inconnu ignoré, valeur retenue aucune`;
const fmtDuplicate = (param: string, kept: string): string =>
  `Paramètre « ${param} » corrigé : occurrences multiples fusionnées, valeur retenue ${kept}`;
const fmtMalformed = (param: string): string =>
  `Paramètre « ${param} » corrigé : séquence d'encodage invalide, valeur conservée telle quelle`;

/* ================================================================================================
 * État d'interface reconnu (non un filtre) — évite qu'un paramètre EX-NAV-10bis soit classé
 * « paramètre inconnu » (classe 5) par simple absence du registre de filtres.
 * ============================================================================================== */

const UI_STATE_PARAM_NAMES: ReadonlySet<string> = new Set(UI_STATE_PARAMS.map((p) => p.param));
const GRAPH_LOG_RE = /^g\d+log$/;

/** Domaine du `sort` d'ÉTAT D'INTERFACE (écran A) — distinct du `sort` FILTRE (`sortTypes`, écran D). */
const UI_SORT_VALUES: ReadonlySet<string> = new Set(['offres', 'median', 'alpha', 'modeles']);
const G4V_VALUES: ReadonlySet<string> = new Set(['a', 'b']);

function isUiStateParam(param: string): boolean {
  return UI_STATE_PARAM_NAMES.has(param) || GRAPH_LOG_RE.test(param);
}

/* ================================================================================================
 * Validation par type de portée
 * ============================================================================================== */

/** Résultat de validation d'UNE valeur brute pour un filtre énuméré/numérique/booléen. */
interface ScalarResult {
  /** `undefined` = valeur retirée (le paramètre entier disparaît pour ce filtre). */
  readonly value: string | undefined;
  readonly correction?: Correction;
}

function validateEnumSingle(def: FilterDef, raw: string): ScalarResult {
  // `DR-052` : un `enum_single` SANS domaine déclaré (seul cas du registre : `atype`, valeur
  // injectée vers la source, `EX-SRCH-18bis`) n'a par construction AUCUN code valide côté
  // application — traité en classe 1 (retiré, signalé), jamais accepté sans validation.
  const known = def.options?.some((o) => o.code === raw) ?? false;
  if (known) return { value: raw };
  return {
    value: undefined,
    correction: { kind: 'UNKNOWN_ENUM_CODE', param: def.param, message: fmtUnknownCode(def.param, 'aucune') },
  };
}

function validateEnumMulti(def: FilterDef, raw: string): { values: string[]; correction?: Correction } {
  const codes = splitMultiValue(raw);
  const knownCodes = new Set((def.options ?? []).map((o) => o.code));
  const kept = codes.filter((c) => knownCodes.has(c));
  if (kept.length === codes.length) return { values: kept };
  return {
    values: kept,
    correction: {
      kind: 'UNKNOWN_ENUM_CODE',
      param: def.param,
      message: fmtUnknownCode(def.param, kept.length > 0 ? kept.join(',') : 'aucune'),
    },
  };
}

function validateBoolean(def: FilterDef, raw: string): ScalarResult {
  const trueCode = def.booleanTrueCode ?? '1';
  if (raw === trueCode) return { value: raw };
  return {
    value: undefined,
    correction: { kind: 'UNKNOWN_ENUM_CODE', param: def.param, message: fmtUnknownCode(def.param, 'aucune') },
  };
}

/** Nombre : classe 3 (non numérique/vide → retiré) puis classe 2 (hors domaine → écrêté). */
function validateNumeric(def: FilterDef, raw: string): ScalarResult {
  if (raw.length === 0 || !/^-?\d+(\.\d+)?$/.test(raw)) {
    return {
      value: undefined,
      correction: { kind: 'NON_NUMERIC_OR_EMPTY', param: def.param, message: fmtNonNumeric(def.param) },
    };
  }
  const n = Number(raw);
  const domain = def.numericDomain;
  if (domain === undefined) return { value: raw };
  let clamped = n;
  if (domain.min !== undefined && clamped < domain.min) clamped = domain.min;
  if (domain.max !== undefined && clamped > domain.max) clamped = domain.max;
  if (clamped === n) return { value: raw };
  return {
    value: String(clamped),
    correction: {
      kind: 'NUMERIC_OUT_OF_DOMAIN',
      param: def.param,
      message: fmtClamped(def.param, String(clamped)),
    },
  };
}

/* ================================================================================================
 * `structured_multi` (`mmmv`, `cat`, `mcat`) — scission par virgule AVANT décodage (`DR-014`)
 * ================================================================================================
 * `EX-SCR-72` échappe une virgule LITTÉRALE de contenu (dans un bloc `version`) en `%2C`, AVANT
 * remise au codec. Cette séquence n'est distinguable d'un séparateur de bloc RÉEL (`EX-NAV-6`) QUE
 * tant que la valeur du paramètre n'a pas encore été décodée dans son ensemble : décoder d'abord
 * (comme le fait `parseRawQuery` pour tout autre paramètre) transforme `%2C` en `,` avant la
 * scission et fusionne à tort les deux blocs. On scinde donc la valeur BRUTE (non décodée) par
 * virgule, puis :
 *   - `makesModelsVariants` (RAW_PASSTHROUGH, `url-codec.ts`) : chaque bloc est repris tel quel,
 *     jamais décodé — symétrique de la sérialisation, qui ne l'encode jamais non plus ;
 *   - `cat`/`mcat` : chaque bloc est individuellement `decodeURIComponent`-é (ils sont, eux,
 *     encodés bloc par bloc à la sérialisation, `encodeValueSegment`).
 * Un seul bloc → valeur scalaire (comme avant) ; plusieurs → tableau (`EX-NAV-6`, multi-valeurs).
 * ============================================================================================== */

const STRUCTURED_MULTI_PARAMS: ReadonlySet<string> = new Set(
  FILTER_DEFS.filter((d) => d.scopeType === 'structured_multi').map((d) => d.param),
);

/** Segmente la requête BRUTE (avant tout décodage global) en valeurs encore encodées, une par
 * paramètre `structured_multi` présent — la dernière occurrence gagne, une correction `DUPLICATE_PARAM`
 * est émise s'il y en avait plusieurs (`DR-051`). */
function extractStructuredMultiRawValues(
  query: string,
  corrections: Correction[],
): ReadonlyMap<string, string> {
  const q = query.startsWith('?') ? query.slice(1) : query;
  const out = new Map<string, string>();
  const counts = new Map<string, number>();
  if (q.length === 0) return out;
  for (const segment of q.split('&')) {
    if (segment.length === 0) continue;
    const eq = segment.indexOf('=');
    const rawParam = eq === -1 ? segment : segment.slice(0, eq);
    let param: string;
    try {
      param = decodeURIComponent(rawParam);
    } catch {
      param = rawParam;
    }
    if (!STRUCTURED_MULTI_PARAMS.has(param)) continue;
    const rawValue = eq === -1 ? '' : segment.slice(eq + 1);
    out.set(param, rawValue);
    counts.set(param, (counts.get(param) ?? 0) + 1);
  }
  for (const [param, count] of counts) {
    if (count > 1) {
      pushCorrection(corrections, 'DUPLICATE_PARAM', param, fmtDuplicate(param, out.get(param) ?? ''));
    }
  }
  return out;
}

function decodeStructuredMultiBlock(block: string): string {
  try {
    return decodeURIComponent(block);
  } catch {
    return block; // séquence invalide isolée : conservée telle quelle plutôt que de tout faire échouer
  }
}

/** Charge la valeur BRUTE (non décodée) d'un paramètre `structured_multi` en scalaire ou tableau. */
function loadStructuredMultiValue(filterId: string, rawValue: string): string | readonly string[] | undefined {
  if (rawValue.length === 0) return undefined;
  const raw = RAW_PASSTHROUGH_IDS.has(filterId);
  const blocks = rawValue
    .split(',')
    .filter((b) => b.length > 0)
    .map((b) => (raw ? b : decodeStructuredMultiBlock(b)));
  if (blocks.length === 0) return undefined;
  return blocks.length === 1 ? blocks[0] : blocks;
}

/* ================================================================================================
 * Paramètre répété (`DR-051`, classe 6 d'`EX-NAV-21`) — hors `structured_multi`, traité ci-dessus
 * ============================================================================================== */

/** Ne garde que la DERNIÈRE occurrence de chaque paramètre (hors `structured_multi`), en signalant
 * chaque paramètre répété une seule fois — « dernière occurrence gagne » ne doit jamais rester
 * silencieux (`A-04`). */
function dedupeEntries(entries: readonly RawQueryEntry[], corrections: Correction[]): RawQueryEntry[] {
  const lastIndexByParam = new Map<string, number>();
  entries.forEach((e, i) => {
    if (STRUCTURED_MULTI_PARAMS.has(e.param)) return; // géré séparément, raw, avant décodage
    lastIndexByParam.set(e.param, i);
  });
  const counts = new Map<string, number>();
  for (const e of entries) {
    if (STRUCTURED_MULTI_PARAMS.has(e.param)) continue;
    counts.set(e.param, (counts.get(e.param) ?? 0) + 1);
  }
  for (const [param, count] of counts) {
    if (count <= 1) continue;
    const kept = entries[lastIndexByParam.get(param)!]!.raw;
    pushCorrection(corrections, 'DUPLICATE_PARAM', param, fmtDuplicate(param, kept));
  }
  const out: RawQueryEntry[] = [];
  entries.forEach((e, i) => {
    if (STRUCTURED_MULTI_PARAMS.has(e.param)) return;
    if (lastIndexByParam.get(e.param) === i) out.push(e);
  });
  return out;
}

/* ================================================================================================
 * Chargement complet d'une requête
 * ============================================================================================== */

export interface LoadedQuery {
  readonly selection: MutableSelectionState;
  readonly uiState: Record<string, string | readonly string[]>;
  readonly corrections: readonly Correction[];
}

/**
 * Charge une requête reçue (deep-link) en appliquant les cinq classes de correction `EX-NAV-21` et
 * la permutation d'intervalle inversé `EX-NAV-22`. Ne touche jamais l'historique ni l'URL affichée
 * — l'appelant réécrit par `replaceState` s'il y a eu au moins une correction.
 */
export function loadQuery(query: string): LoadedQuery {
  const selection: MutableSelectionState = {};
  const uiState: Record<string, string | readonly string[]> = {};
  const corrections: Correction[] = [];

  const structuredRaw = extractStructuredMultiRawValues(query, corrections);
  const entries = dedupeEntries(parseRawQuery(query), corrections);

  for (const { param, raw, malformed } of entries) {
    if (malformed === true) {
      pushCorrection(corrections, 'MALFORMED_ENCODING', param, fmtMalformed(param));
    }

    if (param === 'sort') {
      // Collision de nom assumée (EX-NAV-10bis) : `sort` est soit le filtre `sortTypes` (écran D,
      // AS24), soit l'état d'interface de tri de l'écran A — jamais les deux à la fois puisque les
      // deux routes ne coexistent jamais. Résolu par appartenance au domaine plutôt que par route,
      // pour que ce module reste pur (sans connaître la route courante).
      const sortDef = FILTER_BY_PARAM.get('sort');
      if (sortDef?.options?.some((o) => o.code === raw)) {
        selection[sortDef.id] = raw;
      } else if (UI_SORT_VALUES.has(raw)) {
        uiState.sort = raw;
      } else {
        pushCorrection(corrections, 'UNKNOWN_ENUM_CODE', 'sort', fmtUnknownCode('sort', 'aucune'));
      }
      continue;
    }

    if (param === 'g4v') {
      if (G4V_VALUES.has(raw)) uiState.g4v = raw;
      else pushCorrection(corrections, 'UNKNOWN_ENUM_CODE', 'g4v', fmtUnknownCode('g4v', 'aucune'));
      continue;
    }

    if (isUiStateParam(param)) {
      // `m`, `grp`, `mk`, `selx`, `sely`, `g<n>log` : listes/plages sans domaine propre au
      // registre de filtres (dépendent de la taxonomie ou de l'état de brossage courant) — reprises
      // telles quelles. Validation référentielle (ex. makeId existant) : dette documentée, voir
      // l'en-tête de ce fichier et le rapport de lot.
      const isMulti = param === 'grp' || param === 'mk' || param === 'm';
      uiState[param] = isMulti ? splitMultiValue(raw) : raw;
      continue;
    }

    const def = filterDefForParam(param);
    if (def === undefined) {
      pushCorrection(corrections, 'UNKNOWN_PARAM', param, fmtUnknownParam(param));
      continue;
    }

    switch (def.scopeType) {
      case 'enum_single': {
        const r = validateEnumSingle(def, raw);
        if (r.correction) corrections.push(r.correction);
        if (r.value !== undefined) selection[def.id] = r.value;
        break;
      }
      case 'enum_multi': {
        const r = validateEnumMulti(def, raw);
        if (r.correction) corrections.push(r.correction);
        if (r.values.length > 0) selection[def.id] = r.values;
        break;
      }
      case 'boolean': {
        const r = validateBoolean(def, raw);
        if (r.correction) corrections.push(r.correction);
        if (r.value !== undefined) selection[def.id] = r.value;
        break;
      }
      case 'range_min':
      case 'range_max':
      case 'number': {
        const r = validateNumeric(def, raw);
        if (r.correction) corrections.push(r.correction);
        if (r.value !== undefined) selection[def.id] = Number(r.value);
        break;
      }
      case 'structured_multi':
        // Traité séparément, à partir de la valeur BRUTE non décodée (voir plus haut, `DR-014`) —
        // `raw` ici est déjà passé par le décodage GÉNÉRIQUE de `parseRawQuery`, impropre à la
        // scission par blocs.
        break;
      case 'text':
      case 'geo_text':
        // Aucune classe de correction ne s'applique (texte libre non validé par ce module, voir
        // note de lot). Reçu tel quel.
        if (raw.length > 0) selection[def.id] = raw;
        break;
    }
  }

  for (const [param, rawValue] of structuredRaw) {
    const def = filterDefForParam(param);
    if (def === undefined) continue;
    const value = loadStructuredMultiValue(def.id, rawValue);
    if (value !== undefined) selection[def.id] = value;
  }

  applyIntervalInversionCorrections(selection, corrections);

  return { selection, uiState, corrections };
}

/** `EX-NAV-22` : bornes `from`/`to` inversées reçues dans une URL → permutées, jamais refusées. */
function applyIntervalInversionCorrections(
  selection: MutableSelectionState,
  corrections: Correction[],
): void {
  const seen = new Set<string>();
  for (const def of FILTER_DEFS) {
    if (def.scopeType !== 'range_min' || def.pairedWith === undefined) continue;
    if (seen.has(def.id)) continue;
    const toDef = FILTER_BY_ID.get(def.pairedWith);
    if (toDef === undefined) continue;
    seen.add(def.id);
    seen.add(toDef.id);

    const fromVal = selection[def.id];
    const toVal = selection[toDef.id];
    if (typeof fromVal !== 'number' || typeof toVal !== 'number') continue;
    if (fromVal <= toVal) continue;

    selection[def.id] = toVal;
    selection[toDef.id] = fromVal;
    corrections.push({
      kind: 'INVERTED_INTERVAL',
      param: def.param,
      message: fmtInverted(def.param, String(toVal), String(fromVal)),
    });
  }
}
