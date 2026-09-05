# Réconciliation des deux vocabulaires AutoScout24

**Statut** : établi par comparaison programmatique le 2026-09-06, sur les deux référentiels déjà
présents dans le dépôt. Aucune requête réseau n'a été nécessaire — donc conforme à E5.

## Le problème

KYCAR dispose de **deux référentiels d'origines différentes**, et la limite L7 de
`docs/reference/AS24-REFERENCE-API.md` laissait ouverte la question de leur correspondance :

| Référentiel | Origine | Ce qu'il décrit |
|---|---|---|
| **Vocabulaire de recherche** — `data/reference/filters.json` | bundle JS du moteur de recherche public (chunk `5007`, module webpack `55200`) | ce qu'un visiteur peut *filtrer* |
| **Vocabulaire de création** — `data/reference/references/*.json` | API officielle `listing-creation.api.autoscout24.com` | ce qu'un concessionnaire peut *déclarer* |

Supposer qu'ils sont interchangeables était l'hypothèse à ne pas faire. Voici le résultat de la
comparaison, code par code.

## Résultat d'ensemble

Sur 14 paires comparées : **8 identiques, 5 partielles, 1 sans rapport**.

| Énumération de recherche | n | Type de référence | n | Codes communs | Verdict |
|---|---:|---|---:|---:|---|
| `gearing` | 3 | `Transmission` | 3 | 3 | **IDENTIQUES** |
| `offer` | 6 | `OfferType` | 6 | 6 | **IDENTIQUES** |
| `drivetrain` | 3 | `Drivetrain` | 3 | 3 | **IDENTIQUES** |
| `bodyColor` | 14 | `BodyColor` | 14 | 14 | **IDENTIQUES** |
| `interiorColor` | 11 | `UpholsteryColor` | 11 | 11 | **IDENTIQUES** |
| `upholstery` | 6 | `UpholsteryType` | 6 | 6 | **IDENTIQUES** |
| `emissionClass` | 11 | `EuEmissionStandard` | 11 | 11 | **IDENTIQUES** |
| `batteryOwnershipType` | 3 | `BatteryOwnershipType` | 3 | 3 | **IDENTIQUES** |
| `bodyType` | 9 | `BodyType` | 66 | 9 | recherche ⊂ création |
| `equipment` | 136 | `Equipment` | 173 | 132 | partiel, écart expliqué |
| `emissionSticker` | 5 | `GermanEmissionsSticker` | 4 | 4 | partiel |
| `country` | 9 | `Country` | 249 | 1 | partiel, finalités différentes |
| `fuelType` | 10 | `FuelType` | 16 | 2 | **PARTIEL AVEC COLLISION** |
| `priceType` | 2 | `PriceLabel` | 6 | 0 | sans rapport |

**Conclusion opérationnelle** : les deux vocabulaires s'alignent sur la majorité des attributs.
Pour ceux-là, un seul jeu de codes suffit et le référentiel officiel apporte les libellés
localisés. Cinq attributs exigent un traitement explicite, détaillé ci-dessous.

---

## PIÈGE 1 — `fuel` : collision de codes

**C'est le point le plus dangereux du référentiel.** Les deux vocabulaires utilisent les codes
`2` et `3` avec des significations **incompatibles** :

| Code | Signification en recherche | Signification en création |
|---|---|---|
| `2` | Électrique/Essence *(hybride essence)* | Super 95 |
| `3` | Électrique/Diesel *(hybride diesel)* | Super Plus 98 |

Un code `2` interprété avec le mauvais dictionnaire transforme un **hybride essence** en
**essence Super 95**. L'erreur est silencieuse : aucune exception, aucune valeur invalide, juste
une donnée fausse qui fausse ensuite toute distribution par carburant.

Les deux vocabulaires ne sont pas au même niveau d'abstraction :

- **recherche** = catégories, codes alphabétiques (sauf les hybrides) :
  `B` Essence, `D` Diesel, `E` Électrique, `C` CNG, `L` GPL, `M` Éthanol, `H` Hydrogène,
  `O` Autres, `2` hybride essence, `3` hybride diesel.
- **création** = types précis, codes numériques :
  `1` Essence 91, `4` Essence E10 91, `5` Super E10 95, `6` Super Plus E10 98, `7` Diesel,
  `8` Diesel écologique, `9` GPL, `10` Gaz naturel H, `11` Gaz naturel L, `12` Électrique,
  `13` Hydrogène, `14` Vegetable oil, `15` Biogas, `16` Ethanol.

**Exigence qui en découle** : le modèle de données KYCAR doit porter un champ `fuelCategory`
distinct d'un éventuel `fuelType`, chacun avec son vocabulaire nommé, et **jamais** un champ
`fuel` unique dont l'interprétation dépendrait de la provenance de la donnée. Une table de
correspondance création → recherche est nécessaire, et elle est *many-to-one* :
`{1, 4, 5, 6}` → `B`, `{7, 8}` → `D`, `{9}` → `L`, `{10, 11}` → `C`, `{12}` → `E`, `{13}` → `H`,
`{16}` → `M`, `{14, 15}` → `O`. Cette table est **déduite des libellés, non relevée** :
`[EXTRAPOLÉ]`, à confirmer avant usage en écriture.

Noter aussi qu'aucun code de création ne correspond aux hybrides `2` et `3` de la recherche :
la granularité hybride existe côté recherche mais pas dans `FuelType`. Elle est probablement
portée par un autre champ du modèle d'annonce — à vérifier dans la spec OpenAPI en phase 2.1.

## PIÈGE 2 — `pricetype` et `PriceLabel` ne décrivent pas la même chose

Les noms se ressemblent, les concepts n'ont aucun rapport :

- `pricetype` (recherche) = **type de vendeur** : `private` Particulier, `dealer` Professionnel.
  Doublon fonctionnel de `customerType` (`P` / `D`) — deux paramètres pour la même notion,
  à trancher en phase 2.1.
- `PriceLabel` (création) = **évaluation du prix par AutoScout24** : `0` Inconnu, `1` Offre top,
  `2` Bonne offre, `3` Offre équitable, `4` Un peu cher, `5` Cher.

Le vrai homologue de `PriceLabel` côté recherche est `priceEvaluation` : `1` Très bon prix,
`2` Bon prix, `3` Prix correct. **Échelles différentes** — 3 niveaux en recherche contre 6 en
création, et la recherche n'expose aucun filtre pour « un peu cher » ou « cher ».

**Intérêt pour KYCAR** : `PriceLabel` est un indicateur d'outlier *déjà calculé par AutoScout24*.
S'il est présent dans les données d'annonce, il constitue un point de comparaison externe pour
notre propre détection d'anomalies — utile pour valider le lot D4.

## ÉCART 3 — `equipment` : 132 codes communs sur 136

L'écart s'explique entièrement et ne révèle aucune incohérence.

**4 codes présents en recherche seulement** — ce sont des filtres agrégés, pas des équipements
élémentaires : `11` 4x4, `40` Aides au stationnement, `6` Sellerie cuir, `111` Taxi ou voiture
de location. Le moteur de recherche offre des regroupements que le formulaire de création
n'a pas besoin d'exposer.

**41 codes présents en création seulement** — équipements d'autres types de véhicules :
`105` Top Case, `106` Poignées chauffantes, `109` Kickstarter (motos), `171` Cuisine à bord,
`179` WC, `181` Baignoire, `182` Douche séparée, `183` Salon avec banquette circulaire
(caravanes et camping-cars). Hors périmètre voiture, donc sans effet sur KYCAR.

## ÉCART 4 — `country` : finalités différentes

- `cy` (recherche) = les **9 places de marché** AutoScout24 : `A` Autriche, `B` Belgique,
  `D` Allemagne, `E` Espagne, `F` France, `I` Italie, `L` Luxembourg, plus la valeur vide
  pour « Europe ». Codes propriétaires à une lettre.
- `Country` (création) = **249 pays**, codes ISO-3166 alpha-2.

Un seul code commun, `L` (Luxembourg en recherche, Liberia en ISO — coïncidence, pas correspondance).
Ces deux listes ne doivent jamais être confondues : `B` vaut Belgique en recherche et Bulgarie
n'existe pas sous ce code, tandis qu'en ISO la Belgique est `BE`.

**Exigence** : KYCAR stocke le pays en ISO alpha-2 et traduit vers le code marketplace au moment
de construire une requête de recherche. Le sens inverse n'est pas ambigu, le sens direct l'est.

## ÉCART 5 — `emissionSticker` : un niveau de plus en recherche

La recherche expose `5` « min. 5 (Bleu) », absent de `GermanEmissionsSticker` qui n'en compte que 4.
Vignette allemande, sans usage pour un périmètre belge — signalé pour complétude, hors périmètre.

---

## Ce que la phase 2.1 doit reprendre

| # | Décision à prendre | Pourquoi elle ne peut pas être différée |
|---|---|---|
| V1 | Deux champs distincts `fuelCategory` et `fuelType`, jamais un champ `fuel` unique | La collision de codes `2`/`3` corrompt les données en silence |
| V2 | Confirmer la table de correspondance création → recherche des carburants | Elle est extrapolée des libellés, pas relevée |
| V3 | Trancher entre `pricetype` et `customerType`, doublons pour le type de vendeur | Deux paramètres pour une notion, l'exigence serait ambiguë |
| V4 | Stocker le pays en ISO alpha-2, traduire vers le code marketplace en sortie | Les deux listes se recouvrent par accident, pas par correspondance |
| V5 | Retenir `PriceLabel` comme référence externe de détection d'outlier si la donnée est disponible | Point de comparaison gratuit pour valider le lot D4 |
| V6 | Localiser les libellés manquants du référentiel officiel (limite L6) | `filters.json` fournit `label_fr` là où l'API rend encore l'anglais |

## Reproduction

Aucun accès réseau. Les deux référentiels sont dans le dépôt, la comparaison se rejoue sur
`data/reference/filters.json` et `data/reference/references/*.json`.
