import { ChangeDetectionStrategy, Component, inject, LOCALE_ID, OnInit } from '@angular/core';
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
import { SaveButtonComponent } from '../../../shared/components/save-button/save-button.component';
import { CancelButtonComponent } from '../../../shared/components/cancel-button/cancel-button.component';
import { Labels } from '../../../shared/constant/labels';
import { FormErrorMessages } from '../../../shared/validators/form-error-messages';
import { formatDate } from '@angular/common';
import { parseDate } from '../../../shared/utils/date.util';
import { EquipmentTypeDropdownComponent } from '../../../shared/components/equipment-type-dropdown/equipment-type-dropdown.component';
import { Equipment, EquipmentStatus, EquipmentType, EquipmentWrite } from '@ui-models';
import { EquipmentStore } from '@store.equipment.store';

export interface EquipmentDialogData {
  equipment?: Equipment;
  types: EquipmentType[];
  statuses: EquipmentStatus[];
}

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

        <app-equipment-type-dropdown
          formControlName="typeSlug"
          class="w-full"
          [showAll]="false"
        ></app-equipment-type-dropdown>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>
            @if (data.equipment) {
              <span
                >{{ labels.TransitionFrom }} '{{ currentStatusName }}'
                {{ labels.TransitionTo }}</span
              >
            } @else {
              <span>{{ labels.Status }}</span>
            }
          </mat-label>
          <span
            [matTooltip]="statusSelectDisabled ? labels.NoTransitionsAvailable : ''"
            matTooltipShowDelay="200"
          >
            <mat-select formControlName="statusSlug" [disabled]="statusSelectDisabled">
              @for (s of statusOptions; track s.slug) {
                <mat-option [value]="s.slug">{{ s.name }}</mat-option>
              }
            </mat-select>
          </span>
          @if (statusSelectDisabled) {
            <mat-hint>{{ labels.NoTransitionsAvailable }}</mat-hint>
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
          <mat-label>{{ labels.Condition }}</mat-label>
          <textarea matInput formControlName="condition" rows="3"></textarea>
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
export class EquipmentDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<EquipmentDialogComponent>);
  private store = inject(EquipmentStore);
  readonly data = inject<EquipmentDialogData>(MAT_DIALOG_DATA);
  private snackBar = inject(MatSnackBar);

  readonly labels = Labels;
  readonly errors = FormErrorMessages;

  readonly dateFormatHint = formatDate(new Date(), 'shortDate', inject(LOCALE_ID));

  readonly saving = this.store.saving;

  form = new FormGroup({
    serialNumber: new FormControl(this.data?.equipment?.serialNumber ?? '', [
      Validators.required,
      Validators.maxLength(50),
    ]),
    uid: new FormControl(this.data?.equipment?.uid ?? '', [Validators.maxLength(100)]),
    typeSlug: new FormControl(this.data?.equipment?.type.slug ?? '', [Validators.required]),
    statusSlug: new FormControl(this.data?.equipment?.status.slug ?? ''),
    model: new FormControl(this.data?.equipment?.model ?? '', [Validators.maxLength(200)]),
    commissionedAt: new FormControl({
      value: parseDate((this.data?.equipment?.commissionedAt as unknown as string) ?? null),
      disabled: !this.data?.equipment?.id,
    }),
    condition: new FormControl(this.data?.equipment?.condition ?? ''),
  });

  get statusOptions(): EquipmentStatus[] {
    const currentStatus = this.data?.equipment?.status;
    if (!currentStatus) {
      return this.data.statuses;
    }

    const current = this.data.statuses.find((s) => s === currentStatus);
    const allowed = new Set(current?.allowedTransitions ?? []);

    return this.data.statuses.filter((s) => s === currentStatus || allowed.has(s.slug ?? ''));
  }

  get currentStatusName(): string {
    const status = this.data?.equipment?.status;
    if (!status) return '';
    return this.data.statuses.find((s) => s === status)?.name ?? status.name;
  }

  get statusSelectDisabled(): boolean {
    const currentSlug = this.data?.equipment?.status.slug;
    if (!currentSlug) return false;
    const options = this.statusOptions.map((s) => s.slug);
    return options.length <= 1;
  }

  ngOnInit(): void {
    this.syncStatusControl();
  }

  private syncStatusControl(): void {
    const ctrl = this.form.get('statusSlug');
    if (!ctrl) return;
    const shouldDisable = this.statusSelectDisabled;
    if (shouldDisable && ctrl.enabled) {
      ctrl.disable({ emitEvent: false });
    } else if (!shouldDisable && ctrl.disabled) {
      ctrl.enable({ emitEvent: false });
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const write = this.form.getRawValue() as EquipmentWrite;

    // const write: EquipmentWrite = {
    //   serialNumber: raw.serialNumber ?? '',
    //   uid: raw.uid || undefined,
    //   typeSlug: raw.typeSlug || undefined,
    //   statusSlug: raw.statusSlug || undefined,
    //   model: raw.model || undefined,
    //   commissionedAt: raw.commissionedAt
    //     ? (toIsoDate(raw.commissionedAt) as unknown as Date)
    //     : undefined,
    //   condition: raw.condition || undefined,
    // };

    const op$ = this.data?.equipment?.id
      ? this.store.update(this.data.equipment.id, write)
      : this.store.create(write);

    op$.subscribe({
      next: () => {
        const msg = this.data?.equipment
          ? $localize`Equipment updated`
          : $localize`Equipment created`;
        this.snackBar.open(msg, this.labels.Close, { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: () => {
        this.snackBar.open($localize`Failed to save equipment`, this.labels.Close, {
          duration: 4000,
        });
      },
    });
  }
}
