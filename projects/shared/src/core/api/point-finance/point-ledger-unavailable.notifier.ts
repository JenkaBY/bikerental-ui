import { inject, Injectable } from '@angular/core';
import { NotificationService } from '../../errors/notification.service';
import { Labels } from '../../../shared/constant/labels';
import { PointLedgerUnavailableError } from './point-ledger-unavailable.error';

const REPEAT_WINDOW_MS = 4000;

@Injectable({ providedIn: 'root' })
export class PointLedgerUnavailableNotifier {
  private readonly notifications = inject(NotificationService);
  private lastWarnedAt = 0;

  notify(err: unknown): void {
    if (!(err instanceof PointLedgerUnavailableError)) return;
    const now = Date.now();
    if (now - this.lastWarnedAt < REPEAT_WINDOW_MS) return;
    this.lastWarnedAt = now;
    this.notifications.warn(Labels.PointMoneyUnavailable);
  }
}
