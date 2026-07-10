import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Labels, RentalTransactionsStore } from '@bikerental/shared';
import { RentalReservedPanelHeaderComponent } from './rental-reserved-panel-header.component';
import { RentalReservedTransactionRowComponent } from './rental-reserved-transaction-row.component';

@Component({
  selector: 'app-rental-reserved-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RentalReservedPanelHeaderComponent, RentalReservedTransactionRowComponent],
  template: `
    <div class="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <app-rental-reserved-panel-header
        [expanded]="expanded()"
        [count]="store.transactionCount()"
        [reserved]="store.reserved()"
        (toggled)="toggled.emit()"
      />

      @if (expanded()) {
        <div class="px-4 pb-4 flex flex-col gap-2">
          @for (t of store.transactions(); track $index) {
            <app-rental-reserved-transaction-row [transaction]="t" />
          } @empty {
            <p class="text-sm text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
              {{ Labels.ReservedTransactionsEmpty }}
            </p>
          }
        </div>
      }
    </div>
  `,
})
export class RentalReservedPanelComponent {
  protected readonly store = inject(RentalTransactionsStore);
  protected readonly Labels = Labels;

  readonly expanded = input<boolean>(false);
  readonly toggled = output<void>();
}
