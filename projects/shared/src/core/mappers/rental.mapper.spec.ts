import { describe, expect, it } from 'vitest';
import type { RentalSummaryResponse } from '@api-models';
import { RentalMapper } from './rental.mapper';
import { makeMoney } from './money.mapper';

describe('RentalMapper', () => {
  it('maps RentalSummaryResponse -> CustomerRentalSummary with provided fields', () => {
    const resp = {
      id: 42,
      status: 'ACTIVE',
      startedAt: '2024-01-02T10:00:00Z',
      expectedReturnAt: '2024-01-03T12:00:00Z',
      equipmentIds: [1, 2, 3],
    } as unknown as RentalSummaryResponse;

    const out = RentalMapper.fromRentalSummary(resp);

    expect(out.id).toBe(42);
    expect(out.status).toBe('ACTIVE');
    expect(out.startedAt).toBeInstanceOf(Date);
    expect(out.expectedReturnAt).toBeInstanceOf(Date);
    expect(out.equipmentIds).toEqual([1, 2, 3]);
    expect(out.estimatedCost).toEqual(makeMoney(0));
  });

  it('defaults missing fields to safe values', () => {
    const resp = {} as unknown as RentalSummaryResponse;
    const out = RentalMapper.fromRentalSummary(resp);

    expect(out.id).toBe(0);
    expect(out.status).toBe('');
    expect(out.startedAt).toBeInstanceOf(Date);
    expect((out.startedAt as Date).getTime()).toBe(new Date(0).getTime());
    expect(out.expectedReturnAt).toBeUndefined();
    expect(out.equipmentIds).toEqual([]);
    expect(out.estimatedCost).toEqual(makeMoney(0));
  });
});
