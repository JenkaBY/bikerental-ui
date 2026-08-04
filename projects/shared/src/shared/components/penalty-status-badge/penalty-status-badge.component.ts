import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { PenaltyStatus } from '../../../core/models/damage-report.model';
import { mapPenaltyStatus } from '../../penalty-status.meta';

@Component({
  selector: 'app-penalty-status-badge',
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
export class PenaltyStatusBadgeComponent {
  readonly status = input<PenaltyStatus | undefined>();

  protected readonly meta = computed(() => {
    const status = this.status();
    return status ? mapPenaltyStatus(status) : null;
  });
}
