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
 *
 * REPRÉSENTATION DE L'ÉTAT (DR-049) : les quatre mots d'état sont conservés en entiers 32 bits
 * SIGNÉS (`| 0`), jamais en `>>> 0`. Les deux écritures portent le MÊME motif de bits et la suite
 * produite est identique ; mais un mot ≥ 2^31 sort du domaine des petits entiers de V8 et force une
 * allocation de nombre flottant à CHAQUE écriture de champ — quatre par tirage. Mesuré : 30 ns par
 * tirage en état non signé contre 2 ns en état signé, soit ≈ 330 ms sur la génération de 100 000
 * annonces. La conversion en non signé n'a lieu qu'à la SORTIE, où elle est immédiatement consommée.
 */

/** Taille (puissance de deux) de la table de gaussiennes précalculées. */
const GAUSSIAN_TABLE_SIZE = 8192;

/** Nombre de cases d'une table de tirage `buildDrawTable` (puissance de deux). */
export const DRAW_TABLE_SIZE = 4096;

/** Rotation à gauche sur 32 bits, résultat en entier signé (même motif de bits que `>>> 0`). */
const rotl = (x: number, k: number): number => ((x << k) | (x >>> (32 - k))) | 0;

/** Étale une graine 32 bits en un flot de mots 32 bits (initialisation de l'état de xoshiro). */
function splitMix32(seed: number): () => number {
  let z = seed | 0;
  return (): number => {
    z = (z + 0x9e3779b9) | 0;
    let t = z;
    t = Math.imul(t ^ (t >>> 16), 0x21f0aaad) | 0;
    t = Math.imul(t ^ (t >>> 15), 0x735a2d97) | 0;
    return (t ^ (t >>> 15)) | 0;
  };
}

/**
 * Générateur déterministe. Encapsule un état de 128 bits et expose les tirages utiles à la
 * génération de données (flottants, entiers bornés, gaussiennes, choix pondéré).
 */
export class Prng {
  /** État xoshiro128** en entiers 32 bits SIGNÉS (voir en-tête : allocation évitée). */
  private s0: number;
  private s1: number;
  private s2: number;
  private s3: number;

  constructor(seed: number) {
    const seeder = splitMix32(seed);
    this.s0 = seeder();
    this.s1 = seeder();
    this.s2 = seeder();
    this.s3 = seeder();
    // Quelques tours de chauffe pour disperser la graine.
    for (let i = 0; i < 16; i += 1) this.nextInt32();
  }

  /** Prochain mot pseudo-aléatoire, en entier 32 bits SIGNÉ (même motif de bits que `nextUint32`). */
  nextInt32(): number {
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

  /** Prochain mot pseudo-aléatoire 32 bits non signé. */
  nextUint32(): number {
    return this.nextInt32() >>> 0;
  }

  /** Flottant dans [0, 1). Résolution 2^32. */
  nextFloat(): number {
    return (this.nextInt32() >>> 0) / 4294967296;
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

  /**
   * Gaussienne centrée réduite, déterministe. Tirée dans une TABLE de 8 192 valeurs construite une
   * fois par Box-Muller (`GAUSSIAN_TABLE`) : la loi échantillonnée est la discrétisation de N(0,1) à
   * 8 192 atomes, indiscernable d'une gaussienne continue pour des données SYNTHÉTIQUES arrondies
   * (prix au pas de 50 €, kilométrage au pas de 100 km), et sans les quatre fonctions
   * transcendantes par paire de tirages qui pesaient ≈ 45 ms sur la génération de 100 000 annonces
   * (DR-049, chemin critique de `openSnapshot`).
   */
  nextGaussian(): number {
    return GAUSSIAN_TABLE[this.nextInt32() & (GAUSSIAN_TABLE_SIZE - 1)] as number;
  }

  /**
   * Choisit un indice dans une table de tirage préparée par `buildDrawTable` : un seul tirage et une
   * lecture de tableau, sans recherche. Réservé aux distributions COURTES et FIXES (vocabulaires
   * énumérés, fenêtre d'âges) — voir `buildDrawTable` pour la quantification.
   */
  pickTable(table: Int32Array): number {
    return table[this.nextInt32() & (table.length - 1)] as number;
  }

  /**
   * Choisit un indice selon des poids cumulés fournis (le dernier élément est la somme totale).
   * `cumulative` doit être strictement croissant et non vide.
   */
  pickCumulative(cumulative: readonly number[]): number {
    const n = cumulative.length;
    const total = cumulative[n - 1] ?? 0;
    const target = this.nextFloat() * total;
    // Recherche DICHOTOMIQUE du premier seuil dépassant la cible. Les poids cumulés sont
    // strictement croissants (tout poids nul est écarté à la construction), donc le résultat est
    // exactement celui de la recherche linéaire d'origine — à coût constant près du tirage, ce qui
    // retire 15 M d'itérations du chemin critique de la génération 100k (DR-049).
    let lo = 0;
    let hi = n - 1;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (target < (cumulative[mid] as number)) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  }
}

/**
 * Hachage déterministe d'un entier vers un flottant [0, 1). Sert à dériver un paramètre STABLE d'une
 * marque ou d'un modèle (multiplicateur de prix, segment) indépendamment de l'ordre de génération —
 * deux exécutions donnent le même paramètre pour le même identifiant.
 */
export function hashToUnit(key: number): number {
  let t = (key + 0x9e3779b9) | 0;
  t = Math.imul(t ^ (t >>> 16), 0x21f0aaad) | 0;
  t = Math.imul(t ^ (t >>> 15), 0x735a2d97) | 0;
  t = (t ^ (t >>> 15)) | 0;
  return (t >>> 0) / 4294967296;
}

/** Combine deux entiers en une clé de hachage (pour un couple marque/modèle). */
export function combineKeys(a: number, b: number): number {
  return (Math.imul(a, 0x85ebca6b) ^ Math.imul(b + 0x165667b1, 0xc2b2ae35)) | 0;
}

/**
 * Table de 8 192 gaussiennes centrées réduites, construite UNE fois par Box-Muller sur une graine
 * FIXE (indépendante de la graine du jeu de données : c'est une table de constantes, pas une source
 * d'aléa). `Prng.nextGaussian` y prélève une valeur par tirage uniforme.
 */
const GAUSSIAN_TABLE: Float64Array = (() => {
  const table = new Float64Array(GAUSSIAN_TABLE_SIZE);
  const seeder = splitMix32(0x5eed4a17);
  let s0 = seeder();
  let s1 = seeder();
  let s2 = seeder();
  let s3 = seeder();
  const nextFloat = (): number => {
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
    while (u <= 1e-12) u = nextFloat(); // évite ln(0)
    const v = nextFloat();
    const mag = Math.sqrt(-2 * Math.log(u));
    table[i] = mag * Math.cos(2 * Math.PI * v);
    table[i + 1] = mag * Math.sin(2 * Math.PI * v);
  }
  return table;
})();

/**
 * Prépare une table de tirage O(1) à partir de poids cumulés : chaque case porte l'indice que
 * `pickCumulative` aurait rendu pour la probabilité correspondante. Le tirage devient une lecture de
 * tableau au lieu d'une recherche dichotomique — mesuré à 18 % du temps de génération de 100 000
 * annonces (DR-049, chemin critique).
 *
 * QUANTIFICATION ASSUMÉE : la probabilité de chaque catégorie est arrondie au 1/4096 le plus proche,
 * soit un écart maximal de 0,024 point. Réservé aux distributions dont la plus petite part dépasse
 * largement ce pas (vocabulaires énumérés, fenêtre d'âges) ; les distributions à longue traîne
 * (marques, modèles) restent servies par `pickCumulative`, pour qu'AUCUNE catégorie ne devienne
 * intirable.
 */
export function buildDrawTable(cumulative: readonly number[], size = DRAW_TABLE_SIZE): Int32Array {
  const table = new Int32Array(size);
  const total = cumulative[cumulative.length - 1] ?? 0;
  let index = 0;
  for (let k = 0; k < size; k += 1) {
    const target = ((k + 0.5) / size) * total;
    while (index < cumulative.length - 1 && target >= (cumulative[index] as number)) index += 1;
    table[k] = index;
  }
  return table;
}

/**
 * Variante SÛRE pour une distribution à longue traîne : la table n'est retenue que si CHAQUE
 * catégorie y occupe au moins une case — sinon `null`, et l'appelant garde `pickCumulative`. C'est
 * la garantie qu'aucune marque ni aucun modèle du référentiel ne devient intirable (EX-DATA-20).
 */
export function buildSafeDrawTable(cumulative: readonly number[], size: number): Int32Array | null {
  const table = buildDrawTable(cumulative, size);
  const seen = new Uint8Array(cumulative.length);
  for (let k = 0; k < table.length; k += 1) seen[table[k] as number] = 1;
  for (let c = 0; c < cumulative.length; c += 1) if (seen[c] === 0) return null;
  return table;
}

/** Plus petite puissance de deux ≥ `n`, bornée à 65 536. */
export function drawTableSizeFor(count: number): number {
  let size = 32;
  const wanted = Math.min(65536, Math.max(32, count * 32));
  while (size < wanted) size *= 2;
  return size;
}
