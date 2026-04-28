export interface Money {
  readonly amount: number;
  readonly currency: string;
}

export interface CustomerTransaction {
  readonly customerId: string;
  readonly amount: Money;
  readonly recordedAt: Date;
  readonly paymentMethod: string;
  readonly reason?: string;
  readonly sourceType?: string;
  readonly sourceId?: string;

  // UI convenience fields / aliases
  readonly transactionId?: string; // alias for sourceId for backward compatibility
  readonly description?: string; // alias for reason
  readonly amountColor: 'positive' | 'negative' | 'neutral';
}

export interface TransactionSummary {
  readonly transactionId: string;
  readonly recordedAt: Date;
}

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CARD_TERMINAL';
