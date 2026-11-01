# Task 005: Confirmation dialog data builder for the operator collection

> **Applied Skill:** `angular-component` (pure helper, no DI), AGENTS.md i18n Rules - all strings from `Labels.*` (task 002 + existing). Mirrors `projects/admin/src/app/points/point-money-move-confirm.ts` for the COLLECTION case only (no settlement-date row). Requires task 002.

## 1. Objective

`buildCollectionConfirm(summary, locale, execute)` returns `FinanceConfirmData<T>` for `FinanceConfirmDialogComponent`: title `Hand in cash?`; rows Amount / From (`{point} · Cash drawer`) / To (`Bank account`) / Remaining; the operator note; Back / `Hand in`.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/cash/operator-collection-confirm.ts` - **Action:** Create New File

## 3. Code Implementation

* **Location:** new file, whole content:

```typescript
import { Observable } from 'rxjs';
import { type FinanceConfirmData, formatFixedMoney, Labels, type Money } from '@bikerental/shared';

export interface OperatorCollectionSummary {
  readonly pointName: string;
  readonly amount: Money;
  readonly remaining: Money;
}

export function buildCollectionConfirm<T>(
  summary: OperatorCollectionSummary,
  locale: string,
  execute: () => Observable<T>,
): FinanceConfirmData<T> {
  return {
    title: Labels.OperatorHandInConfirmTitle,
    rows: [
      { label: Labels.PointMoveAmount, value: formatFixedMoney(summary.amount, locale) },
      {
        label: Labels.PointMoveSourceLabel,
        value: `${summary.pointName} · ${Labels.PointCashCardTitle}`,
      },
      { label: Labels.PointMoveDestinationLabel, value: Labels.PointMoveBankAccount },
      { label: Labels.PointMoveRemainingRow, value: formatFixedMoney(summary.remaining, locale) },
    ],
    note: Labels.OperatorHandInNote,
    backLabel: Labels.Back,
    confirmLabel: Labels.OperatorHandInConfirm,
    execute,
  };
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/operator/src/app/cash/operator-collection-confirm.ts
npx ng build operator --configuration development
npx ng lint operator
```
