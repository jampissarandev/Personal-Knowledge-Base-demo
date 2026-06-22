/**
 * Thin wrapper over `localStorage` for the JWT access token.
 *
 * Why localStorage and not an HttpOnly cookie?
 * - The backend returns the JWT in the response body (not as a `Set-Cookie`).
 *   To switch to HttpOnly cookies we would need a same-site auth endpoint
 *   and a CSRF strategy. Out of scope for the foundation phase.
 *
 * Security trade-off (XSS):
 * - A successful XSS attack can read `pkb_token` and exfiltrate the JWT.
 *   Acceptable for this single-user, local-first app.
 * - Mitigation: never use `dangerouslySetInnerHTML`; render user content
 *   (including search snippets from Phase 3 R2) as text only.
 *
 * The storage key is namespaced (`pkb_token`) so it cannot collide with
 * other apps served from the same origin.
 */
const TOKEN_KEY = 'pkb_token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    // localStorage may be unavailable (private browsing quirks, etc.).
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Quota or sandbox errors are non-fatal — the user just won't stay
    // logged in across reloads.
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // See above.
  }
}
