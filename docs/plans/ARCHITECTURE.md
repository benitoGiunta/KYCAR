# KYCAR — Architecture et découpage des lots de développement

**Phase 2.3 — agent `arch-lead`. Établi le 2026-09-07.**
Source de vérité fonctionnelle : `docs/requirements/REQUIREMENTS.md` v1.0 gelé (485 exigences) et ses
trois annexes normatives. Source de cadrage source-de-données :
`docs/research/DECISION-coordinateur-source.md` (conclusion corrigée du chantier 1).

Ce document fige la pile, le modèle de données, la stratégie d'agrégation, le rendu des graphes, la
gestion d'état/URL, l'interface `DataProvider` (fichier séparé
[`DataProvider.ts`](DataProvider.ts)) et le découpage des lots D1–D9. **Chaque choix technique est
justifié contre une exigence numérotée** (critère S1) ; la matrice de traçabilité complète est en §8.

Règle d'autorité rappelée (R-A09 / A-09) : les **formules** font foi en annexe A, la **disposition**
en annexe B, les **mécanismes et NFR chiffrées** en annexe C. Aucune décision ci-dessous ne contredit
une annexe dans son domaine ; les deux tensions inter-annexes résiduelles détectées sont **signalées
en §9**, pas contournées.

---

## 1. Pile technique

### 1.1 Décision d'architecture fondatrice : tout est client, rien n'est serveur

**Décision.** KYCAR est une **application web monopage 100 % client**, sans backend applicatif propre.
Le moteur d'agrégation, la détection d'outliers et le rendu tournent dans le navigateur ; la seule
frontière réseau est l'interface `DataProvider`.

**Justification chiffrée.** `EX-DATA-112` établit une enveloppe mémoire de **≈ 274 Mo au pire cas à
N = 10⁶ annonces**, soit une marge de **facteur 1,9 sous le budget d'onglet de 512 Mo**. L'exigence
conclut littéralement que « la borne haute de H5 n'oblige **pas** à une architecture serveur ». Le
budget de recalcul opposable (`EX-NFR-5` : agrégats ≤ 200 ms p95) est tenable en mémoire locale sur
colonnes typées (§3). Un backend n'apporterait rien qu'une contrainte réseau et un coût
d'infrastructure, et contredirait la confidentialité voulue : `EX-NFR-25` interdit toute API de
synchronisation, `EX-CRUD-3` impose une persistance CRUD **locale uniquement**. Le client EST le
moteur.

**Conséquence directe :** le calcul lourd est déporté dans un **Web Worker** (§1.3), pour que le
recalcul (≤ 200 ms) et le rendu du nuage (≥ 30 img/s, `EX-NFR-8`) ne se disputent jamais le thread
principal.

### 1.2 Langage : TypeScript strict

| Choix | TypeScript 5.x, `strict: true`, `noUncheckedIndexedAccess: true` |
|---|---|
| Exigences | S2 de la phase 2.3 (interface `DataProvider` **en TypeScript**) ; `EX-DATA-120` (sentinelles typées, jamais `null`) ; les 8 invariants `EX-DATA-104` |

Les sentinelles typées d'`EX-DATA-120` (`-1`, `255`) et les `TypedArray` du modèle colonnaire
(`EX-DATA-119`) exigent un typage qui distingue `Int32Array` de `Uint8Array` au niveau du compilateur.
`noUncheckedIndexedAccess` protège les accès aux buffers de comptage réutilisés (`EX-DATA-112`). Le
livrable pivot (`DataProvider.ts`) est imposé en TypeScript par S2.

### 1.3 Cadre front : Preact + Vite, calcul en Web Worker

| Choix | Preact 10 (compat React) + Vite 5 (build/bundler) ; **moteur d'agrégation isolé dans un Web Worker dédié** |
|---|---|
| Exigences | `EX-NFR-10` (bundle initial ≤ 300 Ko gzip) ; `EX-NFR-11` (rendu lourd en code-splitting ≤ 400 Ko) ; `EX-NFR-5` / `EX-NFR-8` (recalcul et 30 img/s non concurrents) ; `EX-NFR-17` (Chrome/Firefox/Edge/Safari 2 dernières majeures) |

**Pourquoi Preact et non React.** Le budget de bundle initial est serré (`EX-NFR-10` : **≤ 300 Ko
gzip**, tout compris) et concurrencé par la taxonomie et les agrégats de base chargés au démarrage
(§1.5). Preact expose l'API React (hooks, JSX) pour **~4 Ko gzip** contre ~45 Ko pour
React+ReactDOM, libérant ~40 Ko du budget pour le code métier du bandeau (77 filtres) et des écrans.
Le reste de l'écosystème React (routing, state) est remplacé par des briques minimales ci-dessous
plutôt que par des dépendances lourdes. **Aucune bibliothèque de graphes tierce** n'est retenue
(§4) : les graphes sont dessinés à la main en SVG/Canvas, ce qui supprime le poste de bundle le plus
volumineux d'ordinaire.

**Pourquoi Vite.** Le lot D1 exige build + lint + tests + tokens de design ; Vite fournit le
dev-server, le code-splitting natif (`import()` dynamique pour le bundle 3D d'`EX-NFR-11`) et la
compression brotli/gzip mesurable pour tenir `EX-NFR-10`/`EX-NFR-11` en CI.

**Pourquoi le Web Worker.** `EX-NFR-8` impose qu'aucune fenêtre de 1 s ne descende sous 30 img/s
pendant une rotation/zoom de 10 s, tandis qu'`EX-NFR-5` autorise 200 ms de recalcul. Sur un seul
thread, un recalcul de 200 ms tuerait 6 trames consécutives. Le worker détient le snapshot colonnaire
et exécute tous les balayages ; le thread principal ne fait que du rendu et reçoit des vues
transférées (`Transferable`/`ArrayBuffer`). C'est la condition d'atteinte simultanée des deux budgets.

### 1.4 Rendu des graphes à forte cardinalité : SVG pour le peu, Canvas 2D pour le nuage

Résumé ici, détaillé en §4.

| Graphe | Cardinalité | Rendu | Exigence |
|---|---|---|---|
| Histogrammes `G1`–`G3`, jauges, barres | ≤ 26 bins | **SVG** (accessible, peu d'éléments) | `EX-NFR-6` ≤ 300 ms ; `EX-NFR-15` table équivalente |
| Nuage `G4` (prix × année × km) | ≤ 5 000 points (`EX-DATA-100`) | **Canvas 2D** au-delà d'un seuil, SVG en deçà (`EX-SCR-157`) | `EX-NFR-7` ≤ 500 ms ; `EX-NFR-8` ≥ 30 img/s |

**Aucune dépendance WebGL/three.js en v1.** `G4` tel que spécifié par l'annexe B (`EX-SCR-151`…`160`)
est une **projection 2D** (nuée empilée `G4a` ou nuage prix × année `G4b`) où les 3ᵉ et 4ᵉ dimensions
sont encodées par couleur et taille — pas une scène 3D rotative. Un Canvas 2D dessine 5 000 disques à
60 img/s sans peine (`EX-DATA-100` le pose comme base du plafond). WebGL serait réservé au cas où un
véritable nuage 3D rotatif serait mandaté ; il rentrerait alors dans le budget différé d'`EX-NFR-11`
(≤ 400 Ko). **Voir la tension §9.1 sur le mot « rotation » d'`EX-NFR-8`.**

### 1.5 Gestion d'état des filtres et synchronisation URL : l'URL est la source de vérité

| Choix | Codec d'URL canonique maison + store éphémère minimal (signaux Preact) ; routeur maison léger (≈ 1 Ko) |
|---|---|
| Exigences | `EX-NAV-18` (rendu = fonction pure de l'URL) ; `EX-NAV-9` (ordre canonique) ; `EX-NAV-12`/`13`/`14` (historique, regroupement 800 ms) ; `EX-SRCH-9bis` (scission T/R) ; `EX-NFR-10` (bundle) |

`EX-NAV-18` énonce que « le rendu de l'écran est une fonction pure de l'URL, il n'existe aucun état de
filtre qui ne soit pas représentable dans l'URL ». L'**URL est donc l'état**, pas un miroir. Aucune
bibliothèque de state management partagé (Redux, MobX) n'est justifiée : l'état persistant vit dans
l'URL, l'état éphémère (valeur d'un champ en cours de frappe, `EX-NAV-12`) vit dans le contrôle local.
Le codec d'URL — sérialisation/désérialisation canonique `EX-NAV-9`, plafond 2 000 caractères
`EX-NAV-10`/`11`, table de corrections `EX-NAV-21` — est du code maison testable au caractère près
(exigé par la matrice §11.1 de REQUIREMENTS : « égalité stricte de la chaîne sérialisée »). Un routeur
tiers (React Router ≈ 20 Ko) n'est pas justifié pour six routes ; un routeur maison suffit et préserve
le budget bundle. Détails en §5.

### 1.6 Persistance CRUD : IndexedDB + `localStorage`, aucun serveur

| Choix | Entités CRUD en IndexedDB (données) + `localStorage` (préférences, événement `storage` inter-onglets) ; dernier snapshot en cache IndexedDB |
|---|---|
| Exigences | `EX-CRUD-3`/`8` (local uniquement) ; `EX-CRUD-18` (schemaVersion + migration) ; `EX-CRUD-19` (concurrence inter-onglets par `storage`) ; `EX-NFR-22` (repli sur dernier snapshot en cache) ; `EX-NFR-24` (inventaire exhaustif du stockage client) |

---

## 2. Modèle de données et persistance

### 2.1 Les 14 entités (EX-DATA-105) et leur portée [amendée 2.6 — O16]

Le modèle est **matérialisé une fois par snapshot**, puis calculé à la volée. Reprise fidèle
d'`EX-DATA-105`/`109` :

| Entité | Portée | Où elle vit |
|---|---|---|
| `Snapshot` | persistée | métadonnées en mémoire + cache IndexedDB (repli `EX-NFR-22`) |
| `Listing` | persistée par snapshot | **colonnes typées en mémoire, dans le worker** (§3.1) |
| `Make`, `Model` | statique | chargées au démarrage (`taxonomy.json`) |
| `Enumeration`, `EnumValue` | statique | `filters.json` + 33 référentiels `references/*.json` |
| `Region`, `PostalRegionRange` | statique | table belge NUTS-2 (dette `[EXTRAPOLÉ]` à solder, `EX-DATA-53`) |
| `MakeAggregate`, `ModelAggregate` | précalculés pour sélection vide, à la volée sinon | worker |
| `DistributionBucket`, `SelectionStats`, `OutlierVerdict`, `DensityCell` | calculées à la volée | worker |

### 2.2 Disposition physique de `Listing` : colonnaire (EX-DATA-119)

`Listing` n'est **jamais** un tableau d'objets. Chaque champ est une colonne `TypedArray` (le détail
octet par octet est repris tel quel dans `ListingColumnBatch` de `DataProvider.ts`, §5 du fichier).
Motif chiffré (`EX-DATA-119`) : un balayage de sélection lit 3 à 12 champs sur 82 ; en disposition
ligne-par-ligne il traverserait les 82 champs, soit un facteur **7 à 27** de lecture mémoire inutile,
rendant le budget de 60 ms (`EX-DATA-110`) inatteignable. Les cinq champs textuels
(`listingUrl`, versions, `fuelSourceLabelRaw`) sont hors du chemin chaud, dans une zone de chaînes
adressée par offsets (`EX-DATA-121`) — jamais lus pendant un balayage sauf filtre par mot-clé.

**Amendements 2.6 à l'interface gelée** (`fix-foundation`, étape 0) : `makeId` est élargi
d'`Int16Array` à **`Int32Array`** (`D-02`, DR-007 — 158 des 295 marques ont un identifiant
AutoScout24 > 32 767) ; `ingestFlags` est élargi d'`Uint16Array` à **`Uint32Array`** (`D-01`,
DR-013 — le 17ᵉ code `MARKETPLACE_UNMAPPED` était instockable au bit 16). L'encodage
**positionnel** est conservé (bit = index dans `INGEST_FLAG_VALUES`), mais découplé de la largeur
de la colonne par une **table explicite bit ↔ code**, exportée par `src/types` : `INGEST_FLAG_BIT`
(numéro de bit par code), `INGEST_FLAG_BIT_CAPACITY = 32`, `hasIngestFlag`, `setIngestFlag`,
`ingestFlagCodes`. 17 codes posés, 15 bits de réserve. `booleanFlags` reste `Uint16Array`. Les deux
copies de l'interface (`docs/plans/DataProvider.ts` et `src/providers/DataProvider.ts`) restent
identiques octet à octet après ces amendements. [amendée 2.6 — D-01, D-02]

**Sentinelles typées** (`EX-DATA-120`) : `-1` pour les grandeurs positives, `255` pour les
énumérations sur un octet, **jamais `0` ni `null`** — car `0` est une valeur légitime de `mileageKm`,
`co2` et `previousOwnerCount`.

### 2.3 Chargement progressif — la clé du budget de premier affichage (EX-NFR-9)

`EX-NFR-9` impose un premier affichage utile du mode 1 **≤ 2 000 ms en 4G** (≈ 500 Ko/s). Or un
snapshot de listings complet peut peser plusieurs Mo à 60 Mo. **La conciliation est architecturale :**

1. Au démarrage : chargement de `taxonomy.json` (< 1 Mo gzip, `EX-NFR-4`) + **agrégats de base
   précalculés** de la sélection vide (`fetchBaselineAggregates`, ≈ 1,7 Mo → ~400 Ko gzip,
   `EX-DATA-109`) + bundle initial (≤ 300 Ko, `EX-NFR-10`). Total ≈ 900 Ko → **~1,8 s à 500 Ko/s** :
   sous le budget. **Le mode 1 sans filtre s'affiche sans aucune annonce individuelle chargée.**
2. En tâche de fond / à l'entrée en mode 2 : chargement du jeu de données local
   (`fetchListingColumns`, `EX-SRCH-9ter`), pour les distributions. Le bundle 3D est chargé ici en
   différé (`EX-NFR-11`).

C'est ce découplage « agrégats d'abord, annonces ensuite » qui rend `EX-NFR-9` faisable. Il n'est
possible **que parce que** l'interface sépare `fetchBaselineAggregates`/`fetchAggregates` (mode 1) de
`fetchListingColumns` (mode 2).

### 2.4 Index (EX-DATA-115) et élagage (EX-DATA-116)

Construits une fois à l'ingestion dans le worker : `PK_LISTING` (hachage UUID → indice),
`IDX_MAKE`/`IDX_MODEL` (offsets pour l'élagage), `IDX_PRICE_SORTED`, et cinq bitsets par valeur
(`fuel`, `body`, `region`, `country`, `transmission`). L'élagage `EX-DATA-116` fait passer le mode 2
en `O(m)` : Opel Corsa BE ≈ 1 281 annonces, facteur > 700 vs balayage complet. L'index taxonomique
par `bodyTypes` (`EX-DATA-115bis`) est la **condition** de la classe `R` du filtre `Carrosserie` sur
l'écran A.

### 2.5 Persistance client (inventaire exhaustif EX-NFR-24)

- **IndexedDB** : recherches sauvegardées (`EX-CRUD-1`, ≤ 50), modèles suivis (`EX-CRUD-7`, ≤ 30),
  historique récent (`EX-CRUD-11`, 10 FIFO), dernier snapshot en cache (`EX-NFR-22`).
- **`localStorage`** : préférences (langue, thème), et canal d'événement `storage` pour la
  concurrence inter-onglets (`EX-CRUD-19` : relecture-vérification-écriture avant chaque écriture,
  refus si plafond atteint entre-temps).
- **Migration** : `schemaVersion` par enregistrement (`EX-CRUD-18`), aucune suppression silencieuse.
- **R3** : aucun champ vendeur n'atteint jamais ce stockage — le filtrage a lieu à l'ingestion dans
  l'adaptateur `DataProvider` (`EX-NFR-26`, `P-2`).

---

## 3. Stratégie d'agrégation, chiffrée contre H5 (critère S3)

### 3.1 Le problème : 200 ms opposables face à un coût de calcul de ~540 ms à N = 10⁶

`EX-DATA-110` établit le **modèle de coût** à N = 10⁶, tous postes synchrones :

| Poste | Budget | Technique |
|---|---:|---|
| Balayage de sélection (tous filtres posés) | ≤ 60 ms | 1 passage séquentiel, ≈ 12 lectures de colonne typée/ligne |
| Regroupement marque + modèle | ≤ 40 ms | 5 250 accumulateurs (336 Ko, cache L2) |
| Quantiles exacts, sélection entière | ≤ 50 ms | tri par comptage sur entiers bornés, `O(n+R)` |
| Quantiles exacts, par groupe | ≤ 120 ms | tri par base LSD, `O(n)` cumulé |
| 3 histogrammes + grille densité | ≤ 20 ms | 1 passage, ≤ 676 + 78 compteurs |
| Détection M1 + M2 | ≤ 150 ms | M1 réutilise les quantiles ; M2 = 2 systèmes 3×3 par cellule |
| Facettes + sélections dérivées | ≤ 90 ms | masque « prédicats moins un » dans le balayage |
| **Cumul synchrone** | **≈ 540 ms** | — |

Ce **n'est pas** le budget de réponse (précision `R-A09`). Le budget opposable (`EX-NFR-5`) sépare
deux postes :

- **Recalcul des agrégats : ≤ 200 ms au 95ᵉ centile** ;
- **Facettes et sélections dérivées : différées d'au plus 100 ms** après l'affichage des chiffres
  principaux, compteurs affichant `…` pendant l'écart.

### 3.2 Comment on tient les 200 ms

Le budget de 200 ms couvre les postes **synchrones nécessaires à l'affichage des chiffres** :
balayage (60) + regroupement (40) + quantiles sélection (50) + histogrammes/densité (20) =
**≈ 170 ms**, sous 200. Les deux postes lourds restants sont sortis du chemin de 200 ms :

1. **Facettes (90 ms) → différées** de ≤ 100 ms (`EX-NFR-5`, `EX-DATA-110bis`). Elles s'accumulent en
   **un seul balayage** partagé (technique du masque de prédicats moins un) — interdiction formelle de
   relancer un balayage par filtre.
2. **Quantiles par groupe (120 ms)** ne sont requis que pour l'écran A (fourchettes par
   marque/modèle). En mode 2, l'**élagage** `EX-DATA-116` réduit N de 10⁶ à `m` (l'effectif du
   modèle, ~10³) : les 120 ms deviennent < 1 ms. En mode 1, les fourchettes de la **sélection vide**
   sont **précalculées** (`EX-DATA-109`, `fetchBaselineAggregates`) et servies sans calcul ; seules
   les sélections filtrées paient le regroupement, sur un N déjà réduit par le balayage.
3. **Détection M1+M2 (150 ms)** est un calcul de **mode 2 uniquement**, donc toujours sur `m` élagué,
   pas sur 10⁶.

Autrement dit : le cas à 10⁶ **sans filtre** est servi par le précalcul (0 balayage) ; le cas à 10⁶
**filtré** paie un balayage borné à 60 ms puis travaille sur une sélection réduite ; le mode 2 est
toujours élagué à `m ≈ 10³`. **Le seul chemin qui approcherait 200 ms est un mode 1 fortement filtré
sur 10⁶ lignes sans contrainte de taxonomie** — et il reste sous budget (170 ms), facettes exclues.

À la borne basse `N ≤ 10⁴` (`EX-DATA-113`), tous les budgets sont divisés par 100 (≤ 10 ms) : aucune
stratégie particulière. La conception est dimensionnée sur la borne haute ; le cas bas en découle.

### 3.3 Précalcul vs à la volée (EX-DATA-109) et exactitude (EX-DATA-111)

- **Précalculé et persisté** : agrégats marque/modèle de la sélection **vide** uniquement (1,7 Mo).
- **À la volée** : toute sélection filtrée. Précalculer les sélections filtrées est **impossible par
  construction** (`EX-DATA-109`) : ≥ 2¹⁰¹ combinaisons ; même les 10 filtres les plus courants à 5
  valeurs = 9,8 × 10⁶ jeux d'agrégats, plus volumineux que le snapshot. Le balayage borné est la
  seule stratégie qui reste bornée.
- **Cache LRU de 32 entrées** (`EX-DATA-109`, clé `(localDatasetKey, refineHash)` d'`EX-SRCH-9quinquies`)
  rend retour arrière et changement d'onglet `O(1)` (13 Mo).
- **Quantiles exacts, jamais approchés** (`EX-DATA-111`) : métriques entières bornées → tri par
  comptage/base en `O(n)`, l'exactitude ne coûte rien de plus qu'une approximation et préserve les
  invariants `I1`–`I8` (`EX-DATA-104`).

### 3.4 Mémoire (EX-DATA-112)

Enveloppe pire cas à N = 10⁶ ≈ **274 Mo** (44 Mo colonnes + 16 Mo identifiants + 172 Mo zone de
chaînes + 26 Mo tampons + 1,7 Mo agrégats + 1 Mo référentiels + 13 Mo cache), marge facteur 1,9 sous
512 Mo. La marge **ne laisse pas de place à un second snapshot** → « un seul snapshot actif »
(`EX-NAV-23`, `ARB-49`). Poste dominant : la zone de chaînes ; `listingUrl` étant reconstructible
depuis `listingId` chez la plupart des sources, c'est la première cible d'optimisation si nécessaire.

---

## 4. Rendu des graphes

### 4.1 Histogrammes G1–G3 et graphes catégoriels : SVG

Barres verticales ≤ 26 bins (`EX-SCR-145`…`148`), une couleur, axe des effectifs partant de 0
(`EX-SCR-19`). SVG est retenu : peu d'éléments, sélectionnables au clavier (`EX-NFR-14`), et chaque
histogramme est doublé d'une **table de données équivalente** (borne basse/haute/effectif par bucket)
satisfaisant WCAG 1.1.1 (`EX-NFR-15`). Budget `EX-NFR-6` ≤ 300 ms pour 100 000 annonces en entrée :
le binning est `O(n)` dans le worker, le rendu ne dessine que 26 rectangles. Bascule log
conditionnelle (`EX-SCR-16`, ratio ≥ 50) portée par un paramètre d'URL `g<n>log`.

### 4.2 Nuage G4 : Canvas 2D, échantillonnage déterministe

`G4` est une projection 2D commutable (`EX-SCR-151`) : `G4a` nuée empilée (défaut ≤ 400 annonces),
`G4b` nuage prix × année (défaut > 400). Encodages : couleur = année (`G4a`) ou km (`G4b`), aire du
disque ∝ km (rayon en racine, `EX-SCR-155`), opacité 55 % + contour 0,5 px pour dénombrer les
superpositions (`EX-SCR-157`).

- **Rendu** : SVG en deçà d'un seuil, **bascule automatique en Canvas 2D au-delà de 5 000 points**
  (`EX-SCR-157`). Canvas 2D tient les 5 000 points du plafond (`EX-DATA-100`) à 60 img/s sur machine
  de milieu de gamme — base même du plafond. `EX-NFR-7` (rendu initial ≤ 500 ms p95, ≤ 5 000 points)
  et `EX-NFR-8` (≥ 30 img/s en interaction) sont atteints sans WebGL, le thread principal étant libéré
  par le worker (§1.3).
- **Plafond et échantillonnage** : `K = 5 000` points (`EX-DATA-100`). L'échantillonnage est
  **déterministe et reproductible** (`EX-DATA-101`/`100bis`) : outliers conservés intégralement, reste
  échantillonné par pas régulier sur `listingId` (UUID v4 indépendant des trois axes → non biaisé),
  ou mélange `xoshiro128**` à graine constante `0x4B594341`. Aucun aléa non graine : la vue est
  identique d'une session à l'autre et testable octet à octet.
- **Couche de densité** (`EX-DATA-102`) : grille année × km (≤ 676 cellules) réutilisant **exactement**
  les bins de `BIN`, pour que la somme d'une colonne égale l'effectif du bin d'année (`I7`). Elle
  porte la forme au-delà de 5 000 points, là où les points s'arrêtent.
- **Liaison croisée** (`EX-SCR-158`/`184`) : le brossage rectangulaire surligne les mêmes annonces
  dans `G1`,`G2`,`G3`,`G7`,`G8`,`G10` et s'encode dans l'URL par les bornes d'axes `selx`/`sely`
  (`EX-NAV-10bis`), jamais par une empreinte.
- **Accessibilité** (`EX-NFR-15`, `EX-NFR-19`) : table des points sous-jacents + résumé textuel des
  outliers ; sous 768 px, projection 2D dégradée prix × km, année en couleur.

### 4.3 Contrainte transverse de rendu

Aucun axe d'effectif tronqué (`EX-SCR-19`) ; bornes d'histogramme par la grille `BIN` ; bornes des
graphes non-histogrammes (`G4`,`G7`,`G10`) à `Q(0,01)`/`Q(0,99)` (`EX-SCR-18`), points hors bornes
jamais supprimés mais portés sur la bordure avec marqueur de dépassement.

---

## 5. Gestion d'état et synchronisation URL

### 5.1 L'URL comme état, scindée T / R

L'état de filtres se décompose (`EX-SRCH-9bis`) en deux composantes disjointes :

- **Composante `T`** (filtres de classe `T`) → sérialisée et hachée en `localDatasetKey`
  (`EX-SRCH-9ter`) → **détermine le jeu de données local** → **un appel `fetchListingColumns`, et un
  seul**, par valeur distincte, réponse mise en cache `(snapshotId, localDatasetKey)` LRU 4 entrées.
- **Composante `R`** (filtres de classe `R`) → hachée en `refineHash` → **appliquée en mémoire** sur
  le jeu local, sans réseau, cible ≤ 150 ms.

`selectionHash = (localDatasetKey, refineHash)` (`EX-SRCH-9quinquies`). Deux états qui ne diffèrent
que par leur composante `R` partagent leur jeu de données et ne recalculent que les agrégats.

### 5.2 Codec d'URL canonique

- **Noms de paramètres** : ceux relevés sur AutoScout24, sans renommage (`EX-NAV-5`), sauf concepts
  propres KYCAR (`make` du mode 1). Multi-valeurs jointes par virgule, occurrence unique
  (`EX-NAV-6`) ; intervalles en jumeaux `from`/`to` inclusifs (`EX-NAV-7`) ; défaut jamais émis
  (`EX-NAV-8`).
- **Ordre canonique alphabétique** (`EX-NAV-9`) : un état → une seule chaîne, condition de la
  déduplication des recherches sauvegardées et des tests d'égalité stricte.
- **Plafond 2 000 caractères** (`EX-NAV-10`) : dépassement **refusé** avec message, jamais tronqué
  (`EX-NAV-11`) ; 77 filtres larges ≈ 1 720 caractères, marge réelle mais finie.
- **Paramètres d'état d'interface** (`EX-NAV-10bis`) : `m`, `g<n>log`, `grp`, `mk`, `sort`, `g4v`,
  `selx`/`sely`, mêmes règles d'ordre et de défaut.
- **Table de corrections au chargement** (`EX-NAV-21`, 5 classes) : valeur corrigée → `replaceState`
  + bandeau non bloquant `ET-URL-CORRIGEE` nommant le paramètre. Jamais silencieux (A-04).

### 5.3 Historique et débounce

- **Une entrée d'historique par filtre appliqué** (post-debounce) via `pushState` ; paramètres d'UI
  en `replaceState` (`EX-NAV-12`).
- **Regroupement des rafales < 800 ms** en une seule entrée (`EX-NAV-13`), minuterie unique partagée
  avec le débounce de recalcul.
- **Débounce par type de contrôle** (`EX-SRCH-1`…`8`) : cases 0 ms, `eq` 250 ms, curseur 150 ms,
  champ numérique 500 ms, texte 400 ms, code postal 500 ms. Regroupement des rafales `R` au 3ᵉ
  changement en 300 ms (`EX-SRCH-1bis`), au plus un recalcul en attente, jamais de file.
- **Deep-linking pur** (`EX-NAV-18`) : le rendu est fonction pure de l'URL, testable par aller-retour
  état → URL → état.

### 5.4 Cycle de vie du snapshot

Un seul snapshot actif (`EX-NAV-23`), acquis au démarrage et remplacé sur action `Rafraîchir`
seulement (`ARB-49`). Le remplacement (`EX-NAV-24`) vide les caches de sélection et de jeux locaux,
recalcule les agrégats de base, vide `CompareSelection`, mais **conserve** les trois entités CRUD
(elles portent des URL, pas des données de snapshot). Échec du provider : 5 000 ms de délai, 3
réessais 1s/2s/4s (`EX-NFR-21`), repli sur dernier cache (`EX-NFR-22`), erreur jamais présentée comme
résultat vide (`EX-NFR-23`).

---

## 6. Interface `DataProvider`

**Écrite en TypeScript, complète et commentée, dans [`DataProvider.ts`](DataProvider.ts)** — reprise
telle quelle par le lot D2 (critère S2). Ce qui suit en explique la structure ; le fichier fait foi.

### 6.1 Ce que l'interface garantit

- **R2 / S2** : unique porte d'entrée des données ; aucun code métier ne connaît la source. Changer
  d'AutoScout24 à 2dehands est un changement d'implémentation (`DECISION-coordinateur-source.md`).
- **R3 / P-2 / EX-NFR-26** : filtrage des 14 champs vendeur **à l'ingestion**, dans l'adaptateur. Le
  type `ListingColumnBatch` n'a, par construction, aucune colonne pour les accueillir.
- **Vocabulaire canonique** : les valeurs qui traversent l'interface sont déjà normalisées vers le
  dictionnaire KYCAR ; la re-cartographie du vocabulaire source est interne à l'adaptateur.

**Amendement 2.6 — `unsupportedFilterIds`** (`D-03`, `D-33`, `fix-foundation` étape 0) :
`AggregateResult<T>` (retour de `fetchAggregates` et `fetchBaselineAggregates`) porte désormais un
champ **obligatoire** `unsupportedFilterIds: readonly string[]`, listant les identifiants de
filtre du registre que l'implémentation n'a pas pu appliquer sur cette sélection.
`fetchSelectionCount` garde `Promise<number>` inchangé — une primitive ne peut pas porter de champ
— et documente qu'un consommateur cherchant la même information lit celle exposée par
`fetchAggregates`/`fetchBaselineAggregates` (`D-33`). Le contrôleur (`data-controller.ts`) ne
publie jamais un effectif présenté comme filtré quand cette liste est non vide : état dégradé
`ET-FILTRE-NON-APPLIQUE` nommant les filtres écartés, `hasUserFilters` ne reflétant que les
filtres effectivement appliqués. [amendée 2.6 — D-03]

### 6.2 Séparation mode 1 / mode 2 — le pivot (critère S2)

| | Mode 1 — agrégats | Mode 2 — échantillon fin |
|---|---|---|
| Méthodes | `fetchBaselineAggregates`, `fetchAggregates`, `fetchSelectionCount` | `fetchListingColumns?`, `fetchListingsByIds?` |
| Obligatoire ? | **Oui, pour tout provider** | **Non** — méthodes optionnelles |
| Déclaration | toujours servi | `capabilities.mode2 : SERVED \| UNAVAILABLE(reason, fallback)` |
| Matière | effectifs + fourchettes (`totalResultCount` exhaustif suffit) | annonces individuelles non biaisées (histogrammes, nuage, M1/M2) |

Un provider **déclare** son service du mode 2 par l'union discriminée `Mode2Capability`. Quand
`kind === 'UNAVAILABLE'`, `fetchListingColumns` est **absente** et l'orchestration bascule sur le
provider synthétique de repli (`fallback: 'SYNTHETIC'`, `EX-DATA-107`) ou affiche l'indisponibilité.
Le garde de type `servesMode2()` interdit tout appel de `fetchListingColumns` sans cette garantie.

### 6.3 Les trois implémentations (critère S2 : « au moins trois »)

| Implémentation | Lot | `sourceKind` | `mode1.source` | `mode2` |
|---|---|---|---|---|
| `SyntheticDataProvider` | D3 | `SYNTHETIC` | `LISTINGS` | `SERVED` (dataset complet, outliers injectés) |
| `TweedehandsDataProvider` | D9 | `REAL` | `AGGREGATE_SURFACE` | `UNAVAILABLE('BIASED_SAMPLE', fallback:'SYNTHETIC')` |
| `AutoScout24PaidDataProvider` | futur | `REAL` | `LISTINGS` | `SERVED` (sous contrat) |

`TweedehandsDataProvider` **sert les agrégats sans servir l'échantillon non biaisé** — exactement la
distinction que la contrainte du chantier 1 impose à l'architecture. Il satisfait le mode 1 par sa
surface `__NEXT_DATA__` autorisée (`totalResultCount` exhaustif) et refuse le mode 2 (pagination
plafonnée ~5 010, ~95 % promue). L'application reste entièrement fonctionnelle : mode 1 réel, mode 2
sur dataset synthétique étiqueté.

**Résolution 2.6 — D-29 (réconciliation avec §9.3).** §9.3 exige un précalcul mis en cache pour les
agrégats de base ; le tableau ci-dessus, lu à la lettre, ne décrivait qu'« un aller réseau par
appel » pour `mode1.source = AGGREGATE_SURFACE`, sans dire comment ce provider tient malgré tout la
contrainte. Les deux textes sont réconciliés ainsi, sans changer les lignes du tableau : un
provider `LISTINGS` (`SyntheticDataProvider`, `AutoScout24PaidDataProvider`) précalcule sa baseline
**une fois à l'ingestion**, la met en cache IndexedDB, et ne la recalcule **jamais** à `start()` ;
un provider `AGGREGATE_SURFACE` (`TweedehandsDataProvider`) fait bien **un aller réseau par
appel**, mais met sa baseline en cache IndexedDB **après le premier succès** et la lit **d'abord**
aux appels suivants — l'aller réseau n'est donc payé qu'une fois par session, pas à chaque
`fetchBaselineAggregates`. Les deux stratégies satisfont §9.3 par des moyens différents, adaptés à
ce que chaque type de source peut précalculer.

### 6.4 Décompte des méthodes

**8 méthodes** : 3 de cycle de vie/capacités (`describe`, `openSnapshot`, `closeSnapshot`), **3 de
mode 1** obligatoires (`fetchBaselineAggregates`, `fetchAggregates`, `fetchSelectionCount`), **2 de
mode 2** optionnelles (`fetchListingColumns`, `fetchListingsByIds`). Plus le garde `servesMode2()`.

---

## 7. Découpage des lots D1–D9 (critère S4)

Reprise et affinage du découpage prévisionnel du PLAN-2. Graphe **acyclique** (§7.2). Critères de
succès **génériques** (S1–S5 du PLAN-2 §2.4) applicables à chaque lot, plus les critères
**spécifiques exécutables** ci-dessous.

### 7.1 Lots

#### D1 — Échafaudage
- **Périmètre** : projet Vite + TS strict, ESLint, Vitest, tokens de design (couleurs conformes
  `EX-NFR-13` contraste), `@media print` minimale (`EX-NFR-31`), squelette Web Worker.
- **Exigences** : socle de `EX-NFR-10`/`11` (budgets mesurés en CI), `EX-NFR-12`/`13` (a11y de base),
  `EX-NFR-17`/`18` (navigateurs, points de rupture).
- **Succès exécutables** : `build` vert 0 erreur/0 warning TS ; `lint` vert ; un test bidon passe ;
  la CI **échoue** si le bundle initial dépasse 300 Ko gzip (garde `EX-NFR-10` posée dès D1).
- **Modèle / effort** : **Sonnet / medium**. Dépend de : —.

#### D2 — Schéma, types, validation, `DataProvider`
- **Périmètre** : les 13 entités (`EX-DATA-105`) en types TS, colonnes typées + sentinelles
  (`EX-DATA-119`/`120`), validation de schéma exécutable + les 8 invariants (`EX-DATA-104`),
  **`DataProvider.ts` repris de la phase 2.3**, codec `selectionHash`/`localDatasetKey`
  (`EX-DATA-108`, `EX-SRCH-9ter`/`quinquies`), chargeur des référentiels statiques.
- **Exigences** : `EX-DATA-1…82` (dictionnaire), `EX-DATA-105`…`123bis`, S2 de la phase 2.3.
- **Succès exécutables** : validation de schéma rejette un enregistrement portant un champ R3
  (`P-1`) ; `selectionHash` d'une permutation de filtres est identique octet à octet (`EX-DATA-108`) ;
  la mock-impl de `DataProvider` compile et satisfait `servesMode2()` selon sa capacité déclarée.
- **Modèle / effort** : **Opus / high**. Dépend de : 2.3, D1.

#### D3 — Générateur de dataset synthétique
- **Périmètre** : `SyntheticDataProvider` (`LISTINGS`, `SERVED`), distributions plausibles par
  marque/modèle/année, **outliers injectés volontairement** (matière des tests de détection),
  `sourceKind = SYNTHETIC` propagé (`EX-DATA-107`).
- **Exigences** : `EX-DATA-107`, `EX-NFR-1`/`3` (100 000 annonces ≤ 25 Mo / ≤ 6 Mo gzip),
  `EX-DATA-111` (métriques entières bornées).
- **Succès exécutables** : génère 100 000 annonces sous les cibles de taille ; les outliers injectés
  sont retrouvés par M1/M2 (contrôle croisé avec D4) ; déterministe à graine fixée.
- **Modèle / effort** : **Opus / high**. Dépend de : D2.

#### D4 — Moteur d'agrégation
- **Périmètre** : balayage colonnaire, index + élagage (`EX-DATA-115`/`116`), agrégats marque/modèle,
  buckets (`BIN`), statistiques, quantiles exacts (`EX-DATA-111`), facettes en un balayage
  (`EX-DATA-110bis`), détection M1/M2 (+ M3 contrôle), densité, cache LRU 32, exécution **dans le
  worker**, tests de performance.
- **Exigences** : `EX-DATA-83…120`, `EX-DATA-104` (I1–I8), `EX-NFR-5`/`6` (budgets), `EX-SRCH-9*`.
- **Succès exécutables** : les 8 invariants passent sur le dataset D3 ; recalcul agrégats **≤ 200 ms
  p95** mesuré sur 100 exécutions à N = 100 000 (`EX-NFR-4bis`) ; facettes différées ≤ 100 ms ;
  quantiles exacts vérifiés contre valeurs connues (`n = 0,1,3`) ; test `EX-NAV-11` (refus d'URL > 2 000
  caractères avec message).
- **Modèle / effort** : **Opus / high**. Dépend de : D2. (Parallélisable avec D3, D5.)

#### D5 — Bandeau de filtres + état + URL
- **Périmètre** : les 77 filtres retenus (`filters-scope.json`), hiérarchie primaire/secondaire, codec
  d'URL canonique, scission T/R, historique/débounce, sélecteur marque/modèle (écran G), corrections
  d'URL (`EX-NAV-21`), table de surcharge FR (`EX-NFR-29`/`30`).
- **Exigences** : `EX-NAV-*`, `EX-SRCH-*`, `EX-SCR-*` du bandeau (C1), `EX-NFR-14` (clavier),
  `EX-NFR-28`/`30` (fr-BE, 0 libellé non traduit).
- **Succès exécutables** : aller-retour état → URL → état égal au caractère près pour les 77 filtres ;
  60 filtres posés → URL rechargeable (`EX-SCR-102`) ; contrôle `EX-NFR-30` (0 code brut affiché) ;
  navigation 100 % clavier (axe-core 0 violation A/AA sur le bandeau).
- **Modèle / effort** : **Sonnet / high**. Dépend de : D2. (Parallélisable avec D3, D4.)

#### D6 — Écran A (survol marché) + sélecteur G
- **Périmètre** : cartes-marques, zones-modèles, compteurs et fourchettes `[p05,p95]`/`[min,max]`
  (`A-05`/`R-A05`), tri (`sort`), repliement, seuils d'effectif (4 paliers), états, responsive, écran
  G (modale sélecteur 295 marques / 4 955 modèles).
- **Exigences** : `EX-SCR-*` écran A, `EX-DATA-69`/`70`/`72`, `EX-SRCH-26` (seuil 60 marques).
- **Succès exécutables** : rendu conforme à la maquette structurelle (inspection dirigée) ; `[p05,p95]`
  étiqueté « fourchette centrale » partout où il apparaît ; export CSV agrégats (`EX-CRUD-15`) sans
  champ R3 ; 6 états rendus.
- **Modèle / effort** : **Sonnet / high**. Dépend de : D4, D5.

#### D7 — Écran B (distribution) + G4 3D + écran D (liste)
- **Périmètre** : histogrammes G1–G3 (SVG), nuage G4 (Canvas 2D, échantillonnage déterministe,
  brossage, liaison croisée), graphes additionnels retenus (G5–G15), écran D (table d'annonces, tri,
  pagination client 50 lignes), étiquetage base de comparaison (`EX-SCR-158bis`), export CSV
  (`EX-CRUD-16`), bundle 3D en code-splitting.
- **Exigences** : `EX-SCR-*` écrans B et D, `EX-DATA-98…103` (nuage), `EX-NFR-6`/`7`/`8`/`11`/`15`/`19`.
- **Succès exécutables** : nuage ≤ 5 000 points rendu ≤ 500 ms p95 (`EX-NFR-7`) ; rotation/zoom ≥ 30
  img/s dans ≥ 95 % des fenêtres de 1 s sur 10 s (`EX-NFR-8`) ; échantillonnage identique octet à
  octet entre deux permutations (`EX-DATA-100bis`) ; bundle 3D hors bundle initial, ≤ 400 Ko
  (`EX-NFR-11`) ; table équivalente présente (`EX-NFR-15`).
- **Modèle / effort** : **Opus / high**. Dépend de : D4, D5.

#### D8 — Intégration, routage, états dégradés, perf, a11y, écrans C/E/F, mentions
- **Périmètre** : routeur (6 routes, redirections canoniques `EX-SCR-140`), coquille S0, écrans C
  (comparaison), E (recherches sauvegardées), F (modèles suivis), page `/mentions`, CRUD complet +
  concurrence inter-onglets (`EX-CRUD-19`), migration (`EX-CRUD-18`), états dégradés (6 par écran),
  campagne de performance et d'accessibilité globale.
- **Exigences** : `EX-NAV-1…4`, `EX-CRUD-*`, `EX-NFR-9`/`12`/`16`/`20…27`/`31`, états `EX-SCR-*`.
- **Succès exécutables** : premier affichage mode 1 ≤ 2 000 ms en 4G simulée (`EX-NFR-9`) ; axe-core 0
  violation A/AA sur les deux écrans (`EX-NFR-16`) ; les deux parcours cibles se déroulent de bout en
  bout ; repli `EX-NFR-22` déclenché sur échec provider simulé.
- **Modèle / effort** : **Sonnet / high**. Dépend de : D1–D7.

#### D9 — Adaptateur réel 2dehands (`TweedehandsDataProvider`)
- **Périmètre** : implémentation `DataProvider` mode 1 sur surface `__NEXT_DATA__` autorisée,
  re-cartographie du vocabulaire 2dehands → dictionnaire KYCAR, filtrage R3 à l'ingestion, `mode2`
  déclaré `UNAVAILABLE('BIASED_SAMPLE', fallback:'SYNTHETIC')`, respect de son `robots.txt` (pas
  d'API interne `/lrp/api/`).
- **Exigences** : R2, `P-2`/`P-5`, `EX-NFR-26`, `EX-DATA-107`, contrainte du chantier 1.
- **Succès exécutables** : aucun champ R3 dans la sortie (`P-1`) ; `servesMode2()` renvoie `false` ;
  mode 1 réel affiché, mode 2 bascule sur synthétique étiqueté ; aucun appel hors préfixes autorisés.
- **Modèle / effort** : **Sonnet / high**. Dépend de : chantier 1 (conclu), D2. **Facultatif**, branché
  dès D2 disponible.

### 7.2 Graphe de dépendances (acyclique — critère S4)

```
                 D1 (échafaudage)
                  │
                  v
                 D2 (schéma, types, DataProvider)
        ┌─────────┼─────────┬─────────────────┐
        v         v         v                 v
       D3        D4        D5                 D9  (facultatif, // dès D2)
    (synth)   (moteur)   (bandeau)
        │         │         │
        │         ├────┬────┤
        │         v    v    v
        │        D6    │   (D6 = D4 + D5)
        │      (écran A)│
        │         │    D7  (D7 = D4 + D5)
        │         │  (écran B/D)
        │         v    v
        └───────> D8 <─┘   (D8 = D1..D7)
              (intégration)
```

**Ordonnancement.** D1 seul → D2 → **D3 ∥ D4 ∥ D5** (parallèles) → **D6 ∥ D7** (parallèles) → D8.
**D9** est branché dès que D2 est disponible et tourne en parallèle de tout le reste (il ne dépend que
de l'interface, pas des écrans). Aucun cycle : chaque arête va d'un lot antérieur vers un lot
postérieur dans l'ordre topologique `D1 < D2 < {D3,D4,D5,D9} < {D6,D7} < D8`.

---

## 8. Matrice choix technique → exigence justificatrice

| # | Choix technique | Exigence(s) justificatrice(s) | En un mot |
|---|---|---|---|
| 1 | 100 % client, pas de backend | `EX-DATA-112` (274 Mo < 512, ×1,9), `EX-NFR-25`, `EX-CRUD-3` | la mémoire suffit, le serveur nuirait |
| 2 | TypeScript strict | S2 (phase 2.3), `EX-DATA-120`, `EX-DATA-104` | sentinelles et invariants typés |
| 3 | Preact + Vite | `EX-NFR-10` (≤ 300 Ko), `EX-NFR-11` | budget bundle serré |
| 4 | Calcul en Web Worker | `EX-NFR-5` (200 ms) vs `EX-NFR-8` (30 img/s) | recalcul et rendu ne se disputent pas le thread |
| 5 | Modèle colonnaire `TypedArray` | `EX-DATA-119` (facteur 7–27), `EX-DATA-110` (60 ms) | balayage borné |
| 6 | Sentinelles typées `-1`/`255` | `EX-DATA-120` | `0` est une valeur légitime |
| 7 | Chargement progressif agrégats→annonces | `EX-NFR-9` (2 s en 4G), `EX-DATA-109` | premier affichage sans les listings |
| 8 | Précalcul sélection vide seulement | `EX-DATA-109` (≥ 2¹⁰¹ combinaisons) | précalculer le filtré est impossible |
| 9 | Quantiles exacts par tri comptage/base | `EX-DATA-111`, `EX-DATA-104` | exact = même coût, invariants tenables |
| 10 | Élagage IDX_MAKE/MODEL | `EX-DATA-116` (facteur > 700) | mode 2 toujours sur `m`, pas 10⁶ |
| 11 | Facettes différées ≤ 100 ms | `EX-NFR-5`, `EX-DATA-110bis` | sortir 90 ms du chemin des 200 ms |
| 12 | Cache LRU 32 `(localDatasetKey, refineHash)` | `EX-DATA-109`, `EX-SRCH-9quinquies` | retour arrière `O(1)` |
| 13 | Histogrammes SVG | `EX-NFR-6`, `EX-NFR-15` | peu d'éléments, accessible |
| 14 | Nuage Canvas 2D, pas de WebGL | `EX-NFR-7`/`8`, `EX-DATA-100`, `EX-SCR-157` | 5 000 points à 60 img/s sans lib lourde |
| 15 | Échantillonnage déterministe graine fixe | `EX-DATA-100bis`/`101` | vue reproductible et testable |
| 16 | URL = état, codec canonique maison | `EX-NAV-18`/`9`, `EX-NFR-10` | pureté de rendu, pas de lib state |
| 17 | Scission T/R de l'état de filtres | `EX-SRCH-9bis`/`ter` | un appel provider par jeu local |
| 18 | Débounce/historique minuterie unique | `EX-NAV-13`, `EX-SRCH-1bis` | 800 ms sert recalcul et historique |
| 19 | IndexedDB + `localStorage` + `storage` | `EX-CRUD-3`/`18`/`19`, `EX-NFR-22`/`24` | local, migrable, concurrent |
| 20 | `DataProvider` : mode 1 obligatoire / mode 2 optionnel | S2, R2, `EX-DATA-107`, chantier 1 | 3 implémentations, source invisible |
| 21 | Filtrage R3 à l'ingestion dans l'adaptateur | `P-2`, `EX-NFR-26`, R3 | le champ vendeur n'entre jamais |

---

## 9. Endroits où une exigence gelée paraît en tension dans le budget

**Signalés, non contournés en silence** (comme demandé). Aucun n'est bloquant pour l'architecture ; les
deux premiers sont des **contradictions inter-annexes résiduelles** que le stress-test 2.2 n'a pas
attrapées parce qu'elles vivent à la frontière A/B, exactement le mode de défaillance décrit en
conclusion de REQUIREMENTS §13.

### 9.1 `EX-NFR-8` parle de « rotation » d'un nuage 3D que l'annexe B ne dessine pas

`EX-NFR-8` (annexe C) mesure « aucune fenêtre glissante de 1 s ne descend sous 30 img/s dans au moins
95 % des fenêtres d'une **rotation continue de 10 s** », et `EX-NFR-15` parle du « nuage
tri-dimensionnel ». Mais l'annexe B — **autorité sur l'encodage graphique** (R-A09) — spécifie `G4`
comme deux **projections 2D commutables** (`EX-SCR-151`…`156`) : nuée empilée et nuage prix × année,
3ᵉ/4ᵉ dimensions en couleur et taille, avec zoom par boutons et `Maj`+glisser, **aucune rotation
d'une scène 3D**. Il n'existe aucune vue rotative dans la disposition normative.

- **Lecture retenue** (cohérente avec R-A09) : « rotation » d'`EX-NFR-8` se lit comme
  **interaction continue (pan/zoom)** sur la projection 2D ; la cible 30 img/s s'y applique et est
  tenue par Canvas 2D + worker. C'est ce que l'architecture implémente.
- **Risque** : si le commanditaire attend littéralement une scène 3D rotative, il faut **amender
  l'annexe B** (nouvelle vue `G4c` WebGL) et le budget `EX-NFR-11` couvrirait un `three.js` différé.
  Ce serait un changement d'exigence, pas d'architecture. **À trancher avant D7.**

**Résolution 2.6 — D-07.** Le fix-lead retient la lecture « interaction continue (pan/zoom) », pas
l'ajout d'une vue `G4c` WebGL. `EX-NFR-8` et `EX-NFR-15` sont **réécrites** en ce sens (annexe C) :
elles mesurent une interaction continue de pan/zoom sur les deux projections 2D commutables de
`G4`, jamais une rotation de scène 3D. `EX-NFR-11` reste sans objet, garde posée mais inactive
(aucun bundle 3D différé n'existe). Le `Maj`+glisser relevé absent ci-dessus est implémenté par
fix-screens à sa sévérité propre, hors du périmètre de cette résolution.

### 9.2 Plafond du nuage : `EX-DATA-100` dit 5 000, l'annexe B évoque 20 000

`EX-DATA-100` (annexe A, autorité sur la formule) fixe **`K = 5 000` points tracés au maximum**, avec
justification (au-delà la nuée sature, la forme passe à la couche de densité). Mais `EX-SCR-157` prévoit
une bascule SVG→Canvas « au-delà de 5 000 points » **et** un bandeau `ET-TROP-RESULTATS` « au-delà de
20 000 points », et le §6.7 de l'annexe B écrit « `G4` trace 20 000 points échantillonnés ». Ces
seuils de 20 000 sont **inatteignables** si `K = 5 000` est un plafond dur.

- **Lecture retenue** (R-A09 : la formule fait foi) : **`K = 5 000` gouverne** ; les seuils de
  20 000 de l'annexe B sont **du code mort** et doivent être retirés ou requalifiés (ils s'appliquaient
  peut-être à une version antérieure sans plafond). L'architecture implémente 5 000.
- **Action** : signaler à la remédiation (2.6) pour aligner l'annexe B sur `EX-DATA-100`. Sans risque
  fonctionnel tant que D7 code `K = 5 000`.

**Résolution 2.6 — D-08.** `EX-SCR-157` est **requalifiée** : `K = 5 000` gouverne seul, avec la
mention d'échantillonnage d'`EX-DATA-103` au-delà de ce seuil. Le bandeau `ET-TROP-RESULTATS` et
tout seuil à 20 000 sont **supprimés pour le nuage `G4`** — de `EX-SCR-157`, d'`EX-SCR-177` et du
§6.7 de l'annexe B (DR-146). C'est une requalification documentaire : aucune ligne de code n'est
ajoutée ni retirée pour ce constat, D7 codait déjà `K = 5 000`.

### 9.3 `EX-NFR-9` (2 s en 4G) n'est tenable qu'avec le chargement progressif — et reste serré

À N = 10⁶ avec un provider `LISTINGS`, le snapshot d'annonces pèse trop pour être téléchargé en 2 s.
`EX-NFR-9` ne vise que le **premier affichage du mode 1**, servi par les agrégats de base précalculés
(§2.3) : taxonomie (~200 Ko gzip) + agrégats (~400 Ko gzip) + bundle (300 Ko) ≈ 900 Ko → **~1,8 s à
500 Ko/s**. **Faisable, mais la marge est mince** (~200 ms). Deux garde-fous sont donc **obligatoires**
et posés comme contrainte d'architecture, pas comme optimisation :

1. `fetchBaselineAggregates` **doit** renvoyer des agrégats précalculés compressés, jamais recalculés
   au chargement ;
2. les annonces individuelles **ne doivent jamais** être sur le chemin critique du premier affichage
   (chargement en tâche de fond / à l'entrée en mode 2).

Si un provider `LISTINGS` ne peut pas précalculer les agrégats de base côté source, l'ingestion doit
les calculer **une fois** et les mettre en cache (IndexedDB) — sinon `EX-NFR-9` tombe. Ce n'est pas
une infaisabilité, c'est une **contrainte non négociable** sur l'implémentation des providers, à
inscrire au lot D2/D3/D9.

**Résolution 2.6 — D-29.** La tension doctrinale avec §6.3 (« `AGGREGATE_SURFACE` fait un aller
réseau par appel », lu à la lettre, contre le précalcul + cache exigé ici) est réconciliée en §6.3 :
un provider `LISTINGS` précalcule sa baseline à l'ingestion et ne la recalcule jamais à `start()` ;
un provider `AGGREGATE_SURFACE` fait un aller réseau par appel mais met sa baseline en cache
IndexedDB après le premier succès et la lit d'abord ensuite — l'aller réseau n'est payé qu'une fois
par session. DR-049 (le provider synthétique recalculait sa baseline à `start()`) est corrigé par
fix-providers : baseline précalculée, annonces individuelles générées en tâche de fond, hors du
chemin critique du premier affichage. DR-050 (296 requêtes séquentielles du provider réel) est
corrigé par fix-providers via ce cache.

### 9.4 Note mineure — dettes de données ouvertes (non architecturales)

Rappel des dettes déjà consignées, sans incidence sur la pile : table postale belge `[EXTRAPOLÉ]`
(`EX-DATA-53`), table carburant création→recherche (`EX-DATA-10`), graphes CO₂/consommation/boîte en
dette faute de champ source (`A-08`). Elles se soldent par un adaptateur portant le champ, pas par un
choix d'architecture.

---

*Fin du document. Livrables de la phase 2.3 : ce fichier + [`DataProvider.ts`](DataProvider.ts).*
