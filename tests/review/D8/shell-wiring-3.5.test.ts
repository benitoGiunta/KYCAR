/**
 * Revue D8 (phase 3.5, `mvp-integrate`) — sondes de CÂBLAGE de la coquille pour le MVP sur données
 * fictives. Quatre familles :
 *
 *   1. **Étiquette de provenance `FIXTURE`** (`EX-DATA-107`, `DR-094`) — le module pur
 *      `src/app/source-notice.ts` est éprouvé DIRECTEMENT (comportement), et son emploi par la
 *      coquille, `/mentions` et le pied de page est prouvé par lecture de source (câblage).
 *   2. **Bascule de source visible** (`DF-2`, `D3-01`) — l'avertissement de repli du registre est
 *      remonté jusqu'à un bandeau, au lieu de rester dans la console et dans une `coverageNote`
 *      que la coquille n'affichait nulle part.
 *   3. **`ACC-16`** (`D3-23`, `reports/remediation-2.10/visual.md` §6.1) — le bandeau
 *      `ET-FILTRE-NON-APPLIQUE` nomme les filtres par leur LIBELLÉ humain, pas par leur identifiant.
 *   4. **`ACC-13` mode 1** (§6.2) — `MarketScreen` reçoit `recalculating` et le consomme comme
 *      l'écran B : temporisation de `RECALC_INDICATOR_DELAY_MS`, classe, `aria-busy`, barre.
 *
 * Comme `shell-static.test.ts` et `shell-wiring-f3.test.ts`, les sondes de câblage lisent le SOURCE
 * de `src/app.tsx` : la coquille utilise des hooks et ne se monte pas sans DOM dans cet
 * environnement (`vitest` node). Ce qui se prouve en comportement l'est en comportement.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  fixtureNotice,
  fixtureProfileOf,
  footerSourceLine,
  mentionsProvenanceLabel,
  sourceNotice,
} from '../../../src/app/source-notice';

const ROOT = process.cwd();
const app = readFileSync(resolve(ROOT, 'src/app.tsx'), 'utf8');
const main = readFileSync(resolve(ROOT, 'src/main.tsx'), 'utf8');
const mentions = readFileSync(resolve(ROOT, 'src/screens/mentions/MentionsPage.tsx'), 'utf8');
const marketScreen = readFileSync(resolve(ROOT, 'src/screens/market/MarketScreen.tsx'), 'utf8');

/** Cf. `shell-wiring-f3.test.ts` : le montage d'un composant, de `<Nom` à sa ligne de fermeture. */
function mountOf(name: string): string {
  const start = app.indexOf(`<${name}`);
  if (start < 0) return '';
  const close = app.slice(start).search(/\n[ \t]*\/>/);
  return close < 0 ? app.slice(start, start + 4000) : app.slice(start, start + close);
}

describe('R-D8-3.5-02 — étiquette de provenance : FIXTURE n’est JAMAIS traité comme REAL', () => {
  it('la nature FIXTURE produit une phrase qui dit « fictif » et « aucune annonce réelle »', () => {
    const notice = sourceNotice({ sourceKind: 'FIXTURE', fixtureProfile: 'test', fixtureSnapshotCount: 3 });
    expect(notice).toBe(
      'Jeu de données fictif à la forme AutoScout24 (profil test, 3 snapshots) — aucune annonce réelle.',
    );
  });

  it('la phrase dégrade sincèrement quand le profil ou le nombre de snapshots n’est pas su', () => {
    expect(fixtureNotice('dev', null)).toBe(
      'Jeu de données fictif à la forme AutoScout24 (profil dev) — aucune annonce réelle.',
    );
    expect(fixtureNotice(null, null)).toBe('Jeu de données fictif à la forme AutoScout24 — aucune annonce réelle.');
    expect(fixtureNotice('test', 1)).toContain('1 snapshot)');
  });

  it('SYNTHETIC est inchangé, REAL reste muet, une nature inconnue le DIT', () => {
    expect(sourceNotice({ sourceKind: 'SYNTHETIC' })).toMatch(/synthétiques/);
    expect(sourceNotice({ sourceKind: 'REAL' })).toBeNull();
    expect(sourceNotice({ sourceKind: null })).toBeNull();
    expect(sourceNotice({ sourceKind: 'AUTRE' })).toMatch(/non reconnue/);
  });

  it('le pied de page n’annonce « Source : AutoScout24 » QUE sur une source réelle', () => {
    expect(footerSourceLine({ sourceKind: 'REAL' }, '01/09/2026')).toMatch(/^Source : AutoScout24/);
    const fixture = footerSourceLine({ sourceKind: 'FIXTURE' }, '21/09/2026');
    expect(fixture).not.toMatch(/^Source : AutoScout24/);
    expect(fixture).toMatch(/fictif/);
    expect(fixture).toMatch(/aucune annonce réelle/);
    expect(footerSourceLine({ sourceKind: 'SYNTHETIC' }, '01/09/2026')).toMatch(/synthétique/);
    expect(footerSourceLine({ sourceKind: null }, '01/09/2026')).toMatch(/non établie/);
  });

  it('/mentions nomme les TROIS natures (aucun repli muet sur « marché réel »)', () => {
    expect(mentionsProvenanceLabel('REAL')).toBe('marché réel');
    expect(mentionsProvenanceLabel('SYNTHETIC')).toBe('jeu synthétique de démonstration');
    expect(mentionsProvenanceLabel('FIXTURE')).toMatch(/fictif/);
    expect(mentionsProvenanceLabel(null)).toMatch(/non établie/);
  });

  it('`fixtureProfileOf` lit le profil de la spécification du registre, et rien d’autre', () => {
    expect(fixtureProfileOf('fixture:test')).toBe('test');
    expect(fixtureProfileOf('fixture:dev')).toBe('dev');
    expect(fixtureProfileOf('synthetic')).toBeNull();
    expect(fixtureProfileOf(null)).toBeNull();
  });

  it('la coquille emploie le module et n’a plus de littéral de provenance', () => {
    expect(app).toMatch(/from '\.\/app\/source-notice'/);
    expect(app).toContain('sourceNotice(');
    expect(app).toContain('footerSourceLine(');
    // Le littéral du lot D8 (« Source : AutoScout24 — agrégat non affilié ») ne doit plus être
    // écrit en dur dans le JSX : c'est lui qui faisait passer un jeu fictif pour du réel.
    expect(app).not.toContain('Source : AutoScout24 — agrégat non affilié');
    expect(app).not.toContain("props.sourceKind === 'SYNTHETIC' ? ' — jeu de données synthétique de démonstration' : ''");
  });

  it('/mentions affiche une provenance pour TOUTE nature connue, FIXTURE comprise', () => {
    expect(mentions).toMatch(/mentionsProvenanceLabel/);
    expect(mentions).not.toContain("props.sourceKind === 'REAL' || props.sourceKind === 'SYNTHETIC'");
  });
});

describe('R-D8-3.5-03 — bascule de source : le repli du registre est VISIBLE (DF-2)', () => {
  it('`main.tsx` transmet la spécification retenue et l’avertissement de repli à la coquille', () => {
    expect(main).toMatch(/providerSpec=\{selection\.spec\}/);
    expect(main).toMatch(/providerWarning=\{selection\.warning\}/);
    expect(main).toMatch(/selection\.warning/);
  });

  it('la coquille en fait un bandeau ET-SOURCE-REPLI, pas une ligne de console', () => {
    expect(app).toContain('ET-SOURCE-REPLI');
    expect(app).toMatch(/providerWarning/);
  });

  it('la coquille nomme le profil de fixtures depuis la spécification, jamais en dur', () => {
    expect(app).toContain('fixtureProfileOf(');
    expect(app).not.toMatch(/fixtureProfile=?\{?'test'/);
  });
});

describe('R-D8-3.5-04 — ACC-16 : le bandeau ET-FILTRE-NON-APPLIQUE nomme des LIBELLÉS', () => {
  it('le texte du bandeau passe par `filterDisplayLabels`, plus par `unapplied.join`', () => {
    const banner = app.slice(app.indexOf("id: 'ET-FILTRE-NON-APPLIQUE'"), app.indexOf("id: 'ET-FILTRE-NON-APPLIQUE-BODY'"));
    expect(banner, 'bandeau ET-FILTRE-NON-APPLIQUE introuvable').not.toBe('');
    expect(banner).toContain('filterDisplayLabels(unapplied)');
    expect(banner).not.toContain('unapplied.join');
    expect(app).toMatch(/import \{[^}]*filterDisplayLabels[^}]*\} from '\.\/components\/filters\/labels'/);
  });
});

describe('R-D8-3.5-05 — ACC-13 mode 1 : `recalculating` sur l’écran A', () => {
  it('la coquille pose la prop au montage de `MarketScreen`, sur le même critère que l’écran B', () => {
    const mount = mountOf('MarketScreen');
    expect(mount, 'montage de MarketScreen introuvable').not.toBe('');
    expect(mount).toMatch(/recalculating=\{/);
  });

  it('`MarketScreen` la consomme : temporisation partagée, classe, aria-busy, barre indéterminée', () => {
    expect(marketScreen).toMatch(/readonly recalculating\?: boolean/);
    expect(marketScreen).toMatch(/RECALC_INDICATOR_DELAY_MS/);
    expect(marketScreen).toMatch(/kycar-market-screen--recalculating/);
    expect(marketScreen).toMatch(/aria-busy=\{recalcVisible/);
    expect(marketScreen).toMatch(/kycar-recalc-progress/);
  });
});
