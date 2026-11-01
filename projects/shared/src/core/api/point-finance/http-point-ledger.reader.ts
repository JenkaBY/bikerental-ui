import { HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { PointResultsParams } from '@api-models';
import { FinanceService } from '../generated';
import { PointFinanceMapper } from '../../mappers/point-finance.mapper';
import type { PointPeriod, PointPeriodResults, PointPositionsOverview } from '../../models';
import { SKIP_POINT_SCOPE } from '../../interceptors/point.interceptor';
import { toIsoDate } from '../../../shared/utils/date.util';
import type { PointLedgerReader } from './point-ledger.reader';

@Injectable({ providedIn: 'root' })
export class HttpPointLedgerReader implements PointLedgerReader {
  private readonly finance = inject(FinanceService);

  positions(): Observable<PointPositionsOverview> {
    return this.finance
      .getPointPositions('body', HttpPointLedgerReader.businessScope())
      .pipe(map((response) => PointFinanceMapper.positionsOverviewFromResponse(response)));
  }

  results(period: PointPeriod, pointSlug: string | null): Observable<PointPeriodResults> {
    const filter = HttpPointLedgerReader.periodFilter(period);
    if (pointSlug === null) {
      return this.finance
        .getPointResults(filter, 'body', HttpPointLedgerReader.businessScope())
        .pipe(
          map((r) => PointFinanceMapper.periodResultsFromFigures(r.totals ?? [], period, null)),
        );
    }
    return this.finance
      .getPointResult(pointSlug, filter, 'body', HttpPointLedgerReader.businessScope())
      .pipe(
        map((r) => PointFinanceMapper.periodResultsFromFigures(r.figures ?? [], period, pointSlug)),
      );
  }

  private static periodFilter(period: PointPeriod): PointResultsParams {
    return { from: toIsoDate(period.from), to: toIsoDate(period.to) };
  }

  private static businessScope(): { context: HttpContext } {
    return { context: new HttpContext().set(SKIP_POINT_SCOPE, true) };
  }
}
