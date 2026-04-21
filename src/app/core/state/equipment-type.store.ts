import { computed, inject, Injectable, signal } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { EquipmentTypeService } from '../api';
import { EquipmentType, EquipmentTypeWrite } from '../models';

@Injectable({ providedIn: 'root' })
export class EquipmentTypeStore {
  private service = inject(EquipmentTypeService);

  private readonly _types = signal<EquipmentType[]>([]);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);

  readonly types = computed(() => this._types());
  readonly loading = computed(() => this._loading());
  readonly saving = computed(() => this._saving());

  load(): Observable<void> {
    this._loading.set(true);
    return this.service.getAll().pipe(
      tap((types) => {
        this._types.set(this.sortedBySlug(types));
        this._loading.set(false);
      }),
      map(() => undefined as void),
      catchError(() => {
        this._loading.set(false);
        return EMPTY;
      }),
    );
  }

  create(write: EquipmentTypeWrite): Observable<EquipmentType> {
    this._saving.set(true);
    return this.service.create(write).pipe(
      tap((created) => {
        this._types.set(this.sortedBySlug([...this._types(), created]));
      }),
      finalize(() => this._saving.set(false)),
    );
  }

  update(write: EquipmentTypeWrite): Observable<EquipmentType> {
    this._saving.set(true);
    return this.service.update(write).pipe(
      tap((updated) => {
        this._types.set(this._types().map((t) => (t.slug === updated.slug ? updated : t)));
      }),
      finalize(() => this._saving.set(false)),
    );
  }

  private sortedBySlug(types: EquipmentType[]): EquipmentType[] {
    return types.slice().sort((a, b) => a.slug.localeCompare(b.slug));
  }
}
