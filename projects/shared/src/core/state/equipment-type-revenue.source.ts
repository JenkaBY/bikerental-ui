import { computed, inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AnalyticsService } from '../api/generated';
import type { EquipmentTypeRevenueFilterParams } from '@api-models';
import { AnalyticsRevenueMapper } from '../mappers/analytics-revenue.mapper';
import { EQUIPMENT_REVENUE_METRIC_KEYS, type RevenueQuery, type RevenueReport } from '@ui-models';
import { suppressErrorNotification } from '../errors/http-error-context';
import { Labels } from '../../shared/constant/labels';
import { toIsoDate } from '../../shared/utils/date.util';
import { EquipmentTypeStore } from './equipment-type.store';
import type { RevenueReportSource } from './revenue-report-source';

@Injectable({ providedIn: 'root' })
export class EquipmentTypeRevenueSource implements RevenueReportSource {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly equipmentTypeStore = inject(EquipmentTypeStore);

  readonly id = 'equipment-types' as const;
  readonly tabLabel = Labels.AnalyticsEquipmentTypesTab;
  readonly dimensionColumnLabel = Labels.AnalyticsDimensionColumnEquipmentType;
  readonly metricKeys = EQUIPMENT_REVENUE_METRIC_KEYS;
  readonly requiresScope = false;
  readonly unattributedHint = Labels.AnalyticsUnattributedHintEquipment;

  readonly namesLoading = this.equipmentTypeStore.loading;

  private readonly nameMap = computed(() => {
    const names = new Map<string, string>();
    for (const type of this.equipmentTypeStore.types()) {
      names.set(type.slug, type.name || type.slug);
    }
    return names;
  });

  load(query: RevenueQuery): Observable<RevenueReport> {
    const params: EquipmentTypeRevenueFilterParams = {
      from: toIsoDate(query.from),
      to: toIsoDate(query.to),
      granularity: query.granularity,
      operatorId: undefined,
      equipmentTypeSlug: query.dimensionId,
    };
    return this.analyticsService
      .getEquipmentTypeRevenue(params, 'body', { context: suppressErrorNotification() })
      .pipe(map(AnalyticsRevenueMapper.equipmentTypeReportFromResponse));
  }

  ensureNames(): void {
    if (this.equipmentTypeStore.types().length > 0 || this.equipmentTypeStore.loading()) return;
    this.equipmentTypeStore.load().subscribe();
  }

  nameFor(key: string): string {
    return this.nameMap().get(key) ?? key;
  }
}
