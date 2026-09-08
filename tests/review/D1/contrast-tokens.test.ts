/**
 * Revue D1 — sonde EX-NFR-13 : recalcule la luminance relative WCAG pour chaque paire de couleurs
 * de `src/styles/tokens.css` et vérifie (a) que le ratio annoncé en commentaire est exact, et (b)
 * que chaque paire dépasse le seuil requis (4.5:1 texte normal, 3:1 texte large / élément
 * graphique). Un ratio annoncé faux est un constat, peu importe qu'il reste au-dessus du seuil.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TOKENS_CSS_PATH = resolve(__dirname, '../../../src/styles/tokens.css');
const css = readFileSync(TOKENS_CSS_PATH, 'utf8');

function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexA);
  const lumB = relativeLuminance(hexB);
  const [hi, lo] = lumA > lumB ? [lumA, lumB] : [lumB, lumA];
  return (hi + 0.05) / (lo + 0.05);
}

function extractHex(varName: string): string {
  const re = new RegExp(`${varName}:\\s*(#[0-9a-fA-F]{6})`);
  const match = re.exec(css);
  if (!match?.[1]) throw new Error(`token ${varName} introuvable dans tokens.css`);
  return match[1];
}

const bg = extractHex('--color-bg');

// Chaque entrée reprend le ratio annoncé en commentaire dans tokens.css et le seuil applicable
// d'après l'usage documenté (texte normal 4.5:1 ; graphique/texte large 3:1).
const pairs: Array<{
  label: string;
  fg: string;
  bg: string;
  announced: number;
  threshold: number;
}> = [
  { label: '--color-text sur --color-bg', fg: extractHex('--color-text'), bg, announced: 17.96, threshold: 4.5 },
  { label: '--color-text-muted sur --color-bg', fg: extractHex('--color-text-muted'), bg, announced: 7.53, threshold: 4.5 },
  { label: '--color-primary sur --color-bg', fg: extractHex('--color-primary'), bg, announced: 5.80, threshold: 4.5 },
  { label: '--color-danger sur --color-bg', fg: extractHex('--color-danger'), bg, announced: 6.54, threshold: 3 },
  { label: '--color-success sur --color-bg', fg: extractHex('--color-success'), bg, announced: 5.33, threshold: 3 },
  { label: '--color-accent sur --color-bg', fg: extractHex('--color-accent'), bg, announced: 6.89, threshold: 3 },
  { label: '--color-border sur --color-bg', fg: extractHex('--color-border'), bg, announced: 5.98, threshold: 3 },
  { label: '--color-focus-ring sur --color-text', fg: extractHex('--color-focus-ring'), bg: extractHex('--color-text'), announced: 12.72, threshold: 3 },
];

describe('EX-NFR-13 — contraste WCAG des paires de tokens.css', () => {
  for (const pair of pairs) {
    it(`${pair.label} : ratio annoncé (${pair.announced}) exact à 0.01 près et ≥ ${pair.threshold}:1`, () => {
      const computed = contrastRatio(pair.fg, pair.bg);
      expect(computed).toBeGreaterThanOrEqual(pair.threshold);
      expect(Math.abs(computed - pair.announced)).toBeLessThanOrEqual(0.01);
    });
  }
});
