import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Labels, MoneyPipe } from '@bikerental/shared';
import { CustomerTransactionsStore } from '../../customer-transactions.store';

@Component({
  selector: 'app-customer-transactions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatTableModule, MatPaginatorModule, MatProgressBarModule, MoneyPipe],
  styles: `
    :host {
      color-scheme: light dark;
    }

    .amount-positive td {
      /* Use system token with a safe fallback so missing tokens don't invalidate the rule */
      /* row background using system container token for correct contrast */
      /* fallback to a subtle tint if tokens are not present */
      background: var(--mat-sys-primary-container, rgba(15, 98, 254, 0.06));
      color: var(--mat-sys-on-primary-container, inherit);
    }

    .amount-negative td {
      background: var(--mat-sys-error-container, rgba(176, 0, 32, 0.06));
      color: var(--mat-sys-on-error-container, inherit);
    }

    .amount-neutral {
      color: inherit;
    }
  `,
  template: `
    <div class="p-4 md:p-6">
      @if (store.loading()) {
        <mat-progress-bar mode="indeterminate" class="mb-2" />
      }

      @if (!store.loading() && store.transactions().length === 0) {
        <p class="text-slate-400 text-center mt-8">{{ Labels.CustomerTransactionsEmptyState }}</p>
      }

      <table mat-table [dataSource]="store.transactions()" class="w-full">
        <!-- Date column -->
        <ng-container matColumnDef="recordedAt">
          <th mat-header-cell *matHeaderCellDef>{{ Labels.TransactionDateLabel }}</th>
          <td mat-cell *matCellDef="let row">{{ row.recordedAt | date: 'dd MMM yyyy HH:mm' }}</td>
        </ng-container>

        <!-- Description column -->
        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef>{{ Labels.TransactionDescriptionLabel }}</th>
          <td mat-cell *matCellDef="let row">{{ row.description ?? row.sourceType ?? '—' }}</td>
        </ng-container>

        <!-- Amount column -->
        <ng-container matColumnDef="amount">
          <th mat-header-cell *matHeaderCellDef class="text-right">
            {{ Labels.TransactionAmountLabel }}
          </th>
          <td mat-cell *matCellDef="let row" class="text-right">
            <span>{{ row.amount | money }}</span>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr
          mat-row
          *matRowDef="let row; columns: displayedColumns"
          [class.amount-positive]="row.amountColor === 'positive'"
          [class.amount-negative]="row.amountColor === 'negative'"
        ></tr>
      </table>

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
  protected readonly displayedColumns = ['recordedAt', 'description', 'amount'];

  protected readonly store = inject(CustomerTransactionsStore);

  ngOnInit(): void {
    this.store.load();
  }

  protected onPage(event: PageEvent): void {
    this.store.loadPage(event.pageIndex);
  }
}
