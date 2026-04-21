import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { EquipmentStatusStore } from '../../../core/state/equipment-status.store';
import { EquipmentStatus } from '@ui-models';
import {
  EquipmentStatusDialogComponent,
  EquipmentStatusDialogData,
} from './equipment-status-dialog.component';

const existingStatus: EquipmentStatus = {
  slug: 'available',
  name: 'Available',
  description: 'Bike is available',
  allowedTransitions: ['rented'],
};

const allStatuses: EquipmentStatus[] = [
  existingStatus,
  { slug: 'rented', name: 'Rented', allowedTransitions: [] },
  { slug: 'maintenance', name: 'Maintenance', allowedTransitions: [] },
];

function makeStore() {
  return {
    create: vi.fn().mockReturnValue(of(existingStatus)),
    update: vi.fn().mockReturnValue(of(existingStatus)),
  };
}

function makeDialogRef() {
  return { close: vi.fn() };
}

function makeSnackBar() {
  return { open: vi.fn() };
}

async function setup(data: EquipmentStatusDialogData = { statuses: allStatuses }) {
  const store = makeStore();
  const dialogRef = makeDialogRef();
  const snackBar = makeSnackBar();

  await TestBed.configureTestingModule({
    imports: [EquipmentStatusDialogComponent],
    providers: [
      { provide: EquipmentStatusStore, useValue: store },
      { provide: MatDialogRef, useValue: dialogRef },
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatSnackBar, useValue: snackBar },
    ],
  }).compileComponents();

  const fixture: ComponentFixture<EquipmentStatusDialogComponent> = TestBed.createComponent(
    EquipmentStatusDialogComponent,
  );
  fixture.detectChanges();

  return { fixture, component: fixture.componentInstance, store, dialogRef, snackBar };
}

describe('EquipmentStatusDialogComponent — create mode', () => {
  it('should create', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should have slug enabled in create mode', async () => {
    const { component } = await setup();
    expect(component.form.controls.slug.disabled).toBe(false);
  });

  it('should have empty form in create mode', async () => {
    const { component } = await setup();
    expect(component.form.controls.slug.value).toBe('');
    expect(component.form.controls.name.value).toBe('');
    expect(component.form.controls.description.value).toBe('');
    expect(component.form.controls.allowedTransitions.value).toEqual([]);
  });

  it('should show all statuses as transition options in create mode', async () => {
    const { component } = await setup();
    expect(component.transitionOptions).toHaveLength(allStatuses.length);
  });

  it('should mark form touched and not call store when form is invalid', async () => {
    const { component, store } = await setup();
    component.save();
    expect(store.create).not.toHaveBeenCalled();
    expect(component.form.touched).toBe(true);
  });

  it('should call store.create on valid submit', async () => {
    const { component, store, dialogRef } = await setup();
    component.form.controls.slug.setValue('new-status');
    component.form.controls.name.setValue('New Status');
    component.save();
    expect(store.create).toHaveBeenCalledWith({
      slug: 'new-status',
      name: 'New Status',
      description: undefined,
      allowedTransitions: [],
    });
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should include allowedTransitions in create request', async () => {
    const { component, store } = await setup();
    component.form.controls.slug.setValue('new-status');
    component.form.controls.name.setValue('New Status');
    component.form.controls.allowedTransitions.setValue(['rented', 'maintenance']);
    component.save();
    expect(store.create).toHaveBeenCalledWith(
      expect.objectContaining({ allowedTransitions: ['rented', 'maintenance'] }),
    );
  });

  it('should include description in create request when provided', async () => {
    const { component, store } = await setup();
    component.form.controls.slug.setValue('new-status');
    component.form.controls.name.setValue('New Status');
    component.form.controls.description.setValue('A description');
    component.save();
    expect(store.create).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'A description' }),
    );
  });

  it('should fail slug validation for invalid pattern', async () => {
    const { component } = await setup();
    component.form.controls.slug.setValue('Invalid Slug!');
    component.form.controls.slug.updateValueAndValidity();
    expect(component.form.controls.slug.hasError('pattern')).toBe(true);
  });

  it('should fail slug validation when exceeding maxLength', async () => {
    const { component } = await setup();
    component.form.controls.slug.setValue('a'.repeat(51));
    component.form.controls.slug.updateValueAndValidity();
    expect(component.form.controls.slug.hasError('maxlength')).toBe(true);
  });

  it('should show snackbar and reset saving on error', async () => {
    const { component, store, snackBar } = await setup();
    store.create.mockReturnValue(throwError(() => new Error('Server error')));
    component.form.controls.slug.setValue('new-status');
    component.form.controls.name.setValue('New Status');
    component.save();
    expect(snackBar.open).toHaveBeenCalled();
    expect(component.saving()).toBe(false);
  });

  it('should show success snackbar on successful create', async () => {
    const { component, snackBar } = await setup();
    component.form.controls.slug.setValue('new-status');
    component.form.controls.name.setValue('New Status');
    component.save();
    expect(snackBar.open).toHaveBeenCalled();
  });
});

describe('EquipmentStatusDialogComponent — edit mode', () => {
  it('should pre-fill form with existing status data', async () => {
    const { component } = await setup({ status: existingStatus, statuses: allStatuses });
    expect(component.form.controls.slug.value).toBe('available');
    expect(component.form.controls.name.value).toBe('Available');
    expect(component.form.controls.description.value).toBe('Bike is available');
    expect(component.form.controls.allowedTransitions.value).toEqual(['rented']);
  });

  it('should disable slug in edit mode', async () => {
    const { component } = await setup({ status: existingStatus, statuses: allStatuses });
    expect(component.form.controls.slug.disabled).toBe(true);
  });

  it('should exclude self from transition options in edit mode', async () => {
    const { component } = await setup({ status: existingStatus, statuses: allStatuses });
    const slugs = component.transitionOptions.map((s) => s.slug);
    expect(slugs).not.toContain('available');
    expect(slugs).toContain('rented');
    expect(slugs).toContain('maintenance');
  });

  it('should call store.update with original slug', async () => {
    const { component, store, dialogRef } = await setup({
      status: existingStatus,
      statuses: allStatuses,
    });
    component.form.controls.name.setValue('Updated Available');
    component.save();
    expect(store.update).toHaveBeenCalledWith(
      'available',
      expect.objectContaining({ name: 'Updated Available' }),
    );
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should not call store.create in edit mode', async () => {
    const { component, store } = await setup({ status: existingStatus, statuses: allStatuses });
    component.form.controls.name.setValue('Updated Available');
    component.save();
    expect(store.create).not.toHaveBeenCalled();
  });

  it('should include updated allowedTransitions in update request', async () => {
    const { component, store } = await setup({ status: existingStatus, statuses: allStatuses });
    component.form.controls.allowedTransitions.setValue(['maintenance']);
    component.save();
    expect(store.update).toHaveBeenCalledWith(
      'available',
      expect.objectContaining({ allowedTransitions: ['maintenance'] }),
    );
  });

  it('should show success snackbar on successful update', async () => {
    const { component, snackBar } = await setup({ status: existingStatus, statuses: allStatuses });
    component.form.controls.name.setValue('Updated Available');
    component.save();
    expect(snackBar.open).toHaveBeenCalled();
  });
});
