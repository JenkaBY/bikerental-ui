# Task 013: PointAdminStore - drop the master/detail create mode and first-point defaulting

> **Applied Skill:** `angular-signals` - keep the store's public surface minimal and read-only via `computed()`. Design FR-01 §2 "PointAdminStore (Shared, modified)" - drop the "select the first point after load" defaulting and the master/detail selection rules; keep `load()`, `points()`, `nameBySlug()`, `create()`. FR-02 adds `loadOne(slug)` on top of the `select()` kept here.

## 1. Objective

Remove the master/detail-only state from `PointAdminStore` now that no screen uses it (task-012
deleted `PointDetailComponent`): `_creating`, `creating`, `startCreate()`, the auto-select of the
first point in `load()`, the `cancelEdit()` re-selection, and the `select()` call in `create()`.
`select()`, `selected`, `selectedSlug`, `editing`, `startEdit()`, `cancelEdit()`, `update()`,
`changeStatus()` stay (FR-02's Profile tab and status actions use them).

Other users of this store (`equipment-list.component.ts`, `rental-filter.component.ts`,
`analytics/point-select.component.ts`) only use `load()`, `points()`, `nameBySlug()` and are not
affected.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/point-admin.store.ts`
* **Action:** Modify Existing File (replace whole content)

## 3. Code Implementation

**Imports Required:** unchanged (shown in the snippet).

**Code to Add/Replace:**

* **Location:** `projects/shared/src/core/state/point-admin.store.ts` - replace the entire file with:
* **Snippet:**

```typescript
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { RentalPointsService, RequestOptions } from '../api/generated';
import { PointMapper } from '../mappers';
import type { Point, PointStatus, PointWrite } from '../models';

const MAX_POINTS = 100;

@Injectable()
export class PointAdminStore {
  private readonly service = inject(RentalPointsService);

  private readonly _points = signal<Point[]>([]);
  private readonly _selectedSlug = signal<string | null>(null);
  private readonly _editing = signal(false);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);

  readonly points = computed(() => this._points());
  readonly selectedSlug = computed(() => this._selectedSlug());
  readonly selected = computed(
    () => this._points().find((p) => p.slug === this._selectedSlug()) ?? null,
  );
  readonly nameBySlug = computed(() => new Map(this._points().map((p) => [p.slug, p.name])));
  readonly editing = computed(() => this._editing());
  readonly loading = computed(() => this._loading());
  readonly saving = computed(() => this._saving());

  load(): Observable<void> {
    this._loading.set(true);
    return this.service.searchPoints({ page: 0, size: MAX_POINTS, sort: ['name'] }).pipe(
      map((page) => (page.items ?? []).map(PointMapper.fromResponse)),
      tap((points) => this._points.set(points)),
      map(() => undefined as void),
      finalize(() => this._loading.set(false)),
    );
  }

  select(slug: string): void {
    this._editing.set(false);
    this._selectedSlug.set(slug);
  }

  startEdit(): void {
    this._editing.set(this.selected()?.status !== 'PERMANENTLY_CLOSED');
  }

  cancelEdit(): void {
    this._editing.set(false);
  }

  create(write: PointWrite, options?: RequestOptions<'json'>): Observable<Point> {
    this._saving.set(true);
    return this.service.registerPoint(PointMapper.toCreateRequest(write), undefined, options).pipe(
      map(PointMapper.fromResponse),
      tap((created) => this._points.set([...this._points(), created])),
      finalize(() => this._saving.set(false)),
    );
  }

  update(slug: string, write: PointWrite, options?: RequestOptions<'json'>): Observable<Point> {
    this._saving.set(true);
    return this.service
      .updatePoint(slug, PointMapper.toUpdateRequest(write), undefined, options)
      .pipe(
        map(PointMapper.fromResponse),
        tap((updated) => {
          this.replace(updated);
          this._editing.set(false);
        }),
        finalize(() => this._saving.set(false)),
      );
  }

  changeStatus(slug: string, status: PointStatus): Observable<Point> {
    this._saving.set(true);
    return this.service.changeStatus(slug, { status }).pipe(
      map(PointMapper.fromResponse),
      tap((point) => this.replace(point)),
      finalize(() => this._saving.set(false)),
    );
  }

  private replace(point: Point): void {
    this._points.set(this._points().map((p) => (p.slug === point.slug ? point : p)));
  }
}
```

Before saving, search `projects/` (excluding `core/api/generated/`) for `startCreate` and
`.creating` used on a `PointAdminStore` instance. Expected: no hits. If any hit remains, stop and
report it.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/state/point-admin.store.ts
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
npx ng lint admin
```
