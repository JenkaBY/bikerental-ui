import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Labels, RentalListStore } from '@bikerental/shared';
import { RentalCardComponent } from './rental-card.component';

@Component({
  selector: 'app-rental-history-card-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule, RentalCardComponent],
  template: `
    @if (store.isLoadingHistory()) {
      <div class="flex justify-center py-8">
        <mat-spinner diameter="40" />
      </div>
    } @else if (isEmpty()) {
      <div class="px-4 py-8 text-center text-slate-500 text-sm">
        {{ Labels.NoHistoryRentals }}
      </div>
    } @else {
      <div class="flex flex-col gap-2 px-4 py-2">
        @for (rental of sortedHistoryRentals(); track rental.id) {
          <app-rental-card [item]="rental" variant="history" />
        }
      </div>
    }
  `,
})
export class RentalHistoryCardListComponent {
  protected readonly store = inject(RentalListStore);
  protected readonly isEmpty = computed(() => this.store.historyRentals().length === 0);
  protected readonly Labels = Labels;

  readonly sortedHistoryRentals = computed(() =>
    [...this.store.historyRentals()].sort((a, b) => {
      const timeA =
        a.startedAt instanceof Date ? a.startedAt.getTime() : new Date(a.startedAt).getTime();
      const timeB =
        b.startedAt instanceof Date ? b.startedAt.getTime() : new Date(b.startedAt).getTime();
      return timeB - timeA;
    }),
  );
}
