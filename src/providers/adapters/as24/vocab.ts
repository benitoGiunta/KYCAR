/**
 * KYCAR — Tables de codes de l'adaptateur `as24 → canonique`
 * =================================================================================================
 * Les colonnes énumérées du lot colonnaire tiennent sur **un octet** (`EX-DATA-119`) : elles ne
 * peuvent pas porter un code canonique (`"B"`, `"12"`, `"BE10"`). La convention de stockage, posée
 * par le lot D3 (`src/providers/synthetic/catalog.ts`) et lue par la compilation de sélection
 * (`selection.ts`) comme par le moteur, est **l'INDICE de la valeur dans `vocabulary.values`**, la
 * sentinelle `255` valant INCONNU (`EX-DATA-120`).
 *
 * Ce module ne réinvente donc rien : il pré-calcule, **une fois par ouverture de snapshot**, la
 * table `code → indice` de chacun des vocabulaires que l'adaptateur écrit. Résoudre un code par
 * `codeIndex` (recherche linéaire) à chaque champ de chaque ligne coûterait, à 20 000 lignes ×
 * 13 colonnes énumérées, plusieurs millions de comparaisons de chaînes sur le chemin critique
 * d'`openSnapshot` — le budget de 2 s d'`EX-NFR-9` ne le supporte pas.
 *
 * La table est construite depuis le MÊME `ReferenceData` que le reste de l'application ; sa
 * cohérence avec `codeIndex` est une sonde de contrat (`tests/contract/`), pas une supposition.
 */

import { codeIndex } from '../../synthetic/catalog';
import type { ReferenceData } from '../../../types/reference';
import type { VocabularyName } from '../../../types/vocabularies';

/**
 * Les treize vocabulaires que l'adaptateur écrit dans une colonne d'un octet, plus
 * `KYCAR_FUEL_TYPE` (# 43, contrôlé mais non transporté) et `KYCAR_EQUIPMENT` / `KYCAR_SEAL`
 * (# 72, # 73, validés puis abandonnés faute de colonne).
 */
export const ADAPTED_VOCABULARIES: readonly VocabularyName[] = [
  'KYCAR_FUEL_CATEGORY',
  'KYCAR_FUEL_TYPE',
  'KYCAR_BODY_TYPE',
  'KYCAR_BODY_COLOR',
  'KYCAR_UPHOLSTERY_TYPE',
  'KYCAR_UPHOLSTERY_COLOR',
  'KYCAR_TRANSMISSION',
  'KYCAR_DRIVETRAIN',
  'KYCAR_OFFER_TYPE',
  'KYCAR_USAGE_STATE',
  'KYCAR_SELLER_TYPE',
  'KYCAR_REGION',
  'KYCAR_MARKETPLACE',
  'KYCAR_PRICE_STATUS',
  'KYCAR_PRICE_EVALUATION',
  'KYCAR_AD_TIER',
  'KYCAR_EU_EMISSION_STANDARD',
  'KYCAR_CO2_CLASS',
  'KYCAR_EFFICIENCY_CLASS',
  'KYCAR_BATTERY_OWNERSHIP',
  'KYCAR_PAINT_TYPE',
  'KYCAR_EQUIPMENT',
  'KYCAR_SEAL',
];

/** Table `code → indice d'octet` d'un vocabulaire, plus le contrôle d'appartenance. */
export interface CodeTable {
  /** Indice d'octet du code, ou `null` s'il n'appartient pas au vocabulaire. */
  index(code: string): number | null;
  /** Vrai si le code appartient au vocabulaire (contrôle sans transport, # 43, # 72, # 73). */
  has(code: string): boolean;
  /** Cardinalité du vocabulaire chargé. */
  readonly size: number;
}

/** Toutes les tables de l'adaptateur, indexées par nom de vocabulaire. */
export type As24CodeTables = ReadonlyMap<VocabularyName, CodeTable>;

function buildTable(ref: ReferenceData, vocabulary: VocabularyName): CodeTable {
  const voc = ref.vocabularies.get(vocabulary);
  if (voc === undefined) {
    throw new Error(`adaptateur as24 : vocabulaire ${vocabulary} absent du référentiel`);
  }
  const byCode = new Map<string, number>();
  voc.values.forEach((value, index) => {
    if (index > 254) {
      // Une colonne d'un octet réserve `255` à l'inconnu : un vocabulaire plus long ne peut pas y
      // tenir. On le signale à la construction plutôt que d'écrire silencieusement une valeur fausse.
      throw new RangeError(
        `adaptateur as24 : ${vocabulary} dépasse 255 valeurs (${voc.values.length}), colonne d'un octet impossible`,
      );
    }
    byCode.set(value.code, index);
  });
  return {
    index: (code) => byCode.get(code) ?? null,
    has: (code) => byCode.has(code),
    size: byCode.size,
  };
}

/**
 * Construit toutes les tables de codes de l'adaptateur. À appeler **une fois** par référentiel
 * (l'adaptateur reçoit ensuite la table dans son contexte) : c'est le seul endroit qui paie la
 * recherche linéaire, et il ne la paie qu'une fois par vocabulaire.
 */
export function buildAs24CodeTables(ref: ReferenceData): As24CodeTables {
  const tables = new Map<VocabularyName, CodeTable>();
  for (const name of ADAPTED_VOCABULARIES) tables.set(name, buildTable(ref, name));
  return tables;
}

/**
 * Contrôle de non-régression, appelé par la suite de contrat : la table pré-calculée rend
 * EXACTEMENT ce que rend `codeIndex`, la définition d'origine de la convention (lot D3). Deux
 * chemins de résolution qui divergeraient écriraient deux encodages différents de la même donnée.
 */
export function tablesAgreeWithCodeIndex(ref: ReferenceData, tables: As24CodeTables): boolean {
  for (const name of ADAPTED_VOCABULARIES) {
    const voc = ref.vocabularies.get(name);
    const table = tables.get(name);
    if (voc === undefined || table === undefined) return false;
    for (const value of voc.values) {
      if (table.index(value.code) !== codeIndex(ref, name, value.code)) return false;
    }
  }
  return true;
}
