# Task 001: RunningShift, RunningShiftState and ActionAvailability domain models

> **Applied Skill:** `typescript-es2022` - readonly interfaces, string-literal unions, no `any`. AGENTS.md Three-Layer Data Pipeline - components import only `core/models/` types, never `RunningShiftResponse`. Reuses `Money` (`transaction.model.ts`) and `PointMovementKind` (`point-finance.model.ts`) from FR-01/FR-02.

## 1. Objective

Create the UI domain types for the running shift (the point's open cash shift), its load state, and
the pure "is this money button usable" result, so the mapper, store, availability rules and
components added by the following tasks share one definition.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/models/running-shift.model.ts` - **Action:** Create New File
* **File Path:** `projects/shared/src/core/models/index.ts` - **Action:** Modify Existing File

## 3. Code Implementation

* **Location:** New file `projects/shared/src/core/models/running-shift.model.ts` - full content.
* **Snippet:**

```typescript
import type { PointMovementKind } from './point-finance.model';
import type { Money } from './transaction.model';

export interface RunningShiftKindTotal {
  readonly kind: PointMovementKind;
  readonly signedAmount: Money;
}

export interface RunningShift {
  readonly shiftId: string;
  readonly pointSlug: string;
  readonly sequence: number;
  readonly openedAt: Date;
  readonly openingAmount: Money;
  readonly kindTotals: readonly RunningShiftKindTotal[];
  readonly expectedCash: Money;
}

export type RunningShiftState = 'loading' | 'running' | 'none' | 'failed';

export type ActionUnavailableReason =
  | 'POINT_NOT_ACTIVE'
  | 'POINT_PERMANENTLY_CLOSED'
  | 'NOTHING_TO_MOVE'
  | 'UNKNOWN'
  | 'HIDDEN';

export interface ActionAvailability {
  readonly enabled: boolean;
  readonly reason: ActionUnavailableReason | null;
}
```

* **Location:** `projects/shared/src/core/models/index.ts` - add one line directly below `export * from './point-finance.model';`
* **Snippet:**

```typescript
export * from './running-shift.model';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/models/running-shift.model.ts projects/shared/src/core/models/index.ts
npx ng build admin --configuration development
npx ng lint shared
```
