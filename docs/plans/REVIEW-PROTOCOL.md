# Protocole de revue de développement — phase 2.5

Ce protocole s'impose à chaque agent `rev-D<n>` et à `rev-patho`. Il traduit PLAN-2 §2.5 (règles R4,
R5 ; critères S1–S4) en consignes exécutables. Le coordinateur (session principale) le fait respecter.

## 1. Ce que tu revois, ce que tu ne touches pas

- Tu revois **un lot** (spécifié dans ta mission) : son périmètre, ses exigences et ses critères de
  succès sont dans `docs/plans/ARCHITECTURE.md` §7.1, les critères génériques S1–S5 dans
  `docs/plans/PLAN-2-app-build.md` §2.4. Tu n'as pas écrit ce code (R5).
- **`src/` est en lecture seule pour toi.** Tu ne corriges rien : tu constates et tu prouves. La
  correction est le travail de la phase 2.6.
- Tu écris uniquement dans : `tests/review/D<n>/` (tes sondes) et `reports/review/D<n>.md` (ton
  rapport). Rien d'autre. Tu ne commites pas : le coordinateur commite.

## 2. Vérifier en exécutant, jamais en lisant (R4)

- Chaque verdict sur un critère de succès s'appuie sur une **exécution** : test existant relancé,
  sonde nouvelle, commande dont la sortie est citée. « Le code semble faire X » n'est pas une preuve.
- Une **sonde** est un test Vitest dans `tests/review/D<n>/<sujet>.test.ts`, qui importe depuis
  `src/` en chemin relatif, sans réseau, typé strict (`tsconfig.review.json`) et propre au lint.
- Une sonde qui **échoue** est un constat : son titre commence par l'identifiant du constat
  (`R-D4-03 — …`). Tu la laisses en échec (jamais `skip`, `todo`, ni assertion adoucie) : la phase 2.6
  doit la faire passer telle quelle (PLAN-2 §2.6 S2).
- Une sonde qui **passe** est une preuve de conformité : tu la gardes aussi (elle sera promue dans la
  suite par défaut).
- Commandes autorisées :
  - `npx vitest run --config vitest.review.config.ts tests/review/D<n>` (tes sondes) ;
  - `npx vitest run --no-file-parallelism src/<dossier-de-ton-lot>` (tests existants du lot) ;
  - `npx tsc --noEmit -p tsconfig.review.json`, `npx eslint tests/review/D<n>` ;
  - `npm run build` / `npm run size` **une seule fois** si ton lot les concerne (D1, D7, D8).
  - **Interdit** : `npm test` complet (le coordinateur le lance), `npm run test:perf` sauf `rev-D4`
    et `rev-D7` (chacun son fichier `*.perf.test.ts`, une seule fois), toute installation de dépendance.
- Dix revues tournent en parallèle sur 4 cœurs : reste dans ton périmètre, pas de boucles de perf
  inutiles, pas de génération répétée de datasets 100k hors de ce que la preuve exige.

## 3. Ce que tu cherches

1. **Critères de succès** génériques (S1–S5) et spécifiques (§7.1) : verdict `ATTEINT` /
   `NON ATTEINT` / `NON VÉRIFIABLE` (dis pourquoi), preuve à l'appui.
2. **Écarts silencieux** : exigence `EX-…` tracée dans le code (commentaire, nom de test) mais
   implémentée partiellement, ou seulement pour le cas nominal.
3. **Cas pathologiques** de la phase 2.2 qui concernent ton lot : `reports/ST-adversarial.md`
   (ADV-01…18 et la matrice §« attaques tentées »), `reports/ST-complete.md`, `reports/ST-ambiguity.md`,
   et les décisions correspondantes de `reports/REQ-STRESSTEST.md`. Rejoue-les, documente le
   comportement obtenu.
4. **Points ouverts** qui te sont attribués (O13–O17, `docs/EXECUTION-LOG.md` § Points ouverts) et
   tensions d'`ARCHITECTURE.md` §9 : instruis-les factuellement, sans les trancher.
5. **R3** (aucun champ vendeur identifiant), **R2** (aucun accès data hors `DataProvider`), **E5**
   (aucun appel réseau vers autoscout24 / 2dehands dans le code ou les tests).

## 4. Format du rapport `reports/review/D<n>.md`

```
# Revue D<n> — <intitulé du lot>
Agent : rev-D<n> · modèle <…> · effort <…> · date
Commandes exécutées : (liste, avec durée et résultat résumé)

## 1. Verdict par critère de succès
| Critère | Énoncé | Verdict | Preuve (commande / sonde / sortie) |

## 2. Constats
| ID | Type | Sévérité | Exigence(s) | Constat | Preuve d'exécution | Correction attendue | Fichiers |
Types : ÉCART-EXIGENCE · BUG · CRITÈRE-NON-ATTEINT · RÉGRESSION · DETTE
Sévérités : BLOQUANT (fausse une valeur affichée, viole R3/R2/E5, casse un parcours cible) ·
            MAJEUR (exigence non tenue sans fausser le reste) · MINEUR (cosmétique, dette documentaire)
La correction attendue est ACTIONNABLE : quoi changer, où, et quel test doit passer ensuite.

## 3. Cas pathologiques rejoués
| Cas (ADV-xx / ST-xx) | Attendu (exigence, décision ARB) | Obtenu | Verdict |

## 4. Exigences vérifiées conformes
Liste des EX-… vérifiées par exécution et trouvées conformes (pour la matrice 2.7).

## 5. Points ouverts / tensions instruits
O13…O17, §9.x : faits établis, sans décision.
```

Rapport en français, identifiants `R-D<n>-<kk>` séquentiels, zéro formulation non mesurable.

## 5. Contraintes qui ne se discutent pas

E1 (aucun compte, aucun credential), E3 (aucune question au commanditaire : tu conclus avec ce que tu
as), E4 (une hypothèse est écrite comme hypothèse), E5 (aucune requête réseau), R3. E2 est levée
depuis le 2026-09-08 : tout modèle est autorisé.
