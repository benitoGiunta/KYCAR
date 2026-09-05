# KYCAR — Contexte et intention

## À quoi sert l'application

KYCAR est un **agrégateur analytique du marché de l'occasion AutoScout24**. Là où AutoScout24
présente une liste d'annonces individuelles, KYCAR présente la **structure statistique de l'offre**.

L'utilisateur ne cherche pas *une* voiture : il cherche à comprendre *un marché*, puis à y
repérer les anomalies (outliers) qui constituent des opportunités.

### Les deux modes d'usage cibles

**Mode 1 — Exploration descendante (aucune marque/modèle saisi).**
L'utilisateur pose des contraintes de marché (« budget 20 000 €, carrosserie coupé, Belgique,
moins de 100 000 km ») et veut voir *ce que le marché propose* à ces conditions :
- quelles marques et quels modèles existent dans ce segment,
- combien d'offres pour chaque couple marque/modèle,
- les fourchettes de prix / année / kilométrage de chacun.
Sortie : une liste de cartes-marques, chaque carte contenant une zone par modèle.

**Mode 2 — Analyse d'un modèle (marque/modèle ciblé).**
L'utilisateur cible un couple précis (« Opel Corsa 2017 ») et veut la **distribution** de
l'offre pour détecter les décalages :
- distribution du nombre d'offres par prix, par kilométrage, par année,
- vue tri-dimensionnelle prix × année × kilométrage permettant d'isoler visuellement
  les annonces qui sortent de la nuée,
- filtres applicables à la volée qui recalculent toute la page.

### Ce que l'app n'est pas
- Ce n'est pas un site d'annonces : elle ne vend rien, ne met pas en relation acheteur/vendeur.
- Ce n'est pas un CRM concessionnaire.
- Elle ne stocke ni ne republie les **coordonnées des vendeurs particuliers** (voir RGPD ci-dessous).

## Périmètre de données retenu (hypothèse de travail)

Aucune information supplémentaire ne sera fournie par le commanditaire. Les hypothèses suivantes
sont posées et devront être invalidées explicitement si elles sont fausses :

| Hypothèse | Valeur retenue | Raison |
|---|---|---|
| H1 — Géographie | Belgique en priorité, modèle de données multi-pays (BE/FR/DE/LU/NL) | AutoScout24 est pan-européen ; le schéma ne doit pas se fermer à BE |
| H2 — Audience | Usage personnel / interne d'abord | Réduit fortement le risque juridique ; conditionne le positionnement |
| H3 — Données vendeur | Type de vendeur (pro/particulier), pays, code postal/région **uniquement** | Explicitement demandé : « je m'en fous des données privées des vendeurs » |
| H4 — Fraîcheur | Snapshot périodique acceptable (pas de temps réel) | L'analyse de distribution ne requiert pas la seconde |
| H5 — Volumétrie cible | 10⁴ à 10⁶ annonces par snapshot national | Dimensionne le moteur d'agrégation |

## Cadre juridique et RGPD — positionnement

Ce point est traité comme un **risque assumé et documenté**, pas comme un obstacle résolu.

- **CGU AutoScout24** : le texte exact n'a pas pu être récupéré. Hypothèse par défaut, alignée
  sur l'ensemble des marketplaces comparables : *l'extraction automatisée est contractuellement
  interdite*. À confirmer.
- **Droit sui generis des bases de données (Directive 96/9/CE)** : l'extraction d'une partie
  substantielle d'une base protégée est un acte réservé au producteur de la base. Une extraction
  massive et systématique de l'inventaire AutoScout24 tombe dans le champ du droit.
- **Gradient de risque** :
  - usage analytique privé, non republié, non commercial → risque faible en pratique ;
  - republication publique des annonces ou revente d'accès → risque réel et matériel.
- **RGPD** : les annonces de particuliers contiennent des données personnelles. Mitigation
  structurelle retenue : les champs identifiants vendeur (nom, téléphone, email, adresse exacte,
  URL de contact) **ne sont pas persistés** — le schéma de données ne prévoit aucune colonne pour
  les accueillir. Le code postal est tronqué au niveau régional.
- **Conséquence d'architecture** : KYCAR conserve un lien (deeplink) vers l'annonce d'origine
  plutôt que de dupliquer son contenu intégral. La valeur ajoutée est l'agrégat, pas la copie.

## Chantiers

| # | Chantier | Plan | État |
|---|---|---|---|
| 1 | Acquisition des données AutoScout24 — recherche exhaustive et preuve de faisabilité | `plans/PLAN-1-data-acquisition.md` | à lancer |
| 2 | Conception et construction de l'application d'agrégation | `plans/PLAN-2-app-build.md` | à lancer |

Les deux chantiers sont **découplés par contrat** : le chantier 2 consomme l'interface
`DataProvider` et ne dépend d'aucune conclusion du chantier 1 pour avancer.
