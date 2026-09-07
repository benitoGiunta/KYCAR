# probe-LOT-F — Fournisseurs de scraping à endpoint AutoScout24 dédié

**Agent** : `probe-F`, phase 1.4 du plan `PLAN-1-data-acquisition.md`. Profil **documentaire**
(pricing, CGU, offres commerciales, schémas de réponse publiés). Aucune sonde de masse, aucune
création de compte, aucun essai gratuit démarré (R2/E1). Zéro requête vers `autoscout24.be`/`.com`
(E5).

**Candidats du lot** (ordre d'instruction imposé par le mandat) : `C-31` (auto-api.com) → `C-22`
(Apify) → `C-25` (Piloterr) → `C-29` (Anysite.io) → `C-30` (Carapis) → `C-24` (ScrapingBee).

**Référentiel des 40 champs cibles** utilisé pour la couverture (source : `FINDING-allowed-surface.md`
§ 2.3, champs réellement observés dans une annonce AS24 sur la surface autorisée) :

1. `id` (UUID annonce) — 2. `details.webPage` (deeplink) — 3. `prices.public.amountInEUR.raw` —
4. `prices.public.amountInEUR.formatted` — 5. `prices.public.taxDeductible` — 6.
`prices.public.onRequestOnly` — 7. `prices.public.evaluation.category` (évaluation prix AS24) — 8.
`make.formatted` — 9. `model.formatted` — 10. `modelVersionInput` — 11. `type` (carrosserie) — 12.
`modelYear` — 13. `engine.power.kw.raw` — 14. `engine.power.hp.raw` — 15. `fuels.fuelCategory.raw`
— 16. `fuels.fuelCategory.formatted` — 17. `fuels.primary.source` — 18.
`consumption.combinedWithFallback` — 19. `co2emissionInGramPerKmWithFallback` — 20.
`condition.firstRegistrationDate` — 21. `condition.mileageInKm.raw` — 22.
`condition.numberOfPreviousOwnersExtended.raw` — 23. `usageState` — 24. `location.countryCode` —
25. `location.zip` — 26. `location.city` — 27. `seller.id` — 28. `seller.type` — 29.
`seller.companyName` — 30. `seller.contactName` (exclu par H3/RGPD côté KYCAR mais présent chez
AS24) — 31. `adProduct.tier` — 32. `media.images[]` — 33. `superDeal` — 34.
`publication.accurateState` — 35. `publication.isNew`.

Ce référentiel compte 35 champs nommés explicitement dans `FINDING-allowed-surface.md` (le document
source parle de « 40 champs » sans tous les nommer un par un) ; il est utilisé tel quel comme base
de comptage, marqué `[BASE ~35/40 nommés]` partout où il sert. C'est un choix méthodologique
documenté, pas un guessing : le mandat renvoie explicitement à § 2.3.

---

## Journal de preuve

*(rempli au fur et à mesure, un candidat après l'autre — ordre imposé)*

