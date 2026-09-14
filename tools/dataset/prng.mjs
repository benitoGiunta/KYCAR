/**
 * KYCAR - PRNG deterministe du generateur de fixtures (phase 3.2, R-30/R-31)
 * =================================================================================================
 * PORT VERBATIM de `src/providers/synthetic/prng.ts` (D3-04 : "le generateur de fixtures reutilise
 * prng, catalog, popularity en lecture"). L'import direct du TypeScript depuis `tools/` est
 * IMPRATICABLE : `tsx` n'est pas installe, le projet n'a pas de build pour `tools/`, et
 * `catalog.ts` / `popularity.ts` dependent des types applicatifs (`ReferenceData`,
 * `VocabularyName`) que le referentiel brut de `data/reference/` ne porte pas. La logique du PRNG
 * est donc RECOPIEE ici ; `catalog.ts` et `popularity.ts` sont remplaces par les tables chiffrees
 * de `docs/data/dataset-spec/*.json` (correction C-2 de DATASET-SPEC : les parts de marque
 * viennent desormais de `makes.json`, plus d'un tirage multinomial).
 *
 * Les nombres produits sont IDENTIQUES a ceux de la version TypeScript : meme etat 128 bits en
 * entiers 32 bits signes, meme sequence xoshiro128**, meme table de gaussiennes.
 *
 * Ajout par rapport a la version applicative : `jump()`, le polynome de saut standard de
 * xoshiro128** (2^64 tirages), exige par `profiles.json.snapshotSeedRule`.
 *
 * Aucune source d'entropie : ni `Date`, ni `Math.random`, ni `crypto`.
 */

const GAUSSIAN_TABLE_SIZE = 8192;

/** Rotation a gauche sur 32 bits, resultat en entier signe. */
const rotl = (x, k) => ((x << k) | (x >>> (32 - k))) | 0;

/** Etale une graine 32 bits en un flot de mots 32 bits. */
function splitMix32(seed) {
  let z = seed | 0;
  return () => {
    z = (z + 0x9e3779b9) | 0;
    let t = z;
    t = Math.imul(t ^ (t >>> 16), 0x21f0aaad) | 0;
    t = Math.imul(t ^ (t >>> 15), 0x735a2d97) | 0;
    return (t ^ (t >>> 15)) | 0;
  };
}

/** Polynome de saut de xoshiro128** : avance l'etat de 2^64 tirages. */
const JUMP = [0x8764000b, 0xf542d2d3, 0x6fa035c3, 0x77f2db5b];

/** Generateur deterministe xoshiro128**. */
export class Prng {
  /**
   * @param {number} seed graine 32 bits
   */
  constructor(seed) {
    const seeder = splitMix32(seed);
    this.s0 = seeder();
    this.s1 = seeder();
    this.s2 = seeder();
    this.s3 = seeder();
    for (let i = 0; i < 16; i += 1) this.nextInt32();
  }

  /** Prochain mot pseudo-aleatoire, entier 32 bits SIGNE. */
  nextInt32() {
    const result = Math.imul(rotl(Math.imul(this.s1, 5) | 0, 7), 9) | 0;
    const t = (this.s1 << 9) | 0;
    this.s2 = (this.s2 ^ this.s0) | 0;
    this.s3 = (this.s3 ^ this.s1) | 0;
    this.s1 = (this.s1 ^ this.s2) | 0;
    this.s0 = (this.s0 ^ this.s3) | 0;
    this.s2 = (this.s2 ^ t) | 0;
    this.s3 = rotl(this.s3, 11);
    return result;
  }

  /** Avance l'etat de 2^64 tirages (saut standard xoshiro128**). */
  jump() {
    let t0 = 0;
    let t1 = 0;
    let t2 = 0;
    let t3 = 0;
    for (let i = 0; i < 4; i += 1) {
      for (let b = 0; b < 32; b += 1) {
        if ((JUMP[i] >>> b) & 1) {
          t0 = (t0 ^ this.s0) | 0;
          t1 = (t1 ^ this.s1) | 0;
          t2 = (t2 ^ this.s2) | 0;
          t3 = (t3 ^ this.s3) | 0;
        }
        this.nextInt32();
      }
    }
    this.s0 = t0;
    this.s1 = t1;
    this.s2 = t2;
    this.s3 = t3;
    return this;
  }

  /** Flottant dans [0, 1). */
  nextFloat() {
    return (this.nextInt32() >>> 0) / 4294967296;
  }

  /** Entier dans [min, max] inclus. */
  nextInt(min, max) {
    return min + Math.floor(this.nextFloat() * (max - min + 1));
  }

  /** Flottant dans [min, max). */
  nextRange(min, max) {
    return min + this.nextFloat() * (max - min);
  }

  /** Vrai avec probabilite p. */
  nextBool(p) {
    return this.nextFloat() < p;
  }

  /** Gaussienne centree reduite (table de 8 192 atomes, identique a la version TypeScript). */
  nextGaussian() {
    return GAUSSIAN_TABLE[this.nextInt32() & (GAUSSIAN_TABLE_SIZE - 1)];
  }

  /**
   * Indice tire selon des poids CUMULES (dernier element = somme totale), recherche dichotomique.
   * @param {ArrayLike<number>} cumulative
   */
  pickCumulative(cumulative) {
    const n = cumulative.length;
    const total = cumulative[n - 1] ?? 0;
    const target = this.nextFloat() * total;
    let lo = 0;
    let hi = n - 1;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (target < cumulative[mid]) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  }
}

/** Hachage deterministe d'un entier vers un flottant [0, 1). */
export function hashToUnit(key) {
  let t = (key + 0x9e3779b9) | 0;
  t = Math.imul(t ^ (t >>> 16), 0x21f0aaad) | 0;
  t = Math.imul(t ^ (t >>> 15), 0x735a2d97) | 0;
  t = (t ^ (t >>> 15)) | 0;
  return (t >>> 0) / 4294967296;
}

/** Hachage deterministe d'un entier vers un mot 32 bits non signe (bijectif : pas de collision). */
export function hashToU32(key) {
  let t = (key + 0x9e3779b9) | 0;
  t = Math.imul(t ^ (t >>> 16), 0x21f0aaad) | 0;
  t = Math.imul(t ^ (t >>> 15), 0x735a2d97) | 0;
  t = (t ^ (t >>> 15)) | 0;
  return t >>> 0;
}

/** Combine deux entiers en une cle de hachage. */
export function combineKeys(a, b) {
  return (Math.imul(a, 0x85ebca6b) ^ Math.imul(b + 0x165667b1, 0xc2b2ae35)) | 0;
}

/**
 * Tirage par HACHAGE PUR (R-30) : ne consomme pas le flot principal. `domain` isole une famille de
 * traits (anomalie, valeur manquante, repli) pour qu'ajouter une regle ne decale jamais l'aval.
 */
export function pureUnit(seed, domain, row) {
  return hashToUnit(combineKeys((seed ^ Math.imul(domain, 0x9e3779b1)) | 0, row));
}

/** Table de 8 192 gaussiennes centrees reduites (constantes, graine fixe independante du jeu). */
const GAUSSIAN_TABLE = (() => {
  const table = new Float64Array(GAUSSIAN_TABLE_SIZE);
  const seeder = splitMix32(0x5eed4a17);
  let s0 = seeder();
  let s1 = seeder();
  let s2 = seeder();
  let s3 = seeder();
  const nextFloat = () => {
    const result = Math.imul(rotl(Math.imul(s1, 5) | 0, 7), 9) | 0;
    const t = (s1 << 9) | 0;
    s2 = (s2 ^ s0) | 0;
    s3 = (s3 ^ s1) | 0;
    s1 = (s1 ^ s2) | 0;
    s0 = (s0 ^ s3) | 0;
    s2 = (s2 ^ t) | 0;
    s3 = rotl(s3, 11);
    return (result >>> 0) / 4294967296;
  };
  for (let i = 0; i < GAUSSIAN_TABLE_SIZE; i += 2) {
    let u = 0;
    while (u <= 1e-12) u = nextFloat();
    const v = nextFloat();
    const mag = Math.sqrt(-2 * Math.log(u));
    table[i] = mag * Math.cos(2 * Math.PI * v);
    table[i + 1] = mag * Math.sin(2 * Math.PI * v);
  }
  return table;
})();
