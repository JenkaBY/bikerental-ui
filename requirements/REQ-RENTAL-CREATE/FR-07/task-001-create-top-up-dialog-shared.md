# Task 001: Create `TopUpDialogComponent` in Shared Library

> **Applied Skill:** `angular-component` — Standalone component with `OnPush` change detection, `inject()` for DI, `signal()` for local state. Replaces `CustomerFinanceStore` with direct `FinanceService` injection, making it project-agnostic.

## 1. Objective

Create a project-agnostic `TopUpDialogComponent` inside the shared library by porting the existing admin implementation and replacing the `CustomerFinanceStore` dependency with a direct call to the generated `FinanceService` via `CustomerFinanceMapper`. All other behaviour (form shape, idempotency key, `MAT_DIALOG_DATA` contract, snackbar on error) is preserved unchanged.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/components/top-up-dialog/top-up-dialog.component.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { v4 as uuid } from 'uuid';
import { FinanceService } from '../../../core/api/generated/services/finance.service';
import { CustomerFinanceMapper } from '../../../core/mappers/customer-finance.mapper';
import { UserStore } from '../../../core/state/user.store';
import type { PaymentMethod } from '../../../core/models/transaction.model';
import { Labels } from '../../constant/labels';
import { CancelButtonComponent } from '../cancel-button/cancel-button.component';
import { PaymentMethodSelectComponent } from '../payment-method/payment-method.component';
```

**Code to Add/Replace:**

* **Location:** Full file content — this is a new file

```typescript
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { v4 as uuid } from 'uuid';
import { FinanceService } from '../../../core/api/generated/services/finance.service';
import { CustomerFinanceMapper } from '../../../core/mappers/customer-finance.mapper';
import { UserStore } from '../../../core/state/user.store';
import type { PaymentMethod } from '../../../core/models/transaction.model';
import { Labels } from '../../constant/labels';
import { CancelButtonComponent } from '../cancel-button/cancel-button.component';
import { PaymentMethodSelectComponent } from '../payment-method/payment-method.component';

interface TopUpDialogData {
  customerId: string;
}

@Component({
  selector: 'app-top-up-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    PaymentMethodSelectComponent,
    CancelButtonComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ Labels.TopUpDialogTitle }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-3 pt-2">
        <mat-form-field appearance="outline">
          <mat-label>{{ Labels.TopUpAmountLabel }}</mat-label>
          <input matInput type="number" min="0.01" step="0.01" formControlName="amount" />
        </mat-form-field>

        <app-payment-method-select formControlName="paymentMethod"></app-payment-method-select>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <app-form-cancel-button></app-form-cancel-button>
      <button mat-flat-button [disabled]="form.invalid || submitting()" (click)="confirm()">
        {{ Labels.TopUpConfirmButton }}
      </button>
    </mat-dialog-actions>
  `,
})
export class TopUpDialogComponent {
  protected readonly Labels = Labels;

  private readonly data = inject<TopUpDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<TopUpDialogComponent>>(MatDialogRef);
  private readonly financeService = inject(FinanceService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly userStore = inject(UserStore);

  protected readonly submitting = signal(false);
  protected errorShown = false;

  public readonly form = new FormGroup({
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    paymentMethod: new FormControl<PaymentMethod>('CASH', [Validators.required]),
  });

  private readonly idempotencyKey = uuid();

  public confirm(): void {
    if (this.form.invalid || this.submitting()) return;
    const { amount, paymentMethod } = this.form.getRawValue();
    this.submitting.set(true);

    this.financeService
      .recordDeposit(
        CustomerFinanceMapper.toRecordDepositRequest({
          idempotencyKey: this.idempotencyKey,
          customerId: this.data.customerId,
          amount: amount!,
          paymentMethod: paymentMethod as PaymentMethod,
          operatorId: this.userStore.currentUser()?.id,
        }),
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.submitting.set(false);
          this.errorShown = true;
          this.snackBar.open(Labels.TopUpError, undefined, { duration: 4000 });
          return EMPTY;
        }),
      )
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.dialogRef.close(true);
        },
      });
  }
}
```

## 4. Validation Steps

skip
