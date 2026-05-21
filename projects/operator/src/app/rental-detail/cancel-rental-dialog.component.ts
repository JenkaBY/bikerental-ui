import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Labels } from '@bikerental/shared';

@Component({
  selector: 'app-cancel-rental-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ Labels.Confirmation }}</h2>
    <mat-dialog-content>
      <p class="text-sm text-slate-700">{{ Labels.CancelRentalConfirmation }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(false)">
        {{ Labels.KeepRental }}
      </button>
      <button mat-flat-button color="warn" (click)="dialogRef.close(true)">
        {{ Labels.YesCancel }}
      </button>
    </mat-dialog-actions>
  `,
})
export class CancelRentalDialogComponent {
  protected readonly dialogRef = inject(MatDialogRef<CancelRentalDialogComponent>);
  protected readonly Labels = Labels;
}
