import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { EquipmentTypeStore } from '@bikerental/shared';
import { EquipmentType } from '@ui-models';
import {
  EquipmentTypeDialogComponent,
  EquipmentTypeDialogData,
} from './equipment-type-dialog.component';

const existingType: EquipmentType = {
  slug: 'bike',
  name: 'Bike',
  description: 'A bicycle',
  isForSpecialTariff: false,
};

function makeStore() {
  return {
    saving: vi.fn().mockReturnValue(false),
    create: vi.fn().mockReturnValue(of(existingType)),
    update: vi.fn().mockReturnValue(of(existingType)),
  };
}

function makeDialogRef() {
  return { close: vi.fn() };
}

function makeSnackBar() {
  return { open: vi.fn() };
}

async function setup(data: EquipmentTypeDialogData = {}) {
  const store = makeStore();
  const dialogRef = makeDialogRef();
  const snackBar = makeSnackBar();

  await TestBed.configureTestingModule({
    imports: [EquipmentTypeDialogComponent],
    providers: [
      { provide: EquipmentTypeStore, useValue: store },
      { provide: MatDialogRef, useValue: dialogRef },
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatSnackBar, useValue: snackBar },
    ],
  }).compileComponents();

  const fixture: ComponentFixture<EquipmentTypeDialogComponent> = TestBed.createComponent(
    EquipmentTypeDialogComponent,
  );
  fixture.detectChanges();

  return { fixture, component: fixture.componentInstance, store, dialogRef, snackBar };
}

describe('EquipmentTypeDialogComponent — create mode', () => {
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
  });

  it('should mark form touched and not call store when form is invalid', async () => {
    const { component, store } = await setup();
    component.save();
    expect(store.create).not.toHaveBeenCalled();
    expect(component.form.touched).toBe(true);
  });

  it('should call store.create on valid submit', async () => {
    const { component, store, dialogRef } = await setup();
    component.form.controls.slug.setValue('BIKE');
    component.form.controls.name.setValue('Bike');
    component.save();
    expect(store.create).toHaveBeenCalledWith({
      slug: 'BIKE',
      name: 'Bike',
      description: undefined,
    });
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should include description in create request when provided', async () => {
    const { component, store } = await setup();
    component.form.controls.slug.setValue('BIKE');
    component.form.controls.name.setValue('Bike');
    component.form.controls.description.setValue('A bicycle');
    component.save();
    expect(store.create).toHaveBeenCalledWith({
      slug: 'BIKE',
      name: 'Bike',
      description: 'A bicycle',
    });
  });

  it('should fail slug validation for invalid pattern', async () => {
    const { component } = await setup();
    component.form.controls.slug.setValue('Invalid Slug!');
    component.form.controls.slug.updateValueAndValidity();
    expect(component.form.controls.slug.hasError('pattern')).toBe(true);
  });

  it('should fail slug validation when exceeding maxLength', async () => {
    const { component } = await setup();
    component.form.controls.slug.setValue('A'.repeat(51));
    component.form.controls.slug.updateValueAndValidity();
    expect(component.form.controls.slug.hasError('maxlength')).toBe(true);
  });

  it('should show snackbar and reset saving on error', async () => {
    const { component, store, snackBar } = await setup();
    store.create.mockReturnValue(throwError(() => new Error('Server error')));
    component.form.controls.slug.setValue('BIKE');
    component.form.controls.name.setValue('Bike');
    component.save();
    expect(snackBar.open).toHaveBeenCalled();
  });

  it('should show success snackbar on successful create', async () => {
    const { component, snackBar } = await setup();
    component.form.controls.slug.setValue('BIKE');
    component.form.controls.name.setValue('Bike');
    component.save();
    expect(snackBar.open).toHaveBeenCalled();
  });
});

describe('EquipmentTypeDialogComponent — edit mode', () => {
  it('should pre-fill form with existing type data', async () => {
    const { component } = await setup({ type: existingType });
    expect(component.form.controls.slug.value).toBe('bike');
    expect(component.form.controls.name.value).toBe('Bike');
    expect(component.form.controls.description.value).toBe('A bicycle');
  });

  it('should disable slug in edit mode', async () => {
    const { component } = await setup({ type: existingType });
    expect(component.form.controls.slug.disabled).toBe(true);
  });

  it('should call store.update with original slug', async () => {
    const { component, store, dialogRef } = await setup({ type: existingType });
    component.form.controls.name.setValue('Updated Bike');
    component.save();
    expect(store.update).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'bike', name: 'Updated Bike' }),
    );
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should not call store.create in edit mode', async () => {
    const { component, store } = await setup({ type: existingType });
    component.form.controls.name.setValue('Updated Bike');
    component.save();
    expect(store.create).not.toHaveBeenCalled();
  });

  it('should show success snackbar on successful update', async () => {
    const { component, snackBar } = await setup({ type: existingType });
    component.form.controls.name.setValue('Updated Bike');
    component.save();
    expect(snackBar.open).toHaveBeenCalled();
  });
});
