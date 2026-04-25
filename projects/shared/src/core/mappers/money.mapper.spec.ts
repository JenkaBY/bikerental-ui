import { describe, expect, it } from 'vitest';
import { makeMoney } from './money.mapper';

describe('money.mapper', () => {
  it('returns Money with default currency when currency omitted', () => {
    const m = makeMoney(200);
    expect(m).toEqual({ amount: 200, currency: 'BYN' });
  });

  it('returns Money with provided currency', () => {
    const m = makeMoney(99.5, 'EUR');
    expect(m).toEqual({ amount: 99.5, currency: 'EUR' });
  });

  it('handles zero and negative amounts', () => {
    expect(makeMoney(0)).toEqual({ amount: 0, currency: 'BYN' });
    expect(makeMoney(-15, 'USD')).toEqual({ amount: -15, currency: 'USD' });
  });
});
