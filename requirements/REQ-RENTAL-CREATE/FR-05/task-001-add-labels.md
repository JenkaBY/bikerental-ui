# Task 001: Add Labels for Step 2

> **Applied Skill:** `angular-component` — All visible text must use `$localize` via the `Labels` class. Add constants before running `npm run i18n:extract`.

## 1. Objective

Add the new i18n label constants required by the Step 2 components to `projects/shared/src/shared/constant/labels.ts`.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/labels.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Location:** Add the following block immediately after the last existing label (`static readonly TransactionTypeLabel`), before the closing `}` of the class.

```typescript
  static readonly Duration = $localize`Duration`;
  static readonly DurationMinutes = $localize`Duration (min)`;
  static readonly SearchEquipmentPlaceholder = $localize`Search by UID or model...`;
  static readonly ScanQr = $localize`Scan QR`;
  static readonly ComingSoon = $localize`Coming soon`;
  static readonly DiscountPercent = $localize`Discount (%)`;
  static readonly SpecialPrice = $localize`Special Price`;
  static readonly SpecialPriceModeLabel = $localize`Special price mode`;
  static readonly TotalCost = $localize`Total Cost`;
  static readonly ProjectedBalance = $localize`Balance after payment`;
  static readonly InsufficientBalance = $localize`Insufficient balance`;
  static readonly SaveDraft = $localize`Save Draft`;
  static readonly Next = $localize`Next`;
  static readonly DraftSaved = $localize`Draft saved`;
  static readonly NoEquipmentSelected = $localize`Add at least one item to proceed`;
```

## 4. Validation Steps

skip
