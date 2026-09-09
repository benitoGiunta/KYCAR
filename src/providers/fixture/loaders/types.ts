/**
 * KYCAR — Contrat d'accès aux fichiers de fixtures (phase 3.3)
 * =================================================================================================
 * Le provider ne connaît ni `fetch`, ni `fs` : il connaît ce contrat. C'est ce qui permet d'exécuter
 * EXACTEMENT le même code d'adaptation, de dédoublonnage et d'agrégation sous vitest (fichiers sur
 * disque) et dans le navigateur (requêtes HTTP) — la condition pour qu'une sonde verte dise quelque
 * chose de l'application, et non d'un chemin de test parallèle.
 *
 * **Leçon `HANDOFF.md` §7.7** : le chargeur Node importe `node:fs` et ne doit JAMAIS entrer dans le
 * graphe du bundle navigateur. Il vit dans un module séparé (`./node`), n'est importé par aucun
 * barrel de production, et son en-tête le dit.
 */

import type { FixtureProfileIndex, FixtureSnapshotEntry } from '../manifest';

/** Accès aux fichiers d'un jeu de fixtures. Trois opérations, aucune de plus. */
export interface FixtureLoader {
  /** Nom lisible de la source, écrit dans les messages d'erreur (`/fixtures`, un chemin disque…). */
  readonly origin: string;
  /** Index d'un profil : ses snapshots et leur `capturedAt`. */
  loadProfileIndex(profile: string): Promise<FixtureProfileIndex>;
  /** Manifest d'un snapshot, tel quel (le provider en contrôle la forme et la version). */
  loadManifest(profile: string, entry: FixtureSnapshotEntry): Promise<unknown>;
  /**
   * Flux d'octets du fichier d'annonces. Le provider ne suppose RIEN de la compression : il renifle
   * les octets magiques (`ndjson.ts`).
   */
  openListings(profile: string, entry: FixtureSnapshotEntry): Promise<ReadableStream<Uint8Array>>;
}
