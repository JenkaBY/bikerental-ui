import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { Labels } from '@bikerental/shared';

@Component({
  selector: 'app-rental-activate-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButton, MatProgressSpinner],
  template: `
    <button
      mat-flat-button
      color="primary"
      type="button"
      class="flex-1"
      [disabled]="disabled() || loading()"
      (click)="activateRequested.emit()"
    >
      @if (loading()) {
        <mat-spinner diameter="20" />
      } @else {
        {{ Labels.StartRental }}
      }
    </button>
  `,
})
export class RentalActivateButtonComponent {
  protected readonly Labels = Labels;

  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);

  readonly activateRequested = output<void>();
}
