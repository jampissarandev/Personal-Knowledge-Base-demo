/**
 * Single row on the `/search` page. Renders a `SearchHit` with
 * title, snippet (parsed via `parseSnippet`, rendered with React's
 * automatic escaping), and a metadata strip (folder + score).
 *
 * The row is a `<Link>` to `/notes/<id>`; hovering shows a subtle
 * `bg-muted/40` background.
 */
import { Link } from 'react-router-dom';
import { FolderOpen, FileText } from 'lucide-react';
import { parseSnippet } from '@/lib/parseSnippet';
import { cn } from '@/lib/utils';

interface SearchResultRowProps {
  hit: {
    noteId: string;
    title: string;
    snippet: string;
    score: number;
  };
}

export function SearchResultRow({ hit }: SearchResultRowProps): React.ReactElement {
  const runs = parseSnippet(hit.snippet);
  return (
    <Link
      to={`/notes/${hit.noteId}`}
      data-testid="search-result-row"
      className={cn(
        'block rounded-md border bg-card p-4 text-card-foreground shadow-sm',
        'transition-colors hover:bg-muted/40 focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      )}
    >
      <div className="flex items-start gap-3">
        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-medium">{hit.title}</h3>
          <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
            {runs.length === 0 ? (
              <span>{hit.snippet}</span>
            ) : (
              runs.map((run, i) =>
                run.mark ? (
                  <mark
                    key={i}
                    className="rounded-sm bg-yellow-200 px-0.5 text-foreground dark:bg-yellow-900"
                  >
                    {run.text}
                  </mark>
                ) : (
                  <span key={i}>{run.text}</span>
                ),
              )
            )}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <FolderOpen className="h-3 w-3" />
            <span>Unfiled</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
