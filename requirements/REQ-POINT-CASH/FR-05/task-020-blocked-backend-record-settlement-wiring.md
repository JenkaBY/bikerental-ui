# Task 020: Enable "Record settlement" on the Cash tab and add the success toast

> **Applied Skill:** `angular-component`, `angular-signals` (existing `settlement` availability computed), AGENTS.md i18n Rules (new message function; extraction and Russian target happen in task 021), AGENTS.md "API Error Handling" (success toast only; errors stay in the dialog).

## 1. Objective

Replace the interim `onSettle` of `PointCashTabComponent` (it currently only shows `Labels.PointActionNotAvailableYet`), and make `PointMoneyMoveLauncher` show "Settlement recorded: X" for `operation === 'SETTLEMENT'`.

Requires tasks 013, 014, 019.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/point-money-messages.ts` - **Action:** Modify Existing File
* **File Path:** `projects/admin/src/app/points/point-money-move.launcher.ts` - **Action:** Modify Existing File
* **File Path:** `projects/admin/src/app/points/point-cash-tab.component.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**File 1 - append after `pointCollectedMessage` in `point-money-messages.ts`:**

```typescript
export function pointSettlementRecordedMessage(amount: string): string {
  return $localize`Settlement recorded: ${amount}:amount:`;
}
```

(The file is already re-exported from `@bikerental/shared` via `public-api.ts`.)

**File 2 - launcher.** Replace line 4 with:

```typescript
import {
  formatFixedMoney,
  NotificationService,
  pointCollectedMessage,
  pointSettlementRecordedMessage,
} from '@bikerental/shared';
```

Replace the `tap(...)` argument inside `.pipe(` with:

```typescript
        tap((result) => {
          if (result?.outcome !== 'done') return;
          const amount = formatFixedMoney(result.amount, this.locale);
          this.notifications.success(
            result.operation === 'SETTLEMENT'
              ? pointSettlementRecordedMessage(amount)
              : pointCollectedMessage(amount),
          );
        }),
```

**File 3 - `point-cash-tab.component.ts`.** Replace the interim handler

```typescript
  protected onSettle(): void {
    this.notifications.info(Labels.PointActionNotAvailableYet);
  }
```

with:

```typescript
  protected onSettle(): void {
    const point = this.points.selected();
    const available = this.positions.cardTerminal();
    if (!point || !available) return;
    this.moves
      .open(this.injector, {
        operation: 'SETTLEMENT',
        pointSlug: point.slug,
        pointName: point.name,
        available,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => this.onMoveClosed(result));
  }
```

`Labels` (template `labels`) and `notifications` (used by `applyOutcome`) stay imported. `onMoveClosed` already patches `POINT_MOVE_POSITIONS[result.operation]` (CARD_TERMINAL for settlement) and runs `applyOutcome`. Do NOT touch `PointTerminalCardComponent`; `(settle)="onSettle()"` is already bound.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/shared/constant/point-money-messages.ts projects/admin/src/app/points/point-money-move.launcher.ts projects/admin/src/app/points/point-cash-tab.component.ts
npx ng build admin --configuration development
npx ng lint admin
```
