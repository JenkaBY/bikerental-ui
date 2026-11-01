# Task 002: Labels and message function for the operator hand-in flow

> **Applied Skill:** AGENTS.md i18n Rules - every visible string is a `Labels.*` / `$localize` entry. Existing labels are REUSED (no duplicates): `Labels.OperatorHandInCash` (screen title and fallback button caption), `Labels.PointCashCardTitle` ("Cash drawer"), `Labels.PointMoveAvailable`, `Labels.PointMoveAmount`, `Labels.PointMoveAll`, `Labels.PointMoveSourceLabel`, `Labels.PointMoveDestinationLabel`, `Labels.PointMoveBankAccount`, `Labels.PointMoveRemainingRow`, `pointMoveRemaining()`, `Labels.Back`, `Labels.GoBack`, `Labels.PointCollectionNotActiveHint`, `Labels.PointShiftNone`, `Labels.PointShiftLoadFailed`, `Labels.Retry`, `FormErrorMessages.amount*`. `Labels.Done` has the SAME English source and meaning as the existing `Labels.TemporaryPasswordDoneButton`, so Angular emits ONE shared message id: it adds no new `<trans-unit>`.

## 1. Objective

New entries (the "Hand in {amount}" caption is a function because it has a placeholder):

| Constant | English source |
|---|---|
| `Labels.OperatorHandInConfirmTitle` | `Hand in cash?` |
| `Labels.OperatorHandInNote` | `Instant and cannot be cancelled — if it was a mistake, an administrator corrects it` |
| `Labels.OperatorHandInConfirm` | `Hand in` |
| `Labels.OperatorCashHandedIn` | `Cash handed in` |
| `Labels.OperatorReceiptTime` | `Time` |
| `Labels.OperatorReceiptRemaining` | `Remaining in drawer` |
| `Labels.Done` | `Done` (shares the id of `TemporaryPasswordDoneButton`) |
| `operatorHandInAmount(amount)` | `Hand in {amount}` (the caller passes the formatted money, e.g. `400.00 BYN`) |

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/labels.ts` - **Action:** Modify Existing File
* **File Path:** `projects/shared/src/shared/constant/point-money-messages.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**Step 1 - `labels.ts`.** Inside `class Labels`, directly below the line
`static readonly OperatorHandInCash = $localize\`Hand in cash\`;` insert:

```typescript
  static readonly OperatorHandInConfirmTitle = $localize`Hand in cash?`;
  static readonly OperatorHandInNote = $localize`Instant and cannot be cancelled — if it was a mistake, an administrator corrects it`;
  static readonly OperatorHandInConfirm = $localize`Hand in`;
  static readonly OperatorCashHandedIn = $localize`Cash handed in`;
  static readonly OperatorReceiptTime = $localize`Time`;
  static readonly OperatorReceiptRemaining = $localize`Remaining in drawer`;
  static readonly Done = $localize`Done`;
```

**Step 2 - `point-money-messages.ts`.** Append at the end of the file:

```typescript

export function operatorHandInAmount(amount: string): string {
  return $localize`Hand in ${amount}:amount:`;
}
```

Do not change any other line. `point-money-messages.ts` is already exported from `public-api.ts`.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/shared/constant/labels.ts projects/shared/src/shared/constant/point-money-messages.ts
npx ng build operator --configuration development
```
