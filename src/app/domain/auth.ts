import type { User } from './user';

/**
 * Contrato da API de autenticação em `/api/auth`.
 *
 * POST `/api/auth/login` { email, password }
 *   200 AuthSession | 400 ou 401 { message }
 * GET `/api/auth/session` com `Authorization: Bearer <token>`
 *   200 AuthSession | 401 { message }
 * POST `/api/auth/logout` com o mesmo cabeçalho
 *   204
 * POST `/api/auth/forgot-password` { email }
 *   202 { message } | 400 { message }
 *
 * A sessão devolve o `User` do domínio. A senha nunca volta na resposta.
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  token: string;
  user: User;
}

export interface ApiMessage {
  message: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') return false;

  const session = value as Partial<AuthSession>;
  const user = session.user;
  return (
    typeof session.token === 'string' &&
    session.token.length > 0 &&
    !!user &&
    typeof user.id === 'string' &&
    typeof user.name === 'string' &&
    typeof user.email === 'string' &&
    typeof user.url === 'string' &&
    !!user.coin &&
    typeof user.coin.id === 'string' &&
    typeof user.coin.balance === 'number'
  );
}

export function isApiMessage(value: unknown): value is ApiMessage {
  return !!value && typeof value === 'object' && typeof (value as ApiMessage).message === 'string';
}
