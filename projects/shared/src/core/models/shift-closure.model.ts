import type { Money } from './transaction.model';

export interface ShiftClosureWrite {
  readonly idempotencyKey: string;
  readonly shiftId: string;
  readonly countedAmount: Money;
}

export interface ShiftClosure {
  readonly shiftId: string;
  readonly sequence: number;
  readonly openedAt: Date;
  readonly closedAt: Date;
  readonly expectedCash: Money;
  readonly countedAmount: Money;
  readonly difference: Money;
  readonly nextShiftId: string | null;
  readonly nextOpeningAmount: Money | null;
}
