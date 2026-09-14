// Rend la matrice de couverture (TSV → Markdown) et calcule les décomptes.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const files = ['matrix-A.tsv', 'matrix-B.tsv', 'matrix-C.tsv'];
const rows = [];
for (const f of files) {
  const lines = readFileSync(resolve(root, f), 'utf8').split('\n').filter((l) => l.trim() !== '');
  for (const line of lines) {
    const cols = line.split('\t');
    if (cols.length < 4) throw new Error(`ligne invalide dans ${f}: ${line.slice(0, 80)}`);
    const [id, annexe, statut, preuve, ecart = '', dette = ''] = cols;
    rows.push({ id, annexe, statut, preuve, ecart, dette });
  }
}
const STATUTS = ['COUVERTE', 'PARTIELLE', 'NON COUVERTE', 'HORS PÉRIMÈTRE'];
for (const r of rows) if (!STATUTS.includes(r.statut)) throw new Error(`statut inconnu ${r.id}: ${r.statut}`);
const ids = new Set(rows.map((r) => r.id));
if (ids.size !== rows.length) throw new Error('identifiants dupliqués');

// Vérification du décompte contre les identifiants déclarés par les annexes.
const expected = readFileSync(resolve(process.env.IDS_ALL), 'utf8').split('\n').filter(Boolean);
const missing = expected.filter((id) => !ids.has(id));
const extra = [...ids].filter((id) => !expected.includes(id) && !/^P-\d$/.test(id));
if (missing.length || extra.length) throw new Error(`manquants: ${missing.join(',')} ; en trop: ${extra.join(',')}`);

const fam = (id) => (id.startsWith('EX-DATA') ? 'A' : id.startsWith('EX-SCR') ? 'B' : id.startsWith('P-') ? 'P' : 'C');
const sub = (id) => (id.match(/^EX-(NAV|SRCH|CRUD|NFR)/)?.[1] ?? null);
const count = (pred) => {
  const c = Object.fromEntries(STATUTS.map((s) => [s, 0]));
  for (const r of rows.filter(pred)) c[r.statut]++;
  c.total = rows.filter(pred).length;
  return c;
};
const stats = { A: count((r) => fam(r.id) === 'A'), B: count((r) => fam(r.id) === 'B'), C: count((r) => fam(r.id) === 'C'), 'C·NAV': count((r) => sub(r.id) === 'NAV'), 'C·SRCH': count((r) => sub(r.id) === 'SRCH'), 'C·CRUD': count((r) => sub(r.id) === 'CRUD'), 'C·NFR': count((r) => sub(r.id) === 'NFR'), P: count((r) => fam(r.id) === 'P'), total485: count((r) => fam(r.id) !== 'P'), all: count(() => true) };
const rate = (c) => ({ couverte: (100 * c.COUVERTE / c.total).toFixed(1), couverteOuHors: (100 * (c.COUVERTE + c['HORS PÉRIMÈTRE']) / c.total).toFixed(1), horsPerimetreExclu: (100 * c.COUVERTE / (c.total - c['HORS PÉRIMÈTRE'])).toFixed(1) });

const esc = (s) => s.replace(/\|/g, '\\|');
let md = '';
const order = ['A', 'B', 'C', 'P'];
const titles = { A: 'Annexe A — `EX-DATA-*` (dictionnaire, agrégation, outliers, entités)', B: 'Annexe B — `EX-SCR-*` (écrans, bandeau, graphes, états, responsive)', C: 'Annexe C — `EX-NAV-*`, `EX-SRCH-*`, `EX-CRUD-*`, `EX-NFR-*`', P: 'REQUIREMENTS §10 — `P-1…P-6` (confidentialité et conformité, hors décompte des 485)' };
const numKey = (id) => { const m = id.match(/-(\d+)(bis|ter|quater|quinquies)?$/); const suf = { undefined: 0, bis: 1, ter: 2, quater: 3, quinquies: 4 }[m?.[2]]; return [Number(m?.[1] ?? 0), suf]; };
const famOrder = { NAV: 0, SRCH: 1, CRUD: 2, NFR: 3 };
for (const f of order) {
  const list = rows.filter((r) => fam(r.id) === f).sort((a, b) => { const fa = famOrder[sub(a.id)] ?? 0, fb = famOrder[sub(b.id)] ?? 0; if (fa !== fb) return fa - fb; const [na, sa] = numKey(a.id), [nb, sb] = numKey(b.id); return na - nb || sa - sb; });
  md += `\n### 2.${order.indexOf(f) + 1} ${titles[f]}\n\n`;
  md += `| Identifiant | Annexe | Statut | Preuve d'exécution | Écart nommé | Dette / décision |\n|---|---|---|---|---|---|\n`;
  for (const r of list) md += `| \`${r.id}\` | ${r.annexe} | **${r.statut}** | ${esc(r.preuve)} | ${esc(r.ecart) || '—'} | ${esc(r.dette) || '—'} |\n`;
}
writeFileSync(resolve(root, 'matrix.md'), md);
writeFileSync(resolve(root, 'matrix-stats.json'), JSON.stringify({ stats, rates: Object.fromEntries(Object.entries(stats).map(([k, v]) => [k, rate(v)])) }, null, 2));

// Listes nominatives
const lists = {};
for (const s of ['PARTIELLE', 'NON COUVERTE', 'HORS PÉRIMÈTRE']) lists[s] = rows.filter((r) => r.statut === s).map((r) => ({ id: r.id, ecart: r.ecart, dette: r.dette }));
writeFileSync(resolve(root, 'matrix-lists.json'), JSON.stringify(lists, null, 2));
console.log(JSON.stringify(stats, null, 1));
console.log('avec dette motivée :', rows.filter((r) => (r.statut === 'PARTIELLE' || r.statut === 'NON COUVERTE') && /dette motivée|décision D-|point ouvert O15|DR-1\d\d \(§6\.5\)/.test(r.dette)).length,
  'sans dette (2.8) :', rows.filter((r) => (r.statut === 'PARTIELLE' || r.statut === 'NON COUVERTE') && !/dette motivée|décision D-|point ouvert O15|DR-1\d\d \(§6\.5\)/.test(r.dette)).length);
