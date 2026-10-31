# Task 003: `PointAdminStore.loadOne(slug)` and `canTransferFromPoint`

> **Applied Skill:** `angular-signals` - Service State Pattern: private writable signals, public `computed()` selectors. `angular-data-flow-orchestrator` - Phase 3: the store fetches through the generated `RentalPointsService` and maps with `PointMapper` so callers only see `Point`. `error-handling` - the caller passes `RequestOptions` (e.g. `{ context: suppressErrorNotification() }`) so a 404 is handled locally without a global toast.

## 1. Objective

Let the point detail page (Task 012) load exactly one point by its route slug via the existing `GET /api/points/{pointSlug}` (`RentalPointsService.getPoint`):

* `loadOne(slug, options?)` marks `slug` as selected **immediately** (so tabs can read `selectedSlug()` before the response arrives), fetches the point, upserts it into `points()` and returns the mapped `Point`. Errors (e.g. 404 `shared.resource.not_found`) are propagated to the caller.
* `canTransferFromPoint` — derived: the selected point's status is `ACTIVE`. Re-derives immediately after `changeStatus()` / `loadOne()` replace the point. Consumed by FR-03 / FR-04 / FR-05.

**Precondition:** FR-01 Task 010 is done (the store no longer has `_creating`, `creating`, `startCreate`). Verify with the Grep tool: pattern `startCreate` on path `projects/shared/src/core/state/point-admin.store.ts` must have 0 matches. Otherwise STOP and report.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/point-admin.store.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** none new. The file already imports `computed, inject, Injectable, signal`, `Observable`, `finalize, map, tap`, `RentalPointsService, RequestOptions`, `PointMapper` and `type { Point, PointStatus, PointWrite }`.

**Code to Add/Replace:**

* **Location:** Inside `class PointAdminStore`, directly below the existing line `readonly saving = computed(() => this._saving());`
* **Snippet:**

```typescript
  readonly canTransferFromPoint = computed(() => this.selected()?.status === 'ACTIVE');
```

* **Location:** Inside `class PointAdminStore`, directly below the closing `}` of the existing `load(): Observable<void> { ... }` method (i.e. between `load()` and `select(slug: string)`), leaving one blank line before and after.
* **Snippet:**

```typescript
  loadOne(slug: string, options?: RequestOptions<'json'>): Observable<Point> {
    this.select(slug);
    this._loading.set(true);
    return this.service.getPoint(slug, 'body', options).pipe(
      map(PointMapper.fromResponse),
      tap((point) => this.upsert(point)),
      finalize(() => this._loading.set(false)),
    );
  }
```

* **Location:** Inside `class PointAdminStore`, directly below the closing `}` of the existing `private replace(point: Point): void { ... }` method, so the new method becomes the last member of the class (leave one blank line between the two methods).
* **Snippet:**

```typescript
  private upsert(point: Point): void {
    const exists = this._points().some((p) => p.slug === point.slug);
    this._points.set(
      exists
        ? this._points().map((p) => (p.slug === point.slug ? point : p))
        : [...this._points(), point],
    );
  }
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/state/point-admin.store.ts
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
```
