# Task 018: Settlement domain model rename, mapper and PointFinanceService.recordSettlement

> **Applied Skill:** AGENTS.md "Three-Layer Data Pipeline" - generated types stay in `core/mappers/` and `core/api/`. `angular-http` - explicit `X-Point-Slug` header through the existing `scopedOptions`, `suppressErrorNotification()` always. `typescript-es2022`.

## 1. Objective

Align the domain model with the real contract (`statementDate`, `cardTerminalPosition` always present), add `settlementToRequest` / `settlementFromResponse` to `PointFinanceMapper` and `recordSettlement(write, pointSlug)` to `PointFinanceService`. The date is sent as a plain `yyyy-MM-dd` string built from local date parts (never `toISOString`, which shifts the day).

Requires task 017 (done).

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/models/point-money-move.model.ts` - **Action:** Modify Existing File
* **File Path:** `projects/shared/src/core/mappers/point-finance.mapper.ts` - **Action:** Modify Existing File
* **File Path:** `projects/shared/src/core/api/point-finance/point-finance.service.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**File 1 - model.** `settlementDate` is used nowhere outside this file. Replace the two settlement interfaces (lines 18-31) with:

```typescript
export interface TerminalSettlementWrite {
  readonly idempotencyKey: string;
  readonly amount: number;
  readonly statementDate: Date;
}

export interface TerminalSettlement {
  readonly transactionId: string;
  readonly pointSlug: string;
  readonly amount: Money;
  readonly statementDate: Date;
  readonly cardTerminalPosition: Money;
  readonly recordedAt: Date;
}
```

**File 2 - mapper.**

* In the `import type { ... } from '@api-models';` list add, after `ShiftClosureResponse,`:

```typescript
  TerminalSettlementRequest,
  TerminalSettlementResponse,
```

* In the `import type { ... } from '../models';` list add, after `ShiftClosureWrite,`:

```typescript
  TerminalSettlement,
  TerminalSettlementWrite,
```

* Directly after `collectionFromResponse` (before `closureToRequest`) add:

```typescript
  static settlementToRequest(write: TerminalSettlementWrite): TerminalSettlementRequest {
    const date = write.statementDate;
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return {
      idempotencyKey: write.idempotencyKey,
      amount: write.amount,
      statementDate: `${date.getFullYear()}-${month}-${day}`,
    };
  }

  static settlementFromResponse(r: TerminalSettlementResponse): TerminalSettlement {
    return {
      transactionId: r.transactionId,
      pointSlug: r.pointSlug,
      amount: PointFinanceMapper.money(r.amount),
      statementDate: new Date(`${r.statementDate}T00:00:00`),
      cardTerminalPosition: PointFinanceMapper.money(r.cardTerminalPosition),
      recordedAt: new Date(r.recordedAt),
    };
  }
```

**File 3 - service.**

* In the `import type { ... } from '../../models';` list add, after `ShiftClosureWrite,`:

```typescript
  TerminalSettlement,
  TerminalSettlementWrite,
```

* Directly after `recordCollection(...)` (before `closeShift`) add:

```typescript
  recordSettlement(
    write: TerminalSettlementWrite,
    pointSlug: string | null,
  ): Observable<TerminalSettlement> {
    return this.finance
      .recordTerminalSettlement(
        PointFinanceMapper.settlementToRequest(write),
        'body',
        PointFinanceService.scopedOptions(pointSlug),
      )
      .pipe(map((response) => PointFinanceMapper.settlementFromResponse(response)));
  }
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/models/point-money-move.model.ts projects/shared/src/core/mappers/point-finance.mapper.ts projects/shared/src/core/api/point-finance/point-finance.service.ts
npx ng build admin --configuration development
```
