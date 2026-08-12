import type {
  RevenueGranularity,
  RevenueMetricGroup,
  RevenueMetricKey,
} from '../core/models/analytics-revenue.model';
import { Labels } from './constant/labels';

export interface RevenueMetricMeta {
  readonly key: RevenueMetricKey;
  readonly label: string;
  readonly hint: string;
  readonly group: RevenueMetricGroup;
}

export const REVENUE_METRIC_META: Record<RevenueMetricKey, RevenueMetricMeta> = {
  accruedRentalRevenue: {
    key: 'accruedRentalRevenue',
    label: Labels.AnalyticsMetricAccruedRentalRevenue,
    hint: Labels.AnalyticsMetricAccruedRentalRevenueHint,
    group: 'revenue',
  },
  paidRentalRevenue: {
    key: 'paidRentalRevenue',
    label: Labels.AnalyticsMetricPaidRentalRevenue,
    hint: Labels.AnalyticsMetricPaidRentalRevenueHint,
    group: 'revenue',
  },
  penaltyRevenue: {
    key: 'penaltyRevenue',
    label: Labels.AnalyticsMetricPenaltyRevenue,
    hint: Labels.AnalyticsMetricPenaltyRevenueHint,
    group: 'revenue',
  },
  writtenOffAmount: {
    key: 'writtenOffAmount',
    label: Labels.AnalyticsMetricWrittenOffAmount,
    hint: Labels.AnalyticsMetricWrittenOffAmountHint,
    group: 'forgone',
  },
  walletDeposits: {
    key: 'walletDeposits',
    label: Labels.AnalyticsMetricWalletDeposits,
    hint: Labels.AnalyticsMetricWalletDepositsHint,
    group: 'cashMovement',
  },
  walletWithdrawals: {
    key: 'walletWithdrawals',
    label: Labels.AnalyticsMetricWalletWithdrawals,
    hint: Labels.AnalyticsMetricWalletWithdrawalsHint,
    group: 'cashMovement',
  },
};

export const REVENUE_METRIC_GROUP_LABELS: Record<RevenueMetricGroup, string> = {
  revenue: Labels.AnalyticsGroupRevenue,
  forgone: Labels.AnalyticsGroupForgone,
  cashMovement: Labels.AnalyticsGroupCashMovement,
};

export const REVENUE_METRIC_GROUP_ORDER: readonly RevenueMetricGroup[] = [
  'revenue',
  'forgone',
  'cashMovement',
];

export const REVENUE_GRANULARITY_LABELS: Record<RevenueGranularity, string> = {
  DAY: Labels.AnalyticsGranularityDay,
  WEEK: Labels.AnalyticsGranularityWeek,
  MONTH: Labels.AnalyticsGranularityMonth,
  TOTAL: Labels.AnalyticsGranularityTotal,
};

export const REVENUE_GRANULARITIES: readonly RevenueGranularity[] = [
  'DAY',
  'WEEK',
  'MONTH',
  'TOTAL',
];
