import { useEffect, useMemo, useRef, useState } from 'react';

export interface FilterFacet {
  key: string;       // e.g. "platform", "category", "tag"
  label: string;
  options: Array<{ value: string; label: string }>;
}

export interface FilterPanelProps {
  /**
   * Facet definitions. Empty values act as "all".
   */
  facets: FilterFacet[];
  /**
   * Selector that identifies filterable cards (default: [data-entity-card]).
   * Each card must expose data attributes whose names match the facet keys,
   * e.g. data-platform="propertyfinder", and data-tags="comma,separated".
   * The data-search attribute supplies text to the search facet.
   */
  cardSelector?: string;
  /** Heading shown above the filters on mobile/desktop. */
  heading?: string;
  /** Whether to show a text search input. */
  search?: boolean;
}

export default function FilterPanel({
  facets,
  cardSelector = '[data-entity-card]',
  heading = 'Filters',
  search = true,
}: FilterPanelProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');
  const [count, setCount] = useState<{ shown: number; total: number }>({ shown: 0, total: 0 });
  const rootRef = useRef<HTMLElement | null>(null);

  // Resolve the container that hosts the cards once on mount.
  useEffect(() => {
    rootRef.current = document.querySelector('[data-filter-target]') ?? document.body;
    const cards = rootRef.current.querySelectorAll<HTMLElement>(cardSelector);
    setCount({ shown: cards.length, total: cards.length });
  }, [cardSelector]);

  // Apply filters whenever values or query change.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cards = root.querySelectorAll<HTMLElement>(cardSelector);
    const q = query.trim().toLowerCase();

    let shown = 0;
    cards.forEach(card => {
      const matchesFacets = Object.entries(values).every(([key, val]) => {
        if (!val) return true;
        if (key === 'tag') {
          const tags = (card.dataset.tags ?? '').split(',').map(t => t.trim());
          return tags.includes(val);
        }
        return (card.dataset[key] ?? '') === val;
      });
      const matchesSearch = !q || (card.dataset.search ?? card.textContent ?? '').toLowerCase().includes(q);
      const show = matchesFacets && matchesSearch;
      card.classList.toggle('hidden', !show);
      if (show) shown++;
    });

    setCount(prev => ({ shown, total: prev.total || cards.length }));
  }, [values, query, cardSelector]);

  const update = (key: string, value: string) => {
    setValues(v => ({ ...v, [key]: value }));
  };

  const reset = () => {
    setValues({});
    setQuery('');
  };

  const hasActiveFilter = useMemo(
    () => Object.values(values).some(v => !!v) || !!query,
    [values, query],
  );

  return (
    <aside className="sticky top-20 space-y-5 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-muted">{heading}</h2>
        {hasActiveFilter && (
          <button
            type="button"
            onClick={reset}
            className="text-xs text-brand-600 hover:underline"
          >
            Reset
          </button>
        )}
      </div>

      {search && (
        <label className="block">
          <span className="sr-only">Search</span>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-foreground-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>
      )}

      {facets.map(facet => (
        <div key={facet.key} className="space-y-2">
          <label className="block text-xs font-medium uppercase tracking-wide text-foreground-muted">
            {facet.label}
          </label>
          <select
            value={values[facet.key] ?? ''}
            onChange={e => update(facet.key, e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All</option>
            {facet.options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      <p className="border-t border-border pt-3 text-xs text-foreground-muted">
        Showing {count.shown} of {count.total}
      </p>
    </aside>
  );
}
