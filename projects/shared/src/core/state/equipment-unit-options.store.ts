import { computed, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { map, of } from 'rxjs';
import { EquipmentsCatalogueService } from '../api/generated';
import { EquipmentTypeStore } from './equipment-type.store';
import { EquipmentMapper } from '../mappers';
import type { Equipment } from '@ui-models';

const PAGE_SIZE = 200;

@Injectable()
export class EquipmentUnitOptionsStore {
  private readonly service = inject(EquipmentsCatalogueService);
  private readonly equipmentTypeStore = inject(EquipmentTypeStore);

  private readonly _typeSlug = signal<string | undefined>(undefined);

  private readonly resource = rxResource<Equipment[], { typeSlug: string | undefined }>({
    params: () => ({ typeSlug: this._typeSlug() }),
    stream: ({ params: { typeSlug } }) => {
      if (!typeSlug) return of([]);
      const types = this.equipmentTypeStore.types();
      return this.service
        .searchEquipments({ page: 0, size: PAGE_SIZE }, typeSlug)
        .pipe(
          map((page) =>
            (page.items ?? []).map((item) => EquipmentMapper.fromResponse(item, types)),
          ),
        );
    },
  });

  readonly items = computed(() => this.resource.value() ?? []);
  readonly loading = this.resource.isLoading;

  setTypeSlug(typeSlug: string | undefined): void {
    this._typeSlug.set(typeSlug);
  }
}
