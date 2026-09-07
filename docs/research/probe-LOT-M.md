# probe-LOT-M.md — Découverte côté concessionnaire : le stock sans passer par AutoScout24

**Agent** : `probe-M` (phase 1.4, PLAN-1). **Modèle** : Opus, effort high.
**Lot** : `LOT-M` — candidats `C-92`, `C-46`, `C-76`, `C-74`, `C-73`.
**Idée directrice** : contourner AS24 par la source (site du garage, portail constructeur, flux
publicitaire, affiliation). **Question qui décide de la valeur du lot** : ce stock est-il
**substituable** à AS24, ou **disjoint** ? (question falsifiable 3, traitée en section dédiée.)

**Contraintes appliquées** : E5 (zéro requête vers `autoscout24.be`/`.com`) · E1/R2 (aucun compte)
· R3 (échantillon, pas de volumétrie, plafond 80 requêtes tierces temporisées) · R1 (preuve ou
`[NON VÉRIFIÉ]`) · robots.txt de chaque tiers lu et respecté avant sonde.

Date d'exécution : 2026-09-07.

---

## Journal de preuve

> Rejouable. Chaque ligne = une commande émise et l'essentiel de sa sortie. Compteur de requêtes
> tierces tenu en bas de la section Conformité. Toutes les requêtes portent un User-Agent explicite
> et sont temporisées (≥1 s entre deux requêtes vers le même hôte).

