/**
 * KYCAR — Page statique « Mentions et méthodologie » (lot D8, /mentions, REQUIREMENTS.md ligne 158)
 * =================================================================================================
 * Contrepartie de la règle « aucune valeur fabriquée » : expose les sources, le périmètre et les
 * limites connues de l'application. Contenu STATIQUE (aucun agrégat), hormis l'entête optionnel de
 * traçabilité du snapshot courant (date de capture, nature REAL/SYNTHETIC) fourni par la coquille.
 */
import type { JSX } from 'preact';

import type { SourceKind } from '../../providers/DataProvider';
import { mentionsProvenanceLabel } from '../../app/source-notice';

export interface MentionsPageProps {
  readonly snapshotDate?: string;
  /**
   * Phase 3.3 (`fixture-provider`) — ÉLARGISSEMENT DE TYPE SEUL, aucun changement de rendu. Le
   * `SourceKind` gelé gagne la valeur `FIXTURE` (jeu fictif versionné) ; cette propriété recopiait
   * l'union au lieu de la référencer, et bloquait donc le type-check de la coquille. Elle référence
   * désormais le type de l'interface gelée, ce qui la met à l'abri de la prochaine valeur.
   *
   * RÉGLÉ EN 3.5 (`mvp-integrate`) : la phrase de provenance ci-dessous ne nommait que `REAL` et
   * `SYNTHETIC` ; un snapshot `FIXTURE` — devenu la source par DÉFAUT (`D3-01`) — n'affichait donc
   * AUCUNE mention de provenance sur la page qui existe précisément pour la porter. Les trois
   * natures sont désormais nommées par `mentionsProvenanceLabel` (`src/app/source-notice.ts`).
   */
  readonly sourceKind?: SourceKind | null;
  readonly providerId?: string;
}

export function MentionsPage(props: MentionsPageProps): JSX.Element {
  return (
    <section class="kycar-mentions" aria-labelledby="kycar-mentions-title">
      <h1 id="kycar-mentions-title">Mentions et méthodologie</h1>

      {props.sourceKind === null || props.sourceKind === undefined ? null : (
        <p class="kycar-mentions-provenance" role="note">
          Données actuellement affichées : <strong>{mentionsProvenanceLabel(props.sourceKind)}</strong>
          {props.providerId ? ` (source : ${props.providerId})` : ''}
          {props.snapshotDate ? ` — capture du ${props.snapshotDate}` : ''}.
        </p>
      )}

      <h2>Ce que montre KYCAR</h2>
      <p>
        KYCAR est un outil d’analyse : il ne liste pas des annonces, il montre la structure
        statistique de l’offre (effectifs, fourchettes de prix, d’année et de kilométrage, puis
        distributions fines) pour faire ressortir les anomalies. Aucune valeur affichée n’est
        inventée : une donnée absente est signalée comme inconnue, jamais comblée.
      </p>

      <h2>Sources et limites de collecte</h2>
      <ul>
        <li>
          Il n’existe aucune API publique de lecture chez la place de marché ciblée. Les agrégats
          proviennent donc, par défaut, d’un <em>jeu de données fictif</em> à la forme AutoScout24 —
          des annonces GÉNÉRÉES, versionnées avec l’application, sans aucun lien avec AutoScout24 ni
          avec une annonce réelle. Les deux autres natures possibles sont un jeu <em>synthétique</em>
          calculé à la volée et un adaptateur de source réelle, lorsqu’il est disponible ; dans les
          trois cas la nature servie est écrite sur tous les écrans, jamais seulement ici.
        </li>
        <li>
          {/* EX-NFR-26 (DR-152) : nommer la source réelle visée et ses conditions d'usage. Idéalement
              exposé depuis `ProviderCapabilities` (src/providers/, hors périmètre fix-screens) plutôt
              qu'en dur ici — voir le rapport de lot, § « Câblage attendu de fix-app ». */}
          La source réelle visée est <strong>2dehands.be</strong> / <strong>marktplaats.nl</strong> (même
          plateforme, groupe Adevinta) : seule la surface autorisée par leur <code>robots.txt</code>{' '}
          est lue, jamais leur API interne. La validation juridique de ce positionnement (AC-01) n’est
          pas levée à ce jour : c’est une hypothèse de travail, pas une autorisation constatée.
        </li>
        <li>
          Une source réelle ne servant qu’un échantillon biaisé par la promotion publicitaire est
          restreinte au mode 1 (agrégats) : les distributions fines du mode 2 basculent alors sur le
          jeu synthétique, signalé comme tel, plutôt que de présenter un échantillon trompeur.
        </li>
        <li>
          Les données sont un instantané périodique, pas un flux temps réel : aucune alerte ni veille
          automatique n’est fournie.
        </li>
      </ul>

      <h2>Protection des données (par conception)</h2>
      <p>
        Le schéma de données exclut structurellement tout champ identifiant un vendeur : nom,
        téléphone, adresse et coordonnées ne franchissent jamais la couche d’ingestion. Cette
        exclusion est une propriété du schéma, pas une simple convention d’affichage.
      </p>

      <h2>Accessibilité</h2>
      <p>
        L’interface vise WCAG 2.1 AA : contrastes vérifiés par calcul, indicateur de focus visible en
        permanence, navigation au clavier des contrôles et libellés explicites.
      </p>
    </section>
  );
}
