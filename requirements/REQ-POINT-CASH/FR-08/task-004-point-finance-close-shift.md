# Task 004: `PointFinanceService.closeShift`

> **Applied Skill:** `angular-http` - generated `FinanceService` injected, never raw `HttpClient`; mappers applied inside the wrapper so public signatures use domain types. AGENTS.md "API Error Handling" - `suppressErrorNotification()` so the caller handles errors locally. Mirrors `recordCollection(write, pointSlug | null)` exactly.

## 1. Objective

Add `closeShift(write, pointSlug)` to `PointFinanceService`. Non-null slug: explicit `X-Point-Slug` header (admin); null: header comes from the point interceptor (operator). Both suppress the global error toast (both already handled by `scopedOptions`). Requires task 001 and 003.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/api/point-finance/point-finance.service.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**Step 1 - imports.** In the `import type { ... } from '../../models';` block add (alphabetical):

```typescript
  ShiftClosure,
  ShiftClosureWrite,
```

**Step 2 - method.** Insert directly below the method `recordCollection(...)` (before `private static scopedOptions`):

```typescript
  closeShift(write: ShiftClosureWrite, pointSlug: string | null): Observable<ShiftClosure> {
    return this.finance
      .closeShift(
        PointFinanceMapper.closureToRequest(write),
        'body',
        PointFinanceService.scopedOptions(pointSlug),
      )
      .pipe(map((response) => PointFinanceMapper.closureFromResponse(response)));
  }
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/api/point-finance/point-finance.service.ts
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
npx ng lint shared
```
