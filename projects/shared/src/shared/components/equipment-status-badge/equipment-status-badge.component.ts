import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { mapEquipmentItemStatus } from '../../rental-status.meta';

const COLOR_CLASSES: Record<string, string> = {
  primary: 'bg-blue-100 text-blue-700',
  warn: 'bg-amber-100 text-amber-700',
  accent: 'bg-purple-100 text-purple-700',
  default: 'bg-gray-100 text-gray-600',
};

@Component({
  selector: 'app-equipment-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (meta(); as m) {
      <span [class]="classes()">{{ m.label }}</span>
    }
  `,
})
export class EquipmentStatusBadgeComponent {
  readonly statusSlug = input<string | undefined>();

  protected readonly meta = computed(() => {
    const slug = this.statusSlug();
    return slug ? mapEquipmentItemStatus(slug) : null;
  });

  protected readonly classes = computed(() => {
    const color = this.meta()?.color ?? 'default';
    const colorClass = COLOR_CLASSES[color] ?? COLOR_CLASSES['default'];
    return `text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${colorClass}`;
  });
}
