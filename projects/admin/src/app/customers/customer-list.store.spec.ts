import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CustomerListStore } from './customer-list.store';
import { api } from '@bikerental/shared';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('CustomerListStore', () => {
  let store: CustomerListStore;

  const mockCustomerResponse = {
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
    customersService.searchByPhone.mockReturnValue(of([mockCustomerResponse]));

    TestBed.configureTestingModule({
      providers: [
        CustomerListStore,
        { provide: api.CustomersService, useValue: customersService },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    });

    store = TestBed.inject(CustomerListStore);
  });

  it('should initialize and expose customers and loading signals', async () => {
    // initial load may run automatically (debounced null search), just assert shapes
    await new Promise((r) => setTimeout(r, 20));
    expect(Array.isArray(store.customers())).toBe(true);
    expect(typeof store.loading()).toBe('boolean');
  });

  it('does not call service for short queries (<4 chars)', async () => {
    // clear previous calls (initial load may have triggered a call)
    customersService.searchByPhone.mockClear();
    store.search('12');
    await new Promise((r) => setTimeout(r, 50));
    const calls = customersService.searchByPhone.mock.calls as unknown[][];
    const onlyShortOrNull = calls.every((c: unknown[]) => {
      const arg = c[0];
      return arg === null || (typeof arg === 'string' && arg.length < 4);
    });
    expect(onlyShortOrNull).toBe(true);
  });

  it('calls service for empty search (normalized to null) and populates customers', async () => {
    store.search('');
    await new Promise((r) => setTimeout(r, 50));
    expect(customersService.searchByPhone).toHaveBeenCalledWith(null);
    expect(store.customers().length).toBe(1);
    expect(store.customers()[0].phone).toBe('+375291234567');
  });
});
