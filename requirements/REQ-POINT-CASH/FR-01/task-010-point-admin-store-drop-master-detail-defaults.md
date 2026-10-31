# Task 010: `PointAdminStore` — drop master/detail selection defaulting and create-mode state

> **Applied Skill:** `angular-signals` - Service State Pattern (private writable signals, public `computed()` selectors). `angular-data-flow-orchestrator` - Phase 3: the store keeps only state its consumers need; selection is no longer defaulted to "first point" (FR-02 drives selection from the route).

## 1. Objective

The list page no longer has a master/detail selection or an inline create mode. Remove from `PointAdminStore`:

* the "select first point after load" rule in `load()`;
* the "fall back to first point" rule in `cancelEdit()`;
* the create-mode state (`_creating`, `creating`, `startCreate()`), which is now owned by `PointProfileFormComponent`'s `mode` input.

Kept unchanged: `load()`, `points()`, `nameBySlug()`, `selectedSlug()`, `selected()`, `select()`, `editing()`, `startEdit()`, `cancelEdit()`, `create()`, `update()`, `changeStatus()`, `loading()`, `saving()`. Other consumers (`analytics/point-select.component.ts`, `rentals/rental-filter.component.ts`, `equipment/equipment-list.component.ts`, `point-status-actions.component.ts`) only use `load()` / `points()` / `nameBySlug()` / `saving()` / `changeStatus()` and are unaffected.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/point-admin.store.ts`
* **Action:** Modify Existing File (replace the whole file content)

## 3. Code Implementation

**Imports Required:** unchanged (shown in the snippet).

**Code to Add/Replace:**

* **Location:** Before replacing, use the Grep tool with pattern `startCreate|\.creating\(\)` on path `projects` (output mode: content). There must be NO match outside `projects/shared/src/core/state/point-admin.store.ts` and `projects/admin/src/app/points/point-profile-form.component.ts` (the form declares its OWN `creating` computed and does not call `store.creating()`). If any other file calls `startCreate()` or `store.creating()`, STOP and report. Then replace the WHOLE content of `projects/shared/src/core/state/point-admin.store.ts` with:
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
      tap((created) => {
        this._points.set([...this._points(), created]);
        this.select(created.slug);
      }),
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

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
npx ng lint admin
```
