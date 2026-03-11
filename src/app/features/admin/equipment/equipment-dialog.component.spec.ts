import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { of, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { vi } from 'vitest';
import { toIsoDate } from '../../../shared/utils/date.util';

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

  it('should enable commissionedAt control in edit mode and retain Date value', async () => {
    const existing: EquipmentResponse = {
      id: 99,
      serialNumber: 'X',
      uid: 'U99',
      type: 'bike',
      status: 'available',
      model: 'M',
      condition: 'ok',
      commissionedAt: '2020-06-15',
    };

    const data: EquipmentDialogData = { equipment: existing, types: [], statuses: [] };

    await createComponentWithData(data);

    fixture.detectChanges();

    const ctrl = component.form.get('commissionedAt');
    expect(ctrl).toBeTruthy();
    // in edit mode the control should be enabled
    expect(ctrl?.disabled).toBe(false);
    // value should be a Date parsed from the string
    const raw = component.form.getRawValue();
    expect(raw.commissionedAt instanceof Date).toBe(true);
  });

  it('should include commissionedAt as ISO string in update request', async () => {
    const existing: EquipmentResponse = {
      id: 55,
      serialNumber: 'OLD',
      uid: 'U55',
      type: 'bike',
      status: 'available',
      model: 'M',
      condition: 'ok',
    };

    const data: EquipmentDialogData = { equipment: existing, types: [], statuses: [] };
    const { equipmentService, snack, dialogRef } = await createComponentWithData(data);

    const date = new Date(2021, 5, 15); // 2021-06-15
    equipmentService.update.mockReturnValue(of(existing));

    fixture.detectChanges();

    // set values including a Date for commissionedAt
    component.form.patchValue({ serialNumber: 'SN', commissionedAt: date });

    component.save();

    expect(equipmentService.update).toHaveBeenCalled();
    const [[id, req]] = equipmentService.update.mock.calls;
    expect(id).toBe(55);
    expect(req.commissionedAt).toBe(toIsoDate(date));
    expect(dialogRef.close).toHaveBeenCalledWith(true);
    expect(snack.open).toHaveBeenCalled();
  });

  it('should mark form touched and not call service when form invalid', async () => {
    const data: EquipmentDialogData = { types: [], statuses: [] };
    const { equipmentService } = await createComponentWithData(data);

    fixture.detectChanges();

    // ensure serialNumber empty -> invalid
    component.form.patchValue({ serialNumber: '' });

    component.save();

    expect(component.form.get('serialNumber')?.touched).toBe(true);
    expect(equipmentService.create).not.toHaveBeenCalled();
  });

  it('should show error and keep dialog open on update failure', async () => {
    const existing: EquipmentResponse = {
      id: 7,
      serialNumber: 'OLD',
      uid: 'U7',
      type: 'bike',
      status: 'available',
      model: 'M',
      condition: 'ok',
    };
    const statuses: EquipmentStatusResponse[] = [];
    const data: EquipmentDialogData = { equipment: existing, types: [], statuses };

    const { equipmentService, snack, dialogRef } = await createComponentWithData(data);

    equipmentService.update.mockReturnValue(throwError(() => new Error('oops')));

    fixture.detectChanges();

    component.form.patchValue({ serialNumber: 'NEW' });

    component.save();

    expect(snack.open).toHaveBeenCalled();
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component.saving()).toBe(false);
  });

  it('currentStatusName returns slug when no matching status found', async () => {
    const existing: EquipmentResponse = {
      id: 88,
      serialNumber: 'S',
      uid: 'U88',
      type: 'bike',
      status: 'unknown-slug',
      model: 'M',
      condition: 'ok',
    };

    const data: EquipmentDialogData = { equipment: existing, types: [], statuses: [] };
    await createComponentWithData(data);

    fixture.detectChanges();

    expect(component.currentStatusName).toBe('unknown-slug');
  });

  it('statusOptions returns all statuses in create mode', async () => {
    const statuses: EquipmentStatusResponse[] = [
      { slug: 'a', name: 'A', allowedTransitions: [] },
      { slug: 'b', name: 'B', allowedTransitions: [] },
    ];
    const data: EquipmentDialogData = { types: [], statuses };
    await createComponentWithData(data);

    fixture.detectChanges();

    const opts = component.statusOptions.map((s) => s.slug);
    expect(opts).toEqual(['a', 'b']);
  });

  it('should re-enable status control when allowed transitions are added and syncStatusControl called', async () => {
    const existing: EquipmentResponse = {
      id: 123,
      serialNumber: 'S',
      uid: 'U123',
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

    // initially disabled
    expect(component.form.get('statusSlug')?.disabled).toBe(true);

    // mutate the injected data to allow a transition and call syncStatusControl
    data.statuses[0].allowedTransitions = ['available'];
    // call private syncStatusControl to re-evaluate (use a typed cast instead of `any`)
    (component as unknown as { syncStatusControl: () => void }).syncStatusControl();

    expect(component.form.get('statusSlug')?.disabled).toBe(false);
  });

  it('should send all form fields on create including commissionedAt as ISO', async () => {
    const data: EquipmentDialogData = { types: [], statuses: [] };
    const { equipmentService, snack, dialogRef } = await createComponentWithData(data);

    equipmentService.create.mockReturnValue(of({ id: 'new' }));

    const date = new Date(2022, 0, 5); // 2022-01-05

    fixture.detectChanges();

    component.form.patchValue({
      serialNumber: 'SNX',
      uid: 'UX',
      typeSlug: 'bike',
      statusSlug: 'available',
      model: 'MX',
      commissionedAt: date,
      condition: 'good',
    });

    component.save();

    expect(equipmentService.create).toHaveBeenCalled();
    const [[req]] = equipmentService.create.mock.calls;
    // req is the first (and only) argument
    expect(req.serialNumber).toBe('SNX');
    expect(req.uid).toBe('UX');
    expect(req.typeSlug).toBe('bike');
    expect(req.statusSlug).toBe('available');
    expect(req.model).toBe('MX');
    expect(req.condition).toBe('good');
    expect(req.commissionedAt).toBe(toIsoDate(date));
    expect(dialogRef.close).toHaveBeenCalledWith(true);
    expect(snack.open).toHaveBeenCalled();
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
