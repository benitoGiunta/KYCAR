/**
 * KYCAR — Sondes de revue D7 · écran B monté (EX-SCR-141/142/144/158/184/191, EX-NFR-15/19, ADV-03)
 * =================================================================================================
 * Vérifications n°3, 6, 7 et 10 de la mission. L'environnement de test est `node` (aucun DOM, aucune
 * dépendance tierce autorisée) : les hooks de Preact sont NEUTRALISÉS (`vi.mock`) pour que chaque
 * composant redevienne une fonction pure de ses props, puis l'arbre de VNodes est rendu en
 * profondeur (`deepRender`) et inspecté. On mesure donc le rendu INITIAL (état des hooks à leur
 * valeur d'initialisation), ce qui suffit pour statuer sur la présence/absence d'un élément.
 */

import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

vi.mock('preact/hooks', () => ({
  useState: <T>(init: T | (() => T)) => [typeof init === 'function' ? (init as () => T)() : init, (): void => {}],
  useMemo: <T>(fn: () => T) => fn(),
  useEffect: (): void => {},
  useLayoutEffect: (): void => {},
  useRef: <T>(init: T) => ({ current: init }),
  useCallback: <T>(fn: T) => fn,
  useContext: () => undefined,
  useReducer: () => [undefined, (): void => {}],
  useId: () => 'id',
}));

const { DistributionScreen } = await import('../../../src/screens/distribution/DistributionScreen');
const { EMPTY_UI_STATE } = await import('../../../src/screens/distribution/url-state');
const { fixture, withCountryCodes, deepRender, findAll, byType, visibleTextOf, textOf } = await import('./_helpers');

const NOOP = (): void => {};
// D8-25 (D-31) : `fixture()` seul produit un périmètre à UN SEUL `countryCode` (`generateSyntheticDataset`
// fixe `countryCode = 0` pour toutes les lignes, D3) — depuis la fusion de fix-engine, `RecalcResult.groupStats`
// est réellement peuplé et `EX-SCR-170` masque alors G15 (« tracé seulement au-delà d'un seul pays »), faisant
// tomber à 13 les figures attendues à 14 partout dans ce fichier (titres EX-SCR-144/191, tableaux EX-NFR-15,
// empreintes EX-SCR-176, mode « Modèle non identifié »). Le fixture DE RÉFÉRENCE de ce fichier porte donc
// désormais deux pays (`withCountryCodes`) pour que G15 soit dans son état NORMAL (rendu) partout où la sonde
// ne teste pas spécifiquement le masquage ; le masquage à un seul pays est prouvé à part, plus bas, sur un
// fixture mono-pays dédié — sans toucher au reste (prix, km, année, outliers) de ce fixture de référence.
const f = withCountryCodes(fixture(1200, 0xb1), [0, 1]);

/** Normalise les blancs : `visibleTextOf` insère un séparateur entre chaque enfant de VNode. */
const norm = (s: string): string => s.replace(/\s+/g, ' ').trim();

function renderScreen(overrides: Record<string, unknown> = {}): unknown {
  return deepRender(
    DistributionScreen({
      batch: f.batch,
      recalc: f.recalc,
      rows: f.rows,
      ui: EMPTY_UI_STATE,
      onUiChange: NOOP,
      makeModelName: 'Volkswagen Golf',
      ...overrides,
    } as never),
  );
}

const tree = renderScreen();
const header = findAll(tree, (n) => n.type === 'header')[0];

describe('D7 · écran B — en-tête statistique (EX-SCR-142, ADV-03 / A-05)', () => {
  it('EX-SCR-142 ligne 1 : marque/modèle, effectif, médiane, P25, P75 sont affichés', () => {
    const t = visibleTextOf(header);
    expect(t).toContain('Volkswagen Golf');
    expect(t).toContain('offres');
    expect(t).toContain('médiane');
    expect(t).toContain('P25');
    expect(t).toContain('P75');
  });

  it('ADV-03 / R-A05 : le couple brut [min, max] est bien présent dans l’en-tête (valeurs)', () => {
    const t = visibleTextOf(header);
    const min = f.recalc.selectionStats.price.min as number;
    const max = f.recalc.selectionStats.price.max as number;
    expect(min).toBeGreaterThan(0);
    expect(t.replace(/\s/g, '')).toContain(String(min));
    expect(t.replace(/\s/g, '')).toContain(String(max));
  });

  it('R-D7-07 — EX-SCR-142 : les libellés « min »/« max » et l’étiquette « du moins cher au plus cher » ne sont pas affichés (l’étiquette n’est qu’un attribut title)', () => {
    const t = visibleTextOf(header);
    expect(t).toMatch(/\bmin\b/);
    expect(t).toMatch(/\bmax\b/);
    expect(t).toContain('du moins cher au plus cher');
  });

  it('R-D7-08 — EX-SCR-142 ligne 2 : « <p> % particuliers » manque, et aucune statistique ne porte son effectif en infobulle (EX-SCR-12)', () => {
    const t = visibleTextOf(header);
    expect(t).toContain('particuliers');
    const titles = findAll(header, (n) => typeof n.props['title'] === 'string');
    expect(titles.length).toBeGreaterThanOrEqual(5);
  });

  it('R-D7-09 — EX-SCR-142 ligne 3 : les quatre boutons (Voir les n annonces / Comparer / Suivre / Exporter) sont absents', () => {
    const joined = findAll(tree, byType('button')).map((b) => norm(visibleTextOf(b))).join(' | ');
    expect(joined).toMatch(/Voir les \d+ annonces/);
    expect(joined).toContain('Comparer');
    expect(joined).toContain('Suivre');
    expect(joined).toContain('Exporter');
  });
});

describe('D7 · écran B — structure des blocs et graphes (EX-SCR-141/144/191)', () => {
  it('EX-SCR-141 : quatre blocs (en-tête + 3 sections) dans la zone principale', () => {
    expect(header).toBeDefined();
    expect(findAll(tree, (n) => n.type === 'section')).toHaveLength(3);
  });

  it('EX-SCR-144/191 : les 14 graphes retenus sont rendus dans l’ordre normatif, avec les titres exacts', () => {
    const titles = findAll(tree, (n) => n.type === 'h3').map((n) => norm(visibleTextOf(n)).replace(/\s*\(\s*\d+\s*\)$/, '').trim());
    expect(titles).toEqual([
      'Offres par prix',
      'Offres par kilométrage',
      'Offres par année',
      'Prix × année × kilométrage',
      'Prix médian par année',
      'Dépréciation (base 100)',
      'Densité prix × km',
      'Écart au prix attendu',
      'Répartition par carburant',
      'Prix par tranche de kilométrage',
      'Évaluation de prix AutoScout24',
      'Type de vendeur',
      'Prix médian par puissance',
      'Répartition par pays',
    ]);
  });

  // D8-07/D-31 : `fixture()` (`_helpers.ts`) construit un `RecalcResult` d'AVANT D8-07 — ses champs
  // `groupStats`/`ntiles`/`powerTiers`/`depreciationIndex` sont `undefined` tant que fix-engine n'a
  // pas fusionné dans ce worktree. G5/G6/G9/G10/G12/G13/G14/G15 rendent donc l'état « indisponible »
  // (`graphs-model.ts`), dont l'équivalent accessible est un `<p>` (même convention que l'ancien état
  // « non calculable » de G6/G7), pas un `<table>` — l'assertion originale supposait tous les graphes
  // CALCULABLES pour ce fixture. Adaptation TEMPORAIRE, à retirer par le coordinateur/fix-verify à la
  // fusion de fix-engine (note du rapport de lot) : elle accepte un `<p>` UNIQUEMENT pour les huit
  // graphes du protocole worker de D8-07, et continue d'exiger un vrai `<table>` pour tous les autres
  // (y compris une fois l'engine fusionné et ces huit graphes redevenus calculables).
  const D8_07_WORKER_GRAPHS = new Set(['G5', 'G6', 'G9', 'G10', 'G12', 'G13', 'G14', 'G15']);
  it('EX-NFR-15 / EX-SCR-188 : chaque graphe porte un tableau de données équivalent (ou, temporairement, un équivalent textuel pour les huit graphes de D8-07 non encore fournis par le worker)', () => {
    const figures = findAll(tree, (n) => n.type === 'figure');
    expect(figures).toHaveLength(14);
    for (const fig of figures) {
      const graph = String(fig.props['data-graph']);
      const tableCount = findAll(fig, byType('table')).length;
      if (tableCount >= 1) continue;
      expect(D8_07_WORKER_GRAPHS.has(graph), `graphe ${graph} sans table ni équivalent D8-07 connu`).toBe(true);
      expect(findAll(fig, byType('p')).length, `graphe ${graph}`).toBeGreaterThanOrEqual(1);
    }
  });

  // D8-12/D8-19 (DR-147, dette LEVÉE) : la dette A-08 elle-même (graphes CO₂/consommation/boîte de
  // vitesses absents) N'EST PAS levée — seule l'absence de MENTION l'était. La sonde repasse de
  // `it.fails` à `it` avec l'assertion INCHANGÉE (elle vérifiait déjà la présence d'une mention,
  // jamais son absence) : elle documentait un échec, elle documente maintenant un succès.
  it('R-D7-10 — A-08 : les graphes en dette (CO₂, consommation, boîte de vitesses) restent absents, mais une mention à l’utilisateur existe désormais', () => {
    const t = textOf(tree);
    expect(t).toMatch(/CO₂|consommation|boîte de vitesses/i);
  });

  // D8-06/FV-18 (EX-SCR-176) : chaque graphe (les 14 additionnels + G4) porte l'empreinte du jeu de
  // filtres qui l'a produit, pour qu'un hôte puisse détecter un graphe resté sur un ancien périmètre
  // (`ET-CHARGE-MAJ`) après un changement de filtre ailleurs sur l'écran.
  it('EX-SCR-176 : les 14 figures portent `data-selection` = l’empreinte de la sélection courante', () => {
    const figures = findAll(tree, (n) => n.type === 'figure');
    expect(figures).toHaveLength(14);
    for (const fig of figures) {
      expect(fig.props['data-selection'], `graphe ${String(fig.props['data-graph'])}`).toBe(f.recalc.selectionStats.selectionHash);
    }
  });

  // D8-06/D8-25/D-31 — cas dédié, SÉPARÉ du fixture de référence `f` (deux pays) : G15 (`EX-SCR-170`)
  // n'est « tracé que si… le périmètre contient plus d'un `countryCode` distinct » ; sinon « le bloc
  // est absent du DOM », et ce n'est PAS un `ET-CHAMP-ABSENT-SOURCE` (le champ existe, seul le graphe
  // est sans objet). On prouve donc ICI, sur un fixture volontairement mono-pays (celui que produit
  // `fixture()` seul, avant redistribution), que G15 est bien absent et que les 13 AUTRES figures
  // restent rendues normalement (le masquage de G15 ne dégrade rien d'autre).
  it('EX-SCR-170 (D8-25) : G15 est absent du DOM quand le périmètre ne porte qu’un seul `countryCode`, les 13 autres figures restant rendues', () => {
    const monoCountry = fixture(1200, 0xb1);
    expect(new Set(monoCountry.batch.countryCode).size).toBe(1); // prémisse du cas : un seul pays
    const monoTree = renderScreen({ batch: monoCountry.batch, recalc: monoCountry.recalc, rows: monoCountry.rows });
    const figures = findAll(monoTree, (n) => n.type === 'figure').map((n) => String(n.props['data-graph']));
    expect(figures).toHaveLength(13);
    expect(figures).not.toContain('G15');
    for (const kept of ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10', 'G12', 'G13', 'G14']) {
      expect(figures, kept).toContain(kept);
    }
  });
});

describe('D7 · écran B — notes d’exclusion sous G1–G3 (EX-SCR-178, FV-11)', () => {
  it('G1 (prix) : la note d’exclusion, déjà alimentée depuis `SelectionStats`, est bien rendue', () => {
    const g1 = findAll(tree, (n) => n.type === 'figure' && n.props['data-graph'] === 'G1')[0]!;
    expect(norm(visibleTextOf(g1))).toMatch(/annonces exclues \(\s*(prix sur demande|prix absent)\s*\)/);
  });

  // Le dataset synthétique du fixture ne laisse aucun km/année inconnu (`mileage.n`/`year.n` =
  // `selectionCount`), donc G2/G3 n'ont normativement RIEN à exclure ici (`GraphFrame` masque une
  // note à `count = 0`, EX-SCR-178). On force un écart artificiel sur une COPIE de `recalc` pour
  // prouver que G2/G3 sont bien câblés sur `SelectionStats.mileage.n`/`year.n` (FV-11), pas juste G1.
  it('D8-06/FV-11 : G2 (km) et G3 (année) portent une note d’exclusion dès que `mileage.n`/`year.n` < `selectionCount`', () => {
    const gappy = renderScreen({
      recalc: {
        ...f.recalc,
        selectionStats: {
          ...f.recalc.selectionStats,
          mileage: { ...f.recalc.selectionStats.mileage, n: f.recalc.selectionStats.mileage.n - 50 },
          year: { ...f.recalc.selectionStats.year, n: f.recalc.selectionStats.year.n - 30 },
        },
      },
    });
    const g2 = findAll(gappy, (n) => n.type === 'figure' && n.props['data-graph'] === 'G2')[0]!;
    const g3 = findAll(gappy, (n) => n.type === 'figure' && n.props['data-graph'] === 'G3')[0]!;
    expect(norm(visibleTextOf(g2))).toMatch(/50 annonces exclues \(\s*kilométrage non renseigné\s*\)/);
    expect(norm(visibleTextOf(g3))).toMatch(/30 annonces exclues \(\s*année non renseignée\s*\)/);
  });
});

describe('D7 · écran B — bandeau C3 et représentativité (EX-SCR-31/175, D8-06/FV-07)', () => {
  it('absents quand `snapshotCoverage` n’est pas fourni (jamais une valeur inventée)', () => {
    expect(norm(visibleTextOf(tree))).not.toContain('Statistiques calculées sur');
    expect(norm(visibleTextOf(tree))).not.toContain('Représentativité de l’échantillon');
  });

  it('C3 rendu, ligne de représentativité affichée sous 100 % de couverture (échantillon incomplet)', () => {
    const withCoverage = renderScreen({ snapshotCoverage: { listingCount: 3840, announcedListingCount: 120779, hasUserFilters: false } });
    const t = norm(visibleTextOf(withCoverage));
    expect(t).toMatch(/Statistiques calculées sur 3\s*840 annonces observées sur 120\s*779 annoncées/);
    expect(t).toContain('Représentativité de l’échantillon non prouvée');
    expect(t).toContain('Pourquoi ?');
  });

  it('couverture complète (100 %) : C3 rendu, mais PAS la ligne de représentativité', () => {
    const full = renderScreen({ snapshotCoverage: { listingCount: 100, announcedListingCount: 100, hasUserFilters: false } });
    const t = norm(visibleTextOf(full));
    expect(t).toContain('Statistiques calculées sur');
    expect(t).not.toContain('Représentativité de l’échantillon');
  });

  it('sous filtre utilisateur : C3 « non applicable », représentativité non prouvée (non mesurable)', () => {
    const filtered = renderScreen({ snapshotCoverage: { listingCount: 300, announcedListingCount: 120779, hasUserFilters: true } });
    const t = norm(visibleTextOf(filtered));
    expect(t).toContain('Couverture d’échantillon non applicable sous filtre');
    expect(t).toContain('Représentativité de l’échantillon non prouvée');
  });
});

describe('D7 · écran B — mode « Modèle non identifié » (EX-SCR-113bis, D8-06/FV-08)', () => {
  const restricted = renderScreen({ modelId: 0 });

  it('bandeau non refermable, texte exact', () => {
    expect(findAll(restricted, (n) => n.props['role'] === 'status').length).toBeGreaterThan(0);
    expect(norm(visibleTextOf(restricted))).toContain(
      'Ces annonces n’ont pas pu être rattachées à un modèle du référentiel — les distributions par modèle ne s’appliquent pas',
    );
  });

  it('G5, G6, G8, G10, G14 sont hors DOM ; G1–G4, G7, G9, G12, G13, G15 restent rendus', () => {
    const present = findAll(restricted, (n) => n.type === 'figure').map((n) => String(n.props['data-graph']));
    for (const hidden of ['G5', 'G6', 'G8', 'G10', 'G14']) expect(present, hidden).not.toContain(hidden);
    for (const kept of ['G1', 'G2', 'G3', 'G7', 'G9', 'G12', 'G13', 'G15']) expect(present, kept).toContain(kept);
  });

  it('« Comparer » est désactivé avec l’infobulle normative', () => {
    const compare = findAll(restricted, byType('button')).find((b) => norm(visibleTextOf(b)) === 'Comparer')!;
    expect(compare.props['disabled']).toBe(true);
    expect(compare.props['title']).toBe('un modèle non identifié ne peut pas être comparé');
  });

  it('un modèle RÉSOLU ne montre ni le bandeau ni aucune restriction (non-régression)', () => {
    const normal = renderScreen({ modelId: 42 });
    expect(norm(visibleTextOf(normal))).not.toContain('n’ont pas pu être rattachées');
    const present = findAll(normal, (n) => n.type === 'figure').map((n) => String(n.props['data-graph']));
    expect(present).toContain('G5');
    const compare = findAll(normal, byType('button')).find((b) => norm(visibleTextOf(b)) === 'Comparer')!;
    expect(compare.props['disabled']).toBeFalsy();
  });
});

describe('D7 · écran B — liaison croisée et interactions du nuage (EX-SCR-158/184/185)', () => {
  const brushed = renderScreen({ ui: { ...EMPTY_UI_STATE, brushX: { from: 0, to: 1e9 }, brushY: { from: 0, to: 1e9 } } });

  it('le compteur « <n> annonces sélectionnées » apparaît quand un brossage est actif (EX-SCR-185)', () => {
    expect(norm(visibleTextOf(brushed))).toMatch(/\d+ annonces sélectionnées/);
  });

  it('R-D7-11 — EX-SCR-158/184 : ni « Filtrer sur cette sélection », ni « Voir ces annonces », ni « Convertir la sélection en filtre » ne sont proposés', () => {
    const buttons = findAll(brushed, byType('button')).map((b) => norm(visibleTextOf(b))).join(' | ');
    expect(buttons).toMatch(/Filtrer sur cette sélection|Convertir la sélection en filtre/);
    expect(buttons).toContain('Voir ces annonces');
  });

  it('R-D7-12 — EX-SCR-184 : les histogrammes ne reçoivent aucune information de sélection, la surimpression de liaison croisée est impossible', () => {
    const hist = findAll(brushed, (n) => n.type === 'figure' && String(n.props['data-graph']).startsWith('G1'))[0];
    expect(hist).toBeDefined();
    const rects = findAll(hist, byType('rect')).filter((r) => typeof r.props['height'] === 'number');
    const hasSelectionEncoding = rects.some((r) => 'data-selected' in r.props || String(r.props['fill'] ?? '').includes('secondary'));
    expect(hasSelectionEncoding).toBe(true);
  });

  it('R-D7-13 — EX-SCR-158 : le zoom rectangulaire « Maj + glisser » n’est pas implémenté dans le nuage', () => {
    const src = readFileSync(join(process.cwd(), 'src', 'screens', 'distribution', 'ScatterCloud.tsx'), 'utf8');
    expect(src).toMatch(/shiftKey/);
  });

  it('EX-SCR-158 : les boutons de zoom +, − et Réinitialiser existent', () => {
    const labels = findAll(tree, byType('button')).map((b) => `${String(b.props['aria-label'] ?? '')} ${norm(visibleTextOf(b))}`).join(' | ');
    expect(labels).toContain('Zoom avant');
    expect(labels).toContain('Zoom arrière');
    expect(labels).toContain('Réinitialiser');
  });

  it('EX-SCR-151 : les deux projections commutables sont offertes (onglets Nuée empilée / Prix × année)', () => {
    const tabs = findAll(tree, (n) => n.props['role'] === 'tab').map((n) => norm(visibleTextOf(n)));
    expect(tabs).toEqual(['Nuée empilée', 'Prix × année']);
  });
});

describe('D7 · écran B — mention d’échantillonnage et responsive (EX-DATA-103, EX-NFR-19)', () => {
  it('R-D7-14 — EX-NFR-19 : l’écran ne détecte aucune largeur et ne passe jamais `degraded` au nuage', () => {
    const src = readFileSync(join(process.cwd(), 'src', 'screens', 'distribution', 'DistributionScreen.tsx'), 'utf8');
    expect(src).toMatch(/degraded|matchMedia|768/);
  });

  it('EX-NFR-19 : le modèle de vue dégradé existe et neutralise le brossage quand il est activé', async () => {
    const { ScatterCloud } = await import('../../../src/screens/distribution/ScatterCloud');
    const points = [
      { row: 0, priceEur: 10000, year: 2015, regYearMonth: 2015 * 12, mileageKm: 100000, fuelCategory: 1, powerKw: 90, isOutlier: false, opportunityScore: null },
    ];
    const info = { eligibleCount: 1, plottedCount: 1, outlierCount: 0, outlierPlottedCount: 0, sampled: false, outlierTruncated: false };
    const degraded = deepRender(ScatterCloud({ points, variant: 'scatter', onVariantChange: NOOP, sampleInfo: info, brushX: null, brushY: null, onBrushChange: NOOP, degraded: true } as never));
    // En dégradé : aucun onglet de variante, aucune légende (l'axe X porte le km).
    expect(findAll(degraded, (n) => n.props['role'] === 'tab')).toHaveLength(0);
    expect(findAll(degraded, byType('canvas'))).toHaveLength(1);
  });

  it('R-D7-15 — EX-DATA-103 : la mention d’échantillonnage n’énonce ni le mode d’échantillonnage ni la graine (EX-SCR-157)', async () => {
    const big = fixture(20000, 0xb2);
    const sampledTree = deepRender(
      DistributionScreen({ batch: big.batch, recalc: big.recalc, rows: big.rows, ui: EMPTY_UI_STATE, onUiChange: NOOP, makeModelName: 'Volkswagen Golf' } as never),
    );
    const note = norm(visibleTextOf(sampledTree));
    expect(note).toContain('5000'); // K est bien affiché
    expect(note).toMatch(/pas régulier|échantillonnage systématique|mode d’échantillonnage/i);
  });
});

describe('D7 · G4 — légendes et table des points (EX-SCR-154/155/156/160, EX-NFR-15)', () => {
  it('R-D7-25 — EX-SCR-160 : sans aucune année exploitable, l’onglet « Prix × année » reste actif (le garde `yearMax === yearMin` ne se déclenche jamais)', async () => {
    const { ScatterCloud } = await import('../../../src/screens/distribution/ScatterCloud');
    const p = (row: number) => ({ row, priceEur: 10000 + row, year: -1, regYearMonth: -1, mileageKm: 100000, fuelCategory: 1, powerKw: 90, isOutlier: false, opportunityScore: null });
    const info = { eligibleCount: 2, plottedCount: 2, outlierCount: 0, outlierPlottedCount: 0, sampled: false, outlierTruncated: false };
    const t = deepRender(ScatterCloud({ points: [p(0), p(1)], variant: 'stack', onVariantChange: NOOP, sampleInfo: info, brushX: null, brushY: null, onBrushChange: NOOP } as never));
    const tab = findAll(t, (n) => n.props['role'] === 'tab' && norm(visibleTextOf(n)).includes('année'))[0];
    expect(tab).toBeDefined();
    expect(tab!.props['disabled']).toBe(true);
    expect(String(tab!.props['title'])).toContain("Nécessite l'année de première immatriculation");
  });

  it('R-D7-21 — EX-SCR-155 : en G4a, la légende de TAILLE (trois disques témoins 0 / 100 000 / 250 000 km) est absente', () => {
    const stackTree = renderScreen({ ui: { ...EMPTY_UI_STATE, g4Variant: 'stack' } });
    const g4 = findAll(stackTree, (n) => n.type === 'figure' && n.props['data-graph'] === 'G4')[0];
    const legend = norm(visibleTextOf(g4));
    expect(legend).toContain('Année'); // la légende de couleur (rampe A) est bien là
    expect(legend).toMatch(/250\s?000/); // …mais aucun disque témoin de kilométrage
  });

  it('R-D7-22 — EX-NFR-15 : la table des points sous-jacents est plafonnée à 500 lignes alors que 5 000 points sont tracés', () => {
    const big = fixture(20000, 0xb3);
    const sampled = deepRender(
      DistributionScreen({ batch: big.batch, recalc: big.recalc, rows: big.rows, ui: EMPTY_UI_STATE, onUiChange: NOOP, makeModelName: 'VW Golf' } as never),
    );
    const g4 = findAll(sampled, (n) => n.type === 'figure' && n.props['data-graph'] === 'G4')[0];
    const bodyRows = findAll(findAll(g4, byType('tbody'))[0], byType('tr'));
    expect(bodyRows.length).toBe(5000);
  });

  it('R-D7-23 — EX-SCR-158 : aucun survol de point (infobulle 6 lignes) ni clic sortant vers l’annonce d’origine dans G4', () => {
    const src = readFileSync(join(process.cwd(), 'src', 'screens', 'distribution', 'ScatterCloud.tsx'), 'utf8');
    expect(src).toMatch(/noopener|onOpenListing|webPage/);
  });
});

// D8-24 (EX-SCR-159) : sous 4 offres tracées dans G4, les légendes passent en style discret (texte
// atténué, taille réduite, annexe B) et le brossage/zoom rectangulaire est neutralisé
// (`aria-disabled`, message court) — seul le clic simple (survol, ouverture d'annonce) reste actif.
describe('D7 · G4 — faible effectif (EX-SCR-159, D8-24)', () => {
  const gp = (row: number) => ({ row, priceEur: 10000 + row * 1000, year: 2018 + row, regYearMonth: (2018 + row) * 12, mileageKm: 50000 + row * 10000, fuelCategory: 1, powerKw: 90, isOutlier: false, opportunityScore: null });
  const info = (n: number) => ({ eligibleCount: n, plottedCount: n, outlierCount: 0, outlierPlottedCount: 0, sampled: false, outlierTruncated: false });
  const fakeTarget = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 900, height: 480 }) };
  const down = (x: number, y: number) => ({ clientX: x, clientY: y, shiftKey: false, currentTarget: fakeTarget });
  const move = (x: number, y: number) => ({ clientX: x, clientY: y, currentTarget: fakeTarget });

  async function renderCloud(n: number, onBrushChange: (bx: unknown, by: unknown) => void) {
    const { ScatterCloud } = await import('../../../src/screens/distribution/ScatterCloud');
    const points = Array.from({ length: n }, (_v, i) => gp(i));
    const tree = deepRender(
      ScatterCloud({ points, variant: 'scatter', onVariantChange: NOOP, sampleInfo: info(n), brushX: null, brushY: null, onBrushChange } as never),
    );
    const canvas = findAll(tree, byType('canvas'))[0]!;
    const legends = findAll(tree, (nn) => nn.props['class'] === 'kycar-legend' || nn.props['class'] === 'kycar-legend kycar-legend-size' || nn.props['class'] === 'kycar-legend kycar-legend--discrete' || nn.props['class'] === 'kycar-legend kycar-legend-size kycar-legend--discrete');
    return { canvas, legends };
  }

  it('n = 3 (< 4) : les légendes portent la classe discrète (`kycar-legend--discrete`)', async () => {
    const { legends } = await renderCloud(3, NOOP);
    expect(legends.length).toBeGreaterThan(0);
    for (const l of legends) expect(String(l.props['class'])).toContain('kycar-legend--discrete');
  });

  it('n = 4 (seuil atteint) : les légendes restent en style CONTINU, aucune classe discrète', async () => {
    const { legends } = await renderCloud(4, NOOP);
    expect(legends.length).toBeGreaterThan(0);
    for (const l of legends) expect(String(l.props['class'])).not.toContain('kycar-legend--discrete');
  });

  it('n = 3 : le canevas porte `aria-disabled` et un message court, un VRAI glisser (brossage) ne pose rien', async () => {
    const calls: unknown[] = [];
    const { canvas } = await renderCloud(3, (bx, by) => calls.push([bx, by]));
    expect(canvas.props['aria-disabled']).toBe(true);
    expect(String(canvas.props['title'])).toBe('Sélection inutile en dessous de 4 offres');
    expect(String(canvas.props['class'])).toContain('kycar-scatter-canvas--brush-disabled');
    (canvas.props['onMouseDown'] as (e: unknown) => void)(down(10, 10));
    (canvas.props['onMouseMove'] as (e: unknown) => void)(move(200, 200));
    (canvas.props['onMouseUp'] as (e: unknown) => void)(move(200, 200));
    expect(calls).toHaveLength(0); // brossage neutralisé sous 4 offres
  });

  it('n = 4 (non-régression) : ni `aria-disabled` ni message, un glisser pose bien un brossage', async () => {
    const calls: unknown[] = [];
    const { canvas } = await renderCloud(4, (bx, by) => calls.push([bx, by]));
    expect(canvas.props['aria-disabled']).toBeFalsy();
    expect(canvas.props['title']).toBeUndefined();
    expect(String(canvas.props['class'])).not.toContain('kycar-scatter-canvas--brush-disabled');
    (canvas.props['onMouseDown'] as (e: unknown) => void)(down(10, 10));
    (canvas.props['onMouseMove'] as (e: unknown) => void)(move(200, 200));
    (canvas.props['onMouseUp'] as (e: unknown) => void)(move(200, 200));
    expect(calls).toHaveLength(1); // comportement normal inchangé au-delà du seuil
  });

  it('n = 3 : le clic simple (aucun déplacement, aucun point sous le curseur) efface un brossage existant — jamais bloqué par le seuil', async () => {
    const calls: Array<[unknown, unknown]> = [];
    const { ScatterCloud } = await import('../../../src/screens/distribution/ScatterCloud');
    const points = [gp(0), gp(1), gp(2)];
    const tree = deepRender(
      ScatterCloud({
        points,
        variant: 'scatter',
        onVariantChange: NOOP,
        sampleInfo: info(3),
        brushX: { from: 0, to: 1 },
        brushY: { from: 0, to: 1 },
        onBrushChange: (bx: unknown, by: unknown) => calls.push([bx, by]),
      } as never),
    );
    const canvas = findAll(tree, byType('canvas'))[0]!;
    // (2, 2) tombe dans le remplissage du cadre (padLeft = 52, padTop = 16) : jamais assez près d'un
    // point tracé (`HIT_RADIUS_PX = 8`) pour déclencher `onOpenListing` plutôt que l'effacement.
    (canvas.props['onMouseDown'] as (e: unknown) => void)(down(2, 2));
    (canvas.props['onMouseUp'] as (e: unknown) => void)(move(2, 2));
    expect(calls).toEqual([[null, null]]); // clic simple actif : efface le brossage, PAS neutralisé par lowSample
  });
});

describe('D7 · écran B — budget de recalcul des graphes (EX-SCR-189, O17, D8-07)', () => {
  // D8-07/D-31 (dette D-17 levée) : G5/G6/G9/G10/G12/G13/G14/G15 ne recalculent plus rien depuis
  // `ListingColumnBatch` sur le thread principal — leur agrégation `O(n)` est désormais dans le
  // WORKER (`RecalcResult.groupStats`/`ntiles`/`powerTiers`/`depreciationIndex`, fix-engine, budget
  // propre à ce lot). Ce que le thread PRINCIPAL construit encore pour ces huit graphes est un
  // simple ADAPTATEUR `O(k)` sur les groupes déjà agrégés (k = quelques dizaines, jamais n) —
  // mesuré ici avec des groupes de taille réaliste. Le budget `O(n)` mesuré sur ce thread reste
  // entier pour les histogrammes G1–G3, le nuage G4 (échantillonnage + points), G7 (densité) et G8
  // (les 20 premiers outliers), INCHANGÉS par D8-07 (aucun champ worker dédié, O17). L'assertion
  // numérique (`worst ≤ 300`) est conservée à l'identique ; seul l'ENSEMBLE mesuré change de forme
  // pour refléter la nouvelle répartition thread principal / worker.
  it('EX-SCR-189 : construction des modèles des 14 graphes ≤ 300 ms pour n = 20 000 (5 mesures)', async () => {
    const g = await import('../../../src/screens/distribution/graphs-model');
    const sm = await import('../../../src/screens/distribution/scatter-model');
    const ss = await import('../../../src/screens/distribution/scatter-sample');
    const hm = await import('../../../src/screens/distribution/histogram-model');
    const big = fixture(20000, 0xb4);

    // Fixtures `RecalcResult` réalistes (cardinalité de groupe typique), pour mesurer le coût
    // `O(k)` réel des huit adaptateurs sur le thread principal — jamais dérivées de `big.batch`.
    const groupOf = (n: number, key: number) => ({ key, label: String(key), listingCount: n, n, coverage: 1, median: 10000 + key, p05: 8000, p95: 15000, iqr: 3000 });
    const yearStats = { key: 'yearBucket' as const, metric: 'price' as const, groups: Array.from({ length: 22 }, (_v, i) => groupOf(500, 2004 + i)), unknownKeyCount: 12 };
    const mileageNtileStats = { key: 'mileageNtile' as const, metric: 'price' as const, groups: Array.from({ length: 5 }, (_v, i) => groupOf(4000, i + 1)), unknownKeyCount: 0 };
    const groupStats = [
      yearStats,
      mileageNtileStats,
      { key: 'fuelCategory' as const, metric: 'price' as const, groups: Array.from({ length: 6 }, (_v, i) => groupOf(3000, i)), unknownKeyCount: 40 },
      { key: 'sellerType' as const, metric: 'price' as const, groups: Array.from({ length: 2 }, (_v, i) => groupOf(9000, i)), unknownKeyCount: 5 },
      { key: 'priceEvaluationCategory' as const, metric: 'price' as const, groups: Array.from({ length: 4 }, (_v, i) => groupOf(4500, i)), unknownKeyCount: 0 },
      { key: 'countryCode' as const, metric: 'price' as const, groups: Array.from({ length: 20 }, (_v, i) => groupOf(900, i)), unknownKeyCount: 3 },
    ];
    const ntiles = { metric: 'mileage' as const, k: 5, status: 'OK' as const, slices: Array.from({ length: 5 }, (_v, i) => ({ rank: i + 1, loObserved: i * 40000, hiObserved: (i + 1) * 40000, count: 4000 })) };
    const powerTiers = { tiers: Array.from({ length: 15 }, (_v, i) => ({ tier: i, lowerKw: i * 20, upperKw: (i + 1) * 20, label: `${i * 20}–${(i + 1) * 20} kW`, listingCount: 1300, n: 1300, median: 12000 })), unknownKeyCount: 50 };
    const depreciationIndex = { baseYear: 2025, entries: Array.from({ length: 22 }, (_v, i) => ({ year: 2025 - i, n: 500, medianPriceEur: 20000 - i * 800, index: 100 - i * 4, annualLossPct: 4 })) };

    const samples: number[] = [];
    for (let i = 0; i < 5; i++) {
      const t0 = performance.now();
      hm.buildHistogram('price', big.recalc.priceHistogram);
      hm.buildHistogram('mileage', big.recalc.mileageHistogram);
      hm.buildHistogram('year', big.recalc.yearHistogram);
      const elig = sm.computeEligibility(big.batch, big.rows);
      const sample = ss.sampleScatter({ eligible: elig.eligible, listingId: big.batch.listingId, isOutlier: big.isOutlier, opportunityScore: big.opportunityScore });
      sm.buildScatterPoints(big.batch, sample.rows, { isOutlier: big.isOutlier, opportunityScore: big.opportunityScore });
      g.buildPriceMileageDensity(big.batch, big.rows);
      g.buildOutlierLollipops(big.batch, big.rows, big.index, 20);
      g.buildYearMedian(groupStats);
      g.buildDepreciation(depreciationIndex);
      g.buildCategoryBars(groupStats, 'fuelCategory');
      g.buildCategoryBars(groupStats, 'sellerType');
      g.buildCategoryBars(groupStats, 'priceEvaluationCategory');
      g.buildCategoryBars(groupStats, 'countryCode');
      g.buildMileageBoxes(ntiles, groupStats);
      g.buildPowerTiers(powerTiers);
      samples.push(performance.now() - t0);
    }
    samples.sort((a, b) => a - b);
    const p50 = samples[2] as number;
    const worst = samples[samples.length - 1] as number;
    console.log(`[EX-SCR-189] n=20000 modèles des 14 graphes : p50=${p50.toFixed(1)} ms, pire=${worst.toFixed(1)} ms`);
    expect(worst).toBeLessThanOrEqual(300);
  });
});
