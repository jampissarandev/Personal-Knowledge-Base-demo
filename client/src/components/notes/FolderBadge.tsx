/**
 * Folder badge — a small "In: <name>" indicator. Renders an icon +
 * the folder name (or "Unfiled" when the note has no folder).
 *
 * When an `onClick` is provided the badge becomes a `<button>` so the
 * user can navigate to the folder. When no `onClick` is provided the
 * badge is a `<span>` so it can be safely nested inside other clickable
 * elements (e.g. the `<NoteCard>`'s outer `<button>` — invalid HTML to
 * nest a button inside a button).
 */
import { Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FolderBadgeProps {
  name: string | null;
  onClick?: () => void;
  className?: string;
}

export function FolderBadge({ name, onClick, className }: FolderBadgeProps) {
  const Icon = name === null ? FolderOpen : Folder;
  const label = name ?? 'Unfiled';
  const baseClass = cn(
    'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs',
    'text-muted-foreground',
    onClick && 'hover:bg-accent hover:text-accent-foreground',
    className,
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={(e) => {
          // Don't bubble — the parent (NoteCard) is itself a button.
          e.stopPropagation();
          onClick();
        }}
        className={baseClass}
        aria-label={`Folder: ${label}`}
      >
        <Icon className="h-3 w-3" />
        {label}
      </button>
    );
  }
  return (
    <span className={baseClass} aria-label={`Folder: ${label}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
