import type { CustomerRef } from './customer.model';
import {
  REVENUE_METRIC_KEYS,
  type RevenueGranularity,
  type RevenueMetrics,
} from './analytics-revenue.model';

export interface CustomerCounts {
  readonly activeCustomers: number;
  readonly newCustomers: number;
  readonly registeredCustomers: number;
}

export interface CustomerSummaryBucket {
  readonly start: Date;
  readonly end: Date;
  readonly activeCustomers: number;
  readonly totals: RevenueMetrics;
}

export interface CustomerAnalyticsSummary {
  readonly from: Date;
  readonly to: Date;
  readonly granularity: RevenueGranularity;
  readonly counts: CustomerCounts;
  readonly buckets: readonly CustomerSummaryBucket[];
  readonly totals: RevenueMetrics;
}

export interface CustomerSpendRow {
  readonly customerId: string;
  readonly metrics: RevenueMetrics;
  readonly customer?: CustomerRef;
}

export interface CustomerEquipmentUnitRow {
  readonly equipmentId: string;
  readonly equipmentTypeSlug: string;
  readonly metrics: RevenueMetrics;
}

export interface CustomerEquipmentTypeRow {
  readonly equipmentTypeSlug: string;
  readonly metrics: RevenueMetrics;
  readonly units: readonly CustomerEquipmentUnitRow[];
}

export interface CustomerEquipmentBreakdown {
  readonly customerId: string;
  readonly from: Date;
  readonly to: Date;
  readonly types: readonly CustomerEquipmentTypeRow[];
  readonly totals: RevenueMetrics;
}

export const CUSTOMER_SPEND_SORT_FIELDS = [...REVENUE_METRIC_KEYS, 'customerId'] as const;
export type CustomerSpendSortField = (typeof CUSTOMER_SPEND_SORT_FIELDS)[number];
export type CustomerSpendSortDirection = 'asc' | 'desc';

export interface CustomerSpendSort {
  readonly field: CustomerSpendSortField;
  readonly direction: CustomerSpendSortDirection;
}

export const DEFAULT_CUSTOMER_SPEND_SORT: CustomerSpendSort = {
  field: 'paidRentalRevenue',
  direction: 'desc',
};

export const CUSTOMER_SPEND_PAGE_SIZE = 20;
export const MAX_CUSTOMER_SPEND_PAGE_SIZE = 100;

export interface CustomerAnalyticsRange {
  readonly from: Date;
  readonly to: Date;
  readonly granularity: RevenueGranularity;
  readonly operatorId?: string;
}

export interface CustomerSpendListState {
  readonly pageIndex: number;
  readonly pageSize: number;
  readonly sort: CustomerSpendSort;
}

function isCustomerSpendSortField(value: string): value is CustomerSpendSortField {
  return (CUSTOMER_SPEND_SORT_FIELDS as readonly string[]).includes(value);
}

export function parseCustomerSpendSort(raw: string | undefined): CustomerSpendSort {
  if (!raw) return DEFAULT_CUSTOMER_SPEND_SORT;
  const [field, direction] = raw.split(',');
  if (!field || !isCustomerSpendSortField(field)) return DEFAULT_CUSTOMER_SPEND_SORT;
  return { field, direction: direction === 'asc' ? 'asc' : 'desc' };
}

export function formatCustomerSpendSort(sort: CustomerSpendSort): string {
  return `${sort.field},${sort.direction}`;
}
