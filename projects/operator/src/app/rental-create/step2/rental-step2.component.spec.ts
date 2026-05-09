import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Labels, RentalStore } from '@bikerental/shared';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { RentalStep2Component } from './rental-step2.component';

interface Money {
  amount: number;
  currency: string;
}

function makeStore() {
  return {
    customer: signal({ id: '1', phone: '+79001111111', firstName: 'Anna', lastName: 'Ivanova' }),
    save: vi.fn().mockReturnValue(of(undefined)),
    durationMinutes: signal(60),
    equipmentItems: signal([]),
    specialPriceEnabled: signal(false),
    discountPercent: signal<number | null>(null),
    specialPrice: signal<number | null>(null),
    projectedBalance: signal<Money | null>({ amount: 500, currency: 'BYN' }),
    isBalanceSufficient: signal(true),
    canProceedFromStep2: signal(true),
    isSaving: signal(false),
    costEstimate: signal<Money | null>({ amount: 100, currency: 'BYN' }),
    setDurationMinutes: vi.fn(),
    addEquipmentItem: vi.fn(),
    removeEquipmentItem: vi.fn(),
    setDiscountPercent: vi.fn(),
    setSpecialPriceEnabled: vi.fn(),
    setSpecialPrice: vi.fn(),
    refreshCustomerBalance: vi.fn(),
  };
}

describe('RentalStep2Component', () => {
  let fixture: ComponentFixture<RentalStep2Component>;
  let component: RentalStep2Component;
  let store: ReturnType<typeof makeStore>;
  let snackBar: { open: ReturnType<typeof vi.fn> };

  async function setup() {
    store = makeStore();
    snackBar = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RentalStep2Component],
      providers: [
        provideAnimationsAsync(),
        { provide: MatDialog, useValue: { open: vi.fn() } },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    })
      .overrideComponent(RentalStep2Component, {
        set: { providers: [{ provide: RentalStore, useValue: store }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RentalStep2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  it('onSaveDraft should call store.save() and show snackbar on success', async () => {
    await setup();

    component['onSaveDraft']();

    expect(store.save).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith(Labels.DraftSaved, Labels.Close, { duration: 3000 });
  });

  it('onNext should call store.save() and emit stepAdvanced on success', async () => {
    await setup();
    const advanced: void[] = [];
    component.stepAdvanced.subscribe(() => advanced.push());

    component['onNext']();

    expect(store.save).toHaveBeenCalled();
    expect(advanced.length).toBe(1);
  });
});
