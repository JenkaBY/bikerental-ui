# Task 002: Create RentalActiveTabComponent

> **Applied Skill:** `angular-component` — standalone, `ChangeDetectionStrategy.OnPush`,
> `input()` signal functions, no constructor injection.

## 1. Objective

Create the dumb `RentalActiveTabComponent` that renders the subtitle row (active rental count +
sort description). Rental cards (FR-04) will be added as a child element later. The component
accepts all data via signal inputs — it has no store injection.

**Depends on:** Task 001 (Labels constants).

## 2. Files to Modify / Create

* **File Path:** `projects/operator/src/app/dashboard/rental-active-tab.component.ts`
* **Action:** Create New File

---

## 3. Code Implementation

**Imports Required:**

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { RentalListItem } from '@bikerental/shared';
import { Labels } from '@bikerental/shared';
```

**Code to Add:**

* **Location:** New file — full file content

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { RentalListItem } from '@bikerental/shared';
import { Labels } from '@bikerental/shared';

@Component({
  selector: 'app-rental-active-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-4 py-2 text-sm text-slate-500">
      {{ activeRentals().length }}&nbsp;{{ Labels.ActiveRentals }}&nbsp;·&nbsp;{{ Labels.SortedByReturnTime }}
    </div>
  `,
})
export class RentalActiveTabComponent {
  readonly activeRentals = input<RentalListItem[]>([]);
  readonly isLoadingActive = input(false);

  protected readonly Labels = Labels;
}
```

**Key implementation notes:**

- `isLoadingActive` input is declared now so the parent component can bind it today;
  it will be consumed to show a loading skeleton in FR-04.
- The subtitle row is always visible (even while loading) so the operator can see the previous
  count during a refresh.
- No `imports` array entry needed — the template uses only interpolation (no directives).

---

## 4. Validation Steps

skip
