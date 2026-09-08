import { existsSync, readdirSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

/**
 * KYCAR — recette navigateur (phase 2.9, PLAN-2 §2.9).
 *
 * Playwright + Chromium PRÉINSTALLÉ (`/opt/pw-browsers/chromium-<build>/chrome-linux/chrome`) : la
 * version du paquet `@playwright/test` peut différer du build de navigateur disponible, on passe donc
 * `executablePath` explicitement (variable `KYCAR_CHROMIUM` prioritaire, sinon détection). Aucun
 * téléchargement de navigateur (`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` dans l'environnement).
 *
 * Le serveur testé est le BUILD DE PRODUCTION (`vite preview`, port 4180) : c'est l'artefact livré qui
 * est recetté, pas le serveur de développement. Les référentiels sont servis depuis `dist/reference/`.
 */
function detectChromium(): string | undefined {
  if (process.env.KYCAR_CHROMIUM && existsSync(process.env.KYCAR_CHROMIUM)) return process.env.KYCAR_CHROMIUM;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers';
  if (!existsSync(root)) return undefined;
  const dir = readdirSync(root)
    .filter((n) => /^chromium-\d+$/.test(n))
    .sort()
    .pop();
  if (!dir) return undefined;
  const bin = `${root}/${dir}/chrome-linux/chrome`;
  return existsSync(bin) ? bin : undefined;
}

const executablePath = detectChromium();
const PORT = Number(process.env.KYCAR_E2E_PORT ?? 4180);

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'reports/e2e/results.json' }]],
  outputDir: 'test-results',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'fr-BE',
    timezoneId: 'Europe/Brussels',
    launchOptions: executablePath ? { executablePath } : {},
  },
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: true,
    timeout: 180_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'tablet', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } } },
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true } },
  ],
});
