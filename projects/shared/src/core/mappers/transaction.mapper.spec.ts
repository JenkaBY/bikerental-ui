import { describe, expect, it } from 'vitest';
import { makeMoney } from './money.mapper';
import { TransactionMapper } from './transaction.mapper';
import type { RawTransactionItem } from '@ui-models';

describe('money.mapper', () => {
  it('makeMoney returns Money with default currency and provided amount', () => {
    const m = makeMoney(123);
    expect(m).toEqual({ amount: 123, currency: 'BYN' });
  });

  it('makeMoney accepts custom currency', () => {
    const m = makeMoney(50, 'USD');
    expect(m).toEqual({ amount: 50, currency: 'USD' });
  });
});

describe('TransactionMapper.fromTransactionItem', () => {
  it('maps fields and marks positive amounts as positive', () => {
    const item = {
      transactionId: 'tx-1',
      recordedAt: '2021-06-01T12:00:00Z',
      amount: 75,
      description: 'payment',
      sourceType: 'card',
    } as unknown as RawTransactionItem;

    const out = TransactionMapper.fromTransactionItem(item);
    expect(out.transactionId).toBe('tx-1');
    expect(out.recordedAt).toBeInstanceOf(Date);
    expect(out.amount).toEqual(makeMoney(75));
    expect(out.description).toBe('payment');
    expect(out.sourceType).toBe('card');
    expect(out.amountColor).toBe('positive');
  });

  it('handles negative and zero amounts correctly and defaults missing fields', () => {
    const neg = TransactionMapper.fromTransactionItem({
      amount: -10,
    } as unknown as RawTransactionItem);
    expect(neg.amount).toEqual(makeMoney(-10));
    expect(neg.amountColor).toBe('negative');

    const zero = TransactionMapper.fromTransactionItem({} as unknown as RawTransactionItem);
    expect(zero.amount).toEqual(makeMoney(0));
    expect(zero.amountColor).toBe('neutral');
    expect(zero.transactionId).toBe('');
    // recordedAt defaults to epoch
    expect((zero.recordedAt as Date).getTime()).toBe(new Date(0).getTime());
  });
});
