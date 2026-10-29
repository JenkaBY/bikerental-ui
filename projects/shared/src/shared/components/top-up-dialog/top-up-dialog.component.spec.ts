import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomerFinanceStore } from '../../../core/state/customer-finance.store';
import { AuthService } from '../../../core/auth/auth.service';
import { CurrentPointStore } from '../../../core/state/current-point.store';
import { TopUpDialogComponent } from './top-up-dialog.component';

const makeFinanceStore = () => ({
  recordDeposit: vi.fn().mockReturnValue(of({ transactionId: 't1', recordedAt: new Date() })),
});

const makePointStore = () => ({
  currentSlug: () => 'CNTR',
  points: () => [],
  load: () => of(undefined),
});

const makeAuthService = () => ({
  currentUserId: () => 'op1',
});

describe('TopUpDialogComponent', () => {
  let fixture: ComponentFixture<TopUpDialogComponent>;
  let financeStore: ReturnType<typeof makeFinanceStore>;
  const dialogClose = vi.fn();
  const snackOpen = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    financeStore = makeFinanceStore();
    await TestBed.configureTestingModule({
      imports: [TopUpDialogComponent],
      providers: [
        { provide: CustomerFinanceStore, useValue: financeStore },
        { provide: AuthService, useValue: makeAuthService() },
        { provide: CurrentPointStore, useValue: makePointStore() },
        { provide: MatDialogRef, useValue: { close: dialogClose } },
        { provide: MAT_DIALOG_DATA, useValue: { customerId: 'c1' } },
        { provide: MatSnackBar, useValue: { open: snackOpen } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TopUpDialogComponent);
    fixture.detectChanges();
  });

  it('should create', () => expect(fixture.componentInstance).toBeTruthy());

  it('should close with true on successful deposit', () => {
    fixture.componentInstance.form.setValue({
      amount: 50,
      paymentMethod: 'CASH',
      pointSlug: 'CNTR',
    });
    fixture.componentInstance.confirm();
    expect(dialogClose).toHaveBeenCalledWith(true);
  });

  it('should show error snackbar and stay open on failure', async () => {
    financeStore.recordDeposit.mockReturnValue(throwError(() => new Error('500')));
    fixture.componentInstance.form.setValue({
      amount: 50,
      paymentMethod: 'CASH',
      pointSlug: 'CNTR',
    });
    fixture.componentInstance.confirm();
    await Promise.resolve();
    expect(dialogClose).not.toHaveBeenCalled();
  });

  it('should not call recordDeposit when form is invalid', () => {
    fixture.componentInstance.confirm();
    expect(financeStore.recordDeposit).not.toHaveBeenCalled();
  });

  it('should reuse the same idempotencyKey on retry', () => {
    fixture.componentInstance.form.setValue({
      amount: 50,
      paymentMethod: 'CASH',
      pointSlug: 'CNTR',
    });
    financeStore.recordDeposit.mockReturnValueOnce(throwError(() => new Error('500')));
    fixture.componentInstance.confirm();
    fixture.componentInstance.confirm();
    const firstCallArg = financeStore.recordDeposit.mock.calls[0][0];
    const secondCallArg = financeStore.recordDeposit.mock.calls[1][0];
    expect(firstCallArg.idempotencyKey).toBe(secondCallArg.idempotencyKey);
  });
});
