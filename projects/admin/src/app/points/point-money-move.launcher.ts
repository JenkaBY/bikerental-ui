import { Injectable, Injector, inject, LOCALE_ID } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, tap } from 'rxjs';
import { formatFixedMoney, NotificationService, pointCollectedMessage } from '@bikerental/shared';
import { PointMoneyMoveDialogComponent } from './point-money-move-dialog.component';
import type { PointMoneyMoveData, PointMoneyMoveResult } from './point-money-move.model';

const DIALOG_WIDTH = '480px';

@Injectable({ providedIn: 'root' })
export class PointMoneyMoveLauncher {
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly locale = inject(LOCALE_ID);

  open(injector: Injector, data: PointMoneyMoveData): Observable<PointMoneyMoveResult | undefined> {
    return this.dialog
      .open<PointMoneyMoveDialogComponent, PointMoneyMoveData, PointMoneyMoveResult>(
        PointMoneyMoveDialogComponent,
        { data, injector, width: DIALOG_WIDTH },
      )
      .afterClosed()
      .pipe(
        tap((result) => {
          if (result?.outcome === 'done') {
            this.notifications.success(
              pointCollectedMessage(formatFixedMoney(result.amount, this.locale)),
            );
          }
        }),
      );
  }
}
