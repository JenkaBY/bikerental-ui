# Task 013: Reset Password Flow

> **Applied Skills:** `angular-signals` (reusing the same per-row busy signal from task-012's activate/deactivate flow), `angular-component` (`inject()`, `MatDialog`), `error-handling` (`ApiErrorParser.parse` → `ErrorMessageResolver.resolve` → `NotificationService.error` on failure, no reveal dialog opened on error) — wires the reset-password row action rendered by `UsersListComponent` (task-009), reusing `ConfirmDialogComponent` (task-008) for the confirmation step and `TemporaryPasswordDialogComponent` (task-007) for the one-time reveal on success.

## 1. Objective

Replace `UsersListComponent.onResetPassword`'s stub body with the real implementation: open `ConfirmDialogComponent` with reset-password-specific copy; only on explicit confirmation call `ManagedUserStore.resetPassword(id)`; on success, open `TemporaryPasswordDialogComponent` with the returned temporary password; on failure, surface the error via the standard toolkit with no reveal dialog. Reuse the same per-row `toggling` busy signal introduced in task-012 so the reset-password button also shows a busy/disabled state while its own request is in flight.

## 2. Files to Modify

* **File Path:** `projects/admin/src/app/users/users-list.component.ts`
* **Action:** Modify Existing File (created in task-009; modified in task-011 and task-012)

## 3. Code Implementation

### 3a. Add the `TemporaryPasswordDialogComponent` import

* **Location:** Alongside the existing `@bikerental/shared` import block (already containing `ConfirmDialogComponent`, `suppressErrorNotification`, etc. from task-012).

**Old code:**

```typescript
import {
  ApiErrorParser,
  ConfirmDialogComponent,
  ErrorMessageResolver,
  Labels,
  ManagedUserStore,
  NotificationService,
  ROLE_LABELS,
  suppressErrorNotification,
  UserStore,
} from '@bikerental/shared';
import type { ConfirmDialogData } from '@bikerental/shared';
```

**New code:**

```typescript
import {
  ApiErrorParser,
  ConfirmDialogComponent,
  ErrorMessageResolver,
  Labels,
  ManagedUserStore,
  NotificationService,
  ROLE_LABELS,
  suppressErrorNotification,
  TemporaryPasswordDialogComponent,
  UserStore,
} from '@bikerental/shared';
import type { ConfirmDialogData, TemporaryPasswordDialogData } from '@bikerental/shared';
```

### 3b. Update the reset-password button to reflect per-row busy state

* **Location:** Inside the `actions` column's second `<button>` (the reset-password action), in the template.

**Old code:**

```html
                <button
                  mat-icon-button
                  [disabled]="isOwnAccount(row)"
                  [matTooltip]="Labels.UserResetPasswordTooltip"
                  (click)="onResetPassword(row)"
                >
                  <mat-icon>lock_reset</mat-icon>
                </button>
```

**New code:**

```html
                <button
                  mat-icon-button
                  [disabled]="isOwnAccount(row) || toggling()[row.id]"
                  [matTooltip]="Labels.UserResetPasswordTooltip"
                  (click)="onResetPassword(row)"
                >
                  <mat-icon>lock_reset</mat-icon>
                </button>
```

### 3c. Replace the `onResetPassword` stub

* **Location:** Class body — replace the stub method (leave `toggling`, `activate`, `deactivate` from task-012 untouched).

**Old code (stub):**

```typescript
  onResetPassword(_row: ManagedUser): void {
    // Wired up in task-013 (FR-06 Reset Password Flow).
  }
```

**New code:**

```typescript
  onResetPassword(row: ManagedUser): void {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data: {
          title: Labels.ResetPasswordDialogTitle,
          message: Labels.ResetPasswordDialogMessage,
          confirmLabel: Labels.ResetPasswordConfirmButton,
          cancelLabel: Labels.Cancel,
          danger: true,
        },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.resetPassword(row.id);
        }
      });
  }

  private resetPassword(id: string): void {
    this.toggling.update((s) => ({ ...s, [id]: true }));
    this.store
      .resetPassword(id, { context: suppressErrorNotification() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.toggling.update((s) => ({ ...s, [id]: false }));
          this.dialog.open<TemporaryPasswordDialogComponent, TemporaryPasswordDialogData, void>(
            TemporaryPasswordDialogComponent,
            { data: { temporaryPassword: result.temporaryPassword }, disableClose: true },
          );
        },
        error: (err) => {
          this.toggling.update((s) => ({ ...s, [id]: false }));
          const apiError = ApiErrorParser.parse(err);
          this.notifications.error(this.resolver.resolve(apiError));
        },
      });
  }
```

**Note:** no reveal dialog opens on the error path, per FR-06's Scenario 4 ("an error notification is shown ... and no reveal dialog appears"). No explicit list reload is triggered after a successful reset — the store's `_users` signal already reflects `mustChangePassword: true` for the affected row (task-004's `resetPassword` patches it in-place), and this FR's scope does not require any visible column to change as a result (per FR-06 Context & Business Rules: "the users list does not need to change its visible columns as a result of this action").

## 4. Validation Steps

```bash
npx tsc --noEmit -p projects/admin/tsconfig.app.json
npm run build -- --project admin
npm run lint
```
