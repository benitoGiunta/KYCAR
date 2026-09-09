/**
 * KYCAR — Lecture EN FLUX d'un NDJSON gzip (phase 3.3)
 * =================================================================================================
 * Le fichier d'un snapshot fait de 1,5 Mio (profil `dev`) à ~30 Mio non compressés (profil `perf`).
 * Le lire par `await response.text()` matérialiserait tout le texte, PUIS tout le tableau d'objets :
 * deux fois la taille du fichier sur le tas, sur le chemin critique d'`openSnapshot`, pour un
 * budget mémoire déjà tendu (ARB-55, enveloppe 274 Mo à 10⁶ lignes).
 *
 * Ce module découpe donc le flux **ligne à ligne** : à tout instant, seuls le tampon de la ligne
 * courante et le morceau reçu vivent en mémoire. L'appelant reçoit chaque ligne et n'en garde que
 * ce qu'il retient (une ligne adaptée pèse ce que pèsent ses colonnes, pas son JSON).
 *
 * **Décompression : reniflage des octets magiques, jamais une confiance dans l'en-tête.**
 * Un `.gz` servi sur le réseau peut arriver de deux façons :
 *   - tel quel, `Content-Type: application/octet-stream` — le corps EST du gzip, à décompresser ;
 *   - avec `Content-Encoding: gzip`, que le navigateur décode LUI-MÊME — le corps est déjà du texte.
 * Le second cas dépend de la configuration du serveur statique, pas de nous, et l'en-tête reste
 * visible dans `Response.headers` même quand le corps a été décodé : le lire ne tranche donc pas.
 * On regarde les deux premiers octets du flux (`1f 8b`, RFC 1952) et on branche
 * `DecompressionStream('gzip')` seulement s'ils sont là. Le mécanisme est petit, testable, et
 * immunisé contre la configuration d'hébergement — y compris `vite preview` et un hébergeur tiers.
 */

/** Ce qu'on sait d'un flux après l'avoir lu jusqu'au bout. */
export interface NdjsonReadResult {
  /** Nombre de lignes NON VIDES transmises au rappel. */
  readonly lineCount: number;
  /** Octets DÉCOMPRESSÉS traversés (le dénominateur des mesures de taille). */
  readonly uncompressedBytes: number;
  /** Vrai si le flux était compressé et a été décompressé ici. */
  readonly wasGzipped: boolean;
  /** SHA-256 hexadécimal minuscule des octets décompressés, si `hash` était demandé. */
  readonly sha256: string | null;
}

/** Options de `readNdjsonStream`. */
export interface NdjsonReadOptions {
  /**
   * Appelé pour chaque ligne non vide, dans l'ordre du fichier. Une exception levée ici interrompt
   * la lecture : c'est voulu, un appelant qui ne sait pas quoi faire d'une ligne ne doit pas
   * continuer à en lire un million.
   */
  readonly onLine: (line: string, index: number) => void;
  /**
   * Calculer le SHA-256 des octets décompressés (`manifest.sha256`). **Coûteux en mémoire** : il
   * faut conserver le flux entier pour le hacher (`crypto.subtle.digest` n'a pas d'API
   * incrémentale). Réservé aux profils où le coût est négligeable — voir `FixtureDataProvider`.
   */
  readonly hash?: boolean;
}

const GZIP_MAGIC_0 = 0x1f;
const GZIP_MAGIC_1 = 0x8b;

/**
 * Reconstitue un flux à partir d'un premier morceau déjà lu et du reste du lecteur. C'est ce qui
 * permet de RENIFLER les octets magiques sans perdre le morceau consommé.
 */
function restream(first: Uint8Array | null, reader: ReadableStreamDefaultReader<Uint8Array>): ReadableStream<Uint8Array> {
  let emittedFirst = false;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (!emittedFirst) {
        emittedFirst = true;
        if (first !== null && first.length > 0) {
          controller.enqueue(first);
          return;
        }
      }
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      if (value !== undefined) controller.enqueue(value);
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
}

/** Vrai si les deux premiers octets sont l'en-tête gzip de la RFC 1952. */
export function looksGzipped(bytes: Uint8Array | null): boolean {
  return bytes !== null && bytes.length >= 2 && bytes[0] === GZIP_MAGIC_0 && bytes[1] === GZIP_MAGIC_1;
}

/**
 * Lit un flux d'octets NDJSON (compressé ou non) et transmet chaque ligne au rappel.
 *
 * Le découpage se fait sur `\n` ; un `\r` final est retiré (un fichier produit sous Windows ne doit
 * pas faire échouer le `JSON.parse` de chaque ligne). La dernière ligne est transmise même sans
 * saut de ligne final.
 */
export async function readNdjsonStream(
  source: ReadableStream<Uint8Array>,
  options: NdjsonReadOptions,
): Promise<NdjsonReadResult> {
  const reader = source.getReader();
  const firstRead = await reader.read();
  const firstChunk = firstRead.done ? null : (firstRead.value ?? null);
  const gzipped = looksGzipped(firstChunk);

  let stream = restream(firstChunk, reader);
  if (gzipped) {
    // `DecompressionStream` déclare `WritableStream<BufferSource>` en entrée et
    // `ReadableStream<Uint8Array>` en sortie ; `pipeThrough` exige la paire exacte. La
    // conversion est un ajustement de TYPE, jamais de valeur : les octets traversent tels quels.
    stream = stream.pipeThrough(
      new DecompressionStream('gzip') as unknown as ReadableWritablePair<Uint8Array, Uint8Array>,
    );
  }

  const decoder = new TextDecoder('utf-8');
  const chunks: Uint8Array[] = [];
  let uncompressedBytes = 0;
  let lineCount = 0;
  let pending = '';

  const emit = (raw: string): void => {
    const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
    if (line.length === 0) return;
    options.onLine(line, lineCount);
    lineCount += 1;
  };

  const plainReader = stream.getReader();
  for (;;) {
    const { done, value } = await plainReader.read();
    if (done) break;
    if (value === undefined) continue;
    uncompressedBytes += value.byteLength;
    if (options.hash === true) chunks.push(value);
    pending += decoder.decode(value, { stream: true });
    // Découpage par CURSEUR, jamais par `slice` répété : réaffecter `pending` à chaque ligne
    // recopierait la fin du tampon autant de fois qu'il contient de lignes, soit un coût
    // QUADRATIQUE dans un morceau de 64 Kio qui en porte deux cents. On avance un index et on ne
    // recopie qu'une fois, la queue incomplète, à la fin du morceau.
    let from = 0;
    let nl = pending.indexOf('\n', from);
    while (nl >= 0) {
      emit(pending.slice(from, nl));
      from = nl + 1;
      nl = pending.indexOf('\n', from);
    }
    pending = from === 0 ? pending : pending.slice(from);
  }
  pending += decoder.decode();
  if (pending.length > 0) emit(pending);

  let sha256: string | null = null;
  if (options.hash === true) {
    sha256 = await sha256HexOfChunks(chunks, uncompressedBytes);
  }

  return { lineCount, uncompressedBytes, wasGzipped: gzipped, sha256 };
}

/**
 * SHA-256 hexadécimal minuscule d'une suite de morceaux, via `crypto.subtle` — présent dans les
 * quatre navigateurs cibles (en contexte sécurisé, `localhost` compris) et sous Node 22.
 * L'implémentation maison de `src/types/sha256.ts` est SYNCHRONE et prend une chaîne : hacher
 * plusieurs mégaoctets par elle bloquerait le fil principal, ce qu'`EX-NFR-9` ne tolère pas.
 */
async function sha256HexOfChunks(chunks: readonly Uint8Array[], totalBytes: number): Promise<string> {
  const all = new Uint8Array(totalBytes);
  let at = 0;
  for (const c of chunks) {
    all.set(c, at);
    at += c.byteLength;
  }
  const digest = await crypto.subtle.digest('SHA-256', all);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
