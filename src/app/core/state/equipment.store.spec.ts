import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { EquipmentService } from '../api';
import { Equipment, EquipmentWrite } from '../models';
import { EquipmentStore } from './equipment.store';
import { EquipmentStatusStore } from './equipment-status.store';
import { EquipmentTypeStore } from './equipment-type.store';

const createdEquipment: Equipment = {
  id: 10,
  serialNumber: 'SN-010',
  uid: 'UID-010',
  type: { slug: 'bike', name: 'Bike', isForSpecialTariff: false },
  status: { slug: 'available', name: 'Available', allowedTransitions: [] },
  model: 'Roadster',
};

const reloadedEquipment: Equipment = {
  id: 11,
  serialNumber: 'SN-011',
  uid: 'UID-011',
  type: { slug: 'bike', name: 'Bike', isForSpecialTariff: false },
  status: { slug: 'maintenance', name: 'Maintenance', allowedTransitions: [] },
  model: 'City',
};

const write: EquipmentWrite = {
  serialNumber: 'SN-010',
  typeSlug: 'bike',
};

describe('EquipmentStore', () => {
  let store: EquipmentStore;
  let service: {
    search: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let equipmentTypeStore: { types: ReturnType<typeof vi.fn> };
  let equipmentStatusStore: { statuses: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    service = {
      search: vi.fn().mockReturnValue(of({ items: [], totalItems: 0 })),
      create: vi.fn().mockReturnValue(of(createdEquipment)),
      update: vi.fn(),
    };
    equipmentTypeStore = { types: vi.fn().mockReturnValue([{ slug: 'bike', name: 'Bike' }]) };
    equipmentStatusStore = {
      statuses: vi
        .fn()
        .mockReturnValue([{ slug: 'available', name: 'Available', allowedTransitions: [] }]),
    };

    TestBed.configureTestingModule({
      providers: [
        EquipmentStore,
        { provide: EquipmentService, useValue: service },
        { provide: EquipmentTypeStore, useValue: equipmentTypeStore },
        { provide: EquipmentStatusStore, useValue: equipmentStatusStore },
      ],
    });

    store = TestBed.inject(EquipmentStore);
  });

  it('reloads the current page after create instead of patching local state', () => {
    service.search.mockReturnValue(of({ items: [reloadedEquipment], totalItems: 1 }));

    let result: Equipment | undefined;
    store.create(write).subscribe((value) => {
      result = value;
    });

    expect(service.create).toHaveBeenCalledWith(
      write,
      [{ slug: 'bike', name: 'Bike' }],
      [{ slug: 'available', name: 'Available', allowedTransitions: [] }],
    );
    expect(service.search).toHaveBeenCalledWith(
      undefined,
      undefined,
      { page: 0, size: 20 },
      [{ slug: 'bike', name: 'Bike' }],
      [{ slug: 'available', name: 'Available', allowedTransitions: [] }],
    );
    expect(result).toEqual(createdEquipment);
    expect(store.items()).toEqual([reloadedEquipment]);
    expect(store.totalItems()).toBe(1);
  });

  it('keeps the create result even when reload completes empty after an error', () => {
    service.search.mockReturnValue(throwError(() => new Error('reload failed')));

    let result: Equipment | undefined;
    store.create(write).subscribe((value) => {
      result = value;
    });

    expect(result).toEqual(createdEquipment);
    expect(store.items()).toEqual([]);
    expect(store.totalItems()).toBe(0);
  });

  it('sets saving true during create and resets it after reload completes', () => {
    const createSubject = new Subject<Equipment>();
    service.create.mockReturnValue(createSubject.asObservable());
    service.search.mockReturnValue(of({ items: [reloadedEquipment], totalItems: 1 }));

    store.create(write).subscribe();

    expect(store.saving()).toBe(true);

    createSubject.next(createdEquipment);
    createSubject.complete();

    expect(store.saving()).toBe(false);
  });
});
