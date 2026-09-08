import { beforeAll, describe, expect, it } from 'vitest';
import type { ListingColumnBatch, ReferenceData } from '../types/index';
import { detectOutliers, type OutlierResult } from './outliers';
import { isMileageValid, isPriceValid, isYearValid, PRICE_STATUS_QUOTED } from './flags';
import { modelIndexKey } from './index-build';
import type { InjectedOutlier } from '../providers/synthetic/generate';
import { loadReferenceData, openSyntheticProvider } from './testkit';

/**
 * Critère de succès D4 #7 : M1 (Tukey sur ln prix) et M2 (régression robuste MAD) RETROUVENT les
 * outliers de la vérité terrain injectée par D3 ; M3 (`priceEvaluationCategory`) est un CONTRÔLE
 * externe (jamais détecteur). On mesure précision/rappel et on les imprime.
 *
 * Rappel  = injectés d'une méthode retrouvés par cette méthode / injectés de cette méthode.
 * Précision = détections de la méthode qui sont des injectés (de n'importe quelle méthode : un
 *   injecté « relatif » peut aussi être absolu) / détections de la méthode. La précision est
 *   structurellement bornée par les queues NATURELLES du dataset synthétique (extrêmes plausibles
 *   non injectés) : on la RAPPORTE honnêtement sans exiger un plancher élevé.
 */

const N = 100_000;

let ref: ReferenceData;
let result: OutlierResult;
let truth: readonly InjectedOutlier[];
let batch: ListingColumnBatch;

const inter = (a: ReadonlySet<string>, b: ReadonlySet<string>): number => {
  let c = 0;
  for (const x of a) if (b.has(x)) c += 1;
  return c;
};

beforeAll(async () => {
  ref = loadReferenceData();
  const provider = await openSyntheticProvider(ref, N, 7);
  batch = provider.getDataset().batch;
  truth = provider.getGroundTruthOutliers();
  const rows = Int32Array.from({ length: batch.rowCount }, (_v, i) => i);
  result = detectOutliers(batch, rows, batch.snapshotId, 'FULL:EMPTY');
  // Trace globale.
  const truthM1 = truth.filter((o) => o.method === 'M1').length;
  const truthM2 = truth.filter((o) => o.method === 'M2').length;
  console.log(
    `[D4 outliers] N=${N} ; vérité terrain M1=${truthM1} M2=${truthM2} ; ` +
      `détections M1=${result.m1FlaggedIds.size} M2=${result.m2FlaggedIds.size} ; verdicts=${result.verdicts.length}`,
  );
});

describe('D4 — détection d’outliers vs vérité terrain D3 (EX-DATA-84..96)', () => {
  it('M1 retrouve les outliers ABSOLUS injectés (rappel élevé)', () => {
    const truthM1 = new Set(truth.filter((o) => o.method === 'M1').map((o) => o.listingId));
    const allInjected = new Set(truth.map((o) => o.listingId));
    // EX-DATA-19(2) : un injecté dont le prix tombe sous `0,10 × médianeRéf(C)` porte
    // `PRICE_IMPLAUSIBLE_IN_CELL`, sort de `V_price(C)` et n'est donc PAS évaluable — le rappel se
    // mesure sur la population que l'exigence laisse détectable. Le rappel brut reste imprimé.
    const evaluable = new Set([...truthM1].filter((id) => !result.implausibleInCellIds.has(id)));
    const tp = inter(truthM1, result.m1FlaggedIds);
    const recall = tp / evaluable.size;
    const rawRecall = tp / truthM1.size;
    const precision = inter(result.m1FlaggedIds, allInjected) / result.m1FlaggedIds.size;
    console.log(
      `[M1] rappel évaluable = ${(recall * 100).toFixed(1)}% (${tp}/${evaluable.size}) ; ` +
        `rappel brut = ${(rawRecall * 100).toFixed(1)}% (${tp}/${truthM1.size}) ; ` +
        `injectés écartés PRICE_IMPLAUSIBLE_IN_CELL = ${truthM1.size - evaluable.size} ; ` +
        `précision(injecté-tout) = ${(precision * 100).toFixed(1)}% (sur ${result.m1FlaggedIds.size} signalés)`,
    );
    expect(truthM1.size).toBeGreaterThan(50);
    expect(recall).toBeGreaterThan(0.9);
  });

  it('M2 retrouve les outliers RELATIFS injectés (rappel mesuré)', () => {
    const truthM2 = new Set(truth.filter((o) => o.method === 'M2').map((o) => o.listingId));
    const allInjected = new Set(truth.map((o) => o.listingId));
    // Un injecté relatif peut être capté par M1 (absolu) ou M2 : on mesure le rappel par l'UNION des
    // deux détecteurs, plus la part propre à M2.
    const union = new Set<string>([...result.m1FlaggedIds, ...result.m2FlaggedIds]);
    // Même correction qu'en M1 : les injectés marqués `PRICE_IMPLAUSIBLE_IN_CELL` (EX-DATA-19(2))
    // sortent de `V_price(C)` et ne sont pas évaluables.
    const evaluable = new Set([...truthM2].filter((id) => !result.implausibleInCellIds.has(id)));
    const tpUnion = inter(truthM2, union);
    const tpM2 = inter(truthM2, result.m2FlaggedIds);
    const recallUnion = tpUnion / evaluable.size;
    const recallM2 = tpM2 / evaluable.size;
    const precisionM2 = inter(result.m2FlaggedIds, allInjected) / result.m2FlaggedIds.size;
    console.log(
      `[M2] rappel(union M1∪M2) = ${(recallUnion * 100).toFixed(1)}% (${tpUnion}/${evaluable.size}) ; ` +
        `rappel(M2 seul) = ${(recallM2 * 100).toFixed(1)}% (${tpM2}/${evaluable.size}) ; ` +
        `injectés écartés PRICE_IMPLAUSIBLE_IN_CELL = ${truthM2.size - evaluable.size} ; ` +
        `précision M2(injecté-tout) = ${(precisionM2 * 100).toFixed(1)}% (sur ${result.m2FlaggedIds.size} signalés)`,
    );
    expect(truthM2.size).toBeGreaterThan(50);
    // Rappel M2 borné par la GRANULARITÉ : un outlier relatif à un modèle rare (cellule < 30 points
    // F) retombe sur la régression de sélection globale, où il n'est plus anormal. Cf. le diagnostic
    // ci-dessous qui isole cette cause. On assied le plancher sur le réel mesuré, sans le maquiller.
    expect(recallUnion).toBeGreaterThan(0.6);
  });

  it('DIAGNOSTIC — le rappel M2 est gouverné par la taille de cellule (marque·modèle)', () => {
    // Compte, par cellule (make,model), le nombre de lignes ADMISSIBLES à la régression M2 :
    // prix affiché valide + année valide + kilométrage valide (points F d'EX-DATA-90).
    const fCountByCell = new Map<string, number>();
    for (let i = 0; i < batch.rowCount; i += 1) {
      const status = batch.priceStatus[i] as number;
      if (status !== PRICE_STATUS_QUOTED) continue;
      const price = batch.priceEur[i] as number;
      const ingest = batch.ingestFlags[i] as number;
      if (!isPriceValid(price, status, ingest)) continue;
      const ym = batch.firstRegistrationYearMonth[i] as number;
      if (!isYearValid(ym)) continue;
      if (!isMileageValid(batch.mileageKm[i] as number, ingest)) continue;
      const key = modelIndexKey(batch.makeId[i] as number, batch.modelId[i] as number);
      fCountByCell.set(key, (fCountByCell.get(key) ?? 0) + 1);
    }

    const m2 = truth.filter((o) => o.method === 'M2');
    let bigCell = 0;
    let bigCaught = 0;
    let smallCell = 0;
    let smallCaught = 0;
    for (const o of m2) {
      const cellF = fCountByCell.get(modelIndexKey(o.makeId, o.modelId)) ?? 0;
      const caught = result.m2FlaggedIds.has(o.listingId);
      if (cellF >= 30) {
        bigCell += 1;
        if (caught) bigCaught += 1;
      } else {
        smallCell += 1;
        if (caught) smallCaught += 1;
      }
    }
    const pct = (a: number, b: number): string => (b === 0 ? 'n/a' : `${((a / b) * 100).toFixed(1)}%`);
    console.log(
      `[M2 cause] cellule ≥30 points : rappel M2 = ${pct(bigCaught, bigCell)} (${bigCaught}/${bigCell}) ; ` +
        `cellule <30 points : rappel M2 = ${pct(smallCaught, smallCell)} (${smallCaught}/${smallCell})`,
    );
    // La preuve : dans les cellules assez grandes pour une régression par modèle, M2 retrouve
    // l'essentiel des injectés ; l'essentiel des ratés sont dans des cellules trop petites.
    if (bigCell >= 20) expect(bigCaught / bigCell).toBeGreaterThan(0.8);
  });

  it('M3 est un contrôle externe cohérent (jamais détecteur)', () => {
    const m3 = result.m3;
    console.log(
      `[M3] population évaluée = ${m3.evaluatedPopulation} ; précisionBas = ${fmt(m3.precisionLow)} ; ` +
        `rappelBas = ${fmt(m3.recallLow)} ; kappa = ${fmt(m3.kappa)} ; couverture = ${fmt(m3.evalCoverage)}`,
    );
    expect(m3.evaluatedPopulation).toBeGreaterThan(0);
    // M3 est un contrôle : il expose une contingence, pas un flux de verdicts.
    expect(result.verdicts.every((v) => v.method === 'M1' || v.method === 'M2')).toBe(true);
  });

  it('les verdicts portent un listingId canonique (traçabilité de forage)', () => {
    expect(result.verdicts.length).toBeGreaterThan(0);
    const sample = result.verdicts.slice(0, 5).map((v) => v.listingId);
    for (const id of sample) {
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    }
  });
});

function fmt(x: number | null): string {
  return x === null ? 'n/a' : x.toFixed(3);
}
