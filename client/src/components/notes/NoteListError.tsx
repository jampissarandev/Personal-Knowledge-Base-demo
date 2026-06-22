/**
 * Error state for the note list. Renders an inline alert with a
 * "Retry" button that re-runs the query.
 */
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export interface NoteListErrorProps {
  message: string;
  onRetry: () => void;
}

export function NoteListError({ message, onRetry }: NoteListErrorProps) {
  return (
    <div className="p-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Failed to load notes</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      <div className="mt-3 flex justify-end">
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </div>
    </div>
  );
}
