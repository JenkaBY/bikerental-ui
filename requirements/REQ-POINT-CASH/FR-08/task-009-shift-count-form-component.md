# Task 009: `ShiftCountFormComponent` (shared dumb form)

> **Applied Skill:** `angular-component` - standalone, `OnPush`, `inject()`, `input()` / `output()`. `angular-forms` - reactive `FormControl` with the reusable `countedAmountValidators()`; `applyServerErrors` for backend validation (control is named `countedAmount` so it matches the backend field). `typescript-es2022`. Mirrors `OperatorCollectionFormComponent` (same value-out / text-in pattern: the host store owns the derived state; this component only owns the control). Requires tasks 006, 007, 008.

## 1. Objective

A dumb form shown by the admin dialog (`layout="dialog"`) and the operator page (`layout="mobile"`): point name, expected cash (read-only), the shift caption ("Shift 42 · opened 09:00" via the existing `pointShiftCaption`), ONE numeric "Counted amount" input (required, >= 0, <= 2 decimals; decimal keypad; no "All" shortcut) and the live difference text in a plain `<p>` (NOT a `<mat-hint>`, which hides while the control is invalid). It has no submit button: the host renders its own (dialog actions / mobile primary button) and also handles Enter via the `submitted` output. The host passes `differenceText` from `ShiftClosureStore`.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/components/shift-count-form/shift-count-form.component.ts` - **Action:** Create New File
* **File Path:** `projects/shared/src/public-api.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**File 1:** `projects/shared/src/shared/components/shift-count-form/shift-count-form.component.ts`, whole content:

```typescript
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
```

**File 2:** `projects/shared/src/public-api.ts`. In the block `// Shared UI — components`, insert directly below the line `export * from './shared/components/shift-breakdown/shift-breakdown.component';`:

```typescript
export * from './shared/components/shift-count-form/shift-count-form.component';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/shared/components/shift-count-form/shift-count-form.component.ts
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
npx ng lint shared
```
