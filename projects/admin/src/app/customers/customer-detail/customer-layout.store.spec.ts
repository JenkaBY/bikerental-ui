import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api, CustomerStore } from '@bikerental/shared';
import { CustomerFinanceStore } from '@store.customer-finance.store';
import { CustomerLayoutStore } from './customer-layout.store';

const makeCustomersService = () => ({
  getById: vi
    .fn()
    .mockReturnValue(of({ id: '1', phone: '+375', firstName: 'Ivan', lastName: 'Ivanov' })),
  updateCustomer: vi
    .fn()
    .mockReturnValue(of({ id: '1', phone: '+375', firstName: 'Ivan', lastName: 'Updated' })),
});

const makeFinanceService = () => ({
  getBalances: vi
    .fn()
    .mockReturnValue(of({ walletBalance: 100, holdBalance: 20, lastUpdatedAt: new Date() })),
});

describe('CustomerLayoutStore', () => {
  let store: CustomerLayoutStore;
  let customersService: ReturnType<typeof makeCustomersService>;
  let financeService: ReturnType<typeof makeFinanceService>;

  beforeEach(() => {
    customersService = makeCustomersService();
    financeService = makeFinanceService();

    TestBed.configureTestingModule({
      providers: [
        CustomerLayoutStore,
        { provide: api.CustomersService, useValue: customersService },
        { provide: api.FinanceService, useValue: financeService },
        // provide the shared stores so CustomerLayoutStore can inject them
        CustomerStore,
        CustomerFinanceStore,
      ],
    });

    store = TestBed.inject(CustomerLayoutStore);
  });

  it('should set customer and balance after load()', async () => {
    store.init('1');
    await Promise.resolve();
    expect(store.customer()?.firstName).toBe('Ivan');
    expect(store.balance()?.available.amount).toBe(100);
    expect(store.balance()?.available.currency).toBe('BYN');
  });

  it('should set balance to null on getBalances failure', async () => {
    financeService.getBalances.mockReturnValue(throwError(() => new Error('500')));
    store.init('1');
    await Promise.resolve();
    expect(store.balance()).toBeNull();
  });

  it('should reflect updates when underlying CustomerStore.update is called', async () => {
    store.init('1');
    await Promise.resolve();

    const customerStore = TestBed.inject(CustomerStore);

    let completed = false;
    customerStore
      .update('1', { phone: '+375', firstName: 'Ivan', lastName: 'Updated' })
      .subscribe(() => (completed = true));

    expect(completed).toBe(true);
    expect(store.customer()?.lastName).toBe('Updated');
  });

  it('should refresh balance when underlying CustomerFinanceStore.refreshBalance is called', async () => {
    store.init('1');
    await Promise.resolve();
    financeService.getBalances.mockReturnValue(
      of({ walletBalance: 200, holdBalance: 0, lastUpdatedAt: new Date() }),
    );

    const financeStore = TestBed.inject(CustomerFinanceStore);
    financeStore.refreshBalance();
    await Promise.resolve();
    expect(store.balance()?.available.amount).toBe(200);
  });
});
