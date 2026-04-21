import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { EquipmentStatusStore } from '../../../core/state/equipment-status.store';
import { EquipmentStatusDialogComponent } from './equipment-status-dialog.component';
import { EquipmentStatus } from '@ui-models';

const allStatuses: EquipmentStatus[] = [
  { slug: 'available', name: 'Available', allowedTransitions: [] },
];

function makeStore(err: unknown) {
  return {
    create: vi.fn().mockReturnValue(throwError(() => err)),
    update: vi.fn(),
  };
}

function makeSnackBar() {
  return { open: vi.fn() };
}

describe('EquipmentStatusDialogComponent error handling', () => {
  it('shows generic error message when HttpErrorResponse occurs', async () => {
    const err = new HttpErrorResponse({ status: 400, error: { detail: 'Slug already exists' } });
    const store = makeStore(err);
    const snack = makeSnackBar();

    await TestBed.configureTestingModule({
      imports: [EquipmentStatusDialogComponent],
      providers: [
        { provide: EquipmentStatusStore, useValue: store },
        { provide: MatSnackBar, useValue: snack },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: { statuses: allStatuses } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(EquipmentStatusDialogComponent);
    const component = fixture.componentInstance;

    component.form.controls.slug.setValue('available');
    component.form.controls.name.setValue('Available');

    component.save();

    expect(snack.open).toHaveBeenCalled();
    expect(component.saving()).toBe(false);
  });

  it('resets saving flag on any error', async () => {
    const err = new HttpErrorResponse({ status: 500, error: 'Internal Server Error' });
    const store = makeStore(err);
    const snack = makeSnackBar();

    await TestBed.configureTestingModule({
      imports: [EquipmentStatusDialogComponent],
      providers: [
        { provide: EquipmentStatusStore, useValue: store },
        { provide: MatSnackBar, useValue: snack },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: { statuses: allStatuses } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(EquipmentStatusDialogComponent);
    const component = fixture.componentInstance;
    component.form.controls.slug.setValue('available');
    component.form.controls.name.setValue('Available');

    expect(component.saving()).toBe(false);
    component.save();
    expect(component.saving()).toBe(false);
  });
});
