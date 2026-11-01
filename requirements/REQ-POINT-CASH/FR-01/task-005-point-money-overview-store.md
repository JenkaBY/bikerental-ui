# Task 005: PointMoneyOverviewStore (positions overview + month results, independent failures)

> **Applied Skill:** `angular-signals` - private writable signals, public `computed()` read-only views. CLAUDE.md "Signal Store pattern" - feature store, `@Injectable()` without `providedIn`, provided on the page component. `angular-rxjs-streams` - `takeUntilDestroyed(destroyRef)` for subscriptions owned by the store; latest request wins. `error-handling` - the global interceptor toasts HTTP failures; the store only records the failure flag.

## 1. Objective

Create the page-scoped store that loads, in parallel and with separate failure flags, the
business-wide positions overview and the period results of the current business month. Totals are
taken from the backend (never summed in the UI), so hidden permanently closed points and
corrections by adjustment are included automatically (FR-01 Scenarios 3 and 6).

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/point-money-overview.store.ts`
* **Action:** Create New File

* **File Path:** `projects/shared/src/public-api.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** (included in the snippet below)

**Code to Add/Replace:**

* **Location:** New file `projects/shared/src/core/state/point-money-overview.store.ts` - full content.
* **Snippet:**

```typescript
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subscription } from 'rxjs';
import { PointFinanceService } from '../api/point-finance';
import type {
  Money,
  PointPeriod,
  PointPeriodResults,
  PointPositionKind,
  PointPositions,
  PointPositionsOverview,
} from '../models';

@Injectable()
export class PointMoneyOverviewStore {
  private readonly finance = inject(PointFinanceService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _overview = signal<PointPositionsOverview | null>(null);
  private readonly _results = signal<PointPeriodResults | null>(null);
  private readonly _period = signal<PointPeriod | null>(null);
  private readonly _positionsLoading = signal(false);
  private readonly _resultsLoading = signal(false);
  private readonly _positionsFailed = signal(false);
  private readonly _resultsFailed = signal(false);

  private positionsSubscription: Subscription | null = null;
  private resultsSubscription: Subscription | null = null;

  readonly period = computed(() => this._period());
  readonly monthResults = computed(() => this._results());
  readonly positionsLoading = computed(() => this._positionsLoading());
  readonly resultsLoading = computed(() => this._resultsLoading());
  readonly positionsFailed = computed(() => this._positionsFailed());
  readonly resultsFailed = computed(() => this._resultsFailed());
  readonly positionsBySlug = computed(
    () =>
      new Map<string, PointPositions>(
        (this._overview()?.points ?? []).map((positions) => [positions.pointSlug, positions]),
      ),
  );
  readonly cashTotal = computed(() => this.totalOf('CASH'));
  readonly terminalTotal = computed(() => this.totalOf('CARD_TERMINAL'));

  load(period: PointPeriod): void {
    this._period.set(period);
    this.loadPositions();
    this.loadResults(period);
  }

  private loadPositions(): void {
    this.positionsSubscription?.unsubscribe();
    this._positionsLoading.set(true);
    this._positionsFailed.set(false);
    this.positionsSubscription = this.finance
      .getPositions()
      .pipe(
        finalize(() => this._positionsLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (overview) => this._overview.set(overview),
        error: () => {
          this._overview.set(null);
          this._positionsFailed.set(true);
        },
      });
  }

  private loadResults(period: PointPeriod): void {
    this.resultsSubscription?.unsubscribe();
    this._resultsLoading.set(true);
    this._resultsFailed.set(false);
    this.resultsSubscription = this.finance
      .getResults(period)
      .pipe(
        finalize(() => this._resultsLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (results) => this._results.set(results),
        error: () => {
          this._results.set(null);
          this._resultsFailed.set(true);
        },
      });
  }

  private totalOf(kind: PointPositionKind): Money | null {
    return this._overview()?.totals[kind] ?? null;
  }
}
```

* **Location:** `projects/shared/src/public-api.ts` - add one line directly below the existing line `export * from './core/state/point-admin.store';`
* **Snippet:**

```typescript
export * from './core/state/point-money-overview.store';
```

Behaviour encoded here (do not change):
* `getResults(period)` is called without a point slug (business-wide).
* A positions failure never touches `_results`, and a results failure never touches `_overview`
  (FR-01 NFR "applies independently").
* No `NotificationService` call here: real HTTP failures are toasted by the global
  `errorInterceptor`; the placeholder reader (task-004) fails silently by design.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/state/point-money-overview.store.ts projects/shared/src/public-api.ts
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
```
