# Task 003: PointFinanceService.recordCollection

> **Applied Skill:** `angular-http` - wrapper service injects the generated service, applies mappers internally, public signature uses domain types; `HttpContext` carries `suppressErrorNotification()`. `error-handling` - the dialog handles errors locally, so the global toast is always suppressed. Project note (FR-03 ad-hoc fix): generated `RequestOptions.headers` is `HttpHeaders`, never a plain object.

## 1. Objective

Expose `recordCollection(write, pointSlug | null)` over the generated `POST /api/finance/collections`. The admin names the point explicitly through `X-Point-Slug` (and `SKIP_POINT_SCOPE` so the interceptor does not interfere); `null` means "operator, let the point interceptor add the header" (used by FR-07).

The existing private helper `shiftOptions(pointSlug)` already builds exactly these options, so it is renamed `scopedOptions` and reused.

Requires tasks 001, 002.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/api/point-finance/point-finance.service.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** in the `import type { ... } from '../../models';` list add `CashCollection,` and `CashCollectionWrite,` (before `PointMovementPage,`).

**Step 1 - rename the helper.** Replace the two occurrences of `shiftOptions` (the call inside `getCurrentShift` and the method declaration at the bottom) with `scopedOptions`:

```typescript
    return this.finance.getRunningShift('body', PointFinanceService.scopedOptions(pointSlug)).pipe(
```

```typescript
  private static scopedOptions(pointSlug: string | null): RequestOptions<'json'> {
```

(the body of the helper is unchanged).

**Step 2 - add the method.**

* **Location:** inside the class, directly after `getCurrentShift(...)` and before `private static scopedOptions`.
* **Snippet:**

```typescript
  recordCollection(write: CashCollectionWrite, pointSlug: string | null): Observable<CashCollection> {
    return this.finance
      .recordCollection(
        PointFinanceMapper.collectionToRequest(write),
        'body',
        PointFinanceService.scopedOptions(pointSlug),
      )
      .pipe(map((response) => PointFinanceMapper.collectionFromResponse(response)));
  }
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/api/point-finance/point-finance.service.ts
npx ng build admin --configuration development
```
