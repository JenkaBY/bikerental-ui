import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import type { PointPeriod, PointPeriodResults, PointPositionsOverview } from '../../models';
import { UnavailablePointLedgerReader } from './unavailable-point-ledger.reader';

export interface PointLedgerReader {
  positions(): Observable<PointPositionsOverview>;
  results(period: PointPeriod, pointSlug: string | null): Observable<PointPeriodResults>;
}

export const POINT_LEDGER_READER = new InjectionToken<PointLedgerReader>('PointLedgerReader', {
  providedIn: 'root',
  factory: () => new UnavailablePointLedgerReader(),
});
