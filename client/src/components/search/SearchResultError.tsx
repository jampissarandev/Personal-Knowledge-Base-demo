/**
 * Error state for the `/search` page. Renders a destructive `<Alert>`
 * with the error message and a "Retry" button.
 */
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface SearchResultErrorProps {
  message: string;
  onRetry: () => void;
}

export function SearchResultError({
  message,
  onRetry,
}: SearchResultErrorProps): React.ReactElement {
  return (
    <div className="mx-auto max-w-md">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Search failed</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      <div className="mt-3 flex justify-center">
        <Button type="button" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </div>
    </div>
  );
}
