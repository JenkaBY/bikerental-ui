import { computed, inject, Injectable, LOCALE_ID, signal } from '@angular/core';
import { catchError, defer, finalize, Observable, tap, throwError } from 'rxjs';
import { IdempotentAttempt } from '../../shared/utils/idempotent-attempt';
import { describeShiftDifference } from '../../shared/utils/shift-closure-presentation';
import { ShiftDifference, type ShiftDifferenceResult } from '../../shared/utils/shift-difference';
import { PointFinanceService } from '../api/point-finance';
import { makeMoney } from '../mappers/money.mapper';
import type { Money, RunningShift, ShiftClosure } from '../models';

const CENTS = 100;
const CENT_TOLERANCE = 1e-6;

function isValidCount(value: number | null): value is number {
  return (
    value !== null &&
    Number.isFinite(value) &&
    value >= 0 &&
    Math.abs(value * CENTS - Math.round(value * CENTS)) < CENT_TOLERANCE
  );
}

@Injectable()
export class ShiftClosureStore {
  private readonly finance = inject(PointFinanceService);
  private readonly locale = inject(LOCALE_ID);
  private readonly attempt = new IdempotentAttempt();
  private readonly _shift = signal<RunningShift | null>(null);
  private readonly _entered = signal<number | null>(null);
  private readonly _submitting = signal(false);
  private readonly _closure = signal<ShiftClosure | null>(null);
  private pointSlug: string | null = null;

  readonly shift = computed(() => this._shift());
  readonly submitting = computed(() => this._submitting());
  readonly closure = computed(() => this._closure());
  readonly counted = computed<Money | null>(() => {
    const shift = this._shift();
    const entered = this._entered();
    return shift !== null && isValidCount(entered)
      ? makeMoney(entered, shift.expectedCash.currency)
      : null;
  });
  readonly difference = computed<ShiftDifferenceResult | null>(() => {
    const shift = this._shift();
    const counted = this.counted();
    return shift !== null && counted !== null
      ? ShiftDifference.of(counted, shift.expectedCash)
      : null;
  });
  readonly differenceText = computed<string | null>(() => {
    const difference = this.difference();
    return difference ? describeShiftDifference(difference, this.locale) : null;
  });

  init(shift: RunningShift, pointSlug: string | null): void {
    this._shift.set(shift);
    this.pointSlug = pointSlug;
  }

  setCounted(value: number | null): void {
    this._entered.set(value);
  }

  complete(closure: ShiftClosure): void {
    this._closure.set(closure);
  }

  execute(): Observable<ShiftClosure> {
    return defer(() => {
      const shift = this._shift();
      const counted = this.counted();
      if (shift === null || counted === null) {
        return throwError(() => new Error('Shift closure is not ready'));
      }
      this._submitting.set(true);
      const idempotencyKey = this.attempt.keyFor({
        shiftId: shift.shiftId,
        counted: counted.amount,
      });
      return this.finance
        .closeShift(
          { idempotencyKey, shiftId: shift.shiftId, countedAmount: counted },
          this.pointSlug,
        )
        .pipe(
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
