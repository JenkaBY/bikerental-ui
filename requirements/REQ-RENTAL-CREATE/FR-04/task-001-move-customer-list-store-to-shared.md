# Task 001: Move `CustomerListStore` to Shared Library

> **Applied Skill:** `angular-signals`, `angular-testing` — Pure `@Injectable()` store migrated from `projects/admin/` into `projects/shared/src/core/state/`. Imports are updated to shared-library conventions (relative paths / `@ui-models` alias). The mapper call is updated from `fromResponse` to `fromSearchResponse` (added in **task-002**). Admin consumers update their import to `@bikerental/shared`; the old store and spec files are deleted.

> **⚠️ Dependency:** Complete **task-002** (`CustomerMapper.fromSearchResponse`) before this task.

## 1. Objective

Move `CustomerListStore` from `projects/admin/src/app/customers/` to `projects/shared/src/core/state/` so both the admin and operator modules can consume it via `@bikerental/shared`.

Steps:

1. Create `projects/shared/src/core/state/customer-list.store.ts` (adapted imports, updated mapper call)
2. Create `projects/shared/src/core/state/customer-list.store.spec.ts` (adapted imports)
3. Export the store from `projects/shared/src/public-api.ts`
4. Update the import in `projects/admin/src/app/customers/customer-list.component.ts`
5. Update the import in `projects/admin/src/app/customers/customer-list.component.spec.ts`
6. Delete `projects/admin/src/app/customers/customer-list.store.ts`
7. Delete `projects/admin/src/app/customers/customer-list.store.spec.ts`

---

## 2. Files to Modify / Create

### 2a. Create New File: `projects/shared/src/core/state/customer-list.store.ts`

**Action:** Create new file. This is the migrated store with shared-library import conventions.

```typescript
import { computed, inject, Injectable, signal } from '@angular/core';
import { debounce, distinctUntilChanged, filter, map, timer } from 'rxjs';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { CustomersService } from '../api/generated';
import { CustomerMapper } from '../mappers';
import type { Customer } from '@ui-models';

interface SearchRequest {
  phone: string | null;
}

@Injectable()
export class CustomerListStore {
  private readonly customersService = inject(CustomersService);
  private readonly _query = signal<string | null>(null);
  private readonly _debouncedQuery = toSignal(
    toObservable(this._query).pipe(
      debounce((query) => (query === null ? timer(0) : timer(300))),
      distinctUntilChanged(),
      filter((q) => q === null || q.length >= 4),
    ),
    { initialValue: null },
  );

  readonly resource = rxResource<Customer[], SearchRequest>({
    params: () => ({ phone: this._debouncedQuery() }),
    stream: (request) => {
      return this.customersService
        .searchByPhone(request.params.phone)
        .pipe(map((res) => res.map(CustomerMapper.fromSearchResponse)));
    },
  });

  readonly customers = computed(() => this.resource.value() ?? []);
  readonly loading = this.resource.isLoading;
  readonly searchQuery = this._query.asReadonly();

  search(phone: string | null) {
    const value = phone?.trim() === '' ? null : phone;
    this._query.set(value);
  }
}
```

> **Key diff from admin version:** `CustomerMapper.fromResponse` → `CustomerMapper.fromSearchResponse`. All `@bikerental/shared` imports replaced with relative paths / `@ui-models` path alias consistent with other stores in this directory (see `customer.store.ts` as reference).

---

### 2b. Create New File: `projects/shared/src/core/state/customer-list.store.spec.ts`

**Action:** Create new file. Adapted from the admin spec; `api.CustomersService` replaced with a relative import; `MatSnackBar` provider removed (the store does not use it).

```typescript
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { CustomerListStore } from './customer-list.store';
import { CustomersService } from '../api/generated';

describe('CustomerListStore', () => {
  let store: CustomerListStore;

  const mockCustomerSearchResponse = {
    id: '1',
    phone: '+375291234567',
    firstName: 'Ivan',
    lastName: 'Ivanov',
  };

  const customersService = {
    searchByPhone: vi.fn(),
  };

  beforeEach(() => {
    customersService.searchByPhone.mockReset();
    customersService.searchByPhone.mockReturnValue(of([mockCustomerSearchResponse]));

    TestBed.configureTestingModule({
      providers: [
        CustomerListStore,
        { provide: CustomersService, useValue: customersService },
      ],
    });

    store = TestBed.inject(CustomerListStore);
  });

  it('should initialize and expose customers and loading signals', async () => {
    await new Promise((r) => setTimeout(r, 20));
    expect(Array.isArray(store.customers())).toBe(true);
    expect(typeof store.loading()).toBe('boolean');
  });

  it('does not call service for short queries (< 4 chars)', async () => {
    customersService.searchByPhone.mockClear();
    store.search('123');
    await new Promise((r) => setTimeout(r, 50));
    const calls = customersService.searchByPhone.mock.calls as unknown[][];
    const onlyShortOrNull = calls.every((c: unknown[]) => {
      const arg = c[0];
      return arg === null || (typeof arg === 'string' && arg.length < 4);
    });
    expect(onlyShortOrNull).toBe(true);
  });

  it('calls service for empty search (normalized to null) and populates customers', async () => {
    store.search('');
    await new Promise((r) => setTimeout(r, 50));
    expect(customersService.searchByPhone).toHaveBeenCalledWith(null);
    expect(store.customers().length).toBe(1);
    expect(store.customers()[0].phone).toBe('+375291234567');
  });
});
```

---

### 2c. Modify `projects/shared/src/public-api.ts`

**Action:** Add one export line.

**Location:** Add after the line `export * from './core/state/customer.store';`

```typescript
export * from './core/state/customer-list.store';
```

---

### 2d. Modify `projects/admin/src/app/customers/customer-list.component.ts`

**Action:** Update the import of `CustomerListStore`.

**Find (line 13):**

```typescript
import { CustomerListStore } from './customer-list.store';
```

**Replace with:**

```typescript
import { CustomerListStore } from '@bikerental/shared';
```

---

### 2e. Modify `projects/admin/src/app/customers/customer-list.component.spec.ts`

**Action:** Update the import of `CustomerListStore`.

**Find (line 9):**

```typescript
import { CustomerListStore } from './customer-list.store';
```

**Replace with:**

```typescript
import { CustomerListStore } from '@bikerental/shared';
```

---

### 2f. Delete Old Files

Run the following commands in the terminal:

```bash
rm projects/admin/src/app/customers/customer-list.store.ts
rm projects/admin/src/app/customers/customer-list.store.spec.ts
```

---

## 3. Validation Steps

skip validation
