/**
 * Search API — Phase 7.
 *
 * `search(q, limit, offset, signal?)` issues `GET /search?q=…` and
 * returns a typed `SearchResponse`. The optional `signal` is passed
 * straight through to axios and plumbs into TanStack Query's internal
 * `AbortSignal` — a query-key change (e.g. a new keystroke in the
 * search bar) cancels the in-flight request on the client and on the
 * server (via the backend's `CancellationToken`).
 *
 * Snippet XSS contract (Phase 3 R2 + Phase 4 R2 carryover):
 *   The server-derived `snippet` may wrap the matched term in literal
 *   `<mark>…</mark>` tags. Callers MUST treat the snippet as text —
 *   render via `parseSnippet()` (`lib/parseSnippet.ts`) and React's
 *   automatic escaping. Never pass the snippet to
 *   `dangerouslySetInnerHTML` or `innerHTML`.
 */
import { api } from './client';

export interface SearchHit {
  noteId: string;
  title: string;
  /**
   * Server-issued excerpt that may wrap a match in literal `<mark> …
   * `</mark>` tags. Treat as text. Never pass to `dangerouslySetInnerHTML`;
   * use `parseSnippet()` to split into marked runs and render with
   * React's automatic escaping.
   */
  snippet: string;
  score: number;
}

export interface SearchResponse {
  query: string;
  total: number;
  hits: SearchHit[];
}

/**
 * `GET /search?q=<q>&limit=<n>&offset=<n>`.
 *
 * - `q` is trimmed client-side before being sent.
 * - `limit` is clamped server-side to `1..100`, default `20`.
 * - `offset` is clamped server-side to `0..1000`, default `0`.
 * - Throws `ApiError` on any non-2xx response (see `api/client.ts`).
 *
 * The `signal` argument is forwarded to axios; aborting it cancels
 * the in-flight request on the client and on the server.
 */
export function search(
  q: string,
  limit = 20,
  offset = 0,
  signal?: AbortSignal,
): Promise<SearchResponse> {
  return api
    .get<SearchResponse>('/search', {
      params: { q: q.trim(), limit, offset },
      signal,
    })
    .then((r) => r.data);
}
