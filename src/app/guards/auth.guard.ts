import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { AuthSessionStore } from '../services/modules/auth-session';
import { safeReturnUrl } from './return-url';

export const authGuard: CanActivateFn = (_route, state) => {
  const store = inject(AuthSessionStore);
  const router = inject(Router);
  if (store.session()) return true;

  return router.createUrlTree(['/home'], { queryParams: { returnUrl: state.url } });
};

export const guestGuard: CanActivateFn = (route) => {
  const store = inject(AuthSessionStore);
  const router = inject(Router);
  if (!store.session()) return true;

  const returnUrl = route.queryParamMap.get('returnUrl');
  return router.parseUrl(safeReturnUrl(returnUrl));
};
