# Task 007: Shared closure presentation helpers (difference text, result rows, confirm data)

> **Applied Skill:** `angular-component` - logic outside templates in pure functions. AGENTS.md Shared Import Convention - relative imports inside `projects/shared`. Mirrors `operator-collection-confirm.ts` (`buildCollectionConfirm`) but lives in shared because the admin dialog and the operator page both use it. Requires tasks 002 and 006.

## 1. Objective

Create one file with three pure functions:

* `describeShiftDifference(difference, locale)` -> "Surplus +20.00 p." / "Shortage −20.00 p." / "Matches".
* `buildShiftClosureRows(closure, locale)` -> rows Expected cash / Counted amount / Difference / Closed at (admin result view and operator receipt).
* `buildShiftClosureConfirm(summary, locale, execute)` -> `FinanceConfirmData` with title "Close shift?", rows Shift / Expected cash / Counted amount / Difference, note "A closed shift cannot be reopened", Back / "Close shift".

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/utils/shift-closure-presentation.ts` - **Action:** Create New File
* **File Path:** `projects/shared/src/public-api.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**File 1:** `projects/shared/src/shared/utils/shift-closure-presentation.ts`, whole content:

```typescript
import { formatDate } from '@angular/common';
import { Observable } from 'rxjs';
import { makeMoney } from '../../core/mappers/money.mapper';
import type { Money, RunningShift, ShiftClosure } from '../../core/models';
import {
  type FinanceConfirmData,
  type FinanceConfirmRow,
} from '../components/finance-confirm-dialog/finance-confirm-dialog.component';
import { Labels } from '../constant/labels';
import { shiftShortageMessage, shiftSurplusMessage } from '../constant/point-money-messages';
import { formatFixedMoney } from '../pipes/fixed-money.pipe';
import { ShiftDifference, type ShiftDifferenceResult } from './shift-difference';

export interface ShiftClosureSummary {
  readonly shift: RunningShift;
  readonly counted: Money;
  readonly difference: ShiftDifferenceResult;
}

export function describeShiftDifference(difference: ShiftDifferenceResult, locale: string): string {
  const magnitude = formatFixedMoney(
    makeMoney(Math.abs(difference.amount.amount), difference.amount.currency),
    locale,
  );
  switch (difference.kind) {
    case 'SURPLUS':
      return shiftSurplusMessage(magnitude);
    case 'SHORTAGE':
      return shiftShortageMessage(magnitude);
    case 'MATCHES':
      return Labels.ShiftClosureMatches;
  }
}

export function buildShiftClosureRows(
  closure: ShiftClosure,
  locale: string,
): readonly FinanceConfirmRow[] {
  const difference = ShiftDifference.of(closure.countedAmount, closure.expectedCash);
  return [
    { label: Labels.PointShiftExpectedCash, value: formatFixedMoney(closure.expectedCash, locale) },
    { label: Labels.ShiftClosureCounted, value: formatFixedMoney(closure.countedAmount, locale) },
    { label: Labels.ShiftClosureDifference, value: describeShiftDifference(difference, locale) },
    { label: Labels.ShiftClosureClosedAt, value: formatDate(closure.closedAt, 'short', locale) },
  ];
}

export function buildShiftClosureConfirm<T>(
  summary: ShiftClosureSummary,
  locale: string,
  execute: () => Observable<T>,
): FinanceConfirmData<T> {
  return {
    title: Labels.ShiftClosureConfirmTitle,
    rows: [
      { label: Labels.ShiftClosureShiftRow, value: String(summary.shift.sequence) },
      {
        label: Labels.PointShiftExpectedCash,
        value: formatFixedMoney(summary.shift.expectedCash, locale),
      },
      { label: Labels.ShiftClosureCounted, value: formatFixedMoney(summary.counted, locale) },
      {
        label: Labels.ShiftClosureDifference,
        value: describeShiftDifference(summary.difference, locale),
      },
    ],
    note: Labels.ShiftClosureNote,
    backLabel: Labels.Back,
    confirmLabel: Labels.PointCloseShift,
    execute,
  };
}
```

**File 2:** `projects/shared/src/public-api.ts`. In the block `// Shared UI — utilities`, insert directly below the line `export * from './shared/utils/shift-difference';`:

```typescript
export * from './shared/utils/shift-closure-presentation';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/shared/utils/shift-closure-presentation.ts
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
npx ng lint shared
```
