import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  BatchRentalPropertyStore,
  CustomerFinanceStore,
  DamageReportStore,
  RentalCostCalculationStore,
  Labels,
  parseDate,
  RentalSearchStore,
  RentalSignatureStore,
  RentalStore,
  RentalTransactionsStore,
  toIsoDate,
} from '@bikerental/shared';
import { RentalFilterComponent, RentalFilterValue } from './rental-filter.component';
import { RentalTableComponent } from './rental-table.component';
import { RentalDetailPanelComponent } from './rental-detail-panel.component';

const DEFAULT_SORT = 'startedAt,desc';
const DEFAULT_PAGE_SIZE = 20;
const MIN_SPLIT_HEIGHT = 320;
const SPLIT_BOTTOM_GAP = 96;

@Component({
  selector: 'app-rental-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    RentalSearchStore,
    RentalStore,
    BatchRentalPropertyStore,
    RentalCostCalculationStore,
    CustomerFinanceStore,
    RentalTransactionsStore,
    RentalSignatureStore,
    DamageReportStore,
  ],
  imports: [
    MatCardModule,
    MatPaginatorModule,
    MatProgressBarModule,
    RentalFilterComponent,
    RentalTableComponent,
    RentalDetailPanelComponent,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>{{ Labels.Rentals }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <app-rental-filter [value]="filterValue()" (filterChange)="onFilterChange($event)" />

        @if (store.loading()) {
          <mat-progress-bar mode="indeterminate" />
        }

        @if (!store.loading() && store.items().length === 0) {
          <p class="text-sm text-slate-400 py-8 text-center">
            {{ Labels.CustomerRentalsEmptyState }}
          </p>
        } @else {
          <div #split class="flex gap-4 py-3 items-stretch" [style.height.px]="splitHeight()">
            <div class="flex-1 min-w-0 overflow-auto">
              <app-rental-table
                [rows]="store.items()"
                [selectedId]="selectedId()"
                [sort]="sort()"
                (rowSelect)="onRowSelect($event)"
                (sortChange)="onSortChange($event)"
              />
            </div>
            @if (selectedId() !== null) {
              <aside class="basis-[38%] shrink-0 min-w-0 overflow-y-auto">
                <app-rental-detail-panel
                  [showOpenLink]="true"
                  (actionCompleted)="onActionCompleted()"
                />
              </aside>
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
export class RentalListComponent {
  readonly store = inject(RentalSearchStore);

  private readonly rentalStore = inject(RentalStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly Labels = Labels;

  private readonly params = toSignal(this.route.queryParams, { initialValue: {} as Params });

  protected readonly filterValue = computed<RentalFilterValue>(() => {
    const p = this.params();
    const statuses = String(p['statuses'] ?? '')
      .split(',')
      .filter(Boolean);
    return {
      statuses,
      customerId: p['customerId'] || undefined,
      customerPhone: p['customerPhone'] || undefined,
      from: parseDate(p['from']) ?? undefined,
      to: parseDate(p['to']) ?? undefined,
    };
  });

  protected readonly sort = computed(() => this.params()['sort'] || DEFAULT_SORT);

  protected readonly selectedId = computed(() => {
    const value = Number(this.params()['rental']);
    return Number.isInteger(value) && value > 0 ? value : null;
  });

  private readonly pageIndex = computed(() => {
    const value = Number(this.params()['page']);
    return Number.isInteger(value) && value >= 0 ? value : 0;
  });

  private readonly pageSize = computed(() => {
    const value = Number(this.params()['size']);
    return Number.isInteger(value) && value > 0 ? value : DEFAULT_PAGE_SIZE;
  });

  protected readonly splitHeight = signal(MIN_SPLIT_HEIGHT);

  private readonly split = viewChild<ElementRef<HTMLElement>>('split');

  constructor() {
    effect(() => {
      const filter = this.filterValue();
      this.store.search({
        statuses: filter.statuses,
        customerId: filter.customerId,
        from: filter.from,
        to: filter.to,
        pageIndex: this.pageIndex(),
        pageSize: this.pageSize(),
        sort: this.sort(),
        withCustomer: true,
      });
    });

    effect(() => {
      const id = this.selectedId();
      if (id === null) {
        this.rentalStore.reset();
        return;
      }
      this.rentalStore.loadDetail(id);
    });

    afterRenderEffect(() => {
      this.store.items();
      this.selectedId();
      this.measureSplitHeight();
    });

    const onResize = () => this.measureSplitHeight();
    window.addEventListener('resize', onResize);
    this.destroyRef.onDestroy(() => window.removeEventListener('resize', onResize));
  }

  protected onFilterChange(value: RentalFilterValue): void {
    this.updateUrl({
      statuses: value.statuses.length ? value.statuses.join(',') : null,
      customerId: value.customerId ?? null,
      customerPhone: value.customerPhone ?? null,
      from: value.from ? toIsoDate(value.from) : null,
      to: value.to ? toIsoDate(value.to) : null,
      page: null,
      rental: null,
    });
  }

  protected onSortChange(sort: string): void {
    this.updateUrl({ sort: sort === DEFAULT_SORT ? null : sort, page: null });
  }

  protected onRowSelect(rentalId: number): void {
    this.updateUrl({ rental: this.selectedId() === rentalId ? null : rentalId });
  }

  protected onActionCompleted(): void {
    this.store.reload();
  }

  protected onPageChange(event: PageEvent): void {
    this.updateUrl({
      page: event.pageIndex === 0 ? null : event.pageIndex,
      size: event.pageSize === DEFAULT_PAGE_SIZE ? null : event.pageSize,
      rental: null,
    });
  }

  private measureSplitHeight(): void {
    const host = this.split()?.nativeElement;
    if (!host) return;
    const top = host.getBoundingClientRect().top;
    const available = window.innerHeight - top - SPLIT_BOTTOM_GAP;
    this.splitHeight.set(Math.max(MIN_SPLIT_HEIGHT, Math.round(available)));
  }

  private updateUrl(queryParams: Params): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }
}
