# fix-screens-finition — phase 2.8, lot de finition écran B

**Agent `fix-screens-finition` (Sonnet, effort high), 2026-09-08. Worktree
`/home/user/kycar-wt/finition`, branche `fix28/finition`, `node_modules` symlinké depuis la racine.**
Périmètre strict : `src/screens/distribution/Histogram.tsx`, `histogram-model.ts`, `brush-model.ts`,
`ScatterCloud.tsx` (légendes seulement), `distribution.css` (règles de ces éléments),
`tests/review/D7/`, ce rapport. `DistributionScreen.tsx`, `app.tsx` et tout le reste : hors périmètre
(fix-app, en parallèle).

Mandat : `reports/remediation-2.8/FIX-LEAD-DECISIONS-2.8.md` **D8-24**, **D8-25** ;
`reports/remediation-2.8/fix-screens.md` §2 (quatre sous-points laissés) et §4 ;
`reports/FINAL-VERIFICATION.md` §7 (FV-18) ; `docs/requirements/draft-screens.md` `EX-SCR-144/149/
159/170/176/191`, `EX-SCR-113bis`, G15.

---

## 1. Point → sonde rouge → correction → preuve verte → statut

| # | Point | Sonde rouge (avant) | Correction | Preuve verte | Statut |
|---|---|---|---|---|---|
| 1 | **D8-25** — quatre sondes D7 rouges après fusion fix-engine (13 figures au lieu de 14) : le fixture D7 de référence (`fixture()`, `_helpers.ts`) ne porte qu'un seul `countryCode` (`generateSyntheticDataset` le fixe à `0` pour toutes les lignes) ; `RecalcResult.groupStats` étant désormais réel, `EX-SCR-170`/D8-06 masque G15 (« tracé seulement au-delà d'un seul pays ») | `tests/review/D7/ecran-b.test.ts` : `EX-SCR-144/191` (titres), `EX-NFR-15/EX-SCR-188` (14 figures), `EX-SCR-176` (empreintes), mode « Modèle non identifié » (G15 attendu présent) — 4/34 en échec (`expected 14, got 13` / `G15` manquant) | Ajout `withCountryCodes(base, codes)` dans `_helpers.ts` (clone du batch, `countryCode` redistribué cycliquement, moteur + outliers recalculés en entier) ; le fixture de référence `f` du fichier porte désormais deux pays (`withCountryCodes(fixture(1200, 0xb1), [0, 1])`) ; nouveau cas dédié `EX-SCR-170 (D8-25)` sur un fixture volontairement mono-pays (`fixture()` seul), prouvant G15 absent et les 13 autres figures rendues. Justification D8-06/D8-25/D-31 en commentaire, en tête du fichier et sur le nouveau cas. Aucune assertion existante relâchée — seules les DONNÉES d'entrée changent | `npx vitest run --config vitest.review.config.ts tests/review/D7/ecran-b.test.ts` → **35/35 vert** (34 existants + 1 nouveau) | **FAIT** |
| 2 | **D8-24 / EX-SCR-149** — interactions des histogrammes G1–G3 : seul le clic simple était câblé (`onSelectBucket`) ; brossage horizontal, `Ctrl` + clic (sélection non contiguë), double-clic (retrait du filtre) absents | Aucune sonde préexistante (fonctionnalité neuve) — sonde D-32 écrite d'abord (rouge à l'écriture faute d'implémentation), puis rendue verte | `histogram-model.ts` : `envelopeBounds(buckets)` (plus petit intervalle englobant, pur) et `clearMetricFilters(metric)` (repli explicite `undefined`, reconnu par `app.tsx::applyFilters` comme suppression de clé — le contrat `SelectionInput`/`FilterValue` gelé ne peut pas le typer honnêtement, cast justifié en commentaire). `Histogram.tsx` : `onSelectBucket` élargi à `Pick<DistributionBucket,'lowerBound'\|'upperBound'>` (même câblage hôte, aucune rupture) ; brossage horizontal (`mousedown`/`mouseenter`/`mouseup`/`mouseleave`, fermetures locales) ; `Ctrl` + clic (accumulation non contiguë, `Map` MODULE par `graphId` — `Histogram` reste un composant SANS hook, cf. `tests/review/D7/histogrammes.test.ts` qui l'appelle comme une fonction pure) ; double-clic (`onDblClick` sur le `<svg>`) via une nouvelle prop optionnelle `onClearFilter?` (sans effet tant que fix-app ne la câble pas côté `DistributionScreen`/`app.tsx`, même convention que les props D8-06 laissées par `fix-screens.md` §3). Aucune nouvelle prop obligatoire | `npx vitest run --config vitest.review.config.ts tests/review/D7/histogrammes.test.ts` → **22/22 vert** (12 existants + 10 nouveaux, invoquant directement les gestionnaires des VNodes avec de faux événements — `environment: 'node'`, aucun DOM) ; `npx vitest run --no-file-parallelism src/screens/distribution` → 59/59 vert (non-régression) | **FAIT côté écran** — câblage `onClearFilter` : hôte, voir §3 |
| 3 | **D8-24 / EX-SCR-159** — légendes discrètes et brossage désactivé sous 4 offres, absents dans G4 | Aucune sonde préexistante — même protocole (sonde d'abord) | `ScatterCloud.tsx` (légendes + garde d'interaction associée) : `lowSample = points.length < 4` ; `ColorLegend`/`SizeLegend`/`SizeLegendScatter` gagnent une prop `discrete?` → classe `kycar-legend--discrete` (texte atténué, taille réduite, `distribution.css`) ; le `<canvas>` gagne `aria-disabled={lowSample}`, `title="Sélection inutile en dessous de 4 offres"` (texte normatif EX-SCR-159) et la classe `kycar-scatter-canvas--brush-disabled` (curseur dédié) ; `onPointerDown`/`onPointerMove` n'affichent plus l'aperçu de rectangle sous le seuil, `onPointerUp` n'applique ni brossage ni zoom rectangulaire (`Maj` + glisser) pour un VRAI glisser sous le seuil — le clic simple (ouvrir une annonce / effacer un brossage existant) reste, lui, pleinement actif (chemin indépendant du seuil) | `npx vitest run --config vitest.review.config.ts tests/review/D7/ecran-b.test.ts` → **40/40 vert** (35 + 5 nouveaux : classe discrète à `n=3`, absence à `n=4`, `aria-disabled`/message/brossage neutralisé à `n=3`, non-régression à `n=4`, clic simple actif à `n=3`) | **FAIT** |
| 4 | Vérifications finales du lot | — | — | Voir §5 | **FAIT** |

---

## 2. Simplification assumée d'EX-SCR-159 (portée du lot, pas une dette silencieuse)

La spécification complète d'`EX-SCR-159` (draft-screens.md §6.4) décrit, à `n = 1`, un point unique
recentré avec des légendes remplacées par des valeurs littérales exactes, et à `n = 3`, une rampe de
couleur remplacée par **trois pastilles discrètes étiquetées d'années exactes** et trois disques
témoins aux kilométrages exacts. La mission de ce lot demande explicitement une version **plus
étroite** : « légendes discrètes (texte atténué, taille réduite selon l'annexe B) et brossage
désactivé […] quand la sélection compte moins de 4 offres ». C'est cette version bornée qui est
livrée ici — la même légende continue, seulement atténuée visuellement, jamais reconstruite en
pastilles/valeurs littérales. Le seuil retenu (`n < 4`, soit `n ≤ 3`) coïncide avec celui de la
version complète pour le brossage/zoom, donc aucune divergence normative sur ce point ; la
différence porte uniquement sur l'HABILLAGE des légendes à très faible effectif. Le passage à la
version complète (pastilles/valeurs exactes, recentrage à `n = 1`) reste une dette ouverte, à
signaler au coordinateur si le produit l'exige au-delà de ce lot.

---

## 3. § Câblage attendu de fix-app (aucun effet sans lui)

| Prop | Fichier | Signature | Effet | Constat lié |
|---|---|---|---|---|
| `onClearFilter` | `Histogram.tsx` (déjà exposée par `DistributionScreen` → `Histogram`, câblage manquant côté `DistributionScreen.tsx`) | `(metric: 'price' \| 'year' \| 'mileage') => void` | Double-clic dans la zone de tracé d'un histogramme retire le filtre posé par ce graphe. Câblage attendu, symétrique à `onSelectBucket` : `onClearFilter={(metric) => props.onApplyFilters?.(clearMetricFilters(metric))}` (`clearMetricFilters` exportée par `histogram-model.ts`) | D8-24/EX-SCR-149 |

Sans ce câblage, le double-clic ne fait rien (aucune invention de comportement) — le brossage
horizontal, le `Ctrl` + clic (histogrammes) et les légendes discrètes/brossage désactivé (G4) sont, en
revanche, **entièrement fonctionnels sans câblage supplémentaire** : ils réutilisent `onSelectBucket`
(déjà câblé par `DistributionScreen.tsx` avant ce lot) ou n'impliquent aucune prop hôte.

---

## 4. Sondes modifiées avec justification (D-31)

| Fichier | Sonde | Nature du changement | Justification |
|---|---|---|---|
| `tests/review/D7/_helpers.ts` | — | Ajout de `withCountryCodes()` (nouvelle fonction, aucune fonction existante modifiée) | D8-25 : nécessaire pour qu'un fixture D7 porte plus d'un `countryCode` (le générateur synthétique en fixe un seul) |
| `tests/review/D7/ecran-b.test.ts` | Fixture de référence `f`/`tree` du fichier | `fixture(1200, 0xb1)` → `withCountryCodes(fixture(1200, 0xb1), [0, 1])` | D8-25/D8-06/D-31 : restaure les 14 figures partout où G15 n'est pas spécifiquement sous test (prix/km/année/outliers inchangés, seule la colonne pays diffère) |
| `tests/review/D7/ecran-b.test.ts` | `EX-SCR-170 (D8-25)` (nouveau cas) | Ajouté | Prouve le masquage de G15 à un seul pays sur un fixture mono-pays dédié, séparé du fixture de référence — aucune sonde existante affaiblie |
| `tests/review/D7/histogrammes.test.ts` | Describe `EX-SCR-149, D8-24` (10 cas, nouveaux) | Ajouté | Couvre brossage horizontal, `Ctrl` + clic (accumulation/retrait/reset), double-clic, non-régression du clic simple |
| `tests/review/D7/ecran-b.test.ts` | Describe `EX-SCR-159, D8-24` (5 cas, nouveaux) | Ajouté | Couvre légendes discrètes, `aria-disabled`/message/neutralisation du brossage sous 4 offres, non-régression à 4 offres, clic simple non bloqué |

Aucune assertion préexistante n'a été affaiblie ou supprimée dans ce lot ; les seuls changements sur
du code de sonde existant sont l'ajout de `withCountryCodes` (nouvelle fonction) et le remplacement
des DONNÉES d'entrée du fixture de référence de `ecran-b.test.ts` (pas de ses assertions).

---

## 5. Vérification finale de ce lot

```
npx tsc --noEmit -p tsconfig.json          → 0 erreur
npx tsc --noEmit -p tsconfig.review.json   → 0 erreur
npx eslint src/screens/distribution tests/review/D7 → vert
npx vitest run --no-file-parallelism src/screens/distribution → 59/59 vert (6 fichiers)
npx vitest run --config vitest.review.config.ts tests/review/D7 → 110/110 vert (6 fichiers)
npm run build  → 0 erreur/warning (tsc app + worker + vite build)
npm run lint   → vert (eslint .)
npm test       → 914/914 vert (84 fichiers, suite unitaire + sondes de revue)
npm run size   → OK, 108.84/300 KiB gzip (initial), 13.40 KiB (worker, hors manifest)
```

---

## 6. Résumé (8 lignes)

D8-25 : les quatre sondes D7 rouges (13 figures au lieu de 14) venaient d'un fixture D7 mono-pays
(`generateSyntheticDataset` fixe `countryCode = 0`) confronté au masquage réel de G15 (D8-06,
`EX-SCR-170`) depuis la fusion de fix-engine ; corrigé par `withCountryCodes()` (deux pays sur le
fixture de référence) et un cas dédié mono-pays attestant le masquage — `ecran-b.test.ts` 35/35 vert.
D8-24/`EX-SCR-149` : brossage horizontal, `Ctrl` + clic (sélection non contiguë) et double-clic
(retrait du filtre) ajoutés à `Histogram.tsx`/`histogram-model.ts`, entièrement réutilisant
`onSelectBucket` existant (type élargi, pas de rupture) plus une prop optionnelle `onClearFilter`
laissée à fix-app — `histogrammes.test.ts` 22/22 vert. D8-24/`EX-SCR-159` : légendes de G4 atténuées
et brossage/zoom neutralisé (curseur, `aria-disabled`, message normatif) sous 4 offres tracées, clic
simple préservé — version bornée à la mission (documentée §2), `ecran-b.test.ts` 40/40 vert. Aucune
sonde existante affaiblie. `npm run build`, `npm run lint`, `npm test` (914/914) et `npm run size`
tous verts. Trois commits incrémentaux dans ce worktree, **non poussés**.
