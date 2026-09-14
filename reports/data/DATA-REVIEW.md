# `data-review` — revue indépendante de la base de données fictive (phase 3.3)

> Agent `data-review` (Opus / effort high), worktree `p3/data-review`, branche `p3/data-review`.
> **Reviewer indépendant** : je n'ai participé ni à la conception (`data-model`, `dataset-design`) ni
> à la génération (`dataset-gen`) ni au provider (`fixture-provider`). Périmètre d'écriture :
> `tests/data/`, `vitest.data.config.ts`, `tsconfig.data.json`, le script `test:data` de
> `package.json`, et ce rapport. **`src/`, `tools/`, `data/` et `docs/` en lecture seule** : je ne
> corrige rien, je prouve.
>
> Entrées lues : `CLAUDE.md` §4.7 · `PLAN-3` §3.3 · `REVIEW-PROTOCOL.md` ·
> `reports/data/DATA-LEAD-DECISIONS.md` (D3-00 … D3-22, G9a) · `docs/data/DATA-MODEL.md` ·
> `data/schema/*.schema.json` · `docs/data/DATASET-SPEC.md` (61 règles, 26 anomalies, **110 sondes**) ·
> `docs/data/dataset-spec/*.json` (15 tables) · `docs/data/DATASET-GEN.md` §5–§6 (EG-01 … EG-12) ·
> `tools/dataset/` (lu, **jamais recopié**) · `data/fixtures/dev|test/*/manifest.json` ·
> `src/providers/adapters/as24/` · `src/providers/fixture/` · `src/types/{columns,vocabularies,validation}.ts` ·
> `tests/contract/provider-contract.test.ts` · `docs/requirements/draft-data-dictionary.md` ·
> `reports/data/fixture-provider.md` §11 (branche `p3/fixture-provider`, D3-22).

---

## 1. Résumé et verdict

> **État au 2026-09-13 (rev 2)** — ce §1 et les §2 à §9 décrivent la **revue initiale** (rev 1, commit `6b66e0c`). Le verdict de la porte **G9b** est rendu au **§10** « Re-revue delta », après `data-fix` (3.4), `mvp-integrate` et `fixture-perf` (3.5).

**152 sondes exécutables** dans `tests/data/` (14 fichiers), couvrant **les 110 sondes du contrat
`probes.json`** — vérifié par une sonde de couverture — plus la revue de structure, les cohérences
croisées, la vérité terrain réciproque et l'exploitabilité produit.

| Profil | Vertes | Rouges | Dettes ratifiées (`it.fails` annoté) | Durée |
|---|---:|---:|---:|---:|
| `test` (chargé par l'application, D3-01) | **136** | **16** | 3 (P-10, P-11, P-57) | **44,5 s** |
| `dev` (défaut de `npm run test:data`) | **137** | **15** | 3 + 5 sondes de bruit d'échantillonnage | **14,7 s** |

**Aucun BLOQUANT.** R3 est tenue **de bout en bout** (aucune clé interdite dans 146 clés d'instance,
0 téléphone / courriel / URL dans 1 687 922 chaînes, `dealerBucket` uniforme au khi-deux et sans
corrélation de rang avec l'effectif) ; le schéma est cohérent avec le dictionnaire et les
vocabulaires `KYCAR_*` ; les 60 000 lignes livrées sont **100 % conformes** au schéma ; le
déterminisme est prouvé par régénération.

**19 constats** (`DR3-01` … `DR3-19`) : **13 MAJEURS**, **6 MINEURS**, portés par **16 sondes
rouges** au profil `test`. Ils se répartissent en trois familles, et **aucun ne met en cause la
véracité d'une valeur affichée** :

1. **La vérité terrain ne tient pas ses promesses de détection** (5 constats) — le rappel de M1 est
   de **36 %** au lieu de 90 %, celui de M2 de **51 %** au lieu de 85 %, **61 valeurs injectées** ne
   se retrouvent plus dans la ligne, **13 anomalies A-04** n'ont aucune conséquence canonique, et
   **5 taux d'anomalie** ne sont pas appliqués à la base que `anomalies.json` déclare. C'est la
   famille la plus grave : un jeu de données dont la vérité terrain n'est pas retrouvable ne peut
   pas valider un détecteur.
2. **Des tolérances de la spécification sont arithmétiquement ou structurellement inatteignables**
   (4 constats) — `P-45` (κ maximal atteignable **0,0405** pour une tolérance à [0,25 ; 0,60]),
   `P-25`, `P-68`, `P-69`. Même classe que la dette **EG-11 / D3-20** déjà ratifiée : la donnée n'est
   pas fausse, la spécification l'était.
3. **Des écarts de garde, de vocabulaire et de documentation** (10 constats) — TVA déductible
   acceptée **en silence** sur un particulier, parcours P1 **huit fois** moins fourni qu'annoncé,
   `snapshotId` contredit par sa propre table, `dependentSchemas` incomplet, deux codes d'anomalie
   employés pour deux notions chacun.

**Porte G9b : FRANCHISSABLE** — sous condition que les 13 MAJEURS soient corrigés par `data-fix`
(3.4) et `fixture-provider` **ou** consignés en dettes motivées `D3-nn` avant la porte. Détail au §9.

---

## 2. Méthode

### 2.1 Ce que j'ai recalculé moi-même

Toutes les mesures de ce rapport sont produites par **mon propre code**, à partir des fichiers
livrés. Rien n'est repris de `tools/dataset/check.mjs`, de `generation.json` ni de `DATASET-GEN.md`.
Le chargement, les statistiques (quantiles, Pearson, OLS à *k* régresseurs, khi-deux avec sa valeur
p, κ de Cohen, corrélation de rang) et les dérivations d'annonce sont dans `tests/data/harness.ts`.

Chaque sonde **publie sa mesure** sur la sortie standard (`MESURE P-nn | profil | …`) : la table du
§4 est produite par l'exécution, pas recopiée à la main.

### 2.2 Ce que j'ai contrôlé du `data:check` du générateur

`tools/dataset/check.mjs` rejoue **70 sondes** sur les 110. J'ai **rejoué les 70** par mon propre
code (et pas seulement les 20 demandées) et **couvert les 40 restantes**. Trois contrôles du
générateur se sont révélés **incomplets ou inopérants** — ce sont eux qui ont livré trois des
constats les plus importants :

| Contrôle du générateur | Ce qu'il fait réellement | Ce que ma sonde ajoute |
|---|---|---|
| `P-68` | `add('P-68', …, true)` — **la sonde passe toujours**, aucune tolérance n'est évaluée, et elle compte « prix **ou images** » | tolérance réelle [14 %, 20 %] sur le **prix seul** → **DR3-06** |
| `P-55` | 30 champs **inconditionnels** sur les 82 de `baseRates` (`presenceRates`, liste en dur) | les 79 champs mesurables, avec le modèle d'éligibilité explicité → **DR3-05** |
| `P-72` | effectif attendu = `rate × N` pour **toutes** les anomalies | effectif attendu = `rate × base déclarée`, les deux colonnes publiées → **DR3-10** |

Les sondes **P-45, P-67, P-69, P-75, P-76, P-77, P-80, P-81, P-82, P-86, P-88, P-89, P-90, P-91,
P-95, P-97, P-98, P-106, P-109** et 21 autres ne sont **pas exécutées** par `data:check` ; quatre
d'entre elles sont rouges.

### 2.3 Ce que j'ai ajouté au-delà du contrat

- **Structure** (`tests/data/structure-schema-adapter.test.ts`) : `additionalProperties` sur tous les
  objets, inclusion des 19 énumérations dans les vocabulaires `KYCAR_*`, fermeture des 9 unités,
  nullabilité, contrainte inter-champs déclarée, conformité **ajv** des 60 000 lignes et des
  6 manifests, cas limites de l'adaptateur, `BOOLEAN_FLAG_BIT`, dédoublonnage.
- **Cohérences croisées** : carrosserie ↔ segment curaté, cylindrée ↔ électrique, CO₂ ↔ puissance,
  TVA ↔ type de vendeur, garantie ↔ type de vendeur, ordre des dates.
- **Vérité terrain réciproque** : détecteurs simples (sentinelles, prix et kilométrage hors domaine,
  dates impossibles) appliqués à **toutes** les lignes pour chercher une anomalie **non déclarée**.
- **Exploitabilité produit** : parcours P1 et P2, densité par cellule, alimentation des 38 filtres
  déclarés alimentés, cohérence d'échelle `dev` ↔ `test` sur 15 proportions structurantes.
- **Contre-expertise** (`tests/data/cross-findings.test.ts`) des sept constats de `fixture-provider`
  (D3-22) et de la demande d'exclusion EG-10 de `dataset-gen`.

### 2.4 Hypothèses écrites du reviewer (E4)

| # | Hypothèse | Où |
|---|---|---|
| HR-01 | Les sondes de **distribution de prix** (`P-31` … `P-39`) écartent les annonces dont le prix est **délibérément faussé et déclaré** au manifest. Sans cela `P-32` mesurerait la queue d'un outlier à 3 M€. Les deux valeurs, avec et sans exclusion, sont publiées. | `harness.ts` §12 |
| HR-02 | Le **segment** n'étant écrit nulle part (E-02), les sondes par segment le reconstituent depuis `models.json` pour les **modèles curatés** seulement (D3-14) et publient l'effectif couvert. | `harness.ts` §10 |
| HR-03 | Le **classifieur de langue** de `P-54` est reconstruit par le reviewer sur les jetons de finition **non ambigus** observés : aucune table de la spécification ne publie le vocabulaire de finition par langue (voir DR3-16). | `p46-sellers-geo.test.ts` |
| HR-04 | Une annonce dont `fuelCategory` ou `firstRegistrationDate` est **absente** n'est ni conforme ni fautive : elle est **indéterminée**. Elle est comptée à part, jamais comme violation (`P-59`, `P-85`, `P-98`). | 3 sondes |
| HR-05 | Le modèle d'**éligibilité** de `P-55` (population sur laquelle porte chaque taux d'absence) est explicité champ par champ dans la table `ELIGIBILITY` ; trois champs dont la population n'est pas observable sont **nommés et écartés**. | `p55-missingness.test.ts` |
| HR-06 | L'**exploitabilité produit** se juge sur le profil `test` (celui que l'application charge, D3-01) ; au volume `dev` la mesure est publiée **sans assertion**. | `product-fitness.test.ts` |
| HR-07 | `P-12` exclut les lignes déclarées `FIRST_REG_OUT_OF_RANGE`, comme `P-87` le fait déjà — autorisé par le corollaire du §6 de `DATASET-SPEC` et demandé par EG-10. Vérifié : **42 violations sans exclusion, 0 après**, et l'exclusion ne recouvre que des lignes déclarées. | `cross-findings.test.ts` |

### 2.5 Portes exécutées

| Porte | Commande | Résultat |
|---|---|---|
| Types | `npx tsc --noEmit -p tsconfig.data.json` | **0 erreur** |
| Lint du périmètre | `npx eslint tests/data vitest.data.config.ts` | **0 problème** |
| Lint global | `npm run lint` | **vert** |
| Sondes, profil `dev` | `npm run test:data` | 137 vertes / 15 rouges — **14,7 s** |
| Sondes, profil `test` | `KYCAR_DATA_PROFILE=test npm run test:data` | 136 vertes / 16 rouges — **44,5 s** |

---

## 3. Structure — schéma, adaptateur, canonique (partie A)

### 3.1 Schéma source vs dictionnaire vs vocabulaires — **conforme**

| Contrôle | Mesure | Verdict |
|---|---|---|
| `additionalProperties: false` sur tous les objets (source + manifest) | **0 objet ouvert** | conforme |
| Énumérations ⊆ vocabulaires `KYCAR_*` | **19 énumérations confrontées, 0 écart** (dont `equipment` 132 codes, `bodyColor` 14, `marketplace` 9 avec `ca` de D3-07) | conforme |
| Unités fermées | **9 unités contrôlées, 0 écart** (`km`/`mi`, `kW`/`hp`, `ccm`/`ci`, `g/km`/`g/mi`, `l/100km`/`mpg`/`km/l`, `kWh/100km`, `kWh`, `Months`, `EUR`/`CAD`) | conforme |
| Nullabilité | **6 champs requis** (`id`, `webPage`, `marketplace`, `vehicleType`, `make`, `location`), **aucun type `null`** dans tout le schéma | conforme à `DATASET-SPEC` §8.3 règle 2 |
| Contrainte inter-champs NEDC/WLTP | `dependentSchemas.wltp` interdit `consumption`, `co2Emissions`, `efficiencyClass` | déclarée — **incomplète, voir DR3-12** |
| Conformité des lignes livrées | **ajv 8.20.0 : 60 000 lignes, 0 rejet ; 6 manifests conformes** | conforme |
| Manifest : champs, chaînage, hachages | `listingCount`, `sha256` (octets **non compressés**), `sha256Gz`, tailles : **3/3 par profil exacts** ; chaînage `previousSnapshotId` et `capturedAt` strictement croissants ; `carriedOverCount + enteredCount = listingCount` | conforme |

### 3.2 Adaptateur — perte d'information, arrondis, vocabulaires, cas limites

| Contrôle | Mesure | Verdict |
|---|---|---|
| Perte d'information | **71 champs** de premier niveau au schéma, **71 employés** par les fixtures, **0 champ d'instance hors schéma** ; la liste des champs source non transportés est connue et motivée (écart E-07 / dette D8-32) | conforme |
| Arrondis kW ↔ ch | `\|powerHp − round(power/0,7355)\| / powerHp ≤ 2 %` sur **55 968 annonces, 0 écart** (63 déclarées A-13/A-13b) | conforme |
| Vocabulaires : valeur inconnue | jamais silencieuse — cas limites ci-dessous | conforme sauf 1 cas |
| Cas limites rejoués | `2024-13` → `FIRST_REG_UNPARSEABLE` · prix 0 → `PRICE_OUT_OF_RANGE` · prix 1 → `PRICE_SENTINEL_ABSOLUTE` · prix 123 456 → **rien** (témoin, licite) · 0 km sur occasion ancienne → `SUSPECT_ZERO_MILEAGE` · `onRequestOnly` + montant → `PRICE_ON_REQUEST_WITH_AMOUNT` · `mileageUnit = mi` → `UNIT_UNSUPPORTED` · `powerUnit = hp` → `UNIT_UNSUPPORTED` | conforme |
| **TVA déductible chez un `PRIVATE`** | **acceptée en SILENCE**, `vatDeductible = 2` (« oui ») | **DR3-13, MAJEUR** |
| `BOOLEAN_FLAG_BIT` tri-état (D3-10) | **6 booléens sur 10** distinguent « inconnu » de « faux » (`hadAccident`, `isPluginHybrid`, `hasParticleFilter`, `hasFullServiceHistory`, `wasCabOrRental`, `isMetallic`) ; les 4 autres ont un **défaut documenté** (1 bit) | conforme à E-07 |
| Dédoublonnage indépendant de l'ordre (D3-15) | `test` : **20 identifiants écrits deux fois, 20 000 lignes → 19 980 servies, 0 doublon subsistant** ; `dev` : 5 → 4 995 | conforme |

### 3.3 R3 par construction — **tenue**

| Contrôle | Mesure |
|---|---|
| Vocabulaire d'**instance** des fixtures (`P-80`) | **146 clés distinctes** balayées sur les 3 snapshots + manifests, **0 interdite** (E1–E17 d'`EX-DATA-47`) |
| Garde étendue à `data/` (D3-12) | **33 fichiers JSON** (`data/schema`, `data/fixtures`, `docs/data/dataset-spec`), `examples/invalid-*.json` exclus **par nom**, JSON Schema réduit à son **vocabulaire d'instance** (les mots-clés `description`/`properties` ne sont pas des champs KYCAR) → **0 clé interdite** |
| Texte libre (`P-107`) | **1 687 922 chaînes** balayées hors `webPage` et `id` : **0 téléphone, 0 courriel, 0 URL** |
| `dealerBucket` non réversible (`P-81`) | 320 clés distinctes ; khi-deux d'uniformité sur chacun des 4 octets : p = 0,202 / 0,202 / 0,920 / 0,287 (**tous > 0,01**) ; **corrélation de rang clé ↔ effectif = −0,0035** — aucun index ordonné n'est reconstituable |
| `seller` et `location` | deux propriétés chacun, aucun code postal exact, aucune commune (D3-02, D3-06) |

### 3.4 Clés et identité — **conforme**

`id` unique hors les 20 doublons déclarés `A-07`, forme 8-4-4-4-12 minuscule ; stabilité des
identifiants entre snapshots (une survivante conserve le sien, une entrante en reçoit un neuf,
**jamais réutilisé** : 2 091 entrées = 2 091 sorties sur identifiants distincts) ; `previousSnapshotId`
chaîné ; `capturedAt` strictement croissant ; ordre des dates `firstRegistrationDate ≤ createdAt ≤
firstActivatedDate ≤ lastUpdatedAt ≤ capturedAt` sur **60 000 annonces, 0 violation**.

---

## 4. Données — les 110 sondes du contrat

Verdict donné sur le profil **`test`** (celui que l'application charge, D3-01). `dev` sert de
contrôle d'échelle : voir §6.3. **Légende** : ✅ verte · ❌ rouge (= constat) · 💤 dette ratifiée ·
🔸 verte sur `test`, hors tolérance sur `dev` par bruit d'échantillonnage (EG-12 et extension DR3-19).

| Sonde | Sonde exécutable | Mesure (profil `test`) | Tolérance | Verdict |
|---|---|---|---|---|
| P-01 | `R-DATA` volume | 20 000 / 20 000 / 20 000 | exact | ✅ |
| P-02 | volume | 3 snapshots, `capturedAt` conformes | = 3 | ✅ |
| P-02 (id) | **R-DATA-01** | `be-20260907T060000Z` vs motif `be-fixture-…` de `profiles.json` | conforme à `profiles.json` | ❌ **DR3-01** |
| P-03 | déterminisme | régénération à graine 1 264 141 121 : `sha256` et taille gz **identiques** au manifest et au fichier | octet à octet | ✅ |
| P-04 | déterminisme | **100,00 %** d'identifiants différents à graine différente | ≥ 99 % | ✅ |
| P-05 | taille | **8 167 661** octets gz (marge 2,63 %) | ≤ 8 Mio | ✅ |
| P-06 | ordre | 0 inversion sur 3 snapshots | croissant | ✅ |
| P-07 | marques | **262** marques distinctes | ≥ 150 | ✅ |
| P-08 | apportionnement | écart maximal **1** (`ligier` 5 attendu / 4 obtenu) | ± 1 | ✅ |
| P-09 | marques | volkswagen, bmw, mercedes-benz, peugeot, opel | ordre exact | ✅ |
| P-10 | modèles | golf **590** · polo **383** · corsa **357** · 320 **204** | ≥ 650/480/440/170 | 💤 **EG-01 / D3-19** |
| P-11 | familles | serie-3 **416** · serie-1 **261** | ≥ 280 chacune | 💤 **EG-01 / D3-19** |
| P-12 | fenêtres | **0** violation (48 lignes A-05 exclues, EG-10) | = 0 | ✅ |
| P-13 | âge | médiane **7** ans (n = 19 701) | [6, 9] | ✅ |
| P-14 | âge | **3,66 %** ≥ 20 ans | [2,5 %, 5,5 %] | ✅ |
| P-15 | âge | **0,62 %** ≥ 30 ans | [0,2 %, 1,2 %] | ✅ |
| P-16 | carburant | B 54,32 · D 27,05 · hyb 13,20 · E 4,37 % | [52-59]/[23-29]/[11-16]/[3,5-5,8] | ✅ |
| P-17 | carburant | diesel 2015 **44,02 %** (n = 870) | [40 %, 50 %] | ✅ (E-01, D3-13) |
| P-18 | carburant | 2012 **56,48 %** · 2024 **3,56 %** | [55-65] / [1,5-4,5] | 🔸 |
| P-19 | carburant | électrique 2024 **22,62 %** | [19 %, 27 %] | ✅ |
| P-20 | carburant | **1** inversion sur 2016..2026 | ≤ 1 | ✅ |
| P-21 | carburant | utilitaire 64,84 % / citadine 12,97 % = **5,00** | ≥ 3 | ✅ |
| P-22 | hybrides | **69,37 %** de rechargeables (cat. 2, 2023-2026) | [50 %, 70 %] | ✅ |
| P-23 | segments | SUV ≥ 2022 **38,36 %** | [38 %, 52 %] | 🔸 (EG-12) |
| P-24 | segments | coupé **2,41 %** | [2,0 %, 3,5 %] | ✅ |
| P-25 | **R-DATA-07** | 2010 16,67 % · 2024 69,55 % · **3 inversions** sur 2010..2026 | ≤ 1 inversion | ❌ **DR3-03** |
| P-26 | boîte | **0** électrique à boîte manuelle | = 0 | ✅ |
| P-27 | couleurs | noir+gris+blanc+argent **72,11 %** | [68 %, 78 %] | ✅ |
| P-28 | kilométrage | médiane à 5 ans **74 900** km (n = 2 198) | [66 000, 84 000] | ✅ |
| P-29 | kilométrage | diesel 93 350 / essence 63 750 = **1,464** | [1,30 ; 1,70] | ✅ |
| P-30 | kilométrage | **0** valeur non multiple de 100 sur 58 894 | 100 % | ✅ |
| P-31 | prix | médiane **16 157,5 €** (n = 19 136 ; 16 000 € sans exclusion HR-01) | [13 500, 18 500] | ✅ |
| P-32 | prix | moyenne/médiane **1,306** (1,504 sans exclusion) | [1,15 ; 1,40] | ✅ |
| P-33 | prix | corr(ln prix, âge) **−0,7082** | < −0,65 | ✅ |
| P-34 | prix | corr(prix, âge) **−0,4956** | < −0,45 | ✅ |
| P-35 | prix | OLS β₁ **+0,07069**, β₂ **−0,04036** (n = 18 300) | [0,055 ; 0,100] / [−0,055 ; −0,022] | ✅ |
| P-36 | prix | médiane par année 2008..2024 : **0 inversion** | ≤ 1 | ✅ |
| P-37 | prix | prime E/B **1,1032** (49 strates segment × âge × puissance) | [1,05 ; 1,25] | 🔸 |
| P-38 | prix | prime PRO/PRIVÉ **1,0564** (136 strates segment × âge) | [1,02 ; 1,12] | 🔸 |
| P-39 | prix | terminaisons commerciales **79,26 %** | [70 %, 88 %] | ✅ (EG-07) |
| P-40 | statut | `ON_REQUEST` **3,04 %** | [2 %, 5 %] | ✅ |
| P-41 | statut | `MISSING` **0,60 %**, **0** non déclarée | [0,4 %, 0,9 %] + 100 % déclarées | ✅ |
| P-42 | TVA | **0** particulier porte `isTaxDeductible` | = 0 | ✅ |
| P-43 | TVA | **35,13 %** chez les PRO renseignés (n = 12 305) | [31 %, 39 %] | ✅ |
| P-44 | TVA | **0** écart de présence, **0** écart de valeur | ⟺ et ±1 € | ✅ |
| P-45 | **R-DATA-08** | κ = **0,0119** (n = 10 133) ; P(cat 1-2) = 52,55 %, P(M1_LOW) = 2,24 % ⇒ **κ maximal atteignable 0,0405** | [0,25 ; 0,60] | ❌ **DR3-04** |
| P-46 | vendeurs | PRO **68,67 %** | [67 %, 73 %] | ✅ |
| P-47 | vendeurs | **0** écart `dealerBucket` ⟺ type D | exact | ✅ |
| P-48 | vendeurs | **320** regroupements (attendu 320) ; premier/médian = **18,09** | ±2 % ; ≥ 8 | ✅ |
| P-49 | vendeurs | **0** regroupement inconnu de S0 | 100 % | ✅ |
| P-50 | publicité | tier **17,96 %** globalement, **0** chez les PRIVÉ | [14 %, 24 %] et < 30 % | ✅ |
| P-51 | géographie | VLG 54,31 · WAL 36,90 · BRU 7,98 % | 55/37/8 ± 2 pts | ✅ |
| P-52 | géographie | 0 mal formée · 10..99 **99,61 %** · 00..09 **0,39 %** (85 absentes) | 99,6 / 0,4 % | ✅ |
| P-53 | géographie | **0** préfixe 10..99 non résolu · 235 déclarés A-21 · **0** non déclaré | 100 % | ✅ |
| P-54 | langue | 7 823 versions classées ; « de » **33 sur le préfixe 47, 0 ailleurs** ; croisement PRO **1,46 %** | de sur 47 seul ; ≤ 5 % | ✅ (HR-03) |
| P-55 | **R-DATA-11** | **79 champs** mesurés, **3 hors tolérance** : `isPluginHybrid` 4,59 % vs 15 % (**69,4 %**), `consumption.electricCombined` 24,14 % vs 15 % (**60,9 %**), `wltp.consumptionElectricCombined` 10,42 % vs 15 % (**30,5 %**) | ±25 % relatifs | ❌ **DR3-05** |
| P-56 | manquants | écart-type des taux **0,2591** (59 champs) | > 0,15 | ✅ |
| P-57 | manquants | corrélation **0,0763** (borne arithmétique EG-11 : 0,065) | [0,10 ; 0,40] | 💤 **EG-11 / D3-20** |
| P-58 | manquants | PRIVÉ/PRO **2,192** | ≥ 1,8 | 🔸 (EG-12) |
| P-59 | manquants | **0** valeur électrique hors {E,2,3} · **0** cylindrée sur un E · **0** champ PRO chez un PRIVÉ (47 à carburant indéterminé, HR-04) | 0 | ✅ |
| P-60 | émissions | **0** écart > 6 g/km sur **33 876** annonces ; écart maximal **0,55** g/km | ≤ 6 g/km | ✅ |
| P-61 | émissions | **0** annonce ≥ 2018-09 hors WLTP · **0** < 2018-09 hors NEDC | 100 % | ✅ |
| P-62 | émissions | sans branche **14,62 %** ; **49,87 %** au-delà de 17 ans | [10 %, 20 %] et > 30 % | ✅ |
| P-63 | émissions | **0** écart sur **45 907** normes Euro renseignées | 100 % | ✅ |
| P-64 | émissions | 2 640 électriques, **0** CO₂ non nul, **0** dans `wltp.co2EmissionsCombined` | = 0 / jamais | ✅ |
| P-65 | snapshots | sorties **10,47 %** puis **10,10 %** | [8 %, 12 %] | ✅ |
| P-66 | snapshots | 262 marques, **0** divergence | 100 % | ✅ |
| P-67 | snapshots | 2 091 = 2 091 · 2 017 = 2 017 (identifiants distincts) ; manifest en **lignes** 2 094 / 2 020 | entrées = sorties | ✅ (voir DR3-17) |
| P-68 | **R-DATA-14** | révisions **observables** **10,24 %** et **10,25 %** ; baisse 86,8 % / 86,4 % ; `manifest.delta.priceRevisedCount` = 3 055 / 3 052 | [14 %, 20 %] · [80 %, 88 %] | ❌ **DR3-06** |
| P-69 | **R-DATA-15** | médiane S0 16 000 € → S2 **16 900 €**, soit **+5,62 %** ; sur les seules survivantes **−0,29 %** | S2 < S0, recul ≤ 3 % | ❌ **DR3-07** |
| P-70 | snapshots | **0** annonce modifiée sur **32 180** survivantes non révisées | champ à champ | ✅ |
| P-71 | snapshots | **0** changement de kilométrage sur 35 852 survivantes | ≤ 0,8 %, jamais en baisse | ✅ |
| P-72 | **R-DATA-19** | 25 groupes ; **5 hors tolérance** sur leur base déclarée : A-07 / A-07b / A-08 **+46 %**, A-16 **+658 %**, A-20 **+3 189 %** | ±20 % relatifs | ❌ **DR3-10** |
| P-73 | **R-DATA-20** | **7 308** déclarations, **0 orpheline**, **61 valeurs injectées introuvables** dans la ligne | 100 % | ❌ **DR3-11** |
| P-74 | anomalies | **0** annonce à deux anomalies de prix | = 0 | ✅ |
| P-75 | **R-DATA-16** | **18/50** M1 signalés (**36,00 %**) ; **32** écartés par `PRICE_IMPLAUSIBLE_IN_CELL` | ≥ 90 % | ❌ **DR3-08** |
| P-76 | **R-DATA-17** | **36/70** M2 signalés (**51,43 %**) ; 25 évalués non signalés (écart au modèle jusqu'à **108,8 %**), 9 sans verdict | ≥ 85 % | ❌ **DR3-09** |
| P-77 | anomalies | 20 sentinelles, **0** verdict porté, 20 exclues de `V_price` | 0 | ✅ |
| P-78 | cellules | **268** cellules (marque, modèle, année) à n ≥ 12 | ≥ 150 | ✅ |
| P-79 | cellules | **163** cellules (marque, modèle) à n ≥ 30 | ≥ 90 | ✅ |
| P-80 | R3 | **146** clés d'instance, **0** interdite | 0 | ✅ |
| P-81 | R3 | khi-deux par octet p ∈ [0,202 ; 0,920] ; corr. de rang **−0,0035** | p > 0,01 | ✅ |
| P-82 | filtres | **38** filtres alimentés, **0 dégénéré** ; **15** non alimentés publiés, dont **2** mono-valeur (`atype`, `powertype`) vérifiés mono-valeur | ≥ 2 valeurs ou publié | ✅ |
| P-83 | prix | `superDeal` **3,91 %**, **0** hors PRO, **0** hors catégories 1-2 | [2,5 %, 5,5 %] | ✅ |
| P-84 | état | 50 annonces à 0 km, toutes déclarées A-03, **0** violation ; accidentés **3,70 %** | 100 % · [2 %, 5 %] | ✅ |
| P-85 | état | 197 `offerType = O`, **0** sous 30 ans (9 sans date, HR-04) | 100 % | ✅ |
| P-86 | dates | **0** violation d'ordre sur **60 000** annonces datées | 100 % | ✅ |
| P-87 | dates | **0** date hors bornes non déclarée (48 déclarées A-05) | 100 % | ✅ |
| P-88 | dates | **0** hors [−24, +48] mois sur 22 316 renseignées | 100 % | ✅ |
| P-89 | snapshots | chaînage conforme, `delta` cohérent, **0** ligne hors `Active` | 100 % | ✅ |
| P-90 | prix | **0** `ON_REQUEST` avec montant non déclarée (24 déclarées A-20) | 100 % | ✅ |
| P-91 | prix | **0** `net ≥ prix` · **0** `vatRate` à plus d'une décimale · **0** devise ≠ EUR | 100 % | ✅ |
| P-92 | prix | couverture de prix **96,36 %** | ≥ 80 % | ✅ |
| P-93 | vendeurs | plus petit regroupement **11** ; **0** paire à même bucket ; **0** sans peer | ≥ 3 · 100 % | ✅ |
| P-94 | manifest | **0** écart de `marketplace` | 100 % | ✅ |
| P-95 | motorisation | **0** écart > 2 % sur **55 968** annonces | 100 % | ✅ |
| P-96 | écologie | **0** ligne mélangeant les branches | 0 | ✅ |
| P-97 | écologie | **0** valeur `…WithFallback` divergente, **0** repli manquant | 100 % | ✅ |
| P-98 | motorisation | **0** incohérence non déclarée (48 A-15, 55 à carburant absent) | 100 % | ✅ |
| P-99 | écologie | **0** `co2Class` hors WLTP, **0** `efficiencyClass` hors NEDC | 0 | ✅ |
| P-100 | kilométrage | **0** au-dessus de 200 000 km/an hors 246 déclarations | 100 % | ✅ |
| P-101 | manifest | **0** code inatteignable dans `groundTruth` | 0 | ✅ |
| P-102 | forme | **0** ligne sur **60 000** portant plus d'une décimale (contrôle **textuel**) | 100 % | ✅ |
| P-103 | forme | **71** clés de premier niveau, **ordre total unique** (tri topologique), **0** ligne en écart | 100 % | ✅ |
| P-104 | forme | **0** identifiant mal formé, 60 doublons déclarés A-07, **0** non déclaré | 100 % | ✅ |
| P-105 | forme | **0** deeplink non conforme | 100 % | ✅ |
| P-106 | forme | `imageCount` maximal **30** ; **0** doublon d'équipement ou de sceau | ≤ 50 · 0 | ✅ |
| P-107 | R3 | **0** téléphone / courriel / URL sur 1 687 922 chaînes | 0 | ✅ |
| P-108 | manquants | absence de `paintType` **82,75 %** | ≥ 75 % | ✅ |
| P-109 | déterminisme | `sha256` = octets **non compressés** (et ≠ hachage gz) · `sha256Gz` vérifié — 3/3 | exact | ✅ |
| P-110 | modèles | couverture curatée **68,33 %** | ≥ 65 % | ✅ |

**Décompte sur les 110 sondes du contrat** : **97 vertes** (dont **5 marquées 🔸** : vertes sur
`test`, hors tolérance sur `dev`), **10 rouges** (`P-02`, `P-25`, `P-45`, `P-55`, `P-68`, `P-69`,
`P-72`, `P-73`, `P-75`, `P-76`), **3 dettes ratifiées** (`P-10`, `P-11`, `P-57`). 97 + 10 + 3 = 110.

Les **6 autres sondes rouges** de la suite (16 au total au profil `test`) sont des contrôles ajoutés
par la revue : `R-DATA-04` (effet réel d'EG-09), `R-DATA-24` (garde de schéma), `S-08` (cas limite de
l'adaptateur), `R-DATA-28` (parcours P1), `C-P3-9` et `C-P3-12` (contre-expertise).

---

## 5. Cohérences croisées et vérité terrain (au-delà de la spécification)

### 5.1 Cohérences croisées — **toutes vertes**

| Contrôle | Mesure (`test`) |
|---|---|
| 1re immatriculation ≤ publication ≤ mise à jour ≤ capture | **0** violation / 60 000 |
| km / âge plausibles par énergie | médiane à 5 ans diesel 93 350 / essence 63 750 (rapport 1,46) ; **0** annonce > 200 000 km/an hors déclaration |
| prix / segment / âge monotone en médiane | prix médian par année **strictement croissant** 2008 → 2024 (3 950 € → 37 990 €), **0 inversion** |
| TVA déductible ⇒ PRO | **0** annonce à TVA déductible hors PRO |
| garantie ⇒ PRO, `warranty = 0` ⇏ garanti | **0** garantie hors PRO, **0** incohérence |
| `priceOnRequest` ⇒ aucun montant | **0** non déclarée (24 déclarées A-20) |
| ch = kW × 1,35962 arrondi | **0** écart > 2 % sur 55 968 |
| CO₂ cohérent énergie × puissance × année | CO₂ médian **croissant** par palier de puissance : 110 → 127 → 144 → 169 g/km ; CO₂ dérivé de la consommation à **0,55 g/km** près |
| électrique = 0 g CO₂, jamais dans `wltp.co2EmissionsCombined` | **0** exception sur 2 640 électriques |
| électrique sans cylindrée | **0** exception |
| `efficiencyClass` seulement NEDC, `co2Class` seulement WLTP | **0** exception |
| carrosserie ⊆ segment curaté | **0** incohérence sur 13 553 annonces curatées, 1,00 % de code 7 « Autres » (attendu 1 %) |
| préfixes postaux dans la table de géographie | **0** préfixe 10..99 non résolu |
| langues fr/nl selon préfixe | « de » **exclusivement** sur le préfixe 47 ; croisement PRO 1,46 % |
| `imageCount` ≥ 0 et borné | maximum **30** (borne 50) |
| équipements ⊆ vocabulaire, sans doublon | **0** doublon, vocabulaire respecté (S-02) |

### 5.2 Doublons

| Type | Déclaré au manifest | Retrouvé | Verdict |
|---|---:|---:|---|
| `DUPLICATE_LISTING_ID` (A-07) | 20 | **20** identifiants écrits deux fois, **0** non déclaré | conforme |
| `DUPLICATE_VALUE_CONFLICT` (A-07b) | 50 | 50 paires, **identifiants différents**, **même** `dealerBucket` | **DR3-15** (nom impropre) |
| `CROSS_SELLER_DUPLICATE` (A-08) | 160 | 160 paires, **0** au même `dealerBucket`, **0** sans `peerListingId` | conforme |
| Doublon **non déclaré** au-delà du taux | — | **0** | conforme |

### 5.3 Vérité terrain — l'aller et le retour

**Retour (aucune ligne anormale hors manifest)** : détecteurs simples appliqués aux 60 000 lignes —
prix sentinelle, prix > 5 M€, kilométrage > 2 M km, date impossible → **0 occurrence non déclarée**.
La réciproque est donc **tenue**.

**Aller (chaque anomalie déclarée est retrouvable)** : **quatre défauts**, tous MAJEURS.

| Anomalie | Ce que le manifest promet | Ce que je mesure |
|---|---|---|
| `A-10` (M1) | « rappel ≥ 90 % » ; le plancher absolu de **250 €** empêche l'annonce de sortir de `V_price` | **18/50** signalées. **32/50** tombent sous `0,10 × médianeRéf(C)` et portent `PRICE_IMPLAUSIBLE_IN_CELL` (`EX-DATA-19(2)`) : elles sortent de `V_price(C)` et ne sont **jamais** évaluées. Le plancher qui compte est **relatif à la cellule**, pas absolu — 260–480 € contre une médiane de cellule à 15 950 € donne un seuil de 1 595 €. |
| `A-11` (M2) | « rappel ≥ 85 % », facteurs 0,30–0,50 / 2,0–3,2 pour un `\|z\| ≥ 3,5` | **36/70** signalées ; **25** sont évaluées mais **non signalées**, avec un écart au modèle allant jusqu'à **108,8 %**. Le `σ_p = 0,20` du modèle de prix n'est pas la dispersion que M2 mesure : la régression de cellule `(marque, modèle)` ne contrôle que l'année et le kilométrage, la variance de carburant, de puissance et de type de vendeur y reste. |
| `A-04` (kilométrage implausible) | « 100 % des formes (a) dépassent la borne » (EG-09) | **37/50**. Le plafond de **1 900 000 km** (posé pour rester sous `A-04b`) rend le rythme de 260 000–360 000 km/an **inatteignable** au-delà de ~114 mois d'âge. En aval : **13/60** déclarations n'ont **aucune** conséquence canonique. |
| `A-09` / `A-09b` (versions) | toute anomalie déclarée est retrouvable (§6) | **49** déclarations `VERSION_*` n'ont **plus de `modelVersion`** : le modèle de complétude a retiré le champ **après** l'injection. |

---

## 6. Exploitabilité produit

### 6.1 Densité et filtres — **suffisants**

| Contrôle | Mesure (`test`) | Plancher |
|---|---|---|
| Cellules `(marque, modèle, année)` à `n_price ≥ 12` (`EX-DATA-86`) | **268** sur 5 833 | ≥ 150 |
| Cellules `(marque, modèle)` à `n_price ≥ 30` (`EX-DATA-90`) | **163** sur 1 444 | ≥ 90 |
| Dix modèles les plus denses | golf 13 · passat 12 · polo 11 · corsa 11 · a4 11 · octavia 11 · 3008 7 · astra 9 · 2008 7 · 320 8 **années à n ≥ 12** | ≥ 1 chacun |
| Filtres retenus alimentés | **38** recalculés, **0 dégénéré** | ≥ 2 valeurs |
| Filtres non alimentés | **15** publiés (13 sans champ KYCAR, 2 mono-valeur : `atype`, `powertype`, **vérifiés mono-valeur**) | nommés, jamais découverts |

### 6.2 Parcours cibles

| Parcours | Mesure (`test`) | Attendu (`DATASET-SPEC` §1.4) | Verdict |
|---|---|---|---|
| **P2 Opel Corsa** | **357** annonces · 344 à prix affiché · P10 1 957 € / médiane 6 950 € / P90 14 950 € · 27 années dont **11 à n ≥ 12** | ≈ 505 | matière suffisante ✅ (effectif : dette EG-01) |
| **P2 VW Golf** | **590** · 579 à prix · P10 2 890 / médiane 9 500 / P90 19 958 € · 29 années dont **13 à n ≥ 12** | ≈ 748 | ✅ |
| **P2 BMW 320** | **204** · 198 à prix · P10 5 900 / médiane 21 970 / P90 50 927 € · 26 années dont **8 à n ≥ 12** | ≈ 197 | ✅ |
| **P2 famille Série 3** | **416** (316 = 65, 318 = 116, 320 = 204, 330 = 31) | ≈ 437 | ✅ |
| **P1** (coupé + prix ≤ 20 000 € + km ≤ 100 000) | **479 coupés** avant filtres → **31 offres** après, sur 16 marques et 13 années | ≈ 500 avant, **230–280 après** | ❌ **DR3-14** |

### 6.3 Cohérence d'échelle `dev` ↔ `test` — **conforme à ±3 points**

15 proportions structurantes mesurées sur les deux profils, **écart maximal 1,33 point** (Flandre
55,64 vs 54,31) :

| | essence | diesel | hybrides | électrique | PRO | tier | prix affiché | sur demande | accidentés | boîte auto | SUV | coupés | Flandre | `paintType` absent | WLTP |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `dev` | 54,04 | 27,52 | 13,50 | 4,18 | 68,48 | 17,54 | 96,40 | 3,04 | 3,64 | 44,39 | 27,84 | 2,24 | 55,64 | 82,38 | 53,06 |
| `test` | 54,32 | 27,05 | 13,20 | 4,37 | 68,67 | 17,96 | 96,40 | 3,04 | 3,70 | 44,37 | 27,28 | 2,41 | 54,31 | 82,75 | 52,69 |

Médiane de prix **16 000 € dans les deux profils**, médiane d'âge **7 ans dans les deux**. Le profil
`dev` est un échantillon fidèle du profil `test` : il est utilisable comme profil rapide.

---

## 7. Constats consolidés

**Sévérités** : **BLOQUANT** = donnée fausse affichable, violation R3, schéma incohérent avec le
dictionnaire · **MAJEUR** = distribution hors tolérance, anomalie non retrouvable, perte
d'information · **MINEUR** = forme, verbosité, documentation.
**Destinataires** : `data-fix` (outillage, spécification, schéma) · `fixture-provider`
(adaptateur, provider) · `mvp-integrate` (intégration).

### 7.1 BLOQUANTS

**Aucun.**

### 7.2 MAJEURS (13)

| # | Constat | Exigence visée | Preuve (sonde rouge) | Cause probable | Correction attendue | Pour |
|---|---|---|---|---|---|---|
| **DR3-02** | Le kilométrage injecté par `A-04` forme (a) est plafonné à **1 900 000 km** ; au-delà de ~114 mois d'âge le rythme de 260 000–360 000 km/an ne franchit **pas** la borne de 200 000 km/an. **37/50** la franchissent, contre les **100 %** annoncés par EG-09 et par `anomalies.json:aRetrouver`. Conséquence en aval (**C-P3-9 confirmé**) : **13/60** déclarations n'ont **aucune** conséquence canonique. | `A-04`, contrainte 22, EG-09 | `R-DATA-04` (`p13-age-mileage.test.ts`), `C-P3-9` (`cross-findings.test.ts`) | générateur : vivier d'`A-04(a)` non borné en âge | Restreindre le vivier d'`A-04(a)` aux annonces **assez jeunes** pour que le rythme franchisse la borne sous le plafond de 1,9 M km, **ou** amender `aRetrouver` et EG-09 pour dire quelle part est détectable. La sonde doit passer **sans être modifiée**. | `data-fix` |
| **DR3-03** | `P-25` : la part de boîtes automatiques présente **3 inversions** sur 2010..2026 pour une tolérance d'**1**. Les inversions sont infimes (0,1 à 2 points) sur des effectifs annuels de 294 à 2 243 : c'est du bruit d'échantillonnage, pas un défaut de loi. Non détecté par `data:check`, qui ne contrôle que les deux extrémités. | `R-07`, `P-25` | `R-DATA-07` (`p16-fuel-body.test.ts`) | spécification : une tolérance de « 1 inversion » sur une série de 17 points n'est pas atteignable | Amender la tolérance de `P-25` (par exemple : aucune inversion supérieure à 2 points, ou test de tendance) avec justification écrite — même traitement que EG-11 / D3-20. | `data-fix` |
| **DR3-04** | `P-45` : κ mesuré **0,0119** pour une tolérance [0,25 ; 0,60]. La sonde est **arithmétiquement inatteignable** : avec P(catégorie ∈ {1,2}) = **52,55 %** et P(`M1_LOW`) = **2,24 %**, le κ maximal possible vaut **0,0405**. La correction C-1 de `R-24` a bien rendu la catégorie corrélée au juste prix, mais elle est comparée à un verdict **24 fois plus rare**. Sonde **non exécutée** par `data:check`. | `R-24`, `EX-DATA-96`, E-08 | `R-DATA-08` (`p31-price.test.ts`) | spécification : incompatibilité de taux de base | Soit comparer la catégorie à un verdict de **taux de base comparable** (par exemple « prix sous le premier quartile de la cellule »), soit remplacer κ par une mesure adaptée (précision/rappel de `M1_LOW` parmi les catégories 1-2, déjà calculée par `M3Control`), soit ratifier la dette. Même classe que EG-11. | `data-fix` |
| **DR3-05** | `P-55` : **3 champs conditionnels** hors des ±25 % relatifs — `isPluginHybrid` **4,59 %** contre 15 % (−69,4 %), `consumption.electricCombined` **24,14 %** contre 15 % (+60,9 %), `wltp.consumptionElectricCombined` **10,42 %** contre 15 % (−30,5 %). Invisible pour `data:check`, dont `presenceRates` ne suit que **30 champs inconditionnels** sur les 82 de `baseRates`. | `R-43`, `P-55` | `R-DATA-11` (`p55-missingness.test.ts`) | générateur : le facteur de calibrage par champ (EG-11 b) n'est appliqué qu'aux champs inconditionnels | Étendre le calibrage aux champs à population conditionnelle, **ou** amender les trois taux de `missingness.json` en le disant. Compléter au passage `conditionalAbsence` (DR3-18). | `data-fix` |
| **DR3-06** | `P-68` : seules **10,24 %** des survivantes voient leur **prix affiché** changer, pour une tolérance de [14 %, 20 %]. Le manifest déclare 3 055 révisions (17,1 %) : **~40 % des révisions repassent par l'arrondi commercial et retombent sur le même prix**. La part à la baisse (86,8 %) est, elle, conforme. `data:check` publie cette sonde **sans aucune tolérance** (`add('P-68', …, true)`) et compte « prix **ou images** ». | `R-53`, `P-68` | `R-DATA-14` (`p65-snapshots.test.ts`) | générateur : la révision est comptée **avant** l'arrondi | Tirer à nouveau tant que le prix arrondi n'a pas changé, **ou** publier au manifest le nombre de révisions **effectives** et amender `P-68`. Rendre au passage `P-68` opposable dans `data:check`. | `data-fix` |
| **DR3-07** | `P-69` : la médiane des prix **monte** de 16 000 € à **16 900 €** (**+5,62 %**) de S0 à S2, alors que la sonde exige une **baisse** d'au plus 3 %. Sur les seules **survivantes** la médiane baisse bien (**−0,29 %**) : la hausse vient du **renouvellement du stock** — les entrantes sont plus récentes (`ageTilt exp(−0,02·âge)`) donc plus chères. Les deux mécanismes de `R-52` et `R-53` se contredisent, et l'effet agrégé annoncé (« −0,5 %/semaine ») est faux de signe. Sonde **non exécutée** par `data:check`. | `R-53`, `R-52`, `P-69` | `R-DATA-15` (`p65-snapshots.test.ts`) | spécification : l'effet du renouvellement n'a pas été soustrait de l'effet des révisions | Soit retirer l'inclinaison d'âge des entrantes (ou la compenser), soit énoncer `P-69` **sur les survivantes** — la seule population où « la médiane recule » a un sens. Le delta inter-snapshots est un écran du produit : il montrera une hausse. | `data-fix` |
| **DR3-08** | `P-75` : rappel de M1 **36 %** (18/50) contre ≥ 90 %. **32/50** des `OUTLIER_M1_LOW` injectés tombent sous `0,10 × médianeRéf(C)`, portent `PRICE_IMPLAUSIBLE_IN_CELL` (`EX-DATA-19(2)`), sortent de `V_price(C)` et ne sont **jamais évalués**. Le garde-fou de `DATASET-SPEC` §6 (« `M1_LOW` ne descend jamais sous 250 € ») est **inopérant** : le seuil qui compte est **relatif à la cellule** (1 595 € pour une médiane de 15 950 €). Sonde **non exécutée** par `data:check`. | `A-10`, `EX-DATA-88`, `P-75` | `R-DATA-16` (`p72-anomalies.test.ts`) | spécification : plancher absolu là où l'exigence pose un plancher relatif | Injecter `M1_LOW` **au-dessus** de `0,10 × médiane de cellule` (par exemple facteur 0,12–0,25 de la médiane) pour que la vérité terrain soit détectable, **ou** amender `P-75` pour mesurer le rappel sur la population que l'exigence laisse évaluable, en le disant. | `data-fix` |
| **DR3-09** | `P-76` : rappel de M2 **51,4 %** (36/70) contre ≥ 85 %. **25** injectés sont **évalués et non signalés**, avec des écarts au modèle allant jusqu'à **108,8 %**. Cause : les facteurs d'`A-11` (0,30–0,50 / 2,0–3,2) sont calibrés sur `σ_p = 0,20`, alors que M2 régresse `ln(prix) ~ année + km` **dans la cellule `(marque, modèle)`**, où subsistent les variances de carburant, de puissance et de type de vendeur — la dispersion robuste réellement mesurée est bien supérieure à 0,20. Sonde **non exécutée** par `data:check`. | `A-11`, `EX-DATA-90/92`, `P-76` | `R-DATA-17` (`p72-anomalies.test.ts`) | spécification : σ de calibrage ≠ σ mesuré par le détecteur | Calibrer les facteurs d'`A-11` sur l'**écart robuste effectivement mesuré dans la cellule** (mesurable à la génération), ou élargir la plage de facteurs, ou amender `P-76`. | `data-fix` |
| **DR3-10** | `P-72` : le générateur applique **tous** les taux d'anomalie à l'effectif **total** du snapshot (`Math.round(rate × total)`), alors qu'`anomalies.json` déclare une **base** par anomalie. Cinq groupes sont hors des ±20 % relatifs **sur leur base déclarée** : `A-07`, `A-07b`, `A-08` (base « annonces professionnelles ») **+46 %**, `A-16` (base « annonces hybrides ») **+658 %**, `A-20` (base « annonces à prix sur demande ») **+3 189 %**. Concrètement : **1,3 %** des annonces à prix sur demande portent un montant, là où la spécification en annonce **0,04 %**. `data:check` ne peut pas le voir : il prend lui aussi `N` pour base. | `R-57`, `P-72` | `R-DATA-19` (`p72-anomalies.test.ts`) | générateur : le champ `base` d'`anomalies.json` est ignoré | Appliquer le taux à la base déclarée, **ou** remplacer le champ `base` par « toutes » partout où c'est le comportement voulu — le champ ne doit pas annoncer une chose et le fichier en produire une autre. | `data-fix` |
| **DR3-11** | `P-73` : **61 valeurs injectées** déclarées au manifest ne se retrouvent **pas** dans la ligne, dont **49** `VERSION_AMBIGUOUS` / `VERSION_FULLY_STRIPPED` dont `modelVersion` a été retiré par le modèle de complétude **après** l'injection (**C-P3-12 confirmé, 49 et non 4**), et des `MILEAGE_IMPLAUSIBLE_FOR_AGE` dont la valeur a été réécrite ensuite. `DATASET-SPEC` §6 exige que toute anomalie déclarée soit falsifiable. | `R-57`, §6, `P-73` | `R-DATA-20` (`p72-anomalies.test.ts`), `C-P3-12` | générateur : ordre des opérations (injection puis complétude) | Exclure du vivier de complétude les champs porteurs d'une anomalie déclarée, **ou** retirer la déclaration quand le champ disparaît. Une anomalie sans valeur observable n'est pas une vérité terrain. | `data-fix` |
| **DR3-13** | L'adaptateur accepte **en silence** `prices.public.isTaxDeductible = true` sur un vendeur `PRIVATE` et écrit `vatDeductible = 2` (« oui »). La contrainte 7 de `DATA-MODEL` §7 réserve le champ aux professionnels. Les fixtures sont propres (`P-42` verte, 0 occurrence), donc **aucune valeur fausse n'est affichée aujourd'hui** — le risque est pour une source réelle, et la colonne « TVA » d'`EX-SCR-203` afficherait une TVA déductible chez un particulier. | contrainte 7, D8-08 | `S-08` (`structure-schema-adapter.test.ts`) | adaptateur : aucune garde sur le couple (type de vendeur, TVA) | Poser un signalement (ou forcer l'inconnu) quand `isTaxDeductible` est servi sur un `PRIVATE`. Aucun cas limite ne doit passer en silence. | `fixture-provider` |
| **DR3-14** | Parcours **P1** : au profil `test`, `body=3` + `priceto=20000` + `kmto=100000` ne rend que **31 offres**, là où `DATASET-SPEC` §1.4 en annonce **230 à 280**. Les 479 coupés avant filtres sont, eux, conformes (≈ 500 annoncés). Cause : le coupé relève des segments `sportive` (prix neuf 55 000 €) et `luxe` (95 000 €), et les filtres de prix et de kilométrage y coupent bien plus que ne le supposait le §1.4. Effet produit : le parcours cible reste **exerçable** mais quasi vide, et l'effectif frôle le `\|F\| ≥ 30` d'`EX-DATA-90`. | §1.4, E-06, D3-17(b) | `R-DATA-28` (`product-fitness.test.ts`) | spécification : les attendus du §1.4 ont été posés avant le modèle de prix par segment | Recalculer et publier les attendus P1 (D3-17 b le prévoit), **ou** ajuster la composition (part de coupés à prix modéré). `mvp-integrate` doit de toute façon recalculer `P1_EXPECTED` sur le profil `test`. | `data-fix` puis `mvp-integrate` |
| **DR3-15** | `DUPLICATE_VALUE_CONFLICT` désigne, dans le générateur, une **republication intra-vendeur** : **150/150** paires ont des **identifiants différents** et le **même** `dealerBucket`. `ARB-54` réserve ce code à une divergence entre **deux occurrences du même identifiant**. Un nom, deux notions disjointes — l'audit de doublons de l'application comptera l'une pour l'autre. (**C-P3-10 confirmé**.) | `ARB-54`, `A-07b` | `C-P3-10` (`cross-findings.test.ts`, verte : elle **établit** le fait) | spécification : réemploi d'un code du vocabulaire du manifest | Créer un code distinct (par exemple `SELLER_REPUBLICATION`) ou renommer `A-07b`, et aligner `snapshot-manifest.schema.json`. | `data-fix` |

### 7.3 MINEURS (6)

| # | Constat | Preuve | Correction attendue | Pour |
|---|---|---|---|---|
| **DR3-01** | `profiles.json:snapshotIdPattern` annonce `be-fixture-<profil>-<AAAAMMJJ>-<graine hex 8>` ; les **six** snapshots livrés portent `be-YYYYMMDDTHHmmssZ`, la seule forme que `snapshot-manifest.schema.json` accepte (`maxLength 32`, motif fermé). Deux documents de la même spécification se contredisent, et `P-02` ne peut pas être verte. (**C-P3-3 confirmé** ; le nom du répertoire **est** l'identifiant, vérifié.) | `R-DATA-01`, `C-P3-3` | Corriger `snapshotIdPattern` dans `profiles.json` (documentation), la forme livrée étant le contrat validé. | `data-fix` |
| **DR3-12** | `emissions.json:branchRule.WLTP.interdits` nomme `co2EmissionsUnit` ; `dependentSchemas.wltp` ne l'interdit **pas**. Le fichier livré est propre (**0 occurrence**) : c'est la **discipline du générateur**, pas une garde du schéma. `combinedUnit` et `electricCombinedUnit` ne sont pas en cause (le bloc `wltp` n'a pas d'unité propre : 27 588 lignes les portent légitimement). | `R-DATA-24` | Ajouter `co2EmissionsUnit: false` à `dependentSchemas.wltp`. | `data-fix` |
| **DR3-16** | `POWER_OUT_OF_RANGE` (`A-13`) est **inatteignable depuis une ligne conforme au schéma** : `power` est borné à `[1, 9999]` **bornes incluses**, et les 30 valeurs injectées valent 1 ou 9 999 — **0 hors domaine**. Même classe que `FIRST_REG_UNPARSEABLE` et `MARKETPLACE_UNMAPPED`, que D3-16 et `P-101` excluent du manifest. L'anomalie ne peut être qu'un signal de **vraisemblance**, jamais un rejet. (**C-P3-7 confirmé**.) | `C-P3-7` | Requalifier `A-13` (signal de vraisemblance) ou resserrer le domaine du schéma. Ne pas annoncer une détection que la ligne ne peut pas produire (contrainte 23). | `data-fix` |
| **DR3-17** | Trois écarts de documentation qui empêchent un tiers de vérifier la spécification sans lire le code du générateur : (a) `missingness.json:conditionalAbsence` **omet** les unités (`mileageUnit`, `powerUnit`, `cylinderCapacityUnit`…, servies avec leur valeur), le couplage `isTaxDeductible` × prix affiché, `warrantyUnit` × type de vendeur, et restreint à tort les champs électriques à `{E, 2, 3}` là où le générateur retient `E` **ou** rechargeable ; (b) le **vocabulaire de finition par langue** (`TRIM_WORDS`) n'existe que dans `tools/dataset/listing.mjs` et ne figure **pas** parmi les hypothèses `HG-01`…`HG-04` — `P-54` n'est vérifiable qu'en reconstruisant un classifieur (HR-03) ; (c) `manifest.delta.enteredCount` compte des **lignes** (2 094) là où le nombre d'identifiants distincts entrés vaut **2 091** — l'écart est exactement le nombre de doublons `A-07`, mais rien ne le dit. | tables `ELIGIBILITY` de `p55-missingness.test.ts`, `P-54`, `P-67` | Compléter `conditionalAbsence`, publier le vocabulaire de finition en table ou en hypothèse `HG-05`, préciser l'unité de compte de `delta`. | `data-fix` |
| **DR3-18** | `REGION_UNRESOLVED` recouvre **deux situations que `DATA-MODEL` §3.1 sépare** : **235** par préfixe `00`–`09` (drapeau attendu) et **30** par `countryCode ≠ BE` (`EX-DATA-55` : région inconnue **sans** drapeau) ; 5 de plus ont simplement perdu leur préfixe. Le manifest ne permet pas de les distinguer sans relire la ligne. (**C-P3-13 confirmé**.) De même, `PRICE_ON_REQUEST_WITH_AMOUNT` déclare `expected.status = ON_REQUEST` pour **24 annonces** alors qu'`EX-DATA-32` impose `QUOTED` + drapeau (**C-P3-8 confirmé**). | `C-P3-13`, `C-P3-8` | Distinguer les deux situations par un `detail` normé ou deux codes ; corriger `expected.status` d'`A-20` pour suivre le dictionnaire, qui est normatif. | `data-fix` |
| **DR3-19** | EG-12 nomme **trois** sondes dans le bruit d'échantillonnage du volume `dev` (`P-23`, `P-55`, `P-58`). J'en mesure **cinq** : `P-18` (diesel 2024 4,65 % contre ≤ 4,5 %), `P-37` (prime électrique 0,93) et `P-38` (prime professionnelle 0,99) le sont aussi, et sont vertes au profil `test`. `probes.json` ne porte aucune **portée par profil** pour ces tolérances. | 5 sondes `it.fails` annotées | Étendre la liste d'EG-12, ou donner à ces sondes une `portee` « snapshot test » dans `probes.json`. | `data-fix` |

### 7.4 Contrôles de `data:check` à renforcer (conséquence transverse)

Trois sondes du générateur ne prouvent pas ce que leur nom annonce (§2.2) : `P-68` **passe toujours**,
`P-55` ne couvre que **30 des 82** champs, `P-72` prend `N` pour base de **toutes** les anomalies.
Corriger DR3-05, DR3-06 et DR3-10 sans corriger `data:check` laisserait ces trois trous ouverts pour
la prochaine régénération. **Pour `data-fix`.**

---

## 8. Dettes ratifiées — vérifiées

| Dette | Décision | Ce que je mesure | Verdict |
|---|---|---|---|
| **EG-01 / D3-19** — `P-10` et `P-11` incompatibles avec `R-05` | Ratifiée : la composition segment × année prime sur les effectifs par modèle | golf **590** (< 650), polo **383** (< 480), corsa **357** (< 440), 320 **204** (≥ 170) ; famille Série 3 **416** (≥ 280), Série 1 **261** (< 280). Les densités restent **exploitables** : Golf 13 années à n ≥ 12, Corsa 11, 320 8 ; `P-23` **38,36 %** ✅ et `P-24` **2,41 %** ✅ sont bien satisfaites par θ = 1. | **dette ratifiée, conforme** — sondes en `it.fails` annoté, jamais `skip` |
| **EG-11 / D3-20** — `P-57` inatteignable | Ratifiée : le maximum atteignable vaut 0,065 avec `Beta(6,2)`, `p₁ = 0,035`, `p₂ = 0,28` | corrélation mesurée **0,0763** — au-dessus de la borne théorique de EG-11 (0,065) et bien en deçà du plancher de 0,10. Le calcul d'EG-11 est **confirmé** dans son ordre de grandeur. | **dette ratifiée, conforme** |
| **EG-08 / D3-20** — évaluation sur le juste prix **hors résidu**, `aggregatedRate` retenu | Ratifiée | distribution obtenue : catégorie 1 **15,8 %**, 2 **24,2 %**, 3 **36,1 %**, absente **24,0 %** (recalculée : 1 = 3 150, 2 = 4 836, 3 = 7 215, absente = 4 799 sur 20 000) ; `superDeal` **3,91 %** ∈ [2,5 %, 5,5 %] ✅ | **appliquée** — mais voir **DR3-04** : l'agrégat est conforme, c'est la sonde κ qui ne l'est pas |
| **EG-09 / D3-20** — rythme d'`A-04(a)` porté à 260 000–360 000 km/an | Ratifiée | **37/50** formes (a) franchissent la borne, **pas 100 %** | **appliquée mais incomplète → DR3-02** |
| **D3-16** — trois drapeaux inatteignables | `FIRST_REG_UNPARSEABLE` et `MARKETPLACE_UNMAPPED` hors manifest | `P-101` : **0 occurrence** ✅ | **conforme** — un **quatrième** drapeau relève de la même classe : `POWER_OUT_OF_RANGE` (**DR3-16**) |
| **D3-08 / D8-32** — `measurementSource` absente de l'interface v1 | Statu quo déclaré | la couche source porte bien les trois branches (`P-61`, `P-96`, `P-99` vertes) ; l'adaptateur calcule `co2Source` / `consumptionSource` sans les transporter | **conforme** |
| **D3-10** — `BOOLEAN_FLAG_BIT` | Table bit ↔ champ remplie à l'ingestion | 6 tri-états sur 10 distinguent inconnu/faux ; les 4 autres ont un défaut documenté | **conforme** |
| **D3-15** — arbitrage des doublons indépendant de l'ordre | Ratifiée | 20 doublons d'identifiant → 19 980 lignes servies, **0** doublon subsistant | **conforme** |
| **D3-12** — garde R3 étendue à `data/` | À ma charge | 33 fichiers balayés, `invalid-*.json` exclus par nom, vocabulaire d'instance seul → **0 clé interdite** | **fait, conforme** |
| **EG-10** — `P-12` exclut les lignes `FIRST_REG_OUT_OF_RANGE` | Demandé par `dataset-gen` | **42** violations sans exclusion, **0** après ; l'exclusion ne recouvre **que** des lignes déclarées | **confirmé et appliqué** (HR-07) |

### 8.1 Verdict sur les sept constats de `fixture-provider` (D3-22)

| Réf. | Verdict du reviewer | Ma mesure indépendante | Devient |
|---|---|---|---|
| **C-P3-3** | **CONFIRMÉ** | 6 snapshots au motif du schéma ; `profiles.json` annonce l'autre forme | **DR3-01** (MINEUR, `data-fix`) |
| **C-P3-7** | **CONFIRMÉ** | domaine `[1, 9999]` bornes incluses, 30 valeurs injectées toutes **dans** le domaine | **DR3-16** (MINEUR, `data-fix`) |
| **C-P3-8** | **CONFIRMÉ** | **24** déclarations `A-20` attendent `ON_REQUEST` alors qu'un montant est écrit ; `EX-DATA-32` impose `QUOTED` + drapeau | **DR3-18** (MINEUR, `data-fix`) |
| **C-P3-9** | **CONFIRMÉ, aggravé** | **60** déclarations : **7** en « notice » (qu'aucune colonne ne transporte), **40** absorbées par `MILEAGE_OUT_OF_RANGE`, **13 sans aucune conséquence canonique** (le lot annonçait 4/9/2 sur un autre snapshot) | **DR3-02** (MAJEUR, `data-fix`) |
| **C-P3-10** | **CONFIRMÉ** | **150/150** paires à identifiants différents et même `dealerBucket` | **DR3-15** (MAJEUR, `data-fix`) |
| **C-P3-12** | **CONFIRMÉ, aggravé** | **49** déclarations `VERSION_*` sans `modelVersion` (et **61** valeurs injectées introuvables toutes anomalies confondues), là où le lot en comptait 4 | **DR3-11** (MAJEUR, `data-fix`) |
| **C-P3-13** | **CONFIRMÉ** | **235** par préfixe, **30** par pays, 5 à préfixe absent | **DR3-18** (MINEUR, `data-fix`) |

Les constats `C-P3-11` (liste d'arrêt `EX-DATA-30` chargée par aucun chargeur), `C-P3-14` (ouverture
du profil `test` à 1 861 ms sur 2 000) et `C-P3-15` (recalcul Σ p95 194 ms) sont **hors du périmètre
de cette revue** — ils portent sur les chargeurs de référentiels et sur la performance, non sur la
donnée. Je note seulement, à l'appui de `C-P3-11`, que `P-107` est verte **par construction du
générateur** et non parce que la liste d'arrêt fonctionne : la deuxième barrière R3 reste inerte, et
c'est bien à `mvp-integrate` de la brancher.

---

## 9. Verdict — critères 3.3 et porte G9b

### 9.1 Critère S1 de la phase 3.3

> « Revue rendue avec sondes exécutables, zéro BLOQUANT non consigné. »

| Élément du critère | Verdict | Preuve |
|---|---|---|
| Revue rendue | **ATTEINT** | ce rapport |
| Sondes **exécutables** | **ATTEINT** | `npm run test:data`, **152 sondes**, 14 fichiers, couverture des **110 sondes du contrat** prouvée par une sonde dédiée |
| Zéro **BLOQUANT** | **ATTEINT** | aucun constat de sévérité BLOQUANT ; R3 tenue, schéma cohérent, 60 000 lignes conformes, déterminisme prouvé |
| Constats tracés | **ATTEINT** | 16 constats `DR3-nn`, chacun avec sa sonde, sa cause probable, sa correction et son destinataire |

Les critères **S2** (suite de contrat), **S3** (bascule de provider) et **S4** (budgets) relèvent de
`fixture-provider` : ils sont hors de mon périmètre et je ne les juge pas.

### 9.2 Porte G9b — « revue des données verte ou dettes écrites »

**FRANCHISSABLE**, aux conditions suivantes :

1. **Aucun BLOQUANT** n'est ouvert : la condition dure de la porte est **satisfaite**.
2. Les **13 MAJEURS** doivent, avant le franchissement, être soit **corrigés** par `data-fix` (3.4)
   avec la sonde rouge rendue verte **sans modification**, soit **consignés en dette motivée
   `D3-nn`** par le coordinateur. Quatre d'entre eux (DR3-03, DR3-04, DR3-07, DR3-14) sont des
   **défauts de la spécification**, pas de la donnée : ils se traitent comme EG-11 / D3-20 — la spec
   est amendée avec justification, et la sonde suit.
3. Les **6 MINEURS** peuvent être portés en dette documentaire sans bloquer.
4. **DR3-13** est le seul constat adressé à `fixture-provider` ; il ne dépend pas d'une
   régénération et peut être corrigé immédiatement.

### 9.3 Corrections requises, par sévérité et par destinataire

**`data-fix` — MAJEURS (12)**
`DR3-02` vivier d'`A-04(a)` · `DR3-03` tolérance de `P-25` · `DR3-04` κ de `P-45` ·
`DR3-05` calibrage des champs conditionnels · `DR3-06` révisions effectives · `DR3-07` dérive de la
médiane · `DR3-08` plancher relatif de `M1_LOW` · `DR3-09` calibrage de `M2` · `DR3-10` base des taux
d'anomalie · `DR3-11` anomalies retrouvables · `DR3-14` matière du parcours P1 · `DR3-15` code
`DUPLICATE_VALUE_CONFLICT`.
**À traiter avec** : renforcer `data:check` sur `P-55`, `P-68` et `P-72` (§7.4), faute de quoi les
mêmes trous se rouvriront à la prochaine régénération.

**`data-fix` — MINEURS (6)**
`DR3-01` `snapshotIdPattern` · `DR3-12` `dependentSchemas.wltp` · `DR3-16` `POWER_OUT_OF_RANGE` ·
`DR3-17` documentation (`conditionalAbsence`, vocabulaire de finition, unité de `delta`) ·
`DR3-18` vocabulaire d'anomalie (`REGION_UNRESOLVED`, `A-20`) · `DR3-19` portée par profil.

**`fixture-provider` — MAJEUR (1)**
`DR3-13` TVA déductible acceptée en silence sur un vendeur `PRIVATE`.

**`mvp-integrate`**
Recalcul de `P1_EXPECTED` et `P2_EXPECTED` sur le profil `test` (D3-17 b), **après** l'arbitrage de
`DR3-14` : les valeurs attendues du parcours P1 ne sont pas celles du §1.4.

### 9.4 Ce que la suite `tests/data/` devient

Les **136 sondes vertes** (137 sur `dev`) sont la **suite de non-régression des données** : `npm run test:data`
tourne sur `dev` en **14,7 s** et sur `test` en **44,5 s**. Les **16 rouges** portent chacune
l'identifiant de son constat dans son titre et doivent être rendues vertes **sans être modifiées**
(D-31 / D-32) ; les **3 dettes ratifiées** restent en `it.fails` annoté, jamais en `skip`.


---

## 10. Re-revue delta (rev 2, 2026-09-13) — verdict G9b

> Agent `data-review`, **rev 2**, relancé par message (D3-30). Arbre principal `/home/user/KYCAR`,
> branche `claude/kycar-project-ffcplk` @ `0d5e39f`. **Lecture seule partout sauf cette section** :
> aucune sonde, aucun fichier de `src/`, `tools/`, `data/` ou `tests/` n'a été modifié par moi.
>
> Delta jugé : `data-fix` (`423cc91`, `1578c1c`, `d3a3d74` — rapport `reports/data/data-fix.md`,
> décisions D3-25…D3-30), `mvp-integrate` (`reports/remediation-2.8/mvp-integrate.md`, constat
> `C-3.5-03`), `fixture-perf` (`766f5e7`…, D3-31/D3-34, artefact `baseline.json`).
>
> **Vérifié d'abord** : `git log --stat 766f5e7 -- data/fixtures` n'ajoute que **six**
> `baseline.json` (36 408 lignes insérées, 0 supprimée) ; **aucun `listings.ndjson.gz` ni aucun
> `manifest.json` n'a été touché par le lot `fixture-perf`**. La dernière régénération des données
> est bien `d3a3d74` (`data-fix`).
>
> Tous les chiffres du §10 sont produits par **mes propres scripts**, écrits dans le bac à sable de
> session et jamais dans le dépôt : un chargeur NDJSON autonome, et une **réimplémentation
> indépendante de M1 et M2** écrite depuis la spécification (`EX-DATA-88`, `EX-DATA-90/92`,
> `EX-DATA-19(2)`) — ni `tools/dataset/check.mjs`, ni `tools/dataset/cells.mjs`, ni `tests/data/harness.ts`.

### 10.1 Portes rejouées

| Porte | Commande | Sortie |
|---|---|---|
| Sondes de données, `dev` | `npm run test:data` | **152 / 152**, 14 fichiers, 28,4 s, sortie 0 |
| Sondes de données, `test` | `KYCAR_DATA_PROFILE=test npm run test:data` | **152 / 152**, 14 fichiers, 48,8 s, sortie 0 |
| Contrat des providers | `npm run test:contract` | **93 / 93**, 3 fichiers (dont `baseline-artifact` 10 et `ground-truth`), sortie 0 |
| Schéma + artefacts, `dev` | `npm run data:validate -- --profile dev` | `RESULTAT : profil conforme` — 3 × 5 000 lignes, 3 baselines liées au `sha256` du manifest, 135 marques, Σ effectifs = `selectionCount` 4 997 |
| Schéma + artefacts, `test` | `npm run data:validate -- --profile test` | `RESULTAT : profil conforme` — 3 × 20 000 lignes, 262 marques, `selectionCount` 19 986 |
| Contrôles du générateur, `dev` | `npm run data:check -- --profile dev` | **74 sondes rejouées, 0 écart, 4 dettes** (P-23 EG-12, P-55 EG-12, P-57 EG-11, P-58 EG-12) |
| Contrôles du générateur, `test` | `npm run data:check -- --profile test` | **74 sondes rejouées, 0 écart, 3 dettes** (P-10 EG-01, P-11 EG-01, P-57 EG-11) |
| Artefact précalculé | `npm run data:baseline -- --check` | `RESULTAT : artefacts conformes` |

**Aucune sortie non verte.** Les 16 sondes rouges de la rev 1 sont vertes, les 3 dettes ratifiées
restent en `it.fails` annoté, et deux sondes de plus (`P-45`, `P-55`) rejoignent ce dispositif au
seul profil `dev` (EG-12 étendue, DR3-19).

### 10.2 Les onze sondes touchées, jugées une à une

Verdicts : **LÉGITIME** · **LÉGITIME AVEC RÉSERVE** (principe juste, borne trop lâche ou trop ad hoc)
· **ILLÉGITIME**. Règle D-31/D-32 appliquée : le doute profite à la sonde d'origine.

| # | Sonde | Fichier:ligne | Modification | Verdict | Motif et **recalcul indépendant** |
|---|---|---|---|---|---|
| 1 | `R-DATA-07` (`P-25`) | `tests/data/p16-fuel-body.test.ts:173` | ne compte plus que les inversions **significatives** (> 2 erreurs-types de la différence de deux proportions), toujours ≤ 1 ; extrémités 2010 ≤ 30 % et 2024 ≥ 60 % **inchangées** | **LÉGITIME** | J'ai recalculé la série de la part de boîtes A/S par année sur le NDJSON : **2010 16,67 % (n = 294) · 2024 69,55 % (n = 693) · 3 inversions brutes, 0 significative** — exactement les trois couples publiés par `data-fix` avec les mêmes écarts-types (2012→2013 −0,04 pt / 0,02 e.t. · 2015→2016 −2,08 pt / 0,96 e.t. · 2018→2019 −1,50 pt / 0,89 e.t.). L'espérance d'inversions que je mesure sur les **seize** couples vaut **3,24** (`data-fix` annonce 1,93 : son total sur les neuf couples non détaillés est sous-estimé — l'écart va **dans le sens de la démonstration**). Une tolérance d'« au plus une inversion » sur une série de 17 proportions binomiales est inatteignable sur une donnée conforme. |
| 2 | `R-DATA-08` (`P-45`) — tolérance | `tests/data/p31-price.test.ts:327` | la tolérance `[0,25 ; 0,60]` porte désormais sur le **κ normalisé** `κ / κ_max`, **mêmes bornes numériques** | **LÉGITIME AVEC RÉSERVE** | Recalculé de bout en bout avec **mon** détecteur M1 : `κ = 0,0136` sur `n = 10 165`, `p_a = 52,59 %`, `p_b = 2,22 %`, `p_e = 0,4757`, **`κ_max = 0,0402`**, `κ/κ_max = 0,3373` — **identique au chiffre publié**, à la quatrième décimale. La borne basse de 0,25 est six fois au-dessus du maximum arithmétique : inatteignabilité **confirmée**. **Réserve** : seule la borne **basse** a été re-justifiée. La borne **haute de 0,60**, choisie jadis pour un κ brut, devient sur l'échelle normalisée un plafond que le jeu frôlerait si la corrélation s'améliorait (mesure 0,3373, marge 0,26) — un générateur **meilleur** ferait rougir la sonde. J'aurais retenu `κ/κ_max ≥ 0,25` opposable et le haut **publié sans assertion**, ou relevé à 0,90. |
| 3 | `R-DATA-08` (`P-45`) — portée | même ligne | passe sous `devSamplingNoise` (`IS_TEST_PROFILE ? it : it.fails`) | **LÉGITIME** | Mesuré au profil `dev` par mon détecteur : `p_b = 0,68 %` sur `n = 2 363`, `κ = −0,0001`, `κ_max = 0,0133`, `κ/κ_max = −0,0081`. À une quinzaine de `M1_LOW`, l'erreur-type du κ dépasse sa valeur : la sonde y mesure du bruit. |
| 4 | `R-DATA-01` (`P-02`) | `tests/data/p01-volume-composition.test.ts:86` | le motif n'est plus **recopié en dur** dans la sonde : il est **lu** dans `profiles.json:snapshotIdPatternRegex` | **LÉGITIME AVEC RÉSERVE** | Vérifié : `profiles.json` publie `snapshotIdPatternRegex = ^[a-z]{2}-\d{8}T\d{6}Z$`, **caractère pour caractère le `pattern` de `data/schema/snapshot-manifest.schema.json:23`**, et les six identifiants livrés le satisfont. La correction est celle que DR3-01 demandait. **Réserve** : une sonde qui lit son attendu dans la table qu'elle contrôle ne peut plus échouer si la table est relâchée. Le point fixe manque : j'aurais ajouté `expect(profilesTable.snapshotIdPatternRegex).toBe(schemaManifest.properties.snapshotId.pattern)` — c'est le schéma, pas `profiles.json`, qui est le contrat validé. |
| 5 | `C-P3-3` | `tests/data/cross-findings.test.ts:23-45` | `expect(declaredPattern).toContain('be-fixture-')` → `not.toContain('be-fixture-')` **et** `designSnapshotIdPattern` le contient | **LÉGITIME** | L'assertion d'origine **ratifiait** le défaut : elle devenait rouge dès sa correction. Vérifié dans le fichier : `snapshotIdPattern = be-<AAAAMMJJ>T<hhmmss>Z`, `designSnapshotIdPattern = be-fixture-<profil>-<AAAAMMJJ>-<graine hex 8>` — l'identifiant de conception survit là où il a un sens (`generation.json`). |
| 6 | `S-05` | `tests/data/structure-schema-adapter.test.ts:146` | la liste attendue de `dependentSchemas.wltp` gagne `co2EmissionsUnit` | **LÉGITIME** | Les deux sondes du **même fichier** étaient mutuellement exclusives : `S-05` figeait l'état livré, `R-DATA-24` (**non modifiée**) exigeait l'ajout. Vérifié : la liste vaut désormais `co2Emissions, co2EmissionsUnit, consumption, efficiencyClass` et `R-DATA-24` mesure **0 ligne livrée** portant `co2EmissionsUnit` en branche WLTP. La garde est passée de la discipline du générateur au schéma. |
| 7 | `C-P3-8` | `tests/data/cross-findings.test.ts:78-105` | `expect(onRequestExpected).toBe(rows.length)` → `.toBe(0)` | **LÉGITIME** | Même classe : l'assertion figeait le défaut. Recompté sur le manifest : **8 déclarations `A-20` au profil test, toutes à `expected.status = QUOTED`**, `expected.flag = PRICE_ON_REQUEST_WITH_AMOUNT` — ce qu'`EX-DATA-32` impose et ce que l'adaptateur faisait déjà. Le dictionnaire est normatif ; c'est le manifest qui demandait à l'ingestion une chose interdite. |
| 8 | `R-DATA-05` | `tests/data/p16-fuel-body.test.ts:262` | la table des carrosseries autorisées par segment n'est plus recopiée : elle est **lue** dans `segments.json:bodyTypeMapping` | **LÉGITIME AVEC RÉSERVE** | Lire la table est juste **pour l'intention déclarée** de la sonde (« la carrosserie écrite appartient à l'ensemble fermé du segment »), et sans cela DR3-14 était incorrigible. **Réserve, sérieuse** : la sonde ratifie désormais **tout** ce que la table dira, et la table a changé au-delà de ce que le `$comment` justifie — voir **DR3-22** (le segment `sportive` passe de 60 % coupé / 40 % cabriolet à **25 % / 75 %**, sans justification). J'aurais gardé, **en plus** de la lecture, deux invariants indépendants de la table : `utilitaire`/`monospace` ne produisent jamais 2 ni 3, et la part de cabriolets reste bornée (aucune sonde ne la contraint aujourd'hui). |
| 9 | `R-DATA-28` (`P1`) | `tests/data/product-fitness.test.ts:86` | plancher d'offres `≥ 230` → **`≥ 120`** ; coupés avant filtres `≥ 400` → **`≥ 450`** ; marques `≥ 10` inchangé | **LÉGITIME AVEC RÉSERVE** | Recalculé sur le NDJSON du profil test : `bodyType = 3` → **672 coupés**, puis `prix ≤ 20 000 €` et `km ≤ 100 000` → **156 offres sur 35 marques et 16 années** (rev 1 : 31 offres). La mesure et l'ordre de grandeur publiés sont exacts, et le plancher 120 vaut ≈ `156 − 3·√156` : il est **principé**. **Réserve** : le plancher des coupés avant filtres, porté à 450 pour une mesure de **672**, est à **8,7 erreurs-types** sous la mesure — trois fois plus lâche que le premier. J'aurais retenu **590** (`672 − 3·√672`), par cohérence avec la règle appliquée à l'autre borne. |
| 10 | `R-DATA-11` (`P-55`) | `tests/data/p55-missingness.test.ts:129` | passe sous `devSamplingNoise` | **LÉGITIME** | `P-55` figurait **déjà** dans EG-12 sans que la sonde le matérialise (rev 1 §7.3 DR3-19). Au profil `test` la sonde reste opposable et verte sur 78 champs. La conséquence pour le champ `consumption.electricCombined`, elle, reste ouverte : voir DR3-05 au §10.3 et **DR3-24** au §10.5. |
| 11 | `ground-truth` `VERSION_AMBIGUOUS` (D3-29) | `tests/contract/ground-truth.test.ts:499` | `expect(erased).toBe(4)` → `.toBe(0)` (édition hors périmètre déclarée par `data-fix`) | **LÉGITIME** | L'assertion portait son propre aveu (« écart mesuré, **à consigner en constat** ») : elle figeait C-P3-12, pas un contrat. Recompté sur les trois snapshots `test` **et** sur `dev` (que la sonde lit) : **300 déclarations `VERSION_*` par snapshot, 0 sans `modelVersion` dans la ligne, 0 déclaration orpheline sur 2 361**. Le constat est **clos**, pas maquillé. |
| 12 | `ground-truth` `C-P3-11` (D3-34 a) | `tests/contract/ground-truth.test.ts:432-458` | assertions **retournées** : `versionStoplist` et `versionDriveBadges` **non vides**, 0 survivante — au lieu de « la liste d'arrêt n'est chargée nulle part » | **LÉGITIME** | La sonde d'origine restait verte **pour une mauvaise raison** : `D3-21` avait corrigé les deux chargeurs de production, mais le chargeur du **harnais** de `tests/contract/` ne lisait toujours pas les deux fichiers — elle ne prouvait plus rien de l'application. Vérifié dans `src/providers/tweedehands/testFixtures.ts:48-49` : les deux `import.meta.glob` de `version-stoplist.json` et `version-lexicon.json` sont là. La deuxième barrière R3 d'`EX-DATA-29` étape 3 est effective **et le harnais ingère avec le référentiel de l'application**, ce qui rend opposables les 93 cas du contrat. |

**Bilan : 8 LÉGITIME · 4 LÉGITIME AVEC RÉSERVE · 0 ILLÉGITIME.** Aucune sonde n'a été affaiblie pour
passer ; les quatre réserves portent sur des bornes trop lâches ou non re-justifiées, jamais sur le
principe de la correction. Elles sont reportées en réserves nommées de la porte (§10.7).

### 10.3 Les 19 constats de la rev 1 — statut un par un

Tous les chiffres de la colonne « recalcul » sont les miens, sur les fixtures régénérées `d3a3d74`.

#### MAJEURS

| # | Statut | Recalcul indépendant |
|---|---|---|
| **DR3-02** — `A-04` ne franchit pas la borne, 13 déclarations sans conséquence | **CLOS** | Sur les **six** snapshots (3 × test, 3 × dev) : `60/60` (test) et `15/15` (dev) déclarations `MILEAGE_IMPLAUSIBLE_FOR_AGE` dépassent **200 000 km/an**, **0** avec un âge indéterminable, **0** au-dessus de la borne canonique de 1,5 M km (maximum injecté **1 450 000 km**), **0** cumul avec `A-05` ou une unité `mi`. La forme (b), indétectable par construction, est retirée. Rev 1 : 37/50 et 13 sans conséquence. |
| **DR3-03** — tolérance de `P-25` inatteignable | **CLOS** (spécification amendée, sonde suivie) | §10.2 ligne 1 : 3 inversions brutes, **0 significative**, espérance mesurée 3,24 inversions. |
| **DR3-04** — κ de `P-45` inatteignable | **CLOS AVEC RÉSERVE** | §10.2 ligne 2 : `κ_max = 0,0402` confirmé au chiffre près, `κ/κ_max = 0,3373`. Réserve sur la borne haute. |
| **DR3-05** — trois champs conditionnels hors des ±25 % | **CLOS AVEC RÉSERVE** | Recalculé sur la population **éligible** (branche de mesure d'`EX-DATA-60`, mêmes règles que ma table `ELIGIBILITY`) au profil test : `isPluginHybrid` **16,01 %** (n = 2 674, réf. 15 % → +6,7 % relatif, **dans la bande**) ; `wltp.consumptionElectricCombined` **14,37 %** (n = 2 095, −4,2 %, **dans la bande**). Rev 1 : 4,59 % et 10,42 %. **Réserve** : `consumption.electricCombined` reste à **20,83 % pour 15 %** (n = **96**, +38,9 % relatif) — hors bande, mais **écarté de la mesure par le plancher `n ≥ 100` que j'avais moi-même posé**. À `n = 96` l'écart ne vaut que **1,60 erreur-type** : la donnée est compatible avec la référence, mais elle n'est **pas prouvée**. La dette **D3-27** ratifiée pour ce cas n'est pas appliquée (voir **DR3-24**). |
| **DR3-06** — `P-68` : 10,24 % de révisions observables | **CLOS** | Appariement des survivantes par identifiant, prix affiché comparé : `be-20260914` **16,90 %** (2 917 / 17 265) dont **83,85 %** à la baisse ; `be-20260921` **16,82 %** (2 917 / 17 339) dont **83,51 %**. Tolérances [14 % ; 20 %] et [80 % ; 88 %] : **tenues**. Mon effectif de survivantes diffère légèrement de celui du générateur (17 265 vs 17 910) parce que je n'apparie que les lignes dont **les deux** prix sont affichés ; le taux, lui, est le même à 0,6 point. `manifest.delta.priceRevisedCount` compte désormais **3 056 / 3 054** révisions **effectives**. |
| **DR3-07** — `P-69` : la médiane monte de 5,6 % | **CLOS** | Médiane du prix affiché : **16 222,5 → 15 990 → 15 990 €**, soit **−1,43 %** de S0 à S2 (tolérance : baisse ≤ 3 %). Contrôle du **même ensemble** de 16 118 survivantes sur les trois snapshots : **16 950 → 16 914,5 → 16 862,5 €** (−0,52 %), **monotone décroissante**. Le renouvellement du stock ne fait plus dériver la composition : l'acceptation-rejet en `1/d` remplace l'inclinaison d'âge de `R-52`. La sonde n'a **pas** été modifiée. |
| **DR3-08** — rappel de M1 à 36 % | **CLOS** | **Réimplémentation indépendante de M1** (cascade `C₁ → C₂ → C₃`, `n_price ≥ 12`, sentinelle relative `0,10 × médianeRéf(C)`, barrières de Tukey `k = 1,5` sur `ln(prix)`, quantile de type 7) sur les lignes dédoublonnées : **48/48 signalées au profil test (100,00 %)**, **12/12 au profil dev**, **0 écartée** par `PRICE_IMPLAUSIBLE_IN_CELL`. Rev 1 : 18/50, dont 32 écartées. Le plancher absolu de 250 € a bien cédé la place au seuil **relatif à la cellule**. |
| **DR3-09** — rappel de M2 à 51,4 % | **CLOS** | **Réimplémentation indépendante de M2** (points `F` à prix/année/km valides, OLS à ridge `1e-9·trace/3` et Cholesky, MAD × 1,4826, passe de trimming à `\|z\| < 3,5`, recentrage `m_r`, seuil ±2,5, cellule choisie par la première règle satisfaite d'`EX-DATA-86`) : **61/67 signalées au profil test (91,04 %)** — 3 évaluées non signalées, 3 sans verdict — et **16/17 au profil dev (94,12 %)**. Ces chiffres sont **identiques, un par un**, à ceux que `data-fix` publie ; le rappel dépasse les 85 % exigés avec 6 points de marge. |
| **DR3-10** — cinq taux appliqués à `N` au lieu de leur base | **CLOS AVEC RÉSERVE** | J'ai recompté **moi-même** les bases sur le fichier livré (test : `toutes` 20 000 · prix affiché **19 280** · sur demande **608** · PRO **13 735** · `powerHp` **19 233** · `offerType U/J/O` **19 764**) et confronté chaque **code** à `taux × base déclarée` : `CROSS_SELLER_DUPLICATE` 110 / 109,9 · `DUPLICATE_LISTING_ID` 14 / 13,7 · `DUPLICATE_VALUE_CONFLICT` 34 / 34,3 · `HYBRID_CATEGORY_UNRESOLVED` 20 / 20,0 · `PRICE_ON_REQUEST_WITH_AMOUNT` 8 / 7,9 · `REGION_UNRESOLVED` 90 / 90,0 (`A-19` + `A-21`, même code) · M1 48 / 48,2 · M2 67 / 67,5. **Les cinq groupes de la rev 1 (+46 %, +46 %, +46 %, +658 %, +3 189 %) sont rentrés dans les ±20 %.** **Réserve** : il reste **une** base qui annonce ce qu'elle n'applique pas — `A-11` (voir **DR3-21**). |
| **DR3-11** — 61 valeurs injectées introuvables | **CLOS** | Sur les trois snapshots test : **2 361 déclarations, 0 orpheline, 300 `VERSION_*` dont 0 sans `modelVersion`**. La table `ANOMALY_PROTECTED_FIELDS` protège le champ porteur **en consommant le tirage**, donc sans décaler le motif d'absence des autres champs — `P-70` (survivantes non révisées identiques champ à champ) reste à **0 écart** au `data:check`. |
| **DR3-13** — TVA déductible acceptée en silence sur un `PRIVATE` | **CLOS** | Deux vérifications. (a) Les fixtures : sur les six snapshots, **0** annonce à `seller.type = P` porte `prices.public.isTaxDeductible` (les 12 300 occurrences que j'avais d'abord comptées relevaient d'une erreur de lecture de ma part — `D` est le **professionnel**, `P` le particulier). (b) L'adaptateur : `src/providers/adapters/as24/adapt.ts` (bloc « # 10 ») **écarte** la valeur vers INCONNU et pose `ENUM_UNKNOWN` pour le **couple** (vendeur, TVA), pour `P` comme pour `PRIVATE`, `true` comme `false`. La sonde `S-08`, **non modifiée**, est verte. |
| **DR3-14** — parcours P1 à 31 offres | **CLOS AVEC RÉSERVE** | §10.2 ligne 9 : 672 coupés → **156 offres, 35 marques, 16 années** ; part de coupés **3,39 %** sur 19 840 annonces à carrosserie connue (tolérance `P-24` [2,0 ; 3,5]). **Réserve** : la correction de `segments.json` va au-delà de ce qu'elle justifie (**DR3-22**), et la densité par marque reste faible (voir `C-3.5-03` ci-dessous). |
| **DR3-15** — `DUPLICATE_VALUE_CONFLICT` pour deux notions | **OUVERT, dette D3-26 ratifiée** | Recompté : **34/34** paires ont des identifiants **différents** et le **même** `dealerBucket` — c'est bien une republication intra-vendeur, qu'`ARB-54` réserve à une divergence entre deux occurrences du **même** identifiant. Le constat est consigné dans `anomalies.json:A-07b.constatDR3_15` avec le jeu de modifications exact. Le report est **motivé** (renommage = changement de contrat, `tests/contract/ground-truth.test.ts` indexé par code) : **dette acceptable**. |

#### MINEURS

| # | Statut | Recalcul indépendant |
|---|---|---|
| **DR3-01** — `snapshotIdPattern` | **CLOS** | §10.2 lignes 4 et 5. |
| **DR3-12** — `dependentSchemas.wltp` | **CLOS** | §10.2 ligne 6 ; `R-DATA-24` (non modifiée) verte. |
| **DR3-16** — `POWER_OUT_OF_RANGE` inatteignable | **OUVERT, dette D3-28 ratifiée** | Recompté : **12 déclarations `A-13`, valeurs 1 et 9 999, 0 hors du domaine `[1, 9999]`**. `A-13` est requalifiée en signal de vraisemblance dans `anomalies.json` et ajoutée à la liste `inatteignables`, mais reste au manifest — statu quo assumé et écrit. **Dette acceptable** : la valeur servie **est** absurde, ce qui a une valeur de test. |
| **DR3-17** — trois écarts de documentation | **CLOS** | `missingness.json:conditionalAbsence` complété (12 entrées marquées `DR3-17`) et `baseRatesNote` ajoutée ; **HG-05** publie `TRIM_WORDS` et sa règle de choix — `P-54` est désormais vérifiable **sans reconstruire un classifieur** (mon hypothèse HR-03 tombe) ; `snapshot-dynamics.json:deltaUnitOfCount` dit que l'écart entre `enteredCount` et le nombre d'identifiants distincts vaut exactement le nombre de doublons `A-07`. |
| **DR3-18** — `REGION_UNRESOLVED` et `A-20` | **CLOS** | Recompté au manifest test S0 : `REGION_UNRESOLVED` porte un `detail` **normé** — `prefixe postal non resolu` **80** (avec `expected.flagExpected = true`) et `pays hors marche` **10** (`flagExpected = false`) : les deux situations que `DATA-MODEL` §3.1 sépare sont désormais distinguables **sans relire la ligne**. `A-20` : **8/8** déclarations à `expected.status = QUOTED`. |
| **DR3-19** — portée par profil | **CLOS** | Diff `probes.json` `6b66e0c..HEAD` : **exactement six** sondes changent de portée — `P-18`, `P-23`, `P-37`, `P-38`, `P-55`, `P-58` passent de `snapshot` à `snapshot test`, ce sont **précisément** celles que DR3-19 nommait (`P-45`, `P-10`, `P-11`, `P-72`, `P-75`, `P-76`, `P-05` l'étaient déjà). **Aucune autre sonde n'a été relâchée par cette voie** — je l'ai vérifié champ par champ sur les 110. `data:check --profile dev` les affiche en DETTE `EG-12` au lieu d'un écart. |

#### Constats hérités des autres lots

| # | Statut | Verdict |
|---|---|---|
| **`C-3.5-03`** (`mvp-integrate`) — densité du parcours P1 au profil test, « 32 offres sur 17 marques », **à confirmer par `data-review`** | **CLOS AVEC RÉSERVE — la mesure a changé de base** | Le chiffre de `mvp-integrate` a été relevé **avant** la régénération `d3a3d74`. Je mesure aujourd'hui **156 offres sur 35 marques et 16 années** au profil test (36 offres / 15 marques au profil `dev`). **La propriété du jeu est acceptable pour le parcours cible de `docs/00-CONTEXT.md`** : le mode 1 y demande « quelles marques et quels modèles existent, combien d'offres pour chaque couple, **les fourchettes de prix / année / kilométrage de chacun** » — 35 cartes-marques alimentées le rendent, et le parcours **exerce les deux régimes d'affichage**, ce qui a une valeur de recette. **Réserve écrite** : seules **4 marques sur 35** atteignent `n ≥ 12`, le seuil au-dessous duquel l'écran bascule sur la « fourchette observée », et **aucune** n'atteint les `\|F\| ≥ 30` de M2 — 31 cartes sur 35 montrent donc la fourchette observée. Ce n'est **pas un défaut** (la conjonction carrosserie × prix × kilométrage est légitimement sélective sur 20 000 annonces) ; c'est une **décision de commanditaire** si l'on veut que P1 montre la présentation nominale : il faudrait augmenter le volume du profil servi ou la part de coupés à prix modéré. À porter à l'acceptance rev 3, pas à `data-fix`. |
| **`C-P3-11`** (`fixture-perf`, D3-34 a) | **CLOS** | §10.2 ligne 12. |
| **`C-P3-14` / `C-R1-01`** (ouverture du profil test) | hors de mon périmètre | Le `test:contract` publie `baseline servie 9 ms` (budget S4 2 000 ms) et `annonces ingérées 2 762 ms` (budget 10 000 ms) : je le note, je ne le juge pas. |

### 10.4 La baseline précalculée (`baseline.json`, D3-31/D3-34)

J'ai recalculé les agrégats **à partir du NDJSON seul**, sans instancier le provider, sur **les six
snapshots** des deux profils commités.

| Contrôle | Mesure | Verdict |
|---|---|---|
| Liaison aux octets | `producedFrom.sha256` = `manifest.sha256` et `snapshotId` = `manifest.snapshotId` sur **6/6** artefacts | **conforme** — l'artefact ne peut pas se détacher du fichier qu'il résume |
| `selectionCount` | 19 986 / 19 986 (test) et 4 997 / 4 997 (dev), soit le nombre d'identifiants **distincts** du fichier (14 et 3 doublons `A-07` retirés) | **conforme** |
| Une ligne par marque, même effectif | **262/262** marques au profil test, **135/135** au profil dev, **0 écart d'effectif** sur les 6 snapshots (contrôle exhaustif, pas un échantillon) | **conforme** |
| `min` / `max` de `price` et `year` | **0 écart** sur les 6 snapshots (786 bornes comparées au profil test) | **conforme** |
| Bloc `year` | `year` est le **`productionYear`** de la source (canonique `modelYear`, `adapt.ts` # 24), pas l'année de première immatriculation : `n`, `min`, `max`, `p05`, `p50`, `p95` **exacts** sur les marques contrôlées | **conforme** |
| Quantiles `p05` / `p50` / `p95` | **voir DR3-20** — ils suivent le **rang le plus proche `x_⌈p·n⌉`**, jamais l'interpolation de type 7 qu'`EX-DATA-62` impose : **6 954 quantiles comparés sur les 6 snapshots, 6 954 reproduits exactement par le rang le plus proche, 3 653 seulement par le type 7** | **NON CONFORME à `EX-DATA-62`** |
| Garde R3 sur l'artefact | `R-DATA-21` balaie désormais **40** fichiers JSON sous `data/schema`, `data/fixtures` et `docs/data/dataset-spec` (33 en rev 1 : les **6** `baseline.json` et le schéma `snapshot-baseline.schema.json` sont couverts **automatiquement**), **0 clé interdite** | **conforme** — la garde n'a pas eu besoin d'être étendue à la main |
| Couverture par `data:validate` | 12 contrôles par snapshot (schéma, `snapshotId`, `sha256`, version de schéma, effectif annoncé, Σ effectifs = `selectionCount`, effectif d'ingestion, lignes lues = retenues + rejetées + doublons, effectif de métrique ≤ effectif de marque, bornes nulles ⟺ `n = 0`) | **substantielle, mais aveugle sur les valeurs** : rien ne compare une **valeur de quantile** à une définition |
| Couverture par `data:check` | `P-BL1` (présence et liaison aux octets), `P-BL2` (`selectionCount` = identifiants distincts), `P-BL3` (une ligne par marque, même effectif, ordre décroissant) | **même angle mort** |
| Couverture par `tests/contract/baseline-artifact.test.ts` | compare l'artefact à `aggregateByMake(batch, null, 1)`, **la fonction même qui l'a produit** | **tautologique sur la convention** : elle prouve que l'artefact est fidèle à l'ingestion, elle ne peut pas voir que la convention diverge du dictionnaire et du moteur |

**Contrôle manquant, à écrire (constat, pas correction)** : aucune sonde ne confronte
`baseline.json` à `aggregate(batch, toutes les lignes, …)` de `src/engine/aggregate.ts`, c'est-à-dire
au calcul **du moteur**. C'est ce contrôle qui aurait levé DR3-20 dès la livraison de `fixture-perf`.

### 10.5 Nouveaux constats

| # | Sévérité | Constat | Preuve (recalcul) | Correction attendue | Pour |
|---|---|---|---|---|---|
| **DR3-20** | **MAJEUR** | **Les quantiles servis en mode 1 — et désormais **figés** dans les six `baseline.json` commités — sont des percentiles « au rang le plus proche » `x_⌈p·n⌉`, alors qu'`EX-DATA-62` (`draft-data-dictionary.md:898`, « définition unique et **non négociable** ») impose le **quantile de type 7**.** La cause est `src/providers/synthetic/aggregate.ts:35` (`nearestRank`), employé par `aggregateByMake`/`aggregateByModel` des providers **synthetic ET fixture** (`FixtureDataProvider.ts:374, 428`). Deux divergences en découlent : (a) avec le **moteur**, `src/engine/quantiles.ts:56` (`quantileType7`), qui sert la même entité gelée `MetricRange` ; (b) avec le **provider `tweedehands`**, `src/providers/tweedehands/aggregate.ts:52`, qui interpole (type 7). Deux providers remplissent donc le même contrat avec deux définitions, et le provider **par défaut depuis 3.5** est celui qui ne suit pas le dictionnaire. S'ajoute une divergence d'**échantillon** : le moteur écarte de `price` les annonces sous le seuil relatif de Σ (`EX-DATA-19(2)`), pas le provider — **274** lignes au profil test, **83** au profil dev. | Profil test, snapshot S0 : **293 des 768** quantiles de prix par marque diffèrent entre les deux conventions, écart relatif maximal **85,76 %** (18 005 € : marque 16420, `p50`, `n = 2`, rang le plus proche **2 990 €** contre type 7 **20 995 €**) ; profil dev **167/399**, écart maximal **78,99 %**. Sur l'ensemble des six snapshots, **6 954/6 954** quantiles de l'artefact sont reproduits par `x_⌈p·n⌉` et **3 653** seulement par le type 7. Aucune sonde de `tests/data/` ni de `tests/contract/` ne mentionne `EX-DATA-62`. | **Arbitrage dû avant G9** : soit corriger `nearestRank` en type 7 (`src/providers/synthetic/aggregate.ts`) et **régénérer les six `baseline.json`** (`npm run data:baseline`), soit amender `EX-DATA-62` par une dette `D3-nn` écrite qui dise laquelle des deux conventions est la définition du produit. Dans les deux cas, une **sonde de contrat** confrontant `baseline.json` à `aggregate()` du moteur, rouge aujourd'hui. | **coordinateur** (arbitrage), puis `mvp-integrate` ou un agent provider |
| **DR3-21** | MINEUR | **`A-11` déclare une base que le générateur n'applique pas** — reliquat de DR3-10. `anomalies.json:A-11.base` dit « annonces à prix affiché **de cellules (make, model) à `\|F\| ≥ 30`** », alors que le taux 0,0035 est appliqué à **toutes** les annonces à prix affiché. C'est exactement le défaut que DR3-10 demandait de fermer partout : « le champ ne doit pas annoncer une chose et le fichier en produire une autre ». `data:check` partage l'angle mort (il prend lui aussi « prix affiché »). | Recompté : au profil test, **165 cellules** `(make, model)` atteignent `n_price ≥ 30` et couvrent **13 745** annonces ; `0,0035 × 13 745 = 48,1` contre **67** réalisées (**+39 %**). Au profil dev : **1 402** annonces couvertes, attendu **4,9** contre **17** réalisées (**+246 %**). Sur la base « prix affiché » (19 280 / 4 820) l'accord est parfait : 67,5 et 16,9. | Déplacer la restriction du champ `base` vers le champ **`vivier`**, comme cela a été fait pour `A-04` et `A-16` (`baseVsVivier`), et étendre le contrôle `P-72` de `data:check` à la distinction. | `data-fix` |
| **DR3-22** | MINEUR | **La correction de DR3-14 a compensé une distribution mesurée par une distribution non mesurée, sans le dire.** Le `$comment` de `segments.json:bodyTypeMapping` justifie — correctement — l'ajout du code 3 (Coupé) aux segments `citadine` (7,0 %) et `compacte` (6,5 %). Il ne dit **rien** de l'autre moitié du changement : le segment `sportive` passe de **60 % coupé / 40 % cabriolet** à **25 % coupé / 75 % cabriolet**, ce qui **inverse l'ordre du marché** (une sportive d'occasion est plus souvent un coupé qu'un cabriolet) et n'a d'autre effet que de maintenir la part de coupés sous la borne haute de `P-24`. | Distribution des carrosseries, profil test S0, **avant** `data-fix` : coupé **2,41 %**, cabriolet **1,51 %** (rapport 1,60). **Après** : coupé **3,39 %**, cabriolet **2,74 %** (rapport 1,24) — la part de cabriolets a augmenté de **+81 %**. **Aucune sonde ne contraint la part de cabriolets** : ni `probes.json`, ni `DATASET-SPEC.md`, ni `tests/data/` ne la nomment. | Rétablir un mélange `sportive` à dominante coupé et rééquilibrer les poids de `citadine`/`compacte` pour que `P-24` reste dans [2,0 ; 3,5] ; **ou** justifier l'inversion par une source, comme le fait le reste de `segments.json`. Ajouter une sonde sur la part de cabriolets, faute de quoi elle restera ajustable sans contrôle. | `data-fix` |
| **DR3-23** | MINEUR | **La sortie `P-72` de `data:check` est trompeuse pour les codes partagés.** Elle imprime une ligne par `A-nn` mais un effectif **réalisé par code** : `A-19:90/10.0@20000` et `A-21:90/80.0@20000` se lisent comme un écart de **+800 %** alors que le code unique `REGION_UNRESOLVED` réalise 90 pour 90 attendues (10 + 80). Même forme pour `A-10`/`A-11` (`OUTLIER_M1_*` / `M2_*`). | Vérifié : `REGION_UNRESOLVED` réalisé **90**, attendu `0,0005 × 20 000 + 0,004 × 20 000 = 90,0` — l'accord est parfait, c'est l'**affichage** qui alarme. | Imprimer une ligne par **code** (réalisé / somme des attendus), ou la part imputée à chaque `A-nn`. | `data-fix` |
| **DR3-24** | MINEUR | **La dette `D3-27` est ratifiée mais ni appliquée ni fidèlement rédigée.** Le journal la ratifie comme « tolérance élargie pour les champs à base < **200** lignes au profil **dev** ; profil test inchangé ». Or (a) `data-fix` écrit explicitement qu'il **ne l'a pas appliquée** ; (b) sa proposition était tout autre — `max(±25 % relatifs, ±3 erreurs-types)`, valable **à tous les profils** ; (c) le dispositif réellement en place est le plancher `n ≥ 100` **du reviewer**, actif aux **deux** profils. Conséquence : `consumption.electricCombined` n'a de taux d'absence mesuré **à aucun volume commité**. | Recalculé : population éligible **96** lignes au profil test (27 au profil dev), taux d'absence **20,83 %** pour une référence de 15 % (**+38,9 % relatif**, mais **1,60 erreur-type** seulement — compatible avec la référence, donc ni fautif ni prouvé). | Réécrire `D3-27` pour dire ce qui est décidé, puis **soit** appliquer la tolérance `max(±25 % relatifs, ±3 e.t.)` — qui rend le plancher `n ≥ 100` inutile et la sonde opposable sur **tous** les champs —, **soit** consigner que le taux de ce champ n'est pas prouvé aux volumes commités. | coordinateur, puis `data-fix` |

**Aucun BLOQUANT.** J'ai pesé DR3-20 à cette aune : au sens strict de mon barème (« donnée fausse
affichable »), un `p50` qui n'est pas le quantile que le dictionnaire définit **est** une valeur
fausse affichée, et l'écart atteint 18 005 € sur une marque à deux annonces. Je le tiens néanmoins
en **MAJEUR**, et je dis pourquoi : le défaut est **antérieur** aux deux lots que cette re-revue
juge (il date de l'agrégation du lot D3 ; `D3-31` n'a fait que la **figer** dans un fichier commité),
il ne rend aucune ligne du jeu de données fausse, et sur un effectif impair il coïncide avec le type 7.
Il n'en reste pas moins **dû avant G9**.

### 10.6 Hypothèses écrites (E4) de la rev 2

| # | Hypothèse | Où elle sert |
|---|---|---|
| HR2-01 | Mes réimplémentations de M1 et M2 dérivent le **canonique** depuis la source par les règles d'`adapt.ts` que j'ai relues, sans exécuter l'adaptateur : prix = `round(prices.public.price)` valide si `250 ≤ p ≤ 5 000 000` (`PRICE_SENTINEL_ABSOLUTE_EUR` et annexe A), année valide si `firstRegistrationDate` est un `AAAA-MM` licite dans `[1900 ; année + 1]`, kilométrage valide si l'unité est `km`, `0 ≤ km ≤ 1 500 000` et hors `SUSPECT_ZERO_MILEAGE`, `modelId` résolu ⟺ `model` présent. Que cette dérivation soit **la bonne** est prouvé a posteriori : les rappels que j'obtiens (48/48, 61/67, 12/12, 16/17) et le κ (0,0136 / 0,0402) sont **identiques** à ceux du moteur de production. | §10.2 lignes 2-3, §10.3 DR3-08/DR3-09 |
| HR2-02 | Les lignes sont **dédoublonnées par identifiant** (première occurrence conservée) avant tout calcul, comme le provider les sert : 19 986 lignes au profil test, 4 997 au profil dev. L'arbitrage réel d'`EX-DATA-15` diffère du mien, mais il porte sur **14** lignes et n'a déplacé aucun des contrôles ci-dessus (les 262 effectifs par marque de la baseline sont exacts avec cette règle). | §10.3, §10.4 |
| HR2-03 | Pour DR3-05, la **population éligible** de chaque champ conditionnel est celle de ma table `ELIGIBILITY` de la rev 1, reconstruite à l'identique (branche de mesure = `WLTP` si le bloc `wltp` existe, sinon `NEDC` si `co2Emissions`, `consumption` ou `efficiencyClass` existe, sinon `NONE`). | §10.3 DR3-05, §10.5 DR3-24 |
| HR2-04 | Pour DR3-06, une « survivante » est une annonce dont **les deux** snapshots portent un prix affiché numérique. Le générateur compte des survivantes sans cette condition (17 910 contre mes 17 265) ; les deux taux ne diffèrent que de 0,6 point et tombent tous deux dans la tolérance. | §10.3 DR3-06 |
| HR2-05 | Pour DR3-20, la « convention du moteur » est celle de `src/engine/quantiles.ts` (`quantileType7`, l'algorithme littéral d'`EX-DATA-62`) et la « convention du provider » celle de `nearestRank`. Je n'ai **pas** exécuté le moteur sur le lot ingéré : je compare deux formules explicites à un même multiensemble de valeurs, celui que je lis dans le NDJSON — et dont l'exactitude est attestée par les 6 954/6 954 reproductions au rang le plus proche et par les 262/262 effectifs par marque. | §10.4, §10.5 DR3-20 |

### 10.7 Verdict — porte G9b

Critères de `docs/plans/PLAN-3-fixture-data-mvp.md` §3.4 : « **chaque constat BLOQUANT/MAJEUR corrigé
(sonde verte) ou en dette écrite `D3-nn`** ; **fixtures régénérées et re-commitées avec leur
manifest** ».

| Critère | Verdict | Preuve |
|---|---|---|
| Chaque MAJEUR de la rev 1 corrigé ou en dette écrite | **ATTEINT** | 12 des 13 corrigés, **sonde verte sans qu'elle soit affaiblie** pour 11 d'entre eux (les deux sondes dont la tolérance a changé, `P-25` et `P-45`, portent une démonstration d'inatteignabilité que j'ai **vérifiée par recalcul**) ; `DR3-15` en dette **D3-26**, motivée par le périmètre de contrat |
| Chaque MINEUR corrigé ou en dette | **ATTEINT** | 5 corrigés, `DR3-16` en dette **D3-28** |
| Fixtures régénérées et re-commitées avec leur manifest | **ATTEINT** | `d3a3d74` : 6 `listings.ndjson.gz`, 6 `manifest.json`, 6 `generation.json` ; `data:validate` conforme aux deux profils ; budgets tenus (test 8 180 000 / 8 388 608 octets gz, dev 2 083 390 / 2 097 152) |
| Zéro BLOQUANT ouvert | **ATTEINT** | aucun |
| Sondes exécutables, non régressées | **ATTEINT** | 152/152 aux deux profils, contrat 93/93, `data:check` 74 sondes / 0 écart |
| **Constats nouveaux traités** | **NON ATTEINT** | **DR3-20 est un MAJEUR ouvert sans dette écrite** |

> ## **G9b : FRANCHIE SOUS RÉSERVES NOMMÉES**
>
> Le travail de `data-fix` est **solide et honnête** : les douze MAJEURS que j'avais posés sont
> corrigés dans la donnée ou dans une spécification amendée avec démonstration, aucune sonde n'a été
> affaiblie pour passer, et les quatre corrections les plus délicates (rappel de M1, rappel de M2,
> stationnarité de la médiane, bases des taux d'anomalie) sont **reproduites au chiffre près par mon
> propre code**. La porte est franchie sur ses critères écrits. Les cinq réserves ci-dessous doivent
> être tranchées avant **G9**, pas avant G9b.

| Réserve | Origine | Qui agit | Quoi | Sonde qui le prouvera |
|---|---|---|---|---|
| **R1 — MAJEUR** | `DR3-20` : la baseline commitée et les agrégats mode 1 violent `EX-DATA-62` (rang le plus proche au lieu du type 7) et divergent du moteur et du provider `tweedehands` | **coordinateur** (arbitrage : corriger ou écrire une dette `D3-nn` qui dise quelle convention est la définition du produit), puis `mvp-integrate` ou un agent provider | corriger `nearestRank` en `quantileType7` dans `src/providers/synthetic/aggregate.ts` et **régénérer les six `baseline.json`** ; **ou** amender `EX-DATA-62` par écrit | **sonde neuve de `tests/contract/`** : pour chaque snapshot commité, `baseline.json.rows` doit être **égal champ à champ** à `aggregate(batch, toutes les lignes, …).makeAggregates` de `src/engine/aggregate.ts` — **rouge aujourd'hui** sur 293 quantiles au profil test |
| **R2 — MINEUR** | `DR3-21` : `A-11.base` annonce une restriction que le générateur n'applique pas | `data-fix` | déplacer la restriction vers `vivier` (`baseVsVivier`), aligner `data:check` | `R-DATA-19` (`P-72`) étendue : l'effectif attendu d'`A-11` calculé **sur la base déclarée** |
| **R3 — MINEUR** | `DR3-22` : `sportive` passe à 75 % de cabriolets sans justification, part de cabriolets +81 % et non contrainte | `data-fix` | rétablir un mélange à dominante coupé (ou sourcer l'inversion) et rééquilibrer `citadine`/`compacte` pour tenir `P-24` | sonde neuve sur la **part de cabriolets** (`bodyType = 2`), tolérance sourcée, à côté de `P-24` |
| **R4 — MINEUR** | `DR3-23` : la sortie `P-72` de `data:check` affiche un écart de +800 % là où l'accord est parfait | `data-fix` | imprimer une ligne par **code** | `data:check --profile test` relu : `REGION_UNRESOLVED 90/90` |
| **R5 — MINEUR** | `DR3-24` : `D3-27` ratifiée, non appliquée, et rédigée autrement que proposée ; `consumption.electricCombined` sans taux prouvé | **coordinateur**, puis `data-fix` | réécrire `D3-27`, puis appliquer `max(±25 % relatifs, ±3 e.t.)` **ou** consigner que le champ n'est pas prouvé | `R-DATA-11` (`P-55`) mesurant **79** champs au lieu de 78, `consumption.electricCombined` compris |

Dettes existantes **revérifiées et acceptables en l'état** : **D3-26** (renommage d'`A-07b`,
34/34 paires confirmées, changement de contrat), **D3-28** (`A-13` inatteignable, 12 déclarations,
valeurs 1 et 9 999 dans le domaine), **EG-01 / D3-19** (`P-10`, `P-11`), **EG-11 / D3-20** (`P-57`,
mesuré 0,074), **D3-29** (édition hors périmètre de `ground-truth`, §10.2 ligne 11), **D3-34 (a)**
(sonde `C-P3-11` retournée, §10.2 ligne 12).

Ce que devient la suite `tests/data/` : les **152 sondes** sont désormais **toutes vertes aux deux
profils** et constituent la suite de non-régression des données ; les 5 dettes (`P-10`, `P-11`,
`P-57` aux deux profils, `P-45` et `P-55` au seul profil `dev`) restent en `it.fails` **annoté**,
jamais en `skip`.
