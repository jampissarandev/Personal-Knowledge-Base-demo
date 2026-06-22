/**
 * Loading state for the note list. Renders a header + N skeletons
 * per section, matching the real layout's spacing.
 */
import { Skeleton } from '@/components/ui/skeleton';

export interface NoteListSkeletonProps {
  /** Number of skeletons to render in each section. Default 4. */
  count?: number;
}

export function NoteListSkeleton({ count = 4 }: NoteListSkeletonProps) {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}
