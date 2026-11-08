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
  BusinessCurrencyStore,
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
import type {
  ShiftClosureDialogData,
  ShiftClosureDialogResult,
} from './shift-closure-dialog.model';

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
        <button mat-flat-button color="primary" type="button" (click)="done()">
          {{ labels.Done }}
        </button>
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
          color="primary"
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
  private readonly currency = inject(BusinessCurrencyStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly form = viewChild(ShiftCountFormComponent);

  protected readonly resultTitle = computed(() => {
    const closure = this.store.closure();
    return closure ? shiftClosedTitle(closure.sequence) : '';
  });
  protected readonly resultRows = computed(() => {
    const closure = this.store.closure();
    return closure ? buildShiftClosureRows(closure, this.locale, this.currency.symbol()) : [];
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
        data: buildShiftClosureConfirm(
          { shift, counted, difference },
          this.locale,
          this.currency.symbol(),
          () => this.store.execute(),
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
