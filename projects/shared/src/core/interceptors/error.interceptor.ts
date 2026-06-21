import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import {
  ApiErrorParser,
  ErrorMessageResolver,
  NotificationService,
  SUPPRESS_ERROR_NOTIFICATION,
} from '../errors';
import { ErrorService } from './error.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorService = inject(ErrorService);
  const resolver = inject(ErrorMessageResolver);
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const apiError = ApiErrorParser.parse(error);
      errorService.setError(apiError);

      if (!req.context.get(SUPPRESS_ERROR_NOTIFICATION)) {
        notifications.error(resolver.resolve(apiError));
      }

      return throwError(() => error);
    }),
  );
};
