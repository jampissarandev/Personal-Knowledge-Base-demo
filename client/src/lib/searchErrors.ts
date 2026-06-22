import { ApiError } from '@/api/client';
import { logger } from '@/lib/logger';

/**
 * Server error categories the search surface renders. Keep in sync
 * with `docs/PHASE7_PLAN.md` §2 ("Backend error codes").
 *
 * `UNAUTHORIZED` (401) is NOT mapped here — `api/client.ts` clears the
 * token on 401 and `ProtectedRoute` handles the redirect.
 */
export type SearchServerErrorKind =
  | 'VALIDATION_ERROR'
  | 'SEARCH_QUERY_TOO_MANY_TOKENS'
  | 'SEARCH_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export interface SearchServerError {
  kind: SearchServerErrorKind;
  message: string;
}

const VALIDATION_MESSAGE =
  'Search query is too long. Please shorten it to 200 characters or fewer.';
const TOO_MANY_TOKENS_MESSAGE =
  'Search query has too many words. Please try a shorter, more specific search.';
const SEARCH_ERROR_MESSAGE =
  'Search is temporarily unavailable. Please try again.';
const NETWORK_MESSAGE = 'Unable to reach the server. Check your connection.';
const GENERIC_MESSAGE = 'Something went wrong.';

/**
 * Map an `ApiError` (or unknown) to a user-facing message. Used by
 * `<SearchBar />` (toast) and the `/search` page (inline alert).
 *
 * Only the error `code` is logged; the body / status / details are
 * never written to the console.
 */
export function mapSearchError(
  err: unknown,
  logEvent: string,
): SearchServerError {
  if (!(err instanceof ApiError)) {
    logger.error(logEvent, err);
    return { kind: 'UNKNOWN_ERROR', message: GENERIC_MESSAGE };
  }

  switch (err.code) {
    case 'VALIDATION_ERROR':
      logger.error(logEvent, undefined, { code: err.code });
      return { kind: 'VALIDATION_ERROR', message: VALIDATION_MESSAGE };
    case 'SEARCH_QUERY_TOO_MANY_TOKENS':
      logger.error(logEvent, undefined, { code: err.code });
      return {
        kind: 'SEARCH_QUERY_TOO_MANY_TOKENS',
        message: TOO_MANY_TOKENS_MESSAGE,
      };
    case 'SEARCH_ERROR':
      logger.error(logEvent, undefined, { code: err.code });
      return { kind: 'SEARCH_ERROR', message: SEARCH_ERROR_MESSAGE };
    case 'NETWORK_ERROR':
      logger.error(logEvent, undefined, { code: err.code });
      return { kind: 'NETWORK_ERROR', message: NETWORK_MESSAGE };
    default:
      logger.error(logEvent, undefined, { code: err.code });
      return { kind: 'UNKNOWN_ERROR', message: GENERIC_MESSAGE };
  }
}
