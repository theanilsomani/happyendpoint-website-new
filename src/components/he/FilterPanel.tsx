import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface FilterFacet {
  key: string;       // e.g. "platform", "category", "tag"
  label: string;
  options: Array<{ value: string; label: string }>;
}

export interface FilterPanelProps {
  facets: FilterFacet[];
  cardSelector?: string;
  heading?: string;
  search?: boolean;
  pageSize?: number;
  paginationContainer?: string;
}

const readPageFromUrl = (): number => {
  if (typeof window === 'undefined') return 1;
  const raw = new URLSearchParams(window.location.search).get('page');
  const n = raw ? parseInt(raw, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
};

export default function FilterPanel({
  facets,
  cardSelector = '[data-entity-card]',
  heading = 'Filters',
  search = true,
  pageSize = 6,
  paginationContainer,
}: FilterPanelProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(readPageFromUrl);
  const [count, setCount] = useState<{ shown: number; total: number }>({ shown: 0, total: 0 });
  const [paginationEl, setPaginationEl] = useState<HTMLElement | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);
  // True when the next URL sync should push history (button click) rather than replace.
  const pushNextRef = useRef(false);

  // Mount: locate filter target + portal target, set up popstate listener.
  useEffect(() => {
    rootRef.current = document.querySelector('[data-filter-target]') ?? document.body;
    const cards = rootRef.current.querySelectorAll<HTMLElement>(cardSelector);
    setCount({ shown: cards.length, total: cards.length });

    if (paginationContainer) {
      setPaginationEl(document.querySelector<HTMLElement>(paginationContainer));
    }

    const onPopState = () => setCurrentPage(readPageFromUrl());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [cardSelector, paginationContainer]);

  // Apply filters whenever values or query change.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cards = Array.from(root.querySelectorAll<HTMLElement>(cardSelector));
    const q = query.trim().toLowerCase();

    // 1. Determine which cards match filters
    const matchingCards = cards.filter(card => {
      const matchesFacets = Object.entries(values).every(([key, val]) => {
        if (!val) return true;
        if (key === 'tag') {
          const tags = (card.dataset.tags ?? '').split(',').map(t => t.trim());
          return tags.includes(val);
        }
        return (card.dataset[key] ?? '') === val;
      });
      const matchesSearch = !q || (card.dataset.search ?? card.textContent ?? '').toLowerCase().includes(q);
      return matchesFacets && matchesSearch;
    });

    // 2. Apply pagination to matching cards
    const totalMatching = matchingCards.length;
    const totalPages = Math.ceil(totalMatching / pageSize);
    const safePage = Math.min(currentPage, totalPages || 1);

    // If current page is now invalid (e.g. filtered down), reset it
    if (safePage !== currentPage) {
      setCurrentPage(safePage);
      return; // effect will re-run
    }

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;

    cards.forEach(card => {
      const isMatching = matchingCards.includes(card);
      const isVisible = isMatching && matchingCards.indexOf(card) >= start && matchingCards.indexOf(card) < end;
      card.classList.toggle('hidden', !isVisible);
    });

    setCount(prev => ({ shown: totalMatching, total: prev.total || cards.length }));
  }, [values, query, cardSelector, currentPage, pageSize]);

  // Sync URL with currentPage. Push on explicit navigation, replace otherwise.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (currentPage === 1) {
      url.searchParams.delete('page');
    } else {
      url.searchParams.set('page', String(currentPage));
    }
    if (url.search === window.location.search) return;

    if (pushNextRef.current) {
      pushNextRef.current = false;
      window.history.pushState({}, '', url.toString());
    } else {
      window.history.replaceState({}, '', url.toString());
    }
  }, [currentPage]);

  const goToPage = (page: number) => {
    pushNextRef.current = true;
    setCurrentPage(page);
  };

  const update = (key: string, value: string) => {
    setValues(v => ({ ...v, [key]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  const reset = () => {
    setValues({});
    setQuery('');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(count.shown / pageSize);

  const hasActiveFilter = useMemo(
    () => Object.values(values).some(v => !!v) || !!query,
    [values, query],
  );

  return (
    <>
      <aside
        className="relative md:sticky md:top-24 h-fit space-y-5 rounded-lg border border-border bg-card p-5"
        style={{ willChange: 'transform' }}
      >
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
              onChange={e => { setQuery(e.target.value); setCurrentPage(1); }}
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

      {paginationEl && totalPages > 1 && createPortal(
        <div className="flex items-center justify-center gap-2 py-4">
          <button
            onClick={() => goToPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground transition hover:border-brand-500 hover:text-brand-600 disabled:opacity-50 disabled:hover:border-border disabled:hover:text-foreground"
            aria-label="Previous page"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>

          <div className="flex items-center gap-1 mx-2">
            <span className="text-sm font-medium text-foreground">Page {currentPage}</span>
            <span className="text-sm text-foreground-muted">of {totalPages}</span>
          </div>

          <button
            onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground transition hover:border-brand-500 hover:text-brand-600 disabled:opacity-50 disabled:hover:border-border disabled:hover:text-foreground"
            aria-label="Next page"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>,
        paginationEl
      )}
    </>
  );
}
