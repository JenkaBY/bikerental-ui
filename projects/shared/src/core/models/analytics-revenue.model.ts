import { type Money } from './transaction.model';

export type RevenueGranularity = 'DAY' | 'WEEK' | 'MONTH' | 'TOTAL';

export const REVENUE_METRIC_KEYS = [
  'accruedRentalRevenue',
  'paidRentalRevenue',
  'writtenOffAmount',
  'penaltyRevenue',
  'walletDeposits',
  'walletWithdrawals',
] as const;

export type RevenueMetricKey = (typeof REVENUE_METRIC_KEYS)[number];

export type RevenueMetrics = Readonly<Record<RevenueMetricKey, Money>>;

export type RevenueMetricGroup = 'revenue' | 'forgone' | 'cashMovement';

export const REVENUE_METRIC_GROUPS: Readonly<Record<RevenueMetricKey, RevenueMetricGroup>> = {
  accruedRentalRevenue: 'revenue',
  paidRentalRevenue: 'revenue',
  penaltyRevenue: 'revenue',
  writtenOffAmount: 'forgone',
  walletDeposits: 'cashMovement',
  walletWithdrawals: 'cashMovement',
};

export interface RevenueDimensionRow {
  readonly key: string;
  readonly metrics: RevenueMetrics;
}

export interface RevenueBucket {
  readonly start: Date;
  readonly end: Date;
  readonly rows: readonly RevenueDimensionRow[];
  readonly totals: RevenueMetrics;
}

export interface RevenueReport {
  readonly from: Date;
  readonly to: Date;
  readonly granularity: RevenueGranularity;
  readonly buckets: readonly RevenueBucket[];
  readonly totals: RevenueMetrics;
}

export interface RevenueQuery {
  readonly from: Date;
  readonly to: Date;
  readonly granularity: RevenueGranularity;
  readonly dimensionId?: string;
  readonly scopeId?: string;
}

export const MAX_REVENUE_RANGE_DAYS = 366;

export const EQUIPMENT_REVENUE_METRIC_KEYS = [
  'accruedRentalRevenue',
  'paidRentalRevenue',
  'penaltyRevenue',
] as const satisfies readonly RevenueMetricKey[];
