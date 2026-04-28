import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, EMPTY, finalize, map } from 'rxjs';
import type { CustomerTransactionResponse, PageCustomerTransactionResponse } from '@api-models';
import { CustomerTransaction, TransactionMapper } from '@bikerental/shared';
import { CustomerLayoutStore } from './customer-layout.store';
import { FinanceService } from '../../../../../shared/src/core/api/generated';

const PAGE_SIZE = 10;

@Injectable()
export class CustomerTransactionsStore {
  private readonly financeService = inject(FinanceService);
  private readonly layoutStore = inject(CustomerLayoutStore);

  private readonly _transactions = signal<CustomerTransaction[]>([]);
  private readonly _loaded = signal(false);
  readonly transactions = computed(() => this._transactions());
  readonly totalItems = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(PAGE_SIZE);

  readonly loading = signal(false);

  load(): void {
    if (this._loaded()) return;
    this.fetchPage(0);
  }

  invalidate(): void {
    this._loaded.set(false);
  }

  loadPage(index: number): void {
    this.fetchPage(index);
  }

  private fetchPage(index: number): void {
    const customerId = this.layoutStore.customerId();
    if (!customerId) return;

    this.loading.set(true);
    this.financeService
      .getTransactionHistory(customerId, {}, { page: index, size: PAGE_SIZE })
      .pipe(
        map((page: PageCustomerTransactionResponse) => {
          const items: CustomerTransactionResponse[] = page.items ?? [];
          return {
            items: items.map((item) => TransactionMapper.fromTransactionItem(item)),
            total: page.totalItems ?? 0,
          };
        }),
        catchError(() => {
          this._transactions.set([]);
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((res) => {
        this._transactions.set(res.items);
        this.totalItems.set(res.total);
        this.pageIndex.set(index);
        this._loaded.set(true);
      });
  }
}
