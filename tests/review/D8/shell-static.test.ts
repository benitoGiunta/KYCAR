/**
 * Revue D8 — sonde n°7 : COQUILLE S0, câblage main.tsx, a11y, print, R2/E5 — sondes STATIQUES.
 *
 * La coquille `App` utilise des hooks et ne peut pas être montée sans DOM dans cet environnement
 * (vitest `node`, aucune dépendance DOM autorisée) ; ces sondes lisent donc le SOURCE de
 * `src/app.tsx` / `src/main.tsx` / `src/app/navigation.ts` et vérifient la présence ou l'absence de
 * câblages précis. Chaque assertion est reproductible et son motif est cité dans le rapport.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const read = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8');
const app = read('src/app.tsx');
const main = read('src/main.tsx');
const navigation = read('src/app/navigation.ts');

function listFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) listFiles(p, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}
const SCOPE_DIRS = ['src/app', 'src/screens/compare', 'src/screens/saved', 'src/screens/followed', 'src/screens/mentions', 'src/orchestration', 'src/persistence'];
const scopeFiles = [resolve(ROOT, 'src/app.tsx'), resolve(ROOT, 'src/main.tsx'), ...SCOPE_DIRS.flatMap((d) => listFiles(resolve(ROOT, d)))];

describe('R2 / E5 — aucun accès data hors DataProvider, aucun appel réseau vers les places de marché', () => {
  it('aucun fetch()/XMLHttpRequest/import() dynamique hors du chargeur de référentiels statiques (/reference/*)', () => {
    const offenders: string[] = [];
    for (const f of scopeFiles) {
      const src = readFileSync(f, 'utf8');
      const isReferenceLoader = f.endsWith('reference-loader.ts');
      if (/XMLHttpRequest|\bimport\(/.test(src)) offenders.push(f);
      if (/\bfetch\(/.test(src) && !isReferenceLoader) offenders.push(f);
    }
    expect(offenders).toEqual([]);
    // Le chargeur ne touche que la base `/reference` (référentiels statiques servis par le plugin Vite).
    expect(read('src/orchestration/reference-loader.ts')).toMatch(/const REFERENCE_BASE = '\/reference'/);
  });

  it('aucun import d’un provider concret hors main.tsx (le contrôleur ne connaît que l’interface)', () => {
    const offenders = scopeFiles.filter((f) => !f.endsWith('main.tsx') && /from '.*providers\/(synthetic|tweedehands)/.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('E5 : aucune URL autoscout24 / 2dehands / marktplaats dans le périmètre', () => {
    const offenders = scopeFiles.filter((f) => /https?:\/\/[^'"\s]*(autoscout24|2dehands|marktplaats)/i.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });
});

describe('câblage main.tsx (HANDOFF §4) et repli mode 2', () => {
  it('assemble loadReferenceData + SyntheticDataProvider + createAggregationEngine (worker) + DataController + cache IndexedDB', () => {
    expect(main).toMatch(/await loadReferenceData\(\)/);
    expect(main).toMatch(/new SyntheticDataProvider\(\{ referenceData \}\)/);
    expect(main).toMatch(/engineFactory: \(\) => createAggregationEngine\(\)/);
    expect(main).toMatch(/cache: createIndexedDbSnapshotCache\(\)/);
  });

  it('R-D8-09 — aucun `mode2Fallback` n’est câblé : un provider réel mode 1 seul (D9, « prêt à remplacer ») laisserait le mode 2 en erreur au lieu du repli SYNTHETIC (EX-DATA-107)', () => {
    expect(main).toMatch(/mode2Fallback/);
  });
});

describe('S0 — en-tête, bandeaux, pied (EX-SCR-42…47)', () => {
  it('landmarks présents : header, nav étiquetée, main', () => {
    expect(app).toMatch(/<header class="app-header/);
    // D8-15/D-31 : l'élément porte désormais aussi `id`/`class` (tiroir de navigation du régime
    // compact, EX-SCR-48). Le FAIT mesuré — un landmark `nav` ÉTIQUETÉ — est inchangé ; seule
    // l'assertion sur le chevron fermant, qui figeait la liste des attributs, est relâchée.
    expect(app).toMatch(/<nav aria-label="Navigation principale"/);
    expect(app).toMatch(/<main class="kycar-main">/);
  });

  it('R-D8-22 — EX-SCR-42 : exactement quatre onglets (Marché, Comparer (n), Recherches, Suivis (n)) + jeton de snapshot ; observé : 5 liens dont Mentions, aucun compteur, aucun jeton', () => {
    const links = app.match(/\{ href: '\/[a-z]+', label: '[^']+' \}/g) ?? [];
    expect(links).toHaveLength(4);
    expect(app).toMatch(/Comparer \(/); // compteur
    expect(app).toMatch(/Snapshot /); // jeton EX-SCR-43
  });

  it('R-D8-22 — EX-SCR-44 : l’onglet Comparer est désactivé (aria-disabled) sous 2 modèles', () => {
    expect(app).toMatch(/aria-disabled/);
  });

  it('R-D8-22 — EX-SCR-47 : pied de page obligatoire (mention légale SUIVANT la nature de la source, date du snapshot, Diagnostic, Mentions)', () => {
    expect(app).toMatch(/<footer/);
    // Phase 3.5 (`EX-DATA-107`) : la mention légale n'est plus un littéral. « Source : AutoScout24 —
    // agrégat non affilié » n'est vraie que d'une source RÉELLE ; sur le jeu fictif servi par défaut
    // (`D3-01`) elle attribuait à la place de marché des chiffres qu'elle n'a pas fournis. Elle est
    // composée par `footerSourceLine`, dont les quatre branches sont éprouvées en comportement dans
    // `shell-wiring-3.5.test.ts`.
    expect(app).toMatch(/footerSourceLine\(/);
    expect(app).toMatch(/Diagnostic/);
  });

  it('R-D8-07 — EX-NFR-22 / EX-SCR-29 : le bandeau dégradé doit porter la DATE du cache (« Données du JJ/MM/AAAA — … ») et un bouton Réessayer', () => {
    // D8-06/FV-07/D-31 : les bandeaux d'état de la coquille ne sont plus cinq blocs JSX juxtaposés
    // mais une PILE ordonnée (`shellBanners`, EX-SCR-38 : au plus deux simultanés, `+k` au-delà).
    // Le fait mesuré est inchangé — le bandeau dégradé porte la date du cache ET l'action
    // « Réessayer » — mais il se lit maintenant sur l'entrée de la pile (`ET-PARTIEL-CACHE`,
    // `retry: true`) plus le rendu commun de l'action, au lieu d'un bloc `<div>…</div>` littéral.
    const entry = app.match(/id: 'ET-PARTIEL-CACHE'[\s\S]*?\}\);/)?.[0] ?? '';
    expect(entry).toMatch(/Données du/);
    expect(entry).toMatch(/retry: true/);
    expect(app).toMatch(/b\.retry === true[\s\S]*?Réessayer/);
  });

  it('R-D8-06 — après un échec total (start = failed), « Réessayer » (onRetryProvider) ne relance jamais controller.start() : il rejoue loadMarket qui échoue à l’identique', () => {
    const handler = app.match(/onRetryProvider=\{[^}]*\}/)?.[0] ?? '';
    expect(handler).toMatch(/controller\.start/);
  });

  it('R-D8-08 — EX-DATA-107 : `sourceKind = SYNTHETIC` n’est affiché sur aucun écran de marché (A/B/D) — seul le CSV et /mentions le portent', () => {
    const files = ['src/app.tsx', 'src/screens/market/MarketScreen.tsx', 'src/screens/distribution/DistributionScreen.tsx', 'src/screens/listings/ListingsScreen.tsx'];
    const hits = files.filter((f) => /synthétique|SYNTHETIC/i.test(read(f).replace(/csvMeta[\s\S]*?\};/g, '')));
    expect(hits.length).toBeGreaterThan(0);
  });
});

describe('routage dans la coquille : canonique, taxonomie, purge au rafraîchissement', () => {
  it('R-D8-16 — EX-SCR-140 : aucune redirection canonique de slug (la coquille ne compare jamais le slug de l’URL à celui de la taxonomie) et aucune validation EX-NAV-19/20 (resolveTaxonomyRoute D5 jamais appelé)', () => {
    expect(`${app}\n${navigation}`).toMatch(/resolveTaxonomyRoute/);
    expect(app).toMatch(/makeSlug\s*!==|modelSlug\s*!==/);
  });

  it('R-D8-15 — routes héritées `/` et `/modele/:makeId/:modelId` : aucun `replaceState` vers la route canonique', () => {
    expect(`${app}\n${navigation}`).toMatch(/\/modele\//);
  });

  it('R-D8-26 — EX-NAV-24 : le rafraîchissement (onReload → controller.start()) ne vide pas la sélection de comparaison', () => {
    const reload = app.match(/onReload=\{[\s\S]*?\n\s{12}\}\}/)?.[0] ?? '';
    expect(reload).toMatch(/controller\.start\(\)/);
    expect(reload).toMatch(/setCompareKeys\(\[\]\)/);
  });
});

describe('CRUD câblé dans la coquille (EX-CRUD-4 / 6)', () => {
  it('R-D8-25 — EX-CRUD-6 : ouvrir une recherche sauvegardée doit mettre à jour dernier_accès_le (store.touch) — jamais appelé', () => {
    expect(app).toMatch(/stores\.saved\.touch\(/);
  });

  it('R-D8-25 — EX-CRUD-4 : « Enregistrer cette recherche » disponible sur les DEUX écrans — absent du mode 2 (renderMode2 n’a ni MarketToolbar ni onSave)', () => {
    const start = app.indexOf('function renderMode2');
    const mode2 = app.slice(start, app.indexOf('\nfunction modelName', start));
    expect(mode2.length).toBeGreaterThan(500);
    expect(mode2).toMatch(/MarketToolbar|saveCurrentSearch/);
  });
});

describe('a11y (EX-NFR-12/14/16) et impression (EX-NFR-31)', () => {
  it('R-D8-23 — lien d’évitement, titre de document par route et gestion du focus après navigation absents', () => {
    expect(app).toMatch(/skip|évitement|Aller au contenu/i);
    expect(app).toMatch(/document\.title/);
    expect(app).toMatch(/\.focus\(/);
  });

  it('classes du contrat print posées par la coquille : .app-header, .filter-bar, .status-banner, .no-print', () => {
    for (const cls of ['app-header', 'filter-bar', 'status-banner', 'no-print']) expect(app).toMatch(new RegExp(`class="[^"]*\\b${cls}\\b`));
  });

  it('R-D8-24 — EX-NFR-31 : `.summary-bar`, `.summary-bar-c3` et `.print-filter-summary` (contrat print.css) ne sont posés par aucun composant rendu', () => {
    const all = listFiles(resolve(ROOT, 'src'))
      .filter((f) => f.endsWith('.tsx'))
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n');
    for (const cls of ['summary-bar', 'summary-bar-c3', 'print-filter-summary']) {
      expect(all).toMatch(new RegExp(`class="[^"]*(^|\\s)${cls}(\\s|")`));
    }
  });
});

describe('tests D8 existants — fidélité au parcours cible', () => {
  it('R-D8-28 — les tests D8 nomment « Opel Corsa » le couple 16/1174, qui n’est ni Opel ni Corsa dans la taxonomie (Opel = 54, Corsa = 1918)', () => {
    const tests = ['src/app/navigation.test.ts', 'src/persistence/persistence.test.ts', 'src/screens/compare/structure.test.ts'].map(read).join('\n');
    expect((tests.match(/16-opel\/1174-corsa/g) ?? []).length).toBe(0);
  });
});
