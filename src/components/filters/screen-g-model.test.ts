import { describe, expect, it } from 'vitest';

import type { Make, Model } from '../../types/entities';
import type { ReferenceData } from '../../types/reference';
import { isSameSelection, searchMakes, searchModels, serializeMmmv } from './screen-g-model';

function makeReferenceData(makes: readonly Make[], models: readonly Model[]): ReferenceData {
  const modelsByMake = new Map<number, Model[]>();
  for (const m of models) {
    const bucket = modelsByMake.get(m.makeId) ?? [];
    bucket.push(m);
    modelsByMake.set(m.makeId, bucket);
  }
  return {
    makes,
    makeById: new Map(makes.map((m) => [m.makeId, m])),
    models,
    modelByKey: new Map(models.map((m) => [`${m.makeId}:${m.modelId}`, m])),
    modelsByMake,
  } as unknown as ReferenceData;
}

const skoda: Make = { makeId: 1, label: 'Škoda', slug: 'skoda', announcedCount: 500 };
const opel: Make = { makeId: 2, label: 'Opel', slug: 'opel', announcedCount: 12000 };
const octavia: Model = { makeId: 1, modelId: 10, label: 'Octavia', slug: 'octavia', bodyTypes: [], announcedCount: 300 };
const corsa: Model = { makeId: 2, modelId: 20, label: 'Corsa', slug: 'corsa', bodyTypes: [], announcedCount: 5000 };
const astra: Model = { makeId: 2, modelId: 21, label: 'Astra', slug: 'astra', bodyTypes: [], announcedCount: 900 };

const ref = makeReferenceData([skoda, opel], [octavia, corsa, astra]);

describe('searchMakes — EX-SCR-216 (recherche insensible casse/diacritiques, tri par effectif)', () => {
  it('retourne tout le catalogue quand la requête est vide, trié par effectif décroissant', () => {
    const rows = searchMakes(ref, '');
    expect(rows.map((r) => r.make.label)).toEqual(['Opel', 'Škoda']);
  });

  it('"skoda" (sans diacritique) trouve "Škoda"', () => {
    const rows = searchMakes(ref, 'skoda');
    expect(rows.map((r) => r.make.label)).toEqual(['Škoda']);
  });

  it('la recherche est insensible à la casse', () => {
    expect(searchMakes(ref, 'OPEL').map((r) => r.make.label)).toEqual(['Opel']);
  });

  it('aucune correspondance renvoie une liste vide', () => {
    expect(searchMakes(ref, 'zzzznocorrespondance')).toHaveLength(0);
  });
});

describe('searchModels — vide tant qu’aucune marque n’est choisie', () => {
  it('renvoie une liste vide si makeId est undefined', () => {
    expect(searchModels(ref, undefined, '')).toHaveLength(0);
  });

  it('renvoie les modèles de la marque, triés par effectif décroissant', () => {
    const rows = searchModels(ref, 2, '');
    expect(rows.map((r) => r.model.label)).toEqual(['Corsa', 'Astra']);
  });

  it('filtre par sous-chaîne insensible à la casse', () => {
    expect(searchModels(ref, 2, 'ast').map((r) => r.model.label)).toEqual(['Astra']);
  });
});

describe('serializeMmmv / isSameSelection — EX-SCR-72/216', () => {
  it('sérialise makeId seul sans séparateur', () => {
    expect(serializeMmmv(2, undefined)).toBe('2');
  });

  it('sérialise makeId|modelId', () => {
    expect(serializeMmmv(2, 20)).toBe('2|20');
  });

  it('détecte une sélection inchangée (Appliquer désactivé)', () => {
    expect(isSameSelection('2|20', '2|20')).toBe(true);
    expect(isSameSelection('2|20', '2|21')).toBe(false);
    expect(isSameSelection('2', undefined)).toBe(false);
  });
});
