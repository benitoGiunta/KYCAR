/**
 * KYCAR — Revue D9 · sonde 8 : rattachement des marques/modèles 2dehands à la taxonomie AutoScout24
 * =================================================================================================
 * `DECISION-coordinateur-source.md` : « Un travail de re-cartographie est nécessaire : mapper le
 * vocabulaire 2dehands vers le dictionnaire de données de KYCAR. » On mesure le TAUX de
 * rattachement sur les libellés des fixtures et on vérifie la clé réservée `modelId = 0`
 * (EX-DATA-72 / ADV-14 / ARB-59).
 */
import { describe, expect, it } from 'vitest';
import { MODEL_ID_UNRESOLVED } from '../../../src/types/sentinels';
import { resolveMakeId, resolveModelId } from '../../../src/providers/tweedehands/vocabularyMap';
import { mapListingToNormalized } from '../../../src/providers/tweedehands/normalize';
import { buildEuroStandardIndex } from '../../../src/providers/tweedehands/vocabularyMap';
import { loadRealReferenceData } from '../../../src/providers/tweedehands/testFixtures';
import { ALL_LISTINGS } from './fixtures';

const referenceData = loadRealReferenceData();
const euroIndex = buildEuroStandardIndex(referenceData);

describe('D9 · taxonomie — rattachement aux identifiants AutoScout24', () => {
  it('les marques/modèles des fixtures se rattachent aux VRAIS identifiants de `taxonomy.json`', () => {
    expect(resolveMakeId(referenceData, 'Opel')).toBe(54);
    expect(resolveMakeId(referenceData, 'Volkswagen')).toBe(74);
    expect(resolveModelId(referenceData, 54, 'Corsa')).toBe(1918);
    expect(resolveModelId(referenceData, 74, 'Golf')).toBe(2084);
  });

  it('taux de rattachement mesuré sur le corpus de fixtures du lot', () => {
    const listings = ALL_LISTINGS.map((raw) => mapListingToNormalized(raw, referenceData, 'be', euroIndex));
    const makeResolved = listings.filter((l) => l.makeId !== null).length;
    const modelResolved = listings.filter((l) => l.modelId !== MODEL_ID_UNRESOLVED).length;
    // Corpus : 9 annonces, dont 1 marque volontairement inconnue et 1 modèle fantaisiste.
    // Mesure : marques 8/9 = 88,9 % ; modèles 7/9 = 77,8 % (les deux non rattachés sont les cas
    // adverses volontaires). Le rattachement repose sur une égalité EXACTE de libellé replié, sans
    // aucun alias : tout libellé 2dehands qui diffère (« VW », « Mercedes », « Citroen DS ») tombe.
    expect(listings.length).toBe(9);
    expect(makeResolved).toBe(8);
    expect(modelResolved).toBe(7);
  });

  it('ADV-14 / EX-DATA-72 — un modèle non résolu donne `modelId = 0`, jamais `null`, avec le drapeau `MODEL_UNRESOLVED`', () => {
    const unresolved = ALL_LISTINGS.map((raw) => mapListingToNormalized(raw, referenceData, 'be', euroIndex)).find(
      (l) => l.makeId === 54 && l.modelId === MODEL_ID_UNRESOLVED,
    );
    expect(unresolved).toBeDefined();
    expect(unresolved?.modelId).toBe(0);
    expect(unresolved?.ingestFlags).toContain('MODEL_UNRESOLVED');
  });

  it('R-D9-09b — une marque non résolue donne `makeId = null` : l’annonce n’a AUCUN bucket (ni marque, ni « non identifiée »)', () => {
    const orphan = ALL_LISTINGS.map((raw) => mapListingToNormalized(raw, referenceData, 'be', euroIndex)).find(
      (l) => l.makeId === null,
    );
    expect(orphan).toBeDefined();
    // Symétriquement à `modelId = 0`, une marque non résolue devrait recevoir une clé réservée ou
    // au moins un drapeau d'ingestion : ici elle disparaît en silence (aucun drapeau posé).
    expect(orphan?.unknownFields, 'aucun recensement de la marque non rattachée').toContain('makeId');
  });

  it('R-D9-20 — la résolution de marque est une égalité EXACTE de libellé replié : aucun alias', () => {
    // Accents, casse et tirets sont neutralisés (`Citroën` → `citroen`, `Škoda` → `skoda`, `MINI`),
    // ce qui est correct. Mais aucune table d'alias n'existe : les formes courtes usuelles d'un
    // portail belge néerlandophone tombent silencieusement en `makeId = null` (aucun drapeau).
    expect(resolveMakeId(referenceData, 'Citroën')).toBe(21);
    expect(resolveMakeId(referenceData, 'Škoda')).toBe(65);
    expect(resolveMakeId(referenceData, 'Mercedes-Benz')).toBe(47);
    expect(resolveMakeId(referenceData, 'VW'), 'alias VW → Volkswagen').toBe(74);
    expect(resolveMakeId(referenceData, 'Mercedes'), 'alias Mercedes → Mercedes-Benz').toBe(47);
  });
});
