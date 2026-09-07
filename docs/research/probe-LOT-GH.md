# probe-LOT-GH — Franchissement Akamai : services managés (LOT-G) et auto-hébergé (LOT-H)

**Agent** : `probe-GH`, phase 1.4 du plan `PLAN-1-data-acquisition.md`. **Mode documentaire imposé
pour les deux lots** par décision du coordinateur : aucun test de franchissement d'Akamai, sur
aucune cible, y compris tierce. Le mandat original de `LOT-H` prévoyait des tests contre une cible
Akamai tierce ; annulé — la voie du scraping d'AutoScout24 est déjà condamnée sur l'axe juridique
A11 (§ 3.3 des `Händler-AGB` interdit l'interrogation automatisée, `robots.txt` bloque `ClaudeBot`),
indépendamment de toute faisabilité technique. **Zéro requête vers `autoscout24.be`/`.com` dans
cette phase.**

**Candidats du lot** :
- `LOT-G` (service managé) : `C-23` Scrapfly, `C-26` Scrape.do, `C-27` Bright Data, `C-28`
  (Oxylabs, Zyte, Decodo, Nimble, Infatica — instruits en bloc), `C-36` Web Unlocker/Unblocker.
- `LOT-H` (auto-hébergé) : `C-33` Playwright/Puppeteer durci + proxies résidentiels BE, `C-34`
  Camoufox/patchright/undetected-chromedriver, `C-37` solveurs auto-hébergés (FlareSolverr).

**Question la plus décisive de `LOT-G`** : les CGU de ces fournisseurs excluent-elles
contractuellement une cible dont le `robots.txt` interdit le crawl ? Si oui pour AutoScout24, la
clause annule la famille entière pour notre usage.

**Économie de `LOT-H`** : coût par 1000 pages en auto-hébergé (proxies résidentiels BE + calcul),
comparé à `LOT-F` (~1,94 €/1000, `probe-LOT-F.md`).

---

## Journal de preuve

*(rempli au fur et à mesure)*
