/**
 * Revue D8 (remédiation 3.5, `fix-app-5`) — LA SOURCE SERVIE SUIT L'URL COURANTE (`ACC-26`)
 * =================================================================================================
 * Constat de recette `ACC-26` (`reports/ACCEPTANCE.md` rev 4 §8) : `main.tsx` choisit le provider
 * **une fois**, au démarrage, d'après `window.location.search`. Toute navigation INTERNE
 * (`pushState`) vers une URL dont le `provider` diffère de cette spécification amorcée écrivait donc
 * une URL qui NOMME une source pendant que l'écran en SERT une autre — sans un mot : rouvrir une
 * recherche enregistrée sous `?provider=synthetic` depuis une page amorcée par défaut affichait
 * 11 652 offres sous une URL `provider=synthetic`, et la carte de l'écran E comparait l'effectif figé
 * d'une source à l'effectif actuel d'une AUTRE (« − 64 785 offres depuis le 14/09 »).
 *
 * **Règle posée par la remédiation** (`D-03`, `DF-2`, `D-03` appliqué à la source) : *l'URL est la
 * déclaration partageable de la source ; la source servie est toujours celle que l'URL courante
 * nomme.* Au point de passage unique des navigations, une cible qui RÉSOUT (par
 * `resolveProviderSpec`, repli compris) une spécification différente de celle amorcée n'est plus
 * poussée dans l'historique : elle devient une navigation COMPLÈTE, qui fait ré-amorcer `main.tsx`.
 *
 * Ces sondes portent sur la FONCTION DE DÉCISION (pure, `src/app/source-navigation.ts`) : cible sans
 * `provider`, avec un `provider` identique, différent, inconnu (repli), non câblé (repli) ; puis sur
 * le CÂBLAGE de cette décision (lecture du source, la coquille étant un composant à hooks que cet
 * environnement `node` ne peut pas monter). La preuve de bout en bout est la recette navigateur
 * (`tests/e2e/source-fixture.spec.ts`, `test.describe('ACC-26 …')`).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  DEFAULT_BOOT_SOURCE,
  bootSourceOf,
  decideSourceNavigation,
  planNavigation,
  shortSourceLabel,
  type BootSource,
} from '../../../src/app/source-navigation';
import { DEFAULT_PROVIDER_SPEC, PROVIDER_REGISTRY } from '../../../src/providers/registry';

const ROOT = process.cwd();
const app = readFileSync(resolve(ROOT, 'src/app.tsx'), 'utf8');
const main = readFileSync(resolve(ROOT, 'src/main.tsx'), 'utf8');
const savedScreen = readFileSync(resolve(ROOT, 'src/screens/saved/SavedSearchesScreen.tsx'), 'utf8');

/** Amorçage par DÉFAUT : aucune `?provider=` au démarrage, aucune variable de build. */
const BOOT_DEFAULT: BootSource = bootSourceOf('', {});
/** Amorçage sous `?provider=synthetic`. */
const BOOT_SYNTHETIC: BootSource = bootSourceOf('?provider=synthetic', {});

describe('R-D8-ACC26-01 — la décision interne / complète suit la spécification RÉSOLUE de la cible', () => {
  it('cible SANS `provider`, amorçage par défaut : navigation INTERNE, URL inchangée', () => {
    const plan = planNavigation('/marche?priceto=20000', '', BOOT_DEFAULT);
    expect(plan.mode).toBe('internal');
    expect(plan.target).toBe('/marche?priceto=20000');
    expect(plan.targetSpec).toBe(DEFAULT_PROVIDER_SPEC);
  });

  it('cible SANS `provider` sous un amorçage `synthetic` : le réservé est reconduit, navigation INTERNE (ACC-20)', () => {
    const plan = planNavigation('/recherches', '?priceto=20000&provider=synthetic', BOOT_SYNTHETIC);
    expect(plan.target).toBe('/recherches?provider=synthetic');
    expect(plan.targetSpec).toBe('synthetic');
    expect(plan.mode).toBe('internal');
  });

  it('cible portant la MÊME spécification que l’amorçage : navigation INTERNE (aucun rechargement inutile)', () => {
    expect(planNavigation('/marche?provider=synthetic', '?provider=synthetic', BOOT_SYNTHETIC).mode).toBe('internal');
    expect(planNavigation('/marche?provider=fixture:test', '', BOOT_DEFAULT).mode).toBe('internal');
  });

  it('cible portant une AUTRE spécification : navigation COMPLÈTE (le cas d’ACC-26)', () => {
    const plan = planNavigation('/marche?priceto=20000&provider=synthetic', '', BOOT_DEFAULT);
    expect(plan.mode).toBe('full');
    expect(plan.targetSpec).toBe('synthetic');
    expect(plan.bootSpec).toBe(DEFAULT_PROVIDER_SPEC);
    expect(plan.target).toBe('/marche?priceto=20000&provider=synthetic');
  });

  it('cas SYMÉTRIQUE : cible `fixture:test` sous un amorçage `synthetic` : navigation COMPLÈTE', () => {
    const plan = planNavigation('/marche?provider=fixture:test', '?provider=synthetic', BOOT_SYNTHETIC);
    expect(plan.mode).toBe('full');
    expect(plan.targetSpec).toBe('fixture:test');
    // Le réservé de la cible n'est ni écrasé ni dupliqué par la reconduction (`DR-051`).
    expect(plan.target).toBe('/marche?provider=fixture:test');
  });

  it('cible `fixture:dev` sous un amorçage `fixture:test` : deux profils = deux sources, navigation COMPLÈTE', () => {
    expect(planNavigation('/marche?provider=fixture:dev', '', BOOT_DEFAULT).mode).toBe('full');
  });

  it('la décision seule (URL déjà finale) est celle qu’applique `navigate` après la reconduction', () => {
    expect(decideSourceNavigation('/marche?provider=synthetic', BOOT_DEFAULT)).toEqual({
      mode: 'full',
      targetSpec: 'synthetic',
      bootSpec: DEFAULT_PROVIDER_SPEC,
    });
    expect(decideSourceNavigation('/recherches', BOOT_DEFAULT).mode).toBe('internal');
    // Sans amorçage explicite (montage isolé, test), la source par défaut : jamais de rechargement.
    expect(decideSourceNavigation('/marche?provider=fixture:test').mode).toBe('internal');
  });
});

describe('R-D8-ACC26-02 — une valeur qui RETOMBE sur le défaut ne provoque aucun rechargement', () => {
  it('cible `provider=<inconnu>` sous l’amorçage par défaut : le registre replie, la décision est INTERNE', () => {
    const plan = planNavigation('/marche?provider=carrosserie-de-mon-oncle', '', BOOT_DEFAULT);
    expect(plan.targetSpec).toBe(DEFAULT_PROVIDER_SPEC);
    expect(plan.mode).toBe('internal');
  });

  it('cible `provider=tweedehands` (non câblée) sous l’amorçage par défaut : repli, décision INTERNE', () => {
    expect(planNavigation('/marche?provider=tweedehands', '', BOOT_DEFAULT).mode).toBe('internal');
  });

  it('cible `provider=tweedehands` sous un amorçage `synthetic` : le repli VAUT changement de source', () => {
    const plan = planNavigation('/marche?provider=tweedehands', '?provider=synthetic', BOOT_SYNTHETIC);
    expect(plan.targetSpec).toBe(DEFAULT_PROVIDER_SPEC);
    expect(plan.mode).toBe('full');
  });

  it('amorçage SOUS une valeur inconnue : la valeur reste dans l’URL et rien ne se recharge en boucle', () => {
    const boot = bootSourceOf('?provider=carrosserie-de-mon-oncle', {});
    expect(boot.spec).toBe(DEFAULT_PROVIDER_SPEC);
    const plan = planNavigation('/recherches', '?provider=carrosserie-de-mon-oncle', boot);
    expect(plan.target).toBe('/recherches?provider=carrosserie-de-mon-oncle');
    expect(plan.mode).toBe('internal');
  });

  it('AUCUNE BOUCLE : rejouer la décision sur la cible d’une navigation complète donne « interne »', () => {
    const first = planNavigation('/marche?priceto=20000&provider=synthetic', '', BOOT_DEFAULT);
    expect(first.mode).toBe('full');
    // Ce que `main.tsx` fera au ré-amorçage : la cible devient l'URL de départ.
    const reboot = bootSourceOf('?priceto=20000&provider=synthetic', {});
    expect(reboot.spec).toBe('synthetic');
    expect(planNavigation(first.target, '?priceto=20000&provider=synthetic', reboot).mode).toBe('internal');
  });
});

describe('R-D8-ACC26-03 — amorçage : variable de build et repli neutre', () => {
  it('`VITE_KYCAR_PROVIDER` sans `?provider=` : l’amorçage et la cible sans paramètre coïncident', () => {
    const boot = bootSourceOf('', { VITE_KYCAR_PROVIDER: 'synthetic' });
    expect(boot.spec).toBe('synthetic');
    expect(boot.specWithoutUrlParam).toBe('synthetic');
    // Sans ce second champ, toute navigation interne aurait été prise pour un changement de source.
    expect(planNavigation('/marche?priceto=20000', '', boot).mode).toBe('internal');
  });

  it('l’URL l’emporte sur la variable de build, et le champ « sans paramètre » garde la valeur de build', () => {
    const boot = bootSourceOf('?provider=fixture:dev', { VITE_KYCAR_PROVIDER: 'synthetic' });
    expect(boot.spec).toBe('fixture:dev');
    expect(boot.specWithoutUrlParam).toBe('synthetic');
  });

  it('l’amorçage par défaut du module est la source par défaut de l’application (D3-01)', () => {
    expect(DEFAULT_BOOT_SOURCE.spec).toBe(DEFAULT_PROVIDER_SPEC);
    expect(DEFAULT_BOOT_SOURCE.specWithoutUrlParam).toBe(DEFAULT_PROVIDER_SPEC);
    expect(planNavigation('/marche', '').mode).toBe('internal');
  });
});

describe('R-D8-ACC26-04 — libellé COURT de source, pour nommer l’autre source sur l’écran E', () => {
  it('chaque spécification du registre a un libellé court non vide et distinct', () => {
    const labels = PROVIDER_REGISTRY.map((e) => shortSourceLabel(e.spec));
    for (const l of labels) expect(l.length).toBeGreaterThan(2);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('les deux libellés cités par la recette sont ceux attendus', () => {
    expect(shortSourceLabel('synthetic')).toBe('synthétique');
    expect(shortSourceLabel('fixture:test')).toBe('fixtures, profil test');
  });
});

describe('R-D8-ACC26-05 — câblage de la décision dans la coquille et dans le bootstrap', () => {
  it('`navigate` décide par `planNavigation` et sort par une navigation COMPLÈTE', () => {
    const start = app.indexOf('const navigate = useCallback(');
    expect(start, 'navigate introuvable dans app.tsx').toBeGreaterThan(-1);
    const body = app.slice(start, app.indexOf('useEffect(', start));
    const code = body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    expect(code).toMatch(/decideSourceNavigation\(/);
    expect(code).toMatch(/window\.location\.assign\(/);
    // `ACC-20` n'est pas perdu en route : la reconduction des réservés reste VISIBLE au point de
    // passage, avant la décision (c'est ce qu'exige `R-D8-ACC20-04`, sonde livrée par fix-app-4).
    expect(code).toMatch(/carryReservedParams\(/);
    expect(code.indexOf('carryReservedParams(')).toBeLessThan(code.indexOf('decideSourceNavigation('));
  });

  it('`main.tsx` EXPOSE la spécification amorcée à la coquille (au lieu de relire location.search)', () => {
    expect(main).toMatch(/bootSource/);
    expect(app).toMatch(/readonly bootSource\?/);
  });

  it('l’écran E ne calcule un effectif actuel QUE pour les recherches de la source courante', () => {
    const start = app.indexOf('const [currentCounts, setCurrentCounts]');
    expect(start).toBeGreaterThan(-1);
    const body = app.slice(start, app.indexOf('// ---- Handlers d’écran A', start));
    const code = body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    expect(code).toMatch(/planNavigation\(/);
    expect(code).toMatch(/countForSelection/);
  });

  it('la carte de l’écran E nomme l’autre source au lieu d’un chiffre, et n’en tire aucun écart', () => {
    expect(savedScreen).toMatch(/otherSourceLabel/);
    const code = savedScreen.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
    // Le calcul de l'écart est GARDÉ par l'absence d'autre source : jamais un delta inter-sources.
    expect(code).toMatch(/const delta =[\s\S]{0,400}otherSourceLabel/);
    expect(code).toMatch(/ouvrir pour recalculer/);
  });
});
