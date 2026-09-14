import { describe, expect, it } from 'vitest';
import { sha256Hex } from './sha256';

/** Vecteurs FIPS 180-4 : garantit que le SHA-256 maison (codec EX-DATA-108) est correct. */
describe('sha256Hex', () => {
  it('hache la chaîne vide', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('hache "abc"', () => {
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('hache une chaîne de 448+ bits (deux blocs)', () => {
    expect(sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
  });

  it('est déterministe et sensible au moindre changement', () => {
    expect(sha256Hex('kycar')).toBe(sha256Hex('kycar'));
    expect(sha256Hex('kycar')).not.toBe(sha256Hex('kycaR'));
  });
});
