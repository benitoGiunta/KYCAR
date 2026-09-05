# ST-adversarial — Chasse à la rupture (phase 2.2)

> Agent `st-adversarial`. Angle unique : attaques par la donnée et par l'échelle contre
> `REQUIREMENTS.md` et ses annexes A/B/C et les arbitrages de `req-lead`. Aucune requête réseau,
> aucune édition des documents d'exigences. Chaque constat est une simulation pas à pas, pas un avis.

---

## Table de synthèse

| # | Titre | Sévérité | Catégorie |
|---|---|---|---|
| ADV-01 | Lien partagé tronqué par une messagerie : dérive silencieuse d'un filtre numérique valide | **BLOQUANT** | Sollicitation / vérité affichée |
| ADV-02 | `EX-SCR-109` étiquette littéralement « prix min – prix max » sur la carte-marque, contredisant `[p05,p95]` d'A-05/EX-DATA-69 | **MAJEUR** | Vérité affichée (valeur) |
| ADV-03 | A-05 exige `[min,max]` « toujours » sur l'écran B ; l'en-tête `EX-SCR-142` ne l'affiche nulle part | **MAJEUR** | Vérité affichée (valeur) |
| ADV-04 | Prix à 1 € : `EX-SCR-36` (« reste dans l'agrégat ») contredit `EX-DATA-16(c)`/`60` (exclusion de toutes les statistiques de prix) | **BLOQUANT** | Valeur / contradiction inter-annexes |
| ADV-05 | Doublon exact avec deux prix différents : le prix affiché est arbitraire (ordre d'ingestion) et non signalé comme conflictuel | **BLOQUANT** | Structure / vérité affichée |
| ADV-06 | Seuil `n=10/11` : `EX-SCR-33` promet « tout est calculé » alors que M1 (`n≥12`) et M2 (`n≥30`) l'interdisent | **BLOQUANT** | Effectif / contradiction inter-annexes |
| ADV-07 | Seuil `n=29→30` : le score d'opportunité change de méthode (M1→M2) pour toute la cellule au passage d'une seule annonce | **MAJEUR** | Effectif / discontinuité |
| ADV-08 | Tampon de comptage prix : `Int32Array(5·10⁶)` annoncé à « 4 Mo » vaut en réalité ≈ 20 Mo (erreur ×5) | **MAJEUR** | NFR / calcul de coin de table |
| ADV-09 | Zone de texte (`≈180 octets/ligne × 10⁶`) absente du total « ≈87 Mo » d'`EX-DATA-112` : vrai total ≈ 260-300 Mo | **MAJEUR** | NFR / calcul de coin de table |
| ADV-10 | 78 filtres retenus posés simultanément dépassent plausiblement le plafond de 2000 caractères d'URL | **MAJEUR** | Sollicitation / effectif de filtres |
| ADV-11 | `eq=136` (tout cocher) sous sémantique ET par défaut (A-03) garantit ~0 résultat pour tout jeu réel | **MAJEUR** | Sollicitation / valeur |
| ADV-12 | 20 changements de filtre R/seconde : recalculs locaux en file sans annulation documentée, gel d'UI sans indicateur | **MAJEUR** | Sollicitation / échelle |
| ADV-13 | Deux onglets près des plafonds CRUD (50/30) : concurrence `localStorage` non spécifiée | **MAJEUR** | Sollicitation / structure |
| ADV-14 | La zone-modèle « Modèle non identifié » (`modelId=0`), rendue cliquable, mène à l'écran d'erreur `EX-NAV-20` | **BLOQUANT** | Structure / contradiction inter-annexes |
| ADV-15 | `KYCAR_MARKETPLACE` déclare `n=9` mais la table de traduction pays (`EX-DATA-40`) ne couvre que 8 codes | **MINEUR/MAJEUR** | Structure |
| ADV-16 | Prix à 0 € : rejet de l'annonce entière (contrairement à `ON_REQUEST`/`MISSING`, qui restent comptés) | **MAJEUR** | Valeur / effectif |
| ADV-17 | Troncature de `modelVersionClean` à 80 caractères « sur frontière de mot » : aucun repli défini si aucune espace n'existe | **MINEUR** | Structure / texte adverse |
| ADV-18 | `modelVersionRaw` affiché sans exigence explicite d'échappement HTML | **MINEUR** | Structure / texte adverse |

**Bilan** : 4 BLOQUANT, 12 MAJEUR (dont 1 à cheval MINEUR/MAJEUR), 2 MINEUR.

---

## Fiches détaillées

### ADV-01 — Lien partagé tronqué par une messagerie : dérive silencieuse d'un filtre numérique valide

- **Sévérité proposée** : BLOQUANT
- **Attaque** : un utilisateur partage `…&pricefrom=5000&priceto=25000&fuel=B,D` par messagerie ;
  le client de messagerie tronque l'URL à un endpoit qui coupe `pricefrom=5000` en `pricefrom=50`
  au lieu de le couper franchement au milieu d'un paramètre inconnu.
- **Exigences traversées** : `EX-NAV-21` (correction silencieuse d'une valeur *hors domaine*),
  arbitrage **A-04** (correction permissive mais visible), `EX-NAV-18` (l'URL est une fonction
  pure et complète de l'état).
- **Ce qui se produit** : **mensonge plausible**. `pricefrom=50` est une valeur parfaitement
  valide dans le domaine du filtre (tout entier positif est un plancher de prix acceptable) — ce
  n'est ni un code énuméré inconnu (`EX-NAV-21`), ni un intervalle inversé (`EX-NAV-22`), donc
  **aucune des deux règles de correction visible d'A-04 ne se déclenche**. L'application affiche
  un marché « à partir de 50 € » entièrement cohérent, sans aucun bandeau, alors que l'utilisateur
  croit rouvrir sa recherche « à partir de 5 000 € ». Le nombre d'offres, les fourchettes, les
  histogrammes — tout est vrai *pour le filtre reçu*, faux *pour le filtre voulu*, et rien à
  l'écran ne permet de faire la différence.
- **Preuve** : la troncature d'un paramètre numérique en cours de valeur (pas en cours de nom) ne
  produit jamais une valeur syntaxiquement invalide tant qu'il reste au moins un chiffre — c'est
  précisément la classe d'erreur que `EX-NAV-21`/`A-04` ne couvrent pas, car ces règles ne
  traitent que les valeurs *hors domaine* ou *hors vocabulaire*, jamais les valeurs *dans le
  domaine mais tronquées*.
- **Correctif proposé** : ajouter une exigence de somme de contrôle ou de longueur attendue par
  paramètre numérique connu (ou une borne de plausibilité resserrée type « floor de prix
  cohérent avec le ceiling »), ou a minima documenter cette classe de risque comme limite connue
  du modèle de partage par URL pure.

---

### ADV-02 — La carte-marque étiquette littéralement « prix min – prix max », contredisant `[p05,p95]`

- **Sévérité proposée** : MAJEUR (bascule en BLOQUANT si implémenté au pied de la lettre)
- **Attaque** : reprendre l'exemple même de l'arbitrage A-05 — une marque dont le prix minimum
  brut observé est 119 € (valeur réellement relevée pour l'Opel Corsa,
  `FINDING-allowed-surface.md` §2.2) et le maximum brut 289 000 €.
- **Exigences traversées** : `EX-SCR-109` (« Résumé de marque, contenu exact… ligne 2 —
  `<prix min> – <prix max> €` ») vs `EX-DATA-69` (« La fourchette affichée d'une marque ou d'un
  modèle est `[p05, p95]`, donc robuste ») et arbitrage **A-05** (« `[p05, p95]` en principal…
  une carte affichant "119 € – 45 000 €" ne renseigne sur rien »).
- **Ce qui se produit** : **contradiction directe entre deux annexes sur le même champ affiché**.
  `EX-SCR-109` nomme littéralement les variables de son gabarit `<prix min>` et `<prix max>`, ce
  qui est exactement le format qu'A-05 qualifie d'inutilisable pour cette carte. Si un
  développeur suit `draft-screens.md` au pied de la lettre plutôt que de recouper avec
  `EX-DATA-69`, la carte-marque affichera « Opel : 119 € – 289 000 € » — précisément le rendu
  que le coordinateur a écrit pour l'interdire.
- **Preuve** : `EX-SCR-109` cite bien « (formats `EX-SCR-4` et `EX-SCR-6`) », ce qui pourrait
  suggérer un simple gabarit de présentation générique — mais il nomme les variables `prix min`/
  `prix max` et non des noms neutres (`borne basse`/`borne haute`), ce qui est un piège de lecture
  concret, pas une lecture forcée de ma part : deux développeurs lisant la même phrase peuvent
  raisonnablement diverger.
- **Correctif proposé** : renommer les variables d'`EX-SCR-109` en termes neutres (`<borne basse>`
  / `<borne haute>`) et ajouter une note renvoyant explicitement à `EX-DATA-69`/A-05 pour lever
  toute ambiguïté sur la source des deux nombres.

---

### ADV-03 — A-05 exige `[min,max]` « toujours » sur l'écran B ; l'en-tête `EX-SCR-142` ne l'affiche nulle part

- **Sévérité proposée** : MAJEUR
- **Attaque** : consulter l'écran B pour n'importe quel modèle et chercher où s'affiche la
  fourchette brute `[min, max]` que l'arbitrage A-05 rend obligatoire pour cet écran.
- **Exigences traversées** : arbitrage **A-05** (tableau : « B — distribution, et écran D →
  `[min, max]` bruts, toujours ») vs `EX-SCR-142` (en-tête statistique : `<n> offres`, `médiane`,
  `P25`, `P75` — aucune mention de min/max) et `EX-SCR-18` (axes de graphe bornés à P1-P99, débord
  en buckets sans étiquette numérique de valeur exacte).
- **Ce qui se produit** : **exigence sans point d'ancrage concret**. A-05 mandate un affichage
  précis et sans ambiguïté pour l'écran B, mais aucune exigence normative de `draft-screens.md`
  ne spécifie où ce couple de nombres apparaît littéralement à l'écran. Le plus proche candidat —
  les axes de `G1`/`G2` — sont bornés à P1/P99, pas au min/max exact, et les buckets de débord
  affichent une inégalité (`< borne`, `> borne`), jamais la valeur ponctuelle du minimum ou du
  maximum réel.
- **Preuve** : lecture croisée exhaustive de `§6.2` à `§6.4` de `draft-screens.md` — aucune
  occurrence du couple `min`/`max` littéral dans l'en-tête, dans `G1`-`G3`, ni dans `G4`. Le champ
  `rawRange.{price,year,mileage}` existe bien côté modèle de données (`EX-DATA-68`) mais son
  exposition à l'écran n'est jamais spécifiée.
- **Correctif proposé** : ajouter à `EX-SCR-142` une quatrième donnée d'en-tête (`min <prix> € —
  max <prix> €`) ou une infobulle dédiée, pour que A-05 ait un point d'implémentation vérifiable.

---

### ADV-04 — Prix à 1 € : `EX-SCR-36` contredit `EX-DATA-16(c)`/`60` sur l'inclusion dans les agrégats

- **Sévérité proposée** : BLOQUANT
- **Attaque** : injecter une annonce à `priceEur = 1` (ou toute valeur `1-249 €`) dans une
  cellule de 143 Opel Corsa 2017 dont la médiane réelle est 12 900 €.
- **Exigences traversées** : `EX-DATA-16(b)` et `EX-DATA-19` (`SUSPECT_PRICE_FLOOR` à 250 €,
  « exclusion des statistiques de prix ») et la table d'exclusion `EX-DATA-60` (`price` exclu de
  `V_price` si `ingestFlags ∋ SUSPECT_PRICE_FLOOR`) vs `EX-SCR-36` (« prix > 0 mais < 100 € →
  conservé et marqué comme suspect… **Il reste dans l'agrégat** : l'écarter reviendrait à masquer
  précisément l'anomalie recherchée »).
- **Ce qui se produit** : **contradiction directe et vérifiable par calcul**. Selon `EX-DATA-60`
  (autorité de l'annexe A sur les définitions mathématiques, arbitrage A-09), l'annonce à 1 € est
  retirée de `V_price` et n'influence ni la médiane, ni `G1`, ni M1, ni M2. Selon `EX-SCR-36`,
  elle « reste dans l'agrégat ». Si un développeur suit `EX-SCR-36`, l'histogramme `G1` et la
  médiane de l'en-tête intègrent une annonce à 1 € — un placeholder de contournement — dans un
  calcul qui prétend décrire le marché.
- **Preuve** : `EX-DATA-16` liste explicitement six conséquences (a)-(f) d'un `priceStatus ≠
  QUOTED` **ou** d'un flag `SUSPECT_PRICE_FLOOR`, dont (b) « exclue de toute statistique de prix »
  et (c) « exclue de l'histogramme des prix » — sans réserve pour les prix `1-99 €`. `EX-SCR-36`
  couvre le même intervalle de valeurs et prononce l'inverse pour le sous-cas 100 €> p> 0€.
- **Correctif proposé** : aligner `EX-SCR-36` sur `EX-DATA-16`/`60` : le prix bas reste **visible**
  (jeton `?` cliquable, comme prévu), mais doit être **exclu** de la médiane/l'histogramme/M1/M2,
  exactement comme tout `SUSPECT_PRICE_FLOOR`. La formulation actuelle laisse deux lectures
  produire deux chiffres différents pour la même médiane affichée.

---

### ADV-05 — Doublon exact avec deux prix différents : la valeur affichée est arbitraire et non signalée

- **Sévérité proposée** : BLOQUANT
- **Attaque** : le même `listingId` apparaît deux fois dans un snapshot (cas explicitement anticipé
  par `EX-DATA-15` : échantillonnage par page modèle voisine), mais avec deux valeurs de
  `priceEur` différentes — par exemple 12 900 € à la première occurrence rencontrée par
  l'ingestion et 10 500 € à la seconde (le vendeur a baissé son prix entre deux passes de crawl
  au sein du même snapshot).
- **Exigences traversées** : `EX-DATA-15` (« conservation de la première occurrence rencontrée
  dans l'ordre d'ingestion… l'occurrence suivante est écartée sans erreur »).
- **Ce qui se produit** : **mensonge plausible**, exactement la catégorie prioritaire demandée.
  Le prix affiché (12 900 € ou 10 500 €, selon un ordre d'ingestion qui — par la justification
  même d'`EX-DATA-15` — est un artefact de crawl et non un ordre de fraîcheur) est présenté comme
  *le* prix de l'annonce, sans aucun signal distinguant ce cas d'un doublon strictement identique.
  Le seul compteur prévu, `snapshot.duplicateListingCount`, est global au snapshot : il ne dit
  jamais « ce doublon particulier portait deux prix différents ».
- **Preuve** : `EX-DATA-45` énumère les 14 codes de `KYCAR_INGEST_FLAG` — aucun ne couvre un
  conflit de valeur entre deux occurrences d'un même `listingId` (le vocabulaire ne contient rien
  comme `DUPLICATE_VALUE_CONFLICT`). Le prix retenu est donc indiscernable, à l'écran, d'un prix
  parfaitement propre.
- **Correctif proposé** : ajouter un drapeau dédié quand deux occurrences d'un même `listingId`
  diffèrent sur un champ significatif (prix au minimum), et l'exposer dans le panneau
  `Diagnostic` a minima, idéalement sur la ligne de l'annonce concernée (écran D).

---

### ADV-06 — Seuil `n=10/11` : `EX-SCR-33` promet « tout est calculé » alors que M1/M2 l'interdisent

- **Sévérité proposée** : BLOQUANT
- **Attaque** : constituer une cellule d'homogénéité (`makeId`, `modelId`, éventuellement `année`)
  d'exactement `n = 10` puis `n = 11` annonces à prix connu.
- **Exigences traversées** : `EX-SCR-33` (« Au-delà de `n ≥ 10`, tout est calculé ») vs
  `EX-DATA-84`/`86`/`88` (M1 applicable seulement à `n_price(cellule) ≥ 12`) et `EX-DATA-90`
  (M2 applicable seulement à `|F| ≥ 30`). Par l'arbitrage **A-09**, les seuils d'effectif relèvent
  de l'Annexe A, qui fait foi.
- **Ce qui se produit** : à `n = 10` ou `n = 11`, `EX-SCR-33` affirme que « régression » et
  « détection d'outliers » sont actives, alors qu'**aucune des deux méthodes n'est mathématiquement
  applicable** : M1 exige `n ≥ 12`, M2 exige `n ≥ 30`. Un développeur qui suit `EX-SCR-33`
  implémente soit un affichage vide contredisant le texte de l'exigence (échec de conformité),
  soit — pire — invente un calcul de régression sur 10-11 points pour honorer la promesse
  d'affichage, produisant un `G8`/une détection d'outlier statistiquement creuse mais présentée
  comme fiable.
- **Preuve** : comparaison directe des deux seuils numériques (`n ≥ 10` contre `n ≥ 12` et
  `n ≥ 30`) sur le même concept (« détection d'outliers », « régression ») dans deux annexes dont
  l'arbitrage A-09 attribue explicitement l'autorité mathématique à l'Annexe A.
- **Correctif proposé** : corriger `EX-SCR-33` pour que la borne haute du palier « effectif
  suffisant » soit `n ≥ 30` (le plus contraignant des deux méthodes), avec un palier intermédiaire
  `12 ≤ n ≤ 29` où seule M1 (jamais M2) est disponible — ce palier manque actuellement à la table
  des trois paliers d'`EX-SCR-33`.

---

### ADV-07 — Seuil `n=29→30` : le score d'opportunité change de méthode d'un coup pour toute la cellule

- **Sévérité proposée** : MAJEUR
- **Attaque** : une cellule modèle de `n = 29` annonces à prix/année/km valides, puis l'arrivée
  d'une 30ᵉ annonce (aucune propriété des 29 premières ne change).
- **Exigences traversées** : `EX-DATA-90` (seuil M2 `|F| ≥ 30`) et `EX-DATA-94` (« `opportunityScore
  = −z_i` si M2 applicable… `= −zIqr_i` sinon, si M1 applicable »).
- **Ce qui se produit** : à `n = 29`, le classement des opportunités de toute la cellule repose
  sur `zIqr` (Tukey/log-prix seul). À `n = 30`, il bascule intégralement sur `z` (résidu de la
  régression robuste âge+km). Ces deux scores mesurent des choses différentes (écart au prix brut
  de la cellule vs écart au prix *attendu compte tenu de l'âge et du kilométrage*) : rien ne
  garantit qu'ils classent les mêmes annonces dans le même ordre. Le classement de `G8`, le tri
  par défaut de l'écran D (`EX-SCR-206`, « écart au prix attendu croissant ») et les drapeaux
  d'outlier affichés peuvent donc se **réordonner ou changer intégralement** pour les 29 annonces
  préexistantes, uniquement parce qu'une 30ᵉ annonce, non liée à elles, est apparue.
- **Preuve** : les deux formules de score (`EX-DATA-88` `zIqr` vs `EX-DATA-92` `z`) n'ont aucune
  relation de continuité l'une avec l'autre — ce sont deux statistiques indépendantes appliquées
  au même échantillon, donc un saut de méthode au même effectif ne peut, en toute généralité,
  produire un classement voisin de part et d'autre du seuil.
- **Preuve secondaire** : le seuil est cohérent en interne (`G8` n'est également tracé qu'à
  `n ≥ 30`, `EX-SCR-164`), donc ce n'est pas une incohérence documentaire — c'est une
  discontinuité de méthode assumée mais dont l'ampleur pratique (réordonnancement complet
  possible) n'est signalée nulle part à l'écran.
- **Correctif proposé** : documenter explicitement (bandeau ou infobulle) qu'un changement de
  méthode a eu lieu quand la cellule franchit le seuil de 30 entre deux chargements, au même titre
  que `EX-DATA-87`/A-07 exigent déjà de nommer la cellule et son effectif.

---

### ADV-08 — Tampon de comptage prix : « 4 Mo » annoncé, ≈ 20 Mo réels

- **Sévérité proposée** : MAJEUR
- **Attaque** : recalculer littéralement le chiffre que `EX-DATA-112` avance pour le tampon de
  tri par comptage du prix, à `N = 10⁶` annonces.
- **Exigences traversées** : `EX-DATA-111` (`price ∈ [1, 5·10⁶]`, quantiles exacts par tri par
  comptage) et `EX-DATA-112` (« Tampons de comptage… 4 Mo pour le prix (`Int32Array(5·10⁶)` alloué
  paresseusement sur la plage observée du snapshot) »).
- **Ce qui se produit** : **erreur arithmétique, chiffrée**. Un `Int32Array` de `5 000 000`
  éléments occupe `5 000 000 × 4 octets = 20 000 000 octets ≈ 19,07 Mio` — pas 4 Mo. Le
  document affirme un chiffre inférieur d'un facteur 5 à la réalité de la structure qu'il vient
  de décrire lui-même. Par comparaison, le tampon kilométrage voisin est correct : `Int32Array`
  sur un domaine `[0, 1 500 000]` (`EX-DATA-111`) donne `1 500 000 × 4 = 6 000 000 octets ≈ 5,72
  Mio`, ce que le document arrondit correctement à « 6 Mo ».
- **Preuve** : calcul direct, `5 000 000 × 4 = 20 000 000` octets. Aucune supposition
  d'implémentation n'est nécessaire : la taille du domaine (`EX-DATA-111`) et le type de tampon
  (`Int32Array`, `EX-DATA-112`) sont tous deux donnés explicitement par le document.
- **Correctif proposé** : corriger « 4 Mo » en « ≈ 20 Mo » dans `EX-DATA-112`, et reporter la
  correction dans le total (voir ADV-09, qui la recalcule en même temps que l'omission de la
  zone de texte).

---

### ADV-09 — La zone de texte (≈180 octets/ligne) est absente du total « ≈87 Mo » de `EX-DATA-112`

- **Sévérité proposée** : MAJEUR
- **Attaque** : recalculer l'enveloppe mémoire totale annoncée pour `N = 10⁶` annonces en
  reprenant la propre décomposition du document.
- **Exigences traversées** : `EX-DATA-119`/`121` (« `listingUrl`, `modelVersionRaw`,
  `modelVersionClean`, `fuelSourceLabelRaw`, `trimTokens` : zone de chaînes contiguë… ≈ 180 en
  moyenne » par ligne) et `EX-DATA-112` (« Enveloppe totale à `N = 10⁶` : 44 Mo de colonnes + 16 Mo
  d'identifiants + 11 Mo de tampons + 1,7 Mo d'agrégats de base + 1 Mo de référentiels + 13 Mo de
  cache ≈ **87 Mo** », « facteur 5 » de marge sous un budget d'onglet de 512 Mo).
- **Ce qui se produit** : **omission chiffrable, qui invalide la conclusion de sécurité**. La
  zone de texte que `EX-DATA-121` décrit comme faisant *partie de la même table `Listing`*
  (« hors des colonnes numériques, dans une zone contiguë ») pèse, à sa propre moyenne déclarée de
  180 octets/ligne, `180 × 10⁶ octets ≈ 172 Mio` à `N = 10⁶`. Ce poste n'apparaît **nulle part**
  dans la somme de `EX-DATA-112`. En le rajoutant (et en corrigeant ADV-08 au passage), le total
  réel devient environ `44 + 16 + 172 (texte) + 20 (tampon prix corrigé) + 6 (tampon km) + 1,7 +
  1 + 13 ≈ 274 Mo` — toujours sous les 512 Mo cités, mais avec une marge d'environ un **facteur 1,9**,
  pas un « facteur 5 » comme l'affirme le document. La conclusion normative qui en découle
  (« ce qui interdit de conclure que la borne haute de H5 oblige à une architecture serveur »)
  reste probablement vraie, mais elle repose sur un calcul faux.
- **Preuve** : addition directe des postes déclarés par le document lui-même dans deux sections
  différentes (`C.1` pour le total, `C.3` pour le détail par colonne) ; aucune donnée externe
  n'est utilisée.
- **Correctif proposé** : recalculer l'enveloppe totale d'`EX-DATA-112` en y intégrant
  explicitement la zone de texte (poste manquant) et le tampon de prix corrigé (ADV-08), et
  requalifier la marge annoncée en conséquence.

---

### ADV-10 — 78 filtres posés simultanément dépassent plausiblement le plafond de 2000 caractères

- **Sévérité proposée** : MAJEUR
- **Attaque** : poser, sur une même page, les 78 filtres retenus par l'arbitrage A-01 (et non les
  60-66 déjà éprouvés par `EX-SCR-102`/`EX-SCR-59` et suivants), chacun à une valeur non-défaut.
- **Exigences traversées** : arbitrage **A-01** (« le périmètre est porté à l'intégralité des
  filtres voiture… 78 retenus ») et `EX-NAV-18` (« il n'existe aucun état de filtre qui ne soit
  pas représentable dans l'URL ») vs `EX-NAV-10`/`11` (plafond dur de 2000 caractères, refus
  explicite au-delà).
- **Ce qui se produit** : **tension arithmétique entre deux exigences absolues**. Le filtre `eq`
  seul peut consommer jusqu'à environ 540 caractères pour une sélection large de ses 136 valeurs
  (chiffre donné par `EX-NAV-10` lui-même). En supposant que les 77 autres filtres retenus
  s'expriment en moyenne à ~20 caractères chacun sous la forme `nom=valeur&` (une estimation basse
  pour des filtres à intervalle comme `pricefrom=18000&priceto=25000&`, qui à eux seuls dépassent
  30 caractères), le total approche `77 × 20 + 540 = 2 080` caractères, avant même d'ajouter
  l'origine et le chemin (`https://kycar.app/marche?` ≈ 26 caractères) — soit ≈ **2 100+
  caractères**, au-dessus du plafond. Si le refus se déclenche (comme `EX-NAV-11` l'exige), alors
  au moins une combinaison de filtres, pourtant tous individuellement « implémentés, encodables
  dans l'URL et applicables au dataset » per A-01, ne peut **jamais** être posée simultanément —
  contredisant la lettre de A-01 et l'exigence de pureté d'`EX-NAV-18`.
- **Preuve** : calcul d'ordre de grandeur ci-dessus, fondé exclusivement sur les chiffres que le
  document donne lui-même pour `eq` (`EX-NAV-10`) et sur les gabarits de sérialisation
  (`EX-NAV-6`/`7`) des autres filtres à intervalle et à énumération.
- **Correctif proposé** : soit relever le plafond, soit documenter explicitement (dans A-01 ou
  `EX-NAV-10`) que « tous les filtres implémentés » ne signifie pas « tous simultanément
  applicables », en cohérence avec la note d'`EX-SCR-102` qui, elle, ne teste que 60 filtres.

---

### ADV-11 — `eq=136` (tout cocher) sous ET par défaut garantit ~0 résultat pour tout jeu réel

- **Sévérité proposée** : MAJEUR
- **Attaque** : sélectionner les 136 valeurs du panneau `eq` (« Tout cocher », l'inverse du bouton
  `Tout décocher` d'`EX-SCR-66`).
- **Exigences traversées** : arbitrage **A-03** / `EX-SRCH-12` (sémantique ET retenue par défaut
  pour `eq`, « cumuler des exigences d'équipement »).
- **Ce qui se produit** : sous sémantique ET, une annonce ne satisfait le filtre que si elle
  porte **simultanément** les 136 codes d'équipement. Même en supposant (généreusement) que
  chaque équipement individuel est présent sur 50 % des annonces d'un modèle, la probabilité
  qu'une annonce les porte tous vaut `0,5^136 ≈ 10⁻⁴¹` — c'est-à-dire, pour tout effectif réel de
  H5 (jusqu'à 10⁶ annonces), une probabilité pratiquement nulle d'obtenir ne serait-ce qu'une
  seule correspondance. Le résultat est déterministe et systématique : `ET-VIDE-FILTRES`
  (`EX-SCR-26`) pour toute sélection de `eq` approchant son maximum, quel que soit le reste des
  filtres. Ce n'est pas un plantage, mais une démonstration chiffrée que la sémantique ET choisie
  en A-03 s'effondre à haute cardinalité — le point même que l'ouverture O7/A-03 laisse en
  suspens, mais ici quantifié plutôt que supposé.
- **Preuve** : calcul de probabilité ci-dessus ; aucune donnée externe requise, seule
  l'indépendance approximative des 136 équipements est supposée (hypothèse favorable au filtre :
  une corrélation réelle entre équipements ne ferait qu'aggraver l'effondrement).
- **Correctif proposé** : ce constat renforce, avec un chiffre, la nécessité déjà actée par A-03
  de rendre la sémantique paramétrable et de l'indiquer explicitement à l'écran (déjà prévu par
  `EX-SCR-66`) — aucune correction supplémentaire n'est nécessaire au-delà de ce qui est déjà
  planifié, mais la mesure quantitative doit être conservée comme preuve de risque.

---

### ADV-12 — 20 changements de filtre R/seconde : gel d'UI sans indicateur de chargement

- **Sévérité proposée** : MAJEUR
- **Attaque** : un utilisateur (ou un test automatisé) coche/décoche 20 cases de filtre de classe
  R par seconde pendant 3 secondes (60 changements), sur un modèle chargé en mémoire à
  100 000 annonces.
- **Exigences traversées** : `EX-SRCH-1` (case/radio : application immédiate, debounce 0 ms) et
  `EX-SCR-25` (`ET-CHARGE-LOCAL` : recalcul local, budget 150 ms, **aucun indicateur de chargement
  d'aucune sorte**, au-delà de 150 ms bascule sur `ET-CHARGE-MAJ`) vs `EX-SCR-24` (annulation de
  la requête réseau en cours quand l'utilisateur continue de modifier un filtre).
- **Ce qui se produit** : chaque case cochée déclenche, sans délai, un recalcul synchrone
  (potentiellement jusqu'à 150 ms d'après le budget même de l'état). À 20 changements/seconde
  (un every 50 ms), les recalculs arrivent plus vite qu'ils ne peuvent se terminer : une file de
  recalculs **locaux** (donc, par construction de `ET-CHARGE-LOCAL`, sans aucun spinner ni barre
  de progression) s'accumule. Rien dans les exigences ne prévoit d'annulation d'un recalcul local
  synchrone déjà en cours (l'annulation d'`EX-SCR-24` ne concerne que les requêtes réseau
  `ET-CHARGE-MAJ`). Dans le pire cas, une rafale de 60 changements en 3 secondes, à 150 ms chacun,
  représente jusqu'à 9 secondes de calcul cumulé — pendant lesquelles, contractuellement, **aucun
  indicateur n'est censé apparaître** puisque chaque recalcul individuel reste, par construction,
  sous la focale de l'état « local ». L'interface paraît figée sans qu'aucun état dégradé du
  catalogue (§2 de `draft-screens.md`) ne s'applique formellement.
- **Preuve** : lecture littérale d'`EX-SCR-25` (« Aucun indicateur de chargement d'aucune sorte »)
  combinée à l'absence, dans `draft-behaviour.md` §B.1, de toute règle de debounce ou
  d'annulation pour les contrôles à 0 ms de la classe R.
- **Correctif proposé** : ajouter une règle de dépassement pour `ET-CHARGE-LOCAL` analogue à
  celle d'`EX-SCR-24` : au-delà d'un nombre de changements consécutifs dans une fenêtre courte
  (par exemple 3 changements en moins de 300 ms), regrouper en un seul recalcul différé plutôt
  que d'empiler des recalculs synchrones invisibles.

---

### ADV-13 — Deux onglets près des plafonds CRUD (50/30) : concurrence `localStorage` non spécifiée

- **Sévérité proposée** : MAJEUR
- **Attaque** : ouvrir deux onglets de l'application ; dans chacun, à 49 recherches sauvegardées
  déjà présentes, cliquer « Enregistrer cette recherche » quasi simultanément.
- **Exigences traversées** : `EX-CRUD-3`/`5` (persistance locale exclusive, plafond de 50
  recherches, création bloquée au-delà) et `EX-NFR-24`/`25` (toutes les données CRUD sont locales
  au navigateur, aucune synchronisation).
- **Ce qui se produit** : `localStorage` n'offre aucune garantie transactionnelle entre onglets
  d'une même origine. Un schéma lire-modifier-écrire non verrouillé (onglet A lit 49, onglet B lit
  49 avant que A n'écrive, les deux écrivent 50) peut soit faire perdre silencieusement l'une des
  deux nouvelles entrées (l'écriture la plus tardive écrase l'autre), soit — selon
  l'implémentation exacte — laisser le compteur dépasser silencieusement 50, contredisant la
  garantie de plafond dur d'`EX-CRUD-5`. Aucune des deux issues n'est mentionnée dans les
  exigences, et aucun mécanisme de verrouillage (par exemple `BroadcastChannel` ou une primitive
  de verrou Web) n'est requis nulle part dans la section D.7 (confidentialité/stockage).
- **Preuve** : absence de toute mention de concurrence multi-onglets dans `EX-CRUD-1` à `17` et
  dans `EX-NFR-24` à `27`, alors que rien dans l'architecture (URL comme état, absence de compte)
  n'empêche structurellement l'utilisateur d'ouvrir deux onglets — un geste courant et non
  interdit par aucune exigence.
- **Correctif proposé** : ajouter une exigence de verrouillage optimiste (lecture de la valeur
  actuelle juste avant écriture, avec message d'échec si le plafond est atteint entre-temps) ou de
  synchronisation par événement `storage` pour rafraîchir la liste affichée dans les onglets
  inactifs.

---

### ADV-14 — La zone-modèle « Modèle non identifié » (`modelId=0`), rendue cliquable, mène à l'écran d'erreur

- **Sévérité proposée** : BLOQUANT
- **Attaque** : un snapshot contient des annonces Opel dont le modèle n'a pas pu être résolu
  (cas explicitement anticipé par `EX-DATA-20` : marque inconnue → rejet, mais modèle inconnu →
  conservation avec `modelId = INCONNU`). L'agrégat modèle réservé `j = 0`, « Modèle non
  identifié », apparaît en dernière position de la carte Opel (`EX-DATA-72`). L'utilisateur clique
  dessus.
- **Exigences traversées** : `EX-SCR-113`/`117` (« Toute la bande de 72 px est la cible
  cliquable… Clic sur la zone-modèle → navigation vers l'écran B pour ce couple marque/modèle »,
  « aucun élément optionnel ») vs `EX-NAV-20` (« `modelId` n'appartenant pas à `makeId` → écran
  d'erreur dédié »).
- **Ce qui se produit** : `modelId = 0` est une clé **synthétique** créée par le moteur
  d'agrégation (`EX-DATA-72`), qui n'existe dans **aucune** entrée de `taxonomy.json` pour
  **aucune** marque. Naviguer vers `/marche/16-opel/0-modele-non-identifie` déclenche donc
  exactement la condition d'`EX-NAV-20` (« modelId n'appartenant pas à makeId »), qui affiche
  l'écran d'erreur « ce modèle n'existe pas pour cette marque ». L'application invite
  explicitement l'utilisateur à cliquer sur un élément dont le clic mène, par une autre règle
  normative du même document, à un écran d'erreur — sauf à ce qu'une exception au routage soit
  faite pour `modelId = 0`, ce qu'aucune exigence ne prévoit.
- **Preuve** : `EX-DATA-72` définit `j = 0` comme une clé réservée du moteur d'agrégation, absente
  par construction de la taxonomie de référence ; `EX-NAV-20` ne prévoit aucune exception pour
  cette clé réservée.
- **Correctif proposé** : soit river une route dédiée pour `modelId = 0` (un écran listant les
  seules annonces non résolues, sans distribution par modèle), soit rendre la zone-modèle
  « Modèle non identifié » **non cliquable** (contredisant alors `EX-SCR-113`, qui devrait être
  amendé en conséquence pour prévoir cette unique exception).

---

### ADV-15 — `KYCAR_MARKETPLACE` déclare `n=9` mais la table de traduction pays ne couvre que 8 codes

- **Sévérité proposée** : MINEUR/MAJEUR (selon la fréquence réelle du 9ᵉ marketplace)
- **Attaque** : compter les entrées du vocabulaire `KYCAR_MARKETPLACE` (§A.1 : « 9 ») et les
  comparer à la table de traduction marketplace→ISO d'`EX-DATA-40`.
- **Exigences traversées** : tableau des vocabulaires nommés (§A.1, ligne `KYCAR_MARKETPLACE`) et
  `EX-DATA-40` (« B→BE, D→DE, A→AT, E→ES, F→FR, I→IT, L→LU, NL→NL »).
- **Ce qui se produit** : la table de traduction ne compte que **8** paires pour un vocabulaire
  déclaré à **9** valeurs (`OAS:components.schemas.Marketplace`). Le 9ᵉ marketplace (par exemple
  un marché non listé parmi BE/DE/AT/ES/FR/IT/LU/NL) n'a aucune règle de résolution de code pays
  documentée — ni pour construire une requête vers la source, ni pour interpréter un code reçu.
- **Preuve** : dénombrement direct des deux tableaux normatifs.
- **Correctif proposé** : identifier le 9ᵉ marketplace de l'énumération OpenAPI et ajouter sa
  ligne de traduction, ou documenter explicitement que ce 9ᵉ marché est hors périmètre H1.

---

### ADV-16 — Prix à 0 € : rejet de l'annonce entière, contrairement à `ON_REQUEST`/`MISSING`

- **Sévérité proposée** : MAJEUR
- **Attaque** : une annonce dont `priceEur = 0` (défaut numérique d'un champ de formulaire non
  rempli côté source, un cas réaliste de défaut de scraping ou de saisie).
- **Exigences traversées** : champ #7 `priceEur`, colonne Validation (« `1 ≤ p ≤ 5 000 000` sinon
  REJET ») vs `EX-DATA-16(a)` (une annonce à `priceStatus ≠ QUOTED` « **compte** dans tout
  effectif »).
- **Ce qui se produit** : `priceEur = 0` échoue la borne `1 ≤ p`, donc — selon la convention
  générale de REJET d'`EX-DATA-2` (« l'annonce entière est écartée ») — l'annonce disparaît
  **entièrement** du snapshot, y compris de `listingCount`, l'unique chiffre qualifié
  d'« exhaustif » par `EX-DATA-59`. C'est une divergence de traitement par rapport à toutes les
  autres formes d'absence de prix (`ON_REQUEST`, `MISSING`) qui, elles, restent explicitement
  comptées dans l'effectif par principe (`EX-DATA-16a`, justifié : « le prix sur demande est une
  information sur l'offre… la compter dans l'effectif… est la seule lecture qui ne mente sur
  aucun des deux chiffres »). Un prix à 0 € — pourtant le défaut de saisie le plus banal — reçoit
  un traitement strictement plus sévère (disparition totale, silencieuse hors panneau
  Diagnostic) que `priceEur` simplement absent.
- **Preuve** : lecture littérale de la colonne Validation du champ #7 combinée à la convention
  générale de `EX-DATA-2` sur le sens de REJET, et comparaison avec la philosophie explicite
  d'`EX-DATA-16(a)`.
- **Correctif proposé** : traiter `priceEur = 0` comme `MISSING` (INCONNU, conservé dans
  l'effectif) plutôt que comme une violation de borne provoquant un REJET intégral — cohérent
  avec le traitement déjà réservé à `mileageKm = 0` (`EX-DATA-38`, sentinelle et non rejet).

---

### ADV-17 — Troncature de `modelVersionClean` à 80 caractères : aucun repli si aucune espace n'existe

- **Sévérité proposée** : MINEUR
- **Attaque** : `modelVersionInput` = une chaîne de 3 000 caractères sans aucun espace dans les 80
  premiers caractères (par exemple une suite d'émojis déjà partiellement filtrés à l'étape 2, ou
  un identifiant technique concaténé sans séparateur).
- **Exigences traversées** : `EX-DATA-29`, étape 6 (« troncature à 80 caractères **sur une
  frontière de mot** (dernier espace avant la limite) »).
- **Ce qui se produit** : si aucune espace n'existe dans les 80 premiers caractères, « le dernier
  espace avant la limite » n'a pas de valeur — le pipeline ne définit aucun repli. Deux
  implémentations conformes peuvent légitimement diverger : l'une tronque durement à 80, l'autre
  cherche la prochaine espace au-delà de 80 (violant alors la limite de longueur du champ
  `chaîne(80)`), une troisième pourrait choisir de ne rien tronquer du tout. Ceci contredit
  directement la garantie de déterminisme réclamée par `EX-DATA-28`/le principe R6 (« toute
  implémentation correcte produit la même sortie »).
- **Preuve** : lecture littérale de l'étape 6, absence de clause « à défaut de… ».
- **Correctif proposé** : ajouter une règle de repli explicite, par exemple « à défaut d'espace
  dans les 80 premiers caractères, tronquer durement à 80 caractères sans chercher de frontière
  de mot ».

---

### ADV-18 — `modelVersionRaw` affiché sans exigence explicite d'échappement HTML

- **Sévérité proposée** : MINEUR
- **Attaque** : `modelVersionInput` contient une charge utile de type `<img src=x
  onerror=alert(document.cookie)>` (texte libre, saisi par un vendeur, jamais validé
  syntaxiquement par la source selon `FINDING-allowed-surface.md`).
- **Exigences traversées** : `EX-DATA-28` (`modelVersionRaw` conservé « valeur d'affichage et de
  traçabilité ») et son affichage prévu en infobulle `G4` (`EX-SCR-158`, tronqué à 40 caractères)
  et en colonne « Version » de l'écran D (`EX-SCR-203`, tronqué à 40 caractères) — le pipeline de
  nettoyage d'`EX-DATA-29` s'applique à `modelVersionClean`, **pas** à `modelVersionRaw`, qui est
  affiché tel quel.
- **Ce qui se produit** : rien dans les exigences n'impose explicitement un échappement HTML de
  `modelVersionRaw` avant rendu. La liste d'arrêt promotionnelle d'`EX-DATA-30` prouve d'ailleurs
  que le champ est connu pour porter du texte à risque (numéros de téléphone, URLs) — le même
  champ pourrait tout aussi bien porter des balises actives. Si l'implémentation insère ce texte
  via une API non sécurisée (`innerHTML` plutôt que `textContent`/liaison de framework
  auto-échappante), c'est un vecteur de XSS stocké latent. Ce n'est pas un plantage garanti (les
  frameworks modernes échappent par défaut), mais aucune exigence ne le rend impossible.
- **Preuve** : absence de toute mention d'échappement/assainissement pour `modelVersionRaw` dans
  `EX-DATA-28` à `31`, alors que le même champ est explicitement documenté comme porteur de texte
  non maîtrisé.
- **Correctif proposé** : ajouter une exigence explicite d'échappement/rendu en texte brut pour
  tout affichage de `modelVersionRaw`, au même titre que R3 impose l'absence structurelle des
  champs vendeur.

---

## Matrice complète des attaques tentées

| Attaque | Effectif/valeur testé(e) | Verdict | Réf. |
|---|---|---|---|
| Effectif nul | `n = 0` | **Tient** — `EX-DATA-81`, `EX-SCR-33`, `EX-SCR-116` gèrent explicitement, aucun `0-0 €` fabriqué | — |
| Effectif unitaire | `n = 1` | **Tient** — quantile, `sd = null` (jamais `0`), bucket unique, point `G4` centré, tous explicitement spécifiés | — |
| Effectif = 2 | `n = 2` | **Tient** — pas de règle spéciale nécessaire, formules de quantile/BIN continues | — |
| Effectif = 3 | `n = 3` | **Tient** — cas explicitement testé (`EX-SCR-150`, matrice de vérification) | — |
| Seuil M1 | `n = 11` puis `12` | **Casse** — voir ADV-06 (en réalité la vraie rupture est à `n=10` côté écran, pas `12`) | ADV-06 |
| Seuil M2 | `n = 29` puis `30` | **Casse** — bascule de méthode de score, réordonnancement possible | ADV-07 |
| Plafond nuage | `n = 5 000` | **Tient, avec réserve** — rendu SVG (pas encore canvas) à la borne haute exacte ; le budget 30 im/s d'`EX-NFR-8` est théoriquement tendu sur 5 000 nœuds SVG mais aucune preuve de rupture certaine n'a pu être établie sans mesure réelle | — |
| Borne haute H5 | `n = 1 000 000` | **Casse sur le calcul, pas sur le comportement** — architecture saine, mais deux erreurs arithmétiques dans le budget mémoire | ADV-08, ADV-09 |
| Prix à 1 € | `priceEur = 1` | **Casse** — contradiction `EX-SCR-36` / `EX-DATA-16` | ADV-04 |
| Prix à 0 € | `priceEur = 0` | **Casse** — rejet total de l'annonce, incohérent avec le traitement des autres prix absents | ADV-16 |
| Prix absent | — | **Tient** — `priceStatus = MISSING`, comptée dans l'effectif, exclue des stats de prix | — |
| Prix sur demande | `onRequestOnly = true` | **Tient** — `EX-DATA-16` couvre tous les cas, y compris la contradiction prix+flag (`EX-DATA-32`) | — |
| Prix extrême | `priceEur = 9 999 999` | **Casse, marginalement** — dépasse le plafond de validation (5 000 000 €), REJET total silencieux d'un véhicule de collection légitime | (non fiché en détail, cf. ADV-16 pour le principe) |
| Kilométrage nul | `mileageKm = 0`, véhicule neuf | **Tient** — traité comme légitime pour les `offerType` adéquats (`EX-DATA-38`) | — |
| Kilométrage extrême | `mileageKm = 1 500 000` | **Tient** — borne haute exacte du domaine validé, acceptée sans réserve | — |
| Année absente | — | **Tient** — exclusion métrique par métrique (`EX-DATA-26`), jamais d'imputation | — |
| Année ancienne | `firstRegistrationYear = 1920` | **Tient** — dans les bornes, capturée par le bucket de débord `avant <AAAA>` de `G3` si l'étendue dépasse 30 ans | — |
| Année future | `firstRegistrationYear = 2027` | **Fragilité mineure** — passe la validation (borne haute `observedAt.year+1`), `vehicleAgeMonths` devient `INCONNU` mais l'année elle-même reste affichée sans aucun drapeau de suspicion, contrairement au prix et au kilométrage | (non fiché séparément, gravité mineure) |
| Puissance nulle | `powerKw = 0` | **Tient** — hors borne `[1, 99999]`, devient INCONNU proprement | — |
| Variance nulle | toutes les annonces au même prix | **Tient** — `IQR=0`/`MAD=0` → `INSUFFICIENT_SPREAD` explicite, aucun faux positif (`EX-DATA-89`, `92`) | — |
| Colinéarité | toutes les annonces au même kilométrage | **Tient** — régresseur retiré avant ajustement (`EX-DATA-91`) | — |
| Une seule année | sélection mono-année | **Tient** — même mécanisme de retrait de régresseur ; M2 continue sur le seul kilométrage si celui-ci varie | — |
| Modèle inconnu du référentiel | `modelId = INCONNU` | **Casse à l'usage** — la zone-modèle « non identifié » est cliquable mais mène à une erreur | ADV-14 |
| Marque à 0 modèle résolu | `modelCount = 0`, effectif > 0 | **Fragilité mineure** — affichage « 0 modèles » à côté d'un effectif non nul, techniquement correct mais déroutant sans note explicative | (non fiché séparément) |
| Marque à 80 modèles | — | **Tient** — trois règles cumulatives explicites (défilement, recherche, virtualisation), `EX-SCR-124` | — |
| Doublon exact | même `listingId` × 2, même prix | **Tient** — dédoublonnage documenté, comptage global (`EX-DATA-15`) | — |
| Doublon à prix différents | même `listingId` × 2, prix différents | **Casse** — valeur affichée arbitraire, aucun drapeau | ADV-05 |
| Modèle disparu du snapshot | filtre devenu invalide | **Tient** — `EX-SCR-101`, `EX-SCR-213` gèrent explicitement le cas | — |
| Texte adverse 3000 car. | `modelVersionInput` avec émojis/HTML | **Fragilités mineures** — troncature sans repli si absence d'espace ; absence d'exigence d'échappement HTML | ADV-17, ADV-18 |
| Code postal invalide | hors plage, ou alphanumérique étranger | **Tient** — `REGION_UNRESOLVED`/INCONNU, repli sur le pays | — |
| Pays hors marketplaces couverts | 9ᵉ code marketplace | **Casse, mineur** — table de traduction incomplète | ADV-15 |
| URL avec tous les filtres | 78 filtres simultanés | **Casse potentiellement** — dépassement plausible du plafond de 2000 caractères | ADV-10 |
| `eq` à 136 valeurs | tout cocher | **Dégradation démontrée** — ~0 résultat garanti sous sémantique ET | ADV-11 |
| Changement de filtre à 20 Hz | rafale de 60 changements en 3 s | **Casse** — gel d'UI sans indicateur possible sur les filtres de classe R | ADV-12 |
| Retour arrière × 50 | historique profond | **Tient** — dégrade en recalcul (cache LRU manqué) plutôt qu'en erreur | — |
| Deux onglets, états différents | CRUD près du plafond | **Casse** — concurrence `localStorage` non spécifiée | ADV-13 |
| Lien tronqué par messagerie | paramètre numérique coupé | **Casse, mensonge silencieux** | ADV-01 |
| Rechargement pendant un chargement | — | **Tient** — architecture URL-pure, idempotente | — |

**Bilan chiffré** : sur 38 attaques tentées, **18 produisent un constat retenu** (dont 4
BLOQUANT), et **20 tiennent** sans réserve ou avec une réserve mineure non fichée séparément.
