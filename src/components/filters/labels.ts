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

const NUMBER_FORMAT = new Intl.NumberFormat('fr-BE');

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

/**
 * Construit les jetons de la ligne des filtres actifs (`EX-SCR-75`), un par filtre posé (ou par
 * couple d'intervalle). L'ordre suit l'ordre de déclaration du registre (`FILTER_DEFS`), stable.
 * Les valeurs par défaut « non-absence » (`defaultValue`) sont traitées comme non posées, cohérent
 * avec `EX-NAV-8`/`EX-SCR-91` : un filtre à son défaut n'est jamais un jeton actif.
 */
export function buildActiveFilterTokens(selection: SelectionState): readonly ActiveFilterToken[] {
  const tokens: ActiveFilterToken[] = [];
  const consumed = new Set<string>();

  for (const [id, value] of Object.entries(selection)) {
    if (consumed.has(id)) continue;
    const def = FILTER_BY_ID.get(id);
    if (def === undefined || def.cls === 'D' || def.nonExposed) continue;
    if (def.defaultValue !== undefined && sameCanonical(value, def.defaultValue)) continue;

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

  // Ordre stable = ordre du registre (FILTER_DEFS), pas l'ordre d'insertion de `selection`.
  const order = new Map(Array.from(FILTER_BY_ID.keys()).map((id, i) => [id, i]));
  return tokens.slice().sort((a, b) => (order.get(a.key) ?? 0) - (order.get(b.key) ?? 0));
}

function sameCanonical(a: FilterValue, b: FilterValue): boolean {
  const ac = toCodeArray(a).slice().sort();
  const bc = toCodeArray(b).slice().sort();
  return ac.length === bc.length && ac.every((v, i) => v === bc[i]);
}
