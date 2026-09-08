/**
 * KYCAR — Décodage / comparaison d'UUID de `listingId` (lot D4)
 * =================================================================================================
 * `listingId` est stocké en 16 octets binaires par ligne (EX-DATA-119). Le moteur en a besoin sous
 * deux formes : la chaîne canonique 8-4-4-4-12 minuscule (clé de `PK_LISTING`, forage vers deeplink)
 * et une comparaison octet à octet (départage total des tris — EX-DATA-94/101/118).
 *
 * Module PUR : importable par le worker comme par le thread principal.
 */

const HEX = '0123456789abcdef';

/** Décode les 16 octets à l'offset `row·16` en UUID canonique 8-4-4-4-12 minuscule. */
export function decodeListingId(bytes: Uint8Array, row: number): string {
  const base = row * 16;
  let s = '';
  for (let i = 0; i < 16; i++) {
    const byte = bytes[base + i] as number;
    s += HEX[(byte >> 4) & 0xf];
    s += HEX[byte & 0xf];
    if (i === 3 || i === 5 || i === 7 || i === 9) s += '-';
  }
  return s;
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
