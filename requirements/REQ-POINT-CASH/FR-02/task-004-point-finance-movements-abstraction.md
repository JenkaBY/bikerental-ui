# Task 004: Extend the point-finance abstraction with movements (placeholder until FR-08)

> **Applied Skill:** `angular-di` - same `POINT_LEDGER_READER` token as FR-01; the placeholder keeps the UI in its failure state with no HTTP call. AGENTS.md three-layer pipeline - `PointFinanceService` stays the single domain-typed entry point. Design FR-02 §4 - `GET /api/finance/point-movements` is **[B-FR08]**, admin only, point in the `pointSlug` query parameter, size <= 100, sort only by `recordedAt`. Design FR-01 §2 - unknown movement kinds map to the safe fallback `OTHER`.

## 1. Objective

Add `getMovements(query)` to `PointFinanceService` (clamping `size` to 100), `movements(query)`
to the `PointLedgerReader` interface, a failing `movements()` to `UnavailablePointLedgerReader`,
and `toMovementKind(raw)` to `PointFinanceMapper`. The real HTTP wiring is the blocked task
`task-022-blocked-backend-http-point-ledger-reader-movements.md`.

If FR-01 task-018 (HttpPointLedgerReader) has already been executed, ALSO apply the last step
below to `http-point-ledger.reader.ts`; otherwise skip it.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/mappers/point-finance.mapper.ts` - **Action:** Modify Existing File
* **File Path:** `projects/shared/src/core/api/point-finance/point-ledger.reader.ts` - **Action:** Modify Existing File
* **File Path:** `projects/shared/src/core/api/point-finance/unavailable-point-ledger.reader.ts` - **Action:** Modify Existing File
* **File Path:** `projects/shared/src/core/api/point-finance/point-finance.service.ts` - **Action:** Modify Existing File
* **File Path (conditional):** `projects/shared/src/core/api/point-finance/http-point-ledger.reader.ts` - **Action:** Modify Existing File only if it exists

## 3. Code Implementation

**1. Mapper** - `point-finance.mapper.ts`:
* change the value import `import { POINT_POSITION_KINDS } from '../models';` to
  `import { POINT_MOVEMENT_KINDS, POINT_POSITION_KINDS } from '../models';`
* change the type import to also include `PointMovementKind`
  (e.g. `import type { Money, PointMovementKind, PointPositionAmounts, PointPositionKind } from '../models';` - keep every name that is already there).
* add inside the class, directly below `toPositionKind(...)`:

```typescript
  static toMovementKind(raw: string | null | undefined): PointMovementKind {
    return POINT_MOVEMENT_KINDS.find((kind) => kind === raw) ?? 'OTHER';
  }
```

**2. Reader interface** - `point-ledger.reader.ts`:
* extend the type import to
  `import type { PointMovementPage, PointMovementQuery, PointPeriod, PointPeriodResults, PointPositionsOverview } from '../../models';`
* add inside `interface PointLedgerReader`, below `results(...)`:

```typescript
  movements(query: PointMovementQuery): Observable<PointMovementPage>;
```

**3. Placeholder** - `unavailable-point-ledger.reader.ts`:
* extend the type import to
  `import type { PointMovementPage, PointPeriodResults, PointPositionsOverview } from '../../models';`
* add inside the class, below `results()`:

```typescript
  movements(): Observable<PointMovementPage> {
    return throwError(() => new PointLedgerUnavailableError('point-movements'));
  }
```

**4. Service** - `point-finance.service.ts`:
* change the models import to
  `import { POINT_MOVEMENTS_MAX_PAGE_SIZE } from '../../models';` plus
  `import type { PointMovementPage, PointMovementQuery, PointPeriod, PointPeriodResults, PointPositionsOverview } from '../../models';`
* add inside the class, below `getResults(...)`:

```typescript
  getMovements(query: PointMovementQuery): Observable<PointMovementPage> {
    return this.ledger.movements({
      ...query,
      size: Math.min(query.size, POINT_MOVEMENTS_MAX_PAGE_SIZE),
    });
  }
```

**5. Conditional** - only if `http-point-ledger.reader.ts` exists: make sure it contains this
method (add it below `results(...)` if missing, and add `PointMovementPage` to its type import):

```typescript
  movements(): Observable<PointMovementPage> {
    return this.unavailable.movements();
  }
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/mappers/point-finance.mapper.ts projects/shared/src/core/api/point-finance
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
```
