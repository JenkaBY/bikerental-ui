import { computed, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { CustomersService, EquipmentsCatalogueService, RentalsService } from '../api/generated';
import { RentalDashboardMapper } from '../mappers';
import type { RentalListItem } from '@ui-models';
import type { RentalSummaryResponse } from '@api-models';
import { toIsoDate } from '../../shared/utils/date.util';

@Injectable()
export class RentalListStore {
  private readonly rentalsService = inject(RentalsService);
  private readonly customersService = inject(CustomersService);
  private readonly equipmentsCatalogueService = inject(EquipmentsCatalogueService);

  private readonly historyParams = signal<{ dateFrom: string; dateTo: Date; filter: Date } | null>(
    null,
  );

  private readonly activeResource = rxResource<RentalListItem[], void>({
    stream: () =>
      this.rentalsService.getRentals({ page: 0, size: 100 }, 'ACTIVE').pipe(
        switchMap((page) => this.enrichItems(page.items ?? [])),
        catchError(() => of<RentalListItem[]>([])),
      ),
  });

  private readonly historyResource = rxResource<
    RentalListItem[],
    { dateFrom: Date; dateTo: Date } | null
  >({
    params: () => this.historyParams(),
    stream: ({ params }) => {
      if (!params) return of([]);
      const statusApi = params.filter === 'ALL' ? undefined : params.filter;
      return this.rentalsService
        .getRentals(
          { page: 0, size: 100 },
          statusApi,
          undefined,
          undefined,
          params.dateFrom ? toIsoDate(params.dateFrom) : undefined,
          params.dateTo ? toIsoDate(params.dateTo) : undefined,
        )
        .pipe(
          switchMap((page) => this.enrichItems(page.items ?? [])),
          catchError(() => of<RentalListItem[]>([])),
        );
    },
  });

  readonly activeRentals = computed(() => this.activeResource.value() ?? []);
  readonly historyRentals = computed(() => this.historyResource.value() ?? []);
  readonly isLoadingActive = this.activeResource.isLoading;
  readonly isLoadingHistory = this.historyResource.isLoading;

  loadActive(): void {
    this.activeResource.reload();
  }

  loadHistory(dateFrom: Date, dateTo: Date, filter: string): void {
    this.historyParams.set({ dateFrom, dateTo, filter });
  }

  private enrichItems(items: RentalSummaryResponse[]): Observable<RentalListItem[]> {
    if (items.length === 0) {
      return of([]);
    }
    const customerIds = [
      ...new Set(items.map((r) => r.customerId).filter((id): id is string => id != null)),
    ];
    const equipmentIds = [...new Set(items.flatMap((r) => r.equipmentIds ?? []))];
    return forkJoin({
      customers:
        customerIds.length > 0 ? this.customersService.getCustomersBatch(customerIds) : of([]),
      equipments:
        equipmentIds.length > 0
          ? this.equipmentsCatalogueService.getBatchEquipments(equipmentIds)
          : of([]),
    }).pipe(
      map(({ customers, equipments }) => {
        const customerMap = new Map(customers.map((c) => [c.id, c]));
        const equipmentNameMap = new Map(equipments.map((e) => [e.id, e.model]));
        return items.map((r) =>
          RentalDashboardMapper.toListItem(
            r,
            customerMap.get(r.customerId ?? '') ?? null,
            equipmentNameMap,
          ),
        );
      }),
    );
  }
}
