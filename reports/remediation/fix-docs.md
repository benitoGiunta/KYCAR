# fix-docs — remédiation documentaire 2.6

**Agent `fix-docs` (Sonnet, effort high), 2026-09-08. Worktree `kycar-wt/docs`, branche
`fix/docs`.** Aucune ligne de code touchée. Périmètre : `docs/requirements/**` (REQUIREMENTS.md,
annexes A/B/C), `docs/plans/ARCHITECTURE.md`, `docs/EXECUTION-LOG.md` (section « Points ouverts »
seulement), `DEV.md`, `README.md`.

Mandat lu dans l'ordre indiqué : `reports/remediation/FIX-LEAD-DECISIONS.md` (sections A, B, C, D),
`reports/remediation/fix-foundation.md`, `CLAUDE.md` §1.4, `reports/DEV-REVIEW.md` §5 (5.1 à 5.4),
§6.2, §6.5, la ligne DR-160 et la ligne DR-146 de §3, puis `reports/review/D1.md` (R-D1-02, source de
DR-160).

---

## 1. Table décision/constat → fichier(s) → identifiants → nature → statut

| Décision | Fichier(s) | Identifiant(s) | Nature de l'amendement | Statut |
|---|---|---|---|---|
| `D-01` | draft-data-dictionary.md, ARCHITECTURE.md | § A.1 (`KYCAR_INGEST_FLAG`), `EX-DATA-119` (§ C.3) | Décompte 14 → 17 codes ; `ingestFlags` `Uint16Array` → `Uint32Array` ; table bit ↔ code documentée en ARCHITECTURE §2.2 | **FAIT** |
| `D-02` | draft-data-dictionary.md, ARCHITECTURE.md | `EX-DATA-119` (§ C.3) | `makeId` `Int16Array` → `Int32Array`, total colonnes ≈ 71 → ≈ 75 | **FAIT** |
| `D-03` / `D-33` | ARCHITECTURE.md §6.1 | — (interface, pas d'`EX-…`) | `unsupportedFilterIds` documenté sur `AggregateResult`, état `ET-FILTRE-NON-APPLIQUE`, précision sur `fetchSelectionCount` | **FAIT** |
| `D-04` | draft-screens.md | `EX-SCR-134` | Palier `5 ≤ n ≤ 11` (P5/P95 masqués, jeton) câblé sur la zone-modèle, aligné sur `EX-SCR-33` | **FAIT** (conflit résiduel avec `EX-SCR-114`, voir §2) |
| `D-05` | draft-data-dictionary.md | `EX-DATA-99` | Éligibilité requalifiée en « prix valide » (EX-DATA-60) au lieu de `priceStatus = QUOTED` seul | **FAIT** |
| `D-06` | draft-data-dictionary.md, draft-screens.md | `EX-DATA-100bis`, `EX-SCR-157`, `EX-SCR-32` | `EX-DATA-100bis` requalifiée en propriété ; algorithme `xoshiro128**`/Fisher-Yates et graine retirés du code normatif et des mentions | **FAIT** |
| `D-07` | ARCHITECTURE.md §9.1 | `EX-NFR-8`, `EX-NFR-15` (résolution architecturale) | Bloc « Résolution 2.6 — D-07 » : pan/zoom 2D, pas de vue `G4c` WebGL, `EX-NFR-11` sans objet | **FAIT** (le texte normatif d'`EX-NFR-8`/`EX-NFR-15` vit en annexe C ; ARCHITECTURE documente la lecture retenue — voir §2 note) |
| `D-08` | draft-screens.md, ARCHITECTURE.md §9.2 | `EX-SCR-157`, `EX-SCR-177`, `EX-SCR-32`, §6.7 | `K = 5 000` gouverne seul le nuage ; `ET-TROP-RESULTATS` et le seuil/la graine à 20 000 retirés pour `G4` (DR-146) | **FAIT** |
| `D-09` | draft-behaviour.md, draft-screens.md, draft-data-dictionary.md | `EX-NAV-5`, `EX-NAV-15`, `EX-NAV-16`, `EX-NAV-17`, + renvois `EX-NAV-6`, `EX-SRCH-8`, `EX-SRCH-11`, `EX-SRCH-14`, `EX-SCR-45` | Paramètre KYCAR `make` retiré ; `mmmv` seul paramètre marque/modèle (mode 1 et mode 2) | **FAIT** (harmonisation en cascade, voir §3) |
| `D-10` | draft-screens.md | `EX-SCR-76` | Retrait unitaire au-delà de 2 valeurs déplacé dans l'infobulle/popover, `removesCodes` par cible | **FAIT** |
| `D-11` / `D-12` | draft-behaviour.md | `EX-NAV-10bis` | Ajout de `page`, `size`, `sel` (paramètres d'état d'interface, `replaceState`, hors `selectionHash`) | **FAIT** (`g4v` et `selx`/`sely` étaient déjà conformes) |
| `D-13` | draft-screens.md | `EX-SCR-194` | Format de `m` corrigé en `<makeId>-<modelId>` | **FAIT** |
| `D-14` | draft-data-dictionary.md | `EX-DATA-49` | Note : `zip`/`location`, `lat`, `lon` exclus, motif `R3_DONNEE_PERSONNELLE` | **FAIT** (conflit résiduel avec `EX-SRCH-6`/`7`, voir §2) |
| `D-15` (`ARB-30`) | draft-behaviour.md | `EX-SRCH-18bis` | `damaged_listing` confirmé classe `D` ; absence de contrôle « accidentés » consignée comme dette produit | **FAIT** |
| `D-16` | draft-behaviour.md | `EX-CRUD-19` | Schéma précisé : une clé `localStorage` par entrée + une clé d'index ; `mutate` n'écrit jamais la collection entière ; pas de `navigator.locks` | **FAIT** |
| `D-17` | draft-data-dictionary.md | `EX-DATA-83bis` | Dette consignée : `GROUPSTAT`/`NTILE` non implémentées dans le worker en 2.6, reportées en 2.7 | **FAIT** |
| `D-18` | — | `EX-NFR-26` / `/mentions` | Voir §4 « Hors périmètre documentaire » | **NON TRAITÉ ICI** (attribué à fix-app par `FIX-LEAD-DECISIONS.md` D-18, DR-152) |
| `D-19` | draft-screens.md | `EX-SCR-57`, `EX-SCR-86` | Renvoi à la table `EX-SRCH-1…8` pour la classe T ; champ numérique à 500 ms + `blur` + `Entrée` | **FAIT** |
| `D-23` | draft-data-dictionary.md | `EX-DATA-108` | Précision : une règle, deux espaces d'identifiants (KYCAR / AutoScout24), chaque implémentation renvoie à l'autre | **FAIT** |
| `D-24` | draft-data-dictionary.md | `EX-DATA-107` | Précision : pas de champ d'interface, identification par `describe()` + `snapshotId` | **FAIT** |
| `D-25` | draft-data-dictionary.md | `EX-DATA-104` (invariant I7) | Marginale de la grille précisée comme portant sur l'ensemble éligible `Elig`, pas sur `V_year(Σ)` | **FAIT** |
| `D-26` | draft-screens.md | `EX-SCR-158` | Un bouton (`Convertir la sélection en filtre`) + un lien (`Voir ces annonces`) au lieu de deux boutons | **FAIT** |
| `D-27` | draft-screens.md | `EX-SCR-208` | Rendu virtualisé remplacé par pagination client de 50 lignes, paramètre `page` | **FAIT** |
| `D-29` | ARCHITECTURE.md §6.3, §9.3 | — | Réconciliation : baseline précalculée pour un provider `LISTINGS` ; cache IndexedDB après le premier aller réseau pour `AGGREGATE_SURFACE` | **FAIT** |
| `T-r` | draft-behaviour.md | `ARB-56` | Chiffres corrigés (827 / 1 535 / 1 649 au lieu de ≈ 1 720) ; conclusion normative inchangée | **FAIT** |
| `T-s` | draft-behaviour.md | `ARB-12` | Portée du risque de troncature non détectable restreinte à la troncature *dans* le domaine | **FAIT** |
| `T-t` | draft-behaviour.md | `EX-SRCH-26` | Texte harmonisé sur `EX-SCR-32` (« affinez pour comparer ») | **FAIT** |
| `O16` | draft-data-dictionary.md, ARCHITECTURE.md | `EX-DATA-105`, § C.5, ARCHITECTURE §2.1 | Décompte 13 → 14 entités | **FAIT** |
| `DR-160` | DEV.md | — (§ Navigateurs cibles) | Reformulation : `build.target` effectif de Vite (`es2020`/…) cité au lieu du `target` de `tsconfig.json` | **FAIT** — option « reformuler » retenue (fixer `vite.config.ts` est hors périmètre `docs/`) |
| — | EXECUTION-LOG.md § Points ouverts | O13, O14, O15, O16, O17 | Mise à jour factuelle : O13 résolu (D-01), O14 en dette (DR-112), O15 restée factuelle (donnée à fournir), O16 résolu, O17 câblage applicatif prouvé / garde moteur en cours par fix-engine | **FAIT** |
| — | README.md | — | État du dépôt réécrit (code existant, phase 2.4 close, 2.5/2.6 en cours), arborescence étendue (`src/`, `tests/review/`, `reports/remediation/`) | **FAIT** |
| — | REQUIREMENTS.md | — | Version **v1.1** ajoutée au journal des versions, table complète identifiant → nature → décision des 30 exigences amendées | **FAIT** |

---

## 2. Conflits résiduels

Ces conflits n'ont **pas été tranchés** : la décision citée a été appliquée telle quelle, et la
contradiction avec une exigence non citée par le fix-lead est consignée ici, sans arbitrage de ma
part.

1. **`EX-SCR-134` (amendée, D-04) vs `EX-SCR-114`.** `EX-SCR-114` affirme que « ces trois
   fourchettes plus l'effectif » (prix, année, kilométrage) « ne sont donc jamais masquées, à
   aucun régime responsive ». `EX-SCR-33`/`EX-SCR-134` (D-04) imposent pourtant le masquage de
   `P5`/`P95` pour `5 ≤ n ≤ 11`. La décision D-04 ne cite que `EX-SCR-134` : je l'ai amendée sans
   toucher à `EX-SCR-114`, qui reste, littéralement, en contradiction. À trancher par le fix-lead
   ou un rôle ultérieur : soit `EX-SCR-114` est amendée pour exempter le cas `P5`/`P95` (les
   fourchettes `min`/`max` restant, elles, jamais masquées), soit `EX-SCR-33`/`134` sont
   restreintes à l'écran B.

2. **`EX-DATA-49` (note ajoutée, D-14) vs `EX-SRCH-6`/`EX-SRCH-7`.** La note ajoutée à
   `EX-DATA-49` déclare `zip` (et `lat`/`lon`) exclu du périmètre retenu. Or l'annexe C
   (`draft-behaviour.md`) continue de spécifier un comportement pour `zip` (`EX-SRCH-6`, débounce
   et résolution géographique) et pour son dépendant `zipr` (`EX-SRCH-7`), comme s'ils faisaient
   partie du bandeau de filtres retenu. La décision D-14 ne nomme que `EX-DATA-49` : je n'ai pas
   touché `EX-SRCH-6`/`7`, qui restent en tension avec l'exclusion. À trancher : soit `EX-SRCH-6`/
   `7` sont retirées ou requalifiées en dette, soit la note de `EX-DATA-49` est nuancée pour
   distinguer un usage résiduel non retenu de `zip`.

3. **`D-18` — `/mentions` et la source par défaut `SYNTHETIC`.** La mission me demandait de traiter
   « D-18 (D9 : `EX-NFR-26`/mentions : source par défaut SYNTHETIC, AC-01) ». `EX-NFR-26` porte sur
   R3 (filtrage vendeur), sans rapport avec la source par défaut ; aucune exigence normative
   n'énumère le contenu exact de la page `/mentions` au-delà du renvoi générique de
   `REQUIREMENTS.md` §5 (« sources, périmètre, limites connues »). `FIX-LEAD-DECISIONS.md` D-18
   attribue explicitement ce point à **fix-app** (« `/mentions` dit que la source par défaut est
   `SYNTHETIC` (DR-152) », colonne « Conséquence / porteur » : « fix-providers ; fix-app (DR-152) »).
   Je n'ai donc rien amendé pour ce sous-point au-delà de `EX-DATA-107` (couvert par `D-24`, qui
   porte sur le même sujet de fond — l'affichage `SYNTHETIC`). Signalé plutôt que deviné.

---

## 3. Renvois harmonisés

Contrôle mécanique exécuté : pour chaque identifiant amendé, `grep -rn` de l'identifiant dans
`docs/requirements/*.md` pour repérer les renvois. Deux catégories de résultat :

**A. Renvois déjà cohérents, aucune action** — `EX-DATA-83bis` (citations dans `draft-screens.md`
comme référence de formule pour G1/G2/G3/G9/G12/G13, valides indépendamment de la dette worker),
`EX-DATA-100bis`, `EX-DATA-105`, `EX-DATA-108`, `EX-NAV-10bis`, `EX-SCR-32`, `EX-SCR-157`,
`EX-SCR-158`, `EX-SCR-177`, `EX-SCR-208`, `ARB-12`, `ARB-56`, `EX-CRUD-19`.

**B. Renvois harmonisés (édités)** — la vérification mécanique après amendement de `EX-NAV-5`
(D-09, paramètre `make` retiré) a trouvé cinq autres endroits citant encore ce paramètre disparu,
tous corrigés en `mmmv` dans le même commit que l'harmonisation :

| Fichier | Identifiant portant la citation | Avant | Après |
|---|---|---|---|
| `draft-behaviour.md` | `EX-NAV-6` (liste d'exemple) | `make` dans la liste des filtres multi-valeurs | `mmmv` |
| `draft-behaviour.md` | `EX-SRCH-8` | contrôle associé : `make` | contrôle associé : `mmmv` |
| `draft-behaviour.md` | `EX-SRCH-11` (liste d'attributs à OU intra-filtre) | `make` dans la liste | `mmmv` |
| `draft-behaviour.md` | `EX-SRCH-14` (dépendance parent/enfant marque → modèle) | « route vers `/` avec `make` posé » | « route vers `/marche` avec `mmmv=<makeId>\|\|\|` posé » |
| `draft-screens.md` | `EX-SCR-45` (fil d'Ariane) | clic marque ramène « à `/marche` avec `make` posé » | « à `/marche` avec `mmmv` posé (segment modèle vide) » |
| `draft-data-dictionary.md` | `EX-SCR-46`/`selectionHashWithoutTaxonomy` (liste de prédicats de taxonomie) | `(make, mmmv, cat, mcat, …)` | `(mmmv, cat, mcat, …)` |

Après cette passe, `grep -n '`make`'` sur les trois annexes ne renvoie plus qu'une seule occurrence :
la phrase de `EX-NAV-5` elle-même documentant explicitement que ce paramètre n'existe pas.

---

## 4. Hors périmètre documentaire (signalé, non traité)

- **`D-18` (partie `/mentions`)** — voir §2.3. Attribué à fix-app par `FIX-LEAD-DECISIONS.md`.
- **`docs/plans/DataProvider.ts`** — non touché, conformément à la mission (déjà amendé à l'étape 0,
  identique à `src/providers/DataProvider.ts` ; vérifié par `diff`, sortie vide, voir §5).
- **`docs/HANDOFF.md`, `docs/research/`, `reports/DEV-REVIEW.md`, `reports/review/`** — hors
  périmètre d'écriture, non touchés.

---

## 5. Vérifications

```
$ npx tsc --noEmit -p tsconfig.json
(sortie vide, exit 0)

$ diff docs/plans/DataProvider.ts src/providers/DataProvider.ts
(sortie vide, exit 0) — vérifié à nouveau après la remédiation documentaire : toujours identiques
```

`npm test` : **non lancé**, conformément à la mission (aucun code touché).

---

## 6. Compte des exigences par annexe (avant / après)

Aucune exigence n'a été créée, supprimée ou renumérotée. Le décompte déclaré par `REQUIREMENTS.md`
§0 (140 · A, 231 · B, 114 · C) est **inchangé**. 30 exigences/décisions normatives ont été amendées
(marque `[amendée 2.6 — D-xx]` en fin de texte) :

| Annexe | Exigences amendées | Décompte d'identifiants déclaré (avant = après) |
|---|---|---|
| A — `draft-data-dictionary.md` | 12 (`EX-DATA-49`, `83bis`, `99`, `100bis`, `104`/I7, `105`, `107`, `108`, `119`, § A.1, § C.5, + renvoi `EX-SCR-46`) | 140 |
| B — `draft-screens.md` | 10 (`EX-SCR-32`, `57`, `76`, `86`, `134`, `157`, `158`, `177`, `194`, `208`) + 1 renvoi (`EX-SCR-45`) | 231 |
| C — `draft-behaviour.md` | 8 (`EX-NAV-5`, `10bis`, `15`, `16`, `17`, `EX-SRCH-18bis`, `26`, `EX-CRUD-19`, `ARB-12`, `ARB-56`) + 4 renvois (`EX-NAV-6`, `EX-SRCH-8`, `11`, `14`) | 114 |

(Le total des « exigences amendées » ci-dessus compte 9 identifiants pour C, pas 8 : `ARB-12` et
`ARB-56` sont des arbitrages, pas des `EX-…`, comptés séparément du chiffre 114 de la table
`REQUIREMENTS.md` §0, lequel ne porte que sur les `EX-NAV/SRCH/CRUD/NFR-*`.)

---

## 7. Commits (worktree `kycar-wt/docs`, branche `fix/docs`, non poussés)

1. `D-04, D-05, D-06, D-08, T-t` — reconciliation écran A/B
2. `D-10, D-13, D-19, D-26, D-27` — disposition écrans B/C/D
3. `D-09, D-11, D-12` — `mmmv` seul paramètre marque/modèle, paramètres d'état d'interface
4. `D-14, D-15, D-16, D-17, D-24, T-r, T-s` — annexes A/C diverses
5. `D-01, D-02, D-23, D-25, O16` — annexe A, interface élargie, décomptes
6. `D-01, D-02, D-03, D-07, D-08, D-29, O16` — `ARCHITECTURE.md`
7. `EXECUTION-LOG.md` § Points ouverts (O13-O17)
8. `DR-160, README.md`
9. `REQUIREMENTS.md` v1.1 (journal des versions)
10. Harmonisation des renvois résiduels à `make` (D-09)
11. (ce rapport)
