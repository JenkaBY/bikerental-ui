import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { v4 as uuid } from 'uuid';

import { CancelButtonComponent } from '../cancel-button/cancel-button.component';
import { FormErrorMessages } from '../../validators/form-error-messages';
import { Labels } from '../../constant/labels';
import { MaxDecimalsDirective } from '../../directives/max-decimals.directive';
import { MoneyPipe } from '../../pipes/money.pipe';
import { PaymentMethodSelectComponent } from '../payment-method/payment-method.component';
import { CustomerFinanceStore } from '../../../core/state/customer-finance.store';
import { UserStore } from '../../../core/state/user.store';
import type {
  PaymentMethod,
  Money,
  TransactionSource,
} from '../../../core/models/transaction.model';
import { maxWithdrawAmountValidator } from './max-amount.validator';

interface WithdrawDialogData {
  customerId: string;
  availableBalance: Money;
  source?: TransactionSource;
  sourceId?: string;
}

@Component({
  selector: 'app-withdraw-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CancelButtonComponent,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MoneyPipe,
    PaymentMethodSelectComponent,
    MaxDecimalsDirective,
  ],
  template: `
    <h2 mat-dialog-title>{{ Labels.WithdrawDialogTitle }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-3 pt-2">
        <mat-form-field appearance="outline">
          <mat-label>{{ Labels.WithdrawAmountLabel }}</mat-label>
          <input
            matInput
            type="number"
            min="0.01"
            [max]="data.availableBalance.amount"
            step="0.01"
            formControlName="amount"
            [appMaxDecimals]="2"
          />
          <mat-hint>
            {{ Labels.WithdrawAvailableHint }}:
            {{ data.availableBalance | money }}
          </mat-hint>
          @if (form.controls.amount.hasError('maxAmount')) {
            <mat-error>{{ FormErrorMessages.withdrawAmountExceedsAvailable }}</mat-error>
          }
        </mat-form-field>

        <app-payment-method-select formControlName="paymentMethod"></app-payment-method-select>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <app-form-cancel-button></app-form-cancel-button>
      <button mat-flat-button [disabled]="form.invalid || submitting()" (click)="confirm()">
        {{ Labels.WithdrawConfirmButton }}
      </button>
    </mat-dialog-actions>
  `,
})
export class WithdrawDialogComponent {
  protected readonly Labels = Labels;
  protected readonly data = inject<WithdrawDialogData>(MAT_DIALOG_DATA);
  protected readonly FormErrorMessages = FormErrorMessages;
  private readonly dialogRef = inject(MatDialogRef) as MatDialogRef<WithdrawDialogComponent>;
  private readonly financeStore = inject(CustomerFinanceStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly userStore = inject(UserStore);

  public readonly submitting = signal(false);

  public readonly form = new FormGroup({
    amount: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
      maxWithdrawAmountValidator(this.data.availableBalance.amount),
    ]),
    paymentMethod: new FormControl<PaymentMethod>('CASH', [Validators.required]),
  });

  private readonly idempotencyKey = uuid();

  public confirm(): void {
    if (this.form.invalid || this.submitting()) return;
    const { amount, paymentMethod } = this.form.getRawValue();
    this.submitting.set(true);

    this.financeStore
      .recordWithdrawal({
        idempotencyKey: this.idempotencyKey,
        customerId: this.data.customerId,
        amount: amount!,
        paymentMethod: paymentMethod as PaymentMethod,
        // TODO remove hardcoded value after authorization is done
        operatorId: this.userStore.currentUser()?.id || 'CALL_DEVELOPER_IF_SEE_IT',
        source: this.data.source,
        sourceId: this.data.sourceId,
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
