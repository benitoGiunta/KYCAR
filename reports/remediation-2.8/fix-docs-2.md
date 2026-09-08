# fix-docs-2 — remédiation documentaire 2.8, vague F3

**Agent `fix-docs-2` (Sonnet, effort high), 2026-09-08. Worktree `kycar-wt/docs2`, branche
`fix28/docs2`.** Aucune ligne de code touchée. Périmètre : `docs/requirements/**` uniquement.

Mandat lu dans l'ordre indiqué : `CLAUDE.md`, `reports/remediation-2.8/FIX-LEAD-DECISIONS-2.8.md`
§E (`D8-29`, `D8-31`, `D8-32`), `reports/REMEDIATION-2.8.md` §7.2 (les cinq arbitrages) et §7.1
point 4 (`FV-06` mode 1), `reports/remediation-2.8/fix-docs.md` (conventions v1.2 : marque
`[amendée 2.8 — D8-xx]`, tables de journal des amendements), `reports/remediation-2.8/
fix-providers.md` §4.2/§4.3, `reports/remediation-2.8/fix-screens-finition.md` §2,
`reports/remediation-2.8/fix-foundation.md` §5.6 (points 6 et 7), puis les passages normatifs
ciblés dans `docs/requirements/`.

Vérité de terrain établie avant édition : `node -e "require('./data/reference/
filters-scope.json')"` → `totalRetenus: 74`, `totalExclus: 27` ; `grep -n 'iqr:' src/engine/
quantiles.ts` → 4 littéraux `null` (D8-30 **pas encore livré** dans ce worktree, wave F3
parallèle) ; recompte ligne à ligne de la table `EX-SCR-82` (`draft-screens.md`) → 74 `RETENU` /
27 `EXCLU`, confirmé.

---

## 1. Point par point

### 1. D8-32 (1) — `EX-DATA-17` (dénominateur de `coverageWarning` sur une source d'agrégats)

**Fichier** : `docs/requirements/draft-data-dictionary.md`, l. 246 (paragraphe `EX-DATA-17`).
**Décision** : motif de `fix-providers` §4.2 ratifié tel quel — sur `AGGREGATE_SURFACE`
(mode 1), diviser `priceQuotedCount` par `listingCount` (effectif exhaustif de facette) rendrait
`coverageWarning.price` toujours vrai, donc muet. Le dénominateur retenu sur une source
d'agrégats est l'effectif de l'**échantillon** effectivement calculé, publié à part
(`sampleCoverage`, `EX-DATA-61bis`). Règle `listingCount` conservée sur un jeu **chargé**.

**Texte ajouté** (extrait) :
> Quand l'agrégat provient d'une **source d'agrégats** (mode 1, `AGGREGATE_SURFACE` : aucune
> ligne servie, seuls des agrégats le sont), `listingCount` porte un effectif **exhaustif** de
> facette sans rapport avec l'échantillon réellement lu ; appliquer la formule à la lettre rendrait
> `coverageWarning.price` **toujours vrai**, donc muet. Sur une telle source, le dénominateur de
> `priceCoverage` — et donc le seuil de `coverageWarning.price` — est l'effectif de
> l'**échantillon** sur lequel la statistique a été effectivement calculée […] et l'agrégat
> déclare cet effectif à part (`sampleCoverage`, `EX-DATA-61bis`) plutôt que de le confondre avec
> `listingCount`. Sur un jeu **chargé** (lignes servies), la règle d'origine — dénominateur
> `listingCount` — reste inchangée.

Marque `[amendée 2.8 — D8-32]`. Commit `2bba44a`.

### 2. D8-32 (2) — `EX-DATA-35` (dette d'interface gelée, `co2Source` synthétique)

**Fichier** : `docs/requirements/draft-data-dictionary.md`, l. 466 (paragraphe `EX-DATA-35`).
**Décision** : dette **écrite**, sur le modèle exact de la note `D8-15` (l. ~1140 de
`draft-screens.md`) : nouveau paragraphe « Dette d'interface gelée ratifiée » après le texte
normatif existant, jamais une réécriture de celui-ci.

**Texte ajouté** (extrait) :
> L'interface `DataProvider` v1 (`ListingColumnBatch`, `EX-DATA-119`) ne porte **aucune** colonne
> `co2Source` […]. Ce provider [synthétique] publie `co2Source = UNKNOWN` pour la totalité de ses
> lignes et **le déclare** plutôt que de le laisser muet : `unknownCountByField.co2Source =
> listingCount` et `coverageNote` explicitent que la totalité de l'effectif est concernée. Côté
> provider **réel** […] `EX-DATA-35` est tenue à la lettre. Levée prévue en **v2 de l'interface**
> `DataProvider` (une colonne d'un octet supplémentaire […], sans effet mesuré sur `EX-NFR-3`
> à 100 000 lignes).

Marque `[amendée 2.8 — D8-32]`. Commit `2bba44a`.

### 3. D8-32 (3) — `EX-SCR-159` (§6.4, version bornée)

**Fichier** : `docs/requirements/draft-screens.md`, l. 1788 et suivantes (paragraphe
`EX-SCR-159`, §6.4 `G4` — la vue tri-dimensionnelle).
**Décision** : ratification de la version livrée par `fix-screens-finition` §2 (légende continue
atténuée à `n ≤ 3`, pas de recentrage à `n = 1`, seuil et désactivation du brossage conformes) ;
pastilles/valeurs littérales de la spécification complète consignées comme dette de présentation
**non bloquante**.

**Texte ajouté** (extrait) :
> La correction livrée en 2.8 retient le seuil […] et **l'atténuation** visuelle de la légende
> continue […], mais **pas** la reconstruction en pastilles/valeurs littérales exactes décrite
> ci-dessus pour `n ≤ 3`, ni le recentrage à `n = 1` […]. Le passage à la version complète
> (pastilles et valeurs littérales exactes, recentrage à `n = 1`) reste une **dette de
> présentation, non bloquante**, ouverte pour un lot ultérieur si le produit l'exige au-delà de
> cette version.

Marque `[amendée 2.8 — D8-32]`. Commit `90b837b`.

### 4. D8-32 (4) — `EX-DATA-64` (portée de `count`, hypothèse `D8-30`)

**Fichier** : `docs/requirements/draft-data-dictionary.md`, l. 918 et suivantes (§B.2,
paragraphe `EX-DATA-64`). Le tableau normatif de treize valeurs n'a **pas** été modifié (il
contenait déjà `count`, `coverage` et `iqr` comme référence de ce que le couple
conteneur + `MetricStats` doit publier) : ajout d'un paragraphe de précision après le tableau.

**Texte ajouté** (extrait) :
> `count` […] est **le même nombre** pour les trois métriques […] d'une même sélection : il est
> porté par le **conteneur** de l'agrégat […], et non répété à l'identique dans chacun des trois
> blocs `MetricStats` […]. HYPOTHÈSE (`fix-docs-2`) : cette note suppose que `D8-30` — le calcul
> de `iqr` et de `coverage` dans `MetricStats` […], aujourd'hui deux littéraux `null` dans
> `src/engine/quantiles.ts` — est livré par `fix-engine-2` dans la même vague F3 que ce lot
> documentaire ; si `D8-30` n'aboutit pas, `iqr` et `coverage` restent `null` et le bloc ne
> publie alors que dix des treize valeurs, la présente note ne portant que sur la **structure**
> […], jamais sur le fait que `iqr`/`coverage` soient effectivement calculés.

Vérifié dans ce worktree : `grep -n 'iqr:' src/engine/quantiles.ts` → 4 littéraux `null` à HEAD de
`fix28/docs2` (D8-30 non livré ici — worktree isolé de `fix-engine-2`). L'hypothèse est donc
écrite au sens strict d'E4 : elle peut se révéler fausse selon l'issue de `fix-engine-2`, sans
que cela invalide la partie structurelle de la note. Marque `[amendée 2.8 — D8-32]`.
Commit `2bba44a`.

### 5. D8-32 (5) — `zipr` / décompte des filtres retenus

**Constat préalable, à signaler** : `REF-filters.md` est un document **factuel** (catalogue
relevé sur AutoScout24), qui ne porte **aucune** colonne `RETENU`/`EXCLU` — cette classification
KYCAR vit exclusivement dans `draft-screens.md`, table `EX-SCR-82` (§4.7), recopiée de
`data/reference/filters-scope.json`. La mission cite « dans `REF-filters.md`, `zipr` dépend de
`zip` (EXCLU) » ; j'ai donc traité cela comme un raccourci pour « le statut KYCAR de `zipr` » et
agi en conséquence sans poser de question (E3) :

- **`REF-filters.md`** (fiche `zipr`, l. ~1079) : ajout d'une **note informative** de
  cross-référence rappelant le statut KYCAR (`zip` `EXCLU`, `zipr` **`RETENU`**) déjà établi dans
  `EX-SCR-82` #66-67, sans introduire de nouvelle colonne de classification dans un document qui
  n'en a jamais porté — cette note n'est pas marquée `[amendée 2.8]` (`REF-filters.md` n'est pas
  une des trois annexes versionnées A/B/C).
- **Statut retenu pour `zipr`** : reste **`RETENU`**, inchangé. La table `EX-SCR-82` (déjà
  amendée par `fix-docs` en v1.2, note à la ligne #67 : « dépendance résiduelle sans effet ») est
  la seule source de vérité normative et n'a pas été rouverte : la décision `D8-32(5)` ratifie ce
  statut sans le remettre en cause (aucun effet d'exécution, `zipr` étant de toute façon de classe
  `T`, sans champ local). Je n'ai donc **pas** requalifié `zipr` en `EXCLU`.
- **`ARBITRAGES-req-lead.md`** (R-A15) : le décompte historique « 77 retenus (13 primaires / 60
  secondaires / 3 désactivés / 1 non exposé) + 24 exclus = 101 » date de la clôture de la phase
  2.2 (arbitrage `B-39`) et est **antérieur** à `D8-13` (v1.2), qui a fait passer `zip`, `lat`,
  `lon` de `RETENU` à `EXCLU` sans que cette table de bilan historique soit répercutée. J'ai
  **laissé le chiffre historique tel quel** (trace de l'arbitrage `B-39`, non falsifiée) et
  **ajouté une note datée** donnant le décompte courant.

**Recompte effectué** (ligne à ligne sur `EX-SCR-82`, 101 lignes) : **74 `RETENU`** (68 exposés +
6 `NON_EXPOSE`) et **27 `EXCLU`** — identique au chiffre déjà établi par `fix-docs` en v1.2
(`EX-SCR-83`, `REQUIREMENTS.md` §0/§6/§11.3) et à `data/reference/filters-scope.json`
(`totalRetenus: 74`, `totalExclus: 27`). **Aucun écart trouvé avec le 74 déjà établi** ; rien à
signaler au registre de code, qui reste inchangé (je n'y ai pas touché).

Marque `[amendée 2.8 — D8-32]` uniquement sur la note d'`ARBITRAGES-req-lead.md`. Commit
`9a9ccd0`.

### 6. D8-29 — `FV-06` mode 1 (`EX-SCR-65`, `89`, `90`)

**Fichier** : `docs/requirements/draft-screens.md`.
- `EX-SCR-90` (l. 1095, §4.8) : ajout du paragraphe de dette architecturale ratifiée, juste après
  le texte normatif d'`EX-SCR-89`/`90`.
- `EX-SCR-65` (l. 712, §4.4) : ajout d'un renvoi d'une ligne vers la dette sous `EX-SCR-90`.

**Texte ajouté sous `EX-SCR-90`** (extrait) :
> En **mode 1** (agrégats servis sans ligne, `AGGREGATE_SURFACE`), aucun jeu de lignes n'est
> chargé : le calcul de facette leave-one-out qu'exige `EX-SCR-90` n'a alors **rien** sur quoi
> porter. En mode 1, les effectifs de facette `(n)` — `EX-SCR-90` — et le marquage `(0)` d'une
> option sans résultat — `EX-SCR-89` — **ne sont pas affichés** : `CheckboxList` ne rend
> **aucune** parenthèse, jamais un `(0)` par défaut ni une valeur inventée. […] se referme
> d'elle-même dès le passage en **mode 2** (`FV-06` y est corrigé en entier, `D8-05`). Condition
> de levée en mode 1 : une décision produit […] ou un `DataProvider` de mode 1 exposant lui-même
> des facettes (`DataProvider.facets()`, v2 de l'interface). Hors dépôt tant que l'une des deux
> conditions n'est pas remplie, au même titre qu'`EX-SCR-9`.

Marque `[amendée 2.8 — D8-29]` sur les deux passages. Commit `90b837b`.

---

## 2. Vérifications de cohérence (mission, point 7)

```
$ grep -n "v1.2\|v1.3" docs/requirements/*.md
```
→ uniquement dans `REQUIREMENTS.md` (journal des versions, section 13, deux mentions attendues) ;
`ARBITRAGES-req-lead.md` porte une mention textuelle « v1.2 » dans ma note (référence à `D8-13`,
attendue). Aucune autre occurrence.

```
$ grep -c "^\`EX-" docs/requirements/draft-screens.md   → 245 (inchangé, aucune ligne d'exigence renumérotée)
$ grep -c "^\*\*EX-DATA" docs/requirements/draft-data-dictionary.md   → 140 (inchangé)
```
Aucune exigence créée, supprimée ou renumérotée. Les décomptes déclarés par `REQUIREMENTS.md` §0
(140 · A, 231 · B, 114 · C) sont **inchangés** — aucun des six points n'ajoute ou ne retire une
exigence, seulement des précisions/dettes annotées.

`docs/HANDOFF.md` et `docs/EXECUTION-LOG.md` : **non touchés**, conformément à la mission.

`npm test`, `npm run build` : **non lancés**, conformément au mandat (aucun code touché, périmètre
`docs/requirements/**` uniquement).

---

## 3. Contradictions rencontrées

**Une, mineure, non bloquante (résolue par interprétation raisonnable, signalée pour mémoire).**
La mission (point 5) et `FIX-LEAD-DECISIONS-2.8.md` (D8-32(5)) demandent d'agir « dans
`REF-filters.md` sur le statut `zipr`/`zip`, alors que ce fichier ne porte structurellement
**aucune** colonne `RETENU`/`EXCLU` (vérifié par grep, §1 point 5 ci-dessus) — cette classification
n'existe que dans `draft-screens.md` (`EX-SCR-82`). Je n'ai **pas arrêté mon travail sur ce point**
faute d'une véritable contradiction inter-annexes (aucune décision ne se contredit : elles
pointent simplement vers le mauvais fichier pour la classification elle-même) — j'ai traité la
demande comme visant le **statut KYCAR de `zipr`** en général, ajouté la note attendue à l'endroit
factuellement pertinent (`REF-filters.md`, en cross-référence) et laissé `EX-SCR-82` — la seule
source normative de ce statut — inchangée puisque déjà correcte. Aucune autre contradiction
inter-annexes rencontrée sur les six points de la mission.

---

## 4. Commits (worktree `kycar-wt/docs2`, branche `fix28/docs2`, non poussés)

1. `2bba44a` — `D8-32` : `EX-DATA-17` (dénominateur sur source d'agrégats), `EX-DATA-35` (dette
   `co2Source`), `EX-DATA-64` (portée de `count`, hypothèse `D8-30`)
2. `90b837b` — `D8-32`/`D8-29` : `EX-SCR-159` (version bornée ratifiée), `EX-SCR-65`/`89`/`90`
   (dette architecturale mode 1)
3. `9a9ccd0` — `D8-32` : note `zipr` dans `REF-filters.md`, décompte courant dans
   `ARBITRAGES-req-lead.md`
4. `e92eb1d` — `REQUIREMENTS.md` : entrée v1.3 du journal des versions + table des amendements
   2.8 vague F3
5. (ce rapport)
