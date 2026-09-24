import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { RentalPointsService, RequestOptions } from '../api/generated';
import { PointMapper } from '../mappers';
import type { Point, PointStatus, PointStatusChangeResult, PointWrite } from '../models';

const MAX_POINTS = 100;

@Injectable()
export class PointAdminStore {
  private readonly service = inject(RentalPointsService);

  private readonly _points = signal<Point[]>([]);
  private readonly _selectedId = signal<string | null>(null);
  private readonly _creating = signal(false);
  private readonly _editing = signal(false);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);

  readonly points = computed(() => this._points());
  readonly selectedId = computed(() => this._selectedId());
  readonly selected = computed(
    () => this._points().find((p) => p.id === this._selectedId()) ?? null,
  );
  readonly creating = computed(() => this._creating());
  readonly editing = computed(() => this._editing() || this._creating());
  readonly loading = computed(() => this._loading());
  readonly saving = computed(() => this._saving());

  load(): Observable<void> {
    this._loading.set(true);
    return this.service.searchPoints({ page: 0, size: MAX_POINTS, sort: ['name'] }).pipe(
      map((page) => (page.items ?? []).map(PointMapper.fromResponse)),
      tap((points) => {
        this._points.set(points);
        if (!this._creating() && !points.some((p) => p.id === this._selectedId())) {
          this._selectedId.set(points[0]?.id ?? null);
        }
      }),
      map(() => undefined as void),
      finalize(() => this._loading.set(false)),
    );
  }

  select(id: string): void {
    this._creating.set(false);
    this._editing.set(false);
    this._selectedId.set(id);
  }

  startEdit(): void {
    this._editing.set(this.selected()?.status !== 'PERMANENTLY_CLOSED');
  }

  cancelEdit(): void {
    this._creating.set(false);
    this._editing.set(false);
    if (this._selectedId() === null) {
      this._selectedId.set(this._points()[0]?.id ?? null);
    }
  }

  startCreate(): void {
    this._creating.set(true);
    this._editing.set(true);
    this._selectedId.set(null);
  }

  create(write: PointWrite, options?: RequestOptions<'json'>): Observable<Point> {
    this._saving.set(true);
    return this.service.registerPoint(PointMapper.toCreateRequest(write), undefined, options).pipe(
      map(PointMapper.fromResponse),
      tap((created) => {
        this._points.set([...this._points(), created]);
        this.select(created.id);
      }),
      finalize(() => this._saving.set(false)),
    );
  }

  update(id: string, write: PointWrite, options?: RequestOptions<'json'>): Observable<Point> {
    this._saving.set(true);
    return this.service
      .updatePoint(id, PointMapper.toUpdateRequest(write), undefined, options)
      .pipe(
        map(PointMapper.fromResponse),
        tap((updated) => {
          this.replace(updated);
          this._editing.set(false);
        }),
        finalize(() => this._saving.set(false)),
      );
  }

  changeStatus(id: string, status: PointStatus): Observable<PointStatusChangeResult> {
    this._saving.set(true);
    return this.service.changeStatus(id, { status }).pipe(
      map(PointMapper.fromStatusChangeResponse),
      tap((result) => {
        if (result.point) {
          this.replace(result.point);
        }
      }),
      finalize(() => this._saving.set(false)),
    );
  }

  private replace(point: Point): void {
    this._points.set(this._points().map((p) => (p.id === point.id ? point : p)));
  }
}
