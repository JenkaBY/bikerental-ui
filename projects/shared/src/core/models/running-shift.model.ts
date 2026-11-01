import type { PointMovementKind } from './point-finance.model';
import type { Money } from './transaction.model';

export interface RunningShiftKindTotal {
  readonly kind: PointMovementKind;
  readonly signedAmount: Money;
}

export interface RunningShift {
  readonly shiftId: string;
  readonly pointSlug: string;
  readonly sequence: number;
  readonly openedAt: Date;
  readonly openingAmount: Money;
  readonly kindTotals: readonly RunningShiftKindTotal[];
  readonly expectedCash: Money;
}

export type RunningShiftState = 'loading' | 'running' | 'none' | 'failed';

export type ActionUnavailableReason =
  | 'POINT_NOT_ACTIVE'
  | 'POINT_PERMANENTLY_CLOSED'
  | 'NOTHING_TO_MOVE'
  | 'UNKNOWN'
  | 'HIDDEN';

export interface ActionAvailability {
  readonly enabled: boolean;
  readonly reason: ActionUnavailableReason | null;
}
