/**
 * Sonde de revue D5 — écran G (`EX-SCR-215`/`216`) à l'échelle réelle du référentiel :
 * 295 marques et 4 955 modèles de `data/reference/taxonomy.json`, plus le seuil d'`EX-SRCH-26`.
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  isSameSelection,
  searchMakes,
  searchModels,
  serializeMmmv,
} from '../../../src/components/filters/screen-g-model';
import { MAKE_COUNT_WARNING_THRESHOLD, shouldShowMakeCountWarning } from '../../../src/screens/market/thresholds';
import type { Make, Model } from '../../../src/types/entities';
import type { ReferenceData } from '../../../src/types/reference';

interface RawModel {
  readonly id: number;
  readonly label: string;
  readonly slug?: string;
}
interface RawMake {
  readonly id: number;
  readonly label: string;
  readonly slug?: string;
  readonly models?: readonly RawModel[];
}
interface RawTaxonomy {
  readonly makeCount: number;
  readonly modelCount: number;
  readonly makes: readonly RawMake[];
}

const raw = JSON.parse(readFileSync('data/reference/taxonomy.json', 'utf8')) as RawTaxonomy;

function buildReference(): ReferenceData {
  const makes: Make[] = [];
  const models: Model[] = [];
  const modelsByMake = new Map<number, Model[]>();
  for (const [index, rm] of raw.makes.entries()) {
    makes.push({
      makeId: rm.id,
      label: rm.label,
      slug: rm.slug ?? String(rm.id),
      // Volumétrie déterministe, décroissante : sert uniquement au tri de la sonde.
      announcedCount: raw.makes.length - index,
    });
    const bucket: Model[] = [];
    for (const [mIndex, rmo] of (rm.models ?? []).entries()) {
      const model: Model = {
        makeId: rm.id,
        modelId: rmo.id,
        label: rmo.label,
        slug: rmo.slug ?? String(rmo.id),
        bodyTypes: [],
        announcedCount: (rm.models ?? []).length - mIndex,
      };
      models.push(model);
      bucket.push(model);
    }
    modelsByMake.set(rm.id, bucket);
  }
  const reference: Pick<ReferenceData, 'makes' | 'makeById' | 'models' | 'modelByKey' | 'modelsByMake'> = {
    makes,
    makeById: new Map(makes.map((m) => [m.makeId, m])),
    models,
    modelByKey: new Map(models.map((m) => [`${m.makeId}:${m.modelId}`, m])),
    modelsByMake,
  };
  return reference as ReferenceData;
}

const reference = buildReference();

describe('D5 — EX-SCR-215/216 : écran G à l’échelle réelle (295 marques, 4 955 modèles)', () => {
  it('le référentiel chargé porte bien 295 marques et 4 955 modèles', () => {
    expect(raw.makeCount).toBe(295);
    expect(raw.modelCount).toBe(4_955);
    expect(reference.makes).toHaveLength(295);
    expect(reference.models).toHaveLength(4_955);
  });

  it('le panneau gauche liste les 295 marques, triées par effectif décroissant', () => {
    const rows = searchMakes(reference, '');
    expect(rows).toHaveLength(295);
    const counts = rows.map((r) => r.count ?? -1);
    expect([...counts].sort((a, b) => b - a)).toEqual(counts);
  });

  it('EX-SCR-216 — la recherche est insensible à la casse et aux diacritiques', () => {
    // `Bolloré` : seule marque diacritée du référentiel — « bollore » doit la trouver.
    expect(searchMakes(reference, 'bollore').map((r) => r.make.label)).toContain('Bolloré');
    expect(searchMakes(reference, 'anhanger').map((r) => r.make.label)).toContain('Trailer-Anhänger');
    expect(searchMakes(reference, 'MERCEDES').length).toBeGreaterThan(0);
    expect(searchMakes(reference, 'zzz-aucune-marque')).toHaveLength(0);
  });

  it('le panneau droit reste vide tant qu’aucune marque n’est choisie, puis liste ses modèles', () => {
    expect(searchModels(reference, undefined, '')).toHaveLength(0);
    const firstMake = raw.makes[0];
    expect(firstMake).toBeDefined();
    if (firstMake === undefined) return;
    const rows = searchModels(reference, firstMake.id, '');
    expect(rows).toHaveLength((firstMake.models ?? []).length);
    for (const row of rows) expect(row.model.makeId).toBe(firstMake.id);
  });

  it('la recherche de modèle filtre par sous-chaîne, insensible à la casse', () => {
    const opel = raw.makes.find((m) => m.label === 'Opel');
    expect(opel).toBeDefined();
    if (opel === undefined) return;
    const rows = searchModels(reference, opel.id, 'CORS');
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(row.model.label.toLowerCase()).toContain('cors');
  });

  it('EX-SCR-72 — `Appliquer` sérialise `makeId|modelId` et est désactivé si la sélection est inchangée', () => {
    expect(serializeMmmv(16, undefined)).toBe('16');
    expect(serializeMmmv(16, 1_174)).toBe('16|1174');
    expect(isSameSelection('16|1174', '16|1174')).toBe(true);
    expect(isSameSelection('16|1174', undefined)).toBe(false);
  });

  it('EX-SRCH-26 — le seuil d’avertissement est bien 60 marques, sans blocage', () => {
    expect(MAKE_COUNT_WARNING_THRESHOLD).toBe(60);
    expect(shouldShowMakeCountWarning(60)).toBe(false);
    expect(shouldShowMakeCountWarning(61)).toBe(true);
  });
});

describe('R-D5-20 — écran G : effectifs jamais relatifs au périmètre filtré courant', () => {
  it('R-D5-20 — un effectif non calculable doit rester `null` (affiché « — »), jamais une volumétrie source', () => {
    // `ScreenG.tsx` n'alimente jamais l'argument `counts` : les effectifs affichés sont la
    // dernière volumétrie connue de la source (`announcedCount`), non l'effectif « dans le
    // périmètre filtré courant » exigé par EX-SCR-216.
    const firstId = raw.makes[0]?.id ?? 0;
    const counts = new Map<number, number>([[firstId, 12]]);
    const rows = searchMakes(reference, '', counts);
    expect(rows.find((r) => r.make.makeId === firstId)?.count).toBe(12);
    // Toute marque SANS effectif fourni doit rendre `null` (affiché « — », ET-CHAMP-MANQUANT),
    // jamais la volumétrie source `announcedCount`, qui n'est pas relative au périmètre filtré.
    expect(rows.filter((r) => r.make.makeId !== firstId && r.count !== null)).toHaveLength(0);
  });
});
