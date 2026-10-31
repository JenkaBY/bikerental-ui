# Task 014: [BLOCKED ON BACKEND] `PointMoneyMapper` (generated responses → domain models)

> **Applied Skill:** `angular-data-flow-orchestrator` - Phase 2: pure, side-effect-free mapper in `core/mappers/`, strict typing from generated DTO to UI model; ISO strings converted to `Date`. AGENTS.md *Three-Layer Data Pipeline* - `XyzMapper.fromResponse(...)` static class pattern (same as `PointMapper`, `BalanceMapper`), `makeMoney()` for amounts.

## 1. Objective

**Precondition:** Task 013 succeeded (generated models for the balances and summary endpoints exist).

Create `PointMoneyMapper` converting the generated bulk-balance item to `PointBalances` and the generated summary to `BankTransferMonthSummary`. FR-02/03/06 will later extend this same class (snapshots, movements).

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/mappers/point-money.mapper.ts`
* **Action:** Create New File

* **File Path:** `projects/shared/src/core/mappers/index.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** (contained in the snippet below)

**Code to Add/Replace:**

* **Location:** Step 1 — confirm the generated model names. The snippet below assumes:

| Placeholder used in snippet | Meaning | How to confirm |
|---|---|---|
| `PointAccountBalanceResponse` | one element of `items` returned by `GET /api/finance/point-accounts/balances` | Grep `projects/shared/src/core/api/generated/models` for `cashBalance` — the interface containing it |
| `BankTransferSummaryResponse` | body returned by `GET /api/finance/bank-transfers/summary` | Grep the same folder for `completedCount` — the interface containing it |

  If the generated interface names differ, use the generated names instead of the placeholders everywhere in the snippet (import line and method parameter types). Do NOT change any other part of the snippet.

* **Location:** Step 2 — whole content of NEW file `projects/shared/src/core/mappers/point-money.mapper.ts`
* **Snippet:**

```typescript
import type { BankTransferSummaryResponse, PointAccountBalanceResponse } from '@api-models';
import type { BankTransferMonthSummary, PointBalances } from '../models';
import { makeMoney } from './money.mapper';

export class PointMoneyMapper {
  static balancesFromResponse(r: PointAccountBalanceResponse): PointBalances {
    const last = r.lastCompletedTransfer;
    return {
      pointSlug: r.pointSlug,
      cash: makeMoney(r.cashBalance),
      terminal: makeMoney(r.terminalBalance),
      lastCompletedTransfer: last
        ? {
            transferredAt: new Date(last.transferredAt),
            performerName: last.performedBy.displayName,
          }
        : null,
    };
  }

  static monthSummaryFromResponse(
    r: BankTransferSummaryResponse,
    from: Date,
    to: Date,
  ): BankTransferMonthSummary {
    return {
      from,
      to,
      completedAmount: makeMoney(r.completedAmount),
      completedCount: r.completedCount,
    };
  }
}
```

* **Location:** Step 3 — `projects/shared/src/core/mappers/index.ts`, add as the last line of the file, directly below `export * from './returnable-rental.mapper';`
* **Snippet:**

```typescript
export * from './point-money.mapper';
```

* **Location:** Step 4 — only if the build in section 4 reports that one of these generated fields is possibly `undefined` (i.e. it is optional in the generated model): append `?? 0` to `r.cashBalance`, `r.terminalBalance`, `r.completedAmount`, `r.completedCount` as reported; append `?? null` to `r.lastCompletedTransfer`. If `last.performedBy` is reported possibly undefined, use `last.performedBy?.displayName ?? ''`. Make no other changes.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx ng build admin --configuration development
npx ng lint shared
```
