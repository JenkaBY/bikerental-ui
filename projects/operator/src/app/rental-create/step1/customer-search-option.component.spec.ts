import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Customer } from '@bikerental/shared';
import { CustomerSearchOptionComponent } from './customer-search-option.component';

const CUSTOMER_WITH_NAME: Customer = {
  id: '1',
  phone: '+79001234567',
  firstName: 'Anna',
  lastName: 'Ivanova',
};

describe('CustomerSearchOptionComponent', () => {
  let fixture: ComponentFixture<CustomerSearchOptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerSearchOptionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerSearchOptionComponent);
    fixture.componentRef.setInput('customer', CUSTOMER_WITH_NAME);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display the phone number', () => {
    expect(fixture.nativeElement.textContent).toContain('+79001234567');
  });

  it('should display first name and last name', () => {
    expect(fixture.nativeElement.textContent).toContain('Anna');
    expect(fixture.nativeElement.textContent).toContain('Ivanova');
  });

  it('should always render two spans', () => {
    const spans = fixture.nativeElement.querySelectorAll('span');
    expect(spans.length).toBe(2);
  });
});
