import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface PaginationProps {
  cardSelector?: string;
  pageSize?: number;
  paginationContainer: string;
}

const readPageFromUrl = (): number => {
  if (typeof window === 'undefined') return 1;
  const raw = new URLSearchParams(window.location.search).get('page');
  const n = raw ? parseInt(raw, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
};

export default function Pagination({
  cardSelector = '[data-entity-card]',
  pageSize = 6,
  paginationContainer,
}: PaginationProps) {
  const [currentPage, setCurrentPage] = useState<number>(readPageFromUrl);
  const [paginationEl, setPaginationEl] = useState<HTMLElement | null>(null);
  const [totalCards, setTotalCards] = useState(0);
  const rootRef = useRef<HTMLElement | null>(null);
  const pushNextRef = useRef(false);

  useEffect(() => {
    rootRef.current = document.querySelector('[data-filter-target]') ?? document.body;
    const cards = rootRef.current.querySelectorAll<HTMLElement>(cardSelector);
    setTotalCards(cards.length);
    setPaginationEl(document.querySelector<HTMLElement>(paginationContainer));

    const onPopState = () => setCurrentPage(readPageFromUrl());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [cardSelector, paginationContainer]);

  // Apply pagination
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cards = Array.from(root.querySelectorAll<HTMLElement>(cardSelector));
    const totalPages = Math.ceil(cards.length / pageSize);
    const safePage = Math.min(currentPage, totalPages || 1);
    if (safePage !== currentPage) {
      setCurrentPage(safePage);
      return;
    }
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    cards.forEach((card, i) => {
      card.classList.toggle('hidden', i < start || i >= end);
    });
  }, [currentPage, cardSelector, pageSize]);

  // Sync URL with currentPage
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

  const totalPages = Math.ceil(totalCards / pageSize);
  if (!paginationEl || totalPages <= 1) return null;

  return createPortal(
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
  );
}
