# Task 012: `SHIFT_CLOSURE` finance receipt kind and operator receipt view

> **Applied Skill:** `typescript-es2022` - discriminated union with an exhaustive `switch` (no `default`, so a missing kind fails the build). `angular-component` - the receipt component stays dumb; all copy is built in `finance-receipt.view.ts`. Requires tasks 001, 006, 007.

## 1. Objective

* Extend the `FinanceReceipt` union with `{ kind: 'SHIFT_CLOSURE'; pointName; closure }`.
* Extend `buildReceiptView` with the `SHIFT_CLOSURE` case: title "Shift {n} closed", rows Rental point (when the point name is known) / Expected cash / Counted amount / Difference / Closed at. The big amount line is not used for closures, so `FinanceReceiptView.amount` becomes `Money | null` and the template renders it only when present.
* "Done" already navigates to `/cash` with `replaceUrl` - unchanged.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/models/finance-receipt.model.ts` - **Action:** Modify Existing File
* **File Path:** `projects/operator/src/app/cash/finance-receipt.view.ts` - **Action:** Modify Existing File
* **File Path:** `projects/operator/src/app/cash/operator-finance-receipt.component.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**File 1:** `projects/shared/src/core/models/finance-receipt.model.ts`, whole new content:

```typescript
import type { CashCollection } from './point-money-move.model';
import type { ShiftClosure } from './shift-closure.model';

export interface CollectionReceipt {
  readonly kind: 'COLLECTION';
  readonly pointName: string;
  readonly collection: CashCollection;
}

export interface ShiftClosureReceipt {
  readonly kind: 'SHIFT_CLOSURE';
  readonly pointName: string;
  readonly closure: ShiftClosure;
}

export type FinanceReceipt = CollectionReceipt | ShiftClosureReceipt;
```

**File 2:** `projects/operator/src/app/cash/finance-receipt.view.ts`

* Replace the import line `import { type FinanceReceipt, formatFixedMoney, Labels, type Money } from '@bikerental/shared';` with:

```typescript
import {
  buildShiftClosureRows,
  type FinanceReceipt,
  formatFixedMoney,
  Labels,
  type Money,
  shiftClosedTitle,
} from '@bikerental/shared';
```

* In the interface `FinanceReceiptView` change `readonly amount: Money;` to:

```typescript
  readonly amount: Money | null;
```

* In `buildReceiptView`, directly after the closing `}` of `case 'COLLECTION': { ... }` (and before the closing `}` of the `switch`) add:

```typescript
    case 'SHIFT_CLOSURE': {
      const { closure, pointName } = receipt;
      const pointRows = pointName ? [{ label: Labels.MoneyPointLabel, value: pointName }] : [];
      return {
        title: shiftClosedTitle(closure.sequence),
        amount: null,
        rows: [...pointRows, ...buildShiftClosureRows(closure, locale)],
      };
    }
```

**File 3:** `projects/operator/src/app/cash/operator-finance-receipt.component.ts`. In the template replace the line

```html
        <div class="text-3xl font-semibold tabular-nums">{{ receipt.amount | fixedMoney }}</div>
```

with:

```html
        @if (receipt.amount) {
          <div class="text-3xl font-semibold tabular-nums">{{ receipt.amount | fixedMoney }}</div>
        }
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/models/finance-receipt.model.ts projects/operator/src/app/cash/finance-receipt.view.ts projects/operator/src/app/cash/operator-finance-receipt.component.ts
npx ng build operator --configuration development
npx ng lint operator
```
