import { Component, Input, output, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import type { Customer } from '@bikerental/shared';
import { RentalStore } from '@bikerental/shared';
import { vi } from 'vitest';
import { RentalStep1Component } from './rental-step1.component';

const EXISTING_CUSTOMER: Customer = {
  id: 'cust-1',
  phone: '+79001234567',
  firstName: 'Anna',
  lastName: 'Ivanova',
};

// Stub CustomerSearchInputComponent so we can trigger its output programmatically
// without needing the full autocomplete DOM.
@Component({
  selector: 'app-customer-search-input',
  standalone: true,
  template: '',
})
class CustomerSearchInputStub {
  @Input() initialPhone?: string;
  readonly customerSelected = output<Customer>();
}

function makeStore(customer: Customer | null = null) {
  return {
    customer: signal(customer),
    setCustomer: vi.fn(),
  };
}

describe('RentalStep1Component', () => {
  let fixture: ComponentFixture<RentalStep1Component>;
  let component: RentalStep1Component;
  let store: ReturnType<typeof makeStore>;

  async function setup(customer: Customer | null = null) {
    store = makeStore(customer);

    await TestBed.configureTestingModule({
      imports: [RentalStep1Component],
      providers: [provideAnimationsAsync(), { provide: RentalStore, useValue: store }],
    })
      .overrideComponent(RentalStep1Component, {
        set: { imports: [CustomerSearchInputStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RentalStep1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  it('should derive initialPhone as empty string when no customer in store', async () => {
    await setup(null);
    expect(component['initialPhone']()).toBe('');
  });

  it('should derive initialPhone from store customer phone when customer is set', async () => {
    await setup(EXISTING_CUSTOMER);
    expect(component['initialPhone']()).toBe('+79001234567');
  });

  it('should call store.setCustomer with the selected customer', async () => {
    await setup();
    component['onCustomerSelected'](EXISTING_CUSTOMER);
    expect(store.setCustomer).toHaveBeenCalledWith(EXISTING_CUSTOMER);
  });

  it('should emit customerSelected output after onCustomerSelected is called', async () => {
    await setup();
    let emitted = false;
    component.customerSelected.subscribe(() => (emitted = true));
    component['onCustomerSelected'](EXISTING_CUSTOMER);
    expect(emitted).toBe(true);
  });
});
