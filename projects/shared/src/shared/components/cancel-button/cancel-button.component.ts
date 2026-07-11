import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { Labels } from '../../constant/labels';

@Component({
  selector: 'app-form-cancel-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule],
  template: `
    <button type="button" mat-button class="btn-caution" (click)="onClick()">
      {{ msg.Cancel }}
    </button>
  `,
})
export class CancelButtonComponent {
  private readonly dialogRef = inject(MatDialogRef, { optional: true });

  readonly msg = Labels;
  readonly cancelled = output<void>();

  protected onClick(): void {
    this.cancelled.emit();
    this.dialogRef?.close();
  }
}
