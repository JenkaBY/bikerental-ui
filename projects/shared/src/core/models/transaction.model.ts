export interface Money {
  readonly amount: number;
  readonly currency: string;
}

export interface RawTransactionItem {
  readonly transactionId?: string;
  readonly recordedAt?: Date | string;
  readonly amount?: number;
  readonly description?: string;
  readonly sourceType?: string;
}

export interface CustomerTransaction {
  readonly transactionId: string;
  readonly recordedAt: Date;
  readonly amount: Money;
  readonly description?: string;
  readonly sourceType?: string;
  readonly amountColor: 'positive' | 'negative' | 'neutral';
}
