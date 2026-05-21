# Task 003: Create RentalActiveCardListComponent

> **Applied Skill:** `angular-component` — standalone, `OnPush`, `input()` signal functions,
> structural control flow (`@if` / `@for`), empty-state and loading-state patterns.

## 1. Objective

Create `projects/operator/src/app/dashboard/rental-active-card-list.component.ts` — a pure
display component that receives a pre-sorted `RentalListItem[]` and an `isLoading` flag and
renders a spinner, an empty-state message, or a list of `RentalCardComponent` cards.

**Depends on:** Task 001 (labels), Task 002 (`RentalCardComponent`).

## 2. Files to Modify / Create

* **File Path:** `projects/operator/src/app/dashboard/rental-active-card-list.component.ts`
* **Action:** Create New File

---

## 3. Code Implementation

**Imports Required:**

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Labels } from '@bikerental/shared';
import type { RentalListItem } from '@bikerental/shared';
import { RentalCardComponent } from './rental-card.component';
```

**Code to Add:**

* **Location:** New file — full file content

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Labels } from '@bikerental/shared';
import type { RentalListItem } from '@bikerental/shared';
import { RentalCardComponent } from './rental-card.component';

@Component({
  selector: 'app-rental-active-card-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule, RentalCardComponent],
  template: `
    @if (isLoading()) {
      <div class="flex justify-center py-8">
        <mat-spinner diameter="40" />
      </div>
    } @else if (items().length === 0) {
      <div class="px-4 py-8 text-center text-slate-500 text-sm">
        {{ Labels.NoActiveRentals }}
      </div>
    } @else {
      <div class="flex flex-col gap-2 px-4 py-2">
        @for (rental of items(); track rental.id) {
          <app-rental-card [item]="rental" variant="active" />
        }
      </div>
    }
  `,
})
export class RentalActiveCardListComponent {
  readonly items = input<RentalListItem[]>([]);
  readonly isLoading = input(false);

  protected readonly Labels = Labels;
}
```

**Key implementation notes:**

- The component is intentionally dumb: no store dependency, no router dependency. All
  presentation state comes through the two inputs.
- Priority order in the template: loading → empty → list. This guarantees the spinner is
  shown even when `items` already contains stale data from a previous load cycle (Angular
  re-evaluates `@if` blocks top-down on each change-detection cycle).
- `@for (rental of items(); track rental.id)` — tracking by `id` ensures Angular reuses
  existing DOM nodes when only a subset of rentals changes after a refresh.
- `mat-spinner` from `MatProgressSpinnerModule` with `diameter="40"` provides a consistent
  loading indicator across the operator app. No extra CSS is needed.
- `Labels.NoActiveRentals` is the empty-state string added in Task 001.
- The outer `div.flex.flex-col.gap-2` wraps all cards with a consistent vertical gap.
  `px-4 py-2` provides edge padding matching the rest of the dashboard layout.

---

## 4. Validation Steps

skip
