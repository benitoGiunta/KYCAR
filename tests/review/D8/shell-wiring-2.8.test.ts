/**
 * Revue D8 (remédiation 2.8) — sondes de CÂBLAGE de la coquille.
 *
 * La coquille `App` utilise des hooks et ne peut pas être montée sans DOM dans cet environnement
 * (vitest `node`, aucune dépendance DOM autorisée) : ces sondes lisent le SOURCE de `src/app.tsx`,
 * `src/orchestration/`, `src/worker/` et `index.html` — même technique que `shell-static.test.ts`,
 * dont elles prolongent l'inventaire pour les constats de la phase 2.8. La preuve de COMPORTEMENT,
 * elle, est portée par la recette navigateur (`tests/e2e/`, constats `E2E-xx`) : ces sondes
 * garantissent qu'un câblage retiré par mégarde soit vu par `npm test`, sans attendre 15 minutes de
 * Playwright.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const read = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8');
const app = read('src/app.tsx');
const controller = read('src/orchestration/data-controller.ts');
const workerClient = read('src/worker/client.ts');
const indexHtml = read('index.html');
const printCss = read('src/styles/print.css');

describe('D8-01 / FV-01 — le lot colonnaire n’est plus transféré au worker', () => {
  it('`loadDataset` n’assemble aucune liste de `Transferable` et `postMessage` n’en reçoit pas', () => {
    expect(workerClient).not.toMatch(/batchTransferables/);
    // Aucun `postMessage(x, transfer)` : le second argument de transfert a disparu du client.
    expect(workerClient).not.toMatch(/postMessage\([^)]+,\s*transfer/);
    expect(workerClient).toMatch(/copie structurée/i);
  });
});

describe('D8-02 / FV-02 — les agrégats MODÈLE sont chargés avec le marché', () => {
  it('le contrôleur expose `loadAllModels` et l’appelle avec un niveau MODEL de portée marché', () => {
    expect(controller).toMatch(/async loadAllModels\(/);
    expect(controller).toMatch(/fetchAggregates\(this\.handle, query, 'MODEL'\)/);
  });

  it('la coquille fusionne ces agrégats dans `modelsByMake` sans écraser un chargement à la demande', () => {
    expect(app).toMatch(/controller\s*\n?\s*\.loadAllModels\(selection\)/);
    expect(app).toMatch(/if \(!next\.has\(makeId\)\) next\.set\(makeId, models\)/);
  });
});

describe('D8-03 / FV-03 / E2E-26 — les corrections d’URL sont consommées', () => {
  it('`loadQuery` est lue en ENTIER (selection + uiState + corrections), pas seulement `.selection`', () => {
    expect(app).toMatch(/const parsedQuery = useMemo\(\(\) => loadQuery\(location\.search\)/);
    expect(app).toMatch(/parsedQuery\.corrections/);
  });

  it('une correction déclenche une réécriture `replace` vers la requête canonique ET un bandeau', () => {
    expect(app).toMatch(/navigate\(canonical, 'replace'\)/);
    expect(app).toMatch(/id: 'ET-URL-CORRIGEE'/);
    // `EX-SCR-38bis` : au plus trois lignes, puis « et <k> autres paramètres corrigés ».
    expect(app).toMatch(/autres paramètres corrigés/);
  });
});

describe('D8-04 / FV-04 — les quatre écarts `mmmv`', () => {
  it('(a) un clic sur l’en-tête de carte POSE `mmmv` sur la marque au lieu de déplier', () => {
    const handler = app.match(/onSelectMake=\{[\s\S]{0,300}?\n/)?.[0] ?? '';
    expect(handler, 'onSelectMake introuvable dans src/app.tsx').not.toBe('');
    expect(handler).toMatch(/makesModelsVariants/);
    expect(handler).not.toMatch(/onToggleExpand/);
  });

  it('(b) un `mmmv` COMPLET redirige vers l’écran B, en `replace` (pas de piège au retour arrière)', () => {
    expect(app).toMatch(/function completeMmmvPair/);
    expect(app).toMatch(/goToModel\(pair\.makeId, pair\.modelId, 'replace'\)/);
  });

  it('(c) le retour B → A réinjecte la MARQUE SEULE (`make|||`, D-09)', () => {
    expect(app).toMatch(/marketUrlFrom\(\{ makeId: view\.makeId \}\)/);
    expect(app).not.toMatch(/marketUrlFrom\(\{ makeId: view\.makeId, modelId: view\.modelId \}\)/);
  });
});

describe('D8-05 / FV-05, FV-06, FV-23 — facettes, effectifs et compteurs', () => {
  it('le contrôleur expose les facettes, l’effectif de la sélection mode 1 et le hachage associé', () => {
    expect(controller).toMatch(/async computeFacets\(/);
    expect(controller).toMatch(/get marketSelectionCount\(\)/);
    expect(controller).toMatch(/get facetCounts\(\)/);
  });

  it('les facettes sont DIFFÉRÉES (≤ 100 ms) et l’écart est signalé, jamais masqué', () => {
    expect(app).toMatch(/const FACET_DEFER_MS = 100;/);
    expect(app).toMatch(/setFacetCountsPending\(true\)/);
  });

  it('`FilterBand` reçoit facettes, effectifs d’écran G, compteur et régime', () => {
    for (const prop of [
      'facetCounts={facetCounts}',
      'facetCountsPending={facetCountsPending}',
      'screenGMakeCounts={screenGMakeCounts}',
      'screenGModelCounts={screenGModelCounts}',
      'resultCount={resultCount}',
      'resultCountLoading={resultCountLoading}',
      'regime={bandRegimeOf(regime)}',
      'projectedResultCount={projectedResultCount}',
      'onDraftSelectionChange={onDraftSelectionChange}',
    ]) {
      expect(app, prop).toContain(prop);
    }
  });

  it('`EX-SCR-46` — double compteur du fil d’Ariane, calculé HORS taxonomie', () => {
    expect(app).toMatch(/function withoutTaxonomy/);
    expect(app).toMatch(/offres \| /);
  });

  it('un effectif non établi n’est jamais rendu comme un zéro', () => {
    // `D-03` : dès qu'un filtre n'est pas appliqué, l'effectif publié serait un PLANCHER.
    expect(controller).toMatch(/this\.lastMarketSelectionCount = null;/);
    expect(app).toMatch(/'— ici'/);
  });
});

describe('D8-06 / D8-24 — props d’écran câblées par la coquille', () => {
  it('`DistributionScreen` reçoit `modelId`, `snapshotCoverage`, `onOpenMentions` et `recalculating`', () => {
    for (const prop of ['modelId={modelId}', 'snapshotCoverage={', 'onOpenMentions={', 'recalculating={']) {
      expect(app, prop).toContain(prop);
    }
  });

  it('`ListingsScreen` reçoit le régime détecté par la coquille (EX-SCR-209)', () => {
    const listings = app.match(/<ListingsScreen[\s\S]*?\/>/)?.[0] ?? '';
    expect(listings).toMatch(/regime=\{regime\}/);
  });

  it('`CompareScreen` reçoit `onAddModel` et `onRedirect`, et le bandeau C1 est monté sur /comparer', () => {
    expect(app).toMatch(/onAddModel=\{/);
    expect(app).toMatch(/onRedirect=\{\(target: CompareRedirectTarget\)/);
    expect(app).toMatch(/view\.kind === 'compare' \? \(/);
  });

  it('`EX-SCR-198` — la redirection de l’écran C n’a lieu que sur une TRANSITION, jamais à froid', () => {
    expect(app).toMatch(/compareWasPopulated/);
    expect(app).toMatch(/if \(!compareWasPopulated\.current \|\| compareLoading\) return;/);
  });

  it('`D8-24` — le payload mode 2 précédent survit à un recalcul (ET-CHARGE-MAJ, pas un écran vidé)', () => {
    expect(app).toMatch(/setMode2\(\(prev\) => \(\{ key, status: 'loading'/);
  });
});

describe('EX-SCR-38 — pile de bandeaux plafonnée à deux, `+k` au-delà', () => {
  it('l’ordre de priorité normatif est celui de la pile construite par la coquille', () => {
    const ids = [...app.matchAll(/id: '(ET-[A-Z-]+)'/g)].map((m) => m[1]);
    expect(ids).toEqual([
      'ET-ERREUR-PROVIDER',
      'ET-HORS-LIGNE',
      'ET-PARTIEL-CACHE',
      'ET-FILTRE-NON-APPLIQUE',
      'ET-FILTRE-NON-APPLIQUE-BODY',
      'ET-URL-CORRIGEE',
    ]);
  });

  it('le plafond vaut 2 et les bandeaux au-delà sont repliés derrière un jeton d’avertissements', () => {
    expect(app).toMatch(/const BANNER_STACK_MAX = 2;/);
    expect(app).toMatch(/avertissement\{hiddenCount > 1 \? 's' : ''\}/);
  });
});

describe('D8-14 / D8-15 — a11y, impression, diagnostic, hors ligne, favicon', () => {
  it('`E2E-16` — le titre visé est rendu focalisable AVANT la prise de focus', () => {
    expect(app).toMatch(/heading\.setAttribute\('tabindex', '-1'\)/);
  });

  it('`E2E-22` — le résumé d’impression est FRÈRE de `.filter-bar`, et son masquage est borné à l’écran', () => {
    const bar = app.match(/<div class="filter-bar kycar-filter-bar">[\s\S]*?<\/div>/)?.[0] ?? '';
    expect(bar).not.toMatch(/print-filter-summary/);
    expect(app).toMatch(/print-filter-summary/);
    expect(printCss).toMatch(/@media screen \{\s*\.print-filter-summary/);
  });

  it('`E2E-23` — le résumé d’impression vient des jetons du bandeau, un filtre par ligne', () => {
    expect(app).toMatch(/buildActiveFilterTokens\(selection, referenceData\)/);
    expect(app).toMatch(/printFilterLines\.join\('\\n'\)/);
  });

  it('`E2E-24` — l’homonymie est évaluée AVANT la création', () => {
    const save = app.match(/const duplicate = stores\.saved\.hasDuplicateName[\s\S]{0,600}?bumpCrud\(\);/)?.[0] ?? '';
    expect(save).toMatch(/const duplicate = stores\.saved\.hasDuplicateName/);
    expect(save.indexOf('hasDuplicateName')).toBeLessThan(save.indexOf('stores.saved.create'));
  });

  it('`FV-17` — `mk` dans l’URL, cardinaux d’onglet masqués à zéro, jeton court, marque avec filtres', () => {
    expect(app).toMatch(/mkParam/);
    expect(app).toMatch(/props\.compareCount > 0 \? `Comparer \(\$\{props\.compareCount\}\)` : 'Comparer'/);
    expect(app).toMatch(/const tokenLabel = `Snapshot \$\{frDayMonth\(props\.snapshotDate\)\}`/);
    expect(app).toMatch(/const brandHref = assembleUrl\('\/marche', props\.currentQuery\)\.url/);
    expect(app).toMatch(/PRIMER_FLAG_KEY/);
  });

  it('`FV-21` — le panneau Diagnostic vient du `SnapshotDescriptor` et porte l’action Rafraîchir', () => {
    for (const field of ['unknownCountByField', 'ingestFlagCounts', 'duplicateValueConflictCount', 'rejectedByReason']) {
      expect(app, field).toContain(field);
    }
    expect(app).toMatch(/Rafraîchir les données/);
    expect(app).toMatch(/Nouvelles données du/);
  });

  it('`FV-22` — une icône est déclarée, sans fichier binaire ni aller réseau (E5)', () => {
    expect(indexHtml).toMatch(/<link rel="icon"[^>]*href="data:image\/svg\+xml/);
  });

  it('`D8-15` — état hors ligne réel (aucun appel réseau) et régime posé sur l’en-tête', () => {
    expect(app).toMatch(/navigator\.onLine === false/);
    expect(app).toMatch(/addEventListener\('offline', down\)/);
    expect(app).toMatch(/data-regime=\{props\.regime\}/);
  });

  it('`D8-20` — le filtre Carrosserie non appliqué en mode 2 est NOMMÉ', () => {
    expect(app).toMatch(/unsupportedMode2\.includes\('bodyType'\)/);
    expect(app).toMatch(/Filtre Carrosserie non appliqué à ce modèle \(donnée indisponible\)/);
  });
});
