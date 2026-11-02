import { makeMoney } from '../../core/mappers/money.mapper';
import type { Money } from '../../core/models';

export type ShiftDifferenceKind = 'SURPLUS' | 'SHORTAGE' | 'MATCHES';

export interface ShiftDifferenceResult {
  readonly kind: ShiftDifferenceKind;
  readonly amount: Money;
}

const CENTS = 100;

export class ShiftDifference {
  static of(counted: Money, expected: Money): ShiftDifferenceResult {
    const cents = Math.round(counted.amount * CENTS) - Math.round(expected.amount * CENTS);
    const kind: ShiftDifferenceKind = cents > 0 ? 'SURPLUS' : cents < 0 ? 'SHORTAGE' : 'MATCHES';
    return { kind, amount: makeMoney(cents / CENTS, counted.currency) };
  }
}
