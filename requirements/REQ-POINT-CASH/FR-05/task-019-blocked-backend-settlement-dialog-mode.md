# Task 019: [BLOCKED - needs task 018] SETTLEMENT mode of PointMoneyMoveDialogComponent

> **Applied Skill:** `angular-component` - the date field is a small dumb component so the dialog stays near its size budget. `angular-forms` - `Validators.required` + `notFutureDateValidator(today)`, Material datepicker with `provideNativeDateAdapter()` (same as `point-period-filter.component.ts`). `angular-signals`, CLAUDE.md "UI state in stores". i18n Rules - only `Labels.*` / `FormErrorMessages.*`.

## 1. Objective

Make the dialog work for `operation: 'SETTLEMENT'` (source Terminal account, available = CARD_TERMINAL):

* a required settlement-date picker, `max` = today from `TimeStore`, no minimum, validated with `notFutureDateValidator` (`settlementDateRequired` / `settlementDateFuture` messages, from task 007);
* the confirmation shows the date as `dd.MM.yyyy` (`formatDate(date, 'dd.MM.yyyy', locale)`);
* `PointMoneyMoveStore.execute(amount, settlementDate)` calls `recordSettlement` for the settlement operation. `INSUFFICIENT_TERMINAL` is already handled by the dialog (task 012).

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
import { FormErrorMessages, Labels } from '@bikerental/shared';

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
      @if (control().hasError('required')) {
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
}
```

**File 2 - store.** Add `TerminalSettlement` is not needed. Change the `init` signature and `execute`:

* Add field `private operation: PointMoneyOperation = 'COLLECTION';` below `private pointSlug = '';` and import `type PointMoneyOperation` from `@bikerental/shared`.
* Replace `init`:

```typescript
  init(operation: PointMoneyOperation, pointSlug: string, available: Money): void {
    this.operation = operation;
    this.pointSlug = pointSlug;
    this._available.set(available);
  }
```

* Replace `execute` with:

```typescript
  execute(amount: number, settlementDate: Date | null): Observable<PointMoneyMoveOutcome> {
    const idempotencyKey = this.attempt.keyFor({ amount, settlementDate: settlementDate?.getTime() ?? null });
    return this.send(idempotencyKey, amount, settlementDate).pipe(
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
    settlementDate: Date | null,
  ): Observable<PointMoneyMoveOutcome> {
    if (this.operation === 'SETTLEMENT' && settlementDate) {
      return this.finance
        .recordSettlement({ idempotencyKey, amount, settlementDate }, this.pointSlug)
        .pipe(map((s) => ({ amount: s.amount, newPosition: s.cardTerminalPosition })));
    }
    return this.finance
      .recordCollection({ idempotencyKey, amount }, this.pointSlug)
      .pipe(map((c) => ({ amount: c.amount, newPosition: c.cashPosition })));
  }
```

**File 3 - dialog.**

* Imports: add `formatDate` from `@angular/common`; `TimeStore`, `notFutureDateValidator` to the `@bikerental/shared` list; `Validators` to the `@angular/forms` import; `import { PointSettlementDateFieldComponent } from './point-settlement-date-field.component';`; add `PointSettlementDateFieldComponent` to `imports: []`.
* Template: directly after the closing `</div>` of the amount row (before `</mat-dialog-content>`) add:

```html
        @if (isSettlement) {
          <app-point-settlement-date-field [control]="settlementDate" [max]="today" />
        }
```

* Members: directly after `protected readonly source = ...` add:

```typescript
  protected readonly isSettlement = this.data.operation === 'SETTLEMENT';
  protected readonly today = inject(TimeStore).getCurrentDate();
  protected readonly settlementDate = new FormControl<Date | null>(
    null,
    this.isSettlement ? [Validators.required, notFutureDateValidator(this.today)] : [],
  );
```

* Replace `protected readonly form = new FormGroup({ amount: this.amount });` with:

```typescript
  protected readonly form = new FormGroup({
    amount: this.amount,
    settlementDate: this.settlementDate,
  });
```

* In the constructor change `this.store.init(this.data.pointSlug, this.data.available);` to `this.store.init(this.data.operation, this.data.pointSlug, this.data.available);`.
* In `submit()` replace `settlementDate: null,` in `summary` with:

```typescript
      settlementDate: this.isSettlement && date ? formatDate(date, 'dd.MM.yyyy', this.locale) : null,
```

and directly after `const amount = this.amount.value;` add `const date = this.settlementDate.value;`, and change `if (this.form.invalid || amount === null) return;` to `if (this.form.invalid || amount === null || (this.isSettlement && !date)) return;`. Replace `() => this.store.execute(amount)` with `() => this.store.execute(amount, date)`.

The dialog will exceed ~200 lines TS. Do not refactor; report the final line count.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/admin/src/app/points/point-settlement-date-field.component.ts projects/admin/src/app/points/point-money-move.store.ts projects/admin/src/app/points/point-money-move-dialog.component.ts
npx ng build admin --configuration development
npx ng lint admin
```
