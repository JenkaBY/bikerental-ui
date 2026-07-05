import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  viewChild,
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
import { MatIconModule } from '@angular/material/icon';
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
    MatIconModule,
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
              #contentTextarea
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

          <div class="border border-slate-200 rounded">
            <button
              type="button"
              class="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-slate-700"
              (click)="variablesExpanded.set(!variablesExpanded())"
            >
              {{ Labels.VariablesReferenceTitle }}
              <mat-icon>{{ variablesExpanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
            </button>
            @if (variablesExpanded()) {
              <div class="border-t border-slate-200 px-3 py-2 flex flex-col gap-2">
                <p class="text-xs text-slate-500">{{ Labels.VariablesReferenceHint }}</p>
                @if (store.variables().length === 0) {
                  <p class="text-sm text-slate-500">{{ Labels.VariablesReferenceEmpty }}</p>
                } @else {
                  <div class="flex flex-wrap gap-2">
                    @for (variable of store.variables(); track variable.key) {
                      <button
                        type="button"
                        class="text-left rounded-full border border-slate-200 hover:bg-slate-50 pl-2 pr-3 py-1 flex items-center gap-1.5 max-w-full"
                        [disabled]="data.readonly"
                        [title]="
                          variable.example
                            ? variable.description +
                              ' — ' +
                              Labels.VariablesReferenceExampleLabel +
                              ': ' +
                              variable.example
                            : variable.description
                        "
                        (click)="insertVariable(variable.key)"
                      >
                        <span
                          class="font-mono text-xs text-blue-700 bg-blue-50 rounded px-1.5 py-0.5 shrink-0"
                          >{{ '{{' + variable.key + '}}' }}</span
                        >
                        <span class="text-xs text-slate-600 truncate">{{
                          variable.description
                        }}</span>
                      </button>
                    }
                  </div>
                }
              </div>
            }
          </div>
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
  protected readonly store = inject(AgreementTemplateStore);
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
  protected readonly variablesExpanded = signal(false);

  private readonly contentTextarea = viewChild<{ nativeElement: HTMLTextAreaElement }>(
    'contentTextarea',
  );

  ngOnInit(): void {
    this.store.loadVariables();

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

  insertVariable(key: string): void {
    if (this.data.readonly) return;

    const placeholder = `{{${key}}}`;
    const textarea = this.contentTextarea()?.nativeElement;
    const control = this.form.controls.content;
    const current = control.value;

    if (!textarea) {
      control.setValue(current + placeholder);
      return;
    }

    const start = textarea.selectionStart ?? current.length;
    const end = textarea.selectionEnd ?? current.length;
    const next = current.slice(0, start) + placeholder + current.slice(end);
    control.setValue(next);
    control.markAsDirty();

    const cursor = start + placeholder.length;
    queueMicrotask(() => {
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  private resolveTitle(): string {
    if (this.data.readonly) return Labels.ViewAgreementDialogTitle;
    return this.data.templateId != null
      ? Labels.EditAgreementDialogTitle
      : Labels.CreateAgreementDialogTitle;
  }
}
