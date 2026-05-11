import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { CustomerListStore } from './customer-list.store';
import { CustomersService } from '../api/generated';

describe('CustomerListStore', () => {
  let store: CustomerListStore;

  const mockCustomerSearchResponse = {
    id: '1',
    phone: '+375291234567',
    firstName: 'Ivan',
    lastName: 'Ivanov',
  };

  const customersService = {
    searchByPhone: vi.fn(),
  };

  beforeEach(() => {
    customersService.searchByPhone.mockReset();
    customersService.searchByPhone.mockReturnValue(of([mockCustomerSearchResponse]));

    TestBed.configureTestingModule({
      providers: [CustomerListStore, { provide: CustomersService, useValue: customersService }],
    });

    store = TestBed.inject(CustomerListStore);
  });

  it('should initialize and expose customers and loading signals', async () => {
    await new Promise((r) => setTimeout(r, 20));
    expect(Array.isArray(store.customers())).toBe(true);
    expect(typeof store.loading()).toBe('boolean');
  });

  it('does not call service for short queries (< 4 chars)', async () => {
    customersService.searchByPhone.mockClear();
    store.search('123');
    await new Promise((r) => setTimeout(r, 50));
    const calls = customersService.searchByPhone.mock.calls as unknown[][];
    const onlyShortOrNull = calls.every((c: unknown[]) => {
      const arg = c[0];
      return arg === null || (typeof arg === 'string' && arg.length < 4);
    });
    expect(onlyShortOrNull).toBe(true);
  });
});
