# Task 009: PointMovementsStore (paged, period-bounded, single-position movement query)

> **Applied Skill:** `angular-signals` - private config/state signals, derived `rows`. CLAUDE.md - "reset `pageIndex` to 0 in the store whenever filters/IDs change"; derived lists (rows with resolved names) live in the store. `angular-rxjs-streams` - latest load wins. Backend contract item 3 - always paged, size <= 100, sort only by `recordedAt`, period required and <= 366 days (A8: one position per request).

## 1. Objective

Create the feature store, one instance per consumer (Operations tab here; FR-03 shift list and
FR-04 history later), that never sends an invalid period, resets to page 0 on position / period /
order change, keeps settings on `reload()`, resolves `recordedBy` names via `StaffNameResolver`,
and supports an optional client-side `notBefore` instant (used by FR-03).

Requires `StaffNameResolver` to be provided by an ancestor (the admin point-detail host).

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/point-movements.store.ts` - **Action:** Create New File
* **File Path:** `projects/shared/src/public-api.ts` - **Action:** Modify Existing File

## 3. Code Implementation

* **Location:** New file `projects/shared/src/core/state/point-movements.store.ts` - full content.
* **Snippet:**

```typescript
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subscription } from 'rxjs';
import { PointFinanceService } from '../api/point-finance';
import { POINT_MOVEMENTS_MAX_PAGE_SIZE } from '../models';
import type {
  PointMovement,
  PointMovementOrder,
  PointMovementPosition,
  PointMovementRow,
  PointPeriod,
} from '../models';
import { PointPeriodRule } from '../../shared/utils/point-period.rule';
import { StaffNameResolver } from './staff-name.resolver';

export interface PointMovementsConfig {
  readonly pointSlug: string;
  readonly position: PointMovementPosition;
  readonly period: PointPeriod;
  readonly order: PointMovementOrder;
  readonly pageSize: number;
  readonly notBefore?: Date | null;
}

@Injectable()
export class PointMovementsStore {
  private readonly finance = inject(PointFinanceService);
  private readonly names = inject(StaffNameResolver);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _config = signal<PointMovementsConfig | null>(null);
  private readonly _pageIndex = signal(0);
  private readonly _items = signal<readonly PointMovement[]>([]);
  private readonly _total = signal(0);
  private readonly _loading = signal(false);
  private readonly _failed = signal(false);

  private subscription: Subscription | null = null;

  readonly position = computed<PointMovementPosition>(() => this._config()?.position ?? 'CASH');
  readonly period = computed(() => this._config()?.period ?? null);
  readonly order = computed<PointMovementOrder>(() => this._config()?.order ?? 'newest');
  readonly pageIndex = computed(() => this._pageIndex());
  readonly pageSize = computed(() => this._config()?.pageSize ?? POINT_MOVEMENTS_MAX_PAGE_SIZE);
  readonly total = computed(() => this._total());
  readonly loading = computed(() => this._loading());
  readonly failed = computed(() => this._failed());
  readonly rows = computed<readonly PointMovementRow[]>(() => {
    const notBefore = this._config()?.notBefore ?? null;
    return this._items()
      .filter((movement) => !notBefore || movement.recordedAt.getTime() >= notBefore.getTime())
      .map((movement) => ({
        ...movement,
        recordedByName: this.names.nameFor(movement.recordedById),
      }));
  });

  configure(config: PointMovementsConfig): void {
    this._config.set({
      ...config,
      pageSize: Math.min(config.pageSize, POINT_MOVEMENTS_MAX_PAGE_SIZE),
    });
    this.names.ensureLoaded();
    this.fetch(0);
  }

  setPosition(position: PointMovementPosition): void {
    this.patch({ position });
  }

  setPeriod(period: PointPeriod): void {
    this.patch({ period });
  }

  setOrder(order: PointMovementOrder): void {
    this.patch({ order });
  }

  loadPage(pageIndex: number): void {
    this.fetch(pageIndex);
  }

  reload(): void {
    this.fetch(this._pageIndex());
  }

  private patch(change: Partial<PointMovementsConfig>): void {
    const config = this._config();
    if (!config) return;
    this._config.set({ ...config, ...change });
    this.fetch(0);
  }

  private fetch(pageIndex: number): void {
    const config = this._config();
    if (!config || PointPeriodRule.validate(config.period.from, config.period.to) !== null) return;
    this.subscription?.unsubscribe();
    this._pageIndex.set(pageIndex);
    this._loading.set(true);
    this._failed.set(false);
    this.subscription = this.finance
      .getMovements({
        pointSlug: config.pointSlug,
        position: config.position,
        period: config.period,
        order: config.order,
        page: pageIndex,
        size: config.pageSize,
      })
      .pipe(
        finalize(() => this._loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (page) => {
          this._items.set(page.items);
          this._total.set(page.totalItems);
        },
        error: () => {
          this._items.set([]);
          this._total.set(0);
          this._failed.set(true);
        },
      });
  }
}
```

* **Location:** `projects/shared/src/public-api.ts` - add one line directly below `export * from './core/state/staff-name.resolver';`
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
