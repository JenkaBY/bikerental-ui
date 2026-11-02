# Task 006: `OperatorCollectionFormComponent` (dumb form)

> **Applied Skill:** `angular-forms` - typed `FormControl<number | null>`, `moneyAmountValidators(max)` rebound when `available` changes, server error via `SERVER_ERROR_KEY`. `angular-component` - standalone, OnPush, `input()` / `output()`, no store (all state arrives through inputs). `angular-signals` - two `effect()`s (order matters). AGENTS.md API Error Handling - `applyServerErrors(form, apiError)` for backend validation, rendered through `mat-error`. AGENTS.md i18n - labels only. Split out of the page component to keep both under ~200 lines.

## 1. Objective

Presentational form: rows "Cash drawer {available}" and "To / Bank account"; large amount input (`type=number`, `inputmode=decimal`, `step=0.01`, `[appMaxDecimals]="2"`); "All" button; a `<p>` with the remaining text (**NOT** a `mat-hint`, a hint is hidden while the control is invalid); primary button with the live caption, disabled while the form is invalid or `busy`.

Inputs: `available: Money`, `remainingText: string`, `submitLabel: string`, `serverError: string | null`, `busy: boolean`. Outputs: `amountChange(number | null)`, `submitted(number)`. Public method `showServerErrors(error)` for the parent's validation-refusal branch.

Effect order is load-bearing: the validator rebind (`available`) MUST be declared before the server-error effect, because the rebind recomputes errors and would wipe the `server` error otherwise. The rebind uses `emitEvent: false` so it does not fire `amountChange` (which would clear the store's server error).

Requires task 002.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/cash/operator-collection-form.component.ts` - **Action:** Create New File

## 3. Code Implementation

* **Location:** new file, whole content:

```typescript
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, input, output } from '@angular/core';
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
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/operator/src/app/cash/operator-collection-form.component.ts
npx ng build operator --configuration development
npx ng lint operator
```
