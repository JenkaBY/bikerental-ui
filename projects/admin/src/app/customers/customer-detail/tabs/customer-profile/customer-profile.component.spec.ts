import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomerProfileComponent } from './customer-profile.component';
import { CustomerLayoutStore } from '../../customer-layout.store';
import { CustomerStore, Labels } from '@bikerental/shared';

const baseCustomer = {
  id: 'c1',
  phone: '+375291234567',
  firstName: 'Ivan',
  lastName: 'Ivanov',
};

const makeCustomerStore = () => ({
  saving: signal(false),
  update: vi.fn().mockReturnValue(of({})),
});

describe('CustomerProfileComponent', () => {
  let fixture: ComponentFixture<CustomerProfileComponent>;
  let component: CustomerProfileComponent;
  let customerStore: ReturnType<typeof makeCustomerStore>;
  let snackBar: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    customerStore = makeCustomerStore();
    snackBar = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [CustomerProfileComponent],
      providers: [
        provideNativeDateAdapter(),
        {
          provide: CustomerLayoutStore,
          useValue: { customer: signal(baseCustomer) },
        },
        { provide: CustomerStore, useValue: customerStore },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the view component with customer phone in view mode', () => {
    expect(fixture.nativeElement.textContent).toContain(baseCustomer.phone);
    expect(fixture.nativeElement.querySelector('app-customer-view')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-customer-edit')).toBeFalsy();
  });

  it('switches to edit mode when edit event is emitted', () => {
    fixture.nativeElement.querySelector('app-customer-view button').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-customer-edit')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-customer-view')).toBeFalsy();
  });
  it('calls customerStore.update with the emitted CustomerWrite on save', async () => {
    component['editMode'].set(true);
    fixture.detectChanges();

    component['save']({ phone: '+375', firstName: 'Updated', lastName: 'Ivanov' });
    await Promise.resolve();

    expect(customerStore.update).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ phone: '+375', firstName: 'Updated' }),
    );
  });

  it('shows success snackbar and returns to view mode on save success', async () => {
    component['editMode'].set(true);
    component['save']({ phone: '+375', firstName: 'Updated', lastName: 'Ivanov' });
    await Promise.resolve();
    fixture.detectChanges();

    expect(snackBar.open).toHaveBeenCalledWith(Labels.CustomerSaveSuccess, undefined, {
      duration: 3000,
    });
    expect(component['editMode']()).toBe(false);
  });

  it('shows error snackbar and stays in edit mode on save failure', async () => {
    customerStore.update.mockReturnValue(throwError(() => new Error('fail')));
    component['editMode'].set(true);
    component['save']({ phone: '+375', firstName: 'Ivan', lastName: 'Ivanov' });
    await Promise.resolve();
    fixture.detectChanges();

    expect(snackBar.open).toHaveBeenCalledWith(Labels.CustomerSaveError, undefined, {
      duration: 3000,
    });
    expect(component['editMode']()).toBe(true);
  });

  it('returns to view mode on cancel', () => {
    component['editMode'].set(true);
    fixture.detectChanges();

    fixture.nativeElement
      .querySelector('app-customer-edit')
      .dispatchEvent(new CustomEvent('cancel', { bubbles: true }));
    fixture.detectChanges();

    expect(component['editMode']()).toBe(false);
  });
});
