# Task 001: Domain models for cash collection and terminal settlement

> **Applied Skill:** `typescript-es2022` - readonly interfaces, string-literal union instead of enum. AGENTS.md "Three-Layer Data Pipeline" - `core/models/` holds the clean UI types; components import only these.

## 1. Objective

Create the write and result models of the two money-out commands plus the `PointMoneyOperation` union. The settlement models are plain domain types and need no generated code, so they are created now; only the settlement HTTP/mapper work is blocked (tasks 017-020).

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/models/point-money-move.model.ts` - **Action:** Create New File
* **File Path:** `projects/shared/src/core/models/index.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**File 1 - `projects/shared/src/core/models/point-money-move.model.ts` (whole content):**

```typescript
import type { Money } from './transaction.model';

export type PointMoneyOperation = 'COLLECTION' | 'SETTLEMENT';

export interface CashCollectionWrite {
  readonly idempotencyKey: string;
  readonly amount: number;
}

export interface CashCollection {
  readonly transactionId: string;
  readonly pointSlug: string;
  readonly amount: Money;
  readonly cashPosition: Money;
  readonly recordedAt: Date;
}

export interface TerminalSettlementWrite {
  readonly idempotencyKey: string;
  readonly amount: number;
  readonly settlementDate: Date;
}

export interface TerminalSettlement {
  readonly transactionId: string;
  readonly pointSlug: string;
  readonly amount: Money;
  readonly settlementDate: Date;
  readonly cardTerminalPosition: Money | null;
  readonly recordedAt: Date;
}
```

**File 2 - `projects/shared/src/core/models/index.ts`:** add this line directly below `export * from './point-finance.model';`:

```typescript
export * from './point-money-move.model';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/models/point-money-move.model.ts projects/shared/src/core/models/index.ts
npx ng build admin --configuration development
```
