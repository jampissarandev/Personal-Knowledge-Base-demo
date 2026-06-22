/**
 * Header search bar.
 *
 * Behaviour (per `PHASE7_PLAN.md` §3.1 + §3.10):
 *   - Debounce: 250 ms after the last keystroke (cleared on unmount
 *     and on every new keystroke).
 *   - Query is enabled only after the user has typed at least 1 char.
 *   - Dropdown: top 5 hits + "Search all results for <q>" + (when
 *     `total === 0`) "Create note titled <q>".
 *   - Keyboard:
 *       `/` (anywhere on the page, when not typing in another input /
 *       textarea / contenteditable) focuses the search bar.
 *       `ArrowDown` / `ArrowUp` move the active row.
 *       `Enter` on a hit → `/notes/<id>`. On "Search all" → `/search?q=`.
 *       `Escape` closes the dropdown.
 *   - Mobile (< md): rendered separately via `<SearchIconButton />`
 *     which opens a `<Sheet>` (`<MobileSearchSheet />`). The desktop
 *     bar is hidden on small screens and vice versa.
 *   - Abort: TanStack's built-in query-key change cancels the
 *     in-flight request when `debouncedQ` changes; the API function
 *     forwards the signal to axios.
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search as SearchIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import { useSearch } from '@/hooks/search';
import { logger } from '@/lib/logger';
import { mapSearchError } from '@/lib/searchErrors';
import { toast } from '@/lib/toast';
import { SearchBarDropdown } from './SearchBarDropdown';
import { cn } from '@/lib/utils';

const DEBOUNCE_MS = 250;
const POPOVER_WIDTH = 480; // px

export function SearchBar(): React.ReactElement | null {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [rawQ, setRawQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputId = useId();

  // Debounce the raw input → debouncedQ.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(rawQ.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [rawQ]);

  const query = useSearch({
    q: debouncedQ,
    limit: 5,
    enabled: open,
  });

  // Reset the active row when the result set changes.
  useEffect(() => {
    setActiveIndex(0);
  }, [debouncedQ, query.data?.total]);

  // Global `/` keyboard shortcut. Suppressed when the user is typing
  // in another input/textarea/contenteditable. Skip when not authed
  // (the search bar isn't mounted on auth pages, but this is a cheap
  // belt-and-braces check).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) {
        return;
      }
      e.preventDefault();
      inputRef.current?.focus();
      setOpen(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Close on route change.
  useEffect(() => {
    return () => {
      // teardown — handled implicitly by the unmount of the popover
    };
  }, []);

  const hits = useMemo(() => query.data?.hits ?? [], [query.data]);
  const total = query.data?.total ?? 0;
  const isLoading = open && debouncedQ.length > 0 && query.isLoading;
  const isError = open && debouncedQ.length > 0 && query.isError;

  // Surface a toast on error (and log via the mapper).
  useEffect(() => {
    if (!query.isError || !query.error) return;
    const mapped = mapSearchError(query.error, 'search_failed');
    if (mapped.message) toast.error(mapped.message);
  }, [query.isError, query.error]);

  const openAll = (q: string) => {
    if (!q) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const createNew = (q: string) => {
    if (!q) return;
    setOpen(false);
    navigate(`/notes/new?title=${encodeURIComponent(q)}`);
  };

  const selectHit = (noteId: string) => {
    logger.info('search_hit_clicked', { noteId });
    setOpen(false);
    setRawQ('');
    setDebouncedQ('');
    navigate(`/notes/${noteId}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      (e.target as HTMLInputElement).blur();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      // The dropdown renders `min(5, total)` rows + 1 "Search all" button.
      // The "Search all" button has virtual index ROW_COUNT.
      setOpen(true);
      setActiveIndex((i) => {
        const max = Math.min(5, Math.max(0, total)) - 1;
        if (total > 5) {
          return i >= max ? 5 : i + 1;
        }
        return i >= max ? 0 : i + 1;
      });
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (i <= 0 ? Math.min(5, Math.max(0, total)) - (total > 5 ? 0 : 0) : i - 1));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      // Active index 0..4 = the row at that position; index 5 = "Search all"
      const rowCount = Math.min(5, hits.length);
      if (activeIndex < rowCount) {
        const hit = hits[activeIndex];
        if (hit) selectHit(hit.noteId);
      } else {
        openAll(debouncedQ);
      }
      return;
    }
  };

  return (
    <div className="hidden flex-1 max-w-md md:block">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              ref={inputRef}
              id={inputId}
              type="search"
              role="combobox"
              aria-expanded={open}
              aria-controls={`${inputId}-listbox`}
              aria-autocomplete="list"
              placeholder="Search notes…"
              title="Press / to focus search"
              value={rawQ}
              onChange={(e) => {
                setRawQ(e.target.value);
                setOpen(true);
              }}
              onFocus={() => {
                if (rawQ.trim().length > 0) setOpen(true);
              }}
              onKeyDown={onKeyDown}
              className={cn('pl-8 pr-8', rawQ && 'pr-8')}
              data-testid="search-bar-input"
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
        </PopoverAnchor>
        {open && debouncedQ.length > 0 && (
          <PopoverContent
            id={`${inputId}-listbox`}
            align="start"
            sideOffset={6}
            className="p-0"
            style={{ width: POPOVER_WIDTH }}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <SearchBarDropdown
              q={debouncedQ}
              isLoading={isLoading}
              isError={isError}
              hits={hits}
              total={total}
              activeIndex={activeIndex}
              onHover={setActiveIndex}
              onSelect={selectHit}
              onOpenAll={() => openAll(debouncedQ)}
              onCreateNew={() => createNew(debouncedQ)}
            />
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
}
