/**
 * Single-chip display for a tag. Used by the note detail's metadata
 * strip and by the note list (when the note has tags). The detail
 * page wraps multiple of these in `<TagChipList>` (in TagInput.tsx)
 * and wires each to `?tagId=`.
 */
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface TagChipProps {
  name: string;
  onClick?: () => void;
  className?: string;
}

export function TagChip({ name, onClick, className }: TagChipProps) {
  const interactive = typeof onClick === 'function';
  return (
    <Badge
      variant="secondary"
      className={cn(
        'font-normal',
        interactive && 'cursor-pointer hover:bg-secondary/80',
        className,
      )}
      onClick={onClick}
    >
      {name}
    </Badge>
  );
}
