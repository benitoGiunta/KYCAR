/**
 * Revue D8 (remédiation 3.5, `fix-app-4`) — CÂBLAGE DE LA COQUILLE pour `ACC-19`, `ACC-20`, `ACC-24`
 * =================================================================================================
 * Trois constats de la recette rev 3 (`reports/ACCEPTANCE.md` §8), tous des défauts de CÂBLAGE :
 *
 *   - **`ACC-19` (MAJEUR)** — « Convertir la sélection en filtre » (`EX-SCR-158`/`184`) posait bien
 *     un correctif de filtres puis effaçait le brossage par un SECOND appel : `onApplyFilters(patch)`
 *     PUIS `onUiChange({ …ui, brushX: null, brushY: null })`. Chacun navigue ; le second sérialise
 *     la sélection PÉRIMÉE (celle d'avant le correctif) et écrase le premier. Résultat mesuré :
 *     `selx`/`sely` disparaissent, aucun filtre n'est posé, aucun message — un bouton mort au milieu
 *     de l'interaction phare du mode 2, et un silence que `D-03` interdit.
 *     Règle posée ici : **une seule navigation**, `applyFilters(patch, uiSansBrossage)`.
 *   - **`ACC-20` (MAJEUR)** — le paramètre `provider` (`DF-2` : « le seul qui se partage dans un
 *     lien ») était effacé de l'URL à la première sérialisation. La coquille reconduit désormais les
 *     paramètres RÉSERVÉS à CHAQUE écriture d'URL, par son unique point de passage `navigate`.
 *   - **`ACC-24` (MINEUR, `D3-34 (d)`)** — la `coverageNote` du snapshot n'était affichée par aucun
 *     écran : une ligne « Note de couverture » est ajoutée au panneau Diagnostic, pliable si longue.
 *
 * Comme les autres sondes de câblage de ce lot (`shell-static`, `shell-wiring-f3`,
 * `shell-wiring-3.5`), ce qui se prouve en COMPORTEMENT l'est sur les modules purs, et ce qui ne se
 * prouve qu'au montage (la coquille est un composant à hooks, l'environnement est `node`) l'est par
 * lecture du SOURCE. La preuve de bout en bout est la recette navigateur
 * (`tests/e2e/parcours-p2.spec.ts`, `source-fixture.spec.ts`).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  BRUSH_NO_NEW_FILTER_MESSAGE,
  mergeSelectionPatch,
} from '../../../src/app/navigation';
import { DIAGNOSTIC_FOLD_THRESHOLD, coverageNoteValue } from '../../../src/app/diagnostics';
import { carryReservedParams } from '../../../src/state/url-codec';

const ROOT = process.cwd();
const app = readFileSync(resolve(ROOT, 'src/app.tsx'), 'utf8');
const distribution = readFileSync(
  resolve(ROOT, 'src/screens/distribution/DistributionScreen.tsx'),
  'utf8',
);

/**
 * Retire les commentaires d'un fragment de source : ces sondes portent sur ce que le CODE FAIT, et
 * les commentaires de la correction citent nommément l'appel supprimé (« appliquer puis
 * `onUiChange` »). Sans ce nettoyage, la sonde lirait la prose au lieu de l'instruction.
 */
function codeOnly(fragment: string): string {
  return fragment.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

/** Corps d'une fonction fléchée `const <nom> = (…): <type> => { … }`, accolades équilibrées. */
function bodyOf(source: string, name: string): string {
  const start = source.indexOf(`const ${name} =`);
  expect(start, `déclaration de ${name} introuvable`).toBeGreaterThan(-1);
  const open = source.indexOf('{', source.indexOf('=>', start));
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    const c = source[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return codeOnly(source.slice(open, i + 1));
    }
  }
  return codeOnly(source.slice(open));
}

/** Montage d'un composant dans `app.tsx`, de `<Nom` à sa ligne de fermeture (cf. `shell-wiring-3.5`). */
function mountOf(name: string): string {
  const start = app.indexOf(`<${name}`);
  expect(start, `montage de ${name} introuvable`).toBeGreaterThan(-1);
  const close = app.slice(start).indexOf('\n        />');
  return close < 0 ? app.slice(start, start + 6000) : app.slice(start, start + close);
}

/* ================================================================================================
 * ACC-19 — « Convertir la sélection en filtre » : UNE seule navigation
 * ============================================================================================== */

describe('R-D8-ACC19-01 — le gestionnaire de conversion ne navigue qu’UNE fois', () => {
  const handler = bodyOf(distribution, 'onConvertBrushToFilter');

  it('il pose le correctif de filtres', () => {
    expect(handler).toContain('onApplyFilters');
    expect(handler).toContain('intervalFiltersToSelectionInput');
  });

  it('il n’appelle PLUS `onUiChange` — la seconde navigation écrasait la première (ACC-19)', () => {
    expect(handler).not.toContain('onUiChange');
  });

  it('le retrait du brossage voyage AVEC le correctif, dans le même appel', () => {
    // `brushX: null, brushY: null` doit rester dans le gestionnaire : ce qui change, c'est le
    // DESTINATAIRE (le même appel que le correctif), pas le fait d'effacer le brossage (`D-26`).
    expect(handler).toMatch(/brushX:\s*null/);
    expect(handler).toMatch(/brushY:\s*null/);
    expect(handler.match(/props\.on[A-Z]\w+/g) ?? []).toEqual(['props.onApplyFilters']);
  });
});

describe('R-D8-ACC19-02 — la coquille transforme l’état d’interface reçu en une seule écriture d’URL', () => {
  const mount = mountOf('DistributionScreen');

  it('`onApplyFilters` du montage accepte l’état d’interface de l’écran B et le sérialise', () => {
    expect(mount).toMatch(/onApplyFilters=\{\(patch,\s*\w+\)/);
    expect(mount).toContain('writeDistributionUiState');
  });

  it('`applyFilters` de la coquille accepte bien un état d’interface additionnel (extraUi)', () => {
    expect(app).toMatch(/applyFilters\s*=\s*useCallback\(\s*\n?\s*\(patch: SelectionInput, extraUi/);
  });
});

describe('R-D8-ACC19-03 — fusion d’un correctif de filtres (fonction pure de la coquille)', () => {
  it('ajoute, remplace et RETIRE (valeur vide) sans muter la sélection reçue', () => {
    const selection = { priceTo: 20000, body: ['3'] } as const;
    const merged = mergeSelectionPatch(selection, {
      priceFrom: 390,
      priceTo: 19990,
      body: undefined,
    });
    expect(merged).toEqual({ priceFrom: 390, priceTo: 19990 });
    expect(selection).toEqual({ priceTo: 20000, body: ['3'] });
  });

  it('traite une liste vide comme un retrait (EX-NAV-8 : jamais `param=`)', () => {
    expect(mergeSelectionPatch({ body: ['3'] }, { body: [] })).toEqual({});
  });
});

describe('R-D8-ACC19-04 — une conversion qui ne pose aucun filtre le DIT (D-03)', () => {
  it('le message de la coquille est explicite, jamais un silence', () => {
    expect(BRUSH_NO_NEW_FILTER_MESSAGE.length).toBeGreaterThan(30);
    expect(BRUSH_NO_NEW_FILTER_MESSAGE).toMatch(/aucun filtre/i);
    expect(BRUSH_NO_NEW_FILTER_MESSAGE).toMatch(/sélection brossée/i);
  });

  it('la coquille le publie quand la requête de filtres ne bouge pas', () => {
    const mount = mountOf('DistributionScreen');
    expect(mount).toContain('BRUSH_NO_NEW_FILTER_MESSAGE');
    expect(mount).toContain('setBanner');
  });
});

/* ================================================================================================
 * ACC-20 — le paramètre réservé `provider` survit à chaque écriture d'URL
 * ============================================================================================== */

describe('R-D8-ACC20-04 — la coquille reconduit les paramètres réservés à CHAQUE navigation', () => {
  it('`navigate` (unique point de passage des écritures d’URL) applique `carryReservedParams`', () => {
    const navigate = bodyOf(app, 'navigate');
    expect(navigate).toContain('carryReservedParams');
    // La localisation d'état est dérivée de l'URL RÉELLEMENT écrite, jamais de l'URL demandée :
    // sinon le paramètre réservé disparaîtrait du rendu tout en restant dans la barre d'adresse.
    expect(navigate).toMatch(/carryReservedParams\([^)]*\)/);
    expect(navigate).not.toMatch(/setLocation\(\{\s*pathname:\s*url/);
  });

  it('la canonisation d’URL (EX-NAV-21) resérialise AVEC les réservés', () => {
    expect(app).toMatch(/reserved:\s*parsedQuery\.reserved/);
  });

  it('le comportement reconduit est bien celui du codec (aucune logique dupliquée dans app.tsx)', () => {
    expect(carryReservedParams('/marche?priceto=20000', '?provider=synthetic')).toBe(
      '/marche?priceto=20000&provider=synthetic',
    );
  });
});

/* ================================================================================================
 * ACC-24 — la `coverageNote` est lisible quelque part (D3-34 (d))
 * ============================================================================================== */

describe('R-D8-ACC24-01 — ligne « Note de couverture » du panneau Diagnostic', () => {
  it('la valeur affichée est sincère quand la source n’en fournit pas', () => {
    expect(coverageNoteValue(undefined)).toBe('—');
    expect(coverageNoteValue(null)).toBe('aucune');
    expect(coverageNoteValue('Jeu de données FIXTURE (profil test).')).toBe(
      'Jeu de données FIXTURE (profil test).',
    );
  });

  it('la note est rendue TELLE QUELLE, jamais tronquée — le pliage est un seuil d’affichage', () => {
    const long = 'x'.repeat(DIAGNOSTIC_FOLD_THRESHOLD + 42);
    expect(coverageNoteValue(long)).toBe(long);
    expect(DIAGNOSTIC_FOLD_THRESHOLD).toBe(300);
  });

  it('le panneau Diagnostic porte la ligne, alimentée par le descripteur de snapshot', () => {
    expect(app).toContain("'Note de couverture'");
    expect(app).toContain('coverageNoteValue(d?.coverageNote)');
  });

  it('une valeur longue est PLIABLE (details/summary), les autres restent des `dd` simples', () => {
    const footer = app.slice(app.indexOf('function AppFooter'));
    expect(footer).toContain('DIAGNOSTIC_FOLD_THRESHOLD');
    expect(footer).toContain('<details');
  });

  it('la ligne est ajoutée EN FIN de liste (les sondes existantes lisent `dd` par position)', () => {
    const list = app.slice(app.indexOf("['Statut du démarrage'"), app.indexOf('}, [start, controller'));
    const labels = [...list.matchAll(/\['([^']+)',/g)].map((m) => m[1]);
    expect(labels[0]).toBe('Statut du démarrage');
    expect(labels[1]).toBe('Source');
    expect(labels[2]).toBe('Snapshot');
    expect(labels[labels.length - 1]).toBe('Note de couverture');
  });
});
