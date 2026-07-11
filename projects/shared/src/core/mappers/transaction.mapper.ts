import {
  type CustomerTransaction,
  type TransactionKind,
  type TransactionSummary,
} from '@ui-models';
import type { CustomerTransactionResponse, TransactionResponse } from '@api-models';
import { makeMoney } from './money.mapper';

const KNOWN_KINDS: ReadonlySet<TransactionKind> = new Set<TransactionKind>([
  'DEPOSIT',
  'WITHDRAWAL',
  'HOLD',
  'RELEASE',
  'CAPTURE',
  'REFUND',
  'ADJUSTMENT',
]);

const CREDIT_KINDS: ReadonlySet<TransactionKind> = new Set<TransactionKind>([
  'DEPOSIT',
  'RELEASE',
  'REFUND',
]);

export class TransactionMapper {
  static fromTransactionItem(item: CustomerTransactionResponse): CustomerTransaction {
    const raw = item.amount;
    const recordedAt = item.recordedAt ? new Date(item.recordedAt) : new Date(0);
    const kind = TransactionMapper.normalizeKind(item.type);

    const signedAmount = raw === 0 ? 0 : CREDIT_KINDS.has(kind) ? raw : -raw;
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
      kind,
      amountColor,
    };
  }

  private static normalizeKind(type: string | undefined): TransactionKind {
    const normalized = (type ?? '').toUpperCase() as TransactionKind;
    return KNOWN_KINDS.has(normalized) ? normalized : 'OTHER';
  }

  static fromResponse(r: TransactionResponse): TransactionSummary {
    return {
      transactionId: r.transactionId,
      recordedAt: r.recordedAt ? new Date(r.recordedAt) : new Date(0),
    };
  }

  static latestHoldAmount(items: CustomerTransactionResponse[]): number {
    let latest: CustomerTransactionResponse | null = null;
    for (const item of items) {
      if (item.type !== 'HOLD') continue;
      if (!latest || new Date(item.recordedAt).getTime() > new Date(latest.recordedAt).getTime()) {
        latest = item;
      }
    }
    return latest?.amount ?? 0;
  }
}
