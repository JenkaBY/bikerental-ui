import { computed, inject, Injectable, signal } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { EquipmentTypesService } from '../api/generated';
import { EquipmentType, EquipmentTypeWrite } from '../models';
import { EquipmentTypeMapper } from '../mappers';

@Injectable({ providedIn: 'root' })
export class EquipmentTypeStore {
  TYPE_CONFIG: Record<string, Partial<EquipmentType>> = {
    SPECIAL: { isForSpecialTariff: true },
    ANY: { isForSpecialTariff: true },
  };
  DEFAULT_CONFIG: Partial<EquipmentType> = { isForSpecialTariff: false };
  private service = inject(EquipmentTypesService);

  private readonly _types = signal<EquipmentType[]>([]);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);

  readonly types = computed(() => this._types());
  readonly typesForEquipment = computed(() => this._types().filter((t) => !t.isForSpecialTariff));
  readonly loading = computed(() => this._loading());
  readonly saving = computed(() => this._saving());

  load(): Observable<void> {
    this._loading.set(true);
    return this.service.getAllEquipmentTypes().pipe(
      map((responses) => responses.map(EquipmentTypeMapper.fromResponse)),
      tap((types) => {
        this._types.set(this.sortedBySlug(types));
      }),
      map(() => undefined as void),
      finalize(() => this._loading.set(false)),
      catchError(() => {
        return EMPTY;
      }),
    );
  }

  create(write: EquipmentTypeWrite): Observable<EquipmentType> {
    this._saving.set(true);
    return this.service.create(EquipmentTypeMapper.toCreateRequest(write)).pipe(
      map(EquipmentTypeMapper.fromResponse),
      tap((created) => {
        this._types.set(this.sortedBySlug([...this._types(), created]));
      }),
      finalize(() => this._saving.set(false)),
    );
  }

  update(write: EquipmentTypeWrite): Observable<EquipmentType> {
    this._saving.set(true);
    return this.service.update(write.slug, EquipmentTypeMapper.toUpdateRequest(write)).pipe(
      map(EquipmentTypeMapper.fromResponse),
      tap((updated) => {
        this._types.set(this._types().map((t) => (t.slug === updated.slug ? updated : t)));
      }),
      finalize(() => this._saving.set(false)),
    );
  }

  private sortedBySlug(types: EquipmentType[]): EquipmentType[] {
    return types
      .map((t) => ({ ...t, ...(this.TYPE_CONFIG[t.slug] || this.DEFAULT_CONFIG) }))
      .sort((a, b) => a.slug.localeCompare(b.slug));
  }
}
