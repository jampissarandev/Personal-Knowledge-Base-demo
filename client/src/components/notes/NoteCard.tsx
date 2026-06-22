/**
 * A single note's row in the middle-pane list. Renders the title, a
 * 1-line preview from `contentText`, the relative updated-at, the
 * tag chips, and a pin icon (only when the note is pinned — non-pinned
 * notes don't show the pin to keep the row calm).
 */
import { useNavigate } from 'react-router-dom';
import { Pin } from 'lucide-react';
import type { NoteResponse } from '@/api/notes';
import { cn } from '@/lib/utils';
import { useRelativeTime } from '@/lib/formatRelativeTime';
import { TagChip } from './TagChip';
import { FolderBadge } from './FolderBadge';

export interface NoteCardProps {
  note: NoteResponse;
  /** When provided, called instead of navigating to /notes/:id. */
  onClick?: (id: string) => void;
  className?: string;
}

function preview(contentText: string): string {
  if (!contentText) return '';
  // Trim and clip to ~120 chars; collapse newlines so the row stays single-line.
  const flattened = contentText.replace(/\s+/g, ' ').trim();
  return flattened.length > 120 ? `${flattened.slice(0, 117)}…` : flattened;
}

export function NoteCard({ note, onClick, className }: NoteCardProps) {
  const navigate = useNavigate();
  const updatedAt = useRelativeTime(note.updatedAt);

  const handle = () => {
    if (onClick) onClick(note.id);
    else navigate(`/notes/${note.id}`);
  };

  return (
    <button
      type="button"
      onClick={handle}
      aria-label={`Open note: ${note.title || 'Untitled'}`}
      className={cn(
        'flex w-full flex-col gap-1 rounded-md border bg-card p-3 text-left',
        'transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-1 text-sm font-medium leading-tight">
          {note.title || 'Untitled'}
        </h3>
        {note.isPinned && (
          <Pin
            className="h-3.5 w-3.5 shrink-0 text-amber-500"
            aria-label="Pinned"
          />
        )}
      </div>
      {preview(note.contentText) && (
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {preview(note.contentText)}
        </p>
      )}
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <FolderBadge name={note.folderName} />
        <span aria-hidden>·</span>
        <span>{updatedAt}</span>
        {note.tags.length > 0 && (
          <>
            <span aria-hidden>·</span>
            <span className="flex flex-wrap gap-1">
              {note.tags.slice(0, 3).map((t) => (
                <TagChip key={t.id} name={t.name} />
              ))}
              {note.tags.length > 3 && (
                <span>+{note.tags.length - 3}</span>
              )}
            </span>
          </>
        )}
      </div>
    </button>
  );
}
