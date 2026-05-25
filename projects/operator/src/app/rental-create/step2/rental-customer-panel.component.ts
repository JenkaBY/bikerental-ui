import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  Labels,
  MoneyPipe,
  RENTAL_STORE_TOKEN,
  TopUpButtonComponent,
  WithdrawButtonComponent,
} from '@bikerental/shared';

@Component({
  selector: 'app-rental-customer-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MoneyPipe, TopUpButtonComponent, WithdrawButtonComponent],
  template: `
    <div
      class="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200 shadow-sm"
    >
      <div class="flex flex-col gap-0.5 min-w-0">
        <span class="font-semibold text-slate-900 truncate">
          {{ store.customer()?.phone }}
        </span>
        @if (customerFullName()) {
          <span class="text-sm text-slate-500 truncate">{{ customerFullName() }}</span>
        }
        @if (store.customerBalance(); as balance) {
          <span
            class="text-sm font-medium"
            [class.text-red-600]="!store.isBalanceSufficient()"
            [class.text-green-700]="store.isBalanceSufficient()"
          >
            {{ Labels.BalanceAvailable }}: {{ balance?.available | money }}
          </span>
          <span class="text-sm font-medium">
            {{ Labels.CustomerBalanceReserved }}: {{ balance?.reserved | money }}
          </span>
        }
      </div>
      <app-withdraw-button
        (confirm)="onWithdrawClicked()"
        [disabled]="!this.store.customerBalance()?.isWithdrawalAvailable"
      ></app-withdraw-button>
      <app-top-up-button (confirm)="topUpRequested.emit()"></app-top-up-button>
    </div>
  `,
})
export class RentalCustomerPanelComponent {
  protected readonly store = inject(RENTAL_STORE_TOKEN);
  protected readonly Labels = Labels;

  readonly topUpRequested = output<void>();
  readonly withdrawRequested = output<void>();

  protected customerFullName = () => {
    const c = this.store.customer();
    if (!c) return '';
    return `${c.firstName} ${c.lastName}`.trim();
  };

  protected onWithdrawClicked() {
    this.withdrawRequested.emit();
  }
}
