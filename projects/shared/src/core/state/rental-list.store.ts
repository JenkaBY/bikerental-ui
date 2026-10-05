import { computed, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { EMPTY, forkJoin, Observable, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import { CustomersService, EquipmentsCatalogueService, RentalsService } from '../api/generated';
import { RentalDashboardMapper } from '../mappers';
import { suppressErrorNotification } from '../errors';
import type { RentalListItem } from '@ui-models';
import type { DebtWriteOffRequest, RentalFilterParams, RentalSummaryResponse } from '@api-models';
import { toIsoDate } from '../../shared/utils/date.util';

export interface RentalFilter {
  activeFrom?: Date;
  activeTo?: Date;
  filter: 'ALL' | 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DEBT' | undefined;
  pointSlug?: string;
}

interface ActiveParams {
  pointSlug?: string;
}

function toStatusApiParam(filter: RentalFilter['filter']): RentalFilterParams['status'] {
  if (filter === 'ALL' || !filter) return undefined;
  if (filter === 'DRAFT') return ['DRAFT', 'AWAITING_SIGNATURE'];
  return [filter];
}

@Injectable()
export class RentalListStore {
  private readonly rentalsService = inject(RentalsService);
  private readonly customersService = inject(CustomersService);
  private readonly equipmentsCatalogueService = inject(EquipmentsCatalogueService);

  private readonly activeParams = signal<ActiveParams | null>(null);
  private readonly historyParams = signal<RentalFilter | null>(null);
  private readonly writingOffIds = signal<ReadonlySet<number>>(new Set<number>());

  private readonly activeResource = rxResource<RentalListItem[], ActiveParams | null>({
    params: () => this.activeParams(),
    stream: ({ params }) => {
      if (!params) return of([]);
      return this.rentalsService
        .getRentals({ status: ['ACTIVE'], pointSlug: params.pointSlug }, { page: 0, size: 100 })
        .pipe(
          switchMap((page) => this.enrichItems(page.items ?? [])),
          catchError(() => of<RentalListItem[]>([])),
        );
    },
  });

  private readonly historyResource = rxResource<RentalListItem[], RentalFilter | null>({
    params: () => this.historyParams(),
    stream: ({ params }) => {
      if (!params) return of([]);
      const filterParams: RentalFilterParams = {
        status: toStatusApiParam(params.filter),
        activeFrom: params.activeFrom ? toIsoDate(params.activeFrom) : undefined,
        activeTo: params.activeTo ? toIsoDate(params.activeTo) : undefined,
        pointSlug: params.pointSlug,
      };
      return this.rentalsService.getRentals(filterParams, { page: 0, size: 100 }).pipe(
        switchMap((page) => this.enrichItems(page.items ?? [])),
        catchError(() => of<RentalListItem[]>([])),
      );
    },
  });

  readonly activeRentals = computed(() => this.activeResource.value() ?? []);
  readonly historyRentals = computed(() => this.historyResource.value() ?? []);
  readonly isLoadingActive = this.activeResource.isLoading;
  readonly isLoadingHistory = this.historyResource.isLoading;
  readonly writingOffRentalIds = this.writingOffIds.asReadonly();

  loadActive(pointSlug?: string): void {
    this.activeParams.set({ pointSlug });
  }

  reloadActive(): void {
    this.activeResource.reload();
  }

  reloadHistory(): void {
    this.historyResource.reload();
  }

  loadByFilter(filter: RentalFilter['filter'] = 'ALL', pointSlug?: string): void {
    this.loadHistory(undefined, undefined, filter, pointSlug);
  }

  loadHistory(
    activeFrom: Date | undefined,
    activeTo: Date | undefined,
    filter: RentalFilter['filter'] = 'ALL',
    pointSlug?: string,
  ): void {
    this.historyParams.set({ activeFrom, activeTo, filter, pointSlug });
  }

  writeOffDebt(rentalId: number): Observable<void> {
    if (this.writingOffIds().has(rentalId)) {
      return EMPTY;
    }
    const request: DebtWriteOffRequest = {};
    this.setWritingOff(rentalId, true);
    return this.rentalsService
      .writeOffDebt(rentalId, request, 'body', { context: suppressErrorNotification() })
      .pipe(
        map(() => undefined as void),
        finalize(() => this.setWritingOff(rentalId, false)),
      );
  }

  private setWritingOff(rentalId: number, writingOff: boolean): void {
    this.writingOffIds.update((ids) => {
      const next = new Set(ids);
      if (writingOff) {
        next.add(rentalId);
      } else {
        next.delete(rentalId);
      }
      return next;
    });
  }

  private enrichItems(items: RentalSummaryResponse[]): Observable<RentalListItem[]> {
    if (items.length === 0) {
      return of([]);
    }
    const customerIds = [
      ...new Set(items.map((r) => r.customerId).filter((id): id is string => id != null)),
    ];
    const equipmentIds = [
      ...new Set(items.flatMap((r) => (r.equipments ?? []).map((e) => e.equipmentId))),
    ];
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
