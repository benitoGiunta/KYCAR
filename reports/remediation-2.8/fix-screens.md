# fix-screens — vague F1 de la phase 2.8

**Agent `fix-screens` (Sonnet, effort high), 2026-09-08. Worktree `/home/user/kycar-wt/screens`,
branche `fix28/screens`, `node_modules` symlinké depuis la racine.** Périmètre : `src/screens/`,
`src/components/filters/` (lecture, aucune modification faite), tests associés sous `tests/review/`
et `src/screens/*/*.test.ts`. Interdits respectés : `src/app*`, `src/main.tsx`,
`src/persistence`, `src/orchestration`, `src/engine`, `src/providers`, `src/state` (sauf lecture).
Extension explicite de périmètre accordée en cours de mission par le coordinateur : `tests/e2e/`,
strictement pour flipper les six `test.fail()` listés en fin de rapport (D8-17).

Mandat : `reports/remediation-2.8/FIX-LEAD-DECISIONS-2.8.md` D8-02, D8-06, D8-07, D8-08, D8-10,
D8-12, D8-14, D8-15 ; puis directive coordinateur du même jour portant les constats E2E-11/15/17/
18/19/20 (`reports/remediation/e2e-harness.md`).

---

## 1. Point → sonde rouge → correction → preuve verte → statut

| # | Point | Sonde rouge (avant) | Correction | Preuve verte (commande + résultat) | Statut |
|---|---|---|---|---|---|
| 1 | **D8-02 / FV-02** — `MakeCard`/`view-model.ts` comptait le cardinal de marque en dénombrant `modelAggregates` (chargé à la demande), donnant `0` avant tout chargement du détail | `src/screens/market/view-model.test.ts` (nouveaux cas) : `modelCount` retombait à `0` sans `modelAggregates` | `buildMakeCardViewModel` lit désormais `agg.modelCount` (champ obligatoire côté `MakeAggregate`, posé par fix-foundation) ; `modelCountLabel` affiche `« — »` si `null`, jamais `0` par défaut | `npx vitest run src/screens/market/view-model.test.ts` → vert ; `npx vitest run --config vitest.review.config.ts tests/review/D6/ex-scr-132-modeles-indisponibles.test.ts` → vert (D8-19, divergence temporaire documentée : le moteur reste neutre tant que fix-engine n'a pas fusionné) | **FAIT** |
| 2 | **D8-02** — seuil de repliement à 6 zones (« +n autres ») codé en dur dans le JSX de `MakeCard.tsx`, insensible au régime | `tests/review/D6/seuil-60-marques.test.ts`, `structure-a11y.test.ts` | `MakeCardViewModel.modelsVisibleBeforeCollapse` publié par `view-model.ts`, lu par `MakeCard.tsx` au lieu du littéral `6` | `npx vitest run --config vitest.review.config.ts tests/review/D6` → vert | **FAIT** |
| 3 | **D8-07** — `graphs-model.ts` recalculait G5/G6/G9/G10/G12/G13/G14/G15 sur le thread principal depuis `ListingColumnBatch`, en doublon du moteur (dette D-17) | `tests/review/D7/ecran-b.test.ts` (nouveaux cas `RecalcResult`-only) | Rewrite complet de `graphs-model.ts` : consomme `RecalcResult.groupStats/ntiles/powerTiers/depreciationIndex/cellStats/sample` (protocole `src/engine/stats-protocol.ts`, posé par fix-foundation) ; `group-stat.ts` (mort) supprimé ; état `'unavailable'` explicite tant que le champ n'est pas rempli, **jamais** de recalcul de repli silencieux. G8 gagne le libellé normatif EX-SCR-164 (modèle + R²) | `npx tsc --noEmit -p tsconfig.json && npx tsc --noEmit -p tsconfig.review.json` → 0 erreur ; `npx vitest run src/screens/distribution/graphs-model.test.ts` (fixtures reconstruites) → vert ; `npx vitest run --config vitest.review.config.ts tests/review/D7/ecran-b.test.ts` → 34/34 vert | **FAIT côté écran** — dette temporaire consignée (D8-19) : tous les champs `RecalcResult.*` valent `undefined` tant que fix-engine n'a pas fusionné son calcul dans ce worktree ; chaque graphe concerné affiche « données indisponibles », jamais un recalcul erroné |
| 4 | **D8-08** — colonne « TVA » manquante sur l'écran D, export CSV incomplet | `tests/review/D7/ecran-d.test.ts` (`R-D7-16`, `it.fails`) | Colonne triable ajoutée via `listing-fields.ts`/`listings-model.ts`/`readVatDeductible` (`src/types/sentinels.ts`, posé par fix-foundation) ; export CSV mis à jour (`csv-export.ts`) | `npx vitest run --config vitest.review.config.ts tests/review/D7/ecran-d.test.ts` → 21/21 vert, `R-D7-16` repassé de `it.fails` à `it` | **FAIT** — `it.fails` **levée** |
| 5 | **D8-10** — `coverageWarning`/`samplingBias` calculés par le provider mais jamais rendus sur l'écran A | `tests/review/D6` (nouveaux cas) | `CentralRange.coverageWarning`, `MakeCardViewModel.samplingBias`, `ModelZoneViewModel.samplingBias` ajoutés (`withCoverageWarning`) ; `MakeCard.tsx`/`ModelZone.tsx` rendent un marqueur ⚠ + note « échantillon possiblement biaisé » quand le champ est présent, jamais inventé quand absent | `npx vitest run --config vitest.review.config.ts tests/review/D6` → vert ; `npx vitest run src/screens/market/view-model.test.ts` → vert | **FAIT** |
| 6 | **D8-12 / DR-143** — zone-modèle compacte sans grille CSS dédiée (4 lignes normatives non tenues, EX-SCR-135) | `tests/review/D6/responsive.test.ts` (`R-D6-10`, assertion négative) | `ModelZone.tsx` : classes `kycar-market-zone-price/-year/-mileage/-median` ; `market.css` : `grid-template-areas` à 4 lignes sous 768 px | `npx vitest run --config vitest.review.config.ts tests/review/D6/responsive.test.ts` → vert, `R-D6-10` retournée en assertion positive (D-31) | **FAIT** |
| 7 | **D8-12 / DR-147** — dette A-08 (graphes CO₂/consommation/boîte de vitesses) silencieuse (EX-SCR-39 : pas d'état muet) | `tests/review/D7/ecran-b.test.ts` (`R-D7-10`, `it.fails`) | `DistributionScreen.tsx` affiche désormais une mention visible de la dette à l'utilisateur ; la dette elle-même (graphes absents) N'EST PAS levée, seule l'absence de mention l'était | `npx vitest run --config vitest.review.config.ts tests/review/D7/ecran-b.test.ts` → vert, `R-D7-10` repassé de `it.fails` à `it` | **FAIT** — `it.fails` **levée** |
| 8 | **D8-14** — badge de marque : texte blanc fixe, contraste < 4,5:1 sur plusieurs teintes (EX-NFR-16, ex-E2E-11) | `tests/review/D6/structure-a11y.test.ts` + `tests/e2e/a11y.spec.ts::CONSTAT E2E-11` (Playwright réel) | `badgeTextColorForMake` (luminance relative WCAG sRGB→linéaire) choisit blanc ou `--color-text` par teinte ; 3 teintes de `BADGE_PALETTE` resserrées de 1 à 4 points de lightness | `npx vitest run --config vitest.review.config.ts tests/review/D6` → vert ; `KYCAR_E2E_PORT=4181 npx playwright test tests/e2e/a11y.spec.ts --project=desktop -g "E2E-11"` → **vert**, `test.fail()` retiré (D8-17) | **FAIT** |
| 9 | **D8-14** — case « Comparer » imbriquée dans l'élément `role="button"` de la zone-modèle (nested-interactive, WCAG) | `tests/review/D6/structure-a11y.test.ts` (nouveaux cas) | `ModelZone.tsx` restructuré : la case devient sibling (`.kycar-market-zone-compare`) d'un nouveau wrapper `.kycar-market-zone-interactive` qui seul porte `role="button"` ; `EX-SCR-117` (bande entière cliquable) préservé via `display: contents` sur le conteneur englobant, colonne `cmp` ajoutée à la grille D8-12 | `npx vitest run --config vitest.review.config.ts tests/review/D6` → vert (aucun nœud `role=button` ne contient plus de `<input>`) | **FAIT** |
| 10 | **D8-15 / EX-SCR-209** — écran D sans régime compact/intermédiaire | `tests/review/D7/ecran-d.test.ts` (nouveaux cas, si applicable) et `tests/e2e/responsive.spec.ts::E2E-18` | `ListingsScreen` gagne un prop `regime?: 'compact' \| 'intermediate' \| 'large'` (défaut `matchMedia`, même convention que A/B) : intermédiaire replie Année-modèle/Conso./CO₂/TVA sous un chevron par ligne ; compact remplace le tableau par des cartes 132px + sélecteur « Trier par… » | `npx vitest run --config vitest.review.config.ts tests/review/D7/ecran-d.test.ts` → 21/21 vert ; `npx vitest run src/screens/listings/listings.test.ts` → vert ; `KYCAR_E2E_PORT=4181 npx playwright test tests/e2e/responsive.spec.ts --project=desktop -g "E2E-18"` → vert | **FAIT** |
| 11 | **D8-06/FV-07** — écran B sans bandeau C3 ni ligne de représentativité (EX-SCR-31/175) | `tests/review/D7/ecran-b.test.ts` (nouveaux cas) | `DistributionScreen` gagne `snapshotCoverage?`/`onOpenMentions?` ; `buildC3Banner` réutilisé, nouvelle `representativityUnproven()` (`coverage.ts`) | `npx vitest run --config vitest.review.config.ts tests/review/D7/ecran-b.test.ts` → vert (4 cas : absent sans prop, rendu sous couverture partielle, absent à 100 %, « non applicable » sous filtre utilisateur) | **FAIT côté écran** — C3 dupliqué sur l'écran A et empilement générique EX-SCR-38 : câblage hôte, voir §3 |
| 12 | **D8-06/FV-08** — mode « Modèle non identifié » (`modelId=0`) non restreint (EX-SCR-113bis) | `tests/review/D6/modele-non-identifie.test.ts` (nouveaux cas) | `DistributionScreen` gagne `modelId?` ; `modelId === MODEL_ID_UNRESOLVED` (0) affiche un bandeau non refermable, retire G5/G6/G8/G10/G14 **du DOM** (pas seulement masqués CSS), désactive « Comparer » avec l'infobulle normative | `npx vitest run --config vitest.review.config.ts tests/review/D6` → vert, y compris le cas de non-régression (modèle résolu) | **FAIT** |
| 13 | **D8-06/FV-09** — fourchettes basses (1 ≤ n ≤ 11) affichaient `« — »` au lieu de `[min, max]` avec jeton ambre (D-36) | `tests/review/D6/effectif-seuils.test.ts`, `tests/review/patho/*` | `lowSampleRange` (`view-model.ts`) remplace `lowSampleGuard` : `available: true`, plage `[min, max]` réellement rendue par `ModelZone`/`MakeCard` | `npx vitest run --config vitest.review.config.ts tests/review/D6` → vert | **FAIT** |
| 14 | **D8-06/FV-11** — G2 (km)/G3 (année) sans note d'exclusion, contrairement à G1 (prix) (EX-SCR-178) | `tests/review/D7/ecran-b.test.ts` | Notes dérivées de `SelectionStats.mileage.n`/`year.n` contre `selectionCount`, mêmes composants `exclusions` que G1 | `npx vitest run --config vitest.review.config.ts tests/review/D7/ecran-b.test.ts` → vert | **FAIT** |
| 15 | **D8-06 (screen C)/FV-14** — année de synthèse formatée avec séparateur de milliers (« 2 008 – 2 026 ») | `tests/review/D7` / `src/screens/compare/structure.test.ts` | `fmtYearRange` (déjà utilisé par l'écran A) remplace `fmtRange` générique | `npx vitest run src/screens/compare/structure.test.ts` → vert | **FAIT** |
| 16 | **D8-06/FV-15** — G5 du comparatif produisait des coordonnées `NaN` quand les buckets ouverts (±∞) bornent l'échelle | `src/screens/compare/structure.test.ts` (nouveaux cas bornes ouvertes) | `OverlaidPriceChart` : bornes d'échelle et centres de bucket restreints aux valeurs finies, un bucket ouvert est clampé au bord de l'échelle | `npx vitest run src/screens/compare/structure.test.ts` → vert | **FAIT** |
| 17 | **D8-06/EX-SCR-197** — pas de CTA pour ajouter un modèle en colonne vide du comparatif | `src/screens/compare/structure.test.ts` | Colonnes « + Ajouter un modèle » jusqu'à `COMPARE_MAX_MODELS` (export), prop `onAddModel?`, désactivé si `atCapacity` ; nouveau `compare.css` (le CSS existant vit dans `src/app/app.css`, hors périmètre) | `npx vitest run src/screens/compare/structure.test.ts` → vert | **FAIT côté écran** — câblage hôte, voir §3 |
| 18 | **D8-06/EX-SCR-198** — pas de redirection normative si le comparatif est vide ou réduit à un modèle | `src/screens/compare/structure.test.ts` | Prop `onRedirect?: (target: CompareRedirectTarget) => void` ; appel inline (composant sans hooks, testable par appel direct) : `{kind:'market'}` si vide (hors chargement), `{kind:'model', makeId, modelId}` si un seul modèle restant | `npx vitest run src/screens/compare/structure.test.ts` → vert | **FAIT côté écran** — navigation réelle = câblage hôte, voir §3 |
| 19 | **D8-06/FV-18 (EX-SCR-170)** — G15 (répartition par pays) tracé même sur un périmètre mono-pays, sans valeur ajoutée | `tests/review/D7/ecran-b.test.ts` (nouveau cas, ce lot) | `DistributionScreen.tsx` : G15 absent du DOM (pas un `ET-CHAMP-ABSENT-SOURCE`) si `countryBars` ne contient qu'un pays distinct | `npx vitest run --config vitest.review.config.ts tests/review/D7/ecran-b.test.ts` → vert | **FAIT** |
| 20 | **D8-06/FV-18 (EX-SCR-176)** — aucune figure ne porte l'empreinte du jeu de filtres qui l'a produite ; un hôte ne peut pas détecter un graphe resté sur un ancien périmètre après changement de filtre (`ET-CHARGE-MAJ`) | Nouveau test `EX-SCR-176` (`ecran-b.test.ts`) → **rouge à l'écriture** : `graphe G5: expected undefined to be 'rev-d7:0'` (branche « worker indisponible » de `UnavailableGraph` omettait le prop) | Prop `dataSelection?: string` posé sur `GraphFrame` (`data-selection` sur le `<figure>`), propagé par `Histogram.tsx`, les 7 composants d'`AdditionalGraphs.tsx` (y compris leur branche `UnavailableGraph`) et directement sur le `<figure>` de `ScatterCloud.tsx` (G4, hors `GraphFrame`) ; câblé depuis `DistributionScreen.tsx` avec `dataSelection={stats.selectionHash}` sur les 14 figures | Rouge constaté (`npx vitest run --config vitest.review.config.ts tests/review/D7/ecran-b.test.ts` → 1 échec/34) → correction (`UnavailableGraph` + 5 sites d'appel) → **vert** : même commande → 34/34 ; `npx tsc --noEmit -p tsconfig.json && npx tsc --noEmit -p tsconfig.review.json` → 0 erreur | **FAIT** (D-32 respecté : rouge constaté puis vert après correction, sans toucher l'assertion) |
| 21 | **E2E-20 (MAJEUR)** — `src/screens/market/market.css` jamais importé : tout le style de l'écran A (barre collante, grille de cartes, grille D8-12) était mort | `tests/e2e/impression.spec.ts::CONSTAT E2E-20` (Playwright réel, seul harnais capable de le révéler — invisible en VNode) | `import './market.css';` ajouté à `MarketScreen.tsx` | `KYCAR_E2E_PORT=4181 npx playwright test tests/e2e/impression.spec.ts --project=desktop -g "E2E-20"` → vert, `test.fail()` retiré (D8-17) | **FAIT** |
| 22 | **E2E-15 (MINEUR)** — aucune des 5 branches de rendu de `MarketScreen.tsx` ne porte de `<h1>` (EX-NFR-12) | `tests/e2e/clavier.spec.ts::CONSTAT E2E-15` | `<h1 id="kycar-market-title">Survol du marché</h1>` ajouté aux 5 branches | `KYCAR_E2E_PORT=4181 npx playwright test tests/e2e/clavier.spec.ts --project=desktop -g "E2E-15"` → vert, `test.fail()` retiré (D8-17) | **FAIT** — a exposé une régression collatérale, voir §4 |
| 23 | **E2E-17 (MAJEUR)** — en régime dégradé, `scatter-render.ts` colore le nuage par kilométrage alors que le kilométrage est déjà l'axe X (redondance, perte d'info sur l'année) | `tests/e2e/responsive.spec.ts::CONSTAT E2E-17` | `DrawScatterOptions.degraded` : colore par année (`RAMP_A_YEAR`) au lieu du kilométrage quand actif ; `ColorLegend` gagne un flag `degraded` (bascule le libellé en « Année ») ; seule la légende de taille disparaît en mode dégradé, la légende de couleur reste | `KYCAR_E2E_PORT=4181 npx playwright test tests/e2e/responsive.spec.ts --project=desktop -g "E2E-17"` → vert, `test.fail()` retiré (D8-17) | **FAIT** |
| 24 | **E2E-18 (MINEUR)** — libellé du bouton de repli de `MakeCard.tsx` codé en dur (« Réduire à 6 modèles ») même en régime compact (seuil réel 4) | `tests/e2e/responsive.spec.ts::CONSTAT E2E-18` | `card.modelsVisibleBeforeCollapse` (déjà posé pour le point 2) lu par le libellé au lieu du littéral | `KYCAR_E2E_PORT=4181 npx playwright test tests/e2e/responsive.spec.ts --project=desktop -g "E2E-18"` → vert, `test.fail()` retiré (D8-17) | **FAIT** |
| 25 | **E2E-19 (MAJEUR)** — `.kycar-hist-row`/`.kycar-graph-grid` en colonnes `1fr` (min-content implicite ≥ 320/360px) poussaient le document 50px au-delà d'un viewport 360px | `tests/e2e/responsive.spec.ts::CONSTAT E2E-19` | Colonnes passées à `minmax(0, 1fr)` partout dans `distribution.css` | `KYCAR_E2E_PORT=4181 npx playwright test tests/e2e/responsive.spec.ts --project=desktop -g "E2E-19"` → vert, `test.fail()` retiré (D8-17) | **FAIT** — a révélé une violation a11y collatérale, voir §4 |
| 26 | **E2E-04/E2E-05** | — | Déjà couverts par des corrections antérieures de ce lot (D8-02/D8-07) au moment où la directive coordinateur est arrivée ; aucune action supplémentaire nécessaire | Vérifié par relecture du rapport `e2e-harness.md` : les deux constats correspondent à `agg.modelCount`/aux stats worker, déjà traités aux points 1 et 3 | **DÉJÀ COUVERT** |

---

## 2. FV-18 (écran B) — sous-points restants, NON traités

Le fix-lead liste sous FV-18 plusieurs sous-points au-delà de G15/EX-SCR-176 (traités ci-dessus,
points 19-20). Compte tenu du budget de ce lot, les sous-points suivants **ne sont pas traités** et
restent des dettes ouvertes à consigner par le coordinateur :

- **ET-CHARGE-INIT** — squelettes de chargement pour les 14 graphes pendant le calcul worker (l'état
  `'unavailable'` actuel affiche le texte final « données indisponibles », pas un squelette
  transitoire distinct d'un état durablement vide).
- **Interactions de brossage de l'histogramme** — glissement horizontal, Ctrl-clic, double-clic
  (seul le clic simple sur une barre est câblé, via `onSelectBucket`, hérité de D7).
- **Légendes discrètes + brossage désactivé sous 4 offres** — non implémenté ; le brossage reste
  actif quel que soit l'effectif sélectionné.
- **ET-CHARGE-MAJ, atténuation + barre de progression** — le point 20 pose le mécanisme de
  *détection* (`data-selection`), mais aucun rendu d'atténuation ni de barre de progression ne
  consomme cette empreinte : cela demande un signal « recalcul en cours » que `DistributionScreen`
  ne reçoit pas aujourd'hui (voir prop suggérée `recalculating?: boolean`, §3).

Ces quatre points sont proposés au coordinateur comme dette motivée (protocole §2.6 S2, gate G5) —
`fix-screens` n'a pas le budget de ce lot pour les traiter sans risquer une régression sur le reste
du périmètre.

---

## 3. § Câblage attendu de fix-app

Props exposées par `fix-screens` qui n'ont **aucun effet** tant que l'hôte (`src/app*`) ne les
fournit pas. Aucune n'est requise pour un rendu correct : chaque écran reste défini par défaut
(sans invention de valeur) en leur absence.

### 3.1 `DistributionScreen` (écran B)

| Prop | Signature | Effet | Constat lié |
|---|---|---|---|
| `modelId` | `number` | `MODEL_ID_UNRESOLVED` (0) → mode restreint (bandeau, G5/G6/G8/G10/G14 hors DOM, Comparer désactivé) | D8-06/FV-08 |
| `snapshotCoverage` | `{ listingCount, announcedListingCount, hasUserFilters }` | Bandeau C3 + ligne de représentativité (EX-SCR-175) | D8-06/FV-07 |
| `onOpenMentions` | `() => void` | Ouvre `/mentions` en SPA plutôt qu'un lien classique rechargeant la page | EX-SCR-175 |
| `onApplyFilters` | `(patch: SelectionInput) => void` | Pose un correctif de filtres réels depuis un clic sur histogramme / « Convertir la sélection en filtre » | ARB-09/EX-SCR-184 |
| `onViewBrushedListings` | `(sel: { from, to }) => void` | Navigue vers l'écran D restreint à la sélection brossée | EX-SCR-158/184 |
| `onViewListings` | `() => void` | « Voir les n annonces » sans restriction | EX-SCR-142 ligne 3 |
| `onOpenListing` | `(row: number) => void` | Deeplink vers l'annonce d'origine (G4) | EX-SCR-158 |
| `rows` | `Int32Array` | Sélection Σ courante (indices dans `batch`) ; défaut = tout le batch | — |

**Non traité par fix-screens, listé pour fix-app :**
- Le bandeau C3 dupliqué observé sur l'écran A (FV-07) n'est **pas** un défaut de `MarketScreen.tsx`
  (qui n'en rend qu'un) : c'est un doublon dans le câblage `app.tsx`.
- L'empilement générique de bandeaux EX-SCR-38 (« +k » quand plusieurs bandeaux hors ligne/erreur
  provider/cache coexistent) exige un état applicatif que `DistributionScreen` ne possède pas.
- **`recalculating?: boolean`** (suggéré, non posé) — signal nécessaire pour l'atténuation +
  barre de progression ET-CHARGE-MAJ listée en dette au §2.

### 3.2 `CompareScreen` (écran C)

| Prop | Signature | Effet | Constat lié |
|---|---|---|---|
| `onAddModel` | `() => void` | Active la CTA « + Ajouter un modèle » dans les colonnes vides (jusqu'à `COMPARE_MAX_MODELS = 4`, exporté) | D8-06/EX-SCR-197 |
| `onRedirect` | `(target: CompareRedirectTarget) => void` — `CompareRedirectTarget = {kind:'market'} \| {kind:'model', makeId, modelId}` (exporté) | Appelé automatiquement (composant sans hooks, appel inline au rendu) quand le comparatif est vide (hors chargement) ou réduit à un seul modèle | D8-06/EX-SCR-198 |

**Non traité, listé pour fix-app :** le bandeau de filtres C1, absent sur `/comparer`
(`filterBar: false`), est une config de routage `app.tsx`, hors périmètre de `CompareScreen.tsx`.

### 3.3 `ListingsScreen` (écran D)

| Prop | Signature | Effet | Constat lié |
|---|---|---|---|
| `regime` | `'compact' \| 'intermediate' \| 'large'` (optionnel, défaut par `matchMedia` via `defaultRegimeFromViewport()`, exporté) | Bascule tableau complet / colonnes repliables / cartes | D8-15/EX-SCR-209 |

### 3.4 `app.tsx` (défaut catalogué, hors périmètre fix-screens)

- **E2E-16** (déjà catalogué avant ce lot, périmètre élargi par E2E-15) : `app.tsx` appelle
  `.focus()` sur le `<h1>` de la vue après navigation ; ce `<h1>` n'a pas de `tabindex`, l'appel est
  sans effet et le focus ne se déplace jamais vers `#kycar-main`. Depuis que l'écran A porte lui
  aussi un `h1` (point 22 ci-dessus), il rejoint ce défaut préexistant partagé avec C/E/F/mentions —
  ce n'est **pas** une régression de ce lot, voir §4.

---

## 4. Sondes modifiées avec justification (D8-19 / D-31)

Toute modification d'assertion est justifiée en commentaire, au même endroit dans le fichier
concerné ; liste consolidée ci-dessous (git : `1226aeb..fix28/screens`).

| Fichier | Sonde | Nature du changement | Justification |
|---|---|---|---|
| `tests/review/D7/ecran-b.test.ts` | `R-D7-10` | `it.fails` → `it` | Dette DR-147 levée : mention utilisateur ajoutée (point 7) |
| `tests/review/D7/ecran-d.test.ts` | `R-D7-16` | `it.fails` → `it` | Dette D-38 levée : colonne TVA implémentée (point 4) |
| `tests/review/D6/responsive.test.ts` | `R-D6-10` | Assertion négative → positive | DR-143 levée : grille CSS 4 lignes désormais présente (point 6) ; libellé et assertions colonne `cmp` ajustés pour la restructuration a11y du point 9 |
| `tests/review/D6/effectif-seuils.test.ts` | fourchettes basses | `available:false`/`'—'` → `available:true`/`[min,max]` | Ruling D-36 (FV-09) : `'—'` est remplacé par une vraie plage, jamais par un vide (point 13) |
| `tests/review/D6/ex-scr-132-modeles-indisponibles.test.ts`, `tests/review/patho/structure.test.ts`, `tests/review/patho/volumetrie.test.ts`, `tests/review/patho/ingestion.test.ts`, `tests/review/patho/valeurs.test.ts` | `modelCount`/fourchettes basses | Adaptées à `agg.modelCount`/`[min,max]` | **Divergence TEMPORAIRE explicitement documentée** : ces sondes lisent le moteur synthétique, encore neutre tant que fix-engine n'a pas fusionné — à revérifier par le coordinateur après fusion de `fix-engine` |
| `tests/review/D7/ecran-b.test.ts` | `EX-NFR-15`/`EX-SCR-189` (D8-07) | Fixtures et assertions reconstruites contre `stats-protocol.ts` | Ancien modèle de calcul principal-thread supprimé (dette D-17 levée, point 3) ; l'état actuel « tout indisponible » est transitoire (fix-engine non fusionné) |
| `tests/review/D7/ecran-b.test.ts` | `EX-SCR-176` (nouveau, ce lot) | Ajouté | Voir point 20 ci-dessus — rouge à l'écriture, vert après correction, D-32 respecté |
| `tests/e2e/clavier.spec.ts` | Test « écran A sans titre » | Réécrit en « CONSTAT E2E-16 (élargi par E2E-15) » | E2E-15 (point 22) élimine la seule vue sans `h1` de l'application, exposant l'écran A au défaut déjà catalogué E2E-16 (app.tsx, hors périmètre) sur les 7 autres vues ; adapté plutôt que laissé en échec inexpliqué |
| `tests/e2e/clavier.spec.ts` | `CONSTAT E2E-16` (texte) | Texte du constat élargi | Même cause ; le texte normatif reflète désormais que A rejoint C/E/F/mentions au lieu d'y échapper seule |

Aucune autre sonde de ce lot n'a vu son assertion modifiée sans le commentaire correspondant.

---

## 5. Note sur une régression collatérale (E2E-19 → nested/scrollable a11y)

En contraignant le débordement horizontal à `.kycar-graph-body` (point 25, `minmax(0,1fr)`), la zone
est devenue réellement défilable — et donc sujette à la règle axe `scrollable-region-focusable`
qu'elle ne déclenchait pas avant (le débordement touchait alors tout le document). Corrigé dans le
même commit par `tabIndex={0}` sur `.kycar-graph-body` (`GraphFrame.tsx`) ; rejoué contre
`tests/e2e/a11y.spec.ts` (suite complète) → aucune violation nouvelle.

---

## 6. Vérification finale de ce lot

```
npx tsc --noEmit -p tsconfig.json         → 0 erreur
npx tsc --noEmit -p tsconfig.review.json  → 0 erreur
npx eslint src/screens tests/review tests/e2e → vert
npx vitest run --no-file-parallelism src/screens src/components → 312 passed (21 fichiers)
npx vitest run --config vitest.review.config.ts tests/review/D6 tests/review/D7 tests/review/D8/screens.test.ts → 191 passed (19 fichiers)
KYCAR_E2E_PORT=4181 npx playwright test tests/e2e/{a11y,clavier,impression,responsive}.spec.ts --project=desktop -g "E2E-(11|15|17|18|19|20)" → 6/6 vert
```

Perf : `EX-SCR-189` (budget 300ms/n=20000) mesuré p50=39-44ms, pire=49-52ms sur ce lot — large marge.

---

## 7. Résumé (10 lignes)

D8-02 : cardinal de marque lu de `agg.modelCount`, jamais 0 par défaut ; seuil de repliement publié.
D8-06 : bandeau C3/représentativité, mode « Modèle non identifié » restreint, fourchettes basses
`[min,max]`, notes d'exclusion G2/G3, année sans séparateur, G5 sans NaN, CTA « + Ajouter »,
`onRedirect`, G15 masqué en mono-pays, empreinte `data-selection` sur les 14 figures (rouge→vert,
D-32). D8-07 : écran B consomme désormais exclusivement les stats worker, plus aucun recalcul
principal-thread — dette temporaire consignée tant que fix-engine n'a pas fusionné. D8-08 : colonne
TVA + export, `R-D7-16` levée. D8-10 : `coverageWarning`/`samplingBias` rendus. D8-12 : grille
compacte 4 lignes (`R-D6-10`), dette A-08 mentionnée à l'utilisateur (`R-D7-10` levée). D8-14 :
contraste des badges ≥4,5:1 (WCAG), case Comparer sortie du `role=button`. D8-15 : régimes
compact/intermédiaire de l'écran D. Six constats E2E du harnais navigateur (E2E-11/15/17/18/19/20)
corrigés et vérifiés vrais verts contre Chromium réel, annotations `test.fail()` retirées (D8-17) ;
E2E-16 (app.tsx, hors périmètre) et 4 sous-points de FV-18 (squelettes, brossage avancé, légendes
discrètes, atténuation ET-CHARGE-MAJ) restent des dettes ouvertes, proposées au coordinateur. Tous
les tests du périmètre (tsc, eslint, unit, review) sont verts ; commit fait, **non poussé**.
