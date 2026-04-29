import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNativeDateAdapter } from '@angular/material/core';
import type { WritableSignal } from '@angular/core';
import { signal } from '@angular/core';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FormGroup } from '@angular/forms';
import { finalize, of } from 'rxjs';
import { CustomerCreateDialogComponent, CustomerStore } from '@bikerental/shared';

const VALID_FORM_VALUE = {
  phone: '+375291234567',
  firstName: 'John',
  lastName: 'Doe',
  email: '',
  birthDate: null,
  notes: '',
};

const makeStore = () => {
  const saving = signal(false);
  const create = vi.fn().mockImplementation((payload) => {
    saving.set(true);
    return of({
      id: 'cust-new-1',
      phone: payload?.phone ?? '375291234567',
      firstName: payload?.firstName ?? 'John',
      lastName: payload?.lastName ?? 'Doe',
    }).pipe(finalize(() => saving.set(false)));
  });

  return { create, saving } as {
    create: Mock;
    saving: WritableSignal<boolean>;
  } & Partial<CustomerStore>;
};

describe('CustomerCreateDialogComponent', () => {
  let fixture: ComponentFixture<CustomerCreateDialogComponent>;
  let component: CustomerCreateDialogComponent;
  let store: ReturnType<typeof makeStore>;
  const dialogClose = vi.fn();
  const snackOpen = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    store = makeStore();

    await TestBed.configureTestingModule({
      imports: [CustomerCreateDialogComponent],
      providers: [
        provideNativeDateAdapter(),
        { provide: CustomerStore, useValue: store },
        { provide: MatDialogRef, useValue: { close: dialogClose } },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatSnackBar, useValue: { open: snackOpen } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerCreateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render dialog title', () => {
    const title = fixture.nativeElement.querySelector('[mat-dialog-title]');
    expect(title).toBeTruthy();
  });

  it('should have Confirm button disabled when form is invalid on load', () => {
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button[mat-flat-button]');
    expect(button.disabled).toBe(true);
  });

  it('should enable Confirm button when all required fields are filled', () => {
    (component as unknown as { formProvider: { form: FormGroup } }).formProvider.form.setValue(
      VALID_FORM_VALUE,
    );
    fixture.detectChanges();

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button[mat-flat-button]');
    expect(button.disabled).toBe(false);
  });
});
