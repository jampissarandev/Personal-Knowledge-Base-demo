/**
 * Empty state for the note list. Includes a "New note" primary button
 * so the user has a clear next action.
 */
import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NoteListEmpty() {
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <FileText className="h-10 w-10 text-muted-foreground" aria-hidden />
      <h3 className="text-base font-medium">No notes yet</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        Create your first note to get started.
      </p>
      <Button onClick={() => navigate('/notes/new')}>New note</Button>
    </div>
  );
}
