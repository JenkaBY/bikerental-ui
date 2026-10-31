# Task 004: PointFinanceService and the PointLedgerReader abstraction (placeholder reader)

> **Applied Skill:** `angular-di` - `InjectionToken` with a `providedIn: 'root'` factory so the implementation can be swapped in one place. `angular-http` / AGENTS.md - wrapper services in `core/api/` expose domain types only; generated code is never edited. Design FR-01 §0.1 - `point-positions` and `point-results` are **[B-FR08]** (not built yet), so they sit behind a placeholder until the backend publishes them.

## 1. Objective

Create the single entry point to point-finance reads, `PointFinanceService`, with
`getPositions()` and `getResults(period, pointSlug)`. Both delegate to a `PointLedgerReader`
provided through the `POINT_LEDGER_READER` token. Until FIN-002 FR-08 is deployed, the token
resolves to `UnavailablePointLedgerReader`, which fails immediately with
`PointLedgerUnavailableError` - no HTTP call, no toast - so every consumer shows its
em-dash / failure state. The blocked task `task-019-blocked-backend-http-point-ledger-reader-positions-results.md`
later swaps the factory to a real HTTP reader without touching any consumer.

File layout (four files + barrel, kept separate so there is no runtime import cycle when the HTTP
reader is added):

```
projects/shared/src/core/api/point-finance/
  point-ledger-unavailable.error.ts
  point-ledger.reader.ts
  unavailable-point-ledger.reader.ts
  point-finance.service.ts
  index.ts
```

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/api/point-finance/point-ledger-unavailable.error.ts` - **Action:** Create New File
* **File Path:** `projects/shared/src/core/api/point-finance/point-ledger.reader.ts` - **Action:** Create New File
* **File Path:** `projects/shared/src/core/api/point-finance/unavailable-point-ledger.reader.ts` - **Action:** Create New File
* **File Path:** `projects/shared/src/core/api/point-finance/point-finance.service.ts` - **Action:** Create New File
* **File Path:** `projects/shared/src/core/api/point-finance/index.ts` - **Action:** Create New File
* **File Path:** `projects/shared/src/public-api.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** (included in each snippet below)

**Code to Add/Replace:**

* **Location:** New file `projects/shared/src/core/api/point-finance/point-ledger-unavailable.error.ts` - full content.
* **Snippet:**

```typescript
export type PointLedgerEndpoint = 'point-positions' | 'point-results' | 'point-movements';

export class PointLedgerUnavailableError extends Error {
  constructor(readonly endpoint: PointLedgerEndpoint) {
    super(`${endpoint} is not available`);
    this.name = 'PointLedgerUnavailableError';
  }
}
```

* **Location:** New file `projects/shared/src/core/api/point-finance/point-ledger.reader.ts` - full content.
* **Snippet:**

```typescript
import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import type { PointPeriod, PointPeriodResults, PointPositionsOverview } from '../../models';
import { UnavailablePointLedgerReader } from './unavailable-point-ledger.reader';

export interface PointLedgerReader {
  positions(): Observable<PointPositionsOverview>;
  results(period: PointPeriod, pointSlug: string | null): Observable<PointPeriodResults>;
}

export const POINT_LEDGER_READER = new InjectionToken<PointLedgerReader>('PointLedgerReader', {
  providedIn: 'root',
  factory: () => new UnavailablePointLedgerReader(),
});
```

* **Location:** New file `projects/shared/src/core/api/point-finance/unavailable-point-ledger.reader.ts` - full content.
  The import of `PointLedgerReader` MUST stay `import type` (it is erased at runtime, which keeps
  the two files free of a circular runtime import).
* **Snippet:**

```typescript
import { Observable, throwError } from 'rxjs';
import type { PointPeriodResults, PointPositionsOverview } from '../../models';
import { PointLedgerUnavailableError } from './point-ledger-unavailable.error';
import type { PointLedgerReader } from './point-ledger.reader';

export class UnavailablePointLedgerReader implements PointLedgerReader {
  positions(): Observable<PointPositionsOverview> {
    return throwError(() => new PointLedgerUnavailableError('point-positions'));
  }

  results(): Observable<PointPeriodResults> {
    return throwError(() => new PointLedgerUnavailableError('point-results'));
  }
}
```

* **Location:** New file `projects/shared/src/core/api/point-finance/point-finance.service.ts` - full content.
* **Snippet:**

```typescript
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { PointPeriod, PointPeriodResults, PointPositionsOverview } from '../../models';
import { POINT_LEDGER_READER } from './point-ledger.reader';

@Injectable({ providedIn: 'root' })
export class PointFinanceService {
  private readonly ledger = inject(POINT_LEDGER_READER);

  getPositions(): Observable<PointPositionsOverview> {
    return this.ledger.positions();
  }

  getResults(period: PointPeriod, pointSlug: string | null = null): Observable<PointPeriodResults> {
    return this.ledger.results(period, pointSlug);
  }
}
```

* **Location:** New file `projects/shared/src/core/api/point-finance/index.ts` - full content.
* **Snippet:**

```typescript
export * from './point-ledger-unavailable.error';
export * from './point-ledger.reader';
export * from './unavailable-point-ledger.reader';
export * from './point-finance.service';
```

* **Location:** `projects/shared/src/public-api.ts` - add one line directly below the existing line `export { provideDefaultClient } from './core/api/generated/providers';`
* **Snippet:**

```typescript
export * from './core/api/point-finance';
```

Rules encoded here (do not change):
* No method of `PointFinanceService` calls `HttpClient` or a generated service in this task.
* Point addressing (design FR-01 §0.2): `point-positions` takes no point, `point-results` takes the
  point as the optional `pointSlug` query parameter - never a header, never a body field.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/api/point-finance projects/shared/src/public-api.ts
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
```
