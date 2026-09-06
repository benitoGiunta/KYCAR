# Journal d'application — liste `ANNEXE-A` (39 travaux)

Cible unique : `docs/requirements/draft-data-dictionary.md`.
Source des décisions : `reports/REQ-STRESSTEST.md` § 4.1 (liste de travaux) et § 2 (texte exact).
Contexte normatif : `docs/requirements/ARBITRAGES-req-lead.md` § Révisions (`R-A06`, `R-A01`,
`R-A05`), règle d'autorité `A-09`, `docs/00-CONTEXT.md` règle R3.

État initial du document : 1 584 lignes, 127 exigences `EX-DATA-1` … `EX-DATA-127`, aucun `bis`.

| # | Décision | Exigence | Action faite | Statut |
|---|---|---|---|---|

<!-- lots ci-dessous -->

## Lot 1 — `A-01` à `A-05` (vocabulaire `KYCAR_INGEST_FLAG` et propagation du renommage)

| # | Décision | Exigence | Action faite | Statut |
|---|---|---|---|---|
| A-01 | `ARB-13` | `EX-DATA-45` | `SUSPECT_PRICE_FLOOR` renommé `PRICE_SENTINEL_ABSOLUTE` dans la liste des codes ; note ajoutée excluant `PRICE_IMPLAUSIBLE_IN_CELL` du vocabulaire (verdict d'analyse, `R-A06`) | APPLIQUÉ |
| A-02 | `ARB-16` | `EX-DATA-45` | `PRICE_OUT_OF_RANGE` ajouté ; mentionné en outre dans le rapport d'ingestion `EX-DATA-46`, comme le demande le corps d'`ARB-16` | APPLIQUÉ |
| A-03 | `ARB-54` | `EX-DATA-45` | `DUPLICATE_VALUE_CONFLICT` ajouté | APPLIQUÉ |
| A-04 | `ARB-60` | `EX-DATA-45` | `MARKETPLACE_UNMAPPED` ajouté ; cardinal du vocabulaire porté de 14 à **17** au titre et dans la phrase de clôture sur les sous-qualifications | APPLIQUÉ |
| A-05 | `ARB-13` | toute l'annexe A | Propagation du renommage. Occurrences de `SUSPECT_PRICE_FLOOR` trouvées par `grep` avant application : **4** — ligne 201 (champ 7 `priceEur`, colonne Validation), ligne 237 (`EX-DATA-19`), ligne 588 (`EX-DATA-45`), ligne 766 (`EX-DATA-60`, ligne `price`). Toutes traitées : `EX-DATA-45` par `A-01`, champ 7 par `A-07`, `EX-DATA-19` par `A-11`, `EX-DATA-60` par `A-15`. `grep` de contrôle final : 0 occurrence restante | APPLIQUÉ |

### Notes du lot 1

- `ARB-13` annonçait des occurrences de `SUSPECT_PRICE_FLOOR` dans `EX-DATA-16` et dans
  « `EX-DATA-99` motif `suspectValue` ». Vérification : **`EX-DATA-16` ne contient aucune
  occurrence** du code (elle parle du prix sur demande, pas de la sentinelle), et `suspectValue`
  d'`EX-DATA-99` est le nom d'un **motif de non-éligibilité au tracé**, pas le nom du drapeau. Rien
  n'a donc été renommé à ces deux endroits : la liste parenthétique de la décision est plus large
  que l'état réel du document. Aucun blocage, signalé pour traçabilité.

## Lot 2 — `A-06` à `A-09`

| # | Décision | Exigence | Action faite | Statut |
|---|---|---|---|---|
| A-06 | `ARB-14` | `EX-DATA-2` | Bloc « Ordre d'application, normatif » inséré après la table des colonnes : Normalisation puis Validation, bornes inclusives sauf mention contraire, trois conséquences assumées (`priceEur ≤ 249`, `badgeDisplacementL = 0,55`, `consumptionCombinedL100Km = 99,94`) | APPLIQUÉ |
| A-07 | `ARB-16` | champ 7 `priceEur`, colonne Validation | Colonne Validation entièrement réécrite : `p = 0` / non numérique → `MISSING` + `PRICE_MISSING_UNDECLARED` ; `p > 5 000 000` → `INCONNU` + `PRICE_OUT_OF_RANGE` ; `1 ≤ p ≤ 5 000 000` valide ; `p < 250` → `PRICE_SENTINEL_ABSOLUTE` ; verdict REJET retiré du champ | APPLIQUÉ |
| A-08 | `ARB-24` | `EX-DATA-7` | Phrase ajoutée : normalisation NFC au chargement de tout libellé de `taxonomy.json` (`Make.label`, `Model.label`) | APPLIQUÉ |
| A-09 | `ARB-54` | `EX-DATA-15` | Deuxième paragraphe remplacé : ordre d'ingestion total `(pageIndex, positionDansPage)`, première occurrence conservée, `duplicateListingCount`, drapeau `DUPLICATE_VALUE_CONFLICT` sur divergence de `priceEur`/`priceStatus`/`mileageKm`/`firstRegistrationYearMonth`, compteur `duplicateValueConflictCount`, justification reprise | APPLIQUÉ |

### Notes du lot 2

- `A-07` consomme l'une des quatre occurrences de renommage de `A-05` (champ 7) et fait disparaître
  le verdict REJET du champ prix : la ligne « Si absent » du champ 7 reste
  `INCONNU → priceStatus déduit`, cohérente avec la décision.
- `ARB-54` demande en outre l'ajout de `duplicateValueConflictCount` aux champs de `Snapshot`
  (`EX-DATA-106`). **Ce travail n'apparaît dans aucune des 39 lignes de la liste `ANNEXE-A`** — voir
  la section « Écarts constatés entre la liste de travaux et le corps des décisions » en fin de
  journal.

## Lot 3 — `A-10` à `A-14`

| # | Décision | Exigence | Action faite | Statut |
|---|---|---|---|---|
| A-10 | `ARB-15` | `EX-DATA-16` | **AUCUNE** action requise par la liste : l'exigence fait foi en l'état et sert de référence à l'alignement de l'annexe B. Relue et laissée inchangée | APPLIQUÉ (aucune édition, conforme) |
| A-11 | `ARB-13` | `EX-DATA-19` | Exigence entièrement remplacée par le texte de `R-A06` : deux règles, deux étages, un seul passage `filtrer l'absolu → médiane → marquer le relatif`, interdiction de l'itération et du point fixe, seuil de non-application `n_price(C) < 12` après retrait des sentinelles absolues, cellule au sens d'`EX-DATA-86`, effectif comptant les deux drapeaux, exclusion des deux de `V_price`, étiquetage de cellule (`A-07`, `ARB-47`). La justification d'origine (minimum d'occasion 119 €) est conservée à l'appui du seuil absolu | APPLIQUÉ |
| A-12 | `ARB-62` | `EX-DATA-28` | Paragraphe ajouté : rendu en contenu textuel exclusif des champs `*Raw`, interdiction de `innerHTML`/`dangerouslySetInnerHTML`/`v-html`, interdiction en attribut d'URL et en gestionnaire d'événement, extension à `title`/`aria-label`, test d'injection `<img src=x onerror=…>` du lot D4 sur `EX-SCR-158` et `EX-SCR-203` | APPLIQUÉ |
| A-13 | `ARB-61` | `EX-DATA-29`, étape 6 | Cellule de l'étape 6 réécrite : dernier espace à un index strictement inférieur à 80, à défaut troncature dure à exactement 80 caractères, respect des groupes de graphèmes étendus (`ARB-24`) | APPLIQUÉ |
| A-14 | `ARB-60` | `EX-DATA-40` | Paragraphe ajouté sous la table de traduction : `KYCAR_MARKETPLACE` compte 9 valeurs pour 8 traduites, repli `countryCode = INCONNU` + `MARKETPLACE_UNMAPPED`, annonce conservée, aucune requête source construite, neuvième marché hors périmètre H1 | APPLIQUÉ |

### Notes du lot 3

- **Contradiction résiduelle signalée, `A-14`.** Le repli d'`ARB-60` (« l'annonce est
  **conservée** (aucun rejet) ») coexiste avec la colonne Validation du champ 74 `countryCode`, qui
  porte encore « 2 lettres majuscules et code ISO existant sinon **REJET** », et la colonne
  « Si absent » qui porte `REJET`. La liste de travaux `A-14` ne vise que `EX-DATA-40` et ne
  demande aucune retouche du champ 74 ; le paragraphe a donc été inséré tel quel, sans toucher à la
  ligne du champ. **Décision à prendre** : soit la colonne Validation du champ 74 reçoit une
  exception nommée pour le marketplace non traduit, soit `ARB-60` doit préciser que son repli ne
  vaut que pour un **code marketplace** non traduit et non pour un `countryCode` ISO invalide. En
  l'état, un lecteur qui applique le champ 74 rejette l'annonce que `EX-DATA-40` demande de
  conserver.
- `A-11` consomme la troisième des quatre occurrences de `SUSPECT_PRICE_FLOOR` (`A-05`).

## Lot 4 — `A-15` à `A-18`

| # | Décision | Exigence | Action faite | Statut |
|---|---|---|---|---|
| A-15 | `ARB-13`, `ARB-15`, `ARB-16` | `EX-DATA-60` | Ligne `price` de la table des exclusions réécrite : `priceStatus ≠ QUOTED` **ou** `PRICE_SENTINEL_ABSOLUTE` **ou** `PRICE_OUT_OF_RANGE` **ou** `PRICE_IMPLAUSIBLE_IN_CELL(C)`, ce dernier terme n'existant qu'en calcul de cellule. Note ajoutée sous la table : les deux réglages d'`EX-SCR-95` sont les seuls paramètres utilisateur de la table, aucun autre contrôle d'écran ne peut ajouter ou retirer une exclusion | APPLIQUÉ |
| A-16 | `ARB-01` | `EX-DATA-61bis` | **CRÉÉE** immédiatement après `EX-DATA-61` : `sampleCoverage`, `metricCoverage_m`, `priceQuotedShare`, non-substituabilité, `NON_APPLICABLE` sous filtre, interdiction du mot « couverture » nu dans les quatre documents normatifs, justification | APPLIQUÉ |
| A-17 | `ARB-21`, `ARB-20` | `EX-DATA-64` | Deux phrases ajoutées sous la table des treize valeurs : primauté de l'arrondi d'`EX-DATA-6` sur toute règle de format d'écran et identité d'arrondi écran/CSV ; libellés d'affichage `P5` et `P95` pour `p05` et `p95` | APPLIQUÉ |
| A-18 | `ARB-22` | `EX-DATA-67` | Titre généralisé en « arrondi des bornes de fourchette » ; règle plancher-plafond étendue aux bornes de kilométrage (`EX-SCR-5`) et aux bornes de prix quand l'arrondi de présentation n'est pas à l'unité ; arrondi au plus proche réservé aux valeurs unitaires ; justification complétée | APPLIQUÉ |

### Notes du lot 4

- `A-15` consomme la quatrième et dernière occurrence de `SUSPECT_PRICE_FLOOR` (`A-05`).
- `A-15` intègre les trois décisions convergentes sans les empiler : `ARB-13` fournit
  `PRICE_SENTINEL_ABSOLUTE` et `PRICE_IMPLAUSIBLE_IN_CELL(C)`, `ARB-16` ajoute
  `PRICE_OUT_OF_RANGE`, `ARB-15` la note sur `EX-SCR-95`. Les trois textes de remplacement de la
  même ligne étaient compatibles ; la ligne finale porte les quatre termes.
- `A-16` référence `EX-SCR-27bis`, exigence **créée par l'agent de l'annexe B** (`B-01`). Le renvoi
  est écrit tel que la décision l'exige ; sa résolution dépend de l'annexe B.

## Lot 5 — `A-19` à `A-22`

| # | Décision | Exigence | Action faite | Statut |
|---|---|---|---|---|
| A-19 | `ARB-01` | `EX-DATA-68` | Ligne `announcedCount` ajoutée à la table de champs de `MakeAggregate` : source `listings.metadata.totalItems` (marque) / `topModels[].listingsCount` (modèle), preuve `OBSERVÉ`, `INCONNU` si absent, jamais recalculé sous filtre | APPLIQUÉ |
| A-20 | `ARB-19`, `ARB-20` | `EX-DATA-69` | Paragraphe ajouté : `displayRange` sur l'écran A seul et jamais sans l'étiquette `(90 % des offres)`, `rawRange` sur les écrans B et D et dans l'export CSV sans écrêtage, bornes d'axe d'histogramme exclues du régime des fourchettes ; libellés `P5`/`P95` | APPLIQUÉ |
| A-21 | `ARB-25` | `EX-DATA-70` | La comparaison « point de code Unicode sur le libellé normalisé NFC passé en majuscules » est remplacée par un renvoi à `EX-DATA-70bis` ; mention de la totalité de l'ordre au sens d'`EX-DATA-70ter` | APPLIQUÉ |
| A-22 | `ARB-25` | `EX-DATA-70bis`, `EX-DATA-70ter` | **CRÉÉES** à la suite d'`EX-DATA-70` : procédure de comparaison en cinq étapes (NFD, retrait `U+0300–U+036F`, majuscules invariantes de locale, NFC, comparaison point de code), chiffres comparés comme caractères, `Intl.Collator` interdit ; totalité de tout ordre publié, clés de départage, `null` en fin d'ordre dans les deux sens, `modelId = 0` en dernier | APPLIQUÉ |

## Lot 6 — `A-23` à `A-26`

| # | Décision | Exigence | Action faite | Statut |
|---|---|---|---|---|
| A-23 | `ARB-59` | `EX-DATA-72` | Phrase ajoutée au corps de l'exigence : la clé réservée `j = 0` porte le libellé canonique `Modèle non identifié` et le slug `modele-non-identifie`, de sorte que la route de l'écran B soit constructible (`EX-NAV-20`, `ARB-40`) | APPLIQUÉ |
| A-24 | `ARB-01` | `EX-DATA-72`, ligne « champs ajoutés » | `announcedCount` ajouté à la ligne « champs ajoutés » de la table de différences : `topModels[].listingsCount`, preuve `OBSERVÉ`, `INCONNU` si absent, jamais recalculé sous filtre | APPLIQUÉ |
| A-25 | `ARB-08` | `EX-DATA-79` | « affichent leur borne finie suivie de `−` ou `+` » remplacé par les deux formes exactes `< <hi> <unité>` (bas) et `≥ <lo> <unité>` (haut) ; interdiction explicite de `> <borne>`, `<borne> +` et `avant <AAAA>`, alias d'affichage compris | APPLIQUÉ |
| A-26 | `ARB-04` | `EX-DATA-83bis`, `83ter`, `83quater`, `83quinquies` | **Section `B.5bis` Agrégats par groupe créée** entre `B.5` et `B.6`, déclarée source unique de `G5`, `G6`, `G7`, `G9`, `G10`, `G12`, `G13`, `G14`, `G15` et de l'infobulle d'`EX-SCR-149`. Les quatre exigences y sont créées : `GROUPSTAT(Σ, g, m)` avec ses neuf clés autorisées, `unknownKeyCount` et son ordre total ; `NTILE(V, k)` en tranches de rang avec ex æquo vers le rang bas et `status: DEGRADED` ; paliers de puissance de 20 kW ; indice de dépréciation base `y_max` avec `annualLossPct` | APPLIQUÉ |

### Notes du lot 6

- `A-26` : la liste de travaux nomme quatre exigences, et le corps d'`ARB-04` en énumère **cinq**
  sous le même titre « Annexe A — CRÉER cinq exigences » — la cinquième étant `EX-DATA-102bis`,
  qui fait l'objet du travail distinct `A-32`. Aucune contradiction : `A-32` la crée à sa place
  logique, en § B.7. Signalé pour que le décompte ne soit pas lu comme un travail manquant.
- La section `B.5bis` porte un titre de section, non une exigence numérotée : elle n'introduit
  aucun identifiant `EX-DATA-*` supplémentaire au-delà des quatre créés.

## Lot 7 — `A-27` à `A-30`

| # | Décision | Exigence | Action faite | Statut |
|---|---|---|---|---|
| A-27 | `ARB-36` | `EX-DATA-86` | Paragraphe ajouté sous la table des cellules : année `INCONNU` → pas de cellule de rang 1, échelle de repli démarrant à `C₂` ; `C₁` ne contient jamais d'annonce d'année inconnue ; règle générale « `INCONNU` n'est jamais une clé d'agrégation » avec l'unique exception de `modelId = 0` | APPLIQUÉ |
| A-28 | `ARB-13` | `EX-DATA-87` | `implausibleInCellCount` ajouté aux valeurs publiées avec chaque verdict de cellule, avec son renvoi à `EX-DATA-19` | APPLIQUÉ |
| A-29 | `ARB-03` | `EX-DATA-93bis` | **CRÉÉE** immédiatement après `EX-DATA-93` : `R²` sur la passe 2, sur `F` complet et jamais `F'`, en échelle `y = ln(p)`, formule `1 − SCR/SCT` avec ses trois sommes explicitées, `R² = null` et verdict `INSUFFICIENT_SPREAD` si `SCT = 0`, arrondi 2 décimales selon `EX-DATA-6` | APPLIQUÉ |
| A-30 | `ARB-48` | `EX-DATA-98` | `firstRegistrationYear` remplacé par `firstRegistrationYearMonth` (l'année s'en dérive par division entière) ; ligne `priceEvaluationCategory` ajoutée ; justification chiffrée remplacée : 13 champs à ≈ 68 octets, ≈ 340 Ko pour 5 000 points, clause « aucun autre champ » maintenue et son amendement exigé pour un quatorzième champ | APPLIQUÉ |

### Notes du lot 7

- `A-29` est l'application directe de la règle d'autorité `A-09` : la définition de `R²`, qui
  vivait en libellé dans `EX-SCR-164`, est accueillie en annexe A. L'annexe B en est privée par
  `B-58`, traité par l'agent de l'annexe B.
- `A-30` : la liste de travaux mentionne « ≈ 340 Ko », valeur reprise mot pour mot du corps
  d'`ARB-48`. Le compte de champs de la table passe de 11 à 13 lignes de rôle ; le décompte est
  cohérent.

## Lot 8 — `A-31` à `A-35`

| # | Décision | Exigence | Action faite | Statut |
|---|---|---|---|---|
| A-31 | `ARB-31` | `EX-DATA-100bis` | **CRÉÉE** en § B.7, après `EX-DATA-101` et ses justifications : `SAMPLE(V, k, seed)`, retour de `V` entier si `|V| ≤ k`, ordre `listingId` octet à octet, générateur `xoshiro128**`, graine constante `0x4B594341` inscrite là et nulle part ailleurs, Fisher-Yates descendant, réordonnancement final par `listingId`, indépendance de la sélection / du snapshot / de l'horloge, test de déterminisme du lot D4 | APPLIQUÉ |
| A-32 | `ARB-04` | `EX-DATA-102bis` | **CRÉÉE** après `EX-DATA-102` : grille de `G7` sur les bins de `BIN` en prix (abscisse) et kilométrage (ordonnée), bins de débordement compris, cellule `{ priceBinIndex, mileageBinIndex, count }`, éligibilité conjointe au sens d'`EX-DATA-60`, ventilation `EX-DATA-99`, somme des `count` égale à l'effectif éligible, **aucune grille hexagonale** | APPLIQUÉ |
| A-33 | `ARB-40` | `EX-DATA-105` | Deux tables de champs créées sous l'inventaire des entités : `Make` (clé `makeId`) et `Model` (clé `(makeId, modelId)`), avec colonnes Type / Preuve / Si absent, `slug` dérivé `[EXTRAPOLÉ]` quand la source ne le fournit pas, `bodyTypes` en tableau vide et jamais `INCONNU`, `announcedCount`. Fonction `SLUG(s)` spécifiée en six étapes et testée sur cinq libellés. Clause « le `slug` n'est jamais utilisé pour résoudre une entité » | APPLIQUÉ |
| A-34 | `ARB-42` | `EX-DATA-108` | Phrase ajoutée : `selectionHash` publié sous la forme `<localDatasetKey>:<refineHash>` (`EX-SRCH-9quinquies`), sélection vide `FULL:EMPTY` | APPLIQUÉ |
| A-35 | `ARB-42` | `EX-DATA-109` | Ligne du cache LRU complétée : clefée par `(localDatasetKey, refineHash)` ; l'interdiction de précalculer une sélection filtrée ne porte pas sur le jeu de données local, dont la mise en cache est exigée par `EX-SRCH-9ter` | APPLIQUÉ |

### Notes du lot 8

- **Tension de rédaction signalée, `A-34`.** `EX-DATA-108` porte désormais deux phrases sur la
  sélection vide : la phrase d'origine (« la sélection vide a pour hachage la chaîne réservée
  `EMPTY` ») et celle qu'`ARB-42` prescrit mot pour mot (« la sélection vide a pour hachage
  `FULL:EMPTY` »). Les deux se lisent sans contradiction — `EMPTY` est le `refineHash` de la
  composante `R` vide, `FULL` la `localDatasetKey` de la composante `T` vide, et `FULL:EMPTY` est
  leur composition — mais la juxtaposition est redondante. Le texte de la décision a été inséré
  **tel quel**, sans retoucher la phrase d'origine, conformément à la consigne de ne pas
  reformuler une décision. **À décider** par le coordinateur : conserver les deux phrases ou
  fondre la première dans la seconde.
- `A-34` et `A-35` renvoient à `EX-SRCH-9ter` et `EX-SRCH-9quinquies`, exigences **créées par
  l'agent de l'annexe C** (`C-12`). Les renvois sont écrits tels que la décision les exige.

## Lot 9 — `A-36` à `A-39`

| # | Décision | Exigence | Action faite | Statut |
|---|---|---|---|---|
| A-36 | `ARB-39` | `EX-DATA-110`, `EX-DATA-110bis` | `EX-DATA-110` : ligne de budget « Facettes et sélections dérivées ≤ 90 ms » ajoutée à la table, total corrigé de **450 à 540 ms**, justification du budget global réécrite en conséquence. `EX-DATA-110bis` **CRÉÉE** : entité `FacetCount`, sémantique du *leave-one-out* par filtre entier (`EX-SCR-90`), balayage unique par masque de prédicats moins un et interdiction de relancer un balayage par filtre ou par valeur, `selectionHashWithoutTaxonomy` et `selectionHashWithoutFilter(filterId)`, poste de budget, `FacetCount` calculée et jamais persistée | APPLIQUÉ |
| A-37 | `ARB-55` | `EX-DATA-112` | Exigence entièrement remplacée : formule du tampon de prix `4 × (maxPriceObservé − minPriceObservé + 1)`, ≈ 4 Mo au cas observé et 20 Mo au pire cas, tampon km ≈ 6 Mo, tampon année 808 octets ; enveloppe pire cas détaillée avec le poste manquant de **172 Mo de zone de chaînes**, total ≈ **274 Mo**, marge de **facteur 1,9**, conclusion normative maintenue, raison normative du snapshot unique (`ARB-49`), poste dominant nommé | APPLIQUÉ |
| A-38 | `ARB-40` | `EX-DATA-114`, `EX-DATA-115` | Bloc « Index de la taxonomie » créé à la suite de la table d'index d'`EX-DATA-115` : index par `bodyTypes` sur les couples `(makeId, modelId)`, déclaré **condition** de la classe `R` du filtre primaire `Carrosserie` (`EX-SCR-59`, `EX-SCR-221`), un `Model` à `bodyTypes` vide n'apparaissant dans aucune entrée | APPLIQUÉ sur le fond — **anchor `EX-DATA-114` introuvable**, voir note |
| A-39 | `ARB-37` | `EX-DATA-123bis` | **CRÉÉE** après `EX-DATA-123` : encodage UTF-8 + BOM et point-virgule, `INCONNU` en cellule vide, virgule décimale sans séparateur de milliers, arrondis d'écran ; trois lignes de métadonnées ; jeux de colonnes des quatre périmètres (agrégats mode 1, buckets mode 2, points de nuée, annonces) ; gabarit de nom de fichier | APPLIQUÉ |

### Notes du lot 9

- **`A-38`, anchor partiellement introuvable.** La liste de travaux nomme `EX-DATA-114` **et**
  `EX-DATA-115`, et le corps d'`ARB-40` ne parle que d'`EX-DATA-114` (« ajouter `bodyTypes` à
  l'index de la taxonomie »). Or **`EX-DATA-114` est la table des clés primaires** et ne contient
  aucun index ; **`EX-DATA-115` est la table des index de la table `Listing`** et ne contient
  aucun index de taxonomie. **Aucun « index de la taxonomie » n'existait dans le document.** Le
  fond de la décision a donc été appliqué à l'endroit le moins arbitraire — § C.2 « Clés, index et
  ordres », à la suite d'`EX-DATA-115` —, sans toucher à la table des clés primaires
  d'`EX-DATA-114`, qu'une entrée d'index aurait dénaturée. **À décider** : soit ce bloc reçoit son
  propre identifiant (`EX-DATA-115bis`), soit il est explicitement rattaché à `EX-DATA-115`. En
  l'état il est rédigé comme un complément d'`EX-DATA-115`, sans identifiant propre — donc sans
  créer de trou de numérotation.
- **Propagations de cohérence interne faites au-delà de la lettre des travaux, et pourquoi.**
  `A-36` corrige le total de 450 à 540 ms et `A-37` l'enveloppe de 87 à 274 Mo. Ces deux chiffres
  étaient répétés ailleurs **dans la même annexe**, ce qui aurait laissé l'annexe A en
  contradiction avec elle-même :
  - `EX-DATA-116` (justification de l'élagage) : « le budget de 450 ms » → **540 ms**.
  - § C.5 Récapitulatif chiffré : « ≤ 450 ms » → **≤ 540 ms** ; « ≈ 87 Mo » → **≈ 274 Mo, pire
    cas, marge de facteur 1,9 sous 512 Mo**.
  Aucune décision nouvelle n'est prise ici : ce sont les mêmes grandeurs normatives, reportées.
- `A-39` : **contrôle R3 fait.** Les colonnes du périmètre « Annonces » comportent `type_vendeur`,
  `pays` et `region`. `type_vendeur` est `sellerType` (`P`/`D`), l'un des trois attributs vendeur
  **non identifiants** expressément retenus par `EX-DATA-42` au titre de H3 ; `region` est un code
  NUTS-2, granularité minimale autorisée par `EX-DATA-56`. **Aucun champ identifiant un vendeur
  n'est réintroduit** — pas de nom, pas d'identifiant de vendeur, pas de code postal exact, pas de
  coordonnées. Aucun blocage R3.
- `A-39`, placement : `EX-DATA-123bis` tombe numériquement à la fin du § C.4 « Ce que le modèle ne
  contient pas », dont le thème est l'exclusion. Le placement respecte l'ordre des identifiants,
  que le critère de non-trou impose ; aucune section nouvelle n'a été créée puisque la décision
  n'en demande pas.

---

# Vérifications de fin

| Contrôle | Méthode | Résultat |
|---|---|---|
| Chaque `EX-DATA-*` défini exactement une fois | `grep -oE '\*\*EX-DATA-[0-9]+(bis\|ter\|quater\|quinquies)?'` puis `sort \| uniq -d` | **aucun doublon** |
| Trous de numérotation | `diff` entre `seq 1 127` et les numéros de base relevés | **aucun trou** : `EX-DATA-1` … `EX-DATA-127` tous présents |
| Identifiants en `bis`/`ter`/`quater`/`quinquies` | énumération | **12**, tous attendus : `61bis`, `70bis`, `70ter`, `83bis`, `83ter`, `83quater`, `83quinquies`, `93bis`, `100bis`, `102bis`, `110bis`, `123bis` |
| Compte d'exigences | `sort -u \| wc -l` | **127 avant → 139 après**, soit **12 créées**, 0 supprimée |
| Renommage `SUSPECT_PRICE_FLOOR` | `grep -c` | **0 occurrence restante** (4 avant) |
| Formulations non mesurables | `grep -niE 'rapide\|intuitif\|moderne\|clair\|performant\|pertinent\|approprié\|significatif\|le cas échéant\|si nécessaire'` | **1 correspondance, faux positif assumé** — voir ci-dessous |
| Les 39 travaux ont une ligne de statut | `grep -oE '^\| A-[0-9]{2} '` | **39 / 39** |
| Périmètre d'édition | — | **un seul fichier modifié** : `docs/requirements/draft-data-dictionary.md`. Annexes B et C et `REQUIREMENTS.md` **non touchés** |

**Le faux positif de la recherche de non-mesurabilité.** La seule correspondance est
`en clair` dans la **justification** d'`EX-DATA-93bis` : « l'annexe B affiche `R²` **en clair** sous
le titre de `G8` ». C'est la locution « en clair » (= explicitement, en toutes lettres), non
l'adjectif de qualité « clair », et elle est reproduite **mot pour mot** du corps d'`ARB-03`. Elle
ne porte aucune obligation : la phrase est descriptive et sert à motiver le besoin de fixer la
passe, le dénominateur et l'échelle de `R²`. Aucune reformulation n'a été faite, la consigne étant
d'insérer le texte de l'arbitre sans le retoucher. Le reste du corpus reste exempt des neuf
formulations proscrites.

**Renvois sortants créés vers les autres annexes** (attendus, résolus par les agents `ANNEXE-B` et
`ANNEXE-C` et par le coordinateur) : `EX-SCR-5`, `EX-SCR-12`, `EX-SCR-27bis`, `EX-SCR-46`,
`EX-SCR-59`, `EX-SCR-90`, `EX-SCR-95`, `EX-SCR-119`, `EX-SCR-140`, `EX-SCR-149`, `EX-SCR-158`,
`EX-SCR-203`, `EX-SCR-221`, `EX-NAV-9`, `EX-NAV-20`, `EX-SRCH-9ter`, `EX-SRCH-9quinquies`,
`EX-CRUD-14`. Les trois qui n'existent pas encore à l'heure de cette application sont
`EX-SCR-27bis` (`B-01`), `EX-SRCH-9ter` et `EX-SRCH-9quinquies` (`C-12`) : elles sont créées par
les listes parallèles, et les renvois sont écrits tels que les décisions les exigent.

---

# Écarts constatés entre la liste de travaux et le corps des décisions

Aucun de ces points n'a été « deviné » : ils sont consignés ici pour arbitrage, et rien n'a été
inséré au-delà de ce que la liste des 39 travaux demande.

1. **`EX-DATA-106` (`Snapshot`) — trois champs demandés par le corps des décisions, absents de la
   liste des 39 travaux.** Le corps du rapport demande explicitement, en annexe A :
   - `ARB-01` → ajouter `announcedListingCount` (`listings.metadata.totalItems`, preuve `OBSERVÉ`,
     `INCONNU` si absent, jamais `0` ni substitué par `listingCount`) ;
   - `ARB-54` → ajouter `duplicateValueConflictCount` ;
   - `ARB-64` → ajouter `unknownCountByField: map<nom de champ, entier>`, source unique du
     troisième état du panneau `Diagnostic des données` (`EX-SCR-53`).
   **Aucun des trois n'a de ligne dans la liste `ANNEXE-A`**, et `ARB-64` n'y apparaît même pas
   comme décision. Ces trois champs **n'ont pas été ajoutés** : la consigne borne l'application aux
   39 travaux listés. **Conséquence à trancher** : en l'état, `EX-DATA-15` (modifiée par `A-09`)
   incrémente `duplicateValueConflictCount`, un champ que `EX-DATA-106` ne déclare pas. En
   revanche `announcedCount` **est** bien déclaré, aux niveaux marque et modèle, par `A-19` et
   `A-24` : seul son homologue de snapshot `announcedListingCount` manque, et `EX-DATA-61bis`
   (créée par `A-16`) n'en dépend pas — elle lit `announcedCount`.
   **Recommandation** : ouvrir un 40ᵉ travail `ANNEXE-A` pour `EX-DATA-106`, portant les trois
   champs. C'est le seul écart qui laisse le document incomplet au sens strict.
2. **`A-38` — l'anchor `EX-DATA-114` n'existe pas pour l'objet visé.** Détail en note du lot 9.
   Le fond est appliqué, l'emplacement est à ratifier.
3. **`A-14` — contradiction résiduelle avec la colonne Validation du champ 74 `countryCode`.**
   Détail en note du lot 3. À trancher.
4. **`A-34` — redondance de rédaction sur le hachage de la sélection vide.** Détail en note du
   lot 8. Sans conséquence normative, à nettoyer.
5. **`A-26` — la liste nomme quatre créations, le corps d'`ARB-04` en énumère cinq.** La cinquième
   est `EX-DATA-102bis`, qui a sa propre ligne (`A-32`). Aucun travail manquant.
6. **`ARB-13` — la liste des lieux de propagation donnée par la décision est plus large que le
   document.** `EX-DATA-16` et le motif `suspectValue` d'`EX-DATA-99` ne portaient aucune
   occurrence du code renommé. Détail en note du lot 1.

---

# Propagations de cohérence interne, hors lettre des travaux

Trois reports de chiffres ont été faits pour ne pas laisser l'annexe A en contradiction avec
elle-même après application. Aucun n'introduit de décision nouvelle : ce sont les mêmes grandeurs
normatives, déjà tranchées par `A-36` et `A-37`, répétées ailleurs dans le même document.

| Emplacement | Avant | Après | Cause |
|---|---|---|---|
| `EX-DATA-116`, justification de l'élagage | « le budget de 450 ms » | « le budget de 540 ms » | `A-36` |
| § C.5, Budget de recalcul complet de page | `≤ 450 ms` | `≤ 540 ms` | `A-36` |
| § C.5, Enveloppe mémoire | `≈ 87 Mo` | `≈ 274 Mo`, pire cas, marge de facteur 1,9 sous 512 Mo | `A-37` |
| § C.5, Exigences `EX-DATA-*` | `127` | `139` (127 + 12 créées) | créations `A-16`, `A-22`, `A-26`, `A-29`, `A-31`, `A-32`, `A-36`, `A-39` |

Le sommaire annonce « Partie B (B.0 à B.8) » : la section `B.5bis` créée par `A-26` s'insère entre
`B.5` et `B.6` et ne modifie donc pas cet intervalle. Aucune retouche du sommaire n'a été faite.
