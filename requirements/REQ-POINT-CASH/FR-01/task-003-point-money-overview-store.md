# Task 003: `PointMoneyOverviewStore` (bulk balances + month-to-date summary)

> **Applied Skill:** `angular-signals` - Service State Pattern: `private readonly _state = signal<T>()`, public `computed()` selectors, private `patch()` mutator. `angular-data-flow-orchestrator` - Phase 3 store owns loading/failed flags (UI state lives in stores, not components). `angular-rxjs-streams` / `error-handling` - per-source `catchError` returning `of(...)` so one failure never cancels the other; the global interceptor already toasts HTTP failures, so the store does not toast.

## 1. Objective

Create a feature-scoped store (provided by `PointsPageComponent` in Task 009) that loads the bulk point balances and the month-to-date bank-transfer summary in parallel, keeps separate `balancesFailed` / `summaryFailed` flags, and exposes totals summed over ALL returned points (independent of the closed-points display filter). The current business month comes from `TimeStore.getCurrentDate()` (the business clock).

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/point-money-overview.store.ts`
* **Action:** Create New File

* **File Path:** `projects/shared/src/public-api.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** (contained in the snippet below)

**Code to Add/Replace:**

* **Location:** Whole content of NEW file `projects/shared/src/core/state/point-money-overview.store.ts`
* **Snippet:**

```typescript
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, forkJoin, map, type Observable, of, tap } from 'rxjs';
import { PointMoneyApi } from '../api/point-money.api';
import { makeMoney } from '../mappers/money.mapper';
import type {
  BankTransferMonthSummary,
  BusinessMonthRange,
  Money,
  PointBalances,
} from '../models';
import { TimeStore } from './time.store';

interface PointMoneyOverviewState {
  monthRange: BusinessMonthRange;
  balances: PointBalances[];
  summary: BankTransferMonthSummary | null;
  balancesLoading: boolean;
  summaryLoading: boolean;
  balancesFailed: boolean;
  summaryFailed: boolean;
}

function currentMonthRange(today: Date): BusinessMonthRange {
  return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: today };
}

function sumOf(amounts: number[]): number {
  return amounts.reduce((total, amount) => total + amount, 0);
}

@Injectable()
export class PointMoneyOverviewStore {
  private readonly api = inject(PointMoneyApi);
  private readonly time = inject(TimeStore);

  private readonly _state = signal<PointMoneyOverviewState>({
    monthRange: currentMonthRange(this.time.getCurrentDate()),
    balances: [],
    summary: null,
    balancesLoading: false,
    summaryLoading: false,
    balancesFailed: false,
    summaryFailed: false,
  });

  readonly monthRange = computed(() => this._state().monthRange);
  readonly monthSummary = computed(() => this._state().summary);
  readonly balancesFailed = computed(() => this._state().balancesFailed);
  readonly summaryFailed = computed(() => this._state().summaryFailed);
  readonly loading = computed(() => this._state().balancesLoading || this._state().summaryLoading);
  readonly balancesReady = computed(
    () => !this._state().balancesLoading && !this._state().balancesFailed,
  );
  readonly balancesBySlug = computed(
    () => new Map(this._state().balances.map((b) => [b.pointSlug, b])),
  );
  readonly cashTotal = computed<Money | null>(() =>
    this.balancesReady()
      ? makeMoney(sumOf(this._state().balances.map((b) => b.cash.amount)))
      : null,
  );
  readonly terminalTotal = computed<Money | null>(() =>
    this.balancesReady()
      ? makeMoney(sumOf(this._state().balances.map((b) => b.terminal.amount)))
      : null,
  );

  load(): Observable<void> {
    const monthRange = currentMonthRange(this.time.getCurrentDate());
    this.patch({
      monthRange,
      summary: null,
      balancesLoading: true,
      summaryLoading: true,
      balancesFailed: false,
      summaryFailed: false,
    });
    const balances$ = this.api.getBalances().pipe(
      tap((balances) => this.patch({ balances })),
      map((): void => undefined),
      catchError(() => {
        this.patch({ balances: [], balancesFailed: true });
        return of(undefined);
      }),
      finalize(() => this.patch({ balancesLoading: false })),
    );
    const summary$ = this.api.getMonthSummary(monthRange.from, monthRange.to).pipe(
      tap((summary) => this.patch({ summary })),
      map((): void => undefined),
      catchError(() => {
        this.patch({ summary: null, summaryFailed: true });
        return of(undefined);
      }),
      finalize(() => this.patch({ summaryLoading: false })),
    );
    return forkJoin([balances$, summary$]).pipe(map((): void => undefined));
  }

  private patch(patch: Partial<PointMoneyOverviewState>): void {
    this._state.update((state) => ({ ...state, ...patch }));
  }
}
```

* **Location:** `projects/shared/src/public-api.ts` — directly below the existing line `export * from './core/state/point-admin.store';`
* **Snippet:**

```typescript
export * from './core/state/point-money-overview.store';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx ng build admin --configuration development
npx ng lint shared
```
