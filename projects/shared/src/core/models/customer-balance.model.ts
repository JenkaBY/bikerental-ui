import type { Money, PaymentMethod, TransactionSource } from '@ui-models';

export interface CustomerBalance {
  readonly available: Money;
  readonly reserved: Money;
  readonly lastUpdatedAt: Date;
  readonly isWithdrawalAvailable: boolean;
}

export interface CustomerWithdrawalWrite {
  idempotencyKey: string;
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  // operatorId is usually provided by the application runtime; keep it optional in the UI model
  operatorId?: string;
  source?: TransactionSource;
  sourceId?: string;
}

export interface CustomerDepositWrite {
  idempotencyKey: string;
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  // operatorId is usually provided by the application runtime; keep it optional in the UI model
  operatorId?: string;
  source?: TransactionSource;
  sourceId?: string;
}
