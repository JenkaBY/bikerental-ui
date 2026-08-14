import type {
  CustomerAnalyticsSummaryResponse,
  CustomerEquipmentBreakdownResponse,
  CustomerEquipmentUnitRowResponse,
  PageCustomerSpendRowResponse,
} from '@api-models';
import type {
  CustomerAnalyticsSummary,
  CustomerEquipmentBreakdown,
  CustomerEquipmentTypeRow,
  CustomerEquipmentUnitRow,
  CustomerSpendRow,
  CustomerSummaryBucket,
  Page,
} from '@ui-models';
import { parseDate } from '../../shared/utils/date.util';
import { AnalyticsRevenueMapper } from './analytics-revenue.mapper';
import { PageMapper } from './page.mapper';

export class AnalyticsCustomerMapper {
  static summaryFromResponse(r: CustomerAnalyticsSummaryResponse): CustomerAnalyticsSummary {
    return {
      from: parseDate(r.from) ?? new Date(0),
      to: parseDate(r.to) ?? new Date(0),
      granularity: r.granularity ?? 'DAY',
      counts: {
        activeCustomers: r.customerCounts?.activeCustomers ?? 0,
        newCustomers: r.customerCounts?.newCustomers ?? 0,
        registeredCustomers: r.customerCounts?.registeredCustomers ?? 0,
      },
      buckets: (r.buckets ?? []).map(
        (bucket): CustomerSummaryBucket => ({
          start: parseDate(bucket.bucketStart) ?? new Date(0),
          end: parseDate(bucket.bucketEnd) ?? new Date(0),
          activeCustomers: bucket.activeCustomers ?? 0,
          totals: AnalyticsRevenueMapper.metricsFromResponse(bucket.bucketTotals),
        }),
      ),
      totals: AnalyticsRevenueMapper.metricsFromResponse(r.totals),
    };
  }

  static spendPageFromResponse(r: PageCustomerSpendRowResponse): Page<CustomerSpendRow> {
    return PageMapper.fromResponse(r, (row) => ({
      customerId: row.customerId ?? '',
      metrics: AnalyticsRevenueMapper.metricsFromResponse(row.metrics),
    }));
  }

  static breakdownFromResponse(r: CustomerEquipmentBreakdownResponse): CustomerEquipmentBreakdown {
    const unitsBySlug = new Map<string, CustomerEquipmentUnitRow[]>();
    for (const unit of r.units ?? []) {
      const slug = unit.equipmentTypeSlug ?? '';
      const row = AnalyticsCustomerMapper.unitRowFromResponse(unit);
      const existing = unitsBySlug.get(slug);
      if (existing) existing.push(row);
      else unitsBySlug.set(slug, [row]);
    }

    return {
      customerId: r.customerId ?? '',
      from: parseDate(r.from) ?? new Date(0),
      to: parseDate(r.to) ?? new Date(0),
      types: (r.types ?? []).map(
        (type): CustomerEquipmentTypeRow => ({
          equipmentTypeSlug: type.equipmentTypeSlug ?? '',
          metrics: AnalyticsRevenueMapper.metricsFromResponse(type.metrics),
          units: unitsBySlug.get(type.equipmentTypeSlug ?? '') ?? [],
        }),
      ),
      totals: AnalyticsRevenueMapper.metricsFromResponse(r.totals),
    };
  }

  private static unitRowFromResponse(
    unit: CustomerEquipmentUnitRowResponse,
  ): CustomerEquipmentUnitRow {
    return {
      equipmentId: String(unit.equipmentId ?? ''),
      equipmentTypeSlug: unit.equipmentTypeSlug ?? '',
      metrics: AnalyticsRevenueMapper.metricsFromResponse(unit.metrics),
    };
  }
}
