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
