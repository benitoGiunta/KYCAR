import { describe, expect, it } from 'vitest';
import {
  buildEuroStandardIndex,
  mapBodyType,
  mapDrivetrain,
  mapEuEmissionStandard,
  mapFuelCategory,
  mapSellerType,
  mapTransmission,
  mapUsageState,
  parseInteger,
  parseNumeric,
  resolveMakeId,
  resolveModelId,
} from './vocabularyMap';
import { loadRealReferenceData } from './testFixtures';

const referenceData = loadRealReferenceData();

describe('vocabularyMap — re-cartographie 2dehands → KYCAR', () => {
  it('mappe fuel vers KYCAR_FUEL_CATEGORY (codes réels de FuelCategory.json)', () => {
    expect(mapFuelCategory('Diesel')).toBe('D');
    expect(mapFuelCategory('Benzine')).toBe('B');
    expect(mapFuelCategory('Elektrisch')).toBe('E');
    expect(mapFuelCategory('LPG')).toBe('L');
    expect(mapFuelCategory('CNG')).toBe('C');
    expect(mapFuelCategory('Waterstof')).toBe('H');
    // Hybride : le carburant PRIMAIRE (avant le séparateur) l'emporte.
    expect(mapFuelCategory('Diesel/Elektrisch')).toBe('D');
    expect(mapFuelCategory('Benzine/Elektrisch')).toBe('B');
    expect(mapFuelCategory(undefined)).toBeNull();
    expect(mapFuelCategory('Zonderbrandstof')).toBeNull();
    // Les codes retournés existent réellement dans le référentiel chargé.
    expect(referenceData.decodeEnum('KYCAR_FUEL_CATEGORY', mapFuelCategory('Diesel') ?? '')).toBeTruthy();
  });

  it('mappe body vers les 9 codes voiture de KYCAR_BODY_TYPE, avec repli "Autres"', () => {
    expect(mapBodyType('Break')).toBe('5');
    expect(mapBodyType('Berline')).toBe('6');
    expect(mapBodyType('SUV')).toBe('4');
    expect(mapBodyType('Hatchback')).toBe('1');
    expect(mapBodyType('Iets ongewoons')).toBe('7'); // repli "Autres"
    expect(mapBodyType(undefined)).toBeNull();
    for (const code of ['1', '4', '5', '6', '7']) {
      expect(referenceData.decodeEnum('KYCAR_BODY_TYPE', code)).toBeTruthy();
    }
  });

  it('mappe transmission vers A/M/S', () => {
    expect(mapTransmission('Automaat')).toBe('A');
    expect(mapTransmission('Handgeschakeld')).toBe('M');
    expect(mapTransmission('Semiautomaat')).toBe('S');
    expect(mapTransmission(undefined)).toBeNull();
  });

  it('mappe driveTrain vers 4/F/R', () => {
    expect(mapDrivetrain('Voorwielaandrijving')).toBe('F');
    expect(mapDrivetrain('Achterwielaandrijving')).toBe('R');
    expect(mapDrivetrain('Vierwielaandrijving')).toBe('4');
  });

  it('mappe condition vers KYCAR_USAGE_STATE, repli U (état d’origine)', () => {
    expect(mapUsageState('Beschadigd')).toBe('A');
    expect(mapUsageState('Nieuw')).toBe('N');
    expect(mapUsageState('Tweedehands')).toBe('U');
    expect(mapUsageState(undefined)).toBeNull();
  });

  it('mappe advertiser (Particulier/Bedrijf) vers KYCAR_SELLER_TYPE (P/D)', () => {
    expect(mapSellerType('Particulier')).toBe('P');
    expect(mapSellerType('Bedrijf')).toBe('D');
    expect(referenceData.decodeEnum('KYCAR_SELLER_TYPE', 'P')).toBe('Particulier');
    expect(referenceData.decodeEnum('KYCAR_SELLER_TYPE', 'D')).toBe('Professionnel');
  });

  it('mappe euronormBE vers KYCAR_EU_EMISSION_STANDARD via l’index dynamique du référentiel réel', () => {
    const euroIndex = buildEuroStandardIndex(referenceData);
    expect(mapEuEmissionStandard('Euro 6', euroIndex)).toBe('6');
    expect(mapEuEmissionStandard('Euro 6d-TEMP', euroIndex)).toBe('9');
    expect(mapEuEmissionStandard('euro 6b', euroIndex)).toBe('11');
    expect(mapEuEmissionStandard('Norme inconnue', euroIndex)).toBeNull();
  });

  it('parse les champs numériques avec unité embarquée (formats NL/FR)', () => {
    expect(parseInteger('90.000 km')).toBe(90000);
    expect(parseInteger('2019')).toBe(2019);
    expect(parseNumeric('118,5')).toBe(118.5);
    expect(parseNumeric(undefined)).toBeNull();
    expect(parseInteger('sans valeur')).toBeNull();
  });

  it('résout marque/modèle contre la VRAIE taxonomie (Opel=54, Corsa=1918)', () => {
    expect(resolveMakeId(referenceData, 'Opel')).toBe(54);
    expect(resolveMakeId(referenceData, 'opel')).toBe(54); // insensible à la casse
    expect(resolveMakeId(referenceData, 'MarqueInconnueXYZ')).toBeNull();

    expect(resolveModelId(referenceData, 54, 'Corsa')).toBe(1918);
    expect(resolveModelId(referenceData, 54, 'Astra')).toBe(1916);
    expect(resolveModelId(referenceData, 54, 'ModeleInconnu')).toBe(0); // EX-DATA-72, jamais null
    expect(resolveModelId(referenceData, 74, 'Golf')).toBe(2084);
  });
});
