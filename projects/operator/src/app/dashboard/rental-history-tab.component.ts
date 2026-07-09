import { DatePipe } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { Labels, RentalFilter, RentalListStore } from '@bikerental/shared';
import { RentalHistoryCardListComponent } from './rental-history-card-list.component';
import { REFRESHABLE_TAB, RefreshableTab } from './refreshable-tab';

const VALID_FILTERS = new Set(['ALL', 'COMPLETED', 'DEBT', 'CANCELLED', 'DRAFT']);

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: Labels.All },
  { value: 'COMPLETED', label: Labels.RentalStatusCompleted },
  { value: 'DEBT', label: Labels.RentalStatusDebt },
  { value: 'CANCELLED', label: Labels.RentalStatusCancelled },
  { value: 'DRAFT', label: Labels.FilterDrafts },
];

@Component({
  selector: 'app-rental-history-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatButtonToggleModule, RentalHistoryCardListComponent],
  providers: [{ provide: REFRESHABLE_TAB, useExisting: RentalHistoryTabComponent }],
  template: `
    <div class="overflow-x-auto -mx-4">
      <div class="px-4 py-2 w-max">
        <mat-button-toggle-group
          [value]="activeFilter()"
          (change)="onFilterChange($event.value)"
          hideSingleSelectionIndicator
        >
          @for (f of filterOptions; track f.value) {
            <mat-button-toggle [value]="f.value">{{ f.label }}</mat-button-toggle>
          }
        </mat-button-toggle-group>
      </div>
    </div>
    <div class="px-4 py-2 text-sm text-slate-500">
      @if (activeFilter() !== 'DRAFT') {
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
      if (currentFilter === 'DRAFT') {
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
