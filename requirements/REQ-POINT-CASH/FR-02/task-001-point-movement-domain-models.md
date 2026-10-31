# Task 001: Point movement domain models (extend point-finance.model.ts)

> **Applied Skill:** `typescript-es2022` - readonly interfaces, `as const` vocabularies, derived unions. AGENTS.md three-layer pipeline. Design FR-02 §3 - movement kinds per backend contract (8 kinds + UI fallback `OTHER`, no "transfer cancelled"), single position per query (A8), customer id only (A10), page size <= 100, period <= 366 days.

## 1. Objective

Extend the FR-01 shared model file (do NOT create a second model file) with the movement
vocabulary, the movement / page / query / row models, the period-violation union and the two
limits used by the store, the rule and the service. `PointPeriod` already exists (FR-01 task-001)
and is reused.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/models/point-finance.model.ts`
* **Action:** Modify Existing File (append)

## 3. Code Implementation

**Imports Required:** none new (the file already imports `PointStatus` and `Money`).

**Code to Add/Replace:**

* **Location:** at the end of `projects/shared/src/core/models/point-finance.model.ts`, after the `PointMoneySummary` interface.
* **Snippet:**

```typescript
export const POINT_MOVEMENT_KINDS = [
  'DEPOSIT',
  'WITHDRAWAL',
  'CAPTURE',
  'PENALTY',
  'ADJUSTMENT',
  'COLLECTION',
  'TERMINAL_SETTLEMENT',
  'SHIFT_DISCREPANCY',
  'OTHER',
] as const;

export type PointMovementKind = (typeof POINT_MOVEMENT_KINDS)[number];

export type PointMovementPosition = Extract<PointPositionKind, 'CASH' | 'CARD_TERMINAL' | 'BANK'>;

export const POINT_MOVEMENT_POSITIONS: readonly PointMovementPosition[] = [
  'CASH',
  'CARD_TERMINAL',
  'BANK',
];

export type PointMovementOrder = 'newest' | 'oldest';

export const POINT_MOVEMENTS_MAX_PAGE_SIZE = 100;

export const POINT_PERIOD_MAX_DAYS = 366;

export type PointPeriodViolation = 'REQUIRED' | 'ORDER' | 'TOO_LONG';

export interface PointMovement {
  readonly transactionId: string;
  readonly recordedAt: Date;
  readonly kind: PointMovementKind;
  readonly signedAmount: Money;
  readonly runningBalance: Money;
  readonly recordedById: string;
  readonly customerId: string | null;
  readonly rentalId: number | null;
  readonly shiftId: string | null;
}

export interface PointMovementPage {
  readonly items: readonly PointMovement[];
  readonly totalItems: number;
  readonly pageIndex: number;
  readonly pageSize: number;
}

export interface PointMovementQuery {
  readonly pointSlug: string;
  readonly position: PointMovementPosition;
  readonly period: PointPeriod;
  readonly order: PointMovementOrder;
  readonly page: number;
  readonly size: number;
}

export interface PointMovementRow extends PointMovement {
  readonly recordedByName: string;
}
```

`PointPositionKind` and `PointPeriod` are declared earlier in the same file - no import needed.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/models/point-finance.model.ts
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
```
