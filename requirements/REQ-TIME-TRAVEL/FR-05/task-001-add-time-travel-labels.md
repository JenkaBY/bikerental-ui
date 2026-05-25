# Task 001: Add Time Travel Dialog Labels to `labels.ts`

> **Applied Skill:** `angular.instructions.md` — all visible text must use `$localize` constants stored in `shared/constant/labels.ts`; new entries appended before the closing `}` of the `Labels` class

## 1. Objective

Add two new `$localize`-tagged string constants to `Labels`:

* `TimeTravelDialogTitle` — used as the `mat-dialog-title` and the field label inside the dialog.
* `TimeTravelReset` — used as the Reset button label. (`Labels.Save` already covers the Save button.)

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/labels.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

```typescript
// No new imports — $localize is a compile-time tag, not a runtime import
```

**Code to Add/Replace:**

* **Location:** Append the two new constants as the **last two entries** of the `Labels` class, immediately before the closing `}` that follows `static readonly CurrencySymbol`.

* **Snippet (Replace the closing section):**

```typescript
  static readonly Apply = $localize`Apply`;
  static readonly CurrencySymbol = $localize`BYN`; // Note: prefer the MoneyPipe for currency display; this label is a legacy fallback only

  static readonly TimeTravelDialogTitle = $localize`Server Time`;
  static readonly TimeTravelReset = $localize`Reset`;
}
```

## 4. Validation Steps

skip