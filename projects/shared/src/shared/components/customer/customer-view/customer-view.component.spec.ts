import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomerViewComponent } from '@bikerental/shared';
import { type Customer } from '@ui-models';

const baseCustomer: Customer = {
  id: 'c1',
  phone: '+375291234567',
  firstName: 'Ivan',
  lastName: 'Ivanov',
};

describe('CustomerViewComponent', () => {
  let fixture: ComponentFixture<CustomerViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerViewComponent);
    fixture.componentRef.setInput('customer', baseCustomer);
    fixture.detectChanges();
  });

  it('renders phone, firstName and lastName', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain(baseCustomer.phone);
    expect(text).toContain(baseCustomer.firstName);
    expect(text).toContain(baseCustomer.lastName);
  });

  it('does not render optional fields when absent', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).not.toContain('Email');
    expect(text).not.toContain('birth');
    expect(text).not.toContain('Notes');
  });

  it('renders email when provided', () => {
    fixture.componentRef.setInput('customer', { ...baseCustomer, email: 'ivan@example.com' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('ivan@example.com');
  });

  it('renders notes when provided', () => {
    fixture.componentRef.setInput('customer', { ...baseCustomer, notes: 'VIP customer' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('VIP customer');
  });

  it('emits edit event when the edit button is clicked', () => {
    const emitSpy = vi.spyOn(fixture.componentInstance.edit, 'emit');

    fixture.debugElement.query(By.css('button')).triggerEventHandler('click', null);

    expect(emitSpy).toHaveBeenCalled();
  });
});
