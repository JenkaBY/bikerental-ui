# Task 017: [BLOCKED ON BACKEND] Extend `PointMoneyMapper` with snapshot and movement mapping

> **Applied Skill:** `angular-data-flow-orchestrator` - Phase 2: pure, side-effect-free static mapper in `core/mappers/`; ISO strings converted to `Date`; unknown enum values fall back to a UI-safe value (`OTHER`). AGENTS.md *Three-Layer Data Pipeline* - generated DTOs are consumed only by mappers and wrapper services; `makeMoney()` for amounts.

## 1. Objective

**Precondition:** Task 016 succeeded AND FR-01 Task 014 is done (`projects/shared/src/core/mappers/point-money.mapper.ts` exists with class `PointMoneyMapper`). If the file does not exist, STOP and report.

Add to the existing `PointMoneyMapper`:

* `snapshotFromResponse(r, requestedDate)` → `PointCashSnapshot` (falls back to the requested date if `businessDate` is missing/unparseable).
* `movementFromResponse(r)` → `PointMovement` (`performedBy` → `performer`; missing customer/performer → `null`; unknown `type` → `'OTHER'`).

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/mappers/point-money.mapper.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

* **Location:** Step 1 — confirm the generated model names. The snippets assume:

| Placeholder used in snippet | Meaning | How to confirm |
|---|---|---|
| `PointAccountSnapshotResponse` | body of `GET /api/finance/point-accounts/snapshot` | Task 016 Step 2 return model (Grep `generated/models` for `transferredToBankToday`) |
| `PointMovementResponse` | one element of `items` of `GET /api/finance/point-accounts/movements` | Grep `generated/models` for `bankTransferId` — the interface containing it |

  If the generated names differ, use the generated names everywhere in the snippets below. Do NOT change any other part.

* **Location:** Step 2 — in `projects/shared/src/core/mappers/point-money.mapper.ts`, extend the existing first line `import type { ... } from '@api-models';` by adding `PointAccountSnapshotResponse` and `PointMovementResponse` to its braces (keep alphabetical order). Extend the existing `import type { ... } from '../models';` line by adding `PointCashSnapshot`, `PointMovement`, `PointMovementType`. Then add this NEW import line directly below the existing `import { makeMoney } from './money.mapper';` line:

```typescript
import { parseDate } from '../../shared/utils/date.util';
```

**Code to Add/Replace:**

* **Location:** Step 3 — directly ABOVE the line `export class PointMoneyMapper {` (leave one blank line after the snippet):
* **Snippet:**

```typescript
const KNOWN_MOVEMENT_TYPES: readonly string[] = [
  'RENTAL_PAYMENT',
  'CUSTOMER_DEPOSIT',
  'CUSTOMER_PAYOUT',
  'BANK_TRANSFER',
  'BANK_TRANSFER_CANCELLED',
  'ADJUSTMENT',
];

function toMovementType(value: string): PointMovementType {
  return KNOWN_MOVEMENT_TYPES.includes(value) ? (value as PointMovementType) : 'OTHER';
}
```

* **Location:** Step 4 — inside `class PointMoneyMapper`, directly above its final closing `}` (after the last existing static method, one blank line before):
* **Snippet:**

```typescript
  static snapshotFromResponse(
    r: PointAccountSnapshotResponse,
    requestedDate: Date,
  ): PointCashSnapshot {
    return {
      pointSlug: r.pointSlug,
      pointStatus: r.pointStatus,
      businessDate: parseDate(r.businessDate) ?? requestedDate,
      cash: {
        balance: makeMoney(r.cash.balance),
        openingBalance: makeMoney(r.cash.openingBalance),
        receivedToday: makeMoney(r.cash.receivedToday),
        paidOutToday: makeMoney(r.cash.paidOutToday),
        transferredToBankToday: makeMoney(r.cash.transferredToBankToday),
      },
      terminal: { balance: makeMoney(r.terminal.balance) },
    };
  }

  static movementFromResponse(r: PointMovementResponse): PointMovement {
    return {
      id: r.id,
      occurredAt: new Date(r.occurredAt),
      account: r.account,
      type: toMovementType(r.type),
      customer: r.customer ? { id: r.customer.id, displayName: r.customer.displayName } : null,
      performer: r.performedBy
        ? { userId: r.performedBy.userId, displayName: r.performedBy.displayName }
        : null,
      signedAmount: makeMoney(r.signedAmount),
      balanceAfter: makeMoney(r.balanceAfter),
      transactionId: r.transactionId ?? null,
      bankTransferId: r.bankTransferId ?? null,
    };
  }
```

* **Location:** Step 5 — only if the build in section 4 reports type errors in these two methods, apply exactly the matching fix and nothing else:
  * a numeric field possibly `undefined` → append `?? 0` to that `r....` expression;
  * `r.cash` / `r.terminal` possibly `undefined` → use `r.cash?.balance ?? 0` style for each of its fields;
  * `r.id`, `r.pointSlug`, `r.occurredAt`, `r.type` possibly `undefined` → append `?? ''`;
  * `r.pointStatus` not assignable to `PointStatus` → write `r.pointStatus as PointStatus` and add `PointStatus` to the `../models` type import;
  * `r.account` not assignable to `PointAccountType` → write `r.account as PointAccountType` and add `PointAccountType` to the `../models` type import;
  * a `displayName` / `userId` possibly `undefined` → append `?? ''`.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/mappers/point-money.mapper.ts
npx ng build admin --configuration development
npx ng lint shared
```
