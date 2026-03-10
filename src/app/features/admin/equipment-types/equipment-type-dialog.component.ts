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
import { SlugValidators } from '../../../shared/validators/slug-validators';

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
  ],
  template: `
    <h2 mat-dialog-title>
      @if (data.type) {
        <span i18n>Edit</span>
      } @else {
        <span i18n>Create</span>
      }
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4 min-w-100 pt-1">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label i18n>Slug</mat-label>
          <input matInput formControlName="slug" placeholder="e.g. bike" />
          @if (form.controls.slug.hasError('required')) {
            <mat-error i18n>Slug is required</mat-error>
          }
          @if (form.controls.slug.hasError('pattern')) {
            <mat-error i18n>Only lowercase letters, numbers, hyphens and underscores</mat-error>
          }
          @if (form.controls.slug.hasError('maxlength')) {
            <mat-error i18n>Maximum 50 characters</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label i18n>Name</mat-label>
          <input matInput formControlName="name" />
          @if (form.controls.name.hasError('required')) {
            <mat-error i18n>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label i18n>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
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
export class EquipmentTypeDialogComponent {
  private dialogRef = inject(MatDialogRef<EquipmentTypeDialogComponent>);
  readonly data = inject<EquipmentTypeDialogData>(MAT_DIALOG_DATA);
  private service = inject(EquipmentTypeService);
  private snackBar = inject(MatSnackBar);

  saving = signal(false);

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
      error: (err: unknown) => {
        console.log('Error saving equipment type', err);
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
