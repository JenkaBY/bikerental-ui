import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { throwError } from 'rxjs';
import { EquipmentTypeDialogComponent } from './equipment-type-dialog.component';
import { EquipmentTypeService } from '../../../core/api';
import { HttpErrorResponse } from '@angular/common/http';

function makeService(err: unknown) {
  return {
    create: vi.fn().mockReturnValue(throwError(() => err)),
    update: vi.fn(),
  };
}

function makeSnackBar() {
  return { open: vi.fn() };
}

describe('EquipmentTypeDialogComponent error handling', () => {
  it('shows generic error message when HttpErrorResponse occurs', async () => {
    const err = new HttpErrorResponse({ status: 400, error: { detail: 'Slug already exists' } });
    const service = makeService(err);
    const snack = makeSnackBar();

    await TestBed.configureTestingModule({
      imports: [EquipmentTypeDialogComponent],
      providers: [
        { provide: EquipmentTypeService, useValue: service },
        { provide: MatSnackBar, useValue: snack },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: {} },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(EquipmentTypeDialogComponent);
    const component = fixture.componentInstance;

    component.form.controls.slug.setValue('bike');
    component.form.controls.name.setValue('Bike');

    component.save();

    expect(snack.open).toHaveBeenCalled();
    expect(component.saving()).toBe(false);
  });

  it('resets saving flag on any error', async () => {
    const err = new HttpErrorResponse({ status: 500, error: 'Internal Server Error' });
    const service = makeService(err);
    const snack = makeSnackBar();

    await TestBed.configureTestingModule({
      imports: [EquipmentTypeDialogComponent],
      providers: [
        { provide: EquipmentTypeService, useValue: service },
        { provide: MatSnackBar, useValue: snack },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: {} },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(EquipmentTypeDialogComponent);
    const component = fixture.componentInstance;
    component.form.controls.slug.setValue('bike');
    component.form.controls.name.setValue('Bike');

    expect(component.saving()).toBe(false);
    component.save();
    expect(component.saving()).toBe(false);
  });
});
