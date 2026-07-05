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
import { TextFieldModule } from '@angular/cdk/text-field';
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
    TextFieldModule,
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
        <form
          [formGroup]="form"
          class="flex flex-col gap-3 pt-2"
          style="width: 70vw; max-width: 900px"
        >
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
              cdkTextareaAutosize
              cdkAutosizeMinRows="10"
              class="font-mono text-sm resize-y"
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
      <button mat-flat-button class="btn-utility" [disabled]="previewing()" (click)="previewPdf()">
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

  private readonly dialogRef =
    inject<MatDialogRef<AgreementDialogComponent, boolean>>(MatDialogRef);
  private readonly store = inject(AgreementTemplateStore);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = this.store.isFetchingDetail;
  protected readonly saving = this.store.isSaving;
  protected readonly previewing = this.store.isPreviewing;

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

    this.store
      .getById(this.data.templateId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (template) => {
          this.form.patchValue({ title: template.title, content: template.content });
        },
        error: (err) => {
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

    const call$ =
      this.data.templateId != null
        ? this.store.update(this.data.templateId, write)
        : this.store.create(write);

    call$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notifications.success(Labels.SaveAgreementSuccess);
        this.dialogRef.close(true);
      },
      error: (err) => {
        const apiError = ApiErrorParser.parse(err);
        const summary = applyServerErrors(this.form, apiError);
        if (summary.length) this.notifications.error(summary.join(' '));
      },
    });
  }

  previewPdf(): void {
    const { title, content } = this.form.getRawValue();

    this.store
      .previewPdf({ title, content })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.dialog.open<AgreementPdfPreviewDialogComponent, AgreementPdfPreviewDialogData, void>(
            AgreementPdfPreviewDialogComponent,
            {
              data: { blob, fileName: `${title || 'agreement'}.pdf` },
              width: '80vw',
              maxWidth: '900px',
              height: '85vh',
            },
          );
        },
        error: (err) => {
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
