# Task 003: PointFinanceService.getCurrentShift

> **Applied Skill:** `angular-http` - generated `FinanceService.getRunningShift()` wrapped in `core/api/`, public signature uses domain types only. AGENTS.md API Error Handling - `suppressErrorNotification()` on the request so the interceptor does not toast the "no running shift" answer; every other failure is rethrown and handled (notification) by `RunningShiftStore` in task-004. Backend contract - admin names the point explicitly via `X-Point-Slug`; operator (`null`) relies on the point interceptor.

## 1. Objective

Add `getCurrentShift(pointSlug | null): Observable<RunningShift | null>` to `PointFinanceService`.
`null` result = the point has no running shift (assumption A4: the backend answers HTTP 404; no
dedicated error code is documented in `backend_contract.md`). The endpoint is already in
`core/api/generated` - do NOT run `npm run generate:api`.

Requires task-001 and task-002.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/api/point-finance/point-finance.service.ts` - **Action:** Modify Existing File

## 3. Code Implementation

* **Location:** `projects/shared/src/core/api/point-finance/point-finance.service.ts` - replace the whole file content.
* **Snippet:**

```typescript
import { HttpContext, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { suppressErrorNotification } from '../../errors/http-error-context';
import { POINT_SLUG_HEADER, SKIP_POINT_SCOPE } from '../../interceptors/point.interceptor';
import { PointFinanceMapper } from '../../mappers/point-finance.mapper';
import { POINT_MOVEMENTS_MAX_PAGE_SIZE } from '../../models';
import type {
  PointMovementPage,
  PointMovementQuery,
  PointPeriod,
  PointPeriodResults,
  PointPositionsOverview,
  RunningShift,
} from '../../models';
import { FinanceService, RequestOptions } from '../generated';
import { POINT_LEDGER_READER } from './point-ledger.reader';

const NO_RUNNING_SHIFT_STATUS = 404;

@Injectable({ providedIn: 'root' })
export class PointFinanceService {
  private readonly ledger = inject(POINT_LEDGER_READER);
  private readonly finance = inject(FinanceService);

  getPositions(): Observable<PointPositionsOverview> {
    return this.ledger.positions();
  }

  getResults(period: PointPeriod, pointSlug: string | null = null): Observable<PointPeriodResults> {
    return this.ledger.results(period, pointSlug);
  }

  getMovements(query: PointMovementQuery): Observable<PointMovementPage> {
    return this.ledger.movements({
      ...query,
      size: Math.min(query.size, POINT_MOVEMENTS_MAX_PAGE_SIZE),
    });
  }

  getCurrentShift(pointSlug: string | null): Observable<RunningShift | null> {
    return this.finance.getRunningShift('body', PointFinanceService.shiftOptions(pointSlug)).pipe(
      map((response): RunningShift | null => PointFinanceMapper.runningShiftFromResponse(response)),
      catchError((err: unknown) =>
        err instanceof HttpErrorResponse && err.status === NO_RUNNING_SHIFT_STATUS
          ? of(null)
          : throwError(() => err),
      ),
    );
  }

  private static shiftOptions(pointSlug: string | null): RequestOptions<'json'> {
    if (pointSlug === null) {
      return { context: suppressErrorNotification() };
    }
    return {
      headers: { [POINT_SLUG_HEADER]: pointSlug },
      context: suppressErrorNotification(new HttpContext().set(SKIP_POINT_SCOPE, true)),
    };
  }
}
```

If `RequestOptions` is not exported from `'../generated'`, import it from `'../generated/utils/request-options'`
instead (run `Grep "export.*RequestOptions" projects/shared/src/core/api/generated` to find the path;
`PointAdminStore` already imports it from `'../api/generated'`).

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/api/point-finance/point-finance.service.ts
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
```
