import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { CustomersService, MaintenanceService } from '../api/generated';
import type { PageDamageReportSummaryResponse } from '@api-models';
import { DamageReportMapper } from '../mappers/damage-report.mapper';
import { PageMapper } from '../mappers/page.mapper';
import type { CustomerRef, DamageReportFilter, DamageReportListItem, Page } from '../models';
import { suppressErrorNotification } from '../errors/http-error-context';
import { toIsoDate } from '../../shared/utils/date.util';
import { Labels } from '../../shared/constant/labels';

const DEFAULT_SORT = ['reportedAt,desc'];

export interface DamageReportSearchQuery extends DamageReportFilter {
  pageIndex: number;
  pageSize: number;
  withCustomer?: boolean;
}

const EMPTY_PAGE: Page<DamageReportListItem> = { items: [], totalItems: 0 };

@Injectable()
export class DamageReportStore {
  private readonly service = inject(MaintenanceService);
  private readonly customersService = inject(CustomersService);

  private readonly _query = signal<DamageReportSearchQuery | null>(null);
  private readonly _page = signal<Page<DamageReportListItem>>(EMPTY_PAGE);
  private readonly _customers = signal<ReadonlyMap<string, CustomerRef>>(new Map());
  private readonly _loading = signal(false);
  private readonly _error = signal(false);

  readonly items = computed(() => this._page().items);
  readonly totalItems = computed(() => this._page().totalItems);
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly pageIndex = computed(() => this._query()?.pageIndex ?? 0);
  readonly pageSize = computed(() => this._query()?.pageSize ?? 20);

  readonly hasPendingPenalty = computed(() =>
    this.items().some((item) => item.penalty && !item.penalty.isSettled),
  );

  readonly rentalWarningLabel = computed(() =>
    this.hasPendingPenalty()
      ? Labels.DamageReportRentalWarningUnpaid
      : Labels.DamageReportRentalWarning,
  );

  customer(customerId: string | undefined): CustomerRef | undefined {
    return customerId ? this._customers().get(customerId) : undefined;
  }

  search(query: DamageReportSearchQuery): void {
    this._query.set(query);
    this.fetch(query);
  }

  reload(): void {
    const query = this._query();
    if (query) this.fetch(query);
  }

  private fetch(query: DamageReportSearchQuery): void {
    this._loading.set(true);
    this._error.set(false);
    this.service
      .findDamageReports(
        {
          equipmentId: query.equipmentId,
          customerId: query.customerId,
          rentalId: query.rentalId,
          penaltyStatus: query.penaltyStatus,
          fromDate: query.from ? toIsoDate(query.from) : undefined,
          toDate: query.to ? toIsoDate(query.to) : undefined,
        },
        { page: query.pageIndex, size: query.pageSize, sort: DEFAULT_SORT },
        'body',
        { context: suppressErrorNotification() },
      )
      .pipe(
        switchMap((response) => this.enrich(response, query.withCustomer ?? false)),
        catchError(() => {
          this._error.set(true);
          return of(null);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe((result) => {
        if (result) {
          this._page.set(result.page);
          this._customers.set(result.customers);
        }
      });
  }

  private enrich(
    response: PageDamageReportSummaryResponse,
    withCustomer: boolean,
  ): Observable<{ page: Page<DamageReportListItem>; customers: ReadonlyMap<string, CustomerRef> }> {
    const page = PageMapper.fromResponse(response, DamageReportMapper.fromSummary);

    const customerIds = withCustomer
      ? [...new Set(page.items.map((item) => item.customerId).filter((id) => !!id))]
      : [];

    return (
      customerIds.length
        ? this.customersService.getCustomersBatch(customerIds as string[], 'body', {
            context: suppressErrorNotification(),
          })
        : of([])
    ).pipe(
      map((customers) => ({
        page,
        customers: new Map(
          customers.map((c) => [
            c.id,
            {
              id: c.id,
              phone: c.phone,
              name: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || undefined,
            } satisfies CustomerRef,
          ]),
        ) as ReadonlyMap<string, CustomerRef>,
      })),
      catchError(() => of({ page, customers: new Map() as ReadonlyMap<string, CustomerRef> })),
    );
  }
}
