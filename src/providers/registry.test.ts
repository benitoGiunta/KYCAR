/**
 * KYCAR — Tests du registre de providers (phase 3.3, critère S3 : « bascule prouvée »)
 * =================================================================================================
 * La bascule de source doit être un PARAMÈTRE, pas une recompilation (DF-2). Ce fichier prouve les
 * trois propriétés qui font que c'en est un : la priorité de résolution, l'instanciation de la
 * bonne implémentation, et le repli EXPLICITE — jamais silencieux — sur une spécification inconnue
 * ou non câblée.
 */

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PROVIDER_SPEC,
  PROVIDER_REGISTRY,
  isProviderSpec,
  resolveProvider,
  resolveProviderSpec,
} from './registry';
import { createNodeFixtureLoader } from './fixture/loaders/node';
import { loadReferenceDataFromDisk } from '../orchestration/reference-fs';
import type { ReferenceData } from '../types/reference';

let cached: ReferenceData | null = null;
const ref = (): ReferenceData => (cached ??= loadReferenceDataFromDisk());

describe('registre — priorité de résolution `?provider=` > env > défaut', () => {
  it('sans rien, le défaut est `fixture:test` (D3-01)', () => {
    const r = resolveProviderSpec({});
    expect(r.spec).toBe(DEFAULT_PROVIDER_SPEC);
    expect(DEFAULT_PROVIDER_SPEC).toBe('fixture:test');
    expect(r.requested).toBeNull();
    expect(r.fellBack).toBe(false);
    expect(r.warning).toBeNull();
  });

  it('la variable de build est lue quand l’URL ne dit rien', () => {
    const r = resolveProviderSpec({ env: { VITE_KYCAR_PROVIDER: 'synthetic' } });
    expect(r.spec).toBe('synthetic');
    expect(r.origin).toBe('env');
  });

  it('le paramètre d’URL l’emporte sur la variable de build : c’est le seul qui se partage', () => {
    const r = resolveProviderSpec({
      search: '?provider=fixture:dev&other=1',
      env: { VITE_KYCAR_PROVIDER: 'synthetic' },
    });
    expect(r.spec).toBe('fixture:dev');
    expect(r.origin).toBe('url');
  });

  it('un paramètre vide ou absent ne compte pas pour une demande', () => {
    expect(resolveProviderSpec({ search: '?provider=' }).origin).toBe('default');
    expect(resolveProviderSpec({ search: '?autre=1' }).origin).toBe('default');
    expect(resolveProviderSpec({ search: '' }).origin).toBe('default');
  });
});

describe('registre — un refus est EXPLICITE, jamais un repli muet (D-03)', () => {
  it('une spécification inconnue retombe sur le défaut AVEC un message qui nomme les sources', () => {
    const r = resolveProviderSpec({ search: '?provider=parquet' });
    expect(r.spec).toBe(DEFAULT_PROVIDER_SPEC);
    expect(r.fellBack).toBe(true);
    expect(r.requested).toBe('parquet');
    expect(r.warning).toMatch(/inconnue/);
    expect(r.warning).toMatch(/fixture:test/);
    expect(r.warning).toMatch(/synthetic/);
  });

  it('`tweedehands` est AU registre mais NON câblé : le refus porte son motif (D-18 / AC-01)', () => {
    const entry = PROVIDER_REGISTRY.find((e) => e.spec === 'tweedehands');
    expect(entry?.wired).toBe(false);
    expect(entry?.sourceKind).toBe('REAL');
    expect(entry?.servesMode2).toBe(false);
    const r = resolveProviderSpec({ search: '?provider=tweedehands' });
    expect(r.spec).toBe(DEFAULT_PROVIDER_SPEC);
    expect(r.fellBack).toBe(true);
    expect(r.warning).toMatch(/AC-01/);
  });

  it('le registre décrit les cinq spécifications, et `isProviderSpec` en est la garde', () => {
    expect(PROVIDER_REGISTRY.map((e) => e.spec)).toEqual([
      'fixture:test',
      'fixture:dev',
      'fixture:perf',
      'synthetic',
      'tweedehands',
    ]);
    for (const e of PROVIDER_REGISTRY) {
      expect(isProviderSpec(e.spec)).toBe(true);
      expect(e.label.length).toBeGreaterThan(0);
      expect(e.note.length).toBeGreaterThan(0);
    }
    expect(isProviderSpec('fixture')).toBe(false);
  });
});

describe('registre — la bascule instancie bien une AUTRE implémentation', () => {
  it('`synthetic` rend un provider SYNTHETIC ; `fixture:*` rend un provider FIXTURE', () => {
    const synthetic = resolveProvider({ referenceData: ref(), search: '?provider=synthetic' });
    expect(synthetic.provider.describe().sourceKind).toBe('SYNTHETIC');
    expect(synthetic.provider.describe().providerId).toBe('kycar-synthetic');

    const fixture = resolveProvider({
      referenceData: ref(),
      search: '?provider=fixture:dev',
      fixtureLoader: createNodeFixtureLoader('data/fixtures'),
    });
    expect(fixture.provider.describe().sourceKind).toBe('FIXTURE');
    expect(fixture.provider.describe().providerId).toBe('kycar-fixture-dev');
    expect(fixture.spec).toBe('fixture:dev');
  });

  it('l’avertissement de repli voyage par `coverageWarning` : il atteindra `coverageNote`', () => {
    // C'est le chemin qui rend le repli VISIBLE sans toucher à `app.tsx` : la coquille affiche déjà
    // la note de couverture du snapshot.
    const fallback = resolveProvider({
      referenceData: ref(),
      search: '?provider=nimportequoi',
      fixtureLoader: createNodeFixtureLoader('data/fixtures'),
    });
    expect(fallback.fellBack).toBe(true);
    expect(fallback.spec).toBe(DEFAULT_PROVIDER_SPEC);
    expect(fallback.entry.spec).toBe(DEFAULT_PROVIDER_SPEC);
    expect(fallback.warning).not.toBeNull();
  });

  it('`forceSpec` court-circuite l’URL et l’environnement (bancs, tests)', () => {
    const forced = resolveProvider({
      referenceData: ref(),
      search: '?provider=synthetic',
      forceSpec: 'fixture:perf',
      fixtureLoader: createNodeFixtureLoader('data/fixtures'),
    });
    expect(forced.spec).toBe('fixture:perf');
    expect(forced.provider.describe().providerId).toBe('kycar-fixture-perf');
  });
});
