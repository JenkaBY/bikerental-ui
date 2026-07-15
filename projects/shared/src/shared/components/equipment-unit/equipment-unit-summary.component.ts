import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Labels } from '../../constant/labels';
import { normalizeToHuman } from '../../pipes/duration-formatter';
import { formatSmartTimestamp } from '../../pipes/timestamp-formatter';

export interface EquipmentUnitIdentity {
  uid: string;
  name: string;
  statusSlug?: string;
  plannedDurationMinutes: number | null;
  startedAt?: Date | null;
  actualReturnedAt?: Date | null;
  actualDurationMinutes?: number | null;
  currentDurationMinutes?: number | null;
}

@Component({
  selector: 'app-equipment-unit-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex-1 min-w-0 block' },
  template: `
    <div class="min-w-0 leading-tight">
      <div class="flex items-center gap-1.5 min-w-0">
        <span class="text-xs font-medium text-slate-500 truncate">{{ unit().uid }}</span>
        <span class="text-sm font-medium text-slate-800 truncate">{{ unit().name }}</span>
      </div>
      <span class="text-xs text-slate-500 leading-tight">{{ durationText() }}</span>
    </div>
  `,
})
export class EquipmentUnitSummaryComponent {
  readonly unit = input.required<EquipmentUnitIdentity>();

  protected readonly durationText = computed(() => {
    const u = this.unit();
    const planned = normalizeToHuman(u.plannedDurationMinutes ?? undefined);

    if (!u.startedAt) {
      return `${planned} ${Labels.PlannedDurationLabel}`;
    }

    const elapsed = normalizeToHuman(
      u.actualDurationMinutes ?? u.currentDurationMinutes ?? undefined,
    );
    const startPart = formatSmartTimestamp(u.startedAt);
    const endPart = u.actualReturnedAt ? formatSmartTimestamp(u.actualReturnedAt) : '...';

    return `${startPart} → ${endPart} · ${elapsed} (${planned})`;
  });
}
