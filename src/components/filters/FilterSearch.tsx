/**
 * KYCAR — Champ « Rechercher un filtre » (`EX-SCR-79`/`81`), zone (2)
 * =================================================================================================
 * Distinct du champ `kwd` (`Mot-clé dans l'annonce`, rendu par `PrimaryLine.tsx`) — deux libellés
 * flottants différents pour ne jamais être confondus (`EX-SCR-71`). `Échap` vide le champ.
 */
import { searchFilters } from './filter-search';

export interface FilterSearchProps {
  readonly query: string;
  readonly onQueryChange: (query: string, groupsToExpand: ReadonlySet<string>) => void;
}

export function FilterSearch({ query, onQueryChange }: FilterSearchProps) {
  const result = searchFilters(query);
  const inputId = 'kycar-filter-search';

  return (
    <div class="kycar-filter-search">
      <label for={inputId}>Rechercher un filtre</label>
      <input
        id={inputId}
        type="search"
        value={query}
        placeholder="Rechercher un filtre"
        onInput={(e) => {
          const v = (e.currentTarget as HTMLInputElement).value;
          onQueryChange(v, searchFilters(v).groupsToExpand);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            onQueryChange('', new Set());
          }
        }}
      />
      {query.trim().length > 0 ? (
        <p class="kycar-filter-search__result" role="status">
          {result.matches.length > 0
            ? `${result.matches.length} filtres correspondent`
            : `Aucun filtre ne correspond à « ${query} »`}
        </p>
      ) : null}
    </div>
  );
}
