import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Labels } from '../../constant/labels';
import { FormErrorMessages } from '../../validators/form-error-messages';
import {
  ApiErrorParser,
  applyServerErrors,
  clearServerErrors,
  ErrorCode,
  ErrorMessageResolver,
  NotificationService,
  SERVER_ERROR_KEY,
} from '../../../core/errors';
import {
  passwordPolicyValidator,
  passwordsMatchValidator,
} from '../../../core/auth/password-policy.validator';
import { ProfileStore } from '../../../core/state/profile.store';

@Component({
  selector: 'app-profile-security',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <div class="flex flex-col gap-3 p-3 md:p-4 max-w-xl">
      <form [formGroup]="form" class="flex flex-col gap-3" (ngSubmit)="submit()">
        <mat-form-field appearance="outline">
          <mat-label>{{ labels.CurrentPassword }}</mat-label>
          <input
            matInput
            type="password"
            formControlName="currentPassword"
            autocomplete="current-password"
          />
          @if (form.controls.currentPassword.hasError('required')) {
            <mat-error>{{ errors.passwordRequired }}</mat-error>
          } @else if (form.controls.currentPassword.hasError(serverKey)) {
            <mat-error>{{ form.controls.currentPassword.getError(serverKey) }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ labels.NewPassword }}</mat-label>
          <input
            matInput
            type="password"
            formControlName="newPassword"
            autocomplete="new-password"
          />
          @if (form.controls.newPassword.hasError('required')) {
            <mat-error>{{ errors.passwordRequired }}</mat-error>
          } @else if (form.controls.newPassword.hasError('passwordLength')) {
            <mat-error>{{ errors.passwordLength }}</mat-error>
          } @else if (form.controls.newPassword.hasError('passwordComposition')) {
            <mat-error>{{ errors.passwordComposition }}</mat-error>
          } @else if (form.controls.newPassword.hasError(serverKey)) {
            <mat-error>{{ form.controls.newPassword.getError(serverKey) }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ labels.ConfirmPassword }}</mat-label>
          <input
            matInput
            type="password"
            formControlName="confirmPassword"
            autocomplete="new-password"
          />
          @if (form.controls.confirmPassword.hasError('required')) {
            <mat-error>{{ errors.passwordRequired }}</mat-error>
          } @else if (form.controls.confirmPassword.hasError('passwordsMismatch')) {
            <mat-error>{{ errors.passwordsMismatch }}</mat-error>
          }
        </mat-form-field>

        <div class="flex justify-end pt-1">
          <button
            mat-flat-button
            color="primary"
            type="submit"
            [disabled]="profileStore.saving() || form.invalid"
          >
            {{ labels.ChangePasswordCta }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class ProfileSecurityComponent {
  protected readonly profileStore = inject(ProfileStore);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = inject(ErrorMessageResolver);

  protected readonly labels = Labels;
  protected readonly errors = FormErrorMessages;
  protected readonly serverKey = SERVER_ERROR_KEY;

  protected readonly form = new FormGroup(
    {
      currentPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      newPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, passwordPolicyValidator],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: passwordsMatchValidator('newPassword', 'confirmPassword') },
  );

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    clearServerErrors(this.form);
    const { currentPassword, newPassword } = this.form.getRawValue();

    this.profileStore.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => this.onSuccess(),
      error: (error: HttpErrorResponse) => this.onError(error),
    });
  }

  private onSuccess(): void {
    this.notifications.success(Labels.PasswordChanged);
    this.form.reset();
  }

  private onError(error: HttpErrorResponse): void {
    const apiError = ApiErrorParser.parse(error);
    if (apiError.code === ErrorCode.PASSWORD_INVALID_CURRENT) {
      this.form.controls.currentPassword.setErrors({
        [SERVER_ERROR_KEY]: this.resolver.resolve(apiError),
      });
      return;
    }
    if (apiError.code === ErrorCode.PASSWORD_POLICY_VIOLATION) {
      this.form.controls.newPassword.setErrors({
        [SERVER_ERROR_KEY]: this.resolver.resolve(apiError),
      });
      return;
    }
    const unmatched = applyServerErrors(this.form, apiError);
    this.notifications.error(
      unmatched.length > 0 ? unmatched.join(' ') : this.resolver.resolve(apiError),
    );
  }
}
