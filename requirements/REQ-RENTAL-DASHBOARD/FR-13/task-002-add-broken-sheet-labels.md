# Task 002: Add Broken Equipment Sheet Labels to Shared `Labels` Class

> **Applied Skill:** `angular-component` — All visible text must use Angular's `$localize`. Adds all labels required by `BrokenEquipmentSheetComponent`: title, subtitle, penalty-under-development banner, returned items note, apply button, and currency symbol prefix.

## 1. Objective

`BrokenEquipmentSheetComponent` (Task 003) renders a title, subtitle, informational banner, note
line, and two buttons. `Labels.Cancel` already exists. All other string literals required by the
sheet must be added here.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/labels.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Location:** Inside the `Labels` class, immediately after the last existing line
`static readonly RentalCancelError = ...;` and before the closing `}`.

**Before:**

```typescript
  static readonly RentalCancelError = $localize`Failed to cancel rental. Please try again.`;
}
```

**After:**

```typescript
  static readonly RentalCancelError = $localize`Failed to cancel rental. Please try again.`;

  static readonly BrokenEquipmentTitle = $localize`Broken equipment`;
  static readonly BrokenEquipmentSubtitle = $localize`Select items to mark as broken and enter the penalty amount if applicable`;
  static readonly BrokenEquipmentPenaltyUnderDevelopment = $localize`Penalty submission is under development. Broken item tracking will be available in a future update.`;
  static readonly ItemsAlreadyReturned = $localize`items already returned`;
  static readonly Apply = $localize`Apply`;
  static readonly CurrencySymbol = $localize`BYN`;
}
```

> **Usage of `ItemsAlreadyReturned`:** The count is rendered as a dynamic prefix in the template:
> `{{ returnedCount }} {{ Labels.ItemsAlreadyReturned }}` — e.g., `"1 items already returned"`.
> This keeps the constant translatable while the number is interpolated separately.

> **i18n note:** After this change run `npm run i18n:extract` to update `src/locale/messages.xlf`.

## 4. Validation Steps

skip
