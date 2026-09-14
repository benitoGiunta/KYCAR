/**
 * KYCAR — Sondes de revue D6 · formateurs de première immatriculation (EX-DATA-23, EX-SCR-34)
 * =================================================================================================
 * Phase 2.8, vague F3 — point signalé par `fix-engine-2` au coordinateur, attribué à `fix-screens-2`
 * (le défaut est dans `src/screens`). `EX-DATA-23` : toute forme non parsable de la date de
 * première immatriculation donne `INCONNU` + `FIRST_REG_UNPARSEABLE` à l'ingestion. Côté écran,
 * une valeur `INCONNU` (ou une valeur résiduelle hors domaine) doit se rendre par le caractère
 * d'absence `—` d'`EX-SCR-34`, JAMAIS par un `NaN/NaN` ni par un `01/0` — un utilisateur ne doit
 * pas pouvoir lire une date que la donnée ne porte pas.
 *
 * Les deux formateurs concernés vivent dans deux lots (`market` = D6, `distribution` = D7) mais
 * portent la même exigence : ils sont sondés ensemble ici.
 */

import { describe, it, expect } from 'vitest';
import { formatFirstRegistrationMonthYear } from '../../../src/screens/market/format';
import { formatMonthYear } from '../../../src/screens/distribution/format';
import { buildListingRow } from '../../../src/screens/listings/listing-fields';
import { OutlierIndex } from '../../../src/screens/outlier-index';
import { NUMERIC_UNKNOWN, type ListingColumnBatch } from '../../../src/types/index';
import { fixture } from '../D7/_helpers';

const MISSING = '—';

describe('D6/D7 · EX-DATA-23 — une date de 1ʳᵉ immatriculation non parsable ne s’affiche jamais en `NaN`', () => {
  it('R-D6-2.8-01 — `formatFirstRegistrationMonthYear` rend `—` sur toute chaîne non parsable (EX-SCR-34)', () => {
    for (const raw of ['', '   ', 'inconnu', '2017', '13/2017', '2017-13', 'NaN', 'null']) {
      const out = formatFirstRegistrationMonthYear(raw);
      expect(out, `entrée « ${raw} »`).not.toMatch(/NaN/);
      expect(out, `entrée « ${raw} »`).toBe(MISSING);
    }
  });

  it('R-D6-2.8-02 — non-régression : une date ISO valide reste rendue `MM/AAAA`', () => {
    expect(formatFirstRegistrationMonthYear('2017-03-15T00:00:00.000Z')).toBe('03/2017');
    expect(formatFirstRegistrationMonthYear('2017-01-01T00:00:00.000Z')).toBe('01/2017');
  });

  it('R-D6-2.8-03 — `formatMonthYear` rend `—` sur la sentinelle INCONNU et sur toute valeur hors domaine', () => {
    for (const raw of [NUMERIC_UNKNOWN, Number.NaN, Number.POSITIVE_INFINITY, -12, 0, 12 * 1899, 12 * 2200, 24191.5]) {
      const out = formatMonthYear(raw);
      expect(out, `entrée ${String(raw)}`).not.toMatch(/NaN/);
      expect(out, `entrée ${String(raw)}`).toBe(MISSING);
    }
    // Non-régression : `12 · 2017 + 2` = mars 2017 (EX-SCR-203).
    expect(formatMonthYear(12 * 2017 + 2)).toBe('03/2017');
  });

  it('R-D6-2.8-04 — sur une colonne portant une valeur résiduelle non parsable, la ligne d’annonce rendue affiche `—`, pas une date forgée', () => {
    const f = fixture(60, 0xd3);
    const firstRegistrationYearMonth = Int32Array.from(f.batch.firstRegistrationYearMonth);
    firstRegistrationYearMonth[0] = NUMERIC_UNKNOWN; // INCONNU (EX-DATA-23)
    firstRegistrationYearMonth[1] = 0; // résidu hors domaine (année 0) : jamais « 01/0 »
    const batch: ListingColumnBatch = { ...f.batch, firstRegistrationYearMonth };
    const index = new OutlierIndex([]);
    for (const row of [0, 1]) {
      const r = buildListingRow(batch, row, index);
      // Exactement l'expression rendue par l'écran D et par l'infobulle de l'écran B.
      const cell = r.regYearMonth != null ? formatMonthYear(r.regYearMonth) : MISSING;
      expect(cell, `ligne ${row}`).toBe(MISSING);
    }
  });
});
