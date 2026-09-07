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
