import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, defer, finalize, Observable, tap, throwError } from 'rxjs';
import {
  type CashCollection,
  IdempotentAttempt,
  makeMoney,
  type Money,
  PointFinanceMapper,
  PointFinanceService,
} from '@bikerental/shared';

@Injectable()
export class OperatorCollectionStore {
  private readonly finance = inject(PointFinanceService);
  private readonly attempt = new IdempotentAttempt();
  private readonly _available = signal<Money>(makeMoney(0));
  private readonly _amount = signal<number | null>(null);
  private readonly _ready = signal(false);
  private readonly _submitting = signal(false);
  private readonly _amountError = signal<string | null>(null);

  readonly available = computed(() => this._available());
  readonly ready = computed(() => this._ready());
  readonly submitting = computed(() => this._submitting());
  readonly amountError = computed(() => this._amountError());
  readonly handIn = computed<Money | null>(() => {
    const available = this._available();
    const amount = this._amount();
    const valid = amount !== null && amount > 0 && amount <= available.amount;
    return valid ? makeMoney(amount, available.currency) : null;
  });
  readonly remaining = computed<Money>(() => {
    const available = this._available();
    const handIn = this.handIn();
    return handIn
      ? PointFinanceMapper.sum(available, makeMoney(-handIn.amount, available.currency))
      : available;
  });

  init(available: Money): void {
    this._available.set(available);
    this._ready.set(true);
  }

  setAmount(amount: number | null): void {
    this._amount.set(amount);
    this._amountError.set(null);
  }

  refuse(message: string, position: Money | null): void {
    if (position) this._available.set(position);
    this._amountError.set(message);
  }

  execute(amount: number): Observable<CashCollection> {
    return defer(() => {
      this._submitting.set(true);
      const idempotencyKey = this.attempt.keyFor({ amount });
      return this.finance.recordCollection({ idempotencyKey, amount }, null).pipe(
        tap(() => this.attempt.settle('definitive')),
        catchError((err: unknown) => {
          this.attempt.settle(IdempotentAttempt.outcomeOf(err));
          return throwError(() => err);
        }),
        finalize(() => this._submitting.set(false)),
      );
    });
  }
}
