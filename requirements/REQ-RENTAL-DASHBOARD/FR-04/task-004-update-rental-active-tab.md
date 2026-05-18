# Task 004: Update RentalActiveTabComponent

> **Applied Skill:** `angular-component` — standalone, `OnPush`, `computed()` sort derivation,
> delegating to dumb child component via inputs.

## 1. Objective

Replace the entire body of `projects/operator/src/app/dashboard/rental-active-tab.component.ts`
to: add `standalone: true`, add a `sortedActiveRentals` computed signal (overdue-first then
ascending by `expectedReturnAt`), and delegate card rendering to `RentalActiveCardListComponent`.

**Depends on:** Task 003 (`RentalActiveCardListComponent`).

## 2. Files to Modify / Create

* **File Path:** `projects/operator/src/app/dashboard/rental-active-tab.component.ts`
* **Action:** Modify Existing File

---

## 3. Code Implementation

**Code to Replace:**

* **Location:** Replace the entire file content.

```typescript
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Labels, RentalListStore } from '@bikerental/shared';
import { RentalActiveCardListComponent } from './rental-active-card-list.component';

@Component({
  selector: 'app-rental-active-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RentalActiveCardListComponent],
  template: `
    <div class="px-4 py-2 text-sm text-slate-500">
      {{ totalActive() }}&nbsp;{{ Labels.ActiveRentals }}&nbsp;&middot;&nbsp;{{
        Labels.SortedByReturnTime
      }}
    </div>

    <app-rental-active-card-list
      [items]="sortedActiveRentals()"
      [isLoading]="store.isLoadingActive()"
    />
  `,
})
export class RentalActiveTabComponent {
  protected readonly store = inject(RentalListStore);

  protected readonly Labels = Labels;

  readonly totalActive = computed(() => this.sortedActiveRentals().length);

  readonly sortedActiveRentals = computed(() =>
    [...this.store.activeRentals()].sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;

      const dateA = a.expectedReturnAt;
      const dateB = b.expectedReturnAt;

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;

      const timeA = dateA instanceof Date ? dateA.getTime() : new Date(dateA).getTime();
      const timeB = dateB instanceof Date ? dateB.getTime() : new Date(dateB).getTime();

      return timeA - timeB;
    }),
  );
}
```

**Key implementation notes:**

- `standalone: true` is added — it was missing from the FR-02 placeholder implementation.
- The component **injects `RentalListStore` directly** via `inject()`. The `activeRentals`
  and `isLoadingActive` inputs are removed — the component reads from the store instead.
  `RentalListStore` is not in this component's `providers`; it resolves from `RentalDashboardComponent`
  (FR-02), which provides it at the route level.
- `totalActive` is a dedicated `computed()` that reads `sortedActiveRentals().length`,
  keeping the template expression simple.
- `sortedActiveRentals` creates a **copy** of the store array via spread (`[...store.activeRentals()]`)
  before calling `.sort()` to avoid mutating the signal-backed array in place.
- Sort rules (per FR-04 Scenario 1):
  1. `isOverdue === true` items first.
  2. Within each group, ascending by `expectedReturnAt`; items without `expectedReturnAt` sort
     last within the non-overdue group.
  3. Defensive `instanceof Date` guard on both dates before calling `.getTime()` — consistent
     with the same pattern used in `RentalCardComponent.remainingMinutes`.

---

## 4. Validation Steps

skip