/**
 * Sonde de revue D5 — décision D3-46 (v0.1.1, retour de test du commanditaire sur le bandeau).
 * =================================================================================================
 * `FilterBand` et la coquille utilisent des hooks : indémontables dans l'environnement `node` des
 * sondes (`vitest.review.config.ts`). Comme `shell-static.test.ts` et `screen-g-mode2-position.test.ts`,
 * cette sonde lit donc le SOURCE pour le câblage, et exerce la logique pure (`src/state/draft.ts`,
 * `InteractionController.applyDraft`) pour le comportement. Le comportement rendu est éprouvé dans
 * le navigateur par `tests/e2e/filtres-d3-46.spec.ts`.
 *
 * Écrite ROUGE contre v0.1.0 (`c4151e3`) : `src/state/draft.ts` et `applyDraft` n'existaient pas,
 * `FilterBand` appelait `scheduleChange` à chaque frappe, la coquille clé-ait le bandeau sur la
 * requête, l'en-tête était `position: sticky`, la ligne primaire `overflow-x: auto`.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isDraftDirty, planDraftApply, rebaseDraft, withDraftValue } from '../../../src/state/draft';
import { InteractionController } from '../../../src/state/interaction';

const read = (rel: string): string => readFileSync(resolve(process.cwd(), rel), 'utf8');
const band = read('src/components/filters/FilterBand.tsx');
const bandCss = read('src/components/filters/filter-band.css');
const appCss = read('src/app/app.css');
const app = read('src/app.tsx');
const range = read('src/components/filters/controls/RangeControl.tsx');

/** Corps d'une règle CSS dont le sélecteur est exactement `selector` (première occurrence). */
function ruleBody(css: string, selector: string): string {
  const i = css.indexOf(`${selector} {`);
  if (i === -1) return '';
  return css.slice(i, css.indexOf('}', i));
}

describe('R-D3-46-a — aucun défilement horizontal dans le bandeau', () => {
  it('aucune règle `overflow-x: auto`/`scroll` dans la feuille du bandeau', () => {
    expect(bandCss).not.toMatch(/overflow-x:\s*(auto|scroll)/);
  });

  it('la barre condensée ne passe pas à la ligne ET ses champs rétrécissent (min-width: 0)', () => {
    expect(ruleBody(bandCss, '.kycar-band-bar__row')).toMatch(/flex-wrap:\s*nowrap/);
    expect(ruleBody(bandCss, '.kycar-band-bar__row .kycar-primary-line')).toMatch(/min-width:\s*0/);
  });

  it('les cartes en colonnes CSS de 280 px, jamais coupées (retouche coordinateur)', () => {
    expect(ruleBody(bandCss, '.kycar-filter-cards')).toMatch(/column-width:\s*280px/);
    expect(ruleBody(bandCss, '.kycar-filter-card')).toMatch(/break-inside:\s*avoid/);
  });
});

describe('R-D3-46-c — brouillon : plus aucune application automatique', () => {
  it('`FilterBand` n’appelle plus `scheduleChange` (débounces d’application EX-SRCH-1…8)', () => {
    expect(band).not.toMatch(/scheduleChange\(/);
    expect(band).toMatch(/controllerRef\.current\?\.applyDraft\(/);
  });

  it('la coquille ne remonte plus le bandeau à chaque requête (clé = chemin seul)', () => {
    expect(app).toMatch(/<FilterBand\s+key=\{location\.pathname\}/);
    expect(app).not.toMatch(/key=\{`\$\{location\.pathname\}\$\{location\.search\}`\}/);
  });

  it('un intervalle ne ramène plus sa valeur au domaine à la frappe, mais à la validation du champ', () => {
    expect(range).toMatch(/onBlur=\{\(\) => commitTyped\('from'\)\}/);
    expect(range).toMatch(/onBlur=\{\(\) => commitTyped\('to'\)\}/);
  });

  it('logique pure : sale/propre, fusion sous une nouvelle base, annulation', () => {
    const applied = { priceTo: 20000 };
    const draft = withDraftValue(applied, 'mileageTo', 100000);
    expect(isDraftDirty(applied, draft)).toBe(true);
    // « Annuler » : le brouillon redevient la sélection appliquée.
    expect(isDraftDirty(applied, applied)).toBe(false);
    // Un jeton retiré (nouvelle base) ne perd pas la modification en attente.
    expect(rebaseDraft(applied, draft, {})).toEqual({ mileageTo: 100000 });
  });
});

describe('R-D3-46-c — « Appliquer » : UNE navigation, scission T/R au moment de l’application', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('trois filtres modifiés ⇒ un seul pushState, aucun replaceState', () => {
    const pushState = vi.fn();
    const replaceState = vi.fn();
    const recomputeLocal = vi.fn();
    const reload = vi.fn();
    const c = new InteractionController({ pushState, replaceState, recomputeLocal, reload });
    const plan = planDraftApply({}, { priceTo: 20000, mileageTo: 100000, bodyType: ['3'] }, 'mode1');
    c.applyDraft('/marche?body=3&kmto=100000&priceto=20000', plan.classes);
    vi.advanceTimersByTime(5_000);
    expect(pushState).toHaveBeenCalledTimes(1);
    expect(replaceState).not.toHaveBeenCalled();
    expect(recomputeLocal).toHaveBeenCalledTimes(1);
    expect(reload).not.toHaveBeenCalled();
  });
});

describe('R-D3-46-d — une seule région collante : la barre condensée', () => {
  it('l’en-tête n’est plus `position: sticky`', () => {
    expect(ruleBody(appCss, '.kycar-header')).not.toMatch(/position:\s*sticky/);
  });

  it('`.kycar-filter-bar` n’a plus de boîte à l’écran ; la barre colle à `top: 0`', () => {
    expect(appCss).toMatch(/@media screen \{\s*\.kycar-filter-bar \{\s*display: contents;/);
    const bar = ruleBody(bandCss, '.kycar-band-bar');
    expect(bar).toMatch(/position:\s*sticky/);
    expect(bar).toMatch(/top:\s*0/);
  });

  it('hauteur de la barre fixée sous le budget (52 px ≤ 64 ; 56 px en compact)', () => {
    expect(ruleBody(bandCss, '.kycar-band-bar__row')).toMatch(/height:\s*52px/);
    expect(ruleBody(bandCss, '.kycar-compact-bar')).toMatch(/height:\s*56px/);
  });
});
