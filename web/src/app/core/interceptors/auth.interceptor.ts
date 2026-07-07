import { HttpInterceptorFn, HttpBackend, HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { isServiceDeactivatedError } from '../utils/http-error';

let refreshHttp: HttpClient | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = localStorage.getItem('accessToken');
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err) => {
      if (isServiceDeactivatedError(err)) {
        auth.handleServiceDeactivated();
        return throwError(() => err);
      }
      const isMultipart = req.body instanceof FormData;
      const shouldRefresh =
        err.status === 401 && !req.url.includes('/auth/') && !isMultipart;
      if (!shouldRefresh) {
        if (err.status === 401 && isMultipart) {
          auth.handleSessionExpired();
        }
        return throwError(() => err);
      }
      const refresh = localStorage.getItem('refreshToken');
      if (!refresh) {
        auth.handleSessionExpired();
        return throwError(() => err);
      }
      if (!refreshHttp) {
        refreshHttp = new HttpClient(inject(HttpBackend));
      }
      return refreshHttp
        .post<{ data: { accessToken: string; refreshToken: string } }>(
          `${environment.apiUrl}/auth/refresh`,
          { refreshToken: refresh }
        )
        .pipe(
          switchMap((res) => {
            localStorage.setItem('accessToken', res.data.accessToken);
            localStorage.setItem('refreshToken', res.data.refreshToken);
            auth.syncRoleFromToken();
            auth.startSessionMonitor();
            return next(
              req.clone({ setHeaders: { Authorization: `Bearer ${res.data.accessToken}` } })
            );
          }),
          catchError((e) => {
            auth.handleSessionExpired();
            return throwError(() => e);
          })
        );
    })
  );
};
