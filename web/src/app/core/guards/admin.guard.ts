import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isTokenExpired } from '../utils/jwt';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token;
  if (!token || isTokenExpired(token)) {
    return router.createUrlTree(['/login']);
  }
  auth.syncRoleFromToken();
  if (auth.isAdmin()) {
    return true;
  }
  return router.createUrlTree(['/app/dashboard']);
};

export const appUserGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token;
  if (!token || isTokenExpired(token)) {
    return router.createUrlTree(['/login']);
  }
  auth.syncRoleFromToken();
  if (auth.isAdmin()) {
    return router.createUrlTree(['/admin/accounts']);
  }
  return true;
};
