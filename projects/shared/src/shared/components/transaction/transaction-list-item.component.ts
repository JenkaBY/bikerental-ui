import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import type { CustomerTransaction } from '../../../core/models/transaction.model';
import { MoneyPipe } from '../../pipes/money.pipe';
import { mapPaymentMethodLabel, mapTransactionKind } from '../../transaction.meta';

@Component({
  selector: 'app-transaction-list-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatIconModule, MoneyPipe],
  template: `
    @if (transaction(); as t) {
      <div class="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2">
        <mat-icon class="shrink-0 text-slate-400" aria-hidden="true">{{ meta().icon }}</mat-icon>
        <span class="flex flex-col min-w-0 flex-1">
          <span class="text-sm text-slate-700 truncate">{{ meta().label }}</span>
          <span class="text-xs text-slate-400">
            {{ t.recordedAt | date: 'dd.MM.yyyy HH:mm' }}
            @if (paymentMethodLabel(); as pm) {
              <span>· {{ pm }}</span>
            }
          </span>
        </span>
        <span
          class="text-sm font-semibold whitespace-nowrap"
          [class.text-emerald-600]="t.amountColor === 'positive'"
          [class.text-slate-700]="t.amountColor === 'negative'"
          [class.text-slate-400]="t.amountColor === 'neutral'"
        >
          {{ t.amount | money: true }}
        </span>
      </div>
    }
  `,
})
export class TransactionListItemComponent {
  readonly transaction = input.required<CustomerTransaction>();

  protected readonly meta = computed(() => mapTransactionKind(this.transaction().kind));

  protected readonly paymentMethodLabel = computed(() => {
    const method = this.transaction().paymentMethod;
    return method && method !== 'INTERNAL_TRANSFER' ? mapPaymentMethodLabel(method) : '';
  });
}
