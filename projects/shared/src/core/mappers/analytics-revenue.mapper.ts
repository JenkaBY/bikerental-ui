import type { OperatorRevenueBucketResponse, OperatorRevenueReportResponse } from '@api-models';
import {
  REVENUE_METRIC_KEYS,
  type RevenueBucket,
  type RevenueDimensionRow,
  type RevenueGranularity,
  type RevenueMetricKey,
  type RevenueMetrics,
  type RevenueReport,
} from '@ui-models';
import { parseDate } from '../../shared/utils/date.util';
import { makeMoney } from './money.mapper';

interface RevenueMetricsResponseLike {
  accruedRentalRevenue?: number;
  paidRentalRevenue?: number;
  writtenOffAmount?: number;
  penaltyRevenue?: number;
  walletDeposits?: number;
  walletWithdrawals?: number;
}

interface RevenueBucketResponseLike {
  bucketStart?: string;
  bucketEnd?: string;
  bucketTotals?: RevenueMetricsResponseLike;
}

interface RevenueReportResponseLike<B extends RevenueBucketResponseLike> {
  from?: string;
  to?: string;
  granularity?: RevenueGranularity;
  buckets?: B[];
  totals?: RevenueMetricsResponseLike;
}

export class AnalyticsRevenueMapper {
  static metricsFromResponse(r: RevenueMetricsResponseLike | undefined): RevenueMetrics {
    const result = {} as Record<RevenueMetricKey, RevenueMetrics[RevenueMetricKey]>;
    for (const key of REVENUE_METRIC_KEYS) {
      result[key] = makeMoney(r?.[key] ?? 0);
    }
    return result;
  }

  static fromResponse<B extends RevenueBucketResponseLike>(
    r: RevenueReportResponseLike<B>,
    extractRows: (bucket: B) => readonly RevenueDimensionRow[],
  ): RevenueReport {
    return {
      from: parseDate(r.from) ?? new Date(0),
      to: parseDate(r.to) ?? new Date(0),
      granularity: r.granularity ?? 'DAY',
      buckets: (r.buckets ?? []).map(
        (bucket): RevenueBucket => ({
          start: parseDate(bucket.bucketStart) ?? new Date(0),
          end: parseDate(bucket.bucketEnd) ?? new Date(0),
          rows: extractRows(bucket),
          totals: AnalyticsRevenueMapper.metricsFromResponse(bucket.bucketTotals),
        }),
      ),
      totals: AnalyticsRevenueMapper.metricsFromResponse(r.totals),
    };
  }

  static operatorReportFromResponse(r: OperatorRevenueReportResponse): RevenueReport {
    return AnalyticsRevenueMapper.fromResponse(r, (bucket: OperatorRevenueBucketResponse) =>
      (bucket.operators ?? []).map((row) => ({
        key: row.operatorId ?? '',
        metrics: AnalyticsRevenueMapper.metricsFromResponse(row.metrics),
      })),
    );
  }
}
