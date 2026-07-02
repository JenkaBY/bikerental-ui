# Task 007: TemporaryPasswordDialogComponent (One-Time Reveal Dialog)

> **Applied Skills:** `angular-component` (standalone, `OnPush`, `inject()`, no code comments, native `@if` control flow), `angular-signals` (local `signal()` for the transient "copied" indicator) — this dialog is a pure presentation component with no store/service injection beyond `MatDialogRef` and the Clipboard API; per FR-07's design, the plaintext password exists only as this dialog's own `MAT_DIALOG_DATA` input and is discarded the instant the dialog closes.

## 1. Objective

Create `TemporaryPasswordDialogComponent` in the Shared Library — a generic, reusable modal that displays a plaintext `temporaryPassword` in a selectable read-only field, offers a copy-to-clipboard action with a transient "Copied" indicator, shows a one-time-only warning, and closes only via its own explicit "Done" action (no backdrop/Escape dismissal). It is opened identically by FR-03's create dialog (task-010) and by the reset-password flow (task-013).

## 2. Files to Modify / Create

* **File Path:** `projects/shared/src/shared/components/temporary-password-dialog/temporary-password-dialog.component.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Labels } from '../../constant/labels';
```

**Code to Add/Replace:**

* **Location:** Full file content — this is a new file.

```typescript
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
        <input matInput [value]="data.temporaryPassword" readonly (focus)="selectAll($event)" #passwordInput />
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

  selectAll(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
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
```

## 4. Export from Shared Public API

* **File Path:** `projects/shared/src/public-api.ts`
* **Action:** Modify Existing File
* **Location:** In the `// Shared UI — components` block, add the new export immediately after `export * from './shared/components/withdraw-dialog/max-amount.validator';`.

**New line to add:**

```typescript
export * from './shared/components/temporary-password-dialog/temporary-password-dialog.component';
```

## 5. Caller Contract (for reference by task-010 and task-013 — no action needed here)

Callers must open this dialog with `disableClose: true` so backdrop click / Escape cannot dismiss it — only the in-dialog "Done" button calls `dialogRef.close()`, per FR-07's "closing is the only way to dismiss it" rule:

```typescript
this.dialog.open<TemporaryPasswordDialogComponent, TemporaryPasswordDialogData, void>(
  TemporaryPasswordDialogComponent,
  { data: { temporaryPassword: result.temporaryPassword }, disableClose: true },
);
```

## 6. Validation Steps

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
npm run build -- --project shared
```
