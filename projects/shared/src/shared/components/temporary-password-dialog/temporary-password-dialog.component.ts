import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Labels } from '../../constant/labels';

export interface TemporaryPasswordDialogData {
  temporaryPassword: string;
}

@Component({
  selector: 'app-temporary-password-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>{{ Labels.TemporaryPasswordDialogTitle }}</h2>
    <mat-dialog-content>
      <p class="text-sm text-amber-700 mb-3">{{ Labels.TemporaryPasswordWarning }}</p>
      <mat-form-field appearance="outline" class="w-full">
        <input
          matInput
          [type]="showPassword() ? 'text' : 'password'"
          [value]="data.temporaryPassword"
          readonly
          (focus)="selectAll($event)"
          #passwordInput
        />
        <button
          mat-icon-button
          matSuffix
          type="button"
          [attr.aria-label]="
            showPassword() ? Labels.TemporaryPasswordHideButton : Labels.TemporaryPasswordShowButton
          "
          (click)="toggleShowPassword()"
        >
          <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
        <button
          mat-icon-button
          matSuffix
          type="button"
          [attr.aria-label]="Labels.TemporaryPasswordCopyButton"
          (click)="copy()"
        >
          <mat-icon>content_copy</mat-icon>
        </button>
      </mat-form-field>
      @if (copyState() === 'copied') {
        <p class="text-sm text-green-700">{{ Labels.TemporaryPasswordCopiedConfirmation }}</p>
      } @else if (copyState() === 'failed') {
        <p class="text-sm text-red-700">{{ Labels.TemporaryPasswordCopyFailed }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" (click)="done()">
        {{ Labels.TemporaryPasswordDoneButton }}
      </button>
    </mat-dialog-actions>
  `,
})
export class TemporaryPasswordDialogComponent {
  protected readonly Labels = Labels;
  protected readonly data = inject<TemporaryPasswordDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<TemporaryPasswordDialogComponent>);

  protected readonly copyState = signal<'idle' | 'copied' | 'failed'>('idle');
  protected readonly showPassword = signal(false);

  selectAll(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }

  toggleShowPassword(): void {
    this.showPassword.update((shown) => !shown);
  }

  copy(): void {
    navigator.clipboard.writeText(this.data.temporaryPassword).then(
      () => {
        this.copyState.set('copied');
        setTimeout(() => this.copyState.set('idle'), 3000);
      },
      () => {
        this.copyState.set('failed');
      },
    );
  }

  done(): void {
    this.dialogRef.close();
  }
}
