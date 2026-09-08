/**
 * KYCAR — Générateur pseudo-aléatoire déterministe du lot D3
 * =================================================================================================
 * `xoshiro128**` (Blackman & Vigna), graine 32 bits étendue par `splitMix32`. Toutes les opérations
 * sont en entiers 32 bits non signés (`Math.imul`, `>>> 0`) : la suite produite est identique octet à
 * octet sur toute plateforme conforme ES2022, ce qui garantit le critère de succès « déterministe à
 * graine fixée » (`EX-DATA-100bis`/`101`, ARCHITECTURE §4.2).
 *
 * Aucune source d'entropie externe (`Date`, `Math.random`, `crypto`) n'est utilisée : la seule entrée
 * est la graine passée au constructeur.
 */

const rotl = (x: number, k: number): number => (((x << k) | (x >>> (32 - k))) >>> 0);

/** Étale une graine 32 bits en un flot de mots 32 bits (initialisation de l'état de xoshiro). */
function splitMix32(seed: number): () => number {
  let z = seed >>> 0;
  return (): number => {
    z = (z + 0x9e3779b9) >>> 0;
    let t = z;
    t = Math.imul(t ^ (t >>> 16), 0x21f0aaad) >>> 0;
    t = Math.imul(t ^ (t >>> 15), 0x735a2d97) >>> 0;
    return (t ^ (t >>> 15)) >>> 0;
  };
}

/**
 * Générateur déterministe. Encapsule un état de 128 bits et expose les tirages utiles à la
 * génération de données (flottants, entiers bornés, gaussiennes, choix pondéré).
 */
export class Prng {
  private s0: number;
  private s1: number;
  private s2: number;
  private s3: number;
  /** Réserve d'une gaussienne (Box-Muller produit deux tirages à la fois). */
  private gaussSpare: number | null = null;

  constructor(seed: number) {
    const seeder = splitMix32(seed);
    this.s0 = seeder();
    this.s1 = seeder();
    this.s2 = seeder();
    this.s3 = seeder();
    // Quelques tours de chauffe pour disperser la graine.
    for (let i = 0; i < 16; i += 1) this.nextUint32();
  }

  /** Prochain mot pseudo-aléatoire 32 bits non signé. */
  nextUint32(): number {
    const result = (Math.imul(rotl(Math.imul(this.s1, 5) >>> 0, 7), 9) >>> 0);
    const t = (this.s1 << 9) >>> 0;
    this.s2 = (this.s2 ^ this.s0) >>> 0;
    this.s3 = (this.s3 ^ this.s1) >>> 0;
    this.s1 = (this.s1 ^ this.s2) >>> 0;
    this.s0 = (this.s0 ^ this.s3) >>> 0;
    this.s2 = (this.s2 ^ t) >>> 0;
    this.s3 = rotl(this.s3, 11);
    return result;
  }

  /** Flottant dans [0, 1). Résolution 2^32. */
  nextFloat(): number {
    return this.nextUint32() / 4294967296;
  }

  /** Entier dans [min, max] inclus (min ≤ max). */
  nextInt(min: number, max: number): number {
    const span = max - min + 1;
    return min + Math.floor(this.nextFloat() * span);
  }

  /** Flottant dans [min, max). */
  nextRange(min: number, max: number): number {
    return min + this.nextFloat() * (max - min);
  }

  /** Vrai avec probabilité `p` (0 ≤ p ≤ 1). */
  nextBool(p: number): boolean {
    return this.nextFloat() < p;
  }

  /** Gaussienne centrée réduite (Box-Muller), déterministe. */
  nextGaussian(): number {
    if (this.gaussSpare !== null) {
      const v = this.gaussSpare;
      this.gaussSpare = null;
      return v;
    }
    let u = 0;
    let v = 0;
    // Évite ln(0).
    while (u <= 1e-12) u = this.nextFloat();
    v = this.nextFloat();
    const mag = Math.sqrt(-2 * Math.log(u));
    this.gaussSpare = mag * Math.sin(2 * Math.PI * v);
    return mag * Math.cos(2 * Math.PI * v);
  }

  /**
   * Choisit un indice selon des poids cumulés fournis (le dernier élément est la somme totale).
   * `cumulative` doit être strictement croissant et non vide.
   */
  pickCumulative(cumulative: readonly number[]): number {
    const total = cumulative[cumulative.length - 1] ?? 0;
    const target = this.nextFloat() * total;
    // Recherche linéaire (tableaux courts) ; renvoie le premier seuil dépassant la cible.
    for (let i = 0; i < cumulative.length; i += 1) {
      if (target < (cumulative[i] ?? 0)) return i;
    }
    return cumulative.length - 1;
  }
}

/**
 * Hachage déterministe d'un entier vers un flottant [0, 1). Sert à dériver un paramètre STABLE d'une
 * marque ou d'un modèle (multiplicateur de prix, segment) indépendamment de l'ordre de génération —
 * deux exécutions donnent le même paramètre pour le même identifiant.
 */
export function hashToUnit(key: number): number {
  let t = (key + 0x9e3779b9) >>> 0;
  t = Math.imul(t ^ (t >>> 16), 0x21f0aaad) >>> 0;
  t = Math.imul(t ^ (t >>> 15), 0x735a2d97) >>> 0;
  t = (t ^ (t >>> 15)) >>> 0;
  return t / 4294967296;
}

/** Combine deux entiers en une clé de hachage (pour un couple marque/modèle). */
export function combineKeys(a: number, b: number): number {
  return (Math.imul(a, 0x85ebca6b) ^ Math.imul(b + 0x165667b1, 0xc2b2ae35)) >>> 0;
}
