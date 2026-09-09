/**
 * KYCAR — Interface `DataProvider`
 * =================================================================================================
 * Phase 2.3 (agent `arch-lead`). Reprise telle quelle par le lot D2.
 *
 * RÔLE
 * ----
 * `DataProvider` est l'UNIQUE porte par laquelle une donnée d'annonce entre dans l'application
 * (règle R2 du PLAN-2, glossaire REQUIREMENTS.md §2). Aucun code métier — moteur d'agrégation (D4),
 * bandeau (D5), écrans (D6/D7) — ne connaît la source. Changer de source est un changement
 * d'implémentation de cette interface, jamais un changement d'application
 * (DECISION-coordinateur-source.md §« Pourquoi l'architecture tient »).
 *
 * TROIS IMPLÉMENTATIONS CIBLES (critère S2 de la phase 2.3)
 * --------------------------------------------------------
 *   1. `SyntheticDataProvider`  (lot D3)      — sourceKind SYNTHETIC, sert mode 1 ET mode 2.
 *   2. `TweedehandsDataProvider` (lot D9)     — sourceKind REAL, sert mode 1 SEULEMENT
 *                                               (échantillon fin biaisé par la pub, mode 2 refusé).
 *   3. `AutoScout24PaidDataProvider` (futur)  — sourceKind REAL, sert mode 1 ET mode 2, sous contrat.
 *
 * LA DISTINCTION MODE 1 / MODE 2 EST STRUCTURELLE DANS L'INTERFACE
 * ---------------------------------------------------------------
 *   - Mode 1 = AGRÉGATS (effectifs, fourchettes par marque/modèle). Alimentable par un
 *     `totalResultCount` exhaustif. TOUT provider DOIT le servir → méthodes obligatoires.
 *   - Mode 2 = DISTRIBUTIONS FINES sur annonces individuelles non biaisées (histogrammes, nuage 3D,
 *     détection d'outliers M1/M2). Exige un échantillon représentatif. Un provider PEUT déclarer ne
 *     pas le servir (`mode2.kind === 'UNAVAILABLE'`) → méthode `fetchListingColumns` alors absente,
 *     et l'application bascule sur le dataset SYNTHETIC (EX-DATA-107) ou affiche l'indisponibilité.
 *
 * FILTRAGE R3 À L'INGESTION, PAS AU RENDU
 * ---------------------------------------
 * Toute implémentation retire les 14 champs vendeur interdits (P-2, EX-NFR-26,
 * FINDING-allowed-surface.md §2.5) AVANT de retourner la moindre ligne. Aucun champ de la liste
 * E1..E14 (annexe A §A.7) ne franchit jamais cette interface. Le type `ListingColumnBatch` ci-dessous
 * n'a, par construction, aucune colonne pour les accueillir (règle R3 « structurelle, pas
 * conventionnelle »).
 *
 * CONTRAT DE VOCABULAIRE
 * ----------------------
 * Les valeurs traversant cette interface sont DÉJÀ normalisées vers le dictionnaire KYCAR
 * (annexe A) : codes énumérés canoniques, unités canoniques (EX-DATA-4), sentinelles typées pour
 * l'inconnu. La re-cartographie du vocabulaire source (ex. attributs 2dehands
 * `constructionYear/mileage/fuel/body` → schéma KYCAR) est le travail interne de l'adaptateur,
 * invisible du reste de l'application (DECISION-coordinateur-source.md §« Ce que cette décision coûte »).
 */

/* ================================================================================================
 * 1. TYPES DE BASE — identifiants, sélection, marketplace
 * ============================================================================================== */

/** Marché couvert par un snapshot. Un provider dessert un et un seul marché à la fois. */
export type Marketplace = 'be' | 'nl';

/**
 * Nature de la donnée. `SYNTHETIC` DOIT être propagé jusqu'à l'UI (EX-DATA-107) : l'utilisateur ne
 * doit jamais confondre une distribution générée avec un marché réel.
 *
 * `FIXTURE` (phase 3.3, PLAN-3) est la troisième nature : un JEU DE DONNÉES FICTIF VERSIONNÉ, à la
 * forme AutoScout24 (`data/fixtures/<profil>/<snapshot>/`), figé et rejouable — ni un marché réel,
 * ni une distribution générée à la volée dans l'onglet. Il doit être étiqueté comme tel jusqu'à
 * l'UI, au même titre que `SYNTHETIC` et pour le même motif : la distinction porte sur ce que
 * l'utilisateur a le droit de croire du chiffre affiché.
 *
 * SEUL élargissement de l'interface gelée admis en phase 3.3 (mission `fixture-provider`) : ajouter
 * une valeur à cette union n'invalide aucune implémentation existante ni aucune donnée déjà écrite.
 */
export type SourceKind = 'REAL' | 'SYNTHETIC' | 'FIXTURE';

/**
 * Identifiant opaque et stable d'un snapshot (EX-DATA-106). Sert de composante des clés d'entité
 * calculée (EX-DATA-114). N'est jamais interprété par le code métier.
 */
export type SnapshotId = string;

/**
 * État de filtres sérialisé, canonique (EX-NAV-9 / EX-DATA-108) :
 *   - filtres triés par identifiant KYCAR croissant,
 *   - valeurs multiples triées par code croissant, jointes par virgule,
 *   - filtres à leur valeur par défaut omis,
 *   - paires `identifiant=valeur` jointes par `;`.
 * C'est cette même chaîne qui sert de clé de cache, de clé d'entité et de base de l'URL partageable.
 * Deux états sémantiquement identiques produisent donc la même `SelectionQuery`.
 */
export type SelectionQuery = string;

/**
 * Sous-ensemble de `SelectionQuery` restreint aux SEULS filtres de classe `T` (EX-SRCH-9bis) : ceux
 * qui exigent un rechargement via `DataProvider`. Hachée en `localDatasetKey` (EX-SRCH-9ter).
 * La composante `T` vide vaut la chaîne réservée `FULL` (snapshot complet).
 * IMPORTANT : c'est le SEUL argument de sélection que `fetchListingColumns` accepte. Les filtres de
 * classe `R` sont appliqués EN MÉMOIRE par le moteur (D4), jamais par le provider — d'où la garantie
 * « un appel provider par valeur distincte de `localDatasetKey`, et un seul » (EX-SRCH-9ter).
 */
export type TSelectionQuery = SelectionQuery;

/** Niveau d'agrégat demandé en mode 1. */
export type AggregateLevel = 'MAKE' | 'MODEL';

/* ================================================================================================
 * 2. CAPACITÉS DU PROVIDER — le point de négociation mode 1 / mode 2
 * ============================================================================================== */

/**
 * Motif pour lequel un provider ne sert pas le mode 2. Documenté, jamais silencieux : il alimente le
 * bandeau affiché à l'utilisateur et le choix du repli.
 */
export type Mode2UnavailabilityReason =
  /** Seul un échantillon biaisé par le produit publicitaire est accessible licitement (cas 2dehands :
   *  pagination plafonnée à ~5 010 annonces, ~95 % promues — DECISION-coordinateur-source.md §audit 1.5). */
  | 'BIASED_SAMPLE'
  /** La donnée fine existe mais est derrière un mur payant/contractuel non souscrit (SEARCH API AS24). */
  | 'PAYWALL'
  /** Anti-bot / surface non autorisée par robots.txt : hors de portée licite. */
  | 'FORBIDDEN_SURFACE'
  /** Le provider est un socle mode 1 par conception et n'a jamais vocation à servir le mode 2. */
  | 'BY_DESIGN';

/**
 * Déclaration de service du mode 2. Union discriminée : c'est ELLE qui exprime formellement
 * « un provider peut servir les agrégats sans servir un échantillon non biaisé ».
 */
export type Mode2Capability =
  | {
      readonly kind: 'SERVED';
      /**
       * Effectif fin maximal qu'une réponse `fetchListingColumns` peut ramener pour une seule
       * `TSelectionQuery`. Borne le dimensionnement mémoire (EX-DATA-112). `null` = pas de plafond
       * imposé par la source (ex. dataset synthétique complet, jusqu'à 10⁶ — EX-NFR-1).
       */
      readonly maxSampleSize: number | null;
    }
  | {
      readonly kind: 'UNAVAILABLE';
      readonly reason: Mode2UnavailabilityReason;
      /**
       * Ce que l'application fait à la place. `SYNTHETIC` : la mécanique du mode 2 tourne sur le
       * dataset synthétique (EX-DATA-107), clairement étiqueté. `NONE` : les écrans de distribution
       * affichent « distributions indisponibles » sans repli.
       */
      readonly fallback: 'SYNTHETIC' | 'NONE';
      /** Message court, en fr-BE, affichable tel quel (EX-NFR-28). */
      readonly detail: string;
    };

/**
 * Où le provider prend ses CHIFFRES DE MODE 1.
 *   - `LISTINGS`        : le provider livre des annonces individuelles ; le moteur (D4) calcule les
 *                         agrégats en mémoire. Cas synthétique et AS24-payant.
 *   - `AGGREGATE_SURFACE`: le provider n'a pas d'annonces exploitables et interroge une surface
 *                         d'agrégats (ex. `totalResultCount` de 2dehands). Les méthodes d'agrégat
 *                         font alors un aller réseau par appel.
 * Cette valeur pilote la couche d'orchestration d'accès aux données, jamais le code de rendu.
 */
export type Mode1Source = 'LISTINGS' | 'AGGREGATE_SURFACE';

export interface ProviderCapabilities {
  readonly providerId: string;
  /** Écrit tel quel dans `Snapshot.providerVersion` (EX-DATA-106) pour la traçabilité. */
  readonly providerVersion: string;
  readonly marketplace: Marketplace;
  readonly sourceKind: SourceKind;
  readonly mode1: { readonly source: Mode1Source };
  /** Le pivot mode 1 / mode 2. */
  readonly mode2: Mode2Capability;
}

/* ================================================================================================
 * 3. MÉTADONNÉES DE SNAPSHOT (EX-DATA-106)
 * ============================================================================================== */

/**
 * Descripteur d'un snapshot ouvert. Reprend les champs de qualité de `Snapshot` (EX-DATA-106) utiles
 * à l'UI et aux invariants. `announcedListingCount` est le dénominateur de `sampleCoverage` ;
 * `null` (INCONNU) si la source ne le fournit pas (ARB-01).
 */
export interface SnapshotDescriptor {
  readonly snapshotId: SnapshotId;
  readonly marketplace: Marketplace;
  /** ISO-8601. */
  readonly capturedAt: string;
  readonly sourceKind: SourceKind;
  readonly providerVersion: string;
  /** Effectif d'annonces effectivement ingérées et exposables par ce provider. */
  readonly listingCount: number;
  /** Effectif total annoncé par la source (dénominateur de couverture d'échantillon), ou `null`. */
  readonly announcedListingCount: number | null;
  readonly rejectedCount: number;
  readonly rejectedByReason: Readonly<Record<string, number>>;
  readonly duplicateListingCount: number;
  readonly duplicateValueConflictCount: number;
  /** Par champ, nombre d'annonces à valeur absente/inconnue — rend la couverture métrique auditable. */
  readonly unknownCountByField: Readonly<Record<string, number>>;
  readonly ingestFlagCounts: Readonly<Record<string, number>>;
  readonly versionStrippedRate: number;
  readonly coverageNote: string | null;
}

/** Poignée d'un snapshot actif. L'application n'en détient qu'un à la fois (EX-NAV-23, ARB-49). */
export interface SnapshotHandle {
  readonly descriptor: SnapshotDescriptor;
}

/* ================================================================================================
 * 4. AGRÉGATS — MODE 1 (obligatoire pour tout provider)
 * ============================================================================================== */

/**
 * Fourchette d'une métrique. Les percentiles sont exacts (EX-DATA-111). `p05`/`p95` alimentent la
 * « fourchette centrale » de l'écran A ; `min`/`max` bruts alimentent l'écran B (A-05, R-A05).
 * `null` = non calculable faute d'effectif suffisant sur la métrique.
 */
export interface MetricRange {
  readonly min: number | null;
  readonly max: number | null;
  readonly p05: number | null;
  readonly p50: number | null;
  readonly p95: number | null;
  /** Effectif sur lequel la métrique est calculable (numérateur de la couverture métrique). */
  readonly n: number;
}

/**
 * Avertissements de couverture d'un agrégat (EX-DATA-68, `coverageWarning`). Les trois booléens de
 * métrique ; le quatrième drapeau de la table d'EX-DATA-68, `samplingBias`, est porté à part sur
 * l'agrégat (D8-10) parce qu'il ne qualifie pas une métrique mais l'échantillon entier.
 * `true` = la couverture métrique de ce bloc est sous le seuil et l'écran doit le dire.
 */
export interface CoverageWarning {
  readonly price: boolean;
  readonly year: boolean;
  readonly mileage: boolean;
}

/**
 * Effectif par code de `KYCAR_AD_TIER` (EX-DATA-68, `adTierDistribution` — 5 entiers). Renseigné
 * par le provider RÉEL seulement : le palier publicitaire est une propriété de la source.
 */
export type AdTierDistribution = Readonly<Record<string, number>>;

/** Agrégat par marque (EX-DATA §B.3). Aucune donnée d'annonce individuelle. */
export interface MakeAggregate {
  readonly makeId: number;
  readonly listingCount: number;
  readonly price: MetricRange;
  readonly mileage: MetricRange;
  readonly year: MetricRange;
  /** `listingCount / announcedCount`, ou `null` (EX-DATA / glossaire). Publiée seulement si sélection
   *  vide ; vaut le drapeau `NON_APPLICABLE` sinon — porté par un champ distinct côté moteur. */
  readonly sampleCoverage: number | null;
  /**
   * NORMATIF (D8-10, FV-02) — `|{ l.modelId : l ∈ A_k, l.modelId ≠ INCONNU }|` (EX-DATA-68 /
   * EX-DATA-71) : les modèles DISTINCTS présents dans la sélection, jamais ceux du référentiel.
   * Champ OBLIGATOIRE : `null` signifie « le provider ne l'a pas calculé », et l'écran affiche
   * alors « — », JAMAIS `0` — c'est exactement le « 0 modèles » de FV-02 que ce champ supprime.
   */
  readonly modelCount: number | null;
  /** EX-DATA-68 — trois booléens de couverture métrique. Absent = non calculé (D8-10). */
  readonly coverageWarning?: CoverageWarning;
  /** EX-DATA-68 — quatrième drapeau de `coverageWarning` : l'échantillon est biaisé. */
  readonly samplingBias?: boolean;
  /** EX-DATA-68 — effectif par code de `KYCAR_AD_TIER` (provider réel seulement). */
  readonly adTierDistribution?: AdTierDistribution;
}

/** Agrégat par couple marque/modèle (EX-DATA §B.4). `modelId === 0` = « Modèle non identifié » (EX-DATA-72). */
export interface ModelAggregate {
  readonly makeId: number;
  readonly modelId: number;
  readonly listingCount: number;
  readonly price: MetricRange;
  readonly mileage: MetricRange;
  readonly year: MetricRange;
  readonly sampleCoverage: number | null;
  /** EX-DATA-68 — trois booléens de couverture métrique. Absent = non calculé (D8-10). */
  readonly coverageWarning?: CoverageWarning;
  /** EX-DATA-68 — quatrième drapeau de `coverageWarning` : l'échantillon est biaisé. */
  readonly samplingBias?: boolean;
  /** EX-DATA-68 — effectif par code de `KYCAR_AD_TIER` (provider réel seulement). */
  readonly adTierDistribution?: AdTierDistribution;
}

/** Résultat d'une requête d'agrégats mode 1, avec le contexte nécessaire à l'étiquetage à l'écran. */
export interface AggregateResult<T extends MakeAggregate | ModelAggregate> {
  readonly snapshotId: SnapshotId;
  /** La sélection effectivement appliquée (canonique), pour l'étiquetage de la base de comparaison. */
  readonly selection: SelectionQuery;
  /** Effectif total de la sélection (avant regroupement) — le `<n> offres` d'EX-SCR-46. */
  readonly selectionCount: number;
  readonly rows: readonly T[];
  /**
   * NORMATIF (D-03) — identifiants de filtre présents dans la sélection que le provider n'a PAS
   * appliqués. Un consommateur ne doit JAMAIS présenter l'effectif comme filtré si cette liste est
   * non vide : `selectionCount` et `rows` portent alors une sélection PARTIELLE. Le contrôleur
   * passe dans l'état dégradé `ET-FILTRE-NON-APPLIQUE` en nommant les filtres de cette liste, et
   * `hasUserFilters` ne reflète que les filtres effectivement appliqués. Liste vide = la sélection
   * a été appliquée intégralement.
   */
  readonly unsupportedFilterIds: readonly string[];
}

/* ================================================================================================
 * 5. ANNONCES INDIVIDUELLES — MODE 2 (optionnel)
 * ============================================================================================== */

/**
 * Lot d'annonces en disposition COLONNAIRE (EX-DATA-119), prêt à être chargé dans le moteur sans
 * transposition. Chaque `TypedArray` a `rowCount` éléments. Les sentinelles d'inconnu sont typées
 * (EX-DATA-120) : `-1` pour les grandeurs positives, `255` pour les énumérations sur un octet.
 *
 * AUCUNE colonne vendeur (R3). La zone de chaînes (`stringBlob` + `stringOffsets`) ne porte que
 * `listingUrl` (deeplink public) et les champs de version — jamais un nom, un téléphone, une adresse.
 */
export interface ListingColumnBatch {
  readonly snapshotId: SnapshotId;
  /** Clé du jeu local (EX-SRCH-9ter) : hachage canonique de la composante `T`, ou `FULL`. */
  readonly localDatasetKey: string;
  readonly rowCount: number;

  // --- Identité (jamais lue pendant un balayage de sélection sauf forage) ---
  /** 16 octets par ligne (UUID binaire), `rowCount * 16` de long (EX-DATA-119). */
  readonly listingId: Uint8Array;

  // --- Colonnes numériques du chemin chaud (EX-DATA-119) ---
  readonly priceEur: Int32Array;                    // sentinelle -1
  readonly mileageKm: Int32Array;                   // sentinelle -1
  readonly firstRegistrationYearMonth: Int32Array;  // 12*année + (mois-1), sentinelle -1
  readonly modelId: Int32Array;                     // 0 = non résolu
  readonly makeId: Int32Array;                      // ids AutoScout24 réels > 32 767 (D-02, DR-007)
  readonly modelYear: Int16Array;                   // sentinelle -1
  readonly powerKw: Int16Array;                     // sentinelle -1
  readonly co2EmissionsGPerKmX10: Int16Array;       // sentinelle -1
  readonly consumptionCombinedL100KmX10: Int16Array;// sentinelle -1
  readonly electricRangeKm: Int16Array;             // sentinelle -1

  // --- Colonnes énumérées sur un octet (EX-DATA-119, sentinelle 255) ---
  readonly fuelCategory: Uint8Array;
  readonly bodyType: Uint8Array;
  readonly transmission: Uint8Array;
  readonly drivetrain: Uint8Array;
  readonly offerType: Uint8Array;
  readonly usageState: Uint8Array;
  readonly sellerType: Uint8Array;       // TYPE de vendeur (particulier/pro) — NON identifiant, autorisé
  readonly regionCode: Uint8Array;       // NUTS-2 uniquement (P-3) — jamais le code postal exact
  readonly countryCode: Uint8Array;
  readonly priceStatus: Uint8Array;      // QUOTED / ON_REQUEST / MISSING
  readonly priceEvaluationCategory: Uint8Array; // référence externe AS24 (M3), contrôle seulement
  readonly adTier: Uint8Array;
  readonly bodyColor: Uint8Array;
  readonly upholsteryType: Uint8Array;
  readonly euEmissionStandard: Uint8Array;
  readonly doorCount: Uint8Array;
  readonly seatCount: Uint8Array;
  readonly previousOwnerCount: Uint8Array;
  readonly imageCount: Uint8Array;
  /**
   * TVA déductible (`EX-SCR-203` colonne « TVA », annexe A champ # 10 `isTaxDeductible`). Colonne
   * ajoutée par D8-08 / DR-082 : le booléen optionnel de la source a TROIS états et une colonne
   * booléenne n'aurait pas su dire « inconnu ». Encodage TRI-ÉTAT, seule colonne du lot dont
   * l'inconnu vaut `0` et non `255` (`VAT_DEDUCTIBLE` dans `src/types`) :
   *   0 = INCONNU (la source ne porte pas l'information) · 1 = NON déductible · 2 = OUI déductible.
   */
  readonly vatDeductible: Uint8Array;

  // --- Drapeaux de bits (booléens + ingestFlags, dont PRICE_SENTINEL_ABSOLUTE — R-A06) ---
  readonly booleanFlags: Uint16Array;
  /**
   * Masque positionnel des drapeaux d'ingestion (EX-DATA-45) : bit = rang du code dans
   * `INGEST_FLAG_VALUES`, correspondance matérialisée par `INGEST_FLAG_BIT` (src/types). 32 bits
   * depuis D-01 / DR-013 — les 17 codes d'EX-DATA-45 ne tenaient pas dans les 16 bits gelés en 2.3,
   * le 17e (`MARKETPLACE_UNMAPPED`, repli d'ARB-60) étant instockable.
   */
  readonly ingestFlags: Uint32Array;

  // --- Zone de chaînes contiguë (EX-DATA-121), lue hors du chemin chaud ---
  /** Concaténation UTF-8 de tous les champs textuels. */
  readonly stringBlob: Uint8Array;
  /**
   * Offsets dans `stringBlob`. `STRINGS_PER_ROW` champs par ligne, dans l'ordre :
   * [listingUrl, modelVersionRaw, modelVersionClean, fuelSourceLabelRaw, trimTokens].
   * `stringOffsets[(row * STRINGS_PER_ROW + field) ]` = début, l'élément suivant = fin.
   */
  readonly stringOffsets: Uint32Array;
}

/** Nombre de champs textuels par ligne dans `ListingColumnBatch.stringOffsets`. */
export const STRINGS_PER_ROW = 5;

/* ================================================================================================
 * 6. L'INTERFACE
 * ============================================================================================== */

export interface DataProvider {
  /* ---- Cycle de vie & capacités (tout provider) ---------------------------------------------- */

  /** Déclare les capacités du provider, dont le service (ou non) du mode 2. Synchrone : appelable
   *  avant toute I/O, pour que l'orchestration choisisse le chemin de données (LISTINGS vs AGGREGATE). */
  describe(): ProviderCapabilities;

  /**
   * Acquiert LE snapshot actif (EX-NAV-23). Appelée au démarrage et à chaque action `Rafraîchir`
   * (EX-NAV-24). Aucune acquisition automatique en cours de session (ARB-49).
   * Doit respecter le budget d'échec d'EX-NFR-21 (délai 5 000 ms) — la politique de réessai (3
   * tentatives, 1s/2s/4s) est portée par l'orchestration, pas par le provider.
   */
  openSnapshot(request?: OpenSnapshotRequest): Promise<SnapshotHandle>;

  /** Libère les ressources d'un snapshot (fermeture d'onglet, remplacement). Idempotente. */
  closeSnapshot(handle: SnapshotHandle): Promise<void>;

  /* ---- MODE 1 : agrégats (OBLIGATOIRE pour tout provider) ------------------------------------ */

  /**
   * Agrégats de la sélection VIDE, précalculés et persistés avec le snapshot (EX-DATA-109) : le
   * mode 1 sans filtre s'affiche sans balayage. C'est cet appel, léger (~1,7 Mo → ~400 Ko gzip),
   * qui permet le premier affichage utile sous le budget d'EX-NFR-9 (≤ 2 000 ms en 4G) SANS attendre
   * le chargement des annonces individuelles.
   */
  fetchBaselineAggregates(handle: SnapshotHandle): Promise<AggregateResult<MakeAggregate>>;

  /**
   * Agrégats mode 1 pour une sélection quelconque (à la volée — EX-DATA-109).
   *   - Provider `LISTINGS`  : calculé en mémoire par le moteur (l'implémentation délègue au moteur).
   *   - Provider `AGGREGATE_SURFACE` : interroge la surface d'agrégats de la source.
   * `level = 'MODEL'` avec `makeScope` renseigné restreint aux modèles d'une marque (zones-modèles
   * d'une carte). Sans `makeScope`, retourne tous les modèles de la sélection.
   */
  fetchAggregates(
    handle: SnapshotHandle,
    selection: SelectionQuery,
    level: AggregateLevel,
    makeScope?: number,
  ): Promise<AggregateResult<MakeAggregate | ModelAggregate>>;

  /**
   * Effectif d'annonces d'une sélection, sans les agrégats (EX-SRCH-21 : le compteur partage le cycle
   * de recalcul mais peut être demandé seul, ex. `effectifInitial` d'une recherche sauvegardée
   * EX-CRUD-1). Toujours relatif au jeu de données courant (EX-SRCH-9quater).
   */
  /*
   * D-03 : `fetchSelectionCount` rend un NOMBRE et n'a donc pas de résultat structuré où loger
   * `unsupportedFilterIds`. Le contrat de non-publication reste entier : un appelant qui a besoin
   * de savoir si la sélection a été appliquée intégralement lit `unsupportedFilterIds` sur
   * `fetchAggregates` (même sélection, même provider, même table de correspondance) avant de
   * présenter un effectif comme filtré.
   */
  fetchSelectionCount(handle: SnapshotHandle, selection: SelectionQuery): Promise<number>;

  /* ---- MODE 2 : échantillon fin / distributions (OPTIONNEL) --------------------------------- */

  /**
   * Retourne le JEU DE DONNÉES LOCAL (colonnaire) correspondant à une composante `T` (EX-SRCH-9ter) :
   * la matière première des histogrammes (G1–G3), du nuage (G4), de la densité (G7) et de la
   * détection d'outliers M1/M2. Les filtres de classe `R` NE sont PAS appliqués ici — le moteur les
   * applique en mémoire sur ce lot.
   *
   * PRÉSENTE SI ET SEULEMENT SI `describe().mode2.kind === 'SERVED'`. Un provider mode 1 seul
   * (2dehands) OMET cette méthode : le champ est optionnel, et l'orchestration ne l'appelle jamais
   * quand `mode2.kind === 'UNAVAILABLE'` — elle bascule alors sur le provider synthétique de repli
   * ou affiche l'indisponibilité (EX-DATA-107). C'est le point exact où l'interface « exprime qu'un
   * provider peut servir les agrégats sans servir un échantillon non biaisé ».
   *
   * Contrat de non-fusion (EX-SRCH-9ter) : la réponse REMPLACE intégralement le jeu local ; jamais
   * d'union avec un lot précédent. Un appel par `localDatasetKey` distinct, et un seul.
   */
  fetchListingColumns?(handle: SnapshotHandle, tSelection: TSelectionQuery): Promise<ListingColumnBatch>;

  /**
   * Résout un petit ensemble d'annonces par identifiant, pour le forage d'un point du nuage ou une
   * page de l'écran D (EX-NAV-2bis) quand le jeu local n'est pas déjà en mémoire. Optionnelle, même
   * condition de présence que `fetchListingColumns`. Ne retourne, elle aussi, aucun champ vendeur (R3).
   */
  fetchListingsByIds?(handle: SnapshotHandle, listingIds: readonly string[]): Promise<ListingColumnBatch>;
}

/** Paramètres facultatifs d'ouverture de snapshot. */
export interface OpenSnapshotRequest {
  /** Force une acquisition fraîche plutôt que le dernier snapshot en cache (EX-NFR-22). */
  readonly forceRefresh?: boolean;
  /** Délai maximal d'acquisition en ms (défaut : 5 000, EX-NFR-21). */
  readonly timeoutMs?: number;
}

/* ================================================================================================
 * 7. GARDE-FOU DE TYPE — mode 2 servi
 * ============================================================================================== */

/**
 * Rétrécit un `DataProvider` à un provider qui sert le mode 2, garantissant la présence de
 * `fetchListingColumns`. Le code métier n'appelle jamais `fetchListingColumns` sans ce garde.
 */
export function servesMode2(
  p: DataProvider,
): p is DataProvider & Required<Pick<DataProvider, 'fetchListingColumns'>> {
  return p.describe().mode2.kind === 'SERVED' && typeof p.fetchListingColumns === 'function';
}
