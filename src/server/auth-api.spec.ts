import { describe, expect, it } from 'vitest';
import { DEMO_LOGIN, createAuthApi } from './auth-api';

describe('POST /api/auth', () => {
  it('returns the domain user and a token for the demo account', () => {
    const api = createAuthApi();
    const result = api.login({ email: '  LucasMartins@Truno.app ', password: DEMO_LOGIN.password });

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({
      user: {
        id: 'user-lucas',
        name: 'Lucas Martins',
        email: DEMO_LOGIN.email,
        coin: { balance: 15750 },
      },
    });
    expect(result.body && 'token' in result.body && result.body.token).toEqual(expect.any(String));
    expect(JSON.stringify(result.body)).not.toContain(DEMO_LOGIN.password);
  });

  it('rejects an unknown password without describing which field failed', () => {
    const api = createAuthApi();

    expect(api.login({ email: DEMO_LOGIN.email, password: 'senhaerrada' })).toEqual({
      status: 401,
      body: { message: 'E-mail ou senha inválidos.' },
    });
  });

  it('rejects a short or malformed payload', () => {
    const api = createAuthApi();

    expect(api.login({ email: 'nao-e-email', password: '12345678' }).status).toBe(400);
    expect(api.login({ email: DEMO_LOGIN.email, password: 'curta' }).status).toBe(400);
  });

  it('reads and ends the session created by login', () => {
    const api = createAuthApi();
    const login = api.login({ email: DEMO_LOGIN.email, password: DEMO_LOGIN.password });
    const token = login.body && 'token' in login.body ? login.body.token : '';

    expect(api.readSession(`Bearer ${token}`).status).toBe(200);
    expect(api.readSession('Bearer token-inexistente').status).toBe(401);
    expect(api.endSession(`Bearer ${token}`)).toEqual({ status: 204 });
    expect(api.readSession(`Bearer ${token}`).status).toBe(401);
  });

  it('accepts a password reset request without revealing whether the email exists', () => {
    const api = createAuthApi();

    expect(api.forgotPassword({ email: 'outra@truno.app' })).toEqual({
      status: 202,
      body: { message: 'Se existir uma conta com esse e-mail, enviaremos as instruções.' },
    });
    expect(api.forgotPassword({ email: 'invalido' }).status).toBe(400);
  });
});
