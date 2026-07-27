import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import type { CustomerRef } from '../../../core/models/customer.model';
import type { Money, TransactionDetails } from '../../../core/models/transaction.model';
import { Labels } from '../../constant/labels';
import { MoneyPipe } from '../../pipes/money.pipe';
import { mapPaymentMethodLabel } from '../../transaction.meta';
import { TransactionEntriesTableComponent } from './transaction-entries-table.component';
import { TransactionListItemComponent } from './transaction-list-item.component';

@Component({
  selector: 'app-transaction-details-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MoneyPipe, TransactionEntriesTableComponent, TransactionListItemComponent],
  template: `
    @if (details(); as d) {
      <div class="flex flex-col gap-4">
        <app-transaction-list-item
          [transaction]="d"
          [customer]="customer()"
          [showBalances]="true"
          [showRentalLink]="true"
        />

        <dl class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt class="text-slate-400">{{ Labels.TransactionDateLabel }}</dt>
          <dd>{{ d.recordedAt | date: 'dd.MM.yyyy HH:mm' }}</dd>

          <dt class="text-slate-400">{{ Labels.PaymentMethod }}</dt>
          <dd>{{ paymentMethodLabel() }}</dd>

          <dt class="text-slate-400">{{ Labels.Operator }}</dt>
          <dd>{{ operatorName() ?? d.operatorId }}</dd>

          <dt class="text-slate-400">{{ Labels.TransactionIdLabel }}</dt>
          <dd class="font-mono break-all">{{ d.id }}</dd>

          @if (d.reason) {
            <dt class="text-slate-400">{{ Labels.TransactionReasonLabel }}</dt>
            <dd>{{ d.reason }}</dd>
          }
        </dl>

        <div>
          <h3 class="text-sm font-semibold text-slate-700 mb-1">
            {{ Labels.TransactionDeltasTitle }}
          </h3>
          <div class="grid grid-cols-3 gap-2 text-sm">
            <div>
              <div class="text-xs text-slate-400">{{ Labels.Available }}</div>
              <div [class]="deltaClass(d.deltas.wallet)">{{ d.deltas.wallet | money: true }}</div>
            </div>
            <div>
              <div class="text-xs text-slate-400">{{ Labels.CustomerBalanceReserved }}</div>
              <div [class]="deltaClass(d.deltas.hold)">{{ d.deltas.hold | money: true }}</div>
            </div>
            <div>
              <div class="text-xs text-slate-400">{{ externalLabel() }}</div>
              <div [class]="deltaClass(d.deltas.external)">
                {{ d.deltas.external | money: true }}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-sm font-semibold text-slate-700 mb-1">
            {{ Labels.TransactionBalancesTitle }}
          </h3>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div class="text-xs text-slate-400">{{ Labels.Available }}</div>
              <div>{{ d.balances.wallet | money }}</div>
            </div>
            <div>
              <div class="text-xs text-slate-400">{{ Labels.CustomerBalanceReserved }}</div>
              <div>{{ d.balances.hold | money }}</div>
            </div>
          </div>
        </div>

        <section class="rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3">
          <h3 class="text-sm font-semibold text-slate-700 mb-3">
            {{ Labels.TransactionEntriesTitle }}
          </h3>
          <div class="flex flex-col gap-4">
            <app-transaction-entries-table
              [entries]="customerEntries()"
              [title]="Labels.TransactionCustomerLedgersTitle"
            />
            @if (systemEntries().length) {
              <div class="border-t border-slate-200 pt-4">
                <app-transaction-entries-table
                  [entries]="systemEntries()"
                  [title]="Labels.TransactionSystemLedgersTitle"
                />
              </div>
            }
          </div>
        </section>
      </div>
    }
  `,
})
export class TransactionDetailsViewComponent {
  readonly details = input.required<TransactionDetails>();
  readonly customer = input<CustomerRef | undefined>();
  readonly operatorName = input<string | null>(null);

  protected readonly Labels = Labels;

  protected readonly paymentMethodLabel = computed(() =>
    mapPaymentMethodLabel(this.details().paymentMethod),
  );

  protected readonly externalLabel = computed(() =>
    this.details().kind === 'CAPTURE' ? Labels.FinanceShop : Labels.FinanceExternal,
  );

  protected readonly customerEntries = computed(() =>
    this.details().entries.filter((e) => !e.systemLedger),
  );

  protected readonly systemEntries = computed(() =>
    this.details().entries.filter((e) => e.systemLedger),
  );

  protected deltaClass(value: Money): string {
    if (value.amount > 0) return 'font-semibold text-emerald-600';
    if (value.amount < 0) return 'font-semibold text-slate-700';
    return 'font-semibold text-slate-400';
  }
}
