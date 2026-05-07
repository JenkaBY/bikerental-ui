import { describe, expect, it } from 'vitest';
import type { EquipmentResponse } from '@api-models';
import { EquipmentSearchItemMapper } from './equipment-search-item.mapper';

describe('EquipmentSearchItemMapper.fromResponse', () => {
  it('maps all five fields from EquipmentResponse to EquipmentSearchItem (Scenario 4)', () => {
    const response = {
      id: 7,
      uid: 'ABC123',
      model: 'Trek FX3',
      type: 'bike',
      status: 'available',
      serialNumber: 'SN-001',
    } as unknown as EquipmentResponse;

    const result = EquipmentSearchItemMapper.fromResponse(response);

    expect(result.id).toBe(7);
    expect(result.uid).toBe('ABC123');
    expect(result.model).toBe('Trek FX3');
    expect(result.typeSlug).toBe('bike');
    expect(result.statusSlug).toBe('available');
  });

  it('preserves exact slug strings without transformation', () => {
    const response = {
      id: 1,
      uid: 'XYZ',
      model: 'Giant Escape 3',
      type: 'city-bike',
      status: 'maintenance',
      serialNumber: 'SN-002',
    } as unknown as EquipmentResponse;

    const result = EquipmentSearchItemMapper.fromResponse(response);

    expect(result.typeSlug).toBe('city-bike');
    expect(result.statusSlug).toBe('maintenance');
  });
});
