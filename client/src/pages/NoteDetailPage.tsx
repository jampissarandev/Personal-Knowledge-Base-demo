/**
 * Read-only note view at `/notes/:id`. Loads the note via `useNote`,
 * renders the title row (with pin / edit / delete icon buttons), the
 * metadata strip (folder + tags + relative time), and the TipTap
 * read-only mount of the content.
 *
 * Error semantics:
 *  - 404 (`NOTE_NOT_FOUND`) → navigate to `/` and toast.
 *  - other errors → inline alert with a Retry button.
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useNote } from '@/hooks/notes';
import { ApiError } from '@/api/client';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { PinButton } from '@/components/notes/PinButton';
import { DeleteNoteDialog } from '@/components/notes/DeleteNoteDialog';
import { TagChip } from '@/components/notes/TagChip';
import { FolderBadge } from '@/components/notes/FolderBadge';
import { useRelativeTime } from '@/lib/formatRelativeTime';
import { toast } from '@/lib/toast';

export function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const noteId = id ?? '';
  const query = useNote(noteId);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // 404 → redirect to dashboard with a toast.
  useEffect(() => {
    if (query.isError && query.error instanceof ApiError && query.error.code === 'NOTE_NOT_FOUND') {
      toast.error('Note not found.');
      navigate('/', { replace: true });
    }
  }, [query.isError, query.error, navigate]);

  if (query.isLoading) {
    return (
      <div className="space-y-3 p-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load note</AlertTitle>
          <AlertDescription>
            {query.error instanceof ApiError ? query.error.message : 'Unknown error.'}
          </AlertDescription>
        </Alert>
        <div className="mt-3 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const note = query.data;
  if (!note) {
    return null; // 404 effect above will redirect.
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2 border-b px-4 py-3">
        <div className="min-w-0 flex-1">
          <Link
            to="/"
            className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to notes
          </Link>
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {note.title || 'Untitled'}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <PinButton noteId={note.id} pinned={note.isPinned} />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Edit note"
            onClick={() => navigate(`/notes/${note.id}/edit`)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete note"
            onClick={() => setDeleteOpen(true)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border-b px-4 py-2">
        <MetadataStrip
          folderName={note.folderName}
          tags={note.tags}
          updatedAt={note.updatedAt}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <RichTextEditor
          editable={false}
          initialContent={note.contentJson}
          minHeight="auto"
        />
      </div>

      <DeleteNoteDialog
        open={deleteOpen}
        note={{ id: note.id, title: note.title }}
        onOpenChange={setDeleteOpen}
        onDeleted={() => {
          // Toast is fired by `useDeleteNote`; this callback only
          // handles the navigation after the deletion completes.
          navigate('/', { replace: true });
        }}
      />
    </div>
  );
}

function MetadataStrip({
  folderName,
  tags,
  updatedAt,
}: {
  folderName: string | null;
  tags: { id: string; name: string }[];
  updatedAt: string;
}) {
  const relative = useRelativeTime(updatedAt);
  const navigate = useNavigate();
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <FolderBadge name={folderName} />
      <span aria-hidden>·</span>
      <span title={new Date(updatedAt).toLocaleString()}>{relative}</span>
      {tags.length > 0 && (
        <>
          <span aria-hidden>·</span>
          <div className="flex flex-wrap gap-1">
            {tags.map((t) => (
              <TagChip
                key={t.id}
                name={t.name}
                onClick={() => navigate(`/?tagId=${encodeURIComponent(t.id)}`)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
