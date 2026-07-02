# Task 009: UsersListComponent — List View, Self-Lockout Gating, Route Repoint

> **Applied Skills:** `angular-component` (standalone smart component, `OnPush`, `inject()`, `MatTable` + signals, native `@if`/`@for`), `angular-signals` (`computed()` for the self-lockout predicate), `angular-routing` (lazy-loaded route repoint via `loadComponent`), `error-handling` (`ApiErrorParser.parse` → `ErrorMessageResolver.resolve` → `NotificationService.error` on load failure) — replaces the placeholder screen at `/admin/users` with the full list view and establishes the row-action surface (edit/reset-password/activate-deactivate triggers) that FR-03 through FR-06 wire up.

## 1. Objective

Create `UsersListComponent`, a smart component that loads `ManagedUserStore.users()` on init, renders a flat unpaginated table (username, email, display name, roles as chips, status badge, last login, row-actions), computes a per-row "is own account" flag by comparing `row.id` to the authenticated admin's own id (`UserStore.currentUser()?.id`) and disables/hides all three row actions for that row, and renders the "New User" button that opens `UserCreateDialogComponent` (built in task-010). Repoint the existing `/admin/users` route and delete the placeholder component and its route reference.

## 2. Files to Modify / Create

### File 1: `projects/admin/src/app/users/users-list.component.ts`

* **Action:** Create New File

### File 2: `projects/admin/src/app/users/user-placeholder.component.ts`

* **Action:** Delete File (superseded by `users-list.component.ts`; verify it currently contains only the placeholder `UserPlaceholderComponent` shown below before deleting)

**Current file content (for reference — confirm this is what's on disk before deleting):**

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-user-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-2xl font-semibold text-slate-800 mb-1" i18n>Users</h1>
    <p class="text-sm text-slate-500" i18n>Will be implemented in TASK009</p>
  `,
})
export class UserPlaceholderComponent {}
```

### File 3: `projects/admin/src/app/app.routes.ts`

* **Action:** Modify Existing File

## 3. Code Implementation

### 3a. `users-list.component.ts` — full new file

**Imports Required:**

```typescript
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ApiErrorParser,
  ErrorMessageResolver,
  Labels,
  ManagedUserStore,
  NotificationService,
  ROLE_LABELS,
  UserStore,
} from '@bikerental/shared';
import type { ManagedUser } from '@ui-models';
import { UserCreateDialogComponent } from './user-create-dialog.component';
```

**Code to Add/Replace:**

* **Location:** Full file content — this is a new file.

```typescript
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ApiErrorParser,
  ErrorMessageResolver,
  Labels,
  ManagedUserStore,
  NotificationService,
  ROLE_LABELS,
  UserStore,
} from '@bikerental/shared';
import type { ManagedUser } from '@ui-models';
import { UserCreateDialogComponent } from './user-create-dialog.component';

@Component({
  selector: 'app-users-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatCardModule,
    MatTableModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>{{ Labels.UsersListTitle }}</mat-card-title>
      </mat-card-header>

      <mat-card-content>
        <div class="flex justify-start mb-2">
          <button mat-raised-button color="primary" (click)="openCreateDialog()">
            <mat-icon>add</mat-icon>
            <span>{{ Labels.NewUserButton }}</span>
          </button>
        </div>

        @if (store.loading()) {
          <mat-progress-bar mode="indeterminate" />
        }

        @if (!store.loading() && store.users().length > 0) {
          <table mat-table [dataSource]="store.users()" class="w-full">
            <ng-container matColumnDef="username">
              <th mat-header-cell *matHeaderCellDef>{{ Labels.UserColumnUsername }}</th>
              <td mat-cell *matCellDef="let row">{{ row.username }}</td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>{{ Labels.UserColumnEmail }}</th>
              <td mat-cell *matCellDef="let row">{{ row.email }}</td>
            </ng-container>

            <ng-container matColumnDef="displayName">
              <th mat-header-cell *matHeaderCellDef>{{ Labels.UserColumnDisplayName }}</th>
              <td mat-cell *matCellDef="let row">{{ row.displayName }}</td>
            </ng-container>

            <ng-container matColumnDef="roles">
              <th mat-header-cell *matHeaderCellDef>{{ Labels.UserColumnRoles }}</th>
              <td mat-cell *matCellDef="let row">
                <mat-chip-set>
                  @for (role of row.roles; track role) {
                    <mat-chip>{{ roleLabels[role] }}</mat-chip>
                  }
                </mat-chip-set>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>{{ Labels.UserColumnStatus }}</th>
              <td mat-cell *matCellDef="let row">
                <span
                  class="px-2 py-1 rounded text-xs font-medium"
                  [class.bg-green-100]="row.status === 'ACTIVE'"
                  [class.text-green-800]="row.status === 'ACTIVE'"
                  [class.bg-red-100]="row.status === 'DISABLED'"
                  [class.text-red-800]="row.status === 'DISABLED'"
                >
                  {{ row.status === 'ACTIVE' ? Labels.UserStatusActive : Labels.UserStatusDisabled }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="lastLogin">
              <th mat-header-cell *matHeaderCellDef>{{ Labels.UserColumnLastLogin }}</th>
              <td mat-cell *matCellDef="let row">
                {{ row.lastLoginAt ? (row.lastLoginAt | date: 'dd MMM yyyy HH:mm') : Labels.UserLastLoginNever }}
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>{{ Labels.UserColumnActions }}</th>
              <td mat-cell *matCellDef="let row" class="flex gap-1 items-center">
                <button
                  mat-icon-button
                  [disabled]="isOwnAccount(row)"
                  [matTooltip]="Labels.UserEditTooltip"
                  (click)="openEditDialog(row)"
                >
                  <mat-icon>edit</mat-icon>
                </button>
                <button
                  mat-icon-button
                  [disabled]="isOwnAccount(row)"
                  [matTooltip]="Labels.UserResetPasswordTooltip"
                  (click)="onResetPassword(row)"
                >
                  <mat-icon>lock_reset</mat-icon>
                </button>
                <button
                  mat-icon-button
                  [disabled]="isOwnAccount(row)"
                  [matTooltip]="row.status === 'ACTIVE' ? Labels.UserDeactivateTooltip : Labels.UserActivateTooltip"
                  (click)="onToggleStatus(row)"
                >
                  <mat-icon>{{ row.status === 'ACTIVE' ? 'block' : 'check_circle' }}</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let _row; columns: displayedColumns"></tr>
          </table>
        }

        @if (!store.loading() && store.users().length === 0) {
          <div class="text-sm text-slate-500 py-6">{{ Labels.UsersEmptyState }}</div>
        }
      </mat-card-content>
    </mat-card>
  `,
})
export class UsersListComponent implements OnInit {
  protected readonly Labels = Labels;
  protected readonly roleLabels = ROLE_LABELS;
  protected readonly store = inject(ManagedUserStore);
  protected readonly displayedColumns = [
    'username',
    'email',
    'displayName',
    'roles',
    'status',
    'lastLogin',
    'actions',
  ];

  private readonly userStore = inject(UserStore);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = inject(ErrorMessageResolver);

  private readonly currentUserId = computed(() => this.userStore.currentUser()?.id);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.store
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (err) => {
          const apiError = ApiErrorParser.parse(err);
          this.notifications.error(this.resolver.resolve(apiError));
        },
      });
  }

  isOwnAccount(row: ManagedUser): boolean {
    return row.id === this.currentUserId();
  }

  openCreateDialog(): void {
    this.dialog
      .open<UserCreateDialogComponent, unknown, boolean>(UserCreateDialogComponent, { data: {} })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((created) => {
        if (created) {
          this.load();
        }
      });
  }

  openEditDialog(_row: ManagedUser): void {
    // Wired up in task-011 (FR-04 Edit User Dialog).
  }

  onResetPassword(_row: ManagedUser): void {
    // Wired up in task-013 (FR-06 Reset Password Flow).
  }

  onToggleStatus(_row: ManagedUser): void {
    // Wired up in task-012 (FR-05 Activate/Deactivate Flow).
  }
}
```

**Note:** `openEditDialog`, `onResetPassword`, and `onToggleStatus` are intentionally stubbed with a leading-underscore unused parameter in this task — task-011, task-013, and task-012 respectively replace each stub body with its real implementation and remove the unused-parameter prefix. This lets the list view build and render correctly before the row-action flows exist, per this REQ's dependency order.

### 3b. `app.routes.ts` — repoint the `users` route

* **Location:** The `users` route entry inside the `children: [...]` array.

**Old code:**

```typescript
      {
        path: 'users',
        loadComponent: () =>
          import('./users/user-placeholder.component').then((m) => m.UserPlaceholderComponent),
      },
```

**New code:**

```typescript
      {
        path: 'users',
        loadComponent: () =>
          import('./users/users-list.component').then((m) => m.UsersListComponent),
      },
```

No sidebar/nav-item change is needed — `admin-layout.component.ts`'s existing `NAV_ITEMS` entry (`{ label: $localize\`Users\`, route: 'users', icon: 'manage_accounts' }`) already points at this route path and needs no edit.

## 4. Validation Steps

```bash
npx tsc --noEmit -p projects/admin/tsconfig.app.json
npm run build -- --project admin
```
