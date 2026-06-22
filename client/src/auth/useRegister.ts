import { useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as authApi from '@/api/auth';
import { useAuth } from '@/auth/AuthContext';
import { logger } from '@/lib/logger';
import { mapAuthError, type AuthServerError } from '@/lib/authErrors';
import {
  registerSchema,
  type RegisterFormValues,
} from '@/lib/schemas/register';

export interface UseRegisterResult {
  form: UseFormReturn<RegisterFormValues>;
  serverError: AuthServerError | null;
  isSubmitting: boolean;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
}

/**
 * Register form controller. Wires RHF + zod to `authApi.register` and
 * `AuthContext.login(token, user, '/')`. Post-register redirect is
 * always `/` per the spec; the optional `displayName` is sent only
 * when non-empty so the backend stores it as `null` otherwise.
 */
export function useRegister(): UseRegisterResult {
  const auth = useAuth();
  const [serverError, setServerError] = useState<AuthServerError | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', displayName: '' },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    logger.info('auth_register_attempt');
    try {
      const trimmedName = values.displayName?.trim() ?? '';
      const result = await authApi.register({
        email: values.email,
        password: values.password,
        ...(trimmedName !== '' ? { displayName: trimmedName } : {}),
      });
      logger.info('auth_register_succeeded', { userId: result.user.id });
      auth.login(result.token, result.user, '/');
    } catch (err) {
      setServerError(mapAuthError(err, form, 'auth_register_failed'));
    }
  });

  return {
    form,
    serverError,
    isSubmitting: form.formState.isSubmitting,
    onSubmit,
  };
}
