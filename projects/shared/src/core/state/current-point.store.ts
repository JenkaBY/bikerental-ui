import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { RentalPointsService } from '../api/generated';
import { PointMapper } from '../mappers';
import type { Point } from '../models';

const MAX_POINTS = 100;

@Injectable({ providedIn: 'root' })
export class CurrentPointStore {
  private readonly service = inject(RentalPointsService);

  private readonly _points = signal<Point[]>([]);

  readonly current = computed(() => this._points()[0] ?? null);

  load(): Observable<void> {
    return this.service.searchPoints({ page: 0, size: MAX_POINTS, sort: ['name'] }, 'ACTIVE').pipe(
      map((page) => (page.items ?? []).map(PointMapper.fromResponse)),
      tap((points) => this._points.set(points)),
      map(() => undefined as void),
    );
  }
}
