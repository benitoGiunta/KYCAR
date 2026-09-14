import { describe, expect, it } from 'vitest';
import {
  parseFirstRegistrationYearMonth,
  type ParsedFirstRegistration,
} from '../../../src/types/shared-rules';
import {
  hasIngestFlag,
  INGEST_FLAG_BIT,
  ingestFlagCodes,
  NUMERIC_UNKNOWN,
  setIngestFlag,
} from '../../../src/types/index';

/**
 * Revue D2 — **EX-DATA-23** (mineur isolé de `FINAL-VERIFICATION` §3.2(d), attribué à fix-engine-2
 * par `D8-31`) : le parsing de `firstRegistrationYearMonth` accepte les DEUX formes de la source,
 * `YYYY-MM` (vocabulaire de création) puis `MM/YYYY` (vocabulaire de recherche), et **rien
 * d'autre** — « aucune tolérance sur un mois `00` ou `13`, ni sur une année à 2 chiffres ». Toute
 * autre forme donne `INCONNU` **et** `ingestFlags += FIRST_REG_UNPARSEABLE`.
 *
 * Constat 2.7 rejoué avant d'écrire ces sondes : `grep -rln FIRST_REG_UNPARSEABLE tests/ src/` ne
 * renvoyait que `src/types/vocabularies.ts` — le drapeau existait dans le vocabulaire, la règle qui
 * doit le poser n'existait NULLE PART. Ces sondes sont donc rouges à l'import sur l'état d'arrivée
 * du worktree (`parseFirstRegistrationYearMonth` non exporté).
 *
 * La valeur `INCONNU` est vérifiée sous ses deux formes : la vue décodée (`yearMonth === null`) et
 * la sentinelle colonnaire `NUMERIC_UNKNOWN` (`EX-DATA-120`), puisque la colonne
 * `firstRegistrationYearMonth` est un `Int32Array` à sentinelle numérique (`columns.ts`).
 */

/** Applique la règle d'ingestion : le drapeau du résultat est POSÉ sur le masque de l'annonce. */
function flagsAfter(raw: string | null | undefined, before = 0): number {
  return parseFirstRegistrationYearMonth(raw, before).ingestFlags;
}

function expectUnknownAndFlagged(raw: string, why: string): void {
  const parsed: ParsedFirstRegistration = parseFirstRegistrationYearMonth(raw);
  expect(parsed.yearMonth, why).toBeNull();
  expect(parsed.year, why).toBeNull();
  expect(parsed.month, why).toBeNull();
  expect(parsed.encoded, why).toBe(NUMERIC_UNKNOWN);
  expect(parsed.unparseable, why).toBe(true);
  expect(hasIngestFlag(parsed.ingestFlags, 'FIRST_REG_UNPARSEABLE'), why).toBe(true);
}

describe('R-D2-2.8-01 — EX-DATA-23 : les deux formes acceptées, dans cet ordre d’essai', () => {
  it('`YYYY-MM` (vocabulaire de création, EX-DATA-22) : 2015-01 → année 2015, mois 1', () => {
    const p = parseFirstRegistrationYearMonth('2015-01');
    expect(p.yearMonth).toBe('2015-01');
    expect(p.year).toBe(2015);
    expect(p.month).toBe(1);
    expect(p.unparseable).toBe(false);
    expect(p.ingestFlags).toBe(0);
  });

  it('`MM/YYYY` (vocabulaire de recherche, la forme OBSERVÉE) : 03/2021 → 2021-03', () => {
    const p = parseFirstRegistrationYearMonth('03/2021');
    expect(p.yearMonth).toBe('2021-03');
    expect(p.year).toBe(2021);
    expect(p.month).toBe(3);
    expect(p.unparseable).toBe(false);
  });

  it('les deux formes du MÊME mois donnent la MÊME chaîne de 7 caractères et le même encodage', () => {
    const a = parseFirstRegistrationYearMonth('2024-12');
    const b = parseFirstRegistrationYearMonth('12/2024');
    expect(a.yearMonth).toBe('2024-12');
    expect(b.yearMonth).toBe('2024-12');
    expect(a.yearMonth?.length).toBe(7);
    expect(b.encoded).toBe(a.encoded);
    // Encodage colonnaire du moteur et des providers : `12·année + (mois − 1)`.
    expect(a.encoded).toBe(12 * 2024 + 11);
  });

  it('les 12 mois valides passent sous les deux formes, et eux seuls', () => {
    for (let m = 1; m <= 12; m++) {
      const mm = String(m).padStart(2, '0');
      expect(parseFirstRegistrationYearMonth(`2020-${mm}`).month, `2020-${mm}`).toBe(m);
      expect(parseFirstRegistrationYearMonth(`${mm}/2020`).month, `${mm}/2020`).toBe(m);
    }
  });
});

describe('R-D2-2.8-02 — EX-DATA-23 : aucune tolérance, INCONNU + FIRST_REG_UNPARSEABLE', () => {
  it('mois 00 et 13 sont REFUSÉS sous les deux formes (pas de mois hors 01..12)', () => {
    expectUnknownAndFlagged('2024-00', 'mois 00 en YYYY-MM');
    expectUnknownAndFlagged('2024-13', 'mois 13 en YYYY-MM');
    expectUnknownAndFlagged('00/2024', 'mois 00 en MM/YYYY');
    expectUnknownAndFlagged('13/2024', 'mois 13 en MM/YYYY');
  });

  it('année à 2 chiffres REFUSÉE : 05/24 et 24-05 ne sont ni l’une ni l’autre forme', () => {
    expectUnknownAndFlagged('05/24', 'année à 2 chiffres en MM/YYYY');
    expectUnknownAndFlagged('24-05', 'année à 2 chiffres en YYYY-MM');
  });

  it('séparateur ou ordre inversés : 2024/05 n’est aucune des deux formes', () => {
    expectUnknownAndFlagged('2024/05', 'YYYY/MM n’est pas une forme admise');
    expectUnknownAndFlagged('05-2024', 'MM-YYYY n’est pas une forme admise');
  });

  it('mois non zéro-pané, valeur vide, bruit : tout est refusé sans exception', () => {
    expectUnknownAndFlagged('2024-5', 'mois sur 1 chiffre');
    expectUnknownAndFlagged('5/2024', 'mois sur 1 chiffre en MM/YYYY');
    expectUnknownAndFlagged('', 'chaîne vide');
    expectUnknownAndFlagged(' 2024-05 ', 'espaces autour : la forme est ancrée, sans tolérance');
    expectUnknownAndFlagged('2024-05-17', 'date journalière : la source ne connaît pas le jour');
    expectUnknownAndFlagged('inconnu', 'texte libre');
  });

  it('champ ABSENT (null / undefined) : INCONNU SANS drapeau — rien n’était là à lire', () => {
    for (const raw of [null, undefined]) {
      const p = parseFirstRegistrationYearMonth(raw);
      expect(p.yearMonth).toBeNull();
      expect(p.encoded).toBe(NUMERIC_UNKNOWN);
      expect(p.unparseable).toBe(false);
      expect(p.ingestFlags).toBe(0);
    }
  });
});

describe('R-D2-2.8-03 — le drapeau posé est bien celui de la table bit ↔ code d’ingestFlags', () => {
  it('FIRST_REG_UNPARSEABLE est le 13ᵉ code d’EX-DATA-45, soit le bit 12 (D-01, DR-013)', () => {
    expect(INGEST_FLAG_BIT.FIRST_REG_UNPARSEABLE).toBe(12);
    expect(flagsAfter('2024-13')).toBe(setIngestFlag(0, 'FIRST_REG_UNPARSEABLE'));
    expect(flagsAfter('2024-13')).toBe(1 << 12);
  });

  it('le masque décodé ne porte QUE ce code, et le drapeau n’est jamais posé sur une forme valide', () => {
    expect(ingestFlagCodes(flagsAfter('13/2024'))).toEqual(['FIRST_REG_UNPARSEABLE']);
    expect(ingestFlagCodes(flagsAfter('06/2024'))).toEqual([]);
  });

  it('le masque d’entrée est PRÉSERVÉ : le drapeau s’ajoute, il n’écrase aucun autre', () => {
    const before = setIngestFlag(setIngestFlag(0, 'ENUM_UNKNOWN'), 'MILEAGE_OUT_OF_RANGE');
    const after = flagsAfter('2024-00', before);
    expect(ingestFlagCodes(after)).toEqual([
      'ENUM_UNKNOWN',
      'MILEAGE_OUT_OF_RANGE',
      'FIRST_REG_UNPARSEABLE',
    ]);
    // Une forme valide laisse le masque d'entrée strictement inchangé.
    expect(flagsAfter('2024-06', before)).toBe(before);
  });
});
