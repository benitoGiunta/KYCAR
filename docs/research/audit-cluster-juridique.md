# audit-cluster-juridique.md — Audit du cluster juridique et historique

**Agent** : `audit-2`, phase 1.5 du `PLAN-1-data-acquisition.md`.
**Périmètre** : `probe-LOT-K` (clause consommateur AS24, A11=4/5), `probe-LOT-J` (série de prix Wayback + thèse contournement TDM art. 4(3)), `probe-LOT-B` + `DECISION-coordinateur-LOT-B` (verrou GraphQL mobile, ligne rouge accès non autorisé, caviardage des secrets).
**Méthode** : lecture croisée des livrables + rejeu à la source de la clause consommateur belge (`/fr/entreprise/agb/`, chemin `Allow` du robots.txt). Contraintes E5 (17 préfixes autorisés uniquement), plafond 15 requêtes.
**Date** : 2026-09-07.

Constat par affirmation : `OK` / `FAUX` / `NON PROUVÉ` / `SOUS-ESTIMÉ` / `SUR-ESTIMÉ`.

---

## Progression (append au fil de l'eau)

- Lecture des trois livrables + DECISION-coordinateur-LOT-B. OK.
- Rejeu à la source de `/fr/entreprise/agb/` (ClaudeBot) : HTTP 200, 522 369 o — identique au `[req 10]` de LOT-K. Clause extraite du RSC Next.js sans rendu JS.
- Scan de secrets sur `probe-LOT-B.md` : aucune valeur (voir section dédiée).

---

## Clause consommateur vérifiée (rejeu à la source)

**Requête auditeur** : `curl -A ClaudeBot https://www.autoscout24.be/fr/entreprise/agb/` → **HTTP 200, 522 369 octets** (chemin `Allow` du robots.txt, E5 respectée ; 1 seule requête sur 15).

**`<title>` lu** : « Conditions générales AutoScout24 Belgium S.A – Utilisateur privé » → **identique** à ce qu'affirme LOT-K `[req 10]`.

**Article 9, en-tête lu à la source** : « **9. Droits sur la base de données** » → conforme à l'affirmation de LOT-K (« article 9 (« Droits sur la base de données ») »).

**9.1 (non cité par LOT-K, relevé pour contexte)** : « AutoScout24 est propriétaire des droits sur le contenu du site web et de la base de données. […] »

**9.2 — texte lu à la source, verbatim** :
> « Dans le cadre des présentes Conditions d'utilisation, l'utilisateur a le droit d'afficher des données individuelles sur son écran et d'en imprimer un extrait pour un affichage permanent, exclusivement en utilisant les masques de recherche en ligne fournis par AutoScout24. **Les requêtes automatisées par script, le contournement du masque de recherche par un logiciel de recherche ou des mesures similaires ne sont pas autorisés.** »

**9.3 — texte lu à la source, verbatim (plus complet que la citation de LOT-K)** :
> « L'utilisateur ne peut utiliser les données obtenues par la consultation, en tout ou en partie, pour **constituer sa propre base de données** sous quelque forme que ce soit, ni pour une exploitation commerciale des données, ni pour la fourniture d'informations, ni pour toute autre exploitation commerciale. La liaison, l'intégration ou toute autre connexion de la base de données ou de certains de ses éléments avec d'autres bases de données ou métabases de données est interdite. »

**Comparaison citation LOT-K ↔ source** : la citation de LOT-K (9.2 + début de 9.3, tronqué par « [...] ») est **exacte au mot près** sur tout ce qu'elle reproduit. La source va même un peu plus loin (9.3 nomme explicitement « exploitation commerciale » et « métabases »), ce qui **renforce** la conclusion de LOT-K plutôt que de l'affaiblir. **Constat : OK — clause citée fidèlement, existence confirmée par lecture directe.**

Réserve de périmètre : les Verbraucher-AGB allemandes (§ 8.2/8.3) citées par LOT-K vivent sur `.de` ; je ne les ai pas rejouées (hors mandat + budget), mais le texte belge — celui qui régit réellement `autoscout24.be`, la cible de KYCAR — est vérifié, et c'est le texte opérant. La thèse « aucun régime AS24 n'autorise l'extraction à un tiers non-concessionnaire » repose donc sur une source belge confirmée.

---

## LOT-K — Exposition juridique consommateur

| # | Affirmation | Constat |
|---|---|---|
| K1 | Clause 9.2/9.3 belge citée verbatim et existante | **OK** — rejeu à la source, correspondance exacte |
| K2 | Titre « … Utilisateur privé » + en-tête « 9. Droits sur la base de données » | **OK** — lus à la source |
| K3 | « seul le concessionnaire est lié » est **infirmé** (le texte conso porte la même interdiction) | **OK** — 9.3 interdit explicitement « constituer sa propre base de données », qui est l'objet même de KYCAR |
| K4 | A11 = 4/5 (et non 3/5) pour l'usage H2 | **OK, bien calibré** — voir nuance ci-dessous |
| K5 | A11 ≠ 5/5 : aucun contentieux documenté, pas de pénalité chiffrée, gradient usage privé | **OK** — hedging honnête |

**Nuance (non une erreur)** : LOT-K reconnaît lui-même que l'accroche **contractuelle** est « discutable pour un simple lecteur non-inscrit qui n'accepte rien explicitement » (browsewrap sans acceptation). C'est exact : sur un scraper anonyme, l'opposabilité du contrat est fragile. Mais le 4/5 **ne repose pas que sur le contrat** : il est porté indépendamment par le droit *sui generis* des bases de données (dir. 96/9/CE, livre XI CDE), qui ne suppose aucun contrat. La note reste donc défendable même si l'on retire l'accroche contractuelle. **Pas de sur- ni sous-estimation nette.**

**Score de fiabilité LOT-K : 5/5.** Toutes les clauses juridiques vérifiées à la source, citations exactes, conclusion calibrée et honnêtement bornée. Seul écart cosmétique du dossier : LOT-K `[req 7]` compte **16** préfixes `Allow` là où l'en-tête du même lot et LOT-J disent **17** — LOT-K signale lui-même l'écart comme « mineur sans conséquence ». Sans effet sur les conclusions juridiques.

---

## LOT-J — Raisonnement TDM (lire une archive vs. provoquer une archive)

Affirmation centrale : **lire une archive existante = licite (A11 3/5, résiduel *sui generis* + RGPD) / soumettre soi-même une URL à un service d'archivage = contournement de la réservation TDM art. 4(3) dir. 2019/790 (A11 4/5)**.

Épreuve du raisonnement dans les deux sens :

**Sens « la thèse sur-restreint (interdit une voie licite) »** — l'antithèse du rapport est solide : robots.txt n'est pas une norme juridique ; une soumission unitaire ≈ une visite de navigateur d'une page publique ; aucune MTP franchie (pas de 550bis CP). La conclusion « c'est quand même un contournement » s'appuie sur art. 4(3) + causalité *but-for* + test d'intention. C'est la lecture **conservatrice**. Elle est défendable mais non certaine : un juge pourrait estimer que soumettre une URL n'est pas l'accomplissement par nous de l'acte réservé. **Ce n'est pas une erreur** : pour un audit de risque, pencher conservateur est correct, et le rapport **escalade la décision au commanditaire** (AC-J6) au lieu de la trancher seul. Méthodologiquement sain.

**Sens « la thèse sous-restreint (permet trop) »** — le point à vérifier : lire une archive existante et en faire du TDM, est-ce vraiment propre de l'art. 4(3) ? Le rapport tient la ligne par un argument correct et cohérent : (a) l'art. 4(3) retire le bénéfice de l'exception TDM mais ne rend l'acte illicite que s'il enfreint par ailleurs un droit protégé ; (b) prix/km/date pris isolément sont des **données factuelles non protégeables** (antithèse pt 4) ; (c) en lisant l'existant, nous ne causons **aucune reproduction nouvelle** du matériel AS24 — la reproduction est le fait propre de l'archiveur. Le résiduel se réduit donc au *sui generis* sur la réutilisation d'une **partie substantielle** — ce que le rapport chiffre bien (35 025 annonces à série, 131 287 au total). **Cohérence interne validée** : la même prémisse (« art. 4(3) vise l'acteur de la fouille, pas la route ») sert les deux cas sans se contredire, parce que l'acte marginal diffère (reproduction nouvelle vs. simple extraction de faits).

**Notes de calibrage (nuances, pas des fautes)** :
1. `Innoweb` (C-202/12) est un précédent *sui generis* (réutilisation) appliqué **par analogie** à une question TDM/art. 4(3). L'analogie sur le principe « l'effet prime la route » est légitime, mais ce n'est pas un arrêt directement sur l'art. 4. À présenter comme argument analogique, ce que le rapport fait (« regarde l'effet économique, pas la route »).
2. Le résiduel « lire l'archive = 3/5 » pourrait être argumenté **plus haut** : 35 000 séries + 1,66 M de captures `/lst` constituent plausiblement une « partie substantielle » de la base au sens de l'art. 7 dir. 96/9. 3/5 est dans la fourchette basse mais acceptable ; ce n'est pas une sous-estimation grave car le rapport nomme explicitement le mécanisme et ne prétend pas que la voie est sans risque.
3. Réserve `/lst` (Disallow: /lst? pour `*` depuis ≥2023) correctement traitée : captures faites par l'archiveur en méconnaissance de la directive, pas par nous ; pas de « fruit de l'arbre empoisonné » en civil. **OK.**

| # | Affirmation LOT-J | Constat |
|---|---|---|
| J1 | Soumettre une URL à un tiers = contournement art. 4(3) par tiers interposé | **OK (conservateur, bien argumenté, escaladé)** |
| J2 | Lire une archive existante = licite sur l'axe robots.txt, résiduel *sui generis* + RGPD | **OK** — cohérent avec J1 ; réduction aux données factuelles correcte |
| J3 | Save Page Now de Wayback tombe sous la même interdiction que urlscan | **OK** — conséquence logique directe de J1 ; empêche de « densifier » la série |
| J4 | Série de prix reconstructible (35 025 annonces ≥2 pts, cas réel −35,5 %) | **OK** — chiffrage étayé par index CDX rejouables ; hors périmètre juridique mais cohérent |
| J5 | A11 gradué 1/5 (index) → 3/5 (lecture) → 4/5 (soumission) → 5/5 (crawl direct) | **OK** — échelle cohérente ; le 3/5 est plancher défendable (cf. nuance 2) |

**Score de fiabilité LOT-J : 4,5/5.** Raisonnement juridique solide, testé contradictoirement, honnêtement hedgé et escaladé. Retrait de 0,5 pour deux calibrages perfectibles (Innoweb analogique ; 3/5 potentiellement léger sur le *sui generis* substantiel) — aucun n'inverse une conclusion.

---

## LOT-B — Ligne rouge accès non autorisé + caviardage

**Classement de l'accès GraphQL mobile (`listing-search.api.autoscout24.com/v3/graphql`)** :

| # | Affirmation | Constat |
|---|---|---|
| B1 | L'endpoint est privé/authentifié (401 sans clé) | **OK** — journal #5, #52 : 401 « Authentication required », `/v3/graphql` GET non routé |
| B2 | Y accéder (extraire/rejouer la clé, contourner la gateway) = accès non autorisé à un système d'autrui | **OK — classement correct** |
| B3 | A11 = 5/5 pour C-15 | **OK** |
| B4 | La doc de schéma a une valeur cartographique mais **n'est pas** une voie d'accès | **OK** — distinction juste, durcie à raison par le coordinateur |

**Pourquoi le classement est correct, et cohérent avec LOT-J** : ici l'art. 550bis CP belge (accès non autorisé) **s'applique** parce qu'il y a un **obstacle d'accès à franchir** (authentification par clé de gateway Mashery + OAuth). C'est exactement le critère que LOT-J utilisait pour écarter le 550bis dans le cas robots.txt (« suppose le franchissement d'un obstacle d'accès, absent ici »). Le cluster est donc **cohérent avec lui-même** : robots.txt (déclaratoire, pas d'obstacle) → pas de 550bis ; gateway authentifiée (obstacle réel) → 550bis. La ligne rouge du coordinateur (« pas de crawl, pas d'extraction, pas d'usage de la clé — même si on trouvait comment ») est le bon durcissement : elle empêche la lecture « obtenir le credential puis y aller ».

**Secret en clair ? Vérification indépendante** :
- `grep` de chaînes ≥32 alphanum (hors termes de domaine) sur `probe-LOT-B.md` → **0 résultat**.
- `grep` de motifs `Bearer ey…` / `api_key=<valeur>` / `secret:<valeur>` / `token:<valeur>` → **0 résultat**.
- `mashery_api_key` apparaît **6 fois, toujours comme nom de variable/paramètre**, jamais suivi d'une valeur.
- Les URL OAuth citées (`as24dealers.okta.com/oauth2/default`, `auth-dealers.autoscout24.com/oauth2/default/v1/authorize`, `identity-v2.api.autoscout24.com/apps-login/start`) sont des **endpoints d'autorisation publics**, pas des secrets.

**Constat : OK — aucune valeur de secret n'est présente.** Le rapport ne contient que des noms de variables et des noms d'hôtes/chemins. La revue de sécurité du coordinateur (« aucune valeur de clé, vérifié par recherche de motifs ») est **confirmée par rejeu indépendant**.

**Score de fiabilité LOT-B : 5/5.** Classement de la ligne rouge correct et cohérent avec le reste du cluster ; caviardage propre confirmé ; durcissement du coordinateur justifié.

---

## Score de fiabilité — synthèse

| Lot | Score | Base |
|---|---|---|
| LOT-K | **5/5** | Clause consommateur vérifiée à la source, citation exacte, A11=4/5 calibré |
| LOT-J | **4,5/5** | Raisonnement TDM solide, contradictoire, escaladé ; deux calibrages perfectibles sans inversion |
| LOT-B | **5/5** | Ligne rouge correcte et cohérente (550bis = obstacle présent), zéro secret en clair |

---

## Verdict — les limites juridiques posées sont-elles correctes ?

**OUI. Aucune limite juridique du cluster n'est à corriger.** Les trois bornes tiennent :

1. **Aucun régime contractuel AS24 n'autorise l'extraction automatisée à un tiers non-concessionnaire** (LOT-K) — confirmé par lecture directe de la clause belge 9.2/9.3, y compris la mention explicite de « constituer sa propre base de données », qui est l'objet de KYCAR. La correction majeure (« seul le concessionnaire est lié » = FAUX) est fondée.
2. **Lire une archive préexistante est licite (résiduel *sui generis* + RGPD) ; provoquer la création d'une archive est un contournement de la réservation TDM art. 4(3)** (LOT-J) — raisonnement conservateur mais cohérent et honnêtement escaladé. La frontière opérante (« ne pas *provoquer* de requête vers autoscout24.be, Save Page Now inclus ») est correcte et prudente.
3. **L'API GraphQL mobile est un accès non autorisé (obstacle d'authentification réel → 550bis CP) et ne doit pas être franchie** (LOT-B) — classement correct, cohérent avec le critère d'obstacle de LOT-J, et bien durci par le coordinateur.

**Nuances à porter au dossier (n'inversent aucune conclusion)** : (a) l'accroche contractuelle de LOT-K est faible sur un lecteur anonyme, mais le *sui generis* porte le 4/5 ; (b) le 3/5 « lecture d'archive » de LOT-J pourrait être argumenté plus haut sur la partie substantielle ; (c) `Innoweb` est un précédent *sui generis* utilisé par analogie sur une question TDM ; (d) écart cosmétique 16 vs 17 préfixes `Allow` entre LOT-K et LOT-J, sans effet.

**Aucun secret non caviardé.** Aucune erreur « dangereuse » (recommander une voie illicite) ni erreur « stérilisante » nette (interdire une voie licite) — la seule zone conservatrice (soumission = contournement) est explicitement présentée comme une décision à trancher par le commanditaire, ce qui est le bon traitement.

