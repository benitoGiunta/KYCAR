/**
 * KYCAR — Page statique « Mentions et méthodologie » (lot D8, /mentions, REQUIREMENTS.md ligne 158)
 * =================================================================================================
 * Contrepartie de la règle « aucune valeur fabriquée » : expose les sources, le périmètre et les
 * limites connues de l'application. Contenu STATIQUE (aucun agrégat), hormis l'entête optionnel de
 * traçabilité du snapshot courant (date de capture, nature REAL/SYNTHETIC) fourni par la coquille.
 */
import type { JSX } from 'preact';

export interface MentionsPageProps {
  readonly snapshotDate?: string;
  readonly sourceKind?: 'REAL' | 'SYNTHETIC' | null;
  readonly providerId?: string;
}

export function MentionsPage(props: MentionsPageProps): JSX.Element {
  return (
    <section class="kycar-mentions" aria-labelledby="kycar-mentions-title">
      <h1 id="kycar-mentions-title">Mentions et méthodologie</h1>

      {props.sourceKind === 'REAL' || props.sourceKind === 'SYNTHETIC' ? (
        <p class="kycar-mentions-provenance" role="note">
          Données actuellement affichées :{' '}
          <strong>{props.sourceKind === 'SYNTHETIC' ? 'jeu synthétique de démonstration' : 'marché réel'}</strong>
          {props.providerId ? ` (source : ${props.providerId})` : ''}
          {props.snapshotDate ? ` — capture du ${props.snapshotDate}` : ''}.
        </p>
      ) : null}

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
          Il n’existe aucune API publique de lecture chez la place de marché ciblée ; les agrégats
          proviennent donc soit d’un jeu <em>synthétique</em> clairement étiqueté, soit d’un
          adaptateur de source réelle lorsqu’il est disponible.
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
