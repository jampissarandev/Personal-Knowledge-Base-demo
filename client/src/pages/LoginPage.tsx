import { Link, useSearchParams } from 'react-router-dom';
import { AuthShell } from '@/components/auth/AuthShell';
import { LoginForm } from '@/components/auth/LoginForm';
import { safeNextPath } from '@/lib/nextPath';

/**
 * Sign-in page. Pulls `?next=` once, sanitizes via `safeNextPath`
 * (rejecting open-redirect vectors like `//evil.com`), and passes
 * the result to `<LoginForm>` → `useLogin` → `AuthContext.login`.
 *
 * Already-authenticated visitors are bounced away by
 * `<RedirectIfAuthed>` at the router level — this page is only
 * rendered for anonymous users.
 */
export function LoginPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const next = safeNextPath(searchParams.get('next'));
  const rawNext = searchParams.get('next');
  const registerHref =
    rawNext !== null && rawNext !== ''
      ? `/register?next=${encodeURIComponent(rawNext)}`
      : '/register';

  return (
    <AuthShell title="Sign in" description="Welcome back.">
      <LoginForm next={next} />
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          to={registerHref}
          className="font-medium text-foreground underline underline-offset-2"
        >
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}
