import { describe, expect, it } from 'vitest';
import type { RentalSummaryResponse } from '@api-models';
import type { RentalWrite } from '@ui-models';
import { RentalMapper } from './rental.mapper';
import { makeMoney } from './money.mapper';

describe('RentalMapper', () => {
  it('maps RentalSummaryResponse -> CustomerRentalSummary with provided fields', () => {
    const resp = {
      id: 42,
      status: 'ACTIVE',
      startedAt: '2024-01-02T10:00:00Z',
      expectedReturnAt: '2024-01-03T12:00:00Z',
      equipments: [
        { equipmentId: 1, status: 'ACTIVE' },
        { equipmentId: 2, status: 'ACTIVE' },
        { equipmentId: 3, status: 'ACTIVE' },
      ],
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

describe('RentalMapper.toRentalRequest', () => {
  it('maps all required fields and omits undefined optional fields (Scenario 1)', () => {
    const draft: RentalWrite = {
      customerId: 'uuid-1',
      equipmentIds: [10, 20],
      durationMinutes: 120,
      discountPercent: 10,
      operatorId: 'op-1',
    };

    const result = RentalMapper.toRentalRequest(draft);

    expect(result.customerId).toBe('uuid-1');
    expect(result.equipmentIds).toEqual([10, 20]);
    expect(result.duration).toBe(120);
    expect(result.discountPercent).toBe(10);
    expect(result.operatorId).toBe('op-1');
    expect(result.specialTariffId).toBeUndefined();
    expect(result.specialPrice).toBeUndefined();
  });

  it('includes specialTariffId and specialPrice when set; omits discountPercent (Scenario 2)', () => {
    const draft: RentalWrite = {
      customerId: 'uuid-2',
      equipmentIds: [5],
      durationMinutes: 60,
      specialTariffId: 5,
      specialPrice: 500,
      operatorId: 'op-2',
    };

    const result = RentalMapper.toRentalRequest(draft);

    expect(result.specialTariffId).toBe(5);
    expect(result.specialPrice).toBe(500);
    expect(result.discountPercent).toBeUndefined();
  });
});
