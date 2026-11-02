# Task 018: [BLOCKED - needs task 017] Settlement mapper and PointFinanceService.recordSettlement

> **Applied Skill:** AGENTS.md "Three-Layer Data Pipeline" - generated types stay in `core/mappers/` and `core/api/`. `angular-http` - explicit `HttpHeaders` for `X-Point-Slug`, `suppressErrorNotification()` always.

## 0. Precondition

Task 017 is done and you have its recorded names. Below `TerminalSettlementRequest`, `TerminalSettlementResponse` and `recordTerminalSettlement` are **placeholders**: replace with the real generated names. If a field does not exist (e.g. no `cardTerminalPosition`), adapt the mapper accordingly (`cardTerminalPosition: null`); if the shape differs materially from task 017's expectation, stop and report the actual shape.

## 1. Objective

Add `settlementToRequest` / `settlementFromResponse` to `PointFinanceMapper` and `recordSettlement(write, pointSlug)` to `PointFinanceService`. The date is sent as a plain `yyyy-MM-dd` string built from local date parts (never `toISOString`, which shifts the day); if task 017 shows `settlementDate` is date-time, report instead of guessing.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/mappers/point-finance.mapper.ts` - **Action:** Modify Existing File
* **File Path:** `projects/shared/src/core/api/point-finance/point-finance.service.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**File 1 - mapper.** Imports: add `TerminalSettlementRequest,` `TerminalSettlementResponse,` to the `@api-models` list and `TerminalSettlement,` `TerminalSettlementWrite,` to the `../models` list. Directly after `collectionFromResponse` add:

```typescript
  static settlementToRequest(write: TerminalSettlementWrite): TerminalSettlementRequest {
    const d = write.settlementDate;
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return {
      idempotencyKey: write.idempotencyKey,
      amount: write.amount,
      settlementDate: `${d.getFullYear()}-${month}-${day}`,
    };
  }

  static settlementFromResponse(r: TerminalSettlementResponse): TerminalSettlement {
    return {
      transactionId: r.transactionId,
      pointSlug: r.pointSlug,
      amount: PointFinanceMapper.money(r.amount),
      settlementDate: new Date(`${r.settlementDate}T00:00:00`),
      cardTerminalPosition:
        r.cardTerminalPosition === undefined || r.cardTerminalPosition === null
          ? null
          : PointFinanceMapper.money(r.cardTerminalPosition),
      recordedAt: new Date(r.recordedAt),
    };
  }
```

**File 2 - service.** Add `TerminalSettlement,` and `TerminalSettlementWrite,` to the `../../models` type import. Directly after `recordCollection(...)` add:

```typescript
  recordSettlement(
    write: TerminalSettlementWrite,
    pointSlug: string,
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
npx prettier --write projects/shared/src/core/mappers/point-finance.mapper.ts projects/shared/src/core/api/point-finance/point-finance.service.ts
npx ng build admin --configuration development
```
