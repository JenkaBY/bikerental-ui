# Task 007: CustomerRentalsStore (Feature Store)

> **Applied Skills:** `angular-di` (component-scoped `@Injectable()`), `angular-signals` (signal(), Set/Map in signals), `angular-http` (firstValueFrom), `angular-testing` (Vitest, store tests).

## 1. Objective

Create `CustomerRentalsStore` as a Feature-layer store for the Rentals tab. It holds the rental summary list, expansion state, a detail cache (keyed by rental id), and lazy-loads full rental detail on first expand. State survives tab switches because the store is provided at the shell level.

## 2. Files to Modify / Create

### File 1 — Store

* **File Path:** `projects/admin/src/app/customers/customer-detail/customer-rentals.store.ts`
* **Action:** Create New File

```typescript
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { api, CustomerMapper, CustomerRentalSummary } from '@bikerental/shared';
import type { RentalResponse } from '@bikerental/shared';
import { CustomerLayoutStore } from './customer-layout.store';

@Injectable()
export class CustomerRentalsStore {
  private readonly rentalsService = inject(api.RentalsService);
  private readonly layoutStore = inject(CustomerLayoutStore);

  readonly rentals = signal<CustomerRentalSummary[]>([]);
  readonly expandedIds = signal<Set<number>>(new Set());
  readonly detailCache = signal<Map<number, RentalResponse>>(new Map());
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
        this.rentals.set((page.items ?? []).map((r) => CustomerMapper.fromRentalSummary(r)));
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
```

**Note:** `api.RentalsService.getRentalById(id)` accepts `number` matching `RentalResponse.id: number`.

---

### File 2 — Unit Test

* **File Path:** `projects/admin/src/app/customers/customer-detail/customer-rentals.store.spec.ts`
* **Action:** Create New File

```typescript
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from '@bikerental/shared';
import { CustomerLayoutStore } from './customer-layout.store';
import { CustomerRentalsStore } from './customer-rentals.store';

const makeRentalsService = () => ({
  getRentals: vi.fn().mockReturnValue(of({ items: [], totalItems: 0 })),
  getRentalById: vi.fn().mockReturnValue(
    of({ id: 1, customerId: 'c1', equipmentItems: [], status: 'ACTIVE', startedAt: new Date(), plannedDurationMinutes: 60, estimatedCost: 50 }),
  ),
});

const makeLayoutStore = () => ({ customerId: vi.fn().mockReturnValue('c1') });

describe('CustomerRentalsStore', () => {
  let store: CustomerRentalsStore;
  let rentalsService: ReturnType<typeof makeRentalsService>;

  beforeEach(() => {
    rentalsService = makeRentalsService();
    TestBed.configureTestingModule({
      providers: [
        CustomerRentalsStore,
        { provide: api.RentalsService, useValue: rentalsService },
        { provide: CustomerLayoutStore, useValue: makeLayoutStore() },
      ],
    });
    store = TestBed.inject(CustomerRentalsStore);
  });

  it('should load rentals and set loaded flag', async () => {
    rentalsService.getRentals.mockReturnValue(
      of({ items: [{ id: 1, status: 'ACTIVE', startedAt: new Date(), equipmentIds: [] }], totalItems: 1 }),
    );
    store.load();
    await Promise.resolve();
    expect(store.rentals().length).toBe(1);
    expect(store.listLoading()).toBe(false);
  });

  it('should not re-fetch on second load() call', async () => {
    store.load();
    await Promise.resolve();
    store.load();
    expect(rentalsService.getRentals).toHaveBeenCalledTimes(1);
  });

  it('should fetch detail on first expand', async () => {
    store.toggleExpand(1);
    await Promise.resolve();
    expect(store.detailCache().has(1)).toBe(true);
    expect(store.isExpanded(1)).toBe(true);
  });

  it('should not re-fetch detail on second expand of same id', async () => {
    store.toggleExpand(1);
    await Promise.resolve();
    store.toggleExpand(1); // collapse
    store.toggleExpand(1); // re-expand
    await Promise.resolve();
    expect(rentalsService.getRentalById).toHaveBeenCalledTimes(1);
  });

  it('should set empty array on list load error', async () => {
    rentalsService.getRentals.mockReturnValue(throwError(() => new Error('500')));
    store.load();
    await Promise.resolve();
    expect(store.rentals()).toEqual([]);
  });
});
```

## 4. Validation Steps

```bash
npx ng test admin --watch=false --include=projects/admin/src/app/customers/customer-detail/customer-rentals.store.spec.ts
```
