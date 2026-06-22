/**
 * Left-rail folder/tag sidebar. Shows pseudo-folders ("All notes" /
 * "Unfiled"), the user's folders, and the user's tags. A footer
 * button opens the "New folder" dialog. Each folder row has a
 * hover-revealed trash icon → opens the "Delete folder?" alert
 * dialog. Active filter is URL-driven (`?folderId=` / `?tagId=`).
 */
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FolderPlus,
  Inbox,
  Tag as TagIcon,
  FileText,
  FolderOpen,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useFolders } from '@/hooks/folders';
import { useTags } from '@/hooks/tags';
import { useNotes } from '@/hooks/notes';
import { cn } from '@/lib/utils';
import { NewFolderDialog } from './NewFolderDialog';
import { DeleteFolderDialog } from './DeleteFolderDialog';

function Count({ value }: { value: number }) {
  return (
    <span className="ml-auto text-xs tabular-nums text-muted-foreground">
      {value}
    </span>
  );
}

interface RowProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
  trailing?: React.ReactNode;
}

function Row({ active, onClick, icon, label, count, trailing }: RowProps) {
  return (
    <div
      className={cn(
        'group flex items-center gap-1 rounded-md',
        'hover:bg-accent',
        active && 'bg-accent text-accent-foreground',
      )}
    >
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex flex-1 items-center gap-2 px-2 py-1.5 text-sm text-left',
          active && 'font-medium',
        )}
      >
        <span className="text-muted-foreground">{icon}</span>
        <span className="flex-1 truncate">{label}</span>
        {count !== undefined && <Count value={count} />}
      </button>
      {trailing}
    </div>
  );
}

function setOnly(sp: URLSearchParams, key: string, value: string | null) {
  const next = new URLSearchParams(sp);
  if (value === null) {
    next.delete(key);
  } else {
    next.set(key, value);
  }
  if (key === 'folderId') next.delete('tagId');
  if (key === 'tagId') next.delete('folderId');
  return next;
}

export function FolderSidebar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const foldersQuery = useFolders();
  const tagsQuery = useTags();
  const { data: folders = [] } = foldersQuery;
  const { data: tags = [] } = tagsQuery;
  // Compute "All notes" / "Unfiled" counts in the UI. Backend caps at
  // 200; for a personal notes app this is fine. The badge isn't worth
  // a per-folder round-trip.
  const allNotes = useNotes({});
  const unfiledNotes = useNotes({ folderId: null });

  const allCount = allNotes.data?.length ?? 0;
  const unfiledCount = unfiledNotes.data?.length ?? 0;

  const folderId = searchParams.get('folderId');
  const tagId = searchParams.get('tagId');

  const [newOpen, setNewOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const clearAll = useMemo(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('folderId');
    next.delete('tagId');
    return next;
  }, [searchParams]);

  return (
    <nav className="flex h-full flex-col gap-1 p-2 text-sm" aria-label="Folders and tags">
      <Row
        active={folderId === null && tagId === null}
        onClick={() => setSearchParams(clearAll, { replace: true })}
        icon={<FileText className="h-4 w-4" />}
        label="All notes"
        count={allCount}
      />
      <Row
        active={folderId !== null && tagId === null && folderId === ''}
        onClick={() =>
          setSearchParams(setOnly(searchParams, 'folderId', null), { replace: true })
        }
        icon={<FolderOpen className="h-4 w-4" />}
        label="Unfiled"
        count={unfiledCount}
      />

      <Separator className="my-2" />
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Folders
        </span>
      </div>
      {foldersQuery.isLoading ? (
        <div className="flex flex-col gap-1 px-2 py-1" aria-busy="true">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      ) : foldersQuery.isError ? (
        <Alert variant="destructive" className="mx-1">
          <AlertDescription className="text-xs">
            Failed to load folders.{' '}
            <button
              type="button"
              onClick={() => void foldersQuery.refetch()}
              className="underline hover:no-underline"
            >
              Retry
            </button>
          </AlertDescription>
        </Alert>
      ) : folders.length === 0 ? (
        <p className="px-2 py-1 text-xs text-muted-foreground">No folders yet.</p>
      ) : (
        folders.map((f) => (
          <Row
            key={f.id}
            active={folderId === f.id}
            onClick={() =>
              setSearchParams(setOnly(searchParams, 'folderId', f.id), { replace: true })
            }
            icon={<Inbox className="h-4 w-4" />}
            label={f.name}
            count={f.noteCount}
            trailing={
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget({ id: f.id, name: f.name });
                    }}
                    aria-label={`Delete folder ${f.name}`}
                    className="mr-1 rounded-sm p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Delete folder</TooltipContent>
              </Tooltip>
            }
          />
        ))
      )}
      <Button
        variant="ghost"
        size="sm"
        className="mt-1 justify-start"
        onClick={() => setNewOpen(true)}
        aria-label="New folder"
      >
        <FolderPlus className="mr-1 h-4 w-4" />
        New folder
      </Button>

      <Separator className="my-2" />
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Tags
        </span>
      </div>
      {tagsQuery.isLoading ? (
        <div className="flex flex-col gap-1 px-2 py-1" aria-busy="true">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      ) : tagsQuery.isError ? (
        <Alert variant="destructive" className="mx-1">
          <AlertDescription className="text-xs">
            Failed to load tags.{' '}
            <button
              type="button"
              onClick={() => void tagsQuery.refetch()}
              className="underline hover:no-underline"
            >
              Retry
            </button>
          </AlertDescription>
        </Alert>
      ) : tags.length === 0 ? (
        <p className="px-2 py-1 text-xs text-muted-foreground">No tags yet.</p>
      ) : (
        tags.map((t) => (
          <Row
            key={t.id}
            active={tagId === t.id}
            onClick={() =>
              setSearchParams(setOnly(searchParams, 'tagId', t.id), { replace: true })
            }
            icon={<TagIcon className="h-4 w-4" />}
            label={t.name}
          />
        ))
      )}

      <NewFolderDialog open={newOpen} onOpenChange={setNewOpen} />
      <DeleteFolderDialog
        open={deleteTarget !== null}
        folder={deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        onDeleted={(id) => {
          // If the user deleted the currently-filtered folder, clear the filter.
          if (folderId === id) {
            setSearchParams(clearAll, { replace: true });
          }
        }}
      />
    </nav>
  );
}
