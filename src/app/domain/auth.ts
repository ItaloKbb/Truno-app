import type { PlayerUser } from './truno-api';

/**
 * Contrato da API de autenticação.
 *
 * POST `/auth/sessions` { nickname, code }
 *   200 AuthSession | 400 ou 401 { message }
 *
 * O primeiro acesso cria a conta; nos seguintes, o mesmo código. O token vai no
 * cabeçalho `X-Player-Token`. Não existem refresh token nem logout remoto.
 */
export interface LoginCredentials {
  /** Não vazio, no máximo 30 caracteres. */
  nickname: string;
  /** De 4 a 30 caracteres. */
  code: string;
}

export const NICKNAME_MAX_LENGTH = 30;
export const CODE_MIN_LENGTH = 4;
export const CODE_MAX_LENGTH = 30;

export interface AuthSession {
  token: string;
  user: PlayerUser;
}

export interface ApiMessage {
  message: string;
}

export function isPlayerUser(value: unknown): value is PlayerUser {
  if (!value || typeof value !== 'object') return false;
  const user = value as Partial<PlayerUser>;
  return (
    typeof user.id === 'number' &&
    typeof user.nickname === 'string' &&
    typeof user.rankingPoints === 'number'
  );
}

export function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') return false;
  const session = value as Partial<AuthSession>;
  return typeof session.token === 'string' && session.token.length > 0 && isPlayerUser(session.user);
}

export function isApiMessage(value: unknown): value is ApiMessage {
  return !!value && typeof value === 'object' && typeof (value as ApiMessage).message === 'string';
}
