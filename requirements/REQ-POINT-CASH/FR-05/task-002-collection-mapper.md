# Task 002: PointFinanceMapper - cash collection request and response converters

> **Applied Skill:** AGENTS.md "Three-Layer Data Pipeline" - generated `CollectionRequest` / `CollectionResponse` are consumed only by `core/mappers/`; mappers are pure static methods. `typescript-es2022`.

## 1. Objective

Add `collectionToRequest` and `collectionFromResponse` to `PointFinanceMapper`. The generated `CollectionResponse` also carries `shiftId`; it is intentionally not mapped (no UI consumer).

Requires task 001.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/mappers/point-finance.mapper.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

* In the `import type { ... } from '@api-models';` list add `CollectionRequest,` and `CollectionResponse,` (keep alphabetical order: before `Movement,`).
* In the `import type { ... } from '../models';` list (the one containing `Money`) add `CashCollection,` and `CashCollectionWrite,` (before `Money,`).

**Code to Add/Replace:**

* **Location:** inside `class PointFinanceMapper`, directly after the `runningShiftFromResponse` method and before `static toPositionKind(...)`.
* **Snippet:**

```typescript
  static collectionToRequest(write: CashCollectionWrite): CollectionRequest {
    return { idempotencyKey: write.idempotencyKey, amount: write.amount };
  }

  static collectionFromResponse(r: CollectionResponse): CashCollection {
    return {
      transactionId: r.transactionId,
      pointSlug: r.pointSlug,
      amount: PointFinanceMapper.money(r.amount),
      cashPosition: PointFinanceMapper.money(r.cashPosition),
      recordedAt: new Date(r.recordedAt),
    };
  }
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/mappers/point-finance.mapper.ts
npx ng build admin --configuration development
```
