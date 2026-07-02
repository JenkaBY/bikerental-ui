# Task 012: Activate / Deactivate Flow

> **Applied Skills:** `angular-signals` (per-row busy signal keyed by user id, mirroring `TariffListComponent.toggling`'s `Record<id, boolean>` pattern), `angular-component` (`inject()`, `MatDialog`), `error-handling` (`ApiErrorParser.parse` → `ErrorMessageResolver.resolve` → `NotificationService.error` on failure, row state left unchanged) — wires the activate/deactivate toggle rendered per-row by `UsersListComponent` (task-009), branching on the row's current status: deactivating requires the `ConfirmDialogComponent` (task-008) confirmation, activating calls the generic update immediately with no confirmation.

## 1. Objective

Replace `UsersListComponent.onToggleStatus`'s stub body with the real implementation: for an `ACTIVE` row, open `ConfirmDialogComponent` with deactivate-specific copy and only call `ManagedUserStore.deactivate(id)` if confirmed; for a `DISABLED` row, call `ManagedUserStore.update(id, { status: 'ACTIVE' })` immediately with no confirmation. Track a per-row busy signal so the toggle shows a busy/disabled state and cannot be double-clicked mid-request. On failure, surface the error via the standard toolkit and leave the row's status unchanged.

## 2. Files to Modify

* **File Path:** `projects/admin/src/app/users/users-list.component.ts`
* **Action:** Modify Existing File (created in task-009, already modified in task-011)

## 3. Code Implementation

### 3a. Add new imports

* **Location:** Top of the file, alongside the existing `@bikerental/shared` import list.

**Old code:**

```typescript
import {
  ApiErrorParser,
  ErrorMessageResolver,
  Labels,
  ManagedUserStore,
  NotificationService,
  ROLE_LABELS,
  UserStore,
} from '@bikerental/shared';
```

**New code:**

```typescript
import { signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
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

**Note:** `signal` must be merged into the existing `@angular/core` import line (the file from task-009 already imports `ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit` from `@angular/core`) rather than added as a separate import statement — end result:

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
```

`MatDialog` is already imported in the file from task-009 (`this.dialog = inject(MatDialog)` depends on it) — do not add a duplicate `import { MatDialog } ...` line; only add the `ConfirmDialogComponent`, `suppressErrorNotification`, and `ConfirmDialogData` symbols to the existing `@bikerental/shared` import block.

### 3b. Update the row-actions column's toggle button to reflect per-row busy state

* **Location:** Inside the `actions` column's third `<button>` (the activate/deactivate toggle), in the template.

**Old code:**

```html
                <button
                  mat-icon-button
                  [disabled]="isOwnAccount(row)"
                  [matTooltip]="row.status === 'ACTIVE' ? Labels.UserDeactivateTooltip : Labels.UserActivateTooltip"
                  (click)="onToggleStatus(row)"
                >
                  <mat-icon>{{ row.status === 'ACTIVE' ? 'block' : 'check_circle' }}</mat-icon>
                </button>
```

**New code:**

```html
                <button
                  mat-icon-button
                  [disabled]="isOwnAccount(row) || toggling()[row.id]"
                  [matTooltip]="row.status === 'ACTIVE' ? Labels.UserDeactivateTooltip : Labels.UserActivateTooltip"
                  (click)="onToggleStatus(row)"
                >
                  <mat-icon>{{ row.status === 'ACTIVE' ? 'block' : 'check_circle' }}</mat-icon>
                </button>
```

### 3c. Add the `toggling` signal and replace the `onToggleStatus` stub

* **Location:** Class body — add the `toggling` signal declaration near `displayedColumns`, and replace the stub method.

**Old code (stub):**

```typescript
  onToggleStatus(_row: ManagedUser): void {
    // Wired up in task-012 (FR-05 Activate/Deactivate Flow).
  }
```

**New code:**

```typescript
  protected readonly toggling = signal<Record<string, boolean>>({});

  onToggleStatus(row: ManagedUser): void {
    if (row.status === 'ACTIVE') {
      this.dialog
        .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
          data: {
            title: Labels.DeactivateUserDialogTitle,
            message: Labels.DeactivateUserDialogMessage,
            confirmLabel: Labels.DeactivateUserConfirmButton,
            cancelLabel: Labels.Cancel,
            danger: true,
          },
        })
        .afterClosed()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((confirmed) => {
          if (confirmed) {
            this.deactivate(row.id);
          }
        });
      return;
    }

    this.activate(row.id);
  }

  private activate(id: string): void {
    this.toggling.update((s) => ({ ...s, [id]: true }));
    this.store
      .update(id, { status: 'ACTIVE' }, { context: suppressErrorNotification() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.toggling.update((s) => ({ ...s, [id]: false })),
        error: (err) => {
          this.toggling.update((s) => ({ ...s, [id]: false }));
          const apiError = ApiErrorParser.parse(err);
          this.notifications.error(this.resolver.resolve(apiError));
        },
      });
  }

  private deactivate(id: string): void {
    this.toggling.update((s) => ({ ...s, [id]: true }));
    this.store
      .deactivate(id, { context: suppressErrorNotification() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.toggling.update((s) => ({ ...s, [id]: false })),
        error: (err) => {
          this.toggling.update((s) => ({ ...s, [id]: false }));
          const apiError = ApiErrorParser.parse(err);
          this.notifications.error(this.resolver.resolve(apiError));
        },
      });
  }
```

**Note:** no explicit list reload is needed after `activate`/`deactivate` succeed — `ManagedUserStore.update`/`deactivate` (task-004) already patch the matching row in-place in the store's `_users` signal, and `UsersListComponent`'s table reads `store.users()` directly, so the status badge and toggle icon update reactively the instant the store signal changes.

## 4. Validation Steps

```bash
npx tsc --noEmit -p projects/admin/tsconfig.app.json
npm run build -- --project admin
```
