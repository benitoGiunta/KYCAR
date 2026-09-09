/**
 * KYCAR — sondes `P-46` … `P-54`, `P-93` : vendeurs, regroupement, publicité, géographie, langue.
 * =================================================================================================
 * Agent `data-review` (phase 3.3).
 */
import { describe, expect, it } from 'vitest';

import {
  PROFILE,
  type RawListing,
  declaredIds,
  loadProfile,
  measure,
  median,
  pct,
  s0,
  specTable,
} from './harness';

interface GeographyTable {
  regionalTarget: Record<string, number>;
  provinces: { nuts2: string; name: string; region: string; weightPct: number; prefixes: string[] }[];
  prefixes: { prefix: string; nuts2: string; weightPct: number; language: Record<string, number> }[];
}
interface SellersTable {
  sellerTypeShare: Record<string, number>;
  dealerBucket: { counts: Record<string, number> };
}

const geo = specTable<GeographyTable>('geography');
const sellers = specTable<SellersTable>('sellers');

const regionOfPrefix = new Map<string, string>();
const nutsOfPrefix = new Map<string, string>();
for (const p of geo.provinces) {
  for (const pf of p.prefixes) {
    regionOfPrefix.set(pf, p.region);
    nutsOfPrefix.set(pf, p.nuts2);
  }
}
const languageOfPrefix = new Map(geo.prefixes.map((p) => [p.prefix, p.language]));

describe('P-46 … P-50, P-93 — vendeurs, regroupement, publicité', () => {
  it('P-46 — part de sellerType = D dans [0,67 ; 0,73]', () => {
    for (const sn of loadProfile()) {
      const share = sn.rows.filter((r) => r.seller?.type === 'D').length / sn.rows.length;
      if (sn.snapshotId === s0().snapshotId) measure('P-46', `${pct(share)}`);
      expect(share, sn.snapshotId).toBeGreaterThanOrEqual(0.67);
      expect(share, sn.snapshotId).toBeLessThanOrEqual(0.73);
    }
  });

  it('P-47 — dealerBucket présent pour 100 % des D et absent pour 100 % des P', () => {
    let bad = 0;
    let sample = '';
    for (const sn of loadProfile()) {
      for (const r of sn.rows) {
        const isPro = r.seller?.type === 'D';
        const hasBucket = r.seller?.dealerBucket !== undefined;
        if (isPro !== hasBucket) {
          bad += 1;
          if (sample === '') sample = `${r.id} type=${String(r.seller?.type)} bucket=${String(r.seller?.dealerBucket)}`;
        }
      }
    }
    measure('P-47', `${bad} écart(s) sur les 3 snapshots ${sample}`);
    expect(bad).toBe(0);
  });

  it('P-48 — nombre de dealerBucket = counts du profil ± 2 %, et premier / médian ≥ 8', () => {
    const sn = s0();
    const counts = new Map<string, number>();
    for (const r of sn.rows) {
      const b = r.seller?.dealerBucket;
      if (b !== undefined) counts.set(b, (counts.get(b) ?? 0) + 1);
    }
    const expected = sellers.dealerBucket.counts[PROFILE] as number;
    const sizes = [...counts.values()].sort((a, b) => b - a);
    const ratio = (sizes[0] as number) / median(sizes);
    measure(
      'P-48',
      `${counts.size} regroupements (attendu ${expected}) · premier ${sizes[0]} / médian ${median(sizes)} = ${ratio.toFixed(2)} · plus petit ${sizes[sizes.length - 1]}`,
    );
    expect(Math.abs(counts.size - expected) / expected).toBeLessThanOrEqual(0.02);
    expect(ratio).toBeGreaterThanOrEqual(8);
  });

  it('P-49 — tout dealerBucket d’un snapshot postérieur existe déjà dans S0', () => {
    const snaps = loadProfile();
    const base = new Set<string>();
    for (const r of (snaps[0] as (typeof snaps)[number]).rows) {
      const b = r.seller?.dealerBucket;
      if (b !== undefined) base.add(b);
    }
    let unknown = 0;
    for (const sn of snaps.slice(1)) {
      for (const r of sn.rows) {
        const b = r.seller?.dealerBucket;
        if (b !== undefined && !base.has(b)) unknown += 1;
      }
    }
    measure('P-49', `${base.size} regroupements en S0, ${unknown} annonce(s) portant un regroupement inconnu de S0`);
    expect(unknown).toBe(0);
  });

  it('P-50 — part d’adProduct.tier globale dans [0,14 ; 0,24] et < 0,30 ; 0 chez les PRIVÉ', () => {
    const sn = s0();
    const withTier = sn.rows.filter((r) => r.adProduct?.tier !== undefined);
    const share = withTier.length / sn.rows.length;
    const privateWithTier = withTier.filter((r) => r.seller?.type !== 'D').length;
    measure('P-50', `${pct(share)} globalement, ${privateWithTier} chez les PRIVÉ`);
    expect(share).toBeGreaterThanOrEqual(0.14);
    expect(share).toBeLessThanOrEqual(0.24);
    expect(share).toBeLessThan(0.3);
    expect(privateWithTier).toBe(0);
  });

  it('P-93 — tout dealerBucket porte ≥ 3 annonces ; les paires CROSS_SELLER_DUPLICATE ont 2 buckets et un peer', () => {
    let smallest = Number.POSITIVE_INFINITY;
    let sameBucket = 0;
    let missingPeer = 0;
    for (const sn of loadProfile()) {
      const counts = new Map<string, number>();
      for (const r of sn.rows) {
        const b = r.seller?.dealerBucket;
        if (b !== undefined) counts.set(b, (counts.get(b) ?? 0) + 1);
      }
      for (const c of counts.values()) smallest = Math.min(smallest, c);
      const byId = new Map(sn.rows.map((r) => [r.id, r]));
      for (const g of sn.manifest.groundTruth) {
        if (g.anomaly !== 'CROSS_SELLER_DUPLICATE') continue;
        if (g.peerListingId === undefined) {
          missingPeer += 1;
          continue;
        }
        const a = byId.get(g.listingId);
        const b = byId.get(g.peerListingId);
        if (a && b && a.seller?.dealerBucket === b.seller?.dealerBucket) sameBucket += 1;
      }
    }
    measure('P-93', `plus petit regroupement ${smallest} annonces · ${sameBucket} paire(s) à même bucket · ${missingPeer} sans peer`);
    expect(smallest).toBeGreaterThanOrEqual(3);
    expect(sameBucket).toBe(0);
    expect(missingPeer).toBe(0);
  });
});

describe('P-51 … P-54 — géographie et langue', () => {
  it('P-51 — Flandre / Wallonie / Bruxelles = 55 / 37 / 8 à ±2 points', () => {
    const sn = s0();
    const counts: Record<string, number> = { VLG: 0, WAL: 0, BRU: 0 };
    for (const r of sn.rows) {
      const reg = regionOfPrefix.get(r.location.postalCodePrefix2 ?? '');
      if (reg !== undefined) counts[reg] = (counts[reg] ?? 0) + 1;
    }
    const n = sn.rows.length;
    measure(
      'P-51',
      `VLG ${pct((counts['VLG'] as number) / n)} · WAL ${pct((counts['WAL'] as number) / n)} · BRU ${pct((counts['BRU'] as number) / n)}`,
    );
    for (const [reg, target] of Object.entries(geo.regionalTarget)) {
      const got = ((counts[reg] as number) / n) * 100;
      expect(Math.abs(got - target), `${reg} : ${got.toFixed(2)} vs ${target}`).toBeLessThanOrEqual(2);
    }
  });

  it('P-52 — postalCodePrefix2 : 100 % sur 2 chiffres, 99,6 % dans 10..99, 0,4 % dans 00..09', () => {
    const sn = s0();
    let malformed = 0;
    let high = 0;
    let low = 0;
    let absent = 0;
    for (const r of sn.rows) {
      const pf = r.location.postalCodePrefix2;
      if (pf === undefined) {
        absent += 1;
        continue;
      }
      if (!/^[0-9]{2}$/.test(pf)) {
        malformed += 1;
        continue;
      }
      if (Number(pf) >= 10) high += 1;
      else low += 1;
    }
    const present = high + low;
    measure(
      'P-52',
      `${malformed} valeur(s) mal formée(s) · 10..99 ${pct(high / present)} · 00..09 ${pct(low / present)} · ${absent} absente(s) (${pct(absent / sn.rows.length)})`,
    );
    expect(malformed).toBe(0);
    expect(high / present).toBeGreaterThanOrEqual(0.99);
    expect(low / present).toBeGreaterThanOrEqual(0.002);
    expect(low / present).toBeLessThanOrEqual(0.008);
  });

  it('P-53 — 100 % des préfixes 10..99 résolvent une province ; 100 % des 00..09 sont déclarés REGION_UNRESOLVED', () => {
    let unresolvedHigh = 0;
    let undeclaredLow = 0;
    let declaredLow = 0;
    for (const sn of loadProfile()) {
      const declared = declaredIds(sn, 'REGION_UNRESOLVED');
      for (const r of sn.rows) {
        const pf = r.location.postalCodePrefix2;
        if (pf === undefined) continue;
        if (Number(pf) >= 10) {
          if (!nutsOfPrefix.has(pf)) unresolvedHigh += 1;
        } else if (declared.has(r.id)) declaredLow += 1;
        else undeclaredLow += 1;
      }
    }
    measure('P-53', `${unresolvedHigh} préfixe(s) 10..99 non résolu(s) · ${declaredLow} déclarés A-21 · ${undeclaredLow} non déclarés`);
    expect(unresolvedHigh).toBe(0);
    expect(undeclaredLow).toBe(0);
  });

  /**
   * HYPOTHÈSE ÉCRITE (E4) — classifieur de langue du reviewer. `R-36` fixe la langue de
   * `modelVersion` mais AUCUNE table de la spécification ne publie le vocabulaire de finition par
   * langue : il n'existe que dans `tools/dataset/listing.mjs` (constante `TRIM_WORDS`), et n'est
   * même pas cité parmi les hypothèses `HG-01` … `HG-04` de DATASET-GEN. Le classifieur ci-dessous
   * est donc reconstruit par le reviewer à partir des jetons NON AMBIGUS observés dans le fichier :
   * les libellés partagés par deux langues (`Business`, `Elegance`, `Sport`, `Comfort`, `Style`,
   * `Trend`) ne classent rien. C'est un constat en soi : voir le rapport.
   */
  const UNAMBIGUOUS: Record<'fr' | 'nl' | 'de', string[]> = {
    fr: ['Access', 'Active', 'Confort', 'Allure', 'Exec', 'Premium'],
    nl: ['Base', 'Highline', 'Excl'],
    de: ['Basis', 'Ambiente', 'Exklusiv'],
  };
  const detectLanguage = (v: string | undefined): 'fr' | 'nl' | 'de' | undefined => {
    if (v === undefined) return undefined;
    const tokens = new Set(v.split(/\s+/));
    for (const [lang, words] of Object.entries(UNAMBIGUOUS) as ['fr' | 'nl' | 'de', string[]][]) {
      if (words.some((w) => tokens.has(w))) return lang;
    }
    return undefined;
  };
  const dominantLanguage = (prefix: string): string | undefined => {
    const m = languageOfPrefix.get(prefix);
    if (!m) return undefined;
    return Object.entries(m).sort((a, b) => b[1] - a[1])[0]?.[0];
  };

  it('P-54 — « de » seulement sur le préfixe 47 ; croisement fr/nl ≤ 5 % des annonces professionnelles', () => {
    const sn = s0();
    let deElsewhere = 0;
    let deOn47 = 0;
    let classified = 0;
    let crossings = 0;
    let proTotal = 0;
    for (const r of sn.rows as readonly RawListing[]) {
      const lang = detectLanguage(r.modelVersion);
      const pf = r.location.postalCodePrefix2;
      if (lang !== undefined) classified += 1;
      if (lang === 'de') {
        if (pf === '47') deOn47 += 1;
        else deElsewhere += 1;
      }
      if (r.seller?.type !== 'D') continue;
      proTotal += 1;
      if (lang === undefined || pf === undefined) continue;
      // Bruxelles (10-12) est bilingue PAR CONSTRUCTION et 47 est germanophone : ni l'un ni l'autre
      // ne constitue un « croisement ».
      if (pf === '10' || pf === '11' || pf === '12' || pf === '47') continue;
      const dom = dominantLanguage(pf);
      if (dom !== undefined && (lang === 'fr' || lang === 'nl') && lang !== dom) crossings += 1;
    }
    measure(
      'P-54',
      `${classified} versions classées · « de » : ${deOn47} sur le préfixe 47, ${deElsewhere} ailleurs · croisement PRO ${pct(crossings / proTotal)} (${crossings}/${proTotal})`,
    );
    expect(classified).toBeGreaterThan(sn.rows.length * 0.1);
    expect(deElsewhere).toBe(0);
    expect(deOn47).toBeGreaterThan(0);
    expect(crossings / proTotal).toBeLessThanOrEqual(0.05);
  });
});
