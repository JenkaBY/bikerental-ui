import type { Money } from './transaction.model';

export type PointMoneyOperation = 'COLLECTION' | 'SETTLEMENT';

export interface CashCollectionWrite {
  readonly idempotencyKey: string;
  readonly amount: number;
}

export interface CashCollection {
  readonly transactionId: string;
  readonly pointSlug: string;
  readonly amount: Money;
  readonly cashPosition: Money;
  readonly recordedAt: Date;
}

export interface TerminalSettlementWrite {
  readonly idempotencyKey: string;
  readonly amount: number;
  readonly settlementDate: Date;
}

export interface TerminalSettlement {
  readonly transactionId: string;
  readonly pointSlug: string;
  readonly amount: Money;
  readonly settlementDate: Date;
  readonly cardTerminalPosition: Money | null;
  readonly recordedAt: Date;
}
