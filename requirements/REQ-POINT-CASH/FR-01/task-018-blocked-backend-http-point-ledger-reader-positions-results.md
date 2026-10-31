# Task 018: [BLOCKED - needs task-016, task-017] HttpPointLedgerReader for positions and period results

> **Applied Skill:** `angular-di` - swap the `POINT_LEDGER_READER` root factory to the HTTP implementation; no consumer changes. `angular-http` / AGENTS.md - inject the generated `FinanceService`, never `HttpClient`; map with `PointFinanceMapper`. `error-handling` - reads are NOT suppressed: a failure takes the global toast path (FR-01 Scenario 8) and the store sets its failure flag. Design FR-01 §0.2 - `point-positions` takes no point; `point-results` uses the optional `pointSlug` query parameter; no `X-Point-Slug` header.

## 0. Precondition

task-016 and task-017 are done. `getPointPositions` / `getPointResults` below are placeholders for
the generated method names recorded in task-016; adapt the argument shape to the regenerated
signature (query parameters may be a params object, as in `AnalyticsService.getOperatorRevenue(params, 'body', options)`).

## 1. Objective

Create `HttpPointLedgerReader`, which implements `positions()` and `results()` over the generated
client and delegates any read not yet published (FR-02's `movements`, if present in the interface)
to `UnavailablePointLedgerReader`. Point the token factory at it.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/api/point-finance/http-point-ledger.reader.ts` - **Action:** Create New File
* **File Path:** `projects/shared/src/core/api/point-finance/point-ledger.reader.ts` - **Action:** Modify Existing File
* **File Path:** `projects/shared/src/core/api/point-finance/index.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** (included in the snippets)

**Code to Add/Replace:**

* **Location:** New file `projects/shared/src/core/api/point-finance/http-point-ledger.reader.ts` - full content.
  If FR-02 task-004 has already added `movements()` to `PointLedgerReader`, keep the `movements`
  delegation method shown; otherwise delete that method and the `PointMovementPage` import.
* **Snippet:**

```typescript
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FinanceService } from '../generated';
import { PointFinanceMapper } from '../../mappers/point-finance.mapper';
import type {
  PointMovementPage,
  PointPeriod,
  PointPeriodResults,
  PointPositionsOverview,
} from '../../models';
import { toIsoDate } from '../../../shared/utils/date.util';
import type { PointLedgerReader } from './point-ledger.reader';
import { UnavailablePointLedgerReader } from './unavailable-point-ledger.reader';

@Injectable({ providedIn: 'root' })
export class HttpPointLedgerReader implements PointLedgerReader {
  private readonly finance = inject(FinanceService);
  private readonly unavailable = new UnavailablePointLedgerReader();

  positions(): Observable<PointPositionsOverview> {
    return this.finance
      .getPointPositions()
      .pipe(map((response) => PointFinanceMapper.positionsOverviewFromResponse(response)));
  }

  results(period: PointPeriod, pointSlug: string | null): Observable<PointPeriodResults> {
    return this.finance
      .getPointResults({
        from: toIsoDate(period.from),
        to: toIsoDate(period.to),
        pointSlug: pointSlug ?? undefined,
      })
      .pipe(
        map((response) => PointFinanceMapper.periodResultsFromResponse(response, period, pointSlug)),
      );
  }

  movements(): Observable<PointMovementPage> {
    return this.unavailable.movements();
  }
}
```

* **Location:** `projects/shared/src/core/api/point-finance/point-ledger.reader.ts`:
  1. replace `import { InjectionToken } from '@angular/core';` with `import { inject, InjectionToken } from '@angular/core';`
  2. replace `import { UnavailablePointLedgerReader } from './unavailable-point-ledger.reader';` with `import { HttpPointLedgerReader } from './http-point-ledger.reader';`
  3. replace the line `factory: () => new UnavailablePointLedgerReader(),` with:
* **Snippet:**

```typescript
  factory: () => inject(HttpPointLedgerReader),
```

* **Location:** `projects/shared/src/core/api/point-finance/index.ts` - add one line below `export * from './unavailable-point-ledger.reader';`
* **Snippet:**

```typescript
export * from './http-point-ledger.reader';
```

The `import type { PointLedgerReader }` in `http-point-ledger.reader.ts` MUST stay type-only (no
runtime cycle with `point-ledger.reader.ts`).

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/api/point-finance
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
```
