import { computed, inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import type { PageCustomerTransactionResponse } from '@api-models';
import type { CustomerTransaction, Money } from '@ui-models';
import { FinanceService } from '../api/generated';
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

  private readonly resource = rxResource<RentalTransactionsView, RentalTransactionsParams | null>({
    params: () => this.params(),
    stream: ({ params }: { params: RentalTransactionsParams | null }) => {
      if (!params) return of(EMPTY_VIEW);
      return this.financeService
        .getTransactionHistory(
          params.customerId,
          { sourceId: String(params.rentalId), sourceType: 'RENTAL' },
          { page: 0, size: PAGE_SIZE },
        )
        .pipe(
          map((page) => this.toView(page)),
          catchError(() => of(EMPTY_VIEW)),
        );
    },
  });

  readonly transactions = computed<CustomerTransaction[]>(
    () => this.resource.value()?.transactions ?? [],
  );
  readonly transactionCount = computed<number>(() => this.resource.value()?.count ?? 0);
  readonly reserved = computed<Money>(() => makeMoney(this.resource.value()?.reservedAmount ?? 0));
  readonly loading = this.resource.isLoading;

  reload(): void {
    this.resource.reload();
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
