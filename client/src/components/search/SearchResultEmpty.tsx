/**
 * Empty state for the `/search` page. Renders "No matches for <q>"
 * + a primary "Create note titled <q>" button.
 */
import { FilePlus, SearchX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface SearchResultEmptyProps {
  q: string;
}

export function SearchResultEmpty({ q }: SearchResultEmptyProps): React.ReactElement {
  const navigate = useNavigate();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-lg border bg-card p-8 text-center shadow-sm">
      <SearchX className="h-10 w-10 text-muted-foreground" aria-hidden />
      <div className="space-y-1">
        <h2 className="text-lg font-medium">
          No matches for{' '}
          <span className="font-semibold text-foreground">“{q}”</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Try a different word, or create a new note with this title.
        </p>
      </div>
      <Button
        type="button"
        onClick={() => navigate(`/notes/new?title=${encodeURIComponent(q)}`)}
      >
        <FilePlus className="h-4 w-4" />
        Create note titled “{q}”
      </Button>
    </div>
  );
}
