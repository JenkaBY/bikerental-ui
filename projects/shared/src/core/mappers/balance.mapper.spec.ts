import { describe, expect, it } from 'vitest';
import type { CustomerAccountBalancesResponse } from '@api-models';
import { BalanceMapper } from './balance.mapper';
import { makeMoney } from './money.mapper';

describe('BalanceMapper', () => {
  it('maps walletBalance and holdBalance to CustomerBalance with Money objects', () => {
    const resp = {
      walletBalance: 150,
      holdBalance: -20,
      lastUpdatedAt: '2023-04-01T12:00:00Z',
    } as unknown as CustomerAccountBalancesResponse;

    const out = BalanceMapper.fromBalanceResponse(resp);

    expect(out.available).toEqual(makeMoney(150));
    expect(out.reserved).toEqual(makeMoney(-20));
    expect(out.lastUpdatedAt).toBeInstanceOf(Date);
    expect((out.lastUpdatedAt as Date).toISOString()).toBe(
      new Date('2023-04-01T12:00:00Z').toISOString(),
    );
  });

  it('handles zero balances and epoch lastUpdatedAt', () => {
    const resp = {
      walletBalance: 0,
      holdBalance: 0,
      lastUpdatedAt: 0,
    } as unknown as CustomerAccountBalancesResponse;

    const out = BalanceMapper.fromBalanceResponse(resp);

    expect(out.available).toEqual(makeMoney(0));
    expect(out.reserved).toEqual(makeMoney(0));
    expect(out.lastUpdatedAt).toBeInstanceOf(Date);
    expect((out.lastUpdatedAt as Date).getTime()).toBe(new Date(0).getTime());
  });
});
