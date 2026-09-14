# `fixture-provider` — provider de fixtures, adaptateur AS24 et suite de contrat (phase 3.3)

> Agent `fixture-provider` (Opus / high), worktree `p3/fixture-provider`, démarré en avance (D3-18).
> Périmètre d'écriture : `src/providers/{fixture,adapters/as24,registry.ts,README.md}`,
> `src/providers/DataProvider.ts` (extension de `SourceKind` seule), `src/types` (D3-07 et D3-10),
> `src/main.tsx`, `vite.config.ts`, `tests/contract/`, `tests/review/D2/`, `package.json` (scripts).
>
> Entrées lues : `CLAUDE.md` §4.7, `PLAN-3` §3.3, `DATA-LEAD-DECISIONS.md` (D3-01…D3-17),
> `docs/data/DATA-MODEL.md` (table §3.1 = la spécification de l'adaptateur ; §6 versionnement ;
> §7 contraintes), `DATASET-SPEC.md` §8, `data/schema/*`, `DataProvider.ts` (gelée, lue en entier),
> `src/providers/synthetic/` (modèle d'implémentation), `src/types/`, `ARCHITECTURE.md` §9.3.

---

## 0. Ce qui est livré, et l'état des portes

| Porte | Commande | Résultat |
|---|---|---|
| tsc application | `tsc --noEmit -p tsconfig.json` | **0 erreur** |
| tsc worker | `tsc --noEmit -p tsconfig.worker.json` | **0 erreur** |
| tsc sondes de revue | `tsc --noEmit -p tsconfig.review.json` | **0 erreur** |
| tsc suite de contrat | `tsc --noEmit -p tsconfig.contract.json` (nouveau) | **0 erreur** |
| lint (mon périmètre) | `eslint src/providers src/types src/main.tsx tests/contract tests/review/D2 vite.config.ts vitest.contract.config.ts` | **0 problème** |
| lint global | `npm run lint` | **5 erreurs, PRÉEXISTANTES** — `data/schema/validate.mjs`, livrable de `data-model` (3.1) : voir **C-P3-6** |
| unitaires du périmètre | `vitest run --no-file-parallelism src/providers src/types` | **230 / 230** (suite complète : 756 / 756) |
| suite de contrat | `npm run test:contract` | **83 / 83** (dont 31 de vérité terrain) |
| sondes de revue | `vitest run --config vitest.review.config.ts` (toutes) | **1097 / 1097** |
| build | `npm run build` | **0 erreur / 0 avertissement** |
| taille | `npm run size` | **129,51 / 300 Kio gzip — OK** |

Livré en quatre lots, un commit chacun : couche schéma (D3-07, D3-10, `SourceKind`) · adaptateur
as24 · provider + registre + service des fixtures · suite de contrat ; puis ce rapport.

---

## 1. Architecture

```
                     ┌───────────────────────────────────────────────────────────┐
  data/fixtures/     │  registry.ts        ?provider= > VITE_KYCAR_PROVIDER > D3-01│
  <profil>/          │      │  resolveProvider(spec) — repli EXPLICITE            │
   ├ index.json      └──────┼────────────────────────────────────────────────────┘
   └ <snapshot>/            v
      ├ manifest.json   FixtureDataProvider ──── loaders/{http,node}.ts (même contrat)
      └ listings.ndjson.gz      │
                                │ ndjson.ts : reniflage 1f 8b + DecompressionStream, ligne à ligne
                                v
                        adapters/as24/  adaptAs24Listing(raw, ctx)
                          garde R3 → normalisation → validation → drapeaux
                                │
                                v
                        columnar.ts → ListingColumnBatch (interface GELÉE)
                                │
                    ┌───────────┴───────────┐
              synthetic/selection.ts   synthetic/aggregate.ts     (briques D3 RÉUTILISÉES)
```

**Trois principes d'implémentation**, tous vérifiables :

1. **Aucune brique du lot D3 n'est réécrite.** `allocColumns` / `finalizeBatch` / `subsetBatch` /
   `batchByteLength` (`synthetic/columnar.ts`), `compileSelection` / `selectRows`
   (`synthetic/selection.ts`), `aggregateByMake` / `aggregateByModel` (`synthetic/aggregate.ts`) et
   `codeIndex` (`synthetic/catalog.ts`) sont **importés**. Les réécrire aurait produit un second
   moteur d'agrégation et un second encodage de l'interface gelée, à faire diverger.
2. **Aucune borne, aucun code de drapeau n'est recopié.** Les bornes viennent de
   `LISTING_NUMERIC_BOUNDS` / `LISTING_BOUND_INGEST_FLAG` (D-47), les bits de
   `INGEST_FLAG_BIT` / `BOOLEAN_FLAG_BIT` (DR-013). Un `1 << n` littéral n'existe nulle part.
3. **Le chargeur est une interface.** `FixtureLoader` a trois méthodes ; `http.ts` (navigateur) et
   `node.ts` (vitest) les servent. Le MÊME code d'adaptation, de dédoublonnage et d'agrégation
   tourne sous test et dans l'application — condition pour qu'une sonde verte dise quelque chose de
   l'application. `node.ts` (qui importe `node:fs`) n'est réexporté par aucun barrel de production :
   leçon `HANDOFF.md` §7.7 respectée.

---

## 2. Table §3.1 → fonctions : couverture des 82 champs

L'adaptateur est **la** spécification exécutable de la table §3.1. Chaque ligne a au moins un cas de
test, et un test de **couverture** (`adapt.test.ts`) compte les numéros cités dans les titres et
échoue si l'un des 82 cesse d'être couvert : la couverture ne peut pas se dégrader en silence.

| Bloc | Champs | Où c'est appliqué |
|---|---|---|
| Garde R3 (étape 0) | — | `scanForbiddenFields(raw)` **avant toute lecture typée** |
| Identité, provenance | 1–6 | `adapt.ts` §identité + `normalize.ts` (`LISTING_ID_PATTERN`, `normalizeListingUrl`, `hostMatchesDomain`) |
| Prix | 7–15 | `adapt.ts` §prix (`roundHalfAwayFromZero`, `PRICE_SENTINEL_ABSOLUTE_EUR`, `VAT_DEDUCTIBLE`) |
| Taxonomie, version | 16–24 | `ref.makeById` / `modelByKey`, `parseModelVersion` (EX-DATA-29 étapes 1–8) |
| État, dates | 25–34, 59–63 | `parseFirstRegistrationYearMonth` (EX-DATA-23) + bornes annexe A |
| Motorisation | 35–48 | gardes d'unité EX-DATA-5, `HP_TO_KW`, repli EX-DATA-10, `FUEL_TYPE_TO_CATEGORY` |
| Mesure, écologie | 49–58 | `pickMeasurement` (priorité `wltp > NEDC > fallback`, EX-DATA-35) |
| Carrosserie, finition | 64–73 | tables de codes pré-calculées (`vocab.ts`) |
| Géographie, vendeur, publicité | 74–81 | `MARKETPLACE_CODE_TO_ISO`, `resolveRegionBE(préfixe × 100)`, alias EX-DATA-41 |
| Cumul | 82 | `RowAccumulator.ingestFlags` |

**Résultat : 82 / 82.** `full.json` (branche WLTP), `full-nedc.json` (branche NEDC) et `minimal.json`
traversent ; `invalid-r3.json` est **rejeté avant adaptation**, sur le nom de propriété — de même
qu'une forme aplatie (`sellerPhone`) et une ville sous `location`.

### 2.1 Quatre constats sur la table §3.1 elle-même

| Réf. | Constat | Ce que l'adaptateur fait |
|---|---|---|
| **C-P3-1** | La table nomme quatre codes que `KYCAR_INGEST_FLAG` (`EX-DATA-45`, 17 codes) **ne définit pas** : `YEAR_OUT_OF_RANGE` (# 24), `CO2_ZERO_NON_BEV` (# 49), `HYBRID_INCONSISTENT` (# 46), `HYBRID_CATEGORY_UNRESOLVED` (# 42). L'encodage étant POSITIONNEL (D-01 / DR-013), un code hors liste **n'a pas de bit**. | Aucun 18ᵉ code n'est inventé. Pour # 24, le drapeau est celui que la table UNIQUE des bornes associe à `modelYear` (`FIRST_REG_OUT_OF_RANGE`). Les trois autres sont des **codes d'anomalie du manifest**, pas des drapeaux d'ingestion : l'adaptateur applique la conséquence écrite (valeur INCONNUE) et publie la condition dans `notices`, que le provider compte et **déclare dans `coverageNote`**. Jamais en silence, jamais dans le bit d'un autre code. **Pour `data-review`.** |
| **C-P3-3** | Deux formes de `snapshotId` coexistent : `snapshot-manifest.schema.json` impose `^[a-z]{2}-[0-9]{8}T[0-9]{6}Z$`, `docs/data/dataset-spec/profiles.json` annonce `be-fixture-<profil>-<AAAAMMJJ>-<graine hex>`. | Le provider **n'interprète jamais** `snapshotId` (l'interface gelée le déclare opaque) : il est insensible à l'arbitrage. Le choix du snapshot par défaut se fait sur `capturedAt`, **jamais sur le nom du répertoire**. L'écart reste à trancher entre `data-model` et `dataset-design`. **Pour `data-review` / coordinateur.** |
| **C-P3-4** | La colonne `countryCode` est adossée au vocabulaire `KYCAR_MARKETPLACE` (convention D3 : l'octet stocke l'index du code), alors que le champ # 74 est un code **ISO-3166-1**. Un pays ISO valide hors des neuf marchés n'a donc **aucune place** dans l'octet. | Traduction explicite `ISO_TO_MARKETPLACE_CODE` ; un ISO valide hors des neuf marchés vaut INCONNU **sans drapeau** (c'est une limite d'INTERFACE, pas un défaut de donnée) et est compté dans `unknownCountByField.countryCode`. |
| **C-P3-5** | # 74 exige « code ISO existant » ; `Country.json` (249 entrées) **n'est pas** dans `REQUIRED_REFERENCE_FILES` et n'est donc pas chargé par l'application. | Le contexte accepte un `isoCountryCodes` optionnel : fourni, le contrôle est strict ; absent, il dégrade à la FORME (deux majuscules) et **le régime retenu est déclaré**. Exiger un fichier de plus au démarrage coûterait un aller réseau sur le chemin critique d'`EX-NFR-9` pour un contrôle que le schéma source fait déjà à la génération. |

---

## 3. Décisions d'implémentation

### 3.1 Lecture en flux, et décompression par RENIFLAGE (et non par en-tête)

Un `.gz` servi sur le réseau arrive de deux façons : brut (`application/octet-stream`, à
décompresser) ou déjà décodé par le navigateur (`Content-Encoding: gzip`). Le second cas dépend de
la configuration de l'hébergeur, **pas de nous**, et l'en-tête reste visible dans `Response.headers`
même quand le corps a été décodé : le lire ne tranche donc rien.

`ndjson.ts` **regarde les deux premiers octets** (`1f 8b`, RFC 1952) et ne branche
`DecompressionStream('gzip')` que s'ils sont là. Le chemin de code devient identique en `npm run dev`,
en `vite preview` et chez un hébergeur tiers. Prouvé par un test qui sert le même contenu des deux
façons et attend les mêmes lignes. Le plugin Vite, lui, sert les `.gz` **bruts, sans
`Content-Encoding`** — deuxième raison : le corps reste un flux, donc le découpage ligne à ligne
tient sans jamais matérialiser le fichier (budget ARB-55).

### 3.2 `sha256` : vérifié sur `dev`, déclaré partout

`crypto.subtle.digest` **n'a pas d'API incrémentale** : vérifier `manifest.sha256` impose de garder
le flux décompressé entier en mémoire. Sur `dev` (≈ 1,5 Mio) c'est indolore ; sur `test` (≈ 6 Mio)
et `perf` (≈ 30 Mio) ce serait doubler l'empreinte d'ouverture pour re-prouver à chaque démarrage
l'intégrité d'un fichier versionné, que git protège déjà. **Défaut : `verifySha256 = (profil ===
'dev')`**, et le régime retenu est écrit dans `coverageNote` — jamais implicite. Le hachage porte sur
les octets **non compressés** (`DATA-MODEL` §7-31). En cas d'écart : **refus d'ouverture**, aucune
ligne servie.

L'implémentation maison `src/types/sha256.ts` n'est pas employée ici : elle est **synchrone** et
prend une chaîne ; hacher plusieurs mégaoctets par elle bloquerait le fil principal.

### 3.3 Choix du snapshot

Par défaut, **le plus récent au sens de `capturedAt`** (jamais du nom de répertoire — voir C-P3-3) ;
`snapshotId` explicite sinon, et un identifiant demandé mais absent **échoue** au lieu de se replier
en silence sur un autre snapshot. Les trois snapshots d'un profil servent ainsi les écarts
d'effectif des recherches enregistrées.

L'index d'un profil (`<profil>/index.json`) est **servi tel quel** s'il existe et **synthétisé
sinon**, en lisant le `capturedAt` de chaque manifest — côté plugin Vite comme côté chargeur Node. Le
provider ne dépend donc pas d'un fichier que `dataset-gen` n'avait peut-être pas prévu.

### 3.4 Dédoublonnage indépendant de l'ordre (D3-15)

Trois critères **explicites**, dans l'ordre : (1) **complétude** — l'occurrence qui laisse le moins
de champs INCONNUS ; (2) **date de mise à jour** — `lastUpdatedAt` de la couche source, lue pour
l'arbitrage et **jamais stockée** (D3-11) ; (3) **signature stable** — départage déterministe.
`DUPLICATE_VALUE_CONFLICT` est posé sur l'occurrence CONSERVÉE, sur les quatre champs normatifs
d'`ARB-54` et sur eux seuls.

Prouvé par un chargeur qui rejoue **le même fichier à l'envers** : mêmes compteurs, mêmes agrégats.
Une règle « première occurrence » ne tiendrait pas ce test.

### 3.5 Ce que le provider ne sait pas faire, et le dit

`coverageNote` (chaîne, seul canal de l'interface v1) porte : la nature FICTIVE du jeu, le profil,
le snapshot, la graine ; le bilan d'ingestion (lues / retenues / rejetées / doublons arbitrés) ; la
**distribution mesurée** de `co2Source` (WLTP / NEDC / indéterminée) — la dette D8-32 devient ainsi
**chiffrée** au lieu d'être supposée ; les conditions hors vocabulaire de C-P3-1 ; le refus de
publier `coverageWarning` / `samplingBias` / `adTierDistribution` (propriétés de la SOURCE : les
inventer sur un jeu fictif décrirait un biais qui n'existe pas) ; le régime d'intégrité ; et, le cas
échéant, **l'avertissement de repli du registre**.

---

## 4. Registre et bascule — matrice

| `spec` | Source | `sourceKind` | Mode 2 | Câblé | Étiquette / motif |
|---|---|---|:--:|:--:|---|
| `fixture:test` **(défaut, D3-01)** | `data/fixtures/test` | `FIXTURE` | SERVED | oui | 3 × 20 000 annonces fictives |
| `fixture:dev` | `data/fixtures/dev` | `FIXTURE` | SERVED | oui | 3 × 5 000 — ouverture rapide, tests |
| `fixture:perf` | `data/fixtures/perf` | `FIXTURE` | SERVED | oui | 3 × 100 000 — non commité, à générer |
| `synthetic` | génération à la volée | `SYNTHETIC` | SERVED | oui | bancs et repli mode 2 (D3-04) |
| `tweedehands` | 2dehands | `REAL` | **UNAVAILABLE** | **non** | **D-18 / DR-104 : interdit tant qu'`AC-01` n'est pas levée** |

Priorité : `?provider=` **>** `VITE_KYCAR_PROVIDER` **>** défaut. Le paramètre d'URL l'emporte parce
qu'il est le seul qui se partage dans un lien.

**Un refus n'est jamais muet** : spécification inconnue ou non câblée → repli sur le défaut **et**
avertissement écrit dans `coverageWarning`, qui atterrit dans la `coverageNote` du snapshot — le
chemin que la coquille affiche déjà. D-03 appliqué à la sélection de source, **sans aucune retouche
d'`app.tsx`**.

Le `mode2Fallback` synthétique de `main.tsx` est **conservé tel quel**.

---

## 5. `ca` (D3-07) — sonde rouge → verte

**Décision ratifiée le 2026-09-09**, portée ici comme la mission le demande (et non par
`mvp-integrate`). Sonde écrite **d'abord**, rouge sur le code de la phase 2.9 :

```
tests/review/D2/marketplace-ca.test.ts   → 5 échecs / 6 (avant), 6 / 6 (après), sonde INCHANGÉE
```

- `MARKETPLACE_VALUES` porte `ca` (Canada) en 9ᵉ position ; `UNKNOWN_9` disparaît.
- **L'ordre des huit premiers codes est intangible** : la colonne `countryCode` stocke l'INDEX du
  code, et renuméroter un code déjà servi réinterpréterait silencieusement toute ligne déjà encodée.
  `ca` prend exactement la place qu'occupait le code réservé.
- `MARKETPLACE_CODE_TO_ISO` gagne `ca → CA` (`EX-DATA-40`).
- `MARKETPLACE_UNMAPPED` devient **inatteignable** pour les neuf codes connus ; le drapeau est
  conservé comme garde de régression pour un adaptateur de source réelle.
- R-D2-21c **relit l'OpenAPI du dépôt** et vérifie que l'énumération porte bien les neuf codes dont
  `ca` : la preuve est exécutable, pas seulement citée.
- Sonde préexistante corrigée **avec justification écrite dans le test**
  (`tests/review/D2/open-points.test.ts`, ADV-15) : elle figeait un ÉTAT DE CONNAISSANCE (« la 9ᵉ
  n'est pas identifiée »), pas une exigence. Les faits MESURÉS sont tous conservés — cardinalité 9,
  ordre des huit premiers, « le 9ᵉ code n'est pas deviné » — une **preuve remplace une réserve**.

**État de D3-07 après ce lot : APPLIQUÉ** (vocabulaire, table de traduction, sondes). Reste hors de
mon périmètre : la mise à jour de l'énoncé `EX-DATA-40` dans `draft-data-dictionary.md`, qui
mentionne encore « 9ᵉ valeur non identifiée » (documentation, pas code).

---

## 6. `BOOLEAN_FLAG_BIT` (D3-10) — table

Les dix booléens de l'écart **E-07** tiennent **exactement** dans les 16 bits de `booleanFlags`,
alloués depuis la phase 2.3 et jusqu'ici remplis de zéros. **Aucune modification de l'interface
gelée.** Table définie dans `src/types/vocabularies.ts` (source unique du couple bit ↔ champ, comme
`INGEST_FLAG_BIT`), remplie par l'adaptateur.

| Bit(s) | Code | Champ | Nature | Absent vaut |
|---|---|--:|---|---|
| 0 | `priceOnRequestOnly` | 9 | défaut | `false` |
| 1 | `isSuperDeal` | 12 | défaut | `false` |
| 2 | `isNewListing` | 29 | défaut | `false` |
| 3 | `hasVideo` | 81 | défaut | `false` |
| 4 / 5 | `hadAccident` | 27 | tri-état (valeur / connu) | **INCONNU** |
| 6 / 7 | `isPluginHybrid` | 46 | tri-état | **INCONNU** |
| 8 / 9 | `hasParticleFilter` | 58 | tri-état | **INCONNU** |
| 10 / 11 | `hasFullServiceHistory` | 61 | tri-état | **INCONNU** |
| 12 / 13 | `wasCabOrRental` | 63 | tri-état | **INCONNU** |
| 14 / 15 | `isMetallic` | 68 | tri-état | **INCONNU** |

`4 × 1 + 6 × 2 = 16` bits. L'allocation est **calculée** depuis la liste (elle ne peut pas diverger
d'elle-même) et une erreur est levée à la construction si le compte change. `setBooleanFlag` /
`readBooleanFlag` remplacent tout décalage littéral. Sondes : R-D2-22, 22b, 22c (non-chevauchement,
capacité, trois états distincts) et un cas de contrat qui vérifie que le provider **remplit
réellement** la colonne et qu'aucun tri-état ne perd son état « inconnu ».

---

## 7. Suite de contrat — cas × providers

`npm run test:contract` (`tsconfig.contract.json` + `vitest.contract.config.ts`) — **50 cas verts**.

| Cas | synthetic | fixture | tweedehands (mock) |
|---|:--:|:--:|:--:|
| `describe()` complet, nature de source valide | ✅ | ✅ | ✅ |
| mode 2 **annoncé** = mode 2 **servi** (`servesMode2` ne ment pas) | ✅ SERVED | ✅ SERVED | ✅ UNAVAILABLE + motif |
| descripteur sincère (`rejectedCount` = Σ motifs, compteurs ≤ effectif) | ✅ | ✅ | ✅ |
| `coverageNote` présente sur une source fabriquée | ✅ | ✅ | n/a (REAL) |
| R3 : descripteur, agrégats, colonnes du lot | ✅ | ✅ | ✅ |
| R3 structurelle : le schéma colonnaire n'a aucune colonne interdite | ✅ (global) | | |
| I1 — Σ effectifs de marque = effectif | ✅ | ✅ | ✅ |
| I2 — Σ modèles = effectif de la marque (dans la portée d'une marque) | ✅ | ✅ | ✅ |
| I3 … I8 sur les sorties RÉELLES du moteur, alimentées par le lot | ✅ | ✅ | n/a (pas de lot) |
| sélection vide : aucun filtre non appliqué | ✅ | ✅ | ✅ |
| filtre inconnu **déclaré** (D-03), effectif jamais présenté comme filtré | ✅ | ✅ | ✅ |
| D-33 : `fetchSelectionCount` = `fetchAggregates` | ✅ | ✅ | **C-P3-2 (dette)** |
| effectif = somme des effectifs d'agrégat | ✅ | ✅ | ✅ |
| baseline = `fetchAggregates` sans filtre, et précalculée | ✅ | ✅ | ✅ |
| déterminisme : deux ouvertures indépendantes | | ✅ | |
| D3-15 : fichier rejoué **à l'envers**, mêmes résultats | | ✅ | |
| snapshot explicite servi, identifiant inconnu refusé | | ✅ | |
| rejets comptés **par motif** (6 motifs, 1 ligne saine servie) | | ✅ | |
| `booleanFlags` réellement rempli, tri-états préservés | | ✅ | |
| budgets mesurés (ouverture, mémoire, recalcul p95) | | ✅ | |

### C-P3-2 — dette écrite, hors périmètre

Sur un provider **`AGGREGATE_SURFACE`** (2dehands), `fetchSelectionCount` et `fetchAggregates` ne
comptent pas la même chose et **rien dans l'interface ne le dit** :

- **sélection vide** — le compteur rend l'effectif exhaustif de la surface (`totalResultCount` de la
  racine : 100 188 sur la fixture) tandis que les agrégats somment l'univers de marques **borné**
  (13 320). L'écart est légitime (l'univers borné est une politique opérationnelle assumée), mais
  `unsupportedFilterIds` est vide — la sélection l'étant — donc **aucun signal** n'indique que les
  deux chiffres ne sont pas comparables ;
- **filtre de classe R** (`priceFrom=5000`) — le compteur applique le prédicat résiduel à
  l'ÉCHANTILLON de page (**1**) là où les agrégats publient l'effectif de la SURFACE (**3**) : le
  « N offres » affiché tombe **sous** la somme des barres, la direction indéfendable.

Le correctif appartient à `src/providers/tweedehands`, hors de mon périmètre. La sonde est écrite en
**`it.fails` ANNOTÉ** (jamais `skip`, convention du dépôt) : le jour où la divergence est corrigée,
elle vire au rouge et force le retrait de l'annotation.

### Mini-jeu, en attendant `data/fixtures/`

`tests/contract/fixtures/mini.ts` écrit, **hors du dépôt** (répertoire temporaire du système : un
artefact binaire régénérable n'a rien à faire dans git, et l'écrire hors de l'arbre supprime tout
risque de commit accidentel), un profil `dev` de trois snapshots : deux conformes de 201 lignes
(dont un doublon d'identifiant délibéré, divergent sur le prix et moins complet) et un
**délibérément sale** (une ligne par motif de rejet). Le sujet de contrat sert le **vrai**
`data/fixtures/dev` dès qu'il existe dans l'arbre, et **le dit** dans chaque mesure.

---

## 8. Mesures

| Mesure | Valeur | Objet mesuré | Budget |
|---|---|---|---|
| Ouverture d'un snapshot | **34 ms** | mini-jeu, 201 lignes, sha256 vérifié | < 2 000 ms (S4) — **tenu, à revérifier sur le jeu réel** |
| Empreinte du lot colonnaire | **240,5 o/ligne** (200 lignes, 47,0 Kio) | `batchByteLength` | < 250 o/ligne (lecture d'`EX-NFR-3` en mémoire) — **tenu, mais serré** |
| Empreinte extrapolée | ≈ **4,8 Mo** à 20 000 lignes ; ≈ **24 Mo** à 100 000 | linéaire par construction | enveloppe ARB-55 (274 Mo à 10⁶) — large |
| Recalcul moteur | médiane **2,5 ms**, **p95 3,9 ms** (30 rejeux) | `AggregationDataset.recalculate` sur le lot fixture | `EX-NFR-5` ≤ 200 ms p95 — **tenu, sur 200 lignes seulement** |
| Fichier gzip | 90,4 o/ligne sur 201 lignes | mini-jeu | **NON opposable** à `EX-NFR-3` (60 o/ligne calibrés sur 100 000) : la fenêtre de gzip n'a rien à réutiliser sur 200 lignes. Mesuré et **dit**, jamais opposé |
| Bundle initial | **129,15 Kio gzip** (base mesurée au point de branche : **116,58**) → **+12,57 Kio** | `npm run size` | ≤ 300 Kio — **tenu (43 %)** |

**Sur le bundle** : les +12,57 Kio gzip sont l'adaptateur as24, le provider de fixtures et le
registre, tous sur le chemin initial puisque `fixture:test` est la source par défaut. Les **fichiers
de fixtures**, eux, ne sont pas du bundle : ils sont servis en statique sous `/fixtures` (dev) et
copiés dans `dist/fixtures` au build, hors du graphe du manifest — `npm run size` ne les voit pas,
et c'est correct.

**Honnêteté des mesures** : toutes portent sur le **mini-jeu de 201 lignes**, faute de
`data/fixtures/` dans ce worktree. Elles prouvent que le chemin fonctionne et donnent un ordre de
grandeur ; elles ne prouvent PAS les budgets à l'échelle. **À rejouer sur `data/fixtures/dev` et
`test` dès la fusion** (le protocole convenu avec le coordinateur) ; la suite les recalcule et les
imprime automatiquement, en nommant le jeu servi.

---

## 9. Points hors périmètre — à la charge de `mvp-integrate` (3.5)

| # | Point | Pourquoi c'est hors de mon périmètre |
|--:|---|---|
| **1** | **`sourceKind = 'FIXTURE'` n'est étiqueté nulle part dans l'UI.** `MentionsPage` ne nomme que `REAL` et `SYNTHETIC` (un snapshot FIXTURE n'affiche donc **aucune** phrase de provenance) ; la bannière d'`app.tsx` ne réagit qu'à `SYNTHETIC` ; `csv-export.ts` écrit la valeur brute. **Bloquant avant de livrer avec le provider fixture par défaut** : `EX-DATA-107` exige que l'utilisateur ne confonde pas les natures. | `src/app.tsx` et `src/screens` : écriture interdite par la mission. |
| **2** | `P1_EXPECTED` / `P2_EXPECTED` des E2E à recalculer sur le profil `test` (D3-17b), depuis les **valeurs du manifest**, jamais des chiffres relevés à la main. | `tests/e2e` hors périmètre ; dépend des fixtures réelles. |
| **3** | Deux **élargissements de TYPE** que j'ai dû faire pour que le type-check passe, sans aucun changement de comportement : `StartResult.sourceKind` et `Mode2Payload.sourceKind` (`data-controller.ts`) et `MentionsPageProps.sourceKind` **recopiaient** l'union `SourceKind` au lieu de la référencer. Ils la référencent désormais. À relire à la fusion. | Trespass minimal assumé et signalé ; sans lui, `npm run build` ne pouvait pas passer dans ce worktree. |
| **4** | `EX-DATA-40` (`draft-data-dictionary.md`) énonce encore « 9ᵉ valeur non identifiée » : à aligner sur D3-07. | Documentation d'exigences, hors périmètre. |
| **5** | C-P3-2 (divergence `fetchSelectionCount` / `fetchAggregates` sur 2dehands). | `src/providers/tweedehands` hors périmètre. |
| **6** | C-P3-3 (deux formes de `snapshotId`) : à trancher entre `data-model` et `dataset-design`. | Décision de coordinateur. |
| **7** | **C-P3-6 — `npm run lint` est ROUGE sur la branche, avant mon premier commit** : `data/schema/validate.mjs` (livrable `data-model` de la phase 3.1, commit `533eae8`) déclenche 5 × `no-undef` sur `process`, le fichier n'étant couvert par aucun bloc `languageOptions.globals` de `eslint.config.js`. Remède d'une ligne, au choix de son propriétaire : ajouter `data/**/*.mjs` au bloc Node de `eslint.config.js`, ou une directive `/* global process */` en tête du script. **Non corrigé ici** : `data/schema/` et `eslint.config.js` sont hors de mon périmètre, et `eslint.config.js` est une infrastructure partagée que `data-fix` peut avoir à toucher. Vérifié préexistant : le fichier est inchangé dans mes cinq commits. | `data/schema/` et `eslint.config.js` hors périmètre. |
| **8** | `data/fixtures/` absent de ce worktree : la suite de contrat tourne sur le mini-jeu. **À rejouer** sur le jeu réel à la fusion, et les mesures du §8 à reprendre. | Livrable de `dataset-gen` (3.2). |

---

## 10. Hypothèses écrites comme hypothèses (E4)

- **H-P3-1** — Le cinquième champ textuel du lot (`trimTokens`) est sérialisé en **jetons séparés par
  une espace**. Aucune convention n'existait : `generate.ts` y écrit la chaîne vide. Le choix est
  réversible par un `split(' ')` (les jetons sont en majuscules et issus d'une découpe SUR l'espace,
  donc aucun n'en contient), mais il n'est **pas** normé par le dictionnaire. À confirmer si un
  écran vient à lire ce champ.
- **H-P3-2** — Le repli `EX-DATA-10` (`FUEL_TYPE_TO_CATEGORY`) est construit sur les **libellés** de
  `references/FuelType.json` et `FuelCategory.json` (« Diesel » → `D`, « Gaz naturel H/L » → `C`…).
  Les types 14 (« Vegetable oil ») et 15 (« Biogas ») restent **hors table**, donc INCONNUS : `O`
  (« Autres ») serait un fourre-tout choisi par nous, pas une donnée de la source.
- **H-P3-3** — Le seuil de divergence du fallback (`FALLBACK_VALUE_DIVERGENT`, §7-17) est une
  égalité **stricte à 1e-9** près. La contrainte dit « exactement la valeur retenue » ; la tolérance
  ne couvre que le codage flottant.
- **H-P3-4** — L'ouverture conserve le lot après `closeSnapshot` (idempotente, rien libéré) :
  `EX-NAV-23` ne demande qu'UN snapshot actif, pas sa destruction à la fermeture d'un écran, et le
  rouvrir coûterait une relecture complète du fichier.


---

## 11. Finalisation sur fixtures réelles (après la porte G9a)

Branche de session fusionnée dans le worktree (`c973a6e`, sans conflit) : `data/fixtures/dev` et
`data/fixtures/test` sont là, trois snapshots chacun. **La suite de contrat est passée du premier
coup sur le jeu réel** — le sujet `fixture` sert automatiquement `data/fixtures/dev` dès qu'il
existe, et nomme le jeu servi dans chaque mesure.

### 11.1 Mesures

| Mesure | Profil `dev` (3 × 5 000) | Profil `test` (3 × 20 000, **source par défaut D3-01**) | Budget |
|---|---|---|---|
| Ouverture d'un snapshot | **494 ms** (sha256 **vérifié**) | **1 861 ms** (sha256 non vérifié, hors `dev`) | < 2 000 ms (S4) — tenu, **sans marge sur `test`** → **C-P3-14** |
| Annonces | 5 000 annoncées → **4 995 servies** (5 doublons arbitrés) | 20 000 → **19 980** (20 doublons) | — |
| Lot colonnaire | 1 059 Kio, **217,2 o/ligne** | **4,14 Mio**, 217,2 o/ligne | < 250 o/ligne — tenu |
| Mémoire extrapolée (ARB-55) | — | **207 Mio à 10⁶ lignes** | enveloppe 274 Mio — tenu |
| Recalcul **filtré** (`EX-NFR-5` : « application d'un filtre ») | — | médiane **12,1 ms**, **p95 15,4 ms** | ≤ 200 ms p95 — **tenu, large** |
| Recalcul **Σ** (sélection entière, pire cas, hors `EX-NFR-5`) | médiane 39 ms, p95 56 ms | médiane **171 ms**, **p95 194 ms** | — → **C-P3-15** |
| Fichier gzip | 682 Kio / snapshot | **2 677 Kio** / snapshot, **137 o/ligne** | `EX-NFR-3` : 60 o/ligne à 100 000 — **non comparable à 20 000** (la fenêtre gzip travaille mieux à volume élevé) ; le budget commité de 8 Mio pour les trois snapshots `test` est tenu (7,79 Mio ; `dev` 1,99 Mio) |
| Bundle initial | **129,51 / 300 Kio gzip** | idem | tenu (43 %) |

**Deux optimisations faites en réponse aux mesures**, toutes deux sans changement de sémantique :

1. **Découpage des lignes par curseur** (`ndjson.ts`) : le tampon était réaffecté à chaque ligne
   (`pending = pending.slice(nl + 1)`), donc la fin du morceau était recopiée autant de fois qu'il
   contenait de lignes — un coût **quadratique** dans un morceau de 64 Kio qui en porte deux cents.
   Un index remplace les `slice` ; la queue incomplète n'est recopiée qu'une fois par morceau.
2. **Chemins rapides de normalisation** : `normalizeText` rend la chaîne telle quelle quand elle est
   déjà normalisée au sens d'`EX-DATA-7` (imprimables ASCII, sans espace de bord ni espace double —
   NFC est l'identité sur l'ASCII) ; `normalizeListingUrl` évite de construire un objet `URL` quand
   l'adresse est un `https` sans requête ni fragment, cas où le nettoyage EST l'identité. Ces deux
   chemins sont **stricts** : au moindre doute, la chaîne repasse par le traitement complet.

Ouverture du profil `test` : **2 112 ms → 1 861 ms**. Répartition mesurée du coût d'ouverture à
20 000 lignes : ingestion **2 319 ms** (dont `JSON.parse` 593 ms, adaptation ≈ 900 ms, flux et
décompression ≈ 800 ms), assemblage colonnaire **64 ms**, identifiants **10 ms**, baseline **12 ms**.
Différer la zone de chaînes (garde-fou 2 de §9.3) ne rapporterait donc rien ici : **tout le coût est
dans l'ingestion**, et l'assemblage — zone de chaînes comprise — pèse 3 % du total.

**Troisième optimisation, sur le chemin critique d'`EX-NFR-9`** : `manifest.json` du profil `test`
pèse **501 Kio**, dont **1,3 Kio** intéressent l'application — les 2 436 anomalies de `groundTruth`
sont le document du reviewer et des sondes, jamais lu par l'application. Le plugin Vite écrit
désormais un `manifest.min.json` (le manifest sans sa vérité terrain, `groundTruth` **vidé et non
retiré**, pour rester conforme au schéma, avec une note qui dit où trouver le complet) et le chargeur
HTTP le demande **en premier**, avec repli sur `manifest.json`. **501 Kio → 1,46 Kio** avant la
première ligne d'annonces. `generation.json` (provenance du générateur) n'est plus copié dans `dist/`.

### 11.2 Vérité terrain : les 27 codes d'anomalie confrontés

`tests/contract/ground-truth.test.ts` — **31 cas, verts**. Elle lit le manifest du snapshot le plus
récent de `dev` (612 anomalies déclarées, 27 codes), retrouve **chaque annonce citée** dans le
NDJSON, l'adapte et confronte le résultat à une **attente écrite pour chacun des 27 codes**. Un code
sans attente, ou une attente sans code, fait échouer le test de complétude : la couverture ne peut
pas se dégrader en silence quand `dataset-gen` fait évoluer sa liste.

| Classe | Codes | Résultat |
|---|---|---|
| **Drapeau `KYCAR_INGEST_FLAG` posé** (11) | `PRICE_SENTINEL_ABSOLUTE`, `PRICE_OUT_OF_RANGE`, `PRICE_MISSING_UNDECLARED`, `PRICE_ON_REQUEST_WITH_AMOUNT`, `MILEAGE_OUT_OF_RANGE`, `SUSPECT_ZERO_MILEAGE`, `POWER_UNIT_MISMATCH`, `UNIT_UNSUPPORTED`, `FIRST_REG_OUT_OF_RANGE`, `MODEL_UNRESOLVED`, `VERSION_FULLY_STRIPPED` | **conformes** (réserve C-P3-11 sur le dernier) |
| **Signalement hors vocabulaire** (C-P3-1) (4) | `CO2_ZERO_NON_BEV`, `HYBRID_INCONSISTENT`, `HYBRID_CATEGORY_UNRESOLVED`, `MILEAGE_IMPLAUSIBLE_FOR_AGE` | **conformes** (réserves C-P3-9) |
| **Valeur canonique** (3) | `PRICE_ON_REQUEST` (statut), `REGION_UNRESOLVED` (région inconnue), `OTHER` (complétude) | **conformes** (réserve C-P3-13) |
| **Étage SNAPSHOT** (3) | `DUPLICATE_LISTING_ID` (5 déclarés = 5 mesurés), `DUPLICATE_VALUE_CONFLICT`, `CROSS_SELLER_DUPLICATE` | **mesurés** (réserve C-P3-10) |
| **Étage MOTEUR, aucun drapeau attendu** (4) | `OUTLIER_M1_LOW/HIGH`, `OUTLIER_M2_LOW/HIGH` | **conformes** |
| **Sans conséquence canonique, assumé** (2) | `VERSION_AMBIGUOUS`, `POWER_OUT_OF_RANGE` | **constatés** (C-P3-7, C-P3-12) |

**Deux défauts de l'adaptateur trouvés et corrigés par cette confrontation** — c'est ce qu'on
attendait d'elle :

- **`HYBRID_CATEGORY_UNRESOLVED` ne se posait pas** sur une hybride rechargeable dont
  `fuelCategory` est absente et `primaryFuelType` connu : le repli d'`EX-DATA-10` résolvait la
  catégorie à `B` (« Essence ») depuis le carburant **thermique**, et signalait ensuite une
  incohérence. C'était **faux** : `EX-DATA-11` déclare précisément ce cas non résoluble, et une
  hybride rechargeable classée « Essence » l'aurait été dans **tous** les filtres et **toutes** les
  distributions. Le repli est désormais bloqué quand `isPluginHybrid` est vrai, et la catégorie
  reste INCONNUE avec son signalement.
- **`HYBRID_INCONSISTENT` était posé en même temps** que `HYBRID_CATEGORY_UNRESOLVED` : §7-19 vise
  une catégorie qui **contredit**, pas une catégorie **absente**. La même annonce était comptée dans
  deux diagnostics distincts. Corrigé, avec un cas unitaire.

### 11.3 Constats supplémentaires (tous quantifiés par une sonde verte)

| Réf. | Constat | Chiffre mesuré | Pour |
|---|---|---|---|
| **C-P3-7** | `POWER_OUT_OF_RANGE` est **inatteignable depuis une ligne conforme au schéma** : `as24-listing.schema.json` borne `power` à 1..9 999 et l'annexe A valide **le même domaine, bornes incluses**. Même classe que `FIRST_REG_UNPARSEABLE` (C-07) et D3-16. | 3 anomalies déclarées, valeurs injectées 9 999, 1, 1 — **toutes dans le domaine** | `data-review` / `dataset-design` |
| **C-P3-8** | `PRICE_ON_REQUEST_WITH_AMOUNT` : le manifest déclare `expected.status = ON_REQUEST` ; `EX-DATA-32` et le champ # 8 disent **`QUOTED` + drapeau**. L'adaptateur suit le dictionnaire, qui est normatif. | 2 annonces | `data-review` |
| **C-P3-9** | `MILEAGE_IMPLAUSIBLE_FOR_AGE`, deux réserves : (a) au-delà de la borne dure de # 59 le kilométrage devient INCONNU **d'abord** (ordre d'`EX-DATA-2`) et le signal devient `MILEAGE_OUT_OF_RANGE` — l'anomalie n'est pas perdue, elle **change de nom** ; (b) §7-22 ne borne **que le haut**, donc la forme « kilométrage trop faible pour l'âge » n'a **aucune** conséquence canonique. | 15 déclarées : **4** signalées, **9** absorbées, **2** sans conséquence | `data-review` |
| **C-P3-10** | `DUPLICATE_VALUE_CONFLICT` : le générateur l'emploie pour une **republication intra-vendeur** (deux identifiants **différents**, même `dealerBucket`) alors qu'`ARB-54` le réserve à une divergence entre deux occurrences du **même** identifiant. Un nom, deux notions disjointes. | 13 déclarées | `data-review` |
| **C-P3-11** | **La liste d'arrêt d'`EX-DATA-30` n'est chargée par AUCUN des deux chargeurs de référentiels** : ni `reference-loader.ts` (navigateur) ni `reference-fs.ts` (Node) ne lisent `data/reference/version-stoplist.json` ni `version-lexicon.json`, pourtant versionnés. L'**étape 3** du pipeline `EX-DATA-29` est donc **inerte dans toute l'application** — et avec elle la **deuxième barrière R3** sur le seul texte libre conservé (`tel `, `@`, `www.`… ne sont retirés de nulle part). Aucune fuite R3 **aujourd'hui** : les fixtures sont propres par construction (§7-29) ; le risque est pour une source réelle. | 5 des 20 `VERSION_FULLY_STRIPPED` non dépouillées (« `--- PROMO ---` » → « `PROMO` ») ; `versionStoplist = []`, `versionDriveBadges = []` | **`mvp-integrate` / D8** — remède : ajouter les deux fichiers à `RawReferenceInputs` dans les deux chargeurs |
| **C-P3-12** | Quatre `VERSION_AMBIGUOUS` déclarées ont **perdu leur version** : le modèle de valeurs manquantes a retiré `modelVersion` **après** l'injection. `DATASET-SPEC` §6 exige que toute anomalie déclarée soit **retrouvable**. | 55 déclarées : **51** retrouvables, **4** effacées | `data-review` |
| **C-P3-13** | `REGION_UNRESOLVED` recouvre **deux situations que la table §3.1 sépare** : préfixe hors des 13 plages belges → INCONNU **+ drapeau** ; pays ≠ BE → INCONNU **sans drapeau** (`EX-DATA-55`), parce qu'une annonce néerlandaise n'a pas une région belge « non résolue », elle n'en a pas. | 23 déclarées : **20** par préfixe, **3** par pays | `data-review` |
| **C-P3-14** | **L'ouverture du profil `test` — la source par DÉFAUT — tient le budget de 2 s sans marge** (1 861 ms mesurées, 93 % du budget), sur une machine sans charge concurrente. Le coût est l'**ingestion** (2 319 ms bruts) : décompression, `JSON.parse`, adaptation de 20 000 lignes. Deux leviers restent, hors de ce lot : porter l'ingestion dans le **Web Worker** (elle bloque aujourd'hui le fil principal), ou précalculer la **baseline** à la génération (`EX-DATA-109` l'autorise explicitement : « agrégats précalculés et persistés avec le snapshot »). L'assertion de la sonde est posée à 2 500 ms — garde-fou de **non-régression**, et elle le dit ; le budget lui-même est confronté par la mesure imprimée. | 1 861 / 2 000 ms | **coordinateur** (arbitrage d'architecture) |
| **C-P3-15** | Le recalcul de la **sélection entière** (pire cas, premier affichage) coûte **p95 194 ms** à 20 000 lignes, au ras des 200 ms d'`EX-NFR-5`. Ce n'est **pas** le cas visé par `EX-NFR-5` — qui parle de « l'application d'un filtre », mesurée à **p95 15,4 ms** — mais c'est le chemin du premier affichage, et il n'a plus de marge à 20 000 lignes. | Σ p95 **194 ms** · filtré p95 **15,4 ms** | **coordinateur** / `acceptance` |

### 11.4 C-P3-3 tranché

Les fixtures livrées portent **`be-YYYYMMDDTHHmmssZ`**, la forme imposée par
`snapshot-manifest.schema.json` — c'est le contrat validé, et c'est celui que le générateur a suivi.
La ligne `snapshotIdPattern` de `docs/data/dataset-spec/profiles.json`
(`be-fixture-<profil>-<AAAAMMJJ>-<graine hex 8>`) est donc **une documentation à corriger, pas une
seconde convention**. Une sonde le CONSTATE sur les six snapshots réels (dev + test) et vérifie de
surcroît que **le nom du répertoire est l'identifiant** — ce qui permet à l'un de servir de clé de
l'autre. Le provider, lui, continue de ne **jamais interpréter** l'identifiant (l'interface le
déclare opaque) et d'ordonner les snapshots par `capturedAt` : l'arbitrage ne crée aucune dépendance
nouvelle. **Correction documentaire à la charge de `dataset-design` / `data-review`.**

### 11.5 Le mini-jeu est CONSERVÉ, et réduit à son rôle

Le sujet de contrat et l'épreuve d'indépendance à l'ordre (D3-15) tournent désormais sur le **jeu
réel** — 5 000 lignes, 5 doublons d'identifiant et 40 doublons inter-vendeurs éprouvent l'arbitrage
bien mieux que 201 lignes fabriquées.

Le mini-jeu reste, pour une raison que le jeu réel ne peut pas couvrir : le générateur garantit
**100 % de lignes conformes au schéma** (critère S2 de 3.2), donc **aucun fichier réel ne peut
exercer les chemins de REJET de l'ingestion**. Or ce sont eux qui protègent R3 et l'interface —
`R3_FORBIDDEN_FIELD`, `LISTING_URL_INVALID` (`EX-DATA-14`), `LISTING_ID_INVALID`,
`VEHICLE_TYPE_NOT_CAR`, `MAKE_UNKNOWN`, et la ligne de JSON tronquée que le provider doit **compter
sans s'arrêter**. Le mini-jeu est le seul porteur de ces six cas, et le seul dont je maîtrise le
`sha256` du manifest (donc le seul qui puisse éprouver la garde d'intégrité). Il est conservé, et son
en-tête dit désormais exactement pourquoi.

### 11.6 `describe()` sincère sur le profil `test`

Deux corrections de sincérité, vérifiées par la suite :

- **`mode2.maxSampleSize`** ne vaut plus `null` (« pas de plafond imposé par la source ») une fois le
  snapshot ouvert : il vaut l'effectif **réellement servi**, lu du jeu (19 980 sur `test`).
  `EX-DATA-112` dimensionne la mémoire sur ce chiffre ; annoncer « illimité » sur un jeu fini serait
  une valeur fabriquée. Tant qu'aucun snapshot n'est ouvert, le plafond est **inconnu** et vaut
  `null` — ce qui est vrai.
- **`providerVersion`** vaut `kycar-dataset-gen@1.0.0`, lu du manifest : c'est le **générateur** qui
  a produit le fichier, pas ce provider (`EX-DATA-106`, traçabilité).
- **`coverageNote`** porte désormais les tailles **annoncées au manifest** — annonces annoncées et
  servies, couverture d'échantillon, Mio non compressés et gzip, nombre d'anomalies déclarées —
  jamais des estimations.
