import { TestBed } from '@angular/core/testing';
import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TariffDialogComponent } from './tariff-dialog.component';
import { EquipmentTypeDropdownComponent } from '../../../shared/components/equipment-type-dropdown/equipment-type-dropdown.component';
import { TariffService } from '../../../core/api';
import { Tariff } from '../../../core/models';

@Component({
  selector: 'app-equipment-type-dropdown',
  standalone: true,
  template: '',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownStub),
      multi: true,
    },
  ],
})
class DropdownStub implements ControlValueAccessor {
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

const tariffFixture: Tariff = {
  id: 7,
  name: 'Existing',
  equipmentType: 'bike',
  pricingType: 'FLAT_HOURLY',
  params: { hourlyPrice: 50 },
  validFrom: new Date('2026-01-01'),
  status: 'ACTIVE',
};

function makeService(mode: 'create-error' | 'update-error', err: unknown) {
  return {
    create: mode === 'create-error' ? vi.fn().mockReturnValue(throwError(() => err)) : vi.fn(),
    update: mode === 'update-error' ? vi.fn().mockReturnValue(throwError(() => err)) : vi.fn(),
    getPricingTypes: vi.fn().mockReturnValue({
      subscribe: () => void 0,
      pipe: () => ({ subscribe: () => void 0 }),
    }),
  };
}

async function setupError(
  mode: 'create-error' | 'update-error',
  err: unknown,
  dialogData: object = {},
) {
  const service = makeService(mode, err);
  const dialogRef = { close: vi.fn() };
  const snackBar = { open: vi.fn() };

  await TestBed.configureTestingModule({
    imports: [TariffDialogComponent],
    providers: [
      { provide: TariffService, useValue: service },
      { provide: MatDialogRef, useValue: dialogRef },
      { provide: MAT_DIALOG_DATA, useValue: dialogData },
      { provide: MatSnackBar, useValue: snackBar },
    ],
  })
    .overrideComponent(TariffDialogComponent, {
      remove: { imports: [EquipmentTypeDropdownComponent] },
      add: { imports: [DropdownStub] },
    })
    .compileComponents();

  const fixture = TestBed.createComponent(TariffDialogComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  return { component, dialogRef, snackBar, service };
}

function fillFlatHourly(component: TariffDialogComponent) {
  component.form.controls.name.setValue('Test');
  component.form.controls.pricingType.setValue('FLAT_HOURLY');
  component.form.controls.validFrom.setValue(new Date('2026-01-01'));
  ((component.form.controls.params as FormGroup).controls['hourlyPrice'] as FormControl).setValue(
    10,
  );
}

describe('TariffDialogComponent — error handling', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('shows snackbar with error message when create() fails', async () => {
    const err = new Error('Network error');
    const { component, snackBar, dialogRef } = await setupError('create-error', err);

    fillFlatHourly(component);
    component.save();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Network error',
      expect.any(String),
      expect.any(Object),
    );
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('resets saving signal to false after create() error', async () => {
    const err = new Error('fail');
    const { component } = await setupError('create-error', err);

    fillFlatHourly(component);
    component.save();

    expect(component.saving()).toBe(false);
  });

  it('shows snackbar with error message when update() fails', async () => {
    const err = new Error('Server error');
    const { component, snackBar, dialogRef } = await setupError('update-error', err, {
      tariff: tariffFixture,
    });

    component.save();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Server error',
      expect.any(String),
      expect.any(Object),
    );
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('resets saving signal to false after update() error', async () => {
    const err = new Error('fail');
    const { component } = await setupError('update-error', err, { tariff: tariffFixture });

    component.save();

    expect(component.saving()).toBe(false);
  });

  it('shows fallback message when error has no message property', async () => {
    const { component, snackBar } = await setupError('create-error', { code: 500 });

    fillFlatHourly(component);
    component.save();

    expect(snackBar.open).toHaveBeenCalled();
    const msg = (snackBar.open as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });
});
