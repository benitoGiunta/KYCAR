/**
 * KYCAR — Collection CRUD persistée à plafond dur (lot D8, EX-CRUD-5/10/12/18/19)
 * =================================================================================================
 * Générique partagé par les trois collections CRUD (recherches sauvegardées, modèles suivis,
 * historique récent). Garanties :
 *   - EX-CRUD-18 : chaque entrée porte `schemaVersion` ; à la lecture, les entrées migrables sont
 *     migrées EN MÉMOIRE et RÉÉCRITES ; aucune entrée n'est jamais supprimée silencieusement — une
 *     entrée non-objet est IGNORÉE sans faire échouer la lecture (`DR-098`), et un blob illisible est
 *     PRÉSERVÉ sous une clé `.corrupt` avant toute réécriture, l'échec étant annoncé (`DR-097`).
 *   - EX-CRUD-19 / ADV-13 (`D-16`, `DR-096`) : **une clé `localStorage` par entrée**
 *     (`kycar:<collection>/<id>`) plus une clé d'INDEX ordonné (`kycar:<collection>#index`). Une
 *     mutation n'écrit que l'entrée touchée et l'index ; l'index est RELU juste avant son écriture et
 *     réconcilié avec ce qu'un autre onglet y a ajouté entre-temps, de sorte que l'entrelacement
 *     lire(A) → écrire(B) → écrire(A) ne perd jamais l'entrée de B. Pas de `navigator.locks` (D-16).
 *
 * Le format HISTORIQUE (une seule clé portant tout le tableau) reste lu : ses entrées continuent
 * d'apparaître dans `list()` et ne sont réécrites que si elles changent réellement — une collection
 * enregistrée par une version antérieure de l'application n'est jamais perdue ni recopiée à l'aveugle.
 */

import type { KvBackend } from './kv';
import { applyMigrations, type Migration, type SchemaStatus, type Versioned } from './schema';

/** Entrée chargée : la valeur (éventuellement migrée) et son statut de schéma (EX-CRUD-18). */
export interface LoadedRecord<T extends Versioned> {
  readonly value: T;
  readonly status: SchemaStatus;
}

/** Levée quand une écriture dépasserait le plafond dur de la collection (EX-CRUD-5/10). */
export class CapExceededError extends Error {
  readonly cap: number;
  constructor(cap: number, message: string) {
    super(message);
    this.name = 'CapExceededError';
    this.cap = cap;
  }
}

/**
 * `DR-097` (`EX-CRUD-18`) — levée quand une écriture arriverait par-dessus une collection illisible.
 * Le blob illisible est d'abord COPIÉ sous `<clé>.corrupt` (nommée dans le message), puis retiré de
 * la clé active : rien n'est perdu, l'utilisateur est prévenu, et l'application reste utilisable.
 */
export class CorruptCollectionError extends Error {
  readonly backupKey: string;
  constructor(backupKey: string) {
    super(
      `Les données enregistrées étaient illisibles : elles ont été conservées sous « ${backupKey} » et n’ont pas été écrasées. Réessayez votre enregistrement.`,
    );
    this.name = 'CorruptCollectionError';
    this.backupKey = backupKey;
  }
}

export interface CappedCollectionOptions<T extends Versioned = Versioned> {
  readonly backend: KvBackend;
  readonly key: string;
  readonly cap: number;
  readonly migrations?: ReadonlyMap<number, Migration>;
  /**
   * Identité stable d'une entrée (`D-16`). Fournie ⇒ écriture PAR ENTRÉE + index ordonné ; absente ⇒
   * format historique (le tableau entier sous une seule clé), conservé pour les collections
   * anonymes et pour la compatibilité ascendante des tests de migration.
   */
  readonly idOf?: (value: T) => string;
}

const NO_MIGRATIONS: ReadonlyMap<number, Migration> = new Map();

/** Suffixe de la clé d'index ordonné (jamais une clé d'entrée : `/` sépare l'identifiant). */
export const INDEX_KEY_SUFFIX = '#index';
/** Suffixe de la clé de sauvegarde d'un blob illisible (`DR-097`). */
export const CORRUPT_KEY_SUFFIX = '.corrupt';

function parseArray(raw: string): Record<string, unknown>[] | null {
  const parsed: unknown = JSON.parse(raw);
  return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : null;
}

export class CappedCollection<T extends Versioned> {
  private readonly backend: KvBackend;
  private readonly key: string;
  readonly cap: number;
  private readonly migrations: ReadonlyMap<number, Migration>;
  private readonly idOf?: (value: T) => string;
  /** Blob illisible observé à la lecture, en attente d'être préservé (`DR-097`). */
  private corruptRaw: string | null = null;

  constructor(options: CappedCollectionOptions<T>) {
    this.backend = options.backend;
    this.key = options.key;
    this.cap = options.cap;
    this.migrations = options.migrations ?? NO_MIGRATIONS;
    this.idOf = options.idOf as ((value: Versioned) => string) | undefined as ((value: T) => string) | undefined;
  }

  private get indexKey(): string {
    return `${this.key}${INDEX_KEY_SUFFIX}`;
  }

  private entryKey(id: string): string {
    return `${this.key}/${id}`;
  }

  /**
   * Identifiants de l'index ordonné (format par entrée). Tolérant : `[]` si absent ou illisible.
   *
   * `E2E-25` (`EX-CRUD-19`, `ADV-13`) — l'index est AUTO-RÉPARATEUR. La relecture-réconciliation de
   * `mutate` (étape 3) ne protégeait que ce que l'index CITAIT déjà : deux onglets qui écrivaient au
   * même instant produisaient bien deux blobs d'entrée, mais le dernier écrivain écrasait l'index du
   * premier, dont l'entrée devenait orpheline — invisible à jamais sur l'écran E, sans message
   * (mesuré 7 à 8 rondes perdantes sur 8). Le verrou `navigator.locks` étant écarté par `D-16`, la
   * réparation se fait ici : à CHAQUE lecture, l'index est réconcilié avec les clés
   * `<collection>/<id>` réellement présentes dans le stockage. Une entrée écrite ne peut alors plus
   * être perdue par une course sur l'index — au pire elle change de rang.
   *
   * L'ordre de l'index stocké fait foi ; les orphelines sont ajoutées ensuite, dans l'ordre
   * d'énumération du backend (stable pour `localStorage` comme pour `memoryBackend`).
   */
  private readIndex(): string[] {
    const stored = this.backend.get(this.indexKey);
    let ids: string[] = [];
    if (stored !== null) {
      try {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) ids = parsed.filter((v): v is string => typeof v === 'string');
      } catch {
        ids = [];
      }
    }
    return this.reconcileWithStoredEntries(ids);
  }

  /** `E2E-25` — complète une liste d'identifiants par les blobs d'entrée présents qu'elle ignore. */
  private reconcileWithStoredEntries(ids: readonly string[]): string[] {
    if (this.idOf === undefined || typeof this.backend.keys !== 'function') return [...ids];
    const prefix = `${this.key}/`;
    const seen = new Set(ids);
    const out = [...ids];
    for (const key of this.backend.keys(prefix)) {
      const id = key.slice(prefix.length);
      if (id.length === 0 || seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
    return out;
  }

  /**
   * Lit les entrées du blob HISTORIQUE (une clé, tout le tableau), sans migration. Une entrée
   * non-objet est IGNORÉE (`DR-098` : `list()` ne lève jamais) ; un blob illisible est mémorisé pour
   * être préservé à la première écriture (`DR-097`) et lu comme vide.
   */
  private readLegacyRaw(): Record<string, unknown>[] {
    const stored = this.backend.get(this.key);
    if (stored === null) return [];
    try {
      const parsed = parseArray(stored);
      if (parsed === null) {
        this.corruptRaw = stored;
        return [];
      }
      this.corruptRaw = null;
      return parsed.filter((e): e is Record<string, unknown> => e !== null && typeof e === 'object' && !Array.isArray(e));
    } catch {
      this.corruptRaw = stored;
      return [];
    }
  }

  /** Lit les entrées par clé (format `D-16`), dans l'ordre de l'index. */
  private readPerEntryRaw(): { id: string; raw: Record<string, unknown> }[] {
    if (this.idOf === undefined) return [];
    const out: { id: string; raw: Record<string, unknown> }[] = [];
    for (const id of this.readIndex()) {
      const stored = this.backend.get(this.entryKey(id));
      if (stored === null) continue;
      try {
        const parsed: unknown = JSON.parse(stored);
        if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
          out.push({ id, raw: parsed as Record<string, unknown> });
        }
      } catch {
        // Entrée illisible : ignorée, jamais écrasée (elle reste sous sa propre clé).
      }
    }
    return out;
  }

  /**
   * Charge et migre. Les entrées migrées du blob historique sont RÉÉCRITES en version courante
   * (EX-CRUD-18). Aucune entrée n'est jamais retirée (même « from-newer » ou « legacy-unmigratable »).
   */
  load(): LoadedRecord<T>[] {
    const legacyRaw = this.readLegacyRaw();
    let mutated = false;
    const legacy = legacyRaw.map((entry) => {
      const { value, status } = applyMigrations(entry, this.migrations);
      if (status.kind === 'migrated') mutated = true;
      return { value: value as unknown as T, status };
    });
    if (mutated) {
      this.backend.set(this.key, JSON.stringify(legacy.map((r) => r.value)));
    }

    const perEntry = this.readPerEntryRaw().map(({ raw }) => {
      const { value, status } = applyMigrations(raw, this.migrations);
      return { value: value as unknown as T, status };
    });

    // Ordre : les entrées PAR CLÉ (index ordonné, format courant) d'abord, puis ce que le blob
    // historique porte encore et que l'index ne connaît pas.
    const seen = new Set(this.idOf === undefined ? [] : perEntry.map((r) => this.idOf!(r.value)));
    const tail = this.idOf === undefined ? legacy : legacy.filter((r) => !seen.has(this.idOf!(r.value)));
    return [...perEntry, ...tail];
  }

  /** Valeurs seules, ordre de stockage. */
  values(): T[] {
    return this.load().map((r) => r.value);
  }

  /** Nombre d'entrées OUVRABLES (exclut « from-newer », non ouvrable — EX-CRUD-18). */
  private openableCount(records: LoadedRecord<T>[]): number {
    return records.filter((r) => r.status.kind !== 'from-newer').length;
  }

  /**
   * Relecture-vérification-écriture (EX-CRUD-19). Relit l'état frais, laisse `fn` produire le nouvel
   * état, puis écrit — ENTRÉE PAR ENTRÉE quand l'identité est connue (`D-16`), avec réconciliation de
   * l'index relu à l'instant de l'écriture (concurrence inter-onglets, ADV-13). `fn` peut lever
   * `CapExceededError` pour refuser.
   */
  mutate(fn: (current: LoadedRecord<T>[]) => T[]): T[] {
    const current = this.load();
    this.assertWritable();
    const next = fn(current);

    if (this.idOf === undefined) {
      this.backend.set(this.key, JSON.stringify(next));
      return next;
    }

    const idOf = this.idOf;
    const legacyIds = new Set(
      current
        .filter((r) => !this.hasEntryKey(idOf(r.value)))
        .map((r) => idOf(r.value)),
    );
    const nextIds = next.map(idOf);
    const nextById = new Map(next.map((v) => [idOf(v), v] as const));

    // 1. Écriture des entrées propres au format par clé (jamais la collection entière).
    for (const value of next) {
      const id = idOf(value);
      if (legacyIds.has(id)) continue; // portée par le blob historique, traitée en 4.
      const serialized = JSON.stringify(value);
      if (this.backend.get(this.entryKey(id)) !== serialized) this.backend.set(this.entryKey(id), serialized);
    }

    // 2. Suppression des entrées retirées PAR CETTE MUTATION (jamais celles qu'on n'a pas lues).
    for (const record of current) {
      const id = idOf(record.value);
      if (!nextById.has(id) && !legacyIds.has(id)) this.backend.remove(this.entryKey(id));
    }

    // 3. Index : relu à l'instant, réconcilié — tout identifiant apparu entre la lecture et
    //    l'écriture (autre onglet) est CONSERVÉ (EX-CRUD-19 : jamais de perte d'entrée existante).
    const known = new Set(current.map((r) => idOf(r.value)));
    const fresh = this.readIndex();
    const ordered = nextIds.filter((id) => !legacyIds.has(id));
    const reconciled = [...ordered, ...fresh.filter((id) => !known.has(id) && !ordered.includes(id))];
    this.backend.set(this.indexKey, JSON.stringify(reconciled));

    // 4. Blob historique : réécrit UNIQUEMENT si son contenu change réellement (entrée supprimée ou
    //    modifiée par cette mutation) — sinon il reste octet pour octet celui de la version qui l'a
    //    écrit (EX-CRUD-18).
    if (legacyIds.size > 0) {
      const legacyNext = current
        .filter((r) => legacyIds.has(idOf(r.value)))
        .map((r) => nextById.get(idOf(r.value)))
        .filter((v): v is T => v !== undefined);
      const serialized = JSON.stringify(legacyNext);
      if (this.backend.get(this.key) !== serialized) this.backend.set(this.key, serialized);
    }

    return next;
  }

  /** Vrai si l'entrée existe sous sa propre clé (format `D-16`), faux si elle vient du blob. */
  private hasEntryKey(id: string): boolean {
    return this.backend.get(this.entryKey(id)) !== null;
  }

  /**
   * `DR-097` — refuse d'écrire par-dessus un blob illisible : il est d'abord PRÉSERVÉ sous
   * `<clé>.corrupt` et retiré de la clé active, et l'échec est ANNONCÉ par une erreur affichable.
   */
  private assertWritable(): void {
    const corrupt = this.corruptRaw;
    if (corrupt === null) return;
    const backupKey = `${this.key}${CORRUPT_KEY_SUFFIX}`;
    this.corruptRaw = null;
    this.backend.set(backupKey, corrupt);
    this.backend.remove(this.key);
    throw new CorruptCollectionError(backupKey);
  }

  /** Vide entièrement la collection (EX-CRUD-13 pour l'historique). */
  clear(): void {
    if (this.idOf !== undefined) {
      for (const id of this.readIndex()) this.backend.remove(this.entryKey(id));
      this.backend.remove(this.indexKey);
    }
    this.backend.remove(this.key);
    this.corruptRaw = null;
  }

  /** Vérifie le plafond avant un ajout, en comptant les entrées ouvrables fraîchement relues. */
  assertCanAdd(records: LoadedRecord<T>[], message: string): void {
    if (this.openableCount(records) >= this.cap) throw new CapExceededError(this.cap, message);
  }
}
