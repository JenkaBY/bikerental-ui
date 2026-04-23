import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
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
import { FALLBACK_PRICING_TYPE, PricingTypeSlug, Tariff, TariffWrite } from '@ui-models';
import { PricingTypeStore } from '@store.pricing-type.store';
import { TariffStore } from '@store.tariff.store';
import {
  CancelButtonComponent,
  EquipmentTypeDropdownComponent,
  FormErrorMessages,
  Labels,
  SaveButtonComponent,
} from '@bikerental/shared';
import { DegressiveHourlyParamsComponent } from './degressive-hourly-params.component';
import { FlatHourlyParamsComponent } from './flat-hourly-params.component';
import { DailyParamsComponent } from './daily-params.component';
import { FlatFeeParamsComponent } from './flat-fee-params.component';
import { SpecialParamsComponent } from './special-params.component';

export interface TariffDialogData {
  tariff?: Tariff;
}

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
            @for (pt of this.pricingTypeStore.pricingTypes(); track pt) {
              <mat-option [value]="pt.slug">{{ pt.title }}</mat-option>
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
                [description]="selectedPricingDescription()"
              ></app-degressive-hourly-params>
            }
            @case ('FLAT_HOURLY') {
              <app-flat-hourly-params
                [group]="form.controls.params"
                [description]="selectedPricingDescription()"
              ></app-flat-hourly-params>
            }
            @case ('DAILY') {
              <app-daily-params
                [group]="form.controls.params"
                [description]="selectedPricingDescription()"
              ></app-daily-params>
            }
            @case ('FLAT_FEE') {
              <app-flat-fee-params
                [group]="form.controls.params"
                [description]="selectedPricingDescription()"
              ></app-flat-fee-params>
            }
            @case ('SPECIAL') {
              <app-special-params [description]="selectedPricingDescription()"></app-special-params>
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
  private tariffStore = inject(TariffStore);
  readonly pricingTypeStore = inject(PricingTypeStore);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  readonly labels = Labels;
  readonly errors = FormErrorMessages;

  readonly saving = computed(() => this.tariffStore.saving());

  readonly selectedPricing = signal<PricingTypeSlug | null>(
    this.data?.tariff?.pricingType.slug ?? null,
  );

  readonly selectedPricingDescription = computed(() => {
    const sel = this.selectedPricing();
    if (!sel) return undefined;
    return (
      this.pricingTypeStore.pricingTypes().find((t) => t.slug === sel)?.description ||
      FALLBACK_PRICING_TYPE.description
    );
  });

  form = new FormGroup({
    name: new FormControl(this.data?.tariff?.name ?? '', [
      Validators.required,
      Validators.maxLength(200),
    ]),
    description: new FormControl(this.data?.tariff?.description ?? '', [
      Validators.maxLength(1000),
    ]),
    equipmentTypeSlug: new FormControl(this.data?.tariff?.equipmentType.slug ?? ''),
    pricingType: new FormControl(this.data?.tariff?.pricingType.slug ?? '', [Validators.required]),
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
    const pricingControl = this.form.controls.pricingType;
    (pricingControl as AbstractControl).valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((t) => {
        this.selectedPricing.set(t as PricingTypeSlug);
        this.applyParamValidators(t as PricingTypeSlug);
      });

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
      this.applyParamValidators(this.form.controls.pricingType.value as PricingTypeSlug);
    }
  }

  private applyParamValidators(type: PricingTypeSlug | null | undefined): void {
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
        p['minimumDurationMinutes'].setValidators([Validators.required, Validators.min(1)]);
        p['minimumDurationSurcharge'].setValidators([Validators.required, Validators.min(0.01)]);
        paramsGroup.setValidators((group) => {
          const g = group as FormGroup & { controls: Record<string, AbstractControl> };
          const first = g.controls['firstHourPrice']?.value as number | null;
          const min = g.controls['minimumHourlyPrice']?.value as number | null;
          if (first != null && min != null && min > first) {
            return { minimumExceedsFirst: true };
          }
          return null;
        });
        break;
      case 'FLAT_HOURLY':
        p['hourlyPrice'].setValidators([Validators.required, Validators.min(0.01)]);
        break;
      case 'DAILY':
        p['dailyPrice'].setValidators([Validators.required, Validators.min(0.01)]);
        p['overtimeHourlyPrice'].setValidators([Validators.required, Validators.min(0.01)]);
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

    const v = this.form.getRawValue();

    const paramsValue = (v.params ?? {}) as Record<string, number | null | undefined>;
    const pricingTypeSlug = v.pricingType as PricingTypeSlug;

    const builtParams: Record<string, number | undefined> =
      pricingTypeSlug === 'SPECIAL'
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
      equipmentTypeSlug: v.equipmentTypeSlug!,
      pricingType: pricingTypeSlug,
      params: builtParams,
      validFrom: v.validFrom!,
      validTo: v.validTo ?? undefined,
    };

    const call$ =
      this.data?.tariff && this.data.tariff.id != null
        ? this.tariffStore.update(this.data.tariff.id, write)
        : this.tariffStore.create(write);

    call$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (err: unknown) => {
        const msg =
          (err as unknown as { message?: string })?.message ?? $localize`Failed to save tariff`;
        this.snackBar.open(msg, this.labels.Close, { duration: 4000 });
      },
    });
  }
}
