import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { CustomerEditComponent } from '@bikerental/shared';
import { provideNativeDateAdapter } from '@angular/material/core';
import type { Customer, CustomerWrite } from '@ui-models';

@Component({
  standalone: true,
  imports: [CustomerEditComponent],
  template: `
    <app-customer-edit
      [customer]="customer"
      [saving]="saving"
      (saveCustomer)="onSave($event)"
      (cancelEdit)="onCancel()"
    ></app-customer-edit>
  `,
})
class HostComponent {
  customer: Customer = {
    id: 'c1',
    phone: '+375291234567',
    firstName: 'Ivan',
    lastName: 'Ivanov',
    email: 'ivan@example.com',
  };
  saving = false;
  saved?: CustomerWrite;
  cancelled = false;

  onSave(payload: CustomerWrite) {
    this.saved = payload;
  }

  onCancel() {
    this.cancelled = true;
  }
}

describe('CustomerEditComponent', () => {
  it('renders initial customer values and emits saveCustomer on submit', async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideNativeDateAdapter()],
    }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const el = fixture.nativeElement as HTMLElement;

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

    // submit the form
    const submitBtn = el.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitBtn).toBeTruthy();
    submitBtn.click();
    fixture.detectChanges();

    expect(host.saved).toBeTruthy();
    expect(host.saved?.phone).toBe('+375291234567');
    expect(host.saved?.firstName).toBe('Ivan');
    expect(host.saved?.lastName).toBe('Ivanov');
  });

  it('disables submit when form invalid', async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideNativeDateAdapter()],
    }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    // make customer invalid (empty required fields)
    fixture.componentInstance.customer = {
      id: 'c2',
      phone: '',
      firstName: '',
      lastName: '',
    } as Customer;
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const submitBtn = el.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
  });
});
