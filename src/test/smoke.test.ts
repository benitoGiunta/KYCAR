import { describe, expect, it } from 'vitest';

/**
 * Dummy test proving the Vitest pipeline (config, TS/JSX transform, module resolution) works.
 * Lots D2+ add real coverage per requirement (`EX-...`), per the generic success criterion S2 of
 * `docs/plans/PLAN-2-app-build.md` S:2.4.
 */
describe('scaffolding', () => {
  it('runs a trivial assertion', () => {
    expect(1 + 1).toBe(2);
  });
});
