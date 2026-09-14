import { describe, expect, it } from 'vitest';

import { readFileSync } from 'node:fs';

import {
  BOOLEAN_FLAG_BIT,
  BOOLEAN_FLAG_BIT_CAPACITY,
  BOOLEAN_FLAG_VALUES,
  MARKETPLACE_VALUES,
  readBooleanFlag,
  setBooleanFlag,
  type BooleanFlagCode,
} from '../../../src/types/vocabularies';
import { LISTING_COLUMN_BY_NAME } from '../../../src/types/columns';

/**
 * Sonde de revue D2 — phase 3.3 (`fixture-provider`).
 *
 * Deux décisions du coordinateur ratifiées dans `reports/data/DATA-LEAD-DECISIONS.md` touchent la
 * couche D2 et n'avaient jusqu'ici AUCUNE sonde :
 *
 *   - **D3-07** (C-01 de `docs/data/DATA-MODEL.md`) : la 9ᵉ valeur de `KYCAR_MARKETPLACE` n'est pas
 *     « non identifiée ». L'OpenAPI VERSIONNÉ DANS LE DÉPÔT
 *     (`docs/reference/vendor/as24-listing-creation-openapi.yml`, `components.schemas.Marketplace`)
 *     énumère `at be ca de es fr it lu nl` : c'est le **Canada**. Le code réservé `UNKNOWN_9` doit
 *     donc disparaître au profit de `ca`, et la table de traduction d'`EX-DATA-40` gagner `ca → CA`.
 *   - **D3-10** (E-07) : les dix booléens du dictionnaire sans colonne propre tiennent EXACTEMENT
 *     dans les 16 bits de la colonne `booleanFlags`, déjà allouée et jamais remplie. La table
 *     bit ↔ champ doit vivre dans `src/types`, source unique du couple (comme `INGEST_FLAG_BIT`,
 *     exigence DR-013), et non dans le provider qui la remplit.
 *
 * Sonde ROUGE d'abord (protocole 2.6 S2 / D-31) : elle échoue sur le code de la phase 2.9 et passe
 * sur celui de la phase 3.3, sans être modifiée.
 */

describe('D2 / D3-07 — la 9ᵉ valeur de KYCAR_MARKETPLACE est `ca` (Canada), prouvée par l’OpenAPI', () => {
  it('R-D2-21 — `MARKETPLACE_VALUES` porte les 9 codes réels, sans code réservé `UNKNOWN_9`', () => {
    const codes = MARKETPLACE_VALUES.map((v) => v.code);
    expect(codes).toHaveLength(9);
    expect(codes).toContain('ca');
    expect(codes).not.toContain('UNKNOWN_9');
    // L'ensemble (non l'ordre) est celui de `components.schemas.Marketplace`.
    expect([...codes].sort()).toEqual(['at', 'be', 'ca', 'de', 'es', 'fr', 'it', 'lu', 'nl']);
  });

  it('R-D2-21b — l’ordre des huit premiers codes est INCHANGÉ : la colonne `countryCode` est positionnelle', () => {
    // La valeur stockée dans la colonne d'un octet est l'INDEX du code dans le vocabulaire
    // (`codeIndex`, `src/providers/synthetic/catalog.ts`). Renuméroter un code déjà servi
    // réinterpréterait silencieusement toutes les lignes déjà encodées : `ca` prend la place 8,
    // celle qu'occupait le code réservé, et aucune autre ne bouge.
    expect(MARKETPLACE_VALUES.slice(0, 8).map((v) => v.code)).toEqual([
      'be', 'nl', 'de', 'at', 'es', 'fr', 'it', 'lu',
    ]);
    expect(MARKETPLACE_VALUES[8]?.code).toBe('ca');
    expect(MARKETPLACE_VALUES[8]?.label).toMatch(/canada/i);
  });

  it('R-D2-21c — la preuve est dans le dépôt : l’OpenAPI énumère bien `ca`', () => {
    const oas = readFileSync(
      new URL('../../../docs/reference/vendor/as24-listing-creation-openapi.yml', import.meta.url),
      'utf-8',
    );
    // Le schéma `Marketplace` énumère les neuf codes ; on contrôle la présence du code litigieux
    // dans une énumération de codes de marché à deux lettres, pas une occurrence quelconque.
    const bloc = /Marketplace:[\s\S]{0,600}?enum:([\s\S]{0,400}?)(?:\n\s{0,4}\w|$)/.exec(oas);
    expect(bloc, 'schéma Marketplace trouvé dans l’OpenAPI').not.toBeNull();
    const valeurs = [...(bloc?.[1] ?? '').matchAll(/-\s*"?([a-z]{2})"?/g)].map((m) => m[1]);
    expect(valeurs).toContain('ca');
    expect(valeurs).toHaveLength(9);
  });
});

describe('D2 / D3-10 — `BOOLEAN_FLAG_BIT` : les dix booléens du dictionnaire dans les 16 bits alloués', () => {
  it('R-D2-22 — la table existe dans `src/types` et couvre les dix champs de E-07', () => {
    expect(BOOLEAN_FLAG_VALUES).toHaveLength(10);
    const codes = BOOLEAN_FLAG_VALUES.map((v) => v.code);
    for (const code of [
      'priceOnRequestOnly', // # 9  — défaut false
      'isSuperDeal', // # 12 — défaut false
      'isNewListing', // # 29 — défaut false
      'hasVideo', // # 81 — défaut false
      'hadAccident', // # 27 — tri-état
      'isPluginHybrid', // # 46 — tri-état
      'hasParticleFilter', // # 58 — tri-état
      'hasFullServiceHistory', // # 61 — tri-état
      'wasCabOrRental', // # 63 — tri-état
      'isMetallic', // # 68 — tri-état
    ]) {
      expect(codes, `booléen ${code} de E-07`).toContain(code);
    }
  });

  it('R-D2-22b — 4 × 1 bit + 6 × 2 bits = 16 bits exactement, sans chevauchement, dans la capacité gelée', () => {
    expect(BOOLEAN_FLAG_BIT_CAPACITY).toBe(16);
    expect(LISTING_COLUMN_BY_NAME.get('booleanFlags')?.physical).toBe('bitset16');

    const occupés = new Set<number>();
    for (const def of BOOLEAN_FLAG_VALUES) {
      const bits = def.kind === 'tristate' ? [def.valueBit, def.knownBit] : [def.valueBit];
      for (const bit of bits) {
        expect(bit, `bit de ${def.code} dans la capacité`).toBeGreaterThanOrEqual(0);
        expect(bit).toBeLessThan(BOOLEAN_FLAG_BIT_CAPACITY);
        expect(occupés.has(bit as number), `bit ${bit} déjà pris`).toBe(false);
        occupés.add(bit as number);
      }
    }
    expect(occupés.size).toBe(16);
  });

  it('R-D2-22c — un tri-état distingue `false` de « inconnu », un booléen à défaut ne le prétend pas', () => {
    // Tri-état : les trois états sont distincts et relisibles.
    let flags = 0;
    expect(readBooleanFlag(flags, 'hadAccident')).toBeNull();
    flags = setBooleanFlag(flags, 'hadAccident', false);
    expect(readBooleanFlag(flags, 'hadAccident')).toBe(false);
    flags = setBooleanFlag(flags, 'hadAccident', true);
    expect(readBooleanFlag(flags, 'hadAccident')).toBe(true);
    // Défaut documenté : l'absence VAUT `false` (annexe A, colonne « Si absent »), jamais `null`.
    expect(readBooleanFlag(0, 'isSuperDeal')).toBe(false);
    expect(readBooleanFlag(setBooleanFlag(0, 'isSuperDeal', true), 'isSuperDeal')).toBe(true);
    // Chaque drapeau est indépendant des neuf autres.
    let tous = 0;
    for (const def of BOOLEAN_FLAG_VALUES) tous = setBooleanFlag(tous, def.code as BooleanFlagCode, true);
    for (const def of BOOLEAN_FLAG_VALUES) {
      expect(readBooleanFlag(tous, def.code as BooleanFlagCode), def.code).toBe(true);
    }
    expect(tous).toBeLessThanOrEqual(0xffff);
    expect(BOOLEAN_FLAG_BIT['hadAccident']).toBe(
      BOOLEAN_FLAG_VALUES.find((v) => v.code === 'hadAccident')?.valueBit,
    );
  });
});
