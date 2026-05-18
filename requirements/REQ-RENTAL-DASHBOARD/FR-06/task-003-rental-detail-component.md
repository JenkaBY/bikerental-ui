# Task 003: Create RentalDetailComponent

> **Applied Skill:** `angular-component` — standalone, `OnPush`, `input.required()`,
> `computed()`, `effect()`, host-free smart page component, `DatePipe`, `Location.back()`.

## 1. Objective

Create `projects/operator/src/app/rental-detail/rental-detail.component.ts` — the smart page
shell for FR-06. It provides `RentalDetailStore`, loads data on activation via `effect()`, and
renders the top bar (back / title / badge), conditional overdue or debt banner, and a content
body placeholder for FR-07–FR-12 sections.

**Depends on:** Task 001 (labels), Task 002 (`RentalStore` extended with detail fields).

## 2. Files to Modify / Create

* **File Path:** `projects/operator/src/app/rental-detail/rental-detail.component.ts`
* **Action:** Create New File

---

## 3. Code Implementation

**Full file content:**

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { DatePipe, Location } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BatchRentalPropertyStore, CustomerFinanceStore, Labels, mapRentalStatus, RentalStore } from '@bikerental/shared';

@Component({
  selector: 'app-rental-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RentalStore, CustomerFinanceStore, BatchRentalPropertyStore],
  imports: [DatePipe, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="flex flex-col h-full">
      <div
        class="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0"
      >
        <button mat-icon-button (click)="onBack()" [attr.aria-label]="Labels.GoBack">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1 class="text-lg font-semibold text-slate-800">
          {{ Labels.RentalPrefix }}{{ rentalId() }}
        </h1>
        <span [class]="statusBadgeClasses()">{{ statusLabel() }}</span>
      </div>

      @if (store.isActive() && store.isOverdue()) {
        <div
          class="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-amber-700 text-sm shrink-0"
        >
          <mat-icon class="!text-base">warning_amber</mat-icon>
          <span>
            {{ Labels.OverdueBy }} {{ store.overdueMinutes() }} {{ Labels.MinuteShort }}
            @if (store.expectedReturnAt(); as returnAt) {
              &nbsp;&middot;&nbsp;{{ Labels.Expected }} {{ returnAt | date: 'HH:mm' }}
            }
          </span>
        </div>
      }

      @if (store.isDebt()) {
        <div
          class="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-amber-700 text-sm shrink-0"
        >
          <mat-icon class="!text-base">warning_amber</mat-icon>
          <span>
            @if (store.debtAmount(); as debt) {
              {{ debt.amount }}&nbsp;{{ debt.currency }}&nbsp;&middot;&nbsp;
            }
            {{ Labels.DebtAutoCharge }}
          </span>
        </div>
      }

      @if (store.isLoading()) {
        <div class="flex justify-center py-8">
          <mat-spinner diameter="40" />
        </div>
      } @else if (store.loadError()) {
        <div class="flex flex-col items-center gap-4 py-8 px-4">
          <p class="text-slate-500 text-sm">{{ Labels.CustomerRentalDetailLoadError }}</p>
          <button mat-button (click)="store.loadDetail(rentalId())">{{ Labels.Retry }}</button>
        </div>
      } @else if (store.id() !== null) {
        <div class="flex-1 overflow-y-auto">
        </div>
      }
    </div>
  `,
})
export class RentalDetailComponent {
  protected readonly store = inject(RentalStore);
  private readonly location = inject(Location);

  readonly id = input.required<string>();

  readonly rentalId = computed(() => Number(this.id()));

  protected readonly Labels = Labels;

  readonly statusBadgeClasses = computed(
    () =>
      `text-xs font-medium px-2 py-1 rounded-full ${mapRentalStatus(this.store.status()).badgeClasses}`,
  );

  readonly statusLabel = computed(() => mapRentalStatus(this.store.status()).label);

  constructor() {
    effect(() => {
      const id = this.rentalId();
      if (!isNaN(id) && id > 0) {
        this.store.loadDetail(id);
      }
    });
  }

  protected onBack(): void {
    this.location.back();
  }
}
```

**Key implementation notes:**

- `providers: [RentalStore, CustomerFinanceStore, BatchRentalPropertyStore]` creates fresh instances per route activation.
  `CustomerFinanceStore` is required because `RentalStore` injects it to expose
  `customerBalance` (used in FR-07). Both instances are destroyed with the component.
- `id = input.required<string>()` — route params are always strings in Angular. The computed
  `rentalId = computed(() => Number(this.id()))` converts to a number for the store.
  `withComponentInputBinding()` is active in `app.config.ts`, so Angular automatically binds the
  `:id` route param to this input.
- `effect()` in the constructor calls `store.loadDetail(rentalId())` whenever `rentalId`
  changes. The guard `!isNaN(id) && id > 0` protects against an invalid param.
- The content body uses `@else if (store.id() !== null)` as the third branch — this prevents
  rendering the empty `<div>` during the brief window before the first `loadDetail()` call
  populates `store.id()`.
- Overdue banner (`isActive && isOverdue`) and debt banner (`isDebt`) are mutually exclusive by
  design: a rental cannot be both ACTIVE-overdue and DEBT at the same time. The `@if` blocks
  are independent; in practice only one fires.
- `statusBadgeClasses` builds the full class string including both base layout classes and
  `RentalStatusMeta.badgeClasses`. Using a single `[class]` binding avoids the Angular
  class-merging caveat when combining a static `class` attribute with `[class]` binding.
- `Labels.CustomerRentalDetailLoadError` = "Failed to load rental details" — already exists in
  `labels.ts`. Do **not** add it again.
- `onBack()` calls `Location.back()`, which navigates to the previous browser history entry,
  naturally restoring the dashboard's `?tab=` and `?filter=` query params (Scenario 5 in FR-06).
- The empty `<div class="flex-1 overflow-y-auto">` is intentionally empty — FR-07 through FR-12
  will add child components inside this element in subsequent tasks.
- **`store.id()` vs `store.isLoading()`**: `store.id()` starts as `null` (initial
  `RentalDetailState` default). The content guard `store.id() !== null` is safe because
  `loadDetail()` calls `patchState(toDetailState(...))` which always sets `id` from the
  response before `isLoading` drops to `false`.

---

## 4. Validation Steps

skip
