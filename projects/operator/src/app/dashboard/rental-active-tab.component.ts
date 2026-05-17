import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { RentalListItem } from '@bikerental/shared';
import { Labels } from '@bikerental/shared';

@Component({
  selector: 'app-rental-active-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-4 py-2 text-sm text-slate-500">
      {{ activeRentals().length }}&nbsp;{{ Labels.RentalStatusActive }}&nbsp;·&nbsp;{{
        Labels.SortedByReturnTime
      }}
    </div>
  `,
})
export class RentalActiveTabComponent {
  readonly activeRentals = input<RentalListItem[]>([]);
  readonly isLoadingActive = input(false);

  protected readonly Labels = Labels;
}
