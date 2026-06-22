import { api } from './client';

/** Public-facing user profile returned by `/auth/me`, `/login`, `/register`. */
export interface UserResponse {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
}

/** Body for `POST /auth/login`. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Body for `POST /auth/register`. */
export interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
}

/** Response for `POST /auth/login` and `POST /auth/register`. */
export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: UserResponse;
}

export async function login(req: LoginRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', req);
  return data;
}

export async function register(req: RegisterRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', req);
  return data;
}

export async function me(): Promise<UserResponse> {
  const { data } = await api.get<UserResponse>('/auth/me');
  return data;
}
