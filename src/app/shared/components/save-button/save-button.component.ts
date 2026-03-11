import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Labels } from '../../constant/labels';

@Component({
  selector: 'app-form-save-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule],
  template: `
    <button
      mat-raised-button
      color="primary"
      (click)="onClick()"
      [disabled]="disabled() || saving()"
    >
      @if (saving()) {
        <span>{{ msg.saving }}</span>
      } @else {
        <span>{{ msg.save }}</span>
      }
    </button>
  `,
})
export class SaveButtonComponent {
  readonly saving = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly save = output<void>();

  readonly msg = Labels;

  onClick(): void {
    this.save.emit();
  }
}
