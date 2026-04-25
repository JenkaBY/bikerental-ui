# Task 016: Withdraw Dialog

> **Applied Skills:** `angular-component` (standalone, OnPush, inject(), signal()), `angular-forms` (Reactive Forms, min/max validators), `angular-di` (MAT_DIALOG_DATA with Money type), `angular-testing` (Vitest, dialog value providers).

## 1. Objective

Create `WithdrawDialogComponent`. Symmetric to `TopUpDialogComponent`. Receives `{ customerId, availableBalance: Money }` from dialog data. Validates amount > 0 and ≤ `availableBalance.amount`. Uses the same three payment methods. The idempotency key is generated once on construction. Calls `FinanceService.recordWithdrawal()` on confirm.

## 2. Files to Modify / Create

### File 1 — Component

* **File Path:** `projects/admin/src/app/customers/dialogs/withdraw-dialog/withdraw-dialog.component.ts`
* **Action:** Create New File

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CurrencyPipe } from '@angular/common';
import { api, Labels, Money } from '@bikerental/shared';

interface WithdrawDialogData {
  customerId: string;
  availableBalance: Money;
}

type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CARD_TERMINAL';

function maxAmountValidator(max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as number | null;
    if (value == null) return null;
    return value > max ? { maxAmount: { max, actual: value } } : null;
  };
}

@Component({
  selector: 'app-withdraw-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    CurrencyPipe,
  ],
  template: `
    <h2 mat-dialog-title>{{ Labels.WithdrawDialogTitle }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-3 pt-2">
        <mat-form-field appearance="outline">
          <mat-label>{{ Labels.WithdrawAmountLabel }}</mat-label>
          <input matInput type="number" min="0.01" [max]="data.availableBalance.amount" step="0.01" formControlName="amount" />
          <mat-hint>
            {{ Labels.WithdrawAvailableHint }}: {{ data.availableBalance.amount | currency: data.availableBalance.currency }}
          </mat-hint>
          @if (form.controls.amount.hasError('maxAmount')) {
            <mat-error i18n>Amount exceeds available balance</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ Labels.WithdrawPaymentMethodLabel }}</mat-label>
          <mat-select formControlName="paymentMethod">
            @for (method of paymentMethods; track method.value) {
              <mat-option [value]="method.value">{{ method.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ Labels.CancelButton }}</button>
      <button
        mat-flat-button
        [disabled]="form.invalid || submitting()"
        (click)="confirm()"
      >
        {{ Labels.WithdrawConfirmButton }}
      </button>
    </mat-dialog-actions>
  `,
})
export class WithdrawDialogComponent {
  protected readonly Labels = Labels;

  protected readonly paymentMethods: { value: PaymentMethod; label: string }[] = [
    { value: 'CASH', label: Labels.PaymentMethodCash },
    { value: 'BANK_TRANSFER', label: Labels.PaymentMethodBankTransfer },
    { value: 'CARD_TERMINAL', label: Labels.PaymentMethodCardTerminal },
  ];

  protected readonly data = inject<WithdrawDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<WithdrawDialogComponent>>(MatDialogRef);
  private readonly financeService = inject(api.FinanceService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly submitting = signal(false);

  protected readonly form = new FormGroup({
    amount: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
      maxAmountValidator(this.data.availableBalance.amount),
    ]),
    paymentMethod: new FormControl<PaymentMethod | null>(null, [Validators.required]),
  });

  private readonly idempotencyKey = crypto.randomUUID();

  protected confirm(): void {
    if (this.form.invalid || this.submitting()) return;
    const { amount, paymentMethod } = this.form.getRawValue();
    this.submitting.set(true);

    this.financeService
      .recordWithdrawal({
        idempotencyKey: this.idempotencyKey,
        customerId: this.data.customerId,
        amount: amount!,
        paymentMethod: paymentMethod as NonNullable<typeof paymentMethod>,
        operatorId: '',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.dialogRef.close(true);
        },
        error: () => {
          this.submitting.set(false);
          this.snackBar.open(Labels.WithdrawError, undefined, { duration: 4000 });
        },
      });
  }
}
```

---

### File 2 — Unit Test

* **File Path:** `projects/admin/src/app/customers/dialogs/withdraw-dialog/withdraw-dialog.component.spec.ts`
* **Action:** Create New File

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from '@bikerental/shared';
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
    await TestBed.configureTestingModule({
      imports: [WithdrawDialogComponent],
      providers: [
        { provide: api.FinanceService, useValue: financeService },
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
```

## 4. Validation Steps

```bash
npx ng test admin --watch=false --include=projects/admin/src/app/customers/dialogs/withdraw-dialog/withdraw-dialog.component.spec.ts
```
