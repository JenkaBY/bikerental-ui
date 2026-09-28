import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { RentalPointsService } from '../api/generated';
import { PointMapper } from '../mappers';
import type { Point } from '../models';
import { ProfileStore } from './profile.store';
import { UserStore } from './user.store';

const MAX_POINTS = 100;

@Injectable({ providedIn: 'root' })
export class CurrentPointStore {
  private readonly service = inject(RentalPointsService);
  private readonly userStore = inject(UserStore);
  private readonly profileStore = inject(ProfileStore);

  private readonly _points = signal<Point[]>([]);
  private readonly _switching = signal(false);

  readonly points = computed(() => this._points());
  readonly currentSlug = computed(() => this.userStore.workingPointSlug());
  readonly current = computed(
    () => this._points().find((p) => p.slug === this.currentSlug()) ?? null,
  );
  readonly canSwitch = computed(() => this._points().length > 1 && !this._switching());

  load(): Observable<void> {
    return this.service.searchPoints({ page: 0, size: MAX_POINTS, sort: ['name'] }).pipe(
      map((page) =>
        (page.items ?? [])
          .map(PointMapper.fromResponse)
          .filter((point) => point.status !== 'PERMANENTLY_CLOSED'),
      ),
      tap((points) => this._points.set(points)),
      map(() => undefined as void),
    );
  }

  select(slug: string): void {
    if (slug === this.currentSlug() || !this._points().some((p) => p.slug === slug)) {
      return;
    }
    this._switching.set(true);
    this.profileStore
      .saveWorkingPoint(slug)
      .pipe(finalize(() => this._switching.set(false)))
      .subscribe();
  }
}
