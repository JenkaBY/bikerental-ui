import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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

function atLeastOneRoleValidator(control: AbstractControl) {
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
      <button
        mat-flat-button
        color="primary"
        [disabled]="form.invalid || saving()"
        (click)="confirm()"
      >
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
