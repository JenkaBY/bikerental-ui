import { computed, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import type { PageCustomerTransactionResponse } from '@api-models';
import type { CustomerTransaction, Money } from '@ui-models';
import { FinanceService } from '../api/generated';
import type { ApiError } from '../errors/api-error.model';
import { ApiErrorParser } from '../errors/api-error.parser';
import { resolveErrorMessage } from '../errors/error-message.resolver';
import { suppressErrorNotification } from '../errors/http-error-context';
import { TransactionMapper } from '../mappers/transaction.mapper';
import { makeMoney } from '../mappers/money.mapper';
import { RentalStore } from './rental.store';

interface RentalTransactionsParams {
  rentalId: number;
  customerId: string;
}

interface RentalTransactionsView {
  transactions: CustomerTransaction[];
  count: number;
  reservedAmount: number;
}

const EMPTY_VIEW: RentalTransactionsView = { transactions: [], count: 0, reservedAmount: 0 };
const PAGE_SIZE = 100;

@Injectable()
export class RentalTransactionsStore {
  private readonly rentalStore = inject(RentalStore);
  private readonly financeService = inject(FinanceService);

  private readonly params = computed<RentalTransactionsParams | null>(() => {
    const rentalId = this.rentalStore.id();
    const customerId = this.rentalStore.customerId();
    if (rentalId === null || !customerId) return null;
    return { rentalId, customerId };
  });

  private readonly _error = signal<ApiError | null>(null);
  private readonly _lastView = signal<RentalTransactionsView>(EMPTY_VIEW);

  private readonly resource = rxResource<RentalTransactionsView, RentalTransactionsParams | null>({
    params: () => this.params(),
    stream: ({ params }: { params: RentalTransactionsParams | null }) => {
      if (!params) return of(EMPTY_VIEW).pipe(tap((view) => this.acceptView(view)));
      return this.financeService
        .getTransactionHistory(
          params.customerId,
          { sourceId: String(params.rentalId), sourceType: 'RENTAL' },
          { page: 0, size: PAGE_SIZE },
          undefined,
          { context: suppressErrorNotification() },
        )
        .pipe(
          map((page) => this.toView(page)),
          tap((view) => this.acceptView(view)),
          catchError((err: unknown) => {
            this._error.set(ApiErrorParser.parse(err));
            return of(this._lastView());
          }),
        );
    },
  });

  readonly transactions = computed<CustomerTransaction[]>(
    () => this.resource.value()?.transactions ?? [],
  );
  readonly transactionCount = computed<number>(() => this.resource.value()?.count ?? 0);
  readonly reserved = computed<Money>(() => makeMoney(this.resource.value()?.reservedAmount ?? 0));
  readonly loading = this.resource.isLoading;
  readonly error = this._error.asReadonly();
  readonly errorMessage = computed<string | null>(() => {
    const err = this._error();
    return err ? resolveErrorMessage(err) : null;
  });

  reload(): void {
    this.resource.reload();
  }

  private acceptView(view: RentalTransactionsView): void {
    this._error.set(null);
    this._lastView.set(view);
  }

  private toView(page: PageCustomerTransactionResponse): RentalTransactionsView {
    const rawItems = page.items ?? [];
    const transactions = rawItems
      .map((item) => TransactionMapper.fromTransactionItem(item))
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
    return {
      transactions,
      count: page.totalItems ?? rawItems.length,
      reservedAmount: TransactionMapper.latestHoldAmount(rawItems),
    };
  }
}
