import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { api, CustomerRentalSummary, RentalMapper } from '@bikerental/shared';
import { CustomerLayoutStore } from './customer-layout.store';

@Injectable()
export class CustomerRentalsStore {
  private readonly rentalsService = inject(api.RentalsService);
  private readonly layoutStore = inject(CustomerLayoutStore);

  readonly rentals = signal<CustomerRentalSummary[]>([]);
  readonly expandedIds = signal<Set<number>>(new Set());
  readonly detailCache = signal<Map<number, api.RentalResponse>>(new Map());
  readonly loadingDetailIds = signal<Set<number>>(new Set());
  readonly listLoading = signal(false);

  private loaded = false;

  load(): void {
    if (this.loaded) return;
    const customerId = this.layoutStore.customerId();
    if (!customerId) return;

    this.listLoading.set(true);
    firstValueFrom(
      this.rentalsService.getRentals({ page: 0, size: 20 }, undefined, customerId),
    ).then(
      (page) => {
        this.rentals.set((page.items ?? []).map((r) => RentalMapper.fromRentalSummary(r)));
        this.listLoading.set(false);
        this.loaded = true;
      },
      () => {
        this.rentals.set([]);
        this.listLoading.set(false);
      },
    );
  }

  toggleExpand(id: number): void {
    const current = new Set(this.expandedIds());
    if (current.has(id)) {
      current.delete(id);
      this.expandedIds.set(current);
      return;
    }
    current.add(id);
    this.expandedIds.set(current);

    if (this.detailCache().has(id)) return;

    const loadingIds = new Set(this.loadingDetailIds());
    loadingIds.add(id);
    this.loadingDetailIds.set(loadingIds);

    firstValueFrom(this.rentalsService.getRentalById(id)).then(
      (detail) => {
        const cache = new Map(this.detailCache());
        cache.set(id, detail);
        this.detailCache.set(cache);

        const loading = new Set(this.loadingDetailIds());
        loading.delete(id);
        this.loadingDetailIds.set(loading);
      },
      () => {
        const loading = new Set(this.loadingDetailIds());
        loading.delete(id);
        this.loadingDetailIds.set(loading);
      },
    );
  }

  isExpanded(id: number): boolean {
    return this.expandedIds().has(id);
  }
}
