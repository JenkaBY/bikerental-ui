import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { AnalyticsService } from '../api/generated';
import type { PointRevenueFilterParams } from '@api-models';
import { AnalyticsRevenueMapper } from '../mappers/analytics-revenue.mapper';
import { POINT_REVENUE_METRIC_KEYS, type RevenueQuery, type RevenueReport } from '@ui-models';
import { suppressErrorNotification } from '../errors/http-error-context';
import { Labels } from '../../shared/constant/labels';
import { toIsoDate } from '../../shared/utils/date.util';
import { CurrentPointStore } from './current-point.store';
import type { RevenueReportSource } from './revenue-report-source';

@Injectable({ providedIn: 'root' })
export class PointRevenueSource implements RevenueReportSource {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly pointStore = inject(CurrentPointStore);

  readonly id = 'points' as const;
  readonly tabLabel = Labels.AnalyticsPointsTab;
  readonly dimensionColumnLabel = Labels.AnalyticsDimensionColumnPoint;
  readonly metricKeys = POINT_REVENUE_METRIC_KEYS;
  readonly requiresScope = false;
  readonly unattributedHint = '';
  readonly hasUnattributed = false;

  private readonly _namesLoading = signal(false);
  readonly namesLoading = computed(() => this._namesLoading());

  load(query: RevenueQuery): Observable<RevenueReport> {
    const params: PointRevenueFilterParams = {
      from: toIsoDate(query.from),
      to: toIsoDate(query.to),
      granularity: query.granularity,
      pointSlug: query.pointSlug,
    };
    return this.analyticsService
      .getPointRevenue(params, 'body', { context: suppressErrorNotification() })
      .pipe(map(AnalyticsRevenueMapper.pointReportFromResponse));
  }

  ensureNames(): void {
    if (this.pointStore.nameBySlug().size > 0 || this._namesLoading()) return;
    this._namesLoading.set(true);
    this.pointStore
      .load()
      .pipe(finalize(() => this._namesLoading.set(false)))
      .subscribe();
  }

  nameFor(key: string): string {
    return this.pointStore.nameBySlug().get(key) ?? key;
  }
}
