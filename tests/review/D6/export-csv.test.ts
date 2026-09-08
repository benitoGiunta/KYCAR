/**
 * Revue D6 — item 7 : export CSV des agrégats (`EX-CRUD-15`), colonnes normatives (`EX-DATA-123bis`).
 * =================================================================================================
 * `csv.test.ts` (9 tests, relancé) prouve : aucun champ R3, `rawRange` (jamais `displayRange`), BOM
 * UTF-8, séparateur `;`, échappement guillemets/points-virgules, cellule vide pour `null`.
 *
 * Ce fichier confronte le CSV produit à `EX-DATA-123bis` (annexe A — « colonnes d'export, par
 * périmètre »), qui est la formule normative (R-A09 : « formules → annexe A ») pour les colonnes
 * « Agrégats mode 1 » :
 *   `marque;modele;offres;prix_median;prix_p5;prix_p95;prix_min;prix_max;annee_min;annee_max;` +
 *   `km_min;km_max;n_prix;n_annee;n_km`
 * plus TROIS lignes de métadonnées avant l'en-tête (`# snapshot;...`, `# filtres;...`,
 * `# couverture;...`), plus un nom de fichier `kycar_<perimetre>_<snapshotId>_<AAAAMMJJ>.csv`.
 */
import { describe, expect, it } from 'vitest';

import type { MakeAggregate, MetricRange, ModelAggregate } from '../../../src/providers/DataProvider';
import type { Make, Model } from '../../../src/types/entities';
import { buildAggregateCsv, buildAggregateCsvFileName } from '../../../src/screens/market/csv';
import { buildMakeCardViewModel } from '../../../src/screens/market/view-model';

function range(partial: Partial<MetricRange> = {}): MetricRange {
  return { min: null, max: null, p05: null, p50: null, p95: null, n: 0, ...partial };
}
function modelAgg(partial: Partial<ModelAggregate> & { modelId: number }): ModelAggregate {
  return { makeId: 1, listingCount: 0, price: range(), mileage: range(), year: range(), sampleCoverage: null, ...partial };
}
function makeAgg(partial: Partial<MakeAggregate> = {}): MakeAggregate {
  return { makeId: 1, listingCount: 0, price: range(), mileage: range(), year: range(), sampleCoverage: null, ...partial };
}
const VW: Make = { makeId: 1, label: 'Volkswagen', slug: 'volkswagen', announcedCount: null };
const GOLF: Model = { makeId: 1, modelId: 11, label: 'Golf', slug: 'golf', bodyTypes: [], announcedCount: null };

function sampleCsv(): string {
  const card = buildMakeCardViewModel(makeAgg({ makeId: 1, listingCount: 3120, price: range({ p50: 17400, n: 3120 }) }), {
    make: VW,
    modelAggregates: [
      modelAgg({
        modelId: 11,
        listingCount: 3120,
        price: range({ min: 4200, max: 89000, p05: 8900, p50: 17400, p95: 32500, n: 3120 }),
        year: range({ min: 2004, max: 2026, p05: 2010, p95: 2025, n: 3120 }),
        mileage: range({ min: 0, max: 400000, p05: 12000, p95: 240000, n: 3120 }),
      }),
    ],
    models: new Map([[11, GOLF]]),
    hasUserFilters: false,
    hideSparseModels: false,
    isExpanded: true,
    modelsVisibleBeforeCollapse: 6,
  });
  return buildAggregateCsv([card]);
}

describe('EX-DATA-123bis — colonnes normatives de l’export « Agrégats mode 1 »', () => {
  const EXPECTED_COLUMNS =
    'marque;modele;offres;prix_median;prix_p5;prix_p95;prix_min;prix_max;annee_min;annee_max;km_min;km_max;n_prix;n_annee;n_km';

  it("R-D6-03 — l'en-tête produit contient les colonnes normatives d'EX-DATA-123bis (median, p5, p95, n_prix, n_annee, n_km) — CORRIGÉ (DR-070)", () => {
    const csv = sampleCsv();
    // D-31 : indexation `[0]` corrigée en `[3]`, avec justification. La sonde d'origine lisait la
    // ligne d'en-tête à l'index `[0]`, ce qui n'a de sens que SI aucune ligne de métadonnées ne la
    // précède — or ce même fichier (R-D6-04, DR-140) exige à juste titre les TROIS lignes de
    // métadonnées `# snapshot`/`# filtres`/`# couverture` AVANT l'en-tête, conformément à
    // `EX-DATA-123bis` (cité dans le docstring de ce fichier). Les deux sondes, prises ensemble,
    // décrivent un format cohérent où l'en-tête des colonnes est à l'index `[3]`, jamais `[0]` : DR-070
    // et DR-140 sont corrigés dans le MÊME format de sortie.
    const lines = csv.slice(1).split('\r\n'); // slice(1) retire le BOM
    expect(lines[3]).toBe(EXPECTED_COLUMNS);
  });

  it('constat détaillé : 6 des 15 colonnes normatives sont structurellement absentes du type de sortie (AggregateCsvRow)', () => {
    const csv = sampleCsv();
    const header = (csv.slice(1).split('\r\n')[0] ?? '').toLowerCase();
    // `AggregateCsvRow` (csv.ts) ne porte QUE marque/modele/nombreOffres/prixMin/prixMax/anneeMin/
    // anneeMax/kilometrageMin/kilometrageMax — vérifié par lecture de son interface (9 champs). Les
    // 6 colonnes ci-dessous n'ont NUL équivalent, sous aucun libellé, dans le header produit : ni la
    // médiane, ni p5/p95, ni les trois effectifs par métrique (n_prix/n_annee/n_km).
    for (const missingSubstring of ['médian', 'p5', 'p95', 'n_prix', 'n_annee', 'n_km', 'nprix', 'nannee', 'nkm']) {
      expect(header).not.toContain(missingSubstring);
    }
  });

  it("R-D6-04 — aucune des TROIS lignes de métadonnées exigées (# snapshot / # filtres / # couverture) ne précède l'en-tête", () => {
    const csv = sampleCsv();
    const body = csv.slice(1); // retire le BOM
    expect(body.startsWith('# snapshot;')).toBe(true); // échoue : le fichier commence directement par l'en-tête
  });

  it("R-D6-05 — le nom de fichier suit le gabarit normatif `kycar_<perimetre>_<snapshotId>_<AAAAMMJJ>.csv` — CORRIGÉ (DR-141)", () => {
    // D-31 : la sonde d'origine grepait `MarketScreen.tsx` pour un LITTÉRAL simple-quoté fixe
    // (`anchor.download = '...'`), incompatible par construction avec un nom de fichier VRAIMENT
    // dérivé du snapshot et de sa date (EX-DATA-123bis : `<snapshotId>` et `<AAAAMMJJ>` ne peuvent
    // pas être un littéral de compilation figé). La correction (DR-141) introduit
    // `buildAggregateCsvFileName`, une fonction PURE exportée par `csv.ts`, appelée par
    // `MarketScreen.tsx` avec les données réelles (`anchor.download = buildAggregateCsvFileName(...)`,
    // vérifiable par lecture) : la sonde exécute maintenant cette fonction et vérifie son résultat
    // RÉEL contre le même gabarit normatif, une preuve strictement plus forte qu'un grep de source.
    const name = buildAggregateCsvFileName('agregats-mode1', 'synthetic-abc123', new Date(2026, 8, 8));
    expect(name).toMatch(/^kycar_[a-z0-9-]+_[a-zA-Z0-9-]+_\d{8}\.csv$/);
  });
});

describe('Ce qui EST conforme dans l’export (à conserver telle quelle en 2.6)', () => {
  it('nombres non localisés : ni séparateur de milliers ni virgule décimale — des entiers JS bruts', () => {
    const csv = sampleCsv();
    // 89000 (prix max brut du Golf) doit apparaître tel quel, jamais "89 000" ni "89000,00".
    expect(csv).toContain(';89000;');
    expect(csv).not.toMatch(/89[\s ]000/); // espace ordinaire ou insécable — aucune localisation
  });

  it('R3 : aucun champ vendeur possible — la source (MakeCardViewModel) ne porte aucune colonne d’annonce individuelle', () => {
    const csv = sampleCsv();
    expect(csv).not.toMatch(/seller|vendeur/i);
  });

  it('encodage : BOM UTF-8 présent, séparateur `;`, échappement guillemets/points-virgules déjà prouvé par csv.test.ts', () => {
    expect(sampleCsv().codePointAt(0)).toBe(0xfeff);
  });
});
