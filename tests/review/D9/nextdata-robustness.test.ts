/**
 * KYCAR — Revue D9 · sonde 7 : robustesse du parsing `__NEXT_DATA__`
 * =================================================================================================
 * `nextData.ts` annonce en en-tête un « rejet typé plutôt qu'un agrégat silencieusement faux » et
 * traite la dérive de schéma comme un signal (A7, `probe-LOT-N.md`, ZO-5 du rapport du chantier 1).
 * Cette sonde éprouve les quatre formes dégradées exigées : page sans balise, JSON tronqué,
 * `props.pageProps` absent, listing partiel — plus deux formes voisines (élément `null`,
 * `totalResultCount` négatif).
 */
import { describe, expect, it } from 'vitest';
import { extractNextDataScript, parseSearchResponse } from '../../../src/providers/tweedehands/nextData';
import { mapListingToNormalized } from '../../../src/providers/tweedehands/normalize';
import { buildEuroStandardIndex } from '../../../src/providers/tweedehands/vocabularyMap';
import { loadRealReferenceData } from '../../../src/providers/tweedehands/testFixtures';

const referenceData = loadRealReferenceData();
const euroIndex = buildEuroStandardIndex(referenceData);

const HTML_SANS_BALISE = '<html><body>page de maintenance</body></html>';
const JSON_TRONQUE = '<script id="__NEXT_DATA__" type="application/json">{"props":{"pageProps":{"searchRequ</script>';
const SANS_PAGEPROPS = '<script id="__NEXT_DATA__">{"props":{}}</script>';
const LISTING_PARTIEL =
  '<script id="__NEXT_DATA__">{"props":{"pageProps":{"searchRequestAndResponse":{"totalResultCount":5,"listings":[{"itemId":"x"}]}}}}</script>';
const LISTING_NULL =
  '<script id="__NEXT_DATA__">{"props":{"pageProps":{"searchRequestAndResponse":{"totalResultCount":5,"listings":[null]}}}}</script>';
const COMPTE_NEGATIF =
  '<script id="__NEXT_DATA__">{"props":{"pageProps":{"searchRequestAndResponse":{"totalResultCount":-3,"listings":[]}}}}</script>';

/** Message typé attendu : porte le nom du provider, donc identifiable dans un rapport d'erreur. */
const TYPED = /TweedehandsDataProvider:/;

describe('D9 · robustesse `__NEXT_DATA__` — rejets typés obtenus', () => {
  it('page sans balise `__NEXT_DATA__` → rejet typé', () => {
    expect(() => extractNextDataScript(HTML_SANS_BALISE)).toThrow(TYPED);
    expect(() => parseSearchResponse(HTML_SANS_BALISE)).toThrow(/__NEXT_DATA__ introuvable/);
  });

  it('`props.pageProps` absent → rejet typé (dérive de schéma signalée, pas d’agrégat faux)', () => {
    expect(() => parseSearchResponse(SANS_PAGEPROPS)).toThrow(/forme de __NEXT_DATA__ inattendue/);
  });

  it('`totalResultCount` non numérique → rejet typé (aucune coercition silencieuse)', () => {
    const html = '<script id="__NEXT_DATA__">{"props":{"pageProps":{"searchRequestAndResponse":{"totalResultCount":"5","listings":[]}}}}</script>';
    expect(() => parseSearchResponse(html)).toThrow(/forme de __NEXT_DATA__ inattendue/);
  });
});

describe('D9 · robustesse `__NEXT_DATA__` — écarts constatés', () => {
  it('R-D9-18 — JSON tronqué : `SyntaxError` brut de `JSON.parse`, non typé, non rattachable au provider', () => {
    expect(() => parseSearchResponse(JSON_TRONQUE)).toThrow(TYPED);
  });

  it('R-D9-18b — un élément `null` dans `listings` fait planter la normalisation (`TypeError` non typé)', () => {
    const response = parseSearchResponse(LISTING_NULL);
    expect(response.listings).toHaveLength(1);
    expect(() => mapListingToNormalized(response.listings[0]!, referenceData, 'be', euroIndex)).toThrow(TYPED);
  });

  it('R-D9-18c — `totalResultCount` négatif est accepté et devient un effectif d’agrégat négatif', () => {
    const response = parseSearchResponse(COMPTE_NEGATIF);
    expect(response.totalResultCount, 'un effectif annoncé négatif doit être rejeté ou ramené à INCONNU').toBeGreaterThanOrEqual(0);
  });

  it('R-D9-18d — listing partiel : `listingId`/`listingUrl` sont typés `string` mais valent `undefined`', () => {
    const response = parseSearchResponse(LISTING_PARTIEL);
    const listing = mapListingToNormalized(response.listings[0]!, referenceData, 'be', euroIndex);
    expect(listing.listingId).toBe('x');
    expect(typeof listing.listingUrl, '`vipUrl` absent → le type `string` est menti à l’exécution').toBe('string');
  });

  it('preuve — un listing partiel est normalisé sans rejet, avec ses champs inconnus recensés', () => {
    const response = parseSearchResponse(LISTING_PARTIEL);
    const listing = mapListingToNormalized(response.listings[0]!, referenceData, 'be', euroIndex);
    expect(listing.unknownFields.length).toBeGreaterThanOrEqual(8);
    expect(listing.ingestFlags).toContain('PRICE_MISSING_UNDECLARED');
    expect(listing.makeId).toBeNull();
  });
});
