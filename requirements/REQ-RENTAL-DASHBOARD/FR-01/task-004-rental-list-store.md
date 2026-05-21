# Task 004: Implement RentalListStore

> **Applied Skill:** `angular-data-flow-orchestrator` — Phase 3: Store Implementation.
> `angular-signals` — Signal-based state with `signal()`. The store is feature-scoped
> (`@Injectable()` without `providedIn`) and must be registered in `RentalDashboardComponent`'s
> `providers` array in a later task (FR-02).

## 1. Objective

Create `projects/operator/src/app/dashboard/rental-list.store.ts` — a feature-scoped Angular
service that manages the four loading/data signals for the Active and History tabs and orchestrates
the three-step batch load pattern against `RentalsService`, `CustomersService`, and
`EquipmentsCatalogueService`.

**Depends on:** Task 001 (domain interfaces) and Task 003 (mapper).

## 2. Files to Modify / Create

* **File Path:** `projects/operator/src/app/dashboard/rental-list.store.ts`
* **Action:** Create New File

---

## 3. Code Implementation

### 3.1 — Create `rental-list.store.ts`

**Imports Required:**

```typescript
import { computed, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { api, RentalDashboardMapper } from '@bikerental/shared';
import type { RentalListItem } from '@bikerental/shared';
```

**Code to Add:**

* **Location:** New file — full file content

```typescript
import { computed, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { api, RentalDashboardMapper } from '@bikerental/shared';
import type { RentalListItem } from '@bikerental/shared';

@Injectable()
export class RentalListStore {
  private readonly rentalsService = inject(api.RentalsService);
  private readonly customersService = inject(api.CustomersService);
  private readonly equipmentsCatalogueService = inject(api.EquipmentsCatalogueService);

  private readonly historyParams = signal<{ dateFrom: Date; dateTo: Date; filter: string } | null>(null);

  private readonly activeResource = rxResource({
    loader: () =>
      this.rentalsService
        .getRentals({ page: 0, size: 100 }, 'ACTIVE')
        .pipe(
          switchMap((page) => this.enrichItems(page.items ?? [])),
          catchError(() => of([])),
        ),
  });

  private readonly historyResource = rxResource({
    request: () => this.historyParams(),
    loader: ({ request: params }) => {
      if (!params) return of([]);
      const statusApi = params.filter === 'ALL' ? undefined : params.filter;
      return this.rentalsService
        .getRentals(
          { page: 0, size: 100 },
          statusApi,
          undefined,
          undefined,
          toIsoString(params.dateFrom),
          toIsoString(params.dateTo),
        )
        .pipe(
          switchMap((page) => this.enrichItems(page.items ?? [])),
          catchError(() => of([])),
        );
    },
  });

  readonly activeRentals = computed(() => this.activeResource.value() ?? []);
  readonly historyRentals = computed(() => this.historyResource.value() ?? []);
  readonly isLoadingActive = this.activeResource.isLoading;
  readonly isLoadingHistory = this.historyResource.isLoading;

  loadActive(): void {
    this.activeResource.reload();
  }

  loadHistory(dateFrom: Date, dateTo: Date, filter: string): void {
    this.historyParams.set({ dateFrom, dateTo, filter });
  }

  private enrichItems(items: api.RentalSummaryResponse[]): Observable<RentalListItem[]> {
    if (items.length === 0) {
      return of([]);
    }
    const customerIds = [
      ...new Set(
        items.map((r) => r.customerId).filter((id): id is string => id != null),
      ),
    ];
    const equipmentIds = [...new Set(items.flatMap((r) => r.equipmentIds ?? []))];
    return forkJoin({
      customers:
        customerIds.length > 0
          ? this.customersService.getCustomersBatch(customerIds)
          : of([]),
      equipments:
        equipmentIds.length > 0
          ? this.equipmentsCatalogueService.getBatchEquipments(equipmentIds)
          : of([]),
    }).pipe(
      map(({ customers, equipments }) => {
        const customerMap = new Map(customers.map((c) => [c.id, c]));
        const equipmentNameMap = new Map(equipments.map((e) => [e.id, e.model]));
        return items.map((r) =>
          RentalDashboardMapper.toListItem(
            r,
            customerMap.get(r.customerId ?? '') ?? null,
            equipmentNameMap,
          ),
        );
      }),
    );
  }
}
```

**Key implementation notes:**

- `@Injectable()` with **no** `providedIn` — the store is registered at the component level in
  FR-02 (`providers: [RentalListStore]` on `RentalDashboardComponent`). Each route visit
  creates a fresh instance.
- Services are injected directly via `inject(api.RentalsService)` etc. using the `api` namespace
  re-export from `@bikerental/shared` (`export * as api from './core/api/generated'`).
- `rxResource` from `@angular/core/rxjs-interop` manages loading state and in-flight
  cancellation automatically. No `DestroyRef`, `takeUntilDestroyed`, or `finalize` required.
- `activeResource` has no `request` (loads once on construction); `loadActive()` calls
  `activeResource.reload()` to trigger a fresh fetch.
- `historyResource` is driven by the `historyParams` signal via `request: () => this.historyParams()`.
  Setting `historyParams` to `null` (initial state) returns `of([])` immediately — no API call.
  `loadHistory(dateFrom, dateTo, filter)` simply sets the signal; `rxResource` re-fetches
  automatically. The filter slug `'ALL'` is converted to `undefined` before being forwarded to
  the `status` positional argument of `getRentals`, so the API receives an unconstrained query.
- Public signals `activeRentals` and `historyRentals` are `computed()` wrappers over the resource
  `value()` with a `?? []` fallback for the initial `undefined` state. `isLoadingActive` and
  `isLoadingHistory` are the resource `.isLoading` signals directly — preserving the original
  public API consumed by components.
- `catchError(() => of([]))` lets the HTTP interceptor handle global error reporting while the
  store returns an empty list so signals never retain stale state.
- `enrichItems` deduplicates customer and equipment IDs using `Set` and issues both batch
  requests in **parallel** via `forkJoin`. Short-circuits with `of([])` when the items array
  is empty to avoid unnecessary API calls.
- `getRentals` signature: `getRentals(pageable, status?, customerId?, equipmentUid?, from?, to?)`.
  For history, pass `undefined` for positions 2–4 (`status`, `customerId`, `equipmentUid`)
  before `from` and `to` (positions 5–6).

---

## 4. Validation Steps

skip
