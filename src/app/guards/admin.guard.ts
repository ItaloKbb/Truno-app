import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { AdminSessionStore } from '../services/modules/admin.service';

export const adminGuard: CanActivateFn = (_route, state) => {
  if (inject(AdminSessionStore).token()) return true;
  return inject(Router).createUrlTree(['/admin'], { queryParams: { returnUrl: state.url } });
};
