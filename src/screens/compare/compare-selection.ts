/**
 * KYCAR — Sélection de comparaison, entité de SESSION (lot D8, EX-CRUD-13bis / ARB-43)
 * =================================================================================================
 * `{ modelKeys: liste ordonnée de couples (makeId, modelId), 0 à 4 }`. NON persistée (ni
 * localStorage, ni IndexedDB, ni URL hors `/comparer`) — la coquille la tient en mémoire de session
 * et la vide au remplacement du snapshot (EX-NAV-24). Ce module n'est QUE la logique pure : plafond
 * dur 4, doublons interdits, `modelId = 0` (clé réservée) exclu (EX-NAV-20), et le codec du
 * paramètre `m` de `/comparer` (EX-NAV-10bis) avec écrêtage signalé au-delà du 4ᵉ.
 */

export const MAX_COMPARE = 4;

export interface CompareModelKey {
  readonly makeId: number;
  readonly modelId: number;
}

function sameKey(a: CompareModelKey, b: CompareModelKey): boolean {
  return a.makeId === b.makeId && a.modelId === b.modelId;
}

/** Ajoute un couple si absent, si `modelId !== 0` et sous le plafond. Retourne la (nouvelle) liste. */
export function addToCompare(current: readonly CompareModelKey[], key: CompareModelKey): readonly CompareModelKey[] {
  if (key.modelId === 0) return current; // clé réservée « Modèle non identifié » exclue (EX-NAV-20)
  if (current.some((k) => sameKey(k, key))) return current; // doublon interdit, sans effet
  if (current.length >= MAX_COMPARE) return current; // plafond : ajout ignoré (contrôle désactivé en amont)
  return [...current, key];
}

export function removeFromCompare(current: readonly CompareModelKey[], key: CompareModelKey): readonly CompareModelKey[] {
  return current.filter((k) => !sameKey(k, key));
}

/** Sérialise en tokens `makeId.modelId` pour le paramètre multi-valeurs `m` (EX-NAV-10bis). */
export function serializeCompareParam(keys: readonly CompareModelKey[]): string {
  return keys.map((k) => `${k.makeId}.${k.modelId}`).join(',');
}

export interface ParseCompareResult {
  readonly keys: readonly CompareModelKey[];
  /** Vrai si l'entrée dépassait 4 couples et a été écrêtée (à signaler par ET-URL-CORRIGEE). */
  readonly clipped: boolean;
}

/**
 * Analyse le paramètre `m` (déjà scindé par virgule ou chaîne brute). Ignore les tokens malformés et
 * `modelId = 0`, dédoublonne, et écrête au 4ᵉ couple en signalant l'écrêtage (EX-CRUD-13bis).
 */
export function parseCompareParam(raw: string | readonly string[] | null | undefined): ParseCompareResult {
  if (raw === null || raw === undefined) return { keys: [], clipped: false };
  const tokens = Array.isArray(raw) ? raw : String(raw).split(',');
  const keys: CompareModelKey[] = [];
  let clipped = false;
  for (const token of tokens) {
    const [makeStr, modelStr] = token.split('.');
    const makeId = Number(makeStr);
    const modelId = Number(modelStr);
    if (!Number.isSafeInteger(makeId) || !Number.isSafeInteger(modelId) || makeId <= 0) continue;
    if (modelId === 0) continue; // EX-NAV-20
    const key = { makeId, modelId };
    if (keys.some((k) => sameKey(k, key))) continue;
    if (keys.length >= MAX_COMPARE) {
      clipped = true;
      continue;
    }
    keys.push(key);
  }
  return { keys, clipped };
}
