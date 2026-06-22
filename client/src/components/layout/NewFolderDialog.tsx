/**
 * "New folder" dialog. Triggered by the sidebar's footer button.
 * Validates the name client-side (trimmed, non-empty, max 50 chars
 * per `CreateFolderRequest` backend constraint) and submits via
 * `useCreateFolder`. The dialog closes on success and a toast is
 * shown by the hook.
 */
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCreateFolder } from '@/hooks/folders';

export interface NewFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewFolderDialog({ open, onOpenChange }: NewFolderDialogProps) {
  const [name, setName] = useState('');
  const createFolder = useCreateFolder();

  // Reset the input when the dialog re-opens.
  useEffect(() => {
    if (open) setName('');
  }, [open]);

  const trimmed = name.trim();
  const isValid = trimmed.length > 0 && trimmed.length <= 50;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    try {
      await createFolder.mutateAsync({ name: trimmed });
      onOpenChange(false);
    } catch {
      // Error toast already shown by the hook.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
            <DialogDescription>
              Group related notes. Folders are flat (no nesting).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label htmlFor="new-folder-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="new-folder-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Recipes"
              maxLength={50}
              disabled={createFolder.isPending}
            />
            {name.length > 0 && !isValid && (
              <p className="text-xs text-destructive">
                Folder name must be 1–50 characters.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createFolder.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || createFolder.isPending}
            >
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
