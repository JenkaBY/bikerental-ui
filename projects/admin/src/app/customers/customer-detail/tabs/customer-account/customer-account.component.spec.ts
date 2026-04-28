import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { CustomerFinanceStore } from '@store.customer-finance.store';
import { CustomerAccountComponent } from './customer-account.component';
import { CustomerLayoutStore } from '../../customer-layout.store';
import { CustomerTransactionsStore } from '../../customer-transactions.store';

const makeLayoutStore = () => ({
  customerId: signal('c1'),
});

const makeFinanceStore = () => ({
  balance: signal({
    available: { amount: 100, currency: 'BYN' },
    reserved: { amount: 20, currency: 'BYN' },
    lastUpdatedAt: new Date(),
    isWithdrawalAvailable: true,
  }),
  refreshBalance: vi.fn(),
});

const makeTransactionsStore = () => ({ invalidate: vi.fn() });

const makeDialog = (result: unknown) => ({
  open: vi.fn().mockReturnValue({ afterClosed: () => of(result) }),
});

describe('CustomerAccountComponent', () => {
  let fixture: ComponentFixture<CustomerAccountComponent>;
  let layoutStore: ReturnType<typeof makeLayoutStore>;
  let transactionsStore: ReturnType<typeof makeTransactionsStore>;
  let dialog: ReturnType<typeof makeDialog>;
  const snackOpen = vi.fn();

  const setup = async (dialogResult: unknown) => {
    layoutStore = makeLayoutStore();
    const financeStore = makeFinanceStore();
    transactionsStore = makeTransactionsStore();
    dialog = makeDialog(dialogResult);

    await TestBed.configureTestingModule({
      imports: [CustomerAccountComponent],
      providers: [
        { provide: CustomerLayoutStore, useValue: layoutStore },
        { provide: CustomerFinanceStore, useValue: financeStore },
        { provide: CustomerTransactionsStore, useValue: transactionsStore },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: { open: snackOpen } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerAccountComponent);
    fixture.detectChanges();
  };

  it('should render available balance', async () => {
    await setup(undefined);
    expect(fixture.nativeElement.textContent).toContain('100');
  });

  it('should call refreshBalance and invalidate on top up success', async () => {
    await setup(true);
    fixture.componentInstance.openTopUp();
    // financeStore.refreshBalance should be called (provided as mock)
    const injectedFinance = TestBed.inject(CustomerFinanceStore) as unknown as ReturnType<
      typeof makeFinanceStore
    >;
    expect(injectedFinance.refreshBalance).toHaveBeenCalled();
    expect(transactionsStore.invalidate).toHaveBeenCalled();
  });

  it('should not call refreshBalance on dialog cancel', async () => {
    await setup(undefined);
    fixture.componentInstance.openTopUp();
    const injectedFinance2 = TestBed.inject(CustomerFinanceStore) as unknown as ReturnType<
      typeof makeFinanceStore
    >;
    expect(injectedFinance2.refreshBalance).not.toHaveBeenCalled();
  });
});
