import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CustomerRentalsStore } from '../../../../../../core/state/customer-rentals.store';
import { CustomerLayoutStore } from '../../../../../../core/state/customer-layout.store';
import { Labels } from '../../../../../constant/labels';
import { parseDate, toIsoDate } from '../../../../../utils/date.util';
import { CustomerRentalListItemComponent } from './customer-rental-list-item.component';
import {
  RentalDateRange,
  RentalDateRangeFilterComponent,
} from './rental-date-range-filter.component';

@Component({
  selector: 'app-customer-rentals',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatPaginatorModule,
    MatProgressBarModule,
    CustomerRentalListItemComponent,
    RentalDateRangeFilterComponent,
  ],
  template: `
    <div class="p-4 md:p-6 flex flex-col gap-3">
      <app-rental-date-range-filter
        [from]="from()"
        [to]="to()"
        (rangeChange)="onRangeChange($event)"
        (clear)="onClear()"
      />

      @if (store.loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      @if (store.error()) {
        <div class="text-center mt-6 flex flex-col items-center gap-2">
          <p class="text-slate-500">{{ Labels.CustomerRentalLoadError }}</p>
          <button mat-stroked-button (click)="store.reload()">{{ Labels.Retry }}</button>
        </div>
      } @else if (!store.loading() && store.rentals().length === 0) {
        <div class="text-center mt-6 flex flex-col items-center gap-2">
          <p class="text-slate-400">{{ emptyMessage() }}</p>
          @if (hasFilter()) {
            <button mat-button (click)="onClear()">{{ Labels.CustomerRentalsResetFilter }}</button>
          }
        </div>
      } @else {
        <div class="flex flex-col gap-2">
          @for (rental of store.rentals(); track rental.id) {
            <app-customer-rental-list-item [rental]="rental" />
          }
        </div>
      }

      @if (store.totalItems() > 0) {
        <mat-paginator
          [length]="store.totalItems()"
          [pageIndex]="store.pageIndex()"
          [pageSize]="store.pageSize()"
          [hidePageSize]="true"
          (page)="onPage($event)"
        />
      }
    </div>
  `,
})
export class CustomerRentalsComponent {
  protected readonly Labels = Labels;

  protected readonly store = inject(CustomerRentalsStore);
  private readonly layoutStore = inject(CustomerLayoutStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly params = toSignal(this.route.queryParams, { initialValue: {} as Params });

  protected readonly from = computed(() => parseDate(this.params()['from']) ?? undefined);
  protected readonly to = computed(() => parseDate(this.params()['to']) ?? undefined);
  protected readonly page = computed(() => {
    const value = Number(this.params()['page']);
    return Number.isInteger(value) && value >= 0 ? value : 0;
  });

  protected readonly hasFilter = computed(() => !!(this.from() || this.to()));
  protected readonly emptyMessage = computed(() =>
    this.hasFilter() ? Labels.CustomerRentalsEmptyFiltered : Labels.CustomerRentalsEmptyState,
  );

  constructor() {
    effect(() => {
      const customerId = this.layoutStore.customerId();
      if (!customerId) return;
      this.store.load(this.from(), this.to(), this.page());
    });
  }

  protected onRangeChange(range: RentalDateRange): void {
    this.updateUrl(
      {
        from: range.from ? toIsoDate(range.from) : null,
        to: range.to ? toIsoDate(range.to) : null,
        page: null,
      },
      true,
    );
  }

  protected onClear(): void {
    this.updateUrl({ from: null, to: null, page: null }, true);
  }

  protected onPage(event: PageEvent): void {
    this.updateUrl({ page: event.pageIndex === 0 ? null : event.pageIndex }, false);
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
