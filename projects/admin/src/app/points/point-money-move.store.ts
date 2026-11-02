import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import {
  IdempotentAttempt,
  makeMoney,
  type Money,
  type PointMoneyOperation,
  PointFinanceMapper,
  PointFinanceService,
} from '@bikerental/shared';
import type { PointMoneyMoveOutcome } from './point-money-move.model';

@Injectable()
export class PointMoneyMoveStore {
  private readonly finance = inject(PointFinanceService);
  private readonly attempt = new IdempotentAttempt();
  private readonly _available = signal<Money>(makeMoney(0));
  private readonly _amount = signal<number | null>(null);
  private pointSlug = '';
  private operation: PointMoneyOperation = 'COLLECTION';

  readonly available = computed(() => this._available());
  readonly remaining = computed<Money>(() => {
    const available = this._available();
    const amount = this._amount();
    const valid = amount !== null && amount > 0 && amount <= available.amount;
    return valid
      ? PointFinanceMapper.sum(available, makeMoney(-amount, available.currency))
      : available;
  });

  init(operation: PointMoneyOperation, pointSlug: string, available: Money): void {
    this.operation = operation;
    this.pointSlug = pointSlug;
    this._available.set(available);
  }

  setAmount(amount: number | null): void {
    this._amount.set(amount);
  }

  applyAvailable(available: Money): void {
    this._available.set(available);
  }

  execute(amount: number, statementDate: Date | null): Observable<PointMoneyMoveOutcome> {
    const idempotencyKey = this.attempt.keyFor({
      amount,
      statementDate: statementDate?.getTime() ?? null,
    });
    return this.send(idempotencyKey, amount, statementDate).pipe(
      tap(() => this.attempt.settle('definitive')),
      catchError((err: unknown) => {
        this.attempt.settle(IdempotentAttempt.outcomeOf(err));
        return throwError(() => err);
      }),
    );
  }

  private send(
    idempotencyKey: string,
    amount: number,
    statementDate: Date | null,
  ): Observable<PointMoneyMoveOutcome> {
    if (this.operation === 'SETTLEMENT' && statementDate) {
      return this.finance
        .recordSettlement({ idempotencyKey, amount, statementDate }, this.pointSlug)
        .pipe(map((s) => ({ amount: s.amount, newPosition: s.cardTerminalPosition })));
    }
    return this.finance
      .recordCollection({ idempotencyKey, amount }, this.pointSlug)
      .pipe(map((c) => ({ amount: c.amount, newPosition: c.cashPosition })));
  }
}
