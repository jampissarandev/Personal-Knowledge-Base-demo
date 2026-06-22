import { QueryClient } from '@tanstack/react-query';

/**
 * Single QueryClient for the app.
 *
 * Defaults:
 * - 5 minute `staleTime` — most server data in this app (notes, tags,
 *   folders) is user-owned and changes infrequently, so refetching on
 *   every focus toggle would be wasteful.
 * - Retry once on failure. Transient network blips resolve; persistent
 *   errors surface quickly to the user.
 * - No global error toasts in Phase 4 (deferred to Phase 7 with `sonner`).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
