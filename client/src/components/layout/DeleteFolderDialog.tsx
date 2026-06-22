/**
 * "Delete folder?" confirmation. Notes in the deleted folder are
 * unfiled (the backend uses `OnDelete(SetNull)`), not removed.
 * The dialog uses the shadcn `alert-dialog` so focus is trapped
 * and the Cancel button is the default focus target.
 */
import { useState, useEffect } from 'react';
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
import { useDeleteFolder } from '@/hooks/folders';

export interface DeleteFolderDialogProps {
  open: boolean;
  folder: { id: string; name: string } | null;
  onOpenChange: (open: boolean) => void;
  /** Called after the folder is successfully deleted. */
  onDeleted?: (id: string) => void;
}

export function DeleteFolderDialog({
  open,
  folder,
  onOpenChange,
  onDeleted,
}: DeleteFolderDialogProps) {
  const deleteFolder = useDeleteFolder();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setError(null);
  }, [open]);

  const handleDelete = async () => {
    if (!folder) return;
    setError(null);
    try {
      await deleteFolder.mutateAsync(folder.id);
      onDeleted?.(folder.id);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete folder.');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete folder?</AlertDialogTitle>
          <AlertDialogDescription>
            {folder ? (
              <>
                The folder <strong>{folder.name}</strong> will be deleted.
                Notes in it will be <strong>unfiled</strong>, not removed.
              </>
            ) : (
              'This folder will be deleted.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteFolder.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void handleDelete();
            }}
            disabled={deleteFolder.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteFolder.isPending ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
