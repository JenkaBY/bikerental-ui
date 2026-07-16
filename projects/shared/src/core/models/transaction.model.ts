export interface Money {
  readonly amount: number;
  readonly currency: string;
}

export type TransactionKind =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'HOLD'
  | 'RELEASE'
  | 'CAPTURE'
  | 'REFUND'
  | 'ADJUSTMENT'
  | 'OTHER';

export type TransactionDirection = 'CREDIT' | 'DEBIT';

export interface TransactionDeltas {
  readonly wallet: number;
  readonly hold: number;
  readonly external: number;
}

export interface TransactionBalances {
  readonly wallet: number;
  readonly hold: number;
}

export interface CustomerTransaction {
  readonly customerId: string;
  readonly amount: Money;
  readonly recordedAt: Date;
  readonly paymentMethod: string;
  readonly reason?: string;
  readonly sourceType?: string;
  readonly sourceId?: string;

  readonly direction?: TransactionDirection;
  readonly deltas?: TransactionDeltas;
  readonly balances?: TransactionBalances;

  // UI convenience fields / aliases
  readonly kind: TransactionKind;
  readonly transactionId?: string; // alias for sourceId for backward compatibility
  readonly description?: string; // alias for reason
  readonly amountColor: 'positive' | 'negative' | 'neutral';
}

export interface TransactionSummary {
  readonly transactionId: string;
  readonly recordedAt: Date;
}

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CARD_TERMINAL';

export type TransactionSource = 'RENTAL';
