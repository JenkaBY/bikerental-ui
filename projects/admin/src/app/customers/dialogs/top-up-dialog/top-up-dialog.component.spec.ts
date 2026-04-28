import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomerFinanceStore } from '@store.customer-finance.store';
import { TopUpDialogComponent } from './top-up-dialog.component';

const makeFinanceService = () => ({
  recordDeposit: vi.fn().mockReturnValue(of({ transactionId: 't1', recordedAt: new Date() })),
});

describe('TopUpDialogComponent', () => {
  let fixture: ComponentFixture<TopUpDialogComponent>;
  let financeService: ReturnType<typeof makeFinanceService>;
  const dialogClose = vi.fn();
  const snackOpen = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    financeService = makeFinanceService();
    await TestBed.configureTestingModule({
      imports: [TopUpDialogComponent],
      providers: [
        { provide: CustomerFinanceStore, useValue: financeService },
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
    fixture.componentInstance.form.setValue({ amount: 50, paymentMethod: 'CASH' });
    fixture.componentInstance.confirm();
    expect(dialogClose).toHaveBeenCalledWith(true);
  });

  it('should show error snackbar and stay open on failure', async () => {
    financeService.recordDeposit.mockReturnValue(throwError(() => new Error('500')));
    fixture.componentInstance.form.setValue({ amount: 50, paymentMethod: 'CASH' });
    fixture.componentInstance.confirm();
    await Promise.resolve();
    expect(fixture.componentInstance['errorShown']).toBe(true);
    expect(dialogClose).not.toHaveBeenCalled();
  });

  it('should not call recordDeposit when form is invalid', () => {
    fixture.componentInstance.confirm();
    expect(financeService.recordDeposit).not.toHaveBeenCalled();
  });

  it('should reuse the same idempotencyKey on retry', () => {
    fixture.componentInstance.form.setValue({ amount: 50, paymentMethod: 'CASH' });
    financeService.recordDeposit.mockReturnValueOnce(throwError(() => new Error('500')));
    fixture.componentInstance.confirm();
    fixture.componentInstance.confirm();
    const [call1] = financeService.recordDeposit.mock.calls[0];
    const [call2] = financeService.recordDeposit.mock.calls[1];
    expect(call1.idempotencyKey).toBe(call2.idempotencyKey);
  });
});
