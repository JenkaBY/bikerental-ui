import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';
import type { ApiError } from '../../../core/errors/api-error.model';
import { ApiErrorParser } from '../../../core/errors/api-error.parser';

export interface FinanceConfirmRow {
  readonly label: string;
  readonly value: string;
}

export interface FinanceConfirmData<T = unknown> {
  readonly title: string;
  readonly rows: readonly FinanceConfirmRow[];
  readonly note: string;
  readonly backLabel: string;
  readonly confirmLabel: string;
  readonly execute: () => Observable<T>;
}

export type FinanceConfirmResult<T = unknown> =
  | { readonly ok: true; readonly result: T }
  | { readonly ok: false; readonly error: ApiError };

@Component({
  selector: 'app-finance-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <dl class="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
        @for (row of data.rows; track row.label) {
          <dt class="text-slate-500">{{ row.label }}</dt>
          <dd class="m-0 text-right font-medium tabular-nums">{{ row.value }}</dd>
        }
      </dl>
      <p class="mt-4 mb-0 text-sm text-slate-500">{{ data.note }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [disabled]="running()" (click)="back()">
        {{ data.backLabel }}
      </button>
      <button mat-flat-button type="button" [disabled]="running()" (click)="confirm()">
        @if (running()) {
          <mat-progress-spinner class="inline-block mr-2" mode="indeterminate" [diameter]="18" />
        }
        {{ data.confirmLabel }}
      </button>
    </mat-dialog-actions>
  `,
})
export class FinanceConfirmDialogComponent {
  protected readonly data = inject<FinanceConfirmData>(MAT_DIALOG_DATA);
  protected readonly running = signal(false);

  private readonly dialogRef =
    inject<MatDialogRef<FinanceConfirmDialogComponent, FinanceConfirmResult>>(MatDialogRef);
  private readonly destroyRef = inject(DestroyRef);

  protected back(): void {
    if (this.running()) return;
    this.dialogRef.close();
  }

  protected confirm(): void {
    if (this.running()) return;
    this.running.set(true);
    this.dialogRef.disableClose = true;
    this.data
      .execute()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => this.dialogRef.close({ ok: true, result }),
        error: (err: unknown) =>
          this.dialogRef.close({ ok: false, error: ApiErrorParser.parse(err) }),
      });
  }
}
