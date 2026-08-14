import { computed, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { AnalyticsService, CustomersService } from '../api/generated';
import type { ApiError } from '../errors/api-error.model';
import { ApiErrorParser } from '../errors/api-error.parser';
import { suppressErrorNotification } from '../errors/http-error-context';
import { AnalyticsCustomerMapper } from '../mappers/analytics-customer.mapper';
import {
  DEFAULT_CUSTOMER_SPEND_SORT,
  formatCustomerSpendSort,
  type CustomerAnalyticsRange,
  type CustomerAnalyticsSummary,
  type CustomerCounts,
  type CustomerSpendListState,
  type CustomerSpendRow,
  type CustomerSummaryBucket,
  type Page,
  type RevenueMetricKey,
  type RevenueMetrics,
} from '@ui-models';
import { toIsoDate } from '../../shared/utils/date.util';

interface SummaryLoad {
  readonly summary: CustomerAnalyticsSummary | null;
  readonly error: ApiError | null;
}

interface ListLoad {
  readonly page: Page<CustomerSpendRow> | null;
  readonly error: ApiError | null;
}

interface ListParams {
  readonly range: CustomerAnalyticsRange;
  readonly list: CustomerSpendListState;
}

const EMPTY_SUMMARY_LOAD: SummaryLoad = { summary: null, error: null };
const EMPTY_LIST_LOAD: ListLoad = { page: null, error: null };
const EMPTY_PAGE: Page<CustomerSpendRow> = { items: [], totalItems: 0 };
const DEFAULT_LIST: CustomerSpendListState = {
  pageIndex: 0,
  pageSize: 20,
  sort: DEFAULT_CUSTOMER_SPEND_SORT,
};

function sameRange(a: CustomerAnalyticsRange | null, b: CustomerAnalyticsRange | null): boolean {
  return (
    a?.from.getTime() === b?.from.getTime() &&
    a?.to.getTime() === b?.to.getTime() &&
    a?.granularity === b?.granularity &&
    a?.operatorId === b?.operatorId
  );
}

function sameList(a: CustomerSpendListState, b: CustomerSpendListState): boolean {
  return (
    a.pageIndex === b.pageIndex &&
    a.pageSize === b.pageSize &&
    a.sort.field === b.sort.field &&
    a.sort.direction === b.sort.direction
  );
}

@Injectable()
export class CustomerAnalyticsStore {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly customersService = inject(CustomersService);

  private readonly _range = signal<CustomerAnalyticsRange | null>(null, { equal: sameRange });
  private readonly _list = signal<CustomerSpendListState>(DEFAULT_LIST, { equal: sameList });
  private readonly _chartMetric = signal<RevenueMetricKey>('paidRentalRevenue');

  private readonly summaryResource = rxResource<SummaryLoad, CustomerAnalyticsRange | null>({
    params: () => this._range(),
    stream: ({ params }) => {
      if (!params) return of(EMPTY_SUMMARY_LOAD);
      return this.analyticsService
        .getCustomerSummary(
          {
            from: toIsoDate(params.from),
            to: toIsoDate(params.to),
            granularity: params.granularity,
            operatorId: params.operatorId,
          },
          'body',
          { context: suppressErrorNotification() },
        )
        .pipe(
          map(
            (response): SummaryLoad => ({
              summary: AnalyticsCustomerMapper.summaryFromResponse(response),
              error: null,
            }),
          ),
          catchError((err: unknown) =>
            of<SummaryLoad>({ summary: null, error: ApiErrorParser.parse(err) }),
          ),
        );
    },
  });

  private readonly listResource = rxResource<ListLoad, ListParams | null>({
    params: () => {
      const range = this._range();
      return range ? { range, list: this._list() } : null;
    },
    stream: ({ params }) => {
      if (!params) return of(EMPTY_LIST_LOAD);
      return this.analyticsService
        .getRankedCustomers(
          {
            from: toIsoDate(params.range.from),
            to: toIsoDate(params.range.to),
            operatorId: params.range.operatorId,
            page: params.list.pageIndex,
            size: params.list.pageSize,
            sort: formatCustomerSpendSort(params.list.sort),
          },
          'body',
          { context: suppressErrorNotification() },
        )
        .pipe(
          map(AnalyticsCustomerMapper.spendPageFromResponse),
          switchMap((page) => this.enrich(page)),
          map((page): ListLoad => ({ page, error: null })),
          catchError((err: unknown) =>
            of<ListLoad>({ page: null, error: ApiErrorParser.parse(err) }),
          ),
        );
    },
  });

  readonly summary = computed(() => this.summaryResource.value()?.summary ?? null);
  readonly counts = computed<CustomerCounts | null>(() => this.summary()?.counts ?? null);
  readonly summaryTotals = computed<RevenueMetrics | null>(() => this.summary()?.totals ?? null);
  readonly summaryBuckets = computed<readonly CustomerSummaryBucket[]>(
    () => this.summary()?.buckets ?? [],
  );
  readonly summaryLoading = this.summaryResource.isLoading;
  readonly summaryError = computed<ApiError | null>(
    () => this.summaryResource.value()?.error ?? null,
  );
  readonly chartMetric = computed(() => this._chartMetric());

  readonly hasSeries = computed(() => {
    const summary = this.summary();
    return !!summary && summary.granularity !== 'TOTAL' && summary.buckets.length > 1;
  });

  readonly operatorFilterActive = computed(() => !!this._range()?.operatorId);

  readonly listPage = computed(() => this.listResource.value()?.page ?? EMPTY_PAGE);
  readonly rows = computed<readonly CustomerSpendRow[]>(() => this.listPage().items);
  readonly totalItems = computed(() => this.listPage().totalItems);
  readonly pageIndex = computed(() => this._list().pageIndex);
  readonly pageSize = computed(() => this._list().pageSize);
  readonly sort = computed(() => this._list().sort);
  readonly listLoading = this.listResource.isLoading;
  readonly listError = computed<ApiError | null>(() => this.listResource.value()?.error ?? null);
  readonly listEmpty = computed(
    () => !this.listLoading() && !this.listError() && this.rows().length === 0,
  );

  setRange(range: CustomerAnalyticsRange): void {
    this._range.set(range);
  }

  setList(list: CustomerSpendListState): void {
    this._list.set(list);
  }

  setChartMetric(metric: RevenueMetricKey): void {
    this._chartMetric.set(metric);
  }

  reload(): void {
    this.summaryResource.reload();
    this.listResource.reload();
  }

  private enrich(page: Page<CustomerSpendRow>): Observable<Page<CustomerSpendRow>> {
    const customerIds = [...new Set(page.items.map((row) => row.customerId).filter(Boolean))];
    return (
      customerIds.length
        ? this.customersService.getCustomersBatch(customerIds, 'body', {
            context: suppressErrorNotification(),
          })
        : of([])
    ).pipe(
      map((customers) => {
        const byId = new Map(customers.map((c) => [c.id, c]));
        const items = page.items.map((row) => {
          const c = byId.get(row.customerId);
          return c
            ? {
                ...row,
                customer: {
                  id: c.id,
                  phone: c.phone,
                  name: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || undefined,
                },
              }
            : row;
        });
        return { ...page, items };
      }),
      catchError(() => of(page)),
    );
  }
}
