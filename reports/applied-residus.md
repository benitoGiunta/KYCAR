# applied-residus.md — Journal d'application des résidus (phase 2.2, `fix-residus`)

Cible : solder `RES-1` à `RES-11` (section « Résidus à solder avant le gel v1.0 » de
`docs/EXECUTION-LOG.md`), et effectuer la vérification systématique `RES-9` sur les 65 décisions
`ARB-01` à `ARB-65` de `reports/REQ-STRESSTEST.md`.

Fichiers édités : `docs/requirements/draft-data-dictionary.md` (A), `docs/requirements/draft-screens.md`
(B), `docs/requirements/draft-behaviour.md` (C). `REQUIREMENTS.md` et `ARBITRAGES-req-lead.md` non
touchés, conformément à la consigne.

Convention de statut : `APPLIQUÉ` / `BLOQUÉ` (+ motif et décision requise).

---

## Lot 1 — Annexe A : RES-1, RES-2, RES-3

| Résidu | Fichier | Action faite | Statut |
|---|---|---|---|
| RES-1 | draft-data-dictionary.md | Le complément « Index de la taxonomie » (§ C.2, après `EX-DATA-115`) reçoit l'identifiant propre **`EX-DATA-115bis`**. Aucune autre référence au bloc n'existait ailleurs dans le corpus (vérifié par grep), donc aucune propagation nécessaire. | APPLIQUÉ |
| RES-2 | draft-data-dictionary.md | Champ 74 `countryCode` : colonne Validation complétée d'une exception nommée — un code marketplace absent de la table de traduction (9ᵉ valeur de `KYCAR_MARKETPLACE`, `EX-DATA-40`) ne rejette plus l'annonce : `INCONNU` + `MARKETPLACE_UNMAPPED`. Colonne « Si absent » alignée en conséquence. Le repli d'`EX-DATA-40` ne vaut donc que pour un **code marketplace non traduit**, pas pour un `countryCode` ISO invalide (qui reste REJET) — c'est la première branche de l'alternative proposée par le résidu. | APPLIQUÉ |
| RES-3 | draft-data-dictionary.md | `EX-DATA-108` : les deux phrases redondantes sur la sélection vide (« `EMPTY` » puis « `FULL:EMPTY` ») fusionnées en une seule formulation : `refineHash` est défini comme le hachage de la composante `R` par la même règle de canonisation, `EMPTY` en étant la valeur vide ; la sélection globalement vide a pour hachage `FULL:EMPTY`. Aucune perte de sens : `EMPTY` reste nommé comme composant du couple. | APPLIQUÉ |

## Lot 2 — Annexe B : RES-10 (partiel), RES-11, et correctif `ARB-39`/`EX-SCR-26` (RES-9)

| Résidu | Fichier | Action faite | Statut |
|---|---|---|---|
| RES-10 | draft-screens.md | `EX-SCR-75` (ligne des filtres actifs) reçoit la règle normative d'`ARB-12`/`R-A10` : le jeton affiche toujours libellé + valeur, **sauf au-delà de 2 valeurs** où il affiche libellé + cardinal, valeurs en infobulle (forme déjà existante, désormais nommée comme exception normative). Le volet « annexe C » de ce résidu (`EX-NAV-18`) est traité au lot 3. | APPLIQUÉ (volet B) |
| RES-11 | draft-screens.md | Ligne de désambiguïsation ajoutée à la définition de chacun des deux identifiants contenant « couverture » : `EX-SCR-30` (`ET-PARTIEL-COUVERTURE`) et `EX-SCR-31` (`C3`, alias `C3 couverture`) désignent tous deux **la couverture d'échantillon** (`sampleCoverage`), jamais la couverture métrique ni la part de prix fermes. Recherche exhaustive faite : ce sont les **deux seuls** identifiants/noms de composants contenant « couverture » dans les trois annexes (voir Vérifications de fin). Annexe A et annexe C ne définissent aucun identifiant de ce type (A cite `EX-DATA-61bis` qui nomme les trois grandeurs mais n'est pas elle-même un identifiant « couverture » ; C ne contient aucune occurrence du mot). | APPLIQUÉ |
| (RES-9) | draft-screens.md | Prescription manquante d'`ARB-39` sur `EX-SCR-26` (`ET-VIDE-FILTRES`) : réécrite pour citer formellement `FacetCount`/`selectionHashWithoutFilter(filterId)` (`EX-DATA-110bis`) et le format normatif `retirer « <libellé> » : <k> offres de plus`, avec le cas des filtres de classe T sans chiffre. Voir table dédiée `RES-9` en fin de journal. | APPLIQUÉ |

---

## Lot 3 — Annexe C : RES-10 (volet C), RES-6, RES-7

| Résidu | Fichier | Action faite | Statut |
|---|---|---|---|
| RES-10 | draft-behaviour.md | `EX-NAV-18` : la référence `EX-SCR-176` (sans rapport avec les jetons) corrigée en `EX-SCR-75`, avec la mention explicite du re-ciblage par `R-A10`. | APPLIQUÉ (volet C, clôt le résidu) |
| RES-6 | draft-behaviour.md | `EX-CRUD-7` et `EX-CRUD-11` : la route héritée `/modele/:makeId/:modelId` (et `/`) remplacée par la route canonique de l'écran B `/marche/:makeId-:makeSlug/:modelId-:modelSlug` (`EX-NAV-2`) et `/marche` (`EX-NAV-1`). La route legacy reste valide en lecture seule (`C-01`) mais n'est plus celle que le CRUD cite comme cible. | APPLIQUÉ |
| RES-7 | draft-behaviour.md | `EX-NAV-5` : renvoi « voir tableau §A.2.2 » corrigé en « §A.2.2, renvoi normatif à `data/reference/filters-scope.json` », cohérent avec la suppression de la table (`ARB-02`/`C-02`). | APPLIQUÉ |

## Lot 4 — Annexe C : RES-4, RES-5, RES-8

| Résidu | Fichier | Action faite | Statut |
|---|---|---|---|
| RES-4 | draft-behaviour.md | Table des candidats CRUD (§ C, avant § C.1) : ligne « Comparaison de plusieurs modèles » reclassée `Écarté` → **`Retenu`**, motif mis à jour (écran C dédié, `EX-CRUD-13bis`, route `/comparer`). § C.8 « Entités écartées » : le paragraphe correspondant réécrit pour dire la reclassification et renvoyer à § C.3bis (l'entité `CompareSelection`), motif historique de l'écart conservé pour mémoire. | APPLIQUÉ |
| RES-5 | draft-behaviour.md | `EX-SRCH-23` réécrit : la sous-vue liste d'annonces **existe** (`A-02`, non conditionnel), référence stale « §A.2.2, filtres 77-80 » supprimée, `size` explicitement rattaché à `filters-scope.json` sans invention de chiffre. `EX-SRCH-24` : suppression de la clause « en l'absence de sous-vue liste » (n'a jamais été une vraie condition, le tri des cartes-marques du mode 1 est indépendant). `EX-NAV-14`, puce pagination : « filtre 79 conditionnel » remplacé par un renvoi à `EX-NAV-2bis`/`EX-SRCH-23` avec mention que ce n'est plus conditionnel. | APPLIQUÉ |
| RES-8 | draft-behaviour.md | Table des candidats CRUD : « navigation rapide entre analyses répétées » (non mesurable) reformulée en « accès direct à un modèle sans reposer les mêmes filtres à chaque visite » — motif fonctionnel vérifiable, sans chiffre inventé. | APPLIQUÉ |

**Bilan intermédiaire : 10 / 11 résidus soldés** (`RES-1` à `RES-8`, `RES-10`, `RES-11`). Reste `RES-9`
(vérification systématique), traité ci-dessous en lot dédié.

---

## Lot 5 — `RES-9`, vérification systématique des 65 décisions `ARB-01` à `ARB-65`

**Méthode.** Pour chacune des 65 décisions de `reports/REQ-STRESSTEST.md` § 2, relevé de chaque
prescription d'édition portée par son **corps** (pas seulement par les listes de travaux § 4.1/4.2/4.3),
puis vérification dans l'annexe visée que le texte est présent. Croisement avec les trois journaux
`applied-annexe-A/B/C.md` (qui documentent déjà 131 travaux nommés) pour isoler les prescriptions
**non couvertes par un travail nommé** — c'est le mode de défaillance déjà repéré par `RES-9`. Pour
chaque décision à prescriptions multiples, vérification de **chaque** exigence citée, y compris les
clauses de « propagation » qui sont le point de défaillance historique (`ARB-13`, `ARB-17`, `ARB-25`,
`ARB-04`, etc.). Contrôles faits par lecture directe des fichiers et par `grep` ciblé sur les
formulations que chaque décision proscrit (`SUSPECT_PRICE_FLOOR`, `Intl.Collator`, `Freedman`,
`hexagonal`, `24 couples`, `1,359`, `silencieusement`, `empreinte`, `n_obs`/`n_tot`, `Math.floor`,
`22 retenus`, `classe X`, etc.) — voir le détail dans les sections précédentes de ce journal.

**65 / 65 décisions vérifiées.**

| Décision | Exigences prescrites par le corps | Résultat |
|---|---|---|
| `ARB-01` | `EX-DATA-106` (+`announcedListingCount`), `EX-DATA-68`, `EX-DATA-72`, `EX-DATA-61bis` (créer), `EX-SCR-31`, `EX-SCR-115`, `EX-SCR-116` | 6/7 couvertes par un travail nommé (A-16/19/24, B-20/47) ; **`EX-DATA-106` non couverte par un travail — PRESCRIPTION MANQUANTE, cf. ci-dessous** |
| `ARB-02` | `EX-SCR-82`, `EX-SCR-83`, `EX-SCR-91`, §A.2.2 (supprimer) | Toutes couvertes (B-39, B-40, B-42, C-02) |
| `ARB-03` | `EX-SCR-164`, `EX-DATA-93bis` (créer), propagation → `EX-SCR-203`, `EX-SCR-206`, `EX-SCR-207`, `EX-SCR-158` | Toutes couvertes ; propagation vérifiée par lecture directe (aucune trace de « prix ~ année + ln(km) » restante) |
| `ARB-04` | `EX-DATA-83bis/ter/quater/quinquies`, `EX-DATA-102bis` (créer, ×5), renvoi par graphe `EX-SCR-161/162/163/165/166/167/168/169/170`, `EX-SCR-149` | Toutes couvertes (A-26, A-32, B-57, B-54) ; les 9 renvois par graphe relus un par un, conformes |
| `ARB-05` | `EX-SCR-145/146/147`, `EX-SCR-18` | Couvertes (B-53, B-16) |
| `ARB-06` | `EX-SCR-195`, `EX-SCR-200` | Couvertes (B-62) |
| `ARB-07` | `EX-SCR-16` | Couverte (B-15) |
| `ARB-08` | `EX-DATA-79`, `EX-SCR-18/146/147` | Couvertes (A-25, B-16, B-53) |
| `ARB-09` | `EX-NAV-7`, `EX-SCR-149` | Couvertes (C-03, B-54) |
| `ARB-10` | `EX-NAV-22`, `EX-SCR-68` | Couvertes (C-09, B-36) |
| `ARB-11` | `EX-NAV-21`, `EX-SCR-68`, `EX-SCR-38bis` (créer) | Couvertes (C-08, B-36, B-04) |
| `ARB-12` | `EX-NAV-18`, `EX-SCR-176`→`75` | Couvertes ; re-ciblage `R-A10` appliqué (`RES-10`) |
| `ARB-13` | `EX-DATA-45`, `EX-DATA-19`, `EX-DATA-60`, `EX-DATA-87`, propagation renommage | Toutes couvertes (A-01, A-11, A-15, A-28) ; propagation vérifiée, 0 occurrence de `SUSPECT_PRICE_FLOOR` |
| `ARB-14` | `EX-DATA-2` | Couverte (A-06) |
| `ARB-15` | `EX-SCR-36`, `EX-SCR-95`, `EX-DATA-60` | Couvertes (B-23, B-43, A-15) |
| `ARB-16` | champ 7 `priceEur`, `EX-DATA-45`, `EX-DATA-60` | Couvertes (A-07, A-02, A-15) |
| `ARB-17` | `EX-SCR-33`, propagation `n_m` → `EX-SCR-150/164/165/166` | Couvertes (B-22, B-55) ; propagation relue ligne à ligne, `n` partout qualifié |
| `ARB-18` | `EX-SCR-164`, `EX-SCR-203` | Couvertes (B-58, B-64) |
| `ARB-19` | `EX-SCR-109/113/142/4`, `EX-DATA-69` | Couvertes (B-44/46/52/09, A-20) |
| `ARB-20` | `EX-SCR-12/33`, `EX-DATA-64/69` | Couvertes (B-13/22, A-17/20) |
| `ARB-21` | `EX-SCR-3`, `EX-DATA-64` | Couvertes (B-08, A-17) |
| `ARB-22` | `EX-SCR-5`, `EX-DATA-67` | Couvertes (B-10, A-18) |
| `ARB-23` | `EX-SCR-4/5/6` | Couvertes (B-09/10/11) |
| `ARB-24` | `EX-SCR-13`, `EX-DATA-7` | Couvertes (B-14, A-08) |
| `ARB-25` | `EX-DATA-70bis/70ter` (créer), `EX-DATA-70`, `EX-SCR-119/120/121/203/216` | Toutes couvertes (A-22, A-21, B-49, B-64, B-68) ; les trois renvois « départage » relus, `EX-DATA-70ter` partout |
| `ARB-26` | `EX-SCR-11` | Couverte (B-12) |
| `ARB-27` | `EX-SCR-164/206/207` | Couvertes (B-58, B-65) |
| `ARB-28` | `EX-SCR-32/124bis/127` | Couvertes (B-21, B-05, B-51) |
| `ARB-29` | `EX-SCR-27bis` (créer), `EX-SCR-27/126` | Couvertes (B-01, B-19, B-50) |
| `ARB-30` | `EX-SCR-77`, `EX-SRCH-18bis` (créer) | Couvertes (B-38, C-16) |
| `ARB-31` | `EX-DATA-100bis` (créer), `EX-SCR-32` | Couvertes (A-31, B-21) |
| `ARB-32` | `EX-SCR-38` | Couverte (B-25) |
| `ARB-33` | `EX-SRCH-11bis` (créer), `EX-SRCH-16`, `EX-SCR-73` | Couvertes (C-14, C-15, B-37) |
| `ARB-34` | `EX-SCR-202` | Couverte (B-61) |
| `ARB-35` | `EX-SCR-84/73`, `EX-SRCH-11` | Couvertes (B-41/37, C-13) |
| `ARB-36` | `EX-DATA-86` | Couverte (A-27) |
| `ARB-37` | `EX-CRUD-16`, §C.4, `EX-DATA-123bis` (créer), `EX-SCR-187` | Couvertes (C-19, A-39, B-60) |
| `ARB-38` | `EX-NFR-4bis` (créer), `EX-NFR-8` | Couvertes (C-22) |
| `ARB-39` | `EX-DATA-110bis` (créer), `EX-DATA-110`, `EX-SCR-26`, `EX-SCR-46` | 3/4 couvertes par un travail nommé (A-36, B-28) ; **`EX-SCR-26` non couverte — PRESCRIPTION MANQUANTE, déjà connue et appliquée dans ce lot (lot 2)** |
| `ARB-40` | `EX-DATA-105`, `EX-DATA-114` (index taxonomie), `EX-SCR-59/221` | Couvertes ; `EX-DATA-114` réinterprétée à bon droit en complément d'`EX-DATA-115` (devenu `EX-DATA-115bis`, `RES-1`), l'ancre littérale n'existant pas (A-33, A-38, B-33) |
| `ARB-41` | 6 routes, `EX-NAV-10bis` (créer), `EX-SCR-50/202`, `EX-NAV-12` | Couvertes (C-01, C-04, B-30, B-61, C-05) |
| `ARB-42` | `EX-SRCH-9bis..9quinquies` (créer), `EX-DATA-108/109`, `EX-SCR-37` | Couvertes (C-12, A-34/35, B-24) |
| `ARB-43` | `EX-CRUD-13bis` (créer), `EX-SCR-111` (supprimer), `EX-SCR-118/194/197/216` | Couvertes (C-18, B-45, B-48, B-68) |
| `ARB-44` | `EX-SCR-42/142/214bis/212/23/29/47` | Couvertes (B-26/52/07/66/17/29) |
| `ARB-45` | `EX-CRUD-1`, `EX-SCR-213` | Couvertes (C-17, B-67) |
| `ARB-46` | `EX-SCR-216` | Couverte (B-68) |
| `ARB-47` | `EX-SCR-158bis` (créer), `EX-SCR-158/203/207/166` | Couvertes (B-03, B-56, B-64, B-65) ; `EX-SCR-166` (`G10`) vérifiée, porte bien la chaîne d'étiquetage |
| `ARB-48` | `EX-DATA-98` | Couverte (A-30) |
| `ARB-49` | `EX-NAV-23/24/25` (créer) | Couvertes (C-10) |
| `ARB-50` | `EX-CRUD-18` (créer), `EX-CRUD-1` | Couvertes (C-20, C-17) |
| `ARB-51` | `EX-SCR-200/214` | Couvertes (B-63) |
| `ARB-52` | `EX-SCR-45` | Couverte (B-27) |
| `ARB-53` | `EX-SCR-67/83` | Couvertes (B-35, B-40) |
| `ARB-54` | `EX-DATA-15/45/106`, `EX-SCR-53/203` | 4/5 couvertes par un travail nommé (A-09, A-03, B-31, B-64) ; **`EX-DATA-106` non couverte par un travail — même PRESCRIPTION MANQUANTE qu'`ARB-01`, cf. ci-dessous** |
| `ARB-55` | `EX-DATA-112`, §D.1/D.3 | Couvertes (A-37, C-23) |
| `ARB-56` | `EX-NAV-18` | Couverte (C-06) |
| `ARB-57` | `EX-SRCH-1bis` (créer), `EX-SCR-25` | Couvertes (C-11, B-18) |
| `ARB-58` | `EX-CRUD-19` (créer) | Couverte (C-21) |
| `ARB-59` | `EX-NAV-20`, `EX-SCR-113bis` (créer), `EX-SCR-113`, `EX-DATA-72` | Couvertes (C-07, B-06, B-46, A-23) |
| `ARB-60` | `EX-DATA-40/45` | Couvertes (A-14, A-04) |
| `ARB-61` | `EX-DATA-29` étape 6 | Couverte (A-13) |
| `ARB-62` | `EX-DATA-28` | Couverte (A-12) |
| `ARB-63` | `EX-NFR-28` (créer) | Couverte, sous `EX-NFR-31` (collision de numéro documentée, C-24) |
| `ARB-64` | `EX-DATA-106` (+`unknownCountByField`), `EX-SCR-53` | 1/2 couverte par un travail nommé (B-31) ; **`EX-DATA-106` non couverte par un travail — PRESCRIPTION MANQUANTE explicitement signalée par la mission, cf. ci-dessous** |
| `ARB-65` | `EX-SCR-72bis` (créer), `EX-SCR-64/71` | Couvertes (B-02, B-34) |
| `REJET-01` | — (rejet, aucune édition) | Sans objet |

**Bilan du balayage** : **65 décisions vérifiées**, **3 prescriptions manquantes découvertes**, portant
en réalité sur **2 emplacements distincts** :

1. **`EX-DATA-106` (entité `Snapshot`)** — trois champs prescrits par trois décisions différentes
   (`ARB-01` → `announcedListingCount`, `ARB-54` → `duplicateValueConflictCount`, `ARB-64` →
   `unknownCountByField`) n'avaient de travail nommé dans **aucune** des trois listes § 4.1/4.2/4.3.
   **Constat à l'ouverture de ce lot** : les trois champs sont déjà présents dans
   `draft-data-dictionary.md` (`EX-DATA-106`, lignes 1608-1627), accompagnés d'une note
   « Complément du coordinateur — travail 40, absent de la liste d'arbitrage » qui documente
   exactement cet écart et le referme. Cette correction a donc été appliquée **avant** le passage de
   cet agent (par le coordinateur, hors des 131 travaux nommés). **Vérifié conforme** au texte des
   trois décisions : les trois champs, leurs définitions et leur renvoi (`EX-SCR-53`) sont exacts.
   **Aucune action requise** — constat consigné, pas de nouvelle édition.
2. **`EX-SCR-26` (`ET-VIDE-FILTRES`)** — la prescription du corps d'`ARB-39` (citer
   `FacetCount`/`selectionHashWithoutFilter(filterId)`, format normatif
   `retirer « <libellé> » : <k> offres de plus`) n'avait pas de travail nommé (la liste `ANNEXE-B`
   ne rattache `ARB-39` qu'à `EX-SCR-46`, `B-28`). **Non résolue à l'ouverture de ce lot** — c'est le
   second des deux résidus nommément signalés par la mission. **Appliquée dans ce lot** (voir lot 2
   ci-dessus) : `EX-SCR-26` cite désormais formellement `EX-DATA-110bis` et porte le format exact.

**Aucune autre prescription manquante trouvée** sur les 65 décisions. Aucune prescription découverte
n'a exigé de jugement métier non prévu par le texte de la décision elle-même : les deux points
ci-dessus se résolvaient par simple application du texte déjà écrit par l'arbitre.

---

## Bilan final

**11 / 11 résidus soldés** (`RES-1` à `RES-11`). **Aucun résidu bloqué.**

### Comptes d'exigences par annexe, après passage

| Annexe | Fichier | Avant ce passage | Après ce passage | Variation |
|---|---|---:|---:|---|
| A | draft-data-dictionary.md | 139 (127 base + 12 `bis/ter/…`) | **140** (127 base + 13 `bis/ter/…`) | +1 — création `EX-DATA-115bis` (`RES-1`) |
| B | draft-screens.md | 231 (224 base + 7 `bis`) | **231** | inchangé — aucune création, aucune suppression |
| C | draft-behaviour.md | 114 (`EX-NAV` 28, `EX-SRCH` 34, `EX-CRUD` 20, `EX-NFR` 32) | **114** | inchangé |
| **Total** | | 484 | **485** | +1 |

Vérifié par script (`grep` + `sort`/`uniq -d`, voir le détail plus haut) : chaque identifiant est
défini **exactement une fois** dans son annexe, dans les trois documents.

### Vérifications de fin

1. **Unicité des identifiants** — annexe A : 140 identifiants, aucun doublon (base 1-127 sans trou,
   13 suffixes `bis/ter/quater/quinquies`). Annexe B : 231 identifiants, aucun doublon (base 1-224
   sans trou, 7 suffixes `bis`). Annexe C : 114 identifiants, aucun doublon (`EX-NAV` 28, `EX-SRCH`
   34, `EX-CRUD` 20, `EX-NFR` 32).
2. **Aucun identifiant disparu** — les bases 1-127 (A), 1-224 (B, y compris `EX-SCR-111` en pierre
   tombale volontaire) et l'intégralité des identifiants C d'avant ce passage sont tous présents.
   Aucune renumérotation faite ; la seule création est `EX-DATA-115bis` (identifiant neuf, pas de
   réutilisation).
3. **Formulations non mesurables** (`rapide`, `intuitif`, `moderne`, `clair`, `performant`,
   `ergonomique`, `fluide`, `simple`, `pertinent`, `approprié`, `significatif`, `le cas échéant`,
   `si nécessaire`) — recherche exhaustive dans les trois documents après édition : **aucune
   occurrence introduite par cet agent**. Deux occurrences préexistantes et hors barème subsistent
   dans `draft-screens.md` (« fond clair comme sur fond sombre », contraste de jeton ; et la ligne de
   la matrice § 9 qui **énumère** ces mots comme critère de revue lexicale) et une dans
   `draft-data-dictionary.md` (« en clair » = explicitement, dans la justification d'`EX-DATA-93bis`,
   déjà signalée non fautive par `applied-annexe-A.md`) — signalées, non retouchées (jugement de
   reformulation hors mandat des résidus). **La seule occurrence non signalée d'un résidu nommé**
   (« navigation rapide », `RES-8`) a été corrigée.
4. **Table supprimée du § A.2.2, décompte « 22 retenus », « 24 couples », classe `X`** — recherche
   exhaustive : aucune occurrence restante dans les trois annexes (les seules occurrences de ces
   chaînes dans le dépôt sont dans `ARBITRAGES-req-lead.md`, hors périmètre d'édition, où elles
   documentent l'historique de la décision).
5. **Cohérence du décompte de filtres** — `data/reference/filters-scope.json` relu :
   `totalCatalogue = 101`, `totalRetenus = 77`, `totalExclus = 24` (`retenus.length` et
   `exclus.length` vérifiés égaux). Toutes les occurrences de ces chiffres dans les trois annexes
   (`EX-SCR-82/83`, § A.2.2 de l'annexe C, etc.) sont cohérentes avec ce fichier ; aucune liste de
   filtres écrite à la main ne le contredit.

### Ce qui reste hors du mandat de cet agent (signalé, non tranché)

- La note « Complément du coordinateur — travail 40 » dans `EX-DATA-106` mélange, dans sa première
  phrase, une formulation historique (« l'agent a eu raison de ne pas l'ajouter de sa propre
  initiative ») avec le fait que les trois champs **sont** désormais ajoutés juste en dessous. Cette
  rédaction n'est pas de cet agent et n'a pas été retouchée : les résidus ne portaient pas sur son
  style, seulement sur l'absence des champs — absence qui n'existe plus.

