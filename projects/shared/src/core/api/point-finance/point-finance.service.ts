import { HttpContext, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { suppressErrorNotification } from '../../errors/http-error-context';
import { POINT_SLUG_HEADER, SKIP_POINT_SCOPE } from '../../interceptors/point.interceptor';
import { PointFinanceMapper } from '../../mappers/point-finance.mapper';
import { POINT_MOVEMENTS_MAX_PAGE_SIZE } from '../../models';
import type {
  PointMovementPage,
  PointMovementQuery,
  PointPeriod,
  PointPeriodResults,
  PointPositionsOverview,
  RunningShift,
} from '../../models';
import { FinanceService, RequestOptions } from '../generated';
import { POINT_LEDGER_READER } from './point-ledger.reader';

const NO_RUNNING_SHIFT_STATUS = 404;

@Injectable({ providedIn: 'root' })
export class PointFinanceService {
  private readonly ledger = inject(POINT_LEDGER_READER);
  private readonly finance = inject(FinanceService);

  getPositions(): Observable<PointPositionsOverview> {
    return this.ledger.positions();
  }

  getResults(period: PointPeriod, pointSlug: string | null = null): Observable<PointPeriodResults> {
    return this.ledger.results(period, pointSlug);
  }

  getMovements(query: PointMovementQuery): Observable<PointMovementPage> {
    return this.ledger.movements({
      ...query,
      size: Math.min(query.size, POINT_MOVEMENTS_MAX_PAGE_SIZE),
    });
  }

  getCurrentShift(pointSlug: string | null): Observable<RunningShift | null> {
    return this.finance.getRunningShift('body', PointFinanceService.shiftOptions(pointSlug)).pipe(
      map((response): RunningShift | null => PointFinanceMapper.runningShiftFromResponse(response)),
      catchError((err: unknown) =>
        err instanceof HttpErrorResponse && err.status === NO_RUNNING_SHIFT_STATUS
          ? of(null)
          : throwError(() => err),
      ),
    );
  }

  private static shiftOptions(pointSlug: string | null): RequestOptions<'json'> {
    if (pointSlug === null) {
      return { context: suppressErrorNotification() };
    }
    return {
      headers: new HttpHeaders({ [POINT_SLUG_HEADER]: pointSlug }),
      context: suppressErrorNotification(new HttpContext().set(SKIP_POINT_SCOPE, true)),
    };
  }
}
