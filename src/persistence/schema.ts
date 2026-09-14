/**
 * KYCAR — Version de schéma persisté et migrations (lot D8, EX-CRUD-18 / ARB-50)
 * =================================================================================================
 * Chaque enregistrement persisté (recherche sauvegardée, modèle suivi, entrée d'historique, cache de
 * snapshot) porte un entier `schemaVersion`. À la lecture, la version est comparée à la version
 * courante `SCHEMA_VERSION` :
 *   - égale                      → utilisée telle quelle ;
 *   - inférieure + migration     → migrée EN MÉMOIRE, utilisée, RÉÉCRITE (seule exception à EX-CRUD-4) ;
 *   - inférieure sans migration  → conservée, utilisable, marquée « à vérifier » ;
 *   - supérieure                 → conservée, NON ouvrable, marquée « version plus récente ».
 * AUCUNE entrée n'est jamais supprimée silencieusement (EX-CRUD-18).
 */

/** Version courante du schéma persisté. À incrémenter à tout changement de forme d'une entité CRUD. */
export const SCHEMA_VERSION = 1;

/** Statut d'un enregistrement vis-à-vis de la version de schéma courante (EX-CRUD-18). */
export type SchemaStatus =
  | { readonly kind: 'current' }
  | { readonly kind: 'migrated'; readonly from: number }
  /** Version antérieure sans fonction de migration : utilisable mais à vérifier. */
  | { readonly kind: 'legacy-unmigratable'; readonly from: number }
  /** Version postérieure à celle de l'app : conservée mais non ouvrable. */
  | { readonly kind: 'from-newer'; readonly version: number };

/** Toute entité persistée porte sa version de schéma. */
export interface Versioned {
  readonly schemaVersion: number;
}

/**
 * Une fonction de migration transforme la FORME d'un enregistrement d'une version vers la suivante,
 * jamais l'intention (EX-CRUD-18). La table est indexée par la version SOURCE.
 */
export type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;

/**
 * Applique en chaîne les migrations disponibles à partir de la version portée par `raw`.
 * Retourne l'enregistrement (éventuellement migré) et le statut de schéma résultant. Ne jette jamais :
 * une entrée non migrable est conservée telle quelle avec un statut explicite.
 */
export function applyMigrations(
  raw: Record<string, unknown>,
  migrations: ReadonlyMap<number, Migration>,
): { readonly value: Record<string, unknown>; readonly status: SchemaStatus } {
  const version = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 0;

  if (version === SCHEMA_VERSION) return { value: raw, status: { kind: 'current' } };

  if (version > SCHEMA_VERSION) {
    return { value: raw, status: { kind: 'from-newer', version } };
  }

  // Version inférieure : tente de migrer pas à pas jusqu'à la version courante.
  let current = raw;
  let v = version;
  while (v < SCHEMA_VERSION) {
    const step = migrations.get(v);
    if (step === undefined) {
      return { value: current, status: { kind: 'legacy-unmigratable', from: version } };
    }
    current = { ...step(current), schemaVersion: v + 1 };
    v += 1;
  }
  return { value: current, status: { kind: 'migrated', from: version } };
}
