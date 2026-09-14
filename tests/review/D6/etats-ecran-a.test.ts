/**
 * Revue D6 — item 1 : les 6 états rendables de l'écran A.
 * =================================================================================================
 * `state.test.ts` et `view-model.test.ts` (144 tests, lot D6) ont été relancés tels quels via
 * `npx vitest run --no-file-parallelism src/screens/market` (144/144 verts, voir `reports/review/D6.md`
 * §0). Ce fichier sonde le CONTENU TEXTUEL exigé par état (`EX-SCR-23`..`39`, §5.6), au niveau où il
 * est réellement décidé :
 *   - `state.ts` (`deriveScreenAState`) pour le CHOIX de l'état — déjà couvert par `state.test.ts`,
 *     non reproduit ici pour éviter la redite.
 *   - Les LIBELLÉS eux-mêmes sont des littéraux JSX de `MarketScreen.tsx`, un composant Preact à
 *     hooks (`useMemo` inconditionnel en tête de fonction). Un composant à hooks appelé hors du cycle
 *     de rendu Preact (`render()` dans un vrai DOM) lève une exception — reproduit ci-dessous comme
 *     preuve — et ce dépôt ne porte ni `jsdom`/`happy-dom` ni `preact-render-to-string`
 *     (`node_modules` vérifié, rien installé, cf. `README.md` du lot : « No DOM test environment »).
 *     Faute de pouvoir RENDRE le composant, la vérification du texte exigé se fait par une sonde
 *     structurelle SUR LE CODE SOURCE : chaque `case` du `switch` est isolé par sa position littérale
 *     dans le fichier (bornes vérifiées manuellement à la lecture), puis les chaînes normatives sont
 *     cherchées DANS cette seule tranche — pas dans le fichier entier — pour ne pas confondre un texte
 *     présent ailleurs avec un texte présent DANS le bon état. C'est une exécution de script, pas une
 *     lecture : elle produit un verdict vrai/faux reproductible, mais elle ne prouve PAS que la tranche
 *     s'affiche réellement dans le DOM au runtime (seulement qu'elle EXISTE dans le code de l'état).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { MakeCard } from '../../../src/screens/market/MakeCard';

const SRC = readFileSync(new URL('../../../src/screens/market/MarketScreen.tsx', import.meta.url), 'utf8');

function sliceBetween(startMarker: string, endMarker: string | null): string {
  const start = SRC.indexOf(startMarker);
  if (start === -1) throw new Error(`marqueur de début introuvable : ${startMarker}`);
  const end = endMarker === null ? SRC.length : SRC.indexOf(endMarker, start + startMarker.length);
  if (endMarker !== null && end === -1) throw new Error(`marqueur de fin introuvable : ${endMarker}`);
  return SRC.slice(start, end);
}

const LOADING = sliceBetween("case 'loading':", "case 'provider-error':");
const PROVIDER_ERROR = sliceBetween("case 'provider-error':", "case 'empty':");
const EMPTY = sliceBetween("case 'empty':", "case 'partial':");
const LOADED = sliceBetween("case 'partial':", null); // couvre 'partial' | 'no-filter' | 'ready'

describe("preuve que le rendu direct d'un composant à hooks est impossible sans DOM (justifie l'approche par tranche de source)", () => {
  it('MakeCard (useState/useMemo) lève hors du cycle de rendu Preact', () => {
    expect(() =>
      MakeCard({
        card: { modelZones: [], visibleModelZones: [] } as never,
        isExpanded: false,
        onSelectMake: () => undefined,
        onSelectModel: () => undefined,
        onToggleExpand: () => undefined,
        compareSelection: new Set(),
        compareAtCapacity: false,
      }),
    ).toThrow();
  });
});

describe("ET-CHARGE-INIT (EX-SCR-23/130) — état 'loading'", () => {
  it('squelette : 6 cartes, compteurs à blanc « — marques · — modèles · — offres », jamais un spinner', () => {
    expect(LOADING).toContain('— marques · — modèles · — offres');
    expect(LOADING).toContain('length: 6');
    expect(LOADING).not.toMatch(/spinner/i);
  });
});

describe('ET-ERREUR-PROVIDER (EX-SCR-28) — état \'provider-error\'', () => {
  it("titre, code d'erreur, horodatage, bouton Réessayer, et le bouton conditionnel « dernier résultat connu »", () => {
    expect(PROVIDER_ERROR).toMatch(/n.ont pas pu être chargées/);
    expect(PROVIDER_ERROR).toContain('state.errorCode');
    expect(PROVIDER_ERROR).toContain('state.attemptedAt');
    expect(PROVIDER_ERROR).toContain('Réessayer');
    expect(PROVIDER_ERROR).toContain('hasCachedResult');
    expect(PROVIDER_ERROR).toContain('Afficher le dernier résultat connu');
  });
});

describe("ET-VIDE-SANS-FILTRE (EX-SCR-27) — état 'empty', reason 'no-filter'", () => {
  it('titre « Aucune donnée disponible », mention de snapshotDate, bouton Réessayer', () => {
    expect(EMPTY).toContain('Aucune donnée disponible');
    expect(EMPTY).toContain('state.snapshotDate');
    expect(EMPTY).toContain('Réessayer');
  });
});

describe("ET-VIDE-FILTRES (EX-SCR-26) — état 'empty', reason 'filters'", () => {
  it('titre, phrase du nombre de filtres actifs, les 3 boutons de retrait, Réinitialiser, Enregistrer', () => {
    expect(EMPTY).toContain('Aucune offre ne correspond');
    expect(EMPTY).toContain('filtres actifs restreignent la recherche');
    expect(EMPTY).toContain('Réinitialiser tous les filtres');
    expect(EMPTY).toContain('Enregistrer cette recherche');
    // Format normatif du bouton de retrait, EX-SCR-26 : « retirer « <libellé> » : <k> offres de plus »,
    // ou sans le chiffre pour un filtre de classe T (gain === null).
    expect(EMPTY).toContain('retirer «');
    expect(EMPTY).toContain('offres de plus');
  });

  it("R-D6-01 — EX-SCR-131 : la barre de synthèse (0 marque · 0 modèle · aucune offre, tri désactivé) est ABSENTE de l'état 'empty'", () => {
    // EX-SCR-131 : « La barre de synthèse affiche 0 marque · 0 modèle · aucune offre et la liste de
    // tri est désactivée avec l'infobulle "Aucun résultat à trier". » Le bloc `case 'empty':` ne
    // rend AUCUNE `<SummaryBar>` (ni aucun texte équivalent) : la tranche source ne contient ni le
    // composant, ni le texte «0 marque», ni «Aucun résultat à trier». Ce test échoue tant que ce
    // n'est pas corrigé — c'est le CONSTAT, pas un faux positif de la sonde.
    const hasSummaryBar = EMPTY.includes('<SummaryBar');
    const hasZeroCounts = EMPTY.includes('0 marque') || EMPTY.includes('0 marque · 0 modèle · aucune offre');
    const hasDisabledSortTooltip = EMPTY.includes('Aucun résultat à trier');
    expect({ hasSummaryBar, hasZeroCounts, hasDisabledSortTooltip }).toEqual({
      hasSummaryBar: true,
      hasZeroCounts: true,
      hasDisabledSortTooltip: true,
    });
  });
});

describe("EX-SCR-133 — état 'partial' (cartes en échec)", () => {
  it('bandeau « <k> marques sur <n> n’ont pas pu être chargées »', () => {
    expect(LOADED).toContain("state.failedMakeIds.size} marques sur {state.totalMakesAttempted} n");
    expect(LOADED).toContain('pu être chargées');
  });
});

describe('SANS-FILTRE (EX-SCR-27bis/125/126) — état \'no-filter\'', () => {
  it('bandeau « <n> marques dans le snapshot — <k> affichées » + bouton Afficher les <n> marques', () => {
    expect(LOADED).toContain('marques dans le snapshot');
    expect(LOADED).toContain('affichées, triées par');
    expect(LOADED).toContain('Afficher les');
  });

  it('bloc d’amorce : phrase exacte présente dans le rendu, et déclenchée par isNoFilter', () => {
    expect(LOADED).toContain('Posez au moins un critère pour voir ce que le marché propose');
    expect(LOADED).toContain('PRIMER_SHORTCUTS.map');
  });

  it('les 4 raccourcis (PRIMER_SHORTCUTS, module-level, mappés dans le rendu) portent le libellé normatif EXACT d’EX-SCR-125', () => {
    // Les libellés sont un tableau au niveau module (`PRIMER_SHORTCUTS`), pas des littéraux inline
    // dans le `case`, donc cherchés dans le fichier entier plutôt que dans la seule tranche `LOADED`.
    expect(SRC).toContain("label: 'Budget ≤ 10 000 €'");
    expect(SRC).toContain("label: 'Budget ≤ 20 000 €'");
    expect(SRC).toContain("label: 'Moins de 100 000 km'");
    expect(SRC).toContain("label: 'Immatriculées depuis 2020'");
  });
});

describe("état 'ready' — rendu nominal, EX-SCR-105/106", () => {
  it('les trois blocs normatifs sont présents dans le code du rendu chargé : SummaryBar, grille, GridFooter', () => {
    expect(LOADED).toContain('<SummaryBar');
    expect(LOADED).toContain('kycar-market-grid');
    expect(LOADED).toContain('<GridFooter');
  });
});
