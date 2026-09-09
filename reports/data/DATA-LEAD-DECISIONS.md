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
