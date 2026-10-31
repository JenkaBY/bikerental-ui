# Task 017: [BLOCKED - needs task-016] PointFinanceMapper response converters for positions and period results

> **Applied Skill:** AGENTS.md three-layer pipeline - generated `*Response` types are consumed only by `core/mappers/` and wrapper services; mappers are pure static methods. Design FR-01 §3 - missing kind = 0, unknown kind ignored, `pointStatus` null until the backend sends it, period `total` = backend total when present, else `collected + terminalSettled` ([GAP]).

## 0. Precondition

task-016 is done and you have its recorded generated names. Below,
`PointPositionsOverviewResponse` and `PointResultsResponse` are **placeholders**: replace them with
the real generated model names from task-016, and adapt the field accessors marked in the table.

| Domain field | Expected generated field (replace if different) |
|---|---|
| overview points list | `r.points` |
| point slug | `p.pointSlug` |
| point positions | `p.positions` (array of `{ kind, amount }`) or an object `{ CASH: n, ... }` |
| point status | `p.pointStatus` (optional) |
| totals per kind | `r.totals` (same shape as `p.positions`) |
| collected | `r.collected` |
| terminal settled | `r.terminalSettled` |
| backend total | `r.total` (optional) |

If a field does not exist in the generated model at all (e.g. the backend reports collections
under another name), stop and report the actual shape instead of guessing.

## 1. Objective

Add `positionsOverviewFromResponse` and `periodResultsFromResponse` to `PointFinanceMapper`.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/mappers/point-finance.mapper.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** add at the top of `point-finance.mapper.ts` (replace the placeholder type names):

```typescript
import type { PointPositionsOverviewResponse, PointResultsResponse } from '@api-models';
```

and extend the existing domain import to:

```typescript
import type {
  Money,
  PointPeriod,
  PointPeriodResults,
  PointPositionAmounts,
  PointPositionKind,
  PointPositionsOverview,
  PointStatus,
} from '../models';
```

**Code to Add/Replace:**

* **Location:** inside `class PointFinanceMapper`, directly above `static toPositionKind(`
* **Snippet (array-shaped positions):**

```typescript
  static positionsOverviewFromResponse(r: PointPositionsOverviewResponse): PointPositionsOverview {
    return {
      points: (r.points ?? []).map((p) => ({
        pointSlug: p.pointSlug,
        amounts: PointFinanceMapper.toAmounts(p.positions ?? []),
        pointStatus: PointFinanceMapper.toPointStatus(p.pointStatus),
      })),
      totals: PointFinanceMapper.toAmounts(r.totals ?? []),
    };
  }

  static periodResultsFromResponse(
    r: PointResultsResponse,
    period: PointPeriod,
    pointSlug: string | null,
  ): PointPeriodResults {
    const collected = PointFinanceMapper.money(r.collected);
    const terminalSettled = PointFinanceMapper.money(r.terminalSettled);
    return {
      from: period.from,
      to: period.to,
      pointSlug,
      collected,
      terminalSettled,
      total:
        r.total === undefined || r.total === null
          ? PointFinanceMapper.sum(collected, terminalSettled)
          : PointFinanceMapper.money(r.total),
    };
  }

  static toPointStatus(raw: string | null | undefined): PointStatus | null {
    return (['ACTIVE', 'INACTIVE', 'PERMANENTLY_CLOSED'] as const).find((s) => s === raw) ?? null;
  }
```

* **Variant - object-shaped positions** (`{ CASH: 10, CARD_TERMINAL: 5, ... }`): replace the two
  `toAmounts(...)` arguments with `PointFinanceMapper.entriesOf(p.positions)` /
  `PointFinanceMapper.entriesOf(r.totals)` and add:

```typescript
  static entriesOf(map: Record<string, number> | null | undefined): { kind: string; amount: number }[] {
    return Object.entries(map ?? {}).map(([kind, amount]) => ({ kind, amount }));
  }
```

Remove whichever of `Money` / `PointPositionAmounts` / `PointPositionKind` imports become unused.
If the generated model has no `pointStatus`, use `pointStatus: null` and drop `toPointStatus`.
If it has no `total`, use `total: PointFinanceMapper.sum(collected, terminalSettled)`.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/mappers/point-finance.mapper.ts
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
```
