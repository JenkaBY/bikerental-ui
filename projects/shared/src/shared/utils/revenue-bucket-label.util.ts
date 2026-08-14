import type { RevenueGranularity } from '../../core/models/analytics-revenue.model';
import { toIsoDate } from './date.util';

function monthLabel(start: Date): string {
  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
}

export function bucketAxisLabel(start: Date, granularity: RevenueGranularity): string {
  if (granularity === 'MONTH') return monthLabel(start);
  return toIsoDate(start);
}

export function bucketRangeLabel(start: Date, end: Date, granularity: RevenueGranularity): string {
  if (granularity === 'MONTH') return monthLabel(start);
  if (toIsoDate(start) === toIsoDate(end)) return toIsoDate(start);
  return `${toIsoDate(start)} — ${toIsoDate(end)}`;
}
