# REQ-STRESSTEST — Arbitrage consolidé du stress-test (phase 2.2)

**Agent** : `st-arbiter`, phase 2.2 de `PLAN-2-app-build.md`
**Entrées** : `ST-complete.md` (24 `T-*`) · `ST-ambiguity.md` (37 `AMB-*`) · `ST-adversarial.md`
(18 `ADV-*`) — **79 constats**.
**Corpus** : `REQUIREMENTS.md` v0.9 · annexe A `draft-data-dictionary.md` · annexe B
`draft-screens.md` · annexe C `draft-behaviour.md` · `ARBITRAGES-req-lead.md` (y compris
« Révisions des arbitrages, après stress-test »).
**Références** : `docs/00-CONTEXT.md`, `REF-vocabulary-reconciliation.md`,
`data/reference/filters-scope.json` (relu : 101 entrées, 77 retenus, 24 exclus — vérifié).
**Aucune requête réseau. Aucun document d'exigences ni aucun arbitrage modifié par cet agent.**

## Écart au plan, et ce qu'il change pour le lecteur

Le plan confiait à cet agent la consolidation **et** l'édition des annexes. Le coordinateur a
scindé : ce rapport **décide**, des agents d'application éditent. Conséquence sur la forme : chaque
décision porte **le texte exact à insérer**, entre guillemets français, et l'agent d'application
n'a aucun jugement à exercer. Là où un choix restait ouvert, il est tranché ici, avec sa raison en
une phrase.

## Conventions de lecture

- **Identifiants de décision** : `ARB-nn`. Chaque décision cite tous ses constats sources.
- **Sévérité retenue** : la plus haute du groupe dédupliqué, sauf **re-cotation explicite**, alors
  signalée par la mention `RE-COTÉ`.
- **Barème** : `BLOQUANT` = un développeur doit inventer une règle métier, ou deux lectures
  affichent des chiffres différents · `MAJEUR` = deux développeurs produisent deux comportements,
  ou un test n'est pas reproductible · `MINEUR` = confort, finition.
- **`RÉSOLU_PAR_COORDINATEUR`** : le fond est tranché dans `ARBITRAGES-req-lead.md` §
  « Révisions » (`R-A06`, `R-A01`, `R-A05`). Cet arbitre ne re-arbitre pas : il énumère seulement
  les éditions d'annexe qui en découlent.
- **`POUR_COORDINATEUR`** : la résolution touche `REQUIREMENTS.md` (index normatif) ou un
  arbitrage, ou modifie le périmètre du livrable. Une recommandation est toujours donnée.
- **Règle d'aiguillage appliquée** : toute édition de `REQUIREMENTS.md` ou de
  `ARBITRAGES-req-lead.md` part en `POUR_COORDINATEUR`, quelle que soit sa taille — ces deux
  documents appartiennent au coordinateur.
- **Autorité** : `A-09` est appliquée telle quelle. Annexe A = définition mathématique (buckets,
  statistiques, régressions, seuils d'effectif, normalisation) · annexe B = disposition, contenu
  affiché, états, encodages graphiques · annexe C = navigation, URL, historique, débounce, cycle de
  vie du CRUD, NFR chiffrées.

---

# 1. Tableau de synthèse

**65 décisions pour 79 constats**, 1 rejet. Colonne « Annexe cible » : `A` =
`draft-data-dictionary.md`, `B` = `draft-screens.md`, `C` = `draft-behaviour.md`,
`R` = `REQUIREMENTS.md` (donc `POUR_COORDINATEUR`). L'annexe en **gras** est celle qui porte
l'édition principale.

| Décision | Constats sources | Sévérité | Annexe cible | Statut |
|---|---|---|---|---|
| `ARB-01` | `T-01`, `AMB-15`, `AMB-28` | BLOQUANT | **A**, B, R | DÉCIDÉ |
| `ARB-02` | `T-02`, `AMB-33` | BLOQUANT | **B**, C, R | RÉSOLU_PAR_COORDINATEUR → éditions |
| `ARB-03` | `AMB-16`, `T-03` | BLOQUANT | **A**, B | DÉCIDÉ — M2 survit |
| `ARB-04` | `T-03`, `AMB-18` | BLOQUANT | **A**, B | DÉCIDÉ |
| `ARB-05` | `AMB-09` | BLOQUANT | **B** | DÉCIDÉ — `BIN` survit |
| `ARB-06` | `AMB-37` | MAJEUR | **B** | DÉCIDÉ |
| `ARB-07` | `AMB-24` | MAJEUR | **B** | DÉCIDÉ |
| `ARB-08` | `AMB-34` | MINEUR | **A**, B | DÉCIDÉ |
| `ARB-09` | `AMB-10` | BLOQUANT | **C**, B | DÉCIDÉ |
| `ARB-10` | `AMB-11` | BLOQUANT | **C**, B | DÉCIDÉ |
| `ARB-11` | `AMB-12`, `T-22` | BLOQUANT | **C**, B | DÉCIDÉ |
| `ARB-12` | `ADV-01` | MINEUR `RE-COTÉ` | **C**, B | DÉCIDÉ + dette D-2 |
| `ARB-13` | `T-07`, `AMB-25` | BLOQUANT | **A** | RÉSOLU_PAR_COORDINATEUR → éditions |
| `ARB-14` | `AMB-29` | MAJEUR | **A** | DÉCIDÉ |
| `ARB-15` | `ADV-04`, `AMB-14` | BLOQUANT | **B**, A | DÉCIDÉ |
| `ARB-16` | `ADV-16` | MAJEUR | **A** | DÉCIDÉ |
| `ARB-17` | `AMB-03`, `ADV-06` | BLOQUANT | **B** | DÉCIDÉ |
| `ARB-18` | `ADV-07` | MAJEUR | **B** | DÉCIDÉ + dette D-6 |
| `ARB-19` | `T-14`, `ADV-02`, `ADV-03`, `AMB-20` | BLOQUANT | **B**, A | RÉSOLU_PAR_COORDINATEUR → éditions |
| `ARB-20` | `AMB-21` | MAJEUR `RE-COTÉ` | **B**, A | DÉCIDÉ — `P5`/`P95` |
| `ARB-21` | `AMB-01` | BLOQUANT | **B**, A | DÉCIDÉ — `EX-DATA-6` prime |
| `ARB-22` | `AMB-07` | MAJEUR | **B**, A | DÉCIDÉ |
| `ARB-23` | `AMB-35` | MINEUR | **B** | DÉCIDÉ |
| `ARB-24` | `AMB-36` | MINEUR | **B**, A | DÉCIDÉ |
| `ARB-25` | `AMB-02`, `AMB-22` | BLOQUANT | **A**, B | DÉCIDÉ — `Intl.Collator` interdit |
| `ARB-26` | `AMB-23` | BLOQUANT `RE-COTÉ` | **B** | DÉCIDÉ |
| `ARB-27` | `AMB-17` | MAJEUR | **B** | DÉCIDÉ |
| `ARB-28` | `AMB-04` | BLOQUANT | **B** | DÉCIDÉ |
| `ARB-29` | `AMB-05` | BLOQUANT | **B** | DÉCIDÉ |
| `ARB-30` | `AMB-13` | BLOQUANT | **B**, C | DÉCIDÉ |
| `ARB-31` | `AMB-06` | MAJEUR | **A**, B | DÉCIDÉ |
| `ARB-32` | `AMB-08` | MAJEUR | **B** | DÉCIDÉ |
| `ARB-33` | `AMB-19` | BLOQUANT | **C**, B | DÉCIDÉ |
| `ARB-34` | `AMB-26` | BLOQUANT | **B** | DÉCIDÉ |
| `ARB-35` | `AMB-27` | BLOQUANT | **B**, C | DÉCIDÉ — égalité stricte |
| `ARB-36` | `AMB-30` | BLOQUANT | **A** | DÉCIDÉ |
| `ARB-37` | `T-16`, `AMB-31` | MAJEUR | **C**, A, B | DÉCIDÉ |
| `ARB-38` | `AMB-32` | MAJEUR | **C** | DÉCIDÉ |
| `ARB-39` | `T-04` | BLOQUANT | **A**, B | DÉCIDÉ + rejet partiel + `P-07` |
| `ARB-40` | `T-05` | BLOQUANT | **A**, B | DÉCIDÉ |
| `ARB-41` | `T-06` | BLOQUANT | **C**, B | DÉCIDÉ |
| `ARB-42` | `T-08` | BLOQUANT | **C**, A, B | DÉCIDÉ |
| `ARB-43` | `T-09` | BLOQUANT | **C**, B | DÉCIDÉ — modèles seuls |
| `ARB-44` | `T-10` | MAJEUR | **B**, R | DÉCIDÉ |
| `ARB-45` | `T-11` | MAJEUR | **C**, B | DÉCIDÉ |
| `ARB-46` | `T-12` | MAJEUR | **B** | DÉCIDÉ |
| `ARB-47` | `T-13` | MAJEUR | **B** | DÉCIDÉ |
| `ARB-48` | `T-15` | MAJEUR | **A** | DÉCIDÉ |
| `ARB-49` | `T-17` | MAJEUR | **C** | DÉCIDÉ |
| `ARB-50` | `T-18` | MAJEUR | **C** | DÉCIDÉ |
| `ARB-51` | `T-19` | MAJEUR | **B**, R | DÉCIDÉ |
| `ARB-52` | `T-20` | MINEUR | **B** | DÉCIDÉ |
| `ARB-53` | `T-21` | MINEUR | **B** | DÉCIDÉ |
| `ARB-54` | `ADV-05` | BLOQUANT | **A**, B | DÉCIDÉ |
| `ARB-55` | `ADV-08`, `ADV-09` | MAJEUR | **A**, C | DÉCIDÉ — calcul refait + dette D-4 |
| `ARB-56` | `ADV-10` | MAJEUR | **C** | DÉCIDÉ — calcul refait |
| `ARB-57` | `ADV-12` | MAJEUR | **C**, B | DÉCIDÉ |
| `ARB-58` | `ADV-13` | MAJEUR | **C** | DÉCIDÉ |
| `ARB-59` | `ADV-14` | BLOQUANT | **B**, A, C | DÉCIDÉ |
| `ARB-60` | `ADV-15` | MINEUR `RE-COTÉ` | **A** | DÉCIDÉ + dette D-1 |
| `ARB-61` | `ADV-17` | MINEUR | **A** | DÉCIDÉ |
| `ARB-62` | `ADV-18` | MAJEUR `RE-COTÉ` | **A**, B | DÉCIDÉ |
| `ARB-63` | `T-23` | MINEUR | **C** | DÉCIDÉ + dette D-3 |
| `ARB-64` | `T-24` | MINEUR | **A**, B | DÉCIDÉ |
| `ARB-65` | `T-02`, `AMB-33` (résidu de `ARB-02`) | MAJEUR | **B** | DÉCIDÉ — règle générative |
| `REJET-01` | `ADV-11` | — | R (`P-08`) | **REJETÉ**, preuve en § 3 |

---

# 2. Décisions détaillées

## 2.1 Points d'attention prioritaires

### ARB-03 — `G8` : une seule forme fonctionnelle survit, celle de l'annexe A (M2)

- **Constats sources** : `AMB-16` (BLOQUANT), `T-03` (partie `R²`).
- **Sévérité retenue** : **BLOQUANT**. Les deux lectures inversent le **signe** de l'écart sur la
  même annonce (`−4,2 %` contre `+1,3 %`), donc la couleur de la sucette, le côté de l'axe, la
  présence dans les « 20 premiers », le liseré de l'écran D et une colonne du CSV.
- **Les deux lectures** : `EX-SCR-164` écrit `prix ~ année + ln(km)` ; `EX-DATA-90` spécifie
  `ln(prix) ~ (année − ȳear) + km/10⁴`, prix attendu `p̂ = exp(ŷ + m_r)` (`EX-DATA-92`).
- **Décision — la formule de l'annexe A (M2) survit ; `EX-SCR-164` est privé de toute formule.**
  Justification en une phrase : `A-09` donne à l'annexe A l'autorité sur les régressions, et M2 est
  la seule des deux formes spécifiée de bout en bout (centrage de l'année, échelle en 10 000 km,
  régularisation `λ`, Cholesky, deux passes, retrait de régresseur dégénéré, `INSUFFICIENT_DATA` à
  `|F| < 30`), là où la forme de l'annexe B n'est qu'un libellé sans méthode d'estimation.
- **Annexe B — `EX-SCR-164`, MODIFIER.** Supprimer les phrases « Le prix attendu est le prix prédit
  par une **régression robuste** du prix sur l'année et sur le logarithme du kilométrage, estimée
  sur le périmètre filtré courant. La méthode d'estimation appartient au lot D4 ; l'écran exige
  seulement que la méthode soit **nommée à l'écran** sous le titre, au format
  `Modèle : régression robuste prix ~ année + ln(km) — n = 312, R² = 0,71`. » et les remplacer par :

  > Le prix attendu est `expectedPriceEur = p̂` de la **méthode M2**, définie par `EX-DATA-90` à
  > `EX-DATA-93`. Cet écran ne porte **aucune formule** : toute expression de la forme
  > fonctionnelle du modèle y est interdite (`A-09`). L'écran affiche sous le titre le libellé
  > normatif, mot pour mot :
  > `Modèle : ln(prix) ~ (année − moyenne) + km/10 000 — échelle robuste MAD — n = <|F|>, R² = <R²>`,
  > où `<|F|>` est `|F|` d'`EX-DATA-90` et `<R²>` le coefficient d'`EX-DATA-93bis`, formaté selon
  > `EX-SCR-2` (deux décimales, virgule décimale). L'écart affiché est `δ = p/p̂ − 1`
  > (`EX-DATA-92`) ; le double étiquetage euros/pourcentage reste un pur affichage.
- **Annexe A — `EX-DATA-93bis`, CRÉER**, immédiatement après `EX-DATA-93` :

  > **EX-DATA-93bis — coefficient de détermination publié.** `R²` est calculé sur la **passe 2**
  > d'`EX-DATA-93`, sur l'ensemble d'ajustement `F` **complet** — jamais sur `F'` —, en échelle
  > `y = ln(p)` et non en euros :
  > `R² = 1 − SCR/SCT`, avec `SCR = Σ_{i∈F} (y_i − ŷ_i)²`, `SCT = Σ_{i∈F} (y_i − ȳ)²` et
  > `ȳ = (1/|F|)·Σ_{i∈F} y_i`, `ŷ_i` étant la prédiction des coefficients de la passe 2. Si
  > `SCT = 0`, alors `R² = null` et le verdict de la cellule est `INSUFFICIENT_SPREAD`. `R²` est
  > arrondi à 2 décimales selon `EX-DATA-6`, jamais tronqué.
  > **Justification** : l'annexe B affiche `R²` en clair sous le titre de `G8` et en fait un seuil
  > d'avertissement (`R² < 0,30`) ; sans passe, sans dénominateur et sans échelle fixés, deux
  > implémentations affichent deux nombres et déclenchent l'avertissement sur des sélections
  > différentes.
- **Propagation obligatoire.** L'agent d'application remplace toute mention de la forme
  `prix ~ année + ln(km)` par un renvoi à M2, sans rien changer d'autre, dans : `EX-SCR-164`,
  `EX-SCR-203` (colonne « Écart au prix attendu »), `EX-SCR-206` (voir `ARB-27`), `EX-SCR-207`
  (liseré), `EX-SCR-158` (infobulle de `G4`). La matrice § 11.1 de `REQUIREMENTS.md`, si elle nomme
  la méthode, relève de la liste `POUR_COORDINATEUR`.

### ARB-05 — Binning : `BIN` de l'annexe A s'applique, Freedman-Diaconis est supprimé

- **Constats sources** : `AMB-09` (BLOQUANT).
- **Sévérité retenue** : **BLOQUANT**. 17 barres de 2 000 € contre 32 barres de 1 000 € pour la
  même sélection : effectifs, parts, bornes d'infobulle, filtre posé au clic et lignes de CSV
  divergent tous.
- **Les deux lectures** : `EX-DATA-75` (« une seule fonction `BIN(V, W, T, O)` […] toute autre règle
  de découpage est interdite ») contre `EX-SCR-145`/`146`/`147` (Freedman-Diaconis arrondi au
  multiple de 500 €, 8 à 40 buckets ; multiple de 5 000 km, 8 à 30 buckets ; suppression de
  l'écrêtage P1/P99 et regroupement « avant `<AAAA>` »).
- **Décision — application littérale d'`A-09` : la formule relève de l'annexe A.**
  `BIN(V, W, T, O)` avec le paramétrage d'`EX-DATA-77` est la règle unique ; les exigences d'écran
  ne décrivent plus que l'habillage. Justification : `A-09` ligne 1 nomme explicitement « la
  définition des buckets » comme domaine de l'annexe A, et `EX-DATA-75` porte déjà l'interdiction
  opposable — la lecture inverse obligerait à réécrire l'annexe A pour trois graphes sur quatorze.
- **Annexe B — `EX-SCR-145`, MODIFIER.** Texte de remplacement de l'exigence entière :

  > `EX-SCR-145` — **`G1` — Offres par prix.** Type : histogramme à barres verticales.
  > Axe X : prix, échelle **linéaire** (justification `EX-SCR-17`), unité `€`. **Les buckets, leurs
  > bornes, leur largeur et leurs bins de débordement sont exactement ceux produits par
  > `BIN(V_price(Σ), W, T, O)` au sens d'`EX-DATA-75` et d'`EX-DATA-77` ; cette exigence ne décrit
  > que l'habillage et n'énonce aucune règle de découpage, aucune borne d'axe et aucun plafond de
  > nombre de buckets.** Axe Y : nombre d'offres, **linéaire**, départ à 0, bascule logarithmique
  > conditionnelle (`EX-SCR-16`). Étiquettes d'axe X aux bornes de bucket, une sur deux si la
  > largeur disponible est inférieure à 48 px par étiquette. Les bins `open = true` sont rendus en
  > trame diagonale et contour pointillé, et étiquetés selon `EX-DATA-79` amendé par `ARB-08`.
- **Annexe B — `EX-SCR-146`, MODIFIER.** Remplacer « Identique à `G1`, unité `km`, largeur de bucket
  arrondie au multiple de 5 000 km, minimum 8 et maximum 30 buckets, borne haute P99 avec bucket de
  débord `≥ <borne> km` » par :

  > Identique à `G1`, unité `km`, **buckets produits par `BIN(V_mileage(Σ), W, T, O)`
  > (`EX-DATA-77`, ligne Kilométrage) ; cette exigence ne fixe aucune largeur, aucune borne et
  > aucun plafond de nombre de buckets.** Le bin de débordement haut est étiqueté selon `ARB-08`.
- **Annexe B — `EX-SCR-147`, MODIFIER.** Remplacer la règle propre à `G3` par :

  > Identique à `G1`, unité « année de première immatriculation », **buckets produits par
  > `BIN(V_year(Σ), {1}, 24, 0)` (`EX-DATA-77`, ligne Année) : un bin par millésime entre les
  > bornes de la grille, plus les bins de débordement d'`EX-DATA-79` s'ils sont non vides.
  > L'écrêtage à `Q(0,01)`/`Q(0,99)` n'est pas facultatif et le regroupement « avant `<AAAA>` » est
  > supprimé au profit du bin de débordement bas**, étiqueté selon `ARB-08`.
- **Annexe B — `EX-SCR-18`, MODIFIER.** Remplacer « Les axes sont bornés aux percentiles P1 et P99
  de la donnée affichée, arrondis vers l'extérieur au pas de bucket » par :

  > Les axes d'un **histogramme** sont bornés par la grille de `BIN` (`EX-DATA-75`) ; cette exigence
  > n'introduit aucun autre niveau de percentile. Les axes d'un graphe **qui n'est pas un
  > histogramme** (`G4`, `G7`, `G10`) sont bornés à `Q(V, 0,01)` et `Q(V, 0,99)` de la donnée
  > tracée, au sens d'`EX-DATA-62`. Les points hors bornes ne sont **jamais supprimés** : dans un
  > histogramme ils sont portés par les bins de débordement d'`EX-DATA-79` ; dans un graphe de nuée
  > ils sont tracés sur la bordure de la zone de tracé avec un marqueur de dépassement dont
  > l'effectif est affiché.
  > **Justification** : « P1 » et « P99 » n'étaient rattachés à aucune définition de quantile et
  > introduisaient deux niveaux de percentile que l'annexe A ne publie pas.

### ARB-04 — Agrégats par groupe : `GROUPSTAT`, `NTILE`, indice de dépréciation, grille prix × km

- **Constats sources** : `T-03` (BLOQUANT), `AMB-18` (MAJEUR).
- **Sévérité retenue** : **BLOQUANT**. Dix des quatorze graphes de l'écran imposé n° 2 ne sont pas
  calculables à partir des définitions écrites ; sur `G10`, les deux lectures du mot « quintile »
  donnent des effectifs `30·30·0·0·40` contre `20·20·20·20·20`.
- **Décision** : créer en annexe A une section **B.5bis « agrégats par groupe »**, source unique de
  `G5`, `G6`, `G7`, `G9`, `G10`, `G12`, `G13`, `G14`, `G15` et de l'infobulle d'`EX-SCR-149`. Sur
  `AMB-18`, la **lecture 2 (tranches de rang)** est retenue : la justification écrite d'`EX-SCR-166`
  (« les quintiles garantissent des effectifs comparables ») n'est vraie que d'elle, et une boîte à
  moustaches vide est un artefact de découpage, pas un fait de marché.
- **Annexe A — CRÉER cinq exigences.**

  > **EX-DATA-83bis — `GROUPSTAT(Σ, g, m)`.** Pour une sélection `Σ`, une **clé de groupe** `g` et
  > une métrique `m`, `GROUPSTAT` produit les groupes `G_v = { l ∈ Σ : g(l) = v }` et publie pour
  > chacun : la valeur de clé `v`, son libellé d'affichage, `listingCount(G_v)`, le **bloc
  > statistique complet d'`EX-DATA-64`** sur `V_m(G_v)`, et `n_m(G_v)` avec sa couverture au sens
  > d'`EX-DATA-61`. Les clés autorisées sont **exactement** : `fuelCategory`,
  > `priceEvaluationCategory`, `sellerType`, `countryCode`, `bodyType`, `transmission`, le bucket
  > d'année produit par `BIN` (`EX-DATA-77`, ligne Année), le rang de `NTILE(V_mileage(Σ), 5)`
  > (`EX-DATA-83ter`) et le palier de puissance d'`EX-DATA-83quater`. Aucune autre clé n'est admise
  > sans amendement de cette exigence. `INCONNU` **n'est jamais** une valeur de clé de groupe
  > (`ARB-36`) : les annonces dont `g(l)` est `INCONNU` ne forment pas de groupe et sont comptées
  > dans un compteur `unknownKeyCount` publié à côté de l'ensemble des groupes. L'ordre de
  > publication des groupes est total : `listingCount` décroissant, puis libellé croissant selon la
  > règle de comparaison unique d'`EX-DATA-70bis` (`ARB-25`), puis code de clé croissant.
  > **Justification** : neuf graphes de l'écran B demandent « la médiane et l'effectif par classe » ;
  > sans fonction unique, chaque développeur choisit sa méthode de quantile par groupe et son
  > traitement des classes inconnues, et les chiffres cessent d'être reproductibles — ce qu'`A-09`
  > interdit.

  > **EX-DATA-83ter — `NTILE(V, k)`, tranches de rang.** Soit `V^↑ = x_1 ≤ … ≤ x_n` l'échantillon
  > valide trié et `k ≥ 2`. La tranche `t ∈ [1, k]` contient les rangs `i` tels que
  > `⌈(t−1)·n/k⌉ < i ≤ ⌈t·n/k⌉` ; les tailles obtenues valent donc `⌊n/k⌋` ou `⌈n/k⌉`, et jamais
  > autre chose. Chaque tranche publie `{ rang: t, loObserved, hiObserved, count }`, où
  > `loObserved` et `hiObserved` sont les valeurs des rangs extrêmes de la tranche. Une valeur en
  > ex æquo à une frontière **reste dans la tranche de rang le plus bas** : la coupure porte sur les
  > rangs, jamais sur les valeurs, de sorte que deux annonces de même kilométrage peuvent tomber
  > dans deux tranches voisines. Si `n < k`, `NTILE` produit `n` tranches d'un élément et publie
  > `status: DEGRADED, tranches: n`. `NTILE` est **déterministe** au sens d'`EX-DATA-82` : le tri
  > est fait par valeur croissante puis par `listingId` croissant, de sorte que deux permutations du
  > même multiensemble produisent la même partition octet à octet.
  > **Justification** : « quintile » désigne dans `EX-DATA-62` une borne de quantile, dont l'emploi
  > sur un échantillon concentré produit des tranches vides ; `G10` a besoin d'effectifs
  > comparables, propriété des tranches de rang et d'elles seules.

  > **EX-DATA-83quater — paliers de puissance.** Le palier d'une annonce est `⌊powerKw / 20⌋`,
  > origine `0`, largeur fixe **20 kW**, borne haute exclusive ; son libellé est
  > `<20·k> – <20·(k+1) − 1> kW`. Les paliers vides intérieurs sont conservés (même principe
  > qu'`EX-DATA-78`) ; aucun palier n'est émis au-delà de celui de la valeur maximale observée. Une
  > annonce dont `powerKw` est `INCONNU` n'entre dans aucun palier et compte dans
  > `unknownKeyCount`.

  > **EX-DATA-83quinquies — indice de dépréciation.** Sur les groupes de
  > `GROUPSTAT(Σ, bucket d'année, price)` dont `n_price ≥ 12`, soit `y_max` le millésime **le plus
  > récent** satisfaisant ce seuil et `M(y)` la médiane de prix du groupe d'année `y`. Alors
  > `depreciationIndex(y) = 100 × M(y) / M(y_max)`, arrondi à 1 décimale, et `null` pour tout groupe
  > sous le seuil ; `annualLossPct(y) = 100 × (1 − M(y) / M(y+1))`, arrondi à 1 décimale, et `null`
  > si l'un des deux groupes est `null` ou si `y+1` est absent. La base `y_max` est **publiée** avec
  > l'indice. Aucune interpolation, aucune extrapolation, aucun lissage.
  > **Justification** : « base 100 » sans base nommée admet autant de courbes que de millésimes de
  > référence possibles, et la base doit être un groupe dont la médiane est publiable.

  > **EX-DATA-102bis — grille de densité prix × kilométrage.** La grille de `G7` réutilise sur
  > chaque axe **exactement** les bins produits par `BIN` pour la même sélection : bins de
  > `V_price(Σ)` en abscisse et bins de `V_mileage(Σ)` en ordonnée (`EX-DATA-77`), bins de
  > débordement compris. Une cellule est le produit cartésien de deux bins et publie
  > `{ priceBinIndex, mileageBinIndex, count }`. Une annonce n'entre dans la grille que si
  > `priceEur` et `mileageKm` sont tous deux valides au sens d'`EX-DATA-60` ; les autres sont
  > ventilées comme en `EX-DATA-99`, et la somme des `count` vaut exactement l'effectif éligible.
  > **Aucune grille hexagonale** : elle n'est pas dérivable des bins de `BIN` et rendrait le clic
  > sur une cellule non traduisible en filtre d'intervalle.
- **Annexe B — MODIFIER, un renvoi par graphe**, sans autre changement :
  - `EX-SCR-161` (`G5`) → « médiane, P25 et P75 par bucket d'année issus de
    `GROUPSTAT(Σ, bucket d'année, price)` (`EX-DATA-83bis`) ».
  - `EX-SCR-162` (`G6`) → « indice et perte annuelle issus d'`EX-DATA-83quinquies` ; la base est
    affichée dans le titre au format `base 100 = <y_max>` ».
  - `EX-SCR-163` (`G7`) → « cellules issues d'`EX-DATA-102bis` » ; supprimer toute mention de
    grille hexagonale.
  - `EX-SCR-165` (`G9`), `EX-SCR-167` (`G12`), `EX-SCR-168` (`G13`), `EX-SCR-170` (`G15`) →
    « classes et prix médians issus de `GROUPSTAT(Σ, <clé>, price)`, clé respectivement
    `fuelCategory`, `priceEvaluationCategory`, `sellerType`, `countryCode` ; les annonces à clé
    `INCONNU` ne forment pas de barre et sont annoncées par la note d'exclusion `EX-SCR-178` ».
  - `EX-SCR-166` (`G10`) → remplacer « 5 tranches définies par les **quintiles observés** du
    kilométrage » par « 5 tranches de rang issues de `NTILE(V_mileage(Σ), 5)` (`EX-DATA-83ter`) ;
    chaque boîte porte son effectif et ses bornes `loObserved – hiObserved`. Deux tranches
    partageant une même borne observée l'affichent toutes les deux, suivie de l'indice de tranche
    (`3/5`), de sorte qu'aucun libellé ne soit dupliqué à l'identique ».
  - `EX-SCR-169` (`G14`) → « paliers issus d'`EX-DATA-83quater` ».
  - `EX-SCR-149` → « prix médian du bucket issu de `GROUPSTAT(Σ, bucket de la métrique du graphe,
    price)` ».

### ARB-01 — Couverture d'échantillon : le champ `n_tot` est créé, sa portée sous filtre est tranchée, et le mot « couverture » cesse d'être polysémique

- **Constats sources** : `T-01` (BLOQUANT), `AMB-15` (MAJEUR, « BLOQUANT dès que le seuil `p < 20`
  bascule »), `AMB-28` (MAJEUR).
- **Sévérité retenue** : **BLOQUANT** (la plus haute du groupe). Le même écran affiche `0 %` ou
  `2 %`, un bandeau non refermable ou un feu vert, et un disque de couverture plein ou creux.
- **Déduplication assumée** : les trois constats sont **un seul défaut** en trois couches — le
  champ n'existe pas (`T-01`), sa portée sous filtre n'est pas écrite (`AMB-15`), et le mot qui le
  désigne recouvre trois grandeurs différentes dont deux partagent le seuil de 80 % (`AMB-28`).
  Résoudre l'une sans les autres laisse l'avertissement central de l'application indéterminé.
- **Décision, trois volets.**
  1. `announcedCount` est un **champ du snapshot**, jamais recalculé sous filtre.
  2. La couverture d'échantillon n'est publiée **que** pour la sélection réduite à la route ; dès
     qu'un filtre est posé, le bandeau `C3` affiche `couverture non applicable sous filtre` et ne
     prend **aucun** jeton coloré. Justification : `n_tot` vient de la source, qui ne connaît pas
     les filtres locaux ; toute mise à l'échelle serait une estimation fabriquée, et
     `EX-DATA-27`/`EX-DATA-37` interdisent déjà d'inventer une donnée absente — la lecture 2
     d'`AMB-15` produirait un pourcentage qui n'est mesuré par rien.
  3. Trois noms distincts remplacent le mot « couverture » employé seul, et le mot nu est interdit.
- **Annexe A — `EX-DATA-106`, MODIFIER** (entité `Snapshot`) : ajouter le champ
  `announcedListingCount` à la liste, avec la ligne normative :

  > `announcedListingCount` — effectif total **annoncé par la source** pour le périmètre du
  > snapshot (`listings.metadata.totalItems`), niveau de preuve `OBSERVÉ`. **Si absent :
  > `INCONNU`**, jamais `0` et jamais substitué par `listingCount`.
- **Annexe A — `EX-DATA-68` (`MakeAggregate`) et `EX-DATA-72` (`ModelAggregate`, ligne « champs
  ajoutés » de sa table de différences), MODIFIER** : ajouter à chacun le champ :

  > `announcedCount` — effectif annoncé par la source pour ce périmètre : `listings.metadata.
  > totalItems` au niveau marque, `topModels[].listingsCount` au niveau modèle. Niveau de preuve
  > `OBSERVÉ`. **Si absent : `INCONNU`.** Ce champ est une propriété du snapshot et **n'est jamais
  > recalculé sous filtre** : il est identique pour toutes les sélections d'un même snapshot.
- **Annexe A — `EX-DATA-61bis`, CRÉER** :

  > **EX-DATA-61bis — les trois couvertures, et l'interdiction du mot nu.** Trois rapports distincts
  > existent et portent trois noms qui ne sont jamais interchangeables :
  > • `sampleCoverage = listingCount / announcedCount`, arrondi à 4 décimales — **couverture
  > d'échantillon**, définie au seul niveau (marque) et (marque, modèle), `null` si
  > `announcedCount` est `INCONNU`, et **non définie sous filtre** (voir ci-dessous) ;
  > • `metricCoverage_m = n_m / N` (`EX-DATA-61`) — **couverture métrique** d'une statistique dans
  > sa sélection ;
  > • `priceQuotedShare = priceQuotedCount / listingCount` (`EX-DATA-17`) — **part de prix fermes**,
  > qui porte le seuil de 0,80 de `coverageWarning.price` et lui seul.
  > `sampleCoverage` **n'est publié que lorsque l'état de filtres est vide au sens d'`EX-SCR-27bis`**
  > (`ARB-29`) ; dès qu'un filtre est posé, il vaut `NON_APPLICABLE` et aucun consommateur ne peut
  > le substituer par un autre des trois rapports. L'emploi du mot « couverture » sans qualificatif
  > est interdit dans les quatre documents normatifs.
  > **Justification** : trois grandeurs sous un même mot, dont deux au même seuil de 80 %, ont
  > produit deux pastilles différentes pour la même zone-modèle et deux verdicts opposés sur le
  > bandeau le plus important de l'application.
- **Annexe B — `EX-SCR-31`, MODIFIER.** Texte de remplacement :

  > `EX-SCR-31` — **`C3` — bandeau de couverture d'échantillon.** Quand l'état de filtres est vide
  > (`EX-SCR-27bis`) et que `sampleCoverage` n'est pas `null`, le bandeau affiche
  > `Statistiques calculées sur <listingCount> annonces observées sur <announcedCount> annoncées —
  > couverture <p> %`, où `p = 100 × sampleCoverage` arrondi selon `EX-SCR-11`. Jeton vert si
  > `p ≥ 80`, ambre si `20 ≤ p < 80`, rouge si `p < 20` ; le bandeau est **non refermable** quand
  > `p < 20`. Deux cas sans jeton coloré et sans pourcentage :
  > • `announcedCount` est `INCONNU` → `Couverture d'échantillon inconnue — la source n'annonce pas
  > d'effectif total pour ce périmètre`. **Jamais 100 %.**
  > • au moins un filtre est posé → `Couverture d'échantillon non applicable sous filtre —
  > <listingCount> annonces observées`.
  > Le bandeau ne prend jamais `listingCount` pour `announcedCount`.
- **Annexe B — `EX-SCR-115`, MODIFIER** : l'indicateur de 8 px de la zone-modèle est piloté par
  **`sampleCoverage`** et par lui seul, aux seuils 80 % et 20 % déjà écrits ; quand `sampleCoverage`
  vaut `null` ou `NON_APPLICABLE`, le disque est remplacé par un tiret cadratin gris et son
  infobulle dit `couverture d'échantillon indisponible`. La mise en italique des trois fourchettes
  reste attachée au seul cas `sampleCoverage < 0,20`.
- **Annexe B — `EX-SCR-116`, MODIFIER** : le cas distingué devient
  `listingCount = 0 ∧ announcedCount > 0`, formulé sur les noms de champs et non sur `n_obs`/`n_tot`.
- **`POUR_COORDINATEUR`** : le glossaire § 2 de `REQUIREMENTS.md` définit « Couverture
  d'échantillon » avec les mots « pour une sélection donnée », qui créent à eux seuls la seconde
  lecture d'`AMB-15`. Recommandation : remplacer la ligne par les trois termes d'`EX-DATA-61bis`,
  et supprimer « pour une sélection donnée ».

### ARB-09 — Bornes d'intervalle : les deux bornes sont inclusives, et le clic sur une barre pose `hi − 1`

- **Constats sources** : `AMB-10` (BLOQUANT).
- **Sévérité retenue** : **BLOQUANT**. L'utilisateur clique une barre étiquetée « 87 offres » et la
  page se recalcule à 92 ou à 87 selon l'implémentation ; c'est le geste central du parcours 2.
- **Les deux lectures** : `EX-NAV-7` ne donne la sémantique que de la borne basse
  (`pricefrom=5000` → `prix ≥ 5000`) ; la borne haute n'est définie ni là, ni dans `REF-filters.md`,
  alors qu'`EX-DATA-76` fait de tout bin fermé un `[lo, hi)`.
- **Décision — bornes de filtre **inclusives**, et le clic pose `hi − 1`.** Justification : la
  convention inclusive est celle qu'un utilisateur lit dans un contrôle « de … à … », et la
  soustraction d'une unité canonique au clic est le seul moyen de garantir l'invariant vérifiable
  « l'effectif après clic est celui de la barre cliquée ».
- **Annexe C — `EX-NAV-7`, MODIFIER.** Ajouter, à la suite du texte existant :

  > Les **deux** bornes d'un intervalle sont **inclusives** : `<nom>from=a&<nom>to=b` sélectionne
  > `a ≤ x ≤ b`, `<nom>from=a` seul sélectionne `x ≥ a`, `<nom>to=b` seul sélectionne `x ≤ b`. Le
  > prédicat s'évalue sur le **champ canonique** du dictionnaire, dans son **unité canonique**
  > (`EX-DATA-4`, et `ARB-33` pour la conversion d'unité d'affichage). Pour un filtre d'année
  > (`fregfrom`/`fregto`, `modelyearfrom`/`modelyearto`), la comparaison porte sur l'**année
  > entière** (`firstRegistrationYear`, `modelYear`), **jamais** sur
  > `firstRegistrationYearMonth` : `fregto=2017` retient tous les millésimes 2017, janvier à
  > décembre. Une annonce dont le champ comparé est `INCONNU` **ne satisfait aucun** prédicat
  > d'intervalle et n'est jamais retenue par défaut.
- **Annexe B — `EX-SCR-149`, MODIFIER.** Remplacer la puce « **Clic sur une barre** → pose le
  filtre d'intervalle correspondant au bucket » par :

  > **Clic sur une barre** → pose `<x>from = lo` et `<x>to = hi − u`, où `u` est l'unité canonique
  > du champ (`1 €`, `1 km`, `1 an`) et `[lo, hi)` le bin d'`EX-DATA-76`, de sorte que l'effectif
  > affiché après recalcul soit **exactement** celui de la barre cliquée. Sur un bin de débordement
  > bas `(−∞, hi)`, seul `<x>to = hi − u` est posé ; sur un bin de débordement haut `[lo, +∞)`,
  > seul `<x>from = lo` est posé. Un test de recette du lot D4 vérifie l'égalité entre l'effectif
  > de la barre et l'effectif de la page après clic, sur les trois histogrammes et sur les deux
  > bins de débordement.
  > La même règle s'applique au **brossage horizontal** (l'intervalle posé est
  > `[lo du premier bin brossé, hi du dernier bin brossé − u]`) et au **`Ctrl` + clic**
  > (plus petit englobant, borne haute diminuée de `u`).

### ARB-10 — Intervalle inversé : permutation au chargement d'URL, refus en saisie interactive

- **Constats sources** : `AMB-11` (BLOQUANT).
- **Sévérité retenue** : **BLOQUANT**. 1 281 offres contre 5 220 pour la même URL partagée.
- **Les deux lectures** : `EX-NAV-22` échange les bornes au chargement ; `EX-SCR-68` refuse le
  filtre et interdit nommément la permutation (« elle masquerait une faute de frappe »).
- **Décision — les deux comportements survivent, avec des portées disjointes et nommées.**
  Justification : `A-09` attribue déjà l'arrivée par URL à l'annexe C et la saisie dans un contrôle
  à l'annexe B ; les deux justifications écrites sont vraies **dans leur domaine** — un lien reçu
  n'a pas d'auteur présent pour corriger sa faute de frappe, un utilisateur en train de taper l'a.
  Ce n'est donc pas un arbitrage à trancher mais une portée à écrire, ce qui n'exige pas le
  coordinateur.
- **Annexe C — `EX-NAV-22`, MODIFIER.** Texte de remplacement de la ligne :

  > Intervalle inversé reçu **dans une URL au chargement** (`pricefrom > priceto`, ou tout autre
  > couple `from`/`to`) : les deux bornes sont **échangées**, l'URL est corrigée par `replaceState`,
  > et la correction est signalée par le bandeau `ET-URL-CORRIGEE` (`ARB-11`) au format
  > `Paramètre « <nom> » corrigé : bornes interverties, intervalle retenu <a> – <b>`. Cette règle
  > **ne s'applique qu'au chargement d'une URL** : la saisie interactive dans un contrôle
  > d'intervalle est régie par `EX-SCR-68`, qui refuse le filtre et ne permute jamais. Les deux
  > comportements sont volontairement différents et cette différence est normative.
- **Annexe B — `EX-SCR-68`, MODIFIER.** Ajouter à la suite de « Aucune permutation automatique des
  bornes : elle masquerait une faute de frappe » :

  > Cette règle porte **exclusivement** sur la saisie interactive dans le contrôle. Un intervalle
  > inversé **reçu dans une URL** est permuté par `EX-NAV-22` : l'auteur d'une URL reçue n'est pas
  > présent pour corriger sa saisie, celui qui tape dans le contrôle l'est.

### ARB-11 — Valeur hors domaine : une table unique des corrections d'URL, et un bandeau nommé

- **Constats sources** : `AMB-12` (BLOQUANT), `T-22` (MINEUR).
- **Sévérité retenue** : **BLOQUANT**. `aucune offre` contre `1 281 offres` pour la même URL, et
  trois régimes de signalement pour un seul événement (« silencieusement » d'`EX-NAV-21`, message
  de 4 s d'`EX-SCR-68`, bandeau obligatoire d'`A-04`).
- **Déduplication assumée** : `T-22` (le bandeau d'`A-04` n'a ni identifiant d'état ni rang de
  pile) est la **colonne « signalement »** de la table qu'`AMB-12` demande ; les traiter séparément
  produirait une table dont la colonne renvoie à un bandeau inexistant.
- **Décision — écrêtage pour une borne numérique, retrait pour un code inconnu, et un seul régime
  de signalement.** Justification : une borne numérique hors domaine porte une intention lisible
  (« très cher »), qu'un écrêtage préserve, tandis qu'un code énuméré inconnu n'a aucun voisin
  légitime ; et le mot « silencieusement » contredit `A-04`, qui est hiérarchiquement supérieur.
- **Annexe C — `EX-NAV-21`, MODIFIER : remplacer la ligne par une table de cinq classes.**

  > | Classe de défaut à la lecture d'une URL | Correction appliquée | Signalement |
  > |---|---|---|
  > | Code énuméré absent du vocabulaire (`fuel=Z`) | la valeur est **retirée** ; les autres valeurs du même filtre sont conservées ; si le filtre devient vide, il est retiré | `ET-URL-CORRIGEE` |
  > | Borne numérique hors du domaine relevé | **écrêtée** à la borne du domaine (`REF-filters.md`) | `ET-URL-CORRIGEE` |
  > | Borne numérique non numérique ou vide (`pricefrom=`, `pricefrom=abc`) | le paramètre est **retiré** | `ET-URL-CORRIGEE` |
  > | Intervalle inversé | bornes **permutées** (`EX-NAV-22`) | `ET-URL-CORRIGEE` |
  > | Paramètre inconnu de `filters-scope.json` | **ignoré** et retiré de l'URL canonique | `ET-URL-CORRIGEE` |
  >
  > Dans tous les cas, l'URL est réécrite par `replaceState`, jamais `pushState`, et le reste de la
  > requête s'applique normalement. **Le mot « silencieusement » est supprimé** : aucune correction
  > d'URL n'est silencieuse (`A-04`, `EX-SCR-39`).
- **Annexe B — `EX-SCR-68`, MODIFIER** : remplacer « la valeur est **ramenée à la borne du domaine**
  et un message `Ramené à <valeur>` s'affiche pendant 4 s » par « la valeur est **ramenée à la
  borne du domaine** et un message inline `Ramené à <valeur>` s'affiche pendant 4 s ; à l'arrivée
  par URL, la même correction est signalée par `ET-URL-CORRIGEE` (`EX-NAV-21`) et non par ce
  message ».
- **Annexe B — `ET-URL-CORRIGEE`, CRÉER dans le catalogue d'états** (`EX-SCR-38bis`, inséré après
  `EX-SCR-38`) :

  > `EX-SCR-38bis` — **`ET-URL-CORRIGEE` — un paramètre d'URL a été corrigé au chargement.**
  > Bandeau non bloquant, refermable, texte
  > `Paramètre « <nom> » corrigé : <nature de la correction>, valeur retenue <valeur>` ; une ligne
  > par paramètre corrigé, au plus trois lignes puis `et <k> autres paramètres corrigés`. Il
  > s'insère dans l'ordre de priorité d'`EX-SCR-38` **entre `ET-TROP-RESULTATS` et
  > `C3 couverture`**. Durée de vie : il disparaît au prochain changement de filtre par
  > l'utilisateur, jamais avant, et n'est pas restauré par un retour arrière vers la même URL
  > corrigée.
- **Dépendance** : le plafond de deux bandeaux d'`EX-SCR-38` est amendé par `ARB-32` ; l'agent
  d'application traite `ARB-32` avant d'insérer ce rang.

### ARB-42 — Cycle de vie du jeu de données local face aux filtres de classe `T`

- **Constats sources** : `T-08` (BLOQUANT).
- **Sévérité retenue** : **BLOQUANT**. Sans réponse, la promesse d'`EX-SCR-32` (« les agrégats
  restent calculés sur la population entière ») n'a pas de référent, les facettes `R` d'`EX-SCR-90`
  changent de dénominateur, `EX-SCR-37` suppose un jeu local que rien ne définit, et le cache LRU
  d'`EX-DATA-109` est clefé sans distinguer `R` de `T`.
- **Décision — l'état de filtres est scindé en deux composantes, et tout effectif est explicitement
  relatif au jeu de données local.** Justification : c'est la seule construction qui rende
  simultanément vraies les trois exigences déjà écrites (`EX-SCR-32`, `EX-SCR-37`, `EX-DATA-109`)
  sans en amender aucune sur le fond.
- **Annexe C — CRÉER une section B.2bis « Composantes de l'état de filtres », quatre exigences.**

  > **EX-SRCH-9bis — scission de l'état de filtres.** L'état de filtres se décompose en deux
  > composantes disjointes et exhaustives : la **composante `T`**, formée des valeurs de tous les
  > filtres de classe `T` (`EX-SCR-57`), et la **composante `R`**, formée des valeurs de tous les
  > filtres de classe `R`. La composante `T` détermine le **jeu de données local** ; la composante
  > `R` s'applique **en mémoire** sur ce jeu, sans aucun accès réseau.

  > **EX-SRCH-9ter — `localDatasetKey` et acquisition.** La composante `T` est sérialisée selon la
  > règle canonique d'`EX-DATA-108` et hachée en `localDatasetKey`. À chaque valeur distincte de
  > `localDatasetKey` correspond **un appel `DataProvider` et un seul**, dont la réponse
  > **remplace** intégralement le jeu de données local — jamais de fusion, jamais d'union avec un
  > jeu précédent. Les réponses sont conservées dans un cache clefé par
  > `(snapshotId, localDatasetKey)`, de 4 entrées au plus, en éviction LRU. Le **retrait** d'un
  > filtre `T` produit une nouvelle `localDatasetKey`, donc un nouvel appel, servi par le cache
  > s'il y est présent. La composante `T` vide a pour clé la chaîne réservée `FULL`, qui désigne le
  > snapshot complet.

  > **EX-SRCH-9quater — tout chiffre est relatif au jeu local.** Tout effectif, toute facette
  > (`EX-SCR-90`), tout agrégat, tout bucket et tout verdict d'outlier est calculé **sur le jeu de
  > données local courant**, jamais sur le snapshot complet quand celui-ci n'est pas le jeu local.
  > Conséquence normative sur `EX-SCR-32` : « la population entière » y désigne le **jeu de données
  > local courant**, et non le snapshot. Dès que la composante `T` n'est pas vide, le bandeau `C3`
  > affiche en outre `Jeu de données restreint par <k> filtre(s) rechargé(s) — <n> annonces`, de
  > sorte qu'aucun chiffre ne soit présenté sans son périmètre (`EX-SCR-39`).

  > **EX-SRCH-9quinquies — décomposition de `selectionHash`.** `selectionHash` est le couple
  > `(localDatasetKey, refineHash)`, où `refineHash` est le hachage canonique de la seule
  > composante `R`. Le cache LRU de 32 entrées d'`EX-DATA-109` est clefé par ce couple ; une entrée
  > dont la `localDatasetKey` est évincée du cache de jeux locaux est évincée avec elle. Deux états
  > de filtres qui ne diffèrent que par leur composante `R` partagent donc leur jeu de données et
  > jamais leurs agrégats.
- **Annexe A — `EX-DATA-108`, MODIFIER** : ajouter « `selectionHash` est publié sous la forme
  `<localDatasetKey>:<refineHash>` (`EX-SRCH-9quinquies`) ; la sélection vide a pour hachage
  `FULL:EMPTY` ».
- **Annexe A — `EX-DATA-109`, MODIFIER** : ajouter à la ligne du cache LRU « clefé par
  `(localDatasetKey, refineHash)` ; l'interdiction de précalculer une sélection filtrée ne porte
  pas sur le jeu de données local, dont la mise en cache est exigée par `EX-SRCH-9ter` ».
- **Annexe B — `EX-SCR-37`, MODIFIER** : ajouter « hors ligne, le jeu de données local courant est
  celui de la dernière `localDatasetKey` servie ; les filtres de classe `T` sont désactivés parce
  qu'ils exigeraient une nouvelle `localDatasetKey`, et les filtres `R` restent actifs parce
  qu'ils s'appliquent en mémoire sur ce jeu (`EX-SRCH-9bis`) ».

### ARB-15 — Inclusion dans les agrégats : `EX-DATA-16`/`EX-DATA-60` font foi, `EX-SCR-36` et `EX-SCR-95` sont alignés

- **Constats sources** : `ADV-04` (BLOQUANT), `AMB-14` (BLOQUANT).
- **Sévérité retenue** : **BLOQUANT**. Deux médianes différentes pour la même sélection
  (`ADV-04` : une annonce à 1 € dans l'histogramme ou hors de lui) et **1 234 contre 1 281 offres
  dans l'état par défaut de l'application** (`AMB-14`), c'est-à-dire sur le premier chiffre que
  voit tout utilisateur.
- **Déduplication assumée** : les deux constats visent le même couple d'exigences d'écran
  (`EX-SCR-36`, `EX-SCR-95`) contre le même couple d'exigences de données (`EX-DATA-16`,
  `EX-DATA-60`). `ADV-04` attaque l'**inclusion** d'un prix bas dans l'agrégat, `AMB-14` la
  **nature** des commutateurs qui prétendent l'écarter. Une seule réécriture les lève tous les
  deux ; deux réécritures séparées se contrediraient.
- **Décision — un effectif compte tout, une statistique de prix exclut selon `EX-DATA-60`, et un
  commutateur d'écran n'est jamais un filtre.** Justification : `EX-DATA-16(a)` porte la seule
  formulation qui ne mente sur aucun des deux chiffres, et `A-09` donne l'exclusion métrique à
  l'annexe A.
- **Annexe B — `EX-SCR-36`, MODIFIER.** Remplacer les trois puces par :

  > - `prices.public.onRequestOnly = true` → afficher `Prix sur demande`. L'annonce **compte dans
  >   tout effectif** (`EX-DATA-16(a)`) et est **exclue de toute statistique de prix**, de
  >   l'histogramme des prix, des deux méthodes de détection et du nuage (`EX-DATA-16(b)` à
  >   `(e)`) ; elle est comptée dans la note `<k> annonces à prix sur demande`.
  > - prix absent, ou prix rejeté par la validation du champ 7 → traité comme
  >   `ET-CHAMP-MANQUANT`, compté dans l'effectif, exclu des statistiques de prix.
  > - prix **strictement inférieur à 250 €** (`EX-DATA-19`, seuil unique de l'application) →
  >   l'annonce porte `PRICE_SENTINEL_ABSOLUTE`, **compte dans tout effectif**, et est **exclue de
  >   `V_price`** au sens d'`EX-DATA-60` : elle n'entre ni dans la médiane, ni dans `G1`, ni dans
  >   M1, ni dans M2. Elle **reste visible** : jeton `?` cliquable ouvrant l'infobulle
  >   `Prix inférieur à 250 € — probable annonce de pièce ou erreur de saisie ; exclue des
  >   statistiques de prix, comptée dans l'effectif`, et elle apparaît dans la liste d'annonces de
  >   l'écran D. **Le seuil de 100 € est supprimé de cette exigence** : il n'existe plus qu'un seul
  >   seuil de sentinelle absolue dans l'application.
  > La phrase « Il reste dans l'agrégat : l'écarter reviendrait à masquer précisément l'anomalie
  > recherchée » est **supprimée** : l'anomalie reste visible par la liste et par le jeton, pas par
  > sa contribution à une médiane qu'elle fausse.
- **Annexe B — `EX-SCR-95`, MODIFIER.** Texte de remplacement de l'exigence entière :

  > `EX-SCR-95` — **Deux réglages d'assainissement, propres à KYCAR** et absents du catalogue
  > AutoScout24, placés en fin du groupe `Prix et valeur` sous le titre
  > `Assainissement KYCAR (hors AutoScout24)`. **Ces deux réglages ne sont pas des filtres : ils ne
  > modifient jamais l'effectif d'une sélection (`EX-DATA-16(a)`) et n'agissent que sur
  > l'échantillon valide `V_price` au sens d'`EX-DATA-60`.** Libellés normatifs :
  > • `Exclure des statistiques de prix : les annonces à prix sur demande` — **défaut : actif**,
  >   sans effet observable puisque `EX-DATA-16(b)` l'impose déjà inconditionnellement ; le réglage
  >   est présent pour être **explicite**, et le désactiver est impossible (contrôle affiché
  >   coché et désactivé, infobulle `imposé par EX-DATA-16`).
  > • `Exclure des statistiques de prix : les prix sous le seuil de sentinelle (250 €)` —
  >   **défaut : actif**, conformément à `EX-DATA-60`. Le décocher **réintègre** dans `V_price` les
  >   annonces portant `PRICE_SENTINEL_ABSOLUTE`, et fait alors apparaître le bandeau
  >   `Statistiques de prix incluant les prix sentinelles — lecture non standard`.
  > Ils sont visuellement séparés par un filet et par la mention `Ces deux réglages sont propres à
  > KYCAR` ; ils ne comptent jamais dans le badge de filtres actifs (`R-A01`).
- **Annexe A — `EX-DATA-60`, MODIFIER** : ajouter sous la table « Les deux réglages d'`EX-SCR-95`
  sont les **seuls** paramètres utilisateur de cette table ; aucun autre contrôle d'écran ne peut
  ajouter ni retirer une condition d'exclusion. La ligne `price` est mise à jour par `ARB-13`. »

### ARB-17 — Le symbole `n` d'`EX-SCR-33` est `n_m`, et les paliers sont alignés sur 12 et 30

- **Constats sources** : `AMB-03` (BLOQUANT), `ADV-06` (BLOQUANT).
- **Sévérité retenue** : **BLOQUANT**. La même zone-modèle affiche `méd. 17 400 €` ou
  `n trop faible` (`AMB-03`) ; et à `n = 10` ou `11`, `EX-SCR-33` promet une régression que M1
  (`≥ 12`) et M2 (`≥ 30`) interdisent (`ADV-06`).
- **Déduplication assumée** : `AMB-03` porte sur le **dénominateur** (`N` ou `n_m`), `ADV-06` sur
  les **valeurs** des paliers. Les deux se règlent dans la même exigence et un correctif isolé
  laisserait l'autre moitié fausse — c'est le seul endroit du corpus où les seuils d'effectif sont
  déclarés « uniques pour toute l'application ».
- **Décision — `n` désigne `n_m(Σ)`, jamais `N` ; et un quatrième palier est introduit.**
  Justification : `EX-DATA-61` interdit de publier une statistique sans son effectif `n_m`, et
  `EX-DATA-80` emploie déjà `n = |V|` — c'est la seule lecture cohérente avec l'annexe A, à qui
  `A-09` attribue les seuils d'effectif.
- **Annexe B — `EX-SCR-33`, MODIFIER.** Texte de remplacement de l'exigence entière :

  > `EX-SCR-33` — **`ET-EFFECTIF-FAIBLE` — effectif insuffisant pour une statistique.**
  > **Dans toute cette exigence, `n` désigne `n_m(Σ)` au sens d'`EX-DATA-59` pour la métrique de la
  > statistique concernée — jamais l'effectif de sélection `N`, qui n'est soumis à aucun palier et
  > s'affiche toujours tel quel.** Quatre paliers, appliqués uniformément :
  > - `n = 0` → la statistique n'est pas affichée ; à sa place, le caractère `—` en gris.
  > - `1 ≤ n ≤ 4` → les valeurs brutes sont affichées, mais **aucun percentile, aucune médiane,
  >   aucune bande interquartile, aucune régression, aucune détection d'outlier** ; à leur place, la
  >   mention `n trop faible` et l'effectif exact.
  > - `5 ≤ n ≤ 11` → médiane, min et max affichés ; percentiles `P5`/`P95`, bande interquartile,
  >   régression et détection d'outliers **désactivés** ; jeton ambre `n = <n>` accolé au titre.
  > - `12 ≤ n ≤ 29` → tout est calculé **sauf** la méthode M2 et tout ce qui en dépend : `G8`, le
  >   prix attendu, `expectedPriceEur`, la colonne « Écart au prix attendu » de l'écran D et le
  >   liseré d'`EX-SCR-207`. Seule **M1** est disponible (`EX-DATA-84` à `EX-DATA-89`) ; l'écran
  >   affiche `Prix attendu non calculable — il faut au moins 30 offres comparables`.
  > - `n ≥ 30` → tout est calculé, M1 et M2 comprises.
  > Ces seuils sont **uniques pour toute l'application**, valent 12 pour M1 et 30 pour M2
  > conformément à `EX-DATA-86` et `EX-DATA-90`, et sont testables par jeux de données de tailles
  > 0, 1, 3, 5, 9, 11, 12, 29 et 30.
- **Annexe B — `EX-SCR-33`, cohérence de libellés** : `P10`/`P90` deviennent `P5`/`P95` par
  `ARB-20` ; l'agent d'application applique `ARB-20` avant de figer ce texte.
- **Annexe B — propagation** : partout où une exigence d'écran écrit `n` sans qualificatif à propos
  d'un seuil (notamment `EX-SCR-150`, `EX-SCR-164`, `EX-SCR-165`, `EX-SCR-166`), remplacer par
  `n_m` en nommant la métrique.

### ARB-13 — Prix sentinelle : `R-A06` est écrit dans l'annexe A, en deux drapeaux à deux étages

- **Constats sources** : `T-07` (BLOQUANT), `AMB-25` (BLOQUANT).
- **Statut** : **`RÉSOLU_PAR_COORDINATEUR`** — `ARBITRAGES-req-lead.md` § `R-A06` tranche le fond
  (deux drapeaux, deux étages, aucune rétroaction, ordre `filtrer l'absolu → médiane → marquer le
  relatif`). Cet arbitre ne re-arbitre pas ; il énumère les éditions d'annexe qui en découlent, que
  `T-07` réclamait précisément.
- **Sévérité retenue** : **BLOQUANT** (l'écriture manquante suffit à bloquer : la médiane publiée
  vaut 9 750 € ou 10 000 € et le minimum brut 900 € ou 9 000 € selon l'ordre des opérations).
- **Annexe A — `EX-DATA-45`, MODIFIER** (vocabulaire `KYCAR_INGEST_FLAG`) : renommer
  `SUSPECT_PRICE_FLOOR` en **`PRICE_SENTINEL_ABSOLUTE`**, le vocabulaire restant à **14** codes ;
  ajouter la note « `PRICE_IMPLAUSIBLE_IN_CELL` n'appartient **pas** à ce vocabulaire : c'est un
  verdict d'analyse, jamais un drapeau d'ingestion (`R-A06`) ».
- **Annexe A — `EX-DATA-19`, MODIFIER.** Texte de remplacement :

  > **EX-DATA-19 — les deux règles de prix sentinelle, à deux étages, sans rétroaction.**
  > (1) **`PRICE_SENTINEL_ABSOLUTE`** — étage **ingestion**, posé une fois par annonce :
  > `priceEur < 250`. Ne dépend de rien d'autre que l'annonce ; stocké dans `ingestFlags`.
  > (2) **`PRICE_IMPLAUSIBLE_IN_CELL`** — étage **analyse**, recalculé par cellule et par
  > sélection, **jamais stocké dans `ingestFlags`** : `priceEur < 0,10 × médianeRéf(C)`, où
  > `médianeRéf(C) = Q(V_price(C) privé des seules annonces portant PRICE_SENTINEL_ABSOLUTE, 0,50)`.
  > `PRICE_IMPLAUSIBLE_IN_CELL` **n'entre jamais** dans le calcul de `médianeRéf`. Le calcul est en
  > **un seul passage** — `filtrer l'absolu → médiane → marquer le relatif` — et **aucune
  > itération, aucune recherche de point fixe** n'est autorisée. La règle relative **ne s'applique
  > pas** quand `n_price(C) < 12` après retrait des sentinelles absolues ; la cellule `C` est celle
  > d'`EX-DATA-86`.
  > **Effectifs et statistiques** : les deux drapeaux **comptent** dans tout effectif (une annonce
  > à prix absurde reste une offre du marché) et sont **tous deux exclus** de `V_price`.
  > **Étiquetage** : parce que `PRICE_IMPLAUSIBLE_IN_CELL` dépend de la sélection, tout affichage
  > qui s'en prévaut nomme sa cellule au sens d'`A-07` et de `ARB-47`.
  > **Justification** : reprise de `R-A06` — le seuil absolu attrape le prix-placeholder, le seuil
  > relatif le prix crédible mais absurde dans son segment ; les deux étages suppriment la
  > circularité de la rédaction initiale.
- **Annexe A — `EX-DATA-60`, MODIFIER** : ligne `price` remplacée par
  « `priceStatus ≠ QUOTED` **ou** `ingestFlags ∋ PRICE_SENTINEL_ABSOLUTE` **ou**
  `PRICE_IMPLAUSIBLE_IN_CELL(C)` pour la cellule `C` du calcul en cours ; ce troisième terme
  n'existe que dans un calcul de cellule et n'a pas de sens au niveau du snapshot ».
- **Annexe A — `EX-DATA-87`, MODIFIER** : ajouter `implausibleInCellCount` aux valeurs publiées avec
  chaque verdict de cellule, de sorte que l'écran puisse afficher combien d'annonces la cellule a
  écartées à ce titre.
- **Annexe A — propagation** : toute occurrence de `SUSPECT_PRICE_FLOOR` dans l'annexe A
  (`EX-DATA-16`, `EX-DATA-60`, `EX-DATA-99` motif `suspectValue`, rapport d'ingestion) est renommée
  `PRICE_SENTINEL_ABSOLUTE`. L'agent d'application produit la liste des occurrences trouvées dans
  son journal.
- **Annexe B** : `EX-SCR-36` et `EX-SCR-95` sont alignés par `ARB-15`, qui supprime le seuil de
  100 €.

### ARB-19 — Fourchettes : `R-A05` est répercutée dans les annexes A et B

- **Constats sources** : `ADV-02` (MAJEUR), `ADV-03` (MAJEUR), `AMB-20` (BLOQUANT), `T-14` (MAJEUR).
- **Statut** : **`RÉSOLU_PAR_COORDINATEUR`** — `ARBITRAGES-req-lead.md` § `R-A05` fixe la portée
  exacte du mot « toujours », emplacement par emplacement. Cet arbitre ne re-arbitre pas.
- **Sévérité retenue** : **BLOQUANT** (la plus haute du groupe, `AMB-20` : un histogramme à 17
  barres contre un histogramme à 2 barres pour la même sélection).
- **Déduplication assumée** : `T-14` (pas d'emplacement pour la fourchette brute dans la
  zone-modèle), `ADV-02` (étiquette « prix min – prix max » sur la carte-marque), `ADV-03` (aucun
  `[min, max]` sur l'écran B) et `AMB-20` (portée du mot « toujours ») sont **les quatre faces d'un
  arbitrage non répercuté**. Une seule table de portée les couvre.
- **Éditions découlant de `R-A05`.**
  - **Annexe B — `EX-SCR-109`, MODIFIER.** Ligne 2 du résumé de marque remplacée par :
    > ligne 2 — `<borne basse> – <borne haute> €  |  <année min> – <année max>` (formats
    > `EX-SCR-4` et `EX-SCR-6`), où les deux bornes de prix sont celles de `displayRange`
    > (`[p05, p95]`, `EX-DATA-69`) et **jamais** `[min, max]`. La fourchette porte le suffixe
    > normatif `(90 % des offres)`. Le libellé secondaire, en 11 px gris, affiche
    > `du moins cher au plus cher : <min> – <max> €` à partir de `rawRange`. Les variables de ce
    > gabarit ne s'appellent plus `prix min`/`prix max`.
  - **Annexe B — `EX-SCR-113`, MODIFIER.** L'élément 4 devient :
    > 4. **Fourchette de prix** — `displayRange` au format `EX-SCR-4`, suivie du suffixe
    >    `(90 % des offres)`. La fourchette brute `rawRange` est portée par l'**infobulle** de cet
    >    élément, au format `du moins cher au plus cher : <min> – <max> €`, et ne consomme aucune
    >    hauteur : la bande reste à 72 px et la liste des neuf éléments reste close.
  - **Annexe B — `EX-SCR-142`, MODIFIER.** Ligne 1 de l'en-tête de l'écran B complétée :
    > ligne 1 — `<MARQUE> <MODÈLE>` puis, séparés par des barres verticales : `<n> offres`,
    > `médiane <prix> €`, `P25 <prix> €`, `P75 <prix> €`, **`min <prix> € – max <prix> €`**. Cette
    > cinquième donnée est `rawRange.price` (`EX-DATA-68`), affichage **obligatoire** (`R-A05`),
    > étiquetée `du moins cher au plus cher`. Elle n'est jamais écrêtée, jamais remplacée par
    > `[p05, p95]`, et jamais masquée à un régime responsive.
  - **Annexe B — `EX-SCR-4`, MODIFIER** : ajouter « ce format ne décide **pas** quelles bornes il
    met en forme : l'écran A met en forme `displayRange`, les écrans B et D `rawRange` (`R-A05`) ».
  - **Annexe A — `EX-DATA-69`, MODIFIER** : ajouter « `displayRange` n'apparaît **que** sur l'écran
    A, et **jamais sans être nommé comme intervalle central** (`(90 % des offres)`). Les écrans B et
    D et l'export CSV publient `rawRange`, sans écrêtage. Les bornes d'axe des histogrammes ne sont
    pas des fourchettes et ne portent aucune étiquette de fourchette (`R-A05`, `ARB-05`). »
- **Ce que la révision `R-A05` ne dit pas et qui est tranché ici** : sur l'écran D, la colonne
  « fourchette » n'existe pas ; seule la valeur unitaire de l'annonce est affichée, donc aucune
  édition n'est requise sur `EX-SCR-203` à ce titre.

### ARB-02 — Périmètre des filtres : `R-A01` est répercutée, et les 7 filtres non exposés sont identifiés

- **Constats sources** : `T-02` (BLOQUANT), `AMB-33` (BLOQUANT).
- **Statut** : **`RÉSOLU_PAR_COORDINATEUR`** — `R-A01` définit trois termes (`RETENU` = 77,
  `EXPOSÉ` = doit valoir 77, `PRIMAIRE` = 9 contrôles / 13 paramètres), déclare `EXPOSÉ = RETENU`,
  admet un seul écart (`atype`, fixé à `C`), et fixe le badge sur les filtres **actifs**.
- **Sévérité retenue** : **BLOQUANT**. Le badge affiche 55, 64 ou 92 selon la lecture, et le
  périmètre testé du livrable le plus littéralement demandé n'était pas déterminé.
- **Vérification faite par cet arbitre** : `data/reference/filters-scope.json` a été relu —
  101 entrées, `totalRetenus = 77`, `totalExclus = 24`, et `damaged_listing`, `page`, `size`,
  `lat`, `lon`, `tradeIn`, `region`, `dlv_max` figurent bien parmi les **retenus**, tandis que
  `adage` figure parmi les **exclus** (motif `TELEMETRIE_AS24`). Les deux cas litigieux relevés par
  `T-02` sont donc déjà tranchés par le fichier normatif : `adage` est **exclu**,
  `damaged_listing` est **retenu**.
- **Éditions découlant de `R-A01`.**
  - **Annexe B — `EX-SCR-82`, MODIFIER.** La table devient la table d'**exposition** et porte
    désormais deux colonnes non interchangeables : `perimetre ∈ {RETENU, EXCLU}`, recopiée de
    `filters-scope.json` sans retouche, et `exposition ∈ {PRIMAIRE, SECONDAIRE, DESACTIVE,
    NON_EXPOSE}`. Contrainte inscrite dans l'exigence :
    > Tout filtre `perimetre = RETENU` a `exposition ≠ NON_EXPOSE`, à la **seule** exception
    > d'`atype`, déclarée nommément. La classe `X` (« hors périmètre, absent du DOM ») est
    > **supprimée** de cette table : elle confondait périmètre et exposition. Les cinq filtres
    > précédemment classés `X` — `atype`, `cat`, `mcat`, `page`, `size` — reçoivent :
    > `atype` → `NON_EXPOSE` (écart déclaré) ; `cat`, `mcat` → `SECONDAIRE`, groupe
    > `Véhicule (taxonomie)` ; `page`, `size` → `SECONDAIRE`, groupe `Liste d'annonces`, exposés
    > sur l'écran D uniquement et sérialisés (`A-02` fait exister la sous-vue).
  - **Annexe B — `EX-SCR-83`, MODIFIER.** Le bilan arithmétique devient :
    > 77 `RETENU` dont 76 `EXPOSÉ` (13 paramètres primaires, le reste secondaire ou désactivé) et
    > 1 `NON_EXPOSE` déclaré (`atype`) ; 24 `EXCLU`. Total catalogue : 101. Le test de complétude
    > compare `filters-scope.json` à cette table sur les deux colonnes, **échoue** si un `RETENU`
    > est `NON_EXPOSE` hors `atype`, et **échoue** si un filtre non exclu n'a pas exactement un
    > type de contrôle (`ARB-53`).
  - **Annexe B — `EX-SCR-91`, MODIFIER.** Le compteur du bouton de dépliement compte les filtres
    **actifs** :
    > **Compteur du bandeau replié** : il affiche le nombre de filtres **posés par l'utilisateur à
    > une valeur autre que leur défaut relevé**, et non le nombre de filtres disponibles
    > (`R-A01`). Format `<k> filtres actifs`, absent du DOM quand `k = 0`. Sa valeur est
    > **calculée** ; le `[+ 92]` de la maquette d'`EX-SCR-55` est supprimé et remplacé par
    > `[3 filtres actifs]` à titre d'illustration.
  - **Annexe C — § A.2.2, SUPPRIMER la table des 101 filtres** et la remplacer par :
    > La liste normative des filtres, leur périmètre et leur exposition sont portés par
    > `data/reference/filters-scope.json`, généré et vérifié par
    > `scripts/build-filter-scope.mjs` (`A-01`, `R-A01`). Aucune table de portée n'est tenue en
    > prose dans cette annexe. Les exigences `EX-NAV-*` d'encodage s'appliquent aux **77** filtres
    > retenus.
- **Résorption de l'écart `EXPOSÉ` / `RETENU`** : traitée par `ARB-65`, qui la règle par une **règle
  générative** dérivée des champs `type` et `group` de `filters-scope.json`, et non par une
  énumération que cet arbitre aurait dû établir par jugement. Ce point n'est donc **pas** laissé
  ouvert.
- **`POUR_COORDINATEUR`, un point.** `REQUIREMENTS.md` § 6 porte encore « Bilan clos :
  13 + 52 + 3 + 2 + 31 = 101 », arithmétique de l'ancienne classe `X`. Recommandation : la
  remplacer par le bilan d'`EX-SCR-83` ci-dessus.

### ARB-59 — La zone-modèle `modelId = 0` : une route dédiée, pas un clic vers un écran d'erreur

- **Constats sources** : `ADV-14` (BLOQUANT).
- **Sévérité retenue** : **BLOQUANT**. L'application invite explicitement à cliquer un élément dont
  le clic mène, par une autre règle normative du même corpus, à un écran d'erreur.
- **Décision — une route dédiée, et pas de zone non cliquable.** Justification : `EX-DATA-72` crée
  la clé réservée `j = 0` précisément pour ne pas perdre les annonces non résolues ; les rendre
  inaccessibles annulerait cette décision, alors qu'un modèle non résolu est un cas que le panneau
  Diagnostic doit pouvoir instruire.
- **Annexe C — `EX-NAV-20`, MODIFIER.** Ajouter une exception nommée :
  > **Exception unique** : `modelId = 0` est la clé réservée « Modèle non identifié »
  > (`EX-DATA-72`) et **n'est jamais traitée comme un modèle inconnu**. La route
  > `/marche/:makeId-:makeSlug/0-modele-non-identifie` est valide et sert l'écran B en **mode
  > restreint** défini par `EX-SCR-113bis`. Toute autre valeur de `modelId` n'appartenant pas à
  > `makeId` produit l'écran d'erreur.
- **Annexe B — `EX-SCR-113bis`, CRÉER** :
  > `EX-SCR-113bis` — **Écran B en mode « Modèle non identifié ».** Atteint par
  > `modelId = 0`. L'en-tête statistique affiche `<MARQUE> · Modèle non identifié` et le bandeau
  > non refermable `Ces annonces n'ont pas pu être rattachées à un modèle du référentiel — les
  > distributions par modèle ne s'appliquent pas`. Les graphes `G1`, `G2`, `G3`, `G4`, `G9`, `G13`,
  > `G15` sont rendus ; `G5`, `G6`, `G8`, `G10`, `G14` sont **absents du DOM**
  > (`ET-CHAMP-ABSENT-SOURCE`, `EX-SCR-35`), leur motif étant listé au panneau Diagnostic. La
  > détection d'outlier démarre l'échelle de repli à `C₃ = Σ` : `C₁` et `C₂` exigent un `modelId`
  > résolu. Le bouton `Comparer` est désactivé, infobulle `un modèle non identifié ne peut pas être
  > comparé`.
- **Annexe B — `EX-SCR-113`, MODIFIER** : ajouter « la zone-modèle de clé réservée `modelId = 0`
  reste **entièrement cliquable** et mène à l'écran B en mode restreint (`EX-SCR-113bis`) ; son nom
  affiché est `Modèle non identifié` et son slug canonique `modele-non-identifie` ».
- **Annexe A — `EX-DATA-72`, MODIFIER** : ajouter « la clé réservée `j = 0` porte le libellé
  canonique `Modèle non identifié` et le slug `modele-non-identifie`, de sorte que la route de
  l'écran B soit constructible (`EX-NAV-20`, `ARB-40`) ».

### ARB-55 — Enveloppe mémoire : les deux erreurs sont réelles, mais l'une n'est pas celle qu'`ADV-08` décrit

- **Constats sources** : `ADV-08` (MAJEUR), `ADV-09` (MAJEUR).
- **Sévérité retenue** : **MAJEUR**. Une exigence non fonctionnelle chiffrée dont la conclusion
  normative (« interdit de conclure que la borne haute de H5 oblige à une architecture serveur »)
  repose sur un total faux n'est pas vérifiable en recette.
- **Recalcul fait par cet arbitre, comme demandé.**
  - **`ADV-08` — fondé, mais mal qualifié.** `Int32Array(5·10⁶)` occupe bien
    `5 000 000 × 4 = 20 000 000` octets ≈ **19,1 Mio**, et non 4 Mo : le facteur 5 est exact.
    **Mais** `EX-DATA-112` ajoute « alloué paresseusement **sur la plage observée du snapshot** » :
    4 Mo correspond exactement à une plage observée de `10⁶ €` (`10⁶ × 4 = 4·10⁶` octets). Le
    document n'est donc pas victime d'une erreur arithmétique mais d'un **chiffre de cas typique
    présenté comme le chiffre de la structure qu'il vient de nommer**. La correction n'est pas
    « remplacer 4 par 20 » : c'est publier les deux, avec leur formule. L'agent d'`ADV-08` s'est
    trompé sur la nature du défaut, pas sur le calcul — je le dis explicitement.
  - **`ADV-09` — fondé, arithmétique confirmée.** La zone de texte pèse
    `180 × 10⁶ = 180 · 10⁶` octets ≈ **171,7 Mio** à `N = 10⁶`, et elle ne peut pas être incluse
    dans les « 44 Mo de colonnes » : la somme des colonnes numériques et énumérées d'`EX-DATA-119`
    vaut ≈ 71 octets/ligne **avec** `listingId`, soit ≈ 55 octets/ligne sans lui — l'ordre de
    grandeur des 44 Mo, et non des 224 Mo qu'il faudrait pour absorber le texte. Le poste est
    **absent** du total.
  - **Total recalculé** : `44` (colonnes) `+ 16` (identifiants) `+ 172` (texte) `+ 20` (tampon prix,
    pire cas) `+ 6` (tampon km) `+ 0,001` (tampon année) `+ 1,7` (agrégats) `+ 1` (référentiels)
    `+ 13` (cache) ≈ **274 Mo**, soit une marge de **facteur 1,9** sous 512 Mo, et non 5. Avec le
    tampon de prix au cas typique (4 Mo), ≈ **258 Mo**, facteur 2,0. La conclusion normative reste
    vraie ; son chiffre ne l'était pas.
- **Décision** : corriger les deux postes, publier le pire cas **et** la formule du cas observé, et
  requalifier la marge. Aucune architecture n'est modifiée : le total corrigé passe toujours sous
  le budget d'onglet.
- **Annexe A — `EX-DATA-112`, MODIFIER.** Texte de remplacement de l'exigence entière :

  > **EX-DATA-112 — mémoire de travail.** Tampons de comptage réutilisés entre appels et remis à
  > zéro sur la seule plage touchée. Le tampon de prix est un `Int32Array` alloué **sur la plage
  > observée du snapshot** : sa taille est `4 × (maxPriceObservé − minPriceObservé + 1)` octets,
  > soit ≈ **4 Mo** pour une plage observée de `10⁶ €` et **20 Mo au pire cas**, quand la plage
  > observée couvre le domaine entier `[1, 5·10⁶]` d'`EX-DATA-111`. Le tampon de kilométrage suit
  > la même règle : ≈ **6 Mo** au pire cas (`1,5·10⁶ × 4`). Le tampon d'année : 808 octets.
  > **Enveloppe totale à `N = 10⁶`, pire cas** : 44 Mo de colonnes numériques et énumérées
  > + 16 Mo d'identifiants + **172 Mo de zone de chaînes** (`EX-DATA-121`, ≈ 180 octets par ligne)
  > + 26 Mo de tampons + 1,7 Mo d'agrégats de base + 1 Mo de référentiels + 13 Mo de cache
  > ≈ **274 Mo**.
  > **Justification** : l'enveloppe tient avec une marge d'un **facteur 1,9** sous un budget
  > d'onglet de 512 Mo. La marge est suffisante pour le moteur de rendu et interdit toujours de
  > conclure que la borne haute de H5 oblige à une architecture serveur, mais elle ne laisse **pas**
  > de place à un second snapshot en mémoire — ce qui est la raison normative du « un seul snapshot
  > actif à la fois » de `ARB-49`. Le poste dominant est la zone de chaînes : c'est lui, et non les
  > colonnes numériques, qu'une optimisation devrait viser en premier
  > (`listingUrl` étant reconstructible à partir de `listingId` chez la plupart des sources).
- **Annexe C — `EX-NFR` § D.1, MODIFIER** : si une exigence non fonctionnelle chiffre la mémoire,
  aligner sa valeur sur 274 Mo et sur le facteur 1,9. L'agent d'application vérifie § D.1 et § D.3
  et consigne dans son journal s'il n'y trouve aucune valeur à corriger.

## 2.2 Décisions relevant principalement de l'annexe A

### ARB-14 — Ordre normalisation → validation, bornes inclusives

- **Constats sources** : `AMB-29` (MAJEUR).
- **Sévérité retenue** : **MAJEUR**. Le minimum brut affiché passe de `250 €` à `9 000 €` selon
  l'ordre ; le défaut est systématique sur tout champ dont la normalisation est un arrondi et la
  validation une borne à la même précision.
- **Les deux lectures** : normalisation puis validation (ordre des colonnes d'`EX-DATA-2`) contre
  validation sur la valeur reçue.
- **Décision — normalisation puis validation**, l'ordre des colonnes étant celui du document et le
  seul qui garantisse qu'une borne s'entende dans l'unité canonique.
- **Annexe A — `EX-DATA-2`, MODIFIER.** Ajouter après la définition des colonnes :

  > **Ordre d'application, normatif** : **Normalisation puis Validation**. Toute borne de la
  > colonne Validation s'entend sur la valeur **déjà normalisée**, dans l'unité canonique
  > d'`EX-DATA-4` et après l'arrondi d'`EX-DATA-6`. Les bornes sont **inclusives** sauf mention
  > contraire explicite. Conséquence assumée et vérifiée champ par champ : le seuil de sentinelle
  > devient de fait `priceEur ≤ 249` puisque `249,60 €` se normalise en `250 €` ;
  > `badgeDisplacementL = 0,55` se normalise en `0,6` et devient valide ;
  > `consumptionCombinedL100Km = 99,94` se normalise en `99,9` et devient valide. Ces trois
  > conséquences sont voulues : une valeur qui, une fois affichée, est dans le domaine ne doit pas
  > être rejetée pour un chiffre que l'application ne montre jamais.

### ARB-16 — `priceEur = 0` et prix hors borne haute : `INCONNU`, jamais rejet de l'annonce

- **Constats sources** : `ADV-16` (MAJEUR), et la fragilité non fichée « prix extrême
  `9 999 999 €` » de la matrice d'attaques d'`ST-adversarial`.
- **Sévérité retenue** : **MAJEUR**. `listingCount`, seul chiffre qualifié d'« exhaustif » par
  `EX-DATA-59`, perd des annonces pour la cause la plus banale de défaut de saisie.
- **Décision — un prix invalide dégrade le prix, jamais l'annonce.** Justification : c'est la
  transposition littérale d'`EX-DATA-16(a)` (« le prix sur demande est une information sur l'offre
  mais pas sur le prix ») et l'alignement sur `mileageKm = 0`, déjà traité en sentinelle et non en
  rejet par `EX-DATA-38`.
- **Annexe A — champ 7 `priceEur`, colonne Validation, MODIFIER.** Texte de remplacement :

  > `p = 0` ou `p` non numérique → `priceStatus = MISSING`, `priceEur = INCONNU`,
  > `ingestFlags += PRICE_MISSING_UNDECLARED`. **Aucun rejet d'annonce.**
  > `p > 5 000 000` → `priceEur = INCONNU`, `ingestFlags += PRICE_OUT_OF_RANGE`. **Aucun rejet
  > d'annonce** : un véhicule de collection légitime au-dessus du plafond doit rester dans
  > l'effectif du marché.
  > `1 ≤ p ≤ 5 000 000` → valide ; `p < 250` → `ingestFlags += PRICE_SENTINEL_ABSOLUTE`
  > (`EX-DATA-19`).
  > **Le verdict REJET est retiré du champ `priceEur`** : aucune valeur de prix ne provoque plus le
  > rejet de l'annonce entière.
- **Annexe A — `EX-DATA-45`, MODIFIER** : ajouter le code `PRICE_OUT_OF_RANGE` au vocabulaire
  `KYCAR_INGEST_FLAG`, porté à **15** codes, et le mentionner dans le rapport d'ingestion
  d'`EX-DATA-46`.
- **Annexe A — `EX-DATA-60`, MODIFIER** : ligne `price`, ajouter le terme
  « **ou** `ingestFlags ∋ PRICE_OUT_OF_RANGE` ».

### ARB-25 — Un seul comparateur de chaînes, et quatre ordres de tri totaux

- **Constats sources** : `AMB-02` (BLOQUANT), `AMB-22` (MAJEUR), et l'occurrence signalée par
  `ST-ambiguity` § zones saines n° 24 (`EX-SCR-216`, troisième formulation du départage).
- **Sévérité retenue** : **BLOQUANT**. Deux cartes-marques permutées, et le champ `rank` publié et
  exporté prend deux valeurs pour la même marque ; sous la lecture `Intl.Collator`, l'ordre dépend
  de la version d'ICU du navigateur, donc du poste.
- **Les deux lectures** : `EX-SCR-119` impose `Intl.Collator('fr-BE', {sensitivity:'base',
  numeric:true})` (« `Škoda` se classe avec `Skoda` ») ; `EX-DATA-70` impose la comparaison point
  de code sur le libellé NFC en majuscules.
- **Décision — l'exigence produit d'`EX-SCR-119` est retenue, mais réalisée de façon déterministe
  et indépendante de la plateforme ; `Intl.Collator` est interdit.** Justification : les deux
  objectifs sont conciliables — replier les diacritiques est une transformation de chaîne, pas une
  collation — et seule cette forme satisfait la promesse d'`EX-SCR-119` (« deux chargements
  identiques produisent le même ordre »).
- **Annexe A — `EX-DATA-70bis`, CRÉER** :

  > **EX-DATA-70bis — comparaison de libellés, règle unique.** Toute comparaison de deux libellés
  > à des fins de tri ou de départage suit exactement cette procédure, et aucune autre :
  > (1) normalisation **NFD** ; (2) suppression des points de code de la plage
  > `U+0300–U+036F` (diacritiques combinants) ; (3) passage en **majuscules** par la table de
  > correspondance Unicode invariante de locale (`toUpperCase` sans argument de locale) ;
  > (4) normalisation **NFC** ; (5) comparaison **point de code par point de code**. Les chiffres
  > sont comparés comme des caractères : `Série 3` précède `Série 30`, et aucune comparaison
  > numérique n'est appliquée. **`Intl.Collator` est interdit** dans tout chemin de tri, de
  > départage ou de hachage.
  > **Justification** : `Škoda` se classe bien avec `Skoda` (l'exigence produit d'`EX-SCR-119`),
  > mais sans dépendre de la version d'ICU du navigateur — la collation sensible à la locale
  > classait `Škoda` avant ou après `Suzuki` selon le poste, rendant `rank` non reproductible et
  > non testable.

  > **EX-DATA-70ter — tout ordre publié est total.** Tout ordre de tri publié ou affiché comporte,
  > après sa clé primaire, les deux clés de départage suivantes, dans cet ordre : le libellé selon
  > `EX-DATA-70bis` croissant, puis l'identifiant technique croissant (`makeId`, `modelId`, ou
  > `listingId` en comparaison octet à octet sur la forme canonique minuscule). Une **clé primaire
  > indéfinie** (`null`) place l'élément **en fin** de l'ordre, dans les deux sens de tri, et n'est
  > **jamais** traitée comme `0`. La clé réservée `modelId = 0` (`EX-DATA-72`) est placée en
  > dernier parmi les modèles d'une marque, avant application des clés de départage.
- **Annexe A — `EX-DATA-70`, MODIFIER** : remplacer « en comparaison **point de code Unicode** sur
  le libellé normalisé NFC passé en majuscules » par « selon `EX-DATA-70bis` », et ajouter le
  renvoi à `EX-DATA-70ter`.
- **Annexe B — `EX-SCR-119`, MODIFIER** : remplacer la mention d'`Intl.Collator` par
  « égalité tranchée selon `EX-DATA-70bis` et `EX-DATA-70ter` — de sorte que `Škoda` se classe avec
  `Skoda`, sans dépendre du navigateur ».
- **Annexe B — `EX-SCR-120`, MODIFIER.** Ajouter :
  > Chacune des quatre options est un ordre **total** au sens d'`EX-DATA-70ter` : clé primaire de
  > l'option, puis libellé (`EX-DATA-70bis`), puis `makeId` croissant. Une clé primaire indéfinie
  > — typiquement une médiane de prix `null` parce que toutes les annonces de la marque sont à prix
  > sur demande — place la marque **en fin** de l'ordre dans les deux sens, et jamais à la valeur
  > `0`. Le tri n'est jamais un tri stable sur l'état antérieur de l'écran : deux chargements de la
  > même URL produisent la même grille.
- **Annexe B — `EX-SCR-121`, `EX-SCR-203`, `EX-SCR-216`, MODIFIER** : remplacer toute formulation de
  départage alphabétique par « selon `EX-DATA-70ter` ». `EX-SCR-121` inscrit en outre le placement
  en dernier de `modelId = 0`.

### ARB-31 — Échantillon de la nuée : `SAMPLE(V, k, seed)` spécifiée dans l'annexe A

- **Constats sources** : `AMB-06` (MAJEUR, « BLOQUANT si la nuée ou sa table équivalente affiche un
  compteur d'outliers »).
- **Sévérité retenue** : **MAJEUR**. Aucun test du lot D4 ne peut être écrit contre « échantillon
  aléatoire de 20 000 points (graine fixée) », et la table d'accessibilité équivalente d'`EX-NFR-15`
  liste deux contenus différents.
- **Les deux lectures** : graine constante littérale + Fisher-Yates sur l'ordre `listingId` ; ou
  graine = `selectionHash` + échantillonnage par réservoir dans l'ordre d'ingestion.
- **Décision — graine constante inscrite dans l'exigence, ordre total par `listingId`, générateur
  nommé.** Justification : la graine dérivée de `selectionHash` rendrait l'échantillon différent
  pour deux sélections dont l'une est un sur-ensemble de l'autre, ce qui ferait disparaître et
  réapparaître la même annonce au fil du filtrage sans qu'aucune règle ne l'explique.
- **Annexe A — `EX-DATA-100bis`, CRÉER** :

  > **EX-DATA-100bis — `SAMPLE(V, k, seed)`.** Si `|V| ≤ k`, `SAMPLE` retourne `V` entier, dans
  > l'ordre `listingId` croissant. Sinon : (1) `V` est ordonné par `listingId` **croissant**, en
  > comparaison octet à octet sur la forme canonique minuscule (`EX-DATA-94`) ; (2) un générateur
  > **`xoshiro128**`** est initialisé par la graine constante `seed = 0x4B594341` (« KYCA »),
  > inscrite ici et nulle part ailleurs ; (3) un mélange de **Fisher-Yates descendant** est
  > appliqué à l'ordre obtenu ; (4) les `k` premiers éléments sont retenus, puis **réordonnés par
  > `listingId` croissant** avant transmission à la vue. La graine ne dépend **ni** de la
  > sélection, **ni** du snapshot, **ni** de l'horloge. `SAMPLE` satisfait la clause de
  > déterminisme d'`EX-DATA-82` : un test du lot D4 vérifie que deux permutations du même
  > multiensemble produisent le même échantillon octet à octet.
  > **Justification** : « graine fixée » ne fixait ni l'algorithme, ni l'ordre sur lequel il opère ;
  > sur une sélection de 40 000 annonces dont 12 outliers, deux implémentations conformes
  > retenaient typiquement 4 et 8 de ces outliers — l'annonce cherchée était présente ou absente
  > sans qu'aucune règle ne tranche.
- **Annexe B — `EX-SCR-32`, MODIFIER** : remplacer « un échantillon aléatoire de 20 000 points
  (graine fixée) » par « l'échantillon `SAMPLE(V, 20 000, seed)` d'`EX-DATA-100bis` », et ajouter
  « le nombre d'outliers annoncé par la nuée et par sa table équivalente (`EX-NFR-15`) est **celui
  de la population entière**, jamais celui de l'échantillon tracé ; l'infobulle le dit ».

### ARB-36 — `INCONNU` n'est jamais une clé d'agrégation, et la cellule d'une annonce sans année démarre à `C₂`

- **Constats sources** : `AMB-30` (BLOQUANT).
- **Sévérité retenue** : **BLOQUANT**. La même annonce est signalée comme opportunité dans une
  lecture (`cellLevel = MODEL_YEAR, cellSize = 15`) et banale dans l'autre
  (`LOW_PRICE_IQR`, `cellSize = 130`), et l'étiquetage obligatoire d'`A-07` affiche deux nombres.
- **Les deux lectures** : `INCONNU` comme valeur de groupe (cohérent avec la clé réservée
  `modelId = 0`) contre l'application de l'échelle de repli.
- **Décision — l'échelle de repli s'applique : `C₁` n'existe pas pour une annonce sans année.**
  Justification : le sous-groupe « année inconnue » est structurellement composé d'imports et de
  véhicules anciens, donc sa médiane est basse par construction — en faire un référentiel rendrait
  ces annonces presque jamais signalables, ce qui est l'inverse de l'objet de l'application.
- **Annexe A — `EX-DATA-86`, MODIFIER.** Ajouter sous la table :

  > Une annonce dont `firstRegistrationYear` est `INCONNU` **ne peut pas former de cellule de
  > rang 1** : son échelle de repli démarre à `C₂`. Réciproquement, une cellule `C₁` ne contient
  > **jamais** d'annonce d'année inconnue, y compris quand l'annonce évaluée en porte une.
  > **Règle générale** : `INCONNU` n'est **jamais** une valeur de clé d'agrégation, ni pour une
  > cellule d'homogénéité, ni pour un groupe de `GROUPSTAT` (`EX-DATA-83bis`), ni pour un bucket
  > d'histogramme. La **seule** exception du corpus est la clé réservée `modelId = 0`
  > d'`EX-DATA-72`, qui est une clé synthétique explicitement nommée et non une valeur inconnue
  > laissée telle quelle.

### ARB-39 — Effectifs par option de filtre : entité, balayage unique, budget, et seconde sélection nommée

- **Constats sources** : `T-04` (BLOQUANT).
- **Sévérité retenue** : **BLOQUANT**. Le compteur `<n> offres` d'`EX-SCR-46` est défini sur une
  sélection qui n'existe nulle part, et les chiffres entre parenthèses du bandeau sont vus à chaque
  interaction.
- **Rejet partiel, avec sa preuve** : la part de `T-04` qui affirme qu'« un développeur doit
  inventer la sémantique du *leave-one-out* » est **écartée**. `EX-SCR-90` la tranche en toutes
  lettres (« toutes contraintes appliquées **sauf le filtre courant** ») et `EX-SCR-89` interdit de
  masquer une option à effectif nul. Ce qui reste fondé, et qui suffit à la sévérité BLOQUANT :
  aucune entité, aucun budget, et **aucune définition de la seconde sélection** d'`EX-SCR-46`.
- **Décision** : une entité, un balayage unique, un poste de budget, un hachage dérivé nommé.
- **Annexe A — `EX-DATA-110bis`, CRÉER** :

  > **EX-DATA-110bis — facettes et sélections dérivées.** L'entité `FacetCount`
  > `{ snapshotId, selectionHash, filterId, code, count }` porte l'effectif d'une option de filtre.
  > `count` est l'effectif du **prédicat de la sélection privé de la totalité des prédicats du
  > filtre `filterId`**, augmenté du seul prédicat `filterId = code` : retirer une valeur laisse
  > donc tomber **toutes** les autres valeurs du même filtre, conformément à `EX-SCR-90`.
  > **Un seul balayage** : les compteurs de facette de tous les filtres de classe `R` sont
  > accumulés simultanément pendant le balayage de sélection, par la technique du « masque de
  > prédicats moins un » ; il est **interdit** de relancer un balayage par filtre ou par valeur.
  > Deux hachages dérivés sont définis et calculés dans ce même balayage :
  > • `selectionHashWithoutTaxonomy` — la sélection privée de tous les prédicats de taxonomie
  >   (`make`, `mmmv`, `cat`, `mcat`, et la contrainte de route de l'écran B). C'est **la** sélection
  >   du compteur `<n> offres` d'`EX-SCR-46`, et de lui seul.
  > • `selectionHashWithoutFilter(filterId)` — la sélection privée d'un filtre, base des
  >   `FacetCount`.
  > **Budget** : `EX-DATA-110` est complété d'un poste `facettes et sélections dérivées : 90 ms`,
  > et le total passe de 450 ms à **540 ms** à `N = 10⁶` ; à `N ≤ 10⁴` la règle de division par 100
  > d'`EX-DATA-113` s'applique inchangée.
  > `FacetCount` est **calculée**, jamais persistée : l'interdiction de précalculer une sélection
  > filtrée d'`EX-DATA-109` reste entière.
- **Annexe A — `EX-DATA-110`, MODIFIER** : ajouter la ligne de budget ci-dessus et corriger le
  total à 540 ms. **`POUR_COORDINATEUR`** si `EX-NFR-5` (« application d'un filtre ≤ 200 ms | p95 »)
  devient incompatible avec ce total : recommandation, distinguer dans § D.2 le budget du **recalcul
  d'agrégats** de celui du **recalcul de facettes**, ce dernier pouvant être différé de 100 ms après
  l'affichage des chiffres principaux, avec les compteurs de facette en état `…` pendant l'écart.
- **Annexe B — `EX-SCR-26`, MODIFIER** : « les 3 filtres les plus restrictifs » sont ceux dont le
  `FacetCount` du retrait complet est le plus élevé ; l'écran affiche
  `retirer « <libellé> » : <k> offres de plus`, `k` étant la différence entre l'effectif de
  `selectionHashWithoutFilter(filterId)` et l'effectif courant.
- **Annexe B — `EX-SCR-46`, MODIFIER** : « l'effectif du compteur est celui de
  `selectionHashWithoutTaxonomy` (`EX-DATA-110bis`) », avec l'infobulle
  `offres correspondant à vos filtres, toutes marques et tous modèles confondus`.

### ARB-40 — Les entités `Make` et `Model` reçoivent leurs tables de champs

- **Constats sources** : `T-05` (BLOQUANT).
- **Sévérité retenue** : **BLOQUANT**. Sans `slug`, la route imposée de l'écran B n'est pas
  constructible ; sans `bodyTypes` au niveau modèle, la classe `R` du filtre primaire
  `Carrosserie` est fausse.
- **Décision** : deux tables de champs en annexe A § C.0, avec niveau de preuve et règle
  `Si absent`. Le `slug` est **dérivé de façon déterministe** quand la source ne le fournit pas —
  ce qui n'est pas une invention de donnée mais une fonction publiée, et `modelId` continue de
  faire foi pour la résolution.
- **Annexe A — `EX-DATA-105`, MODIFIER : CRÉER deux tables de champs.**

  > **`Make`** — clé primaire `makeId`.
  > | Champ | Type | Preuve | Si absent |
  > |---|---|---|---|
  > | `makeId` | entier | RELEVÉ | rejet de l'entrée de taxonomie |
  > | `label` | chaîne(60), NFC | RELEVÉ (`makes[].label`) | rejet de l'entrée |
  > | `slug` | chaîne(60) | RELEVÉ si fourni, sinon `[EXTRAPOLÉ]` par `SLUG(label)` | `SLUG(label)` |
  > | `announcedCount` | entier | OBSERVÉ | `INCONNU` (`ARB-01`) |
  >
  > **`Model`** — clé primaire `(makeId, modelId)`.
  > | Champ | Type | Preuve | Si absent |
  > |---|---|---|---|
  > | `makeId`, `modelId` | entiers | RELEVÉ | rejet de l'entrée |
  > | `label` | chaîne(60), NFC | RELEVÉ (`topModels[].label`) | rejet de l'entrée |
  > | `slug` | chaîne(60) | RELEVÉ si fourni, sinon `[EXTRAPOLÉ]` par `SLUG(label)` | `SLUG(label)` |
  > | `bodyTypes` | tableau de `KYCAR_BODY_TYPE`, 0..n | RELEVÉ (`topModels[].bodyTypes`) | tableau vide, **jamais** `INCONNU` |
  > | `announcedCount` | entier | OBSERVÉ | `INCONNU` |
  >
  > **`SLUG(s)`** : NFD → suppression des diacritiques `U+0300–U+036F` → minuscules invariantes de
  > locale → remplacement de toute suite de caractères hors `[a-z0-9]` par un tiret unique →
  > suppression des tirets de tête et de queue → troncature à 60 caractères sur une frontière de
  > tiret, à défaut troncature dure. `SLUG` est déterministe et testé sur les libellés
  > `Série 3`, `SUV/4x4/Pick-Up`, `Citroën`, `Cupra` et `Modèle non identifié`.
  > **Le `slug` n'est jamais utilisé pour résoudre une entité** : `makeId` et `modelId` font foi
  > (`EX-SCR-140`), le `slug` est cosmétique et un `slug` non canonique déclenche la redirection
  > canonique d'`EX-SCR-140`.
- **Annexe A — `EX-DATA-114`, MODIFIER** : ajouter `bodyTypes` à l'index de la taxonomie, condition
  de la classe `R` du filtre `body` sur l'écran A.
- **Annexe B — `EX-SCR-59` et `EX-SCR-221`, MODIFIER** : la classe `R` du filtre primaire
  `Carrosserie` en mode 1 est justifiée par `Model.bodyTypes` (`EX-DATA-105`) ; si `bodyTypes` est
  un tableau vide pour un modèle, ce modèle **ne satisfait aucun** prédicat `body` et la note
  d'exclusion `EX-SCR-178` annonce `<k> modèles sans carrosserie renseignée`.

### ARB-48 — Charge utile du point de nuée portée à 13 champs

- **Constats sources** : `T-15` (MAJEUR).
- **Sévérité retenue** : **MAJEUR**. Sans le mois, l'axe `G4b` (« date de première immatriculation,
  continue ») dégénère en axe annuel ; sans la catégorie d'évaluation, l'infobulle exigée par
  `EX-SCR-158` est amputée.
- **Décision** : porter la charge à 13 champs et recalculer l'enveloppe. Justification : la clause
  « aucun autre champ n'est transmis » est normative et justifiée par un budget — il faut donc
  changer la liste et le budget, pas la clause.
- **Annexe A — `EX-DATA-98`, MODIFIER** : remplacer la ligne `firstRegistrationYear` par
  `firstRegistrationYearMonth` (« axe 2 ; l'année s'en dérive par division entière ») et ajouter la
  ligne `priceEvaluationCategory` (« jeton d'évaluation AutoScout24 de l'infobulle,
  `EX-SCR-158` »). Remplacer la justification chiffrée par :

  > **13 champs à ≈ 68 octets par point plafonnent à ≈ 340 Ko pour 5 000 points**, contre plusieurs
  > mégaoctets si l'annonce entière était transmise. La clause « aucun autre champ n'est transmis à
  > la vue » reste entière : tout besoin d'un quatorzième champ exige d'amender cette exigence.

### ARB-54 — Doublon à valeurs divergentes : un ordre d'ingestion total, et un drapeau

- **Constats sources** : `ADV-05` (BLOQUANT).
- **Sévérité retenue** : **BLOQUANT**. « La première occurrence rencontrée dans l'ordre
  d'ingestion » n'est pas un ordre défini : deux implémentations affichent 12 900 € ou 10 500 € pour
  la même annonce, et rien ne distingue ce prix d'un prix propre.
- **Décision** : définir l'ordre d'ingestion comme un ordre total, et créer le drapeau manquant.
  Justification : un drapeau seul ne suffit pas — sans ordre total, les deux implémentations
  restent divergentes **et** toutes deux drapeautées.
- **Annexe A — `EX-DATA-15`, MODIFIER.** Texte de remplacement du deuxième paragraphe :

  > **Ordre d'ingestion, total et normatif** : les réponses de la source sont traitées dans
  > l'ordre `(pageIndex croissant, positionDansPage croissante)`, où `pageIndex` est l'indice de
  > la requête dans le plan d'ingestion du snapshot et `positionDansPage` le rang de l'annonce dans
  > le tableau reçu. La **première** occurrence d'un `listingId` dans cet ordre est conservée ;
  > les suivantes sont écartées. Si deux occurrences d'un même `listingId` **diffèrent** sur l'un
  > des champs `priceEur`, `priceStatus`, `mileageKm` ou `firstRegistrationYearMonth`, l'occurrence
  > conservée porte `ingestFlags += DUPLICATE_VALUE_CONFLICT`, et le snapshot incrémente
  > `duplicateValueConflictCount`. Les valeurs écartées ne sont pas stockées.
  > **Justification** : l'ordre d'ingestion étant un artefact de collecte et non un ordre de
  > fraîcheur, il ne peut pas être présenté comme un choix de la valeur la plus juste ; il est en
  > revanche indispensable qu'il soit **reproductible**, et que l'annonce concernée soit
  > distinguable à l'écran d'une annonce dont le prix n'a jamais varié.
- **Annexe A — `EX-DATA-45`, MODIFIER** : ajouter `DUPLICATE_VALUE_CONFLICT` (vocabulaire porté à
  **16** codes avec `PRICE_OUT_OF_RANGE` d'`ARB-16`).
- **Annexe A — `EX-DATA-106`, MODIFIER** : ajouter `duplicateValueConflictCount` aux champs de
  `Snapshot`.
- **Annexe B — `EX-SCR-53` et `EX-SCR-203`, MODIFIER** : le panneau Diagnostic affiche
  `duplicateValueConflictCount` ; la ligne de l'écran D d'une annonce portant
  `DUPLICATE_VALUE_CONFLICT` porte un jeton `!` dont l'infobulle dit
  `deux versions de cette annonce ont été reçues dans ce snapshot avec des valeurs différentes`.

### ARB-60 — Le neuvième marketplace : déclaré hors périmètre, avec un repli explicite

- **Constats sources** : `ADV-15` (MINEUR/MAJEUR proposé).
- **Sévérité retenue** : **MINEUR** — `RE-COTÉ`. Motif de la re-cotation : H1 fixe le marketplace de
  la v1 à la Belgique, la table couvre les huit marchés atteignables, et aucun développeur n'est
  bloqué ; seul un repli manque. Le constat n'en est pas moins fondé.
- **Décision** : ne pas deviner le neuvième code ; écrire le repli.
- **Annexe A — `EX-DATA-40`, MODIFIER.** Ajouter sous la table de traduction :

  > Le vocabulaire `KYCAR_MARKETPLACE` compte 9 valeurs et cette table en traduit 8. Le neuvième
  > code n'est **pas** identifié par les relevés disponibles : une valeur de marketplace absente de
  > cette table donne `countryCode = INCONNU`, `ingestFlags += MARKETPLACE_UNMAPPED`, et l'annonce
  > est **conservée** (aucun rejet). Aucune requête vers la source n'est construite pour un
  > marketplace non traduit. Le neuvième marché est **hors périmètre H1** ; l'identifier relève de
  > la dette de référentiel, pas de l'implémentation.
- **Annexe A — `EX-DATA-45`, MODIFIER** : ajouter `MARKETPLACE_UNMAPPED` (vocabulaire porté à
  **17** codes).

### ARB-61 — Troncature de `modelVersionClean` : repli explicite

- **Constats sources** : `ADV-17` (MINEUR).
- **Sévérité retenue** : **MINEUR**. Trois sorties conformes possibles pour la même entrée, ce qui
  contredit `EX-DATA-28` et le principe R6, mais sur un champ d'affichage secondaire.
- **Annexe A — `EX-DATA-29`, étape 6, MODIFIER** : remplacer « troncature à 80 caractères **sur une
  frontière de mot** (dernier espace avant la limite) » par :

  > troncature à 80 caractères sur une frontière de mot — dernier espace **à un index strictement
  > inférieur à 80** ; **à défaut d'un tel espace, troncature dure à exactement 80 caractères**,
  > sans chercher de frontière au-delà de la limite. La troncature ne coupe jamais à l'intérieur
  > d'un groupe de graphèmes étendu (`ARB-24`) : si le 80ᵉ caractère est une marque combinante, la
  > coupe recule jusqu'au début de son graphème.

### ARB-62 — `modelVersionRaw` : rendu en texte, jamais en balisage

- **Constats sources** : `ADV-18` (MINEUR proposé).
- **Sévérité retenue** : **MAJEUR** — `RE-COTÉ`. Motif de la re-cotation : deux développeurs
  produisent deux comportements dont l'un est exploitable (`innerHTML` contre `textContent`), ce
  qui est la définition même du barème MAJEUR ; et `EX-DATA-30` établit que le champ est **connu**
  pour porter du texte non maîtrisé. Ce n'est pas de la finition.
- **Annexe A — `EX-DATA-28`, MODIFIER.** Ajouter :

  > `modelVersionRaw`, `fuelSourceLabelRaw` et tout champ dont le nom se termine par `Raw` sont du
  > **texte non maîtrisé** : ils sont rendus exclusivement comme **contenu textuel**
  > (`textContent`, interpolation auto-échappante d'un gabarit), **jamais** comme balisage
  > (`innerHTML`, `dangerouslySetInnerHTML`, `v-html` ou équivalent), et jamais comme valeur d'un
  > attribut d'URL (`href`, `src`) ni d'un gestionnaire d'événement. La même règle s'applique à
  > leur reprise dans un attribut `title` ou `aria-label`. Un test du lot D4 injecte
  > `<img src=x onerror=…>` dans `modelVersionInput` et vérifie que la chaîne apparaît **littérale**
  > dans l'infobulle de `G4` (`EX-SCR-158`) et dans la colonne « Version » de l'écran D
  > (`EX-SCR-203`), et qu'aucune requête réseau n'en découle.
  > **Justification** : la liste d'arrêt promotionnelle d'`EX-DATA-30` prouve que le champ porte
  > déjà du texte à risque ; l'absence d'exigence laissait le seul rempart à la convention du
  > framework choisi.

### ARB-64 — Taux de vide par champ : un compteur à l'ingestion

- **Constats sources** : `T-24` (MINEUR).
- **Sévérité retenue** : **MINEUR**. Le troisième état du panneau Diagnostic n'est pas calculable,
  mais le panneau est un outil de diagnostic et non un chiffre de marché.
- **Annexe A — `EX-DATA-106`, MODIFIER** : ajouter à `Snapshot` le champ

  > `unknownCountByField: map<nom de champ, entier>` — nombre d'annonces du snapshot pour
  > lesquelles le champ vaut `INCONNU`, alimenté à l'ingestion, couvrant **exactement** les champs
  > listés par `EX-DATA-57` hors champs de diagnostic. C'est la **source unique** du troisième état
  > du panneau `Diagnostic des données` (`EX-SCR-53`) ; aucun comptage ad hoc n'est autorisé
  > ailleurs.
- **Annexe B — `EX-SCR-53`, MODIFIER** : « l'état `présent mais vide sur <k> annonces` lit
  `unknownCountByField[<champ>]` et rien d'autre ».

## 2.3 Décisions relevant principalement de l'annexe B

### ARB-06 — Écran C : les bornes communes sont celles de `BIN` sur l'union des échantillons

- **Constats sources** : `AMB-37` (MAJEUR).
- **Sévérité retenue** : **MAJEUR**. 18 barres contre 20 par colonne, donc des effectifs, des
  infobulles et un bin de débordement différents, et deux animations qui ne convergent pas au
  retrait d'une colonne.
- **Les deux lectures** : union des **populations** puis `BIN` sur l'échantillon réuni, contre union
  des **bornes** déjà calculées par colonne.
- **Décision — union des populations.** Justification : la seconde lecture applique `BIN` à des
  bornes qui ne sont pas des quantiles d'un échantillon, donc à une entrée que `EX-DATA-75`
  n'accepte pas ; seule la première reste dans le domaine de définition de la fonction unique.
- **Annexe B — `EX-SCR-195`, MODIFIER.** Ajouter à la suite du texte existant :

  > Les bornes communes et la largeur `w` sont celles de `BIN(V, W, T, O)` appliqué à l'**union des
  > échantillons valides** des colonnes comparées : `V = ⋃ V_m(colonne)` pour la métrique du
  > graphe. Sont **exclues de ce calcul** les colonnes dont `n_m < 12` (`EX-DATA-80`,
  > `lowConfidence`) ; si toutes les colonnes sont sous ce seuil, la rangée affiche
  > `échelle commune non calculable — effectifs trop faibles` et chaque colonne est rendue avec sa
  > propre grille, l'indicateur passant de `échelle commune` à `échelles indépendantes`. La grille
  > ainsi obtenue est **imposée à chaque colonne** : seuls les effectifs varient d'une colonne à
  > l'autre. Au retrait d'une colonne (`EX-SCR-198`), l'union est recalculée et la transition
  > s'anime vers la nouvelle grille.
- **Annexe B — `EX-SCR-200`, MODIFIER** : remplacer l'exclusion des colonnes à `n = 0` par
  « exclusion des colonnes à `n_m < 12`, seuil unique d'`EX-SCR-195` ; une colonne exclue du calcul
  des bornes est **néanmoins rendue** sur la grille commune, avec son jeton d'effectif faible ».

### ARB-07 — Bascule log : le rapport porte sur les bins fermés seuls

- **Constats sources** : `AMB-24` (MAJEUR).
- **Sévérité retenue** : **MAJEUR**. Un contrôle présent contre absent du DOM : un critère de
  recette automatisé passe ou échoue selon l'implémentation, et l'ordre de tabulation diffère.
- **Les deux lectures** : bins fermés seuls contre tous les bins émis, bins de débordement compris.
- **Décision — bins fermés seuls.** Justification : `EX-DATA-79` interdit de représenter un bin
  ouvert à l'échelle, donc il ne peut pas motiver un changement d'échelle ; et comme un bin de
  débordement non vide est le cas normal, la lecture inverse rendrait la règle « ≥ 50 » inopérante.
- **Annexe B — `EX-SCR-16`, MODIFIER.** Remplacer « le rapport entre l'effectif du bucket le plus
  peuplé et celui du bucket non vide le moins peuplé » par :

  > le rapport entre l'effectif du **bin fermé** (`open = false`) le plus peuplé et celui du **bin
  > fermé non vide** le moins peuplé. Les bins de débordement, qui ne sont jamais représentés à
  > l'échelle (`EX-DATA-79`), n'entrent **ni** au numérateur **ni** au dénominateur. S'il existe
  > moins de deux bins fermés non vides, la bascule est **absente du DOM**.

### ARB-08 — Étiquette d'un bin de débordement : deux formes, exactes toutes les deux

- **Constats sources** : `AMB-34` (MINEUR).
- **Sévérité retenue** : **MINEUR**. Le nombre affiché est le même dans les quatre formes, mais
  l'une d'elles est littéralement fausse et le test d'`aria-label` d'`EX-SCR-188` n'a pas de chaîne
  stable à attendre.
- **Décision — `< <borne>` en bas, `≥ <borne>` en haut**, seules formes exactes au regard
  d'`EX-DATA-76` (`(−∞, hi)` et `[lo, +∞)`).
- **Annexe A — `EX-DATA-79`, MODIFIER** : remplacer « affichent leur borne finie suivie de `−` ou
  `+` » par :

  > s'étiquettent selon deux formes, et deux seulement : bin de débordement bas
  > `< <hi> <unité>`, bin de débordement haut `≥ <lo> <unité>`. Ces deux formes sont exactes au
  > regard d'`EX-DATA-76` ; les formes `> <borne>`, `<borne> +` et `avant <AAAA>` sont
  > **interdites**, y compris comme alias d'affichage.
- **Annexe B — `EX-SCR-18`, `EX-SCR-146`, `EX-SCR-147`, MODIFIER** : remplacer les trois formes
  divergentes par un renvoi à `EX-DATA-79`.

### ARB-18 — Franchissement du seuil M1 → M2 : la méthode est nommée à l'écran

- **Constats sources** : `ADV-07` (MAJEUR).
- **Sévérité retenue** : **MAJEUR**. `opportunityScore` bascule de `−zIqr` à `−z` pour la cellule
  entière à l'arrivée d'une trentième annonce, donc les 29 annonces préexistantes peuvent se
  réordonner intégralement sans que rien à l'écran ne l'explique.
- **Décision** : ne pas lisser la discontinuité — elle est assumée et cohérente (`G8` n'est tracé
  qu'à `n ≥ 30`) — mais la **rendre lisible**, au même titre que l'étiquetage obligatoire d'`A-07`.
- **Annexe B — `EX-SCR-164` et `EX-SCR-203`, MODIFIER** : ajouter

  > Tout classement d'opportunité affiche la **méthode** qui l'a produit, à côté de l'étiquetage de
  > cellule d'`ARB-47`, sous l'une des deux formes exactes : `score : écart au prix attendu (M2)`
  > ou `score : écart robuste au prix de la cellule (M1)`. Quand la cellule franchit le seuil de 30
  > entre deux chargements, le bandeau non bloquant
  > `Méthode de score changée : la cellule atteint 30 offres, le classement passe à l'écart au prix
  > attendu` est affiché une fois, refermable. Les deux scores ne sont **jamais** mélangés dans un
  > même classement ni dans une même colonne.

### ARB-20 — Un seul couple de percentiles pour la fourchette robuste : `P5` / `P95`

- **Constats sources** : `AMB-21` (BLOQUANT proposé).
- **Sévérité retenue** : **MAJEUR** — `RE-COTÉ`. Motif : `R-A05` a depuis confirmé `[p05, p95]`
  comme fourchette de l'écran A, ce qui supprime la divergence de **chiffres affichés** ; il reste
  que la liste de libellés déclarée exhaustive par `EX-SCR-12` ne contient ni `P5` ni `P95` et
  contient `P10`/`P90`, que l'annexe A ne définit nulle part — soit une incohérence de libellés et
  un test non écrivable, ce qui est le barème MAJEUR.
- **Décision** : `P5` et `P95` entrent dans la liste normative, `P10` et `P90` en sortent.
- **Annexe B — `EX-SCR-12`, MODIFIER** : la liste devient
  « `médiane`, `moyenne`, `min`, `max`, **`P5`**, `P25`, `P75`, **`P95`**, `écart interquartile` ».
  Ajouter « `P10` et `P90` ne sont **pas** des statistiques de KYCAR : l'annexe A ne les définit
  pas et aucun écran ne les affiche ».
- **Annexe B — `EX-SCR-33`, MODIFIER** : remplacer « percentiles P10/P90 » par « percentiles
  `P5`/`P95` » (voir `ARB-17`, qui réécrit l'exigence).
- **Annexe A — `EX-DATA-64` et `EX-DATA-69`, MODIFIER** : ajouter « les libellés d'affichage de
  `p05` et `p95` sont `P5` et `P95` (`EX-SCR-12`) ».

### ARB-21 — Arrondi du prix : la règle de l'annexe A prime, `Math.floor` est interdit

- **Constats sources** : `AMB-01` (BLOQUANT).
- **Sévérité retenue** : **BLOQUANT**. 1 € d'écart sur toute statistique interpolée, donc sur une
  médiane sur deux quand `n` est pair, et une divergence entre l'écran et l'export CSV.
- **Les deux lectures** : `EX-DATA-6` (« l'arrondi de tout décimal est au plus proche, demi vers
  l'infini ») contre `EX-SCR-3` (« arrondi à l'euro par troncature vers le bas (`Math.floor`) »).
- **Décision — `EX-DATA-6` prime.** Justification : `A-09` attribue la normalisation à l'annexe A,
  et `EX-DATA-6` porte la justification opposable (« deux implémentations correctes doivent
  produire le même chiffre au centime ») qu'`EX-SCR-3` annulerait.
- **Annexe B — `EX-SCR-3`, MODIFIER.** Texte de remplacement :

  > `EX-SCR-3` — **Prix.** Format `<entier> €`, **arrondi selon `EX-DATA-6`** (au plus proche, demi
  > vers l'infini en valeur absolue) ; **`Math.floor` et toute troncature vers le bas sont
  > interdits**. Symbole `€` précédé d'une espace insécable U+00A0, jamais de décimales. Exemple :
  > `18 950 €`. Un prix nul ou absent suit `EX-SCR-36`.
- **Annexe A — `EX-DATA-64`, MODIFIER** : ajouter sous la colonne « Arrondi de présentation » :
  « cet arrondi est celui d'`EX-DATA-6` et **prime sur toute règle de format d'écran** ; l'export
  CSV applique le même arrondi que l'écran ».

### ARB-22 — Bornes de fourchette de kilométrage : plancher et plafond, jamais le plus proche

- **Constats sources** : `AMB-07` (MAJEUR).
- **Sévérité retenue** : **MAJEUR**. Le véhicule le plus roulé de la sélection tombe **hors** de la
  fourchette annoncée, et un utilisateur qui pose `kmto=210000` pour retrouver « tout ce qui est
  affiché » perd une annonce.
- **Décision** : étendre au kilométrage le principe déjà écrit pour l'année (`EX-DATA-67`).
- **Annexe B — `EX-SCR-5`, MODIFIER.** Ajouter :

  > Les **bornes d'une fourchette** ne suivent pas l'arrondi à la centaine la plus proche : borne
  > basse au **plancher** de centaine, borne haute au **plafond** de centaine, même principe
  > qu'`EX-DATA-67`, de sorte que la fourchette affichée contienne toujours toutes les valeurs
  > observées. L'arrondi à la centaine la plus proche est réservé aux **valeurs unitaires** (le
  > kilométrage d'une annonce). Exemple : `min = 10 049`, `max = 210 049` → `10 000 – 210 100 km`.
- **Annexe A — `EX-DATA-67`, MODIFIER** : généraliser le titre en « arrondi des bornes de
  fourchette » et ajouter « la même règle plancher-plafond s'applique aux bornes de kilométrage
  (`EX-SCR-5`) et aux bornes de prix quand l'arrondi de présentation n'est pas à l'unité ».

### ARB-23 — `min === max` : test sur les valeurs après arrondi de présentation

- **Constats sources** : `AMB-35` (MINEUR).
- **Sévérité retenue** : **MINEUR**. Sans effet sur les chiffres, mais la lecture opposée produit
  `12 500 – 12 500 €`, exactement l'affichage que la règle voulait éviter.
- **Annexe B — `EX-SCR-4`, MODIFIER** : remplacer « Si `min === max`, afficher la valeur seule »
  par « Si les deux bornes sont **égales après l'arrondi de présentation** (`EX-SCR-3`), afficher
  la valeur seule : `9 500 €`. La comparaison ne porte jamais sur les valeurs en double précision
  d'`EX-DATA-63`. » Même précision pour `EX-SCR-5` et `EX-SCR-6`.

### ARB-24 — Budgets de troncature en groupes de graphèmes

- **Constats sources** : `AMB-36` (MINEUR).
- **Sévérité retenue** : **MINEUR**. Un libellé entier contre un libellé tronqué, et dans le pire
  cas un caractère mal formé à l'écran.
- **Annexe B — `EX-SCR-13`, MODIFIER** : ajouter « les budgets sont exprimés en **groupes de
  graphèmes étendus** (`Intl.Segmenter('fr', {granularity:'grapheme'})` ou équivalent) et la
  troncature ne coupe **jamais** à l'intérieur d'un graphème ».
- **Annexe A — `EX-DATA-7`, MODIFIER** : ajouter « tout libellé provenant de `taxonomy.json`
  (`Make.label`, `Model.label`) est normalisé **NFC** au chargement, comme toute chaîne du
  modèle ».

### ARB-26 — Plus grand reste : départage écrit, et substitutions typographiques en dernier

- **Constats sources** : `AMB-23` (MAJEUR proposé, « BLOQUANT au sens strict du barème »).
- **Sévérité retenue** : **BLOQUANT** — `RE-COTÉ`. Motif : l'agent l'a lui-même reconnu, et le
  barème est explicite — deux barres portant le même effectif `99` affichent `50 %` et `49 %`, avec
  l'attribution inversée d'une implémentation à l'autre. Ce sont bien deux chiffres différents
  affichés à l'utilisateur.
- **Annexe B — `EX-SCR-11`, MODIFIER.** Texte de remplacement de la dernière phrase :

  > La somme affichée d'une répartition est corrigée par la **méthode du plus grand reste** pour
  > totaliser exactement `100 %`. **À reste égal**, le point est attribué à la classe de plus grand
  > **effectif brut**, puis — à effectif égal — à la première par libellé selon `EX-DATA-70bis`.
  > La correction du plus grand reste s'applique **avant** les substitutions `< 1 %` et `> 99 %`,
  > qui sont purement typographiques et **ne modifient pas** la valeur corrigée : une répartition
  > dont la somme des libellés ne fait pas visuellement 100 % à cause d'une substitution porte la
  > mention `arrondis` en infobulle. Une classe dont la part corrigée vaut `0` s'affiche `0 %` et
  > non `< 1 %`.

### ARB-27 — Ordre de `G8` et de l'écran D : `opportunityScore` décroissant, et rien d'autre

- **Constats sources** : `AMB-17` (MAJEUR).
- **Sévérité retenue** : **MAJEUR**. `G8` n'affiche que les 20 premiers : l'ordre décide de
  l'appartenance à la liste, et les deux lectures produisent deux listes disjointes.
- **Trois lectures constatées** : écart en pourcentage, écart en euros, `−z` d'`EX-DATA-94`.
- **Décision — `EX-DATA-94` fait foi.** Justification : `A-09` attribue le classement à l'annexe A,
  et `EX-DATA-94` est le seul des trois à porter un ordre **total**.
- **Annexe B — `EX-SCR-164`, MODIFIER** : remplacer « triées par écart croissant (les plus
  sous-évaluées en haut) » par « triées par `opportunityScore` **décroissant** au sens
  d'`EX-DATA-94`, égalités départagées par `priceEur` croissant puis `listingId` croissant — les
  plus sous-évaluées en haut. Le double étiquetage euros/pourcentage reste un pur affichage et ne
  définit **aucun** ordre. »
- **Annexe B — `EX-SCR-206`, MODIFIER** : remplacer « Par défaut : écart au prix attendu
  croissant » par « Par défaut : `opportunityScore` décroissant (`EX-DATA-94`), avec le même
  départage ; quand `opportunityScore` est `null` pour toutes les lignes, l'ordre par défaut
  bascule sur `priceEur` croissant puis `listingId` croissant, et l'en-tête de colonne l'indique ».
- **Annexe B — `EX-SCR-207`, MODIFIER** : préciser « le `P10 des écarts` est le décile inférieur de
  `δ` (`EX-DATA-92`), calculé sur **tout le périmètre de l'écran D** — jamais sur les 20 lignes de
  `G8` — au sens d'`EX-DATA-62`, et exprimé en **pourcentage** ».

### ARB-28 — Écran A : une table unique des trois seuils

- **Constats sources** : `AMB-04` (BLOQUANT).
- **Sévérité retenue** : **BLOQUANT**. 20 cartes contre 50 pour la même sélection, bandeau présent
  contre absent, et l'écart décide si une marque figure ou non à l'écran.
- **Les deux lectures** : plafond de 20 cartes au-delà de 40 marques, contre virtualisation sans
  plafonnement et unique avertissement à 60.
- **Décision — virtualisation sans plafonnement du nombre de cartes ; le plafond de 20 est réservé
  au cas sans filtre.** Justification : plafonner à 20 des marques qui satisfont un filtre revient
  à cacher un résultat demandé, alors que le cas sans filtre est un état d'amorce où le plafond a
  un sens pédagogique.
- **Annexe B — `EX-SCR-32`, MODIFIER** : supprimer, pour l'écran A, le seuil « plus de 40 marques »
  et la mention « 20 affichées ». `ET-TROP-RESULTATS` ne concerne plus, sur l'écran A, que le
  franchissement de 60 marques, et conserve inchangé son seuil de 20 000 annonces pour l'écran B.
- **Annexe B — `EX-SCR-124bis`, CRÉER** — table unique des seuils de l'écran A :

  > | Seuil | Effet | Exigence |
  > |---|---|---|
  > | état sans filtre (`EX-SCR-27bis`) | 20 cartes rendues + bloc d'amorce + bouton `Afficher les <n> marques` | `EX-SCR-125` |
  > | `> 40` cartes à rendre | grille **virtualisée**, au plus 12 cartes montées simultanément ; **aucun plafonnement du nombre de cartes accessibles** | `EX-SCR-127` |
  > | `> 60` marques avec au moins un résultat | bandeau non bloquant `<n> marques correspondent — affinez pour comparer` | `EX-SRCH-26` |
  >
  > Aucun autre seuil de rendu n'existe sur l'écran A. Le nombre 20 n'apparaît **que** dans la
  > première ligne.
- **Annexe B — `EX-SCR-127`, MODIFIER** : ajouter « la virtualisation ne plafonne jamais le nombre
  de cartes accessibles : elle ne plafonne que le nombre de cartes montées dans le DOM ».

### ARB-29 — L'état `SANS-FILTRE`, défini une fois

- **Constats sources** : `AMB-05` (BLOQUANT).
- **Sévérité retenue** : **BLOQUANT**. 20 cartes contre 295, et sur une sélection vide, un écran qui
  affirme une panne technique contre un écran qui affirme un résultat vide légitime.
- **Les deux lectures** : « aucun paramètre de filtre » contre « aucun paramètre non injecté par
  défaut » (`EX-SCR-126`).
- **Décision — l'état `SANS-FILTRE` est défini par l'absence de tout **prédicat utilisateur**, et la
  liste des paramètres injectés cesse d'être une liste d'écran.** Justification : `ARB-30` fait
  disparaître les paramètres injectés de l'état de filtres utilisateur, ce qui rend les deux
  lectures identiques au lieu d'en choisir une — c'est la seule résolution qui ne laisse pas
  `EX-SCR-27` fondé sur un raisonnement faux.
- **Annexe B — `EX-SCR-27bis`, CRÉER dans les conventions transverses** :

  > `EX-SCR-27bis` — **État `SANS-FILTRE`, définition unique.** L'application est dans l'état
  > `SANS-FILTRE` lorsque l'**état de filtres utilisateur** est vide, c'est-à-dire lorsque aucun
  > prédicat n'est appliqué au jeu de données local (`EX-SRCH-18`, `ARB-30`). Les valeurs que
  > l'adaptateur `DataProvider` injecte dans une requête vers la source (`atype`, `ustate`,
  > `powertype`, `pricetype`, `cy`) **ne sont pas** des filtres utilisateur et n'ont aucun effet sur
  > cet état. La contrainte de route de l'écran B (`makeId`, `modelId`) n'est pas un filtre non
  > plus. Cet état est référencé **par son nom** par `EX-SCR-27`, `EX-SCR-31`, `EX-SCR-125`,
  > `EX-SCR-126` et `EX-SCR-91`, et sa définition n'est répétée nulle part ailleurs.
- **Annexe B — `EX-SCR-27`, MODIFIER** : « `ET-VIDE-SANS-FILTRE` — zéro résultat dans l'état
  `SANS-FILTRE` (`EX-SCR-27bis`). Traité comme une **panne** : un jeu de données local vide sans
  aucun prédicat utilisateur ne peut être qu'un défaut d'ingestion ou de fourniture. »
- **Annexe B — `EX-SCR-126`, MODIFIER** : remplacer l'énumération de paramètres par « le bloc
  d'amorce disparaît dès que l'application quitte l'état `SANS-FILTRE` (`EX-SCR-27bis`) ».

### ARB-30 — `Tout effacer` : aucun prédicat utilisateur, et les valeurs injectées ne sont pas des filtres

- **Constats sources** : `AMB-13` (BLOQUANT).
- **Sévérité retenue** : **BLOQUANT**. 12 annonces d'écart, et ce sont les accidentés — qu'`A-01`
  qualifie de « facteur explicatif d'outlier de **premier ordre** » — qui disparaissent
  silencieusement dans une lecture.
- **Les deux lectures** : retour aux défauts relevés (`ustate = N,U`, donc sans accidentés) contre
  absence de tout paramètre.
- **Décision — `EX-SRCH-18` est la règle unique : après réinitialisation, aucun prédicat n'est
  appliqué.** Justification : KYCAR filtre son propre jeu de données (`A-03`), donc un « défaut
  relevé » du moteur AutoScout24 n'a aucune raison d'amputer le jeu local ; et l'exclusion
  silencieuse des accidentés contredirait `EX-SCR-39`.
- **Annexe B — `EX-SCR-77`, MODIFIER.** Texte de remplacement :

  > `EX-SCR-77` — **`Tout effacer`.** Bouton textuel qui **retire tout prédicat utilisateur** : à
  > l'issue de l'action, aucun filtre n'est appliqué au jeu de données local et l'URL ne porte aucun
  > paramètre de filtre (`EX-SRCH-18`, règle unique). L'application entre dans l'état
  > `SANS-FILTRE` (`EX-SCR-27bis`). **Les valeurs `atype`, `ustate`, `powertype`, `pricetype` et
  > `cy` ne sont pas remises à une valeur par défaut, parce qu'elles ne sont pas des filtres
  > utilisateur** : ce sont des valeurs que l'adaptateur `DataProvider` injecte dans une requête
  > vers la source (`EX-SRCH-18bis`), invisibles dans le bandeau. La route survit (`EX-SRCH-20`).
- **Annexe C — `EX-SRCH-18bis`, CRÉER** :

  > **EX-SRCH-18bis — valeurs injectées vers la source, distinctes de l'état de filtres.**
  > L'adaptateur `DataProvider` injecte dans toute requête vers la source les valeurs
  > `atype=C` (périmètre voiture, `A-01`), `ustate=A,N,U` (neuf, occasion **et accidentés**),
  > `powertype` et `pricetype` dans leur unité canonique, et `cy` selon le marketplace du snapshot.
  > Ces valeurs **ne sont jamais** présentées comme des filtres utilisateur, **jamais** sérialisées
  > dans l'URL de l'application, **jamais** comptées dans le badge de filtres actifs, et **jamais**
  > remises à zéro par une réinitialisation.
  > **`ustate=A,N,U` et non `N,U`** : `N,U` amputerait le snapshot des véhicules accidentés, dont
  > `A-01` fait un facteur explicatif d'outlier de premier ordre ; l'utilisateur peut ensuite les
  > exclure par le filtre `damaged_listing`, qui est un filtre utilisateur exposé.

### ARB-32 — Le bandeau de couverture non refermable n'est jamais replié

- **Constats sources** : `AMB-08` (MAJEUR).
- **Sévérité retenue** : **MAJEUR**. L'unique garde-fou du point ouvert `O9`, qualifié de « verrou
  du parcours 2 », est visible ou invisible précisément dans le cas où il compte le plus.
- **Les deux lectures** : `C3` est dernier dans l'ordre de priorité, donc replié dès que deux
  bandeaux plus prioritaires existent ; ou « non refermable » l'exempte du plafond.
- **Décision — `C3` non refermable est exempté du plafond.** Justification : un avertissement que
  l'utilisateur n'a pas le droit de fermer ne peut pas être fermé par le système à sa place.
- **Annexe B — `EX-SCR-38`, MODIFIER.** Ajouter :

  > **Exception unique au plafond** : le bandeau `C3 couverture` en état non refermable
  > (`sampleCoverage < 0,20`, `EX-SCR-31`) n'est **jamais** replié et **ne compte pas** dans le
  > plafond de deux bandeaux ; il s'affiche alors en troisième position et la hauteur maximale de
  > la zone passe de 96 px à **144 px**. Repliabilité, bandeau par bandeau :
  > `ET-ERREUR-PROVIDER` non repliable · `ET-HORS-LIGNE` repliable · `ET-PARTIEL-CACHE` repliable ·
  > `ET-TROP-RESULTATS` repliable · `ET-URL-CORRIGEE` repliable (`ARB-11`) ·
  > `C3 couverture` repliable **sauf** en état non refermable. L'ordre de priorité devient :
  > `ET-ERREUR-PROVIDER` > `ET-HORS-LIGNE` > `ET-PARTIEL-CACHE` > `ET-TROP-RESULTATS` >
  > `ET-URL-CORRIGEE` > `C3 couverture`.

### ARB-34 — Écran D : `sel` est une restriction d'affichage, jamais un filtre

- **Constats sources** : `AMB-26` (BLOQUANT).
- **Sévérité retenue** : **BLOQUANT**. Une colonne « Écart au prix attendu » pleine contre vide, et
  un tableau trié contre un tableau dont l'ordre est indéfini.
- **Les deux lectures** : `sel` contraint `Σ` (donc les cellules d'outlier se recalculent, `A-07`)
  contre `sel` ne restreint que l'affichage (`EX-SCR-184`).
- **Décision — restriction d'affichage.** Justification : `EX-SCR-184` dit déjà que « convertir la
  sélection en filtre est un acte explicite » ; faire de `sel` un filtre implicite contredirait
  cette exigence **et** ferait disparaître l'anomalie que l'utilisateur vient de brosser pour
  l'inspecter.
- **Annexe B — `EX-SCR-202`, MODIFIER.** Texte de remplacement de la phrase visée :

  > Le paramètre `sel` **restreint la liste affichée** et rien d'autre : la sélection `Σ` qui fonde
  > les agrégats, les cellules d'homogénéité (`EX-DATA-86`) et les écarts au prix attendu reste
  > celle des filtres de l'URL, **sans** `sel`. L'écran affiche en tête
  > `<n> lignes affichées sur <N> de la sélection — écarts calculés sur les <N>`, ce qui satisfait
  > l'étiquetage obligatoire d'`A-07`. Un bouton `Convertir la sélection en filtre` (`EX-SCR-184`)
  > est le **seul** chemin qui change `Σ` : il pose les filtres d'intervalle englobant la sélection
  > brossée et retire `sel`.
- **Note pour `ARB-41`** : l'encodage de `sel` est traité par `ARB-41` — une empreinte n'est pas
  restituable, et cette décision-ci ne suppose que la restitution d'un sous-ensemble d'annonces.

### ARB-35 — `fuel=B` ne sélectionne jamais les hybrides

- **Constats sources** : `AMB-27` (BLOQUANT).
- **Sévérité retenue** : **BLOQUANT**. 300 offres contre 700 pour le même clic sur la case
  `Essence`, donc une médiane, trois histogrammes et une liste d'outliers entièrement différents.
- **Les deux lectures** : égalité stricte de code contre appartenance sémantique (le libellé du code
  `2` étant « Électrique/Essence »).
- **Décision — égalité stricte.** Justification : `EX-DATA-11` interdit déjà de rattacher un
  hybride à `B` ou `D` dans le modèle de données ; faire l'inverse au niveau du prédicat rendrait
  l'effectif de la page différent de celui de la barre cliquée dans `G9`.
- **Annexe B — `EX-SCR-84` (PIÈGE 1), MODIFIER.** Ajouter :

  > Le prédicat du filtre `Carburant` est l'**égalité stricte** de `fuelCategory` à l'un des codes
  > cochés : `fuel=B` ne sélectionne **jamais** les codes `2` ni `3`, qui sont des catégories
  > distinctes et non des sous-catégories d'essence ou de diesel ; `fuel=E` ne sélectionne
  > **jamais** `2` ni `3` non plus. Le contrôle affiche les dix codes du vocabulaire, hybrides
  > compris, comme dix cases indépendantes, avec le texte d'aide
  > `Les hybrides ont leur propre catégorie : cochez-la explicitement`. Le clic sur une barre de
  > `G9` (`EX-SCR-165`) pose le code exact de la barre, de sorte que l'effectif de la page après
  > clic soit exactement celui de la barre.
- **Annexe C — `EX-SRCH-11`, MODIFIER** : remplacer la justification « une voiture a un seul
  carburant » par « une annonce porte **exactement un** code de `fuelCategory`, y compris quand ce
  code est une catégorie hybride — c'est la structure du vocabulaire, non une propriété du
  véhicule, qui fonde le OU intra-filtre ».
- **Annexe B — `EX-SCR-73`, MODIFIER** : conserver l'activation de `bot`/`erfrom`/`erto` par les
  codes `2`, `3`, `E`, mais préciser « cette liste sert **uniquement** à décider l'activation d'un
  contrôle enfant ; elle ne définit **aucun** prédicat de filtre et ne rend pas les codes `2` et
  `3` équivalents à `E` ».

### ARB-46 — Sélecteur `G` : six états, recherche vide, `Appliquer`, et piège de focus

- **Constats sources** : `T-12` (MAJEUR).
- **Sévérité retenue** : **MAJEUR**. C'est la seule voie d'accès à l'écran B hors clic sur une
  zone-modèle, et le seul écran du corpus sans aucun état ; le piège de focus non spécifié d'une
  modale bloquante est le défaut d'accessibilité le plus probable de l'application.
- **Annexe B — `EX-SCR-216`, MODIFIER.** Ajouter les cinq blocs suivants :

  > **États**, par identifiant du catalogue : `ET-CHARGE-INIT` (les effectifs par entrée dépendent
  > du périmètre filtré courant, donc d'un calcul : squelette de 12 lignes par panneau, aucun
  > effectif affiché) · `ET-ERREUR-PROVIDER` (message
  > `Liste des marques indisponible — réessayer`, la modale restant ouverte) · `ET-VIDE-FILTRES`
  > (aucune marque n'a de résultat sous les filtres courants : texte
  > `Aucune marque ne correspond à vos filtres — <bouton> Ignorer les filtres`) ·
  > `ET-EFFECTIF-FAIBLE` (sans objet, motif : le sélecteur n'affiche aucune statistique) ·
  > `ET-TROP-RESULTATS` (sans objet, motif : les deux panneaux sont virtualisés par construction) ·
  > `ET-CHAMP-MANQUANT` (une entrée sans effectif calculable affiche `—`, jamais `0`).
  > **Recherche sans correspondance**, sur chacun des deux panneaux :
  > `Aucune marque ne contient « <saisie> »` et `Aucun modèle ne contient « <saisie> »`, avec un
  > bouton `Effacer la recherche`. La recherche porte sur le libellé normalisé par
  > `EX-DATA-70bis`, de sorte que `skoda` trouve `Škoda`.
  > **`Appliquer`** est désactivé si et seulement si aucune marque n'est sélectionnée, ou si la
  > sélection est **identique** à l'état courant de l'écran appelant ; l'infobulle de l'état
  > désactivé dit `sélectionnez une marque` ou `sélection inchangée`.
  > **Focus** : la modale est un piège de focus ; `Tab` circule à l'intérieur des deux panneaux
  > dans l'ordre `champ de recherche marque → liste des marques → champ de recherche modèle →
  > liste des modèles → Annuler → Appliquer` ; `Échap` ferme sans appliquer ; à la fermeture, le
  > focus **retourne au contrôle appelant**. `Flèche gauche`/`Flèche droite` passent d'un panneau à
  > l'autre, `Début`/`Fin` vont au premier et au dernier élément du panneau focalisé.
  > **Plafond** : la sélection de comparaison est plafonnée à 4 modèles (`ARB-43`) ; toute mention
  > de « 12 couples » est supprimée de cette exigence.

### ARB-47 — Étiquetage de la base de comparaison : une exigence transverse et deux emplacements

- **Constats sources** : `T-13` (MAJEUR).
- **Sévérité retenue** : **MAJEUR**. `A-07` fonde explicitement la défendabilité du verdict sur cet
  étiquetage (« c'est l'étiquetage qui rend la décision défendable, pas le calcul ») et aucune
  exigence d'écran n'affiche `cellLevel` ni `cellSize`.
- **Annexe B — `EX-SCR-158bis`, CRÉER** (convention transverse) :

  > `EX-SCR-158bis` — **Étiquetage obligatoire de la base de comparaison.** Tout élément qui affiche
  > un verdict d'outlier, un écart au prix attendu, un `opportunityScore` ou un liseré dérivé de
  > l'un des trois porte, à l'écran ou dans son infobulle, la chaîne normative
  > `écart calculé sur : <périmètre> · n = <cellSize>`, dérivée de `cellLevel` (`EX-DATA-87`) :
  > `MODEL_YEAR` → `<Marque> <Modèle> · <année>` ; `MODEL` → `<Marque> <Modèle>` ;
  > `SELECTION` → `sélection courante`. Elle est suivie de la mention de méthode d'`ARB-18`. Aucun
  > verdict d'outlier n'est affiché sans cette chaîne : un test de recette du lot D4 vérifie la
  > présence de la chaîne partout où un verdict est rendu.
- **Annexe B — `EX-SCR-158`, MODIFIER** : l'infobulle de point de `G4` passe de 5 à **6 lignes**, la
  sixième étant la chaîne d'`EX-SCR-158bis`.
- **Annexe B — `EX-SCR-203` et `EX-SCR-207`, MODIFIER** : la colonne « Écart au prix attendu » de
  l'écran D porte la chaîne d'`EX-SCR-158bis` dans son infobulle de colonne, et le liseré
  d'`EX-SCR-207` dans son infobulle de ligne.
- **Annexe B — `EX-SCR-166`, MODIFIER** : les points hors moustaches de `G10` portent la même
  chaîne dans leur infobulle.

### ARB-51 — Six états sur les écrans C et E, y compris les « sans objet »

- **Constats sources** : `T-19` (MAJEUR).
- **Sévérité retenue** : **MAJEUR**. La règle de la § 8 de `REQUIREMENTS.md` est fausse pour deux
  écrans sur six, et la matrice de recette § 11.1 prétend les vérifier écran par écran.
- **Décision** : compléter par la liste des six états **avec motif explicite** quand l'état ne
  s'applique pas — une omission ne se distingue pas d'un oubli, un « sans objet, motif : … » si.
- **Annexe B — `EX-SCR-200` (écran C), MODIFIER.** Ajouter :

  > États, par identifiant : `ET-CHARGE-INIT` (squelette par colonne, chargement colonne par
  > colonne — déjà spécifié) · `ET-ERREUR-PROVIDER` (erreur d'une colonne, les autres restant
  > rendues — déjà spécifié) · `ET-VIDE-FILTRES` (une colonne à `n = 0` — déjà spécifié ; **et le
  > cas nouveau où toutes les colonnes sont à `n = 0`** : texte
  > `Aucun des modèles comparés n'a d'offre sous ces filtres — élargissez vos critères`, les
  > colonnes restant présentes avec leur en-tête) · `ET-TROP-RESULTATS` (sans objet, motif : l'écran
  > compare au plus 4 modèles et ne trace aucune nuée) · `ET-CHAMP-MANQUANT` (`—` par cellule de la
  > rangée `Synthèse`, note d'exclusion par colonne) · `ET-EFFECTIF-FAIBLE` (jeton ambre par
  > colonne, seuils d'`EX-SCR-33`).
- **Annexe B — `EX-SCR-214` (écran E), MODIFIER.** Ajouter :

  > États, par identifiant : `ET-CHARGE-INIT` (l'effectif actuel de chaque carte dépend d'un
  > calcul : squelette de la ligne d'effectif, le nom et la date restant affichés) ·
  > `ET-ERREUR-PROVIDER` (l'effectif actuel n'est pas calculable : la carte affiche
  > `effectif actuel indisponible`, l'écart est **masqué et jamais affiché à 0**, et la recherche
  > reste ouvrable) · `ET-VIDE-FILTRES` (liste vide — déjà spécifié) · `ET-TROP-RESULTATS` (sans
  > objet, motif : la liste est plafonnée à 50 entrées par `EX-CRUD-5`) · `ET-CHAMP-MANQUANT`
  > (`snapshotInitial` absent d'une entrée écrite par une version antérieure : l'écart est masqué et
  > la carte porte la mention d'`ARB-50`) · `ET-EFFECTIF-FAIBLE` (sans objet, motif : l'écran
  > n'affiche aucune statistique, seulement des effectifs).

### ARB-52 — Fil d'Ariane : une table de segments par route

- **Constats sources** : `T-20` (MINEUR).
- **Sévérité retenue** : **MINEUR**.
- **Annexe B — `EX-SCR-45`, MODIFIER.** Ajouter la table :

  > | Route | Segments | Comportement du dernier lien actif |
  > |---|---|---|
  > | `/marche` | `Marché` | — |
  > | `/marche/:makeId-:makeSlug/:modelId-:modelSlug` | `Marché > <marque> > <modèle>` | `<marque>` ramène à `/marche` avec `make` posé et les autres filtres conservés |
  > | `…/annonces` | `Marché > <marque> > <modèle> > Annonces` | `<modèle>` ramène à l'écran B, **filtres conservés** ; c'est le chemin de retour nommé de l'écran D |
  > | `/comparer` | `Marché > Comparaison` | `Marché` ramène à `/marche`, filtres conservés |
  > | `/recherches` | `Marché > Recherches enregistrées` | idem |
  > | `/suivis` | `Marché > Modèles suivis` | idem |
  >
  > La hauteur du fil d'Ariane est fixe quel que soit le nombre de segments ; un segment trop long
  > est tronqué selon `EX-SCR-13`, jamais replié sur deux lignes.

### ARB-53 — `EX-SCR-67` énumère son périmètre, et `lsyeinmifrom` reçoit un contrôle

- **Constats sources** : `T-21` (MINEUR).
- **Sévérité retenue** : **MINEUR**. Un filtre retenu sans type de contrôle ne sera pas construit,
  mais l'oubli porte sur un seul filtre de leasing.
- **Annexe B — `EX-SCR-67`, MODIFIER** : remplacer « les 24 couples d'intervalle du catalogue
  retenus » par l'énumération nominative des couples `from`/`to` effectivement retenus, recopiée de
  `filters-scope.json` (types `range_min` et `range_max` appariés par préfixe de nom), et ajouter :

  > Un paramètre de borne **isolée**, sans jumeau dans le catalogue — cas de `lsyeinmifrom`
  > (kilométrage annuel de leasing) — reçoit un contrôle à **borne unique**, libellé
  > `au moins <valeur>`, sérialisé comme un `from` seul (`EX-NAV-7`). Tout filtre de
  > `filters-scope.json` de type `range_min` sans `range_max` de même préfixe relève de ce contrôle.
- **Annexe B — `EX-SCR-83`, MODIFIER** : ajouter au test de complétude « et vérifie que tout filtre
  non exclu possède **exactement un** type de contrôle parmi ceux d'`EX-SCR-63` à `EX-SCR-72` ;
  le test échoue s'il en possède zéro ou deux ».

## 2.4 Décisions relevant principalement de l'annexe C

### ARB-41 — Routes et état d'interface dans l'URL : l'annexe C reprend son domaine

- **Constats sources** : `T-06` (BLOQUANT).
- **Sévérité retenue** : **BLOQUANT**. Le partage par lien est le mécanisme central (`EX-NAV-18`) et
  il est testé par égalité stricte de chaîne sérialisée (§ 11.1) ; l'annexe C ne connaît que quatre
  routes sur six et **aucun** des paramètres d'état d'interface qu'`EX-SCR-50` rend obligatoires.
- **Décision, en trois parties.** (1) La table des routes est reprise de `REQUIREMENTS.md` § 5.
  (2) Une table des paramètres d'état d'interface est créée, avec domaine, défaut omis, entrée
  d'historique et comptabilisation dans le plafond. (3) Sur la sélection de brossage, `EX-SCR-50`
  est **amendé** : l'empreinte est remplacée par un encodage par bornes d'intervalle sur les axes du
  graphe. Justification de ce dernier point : une empreinte ne restitue pas un sous-ensemble
  d'annonces, donc la promesse « pixel-identique » d'`EX-SCR-50` est intenable telle quelle ; les
  bornes d'axe la rendent vraie **et** rendent le lien indépendant du snapshot, ce qu'une liste de
  `listingId` ne serait pas.
- **Annexe C — § A.1, MODIFIER : remplacer la table de quatre routes par six lignes.**

  > | Réf. | Route | Écran | Paramètres de chemin |
  > |---|---|---|---|
  > | `EX-NAV-1` | `/marche` | A — survol du marché | aucun |
  > | `EX-NAV-2` | `/marche/:makeId-:makeSlug/:modelId-:modelSlug` | B — distribution | `makeId`, `modelId` font foi ; les deux `slug` sont cosmétiques et déclenchent la redirection canonique d'`EX-SCR-140` s'ils ne correspondent pas |
  > | `EX-NAV-2bis` | `/marche/:makeId-:makeSlug/:modelId-:modelSlug/annonces` | D — annonces | idem |
  > | `EX-NAV-2ter` | `/comparer` | C — comparaison | aucun ; les modèles comparés sont dans `m` |
  > | `EX-NAV-3` | `/recherches` | E — recherches enregistrées | aucun |
  > | `EX-NAV-4` | `/suivis` | F — modèles suivis (`ARB-44`) | aucun |
  >
  > Les anciennes routes `/` et `/modele/:makeId/:modelId` sont conservées en **lecture seule** et
  > redirigent par `replaceState` vers `/marche` et vers la route canonique de l'écran B, filtres
  > conservés.
- **Annexe C — `EX-NAV-10bis`, CRÉER : table des paramètres d'état d'interface.**

  > | Paramètre | Domaine | Défaut (non émis) | Entrée d'historique | Compte dans le plafond de 2 000 |
  > |---|---|---|---|---|
  > | `m` | liste de `<makeId>-<modelId>`, virgules, 1 à 4 entrées | absent | `pushState` | oui |
  > | `g<n>log` | `1` | absent | `replaceState` | oui |
  > | `grp` | liste des identifiants de groupes de filtres **dépliés**, virgules | absent (tous repliés sauf le primaire) | `replaceState` | oui |
  > | `mk` | liste de `makeId` de cartes dépliées, virgules | absent | `replaceState` | oui |
  > | `sort` | `offres` \| `median` \| `alpha` \| `modeles` | `offres` | `replaceState` | oui |
  > | `g4v` | `a` \| `b` | `a` | `replaceState` | oui |
  > | `selx` / `sely` | deux bornes numériques par axe, forme `<lo>-<hi>` | absent | `pushState` | oui |
  >
  > Tous ces paramètres suivent l'ordre canonique alphabétique d'`EX-NAV-9` et la règle « défaut non
  > émis » d'`EX-NAV-8`. Le paramètre de tri de l'écran A s'appelle `sort` et son domaine est celui
  > d'`EX-SCR-120` : il n'a **aucun rapport** avec le paramètre `sort` d'AutoScout24, qui n'est
  > exposé que sur l'écran D (`EX-SRCH-23`) — les deux ne coexistent jamais sur la même route.
- **Annexe B — `EX-SCR-202` et `EX-SCR-50`, MODIFIER** :

  > La sélection de brossage est encodée par les **bornes d'intervalle des axes du graphe**
  > (`selx`, `sely` d'`EX-NAV-10bis`), et **non** par une empreinte : une empreinte ne restitue pas
  > un sous-ensemble d'annonces. Une URL portant `selx`/`sely` restitue la même sélection de
  > brossage sur tout snapshot où les axes ont un sens, et la restitution est **exacte** au sens
  > d'`EX-SCR-50`. Le paramètre `sel` de l'écran D porte les mêmes bornes, avec la sémantique de
  > restriction d'affichage d'`ARB-34`. Toute mention d'une « empreinte » de sélection est
  > supprimée.
- **Annexe C — `EX-NAV-12`, MODIFIER** : « une entrée d'historique est produite par changement de
  filtre appliqué **et** par les paramètres marqués `pushState` dans `EX-NAV-10bis` ; les
  paramètres marqués `replaceState` ne produisent jamais d'entrée d'historique ».

### ARB-43 — Sélection de comparaison : une entité de session, un plafond unique de 4 modèles

- **Constats sources** : `T-09` (BLOQUANT).
- **Sévérité retenue** : **BLOQUANT**. Le compteur d'onglet, la case des cartes-marques et la règle
  de désactivation sont spécifiés au pixel alors que l'objet qu'ils manipulent n'existe pas ; et
  « comparer une marque » n'a aucune représentation, la route n'acceptant que des `modelId`.
- **Décision — option (a) de `T-09` : la comparaison porte sur des modèles seulement, et
  `EX-SCR-111` est retiré.** Justification : étendre l'écran C aux périmètres de marque
  demanderait d'étendre la route **et** tous les agrégats de colonne, pour un usage qu'aucun des
  deux parcours cibles ne décrit — alors que retirer une case de la carte-marque coûte une ligne.
- **Annexe C — `EX-CRUD-13bis`, CRÉER dans § C (entité non persistée)** :

  > **EX-CRUD-13bis — `CompareSelection`, entité de session.**
  > `{ modelKeys: liste ordonnée de couples (makeId, modelId), 0 à 4 entrées }`.
  > **Portée** : l'onglet du navigateur. **Non persistée** : elle ne vit ni dans `localStorage`, ni
  > dans `IndexedDB`, ni dans l'URL tant que l'utilisateur n'est pas sur `/comparer` ; elle est
  > perdue à la fermeture de l'onglet, et **vidée** au remplacement du snapshot (`ARB-49`).
  > **Plafond unique : 4 modèles.** Au-delà, tout contrôle d'ajout est **désactivé** avec
  > l'infobulle `4 modèles au maximum — retirez-en un pour en ajouter un autre` ; aucun ajout
  > silencieux, aucun surnuméraire ignoré. **Ajout et retrait** sont possibles depuis : la case de
  > comparaison d'une zone-modèle (écran A), le bouton `Comparer` de l'en-tête de l'écran B
  > (`EX-SCR-142`), et l'écran C lui-même. **Doublons interdits** : ajouter un couple déjà présent
  > est sans effet. **Navigation** : la sélection survit à toute navigation interne, y compris un
  > changement de route. **URL** : sur `/comparer`, elle est sérialisée dans `m`
  > (`EX-NAV-10bis`) ; l'ouverture d'une URL `/comparer?m=…` **remplace** la sélection de session
  > par celle de l'URL, en ignorant les entrées au-delà de la quatrième et en signalant
  > l'écrêtage par `ET-URL-CORRIGEE`. La clé réservée `modelId = 0` **ne peut pas** entrer dans la
  > sélection (`ARB-59`).
- **Annexe B — `EX-SCR-111`, SUPPRIMER** (ajout d'une **marque** à la sélection de comparaison), et
  reporter le motif : « la comparaison porte sur des modèles ; comparer deux marques n'a aucune
  représentation dans la route ni dans les agrégats de colonne de l'écran C (`ARB-43`) ».
- **Annexe B — `EX-SCR-118`, `EX-SCR-194`, `EX-SCR-197`, `EX-SCR-216`, MODIFIER** : aligner sur le
  plafond unique de 4 et sur `EX-CRUD-13bis` ; supprimer la mention « 12 couples » d'`EX-SCR-216` et
  la mention « surnuméraires ignorés » d'`EX-SCR-194`.

### ARB-44 — Les quatre surfaces orphelines : trois reçoivent un emplacement, une est retirée

- **Constats sources** : `T-10` (MAJEUR).
- **Sévérité retenue** : **MAJEUR**. L'onglet manquant rend `/suivis` inatteignable au clavier
  comme à la souris, et chaque développeur placerait ces surfaces ailleurs.
- **Décision, surface par surface.** Justification générale : le CRUD des modèles suivis et de
  l'historique est **retenu par `REQUIREMENTS.md` § 7** ; retirer les fonctions serait un
  rétrécissement de périmètre, que `A-01` a déjà refusé sur les filtres. On ajoute donc les points
  d'entrée, sauf pour l'export du mode 1, dont le contrôle existe déjà ailleurs.
  1. **Modèles suivis** → écran **F** sur `/suivis`, et l'en-tête passe de trois à **quatre**
     onglets.
  2. **Historique récent** → panneau latéral de l'écran E, pas d'écran propre.
  3. **Export du mode 1** → un contrôle `Exporter` dans la barre de synthèse de l'écran A.
  4. **`Mentions`** → page statique, hors périmètre du modèle de données.
- **Annexe B — `EX-SCR-42`, MODIFIER** : « exactement **quatre** onglets : `Marché`, `Comparer (n)`,
  `Recherches`, `Suivis (n)` », `n` étant l'effectif de l'entité correspondante, l'onglet portant
  son compteur uniquement quand `n ≥ 1`.
- **Annexe B — `EX-SCR-142`, MODIFIER** : ligne 3 de l'en-tête de l'écran B passe de trois à
  **quatre** boutons : `Voir les <n> annonces`, `Comparer`, **`Suivre` / `Ne plus suivre`**
  (bascule exigée par `EX-CRUD-9`), `Exporter`.
- **Annexe B — `EX-SCR-214bis`, CRÉER** : écran F `Modèles suivis`, une carte par modèle suivi
  (marque, modèle, date d'ajout, effectif actuel, bouton `Ne plus suivre`), les six états par
  identifiant sur le modèle d'`ARB-51`, et le plafond de 30 d'`EX-CRUD-10` signalé dans l'en-tête.
- **Annexe B — `EX-SCR-212`, MODIFIER** : l'écran E porte un panneau latéral `Recherches récentes`
  listant les 10 entrées FIFO d'`EX-CRUD-11`, avec l'action unique `Vider l'historique`
  (`EX-CRUD-13`) et aucune suppression unitaire.
- **Annexe B — `EX-SCR-23`, `EX-SCR-29`, `EX-SCR-107`, MODIFIER** : le contrôle `Exporter` de
  l'écran A est situé dans la **barre de synthèse** de l'écran A ; c'est celui que `EX-SCR-23` et
  `EX-SCR-29` désactivent.
- **Annexe B — `EX-SCR-47`, MODIFIER** : le lien `Mentions` du pied de page ouvre une page statique
  `/mentions`, sans donnée de marché, sans état dégradé, hors de l'inventaire des écrans
  fonctionnels.
- **`POUR_COORDINATEUR`** : l'inventaire des écrans de `REQUIREMENTS.md` § 5 doit recevoir la ligne
  `F | Modèles suivis | /suivis | ajout, requis par EX-CRUD-9`, et la route `/mentions` en note.
  Recommandation : l'ajouter, la fonction étant déjà retenue en § 7.

### ARB-45 — Écran E : `effectifInitial` et `snapshotInitial`, figés à la création

- **Constats sources** : `T-11` (MAJEUR).
- **Sévérité retenue** : **MAJEUR**. La veille de marché, seule justification de l'écran, n'est pas
  implémentable ; et deux développeurs produiraient deux sémantiques d'écart incompatibles.
- **Annexe C — `EX-CRUD-1`, MODIFIER.** La liste de champs devient :

  > Champs : `id` (généré), `nom` (texte, 1-60 caractères, obligatoire), `url` (chemin + requête au
  > moment de l'enregistrement), `mode` (1 ou 2, dérivé de `url`), `créée_le`,
  > `dernier_accès_le`, **`effectifInitial`** (entier — l'effectif d'**annonces** de la sélection
  > au moment de l'enregistrement, jamais un nombre de marques ni de modèles),
  > **`snapshotInitial`** (`snapshotId` du snapshot actif à l'enregistrement),
  > **`schemaVersion`** (`ARB-50`). `effectifInitial` et `snapshotInitial` sont **figés à la
  > création et jamais réécrits**, y compris à l'ouverture de la recherche.
- **Annexe B — `EX-SCR-213`, MODIFIER** :

  > L'effectif actuel est **recalculé à l'ouverture de l'écran E**, sur le snapshot courant. L'écart
  > `+ <k> offres depuis le <date de création>` n'est affiché **que si**
  > `snapshotInitial ≠ snapshotId courant` **et** si l'effectif actuel est calculable ; sinon il est
  > **masqué**, et jamais affiché à `0` ni à `+ 0`. Quand l'effectif actuel n'est pas calculable, la
  > carte affiche `effectif actuel indisponible` (`ARB-51`). L'écart est un nombre d'annonces, avec
  > son signe, et jamais un pourcentage.

### ARB-49 — Cycle de vie du snapshot : un seul actif, un `Rafraîchir` explicite

- **Constats sources** : `T-17` (MAJEUR).
- **Sévérité retenue** : **MAJEUR**. C'est la question dont dépendent la fraîcheur affichée, la
  validité du cache et la cohérence des chiffres au sein d'une session ; deux développeurs
  choisiraient « une requête au chargement » et « une revalidation à chaque navigation ».
- **Décision — un seul snapshot actif, acquisition au démarrage et sur action explicite, aucune
  acquisition automatique en cours de session.** Justification : l'enveloppe mémoire corrigée par
  `ARB-55` (≈ 274 Mo à `N = 10⁶`) ne laisse pas la place à deux snapshots, et un remplacement
  automatique changerait les chiffres sous les yeux de l'utilisateur au milieu d'une analyse.
- **Annexe C — § A.7 « Cycle de vie du snapshot », CRÉER, trois exigences.**

  > **EX-NAV-23 — un seul snapshot actif.** L'application détient **un** snapshot actif à la fois.
  > Il est acquis au démarrage et **remplacé** uniquement sur action explicite `Rafraîchir`, placée
  > dans le jeton de snapshot d'`EX-SCR-43`. **Aucune acquisition automatique** n'a lieu en cours de
  > session : ni périodique, ni au retour de focus, ni à la navigation.

  > **EX-NAV-24 — ce que le remplacement purge.** Au remplacement d'un snapshot : le cache LRU de
  > sélections d'`EX-DATA-109` est **vidé**, le cache de jeux de données locaux d'`EX-SRCH-9ter`
  > est **vidé**, les agrégats précalculés de la sélection vide sont **recalculés**, et
  > `CompareSelection` (`EX-CRUD-13bis`) est **vidée**. Sont **conservées** intactes les trois
  > entités CRUD persistées (recherches sauvegardées, modèles suivis, historique récent) : elles
  > portent des URL, non des données de snapshot. L'état de filtres courant et la route sont
  > conservés ; un filtre devenu sans effet est traité par `EX-SCR-101`.

  > **EX-NAV-25 — signalement.** Après un remplacement, le bandeau non bloquant refermable
  > `Nouvelles données du <date du nouveau snapshot> — la page a été recalculée` est affiché une
  > fois. Si le nouveau snapshot a un `sourceKind = SYNTHETIC` différent du précédent, le
  > signalement d'`EX-DATA-107` s'affiche en plus et n'est pas refermable.

### ARB-50 — Versionnement et migration des données persistées

- **Constats sources** : `T-18` (MAJEUR).
- **Sévérité retenue** : **MAJEUR**. Le cas est certain, pas hypothétique : une recherche
  sauvegardée est une **URL** dont le vocabulaire de paramètres évolue (`ARB-02`, `ARB-41`), et
  `EX-CRUD-4` interdit d'en modifier le contenu.
- **Annexe C — `EX-CRUD-18`, CRÉER** :

  > **EX-CRUD-18 — version de schéma et migration.** Chaque enregistrement persisté porte
  > `schemaVersion` (entier, incrémenté à chaque changement de forme d'une entité CRUD ou du
  > vocabulaire de paramètres d'URL). À la lecture :
  > • `schemaVersion` égale à la version courante → l'entrée est utilisée telle quelle ;
  > • `schemaVersion` inférieure et une fonction de migration nommée existe → l'entrée est migrée
  > **en mémoire**, utilisée, et **réécrite** en version courante, la réécriture étant la seule
  > exception à `EX-CRUD-4` et portant sur la forme, jamais sur l'intention des filtres ;
  > • `schemaVersion` inférieure et aucune migration disponible → l'entrée est **conservée**,
  > utilisable, et marquée à l'écran
  > `à vérifier — enregistrée par une version antérieure de l'application` ;
  > • `schemaVersion` supérieure à la version courante → l'entrée est conservée, non ouvrable, et
  > marquée `enregistrée par une version plus récente`.
  > **Aucune entrée n'est jamais supprimée silencieusement**, à aucune version. Un paramètre
  > d'URL retiré du vocabulaire est traité à l'ouverture par la table de corrections d'`EX-NAV-21`,
  > donc signalé par `ET-URL-CORRIGEE`.

### ARB-33 — Prédicat de filtre sur le champ canonique, et une seule constante de conversion

- **Constats sources** : `AMB-19` (BLOQUANT).
- **Sévérité retenue** : **BLOQUANT**. 640 offres contre 430 sur une sélection de 1 281 annonces,
  avec trois histogrammes, une médiane et une liste d'outliers différents ; l'effet est
  systématique, pas marginal.
- **Les deux lectures** : comparaison sur le champ dérivé `powerHp` arrondi, contre conversion de la
  borne vers le kW canonique.
- **Décision — comparaison sur le champ canonique, borne convertie sans arrondi.** Justification :
  `EX-DATA-36` fait du kilowatt la grandeur canonique et des chevaux une valeur **dérivée** ;
  comparer sur le dérivé ferait dépendre le résultat d'un arrondi d'affichage.
- **Annexe C — `EX-SRCH-11bis`, CRÉER** :

  > **EX-SRCH-11bis — unité d'évaluation d'un prédicat.** Tout prédicat de filtre s'évalue sur le
  > **champ canonique** du dictionnaire, dans son **unité canonique** (`EX-DATA-4`). Une borne
  > saisie dans une unité d'affichage est convertie vers l'unité canonique **sans arrondi
  > intermédiaire**, en double précision, avant comparaison. Pour `powertype = hp` :
  > `powerKw ≥ borne_ch × 0,7355` et `powerKw ≤ borne_ch × 0,7355`, la constante étant celle
  > d'`EX-DATA-36` (DIN 66036) et **aucune autre**. Le champ dérivé `powerHp` est un champ
  > d'**affichage** et n'est jamais le membre gauche d'un prédicat.
- **Annexe C — `EX-SRCH-16`, MODIFIER** : supprimer « facteur 1 kW ≈ 1,359 ch » et le remplacer par
  « la conversion applique la constante unique d'`EX-DATA-36` (`1 kW = 1/0,7355 ch`) ; aucune autre
  valeur de facteur n'apparaît dans le corpus ».
- **Annexe B — `EX-SCR-73`, MODIFIER** : ajouter « le prédicat de `powerfrom`/`powerto` est celui
  d'`EX-SRCH-11bis` ; le contrôle affiche la valeur dans l'unité choisie et convertit à
  l'évaluation ».

### ARB-37 — Export : l'annexe C fixe le périmètre, l'annexe A les colonnes, l'annexe B le bouton

- **Constats sources** : `T-16` (MAJEUR), `AMB-31` (MAJEUR).
- **Sévérité retenue** : **MAJEUR**. Un menu à une entrée contre trois, un fichier de 17, 200 ou
  1 281 lignes, une entrée `PNG` présente contre absente, et un renvoi de colonnes circulaire.
- **Déduplication assumée** : `AMB-31` porte sur le **périmètre des lignes** et le nombre d'entrées
  du menu, `T-16` sur les **colonnes**. Décider l'un sans l'autre laisse le fichier indéfini.
- **Décision — application d'`A-09` sans arbitrage nouveau : le cycle de vie du CRUD, donc l'export,
  appartient à l'annexe C ; les colonnes sont une définition de données, donc à l'annexe A ;
  l'annexe B ne décrit que l'emplacement du bouton.** Sur le fond : **deux** entrées de menu, pas
  trois ni une — l'export d'annonces est retenu (il sert le parcours 2 et `A-02` fait exister la
  liste), l'export d'image reste écarté par `EX-CRUD-17`.
- **Annexe C — `EX-CRUD-16`, MODIFIER.** Texte de remplacement :

  > Périmètre mode 2 : le menu `Exporter` propose **exactement deux** entrées.
  > (1) `CSV des annonces du périmètre` — une ligne par annonce de la sélection courante, colonnes
  > d'`EX-DATA-123bis`, **aucun champ identifiant un vendeur** (R3).
  > (2) `CSV des agrégats affichés` — une ligne par bucket de **chacun des trois histogrammes**
  > imposés, le nom du graphe en première colonne. La notion d'« onglet actif » est **supprimée** :
  > `EX-SCR-141` affiche les trois histogrammes côte à côte, il n'existe donc pas de graphe
  > courant.
  > Aucune entrée `PNG` : l'export d'image reste écarté par `EX-CRUD-17`.
- **Annexe C — § C.4, MODIFIER** : remplacer « jamais une annonce individuelle avec ses champs
  bruts » par « jamais un champ interdit par R3 ; l'export par annonce est autorisé et limité aux
  colonnes d'`EX-DATA-123bis` ».
- **Annexe A — `EX-DATA-123bis`, CRÉER** :

  > **EX-DATA-123bis — colonnes d'export, par périmètre.** Encodage UTF-8 avec BOM, séparateur
  > point-virgule (`EX-CRUD-14`). Une valeur `INCONNU` s'écrit **cellule vide**, jamais `0` et
  > jamais `null`. Les nombres sont écrits avec la virgule décimale et sans séparateur de milliers.
  > Les arrondis sont ceux de l'écran (`EX-DATA-6`, `ARB-21`).
  > **Trois lignes de métadonnées** précèdent l'en-tête, chacune sur une seule cellule :
  > `# snapshot;<snapshotId>;<capturedAt ISO-8601>;<sourceKind>` ·
  > `# filtres;<chaîne de requête canonique complète, EX-NAV-9>` ·
  > `# couverture;<sampleCoverage ou NON_APPLICABLE>;<metricCoverage de la métrique principale>`.
  > **Agrégats mode 1**, une ligne par couple marque/modèle affiché :
  > `marque;modele;offres;prix_median;prix_p5;prix_p95;prix_min;prix_max;annee_min;annee_max;km_min;km_max;n_prix;n_annee;n_km`.
  > **Buckets mode 2**, une ligne par bucket : `graphe;index;borne_basse;borne_haute;ouvert;effectif;part`.
  > **Points de nuée** : `listing_id;prix;annee_mois;km;carburant;puissance_kw;prix_attendu;ecart_pct;score_opportunite;drapeaux_outlier;cellule;cellule_n;url`.
  > **Annonces** : les colonnes des points de nuée, plus `modele_version;type_vendeur;pays;region;etat_usage`.
  > **Nom de fichier** : `kycar_<perimetre>_<snapshotId>_<AAAAMMJJ>.csv`.
- **Annexe B — `EX-SCR-187`, MODIFIER** : l'exigence ne décrit plus que l'**emplacement et l'état**
  du bouton ; le nombre d'entrées, leur libellé, le périmètre des lignes et l'en-tête de fichier
  renvoient à `EX-CRUD-16` et `EX-DATA-123bis`. Conserver la désactivation en `ET-PARTIEL-CACHE` et
  `ET-CHARGE-INIT`.

### ARB-38 — Percentile de performance : rang le plus proche supérieur, sur 100 exécutions

- **Constats sources** : `AMB-32` (MAJEUR).
- **Sévérité retenue** : **MAJEUR**. Le même jeu de 20 mesures fait échouer (`205,25 ms`) ou réussir
  (`195 ms`) une exigence non fonctionnelle chiffrée, donc conditionne le passage de la phase 2.5.
- **Décision — percentile de rang, distinct du `Q` de type 7.** Justification : le `Q` de type 7 est
  réservé aux statistiques de données par `EX-DATA-62` ; l'interpoler sur des latences ferait
  dépendre le verdict d'une mesure aberrante unique.
- **Annexe C — § D.2, CRÉER en tête `EX-NFR-4bis`** :

  > **EX-NFR-4bis — définition du percentile de performance.** Tout percentile de cette section est
  > le **percentile de rang le plus proche supérieur** : sur l'échantillon de mesures trié,
  > `p95 = x_{⌈0,95·n⌉}`, **sans interpolation**. Il est **distinct** du `Q` de type 7
  > d'`EX-DATA-62`, réservé aux statistiques de données. Chaque cible est mesurée sur **au moins
  > 100 exécutions** du geste décrit, sur le jeu de référence d'`EX-NFR-1` et l'appareil de
  > référence d'`EX-SCR-100`, **chargement à froid exclu**, et la campagne publie `n`, la médiane
  > et le `p95`.
- **Annexe C — `EX-NFR-8`, MODIFIER** : remplacer « `≥ 30 images/seconde` **soutenues** | p95 » par
  « **aucune fenêtre glissante de 1 s ne descend sous 30 images/seconde dans au moins 95 % des
  fenêtres** d'une rotation continue de 10 s ; la mesure publie le nombre de fenêtres, le nombre de
  fenêtres en défaut et le débit minimal observé ».

### ARB-56 — Plafond d'URL : `EX-NAV-18` est borné explicitement, et le calcul d'`ADV-10` est corrigé

- **Constats sources** : `ADV-10` (MAJEUR).
- **Sévérité retenue** : **MAJEUR**. Deux exigences absolues se contredisent : « il n'existe aucun
  état de filtre qui ne soit pas représentable dans l'URL » (`EX-NAV-18`) et le refus dur au-delà de
  2 000 caractères (`EX-NAV-11`).
- **Recalcul fait par cet arbitre** : la somme des seuls noms de paramètres des 77 filtres retenus,
  augmentée de `=` et de `&`, vaut **682 caractères** (mesurée sur `filters-scope.json`). Avec des
  valeurs plausibles par type — énumération simple 2, énumération multiple 15, borne 6, booléen 1,
  structuré 15 — la requête atteint **≈ 1 165 caractères** ; en portant `eq` à sa valeur large de
  540 caractères (`EX-NAV-10`), **≈ 1 690**, plus l'origine et le chemin, soit **≈ 1 720**.
  Le plafond de 2 000 n'est donc **pas** dépassé dans le cas que l'agent décrit : son estimation de
  « 20 caractères en moyenne par filtre » surévalue le total, et le chiffre de « 2 100+ » n'est pas
  établi. **Le constat reste fondé pour autant** : il existe des états atteignables qui dépassent —
  `eq` large **plus** deux ou trois énumérations multiples larges (`bcol`, `eq`, `body`, `make`)
  suffisent —, donc la contradiction entre `EX-NAV-18` et `EX-NAV-11` est réelle, seule son
  imminence était surestimée. Je le dis explicitement.
- **Décision** : borner la promesse de `EX-NAV-18` au lieu de relever le plafond. Justification :
  relever le plafond déplacerait le problème vers les proxys et les messageries, alors que le refus
  visible d'`EX-NAV-11` est déjà le bon comportement.
- **Annexe C — `EX-NAV-18`, MODIFIER.** Ajouter :

  > Cette pureté est bornée par `EX-NAV-10` : tout état de filtre **dont la sérialisation canonique
  > tient sous 2 000 caractères** est représentable dans l'URL, et l'application refuse de
  > construire un état qui n'y tient pas (`EX-NAV-11`). « Tous les filtres sont encodables »
  > (`A-01`) signifie que **chacun** est encodable, non que **tous** le sont simultanément à leurs
  > valeurs les plus larges. Mesure de référence : les 77 filtres retenus posés chacun à une valeur
  > non défaut plausible occupent ≈ 1 720 caractères, `eq` large compris ; la marge est donc réelle
  > mais non infinie, et le cas de dépassement est atteignable en élargissant deux ou trois filtres
  > multi-valeurs. Un test du lot D4 construit l'état de filtres le plus large possible et vérifie
  > que le refus d'`EX-NAV-11` se produit **avec son message**, sans troncature ni perte
  > silencieuse.

### ARB-57 — Rafales de filtres `R` : regroupement obligatoire au-delà de trois changements

- **Constats sources** : `ADV-12` (MAJEUR).
- **Sévérité retenue** : **MAJEUR**. `EX-SCR-25` interdit « tout indicateur de chargement d'aucune
  sorte » pour un recalcul local, et rien ne prévoit l'annulation d'un recalcul local : une rafale
  de 60 changements en 3 s représente jusqu'à 9 s de calcul cumulé pendant lesquelles aucun état
  dégradé ne s'applique formellement.
- **Décision** : ajouter une règle de regroupement, et une porte de sortie vers l'état existant.
  Justification : la promesse « aucun indicateur » n'est tenable que si le recalcul reste sous
  150 ms, ce que la rafale invalide — il faut donc borner la rafale, pas la promesse.
- **Annexe C — `EX-SRCH-1bis`, CRÉER** :

  > **EX-SRCH-1bis — regroupement des rafales de filtres de classe `R`.** Un contrôle de classe `R`
  > s'applique immédiatement (`EX-SRCH-1`, débounce 0 ms) **tant que** moins de trois changements
  > ont eu lieu dans les 300 ms écoulées. Au **troisième** changement dans cette fenêtre,
  > l'application entre en mode groupé : les changements suivants sont accumulés et un **unique**
  > recalcul est déclenché 200 ms après le dernier changement reçu. Un recalcul local en cours
  > n'est jamais interrompu, mais **au plus un** recalcul est en attente à tout instant : un
  > nouveau changement remplace le recalcul en attente au lieu de s'y ajouter — il n'existe donc
  > jamais de file. Dès l'entrée en mode groupé, l'état `ET-CHARGE-LOCAL` cède la place à
  > `ET-CHARGE-MAJ` (`EX-SCR-25`), qui **porte** un indicateur : l'interdiction d'indicateur ne
  > vaut que pour un recalcul unique sous 150 ms.
- **Annexe B — `EX-SCR-25`, MODIFIER** : ajouter « l'interdiction de tout indicateur vaut pour un
  recalcul **unique** ; en mode groupé (`EX-SRCH-1bis`), l'état passe à `ET-CHARGE-MAJ` et
  l'indicateur apparaît ».

### ARB-58 — Concurrence multi-onglets sur les entités CRUD

- **Constats sources** : `ADV-13` (MAJEUR).
- **Sévérité retenue** : **MAJEUR**. Un schéma lire-modifier-écrire non verrouillé perd une entrée
  ou dépasse silencieusement le plafond dur d'`EX-CRUD-5`, et rien n'empêche l'utilisateur d'ouvrir
  deux onglets.
- **Annexe C — `EX-CRUD-19`, CRÉER** :

  > **EX-CRUD-19 — concurrence entre onglets.** Toute écriture d'une entité CRUD est **relue juste
  > avant d'être écrite** (lecture-vérification-écriture) : si le plafond de l'entité
  > (`EX-CRUD-5` : 50, `EX-CRUD-10` : 30, `EX-CRUD-12` : 10) est atteint entre la lecture initiale
  > et l'écriture, l'écriture est **refusée** avec le message de plafond, jamais appliquée en
  > dépassement. Deux écritures concurrentes ne peuvent jamais faire perdre une entrée existante :
  > l'écriture porte sur l'entrée ajoutée ou modifiée, jamais sur la réécriture de la collection
  > entière. Chaque onglet s'abonne à l'événement `storage` et **rafraîchit** sa liste affichée
  > sans recharger la page ; l'écran E et l'écran F affichent alors la liste à jour.
  > **Justification** : `localStorage` n'offre aucune garantie transactionnelle entre onglets d'une
  > même origine, et le plafond dur promis par `EX-CRUD-5` n'est pas tenable sans cette relecture.

### ARB-12 — Lien tronqué par une messagerie : une limite déclarée, pas une règle inventée

- **Constats sources** : `ADV-01` (BLOQUANT proposé).
- **Sévérité retenue** : **MINEUR** — `RE-COTÉ`, et la re-cotation est motivée point par point.
  Motif : (a) aucun développeur n'est bloqué et deux implémentations conformes produisent le
  **même** comportement — les deux critères du barème BLOQUANT et MAJEUR sont donc absents ;
  (b) la prémisse « rien à l'écran ne permet de faire la différence » est **partiellement fausse** :
  le bandeau de filtres affiche le jeton du filtre actif avec sa valeur, donc l'écran dit bien
  `à partir de 50 €` ; (c) aucune exigence ne peut restituer une intention perdue hors de
  l'application. Ce qui reste fondé, et justifie une décision : la classe de risque n'est **pas
  déclarée**, et le jeton doit afficher la valeur, ce qu'aucune exigence n'impose explicitement.
- **Annexe C — `EX-NAV-18`, MODIFIER.** Ajouter :

  > **Limite connue du modèle de partage par URL pure.** Une valeur numérique tronquée en cours de
  > valeur par un transport externe (client de messagerie, éditeur de texte) reste
  > syntaxiquement valide et dans le domaine du filtre : elle n'est donc corrigée par aucune ligne
  > de la table d'`EX-NAV-21` et ne déclenche aucun signalement. L'application n'a aucun moyen de
  > la détecter et **n'en invente aucun** : aucune somme de contrôle, aucune signature, aucun
  > paramètre de longueur n'est ajouté à l'URL, car ils allongeraient le lien — cause première du
  > problème — et casseraient tout lien écrit à la main. La contre-mesure est l'**affichage
  > systématique de la valeur** de chaque filtre actif dans son jeton (`EX-SCR-176`), de sorte que
  > l'utilisateur lise `Prix : à partir de 50 €` et non `Prix`.
- **Annexe B — `EX-SCR-176`, MODIFIER** : « le jeton d'un filtre actif affiche **toujours** son
  libellé **et sa valeur** ; un jeton qui n'affiche que le nom du filtre est interdit ».
- **Dette consignée** : la classe de risque est enregistrée comme dette explicite en § 5.

### ARB-63 — Impression : hors périmètre v1, et c'est une décision écrite

- **Constats sources** : `T-23` (MINEUR).
- **Sévérité retenue** : **MINEUR**.
- **Décision — hors périmètre v1, avec une feuille de secours minimale.** Justification : l'export
  CSV et l'export d'image tranché par `EX-CRUD-17` couvrent le besoin de sortie ; mais laisser
  l'impression totalement non spécifiée produirait une capture des éléments collants, ce qui est le
  seul cas où l'inaction dégrade activement le résultat.
- **Annexe C — `EX-NFR-28`, CRÉER** :

  > **EX-NFR-28 — impression.** L'impression et l'export PDF d'un écran sont **hors périmètre
  > fonctionnel v1** : aucune mise en page d'impression n'est spécifiée, aucune table de données
  > n'est ajoutée pour l'impression. Une feuille `@media print` **minimale** est néanmoins exigée,
  > et son contenu est clos : les éléments collants (en-tête, bandeau de filtres, barre de
  > synthèse) perdent leur positionnement fixe ; les bandeaux d'état et le bandeau `C3` sont
  > imprimés ; le bandeau de filtres est remplacé par un résumé textuel des filtres actifs, un par
  > ligne ; les contrôles interactifs ne sont pas imprimés. Tout au-delà est une dette assumée,
  > consignée comme telle.

### ARB-65 — Résorption de l'écart `EXPOSÉ` / `RETENU` : une règle générative, sans énumération à trouver

- **Constats sources** : `T-02`, `AMB-33` (via `ARB-02`) — c'est le seul point de `ARB-02` que la
  révision `R-A01` laissait à instruire.
- **Sévérité retenue** : **MAJEUR**. `R-A01` déclare `EXPOSÉ = RETENU` et qualifie l'écart de
  « défaut à résorber », mais les filtres concernés n'étaient pas nommés — un agent d'application
  ne peut pas construire une liste qu'il devrait établir par jugement.
- **Décision — ne pas énumérer, mais **dériver**.** Justification : `filters-scope.json` porte pour
  chaque filtre retenu un `type` et un `group` ; ces deux champs suffisent à déterminer son contrôle
  et son emplacement, donc l'écart se résorbe par une règle et non par une liste — ce qui la rend
  vérifiable par script et insensible à une évolution du catalogue.
- **Annexe B — `EX-SCR-72bis`, CRÉER** :

  > `EX-SCR-72bis` — **Règle d'exposition par défaut, générative.** Tout filtre
  > `perimetre = RETENU` de `filters-scope.json` qui n'est **pas** nommé dans le `Concerne` d'une
  > exigence `EX-SCR-63` à `EX-SCR-72` reçoit, **sans exception et sans décision
  > supplémentaire**, un contrôle `exposition = SECONDAIRE`, placé dans le groupe visuel
  > correspondant à son champ `group`, du type déterminé par son champ `type` selon cette table :
  >
  > | `type` de `filters-scope.json` | Contrôle attribué | Exigence de forme |
  > |---|---|---|
  > | `enum_single`, domaine ≤ 4 valeurs | boutons radio segmentés | `EX-SCR-63` |
  > | `enum_single`, domaine de 5 à 12 valeurs | liste déroulante avec `Indifférent` | `EX-SCR-64` |
  > | `enum_single`, domaine > 12 valeurs | panneau dédié à recherche interne | `EX-SCR-66` |
  > | `enum_multi`, domaine ≤ 14 valeurs | cases à cocher | `EX-SCR-65` |
  > | `enum_multi`, domaine > 14 valeurs | panneau dédié à recherche interne | `EX-SCR-66` |
  > | `range_min` **et** `range_max` de même préfixe | couple d'intervalle | `EX-SCR-67` |
  > | `range_min` **sans** `range_max` de même préfixe | contrôle à borne unique `au moins <valeur>` | `EX-SCR-67` amendé par `ARB-53` |
  > | `number` | champ numérique unique, paliers suggérés si le domaine en fournit | `EX-SCR-67` |
  > | `boolean` | interrupteur à deux états | `EX-SCR-69` |
  > | `text` | champ texte à compteur de caractères | `EX-SCR-71` |
  > | `geo_text` | contrôle composite `Localisation` | `EX-SCR-70` |
  > | `structured_multi` | bouton ouvrant le sélecteur `G` | `EX-SCR-72` |
  >
  > **Correspondance des groupes** : le champ `group` de `filters-scope.json` désigne le groupe
  > visuel du bandeau ; un `group` sans groupe visuel correspondant crée un groupe replié portant
  > son libellé, plutôt que de laisser le filtre sans emplacement.
  > **Seul écart admis** : `atype`, `RETENU` et volontairement `NON_EXPOSE` (`R-A01`).
  > **Critère de recette** : un test du lot D4 énumère `filters-scope.json`, applique cette table et
  > **échoue** si un filtre `RETENU` autre qu'`atype` n'a aucun contrôle, ou en a deux.
- **Annexe B — `EX-SCR-64` et `EX-SCR-71`, MODIFIER** : retirer de leurs listes `Concerne` les
  filtres **exclus** par `filters-scope.json` — `adage` (télémétrie AutoScout24) dans `EX-SCR-64`,
  `cid` (règle R3) dans `EX-SCR-71`. La mention « `cid` est de classe X (R3) » est supprimée avec la
  classe `X` (`ARB-02`) : `cid` est **exclu du périmètre**, donc il n'a ni contrôle ni classe.

---

# 3. Constats rejetés, avec preuve

## REJET-01 — `ADV-11` (`eq=136` sous sémantique ET) : non fondé comme défaut, conservé comme preuve

- **Constat source** : `ADV-11`, MAJEUR proposé.
- **Rejet**, et sa preuve. Le calcul de l'agent est **juste** — sous sémantique ET, la probabilité
  qu'une annonce porte les 136 équipements est de l'ordre de `10⁻⁴¹`, et le résultat vide est
  garanti. Mais ce n'est **pas un défaut du document d'exigences**, et l'agent le reconnaît
  lui-même (« aucune correction supplémentaire n'est nécessaire au-delà de ce qui est déjà
  planifié »). Trois exigences couvrent déjà chacun des trois aspects :
  - le comportement est **spécifié** : `EX-SCR-26` (`ET-VIDE-FILTRES`) traite le résultat vide sous
    filtres avec son message et son action d'élargissement ;
  - la sémantique est **paramétrable et affichée** : `A-03` en fait « un paramètre du moteur de
    filtrage, pas une constante en dur » et exige que l'interface l'indique, ce que `EX-SCR-66`
    réalise par l'avertissement en tête du panneau `eq` ;
  - l'incertitude est **assumée par écrit** : `REQUIREMENTS.md` § 12, point ouvert `O7`, avec le
    motif de son irrésolution (les trois requêtes qui trancheraient portent sur `/lst?`, interdit
    par le robots.txt).
  Aucun développeur n'est bloqué, aucune lecture concurrente n'affiche deux chiffres, aucun test
  n'est non reproductible : le barème n'est atteint à aucun de ses trois niveaux.
- **Ce qui est conservé** : la mesure quantitative est une preuve de risque utile. Elle est portée
  en liste `POUR_COORDINATEUR` comme complément d'une ligne existante, pas comme correctif d'une
  exigence.

**Aucun autre constat n'est rejeté.** Les 78 autres sont retenus, dont quatre avec une **re-cotation
explicite** (`ARB-12`, `ARB-20`, `ARB-26`, `ARB-60`, `ARB-62`) et deux avec un **rejet partiel
motivé, la sévérité restant acquise** (`ARB-39` sur la sémantique du *leave-one-out*, déjà tranchée
par `EX-SCR-90` ; `ARB-12` sur la prémisse « rien à l'écran ne permet de faire la différence »).
Deux constats voient en outre leur **preuve chiffrée corrigée par cet arbitre** sans que le constat
tombe : `ARB-55` (`ADV-08` décrit une erreur arithmétique là où il y a une confusion entre pire cas
et cas observé) et `ARB-56` (`ADV-10` annonce 2 100 caractères là où la mesure donne ≈ 1 720, le
dépassement restant atteignable).

---

# 4. Listes de travaux

**Convention pour les agents d'application.** Chaque entrée donne l'exigence visée, l'action, et le
**renvoi au texte exact** de la décision correspondante en section 2. Le texte n'est pas recopié
ici : `REQUIREMENTS.md` § 0 pose que deux copies d'une même exigence divergent au premier
correctif, et une liste de travaux qui recopierait les textes créerait exactement ce défaut. Le
texte de la section 2 est **le** texte à insérer, mot pour mot, guillemets français exclus.

**Ordre.** Les listes sont ordonnées par dépendance, puis par numéro d'exigence. Les renommages
précèdent leurs références ; les créations d'exigences transverses précèdent les renvois qui les
citent.

## 4.1 `ANNEXE-A` — `draft-data-dictionary.md`, 39 travaux

| # | Décision | Exigence | Action | Objet |
|---:|---|---|---|---|
| A-01 | `ARB-13` | `EX-DATA-45` | MODIFIER | renommer `SUSPECT_PRICE_FLOOR` → `PRICE_SENTINEL_ABSOLUTE` ; note excluant `PRICE_IMPLAUSIBLE_IN_CELL` du vocabulaire |
| A-02 | `ARB-16` | `EX-DATA-45` | MODIFIER | ajouter `PRICE_OUT_OF_RANGE` |
| A-03 | `ARB-54` | `EX-DATA-45` | MODIFIER | ajouter `DUPLICATE_VALUE_CONFLICT` |
| A-04 | `ARB-60` | `EX-DATA-45` | MODIFIER | ajouter `MARKETPLACE_UNMAPPED` ; cardinal final du vocabulaire : **17** |
| A-05 | `ARB-13` | toute l'annexe A | MODIFIER | propager le renommage ; consigner les occurrences trouvées dans le journal |
| A-06 | `ARB-14` | `EX-DATA-2` | MODIFIER | ordre Normalisation → Validation, bornes inclusives, trois conséquences assumées |
| A-07 | `ARB-16` | champ 7 `priceEur`, colonne Validation | MODIFIER | `0` et `> 5·10⁶` → `INCONNU` ; retrait du verdict REJET |
| A-08 | `ARB-24` | `EX-DATA-7` | MODIFIER | normalisation NFC des libellés de `taxonomy.json` |
| A-09 | `ARB-54` | `EX-DATA-15` | MODIFIER | ordre d'ingestion total `(pageIndex, positionDansPage)` + drapeau de conflit |
| A-10 | `ARB-15` | `EX-DATA-16` | **AUCUNE** | fait foi en l'état ; sert de référence à l'alignement de l'annexe B |
| A-11 | `ARB-13` | `EX-DATA-19` | MODIFIER | deux règles, deux étages, un seul passage, seuil `n_price(C) < 12` |
| A-12 | `ARB-62` | `EX-DATA-28` | MODIFIER | rendu en texte des champs `*Raw`, interdiction du balisage, test d'injection |
| A-13 | `ARB-61` | `EX-DATA-29`, étape 6 | MODIFIER | repli de troncature dure à 80, respect des graphèmes |
| A-14 | `ARB-60` | `EX-DATA-40` | MODIFIER | 9ᵉ marketplace hors périmètre H1, repli `INCONNU` |
| A-15 | `ARB-13`, `ARB-15`, `ARB-16` | `EX-DATA-60` | MODIFIER | ligne `price` réécrite ; note sur les deux réglages d'`EX-SCR-95` |
| A-16 | `ARB-01` | `EX-DATA-61bis` | CRÉER | trois couvertures nommées, interdiction du mot nu |
| A-17 | `ARB-21`, `ARB-20` | `EX-DATA-64` | MODIFIER | primauté de l'arrondi d'`EX-DATA-6` ; libellés `P5`/`P95` |
| A-18 | `ARB-22` | `EX-DATA-67` | MODIFIER | généralisation plancher-plafond aux bornes de kilométrage |
| A-19 | `ARB-01` | `EX-DATA-68` | MODIFIER | champ `announcedCount` (marque) |
| A-20 | `ARB-19`, `ARB-20` | `EX-DATA-69` | MODIFIER | `displayRange` sur l'écran A seul, étiquette obligatoire, `rawRange` ailleurs |
| A-21 | `ARB-25` | `EX-DATA-70` | MODIFIER | renvoi à `EX-DATA-70bis`/`70ter` |
| A-22 | `ARB-25` | `EX-DATA-70bis`, `EX-DATA-70ter` | CRÉER | comparateur unique ; tout ordre publié est total |
| A-23 | `ARB-59` | `EX-DATA-72` | MODIFIER | libellé et slug canoniques de la clé réservée `modelId = 0` |
| A-24 | `ARB-01` | `EX-DATA-72`, ligne « champs ajoutés » | MODIFIER | champ `announcedCount` (modèle) |
| A-25 | `ARB-08` | `EX-DATA-79` | MODIFIER | deux formes d'étiquette, trois formes interdites |
| A-26 | `ARB-04` | `EX-DATA-83bis`, `83ter`, `83quater`, `83quinquies` | CRÉER | `GROUPSTAT`, `NTILE`, paliers de puissance, indice de dépréciation |
| A-27 | `ARB-36` | `EX-DATA-86` | MODIFIER | année inconnue → départ à `C₂` ; `INCONNU` jamais clé d'agrégation |
| A-28 | `ARB-13` | `EX-DATA-87` | MODIFIER | publier `implausibleInCellCount` |
| A-29 | `ARB-03` | `EX-DATA-93bis` | CRÉER | définition de `R²` (passe 2, `F` complet, échelle log) |
| A-30 | `ARB-48` | `EX-DATA-98` | MODIFIER | 13 champs ; `firstRegistrationYearMonth` et `priceEvaluationCategory` ; ≈ 340 Ko |
| A-31 | `ARB-31` | `EX-DATA-100bis` | CRÉER | `SAMPLE(V, k, seed)`, graine constante, déterminisme |
| A-32 | `ARB-04` | `EX-DATA-102bis` | CRÉER | grille prix × km sur les bins de `BIN` ; pas d'hexagones |
| A-33 | `ARB-40` | `EX-DATA-105` | MODIFIER | tables de champs `Make` et `Model` ; fonction `SLUG` |
| A-34 | `ARB-42` | `EX-DATA-108` | MODIFIER | `selectionHash = <localDatasetKey>:<refineHash>` |
| A-35 | `ARB-42` | `EX-DATA-109` | MODIFIER | clé de cache ; le jeu local est mis en cache |
| A-36 | `ARB-39` | `EX-DATA-110`, `EX-DATA-110bis` | MODIFIER puis CRÉER | poste de budget 90 ms, total 540 ms ; `FacetCount` et sélections dérivées |
| A-37 | `ARB-55` | `EX-DATA-112` | MODIFIER | tampon de prix (4 Mo observé / 20 Mo pire cas), zone de texte 172 Mo, total ≈ 274 Mo, facteur 1,9 |
| A-38 | `ARB-40` | `EX-DATA-114`, `EX-DATA-115` | MODIFIER | index de taxonomie incluant `bodyTypes` |
| A-39 | `ARB-37` | `EX-DATA-123bis` | CRÉER | colonnes d'export par périmètre, métadonnées, nom de fichier |

## 4.2 `ANNEXE-B` — `draft-screens.md`, 68 travaux

| # | Décision | Exigence | Action | Objet |
|---:|---|---|---|---|
| B-01 | `ARB-29` | `EX-SCR-27bis` | CRÉER | état `SANS-FILTRE`, définition unique — **à faire en premier**, plusieurs entrées y renvoient |
| B-02 | `ARB-65` | `EX-SCR-72bis` | CRÉER | règle d'exposition générative (`type` → contrôle, `group` → emplacement) |
| B-03 | `ARB-47` | `EX-SCR-158bis` | CRÉER | étiquetage obligatoire de la base de comparaison |
| B-04 | `ARB-11` | `EX-SCR-38bis` | CRÉER | état `ET-URL-CORRIGEE` |
| B-05 | `ARB-28` | `EX-SCR-124bis` | CRÉER | table unique des seuils de l'écran A |
| B-06 | `ARB-59` | `EX-SCR-113bis` | CRÉER | écran B en mode « Modèle non identifié » |
| B-07 | `ARB-44` | `EX-SCR-214bis` | CRÉER | écran F `Modèles suivis` |
| B-08 | `ARB-21` | `EX-SCR-3` | MODIFIER | arrondi selon `EX-DATA-6`, `Math.floor` interdit |
| B-09 | `ARB-19`, `ARB-23` | `EX-SCR-4` | MODIFIER | ce format ne choisit pas ses bornes ; `min === max` après arrondi |
| B-10 | `ARB-22`, `ARB-23` | `EX-SCR-5` | MODIFIER | bornes de fourchette plancher-plafond ; `min === max` après arrondi |
| B-11 | `ARB-23` | `EX-SCR-6` | MODIFIER | `min === max` après arrondi |
| B-12 | `ARB-26` | `EX-SCR-11` | MODIFIER | départage du plus grand reste ; substitutions typographiques en dernier |
| B-13 | `ARB-20` | `EX-SCR-12` | MODIFIER | `P5`/`P95` dans la liste, `P10`/`P90` retirés |
| B-14 | `ARB-24` | `EX-SCR-13` | MODIFIER | budgets en groupes de graphèmes |
| B-15 | `ARB-07` | `EX-SCR-16` | MODIFIER | rapport sur les bins fermés seuls |
| B-16 | `ARB-05`, `ARB-08` | `EX-SCR-18` | MODIFIER | bornes d'axe déléguées à `BIN` ; étiquettes de débordement |
| B-17 | `ARB-44` | `EX-SCR-23`, `EX-SCR-29` | MODIFIER | le bouton `Exporter` désactivé est celui de la barre de synthèse de l'écran A |
| B-18 | `ARB-57` | `EX-SCR-25` | MODIFIER | l'interdiction d'indicateur ne vaut que hors mode groupé |
| B-19 | `ARB-29` | `EX-SCR-27` | MODIFIER | `ET-VIDE-SANS-FILTRE` référencé par nom d'état |
| B-20 | `ARB-01` | `EX-SCR-31` | MODIFIER | bandeau `C3` : trois cas, aucun 100 % fabriqué |
| B-21 | `ARB-28`, `ARB-31` | `EX-SCR-32` | MODIFIER | retrait du seuil de 40 marques et du plafond de 20 ; renvoi à `SAMPLE` |
| B-22 | `ARB-17`, `ARB-20` | `EX-SCR-33` | MODIFIER | `n = n_m` ; quatre paliers ; `P5`/`P95` |
| B-23 | `ARB-15` | `EX-SCR-36` | MODIFIER | seuil unique 250 € ; exclusion des statistiques, comptage dans l'effectif |
| B-24 | `ARB-42` | `EX-SCR-37` | MODIFIER | hors ligne, le jeu local est la dernière `localDatasetKey` servie |
| B-25 | `ARB-32` | `EX-SCR-38` | MODIFIER | exception de `C3` non refermable, 144 px, repliabilité par bandeau, ordre incluant `ET-URL-CORRIGEE` |
| B-26 | `ARB-44` | `EX-SCR-42` | MODIFIER | quatre onglets |
| B-27 | `ARB-52` | `EX-SCR-45` | MODIFIER | table des segments de fil d'Ariane par route |
| B-28 | `ARB-39` | `EX-SCR-46` | MODIFIER | compteur sur `selectionHashWithoutTaxonomy` |
| B-29 | `ARB-44` | `EX-SCR-47` | MODIFIER | page statique `/mentions` |
| B-30 | `ARB-41` | `EX-SCR-50` | MODIFIER | brossage encodé par bornes d'axe, jamais par empreinte |
| B-31 | `ARB-64`, `ARB-54` | `EX-SCR-53` | MODIFIER | source unique du taux de vide ; affichage des conflits de doublon |
| B-32 | `ARB-02` | `EX-SCR-55` | MODIFIER | maquette : `[+ 92]` remplacé par `[3 filtres actifs]` |
| B-33 | `ARB-40` | `EX-SCR-59`, `EX-SCR-221` | MODIFIER | classe `R` de `Carrosserie` justifiée par `Model.bodyTypes` |
| B-34 | `ARB-65` | `EX-SCR-64`, `EX-SCR-71` | MODIFIER | retirer `adage` et `cid` des listes `Concerne` |
| B-35 | `ARB-53`, `ARB-65` | `EX-SCR-67` | MODIFIER | énumération nominative des couples ; contrôle à borne unique |
| B-36 | `ARB-10`, `ARB-11` | `EX-SCR-68` | MODIFIER | portée limitée à la saisie ; écrêtage signalé par `ET-URL-CORRIGEE` à l'arrivée par URL |
| B-37 | `ARB-33`, `ARB-35` | `EX-SCR-73` | MODIFIER | prédicat sur le champ canonique ; les codes `2`/`3` n'activent qu'un contrôle enfant |
| B-38 | `ARB-30` | `EX-SCR-77` | MODIFIER | `Tout effacer` retire tout prédicat utilisateur |
| B-39 | `ARB-02` | `EX-SCR-82` | MODIFIER | deux colonnes `perimetre` et `exposition` ; suppression de la classe `X` |
| B-40 | `ARB-02`, `ARB-53`, `ARB-65` | `EX-SCR-83` | MODIFIER | bilan 77/76/1/24 ; test de complétude sur deux colonnes et sur l'unicité du contrôle |
| B-41 | `ARB-35` | `EX-SCR-84` | MODIFIER | égalité stricte de `fuelCategory` ; dix cases indépendantes |
| B-42 | `ARB-02` | `EX-SCR-91` | MODIFIER | le badge compte les filtres actifs |
| B-43 | `ARB-15` | `EX-SCR-95` | MODIFIER | deux réglages requalifiés, jamais des filtres |
| B-44 | `ARB-19` | `EX-SCR-109` | MODIFIER | bornes neutres, `displayRange` + suffixe, `rawRange` en secondaire |
| B-45 | `ARB-43` | `EX-SCR-111` | **SUPPRIMER** | l'ajout d'une marque à la sélection de comparaison |
| B-46 | `ARB-19`, `ARB-59` | `EX-SCR-113` | MODIFIER | élément 4 réécrit ; zone-modèle `modelId = 0` cliquable |
| B-47 | `ARB-01` | `EX-SCR-115`, `EX-SCR-116` | MODIFIER | indicateur piloté par `sampleCoverage` ; cas `listingCount = 0 ∧ announcedCount > 0` |
| B-48 | `ARB-43` | `EX-SCR-118`, `EX-SCR-194`, `EX-SCR-197` | MODIFIER | plafond unique de 4, sans surnuméraires ignorés |
| B-49 | `ARB-25` | `EX-SCR-119`, `EX-SCR-120`, `EX-SCR-121` | MODIFIER | comparateur unique ; quatre ordres totaux ; `null` en fin |
| B-50 | `ARB-29` | `EX-SCR-126` | MODIFIER | renvoi à l'état `SANS-FILTRE` |
| B-51 | `ARB-28` | `EX-SCR-127` | MODIFIER | la virtualisation ne plafonne pas les cartes accessibles |
| B-52 | `ARB-19`, `ARB-44` | `EX-SCR-142` | MODIFIER | cinquième donnée `min – max` ; quatrième bouton `Suivre` |
| B-53 | `ARB-05` | `EX-SCR-145`, `EX-SCR-146`, `EX-SCR-147` | MODIFIER | délégation intégrale à `BIN` |
| B-54 | `ARB-09`, `ARB-04` | `EX-SCR-149` | MODIFIER | clic posant `hi − u` ; prix médian du bucket par `GROUPSTAT` |
| B-55 | `ARB-17` | `EX-SCR-150` | MODIFIER | qualifier `n` par sa métrique |
| B-56 | `ARB-47` | `EX-SCR-158` | MODIFIER | infobulle de `G4` portée à 6 lignes |
| B-57 | `ARB-04` | `EX-SCR-161` à `EX-SCR-170` | MODIFIER | un renvoi par graphe (`G5`, `G6`, `G7`, `G9`, `G10`, `G12`, `G13`, `G14`, `G15`) |
| B-58 | `ARB-03`, `ARB-18`, `ARB-27` | `EX-SCR-164` | MODIFIER | renvoi à M2, libellé normatif, mention de méthode, ordre par `opportunityScore` |
| B-59 | `ARB-12` | `EX-SCR-176` | MODIFIER | le jeton d'un filtre actif affiche toujours sa valeur |
| B-60 | `ARB-37` | `EX-SCR-187` | MODIFIER | l'exigence ne décrit plus que l'emplacement et l'état du bouton |
| B-61 | `ARB-34` | `EX-SCR-184`, `EX-SCR-202` | MODIFIER | `sel` restriction d'affichage ; bouton de conversion en filtre |
| B-62 | `ARB-06` | `EX-SCR-195`, `EX-SCR-200` | MODIFIER | bornes communes sur l'union des échantillons ; seuil `n_m < 12` |
| B-63 | `ARB-51` | `EX-SCR-200`, `EX-SCR-214` | MODIFIER | six états par identifiant, avec « sans objet, motif : … » |
| B-64 | `ARB-03`, `ARB-18`, `ARB-25`, `ARB-47`, `ARB-54` | `EX-SCR-203` | MODIFIER | renvoi à M2, mention de méthode, ordre total, étiquetage de cellule, jeton de conflit |
| B-65 | `ARB-27` | `EX-SCR-206`, `EX-SCR-207` | MODIFIER | ordre par `opportunityScore` ; `P10 des écarts` défini et localisé |
| B-66 | `ARB-44` | `EX-SCR-212` | MODIFIER | panneau latéral `Recherches récentes` |
| B-67 | `ARB-45` | `EX-SCR-213` | MODIFIER | écart affiché sous condition, jamais `+ 0` |
| B-68 | `ARB-46`, `ARB-43`, `ARB-25` | `EX-SCR-216` | MODIFIER | six états, recherche vide, `Appliquer`, focus, plafond de 4, départage unique |

## 4.3 `ANNEXE-C` — `draft-behaviour.md`, 24 travaux

| # | Décision | Exigence | Action | Objet |
|---:|---|---|---|---|
| C-01 | `ARB-41` | § A.1, `EX-NAV-1` à `EX-NAV-4` | MODIFIER | six routes, `EX-NAV-2bis` et `EX-NAV-2ter` créées, anciennes routes en redirection |
| C-02 | `ARB-02` | § A.2.2, table des 101 filtres | **SUPPRIMER** | remplacée par un renvoi à `filters-scope.json` |
| C-03 | `ARB-09` | `EX-NAV-7` | MODIFIER | bornes inclusives, champ et unité canoniques, année entière, `INCONNU` jamais retenu |
| C-04 | `ARB-41` | `EX-NAV-10bis` | CRÉER | table des paramètres d'état d'interface |
| C-05 | `ARB-41` | `EX-NAV-12` | MODIFIER | quels paramètres produisent une entrée d'historique |
| C-06 | `ARB-56`, `ARB-12` | `EX-NAV-18` | MODIFIER | pureté bornée par le plafond ; limite connue du partage par URL |
| C-07 | `ARB-59` | `EX-NAV-20` | MODIFIER | exception unique pour `modelId = 0` |
| C-08 | `ARB-11` | `EX-NAV-21` | MODIFIER | table des cinq classes de correction ; suppression de « silencieusement » |
| C-09 | `ARB-10` | `EX-NAV-22` | MODIFIER | permutation au chargement d'URL seulement |
| C-10 | `ARB-49` | `EX-NAV-23`, `EX-NAV-24`, `EX-NAV-25` | CRÉER | section « cycle de vie du snapshot » |
| C-11 | `ARB-57` | `EX-SRCH-1bis` | CRÉER | regroupement des rafales de filtres `R` |
| C-12 | `ARB-42` | `EX-SRCH-9bis` à `EX-SRCH-9quinquies` | CRÉER | section « composantes de l'état de filtres » |
| C-13 | `ARB-35` | `EX-SRCH-11` | MODIFIER | justification du OU intra-filtre corrigée |
| C-14 | `ARB-33` | `EX-SRCH-11bis` | CRÉER | unité d'évaluation d'un prédicat |
| C-15 | `ARB-33` | `EX-SRCH-16` | MODIFIER | suppression du facteur `1,359` |
| C-16 | `ARB-30` | `EX-SRCH-18bis` | CRÉER | valeurs injectées vers la source, `ustate=A,N,U` |
| C-17 | `ARB-45`, `ARB-50` | `EX-CRUD-1` | MODIFIER | `effectifInitial`, `snapshotInitial`, `schemaVersion` |
| C-18 | `ARB-43` | `EX-CRUD-13bis` | CRÉER | `CompareSelection`, entité de session |
| C-19 | `ARB-37` | `EX-CRUD-16` et § C.4 | MODIFIER | deux entrées de menu, suppression de l'« onglet actif » |
| C-20 | `ARB-50` | `EX-CRUD-18` | CRÉER | version de schéma et migration |
| C-21 | `ARB-58` | `EX-CRUD-19` | CRÉER | concurrence entre onglets |
| C-22 | `ARB-38` | `EX-NFR-4bis` (CRÉER), `EX-NFR-8` (MODIFIER) | CRÉER puis MODIFIER | percentile de rang, 100 exécutions ; reformulation du débit d'images |
| C-23 | `ARB-55` | § D.1 et § D.3 | MODIFIER | aligner toute valeur de mémoire sur ≈ 274 Mo et le facteur 1,9 ; consigner si aucune valeur n'existe |
| C-24 | `ARB-63` | `EX-NFR-28` | CRÉER | impression hors périmètre v1, feuille `@media print` minimale et close |

## 4.4 `POUR_COORDINATEUR` — 9 points

Aucun de ces points n'est un constat non résolu : ce sont des éditions de documents qui
appartiennent au coordinateur (`REQUIREMENTS.md`, `ARBITRAGES-req-lead.md`) ou une ratification de
chiffre.

| # | Décision | Cible | Recommandation |
|---:|---|---|---|
| P-01 | `ARB-01` | `REQUIREMENTS.md` § 2, ligne « Couverture d'échantillon » | remplacer par les trois termes d'`EX-DATA-61bis` et **supprimer** « pour une sélection donnée », qui crée à elle seule la seconde lecture d'`AMB-15` |
| P-02 | `ARB-19`, `ARB-20` | `REQUIREMENTS.md` § 2, ligne « Fourchette » | ajouter l'obligation d'étiquetage de `R-A05` : `[p05, p95]` n'apparaît que sur l'écran A et jamais sans être nommé `(90 % des offres)` ; les libellés de percentile sont `P5` et `P95` |
| P-03 | `ARB-02`, `ARB-65` | `REQUIREMENTS.md` § 6 | remplacer « Bilan clos : 13 + 52 + 3 + 2 + 31 = 101 » par le bilan d'`EX-SCR-83` (77 retenus dont 76 exposés et 1 écart déclaré, 24 exclus) ; supprimer la classe `X` |
| P-04 | `ARB-03` | `REQUIREMENTS.md` § 11.1 | si la matrice nomme la méthode de `G8`, la remplacer par « méthode M2, `EX-DATA-90` à `EX-DATA-93bis` » ; ajouter la ligne de contrôle de `R²` |
| P-05 | `ARB-44`, `ARB-41` | `REQUIREMENTS.md` § 5 | ajouter une ligne d'inventaire pour l'écran **F — Modèles suivis**, route `/suivis`, origine « ajout, requis par `EX-CRUD-9` » ; inscrire la route `…/annonces` sous `EX-NAV-2bis` et `/mentions` en note de page statique |
| P-06 | `ARB-17`, `ARB-51` | `REQUIREMENTS.md` § 8 et § 11.1 | la règle « six états par écran » devient vraie après `ARB-51` ; y ajouter la mention que les états sans objet sont **déclarés** avec leur motif, et refléter les quatre paliers d'effectif d'`ARB-17` |
| P-07 | `ARB-39` | `REQUIREMENTS.md` § 9 et annexe C § D.2 (`EX-NFR-5`) | **ratification d'un chiffre** : le budget de calcul passe de 450 à 540 ms avec le poste de facettes. Recommandation retenue par cet arbitre et à ratifier : distinguer dans § D.2 le budget du recalcul d'**agrégats** (cible inchangée, ≤ 200 ms p95) de celui des **facettes**, différé d'au plus 100 ms après l'affichage des chiffres principaux, les compteurs de facette affichant `…` pendant l'écart. `EX-NFR-5` reste donc tenable sans être affaibli |
| P-08 | `REJET-01` | `REQUIREMENTS.md` § 12, point ouvert `O7` | ajouter la preuve chiffrée d'`ADV-11` : « sous sémantique ET, une sélection de `eq` proche de son maximum donne un résultat vide de façon déterministe (`0,5^136 ≈ 10⁻⁴¹`) — argument quantitatif en faveur d'un basculement en OU si la preuve arrive » |
| P-09 | — | `REQUIREMENTS.md` § 13 | après application des trois listes, inscrire la version **1.0** et son contenu : 79 constats de stress-test, 65 décisions, 1 rejet, 3 arbitrages révisés (`R-A06`, `R-A01`, `R-A05`) |

---

# 5. Bilan

## 5.1 Chiffres

| Grandeur | Valeur |
|---|---:|
| Constats en entrée (`T-*` 24 + `AMB-*` 37 + `ADV-*` 18) | **79** |
| Constats absorbés par déduplication | **14** |
| Décisions après déduplication (`ARB-01` … `ARB-65`) | **65** |
| dont `RÉSOLU_PAR_COORDINATEUR` (fond tranché par `R-A06`, `R-A01`, `R-A05`) | 4 constats, 3 décisions (`ARB-02`, `ARB-13`, `ARB-19`) |
| Rejets | **1** (`ADV-11`) |
| Re-cotations explicites | **5** (`ARB-12` ↓, `ARB-20` ↓, `ARB-26` ↑, `ARB-60` ↓, `ARB-62` ↑) |
| Preuves chiffrées corrigées par cet arbitre, constat maintenu | **2** (`ADV-08` via `ARB-55`, `ADV-10` via `ARB-56`) |
| Rejets partiels motivés, sévérité maintenue | **2** (`ARB-39`, `ARB-12`) |
| Sévérités retenues | **29 BLOQUANT · 26 MAJEUR · 10 MINEUR** |
| Travaux `ANNEXE-A` | **39** |
| Travaux `ANNEXE-B` | **68** |
| Travaux `ANNEXE-C` | **24** |
| Points `POUR_COORDINATEUR` | **9** |
| Total des travaux d'application | **131 + 9** |

**Vérification de complétude (S1 et exhaustivité de la fusion)** : les 79 identifiants sources
— 24 `T-*`, 37 `AMB-*`, 18 `ADV-*` — apparaissent **tous** dans la colonne « constats sources » du
tableau de synthèse, et **aucun** n'a été perdu. Trois d'entre eux apparaissent dans **deux**
décisions, parce qu'ils portent deux défauts séparables : `T-03` (les agrégats par groupe →
`ARB-04`, la définition de `R²` → `ARB-03`) ainsi que `T-02` et `AMB-33` (le sens de « retenu »,
tranché par `R-A01` → `ARB-02` ; la résorption de l'écart d'exposition → `ARB-65`). L'index inversé
du § 5.6 permet de vérifier la couverture mécaniquement, identifiant par identifiant.

**Vérification S2 (deux lectures par ambiguïté)** : les 37 constats `AMB-*` portent chacun leurs
deux lectures et leur exemple chiffré dans `ST-ambiguity.md` ; les décisions qui les traitent
**recopient les deux lectures** avant de trancher. Trois d'entre eux portent une **troisième**
lecture, elle aussi conservée : `AMB-17` (écarts-types, euros, pourcentage), `AMB-33` (55, 64,
92 — traité par `R-A01`), `AMB-32` (trois lectures du percentile sur une borne inférieure). Aucune
décision ne tranche sans avoir énoncé ce qu'elle écarte.

## 5.2 Critère S3 — bloquants et majeurs laissés non résolus

**Aucun.** Les 29 BLOQUANT et les 26 MAJEUR retenus reçoivent tous une décision applicable sans
jugement, avec le texte de remplacement rédigé. Le seul point qui aurait pu rester ouvert — la
ventilation nominative des filtres retenus sans contrôle, que `R-A01` qualifiait de « défaut à
résorber » — est réglé par `ARB-65` au moyen d'une **règle générative** dérivée des champs `type` et
`group` de `filters-scope.json`, ce qui évite d'exiger d'un agent d'application une énumération
qu'il aurait dû établir par jugement.

**Deux réserves, nommées, qui ne sont pas des constats non résolus.**
1. `P-07` (issu de `ARB-39`) est une **ratification de chiffre** : le budget de calcul passe de
   450 à 540 ms. La décision est complète — le poste est chiffré, la dégradation est nommée, la
   cible `EX-NFR-5` est préservée par le différé des facettes — et seul l'accord du coordinateur sur
   le chiffre publié reste à donner. Si le coordinateur refuse le différé, la seule autre issue est
   de relever la cible de `EX-NFR-5`, et c'est une décision de produit.
2. `ARB-02` dépend d'un artefact généré (`filters-scope.json`) et non d'une prose : si le script
   `scripts/build-filter-scope.mjs` change la partition, les travaux `B-39` et `B-40` doivent être
   rejoués. C'est une dépendance, pas une lacune.

## 5.3 Critère S5 — dettes explicites

Les **10 constats MINEUR reçoivent tous une décision** : aucun n'est abandonné en silence. Ce qui
subsiste au-delà de ces décisions est consigné ici comme dette, avec son échéance de reprise.

| # | Dette | Origine | Pourquoi elle n'est pas soldée maintenant |
|---|---|---|---|
| D-1 | Le neuvième code de `KYCAR_MARKETPLACE` n'est pas identifié | `ARB-60` (`ADV-15`) | Les relevés disponibles ne le donnent pas et aucune requête réseau n'est autorisée. Le repli est écrit (`INCONNU` + `MARKETPLACE_UNMAPPED`, aucun rejet) ; l'identification relève du référentiel, à faire avant tout usage hors Belgique |
| D-2 | Classe de risque « lien tronqué par un transport externe » | `ARB-12` (`ADV-01`) | Aucune exigence ne peut restituer une intention perdue hors de l'application, et toute somme de contrôle allongerait l'URL — cause première du problème. La limite est **déclarée** dans `EX-NAV-18` et la contre-mesure d'affichage est exigée. À reprendre si le partage par lien montre des cas réels |
| D-3 | Impression au-delà de la feuille minimale | `ARB-63` (`T-23`) | Hors périmètre v1 par décision écrite ; la feuille `@media print` minimale empêche la dégradation active. À reconsidérer après livraison, comme `EX-CRUD-17` |
| D-4 | Optimisation de la zone de chaînes (poste mémoire dominant, ≈ 172 Mo sur 274 Mo) | `ARB-55` (`ADV-09`) | L'enveloppe corrigée tient sous le budget d'onglet avec un facteur 1,9 : la correction du chiffre suffit à rendre l'exigence vérifiable. La piste (`listingUrl` reconstructible depuis `listingId`) est inscrite dans la justification, à instruire si un profil réel dépasse |
| D-5 | Sémantique `eq` (OU/ET) | `REJET-01` (`ADV-11`), point ouvert `O7` | Les trois requêtes qui trancheraient portent sur `/lst?`, interdit par le robots.txt. `A-03` rend la sémantique paramétrable et affichée : la dette est déjà instrumentée, seule la preuve manque |
| D-6 | Discontinuité de méthode M1 → M2 au seuil de 30 | `ARB-18` (`ADV-07`) | La discontinuité est **assumée** et cohérente en interne ; `ARB-18` la rend lisible (méthode nommée, bandeau au franchissement) mais ne la lisse pas. Un score continu entre les deux méthodes serait une invention statistique, hors périmètre d'un arbitrage d'exigences |
| D-7 | Les onze pistes écartées par `st-ambiguity` faute d'exemple chiffré | `ST-ambiguity.md`, note de méthode | Elles n'ont pas franchi le critère d'admission de leur propre rapport, donc elles ne sont pas des constats. Elles restent instruisables en seconde passe : portée du repli `C₂`/`C₃` sur les scores publiés, provenance WLTP/NEDC dans un agrégat unique, ancrage de la grille de `G14` (**partiellement soldé** par `EX-DATA-83quater`, origine `0` désormais écrite), comptage du sélecteur `G` sous filtre (**soldé** par `ARB-46`), unicité globale de `modelId` dans la route de l'écran C |
| D-8 | Fragilités relevées sans fiche par `st-adversarial` | matrice d'attaques d'`ST-adversarial.md` | Deux d'entre elles sont **soldées** par des décisions prises ici : le prix extrême à `9 999 999 €` (par `ARB-16`, qui supprime le REJET) et la marque à 0 modèle résolu (par `ARB-59`, qui rend la zone `modelId = 0` atteignable). Restent : l'année future `2027` sans drapeau de suspicion — non traitée, faute d'un constat fiché, et consignée ici pour ne pas disparaître |

## 5.4 Critère S4 — journal des modifications décidées

Cet arbitre **n'a modifié aucun document d'exigences ni aucun arbitrage**, conformément à sa
consigne. Le journal ci-dessous est donc le journal des modifications **décidées**, que les agents
d'application exécuteront et dont ils tiendront le journal d'exécution.

| Document | Exigences créées | Entrées de travaux portant une modification | Suppressions |
|---|---:|---:|---|
| `draft-data-dictionary.md` (A) | **12** — `EX-DATA-61bis`, `70bis`, `70ter`, `83bis`, `83ter`, `83quater`, `83quinquies`, `93bis`, `100bis`, `102bis`, `110bis`, `123bis` | 31 | aucune |
| `draft-screens.md` (B) | **7** — `EX-SCR-27bis`, `38bis`, `72bis`, `113bis`, `124bis`, `158bis`, `214bis` | 61 | `EX-SCR-111` |
| `draft-behaviour.md` (C) | **18** — `EX-NAV-2bis`, `2ter`, `10bis`, `23`, `24`, `25` · `EX-SRCH-1bis`, `9bis`, `9ter`, `9quater`, `9quinquies`, `11bis`, `18bis` · `EX-CRUD-13bis`, `18`, `19` · `EX-NFR-4bis`, `28` | 12 | table § A.2.2 |
| `REQUIREMENTS.md` (`POUR_COORDINATEUR`) | 0 | 7 sections — § 2, 5, 6, 8, 9, 11.1, 13 | aucune |

**Journal des zones du corpus balayées par cet arbitre pour statuer** : `ARBITRAGES-req-lead.md`
intégralement, y compris la section « Révisions » · `REQUIREMENTS.md` § 0, 1, 2, 5, 6, 7, 8, 12,
13 · annexe A § A.3 (champ `priceEur`), A.4, B.1 à B.7, C.0 à C.4 · annexe B § 1.1 à 1.2, 2
(catalogue d'états), 4 (bandeau de filtres), 5 (écran A), 6 (écran B), 7 (écrans C à G) · annexe C
§ A, B, C, D · `data/reference/filters-scope.json` **exécuté et vérifié** (101 / 77 / 24, types et
groupes relus pour fonder `ARB-65`, longueur d'URL mesurée pour `ARB-56`).

**Calculs refaits de bout en bout par cet arbitre** : dimensionnement du tampon de prix et de la
zone de texte (`ARB-55`) · longueur de la requête pour 77 filtres (`ARB-56`) · vérification de la
partition des filtres et de la présence de `damaged_listing` / `adage` (`ARB-02`) · cohérence des
seuils 12 et 30 entre `EX-DATA-86`, `EX-DATA-90` et `EX-SCR-33` (`ARB-17`).

## 5.5 Ce que cet arbitre n'a pas fait, et pourquoi

- **Aucune édition d'annexe ni d'arbitrage** : consigne explicite du coordinateur, motivée par la
  chute de trois agents de cette phase en cours de rédaction.
- **Aucune requête réseau** : contrainte de la phase.
- **Aucun re-arbitrage de `R-A06`, `R-A01`, `R-A05`** : les quatre constats concernés
  (`AMB-25`, `AMB-33`, `ADV-02`/`ADV-03`/`AMB-20`) sont marqués `RÉSOLU_PAR_COORDINATEUR` et n'ont
  reçu que la liste de leurs conséquences d'annexe.
- **Aucune interface `DataProvider`** : livrable de la phase 2.3. `ARB-42` en fixe les
  **obligations observables** (un appel par `localDatasetKey`, remplacement et non fusion, mise en
  cache) sans en spécifier la signature.

## 5.6 Index inversé — chaque constat d'entrée vers sa décision

Vérification mécanique de l'exhaustivité de la fusion : les 79 identifiants ci-dessous couvrent
`T-01…T-24`, `AMB-01…AMB-37` et `ADV-01…ADV-18`, chacun une fois.

**`ST-complete.md` — 24 constats.**
`T-01` → `ARB-01` · `T-02` → `ARB-02` (+ `ARB-65`) · `T-03` → `ARB-04` (+ `ARB-03` pour `R²`) ·
`T-04` → `ARB-39` · `T-05` → `ARB-40` · `T-06` → `ARB-41` · `T-07` → `ARB-13` ·
`T-08` → `ARB-42` · `T-09` → `ARB-43` · `T-10` → `ARB-44` · `T-11` → `ARB-45` ·
`T-12` → `ARB-46` · `T-13` → `ARB-47` · `T-14` → `ARB-19` · `T-15` → `ARB-48` ·
`T-16` → `ARB-37` · `T-17` → `ARB-49` · `T-18` → `ARB-50` · `T-19` → `ARB-51` ·
`T-20` → `ARB-52` · `T-21` → `ARB-53` · `T-22` → `ARB-11` · `T-23` → `ARB-63` ·
`T-24` → `ARB-64`.

**`ST-ambiguity.md` — 37 constats.**
`AMB-01` → `ARB-21` · `AMB-02` → `ARB-25` · `AMB-03` → `ARB-17` · `AMB-04` → `ARB-28` ·
`AMB-05` → `ARB-29` · `AMB-06` → `ARB-31` · `AMB-07` → `ARB-22` · `AMB-08` → `ARB-32` ·
`AMB-09` → `ARB-05` · `AMB-10` → `ARB-09` · `AMB-11` → `ARB-10` · `AMB-12` → `ARB-11` ·
`AMB-13` → `ARB-30` · `AMB-14` → `ARB-15` · `AMB-15` → `ARB-01` · `AMB-16` → `ARB-03` ·
`AMB-17` → `ARB-27` · `AMB-18` → `ARB-04` · `AMB-19` → `ARB-33` ·
`AMB-20` → `ARB-19` (`RÉSOLU_PAR_COORDINATEUR`) · `AMB-21` → `ARB-20` · `AMB-22` → `ARB-25` ·
`AMB-23` → `ARB-26` · `AMB-24` → `ARB-07` · `AMB-25` → `ARB-13` (`RÉSOLU_PAR_COORDINATEUR`) ·
`AMB-26` → `ARB-34` · `AMB-27` → `ARB-35` · `AMB-28` → `ARB-01` · `AMB-29` → `ARB-14` ·
`AMB-30` → `ARB-36` · `AMB-31` → `ARB-37` · `AMB-32` → `ARB-38` ·
`AMB-33` → `ARB-02` (`RÉSOLU_PAR_COORDINATEUR`) · `AMB-34` → `ARB-08` · `AMB-35` → `ARB-23` ·
`AMB-36` → `ARB-24` · `AMB-37` → `ARB-06`.

**`ST-adversarial.md` — 18 constats.**
`ADV-01` → `ARB-12` · `ADV-02` → `ARB-19` (`RÉSOLU_PAR_COORDINATEUR`) ·
`ADV-03` → `ARB-19` (`RÉSOLU_PAR_COORDINATEUR`) · `ADV-04` → `ARB-15` · `ADV-05` → `ARB-54` ·
`ADV-06` → `ARB-17` · `ADV-07` → `ARB-18` · `ADV-08` → `ARB-55` · `ADV-09` → `ARB-55` ·
`ADV-10` → `ARB-56` · `ADV-11` → **`REJET-01`** · `ADV-12` → `ARB-57` · `ADV-13` → `ARB-58` ·
`ADV-14` → `ARB-59` · `ADV-15` → `ARB-60` · `ADV-16` → `ARB-16` · `ADV-17` → `ARB-61` ·
`ADV-18` → `ARB-62`.

**Groupes de déduplication, et ce qu'ils économisent** — 11 groupes, 14 constats absorbés :

| Décision | Constats fusionnés | Ce que la fusion évite |
|---|---|---|
| `ARB-01` | `T-01` + `AMB-15` + `AMB-28` | créer le champ sans écrire sa portée sous filtre, ni lever la polysémie du mot « couverture » |
| `ARB-02` | `T-02` + `AMB-33` | corriger le décompte sans définir le sens de « retenu » |
| `ARB-04` | `T-03` + `AMB-18` | définir les agrégats par groupe en laissant « quintile » ambigu |
| `ARB-11` | `AMB-12` + `T-22` | une table de corrections dont la colonne « signalement » renverrait à un bandeau inexistant |
| `ARB-13` | `T-07` + `AMB-25` | transcrire une règle circulaire mot pour mot |
| `ARB-15` | `ADV-04` + `AMB-14` | aligner l'inclusion dans l'agrégat sans requalifier les commutateurs qui prétendent l'écarter |
| `ARB-17` | `AMB-03` + `ADV-06` | corriger le dénominateur sans corriger les paliers, ou l'inverse |
| `ARB-19` | `T-14` + `ADV-02` + `ADV-03` + `AMB-20` | quatre corrections d'emplacement sans table de portée commune |
| `ARB-25` | `AMB-02` + `AMB-22` | fixer le comparateur sans rendre les quatre ordres totaux |
| `ARB-37` | `T-16` + `AMB-31` | définir les colonnes d'un fichier dont le périmètre de lignes reste doublement défini |
| `ARB-55` | `ADV-08` + `ADV-09` | corriger un poste et publier un total toujours faux |
