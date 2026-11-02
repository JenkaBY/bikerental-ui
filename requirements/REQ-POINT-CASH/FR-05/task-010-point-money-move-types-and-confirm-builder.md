# Task 010: Admin money-move types, operation meta and confirmation builder

> **Applied Skill:** `typescript-es2022` - readonly interfaces, `Record` lookup maps instead of `if` chains. `angular-component` - plain files next to the dialog, no component yet. AGENTS.md "Shared Import Convention" - the admin project imports shared symbols only from `@bikerental/shared`, one barrel import line per file.

## 1. Objective

Create three small admin files used by the store (task 011), the dialog (task 012), the launcher (task 013) and the cash tab (task 014):

* the dialog data / result contract;
* per-operation lookup maps (title, confirmation title, source label, affected position);
* a pure builder of the `FinanceConfirmData` (rows Amount, From, To, [Settlement date], Remaining + the cannot-be-cancelled note).

Requires tasks 001, 008, 009.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/point-money-move.model.ts` - **Action:** Create New File
* **File Path:** `projects/admin/src/app/points/point-money-move.meta.ts` - **Action:** Create New File
* **File Path:** `projects/admin/src/app/points/point-money-move-confirm.ts` - **Action:** Create New File

## 3. Code Implementation

**File 1 - `point-money-move.model.ts` (whole content):**

```typescript
import type { Money, PointMoneyOperation } from '@bikerental/shared';

export interface PointMoneyMoveData {
  readonly operation: PointMoneyOperation;
  readonly pointSlug: string;
  readonly pointName: string;
  readonly available: Money;
}

export interface PointMoneyMoveOutcome {
  readonly amount: Money;
  readonly newPosition: Money | null;
}

export type PointMoneyMoveResult =
  | {
      readonly outcome: 'done';
      readonly operation: PointMoneyOperation;
      readonly amount: Money;
      readonly newPosition: Money | null;
    }
  | { readonly outcome: 'statusChanged' };
```

**File 2 - `point-money-move.meta.ts` (whole content):**

```typescript
import { Labels, type PointMoneyOperation, type PointPositionKind } from '@bikerental/shared';

export const POINT_MOVE_TITLES: Record<PointMoneyOperation, string> = {
  COLLECTION: Labels.PointCollectCash,
  SETTLEMENT: Labels.PointRecordSettlement,
};

export const POINT_MOVE_CONFIRM_TITLES: Record<PointMoneyOperation, string> = {
  COLLECTION: Labels.PointMoveConfirmCollectionTitle,
  SETTLEMENT: Labels.PointMoveConfirmSettlementTitle,
};

export const POINT_MOVE_SOURCE_LABELS: Record<PointMoneyOperation, string> = {
  COLLECTION: Labels.PointCashCardTitle,
  SETTLEMENT: Labels.PointTerminalCardTitle,
};

export const POINT_MOVE_POSITIONS: Record<PointMoneyOperation, PointPositionKind> = {
  COLLECTION: 'CASH',
  SETTLEMENT: 'CARD_TERMINAL',
};
```

**File 3 - `point-money-move-confirm.ts` (whole content):**

```typescript
import { Observable } from 'rxjs';
import {
  type FinanceConfirmData,
  formatFixedMoney,
  Labels,
  type Money,
  type PointMoneyOperation,
} from '@bikerental/shared';
import { POINT_MOVE_CONFIRM_TITLES, POINT_MOVE_SOURCE_LABELS } from './point-money-move.meta';

export interface PointMoneyMoveSummary {
  readonly operation: PointMoneyOperation;
  readonly pointName: string;
  readonly amount: Money;
  readonly remaining: Money;
  readonly settlementDate: string | null;
}

export function buildMoveConfirmData<T>(
  summary: PointMoneyMoveSummary,
  locale: string,
  execute: () => Observable<T>,
): FinanceConfirmData<T> {
  const source = POINT_MOVE_SOURCE_LABELS[summary.operation];
  const dateRows = summary.settlementDate
    ? [{ label: Labels.PointMoveSettlementDate, value: summary.settlementDate }]
    : [];
  return {
    title: POINT_MOVE_CONFIRM_TITLES[summary.operation],
    rows: [
      { label: Labels.PointMoveAmount, value: formatFixedMoney(summary.amount, locale) },
      { label: Labels.PointMoveSourceLabel, value: `${summary.pointName} · ${source}` },
      { label: Labels.PointMoveDestinationLabel, value: Labels.PointMoveBankAccount },
      ...dateRows,
      { label: Labels.PointMoveRemainingRow, value: formatFixedMoney(summary.remaining, locale) },
    ],
    note: Labels.PointMoveNote,
    backLabel: Labels.Back,
    confirmLabel: Labels.PointMoveConfirm,
    execute,
  };
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/admin/src/app/points/point-money-move.model.ts projects/admin/src/app/points/point-money-move.meta.ts projects/admin/src/app/points/point-money-move-confirm.ts
npx ng build admin --configuration development
npx ng lint admin
```
