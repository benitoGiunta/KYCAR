# probe-LOT-B — Hôtes hors front, spécifications et binaires : la surface non documentée

**Agent** : `probe-B` (phase 1.4 de `docs/plans/PLAN-1-data-acquisition.md`)
**Candidats** : `C-82`, `C-03`, `C-04`, `C-88`, `C-15`, `C-16` (6)
**Date d'exécution** : 2026-09-07
**Contraintes opposables** : R1 (zéro guessing), R2/E1 (aucun compte), R3 (pas de volumétrie,
plafond 80 requêtes), E5 (aucune requête `www.autoscout24.be` / `www.autoscout24.com` hors des
17 préfixes autorisés — aucune n'a été nécessaire ici), MITM mobile hors mandat.

**Statut du document** : en cours de rédaction incrémentale. Chaque test est journalisé
immédiatement après exécution.

---

## Journal de preuve

Une ligne par requête ou commande. `#` = numéro de requête réseau au compteur R3.

| # | Horodatage | Commande / requête | Code | Taille | Latence | Extrait / résultat |
|---|---|---|---|---|---|---|
| 1 | 2026-09-07 03:16 | `curl "https://crt.sh/?q=%25.autoscout24.com&output=json"` | 200 | 1 343 180 o | 1 773 ms | JSON de certificats CT. Premier enregistrement : `private-premium-products.api.autoscout24.com` (Amazon RSA 2048 M04, not_before 2026-09-01). |
| 2 | 2026-09-07 03:16 | `curl "https://crt.sh/?q=%25.autoscout24.be&output=json"` | 200 | 211 114 o | 421 ms | JSON. Premier enregistrement : CN `m.autoscout24.de`, SAN `autoscout24.be`, `m.autoscout24.be`. |
| — | 2026-09-07 03:16 | `node extract.js crt-com.json crt-be.json` (hors ligne) | — | — | — | **496 noms d'hôtes uniques** extraits et dédoublonnés (`name_value` + `common_name`, wildcards conservés). |
| — | 2026-09-07 03:17 | `grep -E '\.api\.autoscout24\.' hosts-all.txt` (hors ligne) | — | — | — | **77 hôtes `*.api.autoscout24.*`**, dont `listing-search.api.autoscout24.com`, `listing-search-v2.api.autoscout24.com`, `listing-search.api.autoscout24.be`, `search-composer.api.autoscout24.com`, `listing-detail.api.autoscout24.com`, `taxonomy.api.autoscout24.com`, `ocs.api.autoscout24.com`. |
