import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { finalize } from 'rxjs';
import { IdentityService } from '../api/generated';
import {
  ApiErrorParser,
  applyServerErrors,
  clearServerErrors,
  ErrorCode,
  ErrorMessageResolver,
  NotificationService,
  SERVER_ERROR_KEY,
  suppressErrorNotification,
} from '../errors';
import { Labels } from '../../shared/constant/labels';
import { FormErrorMessages } from '../../shared/validators/form-error-messages';
import { AuthService } from './auth.service';
import { passwordPolicyValidator, passwordsMatchValidator } from './password-policy.validator';

@Component({
  selector: 'app-change-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  host: { class: 'flex h-full items-center justify-center p-6' },
  template: `
    <mat-card class="w-full max-w-md">
      <mat-card-header>
        <mat-card-title>{{ labels.ChangePasswordTitle }}</mat-card-title>
        <mat-card-subtitle>{{ labels.ChangePasswordSubtitle }}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="form" class="flex flex-col gap-3 pt-4" (ngSubmit)="submit()">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>{{ labels.CurrentPassword }}</mat-label>
            <input
              matInput
              type="password"
              formControlName="currentPassword"
              autocomplete="current-password"
            />
            @if (form.controls.currentPassword.hasError('required')) {
              <mat-error>{{ errors.passwordRequired }}</mat-error>
            }
            @if (form.controls.currentPassword.hasError(serverKey)) {
              <mat-error>{{ form.controls.currentPassword.getError(serverKey) }}</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
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

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>{{ labels.ConfirmPassword }}</mat-label>
            <input
              matInput
              type="password"
              formControlName="confirmPassword"
              autocomplete="new-password"
            />
            @if (form.controls.confirmPassword.hasError('required')) {
              <mat-error>{{ errors.passwordRequired }}</mat-error>
            }
            @if (form.controls.confirmPassword.hasError('passwordsMismatch')) {
              <mat-error>{{ errors.passwordsMismatch }}</mat-error>
            }
          </mat-form-field>

          <button
            mat-flat-button
            color="primary"
            type="submit"
            [disabled]="saving() || form.invalid"
          >
            {{ labels.ChangePasswordCta }}
          </button>
        </form>
      </mat-card-content>
    </mat-card>
  `,
})
export class ChangePasswordComponent {
  private readonly identity = inject(IdentityService);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = inject(ErrorMessageResolver);

  protected readonly labels = Labels;
  protected readonly errors = FormErrorMessages;
  protected readonly serverKey = SERVER_ERROR_KEY;
  protected readonly saving = signal(false);

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

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    clearServerErrors(this.form);
    this.saving.set(true);
    const { currentPassword, newPassword } = this.form.getRawValue();

    this.identity
      .changePassword({ currentPassword, newPassword }, 'response', {
        context: suppressErrorNotification(),
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => this.onSuccess(),
        error: (error: HttpErrorResponse) => this.onError(error),
      });
  }

  private onSuccess(): void {
    this.notifications.success(Labels.PasswordChanged);
    this.auth.login();
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
