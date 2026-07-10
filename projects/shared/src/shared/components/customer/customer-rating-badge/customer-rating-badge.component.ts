import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-customer-rating-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    @if (rating(); as r) {
      <span class="shrink-0 inline-flex items-center gap-0.5 text-sm font-medium text-amber-600">
        <mat-icon style="font-size:18px;width:18px;height:18px" aria-hidden="true">star</mat-icon
        >{{ r }}
      </span>
    }
  `,
})
export class CustomerRatingBadgeComponent {
  readonly rating = input<number | null>(null);
}
