
---

## 3. Taux de couverture chiffré

### 3.1 Par annexe et global (485 exigences v1.1)

| Périmètre | Total | COUVERTE | PARTIELLE | NON COUVERTE | HORS PÉRIMÈTRE | Taux COUVERTE | Taux hors « hors périmètre » |
|---|---:|---:|---:|---:|---:|---:|---:|
| Annexe A — `EX-DATA` | 140 | **113** | 19 | 5 | 3 | **80,7 %** | 82,5 % |
| Annexe B — `EX-SCR` | 231 | **131** | 76 | 22 | 2 | **56,7 %** | 57,2 % |
| Annexe C — `EX-NAV` | 28 | 23 | 4 | 1 | 0 | 82,1 % | 82,1 % |
| Annexe C — `EX-SRCH` | 34 | 25 | 5 | 0 | 4 | 73,5 % | 83,3 % |
| Annexe C — `EX-CRUD` | 20 | 20 | 0 | 0 | 0 | 100 % | 100 % |
| Annexe C — `EX-NFR` | 32 | 23 | 9 | 0 | 0 | 71,9 % | 71,9 % |
| **Annexe C — total** | 114 | **91** | 18 | 1 | 4 | **79,8 %** | 82,7 % |
| **Global v1.1** | **485** | **335** | **113** | **28** | **9** | **69,1 %** | **70,4 %** |
| `P-1…P-6` (REQ §10) | 6 | 6 | 0 | 0 | 0 | 100 % | 100 % |

Lecture : les couches spécifiées par les annexes A et C (données, moteur, URL, CRUD, NFR) sont
prouvées à ~80 % ; l'annexe B, qui décrit ce que l'utilisateur voit, tombe à 57 % parce que le
câblage de la coquille (D8) n'a été éprouvé que par des tests sans DOM ni Worker réel.

### 3.2 Les 141 `PARTIELLE`/`NON COUVERTE`, une par une

**(a) Dettes motivées par une décision 2.6 ou un point ouvert externe — 21 exigences**, citées
avec leur décision :

| Décision | Exigences |
|---|---|
| D-17 (DR-034, GROUPSTAT/NTILE hors worker) | `EX-DATA-83bis`, `EX-DATA-83ter`, `EX-DATA-83quater`, `EX-DATA-83quinquies` |
| D-38 (DR-082, colonne TVA) | `EX-SCR-203` (également touchée par FV-01) |
| D-40 (DR-143, grille compacte 4 lignes) | `EX-SCR-135` |
| D-45 (DR-114, verdicts `INSUFFICIENT_*`) | `EX-DATA-85` |
| DR-112 (§6.5, table postale `[EXTRAPOLÉ]`, E5) | `EX-DATA-53`, `EX-DATA-54`, `EX-DATA-126` |
| DR-122 (§6.5, entités `MetricStats`/`MakeAggregate`) | `EX-DATA-17`, `EX-DATA-43`, `EX-DATA-61`, `EX-DATA-64`, `EX-DATA-68` — **élargie** : `coverageWarning`, `samplingBias`, `adTierDistribution` manquent aussi, et l'absence de `modelCount` a un effet visible (FV-02), contrairement au motif « aucun effet visible » de la dette |
| DR-132 (§6.5, libellés forgés) | `EX-NFR-29` |
| DR-134 (§6.5, Levenshtein) | `EX-SCR-80` |
| O15 (donnée `bodyTypes` à fournir) | `EX-DATA-115bis`, `EX-SCR-221` |
| D-03 / O7 (`eq` non applicable localement, inapplication signalée) | `EX-SRCH-12` |
| D-14 (périmètre R3, `NNxx` non affichable) | `EX-SCR-9` |

**(b) Non mesurables dans cet environnement, renvoyées à la campagne 2.9 ou à une sonde 2.8 — 17
exigences** : `EX-SCR-21`, `25`, `56`, `87`, `100`, `124`, `127`, `171`, `180`, `181`, `186`, `190`,
`199` (mesures au rendu), `EX-SCR-174`, `EX-SRCH-14` (comportements non atteints, à sonder),
`EX-NFR-6`, `EX-NFR-14` (mesure au rAF, parcours clavier réel). Aucune n'est un défaut prouvé.

**(c) Points d'instruction sans défaut — 3 exigences** : `EX-DATA-110` (table de coûts à 10⁶ non
mesurable, budget opposable `EX-NFR-5` tenu), `EX-DATA-115` (bitsets construits mais inutilisés,
consigné dans la sonde D4), `EX-SCR-177` (seuil 20 000 inatteignable sur le jeu).

**(d) Écarts non consignés — 100 exigences — entrées de la phase 2.8**, regroupées par constat
(détail au §7) :

| Constat | Exigences touchées |
|---|---|
| FV-01 (tampon détaché, mode 2) | `EX-SCR-142`, `151`, `158`, `161`, `164`, `165`, `166`, `167`, `168`, `203`, `EX-NFR-15` |
| FV-02 (zones-modèles absentes, « 0 modèles ») | `EX-DATA-71`, `EX-SCR-22`, `106`, `107`, `109`, `112`, `113`, `122`, `138` |
| FV-03 (corrections d'URL silencieuses) | `EX-NAV-21`, `EX-NAV-22`, `EX-SCR-38bis`, `EX-SCR-39` |
| FV-04 (`mmmv` : clic en-tête, redirection, réinjection, jeton brut) | `EX-SCR-51`, `104`, `110`, `EX-SCR-75`, `EX-NAV-16`, `EX-NFR-30` |
| FV-05 (écran G sans effectifs) | `EX-SCR-216` |
| FV-06 (facettes jamais affichées) | `EX-SCR-65`, `89`, `90` |
| FV-07 (C3 et représentativité absents de B, C3 doublé sur A) | `EX-SCR-31`, `38`, `175`, `182`, `210`, `EX-SRCH-9quater` |
| FV-08 (mode « Modèle non identifié ») | `EX-SCR-113bis` |
| FV-09 (fourchettes « — » pour n ≤ 11) | `EX-SCR-114`, `134` |
| FV-10 (R² absent, libellé de G8) | `EX-DATA-93bis`, `EX-SCR-164` |
| FV-11 (notes d'exclusion) | `EX-SCR-178`, `EX-SCR-39` |
| FV-12 (texte v1.1 non amendé D-14/D-15/D-07) | `EX-SCR-59`, `82`, `83` |
| FV-13 (impression) | `EX-NFR-31` |
| FV-14 (années « 2 017 ») | `EX-SCR-6`, `75` |
| FV-15 (écran C) | `EX-SCR-103`, `194`, `196`, `197`, `198` |
| FV-16 (accessibilité) | `EX-SCR-118`, `EX-NFR-12`, `13`, `16` |
| FV-17 (amorce, `mk`, compteur (0), jeton snapshot, lien de marque) | `EX-SCR-42`, `43`, `44`, `50`, `123`, `126` |
| FV-18 (écran B : squelette, G15, interactions d'histogramme, petits effectifs, empreinte, ET-CHARGE-MAJ) | `EX-SCR-24`, `149`, `159`, `170`, `173`, `176`, `EX-SRCH-22` |
| FV-19 (compact, hors ligne, assainissement, raccourci, notification) | `EX-SCR-37`, `48`, `73`, `81`, `95`, `96`, `97`, `98`, `209` |
| FV-20 (dictionnaire : drapeaux et replis) | `EX-DATA-5`, `10`, `11`, `14`, `35` |
| FV-21 (Diagnostic, snapshot) | `EX-SCR-35`, `53`, `218`, `224`, `EX-NAV-23`, `EX-NAV-25` |
| FV-23 (compteur du bandeau, double compteur) | `EX-SCR-46`, `78`, `EX-SRCH-21` |
| FV-24 (nom de recherche) | `EX-SCR-94` |
| mineurs isolés | `EX-DATA-23`, `EX-SCR-17`, `101`, `153`, `212` |

---

## 4. Déroulé des deux parcours cibles (`docs/00-CONTEXT.md`)

Toutes les valeurs ci-dessous sont lues dans le DOM du build de production par Playwright ; les
journaux complets sont `logs/p1-journal.json`, `p1b-journal.json`, `p2-journal.json`,
`p2c-journal.json`, `p3-journal.json`, `p4-journal.json`, `p5-journal.json`. Les captures sont dans
`reports/final-verification/`.

### 4.1 Parcours 1 — mode 1 « budget 20 000 €, carrosserie coupé, Belgique, < 100 000 km »

| Étape | URL / geste | Valeurs affichées | Temps | Capture | Verdict |
|---|---|---|---|---|---|
| P1-0 | `GET /marche` (onglet neuf, réseau local) | barre « 294 marques · **0 modèles** · 100 000 offres — 20 marques affichées » ; bandeaux : source synthétique, C3 « 100 000 observées sur 100 000 annoncées — couverture 100 % » (**deux fois**), « 294 marques correspondent — affinez pour comparer », « 294 marques dans le snapshot — 20 affichées, triées par nombre d’offres » + `Afficher les 294 marques` (le texte normatif dit « 295 » : le snapshot synthétique ne peuple que 294 marques) ; amorce + 4 raccourcis au libellé exact ; 20 cartes | premier affichage des cartes **434 ms** après navigation (DOMContentLoaded 75 ms, 200 Ko transférés) | `P1-0-marche-sans-filtre.png` | conforme sauf « 0 modèles » (FV-02) et doublon C3 (FV-07) |
| P1-0bis | même URL sous **4G simulée** (500 Ko/s, 150 ms, cache désactivé) | idem | **1 497 ms** (2ᵉ essai 1 562 ms) ≤ 2 000 ms | — | `EX-NFR-9` tenue |
| P1-1 | `/marche?body=3&cy=B&kmto=100000&priceto=20000` (`cy` posé dans l'URL faute de contrôle « Pays », D-15) | « **112 marques · 0 modèles · 2 656 offres** — 36 marques affichées » ; jetons « 3 filtres actifs : Prix : ≤ 20 000 € × · Kilométrage : ≤ 100 000 km × · Carrosserie : Coupé × » (`cy` ni compté ni corrigé) ; cartes VW 267 (« 0 modèles · médiane 10 850 € · 4 850 – 18 850 € (fourchette centrale (90 % des offres)) · du moins cher au plus cher : 400 – 19 950 € · 2018 – 2026 »), Mercedes-Benz 210, Audi 196 ; pied « 36 marques sur 112 · Charger 12 marques de plus » | 350 ms | `P1-1-marche-filtre.png` | **2 656 / 112 = valeurs de la sonde D8 `parcours`** ; mais aucune zone-modèle rendue (FV-02) |
| P1b-2 | clic sur l'en-tête de la carte VW | la carte se déplie : **68 zones-modèles d'un coup** (« 68 modèles sur 68 » + champ de recherche) ; « Golf 61 › 6 250 – 17 300 € (fourchette centrale) · 2019 – 2026 · 0 – 90 800 km · méd. 11 300 € », Polo 29, Passat 21, Tiguan 20, « T-Roc 10 › — — — méd. 15 050 € » ; barre de synthèse devient « 112 marques · **67** modèles » ; URL inchangée | 1,5 s | `P1b-2-carte-apres-clic-entete.png` | EX-SCR-110 attend un filtre `mmmv`, pas un dépliement (FV-04) ; fourchettes « — » à n = 10 (FV-09) ; cardinal « modèles » ne compte que les cartes chargées (FV-02) |
| P1-3 | bouton « Toutes les marques » → écran G | modale « Sélectionner marque et modèle », liste fenêtrée (84 lignes) « 9ff — · Abarth — · AC — … » (ordre alphabétique, effectif « — » partout) ; `Échap` ferme | 0,8 s | `P1-3-ecran-G.png` | effectifs absents (FV-05) |
| P1b-3 | clic sur la zone « Golf, 61 offres » | `/marche/74-volkswagen/2084-golf?body=3&kmto=100000&priceto=20000` ; en-tête « Volkswagen Golf 1001 offres · médiane 10 250 € … » ; fil d'Ariane « Marché › Volkswagen Golf » ; « 3 filtres actifs » conservés | 2 s | `P1b-3-ecran-B-depuis-A.png` | `EX-NAV-15`/`EX-SCR-51` tenues ; **1001 offres ≠ 61** : le filtre `body` (classe T en mode 2, `bodyTypes` vide — O15) n'est plus appliqué en mode 2, sans mention — écart de continuité A → B à instruire avec O15 |
| P1b-4 | fil d'Ariane « Marché » | `/marche?body=3&kmto=100000&mmmv=74\|2084&priceto=20000` ; « 1 marques · 0 modèles · 61 offres », 1 carte ; jeton « Marque / Modèle / Version : 74\|2084 × » | 0,8 s | `P1b-4-retour-A.png` | `EX-NAV-16` attend `74\|\|\|` (marque seule) ; `EX-SCR-104` attend une redirection vers B ; jeton en code brut (FV-04) |
| P1b-5 | `history.back()` | retour sur l'écran B Golf | — | — | `EX-NAV-12/14` tenues |
| P1b-6 | même URL à 360 × 740 | pas de défilement horizontal (`scrollWidth` 360), barre « 112 marques · 2 656 offres » (cardinal `modèles` retiré), 1 colonne ; bandeau complet non replié | — | `P1b-6-compact-360.png` | `EX-SCR-135/183` tenues ; bandeau compact absent (FV-19) |
| P5-A | 1 440 × 900, `/marche?priceto=20000`, avant tout clic | **15 cartes visibles, 0 zone-modèle** | — | `P5-A-densite-1440x900.png` | `EX-SCR-22` (≥ 24 zones) non tenue (FV-02) |

**Verdict P1.** Le parcours produit les bons **effectifs** et les bonnes **fourchettes** (identiques
aux valeurs recalculées par la sonde D8 : 2 656 offres, 112 marques ; fourchette centrale et brute
distinctes et nommées), mais pas dans la forme exigée : la « liste de cartes-marques, chaque carte
contenant une zone par modèle » n'existe qu'après un clic par carte, et la barre de synthèse ment
(« 0 modèles ») jusque-là. La contrainte « Belgique » n'est pas posable par l'utilisateur (D-15) et
n'a de toute façon aucun effet sur un snapshot mono-pays.

### 4.2 Parcours 2 — mode 2 « Opel Corsa 2017 » (Opel = 54, Corsa = 1918)

| Étape | URL / geste | Valeurs affichées | Temps | Capture | Verdict |
|---|---|---|---|---|---|
| P2-1 | `GET /marche/54-opel/1918-corsa` (onglet neuf) | titre « KYCAR — Distribution d'un modèle · Opel Corsa » ; en-tête « **1352 offres** · médiane 25 100 € · P25 13 900 € · P75 36 888 € · **min 2 500 € – max 2 812 600 €** (du moins cher au plus cher) · km médian 70 850 km · 1ʳᵉ immat. médiane 2021 · **0 % particuliers** · Voir les 1352 annonces · Comparer · Suivre · Exporter » ; 14 graphes dans l'ordre et aux titres normatifs, « Offres par prix (1246) / kilométrage (1332) / année (1337) » ; **G4 : canvas présent mais 0 point, note « année non renseignée sur les 0 offres », légende « 0 km – 1 km » ; G8 : 0 sucette ; tables G5/G9/G12/G13/G15 vides** | 2,2 à 4,1 s jusqu'à l'écran B (génération du snapshot de 100 000 annonces comprise ; hors périmètre d'`EX-NFR-9`) | `P2-1-ecran-B-corsa.png` | effectif, médiane, min/max = **valeurs de la sonde D8** (1 352 ; 2 500 / 2 812 600 ; `price.n` = 1 246) ; mais tout ce qui lit le lot colonnaire est vide (FV-01) |
| P2-2 | `…?fregfrom=2017&fregto=2017` (URL) | « **54 offres** · médiane 15 200 € · P25 12 238 € · P75 17 200 € · **min 10 150 € – max 20 150 €** · km médian 131 250 km · 1ʳᵉ immat. médiane 2017 » ; G6 « Dépréciation non calculable — il faut au moins 3 années comptant chacune 5 offres » ; G7 « Densité non calculable en dessous de 40 offres — voir la nuée ci-dessus » ; G8 vide | 2,1 s | `P2-2-ecran-B-corsa-2017.png` | **54 ; 10 150 – 20 150 € = sonde D8** ; G8 vide attendu (98 verdicts, 0 signalé) |
| P2-2bis | saisie « 2017 » puis « 2017 » dans les champs « Première immatriculation de/à » du bandeau + `Entrée` | URL passe par `?fregfrom=2017` puis `?fregfrom=2017&fregto=2017` ; en-tête identique à P2-2 mais « **31 % particuliers** » | ≈ 2 s par étape | `P2-2bis-bandeau-2017.png` | `EX-SCR-86`/`EX-NAV-18` tenues (même URL, même rendu) ; la part de particuliers n'est juste **qu'au second aller** (FV-01) |
| P2c-1/2/3 | preuve du tampon détaché : entrée à froid → filtre `kmto=200000` → « Tout effacer » | à froid : G4 0 ligne, G8 0, G13 vide, 0 % particuliers ; après filtre : **G4 1 075 points, G8 20 sucettes (−79,1 %, −77,9 %, −31,0 %…), G13 « Professionnel 701 · 64 % · 26 750 € / Particulier 388 · 36 % · 29 225 € », G9 « Essence 467 · 43 % · 26 800 € … », 35 % particuliers** ; après « Tout effacer » (même Σ qu'à froid) : G4 1 232 points, G8 20, 35 % | 2,5 s | `P2c-2-ecran-B-apres-filtre.png` | FV-01 prouvée : même sélection, deux rendus selon qu'il s'agit du premier ou du second aller |
| P3-A | clic sur la barre « 10 500 € à 11 000 € : 6 offres » de G1 (Corsa 2017) | URL `…&pricefrom=10500&priceto=10999` ; en-tête « **6 offres** · médiane 10 750 € · min 10 600 € – max 10 950 € » ; jetons « Prix : 10 500 € – 10 999 € × · Première immatriculation : 2 017 – 2 017 × » | 2,5 s | `P3-A-clic-barre.png` | geste central `EX-SCR-149`/`ARB-09` tenu (effectif de la page = effectif de la barre) ; année « 2 017 » (FV-14) |
| P4-A2/A3 | G8 (chemin chaud) : infobulle et clic d'une sucette | « écart calculé sur : Opel Corsa · n = 1089 · score : écart au prix attendu (M2) » ; `window.open('https://www.autoscout24.be/fr/annonce/opel-corsa/62147', '_blank', 'noopener')` | — | — | `EX-SCR-158bis`, `164`, `201` tenues (la fenêtre externe ne charge pas : réseau sortant coupé par l'environnement, E5) |
| P3-B | bouton « Voir les annonces » (chemin chaud, 6 offres) | `/marche/54-opel/1918-corsa/annonces?fregfrom=2017&fregto=2017&pricefrom=10500&priceto=10999` ; « Annonces — Opel Corsa · 6 lignes affichées sur 6 de la sélection — écarts calculés sur les 6 · Tri : prix croissant (aucun score d'opportunité) · CSV des annonces du périmètre · CSV des agrégats affichés » ; 15 colonnes (Version, Prix, Écart attendu, Km, 1ʳᵉ immat., Année-mod., Puissance, Carburant, Conso., CO₂, Propr., Éval. AS24, Vendeur, Pays, Lien) ; ligne « 385 kW Electric · 10 600 € · 219 000 km · 11/2017 · mod. 2017 · 385 kW · Electrique · 0 g/km · 2 · Un peu cher · Professionnel · Belgique · Ouvrir ↗ » ; pied « 6 annonces · page 1 / 1 » | 0,8 s | `P3-B-ecran-D.png` | écran D conforme (TVA absente = dette D-38) |
| P4-A | « Ouvrir ↗ » sur l'écran D | `window.open(https://www.autoscout24.be/fr/annonce/opel-corsa/62147, '_blank', 'noopener')` | — | — | ouverture de l'annonce d'origine = seul lien sortant, `noopener` ✓ |
| P5-E | écran D « toutes années », `Suivant` | « page 2 / 26 », 50 lignes, « 1281 annonces », URL `…/annonces?kmto=300000&page=2` ; `history.back()` revient à l'écran B (pagination en `replaceState`) | — | — | `EX-SCR-208`, D-12 tenues |
| P2c-4 | `GET …/annonces` **en accès direct (onglet neuf)** | l'écran D ne se rend jamais ; `pageerror: Cannot perform Construct on a detached ArrayBuffer` ; la barre d'outils reste seule ; un filtre posé ensuite ne le relève pas | 30 s (délai) | `P2c-4-ecran-D-froid.png` | **FV-01 : l'écran D est inaccessible par lien partagé** |
| P5-F | depuis `/marche?fregfrom=2017&fregto=2017`, écran G : recherche « opel » → ligne Opel | la ligne « Corsa » n'apparaît pas dans la fenêtre rendue et `Appliquer` reste désactivé : le parcours C1 → G → B n'a pas pu être conclu par le script | — | `P5-F-apres-ecran-G.png` | non conclu par navigateur (fenêtrage), la logique de G est couverte par 18 sondes D5 |

**Verdict P2.** Toutes les **valeurs intermédiaires** attendues sont confirmées, chiffre par chiffre,
contre la sonde D8 (1 352 → 54 au millésime 2017, fourchette 10 150 – 20 150 €, clic de barre exact,
73 verdicts signalés sur la cellule entière via G8 = 20 premières) — mais **seulement à partir du
second recalcul**. À la première entrée, c'est-à-dire pour tout lien partagé ou tout onglet neuf, la
page B ne montre ni nuage ni annonces signalées, et l'écran D plante. Le parcours cible 2 (« ouvrir
un modèle, lire les distributions, resserrer un filtre, identifier un outlier, ouvrir l'annonce ») est
donc **exerçable, mais pas à froid**.

### 4.3 Mécanisme du constat FV-01 (pour la 2.8)

`src/worker/client.ts` l.35-80 collecte les 34 `ArrayBuffer` du lot (`batchTransferables`) et les
passe en **transferables** à `worker.postMessage(request, transfer)` lors de `loadDataset` (l.133) :
côté thread principal, ces tampons sont alors *détachés* (longueur 0). Or
`src/orchestration/data-controller.ts::enterMode2` l.329-369 renvoie **le même objet `batch`** dans
`Mode2Payload` après `engine.loadDataset(batch, …)` (l.334-336) ; `DistributionScreen`,
`ListingsScreen` et la part de particuliers lisent ce `batch` (`computeEligibility`,
`buildOutlierLollipops`, `decodeListingId`, `batch.sellerType[row]`). Au second aller, le contrôleur
saute `loadDataset` (`loadedDatasetKey` identique) et sert un `batch` fraîchement récupéré du provider,
d'où le rendu correct. Les tests D8 utilisent `engine-inprocess.ts` (aucun transfert) et ne peuvent
pas voir le défaut. Correction attendue : conserver une copie côté principal (ne pas transférer, ou
cloner avant `postMessage`, ou faire relire les colonnes nécessaires au worker), et ajouter un test
d'intégration avec un vrai Worker (jsdom ne suffit pas : test E2E 2.9 ou test navigateur dédié).

---

## 5. Budgets NFR mesurés

| Exigence | Cible | Mesure rejouée par moi | Verdict |
|---|---|---|---|
| Bundle initial (`EX-NFR-10`) | ≤ 300 Kio gzip | **99,13 Kio** (`npm run size`, entrée 88,50 + worker 10,63) | tenu (33 %) |
| Bundle différé (`EX-NFR-11`) | ≤ 400 Kio gzip | 0,00 Kio, aucun chunk différé (garde éprouvée par les sondes D1) | sans objet, garde posée |
| `EX-NFR-1` | moteur fonctionnel jusqu'à 10⁶, jeu de référence 100 000 ≤ 25 Mo | 17,19 Mio (sonde D3) ; 10⁶ non exécuté (extrapolation E4 : ≈ 225 Mo dataset + index) | tenu à 10⁵ |
| `EX-NFR-3` | ≤ 6 Mo gzip | 5,45 Mio (sonde D3, marge 9,2 %, D-42) | tenu |
| `EX-NFR-4` | `taxonomy.json` < 1 Mo gzip | tenu (sonde D8 `nfr9-size`) ; 18 référentiels = 97,0 Kio gzip | tenu |
| `EX-NFR-4bis` | percentile de rang, ≥ 100 exécutions, `n`/médiane/p95 publiés | `recalc.perf.test` : `runs=100 p50=152,4 ms p95=165,5 ms max=192,9 ms` | tenu |
| `EX-NFR-5` | ≤ 200 ms p95 | **165,5 ms** p95 non élagué à N = 100 000 ; élagué marque 54,1 ms ; facettes différées 21,8 ms p95 | tenu |
| `EX-NFR-7` | ≤ 500 ms p95 pour 5 000 points | **3,92 ms** p95 (Canvas 2D réel, checksum non nul) | tenu |
| `EX-NFR-8` | ≥ 30 img/s dans ≥ 95 % des fenêtres de 1 s sur 10 s | **100 %** (91 fenêtres, 0 en défaut, minimum instantané 172 img/s) | tenu |
| `EX-NFR-9` | ≤ 2 000 ms p95, 4G simulée | navigateur réel sous CDP 500 Ko/s + 150 ms, cache désactivé : **1 497 ms** puis 1 562 ms (2 essais) ; réseau local 434 ms ; sonde statique 831 ms (852 ms avec le worker) | tenu (2 essais, pas 100 : la campagne 2.9 doit publier le p95) |
| Mémoire à 100 000 | enveloppe ARB-55 ≈ 274 Mo à 10⁶ | sonde D4 `full-100k` : dataset + index ≈ 225 Mo extrapolés à 10⁶ (index ≈ 23 Mo) | tenu (extrapolé) |
| `EX-SCR-189` | 14 graphes ≤ 300 ms pour n ≤ 20 000 | sonde D7 verte | tenu |
| `EX-NFR-6` | histogramme ≤ 300 ms p95 | non mesuré au rendu | à mesurer (2.9) |

---

## 6. Vérification des amendements 2.6 (décisions D-01 … D-51)

Pour chaque décision ayant un effet sur le code ou le texte : l'implémentation suit-elle la décision,
et le texte v1.1 la reflète-t-il ?

| Décision | Exigence(s) amendée(s) | Implémentation | Texte v1.1 | Preuve |
|---|---|---|---|---|
| D-01 `ingestFlags` Uint32 + table bit↔code | `EX-DATA-119`, §A.1 (17 codes) | conforme | conforme | sonde D2 `R-D2-18` (17 drapeaux, `MARKETPLACE_UNMAPPED` stockable) ; `diff` des deux `DataProvider.ts` vide |
| D-02 `makeId` Int32 | `EX-DATA-119` | conforme | conforme | sonde D2 `dictionary-fields` ; D8 `R-D8-31` (0 carte hors taxonomie) |
| D-03 `unsupportedFilterIds` + `ET-FILTRE-NON-APPLIQUE` | interface (ARCHITECTURE) | conforme | conforme | `[rev-D3] champs de AggregateResult = …unsupportedFilterIds`, `filtres ignorés (0/15)` ; bandeau `kycar-banner-unapplied` dans `app.tsx` ; P1-1 : `nonAppliqués=[]` |
| D-04 paliers ARB-17 câblés dans la zone-modèle | `EX-SCR-134` | **partiellement** : `effectifTier` câblé, mais les paliers `trop-faible` et `reduite` rendent « — » pour les trois fourchettes au lieu de min–max + jeton | conforme | HTML observé (T-Roc, n = 10) ; `view-model.ts` l.88-89 — **FV-09** |
| D-05 éligibilité « prix valide » | `EX-DATA-99` | conforme | conforme | sondes D4 `EX-DATA-99`, `R-D4-02` |
| D-06 `EX-DATA-101` fait foi, graine retirée | `EX-DATA-100bis`, `EX-SCR-157` | conforme | conforme | aucun export `SCATTER_SAMPLING_SEED` (test d'absence `scatter-sample.test.ts` l.146) ; sonde D7 « aucune graine exportée » |
| D-07 « interaction continue (pan/zoom) » | `EX-NFR-8`, `EX-NFR-15` | conforme (banc pan/zoom) | **non amendé** : `EX-NFR-8` v1.1 parle toujours de « rotation continue de 10 s » et ne porte pas de marque `[amendée 2.6 — D-07]` ; absent du journal des amendements | `draft-behaviour.md` D.2 — **FV-12** |
| D-08 `ET-TROP-RESULTATS` retiré du nuage | `EX-SCR-32`, `157`, `177` | conforme | conforme | sonde D7 `R-D7-05 — CORRIGÉ (D-08)` |
| D-09 `mmmv` seul paramètre marque/modèle | `EX-NAV-5`, `15`, `16`, `17` | **partiellement** : A → B absorbe `mmmv` ✓ ; B → A réinjecte `74\|2084` (couple) au lieu de `74\|\|\|` | conforme | journal P1b-3/P1b-4 ; `router.ts` l.327-328 — **FV-04** |
| D-10 retrait unitaire par l'infobulle | `EX-SCR-76` | conforme | conforme | sonde D5 `R-D5-22` |
| D-11 codec D5 autorité (`g4v ∈ {a,b}`, `lo-hi`) | `EX-NAV-10bis` | conforme | conforme | sondes D7 `url-etat` (aller-retour) |
| D-12 `page`/`size`/`sel` état d'interface | `EX-NAV-10bis`, `EX-SCR-208` | conforme | **partiellement** : `EX-SCR-82` classe encore `page`/`size` en T | journal P5-E (`page=2`, `replaceState`) ; sonde D5 `EX-SCR-82` (exception `AMENDED_BY_D12`) — FV-12 |
| D-13 `m = <makeId>-<modelId>` | `EX-SCR-194` | conforme | conforme | journal P3-C5 |
| D-14 `zip`/`lat`/`lon` exclus | `EX-DATA-49`, `EX-SRCH-6/7` | conforme | **partiellement** : `filters-scope.json` = 74 retenus + 27 exclus, mais `REQUIREMENTS.md` §0/§6/§11.3 et `EX-SCR-82/83` disent toujours 77 + 24 | `node -e` sur `filters-scope.json` ; sonde `R-D2-21` — FV-12 |
| D-15 `damaged_listing` D, `ustate`/`powertype`/`cy`/`atype` non exposés | `EX-SRCH-18bis` | conforme | **partiellement** : `EX-SRCH-18bis` ✓ ; `EX-SCR-59/82/83` toujours « 9 contrôles dont Pays », « 76 exposés », « 13 primaires » | registre (6 `nonExposed`, 12 primaires) ; sondes D5 « amendée » sans texte amendé — FV-12 |
| D-16 une clé `localStorage` par entrée + index | `EX-CRUD-19` | conforme | conforme | journal P5-C : `kycar:saved-searches/<uuid>`, `kycar:saved-searches#index`, … |
| D-17 dette GROUPSTAT/NTILE | `EX-DATA-83bis` | dette tenue telle quelle | conforme | `graphs-model.ts` (thread principal) |
| D-18 D9 corrigé, non câblé ; `/mentions` dit SYNTHETIC | — | conforme | — | `main.tsx` (`SyntheticDataProvider`), `/mentions` observée, sonde `R-D9-21` en `it.fails` |
| D-19 débounce 500 ms + `blur`/`Entrée` | `EX-SCR-57`, `86` | conforme | conforme | `debounce-policy.test` ; `Entrée` observée |
| D-23 deux espaces d'identifiants | `EX-DATA-108` | sans changement de code | conforme | sonde D2 `R-D2-05` |
| D-24 / D-43 SYNTHETIC sur A/B/D via `describe()` | `EX-DATA-107` | conforme | conforme | bandeau observé sur A, B, D, pied de page, `/mentions` (`kycar-synthetic D3-1.0.0 · snapshot be-synthetic-…`) |
| D-25 I7 sur `Elig` | `EX-DATA-104` | conforme | conforme | sondes D4 `I7` |
| D-26 bouton + lien | `EX-SCR-158` | conforme | conforme | sonde D7 `R-D7-11` ; `onViewBrushedListings` câblé |
| D-27 pagination 50 | `EX-SCR-208` | conforme | conforme | journal P5-E |
| D-28 `sampleBiased` avant câblage réel | — | consigné, non codé (attendu) | — | rattaché à D-18 |
| D-29 baseline précalculée + cache | ARCHITECTURE §6.3/§9.3 | conforme | conforme | sonde D8 `EX-NFR-9` : `fetchBaselineAggregates = 0 ms` ; `baseline-cache.ts` présent |
| D-30 / D-42 budget gzip prime | `EX-NFR-3` | conforme (5,45 Mo) | — | sonde D3 |
| D-31 / D-32 / D-41 sondes justifiées, rouges d'abord | — | vérifié par `fix-verify` (§3 REMEDIATION), non rejoué | — | — |
| D-33 `unsupportedFilterIds` sur `AggregateResult` seul | interface | conforme | — | `[rev-D3]` champs ; sonde D3 |
| D-34 élagage octet à octet | `EX-DATA-116` | conforme | — | sonde D4 `équivalence élagage / balayage complet` |
| D-35 `MODEL_ID_UNRESOLVED` | — | conforme | — | `view-model.ts` l.281 |
| D-36 `EX-SCR-114` : présence vs contenu | `EX-SCR-114` | **non conforme** : le contenu attendu (min–max + jeton `n = <n>` pour 5 ≤ n ≤ 11) n'est pas rendu | conforme | HTML observé — **FV-09** |
| D-37 `EX-SRCH-6/7` sans objet | `EX-SRCH-6`, `7` | conforme (`zip` absent du registre) | conforme | sonde D5 `EX-SCR-82` |
| D-38 dette TVA | `EX-SCR-203` | dette tenue | — | colonne absente observée, `R-D7-16` en `it.fails` |
| D-39 `SCATTER_SAMPLING_SEED` retiré | — | conforme | — | `grep -rn SCATTER_SAMPLING_SEED src` : une seule occurrence, le test d'absence `scatter-sample.test.ts` l.146 (`expect('SCATTER_SAMPLING_SEED' in mod).toBe(false)`) |
| D-40 dette grille compacte | `EX-SCR-135` | dette tenue | — | sonde `R-D6-10` verte |
| D-44 sentinelle relative hors §B.2 | `EX-DATA-60` | conforme | conforme | `invariants.integration › D-44` ; min Corsa 2 500 € = vérité terrain de la sonde D8 |
| D-45 dette `INSUFFICIENT_*` | `EX-DATA-85` | dette tenue | — | `R-D4-05` en `it.fails` |
| D-46 moteur sans déduplication | — | conforme | — | sondes patho `R-PATHO-09/10 (moteur)` |
| D-47 bornes de plausibilité providers | `EX-DATA-38`, `29` | conforme | — | sondes patho `R-PATHO-04/05/11` |
| D-48 sondes D6 corpus / `EX-DATA-101` | — | conforme | conforme (T-t) | sondes vertes |
| D-49 promotion `it.fails` | — | conforme : 8 `it.fails`, 0 `skip`/`todo` | — | `grep` |
| D-51 `VER-ETIQ-A` à 1 400 € | — | conforme | — | sonde patho dans la suite verte |
| D-20, D-21, D-22, D-50 | organisationnelles | sans effet code | — | — |

Bilan : **4 décisions dont l'implémentation ne suit pas complètement la décision** (D-04, D-09,
D-36 — un même défaut de zone-modèle et un défaut de réinjection) et **4 décisions dont le texte
v1.1 ne reflète pas la décision** (D-07, D-12, D-14, D-15). Aucune décision n'est contredite par le
code dans un sens qui fausserait un chiffre calculé.

---

## 7. Constats (entrées de la phase 2.8)

Sévérités selon `REVIEW-PROTOCOL.md` : BLOQUANT = fausse une valeur affichée ou rend un parcours
cible inexerçable ; MAJEUR = exigence non tenue sans fausser un chiffre ; MINEUR = confort, forme,
documentation. Aucun de ces constats n'est couvert par une dette consignée.

| # | Sév. | Constat | Exigences | Preuve | Correction attendue |
|---|---|---|---|---|---|
| **FV-01** | **BLOQUANT** | **Lot colonnaire détaché après transfert au Worker** : à la première entrée en mode 2, G4 (0 point, légende « 0 km – 1 km », note « année non renseignée sur les 0 offres »), G8 (0 sucette), G5/G9/G10/G12/G13/G14/G15 (tables vides) et « 0 % particuliers » sont faux ; l'écran D en accès direct ne se rend jamais (`Cannot perform Construct on a detached ArrayBuffer`). Le second recalcul (autre `selectionHash`) rend tout correctement | `EX-SCR-142`, `151`, `158`, `161`, `164`–`168`, `170`, `201`–`203`, `EX-NFR-15` | journaux P2-1, P2c-1/2/3, P2c-4 ; `src/worker/client.ts` l.35-80 et l.133 ; `data-controller.ts` l.329-369 | ne pas réutiliser l'objet transféré : cloner les colonnes lues par les écrans avant `postMessage`, ou ne pas transférer (copie structurée), ou re-demander les colonnes au worker ; ajouter un test avec un **vrai** Worker (E2E ou navigateur) — les tests `engine-inprocess` ne peuvent pas le voir |
| **FV-02** | **BLOQUANT** | **Écran A sans zones-modèles et « 0 modèles »** : `loadMarket` ne charge que les agrégats de marque ; les zones n'apparaissent qu'après un clic sur l'en-tête (toutes d'un coup, 68 pour VW, sans repli à 6) ; la barre de synthèse et chaque carte affichent « 0 modèles » puis un cardinal qui ne compte que les cartes cliquées (« 67 ») ; densité `EX-SCR-22` = 0 zone à 1 440 × 900 | `EX-SCR-22`, `106`, `107`, `109`, `112`, `113`, `122`, `138`, `EX-DATA-71`, (`EX-DATA-68`) | journaux P1-1, P1b-2, P5-A ; `app.tsx` (`modelsByMake` vide au chargement, `onSelectMake = onToggleExpand`) ; `view-model.ts` l.281 | charger les agrégats modèle des cartes rendues avec le marché (un `fetchAggregates('MODEL')` par lot de cartes, ou un agrégat groupé) ; afficher `modelCount` depuis la donnée (ou « — » tant qu'elle manque, jamais 0) ; rendre 6 zones puis le repli |
| FV-03 | MAJEUR | **Corrections d'URL silencieuses** : `app.tsx` lit `loadQuery(location.search).selection` et ignore `corrections` ; une URL fautive est corrigée en mémoire mais ni réécrite (`replaceState`) ni signalée (`ET-URL-CORRIGEE`) — violation de la règle transverse « aucune correction silencieuse » (REQUIREMENTS §8) | `EX-NAV-21`, `22`, `EX-SCR-38bis`, `39` | journal P3-D1 (`fuel=Z,B&pricefrom=abc&kmfrom=100000&kmto=1000&foo=1&priceto=99999999` conservée telle quelle, aucun bandeau) ; `grep corrections src/app.tsx` = 0 usage | consommer `corrections` dans la coquille : `navigate(url canonique, 'replace')` + bandeau au format normatif, durée de vie jusqu'au prochain changement de filtre |
| FV-04 | MAJEUR | **`mmmv` : quatre écarts liés** : (a) le clic sur l'en-tête de carte déplie au lieu de poser `mmmv` (`EX-SCR-110`) ; (b) `mmmv` portant un couple complet ne redirige pas vers B (`EX-SCR-104`) ; (c) le retour B → A réinjecte `make\|model` au lieu de `make\|\|\|` (`EX-NAV-16`, D-09) ; (d) le jeton affiche « Marque / Modèle / Version : 74\|2084 » (code brut, un seul jeton) au lieu de « Volkswagen × » « Golf × » | `EX-SCR-51`, `75`, `104`, `110`, `EX-NAV-16`, `EX-NFR-30` | journaux P1b-2, P1b-4 ; `router.ts` l.327-328 ; `grep redirig src/app` = 0 | (a) `onSelectMake` → `applyMode1Query({…, mmmv: make})` ; (b) redirection dans `resolveView`/effet de la coquille ; (c) `carryFiltersAcrossMode(…, 'mode1')` sans `modelId` ; (d) résolveur de libellé taxonomique dans `labels.ts`, un jeton par niveau |
| FV-05 | MAJEUR | **Écran G sans effectifs** : ni `FilterBand` ni `MarketScreen` ne passent `counts` à `ScreenG` → « — » sur chaque entrée et tri alphabétique | `EX-SCR-216` | journal P1-3 ; `FilterBand.tsx` l.241-249, `MarketScreen.tsx` l.410-415 ; `screen-g-model.ts` (`resolveCount` → `null`) | alimenter `counts` depuis les agrégats de marque courants (`loadMarket`) et, pour les modèles, depuis `loadModelsForMake` |
| FV-06 | MAJEUR | **Facettes jamais affichées** : le moteur calcule les `FacetCount` en un balayage (sonde D4) mais aucun `facetCounts` n'atteint `CheckboxList` ; aucune option n'affiche `(n)` ni `(0)` en gris | `EX-SCR-65`, `89`, `90` | `grep facetCounts src/app.tsx src/components/filters/FilterBand.tsx` = 0 ; bandeau observé sans effectifs | exposer les facettes du dernier recalcul par le contrôleur et les passer à `FilterBand` (différées ≤ 100 ms, `…` pendant l'écart) |
| FV-07 | MAJEUR | **C3 et avertissement de représentativité absents de l'écran B ; C3 doublé sur A ; message « Jeu de données restreint par… » jamais rendu ; aucun plafond ni jeton `+k avertissements`** | `EX-SCR-31`, `38`, `175`, `182`, `210`, `EX-SRCH-9quater` | journaux P2-1 (bandeaux B = source synthétique seule), P1b-1 (deux nœuds C3) ; `grep Représentativité src` = 0 | rendre `buildC3Banner` + ligne de représentativité dans `DistributionScreen`/`ListingsScreen` ; dédoublonner le conteneur `kycar-market-banners` ; implémenter l'empilement d'`EX-SCR-38` |
| FV-08 | MAJEUR | **Mode « Modèle non identifié » non implémenté** : `/marche/54-opel/0-modele-non-identifie` rend l'écran B normal (aucun bandeau, 14 graphes, `Comparer` actif) | `EX-SCR-113bis` | journal P4-B | branche `modelId === 0` dans `DistributionScreen` : bandeau non refermable, G5/G6/G8/G10/G14 hors DOM, `Comparer` désactivé |
| FV-09 | MAJEUR | **Fourchettes « — » pour 1 ≤ n ≤ 11** : `view-model.ts` l.88-89 masque les trois fourchettes (label « — ») pour les paliers `trop-faible` **et** `reduite`, et le jeton `n = <n>` n'est pas rendu dans le DOM de la zone, alors que D-04/D-36/`EX-SCR-33/114/134` exigent min–max (dès n = 1) et le jeton ambre | `EX-SCR-114`, `134` | HTML observé « T-Roc 10 › — — — méd. 15 050 € » (journal P2c-5) | rendre `[min, max]` (rawRange) au lieu de « — » sous 12, afficher le jeton ; retourner la sonde D6 `effectif-seuils` en conséquence (D-31) |
| FV-10 | MAJEUR | **`R²` jamais calculé** ; le libellé normatif de G8 (« Modèle : ln(prix) ~ … n = <\|F\|>, R² = <R²> ») et l'avertissement `R² < 0,30` n'existent pas | `EX-DATA-93bis`, `EX-SCR-164` | `grep -rn "rSquared\|R²\|ln(prix)" src/engine src/screens/distribution` = 0 | calculer SCR/SCT sur la passe 2 dans `outliers.ts`, publier par cellule, afficher sous le titre de G8 |
| FV-11 | MAJEUR | **Notes d'exclusion absentes sous G1–G3** : `GraphFrame` sait rendre « <k> annonces exclues (<motif>) » mais rien ne s'affiche (Corsa : 1 352 − 1 246 = 106 prix exclus, sans mention) | `EX-SCR-178`, `39` | journal P2-1 (`notes: []`) | alimenter `exclusions` des cadres G1–G3 depuis `SelectionStats` (`priceOnRequestCount`, `priceMissingCount`, `yearKnownCount`, …) |
| FV-12 | MAJEUR (documentaire) | **Texte v1.1 non aligné sur D-07, D-12, D-14, D-15** : `EX-NFR-8` parle encore de « rotation continue de 10 s » ; `EX-SCR-59/82/83` gardent « Pays » en primaire, 13 primaires, 76 exposés, `zip`/`lat`/`lon` retenus, `page`/`size` en T ; `REQUIREMENTS.md` §0/§6/§11.3 disent « 77 retenus + 24 exclus » alors que `filters-scope.json` en compte 74 + 27 ; §C.5 de l'annexe A dit 139 exigences pour 140 | `EX-SCR-59`, `82`, `83`, `EX-NFR-8`, REQ §0/§6 | `node -e` sur `filters-scope.json` ; `grep "\[amendée 2.6" draft-screens.md` ; sondes D5 « amendée » | amendements fix-docs avec marque `[amendée 2.6 — D-xx]` et mise à jour du journal §13 |
| FV-13 | MINEUR | **Résumé d'impression jamais imprimé** : `<p class="print-filter-summary">` est enfant de `.filter-bar`, que `print.css` masque (`display: none`) | `EX-NFR-31` | journal P4-E (`printSummary: display none` sous `media: print`) | sortir le résumé du conteneur `.filter-bar` (ou cibler `.kycar-filter-band` dans `print.css`) |
| FV-14 | MINEUR | **Années avec séparateur de milliers** hors écran A : jeton « Première immatriculation : 2 017 – 2 017 », écran C « 2 008 – 2 026 » | `EX-SCR-6`, `75`, `EX-SCR-1` | journaux P3-A, P3-C5 | formateur d'année dédié dans `labels.ts` et `CompareScreen.tsx` |
| FV-15 | MINEUR | **Écran C** : polyline G5 superposée avec coordonnées `NaN` (3 erreurs console), bandeau C1 absent sur `/comparer`, aucun bloc « + Ajouter un modèle », pas de redirection 1 → B / 0 → A | `EX-SCR-103`, `194`, `196`, `197`, `198` | journaux P3-C5, P4-D1 | garder les buckets d'année sans valeur, rendre `FilterBand` sur C, ajouter la colonne vide et les redirections |
| FV-16 | MINEUR | **Accessibilité au rendu** : `color-contrast` sur les 30 pastilles de marque (3,19 – 4,35 < 4,5, texte `aria-hidden`), `nested-interactive` (case Comparer dans une zone `role="button"`, 120 nœuds), `aria-allowed-attr` critique ×82 dans l'écran G ; le premier `Tab` d'une page fraîche atterrit sur « Enregistrer cette recherche » (focus déplacé sur `main`), pas sur le lien d'évitement | `EX-SCR-118`, `EX-NFR-12`, `13`, `16` | journaux P3 (axe ×8 surfaces), P4-C/C2/C3 | pastille en `aria-hidden` avec couleur de texte contrastée ou contour ; sortir la case du `role=button` ; corriger les attributs ARIA des `li role=option` |
| FV-17 | MINEUR | amorce SANS-FILTRE réapparaît après « Tout effacer » ; état déplié des cartes (`mk`) non encodé dans l'URL ; « Comparer (0) » affiché à 0 ; jeton de snapshot « Snapshot be-synthetic-… du 1/09/26 (7 j) » au lieu de `Snapshot <JJ/MM>` + infobulle ; la marque `KYCAR` renvoie à `/marche` sans les filtres | `EX-SCR-126`, `123`, `50`, `44`, `43`, `42` | journaux P5-B, P1b-2, P3-C1, P3-E3 | drapeau de session pour l'amorce ; `mk` dans `writeDistributionUiState`/codec ; compteur conditionnel ; format du jeton ; `href` avec `currentQuery` |
| FV-18 | MINEUR | écran B : chargement en texte au lieu de squelettes ; G15 rendu avec un seul pays ; brossage horizontal, `Ctrl`+clic et double-clic des histogrammes absents ; légendes discrètes et désactivation du brossage sous 4 offres absentes ; aucune empreinte par graphe ; `ET-CHARGE-MAJ` sans atténuation ni barre de progression | `EX-SCR-173`, `170`, `149`, `159`, `176`, `24`, `EX-SRCH-22` | journaux P2-1, P4-B ; `grep` (`dblclick`, `Sélection inutile`, `data-selection`) = 0 | compléments D7/D8 |
| FV-19 | MINEUR | régimes compact/intermédiaire du bandeau et de l'en-tête (feuille plein écran, application différée, menu/tiroir) absents ; écran D sans mode compact ; état hors ligne absent ; réglages « Assainissement KYCAR » absents ; raccourci `/` absent ; notification « k filtres retirés / Annuler » absente | `EX-SCR-37`, `48`, `73`, `81`, `95`–`98`, `209` | `grep` = 0 sur chaque symbole ; journal P1b-6 | compléments D5/D7/D8 (à arbitrer : certains peuvent être requalifiés en dette produit) |
| FV-20 | MINEUR | dictionnaire : `UNIT_UNSUPPORTED` jamais posé ; repli carburant création → recherche et `HYBRID_CATEGORY_UNRESOLVED` non implémentés ; annonce sans `listingUrl` conservée au lieu d'être rejetée ; `co2Source` figé à `UNKNOWN` ; `coverageWarning`/`samplingBias`/`adTierDistribution` absents | `EX-DATA-5`, `10`, `11`, `14`, `35`, `17`, `43` | `grep` = 0 ; `normalize.ts` l.389 | compléter l'ingestion D9/D3 ou requalifier les exigences (les sources actuelles ne portent pas ces champs) |
| FV-21 | MINEUR | panneau Diagnostic réduit à 8 lignes d'orchestration (ni champs attendus, ni blocs supprimés, ni journal d'erreurs, ni `duplicateValueConflictCount`) ; action `Rafraîchir` et bandeau « Nouvelles données du … » absents | `EX-SCR-35`, `53`, `218`, `224`, `EX-NAV-23`, `25` | `app.tsx::AppFooter` ; `grep` = 0 | étendre le panneau depuis `SnapshotDescriptor` (`unknownCountByField`, `ingestFlagCounts`) et lister G16/G16b/`Vue le` |
| FV-22 | MINEUR | `favicon.ico` répond 404 à chaque chargement (une erreur console par page) | — | `curl -s -o /dev/null -w %{http_code} http://localhost:4173/favicon.ico` = 404 | ajouter une icône ou un `<link rel="icon">` |
| FV-23 | MINEUR | compteur de résultats de la zone (4) non alimenté (`resultCount`/`resultCountLoading` absents de `<FilterBand>`) ; double compteur « <n> offres \| <n> ici » du fil d'Ariane inexistant (`selectionHashWithoutTaxonomy` jamais consommé) | `EX-SCR-78`, `46`, `EX-SRCH-21`, `22` | `app.tsx` l.700-745 ; REMEDIATION §7.1 n° 1 | passer `resultCount={selectionCount}` ; calculer le compteur hors taxonomie via le moteur (`EX-DATA-110bis`) |
| FV-24 | MINEUR | le bouton « Enregistrer la recherche » du bandeau enregistre immédiatement sous « Recherche du <date> » au lieu d'ouvrir un champ prérempli par la description des filtres (`Opel Corsa · ≤ 20 000 € · Belgique`) | `EX-SCR-94` | journal P3-C1/C3 | réutiliser le formulaire de `MarketToolbar` avec un nom généré depuis les jetons |

Observations sans constat : le bouton « Ouvrir » de l'écran E est porté par le titre de la carte
(`EX-SCR-212`) ; l'infobulle `rawRange` de l'élément prix d'une zone-modèle n'existe que sur le résumé
de carte (`EX-SCR-113`) ; le filtre `body` posé en mode 1 cesse de s'appliquer en mode 2 sans mention
(61 Golf sur A, 1 001 sur B — conséquence d'O15 et de la classe T de `body` en mode 2, à instruire
avec O15) ; D-51 reste un point d'instruction.

---

## 8. Verdict

### 8.1 Critères S1–S3 de PLAN-2 §2.7 et porte G6

| Critère | Énoncé | Verdict | Pourquoi |
|---|---|---|---|
| **S1** | 100 % des exigences reçoivent un statut | **ATTEINT** | 485 / 485 statuées (+ P-1…P-6), décompte vérifié par script contre les identifiants déclarés des trois annexes ; chaque ligne porte une preuve d'exécution, une commande, ou la mention explicite « documentaire » / « campagne 2.9 » |
| **S2** | les deux parcours cibles sont exercés et journalisés | **ATTEINT** | P1 et P2 exercés dans Chromium sur le build de production, 7 journaux JSON, 24 captures, chaque valeur intermédiaire comparée à la sonde D8 (2 656 / 112 ; 1 352 → 54 ; 10 150 – 20 150 € ; clic de barre 6 = 6) ; **les deux parcours révèlent chacun un défaut bloquant** (FV-01, FV-02) |
| **S3** | taux de couverture chiffré, écarts nommés un par un | **ATTEINT** | 69,1 % couvertes (A 80,7 %, B 56,7 %, C 79,8 %) ; 141 écarts nommés individuellement (§3.2) : 21 dettes motivées, 17 mesures 2.9, 3 points d'instruction, 100 entrées 2.8 regroupées en 24 constats |

**Porte G6 (« matrice de couverture complète et chiffrée ») : FRANCHIE.** La matrice existe, elle
est complète, chiffrée et sourcée. Cela ne vaut pas recette : la porte G7 (2.8) exige zéro
`NON COUVERTE` et zéro `PARTIELLE` sans dette motivée, et l'application n'est **pas livrable en
l'état** tant que FV-01 et FV-02 ne sont pas corrigés — les deux parcours pour lesquels le produit
existe ne se déroulent pas comme spécifié à froid.

### 8.2 Résumé (12 lignes)

1. **485 exigences v1.1 statuées** (A 140, B 231, C 114 ; décompte vérifié par script) + P-1…P-6 :
   **335 COUVERTE · 113 PARTIELLE · 28 NON COUVERTE · 9 HORS PÉRIMÈTRE**.
2. Par annexe : **A 113 / 19 / 5 / 3 (80,7 %)** · **B 131 / 76 / 22 / 2 (56,7 %)** · **C 91 / 18 / 1 / 4
   (79,8 % ; NAV 23/28, SRCH 25/34, CRUD 20/20, NFR 23/32)** · P 6/6.
3. **Taux global : 69,1 %** couvertes (70,4 % hors « hors périmètre ») ; 21 écarts portés par une
   dette motivée 2.6, 17 renvoyés à une mesure 2.9, 3 points d'instruction, **100 entrées 2.8**.
4. Commandes rejouées : build 0/0 · lint vert · `npm test` **615 + 798 verts** · perf 7/7 ·
   `size` 99,13/300 Kio · `tsc review` 0 · les deux copies de `DataProvider.ts` identiques.
5. Budgets tenus : `EX-NFR-5` p95 165,5 ms · `EX-NFR-7` 3,92 ms · `EX-NFR-8` 100 % ·
   **`EX-NFR-9` 1 497 ms en 4G simulée (navigateur réel)** · bundle 99 Kio · 5,45 Mo gzip · 17,2 Mo.
6. **24 constats FV** : **2 BLOQUANT** (FV-01 tampon détaché en mode 2, FV-02 écran A sans zones et
   « 0 modèles »), **10 MAJEUR** (FV-03 … FV-12), **12 MINEUR** (FV-13 … FV-24).
7. P1 : effectifs et fourchettes justes (2 656 offres / 112 marques = sonde D8) mais aucune
   zone-modèle sans clic par carte ; « Belgique » non posable (D-15).
8. P2 : 1 352 → 54 Corsa 2017, 10 150 – 20 150 €, clic de barre exact, 20 outliers, deeplink
   `noopener` — **au second recalcul seulement** ; à froid, nuage et G8 vides, écran D inaccessible.
9. axe-core WCAG 2.1 A/AA : 0 violation sur B, D, C, E, F, `/mentions` ; A en défaut (contraste des
   pastilles), écran G en défaut (`aria-allowed-attr`).
10. Amendements 2.6 : 4 décisions implémentées incomplètement (D-04/D-36, D-09), 4 textes v1.1 non
    amendés (D-07, D-12, D-14, D-15) ; aucun chiffre calculé faussé par un amendement.
11. **S1, S2, S3 ATTEINTS — porte G6 FRANCHIE** ; recette impossible avant correction de FV-01/FV-02
    (G7 non passable en l'état).
12. Rapport : `reports/FINAL-VERIFICATION.md` ; preuves : `reports/final-verification/`
    (journaux, captures, scripts, `matrix-*.tsv`) ; aucun fichier de `src/`, `tests/`, `docs/`,
    `data/` modifié ; aucun commit.
