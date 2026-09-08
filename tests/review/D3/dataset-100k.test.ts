/**
 * KYCAR — Sondes de revue D3 : le dataset de 100 000 annonces
 * =================================================================================================
 * Phase 2.5 (`rev-D3`). Toutes les sondes de ce fichier partagent DEUX générations de 100 000
 * annonces au maximum (cache de module `helpers.ts`) : la génération n° 1 sert toutes les analyses,
 * la n° 2 uniquement le contrôle de déterminisme.
 *
 * Une sonde dont le titre commence par `R-D3-xx` est un CONSTAT : elle échoue tant que la phase 2.6
 * n'a pas corrigé le lot. Les autres sont des preuves de conformité.
 */

import { beforeAll, describe, expect, it } from 'vitest';

import type { ListingColumnBatch } from '../../../src/providers/DataProvider';
import { NUMERIC_UNKNOWN, ENUM_UNKNOWN_BYTE } from '../../../src/types/sentinels';
import { scanForbiddenFields } from '../../../src/types/validation';
import { INGEST_FLAG_VALUES } from '../../../src/types/vocabularies';
import { SyntheticDataProvider } from '../../../src/providers/synthetic/SyntheticDataProvider';
import { uuidToHex, type InjectedOutlier } from '../../../src/providers/synthetic/generate';
import {
  columnHashes,
  gzipBytes,
  memoryBytes,
  primary,
  reference,
  rowAsObject,
  rowStrings,
  serialize,
  spearman,
  twin,
  views,
  type Dataset,
} from './helpers';

const MIB = 1024 * 1024;
const BIT_PRICE_SENTINEL_ABSOLUTE = INGEST_FLAG_VALUES.findIndex((v) => v.code === 'PRICE_SENTINEL_ABSOLUTE');

let ds: Dataset;
let batch: ListingColumnBatch;
let outliers: readonly InjectedOutlier[];

/** n_price par cellule d'homogénéité (EX-DATA-86) : rang 2 `(marque, modèle)`, rang 1 `+ année`. */
const nByModelCell = new Map<string, number>();
const nByModelYearCell = new Map<string, number>();

beforeAll(async () => {
  ds = await primary();
  batch = ds.batch;
  outliers = ds.outliers;
  for (let i = 0; i < batch.rowCount; i += 1) {
    if ((batch.priceEur[i] as number) === NUMERIC_UNKNOWN) continue;
    const mk = `${batch.makeId[i]}:${batch.modelId[i]}`;
    nByModelCell.set(mk, (nByModelCell.get(mk) ?? 0) + 1);
    const my = `${mk}:${batch.modelYear[i]}`;
    nByModelYearCell.set(my, (nByModelYearCell.get(my) ?? 0) + 1);
  }
  const modelSizes = [...nByModelCell.values()].sort((a, b) => b - a);
  const modelYearSizes = [...nByModelYearCell.values()].sort((a, b) => b - a);
  console.log(`[rev-D3] openSnapshot(100 000, graine par défaut) = ${ds.openMs.toFixed(0)} ms`);
  console.log(
    `[rev-D3] cellules C2 (marque,modèle) = ${nByModelCell.size} ; n≥12 : ${modelSizes.filter((n) => n >= 12).length} ; ` +
      `n≥30 : ${modelSizes.filter((n) => n >= 30).length} ; max = ${modelSizes[0]} ; médiane = ${modelSizes[Math.floor(modelSizes.length / 2)]}`,
  );
  console.log(
    `[rev-D3] cellules C1 (marque,modèle,année) = ${nByModelYearCell.size} ; n≥12 : ` +
      `${modelYearSizes.filter((n) => n >= 12).length} ; max = ${modelYearSizes[0]} ; ` +
      `médiane = ${modelYearSizes[Math.floor(modelYearSizes.length / 2)]}`,
  );
  console.log(
    `[rev-D3] outliers = ${outliers.length} (M1 ${outliers.filter((o) => o.method === 'M1').length} / ` +
      `M2 ${outliers.filter((o) => o.method === 'M2').length}) sur ${batch.rowCount} annonces`,
  );
}, 180_000);

/* ================================================================================================
 * 1. EX-NFR-1 / EX-NFR-3 — enveloppes de taille (critère D3 §7.1)
 * ============================================================================================== */

describe('D3 §7.1 — 100 000 annonces sous les cibles de taille', () => {
  it('EX-NFR-1 — empreinte mémoire (colonnes typées + zone texte) ≤ 25 Mo', () => {
    const m = memoryBytes(batch);
    console.log(
      `[rev-D3] EX-NFR-1 : total = ${(m.total / MIB).toFixed(2)} Mio ` +
        `(colonnes ${(m.columns / MIB).toFixed(2)} Mio + zone texte ${(m.strings / MIB).toFixed(2)} Mio) ; ` +
        `octets/ligne = ${(m.total / batch.rowCount).toFixed(1)}`,
    );
    expect(batch.rowCount).toBe(100_000);
    expect(m.total / MIB).toBeLessThanOrEqual(25);
  });

  it('EX-NFR-3 — lot colonnaire sérialisé ≤ 6 Mo gzip (zlib.gzipSync)', () => {
    const raw = serialize(batch);
    const gz = gzipBytes(raw);
    console.log(
      `[rev-D3] EX-NFR-3 : sérialisé = ${(raw.byteLength / MIB).toFixed(2)} Mio → gzip = ` +
        `${(gz / MIB).toFixed(2)} Mio (marge ${(100 * (1 - gz / (6 * MIB))).toFixed(1)} %)`,
    );
    expect(gz / MIB).toBeLessThanOrEqual(6);
  });
});

/* ================================================================================================
 * 2. Déterminisme (critère D3 §7.1)
 * ============================================================================================== */

describe('D3 §7.1 — déterminisme à graine fixée', () => {
  it('deux générations 100k à graine identique ont les mêmes hachages de colonne et les mêmes octets', async () => {
    const other = await twin();
    const ha = columnHashes(batch);
    const hb = columnHashes(other.batch);
    expect(Object.keys(hb)).toEqual(Object.keys(ha));
    for (const key of Object.keys(ha)) expect(`${key}=${hb[key]}`).toBe(`${key}=${ha[key]}`);
    const a = serialize(batch);
    const b = serialize(other.batch);
    expect(a.byteLength).toBe(b.byteLength);
    let firstDiff = -1;
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) {
        firstDiff = i;
        break;
      }
    }
    expect(firstDiff).toBe(-1);
    expect(JSON.stringify(other.outliers)).toBe(JSON.stringify(outliers));
    console.log(`[rev-D3] déterminisme : ${Object.keys(ha).length} colonnes, ${a.byteLength} octets identiques`);
  }, 180_000);

  it('deux graines différentes produisent des jeux différents', async () => {
    const a = new SyntheticDataProvider({ referenceData: reference(), listingCount: 5000, seed: 101 });
    const b = new SyntheticDataProvider({ referenceData: reference(), listingCount: 5000, seed: 102 });
    await a.openSnapshot();
    await b.openSnapshot();
    const ha = columnHashes(a.getDataset().batch);
    const hb = columnHashes(b.getDataset().batch);
    const differing = Object.keys(ha).filter((k) => ha[k] !== hb[k]);
    console.log(`[rev-D3] graines 101 vs 102 : ${differing.length}/${Object.keys(ha).length} colonnes différentes`);
    expect(differing.length).toBeGreaterThan(20);
    expect(a.getDataset().outliers[0]?.listingId).not.toBe(b.getDataset().outliers[0]?.listingId);
  }, 120_000);
});

/* ================================================================================================
 * 3. Vérité terrain des outliers et éligibilité des cellules M1 / M2 (EX-DATA-86/88/90)
 * ============================================================================================== */

describe('D3 §7.1 — vérité terrain des outliers', () => {
  it('chaque outlier annoncé existe, porte le prix injecté et les bons identifiants', () => {
    expect(outliers.length).toBeGreaterThan(0);
    const problems: string[] = [];
    for (const o of outliers) {
      if ((batch.priceEur[o.rowIndex] as number) !== o.injectedPriceEur) problems.push(`row ${o.rowIndex} : prix ≠ injecté`);
      if ((batch.makeId[o.rowIndex] as number) !== o.makeId) problems.push(`row ${o.rowIndex} : makeId divergent`);
      if ((batch.modelId[o.rowIndex] as number) !== o.modelId) problems.push(`row ${o.rowIndex} : modelId divergent`);
      if (o.injectedPriceEur === o.fairPriceEur) problems.push(`row ${o.rowIndex} : écart nul`);
      if (o.listingId !== uuidToHex(batch.listingId, o.rowIndex * 16)) problems.push(`row ${o.rowIndex} : listingId divergent`);
    }
    expect(problems.slice(0, 10)).toEqual([]);
  });

  it('les outliers M1 injectés sont hors de toute fourchette de marché (absolus)', () => {
    const m1 = outliers.filter((o) => o.method === 'M1');
    const bad = m1.filter((o) =>
      o.flag === 'M1_HIGH' ? o.injectedPriceEur < 400_000 : o.injectedPriceEur > 500,
    );
    console.log(`[rev-D3] M1 = ${m1.length} (HIGH ≥ 400 k€ / LOW ≤ 500 €) ; hors gabarit : ${bad.length}`);
    expect(bad).toEqual([]);
  });

  it('R-D3-06 — l’écart réel de certains M2_LOW est écrasé par le plancher de 300 € : la vérité terrain annonce un outlier que la donnée ne porte pas', () => {
    // `injectOutliers` vise `fair × [0,14 ; 0,24]` puis borne à 300 € : sur une annonce bon marché
    // le rapport réel remonte jusqu'à 0,60, soit un écart de −40 % que M2 ne distinguera pas d'une
    // annonce simplement bien placée. La vérité terrain reste néanmoins étiquetée `M2_LOW`.
    const weak = outliers
      .filter((o) => o.flag === 'M2_LOW' && o.injectedPriceEur / o.fairPriceEur > 0.25)
      .map((o) => `${o.rowIndex}:${(o.injectedPriceEur / o.fairPriceEur).toFixed(2)}`);
    console.log(`[rev-D3] M2_LOW dont le rapport réel > 0,25 : ${weak.length} → ${weak.slice(0, 8).join(' ')}`);
    expect(weak).toEqual([]);
  });

  it('R-D3-05 — la majorité des outliers M2 tombe hors d’une cellule éligible à M2 (n_price ≥ 30, EX-DATA-86/90)', () => {
    // M2 démarre à la cellule C2 `(marque, modèle)` et exige `|F| ≥ 30` (EX-DATA-90). Un M2 injecté
    // dans une cellule plus petite n'est PAS vérifiable par D4 : le « contrôle croisé » annoncé au
    // critère §7.1 n'a alors pas de matière.
    const m2 = outliers.filter((o) => o.method === 'M2');
    const inCell = m2.filter((o) => (nByModelCell.get(`${o.makeId}:${o.modelId}`) ?? 0) >= 30);
    console.log(`[rev-D3] M2 dans une cellule n_price ≥ 30 : ${inCell.length}/${m2.length}`);
    expect(inCell.length / Math.max(1, m2.length)).toBeGreaterThanOrEqual(0.5);
  });

  it('R-D3-07 — aucune cellule `(marque, modèle, année)` n’atteint n_price ≥ 12 : la cellule de rang 1 de M1 (EX-DATA-86) n’est jamais formable', () => {
    // La justification d'EX-DATA-86/88 se réfère à « 14 Corsa de 2017 » et « 1 281 Corsa belges » :
    // un marché réel est CONCENTRÉ. Le tirage de D3 étale 100 000 annonces sur ~4 955 modèles, si
    // bien qu'aucune cellule de rang 1 n'est exploitable — M1 démarre donc toujours au rang 2.
    const eligible = [...nByModelYearCell.values()].filter((n) => n >= 12).length;
    console.log(`[rev-D3] cellules C1 éligibles (n_price ≥ 12) = ${eligible}`);
    expect(eligible).toBeGreaterThanOrEqual(50);
  });

  it('la taxonomie offre des cellules C2 éligibles à M1 (n_price ≥ 12) et des outliers dedans', () => {
    const ge12 = [...nByModelCell.values()].filter((n) => n >= 12).length;
    const inCell = outliers.filter((o) => (nByModelCell.get(`${o.makeId}:${o.modelId}`) ?? 0) >= 12).length;
    console.log(`[rev-D3] cellules C2 n≥12 = ${ge12} ; outliers dans une telle cellule = ${inCell}/${outliers.length}`);
    expect(ge12).toBeGreaterThan(100);
    expect(inCell).toBeGreaterThan(100);
  });
});

/* ================================================================================================
 * 4. Plausibilité : monotonies, bornes, sentinelles
 * ============================================================================================== */

describe('D3 §7.1 — plausibilité des distributions', () => {
  it('le prix décroît avec l’âge dans les cellules (marque, modèle) — Spearman signée', () => {
    const injected = new Set(outliers.map((o) => o.rowIndex));
    const byCell = new Map<string, { price: number[]; age: number[] }>();
    for (let i = 0; i < batch.rowCount; i += 1) {
      const p = batch.priceEur[i] as number;
      if (p === NUMERIC_UNKNOWN || injected.has(i)) continue;
      const key = `${batch.makeId[i]}:${batch.modelId[i]}`;
      const e = byCell.get(key) ?? { price: [], age: [] };
      e.price.push(p);
      e.age.push(2026 - (batch.modelYear[i] as number));
      byCell.set(key, e);
    }
    const rhos: number[] = [];
    for (const [key, e] of byCell) {
      if ((nByModelCell.get(key) ?? 0) < 30) continue;
      const r = spearman(e.price, e.age);
      if (r !== null) rhos.push(r);
    }
    rhos.sort((a, b) => a - b);
    const median = rhos[Math.floor(rhos.length / 2)] as number;
    const negative = rhos.filter((r) => r < 0).length;
    console.log(
      `[rev-D3] ρ(prix, âge) sur ${rhos.length} cellules n≥30 : médiane ${median.toFixed(3)} ; ` +
        `négatives ${negative}/${rhos.length} ; min ${rhos[0]?.toFixed(3)} ; max ${rhos[rhos.length - 1]?.toFixed(3)}`,
    );
    expect(rhos.length).toBeGreaterThan(50);
    expect(median).toBeLessThan(-0.5);
    expect(negative / rhos.length).toBeGreaterThan(0.95);
  });

  it('à âge et modèle fixés, le prix décroît avec le kilométrage — Spearman signée sur prix normalisé', () => {
    // Les cellules `(marque, modèle, année)` sont trop petites pour une corrélation par cellule
    // (cf. R-D3-07) : on normalise chaque prix par la médiane de SA cellule, puis on corrèle le prix
    // normalisé au kilométrage sur l'ensemble des annonces des cellules d'effectif ≥ 4.
    const injected = new Set(outliers.map((o) => o.rowIndex));
    const rowsByCell = new Map<string, number[]>();
    for (let i = 0; i < batch.rowCount; i += 1) {
      const p = batch.priceEur[i] as number;
      if (p === NUMERIC_UNKNOWN || injected.has(i)) continue;
      const key = `${batch.makeId[i]}:${batch.modelId[i]}:${batch.modelYear[i]}`;
      const arr = rowsByCell.get(key) ?? [];
      arr.push(i);
      rowsByCell.set(key, arr);
    }
    const ratios: number[] = [];
    const kms: number[] = [];
    let cellsUsed = 0;
    for (const rows of rowsByCell.values()) {
      if (rows.length < 4) continue;
      cellsUsed += 1;
      const prices = rows.map((i) => batch.priceEur[i] as number).sort((a, b) => a - b);
      const med = prices[Math.floor(prices.length / 2)] as number;
      for (const i of rows) {
        ratios.push((batch.priceEur[i] as number) / med);
        kms.push(batch.mileageKm[i] as number);
      }
    }
    const rho = spearman(ratios, kms);
    console.log(
      `[rev-D3] ρ(prix normalisé, km) = ${rho?.toFixed(3)} sur ${ratios.length} annonces / ${cellsUsed} cellules (marque,modèle,année) n≥4`,
    );
    expect(ratios.length).toBeGreaterThan(5000);
    expect(rho).not.toBeNull();
    expect(rho as number).toBeLessThan(-0.1);
  });

  it('EX-DATA-111 / bornes du dictionnaire : 100 % des valeurs stockées sont dans le domaine', () => {
    const violations: Record<string, number> = {};
    const bump = (k: string): void => {
      violations[k] = (violations[k] ?? 0) + 1;
    };
    for (let i = 0; i < batch.rowCount; i += 1) {
      const p = batch.priceEur[i] as number;
      if (p !== NUMERIC_UNKNOWN && (p < 1 || p > 5_000_000)) bump('priceEur∉[1,5e6]');
      const km = batch.mileageKm[i] as number;
      if (km !== NUMERIC_UNKNOWN && (km < 0 || km > 1_500_000)) bump('mileageKm∉[0,1.5e6]');
      const y = batch.modelYear[i] as number;
      if (y !== NUMERIC_UNKNOWN && (y < 1900 || y > 2101)) bump('modelYear∉[1900,2101]');
      const kw = batch.powerKw[i] as number;
      if (kw !== NUMERIC_UNKNOWN && (kw < 1 || kw > 9999)) bump('powerKw∉[1,9999]');
      const co2 = batch.co2EmissionsGPerKmX10[i] as number;
      if (co2 !== NUMERIC_UNKNOWN && (co2 < 0 || co2 / 10 > 1000)) bump('co2∉[0,1000]');
      const cons = batch.consumptionCombinedL100KmX10[i] as number;
      if (cons !== NUMERIC_UNKNOWN && (cons / 10 < 0.1 || cons / 10 > 99.9)) bump('conso∉[0.1,99.9]');
      const er = batch.electricRangeKm[i] as number;
      if (er !== NUMERIC_UNKNOWN && (er < 1 || er > 10_000)) bump('electricRange∉[1,10000]');
      const doors = batch.doorCount[i] as number;
      if (doors !== ENUM_UNKNOWN_BYTE && (doors < 1 || doors > 9)) bump('doorCount∉[1,9]');
      const seats = batch.seatCount[i] as number;
      if (seats !== ENUM_UNKNOWN_BYTE && (seats < 1 || seats > 99)) bump('seatCount∉[1,99]');
      const owners = batch.previousOwnerCount[i] as number;
      if (owners !== ENUM_UNKNOWN_BYTE && owners > 99) bump('previousOwnerCount>99');
      const imgs = batch.imageCount[i] as number;
      if (imgs !== ENUM_UNKNOWN_BYTE && imgs > 50) bump('imageCount>50');
      const frym = batch.firstRegistrationYearMonth[i] as number;
      if (frym !== NUMERIC_UNKNOWN) {
        const yy = Math.floor(frym / 12);
        const mm = frym % 12;
        if (yy < 1900 || yy > 2101 || mm < 0 || mm > 11) bump('firstRegistrationYearMonth');
      }
    }
    console.log(`[rev-D3] violations de bornes = ${JSON.stringify(violations)}`);
    expect(violations).toEqual({});
  });

  it('les sentinelles de prix (MISSING / ON_REQUEST) sont produites en proportion non nulle', () => {
    const voc = reference().vocabularies.get('KYCAR_PRICE_STATUS');
    const idx = (code: string): number => voc?.values.findIndex((v) => v.code === code) ?? -1;
    const iQuoted = idx('QUOTED');
    const iOnReq = idx('ON_REQUEST');
    const iMissing = idx('MISSING');
    let quoted = 0;
    let onReq = 0;
    let missing = 0;
    let mismatch = 0;
    for (let i = 0; i < batch.rowCount; i += 1) {
      const s = batch.priceStatus[i] as number;
      const p = batch.priceEur[i] as number;
      if (s === iQuoted) quoted += 1;
      else if (s === iOnReq) onReq += 1;
      else if (s === iMissing) missing += 1;
      if ((s === iQuoted) !== (p !== NUMERIC_UNKNOWN)) mismatch += 1;
    }
    console.log(
      `[rev-D3] priceStatus : QUOTED ${quoted} (${((100 * quoted) / batch.rowCount).toFixed(1)} %), ` +
        `ON_REQUEST ${onReq}, MISSING ${missing} ; incohérences statut/valeur = ${mismatch}`,
    );
    expect(onReq).toBeGreaterThan(0);
    expect(missing).toBeGreaterThan(0);
    expect(mismatch).toBe(0);
  });

  it('R-D3-09 — aucune sentinelle d’inconnu n’est produite hors de `priceEur` (EX-DATA-120 non exercée)', () => {
    // Conséquences : la règle « année INCONNUE ⇒ pas de cellule de rang 1 » (EX-DATA-86), l'exclusion
    // de `V_year`/`V_mileage` (EX-DATA-60) et l'affichage `INCONNU` des écrans ne sont jamais exercés.
    const unknown: Record<string, number> = {};
    const numeric: Array<[string, ArrayLike<number>]> = [
      ['mileageKm', batch.mileageKm],
      ['modelYear', batch.modelYear],
      ['powerKw', batch.powerKw],
      ['firstRegistrationYearMonth', batch.firstRegistrationYearMonth],
    ];
    for (const [name, col] of numeric) {
      let c = 0;
      for (let i = 0; i < batch.rowCount; i += 1) if (col[i] === NUMERIC_UNKNOWN) c += 1;
      if (c > 0) unknown[name] = c;
    }
    for (const { name, view } of views(batch)) {
      if (!(view instanceof Uint8Array) || name === 'listingId' || name === 'stringBlob') continue;
      let c = 0;
      for (let i = 0; i < view.length; i += 1) if (view[i] === ENUM_UNKNOWN_BYTE) c += 1;
      if (c > 0) unknown[name] = c;
    }
    console.log(`[rev-D3] colonnes portant une sentinelle d'inconnu (hors priceEur) : ${JSON.stringify(unknown)}`);
    expect(Object.keys(unknown).length).toBeGreaterThan(0);
  });
});

/* ================================================================================================
 * 5. R3 — aucun champ vendeur identifiant (P-1, EX-NFR-26)
 * ============================================================================================== */

describe('D3 — R3 (P-1, EX-NFR-26)', () => {
  it('scanForbiddenFields ne signale rien sur 1 000 annonces reconverties en objets', () => {
    const issues: string[] = [];
    for (let k = 0; k < 1000; k += 1) {
      const row = Math.floor((k * batch.rowCount) / 1000);
      for (const issue of scanForbiddenFields(rowAsObject(batch, row))) issues.push(`${row}:${issue.path}`);
    }
    expect(issues).toEqual([]);
  });

  it('aucun nom de colonne du lot n’est un champ interdit R3', () => {
    const issues = scanForbiddenFields(
      Object.fromEntries(Object.keys(batch).map((k) => [k, 0])) as Record<string, unknown>,
    );
    expect(issues).toEqual([]);
  });

  it('aucune chaîne stockée ne ressemble à une donnée vendeur (URL de contact, e-mail, téléphone)', () => {
    const suspicious: string[] = [];
    for (let k = 0; k < 2000; k += 1) {
      const row = Math.floor((k * batch.rowCount) / 2000);
      for (const s of rowStrings(batch, row)) {
        if (/@|tel:|mailto:|\+32\s?\d/.test(s)) suspicious.push(`${row}:${s}`);
      }
    }
    expect(suspicious).toEqual([]);
  });
});

/* ================================================================================================
 * 6. Cas pathologiques de la phase 2.2 (ADV-04/05/14/16/17) et drapeaux d'ingestion
 * ============================================================================================== */

describe('D3 — cas pathologiques 2.2 exercés (ou non) par le générateur', () => {
  it('R-D3-08 — ADV-14/ARB-59 : aucune annonce `modelId = 0` (« Modèle non identifié ») n’est générée', () => {
    // ARB-59 a créé une route dédiée et l'écran B en mode restreint (EX-SCR-113bis) pour cette clé
    // réservée (EX-DATA-72). Aucun jeu de données ne l'exerce.
    let zero = 0;
    for (let i = 0; i < batch.rowCount; i += 1) if ((batch.modelId[i] as number) === 0) zero += 1;
    console.log(`[rev-D3] annonces modelId = 0 : ${zero}`);
    expect(zero).toBeGreaterThan(0);
  });

  it('R-D3-03 — EX-DATA-19 : les prix injectés sous 250 € ne portent pas `PRICE_SENTINEL_ABSOLUTE`', () => {
    let zeroOrOne = 0;
    let below250 = 0;
    let below250Flagged = 0;
    for (let i = 0; i < batch.rowCount; i += 1) {
      const p = batch.priceEur[i] as number;
      if (p === 0 || p === 1) zeroOrOne += 1;
      if (p !== NUMERIC_UNKNOWN && p < 250) {
        below250 += 1;
        if (((batch.ingestFlags[i] as number) & (1 << BIT_PRICE_SENTINEL_ABSOLUTE)) !== 0) below250Flagged += 1;
      }
    }
    console.log(
      `[rev-D3] prix ∈ {0,1} = ${zeroOrOne} ; prix < 250 € = ${below250} dont drapeautés ` +
        `PRICE_SENTINEL_ABSOLUTE = ${below250Flagged}`,
    );
    expect(below250Flagged).toBe(below250);
  });

  it('R-D3-10 — `ingestFlags` est nul sur 100 % des annonces : aucun drapeau d’ingestion n’est jamais posé', () => {
    // Le README du lot annonce « D3 ne pose que SUSPECT_ZERO_MILEAGE (bit 8) ». La condition
    // (`mileageKm === 0` ET véhicule non neuf) n'est jamais remplie par construction. De même,
    // `priceStatus = MISSING` devrait s'accompagner de `PRICE_MISSING_UNDECLARED` (EX-DATA-18).
    let nonZero = 0;
    for (let i = 0; i < batch.rowCount; i += 1) if ((batch.ingestFlags[i] as number) !== 0) nonZero += 1;
    let zeroKm = 0;
    for (let i = 0; i < batch.rowCount; i += 1) if ((batch.mileageKm[i] as number) === 0) zeroKm += 1;
    console.log(`[rev-D3] ingestFlags ≠ 0 sur ${nonZero} annonces ; mileageKm = 0 sur ${zeroKm} annonces`);
    expect(nonZero).toBeGreaterThan(0);
  });

  it('ADV-05 — aucun doublon d’identifiant ni d’annonce identique (cohérent avec un lot post-ingestion)', () => {
    const ids = new Set<string>();
    let idDup = 0;
    for (let i = 0; i < batch.rowCount; i += 1) {
      const hex = uuidToHex(batch.listingId, i * 16);
      if (ids.has(hex)) idDup += 1;
      else ids.add(hex);
    }
    console.log(`[rev-D3] doublons de listingId = ${idDup}`);
    expect(idDup).toBe(0);
  });

  it('R-D3-13 — ADV-17 : aucun champ de version long (> 40 car.) n’est produit ; la troncature à 80 n’est jamais exercée', () => {
    let maxRaw = 0;
    let maxClean = 0;
    for (let k = 0; k < 5000; k += 1) {
      const row = Math.floor((k * batch.rowCount) / 5000);
      const [, raw, clean] = rowStrings(batch, row);
      maxRaw = Math.max(maxRaw, (raw as string).length);
      maxClean = Math.max(maxClean, (clean as string).length);
    }
    console.log(`[rev-D3] longueur max modelVersionRaw = ${maxRaw} ; modelVersionClean = ${maxClean}`);
    expect(maxClean).toBeGreaterThan(40);
  });
});

/* ================================================================================================
 * 7. Contrat `DataProvider` et garde-fous d'ARCHITECTURE §9.3 (mesurés à 100 000 annonces)
 * ============================================================================================== */

describe('D3 — contrat DataProvider et garde-fous EX-NFR-9 (ARCHITECTURE §9.3)', () => {
  it('R-D3-01 — garde-fou 1 : `fetchBaselineAggregates` doit renvoyer des agrégats PRÉCALCULÉS', async () => {
    // §9.3 : « `fetchBaselineAggregates` DOIT renvoyer des agrégats précalculés compressés, jamais
    // recalculés au chargement ». Preuve exécutable : deux appels successifs sur le même snapshot
    // rendent le MÊME objet (précalcul mémorisé) et le second ne recalcule rien.
    const handle = await ds.provider.openSnapshot();
    const t0 = performance.now();
    const first = await ds.provider.fetchBaselineAggregates(handle);
    const t1 = performance.now();
    const second = await ds.provider.fetchBaselineAggregates(handle);
    const t2 = performance.now();
    console.log(
      `[rev-D3] fetchBaselineAggregates : appel 1 = ${(t1 - t0).toFixed(0)} ms, appel 2 = ${(t2 - t1).toFixed(0)} ms ; ` +
        `${first.rows.length} marques ; identité d'objet = ${String(first.rows === second.rows)}`,
    );
    expect(JSON.stringify(second.rows)).toBe(JSON.stringify(first.rows));
    expect(second.rows).toBe(first.rows);
  }, 120_000);

  it('R-D3-02 — garde-fou 2 : les annonces individuelles ne doivent pas être sur le chemin du 1er affichage', async () => {
    // §9.3 : le budget EX-NFR-9 (2 000 ms en 4G) est consommé à ~1 800 ms par le transfert
    // (taxonomie + agrégats + bundle) ; la marge de calcul local est d'environ 200 ms.
    // Ici `openSnapshot()` GÉNÈRE les 100 000 annonces (matière du mode 2) avant de servir le mode 1.
    // `ds.openMs` est la durée mesurée de la génération n° 1 (aucune génération supplémentaire ici).
    const handle = await ds.provider.openSnapshot();
    const t1 = performance.now();
    await ds.provider.fetchBaselineAggregates(handle);
    const baselineMs = performance.now() - t1;
    const firstDisplayMs = ds.openMs + baselineMs;
    console.log(
      `[rev-D3] chemin de 1er affichage : openSnapshot = ${ds.openMs.toFixed(0)} ms, ` +
        `fetchBaselineAggregates = ${baselineMs.toFixed(0)} ms, total = ${firstDisplayMs.toFixed(0)} ms ` +
        `(marge locale EX-NFR-9 ≈ 200 ms)`,
    );
    expect(firstDisplayMs).toBeLessThanOrEqual(200);
  }, 180_000);

  it('R-D3-04 — EX-DATA-60 : les agrégats de prix servis n’excluent pas `PRICE_SENTINEL_ABSOLUTE`', async () => {
    // EX-DATA-60 : une annonce est exclue de `V_price` si `ingestFlags ∋ PRICE_SENTINEL_ABSOLUTE`
    // (prix < 250 €, EX-DATA-19). Les agrégats de base alimentent l'écran A par défaut
    // (`DataController.loadMarket` sur sélection vide) : `min` y devient le prix d'un outlier injecté.
    const handle = await ds.provider.openSnapshot();
    const baseline = await ds.provider.fetchBaselineAggregates(handle);
    const badMin = baseline.rows.filter((r) => r.price.min !== null && r.price.min < 250);
    const badP05 = baseline.rows.filter((r) => r.price.p05 !== null && r.price.p05 < 250);
    console.log(
      `[rev-D3] agrégats de base : ${baseline.rows.length} marques ; min < 250 € sur ${badMin.length} marques ; ` +
        `p05 < 250 € sur ${badP05.length} marques ; exemple = ${JSON.stringify(badMin[0]?.price ?? null)}`,
    );
    expect(badMin.length).toBe(0);
  }, 120_000);

  it('EX-DATA-104 (I1) — les agrégats de base somment à l’effectif du snapshot', async () => {
    const handle = await ds.provider.openSnapshot();
    const baseline = await ds.provider.fetchBaselineAggregates(handle);
    const total = baseline.rows.reduce((a, r) => a + r.listingCount, 0);
    expect(total).toBe(batch.rowCount);
    expect(baseline.selectionCount).toBe(batch.rowCount);
    // Ordre total (EX-DATA-118) : effectif décroissant puis makeId croissant.
    for (let i = 1; i < baseline.rows.length; i += 1) {
      const a = baseline.rows[i - 1] as { listingCount: number; makeId: number };
      const b = baseline.rows[i] as { listingCount: number; makeId: number };
      expect(a.listingCount > b.listingCount || (a.listingCount === b.listingCount && a.makeId < b.makeId)).toBe(true);
    }
  }, 120_000);
});
