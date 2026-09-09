/**
 * KYCAR — Tests de l'adaptateur `as24 → canonique` (phase 3.3)
 * =================================================================================================
 * **Chaque ligne de la table §3.1 de `docs/data/DATA-MODEL.md` a au moins un cas ici** : c'est le
 * critère que la mission fixe à ce lot, et le seul moyen de savoir que l'adaptateur applique la
 * spécification plutôt qu'une lecture approximative de celle-ci. Le test `couverture` en fin de
 * fichier compte les numéros de champ cités dans les titres et échoue si l'un des 82 manque.
 *
 * Les trois exemples du dépôt (`data/schema/examples/full.json`, `full-nedc.json`, `minimal.json`)
 * traversent l'adaptateur ; `invalid-r3.json` est REJETÉ avant toute adaptation.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { adaptAs24Listing, createAs24Context, type As24AdaptResult, type As24AdapterContext } from './adapt';
import { assembleBatch } from './columnar';
import { tablesAgreeWithCodeIndex, buildAs24CodeTables } from './vocab';
import { hostMatchesDomain, normalizeListingUrl, roundHalfAwayFromZero, truncateDecimals, uuidToBytes } from './normalize';
import type { As24Listing } from './types';
import { loadReferenceDataFromDisk } from '../../../orchestration/reference-fs';
import type { ReferenceData } from '../../../types/reference';
import { codeIndex } from '../../synthetic/catalog';
import { ENUM_UNKNOWN_BYTE, NUMERIC_UNKNOWN, VAT_DEDUCTIBLE } from '../../../types/sentinels';
import { hasIngestFlag, readBooleanFlag } from '../../../types/vocabularies';
import { STRINGS_PER_ROW } from '../../DataProvider';

const EXAMPLES = resolve(process.cwd(), 'data/schema/examples');
const example = (name: string): Record<string, unknown> =>
  JSON.parse(readFileSync(resolve(EXAMPLES, `${name}.json`), 'utf-8')) as Record<string, unknown>;

/** Capture de référence des fixtures : le 3ᵉ snapshot hebdomadaire du profil de spécification. */
const OBSERVED_AT = '2026-09-21T06:00:00Z';

let ref: ReferenceData;
let ctx: As24AdapterContext;

beforeAll(() => {
  ref = loadReferenceDataFromDisk();
  ctx = createAs24Context({ referenceData: ref, observedAt: OBSERVED_AT });
});

/** Annonce complète (branche WLTP) modifiée champ à champ. */
function listing(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { ...example('full'), ...overrides };
}

/** Adapte et exige l'acceptation ; rend la ligne canonique. */
function accept(raw: Record<string, unknown>): Extract<As24AdaptResult, { kind: 'accepted' }>['row'] {
  const out = adaptAs24Listing(raw, ctx);
  if (out.kind !== 'accepted') throw new Error(`ligne rejetée : ${out.reason} (${out.detail})`);
  return out.row;
}

/** Adapte et exige le rejet ; rend le motif. */
function rejectOf(raw: unknown): string {
  const out = adaptAs24Listing(raw, ctx);
  if (out.kind !== 'rejected') throw new Error('ligne acceptée alors qu’un rejet était attendu');
  return out.reason;
}

/** Indice d'octet attendu d'un code dans son vocabulaire (la convention D3, `codeIndex`). */
const byteOf = (voc: Parameters<typeof codeIndex>[1], code: string): number => {
  const i = codeIndex(ref, voc, code);
  if (i === null) throw new Error(`code ${code} absent de ${voc}`);
  return i;
};

/* ================================================================================================
 * Garde R3 et exemples du dépôt
 * ============================================================================================== */

describe('adaptateur as24 — garde R3 et exemples versionnés', () => {
  it('R3 (§A.7) — `invalid-r3.json` est REJETÉ AVANT toute adaptation, sur le nom de propriété', () => {
    const out = adaptAs24Listing(example('invalid-r3'), ctx);
    expect(out.kind).toBe('rejected');
    if (out.kind === 'rejected') {
      expect(out.reason).toBe('R3_FORBIDDEN_FIELD');
      expect(out.detail).toContain('seller.companyName');
    }
  });

  it('R3 — la garde est celle de `src/types/validation.ts`, pas une liste recopiée', () => {
    // Une forme APLATIE (DR-012) et un identifiant en VALEUR (DR-027) sont refusés au même titre.
    expect(rejectOf(listing({ sellerPhone: '+32...' }))).toBe('R3_FORBIDDEN_FIELD');
    expect(rejectOf(listing({ location: { countryCode: 'BE', city: 'Liège' } }))).toBe('R3_FORBIDDEN_FIELD');
  });

  it('les trois exemples valides traversent l’adaptateur (full WLTP, full-nedc, minimal)', () => {
    for (const name of ['full', 'full-nedc', 'minimal']) {
      const out = adaptAs24Listing(example(name), ctx);
      expect(out.kind, name).toBe('accepted');
    }
  });

  it('une ligne qui n’est pas un objet est rejetée sans exception', () => {
    expect(rejectOf('{"id":')).toBe('NOT_AN_OBJECT');
    expect(rejectOf([1, 2, 3])).toBe('NOT_AN_OBJECT');
    expect(rejectOf(null)).toBe('NOT_AN_OBJECT');
  });
});

/* ================================================================================================
 * Identité et provenance — # 1 à # 6
 * ============================================================================================== */

describe('adaptateur as24 — identité et provenance (# 1 à # 6)', () => {
  it('# 1 `listingId` — minuscules, forme 8-4-4-4-12 ; toute autre forme REJETTE l’annonce', () => {
    const row = accept(listing({ id: '3D9B1C47-8E52-4F0A-B6D3-1A2C4E6F8B90' }));
    expect(row.listingId).toBe('3d9b1c47-8e52-4f0a-b6d3-1a2c4e6f8b90');
    expect(rejectOf(listing({ id: 'pas-un-uuid' }))).toBe('LISTING_ID_INVALID');
    expect(rejectOf(listing({ id: undefined }))).toBe('LISTING_ID_INVALID');
    // 16 octets binaires (EX-DATA-119), relus à l'identique.
    const bytes = new Uint8Array(16);
    uuidToBytes(row.listingId, bytes);
    expect([...bytes.slice(0, 4)]).toEqual([0x3d, 0x9b, 0x1c, 0x47]);
  });

  it('# 2 `listingUrl` — https forcé, fragment et paramètres de campagne retirés ; hôte hors domaine = REJET', () => {
    const row = accept(
      listing({
        webPage:
          'http://www.autoscout24.be/offres/3d9b1c47-8e52-4f0a-b6d3-1a2c4e6f8b90?utm_source=x&search_id=1&sort=price#photos',
      }),
    );
    expect(row.listingUrl.startsWith('https://')).toBe(true);
    expect(row.listingUrl).not.toContain('utm_source');
    expect(row.listingUrl).not.toContain('search_id');
    expect(row.listingUrl).not.toContain('#');
    expect(row.listingUrl).toContain('sort=price'); // un paramètre non promotionnel est conservé
    // EX-DATA-14 : l'homographe ne passe pas ; le sous-domaine légitime, si.
    expect(rejectOf(listing({ webPage: 'https://www.notautoscout24.be/offres/x' }))).toBe('LISTING_URL_INVALID');
    expect(hostMatchesDomain('www.autoscout24.be')).toBe(true);
    expect(hostMatchesDomain('autoscout24.be.evil.com')).toBe(false);
    expect(normalizeListingUrl('pas une url').url).toBeNull();
  });

  it('# 3 `snapshotId` et # 4 `observedAt` viennent du MANIFEST, jamais de l’annonce', () => {
    // Ils ne sont pas des champs de `As24Listing` : le contexte les porte, et ils bornent # 24/# 30.
    expect(ctx.observedAt).toBe(OBSERVED_AT);
    expect(ctx.observedAtYear).toBe(2026);
    expect(ctx.observedYearMonth).toBe(12 * 2026 + 8); // septembre = mois 9, index 8
  });

  it('# 5 `marketplace` — minuscules, dans `KYCAR_MARKETPLACE` ; sinon REJET (D3-07 : `ca` est valide)', () => {
    expect(accept(listing({ marketplace: 'BE' })).listingId).toBeDefined();
    expect(adaptAs24Listing(listing({ marketplace: 'ca', location: { countryCode: 'CA' } }), ctx).kind).toBe('accepted');
    expect(rejectOf(listing({ marketplace: 'zz' }))).toBe('MARKETPLACE_UNKNOWN');
  });

  it('# 6 `vehicleType` — doit valoir `C` (voiture) ; sinon REJET', () => {
    expect(rejectOf(listing({ vehicleType: 'B' }))).toBe('VEHICLE_TYPE_NOT_CAR');
    expect(accept(listing({ vehicleType: 'c' })).makeId).toBe(74);
  });
});

/* ================================================================================================
 * Prix — # 7 à # 15
 * ============================================================================================== */

describe('adaptateur as24 — prix (# 7 à # 15)', () => {
  it('# 7 `priceEur` — arrondi à l’euro (EX-DATA-6, demi vers l’infini), bornes et sentinelle', () => {
    expect(roundHalfAwayFromZero(22449.5)).toBe(22450);
    expect(roundHalfAwayFromZero(-0.5)).toBe(-1);
    expect(accept(listing({ prices: { public: { price: 22450, currency: 'EUR' } } })).priceEur).toBe(22450);
    // Hors borne haute : INCONNU + PRICE_OUT_OF_RANGE (un drapeau n'est jamais une valeur).
    const high = accept(listing({ prices: { public: { price: 6_000_000, currency: 'EUR' } } }));
    expect(high.priceEur).toBe(NUMERIC_UNKNOWN);
    expect(hasIngestFlag(high.ingestFlags, 'PRICE_OUT_OF_RANGE')).toBe(true);
    // Sous le seuil absolu : drapeau MAIS valeur CONSERVÉE (ARB-15).
    const low = accept(listing({ prices: { public: { price: 1, currency: 'EUR' } } }));
    expect(low.priceEur).toBe(1);
    expect(hasIngestFlag(low.ingestFlags, 'PRICE_SENTINEL_ABSOLUTE')).toBe(true);
  });

  it('# 8 `priceStatus` et # 9 `priceOnRequestOnly` — trois états exhaustifs, EX-DATA-18 et EX-DATA-32', () => {
    const quoted = accept(listing());
    expect(quoted.priceStatus).toBe(byteOf('KYCAR_PRICE_STATUS', 'QUOTED'));
    expect(readBooleanFlag(quoted.booleanFlags, 'priceOnRequestOnly')).toBe(false);

    const onRequest = accept(listing({ prices: { public: { onRequestOnly: true } } }));
    expect(onRequest.priceStatus).toBe(byteOf('KYCAR_PRICE_STATUS', 'ON_REQUEST'));
    expect(readBooleanFlag(onRequest.booleanFlags, 'priceOnRequestOnly')).toBe(true);

    const missing = accept(listing({ prices: { public: {} } }));
    expect(missing.priceStatus).toBe(byteOf('KYCAR_PRICE_STATUS', 'MISSING'));
    expect(hasIngestFlag(missing.ingestFlags, 'PRICE_MISSING_UNDECLARED')).toBe(true);

    // EX-DATA-32 : montant ET drapeau « sur demande » → QUOTED, jamais muet.
    const both = accept(listing({ prices: { public: { price: 10_000, currency: 'EUR', onRequestOnly: true } } }));
    expect(both.priceStatus).toBe(byteOf('KYCAR_PRICE_STATUS', 'QUOTED'));
    expect(hasIngestFlag(both.ingestFlags, 'PRICE_ON_REQUEST_WITH_AMOUNT')).toBe(true);
  });

  it('# 10 `isTaxDeductible` — colonne TRI-ÉTAT : absent ≠ non (D8-08)', () => {
    expect(accept(listing()).vatDeductible).toBe(VAT_DEDUCTIBLE.YES);
    expect(accept(listing({ prices: { public: { price: 1000, currency: 'EUR', isTaxDeductible: false } } })).vatDeductible)
      .toBe(VAT_DEDUCTIBLE.NO);
    const silent = accept(listing({ prices: { public: { price: 1000, currency: 'EUR' } } }));
    expect(silent.vatDeductible).toBe(VAT_DEDUCTIBLE.UNKNOWN);
    expect(silent.unknownFields).toContain('vatDeductible');
  });

  it('# 11 `priceEvaluationCategory` — projection 3 → 6 niveaux (EX-DATA-12), DÉFAUT `0`', () => {
    expect(accept(listing()).priceEvaluationCategory).toBe(byteOf('KYCAR_PRICE_EVALUATION', '2'));
    const absent = accept(listing({ prices: { public: { price: 1000, currency: 'EUR' } } }));
    expect(absent.priceEvaluationCategory).toBe(byteOf('KYCAR_PRICE_EVALUATION', '0'));
    const bogus = accept(listing({ prices: { public: { price: 1000, currency: 'EUR', evaluation: { category: 9 } } } }));
    expect(bogus.priceEvaluationCategory).toBe(ENUM_UNKNOWN_BYTE);
    expect(hasIngestFlag(bogus.ingestFlags, 'ENUM_UNKNOWN')).toBe(true);
  });

  it('# 12 `isSuperDeal` — DÉFAUT `false`, porté par `booleanFlags` (D3-10)', () => {
    expect(readBooleanFlag(accept(listing({ superDeal: true })).booleanFlags, 'isSuperDeal')).toBe(true);
    expect(readBooleanFlag(accept(listing({ superDeal: undefined })).booleanFlags, 'isSuperDeal')).toBe(false);
  });

  it('# 13 `netPriceEur`, # 14 `vatRatePercent`, # 15 `msrpEur` — validés, comptés, non transportés (E-07)', () => {
    const ok = accept(listing());
    expect(ok.unknownFields).not.toContain('netPriceEur');
    expect(ok.unknownFields).not.toContain('vatRatePercent');
    expect(ok.unknownFields).not.toContain('msrpEur');
    // `netPrice >= price` viole EX-DATA #13 : INCONNU.
    const bad = accept(listing({ prices: { public: { price: 1000, currency: 'EUR', netPrice: 2000 } } }));
    expect(bad.unknownFields).toContain('netPriceEur');
    // `vatRate` à une décimale, TRONQUÉE (règle de la source), jamais arrondie.
    expect(truncateDecimals(21.19, 1)).toBe(21.1);
    expect(truncateDecimals(5.6, 1)).toBe(5.6);
  });
});

/* ================================================================================================
 * Taxonomie et version — # 16 à # 24
 * ============================================================================================== */

describe('adaptateur as24 — taxonomie et version (# 16 à # 24)', () => {
  it('# 16 `makeId` / # 17 `makeName` — le référentiel fait foi, un `makeName` divergent est ignoré (C-08)', () => {
    const row = accept(listing({ makeName: 'Volskwagen (faute de frappe du vendeur)' }));
    expect(row.makeId).toBe(74);
    expect(ref.makeById.get(74)?.label).toBe('Volkswagen');
    expect(rejectOf(listing({ make: 999_999 }))).toBe('MAKE_UNKNOWN');
  });

  it('# 18 `modelId` / # 19 `modelName` — modèle hors marque → `0` + MODEL_UNRESOLVED (EX-DATA-72)', () => {
    expect(accept(listing()).modelId).toBe(2084);
    const unresolved = accept(listing({ model: 999_999 }));
    expect(unresolved.modelId).toBe(0);
    expect(hasIngestFlag(unresolved.ingestFlags, 'MODEL_UNRESOLVED')).toBe(true);
    expect(ref.modelByKey.get('74:2084')?.label).toBe('Golf');
  });

  it('# 20 `modelVersionRaw` — EX-DATA-7 puis troncature à 121 points de code', () => {
    const long = 'A'.repeat(200);
    const row = accept(listing({ modelVersion: long }));
    expect(Array.from(row.strings[1] ?? '')).toHaveLength(121);
    const spaced = accept(listing({ modelVersion: '  1.4   eHybrid \t GTE  ' }));
    expect(spaced.strings[1]).toBe('1.4 eHybrid GTE');
  });

  it('# 21 `modelVersionClean` / # 22 `trimTokens` / # 23 `badgeDisplacementL` — pipeline EX-DATA-29', () => {
    const row = accept(listing({ modelVersion: '1.4 eHybrid GTE Style DSG 5p' }));
    expect(row.strings[2]).toBe('1.4 eHybrid GTE Style DSG 5p');
    // Étape 7 : jetons en majuscules, triés, dédoublonnés, sérialisés séparés par une espace.
    expect((row.strings[4] ?? '').split(' ')).toContain('EHYBRID');
    expect(row.unknownFields).not.toContain('badgeDisplacementL'); // 1,4 L relevé au badge
    // EX-DATA-31 : une version entièrement dépouillée lève VERSION_FULLY_STRIPPED.
    const stripped = accept(listing({ modelVersion: '***' }));
    expect(stripped.strings[2]).toBe('');
    expect(hasIngestFlag(stripped.ingestFlags, 'VERSION_FULLY_STRIPPED')).toBe(true);
  });

  it('# 24 `modelYear` — borne `observedAt.year + 1` ; hors borne = INCONNU + drapeau de borne', () => {
    expect(accept(listing({ productionYear: 2021 })).modelYear).toBe(2021);
    expect(accept(listing({ productionYear: 2027 })).modelYear).toBe(2027); // observedAt 2026 + 1
    const future = accept(listing({ productionYear: 2099 }));
    expect(future.modelYear).toBe(NUMERIC_UNKNOWN);
    // La table §3.1 dit « YEAR_OUT_OF_RANGE », que EX-DATA-45 ne définit pas : on pose le drapeau
    // que la table UNIQUE des bornes (D-47) associe à `modelYear`, sans inventer de 18ᵉ code.
    expect(hasIngestFlag(future.ingestFlags, 'FIRST_REG_OUT_OF_RANGE')).toBe(true);
  });
});

/* ================================================================================================
 * État, dates, kilométrage — # 25 à # 34, # 59 à # 63
 * ============================================================================================== */

describe('adaptateur as24 — état, dates et kilométrage (# 25 à # 34, # 59 à # 63)', () => {
  it('# 25 `offerType` et # 26 `usageState` — majuscules, dans leur vocabulaire, sinon INCONNU', () => {
    const row = accept(listing({ offerType: 'u', usageState: 'u' }));
    expect(row.offerType).toBe(byteOf('KYCAR_OFFER_TYPE', 'U'));
    expect(row.usageState).toBe(byteOf('KYCAR_USAGE_STATE', 'U'));
    const bad = accept(listing({ offerType: 'ZZ', usageState: 'ZZ' }));
    expect(bad.offerType).toBe(ENUM_UNKNOWN_BYTE);
    expect(bad.usageState).toBe(ENUM_UNKNOWN_BYTE);
  });

  it('# 27 `hadAccident` — TRI-ÉTAT : absent reste INCONNU, jamais `false`', () => {
    expect(readBooleanFlag(accept(listing({ condition: { hadAccident: false } })).booleanFlags, 'hadAccident')).toBe(false);
    expect(readBooleanFlag(accept(listing({ condition: { hadAccident: true } })).booleanFlags, 'hadAccident')).toBe(true);
    const silent = accept(listing({ condition: undefined }));
    expect(readBooleanFlag(silent.booleanFlags, 'hadAccident')).toBeNull();
    expect(silent.unknownFields).toContain('hadAccident');
  });

  it('# 28 `publicationState` et # 29 `isNewListing`', () => {
    const row = accept(listing({ publication: { status: 'Active', accurateState: 'active', isNew: true } }));
    expect(readBooleanFlag(row.booleanFlags, 'isNewListing')).toBe(true);
    expect(row.unknownFields).not.toContain('publicationState');
    expect(accept(listing({ publication: undefined })).unknownFields).toContain('publicationState');
  });

  it('# 30 `firstRegistrationYearMonth`, # 31 année, # 32 mois — EX-DATA-23 puis borne d’annexe A', () => {
    const row = accept(listing({ firstRegistrationDate: '2021-06' }));
    expect(row.firstRegistrationYearMonth).toBe(12 * 2021 + 5);
    // Forme illisible : INCONNU + FIRST_REG_UNPARSEABLE (étage EX-DATA-23).
    const bad = accept(listing({ firstRegistrationDate: '2021-13' }));
    expect(bad.firstRegistrationYearMonth).toBe(NUMERIC_UNKNOWN);
    expect(hasIngestFlag(bad.ingestFlags, 'FIRST_REG_UNPARSEABLE')).toBe(true);
    // Forme lisible mais hors borne : INCONNU + FIRST_REG_OUT_OF_RANGE (étage annexe A).
    const old = accept(listing({ firstRegistrationDate: '1899-06' }));
    expect(old.firstRegistrationYearMonth).toBe(NUMERIC_UNKNOWN);
    expect(hasIngestFlag(old.ingestFlags, 'FIRST_REG_OUT_OF_RANGE')).toBe(true);
    expect(hasIngestFlag(old.ingestFlags, 'FIRST_REG_UNPARSEABLE')).toBe(false);
  });

  it('# 33 `vehicleAgeMonths` et # 34 `mileagePerYearKm` — dérivés, sans colonne, comptés', () => {
    const row = accept(listing({ firstRegistrationDate: '2021-06', mileage: 64_500 }));
    expect(row.unknownFields).not.toContain('vehicleAgeMonths');
    expect(row.unknownFields).not.toContain('mileagePerYearKm');
    // §7-22 : kilométrage annualisé implausible → signalement, jamais un drapeau inventé.
    const crazy = accept(listing({ firstRegistrationDate: '2026-06', mileage: 900_000 }));
    expect(crazy.notices).toContain('MILEAGE_IMPLAUSIBLE_FOR_AGE');
    const noAge = accept(listing({ firstRegistrationDate: undefined }));
    expect(noAge.unknownFields).toContain('vehicleAgeMonths');
  });

  it('# 59 `mileageKm` — garde d’unité EX-DATA-5, bornes, et les deux cas d’EX-DATA-38', () => {
    expect(accept(listing({ mileage: 64_500, mileageUnit: 'km' })).mileageKm).toBe(64_500);
    const mi = accept(listing({ mileage: 40_000, mileageUnit: 'mi' }));
    expect(mi.mileageKm).toBe(NUMERIC_UNKNOWN);
    expect(hasIngestFlag(mi.ingestFlags, 'UNIT_UNSUPPORTED')).toBe(true);
    const huge = accept(listing({ mileage: 5_000_000 }));
    expect(huge.mileageKm).toBe(NUMERIC_UNKNOWN);
    expect(hasIngestFlag(huge.ingestFlags, 'MILEAGE_OUT_OF_RANGE')).toBe(true);
    // 0 km : sans réserve sur N/S/D, suspect sinon.
    expect(hasIngestFlag(accept(listing({ mileage: 0, offerType: 'N' })).ingestFlags, 'SUSPECT_ZERO_MILEAGE')).toBe(false);
    expect(hasIngestFlag(accept(listing({ mileage: 0, offerType: 'U' })).ingestFlags, 'SUSPECT_ZERO_MILEAGE')).toBe(true);
  });

  it('# 60 `previousOwnerCount`, # 61, # 62, # 63 — bornes et tri-états', () => {
    const row = accept(listing({ previousOwnerCount: 1, hasFullServiceHistory: true, wasCabOrRental: false }));
    expect(row.previousOwnerCount).toBe(1);
    expect(readBooleanFlag(row.booleanFlags, 'hasFullServiceHistory')).toBe(true);
    expect(readBooleanFlag(row.booleanFlags, 'wasCabOrRental')).toBe(false);
    expect(accept(listing({ previousOwnerCount: 200 })).previousOwnerCount).toBe(ENUM_UNKNOWN_BYTE);
    const silent = accept(listing({ hasFullServiceHistory: undefined, wasCabOrRental: undefined }));
    expect(readBooleanFlag(silent.booleanFlags, 'hasFullServiceHistory')).toBeNull();
    expect(readBooleanFlag(silent.booleanFlags, 'wasCabOrRental')).toBeNull();
    // # 62 `nextInspectionYearMonth` : validé hors interface (aucune colonne).
    expect(accept(listing({ nextInspectionDate: '2027-06' })).listingId).toBeDefined();
  });
});

/* ================================================================================================
 * Motorisation — # 35 à # 48
 * ============================================================================================== */

describe('adaptateur as24 — motorisation (# 35 à # 48)', () => {
  it('# 35 `powerKw` — kW seul ; toute autre unité est REFUSÉE, jamais convertie au jugé (EX-DATA-5)', () => {
    expect(accept(listing({ power: 110, powerUnit: 'kW' })).powerKw).toBe(110);
    const hp = accept(listing({ power: 150, powerUnit: 'hp' }));
    expect(hp.powerKw).toBe(NUMERIC_UNKNOWN);
    expect(hasIngestFlag(hp.ingestFlags, 'UNIT_UNSUPPORTED')).toBe(true);
    const big = accept(listing({ power: 99_999, powerUnit: 'kW' }));
    expect(big.powerKw).toBe(NUMERIC_UNKNOWN);
    expect(hasIngestFlag(big.ingestFlags, 'POWER_OUT_OF_RANGE')).toBe(true);
  });

  it('# 36 `powerHp` — TOUJOURS recalculé (DIN 66036) ; la valeur source ne sert qu’au contrôle', () => {
    // 110 kW / 0,7355 = 149,6 → 150 ch : l'exemple est cohérent, aucun drapeau.
    expect(hasIngestFlag(accept(listing()).ingestFlags, 'POWER_UNIT_MISMATCH')).toBe(false);
    const mismatch = accept(listing({ power: 110, powerUnit: 'kW', powerHp: 300 }));
    expect(hasIngestFlag(mismatch.ingestFlags, 'POWER_UNIT_MISMATCH')).toBe(true);
  });

  it('# 37 `cylinderCapacityCcm`, # 38 `cylinderCount`, # 39 `gearCount` — validés, non transportés', () => {
    const ok = accept(listing());
    expect(ok.unknownFields).not.toContain('cylinderCapacityCcm');
    expect(ok.unknownFields).not.toContain('cylinderCount');
    expect(ok.unknownFields).not.toContain('gearCount');
    const bad = accept(listing({ cylinderCapacity: 1395, cylinderCapacityUnit: 'ci', cylinderCount: undefined, gearCount: 99 }));
    expect(bad.unknownFields).toContain('cylinderCapacityCcm');
    expect(hasIngestFlag(bad.ingestFlags, 'UNIT_UNSUPPORTED')).toBe(true);
    expect(bad.unknownFields).toContain('cylinderCount');
    expect(bad.unknownFields).toContain('gearCount');
  });

  it('# 40 `transmission` et # 41 `drivetrain`', () => {
    const row = accept(listing({ transmission: 'a', drivetrain: 'f' }));
    expect(row.transmission).toBe(byteOf('KYCAR_TRANSMISSION', 'A'));
    expect(row.drivetrain).toBe(byteOf('KYCAR_DRIVETRAIN', 'F'));
    expect(accept(listing({ transmission: undefined })).transmission).toBe(ENUM_UNKNOWN_BYTE);
  });

  it('# 42 `fuelCategory` et # 43 `fuelTypePrimary` — vocabulaires DISTINCTS (EX-DATA-9), repli EX-DATA-10', () => {
    expect(accept(listing({ fuelCategory: '2' })).fuelCategory).toBe(byteOf('KYCAR_FUEL_CATEGORY', '2'));
    // Un code alphabétique passe en majuscules ; `2` et `3` restent des chaînes numériques.
    expect(accept(listing({ fuelCategory: 'd' })).fuelCategory).toBe(byteOf('KYCAR_FUEL_CATEGORY', 'D'));
    // Catégorie absente : repli sur le TYPE (7 = Diesel → D).
    const fallback = accept(listing({ fuelCategory: undefined, primaryFuelType: 7, isPluginHybrid: undefined }));
    expect(fallback.fuelCategory).toBe(byteOf('KYCAR_FUEL_CATEGORY', 'D'));
    // Ni catégorie ni type résoluble sur un hybride rechargeable : EX-DATA-11, signalé, jamais deviné.
    const unresolved = accept(listing({ fuelCategory: undefined, primaryFuelType: 14, isPluginHybrid: true }));
    expect(unresolved.fuelCategory).toBe(ENUM_UNKNOWN_BYTE);
    expect(unresolved.notices).toContain('HYBRID_CATEGORY_UNRESOLVED');
    // Code hors vocabulaire : ENUM_UNKNOWN.
    expect(hasIngestFlag(accept(listing({ fuelCategory: 'Z', primaryFuelType: undefined })).ingestFlags, 'ENUM_UNKNOWN')).toBe(true);
    expect(accept(listing({ primaryFuelType: 999 })).unknownFields).toContain('fuelTypePrimary');
  });

  it('# 44 `fuelTypesAdditional`, # 47 `batteryOwnership`, # 48 `batteryCapacityKwh`', () => {
    const ok = accept(listing());
    expect(ok.unknownFields).not.toContain('fuelTypesAdditional');
    expect(ok.unknownFields).not.toContain('batteryOwnership');
    expect(ok.unknownFields).not.toContain('batteryCapacityKwh');
    const bad = accept(listing({ additionalFuelTypes: [999], battery: { ownershipType: '9', capacity: 0, capacityUnit: 'MWh' } }));
    expect(bad.unknownFields).toContain('fuelTypesAdditional');
    expect(bad.unknownFields).toContain('batteryOwnership');
    expect(bad.unknownFields).toContain('batteryCapacityKwh');
    expect(hasIngestFlag(bad.ingestFlags, 'UNIT_UNSUPPORTED')).toBe(true);
  });

  it('# 45 `fuelSourceLabelRaw` — conservé, tronqué à 160, JAMAIS décodé vers un code (EX-DATA-37)', () => {
    expect(accept(listing()).strings[3]).toBe('Super E10 95 / Electrique');
    expect(Array.from(accept(listing({ fuelSourceLabel: 'X'.repeat(300) })).strings[3] ?? '')).toHaveLength(160);
    expect(accept(listing({ fuelSourceLabel: undefined })).unknownFields).toContain('fuelSourceLabelRaw');
  });

  it('# 46 `isPluginHybrid` — tri-état, et cohérence avec la catégorie d’énergie (§7-19)', () => {
    expect(readBooleanFlag(accept(listing()).booleanFlags, 'isPluginHybrid')).toBe(true);
    const inconsistent = accept(listing({ isPluginHybrid: true, fuelCategory: 'D' }));
    expect(inconsistent.notices).toContain('HYBRID_INCONSISTENT');
    expect(readBooleanFlag(accept(listing({ isPluginHybrid: undefined })).booleanFlags, 'isPluginHybrid')).toBeNull();
  });
});

/* ================================================================================================
 * Mesure et écologie — # 49 à # 58
 * ============================================================================================== */

describe('adaptateur as24 — mesure et écologie (# 49 à # 58)', () => {
  it('# 49 `co2EmissionsGPerKm` et # 50 `co2Source` — priorité WLTP > NEDC > fallback (EX-DATA-35)', () => {
    const wltp = accept(listing());
    expect(wltp.co2EmissionsGPerKmX10).toBe(270);
    expect(wltp.co2Source).toBe('WLTP');
    const nedc = accept(example('full-nedc'));
    expect(nedc.co2Source).toBe('NEDC');
    const fallbackOnly = accept(
      listing({ wltp: undefined, co2Emissions: undefined, co2EmissionInGramPerKmWithFallback: 118.7 }),
    );
    expect(fallbackOnly.co2Source).toBe('UNKNOWN');
    expect(fallbackOnly.co2EmissionsGPerKmX10).toBe(1187);
    // §7-17 : un fallback qui contredit la branche retenue décrirait la même annonce deux fois.
    const divergent = accept(listing({ co2EmissionInGramPerKmWithFallback: 999 }));
    expect(divergent.notices).toContain('FALLBACK_VALUE_DIVERGENT');
    // §7-18 : 0 g/km hors électrique n'est pas une mesure.
    const zero = accept(
      listing({ wltp: undefined, fuelCategory: 'D', co2Emissions: 0, co2EmissionInGramPerKmWithFallback: 0, consumption: { combined: 5.6 } }),
    );
    expect(zero.co2EmissionsGPerKmX10).toBe(NUMERIC_UNKNOWN);
    expect(zero.notices).toContain('CO2_ZERO_NON_BEV');
    // Un BEV à 0 g/km, lui, est une valeur.
    const bev = accept(
      listing({ wltp: undefined, fuelCategory: 'E', co2Emissions: 0, co2EmissionInGramPerKmWithFallback: 0, consumption: undefined }),
    );
    expect(bev.co2EmissionsGPerKmX10).toBe(0);
    // Garde d'unité.
    const unit = accept(listing({ co2EmissionsUnit: 'g/mi' }));
    expect(unit.co2EmissionsGPerKmX10).toBe(NUMERIC_UNKNOWN);
    expect(hasIngestFlag(unit.ingestFlags, 'UNIT_UNSUPPORTED')).toBe(true);
  });

  it('# 51 `consumptionCombinedL100Km`, # 52 électrique, # 53 `consumptionSource`', () => {
    const wltp = accept(listing());
    expect(wltp.consumptionCombinedL100KmX10).toBe(12);
    expect(wltp.consumptionSource).toBe('WLTP');
    expect(wltp.unknownFields).not.toContain('consumptionElectricKwh100Km');
    const nedc = accept(example('full-nedc'));
    expect(nedc.consumptionSource).toBe('NEDC');
    const badUnit = accept(listing({ combinedUnit: 'mpg' }));
    expect(badUnit.consumptionCombinedL100KmX10).toBe(NUMERIC_UNKNOWN);
  });

  it('# 54 `euEmissionStandard`, # 55 `co2Class`, # 56 `efficiencyClass`', () => {
    expect(accept(listing()).euEmissionStandard).toBe(byteOf('KYCAR_EU_EMISSION_STANDARD', '6'));
    expect(accept(listing({ euEmissionStandard: '99' })).euEmissionStandard).toBe(ENUM_UNKNOWN_BYTE);
    // Branches exclusives (C-13) : `co2Class` côté WLTP, `efficiencyClass` côté NEDC.
    expect(accept(listing()).unknownFields).not.toContain('co2Class');
    expect(accept(listing()).unknownFields).toContain('efficiencyClass');
    expect(accept(example('full-nedc')).unknownFields).not.toContain('efficiencyClass');
    expect(accept(example('full-nedc')).unknownFields).toContain('co2Class');
  });

  it('# 57 `electricRangeKm` et # 58 `hasParticleFilter`', () => {
    expect(accept(listing()).electricRangeKm).toBe(62);
    expect(accept(listing({ electricRange: 99_999 })).electricRangeKm).toBe(NUMERIC_UNKNOWN);
    expect(readBooleanFlag(accept(listing()).booleanFlags, 'hasParticleFilter')).toBe(true);
    expect(readBooleanFlag(accept(listing({ hasParticleFilter: undefined })).booleanFlags, 'hasParticleFilter')).toBeNull();
  });
});

/* ================================================================================================
 * Carrosserie, finition, géographie, vendeur — # 64 à # 82
 * ============================================================================================== */

describe('adaptateur as24 — carrosserie, géographie et vendeur (# 64 à # 82)', () => {
  it('# 64 `bodyType`, # 65 `doorCount`, # 66 `seatCount`, # 67 `bodyColor`, # 68 `isMetallic`', () => {
    const row = accept(listing());
    expect(row.bodyType).toBe(byteOf('KYCAR_BODY_TYPE', '6'));
    expect(row.doorCount).toBe(5);
    expect(row.seatCount).toBe(5);
    expect(row.bodyColor).toBe(byteOf('KYCAR_BODY_COLOR', '5'));
    expect(readBooleanFlag(row.booleanFlags, 'isMetallic')).toBe(true);
    // Carrosserie hors des 9 codes voiture : INCONNU + ENUM_UNKNOWN.
    const bad = accept(listing({ bodyType: 101, doorCount: 99, seatCount: 200 }));
    expect(bad.bodyType).toBe(ENUM_UNKNOWN_BYTE);
    expect(hasIngestFlag(bad.ingestFlags, 'ENUM_UNKNOWN')).toBe(true);
    expect(bad.doorCount).toBe(ENUM_UNKNOWN_BYTE);
    expect(bad.seatCount).toBe(ENUM_UNKNOWN_BYTE);
  });

  it('# 69 `paintType` (H-01), # 70 `upholsteryType`, # 71 `upholsteryColor`', () => {
    const row = accept(listing());
    expect(row.upholsteryType).toBe(byteOf('KYCAR_UPHOLSTERY_TYPE', 'CL'));
    expect(row.unknownFields).not.toContain('paintType');
    expect(row.unknownFields).not.toContain('upholsteryColor');
    const absent = accept(listing({ paintType: undefined, upholsteryType: undefined, upholsteryColor: undefined }));
    expect(absent.unknownFields).toContain('paintType');
    expect(absent.upholsteryType).toBe(ENUM_UNKNOWN_BYTE);
    expect(absent.unknownFields).toContain('upholsteryColor');
  });

  it('# 72 `equipmentCodes` et # 73 `sealCodes` — hors vocabulaire retiré, ENUM_UNKNOWN levé', () => {
    expect(accept(listing()).unknownFields).not.toContain('equipmentCodes');
    const bad = accept(listing({ equipment: [1, 999_999], appliedSeals: [999_999] }));
    expect(hasIngestFlag(bad.ingestFlags, 'ENUM_UNKNOWN')).toBe(true);
    expect(bad.unknownFields).toContain('sealCodes');
  });

  it('# 74 `countryCode` — traduction obligatoire du code de marché ; hors ISO = REJET', () => {
    expect(accept(listing()).countryCode).toBe(byteOf('KYCAR_MARKETPLACE', 'be'));
    // `B` est un code de MARCHÉ, traduit en `BE` (EX-DATA-40) — jamais lu comme un code ISO.
    expect(accept(listing({ location: { countryCode: 'B', postalCodePrefix2: '40' } })).countryCode)
      .toBe(byteOf('KYCAR_MARKETPLACE', 'be'));
    expect(rejectOf(listing({ location: { countryCode: 'BEL' } }))).toBe('COUNTRY_CODE_INVALID');
    expect(rejectOf(listing({ location: undefined }))).toBe('COUNTRY_CODE_INVALID');
    // Un domaine ISO explicite rend la validation stricte plutôt que formelle.
    const strict = createAs24Context({
      referenceData: ref,
      observedAt: OBSERVED_AT,
      isoCountryCodes: new Set(['BE', 'NL']),
    });
    const out = adaptAs24Listing(listing({ location: { countryCode: 'XX' } }), strict);
    expect(out.kind).toBe('rejected');
  });

  it('# 75 `regionCode`, # 76 `regionName`, # 77 `postalCodePrefix2` — préfixe suffisant (D3-06)', () => {
    // 40xx → Liège (BE33) : le préfixe résout la plage sans ambiguïté, toutes commençant sur un
    // multiple de 100.
    expect(accept(listing({ location: { countryCode: 'BE', postalCodePrefix2: '40' } })).regionCode)
      .toBe(byteOf('KYCAR_REGION', 'BE33'));
    expect(accept(listing({ location: { countryCode: 'BE', postalCodePrefix2: '10' } })).regionCode)
      .toBe(byteOf('KYCAR_REGION', 'BE10'));
    // 0x : hors des plages belges → INCONNU + REGION_UNRESOLVED.
    const unresolved = accept(listing({ location: { countryCode: 'BE', postalCodePrefix2: '05' } }));
    expect(unresolved.regionCode).toBe(ENUM_UNKNOWN_BYTE);
    expect(hasIngestFlag(unresolved.ingestFlags, 'REGION_UNRESOLVED')).toBe(true);
    // EX-DATA-55 : hors Belgique, aucune région — et AUCUN drapeau (ce n'est pas un échec).
    const abroad = accept(listing({ marketplace: 'ca', location: { countryCode: 'CA' } }));
    expect(abroad.regionCode).toBe(ENUM_UNKNOWN_BYTE);
    expect(hasIngestFlag(abroad.ingestFlags, 'REGION_UNRESOLVED')).toBe(false);
    expect(accept(listing({ location: { countryCode: 'BE' } })).unknownFields).toContain('postalCodePrefix2');
  });

  it('# 78 `sellerType` — alias d’entrée d’EX-DATA-41 ; # 79 `adTier` — absence = `NONE`', () => {
    expect(accept(listing()).sellerType).toBe(byteOf('KYCAR_SELLER_TYPE', 'D'));
    expect(accept(listing({ seller: { type: 'dealer' } })).sellerType).toBe(byteOf('KYCAR_SELLER_TYPE', 'D'));
    expect(accept(listing({ seller: { type: 'private' } })).sellerType).toBe(byteOf('KYCAR_SELLER_TYPE', 'P'));
    expect(accept(listing({ seller: undefined })).sellerType).toBe(ENUM_UNKNOWN_BYTE);
    expect(accept(listing()).adTier).toBe(byteOf('KYCAR_AD_TIER', 'T50'));
    expect(accept(listing({ adProduct: undefined })).adTier).toBe(byteOf('KYCAR_AD_TIER', 'NONE'));
  });

  it('# 80 `imageCount` (DÉFAUT 0, plafond 50), # 81 `hasVideo` (DÉFAUT false), # 82 `ingestFlags`', () => {
    expect(accept(listing()).imageCount).toBe(27);
    expect(accept(listing({ imageCount: undefined })).imageCount).toBe(0);
    expect(accept(listing({ imageCount: 999 })).imageCount).toBe(50);
    expect(readBooleanFlag(accept(listing({ hasVideo: true })).booleanFlags, 'hasVideo')).toBe(true);
    expect(readBooleanFlag(accept(listing({ hasVideo: undefined })).booleanFlags, 'hasVideo')).toBe(false);
    // # 82 : masque cumulatif, `0` quand rien ne s'est produit.
    expect(accept(listing()).ingestFlags).toBe(0);
    expect(accept(listing({ mileage: 5_000_000, power: 99_999 })).ingestFlags).toBeGreaterThan(0);
  });

  it('E-02 — `dealerBucket` est lu (dédoublonnage) mais n’a AUCUNE colonne : R3 structurelle', () => {
    const row = accept(listing());
    expect(row.dealerBucket).toBe('7f3a91c2');
    const { batch } = assembleBatch([row], new Uint8Array(16), 'snap', 'FULL');
    expect(Object.keys(batch)).not.toContain('dealerBucket');
    expect(Object.keys(batch)).not.toContain('sellerId');
    expect(batch.rowCount).toBe(1);
    expect(batch.stringOffsets).toHaveLength(STRINGS_PER_ROW + 1);
  });
});

/* ================================================================================================
 * Conventions transverses et couverture de la table §3.1
 * ============================================================================================== */

describe('adaptateur as24 — conventions transverses', () => {
  it('les tables de codes pré-calculées rendent EXACTEMENT ce que rend `codeIndex` (convention D3)', () => {
    expect(tablesAgreeWithCodeIndex(ref, buildAs24CodeTables(ref))).toBe(true);
  });

  it('l’adaptateur est PUR : deux adaptations de la même ligne donnent la même sortie', () => {
    const a = accept(listing());
    const b = accept(listing());
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('l’adaptateur ne MUTE jamais son entrée', () => {
    const raw = listing();
    const before = JSON.stringify(raw);
    accept(raw);
    expect(JSON.stringify(raw)).toBe(before);
  });

  it('`minimal.json` — six champs obligatoires seulement : tout le reste est INCONNU, jamais `0`', () => {
    const row = accept(example('minimal') as unknown as Record<string, unknown>);
    expect(row.priceEur).toBe(NUMERIC_UNKNOWN);
    expect(row.mileageKm).toBe(NUMERIC_UNKNOWN);
    expect(row.modelYear).toBe(NUMERIC_UNKNOWN);
    expect(row.fuelCategory).toBe(ENUM_UNKNOWN_BYTE);
    expect(row.modelId).toBe(0); // valeur RÉSERVÉE « modèle non identifié », pas une sentinelle
    expect(row.imageCount).toBe(0); // DÉFAUT documenté, pas un inconnu
    expect(row.adTier).toBe(byteOf('KYCAR_AD_TIER', 'NONE')); // DÉFAUT documenté
    expect(row.unknownFields.length).toBeGreaterThan(20);
  });

  it('couverture — les 82 champs de la table §3.1 sont cités par au moins un cas de ce fichier', () => {
    const source = readFileSync(new URL(import.meta.url), 'utf-8');
    const cited = new Set<number>();
    for (const m of source.matchAll(/#\s(\d{1,2})(?!\d)/g)) cited.add(Number(m[1]));
    const missing: number[] = [];
    for (let field = 1; field <= 82; field += 1) if (!cited.has(field)) missing.push(field);
    expect(missing, `champs de la table §3.1 sans cas de test : ${missing.join(', ')}`).toEqual([]);
  });
});

/** Contrôle de forme : le type source n'admet aucun champ hors schéma (R3 structurelle). */
const _typeGuard: As24Listing = {
  id: '0f7c5a1e-2b34-4c8d-9a10-5e6f7a8b9c0d',
  webPage: 'https://www.autoscout24.be/offres/0f7c5a1e-2b34-4c8d-9a10-5e6f7a8b9c0d',
  marketplace: 'be',
  vehicleType: 'C',
  make: 74,
  location: { countryCode: 'BE' },
};
void _typeGuard;
