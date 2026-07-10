import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import type { CustomerTransaction } from '@ui-models';
import { MoneyPipe } from '@bikerental/shared';

@Component({
  selector: 'app-rental-reserved-transaction-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatIconModule, MoneyPipe],
  template: `
    @if (transaction(); as t) {
      <div class="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2">
        <mat-icon class="shrink-0 text-slate-400" aria-hidden="true">receipt</mat-icon>
        <span class="flex flex-col min-w-0 flex-1">
          <span class="text-sm text-slate-700 truncate">{{ t.description }}</span>
          <span class="text-xs text-slate-400">{{ t.recordedAt | date: 'dd.MM.yyyy HH:mm' }}</span>
        </span>
        <span
          class="text-sm font-semibold whitespace-nowrap"
          [class.text-amber-600]="t.amountColor === 'negative'"
          [class.text-emerald-600]="t.amountColor === 'positive'"
          [class.text-slate-600]="t.amountColor === 'neutral'"
        >
          {{ t.amount | money }}
        </span>
      </div>
    }
  `,
})
export class RentalReservedTransactionRowComponent {
  readonly transaction = input<CustomerTransaction | null>(null);
}
