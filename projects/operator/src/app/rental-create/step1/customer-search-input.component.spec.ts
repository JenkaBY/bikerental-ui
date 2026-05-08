import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi } from 'vitest';
import type { Customer } from '@bikerental/shared';
import { CustomerFormProvider, CustomerListStore, CustomerStore } from '@bikerental/shared';
import { CustomerSearchInputComponent } from './customer-search-input.component';

const MOCK_CUSTOMER: Customer = {
  id: '1',
  phone: '+79001111111',
  firstName: 'Anna',
  lastName: 'Ivanova',
};

function makeStore(customers: Customer[] = []) {
  return {
    search: vi.fn(),
    customers: signal(customers),
    loading: signal(false),
    searchQuery: signal<string | null>(null),
  };
}

describe('CustomerSearchInputComponent', () => {
  let fixture: ComponentFixture<CustomerSearchInputComponent>;
  let component: CustomerSearchInputComponent;
  let store: ReturnType<typeof makeStore>;

  async function setup(storeOverride = makeStore()) {
    store = storeOverride;

    await TestBed.configureTestingModule({
      imports: [CustomerSearchInputComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
        { provide: CustomerStore, useValue: { create: vi.fn(), saving: signal(false) } },
        CustomerFormProvider,
      ],
    })
      .overrideComponent(CustomerSearchInputComponent, {
        set: {
          providers: [{ provide: CustomerListStore, useValue: store }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CustomerSearchInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  it('should render the phone input', async () => {
    await setup();
    expect(fixture.nativeElement.querySelector('input[type="tel"]')).toBeTruthy();
  });

  it('should call search() when the phone control value changes', async () => {
    await setup();
    component['phoneControl'].setValue('1234');
    expect(store.search).toHaveBeenCalledWith('1234');
  });

  it('should expose searchResults directly from customerListStore.customers', async () => {
    await setup(makeStore([MOCK_CUSTOMER]));
    expect(component['searchResults']()).toEqual([MOCK_CUSTOMER]);
  });

  it('should show the create option when results are empty and 4+ chars typed', async () => {
    await setup(makeStore([]));
    component['phoneControl'].setValue('1234');
    fixture.detectChanges();
    expect(component['showCreateOption']()).toBe(true);
  });

  it('should not show the create option when results exist', async () => {
    await setup(makeStore([MOCK_CUSTOMER]));
    component['phoneControl'].setValue('1234');
    fixture.detectChanges();
    expect(component['showCreateOption']()).toBe(false);
  });

  it('should not show the create option when input is shorter than 4 chars', async () => {
    await setup(makeStore([]));
    component['phoneControl'].setValue('123');
    fixture.detectChanges();
    expect(component['showCreateOption']()).toBe(false);
  });

  it('should emit customerSelected when a customer option is selected', async () => {
    await setup(makeStore([MOCK_CUSTOMER]));
    const emitted: Customer[] = [];
    component.customerSelected.subscribe((c) => emitted.push(c));
    const mockEvent = { option: { value: MOCK_CUSTOMER } } as never;
    component['onOptionSelected'](mockEvent);
    expect(emitted).toEqual([MOCK_CUSTOMER]);
  });

  it('should set showCreateForm to true when CREATE_SENTINEL option is selected', async () => {
    await setup();
    const mockEvent = { option: { value: '__create__' } } as never;
    component['onOptionSelected'](mockEvent);
    expect(component['showCreateForm']()).toBe(true);
  });

  it('should pre-populate the phone control from initialPhone input', async () => {
    await setup();
    fixture.componentRef.setInput('initialPhone', '+79009876543');
    fixture.componentInstance.ngOnInit();
    expect(component['phoneControl'].value).toBe('+79009876543');
  });
});
