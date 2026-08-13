import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import { AnalyticsService, EquipmentsCatalogueService } from '../api/generated';
import type { EquipmentRevenueFilterParams } from '@api-models';
import { AnalyticsRevenueMapper } from '../mappers/analytics-revenue.mapper';
import { EQUIPMENT_REVENUE_METRIC_KEYS, type RevenueQuery, type RevenueReport } from '@ui-models';
import { suppressErrorNotification } from '../errors/http-error-context';
import { Labels } from '../../shared/constant/labels';
import { toIsoDate } from '../../shared/utils/date.util';
import type { RevenueReportSource } from './revenue-report-source';

@Injectable({ providedIn: 'root' })
export class EquipmentUnitRevenueSource implements RevenueReportSource {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly equipmentsCatalogueService = inject(EquipmentsCatalogueService);

  readonly id = 'equipment-units' as const;
  readonly tabLabel = Labels.AnalyticsEquipmentUnitsTab;
  readonly dimensionColumnLabel = Labels.AnalyticsDimensionColumnEquipmentUnit;
  readonly metricKeys = EQUIPMENT_REVENUE_METRIC_KEYS;
  readonly requiresScope = true;
  readonly unattributedHint = Labels.AnalyticsUnattributedHintEquipment;

  private readonly _namesLoading = signal(false);
  readonly namesLoading = computed(() => this._namesLoading());

  private readonly labels = signal<ReadonlyMap<string, string>>(new Map());

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
        switchMap((report) => this.resolveLabels(report).pipe(map(() => report))),
      );
  }

  ensureNames(): void {
    // Unit ids are only known once a report has loaded; labels are resolved as part of load().
  }

  nameFor(key: string): string {
    return this.labels().get(key) ?? key;
  }

  private resolveLabels(report: RevenueReport): Observable<void> {
    const keys = new Set<string>();
    for (const bucket of report.buckets) {
      for (const row of bucket.rows) keys.add(row.key);
    }
    const cache = this.labels();
    const missingIds = [...keys]
      .filter((key) => !cache.has(key))
      .map((key) => Number(key))
      .filter((id) => Number.isFinite(id));

    if (missingIds.length === 0) return of(undefined);

    this._namesLoading.set(true);
    return this.equipmentsCatalogueService.getBatchEquipments(missingIds, 'body').pipe(
      tap((items) => {
        const next = new Map(this.labels());
        for (const item of items) {
          const label = item.model ? `${item.uid} — ${item.model}` : item.uid;
          next.set(String(item.id), label);
        }
        this.labels.set(next);
      }),
      map(() => undefined),
      catchError(() => of(undefined)),
      finalize(() => this._namesLoading.set(false)),
    );
  }
}
