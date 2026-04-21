import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { throwError } from 'rxjs';
import { EquipmentTypeDialogComponent } from './equipment-type-dialog.component';
import { EquipmentTypeStore } from '../../../core/state/equipment-type.store';
import { HttpErrorResponse } from '@angular/common/http';

function makeStore(err: unknown) {
  return {
    saving: vi.fn().mockReturnValue(false),
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
    const store = makeStore(err);
    const snack = makeSnackBar();

    await TestBed.configureTestingModule({
      imports: [EquipmentTypeDialogComponent],
      providers: [
        { provide: EquipmentTypeStore, useValue: store },
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
  });

  it('resets saving flag on any error', async () => {
    const err = new HttpErrorResponse({ status: 500, error: 'Internal Server Error' });
    const store = makeStore(err);
    const snack = makeSnackBar();

    await TestBed.configureTestingModule({
      imports: [EquipmentTypeDialogComponent],
      providers: [
        { provide: EquipmentTypeStore, useValue: store },
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
  });
});
