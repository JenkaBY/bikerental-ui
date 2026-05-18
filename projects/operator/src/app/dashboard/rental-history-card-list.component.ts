import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { RentalListItem } from '@bikerental/shared';

@Component({
  selector: 'app-rental-history-card-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class RentalHistoryCardListComponent {
  readonly rentals = input<RentalListItem[]>([]);
  readonly isLoading = input(false);
}
