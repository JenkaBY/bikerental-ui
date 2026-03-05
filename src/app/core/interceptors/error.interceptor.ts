import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ErrorService } from './error.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorService = inject(ErrorService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.error && typeof error.error === 'object' && 'title' in error.error) {
        errorService.setError({
          title: error.error.title ?? 'Error',
          detail: error.error.detail ?? '',
          status: error.error.status ?? error.status,
        });
      } else {
        errorService.setError({
          title: `HTTP Error ${error.status}`,
          detail: error.message,
          status: error.status,
        });
      }
      return throwError(() => error);
    }),
  );
};
