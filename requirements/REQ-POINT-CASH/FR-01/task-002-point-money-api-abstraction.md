# Task 002: Domain-typed `PointMoneyApi` abstraction with a pending placeholder

> **Applied Skill:** `angular-di` - abstract class used as a DI token plus a `providePointMoneyApi()` provider function, so the implementation can be swapped in one place. `angular-http` / AGENTS.md *Three-Layer Data Pipeline* - the public signature of an API wrapper uses domain types only; generated code is never hand-edited. `typescript-es2022` - strict typing, `override` on implemented members.

## 1. Objective

The backend endpoints `GET /api/finance/point-accounts/balances` and `GET /api/finance/bank-transfers/summary` do not exist in the generated client yet. This task isolates them behind a domain-typed `PointMoneyApi` abstraction so the store and UI can be built and compiled now. Until the backend ships, `providePointMoneyApi()` wires a `PendingPointMoneyApi` that fails every call. The store treats that failure as "balances unavailable" and the UI shows em-dashes. Task 015 swaps the provider to the real generated-client implementation.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/api/point-money.api.ts`
* **Action:** Create New File

* **File Path:** `projects/shared/src/core/api/pending-point-money.api.ts`
* **Action:** Create New File

* **File Path:** `projects/shared/src/core/api/point-money.providers.ts`
* **Action:** Create New File

* **File Path:** `projects/shared/src/public-api.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** (contained in each snippet below)

**Code to Add/Replace:**

* **Location:** Whole content of NEW file `projects/shared/src/core/api/point-money.api.ts`
* **Snippet:**

```typescript
import type { Observable } from 'rxjs';
import type { BankTransferMonthSummary, PointBalances } from '../models';

export abstract class PointMoneyApi {
  abstract getBalances(): Observable<PointBalances[]>;
  abstract getMonthSummary(from: Date, to: Date): Observable<BankTransferMonthSummary>;
}
```

* **Location:** Whole content of NEW file `projects/shared/src/core/api/pending-point-money.api.ts`
* **Snippet:**

```typescript
import { Injectable } from '@angular/core';
import { type Observable, throwError } from 'rxjs';
import type { BankTransferMonthSummary, PointBalances } from '../models';
import { PointMoneyApi } from './point-money.api';

@Injectable()
export class PendingPointMoneyApi extends PointMoneyApi {
  override getBalances(): Observable<PointBalances[]> {
    return throwError(() => new Error('point-money.api.unavailable'));
  }

  override getMonthSummary(): Observable<BankTransferMonthSummary> {
    return throwError(() => new Error('point-money.api.unavailable'));
  }
}
```

* **Location:** Whole content of NEW file `projects/shared/src/core/api/point-money.providers.ts`
* **Snippet:**

```typescript
import type { Provider } from '@angular/core';
import { PendingPointMoneyApi } from './pending-point-money.api';
import { PointMoneyApi } from './point-money.api';

export function providePointMoneyApi(): Provider {
  return { provide: PointMoneyApi, useClass: PendingPointMoneyApi };
}
```

* **Location:** `projects/shared/src/public-api.ts` — directly below the existing line `export { provideDefaultClient } from './core/api/generated/providers';` (line 7). Do NOT export `pending-point-money.api` (it is internal).
* **Snippet:**

```typescript
export * from './core/api/point-money.api';
export * from './core/api/point-money.providers';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx ng build admin --configuration development
npx ng lint shared
```
