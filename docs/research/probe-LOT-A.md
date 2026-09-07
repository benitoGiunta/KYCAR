# probe-LOT-A — Surface autorisée et endpoints AS24 publics non authentifiés

**Agent** : `probe-A`, phase 1.4 de `plans/PLAN-1-data-acquisition.md`
**Candidats instruits** : `C-14` (pages SEO autorisées), `C-58` (outil d'estimation),
`C-02` (Listing Creation API), `C-52` (`robots.txt` comme carte et référence de conformité)
**Date d'exécution** : 2026-09-07
**Budget de requêtes** : 60 maximum, temporisation ≥ 500 ms, journalisées une à une.

> **Méthode d'écriture** : ce document est écrit **au fur et à mesure de l'exécution**, section par
> section. L'ordre du document est l'ordre de lecture pour l'auditeur, pas l'ordre chronologique
> d'exécution ; le `Journal de preuve` porte l'horodatage réel de chaque sonde.

---

## Journal de preuve

Reproduction : toutes les sondes utilisent le même script, temporisation 600 ms avant chaque appel.

```bash
curl -sS -A 'Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)' \
     -D <headers> -o <body> --compressed --max-time 45 \
     -w '%{http_code}\t%{size_download}\t%{time_total}' "<URL>"
```

`size` = octets transférés (corps compressé, `Accept-Encoding` négocié) ; `latence` = `time_total`
en secondes, connexion incluse.

**52 requêtes émises sur un plafond de 60.** Toutes horodatées UTC, le 2026-09-07.
Colonne `taille` = octets transférés. Colonne `ms` = `time_total` de curl.

| # | heure UTC | URL | HTTP | taille | ms |
|---|---|---|---|---|---|
| 1 | 01:16:11 | `https://www.autoscout24.be/robots.txt` | **200** | 785 | 178 |
| 2 | 01:16:12 | `https://www.autoscout24.fr/robots.txt` | **200** | 649 | 257 |
| 3 | 01:16:13 | `https://www.autoscout24.de/robots.txt` | **200** | 945 | 175 |
| 4 | 01:16:14 | `https://www.autoscout24.nl/robots.txt` | **200** | 583 | 223 |
| 5 | 01:16:15 | `https://www.autoscout24.lu/robots.txt` | **200** | 518 | 169 |
| 6 | 01:17:48 | `https://www.autoscout24.be/fr/voiture/opel/opel-corsa/` | **200** | 84692 | 445 |
| 7 | 01:19:56 | `https://www.autoscout24.be/fr/voiture/opel/` | **200** | 81426 | 166 |
| 8 | 01:20:52 | `https://www.autoscout24.be/fr/voiture/opel/opel-speedster/` | **200** | 74894 | 342 |
| 9 | 01:20:54 | `https://www.autoscout24.be/fr/voiture/opel/opel-sintra/` | **200** | 55785 | 512 |
| 10 | 01:20:57 | `https://www.autoscout24.be/fr/voiture/opel/opel-signum/` | **200** | 61632 | 435 |
| 11 | 01:20:59 | `https://www.autoscout24.be/fr/voiture/opel/opel-omega/` | **200** | 70524 | 444 |
| 12 | 01:21:02 | `https://www.autoscout24.be/fr/voiture/opel/opel-calibra/` | **200** | 69737 | 430 |
| 13 | 01:21:04 | `https://www.autoscout24.be/fr/voiture/opel/opel-tigra/` | **200** | 78105 | 334 |
| 14 | 01:21:06 | `https://www.autoscout24.be/fr/voiture/opel/opel-frontera/` | **200** | 88255 | 166 |
| 15 | 01:21:08 | `https://www.autoscout24.be/fr/voiture/opel/opel-gt/` | **200** | 75630 | 152 |
| 16 | 01:21:10 | `https://www.autoscout24.be/fr/voiture/opel/opel-ampera/` | **200** | 62398 | 239 |
| 17 | 01:21:12 | `https://www.autoscout24.be/fr/voiture/opel/opel-agila/` | **200** | 81110 | 169 |
| 18 | 01:21:14 | `https://www.autoscout24.be/fr/voiture/opel/opel-karl/` | **200** | 86143 | 166 |
| 19 | 01:21:16 | `https://www.autoscout24.be/fr/voiture/opel/opel-cascada/` | **200** | 79303 | 146 |
| 20 | 01:22:26 | `https://www.autoscout24.be/fr/voiture/opel/opel-corsa/` | **200** | 84615 | 154 |
| 21 | 01:22:27 | `https://www.autoscout24.be/fr/voiture/opel/opel-corsa/?page=2` | **200** | 84615 | 160 |
| 22 | 01:22:28 | `https://www.autoscout24.be/fr/voiture/opel/opel-corsa/page/2/` | **404** | 4682 | 362 |
| 23 | 01:22:30 | `https://www.autoscout24.be/fr/voiture/opel/opel-corsa/?fuel=diesel&ft=D&sort=price` | **200** | 84979 | 135 |
| 24 | 01:23:21 | `https://www.autoscout24.be/fr/voiture/opel/opel-corsa/?kycar=1` | **200** | 84615 | 160 |
| 25 | 01:23:22 | `https://www.autoscout24.be/fr/voiture/opel/opel-corsa/?kycar=2` | **200** | 84615 | 162 |
| 26 | 01:23:24 | `https://www.autoscout24.be/fr/voiture/opel/opel-corsa/?kycar=3` | **200** | 84615 | 172 |
| 27 | 01:23:26 | `https://www.autoscout24.be/fr/voiture/opel/opel-corsa/?kycar=4` | **200** | 84624 | 408 |
| 28 | 01:23:28 | `https://www.autoscout24.be/fr/voiture/opel/opel-corsa/?kycar=5` | **200** | 84576 | 135 |
| 29 | 01:23:30 | `https://www.autoscout24.be/fr/voiture/opel/opel-corsa/?kycar=6` | **200** | 84693 | 130 |
| 30 | 01:23:32 | `https://www.autoscout24.be/fr/voiture/opel/opel-corsa/?kycar=7` | **200** | 84692 | 149 |
| 31 | 01:23:34 | `https://www.autoscout24.be/fr/voiture/opel/opel-corsa/?kycar=8` | **200** | 84577 | 102 |
| 32 | 01:24:02 | `https://www.autoscout24.be/fr/voiture/opel/?kycar=1` | **200** | 81671 | 169 |
| 33 | 01:24:04 | `https://www.autoscout24.be/fr/voiture/opel/?kycar=2` | **200** | 81671 | 123 |
| 34 | 01:24:05 | `https://www.autoscout24.be/fr/voiture/opel/?kycar=3` | **200** | 81638 | 122 |
| 35 | 01:24:07 | `https://www.autoscout24.be/fr/voiture/opel/?kycar=4` | **200** | 81192 | 164 |
| 36 | 01:24:09 | `https://www.autoscout24.be/fr/voiture/opel/opel-frontera/?kycar=1` | **200** | 88334 | 160 |
| 37 | 01:24:11 | `https://www.autoscout24.be/fr/voiture/opel/opel-frontera/?kycar=2` | **200** | 88318 | 390 |
| 38 | 01:24:12 | `https://www.autoscout24.be/fr/voiture/opel/opel-frontera/?kycar=3` | **200** | 88318 | 454 |
| 39 | 01:28:34 | `https://www.autoscout24.be/nl/auto/opel/opel-corsa/` | **200** | 83108 | 219 |
| 40 | 01:28:35 | `https://www.autoscout24.be/fr/voiture/` | **200** | 77876 | 177 |
| 41 | 01:28:38 | `https://www.autoscout24.be/fr/voiture/caracteristiques-techniques/opel/corsa/` | **200** | 75353 | 285 |
| 42 | 01:29:22 | `https://www.autoscout24.be/evaluationvoiture/` | **200** | 80482 | 262 |
| 43 | 01:29:24 | `https://www.autoscout24.be/prijsschatting/` | **200** | 79432 | 237 |
| 44 | 01:31:22 | `https://listing-creation.api.autoscout24.com/robots.txt` | **404** | 454 | 108 |
| 45 | 01:31:23 | `https://listing-creation.api.autoscout24.com/makes` | **200** | 118899 | 164 |
| 46 | 01:31:24 | `https://listing-creation.api.autoscout24.com/customers` | **401** | 0 | 77 |
| 47 | 01:31:25 | `https://listing-creation.api.autoscout24.com/seals` | **200** | 12239 | 91 |
| 48 | 01:31:26 | `https://listing-creation.api.autoscout24.com/statistics/1/listings` | **401** | 0 | 73 |
| 49 | 01:31:27 | `https://listing-creation.api.autoscout24.com/customers/1/listings` | **401** | 0 | 79 |
| 50 | 01:31:28 | `https://listing-creation.api.autoscout24.com/assets/openapi/spec.yml` | **200** | 40323 | 102 |
| 51 | 01:32:07 | `https://www.autoscout24.be/fr/voiture/opel/opel-corsa/?kycar=late1` | **200** | 84624 | 453 |
| 52 | 01:32:09 | `https://www.autoscout24.be/fr/voiture/opel/opel-corsa/` | **200** | 84979 | 129 |

**Synthèse** : 47 × `200`, 3 × `401` (endpoints authentifiés de `C-02`, attendu),
2 × `404` (tests négatifs volontaires : `robots.txt` de l'hôte d'API, et `…/page/2/`).
**Zéro `429`. Zéro cookie `_abck` ou `ak_bmsc` sur les 52 réponses.**
p50 = 169 ms, p90 = 435 ms, max = 512 ms. Fenêtre totale : 16 min 19 s.

---
## T1 — `robots.txt` des 5 TLD : la surface autorisée hors Belgique (`C-52`, question 5)

5 sondes, toutes HTTP 200, toutes sur `/robots.txt` — fichier de contrôle de crawl, jamais
lui-même soumis à une directive.

| TLD | HTTP | octets (décompressés) | latence | signature de version |
|---|---|---|---|---|
| `www.autoscout24.be` | 200 | 2 756 | 178 ms | `#MG, 20.08.2026` |
| `www.autoscout24.fr` | 200 | 2 103 | 257 ms | `#MG, 18.02.2026` |
| `www.autoscout24.de` | 200 | 2 912 | 175 ms | `#MG, 20.08.2026` |
| `www.autoscout24.nl` | 200 | 1 906 | 223 ms | `#MG, 20.08.2026` |
| `www.autoscout24.lu` | 200 | 1 591 | 169 ms | `#MG, 18.02.2026` |

### T1.1 — Le `robots.txt` belge est inchangé depuis le constat du 2026-09-06

2 756 octets, et le bloc `GPTBot / ClaudeBot / Google-Extended / Applebot-Extended / CCBot`
suivi des **17 directives `Allow`** est identique caractère pour caractère à ce que
`FINDING-allowed-surface.md` § 1 a relevé. La lecture de E5 sur laquelle repose tout ce lot est
donc **re-vérifiée le 2026-09-07**, et non reprise sur parole.

### T1.2 — Le **mécanisme** est identique sur les 5 TLD, la **surface** ne l'est pas

Les cinq fichiers portent, à l'identique, le même groupe multi-agents :

```
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: Google-Extended
User-agent: Applebot-Extended
User-agent: CCBot
Disallow: /
<liste de Allow:>
```

et dans les cinq cas la liste `Allow:` précède le `User-agent: *` suivant — donc elle appartient
au groupe qui nous concerne, exactement comme en Belgique. **La mécanique d'accès est portable
telle quelle sur les 5 pays.** Mais les préfixes eux-mêmes diffèrent en nombre et en libellé :

| TLD | nb `Allow` | Préfixe « catalogue voiture » | Préfixe « estimation de prix » | Préfixe « entreprise » |
|---|---|---|---|---|
| BE | **17** | `/fr/voiture/` **et** `/nl/auto/` | `/evaluationvoiture/`, `/prijsschatting/` | `/fr/entreprise/`, `/nl/onderneming/` |
| DE | **10** | `/auto/` (+ `/elektroauto/`, `/moto/`) | `/fahrzeugbewertung/` | `/unternehmen/` |
| NL | **8** | `/auto/` (+ `/moto/`) | `/waardebepaling/` | `/bedrijf/` |
| FR | **5** | `/voiture/` | `/evaluation-du-vehicule/` | **aucun** |
| LU | **4** | `/voiture/` | **aucun** | **aucun** |

Listes exhaustives relevées :

- **BE** (17) : `/fr/informer/`, `/fr/voiture/`, `/fr/conseiller-en-voitures/`, `/fr/vendre-voiture/`, `/fr/vendre-moto/`, `/fr/credit-auto/`, `/fr/entreprise/`, `/nl/informeren/`, `/nl/auto/`, `/nl/consulent-elektrische-auto/`, `/nl/auto-verkopen/`, `/nl/motor-verkopen/`, `/nl/financiering/`, `/nl/onderneming/`, `/evaluationvoiture/`, `/prijsschatting/` *(16 lignes distinctes ; le décompte de 17 de `FINDING-allowed-surface.md` compte les lignes 26 à 43 du fichier)*
- **DE** (10) : `/informieren/`, `/auto/`, `/elektroauto/`, `/auto-verkaufen/`, `/fahrzeugbewertung/`, `/moto/`, `/motorrad-verkaufen/`, `/leasing/`, `/finanzierung/`, `/unternehmen/`
- **NL** (8) : `/informeren/`, `/auto/`, `/consulent-elektrische-auto/`, `/auto-verkopen/`, `/waardebepaling/`, `/moto/`, `/motor-verkopen/`, `/bedrijf/`
- **FR** (5) : `/informer/`, `/voiture/`, `/vendre-voiture/`, `/evaluation-du-vehicule/`, `/vendre-moto/`
- **LU** (4) : `/informer/`, `/voiture/`, `/vendre-voiture/`, `/vendre-moto/`

**Conséquences opposables pour H1** :
1. Un adaptateur `DataProvider` multi-pays ne peut pas coder en dur `/fr/voiture/` : le préfixe est
   **une donnée de configuration par marketplace**, avec une forme sans segment de langue sur DE/NL/FR/LU
   et avec segment de langue sur BE.
2. Le candidat `C-58` (outil d'estimation) **n'existe pas sur la surface autorisée luxembourgeoise**
   et porte un chemin différent sur chacun des 4 autres TLD.
3. Le candidat `C-81` (CGU pro lues licitement) est **atteignable sur BE, DE et NL** (`/fr/entreprise/`,
   `/nl/onderneming/`, `/unternehmen/`, `/bedrijf/`) et **inatteignable licitement sur FR et LU**.
4. La Belgique est le TLD **le plus** ouvert des cinq en nombre de préfixes, et le seul bilingue :
   la surface belge n'est pas un cas dégradé, c'est le cas le plus favorable.

### T1.3 — Trouvaille latérale : le `robots.txt` allemand nomme une pagination

Dans le groupe `User-agent: *` du fichier **DE** figurent deux directives absentes des quatre autres :

```
Disallow: /modelle/page/
Disallow: /regional/page/
```

C'est la **preuve documentaire, écrite par l'éditeur, qu'un motif d'URL paginé `/…/page/` existe**
sur les surfaces de catalogue AS24 — et qu'il est interdit au crawl générique. Cela oriente le test
de pagination de la section T3 : le motif à essayer n'est pas seulement `?page=N` mais aussi
`…/page/N`. Le fichier DE porte également `Disallow: /auto-catalog/` et `Disallow: /*?*cat=*`,
et un groupe entier — absent des 4 autres TLD — qui autorise `/angebote/` (les pages d'offre)
aux **bots de prévisualisation sociale** (`facebookexternalhit`, `Twitterbot`, `LinkedInBot`,
`WhatsApp`, `Slackbot`, `Discordbot`, `TelegramBot`, `Pinterestbot`), alors que `/angebote/` est
`Disallow` pour `*`. Point à porter en A11 : l'éditeur discrimine explicitement par identité
d'agent déclarée, ce qui renforce la valeur juridique du `robots.txt` comme expression de volonté.

### T1.4 — Ce que les 5 fichiers confirment sur les endpoints internes

Les 7 endpoints internes interdits (`/listing-search-api/graphql`, `/ocs/api/graphql`,
`/search-subscriptions/api/new-results-count`, `/classified-list/react-listelements`,
`/as24-search-funnel/api/vip-showroom`, `/api/dealer-detail/direct-finance-api-query`,
`/as24-search-funnel/dealer-certification/`) sont `Disallow` pour `*` sur **les 5 TLD sans
exception**. Les candidats `C-09` à `C-13` restent donc documentaires sur l'intégralité du
périmètre H1, pas seulement en Belgique. De même, `/lst?` est `Disallow` sur BE, FR, DE, LU
(et sur NL il n'apparaît pas du tout, ce qui ne l'autorise pas davantage : le groupe `*` n'a pas
de `Allow` global et le chemin reste hors de notre groupe, lui-même en `Disallow: /`).

**Aucune directive `Sitemap:` sur aucun des 5 fichiers** — P6 de `FINDING-allowed-surface.md` est
étendu aux 5 pays.

---
## Verdict sur la représentativité de l'échantillon (limite P2, point ouvert O9)

**VERDICT : l'échantillon servi par la surface autorisée est BIAISÉ, le biais est causé par le
produit publicitaire, et il est massif. Le biais est mesuré, pas inféré. p < 10⁻²⁰.**

### V.0 — Ce qui a d'abord été corrigé dans le constat de départ

Deux affirmations de `FINDING-allowed-surface.md` sont **infirmées par mesure** avant même le test,
et il faut les corriger sous peine de fausser le raisonnement :

| Affirmation du constat | Mesure du 2026-09-07 | Correction |
|---|---|---|
| § 2.1 « `listingsCount` est un **agrégat par modèle**, exactement la granularité du mode 1 » | Sur `/fr/voiture/opel/`, `topModels` contient 32 modèles et **`listingsCount` vaut `0` pour les 32**, y compris Opel Corsa dont `totalItems` vaut 1 281 sur sa propre page. | **`listingsCount` est un champ inerte.** Il ne porte aucun agrégat. L'agrégat exploitable est **`listings.metadata.totalItems`**, et lui seul — ce qui coûte **une requête par segment**, et non une requête par marque. P3 du constat est vrai pour `totalItems`, faux pour `listingsCount`. |
| § 2.2 `priceInfo` illustré sur la page marque | Sur `/fr/voiture/opel/` **`priceInfo` est un tableau vide** ; il n'est peuplé que sur les pages **modèle**. | `priceInfo` est un agrégat **de niveau modèle**. Confirmé sur 13 pages modèle (voir V.6). |

### V.1 — Protocole

Le test est bâti sur une idée : **rendre le biais mesurable en trouvant des segments où
l'échantillonnage n'a pas lieu.** Une page modèle sert 20 annonces. Donc tout segment dont
`totalItems` est inférieur ou égal à 20 est servi **exhaustivement** : la page *est* la population.
Ces segments fournissent un **taux de base non biaisé** de `adProduct.tier` et de `seller.type`,
contre lequel les segments échantillonnés peuvent être testés. Aucune population de référence
externe n'est nécessaire — le biais est mesuré **contre la source elle-même**. C'est ce qui rend le
verdict indépendant de `LOT-Q` et de `LOT-I`.

Trois mesures indépendantes ont été conduites :

1. **Taux de base exhaustif** — 13 pages modèle Opel choisies pour leur rareté (`opel-speedster`,
   `opel-sintra`, `opel-signum`, `opel-omega`, `opel-calibra`, `opel-tigra`, `opel-gt`,
   `opel-ampera`) ou leur volume intermédiaire (`opel-frontera`, `opel-agila`, `opel-karl`,
   `opel-cascada`), plus `opel-corsa` et la page marque `opel`. **6 segments** se sont révélés
   exhaustifs (annonces servies = `totalItems`), soit **48 annonces de population complète**.
2. **Relation dose-réponse** — le taux d'échantillonnage varie de 0,39 % (marque, 5 179 annonces)
   à 100 % (segments exhaustifs). Si le biais vient de la sélection, sa force doit **croître quand
   le taux d'échantillonnage décroît**. C'est une prédiction falsifiable, testée sur **6 segments
   échantillonnés indépendants**.
3. **Capture-recapture sur le vivier accessible** — rappel de la **même URL** avec un paramètre de
   requête fonctionnellement inerte (`?kycar=1…8`), qui change la clé de cache CDN et force un
   nouveau rendu, donc un **nouveau tirage**. 11 tirages sur Opel Corsa, 5 sur la marque Opel,
   4 sur Frontera. Estimateur de richesse **Chao1** appliqué à l'histogramme de recapture.

### V.2 — Mesure 1 : le taux de base exhaustif

| Segment | `totalItems` | servies | statut | `adProduct.tier` | `seller.type` |
|---|---|---|---|---|---|
| `opel-calibra` | 1 | 1 | **exhaustif** | T10 x1 | Private x1 |
| `opel-omega` | 1 | 1 | **exhaustif** | T10 x1 | Private x1 |
| `opel-signum` | 1 | 1 | **exhaustif** | T10 x1 | Private x1 |
| `opel-gt` | 12 | 12 | **exhaustif** | T10 x12 | Private x8, Dealer x4 |
| `opel-speedster` | 13 | 13 | **exhaustif** | T10 x12, T50 x1 | Dealer x10, Private x3 |
| `opel-tigra` | 20 | 20 | **exhaustif** | T10 x20 | Private x19, Dealer x1 |
| `opel-sintra` | 0 | 0 | vide | — | — |
| `opel-ampera` | 0 | 0 | vide | — | — |
| **Total population complète** | **48** | **48** | — | **T10 47 (97,9 %) / T50 1 (2,1 %)** | **Private 33 (68,8 %) / Dealer 15 (31,2 %)** |

**Taux de base, mesuré sur population complète : `T50` = 2,1 %, vendeur professionnel = 31,2 %.**

Ces 6 segments sont des modèles anciens ou de niche, donc ce taux de base est **conservateur pour
la conclusion mais discutable pour son niveau** : un concessionnaire achète moins volontiers un
produit publicitaire premium pour une Opel Omega. La mesure 2 lève exactement cette réserve, parce
qu'elle n'utilise **aucun** taux de base externe.

### V.3 — Mesure 2 : la relation dose-réponse. C'est la mesure décisive.

6 segments échantillonnés, classés par taux d'échantillonnage décroissant. Les parts sont mesurées
sur les 20 annonces servies au **premier** tirage de chaque segment.

| Segment | `totalItems` | taux d'échantillonnage (20/total) | part `T50` servie | part `Dealer` servie |
|---|---|---|---|---|
| `opel-cascada` | 29 | **69,0 %** | **5 %** (1/20) | **50 %** (10/20) |
| `opel-agila` | 46 | 43,5 % | **0 %** (0/20) | 15 % (3/20) |
| `opel-karl` | 52 | 38,5 % | **10 %** (2/20) | **70 %** (14/20) |
| `opel-frontera` | 128 | 15,6 % | **60 %** (12/20, plus 1 T40) | **90 %** (18/20) |
| `opel-corsa` | 1 281 | 1,6 % | **90 %** (18/20) | **100 %** (20/20) |
| `opel` (marque) | 5 179 | 0,39 % | **95 %** (19/20) | **100 %** (20/20) |
| *segments exhaustifs* | *48* | *100 %* | *2,1 %* | *31,2 %* |

**La part de `T50` servie est une fonction monotone décroissante du taux d'échantillonnage sur
5 des 6 segments, et la part de `Dealer` sur 5 des 6.** Le rangement va de 5 % à 95 % de T50 quand
le taux d'échantillonnage passe de 69 % à 0,39 %. Un échantillonnage aléatoire simple produirait
une part de T50 **indépendante** du taux d'échantillonnage — c'est précisément la prédiction que la
mesure réfute.

**Le seul écart apparent, `opel-agila`, confirme le mécanisme au lieu de le contredire.** Ses
20 annonces servies sont **toutes T10** : ce segment ne contient **aucune** annonce T50. Il n'y a
donc rien à promouvoir, et la sélection retombe sur un ordre secondaire — d'où 15 % de Dealer, en
dessous même du taux de base. `agila` est le **témoin négatif** du test : là où le produit
publicitaire est absent de la population, le biais disparaît.

Le mécanisme que ces 7 lignes déterminent, sans ambiguïté :

> **La page catalogue ne tire pas 20 annonces au hasard. Elle sert d'abord les annonces portant un
> produit publicitaire élevé, puis complète avec du T10 quand le vivier promu est épuisé.** Le biais
> n'est pas un artefact statistique : c'est le comportement nominal d'un produit publicitaire, et il
> est d'autant plus fort que le segment est gros — c'est-à-dire exactement dans les segments qui
> intéressent le mode 2 de KYCAR.

### V.4 — Mesure 3 : capture-recapture — le vivier accessible est un plafond dur

Rappel de la même URL avec paramètre inerte. Croissance de l'union des identifiants :

**`/fr/voiture/opel/opel-corsa/` — `totalItems` = 1 281**

| tirage | nouvelles annonces | union cumulée |
|---|---|---|
| 1 (`t0`) | +20 | 20 |
| 2 (`t0 + ~7 min`) | +5 | 25 |
| 3 (`?fuel=…&ft=…&sort=…`) | +0 | 25 |
| 4 à 11 (`?kycar=1…8`) | +0 chacun | **25** |

Histogramme de recapture sur 11 tirages : `{vu 6 fois : 5, 7 fois : 1, 8 fois : 5, 9 fois : 4,
10 fois : 3, 11 fois : 7}`. **f1 = 0 et f2 = 0** — aucune annonce n'a été vue une seule ou deux
fois. L'estimateur **Chao1** vaut donc `S_obs + f1²/(2·f2) = 25 + 0 =` **25,0** : le nombre
d'annonces non observées est estimé à **zéro**. Le vivier n'est pas sous-échantillonné, il est
**épuisé**.

| Segment | `totalItems` | tirages | vivier accessible | **part du segment atteignable** | composition du vivier |
|---|---|---|---|---|---|
| `opel-corsa` | 1 281 | 11 | **25** (saturé, Chao1 = 25,0) | **1,95 %** | T50 23 / T10 2 ; **Dealer 25/25** |
| `opel-frontera` | 127 | 4 | **23** (saturé au 4ᵉ tirage) | 18,1 % | T50 13 / T40 1 / T10 9 ; Dealer 21, Private 2 |
| `opel` (marque) | 5 179 | 5 | **34** (encore croissant : +5 au 5ᵉ) | **0,66 %** | T50 33 / T10 1 ; **Dealer 34/34** |

**Le plafond n'est donc pas 20 annonces par modèle : il est d'environ 25**, atteignables en 2 à
4 tirages au lieu d'un seul, au prix d'un simple paramètre de requête. C'est une amélioration réelle
de 25 % du plafond — et elle **ne corrige rien** du biais : le vivier de 25 est à **92 % T50** et
**100 % professionnel**.

### V.5 — Signification statistique

Test binomial sur le vivier Corsa saturé (23 T50 sur 25), sous H0 « tirage aléatoire simple dans
les 1 281 annonces, part de T50 dans la population égale à p » :

| p supposé (part de T50 en population) | origine de l'hypothèse | probabilité d'observer 23 T50 ou plus sur 25 |
|---|---|---|
| 2,1 % | taux de base exhaustif mesuré (V.2) | **7,4 x 10⁻³⁷** |
| 10 % | borne haute déduite de Frontera (12 T50 dans une population de 128) | **2,5 x 10⁻²¹** |
| 30 % | hypothèse volontairement défavorable au constat | **1,4 x 10⁻¹⁰** |
| 50 % | hypothèse absurdement défavorable | **9,7 x 10⁻⁶** |

**H0 est rejetée à tous les niveaux d'hypothèse, y compris absurdes.** Le résultat ne dépend donc
pas de l'estimation du taux de base — c'est le point qui rend le verdict opposable en 1.5.

Deuxième axe, indépendant du premier — la nature du vendeur, 25 professionnels sur 25 :

| p supposé (part de professionnels) | origine | probabilité d'observer 25/25 |
|---|---|---|
| 31,2 % | taux de base exhaustif (V.2) | 2,4 x 10⁻¹³ |
| 50 % | mesuré sur `cascada`, segment échantillonné à 69 % | 3,0 x 10⁻⁸ |
| 80 % | hypothèse défavorable | 3,8 x 10⁻³ |
| 90 % | hypothèse très défavorable | 7,2 x 10⁻² *(non significatif seul)* |

Sur la marque Opel, 34 professionnels sur 34 : même sous p = 90 %, la probabilité vaut
2,8 x 10⁻². La conclusion sur l'axe vendeur est **solide jusqu'à p = 80 % et fragile au-delà** — je
la porte donc comme `ÉTABLIE` et non comme `ÉCRASANTE`, contrairement à l'axe `tier`.

### V.6 — L'effet sur ce que KYCAR afficherait : la troncature du bas de marché

C'est la conséquence produit, et elle est chiffrable **sans référence externe**, en confrontant le
vivier accessible à `priceInfo.buyingUsed.minPrice` — un agrégat que la page calcule sur la
population et non sur l'échantillon. Vérification préalable que cet agrégat est bien de niveau
modèle et non un habillage : sur les segments exhaustifs il colle au minimum réel
(`opel-gt` 7 500 € annoncés contre 7 500 € observés ; `opel-signum` 2 000 contre 2 000 ;
`opel-tigra` 357 contre 350), avec un écart sur les segments à une seule annonce
(`opel-calibra` 2 117 € annoncés contre 4 000 € observés) qui montre qu'il n'est **pas** strictement
le minimum des annonces vivantes. C'est un **ancrage de population, pas un étalon exact** — et cela
suffit pour l'ordre de grandeur.

| Segment | `priceInfo.buyingUsed` (population) | **minimum du vivier accessible** | facteur de troncature |
|---|---|---|---|
| `opel-corsa` (1 281) | **119 €** | **3 250 €** | **x 27,3** |
| `opel-frontera` (127) | **2 862 €** | **19 789 €** | **x 6,9** |
| `opel-karl` (52) | 3 384 € | 3 999 € | x 1,2 |
| `opel-agila` (46) | 366 € | 550 € | x 1,5 |
| `opel-cascada` (29) | 4 896 € | 4 500 € | x 0,9 *(pas de troncature)* |

**La troncature suit la même dose-réponse que le biais de `tier`.** Sur les gros segments, tout le
bas de marché est invisible. Distribution du vivier Corsa (n = 25) :

```
prix   min 3 250   p25 8 999    médiane 12 490   p75 14 995   max 19 650    moyenne 11 540 €
km     min 10      p25 16 500   médiane 46 108   p75 81 000   max 225 000   moyenne 59 027 km
année  min 2008    p25 2019     médiane 2022     p75 2025     max 2026
années présentes : 2008, 2011, 2013, 2014, 2017, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026
```

Une KYCAR alimentée par cette voie annoncerait pour l'Opel Corsa en Belgique **un marché qui
commence à 3 250 € et dont la médiane est à 12 490 €**, alors que la source dit elle-même que le
marché commence à 119 €. Pour la Frontera, elle annoncerait un marché commençant à **19 789 €**
quand la source dit **2 862 €** : la sous-population des Frontera d'ancienne génération est
**intégralement absente**. C'est exactement le mode de défaillance que le mandat désigne — faux, et
faux de façon crédible.

### V.7 — Rotation temporelle : elle existe, elle est faible, et elle ne sauve rien

| Échelle | Mesure | Résultat |
|---|---|---|
| **1 s**, clé de cache identique | `corsa_ctl` (01:22:26) contre `corsa_p2` (01:22:27) | **identiques**, 20/20, même ordre — le tirage est mémorisé (`x-nextjs-cache: HIT`) |
| **4 s**, clé de cache distincte | `corsa_ctl` contre `corsa_ft` (01:22:30) | **différents** — une clé de cache neuve provoque un rendu neuf, donc un nouveau tirage |
| **4 min 38 s** | `corsa_fr_1` (01:17:48, `MISS`) contre `corsa_ctl` (01:22:26, `STALE`) | recouvrement **15/20**, soit **5 annonces nouvelles** → deux générations de rendu circulent, dont l'union fait 25 |
| **6 à 14 min**, 10 rendus dont **3 `MISS` francs** (`cr_4`, `late_a`) | 8 tirages `?kycar=1…8` + `late_a` + `late_b` | **+0 annonce nouvelle**. Un rendu **frais** reproduit le même vivier de 25 : le plafond est **une règle de sélection du backend**, pas un hasard de cache. |
| **locale `nl-BE`** (`/nl/auto/opel/opel-corsa/`, `totalItems` 1 282) | contre l'union `fr-BE` de 25 | recouvrement **14/20**, soit **6 annonces nouvelles** → **union bilingue = 31 annonces, 2,42 % des 1 281**. La seconde langue est une voie de rendu distincte et élargit le vivier de 24 %. |
| **~24 h** | l'annonce d'un vendeur professionnel (« vendeur-α », nom anonymisé), relevée le 2026-09-06 par `FINDING-allowed-surface.md` sur `/fr/voiture/opel/`, est **toujours servie** le 2026-09-07, passée de la position 0 à la position 1 | rotation **partielle** : l'ordre bouge, la composition persiste |

La rotation observée relève du **ré-ordonnancement, pas du ré-échantillonnage**.
Le mandat propose de rappeler la même URL à plusieurs heures d'intervalle pour voir si l'échantillon
tourne. **La fenêtre réellement couverte par cette sonde est de 14 min 19 s** (01:17:48 → 01:32:09),
et sur cette fenêtre le verdict est net : 5 annonces nouvelles dans les 5 premières minutes, puis
**zéro** sur les 10 suivantes, y compris sur des rendus frais. L'hypothèse « la rotation permet de
reconstruire la population » est donc **infirmée à l'échelle du quart d'heure** et **non tranchée à
l'échelle du jour et de la semaine** — le seul indice à 24 h (persistance du vendeur relevé la
veille) suggère une persistance, pas un renouvellement. Ce qu'il faudrait pour trancher
définitivement est nommé en `ACTIONS-COMMANDITAIRE` (A-6), et c'est une mesure hors d'atteinte d'un
agent à session unique : elle exige un échantillonnage de la même URL sur 7 jours, ce qui n'est ni
une recherche ni une inférence mais une **série temporelle** à collecter.

### V.8 — Ce que ce verdict décide pour le produit

| Usage KYCAR | Verdict |
|---|---|
| **Mode 1 — comptages par marque/modèle** (`totalItems`) | **UTILISABLE.** `totalItems` est exhaustif par construction et stable : dispersion mesurée de 1 sur 1 281 au niveau modèle, de 42 sur 5 179 au niveau marque (0,8 %), imputable à l'âge des générations de cache. Le biais de sélection **ne touche pas** ce champ. |
| **Mode 1 — fourchettes de prix** (`priceInfo`) | **UTILISABLE POUR LE MINIMUM SEUL.** `priceInfo` ne donne que des minima, de niveau modèle, et n'est pas exactement le minimum des annonces vivantes. Aucun maximum, aucun quantile. |
| **Mode 2 — distributions prix x km x année** | **INUTILISABLE EN L'ÉTAT.** 1,95 % de la population, biaisée vers le produit publicitaire (p < 10⁻²⁰), 100 % professionnelle, bas de marché tronqué d'un facteur 27. Toute distribution, tout percentile, toute détection d'*outlier* construits là-dessus seraient faux — et crédibles. |
| **Mode 2 — détection d'opportunités et d'outliers** | **DANGEREUX.** Le vivier est constitué des annonces que le vendeur a **payé** pour promouvoir. Chercher la bonne affaire dans l'ensemble des annonces sponsorisées est un anti-usage. |

**Recommandation opposable** : l'adaptateur `DataProvider` bâti sur `C-14` doit exposer `totalItems`
et `priceInfo` comme **agrégats de confiance**, et marquer toute annonce individuelle issue de cette
voie d'un drapeau `sample_biased = true` porté jusqu'à l'affichage. Le mode 2 ne doit pas être
alimenté par cette voie sans une source d'appoint non biaisée.

---
## T2 — Structure de la surface autorisée (`C-14`)

### T2.1 — Trois niveaux de page, un seul porte des annonces

| Niveau | URL sondée | `__NEXT_DATA__` | `listings.metadata.totalItems` | annonces servies |
|---|---|---|---|---|
| racine catalogue | `/fr/voiture/` | 114 471 o | **121 710** | 20 |
| marque | `/fr/voiture/opel/` | 122 302 o | 5 179 – 5 221 | 20 |
| modèle | `/fr/voiture/opel/opel-corsa/` | 122 782 o | 1 281 | 20 |
| caractéristiques techniques | `/fr/voiture/caracteristiques-techniques/opel/corsa/` | **323 080 o** | *(absent)* | **0** |

`buildId` = `auto-catalog-pages_main-4062-1` — les pages catalogue sont servies par une application
Next.js distincte, nommée `auto-catalog-pages`. La page de caractéristiques techniques est une
**autre** application (`pageType`, `modelGenerations`, `priceButtons` ; aucun `listings`).

**`/fr/voiture/` donne l'inventaire national total en une requête : `totalItems` = 121 710.**
C'est une mesure directe de H5 (`00-CONTEXT.md` postule 10⁴–10⁶) : **H5 est confirmée, et le
volume réel se situe à 1,2 × 10⁵**. C'est aussi une correction du chiffre de ~115 000 utilisé comme
référence dans `candidates-final.md` (`C-86`).

### T2.2 — Ce que la page modèle porte réellement (correction du dictionnaire)

Les annonces ne sont **pas** à plat sous `listings.listings[i]` : elles sont sous
`listings.listings[i].details.*`. Le décompte exact des feuilles JSON d'une annonce est de
**40 champs**, ce qui valide le chiffre de `FINDING-allowed-surface.md`, mais le chemin d'accès y est
faux. Arborescence réelle, exhaustive :

```
id
details.location.{countryCode, zip, city}
details.webPage
details.prices.public.{taxDeductible, onRequestOnly}
details.prices.public.amountInEUR.{formatted, raw}
details.prices.public.evaluation.category
details.adProduct.{tier, appliedTier}
details.vehicle.classification.{make.formatted, model.formatted, modelYear, modelVersionInput, type}
details.vehicle.engine.power.{kw.raw, hp.raw}
details.vehicle.fuels.primary.source
details.vehicle.fuels.primary.consumption.combinedWithFallback.{formatted, isFallback}
details.vehicle.fuels.primary.co2emissionInGramPerKmWithFallback.{formatted, isFallback}
details.vehicle.fuels.fuelCategory.{formatted, raw}
details.vehicle.condition.firstRegistrationDate.formatted
details.vehicle.condition.mileageInKm.{formatted, raw}
details.vehicle.condition.numberOfPreviousOwnersExtended.{raw, formatted}
details.vehicle.usageState
details.seller.{id, contactName, companyName, type}
details.media.images
details.superDeal
details.publication.{accurateState, isNew}
```

**Deux champs non signalés par le constat de départ** :
- **`details.adProduct.appliedTier`** en plus de `tier`. Sur les 200+ annonces observées, les deux
  valeurs sont **toujours égales**. Valeurs relevées : `T10`, `T40`, `T50`.
- **`details.prices.public.evaluation.category`** prend les valeurs entières `1`, `2`, `3` observées.
  La spec OpenAPI de `C-02` (§ T6) établit que cet entier est un identifiant du référentiel
  **`PriceLabel`**, qui compte 6 valeurs. **C'est l'évaluation de prix d'AutoScout24, servie
  gratuitement sur la surface autorisée, pour chaque annonce.** Signal analytique de premier ordre
  pour le mode 2 — et le lien direct entre `C-14` et `C-58`.

**Limite mesurée non signalée** : `details.media.images` est **tronqué à 5 éléments** sur toutes les
annonces observées sauf une (1 image). Ce n'est pas le nombre réel de photos de l'annonce.

### T2.3 — La page de caractéristiques techniques : le niveau génération/version, sur un chemin autorisé

`/fr/voiture/caracteristiques-techniques/opel/corsa/` est sous le préfixe `Allow: /fr/voiture/`.
Elle rend **323 Ko de `__NEXT_DATA__`** et porte `modelGenerations` :

- **17 générations** pour la seule Opel Corsa, avec `generationId`, `generationName`, `yearStart`,
  `yearEnd`, `modelLineName`, `modelLineId`.
- **270 `modelVersions`** au total sur la page, chacune avec `modelVersionName`,
  `modelVersionSlug`, `yearStart`, `yearEnd` et un bloc `specs` structuré.

Exemple relevé, génération `CORSA - 2020` (`generationId` 12137, 2019–2023, 24 versions) :

```json
{"makeName":"Opel","modelVersionName":"Corsa 1.2 Turbo Blitz Limited Edition S/S",
 "modelVersionSlug":"corsa-1-2-turbo-blitz-limited-edition-s-s-berline-essence-sans-plomb-12137",
 "yearStart":2019,"yearEnd":2023,
 "specs":[{"consumption":{"fuelLabel":"Essence","fuelId":"B","consFuelTotal":4.3,"consFuelUnit":"l/100km"},
           "dimensions":{"bodyLabel":"Berline","bodyId":6,"doors":5,"length":4060,"height":1433,"width":1765,"seats":5},
           "engineAndPower":{"hp":100,"kw":74}}]}
```

**Cette page lève deux limites établies de `AS24-REFERENCE-API.md`** :
- **L4** (« pas de niveau génération/version : la taxonomie s'arrête au modèle ») — infirmée.
  Le niveau génération **et** le niveau version sont publics, sur un chemin autorisé, avec
  identifiants et années de production.
- **L3** (« pas de slugs d'URL ») — levée pour la marque, le modèle et la version :
  `makeSlug`, `modelSlug`, `modelVersionSlug` sont servis. Combiné à `topModels[].slug` de la page
  marque, cela clôt le point ouvert O5 pour tout modèle atteignable par cette voie.

C'est l'apport le plus **inattendu** de ce lot : un référentiel de variantes que l'API officielle de
référence (`C-02`) ne contient pas, sur une surface licite et gratuite.

### T2.4 — La grammaire du moteur de recherche, lisible sans jamais l'interroger

`listPageInfo` et `interlinking.lstLinkGroups` contiennent les URL et les paramètres du moteur de
recherche interdit `/fr/lst/…`. Ces valeurs sont **lues dans un document autorisé** ; aucune requête
n'a été émise vers ces cibles.

| Élément | Exemple relevé |
|---|---|
| paramètre pays | `cy=B` |
| type de vendeur | `custtype=D` |
| tri | `sort=price` |
| segment état | `/ot_neuf`, `/ot_occasion`, `/ot_voiture-de-demonstration` |
| carrosserie | `/bt_citadine` |
| carburant | `/ft_essence`, `/ft_diesel`, `/ft_electrique-essence` |
| couleur | `/bc_gris`, `/bc_noir`, `/bc_blanc` |
| géographie | `/cit_bruxelles` + `zip=bruxelles&zipr=50&lat=50.84553&lon=4.3557` |
| indexabilité | `isIndexable`, `satisfiesListingCountThreshold` (booléens portés par lien) |

**Ceci sert directement `REF-filters.md` et la limite L7 de `AS24-REFERENCE-API.md`** (« les codes de
paramètres d'URL du moteur de recherche public doivent venir d'ailleurs, donc avec un niveau de
preuve inférieur »). Ils ne viennent plus d'ailleurs : ils viennent d'AutoScout24, sur un chemin
autorisé. **L7 est partiellement levée, avec un niveau de preuve `prouvé`.**

**Point négatif décisif pour le mode 2** : *tous* les liens de sous-segment (carburant, carrosserie,
couleur, ville, état) pointent vers `/fr/lst/…`, chemin **hors surface autorisée**. Il n'existe
**aucune page de sous-segment sous `/fr/voiture/`**. Par conséquent, la stratégie qui consisterait à
reconstruire une distribution par dichotomie sur des `totalItems` de sous-segments — la mécanique de
`C-12` — **n'est pas exécutable sur la surface autorisée**. L'exhaustivité des agrégats s'arrête à
la maille **modèle**.

### T2.5 — Volatilité mesurée des agrégats

| Segment | valeurs de `totalItems` relevées dans la session | dispersion |
|---|---|---|
| `opel-corsa` | 1 281 ×10, 1 280 ×2 | **1 sur 1 281 (0,08 %)** |
| `opel-frontera` | 128, 127, 127, 127 | 1 sur 128 (0,8 %) |
| `opel` (marque) | 5 221, 5 185, 5 182, 5 182, 5 179 | **42 sur 5 179 (0,81 %)** |
| `/fr/voiture/` (BE) | 121 710 | 1 mesure |

Le 5 221 est la valeur du premier appel (`x-nextjs-cache: STALE`, donc génération de cache plus
ancienne) ; les valeurs basses viennent de rendus plus récents. La dispersion mesure donc **l'âge
des générations de cache**, pas du bruit d'agrégation. `totalItems` est **fiable à 1 % près** et
utilisable comme agrégat de production, à condition d'accepter une fraîcheur de l'ordre du quart
d'heure. Note pour `LOT-Q` : la valeur relevée le 2026-09-06 par `FINDING-allowed-surface.md` était
5 220 pour Opel ; en 24 h l'agrégat reste dans une bande de 1 %.

---

## T3 — Test de pagination : la surface autorisée n'en offre aucune (`C-14`, question 2)

4 sondes, protocole avec témoin pour neutraliser la rotation. Base :
`/fr/voiture/opel/opel-corsa/`.

| Sonde | URL | HTTP | octets transférés | annonces | verdict |
|---|---|---|---|---|---|
| témoin | `…/opel-corsa/` | 200 | 84 615 | 20 | référence |
| pagination par requête | `…/opel-corsa/?page=2` | 200 | **84 615** — identique à l'octet | 20, **mêmes identifiants, même ordre** que le témoin | **inerte** |
| pagination par chemin | `…/opel-corsa/page/2/` | **404** | 4 682 | — | **inexistante** |
| tri + filtre | `…/opel-corsa/?fuel=diesel&ft=D&sort=price` | 200 | 84 979 | 20, dont 15 diesel absents et aucun tri par prix | **inerte** |

**Preuve mécanique, et non seulement comportementale** : `__NEXT_DATA__.query` vaut
`{"slugs":["voiture","opel","opel-corsa"]}` sur **les quatre** sondes. La route est un
`[...slugs]` attrape-tout : **les paramètres de requête ne parviennent pas au rendu**. Ce n'est pas
un paramètre mal nommé qu'il faudrait deviner — c'est un contrat de route qui n'accepte aucun
paramètre. Le motif `…/page/N` suggéré par la directive `Disallow: /modelle/page/` du `robots.txt`
allemand (§ T1.3) rend **404** en Belgique.

**Verdict** : la surface autorisée **n'offre aucune pagination, aucun tri, aucun filtrage**.
Le plafond est **structurel**.

**Nuance mesurée, et elle est opérationnellement importante** : le paramètre est inerte pour le
*rendu* mais **pas pour la clé de cache du CDN**. `?kycar=1` déclenche un rendu neuf, donc un
nouveau tirage (§ V.4). Le plafond réel n'est donc pas 20 mais **le vivier de ~25 annonces par
segment** (31 en cumulant les deux langues), atteignable en 2 à 4 rappels. Ce n'est pas de la
pagination : c'est de la **rejouabilité d'un tirage**, et elle sature.

---

## T4 — Test de débit et d'anti-bot (`C-14`, limite P5, question 3)

52 requêtes émises sur 16 min 19 s (01:16:11Z → 01:32:09Z), temporisation 600 ms avant chaque
appel, agent déclaré `ClaudeBot`, aucune rotation d'IP, aucune rotation d'agent.

| Mesure | Résultat |
|---|---|
| requêtes totales | **52** |
| codes | **47 × 200**, 3 × 401 *(attendus, endpoints authentifiés de `C-02`)*, 2 × 404 *(tests négatifs volontaires)* |
| **429** | **0** |
| **latence p50** | **169 ms** |
| latence p90 | 435 ms |
| latence max | 512 ms |
| latence min | 73 ms |
| taille moyenne d'une page catalogue | **78 489 octets transférés** (gzip) — 38 pages |
| dégradation de latence sur la durée | **aucune observée** |

### T4.1 — L'anti-bot : la surface autorisée n'est pas derrière Akamai

Aucune trace d'Akamai sur aucune des 52 réponses.

| Indicateur cherché | Résultat |
|---|---|
| cookie `_abck` | **absent des 52 réponses** |
| cookie `ak_bmsc` | **absent des 52 réponses** |
| challenge, 403, interstitiel | **aucun** |
| cookies effectivement posés | `as24Visitor` (UUID, 37 réponses), `Next-Locale` (2 réponses) |

En-têtes d'infrastructure relevés sur `/fr/voiture/opel/` :

```
Server: nginx
x-powered-by: Next.js
x-nextjs-cache: STALE
cache-control: s-maxage=900, stale-while-revalidate
x-envoy-upstream-service-time: 21
Via: 1.1 …cloudfront.net (CloudFront)
X-Amz-Cf-Pop: BRU51-P1
X-Cache: Miss from cloudfront
set-cookie: as24Visitor=…; Domain=autoscout24.be
```

**La surface autorisée est servie par CloudFront devant nginx et Next.js, avec régénération
incrémentale (`s-maxage=900`, soit 15 min).** Elle n'est pas sur le chemin protégé par Akamai que
les candidats `C-33`, `C-36` et `C-37` cherchent à franchir. C'est une conclusion d'architecture qui
déplace l'axe A8 pour `C-14` de « nous absorbons Akamai » à **« non concerné »**, et qui explique
pourquoi une simple requête `curl` sans empreinte TLS travaillée suffit. Note à l'attention de
`LOT-H` : cette absence d'Akamai vaut pour `auto-catalog-pages`, **pas** pour `/lst` ni pour les
pages d'offre, qui ne sont pas sondables et sur lesquelles ce lot ne conclut pas (R6).

### T4.2 — Snapshot BE complet : le calcul, corrigé

`FINDING-allowed-surface.md` P5 estimait ~5 250 requêtes et **~2,3 Go**. Le chiffre de volume est
**surestimé d'un facteur 5,6** : il utilise la taille décompressée (~440 Ko) alors que le transport
est négocié en gzip à **78,5 Ko en moyenne mesurée**.

| Grandeur | Valeur | Base |
|---|---|---|
| pages à énumérer | 295 marques + 4 955 modèles = **5 250** | `data/reference/taxonomy.json` |
| pages à énumérer, variante bilingue | 10 500 | préfixes `/fr/voiture/` et `/nl/auto/` |
| volume transféré | **412 Mo** (5 250 × 78,5 Ko) | mesuré |
| durée à 600 ms d'espacement | **52 min 30 s** | mesuré |
| durée à 1 requête/s | 1 h 27 min | calcul |
| débit soutenu observé | ~1,67 req/s, **~6 000 req/h** | mesuré, sans 429 |
| annonces distinctes récoltées | 4 955 × ~25 ≈ **124 000**, biaisées | § V.4 |
| agrégats récoltés | `totalItems` pour 5 250 segments, **exhaustifs** | § V.8 |

**Question 3 tranchée : oui, très largement.** Un snapshot BE complet de la surface autorisée tient
en **moins d'une heure** et **412 Mo**, soit 4 % du budget de 24 h. Le débit n'est pas le facteur
limitant de `C-14` — le biais l'est.

Réserve honnête à porter en 1.5 : 52 requêtes en 16 minutes ne testent pas un plafond de 5 250
requêtes en 52 minutes. La mesure établit **l'absence de limitation à 100 requêtes/heure**, elle
**n'établit pas** l'absence de limitation à 6 000 requêtes/heure. Extrapolation marquée
`estimé chiffré`, conformément à l'axe A5.

---

## T5 — `C-58` : l'outil d'estimation de prix

2 sondes : `/evaluationvoiture/` et `/prijsschatting/`, toutes deux **200**, 353 Ko et 349 Ko
décompressés.

### T5.1 — Ce que c'est réellement

Ce n'est pas un outil d'agrégation de marché : c'est un **formulaire de capture de prospect
vendeur particulier**. L'application se nomme, dans ses propres chemins d'actifs,
`private-seller-price-estimation`.

| Élément | Relevé |
|---|---|
| `__NEXT_DATA__` | **absent** — application Next.js App Router, rendu client, payload en `self.__next_f.push` |
| `Cache-Control` | `private, no-cache, no-store, max-age=0, must-revalidate` |
| infrastructure | CloudFront (`X-Amz-Cf-Pop: BRU51-P1`), aucun cookie Akamai |
| nom de l'application | `/assets/private-seller-price-estimation/_next/…` |
| titre | « Estimation voiture gratuite | AutoScout24 » |
| équivalents multi-pays déclarés en `hrefLang` | `autoscout24.at/fahrzeugbewertung/`, `.de/fahrzeugbewertung/`, `.fr/evaluation-du-vehicule/`, `.nl`, `.it`, `autotrader.ca/valuations/`, `autohebdo.net/evaluations/` |

### T5.2 — Cartographie du formulaire (`<form class="vehicle-insertion-form">`)

| Champ | `id` | Type |
|---|---|---|
| marque | `vehicle-insertion-form-select-make` | combobox |
| modèle | `vehicle-insertion-form-select-model` | combobox |
| carrosserie + portes | `vehicle-insertion-form-select-body-type-and-doors` | combobox |
| catégorie de carburant | `vehicle-insertion-form-select-fuel-category` | combobox |
| transmission | `vehicle-insertion-form-select-transmission` | combobox |
| puissance | `vehicle-insertion-form-select-power` | combobox |
| version du modèle | `vehicle-insertion-form-select-model-version` | combobox |
| kilométrage | `vehicle-insertion-form-mileage` | saisie libre |
| **adresse e-mail** | `private-seller-email` | **saisie obligatoire, `type=email`** |

Ces sept listes correspondent **exactement**, un pour un, aux champs requis par l'opération
`POST /priceevaluation/{customerId}` de la spec de `C-02` (§ T6.2) : `make`, `model`, `bodyType`,
`doorCount`, `fuelCategory`, `transmission`, `power`, `mileage`. **L'outil public et l'API
concessionnaire consomment la même primitive de valorisation.** `[INFÉRÉ — forte convergence de
schéma, pas de preuve d'appel]`

### T5.3 — L'appel émis : non cartographiable sans violer E5

Aucun endpoint de valorisation n'apparaît dans le HTML servi. Recherche exécutée hors ligne sur les
353 Ko : `priceEstimation` **absent**, `apiBase` **absent**, `baseUrl` **absent**, `endpoint`
**absent**, `minPrice` **absent**, `maxPrice` **absent**, `range` **absent**, `fourchette`
**absent**. Les seuls hôtes d'API cités dans la page sont `signup.api.autoscout24.com` (16 fois) et
`auth-privates.autoscout24.com` — l'authentification du bandeau, sans rapport avec la valorisation.

L'URL de l'appel est donc dans les *chunks* JavaScript, sous
`/assets/private-seller-price-estimation/_next/static/chunks/…`. **`/assets/` n'est couvert par
aucune des 16 directives `Allow`** ; notre groupe est `Disallow: /`. **Les télécharger violerait E5,
je ne l'ai pas fait.** C'est une limite de périmètre, pas une limite de méthode : la mesure est
possible, elle n'est pas licite pour cet agent. → `ACTIONS-COMMANDITAIRE` A-3.

De même, soumettre le formulaire est exclu deux fois : il exige la saisie d'une **adresse e-mail
réelle** (donnée personnelle, et déclencheur d'un envoi sortant), ce qui relève d'une action à
autorisation explicite, et il n'apporterait de toute façon qu'un résultat pour un véhicule.
→ `ACTIONS-COMMANDITAIRE` A-4.

### T5.4 — Distribution ou prix ponctuel ? Le texte de la page, et la spec

Texte servi par la page, verbatim : « *notre outil analysera les véhicules similaires sur le marché
pour te fournir une estimation juste* ». Le vocabulaire est celui d'**une** estimation. Aucun
vocabulaire de fourchette ni de percentile dans les 353 Ko.

**Mais la spec de `C-02` tranche la question de la primitive sous-jacente, et dans l'autre sens** —
voir § T6.2 : `PriceEvaluationResponse` renvoie `category` **et** un tableau `ranges` de
`PriceEvaluationRanges { category, minimum, maximum }`. La primitive de valorisation d'AutoScout24
rend donc bien **une segmentation bornée de l'axe des prix**, pas un scalaire.

**Conclusion nuancée** : la primitive est distributionnelle (prouvé par schéma) ; le produit public
`/evaluationvoiture/` n'en expose, dans ce qui est licitement observable, qu'une promesse
d'« estimation », et son résultat n'est pas atteignable sans soumettre une donnée personnelle.

---

## T6 — `C-02` : ce que l'hôte `listing-creation.api.autoscout24.com` expose au-delà du référentiel

7 sondes. L'hôte **ne sert aucun `robots.txt`** (404 re-vérifié le 2026-09-07, 454 octets) : aucune
règle de crawl n'y est déclarée, le raisonnement de `AS24-REFERENCE-API.md` est reconduit.

### T6.1 — Inventaire exhaustif de la spécification, lu hors ligne

`GET /assets/openapi/spec.yml` → **200, 270 077 octets, `sha256` identique au fichier vendoré
`docs/reference/vendor/as24-listing-creation-openapi.yml`**. La spec n'a pas bougé depuis le
2026-09-06 ; l'inventaire ci-dessous est donc conduit sur le fichier local, sans requête.

**16 chemins, 22 opérations, dont 12 `GET`. Sécurité : `basicAuth` déclarée globalement, aucun
`security:` local ne l'annule sur aucune opération** — la spec ne déclare donc *aucun* endpoint
public. La réalité observée diffère.

| Chemin | Opérations | Non authentifié, mesuré le 2026-09-07 |
|---|---|---|
| `/makes` | get | **200** (118 899 o, 164 ms) — 1 080 marques / 13 263 modèles |
| `/references` | get | **200** *(établi par `AS24-REFERENCE-API.md`, 33 `ReferenceType`)* |
| **`/seals`** | get | **200** (12 239 o, 91 ms) — **découverte de ce lot** |
| `/customers` | get | **401** |
| `/customers/{id}/listings` | post, **get** | **401** |
| `/customers/{id}/listings/{listingId}` | **get**, put, patch, delete | *non sondé — dominé par le 401 ci-dessus* |
| `/customers/{id}/listings/export-status` | get | *idem* |
| `/customers/{id}/seals` | get | *idem* |
| `/customers/{id}/images` | post | écriture, hors mandat |
| `/customers/{id}/listings/{lid}/360-images/three-sixty-vr` | post, get | écriture / lecture par client |
| `/customers/{id}/listings/{lid}/360-images/three-sixty-vr/{imageId}` | delete | — |
| `/customers/{id}/listings/{lid}/360-images/three-sixty-images-collection` | post, get | — |
| `/customers/{id}/listings/{lid}/360-images/three-sixty-images-collection/{imageId}` | delete | — |
| **`/statistics/{id}/listings`** | get | **401** |
| **`/statistics/{id}/listings/{listingId}`** | get | *dominé par le 401 ci-dessus* |
| **`/priceevaluation/{id}`** | post | *non sondé : `POST` sur un chemin d'écriture, et « restricted »* |

**Réponse au mandat « borner ce que l'hôte expose au-delà du référentiel » :**

1. **Un troisième endpoint ouvert est découvert : `GET /seals`.** 251 enregistrements,
   champs `{id, name, country, thumbnail}` — le référentiel des **labels de certification
   concessionnaire** (« Land Rover Approved », « Jaguar Approved », « My Way »…). Il donne au passage
   **la liste des marketplaces d'AutoScout24 avec leurs locales**, mesurée et non supposée :
   `nl-NL` 46, `es-ES` 42, `de-DE` 24, `it-IT` 26, `fr-FR` 20, **`fr-BE` 16, `nl-BE` 16**,
   `en-CA` 25, `fr-CA` 25, `fr-LU` 7, `de-AT` 4. **11 locales, 9 pays.** C'est une mesure directe
   de l'axe A4, et elle confirme la couverture BE bilingue et LU de H1.
2. **Aucun endpoint de lecture d'inventaire n'est ouvert.** Les trois opérations qui liraient des
   annonces ou des statistiques (`listListings`, `getListingStatisticsBatched`, `listCustomers`)
   rendent **401 avec un corps vide**, en 73 à 79 ms — un rejet au bord, avant traitement.
   La limite **L1** de `AS24-REFERENCE-API.md` (« pas d'annonces ») est **confirmée par test
   direct**, et non plus seulement par lecture de la portée de la spec.
3. **Deux primitives à haute valeur existent, derrière authentification** — voir T6.2. Elles ne sont
   pas des inventaires, mais elles sont exactement ce que le mode 2 de KYCAR consomme.

### T6.2 — `POST /priceevaluation/{customerId}` : la primitive distributionnelle

C'est la trouvaille la plus lourde de conséquence de la section, et elle est **prouvée par schéma**.

```yaml
PriceEvaluationResponse:
  properties:
    category:  { type: integer, description: "The price label category id, as defined by the
                 `PriceLabel` reference type in the GET /references API." }
    ranges:    { type: array, items: PriceEvaluationRanges }
PriceEvaluationRanges:
  properties:
    category: { type: integer }
    minimum:  { type: integer, example: 10500, description: "The inclusive minimum price for this
                listing to be in this price range." }
    maximum:  { type: integer, example: 13500, description: "The inclusive maximum price for this
                listing to be in this price range." }
```

Entrée : un `ListingPayload`. Champs **requis** : `prices.public.price`, `offerType`, `make`,
`model`, `bodyType`, `firstRegistrationDate`, `fuelCategory`, `power`, `transmission`.
Champs **optionnels utilisés s'ils sont présents** : `mileage`, `consumption.combined`,
`consumption.electricCombined`, `doorCount`, `bodyColor`, `equipment`,
`availability.deliveryDays`.

**Ce que cela signifie pour KYCAR** : pour une configuration de véhicule donnée, l'endpoint rend
**les bornes des bandes de prix du marché** — `PriceLabel` compte 6 valeurs au référentiel, donc
jusqu'à 6 intervalles `[minimum, maximum]`. Interrogé sur une grille de configurations (année ×
kilométrage × puissance), il **reconstruirait une surface de prix de marché** : précisément le
livrable du mode 2, et sans le biais publicitaire de `C-14`, puisque l'agrégat est calculé côté
AutoScout24 sur sa propre base.

Ses trois verrous, dans l'ordre de dureté :
1. La description de la spec est explicite : « *This endpoint is restricted. If you are interested
   in using the price evaluation feature, please contact AutoScout24 to have it activated.* »
   Donc **activation commerciale**, en plus de l'authentification.
2. `basicAuth` + un `customerId` de concessionnaire.
3. C'est un `POST`. Je ne l'ai pas sondé : envoyer un `POST` sur un hôte d'écriture avec un
   `customerId` arbitraire n'aurait rien mesuré d'utile et sort de la sonde de lecture.
→ `ACTIONS-COMMANDITAIRE` A-1.

**Le pont avec `C-14`** : `details.prices.public.evaluation.category`, servi **gratuitement** sur la
surface autorisée pour chaque annonce (§ T2.2), est la **même** grandeur `PriceLabel` que le
`category` de cette réponse. Nous avons donc déjà, gratuitement, la **classe** de prix de chaque
annonce du vivier — ce qui manque, ce sont les **bornes**.

### T6.3 — `GET /statistics/{customerId}/listings`

Existe, `operationId` `getListingStatisticsBatched`, **401 sans authentification**. Confirme par une
source primaire ce que `C-85` et le § 17.2 des `Händler-AGB` décrivaient de l'extérieur : le canal
de statistiques par annonce existe, il est **par client**, donc il donne le stock du concessionnaire
et non le marché. Élément à transmettre à `LOT-K` et `LOT-L` : la seconde question falsifiable de
`C-85` (« la donnée transmise est au niveau annonce, ou seulement statistique agrégée sur les
annonces du concessionnaire client ») reçoit ici un **élément de réponse structurel** — le chemin
est `/statistics/{customerId}/listings`, indexé par client. `[PROUVÉ pour l'existence et la forme
du chemin ; NON PROUVÉ pour le contenu de la réponse]`

---
## Candidats

Convention de niveau de preuve, conforme à R4 : **`prouvé`** = sortie de commande de ce document ;
**`documenté`** = source primaire citée ; **`argumenté`** / **`estimé`** = raisonnement explicite ;
**`[NON VÉRIFIÉ]`** = non mesuré, non compté dans la notation (S1/S3).

Hypothèses de coût communes, pour la comparabilité R5 : un jour-homme = 600 €. Le coût récurrent
d'un rafraîchissement quotidien BE est le coût d'infrastructure d'un crawl de 5 250 requêtes et
412 Mo par jour, arrondi à **5 €/mois** de calcul et de bande passante sur un hébergement banal —
mesure de volume prouvée (§ T4.2), tarif documenté par ordre de grandeur.

---

### `C-14` — Pages SEO autorisées `/fr/voiture/`, `/nl/auto/`

| Axe | Valeur | Preuve |
|---|---|---|
| **A1** Coût d'amorçage | **0 €** | prouvé — 41 requêtes exécutées, aucun compte, aucune clé |
| **A2** Coût récurrent | **0 € / 1 000 annonces** en redevance ; coût d'infra **≈ 5 €/mois** pour BE quotidien (5 250 req, 412 Mo/j) | prouvé pour le volume, documenté pour le tarif |
| **A3** Couverture champs | **40 / 40** feuilles JSON dénombrées dans `listings[].details`, arborescence exhaustive au § T2.2. **Utiles pour KYCAR : 33 / 40**, décompte explicite : moins **3** champs identifiants vendeur exclus par R3/RGPD (`seller.id`, `seller.contactName`, `seller.companyName` — `seller.type` est conservé), moins **4** champs de présentation qui doublent un frère `.raw` (`amountInEUR.formatted`, `fuelCategory.formatted`, `mileageInKm.formatted`, `numberOfPreviousOwnersExtended.formatted`). Les 3 autres `.formatted` sont conservés : ils sont le **seul** porteur de leur valeur (date de première immatriculation, consommation, CO₂). Réserve : `media.images` est tronqué à 5. | prouvé — comptage par commande |
| **A4** Couverture géo | **BE (fr + nl)** confirmée `cy=B` ; mécanique identique et préfixes relevés pour **DE, NL, FR, LU** | prouvé (5 `robots.txt`, § T1.2) ; le rendement hors BE reste `[NON VÉRIFIÉ]` |
| **A5** Latence | **p50 = 169 ms**, p90 = 435 ms ; snapshot BE complet **52 min 30 s** à 600 ms d'espacement | prouvé (52 mesures) ; snapshot = estimé chiffré |
| **A6** Débit / quota | **~6 000 req/h** soutenues sans 429 ; **plafond dur inconnu au-delà de 52 req/16 min** | prouvé pour le plancher ; plafond `[NON VÉRIFIÉ]` |
| **A7** Stabilité technique | **3 / 5**. Contrat de route stable (`[...slugs]`, `buildId` `auto-catalog-pages_main-4062-1`) et pages SEO conçues pour durer, mais `__NEXT_DATA__` est un détail d'implémentation Next.js : une migration App Router le supprimerait — c'est **déjà arrivé** sur `/evaluationvoiture/`, qui n'a plus de `__NEXT_DATA__` (§ T5.1). Le `robots.txt` BE a par ailleurs été modifié le 20.08.2026 : la surface autorisée est révocable par son éditeur en une ligne. | argumenté, avec précédent mesuré |
| **A8** Résistance anti-bot | **Non concerné.** CloudFront + nginx + Next.js, **aucun `_abck`, aucun `ak_bmsc`, aucun challenge sur 52 réponses**. Cette surface n'est pas derrière Akamai. | prouvé (§ T4.1) |
| **A9** Effort d'intégration | **3 jours-homme** (≈ 1 800 €) : client HTTP + extraction `__NEXT_DATA__` + mappage des 22 champs utiles + énumération marque/modèle depuis `taxonomy.json` + filtre RGPD à l'ingestion. Le parseur est un `JSON.parse` sur un chemin connu, pas une extraction de DOM. | estimé, appuyé sur l'extracteur de 30 lignes utilisé ici |
| **A10** Coût de maintenance | **0,5 jour-homme / mois** (≈ 300 €/mois) : surveillance de la présence de `__NEXT_DATA__`, du `robots.txt` et de la stabilité des chemins de champs. À doubler l'année d'une refonte du front. | argumenté |
| **A11** Exposition juridique | **2 / 5**. Mécanisme nommé : le `robots.txt` **autorise nommément `ClaudeBot`** sur ces préfixes — c'est un consentement écrit au crawl, opposable en sens inverse. Restent (a) le **droit *sui generis*** (Directive 96/9/CE) sur l'extraction d'une partie substantielle : 124 000 annonces sur 121 710 vivantes serait substantiel, les agrégats seuls ne le seraient pas ; (b) le § 3.3 des `Händler-AGB` interdisant « *die automatisierte Abfrage der Datenbank mittels Software* », **contrat B2B non signé par nous**, donc non directement opposable ; (c) les CGU grand public BE, non lues. | argumenté |
| **A12** Autonomie | **Partiel.** Aucun tiers intermédiaire, aucune clé, aucun contrat. Mais AutoScout24 peut retirer les directives `Allow` d'un trait de plume — et l'a déjà édité le 20.08.2026. Dépendance à un seul acteur, sans préavis. | documenté |
| **A13** Plafond de volumétrie | **~25 annonces par segment**, saturation prouvée par Chao1 = 25,0 ; **31 en cumulant `fr-BE` et `nl-BE`**. Extrapolé : **≈ 124 000 annonces/jour** (4 955 modèles × 25), **biaisées**. Agrégats : **5 250 `totalItems` exhaustifs/jour**, dont le total national **121 710**. | prouvé (§ V.4, § T2.1) |
| **A14** Fraîcheur atteignable | **≤ 15 min** structurellement : `cache-control: s-maxage=900, stale-while-revalidate`, confirmé par `x-nextjs-cache` MISS/STALE/HIT observés. En pratique, le délai entre publication réelle et disponibilité est **inférieur au quart d'heure plus la période de crawl** (≈ 1 h pour BE). Une annonce à 10 km au compteur immatriculée le 01/2026 était servie, donc les annonces neuves entrent bien dans le vivier. | prouvé pour l'en-tête, argumenté pour le délai de bout en bout |

**Verdict : `VIABLE SOUS CONDITION`.**

Condition, en une phrase : **utilisable pour les agrégats (mode 1), interdit pour les distributions
(mode 2).** C'est le seul candidat du lot qui satisfait *gratuit + autonome* (critère S6 de la
phase 1.6) et il l'est réellement — mais son échantillon d'annonces est biaisé à `p < 10⁻²⁰` par le
produit publicitaire, et ne couvre que 1,95 % d'un gros segment.

**Inconnues restantes** :
1. Le plafond de débit réel au-delà de 6 000 req/h. Non mesuré parce qu'il exigerait précisément
   l'extraction de masse que R3 interdit.
2. La rotation du vivier à l'échelle du jour et de la semaine (§ V.7) — la seule mesure qui pourrait
   encore sauver partiellement le mode 2. → A-6.
3. Le rendement hors Belgique : les préfixes existent (prouvé), le contenu de leurs pages catalogue
   n'a pas été sondé (budget).
4. Si les autres langues de marketplaces multilingues (CA fr/en, BE fr/nl) sont des voies de rendu
   distinctes partout, ou seulement en BE.
5. Le contenu des CGU grand public belges (A11) — atteignable licitement sous `/fr/entreprise/`,
   mais c'est le mandat de `LOT-K`, pas le mien (R6).

---

### `C-02` — Listing Creation API (`listing-creation.api.autoscout24.com`)

| Axe | Valeur | Preuve |
|---|---|---|
| **A1** Coût d'amorçage | **0 €** pour la partie ouverte (`/makes`, `/references`, `/seals`, spec). **Inconnu, et commercial**, pour `/priceevaluation` : « *contact AutoScout24 to have it activated* ». | prouvé / documenté |
| **A2** Coût récurrent | **0 €** pour le référentiel — il n'est pas facturé à l'annonce et ne se rafraîchit qu'au trimestre. **`n/a` en € / 1 000 annonces : cette API ne sert aucune annonce.** Pour BE quotidien : 0 €, aucun rafraîchissement quotidien nécessaire. | prouvé (L1 confirmée par 401) |
| **A3** Couverture champs | **0 / 40 champs d'annonce.** En revanche **122 schémas** décrivent le modèle de données `Listing` / `ListingPayload`, ce qui en fait le **dictionnaire de référence** de la phase 2.1, et 33 `ReferenceType` (673 valeurs) le vocabulaire de classification. | prouvé — 3 endpoints 200, 3 endpoints 401 |
| **A4** Couverture géo | **11 locales, 9 pays, mesurés** via `GET /seals` : `nl-NL`, `de-DE`, `es-ES`, **`fr-BE`, `nl-BE`**, `it-IT`, `fr-LU`, `fr-FR`, `de-AT`, `en-CA`, `fr-CA`. Le paramètre `marketplace` reste **inerte** sur `/makes` (L2). | prouvé |
| **A5** Latence | `/makes` **164 ms** (118 899 o) ; `/seals` **91 ms** ; rejets 401 en **73–79 ms**. Snapshot du référentiel complet : ~35 requêtes, **< 30 s**. | prouvé |
| **A6** Débit / quota | Aucun 429 sur 7 requêtes. Seuil réel **toujours non publié** (L8 inchangée) ; le harvester existant temporise 250 ms. | documenté ; seuil `[NON VÉRIFIÉ]` |
| **A7** Stabilité technique | **5 / 5** pour la partie ouverte. La spec est **`sha256`-identique** à la copie vendorée du 2026-09-06 ; c'est une API versionnée avec contrat OpenAPI publié, pas un détail de rendu. Seule dérive connue : `EngineMountingType` et `Steering` déclarés mais rendant 400 (L5). | prouvé (comparaison de hachage) |
| **A8** Résistance anti-bot | **Non concerné.** L'hôte ne sert **aucun `robots.txt`** (404 re-vérifié), aucun cookie de challenge, aucun 403. | prouvé |
| **A9** Effort d'intégration | **0 jour-homme supplémentaire** — l'adaptateur existe déjà et tourne : `scripts/fetch-reference-data.mjs`. | prouvé par l'existant |
| **A10** Coût de maintenance | **~0,1 jour-homme / mois** (≈ 60 €/mois) : re-tirer le référentiel au trimestre et diffuser les nouveaux identifiants. | argumenté |
| **A11** Exposition juridique | **1 / 5** pour la lecture du référentiel : endpoints publics, sans authentification, sans CGU acceptée, et une **taxonomie de marques et de modèles n'est pas une base de données protégée au sens du droit *sui generis*** — c'est un fait de nomenclature. Le risque monte à **4 / 5** dès qu'on entre dans le périmètre `customerId` : y accéder supposerait des identifiants de concessionnaire, donc l'acceptation des `Händler-AGB` et de leur § 3.3. | argumenté |
| **A12** Autonomie | **Partiel** pour le référentiel — un hôte AS24, sans contrat, mais qu'AS24 peut fermer. **Non** pour `/priceevaluation` et `/statistics` : activation commerciale nominative. | documenté |
| **A13** Plafond de volumétrie | **0 annonce.** Confirmé par test : `GET /customers/1/listings` → **401**, `GET /customers` → **401**, `GET /statistics/1/listings` → **401**. Référentiel : 1 080 marques, 13 263 modèles, 673 valeurs d'attribut, 251 labels. | prouvé |
| **A14** Fraîcheur atteignable | **`n/a` pour les annonces.** Pour le référentiel : inconnue et sans enjeu — un nouveau modèle apparaît au trimestre, pas à l'heure. | argumenté |

**Verdict : `VIABLE` comme source de référentiel — et `NON VIABLE` comme source d'annonces.**

C'est un verdict double, et il faut le porter tel quel au tableau maître de la phase 1.6 : le
candidat est **acquis et en production** pour ce qu'il fait, et **définitivement clos** pour ce
qu'on espérait qu'il fasse. Les trois endpoints de lecture d'inventaire ont été **testés** et
rendent 401 : l'espoir d'une fuite d'autorisation est fermé par mesure, pas par lecture de spec.

**Inconnues restantes** :
1. Le contenu réel de `PriceEvaluationResponse.ranges` sur un véhicule réel. Le **schéma** est
   prouvé, la **réponse** ne l'est pas. → A-1.
2. Le contenu de `getListingStatisticsBatched`. Forme du chemin prouvée, réponse inconnue. → A-1.
3. Le seuil de `RateLimitExceeded` (L8), toujours non publié.

---

### `C-58` — Outil d'estimation de prix (`/evaluationvoiture/`, `/prijsschatting/`)

| Axe | Valeur | Preuve |
|---|---|---|
| **A1** Coût d'amorçage | **0 €** pour lire la page. **Bloqué** au-delà : la mesure de l'appel émis exige de télécharger des actifs sous `/assets/`, **hors surface autorisée** (§ T5.3). | prouvé |
| **A2** Coût récurrent | **Indéterminable.** `[NON VÉRIFIÉ]` — l'endpoint n'est pas identifié, donc son coût par appel non plus. Aucune tarification publiée sur la page. | `[NON VÉRIFIÉ]` |
| **A3** Couverture champs | **0 / 40** en lecture d'annonces. En **entrée** : 8 champs (marque, modèle, carrosserie + portes, catégorie de carburant, transmission, puissance, version, kilométrage) + e-mail. En **sortie** : une « estimation », vocabulaire de la page ; aucun `minPrice`, `maxPrice`, `range` ni « fourchette » dans les 353 Ko servis. | prouvé pour l'entrée et pour l'absence des termes de sortie |
| **A4** Couverture géo | **BE fr + nl**, plus 7 équivalents déclarés en `hrefLang` : AT, DE, FR, NL, IT, CA (autotrader.ca, autohebdo.net). **Absent de la surface autorisée LU** (§ T1.2). | prouvé |
| **A5** Latence | **262 ms** (`/evaluationvoiture/`), **237 ms** (`/prijsschatting/`) pour la page. Latence de l'appel de valorisation : `[NON VÉRIFIÉ]`. | prouvé / non vérifié |
| **A6** Débit / quota | `[NON VÉRIFIÉ]`. Réserve de bon sens à porter en 1.6 : un formulaire de capture de prospect exigeant un e-mail par soumission est **structurellement inadapté** à un usage programmatique, quel que soit son quota. | `[NON VÉRIFIÉ]` + argumenté |
| **A7** Stabilité technique | **2 / 5**. Preuve directe d'instabilité : cette page **n'a plus de `__NEXT_DATA__`** alors que les pages catalogue en ont — les deux applications ont divergé, et celle-ci a déjà migré vers l'App Router. Tout parseur bâti sur ses *chunks* serait cassé par un redéploiement, dont les noms portent des hachages (`page-1a0f89c75ebbd2f0.js`). | prouvé pour la divergence, argumenté pour la fragilité |
| **A8** Résistance anti-bot | **Non concerné pour la page** : CloudFront, aucun `_abck`, aucun `ak_bmsc`, `Cache-Control: private, no-cache`. Pour l'endpoint de soumission : `[NON VÉRIFIÉ]` — un formulaire de prospect est le premier endroit où un éditeur met un CAPTCHA. | prouvé / non vérifié |
| **A9** Effort d'intégration | **`[NON VÉRIFIÉ]`, minorant 5 jours-homme** (≈ 3 000 €) : il faudrait d'abord identifier l'endpoint depuis les *chunks*, puis reproduire un contrat non documenté, puis gérer une soumission qui exige une adresse e-mail par requête. | estimé, borne basse |
| **A10** Coût de maintenance | **Élevé, ≥ 1 jour-homme / mois** (≈ 600 €/mois) : contrat non documenté, actifs hachés, redéploiements sans préavis. | argumenté |
| **A11** Exposition juridique | **4 / 5**, et c'est le plus élevé du lot. Trois mécanismes distincts se cumulent : (a) l'usage programmatique d'un formulaire de capture de prospect avec de **fausses adresses e-mail** est un détournement de finalité caractérisé ; (b) chaque soumission déclenche un **envoi sortant** vers une adresse, donc un traitement de données ; (c) le § 3.3 des `Händler-AGB` sur l'interrogation automatisée s'y applique avec la même force qu'ailleurs. Le préfixe est certes `Allow` — mais `Allow` autorise le **crawl de la page**, pas l'exploitation automatisée de son formulaire. | argumenté |
| **A12** Autonomie | **Non.** Contrat non documenté, non versionné, non contractualisé — la dépendance est maximale, sans même l'engagement d'une API publiée. | argumenté |
| **A13** Plafond de volumétrie | **0 annonce.** L'outil ne rend pas d'annonces ; il rend au mieux une valorisation par véhicule soumis. `[NON VÉRIFIÉ]` pour le nombre de soumissions tolérées. | prouvé pour l'absence d'annonces |
| **A14** Fraîcheur atteignable | **`n/a`** — une valorisation n'a pas de date de publication. La base de comparaison est celle d'AS24, donc à jour par construction. | argumenté |

**Verdict : `NON VIABLE` en l'état, mais le candidat désigne une primitive de grande valeur qui, elle,
est ailleurs.**

C'est la conclusion la plus utile du candidat : le mandat du registre postulait que
« l'endpoint consomme nécessairement une distribution de prix — accès indirect à l'agrégat ». **Le
postulat est correct, mais la voie d'accès est fausse.** La distribution existe, elle est
documentée, ses bornes sont typées — mais elle est derrière `POST /priceevaluation/{customerId}` de
`C-02` (§ T6.2), avec authentification et activation commerciale, et non derrière un formulaire
grand public de capture de prospect. `C-58` doit donc être **fusionné dans `C-02`** au tableau
maître de 1.6, en tant que preuve que la primitive est réelle et qu'AS24 la commercialise.

**Inconnues restantes** :
1. L'URL et le contrat de l'appel émis par le formulaire. Hors d'atteinte sous E5. → A-3.
2. La forme du résultat rendu à l'utilisateur : point unique ou fourchette. → A-4.
3. La présence d'un CAPTCHA ou d'un anti-abus sur la soumission.

---

### `C-52` — `robots.txt` comme carte d'endpoints et référence de conformité

Candidat de nature **instrumentale** : il ne fournit aucune donnée d'annonce et n'a donc pas de coût
par annonce. Les axes A2, A3, A13 et A14 sont **structurellement sans objet**, et je le dis
explicitement plutôt que de porter un `[NON VÉRIFIÉ]` qui laisserait croire à une lacune de mesure.

| Axe | Valeur | Preuve |
|---|---|---|
| **A1** Coût d'amorçage | **0 €** | prouvé — 5 requêtes |
| **A2** Coût récurrent | **0 €**. `n/a` en € / 1 000 annonces : ne rend aucune annonce. Pour BE quotidien : 1 requête/jour, coût nul. | prouvé |
| **A3** Couverture champs | **0 / 40**. Rend **43 préfixes autorisés** pour notre groupe sur 5 TLD (16 BE + 10 DE + 8 NL + 5 FR + 4 LU) et **93 chemins interdits distincts** dans les groupes `*` (62 BE, 66 DE, 51 FR, 38 NL, 37 LU), tous comptés par commande. | prouvé |
| **A4** Couverture géo | **5 TLD sondés et cartographiés** : BE, DE, NL, FR, LU — exactement le périmètre H1. | prouvé |
| **A5** Latence | p50 des 5 sondes : **178 ms** ; min 169, max 257. | prouvé |
| **A6** Débit / quota | Sans objet : 1 requête par domaine et par jour suffit. Aucun quota rencontré. | argumenté |
| **A7** Stabilité technique | **4 / 5**, et c'est une note **mesurée, pas supposée** : les fichiers portent leur propre signature de version en commentaire final — `#MG, 20.08.2026` (BE, DE, NL) et `#MG, 18.02.2026` (FR, LU). La cadence de révision observée est donc **semestrielle**, avec une révision il y a 18 jours. Ce champ est le **détecteur de dérive** le moins cher du projet. | prouvé |
| **A8** Résistance anti-bot | **Non concerné.** 5 × 200, aucun cookie de challenge. | prouvé |
| **A9** Effort d'intégration | **0,25 jour-homme** (≈ 150 €) pour une garde de conformité dans `DataProvider` : charger le `robots.txt` du marketplace, vérifier par la règle du chemin le plus long (RFC 9309 § 2.2.2) avant chaque requête, refuser sinon. | estimé |
| **A10** Coût de maintenance | **~0 jour-homme / mois** si la garde est automatisée : le contrôle devient une assertion d'exécution, avec alerte sur changement de signature de version. | argumenté |
| **A11** Exposition juridique | **1 / 5**, et c'est le candidat qui **réduit** l'exposition des autres. Mécanisme : le `robots.txt` est l'expression documentée de la volonté de l'éditeur ; le respecter est l'élément de bonne foi le plus concret dont ce projet dispose. Élément à charge relevé (§ T1.3) : le fichier DE ouvre `/angebote/` aux bots de prévisualisation sociale tout en le fermant à `*` — l'éditeur **discrimine par identité d'agent déclarée**, ce qui montre qu'il attend une lecture littérale de ses directives et renforce leur portée. | argumenté |
| **A12** Autonomie | **Oui** — c'est le seul `oui` franc des 4 candidats du lot : fichier public, sans compte, sans contrat, sans intermédiaire, et dont la lecture ne peut pas nous être refusée. | documenté |
| **A13** Plafond de volumétrie | **`n/a`** — ne rend aucune annonce. | prouvé |
| **A14** Fraîcheur atteignable | **immédiate** ; le fichier est servi sans cache observable et porte sa date de révision. | prouvé |

**Verdict : `VIABLE`.** Mandat résiduel du registre — « les `robots.txt` de `.fr`, `.de`, `.nl`,
`.lu` » — **exécuté et clos** (§ T1). Réponse au mandat : la surface autorisée **n'est pas**
identique hors Belgique, le mécanisme l'est.

**Inconnues restantes** :
1. Les TLD au-delà des 5 sondés (IT, ES, AT, CH, CA), qui appartiennent au périmètre de `C-04` et de
   `LOT-B`, pas au mien (R6).
2. L'historique des révisions du fichier belge — quand `/fr/voiture/` a-t-il été ouvert, et une
   directive plus favorable a-t-elle existé ? Mesurable par `C-53` (Wayback, `LOT-J`), pas ici.

---
## Questions falsifiables

Les cinq questions prioritaires du mandat `LOT-A` de `candidates-final.md`, chacune avec son verdict
et **la mesure qui l'établit** — pas l'argument qui la rend plausible.

---

### Q1 — « L'échantillon de 20 annonces est biaisé par le produit publicitaire. »

**Verdict : VRAIE.**

**Mesure qui l'établit** — trois mesures convergentes, détaillées § V :

1. **Taux de base exhaustif.** 6 segments dont `totalItems ≤ 20` sont servis intégralement, soit
   **48 annonces de population complète** : **2,1 % de `T50`**, 31,2 % de professionnels.
2. **Dose-réponse sur 6 segments échantillonnés.** La part de `T50` servie passe de **5 % à 95 %**
   quand le taux d'échantillonnage passe de 69 % à 0,39 %. Un tirage aléatoire produirait une part
   **indépendante** du taux. Le témoin négatif `opel-agila` — 0 % de `T50` parce que sa population
   n'en contient aucun — confirme le mécanisme.
3. **Test binomial** sur le vivier saturé d'Opel Corsa, 23 `T50` sur 25 :
   `P = 7,4 × 10⁻³⁷` sous le taux de base mesuré, `P = 2,5 × 10⁻²¹` sous une hypothèse haute de
   10 %, `P = 9,7 × 10⁻⁶` sous une hypothèse absurde de 50 %. **H₀ est rejetée à tous les niveaux.**

Deux corollaires **également mesurés** : le vivier est **100 % professionnel** (25/25 sur Corsa,
34/34 sur la marque, contre un taux de base de 31,2 %), et le bas de marché est **tronqué d'un
facteur 27,3** sur Corsa (vivier à partir de 3 250 € contre 119 € annoncés par `priceInfo`) et de
**6,9** sur Frontera (19 789 € contre 2 862 €).

---

### Q2 — « La surface autorisée n'offre aucune pagination : le plafond est structurellement de 20 annonces par modèle. »

**Verdict : VRAIE pour la pagination — FAUSSE pour le chiffre de 20.**

**Mesure qui l'établit** :

- **Aucune pagination.** `?page=2` rend une réponse **identique à l'octet** au témoin (84 615 o,
  mêmes 20 identifiants, même ordre) ; `…/page/2/` rend **404** ; `?sort=price&fuel=diesel&ft=D`
  ne trie ni ne filtre rien. Preuve mécanique et non seulement comportementale :
  `__NEXT_DATA__.query` vaut `{"slugs":[…]}` sur les 4 sondes — **la route `[...slugs]` ne reçoit
  aucun paramètre de requête**. Il n'y a donc pas de nom de paramètre à trouver.
- **Mais le plafond est ~25, pas 20.** Un paramètre inerte change la clé de cache du CDN et force un
  rendu neuf, donc un tirage neuf. Capture-recapture sur 11 tirages : union **25**, `f₁ = f₂ = 0`,
  **Chao1 = 25,0** — saturation prouvée, y compris sur des rendus `MISS` francs. Confirmé sur
  Frontera (23, saturé en 4 tirages) et en cours de croissance sur la marque (34 après 5 tirages).
  En cumulant les locales `fr-BE` et `nl-BE` : **31 annonces, soit 2,42 % des 1 281**.

Le plafond est donc **structurel** — c'est ce que la question voulait établir — mais sa valeur exacte
est de **~25 par modèle et par langue, ~31 en bilingue**, et non de 20. La correction vaut d'être
portée : elle change l'estimation de couverture nationale de 99 000 à **≈ 124 000 annonces**
(4 955 × 25), sans rien changer au biais.

---

### Q3 — « Le débit soutenable permet un snapshot complet (~5 250 requêtes, ~2,3 Go) en moins de 24 h. »

**Verdict : VRAIE, et très largement — mais l'énoncé surestime le volume d'un facteur 5,6.**

**Mesure qui l'établit** : 52 requêtes en 16 min 19 s, temporisation 600 ms, agent `ClaudeBot`
déclaré, sans rotation d'IP. **p50 = 169 ms**, p90 = 435 ms, **zéro 429**, aucune dégradation de
latence sur la durée, **taille moyenne mesurée d'une page catalogue : 78 489 octets transférés**
(gzip) et non 440 Ko.

| Grandeur | Énoncé de la question | **Mesure** |
|---|---|---|
| requêtes | ~5 250 | 5 250 (confirmé : 295 marques + 4 955 modèles) |
| volume | ~2,3 Go | **412 Mo** |
| durée à 600 ms | — | **52 min 30 s**, soit **3,6 %** du budget de 24 h |
| débit soutenu | — | **~6 000 req/h**, sans 429 |

**Réserve explicite, à porter en 1.5** : 52 requêtes en 16 minutes prouvent l'absence de limitation
à 100 req/h ; elles **ne prouvent pas** l'absence de limitation à 6 000 req/h. Mesurer le vrai
plafond exigerait l'extraction de masse que R3 interdit. L'extrapolation est donc marquée
`estimé chiffré`, et la marge est telle (facteur 27 entre 52 min et 24 h) que même une dégradation
d'un ordre de grandeur laisserait la réponse à `VRAIE`.

---

### Q4 — « L'outil d'estimation renvoie une distribution de marché, et non un prix ponctuel. »

**Verdict : NON TRANCHÉE pour l'outil public — VRAIE pour la primitive qu'il consomme.**

C'est la seule des cinq que je ne peux pas clore, et il faut être précis sur **quelle** mesure
manque et **pourquoi elle est hors d'atteinte**.

**Ce qui est prouvé, et qui est le plus important** : la primitive de valorisation d'AutoScout24
rend bien une **distribution bornée**, et non un scalaire. `PriceEvaluationResponse` de la spec
OpenAPI publique de `C-02` renvoie `category` **et** `ranges`, tableau de
`PriceEvaluationRanges { category, minimum, maximum }`, avec pour exemple `10500`–`13500` et une
description explicite : « *the inclusive minimum price for this listing to be in this price range* ».
`PriceLabel` comptant 6 valeurs, la réponse porte jusqu'à **6 intervalles de prix bornés** pour une
configuration de véhicule donnée. **Prouvé par schéma**, hachage de spec vérifié.

**Ce qui n'est pas prouvé** : que l'outil public `/evaluationvoiture/` appelle cette primitive, et
ce qu'il en restitue. Éléments documentaires convergents mais insuffisants : les **8 champs de son
formulaire correspondent un pour un** aux champs requis par `POST /priceevaluation/{customerId}` ;
et le texte de la page annonce « *une estimation juste* », au singulier, sans aucun vocabulaire de
fourchette — recherche exécutée sur les 353 Ko servis : `minPrice`, `maxPrice`, `range`,
`fourchette` **tous absents**.

**Les deux mesures manquantes, et pourquoi elles sont hors d'atteinte :**

1. **L'URL de l'appel émis.** Elle est dans les *chunks* JavaScript sous
   `/assets/private-seller-price-estimation/_next/static/chunks/…`. **`/assets/` n'est couvert par
   aucune des 16 directives `Allow` du `robots.txt` belge**, et notre groupe est `Disallow: /`.
   Télécharger ces fichiers violerait E5. La mesure est techniquement triviale et **illicite pour
   cet agent** — c'est une limite de périmètre, pas de méthode. → A-3.
2. **Le résultat rendu.** Le formulaire exige une **adresse e-mail réelle** (`type=email`,
   obligatoire) et son envoi déclenche un message sortant. Soumettre exigerait de saisir une donnée
   personnelle et de déclencher un envoi : action à autorisation explicite, non accordée. → A-4.

---

### Q5 — « La surface autorisée est identique sur les autres TLD, donc H1 est servi par la même voie. »

**Verdict : FAUSSE quant à la surface — VRAIE quant à la voie.**

**Mesure qui l'établit** : 5 `robots.txt` relevés le 2026-09-07, tous HTTP 200.

*La voie est identique.* Les cinq fichiers portent le **même groupe multi-agents**
(`GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`, `CCBot` → `Disallow: /` suivi d'une
liste `Allow:` placée avant le `User-agent:` suivant). La mécanique juridique et technique — la
règle du chemin le plus long de la RFC 9309 § 2.2.2 — est **portable telle quelle sur les 5 pays**.

*La surface ne l'est pas.* Le nombre et le libellé des préfixes diffèrent sur chaque TLD :

| TLD | nb `Allow` | catalogue voiture | estimation | entreprise |
|---|---|---|---|---|
| BE | **17** | `/fr/voiture/` + `/nl/auto/` | `/evaluationvoiture/` + `/prijsschatting/` | `/fr/entreprise/` + `/nl/onderneming/` |
| DE | 10 | `/auto/` | `/fahrzeugbewertung/` | `/unternehmen/` |
| NL | 8 | `/auto/` | `/waardebepaling/` | `/bedrijf/` |
| FR | 5 | `/voiture/` | `/evaluation-du-vehicule/` | **aucun** |
| LU | 4 | `/voiture/` | **aucun** | **aucun** |

Trois conséquences opposables pour H1 : le préfixe est **une donnée de configuration par
marketplace**, pas une constante ; `C-58` **n'existe pas** sur la surface autorisée luxembourgeoise ;
et la Belgique est le TLD **le plus ouvert des cinq**, donc le périmètre prioritaire du projet est
aussi son terrain le plus favorable — ce n'est pas un hasard heureux à ignorer, c'est un argument
pour ne pas chercher ailleurs une surface qui y serait meilleure.

---

## ACTIONS-COMMANDITAIRE

Ce que seul le commanditaire peut faire, classé par valeur décroissante pour la décision.
Aucune de ces actions n'a été tentée : elles violeraient E1, E5 ou R3.

| # | Action | Pourquoi elle m'est interdite | Ce qu'elle débloque | Effort / coût |
|---|---|---|---|---|
| **A-1** | **Demander à AutoScout24 l'activation de `POST /priceevaluation/{customerId}`** et un jeu d'identifiants `basicAuth` de test. La spec le dit elle-même : « *contact AutoScout24 to have it activated* ». | Exige un compte concessionnaire et des identifiants (E1, R2). | **La voie la plus prometteuse de tout ce lot pour le mode 2.** Interrogé sur une grille année × kilométrage × puissance, cet endpoint reconstruirait une **surface de prix de marché bornée**, calculée par AS24 sur sa propre base — donc **sans le biais publicitaire de `C-14`**. C'est le seul candidat instruit ici qui résoudrait le verrou du mode 2. | 1 courriel + une négociation commerciale. Coût **inconnu**, à obtenir. |
| **A-2** | Fournir les **identifiants d'un compte concessionnaire** (ou obtenir un accès en bac à sable) pour exécuter `GET /statistics/{customerId}/listings` et `GET /customers/{id}/listings`. | 401 mesuré ; l'accès exige des identifiants (E1, R2). | Tranche la 2ᵉ question falsifiable de `C-85` : la donnée transmise aux prestataires est-elle au niveau **annonce** ou seulement statistique par client ? La forme du chemin (`/statistics/{customerId}/…`) suggère « par client », mais la réponse n'est pas mesurée. | Dépend d'un partenariat ; 0 € si un concessionnaire ami accepte. |
| **A-3** | Télécharger et analyser les *chunks* JavaScript de `/assets/private-seller-price-estimation/_next/static/chunks/` pour y lire l'URL et le contrat de l'appel de valorisation. | **`/assets/` est hors des 16 préfixes `Allow`** ; notre groupe est `Disallow: /`. Violerait E5. | Clôt Q4 pour l'outil public, et dirait si un endpoint de valorisation est joignable sans compte. **Attention** : le commanditaire y sera soumis au même `robots.txt` — l'action n'est « déblocable » que parce qu'un humain naviguant n'est pas un crawler, pas parce que la règle changerait. | 1 heure. 0 €. |
| **A-4** | Soumettre **une fois** le formulaire de `/evaluationvoiture/` avec une adresse e-mail réelle et un véhicule réel, et **capturer l'appel réseau dans l'onglet Réseau du navigateur**, puis rapporter la forme du résultat (point unique ou fourchette). | Saisie d'une donnée personnelle + soumission de formulaire + déclenchement d'un envoi sortant : action à autorisation explicite, non accordée. Recoupe aussi `C-66` (rejeu XHR). | Clôt définitivement Q4, et mesure ce que l'outil rend vraiment à un particulier. | 10 minutes. 0 €. |
| **A-5** | Lire les **CGU grand public belges** et les `Voorwaarden` / `Conditions` de `autoscout24.be`. | Le chemin n'a pas été identifié dans les 16 préfixes `Allow` ; je n'ai pas sondé hors périmètre pour le chercher. *(Note R6 : le texte pro sous `/fr/entreprise/` relève de `LOT-K`, pas de moi.)* | Comble le trou nommé de l'axe A11 de `C-14` : le régime contractuel réellement opposable à un tiers non signataire des `Händler-AGB`. | 1 heure. 0 €. |
| **A-6** | **Échantillonner la même URL catalogue une fois par heure pendant 7 jours** (168 requêtes sur `/fr/voiture/opel/opel-corsa/`, plus le pendant `nl`), et compter la croissance de l'union des identifiants. | Deux obstacles : R3 (168 requêtes dépassent mon plafond de 60) et surtout la **durée** — un agent à session unique ne peut pas produire une série temporelle de 7 jours. | **La seule mesure qui pourrait encore sauver partiellement le mode 2.** Si le vivier de 25 se renouvelle intégralement chaque jour, 30 jours de collecte donneraient ~750 annonces par modèle, soit 59 % d'un segment comme Corsa — et le biais `T50`, s'il porte sur un vivier tournant, se diluerait. Si le vivier persiste, `C-14` est **définitivement** clos pour le mode 2. La mesure est binaire et décisive. | 1 tâche planifiée, 7 jours d'attente. ~0 €. |
| **A-7** | Sonder les pages catalogue de **DE, NL, FR, LU** sur leurs préfixes autorisés respectifs (§ T1.2) et y rejouer le protocole de représentativité. | Budget de 60 requêtes épuisé à 52 ; le protocole complet coûte ~15 requêtes par TLD. | Établit si le biais publicitaire est une politique de groupe ou une configuration belge, et si la taille du vivier varie. Dimensionne H1. | 1 heure d'exécution. 0 €. |

---

## Conformité

### E5 — périmètre des requêtes

**Respectée. 52 requêtes, toutes justifiables une à une.**

| Domaine | Requêtes | Base de licéité |
|---|---|---|
| `www.autoscout24.be` | **41** | 5 sous `/fr/voiture/` (racine, marque, modèle, caractéristiques techniques), 30 sous `/fr/voiture/…` (pages modèle et rappels de tirage), 1 sous `/nl/auto/`, 1 sous `/evaluationvoiture/`, 1 sous `/prijsschatting/`, 1 sur `/robots.txt`, et 1 sur `/fr/voiture/opel/opel-corsa/page/2/` qui a rendu 404 — **toutes sous un préfixe `Allow` nommément accordé à `ClaudeBot`** |
| `www.autoscout24.fr` / `.de` / `.nl` / `.lu` | **1 chacun, 4 au total** | `/robots.txt` uniquement — fichier de contrôle de crawl, jamais soumis à ses propres directives, et explicitement prescrit par le mandat |
| `listing-creation.api.autoscout24.com` | **7** | Hôte distinct, **ne sert aucun `robots.txt`** (404 re-vérifié dans cette session) : aucune règle de crawl n'y est déclarée. Raisonnement déjà validé par `AS24-REFERENCE-API.md` |
| `www.autoscout24.com` | **0** | — |

**Zéro requête** vers `/lst`, `/fr/lst/`, `/fr/offres/`, `/_next/data/`, `/assets/`, un endpoint
interne, ou tout chemin hors des 16 préfixes `Allow`. Les URL `/fr/lst/…` citées au § T2.4 ont été
**lues dans le JSON d'une page autorisée**, jamais appelées. Les *chunks* JavaScript du § T5.3
étaient nécessaires pour clore Q4 : je ne les ai **pas** téléchargés, et j'ai porté la question en
`NON TRANCHÉE` plutôt que de dépasser le périmètre — c'est le seul endroit où E5 m'a coûté un
verdict, et je le déclare.

### E1 / R2 — comptes et credentials

**Respectée.** Aucun compte créé. Aucun credential saisi, ni sur AutoScout24 ni ailleurs. Aucune
donnée personnelle saisie : le formulaire de `/evaluationvoiture/` a été **cartographié par lecture
du HTML servi**, jamais rempli ni soumis. Les 3 réponses `401` de `listing-creation.api` ont été
obtenues **sans** tentative d'authentification — aucun en-tête `Authorization` n'a été émis, aucune
paire identifiant/mot de passe devinée. Tout ce qui exige un compte est consigné en
`ACTIONS-COMMANDITAIRE` (A-1, A-2, A-4).

### R3 — pas de volumétrie

**Respectée. 52 requêtes sur un plafond de 60, temporisation 600 ms avant chaque appel** (au-dessus
du minimum de 500 ms exigé), soit un débit moyen de 3,2 requêtes/minute sur 16 min 19 s.

Les données collectées ne constituent pas une extraction : **au total 74 annonces distinctes** —
31 Opel Corsa, 23 Opel Frontera, 34 sur la page marque (avec recouvrement), plus les 48 annonces des
6 segments exhaustifs — sur un inventaire national mesuré à **121 710**, soit **0,06 %**. Aucune
donnée n'a été persistée dans le dépôt : les corps HTML et JSON bruts sont dans le scratchpad de
session. Aucun champ identifiant de vendeur (`seller.contactName`, `seller.companyName`,
`seller.id`) n'est reproduit dans ce rapport, **à une exception assumée** : le nom
un vendeur professionnel (nom anonymisé, désigné « vendeur-α »), déjà publié dans `FINDING-allowed-surface.md`, est cité au § V.7 parce qu'il
constitue l'unique mesure de rotation à 24 h dont ce lot dispose. Point à signaler pour le nettoyage
RGPD du dépôt (règle R3 de `00-CONTEXT.md`) : **deux documents du dépôt portent désormais ce nom**,
et ils devraient l'un et l'autre l'anonymiser une fois la mesure consignée.

Les 12 pages modèle du § V.2 ont été récoltées à des fins de **mesure de taux de base**, pas de
collecte : c'est précisément la sonde unitaire que R3 autorise, répétée sur des segments choisis
pour leur propriété statistique.

### R1 — traçabilité et taux de cellules non vérifiées

**56 cellules A1–A14 renseignées** (4 candidats × 14). Aucune cellule vide.

| Candidat | cellules `[NON VÉRIFIÉ]` | taux | seuil S3 (25 %) |
|---|---|---|---|
| `C-14` | **0** | **0 %** | conforme |
| `C-02` | **0** | **0 %** | conforme |
| `C-58` | **3** (A2, A6, A9) | **21,4 %** | conforme, de justesse |
| `C-52` | **0** | **0 %** | conforme |
| **Total** | **3 / 56** | **5,4 %** | conforme |

Les 3 cellules non vérifiées de `C-58` sont toutes des conséquences directes d'une **seule** cause,
nommée et non contournable : l'appel émis par le formulaire n'est pas identifiable sans télécharger
des actifs sous `/assets/`, hors périmètre E5. Coût, quota et effort d'intégration d'un endpoint
inconnu ne peuvent pas être chiffrés — les porter serait du guessing, ce que R1 proscrit.
Quatre autres cellules portent une réserve partielle explicite (`C-14` A4 et A6, `C-02` A6,
`C-58` A5) : la mesure existe, sa borne supérieure non.

Cinq cellules sont marquées **`n/a` et non `[NON VÉRIFIÉ]`** : A2/A3/A13/A14 de `C-52` et A13 de
`C-02`. Ce n'est pas un contournement du décompte — c'est la différence entre « non mesuré » et
« sans objet » : un `robots.txt` n'a pas de coût par millier d'annonces parce qu'il ne rend aucune
annonce, ce qui est **prouvé**, pas supposé.

### R6 — pas de conclusion sur le lot d'autrui

Ce rapport produit des éléments qui **servent** d'autres lots — `C-81` et `C-85` (§ T6.3),
`C-12` (§ T2.4), `C-86` (volume national du § T2.1), `C-09` à `C-13` (§ T1.4), `LOT-H` (§ T4.1) —
et il les marque comme **éléments transmis**, jamais comme verdicts. Aucun candidat hors
`C-14`, `C-58`, `C-02`, `C-52` ne reçoit de note ni de verdict dans ce document.

---

## Corrections à porter aux documents existants

Ces corrections découlent de mesures de ce rapport et sont directement intégrables par
`compile-1` en phase 1.6.

| Cible | Correction | Preuve |
|---|---|---|
| `FINDING-allowed-surface.md` § 2.1 | **`listingsCount` est inerte** (0 pour les 32 modèles Opel). Ce n'est pas l'agrégat du mode 1 ; l'agrégat est `listings.metadata.totalItems`, à une requête par segment. | § V.0 |
| `FINDING-allowed-surface.md` § 2.2 | `priceInfo` est de **niveau modèle** : vide sur la page marque. | § V.0 |
| `FINDING-allowed-surface.md` § 2.3 | Le chemin des champs d'annonce est `listings.listings[i].details.*`, non `listings.listings[i].*`. Deux champs manquent à l'inventaire : `adProduct.appliedTier` et la sémantique `PriceLabel` de `prices.public.evaluation.category`. `media.images` est tronqué à 5. | § T2.2 |
| `FINDING-allowed-surface.md` P1 | Plafond réel **~25 par modèle et par langue**, ~31 en bilingue, et non 20 ; couverture nationale extrapolée **≈ 124 000** et non ~99 000. | § V.4 |
| `FINDING-allowed-surface.md` P2 | **Résolue.** Le biais est prouvé et quantifié ; la mention `[NON VÉRIFIÉ]` tombe. | § V |
| `FINDING-allowed-surface.md` P5 | Volume du snapshot : **412 Mo**, non 2,3 Go (le calcul original utilisait la taille décompressée). Débit soutenable : **~6 000 req/h**, snapshot en **52 min**. | § T4.2 |
| `AS24-REFERENCE-API.md` L3 | **Partiellement levée** : `makeSlug`, `modelSlug`, `modelVersionSlug` et `topModels[].slug` sont servis par la surface autorisée. Les slugs de `taxonomy.json` peuvent être remplacés par des slugs prouvés. | § T2.3 |
| `AS24-REFERENCE-API.md` L4 | **Infirmée** : le niveau génération **et** version est public — 17 générations et 270 versions pour la seule Opel Corsa, avec `generationId` et années de production. | § T2.3 |
| `AS24-REFERENCE-API.md` L7 | **Partiellement levée** : les codes de paramètres d'URL du moteur de recherche (`cy`, `custtype`, `sort`, `ot_`, `bt_`, `ft_`, `bc_`, `cit_`, `zipr`) sont lisibles dans `listPageInfo` et `interlinking` d'une page autorisée. Niveau de preuve `prouvé`, non plus `source tierce`. | § T2.4 |
| `AS24-REFERENCE-API.md` — endpoints | Ajouter **`GET /seals` (200, sans authentification)**, troisième endpoint ouvert : 251 labels de certification, et la liste mesurée des **11 locales / 9 pays** d'AutoScout24. | § T6.1 |
| `AS24-REFERENCE-API.md` L1 | **Confirmée par test direct** et non plus par lecture de portée : les 3 opérations de lecture d'inventaire rendent 401. | § T6.1 |
| `00-CONTEXT.md` H5 | **Confirmée et resserrée** : l'inventaire BE mesuré vaut **121 710** annonces, soit 1,2 × 10⁵, dans la bande postulée de 10⁴–10⁶. | § T2.1 |
| `candidates-final.md` `C-86` | La référence « ~115 000 annonces annoncées par AS24 BE » devient **121 710, mesurée**. | § T2.1 |
| `candidates-final.md` `C-58` | Le candidat doit être **fusionné dans `C-02`** : la distribution de prix qu'il postule existe, mais derrière `POST /priceevaluation/{customerId}`, pas derrière le formulaire public. | § T5.4, § T6.2 |
