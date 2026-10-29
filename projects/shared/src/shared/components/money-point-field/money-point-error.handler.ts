import { inject, Injectable } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ApiErrorParser } from '../../../core/errors/api-error.parser';
import { ErrorCode } from '../../../core/errors/error-code';
import { ErrorMessageResolver } from '../../../core/errors/error-message.resolver';
import { NotificationService } from '../../../core/errors/notification.service';

@Injectable({ providedIn: 'root' })
export class MoneyPointErrorHandler {
  private readonly resolver = inject(ErrorMessageResolver);
  private readonly notifications = inject(NotificationService);

  handle(err: unknown, pointControl: FormControl<string | null>): boolean {
    const apiError = ApiErrorParser.parse(err);
    if (apiError.code === ErrorCode.SCOPE_NOT_ESTABLISHED) {
      pointControl.reset(null);
      pointControl.markAsTouched();
      return true;
    }
    this.notifications.error(this.resolver.resolve(apiError));
    return false;
  }
}
