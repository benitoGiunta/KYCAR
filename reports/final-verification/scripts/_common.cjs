// Outillage commun des observations navigateur de la phase 2.7 (final-check).
// Chromium préinstallé, aucun téléchargement (E5 : localhost seulement).
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const EXECUTABLE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = process.env.KYCAR_BASE ?? 'http://localhost:4173';
const OUT = path.resolve(__dirname, '..');

async function launch(opts = {}) {
  const browser = await chromium.launch({ executablePath: EXECUTABLE, headless: true });
  const context = await browser.newContext({
    viewport: opts.viewport ?? { width: 1280, height: 800 },
    locale: 'fr-BE',
    timezoneId: 'Europe/Brussels',
    ...(opts.contextOptions ?? {}),
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') consoleErrors.push(`[${m.type()}] ${m.text()}`);
  });
  page.on('pageerror', (e) => consoleErrors.push(`[pageerror] ${e.message}`));
  const requests = [];
  page.on('request', (r) => requests.push(r.url()));
  page.on('response', (r) => {
    if (r.status() >= 400) consoleErrors.push(`[http ${r.status()}] ${r.url()}`);
  });
  return { browser, context, page, consoleErrors, requests };
}

function log(journal, step, data) {
  const entry = { step, at: new Date().toISOString(), ...data };
  journal.push(entry);
  console.log(JSON.stringify(entry));
}

async function text(page, selector) {
  const el = await page.$(selector);
  if (!el) return null;
  return (await el.innerText()).replace(/\s+/g, ' ').trim();
}

async function texts(page, selector, max = 50) {
  const els = await page.$$(selector);
  const out = [];
  for (const el of els.slice(0, max)) out.push((await el.innerText()).replace(/\s+/g, ' ').trim());
  return out;
}

async function shot(page, name, fullPage = false) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage });
  return path.relative(path.resolve(OUT, '..', '..'), file);
}

function save(name, obj) {
  const file = path.join(OUT, 'logs', name);
  fs.writeFileSync(file, JSON.stringify(obj, null, 2));
  return file;
}

/** Temps de premier affichage utile : navigationStart → apparition du sélecteur. */
async function timeToSelector(page, url, selector, timeout = 60000) {
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'commit' });
  await page.waitForSelector(selector, { timeout });
  const wall = Date.now() - t0;
  const perf = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    return {
      sinceNavigationStartMs: Math.round(performance.now()),
      domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
      loadEventMs: nav ? Math.round(nav.loadEventEnd) : null,
      transferBytes: performance.getEntriesByType('resource').reduce((s, r) => s + (r.transferSize || 0), 0) + (nav ? nav.transferSize || 0 : 0),
      resourceCount: performance.getEntriesByType('resource').length,
    };
  });
  return { wallMs: wall, ...perf };
}

module.exports = { launch, log, text, texts, shot, save, timeToSelector, BASE, OUT };
