import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { logger } from '@/lib/logger';
import { clearToken, getToken } from '@/lib/tokenStorage';

/**
 * Server error envelope shape (see backend `DTOs/ErrorResponse.cs`):
 *   { error: { code: string, message: string, details?: object | null } }
 *
 * The body is always JSON, even for 5xx (the `ExceptionHandlingMiddleware`
 * writes the same envelope with `INTERNAL_ERROR`).
 */
interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

interface ErrorEnvelope {
  error: ErrorBody;
}

/**
 * Thrown by all `api/*` modules so callers can discriminate
 * network/4xx/5xx failures with `instanceof ApiError`.
 */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * `baseURL` is `/api` so that the Vite dev proxy (`/api → :5000`) and any
 * production same-origin reverse proxy work without code changes.
 */
export const api: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

function requestPathname(config: InternalAxiosRequestConfig | undefined): string {
  const url = config?.url ?? '';
  if (!url) return '';
  try {
    return new URL(url, 'http://x').pathname;
  } catch {
    return url;
  }
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  // Tag the request so the response interceptor can compute elapsed time.
  config.metadata = { startedAt: Date.now() };
  return config;
});

api.interceptors.response.use(
  (response) => {
    const startedAt = response.config.metadata?.startedAt;
    const elapsedMs = typeof startedAt === 'number' ? Date.now() - startedAt : undefined;
    logger.api(
      response.config.method?.toUpperCase() ?? 'GET',
      requestPathname(response.config),
      response.status,
      elapsedMs,
    );
    return response;
  },
  (error: AxiosError<ErrorEnvelope>) => {
    const startedAt = error.config?.metadata?.startedAt;
    const elapsedMs = typeof startedAt === 'number' ? Date.now() - startedAt : undefined;
    logger.api(
      error.config?.method?.toUpperCase() ?? 'GET',
      requestPathname(error.config),
      error.response?.status,
      elapsedMs,
    );

    // No response at all (network failure, CORS, timeout). Log only the
    // message so the Authorization header (in error.config.headers) and
    // any query string in error.config.url never reach the console.
    if (!error.response) {
      logger.error('api_network_error', new Error(error.message));
      throw new ApiError('NETWORK_ERROR', 'Unable to reach the server.', 0);
    }

    const { status, data } = error.response;

    if (data && typeof data === 'object' && 'error' in data) {
      const body = data.error;
      const code = typeof body?.code === 'string' ? body.code : 'UNKNOWN_ERROR';
      const message = typeof body?.message === 'string' ? body.message : 'Request failed.';
      const details = body?.details;

      // 401 = dead session. Drop the token; the AuthProvider will see
      // /me fail on the next render and the ProtectedRoute guard will
      // navigate to /login. We intentionally do NOT call navigate()
      // here — that would race with in-flight requests and split the
      // single source of truth between the network layer and the UI.
      if (status === 401) {
        clearToken();
      }

      logger.error('api_error', undefined, { status, code });
      throw new ApiError(code, message, status, details);
    }

    logger.error('api_unexpected_error', undefined, { status });
    throw new ApiError('UNKNOWN_ERROR', 'Unexpected server response.', status);
  },
);

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    metadata?: { startedAt: number };
  }
}
