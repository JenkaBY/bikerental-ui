import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Labels } from '../../constant/labels';

@Component({
  selector: 'app-top-up-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule],
  template: `
    <button
      mat-flat-button
      class="bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      style="background-color: #9febb6c9; color: #065f46"
      [disabled]="disabled()"
      (click)="onClick()"
    >
      {{ label() }}
    </button>
  `,
})
export class TopUpButtonComponent {
  protected readonly Labels = Labels;

  /** Disabled state input (signal) */
  readonly disabled = input<boolean>(false);

  /** Optional label; defaults to CustomerTopUpButton */
  readonly label = input<string>(Labels.CustomerTopUpButton);

  /** Confirm output (used as click handler) */
  readonly confirm = output<void>();

  onClick(): void {
    if (!this.disabled()) this.confirm.emit();
  }
}
