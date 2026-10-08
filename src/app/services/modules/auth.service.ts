import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of, tap } from 'rxjs';
import { isApiMessage, isAuthSession, type AuthSession, type LoginCredentials } from '../../domain/auth';
import { profileUsername } from '../../domain/profile';
import type { PlayerUser } from '../../domain/truno-api';
import { API_BASE_URL } from '../config/api-config';
import { AuthSessionStore } from './auth-session';
import { ProfileStorage } from './profile-storage';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${inject(API_BASE_URL)}/auth/sessions`;
  private readonly profiles = inject(ProfileStorage);
  private readonly store = inject(AuthSessionStore);

  readonly session = this.store.session;

  /** `POST /auth/sessions`: o primeiro acesso cria a conta. */
  login(credentials: LoginCredentials): Observable<AuthSession> {
    return this.http
      .post<unknown>(this.apiUrl, {
        nickname: credentials.nickname.trim(),
        code: credentials.code,
      })
      .pipe(
        map((body) => {
          if (!isAuthSession(body)) throw new Error('A API devolveu uma sessão inválida.');
          return body;
        }),
        tap((session) => this.remember(session)),
      );
  }

  /** A API não tem logout: só apaga a sessão local. */
  logout(): Observable<void> {
    this.store.clear();
    return of(undefined);
  }

  private remember(session: AuthSession): void {
    this.store.set(session);
    this.syncProfile(session.user);
  }

  private syncProfile(user: PlayerUser): void {
    const profile = this.profiles.loadProfile();
    profile.displayName = user.nickname;
    profile.username = profileUsername(user.nickname);
    profile.initials = user.nickname
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? '')
      .join('')
      .toUpperCase();
    this.profiles.saveProfile();
  }
}

/** Frase para a tela: a mensagem devolvida pela API, quando existir. */
export function messageFromApi(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    if (isApiMessage(error.error)) return error.error.message;
    if (error.status === 0) return 'Não foi possível conectar à API.';
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
