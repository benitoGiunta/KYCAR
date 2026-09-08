import { describe, expect, it } from 'vitest';
import { LISTING_COLUMNS, LISTING_COLUMN_BY_NAME } from '../../../src/types/columns';
import { LISTING_NUMERIC_BOUNDS, validateListingRecord } from '../../../src/types/validation';
import { STRINGS_PER_ROW } from '../../../src/providers/DataProvider';

/**
 * Sonde de revue D2 — échantillon de 30 champs de l'annexe A du dictionnaire confronté aux types,
 * sentinelles, unités et bornes de validation de `src/types`.
 *
 * Chaque assertion cite le numéro de champ de l'annexe A et la règle confrontée.
 */

const col = (name: string): ReturnType<typeof LISTING_COLUMN_BY_NAME.get> => LISTING_COLUMN_BY_NAME.get(name);

describe('D2 — disposition physique (EX-DATA-119) : 8 champs échantillonnés', () => {
  it('# 1 listingId — 16 octets binaires, hors chemin chaud, aucune sentinelle', () => {
    expect(col('listingId')?.physical).toBe('Uint8Array16');
    expect(col('listingId')?.sentinel.kind).toBe('none');
    expect(col('listingId')?.hotPath).toBe(false);
  });

  it('# 7 priceEur, # 59 mileageKm — Int32Array, sentinelle -1', () => {
    expect(col('priceEur')?.physical).toBe('Int32Array');
    expect(col('priceEur')?.sentinel).toEqual({ kind: 'numeric', value: -1 });
    expect(col('mileageKm')?.physical).toBe('Int32Array');
    expect(col('mileageKm')?.sentinel).toEqual({ kind: 'numeric', value: -1 });
  });

  it('# 16 makeId — Int32Array sans sentinelle (OBL, D-02) ; # 18 modelId — Int32Array, 0 réservé', () => {
    // D-02 / DR-007 : la colonne est élargie de Int16Array à Int32Array (max makeId observé 53 488
    // dans data/reference/taxonomy.json, > 32 767). Amendement de l'interface gelée 2.3.
    expect(col('makeId')?.physical).toBe('Int32Array');
    expect(col('makeId')?.sentinel.kind).toBe('none');
    expect(col('modelId')?.physical).toBe('Int32Array');
    expect(col('modelId')?.sentinel.kind).toBe('reserved-zero');
  });

  it('# 49 co2 et # 51 consommation — Int16Array stocké ×10 (décimal à 1 décimale)', () => {
    expect(col('co2EmissionsGPerKmX10')?.scale).toBe(10);
    expect(col('consumptionCombinedL100KmX10')?.scale).toBe(10);
    // Les bornes du dictionnaire (0..1000 g/km, 0,1..99,9 l/100km) tiennent ×10 dans un Int16.
    expect(1000 * 10).toBeLessThan(32767);
    expect(99.9 * 10).toBeLessThan(32767);
  });

  it('# 57 electricRangeKm — Int16Array : la borne haute 10 000 km du dictionnaire y tient', () => {
    expect(col('electricRangeKm')?.physical).toBe('Int16Array');
    expect(10_000).toBeLessThan(32767);
  });

  it('# 10 vatDeductible — Uint8Array tri-état, inconnu = 0 (D8-08), hors chemin chaud', () => {
    expect(col('vatDeductible')?.physical).toBe('Uint8Array');
    expect(col('vatDeductible')?.sentinel).toEqual({ kind: 'tristate-zero' });
    expect(col('vatDeductible')?.vocabulary).toBeNull();
    expect(col('vatDeductible')?.hotPath).toBe(false);
  });

  it('# 60/65/66/80 — compteurs sur Uint8Array, sentinelle 255, bornes < 255', () => {
    for (const name of ['previousOwnerCount', 'doorCount', 'seatCount', 'imageCount']) {
      expect(col(name)?.physical).toBe('Uint8Array');
      expect(col(name)?.sentinel).toEqual({ kind: 'enumByte', value: 255 });
    }
    expect(LISTING_NUMERIC_BOUNDS['previousOwnerCount']?.max).toBe(99);
    expect(LISTING_NUMERIC_BOUNDS['imageCount']?.max).toBe(50);
  });

  it('EX-DATA-119 : exactement 20 colonnes énumérées sur un octet et 2 champs de bits', () => {
    // D8-08 / DR-082 : la colonne `vatDeductible` (« TVA » d'EX-SCR-203) amende l'interface gelée
    // 2.3 et porte le compte de 19 à 20. L'assertion normative (le descripteur est aligné sur
    // `ListingColumnBatch`, colonne par colonne) est inchangée — seule la cardinalité suit
    // l'amendement, comme pour D-01 / D-02 en 2.6.
    expect(LISTING_COLUMNS.filter((c) => c.physical === 'Uint8Array')).toHaveLength(20);
    // D-01 : `ingestFlags` est passé de `bitset16` à `bitset32` ; il y a toujours 2 champs de bits.
    expect(LISTING_COLUMNS.filter((c) => c.physical === 'bitset16' || c.physical === 'bitset32')).toHaveLength(2);
  });

  it('EX-DATA-121 : les 5 champs textuels sont hors du chemin chaud et cohérents avec STRINGS_PER_ROW', () => {
    const strings = LISTING_COLUMNS.filter((c) => c.physical === 'string');
    expect(strings.map((c) => c.name)).toEqual([
      'listingUrl',
      'modelVersionRaw',
      'modelVersionClean',
      'fuelSourceLabelRaw',
      'trimTokens',
    ]);
    expect(strings.every((c) => c.hotPath === false)).toBe(true);
    expect(strings).toHaveLength(STRINGS_PER_ROW);
  });
});

describe('D2 — bornes de validation (annexe A) : 12 champs échantillonnés', () => {
  it('# 7 priceEur 1..5 000 000 ; # 59 mileageKm 0..1 500 000 ; # 35 powerKw 1..9 999', () => {
    expect(LISTING_NUMERIC_BOUNDS['priceEur']).toMatchObject({ min: 1, max: 5_000_000 });
    expect(LISTING_NUMERIC_BOUNDS['mileageKm']).toMatchObject({ min: 0, max: 1_500_000 });
    expect(LISTING_NUMERIC_BOUNDS['powerKw']).toMatchObject({ min: 1, max: 9999 });
  });

  it('# 49 co2 0..1 000 ; # 51 conso 0,1..99,9 ; # 57 autonomie 1..10 000 (unités canoniques)', () => {
    expect(LISTING_NUMERIC_BOUNDS['co2EmissionsGPerKm']).toMatchObject({ min: 0, max: 1000 });
    expect(LISTING_NUMERIC_BOUNDS['consumptionCombinedL100Km']).toMatchObject({ min: 0.1, max: 99.9 });
    expect(LISTING_NUMERIC_BOUNDS['electricRangeKm']).toMatchObject({ min: 1, max: 10_000 });
  });

  it('# 60 propriétaires 0..99 ; # 65 portes 1..9 ; # 66 places 1..99 ; # 80 photos 0..50', () => {
    expect(LISTING_NUMERIC_BOUNDS['previousOwnerCount']).toMatchObject({ min: 0, max: 99 });
    expect(LISTING_NUMERIC_BOUNDS['doorCount']).toMatchObject({ min: 1, max: 9 });
    expect(LISTING_NUMERIC_BOUNDS['seatCount']).toMatchObject({ min: 1, max: 99 });
    expect(LISTING_NUMERIC_BOUNDS['imageCount']).toMatchObject({ min: 0, max: 50 });
  });

  it('règle d’absence (EX-DATA-2) : un champ null ou absent est admis, jamais 0 par défaut', () => {
    expect(validateListingRecord({ mileageKm: null, powerKw: undefined }).ok).toBe(true);
    // 0 reste une valeur métier légitime là où le dictionnaire l'admet (# 59, # 49, # 60, # 80).
    expect(validateListingRecord({ mileageKm: 0, co2EmissionsGPerKm: 0, previousOwnerCount: 0, imageCount: 0 }).ok).toBe(true);
  });

  it('les bornes sont bien appliquées aux deux extrémités (échantillon de 6 champs)', () => {
    expect(validateListingRecord({ powerKw: 0 }).ok).toBe(false);
    expect(validateListingRecord({ powerKw: 10_000 }).ok).toBe(false);
    expect(validateListingRecord({ doorCount: 10 }).ok).toBe(false);
    expect(validateListingRecord({ seatCount: 0 }).ok).toBe(false);
    expect(validateListingRecord({ imageCount: 51 }).ok).toBe(false);
    expect(validateListingRecord({ mileageKm: 1_500_001 }).ok).toBe(false);
  });

  it('R-D2-10 — # 24 modelYear : borne haute = observedAt.year + 1 (EX-DATA, annexe A # 24)', () => {
    // Le dictionnaire borne l'année-modèle à `observedAt.year + 1`. D2 fige `max = 2101`, ce qui
    // admet une année-modèle 2101 sur un snapshot 2026 : la borne haute réelle n'est pas appliquée.
    expect(LISTING_NUMERIC_BOUNDS['modelYear']?.max).toBeLessThanOrEqual(new Date().getFullYear() + 1);
  });

  it('R-D2-11 — # 1 listingId : la forme canonique UUID 8-4-4-4-12 est validée (REJET sinon)', () => {
    // Annexe A # 1 : « doit correspondre à ^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$ ; sinon REJET ».
    expect(validateListingRecord({ listingId: 'PAS-UN-UUID' }).ok).toBe(false);
  });

  it('R-D2-12 — # 2 listingUrl : l’hôte autoscout24.<tld> est validé (REJET sinon)', () => {
    // Annexe A # 2 : « hôte doit appartenir au domaine autoscout24.<tld> ; sinon REJET ».
    expect(validateListingRecord({ listingUrl: 'https://exemple.invalid/annonce' }).ok).toBe(false);
  });
});

describe('D2 — rattachement des vocabulaires aux colonnes (EX-DATA-8)', () => {
  it('les colonnes énumérées à vocabulaire nommé le déclarent explicitement', () => {
    expect(col('fuelCategory')?.vocabulary).toBe('KYCAR_FUEL_CATEGORY');
    expect(col('bodyType')?.vocabulary).toBe('KYCAR_BODY_TYPE');
    expect(col('sellerType')?.vocabulary).toBe('KYCAR_SELLER_TYPE');
    expect(col('regionCode')?.vocabulary).toBe('KYCAR_REGION');
    expect(col('priceStatus')?.vocabulary).toBe('KYCAR_PRICE_STATUS');
    expect(col('adTier')?.vocabulary).toBe('KYCAR_AD_TIER');
    expect(col('ingestFlags')?.vocabulary).toBe('KYCAR_INGEST_FLAG');
  });

  it('les compteurs sur un octet ne portent aucun vocabulaire (# 60, 65, 66, 80)', () => {
    for (const name of ['doorCount', 'seatCount', 'previousOwnerCount', 'imageCount']) {
      expect(col(name)?.vocabulary).toBeNull();
    }
  });

  it('R-D2-13 — # 74 countryCode est un code ISO-3166-1 alpha-2, pas un code marketplace', () => {
    // Annexe A # 74 : colonne « Énum. » vide, et EX-DATA-40 : « les deux listes se recouvrent par
    // accident et non par correspondance (`L` vaut Luxembourg en recherche et Liberia en ISO) ».
    // Rattacher la colonne `countryCode` au vocabulaire `KYCAR_MARKETPLACE` est exactement la
    // confusion qu'EX-DATA-40 interdit.
    expect(col('countryCode')?.vocabulary).not.toBe('KYCAR_MARKETPLACE');
  });
});

describe('D2 — garantie R3 structurelle du schéma colonnaire (EX-DATA-122)', () => {
  it('aucune colonne ne porte un nom de champ interdit E1..E14', () => {
    const names = LISTING_COLUMNS.map((c) => c.name.toLowerCase());
    for (const forbidden of ['sellerid', 'sellername', 'zip', 'postalcode', 'city', 'street', 'lat', 'lon', 'phone', 'email', 'description', 'cid']) {
      expect(names).not.toContain(forbidden);
    }
    // Les deux attributs vendeur AUTORISÉS sont bien présents (EX-DATA-42).
    expect(names).toContain('sellertype');
    expect(names).toContain('regioncode');
  });
});
