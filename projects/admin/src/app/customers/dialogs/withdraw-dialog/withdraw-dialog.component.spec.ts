import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomerFinanceStore } from '../../../../../../shared/src/core/state/customer-finance.store';
import { WithdrawDialogComponent } from './withdraw-dialog.component';

const availableBalance = { amount: 100, currency: 'BYN' };

const makeFinanceService = () => ({
  recordWithdrawal: vi.fn().mockReturnValue(of({ transactionId: 't1', recordedAt: new Date() })),
});

describe('WithdrawDialogComponent', () => {
  let fixture: ComponentFixture<WithdrawDialogComponent>;
  let financeService: ReturnType<typeof makeFinanceService>;
  const dialogClose = vi.fn();
  const snackOpen = vi.fn();

  beforeEach(async () => {
    financeService = makeFinanceService();
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [WithdrawDialogComponent],
      providers: [
        { provide: CustomerFinanceStore, useValue: financeService },
        { provide: MatDialogRef, useValue: { close: dialogClose } },
        { provide: MAT_DIALOG_DATA, useValue: { customerId: 'c1', availableBalance } },
        { provide: MatSnackBar, useValue: { open: snackOpen } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(WithdrawDialogComponent);
    fixture.detectChanges();
  });

  it('should create', () => expect(fixture.componentInstance).toBeTruthy());

  it('should close with true on successful withdrawal', () => {
    fixture.componentInstance.form.setValue({ amount: 50, paymentMethod: 'CASH' });
    fixture.componentInstance.confirm();
    expect(dialogClose).toHaveBeenCalledWith(true);
  });

  it('should show error snackbar and stay open on failure', () => {
    financeService.recordWithdrawal.mockReturnValue(throwError(() => new Error('500')));
    fixture.componentInstance.form.setValue({ amount: 50, paymentMethod: 'CASH' });
    fixture.componentInstance.confirm();
    expect(snackOpen).toHaveBeenCalled();
    expect(dialogClose).not.toHaveBeenCalled();
  });

  it('should fail validation when amount exceeds available balance', () => {
    fixture.componentInstance.form.controls.amount.setValue(150);
    expect(fixture.componentInstance.form.controls.amount.hasError('maxAmount')).toBe(true);
  });

  it('should pass validation when amount equals available balance', () => {
    fixture.componentInstance.form.controls.amount.setValue(100);
    fixture.componentInstance.form.controls.paymentMethod.setValue('CASH');
    expect(fixture.componentInstance.form.valid).toBe(true);
  });

  it('should reuse the same idempotencyKey on retry', () => {
    fixture.componentInstance.form.setValue({ amount: 50, paymentMethod: 'CASH' });
    financeService.recordWithdrawal.mockReturnValueOnce(throwError(() => new Error('500')));
    fixture.componentInstance.confirm();
    fixture.componentInstance.confirm();
    const key1 = financeService.recordWithdrawal.mock.calls[0][0].idempotencyKey;
    const key2 = financeService.recordWithdrawal.mock.calls[1][0].idempotencyKey;
    expect(key1).toBe(key2);
  });
});
