import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { mapRentalStatus } from '../../rental-status.meta';

@Component({
  selector: 'app-rental-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (meta(); as m) {
      <span
        [class]="'text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ' + m.badgeClasses"
      >
        {{ m.label }}
      </span>
    }
  `,
})
export class RentalStatusBadgeComponent {
  readonly status = input<string | undefined>();

  protected readonly meta = computed(() => {
    const status = this.status();
    return status ? mapRentalStatus(status) : null;
  });
}
