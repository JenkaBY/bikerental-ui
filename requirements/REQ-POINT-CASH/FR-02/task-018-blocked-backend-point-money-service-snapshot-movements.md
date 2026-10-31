# Task 018: [BLOCKED ON BACKEND] Implement `getSnapshot` / `getMovements` in `PointMoneyService`

> **Applied Skill:** `angular-http` / AGENTS.md *Three-Layer Data Pipeline* - the wrapper service in `core/api/` injects the generated service, maps internally and exposes domain types only; no direct `HttpClient`. `angular-di` - the implementation stays behind the `PointMoneyApi` token wired by `providePointMoneyApi()`. `error-handling` - requests are sent WITHOUT `suppressErrorNotification()`, so the global interceptor toasts snapshot/movement failures (design §5 step 10) while the stores render em-dashes / the empty state. FR-01 addressing convention - admin names the point with `X-Point-Slug` (same as `CustomerFinanceStore.atPoint`); `null` slug sends no header so the operator point interceptor supplies it.

## 1. Objective

**Precondition:** Tasks 016 and 017 succeeded AND FR-01 Task 015 is done (`projects/shared/src/core/api/point-money.service.ts` exists, `pending-point-money.api.ts` is deleted, and `PointMoneyService` contains placeholder `getSnapshot()` / `getMovements()` overrides returning `throwError(...)` — see the FR-01 Task 015 amendment reported with this FR). If any of these is not true, STOP and report.

Replace the two placeholder overrides with real implementations. After this task the detail header shows real balances and the Operations tab shows real movements.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/api/point-money.service.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

* **Location:** Step 1 — confirm generated names (from Task 016 Step 2). The snippet assumes:

| Placeholder used in snippet | Meaning |
|---|---|
| `FinanceService` / `this.finance` | generated service containing both endpoints (already injected by FR-01 Task 015) |
| `getPointAccountSnapshot` | method for `GET /api/finance/point-accounts/snapshot`, first param a filter object `{ date }` |
| `getPointAccountMovements` | method for `GET /api/finance/point-accounts/movements`, params `(filterParams: { accounts, fromDate, toDate }, pageable: Pageable, observe, options)` |

  If a generated method name or filter property name differs, use the generated one. If the endpoints live in a DIFFERENT generated service than `FinanceService`, add `private readonly <name> = inject(<Service>);` below the existing `finance` field and call it instead. If the snapshot method takes a positional `date: string` instead of an object, replace `{ date: toIsoDate(businessDate) }` with `toIsoDate(businessDate)`. If the movements method takes positional filter arguments, pass them in the generated order, followed by the pageable object, `'body'`, `atPoint(query.pointSlug)`.

* **Location:** Step 2 — add to the top of `projects/shared/src/core/api/point-money.service.ts`:
  * as the FIRST import line: `import { HttpHeaders } from '@angular/common/http';`
  * extend the existing `import { FinanceService } from './generated';` to `import { FinanceService, type RequestOptions } from './generated';`
  * directly below the `./generated` import: `import { POINT_SLUG_HEADER } from '../interceptors/point.interceptor';`
  * extend the existing `import type { ... } from '../models';` with `PointCashSnapshot`, `PointMovementPage`, `PointMovementQuery` (if not already present).
  * if `throwError` is now unused after Step 4, remove it from the `rxjs` import.

**Code to Add/Replace:**

* **Location:** Step 3 — directly ABOVE the line `@Injectable()` (leave one blank line after the snippet):
* **Snippet:**

```typescript
function atPoint(pointSlug: string | null): RequestOptions<'json'> {
  return pointSlug ? { headers: new HttpHeaders({ [POINT_SLUG_HEADER]: pointSlug }) } : {};
}
```

* **Location:** Step 4 — inside `class PointMoneyService`, DELETE the existing placeholder methods `override getSnapshot(): Observable<PointCashSnapshot> { ... }` and `override getMovements(): Observable<PointMovementPage> { ... }` and put this snippet in their place:
* **Snippet:**

```typescript
  override getSnapshot(pointSlug: string | null, businessDate: Date): Observable<PointCashSnapshot> {
    return this.finance
      .getPointAccountSnapshot({ date: toIsoDate(businessDate) }, 'body', atPoint(pointSlug))
      .pipe(map((r) => PointMoneyMapper.snapshotFromResponse(r, businessDate)));
  }

  override getMovements(query: PointMovementQuery): Observable<PointMovementPage> {
    return this.finance
      .getPointAccountMovements(
        {
          accounts: query.accounts,
          fromDate: query.fromDate ? toIsoDate(query.fromDate) : undefined,
          toDate: query.toDate ? toIsoDate(query.toDate) : undefined,
        },
        { page: query.page, size: query.size, sort: ['occurredAt,desc'] },
        'body',
        atPoint(query.pointSlug),
      )
      .pipe(
        map((page) => ({
          items: (page.items ?? []).map(PointMoneyMapper.movementFromResponse),
          total: page.totalItems ?? 0,
        })),
      );
  }
```

* **Location:** Step 5 — update the `COMPONENT_NAME: PointMoneyApi` block in `overview.md`: in its `CALLS:` entry, append ` Snapshot and movements send \`X-Point-Slug\` when a slug is given.` to the end of the line `- Generated \`FinanceService\` (via \`PointMoneyService\`) and \`PointMoneyMapper\`.` (written by FR-01 Task 015).

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/api/point-money.service.ts
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
npx ng lint admin
```
