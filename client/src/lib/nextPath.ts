/**
 * Open-redirect protection for the post-login `?next=` query param.
 *
 * Accepts a path that:
 *   - is non-empty;
 *   - starts with a single `/` (so it is same-origin);
 *   - does **not** start with `//` (which the browser interprets as a
 *     protocol-relative URL — `//evil.com/path` → redirect to evil.com).
 *
 * Everything else (null, empty, backslashes, absolute URLs, encoded
 * variants like `%2F%2Fevil.com` that decode to `//evil.com`) falls
 * back to `/` so the user is never bounced off-origin.
 */
export function safeNextPath(raw: string | null | undefined): string {
  if (raw === null || raw === undefined || raw === '') return '/';
  if (!raw.startsWith('/')) return '/';
  if (raw.startsWith('//')) return '/';
  return raw;
}

/**
 * Returns a new query string that copies every param from `current`
 * except `key`, then either sets `key=value` (when `value` is a string)
 * or removes the key entirely (when `value === null`).
 *
 * Used by the dashboard filter chips to clear `?folderId=` or `?tagId=`
 * while preserving every other param. The result is meant to be passed
 * to React Router's `setSearchParams()` (which accepts the raw
 * query-string form, including the leading `?`).
 *
 * @example
 *   forwardSearchParam(new URLSearchParams('a=1&folderId=x'), 'folderId', null)
 *   // → '?a=1'
 *   forwardSearchParam(new URLSearchParams('a=1'), 'tagId', 't1')
 *   // → '?a=1&tagId=t1'
 */
export function forwardSearchParam(
  current: URLSearchParams,
  key: string,
  value: string | null,
): string {
  const next = new URLSearchParams(current);
  if (value === null) {
    next.delete(key);
  } else {
    next.set(key, value);
  }
  const qs = next.toString();
  return qs ? `?${qs}` : '';
}
