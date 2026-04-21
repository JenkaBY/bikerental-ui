import { computed, inject, Injectable, signal } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { EquipmentStatusService } from '../api';
import { EquipmentStatus, EquipmentStatusWrite } from '../models';

@Injectable({ providedIn: 'root' })
export class EquipmentStatusStore {
  private service = inject(EquipmentStatusService);

  private readonly _statuses = signal<EquipmentStatus[]>([]);
  private readonly _loading = signal(false);

  readonly statuses = computed(() => this._statuses());
  readonly loading = computed(() => this._loading());

  load(): Observable<void> {
    this._loading.set(true);
    return this.service.getAll().pipe(
      tap((statuses) => {
        this._statuses.set(this.sortedBySlug(statuses));
        this._loading.set(false);
      }),
      map(() => undefined),
      catchError(() => {
        this._loading.set(false);
        return EMPTY;
      }),
    );
  }

  create(write: EquipmentStatusWrite): Observable<EquipmentStatus> {
    return this.service.create(write).pipe(
      tap((created) => {
        this._statuses.set(this.sortedBySlug([...this._statuses(), created]));
      }),
    );
  }

  update(slug: string, write: EquipmentStatusWrite): Observable<EquipmentStatus> {
    return this.service.update(slug, write).pipe(
      tap((updated) => {
        this._statuses.set(this._statuses().map((s) => (s.slug === slug ? updated : s)));
      }),
    );
  }

  private sortedBySlug(statuses: EquipmentStatus[]): EquipmentStatus[] {
    return statuses.slice().sort((a, b) => a.slug.localeCompare(b.slug));
  }
}
