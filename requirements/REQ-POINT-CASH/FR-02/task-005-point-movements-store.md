# Task 005: `PointMovementsStore` (paged / unpaged movements feed, one instance per consumer)

> **Applied Skill:** `angular-signals` - Service State Pattern with a private `_state` signal and public `computed()` selectors. `angular-rxjs-streams` - private `Subject` + `switchMap` (latest wins; a newer page/range request cancels the in-flight one) closed with `takeUntilDestroyed()`. `angular-data-flow-orchestrator` - Phase 3: filters, page index, loading and failed flags live in the store (project rule: UI state in stores). CLAUDE.md *Lifecycle & navigation* - `pageIndex` resets to 0 whenever the filter changes.

## 1. Objective

Create the tab-scoped movements store. Each consumer provides its OWN instance in its component `providers`:

* FR-02 Operations tab (Task 011): `accounts = [CASH, CARD_TERMINAL]`, paged (page size 20), optional date range.
* FR-03 Cash tab / FR-06 operator Cash screen: `accounts = [CASH]` or both, one business day, `paged = false` (one page capped at 500 rows).

API:

* `configure(config)` — sets point/accounts/paging/range, resets to page 0 and loads it.
* `setRange(from, to)` — sets the inclusive date range (either may be `null`), resets to page 0 and loads.
* `loadPage(index)` — loads the given page with the current filters.
* `reload()` — reloads the current page with the current filters (used on `PointMoneyRefreshFacade.revision` changes).

Nothing is fetched before `configure()` has been called.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/point-movements.store.ts`
* **Action:** Create New File

* **File Path:** `projects/shared/src/public-api.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** (contained in the snippet below)

**Code to Add/Replace:**

* **Location:** Whole content of NEW file `projects/shared/src/core/state/point-movements.store.ts`
* **Snippet:**

```typescript
import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, Subject, switchMap, tap } from 'rxjs';
import { PointMoneyApi } from '../api/point-money.api';
import type { PointAccountType, PointMovement, PointMovementQuery } from '../models';

const PAGED_SIZE = 20;
const UNPAGED_SIZE = 500;

export interface PointMovementsConfig {
  pointSlug: string | null;
  accounts: PointAccountType[];
  paged: boolean;
  fromDate?: Date | null;
  toDate?: Date | null;
}

interface PointMovementsState {
  configured: boolean;
  pointSlug: string | null;
  accounts: PointAccountType[];
  fromDate: Date | null;
  toDate: Date | null;
  pageIndex: number;
  pageSize: number;
  paged: boolean;
  items: PointMovement[];
  total: number;
  loading: boolean;
  failed: boolean;
}

@Injectable()
export class PointMovementsStore {
  private readonly api = inject(PointMoneyApi);
  private readonly requests = new Subject<PointMovementQuery>();

  private readonly _state = signal<PointMovementsState>({
    configured: false,
    pointSlug: null,
    accounts: [],
    fromDate: null,
    toDate: null,
    pageIndex: 0,
    pageSize: PAGED_SIZE,
    paged: true,
    items: [],
    total: 0,
    loading: false,
    failed: false,
  });

  readonly accounts = computed(() => this._state().accounts);
  readonly fromDate = computed(() => this._state().fromDate);
  readonly toDate = computed(() => this._state().toDate);
  readonly pageIndex = computed(() => this._state().pageIndex);
  readonly pageSize = computed(() => this._state().pageSize);
  readonly paged = computed(() => this._state().paged);
  readonly items = computed(() => this._state().items);
  readonly total = computed(() => this._state().total);
  readonly loading = computed(() => this._state().loading);
  readonly failed = computed(() => this._state().failed);

  constructor() {
    this.requests
      .pipe(
        switchMap((query) => {
          this.patch({ loading: true, failed: false });
          return this.api.getMovements(query).pipe(
            tap((page) =>
              this.patch({ items: page.items, total: page.total, pageIndex: query.page }),
            ),
            catchError(() => {
              this.patch({ items: [], total: 0, failed: true });
              return EMPTY;
            }),
            finalize(() => this.patch({ loading: false })),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  configure(config: PointMovementsConfig): void {
    this.patch({
      configured: true,
      pointSlug: config.pointSlug,
      accounts: config.accounts,
      paged: config.paged,
      pageSize: config.paged ? PAGED_SIZE : UNPAGED_SIZE,
      fromDate: config.fromDate ?? null,
      toDate: config.toDate ?? null,
      pageIndex: 0,
      items: [],
      total: 0,
    });
    this.fetch(0);
  }

  setRange(fromDate: Date | null, toDate: Date | null): void {
    this.patch({ fromDate, toDate, pageIndex: 0 });
    this.fetch(0);
  }

  loadPage(pageIndex: number): void {
    this.fetch(pageIndex);
  }

  reload(): void {
    this.fetch(this._state().pageIndex);
  }

  private fetch(page: number): void {
    const state = this._state();
    if (!state.configured) return;
    this.requests.next({
      pointSlug: state.pointSlug,
      accounts: state.accounts,
      fromDate: state.fromDate,
      toDate: state.toDate,
      page,
      size: state.pageSize,
    });
  }

  private patch(patch: Partial<PointMovementsState>): void {
    this._state.update((state) => ({ ...state, ...patch }));
  }
}
```

* **Location:** `projects/shared/src/public-api.ts` — directly below the line `export * from './core/state/point-cash.store';` (added in Task 004)
* **Snippet:**

```typescript
export * from './core/state/point-movements.store';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/state/point-movements.store.ts projects/shared/src/public-api.ts
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
```
