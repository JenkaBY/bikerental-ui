# Task 001: Point money domain models

> **Applied Skill:** `angular-data-flow-orchestrator` - Phase 1: clean UI domain models live in `core/models/` with `Date` fields; components import only these. `typescript-es2022` - strict typing, `readonly`-friendly interfaces, no `any`.

## 1. Objective

Create the shared point-money domain vocabulary that FR-01 (and later FR-02..FR-07) build on: `PointAccountType`, `PointBalances`, `BankTransferMonthSummary`, `BusinessMonthRange` and the `PointMoneyRow` view model. No generated types are referenced, so this task is NOT blocked on the backend.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/models/point-money.model.ts`
* **Action:** Create New File

* **File Path:** `projects/shared/src/core/models/index.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** (already contained in the snippet below)

```typescript
import type { PointStatus } from './point.model';
import type { Money } from './transaction.model';
```

**Code to Add/Replace:**

* **Location:** Whole content of the NEW file `projects/shared/src/core/models/point-money.model.ts`
* **Snippet:**

```typescript
import type { PointStatus } from './point.model';
import type { Money } from './transaction.model';

export type PointAccountType = 'CASH' | 'CARD_TERMINAL';

export interface PointTransferRef {
  transferredAt: Date;
  performerName: string;
}

export interface PointBalances {
  pointSlug: string;
  cash: Money;
  terminal: Money;
  lastCompletedTransfer: PointTransferRef | null;
}

export interface BusinessMonthRange {
  from: Date;
  to: Date;
}

export interface BankTransferMonthSummary {
  from: Date;
  to: Date;
  completedAmount: Money;
  completedCount: number;
}

export interface PointMoneyRow {
  slug: string;
  name: string;
  status: PointStatus;
  cash: Money | null;
  terminal: Money | null;
  lastTransfer: PointTransferRef | null;
}
```

* **Location:** `projects/shared/src/core/models/index.ts` — add a new line at the very end of the file, directly below `export * from './returnable-rental.model';`
* **Snippet:**

```typescript
export * from './point-money.model';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx ng build admin --configuration development
npx ng lint shared
```
