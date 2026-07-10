import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomerFinanceStore } from '../../../../../../core/state/customer-finance.store';
import { CustomerLayoutStore } from '../../../../../../core/state/customer-layout.store';
import { CustomerTransactionsStore } from '../../../../../../core/state/customer-transactions.store';
import { Labels } from '../../../../../constant/labels';
import { MOBILE_FORM_DIALOG_CONFIG } from '../../../../../constant/mobile-form-dialog.config';
import { MoneyPipe } from '../../../../../pipes/money.pipe';
import { TopUpButtonComponent } from '../../../../top-up-button/top-up-button.component';
import { TopUpDialogComponent } from '../../../../top-up-dialog/top-up-dialog.component';
import { WithdrawButtonComponent } from '../../../../withdraw-button/withdraw-button.component';
import { WithdrawDialogComponent } from '../../../../withdraw-dialog/withdraw-dialog.component';

@Component({
  selector: 'app-customer-account',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MoneyPipe, TopUpButtonComponent, WithdrawButtonComponent],
  template: `
    <div class="p-4 md:p-6 max-w-sm">
      <dl class="flex flex-col gap-4 mb-6">
        <div>
          <dt class="text-xs text-slate-500">{{ Labels.Available }}</dt>
          <dd class="text-2xl font-semibold">
            @if (financeStore.balance(); as bal) {
              {{ bal.available | money }}
            } @else {
              —
            }
          </dd>
        </div>
        <div>
          <dt class="text-xs text-slate-500">{{ Labels.CustomerBalanceReserved }}</dt>
          <dd class="text-xl">
            @if (financeStore.balance(); as bal) {
              {{ bal.reserved | money }}
            } @else {
              —
            }
          </dd>
        </div>
      </dl>

      <div class="flex gap-3">
        <app-top-up-button (confirm)="openTopUp()"></app-top-up-button>
        <app-withdraw-button
          [disabled]="!financeStore.balance()?.isWithdrawalAvailable"
          (confirm)="openWithdraw()"
        ></app-withdraw-button>
      </div>
    </div>
  `,
})
export class CustomerAccountComponent {
  protected readonly Labels = Labels;

  protected readonly layoutStore = inject(CustomerLayoutStore);
  protected readonly financeStore = inject(CustomerFinanceStore);
  protected readonly transactionStore = inject(CustomerTransactionsStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private viewContainerRef = inject(ViewContainerRef);

  public openTopUp(): void {
    this.dialog
      .open(TopUpDialogComponent, {
        ...MOBILE_FORM_DIALOG_CONFIG,
        data: { customerId: this.layoutStore.customerId() },
        viewContainerRef: this.viewContainerRef,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.financeStore.refreshBalance();
          this.transactionStore.invalidate();
          this.snackBar.open(Labels.CustomerTopUpSuccess, undefined, { duration: 3000 });
        }
      });
  }

  public openWithdraw(): void {
    const bal = this.financeStore.balance();
    this.dialog
      .open(WithdrawDialogComponent, {
        ...MOBILE_FORM_DIALOG_CONFIG,
        data: { customerId: this.layoutStore.customerId(), availableBalance: bal?.available },
        viewContainerRef: this.viewContainerRef,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.financeStore.refreshBalance();
          this.transactionStore.invalidate();
          this.snackBar.open(Labels.CustomerWithdrawSuccess, undefined, { duration: 3000 });
        }
      });
  }
}
