/**
 * Mobile sheet body — full-width input + a compact result list.
 * Mirrors the desktop dropdown but renders inline (no popover) and
 * uses a tighter result-card shape.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search as SearchIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSearch } from '@/hooks/search';
import { parseSnippet } from '@/lib/parseSnippet';
import { cn } from '@/lib/utils';

const DEBOUNCE_MS = 250;
const ROW_COUNT = 5;

export function MobileSearchSheet(): React.ReactElement {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [rawQ, setRawQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(rawQ.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [rawQ]);

  const query = useSearch({ q: debouncedQ, limit: ROW_COUNT, enabled: true });

  const hits = useMemo(() => query.data?.hits ?? [], [query.data]);
  const total = query.data?.total ?? 0;
  const isLoading = debouncedQ.length > 0 && query.isLoading;
  const isError = debouncedQ.length > 0 && query.isError;

  useEffect(() => {
    // Autofocus the input when the sheet opens.
    inputRef.current?.focus();
  }, []);

  const openAll = (q: string) => {
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const createNew = (q: string) => {
    if (!q) return;
    navigate(`/notes/new?title=${encodeURIComponent(q)}`);
  };

  const selectHit = (noteId: string) => {
    setRawQ('');
    setDebouncedQ('');
    navigate(`/notes/${noteId}`);
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="relative">
        <SearchIcon
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search notes…"
          value={rawQ}
          onChange={(e) => setRawQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              openAll(debouncedQ);
            }
          }}
          className="pl-8 pr-8"
          data-testid="search-bar-input-mobile"
        />
        {rawQ.length > 0 && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setRawQ('');
              setDebouncedQ('');
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      {debouncedQ.length > 0 && (
        <div className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col gap-2 p-1">
              {Array.from({ length: ROW_COUNT }).map((_, i) => (
                <div key={i} className="flex items-start gap-2 px-2 py-2">
                  <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded-sm" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {isError && (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              Search is temporarily unavailable. Please try again.
            </p>
          )}

          {!isLoading && !isError && total === 0 && (
            <div className="flex flex-col gap-2 p-2">
              <p className="text-sm text-muted-foreground">
                No matches for{' '}
                <span className="font-medium text-foreground">“{debouncedQ}”</span>
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => createNew(debouncedQ)}
                className={cn('justify-start')}
              >
                Create note titled “{debouncedQ}”
              </Button>
            </div>
          )}

          {!isLoading && !isError && total > 0 && (
            <>
              {hits.map((hit) => {
                const runs = parseSnippet(hit.snippet);
                return (
                  <button
                    key={hit.noteId}
                    type="button"
                    onClick={() => selectHit(hit.noteId)}
                    className="rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                  >
                    <div className="truncate font-medium">{hit.title}</div>
                    <div className="line-clamp-2 text-xs text-muted-foreground">
                      {runs.length === 0 ? (
                        <span>{hit.snippet}</span>
                      ) : (
                        runs.map((run, i) =>
                          run.mark ? (
                            <mark
                              key={i}
                              className="rounded-sm bg-yellow-200 px-0.5 text-foreground dark:bg-yellow-900"
                            >
                              {run.text}
                            </mark>
                          ) : (
                            <span key={i}>{run.text}</span>
                          ),
                        )
                      )}
                    </div>
                  </button>
                );
              })}
              <Separator className="my-1" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => openAll(debouncedQ)}
                className="justify-start"
              >
                Search all results for “{debouncedQ}”
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
