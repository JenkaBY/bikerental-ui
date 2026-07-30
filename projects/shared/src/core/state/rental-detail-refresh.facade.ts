import { computed, inject, Injectable } from '@angular/core';
import { CustomerFinanceStore } from './customer-finance.store';
import { RentalStore } from './rental.store';
import { RentalTransactionsStore } from './rental-transactions.store';

@Injectable()
export class RentalDetailRefreshFacade {
  private readonly rentalStore = inject(RentalStore);
  private readonly transactionsStore = inject(RentalTransactionsStore);
  private readonly financeStore = inject(CustomerFinanceStore);

  readonly isRefreshing = computed(
    () =>
      this.rentalStore.isLoading() ||
      this.transactionsStore.loading() ||
      this.financeStore.loading(),
  );

  refreshAll(rentalId?: number): void {
    const id = rentalId ?? this.rentalStore.id();
    if (id === null) return;
    this.rentalStore.loadDetail(id);
    this.transactionsStore.reload();
  }

  refreshFinancials(): void {
    this.rentalStore.refreshCustomerBalance();
    this.transactionsStore.reload();
  }
}
