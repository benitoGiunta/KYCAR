# applied-annexe-B — journal d'application de la liste `ANNEXE-B`

**Document édité** : `docs/requirements/draft-screens.md` (annexe B), et lui seul.
**Source des décisions** : `reports/REQ-STRESSTEST.md` § 4.2 (liste `ANNEXE-B`, 68 travaux) et
§ 2 (texte exact des décisions `ARB-*`).
**Contexte normatif** : `docs/requirements/ARBITRAGES-req-lead.md` (`R-A01`, `R-A05`, `R-A06`,
règle d'autorité `A-09`), `data/reference/filters-scope.json`.

**Règles suivies.** Aucune renumérotation. Toute création prend un identifiant neuf ou un suffixe
`bis`. Les créations sont insérées par **adjacence numérique** (`EX-SCR-27bis` après `EX-SCR-27`,
etc.) : la qualification « convention transverse » de l'arbitre décrit la **nature** de l'exigence,
non un emplacement dans la § 1, et l'insérer en § 1 aurait rompu l'ordre numérique du document.

**État initial** : 224 identifiants `EX-SCR-*` définis (`EX-SCR-1` à `EX-SCR-224`, sans trou,
sans suffixe `bis`).

| # | Décision | Exigence | Action | Statut |
|---|---|---|---|---|
| B-01 | `ARB-29` | `EX-SCR-27bis` | CRÉER | **APPLIQUÉ** — inséré après `EX-SCR-27`, texte de `ARB-29` mot pour mot |
| B-02 | `ARB-65` | `EX-SCR-72bis` | CRÉER | **APPLIQUÉ** — inséré après `EX-SCR-72` ; règle générative `type` → contrôle / `group` → emplacement, table de 12 lignes, seul écart `atype` |
| B-03 | `ARB-47` | `EX-SCR-158bis` | CRÉER | **APPLIQUÉ** — inséré après `EX-SCR-158` ; chaîne normative d'étiquetage de la base de comparaison |
| B-04 | `ARB-11` | `EX-SCR-38bis` | CRÉER | **APPLIQUÉ** — inséré après `EX-SCR-38` ; état `ET-URL-CORRIGEE`, rang entre `ET-TROP-RESULTATS` et `C3 couverture` |
| B-05 | `ARB-28` | `EX-SCR-124bis` | CRÉER | **APPLIQUÉ** — inséré après `EX-SCR-124` ; table unique des trois seuils de l'écran A |
| B-06 | `ARB-59` | `EX-SCR-113bis` | CRÉER | **APPLIQUÉ** — inséré après `EX-SCR-113` ; écran B en mode « Modèle non identifié » |
| B-07 | `ARB-44` | `EX-SCR-214bis` | CRÉER | **APPLIQUÉ** — inséré après `EX-SCR-214` ; écran F `Modèles suivis`, route `/suivis`, six états par identifiant, plafond de 30 d'`EX-CRUD-10` en en-tête |
| B-08 | `ARB-21` | `EX-SCR-3` | MODIFIER | **APPLIQUÉ** — arrondi `EX-DATA-6`, `Math.floor` et toute troncature vers le bas interdits |
| B-09 | `ARB-19`, `ARB-23` | `EX-SCR-4` | MODIFIER | **APPLIQUÉ** — `min === max` testé après arrondi de présentation ; le format ne choisit pas ses bornes (`displayRange` écran A, `rawRange` écrans B et D) |
| B-10 | `ARB-22`, `ARB-23` | `EX-SCR-5` | MODIFIER | **APPLIQUÉ** — bornes de fourchette plancher-plafond avec l'exemple `10 000 – 210 100 km` ; `min === max` après arrondi |
| B-11 | `ARB-23` | `EX-SCR-6` | MODIFIER | **APPLIQUÉ** — `min === max` après arrondi de présentation |
| B-12 | `ARB-26` | `EX-SCR-11` | MODIFIER | **APPLIQUÉ** — départage du plus grand reste (effectif brut, puis libellé `EX-DATA-70bis`) ; substitutions typographiques appliquées en dernier |
| B-13 | `ARB-20` | `EX-SCR-12` | MODIFIER | **APPLIQUÉ** — `P5`/`P95` entrent dans la liste normative, `P10`/`P90` en sortent avec la phrase d'exclusion |
| B-14 | `ARB-24` | `EX-SCR-13` | MODIFIER | **APPLIQUÉ** — budgets en groupes de graphèmes étendus, aucune coupe intra-graphème |
| B-15 | `ARB-07` | `EX-SCR-16` | MODIFIER | **APPLIQUÉ** — rapport sur les bins fermés seuls ; bascule absente du DOM sous deux bins fermés non vides |
| B-16 | `ARB-05`, `ARB-08` | `EX-SCR-18` | MODIFIER | **APPLIQUÉ** — bornes d'histogramme déléguées à `BIN` ; `Q(V,0,01)`/`Q(V,0,99)` pour `G4`, `G7`, `G10` ; étiquettes de débordement renvoyées à `EX-DATA-79`, formes `< <borne>` / `> <borne>` supprimées |
| B-17 | `ARB-44` | `EX-SCR-23`, `EX-SCR-29` | MODIFIER | **APPLIQUÉ** — le bouton `Exporter` désactivé est celui de la barre de synthèse de l'écran A (`EX-SCR-107`) |
| B-18 | `ARB-57` | `EX-SCR-25` | MODIFIER | **APPLIQUÉ** — interdiction d'indicateur limitée au recalcul unique ; mode groupé `EX-SRCH-1bis` → `ET-CHARGE-MAJ` |
| B-19 | `ARB-29` | `EX-SCR-27` | MODIFIER | **APPLIQUÉ** — `ET-VIDE-SANS-FILTRE` référencé par nom d'état (`EX-SCR-27bis`), traité comme panne |
| B-20 | `ARB-01` | `EX-SCR-31` | MODIFIER | **APPLIQUÉ** — bandeau `C3` réécrit : trois cas (`sampleCoverage` publiable, `announcedCount` `INCONNU`, sous filtre), aucun 100 % fabriqué, `listingCount`/`announcedCount` au lieu de `n_obs`/`n_tot` |
| B-21 | `ARB-28`, `ARB-31` | `EX-SCR-32` | MODIFIER | **APPLIQUÉ** — seuil de 40 marques et mention « 20 affichées » retirés (renvoi à `EX-SCR-124bis`), échantillon renvoyé à `SAMPLE(V, 20 000, seed)`, compteur d'outliers sur la population entière |
| B-22 | `ARB-17`, `ARB-20` | `EX-SCR-33` | MODIFIER | **APPLIQUÉ** — `n = n_m(Σ)` explicite, quatre paliers (0 / 1-4 / 5-11 / 12-29 / ≥ 30), `P5`/`P95`, tailles de test 0…30 |
| B-23 | `ARB-15` | `EX-SCR-36` | MODIFIER | **APPLIQUÉ** — seuil unique 250 €, `PRICE_SENTINEL_ABSOLUTE`, exclusion des statistiques et comptage dans l'effectif ; seuil de 100 € et phrase « Il reste dans l'agrégat » supprimés |
| B-24 | `ARB-42` | `EX-SCR-37` | MODIFIER | **APPLIQUÉ** — hors ligne, jeu local = dernière `localDatasetKey` servie (`EX-SRCH-9bis`) |
| B-25 | `ARB-32` | `EX-SCR-38` | MODIFIER | **APPLIQUÉ** — exception de `C3` non refermable hors plafond, 144 px, repliabilité bandeau par bandeau, ordre de priorité incluant `ET-URL-CORRIGEE` |
| B-26 | `ARB-44` | `EX-SCR-42` | MODIFIER | **APPLIQUÉ** — quatre onglets `Marché`, `Comparer (n)`, `Recherches`, `Suivis (n)` |
| B-27 | `ARB-52` | `EX-SCR-45` | MODIFIER | **APPLIQUÉ** — table des segments de fil d'Ariane par route (6 lignes) + hauteur fixe et troncature `EX-SCR-13` |
| B-28 | `ARB-39` | `EX-SCR-46` | MODIFIER | **APPLIQUÉ** — compteur `<n> offres` sur `selectionHashWithoutTaxonomy` (`EX-DATA-110bis`) avec son infobulle |
| B-29 | `ARB-44` | `EX-SCR-47` | MODIFIER | **APPLIQUÉ** — `Mentions` ouvre la page statique `/mentions`, hors inventaire des écrans fonctionnels |
| B-30 | `ARB-41` | `EX-SCR-50` | MODIFIER | **APPLIQUÉ** — brossage encodé par `selx`/`sely` (bornes d'axe), jamais par empreinte |
| B-31 | `ARB-64`, `ARB-54` | `EX-SCR-53` | MODIFIER | **APPLIQUÉ** — source unique du taux de vide (`unknownCountByField`), affichage de `duplicateValueConflictCount` |
| B-32 | `ARB-02` | `EX-SCR-55` | MODIFIER | **APPLIQUÉ** — maquette : `[+ 92]` remplacé par `[3 filtres actifs]` ; largeur du cadre ASCII maintenue à 92 colonnes (padding illustratif ajusté) |
| B-33 | `ARB-40` | `EX-SCR-59`, `EX-SCR-221` | MODIFIER | **APPLIQUÉ** — classe `R` de `Carrosserie` justifiée par `Model.bodyTypes` (`EX-DATA-105`), `bodyTypes` vide → aucun prédicat `body`, note `EX-SCR-178` |
| B-34 | `ARB-65` | `EX-SCR-64`, `EX-SCR-71` | MODIFIER | **APPLIQUÉ** — `adage` retiré du `Concerne` d'`EX-SCR-64`, `cid` de celui d'`EX-SCR-71` ; mention « classe X (R3) » supprimée |
| B-35 | `ARB-53`, `ARB-65` | `EX-SCR-67` | MODIFIER | **APPLIQUÉ** — « les 24 couples » remplacé par l'énumération nominative des **12** couples `range_min`/`range_max` de `filters-scope.json` ; contrôle à borne unique pour `lsyeinmifrom` |
| B-36 | `ARB-10`, `ARB-11` | `EX-SCR-68` | MODIFIER | **APPLIQUÉ** — portée limitée à la saisie interactive ; écrêtage à l'arrivée par URL signalé par `ET-URL-CORRIGEE` |
| B-37 | `ARB-33`, `ARB-35` | `EX-SCR-73` | MODIFIER | **APPLIQUÉ** — prédicat `powerfrom`/`powerto` sur le champ canonique (`EX-SRCH-11bis`) ; les codes `2`/`3` n'activent qu'un contrôle enfant et ne définissent aucun prédicat |
| B-38 | `ARB-30` | `EX-SCR-77` | MODIFIER | **APPLIQUÉ** — `Tout effacer` retire tout prédicat utilisateur ; `atype`/`ustate`/`powertype`/`pricetype`/`cy` ne sont pas des filtres (`EX-SRCH-18bis`) |
| B-39 | `ARB-02` | `EX-SCR-82` | MODIFIER | **APPLIQUÉ** — table réécrite en table d'exposition : colonnes `perimetre` (recopiée de `filters-scope.json`) et `exposition` ; classe `X` supprimée des 101 lignes ; contrainte `RETENU ⇒ exposition ≠ NON_EXPOSE` sauf `atype`. Décompte obtenu : 77 `RETENU` (13 `PRIMAIRE`, 60 `SECONDAIRE`, 3 `DESACTIVE`, 1 `NON_EXPOSE`) et 24 `EXCLU`. **Réserve consignée** : `ARB-02` nomme cinq filtres précédemment `X` (`atype`, `cat`, `mcat`, `page`, `size`) alors que la table en portait **huit** qui sont `RETENU` dans `filters-scope.json` — `tradeIn`, `lat`, `lon` en plus ; ces trois-là ont été traités par la règle générative d'`EX-SCR-72bis` (`SECONDAIRE`, groupe issu du champ `group`), sans jugement. La colonne `Classe` (R/T/D) des lignes anciennement `X` n'est fixée par aucune décision : elle est portée à `T` par application directe de la définition d'`EX-SCR-57` (aucun champ local), et la phrase de dérivation est inscrite dans l'exigence |
| B-40 | `ARB-02`, `ARB-53`, `ARB-65` | `EX-SCR-83` | MODIFIER | **APPLIQUÉ** — bilan 77 / 76 / 1 / 24 ; test de complétude sur les deux colonnes et sur l'unicité du type de contrôle |
| B-41 | `ARB-35` | `EX-SCR-84` | MODIFIER | **APPLIQUÉ** — égalité stricte de `fuelCategory`, dix cases indépendantes, texte d'aide hybrides |
| B-42 | `ARB-02` | `EX-SCR-91` | MODIFIER | **APPLIQUÉ** — le badge compte les filtres **actifs**, format `<k> filtres actifs`, absent du DOM à `k = 0` |
| B-43 | `ARB-15` | `EX-SCR-95` | MODIFIER | **APPLIQUÉ** — deux réglages requalifiés (jamais des filtres), libellés normatifs, seuil 250 €, hors badge de filtres actifs |
| B-44 | `ARB-19` | `EX-SCR-109` | MODIFIER | **APPLIQUÉ** — bornes neutres, `displayRange` + suffixe `(90 % des offres)`, `rawRange` en libellé secondaire `du moins cher au plus cher` ; l'étiquette littérale « prix min – prix max » disparaît du gabarit |
| B-45 | `ARB-43` | `EX-SCR-111` | **SUPPRIMER** | **APPLIQUÉ** — contenu normatif supprimé, entrée conservée en pierre tombale portant le motif exigé par `ARB-43` (« reporter le motif »). Aucune renumérotation ; l'identifiant n'est pas réattribué, il est cité par `ST-complete.md` et par la matrice de traçabilité |
| B-46 | `ARB-19`, `ARB-59` | `EX-SCR-113` | MODIFIER | **APPLIQUÉ** — élément 4 réécrit (`displayRange` + suffixe, `rawRange` en infobulle, bande à 72 px) ; zone-modèle `modelId = 0` cliquable vers `EX-SCR-113bis` |
| B-47 | `ARB-01` | `EX-SCR-115`, `EX-SCR-116` | MODIFIER | **APPLIQUÉ** — indicateur piloté par `sampleCoverage` seul, tiret cadratin si `null`/`NON_APPLICABLE` ; cas requalifié `listingCount = 0 ∧ announcedCount > 0` |
| B-48 | `ARB-43` | `EX-SCR-118`, `EX-SCR-194`, `EX-SCR-197` | MODIFIER | **APPLIQUÉ** — plafond unique de 4 (`EX-CRUD-13bis`), contrôles d'ajout désactivés, mention « surnuméraires ignorés » supprimée d'`EX-SCR-194`, écrêtage d'URL signalé par `ET-URL-CORRIGEE` |
| B-49 | `ARB-25` | `EX-SCR-119`, `EX-SCR-120`, `EX-SCR-121` | MODIFIER | **APPLIQUÉ** — `Intl.Collator` remplacé par `EX-DATA-70bis`/`70ter` ; quatre ordres totaux ; clé primaire `null` en fin d'ordre ; `modelId = 0` en dernier dans `EX-SCR-121` |
| B-50 | `ARB-29` | `EX-SCR-126` | MODIFIER | **APPLIQUÉ** — énumération de paramètres remplacée par le renvoi à l'état `SANS-FILTRE` |
| B-51 | `ARB-28` | `EX-SCR-127` | MODIFIER | **APPLIQUÉ** — la virtualisation ne plafonne que les cartes montées dans le DOM |
| B-52 | `ARB-19`, `ARB-44` | `EX-SCR-142` | MODIFIER | **APPLIQUÉ** — cinquième donnée `min – max` (`rawRange.price`, étiquette `du moins cher au plus cher`, jamais masquée) ; quatrième bouton `Suivre` / `Ne plus suivre` |
| B-53 | `ARB-05` | `EX-SCR-145`, `EX-SCR-146`, `EX-SCR-147` | MODIFIER | **APPLIQUÉ** — délégation intégrale à `BIN` ; Freedman-Diaconis, multiples de 500 €/5 000 km, plafonds de buckets et regroupement « avant `<AAAA>` » supprimés ; étiquettes de débordement renvoyées à `EX-DATA-79` |
| B-54 | `ARB-09`, `ARB-04` | `EX-SCR-149` | MODIFIER | **APPLIQUÉ** — clic posant `hi − u` (plus brossage et `Ctrl` + clic), test d'égalité d'effectif ; prix médian du bucket issu de `GROUPSTAT` |
| B-55 | `ARB-17` | `EX-SCR-150` | MODIFIER | **APPLIQUÉ** — `n` qualifié par sa métrique (`n_price`, `n_mileage`, `n_year`) ; la propagation nominative d'`ARB-17` a été appliquée dans le même mouvement à `EX-SCR-164`, `EX-SCR-165` et `EX-SCR-166`, que l'`ARB-17` cite expressément et que B-57/B-58 rouvraient déjà |
| B-56 | `ARB-47` | `EX-SCR-158` | MODIFIER | **APPLIQUÉ** — infobulle de point de `G4` portée de 5 à 6 lignes, la sixième étant la chaîne d'`EX-SCR-158bis` |
| B-57 | `ARB-04` | `EX-SCR-161` à `EX-SCR-170` | MODIFIER | **APPLIQUÉ** — un renvoi par graphe : `G5`/`G9`/`G12`/`G13`/`G15` → `GROUPSTAT` (clés `bucket d'année`, `fuelCategory`, `priceEvaluationCategory`, `sellerType`, `countryCode`), `G6` → `EX-DATA-83quinquies` + base au titre, `G7` → `EX-DATA-102bis` et retrait de **toute** mention de grille hexagonale, `G10` → `NTILE(V_mileage(Σ), 5)` avec bornes observées et indice de tranche, `G14` → `EX-DATA-83quater` |
| B-58 | `ARB-03`, `ARB-18`, `ARB-27` | `EX-SCR-164` | MODIFIER | **APPLIQUÉ** — formule `prix ~ année + ln(km)` supprimée et remplacée par le renvoi à M2 (`EX-DATA-90` à `EX-DATA-93`) + libellé normatif mot pour mot ; mention de méthode (M1/M2) et bandeau de franchissement de seuil ; ordre par `opportunityScore` décroissant avec départage. Aucune formule de remplacement inventée (`A-09`) |
| B-59 | `ARB-12` | `EX-SCR-176` | MODIFIER | **BLOQUÉ** — **ancre incohérente**. `ARB-12` demande d'inscrire dans `EX-SCR-176` que « le jeton d'un filtre actif affiche toujours son libellé et sa valeur ». Or `EX-SCR-176` de `draft-screens.md` porte « Recalcul partiel interdit » (empreinte de filtres par graphe, écran B) et n'a aucun rapport avec les jetons de filtre actif. L'exigence qui porte le jeton est **`EX-SCR-75`** (ligne des filtres actifs, format des jetons). Insérer la règle dans `EX-SCR-176` écraserait une exigence sans lien. **Décision requise** : re-cibler l'édition d'`ARB-12` sur `EX-SCR-75` (ou nommer l'exigence porteuse). Le même identifiant erroné figure dans l'édition d'annexe C d'`ARB-12` (`EX-NAV-18` renvoie à `EX-SCR-176`) : la correction concerne aussi l'agent `fix-annexe-C` et le coordinateur. **Aucune édition faite.** Note factuelle : le format des jetons d'`EX-SCR-75` affiche déjà la valeur dans les six formes énumérées, sauf la forme « ≥ 3 valeurs » qui affiche `Carburant : 4 valeurs` (nom + cardinal, valeurs en infobulle) |
| B-60 | `ARB-37` | `EX-SCR-187` | MODIFIER | **APPLIQUÉ** — l'exigence ne décrit plus que l'emplacement et l'état du bouton ; entrées, libellés et périmètre renvoyés à `EX-CRUD-16`, colonnes et en-tête à `EX-DATA-123bis` ; l'entrée `PNG` disparaît de l'annexe B |
| B-61 | `ARB-34` | `EX-SCR-184`, `EX-SCR-202` | MODIFIER | **APPLIQUÉ** — `sel` requalifié en restriction d'affichage avec l'en-tête `<n> lignes affichées sur <N>` ; bouton `Convertir la sélection en filtre` seul chemin changeant `Σ` ; `sel=<empreinte>` remplacé par `sel=<lo>-<hi>` |
| B-62 | `ARB-06` | `EX-SCR-195`, `EX-SCR-200` | MODIFIER | **APPLIQUÉ** — bornes communes = `BIN` sur l'union des échantillons valides ; seuil `n_m < 12`, repli `échelles indépendantes` ; colonne exclue du calcul mais rendue |
| B-63 | `ARB-51` | `EX-SCR-200`, `EX-SCR-214` | MODIFIER | **APPLIQUÉ** — six états par identifiant sur les écrans C et E, les états sans objet **déclarés** avec leur motif |
| B-64 | `ARB-03`, `ARB-18`, `ARB-25`, `ARB-47`, `ARB-54` | `EX-SCR-203` | MODIFIER | **APPLIQUÉ** — colonne « Écart au prix attendu » renvoyée à M2 sans formule, mention de méthode, ordre total `EX-DATA-70ter`, étiquetage de cellule en infobulle de colonne, jeton `!` de `DUPLICATE_VALUE_CONFLICT`, rendu textuel des champs `*Raw` |
| B-65 | `ARB-27` | `EX-SCR-206`, `EX-SCR-207` | MODIFIER | **APPLIQUÉ** — ordre par défaut `opportunityScore` décroissant avec départage et bascule `null` ; `P10 des écarts` défini (décile inférieur de `δ`, `EX-DATA-62`) et localisé (tout le périmètre de l'écran D, jamais les 20 lignes de `G8`), exprimé en pourcentage. L'édition d'`ARB-47` sur `EX-SCR-207` (chaîne d'étiquetage en infobulle de ligne), que la liste des 68 n'attribue à aucun travail nommé, a été portée ici puisque l'exigence était déjà ouverte |
| B-66 | `ARB-44` | `EX-SCR-212` | MODIFIER | **APPLIQUÉ** — panneau latéral `Recherches récentes`, 10 entrées FIFO d'`EX-CRUD-11`, action unique `Vider l'historique`, aucune suppression unitaire |
| B-67 | `ARB-45` | `EX-SCR-213` | MODIFIER | **APPLIQUÉ** — écart affiché sous condition `snapshotInitial ≠ snapshotId courant` et effectif calculable, jamais `0` ni `+ 0`, jamais un pourcentage |
| B-68 | `ARB-46`, `ARB-43`, `ARB-25` | `EX-SCR-216` | MODIFIER | **APPLIQUÉ** — six états par identifiant (dont deux « sans objet, motif : … »), recherche sans correspondance, règle de `Appliquer`, piège de focus et ordre de tabulation, plafond de 4 remplaçant les « 12 couples », départage unique `EX-DATA-70ter` |

---

## Bilan

| Grandeur | Valeur |
|---|---:|
| Travaux de la liste `ANNEXE-B` | 68 |
| **APPLIQUÉ** | **67** |
| **BLOQUÉ** | **1** (`B-59`) |
| Exigences `EX-SCR-*` définies avant | 224 |
| Exigences `EX-SCR-*` définies après | 231 |
| Créations | 7 (`EX-SCR-27bis`, `38bis`, `72bis`, `113bis`, `124bis`, `158bis`, `214bis`) |
| Suppressions | 1 (`EX-SCR-111`, contenu normatif supprimé, identifiant conservé en pierre tombale avec son motif) |
| Renumérotations | **0** |

## Vérifications de fin

1. **Unicité des identifiants** — 231 définitions au motif `^\`EX-SCR-<id>\` — `, **231
   identifiants distincts** : chaque identifiant est défini exactement une fois. Les occurrences
   d'identifiant en début de ligne sans tiret cadratin sont des références en retour à la ligne,
   pas des définitions (contrôlées une par une).
2. **Non-renumérotation** — `EX-SCR-1` à `EX-SCR-224` sont **tous** présents après application,
   sans trou, y compris `EX-SCR-111` (entrée de suppression). Aucun identifiant n'a changé de
   porteur.
3. **Formulations non mesurables** — recherche de `rapide`, `intuitif`, `moderne`, `clair`,
   `performant`, `ergonomique`, `pertinent`, `approprié`, `significatif`, `le cas échéant`,
   `si nécessaire` : deux occurrences seulement, **toutes deux préexistantes et hors barème** —
   « sur fond clair comme sur fond sombre » (`EX-SCR-…`, contraste de jeton) et la ligne de la
   matrice § 9 qui **énumère** ces mots comme critère de revue lexicale. Une occurrence a été
   **retirée** en cours de route : « Densité non pertinente en dessous de 40 offres » est devenue
   « Densité non calculable en dessous de 40 offres » (`EX-SCR-163`).
4. **Formules retirées là où un renvoi était demandé** — plus aucune occurrence de
   `régression robuste`, `prix ~ année`, `Freedman`, `quintiles observés`, `Intl.Collator`,
   `P1 et P99`, `24 couples`, `SUSPECT_PRICE_FLOOR`, `hexagonal` (hors la phrase d'interdiction),
   `12 couples` (hors la phrase de suppression), `surnuméraires ignorés`. `Math.floor` ne
   subsiste que dans sa propre interdiction (`EX-SCR-3`). La seule expression de forme
   fonctionnelle restante est le **libellé d'affichage** que `ARB-03` impose mot pour mot dans
   `EX-SCR-164`.
5. **Périmètre d'édition** — seuls `docs/requirements/draft-screens.md` et le présent journal ont
   été écrits.

## Propagations faites au-delà des identifiants nommés, et leur motif

Trois éditions portent sur des identifiants que la liste des 68 ne nomme pas, mais qu'une
décision appliquée rendait faux :

1. `EX-SCR-48` — « les trois onglets » devient « les quatre onglets d'`EX-SCR-42` » : `B-26`
   (`ARB-44`) porte l'en-tête à quatre onglets, et l'exigence responsive en comptait trois.
2. `EX-SCR-181` (responsive de l'écran B) — « une grille hexagonale de moins de 320 px » devient
   « la grille d'`EX-DATA-102bis` » : `ARB-04` demande de supprimer **toute** mention de grille
   hexagonale pour `G7`.
3. `EX-SCR-210` (états de l'écran D) — le libellé `C3` passe de `<n_obs>` / `<n_tot>` à
   `<listingCount>` / `<announcedCount>` : substitution de noms de champs imposée par `ARB-01`,
   sans changement de sens.

## Résidus signalés, non édités

- `EX-SCR-157` et `EX-SCR-177` mentionnent encore « échantillonnage à graine fixée » et
  « 20 000 points » sans renvoi à `SAMPLE(V, k, seed)`. `ARB-31` n'a porté son renvoi que sur
  `EX-SCR-32` et ces formulations ne contredisent pas `EX-DATA-100bis` (la graine y est bien
  constante) : aucune édition faite, mention laissée au coordinateur.
- `EX-SCR-26` (`ET-VIDE-FILTRES`, « les 3 filtres les plus restrictifs ») reçoit une édition
  dans le texte d'`ARB-39` (§ 2.2) mais **aucun travail de la liste `ANNEXE-B` ne la porte** :
  la liste ne rattache `ARB-39` qu'à `EX-SCR-46` (`B-28`). Édition non faite, faute de mandat.
- **Mot « couverture » employé nu.** `EX-DATA-61bis` (créé par `ARB-01` en annexe A) interdit le
  mot « couverture » sans qualificatif dans les quatre documents normatifs. Les trois éditions
  d'annexe B qu'`ARB-01` prescrit (`EX-SCR-31`, `EX-SCR-115`, `EX-SCR-116`) sont faites, mais
  `draft-screens.md` porte encore une dizaine d'emplois nus hors de ces trois exigences —
  « bandeau de couverture », « taux de couverture du snapshot », « couverture ≥ 60 % »,
  « la couverture est < 100 % », l'état `ET-PARTIEL-COUVERTURE`, et le nom du composant
  `C3 couverture` que `ARB-32` emploie lui-même. Aucun travail de la liste `ANNEXE-B` ne mandate
  ce renommage transverse, et le renommer par jugement aurait touché un nom d'état et un nom de
  composant cités par d'autres annexes. **Aucune édition faite** ; point remonté au
  coordinateur, qui doit dire si l'interdiction du mot nu vaut aussi pour les **noms propres**
  d'états et de composants (`ET-PARTIEL-COUVERTURE`, `C3 couverture`).
