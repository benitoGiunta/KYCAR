# probe-LOT-J — Archives, index et caches tiers

**Agent** : `probe-J`, phase 1.4 du `PLAN-1-data-acquisition.md`.
**Candidats** : `C-53` (Wayback), `C-54` (Common Crawl), `C-55` (API d'index), `C-71` (urlscan.io), `C-72` (HTTP Archive).
**Propriété du lot** : aucun test ne touche `www.autoscout24.be` ni `.com`. E5 non contraignante.
**Date d'exécution** : 2026-09-07.

---

## Journal de preuve

Chaque ligne est rejouable telle quelle par l'auditeur de la phase 1.5.

| # | Domaine | Commande | Résultat |
|---|---|---|---|
| J01 | web.archive.org | `curl -s "https://web.archive.org/cdx/search/cdx?url=autoscout24.be&matchType=domain&showNumPages=true&pageSize=5"` | HTTP 200, réponse `133`. 133 pages de 5 blocs zipnum. |
| J02 | web.archive.org | idem `&output=json&fl=urlkey&pageSize=5&page={0,44,88,132}` (4 requêtes) | 24 791 / 32 221 / 33 620 / 19 893 lignes. Volume domaine estimé ≈ 3,7 M captures. Motifs de chemin dominants dans l'échantillon : `nl/lst`, `fr/lst`, `aboutus/fr-be`, `test/…`. |
| J03 | web.archive.org | `curl -s "https://web.archive.org/cdx/search/cdx?url=www.autoscout24.be/fr/offres/&matchType=prefix&output=json&fl=timestamp,original,statuscode,mimetype,length"` | HTTP 200, 54,9 Mo, **291 366 captures**. |
| J04 | web.archive.org | idem avec `url=www.autoscout24.be/nl/aanbod/` | HTTP 200, 61,6 Mo, **328 989 captures**. |
| J05 | web.archive.org | idem avec `url=www.autoscout24.be/offres/` puis `/aanbod/`, `/annonces/`, `/fr/aanbod/` (4 requêtes) | 8 / 0 / 0 / 0 captures. Les seuls deux motifs de page d'offre sont `/fr/offres/` et `/nl/aanbod/`. |
| J06 | web.archive.org | `curl -sL "https://web.archive.org/web/{20190718153029,20210125142540,20260104021807,20171210093623}id_/<url d'offre>"` (4 requêtes) | HTTP 200 : 95 743 / 95 906 / 125 862 / 51 065 o. `__NEXT_DATA__` présent **uniquement** dans le snapshot 2026. |
| J07 | web.archive.org | 7 snapshots, un par semestre de `202201` à `202501` (7 requêtes) | HTTP 200 sur les 7. `__NEXT_DATA__` **présent sur les 7**. |
| J08 | web.archive.org | 4 snapshots `202105`, `202108`, `202110`, `202111` (4 requêtes) | HTTP 200 sur les 4, `__NEXT_DATA__` **absent sur les 4**. Encadre la migration Next.js : **entre 2021-11-27 et 2022-01-18**. |
| J09 | local | parse JSON des blocs `__NEXT_DATA__` de `202201`, `202307`, `202601` | Parse `OK` pour les 3. 88 887 / 53 621 / 85 053 octets. `props.pageProps.listingDetails` : 29 / 37 / 43 clés, 262 / 406 / 547 feuilles scalaires. |

---

## Verdict sur la profondeur historique

**C'est la section dimensionnante du lot. Réponse : oui, la série temporelle de prix est
reconstructible, sur environ 35 000 annonces, et elle est déjà prouvée sur un cas concret.**

### 1. Comptes de captures — pages d'offre uniquement

Motif d'URL de page de détail : `www.autoscout24.be/fr/offres/…` et `www.autoscout24.be/nl/aanbod/…`.
Les trois autres motifs testés (`/offres/`, `/aanbod/`, `/annonces/` sans préfixe de langue) sont
vides ou quasi vides — 8 captures au total, ligne J05.

| Grandeur | `/fr/offres/` | `/nl/aanbod/` | Total |
|---|---|---|---|
| Captures indexées au CDX | 291 366 | 328 989 | **620 355** |
| dont HTTP 200 | 250 351 | 278 918 | **529 269** |
| dont 308 / 301 (redirection) | 22 785 | 27 791 | 50 576 |
| dont `warc/revisit` (contenu identique, dédupliqué) | 14 463 | 18 102 | 32 565 |
| dont **410 Gone** (annonce retirée) | 3 597 | 4 007 | **7 604** |
| dont 404 | 139 | 143 | 282 |
| URL distinctes (query retirée) | 113 317 | 113 599 | 226 916 |
| URL distinctes portant au moins un HTTP 200 | 103 176 | 102 803 | 205 979 |

Le compte qui compte n'est pas l'URL mais **l'annonce** : une même annonce existe en `fr` et en `nl`,
et son UUID est stable dans les deux. Après jointure sur l'UUID :

- **131 287 annonces distinctes** ont au moins une capture HTTP 200 ;
- 100 546 apparaissent côté `fr`, 99 864 côté `nl`, **69 123 dans les deux langues** — le
  recoupement bilingue **augmente mécaniquement la densité temporelle** de ces 69 123 annonces,
  puisque les deux versions sont capturées à des dates différentes.

Ordre de grandeur de référence : `FINDING-allowed-surface.md` situe l'inventaire BE courant à
environ 115 000 annonces. Le stock historique Wayback (131 287 annonces) est donc du même ordre de
grandeur que l'inventaire vivant d'un instant donné — mais étalé sur neuf ans, donc il ne s'y
substitue pas.

### 2. Profondeur

- Capture d'offre la plus ancienne : **2017-11-16 13:17:16 UTC**.
- Capture la plus récente au moment de la sonde : **2026-09-06 13:14:41 UTC**.
- **Profondeur brute : 8 ans et 10 mois, soit 3 217 jours.**

Distribution annuelle des captures, `fr` + `nl` :

| Année | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 (9 mois) |
|---|---|---|---|---|---|---|---|---|---|---|
| Captures | 195 | 433 | 6 031 | 5 826 | 9 627 | 25 817 | 42 788 | 55 019 | 97 237 | **377 382** |

La croissance est de trois ordres de grandeur entre 2017 et 2026. **La profondeur exploitable
réelle n'est pas 2017 mais 2022** : les cinq premières années ne pèsent que 22 112 captures, soit
**3,6 %** du total. 96,4 % du corpus est postérieur à janvier 2022.

Détail mensuel 2026, captures HTTP 200 : 01 → 48 351, 02 → 60 680, 03 → 75 251, 04 → 47 150,
05 → **129**, 06 → 33 944, 07 → 20 196, 08 → 9 048, 09 → 87. Le trou de mai 2026 — 129 captures
contre environ 50 000 les mois voisins — et la décroissance de juin à septembre sont des
**discontinuités d'archivage non contractuelles** : la source est un tiers bénévole, pas un flux.
C'est le risque A12 principal du candidat.

### 3. Densité temporelle — mesurée par annonce, en jours distincts

Sur les 131 287 annonces à au moins une capture 200, jointure bilingue faite, en comptant les
**jours de capture distincts** — deux captures le même jour ne font pas deux points de série :

| Nombre de jours de capture distincts | Nombre d'annonces |
|---|---|
| 1, aucune série possible | 96 262, soit 73,3 % |
| **au moins 2** | **35 025**, soit 26,7 % |
| au moins 3 | 20 546 |
| au moins 5 | 12 953 |
| au moins 10 | 6 258 |
| au moins 20 | 2 514 |

Sur les 35 025 annonces à au moins deux points :

- **étendue** (premier au dernier jour capturé) : médiane **15 jours**, moyenne 44 jours,
  p90 **109 jours**, maximum **1 860 jours**, soit 5 ans ;
- **intervalle entre deux captures consécutives**, 203 337 intervalles mesurés : médiane
  **1 jour**, moyenne 8 jours, p90 8 jours. **62,1 % des intervalles sont d'au plus 1 jour**,
  89,0 % d'au plus 7 jours, 95,0 % d'au plus 31 jours.

La densité est donc **très fine mais très courte** : quand une annonce est suivie, elle l'est
presque quotidiennement, mais le suivi ne dure typiquement que deux semaines.

Filtres de qualité pour une série de prix utilisable :

| Critère | Annonces éligibles |
|---|---|
| au moins 3 jours distincts **et** étendue d'au moins 30 jours | **7 629** |
| au moins 5 jours distincts **et** étendue d'au moins 60 jours | **2 692** |

### 4. Intégrité de `__NEXT_DATA__`

| Époque du snapshot | `__NEXT_DATA__` | Parse JSON | Clés `listingDetails` | Feuilles scalaires | Champs du dictionnaire cible retrouvés |
|---|---|---|---|---|---|
| 2017-12-10 | absent | — | — | — | via `title` et `meta description` seulement |
| 2019-07-18 | absent | — | — | — | idem |
| 2021-11-27 et avant | absent | — | — | — | idem |
| **2022-01-18** | présent | **OK** | 29 | 262 | **34 / 40** |
| 2023-07-29 | présent | **OK** | 37 | 406 | **37 / 40** |
| 2026-01-04 | présent | **OK** | 43 | 547 | **37 / 40** |

Les trois blocs parsent sans erreur : **aucune troncature**. Wayback conserve le HTML entier,
`__NEXT_DATA__` compris. Champs cibles non retrouvés dans `listingDetails` : `colour`,
`emissionClass`, `sellerType`. Pour ce dernier, `seller.type = "Dealer"` et `seller.isDealer`
existent, la cible est donc en réalité couverte sous un autre nom ; les deux autres sont à
chercher ailleurs dans le payload et restent `[NON VÉRIFIÉ]`.

Deux champs du payload archivé changent la portée du candidat.

- **`listingDetails.createdTimestampWithOffset`** — relevé `2024-05-02T15:16:08.781Z` sur une
  capture du 2026-01-04. C'est la **date de publication de l'annonce**. Elle est donc lisible sur
  une capture *unique* : même les 96 262 annonces à un seul point donnent leur âge de mise en
  ligne. Ce champ n'apparaît qu'à l'époque récente : il est absent de la liste des clés de 2022 et
  de 2023.
- **`listingDetails.seller.contactName`** — relevé `Patrick Merckx`. Le corpus archivé porte donc
  les mêmes données personnelles que la source vivante : la règle RGPD R3 s'applique identiquement
  à l'ingestion depuis Wayback.

### 5. Preuve directe qu'une série de prix existe

Annonce `ff6d1319-85be-4e8e-bdf0-bb08d5570e6f`, Ford Escort Cabrio, 95 000 km, 02/1995 :

| Date de capture | Langue | Prix lu dans `meta name="description"` |
|---|---|---|
| 2019-07-18 | fr | **1 550 €** |
| 2021-01-25 | nl | **999 €** |

Même annonce, même kilométrage, **−35,5 % de prix affiché sur 18 mois**, sur deux captures d'un
corpus antérieur à Next.js. C'est la démonstration que la décote *observée*, et non modélisée, est
mesurable par cette voie. Cette même annonce compte plus de dix captures étalées de 2019-07 à
2021-01.

### 6. Le prix est lisible sur toute la profondeur, y compris avant Next.js

Point non anticipé par le mandat, et il déplace la conclusion : les pages antérieures à Next.js
n'ont pas de `__NEXT_DATA__` mais elles portent le prix, le kilométrage, la première
immatriculation, la carrosserie, le carburant, le modèle et la ville **dans le `title` et le
`meta name="description"`**, dans un format constant.

- 2017 : `Trouvez votre occasion Audi QUATTRO à Arlon: Break | € 58.900,- | 16.289 km | 09/2016 | Diesel`
- 2019 : `Trouvez votre occasion Ford Escort à Norderstedt: Cabriolet | € 1.550,- | 95.000 km | 02/1995 | Essence`
- 2021 : `Vind uw tweedehands Ford Escort in Norderstedt: Cabriolet | € 999,- | 95.000 km | 02/1995 | Benzine`
- 2026 : `Trouve ta Abarth 124 Spider voiture de démonstration à Alleur : Cabriolet | € 31 …`

Le seul bloc `application/ld+json` de ces pages est un `@type: Organization` — AutoScout24
lui-même — et **pas un `Vehicle`** : il n'y a rien à en tirer. Mais la balise `description` suffit
à environ 7 champs, sur la totalité des 3 217 jours, et se lit dans le premier kilo-octet du
document, donc à coût de transfert quasi nul si l'on utilise une requête `Range`.
**`[NON VÉRIFIÉ]` : le support de l'en-tête `Range` par `web.archive.org` n'a pas été testé.**

### 7. Signal de vitesse d'écoulement — sous-produit du code 410

7 604 captures répondent **410 Gone** : AutoScout24 sert un 410 explicite quand l'annonce est
retirée. Croisé avec les captures 200 :

- **2 388 annonces** ont à la fois une capture 200 et une capture 410 ou 404 ;
- **2 270** ont leur premier 410 postérieur à leur dernier 200 — cas exploitable ;
- **fenêtre d'incertitude** sur la date de retrait, dernier 200 au premier 410 : médiane
  **1 jour**, p90 20 jours ; 1 871 cas à 7 jours ou moins, 2 106 à 31 jours ou moins ;
- **durée observée sur le marché**, premier 200 au premier 410, borne inférieure : médiane
  **10 jours**, p90 **57 jours**.

Combiné à `createdTimestampWithOffset`, cela donne une **durée de vie d'annonce vraie**, à un jour
près pour la médiane des 2 270 cas. Aucune autre voie du registre ne produit cette grandeur.

### 8. Verdict chiffré

| Question | Réponse mesurée |
|---|---|
| Combien de captures de pages d'offre ? | **620 355**, dont **529 269** en HTTP 200 |
| Combien d'annonces distinctes ? | **131 287** avec au moins un HTTP 200 |
| Sur quelle profondeur ? | **2017-11-16 au 2026-09-06**, soit 3 217 jours ; mais **96,4 % du corpus est postérieur à 2022-01** |
| À quelle densité ? | intervalle médian entre captures d'une même annonce : **1 jour** ; 89 % des intervalles d'au plus 7 jours ; étendue médiane de suivi : **15 jours** |
| `__NEXT_DATA__` intact ? | **Oui**, parse OK sur 3 snapshots d'époques différentes, 34 à 37 champs cibles sur 40. Présent à partir de la migration Next.js, encadrée entre **2021-11-27 et 2022-01-18** |
| Série de prix reconstructible ? | **OUI.** **35 025 annonces** à au moins 2 points, **20 546** à au moins 3, **7 629** à au moins 3 points sur au moins 30 jours, **2 692** à au moins 5 points sur au moins 60 jours. Prouvé sur un cas réel : −35,5 % en 18 mois |
| Ce que ce n'est pas | **Pas un panel représentatif.** 131 287 annonces sur neuf ans face à environ 115 000 annonces vivantes à un instant t : le taux de couverture instantané est de l'ordre du pourcent. Le biais de sélection — qui archive, et quoi — est **non mesuré** et probablement fort : les trois annonces les plus capturées sont des Audi RS6, Audi RS3 et BMW 730, c'est-à-dire du haut de gamme, pas la médiane du marché belge |

**Conclusion opérationnelle** : Wayback ne donne pas un inventaire, il donne un **panel
longitudinal non représentatif d'environ 35 000 annonces**. C'est inutilisable pour le mode 1 de
KYCAR — les agrégats de marché — et sans équivalent pour un axe d'analyse qui ne figure pas encore
au cahier des charges : décote observée, durée de vie d'annonce, écart entre prix d'affichage
initial et prix de retrait. La valeur du candidat est **analytique, pas volumétrique**, à condition
de traiter le biais, ce qui exige un dénominateur externe — `LOT-Q`.
