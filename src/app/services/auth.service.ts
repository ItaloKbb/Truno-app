import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap } from 'rxjs';
import {
  isApiMessage,
  isAuthSession,
  type AuthSession,
  type ForgotPasswordResponse,
  type LoginCredentials,
} from '../domain/auth';
import type { User } from '../domain/user';
import { ProfileStorage } from './profile-storage';
import { AuthSessionStore } from './auth-session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly profiles = inject(ProfileStorage);
  private readonly store = inject(AuthSessionStore);

  readonly session = this.store.session;

  login(credentials: LoginCredentials): Observable<AuthSession> {
    return this.http.post<unknown>('/api/auth/login', credentials).pipe(
      map((body) => {
        if (!isAuthSession(body)) throw new Error('A API devolveu uma sessão inválida.');
        return body;
      }),
      tap((session) => this.remember(session)),
    );
  }

  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    return this.http.post<unknown>('/api/auth/forgot-password', { email }).pipe(
      map((body) => {
        if (!isApiMessage(body)) throw new Error('A API devolveu uma resposta inválida.');
        return body;
      }),
    );
  }

  logout(): Observable<void> {
    const token = this.store.token();
    this.store.clear();
    if (!token) return of(undefined);

    return this.http
      .post('/api/auth/logout', null, { headers: { Authorization: `Bearer ${token}` } })
      .pipe(
        map(() => undefined),
        catchError(() => of(undefined)),
      );
  }

  restoreSession(): void {
    if (!isPlatformBrowser(this.platformId) || !this.store.token()) return;

    this.http.get<unknown>('/api/auth/session').subscribe({
      next: (body) => {
        if (!isAuthSession(body)) {
          this.dropSession();
          return;
        }
        this.remember(body);
      },
      error: () => this.dropSession(),
    });
  }

  private remember(session: AuthSession): void {
    this.store.set(session);
    this.syncProfile(session.user);
  }

  private dropSession(): void {
    this.store.clear();
    if (!this.router.url.startsWith('/home')) void this.router.navigateByUrl('/home');
  }

  private syncProfile(user: User): void {
    const profile = this.profiles.loadProfile();
    const username = user.email
      .split('@')[0]
      ?.replace(/[^a-zA-Z0-9_]/g, '')
      .slice(0, 20);
    profile.displayName = user.name;
    profile.username = username || 'jogador';
    profile.avatarUrl = user.url;
    profile.initials = user.name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? '')
      .join('')
      .toUpperCase();
    this.profiles.saveProfile();
  }
}

export function messageFromApi(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    if (isApiMessage(error.error)) return error.error.message;
    if (error.status === 0) return 'Não foi possível conectar à API.';
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
