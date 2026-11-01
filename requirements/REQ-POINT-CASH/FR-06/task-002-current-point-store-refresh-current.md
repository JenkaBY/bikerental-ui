# Task 002: CurrentPointStore.refreshCurrent()

> **Applied Skill:** `angular-http` - generated `RentalPointsService.getPoint(slug, undefined, { context })` with `suppressErrorNotification()` (same call `PointAdminStore.loadOne` makes). `angular-signals` - immutable `signal.update`. AGENTS.md "Shared Import Convention" - relative imports inside `shared`. AGENTS.md API Error Handling - this background read must not toast, failure is silent by design (the startup copy of the point is kept). CLAUDE.md "UI state in stores" - the refreshed point lives in the store.

## 1. Objective

Add `refreshCurrent(): Observable<void>` to `CurrentPointStore`. It re-reads the working point
from `GET /api/points/{slug}`, replaces it in `_points` (so `current().status` is fresh), emits
once and completes. No working point: returns `EMPTY` and sends nothing. Any error: swallowed,
no notification, state unchanged. The caller subscribes (so it controls the lifetime).

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/current-point.store.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**Step 1 - imports.** Replace

```typescript
import { EMPTY, Observable } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { RentalPointsService } from '../api/generated';
import { PointMapper } from '../mappers';
```

with

```typescript
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { RentalPointsService } from '../api/generated';
import { suppressErrorNotification } from '../errors/http-error-context';
import { PointMapper } from '../mappers';
```

**Step 2 - method.** Insert directly below the `load()` method (before `select(slug: string)`):

```typescript
  refreshCurrent(): Observable<void> {
    const slug = this.currentSlug();
    if (!slug) return EMPTY;
    return this.service.getPoint(slug, undefined, { context: suppressErrorNotification() }).pipe(
      map(PointMapper.fromResponse),
      tap((fresh) => this._points.update((list) => this.replaceOrAppend(list, fresh))),
      map(() => undefined as void),
      catchError(() => of(undefined as void)),
    );
  }

  private replaceOrAppend(list: Point[], fresh: Point): Point[] {
    return list.some((p) => p.slug === fresh.slug)
      ? list.map((p) => (p.slug === fresh.slug ? fresh : p))
      : [...list, fresh];
  }
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/state/current-point.store.ts
npx ng build operator --configuration development
npx ng lint shared
```
