import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { TariffService } from '../../../core/api';
import { Tariff, TariffWrite } from '../../../core/domain';
import { PricingType } from '../../../core/models';
import { EquipmentTypeDropdownComponent } from '../../../shared/components/equipment-type-dropdown/equipment-type-dropdown.component';
import { SaveButtonComponent } from '../../../shared/components/save-button/save-button.component';
import { CancelButtonComponent } from '../../../shared/components/cancel-button/cancel-button.component';
import { Labels } from '../../../shared/constant/labels';
import { FormErrorMessages } from '../../../shared/validators/form-error-messages';
import { DegressiveHourlyParamsComponent } from './degressive-hourly-params.component';
import { FlatHourlyParamsComponent } from './flat-hourly-params.component';
import { DailyParamsComponent } from './daily-params.component';
import { FlatFeeParamsComponent } from './flat-fee-params.component';
import { SpecialParamsComponent } from './special-params.component';

export interface TariffDialogData {
  tariff?: Tariff;
}

const minimumHourlyPriceValidator: ValidatorFn = (
  group: AbstractControl,
): ValidationErrors | null => {
  const g = group as FormGroup & { controls: Record<string, AbstractControl> };
  const first = g.controls['firstHourPrice']?.value as number | null;
  const min = g.controls['minimumHourlyPrice']?.value as number | null;
  if (first != null && min != null && min > first) {
    return { minimumExceedsFirst: true };
  }
  return null;
};

@Component({
  selector: 'app-tariff-dialog',
  standalone: true,
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
    EquipmentTypeDropdownComponent,
    DegressiveHourlyParamsComponent,
    FlatHourlyParamsComponent,
    DailyParamsComponent,
    FlatFeeParamsComponent,
    SpecialParamsComponent,
    SaveButtonComponent,
    CancelButtonComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.tariff ? labels.EditTariff : labels.CreateTariff }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="grid grid-cols-2 gap-4 min-w-150 pt-1">
        <mat-form-field appearance="outline" class="col-span-2">
          <mat-label>{{ labels.Name }}</mat-label>
          <input matInput formControlName="name" maxlength="200" />
          @if (form.controls.name.hasError('required')) {
            <mat-error>{{ errors.nameRequired }}</mat-error>
          }
          @if (form.controls.name.hasError('maxlength')) {
            <mat-error>{{ errors.nameMaxLength }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="col-span-2">
          <mat-label>{{ labels.Description }}</mat-label>
          <textarea matInput formControlName="description" rows="3" maxlength="1000"></textarea>
        </mat-form-field>

        <app-equipment-type-dropdown
          formControlName="equipmentTypeSlug"
        ></app-equipment-type-dropdown>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>{{ labels.PricingType }}</mat-label>
          <mat-select formControlName="pricingType">
            @for (pt of pricingTypes(); track pt) {
              <mat-option [value]="pt">{{ pt }}</mat-option>
            }
          </mat-select>
          @if (form.controls.pricingType.hasError('required')) {
            <mat-error>{{ errors.pricingTypeRequired }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>{{ labels.ValidFrom }}</mat-label>
          <input matInput [matDatepicker]="fromPicker" formControlName="validFrom" />
          <mat-datepicker-toggle matSuffix [for]="fromPicker"></mat-datepicker-toggle>
          <mat-datepicker #fromPicker></mat-datepicker>
          @if (form.controls.validFrom.hasError('required')) {
            <mat-error>{{ errors.validFromRequired }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>{{ labels.ValidTo }}</mat-label>
          <input matInput [matDatepicker]="toPicker" formControlName="validTo" />
          <mat-datepicker-toggle matSuffix [for]="toPicker"></mat-datepicker-toggle>
          <mat-datepicker #toPicker></mat-datepicker>
          <mat-hint>{{ labels.NoEndDate }}</mat-hint>
        </mat-form-field>

        <div formGroupName="params" class="col-span-2">
          @switch (form.controls.pricingType.value) {
            @case ('DEGRESSIVE_HOURLY') {
              <app-degressive-hourly-params
                [group]="form.controls.params"
              ></app-degressive-hourly-params>
            }
            @case ('FLAT_HOURLY') {
              <app-flat-hourly-params [group]="form.controls.params"></app-flat-hourly-params>
            }
            @case ('DAILY') {
              <app-daily-params [group]="form.controls.params"></app-daily-params>
            }
            @case ('FLAT_FEE') {
              <app-flat-fee-params [group]="form.controls.params"></app-flat-fee-params>
            }
            @case ('SPECIAL') {
              <app-special-params></app-special-params>
            }
          }
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <app-form-cancel-button />
      <app-form-save-button [saving]="saving()" [disabled]="form.invalid" (save)="save()" />
    </mat-dialog-actions>
  `,
})
export class TariffDialogComponent {
  private dialogRef = inject(MatDialogRef<TariffDialogComponent>);
  readonly data = inject<TariffDialogData>(MAT_DIALOG_DATA);
  private tariffService = inject(TariffService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  readonly labels = Labels;
  readonly errors = FormErrorMessages;

  saving = signal(false);

  // pricing types are loaded from the backend via TariffService.getPricingTypes()
  readonly pricingTypes = signal<PricingType[]>([]);
  form = new FormGroup({
    name: new FormControl(this.data?.tariff?.name ?? '', [
      Validators.required,
      Validators.maxLength(200),
    ]),
    description: new FormControl(this.data?.tariff?.description ?? '', [
      Validators.maxLength(1000),
    ]),
    equipmentTypeSlug: new FormControl(this.data?.tariff?.equipmentType ?? ''),
    pricingType: new FormControl(this.data?.tariff?.pricingType ?? '', [Validators.required]),
    validFrom: new FormControl(this.data?.tariff ? this.data.tariff.validFrom : null, [
      Validators.required,
    ]),
    validTo: new FormControl(this.data?.tariff?.validTo ?? null),
    params: new FormGroup({
      firstHourPrice: new FormControl<number | null>(null, [Validators.min(0.01)]),
      hourlyDiscount: new FormControl<number | null>(null, [Validators.min(0.01)]),
      minimumHourlyPrice: new FormControl<number | null>(null, [Validators.min(0.01)]),
      hourlyPrice: new FormControl<number | null>(null, [Validators.min(0.01)]),
      dailyPrice: new FormControl<number | null>(null, [Validators.min(0.01)]),
      overtimeHourlyPrice: new FormControl<number | null>(null, [Validators.min(0.01)]),
      issuanceFee: new FormControl<number | null>(null, [Validators.min(0)]),
      minimumDurationMinutes: new FormControl<number | null>(null, [Validators.min(1)]),
      minimumDurationSurcharge: new FormControl<number | null>(null, [Validators.min(0.01)]),
    }),
  });

  get params() {
    return (this.form.controls.params as FormGroup).controls;
  }

  constructor() {
    this.tariffService
      .getPricingTypes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((types) => {
        const slugs: PricingType[] = (types || []).map(
          (t: unknown) => (t as { slug: string }).slug as PricingType,
        );
        this.pricingTypes.set(slugs);
      });

    const pricingControl = this.form.controls.pricingType;
    (pricingControl as AbstractControl).valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((t) => this.applyParamValidators(t as PricingType));

    if (this.data?.tariff) {
      const p = (this.data.tariff as Partial<Tariff>)?.params ?? {};
      (this.form.controls.params as FormGroup).patchValue({
        firstHourPrice: p.firstHourPrice ?? null,
        hourlyDiscount: p.hourlyDiscount ?? null,
        minimumHourlyPrice: p.minimumHourlyPrice ?? null,
        hourlyPrice: p.hourlyPrice ?? null,
        dailyPrice: p.dailyPrice ?? null,
        overtimeHourlyPrice: p.overtimeHourlyPrice ?? null,
        issuanceFee: p.issuanceFee ?? null,
        minimumDurationMinutes: p.minimumDurationMinutes ?? null,
        minimumDurationSurcharge: p.minimumDurationSurcharge ?? null,
      });
      this.applyParamValidators(this.form.controls.pricingType.value as PricingType);
    }
  }

  private applyParamValidators(type: PricingType | null | undefined): void {
    const paramsGroup = this.form.controls.params as FormGroup;
    const p = paramsGroup.controls as Record<string, AbstractControl>;

    // reset to min-only validators first
    p['firstHourPrice'].setValidators([Validators.min(0.01)]);
    p['hourlyDiscount'].setValidators([Validators.min(0.01)]);
    p['minimumHourlyPrice'].setValidators([Validators.min(0.01)]);
    p['hourlyPrice'].setValidators([Validators.min(0.01)]);
    p['dailyPrice'].setValidators([Validators.min(0.01)]);
    p['overtimeHourlyPrice'].setValidators([Validators.min(0.01)]);
    p['issuanceFee'].setValidators([Validators.min(0)]);
    p['minimumDurationMinutes'].setValidators([Validators.min(1)]);
    p['minimumDurationSurcharge'].setValidators([Validators.min(0.01)]);

    paramsGroup.clearValidators();

    switch (type) {
      case 'DEGRESSIVE_HOURLY':
        p['firstHourPrice'].setValidators([Validators.required, Validators.min(0.01)]);
        p['hourlyDiscount'].setValidators([Validators.required, Validators.min(0.01)]);
        p['minimumHourlyPrice'].setValidators([Validators.required, Validators.min(0.01)]);
        paramsGroup.setValidators(minimumHourlyPriceValidator);
        break;
      case 'FLAT_HOURLY':
        p['hourlyPrice'].setValidators([Validators.required, Validators.min(0.01)]);
        break;
      case 'DAILY':
        p['dailyPrice'].setValidators([Validators.required, Validators.min(0.01)]);
        break;
      case 'FLAT_FEE':
        p['issuanceFee'].setValidators([Validators.required, Validators.min(0)]);
        p['minimumDurationMinutes'].setValidators([Validators.required, Validators.min(1)]);
        break;
      case 'SPECIAL':
      default:
        break;
    }

    Object.values(p).forEach((c) => c.updateValueAndValidity({ emitEvent: false }));
    paramsGroup.updateValueAndValidity({ emitEvent: false });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const v = this.form.getRawValue();

    const paramsValue = (v.params ?? {}) as Record<string, number | null | undefined>;
    const pricingType = v.pricingType as PricingType;

    const builtParams: Record<string, number | undefined> =
      pricingType === 'SPECIAL'
        ? {}
        : {
            firstHourPrice: paramsValue['firstHourPrice'] ?? undefined,
            hourlyDiscount: paramsValue['hourlyDiscount'] ?? undefined,
            minimumHourlyPrice: paramsValue['minimumHourlyPrice'] ?? undefined,
            hourlyPrice: paramsValue['hourlyPrice'] ?? undefined,
            dailyPrice: paramsValue['dailyPrice'] ?? undefined,
            overtimeHourlyPrice: paramsValue['overtimeHourlyPrice'] ?? undefined,
            issuanceFee: paramsValue['issuanceFee'] ?? undefined,
            minimumDurationMinutes: paramsValue['minimumDurationMinutes'] ?? undefined,
            minimumDurationSurcharge: paramsValue['minimumDurationSurcharge'] ?? undefined,
          };

    const write: TariffWrite = {
      name: v.name!,
      description: v.description ?? undefined,
      equipmentTypeSlug: v.equipmentTypeSlug ?? '',
      pricingType: pricingType,
      params: builtParams,
      validFrom: v.validFrom!,
      validTo: v.validTo ?? undefined,
    };

    const call$: Observable<Tariff> =
      this.data?.tariff && this.data.tariff.id != null
        ? this.tariffService.update(this.data.tariff.id as number, write)
        : this.tariffService.create(write);

    call$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogRef.close(true);
      },
      error: (err: unknown) => {
        this.saving.set(false);
        const msg =
          (err as unknown as { message?: string })?.message ?? $localize`Failed to save tariff`;
        this.snackBar.open(msg, this.labels.Close, { duration: 4000 });
      },
    });
  }
}
