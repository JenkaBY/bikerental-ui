import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { EquipmentSearchStore } from './equipment-search.store';
import { EquipmentService } from '../api/generated';
import { EquipmentTypeStore } from './equipment-type.store';

const mockEquipmentResponse = {
  id: 1,
  uid: 'ABC12',
  model: 'Trek FX3',
  type: 'bicycle',
  status: 'available',
  serialNumber: 'S1',
};

describe('EquipmentSearchStore', () => {
  let store: EquipmentSearchStore;

  const equipmentService = {
    searchEquipments: vi.fn(),
  };

  const equipmentTypeStore = {
    types: () => [{ slug: 'bicycle', name: 'Bicycle', isForSpecialTariff: false }],
  };

  beforeEach(() => {
    equipmentService.searchEquipments.mockReset();
    equipmentService.searchEquipments.mockReturnValue(
      of({ items: [mockEquipmentResponse], totalItems: 1 }),
    );

    TestBed.configureTestingModule({
      providers: [
        EquipmentSearchStore,
        { provide: EquipmentService, useValue: equipmentService },
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
    expect(equipmentService.searchEquipments).not.toHaveBeenCalled();
  });

  it('should not call the service for a query shorter than 2 chars', async () => {
    store.search('A');
    await new Promise((r) => setTimeout(r, 400));
    expect(equipmentService.searchEquipments).not.toHaveBeenCalled();
  });

  it('should call the service and populate results for a 2+ char query', async () => {
    store.search('AB');
    await new Promise((r) => setTimeout(r, 400));
    expect(equipmentService.searchEquipments).toHaveBeenCalled();
    expect(store.results().length).toBe(1);
    expect(store.results()[0].uid).toBe('ABC12');
  });

  it('should normalize empty string to null and return empty results', async () => {
    store.search('');
    await new Promise((r) => setTimeout(r, 50));
    expect(store.results()).toEqual([]);
  });
});
