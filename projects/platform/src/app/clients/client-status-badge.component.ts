import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Labels } from '@bikerental/shared';
import type { ClientStatus } from '@bikerental/shared';

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  DRAFT: Labels.ClientStatusDraft,
  ACTIVE: Labels.ClientStatusActive,
  SUSPENDED: Labels.ClientStatusSuspended,
  CLOSED: Labels.ClientStatusClosed,
};

const STATUS_CLASSES: Record<ClientStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  ACTIVE: 'bg-green-100 text-green-800',
  SUSPENDED: 'bg-amber-100 text-amber-800',
  CLOSED: 'bg-red-100 text-red-800',
};

@Component({
  selector: 'app-client-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="px-2 py-1 rounded text-xs font-medium" [class]="classes()">{{
    label()
  }}</span>`,
})
export class ClientStatusBadgeComponent {
  readonly status = input.required<ClientStatus>();

  protected readonly label = computed(() => CLIENT_STATUS_LABELS[this.status()]);
  protected readonly classes = computed(() => STATUS_CLASSES[this.status()]);
}
