import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Labels } from '@bikerental/shared';

@Component({
  selector: 'app-rental-activate-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatProgressSpinnerModule],
  template: `
    <button
      mat-flat-button
      class="w-full"
      style="min-height: 48px"
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
