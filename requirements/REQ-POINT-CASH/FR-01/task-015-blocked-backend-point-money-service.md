# Task 015: [BLOCKED ON BACKEND] `PointMoneyService` and switch `providePointMoneyApi()` to it

> **Applied Skill:** `angular-http` / AGENTS.md *Three-Layer Data Pipeline* - wrapper service in `core/api/` injects the generated service, applies the mapper internally, exposes only domain types; no direct `HttpClient`. `angular-di` - swap the implementation behind the `PointMoneyApi` token in one provider function. `error-handling` - requests are sent WITHOUT `suppressErrorNotification()`, so the global interceptor toasts a balance/summary failure (FR-01 Scenario 8) while the store renders em-dashes.

## 1. Objective

**Precondition:** Tasks 013 and 014 succeeded.

Implement the real `PointMoneyApi` on top of the generated client, point `providePointMoneyApi()` at it, and delete the `PendingPointMoneyApi` placeholder from Task 002. After this task the points list shows real balances, last transfers and the month summary.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/api/point-money.service.ts`
* **Action:** Create New File

* **File Path:** `projects/shared/src/core/api/point-money.providers.ts`
* **Action:** Modify Existing File (replace the whole file content)

* **File Path:** `projects/shared/src/core/api/pending-point-money.api.ts`
* **Action:** Delete File

## 3. Code Implementation

**Imports Required:** (contained in each snippet below)

**Code to Add/Replace:**

* **Location:** Step 1 — confirm the generated service and method names. The snippet below assumes:

| Placeholder used in snippet | Meaning | How to confirm |
|---|---|---|
| `FinanceService` | generated service containing both endpoints | Grep `projects/shared/src/core/api/generated/services` for `/api/finance/point-accounts/balances` — the file's exported class |
| `getPointAccountBalances` | method for `GET /api/finance/point-accounts/balances` | the method whose body contains that URL |
| `getBankTransferSummary` | method for `GET /api/finance/bank-transfers/summary` | the method whose body contains that URL |

  If a generated name differs, use the generated name instead of the placeholder (import line, `inject(...)` and the method calls). If the two endpoints live in DIFFERENT generated services, inject both and call each method on its own service.

* **Location:** Step 2 — look at the FIRST parameter of the generated summary method:
  * if it is a filter-params object (e.g. `filterParams: BankTransferSummaryFilterParams`) use **Variant A** below;
  * if it is two positional strings (`fromDate: string, toDate: string`) use **Variant B** below.
  If the filter-params object uses property names other than `fromDate` / `toDate`, use the generated property names.

* **Location:** Step 3 — whole content of NEW file `projects/shared/src/core/api/point-money.service.ts`
* **Snippet:**

```typescript
import { inject, Injectable } from '@angular/core';
import { map, type Observable, throwError } from 'rxjs';
import { toIsoDate } from '../../shared/utils/date.util';
import { PointMoneyMapper } from '../mappers/point-money.mapper';
import type {
  BankTransferMonthSummary,
  PointBalances,
  PointCashSnapshot,
  PointMovementPage,
} from '../models';
import { FinanceService } from './generated';
import { PointMoneyApi } from './point-money.api';

@Injectable()
export class PointMoneyService extends PointMoneyApi {
  private readonly finance = inject(FinanceService);

  override getBalances(): Observable<PointBalances[]> {
    return this.finance
      .getPointAccountBalances()
      .pipe(map((r) => (r.items ?? []).map(PointMoneyMapper.balancesFromResponse)));
  }

  override getMonthSummary(from: Date, to: Date): Observable<BankTransferMonthSummary> {
    return this.finance
      .getBankTransferSummary({ fromDate: toIsoDate(from), toDate: toIsoDate(to) })
      .pipe(map((r) => PointMoneyMapper.monthSummaryFromResponse(r, from, to)));
  }

  override getSnapshot(): Observable<PointCashSnapshot> {
    return throwError(() => new Error('point-money.api.unavailable'));
  }

  override getMovements(): Observable<PointMovementPage> {
    return throwError(() => new Error('point-money.api.unavailable'));
  }
}
```

  **FR-02 dependency:** `getSnapshot` / `getMovements` exist on `PointMoneyApi` only after REQ-POINT-CASH FR-02 task-002 has run. If FR-02 task-002 has NOT run yet, omit these two overrides, `throwError`, `PointCashSnapshot` and `PointMovementPage`. If it has run, keep them; FR-02 task-018 replaces both overrides with real implementations.

  **Variant A** (filter object) — keep the snippet exactly as above.

  **Variant B** (positional strings) — replace the single line
  `.getBankTransferSummary({ fromDate: toIsoDate(from), toDate: toIsoDate(to) })`
  with
  `.getBankTransferSummary(toIsoDate(from), toIsoDate(to))`.

* **Location:** Step 4 — replace the WHOLE content of `projects/shared/src/core/api/point-money.providers.ts`
* **Snippet:**

```typescript
import type { Provider } from '@angular/core';
import { PointMoneyApi } from './point-money.api';
import { PointMoneyService } from './point-money.service';

export function providePointMoneyApi(): Provider {
  return { provide: PointMoneyApi, useClass: PointMoneyService };
}
```

* **Location:** Step 5 — delete `projects/shared/src/core/api/pending-point-money.api.ts`. Then use the Grep tool with pattern `PendingPointMoneyApi|pending-point-money` on path `projects` — there must be 0 matches.

* **Location:** Step 6 — update the `COMPONENT_NAME: PointMoneyApi` block in `overview.md` (added in Task 012):
  * replace the responsibility line starting `- Wired via \`providePointMoneyApi()\`; until the backend ships` with
    `- Wired via \`providePointMoneyApi()\` to \`PointMoneyService\`, which calls the generated client and maps through \`PointMoneyMapper\`; failures are toasted by the global error interceptor.`
  * replace the line `- (pending) none — (after backend) generated \`FinanceService\` via \`PointMoneyService\` + \`PointMoneyMapper\`.` with
    `- Generated \`FinanceService\` (via \`PointMoneyService\`) and \`PointMoneyMapper\`.`
  * add `projects/shared/src/core/api/point-money.service.ts` to that block's `SOURCE:` line, separated by `, `.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
npx ng lint admin
```
