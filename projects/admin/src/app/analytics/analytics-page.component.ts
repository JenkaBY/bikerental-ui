import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { PageEvent } from '@angular/material/paginator';
import {
  CUSTOMERS_TAB_ID,
  CUSTOMER_SPEND_PAGE_SIZE,
  daysInclusive,
  EquipmentTypeRevenueSource,
  EquipmentUnitRevenueSource,
  Labels,
  MAX_CUSTOMER_SPEND_PAGE_SIZE,
  MAX_REVENUE_RANGE_DAYS,
  OperatorRevenueSource,
  parseCustomerSpendSort,
  parseDate,
  REVENUE_GRANULARITIES,
  REVENUE_REPORT_SOURCES,
  resolveFieldErrorMessage,
  SegmentedTabsComponent,
  toIsoDate,
  type AnalyticsTabId,
  type CustomerAnalyticsRange,
  type CustomerSpendListState,
  type CustomerSpendSort,
  type RevenueGranularity,
  type RevenueQuery,
  type RevenueReportId,
  type SegmentTab,
} from '@bikerental/shared';
import { CustomerAnalyticsPanelComponent } from './customer-analytics-panel.component';
import { EquipmentTypeSelectComponent } from './equipment-type-select.component';
import { EquipmentUnitSelectComponent } from './equipment-unit-select.component';
import { OperatorSelectComponent } from './operator-select.component';
import { RevenueFilterComponent, type RevenueFilterValue } from './revenue-filter.component';
import { RevenueReportPanelComponent } from './revenue-report-panel.component';

function defaultRange(): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return { from, to };
}

@Component({
  selector: 'app-analytics-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: REVENUE_REPORT_SOURCES,
      useFactory: () => [
        inject(OperatorRevenueSource),
        inject(EquipmentTypeRevenueSource),
        inject(EquipmentUnitRevenueSource),
      ],
    },
  ],
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    SegmentedTabsComponent,
    RevenueFilterComponent,
    OperatorSelectComponent,
    EquipmentTypeSelectComponent,
    EquipmentUnitSelectComponent,
    RevenueReportPanelComponent,
    CustomerAnalyticsPanelComponent,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>{{ Labels.AnalyticsPageTitle }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="flex items-center justify-between mb-1">
          <app-segmented-tabs
            [tabs]="tabs()"
            [activeId]="reportId()"
            (tabSelect)="onReportChange($event)"
          />
          <button mat-stroked-button (click)="onRefresh()">
            <mat-icon>refresh</mat-icon>
            {{ Labels.AnalyticsRefreshButton }}
          </button>
        </div>
        <p class="text-xs text-slate-400 mb-3">{{ Labels.AnalyticsFreshnessNote }}</p>

        <app-revenue-filter [value]="filterValue()" (filterChange)="onFilterChange($event)">
          @if (reportId() === 'operators' || isCustomers()) {
            <app-operator-select
              dimension-filter
              [value]="dimensionId()"
              (valueChange)="onDimensionChange($event)"
            />
          } @else if (reportId() === 'equipment-types') {
            <app-equipment-type-select
              dimension-filter
              [value]="dimensionId()"
              (valueChange)="onDimensionChange($event)"
            />
          } @else if (reportId() === 'equipment-units') {
            <ng-container dimension-filter>
              <app-equipment-type-select
                [value]="scopeId()"
                [allowAll]="false"
                [label]="Labels.AnalyticsEquipmentTypeScopeLabel"
                (valueChange)="onScopeChange($event)"
              />
              <app-equipment-unit-select
                [typeSlug]="scopeId()"
                [value]="dimensionId()"
                (valueChange)="onDimensionChange($event)"
              />
            </ng-container>
          }
        </app-revenue-filter>

        @if (rangeErrorMessage(); as msg) {
          <p class="text-sm text-red-600 mt-2">{{ msg }}</p>
        } @else if (isCustomers()) {
          <app-customer-analytics-panel
            [range]="customerRange()"
            [list]="listState()"
            [customerId]="customerId()"
            (pageChange)="onPageChange($event)"
            (sortChange)="onSortChange($event)"
            (customerSelect)="onCustomerSelect($event)"
          />
        } @else {
          <app-revenue-report-panel
            [reportId]="revenueReportId()"
            [query]="revenueQuery()"
            (drillDown)="onDrillDown($event)"
          />
        }
      </mat-card-content>
    </mat-card>
  `,
})
export class AnalyticsPageComponent {
  private readonly sources = inject(REVENUE_REPORT_SOURCES);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly revenuePanel = viewChild(RevenueReportPanelComponent);
  private readonly customerPanel = viewChild(CustomerAnalyticsPanelComponent);

  protected readonly Labels = Labels;

  protected readonly tabs = computed<SegmentTab[]>(() => [
    ...this.sources.map((source) => ({ id: source.id, label: source.tabLabel })),
    { id: CUSTOMERS_TAB_ID, label: Labels.AnalyticsCustomersTab },
  ]);

  private readonly defaults = defaultRange();
  private readonly params = toSignal(this.route.queryParams, { initialValue: {} as Params });

  protected readonly reportId = computed<AnalyticsTabId>(
    () => (this.params()['report'] as AnalyticsTabId) || this.sources[0]?.id || 'operators',
  );
  protected readonly isCustomers = computed(() => this.reportId() === CUSTOMERS_TAB_ID);
  protected readonly revenueReportId = computed<RevenueReportId>(
    () => this.reportId() as RevenueReportId,
  );
  protected readonly from = computed(() => parseDate(this.params()['from']) ?? this.defaults.from);
  protected readonly to = computed(() => parseDate(this.params()['to']) ?? this.defaults.to);
  protected readonly granularity = computed<RevenueGranularity>(() => {
    const value = this.params()['granularity'];
    return REVENUE_GRANULARITIES.includes(value) ? (value as RevenueGranularity) : 'DAY';
  });
  protected readonly dimensionId = computed(() => this.params()['dimensionId'] || undefined);
  protected readonly scopeId = computed(() => this.params()['scopeId'] || undefined);
  protected readonly customerId = computed(() => this.params()['customerId'] || undefined);

  protected readonly pageIndex = computed(() => {
    const value = Number(this.params()['page']);
    return Number.isInteger(value) && value >= 0 ? value : 0;
  });
  protected readonly pageSize = computed(() => {
    const value = Number(this.params()['size']);
    return Number.isInteger(value) && value >= 1 && value <= MAX_CUSTOMER_SPEND_PAGE_SIZE
      ? value
      : CUSTOMER_SPEND_PAGE_SIZE;
  });
  protected readonly sort = computed<CustomerSpendSort>(() =>
    parseCustomerSpendSort(this.params()['sort']),
  );

  protected readonly filterValue = computed<RevenueFilterValue>(() => ({
    from: this.from(),
    to: this.to(),
    granularity: this.granularity(),
  }));

  protected readonly revenueQuery = computed<RevenueQuery>(() => ({
    from: this.from(),
    to: this.to(),
    granularity: this.granularity(),
    dimensionId: this.dimensionId(),
    scopeId: this.scopeId(),
  }));

  protected readonly customerRange = computed<CustomerAnalyticsRange>(() => ({
    from: this.from(),
    to: this.to(),
    granularity: this.granularity(),
    operatorId: this.dimensionId(),
  }));

  protected readonly listState = computed<CustomerSpendListState>(() => ({
    pageIndex: this.pageIndex(),
    pageSize: this.pageSize(),
    sort: this.sort(),
  }));

  protected readonly rangeExceeded = computed(
    () => daysInclusive(this.from(), this.to()) > MAX_REVENUE_RANGE_DAYS,
  );
  protected readonly rangeErrorMessage = computed(() =>
    this.rangeExceeded()
      ? resolveFieldErrorMessage({
          field: null,
          code: 'validation.max_date_range',
          params: { maxDays: MAX_REVENUE_RANGE_DAYS },
        })
      : null,
  );

  protected onFilterChange(value: RevenueFilterValue): void {
    this.updateUrl(
      {
        from: toIsoDate(value.from),
        to: toIsoDate(value.to),
        granularity: value.granularity === 'DAY' ? null : value.granularity,
        page: null,
      },
      true,
    );
  }

  protected onDimensionChange(id: string | undefined): void {
    this.updateUrl({ dimensionId: id ?? null, page: null }, true);
  }

  protected onScopeChange(slug: string | undefined): void {
    this.updateUrl({ scopeId: slug ?? null, dimensionId: null }, true);
  }

  protected onReportChange(id: string): void {
    this.updateUrl(
      {
        report: id === this.sources[0]?.id ? null : id,
        dimensionId: null,
        scopeId: null,
        page: null,
        size: null,
        sort: null,
        customerId: null,
      },
      true,
    );
  }

  protected onDrillDown(typeSlug: string): void {
    this.updateUrl({ report: 'equipment-units', scopeId: typeSlug, dimensionId: null }, false);
  }

  protected onPageChange(event: PageEvent): void {
    this.updateUrl(
      {
        page: event.pageIndex === 0 ? null : event.pageIndex,
        size: event.pageSize === CUSTOMER_SPEND_PAGE_SIZE ? null : event.pageSize,
      },
      false,
    );
  }

  protected onSortChange(sort: CustomerSpendSort): void {
    this.updateUrl({ sort: `${sort.field},${sort.direction}`, page: null }, true);
  }

  protected onCustomerSelect(id: string | undefined): void {
    this.updateUrl({ customerId: id ?? null }, false);
  }

  protected onRefresh(): void {
    this.revenuePanel()?.reload();
    this.customerPanel()?.reload();
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
