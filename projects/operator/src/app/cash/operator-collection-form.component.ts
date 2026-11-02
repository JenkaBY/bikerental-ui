import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  type ApiError,
  applyServerErrors,
  FixedMoneyPipe,
  FormErrorMessages,
  Labels,
  MaxDecimalsDirective,
  moneyAmountValidators,
  type Money,
  SERVER_ERROR_KEY,
} from '@bikerental/shared';

@Component({
  selector: 'app-operator-collection-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FixedMoneyPipe,
    MaxDecimalsDirective,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
      <dl class="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
        <dt class="text-slate-500">{{ labels.PointCashCardTitle }}</dt>
        <dd class="m-0 text-right font-medium tabular-nums">{{ available() | fixedMoney }}</dd>
        <dt class="text-slate-500">{{ labels.PointMoveDestinationLabel }}</dt>
        <dd class="m-0 text-right font-medium">{{ labels.PointMoveBankAccount }}</dd>
      </dl>
      <div class="flex items-start gap-2">
        <mat-form-field appearance="outline" class="flex-1">
          <mat-label>{{ labels.PointMoveAmount }}</mat-label>
          <input
            matInput
            class="!text-2xl"
            type="number"
            inputmode="decimal"
            step="0.01"
            formControlName="amount"
            [appMaxDecimals]="2"
          />
          <mat-error>{{ amountError() }}</mat-error>
        </mat-form-field>
        <button mat-stroked-button type="button" class="!h-14 mt-1" (click)="fillAll()">
          {{ labels.PointMoveAll }}
        </button>
      </div>
      <p class="m-0 text-sm text-slate-500">{{ remainingText() }}</p>
      <button
        mat-flat-button
        type="submit"
        class="!h-12 w-full"
        [disabled]="form.invalid || busy()"
      >
        {{ submitLabel() }}
      </button>
    </form>
  `,
})
export class OperatorCollectionFormComponent {
  protected readonly labels = Labels;
  private readonly cdr = inject(ChangeDetectorRef);

  readonly available = input.required<Money>();
  readonly remainingText = input.required<string>();
  readonly submitLabel = input.required<string>();
  readonly serverError = input<string | null>(null);
  readonly busy = input(false);

  readonly amountChange = output<number | null>();
  readonly submitted = output<number>();

  protected readonly amount = new FormControl<number | null>(null);
  protected readonly form = new FormGroup({ amount: this.amount });

  constructor() {
    this.amount.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.amountChange.emit(value));
    effect(() => {
      this.amount.setValidators(moneyAmountValidators(this.available().amount));
      this.amount.updateValueAndValidity({ emitEvent: false });
      this.cdr.markForCheck();
    });
    effect(() => {
      const message = this.serverError();
      if (message === null) return;
      this.amount.setErrors({ ...this.amount.errors, [SERVER_ERROR_KEY]: message });
      this.amount.markAsTouched();
      this.cdr.markForCheck();
    });
  }

  showServerErrors(error: ApiError): string[] {
    const unmatched = applyServerErrors(this.form, error);
    this.cdr.markForCheck();
    return unmatched;
  }

  protected amountError(): string | null {
    const errors = this.amount.errors;
    if (!errors) return null;
    const server: unknown = errors[SERVER_ERROR_KEY];
    if (typeof server === 'string') return server;
    if (errors['required']) return FormErrorMessages.amountRequired;
    if (errors['min']) return FormErrorMessages.amountPositive;
    if (errors['maxAmount']) return FormErrorMessages.amountExceedsAvailable;
    if (errors['maxDecimalPlaces']) return FormErrorMessages.amountMaxTwoDecimals;
    return null;
  }

  protected fillAll(): void {
    this.amount.setValue(this.available().amount);
    this.amount.markAsTouched();
  }

  protected onSubmit(): void {
    const amount = this.amount.value;
    if (this.form.invalid || amount === null || this.busy()) return;
    this.submitted.emit(amount);
  }
}
