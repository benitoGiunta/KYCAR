import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { sha256Hex } from '../../../src/types/sha256';

/**
 * Sonde de revue D2 — SHA-256 maison (`src/types/sha256.ts`), socle du codec `EX-DATA-108`.
 * Confrontation aux vecteurs officiels FIPS 180-4 ET à `node:crypto` (référence indépendante),
 * en couvrant les frontières de bourrage : 0, 55, 56, 63, 64, 65, 119, 120 octets, et l'UTF-8
 * multi-octets (2, 3 et 4 octets par point de code).
 */

const ref = (s: string): string => createHash('sha256').update(s, 'utf8').digest('hex');

describe('D2 — SHA-256 : vecteurs officiels FIPS 180-4', () => {
  it('chaîne vide', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('« abc »', () => {
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('448 bits (56 octets, deux blocs)', () => {
    expect(sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
  });

  it('896 bits (112 octets)', () => {
    expect(
      sha256Hex(
        'abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu',
      ),
    ).toBe('cf5b16a778af8380036ce59e7b0492370b249b11e8f07a51afac45037afee9d1');
  });

  it('1 000 000 de « a » (vecteur long FIPS)', () => {
    expect(sha256Hex('a'.repeat(1_000_000))).toBe(
      'cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0',
    );
  });
});

describe('D2 — SHA-256 : frontières de bourrage confrontées à node:crypto', () => {
  it('longueurs 0 à 130 octets ASCII : identiques à node:crypto', () => {
    for (let n = 0; n <= 130; n++) {
      const s = 'x'.repeat(n);
      expect(sha256Hex(s), `longueur ${n}`).toBe(ref(s));
    }
  });

  it('frontières nommées 55 / 56 / 63 / 64 / 65 / 119 / 120 octets', () => {
    for (const n of [55, 56, 63, 64, 65, 119, 120]) {
      const s = 'k'.repeat(n);
      expect(sha256Hex(s), `longueur ${n}`).toBe(ref(s));
    }
  });
});

describe('D2 — SHA-256 : UTF-8 multi-octets', () => {
  it('2, 3 et 4 octets par point de code : identiques à node:crypto', () => {
    const cases = [
      'é', // 2 octets
      'Citroën Deux-Chevaux', // diacritique en NFC
      'Citroën', // même graphème en NFD — hachage différent, comportement documenté
      '€', // 3 octets
      '日本語のテスト', // 3 octets par point de code
      '🚗🇧🇪', // 4 octets + paire de substitution
      'Škoda Fabia — 1,0 TSI', // mélange
      'a'.repeat(53) + 'é', // franchit la frontière 55/56 par l'octet de continuation
      'a'.repeat(62) + '€', // franchit la frontière 64
    ];
    for (const s of cases) {
      expect(sha256Hex(s), JSON.stringify(s)).toBe(ref(s));
    }
  });

  it('la chaîne canonique de filtres est hachée identiquement à node:crypto', () => {
    const canonical = 'equipment=3,7,12;keyword=break;make=9;priceTo=20000';
    expect(sha256Hex(canonical)).toBe(ref(canonical));
    expect(sha256Hex(canonical)).toHaveLength(64);
  });
});
