# Task 011: UserEditDialogComponent

> **Applied Skills:** `angular-forms` (Reactive Forms — pre-filled `FormGroup`, disabled controls for read-only fields, at-least-one-role validator reused from the create dialog's pattern), `angular-component` (standalone, `OnPush`, `inject()`, `MAT_DIALOG_DATA`), `error-handling` (`SUPPRESS_ERROR_NOTIFICATION` on the update call, `ApiErrorParser.parse` + `applyServerErrors`) — implements the edit modal wired to FR-02's per-row edit action (task-009), never reachable for the acting admin's own row per FR-02's self-lockout gating.

## 1. Objective

Create `UserEditDialogComponent`, receiving `{ user: ManagedUser }` via `MAT_DIALOG_DATA`. Pre-fills `displayName`, `roles` (checkboxes from `ASSIGNABLE_ROLES`), and `status` as editable controls; renders `username`/`email` as disabled read-only fields for context. Disables Save whenever the resulting roles selection would be empty. Calls `ManagedUserStore.update(id, write)` on save, closing `true` on success and keeping the dialog open with inline errors on failure. Then wire `UsersListComponent.openEditDialog` (task-009's stub) to open this dialog.

## 2. Files to Modify / Create

### File 1: `projects/admin/src/app/users/user-edit-dialog.component.ts`

* **Action:** Create New File

### File 2: `projects/admin/src/app/users/users-list.component.ts`

* **Action:** Modify Existing File (created in task-009)

## 3. Code Implementation

### 3a. `user-edit-dialog.component.ts` — full new file

**Imports Required:**

```typescript
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  ApiErrorParser,
  applyServerErrors,
  ASSIGNABLE_ROLES,
  CancelButtonComponent,
  clearServerErrors,
  Labels,
  ManagedUserStore,
  NotificationService,
  ROLE_LABELS,
  suppressErrorNotification,
} from '@bikerental/shared';
import type { ManagedUser, Role } from '@ui-models';

export interface UserEditDialogData {
  user: ManagedUser;
}
```

**Code to Add/Replace:**

* **Location:** Full file content — this is a new file.

```typescript
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  ApiErrorParser,
  applyServerErrors,
  ASSIGNABLE_ROLES,
  CancelButtonComponent,
  clearServerErrors,
  Labels,
  ManagedUserStore,
  NotificationService,
  ROLE_LABELS,
  suppressErrorNotification,
} from '@bikerental/shared';
import type { ManagedUser, Role } from '@ui-models';

export interface UserEditDialogData {
  user: ManagedUser;
}

function atLeastOneRoleValidator(control: FormGroup) {
  const anyChecked = Object.values(control.value as Record<string, boolean>).some(Boolean);
  return anyChecked ? null : { atLeastOneRole: true };
}

@Component({
  selector: 'app-user-edit-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    CancelButtonComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ Labels.EditUserDialogTitle }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-3 pt-2 min-w-100">
        <mat-form-field appearance="outline">
          <mat-label>{{ Labels.UserUsernameLabel }}</mat-label>
          <input matInput [value]="data.user.username" disabled />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ Labels.UserEmailLabel }}</mat-label>
          <input matInput [value]="data.user.email" disabled />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ Labels.UserDisplayNameLabel }}</mat-label>
          <input matInput formControlName="displayName" />
        </mat-form-field>

        <div>
          <span class="text-sm text-slate-600">{{ Labels.UserRolesLabel }}</span>
          <div formGroupName="roles" class="flex gap-4 mt-1">
            @for (role of assignableRoles; track role) {
              <mat-checkbox [formControlName]="role">{{ roleLabels[role] }}</mat-checkbox>
            }
          </div>
          @if (form.controls.roles.hasError('atLeastOneRole') && form.controls.roles.touched) {
            <p class="text-xs text-red-600 mt-1" i18n>At least one role is required</p>
          }
        </div>

        <mat-form-field appearance="outline">
          <mat-label>{{ Labels.UserStatusLabel }}</mat-label>
          <mat-select formControlName="status">
            <mat-option value="ACTIVE">{{ Labels.UserStatusActive }}</mat-option>
            <mat-option value="DISABLED">{{ Labels.UserStatusDisabled }}</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <app-form-cancel-button />
      <button mat-flat-button color="primary" [disabled]="form.invalid || saving()" (click)="save()">
        {{ Labels.SaveUserButton }}
      </button>
    </mat-dialog-actions>
  `,
})
export class UserEditDialogComponent {
  protected readonly Labels = Labels;
  protected readonly assignableRoles = ASSIGNABLE_ROLES;
  protected readonly roleLabels = ROLE_LABELS;
  protected readonly data = inject<UserEditDialogData>(MAT_DIALOG_DATA);

  private readonly dialogRef = inject<MatDialogRef<UserEditDialogComponent>>(MatDialogRef);
  private readonly store = inject(ManagedUserStore);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly saving = this.store.saving;

  protected readonly form = new FormGroup({
    displayName: new FormControl(this.data.user.displayName, { nonNullable: true }),
    roles: new FormGroup(
      Object.fromEntries(
        this.assignableRoles.map((role) => [
          role,
          new FormControl(this.data.user.roles.includes(role), { nonNullable: true }),
        ]),
      ),
      { validators: [atLeastOneRoleValidator] },
    ),
    status: new FormControl(this.data.user.status, { nonNullable: true }),
  });

  save(): void {
    if (this.form.invalid || this.saving()) return;

    clearServerErrors(this.form);
    const { displayName, roles, status } = this.form.getRawValue();
    const selectedRoles = (Object.keys(roles) as Role[]).filter((role) => roles[role]);

    this.store
      .update(
        this.data.user.id,
        { displayName, roles: selectedRoles, status },
        { context: suppressErrorNotification() },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          const apiError = ApiErrorParser.parse(err);
          const summary = applyServerErrors(this.form, apiError);
          if (summary.length) this.notifications.error(summary.join(' '));
        },
      });
  }
}
```

### 3b. `users-list.component.ts` — wire the edit action

* **Location:** Replace the `openEditDialog` stub method body and add the new import.

**Old code (import section — add one line):**

```typescript
import { UserCreateDialogComponent } from './user-create-dialog.component';
```

**New code (add immediately after the line above):**

```typescript
import { UserCreateDialogComponent } from './user-create-dialog.component';
import { UserEditDialogComponent } from './user-edit-dialog.component';
```

**Old code (stub method):**

```typescript
  openEditDialog(_row: ManagedUser): void {
    // Wired up in task-011 (FR-04 Edit User Dialog).
  }
```

**New code:**

```typescript
  openEditDialog(row: ManagedUser): void {
    this.dialog
      .open<UserEditDialogComponent, unknown, boolean>(UserEditDialogComponent, {
        data: { user: row },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((updated) => {
        if (updated) {
          this.load();
        }
      });
  }
```

## 4. Validation Steps

```bash
npx tsc --noEmit -p projects/admin/tsconfig.app.json
npm run build -- --project admin
```
