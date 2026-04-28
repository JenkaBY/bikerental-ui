import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@bikerental/shared';
import { CustomerLayoutStore } from './customer-layout.store';
import { CustomerRentalsStore } from './customer-rentals.store';

const makeRentalsService = () => ({
  getRentals: vi.fn().mockReturnValue(of({ items: [], totalItems: 0 })),
  getRentalById: vi.fn().mockReturnValue(
    of({
      id: 1,
      customerId: 'c1',
      equipmentItems: [],
      status: 'ACTIVE',
      startedAt: new Date(),
      plannedDurationMinutes: 60,
      estimatedCost: 50,
    }),
  ),
});

const makeLayoutStore = () => ({ customerId: vi.fn().mockReturnValue('c1') });

describe('CustomerRentalsStore', () => {
  let store: CustomerRentalsStore;
  let rentalsService: ReturnType<typeof makeRentalsService>;

  beforeEach(() => {
    rentalsService = makeRentalsService();
    TestBed.configureTestingModule({
      providers: [
        CustomerRentalsStore,
        { provide: api.RentalsService, useValue: rentalsService },
        { provide: CustomerLayoutStore, useValue: makeLayoutStore() },
      ],
    });
    store = TestBed.inject(CustomerRentalsStore);
  });

  it('should load rentals and set loaded flag', async () => {
    rentalsService.getRentals.mockReturnValue(
      of({
        items: [{ id: 1, status: 'ACTIVE', startedAt: new Date(), equipmentIds: [] }],
        totalItems: 1,
      }),
    );
    store.load();
    await Promise.resolve();
    expect(store.rentals().length).toBe(1);
    expect(store.listLoading()).toBe(false);
  });

  it('should not re-fetch on second load() call', async () => {
    store.load();
    await Promise.resolve();
    store.load();
    expect(rentalsService.getRentals).toHaveBeenCalledTimes(1);
  });

  it('should fetch detail on first expand', async () => {
    store.toggleExpand(1);
    await Promise.resolve();
    expect(store.detailCache().has(1)).toBe(true);
    expect(store.isExpanded(1)).toBe(true);
  });

  it('should not re-fetch detail on second expand of same id', async () => {
    store.toggleExpand(1);
    await Promise.resolve();
    store.toggleExpand(1); // collapse
    store.toggleExpand(1); // re-expand
    await Promise.resolve();
    expect(rentalsService.getRentalById).toHaveBeenCalledTimes(1);
  });

  it('should set empty array on list load error', async () => {
    rentalsService.getRentals.mockReturnValue(throwError(() => new Error('500')));
    store.load();
    await Promise.resolve();
    expect(store.rentals()).toEqual([]);
  });
});
