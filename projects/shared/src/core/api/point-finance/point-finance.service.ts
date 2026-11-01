import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { PointPeriod, PointPeriodResults, PointPositionsOverview } from '../../models';
import { POINT_LEDGER_READER } from './point-ledger.reader';

@Injectable({ providedIn: 'root' })
export class PointFinanceService {
  private readonly ledger = inject(POINT_LEDGER_READER);

  getPositions(): Observable<PointPositionsOverview> {
    return this.ledger.positions();
  }

  getResults(period: PointPeriod, pointSlug: string | null = null): Observable<PointPeriodResults> {
    return this.ledger.results(period, pointSlug);
  }
}
