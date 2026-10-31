# Task 002: Extend `PointMoneyApi` with `getSnapshot` / `getMovements` (pending placeholder)

> **Applied Skill:** `angular-di` - the FR-01 abstract class `PointMoneyApi` stays the single DI token for every point-money endpoint; `providePointMoneyApi()` (FR-01 Task 002) is reused unchanged. `angular-http` / AGENTS.md *Three-Layer Data Pipeline* - public signatures use domain types only; generated code is never hand-edited. `typescript-es2022` - `override` on implemented members.

## 1. Objective

The backend endpoints `GET /api/finance/point-accounts/snapshot` and `GET /api/finance/point-accounts/movements` do not exist in the generated client yet. Add two domain-typed methods to the existing `PointMoneyApi` abstraction and make the existing `PendingPointMoneyApi` placeholder fail them, so the stores and UI of FR-02 compile and render their failure state (em-dash pills, empty operations list) until Task 018 wires the real implementation.

Contract of the new methods:

* `getSnapshot(pointSlug, businessDate)` — `pointSlug` is the point to address via the `X-Point-Slug` header (admin); `null` means "the working point set by the operator point interceptor" (FR-06).
* `getMovements(query)` — `query.pointSlug` follows the same rule; results are newest first.

**Precondition:** FR-01 Task 002 is done AND FR-01 Task 015 is NOT done yet, i.e. `projects/shared/src/core/api/pending-point-money.api.ts` exists. If that file does NOT exist, STOP and report failure "PendingPointMoneyApi missing — FR-01 Task 015 already ran; this task must be re-planned".

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/api/point-money.api.ts`
* **Action:** Modify Existing File (replace the whole file content)

* **File Path:** `projects/shared/src/core/api/pending-point-money.api.ts`
* **Action:** Modify Existing File (replace the whole file content)

## 3. Code Implementation

**Imports Required:** (contained in each snippet below)

**Code to Add/Replace:**

* **Location:** Replace the WHOLE content of `projects/shared/src/core/api/point-money.api.ts`
* **Snippet:**

```typescript
import type { Observable } from 'rxjs';
import type {
  BankTransferMonthSummary,
  PointBalances,
  PointCashSnapshot,
  PointMovementPage,
  PointMovementQuery,
} from '../models';

export abstract class PointMoneyApi {
  abstract getBalances(): Observable<PointBalances[]>;
  abstract getMonthSummary(from: Date, to: Date): Observable<BankTransferMonthSummary>;
  abstract getSnapshot(pointSlug: string | null, businessDate: Date): Observable<PointCashSnapshot>;
  abstract getMovements(query: PointMovementQuery): Observable<PointMovementPage>;
}
```

* **Location:** Replace the WHOLE content of `projects/shared/src/core/api/pending-point-money.api.ts`
* **Snippet:**

```typescript
import { Injectable } from '@angular/core';
import { type Observable, throwError } from 'rxjs';
import type {
  BankTransferMonthSummary,
  PointBalances,
  PointCashSnapshot,
  PointMovementPage,
} from '../models';
import { PointMoneyApi } from './point-money.api';

@Injectable()
export class PendingPointMoneyApi extends PointMoneyApi {
  override getBalances(): Observable<PointBalances[]> {
    return throwError(() => new Error('point-money.api.unavailable'));
  }

  override getMonthSummary(): Observable<BankTransferMonthSummary> {
    return throwError(() => new Error('point-money.api.unavailable'));
  }

  override getSnapshot(): Observable<PointCashSnapshot> {
    return throwError(() => new Error('point-money.api.unavailable'));
  }

  override getMovements(): Observable<PointMovementPage> {
    return throwError(() => new Error('point-money.api.unavailable'));
  }
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/api/point-money.api.ts projects/shared/src/core/api/pending-point-money.api.ts
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
```
