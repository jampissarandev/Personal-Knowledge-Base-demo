import type { UseFormReturn, FieldValues, Path } from 'react-hook-form';
import { ApiError } from '@/api/client';
import { logger } from '@/lib/logger';
import { toast } from '@/lib/toast';

/** Minimal shape required for error-mapping. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ErrorMappingForm<T extends FieldValues>
  extends Pick<UseFormReturn<T>, 'setError'> {}

/**
 * Server error categories that the auth forms surface to the user.
 * The shape is a discriminated union on `kind` so callers can branch
 * (e.g. render a "Sign in instead" link on `EMAIL_TAKEN`).
 */
export type AuthServerErrorKind =
  | 'EMAIL_TAKEN'
  | 'REGISTRATION_FAILED'
  | 'INVALID_CREDENTIALS'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export interface AuthServerError {
  kind: AuthServerErrorKind;
  message: string;
}

const NETWORK_ERROR_MESSAGE =
  'Unable to reach the server. Check your connection.';
const GENERIC_ERROR_MESSAGE = 'Something went wrong.';
const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password.';
const EMAIL_TAKEN_MESSAGE =
  'An account with this email already exists. Try signing in.';
const REGISTRATION_FAILED_MESSAGE =
  'Password does not meet the security policy. Use 8+ chars with a mix of letters and numbers.';

/**
 * Lower-cases the first character. The backend returns field names
 * in PascalCase (`Email`, `Password`, `DisplayName`); RHF expects
 * the schema's camelCase names (`email`, `password`, `displayName`).
 */
function toCamelCase(s: string): string {
  if (s.length === 0) return s;
  return s[0]!.toLowerCase() + s.slice(1);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Map a server `ApiError` to either field-level RHF errors (for
 * `VALIDATION_ERROR`) or a top-level `AuthServerError` (for the
 * auth forms' `<Alert variant="destructive">`).
 *
 * `logEvent` is the logger tag to emit on failure
 * (`auth_login_failed` / `auth_register_failed`).
 */
export function mapAuthError<T extends FieldValues>(
  err: unknown,
  form: ErrorMappingForm<T>,
  logEvent: string,
): AuthServerError {
  if (!(err instanceof ApiError)) {
    logger.error(logEvent, err);
    toast.error(GENERIC_ERROR_MESSAGE);
    return { kind: 'UNKNOWN_ERROR', message: GENERIC_ERROR_MESSAGE };
  }

  if (err.code === 'VALIDATION_ERROR') {
    const details = err.details;
    if (isRecord(details)) {
      for (const [key, value] of Object.entries(details)) {
        if (!Array.isArray(value) || value.length === 0) continue;
        const first = value[0];
        if (typeof first !== 'string') continue;
        const fieldName = toCamelCase(key) as unknown as Path<T>;
        form.setError(fieldName, { type: 'server', message: first });
      }
    }
    // Field-level errors only — no top-level alert.
    return { kind: 'UNKNOWN_ERROR', message: '' };
  }

  if (err.code === 'INVALID_CREDENTIALS') {
    logger.warn(logEvent, { code: err.code });
    toast.error(INVALID_CREDENTIALS_MESSAGE);
    return { kind: 'INVALID_CREDENTIALS', message: INVALID_CREDENTIALS_MESSAGE };
  }

  if (err.code === 'EMAIL_TAKEN') {
    logger.warn(logEvent, { code: err.code });
    toast.error(EMAIL_TAKEN_MESSAGE);
    return { kind: 'EMAIL_TAKEN', message: EMAIL_TAKEN_MESSAGE };
  }

  if (err.code === 'REGISTRATION_FAILED') {
    logger.warn(logEvent, { code: err.code });
    toast.error('Registration failed.');
    return {
      kind: 'REGISTRATION_FAILED',
      message: REGISTRATION_FAILED_MESSAGE,
    };
  }

  if (err.code === 'NETWORK_ERROR') {
    logger.warn(logEvent, { code: err.code });
    toast.error(NETWORK_ERROR_MESSAGE);
    return { kind: 'NETWORK_ERROR', message: NETWORK_ERROR_MESSAGE };
  }

  logger.error(logEvent, err, { code: err.code });
  toast.error(GENERIC_ERROR_MESSAGE);
  return { kind: 'UNKNOWN_ERROR', message: GENERIC_ERROR_MESSAGE };
}
