import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  Labels,
  LedgerType,
  parseDate,
  toIsoDate,
  TransactionListItemComponent,
  TransactionSearchStore,
} from '@bikerental/shared';
import { TransactionFilterComponent, TransactionFilterValue } from './transaction-filter.component';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-transaction-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TransactionSearchStore],
  imports: [
    MatCardModule,
    MatButtonModule,
    MatPaginatorModule,
    MatProgressBarModule,
    TransactionListItemComponent,
    TransactionFilterComponent,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>{{ Labels.TransactionsNavLabel }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <app-transaction-filter [value]="filterValue()" (filterChange)="onFilterChange($event)" />

        @if (store.loading()) {
          <mat-progress-bar mode="indeterminate" />
        }

        @if (store.error()) {
          <div class="text-center mt-6 flex flex-col items-center gap-2">
            <p class="text-slate-500">{{ Labels.CustomerTransactionsLoadError }}</p>
            <button mat-stroked-button (click)="store.reload()">{{ Labels.Retry }}</button>
          </div>
        } @else if (!store.loading() && store.items().length === 0) {
          <p class="text-sm text-slate-400 py-8 text-center">
            {{ Labels.CustomerTransactionsEmptyState }}
          </p>
        } @else {
          <div class="flex flex-col gap-2 py-3">
            @for (row of store.items(); track row.transaction.id) {
              <app-transaction-list-item
                [transaction]="row.transaction"
                [customer]="row.customer"
                [showRentalLink]="true"
                [detailsLink]="['/transactions', row.transaction.id]"
              />
            }
          </div>
        }

        <mat-paginator
          [length]="store.totalItems()"
          [pageIndex]="store.pageIndex()"
          [pageSize]="store.pageSize()"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onPageChange($event)"
          showFirstLastButtons
        />
      </mat-card-content>
    </mat-card>
  `,
})
export class TransactionHistoryComponent {
  readonly store = inject(TransactionSearchStore);

  protected readonly Labels = Labels;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly params = toSignal(this.route.queryParams, { initialValue: {} as Params });

  protected readonly customerId = computed(() => this.params()['customerId'] || undefined);
  protected readonly sourceId = computed(() => this.params()['sourceId'] || undefined);
  protected readonly from = computed(() => parseDate(this.params()['from']) ?? undefined);
  protected readonly to = computed(() => parseDate(this.params()['to']) ?? undefined);
  protected readonly ledgerTypes = computed(() => {
    const raw = this.params()['ledgerTypes'];
    return raw ? (raw.split(',') as LedgerType[]) : [];
  });
  protected readonly page = computed(() => {
    const value = Number(this.params()['page']);
    return Number.isInteger(value) && value >= 0 ? value : 0;
  });
  protected readonly size = computed(() => {
    const value = Number(this.params()['size']);
    return Number.isInteger(value) && value > 0 ? value : PAGE_SIZE;
  });

  protected readonly filterValue = computed<TransactionFilterValue>(() => ({
    ledgerTypes: this.ledgerTypes(),
    customerId: this.customerId(),
    sourceId: this.sourceId(),
    from: this.from(),
    to: this.to(),
  }));

  constructor() {
    effect(() => {
      this.store.search({
        customerIds: this.customerId() ? [this.customerId()] : undefined,
        ledgerTypes: this.ledgerTypes(),
        sourceId: this.sourceId(),
        from: this.from(),
        to: this.to(),
        pageIndex: this.page(),
        pageSize: this.size(),
        withCustomer: true,
      });
    });
  }

  protected onFilterChange(value: TransactionFilterValue): void {
    this.updateUrl(
      {
        customerId: value.customerId ?? null,
        sourceId: value.sourceId ?? null,
        ledgerTypes: value.ledgerTypes.length ? value.ledgerTypes.join(',') : null,
        from: value.from ? toIsoDate(value.from) : null,
        to: value.to ? toIsoDate(value.to) : null,
        page: null,
      },
      true,
    );
  }

  protected onPageChange(event: PageEvent): void {
    this.updateUrl(
      {
        page: event.pageIndex === 0 ? null : event.pageIndex,
        size: event.pageSize === PAGE_SIZE ? null : event.pageSize,
      },
      false,
    );
  }

  private updateUrl(queryParams: Params, replaceUrl: boolean): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl,
    });
  }
}
