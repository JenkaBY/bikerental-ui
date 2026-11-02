# Task 011: Admin cash tab opens the closure dialog

> **Applied Skill:** `angular-component` (smart component owns DI and orchestration), `angular-signals`. Reuses the existing `applyOutcome` + `PointMoneyRefreshFacade` revision effect of `PointCashTabComponent` (the effect already calls `shiftStore.refresh()` and `movements.reload()` whenever `notifyChanged()` bumps the revision). Requires task 010.

## 1. Objective

Replace the interim `onCloseShift` (info "This action is not available yet") with opening `ShiftClosureDialogComponent` through `ShiftClosureLauncher`. On `done` or `shiftChanged` call the existing `applyOutcome(outcome)`, which runs `facade.notifyChanged()`; the revision effect then refreshes the running shift and the shift movements, and positions / header pill refresh through the facade. `onSettle` stays interim (out of scope).

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/point-cash-tab.component.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**Step 1 - imports.** Below the line `import { PointMoneyMoveLauncher } from './point-money-move.launcher';` add (keep the import block alphabetical enough for prettier; order is not lint-enforced):

```typescript
import { ShiftClosureLauncher } from './shift-closure.launcher';
```

**Step 2 - field.** Directly below the line `private readonly moves = inject(PointMoneyMoveLauncher);` add:

```typescript
  private readonly closures = inject(ShiftClosureLauncher);
```

**Step 3 - method.** Replace the whole existing method

```typescript
  protected onCloseShift(): void {
    this.notifications.info(Labels.PointActionNotAvailableYet);
  }
```

with:

```typescript
  protected onCloseShift(): void {
    const point = this.points.selected();
    const shift = this.shiftStore.shift();
    if (!point || !shift) return;
    this.closures
      .open({ pointSlug: point.slug, pointName: point.name, shift })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => this.applyOutcome(result?.outcome));
  }
```

Do NOT touch `onSettle` (it keeps `this.notifications.info(Labels.PointActionNotAvailableYet)`; `notifications` and `Labels` stay imported and used).

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/admin/src/app/points/point-cash-tab.component.ts
npx ng build admin --configuration development
npx ng lint admin
```
