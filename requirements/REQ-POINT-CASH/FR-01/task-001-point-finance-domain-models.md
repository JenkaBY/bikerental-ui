# Task 001: Point finance domain models

> **Applied Skill:** `typescript-es2022` - readonly domain interfaces, `as const` vocabularies with derived union types, no `any`. AGENTS.md three-layer pipeline - `core/models/` holds the only types components import.

## 1. Objective

Create the shared point-finance domain vocabulary used by every REQ-POINT-CASH FR: position kinds,
per-point positions, the business-wide positions overview, a period value, period results, and the
two UI view models of the points list (row + summary cards). FR-02 extends this same file.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/models/point-finance.model.ts`
* **Action:** Create New File

* **File Path:** `projects/shared/src/core/models/index.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** (included in the snippet below)

**Code to Add/Replace:**

* **Location:** New file `projects/shared/src/core/models/point-finance.model.ts` - full content.
* **Snippet:**

```typescript
import type { PointStatus } from './point.model';
import type { Money } from './transaction.model';

export const POINT_POSITION_KINDS = [
  'CASH',
  'CARD_TERMINAL',
  'BANK',
  'REVENUE',
  'CORRECTIONS',
] as const;

export type PointPositionKind = (typeof POINT_POSITION_KINDS)[number];

export type PointPositionAmounts = Readonly<Record<PointPositionKind, Money>>;

export interface PointPositions {
  readonly pointSlug: string;
  readonly amounts: PointPositionAmounts;
  readonly pointStatus: PointStatus | null;
}

export interface PointPositionsOverview {
  readonly points: readonly PointPositions[];
  readonly totals: PointPositionAmounts;
}

export interface PointPeriod {
  readonly from: Date;
  readonly to: Date;
}

export interface PointPeriodResults {
  readonly from: Date;
  readonly to: Date;
  readonly pointSlug: string | null;
  readonly collected: Money;
  readonly terminalSettled: Money;
  readonly total: Money;
}

export interface PointMoneyRow {
  readonly slug: string;
  readonly name: string;
  readonly status: PointStatus;
  readonly cash: Money | null;
  readonly terminal: Money | null;
}

export interface PointMoneySummary {
  readonly cash: Money | null;
  readonly terminal: Money | null;
  readonly deposited: Money | null;
  readonly collected: Money | null;
  readonly terminalSettled: Money | null;
  readonly monthName: string;
}
```

* **Location:** `projects/shared/src/core/models/index.ts` - add one line directly below the existing line `export * from './point.model';`
* **Snippet:**

```typescript
export * from './point-finance.model';
```

Rules encoded here (do not change):
* `PointPeriodResults.total` is filled by the mapper: the backend total when the backend sends one,
  otherwise `collected + terminalSettled` (design FR-01 §3, [GAP]).
* `null` money in `PointMoneyRow` / `PointMoneySummary` means "unknown" and is rendered as an
  em-dash; never replace it with zero.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/models/point-finance.model.ts projects/shared/src/core/models/index.ts
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
```
