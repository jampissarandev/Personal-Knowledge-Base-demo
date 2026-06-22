import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useLogin } from '@/auth/useLogin';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface LoginFormProps {
  next: string | null;
}

/**
 * Renders the login form. The `?next=` value is passed through
 * `useLogin`; on success `AuthContext.login` navigates to it
 * (sanitized via `safeNextPath`).
 *
 * The "Sign in instead" link inside the `EMAIL_TAKEN` alert is
 * unlikely to fire here (login doesn't return that code), but the
 * mapping is consistent with the register form so the UI shape
 * stays uniform.
 */
export function LoginForm({ next }: LoginFormProps): React.ReactElement {
  const { form, serverError, isSubmitting, onSubmit } = useLogin(next);
  const [searchParams] = useSearchParams();
  const currentNext = searchParams.get('next');
  const signInHref =
    currentNext !== null && currentNext !== ''
      ? `/login?next=${encodeURIComponent(currentNext)}`
      : '/login';

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        className="space-y-4"
        noValidate
        aria-label="Sign in form"
      >
        {serverError !== null && serverError.message !== '' && (
          <Alert variant="destructive" aria-live="assertive">
            <AlertCircle aria-hidden="true" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {serverError.message}
              {serverError.kind === 'EMAIL_TAKEN' && (
                <>
                  {' '}
                  <Link
                    to={signInHref}
                    className="font-medium underline underline-offset-2"
                  >
                    Sign in instead
                  </Link>
                  .
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full"
          aria-disabled={isSubmitting}
        >
          {isSubmitting && (
            <Loader2 aria-hidden="true" className="animate-spin" />
          )}
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </Form>
  );
}
