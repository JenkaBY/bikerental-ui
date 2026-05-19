# Task 004: Add `Labels.ReturnPricing` Constant to Shared Labels

> **Applied Skill:** `angular-component` — All visible text must use Angular's `$localize`. Add the "Return pricing" section title to the shared `Labels` class before it is referenced in the template.

## 1. Objective

The `RentalDetailComponent` template will reference `Labels.ReturnPricing` as the static section header above `app-rental-pricing-section`. This constant does not yet exist; add it to the shared `Labels` class.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/labels.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** None — the file uses `$localize` globally.

**Code to Add/Replace:**

* **Location:** Inside the `Labels` class, immediately after the line `static readonly DiscountLabel = $localize\`Discount\`;` (the second-to-last entry before `static readonly Total`).

**Before (last few lines of the class):**

```typescript
  static readonly DiscountLabel = $localize`Discount`;
  static readonly Total = $localize`Total`;
  static readonly SpecialPriceApplied = $localize`Special price applied`;
}
```

**After:**

```typescript
  static readonly DiscountLabel = $localize`Discount`;
  static readonly Total = $localize`Total`;
  static readonly SpecialPriceApplied = $localize`Special price applied`;
  static readonly ReturnPricing = $localize`Return pricing`;
}
```

> **i18n note:** After this change, run `npm run i18n:extract` to update `src/locale/messages.xlf` with the new string unit. This is a housekeeping step and does not affect compilation or tests.

## 4. Validation Steps

skip
