# Task 003: Add Action Button Labels to Shared `Labels` Class

> **Applied Skill:** `angular-component` — All visible text must use Angular's `$localize`. Adds all new labels required by `RentalActionButtonsComponent` and `CancelRentalDialogComponent`.

## 1. Objective

Add labels for the action buttons, confirmation dialog, and snackbar messages. None of these exist in the current `Labels` class.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/labels.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** None — the file uses `$localize` globally.

**Code to Add/Replace:**

* **Location:** Inside the `Labels` class, immediately after the last existing line `static readonly ReturnPricing = $localize\`Return pricing\`;` and before the closing `}` of the class.

**Before (last two lines of the class):**

```typescript
  static readonly ReturnPricing = $localize`Return pricing`;
}
```

**After:**

```typescript
  static readonly ReturnPricing = $localize`Return pricing`;

  static readonly ReturnEquipmentButton = $localize`Return equipment`;
  static readonly BrokenEquipment = $localize`Broken`;
  static readonly CancelRental = $localize`Cancel rental`;
  static readonly KeepRental = $localize`Keep rental`;
  static readonly YesCancel = $localize`Yes, cancel`;
  static readonly CancelRentalConfirmation = $localize`Are you sure you want to cancel this rental?`;
  static readonly RentalReturnSuccess = $localize`Equipment returned successfully`;
  static readonly RentalCancelSuccess = $localize`Rental cancelled`;
  static readonly RentalReturnError = $localize`Failed to return equipment. Please try again.`;
  static readonly RentalCancelError = $localize`Failed to cancel rental. Please try again.`;
}
```

> **i18n note:** After this change run `npm run i18n:extract` to update `src/locale/messages.xlf`. This is a housekeeping step and does not affect compilation or tests.

## 4. Validation Steps

skip
