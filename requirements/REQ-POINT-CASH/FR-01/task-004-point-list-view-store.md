# Task 004: `PointListViewStore` (row composition + closed-points filter)

> **Applied Skill:** `angular-signals` - derived state via `computed()`, writable UI flag via private `signal()` exposed with `asReadonly()`. `angular-data-flow-orchestrator` - Phase 3 "Enrichment Loop": the store joins the registry with the money lookup into a view model (`PointMoneyRow`). Project rule (CLAUDE.md / team feedback): UI state such as filters and derived lists belongs in feature stores, not component signals.

## 1. Objective

Create a feature-scoped store that joins `PointAdminStore.points()` with `PointMoneyOverviewStore.balancesBySlug()` into `PointMoneyRow[]`, applies the closed-points filter (hide `PERMANENTLY_CLOSED` unless "show closed" is on; `INACTIVE` points are always visible) and computes `hiddenClosedCount` (0 whenever the checkbox is on). The `showClosed` flag is NOT persisted.

Design note: `design.md` places this composition "inside `PointsPageComponent`". It is moved into a store to follow the project rule that derived lists and UI flags live in stores; behaviour is identical.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/point-list-view.store.ts`
* **Action:** Create New File

* **File Path:** `projects/shared/src/public-api.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** (contained in the snippet below)

**Code to Add/Replace:**

* **Location:** Whole content of NEW file `projects/shared/src/core/state/point-list-view.store.ts`
* **Snippet:**

```typescript
import { computed, inject, Injectable, signal } from '@angular/core';
import type { Point, PointBalances, PointMoneyRow } from '../models';
import { PointAdminStore } from './point-admin.store';
import { PointMoneyOverviewStore } from './point-money-overview.store';

function toRow(point: Point, balances: PointBalances | null): PointMoneyRow {
  return {
    slug: point.slug,
    name: point.name,
    status: point.status,
    cash: balances?.cash ?? null,
    terminal: balances?.terminal ?? null,
    lastTransfer: balances?.lastCompletedTransfer ?? null,
  };
}

@Injectable()
export class PointListViewStore {
  private readonly registry = inject(PointAdminStore);
  private readonly money = inject(PointMoneyOverviewStore);

  private readonly _showClosed = signal(false);

  readonly showClosed = this._showClosed.asReadonly();

  readonly rows = computed<PointMoneyRow[]>(() => {
    const ready = this.money.balancesReady();
    const bySlug = this.money.balancesBySlug();
    return this.registry
      .points()
      .map((point) => toRow(point, ready ? (bySlug.get(point.slug) ?? null) : null));
  });

  readonly visibleRows = computed<PointMoneyRow[]>(() =>
    this._showClosed()
      ? this.rows()
      : this.rows().filter((row) => row.status !== 'PERMANENTLY_CLOSED'),
  );

  readonly hiddenClosedCount = computed(() => this.rows().length - this.visibleRows().length);

  setShowClosed(showClosed: boolean): void {
    this._showClosed.set(showClosed);
  }
}
```

* **Location:** `projects/shared/src/public-api.ts` — directly below the line `export * from './core/state/point-money-overview.store';` (added in Task 003)
* **Snippet:**

```typescript
export * from './core/state/point-list-view.store';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx ng build admin --configuration development
npx ng lint shared
```
