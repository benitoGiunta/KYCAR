# Journal d'application — liste `ANNEXE-A` (39 travaux)

Cible unique : `docs/requirements/draft-data-dictionary.md`.
Source des décisions : `reports/REQ-STRESSTEST.md` § 4.1 (liste de travaux) et § 2 (texte exact).
Contexte normatif : `docs/requirements/ARBITRAGES-req-lead.md` § Révisions (`R-A06`, `R-A01`,
`R-A05`), règle d'autorité `A-09`, `docs/00-CONTEXT.md` règle R3.

État initial du document : 1 584 lignes, 127 exigences `EX-DATA-1` … `EX-DATA-127`, aucun `bis`.

| # | Décision | Exigence | Action faite | Statut |
|---|---|---|---|---|

<!-- lots ci-dessous -->

## Lot 1 — `A-01` à `A-05` (vocabulaire `KYCAR_INGEST_FLAG` et propagation du renommage)

| # | Décision | Exigence | Action faite | Statut |
|---|---|---|---|---|
| A-01 | `ARB-13` | `EX-DATA-45` | `SUSPECT_PRICE_FLOOR` renommé `PRICE_SENTINEL_ABSOLUTE` dans la liste des codes ; note ajoutée excluant `PRICE_IMPLAUSIBLE_IN_CELL` du vocabulaire (verdict d'analyse, `R-A06`) | APPLIQUÉ |
| A-02 | `ARB-16` | `EX-DATA-45` | `PRICE_OUT_OF_RANGE` ajouté ; mentionné en outre dans le rapport d'ingestion `EX-DATA-46`, comme le demande le corps d'`ARB-16` | APPLIQUÉ |
| A-03 | `ARB-54` | `EX-DATA-45` | `DUPLICATE_VALUE_CONFLICT` ajouté | APPLIQUÉ |
| A-04 | `ARB-60` | `EX-DATA-45` | `MARKETPLACE_UNMAPPED` ajouté ; cardinal du vocabulaire porté de 14 à **17** au titre et dans la phrase de clôture sur les sous-qualifications | APPLIQUÉ |
| A-05 | `ARB-13` | toute l'annexe A | Propagation du renommage. Occurrences de `SUSPECT_PRICE_FLOOR` trouvées par `grep` avant application : **4** — ligne 201 (champ 7 `priceEur`, colonne Validation), ligne 237 (`EX-DATA-19`), ligne 588 (`EX-DATA-45`), ligne 766 (`EX-DATA-60`, ligne `price`). Toutes traitées : `EX-DATA-45` par `A-01`, champ 7 par `A-07`, `EX-DATA-19` par `A-11`, `EX-DATA-60` par `A-15`. `grep` de contrôle final : 0 occurrence restante | APPLIQUÉ |

### Notes du lot 1

- `ARB-13` annonçait des occurrences de `SUSPECT_PRICE_FLOOR` dans `EX-DATA-16` et dans
  « `EX-DATA-99` motif `suspectValue` ». Vérification : **`EX-DATA-16` ne contient aucune
  occurrence** du code (elle parle du prix sur demande, pas de la sentinelle), et `suspectValue`
  d'`EX-DATA-99` est le nom d'un **motif de non-éligibilité au tracé**, pas le nom du drapeau. Rien
  n'a donc été renommé à ces deux endroits : la liste parenthétique de la décision est plus large
  que l'état réel du document. Aucun blocage, signalé pour traçabilité.
