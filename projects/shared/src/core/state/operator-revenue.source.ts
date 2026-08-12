import { computed, inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AnalyticsService } from '../api/generated';
import type { OperatorRevenueFilterParams } from '@api-models';
import { AnalyticsRevenueMapper } from '../mappers/analytics-revenue.mapper';
import type { RevenueQuery, RevenueReport } from '@ui-models';
import { suppressErrorNotification } from '../errors/http-error-context';
import { Labels } from '../../shared/constant/labels';
import { toIsoDate } from '../../shared/utils/date.util';
import { ManagedUserStore } from './managed-user.store';
import type { RevenueReportSource } from './revenue-report-source';

@Injectable({ providedIn: 'root' })
export class OperatorRevenueSource implements RevenueReportSource {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly managedUserStore = inject(ManagedUserStore);

  readonly id = 'operators' as const;
  readonly tabLabel = Labels.AnalyticsOperatorsTab;
  readonly dimensionColumnLabel = Labels.AnalyticsDimensionColumnOperator;

  readonly namesLoading = this.managedUserStore.loading;

  private readonly nameMap = computed(() => {
    const names = new Map<string, string>();
    for (const user of this.managedUserStore.users()) {
      names.set(user.id, user.displayName || user.username || user.id);
    }
    return names;
  });

  load(query: RevenueQuery): Observable<RevenueReport> {
    const params: OperatorRevenueFilterParams = {
      from: toIsoDate(query.from),
      to: toIsoDate(query.to),
      granularity: query.granularity,
      operatorId: query.dimensionId,
    };
    return this.analyticsService
      .getOperatorRevenue(params, 'body', { context: suppressErrorNotification() })
      .pipe(map(AnalyticsRevenueMapper.operatorReportFromResponse));
  }

  ensureNames(): void {
    if (this.managedUserStore.users().length > 0 || this.managedUserStore.loading()) return;
    this.managedUserStore.load().subscribe();
  }

  nameFor(key: string): string {
    return this.nameMap().get(key) ?? key;
  }
}
