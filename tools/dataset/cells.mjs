/**
 * KYCAR - Statistiques de cellule d'homogeneite, REPLIQUEES du moteur (DR3-08, DR3-09)
 * =================================================================================================
 * POURQUOI CE MODULE EXISTE.
 *
 * `A-10` (M1) et `A-11` (M2) promettent un RAPPEL : « au moins 90 % des M1 injectes sont signales »,
 * « au moins 85 % des M2 ». La revue 3.3 a mesure 36 % et 51 % (constats DR3-08 et DR3-09). Les deux
 * causes sont de meme nature : le generateur choisissait la valeur injectee sur une echelle
 * ABSOLUE (« jamais sous 250 EUR », « facteur 0,30 a 0,50 ») alors que les deux detecteurs
 * raisonnent sur une echelle RELATIVE A LA CELLULE :
 *
 *   - M1 (`EX-DATA-88`) pose ses barrieres de Tukey sur `ln(prix)` dans la cellule, APRES avoir
 *     retire de `V_price(C)` tout prix inferieur a `0,10 x medianeRef(C)` (`EX-DATA-19(2)`). Une
 *     valeur a 300 EUR dans une cellule a 15 950 EUR de mediane tombe sous 1 595 EUR : elle sort de
 *     l'ensemble et n'est JAMAIS evaluee. Le plancher a 250 EUR de la specification ne protegeait
 *     de rien.
 *   - M2 (`EX-DATA-90/92`) mesure un ecart robuste `z = (r - m_r) / s` ou `s = 1,4826 x MAD` des
 *     residus d'une regression `ln(prix) ~ annee + km/10000` DANS la cellule `(marque, modele)`.
 *     Les facteurs d'`A-11` etaient calibres sur `sigma_p = 0,20`, qui est le residu du MODELE DE
 *     PRIX du generateur : il ne contient ni la variance de carburant, ni celle de puissance, ni
 *     celle du type de vendeur, toutes presentes dans la cellule. `s` mesure y est bien plus grand,
 *     et un facteur 2,0 ne franchit pas `|z| >= 2,5`.
 *
 * CE QUE CE MODULE FAIT. Il rejoue, sur les prix PLAUSIBLES du premier snapshot, exactement le
 * calcul de `src/engine/outliers.ts` : `buildCellSample` (mediane de reference, seuil relatif,
 * barrieres de Tukey) et `fitM2` (OLS ridge + Cholesky, MAD, passe de trimming a |z| < 3,5). Le
 * generateur peut alors choisir une valeur injectee dont il SAIT qu'elle sera signalee.
 *
 * POURQUOI LES STATISTIQUES SONT GELEES AU PREMIER SNAPSHOT. Si la valeur injectee dependait de la
 * composition du snapshot courant, elle bougerait d'un snapshot a l'autre pour une annonce non
 * revisee : `P-68` compterait ces mouvements comme des revisions de prix. Les statistiques sont donc
 * mesurees UNE FOIS sur S0 et gelees, exactement comme le calibrage de completude (`R-43`).
 *
 * HYPOTHESE ECRITE (E4) HG-06. Les cellules sont batiees sur le prix plausible de TOUTES les
 * annonces du snapshot, alors que le moteur ne voit que `V_price` (96,4 % : les annonces a prix sur
 * demande, absent, sentinelle ou hors bornes en sont retirees). L'ecart porte sur moins de 4 % de
 * l'effectif et ne deplace pas une mediane de cellule de plus de quelques dixiemes de pourcent ; les
 * marges retenues ci-dessous (facteur 0,7 sur la barriere basse, k = 3,4 contre un seuil a 2,5) le
 * couvrent d'un ordre de grandeur. La preuve est la sonde : `P-75` et `P-76` mesurent le rappel REEL
 * sur la sortie du moteur, pas sur ce calcul.
 */

const TUKEY_K = 1.5;
const MIN_M1 = 12;
const MIN_M2 = 30;
const MAD_FACTOR = 1.4826;
const M2_TRIM = 3.5;
const M2_SPREAD_EPS = 1e-9;
const IMPLAUSIBLE_RATIO = 0.1;

/** Quantile de type 7 sur un tableau DEJA trie (identique a `quantileFromSorted` du moteur). */
function quantile(sorted, p) {
  const n = sorted.length;
  if (n === 0) return NaN;
  if (n === 1) return sorted[0];
  const h = (n - 1) * p;
  const lo = Math.floor(h);
  const hi = Math.min(lo + 1, n - 1);
  return sorted[lo] + (h - lo) * (sorted[hi] - sorted[lo]);
}

const median = (values) => quantile(Float64Array.from(values).sort(), 0.5);

/**
 * Echantillon d'une cellule : seuil relatif d'`EX-DATA-19(2)`, mediane et barrieres de Tukey sur
 * `ln(prix)` calculees APRES retrait des prix implausibles. Replique `buildCellSample`.
 */
export function cellSample(prices) {
  if (prices === undefined || prices.length === 0) {
    return { threshold: null, n: 0, median: null, lowFence: null, highFence: null, iqr: 0 };
  }
  const sorted = Float64Array.from(prices).sort();
  const medAll = quantile(sorted, 0.5);
  const threshold = sorted.length < MIN_M1 ? null : IMPLAUSIBLE_RATIO * medAll;
  let start = 0;
  if (threshold !== null) while (start < sorted.length && sorted[start] < threshold) start += 1;
  const kept = sorted.subarray(start);
  if (kept.length === 0) return { threshold, n: 0, median: null, lowFence: null, highFence: null, iqr: 0 };
  const keptMedian = quantile(kept, 0.5);
  if (kept.length < MIN_M1) {
    return { threshold, n: kept.length, median: keptMedian, lowFence: null, highFence: null, iqr: 0 };
  }
  const ln = new Float64Array(kept.length);
  for (let i = 0; i < kept.length; i += 1) ln[i] = Math.log(kept[i]);
  const q1 = quantile(ln, 0.25);
  const q3 = quantile(ln, 0.75);
  const iqr = q3 - q1;
  return {
    threshold,
    n: kept.length,
    median: keptMedian,
    lowFence: Math.exp(q1 - TUKEY_K * iqr),
    highFence: Math.exp(q3 + TUKEY_K * iqr),
    iqr,
  };
}

/** Resolution de Cholesky d'un systeme symetrique defini positif (replique du moteur). */
function choleskySolve(a, b, k) {
  const l = Array.from({ length: k }, () => new Array(k).fill(0));
  for (let i = 0; i < k; i += 1) {
    for (let j = 0; j <= i; j += 1) {
      let sum = a[i][j];
      for (let m = 0; m < j; m += 1) sum -= l[i][m] * l[j][m];
      if (i === j) {
        if (sum <= 0) return null;
        l[i][i] = Math.sqrt(sum);
      } else {
        l[i][j] = sum / l[j][j];
      }
    }
  }
  const y = new Array(k).fill(0);
  for (let i = 0; i < k; i += 1) {
    let sum = b[i];
    for (let m = 0; m < i; m += 1) sum -= l[i][m] * y[m];
    y[i] = sum / l[i][i];
  }
  const x = new Array(k).fill(0);
  for (let i = k - 1; i >= 0; i -= 1) {
    let sum = y[i];
    for (let m = i + 1; m < k; m += 1) sum -= l[m][i] * x[m];
    x[i] = sum / l[i][i];
  }
  return x;
}

/**
 * Ajustement M2 d'une cellule : replique `fitM2` de `src/engine/outliers.ts`.
 * @param points {{ key:any, price:number, year:number, mileage:number }[]} points d'ajustement `F`
 * @returns {{ ok:boolean, s:number, mr:number, expected:Map<any,number> }}
 */
export function fitM2(points) {
  const empty = { ok: false, s: 0, mr: 0, expected: new Map() };
  const nF = points.length;
  if (nF < MIN_M2) return empty;

  const y = points.map((p) => Math.log(p.price));
  const medY = median(y);
  const spreadY = median(y.map((v) => Math.abs(v - medY)));
  if (spreadY <= M2_SPREAD_EPS * Math.max(1, Math.abs(medY))) return empty;

  const meanYear = points.reduce((a, p) => a + p.year, 0) / nF;
  const x1 = points.map((p) => p.year - meanYear);
  const x2 = points.map((p) => p.mileage / 10000);
  const keepX1 = Math.max(...x1) !== Math.min(...x1);
  const keepX2 = Math.max(...x2) !== Math.min(...x2);
  if (!keepX1 && !keepX2) return empty;

  const cols = [new Array(nF).fill(1)];
  if (keepX1) cols.push(x1);
  if (keepX2) cols.push(x2);
  const k = cols.length;

  const fit = (idx) => {
    const xtx = Array.from({ length: k }, () => new Array(k).fill(0));
    const xty = new Array(k).fill(0);
    for (const p of idx) {
      for (let i = 0; i < k; i += 1) {
        const ci = cols[i][p];
        xty[i] += ci * y[p];
        for (let j = i; j < k; j += 1) xtx[i][j] += ci * cols[j][p];
      }
    }
    for (let i = 0; i < k; i += 1) for (let j = 0; j < i; j += 1) xtx[i][j] = xtx[j][i];
    let trace = 0;
    for (let i = 0; i < k; i += 1) trace += xtx[i][i];
    const lambda = (1e-9 * trace) / 3;
    for (let i = 0; i < k; i += 1) xtx[i][i] += lambda;
    return choleskySolve(xtx, xty, k);
  };
  const predict = (beta, p) => {
    let yh = 0;
    for (let i = 0; i < k; i += 1) yh += beta[i] * cols[i][p];
    return yh;
  };

  const all = Array.from({ length: nF }, (_v, i) => i);
  const beta1 = fit(all);
  if (beta1 === null) return empty;
  const robust = (beta) => {
    const r = all.map((p) => y[p] - predict(beta, p));
    const mr = median(r);
    const mad = median(r.map((ri) => Math.abs(ri - mr)));
    const s = MAD_FACTOR * mad;
    const z = s > 0 ? r.map((ri) => (ri - mr) / s) : r.map(() => 0);
    return { mr, s, z };
  };
  let pass = robust(beta1);
  let betaUsed = beta1;
  const fPrime = all.filter((p) => Math.abs(pass.z[p]) < M2_TRIM);
  if (fPrime.length >= MIN_M2) {
    const beta2 = fit(fPrime);
    if (beta2 !== null) {
      betaUsed = beta2;
      pass = robust(beta2);
    }
  }
  if (pass.s <= M2_SPREAD_EPS * Math.max(1, Math.abs(median(y)))) return empty;

  // Prix attendu pour un couple (annee, km) QUELCONQUE, avec les coefficients de la passe 2 et le
  // recentrage `m_r` : c'est la meme formule que `expectedByRow` du moteur, mais applicable a une
  // annonce ENTRANTE, qui ne figurait pas dans l'ajustement gele du premier snapshot.
  const expectedFor = (year, mileage) => {
    let yh = betaUsed[0];
    let at = 1;
    if (keepX1) yh += betaUsed[at++] * (year - meanYear);
    if (keepX2) yh += betaUsed[at] * (mileage / 10000);
    return Math.exp(yh + pass.mr);
  };
  return { ok: true, s: pass.s, mr: pass.mr, expectedFor };
}

/**
 * Statistiques GELEES du premier snapshot : cellules `C1 = (marque, modele, annee)`,
 * `C2 = (marque, modele)`, `C3 = Sigma`, et l'ajustement M2 de chaque `C2` eligible.
 *
 * @param listings occupants du premier snapshot (prix plausible dans `basePrice`)
 */
export function freezeCellStats(listings) {
  const c1 = new Map();
  const c2 = new Map();
  const c3 = [];
  const f2 = new Map();
  for (const l of listings) {
    const price = l.basePrice;
    if (!Number.isFinite(price) || price <= 0) continue;
    c3.push(price);
    const k2 = `${l.makeId}|${l.modelId}`;
    const k1 = `${k2}|${l.year}`;
    (c1.get(k1) ?? c1.set(k1, []).get(k1)).push(price);
    (c2.get(k2) ?? c2.set(k2, []).get(k2)).push(price);
    if (Number.isFinite(l.mileage)) {
      const arr = f2.get(k2) ?? f2.set(k2, []).get(k2);
      arr.push({ key: l.rowIndex, price, year: l.year, mileage: l.mileage });
    }
  }
  const sampleC1 = new Map();
  for (const [k, v] of c1) sampleC1.set(k, cellSample(v));
  const sampleC2 = new Map();
  for (const [k, v] of c2) sampleC2.set(k, cellSample(v));
  const sampleC3 = cellSample(c3);
  const fitC2 = new Map();
  for (const [k, pts] of f2) {
    const sample = sampleC2.get(k);
    if (sample === undefined || sample.n < MIN_M2) continue;
    const kept = sample.threshold === null ? pts : pts.filter((p) => p.price >= sample.threshold);
    fitC2.set(k, fitM2(kept));
  }
  return { sampleC1, sampleC2, sampleC3, fitC2 };
}

/**
 * Cellule que M1 RETIENDRA pour cette annonce : premiere de la cascade `C1 -> C2 -> C3` dont
 * l'effectif atteint 12 (`EX-DATA-86`). Rend aussi les cellules candidates, pour que la valeur
 * injectee reste licite meme si le moteur, sur `V_price` reel, n'en retient pas la meme.
 */
export function m1CellFor(stats, listing) {
  if (stats === undefined || stats === null) return { chosen: null, candidates: [] };
  const k2 = `${listing.makeId}|${listing.modelId}`;
  const k1 = `${k2}|${listing.year}`;
  const tagged = [
    { scope: 'MODEL_YEAR', s: stats.sampleC1.get(k1) },
    { scope: 'MODEL', s: stats.sampleC2.get(k2) },
    { scope: 'SELECTION', s: stats.sampleC3 },
  ];
  const candidates = tagged
    .filter((t) => t.s !== undefined && t.s.lowFence !== null)
    .map((t) => ({ ...t.s, scope: t.scope }));
  return { chosen: candidates[0] ?? null, candidates };
}

export const M2_MIN_FIT = MIN_M2;
