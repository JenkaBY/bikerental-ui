import { Observable, throwError } from 'rxjs';
import type { PointPeriodResults, PointPositionsOverview } from '../../models';
import { PointLedgerUnavailableError } from './point-ledger-unavailable.error';
import type { PointLedgerReader } from './point-ledger.reader';

export class UnavailablePointLedgerReader implements PointLedgerReader {
  positions(): Observable<PointPositionsOverview> {
    return throwError(() => new PointLedgerUnavailableError('point-positions'));
  }

  results(): Observable<PointPeriodResults> {
    return throwError(() => new PointLedgerUnavailableError('point-results'));
  }
}
