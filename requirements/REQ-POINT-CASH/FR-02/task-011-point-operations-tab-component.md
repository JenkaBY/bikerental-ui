# Task 011: `PointOperationsTabComponent` (Operations tab) + export the shared date-range filter

> **Applied Skill:** `angular-component` - standalone, `OnPush`, `inject()`, tab-scoped `providers: [PointMovementsStore]` (one store instance per consumer, per design). `angular-signals` - `effect()` + `untracked()` to (re)configure the store when the host's `selectedSlug()` changes. `angular-rxjs-streams` - `toObservable(revision).pipe(skip(1), takeUntilDestroyed())` so only revision CHANGES after mount trigger a reload. CLAUDE.md *Shared import convention* - the date-range filter is exported from the shared barrel so admin imports it from `@bikerental/shared`, never by deep path. UI state (range, page) lives in the store, not in component signals.

## 1. Objective

1. Export the existing `RentalDateRangeFilterComponent` (used on customer rentals) from `@bikerental/shared` so the admin app can reuse it unchanged.
2. Create the `operations` tab: a paged list (20 per page, newest first) of all movements on both point accounts (CASH and CARD_TERMINAL) with the date-range filter.
   * On mount (and whenever the host's selected slug changes) → `configure({ pointSlug, accounts: [CASH, CARD_TERMINAL], paged: true })` → page 0 loads.
   * Range change → `setRange(from, to)` → back to page 0 (FR-02 Scenario 10). Clear → `setRange(null, null)`.
   * Paginator → `loadPage(i)`.
   * `PointMoneyRefreshFacade.revision` change → `reload()` (current page, filters kept).
   * Empty (not loading, zero rows, including a failed load) → `Labels.PointOperationsEmpty`.
   * Table: `PointMovementTableComponent` with account column ON, date+time ON, running balance OFF.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/public-api.ts`
* **Action:** Modify Existing File

* **File Path:** `projects/admin/src/app/points/detail/point-operations-tab.component.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:** (contained in each snippet below)

**Code to Add/Replace:**

* **Location:** `projects/shared/src/public-api.ts` — directly below the existing line `export * from './shared/components/customer/profile-page/tabs/customer-rentals/customer-rental-list-item.component';`
* **Snippet:**

```typescript
export * from './shared/components/customer/profile-page/tabs/customer-rentals/rental-date-range-filter.component';
```

* **Location:** Whole content of NEW file `projects/admin/src/app/points/detail/point-operations-tab.component.ts`
* **Snippet:**

```typescript
import { ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { skip } from 'rxjs';
import {
  Labels,
  type PointAccountType,
  PointAdminStore,
  PointMoneyRefreshFacade,
  PointMovementsStore,
  type RentalDateRange,
  RentalDateRangeFilterComponent,
} from '@bikerental/shared';
import { PointMovementTableComponent } from './point-movement-table.component';

const OPERATION_ACCOUNTS: PointAccountType[] = ['CASH', 'CARD_TERMINAL'];

@Component({
  selector: 'app-point-operations-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PointMovementsStore],
  imports: [
    MatPaginatorModule,
    MatProgressBarModule,
    RentalDateRangeFilterComponent,
    PointMovementTableComponent,
  ],
  template: `
    <div class="p-4 md:p-6 flex flex-col gap-2">
      <app-rental-date-range-filter
        [from]="movements.fromDate() ?? undefined"
        [to]="movements.toDate() ?? undefined"
        (rangeChange)="onRangeChange($event)"
        (clear)="onClear()"
      />

      @if (movements.loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      @if (!movements.loading() && movements.items().length === 0) {
        <p class="text-slate-400 text-center mt-8">{{ labels.PointOperationsEmpty }}</p>
      } @else {
        <app-point-movement-table [movements]="movements.items()" showAccount showDate />
      }

      <mat-paginator
        [length]="movements.total()"
        [pageIndex]="movements.pageIndex()"
        [pageSize]="movements.pageSize()"
        [hidePageSize]="true"
        (page)="onPage($event)"
      />
    </div>
  `,
})
export class PointOperationsTabComponent {
  protected readonly labels = Labels;
  protected readonly movements = inject(PointMovementsStore);

  private readonly registry = inject(PointAdminStore);
  private readonly refresh = inject(PointMoneyRefreshFacade);

  constructor() {
    effect(() => {
      const pointSlug = this.registry.selectedSlug();
      if (!pointSlug) return;
      untracked(() =>
        this.movements.configure({ pointSlug, accounts: OPERATION_ACCOUNTS, paged: true }),
      );
    });
    toObservable(this.refresh.revision)
      .pipe(skip(1), takeUntilDestroyed())
      .subscribe(() => this.movements.reload());
  }

  protected onRangeChange(range: RentalDateRange): void {
    this.movements.setRange(range.from ?? null, range.to ?? null);
  }

  protected onClear(): void {
    this.movements.setRange(null, null);
  }

  protected onPage(event: PageEvent): void {
    this.movements.loadPage(event.pageIndex);
  }
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server. (The tab is not routed yet; it is fully type-checked by the build once Task 013 adds the route.)

```bash
npx prettier --write projects/shared/src/public-api.ts projects/admin/src/app/points/detail/point-operations-tab.component.ts
npx ng build admin --configuration development
npx ng lint shared
npx ng lint admin
```
