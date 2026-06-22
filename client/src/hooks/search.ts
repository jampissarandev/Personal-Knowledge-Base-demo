/**
 * Search hook — TanStack Query wrapper around `searchApi.search`.
 *
 * The hook is keyed on `[q, limit, offset]`. When `q` is empty the
 * query is disabled (no request fires). The `signal` is supplied by
 * TanStack Query automatically; aborting it cancels the in-flight
 * request on the client and on the server. A new keystroke in the
 * search bar (a new `q` → new query key) triggers TanStack's built-in
 * cancellation of the previous in-flight request, which is the
 * source of truth for debounce-driven cancellation. No explicit
 * `AbortController` is needed in the consumer.
 */
import {
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';
import * as searchApi from '@/api/search';
import type { ApiError } from '@/api/client';
import { logger } from '@/lib/logger';

export interface UseSearchParams {
  /** Already trimmed + debounced query. Empty string disables the query. */
  q: string;
  /** Page size; default 20. Clamped server-side to 1..100. */
  limit?: number;
  /** Offset for "Load more" pagination; default 0. */
  offset?: number;
  /** Set to false to skip the request entirely (e.g. while disabled). */
  enabled?: boolean;
}

export function useSearch(
  params: UseSearchParams,
): UseQueryResult<searchApi.SearchResponse, ApiError> {
  const { q, limit = 20, offset = 0, enabled = true } = params;
  const trimmed = q.trim();
  return useQuery<searchApi.SearchResponse, ApiError>({
    queryKey: ['search', trimmed, limit, offset],
    queryFn: ({ signal }) => {
      logger.info('search_requested', { q: trimmed, limit, offset });
      return searchApi.search(trimmed, limit, offset, signal);
    },
    enabled: enabled && trimmed.length > 0,
    staleTime: 30_000,
  });
}
