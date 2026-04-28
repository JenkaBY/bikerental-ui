# Task 015: Top Up Dialog

> **Applied Skills:** `angular-component` (standalone, OnPush, inject()), `angular-forms` (Reactive Forms, min validator), `angular-di` (MAT_DIALOG_DATA, MatDialogRef injection), `angular-testing` (Vitest, dialog value providers).

## 1. Objective

Create `TopUpDialogComponent`. It generates a session-scoped UUID idempotency key on construction, presents an amount field (min 0.01) and a payment method selector (CASH, BANK_TRANSFER, CARD_TERMINAL), and calls `FinanceService.recordDeposit()` on confirm. Closes with `true` on success; stays open and shows an error snackbar on failure.

## 2. Files to Modify / Create

### File 1 — Component

* **File Path:** `projects/admin/src/app/customers/dialogs/top-up-dialog/top-up-dialog.component.ts`
* **Action:** Create New File

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { api, Labels } from '@bikerental/shared';

interface TopUpDialogData {
  customerId: string;
}

type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CARD_TERMINAL';

@Component({
  selector: 'app-top-up-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ Labels.TopUpDialogTitle }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-3 pt-2">
        <mat-form-field appearance="outline">
          <mat-label>{{ Labels.TopUpAmountLabel }}</mat-label>
          <input matInput type="number" min="0.01" step="0.01" formControlName="amount" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ Labels.TopUpPaymentMethodLabel }}</mat-label>
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
        {{ Labels.TopUpConfirmButton }}
      </button>
    </mat-dialog-actions>
  `,
})
export class TopUpDialogComponent {
  protected readonly Labels = Labels;

  protected readonly paymentMethods: { value: PaymentMethod; label: string }[] = [
    { value: 'CASH', label: Labels.PaymentMethodCash },
    { value: 'BANK_TRANSFER', label: Labels.PaymentMethodBankTransfer },
    { value: 'CARD_TERMINAL', label: Labels.PaymentMethodCardTerminal },
  ];

  private readonly data = inject<TopUpDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<TopUpDialogComponent>>(MatDialogRef);
  private readonly financeService = inject(api.FinanceService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly submitting = inject(DestroyRef, { optional: true }) && false
    ? undefined
    : (() => {
        const s = { value: false };
        return { (): boolean => s.value, set: (v: boolean) => (s.value = v) };
      })();

  // Use a proper signal for submitting state
  protected get isSubmitting(): boolean {
    return this._submitting;
  }
  private _submitting = false;

  protected readonly form = new FormGroup({
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    paymentMethod: new FormControl<PaymentMethod | null>(null, [Validators.required]),
  });

  private readonly idempotencyKey = crypto.randomUUID();

  protected confirm(): void {
    if (this.form.invalid || this._submitting) return;
    const { amount, paymentMethod } = this.form.getRawValue();
    this._submitting = true;

    this.financeService
      .recordDeposit({
        idempotencyKey: this.idempotencyKey,
        customerId: this.data.customerId,
        amount: amount!,
        paymentMethod: paymentMethod as NonNullable<typeof paymentMethod>,
        operatorId: '',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this._submitting = false;
          this.dialogRef.close(true);
        },
        error: () => {
          this._submitting = false;
          this.snackBar.open(Labels.TopUpError, undefined, { duration: 4000 });
        },
      });
  }
}
```

**Simplification note:** Replace the `_submitting` boolean with a `signal<boolean>` for proper OnPush change detection. Full signal-based version:

```typescript
import { signal } from '@angular/core';
// ...
protected readonly submitting = signal(false);

protected confirm(): void {
  if (this.form.invalid || this.submitting()) return;
  this.submitting.set(true);
  this.financeService.recordDeposit({ ... })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: () => { this.submitting.set(false); this.dialogRef.close(true); },
      error: () => { this.submitting.set(false); this.snackBar.open(Labels.TopUpError, ...); },
    });
}
```

**Use the signal version above** — it is idiomatic for this project. Remove the `_submitting` boolean and `isSubmitting` getter entirely. The template uses `[disabled]="form.invalid || submitting()"`.

---

### File 2 — Unit Test

* **File Path:** `projects/admin/src/app/customers/dialogs/top-up-dialog/top-up-dialog.component.spec.ts`
* **Action:** Create New File

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from '@bikerental/shared';
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
    financeService = makeFinanceService();
    await TestBed.configureTestingModule({
      imports: [TopUpDialogComponent],
      providers: [
        { provide: api.FinanceService, useValue: financeService },
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

  it('should show error snackbar and stay open on failure', () => {
    financeService.recordDeposit.mockReturnValue(throwError(() => new Error('500')));
    fixture.componentInstance.form.setValue({ amount: 50, paymentMethod: 'CASH' });
    fixture.componentInstance.confirm();
    expect(snackOpen).toHaveBeenCalled();
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
```

## 4. Validation Steps

```bash
npx ng test admin --watch=false --include=projects/admin/src/app/customers/dialogs/top-up-dialog/top-up-dialog.component.spec.ts
```
