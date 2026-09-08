import { describe, expect, it } from 'vitest';
import { buildIndexes } from './index-build';
import { decodeListingId, parseListingId } from './uuid';
import { generateSyntheticDataset } from './synthetic';

/**
 * Lot D4 — `PK_LISTING` (EX-DATA-114/115) après DR-033 : la clé primaire est un ORDRE DE LIGNES trié
 * sur les 16 octets du `listingId`, interrogé par dichotomie, et non une `Map` de chaînes UUID. Elle
 * doit rendre exactement ce que rendait la table de hachage : la ligne du `listingId` canonique,
 * `undefined` pour tout identifiant absent ou mal formé.
 */
describe('PK_LISTING — clé primaire dichotomique sur les octets bruts', () => {
  const ds = generateSyntheticDataset({ rowCount: 2000, seed: 41 });
  const batch = ds.batch;
  const idx = buildIndexes(batch);

  it('la clé primaire porte une entrée par ligne', () => {
    expect(idx.pkListing.size).toBe(batch.rowCount);
  });

  it('chaque listingId canonique retrouve SA ligne, et aucune autre', () => {
    for (let row = 0; row < batch.rowCount; row += 37) {
      const id = decodeListingId(batch.listingId, row);
      expect(idx.pkListing.get(id)).toBe(row);
      expect(idx.pkListing.has(id)).toBe(true);
      // Insensible à la casse : la forme canonique est minuscule, la recherche compare des octets.
      expect(idx.pkListing.get(id.toUpperCase())).toBe(row);
    }
  });

  it('un identifiant absent ou mal formé rend undefined, jamais une ligne au hasard', () => {
    expect(idx.pkListing.get('00000000-0000-4000-8000-000000000000')).toBeUndefined();
    expect(idx.pkListing.get('pas-un-uuid')).toBeUndefined();
    expect(idx.pkListing.get('')).toBeUndefined();
    expect(idx.pkListing.has('00000000000000000000000000000000000z')).toBe(false);
  });

  it('le décodage et l’analyse d’un listingId sont réciproques, octet à octet', () => {
    for (let row = 0; row < 50; row++) {
      const id = decodeListingId(batch.listingId, row);
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      const bytes = parseListingId(id);
      expect(bytes).not.toBeNull();
      expect(Array.from(bytes as Uint8Array)).toEqual(
        Array.from(batch.listingId.subarray(row * 16, row * 16 + 16)),
      );
    }
  });
});
