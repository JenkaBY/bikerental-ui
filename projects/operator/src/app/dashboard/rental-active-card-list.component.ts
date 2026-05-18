import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Labels } from '@bikerental/shared';
import type { RentalListItem } from '@bikerental/shared';
import { RentalCardComponent } from './rental-card.component';

@Component({
  selector: 'app-rental-active-card-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule, RentalCardComponent],
  template: `
    @if (isLoading()) {
      <div class="flex justify-center py-8">
        <mat-spinner diameter="40" />
      </div>
    } @else if (items().length === 0) {
      <div class="px-4 py-8 text-center text-slate-500 text-sm">
        {{ Labels.NoActiveRentals }}
      </div>
    } @else {
      <div class="flex flex-col gap-2 px-4 py-2">
        @for (rental of items(); track rental.id) {
          <app-rental-card [item]="rental" variant="active" />
        }
      </div>
    }
  `,
})
export class RentalActiveCardListComponent {
  readonly items = input<RentalListItem[]>([]);
  readonly isLoading = input(false);

  protected readonly Labels = Labels;
}
