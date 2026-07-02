import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
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

function atLeastOneRoleValidator(control: AbstractControl): ValidationErrors | null {
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
      <button
        mat-flat-button
        color="primary"
        [disabled]="form.invalid || saving()"
        (click)="save()"
      >
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
