# Task 022: [BLOCKED - needs task-020, task-021 and FR-01 task-018] Wire movements in HttpPointLedgerReader

> **Applied Skill:** `angular-http` / AGENTS.md - call the generated `FinanceService`, map with `PointFinanceMapper`; no hand-built HTTP. Design FR-01 §0.2 - point in the `pointSlug` query parameter, no header. Backend contract item 3 - `size` ≤ 100 (already clamped by `PointFinanceService`), sort only `recordedAt,asc|desc`, period required. Errors are not suppressed: a failure takes the global toast and the store shows its failure state; a 400 refusal is shown the same way.

## 0. Precondition

* task-020 and task-021 done.
* FR-01 `task-018-blocked-backend-http-point-ledger-reader-positions-results.md` done (the file
  `projects/shared/src/core/api/point-finance/http-point-ledger.reader.ts` exists and the token
  factory points at it). If it is not done, stop and report - do not create the reader here.
* `getPointMovements` below is a placeholder for the generated name/signature from task-020;
  adapt how filter and paging arguments are passed to match it.

## 1. Objective

Replace the delegating `movements()` in `HttpPointLedgerReader` with the real call.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/api/point-finance/http-point-ledger.reader.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** add `PointMovementQuery` to the `import type { ... } from '../../models';` line.

* **Location:** replace the whole existing method

```typescript
  movements(): Observable<PointMovementPage> {
    return this.unavailable.movements();
  }
```

with:

```typescript
  movements(query: PointMovementQuery): Observable<PointMovementPage> {
    return this.finance
      .getPointMovements(
        {
          pointSlug: query.pointSlug,
          position: query.position,
          from: toIsoDate(query.period.from),
          to: toIsoDate(query.period.to),
        },
        {
          page: query.page,
          size: query.size,
          sort: [`recordedAt,${query.order === 'newest' ? 'desc' : 'asc'}`],
        },
      )
      .pipe(map((page) => PointFinanceMapper.movementPageFromResponse(page, query)));
  }
```

* **Then:** if no method of the class uses `this.unavailable` any more, delete the line
  `private readonly unavailable = new UnavailablePointLedgerReader();` and the
  `UnavailablePointLedgerReader` import. Keep `unavailable-point-ledger.reader.ts` itself (it stays
  the documented fallback; deleting it is a separate decision).

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/api/point-finance/http-point-ledger.reader.ts
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
```
