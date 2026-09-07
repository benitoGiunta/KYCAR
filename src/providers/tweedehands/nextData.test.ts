import { describe, expect, it } from 'vitest';
import { extractNextDataScript, getAllAttrValues, getAttr, parseSearchResponse } from './nextData';
import { buildFixtureHtml, makeRawListing } from './testFixtures';

describe('nextData — extraction du __NEXT_DATA__', () => {
  it('isole le contenu JSON du script __NEXT_DATA__', () => {
    const html = buildFixtureHtml({ totalResultCount: 5, listings: [] });
    const json = extractNextDataScript(html);
    expect(JSON.parse(json)).toHaveProperty('props.pageProps.searchRequestAndResponse.totalResultCount', 5);
  });

  it('lève si le bloc __NEXT_DATA__ est absent', () => {
    expect(() => extractNextDataScript('<html><body>rien ici</body></html>')).toThrow(/__NEXT_DATA__/);
  });

  it('parse une réponse de recherche valide', () => {
    const listing = makeRawListing({ itemId: 'a1', brand: 'Opel', model: 'Corsa' });
    const html = buildFixtureHtml({ totalResultCount: 100188, listings: [listing] });
    const response = parseSearchResponse(html);
    expect(response.totalResultCount).toBe(100188);
    expect(response.listings).toHaveLength(1);
    expect(response.listings[0]?.itemId).toBe('a1');
  });

  it('lève si la forme searchRequestAndResponse est inattendue (dérive de schéma)', () => {
    const html = '<script id="__NEXT_DATA__">{"props":{"pageProps":{}}}</script>';
    expect(() => parseSearchResponse(html)).toThrow(/forme de __NEXT_DATA__ inattendue/);
  });

  it('getAttr lit dans attributes puis extendedAttributes, insensible à la casse', () => {
    const listing = makeRawListing({ itemId: 'a1', brand: 'Opel', model: 'Corsa', enginePowerKW: '85' });
    expect(getAttr(listing, 'Brand')).toBe('Opel');
    expect(getAttr(listing, 'enginePowerKW')).toBe('85');
    expect(getAttr(listing, 'inconnu')).toBeUndefined();
  });

  it('getAllAttrValues retourne toutes les occurrences d’une clé répétable', () => {
    const listing = makeRawListing({ itemId: 'a1', brand: 'Opel', model: 'Corsa' });
    const withOptions = {
      ...listing,
      attributes: [...(listing.attributes ?? []), { key: 'options', value: 'GPS' }, { key: 'options', value: 'Climatisation' }],
    };
    expect(getAllAttrValues(withOptions, 'options')).toEqual(['GPS', 'Climatisation']);
  });
});
