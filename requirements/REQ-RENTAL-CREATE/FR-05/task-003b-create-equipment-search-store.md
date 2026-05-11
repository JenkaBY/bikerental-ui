# Task 003b: Create `EquipmentSearchStore`

> **Applied Skill:** `angular-signals` — Component-scoped `@Injectable()` store. Owns the debounced equipment search pipeline (`rxResource` + `toSignal`). Injects `EquipmentService` (generated) and `EquipmentTypeStore` (providedIn: 'root'). Maps `EquipmentResponse[]` to `EquipmentSearchItem[]` using `EquipmentSearchItemMapper`. Components must not inject `EquipmentService` directly for search.

> **⚠️ Dependencies:** Requires **task-002** (`EquipmentSearchItem` model) and **task-003** (`EquipmentSearchItemMapper`) to be completed first.

## 1. Objective

Create a component-scoped store that encapsulates the debounced equipment search pipeline — debounce 300 ms, minimum 2 characters, `switchMap` cancellation via `rxResource`, type resolution from `EquipmentTypeStore`. Components call `store.search(value)` and read `store.results()`.

## 2. Files to Modify / Create

### 2a. Create New File: `projects/shared/src/core/state/equipment-search.store.ts`

```typescript
import { computed, inject, Injectable, signal } from '@angular/core';
import { debounce, distinctUntilChanged, filter, map, of, timer } from 'rxjs';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { EquipmentService } from '../api/generated';
import { EquipmentTypeStore } from './equipment-type.store';
import { EquipmentSearchItemMapper } from '../mappers';
import type { EquipmentSearchItem } from '@ui-models';

const MIN_QUERY_LENGTH = 2;

interface SearchRequest {
  query: string | null;
}

@Injectable()
export class EquipmentSearchStore {
  private readonly equipmentService = inject(EquipmentService);
  private readonly equipmentTypeStore = inject(EquipmentTypeStore);

  private readonly _query = signal<string | null>(null);
  private readonly _debouncedQuery = toSignal(
    toObservable(this._query).pipe(
      debounce((query) => (query === null ? timer(0) : timer(300))),
      distinctUntilChanged(),
      filter((q) => q === null || q.length >= MIN_QUERY_LENGTH),
    ),
    { initialValue: null },
  );

  readonly resource = rxResource<EquipmentSearchItem[], SearchRequest>({
    params: () => ({ query: this._debouncedQuery() }),
    stream: ({ params: { query } }) => {
      if (!query) return of([]);
      return this.equipmentService.searchEquipments({ size: 20 }, 'available', undefined, query).pipe(
        map((page) => {
          const types = this.equipmentTypeStore.typesForEquipment();
          return (page.items ?? []).map((r) => EquipmentSearchItemMapper.fromResponse(r, types));
        }),
      );
    },
  });

  readonly results = computed(() => this.resource.value() ?? []);
  readonly loading = this.resource.isLoading;
  readonly searchQuery = this._query.asReadonly();

  search(query: string | null): void {
    const value = query?.trim() === '' ? null : query;
    this._query.set(value);
  }
}
```

---

### 2b. Create New File: `projects/shared/src/core/state/equipment-search.store.spec.ts`

```typescript
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { EquipmentSearchStore } from './equipment-search.store';
import { EquipmentService } from '../api/generated';
import { EquipmentTypeStore } from './equipment-type.store';

const mockEquipmentResponse = {
  id: 1,
  uid: 'ABC12',
  model: 'Trek FX3',
  type: 'bicycle',
  status: 'available',
  serialNumber: 'S1',
};

describe('EquipmentSearchStore', () => {
  let store: EquipmentSearchStore;

  const equipmentService = {
    searchEquipments: vi.fn(),
  };

  const equipmentTypeStore = {
    equipmentTypes: () => [{ slug: 'bicycle', name: 'Bicycle', isForSpecialTariff: false }],
  };

  beforeEach(() => {
    equipmentService.searchEquipments.mockReset();
    equipmentService.searchEquipments.mockReturnValue(
      of({ items: [mockEquipmentResponse], totalItems: 1 }),
    );

    TestBed.configureTestingModule({
      providers: [
        EquipmentSearchStore,
        { provide: EquipmentService, useValue: equipmentService },
        { provide: EquipmentTypeStore, useValue: equipmentTypeStore },
      ],
    });

    store = TestBed.inject(EquipmentSearchStore);
  });

  it('should initialize with empty results', async () => {
    await new Promise((r) => setTimeout(r, 20));
    expect(store.results()).toEqual([]);
  });

  it('should not call the service for a null query', async () => {
    store.search(null);
    await new Promise((r) => setTimeout(r, 50));
    expect(equipmentService.searchEquipments).not.toHaveBeenCalled();
  });

  it('should not call the service for a query shorter than 2 chars', async () => {
    store.search('A');
    await new Promise((r) => setTimeout(r, 400));
    expect(equipmentService.searchEquipments).not.toHaveBeenCalled();
  });

  it('should call the service and populate results for a 2+ char query', async () => {
    store.search('AB');
    await new Promise((r) => setTimeout(r, 400));
    expect(equipmentService.searchEquipments).toHaveBeenCalled();
    expect(store.results().length).toBe(1);
    expect(store.results()[0].uid).toBe('ABC12');
  });

  it('should normalize empty string to null and return empty results', async () => {
    store.search('');
    await new Promise((r) => setTimeout(r, 50));
    expect(store.results()).toEqual([]);
  });
});
```

---

### 2c. Modify `projects/shared/src/public-api.ts`

**Location:** Add after the line `export * from './core/state/customer.store';`

```typescript
export * from './core/state/equipment-search.store';
```

## 4. Validation Steps

```bash
npx ng build shared --configuration=development
npx ng test shared --include="**/core/state/equipment-search.store.spec**"
```
