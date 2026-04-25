import { type CustomerTransaction, type RawTransactionItem } from '@ui-models';
import { makeMoney } from './money.mapper';

export class TransactionMapper {
  static fromTransactionItem(item: RawTransactionItem): CustomerTransaction {
    const amount = item.amount ?? 0;
    return {
      transactionId: item.transactionId ?? '',
      recordedAt: item.recordedAt ? new Date(item.recordedAt) : new Date(0),
      amount: makeMoney(amount),
      description: item.description,
      sourceType: item.sourceType,
      amountColor: amount > 0 ? 'positive' : amount < 0 ? 'negative' : 'neutral',
    };
  }
}
