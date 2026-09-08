/**
 * KYCAR — Popularité de marché du générateur synthétique (DR-038)
 * =================================================================================================
 * Le tirage marque/modèle du lot D3 était quasi PLAT : 100 000 annonces réparties sur 4 955 modèles
 * donnaient 4 954 cellules `(marque, modèle)` de médiane 17 et de maximum 63, une seule cellule
 * `(marque, modèle, année)` à `n ≥ 12`, et « Opel Corsa » à 9 annonces là où `ARCHITECTURE` §2.4
 * dimensionne sur ≈ 1 281. Conséquences mesurées par la revue (R-D3-07, R-D3-05, R-D8-30) : la
 * cellule de rang 1 de M1 (EX-DATA-86) n'est jamais formable, M2 (`|F| ≥ 30`, EX-DATA-90) n'a pas de
 * matière, et le parcours cible 2 n'est pas exerçable.
 *
 * Un marché réel est CONCENTRÉ. Ce module pose donc la concentration explicitement :
 *
 *   1. une table de poids de MARQUE (parts plausibles du parc belge d'occasion) pour la trentaine de
 *      marques dominantes ; les autres marques se partagent la queue par une loi de Zipf ;
 *   2. un rang de MODÈLE par marque : les modèles nommés dans `MODEL_RANK_HINTS` d'abord, dans
 *      l'ordre donné, puis les autres par ordre stable ; le poids est `1 / rang^ZIPF_MODEL_EXPONENT`.
 *
 * DONNÉES SYNTHÉTIQUES (EX-DATA-107) : ces poids sont PLAUSIBLES, jamais relevés — ils ne prétendent
 * à aucune exactitude statistique. Ils ne servent qu'à donner au jeu de données la FORME d'un marché
 * (quelques cellules très peuplées, une longue traîne), forme sans laquelle les règles d'effectif
 * d'EX-DATA-86/90 et d'ARB-17 ne sont exercées par aucun test.
 *
 * Module PUR et déterministe : aucun aléa, aucune I/O — deux exécutions donnent les mêmes poids.
 */

/** Exposant de la loi de Zipf appliquée aux modèles d'une marque (`w = 1 / rang^s`). */
export const ZIPF_MODEL_EXPONENT = 1.0;

/** Exposant de la loi de Zipf appliquée à la queue des marques hors table. */
export const ZIPF_MAKE_TAIL_EXPONENT = 1.15;

/** Poids total (en « parts ») laissé à la queue des marques absentes de `MAKE_POPULARITY`. */
export const MAKE_TAIL_TOTAL_WEIGHT = 9;

/**
 * Poids relatifs des marques dominantes, par slug de taxonomie. La somme vaut ≈ 91 ; les ≈ 260
 * marques restantes se partagent `MAKE_TAIL_TOTAL_WEIGHT` (≈ 9 %) par une loi de Zipf sur un rang
 * stable, si bien qu'AUCUNE marque du référentiel n'a un poids nul (EX-DATA-20 : la taxonomie entière
 * reste représentable).
 */
export const MAKE_POPULARITY: Readonly<Record<string, number>> = {
  volkswagen: 9.5,
  bmw: 8.5,
  'mercedes-benz': 8,
  audi: 7.5,
  opel: 6.5,
  peugeot: 6,
  renault: 5.2,
  ford: 4.6,
  citroen: 3.8,
  toyota: 3.6,
  skoda: 3.4,
  hyundai: 2.7,
  kia: 2.5,
  volvo: 2.4,
  nissan: 2,
  fiat: 1.9,
  seat: 1.8,
  dacia: 1.7,
  mazda: 1.5,
  mini: 1.4,
  tesla: 1.1,
  honda: 0.9,
  suzuki: 0.85,
  jeep: 0.8,
  'land-rover': 0.8,
  porsche: 0.75,
  cupra: 0.7,
  'alfa-romeo': 0.65,
  mitsubishi: 0.6,
  smart: 0.55,
  lexus: 0.5,
  'ds-automobiles': 0.45,
  subaru: 0.3,
};

/**
 * Modèles les plus vendus des marques dominantes, dans l'ordre décroissant de popularité (slugs de
 * `data/reference/taxonomy.json`). Un modèle absent de cette liste reçoit un rang APRÈS les modèles
 * listés, dans l'ordre du référentiel : le classement reste total et déterministe.
 */
export const MODEL_RANK_HINTS: Readonly<Record<string, readonly string[]>> = {
  volkswagen: ['golf', 'polo', 'passat', 'tiguan', 'up', 'touran', 't-roc', 'caddy', 'transporter', 'sharan'],
  bmw: ['320', '318', '316', '520', 'x1', 'x3', '118', '116', '530', '120'],
  'mercedes-benz': ['c-200', 'c-180', 'e-220', 'a-180', 'a-200', 'c-220', 'b-180', 'e-200', 'gla-200', 'glc-220'],
  audi: ['a3', 'a4', 'a1', 'a6', 'q3', 'q5', 'a5', 'q2', 'tt', 'a7'],
  opel: ['corsa', 'astra', 'mokka', 'insignia', 'zafira', 'meriva', 'crossland-x', 'grandland-x', 'combo', 'adam'],
  peugeot: ['208', '308', '3008', '2008', '207', '5008', '206', '508', 'partner', '108'],
  renault: ['clio', 'megane', 'captur', 'scenic', 'twingo', 'kadjar', 'kangoo', 'espace', 'zoe', 'talisman'],
  ford: ['fiesta', 'focus', 'kuga', 'mondeo', 'puma', 'c-max', 's-max', 'transit', 'ka-ka', 'ecosport'],
  citroen: ['c3', 'c4', 'c1', 'c5', 'berlingo', 'c3-picasso', 'c4-picasso', 'c-elysee', 'c4-cactus', 'c8'],
  toyota: ['yaris', 'auris', 'corolla', 'aygo', 'rav4', 'c-hr', 'avensis', 'prius', 'verso', 'proace'],
  skoda: ['octavia', 'fabia', 'superb', 'karoq', 'kodiaq', 'scala', 'yeti', 'citigo', 'roomster', 'kamiq'],
  hyundai: ['tucson', 'i30', 'i20', 'i10', 'kona', 'ix35', 'santa-fe', 'ioniq', 'i40', 'bayon'],
  kia: ['ceed-cee-d', 'sportage', 'picanto', 'rio', 'niro', 'stonic', 'venga', 'sorento', 'soul', 'carens'],
  volvo: ['xc60', 'v40', 'xc40', 'v60', 's60', 'xc90', 'v70', 'v50', 's80', 'c30'],
  nissan: ['qashqai', 'juke', 'micra', 'x-trail', 'note', 'leaf', 'pulsar', 'navara', 'primera', 'almera'],
  fiat: ['500', 'punto', 'panda', 'tipo', 'doblo', '500x', '500l', 'ducato', 'bravo', 'croma'],
};
