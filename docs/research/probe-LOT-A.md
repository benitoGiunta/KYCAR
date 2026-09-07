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
