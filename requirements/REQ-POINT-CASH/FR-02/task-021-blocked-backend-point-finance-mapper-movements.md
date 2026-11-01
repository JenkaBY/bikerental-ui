# Task 021: [BLOCKED - needs task-020] PointFinanceMapper movement page converter

> **Applied Skill:** AGENTS.md three-layer pipeline - generated types only in mappers. Design FR-02 §3 - signed amount kept as sent, running balance of the queried position, user id only, unknown kind -> `OTHER`; paging envelope via the existing `PageMapper` pattern.

## 0. Precondition

task-020 done. `PointMovementResponse` / `PagePointMovementResponse` below are placeholders - use
the generated names recorded in task-020 and adapt field accessors:

| Domain field | Expected generated field |
|---|---|
| transactionId | `r.transactionId` |
| recordedAt | `r.recordedAt` (string or Date) |
| kind | `r.kind` |
| signedAmount | `r.amount` |
| runningBalance | `r.runningBalance` |
| recordedById | `r.recordedBy` |
| customerId / rentalId / shiftId | `r.customerId` / `r.rentalId` / `r.shiftId` (optional) |
| page items / total | `page.items` / `page.totalItems` |

If `rentalId` / `shiftId` have a different type than `number` / `string` in the generated model,
change the matching field types in `PointMovement` (`core/models/point-finance.model.ts`) to the
generated types. If a required field is missing entirely, stop and report the actual shape.

## 1. Objective

Add `movementFromResponse` and `movementPageFromResponse` to `PointFinanceMapper`.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/mappers/point-finance.mapper.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** add (with the real generated names):

```typescript
import type { PagePointMovementResponse, PointMovementResponse } from '@api-models';
```

and add `PointMovement`, `PointMovementPage`, `PointMovementQuery` to the existing `import type { ... } from '../models';`.

* **Location:** inside `class PointFinanceMapper`, directly below `toMovementKind(...)`.
* **Snippet:**

```typescript
  static movementFromResponse(r: PointMovementResponse): PointMovement {
    return {
      transactionId: String(r.transactionId),
      recordedAt: new Date(r.recordedAt),
      kind: PointFinanceMapper.toMovementKind(r.kind),
      signedAmount: PointFinanceMapper.money(r.amount),
      runningBalance: PointFinanceMapper.money(r.runningBalance),
      recordedById: String(r.recordedBy),
      customerId: r.customerId ?? null,
      rentalId: r.rentalId ?? null,
      shiftId: r.shiftId ?? null,
    };
  }

  static movementPageFromResponse(
    page: PagePointMovementResponse,
    query: PointMovementQuery,
  ): PointMovementPage {
    return {
      items: (page.items ?? []).map((item) => PointFinanceMapper.movementFromResponse(item)),
      totalItems: page.totalItems ?? 0,
      pageIndex: query.page,
      pageSize: query.size,
    };
  }
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/mappers/point-finance.mapper.ts projects/shared/src/core/models/point-finance.model.ts
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
```
