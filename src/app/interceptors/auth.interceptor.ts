import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthSessionStore } from '../services/auth-session';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const store = inject(AuthSessionStore);
  const token = store.token();
  const authorized = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        token &&
        !request.url.includes('/api/auth/login')
      ) {
        store.clear();
      }
      return throwError(() => error);
    }),
  );
};
