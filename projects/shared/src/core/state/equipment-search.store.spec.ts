import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { EquipmentSearchStore } from './equipment-search.store';
import { RentalsService } from '../api/generated';
import { EquipmentTypeStore } from './equipment-type.store';

const mockAvailableEquipmentResponse = {
  id: 1,
  uid: 'ABC12',
  model: 'Trek FX3',
  typeSlug: 'bicycle',
  serialNumber: 'S1',
};

describe('EquipmentSearchStore', () => {
  let store: EquipmentSearchStore;

  const rentalsService = {
    getAvailableEquipments: vi.fn(),
  };

  const equipmentTypeStore = {
    types: () => [{ slug: 'bicycle', name: 'Bicycle', isForSpecialTariff: false }],
    typesForEquipment: () => [{ slug: 'bicycle', name: 'Bicycle', isForSpecialTariff: false }],
  };

  beforeEach(() => {
    rentalsService.getAvailableEquipments.mockReset();
    rentalsService.getAvailableEquipments.mockReturnValue(
      of({ items: [mockAvailableEquipmentResponse], totalItems: 1 }),
    );

    TestBed.configureTestingModule({
      providers: [
        EquipmentSearchStore,
        { provide: RentalsService, useValue: rentalsService },
        { provide: EquipmentTypeStore, useValue: equipmentTypeStore },
      ],
    });

    store = TestBed.inject(EquipmentSearchStore);
  });

  it('should initialize with empty results', async () => {
    await new Promise((r) => setTimeout(r, 20));
    expect(store.results()).toEqual([]);
  });

  it('should not call the service for a null query', async () => {
    store.search(null);
    await new Promise((r) => setTimeout(r, 50));
    expect(rentalsService.getAvailableEquipments).not.toHaveBeenCalled();
  });

  it('should not call the service for a query shorter than 2 chars', async () => {
    store.search('A');
    await new Promise((r) => setTimeout(r, 400));
    expect(rentalsService.getAvailableEquipments).not.toHaveBeenCalled();
  });

  it('should normalize empty string to null and return empty results', async () => {
    store.search('');
    await new Promise((r) => setTimeout(r, 50));
    expect(store.results()).toEqual([]);
  });
});
