# fix-app-5 — remédiation pré-tag du plan 3 (phase 3.5), constat **ACC-26**

**Agent** : `fix-app-5` (Opus, effort high) · **Worktree** : `/home/user/KYCAR-app5`, branche
`fix35/app5` depuis `claude/kycar-project-ffcplk` @ `f4a03aa`.
**Entrée** : `reports/ACCEPTANCE.md` rev 4 §0, §1 (G9-4), §4.3 et §8 ligne **ACC-26** (MAJEUR à
périmètre étroit) ; `reports/remediation-2.8/fix-app-4.md` (ACC-20) ; `reports/data/DATA-LEAD-DECISIONS.md`
D3-42, D3-43 (b).
**Règle de preuve** (PLAN-2 §2.6 S2) : chaque correction est prouvée par une sonde écrite AVANT elle,
rouge sur le code d'origine, verte après. Une seule sonde a été retouchée — **la mienne**, jamais
livrée, pour ne pas contredire une sonde ratifiée de `fix-app-4` : c'est dit et justifié au §6.

---

## 1. Tableau de synthèse — constat → correction → preuve → statut

| Constat | Correction | Preuve (commande + sortie) | Statut |
|---|---|---|---|
| **ACC-26** (MAJEUR) — une recherche enregistrée sous `?provider=synthetic`, rouverte depuis une page amorcée par défaut, remet l'URL `provider=synthetic` mais **sert le jeu par défaut**, sans un mot | **Règle** : *l'URL est la déclaration partageable de la source ; la source servie est toujours celle que l'URL courante nomme.* Au point de passage unique `navigate`, après la reconduction des réservés (`ACC-20`), la spécification de la cible est **résolue par le registre** et comparée à celle **amorcée par `main.tsx`** (exposée par la propriété `bootSource`) : si elle diffère, la navigation interne devient une **navigation complète** (`window.location.assign`), qui fait ré-amorcer l'application sur la source nommée. Même garde sur `popstate` | `npx playwright test tests/e2e/source-fixture.spec.ts -g "ACC-26" --project=desktop` — **rouge** : carte « 76 437 offres à la création · **11 652 offres actuellement** · **− 64 785 offres depuis le 14/09** », Diagnostic `FIXTURE` sous une URL `provider=synthetic` → **verte, 3 projets** : `/marche?priceto=20000&provider=synthetic`, Diagnostic **`SYNTHETIC`**, bandeau « Données synthétiques » ; sens inverse : Diagnostic **`FIXTURE`** sous `provider=fixture:test` | **CLOS** |
| **ACC-26 (b)** — carte de l'écran E (`EX-SCR-212`/`213`) : « effectif actuel » et écart calculés sur une AUTRE source que l'effectif figé | L'effectif actuel n'est calculé **que** pour les recherches dont la **source de création** est celle qui est servie. Les autres n'affichent **aucun chiffre** : « source : synthétique (à la création) — ouvrir pour recalculer ». Le garde coupe le **calcul** de l'écart, pas seulement son affichage | même sonde — **rouge** `.kycar-saved-delta` reçu `1`, attendu `0` → **verte** : « … 76 437 offres à la création · créée le 14 sept. 2026 · **source : synthétique (à la création) — ouvrir pour recalculer** » | **CLOS** |
| **ACC-26 (c)**, chemin résiduel trouvé en cours de lot — recherche enregistrée **sans** `?provider=` (donc sous la source par défaut), listée dans une session amorcée `synthetic` : l'écart inter-sources subsistait (`+ 64 785`) | Le critère de l'écran E est la source de **CRÉATION**, lue sur l'URL enregistrée **telle quelle** (`specOfUrl`, sans reconduction) — c'est elle qui a produit `effectifInitial`. Une URL muette a été enregistrée sous la source « sans paramètre » (`ACC-20` garantit qu'une autre session aurait porté le paramètre — hypothèse **E4**, §7) | `npx playwright test tests/e2e/source-fixture.spec.ts -g "enregistrée SANS" --project=desktop` — **rouge** : `.kycar-saved-delta` reçu `1` → **verte, 3 projets** : « 11 652 offres à la création · … · source : fixtures, profil test (à la création) — ouvrir pour recalculer » | **CLOS** |
| Non-régression **ACC-20** (le paramètre survit à chaque écriture d'URL) et « aucun rechargement inutile » | La reconduction reste **visible et première** dans `navigate` ; la décision de source vient après. Sonde de non-régression : l'ouverture d'une recherche de la **même** source reste une navigation interne, prouvée par un **témoin de document** posé sur `window` avant le clic | `npx playwright test -g "EX-NAV\|clavier\|ACC-19\|ACC-20" --project=desktop` → **28 passed** ; témoin : `[MESURE] ACC-26 — témoin de document après Ouvrir (même source) : même document` (3 projets) | **VERT** |

---

## 2. La règle, et pourquoi celle-là

> **L'URL est la déclaration partageable de la source (`DF-2`, `D-03`) ; la source servie est
> toujours celle que l'URL courante nomme.**

`main.tsx` choisit le provider **une seule fois**, au démarrage (`resolveProvider` sur
`window.location.search`) : le registre, le chargeur de fixtures, le moteur, le contrôleur et le
cache sont assemblés autour de cette décision. `pushState` ne traverse pas ce montage. Une
navigation interne vers une URL qui nomme une autre source produisait donc l'état exact que la
recette a relevé : **l'URL dit `synthetic`, l'écran sert `fixture:test`**, et rien ne le signale.

Trois lectures possibles, une seule tenable :

| Option | Pourquoi elle est écartée / retenue |
|---|---|
| **A. Retirer le paramètre de la cible en le disant** (bandeau « source non rejouée, paramètre retiré ») | **Écartée.** Elle rend l'URL honnête au prix de la fonction : rouvrir une recherche enregistrée sous `synthetic` ne la rouvrirait plus. Elle contredit aussi `D3-43 (b)` (« les recherches enregistrées mémorisent `provider=` : conforme à `DF-2`, la bascule fait partie du lien ») et `ACC-20`, qui vient précisément de rétablir ce paramètre dans l'URL. On aurait corrigé un mensonge par une amputation. |
| **B. Basculer le provider à chaud, sans rechargement** (reconstruire provider + contrôleur + moteur dans le document courant) | **Écartée.** Ce n'est pas un correctif pré-tag : il faut arrêter et remplacer le `DataController` (réessais, repli cache, chargement progressif en vol), recréer le Web Worker et son moteur, invalider le cache LRU de sélections, vider le cache IndexedDB de snapshot de l'ancienne source, purger les agrégats-modèles et les états d'écran dérivés — sans quoi un écran afficherait des chiffres d'une source et une étiquette de l'autre. `main.tsx` fait déjà tout cela **correctement** au démarrage : réécrire ce chemin une seconde fois, à chaud, à la veille d'un tag, est le genre de correction qui crée un constat de plus. À rouvrir en v0.1.1 si la bascule de source devient un geste fréquent (elle est aujourd'hui un outil de mise au point et de démonstration). |
| **C. Navigation complète quand la source change** | **Retenue.** Elle rend la règle vraie par construction : ce que l'URL nomme est ce que `main.tsx` amorce, puisque `main.tsx` est re-exécuté. Coût : un rechargement, **uniquement** quand la source change — c'est-à-dire au seul moment où tout le jeu de données change de toute façon. Aucun rechargement sur les navigations ordinaires (prouvé par le témoin de document, §1). |

---

## 3. Où la décision est prise, et ce qu'elle couvre

Module **pur** `src/app/source-navigation.ts` (neuf) :

- `bootSourceOf(search, env)` — ce que `main.tsx` a réellement amorcé : `spec` (après repli) **et**
  `specWithoutUrlParam` (ce que vaudrait une URL sans `?provider=` : variable de build, à défaut
  `fixture:test`). `main.tsx` la construit et la passe par la propriété `bootSource` : **la coquille
  ne redevine jamais la source en relisant `location.search`** (l'URL a pu être réécrite cent fois
  depuis le démarrage). Sans le second champ, une URL sans paramètre sous `VITE_KYCAR_PROVIDER`
  aurait été prise pour un changement de source à chaque navigation — donc un rechargement par clic.
- `specOfUrl(url, boot)` — la spécification qu'une URL **nomme**, résolue **par le registre**
  (`resolveProviderSpec`), repli compris.
- `decideSourceNavigation(url, boot)` — `internal` si elle égale la source amorcée, `full` sinon.
- `planNavigation(url, currentSearch, boot)` — reconduction `ACC-20` puis décision, en un appel.
- `shortSourceLabel(spec)` — libellé court pour une phrase d'écran (le registre porte des libellés
  d'étiquette de provenance, illisibles au milieu d'une carte).

**Chemins de navigation couverts** — tous passent par `navigate` (point de passage unique depuis
`ACC-20`), donc tous par la décision :

| Chemin | Comportement |
|---|---|
| Ouverture d'une **recherche enregistrée** (écran E, `EX-CRUD-6`) | source différente → navigation complète ; `stores.saved.touch(id)` est appelé **avant** (synchrone), `dernier_accès_le` n'est pas perdu |
| **Historique récent** (panneau de l'écran E, `EX-CRUD-11`) | mêmes URL, même décision |
| **Liens internes** (onglets, fil d'Ariane, marque, `/mentions`, boutons de repli) | ils appellent `props.onNavigate` → `navigate` ; sans `provider` dans la cible, la reconduction `ACC-20` rend la décision `internal` (aucun rechargement) |
| **Canonisation d'URL** (`EX-SCR-140`, `EX-NAV-21`, `replace`) | même décision ; en pratique toujours `internal` (la requête garde le réservé) |
| **Retour arrière** (`popstate`) | garde symétrique : si l'entrée restituée nomme une autre source que celle amorcée (document rendu depuis le bfcache après un `F5` sous une autre source), la page est **rechargée** au lieu d'afficher des chiffres qui contredisent l'URL |
| Valeur **inconnue** ou **non câblée** (`?provider=tweedehands`) | le registre replie sur le défaut → **aucun rechargement** quand le défaut est déjà servi ; la valeur reste lisible dans l'URL et `ET-SOURCE-REPLI` dit le repli (`ACC-20` inchangé) |

**Pas de boucle** : la décision est idempotente — rejouée après le ré-amorçage sur la cible d'une
navigation complète, elle rend `internal` (sonde `R-D8-ACC26-02`, dernier cas).

---

## 4. Ce que la navigation complète perd, ce qu'elle conserve

Elle n'a lieu **que** lorsque la source change, c'est-à-dire lorsque toutes les données affichées
deviennent caduques de toute façon.

**Conservé** (aucune perte silencieuse) :

- tout ce qui vit dans l'**URL** : filtres, corrections, projection et brossage de l'écran B,
  cartes dépliées (`mk`), bascules log, sélection de comparaison quand elle est dans `/comparer?m=…`,
  et le paramètre de source lui-même ;
- tout ce qui vit en **localStorage** : préférences de tri et « masquer les modèles rares »
  (`PreferencesStore`), recherches enregistrées, modèles suivis, historique récent ;
- l'**historique** du navigateur : `location.assign` ajoute une entrée, le retour arrière fonctionne
  (et, s'il ramène une URL d'une autre source, la garde `popstate` recharge).

**Perdu** (états de session, non partageables, E4) :

| État perdu | Pourquoi c'est acceptable |
|---|---|
| Sélection de comparaison **de session** (`compareKeys`) quand on n'est pas sur `/comparer?m=…` | Elle désigne des modèles **de l'ancienne source** ; les colonnes seraient recalculées sur l'autre jeu. `EX-CRUD-13bis` la dit « de session » ; elle survit dans l'URL `/comparer?m=…`, qui est la forme partageable. |
| Bandeaux d'état affichés, message de confirmation en cours, panneau Diagnostic ouvert, feuille de filtres ouverte, confirmation de suppression en ligne | États éphémères d'interface, sans valeur informative après un changement de jeu de données. |
| Caches en mémoire (agrégats chargés, LRU du moteur, payload de mode 2) | Ils appartiennent à la source quittée ; les conserver serait le défaut, pas la fonctionnalité. |

C'est exactement ce que perdait déjà le **contournement documenté par la recette** (« recharger la
page après avoir rouvert une recherche enregistrée ») — à ceci près que l'utilisateur n'a plus à y
penser, et qu'il n'y a plus d'intervalle pendant lequel l'écran ment.

---

## 5. Écran E — l'effectif actuel n'est plus un écart entre deux sources

Option retenue (la première des deux proposées) : **l'effectif actuel n'est calculé que pour les
recherches de la source courante** ; les autres n'affichent **aucun chiffre**, mais nomment leur
source. La seconde option (masquer le seul delta) a été écartée : le chiffre « 11 652 offres
actuellement » affiché sous « 76 437 offres à la création » reste une comparaison implicite entre
deux jeux, même sans la ligne d'écart — le lecteur fait la soustraction lui-même.

Détail qui compte : le critère est la **source de création** (`specOfUrl(record.url, bootSource)`,
sans reconduction), pas la source que « Ouvrir » servira. C'est la source de création qui a produit
l'`effectifInitial` figé (`ARB-45`) que la carte affiche ; c'est donc elle qui décide si une
comparaison a un sens. Ce choix ferme aussi le chemin résiduel §1 (c).

Rendu : `source : synthétique (à la création) — ouvrir pour recalculer` (classe
`kycar-saved-current--other-source`, teinte atténuée, italique — une information, pas une alerte).
La mention « (à la création) » est là pour ne **rien promettre** sur la source que l'ouverture
servira dans le cas d'une recherche sans paramètre (§7, hypothèse 2).

Le garde coupe le **calcul** de l'écart (`const delta = props.otherSourceLabel === undefined && …`),
pas seulement son rendu : aucune soustraction inter-sources n'existe plus dans le code.

---

## 6. Sondes (rouge → verte) et la seule sonde retouchée

**Sondes neuves.**

| Sonde | Contenu | Rouge d'abord |
|---|---|---|
| `tests/e2e/source-fixture.spec.ts`, `test.describe('ACC-26 …')` — **4 tests × 3 projets** | (1) enregistrée sous `?provider=synthetic`, rouverte depuis une page amorcée par défaut → Diagnostic `SYNTHETIC` + URL `provider=synthetic` ; (2) symétrique (`fixture:test` ouverte sous une session `synthetic`) ; (3) enregistrée **sans** paramètre, listée sous `synthetic` → aucun écart ; (4) **même** source → navigation interne (témoin de document) | oui : (1) et (2) échouent sur `.kycar-saved-delta` = 1 et sur le Diagnostic ; (3) échoue sur l'écart `+ 64 785` ; (4) était déjà verte (non-régression, dit comme tel) |
| `tests/review/D8/source-acc-26.test.ts` — **21 cas** | décision pure : cible sans `provider`, identique, différente, `fixture:dev` vs `fixture:test`, inconnue (repli), `tweedehands` (non câblée) sous deux amorçages, amorçage sous valeur inconnue, absence de boucle, `VITE_KYCAR_PROVIDER`, source de création d'une URL muette, libellés courts ; puis câblage (`navigate`, `main.tsx`, écran E, carte) | oui : `Cannot find module '../../../src/app/source-navigation'` (le module n'existait pas) |

**Sonde retouchée — la mienne, jamais livrée.** Mon premier jet plaçait la reconduction des réservés
`ACC-20` **à l'intérieur** de la fonction de décision, et ma sonde de câblage l'exigeait
(`expect(code).not.toMatch(/carryReservedParams\(/)` dans `navigate`). Or la sonde **ratifiée**
`R-D8-ACC20-04` de `fix-app-4` (`tests/review/D8/shell-wiring-acc-3.5.test.ts` l. 150) exige
l'inverse : `carryReservedParams` doit rester **visible** au point de passage. Cette sonde ratifiée
n'est pas fausse — elle dit une chose vraie et utile d'`ACC-20`. J'ai donc **laissé la sonde ratifiée
intacte**, séparé `carryReservedParams` (ACC-20) de `decideSourceNavigation` (ACC-26) dans
`navigate`, et corrigé **ma** sonde, en la rendant **strictement plus forte** : les deux appels sont
exigés, et l'ordre entre eux aussi (`indexOf(carryReservedParams) < indexOf(decideSourceNavigation)`).
Second ajustement de la même sonde, même nature : après la découverte du chemin résiduel §1 (c), la
sonde de câblage de l'écran E exige désormais `specOfUrl(record.value.url, bootSource)` **et
l'absence** de reconduction à cet endroit — là encore plus exigeant que la version précédente.
**Aucune sonde d'un autre lot n'a été modifiée.**

---

## 7. Hypothèses (E4)

1. **Une navigation complète est un coût acceptable pour un changement de source.** La bascule
   `?provider=` est un outil de mise au point et de démonstration (`DF-2`, `D3-01`) ; elle change
   l'intégralité du jeu servi. Hypothèse : personne ne bascule de source en boucle pendant une
   session de travail. Si cela devenait un geste courant, l'option B du §2 (bascule à chaud) devrait
   être instruite.
2. **Une URL enregistrée sans `?provider=` a été enregistrée sous la source « sans paramètre ».**
   Depuis `ACC-20`, toute session amorcée sur une autre source porte le paramètre dans chaque URL
   qu'elle écrit — donc une URL muette vient d'une session par défaut (ou `VITE_KYCAR_PROVIDER`).
   L'inférence est **fausse pour les entrées écrites avant `ACC-20`** : elles seront traitées comme
   « source par défaut ». Conséquence bornée : sous une session non par défaut, leur carte n'affiche
   pas d'effectif actuel et nomme la source par défaut. Aucune n'affiche de chiffre faux.
   `SavedSearch` ne mémorise pas sa source ailleurs que dans son URL ; l'y ajouter est un changement
   de schéma de `src/persistence`, **hors de mon périmètre** (§8).
3. **Ouvrir une recherche sans paramètre la sert sous la source de la session.** C'est la règle
   `ACC-20` (une URL qui ne nomme rien hérite du contexte), et non une décision de ce lot. La carte
   ne promet donc rien : elle dit « source : … (à la création) », pas « ouvrir pour revenir à … ».
4. **`bootSource` est une valeur stable pour la durée du document.** `main.tsx` l'évalue une fois au
   montage ; `navigate` et l'effet de l'écran E la prennent en dépendance sans risque de boucle de
   rendu.

---

## 8. Hors périmètre / pour le coordinateur

1. **Décision due, mineure** : `SavedSearch` (`src/persistence/saved-searches.ts`, hors périmètre) ne
   mémorise pas sa source autrement que dans son URL. Un champ `sourceSpec` (versionné, `SCHEMA_VERSION`)
   supprimerait l'inférence de l'hypothèse 2 et permettrait, à terme, de rouvrir une recherche **sur
   sa source d'origine**. À arbitrer en v0.1.1 : **dette proposée, non bloquante** — aucun chiffre
   faux n'est affiché sans ce champ.
2. **Écrire le paramètre de source dans l'URL enregistrée** (`saveCurrentSearch`) aurait le même
   effet et tient dans mon périmètre, mais **casse une sonde ratifiée** :
   `tests/e2e/persistance.spec.ts` (`EX-CRUD-1`) vérifie `record.url === '/marche?priceto=20000'`
   au caractère près. Je ne l'ai donc pas fait. Si le coordinateur préfère cette voie, c'est une
   décision `D3-nn` et une retouche de sonde à assumer explicitement.
3. **Budget de bundle** : 136,66 → **137,36 / 300 Kio gzip** (+0,70). La coquille importe désormais
   `src/providers/registry` (via le module pur) : le registre était déjà dans le bundle initial, tiré
   par `main.tsx` ; l'écart tient au nouveau module et à ses libellés. `npm run size` : **OK**.
4. **`EX-NAV-11` / dette `D3-43b`** (le plafond d'URL ignore les ≈ 18 caractères des réservés) :
   inchangée, hors de ce lot.
5. **ACC-25** (sélecteur ambigu de `responsive.spec.ts:38`) : **pas touché** — il est traité
   ailleurs ; mes sondes n'utilisent que `.kycar-footer-diagnostic dd`, jamais `summary`.

---

## 9. Preuves — commandes et sorties

Toutes depuis `/home/user/KYCAR-app5`, `node_modules` symlinké, Playwright sur le port **4181**
(port libre avant et après ; aucun `vite preview` résiduel ; `reports/e2e/results.json` restauré par
`git checkout` après chaque campagne).

| # | Commande | Sortie |
|---|---|---|
| 1 | `npm run build` | `✓ built in 1.54s`, **0 erreur / 0 warning**, 164 modules |
| 2 | `npm run lint` | `eslint .` — **code 0**, aucune sortie |
| 3 | `npm run size` | `initial 137.36/300 KiB gzip` — **OK: within budget** |
| 4 | `npx vitest run src/app src/state src/persistence src/screens/saved --no-file-parallelism` | **8 fichiers, 128 tests passés** |
| 5 | `npx vitest run --config vitest.review.config.ts tests/review/D5 tests/review/D8 --no-file-parallelism` | **37 fichiers, 443 tests passés** (dont mes 21 neufs et `R-D8-ACC20-04` intacte) |
| 6 | `KYCAR_E2E_PORT=4181 npx playwright test tests/e2e/source-fixture.spec.ts` (3 projets) | **51 passed (3,3 min)** — `ACC-26 — URL après Ouvrir : /marche?priceto=20000&provider=synthetic` ; `ACC-26 — carte … source : synthétique (à la création) — ouvrir pour recalculer` ; `ACC-26 — témoin de document après Ouvrir (même source) : même document` |
| 7 | `KYCAR_E2E_PORT=4181 npx playwright test tests/e2e/persistance.spec.ts` (3 projets) | **33 passed (3,8 min)** — `EX-SCR-212 — carte … 11 652 offres à la création · … · 11 652 offres actuellement` (même source : le chiffre est bien là) |
| 8 | `KYCAR_E2E_PORT=4181 npx playwright test tests/e2e/partage-url.spec.ts --project=desktop` | **9 passed (1,1 min)** |
| 9 | `KYCAR_E2E_PORT=4181 npx playwright test -g "EX-NAV\|clavier\|ACC-19\|ACC-20" --project=desktop` | **28 passed (3,1 min)** |

**Sorties ROUGES conservées** (avant correction, mêmes commandes) :

```
[MESURE] ACC-26 — carte d’une recherche d’une autre source : Budget 20k synthétique · Toutes marques ·
  Prix : ≤ 20 000 € · Mode 1 · 76 437 offres à la création · créée le 14 sept. 2026 ·
  11 652 offres actuellement · − 64 785 offres depuis le 14/09 · Ouvrir · Renommer · Supprimer
[MESURE] ACC-26 — carte (sens inverse) : Budget 20k fixtures · … · 11 652 offres à la création · … ·
  76 437 offres actuellement · + 64 785 offres depuis le 14/09 · …
  2 failed  (desktop) — expect(.kycar-saved-delta).toHaveCount(0) : reçu 1
```

```
Error: Cannot find module '../../../src/app/source-navigation'
  imported from tests/review/D8/source-acc-26.test.ts     (Test Files 1 failed)
```

```
(chemin résiduel, après la première correction)
  1 failed  [desktop] › ACC-26 … enregistrée SANS `?provider=` … : aucun écart
  expect(.kycar-saved-delta).toHaveCount(0) : reçu 1
```

---

## 10. Fichiers touchés

| Fichier | Nature |
|---|---|
| `src/app/source-navigation.ts` | **neuf** — règle, amorçage, décision, libellés courts (pur) |
| `src/app.tsx` | `bootSource` en propriété ; `navigate` (reconduction `ACC-20` puis décision `ACC-26`, `location.assign`) ; garde `popstate` ; effectifs actuels de l'écran E filtrés par source de création |
| `src/main.tsx` | expose `bootSource={bootSourceOf(search, env)}` ; en-tête mis à jour |
| `src/screens/saved/SavedSearchesScreen.tsx` | propriété `otherSourceById` / `otherSourceLabel` ; ligne « source : … (à la création) — ouvrir pour recalculer » ; garde du **calcul** de l'écart |
| `src/screens/saved/saved.css` | style de la ligne d'autre source |
| `tests/e2e/source-fixture.spec.ts` | 4 tests `ACC-26` (× 3 projets) |
| `tests/review/D8/source-acc-26.test.ts` | **neuf** — 21 cas (décision pure + câblage) |
| `reports/remediation-2.8/fix-app-5.md` | ce rapport |

Commits sur `fix35/app5` : `186d35a` (sondes rouges), `0a3837b` (règle + écran E), `75fdd68`
(chemin résiduel + libellé). Arbre propre, rien poussé.
