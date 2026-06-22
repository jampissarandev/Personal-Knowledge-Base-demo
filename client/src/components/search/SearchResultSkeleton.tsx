/**
 * Skeleton placeholder for a single `/search` result row.
 */
import { Skeleton } from '@/components/ui/skeleton';

export function SearchResultSkeleton(): React.ReactElement {
  return (
    <div className="rounded-md border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Skeleton className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    </div>
  );
}
