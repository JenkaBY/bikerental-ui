# Task 003: Shift closure mapper methods

> **Applied Skill:** AGENTS.md "Three-Layer Data Pipeline" - pure static mapper methods `toRequest` / `fromResponse`; generated types imported only here via the `@api-models` alias. `typescript-es2022`.

## 1. Objective

Extend `PointFinanceMapper` with `closureToRequest(write)` and `closureFromResponse(response)`. `closedBy` (a user id) is deliberately not mapped. The response is complete, so every field comes from it.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/mappers/point-finance.mapper.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**Step 1 - generated type imports.** In the `import type { ... } from '@api-models';` block add (keep alphabetical order, `prettier` fixes the rest):

```typescript
  CloseShiftRequest,
  NextShift,
  ShiftClosureResponse,
```

**Step 2 - domain type imports.** In the `import type { ... } from '../models';` block (second one, the one that already lists `CashCollection`) add:

```typescript
  ShiftClosure,
  ShiftClosureWrite,
```

**Step 3 - methods.** Insert directly below the method `collectionFromResponse(...)` (before `static toPositionKind`):

```typescript
  static closureToRequest(write: ShiftClosureWrite): CloseShiftRequest {
    return {
      idempotencyKey: write.idempotencyKey,
      shiftId: write.shiftId,
      countedAmount: write.countedAmount.amount,
    };
  }

  static closureFromResponse(r: ShiftClosureResponse): ShiftClosure {
    const next: NextShift | undefined = r.nextShift;
    return {
      shiftId: r.shift.shiftId,
      sequence: r.shift.sequence,
      openedAt: new Date(r.shift.openedAt),
      closedAt: new Date(r.shift.closedAt),
      expectedCash: PointFinanceMapper.money(r.shift.expectedAmount),
      countedAmount: PointFinanceMapper.money(r.shift.countedAmount),
      difference: PointFinanceMapper.money(r.shift.discrepancy),
      nextShiftId: next?.shiftId ?? null,
      nextOpeningAmount: next ? PointFinanceMapper.money(next.openingAmount) : null,
    };
  }
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/mappers/point-finance.mapper.ts
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
npx ng lint shared
```
