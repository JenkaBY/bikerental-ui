import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-equipment-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-block px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-700 whitespace-nowrap',
  },
  template: ` {{ uid() || 'NA' }} - {{ name() }} `,
})
export class EquipmentBadgeComponent {
  readonly uid = input<string>();
  readonly name = input<string>('');
}
