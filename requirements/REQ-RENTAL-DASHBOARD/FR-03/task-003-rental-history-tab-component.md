# Task 003: Implement RentalHistoryTabComponent

> **Applied Skill:** `angular-component` — standalone, `OnPush`, `input()`, `computed()`.
> `angular-routing` — `withComponentInputBinding()` for `?filter=` query-param binding,
> `Router.navigate` with `replaceUrl`.

## 1. Objective

Replace the empty FR-02 placeholder at
`projects/operator/src/app/dashboard/rental-history-tab.component.ts` with the full
implementation. The component:

- Reads `?filter=` from the URL via `input()` (resolved by `withComponentInputBinding()`).
- Validates the filter value against the known enum; falls back to `'ALL'` for invalid values.
- Derives the visible list as a `computed()` subset of `RentalListStore.historyRentals`.
- Renders a horizontally scrollable `MatButtonToggleGroup` filter bar.
- Renders a subtitle row with today's local date and the filtered item count.
- Delegates the card list to `RentalHistoryCardListComponent`, passing the filtered list and
  `isLoadingHistory`.

The initial data load is handled by the parent `RentalDashboardComponent` via its `effect()` —
this component does **not** call `store.loadHistory` itself.

**Depends on:** Task 001 (Labels), Task 002 (RentalHistoryCardListComponent placeholder),
FR-01 Task 004 (RentalListStore), FR-02 Task 003 (RentalDashboardComponent provides the store).

## 2. Files to Modify / Create

* **File Path:** `projects/operator/src/app/dashboard/rental-history-tab.component.ts`
* **Action:** Modify Existing File (replace placeholder content entirely)

---

## 3. Code Implementation

**Imports Required:**

```typescript
import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Labels, RentalListStore } from '@bikerental/shared';
import { RentalHistoryCardListComponent } from './rental-history-card-list.component';
```

**Code to Replace:**

* **Location:** Replace the entire file content (the current FR-02 placeholder).

```typescript
import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Labels, RentalListStore } from '@bikerental/shared';
import { RentalHistoryCardListComponent } from './rental-history-card-list.component';

const VALID_FILTERS = new Set(['ALL', 'COMPLETED', 'DEBT', 'CANCELLED', 'DRAFT']);

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: Labels.All },
  { value: 'COMPLETED', label: Labels.RentalStatusCompleted },
  { value: 'DEBT', label: Labels.RentalStatusDebt },
  { value: 'CANCELLED', label: Labels.RentalStatusCancelled },
  { value: 'DRAFT', label: Labels.FilterDrafts },
];

@Component({
  selector: 'app-rental-history-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatButtonToggleModule, RentalHistoryCardListComponent],
  template: `
    <div class="overflow-x-auto -mx-4">
      <div class="px-4 py-2 w-max">
        <mat-button-toggle-group
          [value]="activeFilter()"
          (change)="onFilterChange($event.value)"
          hideSingleSelectionIndicator
        >
          @for (f of filterOptions; track f.value) {
            <mat-button-toggle [value]="f.value">{{ f.label }}</mat-button-toggle>
          }
        </mat-button-toggle-group>
      </div>
    </div>
    <div class="px-4 py-2 text-sm text-slate-500">
      {{ today | date:'d MMMM yyyy' }}&nbsp;&middot;&nbsp;{{ totalRecords() }}&nbsp;{{ Labels.Records }}
    </div>
    <app-rental-history-card-list
      [rentals]="store.historyRentals()"
      [isLoading]="store.isLoadingHistory()"
    />
  `,
})
export class RentalHistoryTabComponent {
  protected readonly store = inject(RentalListStore);
  private readonly router = inject(Router);

  readonly filter = input<string>();

  readonly activeFilter = computed(() => {
    const f = this.filter()?.toUpperCase();
    return VALID_FILTERS.has(f ?? '') ? f! : 'ALL';
  });

  readonly totalRecords = computed(() => this.store.historyRentals().length);

  protected readonly filterOptions = FILTER_OPTIONS;
  protected readonly Labels = Labels;
  protected readonly today = new Date();

  constructor() {
    effect(() => {
      const currentFilter = this.activeFilter();
      const todayStr = this.getTodayDateString();
      this.store.loadHistory(todayStr, todayStr, currentFilter);
    });
  }

  protected onFilterChange(filterValue: string): void {
    void this.router.navigate([], {
      queryParams: { filter: filterValue },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private getTodayDateString(): string {
    return this.today.toISOString().split('T')[0];
  }
}
```

**Key implementation notes:**

- `VALID_FILTERS` and `FILTER_OPTIONS` are module-level constants — evaluated once at class load
  time and shared across all instances.
- `filter = input<string>()` receives the `?filter=` query parameter automatically via
  `withComponentInputBinding()`. No `ActivatedRoute` injection needed.
- `activeFilter = computed(...)` normalises the filter to uppercase and validates it against
  `VALID_FILTERS`. Any unrecognised value (including `undefined` when the param is absent) falls
  back to `'ALL'`.
- Filtering is **server-side**: the `effect()` in the constructor calls
  `store.loadHistory(todayStr, todayStr, currentFilter)` whenever `activeFilter()` changes
  (including initial construction). The store passes the filter slug to the API as the `status`
  query parameter; `'ALL'` is converted to `undefined` by the store.
- `totalRecords = computed(...)` reflects the count of items returned by the server for the
  current filter — used in the subtitle row.
- `today = new Date()` is set at construction time; re-mounting the component (route navigation)
  refreshes the date.
- `getTodayDateString()` uses `this.today.toISOString().split('T')[0]` — consistent with the
  instance property so tests can control the date by mocking `today`.
- `RentalListStore` is NOT in this component's `providers`. It resolves from the nearest ancestor
  that provides it — `RentalDashboardComponent`.

---

## 4. Validation Steps

skip
