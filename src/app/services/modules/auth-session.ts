import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isAuthSession, type AuthSession } from '../../domain/auth';

const storageKey = 'truno.auth.session';

@Injectable({ providedIn: 'root' })
export class AuthSessionStore {
  private readonly platformId = inject(PLATFORM_ID);
  readonly session = signal<AuthSession | null>(this.read());

  token(): string | null {
    return this.session()?.token ?? null;
  }

  set(session: AuthSession): void {
    this.session.set(session);
    this.write(session);
  }

  clear(): void {
    this.session.set(null);
    if (isPlatformBrowser(this.platformId)) localStorage.removeItem(storageKey);
  }

  private read(): AuthSession | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isAuthSession(parsed)) {
        localStorage.removeItem(storageKey);
        return null;
      }
      return parsed;
    } catch {
      localStorage.removeItem(storageKey);
      return null;
    }
  }

  private write(session: AuthSession): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(storageKey, JSON.stringify(session));
    }
  }
}
