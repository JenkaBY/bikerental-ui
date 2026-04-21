import { computed, inject, Injectable, signal } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { EquipmentStatusService } from '../api';
import { EquipmentStatus, EquipmentStatusWrite } from '../models';
import { EquipmentStatusMapper } from '../mappers';

@Injectable({ providedIn: 'root' })
export class EquipmentStatusStore {
  private service = inject(EquipmentStatusService);

  private readonly _statuses = signal<EquipmentStatus[]>([]);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);

  readonly statuses = computed(() => this._statuses());
  readonly loading = computed(() => this._loading());
  readonly saving = computed(() => this._saving());

  load(): Observable<void> {
    this._loading.set(true);
    return this.service.getAll().pipe(
      map((responses) => responses.map(EquipmentStatusMapper.fromResponse)),
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
    this._saving.set(true);
    return this.service.create(EquipmentStatusMapper.toCreateRequest(write)).pipe(
      map(EquipmentStatusMapper.fromResponse),
      tap((created) => {
        this._statuses.set(this.sortedBySlug([...this._statuses(), created]));
      }),
      finalize(() => this._saving.set(false)),
    );
  }

  update(slug: string, write: EquipmentStatusWrite): Observable<EquipmentStatus> {
    this._saving.set(true);
    return this.service.update(slug, EquipmentStatusMapper.toUpdateRequest(write)).pipe(
      map(EquipmentStatusMapper.fromResponse),
      tap((updated) => {
        this._statuses.set(this._statuses().map((s) => (s.slug === slug ? updated : s)));
      }),
      finalize(() => this._saving.set(false)),
    );
  }

  private sortedBySlug(statuses: EquipmentStatus[]): EquipmentStatus[] {
    return statuses.slice().sort((a, b) => a.slug.localeCompare(b.slug));
  }
}
