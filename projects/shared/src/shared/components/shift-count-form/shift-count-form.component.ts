import { formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import type { ApiError } from '../../../core/errors/api-error.model';
import { applyServerErrors, SERVER_ERROR_KEY } from '../../../core/errors/server-errors.util';
import type { RunningShift } from '../../../core/models';
import { Labels } from '../../constant/labels';
import { pointShiftCaption } from '../../constant/point-money-messages';
import { MaxDecimalsDirective } from '../../directives/max-decimals.directive';
import { FixedMoneyPipe } from '../../pipes/fixed-money.pipe';
import { countedAmountValidators } from '../../validators/amount-validators';
import { FormErrorMessages } from '../../validators/form-error-messages';

const OPENED_TIME_FORMAT = 'HH:mm';
const MOBILE_INPUT_CLASS = '!text-2xl';

export type ShiftCountFormLayout = 'dialog' | 'mobile';

@Component({
  selector: 'app-shift-count-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    FixedMoneyPipe,
    MaxDecimalsDirective,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
      <dl class="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
        <dt class="text-slate-500">{{ labels.MoneyPointLabel }}</dt>
        <dd class="m-0 text-right font-medium">{{ pointName() }}</dd>
        <dt class="text-slate-500">{{ labels.PointShiftExpectedCash }}</dt>
        <dd class="m-0 text-right font-medium tabular-nums">
          {{ shift().expectedCash | fixedMoney }}
        </dd>
      </dl>
      <p class="m-0 text-sm text-slate-500">{{ caption() }}</p>
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>{{ labels.ShiftClosureCounted }}</mat-label>
        <input
          matInput
          [class]="inputClass()"
          type="number"
          inputmode="decimal"
          step="0.01"
          formControlName="countedAmount"
          [appMaxDecimals]="2"
        />
        <mat-error>{{ countedError() }}</mat-error>
      </mat-form-field>
      @if (differenceText(); as text) {
        <p class="m-0 text-sm font-medium" role="status">{{ text }}</p>
      }
    </form>
  `,
})
export class ShiftCountFormComponent {
  protected readonly labels = Labels;
  private readonly locale = inject(LOCALE_ID);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly shift = input.required<RunningShift>();
  readonly pointName = input.required<string>();
  readonly layout = input<ShiftCountFormLayout>('dialog');
  readonly differenceText = input<string | null>(null);

  readonly countedChange = output<number | null>();
  readonly submitted = output<void>();

  protected readonly counted = new FormControl<number | null>(null, countedAmountValidators());
  protected readonly form = new FormGroup({ countedAmount: this.counted });

  protected readonly caption = computed(() =>
    pointShiftCaption(
      this.shift().sequence,
      formatDate(this.shift().openedAt, OPENED_TIME_FORMAT, this.locale),
    ),
  );
  protected readonly inputClass = computed(() =>
    this.layout() === 'mobile' ? MOBILE_INPUT_CLASS : '',
  );

  constructor() {
    this.counted.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.countedChange.emit(value));
  }

  showServerErrors(error: ApiError): string[] {
    const unmatched = applyServerErrors(this.form, error);
    this.cdr.markForCheck();
    return unmatched;
  }

  protected countedError(): string | null {
    const errors = this.counted.errors;
    if (!errors) return null;
    const server: unknown = errors[SERVER_ERROR_KEY];
    if (typeof server === 'string') return server;
    if (errors['required']) return FormErrorMessages.countedRequired;
    if (errors['min']) return FormErrorMessages.countedNotNegative;
    if (errors['maxDecimalPlaces']) return FormErrorMessages.amountMaxTwoDecimals;
    return null;
  }

  protected onSubmit(): void {
    if (this.form.invalid) return;
    this.submitted.emit();
  }
}
