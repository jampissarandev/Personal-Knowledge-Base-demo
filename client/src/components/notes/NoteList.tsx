/**
 * The dashboard's middle pane. Renders the Pinned + Recent sections
 * when no filter is active, or a single "Notes" section when a folder
 * or tag filter is applied. Loading / empty / error states are
 * handled inline.
 */
import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Pin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotes } from '@/hooks/notes';
import { useFolders } from '@/hooks/folders';
import { ApiError } from '@/api/client';
import { NoteCard } from './NoteCard';
import { NoteListSkeleton } from './NoteListSkeleton';
import { NoteListEmpty } from './NoteListEmpty';
import { NoteListError } from './NoteListError';
import { forwardSearchParam } from '@/lib/nextPath';

const PINNED_CAP = 6;
const RECENT_CAP = 20;

export function NoteList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: folders = [] } = useFolders();

  const folderId = searchParams.get('folderId');
  const tagId = searchParams.get('tagId');
  const hasFilter = folderId !== null || tagId !== null;

  // Build the active filter object for the backend query. We pass
  // `null` (not `undefined`) for folderId when the user picked the
  // "Unfiled" pseudo-folder, and `undefined` when no filter is set.
  const filter = useMemo(() => {
    if (folderId !== null) {
      return tagId !== null
        ? { folderId, tagId }
        : { folderId };
    }
    if (tagId !== null) {
      return { tagId };
    }
    return {};
  }, [folderId, tagId]);

  const query = useNotes(hasFilter ? filter : {});

  // When no filter, also fetch the pinned list (separate query key).
  const pinnedQuery = useNotes(
    hasFilter ? { isPinned: true } : { isPinned: true, limit: PINNED_CAP },
  );

  const filterChipLabel = useMemo(() => {
    if (folderId !== null) {
      const f = folders.find((x) => x.id === folderId);
      return { key: 'folderId', label: f ? `In: ${f.name}` : 'In: Unknown' };
    }
    if (tagId !== null) {
      return { key: 'tagId', label: `Tagged` };
    }
    return null;
  }, [folderId, tagId, folders]);

  const clearFilter = () => {
    if (!filterChipLabel) return;
    const qs = forwardSearchParam(searchParams, filterChipLabel.key, null);
    setSearchParams(new URLSearchParams(qs.startsWith('?') ? qs.slice(1) : qs));
  };

  if (query.isLoading) {
    return <NoteListSkeleton />;
  }

  if (query.isError) {
    const msg =
      query.error instanceof ApiError
        ? query.error.message
        : 'Unable to load notes.';
    return <NoteListError message={msg} onRetry={() => void query.refetch()} />;
  }

  const notes = query.data ?? [];
  const pinned = hasFilter
    ? notes.filter((n) => n.isPinned)
    : (pinnedQuery.data ?? []);

  if (!hasFilter && notes.length === 0) {
    return <NoteListEmpty />;
  }

  if (hasFilter && notes.length === 0) {
    return (
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          {filterChipLabel && (
            <Badge variant="secondary" className="gap-1 font-normal">
              {filterChipLabel.label}
              <button
                type="button"
                onClick={clearFilter}
                aria-label="Clear filter"
                className="ml-1 rounded-sm hover:bg-secondary/80"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">No notes match this filter.</p>
      </div>
    );
  }

  const recent = hasFilter ? notes : notes.slice(0, RECENT_CAP);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          {filterChipLabel && (
            <Badge variant="secondary" className="gap-1 font-normal">
              {filterChipLabel.label}
              <button
                type="button"
                onClick={clearFilter}
                aria-label="Clear filter"
                className="ml-1 rounded-sm hover:bg-secondary/80"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => navigate('/notes/new')}
          aria-label="New note"
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          New note
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {hasFilter ? (
          <section>
            <h2 className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Notes ({notes.length})
            </h2>
            <div className="space-y-1">
              {notes.map((n) => (
                <NoteCard key={n.id} note={n} />
              ))}
            </div>
          </section>
        ) : (
          <>
            {pinned.length > 0 && (
              <section className="mb-3">
                <h2 className="flex items-center gap-1 px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Pin className="h-3 w-3" />
                  Pinned ({pinned.length})
                </h2>
                <div className="space-y-1">
                  {pinned.map((n) => (
                    <NoteCard key={n.id} note={n} />
                  ))}
                </div>
              </section>
            )}
            <section>
              <h2 className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Recent
              </h2>
              <div className="space-y-1">
                {recent.map((n) => (
                  <NoteCard key={n.id} note={n} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
