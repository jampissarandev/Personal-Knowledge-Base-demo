/**
 * The dropdown content shown by `<SearchBar />` while the input is
 * focused. Three sections, in order:
 *   1. Top 5 results (one row per hit).
 *   2. A "Search all results for <q>" button (always shown when the
 *      input is non-empty).
 *   3. An empty-state row when `total === 0` (overrides section 1+2).
 *
 * Keyboard: the parent `<SearchBar />` controls `activeIndex` and
 * the `Enter` handler via the row's `data-hit-index` attribute.
 */
import { Search as SearchIcon, FilePlus, CornerDownLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SearchBarDropdownRow } from './SearchBarDropdownRow';
import { cn } from '@/lib/utils';

interface SearchHitLike {
  noteId: string;
  title: string;
  snippet: string;
}

interface SearchBarDropdownProps {
  q: string;
  isLoading: boolean;
  isError: boolean;
  hits: SearchHitLike[];
  total: number;
  activeIndex: number;
  onHover: (index: number) => void;
  onSelect: (noteId: string) => void;
  onOpenAll: () => void;
  onCreateNew: () => void;
}

const SKELETON_KEYS = ['s1', 's2', 's3', 's4', 's5'] as const;
const ROW_COUNT = 5;

export function SearchBarDropdown({
  q,
  isLoading,
  isError,
  hits,
  total,
  activeIndex,
  onHover,
  onSelect,
  onOpenAll,
  onCreateNew,
}: SearchBarDropdownProps): React.ReactElement {
  if (isLoading) {
    return (
      <div
        role="listbox"
        aria-label="Search suggestions"
        className="flex flex-col gap-1 p-1"
      >
        {SKELETON_KEYS.map((k) => (
          <div key={k} className="flex items-start gap-2 px-2 py-2">
            <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded-sm" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-3 py-4 text-sm text-muted-foreground">
        Search is temporarily unavailable. Please try again.
      </div>
    );
  }

  // The "no results" branch — show the create CTA instead of any rows.
  if (total === 0) {
    return (
      <div
        role="listbox"
        aria-label="Search suggestions"
        className="flex flex-col gap-1 p-1"
      >
        <div className="px-2 py-2 text-sm text-muted-foreground">
          No matches for <span className="font-medium text-foreground">“{q}”</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCreateNew}
          className="justify-start"
        >
          <FilePlus className="h-4 w-4" />
          Create note titled “{q}”
        </Button>
      </div>
    );
  }

  // The "has results" branch.
  return (
    <div
      role="listbox"
      aria-label="Search suggestions"
      className="flex flex-col p-1"
    >
      {hits.slice(0, ROW_COUNT).map((hit, i) => (
        <SearchBarDropdownRow
          key={hit.noteId}
          hit={hit}
          folderName={null}
          isActive={i === activeIndex}
          index={i}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}
      <Separator className="my-1" />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        data-testid="search-bar-open-all"
        onClick={onOpenAll}
        className={cn(
          'justify-between',
          activeIndex === ROW_COUNT && 'bg-accent text-accent-foreground',
        )}
      >
        <span className="flex items-center gap-2">
          <SearchIcon className="h-4 w-4" />
          Search all results for “{q}”
        </span>
        <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </div>
  );
}
