import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { vi } from 'vitest';
import type { Customer } from '@bikerental/shared';
import { CustomerFormProvider, CustomerStore } from '@bikerental/shared';
import { CustomerCreateInlineFormComponent } from './customer-create-inline-form.component';

const CREATED_CUSTOMER: Customer = {
  id: 'new-1',
  phone: '+79001234567',
  firstName: 'Anna',
  lastName: 'Ivanova',
};

function makeStore() {
  return {
    create: vi.fn().mockReturnValue(of(CREATED_CUSTOMER)),
    saving: signal(false),
  };
}

describe('CustomerCreateInlineFormComponent', () => {
  let fixture: ComponentFixture<CustomerCreateInlineFormComponent>;
  let component: CustomerCreateInlineFormComponent;
  let store: ReturnType<typeof makeStore>;
  let snackBar: { open: ReturnType<typeof vi.fn> };
  let emitted: Customer[];

  beforeEach(async () => {
    store = makeStore();
    snackBar = { open: vi.fn() };
    emitted = [];

    await TestBed.configureTestingModule({
      imports: [CustomerCreateInlineFormComponent],
      providers: [provideAnimationsAsync(), { provide: MatSnackBar, useValue: snackBar }],
    })
      .overrideComponent(CustomerCreateInlineFormComponent, {
        set: {
          providers: [{ provide: CustomerStore, useValue: store }, CustomerFormProvider],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CustomerCreateInlineFormComponent);
    fixture.componentRef.setInput('phone', '+79001234567');
    fixture.componentInstance.customerCreated.subscribe((c: Customer) => emitted.push(c));
    fixture.detectChanges();
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the pre-filled phone value', () => {
    const phoneInput: HTMLInputElement | null =
      fixture.nativeElement.querySelector('input[type="tel"]');
    expect(phoneInput).not.toBeNull();
    expect(phoneInput!.value).toBe('+79001234567');
  });

  it('should not call store.create when firstName is empty', () => {
    component['formProvider'].form.controls.firstName.setValue('');
    component['formProvider'].form.controls.lastName.setValue('Ivanova');
    component['submit']();
    expect(store.create).not.toHaveBeenCalled();
  });

  it('should not call store.create when lastName is empty', () => {
    component['formProvider'].form.controls.firstName.setValue('Anna');
    component['formProvider'].form.controls.lastName.setValue('');
    component['submit']();
    expect(store.create).not.toHaveBeenCalled();
  });

  it('should call store.create with the CustomerWrite built by formProvider', () => {
    component['formProvider'].form.controls.firstName.setValue('Anna');
    component['formProvider'].form.controls.lastName.setValue('Ivanova');
    component['submit']();
    expect(store.create).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '+79001234567', firstName: 'Anna', lastName: 'Ivanova' }),
    );
  });

  it('should emit customerCreated with the customer returned by the store', () => {
    component['formProvider'].form.controls.firstName.setValue('Anna');
    component['formProvider'].form.controls.lastName.setValue('Ivanova');
    component['submit']();
    expect(emitted.length).toBe(1);
    expect(emitted[0]).toEqual(CREATED_CUSTOMER);
  });

  it('should not show a snackbar on success', () => {
    component['formProvider'].form.controls.firstName.setValue('Anna');
    component['formProvider'].form.controls.lastName.setValue('Ivanova');
    component['submit']();
    expect(snackBar.open).not.toHaveBeenCalled();
  });
});
