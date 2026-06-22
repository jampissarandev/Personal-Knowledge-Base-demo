import { Navigate, Outlet, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { safeNextPath } from '@/lib/nextPath';

/**
 * Route guard for `/login` and `/register`. If the user is already
 * authenticated, redirects them to `?next=` (or `/` by default)
 * instead of letting them see the auth form.
 *
 * Mirrors the `<ProtectedRoute>` pattern: shows a spinner while the
 * bootstrap `/auth/me` call is in flight to avoid a flash-of-redirect
 * for users with a stale token who just opened the page.
 *
 * Note: the binding spec (`PHASE5_PLAN.md` §3.8) called this a hook
 * with the `use` prefix. It is rendered as a component at the router
 * level (matching the ProtectedRoute pattern and the orchestrator
 * brief), so the export is PascalCase. The behaviour is unchanged.
 */
export function RedirectIfAuthed(): React.ReactElement {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const next = safeNextPath(searchParams.get('next'));

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-[60vh] items-center justify-center"
      >
        <div
          aria-hidden="true"
          className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground"
        />
        <span className="sr-only">Loading session…</span>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={next} replace />;
  }

  return <Outlet />;
}
