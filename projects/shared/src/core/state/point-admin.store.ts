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
  private readonly _creating = signal(false);
  private readonly _editing = signal(false);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);

  readonly points = computed(() => this._points());
  readonly selectedSlug = computed(() => this._selectedSlug());
  readonly selected = computed(
    () => this._points().find((p) => p.slug === this._selectedSlug()) ?? null,
  );
  readonly nameBySlug = computed(() => new Map(this._points().map((p) => [p.slug, p.name])));
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
        if (!this._creating() && !points.some((p) => p.slug === this._selectedSlug())) {
          this._selectedSlug.set(points[0]?.slug ?? null);
        }
      }),
      map(() => undefined as void),
      finalize(() => this._loading.set(false)),
    );
  }

  select(slug: string): void {
    this._creating.set(false);
    this._editing.set(false);
    this._selectedSlug.set(slug);
  }

  startEdit(): void {
    this._editing.set(this.selected()?.status !== 'PERMANENTLY_CLOSED');
  }

  cancelEdit(): void {
    this._creating.set(false);
    this._editing.set(false);
    if (this._selectedSlug() === null) {
      this._selectedSlug.set(this._points()[0]?.slug ?? null);
    }
  }

  startCreate(): void {
    this._creating.set(true);
    this._editing.set(true);
    this._selectedSlug.set(null);
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
