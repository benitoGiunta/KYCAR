# Journal d'application — ANNEXE-C (`draft-behaviour.md`)

Agent `fix-annexe-C`, phase 2.2. Applique les 24 travaux de la liste `ANNEXE-C` de
`reports/REQ-STRESSTEST.md` § 4.3, sur la base des décisions détaillées `ARB-*` du même rapport et
des révisions `R-A01`/`R-A05`/`R-A06` de `ARBITRAGES-req-lead.md`.

Statuts : `APPLIQUÉ` / `BLOQUÉ` (+ motif).

| # | Décision(s) | Exigence(s) visée(s) | Action | Statut | Détail |
|---|---|---|---|---|---|
| C-01 | `ARB-41` | § A.1, `EX-NAV-1` à `EX-NAV-4` | MODIFIER | APPLIQUÉ | Table portée à six routes ; `EX-NAV-2bis` (`/…/annonces`, écran D) et `EX-NAV-2ter` (`/comparer`, écran C) créées ; anciennes routes `/` et `/modele/:makeId/:modelId` conservées en lecture seule avec redirection `replaceState`. |
| C-02 | `ARB-02` | § A.2.2, table des 101 filtres | SUPPRIMER | APPLIQUÉ | Table en prose (22 IN / 4 conditionnels / 75 OUT) supprimée, remplacée par un renvoi à `data/reference/filters-scope.json` (77 retenus / 24 exclus) et à `scripts/build-filter-scope.mjs`. Texte de remplacement repris verbatim de la décision `ARB-02`. |
| C-03 | `ARB-09` | `EX-NAV-7` | MODIFIER | APPLIQUÉ | Ajout : bornes inclusives des deux côtés, champ et unité canoniques, comparaison sur l'année entière pour les filtres d'année, `INCONNU` jamais retenu par défaut. |
| C-04 | `ARB-41` | `EX-NAV-10bis` | CRÉER | APPLIQUÉ | Nouvelle sous-section A.2.8 « Paramètres d'état d'interface » (`m`, `g<n>log`, `grp`, `mk`, `sort` d'écran A, `g4v`, `selx`/`sely`), insérée avant § A.3. Précise que `sort` d'écran A n'a aucun rapport avec `sort` AS24 (écran D), et que la sélection de brossage est encodée par bornes d'axe, jamais par empreinte. |
| C-05 | `ARB-41` | `EX-NAV-12` | MODIFIER | APPLIQUÉ | Ajout de la règle : entrée d'historique produite par changement de filtre appliqué **et** par les paramètres `pushState` d'`EX-NAV-10bis` ; les paramètres `replaceState` n'en produisent jamais. |
| C-06 | `ARB-56`, `ARB-12` | `EX-NAV-18` | MODIFIER | APPLIQUÉ | Route mise à jour (`/marche/...`) ; ajout du plafond explicite (2 000 caractères, mesure ≈ 1 720 pour 77 filtres, test du lot D4) et de la limite déclarée du partage par URL pure (troncature de messagerie non détectable, contre-mesure : jeton de filtre affichant toujours sa valeur). |
| C-07 | `ARB-59` | `EX-NAV-20` | MODIFIER | APPLIQUÉ | Ajout de l'exception unique `modelId = 0` (clé réservée « Modèle non identifié »), route dédiée `/marche/:makeId-:makeSlug/0-modele-non-identifie` valide, écran B en mode restreint. |
| C-08 | `ARB-11` | `EX-NAV-21` | MODIFIER | APPLIQUÉ | Remplacé par la table des cinq classes de correction (code énuméré absent, borne hors domaine, borne non numérique/vide, intervalle inversé, paramètre inconnu du référentiel) ; suppression du mot « silencieusement », renvoi au bandeau `ET-URL-CORRIGEE`. |
| C-09 | `ARB-10` | `EX-NAV-22` | MODIFIER | APPLIQUÉ | Réécrit : permutation des bornes réservée au chargement d'URL (signalée par `ET-URL-CORRIGEE`) ; la saisie interactive suit une règle distincte et ne permute jamais (`EX-SCR-68`), différence déclarée normative. |
| C-10 | `ARB-49` | `EX-NAV-23`, `EX-NAV-24`, `EX-NAV-25` | CRÉER | APPLIQUÉ | Nouvelle section A.7 « Cycle de vie du snapshot » : un seul snapshot actif (`EX-NAV-23`), ce que le remplacement purge — caches, `CompareSelection` — vs conserve — entités CRUD persistées (`EX-NAV-24`), signalement du remplacement (`EX-NAV-25`). |
| C-11 | `ARB-57` | `EX-SRCH-1bis` | CRÉER | APPLIQUÉ | Ajouté en fin de § B.1 : regroupement obligatoire des rafales de filtres `R` au-delà de trois changements en 300 ms, un seul recalcul en attente, passage à `ET-CHARGE-MAJ` (indicateur autorisé) en mode groupé. |
| C-12 | `ARB-42` | `EX-SRCH-9bis` à `EX-SRCH-9quinquies` | CRÉER | APPLIQUÉ | Nouvelle section B.2bis « Composantes de l'état de filtres » (entre B.2 et B.3) : scission T/R, `localDatasetKey` et acquisition, chiffres relatifs au jeu local, décomposition de `selectionHash`. |
| C-13 | `ARB-35` | `EX-SRCH-11` | MODIFIER | APPLIQUÉ | Justification du OU intra-filtre corrigée : fondée sur la structure du vocabulaire (« une annonce porte exactement un code, y compris hybride »), plus sur « une voiture a un seul carburant ». |
| C-14 | `ARB-33` | `EX-SRCH-11bis` | CRÉER | APPLIQUÉ | Ajouté après `EX-SRCH-11` : prédicat évalué sur le champ et l'unité canoniques, conversion sans arrondi intermédiaire, constante unique DIN 66036 (`0,7355`), `powerHp` jamais membre gauche d'un prédicat. |
| C-15 | `ARB-33` | `EX-SRCH-16` | MODIFIER | APPLIQUÉ | Suppression du facteur `1,359` ; renvoi à la constante unique d'`EX-DATA-36`. |
| C-16 | `ARB-30` | `EX-SRCH-18bis` | CRÉER | APPLIQUÉ | `EX-SRCH-18bis` créé : valeurs injectées vers la source (`atype`, `ustate=A,N,U`, `powertype`, `pricetype`, `cy`), jamais des filtres utilisateur, jamais remises à zéro par un reset ; une phrase de renvoi ajoutée à `EX-SRCH-18` pour lier les deux, sans réécrire son texte. |
| C-17 | `ARB-45`, `ARB-50` | `EX-CRUD-1` | MODIFIER | APPLIQUÉ | Ajout des champs `effectifInitial`, `snapshotInitial`, `schemaVersion` ; les deux premiers figés à la création, jamais réécrits. |
| C-18 | `ARB-43` | `EX-CRUD-13bis` | CRÉER | APPLIQUÉ | Nouvelle sous-section C.3bis « Sélection de comparaison (entité de session) » : `CompareSelection`, portée onglet, non persistée, plafond unique de 4 modèles, doublons interdits, sérialisation dans `m` sur `/comparer`. **Incohérence repérée** (hors des 24 travaux, signalée en fin de rapport) : le tableau des candidats CRUD (§C, avant §C.1) et §C.8 « Entités écartées » qualifient encore la « Comparaison de plusieurs modèles » d'« Écarté » — texte désormais contredit par cette entité et par la route `/comparer` (`EX-NAV-2ter`, `C-01`). Non corrigé ici : aucun des 24 travaux ne cible ce tableau ni §C.8. |
| C-19 | `ARB-37` | `EX-CRUD-16` et § C.4 | MODIFIER | APPLIQUÉ | §C.4 : intro réécrite (« jamais un champ interdit par R3 », export par annonce autorisé et limité aux colonnes d'`EX-DATA-123bis`, annexe A). `EX-CRUD-16` : exactement deux entrées de menu (CSV annonces du périmètre / CSV agrégats des trois histogrammes) ; suppression de la notion d'« onglet actif » ; pas d'entrée PNG. |
| C-20 | `ARB-50` | `EX-CRUD-18` | CRÉER | APPLIQUÉ | Nouvelle section C.6 « Version de schéma et migration » : `schemaVersion` par entité persistée, quatre cas de lecture (à jour / migrable / non migrable / plus récente), aucune suppression silencieuse. Ancienne § C.5 « Entités écartées » renumérotée C.8 (numérotation de sous-section, aucun identifiant `EX-*` renuméroté). |
| C-21 | `ARB-58` | `EX-CRUD-19` | CRÉER | APPLIQUÉ | Nouvelle section C.7 « Concurrence entre onglets » : lecture-vérification-écriture avant toute écriture CRUD, jamais de dépassement de plafond en cas de course, rafraîchissement via l'événement `storage`. |
| C-22 | `ARB-38` | `EX-NFR-4bis` (CRÉER), `EX-NFR-8` (MODIFIER) | CRÉER puis MODIFIER | APPLIQUÉ | `EX-NFR-4bis` créé en tête de § D.2 : percentile de rang le plus proche supérieur, distinct du `Q` de type 7, ≥ 100 exécutions, chargement à froid exclu. `EX-NFR-8` reformulé : cible en fenêtres glissantes de 1 s (≥ 95 % des fenêtres ≥ 30 im/s sur une rotation de 10 s) au lieu de « soutenues ». |
| C-23 | `ARB-55` | § D.1 et § D.3 | MODIFIER | APPLIQUÉ | Vérification effectuée : § D.1 (`EX-NFR-1` à `4`) et § D.3 (`EX-NFR-10`, `11`) ne chiffrent aucune enveloppe mémoire totale de navigateur (seulement taille de fichier de référence et taille de bundle) — aucune valeur à corriger vers ≈ 274 Mo / facteur 1,9 (celle-ci vit dans `EX-DATA-112`, annexe A, hors périmètre de ce document). Consigné conformément à la clause d'`ARB-55` prévoyant ce cas. |
| C-24 | `ARB-63` | `EX-NFR-28` | CRÉER | APPLIQUÉ, **avec ajustement de numérotation** | La décision cite l'identifiant cible `EX-NFR-28`, mais ce numéro est déjà occupé par une exigence sans rapport (« langue d'interface unique en v1 : français », § D.8, présente depuis la version initiale du document). Créer une seconde exigence sous le même identifiant écraserait/dupliquerait une exigence existante — l'exception explicitement prévue par la mission (« création qui écraserait une exigence existante »). Résolution appliquée sans deviner sur le fond : contenu normatif repris **verbatim** de `ARB-63`, sous l'identifiant neuf **`EX-NFR-31`** (prochain disponible du préfixe), nouvelle section D.9 « Impression ». Une note explicite dans le document signale l'écart de numérotation entre `REQ-STRESSTEST.md`/`ARB-63` (qui écrivent `EX-NFR-28`) et ce document (`EX-NFR-31`), pour que la matrice de traçabilité et les deux autres rapports de stress-test puissent faire le rapprochement. **Ce choix a été fait sans escalade** car il découle directement de la règle générale de méthode déjà énoncée pour l'agent (« ne jamais renuméroter, une création prend un identifiant neuf ») plutôt que d'un jugement sur le contenu de la décision. |

## Bilan

**24 / 24 travaux traités, 0 bloqué au sens strict** (un seul ajustement mineur de numérotation sur
C-24, documenté ci-dessus et dans le corps du document). 18 créations, 1 suppression (§ A.2.2), 13
modifications au sens de la liste `ANNEXE-C`.

### Décompte des exigences par préfixe

| Préfixe | Avant | Après | Créations |
|---|---:|---:|---:|
| EX-NAV | 22 | 28 | 6 |
| EX-SRCH | 27 | 34 | 7 |
| EX-CRUD | 17 | 20 | 3 |
| EX-NFR | 30 | 32 | 2 |
| **Total** | **96** | **114** | **18** |

Vérifié par script (`grep` sur tous les identifiants) : les 96 identifiants antérieurs sont tous
encore présents (aucune suppression, aucune renumérotation), et chacun des 114 identifiants finaux
n'est défini qu'une seule fois dans le document.

### Vérifications de fin

- **Table du § A.2.2** : supprimée, remplacée par un renvoi à `data/reference/filters-scope.json` /
  `scripts/build-filter-scope.mjs`. Recherche de « 22 retenus » : aucune occurrence. Recherche de
  « 101 filtres relevés » (titre de l'ancienne table) : aucune occurrence restante (seule
  l'expression « 101 filtres » subsiste en tête de document, ligne 8, dans la description du
  catalogue source `REF-filters.md` — qui compte réellement 101 entrées au total, 77 retenues + 24
  exclues ; ce n'est pas une trace de l'ancien décompte erroné).
- **EX-NAV-\* et les 77 filtres** : § A.2.2 déclare explicitement « les exigences `EX-NAV-*`
  d'encodage s'appliquent aux 77 filtres retenus ». Confirmé.
- **Identifiants** : chaque `EX-NAV-*`, `EX-SRCH-*`, `EX-CRUD-*`, `EX-NFR-*` défini exactement une
  fois (vérifié par script `grep`, voir ci-dessus). Aucune renumérotation : les 96 identifiants
  d'origine sont tous encore présents.
- **Formulations non mesurables** (`rapide`, `intuitif`, `moderne`, `clair`, `performant`, `fluide`,
  `simple`, `pertinent`, `approprié`, `le cas échéant`, `si nécessaire`) : recherche exhaustive,
  **aucune occurrence introduite par cet agent**. Une seule occurrence de « rapide » subsiste dans
  le document, ligne « Modèles suivis | Retenu | navigation rapide entre analyses répétées » — elle
  préexistait à cette phase d'application (présente dans le document avant toute édition de cet
  agent) et n'est visée par aucun des 24 travaux ; signalée ici plutôt que corrigée silencieusement.

### Incohérences repérées, hors du périmètre des 24 travaux (signalées, non corrigées)

1. **Comparaison de modèles déclarée « Écarté »** : le tableau des candidats CRUD (début de § C) et
   § C.8 « Entités écartées » qualifient toujours la « Comparaison de plusieurs modèles » d'écartée
   pour la v1, alors que `EX-CRUD-13bis` (`ARB-43`, ce rapport) et la route `/comparer`
   (`EX-NAV-2ter`, `ARB-41`) établissent que cette fonction existe (écran C). Aucun des 24 travaux
   `ANNEXE-C` ne cible ce tableau ni § C.8 ; à traiter séparément.
2. **`sort`/`desc`/`page`/`size` encore décrits comme conditionnels** : `EX-SRCH-23` et `EX-SRCH-24`
   (§ B.6) et la puce d'`EX-NAV-14` renvoient encore à « filtre 79 conditionnel » et « filtres 77-80 »
   de l'ancienne table du § A.2.2 (désormais supprimée), et présentent l'existence de la sous-vue
   liste d'annonces comme non tranchée. Or l'arbitrage `A-02` (« Sous-vue liste d'annonces : elle
   existe ») a déjà tranché ce point avant le stress-test, et `EX-NAV-2bis` (route de l'écran D,
   `C-01`) en dépend. Aucun des 24 travaux `ANNEXE-C` ne cible `EX-SRCH-23`/`24`/`EX-NAV-14` ; à
   traiter séparément.
3. **Références résiduelles à l'ancienne route** `/modele/:makeId/:modelId` dans `EX-CRUD-7` et
   `EX-CRUD-11` (au lieu de la route canonique `/marche/...` d'`EX-NAV-2`) — non fautif au sens
   strict (la route legacy reste valide en lecture seule, `C-01`), mais non mis à jour faute d'être
   dans la liste des 24 travaux.
4. **`EX-NAV-5`** renvoie encore à « voir tableau § A.2.2 » alors que § A.2.2 n'est plus une table
   mais un renvoi en prose — cosmétique, non corrigé (hors des 24 travaux).

Aucune contradiction n'a été trouvée **entre deux décisions** de la liste `ANNEXE-C` elle-même ; les
quatre points ci-dessus opposent une décision appliquée à du texte préexistant qui n'était visé par
aucun des 24 travaux.
