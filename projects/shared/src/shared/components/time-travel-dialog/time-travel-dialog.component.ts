import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CancelButtonComponent } from '../cancel-button/cancel-button.component';
import { Labels } from '../../constant/labels';
import { toDateTimeLocalString, parseDateTimeLocal } from '../../utils/date.util';
import { TIME_TRAVEL_STORE_TOKEN } from '../../../core/state/time-travel-store.token';

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

  private readonly store = inject(TIME_TRAVEL_STORE_TOKEN, { optional: true });
  private readonly dialogRef = inject<MatDialogRef<TimeTravelDialogComponent>>(MatDialogRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly datetimeControl = new FormControl<string>(
    toDateTimeLocalString(this.store?.serverTime() ?? new Date()),
    [Validators.required],
  );

  protected onSave(): void {
    if (this.datetimeControl.invalid || !this.store) return;
    this.store
      .setTime(parseDateTimeLocal(this.datetimeControl.value!))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.dialogRef.close(true));
  }

  protected onReset(): void {
    if (!this.store) return;
    this.store
      .resetTime()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.dialogRef.close(true));
  }
}
