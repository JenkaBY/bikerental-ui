import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  ApiErrorParser,
  applyServerErrors,
  CancelButtonComponent,
  clearServerErrors,
  ErrorMessageResolver,
  FormErrorMessages,
  Labels,
  NotificationService,
  PlatformManagerStore,
  suppressErrorNotification,
  TemporaryPasswordDialogComponent,
} from '@bikerental/shared';
import type { TemporaryPasswordDialogData } from '@bikerental/shared';

@Component({
  selector: 'app-manager-create-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    CancelButtonComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ Labels.CreatePlatformManagerDialogTitle }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-3 pt-2 min-w-100">
        <mat-form-field appearance="outline">
          <mat-label>{{ Labels.UserUsernameLabel }}</mat-label>
          <input matInput formControlName="username" maxlength="100" />
          @if (form.controls.username.hasError('required') && form.controls.username.touched) {
            <mat-error>{{ FormErrorMessages.required }}</mat-error>
          }
          @if (form.controls.username.hasError('server')) {
            <mat-error>{{ form.controls.username.getError('server') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ Labels.UserEmailLabel }}</mat-label>
          <input matInput type="email" formControlName="email" maxlength="255" />
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
          <input matInput formControlName="displayName" maxlength="200" />
          @if (form.controls.displayName.hasError('server')) {
            <mat-error>{{ form.controls.displayName.getError('server') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ Labels.UserPasswordLabel }}</mat-label>
          <input matInput formControlName="password" />
          <mat-hint>{{ Labels.UserPasswordHint }}</mat-hint>
          @if (form.controls.password.hasError('server')) {
            <mat-error>{{ form.controls.password.getError('server') }}</mat-error>
          }
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
        {{ Labels.CreatePlatformManagerConfirmButton }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ManagerCreateDialogComponent {
  protected readonly Labels = Labels;
  protected readonly FormErrorMessages = FormErrorMessages;

  private readonly dialogRef = inject<MatDialogRef<ManagerCreateDialogComponent>>(MatDialogRef);
  private readonly store = inject(PlatformManagerStore);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = inject(ErrorMessageResolver);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly saving = this.store.saving;

  protected readonly form = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(255)],
    }),
    displayName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(200)],
    }),
    password: new FormControl('', { nonNullable: true }),
  });

  confirm(): void {
    if (this.form.invalid || this.saving()) return;

    clearServerErrors(this.form);
    const { username, email, displayName, password } = this.form.getRawValue();
    const passwordSupplied = password.trim().length > 0;

    this.store
      .create(
        {
          username,
          email,
          displayName: displayName || undefined,
          password: passwordSupplied ? password : undefined,
        },
        { context: suppressErrorNotification() },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.dialogRef.close(true);
          if (passwordSupplied) {
            this.notifications.success(Labels.CreatePlatformManagerSuccessNoReveal);
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
          if (summary.length) {
            this.notifications.error(summary.join(' '));
          } else if (apiError.fieldErrors.length === 0) {
            this.notifications.error(this.resolver.resolve(apiError));
          }
        },
      });
  }
}
