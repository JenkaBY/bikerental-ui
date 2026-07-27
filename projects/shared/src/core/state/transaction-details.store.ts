import { computed, inject, Injectable, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { CustomersService, FinanceService, UsersService } from '../api/generated';
import { ApiErrorParser } from '../errors/api-error.parser';
import { resolveErrorMessage } from '../errors/error-message.resolver';
import { suppressErrorNotification } from '../errors/http-error-context';
import { NotificationService } from '../errors/notification.service';
import { TransactionMapper } from '../mappers/transaction.mapper';
import type { CustomerRef, TransactionDetails } from '@ui-models';

@Injectable()
export class TransactionDetailsStore {
  private readonly financeService = inject(FinanceService);
  private readonly customersService = inject(CustomersService);
  private readonly usersService = inject(UsersService);
  private readonly notification = inject(NotificationService);

  private readonly _details = signal<TransactionDetails | null>(null);
  private readonly _customer = signal<CustomerRef | null>(null);
  private readonly _operatorName = signal<string | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal(false);

  readonly details = computed(() => this._details());
  readonly customer = computed(() => this._customer());
  readonly operatorName = computed(() => this._operatorName());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  load(transactionId: string): void {
    this._loading.set(true);
    this._error.set(false);
    this.financeService
      .getTransactionDetails(transactionId, 'body', { context: suppressErrorNotification() })
      .pipe(
        switchMap((response) => {
          const details = TransactionMapper.fromTransactionDetails(response);
          return forkJoin({
            details: of(details),
            customer: this.customersService
              .getById(details.customerId, 'body', { context: suppressErrorNotification() })
              .pipe(catchError(() => of(null))),
            operator: this.usersService
              .get(details.operatorId, 'body', { context: suppressErrorNotification() })
              .pipe(catchError(() => of(null))),
          });
        }),
        catchError((err: unknown) => {
          this._error.set(true);
          this.notification.error(resolveErrorMessage(ApiErrorParser.parse(err)));
          return of(null);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe((result) => {
        if (!result) return;
        this._details.set(result.details);
        this._customer.set(
          result.customer
            ? {
                id: result.customer.id,
                phone: result.customer.phone,
                name:
                  `${result.customer.firstName ?? ''} ${result.customer.lastName ?? ''}`.trim() ||
                  undefined,
              }
            : null,
        );
        this._operatorName.set(result.operator?.displayName ?? result.operator?.username ?? null);
      });
  }
}
