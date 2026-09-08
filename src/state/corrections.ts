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
 * Les cinq classes (table `EX-NAV-21`) :
 *   1. code énuméré absent du vocabulaire → valeur retirée, les autres valeurs du filtre conservées
 *   2. borne numérique hors domaine → écrêtée à la borne
 *   3. borne numérique non numérique ou vide → paramètre retiré
 *   4. intervalle inversé (reçu dans une URL) → bornes permutées (`EX-NAV-22`)
 *   5. paramètre inconnu de `filters-scope.json` → ignoré et retiré
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
  UI_STATE_PARAMS,
  filterDefForParam,
  parseRawQuery,
  splitMultiValue,
} from './url-codec';

export type CorrectionKind =
  | 'UNKNOWN_ENUM_CODE'
  | 'NUMERIC_OUT_OF_DOMAIN'
  | 'NON_NUMERIC_OR_EMPTY'
  | 'INVERTED_INTERVAL'
  | 'UNKNOWN_PARAM';

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
  const known = def.options?.some((o) => o.code === raw) ?? true; // pas d'options = non énuméré réel (ne devrait pas arriver ici)
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
  const entries = parseRawQuery(query);
  const selection: MutableSelectionState = {};
  const uiState: Record<string, string | readonly string[]> = {};
  const corrections: Correction[] = [];

  for (const { param, raw } of entries) {
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
      case 'text':
      case 'geo_text':
      case 'structured_multi':
        // Aucune classe de correction ne s'applique (texte libre / structuré non validé par ce
        // module, voir note de lot). Reçu tel quel.
        if (raw.length > 0) selection[def.id] = raw;
        break;
    }
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
