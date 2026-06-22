import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * Renders `<Outlet />` when the user is authenticated, otherwise redirects
 * to `/login` while preserving the originally-requested URL as `?next=`
 * so the post-login redirect can send the user back.
 *
 * While the bootstrap `/auth/me` call is in flight, shows a spinner to
 * avoid the "flash of redirect" race when the user has a stale token.
 */
export function ProtectedRoute(): React.ReactElement {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen items-center justify-center"
      >
        <div
          aria-hidden="true"
          className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground"
        />
        <span className="sr-only">Loading session…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return <Outlet />;
}
