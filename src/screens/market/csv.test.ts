import { describe, expect, it } from 'vitest';

import { scanForbiddenFields } from '../../types/validation';
import type { MakeAggregate, MetricRange, ModelAggregate } from '../../providers/DataProvider';
import type { Make, Model } from '../../types/entities';
import { buildAggregateCsv, buildAggregateCsvRows, toCsvString } from './csv';
import { buildMakeCardViewModel, type MakeCardViewModel } from './view-model';

function range(partial: Partial<MetricRange> = {}): MetricRange {
  return { min: null, max: null, p05: null, p50: null, p95: null, n: 0, ...partial };
}

function modelAgg(partial: Partial<ModelAggregate> & { modelId: number }): ModelAggregate {
  return { makeId: 1, listingCount: 0, price: range(), mileage: range(), year: range(), sampleCoverage: null, ...partial };
}

function makeAgg(partial: Partial<MakeAggregate> = {}): MakeAggregate {
  return { makeId: 1, listingCount: 0, price: range(), mileage: range(), year: range(), sampleCoverage: null, modelCount: null, ...partial };
}

const VW: Make = { makeId: 1, label: 'Volkswagen', slug: 'volkswagen', announcedCount: null };
const GOLF: Model = { makeId: 1, modelId: 11, label: 'Golf', slug: 'golf', bodyTypes: [], announcedCount: null };
const POLO: Model = { makeId: 1, modelId: 12, label: 'Polo', slug: 'polo', bodyTypes: [], announcedCount: null };

function sampleCards(): readonly MakeCardViewModel[] {
  const models = new Map([[11, GOLF], [12, POLO]]);
  const card = buildMakeCardViewModel(makeAgg({ makeId: 1, listingCount: 12480, price: range({ p50: 18900, n: 12480 }) }), {
    make: VW,
    modelAggregates: [
      modelAgg({
        modelId: 11,
        listingCount: 3120,
        price: range({ min: 4200, max: 89000, p05: 8900, p95: 32500, p50: 17400, n: 3120 }),
        year: range({ min: 2004, max: 2026, p05: 2010, p95: 2025, n: 3120 }),
        mileage: range({ min: 0, max: 400000, p05: 12000, p95: 240000, n: 3120 }),
      }),
      modelAgg({ modelId: 12, listingCount: 2410, price: range({ min: 3000, max: 40000, p05: 6000, p95: 20000, n: 2410 }) }),
      modelAgg({ modelId: 0, listingCount: 50 }),
    ],
    models,
    hasUserFilters: false,
    hideSparseModels: false,
    isExpanded: true,
    modelsVisibleBeforeCollapse: 6,
  });
  return [card];
}

describe('buildAggregateCsvRows — EX-CRUD-15 (une ligne par couple marque/modèle affiché)', () => {
  const rows = buildAggregateCsvRows(sampleCards());

  it('produit une ligne par zone-modèle de la carte, y compris « Modèle non identifié »', () => {
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.modele)).toContain('Modèle non identifié');
  });

  it('publie rawRange (min/max BRUTS) ET displayRange (médiane/p5/p95), pour le prix (EX-DATA-123bis)', () => {
    const golfRow = rows.find((r) => r.modele === 'Golf');
    expect(golfRow?.prixMinEur).toBe(4200);
    expect(golfRow?.prixMaxEur).toBe(89000);
    expect(golfRow?.prixMedianEur).toBe(17400);
    expect(golfRow?.prixP5Eur).toBe(8900);
    expect(golfRow?.prixP95Eur).toBe(32500);
  });
});

describe('buildAggregateCsvRows — EX-DATA-64 (table B.2, note « l’export CSV applique le même arrondi que l’écran »), ACC-17', () => {
  // Reproduction exacte de l'écart de la recette (ACC-17, `reports/ACCEPTANCE.md` §8) : les
  // colonnes `prix_median`/`prix_p5`/`prix_p95` du CSV mode 1 étaient écrites BRUTES — décimales
  // (« 12846.5 ») et parfois porteuses de bruit binaire (« 64164.79999999997 »).
  it("un quantile de type 7 non entier (12 846,5 €) est écrit à l'euro entier (12 847), pas brut", () => {
    const cards = [
      buildMakeCardViewModel(makeAgg({ makeId: 1, listingCount: 209 }), {
        make: VW,
        modelAggregates: [
          modelAgg({
            modelId: 11,
            listingCount: 209,
            price: range({ min: 2964, max: 19932.5, p05: 2964, p95: 19932.5, p50: 12846.5, n: 209 }),
          }),
        ],
        models: new Map([[11, GOLF]]),
        hasUserFilters: false,
        hideSparseModels: false,
        isExpanded: true,
        modelsVisibleBeforeCollapse: 6,
      }),
    ];
    const row = buildAggregateCsvRows(cards)[0];
    expect(row?.prixMedianEur).toBe(12847);
    expect(row?.prixMaxEur).toBe(19933); // 19 932,5 -> demi vers l'infini -> 19 933 (jamais 19932.5 brut)
    expect(row?.prixMinEur).toBe(2964);
  });

  it('un bruit binaire de double précision (64 164,79999999997) est absorbé par l’arrondi, jamais exporté tel quel', () => {
    const cards = [
      buildMakeCardViewModel(makeAgg({ makeId: 1, listingCount: 50 }), {
        make: VW,
        modelAggregates: [
          modelAgg({ modelId: 11, listingCount: 50, price: range({ p05: 1000, p95: 64164.79999999997, n: 50 }) }),
        ],
        models: new Map([[11, GOLF]]),
        hasUserFilters: false,
        hideSparseModels: false,
        isExpanded: true,
        modelsVisibleBeforeCollapse: 6,
      }),
    ];
    const row = buildAggregateCsvRows(cards)[0];
    expect(row?.prixP95Eur).toBe(64165);
  });

  it("l'année et le kilométrage BRUTS (min/max) restent des entiers exacts, l'arrondi étant un filet de sécurité, jamais un plancher/plafond de fourchette (réservé à l'écran)", () => {
    const cards = [
      buildMakeCardViewModel(makeAgg({ makeId: 1, listingCount: 50 }), {
        make: VW,
        modelAggregates: [
          modelAgg({
            modelId: 11,
            listingCount: 50,
            year: range({ min: 2004, max: 2026, n: 50 }),
            mileage: range({ min: 0, max: 400000, n: 50 }),
          }),
        ],
        models: new Map([[11, GOLF]]),
        hasUserFilters: false,
        hideSparseModels: false,
        isExpanded: true,
        modelsVisibleBeforeCollapse: 6,
      }),
    ];
    const row = buildAggregateCsvRows(cards)[0];
    expect(row?.anneeMin).toBe(2004);
    expect(row?.anneeMax).toBe(2026);
    expect(row?.kilometrageMin).toBe(0);
    expect(row?.kilometrageMax).toBe(400000);
  });
});

describe('buildAggregateCsvRows — R3 (garde exécutable de D2)', () => {
  const rows = buildAggregateCsvRows(sampleCards());

  it('ne contient AUCUN champ vendeur (R3), pour chaque ligne — garde exécutable de D2', () => {
    for (const row of rows) {
      const issues = scanForbiddenFields(row);
      expect(issues).toEqual([]);
    }
  });

  it("ne contient aucune clé dont le nom évoque un champ vendeur (id/nom/téléphone/email/localisation)", () => {
    const forbiddenNamePattern = /seller|vendeur|phone|telephone|email|address|adresse|city|ville|lat|lon/i;
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        expect(key).not.toMatch(forbiddenNamePattern);
      }
    }
  });
});

describe('toCsvString / buildAggregateCsv — EX-CRUD-14 (BOM UTF-8, séparateur ;)', () => {
  it('commence par le BOM UTF-8 (U+FEFF)', () => {
    const csv = buildAggregateCsv(sampleCards());
    expect(csv.codePointAt(0)).toBe(0xfeff);
  });

  it('utilise le point-virgule comme séparateur, jamais la virgule seule', () => {
    const csv = toCsvString(buildAggregateCsvRows(sampleCards()));
    const firstDataLine = csv.split('\r\n')[1];
    expect(firstDataLine).toContain(';');
  });

  it("l'en-tête porte les 15 colonnes normatives d'EX-DATA-123bis, précédé des 3 lignes de métadonnées", () => {
    const csv = buildAggregateCsv(sampleCards());
    const lines = csv.slice(1).split('\r\n'); // slice(1) retire le BOM
    expect(lines[0]).toMatch(/^# snapshot;/);
    expect(lines[1]).toMatch(/^# filtres;/);
    expect(lines[2]).toMatch(/^# couverture;/);
    expect(lines[3]).toBe(
      'marque;modele;offres;prix_median;prix_p5;prix_p95;prix_min;prix_max;annee_min;annee_max;km_min;km_max;n_prix;n_annee;n_km',
    );
  });

  it('une valeur null (fourchette non calculable) donne une cellule vide, jamais "null"', () => {
    const csv = buildAggregateCsv(sampleCards());
    expect(csv).not.toMatch(/null/i);
  });

  it('échappe une cellule contenant un point-virgule ou un guillemet', () => {
    const rows = [
      {
        marque: 'A;B',
        modele: 'C"D',
        offres: 1,
        prixMedianEur: null,
        prixP5Eur: null,
        prixP95Eur: null,
        prixMinEur: null,
        prixMaxEur: null,
        anneeMin: null,
        anneeMax: null,
        kilometrageMin: null,
        kilometrageMax: null,
        nPrix: 0,
        nAnnee: 0,
        nKm: 0,
      },
    ];
    const csv = toCsvString(rows);
    expect(csv).toContain('"A;B"');
    expect(csv).toContain('"C""D"');
  });
});
