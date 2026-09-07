# Audit du cluster décisif — LOT-A, LOT-N, DECISION-coordinateur-source

**Agent** : `audit-1`, phase 1.5 de `PLAN-1-data-acquisition.md`
**Date** : 2026-09-07
**Périmètre** : le verdict de biais de LOT-A (`p<10⁻²⁰`, ferme le mode 2 sur AS24), le verdict de repli 2dehands de LOT-N (source de production retenue), et la DÉCISION de coordinateur qui s'appuie sur les deux.
**Contraintes respectées** : E5 (AS24 seulement sur les préfixes autorisés — `/fr/voiture/`), robots.txt 2dehands (`/l/auto-s/` autorisé, `/lrp/api/` interdit — non touchée). Plafond 25 requêtes.

> Document écrit au fur et à mesure. Chaque constat est typé `OK` / `FAUX` / `NON PROUVÉ` / `SOUS-ESTIMÉ` / `SUR-ESTIMÉ`.

---

## Divergences repérées à la lecture (avant tests)

1. **Le compteur 2dehands n'est pas le même dans les deux documents portants.** LOT-N écrit `totalResultCount = 100 200` (constat no 2, ligne 39 ; axe A13, ligne 89). La DÉCISION écrit `100 188` (ligne 32). Écart de 12. À trancher par mesure directe (test rejoué 1).
2. LOT-N affirme « ≥ 25 des 40 champs cibles » depuis la seule page de recherche. À recompter contre la liste réellement présente (test rejoué 2).

---

## AUDIT LOT-A — le verdict de biais qui ferme le mode 2 sur AS24

### A-1. Le protocole d'auto-échantillonnage est-il circulaire ? → **OK (valide, non circulaire)**
L'idée « tout segment `totalItems ≤ 20` est servi exhaustivement, donc la page *est* la population »
est **légitime** et **vérifiable** : ce n'est pas une hypothèse, c'est une identité mesurable
(`servies == totalItems`). Je l'ai rejouée (voir Tests rejoués T-A1) : `opel-gt` (12/12) et
`opel-tigra` (19/19) sont bien servis exhaustivement. Le taux de base est donc mesuré **contre la
source elle-même**, sans population de référence externe — il n'y a pas de cercle. La seule réserve,
que LOT-A **pose lui-même** (§ V.2), est que ces segments exhaustifs sont des modèles rares/anciens
où le taux de base *en niveau* (T50 = 2,1 %) peut ne pas valoir pour les modèles populaires. Réserve
correctement portée, et neutralisée par la mesure 2 qui n'utilise aucun taux de base.

### A-2. Les 3 mesures sont-elles indépendantes ? → **SUR-ESTIMÉ (partiellement redondantes, mais la conclusion tient)**
- **Dose-réponse (V.3)** : véritablement indépendante — n'a besoin d'aucun taux de base externe.
  C'est la jambe porteuse, et elle est réfutable. **Reproduite** (corsa 90 % T50 sous 1,6 %
  d'échantillonnage vs gt/tigra 0–8 % T50 en population).
- **Chao1 (V.4)** : mesure un objet **différent** (saturation du vivier ré-tirable via `?kycar`),
  pas le biais de tier. Usage de bord : avec `f1=0` l'estimateur retombe à `S_obs` par construction
  (et `f2=0` rendrait la formule indéfinie sans ce fait) — techniquement valable mais c'est une
  saturation de **ré-tirage de cache**, pas une estimation de l'univers réel. LOT-A l'énonce
  correctement.
- **Binomial (V.5)** : **n'est pas indépendant** — il réutilise le taux de base de la mesure 1
  (p = 2,1 %) et le vivier saturé de la mesure 3 (23 T50/25). MAIS LOT-A le rend robuste en testant
  p = 2,1 / 10 / 30 / 50 % et rejette H0 même à p = 50 % (9,7×10⁻⁶). Donc la conclusion ne dépend pas
  de l'estimation du taux de base. **Constat** : ce ne sont pas « 3 confirmations indépendantes du
  même chiffre » — c'est **1 cœur indépendant (dose-réponse) + 1 plafond + 1 test de significativité
  robuste réutilisant les deux**. Le texte de LOT-A reste honnête là-dessus ; la formule
  « trois mesures indépendantes » (§ V.1) est le seul point survendu.

### A-3. Le `p < 10⁻²⁰` est-il justifié ? → **OK**
Il correspond à l'hypothèse p = 10 % (2,5×10⁻²¹) et est écrasé à 7,4×10⁻³⁷ au taux de base mesuré.
Même à une part de T50 en population de 30 % (défavorable), on a 1,4×10⁻¹⁰. Le seuil `<10⁻²⁰` est
donc **atteint dès qu'on suppose la part de T50 ≤ ~10 %**, ce qui est très conservateur au vu des
segments exhaustifs (0–8 %). Défendable.

### A-4. Anti-bot AS24 sur la surface autorisée → **OK**
Rejoué : 3 réponses `/fr/voiture/opel/…`, **zéro cookie `_abck`/`ak_bmsc`/`datadome`**. Concorde avec
LOT-A. (Nuance déjà portée par LOT-A : le mur Akamai est sur `/lst`, hors surface autorisée.)

### A-5. E5 → **OK** — toutes mes sondes AS24 sous `/fr/voiture/` (préfixe autorisé). 0 requête hors surface.

**Verdict LOT-A : le protocole est valide et le verdict de biais se reproduit.** Le mode 2 est bien
fermé sur la surface AS24 autorisée. Seul défaut : la qualification « 3 mesures indépendantes » est
optimiste (le binomial est dérivé). N'affecte pas la conclusion.

---

## AUDIT LOT-N + DÉCISION — 2dehands comme source de production

### N-1. `totalResultCount` réel → **SUR-ESTIMÉ (sur la précision), OK sur l'ordre de grandeur**
Relevé par moi-même : `GET /l/auto-s/` → HTTP 200 → **`totalResultCount = 100186`**.
LOT-N cite `100 200`, la DÉCISION cite `100 188`, je mesure `100 186`. **Trois valeurs différentes**
pour un compteur vivant qui fluctue à ±quelques dizaines. L'ordre de grandeur (~100 k) est **solide
et confirmé** ; les chiffres précis cités sont **non reproductibles à l'unité** et n'auraient pas dû
être écrits avec 5-6 chiffres significatifs sans mention de volatilité. Correction : écrire
« ~100 200 (compteur vivant, ±0,02 %) ».

### N-2. Absence d'anti-bot → **OK (confirmé)**
Headers relevés : `Set-Cookie: MpSession=…` + `luckynumber=…` (cookies de session ordinaires),
`X-Cache: Miss from cloudfront`. **Aucun** `_abck` / `ak_bmsc` / `datadome` / `cf_challenge` ; 0
marqueur `challenge-platform` / `just a moment` / `captcha` dans le corps. Confirmé sur 5 pages
(`/l/auto-s/`, p2, p5, sort). C'est l'écart réel et vérifié avec AS24.

### N-3. Licéité (`robots.txt`) → **OK (confirmé, relu moi-même)**
`robots.txt` (3617 o) relu intégralement. `/l/auto-s/` **n'est capturé par aucun `Disallow`**. Les
`Disallow` pertinents visent bien `/lrp/api/search*`, `/lp/api/listings*` (API interne) et
`/u/*/*/l/*` (listings de profil) — non touchés. La pagination `/l/auto-s/p/N/` n'est matchée par
aucune règle non plus. La DÉCISION décrit correctement ces règles. **2dehands `/l/auto-s/` est
licite.** (Note : le fichier porte un `Sitemap:` — non signalé par LOT-N, sans incidence.)

### N-4. Couverture de champs « ≥ 25/40 » → **OK comme UNION de page / SOUS-ESTIMÉ par annonce / une erreur ponctuelle**
Mesuré sur les 30 annonces de `/l/auto-s/` (parsing `__NEXT_DATA__`) :
- **Union des clés d'attributs sur la page = 24 clés structurées distinctes** (`attributes` ∪
  `extendedAttributes`), + ~7 champs top-level mappables (`itemId`→listingId, `vipUrl`→listingUrl,
  `priceInfo.priceCents`→priceEur, `location`→region, `date`→fraîcheur, `napAvailable`, `title`).
  Donc **~28-31 champs cibles mappables en UNION de page** : le « ≥ 25/40 » est **exact, même
  légèrement conservateur, SI on l'entend comme union de page**.
- **MAIS par annonce individuelle** : distribution des attributs structurés par annonce =
  min 5, **médiane 12**, max 13. Le « 25 » n'est **jamais** atteint sur une seule annonce ; il n'est
  atteint qu'en agrégeant 30 annonces dont les `extendedAttributes` sont **épars** (chaque vendeur ne
  remplit que ce qu'il veut). Le mandat demandait « les champs présents sur UNE annonce » : c'est
  **~12 structurés + ~7 top-level ≈ 19**, et bien moins sur l'annonce la plus pauvre.
- **Erreur ponctuelle FAUSSE** : LOT-N (constat no 2) et la grille A3 listent **`brand`/`makeName`**
  comme champ relevé. **`brand` n'est une clé d'attribut sur AUCUNE des 30 annonces (0/30).** La
  marque n'est **pas** un champ structuré : elle se lit dans `title` (« Mercedes A180 », « VW POLO… »).
  Mappable par parsing, mais pas « présent » comme le texte l'affirme.
- **Champ RGPD/H3 load-bearing surestimé** : `advertiser` (Particulier/Bedrijf), présenté comme
  satisfaisant H3, n'est peuplé que sur **10/30 annonces (33 %)** en page 1 (11/30 p2, 16/30 p5).
  Ce n'est **pas** un champ universel — H3 n'est satisfait que pour ~1/3 à ~1/2 des annonces sur
  cette voie. **SOUS-ESTIMÉ le risque / SUR-ESTIMÉ la couverture.**

### N-5. 2dehands échappe-t-il au biais qui a tué le mode 2 sur AS24 ? → **NON PROUVÉ (le trou de l'audit)**
C'est le point le plus lourd. LOT-N et la DÉCISION adoptent 2dehands comme **source de production
mode 2**, précisément parce que le mode 2 est fermé sur AS24 *à cause du biais de produit
publicitaire*. **Or personne n'a appliqué à 2dehands le protocole de biais de LOT-A.** Mon
spot-check :
- **`priorityProduct = DAGTOPPER` (produit de promotion payant) sur 89/90 annonces** échantillonnées
  (page 1 : 29/30 ; page 2 : 30/30 ; page 5 : 30/30). La surface SEO licite sert donc, en profondeur,
  un flux quasi intégralement **promu**.
- Le **tri par défaut est `OPTIMIZED`** (qui remonte les DAGTOPPER). Les `sortOptions` disponibles
  incluent SORT_INDEX/PRICE/DATE, mais **le paramètre de tri URL est INERTE** sur la page SSR : après
  `?sortBy=SORT_INDEX&sortOrder=DECREASING`, le `sortOptions` appliqué reste vide et l'ordre ne change
  pas (29/30 DAGTOPPER). Re-trier vers un flux organique semble exiger l'API interne `/lrp/api/search`
  — **interdite**. C'est **exactement** la limitation qui a été jugée fatale sur AS24 (paramètres
  inertes sur la surface autorisée, tri/échantillon non contrôlables licitement).
- Je **ne peux pas** mesurer le taux de base de DAGTOPPER dans les 100 k (pas d'échantillon organique
  accessible licitement), donc je **ne peux ni prouver ni exclure** un biais de niveau AS24. Mais le
  constat brut — **~99 % de promu sur la surface licite, tri inerte** — signifie que **la thèse
  « 2dehands sauve le mode 2 » n'est PAS établie**. Elle est présentée comme acquise ; elle ne l'est
  pas.

### N-6. Le volume 100 k est-il l'inventaire réellement accessible ? → **SOUS-ESTIMÉ (plafond de pagination non dit)**
`maxAllowedPageNumber = 167`. À 30 annonces/page, la pagination licite plafonne à **~5 010 annonces**,
pas 100 186. Le compteur 100 k est un **total de correspondance**, pas un inventaire paginable. LOT-N
mentionne la profondeur de pagination comme « inconnue restante » (bien), mais la DÉCISION traite les
100 k comme l'inventaire utilisable. Le partitionnement par facette marque/modèle relève ce plafond
(comme sur AS24), mais alors on retombe sur des sous-segments dont chacun peut être dominé par les
DAGTOPPER — le problème N-5 se propage. À dire explicitement.

### N-7. mobile.de / AutoUncle / theparking → hors cluster décisif, non rejoués (budget). Verdicts d'écart de LOT-N cohérents avec les preuves citées.

---

## Tests rejoués

Toutes les sondes datées 2026-09-07. UA-nav = Chrome/128 ; UA-bot = ClaudeBot/1.0. **9 requêtes
réseau** (plafond 25). E5 respecté (AS24 uniquement sous `/fr/voiture/`), robots 2dehands respecté
(`/l/auto-s/` seulement, jamais `/lrp/api/`).

### T-N1 — compteur + anti-bot + robots 2dehands
```
curl -A <UA-nav> https://www.2dehands.be/robots.txt            → 200, 3617 o
curl -A <UA-nav> https://www.2dehands.be/l/auto-s/             → 200, 653 033 o décompressé
  grep totalResultCount   → 100186         (LOT-N: 100 200 ; DÉCISION: 100 188)
  Set-Cookie              → MpSession, luckynumber  (aucun _abck/ak_bmsc/datadome)
  challenge markers       → 0
  robots: /l/auto-s/ matché par aucun Disallow ; /lrp/api/search* Disallow (non touché)
```
### T-N2 — champs par annonce + biais DAGTOPPER (pagination + tri)
```
/l/auto-s/       n=30  union attr∪ext=24 clés  advertiser=10/30  priorityProduct={DAGTOPPER:29,NONE:1}
/l/auto-s/p/2/   n=30  advertiser=11/30         priorityProduct={DAGTOPPER:30}
/l/auto-s/p/5/   n=30  advertiser=16/30         priorityProduct={DAGTOPPER:30}
/l/auto-s/?sortBy=SORT_INDEX&sortOrder=DECREASING → sortOptions appliqué VIDE, 29/30 DAGTOPPER (tri inerte)
  per-listing attr+ext: min 5, médiane 12, max 13 ;  clé 'brand' présente sur 0/30
  maxAllowedPageNumber = 167  → ~5010 annonces paginables
```
### T-A1 — segments AS24 exhaustifs + biais d'échantillonnage (rejeu LOT-A)
```
GET /fr/voiture/opel/opel-gt/     totalItems=12   servies=12  EXHAUSTIF  tiers{T50:1,T10:11}  seller{Dealer:4,Private:8}
GET /fr/voiture/opel/opel-tigra/  totalItems=19   servies=19  EXHAUSTIF  tiers{T10:19}         seller{Private:18,Dealer:1}
GET /fr/voiture/opel/opel-corsa/  totalItems=1271 servies=20  NON exh.   tiers{T50:18,T10:2}   seller{Dealer:20}
anti-bot AS24: aucun cookie _abck/ak_bmsc sur les 3 réponses
```
Comparaison à l'original LOT-A : gt 12/12 (LOT-A 12/12), tigra 19/19 (LOT-A 20/20), corsa 20 servies
90 % T50 100 % Dealer (LOT-A: 90 % T50, 100 % Dealer — **identique**). Dérive ≤ 1 sur les totalItems,
attendue (LOT-A annonce ±1 % de volatilité de cache). **Mécanisme reproduit.**

---

## Score de fiabilité par lot

Méthode : 100 points, déductions par défaut constaté, pondérées par leur impact sur la
recommandation. `reproductibilité (35) + suffisance de preuve (25) + légitimité d'inférence (25) +
honnêteté sur les limites (15)`.

### LOT-A — **88/100**
- Reproductibilité 35/35 : mécanisme entièrement rejoué (exhaustivité + dose-réponse + biais corsa).
- Suffisance 25/25 : preuve chiffrée, journal complet, E5 respecté.
- Inférence 18/25 : −7 pour « 3 mesures indépendantes » (le binomial est dérivé des deux autres ;
  Chao1 mesure la saturation de cache, pas l'univers). La conclusion tient malgré tout.
- Honnêteté 10/15 : −5 la réserve sur le niveau du taux de base est portée, mais la redondance des
  mesures n'est pas dite au lecteur.
**Verdict LOT-A : fiable. La fermeture du mode 2 sur AS24 est acquise.**

### LOT-N (volet 2dehands, cœur de la recommandation) — **58/100**
- Reproductibilité 25/35 : volume, anti-bot, robots, structure des champs reproduits ; −10 le
  compteur exact n'est pas reproductible (3 valeurs) et le biais DAGTOPPER n'avait pas été sondé.
- Suffisance 12/25 : −13 le point décisif (représentativité mode 2 de 2dehands) n'est **pas prouvé** ;
  `brand` affirmé mais absent (0/30) ; `advertiser`/H3 donné pour acquis mais présent à 33 %.
- Inférence 12/25 : −13 « ≥25 champs » vrai en union mais présenté comme couverture d'annonce ;
  100 k présenté comme inventaire alors que ~5 010 sont paginables ; saut « pas d'anti-bot ⇒ source
  mode 2 valide » non justifié (l'absence d'anti-bot ne dit rien du biais d'échantillon).
- Honnêteté 9/15 : −6 la profondeur de pagination est signalée comme inconnue (bien), mais le biais
  de promotion n'est jamais posé comme question ouverte.
**Verdict LOT-N : la licéité et l'existence de la source sont solides ; sa qualification comme source
mode 2 ne l'est pas.**

---

## VERDICT FINAL — la recommandation 2dehands tient-elle ?

**OUI comme source licite, gratuite, sans anti-bot d'un marché belge réel et dense — NON, en l'état,
comme solution au problème qui a motivé le déplacement (le mode 2).**

Ce qui **tient** (vérifié par moi-même) : 2dehands `/l/auto-s/` est **licite** (aucun `Disallow`),
**sans anti-bot** (cookies de session ordinaires seulement), porte **~100 k** voitures BE (ordre de
grandeur confirmé) et **~24 attributs structurés + ~7 champs top-level** en union de page. Comme
socle de **mode 1** (comptages, agrégats, volume) et comme voie de repli face à l'échec total des
voies AS24, la recommandation est **fondée**.

Ce qui **ne tient pas encore** : la DÉCISION érige 2dehands en **source de production du mode 2** —
distributions prix × km × année, détection d'outliers — c'est-à-dire l'usage même que LOT-A a
interdit sur AS24 *à cause du biais de produit publicitaire*. Or **le protocole de biais de LOT-A
n'a jamais été appliqué à 2dehands**, et mon spot-check montre que la surface licite est **~99 %
d'annonces promues (DAGTOPPER)** avec **tri URL inerte** — le flux organique n'est pas atteignable
sans l'API interne interdite. C'est la même classe de défaillance que celle qui a fermé le mode 2 sur
AS24. Tant que ce n'est pas mesuré, la **recommandation primaire pour le mode 2 est NON PROUVÉE**.

**Correction opposable exigée avant que la phase 1.6 ne porte 2dehands en recommandation primaire :**
1. Appliquer le protocole LOT-A à 2dehands : mesurer le **taux de base de DAGTOPPER** (via segments
   exhaustifs marque/modèle où `totalResultCount ≤ 30) et tester la dose-réponse sur les gros
   segments. Statuer alors OK / biaisé.
2. Établir si un **échantillon organique** (non promu) est atteignable licitement (tri effectif sans
   `/lrp/api/`). Sinon, marquer les annonces `sample_biased = true` **exactement comme pour AS24** —
   auquel cas 2dehands ne résout PAS le mode 2, il le déplace.
3. Rectifier les chiffres : compteur « ~100 200 (vivant) », couverture « ~24 champs en union de page,
   médiane 12/annonce », `brand` = dérivé du titre (non structuré), `advertiser`/H3 présent à ~33 %,
   inventaire paginable ~5 010 (plafond 167 pages) et non 100 k.

En un mot : **le socle est réel et licite ; la promesse mode 2 est prématurée.**
