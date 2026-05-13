# Task 007: Wire `TopUpDialogComponent` into `RentalStep3Component`

> **Applied Skill:** `angular-component` — Smart orchestrator wiring. Import `MatDialog` and `TopUpDialogComponent`. Inject `MatDialog`. Fill in the `onTopUpRequested` TODO method body to open the shared dialog with `disableClose: true` and call `store.refreshCustomerBalance()` on `true` result.

> **⚠️ Prerequisite:** Requires **task-001** and **task-002** to be completed first.

## 1. Objective

Activate the `onTopUpRequested` handler in `RentalStep3Component` (Step 3 — Confirmation). When the operator taps "Top Up Balance" from the insufficient-balance warning, the shared `TopUpDialogComponent` is opened. On a `true` result, the store refreshes the balance so the "Start Rental" button can become enabled.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step3/rental-step3.component.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

### Change 1 — Add `MatDialog` to Angular Material imports

**Old import line:**

```typescript
import { MatSnackBar } from '@angular/material/snack-bar';
```

**New import lines (replace with):**

```typescript
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
```

### Change 2 — Add `TopUpDialogComponent` to the `@bikerental/shared` import

**Old import line:**

```typescript
import { Labels, RentalStore } from '@bikerental/shared';
```

**New import line:**

```typescript
import { Labels, RentalStore, TopUpDialogComponent } from '@bikerental/shared';
```

### Change 3 — Add `MatDialog` injection to the component class

* **Location:** Inside the `RentalStep3Component` class body, after the existing `private readonly snackBar = inject(MatSnackBar);` line.

**Old injections block:**

```typescript
  private readonly
router = inject(Router);
private readonly
snackBar = inject(MatSnackBar);
private readonly
destroyRef = inject(DestroyRef);
```

**New injections block:**

```typescript
  private readonly
router = inject(Router);
private readonly
dialog = inject(MatDialog);
private readonly
snackBar = inject(MatSnackBar);
private readonly
destroyRef = inject(DestroyRef);
```

### Change 4 — Implement `onTopUpRequested`

**Old method body:**

```typescript
  protected
onTopUpRequested()
:
void {
  // TODO (FR-07): Open TopUpDialogComponent once it is available in @bikerental/shared.
}
```

**New method body:**

```typescript
  protected
onTopUpRequested()
:
void {
  const customerId = this.store.customer()?.id;
  if(!
customerId
)
return;

this.dialog
  .open(TopUpDialogComponent, { data: { customerId }, disableClose: true })
  .afterClosed()
  .pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe((result) => {
    if (result === true) this.store.refreshCustomerBalance();
  });
}
```

## 4. Validation Steps

skip
