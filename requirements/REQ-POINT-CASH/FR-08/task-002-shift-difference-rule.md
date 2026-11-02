# Task 002: `ShiftDifference` pure rule

> **Applied Skill:** `typescript-es2022` - pure static class, integer-cent arithmetic. AGENTS.md Shared Import Convention - inside `projects/shared` use relative paths (never the `@bikerental/shared` barrel).

## 1. Objective

Create the pure rule `ShiftDifference.of(counted, expected)` returning `{ kind, amount }` where `amount = counted - expected` (signed, two-decimal exact) and `kind` is `SURPLUS` (> 0), `SHORTAGE` (< 0) or `MATCHES` (= 0). Used by the closure store, confirm builder and operator receipt.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/utils/shift-difference.ts` - **Action:** Create New File
* **File Path:** `projects/shared/src/public-api.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**File 1:** `projects/shared/src/shared/utils/shift-difference.ts`, whole content:

```typescript
import { makeMoney } from '../../core/mappers/money.mapper';
import type { Money } from '../../core/models';

export type ShiftDifferenceKind = 'SURPLUS' | 'SHORTAGE' | 'MATCHES';

export interface ShiftDifferenceResult {
  readonly kind: ShiftDifferenceKind;
  readonly amount: Money;
}

const CENTS = 100;

export class ShiftDifference {
  static of(counted: Money, expected: Money): ShiftDifferenceResult {
    const cents = Math.round(counted.amount * CENTS) - Math.round(expected.amount * CENTS);
    const kind: ShiftDifferenceKind = cents > 0 ? 'SURPLUS' : cents < 0 ? 'SHORTAGE' : 'MATCHES';
    return { kind, amount: makeMoney(cents / CENTS, counted.currency) };
  }
}
```

**File 2:** `projects/shared/src/public-api.ts`. In the block `// Shared UI — utilities`, insert directly below the line `export * from './shared/utils/point-money-error.classifier';`:

```typescript
export * from './shared/utils/shift-difference';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/shared/utils/shift-difference.ts
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
npx ng lint shared
```
