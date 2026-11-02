# Task 001: Labels for the operator Cash screen

> **Applied Skill:** AGENTS.md i18n Rules - every visible string is a `Labels.*` `$localize` entry. Existing labels are reused where the English source matches: `Labels.PointShiftNone` ("No shift is running"), `Labels.PointShiftLoadFailed`, `Labels.PointCloseShift` ("Close shift"), `Labels.PointCollectionNotActiveHint`, `Labels.PointActionNotAvailableYet`, `Labels.Retry`, `Labels.NoWorkingPoint`, `pointShiftCaption()`. Only two new entries are needed. The nav "Cash" uses a `meaning` so it gets its own message id (plain `Cash` is already `Labels.PaymentMethodCash` = "Наличные", which is the wrong Russian for a nav item - the nav must read "Касса"). Same technique as `Labels.PointTabCash`.

## 1. Objective

Add `Labels.OperatorNavCash` and `Labels.OperatorHandInCash`.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/labels.ts` - **Action:** Modify Existing File

## 3. Code Implementation

* **Location:** `projects/shared/src/shared/constant/labels.ts`, inside `class Labels`, directly below the line
  `static readonly PointActionNotAvailableYet = $localize\`This action is not available yet\`;`
* **Snippet:**

```typescript
  static readonly OperatorNavCash = $localize`:Operator bottom navigation|Operator bottom navigation item:Cash`;
  static readonly OperatorHandInCash = $localize`Hand in cash`;
```

Do not change any other line.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/shared/constant/labels.ts
npx ng build operator --configuration development
```
