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
import { Labels, MoneyPipe } from '@bikerental/shared';
import { CustomerLayoutStore } from '../../customer-layout.store';
import { CustomerFinanceStore } from '@store.customer-finance.store';
import { TopUpDialogComponent } from '../../../dialogs/top-up-dialog/top-up-dialog.component';
import { WithdrawDialogComponent } from '../../../dialogs/withdraw-dialog/withdraw-dialog.component';
import { CustomerTransactionsStore } from '../../customer-transactions.store';

@Component({
  selector: 'app-customer-account',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MoneyPipe],
  template: `
    <div class="p-4 md:p-6 max-w-sm">
      <dl class="flex flex-col gap-4 mb-6">
        <div>
          <dt class="text-xs text-slate-500">{{ Labels.CustomerBalanceAvailable }}</dt>
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
        <button
          mat-flat-button
          class="bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          style="background-color: #ecfdf5; color: #065f46"
          (click)="openTopUp()"
        >
          {{ Labels.CustomerTopUpButton }}
        </button>
        <button
          mat-stroked-button
          class="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200"
          style="background-color: #fffbeb; color: #92400e; border-color: #fcd34d"
          [disabled]="!financeStore.balance()?.isWithdrawalAvailable"
          (click)="openWithdraw()"
        >
          {{ Labels.CustomerWithdrawButton }}
        </button>
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
        data: { customerId: this.layoutStore.customerId() },
        width: '380px',
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
        data: { customerId: this.layoutStore.customerId(), availableBalance: bal?.available },
        width: '380px',
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
