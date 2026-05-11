# Task 004: Add `Labels.RentalDraftLoadError` to `labels.ts`

> **Applied Skill:** `angular-component` — All user-visible strings must be registered as `$localize` tagged template literals in `Labels` class; this label is required by the snackbar shown in Task 005 when draft loading fails.

## 1. Objective

Add a new static label `RentalDraftLoadError` to the shared `Labels` class so that `RentalCreateComponent` (Task 005) can reference a fully translated, i18n-compliant error message for the snackbar notification shown when a draft rental cannot be loaded.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/labels.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** None — the file already uses `$localize` without an explicit import (it is provided by `@angular/localize/init` loaded globally).

**Code to Add/Replace:**

* **Location:** At the end of the `Labels` class body, after the last existing `static readonly` line. The current last entry in the file is `static readonly MinimumDurationSurcharge`. Insert the new label immediately after it, before the closing `}` of the class.
* **Snippet:**

```typescript
  static readonly RentalDraftLoadError = $localize`Failed to load rental draft. Starting fresh.`;
```

After the change the bottom of the class must look like:

```typescript
  static readonly MinimumDurationSurcharge = $localize`Minimum Duration Surcharge`;
  static readonly RentalDraftLoadError = $localize`Failed to load rental draft. Starting fresh.`;
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx ng build shared
```
