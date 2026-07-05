# Task 011: Agreement Template Editor Dialog

> **Applied Skills:** `angular-forms` (Reactive Forms with `FormGroup`/`Validators`, no autosave,
> explicit Save/Cancel buttons), `error-handling` (`applyServerErrors(form, apiError)` binds field
> errors; unmatched summary → `NotificationService.error`; store already suppresses the global
> toast) — implements create/edit/read-only view per FR-01's design section 3
> (`agreement-dialog.component.ts` bullet).

## 1. Objective

Create `AgreementDialogComponent`. `MAT_DIALOG_DATA: { templateId?: number; readonly?: boolean }`.
On open with `templateId`, fetches the full template via `store.getById()` (relies on the parent
list opening this dialog with `{ viewContainerRef }` so `AgreementTemplateStore` — a feature
provider on the list component — is visible to this dialog's injector). Form: `title` (required)
+ `content` (required, textarea). Buttons: Save (create/update, `close(true)`), Cancel
(`close(undefined)`), Preview PDF (opens `AgreementPdfPreviewDialogComponent` with the current,
possibly-unsaved form value). Read-only mode disables the form and hides Save.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/agreements/agreement-dialog.component.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  AgreementTemplateStore,
  ApiErrorParser,
  applyServerErrors,
  CancelButtonComponent,
  clearServerErrors,
  FormErrorMessages,
  Labels,
  NotificationService,
} from '@bikerental/shared';
import type { AgreementTemplateWrite } from '@ui-models';
import {
  AgreementPdfPreviewDialogComponent,
  AgreementPdfPreviewDialogData,
} from './agreement-pdf-preview-dialog.component';

export interface AgreementDialogData {
  templateId?: number;
  readonly?: boolean;
}
```

**Code to Add/Replace:**

* **Location:** Full file content — this is a new file.

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  AgreementTemplateStore,
  ApiErrorParser,
  applyServerErrors,
  CancelButtonComponent,
  clearServerErrors,
  FormErrorMessages,
  Labels,
  NotificationService,
} from '@bikerental/shared';
import type { AgreementTemplateWrite } from '@ui-models';
import {
  AgreementPdfPreviewDialogComponent,
  AgreementPdfPreviewDialogData,
} from './agreement-pdf-preview-dialog.component';

export interface AgreementDialogData {
  templateId?: number;
  readonly?: boolean;
}

@Component({
  selector: 'app-agreement-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    CancelButtonComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ dialogTitle() }}</h2>
    <mat-dialog-content>
      @if (loading()) {
        <div class="flex justify-center py-6">
          <mat-progress-spinner mode="indeterminate" diameter="36" />
        </div>
      } @else {
        <form [formGroup]="form" class="flex flex-col gap-3 pt-2" style="width: 70vw; max-width: 900px">
          <mat-form-field appearance="outline">
            <mat-label>{{ Labels.AgreementTitleLabel }}</mat-label>
            <input matInput formControlName="title" />
            @if (form.controls.title.hasError('required') && form.controls.title.touched) {
              <mat-error>{{ FormErrorMessages.required }}</mat-error>
            }
            @if (form.controls.title.hasError('server')) {
              <mat-error>{{ form.controls.title.getError('server') }}</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ Labels.AgreementContentLabel }}</mat-label>
            <textarea
              matInput
              formControlName="content"
              rows="20"
              class="font-mono text-sm"
            ></textarea>
            @if (form.controls.content.hasError('required') && form.controls.content.touched) {
              <mat-error>{{ FormErrorMessages.required }}</mat-error>
            }
            @if (form.controls.content.hasError('server')) {
              <mat-error>{{ form.controls.content.getError('server') }}</mat-error>
            }
          </mat-form-field>
        </form>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [disabled]="previewing()" (click)="previewPdf()">
        {{ previewing() ? Labels.GeneratingPdfButton : Labels.PreviewPdfButton }}
      </button>
      <app-form-cancel-button />
      @if (!data.readonly) {
        <button
          mat-flat-button
          color="primary"
          [disabled]="form.invalid || saving()"
          (click)="save()"
        >
          {{ Labels.Save }}
        </button>
      }
    </mat-dialog-actions>
  `,
})
export class AgreementDialogComponent implements OnInit {
  protected readonly Labels = Labels;
  protected readonly FormErrorMessages = FormErrorMessages;
  protected readonly data = inject<AgreementDialogData>(MAT_DIALOG_DATA);

  private readonly dialogRef = inject<MatDialogRef<AgreementDialogComponent, boolean>>(
    MatDialogRef,
  );
  private readonly store = inject(AgreementTemplateStore);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly previewing = signal(false);

  protected readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    content: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected readonly dialogTitle = signal(this.resolveTitle());

  ngOnInit(): void {
    if (this.data.readonly) {
      this.form.disable();
    }

    if (this.data.templateId == null) {
      return;
    }

    this.loading.set(true);
    this.store
      .getById(this.data.templateId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (template) => {
          this.form.patchValue({ title: template.title, content: template.content });
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          const apiError = ApiErrorParser.parse(err);
          this.notifications.error(apiError.detail || Labels.AgreementsListTitle);
          this.dialogRef.close(false);
        },
      });
  }

  save(): void {
    if (this.form.invalid || this.saving()) return;

    clearServerErrors(this.form);
    const write: AgreementTemplateWrite = this.form.getRawValue();
    this.saving.set(true);

    const call$ =
      this.data.templateId != null
        ? this.store.update(this.data.templateId, write)
        : this.store.create(write);

    call$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.notifications.success(Labels.SaveAgreementSuccess);
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.saving.set(false);
        const apiError = ApiErrorParser.parse(err);
        const summary = applyServerErrors(this.form, apiError);
        if (summary.length) this.notifications.error(summary.join(' '));
      },
    });
  }

  previewPdf(): void {
    const { title, content } = this.form.getRawValue();
    this.previewing.set(true);

    this.store
      .previewPdf({ title, content })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.previewing.set(false);
          this.dialog.open<
            AgreementPdfPreviewDialogComponent,
            AgreementPdfPreviewDialogData,
            void
          >(AgreementPdfPreviewDialogComponent, {
            data: { blob, fileName: `${title || 'agreement'}.pdf` },
            width: '80vw',
            maxWidth: '900px',
            height: '85vh',
          });
        },
        error: (err) => {
          this.previewing.set(false);
          const apiError = ApiErrorParser.parse(err);
          this.notifications.error(apiError.detail || Labels.PreviewPdfButton);
        },
      });
  }

  private resolveTitle(): string {
    if (this.data.readonly) return Labels.ViewAgreementDialogTitle;
    return this.data.templateId != null
      ? Labels.EditAgreementDialogTitle
      : Labels.CreateAgreementDialogTitle;
  }
}
```

**Note on the store visibility contract:** `AgreementTemplateStore` has no `providedIn` (Task
008) — it only exists because `AgreementListComponent` (Task 012) lists it in its own
`providers: []` and opens this dialog with `{ viewContainerRef: this.viewContainerRef }`. Angular
Material resolves a dialog's injector from the supplied `viewContainerRef` when present, so
`inject(AgreementTemplateStore)` here resolves to the *same* instance the list uses. Do not add
`providedIn: 'root'` to the store and do not provide it again in this dialog.

**Note on `previewPdf`:** deliberately reads `this.form.getRawValue()` (not a saved template) so
unsaved edits can be previewed before Save, per FR-01's design ("Preview: editor dialog →
`store.previewPdf(currentFormValue)`").

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx ng build admin --configuration development
npx ng lint admin
```
