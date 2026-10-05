import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Labels } from '../../constant/labels';

@Component({
  selector: 'app-equipment-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-block px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-700',
    '[class.whitespace-nowrap]': '!returnPointName()',
  },
  template: `
    {{ uid() || 'NA' }} - {{ name() }}
    @if (returnPointName(); as pointName) {
      <span class="text-slate-500">&middot; {{ Labels.ReturnPoint }} {{ pointName }}</span>
    }
  `,
})
export class EquipmentBadgeComponent {
  readonly uid = input<string>();
  readonly name = input<string>('');
  readonly returnPointName = input<string | null>(null);
  protected readonly Labels = Labels;
}
