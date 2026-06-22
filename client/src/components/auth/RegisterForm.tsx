import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useRegister } from '@/auth/useRegister';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const PASSWORD_HINT =
  'At least 8 characters, with uppercase, lowercase, and a digit.';

/**
 * Renders the register form. On success the user is sent to `/`
 * (the post-register redirect per `PHASE5_PLAN.md` §3.8). The
 * `?next=` query param is preserved when linking to `/login` so a
 * user who landed here from a deep link can still complete their
 * intended flow after creating an account.
 */
export function RegisterForm(): React.ReactElement {
  const { form, serverError, isSubmitting, onSubmit } = useRegister();
  const [searchParams] = useSearchParams();
  const currentNext = searchParams.get('next');
  const signInHref =
    currentNext !== null && currentNext !== ''
      ? `/login?next=${encodeURIComponent(currentNext)}`
      : '/login';

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form
          onSubmit={onSubmit}
          className="space-y-4"
          noValidate
          aria-label="Create account form"
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
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormDescription>{PASSWORD_HINT}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display name</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    autoComplete="name"
                    placeholder="Optional"
                    disabled={isSubmitting}
                    {...field}
                    value={field.value ?? ''}
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
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
      </Form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          to={signInHref}
          className="font-medium text-foreground underline underline-offset-2"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
