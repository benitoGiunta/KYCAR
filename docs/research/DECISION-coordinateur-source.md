# Décision de coordinateur — la source du produit se déplace d'AutoScout24 vers 2dehands

**Date : 2026-09-07. Fondée sur `probe-LOT-N.md`, `probe-LOT-K.md`, et une vérification directe du
coordinateur.**

## Le constat qui force la décision

Le chantier 1 a été mandaté pour trouver comment charger l'inventaire **AutoScout24**. La réponse,
après 17 lots, est nette et il faut la dire sans détour : **il n'existe aucune voie gratuite,
autonome et licite vers l'inventaire AutoScout24 frais et complet.** Chaque voie bute sur au moins
un des trois murs :

- **Technique** : l'inventaire fin est derrière Akamai (`/lst`) ou derrière une authentification
  (API GraphQL de recherche, API de distribution suisse). La surface autorisée par `robots.txt` ne
  donne que des agrégats plus un échantillon de 20 annonces par modèle, et cet échantillon est
  **biaisé par le produit publicitaire à `p < 10⁻²⁰`** (`probe-LOT-A.md`) — inutilisable pour le
  mode 2.
- **Juridique** : le contrat **consommateur** d'AutoScout24 — celui qui régit l'usage cible de KYCAR,
  pas seulement le contrat concessionnaire — interdit verbatim, y compris dans sa version **belge**
  (`/fr/entreprise/agb/`, art. 9.2/9.3), « les requêtes automatisées par script » et l'usage des
  données « pour constituer sa propre base de données ». C'est exactement l'objet de KYCAR
  (`probe-LOT-K.md`). L'axe A11 est à 4/5.
- **Économique/contractuel** : les voies licites restantes (fournisseurs tiers, SEARCH API
  officielle, dataset FDZ) sont payantes, sous contrat, ou hors périmètre — aucune n'est « gratuite
  et autonome ».

## Ce que `LOT-N` change

**2dehands.be** est un portail belge d'occasion (groupe Adevinta) qui, sur un chemin autorisé par
son `robots.txt`, expose un `__NEXT_DATA__` avec **100 188 voitures belges** (vérifié par le
coordinateur le 2026-09-07 : `GET /l/auto-s/`, HTTP 200, `totalResultCount = 100188`, 30 annonces
par page, aucune signature Akamai / DataDome / Cloudflare), et **≥ 25 des 40 champs cibles** par
annonce, y compris le type de vendeur (H3), la région, la norme Euro belge et l'URL Car-Pass.

C'est une voie **gratuite, autonome, licite et sans anti-bot** vers un marché belge de l'occasion
réel et de volume comparable à AutoScout24 (~100 k contre ~121 k annonces BE). `marktplaats.nl`
(même pile Adevinta) étend le modèle aux Pays-Bas avec le même adaptateur.

**Vérification de conformité faite par le coordinateur** : le `robots.txt` de 2dehands ne porte
aucune règle interdisant `/l/auto-s/` ; les seuls `Disallow` pertinents visent les listings de
profils (`/u/*/*/l/*`) et l'API interne (`/lrp/api/*`, dont `/lrp/api/search`), que l'agent a
explicitement laissés de côté. La discipline appliquée à AutoScout24 vaut pour 2dehands : on lit ce
qui est autorisé, pas l'API interne.

## La décision

**La source de production de KYCAR passe d'AutoScout24 à 2dehands.be (Belgique) et marktplaats.nl
(Pays-Bas), via leur surface `__NEXT_DATA__` autorisée.** AutoScout24 reste présent au dossier à
trois titres seulement, tous non contraignants :

1. **Source du référentiel de classification** — la taxonomie marque/modèle et les énumérations,
   relevées via l'API officielle ouverte (`listing-creation.api`), restent valables comme
   nomenclature de normalisation, indépendamment de la source d'annonces.
2. **Série de prix historique** — via Wayback (`probe-LOT-J.md`), pour la profondeur temporelle
   qu'aucune source vivante n'offre, dans les limites juridiques établies (lecture d'archives
   existantes uniquement).
3. **Voie contractuelle optionnelle** — la SEARCH API officielle, si le commanditaire choisit un
   jour de payer pour la donnée AutoScout24 elle-même (`ACTIONS-COMMANDITAIRE`).

## Ce que cette décision coûte, dit honnêtement

Ce n'est pas un remplacement sans friction, et je ne le présente pas comme tel :

- **Le référentiel de filtres et la taxonomie sont spécifiques à AutoScout24.** Les 77 filtres, leurs
  codes d'URL, les 4 955 modèles ont été relevés sur AutoScout24. 2dehands a son propre modèle
  d'attributs (`constructionYear`, `mileage`, `fuel`, `body`, `model`…) qui recoupe ~25 des 40 champs
  mais avec ses propres codes. **Un travail de re-cartographie est nécessaire** : mapper le
  vocabulaire 2dehands vers le dictionnaire de données de KYCAR. C'est précisément le rôle de
  l'adaptateur `DataProvider`, mais il n'est pas gratuit.
- **Le produit reflète alors le marché 2dehands, pas le marché AutoScout24.** Ce sont deux places
  distinctes, avec des recouvrements mais aussi des différences de composition (2dehands penche plus
  particulier, AutoScout24 plus professionnel). Le commanditaire voulait « les offres actuelles
  autoscout ». Il faut lui dire clairement que la voie livrable reflète le marché belge de
  l'occasion **tel que 2dehands le montre**, ce qui est un marché réel et large, mais pas
  littéralement l'inventaire AutoScout24.

## Pourquoi l'architecture tient malgré ce déplacement

La décision de cadrage du 2026-09-06 — **découpler les deux chantiers par l'interface
`DataProvider`** — était la bonne, et elle prend tout son sens ici. Le chantier 2 (l'application, ses
485 exigences, ses écrans, ses agrégats, sa détection d'outliers) ne dépend d'aucune source
particulière : il consomme `DataProvider`. Changer la source de production d'AutoScout24 à 2dehands
est **un changement d'adaptateur, pas un changement d'application**. Tout le métier construit tient.

Le rapport de la phase 1.6 (`compile-1`) devra porter cette conclusion comme recommandation
primaire, avec AutoScout24-payant en fallback et le dataset synthétique en repli de développement.
