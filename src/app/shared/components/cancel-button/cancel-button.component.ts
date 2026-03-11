import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { Labels } from '../../constant/labels';

@Component({
  selector: 'app-form-cancel-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatDialogModule],
  template: ` <button mat-button mat-dialog-close>{{ msg.Cancel }}</button> `,
})
export class CancelButtonComponent {
  readonly msg = Labels;
}
