import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_BASE_URL } from '../services/config/api-config';
import { AuthSessionStore } from '../services/modules/auth-session';

/**
 * Anexa `X-Player-Token` nas chamadas à API Truno Crazzy. Um 401 em rota
 * autenticada invalida a sessão local e leva o jogador de volta ao login.
 * `POST /auth/sessions` fica de fora: credencial errada também responde 401.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const apiUrl = inject(API_BASE_URL);
  if (!request.url.startsWith(apiUrl) || request.url.startsWith(`${apiUrl}/admin/`)) return next(request);

  const store = inject(AuthSessionStore);
  const router = inject(Router);
  const token = store.token();
  const authorized = token ? request.clone({ setHeaders: { 'X-Player-Token': token } }) : request;

  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        token &&
        !request.url.endsWith('/auth/sessions')
      ) {
        store.clear();
        if (!router.url.startsWith('/home')) void router.navigateByUrl('/home');
      }
      return throwError(() => error);
    }),
  );
};
