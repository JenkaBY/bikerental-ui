import { Labels } from '@bikerental/shared';
import type { ClientStatus, ClientStatusTarget } from '@bikerental/shared';

export function clientStatusActionLabel(target: ClientStatusTarget, from: ClientStatus): string {
  if (target === 'SUSPENDED') return Labels.ClientSuspendAction;
  if (target === 'CLOSED') return Labels.ClientCloseAction;
  return from === 'SUSPENDED' ? Labels.ClientResumeAction : Labels.ClientActivateAction;
}

export function clientStatusActionIcon(target: ClientStatusTarget, from: ClientStatus): string {
  if (target === 'SUSPENDED') return 'pause_circle';
  if (target === 'CLOSED') return 'block';
  return from === 'SUSPENDED' ? 'play_circle' : 'check_circle';
}
