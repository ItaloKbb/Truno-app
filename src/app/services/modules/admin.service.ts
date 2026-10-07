import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, of, throwError, type Observable } from 'rxjs';
import { type CardSuit, type CardValue, type SkillDefinition, type SkillType } from '../../domain/truno-api';
import { API_BASE_URL } from '../config/api-config';
import { readApi } from '../config/api-response';

const storageKey = 'truno.admin.session';

export interface SkillInput {
  name: string;
  description: string;
  type: SkillType;
  naipe: CardSuit;
  valor: CardValue;
}

export interface AdminPuzzle {
  id: number;
  question: string;
  alternativas: string[];
  alternativaCorreta: number;
}

export type PuzzleInput = Omit<AdminPuzzle, 'id'>;

@Injectable({ providedIn: 'root' })
export class AdminSessionStore {
  private readonly platformId = inject(PLATFORM_ID);
  readonly token = signal<string | null>(this.read());

  set(token: string): void {
    this.token.set(token);
    if (isPlatformBrowser(this.platformId)) sessionStorage.setItem(storageKey, token);
  }

  clear(): void {
    this.token.set(null);
    if (isPlatformBrowser(this.platformId)) sessionStorage.removeItem(storageKey);
  }

  private read(): string | null {
    return isPlatformBrowser(this.platformId) ? sessionStorage.getItem(storageKey) : null;
  }
}

export const adminInterceptor: HttpInterceptorFn = (request, next) => {
  const api = inject(API_BASE_URL);
  if (!request.url.startsWith(`${api}/admin/`)) return next(request);
  const store = inject(AdminSessionStore);
  const router = inject(Router);
  const token = store.token();
  const authorized = token && !request.url.endsWith('/admin/sessions')
    ? request.clone({ setHeaders: { 'X-Admin-Token': token } })
    : request;
  return next(authorized).pipe(catchError((error: unknown) => {
    if (error instanceof HttpErrorResponse && error.status === 401 && !request.url.endsWith('/admin/sessions')) {
      store.clear();
      if (router.url !== '/admin') void router.navigateByUrl('/admin');
    }
    return throwError(() => error);
  }));
};

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(AdminSessionStore);
  private readonly url = `${inject(API_BASE_URL)}/admin`;

  login(username: string, password: string): Observable<void> {
    return readApi(this.http.post<unknown>(`${this.url}/sessions`, { username, password }), body => {
      const token = (body as { token?: unknown } | null)?.token;
      if (typeof token !== 'string' || !token) throw new Error('Resposta de login inválida.');
      this.store.set(token);
    }, 'Falha ao entrar no admin.');
  }

  verify(): Observable<unknown> {
    return this.http.get(`${this.url}/session`);
  }

  logout(): Observable<void> {
    return this.http.delete<void>(`${this.url}/session`).pipe(
      catchError(() => of(null)),
      map(() => { this.store.clear(); }),
    );
  }

  skills(): Observable<SkillDefinition[]> {
    return readApi(this.http.get<SkillDefinition[]>(`${this.url}/skills`), body => body as SkillDefinition[], 'Falha ao carregar as skills.');
  }

  saveSkill(input: SkillInput, id?: number): Observable<SkillDefinition> {
    const call = id == null
      ? this.http.post<SkillDefinition>(`${this.url}/skills`, input)
      : this.http.put<SkillDefinition>(`${this.url}/skills/${id}`, input);
    return readApi(call, body => body as SkillDefinition, 'Falha ao salvar a skill.');
  }

  deleteSkill(id: number): Observable<void> {
    return readApi(this.http.delete<void>(`${this.url}/skills/${id}`), () => {}, 'Falha ao excluir a skill.');
  }

  puzzles(): Observable<AdminPuzzle[]> {
    return readApi(this.http.get<AdminPuzzle[]>(`${this.url}/puzzles`), body => body as AdminPuzzle[], 'Falha ao carregar os puzzles.');
  }

  savePuzzle(input: PuzzleInput, id?: number): Observable<AdminPuzzle> {
    const call = id == null
      ? this.http.post<AdminPuzzle>(`${this.url}/puzzles`, input)
      : this.http.put<AdminPuzzle>(`${this.url}/puzzles/${id}`, input);
    return readApi(call, body => body as AdminPuzzle, 'Falha ao salvar o puzzle.');
  }

  deletePuzzle(id: number): Observable<void> {
    return readApi(this.http.delete<void>(`${this.url}/puzzles/${id}`), () => {}, 'Falha ao excluir o puzzle.');
  }
}
