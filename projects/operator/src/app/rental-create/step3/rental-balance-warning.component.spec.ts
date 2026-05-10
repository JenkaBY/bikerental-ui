import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import type { Money } from '@bikerental/shared';
import { RentalStore } from '@bikerental/shared';
import { vi } from 'vitest';
import { RentalBalanceWarningComponent } from './rental-balance-warning.component';

function makeRentalStore(projectedBalance: Money | null, isSufficient: boolean) {
  return {
    projectedBalance: signal(projectedBalance),
    isBalanceSufficient: signal(isSufficient),
    balanceShortfall: signal(
      projectedBalance
        ? { amount: Math.abs(projectedBalance.amount), currency: projectedBalance.currency }
        : null,
    ),
    refreshCustomerBalance: vi.fn(),
  };
}

describe('RentalBalanceWarningComponent', () => {
  let fixture: ComponentFixture<RentalBalanceWarningComponent>;
  let component: RentalBalanceWarningComponent;

  async function setup(projectedBalance: Money | null, isSufficient: boolean) {
    const store = makeRentalStore(projectedBalance, isSufficient);

    await TestBed.configureTestingModule({
      imports: [RentalBalanceWarningComponent],
      providers: [provideAnimationsAsync()],
    })
      .overrideComponent(RentalBalanceWarningComponent, {
        set: { providers: [{ provide: RentalStore, useValue: store }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RentalBalanceWarningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should not render warning when balance is sufficient', async () => {
    await setup({ amount: 320, currency: 'BYN' }, true);
    const warning = fixture.nativeElement.querySelector('div');
    expect(warning).toBeNull();
  });

  it('should render warning when balance is insufficient', async () => {
    await setup({ amount: -50, currency: 'BYN' }, false);
    const warning = fixture.nativeElement.querySelector('div');
    expect(warning).not.toBeNull();
  });

  it('should display the shortfall amount', async () => {
    await setup({ amount: -50, currency: 'BYN' }, false);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('50');
    expect(text).toContain('BYN');
  });

  it('should emit topUpRequested when "Top Up Balance" button is clicked', async () => {
    await setup({ amount: -50, currency: 'BYN' }, false);
    let emitted = false;
    component.topUpRequested.subscribe(() => (emitted = true));
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(emitted).toBe(true);
  });
});
