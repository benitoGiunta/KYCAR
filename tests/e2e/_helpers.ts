/**
 * KYCAR — aides communes de la recette navigateur (phase 2.9a, PLAN-2 §2.9)
 * =================================================================================================
 * Sélecteurs, attentes et lectures de valeurs partagés par les neuf fichiers de la suite. Règle du
 * harnais : on interroge l'application par son RÔLE, son LIBELLÉ ou son TEXTE NORMATIF ; une classe
 * CSS n'est utilisée que lorsqu'elle EST le contrat (les classes d'impression de `src/styles/
 * print.css`, `data-graph` des cadres de graphe, `#kycar-main` du lien d'évitement).
 *
 * Aucune de ces aides ne corrige un écart : `src/` est en lecture seule en 2.9a. Un écart constaté
 * devient un `test.fail()` annoté `CONSTAT E2E-<nn>` et une ligne de
 * `reports/remediation/e2e-harness.md` pour la phase 2.8.
 */
import { expect, type Page, type TestInfo } from '@playwright/test';

/* ================================================================================================
 * Parcours cibles (docs/00-CONTEXT.md) et valeurs attendues (tests/review/D8/parcours.test.ts)
 * ============================================================================================== */

/** Parcours 1 — « budget ≤ 20 000 €, coupé, BE, < 100 000 km » sur le snapshot synthétique. */
export const P1_QUERY = '?body=3&kmto=100000&priceto=20000';
export const P1_EXPECTED = { makes: 112, offers: 2656 } as const;

/** Parcours 2 — Opel Corsa (`54`/`1918`), puis restriction à l'année 2017. */
export const OPEL_MAKE_ID = 54;
export const CORSA_MODEL_ID = 1918;
export const P2_PATH = '/marche/54-opel/1918-corsa';
export const P2_LISTINGS_PATH = '/marche/54-opel/1918-corsa/annonces';
export const P2_YEAR_QUERY = '?fregfrom=2017&fregto=2017';
export const P2_EXPECTED = { corsaTotal: 1352, corsa2017: 54 } as const;

/** Les huit surfaces d'`EX-NFR-16` (A, B, D, C, E, F, G en modale, `/mentions`). */
export const SURFACES = {
  A: '/marche',
  B: `${P2_PATH}${P2_YEAR_QUERY}`,
  D: `${P2_LISTINGS_PATH}${P2_YEAR_QUERY}`,
  C: '/comparer?m=54-1918,54-1916',
  E: '/recherches',
  F: '/suivis',
  mentions: '/mentions',
} as const;

/** Clés `localStorage` du contrat de persistance (`src/persistence`, `EX-CRUD-19`). */
export const LS = {
  saved: 'kycar:saved-searches',
  savedIndex: 'kycar:saved-searches#index',
  followed: 'kycar:followed-models',
  followedIndex: 'kycar:followed-models#index',
  recent: 'kycar:recent-history',
  preferences: 'kycar:preferences',
} as const;

export const CAPS = { saved: 50, followed: 30, recent: 10 } as const;

/* ================================================================================================
 * Régime responsive (EX-NFR-18) déduit du projet Playwright
 * ============================================================================================== */

export type Regime = 'compact' | 'intermediate' | 'large';

/** `EX-NFR-18` — régime attendu pour le projet courant (desktop 1280 / tablet 768 / mobile 360). */
export function regimeOf(testInfo: TestInfo): Regime {
  switch (testInfo.project.name) {
    case 'mobile':
      return 'compact';
    case 'tablet':
      return 'intermediate';
    default:
      return 'large';
  }
}

/* ================================================================================================
 * Nombres et libellés français (EX-SCR-1 : U+202F ; EX-SCR-3 : U+00A0 ; EX-SCR-4 : U+2013)
 * ============================================================================================== */

/** Retire toutes les espaces (ordinaire, insécable, insécable étroite, fine) d'un texte. */
export function stripSpaces(text: string): string {
  return text.replace(/[\s\u00A0\u202F\u2009]/g, '');
}

/** Premier entier lisible dans un texte, séparateurs de milliers français compris. */
export function parseInteger(text: string): number {
  const m = stripSpaces(text).match(/-?\d+/);
  expect(m, `aucun entier dans « ${text} »`).not.toBeNull();
  return Number(m?.[0]);
}

/* ================================================================================================
 * Attentes d'affichage — le premier rendu utile de chaque écran
 * ============================================================================================== */

/** Écran A prêt : la barre de synthèse porte un effectif ET au moins une carte-marque est montée. */
export async function waitForMarket(page: Page): Promise<void> {
  await expect(page.locator('.kycar-market-summary-counts')).toContainText(/offres|offre|aucune/, {
    timeout: 60_000,
  });
  await expect(page.locator('.kycar-market-card').first()).toBeVisible({ timeout: 60_000 });
}

/** Écran B prêt : l'en-tête statistique (`EX-SCR-142`) est monté. */
export async function waitForDistribution(page: Page): Promise<void> {
  await expect(page.locator('.kycar-stat-header')).toBeVisible({ timeout: 60_000 });
}

/** Écran D prêt : l'en-tête d'annonces (`EX-SCR-201`) est monté. */
export async function waitForListings(page: Page): Promise<void> {
  await expect(page.locator('.kycar-listings-head')).toBeVisible({ timeout: 60_000 });
}

/** Navigation directe + attente du premier rendu utile, selon la route visée. */
export async function open(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: 'commit' });
  await waitForRoute(page, path);
}

/** Attente adaptée à la route (l'app est une fonction pure du chemin, `EX-NAV-18`). */
export async function waitForRoute(page: Page, path: string): Promise<void> {
  const bare = path.split('?')[0] ?? '';
  if (bare === '/' || bare === '/marche') return waitForMarket(page);
  if (bare.endsWith('/annonces')) return waitForListings(page);
  if (/^\/marche\/\d+-/.test(bare)) return waitForDistribution(page);
  await expect(page.locator('#kycar-main h1').first()).toBeVisible({ timeout: 60_000 });
}

/* ================================================================================================
 * Lectures de valeurs affichées
 * ============================================================================================== */

export interface MarketSummary {
  readonly makes: number;
  /** `EX-SCR-135` — cardinal « modèles » absent en régime compact. */
  readonly models: number | null;
  readonly offers: number;
  readonly displayed: number | null;
  readonly raw: string;
}

/** `EX-SCR-106` — lit `<n> marques · <n> modèles · <n> offres [— <n> marques affichées]`. */
export async function readMarketSummary(page: Page): Promise<MarketSummary> {
  const raw = await page.locator('.kycar-market-summary-counts').innerText();
  const flat = stripSpaces(raw);
  const makes = Number(/(\d+)marques?/.exec(flat)?.[1] ?? NaN);
  const modelsMatch = /(\d+)modèles?/.exec(flat);
  const offers = Number(/(\d+)offres?/.exec(flat)?.[1] ?? NaN);
  const displayed = /(\d+)marquesaffichées/.exec(flat);
  return {
    makes,
    models: modelsMatch ? Number(modelsMatch[1]) : null,
    offers,
    displayed: displayed ? Number(displayed[1]) : null,
    raw,
  };
}

/** `EX-SCR-142` — effectif Σ de l'en-tête de l'écran B (« <n> offres »). */
export async function readSelectionCount(page: Page): Promise<number> {
  const text = await page.locator('.kycar-stat-header .kycar-stat-line').first().innerText();
  const m = stripSpaces(text).match(/(\d+)offres?/);
  expect(m, `effectif introuvable dans « ${text} »`).not.toBeNull();
  return Number(m?.[1]);
}

/** Effectifs des cartes-marques montées, dans l'ordre d'affichage (`EX-SCR-107`). */
export async function readCardCounts(page: Page): Promise<number[]> {
  const texts = await page.locator('.kycar-market-card-count').allInnerTexts();
  return texts.map((t) => parseInteger(t));
}

/** Noms des marques affichées, dans l'ordre de la grille. */
export async function readCardTitles(page: Page): Promise<string[]> {
  return (await page.locator('.kycar-market-card-title').allInnerTexts()).map((t) => t.trim());
}

/* ================================================================================================
 * Canvas — le nuage G4 est peint, pas décrit par le DOM
 * ============================================================================================== */

export interface CanvasInk {
  readonly width: number;
  readonly height: number;
  /** Pixels dont l'alpha n'est pas nul : 0 = canvas totalement vierge. */
  readonly inked: number;
}

/** Lit la quantité d'encre réellement posée sur un canvas (`EX-SCR-151`..`160`). */
export async function readCanvasInk(page: Page, selector: string): Promise<CanvasInk> {
  return page.evaluate((sel) => {
    const canvas = document.querySelector(sel) as HTMLCanvasElement | null;
    if (canvas === null) return { width: 0, height: 0, inked: -1 };
    const ctx = canvas.getContext('2d');
    if (ctx === null) return { width: canvas.width, height: canvas.height, inked: -1 };
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let inked = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] !== 0) inked += 1;
    return { width: canvas.width, height: canvas.height, inked };
  }, selector);
}

/**
 * Brossage du nuage G4 : glisser-déposer RÉEL à la souris à l'intérieur du canvas (`EX-SCR-158`).
 * Le canvas est plus bas que le pli sur toutes les tailles d'écran : il faut le faire défiler dans la
 * vue ET borner le rectangle glissé à la fois au canvas et au viewport, faute de quoi le `mouseup`
 * tombe hors de l'élément et le geste n'est jamais interprété.
 */
export async function brushScatter(page: Page, graphId = 'G4'): Promise<void> {
  const canvas = page.locator(`[data-graph="${graphId}"] canvas`);
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  expect(box, `canvas ${graphId} absent ou invisible`).not.toBeNull();
  if (box === null) return;
  const viewport = page.viewportSize() ?? { width: 1280, height: 800 };

  const x0 = box.x + box.width * 0.15;
  const y0 = box.y + box.height * 0.2;
  const x1 = Math.min(box.x + box.width * 0.75, viewport.width - 8);
  const y1 = Math.min(box.y + box.height * 0.75, viewport.height - 8);
  // Le geste doit dépasser 4 px sur les DEUX axes, sinon il est lu comme un clic simple.
  expect(x1 - x0, 'rectangle de brossage trop étroit').toBeGreaterThan(8);
  expect(y1 - y0, 'rectangle de brossage trop plat').toBeGreaterThan(8);

  await page.mouse.move(x0, y0);
  await page.mouse.down();
  await page.mouse.move(x1, y1, { steps: 12 });
  await page.mouse.up();
}

/* ================================================================================================
 * Focus, clavier
 * ============================================================================================== */

/** Description compacte de l'élément focalisé (tag, classe, libellé accessible approximatif). */
export async function focusDescription(page: Page): Promise<string> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (el === null) return 'null';
    const label = el.getAttribute('aria-label') ?? (el.textContent ?? '').trim().slice(0, 60);
    return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${el.className ? `.${String(el.className).split(/\s+/)[0]}` : ''}|${label}`;
  });
}

/**
 * Ramène le focus au tout début du document, comme le fait un `Tab` depuis la barre d'adresse : la
 * coquille place le focus dans `#kycar-main` après chaque navigation (`EX-NFR-12`), il faut donc
 * défocaliser pour vérifier que le lien d'évitement est bien le PREMIER arrêt de tabulation.
 */
export async function resetFocusToDocumentStart(page: Page): Promise<void> {
  await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (el !== null && typeof el.blur === 'function') el.blur();
  });
}

/** Enchaîne `n` tabulations et retourne la description du focus après chacune. */
export async function tabSequence(page: Page, n: number): Promise<string[]> {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    await page.keyboard.press('Tab');
    out.push(await focusDescription(page));
  }
  return out;
}

/* ================================================================================================
 * Persistance — préparation d'un état localStorage avant chargement
 * ============================================================================================== */

/** Injecte des paires clé/valeur dans `localStorage` AVANT tout chargement de l'application. */
export async function seedLocalStorage(page: Page, entries: Record<string, string>): Promise<void> {
  await page.addInitScript((payload: Record<string, string>) => {
    for (const [k, v] of Object.entries(payload)) window.localStorage.setItem(k, v);
  }, entries);
}

/** Lit l'intégralité de `localStorage` de la page. */
export async function dumpLocalStorage(page: Page): Promise<Record<string, string>> {
  return page.evaluate(() => {
    const out: Record<string, string> = {};
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k !== null) out[k] = window.localStorage.getItem(k) ?? '';
    }
    return out;
  });
}

/** Fabrique `n` recherches enregistrées valides + leur index (format par entrée, `EX-CRUD-19`). */
export function seedSavedSearches(n: number): Record<string, string> {
  const ids: string[] = [];
  const out: Record<string, string> = {};
  const now = new Date().toISOString();
  for (let i = 0; i < n; i += 1) {
    const id = `seed-${String(i).padStart(3, '0')}`;
    ids.push(id);
    out[`${LS.saved}/${id}`] = JSON.stringify({
      schemaVersion: 1,
      id,
      nom: `Recherche ${i}`,
      url: `/marche?priceto=${10000 + i}`,
      mode: 1,
      creeeLe: now,
      dernierAccesLe: now,
      effectifInitial: 1,
      snapshotInitial: 'seed',
    });
  }
  out[LS.savedIndex] = JSON.stringify(ids);
  return out;
}

/** Fabrique `n` modèles suivis valides + leur index (les `n` premiers modèles d'Opel). */
export function seedFollowedModels(n: number): Record<string, string> {
  const ids: string[] = [];
  const out: Record<string, string> = {};
  const now = new Date().toISOString();
  for (let i = 0; i < n; i += 1) {
    const id = `${OPEL_MAKE_ID}:${1915 + i}`;
    ids.push(id);
    out[`${LS.followed}/${id}`] = JSON.stringify({
      schemaVersion: 1,
      makeId: OPEL_MAKE_ID,
      modelId: 1915 + i,
      suiviLe: now,
    });
  }
  out[LS.followedIndex] = JSON.stringify(ids);
  return out;
}

/* ================================================================================================
 * Constats — un écart n'est jamais corrigé ici, il est nommé
 * ============================================================================================== */

/**
 * Annote le test courant d'un constat de recette. À utiliser SYSTÉMATIQUEMENT avec `test.fail()` :
 * la sonde reste rouge tant que l'écart n'est pas corrigé en 2.8, et l'annotation porte l'exigence.
 */
export function constat(
  testInfo: TestInfo,
  id: string,
  exigence: string,
  ecart: string,
): void {
  testInfo.annotations.push({
    type: 'CONSTAT',
    description: `${id} — ${exigence} — ${ecart}`,
  });
}

/** Journalise une MESURE (perf, axe) dans la sortie du test et dans ses annotations. */
export function mesure(testInfo: TestInfo, label: string, value: string): void {
  testInfo.annotations.push({ type: 'MESURE', description: `${label} : ${value}` });
  console.log(`[MESURE] ${label} : ${value}`);
}
