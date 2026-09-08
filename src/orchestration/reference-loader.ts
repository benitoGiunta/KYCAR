/**
 * KYCAR — Chargeur runtime des référentiels statiques (lot D8)
 * =================================================================================================
 * `src/types/reference.ts` (D2) fournit la fonction PURE `buildReferenceData(raw)` mais laisse
 * EXPLICITEMENT le fetch au démarrage à l'app (D8, EX-NFR-4). Ce module l'implémente côté navigateur :
 * il récupère la taxonomie, les énumérations et les fichiers de référence sous `/reference/*` (servis
 * par le plugin Vite `kycar-reference-data`, jamais inlinés dans le bundle — garde EX-NFR-10) et
 * assemble le `RawReferenceInputs` attendu par D2.
 *
 * Chargement progressif (EX-NFR-9) : la taxonomie (~692 Ko, < 1 Mo gzip EX-NFR-4) et les 15 fichiers
 * de référence sont récupérés en PARALLÈLE ; aucun n'est bloquant au-delà du premier affichage utile
 * du mode 1, qui n'a besoin que des agrégats de base (voir `data-controller.ts`).
 */

import { buildReferenceData, type RawReferenceInputs, type ReferenceData, type RawReferenceFile } from '../types/reference';

/** Fichiers `references/<Name>.json` requis par l'assemblage des 27 vocabulaires (D2). */
export const REQUIRED_REFERENCE_FILES: readonly string[] = [
  'FuelCategory',
  'FuelType',
  'OfferType',
  'Transmission',
  'Drivetrain',
  'BodyType',
  'BodyColor',
  'UpholsteryType',
  'UpholsteryColor',
  'EuEmissionStandard',
  'Co2Class',
  'EfficiencyClass',
  'BatteryOwnershipType',
  'Equipment',
  'VehicleType',
];

/** Base publique des référentiels (servie en dev par le plugin, copiée en `dist/reference` au build). */
const REFERENCE_BASE = '/reference';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`référentiel indisponible (${res.status}) : ${url}`);
  return (await res.json()) as T;
}

/** Récupère et assemble les entrées brutes des référentiels depuis `/reference/*`. */
export async function fetchRawReferenceInputs(base: string = REFERENCE_BASE): Promise<RawReferenceInputs> {
  const [taxonomy, filters, filtersScope, ...refFiles] = await Promise.all([
    fetchJson<RawReferenceInputs['taxonomy']>(`${base}/taxonomy.json`),
    fetchJson<RawReferenceInputs['filters']>(`${base}/filters.json`),
    fetchJson<RawReferenceInputs['filtersScope']>(`${base}/filters-scope.json`),
    ...REQUIRED_REFERENCE_FILES.map((name) => fetchJson<RawReferenceFile>(`${base}/references/${name}.json`)),
  ]);

  const referenceFiles: Record<string, RawReferenceFile> = {};
  REQUIRED_REFERENCE_FILES.forEach((name, i) => {
    const file = refFiles[i];
    if (file !== undefined) referenceFiles[file.referenceType ?? name] = file;
  });

  return { taxonomy, filters, filtersScope, referenceFiles };
}

/** Charge et construit la structure de référence typée (D2) prête pour le provider et les écrans. */
export async function loadReferenceData(base?: string): Promise<ReferenceData> {
  const raw = await fetchRawReferenceInputs(base);
  return buildReferenceData(raw);
}
