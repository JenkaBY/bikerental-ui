# Task 019: SETTLEMENT mode of PointMoneyMoveDialogComponent

> **Applied Skill:** `angular-component` - the date field is a small dumb component so the dialog stays near its size budget. `angular-forms` - `Validators.required` + `notFutureDateValidator(today)`, Material datepicker with `provideNativeDateAdapter()` (same as `point-period-filter.component.ts`). `angular-signals`, CLAUDE.md "UI state in stores". i18n Rules - only existing `Labels.*` / `FormErrorMessages.*` (no new text in this task). AGENTS.md "API Error Handling" - server errors bound with `applyServerErrors` (already in the dialog).

## 1. Objective

Make the dialog work for `operation: 'SETTLEMENT'` (source Terminal account, available = CARD_TERMINAL; `POINT_MOVE_TITLES`, `POINT_MOVE_SOURCE_LABELS`, `POINT_MOVE_CONFIRM_TITLES`, `POINT_MOVE_POSITIONS` already carry the SETTLEMENT entries; `INSUFFICIENT_TERMINAL` / `POINT_PERMANENTLY_CLOSED` are already handled by `handleError`):

* a required statement-date picker, `max` = today from `TimeStore.getCurrentDate()`, no minimum, validated with `notFutureDateValidator` (`FormErrorMessages.settlementDateRequired` / `settlementDateFuture` already exist);
* the form control is named `statementDate` so `applyServerErrors(form, error)` binds the backend field error `statementDate` to it;
* the confirmation shows the date as `dd.MM.yyyy` (`formatDate(date, 'dd.MM.yyyy', locale)`) through the existing `summary.settlementDate` string (`buildMoveConfirmData` already adds the `PointMoveSettlementDate` row when it is non-null);
* `PointMoneyMoveStore.execute(amount, statementDate)` calls `recordSettlement` for the settlement operation.

Requires tasks 012, 018.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/point-settlement-date-field.component.ts` - **Action:** Create New File
* **File Path:** `projects/admin/src/app/points/point-money-move.store.ts` - **Action:** Modify Existing File
* **File Path:** `projects/admin/src/app/points/point-money-move-dialog.component.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**File 1 - `point-settlement-date-field.component.ts` (whole content):**

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormErrorMessages, Labels, SERVER_ERROR_KEY } from '@bikerental/shared';

@Component({
  selector: 'app-point-settlement-date-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatDatepickerModule],
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>{{ labels.PointMoveSettlementDate }}</mat-label>
      <input matInput [matDatepicker]="picker" [max]="max()" [formControl]="control()" />
      <mat-datepicker-toggle matIconSuffix [for]="picker" />
      <mat-datepicker #picker />
      @if (control().hasError(serverKey)) {
        <mat-error>{{ control().getError(serverKey) }}</mat-error>
      } @else if (control().hasError('required')) {
        <mat-error>{{ messages.settlementDateRequired }}</mat-error>
      } @else if (control().hasError('futureDate') || control().hasError('matDatepickerMax')) {
        <mat-error>{{ messages.settlementDateFuture }}</mat-error>
      }
    </mat-form-field>
  `,
})
export class PointSettlementDateFieldComponent {
  readonly control = input.required<FormControl<Date | null>>();
  readonly max = input.required<Date>();

  protected readonly labels = Labels;
  protected readonly messages = FormErrorMessages;
  protected readonly serverKey = SERVER_ERROR_KEY;
}
```

**File 2 - `point-money-move.store.ts`.**

* Imports: change `import { IdempotentAttempt, makeMoney, type Money, PointFinanceMapper, PointFinanceService } from '@bikerental/shared';` list to also include `type PointMoneyOperation,` (add it after `type Money,`).
* Add the field below `private pointSlug = '';`:

```typescript
  private operation: PointMoneyOperation = 'COLLECTION';
```

* Replace `init` with:

```typescript
  init(operation: PointMoneyOperation, pointSlug: string, available: Money): void {
    this.operation = operation;
    this.pointSlug = pointSlug;
    this._available.set(available);
  }
```

* Replace `execute` (the whole method, through its closing brace) with:

```typescript
  execute(amount: number, statementDate: Date | null): Observable<PointMoneyMoveOutcome> {
    const idempotencyKey = this.attempt.keyFor({
      amount,
      statementDate: statementDate?.getTime() ?? null,
    });
    return this.send(idempotencyKey, amount, statementDate).pipe(
      tap(() => this.attempt.settle('definitive')),
      catchError((err: unknown) => {
        this.attempt.settle(IdempotentAttempt.outcomeOf(err));
        return throwError(() => err);
      }),
    );
  }

  private send(
    idempotencyKey: string,
    amount: number,
    statementDate: Date | null,
  ): Observable<PointMoneyMoveOutcome> {
    if (this.operation === 'SETTLEMENT' && statementDate) {
      return this.finance
        .recordSettlement({ idempotencyKey, amount, statementDate }, this.pointSlug)
        .pipe(map((s) => ({ amount: s.amount, newPosition: s.cardTerminalPosition })));
    }
    return this.finance
      .recordCollection({ idempotencyKey, amount }, this.pointSlug)
      .pipe(map((c) => ({ amount: c.amount, newPosition: c.cashPosition })));
  }
```

**File 3 - `point-money-move-dialog.component.ts`.**

* Imports: add `import { formatDate } from '@angular/common';` as the first import line; change `import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';` to `import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';`; add `notFutureDateValidator,` and `TimeStore,` to the `@bikerental/shared` import list; add `import { PointSettlementDateFieldComponent } from './point-settlement-date-field.component';` after the `./point-money-move.store` import; add `PointSettlementDateFieldComponent,` to the `imports: [...]` array after `MaxDecimalsDirective,`.
* Template: directly after `<p class="m-0 text-sm text-slate-500">{{ remainingText() }}</p>` and before `</mat-dialog-content>` add:

```html
        @if (isSettlement) {
          <app-point-settlement-date-field [control]="statementDate" [max]="today" />
        }
```

* Members: directly after `protected readonly source = POINT_MOVE_SOURCE_LABELS[this.data.operation];` add:

```typescript
  protected readonly isSettlement = this.data.operation === 'SETTLEMENT';
  protected readonly today = inject(TimeStore).getCurrentDate();
  protected readonly statementDate = new FormControl<Date | null>(
    null,
    this.isSettlement ? [Validators.required, notFutureDateValidator(this.today)] : [],
  );
```

* Replace `protected readonly form = new FormGroup({ amount: this.amount });` with:

```typescript
  protected readonly form = new FormGroup({
    amount: this.amount,
    statementDate: this.statementDate,
  });
```

* Constructor: replace `this.store.init(this.data.pointSlug, this.data.available);` with `this.store.init(this.data.operation, this.data.pointSlug, this.data.available);`.
* `submit()`: replace the first two lines

```typescript
    const amount = this.amount.value;
    if (this.form.invalid || amount === null) return;
```

with

```typescript
    const amount = this.amount.value;
    const date = this.statementDate.value;
    if (this.form.invalid || amount === null || (this.isSettlement && date === null)) return;
```

  replace `settlementDate: null,` (inside `summary`) with

```typescript
      settlementDate: this.isSettlement && date ? formatDate(date, 'dd.MM.yyyy', this.locale) : null,
```

  and replace `() => this.store.execute(amount)` with `() => this.store.execute(amount, date)`.

The dialog already exceeds ~200 lines TS (240 before this task). Do not refactor; report the final line count.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/admin/src/app/points/point-settlement-date-field.component.ts projects/admin/src/app/points/point-money-move.store.ts projects/admin/src/app/points/point-money-move-dialog.component.ts
npx ng build admin --configuration development
npx ng lint admin
```
