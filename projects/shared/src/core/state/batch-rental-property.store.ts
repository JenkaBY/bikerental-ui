import { computed, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { CustomersService, EquipmentsCatalogueService } from '../api/generated';
import { CustomerMapper, EquipmentSearchItemMapper } from '../mappers';
import type { Customer, EquipmentSearchItem } from '@ui-models';

export interface BatchRentalPropertyParams {
  equipmentIds: number[];
  customerId: string | null;
}

export interface BatchRentalPropertyResult {
  customer: Customer | null;
  equipmentItems: EquipmentSearchItem[];
}

@Injectable()
export class BatchRentalPropertyStore {
  private readonly customersService = inject(CustomersService);
  private readonly equipmentsCatalogueService = inject(EquipmentsCatalogueService);

  private readonly _params = signal<BatchRentalPropertyParams>({
    equipmentIds: [],
    customerId: null,
  });

  private buildFetch({
    equipmentIds,
    customerId,
  }: BatchRentalPropertyParams): Observable<BatchRentalPropertyResult> {
    if (!customerId && equipmentIds.length === 0) {
      return of({ customer: null, equipmentItems: [] as EquipmentSearchItem[] });
    }
    return forkJoin({
      customer: customerId
        ? this.customersService.getById(customerId).pipe(map((r) => CustomerMapper.fromResponse(r)))
        : of(null),
      equipmentItems:
        equipmentIds.length > 0
          ? this.equipmentsCatalogueService
              .getBatchEquipments(equipmentIds)
              .pipe(map((batch) => batch.map((r) => EquipmentSearchItemMapper.fromResponse(r))))
          : of([] as EquipmentSearchItem[]),
    });
  }

  private readonly resource = rxResource<BatchRentalPropertyResult, BatchRentalPropertyParams>({
    params: () => this._params(),
    stream: ({ params }) => this.buildFetch(params),
  });

  readonly isLoading = this.resource.isLoading;
  readonly loadError = computed(() => this.resource.error() != null);
  readonly customer = computed<Customer | null>(() => this.resource.value()?.customer ?? null);
  readonly equipmentItems = computed<EquipmentSearchItem[]>(
    () => this.resource.value()?.equipmentItems ?? [],
  );

  load(params: BatchRentalPropertyParams): void {
    this._params.set(params);
  }

  reload(): void {
    this.resource.reload();
  }

  fetch$(params: BatchRentalPropertyParams): Observable<BatchRentalPropertyResult> {
    return this.buildFetch(params);
  }
}
