import { computed, inject, Injectable, signal } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import { CustomersService, EquipmentsCatalogueService, RentalsService } from '../api/generated';
import { RentalMapper } from '../mappers/rental.mapper';
import type { CustomerRentalSummary, Page, RentalCustomerRef } from '@ui-models';
import type { PageRentalSummaryResponse } from '@api-models';
import { suppressErrorNotification } from '../errors/http-error-context';
import { toIsoDate } from '../../shared/utils/date.util';

type RentalStatusApiParam = Parameters<RentalsService['getRentals']>[1];

export interface RentalSearchQuery {
  statuses?: string[];
  customerId?: string;
  from?: Date;
  to?: Date;
  pageIndex: number;
  pageSize: number;
  withCustomer?: boolean;
}

export interface RentalSearchRow {
  readonly rental: CustomerRentalSummary;
  readonly customer?: RentalCustomerRef;
}

const EMPTY_PAGE: Page<RentalSearchRow> = { items: [], totalItems: 0 };

@Injectable()
export class RentalSearchStore {
  private readonly rentalsService = inject(RentalsService);
  private readonly equipmentsService = inject(EquipmentsCatalogueService);
  private readonly customersService = inject(CustomersService);

  private readonly _query = signal<RentalSearchQuery | null>(null);
  private readonly _page = signal<Page<RentalSearchRow>>(EMPTY_PAGE);
  private readonly _loading = signal(false);
  private readonly _error = signal(false);

  readonly items = computed(() => this._page().items);
  readonly totalItems = computed(() => this._page().totalItems);
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly pageIndex = computed(() => this._query()?.pageIndex ?? 0);
  readonly pageSize = computed(() => this._query()?.pageSize ?? 20);

  search(query: RentalSearchQuery): void {
    this._query.set(query);
    this.fetch(query);
  }

  reload(): void {
    const query = this._query();
    if (query) this.fetch(query);
  }

  private fetch(query: RentalSearchQuery): void {
    this._loading.set(true);
    this._error.set(false);
    const statuses = query.statuses ?? [];
    this.rentalsService
      .getRentals(
        { page: query.pageIndex, size: query.pageSize },
        statuses.length > 0 ? (statuses as RentalStatusApiParam) : undefined,
        query.customerId,
        undefined,
        query.from ? toIsoDate(query.from) : undefined,
        query.to ? toIsoDate(query.to) : undefined,
      )
      .pipe(
        switchMap((response) => this.enrich(response, query.withCustomer ?? false)),
        catchError(() => {
          this._error.set(true);
          return of<Page<RentalSearchRow> | null>(null);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe((page) => {
        if (page) this._page.set(page);
      });
  }

  private enrich(
    response: PageRentalSummaryResponse,
    withCustomer: boolean,
  ): Observable<Page<RentalSearchRow>> {
    const summaries = response.items ?? [];
    const rentals = summaries.map((r) => RentalMapper.fromRentalSummary(r));
    const totalItems = response.totalItems ?? 0;

    const equipmentIds = [...new Set(rentals.flatMap((r) => r.equipment.map((e) => e.id)))];
    const customerIds = withCustomer
      ? [...new Set(summaries.map((s) => s.customerId).filter((id): id is string => id != null))]
      : [];

    return forkJoin({
      equipments: equipmentIds.length
        ? this.equipmentsService.getBatchEquipments(equipmentIds, 'body', {
            context: suppressErrorNotification(),
          })
        : of([]),
      customers: customerIds.length
        ? this.customersService.getCustomersBatch(customerIds, 'body', {
            context: suppressErrorNotification(),
          })
        : of([]),
    }).pipe(
      map(({ equipments, customers }) => {
        const nameMap = new Map(equipments.map((e) => [e.id, e.model]));
        const customerMap = new Map(customers.map((c) => [c.id, c]));
        const items = summaries.map((summary, index) => {
          const rental: CustomerRentalSummary = {
            ...rentals[index],
            equipment: rentals[index].equipment.map((e) => ({
              ...e,
              name: nameMap.get(e.id) ?? '',
            })),
          };
          const c =
            withCustomer && summary.customerId ? customerMap.get(summary.customerId) : undefined;
          const customer: RentalCustomerRef | undefined = c
            ? {
                id: c.id,
                phone: c.phone,
                name: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || undefined,
              }
            : undefined;
          return { rental, customer };
        });
        return { items, totalItems };
      }),
      catchError(() =>
        of<Page<RentalSearchRow>>({ items: rentals.map((rental) => ({ rental })), totalItems }),
      ),
    );
  }
}
