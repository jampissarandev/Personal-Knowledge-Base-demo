/**
 * `/search?q=<q>&offset=<n>` — full search results page. The `q` and
 * `offset` URL params are the single source of truth (back button
 * works, the page is shareable).
 *
 * Loading: 5 `<SearchResultSkeleton />` rows.
 * Empty: `<SearchResultEmpty />` with a "Create note" CTA.
 * Error: `<SearchResultError />` with a "Retry" button.
 * Loaded: a list of `<SearchResultRow />` with a "Load more" button
 *         at the bottom (hidden when `hits.length >= total`).
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSearch } from '@/hooks/search';
import { mapSearchError } from '@/lib/searchErrors';
import { SearchResultRow } from '@/components/search/SearchResultRow';
import { SearchResultSkeleton } from '@/components/search/SearchResultSkeleton';
import { SearchResultEmpty } from '@/components/search/SearchResultEmpty';
import { SearchResultError } from '@/components/search/SearchResultError';

const PAGE_SIZE = 20;

function pluralise(n: number, q: string): string {
  if (n === 0) return `0 results for “${q}”`;
  if (n === 1) return `1 result for “${q}”`;
  return `${n} results for “${q}”`;
}

export function SearchPage(): React.ReactElement {
  const [params, setParams] = useSearchParams();
  const q = params.get('q')?.trim() ?? '';
  const offset = Number.parseInt(params.get('offset') ?? '0', 10) || 0;
  const [appendedHits, setAppendedHits] = useState<
    Array<{ noteId: string; title: string; snippet: string; score: number }>
  >([]);
  const [loadingMore, setLoadingMore] = useState(false);

  // Page-1 query.
  const firstPage = useSearch({ q, limit: PAGE_SIZE, offset: 0, enabled: q.length > 0 });

  // Reset appended hits whenever `q` changes.
  useEffect(() => {
    setAppendedHits([]);
    setLoadingMore(false);
  }, [q]);

  const initialHits = useMemo(() => firstPage.data?.hits ?? [], [firstPage.data]);
  const allHits = useMemo(
    () => [...initialHits, ...appendedHits],
    [initialHits, appendedHits],
  );
  const total = firstPage.data?.total ?? 0;

  const errorMessage = firstPage.isError
    ? mapSearchError(firstPage.error, 'search_failed').message
    : null;

  const canLoadMore = allHits.length < total;

  const loadMore = () => {
    if (loadingMore || !canLoadMore) return;
    setLoadingMore(true);
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('offset', String(allHits.length));
        return next;
      },
      { replace: true },
    );
  };

  // When `offset` changes (via the "Load more" button), fire a follow-up
  // query and append its hits to `appendedHits`.
  const moreQuery = useSearch({
    q,
    limit: PAGE_SIZE,
    offset,
    enabled: offset > 0 && q.length > 0,
  });
  useEffect(() => {
    if (offset > 0 && moreQuery.data) {
      setAppendedHits((prev) => {
        // De-dup by noteId; protect against React-StrictMode double-fire.
        const seen = new Set(prev.map((h) => h.noteId));
        const merged = [...prev];
        for (const h of moreQuery.data.hits) {
          if (!seen.has(h.noteId)) merged.push(h);
        }
        return merged;
      });
      setLoadingMore(false);
    }
  }, [offset, moreQuery.data]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <Link
          to="/"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Back to all notes
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
        {q.length > 0 && (
          <p className="text-sm text-muted-foreground">{pluralise(total, q)}</p>
        )}
      </div>

      {q.length === 0 && (
        <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">
          Start typing in the search bar above to find your notes.
        </div>
      )}

      {q.length > 0 && firstPage.isLoading && (
        <div
          className="flex flex-col gap-3"
          aria-busy="true"
          aria-live="polite"
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <SearchResultSkeleton key={i} />
          ))}
        </div>
      )}

      {q.length > 0 && firstPage.isError && errorMessage !== null && (
        <SearchResultError
          message={errorMessage}
          onRetry={() => firstPage.refetch()}
        />
      )}

      {q.length > 0 && !firstPage.isLoading && !firstPage.isError && total === 0 && (
        <SearchResultEmpty q={q} />
      )}

      {q.length > 0 && !firstPage.isLoading && !firstPage.isError && total > 0 && (
        <div className="flex flex-col gap-3">
          {allHits.map((hit) => (
            <SearchResultRow key={hit.noteId} hit={hit} />
          ))}
          {canLoadMore && (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={loadMore}
                disabled={loadingMore || moreQuery.isLoading}
                data-testid="search-load-more"
              >
                {loadingMore || moreQuery.isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading…
                  </>
                ) : (
                  <>Load more</>
                )}
              </Button>
            </div>
          )}
          {!canLoadMore && allHits.length > 0 && (
            <p className="pt-2 text-center text-xs text-muted-foreground">
              Showing all {allHits.length} results.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
