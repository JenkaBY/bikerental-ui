# Task 010: Admin `ShiftClosureDialogComponent`, its data model and launcher

> **Applied Skill:** `angular-component` (standalone, OnPush, `inject()`), `angular-di` (store in the dialog's `providers`), `angular-forms`, AGENTS.md "Admin CRUD Pattern" (`MAT_DIALOG_DATA`, close result) and "API Error Handling" (`NotificationService`, `ErrorMessageResolver`, `applyServerErrors` via the form's `showServerErrors`, no `MatSnackBar`, no raw error text). Imports only domain types from `@bikerental/shared`. Mirrors `point-money-move-dialog.component.ts`. Requires tasks 005-009.

## 1. Objective

Two states in one dialog:

1. Form: `ShiftCountFormComponent` (dialog layout) + Cancel + primary "Close shift" (disabled while `store.counted()` is null or a submit runs). Submit opens `FinanceConfirmDialogComponent` (`buildShiftClosureConfirm`, `execute = store.execute()`). Back keeps the form.
2. Result (after success, `store.closure()` set): title "Shift N closed", rows Expected cash / Counted amount / Difference / Closed at, one "Done" button closing with `{ outcome: 'done' }`. Backdrop / Escape are disabled in this state so the host always learns about the closure.

Errors: `SHIFT_NOT_RUNNING` (via `classifyClosure`) -> warn "This shift is already closed" + close with `{ outcome: 'shiftChanged' }`; `VALIDATION` -> `showServerErrors` on the counted control, unmatched messages in one error notification; anything else -> error notification, form kept. The launcher opens it at width 480 px.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/shift-closure-dialog.model.ts` - **Action:** Create New File
* **File Path:** `projects/admin/src/app/points/shift-closure-dialog.component.ts` - **Action:** Create New File
* **File Path:** `projects/admin/src/app/points/shift-closure.launcher.ts` - **Action:** Create New File

## 3. Code Implementation

**File 1:** `projects/admin/src/app/points/shift-closure-dialog.model.ts`, whole content:

```typescript
import type { RunningShift } from '@bikerental/shared';

export interface ShiftClosureDialogData {
  readonly pointSlug: string;
  readonly pointName: string;
  readonly shift: RunningShift;
}

export interface ShiftClosureDialogResult {
  readonly outcome: 'done' | 'shiftChanged';
}
```

**File 2:** `projects/admin/src/app/points/shift-closure-dialog.component.ts`, whole content:

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  LOCALE_ID,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import {
  type ApiError,
  buildShiftClosureConfirm,
  buildShiftClosureRows,
  CancelButtonComponent,
  ErrorMessageResolver,
  type FinanceConfirmData,
  FinanceConfirmDialogComponent,
  type FinanceConfirmResult,
  Labels,
  NotificationService,
  PointMoneyErrorClassifier,
  type ShiftClosure,
  ShiftClosureStore,
  shiftClosedTitle,
  ShiftCountFormComponent,
} from '@bikerental/shared';
import type { ShiftClosureDialogData, ShiftClosureDialogResult } from './shift-closure-dialog.model';

@Component({
  selector: 'app-shift-closure-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ShiftClosureStore],
  imports: [MatDialogModule, MatButtonModule, CancelButtonComponent, ShiftCountFormComponent],
  template: `
    @if (store.closure()) {
      <h2 mat-dialog-title>{{ resultTitle() }}</h2>
      <mat-dialog-content>
        <dl class="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
          @for (row of resultRows(); track row.label) {
            <dt class="text-slate-500">{{ row.label }}</dt>
            <dd class="m-0 text-right font-medium tabular-nums">{{ row.value }}</dd>
          }
        </dl>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-flat-button type="button" (click)="done()">{{ labels.Done }}</button>
      </mat-dialog-actions>
    } @else {
      <h2 mat-dialog-title>{{ labels.PointCloseShift }}</h2>
      <mat-dialog-content>
        <app-shift-count-form
          layout="dialog"
          [shift]="data.shift"
          [pointName]="data.pointName"
          [differenceText]="store.differenceText()"
          (countedChange)="store.setCounted($event)"
          (submitted)="submit()"
        />
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <app-form-cancel-button />
        <button
          mat-flat-button
          type="button"
          [disabled]="store.counted() === null || store.submitting()"
          (click)="submit()"
        >
          {{ labels.PointCloseShift }}
        </button>
      </mat-dialog-actions>
    }
  `,
})
export class ShiftClosureDialogComponent {
  protected readonly labels = Labels;
  protected readonly data = inject<ShiftClosureDialogData>(MAT_DIALOG_DATA);
  protected readonly store = inject(ShiftClosureStore);

  private readonly dialogRef =
    inject<MatDialogRef<ShiftClosureDialogComponent, ShiftClosureDialogResult>>(MatDialogRef);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = inject(ErrorMessageResolver);
  private readonly locale = inject(LOCALE_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly form = viewChild(ShiftCountFormComponent);

  protected readonly resultTitle = computed(() => {
    const closure = this.store.closure();
    return closure ? shiftClosedTitle(closure.sequence) : '';
  });
  protected readonly resultRows = computed(() => {
    const closure = this.store.closure();
    return closure ? buildShiftClosureRows(closure, this.locale) : [];
  });

  constructor() {
    this.store.init(this.data.shift, this.data.pointSlug);
  }

  protected submit(): void {
    const shift = this.store.shift();
    const counted = this.store.counted();
    const difference = this.store.difference();
    if (!shift || !counted || !difference || this.store.submitting()) return;
    this.dialog
      .open<
        FinanceConfirmDialogComponent,
        FinanceConfirmData<ShiftClosure>,
        FinanceConfirmResult<ShiftClosure>
      >(FinanceConfirmDialogComponent, {
        data: buildShiftClosureConfirm({ shift, counted, difference }, this.locale, () =>
          this.store.execute(),
        ),
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => this.onConfirmed(result));
  }

  protected done(): void {
    this.dialogRef.close({ outcome: 'done' });
  }

  private onConfirmed(result: FinanceConfirmResult<ShiftClosure> | undefined): void {
    if (!result) return;
    if (result.ok) {
      this.dialogRef.disableClose = true;
      this.store.complete(result.result);
      return;
    }
    this.handleError(result.error);
  }

  private handleError(error: ApiError): void {
    const outcome = PointMoneyErrorClassifier.classifyClosure(error);
    switch (outcome.kind) {
      case 'SHIFT_NOT_RUNNING':
        this.notifications.warn(Labels.ShiftClosureAlreadyClosed);
        this.dialogRef.close({ outcome: 'shiftChanged' });
        break;
      case 'VALIDATION': {
        const unmatched = this.form()?.showServerErrors(error) ?? [];
        if (unmatched.length > 0) this.notifications.error(unmatched.join(' '));
        break;
      }
      default:
        this.notifications.error(this.resolver.resolve(error));
    }
  }
}
```

**File 3:** `projects/admin/src/app/points/shift-closure.launcher.ts`, whole content:

```typescript
import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ShiftClosureDialogComponent } from './shift-closure-dialog.component';
import type { ShiftClosureDialogData, ShiftClosureDialogResult } from './shift-closure-dialog.model';

const DIALOG_WIDTH = '480px';

@Injectable({ providedIn: 'root' })
export class ShiftClosureLauncher {
  private readonly dialog = inject(MatDialog);

  open(data: ShiftClosureDialogData): Observable<ShiftClosureDialogResult | undefined> {
    return this.dialog
      .open<ShiftClosureDialogComponent, ShiftClosureDialogData, ShiftClosureDialogResult>(
        ShiftClosureDialogComponent,
        { data, width: DIALOG_WIDTH },
      )
      .afterClosed();
  }
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/admin/src/app/points/shift-closure-dialog.model.ts projects/admin/src/app/points/shift-closure-dialog.component.ts projects/admin/src/app/points/shift-closure.launcher.ts
npx ng build admin --configuration development
npx ng lint admin
```
