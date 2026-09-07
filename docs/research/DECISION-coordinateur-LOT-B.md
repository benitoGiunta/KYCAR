# Décision du coordinateur — LOT-B, et revue de l'alerte de sécurité

## Revue de l'alerte de sécurité

L'agent `probe-B` a déclenché une alerte de sécurité automatique. Je l'ai examinée avant
d'exploiter sa sortie, comme l'exige la procédure. Constats :

- **Aucun secret n'a fuité.** Le rapport nomme la *variable* `mashery_api_key` et le mécanisme
  d'authentification (gateway Mashery + OAuth Okta), mais **jamais aucune valeur de clé**. Vérifié
  par recherche de motifs de secret sur le livrable.
- **Aucun binaire n'est entré dans le dépôt.** L'APK (168 Mo) et les fichiers `.dex` extraits sont
  restés dans le scratchpad, et je les ai supprimés après revue.
- **L'agent n'a exploité aucun accès.** Il a fait de l'analyse statique d'un binaire public
  (téléchargé depuis un miroir), sans installation, sans exécution, sans MITM, sans utiliser la
  moindre clé. C'est une pratique de rétro-ingénierie licite en soi.

L'alerte était déclenchée par le téléchargement de l'APK et la détection d'un nom de clé. Le
comportement de l'agent était conforme : il a documenté le verrou et **refusé de le franchir**.

## Décision sur le candidat C-15 (API GraphQL mobile)

**Statut : NON VIABLE. Et le motif n'est pas seulement technique.**

L'agent l'a classé « NON VIABLE sans autorisation », en renvoyant l'obtention d'un credential à la
section `ACTIONS-COMMANDITAIRE`. Je précise et je durcis ce classement, parce que la formulation
« il suffit d'un credential » pourrait se lire, plus tard, comme « obtenir le credential puis y
aller ». Ce serait une erreur.

`listing-search.api.autoscout24.com/v3/graphql` est une **API privée protégée par authentification**.
Y accéder sans y être autorisé — que ce soit en extrayant une clé applicative de l'APK, en la
rejouant, ou en contournant la gateway — serait un **accès non autorisé à un système d'autrui**.
Cela ne devient pas licite parce qu'on aurait trouvé comment le faire. Et le § 3.3 des Händler-AGB
interdit déjà contractuellement l'interrogation automatisée de la base.

**Ce que KYCAR ne fera pas** : extraire, dériver ou rejouer la clé de gateway de l'application
mobile. La documentation du schéma produite par l'agent a une valeur — elle éclaire la forme du
modèle de données d'AutoScout24 — mais elle ne constitue **pas** une voie d'accès, et ne doit pas
être traitée comme telle.

**La seule voie légitime vers cet endpoint** est un accord explicite avec AutoScout24 ou SMG, avec
des credentials fournis par eux pour un usage qu'ils autorisent. C'est ce qui figure — et ce qui
doit rester — en `ACTIONS-COMMANDITAIRE` : non pas « récupérer une clé », mais « obtenir un accès
contractuel ».

## Ce que LOT-B établit d'utile, sans franchir aucune ligne

- **L'hypothèse la plus rentable du registre est FAUSSE.** Il n'existe pas d'hôte de recherche
  AutoScout24 joignable sans authentification. Les hôtes existent (`listing-search.api…`) mais
  renvoient tous 401. La question est close, par mesure : 496 hôtes énumérés via Certificate
  Transparency, 77 en `*.api.*`, tous verrouillés côté données.
- **Un contrat de distribution d'annonces existe** — `openapi-listing-distribution.yaml`, 3
  opérations de lecture, delta `modifiedSince`, ~76 champs — mais **marché suisse uniquement et sous
  authentification**. Hors périmètre H1, à qualifier seulement si une éligibilité tiers et un
  équivalent belge existent (action commanditaire).
- **Deux specs OpenAPI sont lisibles sans clé** mais ne servent que des statistiques agrégées et du
  référentiel, pas de l'inventaire.

Conclusion : cette famille ne fournit aucune voie gratuite et autonome d'accès à l'inventaire. Toutes
les voies techniques y butent sur une authentification, et la contourner n'est pas une option.
