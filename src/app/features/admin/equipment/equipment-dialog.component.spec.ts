import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { of, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { vi } from 'vitest';

import { EquipmentDialogComponent, EquipmentDialogData } from './equipment-dialog.component';
import { EquipmentService } from '../../../core/api';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EquipmentResponse, EquipmentStatusResponse } from '../../../core/models';

describe('EquipmentDialogComponent', () => {
  let fixture: ComponentFixture<EquipmentDialogComponent>;
  let component: EquipmentDialogComponent;

  const makeService = (): { create: Mock; update: Mock } => ({
    create: vi.fn(),
    update: vi.fn(),
  });

  const makeSnack = (): { open: Mock } => ({ open: vi.fn() });
  const makeDialogRef = (): { close: Mock } => ({ close: vi.fn() });

  async function createComponentWithData(data: EquipmentDialogData) {
    const equipmentService = makeService();
    const snack = makeSnack();
    const dialogRef = makeDialogRef();

    await TestBed.configureTestingModule({
      // use a minimal template to avoid importing material modules in tests
      imports: [EquipmentDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        // cast to unknown to satisfy DI typing while keeping strong types in tests
        { provide: EquipmentService, useValue: equipmentService as unknown as EquipmentService },
        { provide: MatSnackBar, useValue: snack as unknown as MatSnackBar },
        {
          provide: MatDialogRef,
          useValue: dialogRef as unknown as MatDialogRef<EquipmentDialogComponent>,
        },
        { provide: LOCALE_ID, useValue: 'en-US' },
      ],
    })
      // avoid rendering the full material-based template
      .overrideComponent(EquipmentDialogComponent, { set: { template: '<div></div>' } })
      .compileComponents();

    fixture = TestBed.createComponent(EquipmentDialogComponent);
    component = fixture.componentInstance;

    return { equipmentService, snack, dialogRef };
  }

  it('should initialize form in create mode with defaults', async () => {
    const data: EquipmentDialogData = { types: [], statuses: [] };
    await createComponentWithData(data);

    fixture.detectChanges();

    expect(component.form).toBeTruthy();
    expect(component.form.get('serialNumber')?.value).toBe('');
    expect(component.form.get('typeSlug')?.value).toBe('');
    // create mode -> no current status
    expect(component.statusSelectDisabled).toBe(false);
  });

  it('should have commissionedAt control disabled in create mode', async () => {
    const data: EquipmentDialogData = { types: [], statuses: [] };
    await createComponentWithData(data);

    fixture.detectChanges();

    const commissioned = component.form.get('commissionedAt');
    expect(commissioned).toBeTruthy();
    expect(commissioned?.disabled).toBe(true);
  });

  it('should call create on save and close dialog on success', async () => {
    const data: EquipmentDialogData = { types: [], statuses: [] };
    const { equipmentService, snack, dialogRef } = await createComponentWithData(data);

    // prepare service to succeed
    equipmentService.create.mockReturnValue(of({ id: 'new' }));

    // fill form with minimal valid values
    component.form.patchValue({ serialNumber: 'SN123' });

    fixture.detectChanges();

    component.save();

    // service called
    expect(equipmentService.create).toHaveBeenCalled();
    // snackbar opened
    expect(snack.open).toHaveBeenCalled();
    // dialog closed with success
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should call update on save when editing and close dialog on success', async () => {
    const existing: EquipmentResponse = {
      id: 42,
      serialNumber: 'OLD-SN',
      uid: 'UID',
      type: 'bike',
      status: 'available',
      model: 'M',
      condition: 'ok',
    };

    const statuses: EquipmentStatusResponse[] = [
      { slug: 'available', name: 'Available', allowedTransitions: ['maintenance'] },
      { slug: 'maintenance', name: 'Maintenance', allowedTransitions: [] },
    ];

    const data: EquipmentDialogData = { equipment: existing, types: [], statuses };

    const { equipmentService, snack, dialogRef } = await createComponentWithData(data);

    equipmentService.update.mockReturnValue(of(existing));

    fixture.detectChanges();

    // change a value
    component.form.patchValue({ serialNumber: 'NEW-SN' });

    component.save();

    expect(equipmentService.update).toHaveBeenCalledWith(42, expect.any(Object));
    expect(snack.open).toHaveBeenCalled();
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should only include current status and allowed transitions in statusOptions when editing', async () => {
    const existing: EquipmentResponse = {
      id: 42,
      serialNumber: 'OLD-SN',
      uid: 'UID',
      type: 'bike',
      status: 'available',
      model: 'M',
      condition: 'ok',
    };

    const statuses: EquipmentStatusResponse[] = [
      { slug: 'available', name: 'Available', allowedTransitions: ['maintenance'] },
      { slug: 'maintenance', name: 'Maintenance', allowedTransitions: [] },
      { slug: 'retired', name: 'Retired', allowedTransitions: [] },
    ];

    const data: EquipmentDialogData = { equipment: existing, types: [], statuses };

    await createComponentWithData(data);

    fixture.detectChanges();

    const options = component.statusOptions.map((s) => s.slug);
    expect(options).toContain('available');
    expect(options).toContain('maintenance');
    expect(options).not.toContain('retired');
    expect(component.statusSelectDisabled).toBe(false);
  });

  it('should disable status select when there are no allowed transitions besides current', async () => {
    const existing: EquipmentResponse = {
      id: 7,
      serialNumber: 'SN',
      uid: 'U7',
      type: 'bike',
      status: 'retired',
      model: 'M',
      condition: 'ok',
    };

    const statuses: EquipmentStatusResponse[] = [
      { slug: 'retired', name: 'Retired', allowedTransitions: [] },
      { slug: 'available', name: 'Available', allowedTransitions: [] },
    ];

    const data: EquipmentDialogData = { equipment: existing, types: [], statuses };

    await createComponentWithData(data);

    fixture.detectChanges();

    expect(component.statusOptions.map((s) => s.slug)).toEqual(['retired']);
    expect(component.statusSelectDisabled).toBe(true);
    // control should be disabled
    expect(component.form.get('statusSlug')?.disabled).toBe(true);
  });

  it('should send selected allowed statusSlug in update request when saving', async () => {
    const existing: EquipmentResponse = {
      id: 42,
      serialNumber: 'OLD-SN',
      uid: 'UID',
      type: 'bike',
      status: 'available',
      model: 'M',
      condition: 'ok',
    };

    const statuses: EquipmentStatusResponse[] = [
      { slug: 'available', name: 'Available', allowedTransitions: ['maintenance'] },
      { slug: 'maintenance', name: 'Maintenance', allowedTransitions: [] },
    ];

    const data: EquipmentDialogData = { equipment: existing, types: [], statuses };

    const { equipmentService, snack, dialogRef } = await createComponentWithData(data);

    equipmentService.update.mockReturnValue(of(existing));

    fixture.detectChanges();

    // choose an allowed transition
    component.form.patchValue({ statusSlug: 'maintenance' });

    component.save();

    expect(equipmentService.update).toHaveBeenCalled();
    const [[id, req]] = equipmentService.update.mock.calls;
    expect(id).toBe(42);
    expect(req.statusSlug).toBe('maintenance');
    expect(dialogRef.close).toHaveBeenCalledWith(true);
    expect(snack.open).toHaveBeenCalled();
  });

  it('should show error and keep dialog open on create failure', async () => {
    const data: EquipmentDialogData = { types: [], statuses: [] };
    const { equipmentService, snack, dialogRef } = await createComponentWithData(data);

    equipmentService.create.mockReturnValue(throwError(() => new Error('fail')));

    component.form.patchValue({ serialNumber: 'SN' });

    component.save();

    // error path: snackBar opened and dialog not closed
    expect(snack.open).toHaveBeenCalled();
    expect(dialogRef.close).not.toHaveBeenCalled();
    // saving should be set back to false on error
    expect(component.saving()).toBe(false);
  });
});
