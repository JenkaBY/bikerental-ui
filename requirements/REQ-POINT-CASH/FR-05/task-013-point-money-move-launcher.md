# Task 013: PointMoneyMoveLauncher (opens the dialog, shows the success toast)

> **Applied Skill:** `angular-di` - root service, the caller passes its own `Injector` so the dialog resolves the host-provided `PointPositionsStore` (dialogs otherwise get only root providers). `angular-component` - keeps `PointCashTabComponent` (already ~230 lines) from growing further. AGENTS.md API Error Handling - success toasts via `NotificationService.success`.

## 1. Objective

One entry point `open(injector, data)` returning `Observable<PointMoneyMoveResult | undefined>` that is the dialog's `afterClosed()` plus, on `outcome: 'done'`, the success toast "Collected: X" (X = `formatFixedMoney(amount, locale)`). Settlement success copy is added by blocked task 020.

Requires tasks 008, 010, 012.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/point-money-move.launcher.ts` - **Action:** Create New File

## 3. Code Implementation

**Whole content:**

```typescript
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
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/admin/src/app/points/point-money-move.launcher.ts
npx ng build admin --configuration development
npx ng lint admin
```
