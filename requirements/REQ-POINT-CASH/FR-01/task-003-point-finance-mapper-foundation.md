# Task 003: PointFinanceMapper foundation (kind normalization and money helpers)

> **Applied Skill:** AGENTS.md three-layer pipeline - mappers are pure static classes in `core/mappers/`. `typescript-es2022` - no casts to `any`, exhaustive object literals. Design FR-01 §2 - unknown position kinds map to a safe fallback instead of failing.

## 1. Objective

Create `PointFinanceMapper` with the parts that do not depend on the not-yet-generated backend
types: normalizing a raw position-kind string, folding `{ kind, amount }` entries into a full
`PointPositionAmounts` map (missing kind = 0, unknown kind ignored), and two-decimal money helpers.
The response converters (`positionsOverviewFromResponse`, `periodResultsFromResponse`) are added by
the blocked task `task-018-blocked-backend-point-finance-mapper-positions-results.md`.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/mappers/point-finance.mapper.ts`
* **Action:** Create New File

* **File Path:** `projects/shared/src/core/mappers/index.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** (included in the snippet below)

**Code to Add/Replace:**

* **Location:** New file `projects/shared/src/core/mappers/point-finance.mapper.ts` - full content.
* **Snippet:**

```typescript
import { POINT_POSITION_KINDS } from '../models';
import type { Money, PointPositionAmounts, PointPositionKind } from '../models';
import { makeMoney } from './money.mapper';

export interface PointPositionEntry {
  readonly kind: string;
  readonly amount: number;
}

export class PointFinanceMapper {
  static toPositionKind(raw: string | null | undefined): PointPositionKind | null {
    return POINT_POSITION_KINDS.find((kind) => kind === raw) ?? null;
  }

  static toAmounts(entries: readonly PointPositionEntry[]): PointPositionAmounts {
    const totals = new Map<PointPositionKind, number>();
    for (const entry of entries) {
      const kind = PointFinanceMapper.toPositionKind(entry.kind);
      if (kind) totals.set(kind, (totals.get(kind) ?? 0) + entry.amount);
    }
    return {
      CASH: PointFinanceMapper.money(totals.get('CASH')),
      CARD_TERMINAL: PointFinanceMapper.money(totals.get('CARD_TERMINAL')),
      BANK: PointFinanceMapper.money(totals.get('BANK')),
      REVENUE: PointFinanceMapper.money(totals.get('REVENUE')),
      CORRECTIONS: PointFinanceMapper.money(totals.get('CORRECTIONS')),
    };
  }

  static money(amount: number | null | undefined): Money {
    return makeMoney(PointFinanceMapper.round(amount ?? 0));
  }

  static sum(a: Money, b: Money): Money {
    return makeMoney(PointFinanceMapper.round(a.amount + b.amount), a.currency);
  }

  private static round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
```

* **Location:** `projects/shared/src/core/mappers/index.ts` - add one line directly below the existing line `export * from './point.mapper';`
* **Snippet:**

```typescript
export * from './point-finance.mapper';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/mappers/point-finance.mapper.ts projects/shared/src/core/mappers/index.ts
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
```
