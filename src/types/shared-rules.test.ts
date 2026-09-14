import { describe, expect, it } from 'vitest';
import {
  DUPLICATE_CONFLICT_FIELDS,
  HP_TO_KW,
  MODEL_VERSION_CLEAN_MAX,
  PRICE_SENTINEL_ABSOLUTE_EUR,
  cleanModelVersion,
  parseModelVersion,
  hpToKw,
  isPriceSentinelAbsolute,
  listingKey,
} from './shared-rules';
import { NUMERIC_UNKNOWN } from './sentinels';

/**
 * Règles métier partagées (étape 0 de la remédiation 2.6) : cas nominal ET bornes pour chaque
 * symbole. Ces fonctions sont pures, donc entièrement testables sans provider ni moteur.
 */

describe('sentinelle de prix absolue (EX-DATA-19(1), DR-001)', () => {
  it('le seuil est 250 € et la comparaison est STRICTE', () => {
    expect(PRICE_SENTINEL_ABSOLUTE_EUR).toBe(250);
    expect(isPriceSentinelAbsolute(1)).toBe(true);
    expect(isPriceSentinelAbsolute(249)).toBe(true);
    expect(isPriceSentinelAbsolute(250)).toBe(false); // borne exacte : 250 n'est PAS une sentinelle
    expect(isPriceSentinelAbsolute(12_900)).toBe(false);
  });

  it('un prix INCONNU n’est pas une sentinelle absolue (null, undefined, sentinelle -1)', () => {
    expect(isPriceSentinelAbsolute(null)).toBe(false);
    expect(isPriceSentinelAbsolute(undefined)).toBe(false);
    expect(isPriceSentinelAbsolute(NUMERIC_UNKNOWN)).toBe(false);
  });
});

describe('conversion ch → kW (ARB-33, DR-008)', () => {
  it('la constante est le facteur DIN 66036 et la conversion n’arrondit pas', () => {
    expect(HP_TO_KW).toBe(0.7355);
    expect(hpToKw(1)).toBe(0.7355);
    expect(hpToKw(100)).toBe(100 * 0.7355); // aucun arrondi intermédiaire : produit exact
    expect(hpToKw(100)).toBeCloseTo(73.55, 10);
    expect(hpToKw(0)).toBe(0);
  });

  it('la borne convertie discrimine bien deux effectifs voisins', () => {
    // `powerFrom=100` en ch retient 73,55 kW et plus : 73 kW est exclu, 74 kW inclus.
    expect(73 >= hpToKw(100)).toBe(false);
    expect(74 >= hpToKw(100)).toBe(true);
  });
});

describe('clé primaire d’une annonce (EX-DATA-15, DR-003)', () => {
  it('la clé est le couple (snapshotId, listingId), casse de l’UUID normalisée', () => {
    expect(listingKey('be-20260101T000000Z', '9f2b1c0e-0000-4000-8000-000000000001')).toBe(
      'be-20260101T000000Z:9f2b1c0e-0000-4000-8000-000000000001',
    );
    expect(listingKey('s1', 'AB-CD')).toBe(listingKey('s1', 'ab-cd'));
  });

  it('deux snapshots distincts ne partagent jamais une clé, même listingId identique', () => {
    expect(listingKey('s1', 'x')).not.toBe(listingKey('s2', 'x'));
  });
});

describe('champs comparés sur un doublon (ARB-54, DR-004)', () => {
  it('exactement les quatre champs d’ARB-54, dans l’ordre de l’exigence', () => {
    expect([...DUPLICATE_CONFLICT_FIELDS]).toEqual([
      'priceEur',
      'priceStatus',
      'mileageKm',
      'firstRegistrationYearMonth',
    ]);
    expect(DUPLICATE_CONFLICT_FIELDS).toHaveLength(4);
  });
});

describe('nettoyage de modelVersionClean (EX-DATA-29, ARB-61/ADV-17, ARB-24, DR-025)', () => {
  it('cas nominal : compactage, pictogrammes retirés, suites décoratives repliées', () => {
    expect(cleanModelVersion('  1.6 CDTI   Innovation  ')).toBe('1.6 CDTI Innovation');
    expect(cleanModelVersion('GTI 🔥🔥 Sport')).toBe('GTI Sport');
    expect(cleanModelVersion('GTI *** Sport')).toBe('GTI Sport');
    expect(cleanModelVersion('GTI (Sport) [2017]')).toBe('GTI Sport 2017');
  });

  it('entrée vide ou absente : chaîne vide, aucun drapeau posé ici (EX-DATA-31 relève de l’appelant)', () => {
    expect(cleanModelVersion(null)).toBe('');
    expect(cleanModelVersion(undefined)).toBe('');
    expect(cleanModelVersion('   ')).toBe('');
    expect(cleanModelVersion('★☆★')).toBe('');
  });

  it('borne : une chaîne d’exactement 80 caractères n’est pas tronquée', () => {
    const exact = 'A'.repeat(MODEL_VERSION_CLEAN_MAX);
    expect(MODEL_VERSION_CLEAN_MAX).toBe(80);
    expect(cleanModelVersion(exact)).toHaveLength(80);
    expect(cleanModelVersion(exact)).toBe(exact);
  });

  it('borne : troncature sur le dernier espace d’index strictement inférieur à 80', () => {
    // 78 caractères, un espace en index 78, puis un mot qui déborde.
    const source = `${'A'.repeat(78)} BBBBBBBBBB`;
    const cleaned = cleanModelVersion(source);
    expect(cleaned).toBe('A'.repeat(78));
    expect(cleaned.length).toBeLessThan(MODEL_VERSION_CLEAN_MAX);
    expect(cleaned.endsWith(' ')).toBe(false);
  });

  it('borne : un espace à l’index 80 exactement n’est PAS une frontière retenue', () => {
    // L'espace est à l'index 80 (≥ 80) : la règle exige un index strictement inférieur, donc
    // aucune frontière utilisable — repli sur la troncature dure à 80.
    const source = `${'A'.repeat(80)} CCC`;
    expect(cleanModelVersion(source)).toBe('A'.repeat(80));
  });

  it('ADV-17 : sans aucun espace sous la limite, troncature DURE à exactement 80', () => {
    const cleaned = cleanModelVersion('Z'.repeat(301));
    expect(cleaned).toHaveLength(80);
    expect(cleaned).toBe('Z'.repeat(80));
  });

  it('ARB-24 : la coupe dure recule pour ne jamais séparer une marque combinante de sa base', () => {
    // 80 lettres puis une marque combinante sans forme précomposée (Q + accent aigu) : couper à 80
    // laisserait la marque orpheline, donc la base (index 79) est écartée avec elle.
    const source = `${'Q'.repeat(80)}\u0301${'Q'.repeat(30)}`;
    const cleaned = cleanModelVersion(source);
    expect(Array.from(cleaned)).toHaveLength(79);
    expect(cleaned).toBe('Q'.repeat(79));
  });

  it('une chaîne de 301 caractères ne traverse jamais la fonction (R-PATHO-11)', () => {
    const long = `${'Opel Corsa Innovation '.repeat(20)}fin`;
    expect(long.length).toBeGreaterThan(300);
    expect(Array.from(cleanModelVersion(long)).length).toBeLessThanOrEqual(MODEL_VERSION_CLEAN_MAX);
  });
});

/* ---- DR-025 : étapes 3 et 7 à 10 du pipeline EX-DATA-29 ------------------------------------- */

const stoplistMod = import.meta.glob('../../data/reference/version-stoplist.json', { eager: true, import: 'default' });
const lexiconMod = import.meta.glob('../../data/reference/version-lexicon.json', { eager: true, import: 'default' });
const STOPLIST = (Object.values(stoplistMod)[0] as { entries: { pattern: string }[] }).entries.map((e) => e.pattern);
const LEXICON = (Object.values(lexiconMod)[0] as { driveBadges: string[] }).driveBadges;

describe('EX-DATA-30 — étape 3 : liste d’arrêt promotionnelle versionnée', () => {
  it('le fichier de référence porte les 40 motifs initiaux et le lexique ses 28 mentions', () => {
    expect(STOPLIST).toHaveLength(40);
    expect(STOPLIST).toContain('promo');
    expect(STOPLIST).toContain('carpass');
    expect(STOPLIST).toContain('@');
    expect(LEXICON).toHaveLength(28);
    expect(LEXICON).toContain('quattro');
    expect(LEXICON).toContain('st-line');
  });

  it('retire les marqueurs promotionnels, insensiblement à la casse et aux diacritiques', () => {
    expect(cleanModelVersion('PROMO 2.0 TDI Style', { stoplist: STOPLIST })).toBe('2.0 TDI Style');
    expect(cleanModelVersion('2.0 TDI Nouvelle Arrivée', { stoplist: STOPLIST })).toBe('2.0 TDI');
    expect(cleanModelVersion('1.6 HDi tva deductible', { stoplist: STOPLIST })).toBe('1.6 HDi');
  });

  it('retire aussi les amorces de coordonnées de contact — deuxième barrière R3', () => {
    expect(cleanModelVersion('2.0 TDI www.garage-x.be', { stoplist: STOPLIST })).toBe('2.0 TDI garage-x');
    expect(cleanModelVersion('1.4 TSI gsm 0470 11 22 33', { stoplist: STOPLIST })).not.toContain('gsm');
  });

  it('sans liste d’arrêt, aucun marqueur n’est retiré : la liste est une donnée, pas une constante', () => {
    expect(cleanModelVersion('PROMO 2.0 TDI Style')).toBe('PROMO 2.0 TDI Style');
  });
});

describe('EX-DATA-29 — étapes 7 à 10 : champs dérivés de la version déclarée', () => {
  const parse = (raw: string) => parseModelVersion(raw, { stoplist: STOPLIST, driveBadgeLexicon: LEXICON });

  it('étape 7 — jetons : 2 à 24 caractères, jamais purement numériques, majuscules, triés, 12 au plus', () => {
    const r = parse('2.0 TDI quattro S line 190 ch');
    expect(r.trimTokens).toEqual([...r.trimTokens].sort());
    expect(r.trimTokens).toContain('TDI');
    expect(r.trimTokens).toContain('QUATTRO');
    expect(r.trimTokens.some((t) => /^[0-9]+$/.test(t))).toBe(false);
    expect(r.trimTokens.length).toBeLessThanOrEqual(12);
    const many = parse(Array.from({ length: 30 }, (_v, i) => `MOT${i}`).join(' '));
    expect(many.trimTokens).toHaveLength(12);
  });

  it('étape 8 — cylindrée au badge : premier appariement, retenue dans [0,6 ; 8,0]', () => {
    expect(parse('2.0 TDI').badgeDisplacementL).toBe(2);
    expect(parse('1,6 HDi 115').badgeDisplacementL).toBe(1.6);
    expect(parse('0.4 mini').badgeDisplacementL).toBeNull(); // sous 0,6
    expect(parse('BMW 320d').badgeDisplacementL).toBeNull(); // aucun appariement
  });

  it('étape 9 — puissance au badge : conservée AVEC son unité, jamais substituée à powerKw', () => {
    expect(parse('2.0 TDI 190 ch').badgePower).toEqual({ value: 190, unit: 'ch', raw: '190 ch' });
    expect(parse('e-tron 300kw').badgePower?.unit).toBe('kw');
    expect(parse('2.0 TDI').badgePower).toBeNull();
  });

  it('étape 10 — mentions de motorisation : appariement du lexique FERMÉ, jamais une déduction', () => {
    expect(parse('2.0 TDI quattro S line').driveBadges).toEqual(['quattro', 'tdi', 's-line']);
    expect(parse('320d xDrive M Sport').driveBadges).toEqual(['xdrive', 'm-sport']);
    expect(parse('un moteur inconnu').driveBadges).toEqual([]);
  });
});
