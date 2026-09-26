import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ApiErrorParser,
  ErrorCode,
  ErrorMessageResolver,
  NotificationService,
  SUPPRESS_ERROR_NOTIFICATION,
} from '../errors';
import { OperatingScopeStore } from '../state/operating-scope.store';
import { ErrorService } from './error.service';

const API_PATH = '/api';

function isApiRequest(url: string): boolean {
  return url.startsWith(`${environment.apiUrl}${API_PATH}`) || url.startsWith(API_PATH);
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorService = inject(ErrorService);
  const resolver = inject(ErrorMessageResolver);
  const notifications = inject(NotificationService);
  const scope = inject(OperatingScopeStore);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (isApiRequest(req.url)) {
        const apiError = ApiErrorParser.parse(error);
        errorService.setError(apiError);

        if (apiError.code === ErrorCode.SCOPE_NOT_ESTABLISHED) {
          if (scope.markNotEstablished()) {
            notifications.warn(resolver.resolve(apiError));
          }
        } else if (error.status !== 401 && !req.context.get(SUPPRESS_ERROR_NOTIFICATION)) {
          // 401 is owned end-to-end by apiAuthInterceptor (silent refresh -> retry -> login
          // redirect on failure); notifying here would toast on every ordinary token expiry.
          notifications.error(resolver.resolve(apiError));
        }
      }

      return throwError(() => error);
    }),
  );
};
