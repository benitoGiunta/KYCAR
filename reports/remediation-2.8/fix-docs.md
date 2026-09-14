# fix-docs — remédiation documentaire 2.8

**Agent `fix-docs` (Sonnet, effort high), 2026-09-08. Worktree `kycar-wt/docs`, branche
`fix28/docs`.** Aucune ligne de code touchée. Périmètre : `docs/requirements/**`,
`docs/plans/ARCHITECTURE.md`, `docs/EXECUTION-LOG.md` (section « Points ouverts » seulement),
`DEV.md`, `README.md`.

Mandat lu dans l'ordre indiqué : `reports/remediation-2.8/FIX-LEAD-DECISIONS-2.8.md` (toutes les
décisions, dont **D8-13, D8-09, D8-11, D8-08, D8-10/D8-23, D8-07, D8-15, D8-18, D8-20**),
`reports/remediation-2.8/fix-foundation.md` §5 (points ouverts pour la suite), `reports/
FINAL-VERIFICATION.md` §7 (FV-12) et §6 (amendements 2.6 non reflétés : D-07, D-12, D-14, D-15),
`data/reference/filters-scope.json` (compte réel vérifié par `node -e`), `docs/requirements/
REQUIREMENTS.md` §0/§6/§11.3/§13, `reports/remediation/fix-docs.md` (conventions d'édition 2.6).

Vérité de terrain établie avant édition : le compte réel de `filters-scope.json`
(`totalRetenus: 74`, `totalExclus: 27`) et le test `src/state/filter-registry.test.ts` §
« bilan EX-SCR-83 (mis à jour DR-052/D-12/D-14/D-15) », qui documente déjà dans le code le
décompte cible **74/68+6/12/53** et la liste exacte des 6 filtres `nonExposed` (`atype`,
`powerType`, `hadAccident`, `countryType`, `page`, `pageSize`) — c'est ce test qui a servi de
spécification pour reconstruire les colonnes `exposition` de la table `EX-SCR-82`.

---

## 1. Table décision → fichier(s) → identifiants → nature → statut

| Décision | Fichier(s) | Identifiant(s) | Nature de l'amendement | Statut |
|---|---|---|---|---|
| `D8-13` | draft-behaviour.md | `EX-NFR-8` | « rotation continue de 10 s » → « interaction continue (pan/zoom) » sur les deux projections 2D de `G4` ; renvoi à `ARCHITECTURE.md` §9.1/`D-07` | **FAIT** |
| `D8-13` | draft-screens.md | `EX-SCR-59` | 9 contrôles/12 paramètres → **8 contrôles/11 paramètres** ; `Pays` (`cy`) retiré du primaire (valeur injectée, `EX-SRCH-18bis`/`D-15`) | **FAIT** |
| `D8-13` | draft-screens.md | `EX-SCR-82` | Exception `NON_EXPOSE` unique (`atype`) → **six** filtres (`atype`, `powertype`, `ustate`, `cy`, `page`, `size`) ; lignes #35, #59, #65, #66, #68, #69, #79, #80 de la table d'affectation corrigées (`powertype`/`ustate`/`cy` → `NON_EXPOSE` ; `zip`/`lat`/`lon` → `EXCLU` ; `page`/`size` → `NON_EXPOSE`) | **FAIT** |
| `D8-13` | draft-screens.md | `EX-SCR-83` | Bilan 77/76+1/13/60 → **74/68+6/12/53** ; 24 → 27 exclus | **FAIT** |
| `D8-13` | REQUIREMENTS.md | §0, §6, §11.3 | Décomptes corrigés : 74 retenus + 27 exclus (au lieu de 77+24) ; 8 contrôles/12 paramètres (au lieu de 9/13) ; liste des exclus complétée (`zip`, `lat`, `lon`) | **FAIT** |
| `D8-13` | draft-data-dictionary.md | Annexe A §C.5 | Décompte des `EX-DATA-*` corrigé : **140** (au lieu de 139, arithmétique 127+12 fausse) — `127 + 13` | **FAIT** |
| `D8-09` | draft-data-dictionary.md | `EX-DATA-85` | 6 codes → **8 codes** ; nommage aligné sur le vocabulaire gelé du code (`M1_LOW`/`M1_HIGH`/`M2_LOW`/`M2_HIGH` au lieu de `LOW_PRICE_IQR`/`HIGH_PRICE_IQR`/`LOW_PRICE_MODEL`/`HIGH_PRICE_MODEL`), ajout de `M1_M2_AGREE_LOW`/`M1_M2_AGREE_HIGH` | **FAIT** |
| `D8-09` | draft-data-dictionary.md | §A.1 (`KYCAR_OUTLIER_FLAG`) | Décompte 6 → 8 | **FAIT** |
| `D8-09` | draft-data-dictionary.md | `EX-DATA-96`, `EX-DATA-101` | Renvois harmonisés au nouveau nommage (`M1_LOW`/`M2_LOW` etc.) | **FAIT** |
| `D8-11` | draft-data-dictionary.md | `EX-DATA-49` | Garde E1–E14 → **E1–E17** ; note précisant les variantes de noms normalisées (E15 `vin`, E16 `licencePlate`, E17 `belgianCarpassMileageUrl`) | **FAIT** |
| `D8-08` | draft-data-dictionary.md | `EX-DATA-119` (table physique §C.3) | Colonne `vatDeductible` (`Uint8Array`, sentinelle `0`) ajoutée : **20** colonnes énumérées sur un octet (au lieu de 19), **≈76** colonnes numériques et énumérées, +1 octet/ligne (≈252 au lieu de ≈251) | **FAIT** |
| `D8-08` | draft-data-dictionary.md | champ #10 `isTaxDeductible` (§A.3) | Note ajoutée : colonne physique `vatDeductible` | **FAIT** |
| `D8-08` | draft-screens.md | `EX-SCR-203` | Vérifié — la table portait déjà la colonne « TVA » et 16 colonnes au total ; **aucune modification nécessaire** | **VÉRIFIÉ, sans changement** |
| `D8-10`, `D8-23` | draft-data-dictionary.md | `EX-DATA-68` | `modelCount` marqué **obligatoire** (`null` si non calculé, jamais `0`, `FV-02`) ; `coverageWarning` corrigé à 3 booléens (`price`/`year`/`mileage`, sans `samplingBias`) et marqué **optionnel** ; `samplingBias` séparé en champ propre optionnel ; `adTierDistribution` marqué optionnel ; note `D8-23` : `rank`/`displayRange`/`makeName` sont dérivés au rendu, non portés par l'entité `MakeAggregate` de l'interface figée | **FAIT** |
| `D8-10` | draft-data-dictionary.md | `EX-DATA-64` | Vérifié — le bloc statistique de 13 valeurs incluait déjà `iqr` et `coverage` ; **aucune modification nécessaire** (le texte anticipait déjà l'amendement d'interface) | **VÉRIFIÉ, sans changement** |
| `D8-07` | draft-data-dictionary.md | `EX-DATA-83bis` | Paragraphe « Dette consignée (2.6, D-17) » remplacé par « Résolution 2.8 (`D8-07`, dette `D-17` levée) » : calcul dans le worker, source unique, recalcul du thread principal retiré | **FAIT** |
| `D8-07` | draft-data-dictionary.md | `EX-DATA-83ter`, `83quater`, `83quinquies`, `93bis`, `102bis` | Vérifiés — aucun ne portait de mention de dette (ils étaient déjà rédigés comme pleinement normatifs) ; **aucune modification nécessaire** | **VÉRIFIÉ, sans changement** |
| `D8-15` | draft-screens.md | `EX-SCR-95` | Dette produit ratifiée ajoutée : réglages « Assainissement KYCAR » non implémentés en 2.8, hors budget, sonde/test E2E annoté `DETTE D8-15` | **FAIT** (voir note sur l'identifiant en § Conflits résiduels) |
| `D8-18` | draft-data-dictionary.md | `EX-DATA-53` | Dette externe ratifiée ajoutée : confrontation à Statbel/bpost hors du contrôle du projet, admise à la porte G7 | **FAIT** |
| `D8-18` | draft-behaviour.md | `EX-SRCH-12` | Dette externe ratifiée ajoutée : sémantique `eq` non tranchable localement (E5 interdit les requêtes live), point ouvert `O7` | **FAIT** |
| `D8-18`, `D8-20` | draft-screens.md | `EX-SCR-221` | Dette externe (`O15`) et mitigation `D8-20` documentées : bandeau « Filtre Carrosserie non appliqué à ce modèle (donnée indisponible) » en mode 2, via `unsupportedFilterIds` | **FAIT** |
| `D8-18` | draft-screens.md | `EX-SCR-9` | Retrait de la mention d'un usage interne de `lat`/`lon` pour un « calcul de rayon » — fonctionnalité jamais construite, contredite par l'exclusion `D-14` ; dette externe documentée | **FAIT** |
| — | EXECUTION-LOG.md § Points ouverts | O13, O14, O15, O16, O17 | État 2.8 ajouté à chaque ligne : O13/O16 inchangés ; O14 dette externe ratifiée (`D8-18`) ; O15 donnée toujours absente + bandeau `D8-20` ; O17 note sur le déplacement `D8-07` vers le worker (ne referme pas le point) | **FAIT** |
| — | README.md | — | Phases 2.4–2.7 closes, 2.8/2.9 en cours ; `reports/FINAL-VERIFICATION.md` référencé ; arborescence : `tests/e2e/`, `reports/remediation-2.8/` | **FAIT** |
| — | DEV.md | — | Intro : phases 2.4–2.7 closes, 2.8/2.9 en cours ; table des scripts npm complétée (`test:unit`, `test:review`, `test:e2e`, `test:e2e:report`) | **FAIT** |
| — | REQUIREMENTS.md §13 | — | Journal des versions : ligne **v1.2** ajoutée ; section « Journal des amendements 2.8 (v1.1 → v1.2) » créée, 18 lignes identifiant → annexe → nature → décision | **FAIT** |

---

## 2. Conflits résiduels

1. **`EX-SCR-95` vs la citation `EX-SCR-97/98` de `FIX-LEAD-DECISIONS-2.8.md` (D8-15).** La
   décision D8-15 cite `EX-SCR-97/98` pour la dette « Assainissement KYCAR » (« panneau de
   préférences sans effet sur une valeur affichée »). Or `EX-SCR-97` et `EX-SCR-98` portent, dans
   le texte normatif actuel, sur le **régime responsive `compact`** (feuille plein écran,
   histogramme miniature retiré) — un sujet différent, déjà traité comme **corrigé** dans la
   première moitié de cette même ligne de décision (« régime compact de l'écran D […] corrigés »).
   Le panneau « Assainissement KYCAR » (deux réglages propres à KYCAR, sans effet sur l'effectif)
   est en réalité `EX-SCR-95`, dans `FV-19` cité comme faisant partie de la plage `EX-SCR-95–98`.
   J'ai appliqué la dette au contenu qu'elle décrit sans ambiguïté possible (`EX-SCR-95`), plutôt
   qu'à l'identifiant cité littéralement, qui désigne un tout autre sujet déjà résolu. Signalé
   plutôt que deviné ; à confirmer par le fix-lead ou par `fix-verify`.

2. **`zipr` (#67 de `EX-SCR-82`) reste `RETENU`/`SECONDAIRE` alors que sa dépendance `zip` (#66)
   devient `EXCLU`.** La décision `D8-13`/`D-14` ne nomme que `zip`, `lat` et `lon` ; je n'ai donc
   pas requalifié `zipr`, qui reste sans champ local de toute façon (aucune géolocalisation
   serveur n'est implémentée). J'ai ajouté une note dans la colonne « Champ local ou motif »
   signalant que la dépendance à `zip` est désormais résiduelle et sans effet, sans changer son
   `perimetre`/`exposition`. À trancher si `zipr` doit lui aussi passer `EXCLU` par cohérence.

3. **`draft-screens.md` ligne ~2567 (« test de 60 filtres simultanés »).** Cette ligne de la
   matrice de vérification §9 semble faire écho à l'ancien compte de 60 filtres `SECONDAIRE`
   (désormais 53 après `D8-13`). Elle n'est nommée par aucune décision `D8-xx` et décrit
   possiblement un test de charge indépendant du décompte des filtres (« 60 filtres simultanés »
   au sens d'un stress-test, pas d'une énumération figée) ; je ne l'ai pas modifiée. Signalé pour
   arbitrage si elle doit suivre le nouveau compte de 53 secondaires.

4. **`ARBITRAGES-req-lead.md` (R-A01, R-A15, A-08) porte encore les anciens chiffres** (« 77
   retenus », « 9 contrôles / 13 paramètres »). Ce fichier est une annexe normative au sens de
   `REQUIREMENTS.md` §0, mais aucune décision `D8-xx` ne le nomme, et son contenu est un récit
   d'arbitrage daté de la phase 2.2 (antérieur à `D-14`/`D-15` eux-mêmes). Non touché, conformément
   à la règle « décision appliquée telle quelle, conflit avec une exigence non citée consigné ici
   sans arbitrage de ma part » — comme en 2.6 pour `EX-SRCH-6`/`7` vs `EX-DATA-49`.

5. **`EX-DATA-115bis`/`EX-DATA-125` et autres renvois vers `EX-SCR-59`/`EX-SCR-82`/`EX-SCR-83`
   restent corrects après l'amendement** — vérifiés par grep, aucune action requise (voir §3).

---

## 3. Renvois harmonisés

Contrôle mécanique exécuté : `grep -rn` de chaque identifiant amendé dans `docs/requirements/*.md`.

**A. Renvois déjà cohérents, aucune action** — `EX-DATA-68` (cité par `draft-screens.md` l.1618,
`rawRange.price`, valide indépendamment de l'amendement `D8-10`), `EX-SCR-82` (cité par
`draft-behaviour.md` `EX-SRCH-12`, `draft-screens.md` `EX-SCR-9`/§9, tous cohérents avec la
nouvelle table), `EX-SCR-59` (cité par `EX-DATA-115bis`, `EX-SCR-83`, cohérents), `EX-DATA-49`
(cité par `EX-SRCH-6` en `draft-behaviour.md`, déjà « sans objet » depuis 2.6, cohérent avec
l'extension E1–E17), `EX-DATA-119` (cité par le champ #10 du dictionnaire, harmonisé).

**B. Renvois harmonisés (édités)** — la vérification mécanique après le renommage du vocabulaire
`KYCAR_OUTLIER_FLAG` (`D8-09`) a trouvé deux usages du nommage `LOW_PRICE_IQR`/`HIGH_PRICE_IQR`/
`LOW_PRICE_MODEL`/`HIGH_PRICE_MODEL` au-delà de la définition, tous corrigés dans le même commit :

| Fichier | Identifiant portant la citation | Avant | Après |
|---|---|---|---|
| `draft-data-dictionary.md` | `EX-DATA-96` (M3, tableau de contingence) | `outlierFlags ∩ {LOW_PRICE_IQR, LOW_PRICE_MODEL}` | `outlierFlags ∩ {M1_LOW, M2_LOW}` |
| `draft-data-dictionary.md` | `EX-DATA-101` (règle d'échantillonnage) | `outlierFlags ∩ {LOW_PRICE_IQR, HIGH_PRICE_IQR, LOW_PRICE_MODEL, HIGH_PRICE_MODEL}` | `outlierFlags ∩ {M1_LOW, M1_HIGH, M2_LOW, M2_HIGH}` |

Après cette passe, `grep -rn 'LOW_PRICE_IQR\|HIGH_PRICE_IQR\|LOW_PRICE_MODEL\|HIGH_PRICE_MODEL'`
sur `docs/requirements/` ne renvoie plus que les trois occurrences de `EX-DATA-85` elle-même, qui
nomme explicitement les anciens libellés comme historique (« documentés dans une version
antérieure sous… »).

---

## 4. Comptes d'exigences par annexe (avant / après)

Aucune exigence n'a été créée, supprimée ou renumérotée. Les décomptes déclarés par
`REQUIREMENTS.md` §0 sont **inchangés** : **140 · A**, **231 · B**, **114 · C** (le décompte de
l'annexe A était déjà correct dans `REQUIREMENTS.md` — c'est l'annexe A elle-même, §C.5, qui
affichait un total interne faux de 139, corrigé à 140).

| Annexe | Exigences amendées (nouveau texte ou correction de décompte interne) | Décompte d'identifiants déclaré (avant = après) |
|---|---|---|
| A — `draft-data-dictionary.md` | 8 (`EX-DATA-49`, `53`, `68`, `83bis`, `85`, `96`, `101`, `119`) + 3 tables de décompte (§A.1 `KYCAR_OUTLIER_FLAG`, §C.5 total, champ #10) | 140 |
| B — `draft-screens.md` | 6 (`EX-SCR-9`, `59`, `82`, `83`, `95`, `221`) | 231 |
| C — `draft-behaviour.md` | 2 (`EX-NFR-8`, `EX-SRCH-12`) | 114 |

---

## 5. Vérifications

```
$ npx tsc --noEmit -p tsconfig.json
(sortie vide, exit 0)

$ diff docs/plans/DataProvider.ts src/providers/DataProvider.ts
(sortie vide, exit 0) — non touché, conformément à la mission (déjà amendé à l'étape 0 par
fix-foundation)

$ node -e "const d=require('./data/reference/filters-scope.json'); console.log(d.totalRetenus, d.totalExclus)"
74 27
```

`npm test` : **non lancé**, conformément à la mission (aucun code touché).

---

## 6. Commits (worktree `kycar-wt/docs`, branche `fix28/docs`, non poussés)

1. `D8-13` — `EX-NFR-8` (pan/zoom), `EX-SCR-59`/`82`/`83` (décomptes de filtres), REQUIREMENTS
   §0/§6/§11.3, annexe A §C.5 (140)
2. `D8-09` — `EX-DATA-85` (8 codes, nommage gelé), §A.1, renvois `EX-DATA-96`/`101`
3. `D8-11` — `EX-DATA-49` (garde E1–E17)
4. `D8-08` — `EX-DATA-119` (colonne TVA, 20 colonnes), champ #10
5. `D8-10`, `D8-23` — `EX-DATA-68` (`modelCount` obligatoire, champs optionnels, dérivés)
6. `D8-07` — `EX-DATA-83bis` (dette `D-17` levée)
7. `D8-15`, `D8-18`, `D8-20` — `EX-SCR-95`, `EX-DATA-53`, `EX-SRCH-12`, `EX-SCR-221`, `EX-SCR-9`
8. `EXECUTION-LOG.md` § Points ouverts (O13–O17, état 2.8)
9. `README.md`, `DEV.md` (phases 2.7 close, 2.8/2.9 en cours, scripts npm)
10. `REQUIREMENTS.md` v1.2 (journal des amendements 2.8)
11. (ce rapport)
