/**
 * KYCAR — Panneau Diagnostic : valeurs dérivées du descripteur de snapshot (`ACC-24`, `D3-34 (d)`)
 * =================================================================================================
 * `EX-SCR-47`/`53` — le pied de page porte un panneau Diagnostic repliable : c'est l'endroit où un
 * lecteur attentif va chercher ce que l'application SAIT du jeu servi, sans qu'aucun chiffre affiché
 * n'en dépende.
 *
 * `ACC-24` (recette rev 3 §8) : la `coverageNote` du `SnapshotDescriptor` — régime de vérification
 * du `sha256`, refus éventuel de l'artefact d'agrégats précalculés, conditions hors vocabulaire,
 * provenance du CO₂, avertissement de repli de source — n'était lisible QUE dans la ligne
 * `# couverture` des exports CSV. La décision `D3-34 (d)` refuse d'en faire un bandeau (elle ne
 * décrit aucun état que l'utilisateur doive traiter) et recommande cette ligne de Diagnostic.
 *
 * Ce module est pur : il ne met en forme que la VALEUR de la ligne, jamais le rendu.
 */

/**
 * Longueur au-delà de laquelle la valeur d'une ligne de Diagnostic est repliée (`<details>`) plutôt
 * qu'étalée : la note de couverture d'un jeu de fixtures dépasse 1 500 caractères et noierait les
 * quatorze autres lignes du panneau. Seuil d'AFFICHAGE : le texte reste entier dans le document,
 * jamais tronqué (`D-03` — ce qui est dit est dit en entier).
 */
export const DIAGNOSTIC_FOLD_THRESHOLD = 300;

/**
 * Valeur de la ligne « Note de couverture », sincère dans les trois cas :
 *   - `undefined` : aucun descripteur de snapshot (démarrage, échec) → `—`, comme les autres lignes ;
 *   - `null` : la source ne fournit pas de note → `aucune` (ce n'est pas la même chose qu'un
 *     descripteur absent, et ce n'est pas un défaut) ;
 *   - texte : rendu TEL QUEL, sans troncature ni reformatage.
 */
export function coverageNoteValue(note: string | null | undefined): string {
  if (note === undefined) return '—';
  if (note === null) return 'aucune';
  return note;
}
