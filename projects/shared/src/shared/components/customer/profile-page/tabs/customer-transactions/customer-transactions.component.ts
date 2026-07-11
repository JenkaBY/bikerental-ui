import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CustomerTransactionsStore } from '../../../../../../core/state/customer-transactions.store';
import { Labels } from '../../../../../constant/labels';
import { TransactionListItemComponent } from '../../../../transaction/transaction-list-item.component';

@Component({
  selector: 'app-customer-transactions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatPaginatorModule, MatProgressBarModule, TransactionListItemComponent],
  template: `
    <div class="p-4 md:p-6">
      @if (store.loading()) {
        <mat-progress-bar mode="indeterminate" class="mb-2" />
      }

      @if (!store.loading() && store.transactions().length === 0) {
        <p class="text-slate-400 text-center mt-8">{{ Labels.CustomerTransactionsEmptyState }}</p>
      }

      <div class="flex flex-col gap-2">
        @for (t of store.transactions(); track $index) {
          <app-transaction-list-item [transaction]="t" [showBalances]="true" />
        }
      </div>

      <mat-paginator
        [length]="store.totalItems()"
        [pageIndex]="store.pageIndex()"
        [pageSize]="store.pageSize()"
        [hidePageSize]="true"
        (page)="onPage($event)"
      />
    </div>
  `,
})
export class CustomerTransactionsComponent implements OnInit {
  protected readonly Labels = Labels;

  protected readonly store = inject(CustomerTransactionsStore);

  ngOnInit(): void {
    this.store.load();
  }

  protected onPage(event: PageEvent): void {
    this.store.loadPage(event.pageIndex);
  }
}
