# Task 003: Implement RentalHistoryCardListComponent

> **Applied Skill:** `angular-component` — standalone, `OnPush`, `inject()`, `computed()` sort
> derivation, structural control flow (`@if` / `@for`), empty-state and loading-state patterns.

## 1. Objective

Replace the FR-03 placeholder in
`projects/operator/src/app/dashboard/rental-history-card-list.component.ts` with the full
implementation. The component injects `RentalListStore` directly, sorts history rentals by
`startedAt` descending internally, and renders spinner / empty state / card list.

**Depends on:** Task 001 (label `NoHistoryRentals`), Task 002 (`RentalCardComponent` history
variant).

## 2. Files to Modify / Create

* **File Path:** `projects/operator/src/app/dashboard/rental-history-card-list.component.ts`
* **Action:** Modify Existing File (replaces FR-03 placeholder)

---

## 3. Code Implementation

**Code to Replace:**

* **Location:** Replace the entire file content.

```typescript
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Labels, RentalListStore } from '@bikerental/shared';
import { RentalCardComponent } from './rental-card.component';

@Component({
  selector: 'app-rental-history-card-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule, RentalCardComponent],
  template: `
    @if (store.isLoadingHistory()) {
      <div class="flex justify-center py-8">
        <mat-spinner diameter="40" />
      </div>
    } @else if (sortedHistoryRentals().length === 0) {
      <div class="px-4 py-8 text-center text-slate-500 text-sm">
        {{ Labels.NoHistoryRentals }}
      </div>
    } @else {
      <div class="flex flex-col gap-2 px-4 py-2">
        @for (rental of sortedHistoryRentals(); track rental.id) {
          <app-rental-card [item]="rental" variant="history" />
        }
      </div>
    }
  `,
})
export class RentalHistoryCardListComponent {
  protected readonly store = inject(RentalListStore);

  protected readonly Labels = Labels;

  readonly sortedHistoryRentals = computed(() =>
    [...this.store.historyRentals()].sort((a, b) => {
      const timeA = a.startedAt instanceof Date ? a.startedAt.getTime() : new Date(a.startedAt).getTime();
      const timeB = b.startedAt instanceof Date ? b.startedAt.getTime() : new Date(b.startedAt).getTime();
      return timeB - timeA;
    }),
  );
}
```

**Key implementation notes:**

- The component injects `RentalListStore` directly — no `items` or `isLoading` inputs. It
  resolves the store from the nearest provider, which is `RentalDashboardComponent` (FR-02).
- `sortedHistoryRentals` copies `store.historyRentals()` before sorting (`[...]`) to avoid
  mutating the signal-backed source. Sort order is `startedAt` descending — most recent first.
  The defensive `instanceof Date` guard is consistent with the pattern used in
  `RentalActiveTabComponent` and `RentalCardComponent`.
- `store.isLoadingHistory()` is read directly from the injected store, keeping the template
  reactive without requiring an extra computed wrapper.
- `variant="history"` is passed statically to every `RentalCardComponent`.
- `@for (rental of sortedHistoryRentals(); track rental.id)` tracks by the domain `id` key.
- `RentalHistoryTabComponent` no longer needs to pass any bindings to this component — its
  template binding becomes `<app-rental-history-card-list />` (see Task 004).

---

## 4. Validation Steps

skip
