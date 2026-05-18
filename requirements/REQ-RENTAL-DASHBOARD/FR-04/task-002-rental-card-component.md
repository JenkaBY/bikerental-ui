# Task 002: Create RentalCardComponent

> **Applied Skill:** `angular-component` — standalone, `OnPush`, `input()` / `output()` signal
> functions, host bindings for click, user-facing role-based locators.

## 1. Objective

Create `projects/operator/src/app/dashboard/rental-card.component.ts` — a pure display card
shared by both the Active and History tabs. Accepts a single `RentalListItem` and a `variant`
hint. Renders three rows: customer phone + status badge (row 1), time row (row 2, active only),
and equipment pills (row 3). Navigates to `/rentals/:id` when tapped.

**Depends on:** Task 001 (labels).

## 2. Files to Modify / Create

### File A

* **File Path:** `projects/shared/src/core/models/rental.model.ts`
* **Action:** Modify Existing File

### File B

* **File Path:** `projects/operator/src/app/dashboard/rental-card.component.ts`
* **Action:** Create New File

---

## 3. Code Implementation

### 3.1 — Enrich `RentalStatusMeta` and `RentalStatus` in `rental.model.ts`

**Imports Required (add at the top of the file):**

```typescript
import { Labels } from '../../shared/constant/labels';
```

**Change 1 — Add `label` and `badgeClasses` fields to the interface:**

* **Location:** Inside `RentalStatusMeta` — append after `readonly labelKey: string;`

```typescript
  readonly label: string;
  readonly badgeClasses: string;
```

**Change 2 — Populate the new fields in `RentalStatus`:**

* **Location:** Replace the entire `RentalStatus` constant.

```typescript
export const RentalStatus: Record<string, RentalStatusMeta> = {
  DRAFT:     { slug: 'DRAFT',     color: 'default', labelKey: 'rentalStatus.draft',      label: Labels.RentalStatusDraft,      badgeClasses: 'bg-gray-100 text-gray-600'  },
  ACTIVE:    { slug: 'ACTIVE',    color: 'primary', labelKey: 'rentalStatus.active',     label: Labels.RentalStatusActive,     badgeClasses: 'bg-blue-100 text-blue-700'  },
  COMPLETED: { slug: 'COMPLETED', color: 'default', labelKey: 'rentalStatus.completed',  label: Labels.RentalStatusCompleted,  badgeClasses: 'bg-gray-100 text-gray-600'  },
  CANCELLED: { slug: 'CANCELLED', color: 'default', labelKey: 'rentalStatus.cancelled',  label: Labels.RentalStatusCancelled,  badgeClasses: 'bg-gray-100 text-gray-600'  },
  DEBT:      { slug: 'DEBT',      color: 'warn',    labelKey: 'rentalStatus.debt',       label: Labels.RentalStatusDebt,       badgeClasses: 'bg-amber-100 text-amber-700' },
};
```

**Change 3 — Update `DEFAULT_RENTAL_STATUS`:**

* **Location:** Replace the `DEFAULT_RENTAL_STATUS` constant.

```typescript
const DEFAULT_RENTAL_STATUS: RentalStatusMeta = { slug: '', color: 'default', labelKey: '', label: '', badgeClasses: 'bg-gray-100 text-gray-600' };
```

---

### 3.2 — Create `rental-card.component.ts`

**Imports Required:**

```typescript
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Labels, mapRentalStatus } from '@bikerental/shared';
import type { RentalListItem } from '@bikerental/shared';
```

**Code to Add:**

* **Location:** New file — full file content

```typescript
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Labels, mapRentalStatus } from '@bikerental/shared';
import type { RentalListItem } from '@bikerental/shared';

@Component({
  selector: 'app-rental-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  host: {
    '(click)': 'navigateToDetail()',
    'class': 'block cursor-pointer select-none transition-colors duration-200 rounded-lg p-3 shadow-sm border border-transparent bg-white',
    '[class.bg-amber-50]': 'item().isOverdue',
    '[class.border-l-4]': 'item().isOverdue',
    '[class.border-l-amber-400]': 'item().isOverdue',
  },
  template: `
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <span class="font-bold text-slate-900">{{ item().customerPhone }}</span>
        @if (item().customerName) {
          <span class="text-slate-500">&nbsp;({{ item().customerName }})</span>
        }
      </div>
      <span [class]="badgeClasses()" class="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full">
        {{ statusLabel() }}
      </span>
    </div>

    @if (variant() === 'active') {
      <div class="mt-1 text-sm font-medium">
        @if (item().isOverdue) {
          <span class="text-amber-600">
            {{ Labels.OverdueBy }} {{ item().overdueMinutes }} {{ Labels.MinuteShort }}
          </span>
        } @else {
          <span class="text-slate-500">
            @if (remainingMinutes(); as mins) {
              {{ mins }} {{ Labels.MinuteShort }} {{ Labels.Remaining }}
            }
            @if (item().expectedReturnAt; as returnAt) {
              @if (remainingMinutes()) { &nbsp;&middot;&nbsp; }
              {{ returnAt | date: 'HH:mm' }}
            }
          </span>
        }
      </div>
    }

    @if (item().equipmentNames.length > 0) {
      <div class="mt-2 flex flex-wrap gap-1">
        @for (name of item().equipmentNames; track $index) {
          <span class="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-700">
            {{ name }}
          </span>
        }
      </div>
    }
  `,
})
export class RentalCardComponent {
  private readonly router = inject(Router);

  readonly item = input.required<RentalListItem>();
  readonly variant = input<'active' | 'history'>('active');

  protected readonly Labels = Labels;

  readonly statusLabel = computed(() => mapRentalStatus(this.item().status).label);

  readonly badgeClasses = computed(() => mapRentalStatus(this.item().status).badgeClasses);

  readonly remainingMinutes = computed(() => {
    const returnAt = this.item().expectedReturnAt;
    if (!returnAt) return null;
    const returnTime = returnAt instanceof Date ? returnAt.getTime() : new Date(returnAt).getTime();
    const diff = Math.floor((returnTime - Date.now()) / 60_000);
    return diff > 0 ? diff : null;
  });

  protected navigateToDetail(): void {
    void this.router.navigate(['/rentals', this.item().id]);
  }
}
```

**Key implementation notes:**

- `label` and `badgeClasses` are now fields on `RentalStatusMeta`, populated once in the
  `RentalStatus` record. The component no longer maintains separate lookup maps — both computed
  properties delegate directly to `mapRentalStatus(status).label` and `.badgeClasses`.
- `Labels` is imported into `rental.model.ts` via a relative path (`../../shared/constant/labels`).
  No circular dependency exists because `labels.ts` does not import from `rental.model.ts`.
- Overdue card styling is applied via **conditional host bindings** (`[class.bg-amber-50]`,
  `[class.border-l-4]`, `[class.border-l-amber-400]`) rather than a `cardClasses()` computed.
  The template has no wrapping container `<div>` — card layout styles live on the host element.
- `mapRentalStatus` is imported from `@bikerental/shared` alongside `Labels`. Verify that
  `mapRentalStatus` is exported from the shared library barrel (`projects/shared/src/index.ts`);
  if not, add `export { mapRentalStatus } from './core/models/rental.model';` there.
- `remainingMinutes()` returns `null` when `expectedReturnAt` is absent or when the diff is
  ≤ 0. The `instanceof Date` guard handles potential string payloads before the mapper
  normalises them.
- `@if (remainingMinutes(); as mins)` and `@if (item().expectedReturnAt; as returnAt)` use
  the Angular `@if…as` binding pattern — the `·` separator is only rendered when
  `remainingMinutes()` is truthy, preventing a leading dot when no time remains.
- `variant = input<'active' | 'history'>('active')` defaults to `'active'`. The `history`
  variant suppresses row 2; its content is specified in FR-05.
- `DatePipe` is a standalone pipe; the locale is configured globally in `app.config.ts`.

---

## 4. Validation Steps

skip
