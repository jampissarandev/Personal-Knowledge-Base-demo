/**
 * "Delete note?" confirmation. Wraps the shadcn `alert-dialog` and
 * the `useDeleteNote` mutation. The note is removed from the cache
 * optimistically by the hook; on success we navigate to `/` and
 * surface a toast.
 */
import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteNote } from '@/hooks/notes';

export interface DeleteNoteDialogProps {
  open: boolean;
  note: { id: string; title: string } | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: (id: string) => void;
}

export function DeleteNoteDialog({
  open,
  note,
  onOpenChange,
  onDeleted,
}: DeleteNoteDialogProps) {
  const deleteNote = useDeleteNote();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setError(null);
  }, [open]);

  const handleDelete = async () => {
    if (!note) return;
    setError(null);
    try {
      await deleteNote.mutateAsync(note.id);
      onDeleted?.(note.id);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete note.');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete note?</AlertDialogTitle>
          <AlertDialogDescription>
            {note ? (
              <>
                <strong>{note.title || 'Untitled'}</strong> will be
                permanently deleted. This cannot be undone.
              </>
            ) : (
              'This note will be permanently deleted.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteNote.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void handleDelete();
            }}
            disabled={deleteNote.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteNote.isPending ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
