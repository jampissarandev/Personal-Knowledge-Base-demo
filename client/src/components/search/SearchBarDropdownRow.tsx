/**
 * Single row in the search bar's dropdown. Renders a `SearchHit`:
 *   - title (truncated to 60 chars + ellipsis)
 *   - snippet parsed via `parseSnippet` and rendered with React's
 *     automatic escaping (never `dangerouslySetInnerHTML`)
 *   - folder name (or "Unfiled") on the right
 *
 * The row is a `<button>` so it is keyboard-focusable; the parent
 * `SearchBar` handles the `Enter` keystroke via a `data-` attribute
 * selector (each row exposes `data-hit-index`).
 */
import { FileText, FolderOpen } from 'lucide-react';
import { parseSnippet } from '@/lib/parseSnippet';
import { cn } from '@/lib/utils';

interface SearchBarDropdownRowProps {
  hit: {
    noteId: string;
    title: string;
    snippet: string;
  };
  folderName: string | null;
  isActive: boolean;
  index: number;
  onSelect: (noteId: string) => void;
  onHover: (index: number) => void;
}

const MAX_TITLE = 60;

function truncate(title: string): string {
  if (title.length <= MAX_TITLE) return title;
  return `${title.slice(0, MAX_TITLE - 1).trimEnd()}…`;
}

export function SearchBarDropdownRow({
  hit,
  folderName,
  isActive,
  index,
  onSelect,
  onHover,
}: SearchBarDropdownRowProps): React.ReactElement {
  const runs = parseSnippet(hit.snippet);

  return (
    <button
      type="button"
      role="option"
      aria-selected={isActive}
      data-hit-index={index}
      data-testid="search-bar-row"
      onMouseDown={(e) => {
        // Use mousedown so the click fires before the popover closes
        // and the input loses focus.
        e.preventDefault();
      }}
      onClick={() => onSelect(hit.noteId)}
      onMouseEnter={() => onHover(index)}
      className={cn(
        'flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left text-sm',
        'hover:bg-accent hover:text-accent-foreground',
        isActive && 'bg-accent text-accent-foreground',
      )}
    >
      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{truncate(hit.title)}</div>
        <div className="line-clamp-2 text-xs text-muted-foreground">
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
        </div>
      </div>
      <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
        <FolderOpen className="h-3 w-3" />
        {folderName ?? 'Unfiled'}
      </span>
    </button>
  );
}
