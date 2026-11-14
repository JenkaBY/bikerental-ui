import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { finalize, map, switchMap, tap } from 'rxjs/operators';
import { RentalPointsService, RequestOptions } from '../api/generated';
import { GeoService } from '../api/geo/geo.service';
import { PointMapper } from '../mappers';
import { suppressErrorNotification } from '../errors/http-error-context';
import type { GeoLocation, Point, PointDraft, PointStatus, PointWrite } from '../models';
import { GeoLocationLookupStore } from './geo-location-lookup.store';

const MAX_POINTS = 100;

@Injectable()
export class PointAdminStore {
  private readonly service = inject(RentalPointsService);
  private readonly geo = inject(GeoService);
  private readonly lookup = inject(GeoLocationLookupStore);

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
  readonly locations = this.lookup.byId;
  readonly selectedLocation = computed<GeoLocation | null>(() => {
    const id = this.selected()?.geoLocationId;
    return id ? (this.locations().get(id) ?? null) : null;
  });
  readonly nameBySlug = computed(() => new Map(this._points().map((p) => [p.slug, p.name])));
  readonly editing = computed(() => this._editing());
  readonly loading = computed(() => this._loading());
  readonly saving = computed(() => this._saving());

  load(): Observable<void> {
    this._loading.set(true);
    return this.service.searchPoints({ page: 0, size: MAX_POINTS, sort: ['name'] }).pipe(
      map((page) => (page.items ?? []).map(PointMapper.fromResponse)),
      tap((points) => {
        this._points.set(points);
        this.lookup.ensure(points.map((p) => p.geoLocationId));
      }),
      map(() => undefined as void),
      finalize(() => this._loading.set(false)),
    );
  }

  loadOne(slug: string): Observable<Point> {
    this.select(slug);
    this._loading.set(true);
    return this.service.getPoint(slug, undefined, { context: suppressErrorNotification() }).pipe(
      map(PointMapper.fromResponse),
      tap((point) => {
        this.upsert(point);
        this.lookup.ensure([point.geoLocationId]);
      }),
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

  create(draft: PointDraft, options?: RequestOptions<'json'>): Observable<Point> {
    this._saving.set(true);
    return this.toWrite(draft, options).pipe(
      switchMap((write) =>
        this.service.registerPoint(PointMapper.toCreateRequest(write), undefined, options),
      ),
      map(PointMapper.fromResponse),
      tap((created) => this._points.set([...this._points(), created])),
      finalize(() => this._saving.set(false)),
    );
  }

  update(slug: string, draft: PointDraft, options?: RequestOptions<'json'>): Observable<Point> {
    this._saving.set(true);
    return this.toWrite(draft, options).pipe(
      switchMap((write) =>
        this.service.updatePoint(slug, PointMapper.toUpdateRequest(write), undefined, options),
      ),
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

  private toWrite(draft: PointDraft, options?: RequestOptions<'json'>): Observable<PointWrite> {
    const { location, ...rest } = draft;
    const id$ =
      typeof location === 'number'
        ? of(location)
        : this.geo.saveLocation(location, options).pipe(
            tap((saved) => this.lookup.put(saved)),
            map((saved) => saved.id),
          );
    return id$.pipe(map((geoLocationId) => ({ ...rest, geoLocationId })));
  }

  private replace(point: Point): void {
    this._points.set(this._points().map((p) => (p.slug === point.slug ? point : p)));
  }

  private upsert(point: Point): void {
    const exists = this._points().some((p) => p.slug === point.slug);
    this._points.set(
      exists
        ? this._points().map((p) => (p.slug === point.slug ? point : p))
        : [...this._points(), point],
    );
  }
}
