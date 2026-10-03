import { inject, Injectable } from '@angular/core';
import { ApiError } from './api-error.model';
import { ApiErrorParser } from './api-error.parser';
import { ErrorCode } from './error-code';
import { resolveErrorMessage } from './error-message.resolver';
import { NotificationService } from './notification.service';

const STALE_RENTAL_CODES = new Set<string>([
  ErrorCode.STATUS_INVALID,
  ErrorCode.RESOURCE_NOT_FOUND,
]);

export function isStaleRentalError(error: ApiError): boolean {
  return STALE_RENTAL_CODES.has(error.code);
}

@Injectable({ providedIn: 'root' })
export class RentalActionErrorNotifier {
  private readonly notifications = inject(NotificationService);

  notify(err: unknown): ApiError {
    const apiError = ApiErrorParser.parse(err);
    const message = resolveErrorMessage(apiError);
    if (isStaleRentalError(apiError)) {
      this.notifications.warn(message);
    } else {
      this.notifications.error(message);
    }
    return apiError;
  }
}
