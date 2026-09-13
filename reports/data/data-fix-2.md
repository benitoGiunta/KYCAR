# `data-fix-2` — lot mineur du plan 3 (phase 3.5)

> Agent `data-fix-2` (Opus / effort **high**), worktree `/home/user/KYCAR-minor`, branche
> `fix35/minor` créée depuis `claude/kycar-project-ffcplk` @ `ae2bdbf`. Aucune question posée (E3),
> aucun appel réseau (E5), R3 intangible ; toute hypothèse est écrite comme telle (E4).
>
> Entrées lues : `reports/data/DATA-LEAD-DECISIONS.md` (D3-27 réécrite, D3-31, D3-34, D3-36,
> **D3-37**) · `reports/data/DATA-REVIEW.md` §10.5 (DR3-21 … DR3-24) et §10.7 (réserves R2–R5) ·
> `reports/data/data-fix.md` (§3 `DR3-10`/`DR3-14`, §5, §7) · `docs/data/DATASET-SPEC.md` et
> `docs/data/dataset-spec/*.json` · `tests/data/harness.ts`, `p72-anomalies.test.ts`,
> `p55-missingness.test.ts`, `p16-fuel-body.test.ts`, `product-fitness.test.ts` ·
> `tools/dataset/` · `reports/remediation-2.8/mvp-integrate.md` §7.2 ·
> `reports/remediation-2.8/fix-screens-3.md` §C-R1-04 · `src/app/app.css`,
> `src/screens/market/market.css`, `MakeCard.tsx`, `ModelZone.tsx`, `Histogram.tsx`.
>
> Périmètre respecté : **rien** n'a été touché dans `src/providers/` ni dans `tests/contract/`
> (lot `fix-providers-3`), ni dans `/home/user/KYCAR` ni `/home/user/KYCAR-providers`.

---

## 1. Résumé

Sept constats, tous **clos**. Quatre touchent la donnée (`DR3-21` … `DR3-24`, réserves R2–R5 de la
porte G9b), trois sont des retouches localisées (`C-3.5-02`, `C-3.5-05`, cause racine de `C-R1-04`).

| # | Constat | Ce qui a changé | Preuve |
|---|---|---|---|
| **DR3-21** | `A-11` déclarait une base que le générateur n'appliquait pas | restriction déplacée dans `vivier` ; les **trois** compteurs de base comparent la chaîne **exactement** et refusent une base inconnue | attendu 67,5 pour 67 réalisées (`test`), 16,9 pour 17 (`dev`) |
| **DR3-22** | `sportive` retourné à 75 % de cabriolets sans le dire ; part de cabriolets non contrainte | mélange à dominante coupé rétabli (0,38 / 0,25) ; un tiers du segment en codes 6 et 1 ; cabriolets aussi en `citadine`/`compacte` ; **sonde neuve `P-24bis`** | coupé 3,18 % / cabriolet 1,73 % (`test`), 2,85 % / 1,43 % (`dev`) ; P1 137 offres / 33 marques |
| **DR3-23** | sortie `P-72` trompeuse pour les codes partagés | une ligne **par code**, part de chaque `A-nn` entre crochets | `REGION_UNRESOLVED:90/90.0[A-19 10.0@20000+A-21 80.0@20000]` |
| **DR3-24** | `D3-27` ni appliquée ni fidèlement rédigée ; un champ sans taux prouvé | tolérance `max(±25 % relatifs, ±3 e.t.)`, **tous profils**, **sans plancher** ; `P-55` quitte EG-12 | **79** champs mesurés, **0** hors tolérance, **aux deux profils** |
| **C-3.5-02** | `EX-DATA-40` disait encore « 9ᵉ valeur non identifiée » | `ca → CA` ajouté, paragraphe réécrit, `[amendée 3.5 — D3-07]` | cohérent avec `vocabularies.ts` (index 8) et le schéma |
| **C-3.5-05** | `Snapshot.sourceKind` littéral `'REAL' \| 'SYNTHETIC'` | devient `SourceKind` (+ l'import qui manquait) | `build` 0/0, `src/types` 79/79 |
| **C-R1-04** | règle globale `.kycar-app [role='button']` écrasant le `display: contents` | boîte posée par `:where(…)`, spécificité **nulle** ; contournement de `market.css` retiré | ACC-08 / ACC-08bis / axe / clavier verts sur 3 projets |

**Aucune sonde n'a été affaiblie.** Deux sondes ont été **modifiées** (justification `D-31` écrite en
tête de chacune) : `R-DATA-19` devient **plus stricte** (comparaison exacte de la base au lieu d'un
préfixe), `R-DATA-11` devient **plus large sur les petites populations et plus étendue** — elle passe
de 78 champs opposables au seul profil `test` à **79 champs opposables aux deux profils**. Une sonde
est **neuve** (`P-24bis`). Une sonde sort d'`it.fails` : `P-55` au profil `dev`.

**Un point reste dû au coordinateur** avant l'acceptance : un défaut **latent** de la même famille
que `C-R1-04`, découvert en mesurant, que j'ai délibérément **laissé en l'état** (§9).

---

## 2. Méthode

Trois principes, dans cet ordre.

1. **La sonde qui révèle le défaut le prouve.** Pour `DR3-21`, `DR3-23` et `DR3-24`, le recalcul est
   fait *hors* du générateur (script de mesure indépendant sur les octets livrés, puis `data:check`,
   puis la sonde) : trois chemins qui doivent tomber sur le même chiffre. Les valeurs publiées ici
   sont celles des **trois**.
2. **Une tolérance ne se règle pas, elle se démontre.** La bande de `P-24bis` est posée sur les deux
   états **connus** du jeu et fermée en haut *sous* la valeur qu'avait produite le défaut : le défaut
   constaté rend la sonde **rouge**. La tolérance de `P-55` est écrite comme une loi (`√(p(1−p)/n)`),
   pas comme un seuil choisi après mesure.
3. **Un changement de mise en page se mesure avant/après, dans le navigateur.** Pour `C-R1-04` j'ai
   relevé les styles **calculés** des trois éléments concernés sur le build de production, avant et
   après, aux deux extrêmes de largeur, et je publie le delta exact (§8). Je ne me suis pas contenté
   des sondes vertes.

### 2.1 Hypothèses écrites (E4)

| # | Hypothèse | Où |
|---|---|---|
| **HS-01** | Aucune série publique belge ne donne la répartition des carrosseries **à l'intérieur** d'un palier de prix (même trou de source que `H5`). Le tiers de `sportive` qui n'est ni coupé ni cabriolet (codes 6 et 1 : berlines et compactes sportives) est une hypothèse de modèle, **bornée en haut par `P-24`** et **en bas par `R-DATA-28`**. | `segments.json:constatDR3_22`, `DATASET-SPEC.md` §1.4 |
| **HS-02** | Aucune série publique belge ne donne la part des **cabriolets** dans le stock d'occasion. La bande `[1,0 % ; 2,5 %]` de `P-24bis` est posée sur les deux états connus du jeu (1,51 % avant `DR3-14`, 2,74 % après), élargie d'un demi-point vers le bas et fermée en haut **sous** la valeur produite par l'inversion. | `probes.json:P-24bis`, `tests/data/p16-fuel-body.test.ts` |
| **HS-03** | `EX-SCR-21` (cible tactile) est une exigence d'**accessibilité**, pas un défaut de mise en page : le plancher `min-height` garde une spécificité ordinaire, la **boîte** passe à spécificité nulle. C'est ce partage qui distingue « ce qu'un composant peut redéfinir » de « ce qu'il ne doit pas pouvoir passer ». | `src/app/app.css`, §7 |

---

## 3. `DR3-21` (R2) — `A-11` : la restriction était un vivier, pas un dénominateur

**Cause exacte.** `anomalies.json:A-11.base` disait « annonces à prix affiché **de cellules
(make, model) à `|F| ≥ 30`** ». Le générateur (`tools/dataset/anomalies.mjs`, `baseCount`) reconnaît
la base **par préfixe** — `base.startsWith('annonces a prix affiche')` — et ramenait donc cette
chaîne à « annonces à prix affiché » : le taux 0,35 % était lu sur **toutes** les annonces à prix
affiché. `tools/dataset/check.mjs` et la sonde `R-DATA-19` partageaient **le même préfixe**, donc le
même angle mort : personne ne pouvait voir l'écart. C'est très exactement le défaut que `DR3-10`
demandait de fermer partout — « le champ ne doit pas annoncer une chose et le fichier en produire
une autre ».

Le vivier réel du générateur est d'ailleurs **plus étroit** encore que ce que `base` annonçait :
`assignAnomalySlots` filtre sur `|F| ≥ 30` **et** sur l'existence d'un ajustement M2 exploitable dans
la cellule (`stats.fitC2.ok`, `DR3-09`).

**Correction.**

- `anomalies.json:A-11` : `base` = « annonces a prix affiche » ; `vivier` = « annonces a prix affiche
  de cellules (make, model) a |F| >= 30 **dont la regression de cellule porte un ajustement M2
  EXPLOITABLE (DR3-09)** » ; `baseNote` porte le recalcul. Même mécanisme que `A-04` et `A-16`
  (`baseVsVivier`).
- `baseVsVivier` gagne la **règle de lecture** opposable : *`base` ne nomme que des populations que le
  compteur sait compter ; toute autre restriction s'écrit dans `vivier`.*
- Les **trois** implémentations (`tools/dataset/anomalies.mjs`, `tools/dataset/check.mjs`,
  `tests/data/p72-anomalies.test.ts`) comparent désormais la chaîne **exactement** et **lèvent** sur
  une base inconnue. C'est ce qui empêche la récidive : une restriction écrite par erreur dans `base`
  arrête la génération au lieu d'être absorbée.

**Preuve par recalcul.** Effectifs de base recomptés sur les **lignes livrées**, hors générateur.

| Profil | base « prix affiché » | attendu `0,0035 × base` | réalisé | écart |
|---|---:|---:|---:|---:|
| `test` | 19 272 | **67,5** | **67** | −0,7 % |
| `dev` | 4 818 | **16,9** | **17** | +0,8 % |

Sur la base **fautive** que le champ déclarait auparavant (cellules à `|F| ≥ 30`), la revue avait
mesuré 48,1 attendues contre 67 (**+39 %**) au profil `test` et 4,9 contre 17 (**+246 %**) au profil
`dev` : c'est cet écart qui disparaît, non parce que la donnée change, mais parce que le champ dit
enfin ce que le fichier fait.

**Sonde.** `R-DATA-19` (`P-72`) — **modifiée**, justification `D-31` écrite en tête de `baseCount` :
la reconnaissance par préfixe est remplacée par une égalité stricte et une base inconnue fait
**échouer** la sonde. Aucune tolérance n'a bougé, aucune population mesurée n'a changé ; la sonde ne
peut plus mesurer autre chose que ce que le champ déclare.

**Documentation.** `DATASET-SPEC.md` §6 (« Base contre vivier (`DR3-21`) »),
`DATASET-GEN.md` `EG-23`.

---

## 4. `DR3-22` (R3) — le mélange `sportive`, l'ordre du marché, et une part enfin sondée

**Cause exacte.** La correction de `DR3-14` avait fait **deux** choses et n'en avait documenté
qu'une. Documentée : le code 3 (Coupé) réparti sur quatre segments, pour que le parcours P1 ait de la
matière. Non documentée : le segment `sportive` passé de **60 % coupé / 40 % cabriolet** à
**25 / 75**. Cela **inverse l'ordre du marché** — une sportive d'occasion est plus souvent un coupé
qu'un cabriolet — et n'avait d'autre effet que de maintenir la part de coupés sous la borne haute de
`P-24`, en faisant monter de **81 %** une part de cabriolets qu'**aucune sonde ne contraignait**.
Une part mesurée avait été tenue en déplaçant une part non mesurée.

### 4.1 La tension, chiffrée avant de choisir

Trois contraintes portent sur les mêmes tirages, et elles ne sont pas conciliables naïvement :

1. `P-24` : part de coupés ∈ **[2,0 % ; 3,5 %]** — soit au plus **694** coupés au profil `test` ;
2. `DR3-22` : dans `sportive`, **coupé > cabriolet** ;
3. `R-DATA-28` : le parcours P1 (coupé + prix ≤ 20 000 € + km ≤ 100 000) garde **≥ 120 offres** sur
   **≥ 10 marques**, et **≥ 450 coupés** avant filtres.

Le segment `sportive` pèse **≈ 724** annonces au profil `test` (mesuré : 543 cabriolets à 0,75 de
poids). S'il était rendu à 60/40, il produirait à lui seul **434** coupés — **chers** (prix catalogue
55 000 €), donc inutiles à P1 — et il ne resterait que 260 coupés pour les segments bon marché, d'où
un P1 sous le plancher. J'ai mesuré le rendement P1 de chaque source par une régénération de
contrôle (poids `compacte` du code 3 mis à zéro) : **0,43 offre P1 par coupé de `citadine`**,
**0,20 par coupé de `compacte`**, **≈ 0,02 par coupé de `sportive`**.

La sortie est de ne pas faire porter le cabriolet par une **source unique**. C'est aussi ce que dit
le marché : Fiat 500C, MINI Cabrio, DS 3 Cabrio, Peugeot 207/208 CC, VW Golf Cabriolet, Audi A3
Cabriolet, BMW Série 2 Cabriolet sont des cabriolets de segment **courant**, exactement au même titre
que les coupés bon marché nommés par `DR3-14`.

### 4.2 Ce qui est en vigueur

| segment | code 3 Coupé | code 2 Cabriolet | reste |
|---|---:|---:|---|
| `citadine` | 0,092 | **0,02** | 0,888 code 1 |
| `compacte` | 0,012 | **0,02** | 0,818 code 6, 0,15 code 1 |
| `sportive` | **0,38** | **0,25** | 0,22 code 6, 0,15 code 1 |
| `luxe` | 0,04 | — | 0,30 code 4, 0,66 code 6 |

Trois motifs, écrits dans `segments.json:constatDR3_22` et dans `DATASET-SPEC.md` §1.4 :
(a) l'**ordre du marché** est rétabli dans `sportive`, 0,38 contre 0,25, **rapport 1,52** (la valeur
d'avant `DR3-14` valait 1,50) ; (b) le segment `sportive` **n'est pas une carrosserie** — c'est un
palier de prix catalogue (55 000 €) et de puissance (médiane 180 kW) — et une part du parc sportif
d'occasion est à quatre ou cinq portes (M3, AMG C 63, RS 4, Golf GTI et R, Civic Type R), d'où 0,22
de code 6 et 0,15 de code 1, **hypothèse écrite `HS-01`** ; (c) les cabriolets viennent désormais de
**trois** segments.

### 4.3 Preuve par recalcul — delta de composition

Snapshot S0, part parmi les annonces à **carrosserie connue** (19 840 au profil `test`, 4 956 au
profil `dev`).

| Profil / état | coupé (3) | cabriolet (2) | rapport | P1 après filtres | coupés avant filtres |
|---|---:|---:|---:|---:|---:|
| `test`, avant `DR3-14` | 2,41 % | 1,51 % | 1,60 | 30 | ≈ 480 |
| `test`, après `DR3-14` (état commité en 3.4) | 3,387 % (672) | 2,737 % (543) | 1,24 | 156 / 35 marques | 672 |
| **`test`, après `DR3-22`** | **3,180 % (631)** | **1,729 % (343)** | **1,84** | **137 / 33 marques** | **631** |
| `dev`, après `DR3-14` | 3,208 % (159) | 2,361 % (117) | 1,36 | 36 / 15 marques | 159 |
| **`dev`, après `DR3-22`** | **2,845 % (141)** | **1,433 % (71)** | **1,99** | 31 / 16 marques | 141 |

Distribution complète des carrosseries, profil `test` S0, avant → après :

| code | libellé | avant | après | Δ |
|---|---|---:|---:|---:|
| 1 | Citadine | 19,032 % | 18,876 % | −0,156 |
| 2 | Cabriolet | 2,737 % | **1,729 %** | **−1,008** |
| 3 | Coupé | 3,387 % | **3,180 %** | **−0,207** |
| 4 | SUV/4×4 | 27,238 % | 27,238 % | 0 |
| 5 | Break | 10,675 % | 10,675 % | 0 |
| 6 | Berline | 27,651 % | **29,022 %** | **+1,371** |
| 7 | Autres | 0,988 % | 0,988 % | 0 |
| 12 | Monospace | 4,869 % | 4,869 % | 0 |
| 13 | Utilitaire | 3,422 % | 3,422 % | 0 |

Marges tenues : `P-24` à **3,18 %** pour une borne à 3,5 % (0,32 point, soit ≈ 2,5 erreurs-types de
régénération) — la marge était de 0,11 point avant ce lot ; `R-DATA-28` à **137** offres pour un
plancher de 120 et **33** marques pour un plancher de 10 ; `R-DATA-25` (dev reproduit test à ±3
points) : coupés 3,18 contre 2,85, écart **0,34 point**.

### 4.4 Sonde neuve — `P-24bis`

`tests/data/p16-fuel-body.test.ts`, à côté de `P-24` ; `probes.json:P-24bis` ; `data:check` la rejoue
aussi. Deux assertions, de nature différente :

- **`part(coupés) > part(cabriolets)`** — l'**ordre du marché**. Ce n'est pas une tolérance de
  calibrage : c'est le fait que `DR3-22` nomme, vérifiable sans aucun chiffre. C'est cette assertion
  qui rend l'inversion **impossible sans qu'une sonde tombe**.
- **`part(cabriolets) ∈ [1,0 % ; 2,5 %]`** — **hypothèse écrite `HS-02`** (§2.1). Fermée en haut
  **sous** 2,74 % : le défaut constaté rendrait la sonde rouge.

Le contrat passe de **110** à **111** sondes ; le contrôle de couverture de `cross-findings.test.ts`
est relu et lit `111 sondes du contrat, 111 couvertes`.

**Documentation.** `DATASET-SPEC.md` §1.4 (amendement `DR3-22`, tables ci-dessus) et §2
(« le code 2 est servi par trois segments ») ; `DATASET-GEN.md` `EG-21` ; `probes.json`.

---

## 5. `DR3-23` (R4) — `P-72` : une ligne par code

**Cause exacte.** Le contrôle imprimait une ligne **par `A-nn`** — attendu propre à l'anomalie — mais
un effectif **réalisé par code**, obtenu en sommant la vérité terrain du code. Quand deux anomalies
partagent un code, chacune affichait donc le total : `A-19:90/10.0` et `A-21:90/80.0` se lisaient
comme **+800 %** là où l'accord est parfait. La tolérance, elle, était déjà relâchée pour ces cas
(`réalisé ≥ ⌊attendu⌋`), ce qui masquait le problème au lieu de le nommer.

**Correction.** L'unité d'affichage **et** de tolérance est le **groupe de codes** — les codes d'une
même anomalie (`A-10` `LOW`/`HIGH`) et les anomalies qui partagent un code (`A-19`, `A-21`) sont
fondus. C'est la plus petite unité que la spécification chiffre, et c'est déjà ce que faisait la
sonde `R-DATA-19` : les deux contrôles disent maintenant la même chose. La part imputée à chaque
`A-nn` est publiée **entre crochets**, avec son effectif de base. Le relâchement `réalisé ≥ ⌊attendu⌋`
est **supprimé** : la tolérance de ±20 % (ou ±1) s'applique désormais à **tous** les groupes — c'est
un durcissement.

**Preuve.** `npm run data:check -- --profile test`, extrait :

```
REGION_UNRESOLVED:90/90.0[A-19 10.0@20000+A-21 80.0@20000]
OUTLIER_M1_LOW+OUTLIER_M1_HIGH:48/48.2[A-10 48.2@19272]
OUTLIER_M2_LOW+OUTLIER_M2_HIGH:67/67.5[A-11 67.5@19272]
PRICE_ON_REQUEST_WITH_AMOUNT:8/7.9[A-20 7.9@608]
```

`REGION_UNRESOLVED` se lit bien **90/90** au profil test (`0,0005 × 20 000 + 0,004 × 20 000`), et
**23/22,5** au profil `dev`. 25 groupes, 0 hors tolérance aux deux profils.

**Documentation.** `DATASET-SPEC.md` §6 (« Lecture de `P-72` (`DR3-23`) »), `DATASET-GEN.md` `EG-23`
et la table des trois contrôles corrigés.

---

## 6. `DR3-24` (R5) — `P-55` : la tolérance tient compte de l'effectif, il n'y a plus de plancher

**Cause exacte.** Deux dispositifs se superposaient et **aucun n'était décidé** : un **plancher
`n ≥ 100`** posé par le reviewer, qui retirait de la mesure tout champ à petite population éligible ;
et la **mise hors portée du profil `dev`** (EG-12, `DR3-19`). Ils traitent le même mal — une bande
*relative* est plus étroite que le bruit quand la population est petite — et tous deux le traitent en
**retirant** de la mesure. Retirer n'est pas tolérer : `consumption.electricCombined` (96 lignes
éligibles au profil `test`, 27 au profil `dev`) n'avait de taux d'absence mesuré à **aucun volume
commité**.

**Correction — `D3-27` réécrite (`D3-37`), appliquée.** Un champ est conforme si sa mesure tombe dans
**`référence ± max(25 % relatifs, 3 erreurs-types)`**, **à tous les profils**, **sans plancher
d'effectif**. L'erreur-type est celle de la proportion **sous la référence**, `√(p(1−p)/n)` : c'est la
loi que la sonde oppose à la donnée, pas la donnée qui fixe sa propre marge. La bande relative reste
seule active dès que `n` est grand — elle atteint 3 erreurs-types à `n ≥ 816` pour `p = 0,15`. Seule
une population **vide** est écartée, et **nommée** : aucun taux n'y est définissable ; ce n'est pas un
plancher (il n'y en a aucune aux deux profils commités).

**Sonde modifiée — justification `D-31`** écrite en tête de `R-DATA-11`, et reprise dans
`probes.json:P-55` et `DATASET-SPEC.md` §5. Ce n'est **pas** un affaiblissement, et le rapport de
force le montre :

| | avant | après |
|---|---|---|
| champs mesurés, profil `test` | 78 | **79** |
| champs mesurés, profil `dev` | 71 (et sonde en `it.fails`) | **79** |
| profils où la sonde est **opposable** | `test` seul | **les deux** |
| `consumption.electricCombined` | écarté (n = 96 < 100) | **mesuré** |
| dispositif `IS_TEST_PROFILE ? it : it.fails` | actif | **retiré** (la dette est levée) |

**Preuve par recalcul.**

| Profil | champs mesurés | hors tolérance | `consumption.electricCombined` | écart max en erreurs-types |
|---|---:|---:|---|---|
| `test` | **79** | **0** | 20,8 % pour 15 % de référence — **+38,9 % relatifs**, **1,60 e.t.**, `n = 96` | 64,80 (`additionalFuelTypes`, 24,3 % relatifs, `n = 20 000`) |
| `dev` | **79** | **0** | 25,9 % pour 15 % — **+72,8 % relatifs**, **1,59 e.t.**, `n = 27` | 33,15 (`additionalFuelTypes`, 24,9 % relatifs, `n = 5 000`) |

Les deux valeurs de `consumption.electricCombined` reproduisent **au chiffre près** le recalcul du
reviewer (§10.5 : « 20,83 % pour une référence de 15 %, +38,9 % relatif, mais 1,60 erreur-type
seulement — compatible avec la référence, donc ni fautif ni prouvé »). Il est désormais **mesuré** et
**conforme**, ce qui est exactement ce que la réserve R5 demandait.

**Aucun champ ne sort de l'intervalle** après la règle : il n'y a donc aucun constat à ouvrir de ce
côté. Le champ `additionalFuelTypes` mérite une ligne, parce que son écart vaut **64,80 erreurs-types**
tout en restant sous les 25 % relatifs : la règle est un **maximum** des deux bandes, la bande
relative domine à grand `n`, et ce champ est conforme au sens de `D3-27`. Ce n'est pas un défaut
introduit par ce lot — il était déjà là, à 24,3 %, sous la seule règle relative. Je le **consigne**
au §9 : la question de savoir si un écart à 65 erreurs-types sur un champ à taux élevé doit être
opposable relève de la spécification, pas de ce lot.

`data:check` applique la **même** règle (59 champs — le contrôle latéral ignore les taux de référence
nuls), écart relatif maximal 38,9 % (`test`) et 72,8 % (`dev`), **0 écart**. Le profil `dev` passe de
**4** dettes à **3** : `P-55 EG-12` a disparu.

**Documentation.** `DATASET-SPEC.md` §5 (« Amendement DR3-24 »), `DATASET-GEN.md` `EG-12` (la liste
revient à **six** sondes : `P-18`, `P-23`, `P-37`, `P-38`, `P-45`, `P-58`) et `EG-22`,
`probes.json:P-55` (`portee` repasse de `snapshot test` à `snapshot`) et les cinq entrées qui citaient
la liste EG-12.

---

## 7. `C-3.5-02` et `C-3.5-05` — deux retouches

**`C-3.5-02`.** `docs/requirements/draft-data-dictionary.md`, champ **74** et paragraphe
`EX-DATA-40`. La table de traduction gagne **`ca` → `CA`** et la mention `[amendée 3.5 — D3-07]` ; le
paragraphe qui disait « cette table en traduit 8, le neuvième code n'est pas identifié par les relevés
disponibles » est réécrit : les neuf codes sont traduits, la preuve du Canada est **citée** depuis
l'OpenAPI versionné (`components.schemas.Marketplace` = `at be ca de es fr it lu nl`,
`components.schemas.Culture` `fr-CA`/`en-CA`, `Price.currency` `CAD`), et l'ordre intangible est
rappelé (`ca` à l'**index 8**, la valeur stockée dans `countryCode` étant l'index). L'exception nommée
subsiste mais est requalifiée pour ce qu'elle est désormais : un code **hors** du vocabulaire, que
seul un adaptateur de source réelle peut rencontrer — `MARKETPLACE_UNMAPPED` est **inatteignable**
pour les neuf codes connus, ce que `D3-16` et `P-101` disaient déjà côté générateur. Cohérence
vérifiée avec `src/types/vocabularies.ts` et `data/schema/as24-listing.schema.json`.

**`C-3.5-05`.** `src/types/entities.ts` : `Snapshot.sourceKind` passe du littéral
`'REAL' | 'SYNTHETIC'` au type gelé `SourceKind`. **Écart avec l'énoncé du constat** :
`mvp-integrate` annonçait « le type est déjà importé dans le fichier » — il ne l'était **pas**. Le
fichier ne fait que le **ré-exporter** (`export type { … SourceKind } from '../providers/DataProvider'`),
ce qui ne l'amène pas dans la portée locale : `npm run build` tombait sur `TS2304: Cannot find name
'SourceKind'`. Une ligne `import type { SourceKind } from '../providers/DataProvider';` a donc été
ajoutée. Le commentaire de champ dit pourquoi la correction est due bien qu'aucun chemin d'exécution
ne construise l'entité.

---

## 8. Cause racine de `C-R1-04` — la règle globale `[role='button']`

**Cause exacte.** Le bloc de cible tactile d'`src/app/app.css` posait
`display: inline-flex; align-items; justify-content; gap; min-width` sur
`.kycar-app [role='button']` **avec une spécificité ordinaire** (0-0-2-0). Or `role='button'` n'est
pas une carrosserie : c'est un **rôle ARIA**, que l'application pose sur des composants qui déclarent
eux-mêmes leur boîte. `grep role="button" src/` en donne **trois** :

| élément | fichier | la règle globale lui sert-elle ? |
|---|---|---|
| `<rect>` d'une barre d'histogramme | `src/screens/distribution/Histogram.tsx:234` | **non** — géométrie SVG : ni `display`, ni `min-width`, ni `min-height` ne s'y appliquent |
| `.kycar-market-card-header` | `src/screens/market/MakeCard.tsx:76` | **non** — `market.css` déclare `display: flex`, `align-items: center`, `gap`, `min-height` |
| `.kycar-market-zone-interactive` | `src/screens/market/ModelZone.tsx:66` | **non** — `market.css` déclare `display`, `flex-direction`, `justify-content`, `gap`, `flex`, `min-width` |

Aucun des trois n'en a besoin, et pour les deux derniers elle **écrasait** ce que `market.css`
déclare, à une classe (0-0-1-0). En régime compact, la zone-modèle doit devenir `display: contents`
pour que ses champs rejoignent la grille à quatre rangées de sa zone ; le `display: inline-flex` la
réifiait en boîte, la rangée 1 absorbait tout le contenu (`grid-template-rows` mesuré à
`90px 0px 0px 0px`) et le texte débordait sur la zone suivante. `fix-screens-3` l'avait contournée par
spécificité (`.kycar-market-zone .kycar-market-zone-interactive[role='button']`, 0-0-3-0).

**Correction — `:where()`.** La boîte est posée par `:where(.kycar-app [role='button'])`, de
spécificité **nulle** : ces déclarations restent un **défaut** — elles s'appliquent à tout
`role='button'` qui ne dit rien de sa boîte — mais **n'importe quelle** règle de composant les emporte,
quel que soit l'ordre des feuilles. Le sélecteur `button` conserve une spécificité ordinaire (un
bouton natif n'a pas de feuille de composant qui lui pose sa boîte).

**Le plancher de cible tactile (`min-height`, bloc de base et bloc 44 px mobile) garde
délibérément sa spécificité ordinaire** — hypothèse écrite `HS-03` : `EX-SCR-21` est une exigence
d'accessibilité, pas un défaut de mise en page, et un composant n'a pas à pouvoir passer dessous.
C'est ce partage qui fait que la correction est **bornée** : elle ne rend au composant que ce qu'il
déclare, et rien d'autre.

**`market.css`** : le contournement passe de `.kycar-market-zone .kycar-market-zone-interactive[role='button']`
à `.kycar-market-zone-interactive` (une classe suffit désormais). L'historique `C-R1-04` est conservé
en commentaire, comme demandé.

### 8.1 Preuve — styles calculés, avant / après, dans Chromium sur le build de production

Relevé par un script Playwright indépendant sur `vite preview` **port 4181**, `?provider=fixture:test`.

| élément | propriété | avant | après | pourquoi |
|---|---|---|---|---|
| `.kycar-market-zone-interactive` | `gap` | 4 px | **2 px** | `market.css` déclare 2 px ; il était écrasé |
| `.kycar-market-zone-interactive` | `min-width` | 32 px | **0** | `market.css` déclare 0 (troncature du texte) ; il était écrasé |
| `.kycar-market-zone-interactive` (compact) | `display` | `contents` (par contournement) | **`contents` (sans contournement)** | l'objet du constat |
| `.kycar-market-card-header` | `gap` | 4 px | **8 px** (`--space-2`) | `market.css` le déclare ; il était écrasé |
| `.kycar-market-card-header` | `display`, `min-height`, `min-width`, `justify-content`, `align-items` | inchangés | inchangés | le composant ne déclare pas les trois dernières ; le défaut s'applique toujours |
| `.kycar-market-zone-row1` | boîte | 99×16 (desktop), 242×16 (mobile) | identique | `align-items: center` reste au défaut, la rangée ne s'étire pas |
| barre d'histogramme (`<rect>`) | — | — | — | aucun effet, avant comme après |

Hauteurs rendues : zone-modèle desktop 68 → **64 px** (deux gouttières de 2 px au lieu de 4), zone
compacte **115 px** inchangée, en-tête de carte **32 px** (desktop) et **44 px** (mobile) inchangés.

### 8.2 Preuve — sondes

Aucune régression, donc aucun retour en arrière à consigner.

| Sonde | Résultat |
|---|---|
| `npx vitest run src/app src/screens --no-file-parallelism` | **244 / 244** |
| `npx vitest run --config vitest.review.config.ts tests/review/D6 tests/review/D8` | **297 / 297** (32 fichiers) |
| Playwright `-g "ACC-08"` (3 projets) | **5 passées, 1 ignorée** — `ACC-08` : 0 cible sous seuil sur 264 (large), 193 (intermédiaire), 120 (compact) ; `ACC-08bis` : **0 chevauchement** sur 180 zones (intermédiaire) et 144 (compact) |
| Playwright `tests/e2e/a11y.spec.ts` (8 surfaces × 3 projets) | **24 / 24**, 0 violation axe A/AA sur chaque surface |
| Playwright `-g "clavier\|EX-NFR-12\|EX-NFR-14"` | **27 / 27** |

`reports/e2e/results.json` a été restauré (`git checkout --`) après chaque exécution ; le port 4181
était libre avant chaque lancement et aucun `vite preview` ne subsiste.

---

## 9. Hors périmètre / pour le coordinateur

**(1) DÉFAUT LATENT DE LA MÊME FAMILLE QUE `C-R1-04`, NON CORRIGÉ, MESURÉ.** En relevant les styles
calculés j'ai constaté que **`.kycar-market-card-header` ne fait pas la hauteur qu'il déclare** :
`market.css:127` pose `min-height: 72px`, la règle de cible tactile d'`app.css` pose
`min-height: 32px` (44 px en compact) avec une spécificité **supérieure** (0-0-2-0 contre 0-0-1-0), et
c'est elle qui gagne. Mesuré sur le build de production : **32 px** en desktop 1280, **44 px** en
mobile 360, au lieu de 72 px. C'est le **même mécanisme** que `C-R1-04` — une règle globale qui bat la
feuille du composant — sur une autre propriété.

Je ne l'ai **pas** corrigé, délibérément, et je dis pourquoi : rendre les 72 px allongerait chaque
carte-marque de 40 px, ce qui déplace la virtualisation de l'écran A, le nombre de cartes visibles,
l'impression et les captures de recette — un changement de mise en page de cette ampleur, à la veille
de l'`acceptance` rev 3, n'est pas une « retouche mineure » et n'entre pas dans ma mission. **Décision
due** : soit `min-height: 72px` est la valeur voulue pour l'en-tête de carte (auquel cas la correction
est d'un caractère — passer ce `min-height` en `:where()` lui aussi, ou nommer l'en-tête — et elle est
à confier avec une passe de recette visuelle), soit le rendu actuel à 32/44 px est celui qui a été
validé en 2.10 et c'est `market.css:127` qui doit être corrigé pour ne plus mentir. Dans les deux cas,
une ligne `D3-nn` est due avant `G9`.

**(2) `additionalFuelTypes` — un écart de 64,80 erreurs-types, conforme au sens de `D3-27`.** Le
champ sort à 24,3 % relatifs pour une référence à un taux élevé et `n = 20 000` : la bande relative
domine largement la bande de 3 erreurs-types, et il est conforme. Il l'était déjà avant ce lot, sous
la seule règle relative — ce n'est pas une régression, et `D3-27` réécrite dit explicitement
`max(…)`. Mais un écart de 65 erreurs-types signifie que le calibrage de ce champ est **systématique**,
pas accidentel. À trancher par la spécification (une bande relative plus serrée pour les champs à
grand `n` ?), pas par ce lot ; je le nomme pour qu'il ne se perde pas.

**(3) Cohérence carrosserie ↔ portes/sièges, non traitée.** Le générateur tire `bodyType`,
`doorCount` et `seatCount` **indépendamment** dans le même segment. Le jeu porte donc déjà, avant ce
lot, des SUV `luxe` à deux portes (0,03 de `doorCount`) et des cabriolets `sportive` à cinq portes
(0,05). Mon changement déplace une partie de la masse de `sportive` vers les codes 6 et 1, où le
`doorCount` du segment (0,55 à deux portes, 0,40 à trois) reste tiré tel quel : une « berline
sportive » à deux portes est possible. Le remède serait de conditionner `doorCount` et `seatCount` à
`bodyType`, ce qui est une **refonte du générateur** (et un déplacement de plusieurs sondes), pas une
retouche. Aucune sonde ne le contraint aujourd'hui. J'ai choisi de **minimiser** la masse concernée
plutôt que de l'ignorer : `sportive` conserve **63 %** de codes 2 et 3, et les 15 % de code 1
(Citadine) sont précisément le cas où deux ou trois portes sont **cohérentes** (compacte sportive
trois portes). À consigner en dette si le commanditaire veut la cohérence stricte.

**(4) `data:baseline` doit être rejoué en dernière écriture.** Comme prévu par `D3-37`, les six
`baseline.json` de ce lot sont ceux de **mes** fixtures ; ils seront invalidés par la correction de
quantile de `fix-providers-3`. Le lien aux octets (`snapshotId` + `sha256`) est conforme aujourd'hui
(`data:baseline -- --check` vert aux deux profils), mais le coordinateur doit rejouer
`npm run data:baseline` sur l'arbre fusionné, comme dernière écriture sur `data/fixtures`.

**(5) Ordre de fusion.** Ce lot **régénère** les six `listings.ndjson.gz` : toute fusion ultérieure
qui touche `data/fixtures` entrera en conflit binaire. `D3-37` prévoit le lot mineur **en premier**,
ce qui est bien l'ordre à tenir.

**(6) `probes.json` passe de 110 à 111 sondes.** Les libellés « 110 sondes » ont été mis à jour dans
`DATASET-SPEC.md`, `DATASET-GEN.md`, `tests/data/harness.ts` et `tests/data/cross-findings.test.ts`.
Ils subsistent, à dessein, dans les **rapports** déjà rendus (`DATA-REVIEW.md`, `data-fix.md`) et dans
`docs/EXECUTION-LOG.md` : ce sont des documents historiques et le journal du coordinateur, hors de mon
périmètre.

---

## 10. Portes

Toutes rejouées depuis le worktree `/home/user/KYCAR-minor`, dans l'ordre demandé, après le dernier
commit.

| Porte | Commande | Sortie | Verdict |
|---|---|---|---|
| Build | `npm run build` | `tsc` app + worker + `vite build` — 0 erreur, 0 avertissement | ✅ |
| Lint | `npm run lint` | `eslint .`, code de sortie **0** | ✅ |
| Schéma des fixtures | `npm run data:validate -- --profile dev` | `RESULTAT : profil conforme` — budget gz 2 083 639 / 2 097 152 | ✅ |
| Schéma des fixtures | `npm run data:validate -- --profile test` | `RESULTAT : profil conforme` — budget gz 8 180 881 / 8 388 608 | ✅ |
| Contrôle latéral | `npm run data:check -- --profile dev` | **75 sondes, 0 écart**, 3 dettes (`P-23` EG-12, `P-57` EG-11, `P-58` EG-12) | ✅ |
| Contrôle latéral | `npm run data:check -- --profile test` | **75 sondes, 0 écart**, 3 dettes (`P-10`, `P-11` EG-01, `P-57` EG-11) | ✅ |
| Baseline | `npm run data:baseline -- --check` (dev et test) | `RESULTAT : artefacts conformes`, 6 snapshots | ✅ |
| Sondes de données | `npm run test:data` (dev) | **153 / 153** | ✅ |
| Sondes de données | `KYCAR_DATA_PROFILE=test npm run test:data` | **153 / 153** | ✅ |
| Contrat des providers | `npm run test:contract` | **93 / 93** — aucune sonde de contrat cassée par la régénération | ✅ |
| Unitaires du périmètre | `npx vitest run src/types src/app src/screens --no-file-parallelism` | **323 / 323** (79 + 244) | ✅ |
| Sondes de revue | `npx vitest run --config vitest.review.config.ts tests/review/D6 tests/review/D8` | **297 / 297** | ✅ |
| Recette ciblée | `KYCAR_E2E_PORT=4181 npx playwright test -g "ACC-08"` | 5 passées, 1 ignorée (large, par conception) | ✅ |
| Recette ciblée | `KYCAR_E2E_PORT=4181 npx playwright test tests/e2e/a11y.spec.ts` | **24 / 24** | ✅ |
| Recette ciblée | `KYCAR_E2E_PORT=4181 npx playwright test -g "clavier\|EX-NFR-12\|EX-NFR-14"` | **27 / 27** | ✅ |

`npm test` complet et la suite E2E complète n'ont **pas** été lancés, conformément à la mission : ils
reviennent au coordinateur après fusion.

---

## 11. Régénération

**Commandes.** `npm run data:gen -- --profile test` puis `--profile dev`, **une seule fois** pour
l'état livré (le profil `perf` n'est pas commité), puis `npm run data:baseline -- --profile test` et
`--profile dev`. Graine `1264141121` (`0x4B594341`) inchangée. Les régénérations de **contrôle** qui
ont servi à chiffrer la tension du §4.1 ont toutes été écrites dans un répertoire jetable
(`--out .exp-fixtures`), supprimé ; elles n'ont jamais touché `data/fixtures`.

| Profil | Snapshot | Lignes | `sha256` (octets non compressés, 16 premiers) | gz | brut |
|---|---|---:|---|---:|---:|
| dev | `be-20260907T060000Z` | 5 000 | `63d6fdf7ac7e8577` | 689 488 | 7 426 430 |
| dev | `be-20260914T060000Z` | 5 000 | `29c6520327b38049` | 695 977 | 7 420 828 |
| dev | `be-20260921T060000Z` | 5 000 | `d24020b4a3324cdc` | 698 174 | 7 421 244 |
| test | `be-20260907T060000Z` | 20 000 | `786b093ca664fa50` | 2 706 676 | 29 718 361 |
| test | `be-20260914T060000Z` | 20 000 | `253caad04859a53a` | 2 730 163 | 29 702 986 |
| test | `be-20260921T060000Z` | 20 000 | `d036fa39f403573d` | 2 744 042 | 29 710 934 |

**Budgets.**

| Profil | Total gz | Budget | Marge | avant ce lot |
|---|---:|---:|---:|---:|
| dev | **2 083 639** | 2 097 152 | 0,64 % | 2 083 390 |
| test | **8 180 881** | 8 388 608 | 2,48 % | 8 180 000 |

**Déterminisme.** Les deux profils ont été régénérés **une seconde fois** après la livraison et les
six `listings.ndjson.gz` sont **identiques octet à octet** (`md5sum -c`, 6/6 `OK`). `data:gen` efface
le contenu des répertoires de snapshot : `data:baseline` a donc été rejoué après ce contrôle, et
`git status` sur `data/fixtures` ne montre plus aucune suppression.

**Delta inter-snapshots**, profil `test` : S0→S1 2 090 entrées / 2 090 sorties / 3 056 révisions,
S1→S2 2 019 / 2 019 / 3 054 ; profil `dev` : 517 / 517 / 787 puis 530 / 530 / 748. Vérité terrain
**2 361** déclarations par snapshot au profil `test`, **591** au profil `dev`, 0 orpheline —
identiques à l'état d'avant le lot : **la régénération ne change que la carrosserie et ce qui en
dépend**.

**Delta de composition.** Carrosseries : table complète au §4.3 — seuls les codes 1, 2, 3 et 6
bougent, le total des quatre est conservé à 0,01 point près. Effectifs d'anomalies par code, profil
`test` S0, avant → après :

| code | avant | après | attendu sur base déclarée |
|---|---:|---:|---:|
| `PRICE_SENTINEL_ABSOLUTE` | 19 | 19 | 19,3 |
| `PRICE_OUT_OF_RANGE` | 4 | 4 | 3,9 |
| `SUSPECT_ZERO_MILEAGE` | 50 | 50 | 49,4 |
| `MILEAGE_IMPLAUSIBLE_FOR_AGE` | 60 | 60 | 60,0 |
| `MILEAGE_OUT_OF_RANGE` | 8 | 8 | 8,0 |
| `FIRST_REG_OUT_OF_RANGE` | 16 | 16 | 16,0 |
| `DUPLICATE_LISTING_ID` | 14 | 14 | 13,7 |
| `DUPLICATE_VALUE_CONFLICT` | 34 | 34 | 34,3 |
| `CROSS_SELLER_DUPLICATE` | 110 | 110 | 109,9 |
| `VERSION_FULLY_STRIPPED` | 80 | 80 | 80,0 |
| `VERSION_AMBIGUOUS` | 220 | 220 | 220,0 |
| `OUTLIER_M1_LOW/HIGH` | 48 | 48 | 48,2 |
| `OUTLIER_M2_LOW/HIGH` | 67 | 67 | 67,5 |
| `OTHER` | 400 | 400 | 400,0 |
| `POWER_OUT_OF_RANGE` | 12 | 12 | 12,0 |
| `POWER_UNIT_MISMATCH` | 12 | 12 | 11,5 |
| `CO2_ZERO_NON_BEV` | 23 | 23 | 22,8 |
| `HYBRID_INCONSISTENT` | 16 | 16 | 16,0 |
| `HYBRID_CATEGORY_UNRESOLVED` | 20 | 20 | 20,0 |
| `UNIT_UNSUPPORTED` | 90 | 90 | 90,0 |
| `REGION_UNRESOLVED` | 90 | 90 | 90,0 (`A-19` 10,0 + `A-21` 80,0) |
| `PRICE_ON_REQUEST_WITH_AMOUNT` | 8 | 8 | 7,9 |
| `MODEL_UNRESOLVED` | 240 | 240 | 240,0 |
| `PRICE_ON_REQUEST` | 600 | 600 | 600,0 |
| `PRICE_MISSING_UNDECLARED` | 120 | 120 | 120,0 |

**Aucun effectif d'anomalie ne bouge** : les taux et les bases sont inchangés (seule la *déclaration*
de la base d'`A-11` change), et la sélection des porteurs se fait par un hachage pur indépendant de la
carrosserie. C'est le contrôle croisé qui montre que la régénération est bien **bornée** au §4.

---

## 12. Fichiers touchés

| Fichier | Constat |
|---|---|
| `docs/data/dataset-spec/anomalies.json` | DR3-21 (`A-11.base`/`vivier`/`baseNote`, `baseVsVivier`) |
| `docs/data/dataset-spec/segments.json` | DR3-22 (`bodyTypeMapping`, `$comment`, `constatDR3_22`) |
| `docs/data/dataset-spec/probes.json` | DR3-22 (`P-24bis` neuve), DR3-23 (`P-72`), DR3-24 (`P-55`), EG-12 ×5, `count` 110 → 111 |
| `docs/data/DATASET-SPEC.md` | §0.1, §1.4, §2, §5, §6, §7, §9 |
| `docs/data/DATASET-GEN.md` | §5 (75 sondes, table des contrôles corrigés), EG-12, EG-21/22/23 |
| `tools/dataset/anomalies.mjs` | DR3-21 (`baseCount` exact) |
| `tools/dataset/check.mjs` | DR3-21, DR3-22 (`P-24bis`), DR3-23 (`P-72` par code), DR3-24 (`P-55`) |
| `tests/data/p72-anomalies.test.ts` | DR3-21 (`baseCount` exact, **D-31**) |
| `tests/data/p16-fuel-body.test.ts` | DR3-22 (`P-24bis` neuve) |
| `tests/data/p55-missingness.test.ts` | DR3-24 (tolérance, **D-31**, sortie d'`it.fails`) |
| `tests/data/cross-findings.test.ts`, `tests/data/harness.ts` | libellés 110 → 111 |
| `data/fixtures/{dev,test}/*/{listings.ndjson.gz,manifest.json,generation.json,baseline.json}` | régénération |
| `docs/requirements/draft-data-dictionary.md` | C-3.5-02 |
| `src/types/entities.ts` | C-3.5-05 |
| `src/app/app.css` | C-R1-04 (cause racine) |
| `src/screens/market/market.css` | C-R1-04 (contournement retiré) |
| `reports/data/data-fix-2.md` | ce rapport |
