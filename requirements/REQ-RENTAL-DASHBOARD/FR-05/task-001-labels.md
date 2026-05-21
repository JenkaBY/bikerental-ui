# Task 001: Add History Card i18n Labels

> **Applied Skill:** `angular-component` — i18n rule: all visible text via `Labels` constants.

## 1. Objective

Add two new `Labels` constants required by `RentalCardComponent` (history row 2) and
`RentalHistoryCardListComponent` (empty-state message).

## 2. Files to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/labels.ts`
* **Action:** Modify Existing File

---

## 3. Code Implementation

**Code to Add:**

* **Location:** Append after `static readonly Returned = $localize\`Returned\`;` — inside the
  `Labels` class body, before the closing `}`.

```typescript
  static readonly NoHistoryRentals = $localize`No rentals`;
  static readonly Ended = $localize`Ended`;
```

**Key implementation notes:**

- `Ended` is used in history row 2 as a prefix: `{{ Labels.Ended }} {{ endedAt | date:'HH:mm' }}`
  → "Ended 14:30". The date formatting is handled by `DatePipe` in the component.
- For debt history cards, `Labels.RentalStatusDebt` (already exists) is combined with `Ended`:
  "Debt · Ended 14:30".
- `NoHistoryRentals` maps to the FR-05 BDD Scenario 5 empty-state requirement.

---

## 4. Validation Steps

skip
