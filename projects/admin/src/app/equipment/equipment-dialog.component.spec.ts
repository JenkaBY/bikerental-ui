import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { of, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { vi } from 'vitest';

import { EquipmentDialogComponent, EquipmentDialogData } from './equipment-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Equipment, EquipmentStatus } from '@ui-models';
import { EquipmentStore } from '@store.equipment.store';

describe('EquipmentDialogComponent', () => {
  let fixture: ComponentFixture<EquipmentDialogComponent>;
  let component: EquipmentDialogComponent;

  const makeStore = (): { saving: Mock; create: Mock; update: Mock } => ({
    saving: vi.fn().mockReturnValue(false),
    create: vi.fn(),
    update: vi.fn(),
  });

  const makeSnack = (): { open: Mock } => ({ open: vi.fn() });
  const makeDialogRef = (): { close: Mock } => ({ close: vi.fn() });

  async function createComponentWithData(data: EquipmentDialogData) {
    const store = makeStore();
    const snack = makeSnack();
    const dialogRef = makeDialogRef();

    await TestBed.configureTestingModule({
      imports: [EquipmentDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: EquipmentStore, useValue: store as unknown as EquipmentStore },
        { provide: MatSnackBar, useValue: snack as unknown as MatSnackBar },
        {
          provide: MatDialogRef,
          useValue: dialogRef as unknown as MatDialogRef<EquipmentDialogComponent>,
        },
        { provide: LOCALE_ID, useValue: 'en-US' },
      ],
    })
      .overrideComponent(EquipmentDialogComponent, { set: { template: '<div></div>' } })
      .compileComponents();

    fixture = TestBed.createComponent(EquipmentDialogComponent);
    component = fixture.componentInstance;

    return { store, snack, dialogRef };
  }

  it('should initialize form in create mode with defaults', async () => {
    const data: EquipmentDialogData = { types: [], statuses: [] };
    await createComponentWithData(data);

    fixture.detectChanges();

    expect(component.form.get('serialNumber')?.value).toBe('');
    expect(component.form.get('typeSlug')?.value).toBe('');
    expect(component.statusSelectDisabled).toBe(false);
  });

  it('should call store.create on save and close dialog on success', async () => {
    const data: EquipmentDialogData = { types: [], statuses: [] };
    const { store, snack, dialogRef } = await createComponentWithData(data);

    store.create.mockReturnValue(of({ id: 100 }));
    component.form.patchValue({ serialNumber: 'SN123', typeSlug: 'bike' });

    component.save();

    expect(store.create).toHaveBeenCalled();
    expect(snack.open).toHaveBeenCalled();
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should call store.update on save when editing', async () => {
    const existing: Equipment = {
      id: 42,
      serialNumber: 'OLD-SN',
      uid: 'UID',
      type: { slug: 'bike', name: 'Bike', isForSpecialTariff: false },
      status: { slug: 'available', name: 'Available', allowedTransitions: ['maintenance'] },
      model: 'M',
      condition: 'ok',
    };

    const statuses: EquipmentStatus[] = [
      { slug: 'available', name: 'Available', allowedTransitions: ['maintenance'] },
      { slug: 'maintenance', name: 'Maintenance', allowedTransitions: [] },
    ];

    const data: EquipmentDialogData = { equipment: existing, types: [], statuses };

    const { store, snack, dialogRef } = await createComponentWithData(data);

    store.update.mockReturnValue(of(existing));

    fixture.detectChanges();
    component.form.patchValue({ serialNumber: 'NEW-SN' });
    component.save();

    expect(store.update).toHaveBeenCalledWith(42, expect.any(Object));
    expect(snack.open).toHaveBeenCalled();
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should include commissionedAt date in create request', async () => {
    const data: EquipmentDialogData = { types: [], statuses: [] };
    const { store } = await createComponentWithData(data);

    store.create.mockReturnValue(of({ id: 100 }));
    const date = new Date(2022, 0, 5);

    component.form.patchValue({
      serialNumber: 'SNX',
      typeSlug: 'bike',
      commissionedAt: date,
    });

    component.save();

    const [[req]] = store.create.mock.calls;
    expect(req.commissionedAt).toEqual(date);
  });

  it('should show error and keep dialog open on create failure', async () => {
    const data: EquipmentDialogData = { types: [], statuses: [] };
    const { store, snack, dialogRef } = await createComponentWithData(data);

    store.create.mockReturnValue(throwError(() => new Error('fail')));

    component.form.patchValue({ serialNumber: 'SN', typeSlug: 'bike' });
    component.save();

    expect(snack.open).toHaveBeenCalled();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });
});
