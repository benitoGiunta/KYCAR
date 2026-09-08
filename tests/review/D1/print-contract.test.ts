/**
 * Revue D1 — sonde EX-NFR-31 : le contrat de classes `@media print` documenté en tête de
 * `src/styles/print.css` est effectivement implémenté. Extrait la liste des classes citées dans
 * le commentaire d'en-tête (`.classe`), puis vérifie que chacune apparaît dans une règle réelle du
 * bloc `@media print`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PRINT_CSS_PATH = resolve(__dirname, '../../../src/styles/print.css');
const css = readFileSync(PRINT_CSS_PATH, 'utf8');

// Sépare le commentaire d'en-tête (avant la première accolade `@media print {`) du reste.
const mediaPrintStart = css.indexOf('@media print');
const headerComment = css.slice(0, mediaPrintStart);

// Isole le CONTENU du bloc `@media print { ... }` par comptage d'accolades (robuste aux règles
// imbriquées), puis tout ce qui vient APRÈS ce bloc (les règles hors impression, ex. le `display:
// none` par défaut de `.print-filter-summary`).
function extractBracedBlock(source: string, openBraceSearchFrom: number): { inner: string; afterEnd: number } {
  const openIndex = source.indexOf('{', openBraceSearchFrom);
  let depth = 0;
  let i = openIndex;
  for (; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  return { inner: source.slice(openIndex + 1, i), afterEnd: i + 1 };
}

const { inner: body, afterEnd } = extractBracedBlock(css, mediaPrintStart);
const afterMediaPrint = css.slice(afterEnd);

// Classes citées dans la section "CONTRACT FOR D5-D8" du commentaire d'en-tête.
const classNamesInHeader = Array.from(
  new Set(Array.from(headerComment.matchAll(/`\.([a-zA-Z0-9-]+)`/g)).map((m) => m[1])),
);

describe('EX-NFR-31 — contrat de classes print.css', () => {
  it('le commentaire d’en-tête cite au moins une classe (sonde non vide)', () => {
    expect(classNamesInHeader.length).toBeGreaterThan(0);
  });

  for (const className of classNamesInHeader) {
    it(`.${className} citée dans le contrat a une règle réelle dans le bloc @media print`, () => {
      // La classe doit apparaître comme sélecteur (précédée de "." et suivie d'un séparateur de
      // sélecteur ou d'un espace/accolade), à l'intérieur du bloc @media print effectif.
      const selectorRe = new RegExp(`\\.${className}(?=[\\s,{:.]|$)`);
      expect(selectorRe.test(body)).toBe(true);
    });
  }

  it('.app-header/.filter-bar/.summary-bar perdent leur position fixe/collante à l’impression', () => {
    const rule = /\.app-header,\s*\.filter-bar,\s*\.summary-bar\s*\{[^}]*position:\s*static/s;
    expect(rule.test(body)).toBe(true);
  });

  it('.status-banner/.summary-bar-c3 restent imprimés (display bloc forcé)', () => {
    const rule = /\.status-banner,\s*\.summary-bar-c3\s*\{[^}]*display:\s*block/s;
    expect(rule.test(body)).toBe(true);
  });

  it('.print-filter-summary est masqué à l’écran, montré à l’impression', () => {
    const shownInPrint = /\.print-filter-summary\s*\{[^}]*display:\s*block/s.test(body);
    const hiddenOnScreen = /\.print-filter-summary\s*\{\s*display:\s*none/.test(afterMediaPrint);
    expect(shownInPrint).toBe(true);
    expect(hiddenOnScreen).toBe(true);
  });

  it('tout contrôle interactif et .no-print sont masqués à l’impression', () => {
    const rule = /button,[\s\S]*?\.no-print\s*\{[^}]*display:\s*none/;
    expect(rule.test(body)).toBe(true);
  });
});
