# Task 006: CustomerLayoutStore (Master Store)

> **Applied Skills:** `angular-di` (component-scoped `@Injectable()`, no `providedIn`), `angular-signals` (signal() for all state), `angular-http` (firstValueFrom, forkJoin), `angular-testing` (Vitest store tests).

## 1. Objective

Create `CustomerLayoutStore` as the Master store of the Hierarchical State architecture. It is provided exclusively at `CustomerDetailComponent` level (not root). It owns: customer profile, account balance, loading flags, and the `updateCustomer` / `refreshBalance` methods.

## 2. Files to Modify / Create

### File 1 — Store

* **File Path:** `projects/admin/src/app/customers/customer-detail/customer-layout.store.ts`
* **Action:** Create New File

```typescript
import { Injectable, inject, signal } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { api, Customer, CustomerBalance, CustomerMapper, CustomerWrite } from '@bikerental/shared';

@Injectable()
export class CustomerLayoutStore {
  private readonly customersService = inject(api.CustomersService);
  private readonly financeService = inject(api.FinanceService);

  readonly customerId = signal('');
  readonly customer = signal<Customer | null>(null);
  readonly balance = signal<CustomerBalance | null>(null);
  readonly profileLoading = signal(false);
  readonly balanceLoading = signal(false);
  readonly balanceError = signal(false);

  load(id: string): void {
    this.customerId.set(id);
    this.profileLoading.set(true);
    this.balanceLoading.set(true);
    this.balanceError.set(false);

    firstValueFrom(this.customersService.getById(id)).then(
      (response) => {
        this.customer.set(CustomerMapper.fromResponse(response));
        this.profileLoading.set(false);
      },
      () => {
        this.profileLoading.set(false);
      },
    );

    firstValueFrom(this.financeService.getBalances(id)).then(
      (response) => {
        this.balance.set(CustomerMapper.fromBalanceResponse(response));
        this.balanceLoading.set(false);
      },
      () => {
        this.balanceError.set(true);
        this.balanceLoading.set(false);
      },
    );
  }

  refreshBalance(): void {
    const id = this.customerId();
    if (!id) return;
    this.balanceLoading.set(true);
    this.balanceError.set(false);

    firstValueFrom(this.financeService.getBalances(id)).then(
      (response) => {
        this.balance.set(CustomerMapper.fromBalanceResponse(response));
        this.balanceLoading.set(false);
      },
      () => {
        this.balanceError.set(true);
        this.balanceLoading.set(false);
      },
    );
  }

  updateCustomer(write: CustomerWrite): Observable<void> {
    return this.customersService
      .updateCustomer(this.customerId(), CustomerMapper.toRequest(write))
      .pipe(
        map((response) => {
          this.customer.set(CustomerMapper.fromResponse(response));
        }),
      );
  }
}
```

---

### File 2 — Unit Test

* **File Path:** `projects/admin/src/app/customers/customer-detail/customer-layout.store.spec.ts`
* **Action:** Create New File

```typescript
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from '@bikerental/shared';
import { CustomerLayoutStore } from './customer-layout.store';

const makeCustomersService = () => ({
  getById: vi.fn().mockReturnValue(
    of({ id: '1', phone: '+375', firstName: 'Ivan', lastName: 'Ivanov' }),
  ),
  updateCustomer: vi.fn().mockReturnValue(
    of({ id: '1', phone: '+375', firstName: 'Ivan', lastName: 'Updated' }),
  ),
});

const makeFinanceService = () => ({
  getBalances: vi.fn().mockReturnValue(
    of({ walletBalance: 100, holdBalance: 20, lastUpdatedAt: new Date() }),
  ),
});

describe('CustomerLayoutStore', () => {
  let store: CustomerLayoutStore;
  let customersService: ReturnType<typeof makeCustomersService>;
  let financeService: ReturnType<typeof makeFinanceService>;

  beforeEach(() => {
    customersService = makeCustomersService();
    financeService = makeFinanceService();

    TestBed.configureTestingModule({
      providers: [
        CustomerLayoutStore,
        { provide: api.CustomersService, useValue: customersService },
        { provide: api.FinanceService, useValue: financeService },
      ],
    });

    store = TestBed.inject(CustomerLayoutStore);
  });

  it('should set customer and balance after load()', async () => {
    store.load('1');
    await Promise.resolve();
    expect(store.customer()?.firstName).toBe('Ivan');
    expect(store.balance()?.available.amount).toBe(100);
    expect(store.balance()?.available.currency).toBe('BYN');
  });

  it('should set balanceError on getBalances failure', async () => {
    financeService.getBalances.mockReturnValue(throwError(() => new Error('500')));
    store.load('1');
    await Promise.resolve();
    expect(store.balanceError()).toBe(true);
    expect(store.balance()).toBeNull();
  });

  it('should update customer signal on updateCustomer success', async () => {
    store.load('1');
    await Promise.resolve();

    let completed = false;
    store
      .updateCustomer({ phone: '+375', firstName: 'Ivan', lastName: 'Updated' })
      .subscribe(() => (completed = true));

    expect(completed).toBe(true);
    expect(store.customer()?.lastName).toBe('Updated');
  });

  it('should refresh balance on refreshBalance()', async () => {
    store.load('1');
    await Promise.resolve();
    financeService.getBalances.mockReturnValue(
      of({ walletBalance: 200, holdBalance: 0, lastUpdatedAt: new Date() }),
    );
    store.refreshBalance();
    await Promise.resolve();
    expect(store.balance()?.available.amount).toBe(200);
  });
});
```

## 4. Validation Steps

```bash
npx ng test admin --watch=false --include=projects/admin/src/app/customers/customer-detail/customer-layout.store.spec.ts
```
