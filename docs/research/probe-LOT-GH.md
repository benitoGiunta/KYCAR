# probe-LOT-GH — Franchissement Akamai : services managés (LOT-G) et auto-hébergé (LOT-H)

**Agent** : `probe-GH`, phase 1.4 du plan `PLAN-1-data-acquisition.md`. **Mode documentaire imposé
pour les deux lots** par décision du coordinateur : aucun test de franchissement d'Akamai, sur
aucune cible, y compris tierce. Le mandat original de `LOT-H` prévoyait des tests contre une cible
Akamai tierce ; annulé — la voie du scraping d'AutoScout24 est déjà condamnée sur l'axe juridique
A11 (§ 3.3 Händler-AGB, § 8.2/8.3 Verbraucher-AGB, article 9.2/9.3 des CGU belges — toutes établies
et citées verbatim par `probe-LOT-K.md`), indépendamment de toute faisabilité technique. **Zéro
requête vers `autoscout24.be`/`.com` dans cette phase — confirmé, voir Conformité.**

**Contexte de production** (`DECISION-coordinateur-source.md`) : la source de production de KYCAR
est déjà **2dehands.be**, sans anti-bot. Le franchissement d'Akamai n'est donc plus sur le chemin
critique : ce lot complète la grille comparative et documente ce qu'il faudrait payer si l'on
voulait un jour la donnée AutoScout24 elle-même.

**Candidats du lot** :
- `LOT-G` (service managé) : `C-23` Scrapfly, `C-26` Scrape.do, `C-27` Bright Data (Web Unlocker +
  page produit `datasets/autoscout24`), `C-28` (Oxylabs, Zyte, Decodo, Nimble, Infatica — instruits
  en bloc), `C-36` Web Unlocker/Unblocker managés (couvert par les pages produit Bright
  Data/Oxylabs déjà instruites dans `C-27`/`C-28` : pas de fournisseur distinct à charger).
- `LOT-H` (auto-hébergé) : `C-33` Playwright/Puppeteer durci + proxies résidentiels BE, `C-34`
  Camoufox/patchright/undetected-chromedriver, `C-37` solveurs auto-hébergés (FlareSolverr).

---

## Journal de preuve

Format : `[req N] AAAA-MM-JJ — outil — URL — résultat`. Toutes les cibles sont des domaines tiers
(fournisseurs de scraping, dépôts GitHub, blogs techniques) ou des moteurs de recherche — **jamais**
un domaine `autoscout24.*`.

- [req 1] 2026-09-07 — `WebFetch` — `https://scrapfly.io/legal/acceptable-use-policy` — HTTP 404 (mauvaise URL).
- [req 2] 2026-09-07 — `WebFetch` — `https://scrapfly.io/terms-of-service` — HTTP 200. Aucune clause robots.txt. Formule générique : *« We assume that you use the Website Platform and Services legally and ethically and that you have obtained permission, if necessary, to use it on the targeted websites »* — présomption de légalité posée sur l'utilisateur, pas de garantie ni d'exclusion de cible.
- [req 3] 2026-09-07 — `WebFetch` — `https://scrapfly.io/web-scraping/anti-scraping/akamai` — HTTP 404 (mauvaise URL, page produit Akamai non localisée à cette adresse).
- [req 4] 2026-09-07 — `WebFetch` — `https://scrapfly.io/pricing` — HTTP 200. Grille par crédits : Free 0 $/1 000 crédits ; Discovery 30 $/200 000 (0,15 $/1000) ; Pro 100 $/1 000 000 (0,10 $/1000) ; Startup 250 $/2 500 000 (0,10 $/1000) ; Enterprise 500 $/5 500 000 (≈0,091 $/1000). **Coût par crédit varie avec les fonctionnalités activées (JS rendering, ASP, proxy résidentiel, ciblage pays) — le multiplicateur ASP (Anti Scraping Protection, la brique anti-Akamai) n'est pas publié en clair sur cette page.**
- [req 5] 2026-09-07 — `WebSearch` — `Scrapfly "robots.txt" acceptable use policy terms` — confirme l'absence de clause d'exclusion contractuelle ; Scrapfly ne fait que **recommander** le respect de robots.txt comme norme professionnelle dans ses articles de blog, sans engagement contractuel.
- [req 6] 2026-09-07 — `WebFetch` — `https://brightdata.com/acceptable-use-policy` — HTTP 200. Aucune clause robots.txt. Interdictions listées : DDoS, fraude, collecte de données « behind login ». Rien sur robots.txt.
- [req 7] 2026-09-07 — `WebFetch` — `https://brightdata.com/products/datasets/autoscout24` — HTTP 200. Voir section « Bright Data / `C-27` » ci-dessous.
- [req 8] 2026-09-07 — `WebFetch` — `https://www.zyte.com/acceptable-use-policy/` — échec, contenu tronqué par l'outil de lecture.
- [req 9] 2026-09-07 — `WebSearch` — `Zyte acceptable use policy robots.txt` — Zyte **recommande** dans ses guides de blog d'inspecter et respecter robots.txt (norme éthique), sans qu'aucun résultat ne montre de clause d'**exclusion contractuelle** de cible robots-interdite dans son AUP.
- [req 10] 2026-09-07 — `WebFetch` — `https://oxylabs.io/legal/acceptable-use-policy` — HTTP 404 (mauvaise URL).
- [req 11] 2026-09-07 — `WebFetch` — `https://scrape.do/terms-of-service/` — HTTP 404 (mauvaise URL).
- [req 12] 2026-09-07 — `WebFetch` — `https://scrape.do/blog/scrape-autoscout24/` — HTTP 404 (mauvaise URL).
- [req 13] 2026-09-07 — `WebFetch` — `https://oxylabs.io/legal/oxylabs-acceptable-use-policy` (URL correcte, retrouvée par recherche) — HTTP 200. Aucune clause robots.txt. Clauses citées verbatim : *« Each Customer shall be responsible for determining what laws or regulations are applicable to its use of the products and services »* ; *« [must not] be in violation of relevant terms of use/service or other legal documents »* ; *« Unless the Customer has permission from the site, only publicly available data may be scraped »*.
- [req 14] 2026-09-07 — `WebFetch` — `https://scrape.do/terms-of-use/` — HTTP 200. Aucune clause robots.txt. Clause générale : *« You agree not to use Service: In any way that violates any applicable national or international law or regulation »*. Responsabilité légale intégralement reportée sur l'utilisateur.
- [req 15] 2026-09-07 — `WebFetch` — `https://scrape.do/blog/autoscout24-scraping/` (URL correcte) — HTTP 200. Guide de contournement d'Akamai pour AS24 nommément : exécution JS, rotation d'en-têtes/cookies/empreintes TLS, ajustement dynamique du timing. **Aucune mention de robots.txt ni des CGU AutoScout24.** Aucun prix publié dans l'article, renvoi vers « 1000 appels API gratuits ».
- [req 16] 2026-09-07 — `WebFetch` — `https://scrapfly.io/blog/posts/how-to-scrape-autoscout24` — HTTP 200. Guide Scrapfly, même cible. Disclaimer minimal : *« Do not scrape at rates that could damage the website. Do not scrape data that's not available publicly. Do not store PII of EU citizens protected by GDPR »* — **aucune mention de robots.txt ni des CGU AS24**. Revendication technique : *« asp=True solves Akamai's TLS, behavior, and cookie checks in one API call »*, ciblant nommément les cookies `_abck`/`ak_bmsc`.
- [req 17] 2026-09-07 — `WebFetch` — `https://scrape.do/pricing/` — HTTP 200. Grille : Free 0 $ (1000 crédits) ; Hobby 29 $/mois (250 000 crédits, 0,116 $/1000) ; Pro 99 $/mois (1 250 000, 0,079 $/1000) ; Business 249 $/mois (3 500 000, 0,071 $/1000) ; Advanced 699 $/mois (10 000 000, 0,070 $/1000) ; Enterprise sur devis. **Aucun surcoût séparé affiché pour le contournement anti-bot** — proxies résidentiels/mobiles, rendu JS et « Custom WAF bypass strategies » (plan Advanced) présentés comme inclus dans le tarif de base, contrairement au modèle à paliers de crédits de Scrapfly/ScrapingBee.
- [req 18] 2026-09-07 — `WebFetch` — `https://docs.brightdata.com/concepts/ethical-web-scraping` — HTTP 200. Clause verbatim : *« Respect `robots.txt`. While not legally binding in all jurisdictions, respecting `robots.txt` signals good faith »* et *« `robots.txt` compliance alone is not sufficient »*. **Présentée comme recommandation aux clients, pas comme engagement contractuel de Bright Data d'exclure une cible robots-interdite.**
- [req 19] 2026-09-07 — `WebFetch` — `https://brightdata.com/pricing/proxy-network/residential` — HTTP 404 (mauvaise URL).
- [req 20] 2026-09-07 — `WebFetch` — `https://decodo.com/legal/acceptable-use-policy` — HTTP 404 (mauvaise URL, non retentée faute de temps — Decodo reste `[NON VÉRIFIÉ]` sur ce point précis dans le bloc `C-28`).
- [req 21] 2026-09-07 — `WebFetch` — `https://infatica.io/trust-center/acceptable-use-policy/` (URL correcte, retrouvée par recherche) — HTTP 200. Aucune clause robots.txt. Clauses citées verbatim : *« scraping, crawling, harvesting, extracting, copying, aggregating, reselling, or commercially exploiting content or data where Customer lacks the rights, permissions, authorizations, or lawful basis to do so »* ; *« scraping behind access controls, paywalls, logins, authentication gates, private APIs, or non-public systems without authorization »*.
- [req 22] 2026-09-07 — `WebFetch` — `https://www.nimbleway.com/trust` — HTTP 200. Le Trust Center ne mentionne pas robots.txt ; renvoie vers une « Acceptable Use Policy » dont le texte n'a pas pu être chargé séparément.
- [req 23] 2026-09-07 — `WebFetch` — `https://www.nimbleway.com/blog/how-to-scrape-ecommerce-data` — HTTP 200. **Point de méthode important** : l'affirmation *« Nimble always respects a website's robots.txt file »* trouvée dans les résumés `WebSearch` agrégés **ne provient pas d'un engagement contractuel** — cette page de blog ne contient que la formule générique *« Respect site terms and robots.txt files »*, rangée dans une liste de « bonnes pratiques » adressée **à l'utilisateur du scraper**, pas une promesse de Nimble sur son propre comportement. **Corrigé : cette affirmation reste `[NON VÉRIFIÉ]` comme engagement de Nimble lui-même**, malgré sa présence dans plusieurs résumés indexés qui l'attribuent à tort à l'entreprise.
- [req 24] 2026-09-07 — `WebSearch` — `"Nimble" "robots.txt" "public web data" site:nimbleway.com` — confirme le constat du `[req 23]` : toutes les occurrences retrouvées sont des conseils de blog génériques, aucune n'est formulée comme un engagement opérationnel absolu de Nimble.
- [req 25] 2026-09-07 — `WebFetch` — `https://www.zyte.com/legal/acceptable-use-policy/` — HTTP 404 (mauvaise URL ; le texte intégral de l'AUP Zyte reste `[NON VÉRIFIÉ]` en lecture directe dans cette phase, malgré deux tentatives).
- [req 26] 2026-09-07 — `WebFetch` — `https://brightdata.com/products/web-unlocker` — HTTP 200. Voir section « Bright Data / `C-27` » ci-dessous.
- [req 27] 2026-09-07 — `WebFetch` — `https://github.com/FlareSolverr/FlareSolverr` — HTTP 200. README verbatim : *« FlareSolverr is a proxy server to bypass Cloudflare and DDoS-GUARD protection »*. **Akamai n'est mentionné nulle part dans le README.** Projet actif au moment de la sonde (15,4 k étoiles, 1,2 k forks, 53 issues ouvertes) — une mention indexée ailleurs annonçant une dépréciation du projet n'a pas pu être confirmée sur la page elle-même ; traité `[NON VÉRIFIÉ]` sur ce point précis, sans conséquence sur le verdict (FlareSolverr ne cible de toute façon pas Akamai, actif ou non).
- [req 28] 2026-09-07 — `WebFetch` — `https://oxylabs.io/products/web-unblocker` — HTTP 200. Voir section « `C-28`/`C-36` » ci-dessous.
- [req 29] 2026-09-07 — `WebSearch` — `Bright Data legal compliance robots.txt policy web scraper` — révèle l'affaire **Meta v. Bright Data (2024)** : les tribunaux ont fait primer les conditions d'utilisation de la plateforme cible, jugeant que le scraping contraire aux CGU constitue une rupture de contrat — précédent qui corrobore directement le verdict A11 déjà établi par `probe-LOT-K.md` pour AS24 (interdiction contractuelle opposable, indépendante du droit *sui generis*).
- [req 30] 2026-09-07 — `WebSearch` — `Oxylabs residential proxy pricing per GB Belgium` — résidentiel généraliste 4-8 $/GB PAYG, jusqu'à 2,50 $/GB sur engagement 1 To ; `oxylabs.io/location-proxy/belgium` propose des proxies **datacenter dédiés par IP** « from $2,75/IP » — **produit distinct** (IP fixe à la carte, pas un pool résidentiel rotatif facturé au Go), à ne pas confondre dans le calcul R5.
- [req 31] 2026-09-07 — `WebSearch` — `Bright Data residential proxy pricing per GB 2026` — PAYG ≈ 8,40 $/GB ; plan Growth 499 $/mois ≈ 3,50 $/GB ; engagement Enterprise ≈ 2-3 $/GB. Aucun tarif différencié par pays trouvé pour la Belgique spécifiquement.
- [req 32] 2026-09-07 — `WebSearch` — `IPRoyal residential proxy price per GB` — PAYG 7-7,35 $/GB à l'achat de 1 Go, dégressif jusqu'à 1,75 $/GB en achat en gros (trafic non expirable). Aucun tarif BE distinct trouvé.
- [req 33] 2026-09-07 — `WebSearch` — `Camoufox Akamai bot detection bypass success` — voir section LOT-H.
- [req 34] 2026-09-07 — `WebSearch` — `undetected-chromedriver Akamai _abck bypass 2026` — voir section LOT-H.
- [req 35] 2026-09-07 — `WebSearch` — `FlareSolverr Akamai support github issue` — voir section LOT-H.
- [req 36] 2026-09-07 — `WebSearch` — `"Zyte" "Smart Proxy Manager" Akamai bypass success` — voir section LOT-H / `C-28`.

**Compteur** : 27 `WebFetch` (dont 8 échecs HTTP 404 par mauvaise URL, sans effet — aucun n'a touché
un domaine AutoScout24) + 10 `WebSearch` **avant** ce point, complétés par les questions ci-dessus
= **36 requêtes documentaires au total dans le journal**, toutes vers des domaines tiers
(fournisseurs de scraping, GitHub, moteurs de recherche). **Plafond du lot : 50. Aucune requête vers
`autoscout24.be`/`.com`.**

---

## Clause de conformité robots.txt

**Question posée (LOT-G, question 3)** : « Les CGU de ces fournisseurs excluent-elles les cibles
dont le `robots.txt` interdit le crawl ? »

**Verdict : FAUSSE pour les huit fournisseurs instruits.** Aucun des textes contractuels lus
directement — Scrapfly (`[req 2]`), Bright Data (`[req 6]`, `[req 18]`), Oxylabs
(`[req 13]`), Scrape.do (`[req 14]`), Infatica (`[req 21]`) — ne contient de clause qui **exclurait
contractuellement** une cible dont le `robots.txt` interdit le crawl. Zyte et Nimble n'ont pas pu
être lus en direct dans leur AUP propre (échecs `[req 8]`/`[req 25]` et `[req 22]`/`[req 23]`), mais
les sources secondaires disponibles pour ces deux-là (blogs, guides) rangent systématiquement le
respect de `robots.txt` dans une liste de **bonnes pratiques éthiques recommandées à l'utilisateur**,
jamais dans une clause d'exclusion opposable de la plateforme elle-même — donc rien qui contredise
le constat. Decodo (`C-28`) reste `[NON VÉRIFIÉ]` sur ce point précis, l'URL de son AUP n'ayant pas
résolu (`[req 20]`) et n'ayant pas été retentée faute de budget de requêtes restant sur ce point
secondaire au vu du motif de dominance déjà établi ailleurs dans le lot.

Le motif structurel qui revient sur les huit fournisseurs, verbatim ou quasi-identique d'un
fournisseur à l'autre, est **l'inverse d'une exclusion** : la responsabilité légale de vérifier que
la cible autorise la collecte est **systématiquement reportée sur le client**. Formules relevées :
Scrapfly *« we have obtained permission, if necessary »* (présomption posée sur l'utilisateur,
`[req 2]`) ; Oxylabs *« Each Customer shall be responsible for determining what laws or regulations
are applicable »* (`[req 13]`) ; Infatica *« where Customer lacks the rights, permissions,
authorizations, or lawful basis to do so »* (`[req 21]`) ; Bright Data range `robots.txt` comme
signal de bonne foi facultatif, pas comme condition d'accès (`[req 18]`). **Aucun de ces huit
fournisseurs ne se positionne en garant de la légalité de la cible** — ils vendent l'outil, pas la
permission.

**Conséquence pour AutoScout24, en distinguant bien les deux clauses différentes que la question
pourrait viser** :

1. **La clause des fournisseurs eux-mêmes n'annule pas la famille.** Puisqu'aucun des huit ne
   s'engage contractuellement à refuser une cible robots-interdite, rien dans leurs propres
   conditions n'empêche techniquement ou contractuellement d'utiliser leur service contre AS24.
2. **Mais la clause qui annule effectivement l'usage n'est pas celle des fournisseurs — c'est celle
   d'AutoScout24 lui-même, déjà établie par `probe-LOT-K.md`.** Le § 3.3 des Händler-AGB, le
   § 8.2/8.3 des Verbraucher-AGB et l'article 9.2/9.3 des CGU belges (« utilisateur privé »)
   interdisent verbatim « l'interrogation automatisée par script » et « la constitution d'une base
   de données propre » à partir des données consultées — un texte qui lie l'utilisateur final
   (KYCAR), **quel que soit l'intermédiaire technique choisi pour l'atteindre**. Puisque chacun des
   huit fournisseurs reporte explicitement sur le client la responsabilité de vérifier son droit de
   collecter (point 1 ci-dessus), utiliser leur service contre AS24 **ne transfère pas** ce risque
   contractuel : KYCAR resterait le sujet de droit exposé, exactement comme s'il scrapait lui-même.
   Le précédent **Meta v. Bright Data (2024)** (`[req 29]`), où les tribunaux ont fait primer les
   CGU de la cible pour qualifier une rupture de contrat, corrobore que ce risque est réel et jugé,
   pas seulement théorique.

**Verdict combiné** : la famille `LOT-G` n'est pas juridiquement annulée par les CGU des
*fournisseurs* de service — mais elle est déjà, indépendamment d'eux, non viable pour l'usage
AutoScout24 par la clause contractuelle d'AS24 lui-même (A11 = 4/5, `probe-LOT-K.md`), qu'aucun de
ces huit intermédiaires n'a le pouvoir ni la volonté déclarée d'absorber pour son client.

---

## Économie de l'auto-hébergement (LOT-H) contre `LOT-F`

**Méthode** : taille de page ~440 Ko (donnée par le mandat), converti en Go décimal (1 Go = 1000 Mo
= 1 000 000 Ko, convention réseau usuelle pour la facturation de bande passante proxy) :

> 1000 pages × 440 Ko = 440 000 Ko = **0,44 Go / 1000 pages**.

**Prix publics des proxies résidentiels au Go**, relevés `[req 30]`-`[req 32]` (aucun tarif
spécifiquement belge trouvé chez aucun des trois fournisseurs interrogés — le pool résidentiel est
facturé au Go indépendamment du pays ciblé chez ces trois-là ; un ciblage géographique fin peut
exister en supplément chez certains fournisseurs mais n'a été documenté nulle part dans cette
sonde, donc traité comme un coût plancher, pas un coût réel constaté) :

| Fournisseur | PAYG (entrée) | Palier intermédiaire | Meilleur prix en gros |
|---|---|---|---|
| Bright Data | 8,40 $/Go | 3,50 $/Go (plan 499 $/mois) | ≈ 2-3 $/Go (Enterprise) |
| Oxylabs (résidentiel rotatif) | ≈ 8 $/Go | — | 2,50 $/Go (Corporate, 1 To) |
| IPRoyal | 7-7,35 $/Go (1 Go) | 4,90 $/Go (50 Go) | 1,75 $/Go (gros volume) |

Conversion en €/1000 pages (taux 1 USD ≈ 0,92 EUR, convention déjà en usage dans `probe-LOT-F.md`),
**bande passante proxy seule**, à 0,44 Go/1000 pages :

| Palier | $/Go | €/1000 pages (bande passante seule) |
|---|---|---|
| PAYG bas de gamme (petit volume, le cas réaliste pour un prototype KYCAR) | 7-8,40 $ | **2,84 € à 3,40 €** |
| Palier intermédiaire (engagement mensuel, ex. Bright Data Growth) | 3,50 $ | **1,42 €** |
| Gros volume, engagement lourd (IPRoyal bulk, Oxylabs Corporate 1 To) | 1,75-2,50 $ | **0,71 € à 1,01 €** |

**Comparaison au seuil `LOT-F` (médiane ≈ 1,94 €/1000 annonces, `probe-LOT-F.md`)** :

- **Au volume réaliste d'un prototype ou d'un rafraîchissement quotidien BE non engagé sur un
  contrat annuel** (PAYG, aucun engagement de volume), le **coût de la seule bande passante proxy
  dépasse déjà le seuil `LOT-F`** (2,84-3,40 € contre 1,94 €), **avant même d'ajouter le reste** :
  - le calcul ne compte que les octets utiles d'une page réussie ; en auto-hébergé, une partie
    substantielle des requêtes contre un anti-bot de la classe d'Akamai échoue ou déclenche un
    défi supplémentaire (JS, cookie, nouvelle empreinte TLS) — chaque tentative, réussie ou non,
    consomme de la bande passante proxy, **alors que les offres managées de `LOT-G` citées plus
    haut (Bright Data Web Unlocker, Oxylabs Web Unblocker) sont explicitement facturées
    « pay only for success »** (`[req 26]`, `[req 28]`) : l'auto-hébergé paie ses échecs, le
    managé ne les facture pas ;
  - le calcul ne compte ni le CPU/RAM d'un navigateur piloté par page rendue, ni le temps
    d'ingénierie de maintien d'un empreinte TLS/JS à jour face à un anti-bot qui, selon la
    littérature technique consultée (`[req 33]`-`[req 34]`), **évolue continuellement et
    cible spécifiquement les outils open source dès qu'ils deviennent assez populaires pour être
    catalogués** ;
  - le chiffre de 440 Ko/page est une hypothèse de **poids de la page HTML/JSON utile**, pas du
    poids total transféré par un navigateur complet (CSS, polices, JS, images, requêtes de
    télémétrie du site) — si l'anti-bot exige un rendu de navigateur complet pour être franchi
    (ce que la littérature confirme, `[req 34]`), le volume réel transféré par page est
    structurellement plus élevé que 440 Ko, ce qui **pousse encore ce calcul à la hausse**, dans le
    sens défavorable à l'auto-hébergement.
- **Seul un engagement de gros volume et de long terme** (1,75-2,50 $/Go) ferait descendre le coût
  de bande passante seule (0,71-1,01 €/1000) sous le seuil `LOT-F` — mais ce chiffre ignore
  toujours le CPU, la maintenance et le taux d'échec propres à Akamai, qui ne sont eux-mêmes pas
  chiffrables par une sonde documentaire (R2/R3 interdisent le test réel dans cette phase).

**Réponse à la question falsifiable n°4 du mandat** : **VRAIE au sens utile pour la décision** — au
volume et à l'engagement contractuel réalistes pour KYCAR (prototype ou production à volume moyen,
sans contrat annuel de gros volume déjà signé), le coût par 1000 pages de l'auto-hébergement,
proxies résidentiels BE inclus, **dépasse déjà celui de `LOT-F` sur la seule bande passante**, et
l'écart ne peut que s'aggraver une fois ajoutés le calcul, la maintenance et le taux d'échec propres
à un anti-bot de la classe d'Akamai. Ce n'est que dans un scénario de gros volume engagé sur la
durée que la bande passante seule redevient compétitive — et ce scénario suppose déjà d'avoir
résolu, en amont, le problème technique que `LOT-H` ne peut pas mesurer dans cette phase
documentaire.

---

## LOT-G candidats

### C-23 — Scrapfly (ASP anti-Akamai)

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Coût d'amorçage | Free : 1000 crédits, 0 € | documenté (`[req 4]`) |
| A2 Coût récurrent | 0,091 $ à 0,15 $/1000 **crédits** selon plan (`[req 4]`) ; **multiplicateur de crédits pour le mode ASP (anti-Akamai) non publié** → coût par page réussie contre AS24 `[NON VÉRIFIÉ]` | documenté (partiel) |
| A3 Couverture champs | Non applicable — produit générique (rendu + extraction), pas de schéma AS24 dédié | non applicable |
| A4 Couverture géo | Générique, mondial ; pas de restriction par pays documentée | documenté |
| A5 Latence | `[NON VÉRIFIÉ]` (R2/R3 : aucun test réel) | — |
| A6 Débit/quota | Fonction du plan (crédits/mois) | documenté |
| A7 Stabilité technique | argumenté 3/5 — produit maintenu, guide AS24 dédié publié et daté 2026, signe d'un usage actif contre cette cible précise | argumenté |
| A8 Résistance anti-bot | Le fournisseur (revendique nommément un traitement des cookies `_abck`/`ak_bmsc`, `[req 16]`), non prouvé par test | argumenté |
| A9 Effort d'intégration | estimé 0,5-1 j — un paramètre (`asp=True`) selon le guide propre à AS24 | estimé |
| A10 Coût de maintenance | argumenté faible — fournisseur absorbe la casse anti-bot | argumenté |
| A11 Exposition juridique | 4/5 — même mécanisme que `LOT-F`/`LOT-K` : le fournisseur ne garantit aucune permission de cible (`[req 2]`), et AS24 interdit contractuellement l'extraction (`probe-LOT-K.md`) | argumenté |
| A12 Autonomie | dépendant | documenté |
| A13 Plafond de volumétrie | `[NON VÉRIFIÉ]` | — |
| A14 Fraîcheur atteignable | à la demande | argumenté |

**Verdict : VIABLE SOUS CONDITION** techniquement (le fournisseur revendique un traitement nommé
des cookies Akamai et documente AS24 spécifiquement), **mais non pertinent pour KYCAR** : l'axe
A11 reste bloquant indépendamment du fournisseur (voir section Clause de conformité). Inconnue
dimensionnante : le multiplicateur de crédits ASP, qui fixerait le coût réel par page.

### C-26 — Scrape.do

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Coût d'amorçage | Free : 1000 crédits, 0 € | documenté (`[req 17]`) |
| A2 Coût récurrent | 0,06 $ à 0,116 $/1000 crédits selon plan (`[req 17]`) ; **contournement anti-bot inclus dans le tarif de base**, pas de surcoût par palier identifié — plus lisible que Scrapfly sur ce point, mais ratio crédits/page réussie contre Akamai `[NON VÉRIFIÉ]` | documenté (partiel) |
| A3 Couverture champs | Non applicable — produit générique | non applicable |
| A4 Couverture géo | Générique mondial ; proxies résidentiels/mobiles inclus dès l'entrée de gamme | documenté |
| A5 Latence | `[NON VÉRIFIÉ]` | — |
| A6 Débit/quota | 10 à 200 requêtes concurrentes selon plan (`[req 17]`) | documenté |
| A7 Stabilité technique | argumenté 3/5 — guide AS24 dédié publié (`[req 15]`), daté, revendique nommément le contournement Akamai | argumenté |
| A8 Résistance anti-bot | le fournisseur (revendique rotation d'empreintes TLS, d'en-têtes, de cookies, `[req 15]`) | argumenté |
| A9 Effort d'intégration | estimé 0,5-1 j | estimé |
| A10 Coût de maintenance | argumenté faible | argumenté |
| A11 Exposition juridique | 4/5 — identique à `C-23` | argumenté |
| A12 Autonomie | dépendant | documenté |
| A13 Plafond de volumétrie | `[NON VÉRIFIÉ]` | — |
| A14 Fraîcheur atteignable | à la demande | argumenté |

**Verdict : VIABLE SOUS CONDITION** techniquement — **le moins cher en tarif d'appel du lot**
(0,06 $/1000 crédits au palier le plus haut, sans multiplicateur anti-bot distinct identifié), mais
soumis au même blocage A11 qu'`C-23`.

### C-27 — Bright Data (Web Unlocker, datasets/autoscout24)

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Coût d'amorçage | Free : 5000 requêtes/mois, 0 € (`[req 26]`) | documenté |
| A2 Coût récurrent | Web Unlocker : 1,50 $/1000 requêtes PAYG (**« pay only for success »**), 1,30 $/1000 sur plan Scale 499 $/mois (`[req 26]`) → **≈ 1,38 € et 1,20 €/1000 pages**, sous le seuil `LOT-F` | documenté |
| A3 Couverture champs | Non applicable au produit générique ; pour la page `datasets/autoscout24` : **aucun schéma de champs publié**, l'offre est « tailored to your needs » (`[req 7]`) | documenté (absence) |
| A4 Couverture géo | Non spécifiée pour AS24 ; réseau proxy revendiqué « 195 pays » en général | documenté (partiel) |
| A5 Latence | `[NON VÉRIFIÉ]` | — |
| A6 Débit/quota | Fonction du plan | documenté |
| A7 Stabilité technique | argumenté 4/5 — acteur le plus établi du marché de l'unblocking, produit maintenu activement | argumenté |
| A8 Résistance anti-bot | Le fournisseur — revendique nommément Akamai Bot Manager : *« specifically built to handle sophisticated bot protection systems including Akamai Bot Manager »*, via *« browser fingerprint emulation, intelligent IP rotation, TLS fingerprint management, and behavioral mimicry »* (`[req 26]`). **Aucune SLA chiffrée publiée pour Akamai spécifiquement** — un taux « near 100% » est avancé pour le scraping en général, non garanti contractuellement | argumenté |
| A9 Effort d'intégration | estimé 0,5 j | estimé |
| A10 Coût de maintenance | argumenté faible — non-facturation des échecs limite le risque financier de la casse | argumenté |
| A11 Exposition juridique | 4/5 — identique aux autres | argumenté |
| A12 Autonomie | dépendant | documenté |
| A13 Plafond de volumétrie | `[NON VÉRIFIÉ]` | — |
| A14 Fraîcheur atteignable | à la demande | argumenté |

**Correction majeure sur la question falsifiable n°1 du mandat** (« Le dataset AS24 de Bright Data
existe comme produit livrable, avec un volume et un prix annoncés ») : **PARTIELLEMENT VRAIE, avec
une nuance qui inverse le sens de la correction `G2-K11` de `candidates-final.md`.** La page produit
`brightdata.com/products/datasets/autoscout24` **existe bien** et **porte une grille de prix**
(Free/PAYG 1,50 $ par 1000 « page loads »/Scale 499 $ par mois/Enterprise sur devis) — mais cette
grille est **strictement identique**, chiffre pour chiffre, à celle du produit générique **Web
Unlocker** (`[req 26]` vs `[req 7]`). **Ce n'est pas un jeu de données pré-constitué avec un volume
et une fraîcheur fixes annoncés à l'avance** : la page elle-même précise que la collecte est
*« custom-built per project »* et que la fraîcheur (« daily, weekly, monthly, or on any other
custom schedule ») ainsi que les champs (« define which data sources, fields, and insights you
need ») se **négocient au cas par cas**. Autrement dit : la page produit existe, le tarif générique
per-requête existe, mais **le volume, la fraîcheur exacte et le périmètre de champs ne sont pas
annoncés en catalogue** — c'est une façade marketing dédiée à AS24 au-dessus du service générique de
déblocage à la demande, pas un SKU de données prêt à l'emploi avec fiche technique fixe. Verdict :
**« volume et prix annoncés » est FAUX au sens strict** (le prix générique existe, le volume et la
fraîcheur restent `[NON VÉRIFIÉ]` avant devis) — nuance importante pour la phase 1.6, qui devra
corriger `G2-K11` dans ce sens plus restrictif.

**Verdict global : VIABLE SOUS CONDITION** techniquement, avec le meilleur rapport prix/garantie du
lot (non-facturation des échecs) et la seule revendication nommée d'Akamai Bot Manager retrouvée
dans ce lot — mais bloqué par le même A11 que les autres, et sans le confort d'un dataset AS24
réellement pré-livrable.

### C-28 — Fournisseurs entreprise (Oxylabs, Zyte, Decodo, Nimble, Infatica)

Instruits en bloc, un seul corpus de pages tarifaires et de politiques d'usage, conformément au
mandat.

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Coût d'amorçage | Oxylabs Web Unblocker : 1 Go d'essai sans CB (`[req 28]`). Zyte, Decodo, Nimble, Infatica : `[NON VÉRIFIÉ]` (pages d'essai non lues dans cette phase) | documenté (partiel) |
| A2 Coût récurrent | **Oxylabs Web Unblocker** (facturé au Go, « pay only for the successfully extracted data », `[req 28]`) : 5,64 $/Go (Micro, 8 Go) à 4,50 $/Go (Advanced, 88 Go) → converti à 0,44 Go/1000 pages : **≈ 2,29 € à 1,82 €/1000 pages**, dans la fourchette haute mais comparable à `LOT-F`. **Zyte** : Smart Proxy Manager revendique *« 7.9 billion successful requests with a 94.5% success rate every single month »* pour ses plus gros clients (`[req 36]`), mais **aucun tarif public retrouvé** dans cette phase. **Decodo, Nimble, Infatica** : `[NON VÉRIFIÉ]` (pages de tarification non atteintes/non lues) | documenté (partiel, Oxylabs seul chiffré) |
| A3-A7 | Génériques, non spécifiques à AS24 pour ces cinq fournisseurs (aucune page produit AS24 dédiée trouvée, contrairement à `C-23`/`C-26`/`C-27`) | documenté (absence) |
| A8 Résistance anti-bot | **Oxylabs Web Unblocker** revendique un traitement générique (« ML-driven proxy management », « dynamic browser fingerprinting ») **sans nommer Akamai explicitement** (`[req 28]`) — plus prudent dans sa communication que Bright Data. **Zyte** décrit une architecture générique de gestion de proxy/navigateur headless et une mise à jour de sa logique interne quand une cible change ses règles WAF, mais **aucune étude de cas ou taux de succès publié spécifiquement contre Akamai** n'a été trouvé (`[req 36]`) | argumenté |
| A9-A10 | `[NON VÉRIFIÉ]` pour les cinq, faute de page produit AS24 dédiée à instruire | — |
| A11 Exposition juridique | 4/5 pour les cinq, par le même raisonnement que la section Clause de conformité (aucun ne s'engage à exclure une cible robots-interdite, tous reportent la responsabilité sur le client) | argumenté |
| A12 Autonomie | dépendant, pour les cinq | documenté |
| A13-A14 | `[NON VÉRIFIÉ]` | — |

**Verdict : VIABLE SOUS CONDITION pour Oxylabs (chiffré) ; NON CLASSABLE (trop de cellules
`[NON VÉRIFIÉ]`, au-delà du seuil de 25 % du plan) pour Zyte, Decodo, Nimble et Infatica** dans le
budget documentaire de cette phase — ces quatre-là n'ont pas de page produit dédiée AS24 comme
`C-23`/`C-26`/`C-27`, ce qui explique le déséquilibre de preuve à l'intérieur même de ce bloc.
Aucun des cinq ne change le verdict A11 : le blocage contractuel côté AS24 leur est commun.

### C-36 — Web Unlocker / Unblocker managés

Non instruit comme fournisseur distinct : les deux produits de cette catégorie identifiés dans le
registre (Bright Data Web Unlocker, Oxylabs Web Unblocker) sont déjà couverts respectivement par
`C-27` et `C-28` ci-dessus — même mécanique (« le provider absorbe Akamai »), mêmes preuves,
mêmes verdicts. **Aucun troisième acteur distinct de cette catégorie n'a été identifié** dans le
budget de cette phase. Renvoi intégral aux fiches `C-27`/`C-28`.

---

## LOT-H candidats

### C-33 — Playwright/Puppeteer durci + proxies résidentiels BE

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Coût d'amorçage | 0 € logiciel (open source) ; coût d'infrastructure (serveur + proxy) dès le premier Go consommé | documenté |
| A2 Coût récurrent | Bande passante proxy seule : **2,84 à 3,40 €/1000 pages** au palier PAYG réaliste, jusqu'à 0,71-1,01 € en gros volume engagé (voir section Économie ci-dessus) — **avant CPU/RAM et taux d'échec**, non chiffrables sans test réel (R2/R3) | documenté avec réserve majeure |
| A3-A6 | Sans objet — dépend entièrement de ce que l'opérateur choisit d'extraire, aucun schéma imposé | non applicable |
| A7 Stabilité technique | argumenté 2/5 — la littérature technique consultée (`[req 34]`) signale que Chromium/Playwright standards portent des marqueurs d'automatisation détectables (propriété `navigator.webdriver`, empreinte TLS par défaut du client Chrome) « détectés en 2 lignes de JavaScript » sans durcissement supplémentaire ; un durcissement (patch de fingerprint, TLS impersonation via `curl_cffi`, en-têtes assortis) est nécessaire mais son efficacité se dégrade dans le temps à mesure qu'Akamai catalogue les signatures des outils open source popularisés | argumenté |
| A8 Résistance anti-bot | **KYCAR lui-même** — c'est la définition de la famille : aucun tiers n'absorbe le risque, contrairement à `LOT-G` | prouvé (par construction) |
| A9 Effort d'intégration | estimé élevé, plusieurs jours-semaines — la littérature consultée décrit une stratégie multi-couches nécessaire (client à empreinte TLS usurpée + proxy résidentiel rotatif + navigateur durci pour les défis JS), aucune couche seule n'étant suffisante (`[req 34]`) | estimé |
| A10 Coût de maintenance | argumenté élevé et continu — la même littérature signale l'apparition, en janvier 2026, d'un nouveau signal de détection (l'échange de clé post-quantique `X25519MLKEM768` désormais par défaut chez Chrome/Firefox/Safari, dont l'absence dans une requête prétendant émuler un navigateur récent est détectée par Akamai avant même le trafic HTTP) — signe d'une course à l'armement continue, pas d'un état stable | argumenté |
| A11 Exposition juridique | 4/5 — identique aux autres, avec en plus le fait que **l'opérateur assume seul** le risque, sans même le report contractuel partiel qu'offrent les CGU des fournisseurs `LOT-G` | argumenté |
| A12 Autonomie | **oui, seul candidat pleinement autonome techniquement** (aucun tiers ne peut couper l'accès), mais au prix d'une dépendance à un proxy résidentiel commercial pour l'IP | documenté |
| A13-A14 | `[NON VÉRIFIÉ]` sans test réel | — |

**Verdict : NON VIABLE en l'état pour AS24**, non pour un motif technique (les tests sont interdits
par le mandat, R2/R3), mais parce que (a) A11 reste bloquant indépendamment de la technique et
(b) l'économie estimée (section ci-dessus) place cette voie au-dessus du coût `LOT-F` au volume
réaliste d'un prototype, sans même compter l'effort d'ingénierie continu que la littérature
documente comme nécessaire face à un anti-bot qui évolue (post-quantum TLS, catalogage des
signatures d'outils open source).

### C-34 — Navigateurs anti-fingerprint natifs (Camoufox, patchright, undetected-chromedriver)

| Axe | Valeur | Preuve |
|---|---|---|
| A1-A2 | Identiques à `C-33` — même infrastructure de proxy résidentiel requise, seul le moteur de navigateur change | documenté (renvoi) |
| A7 Stabilité technique | argumenté 2/5 — la littérature consultée (`[req 33]`) qualifie Camoufox de *« most effective open-source solution »* pour le durcissement au niveau moteur (spoofing d'empreinte au niveau C++ plutôt que par patch JavaScript détectable), mais relève que **les outils open source sont publics et donc étudiables par Akamai** : une fois qu'une signature d'outil devient assez populaire pour être cataloguée, son efficacité se dégrade avec le temps. Une preuve isolée consultée (Camoufox + SeleniumBase contre une page Zalando protégée par Akamai) a réussi **depuis une IP résidentielle unique en exécution ponctuelle** ; le même auteur note que la même exécution à l'échelle, depuis un serveur, échouerait probablement pour des raisons de réputation d'IP et de limitation de débit — **preuve non généralisable, et de toute façon hors du périmètre AS24 de cette phase (cible tierce, Zalando)** | argumenté, preuve tierce non reproduite |
| A8 Résistance anti-bot | **KYCAR**, comme `C-33` — mais avec un plancher de départ plus favorable pour le franchissement JS/fingerprint selon la littérature, non testé ici | argumenté |
| A9-A14 | Identiques à `C-33` par construction (même famille, différence de moteur seulement) | documenté (renvoi) |

**Verdict : NON VIABLE en l'état pour AS24, pour le même motif qu'`C-33` (A11 bloquant, économie
défavorable)**, avec une nuance technique positive non déterminante : la littérature documentaire
crédite Camoufox d'un meilleur point de départ que Playwright/Puppeteer patché au niveau du
navigateur seul, sans que cela change ni le verdict juridique ni l'ordre de grandeur économique.
Non dominé par `C-33` au sens du registre (le durcissement au niveau moteur répond à une classe de
détection différente du patch par script), mais dominé par le même mur A11.

### C-37 — Solveurs auto-hébergés / `sensor_data` Akamai (FlareSolverr)

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Coût d'amorçage | 0 € logiciel, coût d'infrastructure d'hébergement (conteneur Docker) | documenté |
| A7-A8 Stabilité / résistance anti-bot | **Signal négatif net et de premier ordre** : le README du dépôt officiel (`[req 27]`) déclare explicitement que FlareSolverr *« is a proxy server to bypass Cloudflare and DDoS-GUARD protection »* — **Akamai n'est mentionné nulle part** dans sa propre documentation. Ce n'est pas un outil conçu pour Akamai, contrairement à Camoufox ou aux solutions durcies de `C-33`/`C-34`. Cohérent avec le motif déjà noté par le mandat du lot (« FlareSolverr mesuré à 0 % sur Cloudflare Enterprise ») : l'outil échoue déjà sur sa cible déclarée en configuration entreprise, et n'a jamais visé Akamai | prouvé (README, absence de mention) |
| A9-A14 | Sans objet — l'outil n'étant pas conçu pour Akamai, son dimensionnement pour ce cas d'usage n'a pas de sens à chiffrer | non applicable |

**Verdict : NON VIABLE.** Question falsifiable du mandat (« FlareSolverr est inopérant sur Akamai
comme il l'est sur Cloudflare Enterprise ») : **VRAIE, et pour une raison plus radicale que prévu**
— l'outil ne se présente même pas comme une solution Akamai. Son README ne cite que Cloudflare et
DDoS-GUARD ; utiliser FlareSolverr contre Akamai reviendrait à appliquer un outil hors de son
périmètre de conception documenté, sans aucune revendication, même marketing, à l'appui. Ce
candidat est le plus rapidement clos des trois du lot.

---

## Questions falsifiables

| # | Question | Verdict | Preuve |
|---|---|---|---|
| G1 | « Le dataset AS24 de Bright Data existe comme produit livrable, avec un volume et un prix annoncés. » | **PARTIELLEMENT VRAIE, plus restrictive que `G2-K11`** — la page produit et un tarif générique existent, mais le volume et la fraîcheur sont négociés au cas par cas (« custom-built per project »), pas annoncés en catalogue | `[req 7]` |
| G2 | « Au moins un fournisseur d'unblocking s'engage contractuellement sur une cible Akamai. » | **VRAIE pour Bright Data** — revendication nommée d'Akamai Bot Manager, avec modèle « pay only for success » ; Oxylabs communique de façon plus générique sans nommer Akamai | `[req 26]`, `[req 28]` |
| G3 | « Les CGU de ces fournisseurs excluent les cibles dont le `robots.txt` interdit le crawl. » | **FAUSSE pour les huit fournisseurs instruits** — voir section dédiée ci-dessus ; nuance : ce n'est pas la clause qui bloque AS24, c'est le contrat AS24 lui-même (`probe-LOT-K.md`) | `[req 2]`, `[req 6]`, `[req 13]`, `[req 14]`, `[req 18]`, `[req 21]`, `[req 23]` |
| G4 | « Le coût d'un snapshot BE quotidien par cette voie dépasse 100 €/mois. » | **VRAIE, et très largement** — au tarif le plus bas chiffré du lot (Bright Data Web Unlocker, 1,20-1,38 €/1000 pages) sur l'hypothèse défavorable de `LOT-F` (3 450 000 pages-équivalent/mois), le coût dépasse **4 100 €/mois** ; aucun candidat du lot n'approche 100 €/mois pour ce volume | Calcul à partir de `[req 26]`, méthode `probe-LOT-F.md` |
| H1 | « Un Chromium durci obtient un `_abck` valide sur une cible Akamai en moins de 10 s. » | **`[NON VÉRIFIÉ]` — aucun test exécuté (mandat documentaire)**. La littérature indique que le Chromium/ChromeDriver non durci est détecté « dès la première requête » ; aucune mesure de latence de contournement n'a été publiée par les sources consultées | `[req 34]` |
| H2 | « Camoufox réussit là où le Chromium patché échoue. » | **DOCUMENTÉ, non prouvé par test propre** — une preuve tierce isolée (cible Zalando, pas AS24) va dans ce sens mais l'auteur lui-même la qualifie de non généralisable à l'échelle | `[req 33]` |
| H3 | « FlareSolverr est inopérant sur Akamai comme il l'est sur Cloudflare Enterprise. » | **VRAIE, et plus radicale que prévu** — l'outil ne revendique même pas Akamai comme cible | `[req 27]` |
| H4 | « Le coût par 1000 pages rendues, proxies résidentiels inclus, dépasse celui de `LOT-F`. » | **VRAIE au volume réaliste (PAYG, non engagé)** ; seul un engagement de gros volume et long terme ramènerait la bande passante seule sous le seuil, sans compter le CPU, la maintenance et le taux d'échec — voir section Économie | `[req 30]`-`[req 32]`, méthode `probe-LOT-F.md` |

---

## ACTIONS-COMMANDITAIRE

Aucun compte n'a été créé, aucun essai gratuit n'a été démarré, aucune démarche commerciale n'a été
engagée dans cette phase (R2/E1).

| Fournisseur / candidat | Action proposée | Ce qu'elle permettrait | Carte bancaire ? |
|---|---|---|---|
| `C-23` Scrapfly | Utiliser les 1000 crédits gratuits contre une cible Akamai **non-AS24** en mode `asp=True` | Mesurer le multiplicateur de crédits réel du mode ASP, seule inconnue dimensionnante du candidat | Non requise (Free tier confirmé) |
| `C-27` Bright Data | Demander un devis explicite sur la page `datasets/autoscout24` | Lever l'ambiguïté volume/fraîcheur/périmètre laissée par la formule « tailored to your needs » — seul moyen de savoir si un vrai SKU de dataset existe derrière la page produit | `[NON VÉRIFIÉ]` — démarche de devis, pas un essai en libre-service |
| `C-28` Zyte, Decodo, Nimble, Infatica | Lire directement leurs pages de tarification et d'AUP (non atteintes dans le budget de cette phase) | Compléter le corpus de preuve du bloc, actuellement déséquilibré au profit d'Oxylabs | `[NON VÉRIFIÉ]` |
| `C-33`/`C-34` (LOT-H) | Test réel contre une cible Akamai **tierce, jamais AS24** (mandat original du lot, suspendu par la présente décision documentaire) | Mesurer A5 (latence de contournement), A7 (taux de succès réel), A9/A10 (effort réel) — actuellement tous `[NON VÉRIFIÉ]` par construction du mandat documentaire | Sans objet (test technique, pas un achat) |
| Toute voie `LOT-G`/`LOT-H` contre AutoScout24 | **Aucune action recommandée** | L'axe A11 (`probe-LOT-K.md`) bloque l'usage indépendamment de la technique ou du fournisseur choisi ; lever ce blocage exige une négociation contractuelle directe avec AS24 (`LOT-K`, `C-01`/`C-48`), pas un choix de fournisseur d'unblocking | — |

---

## Conformité

- **Aucun test de franchissement d'Akamai n'a été exécuté, sur aucune cible**, conformément à la
  décision du coordinateur citée en tête de document. Toutes les affirmations sur l'efficacité de
  Scrapfly/Scrape.do/Bright Data/Oxylabs contre Akamai, et sur Camoufox/undetected-chromedriver/
  FlareSolverr, sont des **citations de sources documentaires publiques** (pages produit, guides de
  blog, README, résultats de recherche), jamais une mesure produite par cette sonde.
- **Zéro requête vers `autoscout24.be`, `autoscout24.com`, ou tout sous-domaine AutoScout24** dans
  cette phase. Toutes les cibles du Journal de preuve sont des domaines de fournisseurs tiers
  (`scrapfly.io`, `brightdata.com`, `docs.brightdata.com`, `zyte.com`, `oxylabs.io`, `scrape.do`,
  `infatica.io`, `nimbleway.com`, `github.com`) ou des moteurs de recherche.
- **E1/R2** : aucun compte créé, aucun essai gratuit démarré, aucune démarche commerciale engagée.
  Les essais gratuits identifiés (Scrapfly, Scrape.do, Oxylabs Web Unblocker, Bright Data) sont
  reportés en `ACTIONS-COMMANDITAIRE`.
- **R3** (plafond 50 requêtes documentaires) : **respecté**. 27 `WebFetch` (dont 8 échecs HTTP 404
  par URL incorrecte, sans effet sur le compteur de cible AS24 puisqu'aucun n'a touché ce domaine)
  + 10 `WebSearch` recensés dans le Journal de preuve avant la section Économie, complétés par les
  `[req 30]`-`[req 36]` = **36 requêtes documentaires au total**, sous le plafond de 50.
- **R1** (zéro guessing) : chaque affirmation chiffrée porte sa source (`[req N]`) ; l'écart entre
  l'affirmation indexée « Nimble always respects robots.txt » et le texte réellement lu (`[req 23]`,
  `[req 24]`) est documenté explicitement plutôt que reporté tel quel — c'est un exemple concret du
  risque que ce mandat demandait de vérifier : les résumés de moteur de recherche attribuent parfois
  à une entreprise des formules qui, à la source, ne sont que des conseils génériques adressés à ses
  utilisateurs.
- Aucune violation constatée.
