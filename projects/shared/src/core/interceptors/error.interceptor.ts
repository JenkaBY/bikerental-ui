import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ApiErrorParser,
  ErrorMessageResolver,
  NotificationService,
  SUPPRESS_ERROR_NOTIFICATION,
} from '../errors';
import { ErrorService } from './error.service';

const API_PATH = '/api';

function isApiRequest(url: string): boolean {
  return url.startsWith(`${environment.apiUrl}${API_PATH}`) || url.startsWith(API_PATH);
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorService = inject(ErrorService);
  const resolver = inject(ErrorMessageResolver);
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (isApiRequest(req.url)) {
        const apiError = ApiErrorParser.parse(error);
        errorService.setError(apiError);

        if (!req.context.get(SUPPRESS_ERROR_NOTIFICATION)) {
          notifications.error(resolver.resolve(apiError));
        }
      }

      return throwError(() => error);
    }),
  );
};
