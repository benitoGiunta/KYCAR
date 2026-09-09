/**
 * KYCAR — Étiquette de PROVENANCE des données affichées (`EX-DATA-107`, `DR-094`, phase 3.5)
 * =================================================================================================
 * `SourceKind` a gagné une troisième valeur en phase 3.3 (`FIXTURE` : jeu FICTIF versionné, à la
 * forme AutoScout24). Or la coquille, `/mentions` et le pied de page ne nommaient que `REAL` et
 * `SYNTHETIC` : un snapshot `FIXTURE` n'affichait donc AUCUNE phrase de provenance — et le pied de
 * page continuait d'annoncer « Source : AutoScout24 — agrégat non affilié », c'est-à-dire un
 * marché RÉEL. Avec `fixture:test` comme source par défaut de l'application (`D3-01`), c'était le
 * cas NOMINAL qui se faisait passer pour du réel : exactement ce qu'`EX-DATA-107` interdit.
 *
 * Ce module est la seule source de ces phrases. Il est PUR et sans dépendance de rendu, pour être
 * éprouvé directement par une sonde (`tests/review/D8/source-notice.test.ts`) plutôt que par une
 * lecture de JSX. Règle de conception : **le défaut n'est jamais « réel »**. Toute nature non
 * reconnue est traitée comme non prouvée et le dit, plutôt que d'hériter du silence de `REAL`.
 */

/** Ce que la coquille sait de la source au moment du rendu. Tout est optionnel sauf la nature. */
export interface SourceNoticeInputs {
  /** `SnapshotDescriptor.sourceKind` / `describe().sourceKind`, tel quel. `null` = pas encore su. */
  readonly sourceKind: string | null;
  /** Profil de fixtures servi (`test`, `dev`, `perf`), déduit de la spécification du registre. */
  readonly fixtureProfile?: string | null;
  /** Nombre de snapshots du profil, lu de l'index du profil. `null` = non su : la phrase l'omet. */
  readonly fixtureSnapshotCount?: number | null;
}

/** `EX-DATA-107` — jeu SYNTHÉTIQUE généré à la volée. Texte inchangé depuis le lot D8. */
export const SYNTHETIC_NOTICE =
  'Données synthétiques de démonstration — chiffres générés, sans valeur de marché réelle.';

/**
 * `EX-DATA-107` (`D3-00`/`D3-01`) — jeu FICTIF versionné. La phrase nomme les trois choses que
 * l'utilisateur a besoin de savoir pour ne pas se tromper sur ce qu'il lit : c'est fictif, cela a
 * la FORME d'AutoScout24 (donc le vocabulaire et la taxonomie lui seront familiers), et il n'y a
 * derrière aucune annonce réelle.
 */
export function fixtureNotice(profile?: string | null, snapshotCount?: number | null): string {
  const parts: string[] = [];
  if (profile !== null && profile !== undefined && profile.length > 0) parts.push(`profil ${profile}`);
  if (snapshotCount !== null && snapshotCount !== undefined && snapshotCount > 0) {
    parts.push(`${snapshotCount} snapshot${snapshotCount > 1 ? 's' : ''}`);
  }
  const detail = parts.length === 0 ? '' : ` (${parts.join(', ')})`;
  return `Jeu de données fictif à la forme AutoScout24${detail} — aucune annonce réelle.`;
}

/**
 * Phrase de provenance à afficher EN BANDEAU sur tous les écrans, ou `null` quand il n'y a rien à
 * dire (`REAL` : la mention légale du pied de page suffit, elle nomme déjà la place de marché).
 */
export function sourceNotice(inputs: SourceNoticeInputs): string | null {
  switch (inputs.sourceKind) {
    case 'SYNTHETIC':
      return SYNTHETIC_NOTICE;
    case 'FIXTURE':
      return fixtureNotice(inputs.fixtureProfile, inputs.fixtureSnapshotCount);
    case 'REAL':
      return null;
    default:
      // Nature inconnue (démarrage en cours, provider muet, valeur ajoutée à l'union sans câblage
      // ici) : on ne se TAIT pas — se taire, c'est laisser croire au réel.
      return inputs.sourceKind === null
        ? null
        : `Nature de la source non reconnue (${inputs.sourceKind}) : les chiffres affichés ne sont pas garantis provenir d’un marché réel.`;
  }
}

/**
 * Ligne légale du pied de page (`EX-SCR-47`). Sur une source non réelle, elle ne peut pas commencer
 * par « Source : AutoScout24 » : la place de marché n'a rien fourni. Elle dit alors ce qui est
 * réellement servi, et garde la forme AS24 comme ce qu'elle est — une FORME.
 */
export function footerSourceLine(inputs: SourceNoticeInputs, snapshotDate: string): string {
  switch (inputs.sourceKind) {
    case 'FIXTURE':
      return `Jeu de données fictif à la forme AutoScout24 — aucune annonce réelle, aucun lien avec AutoScout24. Données du ${snapshotDate}.`;
    case 'SYNTHETIC':
      return `Jeu de données synthétique de démonstration — aucune annonce réelle. Données du ${snapshotDate}.`;
    case 'REAL':
      return `Source : AutoScout24 — agrégat non affilié. Données du ${snapshotDate}.`;
    default:
      return `Nature de la source non établie — les chiffres affichés ne sont pas garantis provenir d’un marché réel. Données du ${snapshotDate}.`;
  }
}

/**
 * Phrase de provenance de `/mentions` (`EX-NFR-26`) : le NOM de ce qui est servi, décliné pour les
 * trois natures. Jamais `null` : la page des mentions est précisément l'endroit où la provenance
 * doit être écrite en toutes lettres.
 */
export function mentionsProvenanceLabel(sourceKind: string | null): string {
  switch (sourceKind) {
    case 'SYNTHETIC':
      return 'jeu synthétique de démonstration';
    case 'FIXTURE':
      return 'jeu de données fictif à la forme AutoScout24 (aucune annonce réelle)';
    case 'REAL':
      return 'marché réel';
    default:
      return 'nature non établie';
  }
}

/** `fixture:test` → `test`. Toute autre spécification (ou `null`) ne nomme aucun profil. */
export function fixtureProfileOf(spec: string | null | undefined): string | null {
  if (spec === null || spec === undefined) return null;
  return spec.startsWith('fixture:') ? spec.slice('fixture:'.length) : null;
}
