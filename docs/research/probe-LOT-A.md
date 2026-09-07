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

<!-- JOURNAL-ANCHOR -->

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
| **~1 s**, clé de cache identique | `corsa_ctl` contre `corsa_p2` | **identiques**, 20/20, même ordre — le tirage est mémorisé par le cache |
| **~1 s**, clé de cache distincte | `corsa_ctl` contre `corsa_ft` | **différents** — un nouveau rendu tire un nouvel échantillon |
| **~7 min** | `corsa_fr_1` contre `corsa_ctl` | recouvrement **15/20**, soit **5 annonces nouvelles** |
| **~15 min à 1 h** | 8 tirages `?kycar=1…8` | **+0 annonce nouvelle** — le vivier de 25 est clos |
| **~24 h** | le vendeur « Youssef Yaghzar », relevé le 2026-09-06 par `FINDING-allowed-surface.md` sur `/fr/voiture/opel/`, est **toujours servi** le 2026-09-07, passé de la position 0 à la position 1 | rotation **partielle** : l'ordre bouge, la composition persiste |

La rotation observée relève du **ré-ordonnancement, pas du ré-échantillonnage**.
`FINDING-allowed-surface.md` posait l'hypothèse que rappeler la même URL à plusieurs heures
d'intervalle pourrait faire tourner l'échantillon assez pour reconstruire la population. **Cette
hypothèse est infirmée à l'échelle de l'heure** (Chao1, 8 tirages, zéro nouvelle annonce) et
**non tranchée à l'échelle du jour et de la semaine** : à 24 h le vivier n'est pas identique, mais il
n'est pas renouvelé. Ce qu'il faudrait pour trancher est nommé en `ACTIONS-COMMANDITAIRE` (A-6).

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
