# Task 006: PointListViewStore (rows join, closed-points filter, hidden counter, summary)

> **Applied Skill:** `angular-signals` - derived state with `computed()`. Project memory "UI state in stores" - busy flags, the `showClosed` toggle and derived lists live in a feature store, not in the page component. `angular-data-flow-orchestrator` - the page calls one `load(now)` and binds to read-only signals.

## 1. Objective

Create the page-scoped view store for `/points` that (a) orchestrates the parallel load of the
point registry and the money overview, (b) joins registry points with positions by slug into
`PointMoneyRow[]`, (c) applies the "Show closed points" filter (only `PERMANENTLY_CLOSED` rows are
hidden; `INACTIVE` rows always show), (d) counts hidden points, and (e) builds the summary-card
view model from backend totals.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/point-list-view.store.ts`
* **Action:** Create New File

* **File Path:** `projects/shared/src/public-api.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** (included in the snippet below)

**Code to Add/Replace:**

* **Location:** New file `projects/shared/src/core/state/point-list-view.store.ts` - full content.
* **Snippet:**

```typescript
import { computed, DestroyRef, inject, Injectable, LOCALE_ID, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { PointMoneyRow, PointMoneySummary } from '../models';
import { BusinessPeriod } from '../../shared/utils/business-period.util';
import { PointAdminStore } from './point-admin.store';
import { PointMoneyOverviewStore } from './point-money-overview.store';

@Injectable()
export class PointListViewStore {
  private readonly registry = inject(PointAdminStore);
  private readonly money = inject(PointMoneyOverviewStore);
  private readonly locale = inject(LOCALE_ID);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _showClosed = signal(false);
  private readonly _registryFailed = signal(false);

  readonly showClosed = computed(() => this._showClosed());
  readonly registryFailed = computed(() => this._registryFailed());
  readonly loading = computed(() => this.registry.loading());

  readonly rows = computed<readonly PointMoneyRow[]>(() => {
    const positions = this.money.positionsBySlug();
    return this.registry.points().map((point) => {
      const entry = positions.get(point.slug);
      return {
        slug: point.slug,
        name: point.name,
        status: point.status,
        cash: entry?.amounts.CASH ?? null,
        terminal: entry?.amounts.CARD_TERMINAL ?? null,
      };
    });
  });

  readonly visibleRows = computed<readonly PointMoneyRow[]>(() =>
    this._showClosed()
      ? this.rows()
      : this.rows().filter((row) => row.status !== 'PERMANENTLY_CLOSED'),
  );

  readonly hiddenClosedCount = computed(() => this.rows().length - this.visibleRows().length);

  readonly summary = computed<PointMoneySummary>(() => {
    const results = this.money.monthResults();
    const period = this.money.period();
    return {
      cash: this.money.cashTotal(),
      terminal: this.money.terminalTotal(),
      deposited: results?.total ?? null,
      collected: results?.collected ?? null,
      terminalSettled: results?.terminalSettled ?? null,
      monthName: period ? BusinessPeriod.monthName(period.to, this.locale) : '',
    };
  });

  load(now: Date): void {
    this._registryFailed.set(false);
    this.registry
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => this._registryFailed.set(true) });
    this.money.load(BusinessPeriod.currentMonthToDate(now));
  }

  setShowClosed(showClosed: boolean): void {
    this._showClosed.set(showClosed);
  }
}
```

* **Location:** `projects/shared/src/public-api.ts` - add one line directly below the line `export * from './core/state/point-money-overview.store';` (added in task-005).
* **Snippet:**

```typescript
export * from './core/state/point-list-view.store';
```

Rules encoded here (do not change):
* The status used for filtering is the **registry** status (`Point.status`) - it is the current
  status, so a closure made earlier today is already applied (FR-01 Scenario 9).
* A registry point missing from the positions overview gets `cash: null` / `terminal: null`
  (em-dash), never zero.
* When `showClosed` is `true`, `hiddenClosedCount` is `0`, so the counter disappears (Scenario 5).
* The summary never sums row values; it only reads backend totals and backend period results.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/state/point-list-view.store.ts projects/shared/src/public-api.ts
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
```
