import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { TariffDialogComponent } from './tariff-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TariffService } from '../../../core/api';
import { FormControl, FormGroup } from '@angular/forms';
import { Tariff } from '../../../core/domain';

describe('TariffDialogComponent', () => {
  let mockDialogRef: Partial<MatDialogRef<TariffDialogComponent>>;
  let mockSnack: Partial<MatSnackBar>;
  let updateMock: ReturnType<typeof vi.fn>;
  let createMock: ReturnType<typeof vi.fn>;
  let getPricingTypesMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };
    mockSnack = { open: vi.fn() };

    updateMock = vi.fn(() => of({} as unknown as Tariff));
    createMock = vi.fn(() => of({} as unknown as Tariff));
    getPricingTypesMock = vi.fn(() => of([]));

    const mockTariffService: Partial<TariffService> = {
      update: updateMock as unknown as TariffService['update'],
      create: createMock as unknown as TariffService['create'],
      getPricingTypes: getPricingTypesMock as unknown as TariffService['getPricingTypes'],
    };

    await TestBed.configureTestingModule({
      imports: [TariffDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            tariff: {
              id: 42,
              status: 'ACTIVE',
              name: 'T1',
              pricingType: 'FLAT_HOURLY',
              validFrom: new Date(),
              params: {},
            },
          },
        },
        { provide: MatSnackBar, useValue: mockSnack },
        { provide: TariffService, useValue: mockTariffService },
      ],
    }).compileComponents();
  });

  it('preserves existing status when updating', async () => {
    const fixture = TestBed.createComponent(TariffDialogComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.controls.name.setValue('Edited');
    component.form.controls.pricingType.setValue('FLAT_HOURLY');
    component.form.controls.validFrom.setValue(new Date());

    const paramsGroup = component.form.controls.params as FormGroup;
    (paramsGroup.controls['hourlyPrice'] as FormControl).setValue(10);

    await component.save();

    expect(updateMock.mock.calls.length).toBeGreaterThan(0);
    const callArgs = updateMock.mock.calls[0];
    expect(callArgs[1].status).toBe('ACTIVE');
  });
});
