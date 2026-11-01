import type { Money, PointMoneyOperation } from '@bikerental/shared';

export interface PointMoneyMoveData {
  readonly operation: PointMoneyOperation;
  readonly pointSlug: string;
  readonly pointName: string;
  readonly available: Money;
}

export interface PointMoneyMoveOutcome {
  readonly amount: Money;
  readonly newPosition: Money | null;
}

export type PointMoneyMoveResult =
  | {
      readonly outcome: 'done';
      readonly operation: PointMoneyOperation;
      readonly amount: Money;
      readonly newPosition: Money | null;
    }
  | { readonly outcome: 'statusChanged' };
