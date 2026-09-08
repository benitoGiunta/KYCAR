/**
 * KYCAR — Décodage / comparaison d'UUID de `listingId` (lot D4)
 * =================================================================================================
 * `listingId` est stocké en 16 octets binaires par ligne (EX-DATA-119). Le moteur en a besoin sous
 * trois formes : la chaîne canonique 8-4-4-4-12 minuscule (verdicts, forage vers deeplink), une
 * comparaison octet à octet (départage total des tris — EX-DATA-94/101/118), et le chemin inverse
 * (chaîne → 16 octets) pour interroger la clé primaire `PK_LISTING` sans matérialiser de chaînes.
 *
 * La chaîne est construite À PLAT (`String.fromCharCode` sur 36 unités de code), jamais par
 * concaténations successives : `s += …` répété 40 fois produit une CORDE V8 de ≈ 800 octets, alors
 * que la chaîne plate en coûte ≈ 56 — c'est 77 Mo d'écart sur 100 000 clés (DR-033, EX-DATA-112).
 *
 * Module PUR : importable par le worker comme par le thread principal.
 */

const HEX = '0123456789abcdef';
const DASH = 45; // '-'

/** Unités de code du quartet haut et du quartet bas, indexées par octet (évite tout calcul par caractère). */
const HI = new Uint16Array(256);
const LO = new Uint16Array(256);
for (let b = 0; b < 256; b++) {
  HI[b] = HEX.charCodeAt((b >> 4) & 0xf);
  LO[b] = HEX.charCodeAt(b & 0xf);
}

/** Décode les 16 octets à l'offset `row·16` en UUID canonique 8-4-4-4-12 minuscule (chaîne PLATE). */
export function decodeListingId(bytes: Uint8Array, row: number): string {
  const b = row * 16;
  return String.fromCharCode(
    HI[bytes[b] as number] as number, LO[bytes[b] as number] as number,
    HI[bytes[b + 1] as number] as number, LO[bytes[b + 1] as number] as number,
    HI[bytes[b + 2] as number] as number, LO[bytes[b + 2] as number] as number,
    HI[bytes[b + 3] as number] as number, LO[bytes[b + 3] as number] as number,
    DASH,
    HI[bytes[b + 4] as number] as number, LO[bytes[b + 4] as number] as number,
    HI[bytes[b + 5] as number] as number, LO[bytes[b + 5] as number] as number,
    DASH,
    HI[bytes[b + 6] as number] as number, LO[bytes[b + 6] as number] as number,
    HI[bytes[b + 7] as number] as number, LO[bytes[b + 7] as number] as number,
    DASH,
    HI[bytes[b + 8] as number] as number, LO[bytes[b + 8] as number] as number,
    HI[bytes[b + 9] as number] as number, LO[bytes[b + 9] as number] as number,
    DASH,
    HI[bytes[b + 10] as number] as number, LO[bytes[b + 10] as number] as number,
    HI[bytes[b + 11] as number] as number, LO[bytes[b + 11] as number] as number,
    HI[bytes[b + 12] as number] as number, LO[bytes[b + 12] as number] as number,
    HI[bytes[b + 13] as number] as number, LO[bytes[b + 13] as number] as number,
    HI[bytes[b + 14] as number] as number, LO[bytes[b + 14] as number] as number,
    HI[bytes[b + 15] as number] as number, LO[bytes[b + 15] as number] as number,
  );
}

/** Valeur d'un chiffre hexadécimal, ou −1. */
function hexValue(code: number): number {
  if (code >= 48 && code <= 57) return code - 48; // 0-9
  if (code >= 97 && code <= 102) return code - 87; // a-f
  if (code >= 65 && code <= 70) return code - 55; // A-F
  return -1;
}

/**
 * Chemin inverse : UUID canonique 8-4-4-4-12 → 16 octets. `null` si la forme n'est pas celle
 * d'`EX-DATA-15` (32 chiffres hexadécimaux, quatre tirets aux positions 8, 13, 18, 23).
 * Insensible à la casse — la comparaison de `PK_LISTING` reste octet à octet.
 */
export function parseListingId(listingId: string, out = new Uint8Array(16)): Uint8Array | null {
  if (listingId.length !== 36) return null;
  let o = 0;
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      if (listingId.charCodeAt(i) !== DASH) return null;
      continue;
    }
    const hi = hexValue(listingId.charCodeAt(i));
    const lo = hexValue(listingId.charCodeAt(++i));
    if (hi < 0 || lo < 0) return null;
    out[o++] = (hi << 4) | lo;
  }
  return o === 16 ? out : null;
}

/**
 * Compare deux lignes par leur `listingId`, octet à octet (EX-DATA-118) : ordre total, déterministe,
 * indépendant de la locale. Retourne < 0, 0 ou > 0.
 */
export function compareListingId(bytes: Uint8Array, rowA: number, rowB: number): number {
  const a = rowA * 16;
  const b = rowB * 16;
  for (let i = 0; i < 16; i++) {
    const d = (bytes[a + i] as number) - (bytes[b + i] as number);
    if (d !== 0) return d;
  }
  return 0;
}

/** Compare le `listingId` d'une ligne à 16 octets donnés, dans le même ordre total. */
export function compareListingIdToBytes(bytes: Uint8Array, row: number, key: Uint8Array): number {
  const a = row * 16;
  for (let i = 0; i < 16; i++) {
    const d = (bytes[a + i] as number) - (key[i] as number);
    if (d !== 0) return d;
  }
  return 0;
}
