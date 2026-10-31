# Task 001: Point cash snapshot and point movement domain models

> **Applied Skill:** `angular-data-flow-orchestrator` - Phase 1: clean UI domain models live in `core/models/` with `Date` fields; components import only these, never generated types. `typescript-es2022` - strict typing, string-literal unions instead of enums, no `any`.

## 1. Objective

Extend the point-money vocabulary created by FR-01 Task 001 with the FR-02 read models: `PointCashSnapshot` (current CASH / CARD_TERMINAL balances plus today's CASH breakdown and fresh point status), `PointMovement` with `PointMovementType`, and the query/page shapes used by `PointMovementsStore`. FR-03 to FR-07 reuse these. No generated types are referenced, so this task is NOT blocked on the backend.

**Precondition:** FR-01 Task 001 is done (`projects/shared/src/core/models/point-money.model.ts` exists and is exported from `projects/shared/src/core/models/index.ts`). If the file does not exist, STOP and report failure.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/models/point-money.model.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** none. The file already imports `PointStatus` from `./point.model` and `Money` from `./transaction.model` (FR-01 Task 001); both are used by the new types.

**Code to Add/Replace:**

* **Location:** At the very end of `projects/shared/src/core/models/point-money.model.ts`, directly below the closing `}` of `export interface PointMoneyRow { ... }` (leave one blank line between them).
* **Snippet:**

```typescript
export type PointMovementType =
  | 'RENTAL_PAYMENT'
  | 'CUSTOMER_DEPOSIT'
  | 'CUSTOMER_PAYOUT'
  | 'BANK_TRANSFER'
  | 'BANK_TRANSFER_CANCELLED'
  | 'ADJUSTMENT'
  | 'OTHER';

export interface PointCashBreakdown {
  balance: Money;
  openingBalance: Money;
  receivedToday: Money;
  paidOutToday: Money;
  transferredToBankToday: Money;
}

export interface PointTerminalBalance {
  balance: Money;
}

export interface PointCashSnapshot {
  pointSlug: string;
  pointStatus: PointStatus;
  businessDate: Date;
  cash: PointCashBreakdown;
  terminal: PointTerminalBalance;
}

export interface PointMovementCustomer {
  id: string;
  displayName: string;
}

export interface PointMovementPerformer {
  userId: string;
  displayName: string;
}

export interface PointMovement {
  id: string;
  occurredAt: Date;
  account: PointAccountType;
  type: PointMovementType;
  customer: PointMovementCustomer | null;
  performer: PointMovementPerformer | null;
  signedAmount: Money;
  balanceAfter: Money;
  transactionId: string | null;
  bankTransferId: string | null;
}

export interface PointMovementQuery {
  pointSlug: string | null;
  accounts: PointAccountType[];
  fromDate: Date | null;
  toDate: Date | null;
  page: number;
  size: number;
}

export interface PointMovementPage {
  items: PointMovement[];
  total: number;
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/models/point-money.model.ts
npx ng build admin --configuration development
npx ng lint shared
```
