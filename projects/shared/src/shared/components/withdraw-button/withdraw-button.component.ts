import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Labels } from '../../constant/labels';

@Component({
  selector: 'app-withdraw-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule],
  template: `
    <button
      mat-stroked-button
      class="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200"
      [style.background-color]="disabled() ? '#f3f4f6' : '#fffbeb'"
      [style.color]="disabled() ? '#6b7280' : '#92400e'"
      [style.border-color]="disabled() ? '#d1d5db' : '#fcd34d'"
      [style.cursor]="disabled() ? 'not-allowed' : 'pointer'"
      [disabled]="disabled()"
      (click)="onClick()"
    >
      {{ label() }}
    </button>
  `,
})
export class WithdrawButtonComponent {
  protected readonly Labels = Labels;

  readonly disabled = input<boolean>(false);

  readonly label = input<string>(Labels.CustomerWithdrawButton);

  readonly confirm = output<void>();

  onClick(): void {
    if (!this.disabled()) this.confirm.emit();
  }
}
