/**
 * KYCAR — Sondes transverses `patho` : VALEURS (revue 2.5)
 * =================================================================================================
 * Rejeu des attaques par la VALEUR d'`ST-adversarial.md` (ADV-04, ADV-06, ADV-07, ADV-16 et la
 * matrice §« attaques tentées ») à travers la chaîne réelle `DataProvider` → moteur → écrans.
 *
 * Attendus normatifs (les seuls qui font foi ici) :
 *   - `ARB-15` / `EX-DATA-16` / `EX-DATA-60` : un effectif compte tout, une statistique de prix
 *     exclut selon `EX-DATA-60`.
 *   - `ARB-13` / `EX-DATA-19` : `PRICE_SENTINEL_ABSOLUTE` (`priceEur < 250`) posé à L'INGESTION,
 *     `PRICE_IMPLAUSIBLE_IN_CELL` (`priceEur < 0,10 × médianeRéf(C)`) recalculé à L'ANALYSE.
 *   - `ARB-16` : `priceEur = 0` ou `> 5 000 000` → `INCONNU` + drapeau, JAMAIS rejet de l'annonce.
 *   - `ARB-17` : paliers 0 / 1-4 / 5-11 / 12-29 / ≥ 30, seuils 12 (M1) et 30 (M2).
 */

import { describe, expect, it } from 'vitest';

import { mapListingToNormalized } from '../../../src/providers/tweedehands/normalize';
import { buildEuroStandardIndex } from '../../../src/providers/tweedehands/vocabularyMap';
import { loadRealReferenceData, makeRawListing } from '../../../src/providers/tweedehands/testFixtures';
import { buildListingRow } from '../../../src/screens/listings/listing-fields';
import { OutlierIndex } from '../../../src/screens/outlier-index';
import { AggregationDataset } from '../../../src/engine/index';
import { buildModelZoneViewModel } from '../../../src/screens/market/view-model';
import { effectifTier } from '../../../src/screens/market/thresholds';
import {
  buildBatch,
  cell,
  checkInvariants,
  ingestBit,
  PS_MISSING,
  PS_ON_REQUEST,
  recalcOf,
  type RowSpec,
} from './_fixtures';

const referenceData = loadRealReferenceData();
const euroIndex = buildEuroStandardIndex(referenceData);

/** Annonce 2dehands minimale, résolue sur le référentiel réel (Opel Corsa). */
function rawCorsa(overrides: Parameters<typeof makeRawListing>[0] extends infer T ? Partial<T> : never = {}) {
  return makeRawListing({
    itemId: 'patho-0000-0000-0000-000000000001',
    brand: 'Opel',
    model: 'Corsa',
    priceCents: 1299900,
    priceType: 'FIXED',
    constructionYear: '2019',
    mileage: '90.000 km',
    fuel: 'Benzine',
    enginePowerKW: '85',
    ...overrides,
  });
}

describe('patho — valeurs de prix', () => {
  it('VAL-PRIX-0 — prix 0 € : INCONNU + MISSING, annonce conservée dans l’effectif (ARB-16, EX-DATA-16a)', () => {
    const listing = mapListingToNormalized(rawCorsa({ priceCents: 0 }), referenceData, 'be', euroIndex);
    expect(listing.priceEur).toBeNull();
    expect(listing.priceStatus).toBe('MISSING');
    expect(listing.makeId).not.toBeNull(); // l'annonce n'est pas rejetée
    expect(listing.ingestFlags).toContain('PRICE_MISSING_UNDECLARED');
  });

  it('VAL-PRIX-ONREQ-MISSING — comptées dans l’effectif, exclues de toute statistique de prix (EX-DATA-16)', async () => {
    const specs: RowSpec[] = [
      ...cell(10, { basePrice: 12000 }),
      { priceEur: null, priceStatus: PS_ON_REQUEST },
      { priceEur: null, priceStatus: PS_MISSING },
    ];
    const recalc = await recalcOf(specs);
    const s = recalc.selectionStats;

    expect(s.selectionCount).toBe(12); // l'effectif compte tout
    expect(s.price.n).toBe(10); // la statistique de prix n'en compte que 10
    expect(s.priceOnRequestCount).toBe(1);
    expect(s.priceMissingCount).toBe(1);
    expect(checkInvariants(recalc).priceStatusPartitionOk).toBe(true);
    expect(checkInvariants(recalc).priceBucketSum).toBe(10);
  });

  it('VAL-PRIX-SENTINELLE-MOTEUR — le moteur exclut bien un prix portant PRICE_SENTINEL_ABSOLUTE (EX-DATA-60)', async () => {
    const flag = ingestBit('PRICE_SENTINEL_ABSOLUTE');
    const specs: RowSpec[] = [...cell(12, { basePrice: 12000 }), { priceEur: 1, ingestFlags: flag }];
    const recalc = await recalcOf(specs);

    expect(recalc.selectionStats.selectionCount).toBe(13); // comptée dans l'effectif
    expect(recalc.selectionStats.price.n).toBe(12); // hors V_price
    expect(recalc.selectionStats.price.min).toBeGreaterThan(1);
  });

  it('R-PATHO-01 — ADV-04 / ARB-13 : aucune ingestion ne pose PRICE_SENTINEL_ABSOLUTE, un prix à 1 € entre dans V_price', () => {
    // EX-DATA-19(1) : « `PRICE_SENTINEL_ABSOLUTE` — étage ingestion, posé une fois par annonce :
    // `priceEur < 250` ». Le seul adaptateur d'ingestion du dépôt ne le pose jamais.
    const listing = mapListingToNormalized(rawCorsa({ priceCents: 100 }), referenceData, 'be', euroIndex);
    expect(listing.priceEur).toBe(1);
    expect(listing.priceStatus).toBe('QUOTED');
    expect(listing.ingestFlags).toContain('PRICE_SENTINEL_ABSOLUTE');
  });

  it('R-PATHO-02 — ADV-16 / ARB-16 : un prix au-dessus du plafond n’est ni écarté du prix ni drapeauté PRICE_OUT_OF_RANGE', () => {
    // ARB-16 : « `p > 5 000 000` → `priceEur = INCONNU`, `ingestFlags += PRICE_OUT_OF_RANGE`. »
    const listing = mapListingToNormalized(rawCorsa({ priceCents: 1_000_000_000 }), referenceData, 'be', euroIndex);
    expect(listing.priceEur).toBe(10_000_000); // constaté : la valeur aberrante est conservée telle quelle
    expect(listing.ingestFlags).toContain('PRICE_OUT_OF_RANGE');
  });

  it('R-PATHO-03 — ADV-04 / ARB-13 : PRICE_IMPLAUSIBLE_IN_CELL n’existe pas, un prix à 900 € fausse la médiane de la cellule', async () => {
    // EX-DATA-19(2) : `priceEur < 0,10 × médianeRéf(C)` est exclu de `V_price` (EX-DATA-60).
    // Cellule de 20 annonces à 12 000 € (médiane de référence 12 000 €) + une annonce à 900 €.
    const sain: RowSpec[] = Array.from({ length: 20 }, (_v, i) => ({
      makeId: 1,
      modelId: 101,
      year: 2018,
      month: 1 + (i % 12),
      priceEur: 12000,
      mileageKm: 60000 + i * 100,
    }));
    const sans = await recalcOf(sain);
    const avec = await recalcOf([...sain, { makeId: 1, modelId: 101, year: 2018, priceEur: 900, mileageKm: 61000 }]);

    expect(sans.selectionStats.price.n).toBe(20);
    expect(avec.selectionStats.selectionCount).toBe(21); // compte dans l'effectif : conforme
    // ATTENDU : l'annonce à 900 € (< 0,10 × 12 000 = 1 200) sort de V_price ⇒ n_price reste 20 et
    // le minimum publié reste 12 000 €.
    expect(avec.selectionStats.price.n).toBe(20);
    expect(avec.selectionStats.price.min).toBe(12000);
  });
});

describe('patho — valeurs d’année, de kilométrage et de puissance', () => {
  it('VAL-ANNEE-ABSENTE — exclusion métrique par métrique, jamais d’imputation (EX-DATA-26)', async () => {
    const recalc = await recalcOf([
      ...cell(5, { basePrice: 10000 }),
      { priceEur: 11000, year: null, mileageKm: 70000 },
    ]);
    expect(recalc.selectionStats.selectionCount).toBe(6);
    expect(recalc.selectionStats.year.n).toBe(5); // l'année manquante sort de la seule métrique année
    expect(recalc.selectionStats.price.n).toBe(6); // et de rien d'autre
    expect(recalc.selectionStats.mileage.n).toBe(6);
  });

  it('VAL-ANNEE-FUTURE — une année future reste comptée et bornée, sans faire échouer le binning', async () => {
    const recalc = await recalcOf([...cell(11, { year: 2018 }), { priceEur: 30000, year: 2099, mileageKm: 10 }]);
    expect(recalc.selectionStats.year.n).toBe(12);
    expect(recalc.selectionStats.year.max).toBe(2099);
    // Le débordement haut de `BIN` absorbe l'année aberrante : la somme des bins reste égale à n.
    expect(checkInvariants(recalc).yearBucketSum).toBe(12);
  });

  it('VAL-KM-0-ET-1M — 0 km drapeauté sort de V_mileage, 10⁶ km reste dans le domaine (EX-DATA-38, EX-DATA-111)', async () => {
    const zeroFlag = ingestBit('SUSPECT_ZERO_MILEAGE');
    const recalc = await recalcOf([
      ...cell(5, {}),
      { priceEur: 12000, mileageKm: 0, ingestFlags: zeroFlag },
      { priceEur: 4000, mileageKm: 1_000_000 },
    ]);
    expect(recalc.selectionStats.selectionCount).toBe(7);
    expect(recalc.selectionStats.mileage.n).toBe(6); // le 0 km drapeauté est hors échantillon
    expect(recalc.selectionStats.mileage.max).toBe(1_000_000);
  });

  it('R-PATHO-04 — un kilométrage NÉGATIF traverse l’ingestion et le moteur et devient le minimum publié', async () => {
    // Champ 12 `mileageKm`, domaine validé `[0, 1 500 000]` (EX-DATA-111) : une valeur négative doit
    // être INCONNU (+ `MILEAGE_OUT_OF_RANGE`), jamais une valeur de l'échantillon.
    const ingested = mapListingToNormalized(rawCorsa({ mileage: '-5 km' }), referenceData, 'be', euroIndex);
    expect(ingested.mileageKm).toBeNull();

    const recalc = await recalcOf([...cell(5, {}), { priceEur: 12000, mileageKm: -5 }]);
    expect(recalc.selectionStats.mileage.min).toBeGreaterThanOrEqual(0);
  });

  it('R-PATHO-05 — puissance 0 kW : hors domaine [1, 9999], doit devenir INCONNU et non 0', async () => {
    const ingested = mapListingToNormalized(rawCorsa({ enginePowerKW: '0' }), referenceData, 'be', euroIndex);
    expect(ingested.powerKw).toBeNull();

    const batch = buildBatch([{ priceEur: 12000, powerKw: 0 }]);
    const row = buildListingRow(batch, 0, new OutlierIndex([]));
    expect(row.powerKw).toBeNull(); // constaté : 0, indiscernable d'une puissance réelle
  });
});

describe('patho — variance nulle et seuils d’effectif (ADV-06 / ADV-07 → ARB-17)', () => {
  /** 40 annonces au même prix ; le kilométrage varie (le régresseur n'est donc pas dégénéré). */
  const varianceNulle = (): RowSpec[] =>
    Array.from({ length: 40 }, (_v, i) => ({
      makeId: 2,
      modelId: 202,
      year: 2017,
      month: 1 + (i % 12),
      priceEur: 15000,
      mileageKm: 40000 + i * 500,
    }));

  it('VAL-VARIANCE-0 — toutes les annonces au même prix : AUCUN faux positif (EX-DATA-89/92)', async () => {
    const recalc = await recalcOf(varianceNulle());
    expect(recalc.selectionStats.price.n).toBe(40);
    expect(recalc.selectionStats.price.p50).toBe(15000);
    expect(recalc.outlierVerdicts).toHaveLength(0); // ni M1 (IQR = 0) ni M2
  });

  it('VAL-VARIANCE-0-COLIN — prix ET kilométrage constants : les deux régresseurs sont retirés, 0 évaluée', async () => {
    const specs = varianceNulle().map((r) => ({ ...r, mileageKm: 40000 }));
    const recalc = await recalcOf(specs);
    expect(recalc.outlierVerdicts).toHaveLength(0);
    expect(recalc.selectionStats.outlierEvaluatedCount).toBe(0); // INSUFFICIENT_SPREAD, conforme
  });

  it('R-PATHO-07 — variance de prix nulle : M2 déclare 40 annonces « évaluées » sur un MAD de bruit flottant', async () => {
    // EX-DATA-92 : `s = 1,4826 · MAD` ; à dispersion strictement nulle, le verdict doit être
    // `INSUFFICIENT_SPREAD` et l'annonce compter dans `outlierNotEvaluatedCount` (invariant I6).
    // Le test `pass.s <= 0` d'`outliers.ts` ne capture que le zéro EXACT : ici `MAD ≈ 1e-16 > 0`.
    const recalc = await recalcOf(varianceNulle());
    expect(recalc.selectionStats.outlierEvaluatedCount).toBe(0);
    expect(recalc.selectionStats.outlierNotEvaluatedCount).toBe(40);
  });

  it.each([11, 12, 29, 30])('VAL-SEUIL-%i — méthodes disponibles et palier d’écran alignés sur 12 (M1) et 30 (M2)', async (n) => {
    // Cellule (marque, modèle, année) d'exactement n annonces, une valeur franchement écartée
    // pour que la détection ait quelque chose à signaler quand elle est applicable.
    // La valeur écartée vaut 4 000 € et non 1 200 € : à 1 200 € elle tombe SOUS
    // `0,10 × médianeRéf(C) = 1 250 €` et porte donc `PRICE_IMPLAUSIBLE_IN_CELL` (EX-DATA-19(2)),
    // qui l'exclut de `V_price(C)` et interdit de l'évaluer — la sonde n'aurait plus aucune annonce
    // signalable et mesurerait la sentinelle relative au lieu des paliers 12 / 30 qu'elle vise.
    const specs: RowSpec[] = Array.from({ length: n }, (_v, i) => ({
      makeId: 5,
      modelId: 505,
      year: 2016,
      month: 1 + (i % 12),
      priceEur: i === 0 ? 4000 : 12000 + (i % 7) * 250,
      mileageKm: 30000 + i * 1500,
    }));
    const batch = buildBatch(specs);
    const recalc = new AggregationDataset(batch).recalculate({ selectionHash: `n${n}` });

    const m1 = recalc.outlierVerdicts.filter((v) => v.method === 'M1');
    const m2 = recalc.outlierVerdicts.filter((v) => v.method === 'M2');

    if (n < 12) {
      expect(m1).toHaveLength(0);
      expect(m2).toHaveLength(0);
      expect(effectifTier(n)).toBe('reduite');
    } else if (n < 30) {
      expect(m1.length).toBeGreaterThan(0); // M1 seule
      expect(m2).toHaveLength(0);
      expect(effectifTier(n)).toBe('sans-m2');
    } else {
      expect(m1.length).toBeGreaterThan(0);
      expect(m2.length).toBeGreaterThan(0); // M1 et M2
      expect(effectifTier(n)).toBe('complete');
    }
  });

  it('R-PATHO-06 — ARB-17 : à 5 ≤ n ≤ 11 la zone-modèle publie quand même la fourchette P5–P95', async () => {
    // ARB-17 (palier 5-11) : « médiane, min et max affichés ; percentiles `P5`/`P95`, bande
    // interquartile, régression et détection d'outliers DÉSACTIVÉS ».
    const recalc = await recalcOf(cell(8, { makeId: 9, modelId: 909, basePrice: 14000 }));
    const zone = buildModelZoneViewModel(recalc.modelAggregates[0]!, undefined, 8, false);

    expect(effectifTier(8)).toBe('reduite');
    expect(zone.medianLabel.startsWith('méd.')).toBe(true); // médiane : conforme
    expect(zone.price.available).toBe(false); // ATTENDU : pas de P5–P95 à ce palier
  });

  it('VAL-BASCULE-29-30 — le passage de 29 à 30 change la méthode ET le score, sans rien à l’écran (ADV-07/ARB-18)', async () => {
    const base = (n: number): RowSpec[] =>
      Array.from({ length: n }, (_v, i) => ({
        makeId: 6,
        modelId: 606,
        year: 2015,
        month: 1 + (i % 12),
        priceEur: i === 0 ? 1500 : 11000 + (i % 5) * 400,
        mileageKm: 25000 + i * 2000,
      }));
    const at29 = await recalcOf(base(29));
    const at30 = await recalcOf(base(30));

    const methods29 = new Set(at29.outlierVerdicts.map((v) => v.method));
    const methods30 = new Set(at30.outlierVerdicts.map((v) => v.method));
    expect(methods29.has('M2')).toBe(false);
    expect(methods30.has('M2')).toBe(true);
    // La discontinuité est assumée par ARB-18 ; ce qu'elle exige est une MENTION de méthode,
    // vérifiée par `methodLabel` (sonde `verite-affichee.test.ts`).
  });
});
