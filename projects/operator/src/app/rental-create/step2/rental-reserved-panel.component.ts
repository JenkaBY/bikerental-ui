import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Labels, RentalTransactionsStore, TransactionListItemComponent } from '@bikerental/shared';
import { RentalReservedPanelHeaderComponent } from './rental-reserved-panel-header.component';

@Component({
  selector: 'app-rental-reserved-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, RentalReservedPanelHeaderComponent, TransactionListItemComponent],
  template: `
    <div class="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <app-rental-reserved-panel-header
        [expanded]="expanded()"
        [count]="store.transactionCount()"
        [reserved]="store.reserved()"
        (toggled)="toggled.emit()"
      />

      @if (store.errorMessage(); as message) {
        <div
          class="mx-3 mb-3 flex items-center justify-between gap-2 rounded-lg bg-red-50 px-3 py-2"
        >
          <span class="text-sm text-red-700">{{ message }}</span>
          <button mat-button [disabled]="store.loading()" (click)="store.reload()">
            {{ Labels.Retry }}
          </button>
        </div>
      }

      @if (expanded()) {
        <div class="px-4 pb-4 flex flex-col gap-2">
          @for (t of store.transactions(); track $index) {
            <app-transaction-list-item [transaction]="t" />
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
