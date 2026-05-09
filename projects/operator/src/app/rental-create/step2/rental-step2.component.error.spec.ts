import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RentalStore } from '@bikerental/shared';
import { throwError } from 'rxjs';
import { vi } from 'vitest';
import { RentalStep2Component } from './rental-step2.component';

interface Money {
  amount: number;
  currency: string;
}

function makeFailingStore() {
  return {
    customer: signal(null),
    save: vi.fn().mockReturnValue(throwError(() => new Error('Save failed'))),
    durationMinutes: signal(60),
    equipmentItems: signal([]),
    specialPriceEnabled: signal(false),
    discountPercent: signal<number | null>(null),
    specialPrice: signal<number | null>(null),
    projectedBalance: signal<Money | null>(null),
    isBalanceSufficient: signal(false),
    canProceedFromStep2: signal(false),
    isSaving: signal(false),
    costEstimate: signal<Money | null>(null),
    setDurationMinutes: vi.fn(),
    addEquipmentItem: vi.fn(),
    removeEquipmentItem: vi.fn(),
    setDiscountPercent: vi.fn(),
    setSpecialPriceEnabled: vi.fn(),
    setSpecialPrice: vi.fn(),
    refreshCustomerBalance: vi.fn(),
  };
}

describe('RentalStep2Component error handling', () => {
  let fixture: ComponentFixture<RentalStep2Component>;
  let component: RentalStep2Component;

  async function setup() {
    const store = makeFailingStore();

    await TestBed.configureTestingModule({
      imports: [RentalStep2Component],
      providers: [
        provideAnimationsAsync(),
        { provide: MatDialog, useValue: { open: vi.fn() } },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
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

  it('onNext should NOT emit stepAdvanced when save fails', async () => {
    await setup();
    const advanced: void[] = [];
    component.stepAdvanced.subscribe(() => advanced.push());

    component['onNext']();

    expect(advanced.length).toBe(0);
  });

  it('onSaveDraft should NOT throw when save fails', async () => {
    await setup();

    expect(() => component['onSaveDraft']()).not.toThrow();
  });
});
