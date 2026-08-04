import { computed, inject, Injectable } from '@angular/core';
import { CustomerFinanceStore } from './customer-finance.store';
import { RentalStore } from './rental.store';
import { RentalTransactionsStore } from './rental-transactions.store';
import { DamageReportStore } from './damage-report.store';

@Injectable()
export class RentalDetailRefreshFacade {
  private readonly rentalStore = inject(RentalStore);
  private readonly transactionsStore = inject(RentalTransactionsStore);
  private readonly financeStore = inject(CustomerFinanceStore);
  private readonly damageReportStore = inject(DamageReportStore, { optional: true });

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
    this.damageReportStore?.reload();
  }

  refreshFinancials(): void {
    this.rentalStore.refreshCustomerBalance();
    this.transactionsStore.reload();
  }
}
