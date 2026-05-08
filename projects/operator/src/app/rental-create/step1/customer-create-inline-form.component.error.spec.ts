import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatSnackBar } from '@angular/material/snack-bar';
import { throwError } from 'rxjs';
import { vi } from 'vitest';
import type { Customer } from '@bikerental/shared';
import { CustomerFormProvider, CustomerStore, Labels } from '@bikerental/shared';
import { CustomerCreateInlineFormComponent } from './customer-create-inline-form.component';

function makeFailingStore() {
  return {
    create: vi.fn().mockReturnValue(throwError(() => new Error('Server error'))),
    saving: signal(false),
  };
}

describe('CustomerCreateInlineFormComponent — error handling', () => {
  let fixture: ComponentFixture<CustomerCreateInlineFormComponent>;
  let component: CustomerCreateInlineFormComponent;
  let store: ReturnType<typeof makeFailingStore>;
  let snackBar: { open: ReturnType<typeof vi.fn> };
  let emitted: Customer[];

  beforeEach(async () => {
    store = makeFailingStore();
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

  it('should show a snackbar with CustomerCreateError when store.create fails', () => {
    component['formProvider'].form.controls.firstName.setValue('Anna');
    component['formProvider'].form.controls.lastName.setValue('Ivanova');
    component['submit']();
    expect(snackBar.open).toHaveBeenCalledWith(Labels.CustomerCreateError, Labels.Close, {
      duration: 4000,
    });
  });

  it('should not emit customerCreated when store.create fails', () => {
    component['formProvider'].form.controls.firstName.setValue('Anna');
    component['formProvider'].form.controls.lastName.setValue('Ivanova');
    component['submit']();
    expect(emitted.length).toBe(0);
  });

  it('should have saving false after store.create fails', () => {
    component['formProvider'].form.controls.firstName.setValue('Anna');
    component['formProvider'].form.controls.lastName.setValue('Ivanova');
    component['submit']();
    expect(store.saving()).toBe(false);
  });
});
