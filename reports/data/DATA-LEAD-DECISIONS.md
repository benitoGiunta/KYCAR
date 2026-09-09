# Décisions du coordinateur — Plan 3 (données fictives AutoScout24-conformes)

Format identique à `reports/remediation-2.8/FIX-LEAD-DECISIONS-2.8.md`. Une ligne par décision,
datée, motivée ; les agents citent l'identifiant D3-nn.

| # | Date | Sujet | Décision |
|---|---|---|---|
| D3-00 | 2026-09-09 | Source de données du MVP | **Données fictives** à la forme AutoScout24 (décision du commanditaire) ; l'accès réel est reporté (`docs/research/AUTOSCOUT24-PROVIDER-OPTIONS.md`). Plan : `docs/plans/PLAN-3-fixture-data-mvp.md`. |
| D3-01 | 2026-09-09 | Profil par défaut | L'application charge `fixture:test` (3 snapshots × 20 000) ; `dev` (5 000) pour les tests rapides, `perf` (100 000, non commité) pour les bancs. |
| D3-02 | 2026-09-09 | Identité vendeur (R3) | Aucun champ identifiant dans la couche source ni canonique. Admis : `sellerType` (PRO/PRIVATE) et `dealerBucket`, clé pseudonyme non réversible (hachage salé d'un identifiant fictif), nécessaire aux doublons inter-vendeurs et au biais publicitaire. |
| D3-03 | 2026-09-09 | Format des fixtures | NDJSON + gzip, un fichier par snapshot, `manifest.json` (seed, schéma, compte, hachage, vérité terrain). Parquet écarté (dépendance navigateur). |
| D3-04 | 2026-09-09 | Sort du provider synthétique | Conservé pour les bancs ; le générateur de fixtures réutilise `prng`, `catalog`, `popularity` en lecture et écrit la forme AS24. |
| D3-05 | 2026-09-09 | Chantier 2.10 en parallèle | La finition visuelle (dette D8-43) court en worktree `fix210/visual` pendant 3.1–3.4, fusionnée à 3.5. |
| D3-06 | 2026-09-09 | Localisation dans la couche source (data-model) | **Ratifié** : ni code postal exact ni ville dans `As24Listing` ; `location.postalCodePrefix2` (deux chiffres) + pays suffisent aux 13 plages `EX-DATA-52` (toutes sur un multiple de 100). R3 prime sur la formulation initiale de la mission. `dataset-design` aligne sa géographie sur le préfixe. |
| D3-07 | 2026-09-09 | 9ᵉ valeur de `KYCAR_MARKETPLACE` (C-01) | **Ratifié** : `ca` (prouvé par l'OpenAPI du dépôt) remplace `UNKNOWN_9` ; correction du vocabulaire (`src/types/vocabularies.ts`) et de `EX-DATA-40` portée par `mvp-integrate` (3.5), avec sonde D2 rouge d'abord ; aucune fixture ne l'utilise (`marketplace = be`). |
| D3-08 | 2026-09-09 | `measurementSource` (WLTP/NEDC/UNKNOWN) dans `ListingColumnBatch` (C-03) | **Statu quo déclaré en v1** : interface gelée ; la couche source porte les trois branches (schéma `dependentSchemas`), l'adaptateur les résume en `co2Source` canonique dès que la v2 de l'interface ouvre la colonne. Motif de la dette D8-32 réécrit : « colonne absente de l'interface v1 », plus « donnée absente ». |
| D3-09 | 2026-09-09 | Exclusion `efficiencyClass` ↔ NEDC (découverte data-model) | **Ratifié** : contrainte encodée dans le schéma ; `dataset-design` la respecte (une annonce WLTP n'a pas d'`efficiencyClass`, une NEDC peut en avoir une). |
| D3-10 | 2026-09-09 | `BOOLEAN_FLAG_BIT` (E-07 : 10 booléens du dictionnaire dans les 16 bits de `booleanFlags`, déjà alloués, jamais remplis) | **Ratifié** : table bit↔champ définie dans `src/types` (4 × 1 bit avec défaut + 6 × 2 bits tri-état) par `fixture-provider` (3.3), qui la remplit à l'ingestion ; sonde de contrat. Sans changement de signature. |
| D3-11 | 2026-09-09 | Date de publication canonique | **Pas en v1** : `publishedAt`/`updatedAt` restent dans la couche source et le manifest (deltas inter-snapshots) ; le canonique n'en a pas besoin pour les écrans actuels. À rouvrir si une exigence de « fraîcheur d'annonce » apparaît. |
| D3-12 | 2026-09-09 | Garde R3 `EX-DATA-49` étendue à `data/` | Si étendue : exclure `data/schema/examples/invalid-*.json` par nom et balayer le **vocabulaire d'instance**, jamais les mots-clés du méta-schéma (`description` est un mot-clé JSON Schema). À la charge de `data-review`. |
