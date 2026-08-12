import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';
import type { ApiError } from '../errors/api-error.model';
import { ApiErrorParser } from '../errors/api-error.parser';
import {
  REVENUE_METRIC_KEYS,
  type RevenueBucket,
  type RevenueMetricKey,
  type RevenueMetrics,
  type RevenueQuery,
  type RevenueReport,
} from '@ui-models';
import { makeMoney } from '../mappers/money.mapper';
import {
  REVENUE_REPORT_SOURCES,
  type RevenueReportId,
  type RevenueReportSource,
} from './revenue-report-source';

interface RevenueLoad {
  readonly report: RevenueReport | null;
  readonly error: ApiError | null;
}

const EMPTY_LOAD: RevenueLoad = { report: null, error: null };

@Injectable()
export class AnalyticsRevenueStore {
  private readonly sources = inject(REVENUE_REPORT_SOURCES);

  private readonly _reportId = signal<RevenueReportId>(this.sources[0]?.id ?? 'operators');
  private readonly _query = signal<RevenueQuery | null>(null);
  private readonly _metric = signal<RevenueMetricKey>('accruedRentalRevenue');

  private readonly resource = rxResource<
    RevenueLoad,
    { source: RevenueReportSource; query: RevenueQuery } | null
  >({
    params: () => {
      const query = this._query();
      const source = this.currentSource();
      return query && source ? { source, query } : null;
    },
    stream: ({ params }) => {
      if (!params) return of(EMPTY_LOAD);
      return params.source.load(params.query).pipe(
        map((report): RevenueLoad => ({ report, error: null })),
        catchError((err: unknown) =>
          of<RevenueLoad>({ report: null, error: ApiErrorParser.parse(err) }),
        ),
      );
    },
  });

  readonly reportId = computed(() => this._reportId());
  readonly metric = computed(() => this._metric());
  readonly source = computed(() => this.currentSource());
  readonly report = computed(() => this.resource.value()?.report ?? null);
  readonly buckets = computed<readonly RevenueBucket[]>(() => this.report()?.buckets ?? []);
  readonly totals = computed<RevenueMetrics | null>(() => this.report()?.totals ?? null);
  readonly loading = this.resource.isLoading;
  readonly error = computed<ApiError | null>(() => this.resource.value()?.error ?? null);

  readonly hasSeries = computed(() => {
    const report = this.report();
    return !!report && report.granularity !== 'TOTAL' && report.buckets.length > 1;
  });

  readonly dimensionKeys = computed(() => {
    const metric = this._metric();
    const totalsByKey = new Map<string, number>();
    for (const bucket of this.buckets()) {
      for (const row of bucket.rows) {
        totalsByKey.set(row.key, (totalsByKey.get(row.key) ?? 0) + row.metrics[metric].amount);
      }
    }
    return [...totalsByKey.entries()].sort((a, b) => b[1] - a[1]).map(([key]) => key);
  });

  constructor() {
    effect(() => {
      this.currentSource()?.ensureNames();
    });
  }

  setReportId(id: RevenueReportId): void {
    this._reportId.set(id);
  }

  setQuery(query: RevenueQuery): void {
    this._query.set(query);
  }

  setMetric(metric: RevenueMetricKey): void {
    this._metric.set(metric);
  }

  reload(): void {
    this.resource.reload();
  }

  unattributedFor(bucket: RevenueBucket): RevenueMetrics {
    const rowSums = new Map<RevenueMetricKey, number>();
    for (const key of REVENUE_METRIC_KEYS) rowSums.set(key, 0);
    for (const row of bucket.rows) {
      for (const key of REVENUE_METRIC_KEYS) {
        rowSums.set(key, (rowSums.get(key) ?? 0) + row.metrics[key].amount);
      }
    }
    const result = {} as Record<RevenueMetricKey, RevenueMetrics[RevenueMetricKey]>;
    for (const key of REVENUE_METRIC_KEYS) {
      const currency = bucket.totals[key].currency;
      result[key] = makeMoney(bucket.totals[key].amount - (rowSums.get(key) ?? 0), currency);
    }
    return result;
  }

  private currentSource(): RevenueReportSource | undefined {
    return this.sources.find((s) => s.id === this._reportId()) ?? this.sources[0];
  }
}
