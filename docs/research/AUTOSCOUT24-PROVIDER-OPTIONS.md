# AUTOSCOUT24-PROVIDER-OPTIONS — voies d'accès aux données d'annonces AutoScout24

**Date** : 2026-09-09. **Agent** : chercheur documentaire (Opus, effort high).
**Question du commanditaire** : « Le Parking affiche des annonces AutoScout24, donc un accès existe.
Quelles sont TOUTES les alternatives, et à quelles conditions ? »
**Réponse à corriger** : une première réponse, antérieure au projet, concluait « pas d'API de lecture
officielle ; seule voie = API tierces de scraping (Apify, Piloterr) ». Ce rapport la vérifie, la
complète et la corrige — voir §9.4.

## Méthode et limites

- **Sources primaires vérifiées par requête directe** le 2026-09-09 : pages corporate et tarifaires
  de `leparking.fr` (éditeur, CGU, offre « Parking Data », sourcing, partenaires), pages produit des
  fournisseurs (Apify, Piloterr, Carapis, auto-api, Carsdata), décisions et commentaires de justice.
- **Sources tiers-médiées** (résumé de moteur de recherche, page non récupérée) : marquées
  `[TIERS-MÉDIÉ]`. Ce qui n'a pas pu être vérifié est marqué `[NON VÉRIFIÉ]` ou écrit comme hypothèse.
- **E5 respectée : zéro requête vers `autoscout24.*` et vers `2dehands/marktplaats`.** Le `robots.txt`
  d'`autoscout24.be` n'a **pas** été re-téléchargé : sa capture du 2026-09-07 (`docs/research/probe-LOT-K.md`
  req 7) est réutilisée, et elle place `ClaudeBot` en `Disallow: /` avec 16 préfixes `Allow` seulement.
  Toutes les affirmations sur les CGU et les pages AS24 proviennent de relevés antérieurs du dépôt
  (`probe-LOT-K.md`, `FINDING-allowed-surface.md`, `docs/reference/AS24-REFERENCE-API.md`), datés et cités.
- Aucun compte créé, aucune inscription, aucun essai activé (E1/R2). Aucune question posée (E3).

---

## §1. Résumé exécutif

1. **Une API de lecture officielle existe** : la **SEARCH API AutoScout24** (portail concessionnaires `.de`), donnant accès par interface à « des données étendues […] et des millions d'annonces », pour applications et sites tiers — mais **commerciale, sur devis, sans self-service**. La première réponse était **fausse sur ce point** [S17].
2. La **Listing Creation API** officielle est en **écriture seule** ; ses endpoints `/makes` et `/references` servent en revanche gratuitement toute la **taxonomie** (295 marques, 4 955 modèles, 673 valeurs), déjà ingérée par KYCAR [S18].
3. **Le Parking = ADS4ALL SARL (Paris, RCS 534 203 153)**, 15,2 M d'annonces, 964 sites. Méthode **prouvée par ses propres déclarations** : collecte automatisée « comme les moteurs de recherche », sans contacter les sites ; les flux ouverts par certains portails sont une régularisation *a posteriori* [S1][S6].
4. **Cette méthode a été jugée illicite, définitivement** : TJ Paris 08/07/2021 (50 k€), CA Paris 2023 (100 k€), **Cass. 1re civ. 15/10/2025 n° 23-23.167** rejetant le pourvoi d'ADS4ALL [S7][S8][S9]. « Le Parking le fait » n'est pas un précédent favorable : c'est le contre-exemple documenté.
5. Le raisonnement est **européen** : CJUE *Innoweb c/ Wegener* (C-202/12, 19/12/2013) qualifie le méta-moteur dédié de réutilisation de la base cible [S10]. Il s'applique en Belgique.
6. Les **CGU AS24 belges (art. 9.2/9.3)** interdisent *verbatim* « les requêtes automatisées par script » et de « constituer sa propre base de données » ; *Ryanair c/ PR Aviation* (C-30/14) valide une telle clause **même sans droit de base de données** [S11][S33].
7. **Le marché des API tierces est réel et bon marché** : Apify 0,49–1,00 $/1 000 annonces, Piloterr 2,26–2,72 $/1 000 requêtes — soit **~45 €/mois** (instantané mensuel) à **~1 300–2 800 €/mois** (rafraîchissement quotidien) pour la Belgique [S20][S21][S22]. Techniquement viable, juridiquement dans la même zone que Le Parking : le fournisseur exécute, le donneur d'ordre répond.
8. **Fait belge décisif, absent des analyses antérieures** : le **30/04/2026 l'Autorité belge de la concurrence a ordonné à AutoScout24 Belgium de rétablir le transfert automatisé des données** des vendeurs professionnels vers une plateforme concurrente (TCS Mobility / Touring Carselect), sous astreinte de 20 000 €/jour plafonnée à 7 M€ [S14][S15][S16]. La portabilité du stock concessionnaire est défendue par le régulateur belge.
9. **Voie payante immédiate pour le mode 1** : « **Parking Data** » de Le Parking — 49,90 / 190 / 290 €HT/mois, **Belgique couverte**, prix marché, volumes, tendances 30 mois, « plusieurs API » sur demande [S3]. Acheter la donnée à l'agrégateur déplace le risque vers le vendeur, sous réserve de garantie écrite.
10. **Recommandation** : mode 1 par contrat (Parking Data, INDICATA) ou agrégats officiels ; mode 2 par flux concessionnaire consenti (levier ABC) ou SEARCH API sous devis ; **jamais** de collecte directe sur `autoscout24.*`, ni via scraper tiers, sans avis juridique écrit préalable.

---

## §2. Voies officielles AutoScout24

### 2.1 SEARCH API (lecture, commerciale) — **la correction principale**

- Page produit officielle : `https://www.autoscout24.de/haendlerportal/schnittstelle-search-api/`,
  intitulée « Die AutoScout24 SEARCH API für Fahrzeugdaten ». Décrite comme donnant accès, par
  interface, à « des données étendues, des informations détaillées et des millions d'annonces »,
  « idéale pour des applications, des sites web ou des logiciels sur mesure » [S17] `[TIERS-MÉDIÉ]`.
- Canal commercial relevé en phase 1.4 : `searchapi@autoscout24.com`, +49 89 44456-1000
  (`probe-LOT-K.md`, 2026-09-07) [S33]. Pas de tarif public, pas de self-service, pas d'inscription en ligne.
- Indice technique concordant : le `robots.txt` d'`autoscout24.be` (capture 2026-09-07) contient des
  `Disallow` sur `/listing-search-api/graphql` et `/ocs/api/graphql` — des endpoints internes nommés
  « search-api » existent bien [S33].
- **Inconnues qui ne peuvent être levées que par le commanditaire** (E1 interdit le contact commercial) :
  périmètre pays (Belgique incluse ?), éligibilité d'un éditeur **non-concessionnaire**, grille tarifaire,
  quotas, droit de stockage et de réaffichage. Tout cela est `[NON VÉRIFIÉ]`.
- **Portée juridique** : c'est le **seul canal** qui ferait sortir KYCAR du régime d'interdiction des
  CGU (art. 9.2/9.3) — un contrat de licence prime sur les conditions générales.

### 2.2 Listing Creation API (écriture seule + référentiels en lecture libre)

- `https://listing-creation.api.autoscout24.com/docs` : cycle de vie des annonces **pour le
  concessionnaire** (créer, publier, mettre à jour, supprimer). **Aucun endpoint de recherche ni de
  liste** — confirmé par un tiers indépendant : « The Listing Creation API is write-only. There's no
  search endpoint, no browse endpoint, and no way to query vehicle data through official channels »
  (Scrapfly, 10/08/2026) [S19]. Un même tiers signale que l'accès serait désormais restreint à un
  ensemble de concessionnaires agréés [S19] `[NON VÉRIFIÉ]`.
- **Mais** : `GET /makes` et `GET /references?referenceType=…` répondent **200 sans authentification** et
  servent la taxonomie complète et les 33 référentiels — vérifié par exécution le 2026-09-06 et déjà
  ingéré (`data/reference/`, 295 marques, 4 955 modèles, 673 valeurs) [S18]. **Zéro annonce** : c'est de
  la classification, pas de l'inventaire.

### 2.3 Interfaces concessionnaires (sens *push*), packs partenaires

- `autoscout24.de/partner-infoportal/schnittstellen/` : « Einfach, schnell, kostenlos: die AutoScout24 Schnittstellen! » — import du stock **vers** AS24 (web upload ou API) [S17] `[TIERS-MÉDIÉ]`. Sens unique : ce canal alimente AS24, il n'en sort rien.
- CGU B2B belges art. 17.2 : nomme une « interface technique » de transmission **du professionnel vers** AS24, et un accès à des **données agrégées de performance** (nombre d'appels, de demandes) réservé au professionnel sous forfait — aucun export d'inventaire vers un tiers [S33].
- « **Partner Pakketten** » (NL, 01/03/2026) : *data insights* et outils IA pour concessionnaires sous contrat [S31] `[TIERS-MÉDIÉ]` ; outil d'analyse concurrentielle géolocalisé annoncé en 09/2024 [S37] `[TIERS-MÉDIÉ]`. Même verrou dans les deux cas : statut concessionnaire, usage interne, pas de flux réutilisable par un éditeur tiers.
- **HändlerIQ / portail développeur `portal.services.as24.tech`** : `robots.txt` = `Disallow: /`, portail Backstage rendu côté client, documentation inaccessible sans compte [S33]. Fermé.

### 2.4 Publications de marché AS24 (agrégats gratuits, non machine-readable)

AutoScout24 Belgium publie un **baromètre du marché de l'occasion** et des analyses régulières (`/fr/entreprise/communiques/`, `/fr/entreprise/statistiques/`, `/fr/informer/actualite/…`), le plus souvent adossées à Febiac/Traxio/DIV avec quelques chiffres propres à la plateforme [S33][S37]. Format : article HTML ou PDF, **pas d'API, pas de série temporelle téléchargeable**. Utilité pour KYCAR : **calibration et recoupement** d'un mode 1, pas une source d'alimentation.

### 2.5 Ce qui n'existe pas

Aucune page « devenir partenaire », « API », « licence » ou « export » dans l'inventaire de `/fr/entreprise/` ni de `/nl/onderneming/` ; aucune directive `Sitemap:` dans les `robots.txt` `.be` et `.de` (donc pas de sitemap public exploitable) ; aucun flux RSS/XML public d'annonces ; aucun programme d'affiliation servant des annonces (Awin/Daisycon ne servent que des créatifs publicitaires) — relevés 2026-09-07 [S33].

---

## §3. Le Parking : qui, comment, et ce qu'il en est advenu

### 3.1 Identité

Éditeur : **ADS4ALL, SARL au capital de 165 000 €, RCS Paris 534 203 153, 2 rue de Tocqueville, 75017
Paris**, directeur de publication Fabrice Fournier, TVA FR 12 534203153 [S1]. Le site revendique
**15,2 millions d'annonces**, **964 sites référencés**, **~300 000 annonces quotidiennes**, plus de
70 pays, et décline des versions **Belgique (FR) et België (NL)** [S1][S2]. Domaine international :
`theparking.eu`. Chiffre d'affaires 1 M€ en 2018, autofinancé [S6].

### 3.2 Comment ils obtiennent les annonces AutoScout24 — **prouvé, par leur propre bouche**

Interview du dirigeant (Journal Auto, 25/09/2019) [S6] : « **Nous ne les contactons pas, nous opérons comme les moteurs de recherche**, à savoir que nous récupérons les principales caractéristiques des véhicules » ; « nous ne prenons pas toutes les données techniques, ni toutes les photos, ni mêmes toutes les coordonnées **pour ne pas voler la valeur substantielle** » ; « certaines d'entre elles comprennent le schéma et **nous ouvrent des flux** pour optimiser la récupération d'information » ; « il en existe toutefois certaines qui souhaitent être retirées ».

**Conclusion, niveau de preuve « prouvé »** : le mode d'entrée par défaut est la **collecte automatisée non sollicitée** ; les flux fournis sont une régularisation *a posteriori*, au cas par cas. La modération volontaire du périmètre extrait est explicitement une **stratégie de défense juridique** — celle-là même qui a échoué en justice (§3.3).

Corroboration interne au dépôt : sur une seule page BE de `theparking.eu` (2026-09-07), les marqueurs de source comptent **2ememain ×46, autoscout24 ×24, gocar ×13** — Le Parking est bien un miroir partiel d'AS24 en Belgique [S34].

### 3.3 Ce que la justice en a dit — trois degrés, jusqu'à la Cour de cassation

| Décision | Date | Contenu |
|---|---|---|
| TJ Paris, 3e ch. 1re sect. | **08/07/2021** | Groupe La Centrale c/ ADS4ALL : extraction/réutilisation substantielle (art. L.341-1 et L.342-1 CPI), « quasi-totalité des annonces » reprises par robots ; **50 000 €**, interdiction sous astreinte **1 000 €/jour**, publication judiciaire [S7] |
| CA Paris | **09/2023** | Confirmation, **100 000 €** de dommages-intérêts [S8][S9] |
| **Cass. 1re civ.** | **15/10/2025, n° 23-23.167** | **Rejet du pourvoi d'ADS4ALL.** Critère consacré : l'exploitation litigieuse « fait peser un **risque sur l'amortissement des investissements** du producteur » ; investissements de vérification (bases SIVIN, outils anti-fraude) reconnus [S8][S9] |

Le juge a écarté la qualification de « moteur de recherche » : reproduction complète à intervalles
réguliers et présentation comme sienne [S7][S9].

**Décision voisine et plus récente encore** : **CA Versailles, 14/04/2026, n° 24/05370**, LBC France
(leboncoin) c/ Babel France (Jinka) — **200 000 €**, interdiction sous astreinte de **500 € par annonce**
extraite ou réutilisée (3 mois après signification, pendant 1 an), 53 000 € de frais [S13][S9].
L'argument « nous n'affichons qu'un aperçu avec lien vers la source » a été **rejeté** [S9].

### 3.4 Ce que Le Parking vend — et qui devient une voie d'accès pour KYCAR

Le Parking monétise la métadonnée qu'il a agrégée, sous le nom **« Parking Data »** [S3] :

| Formule | Prix | Contenu |
|---|---|---|
| START | **49,90 €HT/mois** | navigation sans pub, prix marché par annonce avec indice de confiance réactualisé quotidiennement, alerting pro (100 alertes, 30 j d'historique, baisses de prix) |
| CONFORT | **190 €HT/mois** | + « Marché » : volumes de vente, modèles les plus représentés, **tendances sur 30 mois**, en temps réel, sur 2 pays au choix ; + « Prix Marché » : cotation, nb de véhicules similaires en vente, **temps moyen de vente**, attractivité |
| PERFORMANCE | **290 €HT/mois** | + analyse de stock (sous/sur-pricing, *market day supply*) |

Pays couverts, **Belgique explicitement citée** : Allemagne, Royaume-Uni, Autriche, **Belgique**, Bulgarie,
Croatie, Danemark, Espagne, Finlande, Hongrie, Irlande, Italie, Luxembourg, Norvège, Pays-Bas, Portugal,
Pologne, Suède, Canada, USA, Brésil, Suisse. Et surtout : « **Nous disposons également de plusieurs API
directement interfaçables avec vos propres outils. Contactez-nous pour obtenir la documentation.** » [S3]
Offre complémentaire « Sourcing » : à partir de **200 €** selon volume [S4]. Contact : formulaire +
téléphone, 2 rue de Tocqueville [S5].

**Ironie utile** : les CGU de Le Parking interdisent à ses propres utilisateurs « d'utiliser un robot,
notamment d'exploration (spider) […] permettant de récupérer ou d'indexer tout ou partie du contenu du
site leparking.fr » et de « reproduire en nombre […] des petites annonces » [S1]. La donnée de Le
Parking ne s'obtient donc licitement **que par son offre payante**.

### 3.5 Autres agrégateurs et leur modèle

- **Trovit / Mitula / Nestoria (LIFULL Connect)** : modèle **inverse** — les portails et annonceurs
  **poussent un flux XML** vers l'agrégateur pour acheter du trafic (CPC/CPM) [S36]. C'est le modèle
  contractuel propre : la donnée est **fournie**, pas prise. Transposable à KYCAR côté concessionnaires (§7.1).
- **AutoUncle** : valorisation, 14 pays, **Belgique non couverte** — écarté en phase 1.4 [S33].
- **Indicata (groupe Autorola)** : voir §7.3, présence belge établie (`indicata.be`).
- **Carsdata (EAG Group)** : agrégation de « listings from 31 auctions and platforms », dédoublonnage par
  empreinte (VIN, photos, métadonnées), **Belgique dans la liste de pays**, produit « Classifieds
  Analysis » explicitement adossé à AutoScout24 et mobile.de ; **aucune mention de licence officielle**
  auprès de ces portails ; tarifs non publiés, démo/essai 14 j [S25].

---

## §4. Cadre juridique applicable à un agrégateur belge

| Fondement | Source | Ce qu'il implique pour KYCAR |
|---|---|---|
| **Droit *sui generis* du producteur de base de données** (dir. 96/9/CE ; en Belgique CDE Livre XI, art. XI.306 s. ; en France art. L.341-1 CPI) | [S7][S9][S10] | Interdit l'extraction/réutilisation d'une partie **substantielle**, et les extractions répétées de parties non substantielles. **C'est le fondement des trois condamnations de §3.3.** |
| **CJUE *Innoweb c/ Wegener*, C-202/12, 19/12/2013** | [S10] | Un **méta-moteur dédié** qui offre le même formulaire, traduit les requêtes en temps réel vers la base cible et présente les résultats dans son propre format **réutilise** la base. Le fait de ne rien stocker ne protège pas. |
| **CJUE *Ryanair c/ PR Aviation*, C-30/14, 15/01/2015** | [S11] | Si la base n'est protégée **ni** par le droit d'auteur **ni** par le *sui generis*, la directive ne s'applique pas — et **les clauses contractuelles d'interdiction restent valables**. Autrement dit : pas de « refuge » si le *sui generis* échoue ; les CGU prennent le relais. |
| **BGH, 30/04/2014, I ZR 224/12 (« Flugvermittlung im Internet »)** | [S12] | En droit **allemand de la concurrence déloyale**, le *screen scraping* de données librement accessibles **n'est pas en soi déloyal** en l'absence de **mesure technique de protection**, même si les CGU l'interdisent (l'acceptation de CGU n'est pas une mesure technique). **Seul contrepoids favorable trouvé** — mais il porte sur l'UWG, **pas** sur le droit des bases de données, et AS24 déploie **Akamai Bot Manager** [S19], donc une mesure technique existe : le contournement rouvrirait le grief. |
| **CGU AutoScout24 Belgium — utilisateur privé, art. 9.2/9.3** (relevé 2026-09-07) | [S33] | *Verbatim* : « **Les requêtes automatisées par script, le contournement du masque de recherche par un logiciel de recherche ou des mesures similaires ne sont pas autorisés.** […] L'utilisateur ne peut utiliser les données obtenues […] pour **constituer sa propre base de données** ». C'est **exactement l'objet de KYCAR**. Version B2B art. 3.3 : même interdiction, « poursuite civile et le cas échéant pénale » côté allemand. |
| **`robots.txt` d'`autoscout24.be`** (capture 2026-09-07) | [S33] | `ClaudeBot`/`GPTBot`/`CCBot`… : `Disallow: /` avec 16 préfixes `Allow` (aucun ne couvre les pages d'annonces `/lst`). Pas opposable en soi, mais **élément d'appréciation** de la mauvaise foi. |
| **RGPD** | [S19] et R3 KYCAR | Les fournisseurs tiers exposent `sellerCompanyName`, `sellerContactName`, `sellerRating`, coordonnées [S20][S21]. **R3 impose leur suppression à l'ingestion** : `DataProvider` n'a structurellement aucune colonne pour les accueillir (`src/providers/DataProvider.ts`). Contrainte à répercuter dans tout contrat fournisseur. |
| **Droit belge de la concurrence — ABC, 13/03/2026 et 30/04/2026** | [S14][S15][S16] | Voir §7.2. Va **dans le sens** de l'ouverture des données de stock des vendeurs professionnels. |

**Synthèse juridique** : la voie « collecte automatisée sur `autoscout24.*` », quelle que soit sa mise en
œuvre (code propre, Apify, Piloterr, proxy), cumule **trois** griefs potentiels — *sui generis*,
manquement contractuel aux CGU, et (si contournement d'Akamai) déloyauté. Le fait qu'un tiers exécute
la collecte ne déplace pas la responsabilité : le donneur d'ordre est le réutilisateur.

---

## §5. API tierces de scraping / data-as-a-service

Prix relevés le 2026-09-09. « Coût BE » = hypothèse de travail sur **~100 000 annonces belges**, en trois
régimes : **1 instantané/mois** ; **1 instantané/jour** (30 × 100 k = 3 M résultats) ; **delta quotidien**
(hypothèse 10 % de mouvement/jour ≈ 400 k résultats/mois).

| Fournisseur | Produit | Prix affiché | Coût BE indicatif | Champs / limites | Statut |
|---|---|---|---|---|---|
| **Apify — `3x1t/autoscout24-scraper-ppr`** | acteur *pay-per-result* | **0,49 $/1 000 résultats** | ~49 $/mois (mensuel) ; **~1 470 $/mois** (quotidien) ; ~196 $/mois (delta) | domaines `.com .it .nl .de .at .be .fr .es` (`.ch` = acteur séparé) ; titre, description, prix, marque, modèle, images, specs, équipements, **coordonnées et notes du concessionnaire** ; ~20 résultats/s ; **plafond 4 000 résultats par URL de recherche** → segmentation obligatoire ; 409 utilisateurs [S20] | technique OK, **juridiquement identique au cas Le Parking** |
| **Apify — `rigelbytes/autoscout24-scraper`** | *pay-per-event* | **à partir de 1,00 $/1 000** | ~100 $ à ~3 000 $/mois | 19 pays, >30 champs dont `sellerCompanyName`, `sellerContactName`, `sellerRating` ; taux de succès annoncé 97,4 % ; **4 utilisateurs** (maturité faible) [S21] | idem |
| **Apify — autres acteurs** (`fayoussef`, `ivanvs`, `studio-amba`, `memo23`, `ahmed_jasarevic`) | acteurs communautaires | ~0,8 $/1 000 annoncé côté agrégateurs [S24] | — | qualité et maintien très inégaux ; aucun engagement de service | idem |
| **Piloterr** | `GET /v2/autoscout24/search` + `/ad` | **49 $/mois** (18 k crédits, 2,72 $/1 000), 99 $ (2,48), 249 $ (2,26) ; **+500 crédits d'essai sans CB** | 1 crédit = 1 requête ; **ratio annonces/requête `[NON VÉRIFIÉ]`** — si 20 annonces/page : ~14 $/instantané, **~410 $/mois** en quotidien | résultats paginés, specs, prix, **infos vendeur**, images ; 7–15 req/s selon plan ; 392 k requêtes servies, 66 utilisateurs [S22] | idem |
| **Carapis** | parser + API REST `api.carapis.com/v2/listings` | **non publié** (page `/pricing` séparée) | devis | ~2,5 M annonces sur 18 pays, **Belgique nommée** ; marque, modèle, année, specs, km, prix, vendeur, photos ; schéma homogène multi-marchés [S23] | devis, conformité non documentée |
| **auto-api.com** | API temps réel + exports CSV/JSON/Excel | **non publié** | devis | détection des nouvelles annonces « en 60 s » ; 18 pays ; **Belgique non explicitement citée** ; éditeur non identifiable (contact e-mail + Telegram) [S24] | **opacité de l'éditeur — écarter** |
| **Carsdata (EAG Group)** | *Classifieds Analysis*, pricing intelligence | **non publié**, essai 14 j | devis | 31 sources agrégées, dédoublonnage par empreinte VIN/photos, **BE couverte**, DPA mentionné [S25] | devis ; **exiger la garantie de provenance** |
| **Bright Data / Oxylabs / Zyte / Decodo / Nimble** | déblocage générique, pas de SKU AS24 | Zyte à partir de **0,13 $/1 000 requêtes HTTP** (plan de base) ; Oxylabs Web Scraper API à partir de **49 $/mois**, résidentiel 8 $/Go ; Bright Data PAYG à partir de **150 $** [S35] | 400 $ à 4 000 $/mois selon le niveau de déblocage requis | ce sont des **passe-murailles**, pas des jeux de données : le parsing, la conformité et le risque restent chez le client | **aggravant** : leur valeur ajoutée est de franchir Akamai |
| **GitHub (open source)** | `WebOlivia/autoscout24-scraper` (`.com .de .it .nl .fr .es .at .be`), `lorenzoelia`, `0Baris`, `bocchilorenzo`, `mauropelucchi`, `aolieman` (« personal & educational use only ») | 0 € | coût d'infrastructure + maintenance DOM | qualité variable, aucun engagement, casse à chaque changement de DOM ; **ne franchissent pas Akamai** [S27] | 0 € de licence, **100 % du risque** |

**Ce que ces voies valent réellement.** Elles résolvent le mode 2 (annonces unitaires, champs riches) pour
quelques centaines à quelques milliers d'euros par mois. Elles ne résolvent **rien** au plan juridique :
aucun de ces fournisseurs ne détient de licence AutoScout24, aucun ne garantit la conformité ;
Scrapfly, qui vend pourtant le service, place un avertissement « consult a lawyer » [S19]. Le mécanisme
de la responsabilité est celui d'ADS4ALL : c'est **celui qui réutilise** qui est condamné.

---

## §6. Datasets statiques

| Jeu | Contenu | Pertinence BE |
|---|---|---|
| Kaggle `ander289386/cars-germany` | annonces AS24 **Allemagne** 2011-2021 : marque, modèle, km, carburant, boîte, état, prix, ch, année [S26] | prototypage seulement |
| Kaggle `wspirat/germany-used-cars-dataset-2023` | **200 k+** annonces DE, dernière mise à jour **06/2023** [S26] | prototypage |
| Kaggle `clkmuhammed/autoscout24-car-listings-dataset` | jeu « prédiction de prix », publié **11/2025** [S26] | prototypage |
| Kaggle `promptcloud/autoscout-automotive-data` | extraction commerciale PromptCloud [S26] | prototypage |
| HuggingFace | **aucun jeu AutoScout24 belge identifié** `[NON VÉRIFIÉ — recherche non exhaustive]` | — |
| Open data belge (Statbel, DIV/SPF Mobilité, Febiac, Traxio, Car-Pass) | **immatriculations et parc**, pas des annonces [S33] | **utile en dénominateur et en recoupement** du mode 1 |

**Verdict** : aucun dataset public ne couvre la Belgique, aucun n'est frais. Licences Kaggle à vérifier
au cas par cas, et la **provenance** (scraping d'origine) contamine juridiquement la réutilisation
commerciale. Usage acceptable : **développement, tests, démonstration**, jamais production — ce que le
projet fait déjà avec son dataset `SYNTHETIC` étiqueté.

---

## §7. Voies indirectes — les plus prometteuses

### 7.1 Le flux du concessionnaire (la même annonce, sans passer par AS24)

Une annonce AutoScout24 est presque toujours **poussée par le concessionnaire** depuis son DMS ou un outil de multidiffusion : **JouwVoertuigen.be** (« encoder une fois, publier sur son site, 2dehands, AutoScout24, Vroom, Gocar… en synchronisation temps réel »), **AutoPult** (mobile.de + AS24 via l'API officielle) [S30]. Le stock existe donc **en amont**, en XML/API, chez des acteurs qui ne sont liés par aucune clause 9.2/9.3.

**Conséquence stratégique** : un accord avec un éditeur de multidiffusion belge, un groupement de concessionnaires ou Traxio donne accès **aux mêmes véhicules**, avec le consentement du propriétaire de la donnée, sans toucher AutoScout24 — le modèle Trovit/Mitula inversé (§3.5) : la donnée est **fournie**, pas prise. Reste à instruire : couverture, exclusivités, prix. `[NON VÉRIFIÉ]`

### 7.2 Le levier réglementaire belge — **portabilité imposée à AutoScout24 Belgium**

| Date | Fait | Source |
|---|---|---|
| **13/03/2026** | L'**Autorité belge de la Concurrence** ouvre une instruction contre **AutoScout24 Belgium** pour abus de position dominante (art. 102 TFUE et art. IV.2 CDE), sur le marché de la vente de véhicules d'occasion via plateformes d'intermédiation en ligne. Grief : des pratiques **restreignant la portabilité des données** encodées par les vendeurs professionnels, décourageant le *multi-homing*. Plainte de **TCS Mobility** (plateforme `carselect.touring.be`, Touring) | [S15][S14] |
| **30/04/2026** | L'ABC **ordonne des mesures provisoires** : rétablir le **transfert automatisé des données** vers la plateforme concurrente, notifier tous les clients professionnels, publier l'avis 90 jours sur l'espace pro — sous **astreinte de 20 000 €/jour, plafond 7 000 000 €**, jusqu'à la décision au fond | [S14][S16] |

Faits reprochés : AutoScout24 aurait « soudainement bloqué le transfert automatisé des données » vers
TCS après que celui-ci eut adopté un modèle *pay-per-lead*, obligeant les vendeurs à ressaisir
manuellement leurs annonces [S14][S16].

**Ce que cela ouvre pour KYCAR** — et c'est le point neuf le plus important de ce rapport :
1. En Belgique, le **vendeur professionnel est reconnu maître de la portabilité de ses annonces**, et
   un concurrent qui la réclame a obtenu gain de cause en six semaines.
2. Une plateforme belge concurrente (**Touring Carselect**) dispose désormais d'un **transfert automatisé
   de données de stock** en provenance d'AS24 — un canal **licite, ordonné par le régulateur**. Un
   partenariat avec un tel acteur est une voie à instruire. `[NON VÉRIFIÉ : ce que TCS a le droit de
   re-céder à un tiers]`
3. KYCAR étant **analytique** (agrégats, pas revente d'annonces), un accord de portabilité consenti par
   des concessionnaires est nettement plus défendable qu'une collecte non sollicitée.

### 7.3 Vendeurs de données de marché (agrégats et valorisation, sous contrat)

| Acteur | Ce qu'il vend | Belgique | Prix |
|---|---|---|---|
| **INDICATA (groupe Autorola)** | *business intelligence* VO : collecte temps réel « de tous les véhicules d'occasion en vente sur le marché […] auprès des sites d'annonces, sites OEM, sites de concessionnaires » ; jours de stock, changements de prix, offre/demande ; publications *Market Watch* | **oui** — bureaux belges (`indicata.be`), produit lancé sur le marché belge | devis [S28] |
| **Le Parking / « Parking Data »** | prix marché par annonce + indice de confiance, volumes, tendances 30 mois, temps de vente, **+ API sur demande** | **oui** (liste de pays) | **49,90 / 190 / 290 €HT/mois** [S3] |
| **Carsdata (EAG Group)** | données d'annonces dédoublonnées 31 sources, analyse *classifieds* AS24/mobile.de | **oui** | devis, essai 14 j [S25] |
| **JD Power / Autovista (Eurotax)** | valorisation résiduelle, pas des annonces | BE listée | devis [S33] |
| **Dataforce** (via Datarade) | immatriculations et parc européens depuis les registres officiels | oui | devis [S32] |
| **MarketCheck** | 5 Mds+ d'annonces, mais **Amérique du Nord et Royaume-Uni** | **non** | à partir de 8 $ [S29] |
| **JATO, Autotelex/RDC** | specs (JATO) ; valorisations **NL uniquement** (Autotelex) | partiel / non | devis [S33] |

**Point de vigilance commun** : ces acteurs collectent eux aussi sur les portails. Exiger dans le contrat
une **garantie écrite de provenance licite** et une clause d'indemnisation, faute de quoi le risque est
seulement déplacé, pas supprimé.

### 7.4 Open data (dénominateur, jamais annonces)

Statbel, DIV/SPF Mobilité, Febiac, Traxio, Car-Pass : immatriculations, parc, âge et kilométrage moyens. Gratuits, licites, exhaustifs — mais aucun prix d'annonce. Rôle : **calibrer et contrôler** le mode 1 [S33].

---

## §8. Tableau comparatif

Colonnes : **Type** (A = annonces unitaires, G = agrégats, V = valorisation, T = taxonomie) ·
**Ouverture** · **Coût BE indicatif** · **Légalité** · **Mode KYCAR** (1 = agrégats, 2 = distributions
fines ; cf. `src/providers/DataProvider.ts`) · **Intégration** · **Risque**.

| # | Voie | Type | Ouverture | Coût BE | Légalité | Mode | Intégr. | Risque |
|---|---|---|---|---|---|---|---|---|
| 1 | **SEARCH API AS24** | A + G | partenaire, devis | `[NON VÉRIFIÉ]` | **conforme** (contrat) | 1 + 2 | 3–8 j | commercial (éligibilité d'un non-concessionnaire) |
| 2 | Listing Creation API (référentiels) | T | **public, gratuit** | 0 € | **conforme** | ni 1 ni 2 (taxonomie) | fait | nul |
| 3 | Interfaces concessionnaire / Partner Pakketten | G (perf. propre) | concessionnaire | forfait AS24 | conforme mais **hors sujet** | — | — | — |
| 4 | Publications/baromètres AS24 | G | public | 0 € | conforme | 1 (recoupement) | 1–2 j | fraîcheur, granularité |
| 5 | **Parking Data (Le Parking)** | G + V (+ A via API) | **payant, self-service** | **49,90–290 €HT/mois** (+ API sur devis) | conforme côté KYCAR ; **risque amont chez le vendeur** | 1 (2 si API le permet) | 2–5 j | dépendance ; provenance à garantir |
| 6 | **INDICATA** | G + V | payant, B2B | devis | idem #5 | 1 | 3–8 j | opacité de méthode |
| 7 | Carsdata | A + G | payant, B2B | devis (essai 14 j) | idem #5 | 1 + 2 | 3–8 j | provenance non documentée |
| 8 | **Flux concessionnaires / multidiffusion (JouwVoertuigen, DMS, groupements)** | A | partenariat à construire | `[NON VÉRIFIÉ]` (accord) | **conforme** (donnée consentie) | 1 + 2 | 5–15 j | couverture partielle du marché |
| 9 | **Portabilité ABC / partenariat plateforme belge (type TCS Mobility)** | A | partenariat | `[NON VÉRIFIÉ]` | **conforme, appuyé par le régulateur** | 1 + 2 | 5–15 j | dépend d'un tiers et d'une procédure en cours |
| 10 | Apify (3x1t, rigelbytes, …) | A | **public, self-service** | 45 €/mois (mensuel) à ~2 800 €/mois (quotidien) | **contraire aux CGU 9.2/9.3 ; exposé *sui generis*** | 1 + 2 | 0,5–1 j | **élevé** (précédent ADS4ALL) |
| 11 | Piloterr | A | public, self-service | ~13 $/instantané, ~410 $/mois quotidien (ratio `[NON VÉRIFIÉ]`) | idem #10 | 1 + 2 | 1 j | élevé |
| 12 | Carapis / auto-api | A | devis | devis | idem #10 ; auto-api **éditeur non identifiable** | 1 + 2 | 1–3 j | élevé (+ contrepartie inconnue) |
| 13 | Bright Data / Oxylabs / Zyte / Nimble | A (brut) | public | 400–4 000 €/mois | idem #10, **aggravé** (franchissement d'Akamai) | 1 + 2 | 2–5 j | très élevé |
| 14 | Scrapers GitHub auto-hébergés | A | public | infra + maintenance | idem #13 | 1 + 2 | 5–10 j + entretien | très élevé, casse fréquente |
| 15 | Collecte directe `autoscout24.*` | A | — | 0 € | **contraire** (CGU + *sui generis* + Akamai) | 1 + 2 | — | **rédhibitoire** |
| 16 | Datasets Kaggle | A (figé, DE) | public | 0 € | licence à vérifier ; provenance contaminée | dév./démo | 0,5 j | obsolescence |
| 17 | Open data BE (Statbel, DIV, Febiac, Car-Pass) | G (parc) | public | 0 € | **conforme** | 1 (recoupement) | 1–3 j | pas de prix d'annonce |
| 18 | **2dehands / marktplaats** (socle actuel du projet) | A + G | public, `robots.txt` autorisé sur la surface visée | 0 € | conforme sur la surface autorisée ; mode 2 refusé | 1 | fait | biais publicitaire documenté |

---

## §9. Recommandation

### 9.1 Scénario A — conforme, sans risque juridique (recommandé par défaut)

1. **Conserver** le socle actuel (`TweedehandsDataProvider`, mode 1) et le dataset `SYNTHETIC` étiqueté
   pour le mode 2 en démonstration.
2. **Souscrire Parking Data CONFORT (190 €HT/mois)** et **demander la documentation des API** annoncée
   sur la page produit [S3] : c'est, à ce prix, le seul accès contractuel immédiat à des agrégats de
   marché belges construits **sur un périmètre qui inclut AutoScout24**. Exiger par écrit : périmètre
   des sources, fraîcheur, droit de réutilisation dans un produit tiers, garantie de provenance.
3. **Compléter par l'open data belge** (Statbel/DIV, Febiac, Car-Pass) comme dénominateur et contrôle.
4. **Coût : ~190–290 €HT/mois. Délai : quelques jours. Risque : faible**, entièrement contractuel.

### 9.2 Scénario B — pragmatique, à valeur structurante (recommandé en parallèle)

1. **Écrire à `searchapi@autoscout24.com`** (SEARCH API) : éligibilité d'un éditeur non-concessionnaire,
   périmètre belge, tarif, droit de stockage et d'affichage d'agrégats. C'est la **seule** voie qui rend
   l'accès AS24 lui-même licite ; le coût est la seule inconnue [S17].
2. **Instruire la voie du flux concessionnaire consenti** (§7.1) : contacter un éditeur de multidiffusion
   belge (JouwVoertuigen ou équivalent) et/ou Traxio ; viser un flux XML de stock, consenti, avec
   suppression des champs vendeur à l'ingestion (R3).
3. **Suivre l'affaire ABC / AutoScout24 Belgium** (décision au fond attendue) et, si l'occasion se
   présente, explorer un partenariat avec une plateforme bénéficiaire de la portabilité [S14][S16].
4. **Coût : temps commercial + devis. Délai : semaines à mois. Risque : faible ; gain : décisif**, car
   ces voies sont les seules qui débloquent le **mode 2** de façon durable et opposable.

### 9.3 Scénario C — à éviter (et pourquoi, précisément)

Toute collecte automatisée sur `autoscout24.*`, **y compris déléguée** à Apify, Piloterr, Carapis, Bright Data ou un scraper maison. Ce n'est pas une question de probabilité de détection : c'est **contraire à une clause contractuelle nommée** (CGU BE art. 9.2/9.3, qui vise explicitement la constitution d'une base propre — l'objet même de KYCAR) [S33] ; c'est le **modèle exact** qui a valu à ADS4ALL trois condamnations et un rejet en cassation [S7][S8] ; l'argument « je n'affiche qu'un aperçu avec lien » a été rejeté par la CA de Versailles en 04/2026 [S9][S13] ; l'argument « je ne stocke rien, je relaie en temps réel » a été rejeté par la CJUE en 2013 (*Innoweb*) [S10] ; l'argument « la base n'est peut-être pas protégée » est neutralisé par *Ryanair* (les CGU suffisent) [S11] ; et le seul précédent favorable (*BGH 2014*) suppose l'**absence de mesure technique de protection**, alors qu'AS24 déploie Akamai Bot Manager [S12][S19]. Le prix modique de ces API (45 à 2 800 €/mois) mesure le coût technique, **pas** le coût du risque.

### 9.4 Ce qui est corrigé par rapport à la première réponse

| Affirmation initiale | Correction |
|---|---|
| « Pas d'API de lecture officielle » | **Faux.** La **SEARCH API** AS24 existe, commerciale, sur devis, présentée pour applications tierces [S17]. Ce qui est vrai : pas d'API de lecture **en self-service**. |
| « Voie = API tierces de scraping (Apify, Piloterr) » | **Techniquement exact, juridiquement incomplet.** Ces voies sont contraires aux CGU AS24 et exposées au *sui generis* ; le donneur d'ordre est responsable, pas le fournisseur. |
| Le Parking « prouve qu'un accès existe » | **Le Parking prouve l'inverse** : ADS4ALL a été condamné en 2021, 2023 et débouté en cassation le **15/10/2025** [S7][S8]. |
| Aucun chiffrage | Chiffres relevés : Apify **0,49–1,00 $/1 000**, Piloterr **2,26–2,72 $/1 000 requêtes**, Zyte **0,13 $/1 000**, Oxylabs **49 $/mois**, et surtout **Parking Data 49,90–290 €HT/mois** [S3][S20][S21][S22][S35]. |
| Voies non citées | **Parking Data**, **INDICATA (BE)**, **Carsdata**, **flux concessionnaires/multidiffusion**, **portabilité imposée par l'ABC (30/04/2026)**, datasets Kaggle, open data belge. |

### 9.5 Questions que seul le commanditaire peut trancher

1. **Budget mensuel** accepté pour la donnée (0 € / ~200 € / ~1 500 € / devis SEARCH API).
2. **Appétence au risque juridique** : accepte-t-on une voie « zone grise », après avis d'un avocat
   belge en droit des bases de données ? (Recommandation de l'auteur : non.)
3. **Autorisation de prise de contact commercial** (E1 l'interdit à l'agent) : SEARCH API, Le Parking,
   INDICATA, Carsdata, éditeurs de multidiffusion.
4. **Ambition de couverture** : « le marché belge » (2dehands + concessionnaires + open data suffisent)
   ou « littéralement l'inventaire AutoScout24 » (exige #1, #5 ou #8/#9 du tableau).
5. **Position produit** : outil analytique interne, ou service publié — la publication d'agrégats
   dérivés d'une base tierce change l'analyse *sui generis*.

---

## §10. Sources

Toutes consultées le **2026-09-09**, sauf mention contraire.

- **[S1]** Le Parking — Mentions légales et CGU : `https://www.leparking.fr/mentions.html` (éditeur ADS4ALL SARL, RCS Paris 534 203 153 ; clause anti-robot des CGU).
- **[S2]** Le Parking — Qui sommes-nous : `https://www.leparking.fr/qui_sommes_nous.html` (15,2 M annonces, 964 sites, ~300 k/jour, >70 pays).
- **[S3]** Le Parking — **Parking Data** : `https://www.leparking.fr/data.html` (formules 49,90 / 190 / 290 €HT/mois, liste de pays dont Belgique, « plusieurs API directement interfaçables »).
- **[S4]** Le Parking — Sourcing : `https://www.leparking.fr/sourcing.html` (à partir de 200 €).
- **[S5]** Le Parking — Espace Pro / Partenaires : `https://www.leparking.fr/partenaires.html`.
- **[S6]** Journal Auto, 25/09/2019 — interview Le Parking : `https://journalauto.com/distribution/le-parking-en-fonction-de-leur-orientation-leboncoin-et-largus-pourraient-devenir-des-concurrents/`.
- **[S7]** Legalis — TJ Paris, 3e ch. 1re sect., **08/07/2021**, Groupe La Centrale c/ ADS4ALL : `https://www.legalis.net/jurisprudences/tribunal-judiciaire-de-paris-3eme-ch-1ere-section-jugement-du-8-juillet-2021/`.
- **[S8]** Deshoulières Avocats, 23/12/2025 — **Cass. 1re civ. 15/10/2025, n° 23-23.167** (La Centrale c/ ADS4ALL) : `https://www.deshoulieres-avocats.com/facebook-vs-fuckbook-condamnation-pour-contrefacon-et-concurrence-deloyale-5-2-2-2-2-2-2-2-2-3-2-2-3-2-6-2-4-2/`.
- **[S9]** Kohen Avocats, 30/05/2026 — panorama *sui generis* et scraping 2022-2026 (Cass. 05/10/2022 n° 21-16.307 ; Cass. 15/10/2025 n° 23-23.167 ; CA Versailles 14/04/2026 n° 24/05370) : `https://kohenavocats.fr/2026/05/30/protection-sui-generis-bases-donnees-scraping-jurisprudence-2022-2026/`.
- **[S10]** CJUE, **C-202/12 *Innoweb c/ Wegener*, 19/12/2013** : `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex%3A62012CJ0202` ; commentaire SCL : `https://www.scl.org/2984-database-right-innoweb-v-wegener-cjeu-judgment/`.
- **[S11]** CJUE, **C-30/14 *Ryanair c/ PR Aviation*, 15/01/2015** : `https://ipcuria.eu/case?reference=C-30%2F14` ; commentaire Lexology : `https://www.lexology.com/library/detail.aspx?g=892f2083-6557-4314-9cad-900d710d67c3`.
- **[S12]** BGH, **30/04/2014, I ZR 224/12 « Flugvermittlung im Internet »** : `https://www.bundesgerichtshof.de/SharedDocs/Pressemitteilungen/DE/2014/2014069.html`.
- **[S13]** CA Versailles, **14/04/2026**, LBC France (leboncoin) c/ Babel France (Jinka), 200 000 € + astreinte 500 €/annonce : `https://www.mysweetimmo.com/2026/04/15/annonces-immobilieres-jinka-condamnee-a-payer-200-000-e-a-leboncoin-en-appel/` ; communiqué leboncoin : `https://presse.leboncoincorporate.com/`.
- **[S14]** Van Bael & Bellis — **ABC, 30/04/2026**, mesures provisoires contre AutoScout24 Belgium (astreinte 20 000 €/j, plafond 7 M€) : `https://vbb.com/articles/belgian-competition-authority-orders-autoscout24-to-restore-data-portability-to-competing-platform-subject-to-penalty-payments/`.
- **[S15]** CMS Belgium — ouverture d'instruction **13/03/2026** (art. 102 TFUE, art. IV.2 CDE, portabilité des données) : `https://cms.law/en/bel/legal-updates/belgian-competition-authority-s-investigation-into-autoscout24`.
- **[S16]** Journal Auto — « AutoScout24 Belgique perd sa bataille contre TCS Mobility » (carselect.touring.be) : `https://journalauto.com/services/autoscout24-belgique-perd-sa-bataille-contre-tcs-mobility/`.
- **[S17]** AutoScout24 — **SEARCH API** : `https://www.autoscout24.de/haendlerportal/schnittstelle-search-api/` et interfaces concessionnaires `https://www.autoscout24.de/partner-infoportal/schnittstellen/` — **pages non récupérées** (préfixe `/haendlerportal/` et `/partner-infoportal/` hors `Allow` du `robots.txt` `.de` pour ClaudeBot ; E5) ; contenu connu par résumé de moteur de recherche `[TIERS-MÉDIÉ]`.
- **[S18]** AutoScout24 — Listing Creation API : `https://listing-creation.api.autoscout24.com/docs` et spec OpenAPI ; relevé d'exécution du 2026-09-06 dans `docs/reference/AS24-REFERENCE-API.md` (295 marques, 4 955 modèles, 673 valeurs de référentiel).
- **[S19]** Scrapfly, **10/08/2026** — « How to Scrape AutoScout24 in 2026 » : `https://scrapfly.io/blog/posts/how-to-scrape-autoscout24` (API officielle *write-only* ; Akamai Bot Manager, `_abck`/`ak_bmsc`, JA3/JA4 ; avertissement légal).
- **[S20]** Apify — `https://apify.com/3x1t/autoscout24-scraper-ppr` (0,49 $/1 000 résultats ; `.com .it .nl .de .at .be .fr .es` ; plafond 4 000 résultats/URL ; 409 utilisateurs).
- **[S21]** Apify — `https://apify.com/rigelbytes/autoscout24-scraper` (à partir de 1,00 $/1 000 ; 19 pays ; `sellerCompanyName`, `sellerContactName`, `sellerRating` ; 4 utilisateurs).
- **[S22]** Piloterr — `https://www.piloterr.com/library/autoscout24-search` et `https://www.piloterr.com/pricing` (49/99/249 $/mois ; 2,72 / 2,48 / 2,26 $ par 1 000 requêtes ; +500 crédits d'essai sans carte).
- **[S23]** Carapis — `https://carapis.com/platforms/western-europe/autoscout24` (≈2,5 M annonces, 18 pays, Belgique nommée, API `api.carapis.com/v2/listings`, tarifs non publiés).
- **[S24]** auto-api.com — `https://auto-api.com/autoscout24` (temps réel <60 s, exports CSV/JSON/Excel ; éditeur et tarifs non identifiables).
- **[S25]** Carsdata (EAG Group) — `https://carsdata.com/` (31 sources agrégées, dédoublonnage VIN/photos, BE couverte, analyse AutoScout24/mobile.de, essai 14 j).
- **[S26]** Kaggle — `ander289386/cars-germany`, `wspirat/germany-used-cars-dataset-2023` (200 k+, MàJ 06/2023), `clkmuhammed/autoscout24-car-listings-dataset` (11/2025), `promptcloud/autoscout-automotive-data`.
- **[S27]** GitHub — `https://github.com/topics/autoscout24` ; `WebOlivia/autoscout24-scraper` (8 domaines dont `.be`), `lorenzoelia/autoscout24_scraping`, `0Baris/autoscout24-scraper`, `bocchilorenzo/autoscout24_bot`, `mauropelucchi/autoscout24`, `aolieman/auto-scrapers`.
- **[S28]** INDICATA / Autorola — `https://indicata.com/`, `https://www.indicata.be/fr/produit`, FLEET.be (lancement belge) : collecte temps réel depuis sites d'annonces, OEM et concessionnaires ; *Market Watch*.
- **[S29]** MarketCheck — `https://www.marketcheck.com/apis/cars/` et `/apis/pricing/` (Amérique du Nord + Royaume-Uni ; Belgique non couverte).
- **[S30]** Multidiffusion : `https://www.jouwvoertuigen.be/` (publication vers 2dehands, AutoScout24, Vroom, Gocar…) ; `https://autopult.de/en/multi-listing/` (API officielle AS24).
- **[S31]** AutoScout24 NL — « Partner Pakketten » (01/03/2026, *data insights* + outils IA) : `https://www.autoscout24.nl/dealer/partner-pakketten/` `[TIERS-MÉDIÉ]`.
- **[S32]** Datarade — catégorie *automotive data* et produit Dataforce IRIS Parc (immatriculations/parc européens) : `https://datarade.ai/data-categories/automotive-data`.
- **[S33]** Dépôt KYCAR, relevés datés 2026-09-06/07 : `docs/research/probe-LOT-K.md` (CGU BE art. 9.2/9.3 et B2B 3.3 *verbatim* ; `robots.txt` `.be` et `.de` ; `searchapi@autoscout24.com` ; pages presse/statistiques ; `portal.services.as24.tech` fermé), `docs/research/FINDING-allowed-surface.md`, `docs/research/DATA-ACQUISITION-REPORT.md`.
- **[S34]** Dépôt KYCAR, `docs/research/probe-LOT-N.md` (2026-09-07) : `theparking.eu`, page BE, marqueurs de source `2ememain ×46, autoscout24 ×24, gocar ×13`.
- **[S35]** Tarifs génériques des passe-murailles : Oxylabs (`https://oxylabs.io/blog/best-web-scraping-api`) — Zyte à partir de 0,13 $/1 000 requêtes, Oxylabs Web Scraper API 49 $/mois, résidentiel 8 $/Go, Bright Data PAYG 150 $.
- **[S36]** LIFULL Connect (Trovit, Mitula, Nestoria) — modèle de flux XML poussé par les portails : `https://www.lifullconnect.com/about-us/`.
- **[S37]** AIM Group, 10/09/2024 — outil d'analyse concurrentielle géolocalisé pour concessionnaires AutoScout24 : `https://aimgroup.com/2024/09/10/autoscout24-introduces-location-based-competitive-analysis-for-dealers/` `[TIERS-MÉDIÉ — page récupérée vide]` ; pages presse AS24 Belgique (`/fr/entreprise/statistiques/`, baromètre du marché de l'occasion) `[TIERS-MÉDIÉ — non récupérées, E5]`.
