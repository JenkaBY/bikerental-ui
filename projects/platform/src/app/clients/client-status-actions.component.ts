import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { clientStatusTransitions } from '@bikerental/shared';
import type { ClientStatus, ClientStatusTransition } from '@bikerental/shared';
import { clientStatusActionIcon, clientStatusActionLabel } from './client-status-labels';

@Component({
  selector: 'app-client-status-actions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  template: `
    @for (action of actions(); track action.transition.target) {
      <button
        mat-stroked-button
        [color]="action.transition.target === 'CLOSED' ? 'warn' : undefined"
        [disabled]="disabled()"
        (click)="transition.emit(action.transition)"
      >
        <mat-icon>{{ action.icon }}</mat-icon>
        <span>{{ action.label }}</span>
      </button>
    }
  `,
  host: { class: 'contents' },
})
export class ClientStatusActionsComponent {
  readonly status = input.required<ClientStatus>();
  readonly disabled = input(false);
  readonly transition = output<ClientStatusTransition>();

  protected readonly actions = computed(() => {
    const from = this.status();
    return clientStatusTransitions(from).map((transition) => ({
      transition,
      label: clientStatusActionLabel(transition.target, from),
      icon: clientStatusActionIcon(transition.target, from),
    }));
  });
}
