import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Money } from '@ui-models';
import { MoneyPipe } from '../../../pipes/money.pipe';

@Component({
  selector: 'app-customer-balance-pill',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MoneyPipe],
  template: `
    @if (available(); as amount) {
      <span
        class="shrink-0 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
        [class.bg-green-100]="sufficient()"
        [class.text-green-800]="sufficient()"
        [class.bg-red-100]="!sufficient()"
        [class.text-red-800]="!sufficient()"
      >
        {{ amount | money }}
      </span>
    }
  `,
})
export class CustomerBalancePillComponent {
  readonly available = input<Money | null>(null);
  readonly sufficient = input<boolean>(true);
}
