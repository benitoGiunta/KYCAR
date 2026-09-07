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
