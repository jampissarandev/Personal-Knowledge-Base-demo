import { useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as authApi from '@/api/auth';
import { useAuth } from '@/auth/AuthContext';
import { logger } from '@/lib/logger';
import { mapAuthError, type AuthServerError } from '@/lib/authErrors';
import { loginSchema, type LoginFormValues } from '@/lib/schemas/login';

export interface UseLoginResult {
  form: UseFormReturn<LoginFormValues>;
  serverError: AuthServerError | null;
  isSubmitting: boolean;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
}

/**
 * Login form controller. Wires RHF + zod to `authApi.login` and
 * `AuthContext.login(token, user, next)`. On success the context
 * performs the post-login navigation (to `?next=` or `/`); on
 * failure the error is mapped to either field-level RHF errors or
 * a top-level `serverError` for the form's `<Alert>`.
 *
 * `next` is the post-login redirect path. The caller (page) pulls
 * this from `?next=` and runs it through `safeNextPath` before
 * passing it in. Registering while authenticated redirects to `/`
 * unconditionally.
 */
export function useLogin(next: string | null): UseLoginResult {
  const auth = useAuth();
  const [serverError, setServerError] = useState<AuthServerError | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    logger.info('auth_login_attempt');
    try {
      const result = await authApi.login({
        email: values.email,
        password: values.password,
      });
      logger.info('auth_login_succeeded', { userId: result.user.id });
      // `next` is sanitized inside `AuthContext.login` via `safeNextPath`.
      auth.login(result.token, result.user, next ?? '/');
    } catch (err) {
      setServerError(mapAuthError(err, form, 'auth_login_failed'));
    }
  });

  return {
    form,
    serverError,
    isSubmitting: form.formState.isSubmitting,
    onSubmit,
  };
}
