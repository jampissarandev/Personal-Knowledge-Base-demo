import { AuthShell } from '@/components/auth/AuthShell';
import { RegisterForm } from '@/components/auth/RegisterForm';

/**
 * Register page. On success the user is redirected to `/` (per
 * `PHASE5_PLAN.md` §3.8 — `?next=` is honored on login but not on
 * register). Already-authenticated visitors are bounced away by
 * `<RedirectIfAuthed>` at the router level.
 */
export function RegisterPage(): React.ReactElement {
  return (
    <AuthShell
      title="Create account"
      description="Set up your personal knowledge base."
    >
      <RegisterForm />
    </AuthShell>
  );
}
