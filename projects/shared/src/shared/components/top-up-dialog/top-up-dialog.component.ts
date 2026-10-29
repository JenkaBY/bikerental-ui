import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { v4 as uuid } from 'uuid';
import { CustomerFinanceStore } from '../../../core/state/customer-finance.store';
import {
  ALWAYS_CHOOSE_MONEY_POINT,
  CurrentPointStore,
} from '../../../core/state/current-point.store';
import type { PaymentMethod, TransactionSource } from '../../../core/models/transaction.model';
import { MoneyPointErrorHandler } from '../money-point-field/money-point-error.handler';
import { MoneyPointFieldComponent } from '../money-point-field/money-point-field.component';
import { Labels } from '../../constant/labels';
import { CancelButtonComponent } from '../cancel-button/cancel-button.component';
import { PaymentMethodSelectComponent } from '../payment-method/payment-method.component';
import { maxDecimalPlacesValidator } from '../../validators/number-validators';
import { MaxDecimalsDirective } from '../../directives/max-decimals.directive';

interface TopUpDialogData {
  customerId: string;
  initialAmount?: number;
  source?: TransactionSource;
  sourceId?: string;
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
    MoneyPointFieldComponent,
    PaymentMethodSelectComponent,
    CancelButtonComponent,
    MaxDecimalsDirective,
  ],
  template: `
    <h2 mat-dialog-title>{{ Labels.TopUpDialogTitle }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-3 pt-2">
        <mat-form-field appearance="outline">
          <mat-label>{{ Labels.TopUpAmountLabel }}</mat-label>
          <input
            matInput
            type="number"
            min="0.01"
            step="0.01"
            formControlName="amount"
            [appMaxDecimals]="2"
          />
        </mat-form-field>

        <app-payment-method-select formControlName="paymentMethod"></app-payment-method-select>

        @if (choosePoint()) {
          <app-money-point-field [control]="form.controls.pointSlug" />
        }
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
  private readonly financeStore = inject(CustomerFinanceStore);
  private readonly errorHandler = inject(MoneyPointErrorHandler);
  private readonly destroyRef = inject(DestroyRef);
  private readonly workingPoint = inject(CurrentPointStore).currentSlug();

  protected readonly submitting = signal(false);
  protected readonly choosePoint = signal(
    inject(ALWAYS_CHOOSE_MONEY_POINT) || this.workingPoint === null,
  );

  public readonly form = new FormGroup({
    amount: new FormControl<number | null>(this.data.initialAmount ?? null, [
      Validators.required,
      Validators.min(0.01),
      maxDecimalPlacesValidator(2),
    ]),
    paymentMethod: new FormControl<PaymentMethod>('CASH', [Validators.required]),
    pointSlug: new FormControl<string | null>(this.workingPoint, [Validators.required]),
  });

  private readonly idempotencyKey = uuid();

  public confirm(): void {
    if (this.form.invalid || this.submitting()) return;
    const { amount, paymentMethod, pointSlug } = this.form.getRawValue();
    this.submitting.set(true);

    this.financeStore
      .recordDeposit(
        {
          idempotencyKey: this.idempotencyKey,
          customerId: this.data.customerId,
          amount: amount!,
          paymentMethod: paymentMethod as PaymentMethod,
          source: this.data.source,
          sourceId: this.data.sourceId,
        },
        pointSlug!,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.dialogRef.close(true);
        },
        error: (err: unknown) => {
          this.submitting.set(false);
          if (this.errorHandler.handle(err, this.form.controls.pointSlug)) {
            this.choosePoint.set(true);
          }
        },
      });
  }
}
