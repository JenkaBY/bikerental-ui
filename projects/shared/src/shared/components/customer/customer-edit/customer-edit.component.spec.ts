import { TestBed } from '@angular/core/testing';
import { CustomerEditComponent } from '@bikerental/shared';
import { provideNativeDateAdapter } from '@angular/material/core';
import type { Customer, CustomerWrite } from '@ui-models';

describe('CustomerEditComponent', () => {
  it('renders initial customer values and emits saveCustomer on submit', async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerEditComponent],
      providers: [provideNativeDateAdapter()],
    }).compileComponents();

    const fixture = TestBed.createComponent(CustomerEditComponent);
    const component = fixture.componentInstance;
    const el = fixture.nativeElement as HTMLElement;

    const customer: Customer = {
      id: 'c1',
      phone: '+375291234567',
      firstName: 'Ivan',
      lastName: 'Ivanov',
      email: 'ivan@example.com',
    };

    let saved: CustomerWrite | undefined;
    component.saveCustomer.subscribe((payload) => (saved = payload));

    fixture.componentRef.setInput('customer', customer);
    fixture.componentRef.setInput('saving', false);
    fixture.detectChanges();

    // check initial values are rendered in inputs
    const phoneInput = el.querySelector('input[formcontrolname="phone"]') as HTMLInputElement;
    const firstNameInput = el.querySelector(
      'input[formcontrolname="firstName"]',
    ) as HTMLInputElement;
    const lastNameInput = el.querySelector('input[formcontrolname="lastName"]') as HTMLInputElement;
    const emailInput = el.querySelector('input[formcontrolname="email"]') as HTMLInputElement;

    expect(phoneInput.value).toContain('+375291234567');
    expect(firstNameInput.value).toContain('Ivan');
    expect(lastNameInput.value).toContain('Ivanov');
    expect(emailInput.value).toContain('ivan@example.com');

    // submit the form using the shared save button
    const saveBtn = el.querySelector('app-form-save-button button') as HTMLButtonElement;
    expect(saveBtn).toBeTruthy();
    saveBtn.click();
    fixture.detectChanges();

    expect(saved).toBeTruthy();
    expect(saved?.phone).toBe('+375291234567');
    expect(saved?.firstName).toBe('Ivan');
    expect(saved?.lastName).toBe('Ivanov');
  });

  it('disables submit when form invalid', async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerEditComponent],
      providers: [provideNativeDateAdapter()],
    }).compileComponents();

    const fixture = TestBed.createComponent(CustomerEditComponent);
    const el = fixture.nativeElement as HTMLElement;

    const invalidCustomer = {
      id: 'c2',
      phone: '',
      firstName: '',
      lastName: '',
    } as Customer;

    fixture.componentRef.setInput('customer', invalidCustomer);
    fixture.componentRef.setInput('saving', false);
    fixture.detectChanges();

    const saveBtn = el.querySelector('app-form-save-button button') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
  });
});
