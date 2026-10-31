# Task 004: `PointCashStore` (point account snapshot, feature-scoped)

> **Applied Skill:** `angular-signals` - Service State Pattern: one private `_state = signal<T>()`, public `computed()` selectors, private `patch()` mutator. `angular-rxjs-streams` - a private `Subject` + `switchMap` so concurrent refreshes are coalesced (latest wins, the in-flight request is cancelled) and `takeUntilDestroyed()` ends the stream when the providing component is destroyed. `angular-data-flow-orchestrator` - Phase 3: loading/failed flags live in the store, not in components. `error-handling` - the store never toasts; HTTP failures are toasted by the global interceptor and the store only flips `failed`.

## 1. Objective

Create the host-scoped store that holds one point's `PointCashSnapshot`. It is provided by `PointDetailPageComponent` (Task 012) in admin, and later by `OperatorCashComponent` (FR-06) with `slug = null`.

* `load(slug | null, businessDate)` — remembers the request, clears the old snapshot and fetches.
* `refresh()` — re-fetches the last request (no-op before the first `load`). Called by `PointMoneyRefreshFacade` (Task 006) and by FR-05 on insufficient balance.
* Derived: `cashBalance`, `terminalBalance`, `pointStatus` (all `null` while loading or after a failure, which renders as an em-dash).

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/point-cash.store.ts`
* **Action:** Create New File

* **File Path:** `projects/shared/src/public-api.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** (contained in the snippet below)

**Code to Add/Replace:**

* **Location:** Whole content of NEW file `projects/shared/src/core/state/point-cash.store.ts`
* **Snippet:**

```typescript
import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, Subject, switchMap, tap } from 'rxjs';
import { PointMoneyApi } from '../api/point-money.api';
import type { Money, PointCashSnapshot, PointStatus } from '../models';

interface PointCashRequest {
  slug: string | null;
  businessDate: Date;
}

interface PointCashState {
  request: PointCashRequest | null;
  snapshot: PointCashSnapshot | null;
  loading: boolean;
  failed: boolean;
}

@Injectable()
export class PointCashStore {
  private readonly api = inject(PointMoneyApi);
  private readonly requests = new Subject<PointCashRequest>();

  private readonly _state = signal<PointCashState>({
    request: null,
    snapshot: null,
    loading: false,
    failed: false,
  });

  readonly slug = computed(() => this._state().request?.slug ?? null);
  readonly businessDate = computed(() => this._state().request?.businessDate ?? null);
  readonly snapshot = computed(() => this._state().snapshot);
  readonly loading = computed(() => this._state().loading);
  readonly failed = computed(() => this._state().failed);
  readonly cashBalance = computed<Money | null>(
    () => this._state().snapshot?.cash.balance ?? null,
  );
  readonly terminalBalance = computed<Money | null>(
    () => this._state().snapshot?.terminal.balance ?? null,
  );
  readonly pointStatus = computed<PointStatus | null>(
    () => this._state().snapshot?.pointStatus ?? null,
  );

  constructor() {
    this.requests
      .pipe(
        switchMap((request) => {
          this.patch({ loading: true, failed: false });
          return this.api.getSnapshot(request.slug, request.businessDate).pipe(
            tap((snapshot) => this.patch({ snapshot })),
            catchError(() => {
              this.patch({ snapshot: null, failed: true });
              return EMPTY;
            }),
            finalize(() => this.patch({ loading: false })),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  load(slug: string | null, businessDate: Date): void {
    const request: PointCashRequest = { slug, businessDate };
    this.patch({ request, snapshot: null });
    this.requests.next(request);
  }

  refresh(): void {
    const request = this._state().request;
    if (request) this.requests.next(request);
  }

  private patch(patch: Partial<PointCashState>): void {
    this._state.update((state) => ({ ...state, ...patch }));
  }
}
```

* **Location:** `projects/shared/src/public-api.ts` — directly below the line `export * from './core/state/point-list-view.store';` (added by FR-01 Task 004)
* **Snippet:**

```typescript
export * from './core/state/point-cash.store';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/state/point-cash.store.ts projects/shared/src/public-api.ts
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
```
