import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { EquipmentType, PricingType, TariffStatus, TariffWrite } from '../models';
import { TariffsService } from '../api/generated';
import { EquipmentTypeStore } from './equipment-type.store';
import { PricingTypeStore } from './pricing-type.store';
import { TariffStore } from './tariff.store';

const equipmentType: EquipmentType = {
  slug: 'bike',
  name: 'Bike',
  description: 'Bike type',
  isForSpecialTariff: false,
};

const pricingType: PricingType = {
  slug: 'FLAT_HOURLY',
  title: 'Flat hourly',
  description: 'Flat hourly pricing',
};

const initialTariffResponse = {
  id: 1,
  name: 'Initial tariff',
  equipmentType: 'bike',
  pricingType: 'FLAT_HOURLY',
  params: { hourlyPrice: 120 },
  validFrom: '2026-01-01',
  status: 'INACTIVE',
};

const updatedTariffResponse = {
  id: 1,
  name: 'Updated tariff',
  equipmentType: 'bike',
  pricingType: 'FLAT_HOURLY',
  params: { hourlyPrice: 140 },
  validFrom: '2026-01-01',
  status: 'ACTIVE',
};

const write: TariffWrite = {
  name: 'New tariff',
  description: 'New',
  equipmentTypeSlug: 'bike',
  pricingType: 'FLAT_HOURLY',
  params: { hourlyPrice: 100 },
  validFrom: new Date('2026-01-01'),
};

describe('TariffStore', () => {
  let store: TariffStore;
  let service: {
    getAllTariffs: ReturnType<typeof vi.fn>;
    createTariff: ReturnType<typeof vi.fn>;
    updateTariff: ReturnType<typeof vi.fn>;
    activateTariff: ReturnType<typeof vi.fn>;
    deactivateTariff: ReturnType<typeof vi.fn>;
  };
  let equipmentTypeStore: { types: ReturnType<typeof vi.fn> };
  let pricingTypeStore: { pricingTypes: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    service = {
      getAllTariffs: vi.fn().mockReturnValue(of({ items: [], totalItems: 0 })),
      createTariff: vi.fn(),
      updateTariff: vi.fn(),
      activateTariff: vi.fn(),
      deactivateTariff: vi.fn(),
    };
    equipmentTypeStore = { types: vi.fn().mockReturnValue([equipmentType]) };
    pricingTypeStore = { pricingTypes: vi.fn().mockReturnValue([pricingType]) };

    TestBed.configureTestingModule({
      providers: [
        TariffStore,
        { provide: TariffsService, useValue: service },
        { provide: EquipmentTypeStore, useValue: equipmentTypeStore },
        { provide: PricingTypeStore, useValue: pricingTypeStore },
      ],
    });

    store = TestBed.inject(TariffStore);
  });

  it('loads tariffs using current paging and lookup stores', () => {
    service.getAllTariffs.mockReturnValue(of({ items: [initialTariffResponse], totalItems: 1 }));

    store.load().subscribe();

    expect(service.getAllTariffs).toHaveBeenCalledWith({ page: 0, size: 10 });
    expect(store.tariffs()).toEqual([
      expect.objectContaining({
        id: 1,
        name: 'Initial tariff',
        equipmentType,
        pricingType,
        status: TariffStatus.INACTIVE,
        isActive: false,
      }),
    ]);
    expect(store.totalItems()).toBe(1);
  });

  it('sets loading true while load request is in flight and resets on completion', () => {
    const subject = new Subject<{ items: (typeof initialTariffResponse)[]; totalItems: number }>();
    service.getAllTariffs.mockReturnValue(subject.asObservable());

    store.load().subscribe();
    expect(store.loading()).toBe(true);

    subject.next({ items: [initialTariffResponse], totalItems: 1 });
    subject.complete();

    expect(store.loading()).toBe(false);
  });

  it('keeps previous tariff state when load fails', () => {
    service.getAllTariffs.mockReturnValue(of({ items: [initialTariffResponse], totalItems: 1 }));
    store.load().subscribe();

    service.getAllTariffs.mockReturnValue(throwError(() => new Error('fail')));
    store.load().subscribe();

    expect(store.loading()).toBe(false);
    expect(store.tariffs()).toEqual([expect.objectContaining({ id: 1, name: 'Initial tariff' })]);
    expect(store.totalItems()).toBe(1);
  });

  it('setPage updates paging signals and reloads', () => {
    service.getAllTariffs.mockReturnValue(of({ items: [], totalItems: 0 }));

    store.setPage(3, 25);

    expect(store.currentPage()).toBe(3);
    expect(store.pageSize()).toBe(25);
    expect(service.getAllTariffs).toHaveBeenLastCalledWith({ page: 3, size: 25 });
  });

  it('create resets page to zero and reloads after successful create', () => {
    store.setPage(5, 10);
    service.createTariff.mockReturnValue(of(initialTariffResponse));
    service.getAllTariffs.mockReturnValue(of({ items: [updatedTariffResponse], totalItems: 1 }));

    let createdName = '';
    store.create(write).subscribe((created) => {
      createdName = created.name;
    });

    expect(service.createTariff).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New tariff',
        equipmentTypeSlug: 'bike',
        pricingType: 'FLAT_HOURLY',
      }),
    );
    expect(store.currentPage()).toBe(0);
    expect(service.getAllTariffs).toHaveBeenLastCalledWith({ page: 0, size: 10 });
    expect(createdName).toBe('Initial tariff');
    expect(store.tariffs()).toEqual([
      expect.objectContaining({ id: 1, name: 'Updated tariff', status: TariffStatus.ACTIVE }),
    ]);
  });

  it('update replaces only the matching tariff in local state', () => {
    service.getAllTariffs.mockReturnValue(of({ items: [initialTariffResponse], totalItems: 1 }));
    store.load().subscribe();

    service.updateTariff.mockReturnValue(of(updatedTariffResponse));
    store.update(1, write).subscribe();

    expect(service.updateTariff).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        name: 'New tariff',
        equipmentTypeSlug: 'bike',
      }),
    );
    expect(store.tariffs()).toEqual([
      expect.objectContaining({ id: 1, name: 'Updated tariff', status: TariffStatus.ACTIVE }),
    ]);
  });

  it('activate and deactivate update tariff status in local state', () => {
    service.getAllTariffs.mockReturnValue(of({ items: [initialTariffResponse], totalItems: 1 }));
    store.load().subscribe();

    service.activateTariff.mockReturnValue(of(updatedTariffResponse));
    store.activate(1).subscribe();
    expect(store.tariffs()[0].status).toBe(TariffStatus.ACTIVE);

    service.deactivateTariff.mockReturnValue(of(initialTariffResponse));
    store.deactivate(1).subscribe();
    expect(store.tariffs()[0].status).toBe(TariffStatus.INACTIVE);
  });

  it('sets saving true while write operations are in flight', () => {
    const createSubject = new Subject<typeof initialTariffResponse>();
    const updateSubject = new Subject<typeof updatedTariffResponse>();
    const activateSubject = new Subject<typeof updatedTariffResponse>();
    const deactivateSubject = new Subject<typeof initialTariffResponse>();

    service.createTariff.mockReturnValue(createSubject.asObservable());
    service.updateTariff.mockReturnValue(updateSubject.asObservable());
    service.activateTariff.mockReturnValue(activateSubject.asObservable());
    service.deactivateTariff.mockReturnValue(deactivateSubject.asObservable());
    service.getAllTariffs.mockReturnValue(of({ items: [initialTariffResponse], totalItems: 1 }));

    store.create(write).subscribe();
    expect(store.saving()).toBe(true);
    createSubject.next(initialTariffResponse);
    createSubject.complete();
    expect(store.saving()).toBe(false);

    store.update(1, write).subscribe();
    expect(store.saving()).toBe(true);
    updateSubject.next(updatedTariffResponse);
    updateSubject.complete();
    expect(store.saving()).toBe(false);

    store.activate(1).subscribe();
    expect(store.saving()).toBe(true);
    activateSubject.next(updatedTariffResponse);
    activateSubject.complete();
    expect(store.saving()).toBe(false);

    store.deactivate(1).subscribe();
    expect(store.saving()).toBe(true);
    deactivateSubject.next(initialTariffResponse);
    deactivateSubject.complete();
    expect(store.saving()).toBe(false);
  });
});
