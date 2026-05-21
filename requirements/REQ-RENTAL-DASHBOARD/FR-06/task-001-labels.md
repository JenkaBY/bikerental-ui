# Task 001: Add FR-06 i18n Labels

> **Applied Skill:** `angular-component` — i18n rule: all visible text must be declared as
> `Labels` constants via `$localize`.

## 1. Objective

Add five new `Labels` constants required by `RentalDetailComponent`: the back button aria-label,
the rental title prefix, the overdue banner "expected" label, the debt auto-charge message, and
the retry button text.

## 2. Files to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/labels.ts`
* **Action:** Modify Existing File

---

## 3. Code Implementation

**Code to Add:**

* **Location:** Append after the last `static readonly` entry inside the `Labels` class body,
  before the closing `}`.

```typescript
  static readonly GoBack = $localize`Go back`;
  static readonly RentalPrefix = $localize`Rental #`;
  static readonly Expected = $localize`Expected`;
  static readonly DebtAutoCharge = $localize`Balance will be charged automatically once topped up`;
  static readonly Retry = $localize`Retry`;
```

**Key implementation notes:**

- `GoBack` is used as the `[attr.aria-label]` on the back button icon in `RentalDetailComponent`.
- `RentalPrefix` is composed with the numeric ID in the template:
  `{{ Labels.RentalPrefix }}{{ rentalId() }}` → "Rental #42".
- `Expected` is used in the overdue banner:
  `{{ Labels.OverdueBy }} {{ store.overdueMinutes() }} {{ Labels.MinuteShort }} · {{ Labels.Expected }} {{ store.expectedReturnAt() | date:'HH:mm' }}`
  — `OverdueBy` and `MinuteShort` are added in FR-04/task-001 and FR-03 respectively; verify
  they exist before adding them again.
- `DebtAutoCharge` is the explanatory line in the debt banner, satisfying the FR-06 BDD
  Scenario 3 requirement: "Balance will be charged automatically once topped up".
- `Retry` is the label for the retry button shown in the API error state (Scenario 7).
- `CustomerRentalDetailLoadError` (= "Failed to load rental details") already exists in
  `labels.ts` and is reused for the error state — do **not** add a duplicate.

---

## 4. Validation Steps

```powershell
npm run build -- --project shared
```
