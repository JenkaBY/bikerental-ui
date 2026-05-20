# Task 003: Add `Labels.SelectAll` and `Labels.Deselect` Constants

> **Applied Skill:** `angular-component` — All visible text must use Angular's `$localize`. The "Select all" and "Deselect" button labels are new strings required by `RentalEquipmentSectionComponent`.

## 1. Objective

Add two label constants used by `RentalEquipmentSectionComponent`'s section header buttons. Neither exists in the current `Labels` class.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/labels.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** None — the file uses `$localize` globally.

**Code to Add/Replace:**

* **Location:** Inside the `Labels` class, immediately after the existing `static readonly Equipment = $localize\`Equipment\`;` line (around line 39).

**Before:**

```typescript
  static readonly Equipment = $localize`Equipment`;
  static readonly All = $localize`All`;
```

**After:**

```typescript
  static readonly Equipment = $localize`Equipment`;
  static readonly SelectAll = $localize`Select all`;
  static readonly Deselect = $localize`Deselect`;
  static readonly All = $localize`All`;
```

> **i18n note:** After this change run `npm run i18n:extract` to update `src/locale/messages.xlf`. This is a housekeeping step and does not affect compilation or tests.

## 4. Validation Steps

skip
