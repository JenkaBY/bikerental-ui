# Task 001: Add Rental Dashboard i18n Labels

> **Applied Skill:** `angular-component` — i18n rule: all visible text must use `$localize` via
> `Labels` constants; never raw string literals in templates.

## 1. Objective

Add six new `Labels` constants used by `RentalDashboardComponent` and `RentalActiveTabComponent`.
No other files are touched in this task.

## 2. Files to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/labels.ts`
* **Action:** Modify Existing File

---

## 3. Code Implementation

**Imports Required:** none — file already uses `$localize` globally.

**Code to Add:**

* **Location:** Append after the very last existing property
  (`static readonly EquipmentItemStatusActive = $localize\`In use\`;`) — inside the `Labels`
  class body, before the closing `}`.

```typescript
  static readonly Rentals = $localize`Rentals`;
  static readonly ActiveTab = $localize`Active`;
  static readonly TodaysHistoryTab = $localize`Today's History`;
  static readonly ActiveRentals = $localize`active rentals`;
  static readonly SortedByReturnTime = $localize`sorted by return time`;
  static readonly Refresh = $localize`Refresh`;
```

---

## 4. Validation Steps

skip