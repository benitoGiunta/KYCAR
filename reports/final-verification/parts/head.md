# FINAL-VERIFICATION — vérification finale de la phase 2.7

Agent `final-check` · modèle Fable · effort max · 2026-09-08 · branche `claude/kycar-project-ffcplk`
(HEAD `41d8686`) · arbre principal `/home/user/KYCAR`.

**Indépendance (R5).** Je n'ai écrit ni corrigé aucune ligne de `src/`, `tests/`, `docs/` ou `data/`.
Mes seules écritures sont ce rapport et le dossier `reports/final-verification/` (journaux JSON,
captures d'écran, scripts jetables, matrice source). Aucun commit, aucune question (E3), aucun accès
réseau hors `localhost` (E5) : les cinq journaux navigateur enregistrent `externalRequests: []`.

**Objet (PLAN-2 §2.7).** Reprendre `docs/requirements/REQUIREMENTS.md` **v1.1** et ses trois annexes
exigence par exigence, lancer l'application livrée, exercer les deux parcours cibles de bout en bout,
et statuer : `COUVERTE` / `PARTIELLE` / `NON COUVERTE` / `HORS PÉRIMÈTRE`, chaque statut avec sa
preuve d'exécution.

**Ce que ce rapport établit en une phrase.** La couche types/moteur/état est solide et prouvée
(335 exigences couvertes sur 485, tous les budgets NFR mesurés tenus), mais **deux défauts
bloquants de câblage, invisibles aux 1 413 tests node, cassent les deux parcours cibles dans le
navigateur réel** : la première entrée en mode 2 lit un lot colonnaire *détaché* après son transfert
au Web Worker (nuage vide, G8 vide, part de particuliers à 0 %, écran D inaccessible en accès direct —
FV-01), et l'écran A ne rend aucune zone-modèle et affiche « 0 modèles » tant que l'utilisateur n'a
pas cliqué chaque carte (FV-02). La porte G6 (matrice complète et chiffrée) est franchie ; la phase 2.8
hérite de 24 constats, dont 2 bloquants et 10 majeurs.

---

## 1. Méthode

### 1.1 Environnement

| Élément | Valeur |
|---|---|
| Machine | Linux 6.18 (conteneur Claude Code on the web), 4 cœurs ; un autre agent (`e2e-harness`, 2.9a) travaillait en parallèle dans un worktree séparé sur le port 4180 |
| Node / npm | Node v22.22.2 ; `npm ci` déjà fait (aucune installation) |
| Serveur testé | **build de production** : `npm run build` (0 erreur / 0 avertissement) puis `npx vite preview --port 4173 --strictPort` (référentiels servis depuis `dist/reference/`) |
| Navigateur | Chromium préinstallé `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, `@playwright/test` 1.63, `@axe-core/playwright` 4.13 ; locale `fr-BE`, fuseau `Europe/Brussels` ; viewports 1 280 × 800 (défaut), 1 440 × 900 (densité), 360 × 740 (compact) |
| Scripts jetables | `reports/final-verification/scripts/{_common,p1,p1b,p2,p2c,p3,p4,p5}.cjs` — journaux JSON dans `reports/final-verification/logs/*-journal.json`, sorties brutes dans `*-run.log` |

### 1.2 Commandes rejouées (totaux)

| Commande | Résultat | Durée | Journal |
|---|---|---|---|
| `npm run build` | `tsc` app + worker + `vite build` : **0 erreur / 0 avertissement**, 139 modules, `index-BSSmQp_l.js` 277,11 kB (90,63 kB gzip), CSS 2,54 kB gzip, `aggregation.worker-DxWTsNLS.js` 29,54 kB | 8,2 s | `logs/build.log` |
| `npm test` | suite unitaire **54 fichiers, 615 tests, 0 échec** puis sondes de revue **78 fichiers, 798 tests, 0 échec** (les 4 lignes `[size] FAIL` sont les sondes D1 sur manifestes factices) | 11,5 s + 48,1 s = 61,2 s | `logs/npm-test.log` |
| `npm run lint` | `eslint .` silencieux, exit 0 | 5,1 s | `logs/lint.log` |
| `npx tsc --noEmit -p tsconfig.review.json` | 0 erreur | — | `logs/tsc-review.log` |
| `npm run size` | **initial 99,13 / 300 Kio gzip** (chunk worker 10,63 Kio compris), différé 0,00 / 400 Kio — `OK: within budget` | 0,2 s | `logs/size.log` |
| `npm run test:perf` | 2 fichiers, **7 tests, 0 échec** : recalcul complet N = 100 000 `p50 = 152,4 ms · p95 = 165,5 ms · max = 192,9 ms` (100 exécutions) ; élagué marque `p95 = 54,1 ms` ; facettes `p95 = 21,8 ms` ; nuage 5 000 points `p95 = 3,92 ms` ; interaction `8 390 images, 91 fenêtres, 0 en défaut, 100 %` | 37,4 s | `logs/test-perf.log` |
| `diff docs/plans/DataProvider.ts src/providers/DataProvider.ts` | sortie vide, exit 0 (les deux copies de l'interface gelée sont identiques après D-01/D-02/D-03) | — | §6 |
| `git status --short` (avant écriture) | arbre propre | — | — |

Les 8 sondes `it.fails` annotées (dettes consignées D-49) sont bien présentes et échouent réellement à
l'intérieur : `R-D2-02`, `R-D2-16`, `R-D4-05`, `R-D5-10`, `R-D5-13`, `R-D7-10`, `R-D7-16`, `R-D9-21`.

### 1.3 Décompte des exigences (vérifié par script)

Extraction des identifiants **déclarés** (et non seulement cités) dans les trois annexes :

| Annexe | Motif de déclaration | Déclarées | Annoncé par `REQUIREMENTS.md` §0 |
|---|---|---|---|
| A `draft-data-dictionary.md` | `^**EX-DATA-<n>[bis|ter|quater|quinquies]` | **140** (127 numérotées + `61bis`, `70bis/ter`, `83bis/ter/quater/quinquies`, `93bis`, `100bis`, `102bis`, `110bis`, `115bis`, `123bis`) | 140 (le §C.5 de l'annexe dit encore 139 : écart documentaire mineur) |
| B `draft-screens.md` | `` ^`EX-SCR-<n>[bis]` — `` | **231** (dont `EX-SCR-111` en pierre tombale) | 231 |
| C `draft-behaviour.md` | lignes de table `| EX-… |` et `**EX-…` | **114** (NAV 28 · SRCH 34 · CRUD 20 · NFR 32) | 114 |
| **Total** | | **485** | **485** |

Le script de rendu (`scripts/render-matrix.mjs`) refuse de produire la matrice si un identifiant
déclaré manque ou si un identifiant non déclaré s'y glisse : la matrice du §2 compte exactement ces
485 lignes, plus les six propriétés `P-1…P-6` de `REQUIREMENTS.md` §10 (énoncées comme exigences,
hors décompte des 485).

### 1.4 Ce qui est vérifié par test et ce qui l'est par navigateur

- **Par test (rejoué)** : tout ce que la suite unitaire (615) et les sondes de revue (798) couvrent
  nommément. Les sondes portent l'identifiant d'exigence dans leur titre ; j'ai construit un index
  `identifiant → tests` (`grep -rlE`) : 351 exigences ont au moins une trace par identifiant (121 à la
  fois dans le code, les tests unitaires et les sondes), 134 n'en ont aucune et ont été statuées par
  commande, par navigateur ou déclarées documentaires.
- **Par navigateur** (build de production, Chromium réel) : les deux parcours cibles (§4), les
  états de la coquille, les corrections d'URL, les routes héritées, l'impression, `EX-NFR-9` sous
  4G simulée (CDP `Network.emulateNetworkConditions`, cache désactivé), et **axe-core WCAG 2.1 A/AA
  sur les huit surfaces**. C'est ce niveau qui a révélé les deux constats bloquants : les tests node
  exécutent le moteur *in-process* (`engine-inprocess.ts`) et montent les composants isolément, alors
  que le navigateur exécute le vrai Worker et la vraie coquille.
- **Par commande** (`grep`, `diff`, `node -e`) quand aucune exécution n'est possible : absence d'un
  symbole, identité de deux fichiers, décompte d'un référentiel.
- **Non vérifiable ici** et renvoyé à la campagne 2.9 : ce qui exige une mesure au rendu sur
  appareil de référence (contours de focus, hauteurs en pixels, 60 img/s de défilement, rendu des
  histogrammes au `requestAnimationFrame`). Ces lignes sont `PARTIELLE` avec la mention
  « campagne 2.9 », jamais `COUVERTE` par présomption.

---

## 2. Matrice de couverture

Légende : **COUVERTE** = comportement prouvé par exécution (test, sonde, commande, navigateur) ;
**PARTIELLE** = une part prouvée, un écart nommé ; **NON COUVERTE** = absence prouvée ;
**HORS PÉRIMÈTRE** = sans objet par décision tracée. La colonne « Dette / décision » cite la
décision 2.6 qui consigne l'écart ; « écart non consigné (FV-nn) » renvoie au constat du §7 et
constitue une entrée de la phase 2.8 ; « campagne 2.9 » signale une mesure au rendu non faisable
ici. Les journaux cités (`P1-0`, `P2c-1`, …) sont dans `reports/final-verification/logs/`.
