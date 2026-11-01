# Task 014: Wire "Collect cash" in PointCashTabComponent

> **Applied Skill:** `angular-component` - smart tab owns orchestration. `angular-signals` - reads the existing `cashAmount` computed. `angular-di` - `inject(Injector)` is handed to the launcher. AGENTS.md Admin CRUD Pattern - dialog result drives the refresh (`applyOutcome`). `error-handling` - nothing new here, the dialog owns error copy.

## 1. Objective

Replace **only** the interim `onCollect` handler of the FR-03 tab. `onCloseShift` stays interim (FR-08) and `onSettle` stays interim while the settlement endpoint is blocked (task 020). The protected `applyOutcome(outcome)` from FR-03 now has its first caller.

Behaviour:

* available = `cashAmount()` (CASH position, falling back to the running shift's expected cash); do nothing when the point or the amount is unknown;
* open the dialog through the launcher with `injector: this.injector`;
* `done` with `newPosition` -> `positions.applyPosition(POINT_MOVE_POSITIONS[result.operation], result.newPosition)` (the header and card update immediately); the "Collected: X" toast is shown by the launcher;
* every non-cancelled result -> `applyOutcome(result.outcome)` (`done` refreshes positions / shift / list through the facade; `statusChanged` also reloads the point so the buttons follow the new status).

Requires tasks 010, 013.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/point-cash-tab.component.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**Step 1 - imports.**

* In the `@angular/core` import list add `Injector,` (between `inject,` and `untracked,`).
* After the last local import (`import { PointTerminalCardComponent } from './point-terminal-card.component';`) add:

```typescript
import { PointMoneyMoveLauncher } from './point-money-move.launcher';
import { POINT_MOVE_POSITIONS } from './point-money-move.meta';
import type { PointMoneyMoveResult } from './point-money-move.model';
```

**Step 2 - injected members.** Directly below `private readonly destroyRef = inject(DestroyRef);` add:

```typescript
  private readonly moves = inject(PointMoneyMoveLauncher);
  private readonly injector = inject(Injector);
```

**Step 3 - handler.** Replace this method:

```typescript
  protected onCollect(): void {
    this.notifications.info(Labels.PointActionNotAvailableYet);
  }
```

with:

```typescript
  protected onCollect(): void {
    const point = this.points.selected();
    const available = this.cashAmount();
    if (!point || !available) return;
    this.moves
      .open(this.injector, {
        operation: 'COLLECTION',
        pointSlug: point.slug,
        pointName: point.name,
        available,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => this.onMoveClosed(result));
  }

  private onMoveClosed(result: PointMoneyMoveResult | undefined): void {
    if (!result) return;
    if (result.outcome === 'done' && result.newPosition) {
      this.positions.applyPosition(POINT_MOVE_POSITIONS[result.operation], result.newPosition);
    }
    this.applyOutcome(result.outcome);
  }
```

(`onCloseShift`, `onSettle` and `applyOutcome` stay exactly as they are.)

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/admin/src/app/points/point-cash-tab.component.ts
npx ng build admin --configuration development
npx ng lint admin
```
