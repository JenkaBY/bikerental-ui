import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { RentalStore } from '@bikerental/shared';
import { vi } from 'vitest';
import { RentalPricingSectionComponent } from './rental-pricing-section.component';

function makeStore(specialEnabled = false) {
  return {
    specialPriceEnabled: signal(specialEnabled),
    discountPercent: signal<number | null>(null),
    specialPrice: signal<number | null>(null),
    setSpecialPriceEnabled: vi.fn(),
    setDiscountPercent: vi.fn(),
    setSpecialPrice: vi.fn(),
  };
}

describe('RentalPricingSectionComponent', () => {
  let fixture: ComponentFixture<RentalPricingSectionComponent>;

  async function setup(specialEnabled = false) {
    const store = makeStore(specialEnabled);

    await TestBed.configureTestingModule({
      imports: [RentalPricingSectionComponent],
      providers: [provideAnimationsAsync()],
    })
      .overrideComponent(RentalPricingSectionComponent, {
        set: { providers: [{ provide: RentalStore, useValue: store }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RentalPricingSectionComponent);
    fixture.detectChanges();
    return store;
  }

  it('should render discount input when special price is disabled', async () => {
    await setup(false);

    expect(fixture.nativeElement.querySelector('app-discount-input')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-special-price-input')).toBeNull();
  });

  it('should render special price input when special price is enabled', async () => {
    await setup(true);

    expect(fixture.nativeElement.querySelector('app-special-price-input')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-discount-input')).toBeNull();
  });

  it('should call store setter when special price mode is toggled', async () => {
    const store = await setup(false);

    fixture.debugElement
      .query(By.css('mat-slide-toggle'))
      .triggerEventHandler('change', { checked: true });

    expect(store.setSpecialPriceEnabled).toHaveBeenCalledWith(true);
  });
});
