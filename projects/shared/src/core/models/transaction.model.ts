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

export type LedgerType =
  | 'CASH'
  | 'CARD_TERMINAL'
  | 'BANK_TRANSFER'
  | 'REVENUE'
  | 'ADJUSTMENT'
  | 'CUSTOMER_WALLET'
  | 'CUSTOMER_HOLD';

export interface TransactionDeltas {
  readonly wallet: Money;
  readonly hold: Money;
  readonly external: Money;
}

export interface TransactionBalances {
  readonly wallet: Money;
  readonly hold: Money;
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

export interface TransactionListItem extends CustomerTransaction {
  readonly id: string;
}

export interface TransactionLedgerEntry {
  readonly ledgerType: LedgerType;
  readonly direction: TransactionDirection;
  readonly amount: Money;
  readonly signedDelta: Money;
  readonly balanceAfter?: Money;
  readonly systemLedger: boolean;
}

export interface TransactionDetails extends CustomerTransaction {
  readonly id: string;
  readonly operatorId: string;
  readonly deltas: TransactionDeltas;
  readonly balances: TransactionBalances;
  readonly entries: readonly TransactionLedgerEntry[];
}
