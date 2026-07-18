import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CustomerRentalListItemComponent, Labels, RentalSearchStore } from '@bikerental/shared';
import { RentalFilterComponent, RentalFilterValue } from './rental-filter.component';

@Component({
  selector: 'app-rental-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RentalSearchStore],
  imports: [
    MatCardModule,
    MatPaginatorModule,
    MatProgressBarModule,
    CustomerRentalListItemComponent,
    RentalFilterComponent,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>{{ Labels.Rentals }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <app-rental-filter (filterChange)="onFilterChange($event)" />

        @if (store.loading()) {
          <mat-progress-bar mode="indeterminate" />
        }

        @if (!store.loading() && store.items().length === 0) {
          <p class="text-sm text-slate-400 py-8 text-center">
            {{ Labels.CustomerRentalsEmptyState }}
          </p>
        } @else {
          <div class="grid grid-cols-[repeat(auto-fill,minmax(22rem,1fr))] gap-2 py-3">
            @for (row of store.items(); track row.rental.id) {
              <app-customer-rental-list-item [rental]="row.rental" [customer]="row.customer" />
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
export class RentalListComponent implements OnInit {
  readonly store = inject(RentalSearchStore);

  protected readonly Labels = Labels;

  private filter: RentalFilterValue = { statuses: [] };
  private pageSize = 20;

  ngOnInit(): void {
    this.runSearch(0);
  }

  onFilterChange(value: RentalFilterValue): void {
    this.filter = value;
    this.runSearch(0);
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize ?? this.pageSize;
    this.runSearch(event.pageIndex ?? 0);
  }

  private runSearch(pageIndex: number): void {
    this.store.search({
      statuses: this.filter.statuses,
      customerId: this.filter.customerId,
      from: this.filter.from,
      to: this.filter.to,
      pageIndex,
      pageSize: this.pageSize,
      withCustomer: true,
    });
  }
}
