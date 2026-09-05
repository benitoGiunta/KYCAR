# Vérification du candidat C-67 — FDZ Ruhr / RWI-GEO-CARMKT

**Contrôle effectué par le coordinateur le 2026-09-06**, parce que `gap-review-1` présentait ce
candidat comme « la seule voie trouvée qui soit licite, au niveau annonce et non hostile » — une
affirmation décisive qui ne pouvait pas entrer au registre sans contrôle.

## Ce qui est confirmé

| Affirmation | Statut | Source |
|---|---|---|
| Le partenariat de données AutoScout24 × RWI existe | **CONFIRMÉ** | annonce FDZ Ruhr, page dataset RWI |
| Diffusion en Scientific Use File avec DOI | **CONFIRMÉ** — `10.7807/as24:carmkt:suf:v2` | page dataset RWI |
| Données au niveau de l'annonce individuelle | **CONFIRMÉ** — « manufacturer, model, year of manufacture, fuel type, mileage, price, and more » | page dataset RWI |
| Gratuité | **CONFIRMÉ** — « The data sets are available free of charge for scientific purposes » | page dataset RWI |
| Formats exploitables | **CONFIRMÉ** — `.csv` et `.parquet` | description FDZ |
| Base de code publiée | **CONFIRMÉ** — dépôt `PThie/RWI-GEO-AS24` | GitHub |

## Ce qui est infirmé

### La Belgique n'est pas dans le périmètre

`gap-review-1` écrit : « la Belgique est nommée dans le périmètre du partenariat ». **Non confirmé.**
La page officielle du jeu de données indique, verbatim :

> Germany (further countries under preparation)

La Belgique n'y est pas nommée. La mention « Europe » apparaît dans le *titre* de la description de
données (« Data on the Used Car Market in Europe »), ce qui a probablement induit l'agent en erreur :
c'est une intention de couverture, pas une couverture effective. La version V2 livrée porte sur
l'**Allemagne seule**.

### Le périmètre temporel est historique, pas courant

> 01/2019 to 12/2024

Ce sont des annonces **passées**, sur une fenêtre close fin 2024. Or la demande du commanditaire est
explicite : KYCAR est « un agrégateur des offres **actuelles** autoscout ». Un jeu de données
historique arrêté il y a plus d'un an ne peut pas alimenter le produit.

### L'usage prévu ne correspond pas à l'usage de KYCAR

> available exclusively for scientific research purposes

L'hypothèse H2 de `00-CONTEXT.md` positionne KYCAR en usage personnel et interne. Ce n'est pas un
usage de recherche scientifique, et l'accès suppose une affiliation institutionnelle et une
convention signée. La fréquence de mise à jour n'est pas publiée, et les conditions de
redistribution ne sont pas explicitées sur la page — deux inconnues supplémentaires.

## Verdict révisé

**C-67 n'est pas une voie d'alimentation de KYCAR.** Trois motifs cumulatifs et indépendants :
mauvais pays, mauvaise période, mauvais usage autorisé.

**Mais c'est un actif de calibration de premier ordre, et il ne doit pas être écarté pour autant.**

Le point ouvert O9 — la représentativité de l'échantillon de 20 annonces par modèle de la surface
autorisée — est le verrou du mode 2 de l'application. Un jeu de données au niveau annonce, exhaustif,
issu d'AutoScout24 lui-même et couvrant 6 ans, est exactement l'instrument qui permet de **mesurer**
ce biais plutôt que de le supposer : on compare la distribution d'un échantillon de 20 annonces à la
distribution vraie du même segment sur le marché allemand, et on obtient la déformation.

Autrement dit : C-67 ne fournit pas les données du produit, il fournit la **preuve que la méthode
du produit est valide**. C'est un rôle différent et il reste précieux.

**Reclassement** : de « voie d'acquisition candidate » vers « instrument de validation
méthodologique ». À rattacher au point ouvert O9 plutôt qu'à O2.

## Conséquence pour la suite

- Phase 1.4 : ne pas dépenser d'effort d'investigation sur C-67 comme source produit. L'investiguer
  au titre de la validation de méthode, avec une question précise — quelle est la déformation d'un
  échantillon de 20 annonces triées par produit publicitaire, par rapport à la distribution vraie ?
- `ACTIONS-COMMANDITAIRE` : l'accès exige une affiliation institutionnelle et une convention. Seul
  le commanditaire peut l'obtenir, et seulement s'il dispose d'un rattachement académique. À
  mentionner sans en faire un prérequis : le produit ne doit pas dépendre de cet accès.
- Vérifier en 1.4 si une **version V3 étendue à d'autres pays** est annoncée avec un calendrier.
  « Further countries under preparation » sans date n'est pas une base de planification.

Sources : [page du jeu de données RWI-GEO-CARMKT](https://www.rwi-essen.de/en/research-advice/further/research-data-center-ruhr-fdz/data-sets/rwi-geo-carmkt) · [catalogue FDZ Ruhr](https://www.rwi-essen.de/en/research-advice/further/research-data-center-ruhr-fdz/data-sets) · [base de code RWI-GEO-AS24](https://github.com/PThie/RWI-GEO-AS24)
