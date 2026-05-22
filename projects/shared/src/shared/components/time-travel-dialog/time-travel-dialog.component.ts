import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TimeTravelStore } from '../../../core/state/time-travel.store';
import { CancelButtonComponent } from '../cancel-button/cancel-button.component';
import { Labels } from '../../constant/labels';
import { toDateTimeLocalString, parseDateTimeLocal } from '../../utils/date.util';

@Component({
  selector: 'app-time-travel-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    CancelButtonComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ Labels.TimeTravelDialogTitle }}</h2>

    <mat-dialog-content>
      <mat-form-field appearance="outline" class="w-full !mt-2">
        <mat-label>{{ Labels.TimeTravelDialogTitle }}</mat-label>
        <input matInput type="datetime-local" [formControl]="datetimeControl" />
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <app-form-cancel-button />
      <button mat-button (click)="onReset()">{{ Labels.TimeTravelReset }}</button>
      <button mat-flat-button [disabled]="datetimeControl.invalid" (click)="onSave()">
        {{ Labels.Save }}
      </button>
    </mat-dialog-actions>
  `,
})
export class TimeTravelDialogComponent {
  protected readonly Labels = Labels;

  private readonly store = inject(TimeTravelStore);
  private readonly dialogRef = inject<MatDialogRef<TimeTravelDialogComponent>>(MatDialogRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly datetimeControl = new FormControl<string>(
    toDateTimeLocalString(this.store.serverTime()?.instant ?? new Date()),
    [Validators.required],
  );

  protected onSave(): void {
    if (this.datetimeControl.invalid) return;
    this.store
      .setTime(parseDateTimeLocal(this.datetimeControl.value!))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.dialogRef.close(true));
  }

  protected onReset(): void {
    this.store
      .resetTime()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.dialogRef.close(true));
  }
}
