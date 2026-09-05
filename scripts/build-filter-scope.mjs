#!/usr/bin/env node
/**
 * Produit la liste NORMATIVE des filtres retenus au périmètre KYCAR, depuis le catalogue relevé.
 *
 * Résout le constat T-02 du stress-test : la liste des filtres retenus n'existait que sous forme
 * de prose, dans trois documents qui en donnaient trois décomptes contradictoires. Une liste en
 * prose se remet à diverger à chaque édition ; un fichier généré ne peut pas.
 *
 * L'arbitrage A-01 fixe la règle : tous les filtres voiture d'AutoScout24 sont retenus, et seules
 * quatre catégories d'exclusion sont admises. Ce script applique cette règle mécaniquement et
 * échoue si le compte ne tombe pas juste.
 *
 * Usage : node scripts/build-filter-scope.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';

const CATALOGUE = 'data/reference/filters.json';
const SORTIE = 'data/reference/filters-scope.json';

/** Les quatre seules catégories d'exclusion admises par l'arbitrage A-01. */
const EXCLUSIONS = {
  R3_DONNEE_PERSONNELLE: {
    motif: "Identifiant vendeur. Règle R3 de 00-CONTEXT.md : aucun champ identifiant un vendeur n'entre dans le schéma.",
    params: ['cid'],
  },
  HORS_PERIMETRE_VOITURE: {
    motif: 'Filtre propre à atype≠C (caravane, camping-car, utilitaire lourd). KYCAR fixe atype=C.',
    params: [
      'bedsfrom', 'bedsto', 'beds', 'sout', 'wbfrom', 'wbto', 'ewfrom', 'ewto',
      'totlenfrom', 'totlento', 'ehfrom', 'ehto', 'axlenumber',
      'grossweightfrom', 'grossweightto',
    ],
    ids: ['bedType'], // entrée sans paramètre d'URL pour atype=C
  },
  TELEMETRIE_AS24: {
    motif: "Paramètre de télémétrie ou de rotation publicitaire interne à AutoScout24. Ne décrit aucun véhicule et n'a pas d'équivalent dans notre dataset.",
    params: ['show_nfm', 'search_id', 'query_id', 'tier_rotation', 'adage'],
  },
  DOUBLON_STRICT: {
    motif: 'Deux paramètres pour une même notion. La notion est implémentée une fois ; le paramètre est accepté en lecture d\'URL comme alias.',
    params: ['mmm', 'pricetype'],
    alias: { mmm: 'mmmv', pricetype: 'custtype' },
  },
};

const catalogue = JSON.parse(readFileSync(CATALOGUE, 'utf8'));
const entrees = catalogue.filters;

/** Index inverse param|id → catégorie d'exclusion. */
const exclusionPar = new Map();
for (const [categorie, def] of Object.entries(EXCLUSIONS)) {
  for (const p of def.params ?? []) exclusionPar.set(p, categorie);
  for (const i of def.ids ?? []) exclusionPar.set(`#${i}`, categorie);
}

const retenus = [];
const exclus = [];

for (const entree of entrees) {
  const param = entree.param ?? entree.urlParameter ?? null;
  const cle = param ?? `#${entree.id}`;
  const categorie = exclusionPar.get(cle);
  const commun = {
    id: entree.id,
    param,
    label: entree.label_fr ?? entree.label_en ?? entree.id,
    type: entree.type,
    group: entree.group,
    evidence: entree.evidence,
  };

  if (categorie) {
    exclus.push({
      ...commun,
      exclusion: categorie,
      motif: EXCLUSIONS[categorie].motif,
      alias: EXCLUSIONS[categorie].alias?.[param] ?? null,
    });
  } else {
    retenus.push({
      ...commun,
      separator: entree.separator ?? null,
      semantics: entree.semantics ?? null,
      dependencies: entree.dependencies ?? [],
      // Domaine de valeurs conservé par référence, pas recopié : filters.json reste la source.
      domainRef: entree.domain ? `${CATALOGUE}#filters[id=${entree.id}].domain` : null,
    });
  }
}

// Vérifications d'intégrité. Un écart signifie que la règle A-01 et le catalogue ont divergé :
// il faut alors reprendre l'arbitrage, pas ajuster le script.
const erreurs = [];
if (retenus.length + exclus.length !== entrees.length) {
  erreurs.push(`partition incomplète : ${retenus.length} + ${exclus.length} ≠ ${entrees.length}`);
}
const attenduExclus = Object.values(EXCLUSIONS)
  .reduce((n, d) => n + (d.params?.length ?? 0) + (d.ids?.length ?? 0), 0);
if (exclus.length !== attenduExclus) {
  const trouves = new Set(exclus.map((e) => e.param ?? `#${e.id}`));
  const absents = [...exclusionPar.keys()].filter((k) => !trouves.has(k));
  erreurs.push(`${exclus.length} exclus trouvés pour ${attenduExclus} déclarés. Absents du catalogue : ${absents.join(', ') || 'aucun'}`);
}
const doublons = retenus.map((r) => r.param).filter((p, i, a) => p && a.indexOf(p) !== i);
if (doublons.length) erreurs.push(`paramètres en doublon parmi les retenus : ${doublons.join(', ')}`);

if (erreurs.length) {
  console.error('ÉCHEC DE VÉRIFICATION :');
  for (const e of erreurs) console.error(`  - ${e}`);
  process.exit(1);
}

const parCategorie = {};
for (const e of exclus) parCategorie[e.exclusion] = (parCategorie[e.exclusion] ?? 0) + 1;

const sortie = {
  source: `Généré par scripts/build-filter-scope.mjs depuis ${CATALOGUE}`,
  regle: 'Arbitrage A-01 de docs/requirements/ARBITRAGES-req-lead.md',
  generatedAt: new Date().toISOString(),
  totalCatalogue: entrees.length,
  totalRetenus: retenus.length,
  totalExclus: exclus.length,
  exclusionsParCategorie: parCategorie,
  retenus,
  exclus,
};

writeFileSync(SORTIE, `${JSON.stringify(sortie, null, 2)}\n`, 'utf8');

console.log(`${SORTIE} écrit`);
console.log(`  catalogue : ${entrees.length} entrées (${entrees.filter((e) => e.param).length} paramètres d'URL)`);
console.log(`  retenus   : ${retenus.length}`);
console.log(`  exclus    : ${exclus.length}`);
for (const [c, n] of Object.entries(parCategorie)) console.log(`      ${c.padEnd(26)} ${n}`);
