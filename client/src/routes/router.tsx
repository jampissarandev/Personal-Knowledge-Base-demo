import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { AuthProvider } from '@/auth/AuthContext';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { RedirectIfAuthed } from '@/auth/RedirectIfAuthed';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { DashboardEmptyState } from '@/pages/DashboardEmptyState';
import { NoteDetailPage } from '@/pages/NoteDetailPage';
import { NoteEditorPage } from '@/pages/NoteEditorPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { SearchPage } from '@/pages/SearchPage';

/**
 * Route tree:
 *  /                          → Layout → protected → Dashboard (3-pane)
 *    /                        → DashboardEmptyState (right pane hint)
 *    /notes/new               → NoteEditorPage (create)
 *    /notes/:id               → NoteDetailPage
 *    /notes/:id/edit          → NoteEditorPage (edit)
 *  /login                     → Layout → RedirectIfAuthed → LoginPage
 *  /register                  → Layout → RedirectIfAuthed → RegisterPage
 *  *                          → Layout → NotFoundPage
 *
 * `<AuthProvider>` wraps the root so it sits inside the router context
 * (required by `useNavigate` used in `login(token, user, next?)` per
 * `PHASE5_PLAN.md` §3.8). The same `<Layout>` is used for all routes
 * so the header (and its theme toggle) is consistent on every page,
 * including 404. Auth routes are nested under `<RedirectIfAuthed />`
 * so an already-authenticated visitor is bounced to `/` (or
 * `?next=`) before the form is ever rendered.
 *
 * The dashboard's `/`, `/notes/new`, `/notes/:id`, `/notes/:id/edit`
 * routes are nested inside `<ProtectedRoute>` so the auth guard runs
 * once. Visiting `/notes/abc` does NOT also render the dashboard's
 * right-pane empty state — the `:id` route fully replaces the
 * `<Outlet />` content (per React Router's default behaviour: a
 * child route with no `index` + a path completely takes over).
 */
export const router = createBrowserRouter([
  {
    element: (
      <AuthProvider>
        <Layout />
      </AuthProvider>
    ),
    children: [
      {
        element: <RedirectIfAuthed />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: '/',
            element: <DashboardPage />,
            children: [
              { index: true, element: <DashboardEmptyState /> },
              { path: 'notes/new', element: <NoteEditorPage mode="create" /> },
              { path: 'notes/:id', element: <NoteDetailPage /> },
              { path: 'notes/:id/edit', element: <NoteEditorPage mode="edit" /> },
            ],
          },
          { path: '/search', element: <SearchPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
