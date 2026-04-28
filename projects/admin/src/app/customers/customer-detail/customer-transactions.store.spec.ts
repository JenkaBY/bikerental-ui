import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomerTransactionsStore } from './customer-transactions.store';
import { FinanceService } from '../../../../../shared/src/core/api/generated';
import { CustomerLayoutStore } from './customer-layout.store';

describe('CustomerTransactionsStore', () => {
  let store: CustomerTransactionsStore;
  let financeService: { getTransactionHistory: ReturnType<typeof vi.fn> };
  let layoutStore: { customerId: () => string | null };

  const sampleItem = {
    customerId: 'c1',
    amount: 100,
    recordedAt: new Date().toISOString(),
    type: 'DEPOSIT',
    paymentMethod: 'CASH',
    reason: 'test',
    sourceType: 'ORDER',
    sourceId: 's1',
  };

  beforeEach(() => {
    financeService = { getTransactionHistory: vi.fn() };
    layoutStore = { customerId: () => 'c1' };

    TestBed.configureTestingModule({
      providers: [
        CustomerTransactionsStore,
        { provide: FinanceService, useValue: financeService },
        { provide: CustomerLayoutStore, useValue: layoutStore },
      ],
    });

    store = TestBed.inject(CustomerTransactionsStore);
  });

  it('loads page 0 on load()', async () => {
    financeService.getTransactionHistory.mockReturnValue(
      of({ items: [sampleItem], totalItems: 1 }),
    );

    store.load();
    await Promise.resolve();

    expect(financeService.getTransactionHistory).toHaveBeenCalled();
    expect(store.transactions().length).toBe(1);
    expect(store.transactions()[0].amount.currency).toBe('BYN');
    expect(store.transactions()[0].amountColor).toBe('positive');
    expect(store.pageIndex()).toBe(0);
    expect(store.totalItems()).toBe(1);
    expect(store.loading()).toBe(false);
  });

  it('does not re-fetch on second load() without invalidate()', async () => {
    financeService.getTransactionHistory.mockReturnValue(
      of({ items: [sampleItem], totalItems: 1 }),
    );

    store.load();
    await Promise.resolve();
    store.load();

    expect(financeService.getTransactionHistory).toHaveBeenCalledTimes(1);
  });

  it('re-fetches after invalidate()', async () => {
    financeService.getTransactionHistory.mockReturnValue(
      of({ items: [sampleItem], totalItems: 1 }),
    );

    store.load();
    await Promise.resolve();
    store.invalidate();
    store.load();
    await Promise.resolve();

    expect(financeService.getTransactionHistory).toHaveBeenCalledTimes(2);
  });

  it('loadPage fetches requested page and updates pageIndex', async () => {
    financeService.getTransactionHistory.mockReturnValue(
      of({ items: [sampleItem], totalItems: 5 }),
    );

    store.loadPage(2);
    await Promise.resolve();

    expect(store.pageIndex()).toBe(2);
    expect(store.totalItems()).toBe(5);
    expect(financeService.getTransactionHistory).toHaveBeenCalled();
  });

  it('sets empty transactions and stops loading on HTTP error', async () => {
    financeService.getTransactionHistory.mockReturnValue(throwError(() => new Error('500')));

    store.load();
    await Promise.resolve();

    expect(store.transactions()).toEqual([]);
    expect(store.loading()).toBe(false);
  });

  it('does nothing when customerId is missing', async () => {
    // create a new store instance wired to a layoutStore with no id
    const finance = {
      getTransactionHistory: vi.fn().mockReturnValue(of({ items: [sampleItem], totalItems: 1 })),
    };
    const noIdLayout = { customerId: () => null };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        CustomerTransactionsStore,
        { provide: FinanceService, useValue: finance },
        { provide: CustomerLayoutStore, useValue: noIdLayout },
      ],
    });

    const s2 = TestBed.inject(CustomerTransactionsStore);
    s2.load();
    await Promise.resolve();

    expect(finance.getTransactionHistory).not.toHaveBeenCalled();
  });
});
