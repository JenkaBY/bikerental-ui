# Task 012: PointMoneyMoveDialogComponent (admin, collection mode)

> **Applied Skill:** `angular-component` - standalone, `OnPush`, `inject()`, state in `PointMoneyMoveStore`. `angular-forms` - one typed `FormControl<number | null>`, validators re-bound with `setValidators` + `updateValueAndValidity`, server error set with the shared `SERVER_ERROR_KEY`. `error-handling` - classify with `PointMoneyErrorClassifier`, copy from `ErrorMessageResolver` / `NotificationService`, validation bound with `applyServerErrors`, never a raw error message. AGENTS.md Admin CRUD Pattern (dialog closes with a result) and i18n Rules (only `Labels.*` / `FormErrorMessages.*`).

## 1. Objective

The form dialog opened by the Cash tab. Data `PointMoneyMoveData`. Shows (read-only) point name, source, destination "Bank account", available amount; the amount field with "All" and a live "Remaining: X" hint; Cancel and Continue. Continue opens `FinanceConfirmDialogComponent`; Back there returns to the form with the value kept.

After the confirmation closes:

| Confirmation result | Behaviour |
|---|---|
| `undefined` (Back) | nothing, form stays |
| `{ ok: true, result }` | close with `{ outcome: 'done', operation, amount, newPosition }` |
| `INSUFFICIENT_CASH` / `INSUFFICIENT_TERMINAL` | available := reported position, validators re-bound to the new ceiling, position patched into `PointPositionsStore` (when the opener provided the injector, task 013), server error under the amount; the next confirm gets a new key because the 4xx was definitive |
| `POINT_NOT_ACTIVE` | error toast `Labels.PointCollectionNotActiveHint`, close `{ outcome: 'statusChanged' }` |
| `POINT_PERMANENTLY_CLOSED` | error toast with the resolved copy, close `{ outcome: 'statusChanged' }` |
| `VALIDATION` | `applyServerErrors(form, error)`; unmatched messages joined into one error toast |
| `SCOPE`, `OTHER` | error toast with the resolved copy, form stays with values kept |

The SETTLEMENT mode (date field, settlement execute) is added by blocked task 019; this task renders any operation's title / source from the meta maps but only wires the collection command.

Requires tasks 006, 007, 008, 009, 010, 011.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/point-money-move-dialog.component.ts` - **Action:** Create New File

## 3. Code Implementation

**Whole content:**

```typescript
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  inject,
  LOCALE_ID,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  type ApiError,
  applyServerErrors,
  CancelButtonComponent,
  ErrorMessageResolver,
  type FinanceConfirmData,
  FinanceConfirmDialogComponent,
  type FinanceConfirmResult,
  FixedMoneyPipe,
  formatFixedMoney,
  FormErrorMessages,
  Labels,
  makeMoney,
  MaxDecimalsDirective,
  moneyAmountValidators,
  type Money,
  NotificationService,
  PointMoneyErrorClassifier,
  pointMoveRemaining,
  PointPositionsStore,
  SERVER_ERROR_KEY,
} from '@bikerental/shared';
import { buildMoveConfirmData } from './point-money-move-confirm';
import {
  POINT_MOVE_POSITIONS,
  POINT_MOVE_SOURCE_LABELS,
  POINT_MOVE_TITLES,
} from './point-money-move.meta';
import type {
  PointMoneyMoveData,
  PointMoneyMoveOutcome,
  PointMoneyMoveResult,
} from './point-money-move.model';
import { PointMoneyMoveStore } from './point-money-move.store';

@Component({
  selector: 'app-point-money-move-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PointMoneyMoveStore],
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    CancelButtonComponent,
    FixedMoneyPipe,
    MaxDecimalsDirective,
  ],
  template: `
    <h2 mat-dialog-title>{{ title }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="flex flex-col gap-3">
        <dl class="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
          <dt class="text-slate-500">{{ labels.MoneyPointLabel }}</dt>
          <dd class="m-0 text-right font-medium">{{ data.pointName }}</dd>
          <dt class="text-slate-500">{{ labels.PointMoveSourceLabel }}</dt>
          <dd class="m-0 text-right font-medium">{{ source }}</dd>
          <dt class="text-slate-500">{{ labels.PointMoveDestinationLabel }}</dt>
          <dd class="m-0 text-right font-medium">{{ labels.PointMoveBankAccount }}</dd>
          <dt class="text-slate-500">{{ labels.PointMoveAvailable }}</dt>
          <dd class="m-0 text-right font-medium tabular-nums">
            {{ store.available() | fixedMoney }}
          </dd>
        </dl>
        <div class="flex items-start gap-2">
          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>{{ labels.PointMoveAmount }}</mat-label>
            <input
              matInput
              type="number"
              inputmode="decimal"
              step="0.01"
              formControlName="amount"
              [appMaxDecimals]="2"
            />
            <mat-error>{{ amountError() }}</mat-error>
          </mat-form-field>
          <button mat-stroked-button type="button" class="mt-2" (click)="fillAll()">
            {{ labels.PointMoveAll }}
          </button>
        </div>
        <p class="m-0 text-sm text-slate-500">{{ remainingText() }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <app-form-cancel-button />
        <button mat-flat-button type="submit" [disabled]="form.invalid">
          {{ labels.PointMoveContinue }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
})
export class PointMoneyMoveDialogComponent {
  protected readonly labels = Labels;
  protected readonly data = inject<PointMoneyMoveData>(MAT_DIALOG_DATA);
  protected readonly store = inject(PointMoneyMoveStore);

  private readonly dialogRef =
    inject<MatDialogRef<PointMoneyMoveDialogComponent, PointMoneyMoveResult>>(MatDialogRef);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = inject(ErrorMessageResolver);
  private readonly positions = inject(PointPositionsStore, { optional: true });
  private readonly locale = inject(LOCALE_ID);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly title = POINT_MOVE_TITLES[this.data.operation];
  protected readonly source = POINT_MOVE_SOURCE_LABELS[this.data.operation];
  protected readonly amount = new FormControl<number | null>(
    null,
    moneyAmountValidators(this.data.available.amount),
  );
  protected readonly form = new FormGroup({ amount: this.amount });
  protected readonly remainingText = computed(() =>
    pointMoveRemaining(formatFixedMoney(this.store.remaining(), this.locale)),
  );

  constructor() {
    this.store.init(this.data.pointSlug, this.data.available);
    this.amount.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.store.setAmount(value));
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
    this.amount.setValue(this.store.available().amount);
    this.amount.markAsTouched();
  }

  protected submit(): void {
    const amount = this.amount.value;
    if (this.form.invalid || amount === null) return;
    const summary = {
      operation: this.data.operation,
      pointName: this.data.pointName,
      amount: makeMoney(amount, this.data.available.currency),
      remaining: this.store.remaining(),
      settlementDate: null,
    };
    this.dialog
      .open<
        FinanceConfirmDialogComponent,
        FinanceConfirmData<PointMoneyMoveOutcome>,
        FinanceConfirmResult<PointMoneyMoveOutcome>
      >(FinanceConfirmDialogComponent, {
        data: buildMoveConfirmData(summary, this.locale, () => this.store.execute(amount)),
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => this.onConfirmed(result));
  }

  private onConfirmed(result: FinanceConfirmResult<PointMoneyMoveOutcome> | undefined): void {
    if (!result) return;
    if (result.ok) {
      this.dialogRef.close({
        outcome: 'done',
        operation: this.data.operation,
        amount: result.result.amount,
        newPosition: result.result.newPosition,
      });
      return;
    }
    this.handleError(result.error);
    this.cdr.markForCheck();
  }

  private handleError(error: ApiError): void {
    const outcome = PointMoneyErrorClassifier.classify(error);
    switch (outcome.kind) {
      case 'INSUFFICIENT_CASH':
      case 'INSUFFICIENT_TERMINAL':
        this.refuseAmount(error, outcome.currentPosition);
        break;
      case 'POINT_NOT_ACTIVE':
        this.notifications.error(Labels.PointCollectionNotActiveHint);
        this.dialogRef.close({ outcome: 'statusChanged' });
        break;
      case 'POINT_PERMANENTLY_CLOSED':
        this.notifications.error(this.resolver.resolve(error));
        this.dialogRef.close({ outcome: 'statusChanged' });
        break;
      case 'VALIDATION': {
        const unmatched = applyServerErrors(this.form, error);
        if (unmatched.length > 0) this.notifications.error(unmatched.join(' '));
        break;
      }
      default:
        this.notifications.error(this.resolver.resolve(error));
    }
  }

  private refuseAmount(error: ApiError, position: Money | null): void {
    if (position) {
      this.store.applyAvailable(position);
      this.amount.setValidators(moneyAmountValidators(position.amount));
      this.amount.updateValueAndValidity();
      this.positions?.applyPosition(POINT_MOVE_POSITIONS[this.data.operation], position);
    }
    this.amount.setErrors({
      ...this.amount.errors,
      [SERVER_ERROR_KEY]: this.resolver.resolve(error),
    });
    this.amount.markAsTouched();
  }
}
```

The file is about 215 lines including the template. If `npx ng lint admin` reports a size rule, stop and report it - do not refactor. TypeScript note: in `handleError`, `outcome.currentPosition` is accessible only inside the `INSUFFICIENT_*` cases because `kind` narrows the union; do not hoist it.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/admin/src/app/points/point-money-move-dialog.component.ts
npx ng build admin --configuration development
npx ng lint admin
```
