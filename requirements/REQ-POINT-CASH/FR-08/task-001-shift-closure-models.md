# Task 001: Shift closure domain models

> **Applied Skill:** `typescript-es2022` - readonly interfaces, no `any`. AGENTS.md "Three-Layer Data Pipeline" - components import only `core/models` domain types; generated types stay in mappers / `core/api` wrappers.

## 1. Objective

Add the command model `ShiftClosureWrite` and the result model `ShiftClosure` (UI domain types with `Date` and `Money`). The backend response is complete, so no design-time fallbacks are needed.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/models/shift-closure.model.ts` - **Action:** Create New File
* **File Path:** `projects/shared/src/core/models/index.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**File 1:** `projects/shared/src/core/models/shift-closure.model.ts`, whole content:

```typescript
import type { Money } from './transaction.model';

export interface ShiftClosureWrite {
  readonly idempotencyKey: string;
  readonly shiftId: string;
  readonly countedAmount: Money;
}

export interface ShiftClosure {
  readonly shiftId: string;
  readonly sequence: number;
  readonly openedAt: Date;
  readonly closedAt: Date;
  readonly expectedCash: Money;
  readonly countedAmount: Money;
  readonly difference: Money;
  readonly nextShiftId: string | null;
  readonly nextOpeningAmount: Money | null;
}
```

**File 2:** `projects/shared/src/core/models/index.ts`. Insert directly below the line `export * from './running-shift.model';`:

```typescript
export * from './shift-closure.model';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/models/shift-closure.model.ts
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
```

If `projects/shared/tsconfig.lib.json` does not exist, run `npx ng build admin --configuration development` instead.
