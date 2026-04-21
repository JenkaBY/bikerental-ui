import { computed, inject, Injectable, signal } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { catchError, defaultIfEmpty, finalize, map, switchMap, tap } from 'rxjs/operators';
import { EquipmentService } from '../api';
import { Equipment, EquipmentWrite, Page } from '@ui-models';
import { EquipmentStatusStore } from './equipment-status.store';
import { EquipmentTypeStore } from './equipment-type.store';
import { EquipmentMapper } from '../mappers';

@Injectable({ providedIn: 'root' })
export class EquipmentStore {
  private service = inject(EquipmentService);
  private equipmentTypeStore = inject(EquipmentTypeStore);
  private equipmentStatusStore = inject(EquipmentStatusStore);

  private readonly _page = signal<Page<Equipment>>({ items: [], totalItems: 0 });
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _filterStatus = signal<string | undefined>(undefined);
  private readonly _filterType = signal<string | undefined>(undefined);
  private readonly _pageIndex = signal(0);
  private readonly _pageSize = signal(20);

  readonly items = computed(() => this._page().items);
  readonly totalItems = computed(() => this._page().totalItems);
  readonly loading = computed(() => this._loading());
  readonly saving = computed(() => this._saving());
  readonly filterStatus = computed(() => this._filterStatus());
  readonly filterType = computed(() => this._filterType());
  readonly pageIndex = computed(() => this._pageIndex());
  readonly pageSize = computed(() => this._pageSize());

  load(): Observable<void> {
    this._loading.set(true);
    const types = this.equipmentTypeStore.types();
    const statuses = this.equipmentStatusStore.statuses();
    return this.service
      .search(this._filterStatus(), this._filterType(), {
        page: this._pageIndex(),
        size: this._pageSize(),
      })
      .pipe(
        map((page) => ({
          ...page,
          items: page.items.map((item) => EquipmentMapper.fromResponse(item, types, statuses)),
        })),
        tap((page) => this._page.set(page)),
        map(() => undefined as void),
        finalize(() => this._loading.set(false)),
        catchError(() => EMPTY),
      );
  }

  setFilterStatus(status: string | undefined): void {
    this._filterStatus.set(status);
    this._pageIndex.set(0);
  }

  setFilterType(type: string | undefined): void {
    this._filterType.set(type);
    this._pageIndex.set(0);
  }

  setPage(pageIndex: number, pageSize: number): void {
    this._pageIndex.set(pageIndex);
    this._pageSize.set(pageSize);
  }

  create(write: EquipmentWrite): Observable<Equipment> {
    this._saving.set(true);
    const types = this.equipmentTypeStore.types();
    const statuses = this.equipmentStatusStore.statuses();
    return this.service.create(EquipmentMapper.toRequest(write)).pipe(
      map((response) => EquipmentMapper.fromResponse(response, types, statuses)),
      switchMap((created) =>
        this.load().pipe(
          map(() => created),
          defaultIfEmpty(created),
        ),
      ),
      finalize(() => this._saving.set(false)),
    );
  }

  update(id: number, write: EquipmentWrite): Observable<Equipment> {
    this._saving.set(true);
    const types = this.equipmentTypeStore.types();
    const statuses = this.equipmentStatusStore.statuses();
    return this.service.update(id, EquipmentMapper.toRequest(write)).pipe(
      map((response) => EquipmentMapper.fromResponse(response, types, statuses)),
      tap((updated) => {
        this._page.update((p) => ({
          ...p,
          items: p.items.map((e) => (e.id === id ? updated : e)),
        }));
      }),
      finalize(() => this._saving.set(false)),
    );
  }
}
