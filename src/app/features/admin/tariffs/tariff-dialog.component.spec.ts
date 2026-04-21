import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TariffDialogComponent, TariffDialogData } from './tariff-dialog.component';
import { EquipmentTypeDropdownComponent } from '../../../shared/components/equipment-type-dropdown/equipment-type-dropdown.component';
import { TariffService } from '../../../core/api';
import { Tariff } from '@ui-models';
import { Labels } from '../../../shared/constant/labels';

@Component({
  selector: 'app-equipment-type-dropdown',
  standalone: true,
  template: '',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EquipmentTypeDropdownStub),
      multi: true,
    },
  ],
})
class EquipmentTypeDropdownStub implements ControlValueAccessor {
  writeValue(v: unknown): void {
    void v;
  }
  registerOnChange(fn: unknown): void {
    void fn;
  }
  registerOnTouched(fn: unknown): void {
    void fn;
  }
}

const mockTariff: Tariff = {
  id: 1,
  name: 'Test Tariff',
  equipmentType: 'bike',
  pricingType: 'FLAT_HOURLY',
  params: { hourlyPrice: 100 },
  validFrom: new Date('2026-01-01'),
  status: 'ACTIVE',
};

function makeService() {
  return {
    create: vi.fn().mockReturnValue(of(mockTariff)),
    update: vi.fn().mockReturnValue(of(mockTariff)),
    getPricingTypes: vi.fn().mockReturnValue(of([])),
  };
}

async function setup(data: TariffDialogData = {}) {
  const service = makeService();
  const dialogRef = { close: vi.fn() };
  const snackBar = { open: vi.fn() };

  await TestBed.configureTestingModule({
    imports: [TariffDialogComponent],
    providers: [
      { provide: TariffService, useValue: service },
      { provide: MatDialogRef, useValue: dialogRef },
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatSnackBar, useValue: snackBar },
    ],
  })
    .overrideComponent(TariffDialogComponent, {
      remove: { imports: [EquipmentTypeDropdownComponent] },
      add: { imports: [EquipmentTypeDropdownStub] },
    })
    .compileComponents();

  const fixture: ComponentFixture<TariffDialogComponent> =
    TestBed.createComponent(TariffDialogComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, service, dialogRef, snackBar };
}

function params(component: TariffDialogComponent): Record<string, FormControl> {
  return (component.form.controls.params as FormGroup).controls as Record<string, FormControl>;
}

function paramsGroup(component: TariffDialogComponent): FormGroup {
  return component.form.controls.params as FormGroup;
}

function switchTo(component: TariffDialogComponent, type: string) {
  component.form.controls.pricingType.setValue(type);
  paramsGroup(component).updateValueAndValidity();
}

// ─── Create mode ──────────────────────────────────────────────────────────────

describe('TariffDialogComponent — create mode', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('creates the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('shows CreateTariff as dialog title', async () => {
    const { fixture } = await setup();
    const title: string = fixture.nativeElement.textContent;
    expect(title).toContain(Labels.CreateTariff);
  });

  it('initialises form with empty values', async () => {
    const { component } = await setup();
    expect(component.form.controls.name.value).toBe('');
    expect(component.form.controls.pricingType.value).toBe('');
    expect(component.form.controls.validFrom.value).toBeNull();
  });

  it('form is invalid initially (required fields missing)', async () => {
    const { component } = await setup();
    expect(component.form.valid).toBe(false);
  });

  it('does not call create() when form is invalid', async () => {
    const { component, service } = await setup();
    component.save();
    expect(service.create).not.toHaveBeenCalled();
  });

  it('marks form as touched when save is attempted with invalid form', async () => {
    const { component } = await setup();
    component.save();
    expect(component.form.touched).toBe(true);
  });

  it('calls create() with correct TariffWrite on valid FLAT_HOURLY save', async () => {
    const { component, service } = await setup();
    component.form.controls.name.setValue('My Tariff');
    switchTo(component, 'FLAT_HOURLY');
    component.form.controls.validFrom.setValue(new Date('2026-01-01'));
    params(component)['hourlyPrice'].setValue(10);
    component.save();

    expect(service.create).toHaveBeenCalledOnce();
    const write = service.create.mock.calls[0][0];
    expect(write.name).toBe('My Tariff');
    expect(write.pricingType).toBe('FLAT_HOURLY');
    expect(write.params.hourlyPrice).toBe(10);
  });

  it('sends empty params object for SPECIAL pricing type', async () => {
    const { component, service } = await setup();
    component.form.controls.name.setValue('Special Tariff');
    switchTo(component, 'SPECIAL');
    component.form.controls.validFrom.setValue(new Date('2026-01-01'));
    component.save();

    const write = service.create.mock.calls[0][0];
    expect(write.params).toEqual({});
  });

  it('closes dialog with true after successful create', async () => {
    const { component, dialogRef } = await setup();
    component.form.controls.name.setValue('My Tariff');
    switchTo(component, 'FLAT_HOURLY');
    component.form.controls.validFrom.setValue(new Date('2026-01-01'));
    params(component)['hourlyPrice'].setValue(10);
    component.save();

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('saving signal is false after successful create', async () => {
    const { component } = await setup();
    component.form.controls.name.setValue('My Tariff');
    switchTo(component, 'FLAT_HOURLY');
    component.form.controls.validFrom.setValue(new Date('2026-01-01'));
    params(component)['hourlyPrice'].setValue(10);
    component.save();

    expect(component.saving()).toBe(false);
  });
});

// ─── Edit mode ────────────────────────────────────────────────────────────────

describe('TariffDialogComponent — edit mode', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('shows EditTariff as dialog title', async () => {
    const { fixture } = await setup({ tariff: mockTariff });
    const title: string = fixture.nativeElement.textContent;
    expect(title).toContain(Labels.EditTariff);
  });

  it('pre-fills name from tariff', async () => {
    const { component } = await setup({ tariff: mockTariff });
    expect(component.form.controls.name.value).toBe(mockTariff.name);
  });

  it('pre-fills pricingType from tariff', async () => {
    const { component } = await setup({ tariff: mockTariff });
    expect(component.form.controls.pricingType.value).toBe(mockTariff.pricingType);
  });

  it('pre-fills validFrom as a Date from tariff', async () => {
    const { component } = await setup({ tariff: mockTariff });
    expect(component.form.controls.validFrom.value).toBeInstanceOf(Date);
    expect(
      (component.form.controls.validFrom.value as Date).toISOString().startsWith('2026-01-01'),
    ).toBe(true);
  });

  it('pre-fills hourlyPrice from tariff params', async () => {
    const { component } = await setup({ tariff: mockTariff });
    expect(params(component)['hourlyPrice'].value).toBe(100);
  });

  it('calls update() with correct id on save', async () => {
    const { component, service } = await setup({ tariff: mockTariff });
    component.form.controls.name.setValue('Updated');
    component.save();

    expect(service.update).toHaveBeenCalledOnce();
    expect(service.update.mock.calls[0][0]).toBe(mockTariff.id);
  });

  it('closes dialog with true after successful update', async () => {
    const { component, dialogRef } = await setup({ tariff: mockTariff });
    component.save();
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('does not call create() in edit mode', async () => {
    const { component, service } = await setup({ tariff: mockTariff });
    component.save();
    expect(service.create).not.toHaveBeenCalled();
  });
});

// ─── Pricing type switching ────────────────────────────────────────────────────

describe('TariffDialogComponent — pricing type switching', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('FLAT_HOURLY — hourlyPrice required', async () => {
    const { component } = await setup();
    switchTo(component, 'FLAT_HOURLY');
    params(component)['hourlyPrice'].setValue(null);
    expect(params(component)['hourlyPrice'].hasError('required')).toBe(true);
  });

  it('DEGRESSIVE_HOURLY — firstHourPrice, hourlyDiscount, minimumHourlyPrice, minimumDurationMinutes, minimumDurationSurcharge required', async () => {
    const { component } = await setup();
    switchTo(component, 'DEGRESSIVE_HOURLY');
    const p = params(component);
    [
      'firstHourPrice',
      'hourlyDiscount',
      'minimumHourlyPrice',
      'minimumDurationMinutes',
      'minimumDurationSurcharge',
    ].forEach((field) => {
      p[field].setValue(null);
      expect(p[field].hasError('required')).toBe(true);
    });
  });

  it('DAILY — dailyPrice and overtimeHourlyPrice required', async () => {
    const { component } = await setup();
    switchTo(component, 'DAILY');
    const p = params(component);
    p['dailyPrice'].setValue(null);
    p['overtimeHourlyPrice'].setValue(null);
    expect(p['dailyPrice'].hasError('required')).toBe(true);
    expect(p['overtimeHourlyPrice'].hasError('required')).toBe(true);
  });

  it('FLAT_FEE — issuanceFee and minimumDurationMinutes required', async () => {
    const { component } = await setup();
    switchTo(component, 'FLAT_FEE');
    const p = params(component);
    p['issuanceFee'].setValue(null);
    p['minimumDurationMinutes'].setValue(null);
    expect(p['issuanceFee'].hasError('required')).toBe(true);
    expect(p['minimumDurationMinutes'].hasError('required')).toBe(true);
  });

  it('SPECIAL — form is valid without any params', async () => {
    const { component } = await setup();
    component.form.controls.name.setValue('Special');
    switchTo(component, 'SPECIAL');
    component.form.controls.validFrom.setValue(new Date());
    expect(component.form.valid).toBe(true);
  });

  it('switching from FLAT_HOURLY to SPECIAL removes hourlyPrice required error', async () => {
    const { component } = await setup();
    switchTo(component, 'FLAT_HOURLY');
    expect(params(component)['hourlyPrice'].hasError('required')).toBe(true);

    switchTo(component, 'SPECIAL');
    expect(params(component)['hourlyPrice'].hasError('required')).toBe(false);
  });

  it('switching from DEGRESSIVE_HOURLY to FLAT_HOURLY removes degressive required errors', async () => {
    const { component } = await setup();
    switchTo(component, 'DEGRESSIVE_HOURLY');
    switchTo(component, 'FLAT_HOURLY');
    expect(params(component)['firstHourPrice'].hasError('required')).toBe(false);
    expect(params(component)['minimumHourlyPrice'].hasError('required')).toBe(false);
  });
});

// ─── Cross-field validator ─────────────────────────────────────────────────────

describe('TariffDialogComponent — minimumExceedsFirst cross-field validator', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('params group has minimumExceedsFirst error when minimumHourlyPrice > firstHourPrice', async () => {
    const { component } = await setup();
    switchTo(component, 'DEGRESSIVE_HOURLY');
    params(component)['firstHourPrice'].setValue(10);
    params(component)['minimumHourlyPrice'].setValue(15);
    paramsGroup(component).updateValueAndValidity();
    expect(paramsGroup(component).hasError('minimumExceedsFirst')).toBe(true);
  });

  it('no error when minimumHourlyPrice equals firstHourPrice', async () => {
    const { component } = await setup();
    switchTo(component, 'DEGRESSIVE_HOURLY');
    params(component)['firstHourPrice'].setValue(10);
    params(component)['minimumHourlyPrice'].setValue(10);
    paramsGroup(component).updateValueAndValidity();
    expect(paramsGroup(component).hasError('minimumExceedsFirst')).toBe(false);
  });

  it('no error when minimumHourlyPrice < firstHourPrice', async () => {
    const { component } = await setup();
    switchTo(component, 'DEGRESSIVE_HOURLY');
    params(component)['firstHourPrice'].setValue(10);
    params(component)['minimumHourlyPrice'].setValue(5);
    paramsGroup(component).updateValueAndValidity();
    expect(paramsGroup(component).hasError('minimumExceedsFirst')).toBe(false);
  });
});

// ─── Param field constraints ───────────────────────────────────────────────────

describe('TariffDialogComponent — param field min validation', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('hourlyPrice = 0 gives min error', async () => {
    const { component } = await setup();
    switchTo(component, 'FLAT_HOURLY');
    params(component)['hourlyPrice'].setValue(0);
    expect(params(component)['hourlyPrice'].hasError('min')).toBe(true);
  });

  it('dailyPrice = 0 gives min error', async () => {
    const { component } = await setup();
    switchTo(component, 'DAILY');
    params(component)['dailyPrice'].setValue(0);
    expect(params(component)['dailyPrice'].hasError('min')).toBe(true);
  });

  it('firstHourPrice = 0 gives min error', async () => {
    const { component } = await setup();
    switchTo(component, 'DEGRESSIVE_HOURLY');
    params(component)['firstHourPrice'].setValue(0);
    expect(params(component)['firstHourPrice'].hasError('min')).toBe(true);
  });

  it('issuanceFee = -1 gives min error; issuanceFee = 0 is valid', async () => {
    const { component } = await setup();
    switchTo(component, 'FLAT_FEE');
    params(component)['issuanceFee'].setValue(-1);
    expect(params(component)['issuanceFee'].hasError('min')).toBe(true);
    params(component)['issuanceFee'].setValue(0);
    expect(params(component)['issuanceFee'].hasError('min')).toBe(false);
  });

  it('minimumDurationMinutes = 0 gives min error', async () => {
    const { component } = await setup();
    switchTo(component, 'FLAT_FEE');
    params(component)['minimumDurationMinutes'].setValue(0);
    expect(params(component)['minimumDurationMinutes'].hasError('min')).toBe(true);
  });

  it('overtimeHourlyPrice = -1 gives min error', async () => {
    const { component } = await setup();
    params(component)['overtimeHourlyPrice'].setValue(-1);
    expect(params(component)['overtimeHourlyPrice'].hasError('min')).toBe(true);
  });

  it('minimumDurationSurcharge = -1 gives min error', async () => {
    const { component } = await setup();
    params(component)['minimumDurationSurcharge'].setValue(-1);
    expect(params(component)['minimumDurationSurcharge'].hasError('min')).toBe(true);
  });
});

// ─── Top-level form validation ──────────────────────────────────────────────────

describe('TariffDialogComponent — form field validation', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('name required error when blank', async () => {
    const { component } = await setup();
    component.form.controls.name.setValue('');
    component.form.controls.name.markAsTouched();
    expect(component.form.controls.name.hasError('required')).toBe(true);
  });

  it('name maxlength error when > 200 chars', async () => {
    const { component } = await setup();
    component.form.controls.name.setValue('a'.repeat(201));
    expect(component.form.controls.name.hasError('maxlength')).toBe(true);
  });

  it('pricingType required error when empty', async () => {
    const { component } = await setup();
    component.form.controls.pricingType.setValue('');
    expect(component.form.controls.pricingType.hasError('required')).toBe(true);
  });

  it('validFrom required — form invalid without validFrom', async () => {
    const { component } = await setup();
    component.form.controls.name.setValue('T');
    switchTo(component, 'SPECIAL');
    component.form.controls.validFrom.setValue(null);
    expect(component.form.controls.validFrom.hasError('required')).toBe(true);
    expect(component.form.valid).toBe(false);
  });

  it('selectedPricingDescription computed reflects pricingTypeDescriptions', async () => {
    const { component } = await setup();
    component.pricingTypeDescriptions.set({ FLAT_HOURLY: 'A flat hourly rate.' });
    switchTo(component, 'FLAT_HOURLY');
    expect(component.selectedPricingDescription()).toBe('A flat hourly rate.');
  });
});
