import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { RentalPointsService } from '../api/generated';
import { PointMapper } from '../mappers';
import type { Point } from '../models';

const STORAGE_KEY = 'bikerental.currentPointId';
const MAX_POINTS = 100;

@Injectable({ providedIn: 'root' })
export class CurrentPointStore {
  private readonly service = inject(RentalPointsService);

  private readonly _points = signal<Point[]>([]);
  private readonly _selectedId = signal<string | null>(this.readCache());

  readonly points = computed(() => this._points());
  readonly current = computed(
    () => this._points().find((p) => p.id === this._selectedId()) ?? null,
  );
  readonly currentId = computed(() => this.current()?.id ?? null);
  readonly canSwitch = computed(() => this._points().length > 1);

  constructor() {
    effect(() => this.writeCache(this._selectedId()));
  }

  load(): Observable<void> {
    return this.service.searchPoints({ page: 0, size: MAX_POINTS, sort: ['name'] }, 'ACTIVE').pipe(
      map((page) => (page.items ?? []).map(PointMapper.fromResponse)),
      tap((points) => {
        this._points.set(points);
        if (!points.some((p) => p.id === this._selectedId())) {
          this._selectedId.set(points[0]?.id ?? null);
        }
      }),
      map(() => undefined as void),
    );
  }

  select(id: string): void {
    if (this._points().some((p) => p.id === id)) {
      this._selectedId.set(id);
    }
  }

  private readCache(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private writeCache(id: string | null): void {
    try {
      if (id === null) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, id);
      }
    } catch {
      return;
    }
  }
}
