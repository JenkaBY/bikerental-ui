# Task 010: UserCreateDialogComponent

> **Applied Skills:** `angular-forms` (Reactive Forms — `FormGroup`/`FormControl`/`Validators`, disabled Confirm while invalid), `angular-component` (standalone, `OnPush`, `inject()`), `error-handling` (`SUPPRESS_ERROR_NOTIFICATION` on the create call, `ApiErrorParser.parse` + `applyServerErrors` for duplicate username/email, `NotificationService` for unmatched/success messages) — implements the create-user modal wired to FR-02's "New User" button (task-009), branching on whether the admin supplied a password to either open the FR-07 reveal dialog or show a lightweight success toast.

## 1. Objective

Create `UserCreateDialogComponent`: a reactive form (username, email, optional displayName, roles checkboxes from `ASSIGNABLE_ROLES`, optional password) that calls `ManagedUserStore.create()` on confirm. On success with a blank password, opens `TemporaryPasswordDialogComponent` (task-007) with the returned temporary password; on success with a supplied password, shows a success notification instead. On HTTP error (e.g. duplicate username/email), binds field errors to the form and keeps the dialog open for retry.

## 2. Files to Modify / Create

* **File Path:** `projects/admin/src/app/users/user-create-dialog.component.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  ApiErrorParser,
  applyServerErrors,
  ASSIGNABLE_ROLES,
  CancelButtonComponent,
  clearServerErrors,
  FormErrorMessages,
  Labels,
  ManagedUserStore,
  NotificationService,
  ROLE_LABELS,
  suppressErrorNotification,
  TemporaryPasswordDialogComponent,
} from '@bikerental/shared';
import type { TemporaryPasswordDialogData } from '@bikerental/shared';
import type { Role } from '@ui-models';
```

**Code to Add/Replace:**

* **Location:** Full file content — this is a new file.

```typescript
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  ApiErrorParser,
  applyServerErrors,
  ASSIGNABLE_ROLES,
  CancelButtonComponent,
  clearServerErrors,
  FormErrorMessages,
  Labels,
  ManagedUserStore,
  NotificationService,
  ROLE_LABELS,
  suppressErrorNotification,
  TemporaryPasswordDialogComponent,
} from '@bikerental/shared';
import type { TemporaryPasswordDialogData } from '@bikerental/shared';
import type { Role } from '@ui-models';

function atLeastOneRoleValidator(control: FormGroup) {
  const anyChecked = Object.values(control.value as Record<string, boolean>).some(Boolean);
  return anyChecked ? null : { atLeastOneRole: true };
}

@Component({
  selector: 'app-user-create-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    CancelButtonComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ Labels.CreateUserDialogTitle }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-3 pt-2 min-w-100">
        <mat-form-field appearance="outline">
          <mat-label>{{ Labels.UserUsernameLabel }}</mat-label>
          <input matInput formControlName="username" />
          @if (form.controls.username.hasError('required') && form.controls.username.touched) {
            <mat-error>{{ FormErrorMessages.required }}</mat-error>
          }
          @if (form.controls.username.hasError('server')) {
            <mat-error>{{ form.controls.username.getError('server') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ Labels.UserEmailLabel }}</mat-label>
          <input matInput type="email" formControlName="email" />
          @if (form.controls.email.hasError('required') && form.controls.email.touched) {
            <mat-error>{{ FormErrorMessages.required }}</mat-error>
          }
          @if (form.controls.email.hasError('email')) {
            <mat-error>{{ FormErrorMessages.emailInvalid }}</mat-error>
          }
          @if (form.controls.email.hasError('server')) {
            <mat-error>{{ form.controls.email.getError('server') }}</mat-error>
          }
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
        </div>

        <mat-form-field appearance="outline">
          <mat-label>{{ Labels.UserPasswordLabel }}</mat-label>
          <input matInput formControlName="password" />
          <mat-hint>{{ Labels.UserPasswordHint }}</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <app-form-cancel-button />
      <button mat-flat-button color="primary" [disabled]="form.invalid || saving()" (click)="confirm()">
        {{ Labels.CreateUserConfirmButton }}
      </button>
    </mat-dialog-actions>
  `,
})
export class UserCreateDialogComponent {
  protected readonly Labels = Labels;
  protected readonly FormErrorMessages = FormErrorMessages;
  protected readonly assignableRoles = ASSIGNABLE_ROLES;
  protected readonly roleLabels = ROLE_LABELS;

  private readonly dialogRef = inject<MatDialogRef<UserCreateDialogComponent>>(MatDialogRef);
  private readonly store = inject(ManagedUserStore);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly saving = this.store.saving;

  protected readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    displayName: new FormControl('', { nonNullable: true }),
    roles: new FormGroup(
      Object.fromEntries(
        this.assignableRoles.map((role) => [role, new FormControl(false, { nonNullable: true })]),
      ),
      { validators: [atLeastOneRoleValidator] },
    ),
    password: new FormControl('', { nonNullable: true }),
  });

  confirm(): void {
    if (this.form.invalid || this.saving()) return;

    clearServerErrors(this.form);
    const { username, email, displayName, roles, password } = this.form.getRawValue();
    const selectedRoles = (Object.keys(roles) as Role[]).filter((role) => roles[role]);
    const passwordSupplied = password.trim().length > 0;

    this.store
      .create(
        {
          username,
          email,
          displayName: displayName || undefined,
          roles: selectedRoles,
          password: passwordSupplied ? password : undefined,
        },
        { context: suppressErrorNotification() },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.dialogRef.close(true);
          if (passwordSupplied) {
            this.notifications.success(Labels.CreateUserSuccessNoReveal);
          } else {
            this.dialog.open<TemporaryPasswordDialogComponent, TemporaryPasswordDialogData, void>(
              TemporaryPasswordDialogComponent,
              { data: { temporaryPassword: result.temporaryPassword }, disableClose: true },
            );
          }
        },
        error: (err) => {
          const apiError = ApiErrorParser.parse(err);
          const summary = applyServerErrors(this.form, apiError);
          if (summary.length) this.notifications.error(summary.join(' '));
        },
      });
  }
}
```

**Note on `store.create(write, options)`:** `ManagedUserStore.create(write, options?)` (implemented in task-004) already accepts and forwards this optional `RequestOptions<'json'>` second parameter to the generated `UsersService.create(...)` call — no change to `managed-user.store.ts` is needed here; simply pass `{ context: suppressErrorNotification() }` as shown above so the dialog's own `applyServerErrors`/`NotificationService` handling is the only error surface (the global interceptor's toast is suppressed for this request).

**Note on `USERNAME_DUPLICATE`/`EMAIL_DUPLICATE`:** both error codes are already registered in `core/errors/error-code.ts` (as `identity.username.duplicate` / `identity.email.duplicate`, classified as domain codes) and already have catalog copy in `core/errors/error-messages.ts` ("This username is already taken." / "This email address is already in use.") — no new error-code registration is required for this dialog's duplicate-username/email scenario; `applyServerErrors` binds them to the matching form control automatically via the field error's `field` name if the backend reports them as field errors, otherwise `ErrorMessageResolver`/the unmatched-message path surfaces the same copy through `NotificationService.error(...)`.

## 4. Validation Steps

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
npx tsc --noEmit -p projects/admin/tsconfig.app.json
npm run build -- --project admin
```
