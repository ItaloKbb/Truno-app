import { timingSafeEqual, randomUUID } from 'node:crypto';
import { Router } from 'express';
import type { AuthSession, ForgotPasswordResponse } from '../app/domain/auth';
import type { User } from '../app/domain/user';

/** Conta usada pela tela de login enquanto o cadastro público não existe. */
export const DEMO_LOGIN = {
  email: 'lucasmartins@truno.app',
  password: 'truno1234',
} as const;

const demoUser: User = {
  id: 'user-lucas',
  name: 'Lucas Martins',
  email: DEMO_LOGIN.email,
  url: '',
  coin: {
    id: 'coin-lucas',
    balance: 15750,
  },
};

const invalidCredentials = { message: 'E-mail ou senha inválidos.' };
const invalidPayload = { message: 'Informe um e-mail e uma senha válidos.' };
const forgotPasswordMessage = {
  message: 'Se existir uma conta com esse e-mail, enviaremos as instruções.',
};

export interface AuthResult<T> {
  status: number;
  body?: T;
}

export interface AuthApi {
  login(input: unknown): AuthResult<AuthSession | { message: string }>;
  readSession(authorization: string | undefined): AuthResult<AuthSession | { message: string }>;
  endSession(authorization: string | undefined): AuthResult<never>;
  forgotPassword(input: unknown): AuthResult<ForgotPasswordResponse | { message: string }>;
}

export function createAuthApi(): AuthApi {
  const sessions = new Map<string, User>();

  return {
    login(input: unknown) {
      const credentials = readCredentials(input);
      if (!credentials) return { status: 400, body: invalidPayload };

      const emailMatches = safeEqual(credentials.email, DEMO_LOGIN.email);
      const passwordMatches = safeEqual(credentials.password, DEMO_LOGIN.password);
      if (!emailMatches || !passwordMatches) return { status: 401, body: invalidCredentials };

      const token = randomUUID();
      sessions.set(token, demoUser);
      return { status: 200, body: { token, user: demoUser } };
    },

    readSession(authorization: string | undefined) {
      const user = sessions.get(bearerToken(authorization) ?? '');
      if (!user) return { status: 401, body: { message: 'Sessão expirada. Entre novamente.' } };

      return { status: 200, body: { token: bearerToken(authorization) as string, user } };
    },

    endSession(authorization: string | undefined) {
      const token = bearerToken(authorization);
      if (token) sessions.delete(token);
      return { status: 204 };
    },

    forgotPassword(input: unknown) {
      const email = readEmail(input);
      if (!email) return { status: 400, body: { message: 'Informe um e-mail válido.' } };
      return { status: 202, body: forgotPasswordMessage };
    },
  };
}

export function authRouter(api: AuthApi): Router {
  const router = Router();

  router.post('/login', (request, response) => {
    const result = api.login(request.body);
    response.status(result.status).json(result.body);
  });

  router.get('/session', (request, response) => {
    const result = api.readSession(request.header('authorization'));
    response.status(result.status).json(result.body);
  });

  router.post('/logout', (request, response) => {
    const result = api.endSession(request.header('authorization'));
    response.status(result.status).send();
  });

  router.post('/forgot-password', (request, response) => {
    const result = api.forgotPassword(request.body);
    response.status(result.status).json(result.body);
  });

  return router;
}

function readCredentials(input: unknown): { email: string; password: string } | null {
  if (!input || typeof input !== 'object') return null;

  const body = input as { email?: unknown; password?: unknown };
  const email = readEmail({ email: body.email });
  if (!email || typeof body.password !== 'string' || body.password.length < 8) return null;

  return { email, password: body.password };
}

function readEmail(input: unknown): string | null {
  if (!input || typeof input !== 'object') return null;

  const email = (input as { email?: unknown }).email;
  if (typeof email !== 'string') return null;

  const normalized = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null;
}

function bearerToken(authorization: string | undefined): string | undefined {
  if (!authorization?.startsWith('Bearer ')) return undefined;
  const token = authorization.slice('Bearer '.length).trim();
  return token || undefined;
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}
