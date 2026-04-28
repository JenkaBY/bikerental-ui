import { describe, expect, it } from 'vitest';
import { CustomerFinanceMapper } from '@bikerental/shared';
import type { CustomerDepositWrite, CustomerWithdrawalWrite } from '../models';

describe('CustomerFinanceMapper', () => {
  it('maps CustomerWithdrawalWrite -> RecordWithdrawalRequest and preserves operatorId when provided', () => {
    const write = {
      idempotencyKey: 'key-1',
      customerId: 'c-1',
      amount: 123.45,
      paymentMethod: 'CASH',
      operatorId: 'op-9',
    } as unknown as CustomerWithdrawalWrite;

    const req = CustomerFinanceMapper.toRecordWithdrawalRequest(write);

    expect(req.idempotencyKey).toBe('key-1');
    expect(req.customerId).toBe('c-1');
    expect(req.amount).toBe(123.45);
    expect(req.paymentMethod).toBe('CASH');
    expect(req.operatorId).toBe('op-9');
  });

  it('maps CustomerDepositWrite -> RecordDepositRequest and defaults operatorId to empty string when missing', () => {
    const write = {
      idempotencyKey: 'key-2',
      customerId: 'c-2',
      amount: 10,
      paymentMethod: 'CARD',
      // operatorId omitted to test defaulting
    } as unknown as CustomerDepositWrite;

    const req = CustomerFinanceMapper.toRecordDepositRequest(write);

    expect(req.idempotencyKey).toBe('key-2');
    expect(req.customerId).toBe('c-2');
    expect(req.amount).toBe(10);
    expect(req.paymentMethod).toBe('CARD');
    expect(req.operatorId).toBe('');
  });
});
