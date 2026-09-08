import { describe, expect, it } from 'vitest';
import {
  INGEST_FLAG_VALUES,
  MARKETPLACE_VALUES,
  OUTLIER_FLAG_VALUES,
  VOCABULARY_NAMES,
} from '../../../src/types/vocabularies';
import { LISTING_COLUMN_BY_NAME } from '../../../src/types/columns';
import * as types from '../../../src/types/index';

/**
 * Sonde de revue D2 — points ouverts O13 (drapeaux d'ingestion), O16 (13 vs 14 entités) et cas
 * pathologiques ADV-15 (9ᵉ marketplace), ADV-17/18 (`modelVersionClean` / `modelVersionRaw`).
 * Les points ouverts sont INSTRUITS (faits établis), jamais tranchés ici.
 */

describe('D2 — O13 : drapeaux d’ingestion réellement définis et leur encodage', () => {
  it('fait 1 — `INGEST_FLAG_VALUES` porte 17 codes (EX-DATA-45 après ARB-16/54/60)', () => {
    expect(INGEST_FLAG_VALUES).toHaveLength(17);
    expect(INGEST_FLAG_VALUES.map((v) => v.code)).toContain('PRICE_OUT_OF_RANGE'); // ARB-16
    expect(INGEST_FLAG_VALUES.map((v) => v.code)).toContain('DUPLICATE_VALUE_CONFLICT'); // ARB-54
    expect(INGEST_FLAG_VALUES.map((v) => v.code)).toContain('MARKETPLACE_UNMAPPED'); // ARB-60
    // `PRICE_IMPLAUSIBLE_IN_CELL` est un verdict d'analyse, jamais un drapeau (R-A06).
    expect(INGEST_FLAG_VALUES.map((v) => v.code)).not.toContain('PRICE_IMPLAUSIBLE_IN_CELL');
  });

  it('fait 2 — l’encodage est POSITIONNEL : la colonne `ingestFlags` est un bitset 16 bits', () => {
    expect(LISTING_COLUMN_BY_NAME.get('ingestFlags')?.physical).toBe('bitset16');
    expect(LISTING_COLUMN_BY_NAME.get('booleanFlags')?.physical).toBe('bitset16');
  });

  it('R-D2-18 — les 17 drapeaux tiennent dans le `Uint16Array` gelé (16 bits)', () => {
    // `src/engine/flags.ts` fixe « position de bit = index dans INGEST_FLAG_VALUES » et lève une
    // erreur au-delà du bit 15. Le 17ᵉ code (index 16) est donc INSTOCKABLE.
    const debordent = INGEST_FLAG_VALUES.map((v, i) => ({ code: v.code, bit: i })).filter((x) => x.bit > 15);
    expect(debordent.map((x) => x.code)).toEqual([]);
  });

  it('fait 3 — le drapeau qui déborde est exactement celui qu’exige ARB-60 pour ADV-15', () => {
    expect(INGEST_FLAG_VALUES[16]?.code).toBe('MARKETPLACE_UNMAPPED');
  });
});

describe('D2 — ADV-15 / ARB-60 : KYCAR_MARKETPLACE n=9 contre 8 codes pays traduits', () => {
  it('fait — le vocabulaire porte 9 valeurs dont 8 marchés nommés et un code réservé', () => {
    expect(MARKETPLACE_VALUES).toHaveLength(9);
    expect(MARKETPLACE_VALUES.map((v) => v.code)).toEqual([
      'be', 'nl', 'de', 'at', 'es', 'fr', 'it', 'lu', 'UNKNOWN_9',
    ]);
  });

  it('fait — le 9ᵉ code n’est pas deviné : il porte un code réservé et un libellé explicite', () => {
    expect(MARKETPLACE_VALUES[8]?.code).toBe('UNKNOWN_9');
    expect(MARKETPLACE_VALUES[8]?.label).toMatch(/non identifié/i);
  });

  it('R-D2-18 (ADV-15) — le repli d’ARB-60 (MARKETPLACE_UNMAPPED) est stockable dans `ingestFlags`', () => {
    const bit = INGEST_FLAG_VALUES.findIndex((v) => v.code === 'MARKETPLACE_UNMAPPED');
    expect(bit).toBeGreaterThanOrEqual(0);
    expect(bit).toBeLessThanOrEqual(15);
  });
});

describe('D2 — O16 : décompte des entités typées (EX-DATA-105)', () => {
  it('fait — les 14 concepts NOMMÉS par la table d’EX-DATA-105 sont tous typés par D2', () => {
    // Contrôle par exécution : chaque nom est exporté (type ou valeur) par le barrel `src/types`.
    // Les types purs ne survivent pas à l'exécution ; on contrôle donc le texte du barrel.
    const barrel = import.meta.glob('../../../src/types/index.ts', {
      eager: true,
      query: '?raw',
      import: 'default',
    });
    const src = String(Object.values(barrel)[0] ?? '');
    const nommées = [
      'Snapshot', 'Listing', 'Make', 'Model', 'Enumeration', 'EnumValue', 'Region',
      'PostalRegionRange', 'MakeAggregate', 'ModelAggregate', 'DistributionBucket',
      'SelectionStats', 'OutlierVerdict', 'DensityCell',
    ];
    expect(nommées).toHaveLength(14);
    for (const nom of nommées) {
      expect(new RegExp(`\\b${nom}\\b`).test(src), `entité ${nom} réexportée par le barrel`).toBe(true);
    }
  });

  it('fait — le barrel exporte aussi les 27 noms de vocabulaire et les 8 contrôles d’invariant', () => {
    expect(VOCABULARY_NAMES).toHaveLength(27);
    expect(OUTLIER_FLAG_VALUES).toHaveLength(6);
    for (const id of ['checkI1', 'checkI2', 'checkI3', 'checkI4', 'checkI5', 'checkI6', 'checkI7', 'checkI8']) {
      expect(typeof (types as unknown as Record<string, unknown>)[id]).toBe('function');
    }
  });
});

describe('D2 — ADV-17 / ARB-61 : troncature de `modelVersionClean` à 80 caractères', () => {
  it('R-D2-19 — la troncature à 80 caractères (repli dur sans espace) est implémentée dans D2', () => {
    // ARB-61 impose : dernier espace d'index < 80 ; à défaut, troncature dure à exactement 80,
    // sans couper un groupe de graphèmes. Aucun symbole de D2 ne porte cette règle ni la limite.
    const sources = import.meta.glob('../../../src/types/*.ts', {
      eager: true,
      query: '?raw',
      import: 'default',
    });
    const porteurs = Object.entries(sources)
      .filter(([p]) => !p.endsWith('.test.ts'))
      .filter(([, s]) => /\b80\b/.test(String(s)));
    expect(porteurs.map(([p]) => p)).not.toEqual([]);
  });

  it('R-D2-20 — les longueurs maximales du dictionnaire sont exprimées et contrôlables', () => {
    // Annexe A : `modelVersionRaw` chaîne(121), `modelVersionClean` chaîne(80),
    // `fuelSourceLabelRaw` chaîne(160), `listingUrl` chaîne(512), `trimTokens` 0..12 × 24.
    const bounds = (types as unknown as Record<string, unknown>)['LISTING_STRING_BOUNDS'];
    expect(bounds).toBeDefined();
  });
});

describe('D2 — ADV-18 / ARB-62 : `modelVersionRaw` est du texte non maîtrisé', () => {
  it('fait — la colonne existe, hors chemin chaud, sans vocabulaire (jamais décodée)', () => {
    const c = LISTING_COLUMN_BY_NAME.get('modelVersionRaw');
    expect(c?.physical).toBe('string');
    expect(c?.hotPath).toBe(false);
    expect(c?.vocabulary).toBeNull();
    const f = LISTING_COLUMN_BY_NAME.get('fuelSourceLabelRaw');
    expect(f?.vocabulary).toBeNull();
  });

  it('fait — aucun module de `src/types` ne rend de balisage (innerHTML / dangerouslySetInnerHTML)', () => {
    const sources = import.meta.glob('../../../src/types/*.ts', {
      eager: true,
      query: '?raw',
      import: 'default',
    });
    for (const [path, s] of Object.entries(sources)) {
      expect(/innerHTML|dangerouslySetInnerHTML/.test(String(s)), path).toBe(false);
    }
  });
});
