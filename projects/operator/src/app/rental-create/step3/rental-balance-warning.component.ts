import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Labels, MoneyPipe, RentalValidationStore, TopUpButtonComponent } from '@bikerental/shared';

@Component({
  selector: 'app-rental-balance-warning',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MoneyPipe, TopUpButtonComponent],
  template: `
    @if (!validationStore.isBalanceSufficient()) {
      <div class="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
        <div class="flex items-center justify-between gap-2">
          <p class="text-sm text-red-600">
            {{ Labels.BalanceShortfall }}: {{ validationStore.balanceShortfall() | money }}
          </p>
          <app-top-up-button (confirm)="topUpRequested.emit()"></app-top-up-button>
        </div>
      </div>
    }
  `,
})
export class RentalBalanceWarningComponent {
  protected readonly Labels = Labels;
  protected readonly validationStore = inject(RentalValidationStore);

  readonly topUpRequested = output<void>();
}
