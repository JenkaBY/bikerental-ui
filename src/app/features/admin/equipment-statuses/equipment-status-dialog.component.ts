import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EquipmentStatusService } from '../../../core/api';
import { EquipmentStatusRequest, EquipmentStatusResponse } from '../../../core/models';
import { FormErrorMessages } from '../../../shared/validators/form-error-messages';
import { SlugValidators } from '../../../shared/validators/slug-validators';

export interface EquipmentStatusDialogData {
  status?: EquipmentStatusResponse;
  statuses: EquipmentStatusResponse[];
}

@Component({
  selector: 'app-equipment-status-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>
      @if (data.status) {
        <span i18n>Edit status</span>
      } @else {
        <span i18n>Create status</span>
      }
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4 min-w-100 pt-1">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label i18n>Slug</mat-label>
          <input matInput formControlName="slug" placeholder="e.g. available" />
          @if (form.controls.slug.hasError('required')) {
            <mat-error>{{ errors.slugRequired }}</mat-error>
          }
          @if (form.controls.slug.hasError('pattern')) {
            <mat-error>{{ errors.slugPattern }}</mat-error>
          }
          @if (form.controls.slug.hasError('maxlength')) {
            <mat-error>{{ errors.slugMaxLength }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label i18n>Name</mat-label>
          <input matInput formControlName="name" />
          @if (form.controls.name.hasError('required')) {
            <mat-error>{{ errors.nameRequired }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label i18n>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label i18n>Allowed transitions</mat-label>
          <mat-select formControlName="allowedTransitions" multiple>
            @for (opt of transitionOptions; track opt.slug) {
              <mat-option [value]="opt.slug">{{ opt.name }} ({{ opt.slug }})</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close i18n>Cancel</button>
      <button
        mat-raised-button
        color="primary"
        (click)="save()"
        [disabled]="saving() || form.invalid"
      >
        @if (saving()) {
          <span i18n>Saving...</span>
        } @else {
          <span i18n>Save</span>
        }
      </button>
    </mat-dialog-actions>
  `,
})
export class EquipmentStatusDialogComponent {
  private dialogRef = inject(MatDialogRef<EquipmentStatusDialogComponent>);
  readonly data = inject<EquipmentStatusDialogData>(MAT_DIALOG_DATA);
  private service = inject(EquipmentStatusService);
  private snackBar = inject(MatSnackBar);

  readonly errors = FormErrorMessages;
  saving = signal(false);

  form = new FormGroup({
    slug: new FormControl(
      { value: this.data?.status?.slug ?? '', disabled: !!this.data?.status },
      SlugValidators,
    ),
    name: new FormControl(this.data?.status?.name ?? '', [Validators.required]),
    description: new FormControl(this.data?.status?.description ?? ''),
    allowedTransitions: new FormControl<string[]>(this.data?.status?.allowedTransitions ?? []),
  });

  get transitionOptions(): EquipmentStatusResponse[] {
    const selfSlug = this.data?.status?.slug;
    return selfSlug ? this.data.statuses.filter((s) => s.slug !== selfSlug) : this.data.statuses;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    const { slug, name, description, allowedTransitions } = this.form.getRawValue();
    const request: EquipmentStatusRequest = {
      name: name ?? '',
      description: description || undefined,
      allowedTransitions: allowedTransitions ?? [],
    };

    let operation$;
    if (this.isCreateMode()) {
      operation$ = this.service.create({ slug: slug ?? '', ...request });
    } else {
      operation$ = this.service.update(this.data.status!.slug, request);
    }

    operation$.subscribe({
      next: () => {
        const message = this.isCreateMode()
          ? $localize`Equipment status created`
          : $localize`Equipment status updated`;
        this.snackBar.open(message, $localize`Close`, { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err: unknown) => {
        console.log('Error saving equipment status', err);
        this.saving.set(false);
        this.snackBar.open($localize`Failed to save equipment status`, $localize`Close`, {
          duration: 4000,
        });
      },
    });
  }

  private isCreateMode(): boolean {
    return !this.data?.status;
  }
}
