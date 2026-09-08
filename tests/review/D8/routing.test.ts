/**
 * Revue D8 — sonde n°5 : ROUTAGE (EX-NAV-1…4, 2bis, 2ter, 18, 19, 20 ; EX-SCR-49, 140, 194 ; ADV-14 ; RES-6).
 */
import { beforeAll, describe, expect, it } from 'vitest';

import { resolveView } from '../../../src/app/navigation';
import { buildPath, resolveTaxonomyRoute, type ModelDistributionRoute } from '../../../src/state/router';
import { loadQuery } from '../../../src/state/corrections';
import { parseCompareParam } from '../../../src/screens/compare/compare-selection';
import { DataController } from '../../../src/orchestration/data-controller';
import { loadReferenceDataFromDisk } from '../../../src/orchestration/reference-fs';
import { SyntheticDataProvider } from '../../../src/providers/synthetic/index';
import type { ReferenceData } from '../../../src/types/reference';
import { CORSA_MODEL_ID, OPEL_MAKE_ID, instrumentedEngineFactory } from './_helpers';

let ref: ReferenceData;
beforeAll(() => {
  ref = loadReferenceDataFromDisk();
});

describe('les 6 routes + /mentions (EX-NAV-1…4, 2bis, 2ter) et l’écran d’erreur', () => {
  it('résout chaque route de l’annexe C vers la bonne vue, et /suivis, /mentions', () => {
    expect(resolveView('/marche')).toEqual({ kind: 'market' });
    expect(resolveView('/marche/54-opel/1918-corsa')).toEqual({ kind: 'modelDistribution', makeId: 54, makeSlug: 'opel', modelId: 1918, modelSlug: 'corsa' });
    expect(resolveView('/marche/54-opel/1918-corsa/annonces')).toEqual({ kind: 'modelListings', makeId: 54, makeSlug: 'opel', modelId: 1918, modelSlug: 'corsa' });
    expect(resolveView('/comparer')).toEqual({ kind: 'compare' });
    expect(resolveView('/recherches')).toEqual({ kind: 'savedSearches' });
    expect(resolveView('/suivis')).toEqual({ kind: 'followed' });
    expect(resolveView('/mentions')).toEqual({ kind: 'mentions' });
    expect(resolveView('/')).toEqual({ kind: 'market' }); // EX-SCR-49
  });

  it('chemin inconnu, segment mal formé, casse différente : vue notFound (EX-NAV-20 écran d’erreur), jamais une exception', () => {
    expect(resolveView('/nawak').kind).toBe('notFound');
    expect(resolveView('/marche/opel/corsa').kind).toBe('notFound');
    expect(resolveView('/Marche').kind).toBe('notFound');
    expect(resolveView('/marche/54-opel/1918-corsa/autre').kind).toBe('notFound');
  });

  it('EX-NAV-18 : deux résolutions du même chemin+requête donnent la même vue et la même sélection (fonction pure)', () => {
    const p = '/marche/54-opel/1918-corsa';
    const q = '?priceto=20000&kmto=100000&body=3';
    expect(resolveView(p)).toEqual(resolveView(p));
    expect(loadQuery(q)).toEqual(loadQuery(q));
    expect(resolveView(`${p}${q}`)).toEqual(resolveView(p)); // la requête n'influence pas la vue
    // et l'aller-retour chemin canonique est stable
    const view = resolveView(p);
    if (view.kind !== 'modelDistribution') throw new Error('vue inattendue');
    expect(buildPath({ name: 'modelDistribution', ...view })).toBe(p);
  });

  it('ADV-14 / ARB-59 : modelId = 0 est une route valide (jamais « modèle inconnu ») si la marque existe', () => {
    const view = resolveView('/marche/54-opel/0-modele-non-identifie');
    expect(view).toMatchObject({ kind: 'modelDistribution', makeId: 54, modelId: 0 });
    const route: ModelDistributionRoute = { name: 'modelDistribution', makeId: 54, makeSlug: 'opel', modelId: 0, modelSlug: 'modele-non-identifie' };
    expect(resolveTaxonomyRoute(route, ref).ok).toBe(true);
    // mais pas si la marque n'existe pas (EX-NAV-19 prime)
    expect(resolveTaxonomyRoute({ ...route, makeId: 999_999 }, ref)).toEqual({ ok: false, error: { kind: 'unknownMake', makeId: 999_999 } });
  });

  it('EX-NAV-19/20 : le validateur taxonomique D5 distingue marque inconnue et modèle hors marque', () => {
    const base: ModelDistributionRoute = { name: 'modelDistribution', makeId: 54, makeSlug: 'opel', modelId: 1918, modelSlug: 'corsa' };
    expect(resolveTaxonomyRoute(base, ref).ok).toBe(true);
    expect(resolveTaxonomyRoute({ ...base, modelId: 1174 }, ref)).toEqual({ ok: false, error: { kind: 'unknownModel', makeId: 54, modelId: 1174 } });
  });

  it('R-D8-14 — la coquille n’applique pas EX-NAV-19/20 : enterMode2 sert un écran B vide pour une marque ou un modèle inconnus au lieu de l’écran d’erreur', async () => {
    const provider = new SyntheticDataProvider({ referenceData: ref, listingCount: 2000, seed: 2 });
    const controller = new DataController({ provider, referenceData: ref, engineFactory: instrumentedEngineFactory().factory });
    await controller.start();
    await expect(controller.enterMode2(999_999, 1)).rejects.toThrow(/marque inconnue/i);
    await expect(controller.enterMode2(OPEL_MAKE_ID, 1174)).rejects.toThrow(/n’existe pas pour cette marque|n'existe pas pour cette marque/i);
    controller.dispose();
  });

  it('R-D8-15 — route héritée `/modele/:makeId/:modelId` (annexe C § A.1, RES-6) : doit mener à l’écran B canonique, pas à notFound', () => {
    expect(resolveView(`/modele/${OPEL_MAKE_ID}/${CORSA_MODEL_ID}`)).toMatchObject({ kind: 'modelDistribution', makeId: OPEL_MAKE_ID, modelId: CORSA_MODEL_ID });
  });
});

describe('/comparer — paramètre `m` (EX-SCR-194, EX-NAV-2ter, EX-CRUD-13bis)', () => {
  it('les identifiants de modèle sont uniques dans toute la taxonomie (la forme `m=<modelId>,…` d’EX-SCR-194 serait donc résoluble aussi)', () => {
    const ids = new Set(ref.models.map((m) => m.modelId));
    expect(ids.size).toBe(ref.models.length);
  });

  it('R-D8-17 — `m=54-1918,54-1916` (format normatif d’EX-NAV-10bis : `<makeId>-<modelId>`) est rejeté par le codec D8, qui n’accepte que `makeId.modelId`', () => {
    const parsed = parseCompareParam('54-1918,54-1916');
    expect(parsed.keys).toEqual([{ makeId: 54, modelId: 1918 }, { makeId: 54, modelId: 1916 }]);
  });

  it('écrêtage au-delà de 4 signalé, doublons et modelId = 0 exclus (comportement conforme sur le format D8)', () => {
    const parsed = parseCompareParam('54.1918,54.1918,54.0,9.1,9.2,9.3,9.4');
    expect(parsed.keys).toHaveLength(4);
    expect(parsed.clipped).toBe(true);
    expect(parsed.keys.some((k) => k.modelId === 0)).toBe(false);
  });
});
