import { computed, inject, Injectable, signal } from '@angular/core';
import { CustomerStore } from '@bikerental/shared';
import { CustomerFinanceStore } from '@store.customer-finance.store';

@Injectable()
export class CustomerLayoutStore {
  private readonly customerStore = inject(CustomerStore);
  private readonly financeStore = inject(CustomerFinanceStore);
  private _customerId = signal<string | null>(null);

  readonly customerId = computed(() => this._customerId());
  readonly customer = this.customerStore.customer;
  readonly balance = this.financeStore.balance;

  readonly isLoading = computed(() => this.customerStore.loading || this.financeStore.loading);

  init(id: string): void {
    this._customerId.set(id);

    this.customerStore.loadById(id);
    this.financeStore.loadById(id);
  }
}
