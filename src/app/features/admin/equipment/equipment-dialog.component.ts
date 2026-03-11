import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EquipmentService } from '../../../core/api';
import {
  EquipmentRequest,
  EquipmentResponse,
  EquipmentStatusResponse,
  EquipmentTypeResponse,
} from '../../../core/models';
import { SaveButtonComponent } from '../../../shared/components/save-button/save-button.component';
import { CancelButtonComponent } from '../../../shared/components/cancel-button/cancel-button.component';
import { Labels } from '../../../shared/constant/labels';
import { FormErrorMessages } from '../../../shared/validators/form-error-messages';

export interface EquipmentDialogData {
  equipment?: EquipmentResponse;
  types: EquipmentTypeResponse[];
  statuses: EquipmentStatusResponse[];
}

@Component({
  selector: 'app-equipment-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    SaveButtonComponent,
    CancelButtonComponent,
  ],
  template: `
    <h2 mat-dialog-title>
      @if (data.equipment) {
        <span>{{ labels.Edit }}</span>
      } @else {
        <span>{{ labels.Create }}</span>
      }
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4 min-w-100 pt-1">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>{{ labels.SerialNumber }}</mat-label>
          <input matInput formControlName="serialNumber" maxlength="50" />
          @if (form.controls.serialNumber.hasError('required')) {
            <mat-error>{{ errors.serialNumberRequired }}</mat-error>
          }
          @if (form.controls.serialNumber.hasError('maxlength')) {
            <mat-error>{{ errors.serialNumberMaxLength }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>{{ labels.Uid }}</mat-label>
          <input matInput formControlName="uid" maxlength="100" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>{{ labels.Type }}</mat-label>
          <mat-select formControlName="typeSlug">
            @for (t of data.types; track t.slug) {
              <mat-option [value]="t.slug">{{ t.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>{{ labels.Status }}</mat-label>
          <mat-select formControlName="statusSlug">
            @for (s of data.statuses; track s.slug) {
              <mat-option [value]="s.slug">{{ s.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>{{ labels.Model }}</mat-label>
          <input matInput formControlName="model" maxlength="200" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>{{ labels.CommissionedAt }}</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="commissionedAt" />
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>{{ labels.Condition }}</mat-label>
          <input matInput formControlName="condition" />
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
export class EquipmentDialogComponent {
  private dialogRef = inject(MatDialogRef<EquipmentDialogComponent>);
  readonly data = inject<EquipmentDialogData>(MAT_DIALOG_DATA);
  private service = inject(EquipmentService);
  private snackBar = inject(MatSnackBar);

  readonly labels = Labels;
  readonly errors = FormErrorMessages;

  saving = signal(false);

  form = new FormGroup({
    serialNumber: new FormControl(this.data?.equipment?.serialNumber ?? '', [
      Validators.required,
      Validators.maxLength(50),
    ]),
    uid: new FormControl(this.data?.equipment?.uid ?? '', [Validators.maxLength(100)]),
    typeSlug: new FormControl(this.data?.equipment?.type ?? ''),
    statusSlug: new FormControl(this.data?.equipment?.status ?? ''),
    model: new FormControl(this.data?.equipment?.model ?? '', [Validators.maxLength(200)]),
    commissionedAt: new FormControl(
      this.parseCommissionedAt(this.data?.equipment?.commissionedAt ?? null),
    ),
    condition: new FormControl(this.data?.equipment?.condition ?? ''),
  });

  private parseCommissionedAt(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    // Ensure parsing as local date (avoid timezone shifts)
    try {
      return new Date(dateStr + 'T00:00:00');
    } catch {
      return null;
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    const raw = this.form.getRawValue();

    const request: EquipmentRequest = {
      serialNumber: raw.serialNumber ?? '',
      uid: raw.uid || undefined,
      typeSlug: raw.typeSlug || undefined,
      statusSlug: raw.statusSlug || undefined,
      model: raw.model || undefined,
      commissionedAt: raw.commissionedAt ? this.formatDate(raw.commissionedAt) : undefined,
      condition: raw.condition || undefined,
    };

    let op$;
    if (this.data?.equipment?.id) {
      op$ = this.service.update(this.data.equipment.id, request);
    } else {
      op$ = this.service.create(request);
    }

    op$.subscribe({
      next: () => {
        const msg = this.data?.equipment
          ? $localize`Equipment updated`
          : $localize`Equipment created`;
        this.snackBar.open(msg, this.labels.Close, { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open($localize`Failed to save equipment`, this.labels.Close, {
          duration: 4000,
        });
      },
    });
  }

  private formatDate(d: Date): string {
    // YYYY-MM-DD
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
