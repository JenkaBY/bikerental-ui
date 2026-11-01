# Task 002: PointFinanceMapper.runningShiftFromResponse

> **Applied Skill:** AGENTS.md Three-Layer Data Pipeline - generated `RunningShiftResponse` / `Movement` types are used only in `core/mappers/`; the mapper is a pure static class. `typescript-es2022`. Design FR-03 section 3 - `movements[{type, amount}]` is grouped by kind and summed in the mapper (backend order kept); `expectedCash` is taken from the backend and never computed.

## 1. Objective

Convert the `GET /api/finance/shifts/current` body into the `RunningShift` domain model. The
generated `Movement.type` is `DEPOSIT | PAYOUT | COLLECTION | OTHER`; `PAYOUT` is the withdrawal
and maps to the domain kind `WITHDRAWAL`, the others map by name. Kinds whose summed total is 0
are dropped (the breakdown shows only kinds that moved cash).

Requires task-001.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/mappers/point-finance.mapper.ts` - **Action:** Modify Existing File

## 3. Code Implementation

* **Location:** top import block. Replace

```typescript
import type {
  PagePointMovementResponse,
  PointFigureResponse,
  PointLedgerResponse,
  PointMovementResponse,
  PointPositionsResponse,
  PositionTotal,
} from '@api-models';
```

with

```typescript
import type {
  Movement,
  PagePointMovementResponse,
  PointFigureResponse,
  PointLedgerResponse,
  PointMovementResponse,
  PointPositionsResponse,
  PositionTotal,
  RunningShiftResponse,
} from '@api-models';
```

* **Location:** in the `import type { Money, PointMovement, ... } from '../models';` block add `RunningShift,` as the last name (after `PointPositionsOverview,`).

* **Location:** inside `class PointFinanceMapper`, directly above `static toPositionKind(`.
* **Snippet:**

```typescript
  static runningShiftFromResponse(r: RunningShiftResponse): RunningShift {
    const totals = new Map<PointMovementKind, number>();
    for (const movement of r.movements ?? []) {
      const kind = PointFinanceMapper.shiftMovementKind(movement.type);
      totals.set(kind, (totals.get(kind) ?? 0) + movement.amount);
    }
    return {
      shiftId: r.shiftId,
      pointSlug: r.pointSlug,
      sequence: r.sequence,
      openedAt: new Date(r.openedAt),
      openingAmount: PointFinanceMapper.money(r.openingAmount),
      kindTotals: [...totals]
        .filter(([, amount]) => PointFinanceMapper.round(amount) !== 0)
        .map(([kind, amount]) => ({ kind, signedAmount: PointFinanceMapper.money(amount) })),
      expectedCash: PointFinanceMapper.money(r.expectedCash),
    };
  }

```

* **Location:** inside the class, directly above `private static entriesOf(`.
* **Snippet:**

```typescript
  private static shiftMovementKind(type: Movement['type']): PointMovementKind {
    return type === 'PAYOUT' ? 'WITHDRAWAL' : PointFinanceMapper.toMovementKind(type);
  }

```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/mappers/point-finance.mapper.ts
npx ng build admin --configuration development
npx ng lint shared
```
