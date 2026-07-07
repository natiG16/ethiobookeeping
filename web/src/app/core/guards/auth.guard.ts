import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isTokenExpired } from '../utils/jwt';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token;
  if (token && !isTokenExpired(token)) return true;
  if (token && isTokenExpired(token)) {
    auth.handleSessionExpired();
    return false;
  }
  return router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return true;
  return router.createUrlTree([auth.homeRoute()]);
};
