# Task 005: PointAdminStore.loadOne(slug) - route-driven selection

> **Applied Skill:** `angular-signals` - store owns selection and loading flags. `error-handling` - the request is sent with `suppressErrorNotification()`; the caller (detail host) decides between "Point not found" + redirect and a generic error. Design FR-02 §4 - `GET /api/points/{slug}` [GEN].

## 1. Objective

Add `loadOne(slug)`: select the slug immediately (so tabs can configure from `selectedSlug()`),
fetch the point, and upsert it into `_points` so `selected()` returns it. Builds on the FR-01
version of the store (task-013 of FR-01).

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/point-admin.store.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** add below the existing `import { PointMapper } from '../mappers';` line:

```typescript
import { suppressErrorNotification } from '../errors/http-error-context';
```

**Code to Add/Replace:**

* **Location:** inside `class PointAdminStore`, directly below the `load(): Observable<void> { ... }` method.
* **Snippet:**

```typescript
  loadOne(slug: string): Observable<Point> {
    this.select(slug);
    this._loading.set(true);
    return this.service.getPoint(slug, undefined, { context: suppressErrorNotification() }).pipe(
      map(PointMapper.fromResponse),
      tap((point) => this.upsert(point)),
      finalize(() => this._loading.set(false)),
    );
  }
```

* **Location:** inside `class PointAdminStore`, directly below the existing `private replace(point: Point): void { ... }` method.
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
