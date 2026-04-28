import { type CustomerTransaction, type TransactionSummary } from '@ui-models';
import type { CustomerTransactionResponse, TransactionResponse } from '@api-models';
import { makeMoney } from './money.mapper';

export class TransactionMapper {
  static fromTransactionItem(item: CustomerTransactionResponse): CustomerTransaction {
    const raw = item.amount;
    const recordedAt = item.recordedAt ? new Date(item.recordedAt) : new Date(0);

    const signedAmount = raw === 0 ? 0 : item.type === 'DEPOSIT' ? raw : -raw;
    const amountColor = signedAmount > 0 ? 'positive' : signedAmount < 0 ? 'negative' : 'neutral';
    const description = item.reason ? item.reason : item.sourceType ? item.sourceType : item.type;

    return {
      customerId: item.customerId,
      amount: makeMoney(signedAmount),
      recordedAt,
      paymentMethod: item.paymentMethod,
      reason: item.reason,
      sourceType: item.sourceType,
      sourceId: item.sourceId,
      description: description,

      // UI aliases
      amountColor,
    };
  }

  static fromResponse(r: TransactionResponse): TransactionSummary {
    return {
      transactionId: r.transactionId,
      recordedAt: r.recordedAt ? new Date(r.recordedAt) : new Date(0),
    };
  }
}
