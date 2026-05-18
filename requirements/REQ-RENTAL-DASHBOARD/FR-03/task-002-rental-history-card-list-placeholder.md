# Task 002: Create RentalHistoryCardListComponent Placeholder

> **Applied Skill:** `angular-component` — standalone, `OnPush`, `input()`.

## 1. Objective

Create a minimal `RentalHistoryCardListComponent` so that `RentalHistoryTabComponent` (Task 003)
compiles. FR-05 replaces this file entirely with the full card list implementation.

**Depends on:** nothing.

## 2. Files to Modify / Create

* **File Path:** `projects/operator/src/app/dashboard/rental-history-card-list.component.ts`
* **Action:** Create New File (placeholder — replaced entirely in FR-05)

---

## 3. Code Implementation

**Code to Add:**

* **Location:** New file — full file content

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { RentalListItem } from '@bikerental/shared';

@Component({
  selector: 'app-rental-history-card-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class RentalHistoryCardListComponent {
  readonly rentals = input<RentalListItem[]>([]);
  readonly isLoading = input(false);
}
```

---

## 4. Validation Steps

skip
