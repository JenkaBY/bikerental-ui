import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { Equipment, EquipmentStatus, EquipmentType, EquipmentWrite } from '../models';
import { EquipmentService } from '../api/generated';
import { EquipmentStore } from './equipment.store';
import { EquipmentStatusStore } from './equipment-status.store';
import { EquipmentTypeStore } from './equipment-type.store';

const bikeType: EquipmentType = {
  slug: 'bike',
  name: 'Bike',
  description: 'Two-wheeled bicycle',
  isForSpecialTariff: false,
};

const availableStatus: EquipmentStatus = {
  slug: 'available',
  name: 'Available',
  description: 'Available for rent',
  allowedTransitions: ['maintenance', 'retired'],
};

const maintenanceStatus: EquipmentStatus = {
  slug: 'maintenance',
  name: 'Maintenance',
  description: 'Under maintenance',
  allowedTransitions: ['available'],
};

const createdEquipmentResponse = {
  id: 10,
  serialNumber: 'SN-010',
  uid: 'UID-010',
  type: 'bike',
  status: 'available',
  model: 'Roadster',
};

const reloadedEquipmentResponse = {
  id: 11,
  serialNumber: 'SN-011',
  uid: 'UID-011',
  type: 'bike',
  status: 'maintenance',
  model: 'City',
};

const createdEquipment: Equipment = {
  id: 10,
  serialNumber: 'SN-010',
  uid: 'UID-010',
  type: bikeType,
  status: availableStatus,
  model: 'Roadster',
};

const reloadedEquipment: Equipment = {
  id: 11,
  serialNumber: 'SN-011',
  uid: 'UID-011',
  type: bikeType,
  status: maintenanceStatus,
  model: 'City',
};

const write: EquipmentWrite = {
  serialNumber: 'SN-010',
  typeSlug: 'bike',
};

describe('EquipmentStore', () => {
  let store: EquipmentStore;
  let service: {
    searchEquipments: ReturnType<typeof vi.fn>;
    createEquipment: ReturnType<typeof vi.fn>;
  };
  let equipmentTypeStore: { types: ReturnType<typeof vi.fn> };
  let equipmentStatusStore: { statuses: ReturnType<typeof vi.fn> };
  let createMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createMock = vi.fn().mockReturnValue(of(createdEquipmentResponse));
    service = {
      searchEquipments: vi.fn().mockReturnValue(of({ items: [], totalItems: 0 })),
      createEquipment: createMock,
    };
    // Mock stores with computed-like behavior (return values directly, not observables)
    equipmentTypeStore = { types: vi.fn().mockReturnValue([bikeType]) };
    equipmentStatusStore = {
      statuses: vi.fn().mockReturnValue([availableStatus, maintenanceStatus]),
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
    service.searchEquipments.mockReturnValue(
      of({ items: [reloadedEquipmentResponse], totalItems: 1 }),
    );

    let result: Equipment | undefined;
    store.create(write).subscribe((value) => {
      result = value;
    });

    expect(service.createEquipment).toHaveBeenCalledOnce();
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        serialNumber: 'SN-010',
        typeSlug: 'bike',
      }),
    );

    expect(service.searchEquipments).toHaveBeenCalledWith(
      { page: 0, size: 20 },
      undefined,
      undefined,
    );
    expect(result).toEqual(createdEquipment);
    expect(store.items()).toEqual([reloadedEquipment]);
    expect(store.totalItems()).toBe(1);
  });

  it('sets saving true during create and resets it after reload completes', () => {
    const createSubject = new Subject<typeof createdEquipmentResponse>();
    service.createEquipment.mockReturnValue(createSubject.asObservable());
    service.searchEquipments.mockReturnValue(
      of({ items: [reloadedEquipmentResponse], totalItems: 1 }),
    );

    store.create(write).subscribe();

    expect(store.saving()).toBe(true);

    createSubject.next(createdEquipmentResponse);
    createSubject.complete();

    expect(store.saving()).toBe(false);
  });

  it('reloads from first page when status filter changes', () => {
    service.searchEquipments.mockReturnValue(of({ items: [], totalItems: 0 }));

    store.setPage(3, 50);
    store.setFilterStatus('available');

    expect(service.searchEquipments).toHaveBeenLastCalledWith(
      { page: 0, size: 50 },
      'available',
      undefined,
    );
  });

  it('reloads from first page when type filter changes', () => {
    service.searchEquipments.mockReturnValue(of({ items: [], totalItems: 0 }));

    store.setPage(2, 25);
    store.setFilterType('bike');

    expect(service.searchEquipments).toHaveBeenLastCalledWith(
      { page: 0, size: 25 },
      undefined,
      'bike',
    );
  });

  it('reloads with requested page and size when page changes', () => {
    service.searchEquipments.mockReturnValue(of({ items: [], totalItems: 0 }));

    store.setPage(4, 10);

    expect(service.searchEquipments).toHaveBeenLastCalledWith(
      { page: 4, size: 10 },
      undefined,
      undefined,
    );
  });
});
