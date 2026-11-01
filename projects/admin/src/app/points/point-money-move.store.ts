import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import {
  IdempotentAttempt,
  makeMoney,
  type Money,
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

  readonly available = computed(() => this._available());
  readonly remaining = computed<Money>(() => {
    const available = this._available();
    const amount = this._amount();
    const valid = amount !== null && amount > 0 && amount <= available.amount;
    return valid
      ? PointFinanceMapper.sum(available, makeMoney(-amount, available.currency))
      : available;
  });

  init(pointSlug: string, available: Money): void {
    this.pointSlug = pointSlug;
    this._available.set(available);
  }

  setAmount(amount: number | null): void {
    this._amount.set(amount);
  }

  applyAvailable(available: Money): void {
    this._available.set(available);
  }

  execute(amount: number): Observable<PointMoneyMoveOutcome> {
    const idempotencyKey = this.attempt.keyFor({ amount });
    return this.finance.recordCollection({ idempotencyKey, amount }, this.pointSlug).pipe(
      tap(() => this.attempt.settle('definitive')),
      catchError((err: unknown) => {
        this.attempt.settle(IdempotentAttempt.outcomeOf(err));
        return throwError(() => err);
      }),
      map((collection) => ({
        amount: collection.amount,
        newPosition: collection.cashPosition,
      })),
    );
  }
}
