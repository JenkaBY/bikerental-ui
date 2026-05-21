# Task 004: Update `onBroken()` in `RentalActionButtonsComponent` to Handle Sheet Result

> **Applied Skill:** `angular-signals` — Updates the `onBroken()` method to (1) pass `existingEntries` as the correct data key expected by `BrokenEquipmentSheetComponent`, and (2) subscribe to `afterDismissed()` so that a defined result (i.e., "Apply" was tapped) triggers `RentalStore.setBrokenEquipmentEntries()`.

## 1. Objective

The `onBroken()` method in `RentalActionButtonsComponent` currently:

1. Passes the data key `brokenEquipmentEntries` — but `BrokenEquipmentSheetComponent` (Task 003) reads `existingEntries` from its `MAT_BOTTOM_SHEET_DATA`.
2. Does **not** subscribe to the dismissal result — so "Apply" results are silently discarded.

This task fixes both issues without changing any other logic in the component.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-detail/rental-action-buttons.component.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

### Step A — Add `BrokenEquipmentEntry` type import

**Before:**

```typescript
import { Labels, RentalStore } from '@bikerental/shared';
```

**After:**

```typescript
import type { BrokenEquipmentEntry } from '@ui-models';
import { Labels, RentalStore } from '@bikerental/shared';
```

### Step B — Replace `onBroken()`

**Before:**

```typescript
  protected onBroken(): void {
    this.bottomSheet.open(BrokenEquipmentSheetComponent, {
      data: {
        equipmentItems: this.store.rentalEquipmentItems(),
        brokenEquipmentEntries: this.store.brokenEquipmentEntries(),
      },
    });
  }
```

**After:**

```typescript
  protected onBroken(): void {
    this.bottomSheet
      .open(BrokenEquipmentSheetComponent, {
        data: {
          equipmentItems: this.store.rentalEquipmentItems(),
          existingEntries: this.store.brokenEquipmentEntries(),
        },
      })
      .afterDismissed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((entries: BrokenEquipmentEntry[] | undefined) => {
        if (entries !== undefined) {
          this.store.setBrokenEquipmentEntries(entries);
        }
      });
  }
```

### Why `entries !== undefined` and not `entries`?

"Apply" with zero items checked dismisses with `[]` (empty array). An empty array is falsy in a
boolean check. Using `!== undefined` correctly distinguishes "Apply with no items" (persists `[]`)
from "Cancel/background dismiss" (persists nothing).

## 4. Validation Steps

skip
