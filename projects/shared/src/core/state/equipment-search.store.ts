import { computed, inject, Injectable, signal } from '@angular/core';
import { debounce, distinctUntilChanged, filter, map, of, timer } from 'rxjs';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { EquipmentService } from '../api/generated';
import { EquipmentTypeStore } from './equipment-type.store';
import { EquipmentSearchItemMapper } from '../mappers';
import type { EquipmentSearchItem } from '@ui-models';

const MIN_QUERY_LENGTH = 2;

interface SearchRequest {
  query: string | null;
}

@Injectable()
export class EquipmentSearchStore {
  private readonly equipmentService = inject(EquipmentService);
  private readonly equipmentTypeStore = inject(EquipmentTypeStore);

  private readonly _query = signal<string | null>(null);
  private readonly _debouncedQuery = toSignal(
    toObservable(this._query).pipe(
      debounce((query) => (query === null ? timer(0) : timer(300))),
      distinctUntilChanged(),
      filter((q) => q === null || q.length >= MIN_QUERY_LENGTH),
    ),
    { initialValue: null },
  );

  readonly resource = rxResource<EquipmentSearchItem[], SearchRequest>({
    params: () => ({ query: this._debouncedQuery() }),
    stream: ({ params: { query } }) => {
      if (!query) return of([]);
      return this.equipmentService
        .searchEquipments({ size: 20 }, 'AVAILABLE', undefined, query)
        .pipe(
          map((page) => {
            const types = this.equipmentTypeStore.typesForEquipment();
            return (page.items ?? []).map((r) => EquipmentSearchItemMapper.fromResponse(r, types));
          }),
        );
    },
  });

  readonly results = computed(() => this.resource.value() ?? []);
  readonly loading = this.resource.isLoading;
  readonly searchQuery = this._query.asReadonly();

  search(query: string | null): void {
    const value = query?.trim() === '' ? null : query;
    this._query.set(value);
  }
}
