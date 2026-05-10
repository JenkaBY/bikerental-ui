import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, Router } from '@angular/router';
import { throwError } from 'rxjs';
import { vi } from 'vitest';
import type { Customer, EquipmentSearchItem, Money, RentalCostEstimate } from '@bikerental/shared';
import { RentalStore } from '@bikerental/shared';
import { RentalStep3Component } from './rental-step3.component';

const CUSTOMER: Customer = {
  id: 'c1',
  phone: '+79001234567',
  firstName: 'Anna',
  lastName: 'Smith',
};

const COST_ESTIMATE: RentalCostEstimate = {
  subtotal: { amount: 180, currency: 'BYN' },
  totalCost: { amount: 180, currency: 'BYN' },
  specialPricingApplied: false,
  equipmentBreakdowns: [],
};

function makeFailingStore() {
  return {
    customer: signal<Customer | null>(CUSTOMER),
    durationMinutes: signal(60),
    equipmentItems: signal<EquipmentSearchItem[]>([]),
    costEstimate: signal<RentalCostEstimate | null>(COST_ESTIMATE),
    specialPriceEnabled: signal(false),
    projectedBalance: signal<Money | null>({ amount: 320, currency: 'BYN' }),
    isProjectedBalanceNegative: signal(false),
    isBalanceSufficient: signal(true),
    isActivating: signal(false),
    activateRental: vi.fn().mockReturnValue(throwError(() => new Error('API error'))),
    reset: vi.fn(),
    refreshCustomerBalance: vi.fn(),
  };
}

describe('RentalStep3Component error handling', () => {
  let fixture: ComponentFixture<RentalStep3Component>;
  let component: RentalStep3Component;
  let store: ReturnType<typeof makeFailingStore>;
  let snackBar: { open: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    store = makeFailingStore();
    snackBar = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RentalStep3Component],
      providers: [
        provideAnimationsAsync(),
        provideRouter([]),
        { provide: MatSnackBar, useValue: snackBar },
      ],
    })
      .overrideComponent(RentalStep3Component, {
        set: { providers: [{ provide: RentalStore, useValue: store }] },
      })
      .compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(RentalStep3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should show RentalStartError snackbar when activation fails', () => {
    component['onActivateRequested']();
    expect(snackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('Failed to start rental'),
      expect.any(String),
      expect.objectContaining({ duration: 4000 }),
    );
  });

  it('should NOT call store.reset() when activation fails', () => {
    component['onActivateRequested']();
    expect(store.reset).not.toHaveBeenCalled();
  });

  it('should NOT navigate when activation fails', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component['onActivateRequested']();
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
