import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Labels } from '@bikerental/shared';
import type { RentalPriceMode } from '@bikerental/shared';

@Component({
  selector: 'app-rental-price-mode-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (mode()) {
      @case ('DISCOUNT') {
        <span
          class="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700"
        >
          &minus;{{ discountPercent() }}%
        </span>
      }
      @case ('FIXED') {
        <span
          class="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700"
        >
          {{ Labels.Fixed }}
        </span>
      }
    }
  `,
})
export class RentalPriceModeBadgeComponent {
  readonly mode = input.required<RentalPriceMode>();
  readonly discountPercent = input<number | null>(null);

  protected readonly Labels = Labels;
}
