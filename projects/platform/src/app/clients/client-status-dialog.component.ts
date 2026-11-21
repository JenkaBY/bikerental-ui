import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  ApiErrorParser,
  applyServerErrors,
  ClientRegistryStore,
  ErrorCode,
  ErrorMessageResolver,
  FormErrorMessages,
  Labels,
  NotificationService,
} from '@bikerental/shared';
import type { Client, ClientStatusTransition } from '@bikerental/shared';
import { clientStatusActionLabel } from './client-status-labels';

export interface ClientStatusDialogData {
  readonly client: Client;
  readonly transition: ClientStatusTransition;
}

export const CLIENT_STATUS_REASON_MAX = 500;

@Component({
  selector: 'app-client-status-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './client-status-dialog.component.html',
})
export class ClientStatusDialogComponent {
  protected readonly Labels = Labels;
  protected readonly FormErrorMessages = FormErrorMessages;
  protected readonly reasonMax = CLIENT_STATUS_REASON_MAX;
  protected readonly data = inject<ClientStatusDialogData>(MAT_DIALOG_DATA);
  protected readonly store = inject(ClientRegistryStore);
  protected readonly title = clientStatusActionLabel(
    this.data.transition.target,
    this.data.client.status,
  );
  protected readonly closing = this.data.transition.target === 'CLOSED';
  protected readonly stale = signal(false);
  protected readonly form = new FormGroup({
    reason: new FormControl('', {
      nonNullable: true,
      validators: [
        ...(this.data.transition.reasonRequired ? [Validators.required] : []),
        Validators.maxLength(CLIENT_STATUS_REASON_MAX),
      ],
    }),
  });

  private readonly dialogRef =
    inject<MatDialogRef<ClientStatusDialogComponent, Client>>(MatDialogRef);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = inject(ErrorMessageResolver);
  private readonly destroyRef = inject(DestroyRef);

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.store
      .changeStatus(this.data.client, {
        status: this.data.transition.target,
        reason: this.form.controls.reason.value,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.notifications.success(Labels.ClientStatusChangedSuccess);
          this.dialogRef.close(updated);
        },
        error: (err: unknown) => this.handleError(err),
      });
  }

  protected reload(): void {
    this.store
      .loadClient(this.data.client.slug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.dialogRef.close());
  }

  private handleError(err: unknown): void {
    const apiError = ApiErrorParser.parse(err);
    if (apiError.code === ErrorCode.RESOURCE_OPTIMISTIC_LOCK) {
      this.stale.set(true);
      return;
    }
    const summary = applyServerErrors(this.form, apiError);
    if (summary.length) this.notifications.error(summary.join(' '));
    else if (!apiError.fieldErrors.length)
      this.notifications.error(this.resolver.resolve(apiError));
  }
}
