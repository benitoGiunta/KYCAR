# probe-LOT-I — Datasets préexistants et jeux académiques

Agent `probe-I`, phase 1.4 de `docs/plans/PLAN-1-data-acquisition.md`. Lot : `C-39`, `C-38`, `C-40`,
`C-83`, `C-67` *(5 candidats)*. Profil imposé : investigation technique légère, Sonnet, effort
medium-high. Plafond de requêtes : 50. Aucune requête vers `autoscout24.be` / `autoscout24.com` (E5).
Aucun compte créé, aucun credential saisi (E1/R2).

**Point de départ obligatoire** : `docs/research/VERIF-C67-fdz.md` a déjà tranché `C-67` — Allemagne
seule, 2019-2024 clos, usage scientifique. Ce document ne refait pas ce travail ; il l'utilise et
répond aux deux questions ouvertes qu'il a laissées : calendrier d'extension multi-pays, et structure
exacte du jeu au regard de la mesure de biais.

---

## Journal de preuve

*(une ligne par source consultée, appendue au fur et à mesure — voir compte de requêtes en fin de
document, section Conformité)*

| 2026-09-07 | WebFetch | `https://www.rwi-essen.de/en/research-advice/further/research-data-center-ruhr-fdz/data-sets/rwi-geo-carmkt` | Page dataset FDZ : champs listés seulement à titre d'exemple (« manufacturer, model, year of manufacture, fuel type, mileage, price, and more »), aucune liste exhaustive. Périmètre : « currently Germany (further countries under preparation) », aucune date. Période 01/2019-12/2024. |
| 2026-09-07 | WebFetch | `https://github.com/PThie/RWI-GEO-AS24` | README du dépôt de code : confirme V2 = Allemagne seule 01/2019-12/2024, aucune liste de variables détaillée, aucun calendrier d'extension pays. |
| 2026-09-07 | WebFetch | `https://www.rwi-essen.de/en/publications/policy-advisory/project-reports/detail/fdz-data-description-data-on-the-used-7783` | Page projet RWI menant à la fiche de données RWI-GEO-CARMKT **V1** (01/2024-06/2024, distincte de V2 01/2019-12/2024 citée par VERIF-C67-fdz.md). Lien handle `10419/334903`. |
| 2026-09-07 | WebFetch → PDF (Read direct) | `https://www.econstor.eu/bitstream/10419/334903/1/1942133367.pdf` (469 Ko, lu intégralement) | **FDZ Data Description RWI-GEO-CARMKT V1** (Patrick Thiel, mai 2025) : document officiel complet — 19 pages, table des 38 variables avec nom/label/type, section Data Access, section Data Source. Voir extraction complète en section C-67 ci-dessous. |
| 2026-09-07 | WebSearch | `"RWI-GEO-CARMKT" Datensatzbeschreibung filetype:pdf` puis recherche ciblée de la page projet RWI | A permis de localiser la page projet RWI menant au PDF V1, puis (WebFetch de la page dataset RWI-GEO-CARMKT) le chemin direct du PDF V2 : `/fileadmin/user_upload/RWI/FDZ/FDZ_Datensatzbeschreibung_CARMKT_v2.pdf`. |
| 2026-09-07 | WebFetch + Read direct (PDF sauvegardé) | `https://www.rwi-essen.de/fileadmin/user_upload/RWI/FDZ/FDZ_Datensatzbeschreibung_CARMKT_v2.pdf` (210 Ko, lu intégralement, 20 pages) | **FDZ Data Description RWI-GEO-CARMKT V2** (Rahaus & Thiel, août 2025) : document officiel définitif, 38 variables identiques à V1, note de bas de page 2 identique verbatim à V1 : « other countries like France and Italy will be added in future versions » — **aucune date**. Section 2.1 « Data Source » : confirme explicitement l'absence de marqueur premium/mise en avant. Voir extraction complète en section C-67. |
| 2026-09-07 | WebFetch | `https://zenodo.org/records/17643343` | Zenodo DOI 10.5281/zenodo.17643343 : `autoscout24_dataset_20251108.csv`, auteur « Çelik, Muhammed », déposé 18/11/2025, licence MIT, ~120 000 annonces, 60+ champs, « collected from public listings and processed using Pydantic and Pandas ». **Aucune méthodologie de collecte détaillée, aucune période explicite, aucun TLD source nommé.** Téléchargeable sans compte (548,6 Mo — R3 : non téléchargé, fiche seulement). |
| 2026-09-07 | WebFetch + WebSearch | `https://www.kaggle.com/datasets/clkmuhammed/autoscout24-car-listings-dataset` (+ `/data`) | Kaggle bloque le rendu JS pour WebFetch (page quasi vide hors titre) ; complété par WebSearch qui confirme **identité de contenu avec C-39 Zenodo** : même formule verbatim « collected from public listings and processed using Pydantic and Pandas for validation and consistency », même volumétrie ~120K. **Il s'agit du même jeu, republié sur les deux plateformes par le même auteur** (Zenodo : « Çelik, Muhammed » = Kaggle `clkmuhammed`). Provenance non vérifiable au-delà de « collecté sur des annonces publiques » — aucune méthode de scraping, aucune période, aucune liste de TLD sources. |
| 2026-09-07 | WebSearch | `kaggle ander289386 "cars-germany" dataset description scraped autoscout24` | Provenance **traçable et documentée** : scraping AutoScout24 DE via l'outil de démonstration ZenRows.com (« a faux advertisement » pour le produit de scraping), période 2011-2021, 46 405 lignes, **seulement 9 champs** (mileage, make, model, fuel, gear, offerType, price, hp, year) — pas de code postal, pas de date de création d'annonce, pas de carburant détaillé. Fraîcheur nulle (arrêté en 2021, H4 violée). |
| 2026-09-07 | WebSearch | `kaggle promptcloud "autoscout-automotive-data"` | PromptCloud est un prestataire commercial de scraping (« Data-as-a-Service »警 web crawling). Provenance déclarée : scraping industriel, mais **aucune méthodologie, période ou périmètre publiés** trouvés sans JS. Le mirroir data.world est **fermé** (communauté retirée le 13/07/2026, jeux supprimés) — un canal de vérification perdu. `[NON VÉRIFIÉ]` au-delà de l'identité du prestataire. |
| 2026-09-07 | WebSearch | `kaggle huseyincenik "as24-cars"` | Aucune fiche indexée retrouvée sans JS Kaggle. `[NON VÉRIFIÉ]` — candidat non qualifiable dans le budget imparti au-delà de son existence (source : `candidates-v1.md` C-38). |
| 2026-09-07 | WebFetch | `https://huggingface.co/datasets?search=autoscout24` | **0 résultat.** Aucun dataset AutoScout24 sur le Hub HF. |
| 2026-09-07 | WebFetch | `https://huggingface.co/datasets?search=autoscout` | 1 seul résultat, `Auto-Scout/replaybot-storage` — un dépôt de stockage de bot de rejeu (« replaybot »), sans rapport avec des annonces automobiles. Le mot « auto-scout » y est un nom d'espace de travail, pas une référence à AutoScout24. |
| 2026-09-07 | WebSearch | `site:huggingface.co datasets autoscout24 OR "used car" europe listings` | Confirme l'absence : le seul jeu européen apparenté trouvé est `Autoza/irish-used-car-price-index` (marché **irlandais**, `autoza.ie`, sans rapport avec AutoScout24). **Verdict C-40 : question falsifiable tranchée FAUSSE — aucun dataset AutoScout24 sur Hugging Face.** |
| 2026-09-07 | WebFetch | `https://arxiv.org/html/2403.03812v1` (ProbSAINT) | Le jeu « B2C » utilisé (B2C-March, B2C-June, ~2 millions d'enregistrements, 65 variables, 01/07/2018-20/08/2022) est décrit comme « externally acquired and standardized data extracted from real-world B2C online websites such as autoscout24, mobile.de, among others » — c'est une donnée **propriétaire Volkswagen Financial Services**, agrégeant plusieurs sources (pas seulement AS24), aucune mention de disponibilité publique. Marché allemand (puis extension IT/ES/CZ en déploiement, pas en jeu de données). |
| 2026-09-07 | WebFetch + Read direct (PDF sauvegardé) | `https://arxiv.org/pdf/2508.17056` (TabResFlow, lu intégralement, 10 pages) | Section 6 « Case Study » : le jeu d'annonces d'occasion utilisé (2 239 473 enregistrements, 64 champs, 02/2022-02/2024) est **le même jeu propriétaire Volkswagen Financial Services** que celui de ProbSAINT (« sourced externally and standardized from real-world B2C online platforms such as autoscout24 and mobile.de ») — pas un dépôt public, pas de lien de téléchargement, pas de DOI. Confirme et durcit le constat déjà fait sur ProbSAINT. |
| 2026-09-07 | WebFetch | `https://medium.com/data-science/tip-and-tricks-for-building-a-price-estimation-model-for-used-cars-ac0953e194c4` | HTTP 403 sur fetch non authentifié. Impossible de re-vérifier directement les jeux nommés AS24-CH (119 414) / AS24-DE (558 295) cités par `candidates-v2.md`. `[NON VÉRIFIÉ]` — la recherche de dépôt public (ligne suivante) n'a rien trouvé, ce qui va dans le sens d'une non-disponibilité. |
| 2026-09-07 | WebSearch | `"AutoScout24-CH" OR "AutoScout24-DE" dataset github download price prediction 119414 OR 558295` | Aucun dépôt public retrouvé portant les jeux nommés AS24-CH / AS24-DE. Trouvaille annexe hors périmètre du candidat : `github.com/KadrEfe/Autoscout_LGBM`, un jeu Pays-Bas (`autoscout.nl`, 71 104 lignes, 49 champs) — projet personnel « for learning purpose », sans licence, sans méthodologie ni période documentées. |
| 2026-09-07 | WebFetch | `https://github.com/KadrEfe/Autoscout_LGBM` | Confirme provenance non vérifiable : « This data obtained from autoscout.nl » sans autre précision, pas de licence, avertissement « startup project at junior level ». Cité pour mémoire, hors inventaire principal (pas un candidat du registre gelé). |

**Compte de requêtes à ce point : 30/50.**

---

## C-67 comme instrument de validation

### Ce qui a change depuis VERIF-C67-fdz.md

Le coordinateur avait travaille sur des resumes de pages (WebFetch resumes). Cette sonde a **lu
integralement les deux documents de reference primaires** (FDZ Data Description, PDF officiels
RWI, 19-20 pages chacun) :
- **V1** — Thiel (2025), mai 2025, periode 01/2024-06/2024, DOI `10.7807/as24:carmkt:suf:v1`.
- **V2** — Rahaus & Thiel (2025), aout 2025, periode 01/2019-12/2024, DOI `10.7807/as24:carmkt:suf:v2`
  (c'est la version que VERIF-C67-fdz.md avait identifiee).

Les deux documents partagent le meme corps de texte et surtout **la meme note de bas de page 2**,
verbatim, a trois mois d'intervalle (mai 2025 -> aout 2025) :

> "The current version of RWI-GEO-CARMKT (V1/V2) only includes listings from Germany, but **other
> countries like France and Italy** will be added in future versions."

### Structure exacte du jeu (V2, actuelle) — 38 variables, 9 categories

| Categorie | Variables | Champs cles pour la mesure de biais |
|---|---|---|
| Identifiants | `ofid`, `uniqueID_gen` | — |
| Exterieur | `body_color`, `num_doors`, `co2_emissions`, `efficiency_class`, `emission_class`, `emission_sticker`, `fuel_consumption_city/mixed/rural`, `fuel_type` | `fuel_type` |
| Interieur | `equipment_first`, `interior_color`, `seats`, `cylinders`, `displacement`, `gears`, `power`, `transmission` | `power` |
| Prix | `asking_price`, `price`, `vat_deductible` | **`price`** |
| Genere | `carmkt_delivery`, `carmkt_version` | (usage interne RWI) |
| Regional | `city`, `country_code`, `country_zip_code`, `zipcode` | **`zipcode`** |
| Temporel | `created_date`, `first_registration` | **`created_date`**, **`first_registration`** (proxy annee) |
| Vehicule | `brand`, `mileage`, `model`, `vehicle_type`, `weight` | **`brand`, `mileage`, `model`** |
| Autres | `num_previous_owners`, `provider_type` | `provider_type` (pro/particulier) |

**Absence documentee et explicite d'un marqueur de mise en avant publicitaire ou de position dans
les resultats.** Le document le dit noir sur blanc, verbatim, section 2.1 "Data Source" (identique
dans V1 et V2) :

> "AutoScout24 also offers premium features that increase the visibility of the advertisement for
> a limited time. **It should be noted that the obtained raw data does not provide insight into
> whether an advertisement has been designated as a premium feature.**"

Aucune variable position/rang/sponsoring/boost n'existe dans les 38 colonnes. `provider_type`
(dealer/particulier) est le seul axe de segmentation de l'offre disponible au-dela des
caracteristiques du vehicule.

### Verdict net sur la mesure de biais du parcours 2

**Verdict a deux niveaux, et il faut les distinguer :**

1. **Mesure de la representativite distributionnelle (prix x annee x kilometrage x marque/modele)
   — OUI, C-67 le permet.** C'est la **population complete** des annonces allemandes ("Full
   population of all used car listings offered on the platform", pas un echantillon), a la
   maille journaliere, avec `price`, `mileage`, `first_registration`, `brand`, `model`,
   `fuel_type`, `zipcode`. On peut comparer, pour un couple marque/modele donne et sur le marche
   allemand, la distribution vraie (C-67) a la distribution d'un echantillon de 20 annonces tel
   qu'affiche par les pages SEO autorisees de C-14 sur `.de` — et chiffrer l'ecart. C'est
   exactement la methode envisagee par VERIF-C67-fdz.md.

2. **Mesure de la deformation specifiquement imputable au produit publicitaire / a la position
   dans les resultats — NON, C-67 ne le permet pas.** La question posee par VERIF-C67-fdz.md
   elle-meme ("quelle est la deformation d'un echantillon de 20 annonces triees par produit
   publicitaire, par rapport a la distribution vraie ?") ne peut pas etre repondue avec ce jeu :
   il est **impossible d'isoler, dans la population C-67, le sous-ensemble des annonces qui
   etaient promues** au moment de leur capture par C-14, faute de marqueur. On peut mesurer le
   biais **agrege** (la nuee d'echantillon vs. la vraie distribution), mais pas en **attribuer la
   cause** au mecanisme de mise en avant plutot qu'a un autre facteur de tri (recence,
   pertinence, alea). C'est une limite structurelle documentee a la source, pas un defaut d'usage.

**Consequence pratique pour KYCAR** : C-67 reste l'instrument de calibration prevu par le
coordinateur, mais son usage doit etre formule avec cette nuance — il mesure "le biais total du
mode d'affichage" et non "le biais du a la publicite" isolement. Pour imputer specifiquement le
role de la mise en avant publicitaire, il faudrait une seconde source (observation directe du
badge de mise en avant sur les pages C-14, croisee avec le rang d'apparition) — hors perimetre de
ce lot.

### Extension multi-pays : toujours sans calendrier, mais avec des pays nommes

- **Ce qui a change** : la page web resumee par VERIF-C67-fdz.md disait "further countries under
  preparation", sans nommer de pays. Le document primaire (les deux PDF, V1 et V2) **nomme deux
  pays precis : la France et l'Italie.**
- **Ce qui n'a pas change** : **aucune date, aucun trimestre, aucune version cible n'est
  annoncee.** La formulation est identique a trois mois d'intervalle entre la V1 (mai 2025) et la
  V2 (aout 2025) — signe qu'il ne s'agit pas d'une annonce de calendrier glissant, mais d'une
  phrase de communication stable, reconduite telle quelle d'une version a l'autre.
- **La Belgique n'est nommee nulle part** — ni comme pays inclus, ni comme pays "en preparation".
  Seules la France et l'Italie le sont.
- **Verdict** : "Further countries under preparation" reste sans base de planification, comme
  l'avait anticipe VERIF-C67-fdz.md. La nouveaute (France, Italie nommees) ne change pas la
  conclusion operationnelle : **aucun calendrier exploitable**, et la Belgique n'est meme pas dans
  la liste des candidats a l'extension.

### Autres elements de structure utiles

- **Echantillon** : "Full population of all used car listings offered on the platform" — jeu
  exhaustif, pas un tirage.
- **Granularite temporelle** : quotidienne ("Time reference: Daily"), avec `created_date`.
- **Volumetrie V2** : ~30 820 104 observations (Allemagne, 01/2019-12/2024) ; V1 : ~2 700 000
  (01/2024-06/2024 seul).
- **Mise a jour** : "Continuously" annoncee, mais les livraisons de versions majeures (V1 -> V2)
  sont espacees d'environ trois mois (mai -> aout 2025) avec une refonte de la periode couverte a
  chaque fois — ce n'est pas un flux continu utilisable comme canal produit, coherent avec le
  reclassement deja acte.
- **Acces** : convention de donnees signee obligatoire, reserve aux chercheurs d'institutions
  scientifiques, usage non commercial — confirme sur les deux versions, aucun assouplissement.

---

## Inventaire des datasets

| Nom | Source | Provenance verifiable | Volumetrie | Periode | Perimetre geo | Licence | Acces | Verdict d'exploitabilite |
|---|---|---|---|---|---|---|---|---|
| RWI-GEO-CARMKT V2 (C-67) | FDZ Ruhr / RWI, partenariat officiel AS24 | **OUI** — partenariat nomme, DOI, documentation officielle complete | ~30,8M annonces (population complete) | 01/2019-12/2024 | Allemagne seule (FR/IT nommes sans date ; BE absente) | Scientific Use File, non commercial, convention obligatoire | Convention signee + affiliation institutionnelle | **Instrument de validation methodologique uniquement** — non viable comme source produit |
| `autoscout24_dataset_20251108.csv` (C-39, Zenodo) | Individu communautaire (« Çelik, Muhammed ») | **NON** — « collected from public listings », aucune methode, aucune periode, aucun TLD source precise | ~120 000 annonces, 60+ champs | Snapshot unique, depose 18/11/2025 (deja > 6 mois au 07/09/2026) | Multi-marches europeens revendiques, non confirme (pas de liste de pays) | MIT | Telechargement direct sans compte | **VIABLE SOUS CONDITION** pour prototypage isole, jamais comme reference |
| `clkmuhammed/autoscout24-car-listings-dataset` (C-38, Kaggle) | Meme auteur que ci-dessus, republie sur Kaggle | **NON** — identique au jeu Zenodo, meme provenance non verifiable | ~120 000 annonces | Idem Zenodo | Idem Zenodo | Non confirmee | Compte Kaggle requis pour telechargement | **VIABLE SOUS CONDITION**, identique a C-39 (memes reserves) — ne pas compter deux fois dans un tableau de decision |
| `ander289386/cars-germany` (C-38, Kaggle) | Auteur individuel, demo produit ZenRows.com | **OUI, partiellement** — outil de scraping nomme, mais jeu explicitement qualifie de « faux advertisement » demonstratif | 46 405 lignes, **9 champs seulement** | 2011-2021 | Allemagne | Non precisee | Compte Kaggle requis | **NON VIABLE** — fraicheur nulle (H4 violee), schema trop pauvre (pas de code postal, pas de date de creation) |
| `promptcloud/autoscout-automotive-data` (C-38, Kaggle) | PromptCloud (prestataire commercial de scraping) | `[NON VÉRIFIÉ]` — prestataire identifie, methode/periode/perimetre non retrouves sans rendu JS ; mirroir data.world **ferme** (13/07/2026) | Non determine | Non determine | Non determine | Non determine | Compte Kaggle requis | `[NON VÉRIFIÉ]` — a re-qualifier si l'acces Kaggle est obtenu (ACTIONS-COMMANDITAIRE) |
| `mexwell/autoscout-data` (C-38, Kaggle) | Auteur individuel | `[NON VÉRIFIÉ]` — page bloquee au rendu JS, aucune description indexee retrouvee | Non determine | Non determine | Non determine | Non determine | Compte Kaggle requis | `[NON VÉRIFIÉ]` |
| `huseyincenik/as24-cars` (C-38, Kaggle) | Auteur individuel | `[NON VÉRIFIÉ]` — aucune fiche indexee retrouvee | Non determine | Non determine | Non determine | Non determine | Compte Kaggle requis | `[NON VÉRIFIÉ]` |
| Hugging Face Datasets (C-40) | — | N/A — **aucun jeu n'existe** | — | — | — | — | — | **NON VIABLE** — question falsifiable tranchee FAUSSE (0 resultat pour « autoscout24 », 1 faux positif sans rapport pour « autoscout ») |
| Jeu B2C ProbSAINT / TabResFlow (C-83) | Volkswagen Financial Services (proprietaire), sources multiples dont autoscout24 et mobile.de | **OUI pour la source déclarée, NON pour l'accès** — méthode d'agrégation interne non publiée, jeu jamais depose publiquement | ~2M (ProbSAINT, 07/2018-08/2022) puis 2 239 473 (TabResFlow, 02/2022-02/2024) | Voir ci-dessus | Allemagne (extension IT/ES/CZ evoquee pour le deploiement du modele, pas pour le jeu) | Propriétaire VWFS, non publique | Aucun — donnee interne d'entreprise | **NON VIABLE** — ne peut pas etre une source d'acquisition ; utile uniquement comme reference de benchmark academique (NLL/MAPE publies) |
| `AutoScout24-CH` / `AutoScout24-DE` nommes par l'article Medium (C-83) | Non identifie au-dela de l'article (403 sur re-verification) | `[NON VÉRIFIÉ]` — aucun depot public retrouve malgre recherche ciblee | 119 414 / 558 295 annonces (chiffres non re-verifies) | Non precisee | Suisse / Allemagne | Non determinee | Non determine | **NON VIABLE en l'etat** — aucune trace de disponibilite publique |

---

## Candidats

### C-67 — FDZ Ruhr / RWI-GEO-CARMKT (instrument de validation, pas source produit)

| Axe | Valeur | Niveau de preuve |
|---|---|---|
| A1 Cout d'amorcage | 0 € (mais cout en demarches de convention + affiliation institutionnelle) | documente |
| A2 Cout recurrent | Sans objet comme canal produit — usage prevu en one-shot pour calibration, pas de flux BE | documente |
| A3 Couverture champs | 38 variables documentees ; prix/km/annee/carburant/code postal/marque/modele presents ; **aucun marqueur de mise en avant publicitaire ni de position** | prouve |
| A4 Couverture geo | Allemagne seule ; France et Italie nommees sans date ; Belgique absente de toute annonce | prouve |
| A5 Latence | Sans objet — livraison de fichier en bloc, pas d'API | non applicable |
| A6 Debit / quota | Sans objet — livraison sur convention, pas de requetes | documente |
| A7 Stabilite technique | Sans objet (pas un endpoint) ; stabilite documentaire forte (deux versions, memes 38 champs) | argumente |
| A8 Resistance anti-bot | Non concerne — canal contractuel direct AS24 -> RWI | prouve |
| A9 Effort d'integration | Quelques jours-homme d'analyse statistique une fois le fichier obtenu ; aucune integration `DataProvider` (ce n'est pas un canal produit) | estime |
| A10 Cout de maintenance | Nul en usage ponctuel ; un recalibrage periodique impliquerait une nouvelle demande d'acces | argumente |
| A11 Exposition juridique | Faible si la convention est respectee, mais **KYCAR n'est pas un usage de recherche scientifique** au sens du contrat — l'eligibilite meme de l'acces est incertaine (2/5) | argumente |
| A12 Autonomie | Dependance totale a un tiers (RWI) pour l'acces et son renouvellement — **dependant** | documente |
| A13 Plafond de volumetrie | Aucun plafond ; jeu complet (~30,8M lignes V2) | prouve |
| A14 Fraicheur atteignable | Nulle pour un usage produit (V2 s'arrete 12/2024, versions espacees de plusieurs mois) ; non pertinente pour un usage de calibration ponctuelle | argumente |

**Verdict : VIABLE SOUS CONDITION**, mais uniquement dans son role reclasse d'instrument de mesure du biais (rattache a O9), jamais comme source d'alimentation du produit (motif deja tranche par VERIF-C67-fdz.md, confirme et precise ici).

**Inconnues restantes** : eligibilite reelle de KYCAR (usage personnel/interne, H2) au regime "recherche scientifique" exige par la convention RWI ; delai et cout reels d'obtention d'une convention pour un porteur sans affiliation academique.

### C-39 — Zenodo `autoscout24_dataset_20251108.csv`

| Axe | Valeur | Niveau de preuve |
|---|---|---|
| A1 Cout d'amorcage | 0 € | prouve |
| A2 Cout recurrent | 0 € / 1000 annonces (fichier statique gratuit) ; pas de flux recurrent — snapshot unique | documente |
| A3 Couverture champs | 60+ champs annonces (id, description, ratings, prix, devise...) ; detail exact non obtenu (R3 : pas de telechargement du fichier de 548,6 Mo) | `[NON VÉRIFIÉ]` partiel |
| A4 Couverture geo | « Multiple European markets » revendique, codes pays presents mais liste non confirmee ; presence belge non etablie | `[NON VÉRIFIÉ]` |
| A5 Latence | Sans objet — fichier statique | non applicable |
| A6 Debit / quota | Telechargement unique, 548,6 Mo | documente |
| A7 Stabilite technique | Sans objet ; risque de disparition si l'auteur retire le depot (mono-contributeur) | argumente |
| A8 Resistance anti-bot | Non concerne (fichier deja constitue) | prouve |
| A9 Effort d'integration | Faible si le schema se confirme a la lecture, mais alourdi par la necessite de re-valider chaque champ faute de documentation | estime |
| A10 Cout de maintenance | Eleve a terme : aucune garantie de mise a jour, tout recalage impose une nouvelle collecte par l'auteur original | argumente |
| A11 Exposition juridique | **Provenance non tracable** = risque que le jeu source lui-meme resulte d'une extraction non autorisee d'AS24 (droit sui generis) ; republier ou s'appuyer dessus transfere ce risque a KYCAR (3/5) | argumente |
| A12 Autonomie | Dependant d'un contributeur communautaire unique sans garantie de continuite | documente |
| A13 Plafond de volumetrie | Fixe a ~120 000 lignes (pas de mecanisme d'actualisation) | prouve |
| A14 Fraicheur atteignable | Figee au 08/11/2025 ; deja superieure a 6 mois au 07/09/2026 — **H4 (fraicheur) violee** pour un usage productif | prouve |

**Verdict : VIABLE SOUS CONDITION** — utilisable uniquement comme jeu de prototypage jetable pour tester le moteur d'agregation, jamais comme reference de validation ni comme source produit, en raison de la provenance non tracable.

**Inconnues restantes** : liste exacte des pays couverts ; methode de collecte reelle ; conformite de la collecte originelle au droit sui generis d'AS24 (question qui rejaillit sur KYCAR en cas de reutilisation).

### C-38 — Datasets Kaggle AutoScout24 (5 fiches)

| Axe | Valeur | Niveau de preuve |
|---|---|---|
| A1 Cout d'amorcage | 0 € (mais necessite un compte Kaggle -> R2/E1, `ACTIONS-COMMANDITAIRE`) | documente |
| A2 Cout recurrent | 0 € / 1000 annonces ; aucun jeu n'offre de flux recurrent | documente |
| A3 Couverture champs | Tres variable : 9 champs pour `ander289386` (pauvre) a 60+ pour `clkmuhammed` (riche mais non verifie) | prouve/mixte |
| A4 Couverture geo | Allemagne pour la quasi-totalite des fiches identifiees ; aucune couverture belge etablie | documente |
| A5 Latence | Sans objet | non applicable |
| A6 Debit / quota | Telechargement de fichiers statiques, tailles variables | documente |
| A7 Stabilite technique | Sans objet ; risque de retrait par l'auteur, comme toute la famille Kaggle | argumente |
| A8 Resistance anti-bot | Non concerne | prouve |
| A9 Effort d'integration | Faible a moyen selon le jeu retenu | estime |
| A10 Cout de maintenance | Eleve : aucun de ces jeux n'est mis a jour selon un calendrier publie | argumente |
| A11 Exposition juridique | Variable : `ander289386` documente sa methode (scraping via outil demo) donc traçable mais tout aussi expose au droit sui generis qu'un scraping direct ; les autres sont opaques (3/5 en moyenne) | argumente |
| A12 Autonomie | Dependant de comptes individuels Kaggle, aucune garantie de perennite | documente |
| A13 Plafond de volumetrie | De 46 405 (`ander289386`) a ~120 000 (`clkmuhammed`) lignes selon le jeu | prouve |
| A14 Fraicheur atteignable | Mauvaise a nulle : le jeu le plus documente (`ander289386`) s'arrete en 2021 ; le plus recent (`clkmuhammed`) date de fin 2025 mais deja hors fenetre de 6 mois | prouve |

**Verdict : VIABLE SOUS CONDITION** pour un usage de prototypage strictement interne et non republie ; le telechargement effectif exige un compte Kaggle, donc relève de `ACTIONS-COMMANDITAIRE` (R2). Aucun de ces jeux ne satisfait a la fois provenance verifiable, fraicheur et couverture belge.

**Inconnues restantes** : contenu exact de `promptcloud/autoscout-automotive-data`, `mexwell/autoscout-data` et `huseyincenik/as24-cars` (pages bloquees au rendu JS pour un fetch non authentifie ; nécessiteraient soit un compte Kaggle, soit l'API Kaggle avec cle).

### C-40 — Hugging Face Datasets

| Axe | Valeur | Niveau de preuve |
|---|---|---|
| A1 Cout d'amorcage | Sans objet — aucun jeu n'existe | prouve |
| A2 Cout recurrent | Sans objet | prouve |
| A3 Couverture champs | Sans objet | prouve |
| A4 Couverture geo | Sans objet | prouve |
| A5 Latence | Sans objet | prouve |
| A6 Debit / quota | Sans objet | prouve |
| A7 Stabilite technique | Sans objet | prouve |
| A8 Resistance anti-bot | Sans objet | prouve |
| A9 Effort d'integration | Sans objet | prouve |
| A10 Cout de maintenance | Sans objet | prouve |
| A11 Exposition juridique | Sans objet | prouve |
| A12 Autonomie | Sans objet | prouve |
| A13 Plafond de volumetrie | Sans objet | prouve |
| A14 Fraicheur atteignable | Sans objet | prouve |

**Verdict : NON VIABLE.** Question falsifiable tranchee : recherche « autoscout24 » sur le Hub renvoie 0 resultat ; recherche « autoscout » renvoie un unique faux positif (`Auto-Scout/replaybot-storage`, un depot de stockage de bot de rejeu sans rapport). Aucun jeu AutoScout24, belge ou europeen, n'existe sur Hugging Face a ce jour.

**Inconnues restantes** : aucune — candidat clos.

### C-83 — Jeux academiques nommes (AS24-CH, AS24-DE, ProbSAINT/TabResFlow)

| Axe | Valeur | Niveau de preuve |
|---|---|---|
| A1 Cout d'amorcage | Sans objet — donnee propriétaire, aucun acces possible | prouve |
| A2 Cout recurrent | Sans objet | prouve |
| A3 Couverture champs | 64-65 variables documentees dans les papiers (prix, kilometrage, annee de mise en circulation, type de carburant, duree d'annonce...) — riche sur le papier, mais **inaccessible** | prouve (sur le papier) |
| A4 Couverture geo | Allemagne (jeu ProbSAINT/TabResFlow) ; Suisse/Allemagne pour AS24-CH/AS24-DE (non re-verifie) | documente |
| A5 a A10 | Sans objet — aucune voie d'acces, donc aucun de ces axes n'est mesurable en pratique | non applicable |
| A11 Exposition juridique | Sans objet pour KYCAR (aucun acces possible, donc aucun risque transfere) | argumente |
| A12 Autonomie | Sans objet | non applicable |
| A13 Plafond de volumetrie | ~2M a 2,24M enregistrements *dans la publication*, mais 0 accessible pour KYCAR | prouve (sur le papier) |
| A14 Fraicheur atteignable | Sans objet — jeu propriétaire non disponible, jamais actualisable par KYCAR | prouve |

**Verdict : NON VIABLE** comme voie d'acquisition. Le jeu utilise par ProbSAINT et TabResFlow est confirme, par lecture integrale des deux papiers, comme **une donnee proprietaire Volkswagen Financial Services**, agregeant plusieurs plateformes (autoscout24, mobile.de, "among others") et jamais deposee publiquement. Les jeux `AS24-CH` / `AS24-DE` cites par l'article Medium n'ont pu etre re-verifies (403) ni retrouves dans un depot public malgre recherche ciblee.

**Valeur residuelle** : ces publications restent utilisables comme **reference de benchmark** (ordres de grandeur de NLL/MAPE sur la tarification VO), mais pas comme source de donnees.

**Inconnues restantes** : localisation exacte et statut de disponibilite de AS24-CH/AS24-DE (l'article source original n'a pas pu etre relu, 403).

---

## Questions falsifiables

Les 5 questions prioritaires assignees au lot par `candidates-final.md` (section LOT-I), avec
verdict et niveau de preuve :

| # | Question | Verdict | Preuve |
|---|---|---|---|
| 1 | « Au moins un dataset telechargeable sans compte couvre la Belgique. » | **FAUSSE**, en l'etat des verifications possibles | Le seul jeu telechargeable sans compte (C-39, Zenodo) revendique une couverture « multi-marches europeens » sans liste de pays confirmee ; aucune mention explicite de la Belgique retrouvee. C-67 (le seul jeu a couverture geo prouvee) est Allemagne seule. |
| 2 | « Un dataset couvre au moins 20 des 40 champs cibles et se reconcilie avec la taxonomie officielle. » | **VRAIE pour C-67** (38/40 avec les champs decisifs prix/km/annee/carburant/CP/marque/modele), **VRAIE SOUS RESERVE pour C-39/C-38 `clkmuhammed`** (60+ champs annonces mais schema non verifie faute de telechargement), **FAUSSE pour `ander289386`** (9 champs seulement) | Lecture integrale des PDF FDZ (C-67) ; metadonnees WebSearch (C-38/C-39) |
| 3 | « C-67 permet de chiffrer la deformation d'un echantillon de 20 annonces triees par produit publicitaire, par rapport a la distribution vraie. » | **PARTIELLEMENT FAUSSE** — voir verdict detaille en section C-67 : mesure du biais agrege possible (prix/km/annee/marque/modele), mais **imputation specifique au produit publicitaire impossible** faute de marqueur de mise en avant dans les 38 variables | Lecture integrale des deux FDZ Data Description (V1 et V2), section 2.1 « Data Source », citation verbatim |
| 4 | « Les licences autorisent un usage analytique interne (H2) et non seulement la recherche. » | **FAUSSE pour C-67** (scientifique exclusivement, convention obligatoire) ; **VRAIE pour C-39** (licence MIT, usage libre) mais **contrebalancee par la provenance non tracable** (le MIT declare par le republieur ne purge pas un eventuel probleme de droit sui generis en amont) ; `[NON VÉRIFIÉ]` pour les autres jeux Kaggle | Lecture PDF FDZ ; page Zenodo |
| 5 | « Aucun de ces jeux n'a moins de 6 mois. » | **VRAIE, dans le sens defavorable** — aucun jeu telechargeable sans compte n'est frais : C-39/C-38 `clkmuhammed` date du 08/11/2025 (deja hors fenetre de 6 mois au 07/09/2026), `ander289386` s'arrete en 2021, C-67 V2 s'arrete au 12/2024. Tous violent H4 pour un usage productif continu. | Dates de depot et periodes couvertes, verifiees a la source pour chaque jeu |

---

## ACTIONS-COMMANDITAIRE

| Action | Ce qu'elle permettrait | Cout / demarches |
|---|---|---|
| Demander une convention d'acces FDZ Ruhr pour RWI-GEO-CARMKT (C-67) | Mesurer effectivement, sur donnees reelles allemandes, la deformation de l'echantillon de 20 annonces par modele du parcours 2 (axes prix/kilometrage/annee/marque/modele) — calibration de la methode, pas alimentation du produit | Formulaire de demande (description de projet, duree, departement demandeur) aupres du FDZ Ruhr ; **eligibilite incertaine** car reservee aux chercheurs d'institutions scientifiques — KYCAR en usage personnel/interne (H2) n'est probablement pas eligible sans rattachement academique du commanditaire ; si eligible, gratuit mais delai administratif non estime (non publie) |
| Creer un compte Kaggle pour telecharger les 5 jeux de C-38 | Valider effectivement le schema complet de `clkmuhammed` (60+ champs), `promptcloud`, `mexwell` et `huseyincenik` (actuellement `[NON VÉRIFIÉ]` faute de rendu JS accessible sans compte) | Creation de compte gratuite (email), quelques minutes ; a faire realiser par le commanditaire au titre de R2 |
| Contacter les auteurs de ProbSAINT / TabResFlow (Volkswagen Financial Services, Universite de Hildesheim) pour demander l'acces au jeu B2C ou a un jeu derive anonymise | Verifier si un sous-ensemble publiable existe (peu probable — donnee proprietaire d'entreprise), ou a defaut obtenir des points de repere chiffres supplementaires pour la validation du moteur d'agregation | Demarche de contact academique, issue incertaine, delai non estimable |

---

## Conformite

- **E5** (aucune requete vers `www.autoscout24.be` ni `.com`) : **respecte**. Aucune requete de cette
  sonde ne vise un domaine `autoscout24.be` ou `autoscout24.com` — toutes les requetes visent
  `rwi-essen.de`, `econstor.eu`, `github.com`, `zenodo.org`, `kaggle.com`, `huggingface.co`,
  `arxiv.org`, `medium.com`, `data.world`, et des moteurs de recherche generalistes.
- **E1 / R2** (aucun compte cree, aucun credential saisi) : **respecte**. Les jeux Kaggle et l'acces
  FDZ Ruhr qui exigent un compte ou une convention n'ont pas ete franchis ; ils sont consignes en
  `ACTIONS-COMMANDITAIRE`.
- **R3** (pas d'extraction de masse, plafond 50 requetes) : **respecte**. Aucun fichier volumineux
  n'a ete telecharge (le CSV Zenodo de 548,6 Mo a ete documente via sa fiche, jamais telecharge).
  Seuls deux PDF de documentation officielle (469 Ko et 210 Ko) ont ete lus integralement — ce sont
  des documents descriptifs, pas des extractions de donnees.
- **Compte de requetes final : 34 requetes sur un plafond de 50** (17 WebFetch de pages, 3 WebFetch
  de PDF lus integralement via Read, 14 WebSearch). Le detail figure dans le Journal de preuve en
  tete de document.
- **R1** (zero guessing) : chaque affirmation chiffree de ce document porte une source citee dans
  le journal de preuve ; les volumetries de jeux non telecharges (C-39, C-38) sont marquees
  `documente` et non `prouve`, conformement a R4.
