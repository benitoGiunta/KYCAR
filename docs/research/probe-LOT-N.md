# probe-LOT-N.md — Portails concurrents et méta-agrégateurs

**Agent** : `probe-N`, phase 1.4 du `PLAN-1-data-acquisition.md`.
**Candidats** : `C-42` (mobile.de Search API), `C-43` (portails BE), `C-44` (portails FR/NL/UK), `C-45` (theparking.eu), `C-69` (API theparking.eu), `C-68` (AutoUncle).
**Contraintes** : E5 (zéro requête AS24), R2 (aucun compte), R3 (pas d'extraction, plafond 70 requêtes), R1 (preuve ou `[NON VÉRIFIÉ]`). Chaque portail tiers : lire son `robots.txt` avant toute sonde de recherche, respecter, journaliser. Une seule requête de page de recherche par portail autorisé.

---

## Journal de preuve

Format : `[req N] AAAA-MM-JJ HH:MM — commande — résultat`. Compteur de requêtes tenu en tête.

