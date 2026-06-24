import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { catchError, switchMap, take, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export const SKIP_AUTH_RETRY = new HttpContextToken<boolean>(() => false);

const API_PATH = '/api';

function isApiRequest(url: string): boolean {
  return url.startsWith(`${environment.apiUrl}${API_PATH}`) || url.startsWith(API_PATH);
}

export const apiAuthInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) {
    return next(req);
  }

  const oidc = inject(OidcSecurityService);
  const auth = inject(AuthService);

  return oidc.getAccessToken().pipe(
    take(1),
    switchMap((token) => {
      const initialReq = token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;

      return next(initialReq).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status !== 401 || req.context.get(SKIP_AUTH_RETRY)) {
            return throwError(() => error);
          }

          return auth.refresh().pipe(
            switchMap(() => oidc.getAccessToken().pipe(take(1))),
            switchMap((refreshedToken) => {
              if (!refreshedToken) {
                auth.login();
                return throwError(() => error);
              }
              const retriedReq = req.clone({
                setHeaders: { Authorization: `Bearer ${refreshedToken}` },
                context: req.context.set(SKIP_AUTH_RETRY, true),
              });
              return next(retriedReq);
            }),
            catchError(() => {
              auth.login();
              return throwError(() => error);
            }),
          );
        }),
      );
    }),
  );
};
