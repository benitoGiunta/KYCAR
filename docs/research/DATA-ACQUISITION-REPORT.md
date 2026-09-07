# DATA-ACQUISITION-REPORT — Rapport de décision du chantier 1 (phase 1.6)

**Agent** : `compile-1` (Opus, effort max). **Date** : 2026-09-07.
**Entrée** : registre gelé `candidates-final.md` (92 candidats, 85 retenus, 17 lots), les 13
`probe-LOT-*`, les 3 `audit-cluster-*`, `DECISION-coordinateur-source.md` (version corrigée après
audit), `DECISION-coordinateur-LOT-B.md`, `VERIF-C67-fdz.md`, `FINDING-allowed-surface.md`,
`AS24-REFERENCE-API.md`, `00-CONTEXT.md`.
**Corrections d'audit de la phase 1.5 intégrées** (voir le Journal des arbitrages en fin de document) :
dénominateur de couverture = **40** ; médiane de prix fournisseurs = **~1,31 €/1 000 annonces**
(valeurs confirmées seules) ; **le mode 2 n'est résolu sur aucune source gratuite et licite** ;
les trois limites juridiques tiennent (audit 5/5).

---

## RÉSUMÉ EXÉCUTIF (la réponse au commanditaire)

1. **Peut-on charger l'inventaire AutoScout24 gratuitement ET de façon autonome ET licitement ? NON.**
2. Après 17 lots instruits et audités, aucune voie ne franchit les trois murs à la fois : **technique**
   (l'inventaire fin est derrière Akamai `/lst` ou derrière authentification), **juridique** (les CGU
   consommateur belges d'AS24, art. 9.2/9.3, interdisent verbatim « les requêtes automatisées par script »
   et de « constituer sa propre base de données » — l'objet même de KYCAR ; A11 = 4/5), **économique**
   (les voies licites restantes — SEARCH API, fournisseurs, dataset FDZ — sont payantes ou sous contrat).
3. **La surface autorisée d'AS24 (`/fr/voiture/`) ne sert qu'un échantillon biaisé** par le produit
   publicitaire (p < 10⁻²⁰, `LOT-A` audité 88/100) : bon pour des agrégats, inutilisable pour le mode 2.
4. **Il existe néanmoins une voie gratuite + autonome + licite POUR LE MODE 1 (agrégats)** : `2dehands.be`
   (100 k voitures BE) + `marktplaats.nl` (263 k, NL), via leur `__NEXT_DATA__` sur une surface que le
   `robots.txt` autorise, sans anti-bot. Un seul adaptateur `DataProvider` couvre les deux.
5. **Pour le MODE 2 (distributions fines, détection d'outliers), le sous-ensemble gratuit + autonome est VIDE.**
   2dehands a exactement le même biais qu'AS24 : pagination licite plafonnée à ~5 010 annonces, dont ~95 %
   promues (DAGTOPPER), flux organique derrière l'API interne interdite (`LOT-N` audité 58/100).
6. **Voie recommandée** : mode 1 sur 2dehands/marktplaats maintenant, gratuit ; mode 2 sur **dataset
   synthétique** étiqueté `SYNTHETIC` (dév./démo) jusqu'au financement d'un **fournisseur payant**
   (Apify, médiane ~1,31 €/1 000, ~2 900 €/mois BE) ou d'un **canal contractuel** (SEARCH API AS24, sur devis).
7. **Conséquence à assumer** : le produit reflétera alors le marché belge de l'occasion **tel que 2dehands
   le montre**, marché réel et dense, mais **pas littéralement l'inventaire AutoScout24**. L'architecture
   `DataProvider` absorbe ce déplacement : c'est un changement d'adaptateur, pas d'application.

---

## TABLEAU COMPARATIF MAÎTRE

**85 candidats `RETENU_POUR_INVESTIGATION`**, une ligne chacun, regroupés par famille. Colonnes =
les 14 axes A1–A14 + le **score de fiabilité d'audit** (0–100, hérité du cluster d'audit du lot) +
verdict. Aucune cellule vide : `NV` = `[NON VÉRIFIÉ]` (accepté et compté par R1) ; `s.o.` = sans
objet argumenté (le candidat n'est pas un canal d'accès, ou l'axe est matériellement sans contenu).

**Légende des axes** : A1 coût d'amorçage · A2 coût récurrent (€/1 000 ann. ; €/mois BE) · A3 champs
utiles /40 · A4 géo · A5 latence · A6 débit/quota · A7 stabilité 1–5 · A8 qui absorbe l'anti-bot ·
A9 intégration (j-h) · A10 maintenance · A11 exposition juridique 1–5 · A12 autonomie · A13 plafond
de volumétrie · A14 fraîcheur. **Fiab** = score d'audit 1.5. Scores par lot : LOT-A 88, LOT-B 100,
LOT-CD 74, LOT-E 90, LOT-F 78, LOT-GH 88, LOT-I 87, LOT-J 90, LOT-K 100, LOT-LO 75, LOT-M 85,
LOT-N 58, LOT-PQ 92.

### Famille 1 — API officielles AutoScout24

| ID | A1 | A2 | A3 | A4 | A5 | A6 | A7 | A8 | A9 | A10 | A11 | A12 | A13 | A14 | Fiab | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C-01 SEARCH API | devis(NV) | NV(devis) | large(doc) | NV(19 pays) | NV | NV | 4 | s.o.(contrat) | faible | NV | 1(si contrat) | dépendant | NV | temps réel(rev.) | 100 | VIABLE SOUS COND |
| C-48 licence SEARCH API | =C-01 | =C-01 | =C-01 | =C-01 | NV | NV | 4 | s.o. | faible | NV | 1 | dépendant | NV | temps réel | 100 | VIABLE SOUS COND (=C-01) |
| C-02 Listing Creation API | 0€ | 0€ | référentiel/0 ann. | pan-EU | ~100-160ms | pas de quota | 4 | non concerné | ~1j | faible | 1 | dépendant | 0 annonce | s.o. | 88 | VIABLE (taxonomie/normalisation) |
| C-03 Listing Distribution API (SMG) | 0€ spec / contrat NV | tarif SMG NV | **76**(LiveListing) | **Suisse only** | NV(Bearer) | 2000/page + modifiedSince(delta) | 4 | non concerné | ~2j | faible | 2 | partiel(Bearer SMG) | inventaire live CH | quasi temps réel(delta) | 100 | VIABLE SOUS COND (lecture delta) mais **hors périmètre BE** |
| C-04 Portail dev AS24.ch/SMG | 0€ doc / OAuth NV | NV | recherche complète >40 | **Suisse** | NV | NV | 4 | non concerné | ~2-3j | faible | 2 | partiel(jeton SMG) | NV | live | 100 | VIABLE SOUS COND (seule doc d'API de recherche du groupe lisible ; CH only) |
| C-05 HändlerIQ | s.o. | s.o. | stats perf, pas inventaire | AS24 | s.o. | s.o. | s.o. | s.o. | s.o. | s.o. | s.o. | non | s.o. | s.o. | 100 | NON VIABLE (B2B2B fermé) |

### Famille 2 — Endpoints internes du front + reconnaissance

| ID | A1 | A2 | A3 | A4 | A5 | A6 | A7 | A8 | A9 | A10 | A11 | A12 | A13 | A14 | Fiab | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C-06 __NEXT_DATA__ /lst | 0€ | 0€(+anti-bot) | ~24-37 | cy=B | NV | NV(Akamai) | 3 | Akamai | faible | 3/5 | 4(Disallow*) | dépendant | 4000/rech. | immédiate si licite | 74 | VIABLE SOUS COND (interdit) |
| C-07 __NEXT_DATA__ détail | 0€ | 0€/1 req=1 ann. | ~35(le+riche) | 19 dom. BE | NV | NV | 3 | Akamai | faible | 3/5 | 4 | dépendant | 1 req=1 ann. | immédiate | 74 | VIABLE SOUS COND (interdit) |
| C-08 /_next/data/{buildId} | 0€ si existe | NV | =pageProps si existe | NV | NV | NV | fragile | NV | s.o. | +buildId | 4 | non | NV | NV | 74 | NON VIABLE (existence non établie) |
| C-09 /listing-search-api/graphql | 0€ si licite | fermé(401) | large si=mobile | 5 TLD | NV | NV | s.o. | auth avant Akamai | s.o. | s.o. | 5 | fermé | s.o. | s.o. | 74 | NON VIABLE (gateway+OAuth) |
| C-10 /ocs/api/graphql | s.o. | s.o. | OCS indécodé | 5 TLD | s.o. | s.o. | s.o. | 403 | s.o. | s.o. | 5 | fermé | s.o. | s.o. | 74 | NON VIABLE |
| C-11 /classified-list/react-listelements | 0€ si licite | NV | route vivante, corps NV | .com/.nl | NV | NV | 3(toguru A/B) | Akamai | NV | NV | 5 | non | NV | NV | 74 | VIABLE SOUS COND (incertaine) |
| C-12 oracle new-results-count | s.o. | s.o. | 1 entier(compte) | 5 TLD | s.o. | s.o. | s.o. | fermé | s.o. | s.o. | 5 | non | s.o. | s.o. | 74 | NON VIABLE (mécanique acquise via totalItems) |
| C-13 vip-showroom/dealer-detail | 0€ si licite | 2,67-3,01€(miroir Anysite) | ~19-35 | par concess. | NV | NV | NV | fermé | NV | NV | 5 | non | pas de plafond | NV | 74 | VIABLE SOUS COND |
| C-14 pages SEO /fr/voiture/ | 0€ | 0€ | **40**(prouvé) | BE(+5 TLD) | p50 169ms | plafond ~25/segment, 0 pagination | 4 | **non concerné**(0 _abck/52) | 2-4j | ~0/mois | 1(Allow) mode1 | partiel | totalItems exhaustif(mode1)/~1,95% biaisé(mode2) | ~quart d'heure | 88 | **VIABLE mode1** / INUTILISABLE mode2 (biais p<10⁻²⁰) |
| C-82 CT logs | 0€ | 0€ | 0(reco) | .com/.be/.tr | 0,4-1,8s | sans quota | 4 | non concerné | ~0,5j | ~0 | 1 | oui | 0 annonce | quasi temps réel | 100 | VIABLE (reco) / NON VIABLE (source) |
| C-88 GitHub/npm AS24 | 0€ | 0€ | 0(contrat évts front) | s.o. | s.o. | s.o. | 3 | non concerné | s.o. | s.o. | 1 | oui | 0 | s.o. | 100 | NON VIABLE (source) |

### Famille 3 — Application mobile

| ID | A1 | A2 | A3 | A4 | A5 | A6 | A7 | A8 | A9 | A10 | A11 | A12 | A13 | A14 | Fiab | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C-15 GraphQL mobile | 0€ spec | dépend accès non autorisé | >40(115 docs) | multi(BE) | fermé(401) | totalPages | 2 | Mashery+OAuth(refusé) | NV | élevé | **5** | non | NV | temps réel | 100 | NON VIABLE (sans autorisation) |
| C-16 APK statique | 0€ | 0€ | modèle complet révélé | multi | s.o. | s.o. | 3 | non concerné | ~1j | faible | 3(usage secrets non) | oui(analyse) | 0 | v26.35.12 | 100 | VIABLE (reverse-eng, résout verrou n°6) |

### Famille 4 — Flux partenaires et syndication

| ID | A1 | A2 | A3 | A4 | A5 | A6 | A7 | A8 | A9 | A10 | A11 | A12 | A13 | A14 | Fiab | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C-17 iframe embarquable | NV | NV | NV | NV | NV | NV | NV | NV | NV | NV | NV | NV | NV | NV | 75 | NON VIABLE (existence non établie, 100% NV) |
| C-18 multidiffusion (canal indirect) | 0€(doc) | NV | =C-19 si feed | DE+générique | NV | NV | 3 | non concerné | élevé | NV | 3 | non | NV | NV | 75 | NON VIABLE en l'état (flux sortant, pas lecture tierce) |
| C-19 spec de feed | 0€ | s.o. | **95**(SMG, prouvé) | CH(extrapolé) | s.o. | s.o. | 4 | s.o. | faible si accès | NV | s.o.(spec publique) | s.o. | s.o. | s.o. | 75 | VIABLE (dictionnaire de champs, pas canal) |
| C-20 propriétés du groupe (AUTOproff/LeasingMarkt/Trader Corp.) | NV | NV | NV | multi | NV | NV | NV | NV | NV | NV | NV | dépendant | NV | NV | 75 | VIABLE SOUS COND (documentaire, non tranché) |
| C-73 affiliation (Awin/Daisycon) | s.o. | s.o. | 0(créatifs, pas annonces) | BE | s.o. | s.o. | s.o. | s.o. | s.o. | s.o. | s.o. | s.o. | 0 | s.o. | 85 | NON VIABLE (clos) |
| C-74 Google/Meta Vehicle Ads | s.o. | s.o. | ≥20(spec) | NL/FR/DE | s.o. | privé(soumis) | s.o. | s.o. | s.o. | s.o. | s.o. | non | s.o. | s.o. | 85 | NON VIABLE comme source (canal de sortie) |
| C-84 prestataires BE/NL multidiffusion | 0€(consult.) | NV | ~95 si feed AS24 | BE+LU+NL | s.o. | poussé | 2 | non concerné | élevé(5 relations) | élevé | 1 | partiel | NV(parc) | quasi temps réel | 75 | VIABLE SOUS COND |
| C-85 data service providers AS24 | NV | NV | stats perf(pas annonce) | DE seul | temps réel(qual.) | NV | 2 | non concerné | NV | NV | 2 | non | NV | temps réel | 75 | NON VIABLE en l'état (10 tiers non nommés, 57% NV) |
| C-86 devenir destination de flux | 0€(Stockway) | NV | ~95 si feed | BE+LU+NL | fraîcheur DMS | sans plafond | 2 | **non concerné(construction)** | faible(techn.)/élevé(commercial) | faible | **1(le+bas)** | partiel | NV(garages consentants) | quasi temps réel | 75 | VIABLE SOUS COND |

### Famille 5 — API tierces de scraping managé

| ID | A1 | A2 | A3 | A4 | A5 | A6 | A7 | A8 | A9 | A10 | A11 | A12 | A13 | A14 | Fiab | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C-22 Apify | pay/event | 0,83€(memo23) ; ~2863€/mois | ~28-30 + éval prix | 9-18 dom. BE | NV | maxItems | 3 | fournisseur | 0,5-1j | faible | 4 | dépendant | non plafonné(doc) | à la demande | 78 | VIABLE SOUS COND (le+solide du lot F) |
| C-23 Scrapfly | 0€(1000 crédits) | crédits; mult. ASP NV | s.o.(générique) | mondial | NV | plan | 3 | fournisseur(Akamai rev.) | 0,5-1j | faible | 4 | dépendant | NV | à la demande | 88 | VIABLE SOUS COND techn., bloqué A11 |
| C-24 ScrapingBee | 0€(1000 crédits) | non chiffrable | 0(façade) | aucune | 1-5s(mkt) | plan | 2 | partagée | 2-3j | élevé | 4 | dépendant | NV | à la demande | 78 | NON VIABLE (façade marketing générique) |
| C-25 Piloterr | 0€(+500 sans CB) | 2,08-2,50€ **ou** 0,10-0,13€(ratio ×20 NV) ; 359-8625€/mois | ~18-28 | 19 dom. BE | NV | 7-15 req/s | 3 | fournisseur | 1j | faible | 4 | dépendant | NV | à la demande | 78 | VIABLE SOUS COND |
| C-26 Scrape.do | 0€(1000 crédits) | 0,06-0,116$/1000 crédits(ratio NV) | s.o.(générique) | mondial | NV | 10-200 conc. | 3 | fournisseur | 0,5-1j | faible | 4 | dépendant | NV | à la demande | 88 | VIABLE SOUS COND techn., bloqué A11 |
| C-27 Bright Data | 0€(5000/mois) | 1,20-1,38€ ; ~4100€/mois | 0(dataset=façade custom) | 195 pays(gén.) | NV | plan | 4 | fournisseur(Akamai BM rev.) | 0,5j | faible | 4 | dépendant | NV | à la demande | 88 | VIABLE SOUS COND techn., bloqué A11 |
| C-28 Oxylabs/Zyte/Decodo/Nimble/Infatica | Oxylabs 1Go essai | Oxylabs 1,82-2,29€ ; autres NV | s.o. | générique | NV | plan | NV | fournisseur | NV | NV | 4 | dépendant | NV | à la demande | 88 | VIABLE SOUS COND (Oxylabs) / NON CLASSABLE (4 autres) |
| C-29 Anysite.io | free tier(NV) | **2,67€ PAYG(ratio confirmé)** ; ~9212€/mois | ~19(pas éval) | par concess. | NV | count | 3 | fournisseur | 1-2j | faible | 4 | dépendant | par concess. | à la demande | 78 | VIABLE SOUS COND (prix le+fiable) |
| C-30 Carapis | 0€(14j sans CB) | 2,75-9,11€(ratio NV) | ~13-15(le+faible) | 18 marchés, BE non nommée | NV | 10k-100k/mois | 3 | fournisseur | 1-2j | faible | 4 | dépendant | plafonné appels | à la demande | 78 | VIABLE SOUS COND (le+faible) |
| C-31 auto-api.com | NV(pas d'essai) | **tarif sur devis(NV)** | ~10-12 | BE non nommée | NV | NV | 3 | fournisseur | 1-2j | faible | 4 | dépendant | NV(export complet) | **quotidienne(delta /changes)** | 78 | VIABLE SOUS COND (delta+export, le+proche du besoin) |
| C-36 Web Unlocker/Unblocker | =C-27/C-28 | 1,20-2,29€ | s.o. | générique | NV | plan | 4 | fournisseur | 0,5j | faible | 4 | dépendant | NV | à la demande | 88 | VIABLE SOUS COND, bloqué A11 (=C-27/C-28) |

### Famille 6 & 7 — Navigateurs pilotés / unblocking auto-hébergés

| ID | A1 | A2 | A3 | A4 | A5 | A6 | A7 | A8 | A9 | A10 | A11 | A12 | A13 | A14 | Fiab | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C-33 Playwright durci + proxy BE | 0€ logiciel | 2,84-3,40€(bande passante seule) | s.o. | générique | NV | NV | 2 | **KYCAR(nous)** | élevé(j-semaines) | élevé/continu | 4 | **oui(seul autonome techn.)** | NV | NV | 88 | NON VIABLE (A11 + éco > LOT-F) |
| C-34 anti-fingerprint natifs (Camoufox…) | 0€ | =C-33 | s.o. | générique | NV | NV | 2 | KYCAR | élevé | élevé | 4 | oui | NV | NV | 88 | NON VIABLE (=C-33) |
| C-37 FlareSolverr | 0€ logiciel | s.o. | s.o. | s.o. | s.o. | s.o. | 1 | ne vise pas Akamai(README Cloudflare) | s.o. | s.o. | s.o. | oui | s.o. | s.o. | 88 | NON VIABLE (hors périmètre Akamai) |

### Famille 8 — Datasets préexistants

| ID | A1 | A2 | A3 | A4 | A5 | A6 | A7 | A8 | A9 | A10 | A11 | A12 | A13 | A14 | Fiab | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C-38 Kaggle | 0€(compte) | 0€ | 9 à 60+(selon jeu) | DE surtout | s.o. | fichiers | s.o. | non concerné | faible/moyen | élevé | 3(provenance) | dépendant | 46k-120k | mauvaise/nulle | 87 | VIABLE SOUS COND (prototypage) |
| C-39 Zenodo | 0€(sans compte) | 0€(snapshot) | 60+(non vérifié) | multi-EU non confirmé | s.o. | 548Mo | s.o. | non concerné | faible | élevé | 3 | dépendant | ~120k(figé) | figé 11/2025(>6 mois, H4 violée) | 87 | VIABLE SOUS COND (prototypage jetable) |
| C-40 Hugging Face | s.o. | s.o. | s.o. | s.o. | s.o. | s.o. | s.o. | s.o. | s.o. | s.o. | s.o. | s.o. | s.o. | s.o. | 87 | NON VIABLE (0 dataset) |
| C-83 jeux académiques (ProbSAINT/TabResFlow) | s.o. | s.o. | 64-65(sur papier) | DE | s.o. | s.o. | s.o. | s.o. | s.o. | s.o. | s.o. | s.o. | 0 accessible | s.o. | 87 | NON VIABLE (propriétaire VWFS) |
| C-67 FDZ RWI-GEO-CARMKT | 0€+convention | s.o.(one-shot) | **38/40**(sans marqueur pub) | DE seule(FR/IT sans date, BE absente) | s.o. | s.o. | s.o.(doc fort) | non concerné | qq j analyse | nul(ponctuel) | 2(éligibilité KYCAR incertaine) | dépendant | ~30,8M lignes | nulle(V2 stop 12/2024) | 87 | VIABLE SOUS COND (instrument de mesure du biais, pas source) |
| C-41 marketplaces données (Datatorq) | NV(devis) | sur devis NV | 250+ points(prix/specs, pas annonces) | BE nommée(LCV) | s.o. | mensuel | 5 | fournisseur | 1-3j | <0,5j/mois | argumenté faible | dépendant | référentiel(pas flux) | mensuel | 92 | VIABLE SOUS COND (référentiel, pas annonces) |

### Famille 9 — Sources alternatives substituables

| ID | A1 | A2 | A3 | A4 | A5 | A6 | A7 | A8 | A9 | A10 | A11 | A12 | A13 | A14 | Fiab | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C-42 mobile.de Search API | compte concess. requis(R2) | NV | riche(doc, inaccessible) | DE | NV | NV | 4 | non concerné | NV | NV | 3 | **non** | NV | NV | 58 | NON VIABLE (viole R2) |
| **C-43 portails BE (socle 2dehands)** | **0€** | **~0€** | **≥25/40 union page(~19/annonce)** | BE | <2s | 30/page, plafond ~5010(167 pages) | 3 | **aucun** | 2-4j | ~0,5j/mois | **2** | partiel | **100k total / ~5010 paginable, ~95% DAGTOPPER** | snapshot(champ date) | 58 | **VIABLE (mode1)** / NON ACQUIS (mode2) |
| C-44 portails voisins (marktplaats NL) | 0€ | ~0€ | ≥28/40 | **NL**(FR fermée DataDome) | <2s | 30/page | 3 | aucun(NL) | +0j si mutualisé | ~0,3j/mois | 2(leboncoin 5) | partiel | 263k NL | snapshot | 58 | VIABLE (NL) / NON VIABLE (FR,UK) |
| C-45 theparking.eu | 0€ | ~0€ | ~15/40 | multi(miroir AS24+2dehands+gocar) | <2s | HTML/page | 2 | Cloudflare contournable(UA-curl honnête→200) | 3-5j | ~1j/mois | 3(2e rang) | partiel | NV | snapshot | 58 | VIABLE SOUS COND (appoint) |
| C-46 schema.org/Car concessionnaires | 0€ | 0€ | ~17/40 | BE | ~1 req/fiche | énumérable sitemap | 4 | aucun | modéré(1 parseur) | faible | 1-2 | oui/garage | Hexon 1234/marque | source primaire | 85 | VIABLE, NON RETENU (redondant 2dehands) |
| C-47 B2B remarketing (AUTOproff/CarNext/Autobiz) | compte requis / blog libre | NV | NV(CarNext piste) | BE(CarNext, AUTOproff) | NV | NV | NV | non testé | élevé | NV | 2 | non | NV | NV | 75 | VIABLE SOUS COND (CarNext via portail) / NON VIABLE (autres) |
| C-68 AutoUncle | contact B2B | NV | valorisations(pas annonces) | 14 pays, **BE non couverte** | NV | NV | 4 | non concerné | NV | NV | 2 | non | 8,6M/j(en valeur) | temps réel | 58 | NON VIABLE pour KYCAR |
| C-69 API theparking.eu | NV | NV | NV | NV | NV | NV | NV | NV | NV | NV | NV | NV | NV | NV | 58 | NON VIABLE / NON PROUVÉ (fusionné C-45) |
| C-76 portails constructeurs BE (Hexon) | 0€ | 0€ | ~17/40 | BE, **mono-marque** | ~1 req/fiche | énumérable | 4 | aucun(crawlers IA autorisés) | modéré | faible | 1 | oui | 1234 Mercedes | source primaire | 85 | VIABLE, NON RETENU volume (appoint niche) |
| C-80 OPENLANE Connect | fermé(NV) | NV | s.o.(entrante seule) | BE(v1) | s.o. | s.o. | s.o. | 403 catalogue | s.o. | s.o. | 2 | non | s.o. | s.o. | 75 | NON VIABLE en l'état (entrante seule) |
| C-87 AUTO1 Group | 0€(Index/AutoHero)/compte B2B | s.o.(Index gratuit) | Index prix(carburant) ; AutoHero superficiel | Index paneuropéen(pas BE) / AutoHero BE | NV | NV | 3 | non testé | élevé(miroir)/faible(Index) | faible(Index) | 2 | non | Index 1 val/mois ; AutoHero stock propre | Index mensuel | 75 | VIABLE SOUS COND (ancrage tendance) / NON VIABLE (catalogue B2B) |
| C-92 API REST socles garages (Vehica) | 0€ | 0€ | ~20/40 | par garage BE | 1,2-2,9s | stock entier/1 req | 3 | **aucun** | **élevé(1 adaptateur/socle)** | élevé | 1-2 | oui/garage(fermable) | ~70/garage, pas d'index central | **excellente(source primaire)** | 85 | VIABLE techn., NON RETENU (redondant + non passant à l'échelle) |

### Famille 10 — Partenariat / licence directe AS24

| ID | A1 | A2 | A3 | A4 | A5 | A6 | A7 | A8 | A9 | A10 | A11 | A12 | A13 | A14 | Fiab | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C-48 licence directe SEARCH API | =C-01 | =C-01 | =C-01 | =C-01 | NV | NV | 4 | s.o. | faible | NV | 1 | dépendant | NV | temps réel | 100 | VIABLE SOUS COND (=C-01) |
| C-49 TSP portal.services.as24.tech | NV | NV | NV(illisible sans JS) | NV | NV | NV | prod(existe) | robots Disallow/ | NV | NV | NV | dépendant(fermé) | NV | NV | 100 | NON VIABLE en l'état |
| C-50 rapports marché AS24 | 0€ | 0€(éditorial) | agrégats marché(pas d'annonce) | BE | s.o. | s.o. | s.o. | non concerné | s.o. | faible | nulle | dépendant(cadence) | s.o. | variable(<12 mois) | 100 | VIABLE (validation ponctuelle seulement) |
| C-81 CGU comme inventaire des canaux | s.o. | s.o. | s.o.(preuve) | s.o. | s.o. | s.o. | s.o. | s.o. | s.o. | s.o. | **4(confirme)** | s.o. | s.o. | s.o. | 100 | Preuve croisée (non classable comme canal) |

### Famille 11 — Sitemaps et robots.txt

| ID | A1 | A2 | A3 | A4 | A5 | A6 | A7 | A8 | A9 | A10 | A11 | A12 | A13 | A14 | Fiab | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C-52 robots.txt comme carte/conformité | 0€ | 0€ | s.o. | 5 TLD | ~200ms | s.o. | 5 | non concerné | ~0 | ~0 | 1 | oui | s.o. | à jour | 88 | VIABLE (référence de conformité, pas source) |

### Famille 12 — Caches et archives tiers

| ID | A1 | A2 | A3 | A4 | A5 | A6 | A7 | A8 | A9 | A10 | A11 | A12 | A13 | A14 | Fiab | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C-53 Wayback | 0€ | 0€ | 37/40(Next.js) | BE | ~1,9s/snap | throttling NV | 4 | non concerné | 6-9j(4 parseurs) | 0,25-0,5j/mois | 3(sui generis+RGPD; Save Page Now interdit) | partiel(rapatriable) | 131287 ann.(35025 en série) — stock | 1-2j(subie) | 90 | VIABLE (historique, pas inventaire courant) |
| C-54 Common Crawl | 0€ | 0€ | 37/40(par identité) | BE | ~4,2s | modération | 5 | non concerné | 4-6j(réutilise C-53) | 0,1j/mois | **2(robots-conforme, citable)** | partiel | corpus **clos**(0 après directive IA) | nulle(annonces) | 90 | VIABLE SOUS COND (crawls antérieurs, corpus clos) |
| C-55 index moteurs (Brave/SerpApi) | compte+CB requis(R2) | 0,035-0,25€/1000 URL ; 253-780€/mois | 7/40(snippets) | tout pays indexé | NV | Brave 1000/mois | 3 | fournisseur | 5-8j(partitionnement) | 0,5j/mois | 2(CGU à lire) | non | non-énumérable | qq jours-semaines | 90 | NON VIABLE en l'état (R2) ; découverte d'URL |
| C-71 urlscan.io | 0€ reco / DOM compte(403) | s.o.(corpus vide) | 0/40 | aucune | immédiate | reco | 1 | absorberait | s.o. | s.o. | 4(soumission=contournement) | non | **0 annonce** | s.o. | 90 | NON VIABLE (corpus vide + accès fermé + soumission illicite) |
| C-72 HTTP Archive/BigQuery | compte Google requis | ~1Go gratuit / 181$ si SELECT * | 0/40(pages d'entrée) | NV | NV | 1To/mois | 5(mais dominé) | non concerné | 1-2j | 0,1j/mois | 1 | non | 1-2 lignes/crawl | mensuel | 90 | NON VIABLE inventaire, dominé A7 par C-53 |

### Famille 13 — Valorisation et données de marché

| ID | A1 | A2 | A3 | A4 | A5 | A6 | A7 | A8 | A9 | A10 | A11 | A12 | A13 | A14 | Fiab | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C-56 JD Power (Autovista/Eurotax) | NV(403) | sur devis NV | valorisation résiduelle(pas annonces) | **BE listée**(14 marchés) | s.o. | NV | NV | fournisseur | 3-8j | NV | argumenté faible | dépendant | NV | NV | 92 | VIABLE SOUS COND |
| C-57 INDICATA | NV(devis) | sur devis NV | dashboard(pas schéma) | pan-EU(BE NV) | s.o. | NV | NV | fournisseur | 3-8j | NV | 3(silence méthode collecte, aggravant) | dépendant | NV | real-time(rev.) | 92 | VIABLE SOUS COND (exiger garantie provenance) |
| C-58 estimation prix AS24 (/prijsschatting/) | 0€ | 0€ | consomme distribution prix | BE(chemins Allow) | ~240ms | NV | NV | non concerné | NV | faible | 1(Allow) | partiel | agrégat indirect | quart d'heure | 88 | VIABLE SOUS COND (accès indirect agrégat, à qualifier) |
| C-75 Autotelex/RDC/JATO | NV(devis) | sur devis NV | JATO specs ; Autotelex valorisations | **NL only**(Autotelex/RDC) ; JATO BE NV | s.o. | NV | NV | fournisseur | 3-8j | NV | 2(Autotelex hybride documenté) | dépendant | NV | NV | 92 | NON VIABLE périmètre BE |

### Famille 14 — Autres voies

| ID | A1 | A2 | A3 | A4 | A5 | A6 | A7 | A8 | A9 | A10 | A11 | A12 | A13 | A14 | Fiab | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C-60 alertes email recherches sauvegardées | compte requis(R2) | NV | pas de snapshot | BE | latence(heures) | NV | NV | non concerné | NV | NV | 4 | non | pas d'agrégat | différée | 90 | NON VIABLE (R2 + pas de snapshot) |
| C-61 extension carissimo (api.carissimo.io) | 0€ config / produits Bearer(401) | NV | historique sous auth | 8 TLD AS24(BE) | ~590ms | NV | NV | tiers | NV | NV | 4 | non | fermé | historique | 90 | NON VIABLE (produits sous Bearer) |
| C-62 extension propre opt-in | 0€ logiciel | chiffrage rédhibitoire | dépend usagers | BE | s.o. | pilotée usagers | NV | **non concerné** | élevé | élevé | 3 | oui | NV(couverture opt-in) | temps réel | 90 | NON VIABLE (échelle) |
| C-64 scrapers open source (parseurs réf.) | 0€ | 0€ | carte des champs | multi | s.o. | s.o. | mesuré(A7) | non concerné | faible | faible | 1(lecture code) | oui | s.o. | date dernier commit | 90 | VIABLE (rôle de référence) |
| C-65 doc PHP « API AS24 » | 0€ | s.o. | nomme api.autoscout24.com | s.o. | s.o. | s.o. | figée(2016) | s.o. | s.o. | s.o. | s.o. | s.o. | s.o. | obsolète | 90 | NON VIABLE (acquisition) |
| C-66 rejeu XHR DevTools | 0€(action commanditaire) | s.o. | liste exhaustive endpoints | BE | s.o. | session unique | s.o. | s.o. | s.o. | s.o. | (session humaine) | s.o. | s.o. | s.o. | 74 | VIABLE SOUS COND (ACTIONS-COMMANDITAIRE) |
| C-70 qwillemse pipeline (production) | 0€ | **0€/mois(GitHub Actions)** | __NEXT_DATA__ riche | BE/NL/DE(808720 ann.) | snapshot BE 39,7min | ~162000/h | 4(__NEXT_DATA__) | **aucun(requests nu /lst, 23 sem.)** | faible | ~0 | **4(chemin /lst interdit + sui generis)** | non(si on consomme le tiers) | 4000/rech., ~107k BE | hebdo/quotidienne | 90 | VIABLE SOUS COND (méthode prouvée mais /lst interdit A11) |

### Famille 16 — Données publiques officielles du véhicule

| ID | A1 | A2 | A3 | A4 | A5 | A6 | A7 | A8 | A9 | A10 | A11 | A12 | A13 | A14 | Fiab | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C-77 Statbel/DIV | 0€ | 0€ | **marque+modèle+9 dim.** | BE régional | s.o.(Excel) | s.o. | 4 | non concerné | 2-4j | <0,5j/mois | 1 | non(service public) | exhaustif(recensement) | annuel/mensuel | 92 | VIABLE (population de référence, pièce centrale) |
| C-78 RDW open data NL | 0€(API Socrata) | 0€ | ~104 champs(pas de km num.) | **NL** | <1s | pagination $offset | 5 | non concerné | 1-2j | <0,5j/mois | 1 | non | national complet | quasi temps réel | 92 | VIABLE (gabarit méthodo NL, hors BE) |
| C-79 Car-Pass BE | 0€(agrégats) | 0€ | 8 indicateurs nat.(âge 9,8ans, km 107127) | BE national | s.o. | s.o. | 5 | non concerné | <1j | <0,1j/mois | 1 | dépendant(mission légale) | 855169 docs 2025 | annuel | 92 | VIABLE (ancrage national, pas distribution) |
| C-90 GOCA | NV | NV | volumes only(communiqués) | Flandre(part.) | s.o. | s.o. | 2 | non concerné | s.o. | s.o. | 1 | dépendant(presse) | s.o. | semestriel(ponctuel) | 92 | NON VIABLE (source structurée) |

### Famille 18 — Espaces de données réglementés et fédérés

| ID | A1 | A2 | A3 | A4 | A5 | A6 | A7 | A8 | A9 | A10 | A11 | A12 | A13 | A14 | Fiab | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C-89 Mobility Data Space/Catena-X/CEMDS | NV(catalogue derrière auth) | NV | **aucun jeu VO identifié** | s.o. | s.o. | s.o. | s.o. | s.o. | s.o. | s.o. | D(IDS/Gaia-X)/NV(cas VO) | s.o. | s.o. | s.o. | 92 | NON VIABLE (angle clos) |

**Synthèse de lecture du tableau** : sur 85 retenus, **une seule famille de candidats est
simultanément gratuite + autonome + licite ET livre des annonces réelles** : les portails Adevinta
(`C-43` 2dehands.be, `C-44` marktplaats.nl), et **uniquement au niveau agrégat (mode 1)**. Les
sources publiques officielles (`C-77`, `C-79`, `C-78`) sont gratuites et licites mais ne livrent pas
d'annonces (population de référence). Toutes les voies AS24 directes sont soit interdites (A11 4-5/5),
soit fermées techniquement (401/403/gateway), soit payantes/contractuelles.

---

## STRESS-TEST DES ZONES D'OMBRE

On teste la robustesse du **choix**, pas du candidat : pour chaque inconnue résiduelle matérielle,
on pose le scénario défavorable, on chiffre son impact sur la décision, et on dit si la
recommandation tient. **Aucun scénario défavorable ne renverse la conclusion centrale** (mode 1
gratuit+autonome+licite faisable via 2dehands ; mode 2 gratuit vide). Deux zones méritent une
vigilance opérationnelle ; aucune n'est fatale.

### ZO-1 — Ratio annonces/crédit Piloterr (facteur ×20 non confirmé)
- **Scénario défavorable** : 1 crédit = 1 annonce (borne haute), donc **2,08–2,50 €/1 000** et
  **~7 200–8 600 €/mois** pour un rafraîchissement quotidien BE, au lieu de 0,10–0,13 €/1 000 en
  borne basse.
- **Impact sur la décision** : nul sur le *choix* du fallback payant. Piloterr n'est pas le candidat
  retenu comme ancre : **Apify memo23** l'est (0,83 €/1 000, ratio pay-per-event confirmé, éval prix
  servie, BE nommée, ~2 900 €/mois). Même au pire, Piloterr reste dominé par Apify.
- **Robustesse : TIENT.** L'essai gratuit Piloterr (+500 crédits, sans CB) lèverait l'inconnue en
  10–15 min mais n'est pas sur le chemin critique de la décision.

### ZO-2 — Extension multi-pays FDZ (C-67) sans calendrier, Belgique jamais nommée
- **Scénario défavorable** : la Belgique n'est **jamais** ajoutée à RWI-GEO-CARMKT (seules la France
  et l'Italie sont nommées, sans date ; formulation reconduite verbatim de mai à août 2025).
- **Impact sur la décision** : KYCAR perd le **seul instrument gratuit** capable de mesurer, sur
  données réelles, l'ampleur du biais d'échantillon *sur le marché belge*. Mais la décision mode 2
  (dataset synthétique + fournisseur payant) **ne dépend pas** de FDZ : FDZ était un instrument de
  *calibration*, pas une source d'alimentation, et de surcroît il ne porte **aucun marqueur de mise
  en avant publicitaire** (donc il mesure le biais agrégé, pas le biais imputable à la publicité).
- **Robustesse : TIENT.** Conséquence chiffrée : sans FDZ-BE, la magnitude du biais 2dehands/AS24 sur
  BE reste **argumentée mais non mesurée** ; cela ne rouvre pas le mode 2 gratuit, cela renforce au
  contraire l'argument de financer une source réelle. Repli de calibration : FDZ-DE (si éligible)
  comme proxy méthodologique, ou la population de référence Statbel/Car-Pass comme dénominateur.

### ZO-3 — Taux de base DAGTOPPER de 2dehands non mesuré finement
- **Scénario défavorable** : le taux de promus dans la population entière est **très inférieur** aux
  ~95 % observés sur la surface paginable → la surface licite est encore plus biaisée que supposé,
  et toute distribution mode 2 bâtie dessus est fausse de façon crédible (même mode de défaillance
  qu'AS24).
- **Scénario favorable (l'autre bord de l'inconnue)** : si le taux de base est réellement ~95 %,
  l'échantillon paginable n'est *pas* biaisé et le mode 2 redeviendrait faisable gratuitement sur
  2dehands. **C'est la seule inconnue du dossier dont la résolution favorable pourrait améliorer la
  recommandation** — mais elle n'est pas prouvée (audit `LOT-N` : NON PROUVÉ, protocole LOT-A jamais
  appliqué à 2dehands, tri URL inerte, flux organique derrière l'API interne interdite).
- **Impact sur la décision** : le scénario défavorable **confirme** la recommandation conservatrice
  (mode 2 = synthétique/payant). Le scénario favorable ne peut pas être retenu sans mesure.
- **Robustesse : TIENT** (par construction conservatrice). **Action à faible coût** qui trancherait :
  appliquer le protocole LOT-A à 2dehands (segments facette marque/modèle où `totalResultCount ≤ 30`,
  donc servis exhaustivement, pour mesurer le taux de base ; puis dose-réponse sur les gros segments).
  Tant que non fait, le mode 2 reste marqué `sample_biased = true` sur 2dehands.

### ZO-4 — Tarif SEARCH API AS24 sur devis
- **Scénario défavorable** : tarif prohibitif ou réservé aux concessionnaires (le nom
  `haendlerportal` le suggère), inaccessible à un tiers analytique.
- **Impact sur la décision** : le **fallback licite premium** du mode 2 (canal contractuel) tombe,
  mais le fallback payant principal (Apify, ~1,31 €/1 000 médiane) reste. La recommandation à 3
  niveaux prévoit déjà cet ordre : fournisseur payant *avant* le canal contractuel pour le coût, la
  SEARCH API n'étant préférée que pour la *licéité* (elle sort KYCAR du régime d'interdiction A11).
- **Robustesse : TIENT.** Seul le contact commercial (`searchapi@autoscout24.com`) peut chiffrer —
  `ACTIONS-COMMANDITAIRE`.

### ZO-5 — Révocabilité / migration de la surface 2dehands (la seule vigilance réelle sur le PRIMAIRE)
- **Scénario défavorable** : 2dehands retire `__NEXT_DATA__` (migration vers React Server Components
  / flight data, **exactement ce qu'AutoScout24.ch a déjà fait**, mesuré par `LOT-E` : ~90 % de
  l'extracteur réécrit en un commit), ou son `robots.txt` révoque `/l/auto-s/`.
- **Impact sur la décision** : c'est le seul scénario qui frappe la voie **primaire** du mode 1. Mais
  (a) le flight data reste **lisible** (prouvé en production sur `.ch` par `nyg`), donc la migration
  coûte une réécriture d'adaptateur, pas la mort de la voie ; (b) `marktplaats.nl` (même pile
  Adevinta) et `theparking.eu` (miroir) offrent une redondance ; (c) le repli dégradé (agrégats AS24
  surface autorisée `C-14`, licite et gratuit) subsiste.
- **Robustesse : TIENT, avec provision de maintenance.** A7 du socle 2dehands noté 3/5 justement pour
  ce risque. Provision recommandée : ~0,5 j-h/mois de veille de dérive de schéma + un plan de
  bascule d'adaptateur documenté.

**Verdict de robustesse global (S2)** : les 5 zones d'ombre matérielles ont chacune leur scénario
défavorable chiffré ; **aucune ne menace la conclusion centrale**. La seule qui touche le primaire
(ZO-5) est mitigée par redondance et par le fait que la donnée reste lisible après migration. La
seule dont une résolution *favorable* pourrait élargir le champ (ZO-3) reste non prouvée et est donc
traitée conservativement.

---

## RECOMMANDATION À 3 NIVEAUX

Distinction explicite **mode 1 (agrégats)** et **mode 2 (distributions)**. Chaque niveau porte son
**critère de bascule mesurable**.

### MODE 1 — Agrégats (nombre d'offres par marque/modèle, fourchettes)

| Niveau | Ce qu'on fait | Critère de bascule mesurable vers le niveau suivant |
|---|---|---|
| **Primaire** | `2dehands.be` + `marktplaats.nl` via `__NEXT_DATA__` sur surface autorisée. **Gratuit + autonome + licite.** `totalResultCount` exhaustif par construction. Adaptateur `DataProvider` unique BE+NL. | Bascule si : le parsing `__NEXT_DATA__` échoue (migration RSC/flight data détectée) **et** la réécriture d'adaptateur dépasse ~5 j-h ; **ou** `robots.txt` de 2dehands passe `/l/auto-s/` en `Disallow` ; **ou** la couverture tombe sous **20/40 champs** en union de page. |
| **Fallback** | Agrégats officiels gratuits comme substitut de comptage : **Statbel/DIV** (marque+modèle, exhaustif) recoupés avec `Car-Pass` (âge/km moyens BE) + `theparking.eu` (miroir multi-portails) ; ou fournisseur payant Apify pour les comptages si un flux d'annonces est requis. | Bascule si : les sources officielles ne fournissent pas la maille temporelle/segment requise **et** le budget mensuel du fournisseur payant est refusé. |
| **Repli dégradé** | Agrégats **AS24 surface autorisée** `C-14` : `listings.metadata.totalItems` par marque/modèle + `priceInfo` (minimum seul). Licite (`Allow`), gratuit, mais taxonomie spécifique AS24 et pas de sous-segment. | Terminal : si toutes les voies portail échouent, ce socle minimal reste disponible sans requête interdite. |

### MODE 2 — Distributions fines, détection d'outliers

| Niveau | Ce qu'on fait | Critère de bascule mesurable |
|---|---|---|
| **Primaire (dév./démo)** | **Dataset synthétique** clairement étiqueté `SYNTHETIC` (exigence `EX-DATA-107`), pour développer et démontrer toute la mécanique du mode 2 (distributions prix×km×année, vue 3D, détection d'outliers). Coût 0, autonomie totale. | Bascule si : lancement en production visé **et** décision d'afficher des distributions réelles (le synthétique est explicitement non représentatif). |
| **Fallback (production)** | **Fournisseur payant** : Apify memo23 (~0,83–1,31 €/1 000, ~2 900 €/mois BE, ratio confirmé, éval prix servie), **sous condition** que ses CGU et le droit *sui generis* le permettent (validation juridique). Alternative licite premium : **SEARCH API AS24** (contractuelle, sort du régime d'interdiction A11, prix sur devis). | Bascule vers repli si : budget refusé **et** feu vert juridique non obtenu sur le *sui generis*. |
| **Repli dégradé** | Mode 2 **restreint et étiqueté** : sur 2dehands, ne servir des distributions que pour les segments facette marque/modèle où `totalResultCount ≤ ~5 010` (donc servis exhaustivement, non biaisés), avec drapeau `sample_biased = true` porté jusqu'à l'affichage pour tout le reste. Calibration du biais via FDZ-DE si éligible, sinon via Statbel/Car-Pass comme dénominateur. | Terminal : honnête mais partiel — couvre les modèles rares/de niche, pas les gros segments (précisément ceux qui intéressent le mode 2). |

**Le mode 2 n'a AUCUN niveau gratuit + autonome + licite qui soit non biaisé et complet.** C'est le
constat opposable qui statue sur le lot D9 du chantier 2 (voir section S6 ci-dessous).

---

## ACTIONS-COMMANDITAIRE (consolidées)

Ce que seul le commanditaire peut faire (compte, contrat, credential, décision juridique), avec ce
que chaque action **débloque**. R2/E1 interdisaient à tous les agents de créer un compte, de saisir
un credential ou d'engager une démarche commerciale.

| # | Priorité | Qui / quoi | Temps | Coût | Ce que ça débloque | Source |
|---|---|---|---|---|---|---|
| AC-01 | **Haute** | **Décision juridique sur le socle 2dehands/Adevinta** : lire les CGU grand public 2dehands, valider l'usage analytique privé (H2), le deeplink (pas de copie), la non-persistance des données vendeur (H3). | 1 j (juridique) | 0 € | Verrouille la licéité de la **voie primaire mode 1** — prérequis du branchement réel du chantier 2. | LOT-N |
| AC-02 | **Haute** | Essai gratuit **Piloterr** (+500 crédits, sans CB) sur `/v2/autoscout24/search` puis `/ad` en `.be`. | 10-15 min | 0 € | Lève l'inconnue **×20** sur le prix (ratio annonces/crédit) + schéma `/ad` + nom du champ d'évaluation. | LOT-F |
| AC-03 | **Haute** | Compte **Apify** + run test memo23 sur un petit volume BE. | 15-30 min | qq € | Couverture réelle des champs, présence de `evaluation.category`, débit réel, comportement face à Akamai — qualifie le **fallback payant mode 2**. | LOT-F |
| AC-04 | **Haute** | Contact **SEARCH API AS24** (`searchapi@autoscout24.com`, `+49 89 44456-1000`). | 1-2 j ouvrés | devis | Grille tarifaire, quotas, couverture géo, **éligibilité d'un tiers non-concessionnaire** — seul canal qui **sort KYCAR de l'interdiction contractuelle** (A11). | LOT-K |
| AC-05 | Moyenne | Contact **auto-api.com** (`access@auto-api.com`) : devis + confirmation périmètre AS24-BE. | 1-2 j | devis | Prix, volume BE, fréquence du flux delta `/changes` — la mécanique snapshot+delta la plus proche du besoin. | LOT-F |
| AC-06 | Moyenne | **Protocole DevTools / HAR** (`C-66`) : session navigateur humaine sur `autoscout24.be`, export HAR livré à l'agent. | 0,5 j | 0 € | Cartographie exhaustive et actuelle des endpoints JSON du front (dont `C-11`), preuve directe sur `C-06`/`C-08`. | LOT-CD |
| AC-07 | Moyenne | Mesurer finement le **taux de base DAGTOPPER** de 2dehands (protocole LOT-A appliqué à 2dehands). | 0,5 j | 0 € | Tranche **ZO-3** : confirme/infirme si un échantillon organique non biaisé est atteignable licitement (pourrait rouvrir le mode 2 gratuit). | LOT-N / audit décisif |
| AC-08 | Moyenne | Demande de **convention FDZ Ruhr** (RWI-GEO-CARMKT, `C-67`). Éligibilité incertaine (usage scientifique). | qq semaines admin | 0 € | Mesurer sur données DE réelles l'ampleur du biais d'échantillon — calibration méthodologique. Ne débloque pas la BE (FR/IT seuls nommés). | LOT-I |
| AC-09 | Basse | Compte **Kaggle** (télécharger `C-38`) ; **BigQuery** compte + `--dry_run` (`C-72`, ~1 Go gratuit) ; clé **Brave/SerpApi** (`C-55`) + lecture des CGU. | 0,5-1 j | 0 € (paliers gratuits) | Prototypage (datasets), présence d'URL `autoscout24.be` dans CrUX, découverte d'URL d'annonces vivantes. | LOT-I / LOT-J |
| AC-10 | Basse | Devis **INDICATA** (avec **garantie écrite de provenance licite** des données AS24 dans le flux), **JD Power/Autovista**, **Datatorq** (produit BE), **Car-Pass** (stats désagrégées), **GOCA**. | cycles B2B / admin | devis / 0 € | Qualifie les vendeurs de données de marché (référence de valorisation, distributions par région/marque). | LOT-PQ |
| AC-11 | Basse | **mobile.de** compte concessionnaire (`C-42`) ; **SMG OAuth** (`C-03`/`C-04`, marché CH + question de l'équivalent BE) ; **AutoUncle** contact (référence valorisation, hors BE). | cycles B2B | devis | Ouvre des canaux DE/CH/NL de lecture, hors périmètre BE prioritaire. | LOT-N / LOT-B |
| AC-12 | **Interdit sans décision** | `C-15` API GraphQL mobile : usage de la clé de gateway Mashery = accès non autorisé (A11 5/5, ligne rouge). MITM dynamique hors mandat, sur appareil dédié seulement, sur décision explicite. | — | — | **Ne pas franchir** sans accord AS24 + décision juridique : c'est la ligne rouge du dossier. | LOT-B |
| AC-13 | Décision | Trancher juridiquement : interdiction du *Save Page Now* / soumission à un archiveur tiers = contournement TDM art. 4(3) (AC-J6) ; autoriser ou non le rapatriement du corpus Wayback (~53 Go, hors AS24). | 1 j | 0 € | Verrouille/libère la densification de la série de prix historique (`C-53`). En l'état : verrouillé. | LOT-J |

---

## S6 — LE SOUS-ENSEMBLE GRATUIT + AUTONOME, ET LA DÉCISION SUR LE LOT D9

**Critère S6 du plan : nommer le sous-ensemble d'options qui satisfont gratuit + autonome (+ licite),
ou déclarer l'ensemble vide.** Réponse distinguée par mode, car elle diffère radicalement.

### MODE 1 (agrégats) — sous-ensemble NON VIDE
Le sous-ensemble gratuit + autonome + licite qui **livre des annonces réelles agrégeables** contient :
- **`C-43` 2dehands.be** et **`C-44` marktplaats.nl** (socle de production, `totalResultCount`
  exhaustif, ~25-28 champs, sans anti-bot, `robots.txt`-conforme) ;
- en appoint/redondance : **`C-45` theparking.eu**, **`C-46`/`C-76` schema.org/Car** (niche),
  **`C-92`** (socles garages) ;
- en dénominateur de référence gratuit et licite : **`C-77` Statbel/DIV**, **`C-79` Car-Pass**,
  **`C-78` RDW** (NL) ;
- socle minimal AS24 licite : **`C-14`** (`totalItems`/`priceInfo`) et **`C-02`** (taxonomie).

### MODE 2 (distributions non biaisées) — sous-ensemble VIDE
**Il n'existe, sur aucune des sources testées, de voie gratuite + autonome + licite vers un
échantillon non biaisé d'annonces individuelles** — le matériau du mode 2. AS24 (`C-14`) et 2dehands
(`C-43`) n'exposent librement que des agrégats plus un échantillon massivement promu
(p < 10⁻²⁰ mesuré sur AS24 ; ~95 % DAGTOPPER sur la surface paginable de 2dehands). Toutes les voies
non biaisées sont payantes (`LOT-F`), contractuelles (`C-01` SEARCH API), interdites (`C-06`/`C-07`,
API mobile) ou hors périmètre/hors accès (`C-67` FDZ DE-only et scientifique).

### Conséquence pour le lot D9 du chantier 2
Le lot D9 (branchement réel d'une source d'annonces individuelles pour le mode 2) **ne peut PAS être
branché sur une source gratuite et autonome** : cet ensemble est vide. D9 doit donc être **construit
sur le dataset synthétique** (`EX-DATA-107`) jusqu'à ce que le commanditaire finance un fournisseur
payant ou obtienne un accord contractuel. Le mode 1, lui, peut être branché immédiatement sur
2dehands/marktplaats après la validation juridique AC-01. Cette conclusion débloque le mode 1 du
chantier 2 et met le mode 2 en attente de financement — conformément à la décision de coordinateur
corrigée après audit.

---

## JOURNAL DES ARBITRAGES (S5 — conflits probe-vs-audit tranchés)

Chaque ligne : le conflit, la décision, et le motif. Les corrections d'audit de la phase 1.5 priment
sur le texte brut des lots.

| # | Conflit | Arbitrage retenu | Motif |
|---|---|---|---|
| ARB-1 | **Dénominateur de couverture** : `LOT-CD` écrit « ~24 champs » (×3), `LOT-F` compte « /35 nommés », le plan et `FINDING §2.3` disent « /40 ». | **Dénominateur = 40** partout. `LOT-CD` corrigé de 24→35 (source mal comptée). `LOT-F` : comptages en valeur absolue conservés, **réétiquetés /40** (pas de recalcul de %). | Le titre de `FINDING-allowed-surface.md §2.3` et l'axe A3 du plan imposent 40 ; l'écart 35/40 est un défaut du document source, pas d'un agent. (audit-cluster-economie §1) |
| ARB-2 | **Médiane de prix fournisseurs** : `LOT-F` synthèse annonce **1,94 €/1 000**. | **Médiane = ~1,31 €/1 000** (valeurs à ratio confirmé seules : Apify memo23/solidcode/automation-lab + Anysite PAYG). La valeur 1,94 mélangeait Piloterr et Carapis, bornes hautes sur ratio `[NON VÉRIFIÉ]`. | La conclusion « sous 5 €/1 000 » et la dominance de `LOT-F` sur l'auto-hébergement (2,84-3,40 €) **tiennent** sous la médiane resserrée. (audit-cluster-economie §2.2) |
| ARB-3 | **2dehands comme source mode 2** : la 1ʳᵉ rédaction de `DECISION-coordinateur-source` érigeait 2dehands en source de production du mode 2. | **2dehands acquis pour le MODE 1 seulement.** Mode 2 **NON ACQUIS** : même biais qu'AS24 (~95 % DAGTOPPER, plafond ~5 010, tri URL inerte, flux organique derrière l'API interne interdite). | Le protocole de biais de `LOT-A` n'avait jamais été appliqué à 2dehands ; l'audit décisif l'a mesuré. Score `LOT-N` = 58/100. (DECISION corrigée + audit-cluster-decisif N-5/N-6) |
| ARB-4 | **Chiffres 2dehands** : `totalResultCount` = 100 200 (`LOT-N`) / 100 188 (DÉCISION) / 100 186 (audit) ; « ≥25 champs » ; `brand` listé comme champ ; `advertiser`/H3 « présent ». | Écrire **« ~100 200 (compteur vivant, ±0,02 %) »** ; **≥25/40 = union de page** (médiane **12/annonce**, ~19 mappables) ; **`brand` = dérivé du titre** (0/30, non structuré) ; **`advertiser`/H3 présent à ~33 %** (10/30), pas universel ; **inventaire paginable ~5 010**, pas 100 k. | Compteur vivant non reproductible à l'unité ; recomptage direct de l'audit sur les 30 annonces. (audit-cluster-decisif N-1/N-4/N-6) |
| ARB-5 | **« 3 mesures indépendantes »** de `LOT-A` (biais mode 2 AS24). | Reformuler en **« 1 cœur indépendant (dose-réponse) + 1 plafond (Chao1, saturation de cache) + 1 test de significativité robuste (binomial dérivé) »**. La conclusion **p < 10⁻²⁰** et la fermeture du mode 2 sur AS24 **tiennent**. | Le binomial réutilise le taux de base et le vivier des deux autres ; Chao1 mesure la saturation de ré-tirage, pas l'univers. Sans effet sur le verdict. Score `LOT-A` = 88/100. (audit-cluster-decisif A-2) |
| ARB-6 | **Dataset AS24 Bright Data** (`G2-K11` du registre disait : dataset avec volume et prix annoncés). | **Corrigé, plus restrictif** : la page produit et un tarif générique per-requête existent, mais le **volume, la fraîcheur et le périmètre de champs sont négociés au cas par cas** (« custom-built per project ») — ce n'est pas un SKU pré-livrable. | Façade marketing dédiée au-dessus du Web Unlocker générique. (probe-LOT-GH G1 ; audit) |
| ARB-7 | **A11 auto-hébergement** `C-33`/`C-34` (note 4/5 + phrase « report contractuel partiel » des fournisseurs `LOT-G`). | **Note 4/5 maintenue** ; clause « en plus… sans le report contractuel partiel » **retirée/reformulée** (le delta est illusoire : les CGU des fournisseurs ne transfèrent aucun risque non plus). | Clarification rédactionnelle, aucun verdict changé. (audit-cluster-economie §4.2) |
| ARB-8 | **« REDONDANT »** (verdict-titre `LOT-M` : stock concessionnaire ↔ 2dehands). | Traité comme **zone d'ombre** (substituabilité non mesurée par appariement direct), **pas comme fait acquis**. Le verdict « non retenu comme source primaire » **tient** par le seul **argument d'échelle** (≈500 vs 100 188, chiffré). | L'inférence de recouvrement est structurelle (multidiffusion pro), non mesurée ; l'échelle suffit seule. (audit-cluster-economie §3.2) |
| ARB-9 | **Taux `[NON VÉRIFIÉ]` de `C-47`** (50 %) présenté comme les autres dépassements >25 %. | Distingué : c'est un **sous-investissement de budget** (arbitrage de temps), pas une indétermination structurelle. Relance CarNext-via-portail-tiers (« 2 min ») recommandée en `ACTIONS-COMMANDITAIRE`. | 3 des 4 dépassements de `LOT-LO` sont structurels et justifiés ; `C-47` est d'une nature différente, honnêtement déclarée. (audit-cluster-economie §5) |
| ARB-10 | **A11 « lecture d'archive » `LOT-J`** noté 3/5, l'audit suggère « argumentable plus haut » (partie substantielle *sui generis*). | **3/5 maintenu** (plancher défendable) ; les trois limites juridiques du cluster (interdiction contractuelle AS24 ; soumission archiveur = contournement TDM ; API mobile = accès non autorisé) **tiennent, aucune à corriger**. `Innoweb` explicitement porté comme précédent *analogique*. | Audit juridique 5/5 : aucune limite à corriger ; les nuances n'inversent aucune conclusion. Scores `LOT-K`/`LOT-B` = 5/5, `LOT-J` = 4,5/5. (audit-cluster-juridique) |
| ARB-11 | **Surface autorisée AS24** : le registre la traitait comme une donnée stable. | Portée en **A12/A7** : les 17 préfixes `Allow` et le groupe d'agents d'IA ont été **ajoutés entre le 16/12/2025 et le 06/09/2026** (mesuré sur versions archivées) — c'est une **surface concédée récente, révocable au même rythme**. | Fait daté par `LOT-J` (J11/J12) ; la date exacte est demandée en `ACTIONS-COMMANDITAIRE` (AC-J1). |
| ARB-12 | **Écart 16 vs 17 préfixes `Allow`** entre `LOT-K` et `LOT-J`/`FINDING`. | **Cosmétique, sans conséquence** : `LOT-K` compte 16 lignes distinctes, `FINDING` compte les lignes 26-43 (17). Retenu : 17 préfixes. | Signalé par `LOT-K` lui-même comme « mineur sans conséquence ». (audit-cluster-juridique K) |

---

*Fin du rapport. Livrable de la phase 1.6 — `compile-1`. Les 6 critères S1–S6 sont couverts :
tableau maître complet (85 lignes, aucune cellule vide) ; 5 zones d'ombre stress-testées avec verdict
de robustesse ; recommandation à 3 niveaux avec critère de bascule mesurable par niveau et par mode ;
`ACTIONS-COMMANDITAIRE` actionnable (qui/quoi/temps/coût/déblocage) ; 12 arbitrages probe-vs-audit
journalisés ; sous-ensemble gratuit+autonome nommé pour le mode 1 et déclaré vide pour le mode 2.*
