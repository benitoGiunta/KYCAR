# ST-ambiguity — Chasse à l'ambiguïté (phase 2.2)

> **Agent** `st-ambiguity`, phase 2.2 de `PLAN-2-app-build.md` — rapport clos.
> Angle unique : quelle exigence admet **deux implémentations correctes et divergentes** ?
> Chaque constat porte ses deux lectures concurrentes et un exemple chiffré où elles diffèrent.

## Ce que ce rapport contient, et ce qu'il ne contient pas

**Angle unique** : les exigences qui admettent **deux implémentations correctes et divergentes**.
Ni les trous (`ST-complete.md`, 24 constats), ni les données pathologiques
(`ST-adversarial.md`, 18 constats). Chaque fiche porte obligatoirement **ses deux lectures** —
chacune défendable au regard du texte cité — et **un exemple chiffré commun** sur lequel les deux
lectures produisent des résultats différents. Une ambiguïté sans ces trois éléments n'a pas été
retenue.

**Barème appliqué** : BLOQUANT = les deux lectures affichent des **chiffres différents** à
l'utilisateur · MAJEUR = divergence interne qui casse un test ou la reproductibilité sans effet
visible immédiat · MINEUR = cosmétique.

**Recoupements assumés et signalés** : huit fiches touchent un point déjà relevé par un autre
agent sous un angle différent (AMB-03/ADV-06, AMB-09/périmètre écarté par `st-complete`,
AMB-15/T-01, AMB-16/T-03, AMB-20/ADV-03, AMB-25/T-07, AMB-31/T-16, AMB-33/T-02). Dans chacune,
la ligne **Recoupement** dit ce que l'angle ambiguïté ajoute. Aucun autre constat ne double un
point déjà compté.

**Corpus** : `REQUIREMENTS.md` v0.9 · `draft-data-dictionary.md` (A) · `draft-screens.md` (B) ·
`draft-behaviour.md` (C) · `ARBITRAGES-req-lead.md` · `data/reference/filters-scope.json` ·
`REF-filters.md` · `REF-vocabulary-reconciliation.md` · `00-CONTEXT.md`.
Aucune requête réseau. Aucun document d'exigences modifié.

---

## Tableau de synthèse

| # | Ambiguïté | Sévérité | Exigences en cause |
|---|---|---|---|
| AMB-01 | Arrondi du prix affiché : plancher ou plus proche ? | **BLOQUANT** | `EX-SCR-3` / `EX-DATA-6`, `64` |
| AMB-02 | Départage des ex æquo : collateur `fr-BE` ou point de code ? | **BLOQUANT** | `EX-SCR-119`, `121` / `EX-DATA-70`, `72` |
| AMB-03 | Paliers d'effectif : `n` = `N` ou `n_m` ? | **BLOQUANT** | `EX-SCR-33` / `EX-DATA-59`, `61`, `80` |
| AMB-04 | Au-delà de 40 marques : 20 cartes ou toutes ? | **BLOQUANT** | `EX-SCR-32`, `127` / `EX-SRCH-26` |
| AMB-05 | « Aucun filtre posé » : zéro paramètre ou zéro non injecté ? | **BLOQUANT** | `EX-SCR-125`, `126`, `27` |
| AMB-06 | Nuée : « graine fixée » ne fixe pas l'échantillon | MAJEUR | `EX-SCR-32` / `EX-DATA-82`, `94` |
| AMB-07 | Km arrondi à la centaine : fourchette qui exclut son max | MAJEUR | `EX-SCR-5` / `EX-DATA-64`, `67` |
| AMB-08 | Le bandeau de couverture non refermable est-il repliable ? | MAJEUR | `EX-SCR-38`, `31` / O9 |
| AMB-09 | Binning : Freedman-Diaconis ou `BIN(V, W, T, O)` ? | **BLOQUANT** | `EX-SCR-145`→`147` / `EX-DATA-75`, `77` |
| AMB-10 | Clic sur une barre : bucket `[lo, hi)` dans un filtre inclusif | **BLOQUANT** | `EX-SCR-149` / `EX-DATA-76` / `EX-NAV-7` |
| AMB-11 | Intervalle inversé : bornes permutées ou filtre refusé ? | **BLOQUANT** | `EX-NAV-22` / `EX-SCR-68` / A-04 |
| AMB-12 | Valeur hors domaine : ramenée à la borne ou retirée ? | **BLOQUANT** | `EX-NAV-21` / `EX-SCR-68` / A-04 |
| AMB-13 | `Tout effacer` : défauts relevés ou absence de paramètre ? | **BLOQUANT** | `EX-SCR-77` / `EX-SRCH-18` |
| AMB-14 | Commutateurs d'assainissement : filtre ou exclusion métrique ? | **BLOQUANT** | `EX-SCR-95` / `EX-DATA-16`, `60` |
| AMB-15 | Portée des filtres sur `n_tot` (couverture d'échantillon) | MAJEUR | `EX-SCR-143`, `31` / glossaire § 2 |
| AMB-16 | `G8` : `ln(prix) ~ km/10⁴` ou `prix ~ ln(km)` ? | **BLOQUANT** | `EX-SCR-164` / `EX-DATA-90`, `92` |
| AMB-17 | Ordre de `G8` : écarts-types, euros ou pourcentage ? | MAJEUR | `EX-SCR-164`, `206` / `EX-DATA-94` |
| AMB-18 | `G10` : quintiles = bornes de quantile ou groupes de rang ? | MAJEUR | `EX-SCR-166` / `EX-DATA-62` |
| AMB-19 | `powerfrom` en ch : contre `powerHp` arrondi ou contre le kW ? | **BLOQUANT** | `EX-SCR-73`, `EX-SRCH-16` / `EX-DATA-36` |
| AMB-20 | A-05 : jusqu'où va le mot « toujours » ? | **BLOQUANT** | A-05 / `EX-SCR-18`, `145` / `EX-DATA-75` |
| AMB-21 | Fourchette robuste : `P10 – P90` ou `p05 – p95` ? | **BLOQUANT** | `EX-SCR-12`, `33` / A-05, `EX-DATA-69` |
| AMB-22 | Options de tri non par défaut : ni départage ni règle sur `null` | MAJEUR | `EX-SCR-120`, `119`, `206` |
| AMB-23 | Plus grand reste : départage des restes égaux | MAJEUR | `EX-SCR-11` |
| AMB-24 | Bascule log : le rapport compte-t-il les bins de débordement ? | MAJEUR | `EX-SCR-16` / `EX-DATA-79` |
| AMB-25 | A-06 : « 10 % de la médiane » — quand, sur quoi, dans quel ordre ? | **BLOQUANT** | A-06 / `EX-DATA-19`, `60`, `86` |
| AMB-26 | Écran D : `sel` est-il un filtre ou une restriction d'affichage ? | **BLOQUANT** | `EX-SCR-202`, `184` / A-07 / `EX-DATA-86` |
| AMB-27 | `fuel=B` sélectionne-t-il les hybrides essence (code `2`) ? | **BLOQUANT** | `EX-SRCH-11`, `EX-SCR-73`, `84` / PIÈGE 1 |
| AMB-28 | « Couverture » : deux rapports, même mot, même seuil de 80 % | MAJEUR | glossaire § 2 / `EX-DATA-17`, `61` / `EX-SCR-115` |
| AMB-29 | Validation avant ou après normalisation (seuil de 250 €) | MAJEUR | `EX-DATA-2`, champ 7, `EX-DATA-6` |
| AMB-30 | Cellule d'homogénéité quand l'année est inconnue | **BLOQUANT** | `EX-DATA-86`, `26` |
| AMB-31 | Export CSV : les annonces ou les agrégats ? | MAJEUR | `EX-SCR-187` / `EX-CRUD-14`→`17` |
| AMB-32 | Percentiles de performance : quelle définition, quel échantillon ? | MAJEUR | `EX-NFR-5`→`9` / `EX-DATA-62` |
| AMB-33 | « Retenu » = « exposé » ? Le badge `+ 92` en est le juge | **BLOQUANT** | A-01, `filters-scope.json` / `EX-SCR-82`, `83`, `91` |
| AMB-34 | Étiquette d'un bucket de débordement : quatre formes | MINEUR | `EX-DATA-79` / `EX-SCR-18`, `146`, `147` |
| AMB-35 | `min === max` : test sur valeurs brutes ou arrondies ? | MINEUR | `EX-SCR-4` / `EX-DATA-63` |
| AMB-36 | Budgets de troncature : « caractères » comptés comment ? | MINEUR | `EX-SCR-13` / `EX-DATA-7`, `29` |
| AMB-37 | Écran C : « union des périmètres » — union des populations ou des bornes ? | MAJEUR | `EX-SCR-195`, `194`, `200` / `EX-DATA-75` |

**Décompte : 20 BLOQUANT · 14 MAJEUR · 3 MINEUR — 37 constats.**
(Trois MAJEUR sont marqués « BLOQUANT sous condition » dans leur fiche : AMB-06, AMB-15, AMB-23.)

### Les cinq plus coûteuses, si rien n'est levé

1. **AMB-09** — deux histogrammes différents (17 barres de 2 000 € contre 32 barres de 1 000 €)
   pour la même sélection : c'est le graphe imposé n° 1 de l'écran imposé n° 2, et tout ce qui en
   découle (infobulles, clics, export) diverge avec lui.
2. **AMB-16** — le prix attendu de `G8` change de valeur **et le signe de l'écart s'inverse**
   (`−4,2 %` contre `+1,3 %` sur le même exemple) : le cœur de la valeur du produit rend deux
   verdicts opposés sur la même annonce.
3. **AMB-33** — « retenu » contre « exposé » : un badge affiché en permanence vaut 55, 64 ou 92,
   et le périmètre testé du livrable le plus littéralement demandé par le commanditaire (« tous les
   filtres ») n'est pas déterminé.
4. **AMB-10** + **AMB-11** + **AMB-12** — la mécanique d'intervalle : cliquer une barre de 87
   offres peut afficher 92 offres, une URL à intervalle inversé donne 1 281 ou 5 220 offres, et une
   borne hors domaine donne « aucune offre » ou 1 281. Trois portes d'entrée du même défaut :
   la sémantique des bornes n'est écrite nulle part.
5. **AMB-25** — la règle de sentinelle relative d'A-06 : selon l'ordre des opérations, la médiane
   publiée vaut 9 750 € ou 10 000 € et le minimum brut 900 € ou 9 000 €, sur un arbitrage dont le
   texte fait deux lignes.

---

## Fiches

### AMB-01 — Arrondi du prix affiché : plancher (`Math.floor`) ou plus proche ?

- **Sévérité** : BLOQUANT
- **Exigence visée** : `EX-SCR-3` — « **Prix.** Format `<entier> €`, arrondi à l'euro par
  troncature vers le bas (`Math.floor`) » — contre `EX-DATA-6` — « L'arrondi de tout décimal est
  **arrondi au plus proche, demi vers l'infini en valeur absolue** (`round-half-away-from-zero`) »
  — et `EX-DATA-64`, dont la quatrième colonne s'intitule littéralement **« Arrondi de
  présentation »** et vaut, pour la médiane de prix, « prix : euro entier ».
- **Lecture 1** : l'arrondi de présentation est défini par l'annexe A, seule autorité sur la
  « définition mathématique » (A-09), et `EX-DATA-6` dit « tout décimal », sans exception ;
  `EX-SCR-3` ne décrit alors que le gabarit typographique (espace insécable, symbole, pas de
  décimale). Médiane `Q(V, 0,50) = 12 500,50 €` → affiché **`12 501 €`**.
- **Lecture 2** : A-09 donne à l'annexe B l'autorité sur le « contenu affiché » ; `EX-SCR-3`
  nomme une implémentation précise (`Math.floor`), ce qui n'est pas un gabarit mais une règle de
  calcul, et elle est plus spécifique que la règle générale d'`EX-DATA-6`. Même médiane
  `12 500,50 €` → affiché **`12 500 €`**.
- **Divergence** : 1 € d'écart sur **toute** statistique interpolée, donc sur la médiane et les
  quartiles de chaque carte-marque, de chaque zone-modèle et de l'en-tête de l'écran B. Exemple
  complet : `V_price = {12 000, 12 500, 12 501, 13 000}` → `Q(V, 0,50) = 12 500,5` → lecture 1
  affiche `méd. 12 501 €`, lecture 2 affiche `méd. 12 500 €`. L'écart n'apparaît qu'au demi-euro,
  donc il est invisible en relecture et bien réel en production (une statistique interpolée sur
  deux quand `n` est pair) ; l'export CSV divergera de l'écran si l'export suit l'annexe A. La
  justification même d'`EX-DATA-6` (« deux implémentations correctes doivent produire le même
  chiffre au centime ») est annulée par `EX-SCR-3`.
- **Levée proposée** : réécrire `EX-SCR-3` en « arrondi à l'euro **selon `EX-DATA-6`** (au plus
  proche, demi vers l'infini) ; `Math.floor` est interdit », et ajouter dans `EX-DATA-64` la
  mention « cet arrondi est celui d'`EX-DATA-6` et prime sur toute règle de format d'écran ».
  Traiter identiquement `EX-SCR-5` (voir AMB-07).

### AMB-02 — Départage des ex æquo au tri : collateur `fr-BE` ou point de code Unicode ?

- **Sévérité** : BLOQUANT
- **Exigence visée** : `EX-SCR-119` — « Égalité tranchée par ordre alphabétique croissant avec
  `Intl.Collator('fr-BE', { sensitivity: 'base', numeric: true })` — de sorte que `Škoda` se
  classe avec `Skoda` » — contre `EX-DATA-70` — « égalités départagées par `makeName` croissant en
  comparaison **point de code Unicode** sur le libellé normalisé NFC passé en majuscules […] une
  comparaison sensible à la locale classerait `Škoda` avant ou après `Suzuki` selon la machine ».
- **Lecture 1** : le départage est une règle d'ordre et de normalisation, domaine de l'annexe A
  (A-09) ; `EX-SCR-119` exprime l'intention, `EX-DATA-70` la mécanique. Deux marques à **412
  offres** chacune, `Suzuki` et `Škoda` : majuscules NFC → `SUZUKI` et `ŠKODA`, premiers points de
  code `U+0053` contre `U+0160` → **`Suzuki` s'affiche avant `Škoda`**.
- **Lecture 2** : l'ordre d'affichage des cartes relève de la « disposition », domaine de
  l'annexe B (A-09), et `EX-SCR-119` est le seul texte à porter l'exigence produit (`Škoda` avec
  `Skoda`). Mêmes deux marques à 412 offres : `sensitivity: 'base'` replie `Š` sur `S` → `SKODA`
  avant `SUZUKI` → **`Škoda` s'affiche avant `Suzuki`**.
- **Divergence** : deux cartes-marques permutées sur la grille de l'écran A, et le champ `rank`
  d'`EX-DATA-68` — publié, exporté, et utilisé par l'écran pour décider quelles marques entrent
  dans les 20 premières — prend deux valeurs différentes pour la même marque. Le cas n'est pas
  théorique (`Škoda`, `Citroën`, `Cupra`, `SsangYong`, et les libellés `Série 3` / `Série 30` via
  `numeric: true`), et l'ordre d'`Intl.Collator` dépend de la version d'ICU du navigateur : la
  lecture 2 n'est donc pas stable entre deux postes, ce que la justification d'`EX-DATA-70`
  cherchait explicitement à empêcher.
- **Levée proposée** : une seule règle, dans l'annexe A, et un renvoi depuis `EX-SCR-119`. Si
  l'exigence produit « `Škoda` avec `Skoda` » est retenue, la spécifier de façon déterministe et
  indépendante de la plateforme : `NFD` → suppression des diacritiques `U+0300–U+036F` →
  majuscules → comparaison point de code ; jamais `Intl.Collator`. Étendre la règle à
  `EX-SCR-121` (modèles) en y inscrivant le placement en dernier de la clé `modelId = 0` exigé par
  `EX-DATA-72` et qu'`EX-SCR-121` ne mentionne pas.

### AMB-03 — `EX-SCR-33` : les paliers d'effectif comptent quoi ?

- **Sévérité** : BLOQUANT
- **Exigence visée** : `EX-SCR-33` — « `ET-EFFECTIF-FAIBLE` — effectif insuffisant pour une
  statistique. Trois paliers, appliqués uniformément : `n = 0` → … ; `1 ≤ n ≤ 4` → … ;
  `5 ≤ n ≤ 9` → … Au-delà de `n ≥ 10`, tout est calculé. **Ces seuils sont uniques pour toute
  l'application** ». Le symbole `n` n'y est défini nulle part.
- **Lecture 1** : `n` est l'effectif de la sélection, `N = |Σ|` d'`EX-DATA-59` — le chiffre déjà
  affiché à côté du nom du modèle. Zone-modèle de **20 offres** dont 14 à prix sur demande et 2
  marquées `SUSPECT_PRICE_FLOOR` : `N = 20 ≥ 10` → **médiane, quartiles et fourchette affichés**,
  calculés sur 4 valeurs.
- **Lecture 2** : `n` est l'effectif valide de la métrique, `n_m(Σ)` d'`EX-DATA-59`, comme dans
  `EX-DATA-61` (« toute statistique publiée est accompagnée de … son effectif `n_m` ») et dans le
  `lowConfidence: (n < 12)` d'`EX-DATA-80` où `n = |V|`. Même zone-modèle :
  `n_price = 20 − 14 − 2 = 4` → palier `1 ≤ n ≤ 4` → **aucune médiane, aucun percentile**, la
  mention `n trop faible` à la place.
- **Divergence** : la même zone-modèle affiche `méd. 17 400 €` dans une lecture et `n trop faible`
  dans l'autre, et la ligne 2 de la zone (`EX-SCR-113` § 4) porte une fourchette de prix ou rien.
  C'est le chiffre le plus regardé de l'écran A. Le même `n` sert de seuil au « jeton ambre
  `n = 7` accolé au titre du graphe », donc la divergence se propage aux trois histogrammes
  imposés de l'écran B.
- **Recoupement** : `st-adversarial` (ADV-06) attaque la **valeur** du seuil (`n ≥ 10` promet
  « tout est calculé » alors que M1 exige 12 et M2 30). Angle non traité par lui : même seuils
  corrigés, le **dénominateur** reste indéterminé, et c'est lui qui décide si la médiane
  s'affiche.
- **Levée proposée** : préfixer `EX-SCR-33` par « `n` désigne ici `n_m(Σ)` au sens d'`EX-DATA-59`
  pour la métrique de la statistique concernée, jamais `N` ; l'effectif de sélection `N` n'est
  soumis à aucun palier », puis aligner les bornes des paliers sur 12 (M1) et 30 (M2).

### AMB-04 — Au-delà de 40 marques : 20 cartes ou toutes les cartes ?

- **Sévérité** : BLOQUANT
- **Exigence visée** : `EX-SCR-32` — « `ET-TROP-RESULTATS` […] Seuils : écran A, **plus de 40
  marques à afficher** […] Un bandeau informatif indique `<n> marques correspondent — 20
  affichées, triées par nombre d'offres` […] Le bandeau porte le bouton `Tout afficher` qui active
  le rendu virtualisé » — contre `EX-SCR-127` — « **Au-delà de 40 cartes**, la grille est
  virtualisée : au plus 12 cartes montées simultanément » — et `EX-SRCH-26` — « Si le mode 1 […]
  renvoie **plus de 60 marques** avec au moins un résultat, un bandeau non bloquant s'affiche ».
- **Lecture 1** : au-delà de 40 marques, le rendu est plafonné à 20 cartes jusqu'au clic sur
  `Tout afficher` ; `EX-SCR-127` décrit ce qui se passe **après** ce clic et `EX-SRCH-26` est un
  second bandeau, plus tardif. Sélection de **50 marques** → **20 cartes affichées** + bandeau
  `50 marques correspondent — 20 affichées`.
- **Lecture 2** : le plafond de 20 est propre au cas « aucun filtre posé » d'`EX-SCR-125`, seul
  endroit où le nombre 20 est justifié ; au-delà de 40 cartes la grille se virtualise d'elle-même
  (`EX-SCR-127`) et le seul avertissement dû à 50 marques serait celui d'`EX-SRCH-26`, qui ne se
  déclenche qu'à 60. Même sélection de 50 marques → **50 cartes affichées, aucun bandeau**.
- **Divergence** : 20 cartes contre 50, bandeau présent contre absent, pour la même sélection.
  Trois seuils (20, 40, 60) et deux libellés de bandeau coexistent pour un seul phénomène ; deux
  implémentations conformes ne montrent pas la même page, et l'écart n'est pas cosmétique
  puisqu'il détermine si une marque figure ou non à l'écran.
- **Levée proposée** : une table unique des seuils de l'écran A : `> 40 marques` →
  virtualisation, **sans plafonnement du nombre de cartes** ; `> 60 marques` → bandeau
  `EX-SRCH-26` ; plafond de 20 cartes **réservé** au cas sans filtre d'`EX-SCR-125`. Supprimer de
  `EX-SCR-32` la mention « 20 affichées » pour l'écran A, ou lui donner son propre seuil nommé.

### AMB-05 — « Aucun filtre posé » : zéro paramètre, ou zéro paramètre non injecté ?

- **Sévérité** : BLOQUANT
- **Exigence visée** : `EX-SCR-125` — « **Cas « aucun filtre posé ».** L'écran ne rend pas 295
  cartes […] La grille affiche les **20 premières marques** » et `EX-SCR-27` —
  « `ET-VIDE-SANS-FILTRE` — zéro résultat, **aucun filtre posé**. Traité comme une **panne**, pas
  comme un résultat » — contre `EX-SCR-126`, qui trace une autre frontière : « Le bloc d'amorce
  disparaît dès qu'au moins un filtre **autre que** `atype`, `cy`, `ustate`, `sort`, `desc`,
  `powertype` et `pricetype` est posé — c'est-à-dire dès qu'un filtre **non injecté par défaut**
  est actif ».
- **Lecture 1** (littérale) : « aucun filtre posé » = l'URL ne porte aucun paramètre de filtre.
  URL `/marche?atype=C&cy=B&powertype=kw` (les paramètres qu'AutoScout24 injecte
  systématiquement) → un filtre **est** posé → `EX-SCR-125` ne s'applique pas → la grille rend
  les **295 cartes** (virtualisées), et un résultat vide s'affiche en `ET-VIDE-FILTRES`
  (« élargissez vos critères »).
- **Lecture 2** (alignée sur `EX-SCR-126`) : ces paramètres sont « injectés par défaut », donc
  l'état est bien « sans filtre ». Même URL → **20 cartes** + bloc d'amorce + bandeau
  `295 marques dans le snapshot — 20 affichées`, et un résultat vide s'affiche en
  `ET-VIDE-SANS-FILTRE`, soit **`Aucune donnée disponible` + bouton `Réessayer`** : un écran de
  panne.
- **Divergence** : 20 cartes contre 295 ; et sur une sélection vide, un écran qui affirme une
  panne technique contre un écran qui affirme un résultat vide légitime. Le diagnostic présenté à
  l'utilisateur s'inverse, alors qu'`EX-SCR-27` le justifie par « un marché national ne peut pas
  être vide ; l'origine est nécessairement technique » — raisonnement faux si `cy=B` compte comme
  « sans filtre » et que le snapshot ne contient aucune annonce belge.
- **Levée proposée** : définir une fois, dans les conventions transverses de l'annexe B, l'état
  `SANS-FILTRE` = « aucun paramètre de filtre hors la liste des paramètres injectés par défaut
  (`atype`, `cy`, `ustate`, `sort`, `desc`, `powertype`, `pricetype`) », puis référencer cet état
  par son nom dans `EX-SCR-27`, `EX-SCR-125` et `EX-SCR-126`.

### AMB-06 — Échantillon d'affichage de la nuée : « graine fixée » ne fixe pas l'échantillon

- **Sévérité** : MAJEUR (BLOQUANT si la nuée ou sa table équivalente affiche un compteur
  d'outliers)
- **Exigence visée** : `EX-SCR-32` — « écran B, plus de 20 000 annonces individuelles à tracer
  […] `<n> annonces — la nuée affiche un **échantillon aléatoire de 20 000 points (graine
  fixée)**` ». Ni la graine, ni l'algorithme de tirage, ni l'ordre sur lequel il opère ne sont
  spécifiés.
- **Lecture 1** : graine = constante littérale du code (p. ex. `42`), tirage par mélange de
  Fisher-Yates sur la sélection **ordonnée par `listingId` croissant** (le seul ordre total
  déterministe que l'annexe A définit, `EX-DATA-94`), puis les 20 000 premiers.
- **Lecture 2** : graine = `selectionHash` (champ que porte déjà `DistributionBucket`,
  `EX-DATA-83`), tirage par réservoir dans l'**ordre d'ingestion** — lecture au moins aussi
  défendable, puisqu'elle rend l'échantillon stable pour une sélection donnée tout en restant
  « aléatoire à graine fixée ».
- **Divergence, même jeu** : sélection de **40 000** annonces dont **12** portent
  `LOW_PRICE_MODEL`. Les deux lectures tracent 20 000 points et retiennent en espérance 6 de ces
  12 outliers — mais pas les mêmes, et pas en même nombre (tirage hypergéométrique, écart-type
  ≈ 1,2 : typiquement 4 d'un côté, 8 de l'autre). L'annonce que l'utilisateur cherche est
  présente ou absente sans qu'aucune règle écrite tranche ; la table d'accessibilité équivalente
  (`EX-NFR-15`, « tableau des points sous-jacents ») liste deux contenus différents ; et aucun
  test du lot D4 ne peut être écrit contre cette exigence.
- **Levée proposée** : inscrire dans l'annexe A (autorité sur la définition mathématique) une
  fonction `SAMPLE(V, k, seed)` : ordre total par `listingId` croissant, générateur nommé et
  spécifié (p. ex. `xoshiro128**` initialisé par une graine constante inscrite dans l'exigence),
  mélange de Fisher-Yates descendant, `k` premiers ; et exiger la même propriété de déterminisme
  qu'`EX-DATA-82` — deux permutations de l'entrée produisent le même échantillon.

### AMB-07 — Arrondi du kilométrage à la centaine : la fourchette affichée peut exclure le maximum observé

- **Sévérité** : MAJEUR
- **Exigence visée** : `EX-SCR-5` — « **Kilométrage.** Format `<entier> km`, arrondi à la
  **centaine la plus proche** au-dessus de 10 000 km, à l'unité en dessous […] Fourchette :
  `12 000 – 210 000 km` » — à confronter à `EX-DATA-64` (« km : entier », donc sans arrondi à la
  centaine) et à `EX-DATA-67`, qui pose pour l'année le principe inverse : « la borne basse
  affichée est son **plancher**, la borne haute son **plafond** […] plancher-plafond garantit que
  la fourchette affichée contient tous les millésimes retenus ».
- **Lecture 1** : l'arrondi à la centaine la plus proche s'applique à toute valeur de kilométrage,
  bornes de fourchette incluses. Échantillon de `min = 10 049 km` et `max = 210 049 km` → affiché
  **`10 000 – 210 000 km`**.
- **Lecture 2** : le principe d'`EX-DATA-67` (annexe A, autorité sur la définition) s'étend aux
  bornes de kilométrage, sans quoi la fourchette affichée n'est pas un majorant des valeurs
  observées : plancher de centaine en bas, plafond de centaine en haut → affiché
  **`10 000 – 210 100 km`**.
- **Divergence** : 100 km sur la borne haute, et surtout un invariant rompu dans la lecture 1 — le
  véhicule le plus roulé de la sélection (210 049 km) tombe **hors** de la fourchette annoncée, et
  un utilisateur qui pose `kmto=210000` pour retrouver « tout ce qui est affiché » perd une
  annonce. Un kilométrage sur deux se situe dans la moitié haute de sa centaine : le cas est
  courant, pas limite.
- **Levée proposée** : ajouter à `EX-SCR-5` : « les **bornes de fourchette** ne suivent pas
  l'arrondi à la centaine la plus proche : borne basse au plancher de centaine, borne haute au
  plafond (même principe qu'`EX-DATA-67`). L'arrondi à la centaine la plus proche est réservé aux
  valeurs unitaires (kilométrage d'une annonce) ».

### AMB-08 — `EX-SCR-38` : le bandeau de couverture non refermable est-il repliable ?

- **Sévérité** : MAJEUR
- **Exigence visée** : `EX-SCR-38` — « Au plus **deux** bandeaux simultanés, empilés dans cet
  ordre […] `ET-ERREUR-PROVIDER` > `ET-HORS-LIGNE` > `ET-PARTIEL-CACHE` > `ET-TROP-RESULTATS` >
  `C3 couverture`. **Les suivants sont repliés** derrière un jeton `+2 avertissements` » — contre
  `EX-SCR-31` (« Ce bandeau est **non refermable** lorsque `p < 20` ») et le point ouvert O9 de
  `REQUIREMENTS.md` (« L'avertissement est **non refermable** sur l'écran B »).
- **Lecture 1** : `C3` est le dernier de l'ordre de priorité ; dès que deux bandeaux plus
  prioritaires sont présents, il passe derrière le jeton. État `ET-HORS-LIGNE` +
  `ET-PARTIEL-CACHE` + couverture `p = 8 %` → **deux bandeaux visibles, l'avertissement de
  couverture caché** derrière `+1 avertissement`.
- **Lecture 2** : « non refermable » est une exigence plus forte que la priorité d'affichage — un
  avertissement que l'utilisateur ne peut pas fermer ne peut pas non plus être replié par le
  système ; `C3` est exempté du plafond, qui s'applique aux quatre autres. Même état → **trois
  bandeaux visibles**.
- **Divergence** : l'unique garde-fou du point ouvert O9, qualifié de « verrou du parcours 2 »,
  est visible ou invisible précisément dans le cas où il compte le plus — un provider en échec ou
  un cache périmé accompagnant un échantillon couvrant 8 % de la population. Le plafond de hauteur
  de 96 px rend en outre la lecture 2 dépendante d'un débordement non spécifié.
- **Levée proposée** : ajouter à `EX-SCR-38` : « `C3 couverture` avec `p < 20` n'est **jamais**
  replié et ne compte pas dans le plafond de deux bandeaux ; il s'affiche alors en troisième
  position, la hauteur maximale de la zone passant à 144 px ». Et marquer, pour chacun des cinq
  bandeaux, s'il est repliable.
### AMB-09 — Règle de découpage des histogrammes : Freedman-Diaconis ou `BIN(V, W, T, O)` ?

- **Sévérité** : BLOQUANT
- **Exigence visée** : `EX-SCR-145` — « `G1` — Offres par prix […] bornes P1–P99 (`EX-SCR-18`),
  buckets de largeur égale calculée par la **règle de Freedman-Diaconis** puis arrondie au
  **multiple de 500 € le plus proche**, avec un minimum de 8 et un maximum de 40 buckets » —
  contre `EX-DATA-75` — « Les trois histogrammes (prix, kilométrage, année) sont produits par
  **une seule** fonction `BIN(V, W, T, O)` […] **Toute autre règle de découpage est interdite** »
  — et `EX-DATA-77`, qui fixe `W = {100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000,
  25000, 50000}`, `T = 24`, `O = 0`.
- **Lecture 1** : l'annexe A fait foi sur « la définition des buckets » (A-09, ligne 1), donc
  `BIN` s'applique et `EX-SCR-145` ne décrit que l'habillage (axes, étiquettes, couleur).
  Sur l'exemple même de l'annexe B (`EX-SCR-142` : Corsa, `n = 1 281`, `P25 = 9 900 €`,
  `P75 = 16 400 €`), avec `a = Q(0,01) = 2 500 €` et `b = Q(0,99) = 34 000 €` :
  `raw = (34 000 − 2 500)/24 = 1 312,5` → plus petit `u ∈ W` tel que `u ≥ raw` → **`w = 2 000 €`**,
  `kLo = ⌊2 500/2 000⌋ = 1`, `kHi = ⌊34 000/2 000⌋ = 17` → **17 barres**, bornes alignées sur les
  multiples de 2 000 € ; l'annonce à 12 900 € tombe dans le bucket **`[12 000, 14 000)`**.
- **Lecture 2** : `EX-SCR-145` est l'exigence propre au graphe `G1` de l'écran B, plus spécifique,
  et l'annexe B fait foi sur les « encodages graphiques » (A-09, ligne 2). Même échantillon :
  `IQR = 16 400 − 9 900 = 6 500`, `n^{1/3} = 10,86` → Freedman-Diaconis
  `w = 2·6 500/10,86 = 1 197 €` → arrondi au multiple de 500 le plus proche → **`w = 1 000 €`**,
  de 2 500 € à 34 000 € → **32 barres**, bornes en `…, 12 500, 13 500, …` ; la même annonce à
  12 900 € tombe dans le bucket **`[12 500, 13 500)`**.
- **Divergence** : 17 barres contre 32 ; largeur affichée 2 000 € contre 1 000 € ; effectif et part
  en pourcentage de chaque barre différents ; bornes de bucket différentes, donc l'infobulle
  (`EX-SCR-149`) annonce un autre intervalle, et le clic sur la barre pose un autre filtre
  (`pricefrom=12000&priceto=14000` contre `pricefrom=12500&priceto=13500`), donc une autre page.
  L'entité `DistributionBucket` exportée en CSV (`EX-CRUD-16` : « une ligne par bucket ») diverge
  aussi. Le même conflit se rejoue sur `G2` (multiple de 5 000 km, max 30 buckets contre
  `W` kilométrage et `T = 24`) et sur `G3`, où `EX-SCR-147` supprime la troncature P1/P99 et
  regroupe « avant `<AAAA>` » au-delà de 30 ans, là où `EX-DATA-75` écrête à `Q(0,01)`/`Q(0,99)`
  et émet un bin de débordement : pour un modèle offrant une ancêtre de 1968 et 20 millésimes
  2006-2025, l'annexe A donne 20 bins fermés + 1 bin `(−∞, 2006)`, l'annexe B donne 30 bins +
  un bucket `avant 1996`.
- **Recoupement** : `st-complete` a explicitement **écarté** de son périmètre « les divergences de
  valeur entre annexes (seuils de buckets…) » comme n'étant pas des absences. Angle apporté ici :
  ce n'est pas une divergence de valeur mais une **indétermination de la règle applicable** — la
  grille d'autorité A-09 désigne l'annexe A pour « buckets » et l'annexe B pour les « encodages
  graphiques », et un histogramme est les deux à la fois. Aucune des deux lectures n'est
  fautive au regard des textes.
- **Levée proposée** : supprimer d'`EX-SCR-145` à `EX-SCR-147` toute règle de largeur et de borne,
  et les remplacer par « buckets produits par `BIN(V, W, T, O)` selon `EX-DATA-75`/`EX-DATA-77` ;
  cette exigence ne décrit que l'habillage ». Si le produit veut la règle de Freedman-Diaconis ou
  l'absence de troncature sur l'année, la porter dans l'annexe A en modifiant `EX-DATA-77`, et
  nulle part ailleurs.

### AMB-10 — Clic sur une barre : un bucket semi-ouvert posé dans un filtre inclusif

- **Sévérité** : BLOQUANT
- **Exigence visée** : `EX-SCR-149` — « **Clic sur une barre** → pose le filtre d'intervalle
  correspondant au bucket (`pricefrom`/`priceto`, `kmfrom`/`kmto`, `fregfrom`/`fregto`), donc
  recalcule toute la page » — croisé avec `EX-DATA-76` — « Tout bin fermé est l'intervalle
  **semi-ouvert à droite** `[lo, hi)` » — et `EX-NAV-7`, qui ne donne la sémantique **que** de la
  borne basse : « `pricefrom=5000` seul signifie « prix ≥ 5000, sans plafond » ». La borne haute
  n'est définie nulle part, ni ici, ni dans `REF-filters.md` (fiches `pricefrom`/`priceto` :
  domaine et paliers, aucune sémantique d'inclusion).
- **Lecture 1** : le filtre reprend les deux bornes du bucket telles quelles et `priceto` est
  inclusif, par symétrie avec `pricefrom`. Bucket `[12 000, 14 000)` affichant **87 offres**, la
  sélection contenant par ailleurs **5 annonces à exactement 14 000 €** → filtre posé
  `pricefrom=12000&priceto=14000` → l'en-tête affiche **92 offres**.
- **Lecture 2** : le filtre doit reproduire le bucket, donc la borne haute est exclusive (ou posée
  à `hi − 1`, soit `priceto=13999`), sans quoi le clic ne sélectionne pas ce que la barre montrait
  → l'en-tête affiche **87 offres**.
- **Divergence** : l'utilisateur clique une barre étiquetée « 87 offres » et la page se recalcule à
  92 offres, ou à 87, selon l'implémentation. Le défaut est auto-vérifiant et visible en un geste,
  c'est le geste central du parcours 2. Il se reproduit à l'identique sur le brossage horizontal
  (« pose l'intervalle de la plage brossée, arrondi aux bornes de bucket ») et sur le `Ctrl` +
  clic (« l'intervalle posé est le plus petit englobant »), ainsi que sur `fregfrom`/`fregto`, où
  la question se double de la granularité : `fregto=2017` signifie-t-il `firstRegistrationYear
  ≤ 2017` ou `firstRegistrationYearMonth ≤ 2017-01` ? Sur un modèle dont 63 annonces sont
  immatriculées en 2017, la seconde lecture n'en retient que celles de janvier.
- **Levée proposée** : deux ajouts. (1) Dans `EX-NAV-7` : « les deux bornes d'un intervalle sont
  **inclusives** : `pricefrom=a&priceto=b` sélectionne `a ≤ x ≤ b` ; pour un filtre d'année,
  la comparaison porte sur `firstRegistrationYear`, jamais sur `firstRegistrationYearMonth` ».
  (2) Dans `EX-SCR-149` : « le filtre posé par un clic sur le bucket `[lo, hi)` est
  `<x>from = lo` et `<x>to = hi − 1` dans l'unité canonique du champ, afin que l'effectif après
  clic soit exactement celui de la barre cliquée ; un test de recette vérifie cette égalité ».

### AMB-11 — Intervalle inversé : bornes permutées ou filtre refusé ?

- **Sévérité** : BLOQUANT
- **Exigence visée** : `EX-NAV-22` — « Intervalle inversé (`pricefrom > priceto`, ou tout autre
  couple from/to) : les deux bornes sont **échangées automatiquement** au chargement, une notice
  inline transitoire indique « valeurs de l'intervalle interverties » ; l'URL est corrigée par
  `replaceState` » — contre `EX-SCR-68` — « Si `from > to` […] le filtre **n'est pas appliqué** ;
  l'ancienne valeur reste en vigueur. **Aucune permutation automatique des bornes** : elle
  masquerait une faute de frappe ».
- **Lecture 1** (deux domaines, deux règles) : `EX-NAV-22` régit l'arrivée par URL (domaine de
  l'annexe C : « mécanique de navigation, encodage d'URL ») et `EX-SCR-68` la saisie au clavier
  dans le contrôle (domaine de l'annexe B). Ouverture du lien
  `/marche?pricefrom=25000&priceto=5000` → bornes permutées → sélection `5 000 ≤ prix ≤ 25 000`
  → **1 281 offres**, et le bandeau affiche le jeton `5 000 – 25 000 €`.
- **Lecture 2** (une règle, la plus spécifique) : `EX-SCR-68` est explicite, motivé, et l'arbitrage
  A-04 ne mentionne que « valeur hors domaine ou intervalle inversé » sans trancher le mécanisme ;
  le refus s'applique donc aussi au chargement. Même lien → filtre non appliqué → aucune borne de
  prix → **5 220 offres** (l'effectif Opel Belgique complet), avec deux champs en bordure rouge.
- **Divergence** : 1 281 offres contre 5 220 pour la même URL, deux histogrammes différents, deux
  fourchettes différentes, et un jeton de filtre présent contre absent. Un lien partagé — le
  mécanisme central de partageabilité d'`EX-NAV-18` — ne restitue pas le même écran selon
  l'implémentation. La justification des deux textes est symétriquement défendable (« ne pas
  casser un lien » contre « ne pas masquer une faute de frappe »), ce qui est exactement le
  signe qu'aucune des deux lectures n'est fautive.
- **Levée proposée** : trancher dans A-04 et n'écrire la règle qu'une fois : soit « permutation au
  chargement d'URL **et** refus en saisie interactive, les deux comportements étant nommés et
  justifiés séparément », soit un seul comportement pour les deux chemins. Dans les deux cas,
  supprimer la phrase contradictoire de l'autre annexe et y mettre un renvoi.

### AMB-12 — Valeur numérique hors domaine : ramenée à la borne ou retirée ?

- **Sévérité** : BLOQUANT
- **Exigence visée** : `EX-SCR-68` — « Si `from` ou `to` sort du domaine relevé (par exemple une
  année < 1900 ou > 2027 pour `modelyearfrom`), la valeur est **ramenée à la borne du domaine** et
  un message `Ramené à <valeur>` s'affiche pendant 4 s » — contre `EX-NAV-21` — « Valeur de filtre
  hors domaine […] la valeur inconnue est **retirée silencieusement** de l'état de filtre au
  chargement, l'URL est corrigée par `replaceState` […] le reste de la requête s'applique
  normalement » — et A-04, qui ajoute « la correction doit rester permissive mais **visible** ».
- **Lecture 1** : `EX-NAV-21` ne parle que de vocabulaire énuméré (son exemple est `fuel=Z`) ;
  pour une borne numérique, `EX-SCR-68` s'applique et **écrête au domaine relevé**
  (`REF-filters.md` : `pricefrom` min 500, max 100 000). URL `?pricefrom=250000` →
  `pricefrom` ramené à **100 000 €** → sur l'Opel Corsa belge, **aucune annonce** ne dépasse ce
  seuil → l'écran affiche `aucune offre` et le bandeau `Ramené à 100 000`.
- **Lecture 2** : `EX-NAV-21` dit « valeur de filtre hors domaine », sans restriction aux
  énumérations, et l'écrêtage n'y figure pas ; la valeur est donc **retirée**. Même URL →
  plus de plancher de prix → **1 281 offres**, aucun message (ou un bandeau A-04, lui-même en
  contradiction avec le mot « silencieusement »).
- **Divergence** : `aucune offre` contre `1 281 offres` pour la même URL. Les deux lectures sont
  par ailleurs contradictoires sur la visibilité : `EX-NAV-21` dit « silencieusement », A-04 exige
  un bandeau nommant le paramètre et la valeur retenue, `EX-SCR-68` un message de 4 secondes —
  trois régimes pour un seul événement.
- **Levée proposée** : une table unique des corrections d'URL (annexe C), une ligne par classe de
  défaut : code énuméré inconnu → retrait ; borne numérique hors domaine → écrêtage à la borne ;
  intervalle inversé → voir AMB-11 ; chaîne vide → retrait. Chaque ligne porte la même colonne
  « signalement », renseignée conformément à A-04 (bandeau non bloquant nommant le paramètre et la
  valeur retenue) ; supprimer partout le mot « silencieusement ».

### AMB-13 — `Tout effacer` : retour aux défauts relevés ou absence de tout paramètre ?

- **Sévérité** : BLOQUANT
- **Exigence visée** : `EX-SCR-77` — « **`Tout effacer`.** Bouton textuel qui remet tous les
  filtres à leur **valeur par défaut relevée** — pas à « vide » : `atype` reste `C`, `ustate`
  reste `N,U`, `powertype` reste `kw`, `pricetype` reste `public` » — contre `EX-SRCH-18` — « Un
  bouton unique ramène tous les filtres IN à leur **absence** (URL **sans aucun** des paramètres
  de § A.2.2) ».
- **Lecture 1** : après `Tout effacer`, l'état porte les défauts relevés, dont `ustate = N,U`. Or
  `REF-filters.md` Z4 établit que « `N,U` = neuf + occasion **sans** accidentés, `A,N,U` = avec
  accidentés ». Sur une sélection Opel Belgique de 1 281 annonces dont **12** portent
  `usageState = A` → après `Tout effacer` : **1 269 offres**.
- **Lecture 2** : après `Tout effacer`, aucun paramètre n'est posé, donc aucune contrainte n'est
  appliquée au snapshot local (KYCAR filtre son propre jeu de données, A-03) → **1 281 offres**.
- **Divergence** : 12 annonces, et surtout la classe d'annonces la plus intéressante pour la
  détection d'outliers — A-01 qualifie le véhicule accidenté de « facteur explicatif d'outlier de
  **premier ordre** ». Dans la lecture 1, l'état « sans filtre » de KYCAR exclut silencieusement
  les accidentés, ce qui contredit `EX-SCR-39` (« aucun état n'est silencieux ») ; dans la lecture
  2 il les inclut. Effet en cascade : l'état d'après-reset décide aussi si l'on est dans le cas
  « aucun filtre posé » d'`EX-SCR-125` (voir AMB-05), donc si la grille affiche 20 cartes ou
  toutes.
- **Levée proposée** : distinguer explicitement les deux notions dans l'annexe C : (a) **état des
  filtres KYCAR** — après réinitialisation, aucun prédicat n'est appliqué au snapshot, aucun
  paramètre n'est émis ; (b) **valeurs injectées dans une requête vers la source** — `atype=C`,
  `ustate=A,N,U` (et non `N,U`, pour ne pas amputer le snapshot), `powertype`, `pricetype`,
  posées par l'adaptateur `DataProvider` et jamais présentées comme des filtres utilisateur.
  Réécrire `EX-SCR-77` en conséquence et faire de `EX-SRCH-18` la règle unique.

### AMB-14 — Les deux commutateurs d'assainissement : filtre ou exclusion statistique ?

- **Sévérité** : BLOQUANT
- **Exigence visée** : `EX-SCR-95` — « Deux commutateurs d'assainissement, propres à KYCAR […]
  `Écarter les prix < 100 €` (défaut : inactif) et **`Écarter les annonces à prix sur demande`
  (défaut : actif**, car un prix absent ne peut entrer dans aucune distribution) » — contre
  `EX-DATA-16` — « Une annonce dont `priceStatus ≠ QUOTED` : (a) **compte** dans tout effectif
  (`listingCount` d'un agrégat marque ou modèle, effectif d'une sélection) ; (b) est exclue de
  toute statistique de prix […] **la compter dans l'effectif et l'exclure des distributions est la
  seule lecture qui ne mente sur aucun des deux chiffres** ».
- **Lecture 1** (commutateur = filtre) : « Écarter » signifie retirer de la sélection `Σ`, comme
  tout autre contrôle du bandeau. Modèle à **1 281 offres** dont **47** à prix sur demande, le
  commutateur étant **actif par défaut** → l'écran affiche d'emblée **1 234 offres**,
  `priceOnRequestCount = 0`, et la note `<k> annonces à prix sur demande` d'`EX-SCR-36` disparaît.
- **Lecture 2** (commutateur = exclusion métrique) : « Écarter » ne porte que sur les agrégats de
  prix, ce qu'`EX-DATA-16` impose déjà inconditionnellement ; l'effectif reste exhaustif →
  l'écran affiche **1 281 offres**, dont 47 signalées à prix sur demande, la médiane étant
  calculée sur 1 234.
- **Divergence** : 1 234 contre 1 281 offres **dans l'état par défaut de l'application**, c'est-à-dire
  sur le premier chiffre que voit tout utilisateur, sur chaque carte-marque, chaque zone-modèle et
  l'en-tête de l'écran B ; et l'invariant de sommation d'`EX-DATA-74`
  (`Σ_j listingCount(B_{k,j}) = listingCount(A_k)`) reste vrai dans les deux lectures mais sur
  deux populations différentes, donc un test écrit d'après une lecture échoue contre l'autre. Le
  même raisonnement s'applique au commutateur `< 100 €` (dont le seuil est par ailleurs
  incompatible avec les 250 € d'`EX-DATA-19` — divergence de valeur déjà relevée par ADV-04 ;
  l'angle ajouté ici est la **nature** du commutateur, non son seuil).
- **Levée proposée** : renommer et requalifier les deux contrôles dans `EX-SCR-95` :
  « Ces deux réglages ne modifient **jamais** l'effectif d'une sélection (`EX-DATA-16(a)`) : ils
  n'agissent que sur les échantillons valides `V_price` au sens d'`EX-DATA-60`. Libellés :
  `Exclure des statistiques de prix : annonces à prix sur demande` et
  `… : prix sous le seuil de sentinelle (250 €, EX-DATA-19)` ». Et inscrire dans `EX-DATA-60` que
  ces deux commutateurs sont les seuls paramètres utilisateur de la table d'exclusion par
  métrique.

### AMB-15 — Portée des filtres sur la couverture d'échantillon : `n_tot` suit-il la sélection ?

- **Sévérité** : MAJEUR (BLOQUANT dès que le seuil `p < 20` bascule)
- **Exigence visée** : `EX-SCR-143` — « Le bandeau de filtres est persistant et **s'applique à
  toute la page** […] **tous** les graphes de l'écran B sont recalculés depuis le même ensemble
  filtré […] il n'existe aucun graphe qui ignore un filtre » — croisé avec `EX-SCR-31` —
  « `Statistiques calculées sur <n_obs> annonces observées sur <n_tot> annoncées — couverture
  <p> %` […] Ce bandeau est **non refermable** lorsque `p < 20` » — et le glossaire de
  `REQUIREMENTS.md` : « **Couverture d'échantillon** — rapport entre le nombre d'annonces détenues
  et l'effectif total annoncé par la source, **pour une sélection donnée** ».
- **Lecture 1** (`n_tot` non filtrable) : `n_tot` provient de la source
  (`topModels[].listingsCount`), qui ne connaît pas les filtres locaux de KYCAR ; il reste donc
  l'effectif annoncé du couple marque/modèle. Corsa : `n_obs = 20`, `n_tot = 1 281` → bandeau
  `2 %`, jeton rouge, non refermable. L'utilisateur pose `pricefrom=15000`, qui ne laisse que
  **6** annonces observées → `6 / 1 281` → **`0 %`** (arrondi entier d'`EX-SCR-11`), toujours
  rouge.
- **Lecture 2** (`n_tot` mis à l'échelle de la sélection, seule lecture compatible avec « le
  filtre s'applique à toute la page » et avec « pour une sélection donnée » du glossaire) :
  `n_tot` est estimé sur la même sélection, par exemple par la part observée
  `n_tot(σ) = n_tot · n_obs(σ)/n_obs = 1 281 · 6/20 = 384` → bandeau **`2 %`**, inchangé.
- **Divergence** : `0 %` contre `2 %` sur le bandeau le plus important de l'application, et le
  franchissement du seuil de 20 % — donc le passage du jeton ambre au rouge et le caractère
  **non refermable** du bandeau — se produit dans une lecture et pas dans l'autre dès qu'un filtre
  restreint la sélection. Exemple où l'écart bascule : `n_obs = 20`, `n_tot = 22`, filtre laissant
  `n_obs(σ) = 4` → lecture 1 : `4/22 = 18 %` → **rouge, non refermable** ; lecture 2 :
  `4 / (22·4/20) = 91 %` → **vert**. Deux implémentations conformes affichent l'une un
  avertissement bloquant, l'autre un feu vert, sur le même écran.
- **Recoupement** : `st-complete` (T-01) relève que **aucun champ ne porte `n_tot`**. Angle
  ajouté : même ce champ créé, la **portée des filtres sur `n_tot`** n'est écrite nulle part, et
  `EX-SCR-143` (« tous les graphes recalculés depuis le même ensemble filtré ») pousse dans un
  sens tandis que la nature de la donnée source pousse dans l'autre.
- **Levée proposée** : inscrire dans l'annexe A : « `announcedCount` est une propriété du couple
  (marque, modèle) du snapshot et **n'est jamais recalculé sous filtre**. La couverture
  d'échantillon n'est publiée **que** pour la sélection sans filtre autre que la route ; dès
  qu'un filtre de classe R est posé, `C3` affiche `couverture non applicable sous filtre` et ne
  prend aucun jeton coloré ». Et corriger le glossaire de `REQUIREMENTS.md`, dont les mots « pour
  une sélection donnée » créent à eux seuls la seconde lecture.
### AMB-16 — `G8` : quelle régression ? `ln(prix) ~ km/10 000` ou `prix ~ ln(km)` ?

- **Sévérité** : BLOQUANT
- **Exigence visée** : `EX-SCR-164` — « Le prix attendu est le prix prédit par une **régression
  robuste du prix sur l'année et sur le logarithme du kilométrage** […] `Modèle : régression
  robuste prix ~ année + ln(km) — n = 312, R² = 0,71` » — contre `EX-DATA-90` (méthode M2) —
  « `y_i = ln(p_i)` […] `x2_i = mileageKm_i / 10000` ; modèle `y_i = β0 + β1·x1_i + β2·x2_i` » et
  `EX-DATA-92` — « prix attendu : `p̂_i = exp(ŷ_i + m_r)` ». Les deux formes sont incompatibles :
  l'annexe A régresse le **logarithme du prix** sur le kilométrage **linéaire**, l'annexe B
  régresse le **prix** sur le **logarithme du kilométrage**.
- **Exemple chiffré commun** (cellule à année constante, donc `x1` retiré par `EX-DATA-91` ; deux
  points suffisent alors à déterminer les deux coefficients, les moindres carrés passant
  exactement par eux) : annonce A `20 000 km / 20 000 €`, annonce B `80 000 km / 10 000 €`.
  Prix attendu d'une annonce C à `40 000 km` :
- **Lecture 1** (M2, annexe A) : `ln 20 000 = 9,9035`, `ln 10 000 = 9,2103` ; `x2 = 2` et `8` →
  `β2 = (9,2103 − 9,9035)/6 = −0,11552`, `β0 = 10,1345`. En `x2 = 4` :
  `ŷ = 9,67244` → **`p̂ = 20 000 × 0,5^{1/3} = 15 874 €`**.
- **Lecture 2** (`EX-SCR-164` au pied de la lettre) : `prix = β0 + β1·ln(km)` →
  `β1 = (10 000 − 20 000)/(11,2898 − 9,9035) = −7 213,5`, en `ln 40 000 = 10,5966` →
  **`p̂ = 15 000 €`**.
- **Divergence** : pour une annonce C réellement affichée à **15 200 €**, la lecture 1 donne
  `δ = 15 200/15 874 − 1 = −4,2 %` — sous-évaluée, **teinte froide**, candidate à l'opportunité —
  et la lecture 2 donne `δ = +1,3 %` — surévaluée, **teinte chaude**. Le **signe du verdict
  s'inverse**, donc la couleur de la sucette, le côté de l'axe centré sur 0, la présence de
  l'annonce dans les « 20 premiers », le liseré de la ligne dans l'écran D (`EX-SCR-207`) et la
  colonne « Écart au prix attendu » du CSV. Sur un modèle de 312 annonces, l'écart de forme
  fonctionnelle déplace typiquement plusieurs annonces d'une queue à l'autre.
- **Recoupement** : `st-complete` (T-03) relève que le `R² = 0,71` affiché n'est défini nulle
  part. Angle ajouté : ce n'est pas seulement `R²` qui manque, c'est que le **modèle affiché à
  l'écran n'est pas celui de l'annexe A** — deux implémentations conformes calculent deux prix
  attendus différents, et l'écran ment sur la méthode qu'il déclare (`EX-SCR-164` exige que la
  méthode soit « nommée à l'écran », donc le libellé lui-même devient faux dans la lecture 1).
- **Levée proposée** : remplacer le libellé et la formule d'`EX-SCR-164` par un renvoi :
  « prix attendu = `p̂` de la méthode M2 (`EX-DATA-90` à `EX-DATA-93`) ; libellé à l'écran
  `Modèle : ln(prix) ~ année + km/10 000, échelle robuste MAD — n = …, R² = …` », et définir `R²`
  dans l'annexe A (passe retenue, dénominateur `F` ou `F'`).

### AMB-17 — Ordre de `G8` et de la colonne « Écart » : en écarts-types, en euros ou en pourcentage ?

- **Sévérité** : MAJEUR
- **Exigence visée** : `EX-SCR-164` — « une ligne par annonce, **triées par écart croissant** (les
  plus sous-évaluées en haut) […] double étiquetage **en euros et en pourcentage** » et
  `EX-SCR-206` — « Par défaut : **écart au prix attendu croissant** » — contre `EX-DATA-94` — « Les
  candidats sont classés par **`opportunityScore` décroissant**, égalités départagées par
  `priceEur` croissant, puis par `listingId` croissant », où `opportunityScore = −z_i`, un écart
  **en écarts-types robustes**.
- **Lecture 1** : « écart » désigne `δ = p/p̂ − 1` en pourcentage (la grandeur nommée `δ` par
  `EX-DATA-92`). Deux annonces : X (`p̂ = 30 000 €`, `p = 27 000 €`, `δ = −10 %`, écart
  `−3 000 €`, `z = −2,6`) et Y (`p̂ = 8 000 €`, `p = 6 000 €`, `δ = −25 %`, écart `−2 000 €`,
  `z = −3,1`) → ordre **Y, X**.
- **Lecture 2** : « écart » désigne l'écart en euros, la première des deux unités du double
  étiquetage → ordre **X, Y**.
- **Lecture 3** (celle de l'annexe A, qui fait foi sur le classement) : ordre par `−z` décroissant
  → **Y, X**, mais avec un départage explicite que ni `EX-SCR-164` ni `EX-SCR-206` ne portent.
- **Divergence** : l'ordre des sucettes s'inverse entre lecture 1 et lecture 2, et comme `G8`
  n'affiche que **les 20 premiers**, l'appartenance à la liste change : sur un modèle où les
  annonces bon marché sont concentrées dans le bas de gamme, le tri en euros remplit les 20
  lignes de véhicules chers légèrement décotés, le tri en pourcentage de petits véhicules
  fortement décotés. Deux listes disjointes pour la même sélection. Sur l'écran D, l'absence de
  règle de départage rend en outre l'ordre des lignes non reproductible dès qu'un prix est en
  ex æquo (40 annonces au même prix chez un même concessionnaire est un cas courant).
- **Levée proposée** : dans `EX-SCR-164` et `EX-SCR-206`, remplacer « écart croissant » par
  « `opportunityScore` décroissant au sens d'`EX-DATA-94`, égalités départagées par `priceEur`
  croissant puis `listingId` croissant » ; conserver le double étiquetage €/% comme pur
  affichage. Préciser de même sur quelle population le `P10 des écarts` d'`EX-SCR-207` est
  calculé (les 20 lignes de `G8`, ou tout le périmètre de l'écran D) et dans quelle unité.

### AMB-18 — `G10` : « quintiles observés » — bornes de quantile ou groupes d'effectif égal ?

- **Sévérité** : MAJEUR
- **Exigence visée** : `EX-SCR-166` — « boîtes à moustaches, **5 tranches définies par les
  quintiles observés du kilométrage** — et non par des paliers ronds, **car les quintiles
  garantissent des effectifs comparables** et donc des boîtes comparables ».
- **Lecture 1** (bornes de quantile) : les tranches sont délimitées par
  `Q(V, 0,2)`, `Q(V, 0,4)`, `Q(V, 0,6)`, `Q(V, 0,8)` calculés selon `EX-DATA-62`. Échantillon de
  `n = 100` : 30 annonces à 50 000 km, 30 à 100 000 km, 40 à 150 000 km. Alors
  `Q(0,2) = 50 000`, `Q(0,4) = 100 000`, `Q(0,6) = 120 000`, `Q(0,8) = 150 000` → tranches
  d'effectifs **30 · 30 · 0 · 0 · 40**, soit **deux boîtes vides** et trois boîtes très
  inégales.
- **Lecture 2** (groupes de rang) : les tranches sont les cinquièmes de l'échantillon trié, 20
  annonces chacune, les bornes affichées étant les kilométrages extrêmes de chaque groupe →
  effectifs **20 · 20 · 20 · 20 · 20**, deux tranches portant la même borne affichée
  (`100 000 – 150 000 km` apparaît deux fois).
- **Divergence** : 5 boîtes dont 2 vides contre 5 boîtes d'effectif égal, sur les mêmes données ;
  les effectifs inscrits sous l'axe (`EX-SCR-166` : « chaque boîte porte son effectif ») diffèrent
  tous, les médianes et les écarts interquartiles de chaque boîte diffèrent, et le message même du
  graphe (« où le marché est incohérent ») change de cible. La justification écrite de l'exigence
  (« les quintiles garantissent des effectifs comparables ») n'est vraie que dans la lecture 2,
  ce qui montre que l'auteur pensait à la lecture 2 — mais le mot « quintile » renvoie, par
  `EX-DATA-62`, à la lecture 1.
- **Levée proposée** : ajouter à l'annexe A une exigence « tranches de rang »
  `NTILE(V, k)` : partition de l'échantillon trié en `k` groupes de tailles
  `⌈n/k⌉` ou `⌊n/k⌋`, les ex æquo de valeur étant affectés au groupe de rang le plus bas, avec la
  règle de report explicite ; puis faire dire à `EX-SCR-166` « `NTILE(V_mileage, 5)` », et
  préciser le libellé de borne quand deux tranches partagent une même valeur.

### AMB-19 — `powerfrom` en chevaux : comparé au `powerHp` arrondi ou au kW converti ?

- **Sévérité** : BLOQUANT
- **Exigence visée** : `EX-SCR-73` (« `powerfrom`/`powerto` ← `powertype` ») et `EX-SRCH-16`
  (« Changer d'unité (kW ↔ ch) **convertit** les bornes déjà saisies (facteur 1 kW ≈ 1,359 ch) »)
  — croisés avec `EX-DATA-36` — « La puissance canonique est le **kilowatt**, et les chevaux en
  sont dérivés par le facteur `1 kW = 1/0,7355 ch` » — et la ligne 36 du dictionnaire :
  `powerHp` = `arrondi(powerKw / 0,7355)`. Aucune exigence ne dit sur **quel champ** le
  prédicat de filtre s'évalue quand `powertype = hp`.
- **Lecture 1** (comparaison sur le champ dérivé) : `powertype=hp&powerfrom=101` sélectionne
  `powerHp ≥ 101`. Une Corsa `1.2 Turbo` a `powerKw = 74` → `powerHp = arrondi(74/0,7355) =
  arrondi(100,61) = 101` → **incluse**.
- **Lecture 2** (conversion de la borne vers l'unité canonique) : la borne est ramenée en kW —
  `101 × 0,7355 = 74,29` (ou `101/1,359 = 74,32` avec le facteur d'`EX-SRCH-16`) — et comparée à
  `powerKw` : `74 < 74,29` → **exclue**.
- **Divergence** : sur une sélection de 1 281 Corsa dont **210** annoncent exactement 74 kW
  (motorisation de très grande diffusion), le compteur affiche **640 offres** dans une lecture et
  **430** dans l'autre, avec trois histogrammes, une médiane et une liste d'outliers différents.
  L'effet est systématique et non marginal : tout arrondi de `powerHp` vers le haut crée une
  bande de puissances où les deux lectures divergent, et cette bande couvre environ un
  demi-cheval sur chaque valeur entière, soit ≈ 37 % des couples (kW, ch) usuels. Le facteur
  d'`EX-SRCH-16` (`1,359`) diffère en outre de celui d'`EX-DATA-36` (`1/0,7355 = 1,35962`), ce
  qui ajoute une troisième valeur de borne possible.
- **Levée proposée** : ajouter à l'annexe C : « tout prédicat de filtre s'évalue **sur le champ
  canonique** du dictionnaire, dans son unité canonique (`EX-DATA-4`) ; une borne saisie dans une
  unité d'affichage est convertie vers l'unité canonique **sans arrondi** avant comparaison. Pour
  `powertype = hp` : `powerKw ≥ borne_ch × 0,7355`, la constante étant celle d'`EX-DATA-36` et
  aucune autre ». Supprimer le facteur `1,359` d'`EX-SRCH-16` au profit d'un renvoi.

### AMB-20 — A-05 : « `[min, max]` bruts, toujours » — jusqu'où va « toujours » ?

- **Sévérité** : BLOQUANT
- **Exigence visée** : A-05 — « **B — distribution, et écran D** : `[min, max]` **bruts,
  toujours**. L'écran sert à **chasser**. Écrêter la queue de distribution y supprimerait l'objet
  de la recherche » — croisé avec `EX-SCR-18` — « Les axes sont bornés aux **percentiles P1 et
  P99** de la donnée affichée » — et `EX-SCR-145` (« bornes P1–P99 »), `EX-SCR-146` (« borne haute
  P99 »), `EX-SCR-163` (`G7`), `EX-DATA-75` (écrêtage `BIN` à `Q(0,01)`/`Q(0,99)`).
- **Lecture 1** : « toujours » qualifie les **fourchettes affichées** — le champ nommé
  `displayRange` d'`EX-DATA-68`/`EX-DATA-69` — et rien d'autre ; les axes de graphe restent bornés
  à P1–P99 avec bins de débordement, comme l'exige l'annexe B et comme le justifie `EX-DATA-77`
  (« sans lui, un seul véhicule de collection à 400 000 € […] écraserait toute la distribution
  réelle »). Corsa : `min = 119 €`, `Q(0,01) = 2 500 €`, `Q(0,99) = 34 000 €`,
  `max = 289 000 €` → axe de `G1` de **2 500 à 34 000 €**, 17 barres exploitables, 1 annonce dans
  le bin de débordement bas et 12 dans le bin haut.
- **Lecture 2** : « toujours » est un adverbe sans réserve et A-05 est un arbitrage du
  coordinateur, hiérarchiquement supérieur aux annexes ; sur l'écran B, **tout** intervalle
  affiché — en-tête, axes, infobulles, légendes de `G4` — porte les bornes brutes, faute de quoi
  « écrêter la queue de distribution supprimerait l'objet de la recherche », ce qui vise
  explicitement les graphes. Même Corsa → axe de `G1` de **119 à 289 000 €** : avec `w` issu de
  `W`, la largeur retenue devient 50 000 € et **la totalité des 1 281 annonces tombe dans une ou
  deux barres**.
- **Divergence** : un histogramme lisible à 17 barres contre un histogramme à 2 barres pour la
  même sélection ; et sur `G4`, une légende de couleur allant de 2005 à 2026 contre une allant de
  1968 à 2026. Les deux lectures sont écrites noir sur blanc dans deux documents normatifs dont
  l'un se déclare arbitrage.
- **Recoupement** : `st-adversarial` (ADV-03) relève que l'en-tête `EX-SCR-142` **n'affiche pas**
  `[min, max]`, donc une absence. Angle ajouté : la **portée** du mot « toujours » — en-tête,
  axes, infobulles, légendes — n'est pas délimitée, et la lecture large détruit les graphes que la
  lecture étroite préserve.
- **Levée proposée** : réécrire la ligne B/D d'A-05 : « les **fourchettes** de l'écran B et de
  l'écran D (champ `rawRange`) sont `[min, max]` bruts ; les **bornes d'axe** des graphes restent
  celles d'`EX-DATA-75` (`Q(0,01)`/`Q(0,99)`) avec bins de débordement obligatoires, dont
  l'effectif est affiché — c'est ainsi que la queue de distribution reste visible sans écraser la
  masse ». Puis inscrire dans `EX-SCR-142` l'emplacement de la fourchette brute.

### AMB-21 — L'étiquetage des fourchettes robustes : `P10 – P90` ou `p05 – p95` ?

- **Sévérité** : BLOQUANT
- **Exigence visée** : `EX-SCR-12` — « **Statistiques.** Les libellés normatifs **sont** :
  `médiane`, `moyenne`, `min`, `max`, `P10`, `P25`, `P75`, `P90`, `écart interquartile` » et
  `EX-SCR-33` (« percentiles **P10/P90** […] désactivés ») — contre A-05 (« `[p05, p95]` en
  principal », « quand `[p05, p95]` est affiché, **l'étiquetage doit le dire** ») et
  `EX-DATA-64`/`EX-DATA-69`, qui ne définissent que `p05`, `q1`, `median`, `q3`, `p95`. Les deux
  jeux de percentiles sont disjoints : ni `p05` ni `p95` ne figurent dans la liste normative des
  libellés, et ni `P10` ni `P90` ne sont définis par l'annexe A.
- **Exemple chiffré commun** : `n = 21`, prix `4 000, 5 000, …, 24 000 €` (pas de 1 000 €).
  Avec `h = 20p + 1` (`EX-DATA-62`) : `Q(0,05) = x_2 = 5 000`, `Q(0,10) = x_3 = 6 000`,
  `Q(0,90) = x_19 = 22 000`, `Q(0,95) = x_20 = 23 000`.
- **Lecture 1** : la fourchette robuste de la carte-marque et de la zone-modèle est celle de
  l'annexe A et d'A-05, étiquetée hors de la liste `EX-SCR-12` (par exemple `P5 – P95`) →
  affiché **`5 000 – 23 000 €`**.
- **Lecture 2** : les libellés d'`EX-SCR-12` sont normatifs et exhaustifs (« les libellés
  normatifs **sont** »), et `EX-SCR-33` confirme que les percentiles de l'application sont P10 et
  P90 ; la fourchette robuste est donc `[Q(0,10), Q(0,90)]`, étiquetée `P10 – P90` → affiché
  **`6 000 – 22 000 €`**.
- **Divergence** : 1 000 € sur chaque borne de chaque fourchette de l'écran A, soit sur le chiffre
  central du parcours 1, et un intervalle qui couvre 90 % des annonces contre 80 %. La divergence
  est structurelle, pas de bord : elle vaut pour toutes les cartes et tous les modèles.
- **Levée proposée** : trancher un seul couple de percentiles pour la fourchette robuste, l'écrire
  dans `EX-DATA-69`, et **compléter la liste d'`EX-SCR-12`** avec le libellé correspondant
  (`P5` et `P95`, ou `P10` et `P90`) en supprimant l'autre paire ; puis corriger `EX-SCR-33`, qui
  nomme les percentiles désactivés, et `EX-SCR-18`, qui introduit encore deux autres niveaux
  (P1, P99) sans les rattacher à `Q`.

### AMB-22 — Options de tri autres que le défaut : aucun départage, aucun traitement des valeurs nulles

- **Sévérité** : MAJEUR
- **Exigence visée** : `EX-SCR-120` — « **Options de tri des marques**, exactement quatre :
  `Nombre d'offres` (défaut, décroissant) · `Prix médian` (croissant par défaut) ·
  `Alphabétique` (croissant) · `Nombre de modèles` (décroissant) » — alors qu'`EX-SCR-119` et
  `EX-DATA-70` ne définissent le départage **que** pour le tri par effectif, et que rien ne dit où
  se placent les marques dont la statistique de tri est indéfinie.
- **Lecture 1** : les options héritent du départage du tri par défaut (`makeName`, puis `makeId`)
  et une médiane indéfinie est traitée comme absente, donc placée en fin de tri par analogie avec
  `EX-SCR-206` (« les valeurs absentes sont **toujours placées en fin de tri**, quel que soit le
  sens »). Tri `Prix médian croissant` sur trois marques — Alfa Romeo (médiane 12 000 €), Aixam
  (12 000 €), Abarth (médiane **indéfinie** : ses 40 annonces sont toutes à prix sur demande) →
  ordre **Aixam, Alfa Romeo, Abarth**.
- **Lecture 2** : `EX-SCR-206` est propre à l'écran D et ne s'exporte pas ; faute de règle, le tri
  est un tri stable sur l'ordre précédent (comportement natif de `Array.prototype.sort`), et une
  médiane indéfinie vaut `null`, qui se compare comme `0` en JavaScript, donc en tête d'un tri
  croissant → ordre **Abarth, Alfa Romeo, Aixam** (les deux ex æquo restant dans l'ordre du tri
  précédent, lui-même dépendant de l'état antérieur de l'écran).
- **Divergence** : la première carte de la grille n'est pas la même, et dans la lecture 2 l'ordre
  dépend de l'historique d'interaction de l'utilisateur — donc deux chargements de la même URL
  peuvent produire deux grilles différentes, ce qu'`EX-SCR-119` promet explicitement d'exclure
  (« le tri est total et déterministe : deux chargements identiques produisent le même ordre »).
  Une marque dont toutes les annonces sont à prix sur demande est placée en tête du classement
  des prix les plus bas dans la lecture 2 : un mensonge, pas seulement un désordre.
- **Levée proposée** : compléter `EX-SCR-120` : « chacune des quatre options est un ordre **total**
  : clé primaire de l'option, puis `makeName` selon la règle de départage unique (voir AMB-02),
  puis `makeId` croissant. Une clé primaire indéfinie (`null`) place la marque **en fin** de
  l'ordre, dans les deux sens de tri, et jamais à la valeur `0` ». Même complément pour
  `EX-SCR-121` (modèles) et pour les colonnes triables de l'écran D (`EX-SCR-203`).

### AMB-23 — `EX-SCR-11` : la méthode du plus grand reste sans règle de départage

- **Sévérité** : MAJEUR (BLOQUANT au sens strict du barème : deux chiffres différents affichés)
- **Exigence visée** : `EX-SCR-11` — « **Pourcentages.** Entier suivi d'une espace insécable et de
  `%` […] La somme affichée d'une répartition est corrigée par la **méthode du plus grand reste**
  pour totaliser exactement `100 %` ». La méthode est nommée, son cas d'égalité de restes ne l'est
  pas.
- **Exemple chiffré commun** : `G9` (répartition par carburant) sur `n = 200` — Essence 99,
  Diesel 99, Électrique 2. Parts exactes : 49,5 %, 49,5 %, 1,0 %. Planchers : 49, 49, 1 = 99 ; il
  reste **1 point** à attribuer, et les restes sont **0,5 · 0,5 · 0,0** — égalité parfaite entre
  Essence et Diesel.
- **Lecture 1** : le point va à la classe la première dans l'ordre d'affichage (`EX-SCR-165` :
  effectif décroissant — mais les deux classes sont aussi ex æquo en effectif, donc l'ordre
  d'affichage est lui-même indéterminé, voir AMB-22) → **Essence 50 %, Diesel 49 %,
  Électrique 1 %**.
- **Lecture 2** : à reste égal, le point va à la classe de plus grand effectif puis, à effectif
  égal, à la première par libellé croissant → **Diesel 50 %, Essence 49 %, Électrique 1 %**.
- **Divergence** : deux barres qui portent `99 · 50 %` et `99 · 49 %` — deux effectifs identiques
  affichés avec deux pourcentages différents, l'attribution du point étant inversée d'une
  implémentation à l'autre. Le même mécanisme s'applique à `G12`, `G13`, `G15` et au `<p> %
  particuliers` de l'en-tête `EX-SCR-142`. À cela s'ajoute une seconde indétermination : la
  correction du plus grand reste s'applique-t-elle **avant ou après** les substitutions
  `< 1 %` et `> 99 %` du même `EX-SCR-11` ? Sur les parts 0,4 / 0,4 / 99,2, la lecture « avant »
  affiche `< 1 %`, `< 1 %`, `> 99 %` — dont la somme lisible ne fait pas 100 % — et la lecture
  « après » affiche `0 %`, `1 %`, `99 %`, qui contredit la règle `< 1 %`.
- **Levée proposée** : compléter `EX-SCR-11` : « à reste égal, le point est attribué à la classe
  de plus grand effectif brut, puis à la première par libellé selon la règle de départage unique
  (AMB-02) ; la correction du plus grand reste s'applique **avant** les substitutions `< 1 %` et
  `> 99 %`, qui sont purement typographiques et ne modifient pas la valeur corrigée ; une
  répartition contenant au moins une substitution porte la mention `arrondis` en infobulle ».

### AMB-24 — `EX-SCR-16` : le rapport qui déclenche la bascule log compte-t-il les bins de débordement ?

- **Sévérité** : MAJEUR
- **Exigence visée** : `EX-SCR-16` — « Un axe d'effectif propose une bascule `Échelle log`
  **uniquement** lorsque le rapport entre l'effectif du **bucket le plus peuplé** et celui du
  **bucket non vide le moins peuplé** est ≥ 50. En dessous de 50, la bascule est **absente du
  DOM** » — croisé avec `EX-DATA-79`, qui émet des bins de débordement `open: true` **uniquement
  si leur effectif est strictement positif**, donc toujours « non vides », et qui exige qu'ils ne
  soient « jamais représentés à l'échelle ».
- **Lecture 1** (bins fermés seuls) : le rapport se calcule sur les buckets réguliers, les bins
  ouverts étant hors échelle par construction. Histogramme dont le bucket le plus peuplé compte
  **500** annonces, le bucket fermé non vide le moins peuplé **20**, et le bin de débordement haut
  **3** → rapport `500/20 = 25 < 50` → **bascule absente du DOM**.
- **Lecture 2** (tous les bins émis) : « bucket non vide » désigne tout bucket présent dans la
  sortie de `BIN`, débordements compris. Même histogramme → rapport `500/3 = 167 ≥ 50` →
  **bascule présente**, et si l'utilisateur l'active, les 14 barres changent de hauteur.
- **Divergence** : un contrôle présent contre absent dans le DOM — donc un critère de recette
  automatisé qui passe ou échoue selon l'implémentation, un test d'accessibilité au clavier dont
  l'ordre de tabulation diffère, et un axe des effectifs qui peut passer en logarithmique dans une
  lecture et jamais dans l'autre. Comme un bin de débordement à faible effectif est le cas
  **normal** (`EX-DATA-79` ne l'émet que s'il est non vide, et `EX-SCR-18` garantit qu'il existe
  dès qu'une valeur dépasse P99), la lecture 2 rend la bascule presque toujours présente et
  la règle « ≥ 50 » inopérante.
- **Levée proposée** : préciser `EX-SCR-16` : « le rapport est calculé sur les **bins fermés
  seuls** (`open = false`) ; les bins de débordement, non représentés à l'échelle
  (`EX-DATA-79`), n'entrent ni au numérateur ni au dénominateur. Si moins de deux bins fermés non
  vides existent, la bascule est absente ».
### AMB-25 — A-06 : « 10 % de la médiane de sa cellule » — médiane calculée quand, sur quoi, dans quel ordre ?

- **Sévérité** : BLOQUANT
- **Exigence visée** : A-06 — « **Décision : union des deux règles.** Un prix est sentinelle s'il
  est inférieur à 250 € **ou** inférieur à **10 % de la médiane de sa cellule d'homogénéité** » —
  croisé avec `EX-DATA-19` (le seuil absolu est un drapeau d'**ingestion**,
  `ingestFlags += SUSPECT_PRICE_FLOOR`, posé dans la colonne Validation du champ `priceEur`),
  `EX-DATA-60` (« `price` : une annonce est exclue de `V_price` si […] `ingestFlags ∋
  SUSPECT_PRICE_FLOOR` ») et `EX-DATA-86` (la cellule d'homogénéité est un sous-ensemble de la
  **sélection** `Σ`, choisie par une échelle de repli `C₁ → C₂ → C₃`).
- **Exemple chiffré commun** — cellule de 11 annonces, prix en euros :
  `100, 150, 200, 220, 240, 900, 9 000, 9 500, 10 000, 10 500, 11 000`. Les cinq premières sont
  sentinelles par le seuil absolu. La question porte sur l'annonce à **900 €**.
- **Lecture 1** (médiane calculée **avant** application du seuil absolu, sur les 11 prix connus) :
  `médiane = x_6 = 900 €` → seuil relatif `= 90 €` → `900 < 90` est faux → **l'annonce à 900 € est
  conservée** dans `V_price`. Statistiques publiées : `n_price = 6`, `min = 900 €`,
  `médiane = (9 500 + 10 000)/2 = 9 750 €`.
- **Lecture 2** (médiane calculée **après** retrait des sentinelles absolues, sur les 6 prix
  restants `900, 9 000, 9 500, 10 000, 10 500, 11 000`) : `médiane = 9 750 €` → seuil relatif
  `= 975 €` → `900 < 975` est vrai → **l'annonce à 900 € est écartée**. Statistiques publiées :
  `n_price = 5`, `min = 9 000 €`, `médiane = 10 000 €`.
- **Divergence** : la médiane affichée passe de `9 750 €` à `10 000 €`, le `min` de la fourchette
  brute — affichée « toujours » sur l'écran B par A-05 — de `900 €` à `9 000 €`, et l'effectif de
  la statistique de 6 à 5. Trois chiffres visibles sur quatre changent. Deux indéterminations
  s'ajoutent à celle de l'ordre : (a) **quand** la règle relative s'applique — à l'ingestion, où
  aucune sélection n'existe et où la cellule ne peut être que le snapshot entier, ou au calcul
  d'agrégat, où la cellule dépend des filtres (`EX-DATA-86`), ce qui rend le drapeau
  `SUSPECT_PRICE_FLOOR` variable alors qu'il est stocké dans `ingestFlags`, champ d'annonce ;
  (b) la règle est **circulaire** dans la lecture 2 étendue — la médiane dépend de `V_price`, qui
  dépend du drapeau, qui dépend de la médiane — sans qu'aucun texte n'interdise l'itération jusqu'au
  point fixe, qui donne un troisième résultat.
- **Recoupement** : `st-complete` (T-07) constate que la règle relative d'A-06 **n'est écrite dans
  aucune annexe**. Angle ajouté : même transcrite mot pour mot, la phrase d'A-06 admet au moins
  deux implémentations correctes qui publient des médianes différentes — la rédiger sans lever
  l'ordre des opérations ne suffirait donc pas.
- **Levée proposée** : inscrire dans l'annexe A une exigence en trois temps, non circulaire :
  « (1) le seuil absolu de 250 € est appliqué à l'ingestion et pose `SUSPECT_PRICE_FLOOR` ;
  (2) le seuil relatif est appliqué **au calcul d'agrégat**, sur la cellule `C` retenue par
  `EX-DATA-86`, et pose un drapeau distinct `SUSPECT_PRICE_RELATIVE`, propre à la sélection et
  jamais stocké dans `ingestFlags` ; (3) la médiane de référence du seuil relatif est
  `Q(V_price(C), 0,50)` calculée **après** exclusion des seules sentinelles absolues et **sans
  itération** ; (4) si aucune cellule n'atteint le seuil d'effectif, le seuil relatif ne
  s'applique pas ». Et compléter `EX-DATA-60` avec le nouveau drapeau.

### AMB-26 — Écran D : le paramètre `sel` est-il un filtre ou une restriction d'affichage ?

- **Sévérité** : BLOQUANT
- **Exigence visée** : `EX-SCR-202` — « Le paramètre `sel` **restreint la liste** à une sélection
  de brossage venue de l'écran B » — croisé avec `EX-SCR-184` (« La surbrillance **ne modifie
  aucun agrégat affiché** : convertir la sélection en filtre est un acte explicite »), A-07 (« la
  **sélection filtrée** est la base de comparaison de l'outlier […] changer le référentiel doit
  changer le verdict ») et `EX-DATA-86` (la cellule est un sous-ensemble de `Σ`).
- **Lecture 1** (`sel` est une contrainte de sélection, donc `Σ` change) : conformément à A-07,
  les cellules d'outlier se recalculent sur la population restreinte. Écran B affichant 312
  annonces, l'utilisateur brosse **25** points et ouvre l'écran D : `|F| = 25 < 30` → M2 n'est pas
  applicable (`EX-DATA-90`) → la colonne **« Écart au prix attendu » est vide pour les 25 lignes**
  (`—`, `INSUFFICIENT_DATA`), et le **tri par défaut de l'écran D** — « écart au prix attendu
  croissant » (`EX-SCR-206`) — n'a plus de clé.
- **Lecture 2** (`sel` ne restreint que l'affichage, comme le brossage de l'écran B) : les
  verdicts et les écarts sont ceux calculés sur les 312 annonces de l'écran B → les 25 lignes
  portent leurs écarts, par exemple `−18 %` pour la plus décotée, et le tri par défaut fonctionne.
- **Divergence** : une colonne pleine contre une colonne vide, et un tableau trié contre un
  tableau dont l'ordre est indéfini. Même quand le brossage dépasse 30 annonces, la divergence
  reste chiffrée : un ré-ajustement de M2 sur 40 points brossés — nécessairement choisis dans une
  zone étroite du plan prix × km, puisque c'est un brossage — produit un `p̂` très différent de
  celui ajusté sur 312 points ; une annonce à `δ = −18 %` sur la population complète ressort
  typiquement à `δ = −3 %` sur le sous-ensemble brossé, et le liseré d'`EX-SCR-207` (« écart
  inférieur au P10 des écarts ») change de lignes. L'utilisateur qui brosse un amas pour
  l'inspecter voit soit l'anomalie qu'il a repérée, soit sa disparition.
- **Levée proposée** : trancher explicitement dans l'annexe B et le répéter dans A-07 :
  « `sel` est une **restriction d'affichage** : la sélection `Σ` qui fonde les agrégats, les
  cellules d'outlier et les écarts reste celle des filtres de l'URL, sans `sel`. L'écran D affiche
  alors `<n> lignes affichées sur <N> de la sélection — écarts calculés sur les <N> », de façon à
  satisfaire l'étiquetage obligatoire d'A-07 ». Et prévoir le bouton « convertir la sélection en
  filtre » qu'`EX-SCR-184` mentionne, seul chemin qui change `Σ`.

### AMB-27 — `fuel=B` sélectionne-t-il les hybrides essence (code `2`) ?

- **Sévérité** : BLOQUANT
- **Exigence visée** : `EX-SRCH-11` — « À l'intérieur d'un filtre multi-valeurs « attribut unique
  du véhicule » : **OU**. Pour `fuel`, … : **une valeur de véhicule ne peut porter qu'un seul code
  de cet attribut à la fois (une voiture a un seul carburant)**, donc `fuel=B,D` signifie
  nécessairement « essence OU diesel » » — croisé avec `REF-vocabulary-reconciliation.md`
  (PIÈGE 1 : `B` = Essence, `2` = **Électrique/Essence**, `3` = Électrique/Diesel), `EX-DATA-11`
  (« la catégorie hybride est inatteignable par ce repli : […] jamais rattachée à `B` ou `D` ») et
  `EX-SCR-73`, qui traite explicitement `2` et `3` comme des **valeurs électriques** (« `bot`,
  `erfrom`, `erto` ← `fuel` contenant au moins une valeur électrique (`2`, `3`, `E`) »).
- **Lecture 1** (égalité stricte de code) : `fuel=B` sélectionne `fuelCategory = 'B'` et rien
  d'autre. Sélection Toyota Yaris de **800** annonces — 300 en `B`, 400 en `2`, 100 en `E` →
  `fuel=B` renvoie **300 offres**.
- **Lecture 2** (appartenance sémantique) : le libellé relevé du code `2` est
  « Électrique/Essence », donc une annonce en `2` **est** un véhicule à essence ; le corpus
  lui-même applique ce raisonnement dans l'autre sens (`EX-SCR-73` compte `2` parmi les valeurs
  électriques), et la table de repli d'`EX-DATA-10` projette tous les carburants essence sur `B`.
  Même sélection → `fuel=B` renvoie **700 offres** (300 + 400).
- **Divergence** : 300 offres contre 700 pour le même clic sur la case `Essence`, donc une médiane,
  trois histogrammes et une liste d'outliers entièrement différents — les hybrides se négociant
  nettement plus cher que les thermiques équivalents, la médiane bascule de plusieurs milliers
  d'euros. Le même flottement affecte `fuel=E` (les hybrides rechargeables sont-ils
  « électriques » ? `EX-SCR-73` répond oui pour activer un enfant, et rien ne répond pour
  filtrer) et le clic sur une barre de `G9` (`EX-SCR-165` : « clic sur une barre → pose `fuel` sur
  cette valeur »), où la lecture 2 rend l'effectif de la page différent de celui de la barre
  cliquée.
- **Levée proposée** : ajouter à `EX-SCR-84` (PIÈGE 1) : « le prédicat du filtre `Carburant` est
  l'**égalité stricte** de `fuelCategory` au code coché : `fuel=B` ne sélectionne **jamais** les
  codes `2` ni `3`, qui sont des catégories distinctes et non des sous-catégories d'essence ou
  de diesel. Le contrôle affiche les dix codes, hybrides compris, comme dix cases indépendantes,
  et un texte d'aide indique `Les hybrides ont leur propre catégorie` ». Et corriger la
  justification d'`EX-SRCH-11`, dont l'argument « une voiture a un seul carburant » est faux pour
  un hybride et fonde à lui seul la lecture 2.

### AMB-28 — « Couverture » désigne deux rapports différents, au même seuil de 80 %

- **Sévérité** : MAJEUR
- **Exigence visée** : glossaire de `REQUIREMENTS.md` — « **Couverture d'échantillon** — rapport
  entre le nombre d'annonces **détenues** et l'effectif total **annoncé par la source**, pour une
  sélection donnée » — contre `EX-DATA-61` (« sa **couverture** `coverage_m = n_m / N` »),
  `EX-DATA-17` (« `priceCoverage = priceQuotedCount / listingCount` […] quand
  `priceCoverage < 0,80`, l'agrégat porte `coverageWarning.price = true` ») et `EX-SCR-115`
  (« chaque zone-modèle affiche un **indicateur de couverture** de 8 px — disque plein
  (**couverture ≥ 80 %**), à moitié plein (20–80 %), ou creux (< 20 %) »). Trois grandeurs
  portent le même mot, et deux d'entre elles partagent le seuil de 80 %.
- **Lecture 1** : l'indicateur de 8 px porte la **couverture d'échantillon** du glossaire,
  `n_obs / n_tot`, ce que son infobulle suggère (`Fourchettes calculées sur <n_obs> des <n_tot>
  offres`). Zone-modèle de `n_obs = 20` observées sur `n_tot = 22` annoncées, dont seulement 12
  portent un prix ferme → `20/22 = 91 %` → **disque plein**, fourchettes en style normal.
- **Lecture 2** : l'indicateur porte la couverture métrique d'`EX-DATA-61`/`EX-DATA-17`, seule
  grandeur que l'annexe A calcule effectivement et seule à porter un seuil de 80 % opposable
  (`coverageWarning.price`). Même zone-modèle → `12/20 = 60 %` → **disque à moitié plein**.
- **Divergence** : deux pastilles différentes sur la même zone-modèle, et le franchissement du
  seuil bas (20 %) est encore plus sensible : un modèle à `n_obs = 20`, `n_tot = 1 281`
  (`1,6 %`) et `priceQuotedCount = 19` (`95 %`) affiche un **disque creux avec les trois
  fourchettes en italique** dans la lecture 1 et un **disque plein** dans la lecture 2. Le même
  mot gouverne aussi le jeton coloré du bandeau `C3` et le quatrième booléen
  `coverageWarning.samplingBias`, dont le seuil (30 % de `adTier ≠ NONE`) n'a rien à voir avec les
  deux autres.
- **Levée proposée** : renommer, une fois, dans le glossaire et partout : `sampleCoverage`
  (`n_obs / n_tot`, couverture **d'échantillon**), `metricCoverage_m` (`n_m / N`, couverture
  **métrique**), `priceQuotedShare` (`priceQuotedCount / listingCount`). Puis nommer explicitement,
  dans `EX-SCR-115` et `EX-SCR-31`, laquelle des trois pilote l'indicateur et le jeton coloré, et
  interdire l'emploi du mot « couverture » sans qualificatif.

### AMB-29 — Validation avant ou après normalisation : le seuil de 250 € frappe le prix source ou le prix arrondi ?

- **Sévérité** : MAJEUR
- **Exigence visée** : `EX-DATA-2`, qui définit côte à côte les colonnes **Normalisation**
  (« transformation appliquée à l'ingestion, unité canonique ») et **Validation** (« bornes de
  plausibilité et verdict hors bornes ») **sans dire laquelle s'applique la première** ; et la
  ligne 7 du dictionnaire, qui porte en Normalisation « arrondi à l'euro entier » et en
  Validation « `1 ≤ p ≤ 5 000 000` sinon REJET · `p < 250` →
  `ingestFlags += SUSPECT_PRICE_FLOOR` et exclusion des statistiques de prix ».
- **Lecture 1** (normalisation puis validation, ordre des colonnes) : un prix source de
  **249,60 €** est d'abord arrondi selon `EX-DATA-6` (au plus proche, demi vers l'infini) →
  **250 €**, puis validé : `250 < 250` est faux → **aucun drapeau**, l'annonce entre dans
  `V_price`. Sur une cellule dont les autres prix commencent à 9 000 €, la fourchette brute de
  l'écran B affiche `min = 250 €`.
- **Lecture 2** (validation sur la valeur reçue, la normalisation n'étant qu'une mise en forme de
  stockage) : `249,60 < 250` est vrai → **`SUSPECT_PRICE_FLOOR`**, exclusion des statistiques de
  prix → la fourchette brute affiche `min = 9 000 €`, et `n_price` est diminué de 1.
- **Divergence** : `250 €` contre `9 000 €` comme minimum affiché, sur l'écran dont A-05 dit
  précisément qu'il ne doit pas écrêter ses queues. Le même flottement se reproduit sur tous les
  champs dont la normalisation est un arrondi et la validation une borne à la même précision :
  `badgeDisplacementL` (« 1 décimale », validé `0,6 ≤ d ≤ 8,0` : un badge `0,55 l` donne `0,6`
  valide ou `INCONNU`), `consumptionCombinedL100Km` (`0,1 ≤ v ≤ 99,9` : une source à `99,94`
  donne `99,9` valide ou `INCONNU`), `netPriceEur` (`1 ≤ n < priceEur` : `n = 12 000,4` et
  `p = 12 000,4` donnent `12 000 < 12 000` faux, donc `INCONNU`, ou `12 000,4 < 12 000,4` faux
  également — ici les deux lectures concordent, ce qui montre que le défaut n'est pas
  systématique et échappera aux tests non dirigés).
- **Levée proposée** : ajouter à `EX-DATA-2` : « l'ordre d'application est **Normalisation puis
  Validation** : toute borne de la colonne Validation s'entend sur la valeur **déjà normalisée**,
  dans l'unité canonique d'`EX-DATA-4` et après l'arrondi d'`EX-DATA-6`. Les bornes sont
  inclusives sauf mention contraire explicite ». Et vérifier que les bornes ainsi lues restent
  celles voulues (le seuil sentinelle devient de fait `p ≤ 249`).

### AMB-30 — Cellule d'homogénéité d'une annonce dont l'année est inconnue

- **Sévérité** : BLOQUANT
- **Exigence visée** : `EX-DATA-86` — « `C₁ = { l ∈ Σ : makeId = k ∧ modelId = j ∧
  **firstRegistrationYear = y** }` […] `n_price(C₁) ≥ 12` […] M1 essaie `C₁`, puis `C₂`, puis
  `C₃` » — croisé avec `EX-DATA-26` (« date de première immatriculation absente : l'annonce est
  conservée […] exclue de […] la méthode M2 […] elle reste **incluse** dans les statistiques et
  l'histogramme de prix […] et dans la **méthode M1** »). Le cas `y = INCONNU` n'est pas traité.
- **Lecture 1** (`INCONNU` est une valeur de groupe comme une autre, ce qui est cohérent avec
  `EX-DATA-72`, où la clé réservée `modelId = 0` regroupe précisément les valeurs inconnues) :
  la cellule d'une annonce sans année est le groupe des annonces **sans année** du même modèle.
  Sélection Corsa de 143 annonces dont **18 sans année** (`n_price = 15 ≥ 12`), prix médian de ce
  sous-groupe **4 500 €** contre 12 900 € pour le modèle entier. Une annonce sans année à
  **5 000 €** : barrières de Tukey autour de `ln(4 500)` → **aucun drapeau**, verdict publié
  `cellLevel = MODEL_YEAR, cellSize = 15`.
- **Lecture 2** (une cellule ne peut pas être bâtie sur une clé inconnue ; l'échelle de repli
  s'applique) : la cellule est `C₂`, le modèle entier. Même annonce à 5 000 € : barrières autour
  de `ln(12 900)` → `5 000 € < lowFence` → **`LOW_PRICE_IQR`**, verdict publié
  `cellLevel = MODEL, cellSize = 130`.
- **Divergence** : la même annonce est signalée comme opportunité dans une lecture et banale dans
  l'autre ; elle apparaît ou non dans `G8` et dans le classement d'`EX-DATA-94`, et l'étiquetage
  obligatoire d'A-07 affiche `n = 15` contre `n = 130`. Le sous-groupe « année inconnue » est
  massivement composé d'imports et de véhicules anciens, donc sa médiane est structurellement
  basse : la lecture 1 rend ces annonces presque jamais signalables, la lecture 2 les signale
  presque toutes. Ce n'est pas un cas de bord, c'est une population entière — `EX-DATA-26` prévoit
  d'ailleurs de publier `yearKnownCount` et `yearCoverage`, preuve qu'elle est attendue en nombre.
- **Levée proposée** : ajouter à `EX-DATA-86` : « une annonce dont `firstRegistrationYear` est
  `INCONNU` ne peut pas former de cellule de rang 1 : elle démarre l'échelle de repli à `C₂`.
  Réciproquement, une cellule `C₁` ne contient **jamais** d'annonce d'année inconnue, y compris
  quand l'annonce évaluée en porte une ». Et énoncer la même règle générale pour toute clé de
  groupe : « `INCONNU` n'est jamais une valeur de clé d'agrégation, à la seule exception de la
  clé réservée `modelId = 0` d'`EX-DATA-72` ».
### AMB-31 — Périmètre de l'export CSV : les annonces ou les agrégats ?

- **Sévérité** : MAJEUR
- **Exigence visée** : `EX-SCR-187` — « Le menu `Exporter` propose exactement trois entrées :
  **`CSV des annonces du périmètre` (une ligne par annonce**, colonnes limitées aux champs
  autorisés), `CSV des agrégats affichés` (une ligne par bucket de **chaque** graphe, le nom du
  graphe en première colonne), `PNG du graphe sélectionné` » — contre l'annexe C § C.4 —
  « Exporte les **agrégats actuellement visibles à l'écran**, **jamais une annonce individuelle
  avec ses champs bruts** » — et `EX-CRUD-16` — « Périmètre mode 2 : une ligne par bucket de
  l'histogramme actuellement affiché (prix, kilométrage ou année **selon l'onglet actif**),
  colonnes = borne basse, borne haute, effectif » — et `EX-CRUD-17`, qui écarte **explicitement**
  l'export d'image.
- **Lecture 1** : l'annexe C fait foi sur le « cycle de vie du CRUD » (A-09, ligne 3), donc
  l'export est celui d'`EX-CRUD-14` à `EX-CRUD-17` : le menu ne porte **qu'une** entrée, et le
  fichier produit sur l'écran B compte **une ligne par bucket d'un seul histogramme** — soit,
  sur l'exemple d'AMB-09, **17 lignes** de trois colonnes.
- **Lecture 2** : l'annexe B fait foi sur le « contenu affiché » et `EX-SCR-187` est explicite
  (« exactement trois entrées ») : le menu porte trois entrées, et l'entrée agrégats produit une
  ligne par bucket de **chacun des 14 graphes** — soit environ **200 lignes** avec une colonne
  supplémentaire « graphe » — tandis que l'entrée annonces produit **1 281 lignes**, une par
  annonce, ce que l'annexe C interdit en toutes lettres.
- **Divergence** : un menu à une entrée contre un menu à trois entrées, un fichier de 17 lignes
  contre un de 200 ou de 1 281, et une entrée `PNG` présente contre absente. La divergence n'est
  pas seulement de volume : l'export par annonce est un livrable de nature différente (données
  unitaires, quoique sans champ interdit), et sa légitimité a été **tranchée dans les deux sens**
  par deux annexes normatives. S'y ajoute une indétermination interne à `EX-CRUD-16` : il
  s'appuie sur un « onglet actif » entre les trois histogrammes, alors qu'`EX-SCR-141` les affiche
  **côte à côte** sans onglets — le développeur doit donc inventer soit un onglet, soit un critère
  de « graphe courant » (le dernier survolé ? celui qui a le focus ?), chacun produisant un
  fichier différent pour le même clic.
- **Recoupement** : `st-complete` (T-16) relève que **les colonnes** de l'export ne sont définies
  par aucune annexe. Angle ajouté : avant les colonnes, c'est le **périmètre des lignes** et le
  nombre d'entrées du menu qui sont doublement définis, en sens contraires.
- **Levée proposée** : trancher dans A-09 (« l'export est un livrable de l'annexe C, l'annexe B ne
  décrit que l'emplacement du bouton ») puis n'écrire le périmètre qu'une fois : nombre d'entrées
  du menu, une ligne = quoi, colonnes nommées, et remplacer « selon l'onglet actif » par un
  critère existant (« les buckets des trois histogrammes, le nom du graphe en première colonne »).

### AMB-32 — Les percentiles de performance : quelle définition, sur quelle population de mesures ?

- **Sévérité** : MAJEUR
- **Exigence visée** : `EX-NFR-5` à `EX-NFR-9` — colonne « Percentile » valant `p95` pour cinq
  cibles chiffrées (p. ex. « Application d'un filtre […] ≤ 200 ms | p95 ») — et la matrice
  § 11.1 de `REQUIREMENTS.md` (« Mesure chiffrée contre la cible, **au percentile déclaré** »).
  Ni la définition du percentile, ni la taille ni la composition de l'échantillon de mesures ne
  sont fixées, alors que l'application dispose d'une définition normative de `Q`
  (`EX-DATA-62`, type 7) réservée aux statistiques de données.
- **Exemple chiffré commun** : campagne de **20** mesures d'application de filtre, triées, dont
  les deux plus lentes valent `x₁₉ = 195 ms` et `x₂₀ = 400 ms` (un ramasse-miettes sur la
  dernière), les 18 autres étant sous 150 ms.
- **Lecture 1** (le `Q` de type 7 de l'annexe A s'applique, puisque c'est la seule définition de
  percentile du corpus) : `h = 19 × 0,95 + 1 = 19,05`, `f = 0,05` →
  `p95 = 195 + 0,05 × (400 − 195) = 205,25 ms` → **cible ≤ 200 ms non tenue, `EX-NFR-5` échoue**.
- **Lecture 2** (convention usuelle de latence, rang le plus proche sans interpolation :
  `⌈0,95 × 20⌉ = 19` → `x₁₉`) : `p95 = 195 ms` → **cible tenue, `EX-NFR-5` passe**.
- **Divergence** : le même jeu de mesures fait échouer ou réussir une exigence non fonctionnelle
  chiffrée, donc conditionne le passage de la phase 2.5. `EX-NFR-8` ajoute une seconde
  indétermination du même ordre : « `≥ 30 images/seconde` **soutenues** | p95 » — un percentile
  sur une borne inférieure se lit soit « 95 % des fenêtres de mesure sont à ≥ 30 i/s », soit
  « le 5ᵉ centile du débit d'images est ≥ 30 i/s », soit « au plus 5 % des images sont en retard » ;
  sur une session où 4 % des images tombent à 12 i/s pendant une rotation, les trois lectures ne
  rendent pas le même verdict.
- **Levée proposée** : ajouter en tête de § D.2 : « tout percentile de performance est le
  **percentile de rang le plus proche supérieur** (`x_{⌈p·n⌉}` sur l'échantillon trié), sans
  interpolation — distinct du `Q` de type 7 d'`EX-DATA-62`, réservé aux statistiques de données ;
  il est mesuré sur **au moins 100 exécutions** du geste décrit, sur le jeu de référence de
  `EX-NFR-1` et l'appareil de référence de `EX-SCR-100`, chargement à froid exclu ». Et reformuler
  `EX-NFR-8` en « aucune fenêtre de 1 s ne descend sous 30 images/seconde dans 95 % des fenêtres
  d'une rotation de 10 s ».

### AMB-33 — « Retenu » veut-il dire « exposé » ? Le badge `+ 92` en est le juge

- **Sévérité** : BLOQUANT
- **Exigence visée** : A-01 — « « Tous les filtres » signifie que les 101 sont **implémentés,
  encodables dans l'URL et applicables au dataset** […] **Total exclu : 24. Total retenu : 77** »,
  la liste normative étant `data/reference/filters-scope.json` (« C'est ce fichier qui fait foi »)
  — laquelle classe **`atype`, `cat`, `mcat`, `page`, `size`, `lat`, `lon`, `tradeIn`,
  `damaged_listing`, `region`, `dlv_max` parmi les 77 `retenus`** — contre `EX-SCR-82`, qui classe
  `atype`, `cat`, `mcat`, `page`, `size` en **`X` — hors périmètre, absent du DOM, non sérialisé**,
  et `EX-SCR-83`, dont le bilan compte **31 filtres hors périmètre** donc **70 exposés**.
  Arbitre du désaccord : `EX-SCR-91` — « **Compteur `+ 92`** sur le bouton de dépliement : il
  affiche le nombre de filtres secondaires **non affichés dans la ligne primaire**, et **non le
  total du catalogue**. Sa valeur est **calculée, pas écrite en dur** ».
- **Lecture 1** (« retenu » = « exposé », périmètre du fichier normatif) : les 77 filtres retenus
  ont un contrôle ; les 9 contrôles primaires en couvrent 13 → le badge affiche
  **`+ 64`** (77 − 13) et l'infobulle `Afficher les 64 autres filtres`.
- **Lecture 2** (« retenu » = « dans le périmètre produit », la classe `R`/`T`/`D`/`X` décidant
  seule de l'exposition, conformément à `EX-SCR-57`) : les filtres de classe `X` sont absents du
  DOM → contrôles secondaires réellement présents = 52 secondaires + 3 désactivés = **55** → le
  badge affiche **`+ 55`**.
- **Lecture 3** (celle de la maquette d'`EX-SCR-55`, où le badge est dessiné `[+ 92]`) :
  101 − 9 = **`+ 92`** — c'est-à-dire précisément « le total du catalogue » moins les contrôles
  primaires, ce que la même exigence `EX-SCR-91` interdit.
- **Divergence** : un nombre affiché en permanence dans l'en-tête de tous les écrans vaut **55, 64
  ou 92** selon la lecture, et l'infobulle promet d'afficher 55, 64 ou 92 filtres. Au-delà du
  badge, la divergence décide de choses vérifiables : si `page` et `size` sont « retenus », ils
  doivent être « encodables dans l'URL » (A-01) alors qu'`EX-SCR-82` dit « jamais exposée » et
  qu'`EX-SRCH-23` déclare `size` « hors périmètre même si `sort`/`desc`/`page` sont retenus » ; le
  test aller-retour URL de la matrice § 11.1 (« Tests des **77** filtres ») porte donc sur 77 ou
  sur 70 paramètres, et le critère de recette d'`EX-SCR-58` (compter les jetons `T` du DOM) sur
  deux populations différentes.
- **Recoupement** : `st-complete` (T-02) constatait l'**absence** d'une liste normative et un
  décompte faux ; la liste existe désormais (`filters-scope.json`, 101 entrées, 77/24) et clôt
  l'arithmétique. Angle ajouté : la liste tranche le **compte** mais pas le **sens du mot
  « retenu »**, et le conflit avec les classes `X` d'`EX-SCR-82` reste entier — avec un chiffre
  affiché à l'écran comme conséquence directe.
- **Levée proposée** : introduire dans `filters-scope.json` et dans `REQUIREMENTS.md` § 6 deux
  colonnes distinctes et non interchangeables : `perimetre ∈ {RETENU, EXCLU}` (77/24, décision
  A-01) et `exposition ∈ {PRIMAIRE, SECONDAIRE, DESACTIVE, NON_EXPOSE}` (13/52/3/…, décision
  annexe B), puis définir le badge comme « nombre d'entrées d'`exposition ∈ {SECONDAIRE,
  DESACTIVE}` », remplacer le `[+ 92]` de la maquette par `[+ 55]` (ou la valeur retenue), et
  restreindre les tests d'encodage d'URL aux filtres réellement exposés.
### AMB-34 — Étiquette d'un bucket de débordement : quatre formes, dont une fausse

- **Sévérité** : MINEUR
- **Exigence visée** : `EX-DATA-79` — les bins ouverts « affichent leur **borne finie suivie de
  `−` ou `+`** » — contre `EX-SCR-18` — « un bucket de débord explicitement libellé
  **`< <borne>`** et **`> <borne>`** » — contre `EX-SCR-146` — « bucket de débord
  **`≥ <borne> km`** » — contre `EX-SCR-147` — « regroupées dans un bucket de débord
  **`avant <AAAA>`** ».
- **Lecture 1** (annexe A) : le bin haut `[34 000, +∞)` s'étiquette **`34 000 +`**, forme qui
  n'affirme rien sur l'inclusion de la borne.
- **Lecture 2** (`EX-SCR-18`) : le même bin s'étiquette **`> 34 000`** — ce qui est **faux** pour
  une annonce à exactement 34 000 €, laquelle appartient à ce bin par `EX-DATA-76`
  (`[lo, +∞)`) : l'infobulle annonce alors « 12 offres > 34 000 € » dont l'une vaut 34 000 €.
- **Divergence** : purement typographique sur le nombre affiché (34 000 dans tous les cas), mais la
  lecture 2 produit un énoncé littéralement inexact, et les quatre formes cohabitant sur la même
  page (`G1` en `> …`, `G2` en `≥ … km`, `G3` en `avant …`, l'annexe A en `… +`) empêchent le test
  de recette d'`EX-SCR-188` (`aria-label` résumant la lecture) d'attendre une chaîne stable.
- **Levée proposée** : une seule forme, inscrite dans `EX-DATA-79` et reprise par renvoi :
  bin bas `< 2 500 €` (strictement, ce qui est exact puisque le bin bas est `(−∞, hi)`), bin haut
  `≥ 34 000 €` (inclusif, exact puisque le bin haut est `[lo, +∞)`) ; interdire les formes
  `> <borne>`, `<borne> +` et `avant <AAAA>` ou les définir comme des alias d'affichage de ces
  deux formes.

### AMB-35 — `EX-SCR-4` : « `min === max` » se teste sur les valeurs brutes ou arrondies ?

- **Sévérité** : MINEUR
- **Exigence visée** : `EX-SCR-4` — « **Fourchette de prix.** Format `<min> – <max> €` […]
  **Si `min === max`, afficher la valeur seule** : `9 500 €` » — sachant que la fourchette
  principale de l'écran A est `[p05, p95]` (A-05, `EX-DATA-69`), donc deux quantiles interpolés
  calculés « en double précision, sans arrondi intermédiaire » (`EX-DATA-63`).
- **Lecture 1** (test sur les valeurs affichées, après arrondi) : `p05 = 12 500,4 €` et
  `p95 = 12 500,6 €` s'arrondissent tous deux à `12 500` → `min === max` → affichage
  **`12 500 €`**.
- **Lecture 2** (test sur les valeurs brutes, l'arrondi n'intervenant qu'à la mise en forme
  finale) : `12 500,4 ≠ 12 500,6` → affichage **`12 500 – 12 500 €`**, une fourchette dont les
  deux bornes sont visuellement identiques.
- **Divergence** : cosmétique, sans effet sur les chiffres, mais la lecture 2 produit
  l'affichage absurde que la règle cherchait précisément à éviter. Le cas se produit dès qu'une
  cellule est très concentrée — un modèle dont 90 % des annonces sont au même prix catalogue,
  situation courante sur les véhicules quasi neufs.
- **Levée proposée** : préciser `EX-SCR-4` : « la comparaison `min === max` porte sur les valeurs
  **après arrondi de présentation** ; deux bornes qui s'affichent identiquement sont affichées
  une seule fois ». Même précision pour `EX-SCR-5` (kilométrage) et `EX-SCR-6` (année).

### AMB-36 — Budgets de troncature : 22 « caractères » comptés comment ?

- **Sévérité** : MINEUR
- **Exigence visée** : `EX-SCR-13` — « Budgets de **caractères** avant troncature : nom de marque
  **22**, nom de modèle **28**, libellé de filtre actif 34, libellé d'axe 20 » — croisé avec
  `EX-DATA-7`, qui impose la normalisation **NFC** avant « toute comparaison, tout hachage et
  toute troncature », et `EX-DATA-29` étape 1, qui impose **NFKC** pour `modelVersionClean`.
- **Lecture 1** (unités de code UTF-16, `String.prototype.length`, l'implémentation la plus
  directe) : un libellé de modèle de 28 signes dont 3 portent un diacritique décomposé compte
  31 unités → il est **tronqué à 28 unités**, la coupe pouvant tomber **entre une lettre et sa
  marque combinante** et produire un signe orphelin (`◌́`) en fin de chaîne, ou faire perdre un
  accent.
- **Lecture 2** (groupes de graphèmes, `Intl.Segmenter('fr', {granularity:'grapheme'})`) : le
  même libellé compte **28 graphèmes** → il n'est **pas tronqué du tout**.
- **Divergence** : un libellé affiché entier contre un libellé tronqué avec une ellipse, et dans
  le pire cas un caractère mal formé à l'écran. L'effet est invisible tant que la donnée est en
  NFC — mais `EX-DATA-7` ne s'applique qu'aux champs qu'il nomme, et le libellé affiché des
  marques et modèles vient de `taxonomy.json` (`EX-DATA-17` : « le libellé canonique du
  référentiel prime »), dont la forme de normalisation n'est spécifiée nulle part.
- **Levée proposée** : ajouter à `EX-SCR-13` : « les budgets sont exprimés en **groupes de
  graphèmes étendus** ; la troncature ne coupe jamais à l'intérieur d'un graphème » et, dans
  l'annexe A, « tout libellé de `taxonomy.json` est normalisé **NFC** au chargement, comme toute
  chaîne du modèle (`EX-DATA-7`) ».
### AMB-37 — Écran C : « échelle commune, bornes = union des périmètres » — union de quoi ?

- **Sévérité** : MAJEUR
- **Exigence visée** : `EX-SCR-195` — « Tout graphe répété par colonne partage les **mêmes bornes
  d'axe** sur toutes les colonnes, **calculées sur l'union des périmètres comparés** » et la
  maquette d'`EX-SCR-194` (« `G1` prix (échelle commune, **bornes = union des 3 périmètres**) ») —
  croisés avec `EX-DATA-75`, où les bornes d'un histogramme ne sont pas les extrêmes mais
  `a = Q(V, 0,01)` et `b = Q(V, 0,99)` d'un échantillon donné, et où la largeur `w` en découle.
- **Exemple chiffré commun** : Corsa (`a = 2 500`, `b = 34 000`), Polo (`a = 3 000`,
  `b = 40 000`), Clio (`a = 2 000`, `b = 28 000`), soit 5 596 annonces au total.
- **Lecture 1** (union des **populations**, puis `BIN` sur l'échantillon réuni) :
  `V = V_price(Corsa) ∪ V_price(Polo) ∪ V_price(Clio)`, dont `Q(0,01) = 2 300` et
  `Q(0,99) = 36 000` — les queues des trois modèles se diluant dans la population réunie →
  `raw = 33 700/24 = 1 404` → `w = 2 000 €`, `kLo = 1`, `kHi = 18` → **18 barres par colonne**,
  et les annonces de la Polo au-delà de 36 000 € tombent dans le bin de débordement.
- **Lecture 2** (union des **bornes** déjà calculées par colonne) : `a = min(2 500, 3 000,
  2 000) = 2 000`, `b = max(34 000, 40 000, 28 000) = 40 000` → `raw = 38 000/24 = 1 583` →
  `w = 2 000 €`, `kLo = 1`, `kHi = 20` → **20 barres par colonne**, aucun débordement haut.
- **Divergence** : 18 barres contre 20, donc des effectifs par barre différents dans chaque
  colonne, des infobulles différentes, un bin de débordement présent contre absent, et — comme
  `EX-SCR-198` recalcule les bornes au retrait d'une colonne — deux animations qui ne convergent
  pas vers le même axe. La divergence se cumule à celle d'AMB-09 : à ce stade, quatre
  histogrammes différents sont défendables pour la même comparaison. `EX-SCR-200` ajoute une
  troisième indétermination en excluant du calcul des bornes communes les modèles à `n = 0`, sans
  dire si un modèle à `n = 3` (dont `Q(0,01)` et `Q(0,99)` n'ont aucun sens) est inclus.
- **Levée proposée** : préciser `EX-SCR-195` : « les bornes communes sont celles de
  `BIN(V, W, T, O)` appliqué à l'**union des échantillons valides** des colonnes comparées, dont
  les colonnes à `n_m < 12` sont exclues ; la grille et la largeur `w` ainsi obtenues sont
  imposées à chaque colonne, les effectifs seuls variant d'une colonne à l'autre ».

---


## Journal des zones balayées

### Zones où l'ambiguïté a été trouvée (renvoi aux fiches)

| Zone | Résultat |
|---|---|
| Arrondis de présentation | AMB-01, AMB-07, AMB-29, AMB-35 — la règle de l'annexe A est nette, celle de l'annexe B la contredit trois fois |
| Départage des tris | AMB-02, AMB-17, AMB-22 — spécifié pour le tri par défaut de l'annexe A, absent partout ailleurs |
| Effectifs et seuils | AMB-03, AMB-25, AMB-30 — `n` non qualifié dans l'annexe B, dénominateur indéterminé |
| Seuils de rendu de l'écran A | AMB-04, AMB-05, AMB-13 — trois seuils (20/40/60) et deux définitions de « sans filtre » |
| Découpage des histogrammes | AMB-09, AMB-20, AMB-24, AMB-34, AMB-37 — deux règles de binning concurrentes et quatre étiquettes de débordement |
| Bornes d'intervalle | AMB-10, AMB-11, AMB-12 — l'inclusion des bornes de filtre n'est écrite nulle part, le passage bucket → filtre non plus |
| Nature d'un contrôle (filtre ou exclusion) | AMB-14, AMB-26, AMB-15 — « écarter », « restreindre », « s'applique à toute la page » |
| Définitions statistiques appliquées | AMB-16, AMB-18, AMB-21, AMB-23, AMB-32 — modèle de régression, quintiles, niveaux de percentile, plus grand reste, percentile de latence |
| Unités | AMB-19 — le résidu est le prédicat de filtre, pas le modèle de données |
| Vocabulaires | AMB-27 — la collision est traitée, l'appartenance sémantique du code hybride ne l'est pas |
| Termes du glossaire | AMB-28 — « couverture » vaut trois grandeurs ; AMB-33 — « retenu » vaut deux périmètres |
| Déterminisme d'affichage | AMB-06, AMB-36 — tirage aléatoire et comptage de caractères |
| Priorité des bandeaux | AMB-08 |
| Export | AMB-31 |

### Zones balayées et trouvées SAINES

Ce qui suit a été examiné avec la même grille et n'a produit **aucune** double lecture chiffrable.
C'est une information utile : ces zones n'ont pas besoin d'être retouchées, et plusieurs sont des
modèles de rédaction dont les levées proposées ci-dessus s'inspirent.

1. **Définition du quantile** — `EX-DATA-62` impose le type 7 **par sa formule** (`h = (n−1)p+1`,
   plancher, interpolation) et motive le choix par l'existence de neuf conventions. Le cas de
   l'effectif pair, que la consigne signalait comme piège probable, est **entièrement levé**.
2. **Appartenance à un bucket** — `EX-DATA-76` : semi-ouvert à droite, bins ouverts définis,
   couverture de `ℝ` sans recouvrement, avec la justification explicite « sans convention, une
   valeur égale à une borne tombe dans un bin ou dans son voisin selon l'implémentation ». Rien à
   redire ; le défaut est en aval (AMB-10).
3. **Arrondi des décimaux, en soi** — `EX-DATA-6` : `round-half-away-from-zero`, arrondi bancaire
   **interdit** nommément. La règle est sans ambiguïté ; seules ses contradictions d'écran le sont.
4. **Écart-type** — `EX-DATA-65`/`66` : dénominateur `n − 1`, `null` et jamais `0` pour `n = 1`,
   algorithme de Welford imposé contre `E[X²] − E[X]²`. Aucune latitude.
5. **Bornes d'année** — `EX-DATA-67` : plancher pour la borne basse, plafond pour la haute, avec
   l'invariant « la fourchette affichée contient tous les millésimes retenus ». Modèle du genre.
6. **Déterminisme de `BIN`** — `EX-DATA-82` : aucun aléa, aucune horloge, aucune locale, aucun
   ordre d'itération dépendant de l'implémentation, et un test sur deux permutations du même
   échantillon. C'est exactement la clause qui manque à l'échantillonnage de la nuée (AMB-06).
7. **Classement des opportunités** — `EX-DATA-94` : ordre total (`score`, puis `priceEur`, puis
   `listingId` en comparaison octet à octet sur la forme canonique minuscule).
8. **Ajustement de M2** — `EX-DATA-93` : « exactement deux passes », aucune itération, aucun
   critère de convergence, et le comportement si `|F'| < 30` est écrit. `EX-DATA-91` refuse un
   seuil de variance au profit d'un test d'égalité exact, en motivant par le risque de divergence
   entre implémentations. Zone remarquablement close.
9. **Collision des vocabulaires carburant** — décision V1, `EX-DATA-9`, `EX-DATA-11`, `EX-SCR-84` :
   deux vocabulaires disjoints, deux champs distincts, interdiction d'une fonction de décodage à un
   seul argument, interdiction de rattacher un hybride à `B`/`D`, critère de recette. Le piège
   nommé par la consigne est **désarmé** dans les données ; il ne subsiste qu'au niveau du prédicat
   de filtre (AMB-27).
10. **Unités de puissance dans le modèle** — `EX-DATA-4`, `EX-DATA-36` : kW canonique, chevaux
    **dérivés** par une constante nommée (DIN 66036), interdiction de reprendre `hp.raw` de la
    source, drapeau `POWER_UNIT_MISMATCH` au-delà de 2 %. La question « lequel fait foi » est
    tranchée ; le résidu est au filtre (AMB-19).
11. **Codes pays** — `EX-DATA-40` : ISO-3166 stocké, code marketplace produit **au moment de
    construire une requête**, avec la table de traduction et la justification (`L` = Luxembourg en
    recherche, Liberia en ISO).
12. **Quantificateurs flous** — recherche exhaustive de « le cas échéant », « si nécessaire »,
    « approprié », « pertinent », « significatif », « si possible », « raisonnable », « au
    besoin », « adéquat » sur les quatre documents normatifs : **aucune occurrence dans un énoncé
    d'exigence**. Les deux seules occurrences sont dans des justifications en prose. Le
    « significativement » du glossaire (`Outlier`) est immédiatement qualifié « au sens de M1 ou
    M2 ». Zone la plus propre du corpus.
13. **Effectifs par option de filtre (facettes)** — `EX-SCR-90` tranche explicitement
    « toutes contraintes appliquées **sauf le filtre courant** (facette leave-one-out) » et
    `EX-SCR-89` interdit de masquer une option à effectif nul. La double lecture classique
    (« ce que j'ai » contre « ce que j'obtiendrais ») est levée.
14. **Valeurs absentes au tri de l'écran D** — `EX-SCR-206` : « toujours placées en fin de tri,
    quel que soit le sens, et non traitées comme des zéros ». Exemplaire — et c'est l'absence de
    cette phrase sur l'écran A qui fonde AMB-22.
15. **Sérialisation d'URL** — `EX-NAV-6` (une occurrence, virgules, aucun séparateur alternatif),
    `EX-NAV-8` (défauts non émis, chaîne vide interdite et distinguée de « non posé »),
    `EX-NAV-9` (ordre alphabétique canonique, avec les trois raisons), `EX-NAV-10`/`11` (plafond de
    2 000 caractères, refus explicite, aucune troncature silencieuse). Aucune latitude.
16. **Combinaison logique des filtres** — `EX-SRCH-10` (ET entre filtres), `EX-SRCH-11` (OU
    intra-filtre, avec la classe de filtres concernée énumérée), `EX-SRCH-12` et A-03 pour `eq` :
    le seul point non prouvé est **nommé, paramétrable, affiché à l'écran** (`EX-SCR-66`,
    `EX-SCR-85`). C'est un point ouvert assumé, pas une ambiguïté cachée — je ne le compte donc
    pas comme constat, contrairement à ce que la mention « à revoir par `st-ambiguity` » de
    `EX-SRCH-12` pouvait laisser attendre : la décision est prise, réversible et signalée à
    l'utilisateur, ce qui est le traitement correct d'une inconnue.
17. **Interdictions d'invention** — `EX-DATA-27` (aucune imputation d'année), `EX-DATA-37` (aucun
    rétro-décodage de libellé), `EX-DATA-5` (aucune conversion d'unité devinée), `EX-DATA-8`
    (aucun rattachement au code le plus proche), `EX-SCR-116` (aucun `0 – 0 €`). Formulations
    négatives et sans échappatoire.
18. **Exclusion métrique par métrique** — `EX-DATA-16`, `26`, `38`, `60` : la table est explicite
    métrique par métrique, y compris les cas d'inclusion (`(f)` : une annonce sans prix reste dans
    les histogrammes de kilométrage et d'année). Le résidu est le commutateur d'écran (AMB-14).
19. **Confidentialité et R3** — `P-1` à `P-6`, `EX-DATA-47`, `EX-SCR-204`/`205`, `EX-NFR-26` : les
    champs interdits sont énumérés, le point d'application est nommé (l'ingestion, pas le
    stockage), et deux critères de recette sont des tests d'absence. Aucune portée ambiguë.
20. **Débounce, historique, dépendances de filtres** — `EX-SRCH-1` à `9` (un délai chiffré par type
    de contrôle), `EX-NAV-12` à `14` (une entrée d'historique par filtre appliqué, regroupement à
    800 ms, liste des cas toujours en `pushState`), `EX-SRCH-14` à `17`. Sans latitude.
21. **CRUD** — `EX-CRUD-1` à `13` : champs, validation, limites (50 / 30 / 10), FIFO, absence de
    corbeille, absence de modification du contenu enregistré. Le seul point ouvert est l'export
    (AMB-31).
22. **Invariants exécutables** — `EX-DATA-74` (sommation des effectifs), `EX-DATA-82`
    (déterminisme), `EX-DATA-95` (`outlierEvaluatedCount + outlierNotEvaluatedCount =
    priceQuotedCount`), `EX-DATA-89`/`92` (verdicts `INSUFFICIENT_SPREAD` quand `IQR = 0` ou
    `s = 0`). Tous vérifiables sans interprétation.
23. **Pipeline de nettoyage de `modelVersionInput`** — `EX-DATA-29` : dix étapes numérotées, dans
    un ordre imposé, avec les plages Unicode et les expressions régulières littérales. La seule
    latitude connue (aucune espace avant la limite de troncature) est déjà relevée par ADV-17,
    donc non recomptée ici.
24. **Écran E et écran G** — `EX-SCR-211` à `216` : parcourus sans trouver de double lecture
    chiffrable. Une réserve non comptée : `EX-SCR-216` (« triée par effectif décroissant **puis
    alphabétiquement** ») introduit une **troisième** formulation du départage alphabétique, sans
    règle de comparaison — c'est le même défaut qu'AMB-02, dont la levée doit couvrir cette
    occurrence.
25. **Annexe A, parties A.7 à A.9 et C** — champs exclus, rattachement des champs, entités,
    volumétrie, index, disposition physique : lues intégralement. Les choix y sont fermes
    (`EX-DATA-47` à `58`, `EX-DATA-99` à `112`) ; les divergences de chiffrage de la volumétrie
    sont déjà couvertes par ADV-08 et ADV-09, donc non recomptées.

### Zones explicitement non couvertes par ce rapport

- Les **six points ouverts et deux dettes** de la section 12 de `REQUIREMENTS.md` : assumés par
  écrit, donc ni trous ni ambiguïtés. Ils apparaissent ici seulement quand une exigence les
  contredit (AMB-08 sur O9).
- Le **choix** d'une décision (A-01 à A-09 sur le fond) : contester une décision n'est pas
  chasser une ambiguïté. Je n'ai relevé que les cas où le **texte** de l'arbitrage admet deux
  implémentations (A-05 → AMB-20, A-06 → AMB-25, A-01 → AMB-33, A-04 → AMB-11/12, A-07 → AMB-26).
- Les **absences** (`ST-complete.md`) et les **données pathologiques** (`ST-adversarial.md`).
- `REF-taxonomy.md`, `00-CONTEXT.md`, `AS24-REFERENCE-API.md`, `FINDING-allowed-surface.md` : lus
  comme référence de jugement, non audités pour eux-mêmes — ils ne sont pas normatifs.

### Note de méthode

Aucune fiche n'a été retenue sans (a) une citation littérale, (b) deux lectures dont chacune
respecte le texte cité, (c) un exemple chiffré commun aux deux lectures. Onze pistes ont été
écartées pour n'avoir pas franchi le critère (c), notamment : la portée du repli `C₂`/`C₃` sur les
scores publiés, la provenance WLTP/NEDC dans un agrégat unique (`EX-DATA-35`), l'ancrage de la
grille des paliers de 20 kW de `G14`, le comptage des effectifs du sélecteur `G` sous filtre, et
l'unicité globale de `modelId` dans la route de l'écran C. Elles restent des candidates de
seconde passe si l'arbitre souhaite les instruire.
