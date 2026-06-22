import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '@/api/auth';
import { ApiError } from '@/api/client';
import { logger } from '@/lib/logger';
import { safeNextPath } from '@/lib/nextPath';
import { clearToken, getToken, setToken } from '@/lib/tokenStorage';

interface AuthContextValue {
  user: authApi.UserResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  /**
   * `true` while the bootstrap `/auth/me` call is in flight. Route guards
   * (see `ProtectedRoute`, `RedirectIfAuthed`) must show a spinner while
   * loading is true to avoid the flash-of-redirect race.
   */
  isLoading: boolean;
  /**
   * Persist the token + user. When `next` is provided, the post-login
   * navigation is handled here (after the token is set). `next` is
   * sanitized through `safeNextPath` to reject open-redirect vectors.
   */
  login: (
    token: string,
    user: authApi.UserResponse,
    next?: string,
  ) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): ReactNode {
  const [token, setTokenState] = useState<string | null>(getToken());
  const [user, setUser] = useState<authApi.UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(token !== null);
  const navigate = useNavigate();

  // Bootstrap: if we restored a token from localStorage, verify it by
  // calling /me. On 401 the response interceptor already cleared the
  // token; we just need to settle state.
  useEffect(() => {
    if (token === null) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    authApi
      .me()
      .then((u) => {
        if (cancelled) return;
        setUser(u);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          // Stale token — drop it silently.
          setTokenState(null);
        } else {
          logger.error('auth_me_failed', err);
        }
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = useCallback<AuthContextValue['login']>(
    (newToken, newUser, next) => {
      setToken(newToken);
      setTokenState(newToken);
      setUser(newUser);
      if (next !== undefined) {
        navigate(safeNextPath(next), { replace: true });
      }
    },
    [navigate],
  );

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: user !== null && token !== null,
      isLoading,
      login,
      logout,
    }),
    [user, token, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// `useAuth` is intentionally exported from the same file as `<AuthProvider>`
// for ergonomic imports: `import { useAuth } from './auth/AuthContext'`.
// The `react-refresh/only-export-components` warning is a false positive
// for this pattern; Fast Refresh still works in practice.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuth must be used within an <AuthProvider>.');
  }
  return ctx;
}
