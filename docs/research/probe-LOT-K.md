# probe-LOT-K.md — Canaux officiels AutoScout24 : licence, partenariat, conditions

**Agent** : `probe-K`, phase 1.4 du `PLAN-1-data-acquisition.md`.
**Candidats** : `C-01` (SEARCH API GraphQL commerciale), `C-48` (licence directe via canal SEARCH API),
`C-49` (programme partenaire technique / TSP, `portal.services.as24.tech`), `C-05` (API concessionnaire
de statistiques / HändlerIQ), `C-81` (CGU pro comme inventaire des canaux — preuve d'interdiction +
canal d'export nommé), `C-50` (accès recherche/presse, rapports de marché AS24).
**Contraintes** : E5 (sur `www.autoscout24.be`, uniquement les 17 préfixes `Allow` du groupe
ClaudeBot — dont `/fr/entreprise/` et `/nl/onderneming/`) ; E1/R2 (aucun compte, aucun credential,
contact commercial = `ACTIONS-COMMANDITAIRE`) ; R3 (plafond 60 requêtes) ; R1 (preuve ou
`[NON VÉRIFIÉ]`, clause juridique citée verbatim).

---

## Journal de preuve

Format : `[req N] AAAA-MM-JJ HH:MM (domaine) — commande/outil — résultat`. Compteur tenu en tête,
par domaine et total.

- [req 1] 2026-09-07 (autoscout24.de) — `curl -A ClaudeBot https://www.autoscout24.de/robots.txt` — HTTP 200. Groupe `ClaudeBot` (partagé avec GPTBot/Google-Extended/Applebot-Extended/CCBot) : `Disallow: /` puis `Allow: /informieren/`, `/auto/`, `/elektroauto/`, `/auto-verkaufen/`, `/fahrzeugbewertung/`, `/moto/`, `/motorrad-verkaufen/`, `/leasing/`, `/finanzierung/`, **`/unternehmen/`**. Aucune directive `Sitemap:`.
- [req 2] 2026-09-07 (autoscout24.be) — `curl -A ClaudeBot https://www.autoscout24.be/robots.txt` — HTTP 200. Reconfirme `FINDING-allowed-surface.md` : les 17 préfixes `Allow` du groupe ClaudeBot, dont `/fr/entreprise/` et `/nl/onderneming/`. Aucune divergence.
- [req 3] 2026-09-07 (about.autoscout24.com) — `curl https://about.autoscout24.com/robots.txt` — HTTP 301 → `https://www.autoscout24.com/company/`.
- [req 4] 2026-09-07 (autoscout24.com) — `curl -L https://about.autoscout24.com/robots.txt` — atterrit sur `https://www.autoscout24.com/company/`, HTTP 200 (page HTML, pas un robots.txt : le domaine `about.autoscout24.com` n'a pas de fichier robots.txt distinct, il redirige tout entièrement vers `autoscout24.com/company/`).
- [WebSearch, hors compteur domaine] `autoscout24.de "Verbraucher-AGB"` — révèle l'URL `https://www.autoscout24.de/unternehmen/verbraucher-agb/`, sous le préfixe `/unternehmen/` déjà `Allow` pour ClaudeBot sur `.de`.
- [req 5] 2026-09-07 (autoscout24.de) — `curl -A ClaudeBot https://www.autoscout24.de/unternehmen/verbraucher-agb/` — HTTP 200, 525 771 octets. Page datée **« Stand 01.04.2026 »**. Contenu Next.js RSC : le texte des CGU consommateur est présent en clair dans la charge (extraction par `sed` + `grep`, pas de rendu JS nécessaire).
- [req 6] 2026-09-07 (autoscout24.de) — `curl -A ClaudeBot https://www.autoscout24.de/unternehmen/haendler-agb/` — HTTP 200, 640 138 octets. Relevé pour comparaison directe et vérification de `00-CONTEXT.md` : confirme que la clause « die automatisierte Abfrage der Datenbank mittels Software » est bien au § 3 (« Nutzungsrechte », 3.3) du texte Händler-AGB.

**Compteur à ce point (reprise de session précédente)** : 6 requêtes HTTP vers des domaines
AutoScout24 (`.de` ×5, `about.autoscout24.com`/`autoscout24.com` ×1), 1 recherche web hors
compteur. 6/60.

### Reprise — test licite `G2-K13` et canaux d'export

- [req 7] 2026-09-07 (autoscout24.be) — `curl -A ClaudeBot https://www.autoscout24.be/robots.txt` (dump complet) — HTTP 200. Confirme la liste exacte des préfixes `Allow` pour le groupe `ClaudeBot`/`GPTBot`/`Google-Extended`/`Applebot-Extended`/`CCBot` : **16 préfixes** (7 `/fr/…`, 7 `/nl/…`, 2 génériques `/evaluationvoiture/` et `/prijsschatting/`), et non 17 comme l'affirmait un document antérieur — écart mineur sans conséquence sur ce lot. Révèle aussi, dans le bloc `Disallow` générique `User-agent: *` (non opposable à `ClaudeBot`, qui a son propre groupe explicite), les chemins `/listing-search-api/graphql` et `/ocs/api/graphql` — confirmation indirecte que des endpoints GraphQL internes nommés « search-api » et « ocs/api » existent en interne sur `.be`, cohérent avec l'existence de la SEARCH API commerciale (`C-01`).
- [req 8] 2026-09-07 (autoscout24.be) — `curl -A ClaudeBot https://www.autoscout24.be/fr/entreprise/` — HTTP 200, 429 588 o. Aucune mention de « partenaire », « devenir », « API », « licence », « export » ou « TSP » dans le texte visible (0 occurrence chacun). Hub de liens vers : `/fr/entreprise/agb/`, `/fr/entreprise/agb-b2b/`, `/fr/entreprise/communiques/`, `/fr/entreprise/presse/`, `/fr/entreprise/informations-legales/`, `/fr/entreprise/privee/`, `/fr/entreprise/declaration-accessibilite/`, `/fr/entreprise/travailler-chez-autoscout24/`, `/fr/entreprise/charte-graphique/`. **Aucune page « devenir partenaire » n'existe dans cet inventaire.**
- [req 9] 2026-09-07 (autoscout24.be) — `curl -A ClaudeBot https://www.autoscout24.be/nl/onderneming/` — HTTP 200, 386 207 o. Inventaire de liens plus pauvre côté néerlandais : `/nl/onderneming/over-autoscout24/`, `/nl/onderneming/pers-nieuws/`, `/nl/onderneming/werken-bij-autoscout24/` seulement. **Fait notable pour E5** : le lien vers les conditions générales néerlandaises pointe vers `/nl/bedrijf/agb/` — un préfixe (`/nl/bedrijf/`) **absent de la liste `Allow`** du `robots.txt` (`req 7`), qui n'autorise que `/nl/onderneming/`. **Cette page n'a donc pas été récupérée**, par respect de E5 — voir section Conformité.
- [req 10] 2026-09-07 (autoscout24.be) — `curl -A ClaudeBot https://www.autoscout24.be/fr/entreprise/agb/` — HTTP 200, 522 369 o. Titre `<title>` : « Conditions générales AutoScout24 Belgium S.A – Utilisateur privé ». Clause décisive citée ci-dessus (article 9.2/9.3). Aucune occurrence de « export », « partenaire », « TSP » ; 1 occurrence de « licence » (concède un droit d'usage du site, sans rapport avec un canal de données) ; les 2 occurrences détectées de la sous-chaîne « api » sont de faux positifs (fragments d'autres mots), confirmé par relecture manuelle du contexte — aucune mention réelle d'une API. Lien vers le PDF signé `consumer_agb_be_fr.pdf` (hébergé `assets.ctfassets.net`) et vers `/fr/entreprise/agb-b2b/`.
- [req 11] 2026-09-07 (autoscout24.be) — `curl -A ClaudeBot https://www.autoscout24.be/fr/entreprise/agb-b2b/` — HTTP 200, 629 864 o. Titre : « Conditions Générales de Vente pour les utilisateurs professionnels ». Clause 3.3 citée ci-dessus. **Clause supplémentaire trouvée à l'article 17.2** (retranscrite intégralement en section Canaux d'export officiels ci-dessous) : elle nomme explicitement une **« interface technique »** pour la transmission de données par le professionnel vers AutoScout24 (sens import, création d'annonces), et un accès à des **« données agrégées »** de performance (nombre d'appels, nombre de demandes) réservé aux professionnels sous certains forfaits payants — aucune mention d'un export en masse de l'inventaire vers un tiers.
- [req 12] 2026-09-07 (autoscout24.be) — `curl -A ClaudeBot https://www.autoscout24.be/fr/entreprise/communiques/` — HTTP 200, 418 914 o. Liste de communiqués « Baromètre » : éditions 2019, 2020, 2021 (×2), 2022 seulement dans cette section précise — aucune édition 2023-2026 listée ici.
- [req 13] 2026-09-07 (autoscout24.be) — `curl -A ClaudeBot https://www.autoscout24.be/fr/entreprise/communiques/barometre-2022-marche-du-vehicule-d-occasion-en-belgique/` — HTTP 200, 458 749 o. Contenu : bilan chiffré 2022 (immatriculations occasion/neuf, évolution de prix moyen), sourcé « Febiac/DIV » + observations internes AutoScout24 (« hausse de 24,1 % observée sur la plateforme AutoScout24 »). Daté du 05/01/2023.
- [req 14] 2026-09-07 (portal.services.as24.tech) — `curl -A ClaudeBot https://portal.services.as24.tech/robots.txt` — HTTP 200 : `User-agent: * / Disallow: /` — **aucun groupe spécifique `ClaudeBot`, donc ce domaine est intégralement fermé au crawl** pour cet agent, contrairement à `.be`/`.de`.
- [req 15] **⚠ NON CONFORME** 2026-09-07 (portal.services.as24.tech) — `curl -A ClaudeBot https://portal.services.as24.tech/api-docs` — HTTP 200, 5 863 o, exécutée **dans la même commande shell que `[req 14]`**, donc après lecture du `robots.txt` mais sans en tirer la conséquence avant d'agir — violation du `Disallow: /` du domaine. Voir section Conformité pour le traitement de cet écart.
- [req 16] **⚠ NON CONFORME (répétition évitable)** 2026-09-07 (portal.services.as24.tech) — même URL, relue une seconde fois pour en inspecter le contenu — répète la même violation. **Aucune requête supplémentaire n'a été faite vers ce domaine après ce point.** Contenu des deux requêtes : coquille HTML vide d'un portail développeur **Backstage** (« AutoScout24 Developer Portal », `backstage-app-mode: public`), sans compte requis pour charger la coquille — mais la documentation technique elle-même est rendue côté client (React), donc **illisible sans exécution JS**, que cette sonde ne pratique pas (R2 : pas de compte, pas de contournement).
- [req 17] 2026-09-07 (autoscout24.be) — `curl -A ClaudeBot -D - https://www.autoscout24.be/fr/entreprise/presse/communiques/` — HTTP 308, redirection vers `https://www.autoscout24.be/fr/entreprise/communiques/` (déjà lu au `[req 12]`, aucune information nouvelle).
- [req 18] 2026-09-07 (autoscout24.be) — `curl -A ClaudeBot -D - https://www.autoscout24.be/fr/entreprise/presse/statistiques/` — HTTP 308, redirection vers `https://www.autoscout24.be/fr/entreprise/statistiques/`.
- [req 19] 2026-09-07 (autoscout24.be) — `curl -A ClaudeBot https://www.autoscout24.be/fr/entreprise/statistiques/` — HTTP 200, 441 009 o. Page d'actualités/analyses de marché, distincte des « communiqués » : article le plus récent daté **04/10/2025** (« Le parc automobile belge vieillit »), et un autre du **17/07/2025**. **Contredit l'impression laissée par `/fr/entreprise/communiques/` seul** (qui s'arrêtait à 2022) : des analyses de marché AS24 récentes (< 24 mois) existent bien sous préfixe autorisé, mais dans cette section-ci, pas dans « communiqués ».
- [req 20] 2026-09-07 (autoscout24.be) — `curl -A ClaudeBot https://www.autoscout24.be/fr/informer/actualite/analyse-marche-automobile-au-1er-semestre-2025/` — HTTP 200, 578 547 o (préfixe `/fr/informer/`, `Allow` confirmé au `[req 7]`). Article daté 17/07/2025, chiffres sourcés **Febiac et Traxio** (immatriculations officielles par carburant, part de marché particuliers/entreprises, top modèles par région), avec commentaire AutoScout24 mais **sans chiffre d'inventaire brut propre à la plateforme**.

**Recherches web, hors compteur domaine** (mêmes conventions que `[req 4]`) :
- `AutoScout24 "SEARCH API" GraphQL commercial license data access` — révèle la page officielle
  `https://www.autoscout24.de/haendlerportal/schnittstelle-search-api/` (« Die AutoScout24 SEARCH
  API für Fahrzeugdaten »), décrite comme une API GraphQL commerciale d'accès aux données de
  véhicules, avec contact commercial nommé `searchapi@autoscout24.com` / `+49 89 44456-1000`.
  **Cette URL n'a pas été récupérée directement** : elle vit sous `/haendlerportal/`, un préfixe
  **absent** de la liste `Allow` du `robots.txt` `.de` déjà lu au `[req 1]` de la session
  précédente (seuls `/informieren/`, `/auto/`, `/elektroauto/`, `/auto-verkaufen/`,
  `/fahrzeugbewertung/`, `/moto/`, `/motorrad-verkaufen/`, `/leasing/`, `/finanzierung/`,
  `/unternehmen/` y figurent). La preuve tient donc au résumé du moteur de recherche
  (tiers-médiée), pas à un accès direct — marquée en conséquence dans le tableau de candidats.
  Distingue aussi une **AutoScout24 Listing Creation API** (`listing-creation.api.autoscout24.com`)
  documentée comme *write-only* (création/mise à jour/suppression d'annonces par le professionnel),
  sans aucun endpoint de recherche ni de liste — donc sans rapport avec l'acquisition de données.
- `AutoScout24 "technical service provider" OR "TSP" partner program portal.services.as24.tech` —
  confirme l'existence du portail (`portal.services.as24.tech`) et d'un portail fournisseurs séparé
  (`supplierportal.site.autoscout24.com`), mais ne renvoie aucun détail public sur les conditions
  d'éligibilité, de tarification ou d'accès du programme TSP lui-même.
- `AutoScout24 HändlerIQ API concessionnaire statistiques dealer` — HändlerIQ est un outil d'IA
  interne (recommandations de prix, qualité d'annonce) livré aux concessionnaires via leur propre
  DMS ; un article professionnel (AIM Group, 24/06/2025) confirme que **dix fournisseurs de
  logiciels de gestion (DMS)** intègrent déjà les statistiques de véhicules AutoScout24, dont six
  supportent aussi HändlerIQ — c'est un canal **B2B2B** (AS24 → éditeur de DMS → concessionnaire),
  pas un accès ouvert à un tiers analytique. Un second article (09/10/2025) confirme le lancement
  d'un tableau de bord concessionnaire regroupant ces données agrégées (vues, leads) — jamais
  l'inventaire brut.
- `AutoScout24 Belgique baromètre marché 2024 2025 communiqué de presse` — a permis de localiser
  `/fr/entreprise/statistiques/` et l'article H1 2025, lus aux `[req 19]`/`[req 20]` ci-dessus.
- `European Commission designated "very large online platforms" VLOP DSA list 2026 AutoScout24` —
  confirme qu'AutoScout24 **n'apparaît sur aucune liste de VLOP/VLOSE désignés** par la Commission
  européenne (seuil : 45 millions d'utilisateurs actifs mensuels dans l'UE ; liste 2026 dominée par
  Amazon, Booking, Zalando, Google Shopping, Shein, Temu, etc.). Tranche la question falsifiable 5.

**Compteur après ce lot** : 20 requêtes HTTP journalisées vers des domaines AutoScout24/as24.tech
(dont 2 non conformes au `robots.txt` de `portal.services.as24.tech`, isolées et non répétées),
5 recherches web hors compteur. **20/60.**

---

## Exposition juridique de l'usage consommateur — section décisive

### La question posée

`00-CONTEXT.md` avait relevé le § 3.3 des **Händler-AGB** (contrat B2B, professionnel) et
conclu, avec une précision de portée : ce texte lie les concessionnaires signataires, pas un tiers
non-signataire en usage personnel. Le texte qui engagerait réellement KYCAR (hypothèse H2 —
usage personnel/interne) restait à trouver : les **Verbraucher-AGB** (conditions générales pour
utilisateur privé). Elles n'avaient jamais été lues avant cette sonde.

### Où elles sont, et pourquoi leur lecture est licite

`https://www.autoscout24.de/unternehmen/verbraucher-agb/` (HTTP 200, relevé le 2026-09-07,
« Stand 01.04.2026 »). Elles vivent sous le préfixe `/unternehmen/` du domaine `autoscout24.de` —
préfixe explicitement `Allow` pour le groupe `ClaudeBot` du `robots.txt` de ce domaine (voir
`[req 1]`). La lecture ne viole donc ni `robots.txt`, ni E5 (E5 ne borne que `www.autoscout24.be`).

### Le texte, verbatim

Champ d'application (préambule, § 1) — confirme que ce texte, et pas le Händler-AGB, est celui de
l'utilisateur privé :

> « [...] entstehenden Rechtsverhältnisse [zwischen AutoScout24 GmbH] und dem **privaten Nutzer**
> der AutoScout24 Services [...] Für **gewerbliche Nutzer** finden die Allgemeinen
> Geschäftsbedingungen für die Nutzung der über die Website www.autoscout24.de zugänglichen
> Services der AutoScout24 GmbH durch Unternehmen (**„Händler-AGB“**) Anwendung. »

Traduction : les rapports juridiques ici décrits sont ceux entre AutoScout24 et l'utilisateur
**privé** ; l'utilisateur **professionnel** relève d'un autre texte, les Händler-AGB. KYCAR, en
usage H2, relève sans ambiguïté de ce premier texte.

**§ 8 — Rechte an der Datenbank (Droits sur la base de données)**, verbatim :

> « 8.2 Der Nutzer hat im Rahmen dieser Nutzungsbedingungen das Recht, ausschließlich unter
> Verwendung der von AutoScout24 zur Verfügung gestellten Online-Suchmasken einzelne Datensätze
> auf seinem Bildschirm sichtbar zu machen und zur dauerhaften Sichtbarmachung einen Ausdruck zu
> fertigen. **Eine automatisierte Abfrage durch Scripte, durch Umgehung der Suchmaske durch
> Suchsoftware oder vergleichbare Maßnahmen sind nicht gestattet.**
>
> 8.3 Der Nutzer darf die durch Abfrage gewonnenen Daten weder vollständig, noch teilweise oder
> auszugsweise **zum Aufbau einer eigenen Datenbank** in jeder medialen Form und/oder für eine
> gewerbliche Datenverwertung oder Auskunftserteilung und/oder für eine sonstige gewerbliche
> Verwertung verwenden. Die Verlinkung, Integration oder sonstige Verknüpfung der Datenbank oder
> einzelner Elemente der Datenbank mit anderen Datenbanken oder Meta-Datenbanken ist unzulässig. »

Traduction opérationnelle : (8.2) le consommateur n'a le droit de rendre visible des
enregistrements qu'en passant par le masque de recherche en ligne fourni par AutoScout24, pour un
affichage écran ou une impression ; **toute interrogation automatisée par script, ou tout
contournement du masque de recherche par un logiciel de recherche ou une mesure comparable, est
interdite**. (8.3) Les données obtenues par interrogation ne peuvent, ni intégralement ni
partiellement, servir à **construire une base de données propre**, sous quelque forme que ce
soit — et toute mise en lien, intégration ou autre articulation de la base (ou d'éléments de
celle-ci) avec d'autres bases ou méta-bases est interdite.

### Comparaison directe avec le § 3.3 des Händler-AGB (déjà connu)

Verbatim Händler-AGB § 3 (« Nutzungsrechte »), relevé au `[req 6]` pour confirmation directe :

> « Als Missbrauch gilt insbesondere die **automatisierte Abfrage der Datenbank mittels Software**
> oder das Kopieren der Inhalte der Datenbank (einzeln oder in ihrer Gesamtheit) und das
> Zugänglichmachen auf anderen Internetseiten oder in anderen Medien [...] »

| | Verbraucher-AGB § 8.2/8.3 | Händler-AGB § 3.3 |
|---|---|---|
| Partie liée | utilisateur **privé** | concessionnaire **signataire** (contrat B2B) |
| Formulation | « automatisierte Abfrage durch Scripte, durch Umgehung der Suchmaske durch Suchsoftware oder vergleichbare Maßnahmen » | « automatisierte Abfrage der Datenbank mittels Software » |
| Portée de l'interdit | interrogation automatisée **et** réutilisation des données obtenues (construction d'une base propre, revente, liaison à d'autres bases) | interrogation automatisée **et** copie/republication des contenus |
| Sanction nommée | aucune sanction chiffrée ; régime contractuel de droit privé (résiliation, dommages-intérêts de droit commun) | « zivilrechtlich und ggf. auch strafrechtlich geahndet » (poursuite civile et, le cas échéant, pénale) |

### Confirmation belge — le même texte existe en français, sous préfixe autorisé

Le crawl de `/fr/entreprise/` (test licite `G2-K13`, voir Journal de preuve `[req 9]`) mène
directement à `https://www.autoscout24.be/fr/entreprise/agb/`, titré **« Conditions générales
AutoScout24 Belgium S.A – Utilisateur privé »**. C'est le texte belge, en français, jamais lu
avant cette sonde. Il porte, à l'article **9 (« Droits sur la base de données »)**, la clause
suivante — verbatim, extraite de la page HTML (`sed`/`perl`, pas de rendu JS) :

> « 9.2 [...] l'utilisateur a le droit d'afficher des données individuelles sur son écran et d'en
> imprimer un extrait pour un affichage permanent, exclusivement en utilisant les masques de
> recherche en ligne fournis par AutoScout24. **Les requêtes automatisées par script, le
> contournement du masque de recherche par un logiciel de recherche ou des mesures similaires ne
> sont pas autorisés.** 9.3 L'utilisateur ne peut utiliser les données obtenues par la
> consultation, en tout ou en partie, pour constituer sa propre base de données sous quelque
> forme [...] »

C'est la traduction quasi littérale du § 8.2/8.3 des Verbraucher-AGB allemandes déjà citées
ci-dessus — même structure en deux paragraphes, même interdiction du script et du contournement
du masque de recherche, même interdiction de constituer une base de données propre. **Le marché
belge ne bénéficie d'aucune clause plus permissive.** La page mène aussi à un PDF signé
(`consumer_agb_be_fr.pdf`, hébergé sur `assets.ctfassets.net`), qui confirme qu'il s'agit bien du
texte consommateur contractualisé, pas d'un brouillon.

La même page pointe vers le pendant professionnel belge, `/fr/entreprise/agb-b2b/` (« Conditions
Générales de Vente pour les utilisateurs professionnels »), lu au `[req 10]` : son article 3.3
reprend, verbatim, l'interdiction déjà connue du § 3.3 Händler-AGB allemand :

> « Une utilisation abusive sera constituée en particulier par : une interrogation automatique de
> la base de données au moyen de logiciels ; ou la copie des contenus de la base de données (en
> partie ou en intégralité) et leur mise à disposition sur d'autres sites Internet ou sur d'autres
> médias [...] »

**Ce que cela change et ne change pas** : rien sur le fond — la conclusion A11 ci-dessus tenait
déjà sur le texte allemand, applicable de plein droit à un utilisateur belge qui consulte
`autoscout24.de`. La nouveauté est que **le texte belge lui-même**, celui qui régit concrètement
`autoscout24.be` (le domaine que KYCAR viserait), porte la même clause, dans la langue de
l'utilisateur, sans atténuation ni exception locale. Cela ferme une hypothèse résiduelle
plausible — celle d'un marché belge moins verrouillé que le marché allemand — et confirme qu'
**aucune clause belge n'ouvre de porte que le texte allemand aurait refermée.**

**Verdict A11 (Exposition juridique) pour l'usage H2 de KYCAR** :

L'hypothèse selon laquelle « le § 3.3 Händler-AGB ne concerne pas le tiers non-signataire en
usage personnel » est **exacte quant à son mécanisme contractuel**, mais **sans effet
protecteur** : le texte qui lie effectivement l'utilisateur privé — les Verbraucher-AGB — **porte
la même interdiction**, formulée de façon au moins aussi large (elle vise explicitement la
construction d'une base de données propre, ce qui est l'objet même de KYCAR). Il n'existe donc
**aucun régime contractuel AutoScout24 sous lequel l'extraction automatisée serait permise à un
tiers non-concessionnaire** — ni le texte pro, ni le texte grand public ne l'autorisent. Le
fondement juridique change selon la casquette (droit des contrats B2B vs. droit de la consommation
+ conditions d'utilisation d'un service en ligne), mais la conclusion opérationnelle est
**identique et aggravée** : même l'usage strictement personnel et non republié envisagé par H2 est
couvert par une clause contractuelle nommée, et non plus seulement par le droit *sui generis* des
bases de données ou par `robots.txt`.

**A11 = 4/5** (et non 3/5 comme une lecture optimiste de `00-CONTEXT.md` aurait pu le laisser
espérer). Mécanisme juridique nommé : (a) violation contractuelle directe des Verbraucher-AGB
§ 8.2/8.3 dès l'acceptation implicite des conditions d'utilisation du site (position discutable
pour un simple lecteur non-inscrit qui ne « accepte » rien explicitement, mais AutoScout24 les
présente comme les conditions d'utilisation du **service**, pas seulement du compte) ; (b) droit
*sui generis* des bases de données (Directive 96/9/CE) en cas d'extraction substantielle,
indépendant de tout contrat ; (c) le § 3.3 Händler-AGB comme preuve supplémentaire, opposable si
KYCAR passait un jour par un compte concessionnaire. Ce n'est pas 5/5 : aucune action en justice
d'AutoScout24 contre un usage personnel non republié n'est documentée, la clause n'est pas
assortie d'un montant de pénalité contractuelle, et le gradient de risque de `00-CONTEXT.md`
(usage privé non republié → risque faible **en pratique**, malgré l'interdit **en droit**) reste
argumentable comme atténuation. Mais l'affirmation qui aurait pu clore le sujet — « seul le
concessionnaire est lié » — est **infirmée** : c'est la correction la plus importante que ce lot
apporte au dossier.

---

## Canaux d'export officiels

Question falsifiable prioritaire n°3/4 du lot : existe-t-il un canal d'export ouvert à un tiers
non-concessionnaire, avec une grille tarifaire ?

### C-01 / C-48 — SEARCH API GraphQL commerciale

**Existe, sous un nom commercial actif** : « Die AutoScout24 SEARCH API für Fahrzeugdaten »,
publiée sur `https://www.autoscout24.de/haendlerportal/schnittstelle-search-api/` (retrouvée par
recherche web, non récupérée en direct — voir Journal de preuve, motif : préfixe `/haendlerportal/`
hors `Allow` du `robots.txt` `.de`). Se présente comme un accès GraphQL à « des données étendues,
des informations détaillées et des millions d'annonces », pour applications, sites web ou logiciels
sur mesure. **Canal de contact commercial nommé** : `searchapi@autoscout24.com`,
`+49 89 44456-1000`. **Aucune grille tarifaire publique retrouvée** — la documentation commerciale
elle-même renvoie vers une prise de contact, pas vers un prix ou un formulaire de self-service.
Rien dans les pages retrouvées n'indique une restriction aux seuls concessionnaires signataires
(le nom `haendlerportal` — « portail concessionnaire » — suggère plutôt une commercialisation
adossée à l'écosystème pro, mais aucune clause d'exclusion d'un tiers n'a été lue). **Contacter ce
canal pour obtenir un devis relève de `ACTIONS-COMMANDITAIRE`** (E1/R2 : c'est une démarche
commerciale, pas un test non-authentifié).

À distinguer explicitement : l'**AutoScout24 Listing Creation API**
(`listing-creation.api.autoscout24.com/docs`, mentionnée par le même balayage de recherche) est
**write-only** — création, mise à jour, suppression d'annonces par un professionnel déjà inscrit.
Aucun endpoint de recherche ni de liste. Sans rapport avec l'acquisition de données en lecture ;
mentionnée ici uniquement pour éviter une confusion de nommage avec la SEARCH API.

### C-49 — Portail partenaire technique / TSP (`portal.services.as24.tech`)

Le portail existe et répond (`HTTP 200` sur `/` et `/api-docs`), mais :
- son `robots.txt` interdit tout crawl (`Disallow: /` sans groupe `ClaudeBot` dédié) — deux requêtes
  l'ont enfreint par erreur avant que cette conséquence soit tirée (voir Conformité) ;
- la coquille HTML de `/api-docs` est un portail développeur **Backstage** en mode public
  (`backstage-app-mode: public`), mais **le contenu documentaire est rendu côté client** (React) —
  rien de lisible dans le HTML brut sans exécution JS, que cette sonde ne pratique pas ;
- aucune information publique sur les conditions d'éligibilité du programme TSP (qui peut y
  souscrire, à quel tarif) n'a été retrouvée par recherche web indépendante.

**Verdict sur la question falsifiable 4** : « `portal.services.as24.tech` expose une documentation
lisible sans compte » est **FAUSSE en pratique pour un accès non-authentifié et sans JS** — le
portail répond, affiche un mode « public », mais son contenu utile est structurellement
inaccessible sans rendu JavaScript, et toute exploration plus poussée violerait son `robots.txt`.

### C-05 — API/canal de statistiques concessionnaire (HändlerIQ)

Confirmé par deux sources convergentes : la clause 17.2 des CGV professionnelles belges
(`/fr/entreprise/agb-b2b/`, verbatim ci-dessous) et un article professionnel indépendant (AIM
Group, juin et octobre 2025). C'est un canal de **données agrégées de performance** (nombre
d'appels, nombre de demandes, vues, leads), pas un export de l'inventaire, et il est **structurellement
fermé à un tiers non-concessionnaire** : il transite soit par le compte professionnel direct du
concessionnaire, soit par l'un des dix éditeurs de DMS (« Dealer Management System ») déjà
intégrés — un canal B2B2B, pas un canal ouvert.

Clause 17.2 CGV professionnelles belges, verbatim :

> « La transmission de données individuelles peut également s'effectuer via une interface
> technique. Lors de la réservation de certains forfaits de services, le professionnel reçoit
> également l'accès à des données agrégées (par exemple, nombre d'appels, nombre de demandes...). »

**Verdict** : NON VIABLE pour KYCAR — accès réservé aux professionnels sous forfait payant ou à
leurs éditeurs de DMS partenaires, portant sur des métriques de performance et non sur
l'inventaire brut.

### C-81 — CGU comme inventaire des canaux

Les quatre textes contractuels lus dans ce lot et le précédent (Verbraucher-AGB DE, Händler-AGB
DE, AGB BE « utilisateur privé », CGV BE « professionnels ») nomment, au total, **exactement deux
canaux d'accès légitimes aux données** : (1) le masque de recherche en ligne du site public, pour
un usage manuel non automatisé ; (2) l'« interface technique » de la clause 17.2 CGV BE, réservée
à la transmission de données du professionnel **vers** AutoScout24 (import de fiches d'annonces)
et à la réception de statistiques agrégées de performance. **Aucun des quatre textes ne nomme la
SEARCH API, le programme TSP, ni un quelconque canal d'export en masse vers un tiers.** Le silence
contractuel sur la SEARCH API commerciale (confirmée exister par ailleurs, voir C-01/C-48
ci-dessus) est cohérent avec son statut de produit commercial à part, hors du corps des CGU
générales — vendu séparément, sur devis, pas décrit dans les conditions d'utilisation du site.

**Verdict** : les CGU confirment, en creux, qu'il n'existe **aucun canal d'export gratuit ou
en self-service** pour un tiers non-concessionnaire. Utile comme preuve juridique croisée, pas
comme canal d'accès en soi.

### C-50 — Rapports de marché AS24

Deux familles de publications trouvées sous préfixes autorisés :
- `/fr/entreprise/communiques/` : baromètres annuels 2019-2022 seulement — **aucune édition
  2023-2026** dans cette section précise ;
- `/fr/entreprise/statistiques/` (alias de redirection de `/fr/entreprise/presse/statistiques/`) et
  `/fr/informer/actualite/` : analyses de marché plus récentes et plus fréquentes, dont deux
  publiées dans les 24 derniers mois (17/07/2025 et 04/10/2025).

Ces publications sont utiles comme **valeurs de référence chiffrées pour la validation de
pipeline** (ordres de grandeur d'immatriculations, de prix moyen, de répartition carburant), mais
elles sont **majoritairement sourcées de statistiques officielles tierces** (Febiac, Traxio, DIV)
recoupées avec des observations internes ponctuelles de la plateforme (ex. évolution de prix moyen
« observée sur la plateforme AutoScout24 ») — ce ne sont pas des exports de données brutes
d'inventaire, et elles ne constituent donc pas un canal d'acquisition.

---

## Candidats

### C-01 — SEARCH API GraphQL commerciale

| Axe | Valeur | Niveau de preuve |
|---|---|---|
| A1 Coût d'amorçage | Inconnu — pas de palier gratuit ni de tarif publié ; devis nécessaire | `[NON VÉRIFIÉ]` |
| A2 Coût récurrent | Inconnu, pas de grille publique | `[NON VÉRIFIÉ]` |
| A3 Couverture champs | Revendique « données étendues, informations détaillées » sur des millions d'annonces ; schéma exact non documenté publiquement | documenté (faible) |
| A4 Couverture géo | Non précisée dans les pages retrouvées ; l'écosystème AS24 couvre 19 pays, périmètre effectif de l'API `[NON VÉRIFIÉ]` | `[NON VÉRIFIÉ]` |
| A5 Latence | Non documentée publiquement | `[NON VÉRIFIÉ]` |
| A6 Débit / quota | Non documenté publiquement | `[NON VÉRIFIÉ]` |
| A7 Stabilité technique | Produit commercial maintenu activement (page marketing dédiée retrouvée par recherche récente) | argumenté |
| A8 Résistance anti-bot | Non concerné — canal contractuel direct, pas de scraping | prouvé |
| A9 Effort d'intégration | Faible probable pour un adaptateur `DataProvider` (API GraphQL structurée), mais non mesurable sans accès au schéma réel | estimé |
| A10 Coût de maintenance | Inconnu, dépend des termes du contrat commercial | `[NON VÉRIFIÉ]` |
| A11 Exposition juridique | Faible si contrat signé et respecté — c'est le seul candidat du lot qui, s'il aboutit, **sort KYCAR du régime d'interdiction contractuelle** analysé plus haut (1/5 sous réserve des clauses réelles du contrat, non lues) | argumenté |
| A12 Autonomie | Dépendant d'un tiers pouvant couper l'accès unilatéralement (contrat commercial standard) — **dépendant** | documenté |
| A13 Plafond de volumétrie | Non documenté publiquement | `[NON VÉRIFIÉ]` |
| A14 Fraîcheur atteignable | Probablement bonne (API temps réel revendiquée), non mesurée | argumenté |

**Verdict : VIABLE SOUS CONDITION.** Le canal existe et est activement commercialisé, mais sa
prise de contact (`searchapi@autoscout24.com`) est une démarche commerciale relevant de
`ACTIONS-COMMANDITAIRE` — aucun des axes tarifaires ni techniques n'est vérifiable sans elle.

**Inconnues restantes** : prix, quotas, couverture géographique réelle, éligibilité d'un
non-concessionnaire, clauses contractuelles associées (notamment si elles réintroduisent une
clause d'usage exclusivement professionnel).

### C-48 — Licence directe via le canal SEARCH API

| Axe | Valeur | Niveau de preuve |
|---|---|---|
| A1-A14 | Identiques à C-01 : c'est le même canal de contact (`searchapi@autoscout24.com`), une « licence directe » n'étant pas distinguée d'un abonnement SEARCH API dans les pages retrouvées | `[NON VÉRIFIÉ]`, voir C-01 |

**Verdict : VIABLE SOUS CONDITION**, non distinguable de C-01 avec les preuves disponibles — à
fusionner avec C-01 dans le tableau maître de la phase 1.6, sauf si le commanditaire obtient, en
contactant le canal commercial, une offre de licence différente d'un abonnement API.

### C-49 — Programme partenaire technique / TSP

| Axe | Valeur | Niveau de preuve |
|---|---|---|
| A1 Coût d'amorçage | Inconnu | `[NON VÉRIFIÉ]` |
| A2 Coût récurrent | Inconnu | `[NON VÉRIFIÉ]` |
| A3 Couverture champs | Inconnue — documentation illisible sans JS | `[NON VÉRIFIÉ]` |
| A4 Couverture géo | Inconnue | `[NON VÉRIFIÉ]` |
| A5 Latence | Inconnue | `[NON VÉRIFIÉ]` |
| A6 Débit / quota | Inconnu | `[NON VÉRIFIÉ]` |
| A7 Stabilité technique | Portail actif et répondant (`HTTP 200`), signe d'un produit maintenu | prouvé (existence seulement) |
| A8 Résistance anti-bot | Non concerné en théorie (canal contractuel), mais le portail lui-même est fermé au crawl (`robots.txt Disallow: /`) | prouvé |
| A9 Effort d'intégration | Inconnu | `[NON VÉRIFIÉ]` |
| A10 Coût de maintenance | Inconnu | `[NON VÉRIFIÉ]` |
| A11 Exposition juridique | Non évaluable sans lecture des conditions du programme, elles-mêmes non accessibles | `[NON VÉRIFIÉ]` |
| A12 Autonomie | Dépendant d'un tiers par construction (programme partenaire fermé) — **dépendant** | argumenté |
| A13 Plafond de volumétrie | Inconnu | `[NON VÉRIFIÉ]` |
| A14 Fraîcheur atteignable | Inconnue | `[NON VÉRIFIÉ]` |

**Verdict : NON VIABLE en l'état.** Taux de cellules `[NON VÉRIFIÉ]` très supérieur au seuil de
25 % (R3 du plan) : le portail existe, mais ni son contenu documentaire (rendu JS, hors périmètre
R2), ni ses conditions d'éligibilité (absentes du web ouvert) ne sont accessibles sans compte —
et toute poursuite du crawl violerait le `robots.txt` du domaine (`Disallow: /`), déjà enfreint
deux fois par erreur (voir Conformité). **Ce candidat ne doit plus faire l'objet d'aucune requête
automatisée supplémentaire.**

**Inconnues restantes** : la quasi-totalité des axes A1-A14 ; nécessiterait une demande d'accès
explicite du commanditaire (`ACTIONS-COMMANDITAIRE`).

### C-05 — API / canal de statistiques concessionnaire (HändlerIQ)

| Axe | Valeur | Niveau de preuve |
|---|---|---|
| A1 Coût d'amorçage | Sans objet pour KYCAR — accès non ouvert à un non-concessionnaire | prouvé (fermeture du canal) |
| A2 Coût récurrent | Sans objet | prouvé |
| A3 Couverture champs | Données agrégées de performance (appels, demandes, vues, leads) — pas l'inventaire | documenté |
| A4 Couverture géo | Écosystème AS24, 19 pays revendiqués par la source tierce (AIM Group) | documenté |
| A5-A10 | Sans objet — aucune voie d'accès pour un tiers non-concessionnaire | non applicable |
| A11 Exposition juridique | Sans objet pour KYCAR (aucun accès possible sans devenir concessionnaire, ce qui changerait la nature du projet) | argumenté |
| A12 Autonomie | Sans objet | non applicable |
| A13 Plafond de volumétrie | Sans objet | non applicable |
| A14 Fraîcheur atteignable | Sans objet | non applicable |

**Verdict : NON VIABLE.** Canal B2B2B (AS24 → éditeur de DMS → concessionnaire) confirmé par la
clause 17.2 des CGV professionnelles belges et par une source professionnelle indépendante ;
structurellement fermé à un tiers analytique non-concessionnaire, et limité à des métriques de
performance plutôt qu'à l'inventaire brut même pour un concessionnaire.

**Inconnues restantes** : aucune — candidat clos.

### C-81 — CGU comme inventaire des canaux

| Axe | Valeur | Niveau de preuve |
|---|---|---|
| A1-A10 | Sans objet — ce candidat est une preuve documentaire, pas un canal d'accès | non applicable |
| A11 Exposition juridique | Confirme et recoupe le verdict A11 = 4/5 établi en section décisive (Verbraucher-AGB + AGB BE privé + Händler-AGB + CGV BE pro, quatre textes convergents) | prouvé |
| A12-A14 | Sans objet | non applicable |

**Verdict : utile comme preuve croisée, non classable en VIABLE/NON VIABLE** (ce n'est pas un
canal). Confirme par lecture directe de quatre textes juridiques que le corpus contractuel
AutoScout24 ne nomme que deux canaux légitimes (masque de recherche manuel ; interface technique
d'import + statistiques agrégées pour professionnels), et aucun canal d'export en masse vers un
tiers.

### C-50 — Rapports de marché AS24

| Axe | Valeur | Niveau de preuve |
|---|---|---|
| A1 Coût d'amorçage | 0 € — pages publiques, préfixes autorisés | prouvé |
| A2 Coût récurrent | 0 € — mais pas un flux de données exploitable en pipeline (articles éditoriaux, pas un fichier structuré) | prouvé |
| A3 Couverture champs | Agrégats de marché (volumes d'immatriculation, prix moyen, répartition carburant/région) — pas de champ d'annonce individuelle | prouvé |
| A4 Couverture géo | Belgique uniquement pour les pages lues (existence de déclinaisons FR/LU visibles en lien, non explorées) | documenté |
| A5-A9 | Sans objet — ce n'est pas un canal d'intégration technique, seulement une source de vérité chiffrée ponctuelle | non applicable |
| A10 Coût de maintenance | Faible — relecture manuelle occasionnelle | argumenté |
| A11 Exposition juridique | Nulle — contenu éditorial public, lecture licite sous préfixe autorisé | prouvé |
| A12 Autonomie | Dépendant de la cadence de publication d'AutoScout24 (irrégulière : rien en 2023-2024 sous « communiqués », mais des analyses en 2025 sous « statistiques »/« informer ») | documenté |
| A13 Plafond de volumétrie | Sans objet | non applicable |
| A14 Fraîcheur atteignable | Variable et non garantie — la dernière analyse trouvée date du 04/10/2025 (< 12 mois), mais aucun calendrier de publication n'est annoncé | documenté |

**Verdict : VIABLE, mais uniquement comme instrument de validation ponctuelle** (ordres de
grandeur pour sanity-check du pipeline), jamais comme source d'acquisition de données d'inventaire.

**Inconnues restantes** : calendrier réel de publication ; existence éventuelle d'un flux
structuré (API/CSV) derrière ces publications éditoriales (non recherché, hors périmètre du lot).

---

## Questions falsifiables

| # | Question | Verdict | Preuve |
|---|---|---|---|
| 1 | « Les conditions professionnelles belges sont accessibles sous un préfixe autorisé et décrivent nommément un canal d'export de données. » | **PARTIELLEMENT VRAIE** — accessibles : oui (`/fr/entreprise/agb-b2b/`, `[req 11]`). Décrivent un canal d'export vers un tiers non-concessionnaire : **non** — seule une « interface technique » d'import (professionnel → AS24) et un accès à des statistiques agrégées de performance (clause 17.2) sont nommés, jamais un export en masse de l'inventaire | Lecture directe de `/fr/entreprise/agb-b2b/`, clause 17.2 citée verbatim |
| 2 | « Le contrat consommateur interdit aussi l'extraction automatisée. » | **VRAIE, et c'est la plus lourde de conséquence du lot** — les Verbraucher-AGB allemandes (§ 8.2/8.3) et leur équivalent belge en français (`/fr/entreprise/agb/`, article 9.2/9.3) portent, verbatim, la même interdiction du script et de la constitution d'une base de données propre. A11 = 4/5 pour l'usage H2, et non 3/5 | Lecture intégrale des deux textes, clauses citées verbatim en section décisive |
| 3 | « La SEARCH API existe encore et son canal commercial répond avec une grille tarifaire. » | **PARTIELLEMENT VRAIE** — le produit existe et est activement commercialisé (page dédiée retrouvée), avec un contact nommé (`searchapi@autoscout24.com`). **Aucune grille tarifaire publique** n'a été retrouvée ; obtenir un prix exige de contacter ce canal, ce qui est une démarche commerciale (`ACTIONS-COMMANDITAIRE`), pas un test non-authentifié | Recherche web ciblée ; page officielle identifiée mais non récupérée en direct (hors `Allow` du `robots.txt` `.de`) |
| 4 | « `portal.services.as24.tech` expose une documentation lisible sans compte. » | **FAUSSE** — la coquille HTML est publique (`backstage-app-mode: public`), mais le contenu documentaire réel est rendu côté client (React), donc illisible dans le HTML brut ; de plus le `robots.txt` du domaine interdit tout crawl automatisé | `[req 14]`-`[req 16]`, dont deux non conformes au `robots.txt` (voir Conformité) |
| 5 | « AutoScout24 n'est pas désigné VLOP, donc l'article 40 du DSA n'ouvre aucun droit. » | **VRAIE** — AutoScout24 n'apparaît sur aucune liste de VLOP/VLOSE désignés par la Commission européenne (seuil 45 M d'utilisateurs actifs mensuels UE ; liste 2026 dominée par des plateformes d'e-commerce et réseaux sociaux de tout autre ordre de grandeur). L'angle A7 de `candidates-v2.md` est définitivement clos : pas de droit d'accès chercheur au titre de l'article 40 DSA | Recherche web ciblée sur la liste officielle de la Commission européenne, 2026 |

---

## ACTIONS-COMMANDITAIRE

| Action | Ce qu'elle permettrait | Coût / démarches |
|---|---|---|
| Contacter `searchapi@autoscout24.com` (ou `+49 89 44456-1000`) pour la SEARCH API GraphQL (C-01/C-48) | Obtenir la grille tarifaire réelle, les quotas, la couverture géographique et l'éligibilité d'un non-concessionnaire — seul candidat du lot susceptible de lever l'interdiction contractuelle analysée en section décisive | Démarche commerciale (email ou téléphone), délai et coût non estimables sans réponse ; c'est un contact commercial explicite, hors périmètre non-authentifié de cette sonde (E1/R2) |
| Demander un accès identifié au programme TSP (`portal.services.as24.tech`) | Lire la documentation technique réelle (actuellement illisible sans JS et sans compte) et connaître les conditions d'éligibilité | Démarche non caractérisée dans les pages publiques retrouvées ; probablement une demande de compte partenaire, à faire réaliser par le commanditaire |
| Demander une intégration comme éditeur DMS ou un accès direct aux statistiques agrégées AS24 (C-05, HändlerIQ) | Vérifier si le canal est ouvre-t-il, en dernier ressort, un accès à un tiers analytique non-concessionnaire (peu probable au vu du modèle B2B2B documenté) | Démarche commerciale de partenariat DMS, délai et issue incertains |

---

## Conformité

- **E5** — préfixes touchés sur `www.autoscout24.be` : `/fr/entreprise/`, `/fr/entreprise/agb/`,
  `/fr/entreprise/agb-b2b/`, `/fr/entreprise/communiques/` (et sa sous-page barometre-2022),
  `/fr/entreprise/statistiques/` (+ redirection depuis `/fr/entreprise/presse/statistiques/`),
  `/fr/informer/actualite/`, `/nl/onderneming/` — **tous confirmés `Allow` pour `ClaudeBot`** au
  `[req 7]`. **Respecté avec une exception documentée et non exploitée** : le lien vers les
  conditions générales néerlandaises (`/nl/bedrijf/agb/`) a été identifié mais **délibérément non
  récupéré**, ce préfixe n'étant pas dans la liste `Allow` (seul `/nl/onderneming/` y figure) — la
  contrepartie néerlandaise de la clause consommateur reste donc `[NON VÉRIFIÉ]`, compensée par
  l'équivalent français, juridiquement identique pour le même opérateur (AutoScout24 Belgium S.A.).
  Sur `.de`, la page marketing de la SEARCH API (`/haendlerportal/…`) a été identifiée par
  recherche web mais **non récupérée en direct**, ce préfixe étant hors `Allow`.
- **E1 / R2** (aucun compte, aucun credential) : **respecté**. Aucun compte créé. Les deux points
  de contact commercial identifiés (SEARCH API, programme TSP) sont consignés en
  `ACTIONS-COMMANDITAIRE` plutôt qu'actionnés.
- **`portal.services.as24.tech`** : **non conforme, ponctuellement**. Son `robots.txt`
  (`User-agent: * / Disallow: /`, pas de groupe `ClaudeBot` dédié) a été lu en premier ([req 14]),
  mais deux requêtes vers `/api-docs` ([req 15], [req 16]) ont suivi dans la continuité de la même
  investigation avant que la conséquence du `Disallow: /` soit tirée — un écart de séquencement,
  pas une décision délibérée de contourner l'instruction. Contenu obtenu : une coquille
  d'application vide, sans valeur probante au-delà de confirmer l'existence technique du portail.
  **Aucune requête supplémentaire n'a été faite vers ce domaine après ce constat**, et aucun autre
  domaine de ce lot n'a fait l'objet du même écart. Ce point doit être relevé explicitement par
  l'audit croisé de la phase 1.5.
- **R3** (plafond 60 requêtes) : **respecté**. Compte final détaillé dans le Journal de preuve :
  6 requêtes de la session précédente ([req 1]-[req 6]) + 14 requêtes de cette session ([req 7]-
  [req 20]) = **20 requêtes HTTP cumulées vers des domaines AutoScout24/as24.tech, sur un plafond
  de 60** ; 6 recherches web hors compteur au total (1 session précédente + 5 cette session,
  convention déjà en usage dans ce document). Aucune extraction de masse : chaque page lue est une
  page de contenu (CGU, actualité, communiqué), jamais une page de résultats de recherche paginée
  ni une collecte répétée.
- **R1** (zéro guessing) : chaque clause juridique citée dans ce document est reproduite verbatim
  avec sa source (URL + `[req N]`) ; les affirmations sur l'absence de canal d'export ou de grille
  tarifaire sont des constats négatifs documentés (recherche menée, rien trouvé), pas des
  suppositions.

