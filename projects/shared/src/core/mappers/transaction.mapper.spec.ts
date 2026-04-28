import { describe, expect, it } from 'vitest';
import { TransactionMapper } from './transaction.mapper';
import type { CustomerTransactionResponse, TransactionResponse } from '@api-models';

describe('TransactionMapper', () => {
  it('maps DEPOSIT CustomerTransactionResponse -> CustomerTransaction (uses reason, parses recordedAt)', () => {
    const resp = {
      customerId: 'c1',
      amount: 100,
      type: 'DEPOSIT',
      recordedAt: '2021-06-01T12:00:00Z',
      paymentMethod: 'CASH',
      reason: 'Topup',
      sourceType: undefined,
      sourceId: 's-1',
    } as unknown as CustomerTransactionResponse;

    const out = TransactionMapper.fromTransactionItem(resp);

    expect(out.customerId).toBe('c1');
    expect(out.amount).toHaveProperty('amount', 100);
    expect(out.amount).toHaveProperty('currency', 'BYN');
    expect(out.recordedAt).toBeInstanceOf(Date);
    expect(out.recordedAt.toISOString()).toBe(new Date('2021-06-01T12:00:00Z').toISOString());
    expect(out.paymentMethod).toBe('CASH');
    expect(out.reason).toBe('Topup');
    expect(out.description).toBe('Topup');
    expect(out.amountColor).toBe('positive');
  });

  it('maps WITHDRAWAL to negative amount and uses sourceType when reason is missing', () => {
    const resp = {
      customerId: 'c2',
      amount: 50,
      type: 'WITHDRAWAL',
      recordedAt: undefined,
      paymentMethod: 'CARD',
      reason: undefined,
      sourceType: 'REFUND',
      sourceId: 's-2',
    } as unknown as CustomerTransactionResponse;

    const out = TransactionMapper.fromTransactionItem(resp);

    expect(out.customerId).toBe('c2');
    expect(out.amount.amount).toBe(-50);
    expect(out.amount.currency).toBe('BYN');
    expect(out.recordedAt).toBeInstanceOf(Date);
    // missing recordedAt should default to epoch
    expect(out.recordedAt.getTime()).toBe(new Date(0).getTime());
    expect(out.paymentMethod).toBe('CARD');
    expect(out.reason).toBeUndefined();
    expect(out.description).toBe('REFUND');
    expect(out.amountColor).toBe('negative');
  });

  it('handles zero amount as neutral with description fallback to type', () => {
    const resp = {
      customerId: 'c3',
      amount: 0,
      type: 'ADJUSTMENT',
      recordedAt: undefined,
      paymentMethod: undefined,
      reason: undefined,
      sourceType: undefined,
      sourceId: undefined,
    } as unknown as CustomerTransactionResponse;

    const out = TransactionMapper.fromTransactionItem(resp);

    expect(out.amount.amount).toBe(0);
    expect(out.amountColor).toBe('neutral');
    expect(out.description).toBe('ADJUSTMENT');
  });

  it('maps TransactionResponse -> TransactionSummary (parses recordedAt)', () => {
    const resp = {
      transactionId: 't-1',
      recordedAt: '2022-01-02T03:04:05Z',
    } as unknown as TransactionResponse;

    const out = TransactionMapper.fromResponse(resp);

    expect(out.transactionId).toBe('t-1');
    expect(out.recordedAt).toBeInstanceOf(Date);
    expect(out.recordedAt.toISOString()).toBe(new Date('2022-01-02T03:04:05Z').toISOString());
  });
});
