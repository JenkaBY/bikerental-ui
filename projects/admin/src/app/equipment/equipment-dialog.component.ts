import { ChangeDetectionStrategy, Component, inject, LOCALE_ID } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ApiErrorParser,
  applyServerErrors,
  CancelButtonComponent,
  clearServerErrors,
  EQUIPMENT_CONDITIONS,
  EquipmentStore,
  EquipmentTypeDropdownComponent,
  ErrorCode,
  ErrorMessageResolver,
  FormErrorMessages,
  Labels,
  NotificationService,
  parseDate,
  SaveButtonComponent,
  suppressErrorNotification,
} from '@bikerental/shared';
import { formatDate } from '@angular/common';
import {
  Equipment,
  EquipmentConditionSlug,
  EquipmentType,
  EquipmentWrite,
  Point,
} from '@ui-models';

export interface EquipmentDialogData {
  equipment?: Equipment;
  types: EquipmentType[];
  points: Point[];
}

const POINT_ERROR_CODES = new Set<string>([
  ErrorCode.EQUIPMENT_POINT_REQUIRED,
  ErrorCode.EQUIPMENT_POINT_NOT_ACCEPTING,
]);

@Component({
  selector: 'app-equipment-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatIconModule,
    MatNativeDateModule,
    MatButtonModule,
    EquipmentTypeDropdownComponent,
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
      <form [formGroup]="form" class="grid grid-cols-2 gap-4 min-w-100 pt-1">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>{{ labels.SerialNumber }}</mat-label>
          <input matInput formControlName="serialNumber" maxlength="50" />
          @if (form.controls.serialNumber.hasError('maxlength')) {
            <mat-error>{{ errors.serialNumberMaxLength }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>{{ labels.Uid }}</mat-label>
          <input matInput formControlName="uid" maxlength="100" />
        </mat-form-field>

        <app-equipment-type-dropdown
          formControlName="typeSlug"
          class="w-full"
          [showAll]="false"
        ></app-equipment-type-dropdown>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>{{ labels.Condition }}</mat-label>
          <mat-select formControlName="conditionSlug">
            @for (cond of conditionOptions; track cond.slug) {
              <mat-option [value]="cond.slug">{{ cond.name }}</mat-option>
            }
          </mat-select>
          @if (form.controls.conditionSlug.hasError('required')) {
            <mat-error>{{ errors.conditionIsRequired }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full col-span-2">
          <mat-label>{{ labels.EquipmentPoint }}</mat-label>
          <mat-select formControlName="pointSlug">
            @for (point of pointOptions; track point.slug) {
              <mat-option [value]="point.slug">{{ point.name }}</mat-option>
            }
          </mat-select>
          @if (form.controls.pointSlug.hasError('required')) {
            <mat-error>{{ errors.pointRequired }}</mat-error>
          }
          @if (form.controls.pointSlug.hasError('server')) {
            <mat-error>{{ form.controls.pointSlug.getError('server') }}</mat-error>
          }
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
          <mat-hint>{{ labels.FormatDate }} {{ dateFormatHint }}</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full col-span-2">
          <mat-label>{{ labels.ConditionNotes }}</mat-label>
          <textarea matInput formControlName="conditionNotes" rows="3"></textarea>
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
  private store = inject(EquipmentStore);
  readonly data = inject<EquipmentDialogData>(MAT_DIALOG_DATA);
  private snackBar = inject(MatSnackBar);
  private notifications = inject(NotificationService);
  private resolver = new ErrorMessageResolver();

  readonly labels = Labels;
  readonly errors = FormErrorMessages;

  readonly dateFormatHint = formatDate(new Date(), 'shortDate', inject(LOCALE_ID));

  readonly saving = this.store.saving;

  form = new FormGroup({
    serialNumber: new FormControl(this.data?.equipment?.serialNumber ?? '', [
      Validators.maxLength(50),
    ]),
    uid: new FormControl(this.data?.equipment?.uid ?? '', [Validators.maxLength(100)]),
    typeSlug: new FormControl(this.data?.equipment?.type.slug ?? '', [Validators.required]),
    model: new FormControl(this.data?.equipment?.model ?? '', [Validators.maxLength(200)]),
    commissionedAt: new FormControl({
      value: parseDate((this.data?.equipment?.commissionedAt as unknown as string) ?? null),
      disabled: !this.data?.equipment,
    }),
    conditionSlug: new FormControl<EquipmentConditionSlug>(
      this.data?.equipment?.condition?.slug ?? ('GOOD' as EquipmentConditionSlug),
      [Validators.required],
    ),
    conditionNotes: new FormControl(this.data?.equipment?.conditionNotes ?? ''),
    pointSlug: new FormControl(this.data?.equipment?.pointSlug ?? '', [Validators.required]),
  });

  readonly pointOptions = (this.data?.points ?? []).filter(
    (p) => p.status !== 'PERMANENTLY_CLOSED' || p.slug === this.data?.equipment?.pointSlug,
  );

  readonly conditionOptions = EQUIPMENT_CONDITIONS;

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    clearServerErrors(this.form);

    const raw = this.form.getRawValue();
    const write: EquipmentWrite = {
      serialNumber: raw.serialNumber ?? '',
      uid: raw.uid || undefined,
      typeSlug: raw.typeSlug || undefined,
      model: raw.model || undefined,
      commissionedAt: raw.commissionedAt ?? undefined,
      conditionSlug: raw.conditionSlug ?? undefined,
      conditionNotes: raw.conditionNotes || undefined,
      pointSlug: raw.pointSlug ?? '',
    };

    const options = { context: suppressErrorNotification() };
    const op$ = this.data?.equipment?.id
      ? this.store.update(this.data.equipment.id, write, options)
      : this.store.create(write, options);

    op$.subscribe({
      next: () => {
        const msg = this.data?.equipment
          ? $localize`Equipment updated`
          : $localize`Equipment created`;
        this.snackBar.open(msg, this.labels.Close, { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err: unknown) => this.handleSaveError(err),
    });
  }

  private handleSaveError(err: unknown): void {
    const apiError = ApiErrorParser.parse(err);
    const message = this.resolver.resolve(apiError);
    if (POINT_ERROR_CODES.has(apiError.code)) {
      this.form.controls.pointSlug.setErrors({ server: message });
      this.form.controls.pointSlug.markAsTouched();
      return;
    }
    const summary = applyServerErrors(this.form, apiError);
    if (summary.length) {
      this.notifications.error(summary.join(' '));
    } else if (apiError.fieldErrors.length === 0) {
      this.notifications.error(message);
    }
  }
}
