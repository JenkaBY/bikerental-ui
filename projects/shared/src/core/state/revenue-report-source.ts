import { InjectionToken, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import type { RevenueQuery, RevenueReport } from '@ui-models';

export type RevenueReportId = 'operators' | 'equipment-types' | 'equipment-units';

export interface RevenueReportSource {
  readonly id: RevenueReportId;
  readonly tabLabel: string;
  readonly dimensionColumnLabel: string;
  load(query: RevenueQuery): Observable<RevenueReport>;
  ensureNames(): void;
  nameFor(key: string): string;
  readonly namesLoading: Signal<boolean>;
}

export const REVENUE_REPORT_SOURCES = new InjectionToken<readonly RevenueReportSource[]>(
  'REVENUE_REPORT_SOURCES',
);
