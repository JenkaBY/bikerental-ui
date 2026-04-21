import {
  ChangeDetectionStrategy,
  Component,
  inject,
  LOCALE_ID,
  OnInit,
  signal,
} from '@angular/core';
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
import { EquipmentService } from '../../../core/api';
import { SaveButtonComponent } from '../../../shared/components/save-button/save-button.component';
import { CancelButtonComponent } from '../../../shared/components/cancel-button/cancel-button.component';
import { Labels } from '../../../shared/constant/labels';
import { FormErrorMessages } from '../../../shared/validators/form-error-messages';
import { formatDate } from '@angular/common';
import { parseDate, toIsoDate } from '../../../shared/utils/date.util';
import { EquipmentTypeDropdownComponent } from '../../../shared/components/equipment-type-dropdown/equipment-type-dropdown.component';
import { EquipmentRequest, EquipmentResponse, EquipmentStatusResponse } from '@api-models';
import { EquipmentType } from '@ui-models';

export interface EquipmentDialogData {
  equipment?: EquipmentResponse;
  types: EquipmentType[];
  statuses: EquipmentStatusResponse[];
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
          <mat-hint>{{ Labels.FormatDate }} {{ dateFormatHint }}</mat-hint>
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
  readonly data = inject<EquipmentDialogData>(MAT_DIALOG_DATA);
  private service = inject(EquipmentService);
  private snackBar = inject(MatSnackBar);

  readonly labels = Labels;
  readonly errors = FormErrorMessages;

  readonly dateFormatHint = formatDate(new Date(), 'shortDate', inject(LOCALE_ID));

  saving = signal(false);

  form = new FormGroup({
    serialNumber: new FormControl(this.data?.equipment?.serialNumber ?? '', [
      Validators.required,
      Validators.maxLength(50),
    ]),
    uid: new FormControl(this.data?.equipment?.uid ?? '', [Validators.maxLength(100)]),
    typeSlug: new FormControl(this.data?.equipment?.type ?? '', [Validators.required]),
    statusSlug: new FormControl(this.data?.equipment?.status ?? ''),
    model: new FormControl(this.data?.equipment?.model ?? '', [Validators.maxLength(200)]),
    commissionedAt: new FormControl({
      value: parseDate((this.data?.equipment?.commissionedAt as unknown as string) ?? null),
      disabled: !this.data?.equipment?.id,
    }),
    condition: new FormControl(this.data?.equipment?.condition ?? ''),
  });

  get statusOptions(): EquipmentStatusResponse[] {
    const currentStatusSlug = this.data?.equipment?.status;
    if (!currentStatusSlug) {
      // create mode or no status set - allow selecting any status
      return this.data.statuses;
    }

    const current = this.data.statuses.find((s) => s.slug === currentStatusSlug);
    const allowed = new Set(current?.allowedTransitions ?? []);

    // include current status itself plus any statuses allowed from it
    return this.data.statuses.filter(
      (s) => s.slug === currentStatusSlug || allowed.has(s.slug ?? ''),
    );
  }

  get currentStatusName(): string {
    const slug = this.data?.equipment?.status;
    if (!slug) return '';
    return this.data.statuses.find((s) => s.slug === slug)?.name ?? slug;
  }

  get statusSelectDisabled(): boolean {
    const currentSlug = this.data?.equipment?.status;
    if (!currentSlug) return false; // create mode - keep enabled
    // If allowed transitions is empty or contains only the current status, disable
    const options = this.statusOptions.map((s) => s.slug);
    return options.length <= 1;
  }

  constructor() {
    // keep constructor light; sync in ngOnInit
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

    this.saving.set(true);

    const raw = this.form.getRawValue();

    const request: EquipmentRequest = {
      serialNumber: raw.serialNumber ?? '',
      uid: raw.uid || undefined,
      typeSlug: raw.typeSlug || undefined,
      statusSlug: raw.statusSlug || undefined,
      model: raw.model || undefined,
      commissionedAt: raw.commissionedAt
        ? (toIsoDate(raw.commissionedAt) as unknown as Date)
        : undefined,
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

  protected readonly Labels = Labels;
}
