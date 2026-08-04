import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DamageReportStore } from '../../../../../../core/state/damage-report.store';
import { CustomerLayoutStore } from '../../../../../../core/state/customer-layout.store';
import { Labels } from '../../../../../constant/labels';
import { DamageReportListItemComponent } from '../../../../damage-report/damage-report-list-item.component';
import { PenaltyRentalFilterComponent } from './penalty-rental-filter.component';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-customer-penalties',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DamageReportStore],
  imports: [
    MatButtonModule,
    MatPaginatorModule,
    MatProgressBarModule,
    DamageReportListItemComponent,
    PenaltyRentalFilterComponent,
  ],
  template: `
    <div class="p-4 md:p-6">
      <div class="mb-3">
        <app-penalty-rental-filter
          [rentalId]="rentalId()"
          (rentalIdChange)="onRentalIdChange($event)"
        />
      </div>

      @if (store.loading()) {
        <mat-progress-bar mode="indeterminate" class="mb-2" />
      }

      @if (!store.loading() && store.items().length === 0) {
        <div class="text-center mt-8 flex flex-col items-center gap-2">
          <p class="text-slate-400">{{ Labels.CustomerPenaltiesEmptyState }}</p>
          @if (rentalId()) {
            <button mat-button (click)="onRentalIdChange(undefined)">
              {{ Labels.CustomerRentalsResetFilter }}
            </button>
          }
        </div>
      }

      <div class="flex flex-col gap-2">
        @for (report of store.items(); track report.id) {
          <app-damage-report-list-item [report]="report" />
        }
      </div>

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
export class CustomerPenaltiesComponent {
  protected readonly Labels = Labels;

  protected readonly store = inject(DamageReportStore);
  private readonly layoutStore = inject(CustomerLayoutStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly params = toSignal(this.route.queryParams, { initialValue: {} as Params });

  protected readonly rentalId = computed(() => {
    const value = Number(this.params()['rentalId']);
    return Number.isInteger(value) && value > 0 ? value : undefined;
  });

  private readonly page = computed(() => {
    const value = Number(this.params()['page']);
    return Number.isInteger(value) && value >= 0 ? value : 0;
  });

  constructor() {
    effect(() => {
      const customerId = this.layoutStore.customerId();
      if (!customerId) return;
      this.store.search({
        customerId,
        rentalId: this.rentalId(),
        pageIndex: this.page(),
        pageSize: PAGE_SIZE,
      });
    });
  }

  protected onRentalIdChange(rentalId: number | undefined): void {
    this.updateUrl({ rentalId: rentalId ?? null, page: null });
  }

  protected onPage(event: PageEvent): void {
    this.updateUrl({ page: event.pageIndex === 0 ? null : event.pageIndex });
  }

  private updateUrl(queryParams: Params): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
