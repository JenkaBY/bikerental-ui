import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EquipmentTypeService } from '../../../core/api';
import {
  EquipmentTypeRequest,
  EquipmentTypeResponse,
  EquipmentTypeUpdateRequest,
} from '../../../core/models';
import { FormErrorMessages } from '../../../shared/validators/form-error-messages';
import { SlugValidators } from '../../../shared/validators/slug-validators';
import { SaveButtonComponent } from '../../../shared/components/save-button/save-button.component';
import { CancelButtonComponent } from '../../../shared/components/save-button/cancel-button.component';
import { Labels } from '../../../shared/components/save-button/labels';

export interface EquipmentTypeDialogData {
  type?: EquipmentTypeResponse;
}

@Component({
  selector: 'app-equipment-type-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    SaveButtonComponent,
    CancelButtonComponent,
  ],
  template: `
    <h2 mat-dialog-title>
      @if (data.type) {
        <span>{{ labels.Edit }}</span>
      } @else {
        <span i18n>{{ labels.Create }}</span>
      }
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4 min-w-100 pt-1">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>{{ labels.Slug }}</mat-label>
          <input matInput formControlName="slug" placeholder="e.g. bike" />
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
          <mat-label>{{ labels.Name }}</mat-label>
          <input matInput formControlName="name" />
          @if (form.controls.name.hasError('required')) {
            <mat-error>{{ errors.nameRequired }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>{{ labels.Description }}</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <app-form-cancel-button />
      <app-form-save-button
        [saving]="saving()"
        [disabled]="form.invalid"
        (save)="save()"
      ></app-form-save-button>
    </mat-dialog-actions>
  `,
})
export class EquipmentTypeDialogComponent {
  private dialogRef = inject(MatDialogRef<EquipmentTypeDialogComponent>);
  readonly data = inject<EquipmentTypeDialogData>(MAT_DIALOG_DATA);
  private service = inject(EquipmentTypeService);
  private snackBar = inject(MatSnackBar);

  readonly errors = FormErrorMessages;
  saving = signal(false);
  readonly labels = Labels;

  form = new FormGroup({
    slug: new FormControl(
      { value: this.data?.type?.slug ?? '', disabled: !!this.data?.type },
      SlugValidators,
    ),
    name: new FormControl(this.data?.type?.name ?? '', [Validators.required]),
    description: new FormControl(this.data?.type?.description ?? ''),
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    const { slug, name, description } = this.form.getRawValue();
    const request = { name: name ?? '', description: description || undefined };
    let operation$;
    if (this.isCreateMode()) {
      const req = { slug: slug, ...request } as EquipmentTypeRequest;
      operation$ = this.service.create(req);
    } else {
      operation$ = this.service.update(this.data.type!.slug, request as EquipmentTypeUpdateRequest);
    }

    operation$.subscribe({
      next: () => {
        // Show success toast for create or update
        const message = this.isCreateMode()
          ? $localize`Equipment type created`
          : $localize`Equipment type updated`;
        this.snackBar.open(message, $localize`Close`, { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open($localize`Failed to save equipment type`, $localize`Close`, {
          duration: 4000,
        });
      },
    });
  }

  private isCreateMode(): boolean {
    return !this.data?.type;
  }
}
