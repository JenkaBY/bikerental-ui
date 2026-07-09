import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Labels, RentalListStore } from '@bikerental/shared';
import { RentalActiveCardListComponent } from './rental-active-card-list.component';
import { REFRESHABLE_TAB, RefreshableTab } from './refreshable-tab';

@Component({
  selector: 'app-rental-active-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RentalActiveCardListComponent],
  providers: [{ provide: REFRESHABLE_TAB, useExisting: RentalActiveTabComponent }],
  template: `
    <div class="px-4 py-2 text-sm text-slate-500">
      {{ totalActive() }}&nbsp;{{ Labels.ActiveRentals }}&nbsp;&middot;&nbsp;{{
        Labels.SortedByReturnTime
      }}
    </div>

    <app-rental-active-card-list
      [items]="sortedActiveRentals()"
      [isLoading]="store.isLoadingActive()"
    />
  `,
})
export class RentalActiveTabComponent implements RefreshableTab {
  protected readonly store = inject(RentalListStore);

  protected readonly Labels = Labels;

  readonly isLoading = this.store.isLoadingActive;

  readonly totalActive = computed(() => this.sortedActiveRentals().length);

  refresh(): void {
    this.store.loadActive();
  }

  readonly sortedActiveRentals = computed(() =>
    [...this.store.activeRentals()].sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;

      const dateA = a.expectedReturnAt;
      const dateB = b.expectedReturnAt;

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;

      const timeA = dateA instanceof Date ? dateA.getTime() : new Date(dateA).getTime();
      const timeB = dateB instanceof Date ? dateB.getTime() : new Date(dateB).getTime();

      return timeA - timeB;
    }),
  );
}
