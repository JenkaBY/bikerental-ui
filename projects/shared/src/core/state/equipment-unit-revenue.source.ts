import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AnalyticsService } from '../api/generated';
import type { EquipmentRevenueFilterParams } from '@api-models';
import { AnalyticsRevenueMapper } from '../mappers/analytics-revenue.mapper';
import { EQUIPMENT_REVENUE_METRIC_KEYS, type RevenueQuery, type RevenueReport } from '@ui-models';
import { suppressErrorNotification } from '../errors/http-error-context';
import { Labels } from '../../shared/constant/labels';
import { toIsoDate } from '../../shared/utils/date.util';
import { EquipmentUnitLabelStore } from './equipment-unit-label.store';
import type { RevenueReportSource } from './revenue-report-source';

@Injectable({ providedIn: 'root' })
export class EquipmentUnitRevenueSource implements RevenueReportSource {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly unitLabels = inject(EquipmentUnitLabelStore);

  readonly id = 'equipment-units' as const;
  readonly tabLabel = Labels.AnalyticsEquipmentUnitsTab;
  readonly dimensionColumnLabel = Labels.AnalyticsDimensionColumnEquipmentUnit;
  readonly metricKeys = EQUIPMENT_REVENUE_METRIC_KEYS;
  readonly requiresScope = true;
  readonly unattributedHint = Labels.AnalyticsUnattributedHintEquipment;

  readonly namesLoading = this.unitLabels.loading;

  load(query: RevenueQuery): Observable<RevenueReport> {
    const params: EquipmentRevenueFilterParams = {
      from: toIsoDate(query.from),
      to: toIsoDate(query.to),
      granularity: query.granularity,
      operatorId: undefined,
      equipmentTypeSlug: query.scopeId ?? '',
      equipmentId: query.dimensionId ? Number(query.dimensionId) : undefined,
    };
    return this.analyticsService
      .getEquipmentRevenue(params, 'body', { context: suppressErrorNotification() })
      .pipe(
        map(AnalyticsRevenueMapper.equipmentUnitReportFromResponse),
        switchMap((report) => this.unitLabels.ensure(this.idsFrom(report)).pipe(map(() => report))),
      );
  }

  ensureNames(): void {
    // Unit ids are only known once a report has loaded; labels are resolved as part of load().
  }

  nameFor(key: string): string {
    return this.unitLabels.labelFor(key);
  }

  private idsFrom(report: RevenueReport): number[] {
    const keys = new Set<string>();
    for (const bucket of report.buckets) {
      for (const row of bucket.rows) keys.add(row.key);
    }
    return [...keys].map((key) => Number(key)).filter((id) => Number.isFinite(id));
  }
}
