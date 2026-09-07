# probe-LOT-E — Code tiers, pipelines en production et collecte côté client

**Agent** : `probe-E` (phase 1.4 du `PLAN-1-data-acquisition.md`) — Opus, effort high.
**Candidats instruits** : `C-70`, `C-64`, `C-65`, `C-61`, `C-62`, `C-60` *(6)*.
**Date d'exécution** : 2026-09-07.
**Nature du lot** : instruction de **code déjà en production écrit par des tiers**. Le lot ne mesure
pas ce que KYCAR pourrait faire ; il lit ce que d'autres ont réussi à faire tenir, et ce qui casse
chez eux. Aucun test de ce lot ne touche `www.autoscout24.be` ni `www.autoscout24.com` (contrainte E5).

**Conventions de preuve** : `[PROUVÉ]` = sortie de commande ou réponse HTTP journalisée ci-dessous.
`[DOCUMENTÉ]` = source publique citée, non exécutée. `[NON VÉRIFIÉ]` = non établi, et compté comme tel.

---

## Journal de preuve

Une ligne par requête et par commande. Rejouable en l'état par l'auditeur de la phase 1.5.
Colonne `#` = numéro de requête réseau au compteur global (plafond R3 : 60).

| # | Horodatage | Commande / requête | Résultat |
|---|---|---|---|
