import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Labels,
  RentalFilter,
  RentalListStore,
  SegmentedTabsComponent,
  SegmentTab,
} from '@bikerental/shared';
import { RentalHistoryCardListComponent } from './rental-history-card-list.component';
import { REFRESHABLE_TAB, RefreshableTab } from './refreshable-tab';

const VALID_FILTERS = new Set(['ALL', 'COMPLETED', 'DEBT', 'CANCELLED', 'DRAFT']);

const FILTER_OPTIONS: SegmentTab[] = [
  { id: 'ALL', label: Labels.All },
  { id: 'COMPLETED', label: Labels.RentalStatusCompleted },
  { id: 'CANCELLED', label: Labels.RentalStatusCancelled },
  { id: 'DEBT', label: Labels.RentalStatusDebt },
  { id: 'DRAFT', label: Labels.FilterDrafts },
];

@Component({
  selector: 'app-rental-history-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RentalHistoryCardListComponent, SegmentedTabsComponent],
  providers: [{ provide: REFRESHABLE_TAB, useExisting: RentalHistoryTabComponent }],
  template: `
    <app-segmented-tabs
      [tabs]="filterOptions"
      [activeId]="activeFilter()"
      (tabSelect)="onFilterChange($event)"
    />
    <div class="px-4 py-2 text-sm text-slate-500">
      @if (activeFilter() !== 'DRAFT' && activeFilter() !== 'DEBT') {
        {{ today | date: 'd MMMM yyyy' }}&nbsp;&middot;&nbsp;
      }
      {{ totalRecords() }}&nbsp;{{ Labels.Records }}
    </div>
    <app-rental-history-card-list />
  `,
})
export class RentalHistoryTabComponent implements RefreshableTab {
  protected readonly store = inject(RentalListStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isLoading = this.store.isLoadingHistory;

  readonly filter = toSignal(
    this.route.queryParams.pipe(map((params) => params['filter'] as RentalFilter['filter'])),
  );

  readonly activeFilter = computed(() => {
    const filter = this.filter()?.toUpperCase();
    return VALID_FILTERS.has(filter ?? '') ? filter : 'ALL';
  });

  readonly totalRecords = computed(() => this.store.historyRentals().length);

  protected readonly filterOptions = FILTER_OPTIONS;
  protected readonly Labels = Labels;
  protected readonly today = new Date();

  constructor() {
    effect(() => {
      const currentFilter = this.activeFilter();
      if (currentFilter === 'DRAFT' || currentFilter === 'DEBT') {
        this.store.loadByFilter(currentFilter as RentalFilter['filter']);
      } else {
        this.store.loadHistory(this.today, this.today, currentFilter as RentalFilter['filter']);
      }
    });
  }

  refresh(): void {
    this.store.reloadHistory();
  }

  protected onFilterChange(filterValue: string): void {
    void this.router.navigate([], {
      queryParams: { filter: filterValue },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
