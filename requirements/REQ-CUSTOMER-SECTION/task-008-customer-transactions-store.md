# Task 008: CustomerTransactionsStore (Feature Store)

> **Applied Skills:** `angular-di` (component-scoped `@Injectable()`), `angular-signals` (signal() for pagination state), `angular-http` (firstValueFrom), `angular-testing` (Vitest, store tests).

## 1. Objective

Create `CustomerTransactionsStore` as a Feature-layer store for the Transactions tab. It owns paginated transaction history and exposes `load()` (idempotent), `loadPage(index)`, and `invalidate()` (called by the Account tab after any successful financial operation to force a re-fetch on next tab visit).

## 2. Files to Modify / Create

### File 1 — Store

* **File Path:** `projects/admin/src/app/customers/customer-detail/customer-transactions.store.ts`
* **Action:** Create New File

```typescript
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { api, CustomerMapper, CustomerTransaction } from '@bikerental/shared';
import { CustomerLayoutStore } from './customer-layout.store';

const PAGE_SIZE = 20;

@Injectable()
export class CustomerTransactionsStore {
  private readonly financeService = inject(api.FinanceService);
  private readonly layoutStore = inject(CustomerLayoutStore);

  readonly transactions = signal<CustomerTransaction[]>([]);
  readonly totalItems = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(PAGE_SIZE);
  readonly loading = signal(false);

  private loaded = false;

  load(): void {
    if (this.loaded) return;
    this.fetchPage(0);
  }

  loadPage(index: number): void {
    this.fetchPage(index);
  }

  invalidate(): void {
    this.loaded = false;
  }

  private fetchPage(index: number): void {
    const customerId = this.layoutStore.customerId();
    if (!customerId) return;

    this.loading.set(true);
    firstValueFrom(
      this.financeService.getTransactionHistory(
        customerId,
        {},
        { page: index, size: PAGE_SIZE },
      ),
    ).then(
      (page) => {
        const items = (page.items ?? []) as Record<string, unknown>[];
        this.transactions.set(items.map((item) => CustomerMapper.fromTransactionItem(item)));
        this.totalItems.set(page.totalItems ?? 0);
        this.pageIndex.set(index);
        this.loading.set(false);
        this.loaded = true;
      },
      () => {
        this.transactions.set([]);
        this.loading.set(false);
      },
    );
  }
}
```

**Note:** `page.items` is typed as `Array<any>` in the generated `Page` model; the cast to `Record<string, unknown>[]` satisfies the `no-any` rule while still allowing the mapper to access properties.

---

### File 2 — Unit Test

* **File Path:** `projects/admin/src/app/customers/customer-detail/customer-transactions.store.spec.ts`
* **Action:** Create New File

```typescript
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from '@bikerental/shared';
import { CustomerLayoutStore } from './customer-layout.store';
import { CustomerTransactionsStore } from './customer-transactions.store';

const makeTx = (amount: number) => ({
  transactionId: 't1',
  recordedAt: new Date(),
  amount,
  description: 'Test',
  sourceType: 'RENTAL',
});

const makeFinanceService = () => ({
  getTransactionHistory: vi.fn().mockReturnValue(
    of({ items: [makeTx(50)], totalItems: 1 }),
  ),
});

const makeLayoutStore = () => ({ customerId: vi.fn().mockReturnValue('c1') });

describe('CustomerTransactionsStore', () => {
  let store: CustomerTransactionsStore;
  let financeService: ReturnType<typeof makeFinanceService>;

  beforeEach(() => {
    financeService = makeFinanceService();
    TestBed.configureTestingModule({
      providers: [
        CustomerTransactionsStore,
        { provide: api.FinanceService, useValue: financeService },
        { provide: CustomerLayoutStore, useValue: makeLayoutStore() },
      ],
    });
    store = TestBed.inject(CustomerTransactionsStore);
  });

  it('should load page 0 on load()', async () => {
    store.load();
    await Promise.resolve();
    expect(store.transactions().length).toBe(1);
    expect(store.transactions()[0].amountColor).toBe('positive');
    expect(store.transactions()[0].amount.currency).toBe('BYN');
  });

  it('should not re-fetch on second load() without invalidate()', async () => {
    store.load();
    await Promise.resolve();
    store.load();
    expect(financeService.getTransactionHistory).toHaveBeenCalledTimes(1);
  });

  it('should re-fetch after invalidate()', async () => {
    store.load();
    await Promise.resolve();
    store.invalidate();
    store.load();
    await Promise.resolve();
    expect(financeService.getTransactionHistory).toHaveBeenCalledTimes(2);
  });

  it('should fetch specific page on loadPage()', async () => {
    store.loadPage(2);
    await Promise.resolve();
    expect(store.pageIndex()).toBe(2);
    expect(financeService.getTransactionHistory).toHaveBeenCalledWith('c1', {}, { page: 2, size: 20 });
  });

  it('should set empty array and stop loading on HTTP error', async () => {
    financeService.getTransactionHistory.mockReturnValue(throwError(() => new Error('500')));
    store.load();
    await Promise.resolve();
    expect(store.transactions()).toEqual([]);
    expect(store.loading()).toBe(false);
  });

  it('should map negative amount to negative amountColor', async () => {
    financeService.getTransactionHistory.mockReturnValue(of({ items: [makeTx(-30)], totalItems: 1 }));
    store.load();
    await Promise.resolve();
    expect(store.transactions()[0].amountColor).toBe('negative');
  });
});
```

## 4. Validation Steps

```bash
npx ng test admin --watch=false --include=projects/admin/src/app/customers/customer-detail/customer-transactions.store.spec.ts
```
